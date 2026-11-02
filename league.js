'use strict';

/* =====================================================================
   Лига друзей: связь с сервером (server/worker.js на Cloudflare).
   На сервер уходит только сводка игрока и события для ленты.
   Настройки лиги и секретный токен хранятся отдельно от игровых данных
   и не попадают в экспорт.
   ===================================================================== */

const LEAGUE = (() => {
  const KEY = 'lvlup.league';
  const DEF = { server: '', code: '', name: '', memberId: '', token: '', board: null, lastSync: 0, outbox: [], error: '' };

  function cfg() {
    try { return { ...DEF, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch (e) { return { ...DEF }; }
  }
  function set(patch) {
    const c = { ...cfg(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* ignore */ }
    return c;
  }
  const joined = (c = cfg()) => !!(c.server && c.memberId && c.token);

  function normServer(s) {
    s = String(s || '').trim().replace(/\/+$/, '').replace(/\/api$/, '');
    if (s && !/^https?:\/\//i.test(s)) s = 'https://' + s;
    return s;
  }
  const host = (s) => normServer(s).replace(/^https?:\/\//i, '');

  async function api(path, { method = 'GET', body, auth = true, server } = {}) {
    const c = cfg();
    const base = normServer(server || c.server);
    if (!base) throw new Error('Не указан адрес сервера лиги');
    const headers = {};
    if (body) headers['content-type'] = 'application/json';
    if (auth) headers.authorization = `Bearer ${c.memberId}.${c.token}`;
    let res;
    try {
      res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (e) {
      throw Object.assign(new Error('Нет связи с сервером лиги. Проверь интернет, а если включён VPN — выключи его или добавь workers.dev в исключения VPN'), { status: 0 });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `Ошибка сервера (${res.status})`), { status: res.status });
    return data;
  }

  // Приглашение: «КОД@адрес-сервера», например K7QX-2M9P@levelup.anton.workers.dev
  function parseInvite(str, fallbackServer) {
    const s = String(str || '').trim();
    const m = s.match(/([A-Za-z0-9]{4}-[A-Za-z0-9]{4})\s*@\s*(\S+)/);
    if (m) return { code: m[1].toUpperCase(), server: normServer(m[2]) };
    const c = s.match(/([A-Za-z0-9]{4}-[A-Za-z0-9]{4})/);
    return c ? { code: c[1].toUpperCase(), server: normServer(fallbackServer) } : null;
  }
  const invite = (c = cfg()) => `${c.code}@${host(c.server)}`;

  async function create(server, name, member) {
    server = normServer(server);
    const r = await api('/api/league', { method: 'POST', body: { name, member }, auth: false, server });
    return set({ server, code: r.code, name: r.name, memberId: r.memberId, token: r.token, board: null, outbox: [], error: '', lastSync: 0 });
  }

  async function join(inviteStr, fallbackServer, member) {
    const inv = parseInvite(inviteStr, fallbackServer);
    if (!inv) throw new Error('Не похоже на приглашение. Формат: ABCD-EFGH@адрес-сервера');
    if (!inv.server) throw new Error('В приглашении нет адреса сервера');
    const r = await api('/api/join', { method: 'POST', body: { code: inv.code, member }, auth: false, server: inv.server });
    return set({ server: inv.server, code: r.code, name: r.name, memberId: r.memberId, token: r.token, board: null, outbox: [], error: '', lastSync: 0 });
  }

  async function sync(payload) {
    const c = cfg();
    const events = (c.outbox || []).slice(0, 15);
    const board = await api('/api/sync', { method: 'POST', body: { ...payload, events } });
    const fresh = cfg();
    set({ board, lastSync: Date.now(), outbox: (fresh.outbox || []).slice(events.length), error: '', name: board.league ? board.league.name : fresh.name });
    return board;
  }

  async function refresh() {
    const board = await api('/api/board');
    set({ board, lastSync: Date.now(), error: '' });
    return board;
  }

  async function react(eventId, kind) {
    const board = await api('/api/react', { method: 'POST', body: { eventId, kind } });
    set({ board });
    return board;
  }

  // Общие достижения лиги
  async function share(id, kind, data) {
    const board = await api('/api/items', { method: 'POST', body: { id, kind, data } });
    set({ board });
    return board;
  }
  async function unshare(id) {
    const board = await api('/api/items/remove', { method: 'POST', body: { id } });
    set({ board });
    return board;
  }

  // Суд лиги: доносы и похвалы
  async function propose(target, day, kind, text, summary, data) {
    const board = await api('/api/proposals', { method: 'POST', body: { target, day, kind, text, summary, data } });
    set({ board });
    return board;
  }
  async function vote(id, v) {
    const board = await api('/api/proposals/vote', { method: 'POST', body: { id, vote: v } });
    set({ board });
    return board;
  }
  async function withdraw(id) {
    const board = await api('/api/proposals/withdraw', { method: 'POST', body: { id } });
    set({ board });
    return board;
  }
  async function kick(id) {
    const board = await api('/api/kick', { method: 'POST', body: { id } });
    set({ board });
    return board;
  }
  const markApplied = (id) => api('/api/proposals/applied', { method: 'POST', body: { id } });

  async function leave() {
    try { await api('/api/leave', { method: 'POST' }); }
    catch (e) { if (e.status && e.status !== 401) throw e; }
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  // Событие для ленты лиги — копится и уходит при следующей синхронизации.
  function push(ev) {
    if (!joined()) return;
    const c = cfg();
    set({ outbox: [...(c.outbox || []), ev].slice(-40) });
  }

  // Код восстановления: перенос участия на другой телефон.
  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  function recoveryCode() {
    const c = cfg();
    return 'LVR1.' + b64e(JSON.stringify({ s: c.server, c: c.code, n: c.name, i: c.memberId, t: c.token }));
  }
  function restore(code) {
    const m = String(code || '').trim().match(/^LVR1\.([\w-]+)$/);
    if (!m) throw new Error('Неверный код восстановления');
    let d;
    try { d = JSON.parse(b64d(m[1])); } catch (e) { throw new Error('Код восстановления повреждён'); }
    if (!d.s || !d.i || !d.t) throw new Error('Код восстановления неполный');
    return set({ server: d.s, code: d.c, name: d.n, memberId: d.i, token: d.t, board: null, outbox: [], error: '', lastSync: 0 });
  }

  return { cfg, set, joined, normServer, host, parseInvite, invite, create, join, sync, refresh, react, share, unshare, propose, vote, withdraw, markApplied, kick, leave, push, recoveryCode, restore };
})();
