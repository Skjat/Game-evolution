'use strict';

/* =====================================================================
   Level Up — прокачка себя как RPG-персонажа.
   Все данные хранятся локально на устройстве (localStorage).
   ===================================================================== */

const STORAGE_KEY = 'lvlup.v1';

const DEFAULT_STATS = [
  { id: 'str', name: 'Сила',         icon: '💪', color: '#ef4444' },
  { id: 'agi', name: 'Ловкость',     icon: '🤸', color: '#22c55e' },
  { id: 'end', name: 'Выносливость', icon: '🫀', color: '#f97316' },
  { id: 'int', name: 'Интеллект',    icon: '🧠', color: '#3b82f6' },
  { id: 'wis', name: 'Мудрость',     icon: '🦉', color: '#a855f7' },
  { id: 'cha', name: 'Харизма',      icon: '✨', color: '#eab308' },
];

const DEFAULT_QUESTS = [
  { id: 'q_gym',   name: 'Силовая тренировка',     icon: '🏋️', rewards: { str: 3, end: 1 } },
  { id: 'q_run',   name: 'Пробежка / кардио',      icon: '🏃', rewards: { end: 3, agi: 1 } },
  { id: 'q_yoga',  name: 'Растяжка / йога',        icon: '🧘', rewards: { agi: 2, wis: 1 } },
  { id: 'q_sport', name: 'Игровой спорт / танцы',  icon: '⚽', rewards: { agi: 3, cha: 1 } },
  { id: 'q_read',  name: 'Чтение 30 минут',        icon: '📚', rewards: { int: 2, wis: 1 } },
  { id: 'q_learn', name: 'Учёба / новый навык',    icon: '🎓', rewards: { int: 3 } },
  { id: 'q_med',   name: 'Медитация / дневник',    icon: '🕯️', rewards: { wis: 2 } },
  { id: 'q_meet',  name: 'Новое знакомство',       icon: '🤝', rewards: { cha: 3 } },
  { id: 'q_talk',  name: 'Выступил / сложный разговор', icon: '🎤', rewards: { cha: 2, wis: 1 } },
  { id: 'q_sleep', name: 'Сон 7–8 часов',          icon: '😴', rewards: { end: 1, wis: 1 } },
  { id: 'q_food',  name: 'Без сладкого и фастфуда', icon: '🥗', rewards: { end: 1, wis: 1 } },
  { id: 'q_help',  name: 'Помог кому-то',          icon: '💝', rewards: { cha: 2, wis: 1 } },
];

const AVATARS = ['🧙‍♂️', '🧙‍♀️', '🥷', '🧝‍♂️', '🧝‍♀️', '🦸‍♂️', '🦸‍♀️', '🧛', '🤴', '👸', '🐉', '🦊', '🐺', '🦁', '🐼', '🤖', '👾', '🧑‍🚀'];
const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#94a3b8'];

const TITLES = [
  [1, 'Новичок'], [3, 'Ученик'], [5, 'Искатель'], [8, 'Странник'], [12, 'Воин'],
  [16, 'Ветеран'], [20, 'Мастер'], [25, 'Герой'], [32, 'Чемпион'], [40, 'Легенда'], [50, 'Мифический'],
];

/* ---------------------- Утилиты ---------------------- */

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = (o) => JSON.parse(JSON.stringify(o));
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pad = (n) => String(n).padStart(2, '0');

function dateKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); }
function todayKey() { return dateKey(new Date()); }
function plural(n, one, few, many) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
function humanDate(k) {
  const d = parseKey(k), t = todayKey();
  const base = d.getDate() + ' ' + MONTHS[d.getMonth()];
  if (k === t) return 'Сегодня, ' + base;
  if (k === addDays(t, -1)) return 'Вчера, ' + base;
  return WD[d.getDay()] + ', ' + base + (d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '');
}
const sign = (n) => (n > 0 ? '+' + n : String(n));

/* ---------------------- Состояние ---------------------- */

function defaultState() {
  return {
    v: 1,
    profile: { name: 'Герой', avatar: '🧙‍♂️' },
    stats: clone(DEFAULT_STATS),
    quests: clone(DEFAULT_QUESTS),
    log: {},   // 'YYYY-MM-DD' -> { m: {statId: n}, d: [{q, n, i, r}], note }
    ach: {},   // achievementId -> dateKey
    created: todayKey(),
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return Object.assign(defaultState(), JSON.parse(raw));
  } catch (e) {
    return defaultState();
  }
}

let S = load();
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
  catch (e) { toast('⚠️ Не удалось сохранить данные'); }
}

/* ---------------------- Игровая математика ---------------------- */

// Уровень L → L+1 требует k*L опыта. Для параметра k = 10, для персонажа k = 5 * число параметров.
function levelInfo(xp, k) {
  xp = Math.max(0, xp);
  let L = 1, base = 0;
  while (xp >= base + k * L) { base += k * L; L++; }
  return { level: L, into: xp - base, need: k * L, pct: (xp - base) / (k * L) };
}
const STAT_K = 10;
const charK = () => 5 * Math.max(1, S.stats.length);

function getDay(k) { return S.log[k]; }
function ensureDay(k) {
  if (!S.log[k]) S.log[k] = { m: {}, d: [], note: '' };
  return S.log[k];
}
function dayPoints(day) {
  const p = {};
  if (!day) return p;
  for (const id in day.m) p[id] = (p[id] || 0) + day.m[id];
  for (const x of day.d || []) for (const id in x.r) p[id] = (p[id] || 0) + x.r[id];
  return p;
}
function dayTotal(day) {
  const p = dayPoints(day);
  return S.stats.reduce((s, st) => s + (p[st.id] || 0), 0);
}
function isActive(day) { return !!day && ((day.d && day.d.length > 0) || dayTotal(day) > 0); }

function statXP() {
  const xp = {};
  for (const st of S.stats) xp[st.id] = 0;
  for (const k in S.log) {
    const p = dayPoints(S.log[k]);
    for (const id in p) if (id in xp) xp[id] += p[id];
  }
  for (const id in xp) xp[id] = Math.max(0, xp[id]);
  return xp;
}
function totalXP(xp = statXP()) { return Object.values(xp).reduce((a, b) => a + b, 0); }

function currentStreak() {
  let k = todayKey();
  if (!isActive(getDay(k))) k = addDays(k, -1);
  let n = 0;
  while (isActive(getDay(k))) { n++; k = addDays(k, -1); }
  return n;
}
function bestStreak() {
  const keys = Object.keys(S.log).filter((k) => isActive(S.log[k])).sort();
  let best = 0, cur = 0, prev = null;
  for (const k of keys) {
    cur = prev && addDays(prev, 1) === k ? cur + 1 : 1;
    best = Math.max(best, cur);
    prev = k;
  }
  return best;
}
function activeDays() { return Object.keys(S.log).filter((k) => isActive(S.log[k])).length; }
function titleFor(level) {
  let t = TITLES[0][1];
  for (const [l, name] of TITLES) if (level >= l) t = name;
  return t;
}

// Снимок уровней — чтобы поймать момент повышения.
function snapshot() {
  const xp = statXP();
  const lv = {};
  for (const st of S.stats) lv[st.id] = levelInfo(xp[st.id], STAT_K).level;
  return { lv, char: levelInfo(totalXP(xp), charK()).level };
}

/* ---------------------- Достижения ---------------------- */

function achievementDefs() {
  const xp = statXP();
  const levels = S.stats.map((s) => levelInfo(xp[s.id], STAT_K).level);
  const maxLvl = levels.length ? Math.max(...levels) : 0;
  const minLvl = levels.length ? Math.min(...levels) : 0;
  const charLvl = levelInfo(totalXP(xp), charK()).level;
  const best = Math.max(bestStreak(), currentStreak());
  const days = activeDays();
  let quests = 0, notes = 0, bigDay = 0;
  for (const k in S.log) {
    const d = S.log[k];
    quests += (d.d || []).length;
    if (d.note && d.note.trim()) notes++;
    bigDay = Math.max(bigDay, dayTotal(d));
  }
  const p = (v, goal) => ({ ok: v >= goal, prog: Math.min(v, goal) + ' / ' + goal });
  return [
    { id: 'first',   icon: '🌱', name: 'Первый шаг',      desc: 'Подвести итоги первого дня', ...p(days, 1) },
    { id: 's3',      icon: '🔥', name: 'Разогрев',        desc: 'Серия 3 дня подряд',  ...p(best, 3) },
    { id: 's7',      icon: '📅', name: 'Неделя силы воли', desc: 'Серия 7 дней подряд', ...p(best, 7) },
    { id: 's30',     icon: '🗓️', name: 'Железная привычка', desc: 'Серия 30 дней подряд', ...p(best, 30) },
    { id: 's100',    icon: '💎', name: 'Несокрушимый',    desc: 'Серия 100 дней подряд', ...p(best, 100) },
    { id: 'd10',     icon: '🎒', name: 'В пути',          desc: '10 дней с прогрессом', ...p(days, 10) },
    { id: 'd50',     icon: '🧭', name: 'Путешественник',  desc: '50 дней с прогрессом', ...p(days, 50) },
    { id: 'd365',    icon: '🌍', name: 'Год приключений', desc: '365 дней с прогрессом', ...p(days, 365) },
    { id: 'st5',     icon: '⭐', name: 'Специалист',      desc: 'Любой параметр 5 уровня', ...p(maxLvl, 5) },
    { id: 'st10',    icon: '🌟', name: 'Эксперт',         desc: 'Любой параметр 10 уровня', ...p(maxLvl, 10) },
    { id: 'st20',    icon: '👑', name: 'Грандмастер',     desc: 'Любой параметр 20 уровня', ...p(maxLvl, 20) },
    { id: 'bal3',    icon: '⚖️', name: 'Гармония',        desc: 'Все параметры от 3 уровня', ...p(minLvl, 3) },
    { id: 'bal7',    icon: '☯️', name: 'Универсал',       desc: 'Все параметры от 7 уровня', ...p(minLvl, 7) },
    { id: 'c5',      icon: '🛡️', name: 'Закалённый',      desc: 'Персонаж 5 уровня', ...p(charLvl, 5) },
    { id: 'c10',     icon: '⚔️', name: 'Воин',            desc: 'Персонаж 10 уровня', ...p(charLvl, 10) },
    { id: 'c25',     icon: '🐉', name: 'Герой',           desc: 'Персонаж 25 уровня', ...p(charLvl, 25) },
    { id: 'big',     icon: '🚀', name: 'Продуктивный день', desc: 'Набрать 25+ очков за день', ...p(bigDay, 25) },
    { id: 'q50',     icon: '📜', name: 'Охотник за подвигами', desc: 'Выполнить 50 подвигов', ...p(quests, 50) },
    { id: 'q300',    icon: '🏅', name: 'Легенда подвигов', desc: 'Выполнить 300 подвигов', ...p(quests, 300) },
    { id: 'n10',     icon: '✍️', name: 'Летописец',       desc: 'Оставить 10 заметок дня', ...p(notes, 10) },
  ];
}

function checkAchievements(silent) {
  for (const a of achievementDefs()) {
    if (a.ok && !S.ach[a.id]) {
      S.ach[a.id] = todayKey();
      if (!silent) toast('🏆 Достижение: ' + a.icon + ' ' + a.name, 'gold');
    }
  }
}

/* ---------------------- Изменения с отслеживанием уровня ---------------------- */

function mutate(fn) {
  const before = snapshot();
  fn();
  save();
  const after = snapshot();
  const ups = [];
  for (const st of S.stats) {
    if ((after.lv[st.id] || 1) > (before.lv[st.id] || 1)) ups.push(st.icon + ' ' + esc(st.name) + ' → ' + after.lv[st.id] + ' ур.');
  }
  const charUp = after.char > before.char;
  checkAchievements(false);
  save();
  if (ups.length || charUp) celebrate(ups, charUp ? after.char : 0);
  render();
}

/* ---------------------- UI-помощники ---------------------- */

function toast(text, cls = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.textContent = text;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; }, 2400);
  setTimeout(() => el.remove(), 2900);
}

function celebrate(ups, charLvl) {
  const el = $('#celebrate');
  const colors = ['#ffcf4a', '#8b7bff', '#5ee0c4', '#ff6b6b', '#4ade80', '#ffffff'];
  let conf = '';
  for (let i = 0; i < 60; i++) {
    conf += `<i class="confetti" style="left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-duration:${1.6 + Math.random() * 1.8}s;animation-delay:${Math.random() * 0.5}s"></i>`;
  }
  el.innerHTML = conf + `
    <div class="box">
      <div class="big">${charLvl ? '👑' : '⬆️'}</div>
      <div class="t">${charLvl ? 'НОВЫЙ УРОВЕНЬ!' : 'ПРОКАЧКА!'}</div>
      ${charLvl ? `<div>Персонаж достиг <b>${charLvl} уровня</b><br><span class="hero-title">${titleFor(charLvl)}</span></div>` : ''}
      <div class="ups">${ups.map((u) => `<div>${u}</div>`).join('')}</div>
      <button class="btn primary block" data-act="close-celebrate">Отлично!</button>
    </div>`;
  el.classList.remove('hidden');
}

function openSheet(html) {
  $('#sheet-card').innerHTML = html;
  $('#sheet').classList.remove('hidden');
}
function closeSheet() { $('#sheet').classList.add('hidden'); $('#sheet-card').innerHTML = ''; }

function statById(id) { return S.stats.find((s) => s.id === id); }
function rewardsText(r) {
  return Object.entries(r).filter(([id, v]) => v && statById(id))
    .map(([id, v]) => statById(id).icon + ' ' + sign(v)).join('  ') || 'без наград';
}

/* ---------------------- Экраны ---------------------- */

let tab = 'hero';
let curDate = todayKey();
let histRange = 30;

function render() {
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  const v = $('#view');
  v.innerHTML = ({ hero: viewHero, day: viewDay, history: viewHistory, ach: viewAch, settings: viewSettings }[tab])();
}

function radarSVG(xp) {
  const n = S.stats.length;
  if (n < 3) return '';
  const levels = S.stats.map((s) => levelInfo(xp[s.id], STAT_K).level);
  const max = Math.max(5, ...levels);
  const cx = 160, cy = 150, R = 105;
  const pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  let g = '';
  for (let ring = 1; ring <= 4; ring++) {
    const pts = S.stats.map((_, i) => pt(i, (R * ring) / 4).join(',')).join(' ');
    g += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,.08)" />`;
  }
  S.stats.forEach((_, i) => { const [x, y] = pt(i, R); g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,.08)"/>`; });
  const poly = levels.map((l, i) => pt(i, R * Math.max(0.06, l / max)).join(',')).join(' ');
  g += `<polygon points="${poly}" fill="rgba(139,123,255,.35)" stroke="#8b7bff" stroke-width="2" stroke-linejoin="round"/>`;
  levels.forEach((l, i) => { const [x, y] = pt(i, R * Math.max(0.06, l / max)); g += `<circle cx="${x}" cy="${y}" r="4" fill="${S.stats[i].color}"/>`; });
  S.stats.forEach((s, i) => {
    const [x, y] = pt(i, R + 26);
    g += `<text x="${x}" y="${y - 2}" text-anchor="middle" font-size="18">${esc(s.icon)}</text>`;
    g += `<text x="${x}" y="${y + 15}" text-anchor="middle" font-size="12" font-weight="700" fill="#9aa0c8">${levels[i]}</text>`;
  });
  return `<svg class="radar" viewBox="0 0 320 300">${g}</svg>`;
}

function viewHero() {
  const xp = statXP();
  const total = totalXP(xp);
  const ch = levelInfo(total, charK());
  const today = dayPoints(getDay(todayKey()));
  const streak = currentStreak();
  const todayDone = isActive(getDay(todayKey()));

  const stats = S.stats.map((s) => {
    const li = levelInfo(xp[s.id], STAT_K);
    const t = today[s.id] || 0;
    return `
      <div class="card stat">
        <div class="stat-ico" style="background:${s.color}22;border:1px solid ${s.color}55">${esc(s.icon)}</div>
        <div class="grow">
          <div class="row between">
            <span class="stat-name">${esc(s.name)}</span>
            <span class="row" style="gap:8px">
              ${t ? `<span class="${t > 0 ? 'today-plus' : 'today-minus'}">${sign(t)} сегодня</span>` : ''}
              <span class="stat-lvl" style="color:${s.color}">Ур. ${li.level}</span>
            </span>
          </div>
          <div class="bar thin" style="margin-top:8px"><i style="width:${li.pct * 100}%;background:${s.color}"></i></div>
          <div class="small muted" style="margin-top:4px">${li.into} / ${li.need} XP · всего ${xp[s.id]}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="card">
      <div class="hero-head">
        <div class="avatar">${esc(S.profile.avatar)}<span class="lvl">${ch.level}</span></div>
        <div class="grow">
          <div class="hero-name">${esc(S.profile.name)}</div>
          <div class="hero-title">${titleFor(ch.level)} · ${ch.level} уровень</div>
          <div class="bar" style="margin-top:10px"><i style="width:${ch.pct * 100}%"></i></div>
          <div class="small muted" style="margin-top:4px">${ch.into} / ${ch.need} XP до ${ch.level + 1} уровня</div>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi"><b>${streak ? '🔥 ' : ''}${streak}</b><span>${plural(streak, 'день', 'дня', 'дней')} подряд</span></div>
        <div class="kpi"><b>${total}</b><span>всего XP</span></div>
        <div class="kpi"><b>${Object.keys(S.ach).length}</b><span>наград</span></div>
      </div>
    </div>
    ${todayDone ? '' : `<button class="btn primary block" data-act="go-today" style="margin:4px 0 10px">📝 Подвести итоги дня</button>`}
    ${S.stats.length >= 3 ? `<div class="card">${radarSVG(xp)}</div>` : ''}
    <h2>Параметры</h2>
    ${stats || `<div class="empty"><div class="e">🫥</div>Добавь параметры в разделе «Ещё»</div>`}
  `;
}

function viewDay() {
  const day = getDay(curDate) || { m: {}, d: [], note: '' };
  const pts = dayPoints(day);
  const total = dayTotal(day);
  const isToday = curDate === todayKey();
  const counts = {};
  (day.d || []).forEach((x) => { counts[x.q] = (counts[x.q] || 0) + 1; });

  const rows = S.stats.map((s) => {
    const v = pts[s.id] || 0;
    return `
      <div class="card stat">
        <div class="stat-ico" style="background:${s.color}22;border:1px solid ${s.color}55">${esc(s.icon)}</div>
        <div class="grow"><div class="stat-name">${esc(s.name)}</div></div>
        <div class="stepper">
          <button class="icon-btn" data-act="dec" data-id="${s.id}">−</button>
          <span class="val ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}">${v > 0 ? '+' + v : v}</span>
          <button class="icon-btn" data-act="inc" data-id="${s.id}">+</button>
        </div>
      </div>`;
  }).join('');

  const quests = S.quests.map((q) => `
    <button class="quest ${counts[q.id] ? 'done' : ''}" data-act="quest" data-id="${q.id}">
      ${counts[q.id] ? `<span class="qc">${counts[q.id] > 1 ? '×' + counts[q.id] : '✓'}</span>` : ''}
      <span class="qi">${esc(q.icon)}</span>
      <span class="qn">${esc(q.name)}</span>
      <span class="qr">${rewardsText(q.rewards)}</span>
    </button>`).join('');

  const done = (day.d || []).map((x, i) => `
    <div class="done-item">
      <span style="font-size:22px">${esc(x.i)}</span>
      <div class="grow"><div style="font-weight:600;font-size:14px">${esc(x.n)}</div><div class="small muted">${rewardsText(x.r)}</div></div>
      <button class="icon-btn" data-act="undo-quest" data-idx="${i}" aria-label="Отменить">✕</button>
    </div>`).join('');

  return `
    <div class="datebar">
      <button class="icon-btn" data-act="prev-day">‹</button>
      <div class="d"><b>${humanDate(curDate)}</b><span class="small muted">${isToday ? 'итоги дня' : 'редактирование прошлого дня'}</span></div>
      <button class="icon-btn" data-act="next-day" ${isToday ? 'disabled' : ''}>›</button>
    </div>
    <div class="card" style="text-align:center">
      <div class="daytotal">${total > 0 ? '+' : ''}${total} XP</div>
      <div class="small muted">${total ? 'заработано за день' : 'Отметь, что ты сделал сегодня — и персонаж станет сильнее'}</div>
    </div>

    <h2>Подвиги дня</h2>
    <div class="small muted" style="margin:-4px 0 10px">Нажми на то, что сделал — очки начислятся автоматически. Можно нажимать несколько раз.</div>
    <div class="quests">${quests}</div>
    ${done ? `<div class="card" style="margin-top:10px">${done}</div>` : ''}

    <h2>Ручное начисление</h2>
    ${rows}

    <h2>Заметка дня</h2>
    <textarea id="note" placeholder="Что получилось? Чем гордишься? Что улучшить завтра?">${esc(day.note || '')}</textarea>
  `;
}

function viewHistory() {
  const t = todayKey();
  const days = [];
  for (let i = histRange - 1; i >= 0; i--) days.push(addDays(t, -i));

  // Стековая диаграмма очков по дням
  const W = 340, H = 170, padL = 26, padB = 22, padT = 8;
  const totals = days.map((k) => {
    const p = dayPoints(getDay(k));
    return S.stats.map((s) => Math.max(0, p[s.id] || 0));
  });
  const maxV = Math.max(5, ...totals.map((a) => a.reduce((x, y) => x + y, 0)));
  const bw = (W - padL) / days.length;
  let bars = '';
  const yT = (v) => H - padB - (v / maxV) * (H - padB - padT);
  for (let g = 0; g <= 2; g++) {
    const v = Math.round((maxV * g) / 2), y = yT(v);
    bars += `<line x1="${padL}" x2="${W}" y1="${y}" y2="${y}" stroke="rgba(255,255,255,.07)"/><text x="${padL - 4}" y="${y + 4}" font-size="10" fill="#9aa0c8" text-anchor="end">${v}</text>`;
  }
  totals.forEach((arr, i) => {
    let acc = 0;
    const x = padL + i * bw + bw * 0.15, w = Math.max(1, bw * 0.7);
    arr.forEach((v, j) => {
      if (!v) return;
      const y1 = yT(acc), y2 = yT(acc + v);
      bars += `<rect x="${x}" y="${y2}" width="${w}" height="${y1 - y2}" fill="${S.stats[j].color}" rx="${Math.min(2, w / 3)}"/>`;
      acc += v;
    });
    const step = histRange <= 7 ? 1 : histRange <= 30 ? 5 : 15;
    if ((days.length - 1 - i) % step === 0) {
      const d = parseKey(days[i]);
      bars += `<text x="${x + w / 2}" y="${H - 6}" font-size="10" fill="#9aa0c8" text-anchor="middle">${histRange <= 7 ? WD[d.getDay()] : d.getDate() + '.' + pad(d.getMonth() + 1)}</text>`;
    }
  });

  // Сумма за период по параметрам
  const sums = S.stats.map((s, j) => totals.reduce((a, arr) => a + arr[j], 0));
  const periodTotal = sums.reduce((a, b) => a + b, 0);
  const activeInRange = days.filter((k) => isActive(getDay(k))).length;

  const list = Object.keys(S.log).filter((k) => isActive(S.log[k]) || (S.log[k].note || '').trim()).sort().reverse().slice(0, 60).map((k) => {
    const d = S.log[k];
    const p = dayPoints(d);
    const chips = S.stats.filter((s) => p[s.id]).map((s) => `<span class="chip">${esc(s.icon)} ${sign(p[s.id])}</span>`).join('');
    return `
      <button class="card hday" data-act="open-day" data-k="${k}">
        <div class="row between"><b>${humanDate(k)}</b><span class="today-plus">${sign(dayTotal(d))} XP</span></div>
        ${chips ? `<div class="chips">${chips}</div>` : ''}
        ${(d.d || []).length ? `<div class="small muted" style="margin-top:6px">${d.d.map((x) => esc(x.i)).join(' ')}</div>` : ''}
        ${d.note && d.note.trim() ? `<div class="small" style="margin-top:6px;color:#c9cdf0">“${esc(d.note.trim().slice(0, 140))}${d.note.trim().length > 140 ? '…' : ''}”</div>` : ''}
      </button>`;
  }).join('');

  return `
    <h1>История</h1>
    <div class="seg" style="margin-bottom:10px">
      ${[7, 30, 90].map((r) => `<button data-act="range" data-r="${r}" class="${histRange === r ? 'active' : ''}">${r} дней</button>`).join('')}
    </div>
    <div class="card">
      <div class="row between" style="margin-bottom:6px">
        <b>+${periodTotal} XP</b>
        <span class="small muted">активных дней: ${activeInRange} из ${histRange}</span>
      </div>
      <svg class="chart" viewBox="0 0 ${W} ${H}">${bars}</svg>
      <div class="legend">${S.stats.map((s, j) => `<span><i style="background:${s.color}"></i>${esc(s.name)} ${sums[j]}</span>`).join('')}</div>
    </div>
    <h2>Дневник</h2>
    ${list || `<div class="empty"><div class="e">📖</div>Пока пусто. Подведи итоги первого дня!</div>`}
  `;
}

function viewAch() {
  const defs = achievementDefs();
  const got = defs.filter((a) => S.ach[a.id]).length;
  return `
    <h1>Награды</h1>
    <div class="card row between"><span>Получено</span><b style="color:var(--gold)">${got} / ${defs.length}</b></div>
    <div class="achs">
      ${defs.map((a) => {
        const has = !!S.ach[a.id];
        return `<div class="ach ${has ? 'got' : 'locked'}">
          <div class="ai">${a.icon}</div>
          <div class="an">${a.name}</div>
          <div class="ad">${a.desc}</div>
          <div class="ad" style="margin-top:6px;${has ? 'color:var(--gold)' : ''}">${has ? '✓ ' + humanDate(S.ach[a.id]).replace(/^Сегодня, |^Вчера, /, '') : a.prog}</div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function viewSettings() {
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  return `
    <h1>Настройки</h1>

    <h2>Персонаж</h2>
    <div class="card">
      <label class="f" style="margin-top:0">Имя</label>
      <input type="text" id="pname" value="${esc(S.profile.name)}" maxlength="30">
      <label class="f">Аватар</label>
      <div class="avatars">${AVATARS.map((a) => `<button data-act="avatar" data-a="${a}" class="${S.profile.avatar === a ? 'sel' : ''}">${a}</button>`).join('')}</div>
    </div>

    <h2>Параметры</h2>
    <div class="card">
      ${S.stats.map((s) => `
        <div class="list-item">
          <div class="stat-ico" style="background:${s.color}22;border:1px solid ${s.color}55;width:38px;height:38px;font-size:20px">${esc(s.icon)}</div>
          <div class="grow stat-name">${esc(s.name)}</div>
          <button class="btn sm" data-act="edit-stat" data-id="${s.id}">Изменить</button>
        </div>`).join('')}
      <button class="btn block" data-act="add-stat" style="margin-top:10px">＋ Добавить параметр</button>
    </div>

    <h2>Подвиги (быстрые действия)</h2>
    <div class="card">
      ${S.quests.map((q) => `
        <div class="list-item">
          <span style="font-size:24px">${esc(q.icon)}</span>
          <div class="grow"><div style="font-weight:600">${esc(q.name)}</div><div class="small muted">${rewardsText(q.rewards)}</div></div>
          <button class="btn sm" data-act="edit-quest" data-id="${q.id}">Изменить</button>
        </div>`).join('')}
      <button class="btn block" data-act="add-quest" style="margin-top:10px">＋ Добавить подвиг</button>
    </div>

    <h2>Данные</h2>
    <div class="card">
      <div class="small muted" style="margin-bottom:10px">Данные хранятся только на этом телефоне. Время от времени делай резервную копию.</div>
      <div class="row" style="flex-wrap:wrap">
        <button class="btn grow" data-act="export">📤 Экспорт</button>
        <button class="btn grow" data-act="import">📥 Импорт</button>
      </div>
      <input type="file" id="importfile" accept="application/json,.json,text/plain" class="hidden">
      <button class="btn danger block" data-act="reset" style="margin-top:10px">Начать заново</button>
    </div>

    ${standalone ? '' : `
    <h2>Установка на iPhone</h2>
    <div class="card small">
      1. Открой эту страницу в <b>Safari</b>.<br>
      2. Нажми кнопку <b>«Поделиться»</b> (квадрат со стрелкой).<br>
      3. Выбери <b>«На экран „Домой“»</b> и нажми «Добавить».<br>
      Приложение появится на рабочем столе и будет работать без интернета.
    </div>`}

    <h2>Как это работает</h2>
    <div class="card small muted">
      Каждый вечер отмечай «подвиги» и/или вручную начисляй очки параметрам.
      Для перехода параметра с уровня N на N+1 нужно 10×N очков, поэтому первые уровни даются быстро, а дальше — нужна регулярность.
      Уровень персонажа растёт от суммы всех очков. Серия 🔥 — сколько дней подряд ты прокачивался.
    </div>
    <div class="small muted" style="text-align:center;margin-top:16px">Level Up · v1</div>
  `;
}

/* ---------------------- Редакторы (шторки) ---------------------- */

function statEditor(id) {
  const s = id ? statById(id) : { id: '', name: '', icon: '⭐', color: COLORS[S.stats.length % COLORS.length] };
  openSheet(`
    <h1 style="font-size:22px">${id ? 'Параметр' : 'Новый параметр'}</h1>
    <label class="f">Название</label>
    <input type="text" id="s-name" value="${esc(s.name)}" maxlength="24" placeholder="Например, Креативность">
    <label class="f">Иконка (эмодзи)</label>
    <input type="text" id="s-icon" value="${esc(s.icon)}" maxlength="8">
    <label class="f">Цвет</label>
    <div class="colors">${COLORS.map((c) => `<button data-act="pick-color" data-c="${c}" class="${s.color === c ? 'sel' : ''}" style="background:${c}"></button>`).join('')}</div>
    <input type="hidden" id="s-color" value="${s.color}">
    <div class="row" style="margin-top:20px">
      ${id ? `<button class="btn danger" data-act="del-stat" data-id="${id}">Удалить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Отмена</button>
      <button class="btn primary grow" data-act="save-stat" data-id="${id || ''}">Сохранить</button>
    </div>
  `);
}

function questEditor(id) {
  const q = id ? S.quests.find((x) => x.id === id) : { id: '', name: '', icon: '⚡', rewards: {} };
  openSheet(`
    <h1 style="font-size:22px">${id ? 'Подвиг' : 'Новый подвиг'}</h1>
    <label class="f">Название</label>
    <input type="text" id="q-name" value="${esc(q.name)}" maxlength="40" placeholder="Например, Холодный душ">
    <label class="f">Иконка (эмодзи)</label>
    <input type="text" id="q-icon" value="${esc(q.icon)}" maxlength="8">
    <label class="f">Награда</label>
    ${S.stats.map((s) => `
      <div class="list-item">
        <span style="font-size:20px">${esc(s.icon)}</span>
        <div class="grow">${esc(s.name)}</div>
        <div class="stepper">
          <button class="icon-btn" data-act="qr-dec" data-id="${s.id}">−</button>
          <span class="val ${(q.rewards[s.id] || 0) > 0 ? 'pos' : (q.rewards[s.id] || 0) < 0 ? 'neg' : ''}" id="qr-${s.id}" data-v="${q.rewards[s.id] || 0}">${q.rewards[s.id] || 0}</span>
          <button class="icon-btn" data-act="qr-inc" data-id="${s.id}">+</button>
        </div>
      </div>`).join('')}
    <div class="row" style="margin-top:20px">
      ${id ? `<button class="btn danger" data-act="del-quest" data-id="${id}">Удалить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Отмена</button>
      <button class="btn primary grow" data-act="save-quest" data-id="${id || ''}">Сохранить</button>
    </div>
  `);
}

/* ---------------------- Экспорт / импорт ---------------------- */

async function doExport() {
  const json = JSON.stringify(S, null, 2);
  const name = 'levelup-backup-' + todayKey() + '.json';
  try {
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Level Up — резервная копия' });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function doImport(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !Array.isArray(data.stats) || typeof data.log !== 'object') throw new Error('bad');
      if (!confirm('Заменить текущие данные данными из файла?')) return;
      S = Object.assign(defaultState(), data);
      save();
      toast('✅ Данные восстановлены');
      render();
    } catch (e) {
      toast('⚠️ Файл не похож на резервную копию Level Up');
    }
  };
  reader.readAsText(file);
}

/* ---------------------- Обработчики ---------------------- */

document.addEventListener('click', (e) => {
  const tb = e.target.closest('#tabbar button');
  if (tb) {
    tab = tb.dataset.tab;
    if (tab === 'day') curDate = todayKey();
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (e.target.id === 'sheet') { closeSheet(); return; }

  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;

  switch (act) {
    case 'go-today': tab = 'day'; curDate = todayKey(); render(); window.scrollTo(0, 0); break;
    case 'prev-day': curDate = addDays(curDate, -1); render(); break;
    case 'next-day': if (curDate < todayKey()) { curDate = addDays(curDate, 1); render(); } break;
    case 'inc':
    case 'dec':
      mutate(() => {
        const d = ensureDay(curDate);
        d.m[id] = clamp((d.m[id] || 0) + (act === 'inc' ? 1 : -1), -50, 99);
        if (!d.m[id]) delete d.m[id];
      });
      break;
    case 'quest': {
      const q = S.quests.find((x) => x.id === id);
      if (!q) break;
      mutate(() => { ensureDay(curDate).d.push({ q: q.id, n: q.name, i: q.icon, r: clone(q.rewards) }); });
      toast(q.icon + ' ' + q.name + ': ' + rewardsText(q.rewards));
      break;
    }
    case 'undo-quest':
      mutate(() => { ensureDay(curDate).d.splice(Number(el.dataset.idx), 1); });
      break;
    case 'open-day': curDate = el.dataset.k; tab = 'day'; render(); window.scrollTo(0, 0); break;
    case 'range': histRange = Number(el.dataset.r); render(); break;
    case 'avatar': S.profile.avatar = el.dataset.a; save(); render(); break;
    case 'close-celebrate': $('#celebrate').classList.add('hidden'); $('#celebrate').innerHTML = ''; break;
    case 'close-sheet': closeSheet(); break;

    case 'edit-stat': statEditor(id); break;
    case 'add-stat': statEditor(null); break;
    case 'pick-color':
      document.querySelectorAll('.colors button').forEach((b) => b.classList.toggle('sel', b === el));
      $('#s-color').value = el.dataset.c;
      break;
    case 'save-stat': {
      const name = $('#s-name').value.trim();
      if (!name) { toast('Введите название'); break; }
      const icon = $('#s-icon').value.trim() || '⭐';
      const color = $('#s-color').value;
      if (id) Object.assign(statById(id), { name, icon, color });
      else S.stats.push({ id: uid('s'), name, icon, color });
      save(); closeSheet(); render();
      break;
    }
    case 'del-stat':
      if (confirm('Удалить параметр? Накопленные очки этого параметра перестанут учитываться.')) {
        S.stats = S.stats.filter((s) => s.id !== id);
        save(); closeSheet(); render();
      }
      break;

    case 'edit-quest': questEditor(id); break;
    case 'add-quest': questEditor(null); break;
    case 'qr-inc':
    case 'qr-dec': {
      const v = $('#qr-' + id);
      const n = clamp(Number(v.dataset.v) + (act === 'qr-inc' ? 1 : -1), -20, 20);
      v.dataset.v = n; v.textContent = n;
      v.className = 'val ' + (n > 0 ? 'pos' : n < 0 ? 'neg' : '');
      break;
    }
    case 'save-quest': {
      const name = $('#q-name').value.trim();
      if (!name) { toast('Введите название'); break; }
      const icon = $('#q-icon').value.trim() || '⚡';
      const rewards = {};
      S.stats.forEach((s) => { const n = Number($('#qr-' + s.id).dataset.v); if (n) rewards[s.id] = n; });
      if (id) Object.assign(S.quests.find((x) => x.id === id), { name, icon, rewards });
      else S.quests.push({ id: uid('q'), name, icon, rewards });
      save(); closeSheet(); render();
      break;
    }
    case 'del-quest':
      if (confirm('Удалить подвиг? Уже начисленные очки сохранятся.')) {
        S.quests = S.quests.filter((q) => q.id !== id);
        save(); closeSheet(); render();
      }
      break;

    case 'export': doExport(); break;
    case 'import': $('#importfile').click(); break;
    case 'reset':
      if (confirm('Удалить весь прогресс и начать заново? Это нельзя отменить.')) {
        S = defaultState(); save(); tab = 'hero'; render();
      }
      break;
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'note') {
    const d = ensureDay(curDate);
    d.note = e.target.value;
    save();
  } else if (e.target.id === 'pname') {
    S.profile.name = e.target.value.trim() || 'Герой';
    save();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'note') { checkAchievements(false); save(); }
  if (e.target.id === 'importfile' && e.target.files[0]) { doImport(e.target.files[0]); e.target.value = ''; }
});

// При возвращении в приложение после полуночи — обновить «сегодня».
let lastToday = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayKey() !== lastToday) {
    if (curDate === lastToday) curDate = todayKey();
    lastToday = todayKey();
    render();
  }
});

/* ---------------------- Старт ---------------------- */

checkAchievements(true);
save();
render();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
