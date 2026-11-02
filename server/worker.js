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
const REACTIONS = ['respect', 'lol'];

async function sha256(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readBody(req) {
  const text = await req.text();
  if (text.length > 20000) throw new Error('Слишком большой запрос');
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

async function addEvents(env, league, memberId, events) {
  const list = (Array.isArray(events) ? events : []).slice(0, 15)
    .map((e) => ({ kind: clip(e && e.kind, 16) || 'info', text: clip(e && e.text, 160), icon: clip(e && e.icon, 24) }))
    .filter((e) => e.text);
  if (!list.length) return;
  const t = now();
  await env.DB.batch(list.map((e) => env.DB.prepare('INSERT INTO events (league, member, kind, text, icon, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(league, memberId, e.kind, e.text, e.icon, t)));
}

async function board(env, me) {
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
  return { league, me: me.id, members, feed, serverTime: now() };
}

async function route(req, env) {
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

  // Покинуть лигу
  if (path === '/api/leave' && method === 'POST') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM reactions WHERE member = ?').bind(me.id),
      env.DB.prepare('INSERT INTO events (league, member, kind, text, icon, created_at) VALUES (?, ?, ?, ?, ?, ?)').bind(me.league, null, 'leave', `${me.name} покинул лигу`, 'arrowDown', now()),
      env.DB.prepare('DELETE FROM members WHERE id = ?').bind(me.id),
    ]);
    return json({ ok: true });
  }

  return fail('Не найдено', 404);
}

export default {
  async fetch(req, env) {
    try {
      return await route(req, env);
    } catch (e) {
      return fail(e && e.message ? e.message : 'Ошибка сервера', 500);
    }
  },
};
