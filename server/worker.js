/* =====================================================================
   Level Up — сервер лиги друзей (Cloudflare Worker + база D1).

   Хранит только сводки игроков (имя, уровень, XP за неделю, серия, клейма)
   и ленту событий лиги. Заметки и подробности дней остаются на телефонах.

   Авторизация: при создании/вступлении игрок получает id и секретный токен.
   Токен хранится только на телефоне, в базе — его SHA-256.
   ===================================================================== */

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization',
  'access-control-max-age': '86400',
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS } });
const fail = (error, status = 400) => json({ error }, status);

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // без похожих символов 0/O, 1/I
const randCode = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((x) => ALPHA[x % ALPHA.length]).join('');
const randToken = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c]));
const clip = (s, n) => String(s ?? '').trim().slice(0, n);
const now = () => Date.now();
const MAX_MEMBERS = 50;
const MAX_ITEMS = 150;
const REACTIONS = ['respect', 'lol'];
const PROPOSAL_TTL = 3 * 864e5;      // голосование длится 3 суток, потом решение по текущим голосам
const MAX_PENDING = 5;               // открытых доносов/похвал от одного автора

async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readBody(req, max = 20000) {
  const text = await req.text();
  if (text.length > max) throw new Error('Слишком большой запрос');
  try { return text ? JSON.parse(text) : {}; } catch (e) { throw new Error('Неверный JSON'); }
}

async function auth(req, env) {
  const m = (req.headers.get('authorization') || '').match(/^Bearer ([\w-]+)\.([\w-]+)$/);
  if (!m) return null;
  const me = await env.DB.prepare('SELECT * FROM members WHERE id = ?').bind(m[1]).first();
  if (!me || me.token_hash !== (await sha256(m[2]))) return null;
  return me;
}

function profileJSON(p) {
  const s = JSON.stringify(p && typeof p === 'object' && !Array.isArray(p) ? p : {});
  if (s.length > 6000) throw new Error('Профиль слишком большой');
  return s;
}

async function addMember(env, league, member) {
  const id = crypto.randomUUID();
  const token = randToken();
  const t = now();
  await env.DB.prepare('INSERT INTO members (id, token_hash, league, name, avatar, profile, updated_at, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, await sha256(token), league, clip(member && member.name, 24) || 'Герой', clip(member && member.avatar, 24), profileJSON(member && member.profile), t, t)
    .run();
  return { memberId: id, token };
}

// max: длина текста. События от телефонов — до 160 символов, события суда (с приговором) — до 420.
async function addEvents(env, league, memberId, events, max = 160) {
  const list = (Array.isArray(events) ? events : []).slice(0, 15)
    .map((e) => ({ kind: clip(e && e.kind, 16) || 'info', text: clip(e && e.text, max), icon: clip(e && e.icon, 24) }))
    .filter((e) => e.text);
  if (!list.length) return;
  const t = now();
  await env.DB.batch(list.map((e) => env.DB.prepare('INSERT INTO events (league, member, kind, text, icon, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(league, memberId, e.kind, e.text, e.icon, t)));
}


/* ---------- Push-уведомления (Web Push: VAPID + шифрование aes128gcm, RFC 8291/8292) ---------- */

const APP_URL = 'https://skjat.github.io/Game-evolution/';
const te = new TextEncoder();
const b64u = {
  enc: (buf) => { const a = new Uint8Array(buf); let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); },
  dec: (str) => { let s = String(str).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); },
};
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };

// Ключи VAPID сервер создаёт сам при первом обращении и хранит в базе — секреты настраивать не нужно.
async function vapidKeys(env) {
  const get = () => env.DB.prepare("SELECT v FROM config WHERE k = 'vapid'").first();
  let row = await get();
  if (!row) {
    const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const v = { priv: await crypto.subtle.exportKey('jwk', kp.privateKey), pub: b64u.enc(await crypto.subtle.exportKey('raw', kp.publicKey)) };
    await env.DB.prepare("INSERT OR IGNORE INTO config (k, v) VALUES ('vapid', ?)").bind(JSON.stringify(v)).run();
    row = await get();
  }
  return JSON.parse(row.v);
}

async function vapidAuth(endpoint, keys) {
  const head = b64u.enc(te.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u.enc(te.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: APP_URL })));
  const key = await crypto.subtle.importKey('jwk', { ...keys.priv, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, te.encode(head + '.' + body));
  return `vapid t=${head}.${body}.${b64u.enc(sig)}, k=${keys.pub}`;
}

async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}

// Шифрование содержимого push по RFC 8291 (aes128gcm). test: фиксированные ключ и соль для проверки по примеру из RFC.
export async function encryptPush(sub, payload, test = null) {
  const uaPub = b64u.dec(sub.p256dh), authSecret = b64u.dec(sub.auth);
  let asPriv, asPub;
  if (test) {
    asPub = b64u.dec(test.asPublic);
    asPriv = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', d: test.asPrivate, x: b64u.enc(asPub.slice(1, 33)), y: b64u.enc(asPub.slice(33, 65)) }, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  } else {
    const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    asPriv = kp.privateKey; asPub = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));
  }
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asPriv, 256));
  const ikm = await hkdf(authSecret, ecdh, concat(te.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = test ? b64u.dec(test.salt) : crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, concat(te.encode(payload), new Uint8Array([2]))));
  const header = new Uint8Array(21 + asPub.length);
  header.set(salt, 0); new DataView(header.buffer).setUint32(16, 4096); header[20] = asPub.length; header.set(asPub, 21);
  return concat(header, ct);
}

async function sendPush(env, sub, msg) {
  try {
    const keys = await vapidKeys(env);
    const res = await fetch(sub.endpoint, {
      method: 'POST',
      headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '43200', Urgency: 'normal', Authorization: await vapidAuth(sub.endpoint, keys) },
      body: await encryptPush(sub, JSON.stringify(msg)),
    });
    if (res.status === 404 || res.status === 410) await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(sub.endpoint).run();
    return res.status;
  } catch (e) { return 0; }
}
async function pushMembers(env, ids, msg, courtOnly = true) {
  if (!ids.length) return;
  const subs = (await env.DB.prepare(`SELECT * FROM push_subs WHERE member IN (${ids.map(() => '?').join(',')})${courtOnly ? ' AND court = 1' : ''}`).bind(...ids).all()).results;
  await Promise.all(subs.map((s) => sendPush(env, s, msg)));
}
const later = (ctx, p) => { if (ctx && ctx.waitUntil) ctx.waitUntil(p); else return p; };

// Вечернее напоминание: раз в 15 минут ищем тех, у кого по их местному времени наступил час напоминания.
async function remindTick(env) {
  const subs = (await env.DB.prepare("SELECT s.*, m.profile FROM push_subs s JOIN members m ON m.id = s.member WHERE s.remind != ''").all()).results;
  for (const s of subs) {
    const local = new Date(Date.now() - s.tz * 60000);
    const day = local.toISOString().slice(0, 10), hm = local.toISOString().slice(11, 16);
    if (hm < s.remind || s.last_remind === day) continue;
    const [h, m] = s.remind.split(':').map(Number);
    if (local.getUTCHours() * 60 + local.getUTCMinutes() - (h * 60 + m) > 180) continue;   // опоздали больше чем на 3 часа — пропускаем
    await env.DB.prepare('UPDATE push_subs SET last_remind = ? WHERE endpoint = ?').bind(day, s.endpoint).run();
    let p = {}; try { p = JSON.parse(s.profile || '{}'); } catch (e) { /* ignore */ }
    if (p.lastLog === day) continue;   // сегодня уже отчитался
    await sendPush(env, s, { title: 'Level Up', body: p.streak > 1 ? `Подведи итоги дня — не теряй серию в ${p.streak} дн.` : 'Подведи итоги дня — ядро ждёт заряда', url: '#day', tag: 'remind' });
  }
}

/* ---------- Суд лиги ---------- */

// Кто голосует: все, кроме того, о ком отчёт. Если в лиге только двое — решают оба.
async function voters(env, league, target) {
  const ids = (await env.DB.prepare('SELECT id FROM members WHERE league = ?').bind(league).all()).results.map((r) => r.id);
  const el = ids.filter((id) => id !== target);
  return { ids, el: el.length < 2 ? ids : el };
}

// Пересчитать статус открытого голосования. Возвращает обновлённую запись.
async function resolve(env, p) {
  if (p.status !== 'pending') return p;
  const { ids, el } = await voters(env, p.league, p.target);
  let status = 'pending';
  if (!ids.includes(p.target)) status = 'expired';
  else {
    const vs = (await env.DB.prepare('SELECT member, vote FROM votes WHERE proposal = ?').bind(p.id).all()).results.filter((v) => el.includes(v.member));
    const yes = vs.filter((v) => v.vote > 0).length, no = vs.filter((v) => v.vote < 0).length;
    const need = Math.floor(el.length / 2) + 1;
    if (yes >= need) status = 'approved';
    else if (no > el.length - need) status = 'rejected';
    // Время вышло: решаем по текущим голосам, при равенстве — в пользу того, о ком отчёт.
    else if (now() - p.created_at >= PROPOSAL_TTL) status = yes > no ? 'approved' : 'rejected';
  }
  if (status === 'pending') return p;
  await env.DB.prepare('UPDATE proposals SET status = ?, resolved_at = ? WHERE id = ? AND status = ?').bind(status, now(), p.id, 'pending').run();
  if (status === 'approved') {
    await addEvents(env, p.league, p.target, [{ kind: 'verdict', text: `по решению лиги (${p.kind === 'praise' ? 'похвала' : 'донос'}): ${p.summary}`, icon: p.kind === 'praise' ? 'medal' : 'balance' }], 420);
    await pushMembers(env, [p.target], { title: p.kind === 'praise' ? 'Лига утвердила похвалу' : 'Лига утвердила донос', body: p.summary, url: '#day', tag: 'verdict-' + p.id });
  } else if (status === 'rejected' && p.kind === 'complaint') {
    await addEvents(env, p.league, p.target, [{ kind: 'verdict', text: `оправдан судом лиги: ${p.summary}`, icon: 'balance' }], 420);
  }
  return { ...p, status, resolved_at: now() };
}

async function proposalsFor(env, me) {
  let list = (await env.DB.prepare(
    `SELECT p.*, a.name AS authorName, a.avatar AS authorAvatar, t.name AS targetName, t.avatar AS targetAvatar FROM proposals p
     LEFT JOIN members a ON a.id = p.author LEFT JOIN members t ON t.id = p.target
     WHERE p.league = ? AND (p.status = 'pending' OR p.created_at > ? OR (p.target = ? AND p.status = 'approved' AND p.applied = 0)
       OR (p.author = ? AND p.created_at > ?))
     ORDER BY p.created_at DESC LIMIT 60`,
  ).bind(me.league, now() - 14 * 864e5, me.id, me.id, now() - 60 * 864e5).all()).results;
  list = await Promise.all(list.map((p) => resolve(env, p)));
  if (!list.length) return [];
  const ids = list.map((p) => p.id);
  const vs = (await env.DB.prepare(`SELECT proposal, member, vote FROM votes WHERE proposal IN (${ids.map(() => '?').join(',')})`).bind(...ids).all()).results;
  const out = [];
  for (const p of list) {
    const { el } = await voters(env, me.league, p.target);
    const pv = vs.filter((v) => v.proposal === p.id && el.includes(v.member));
    const mine = vs.find((v) => v.proposal === p.id && v.member === me.id);
    out.push({
      id: p.id, author: p.author, authorName: p.authorName || 'бывший участник', authorAvatar: p.authorAvatar,
      target: p.target, targetName: p.targetName || 'бывший участник', targetAvatar: p.targetAvatar,
      day: p.day, kind: p.kind, text: p.text, summary: p.summary, data: JSON.parse(p.data || '{}'),
      status: p.status, applied: !!p.applied, created_at: p.created_at, resolved_at: p.resolved_at, deadline: p.created_at + PROPOSAL_TTL,
      yes: pv.filter((v) => v.vote > 0).length, no: pv.filter((v) => v.vote < 0).length,
      voters: el.length, need: Math.floor(el.length / 2) + 1, myVote: mine ? mine.vote : 0, canVote: el.includes(me.id),
      eligible: el, votes: pv.map((v) => ({ m: v.member, v: v.vote })),
    });
  }
  return out;
}

async function board(env, me) {
  // Сначала суд: закрытие голосований добавляет события в ленту.
  const proposals = await proposalsFor(env, me);
  const league = await env.DB.prepare('SELECT code, name, created_at FROM leagues WHERE code = ?').bind(me.league).first();
  const members = (await env.DB.prepare('SELECT id, name, avatar, profile, updated_at, joined_at FROM members WHERE league = ? ORDER BY joined_at')
    .bind(me.league).all()).results.map((m) => ({ ...m, profile: JSON.parse(m.profile || '{}') }));
  const feed = (await env.DB.prepare(
    'SELECT e.id, e.member, e.kind, e.text, e.icon, e.created_at, m.name, m.avatar FROM events e LEFT JOIN members m ON m.id = e.member WHERE e.league = ? ORDER BY e.id DESC LIMIT 60',
  ).bind(me.league).all()).results;
  if (feed.length) {
    const ids = feed.map((e) => e.id);
    const rows = (await env.DB.prepare(
      `SELECT event_id, kind, COUNT(*) AS n, SUM(member = ?) AS mine FROM reactions WHERE event_id IN (${ids.map(() => '?').join(',')}) GROUP BY event_id, kind`,
    ).bind(me.id, ...ids).all()).results;
    const byEvent = {};
    rows.forEach((r) => { (byEvent[r.event_id] = byEvent[r.event_id] || {})[r.kind] = { n: r.n, mine: !!r.mine }; });
    feed.forEach((e) => { e.reactions = byEvent[e.id] || {}; });
  }
  const items = (await env.DB.prepare(
    'SELECT i.id, i.author, i.kind, i.data, i.created_at, m.name AS authorName FROM items i LEFT JOIN members m ON m.id = i.author WHERE i.league = ? ORDER BY i.created_at',
  ).bind(me.league).all()).results.map((i) => ({ ...i, data: JSON.parse(i.data || '{}') }));
  // Основатель — самый давний участник (создатель лиги; если он ушёл — следующий по стажу).
  const owner = members.length ? members[0].id : null;
  const bk = await env.DB.prepare('SELECT updated_at FROM backups WHERE member = ?').bind(me.id).first();
  return { league, me: me.id, owner, members, feed, items, proposals, backupAt: bk ? bk.updated_at : 0, serverTime: now() };
}

async function route(req, env, ctx) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, '');
  const method = req.method;

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (path === '' || path === '/api/health') return json({ ok: true, service: 'levelup-league' });

  // Создать лигу
  if (path === '/api/league' && method === 'POST') {
    const body = await readBody(req);
    const name = clip(body.name, 40) || 'Лига героев';
    let code = '';
    for (let i = 0; i < 5 && !code; i++) {
      const c = randCode(4) + '-' + randCode(4);
      if (!(await env.DB.prepare('SELECT 1 FROM leagues WHERE code = ?').bind(c).first())) code = c;
    }
    if (!code) return fail('Не удалось создать код, попробуй ещё раз', 500);
    await env.DB.prepare('INSERT INTO leagues (code, name, created_at) VALUES (?, ?, ?)').bind(code, name, now()).run();
    const m = await addMember(env, code, body.member);
    await addEvents(env, code, m.memberId, [{ kind: 'join', text: `основал лигу «${name}»`, icon: 'crown' }]);
    return json({ code, name, ...m });
  }

  // Вступить по коду
  if (path === '/api/join' && method === 'POST') {
    const body = await readBody(req);
    const code = clip(body.code, 20).toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const league = await env.DB.prepare('SELECT code, name FROM leagues WHERE code = ?').bind(code).first();
    if (!league) return fail('Лига с таким кодом не найдена', 404);
    const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM members WHERE league = ?').bind(code).first();
    if (cnt.n >= MAX_MEMBERS) return fail('В лиге уже максимум участников', 409);
    const m = await addMember(env, code, body.member);
    await addEvents(env, code, m.memberId, [{ kind: 'join', text: 'вступил в лигу', icon: 'users' }]);
    return json({ code, name: league.name, ...m });
  }

  // Дальше — только для участников
  const me = await auth(req, env);
  if (!me) return fail('Нет доступа: войди в лигу заново', 401);

  if (path === '/api/board' && method === 'GET') return json(await board(env, me));

  // Отправить свою сводку и события, получить таблицу
  if (path === '/api/sync' && method === 'POST') {
    const body = await readBody(req);
    await env.DB.prepare('UPDATE members SET name = ?, avatar = ?, profile = ?, updated_at = ? WHERE id = ?')
      .bind(clip(body.name, 24) || me.name, clip(body.avatar, 24) || me.avatar, profileJSON(body.profile), now(), me.id).run();
    await addEvents(env, me.league, me.id, body.events);
    // Изредка чистим старую ленту (старше 90 дней).
    if (Math.random() < 0.05) await env.DB.prepare('DELETE FROM events WHERE created_at < ?').bind(now() - 90 * 864e5).run();
    return json(await board(env, me));
  }

  // Реакция на событие: повторное нажатие снимает её
  if (path === '/api/react' && method === 'POST') {
    const body = await readBody(req);
    const kind = REACTIONS.includes(body.kind) ? body.kind : null;
    const ev = await env.DB.prepare('SELECT id FROM events WHERE id = ? AND league = ?').bind(Number(body.eventId) || 0, me.league).first();
    if (!kind || !ev) return fail('Нет такого события');
    const had = await env.DB.prepare('SELECT 1 FROM reactions WHERE event_id = ? AND member = ? AND kind = ?').bind(ev.id, me.id, kind).first();
    if (had) await env.DB.prepare('DELETE FROM reactions WHERE event_id = ? AND member = ? AND kind = ?').bind(ev.id, me.id, kind).run();
    else await env.DB.prepare('INSERT INTO reactions (event_id, member, kind, created_at) VALUES (?, ?, ?, ?)').bind(ev.id, me.id, kind, now()).run();
    return json(await board(env, me));
  }

  // Поделиться своим достижением с лигой (или обновить своё)
  if (path === '/api/items' && method === 'POST') {
    const body = await readBody(req);
    const id = clip(body.id, 40);
    const kind = body.kind === 'counter' || body.kind === 'milestone' ? body.kind : null;
    if (!/^[\w-]{4,40}$/.test(id) || !kind) return fail('Неверное достижение');
    const d = body.data && typeof body.data === 'object' ? body.data : {};
    const data = {
      name: clip(d.name, 40), desc: clip(d.desc, 160), icon: clip(d.icon, 24), sphere: clip(d.sphere, 20),
      ...(kind === 'counter' ? {
        unit: clip(d.unit, 16) || 'раз',
        tiers: (Array.isArray(d.tiers) ? d.tiers : []).slice(0, 6)
          .map((t) => ({ goal: Number(t && t.goal) || 0, title: clip(t && t.title, 40) })).filter((t) => t.goal > 0),
      } : {}),
    };
    if (!data.name || (kind === 'counter' && !data.tiers.length)) return fail('У достижения нет названия или ступеней');
    const existing = await env.DB.prepare('SELECT author FROM items WHERE league = ? AND id = ?').bind(me.league, id).first();
    if (existing && existing.author !== me.id) return fail('Это достижение добавил другой участник', 409);
    if (!existing) {
      const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM items WHERE league = ?').bind(me.league).first();
      if (cnt.n >= MAX_ITEMS) return fail('В лиге уже слишком много общих достижений', 409);
    }
    await env.DB.prepare('INSERT OR REPLACE INTO items (id, league, author, kind, data, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, me.league, me.id, kind, JSON.stringify(data), now()).run();
    if (!existing) await addEvents(env, me.league, me.id, [{ kind: 'item', text: `добавил в лигу ${kind === 'counter' ? 'цепочку' : 'веху'} «${data.name}»`, icon: data.icon || 'star' }]);
    return json(await board(env, me));
  }

  // Убрать своё достижение из лиги
  if (path === '/api/items/remove' && method === 'POST') {
    const body = await readBody(req);
    await env.DB.prepare('DELETE FROM items WHERE league = ? AND id = ? AND author = ?').bind(me.league, clip(body.id, 40), me.id).run();
    return json(await board(env, me));
  }

  // Донос или похвала на другого участника — выносится на голосование лиги
  if (path === '/api/proposals' && method === 'POST') {
    const body = await readBody(req);
    const kind = body.kind === 'praise' ? 'praise' : body.kind === 'complaint' ? 'complaint' : null;
    const day = clip(body.day, 10);
    const target = await env.DB.prepare('SELECT id, name FROM members WHERE id = ? AND league = ?').bind(clip(body.target, 40), me.league).first();
    if (!kind || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return fail('Неверный отчёт');
    if (!target) return fail('Такого участника нет в лиге', 404);
    if (target.id === me.id) return fail('На себя доносить нельзя — для этого есть свой отчёт');
    const text = clip(body.text, 1500), summary = clip(body.summary, 300);
    if (!text || !summary) return fail('Пустой отчёт');
    const data = JSON.stringify(body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {});
    if (data.length > 8000) return fail('Отчёт слишком большой');
    const open = await env.DB.prepare("SELECT COUNT(*) AS n FROM proposals WHERE author = ? AND status = 'pending'").bind(me.id).first();
    if (open.n >= MAX_PENDING) return fail(`У тебя уже ${MAX_PENDING} открытых голосований — дождись решения`, 429);
    const id = crypto.randomUUID();
    const t = now();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO proposals (id, league, author, target, day, kind, text, summary, data, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, me.league, me.id, target.id, day, kind, text, summary, data, 'pending', t),
      env.DB.prepare('INSERT INTO votes (proposal, member, vote, created_at) VALUES (?, ?, 1, ?)').bind(id, me.id, t),
    ]);
    await addEvents(env, me.league, me.id, [{ kind: 'report', text: `${kind === 'praise' ? 'похвалил' : 'донёс'}: ${target.name} — ${summary}`, icon: kind === 'praise' ? 'medal' : 'skull' }], 420);
    const p = await env.DB.prepare('SELECT * FROM proposals WHERE id = ?').bind(id).first();
    const res = await resolve(env, p);
    if (res.status === 'pending') {
      const { el } = await voters(env, me.league, target.id);
      await pushMembers(env, el.filter((x) => x !== me.id), { title: `Суд лиги: ${kind === 'praise' ? 'похвала' : 'донос'}`, body: `${me.name} → ${target.name}: ${summary}`.slice(0, 180) + ' Нужен твой голос.', url: '#league', tag: 'court-' + id });
    }
    return json(await board(env, me));
  }

  // Голос: 1 — за, -1 — против, 0 — снять голос
  if (path === '/api/proposals/vote' && method === 'POST') {
    const body = await readBody(req);
    const p = await env.DB.prepare('SELECT * FROM proposals WHERE id = ? AND league = ?').bind(clip(body.id, 40), me.league).first();
    if (!p) return fail('Голосование не найдено', 404);
    const cur = await resolve(env, p);
    if (cur.status !== 'pending') return fail('Голосование уже закрыто', 409);
    const { el } = await voters(env, me.league, p.target);
    if (!el.includes(me.id)) return fail('Ты не голосуешь по отчёту о себе');
    const vote = Number(body.vote) > 0 ? 1 : Number(body.vote) < 0 ? -1 : 0;
    if (vote) await env.DB.prepare('INSERT OR REPLACE INTO votes (proposal, member, vote, created_at) VALUES (?, ?, ?, ?)').bind(p.id, me.id, vote, now()).run();
    else await env.DB.prepare('DELETE FROM votes WHERE proposal = ? AND member = ?').bind(p.id, me.id).run();
    await resolve(env, p);
    return json(await board(env, me));
  }

  // Автор отзывает свой донос, пока идёт голосование
  if (path === '/api/proposals/withdraw' && method === 'POST') {
    const body = await readBody(req);
    await env.DB.prepare("UPDATE proposals SET status = 'withdrawn', resolved_at = ? WHERE id = ? AND author = ? AND status = 'pending'").bind(now(), clip(body.id, 40), me.id).run();
    return json(await board(env, me));
  }

  // Телефон участника добавил утверждённый отчёт в его день
  if (path === '/api/proposals/applied' && method === 'POST') {
    const body = await readBody(req);
    await env.DB.prepare("UPDATE proposals SET applied = 1 WHERE id = ? AND target = ? AND status = 'approved'").bind(clip(body.id, 40), me.id).run();
    return json({ ok: true });
  }

  // Облачная копия: телефон присылает уже зашифрованные данные
  if (path === '/api/backup' && method === 'POST') {
    const body = await readBody(req, 2000000);
    const data = typeof body.data === 'string' ? body.data : '';
    if (!data || data.length > 1500000) return fail('Копия пустая или слишком большая');
    const t = now();
    await env.DB.prepare('INSERT OR REPLACE INTO backups (member, data, size, updated_at) VALUES (?, ?, ?, ?)').bind(me.id, data, data.length, t).run();
    return json({ ok: true, updated_at: t });
  }
  if (path === '/api/backup' && method === 'GET') {
    const row = await env.DB.prepare('SELECT data, updated_at FROM backups WHERE member = ?').bind(me.id).first();
    if (!row) return fail('Облачной копии пока нет', 404);
    return json(row);
  }

  // Push: ключ сервера, подписка и отписка
  if (path === '/api/push/key' && method === 'GET') return json({ key: (await vapidKeys(env)).pub });
  if (path === '/api/push/subscribe' && method === 'POST') {
    const body = await readBody(req);
    const sub = body.sub || {};
    const endpoint = clip(sub.endpoint, 1000), p256dh = clip(sub.keys && sub.keys.p256dh, 200), auth = clip(sub.keys && sub.keys.auth, 100);
    if (!/^https:\/\//.test(endpoint) || !p256dh || !auth) return fail('Неверная подписка');
    const remind = /^\d{2}:\d{2}$/.test(body.remind || '') ? body.remind : '';
    const tz = Math.max(-840, Math.min(840, Math.round(Number(body.tz) || 0)));
    const old = await env.DB.prepare('SELECT last_remind FROM push_subs WHERE endpoint = ?').bind(endpoint).first();
    await env.DB.prepare('INSERT OR REPLACE INTO push_subs (endpoint, member, p256dh, auth, remind, tz, court, last_remind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(endpoint, me.id, p256dh, auth, remind, tz, body.court === false ? 0 : 1, old ? old.last_remind : '', now()).run();
    return json({ ok: true });
  }
  if (path === '/api/push/unsubscribe' && method === 'POST') {
    const body = await readBody(req);
    await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ? AND member = ?').bind(clip(body.endpoint, 1000), me.id).run();
    return json({ ok: true });
  }
  if (path === '/api/push/test' && method === 'POST') {
    await pushMembers(env, [me.id], { title: 'Level Up', body: 'Уведомления работают — до встречи вечером!', url: '#day', tag: 'test' }, false);
    return json({ ok: true });
  }

  // Основатель исключает участника
  if (path === '/api/kick' && method === 'POST') {
    const body = await readBody(req);
    const first = await env.DB.prepare('SELECT id FROM members WHERE league = ? ORDER BY joined_at LIMIT 1').bind(me.league).first();
    if (!first || first.id !== me.id) return fail('Исключать участников может только основатель лиги', 403);
    const t = await env.DB.prepare('SELECT id, name FROM members WHERE id = ? AND league = ?').bind(clip(body.id, 40), me.league).first();
    if (!t) return fail('Такого участника нет в лиге', 404);
    if (t.id === me.id) return fail('Себя исключить нельзя — можно покинуть лигу');
    await env.DB.batch([
      env.DB.prepare('DELETE FROM reactions WHERE member = ?').bind(t.id),
      env.DB.prepare('DELETE FROM votes WHERE member = ?').bind(t.id),
      env.DB.prepare('DELETE FROM backups WHERE member = ?').bind(t.id),
      env.DB.prepare('DELETE FROM push_subs WHERE member = ?').bind(t.id),
      env.DB.prepare('INSERT INTO events (league, member, kind, text, icon, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(me.league, me.id, 'kick', `исключил из лиги: ${t.name}`, 'arrowDown', now()),
      env.DB.prepare('DELETE FROM members WHERE id = ?').bind(t.id),
    ]);
    return json(await board(env, me));
  }

  // Покинуть лигу
  if (path === '/api/leave' && method === 'POST') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM reactions WHERE member = ?').bind(me.id),
      env.DB.prepare('DELETE FROM votes WHERE member = ?').bind(me.id),
      env.DB.prepare('DELETE FROM backups WHERE member = ?').bind(me.id),
      env.DB.prepare('DELETE FROM push_subs WHERE member = ?').bind(me.id),
      env.DB.prepare('INSERT INTO events (league, member, kind, text, icon, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(me.league, null, 'leave', `${me.name} покинул лигу`, 'arrowDown', now()),
      env.DB.prepare('DELETE FROM members WHERE id = ?').bind(me.id),
    ]);
    return json({ ok: true });
  }

  return fail('Не найдено', 404);
}

export default {
  async fetch(req, env, ctx) {
    try {
      return await route(req, env, ctx);
    } catch (e) {
      return fail(e && e.message ? e.message : 'Ошибка сервера', 500);
    }
  },
  // Cloudflare Cron (wrangler.toml): раз в 15 минут — вечерние напоминания.
  async scheduled(event, env, ctx) {
    const p = remindTick(env).catch(() => {});
    if (ctx && ctx.waitUntil) ctx.waitUntil(p); else await p;
  },
};
