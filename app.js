'use strict';

/* =====================================================================
   Level Up — прокачка себя как RPG-персонажа. Тема «Алый реактор».
   Все данные хранятся локально на устройстве (localStorage).
   ===================================================================== */

const STORAGE_KEY = 'lvlup.v1';
const DATA_VERSION = 3;

/* ---------------------- Иконки (SVG, 24×24, линии) ---------------------- */

const ICONS = {
  reactor: '<path d="M12 2l3 6 6 1-4.5 4 1 6.5L12 16l-5.5 3.5 1-6.5L3 9l6-1z"/><circle cx="12" cy="11.5" r="2"/>',
  sword: '<path d="M12 2v14M8 16h8M12 16v5M10 21h4M9 5l3-3 3 3"/>',
  swift: '<path d="M4 18l6-6-3-3 7-6M10 12l4 4 6-6M14 16l-2 5"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z M12 7v9M8.5 10.5h7"/>',
  hex: '<path d="M12 2l9 5v10l-9 5-9-5V7z M12 7v10M7.5 9.5l9 5M16.5 9.5l-9 5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2"/>',
  crown: '<path d="M3 18l2-11 5 5 2-8 2 8 5-5 2 11z M3 21h18"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-5-4-7-5-12-2 3-3 5-3 7-1-1-2-2-2-4-2 2-4 5-4 9 0 4 3 7 7 7z"/><path d="M12 22c-2 0-3-1.5-3-3.5S11 15 12 13c1 2 3 3.5 3 5.5S14 22 12 22z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  star: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6l-6.3 3.5 1.5-7L2 9.3l7-.8z"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z M2 9h20 M9 3l3 6 3-6 M12 9v12"/>',
  skull: '<path d="M12 2a8 8 0 0 0-8 8c0 3 1.5 5 3 6v3h10v-3c1.5-1 3-3 3-6a8 8 0 0 0-8-8z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 19v2M14 19v2"/>',
  claw: '<path d="M5 21c2-6 3-11 2-17 3 4 4 9 3 15M11 21c1-5 2-10 4-14 1 4 0 9-1 14M17 21c1-3 2-6 4-8"/>',
  atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  moon: '<path d="M20 15A8 8 0 1 1 9 4a7 7 0 0 0 11 11z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  dumbbell: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h8"/>',
  lotus: '<path d="M12 20c-4 0-8-2-9-6 3 0 6 1 9 4 3-3 6-4 9-4-1 4-5 6-9 6z"/><path d="M12 18c-2-2-3-5-3-8 1-3 3-5 3-5s2 2 3 5c0 3-1 6-3 8z"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 4.5h-5L8 10z M12 3v4M16 10l4.5-1M14.5 14.5l2.5 4M9.5 14.5L7 18.5M8 10L3.5 9"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a2 2 0 0 0-2 2 2 2 0 0 0-2-2H4z M12 5v16"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5z M6 11v5c3 2 9 2 12 0v-5 M22 9v6"/>',
  candle: '<path d="M9 10h6v11H9z M12 10V7"/><path d="M12 7c-1.5-1-1.5-3 0-5 1.5 2 1.5 4 0 5z"/>',
  link: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',
  leaf: '<path d="M5 19C5 10 10 5 20 4c-1 10-6 15-15 15z M5 19l8-8"/>',
  heart: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z"/>',
  brush: '<path d="M14 4l6 6-9 9H5v-6z M12 6l6 6"/>',
  note: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9h-4.5a1.75 1.75 0 0 0 0 3.5h3a1.75 1.75 0 0 1 0 3.5H9"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  rocket: '<path d="M12 2c4 3 6 7 5 12l-2 3H9l-2-3C6 9 8 5 12 2z"/><circle cx="12" cy="9" r="2"/><path d="M9 17l-3 4M15 17l3 4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  scroll: '<path d="M7 3h11a2 2 0 0 1 2 2v2h-4M16 7v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2h10v2a2 2 0 0 0 2 2M7 3a2 2 0 0 0-2 2v12M9 8h4M9 12h4"/>',
  medal: '<circle cx="12" cy="15" r="6"/><path d="M8 3l2 7M16 3l-2 7M8 3h8"/><path d="M12 12.5l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/>',
  balance: '<path d="M12 3v18M7 21h10M4 7h16M4 7l-3 7a3 3 0 0 0 6 0zM20 7l-3 7a3 3 0 0 0 6 0z"/>',
  seed: '<path d="M12 21v-9M12 12C12 7 8 5 4 5c0 4 3 7 8 7zM12 10c0-4 3-6 7-6 0 4-3 6-7 6z"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4"/>',
  home: '<path d="M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6"/>',
  chart: '<path d="M3 21h18M5 17l4-6 4 3 6-9"/><circle cx="19" cy="5" r="1.5"/>',
  trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0z M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  doc: '<path d="M6 2h9l4 4v16H6z M15 2v4h4 M9 11h7M9 15h7M9 19h4"/>',
  shieldStar: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M12 8l1.5 3 3 .4-2.2 2 .6 3L12 15l-2.9 1.4.6-3-2.2-2 3-.4z"/>',
  upload: '<path d="M12 15V3M7 8l5-5 5 5M4 15v5h16v-5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 15v5h16v-5"/>',
  mountain: '<path d="M2 20l7-12 4 6 3-4 6 10z M9 8l2 3"/>',
  bike: '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17l4-8h6l3 8M9.5 9l2.5 8H5.5M15 6h2.5"/>',
  swim: '<path d="M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 22c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"/><circle cx="16" cy="6" r="2"/><path d="M5 14l5-6 4 3 3 2"/>',
  drop: '<path d="M12 2s7 7.5 7 13a7 7 0 0 1-14 0c0-5.5 7-13 7-13z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z M8 9h8M8 12h5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 1.5 5 5"/>',
  hourglass: '<path d="M6 2h12M6 22h12M7 2v3l5 7-5 7v3M17 2v3l-5 7 5 7v3"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>',
  wallet: '<path d="M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l13-4v4"/><circle cx="16.5" cy="13.5" r="1.5"/>',
  pot: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM2 10h20M9 6c0-1 1-1.5 1-3M14 6c0-1 1-1.5 1-3"/>',
  phoneOff: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2M3 3l18 18"/>',
  tree: '<path d="M12 22v-6M12 2l6 8h-3l4 6H5l4-6H6z"/>',
  gift: '<rect x="3" y="8" width="18" height="5"/><path d="M5 13v8h14v-8M12 8v13M12 8c-2-4-6-4-6-1.5S10 8 12 8zM12 8c2-4 6-4 6-1.5S14 8 12 8z"/>',
  camera: '<path d="M3 7h4l2-3h6l2 3h4v13H3z"/><circle cx="12" cy="13" r="4"/>',
  plane: '<path d="M2 13l8-1 4-8h2l-1 8 6 1v2l-6 1 1 4h-2l-4-4-8-1z"/>',
  sparkle: '<path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3z"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
};
const ICON_CHOICES = ['sword', 'swift', 'shield', 'hex', 'eye', 'crown', 'flame', 'bolt', 'star', 'gem', 'atom', 'moon', 'sun',
  'dumbbell', 'wind', 'lotus', 'ball', 'book', 'cap', 'candle', 'link', 'mic', 'leaf', 'heart', 'brush', 'note', 'coin',
  'target', 'rocket', 'compass', 'globe', 'pen', 'home', 'skull', 'claw', 'seed', 'mountain', 'bike', 'swim', 'drop',
  'chat', 'users', 'hourglass', 'briefcase', 'wallet', 'pot', 'phoneOff', 'tree', 'gift', 'camera', 'plane', 'sparkle'];
const AVATAR_CHOICES = ['reactor', 'flame', 'skull', 'eye', 'crown', 'sword', 'star', 'moon', 'claw', 'atom', 'gem', 'bolt'];

const ico = (k, cls = '') => ICONS[k]
  ? `<svg class="i ${cls}" viewBox="0 0 24 24">${ICONS[k]}</svg>`
  : `<span class="emo">${esc(k || '')}</span>`;

/* ---------------------- Значения по умолчанию ---------------------- */

const DEFAULT_STATS = [
  { id: 'str', name: 'Сила',         icon: 'sword',  color: '#ff2340' },
  { id: 'agi', name: 'Ловкость',     icon: 'swift',  color: '#ffc23d' },
  { id: 'end', name: 'Выносливость', icon: 'shield', color: '#ff7a1a' },
  { id: 'int', name: 'Интеллект',    icon: 'hex',    color: '#ff5c8a' },
  { id: 'wis', name: 'Мудрость',     icon: 'eye',    color: '#ffcfa3' },
  { id: 'cha', name: 'Харизма',      icon: 'crown',  color: '#ff3dbb' },
];

const DEFAULT_QUESTS = [
  { id: 'q_gym',   name: 'Силовая тренировка',          icon: 'dumbbell', rewards: { str: 3, end: 1 } },
  { id: 'q_run',   name: 'Пробежка / кардио',           icon: 'wind',     rewards: { end: 3, agi: 1 } },
  { id: 'q_yoga',  name: 'Растяжка / йога',             icon: 'lotus',    rewards: { agi: 2, wis: 1 } },
  { id: 'q_sport', name: 'Игровой спорт / танцы',       icon: 'ball',     rewards: { agi: 3, cha: 1 } },
  { id: 'q_read',  name: 'Чтение 30 минут',             icon: 'book',     rewards: { int: 2, wis: 1 } },
  { id: 'q_learn', name: 'Учёба / новый навык',         icon: 'cap',      rewards: { int: 3 } },
  { id: 'q_med',   name: 'Медитация / дневник',         icon: 'candle',   rewards: { wis: 2 } },
  { id: 'q_meet',  name: 'Новое знакомство',            icon: 'link',     rewards: { cha: 3 } },
  { id: 'q_talk',  name: 'Выступил / сложный разговор', icon: 'mic',      rewards: { cha: 2, wis: 1 } },
  { id: 'q_sleep', name: 'Сон 7–8 часов',               icon: 'moon',     rewards: { end: 1, wis: 1 } },
  { id: 'q_food',  name: 'Без сладкого и фастфуда',     icon: 'leaf',     rewards: { end: 1, wis: 1 } },
  { id: 'q_help',  name: 'Помог кому-то',               icon: 'heart',    rewards: { cha: 2, wis: 1 } },
];

const COLORS = ['#ff2340', '#ff3dbb', '#ff5c8a', '#ff7a1a', '#ffc23d', '#ffcfa3', '#ffe36b', '#b98cff', '#5ad1ff', '#5dffb0'];

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
const sign = (n) => (n > 0 ? '+' + n : String(n));
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

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
function shortDate(k) { const d = parseKey(k); return d.getDate() + ' ' + MONTHS[d.getMonth()]; }

/* ---------------------- Состояние ---------------------- */

function defaultState() {
  return {
    v: DATA_VERSION,
    profile: { name: 'Герой', avatar: 'reactor' },
    stats: clone(DEFAULT_STATS),
    quests: DEFAULT_QUESTS.map((q) => ({ ...clone(q), c: { ...(QUEST_COUNTERS[q.id] || {}) } })),
    // 'YYYY-MM-DD' -> { m: {statId: очки}, d: [{q, n, i, r, c}], c: {counterId: n}, ms: [milestoneId], note }
    log: {},
    ach: {},   // achievementId -> dateKey
    settings: { sound: true },
    custom: { counters: [], milestones: [] },   // свои достижения игрока
    created: todayKey(),
  };
}

// Перенос данных версии 1 (эмодзи и старые цвета) в новую тему.
const EMOJI_TO_ICON = {
  '💪': 'sword', '🤸': 'swift', '🫀': 'shield', '🧠': 'hex', '🦉': 'eye', '✨': 'crown',
  '🏋️': 'dumbbell', '🏃': 'wind', '🧘': 'lotus', '⚽': 'ball', '📚': 'book', '🎓': 'cap', '🕯️': 'candle',
  '🤝': 'link', '🎤': 'mic', '😴': 'moon', '🥗': 'leaf', '💝': 'heart', '⭐': 'star', '⚡': 'bolt', '🎨': 'brush',
};
const OLD_COLORS = { str: '#ef4444', agi: '#22c55e', end: '#f97316', int: '#3b82f6', wis: '#a855f7', cha: '#eab308' };
function migrate(s) {
  const v = s.v || 1;
  if (v < 2) {
    const mapIcon = (i) => EMOJI_TO_ICON[i] || i;
    for (const st of s.stats || []) {
      st.icon = mapIcon(st.icon);
      const def = DEFAULT_STATS.find((d) => d.id === st.id);
      if (def && st.color === OLD_COLORS[st.id]) st.color = def.color;
    }
    for (const q of s.quests || []) q.icon = mapIcon(q.icon);
    for (const k in s.log || {}) for (const x of s.log[k].d || []) x.i = mapIcon(x.i);
    if (s.profile && !ICONS[s.profile.avatar]) s.profile.avatar = 'reactor';
  }
  if (v < 3) {
    // Стандартные подвиги теперь двигают счётчики достижений — в том числе задним числом.
    for (const q of s.quests || []) if (!q.c) q.c = { ...(QUEST_COUNTERS[q.id] || {}) };
    for (const k in s.log || {}) for (const x of s.log[k].d || []) if (!x.c) x.c = { ...(QUEST_COUNTERS[x.q] || {}) };
  }
  s.settings = Object.assign({ sound: true }, s.settings || {});
  s.custom = Object.assign({ counters: [], milestones: [] }, s.custom || {});
  s.v = DATA_VERSION;
  return s;
}

// Данные без номера версии считаем версией 1.
function hydrate(obj) { return migrate(Object.assign(defaultState(), obj, { v: obj.v || 1 })); }

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return hydrate(JSON.parse(raw));
  } catch (e) {
    return defaultState();
  }
}

let S = load();
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }
  catch (e) { toast('Не удалось сохранить данные', '', 'bolt'); }
}

/* ---------------------- Игровая математика ---------------------- */

// Уровень L → L+1 требует k*L опыта. Для параметра k = 10, для персонажа k = 5 × число параметров.
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
  const d = S.log[k];
  if (!d.c) d.c = {};
  if (!d.ms) d.ms = [];
  return d;
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
function isActive(day) {
  return !!day && ((day.d && day.d.length > 0) || dayTotal(day) > 0 || Object.keys(day.c || {}).length > 0 || (day.ms || []).length > 0);
}

/* ---------------------- Счётчики и вехи ---------------------- */

const round1 = (n) => Math.round(n * 10) / 10;
const counterById = (id) => counterList(S).find((c) => c.id === id);
const milestoneById = (id) => milestoneList(S).find((m) => m.id === id);
const sphereById = (id) => SPHERES.find((s) => s.id === id) || SPHERES[0];

function dayCounters(day) {
  const c = {};
  if (!day) return c;
  for (const id in day.c || {}) c[id] = (c[id] || 0) + day.c[id];
  for (const x of day.d || []) for (const id in x.c || {}) c[id] = (c[id] || 0) + x.c[id];
  for (const id in c) c[id] = round1(c[id]);
  return c;
}
function counterTotals() {
  const t = {};
  for (const k in S.log) { const c = dayCounters(S.log[k]); for (const id in c) t[id] = (t[id] || 0) + c[id]; }
  for (const id in t) t[id] = Math.max(0, round1(t[id]));
  return t;
}
// Вехи: id -> дата, когда открыта (самая ранняя).
function milestoneDates() {
  const m = {};
  for (const k of Object.keys(S.log).sort()) for (const id of S.log[k].ms || []) if (!m[id]) m[id] = k;
  return m;
}
const fmtNum = (n) => (Number.isInteger(n) ? fmt(n) : String(n).replace('.', ','));

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

function snapshot() {
  const xp = statXP();
  const lv = {};
  for (const st of S.stats) lv[st.id] = levelInfo(xp[st.id], STAT_K).level;
  return { lv, char: levelInfo(totalXP(xp), charK()).level };
}

/* ---------------------- Достижения ---------------------- */

function systemAchievementDefs() {
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
  const p = (v, goal) => ({ ok: v >= goal, v: Math.min(v, goal), goal });
  return [
    { id: 'first', icon: 'seed',    name: 'Первый шаг',          desc: 'Подвести итоги первого дня', ...p(days, 1) },
    { id: 's3',    icon: 'flame',   name: 'Разогрев',            desc: 'Серия 3 дня подряд', ...p(best, 3) },
    { id: 's7',    icon: 'bolt',    name: 'Неделя силы воли',    desc: 'Серия 7 дней подряд', ...p(best, 7) },
    { id: 's30',   icon: 'shield',  name: 'Железная привычка',   desc: 'Серия 30 дней подряд', ...p(best, 30) },
    { id: 's100',  icon: 'gem',     name: 'Несокрушимый',        desc: 'Серия 100 дней подряд', ...p(best, 100) },
    { id: 'd10',   icon: 'compass', name: 'В пути',              desc: '10 дней с прогрессом', ...p(days, 10) },
    { id: 'd50',   icon: 'target',  name: 'Путешественник',      desc: '50 дней с прогрессом', ...p(days, 50) },
    { id: 'd365',  icon: 'globe',   name: 'Год приключений',     desc: '365 дней с прогрессом', ...p(days, 365) },
    { id: 'st5',   icon: 'star',    name: 'Специалист',          desc: 'Любой параметр 5 уровня', ...p(maxLvl, 5) },
    { id: 'st10',  icon: 'atom',    name: 'Эксперт',             desc: 'Любой параметр 10 уровня', ...p(maxLvl, 10) },
    { id: 'st20',  icon: 'crown',   name: 'Грандмастер',         desc: 'Любой параметр 20 уровня', ...p(maxLvl, 20) },
    { id: 'bal3',  icon: 'balance', name: 'Гармония',            desc: 'Все параметры от 3 уровня', ...p(minLvl, 3) },
    { id: 'bal7',  icon: 'hex',     name: 'Универсал',           desc: 'Все параметры от 7 уровня', ...p(minLvl, 7) },
    { id: 'c5',    icon: 'sword',   name: 'Закалённый',          desc: 'Персонаж 5 уровня', ...p(charLvl, 5) },
    { id: 'c10',   icon: 'claw',    name: 'Воин',                desc: 'Персонаж 10 уровня', ...p(charLvl, 10) },
    { id: 'c25',   icon: 'reactor', name: 'Герой',               desc: 'Персонаж 25 уровня', ...p(charLvl, 25) },
    { id: 'big',   icon: 'rocket',  name: 'Продуктивный день',   desc: 'Набрать 25+ очков за день', ...p(bigDay, 25) },
    { id: 'q50',   icon: 'scroll',  name: 'Охотник за подвигами', desc: 'Выполнить 50 подвигов', ...p(quests, 50) },
    { id: 'q300',  icon: 'medal',   name: 'Легенда подвигов',    desc: 'Выполнить 300 подвигов', ...p(quests, 300) },
    { id: 'n10',   icon: 'pen',     name: 'Летописец',           desc: 'Оставить 10 заметок дня', ...p(notes, 10) },
  ];
}

// Все достижения: системные + ступени счётчиков + вехи.
function allAchievements() {
  const list = systemAchievementDefs().map((a) => ({ ...a, kind: 'system', sphere: 'system' }));
  const totals = counterTotals();
  for (const c of counterList(S)) {
    const v = totals[c.id] || 0;
    c.tiers.forEach((t, i) => list.push({
      id: `t_${c.id}_${t.goal}`, kind: 'tier', counter: c, tier: i, sphere: c.sphere, icon: c.icon,
      name: t.title, desc: `${c.name}: ${fmtNum(t.goal)} ${c.unit}`, ok: v >= t.goal, v: Math.min(v, t.goal), goal: t.goal,
    }));
  }
  const md = milestoneDates();
  for (const m of milestoneList(S)) list.push({ id: 'm_' + m.id, kind: 'milestone', m, sphere: m.sphere, icon: m.icon, name: m.name, desc: m.desc, ok: !!md[m.id], date: md[m.id] });
  return list;
}

function checkAchievements(silent) {
  const fresh = [];
  for (const a of allAchievements()) {
    if (a.ok && !S.ach[a.id]) { S.ach[a.id] = a.date || todayKey(); fresh.push(a); }
    else if (!a.ok && S.ach[a.id]) delete S.ach[a.id];   // отменили запись — награда снова закрыта
  }
  if (silent || !fresh.length) return;
  if (fresh.length > 3) toast(`Открыто достижений: ${fresh.length}`, 'gold', 'trophy');
  else fresh.forEach((a, i) => setTimeout(() => toast(
    a.kind === 'tier' ? `${a.counter.name}: «${a.name}» · ${RARITY[Math.min(a.tier, RARITY.length - 1)].name}` : 'Достижение: ' + a.name,
    'gold', a.icon), i * 350));
  SFX.play('achieve');
}

/* ---------------------- Изменения с отслеживанием уровня ---------------------- */

let afterRender = [];   // эффекты, которые нужно применить к свежему DOM

function mutate(fn) {
  const before = snapshot();
  fn();
  save();
  const after = snapshot();
  const ups = [];
  for (const st of S.stats) {
    const a = before.lv[st.id] || 1, b = after.lv[st.id] || 1;
    if (b > a) ups.push({ st, from: a, to: b });
  }
  const charUp = after.char > before.char ? after.char : 0;
  checkAchievements(false);
  save();
  render(false);
  if (ups.length || charUp) setTimeout(() => celebrate(ups, charUp), 450);
}

/* ---------------------- Эффекты ---------------------- */

function fx(cls, x, y, style = '', html = '', life = 1200) {
  const el = document.createElement('div');
  el.className = 'fx ' + cls;
  el.style.cssText = `left:${x}px;top:${y}px;${style}`;
  el.innerHTML = html;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), life);
  return el;
}
function burst(x, y, n = 10) {
  fx('shock', x, y, '', '', 700);
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i + Math.random() * 20;
    fx('spark', x, y, `--a:${a}deg;--d:${30 + Math.random() * 30}px`, '', 650);
  }
}
function floats(x, y, items) {
  items.forEach((it, i) => {
    const dx = (i - (items.length - 1) / 2) * 62;
    setTimeout(() => fx('float', x + dx, y, `color:${it.color}`, `${it.icon ? ico(it.icon) : ''}${esc(it.text)}`, 1250), i * 110);
  });
}
function centerOf(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }

function toast(text, cls = '', icon = 'bolt') {
  const el = document.createElement('div');
  el.className = 'toast ' + cls;
  el.innerHTML = ico(icon) + `<span>${esc(text)}</span>`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.classList.add('out'), 2600);
  setTimeout(() => el.remove(), 3000);
}

function reactorHTML(icon, lvlText) {
  let ticks = '';
  for (let i = 0; i < 36; i++) {
    const a = i * Math.PI / 18, r1 = 43, r2 = i % 3 ? 44.5 : 47;
    ticks += `<line x1="${(48 + Math.cos(a) * r1).toFixed(2)}" y1="${(48 + Math.sin(a) * r1).toFixed(2)}" x2="${(48 + Math.cos(a) * r2).toFixed(2)}" y2="${(48 + Math.sin(a) * r2).toFixed(2)}" stroke="#ffb020" stroke-width=".6" opacity=".8"/>`;
  }
  return `
    <div class="reactor">
      <svg class="ring r3" viewBox="0 0 96 96"><circle cx="48" cy="48" r="46" fill="none" stroke="#ff1f3d" stroke-width=".8" stroke-dasharray="1 3"/>${ticks}</svg>
      <svg class="ring r1" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke="#ff7a1a" stroke-width="1.6" stroke-dasharray="30 8 4 8"/></svg>
      <svg class="ring r2" viewBox="0 0 96 96"><circle cx="48" cy="48" r="32" fill="none" stroke="#ff1f3d" stroke-width="1" stroke-dasharray="60 6 2 6"/></svg>
      <div class="core">${ico(icon)}</div>
      ${lvlText ? `<div class="lvl">${lvlText}</div>` : ''}
    </div>`;
}

function celebrate(ups, charLvl) {
  SFX.play(charLvl ? 'overload' : 'levelup');
  const el = document.createElement('div');
  el.className = 'lu';
  let sparks = '';
  for (let i = 0; i < 56; i++) {
    sparks += `<b style="--a:${Math.random() * 360}deg;--d:${120 + Math.random() * 200}px;--t:${.7 + Math.random() * .7}s;--dl:${Math.random() * .25}s"></b>`;
  }
  const rows = ups.map((u, i) => `
    <div style="color:${u.st.color};animation-delay:${.7 + i * .12}s">${ico(u.st.icon)}<span style="color:var(--text)">${esc(u.st.name)}</span>
      <span class="mono" style="color:var(--muted)">${u.from}</span><span class="arrow">→</span><span>${u.to}</span></div>`).join('');
  el.innerHTML = `
    <div class="flash"></div>
    <div class="wave"></div><div class="wave"></div><div class="wave"></div>
    <div class="sparks">${sparks}</div>
    <div class="box">
      ${reactorHTML(S.profile.avatar, '')}
      <div class="t">${charLvl ? 'ПЕРЕГРУЗКА ЯДРА' : 'ПРОКАЧКА'}</div>
      ${charLvl ? `<div class="lv">${charLvl}</div><div class="lt">уровень · ${titleFor(charLvl)}</div>` : ''}
      ${rows ? `<div class="ups">${rows}</div>` : '<div style="height:16px"></div>'}
      <button class="btn primary block" data-act="close-lu">Принять силу</button>
    </div>`;
  document.body.appendChild(el);
}

function openSheet(html) {
  $('#sheet-card').innerHTML = `<button class="sheet-x" data-act="close-sheet" aria-label="Закрыть">✕</button>` + html;
  $('#sheet').classList.remove('hidden');
}
function closeSheet() { micStop(); $('#sheet').classList.add('hidden'); $('#sheet-card').innerHTML = ''; }

function statById(id) { return S.stats.find((s) => s.id === id); }
function rewardsHTML(r) {
  const parts = Object.entries(r).filter(([id, v]) => v && statById(id))
    .map(([id, v]) => { const s = statById(id); return `<span style="color:${s.color}">${ico(s.icon)}${sign(v)}</span>`; });
  return parts.join('') || '<span>без наград</span>';
}
const barHTML = (key, pct, color) =>
  `<div class="bar"><i data-bar="${key}" data-w="${(clamp(pct, 0, 1) * 100).toFixed(1)}" style="--c:${color};background:linear-gradient(90deg,${color}99,${color})"></i></div>`;

/* ---------------------- Экраны ---------------------- */

let tab = 'hero';
let curDate = todayKey();
let histRange = 30;

const TABS = [['hero', 'Герой', 'shieldStar'], ['day', 'Итоги', 'doc'], ['history', 'История', 'chart'], ['ach', 'Награды', 'trophy'], ['settings', 'Ещё', 'gear']];

function render(enter) {
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  const v = $('#view');
  const prev = {};
  v.querySelectorAll('[data-bar]').forEach((el) => { prev[el.dataset.bar] = el.style.width; });

  v.classList.remove('enter');
  v.innerHTML = ({ hero: viewHero, day: viewDay, history: viewHistory, ach: viewAch, settings: viewSettings }[tab])();
  if (enter) { void v.offsetWidth; v.classList.add('enter'); }

  // Шкалы плавно доезжают от прошлого значения (или от нуля при входе на экран).
  const bars = v.querySelectorAll('[data-bar]');
  bars.forEach((el) => { el.style.width = enter ? '0%' : (prev[el.dataset.bar] || el.dataset.w + '%'); });
  void v.offsetWidth;
  requestAnimationFrame(() => setTimeout(() => bars.forEach((el) => { el.style.width = el.dataset.w + '%'; }), enter ? 180 : 0));

  afterRender.forEach((f) => f(v));
  afterRender = [];
}

function radarSVG(xp) {
  const n = S.stats.length;
  if (n < 3) return '';
  const levels = S.stats.map((s) => levelInfo(xp[s.id], STAT_K).level);
  const max = Math.max(5, ...levels);
  const cx = 170, cy = 142, R = 90;
  const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const f = (v) => v.toFixed(1);
  let g = `<defs>
    <radialGradient id="rf"><stop offset="0" stop-color="#ff7a1a" stop-opacity=".55"/><stop offset="1" stop-color="#ff1f3d" stop-opacity=".18"/></radialGradient>
    <filter id="rglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="iglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
  for (let k = 1; k <= 4; k++) g += `<circle cx="${cx}" cy="${cy}" r="${R * k / 4}" fill="none" stroke="rgba(255,60,40,.22)"/>`;
  S.stats.forEach((_, i) => { const [x, y] = pt(i, R); g += `<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" stroke="rgba(255,60,40,.22)"/>`; });
  const pts = levels.map((l, i) => pt(i, R * Math.max(0.07, l / max)).map(f).join(',')).join(' ');
  g += `<polygon class="fillp" points="${pts}" fill="url(#rf)"/>`;
  g += `<polygon class="shape" pathLength="1" points="${pts}" fill="none" stroke="#ff5a2a" stroke-width="2.5" stroke-linejoin="round" filter="url(#rglow)"/>`;
  g += `<polygon class="shape" pathLength="1" points="${pts}" fill="none" stroke="#fff3e6" stroke-width="1" stroke-linejoin="round"/>`;
  levels.forEach((l, i) => {
    const [x, y] = pt(i, R * Math.max(0.07, l / max));
    g += `<circle class="pt" cx="${f(x)}" cy="${f(y)}" r="3.5" fill="#fff" stroke="${S.stats[i].color}" stroke-width="2" filter="url(#iglow)" style="transform-box:fill-box;transform-origin:center;animation-delay:${.9 + i * .06}s"/>`;
  });
  S.stats.forEach((s, i) => {
    const [x, y] = pt(i, R + 26);
    const icon = ICONS[s.icon]
      ? `<svg x="${f(x - 10)}" y="${f(y - 17)}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" filter="url(#iglow)">${ICONS[s.icon]}</svg>`
      : `<text x="${f(x)}" y="${f(y - 2)}" text-anchor="middle" font-size="17">${esc(s.icon)}</text>`;
    g += icon + `<text x="${f(x)}" y="${f(y + 16)}" text-anchor="middle" font-size="12" font-weight="700" fill="#ffe2c4" style="font-family:Unbounded,sans-serif">${levels[i]}</text>`;
  });
  return `<svg class="radar" viewBox="0 0 340 288">${g}</svg>`;
}

function viewHero() {
  const xp = statXP();
  const total = totalXP(xp);
  const ch = levelInfo(total, charK());
  const tday = getDay(todayKey());
  const today = dayPoints(tday);
  const streak = currentStreak();
  const todayDone = isActive(tday);

  const stats = S.stats.map((s) => {
    const li = levelInfo(xp[s.id], STAT_K);
    const t = today[s.id] || 0;
    return `
      <div class="card stat">
        <div class="sico" style="color:${s.color}">${ico(s.icon)}</div>
        <div class="grow">
          <div class="row between">
            <span class="sn">${esc(s.name)}</span>
            <span class="row" style="gap:8px">
              ${t ? `<span class="${t > 0 ? 'today-plus' : 'today-minus'}">${sign(t)}</span>` : ''}
              <span class="sl" style="color:${s.color}">УР. ${li.level}</span>
            </span>
          </div>
          ${barHTML('st-' + s.id, li.pct, s.color)}
          <div class="sx">${li.into} / ${li.need} XP · всего ${fmt(xp[s.id])}</div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="sub"><span class="dot"></span>reactor core · online</div>
    <div class="card sweep">
      <div class="hero">
        ${reactorHTML(S.profile.avatar, 'LVL ' + ch.level)}
        <div class="hero-name">${esc(S.profile.name)}</div>
        <div class="hero-title">${titleFor(ch.level)} · ${ch.level} уровень</div>
        <div class="xpwrap">
          ${barHTML('char', ch.pct, '#ff4a2a')}
          <div class="xpt">${ch.into} / ${ch.need} XP → ${ch.level + 1} уровень</div>
        </div>
      </div>
      <div class="kpis">
        <div class="kpi"><b>${streak}</b><span>${plural(streak, 'день', 'дня', 'дней')} подряд</span></div>
        <div class="kpi"><b>${fmt(total)}</b><span>энергия</span></div>
        <div class="kpi"><b>${Object.keys(S.ach).length}</b><span>награды</span></div>
      </div>
    </div>
    ${todayDone
      ? `<button class="cta done" data-act="go-today">${ico('bolt')} Ядро заряжено · ${sign(dayTotal(tday))} XP</button>`
      : `<button class="cta" data-act="go-today">${ico('doc')} Зарядить ядро</button>`}
    ${S.stats.length >= 3 ? `<div class="card" style="padding:8px 6px 4px">${radarSVG(xp)}</div>` : ''}
    <h2>Параметры</h2>
    ${stats || `<div class="empty">${ico('hex')}<div>Добавь параметры в разделе «Ещё»</div></div>`}
  `;
}

function viewDay() {
  const day = getDay(curDate) || { m: {}, d: [], note: '' };
  const pts = dayPoints(day);
  const total = dayTotal(day);
  const isToday = curDate === todayKey();
  const counts = {};
  (day.d || []).forEach((x) => { counts[x.q] = (counts[x.q] || 0) + 1; });

  const quests = S.quests.map((q) => `
    <button class="quest ${counts[q.id] ? 'done' : ''}" data-act="quest" data-id="${q.id}">
      ${counts[q.id] ? `<span class="qc">${counts[q.id] > 1 ? '×' + counts[q.id] : '✓'}</span>` : ''}
      <span class="qi">${ico(q.icon)}</span>
      <span class="qn">${esc(q.name)}</span>
      <span class="qr">${rewardsHTML(q.rewards)}</span>
    </button>`).join('');

  const done = (day.d || []).map((x, i) => `
    <div class="done-item">
      <span class="qi">${ico(x.i)}</span>
      <div class="grow"><div style="font-weight:600;font-size:14px">${esc(x.n)}</div><span class="qr" style="margin-top:3px">${rewardsHTML(x.r)}</span></div>
      <button class="icon-btn" data-act="undo-quest" data-idx="${i}" aria-label="Отменить">✕</button>
    </div>`).join('');

  const dc = dayCounters(day);
  const progress = [
    ...Object.entries(dc).filter(([id, v]) => v && counterById(id)).map(([id, v]) => {
      const c = counterById(id), manual = (day.c || {})[id] || 0;
      return `<div class="prog-item"><div class="sico" style="color:${sphereById(c.sphere).color}">${ico(c.icon)}</div>
        <div class="grow"><div class="sn">${esc(c.name)}</div><div class="sx">+${fmtNum(v)} ${c.unit}${manual !== v ? ' · из подвигов ' + fmtNum(round1(v - manual)) : ''}</div></div>
        ${manual ? `<button class="icon-btn" data-act="rm-counter" data-id="${id}" aria-label="Убрать">✕</button>` : ''}</div>`;
    }),
    ...(day.ms || []).filter(milestoneById).map((id) => {
      const m = milestoneById(id);
      return `<div class="prog-item"><div class="sico ms" style="color:var(--am)">${ico(m.icon)}</div>
        <div class="grow"><div class="sn">${esc(m.name)}</div><div class="sx">веха · ${esc(m.desc)}</div></div>
        <button class="icon-btn" data-act="rm-ms" data-id="${id}" aria-label="Убрать">✕</button></div>`;
    }),
  ].join('');

  const rows = S.stats.map((s) => {
    const v = pts[s.id] || 0;
    return `
      <div class="card stat compact">
        <div class="sico" style="color:${s.color}">${ico(s.icon)}</div>
        <div class="grow"><div class="sn">${esc(s.name)}</div></div>
        <div class="stepper">
          <button class="icon-btn" data-act="dec" data-id="${s.id}">−</button>
          <span class="val ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}" id="val-${s.id}">${v > 0 ? '+' + v : v}</span>
          <button class="icon-btn" data-act="inc" data-id="${s.id}">+</button>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="datebar">
      <button class="icon-btn" data-act="prev-day">‹</button>
      <div class="d"><b>${humanDate(curDate)}</b><span>${isToday ? 'итоги дня' : 'прошлый день'}</span></div>
      <button class="icon-btn" data-act="next-day" ${isToday ? 'disabled' : ''}>›</button>
    </div>
    <div class="card sweep center">
      <div class="daytotal" id="daytotal">${total > 0 ? '+' : ''}${total} XP</div>
      <div class="small muted">${total ? 'энергии получено за день' : 'Отметь, что сделал сегодня, — и ядро зарядится'}</div>
    </div>
    <button class="cta ai-cta" data-act="ai-open">${ico('mic')} Рассказать о дне ИИ</button>
    ${progress ? `<h2>Прогресс достижений</h2><div class="card">${progress}</div>` : ''}
    <h2>Подвиги дня</h2>
    <div class="quests">${quests}</div>
    ${done ? `<div class="card" style="margin-top:12px">${done}</div>` : ''}
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

  const W = 340, H = 180, padL = 26, padB = 22, padT = 10;
  const totals = days.map((k) => { const p = dayPoints(getDay(k)); return S.stats.map((s) => Math.max(0, p[s.id] || 0)); });
  const maxV = Math.max(5, ...totals.map((a) => a.reduce((x, y) => x + y, 0)));
  const bw = (W - padL) / days.length;
  const yT = (v) => H - padB - (v / maxV) * (H - padB - padT);
  let bars = `<defs><filter id="cglow" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  for (let g = 0; g <= 2; g++) {
    const v = Math.round((maxV * g) / 2), y = yT(v);
    bars += `<line x1="${padL}" x2="${W}" y1="${y}" y2="${y}" stroke="rgba(255,60,40,.15)" stroke-dasharray="2 4"/><text x="${padL - 5}" y="${y + 4}" font-size="10" fill="rgba(255,220,200,.5)" text-anchor="end" style="font-family:'JetBrains Mono',monospace">${v}</text>`;
  }
  let cols = '';
  totals.forEach((arr, i) => {
    let acc = 0, col = '';
    const x = padL + i * bw + bw * 0.18, w = Math.max(1.5, bw * 0.64);
    arr.forEach((v, j) => {
      if (!v) return;
      const y1 = yT(acc), y2 = yT(acc + v);
      col += `<rect x="${x.toFixed(1)}" y="${y2.toFixed(1)}" width="${w.toFixed(1)}" height="${(y1 - y2).toFixed(1)}" fill="${S.stats[j].color}" rx="${Math.min(2, w / 3).toFixed(1)}"/>`;
      acc += v;
    });
    if (col) cols += `<g class="colb" style="animation-delay:${(i * (600 / days.length)).toFixed(0)}ms">${col}</g>`;
    const step = histRange <= 7 ? 1 : histRange <= 30 ? 5 : 15;
    if ((days.length - 1 - i) % step === 0) {
      const d = parseKey(days[i]);
      const lx = x + w / 2, anchor = lx > W - 14 ? 'end' : 'middle';
      bars += `<text x="${(anchor === 'end' ? W : lx).toFixed(1)}" y="${H - 6}" font-size="10" fill="rgba(255,220,200,.5)" text-anchor="${anchor}" style="font-family:'JetBrains Mono',monospace">${histRange <= 7 ? WD[d.getDay()] : d.getDate() + '.' + pad(d.getMonth() + 1)}</text>`;
    }
  });
  bars += `<g filter="url(#cglow)">${cols}</g>`;

  const sums = S.stats.map((s, j) => totals.reduce((a, arr) => a + arr[j], 0));
  const periodTotal = sums.reduce((a, b) => a + b, 0);
  const activeInRange = days.filter((k) => isActive(getDay(k))).length;

  const list = Object.keys(S.log).filter((k) => isActive(S.log[k]) || (S.log[k].note || '').trim()).sort().reverse().slice(0, 60).map((k) => {
    const d = S.log[k];
    const p = dayPoints(d);
    const chips = S.stats.filter((s) => p[s.id]).map((s) => `<span class="chip" style="color:${s.color}">${ico(s.icon)}${sign(p[s.id])}</span>`).join('');
    const note = (d.note || '').trim();
    return `
      <button class="card hday" data-act="open-day" data-k="${k}">
        <div class="row between"><b>${humanDate(k)}</b><span class="today-plus">${sign(dayTotal(d))} XP</span></div>
        ${chips ? `<div class="chips">${chips}</div>` : ''}
        ${(d.d || []).length ? `<div class="ic">${d.d.map((x) => ico(x.i)).join('')}</div>` : ''}
        ${(d.ms || []).filter(milestoneById).map((id) => `<div class="ms-line">${ico(milestoneById(id).icon)}<span>${esc(milestoneById(id).name)}</span></div>`).join('')}
        ${note ? `<div class="quote">«${esc(note.slice(0, 140))}${note.length > 140 ? '…' : ''}»</div>` : ''}
      </button>`;
  }).join('');

  return `
    <h1>История</h1>
    <div class="seg">
      ${[7, 30, 90].map((r) => `<button data-act="range" data-r="${r}" class="${histRange === r ? 'active' : ''}">${r} дней</button>`).join('')}
    </div>
    <div class="card sweep">
      <div class="row between" style="margin-bottom:8px">
        <span class="bigxp">+${fmt(periodTotal)} XP</span>
        <span class="small muted mono">${activeInRange}/${histRange} дней</span>
      </div>
      <svg class="chart" viewBox="0 0 ${W} ${H}">${bars}</svg>
      <div class="legend">${S.stats.map((s, j) => `<span style="color:${s.color}"><i style="background:${s.color}"></i><span style="color:var(--muted)">${esc(s.name)} ${sums[j]}</span></span>`).join('')}</div>
    </div>
    <h2>Летопись</h2>
    ${list || `<div class="empty">${ico('book')}<div>Пока пусто. Подведи итоги первого дня!</div></div>`}
  `;
}

let achSphere = 'system';

function viewAch() {
  const all = allAchievements();
  const got = all.filter((a) => a.ok).length;
  const bySphere = (id) => all.filter((a) => a.sphere === id);
  const chips = SPHERES.map((sp) => {
    const list = bySphere(sp.id);
    return `<button class="sp ${achSphere === sp.id ? 'on' : ''}" data-act="sphere" data-s="${sp.id}" style="--c:${sp.color}">
      ${ico(sp.icon)}<span>${sp.name}</span><b>${list.filter((a) => a.ok).length}/${list.length}</b></button>`;
  }).join('');

  let body = '';
  if (achSphere === 'system') {
    body = `<div class="achs">${bySphere('system').map((a) => `<div class="card ach ${a.ok ? 'got' : 'locked'}">
        <div class="badge">${ico(a.icon)}</div>
        <div class="an">${a.name}</div>
        <div class="ad">${a.desc}</div>
        ${a.ok ? `<div class="ap">✓ ${shortDate(S.ach[a.id] || todayKey())}</div>`
               : `<div class="ap">${a.v} / ${a.goal}</div>${barHTML('ach-' + a.id, a.v / a.goal, '#ff4a2a')}`}
      </div>`).join('')}</div>`;
  } else {
    const sp = sphereById(achSphere);
    const totals = counterTotals();
    const chains = counterList(S).filter((c) => c.sphere === achSphere).map((c) => {
      const v = totals[c.id] || 0;
      const nextI = c.tiers.findIndex((t) => v < t.goal);
      const next = nextI >= 0 ? c.tiers[nextI] : null;
      return `<div class="card chain">
        <div class="row">
          <div class="sico" style="color:${sp.color}">${ico(c.icon)}</div>
          <div class="grow"><div class="sn">${esc(c.name)}${c.custom ? '<span class="tag">своё</span>' : ''}</div>
            <div class="sx"><b class="cv">${fmtNum(v)}</b> ${c.unit}${next ? ` · далее «${esc(next.title)}» на ${fmtNum(next.goal)}` : ' · все ступени пройдены'}</div></div>
          <button class="icon-btn" data-act="counter" data-id="${c.id}" aria-label="Добавить">+</button>
        </div>
        ${barHTML('ch-' + c.id, next ? v / next.goal : 1, sp.color)}
        <div class="tiers">${c.tiers.map((t, i) => {
          const r = RARITY[Math.min(i, RARITY.length - 1)];
          return `<button class="tier ${v >= t.goal ? 'on' : ''}" style="--r:${r.color}" data-act="tier" data-id="${c.id}" data-i="${i}">
            <span class="hx">${ico(v >= t.goal ? c.icon : 'sparkle')}</span><b>${fmtNum(t.goal)}</b></button>`;
        }).join('')}</div>
      </div>`;
    }).join('');
    const md = milestoneDates();
    const miles = milestoneList(S).filter((m) => m.sphere === achSphere).map((m) => `
      <button class="card ach ${md[m.id] ? 'got' : 'locked'}" data-act="milestone" data-id="${m.id}">
        <div class="badge">${ico(m.icon)}</div>
        <div class="an">${esc(m.name)}</div>
        <div class="ad">${esc(m.desc || '')}</div>
        <div class="ap">${md[m.id] ? '✓ ' + shortDate(md[m.id]) : 'не открыто'}${m.custom ? ' · своё' : ''}</div>
      </button>`).join('');
    body = `<h2>Цепочки</h2>${chains}
      <button class="btn block add-own" data-act="add-cc">${ico('sparkle')} Своя цепочка</button>
      <h2>Вехи</h2><div class="achs">${miles}</div>
      <button class="btn block add-own" data-act="add-cm" style="margin-top:12px">${ico('sparkle')} Своя веха</button>`;
  }

  return `
    <h1>Награды</h1>
    <div class="card sweep">
      <div class="row between"><span class="sn">Открыто</span><span class="bigxp">${got} / ${all.length}</span></div>
      ${barHTML('ach-all', got / all.length, '#ff4a2a')}
    </div>
    <div class="spheres">${chips}</div>
    ${body}
  `;
}

function viewSettings() {
  const standalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
  return `
    <h1>Настройки</h1>
    <h2>Персонаж</h2>
    <div class="card">
      <label class="f" style="margin-top:0">Имя</label>
      <input type="text" id="pname" value="${esc(S.profile.name)}" maxlength="24">
      <label class="f">Символ в ядре</label>
      <div class="picker">${AVATAR_CHOICES.map((a) => `<button data-act="avatar" data-a="${a}" class="${S.profile.avatar === a ? 'sel' : ''}">${ico(a)}</button>`).join('')}</div>
    </div>

    <h2>Параметры</h2>
    <div class="card">
      ${S.stats.map((s) => `
        <div class="list-item">
          <div class="sico" style="color:${s.color}">${ico(s.icon)}</div>
          <div class="grow sn">${esc(s.name)}</div>
          <button class="btn sm" data-act="edit-stat" data-id="${s.id}">Изменить</button>
        </div>`).join('')}
      <button class="btn block" data-act="add-stat" style="margin-top:10px">＋ Добавить параметр</button>
    </div>

    <h2>Подвиги</h2>
    <div class="card">
      ${S.quests.map((q) => `
        <div class="list-item">
          <span class="qi" style="color:#ff8a5a">${ico(q.icon)}</span>
          <div class="grow"><div style="font-weight:600">${esc(q.name)}</div><span class="qr" style="margin-top:3px">${rewardsHTML(q.rewards)}</span></div>
          <button class="btn sm" data-act="edit-quest" data-id="${q.id}">Изменить</button>
        </div>`).join('')}
      <button class="btn block" data-act="add-quest" style="margin-top:10px">＋ Добавить подвиг</button>
    </div>

    <h2>ИИ-помощник</h2>
    ${aiSettingsHTML()}

    <h2>Звук</h2>
    <div class="card row between">
      <div><div style="font-weight:600">Звуковые эффекты</div><div class="small muted">На iPhone молчат в беззвучном режиме</div></div>
      <button class="switch ${S.settings.sound ? 'on' : ''}" data-act="sound" aria-label="Звук"><i></i></button>
    </div>

    <h2>Данные</h2>
    <div class="card">
      <div class="small muted" style="margin-bottom:10px">Данные хранятся только на этом телефоне. Время от времени делай резервную копию.</div>
      <div class="row">
        <button class="btn grow" data-act="export">${ico('upload')} Экспорт</button>
        <button class="btn grow" data-act="import">${ico('download')} Импорт</button>
      </div>
      <input type="file" id="importfile" accept="application/json,.json,text/plain" class="hidden">
      <button class="btn danger block" data-act="reset" style="margin-top:10px">Начать заново</button>
    </div>

    ${standalone ? '' : `
    <h2>Установка на iPhone</h2>
    <div class="card small">
      1. Открой эту страницу в <b>Safari</b>.<br>
      2. Нажми <b>«Поделиться»</b> (квадрат со стрелкой).<br>
      3. Выбери <b>«На экран „Домой“»</b>.<br>
      <span class="muted">Приложение будет открываться на весь экран и работать без интернета.</span>
    </div>`}

    <h2>Как это работает</h2>
    <div class="card small muted">
      Каждый вечер отмечай подвиги и/или вручную начисляй очки параметрам.
      Чтобы параметр перешёл с уровня N на N+1, нужно 10×N очков: первые уровни даются быстро, дальше нужна регулярность.
      Уровень персонажа растёт от суммы всех очков. Серия — сколько дней подряд ты прокачивался.
      Подвиги, ручные отметки и ИИ-отчёт двигают счётчики достижений: книги, километры, знакомства и т.д.
    </div>
    <div class="ver">LEVEL UP · v3 · REACTOR</div>
  `;
}

/* ---------------------- Редакторы (шторки) ---------------------- */

const iconPicker = (cur) => `<div class="picker" id="icon-picker">${ICON_CHOICES.map((k) => `<button data-act="pick-icon" data-k="${k}" class="${cur === k ? 'sel' : ''}">${ico(k)}</button>`).join('')}</div><input type="hidden" id="pick-icon" value="${esc(cur)}">`;

function statEditor(id) {
  const s = id ? statById(id) : { id: '', name: '', icon: 'star', color: COLORS[S.stats.length % COLORS.length] };
  openSheet(`
    <h1>${id ? 'Параметр' : 'Новый параметр'}</h1>
    <label class="f">Название</label>
    <input type="text" id="s-name" value="${esc(s.name)}" maxlength="24" placeholder="Например, Креативность">
    <label class="f">Символ</label>
    ${iconPicker(s.icon)}
    <label class="f">Цвет</label>
    <div class="colors">${COLORS.map((c) => `<button data-act="pick-color" data-c="${c}" class="${s.color === c ? 'sel' : ''}" style="background:${c};color:${c}"></button>`).join('')}</div>
    <input type="hidden" id="s-color" value="${s.color}">
    <div class="row" style="margin-top:22px">
      ${id ? `<button class="btn danger" data-act="del-stat" data-id="${id}">Удалить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Отмена</button>
      <button class="btn primary grow" data-act="save-stat" data-id="${id || ''}">Сохранить</button>
    </div>
  `);
}

function qcRow(cid, v) {
  const c = counterById(cid);
  return `<div class="list-item" data-qc="${cid}">
    <div class="sico" style="color:${sphereById(c.sphere).color}">${ico(c.icon)}</div>
    <div class="grow"><div class="sn">${esc(c.name)}</div><div class="sx">${c.unit}</div></div>
    <div class="stepper">
      <button class="icon-btn" data-act="qc-dec" data-id="${cid}">−</button>
      <span class="val pos" id="qc-${cid}" data-v="${v}">${v}</span>
      <button class="icon-btn" data-act="qc-inc" data-id="${cid}">+</button>
    </div></div>`;
}

function questEditor(id) {
  const q = id ? S.quests.find((x) => x.id === id) : { id: '', name: '', icon: 'bolt', rewards: {}, c: {} };
  openSheet(`
    <h1>${id ? 'Подвиг' : 'Новый подвиг'}</h1>
    <label class="f">Название</label>
    <input type="text" id="q-name" value="${esc(q.name)}" maxlength="40" placeholder="Например, Холодный душ">
    <label class="f">Символ</label>
    ${iconPicker(q.icon)}
    <label class="f">Награда</label>
    ${S.stats.map((s) => {
      const v = q.rewards[s.id] || 0;
      return `
      <div class="list-item">
        <div class="sico" style="color:${s.color}">${ico(s.icon)}</div>
        <div class="grow sn">${esc(s.name)}</div>
        <div class="stepper">
          <button class="icon-btn" data-act="qr-dec" data-id="${s.id}">−</button>
          <span class="val ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}" id="qr-${s.id}" data-v="${v}">${v}</span>
          <button class="icon-btn" data-act="qr-inc" data-id="${s.id}">+</button>
        </div>
      </div>`;
    }).join('')}
    <label class="f">Счётчики достижений</label>
    <div id="qc-list">${Object.entries(q.c || {}).filter(([cid]) => counterById(cid)).map(([cid, v]) => qcRow(cid, v)).join('')}</div>
    <select id="qc-add" class="select">
      <option value="">＋ Привязать счётчик…</option>
      ${SPHERES.filter((sp) => sp.id !== 'system').map((sp) => `<optgroup label="${sp.name}">${counterList(S).filter((c) => c.sphere === sp.id).map((c) => `<option value="${c.id}">${esc(c.name)} (${c.unit})</option>`).join('')}</optgroup>`).join('')}
    </select>
    <div class="row" style="margin-top:22px">
      ${id ? `<button class="btn danger" data-act="del-quest" data-id="${id}">Удалить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Отмена</button>
      <button class="btn primary grow" data-act="save-quest" data-id="${id || ''}">Сохранить</button>
    </div>
  `);
}

/* ---------------------- Счётчики и вехи (шторки) ---------------------- */

function counterSheet(id) {
  const c = counterById(id);
  const sp = sphereById(c.sphere);
  const total = counterTotals()[id] || 0;
  const today = dayCounters(getDay(todayKey()))[id] || 0;
  const next = c.tiers.find((t) => total < t.goal);
  const big = ['км', 'ч'].includes(c.unit);
  openSheet(`
    <div class="row" style="gap:14px">
      <div class="sico" style="color:${sp.color};width:52px;height:52px">${ico(c.icon)}</div>
      <div class="grow"><h1 style="margin:0">${esc(c.name)}</h1><div class="sx">${sp.name}</div></div>
    </div>
    <div class="kpis" style="grid-template-columns:1fr 1fr">
      <div class="kpi"><b>${fmtNum(total)}</b><span>всего, ${c.unit}</span></div>
      <div class="kpi"><b>${fmtNum(today)}</b><span>сегодня</span></div>
    </div>
    <div class="small muted" style="margin:12px 2px">${next ? `До ступени «${esc(next.title)}»: ${fmtNum(round1(next.goal - total))} ${c.unit}` : 'Все ступени этой цепочки пройдены!'}</div>
    <label class="f">Добавить за сегодня</label>
    <div class="row qty">
      ${(big ? [1, 5, 10] : [1, 2, 5]).map((n) => `<button class="btn grow" data-act="counter-add" data-id="${id}" data-n="${n}">+${n}</button>`).join('')}
    </div>
    <div class="row" style="margin-top:8px">
      <input type="text" inputmode="decimal" id="counter-n" placeholder="Своё число, ${c.unit}">
      <button class="btn primary" data-act="counter-add" data-id="${id}" data-n="custom">Добавить</button>
    </div>
    ${(getDay(todayKey()) && (getDay(todayKey()).c || {})[id]) ? `<button class="btn danger block" data-act="counter-add" data-id="${id}" data-n="-1" style="margin-top:8px">−1 за сегодня</button>` : ''}
    <div class="tiers big">${c.tiers.map((t, i) => {
      const r = RARITY[Math.min(i, RARITY.length - 1)];
      return `<div class="tier ${total >= t.goal ? 'on' : ''}" style="--r:${r.color}"><span class="hx">${ico(total >= t.goal ? c.icon : 'sparkle')}</span><b>${fmtNum(t.goal)}</b><em>${esc(t.title)}</em></div>`;
    }).join('')}</div>
    ${c.desc ? `<div class="small muted" style="margin-top:14px">Что считается: ${esc(c.desc)}</div>` : ''}
    <div class="row" style="margin-top:16px">
      ${c.custom ? `<button class="btn grow" data-act="edit-cc" data-id="${id}">Изменить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Готово</button>
    </div>
  `);
}

function milestoneSheet(id) {
  const m = milestoneById(id);
  const date = milestoneDates()[id];
  openSheet(`
    <div class="center">
      <div class="ach ${date ? 'got' : 'locked'}" style="padding:6px 0 0"><div class="badge" style="width:84px;height:84px">${ico(m.icon)}</div></div>
      <h1 style="margin:8px 0 4px">${esc(m.name)}</h1>
      <div class="muted">${esc(m.desc || '')}</div>
      <div class="sx" style="margin-top:8px">${sphereById(m.sphere).name} · ${date ? 'открыто ' + shortDate(date) : 'ещё не открыто'}${m.custom ? ' · своё' : ''}</div>
    </div>
    <div class="row" style="margin-top:20px">
      ${m.custom ? `<button class="btn grow" data-act="edit-cm" data-id="${id}">Изменить</button>` : `<button class="btn grow" data-act="close-sheet">Закрыть</button>`}
      ${date ? `<button class="btn danger grow" data-act="rm-ms" data-id="${id}" data-sheet="1">Снять отметку</button>`
             : `<button class="btn primary grow" data-act="ms-done" data-id="${id}">${ico('check')} Выполнено сегодня</button>`}
    </div>
  `);
}

/* ---------------------- Свои достижения (редакторы) ---------------------- */

const sphereSelect = (cur) => `<select id="own-sphere" class="select">${SPHERES.filter((sp) => sp.id !== 'system')
  .map((sp) => `<option value="${sp.id}" ${sp.id === cur ? 'selected' : ''}>${sp.name}</option>`).join('')}</select>`;
const tierRow = (goal = '', title = '') => `<div class="tier-row" data-tr>
  <input type="text" inputmode="decimal" class="tg" value="${esc(goal)}" placeholder="Порог">
  <input type="text" class="tt" value="${esc(title)}" placeholder="Название ступени" maxlength="32">
  <button class="icon-btn" data-act="rm-tier-row" aria-label="Убрать">✕</button></div>`;

function customCounterEditor(id) {
  const c = id ? counterById(id) : { name: '', unit: 'раз', desc: '', icon: 'star', sphere: achSphere === 'system' ? 'body' : achSphere,
    tiers: [{ goal: 1, title: '' }, { goal: 10, title: '' }, { goal: 50, title: '' }] };
  openSheet(`
    <h1>${id ? 'Своя цепочка' : 'Новая цепочка'}</h1>
    <label class="f">Название</label>
    <input type="text" id="cc-name" value="${esc(c.name)}" maxlength="32" placeholder="Например, Жонглирование">
    <label class="f">Единица</label>
    <input type="text" id="cc-unit" value="${esc(c.unit)}" maxlength="12" placeholder="раз, км, ч, страниц…">
    <label class="f">Что считается (подсказка для ИИ)</label>
    <input type="text" id="cc-desc" value="${esc(c.desc || '')}" maxlength="120" placeholder="Например: каждая тренировка жонглирования">
    <label class="f">Сфера</label>
    ${sphereSelect(c.sphere)}
    <label class="f">Символ</label>
    ${iconPicker(c.icon)}
    <label class="f">Ступени (до 6)</label>
    <div id="tier-rows">${c.tiers.map((t) => tierRow(t.goal, t.title)).join('')}</div>
    <button class="btn sm" data-act="add-tier-row" style="margin-top:8px">＋ Ступень</button>
    <div class="row" style="margin-top:22px">
      ${id ? `<button class="btn danger" data-act="del-cc" data-id="${id}">Удалить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Отмена</button>
      <button class="btn primary grow" data-act="save-cc" data-id="${id || ''}">Сохранить</button>
    </div>
  `);
}

function customMilestoneEditor(id) {
  const m = id ? milestoneById(id) : { name: '', desc: '', icon: 'star', sphere: achSphere === 'system' ? 'body' : achSphere };
  openSheet(`
    <h1>${id ? 'Своя веха' : 'Новая веха'}</h1>
    <label class="f">Название</label>
    <input type="text" id="cm-name" value="${esc(m.name)}" maxlength="32" placeholder="Например, Научился жонглировать">
    <label class="f">Описание</label>
    <input type="text" id="cm-desc" value="${esc(m.desc || '')}" maxlength="120" placeholder="Например: жонглирую тремя мячами минуту без падений">
    <label class="f">Сфера</label>
    ${sphereSelect(m.sphere)}
    <label class="f">Символ</label>
    ${iconPicker(m.icon)}
    <div class="row" style="margin-top:22px">
      ${id ? `<button class="btn danger" data-act="del-cm" data-id="${id}">Удалить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Отмена</button>
      <button class="btn primary grow" data-act="save-cm" data-id="${id || ''}">Сохранить</button>
    </div>
  `);
}

function saveCustomCounter(id) {
  const name = $('#cc-name').value.trim();
  if (!name) { toast('Введи название'); return; }
  const unit = $('#cc-unit').value.trim() || 'раз';
  const seen = new Set();
  const tiers = [...document.querySelectorAll('#tier-rows [data-tr]')].map((row) => ({
    goal: round1(parseFloat(row.querySelector('.tg').value.replace(',', '.'))),
    title: row.querySelector('.tt').value.trim(),
  })).filter((t) => t.goal > 0 && !seen.has(t.goal) && seen.add(t.goal))
    .sort((a, b) => a.goal - b.goal).slice(0, 6)
    .map((t) => ({ goal: t.goal, title: t.title || `${name}: ${fmtNum(t.goal)} ${unit}` }));
  if (!tiers.length) { toast('Добавь хотя бы одну ступень с порогом'); return; }
  const data = { name, unit, desc: $('#cc-desc').value.trim(), sphere: $('#own-sphere').value, icon: $('#pick-icon').value || 'star', tiers, custom: true };
  closeSheet();
  mutate(() => {
    if (id) Object.assign(S.custom.counters.find((c) => c.id === id), data);
    else S.custom.counters.push({ id: uid('cc'), ...data });
  });
  achSphere = data.sphere;
  render(false);
}

function saveCustomMilestone(id) {
  const name = $('#cm-name').value.trim();
  if (!name) { toast('Введи название'); return; }
  const data = { name, desc: $('#cm-desc').value.trim(), sphere: $('#own-sphere').value, icon: $('#pick-icon').value || 'star', custom: true };
  closeSheet();
  mutate(() => {
    if (id) Object.assign(S.custom.milestones.find((m) => m.id === id), data);
    else S.custom.milestones.push({ id: uid('cm'), ...data });
  });
  achSphere = data.sphere;
  render(false);
}

function deleteCustomCounter(id) {
  if (!confirm('Удалить цепочку вместе с накопленным прогрессом?')) return;
  closeSheet();
  mutate(() => {
    S.custom.counters = S.custom.counters.filter((c) => c.id !== id);
    for (const k in S.log) {
      const d = S.log[k];
      if (d.c) delete d.c[id];
      for (const x of d.d || []) if (x.c) delete x.c[id];
    }
    for (const q of S.quests) if (q.c) delete q.c[id];
    for (const k of Object.keys(S.ach)) if (k.startsWith(`t_${id}_`)) delete S.ach[k];
  });
}

function deleteCustomMilestone(id) {
  if (!confirm('Удалить веху?')) return;
  closeSheet();
  mutate(() => {
    S.custom.milestones = S.custom.milestones.filter((m) => m.id !== id);
    for (const k in S.log) if (S.log[k].ms) S.log[k].ms = S.log[k].ms.filter((m) => m !== id);
    delete S.ach['m_' + id];
  });
}

/* ---------------------- ИИ-помощник ---------------------- */

function aiSettingsHTML() {
  const c = AI.cfg();
  const claude = c.provider === 'claude';
  return `<div class="card">
    <div class="small muted" style="margin-bottom:10px">Вечером расскажи (голосом или текстом), что сделал за день. ИИ сам начислит очки, отметит подвиги, счётчики и вехи, а ты подтвердишь.</div>
    <div class="seg">
      <button data-act="ai-provider" data-p="claude" class="${claude ? 'active' : ''}">Claude</button>
      <button data-act="ai-provider" data-p="custom" class="${claude ? '' : 'active'}">Свой сервер</button>
    </div>
    ${claude ? `
      <label class="f">API-ключ Claude</label>
      <input type="password" id="ai-claude-key" value="${esc(c.claudeKey)}" placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false">
      <label class="f">Модель</label>
      <select id="ai-claude-model" class="select">${AI.CLAUDE_MODELS.map(([id, label]) => `<option value="${id}" ${c.claudeModel === id ? 'selected' : ''}>${label}</option>`).join('')}</select>
      <div class="small muted" style="margin-top:10px">Ключ создаётся на platform.claude.com → API Keys. Он хранится только на этом телефоне и не попадает в экспорт.</div>
    ` : `
      <label class="f">Адрес API</label>
      <input type="text" id="ai-base" value="${esc(c.baseUrl)}" placeholder="https://мой-сервер:11434/v1" autocomplete="off" autocapitalize="off" spellcheck="false">
      <label class="f">Модель</label>
      <input type="text" id="ai-model" value="${esc(c.model)}" placeholder="hermes3" autocomplete="off" autocapitalize="off" spellcheck="false">
      <label class="f">Ключ доступа (если нужен)</label>
      <input type="password" id="ai-key" value="${esc(c.apiKey)}" placeholder="необязательно" autocomplete="off">
      <div class="small muted" style="margin-top:10px">Нужен OpenAI-совместимый API (/v1/chat/completions) по HTTPS с разрешённым CORS: Ollama, vLLM, llama.cpp, LM Studio и т.п.</div>
    `}
    <div class="row" style="margin-top:12px">
      <button class="btn grow" data-act="ai-test">${ico('bolt')} Проверить связь</button>
    </div>
    <div class="small" id="ai-status" style="margin-top:8px"></div>
  </div>`;
}

let ai = { phase: 'input', text: '', result: null, sel: {}, error: '' };
let rec = null;

function aiOpen() {
  if (!AI.ready()) {
    openSheet(`
      <h1>ИИ ещё не подключён</h1>
      <div class="muted">Добавь API-ключ Claude или адрес своего сервера в настройках — и рассказывай о дне голосом.</div>
      <div class="row" style="margin-top:20px">
        <button class="btn grow" data-act="close-sheet">Позже</button>
        <button class="btn primary grow" data-act="ai-setup">Открыть настройки</button>
      </div>`);
    return;
  }
  ai = { ...ai, phase: 'input', result: null, error: '' };
  aiRender();
}

function aiRender() {
  const head = `<div class="sx" style="margin-bottom:10px">${humanDate(curDate)} · ${esc(AI.providerName())}</div>`;
  if (ai.phase === 'input') {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    openSheet(`
      <h1>Отчёт за день</h1>${head}
      <textarea id="ai-text" style="min-height:150px" placeholder="Например: утром пробежал 6 км, потом 3 часа глубокой работы над проектом, вечером дочитал «Дюну» и познакомился с новым соседом.">${esc(ai.text)}</textarea>
      <div class="row" style="margin-top:10px">
        ${SR ? `<button class="icon-btn mic ${rec ? 'rec' : ''}" data-act="ai-mic" aria-label="Диктовка">${ico('mic')}</button>` : ''}
        <span class="small muted grow" id="ai-mic-hint">${SR ? (rec ? 'Слушаю… нажми ещё раз, чтобы остановить' : 'Нажми на микрофон и говори') : 'Для голосового ввода нажми микрофон на клавиатуре iPhone'}</span>
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn grow" data-act="close-sheet">Отмена</button>
        <button class="btn primary grow" data-act="ai-send">${ico('bolt')} Разобрать день</button>
      </div>`);
  } else if (ai.phase === 'loading') {
    openSheet(`
      <div class="ai-loading">
        ${reactorHTML('atom', '')}
        <div class="t">Ядро анализирует день<span class="dots"><i>.</i><i>.</i><i>.</i></span></div>
        <div class="small muted">${esc(AI.providerName())}</div>
      </div>`);
    $('#sheet-card .reactor').classList.add('fast');
  } else if (ai.phase === 'error') {
    openSheet(`
      <h1>Не получилось</h1>${head}
      <div class="card" style="border-color:rgba(255,77,109,.5)">${esc(ai.error)}</div>
      <div class="row" style="margin-top:16px">
        <button class="btn grow" data-act="ai-back">Назад</button>
        <button class="btn primary grow" data-act="ai-send">Повторить</button>
      </div>`);
  } else if (ai.phase === 'result') {
    openSheet(aiResultHTML(head));
  }
}

function aiResultHTML(head) {
  const r = ai.result;
  const row = (key, iconHTML, title, sub, color) => `
    <button class="ai-row ${ai.sel[key] ? 'on' : ''}" data-act="ai-toggle" data-k="${key}">
      <span class="sico" style="color:${color}">${iconHTML}</span>
      <span class="grow"><span class="t">${title}</span>${sub ? `<span class="s">${sub}</span>` : ''}</span>
      <span class="ck">${ico('check')}</span>
    </button>`;
  const qs = r.quests.map((x) => { const q = S.quests.find((y) => y.id === x.id);
    return row('q:' + x.id, ico(q.icon), esc(q.name) + (x.count > 1 ? ' ×' + x.count : ''), rewardsHTML(Object.fromEntries(Object.entries(q.rewards).map(([k, v]) => [k, v * x.count]))), '#ff8a5a'); }).join('');
  const st = r.stats.map((x) => { const s = statById(x.id);
    return row('s:' + x.id, ico(s.icon), `${esc(s.name)} <b style="color:${s.color}">${sign(x.points)}</b>`, esc(x.reason), s.color); }).join('');
  const cs = r.counters.map((x) => { const c = counterById(x.id);
    return row('c:' + x.id, ico(c.icon), `${esc(c.name)} <b style="color:${sphereById(c.sphere).color}">+${fmtNum(x.amount)} ${c.unit}</b>`, esc(x.reason), sphereById(c.sphere).color); }).join('');
  const ms = r.milestones.map((x) => { const m = milestoneById(x.id);
    return row('m:' + x.id, ico(m.icon), `Веха: ${esc(m.name)}`, esc(x.reason || m.desc), 'var(--am)'); }).join('');
  const empty = !qs && !st && !cs && !ms;
  return `
    <h1>Отчёт разобран</h1>${head}
    ${r.summary ? `<div class="card sweep ai-sum">${ico('sparkle')}<span>${esc(r.summary)}</span></div>` : ''}
    ${qs ? `<h2>Подвиги</h2>${qs}` : ''}
    ${st ? `<h2>Очки параметров</h2>${st}` : ''}
    ${cs ? `<h2>Счётчики достижений</h2>${cs}` : ''}
    ${ms ? `<h2>Вехи</h2>${ms}` : ''}
    ${empty ? '<div class="empty">Ничего не нашлось для начисления — попробуй рассказать подробнее.</div>' : ''}
    <h2>Заметка дня</h2>
    <textarea id="ai-note">${esc(r.note)}</textarea>
    <div class="row" style="margin-top:16px">
      <button class="btn grow" data-act="ai-back">Изменить</button>
      <button class="btn primary grow" data-act="ai-apply">${ico('bolt')} Применить</button>
    </div>`;
}

async function aiSend() {
  const ta = $('#ai-text');
  if (ta) ai.text = ta.value;
  if (!ai.text.trim()) { toast('Расскажи, что ты сделал за день'); return; }
  micStop();
  ai.phase = 'loading';
  aiRender();
  SFX.play('scan');
  const day = getDay(curDate);
  const already = [];
  if (day) {
    (day.d || []).forEach((x) => already.push('подвиг ' + x.n));
    S.stats.forEach((st) => { if ((day.m || {})[st.id]) already.push(`${st.name} ${sign(day.m[st.id])}`); });
    Object.entries(day.c || {}).forEach(([id, v]) => counterById(id) && already.push(`${counterById(id).name} +${v}`));
    (day.ms || []).forEach((id) => milestoneById(id) && already.push('веха ' + milestoneById(id).name));
  }
  const d = parseKey(curDate);
  try {
    const result = await AI.analyze(S, ai.text, {
      dateLabel: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      already: already.join('; '),
      unlocked: Object.keys(milestoneDates()),
    });
    ai.result = result;
    ai.sel = {};
    result.quests.forEach((x) => { ai.sel['q:' + x.id] = true; });
    result.stats.forEach((x) => { ai.sel['s:' + x.id] = true; });
    result.counters.forEach((x) => { ai.sel['c:' + x.id] = true; });
    result.milestones.forEach((x) => { ai.sel['m:' + x.id] = true; });
    ai.phase = 'result';
    SFX.play('confirm');
  } catch (e) {
    ai.phase = 'error';
    ai.error = e && e.message ? e.message : String(e);
    SFX.play('error');
  }
  if (!$('#sheet').classList.contains('hidden')) aiRender();
}

function aiApply() {
  const r = ai.result;
  const note = ($('#ai-note') || {}).value || '';
  const gained = {};
  mutate(() => {
    const day = ensureDay(curDate);
    r.quests.forEach((x) => {
      if (!ai.sel['q:' + x.id]) return;
      const q = S.quests.find((y) => y.id === x.id);
      for (let i = 0; i < x.count; i++) day.d.push({ q: q.id, n: q.name, i: q.icon, r: clone(q.rewards), c: clone(q.c || {}) });
      Object.entries(q.rewards).forEach(([k, v]) => { gained[k] = (gained[k] || 0) + v * x.count; });
    });
    r.stats.forEach((x) => {
      if (!ai.sel['s:' + x.id]) return;
      day.m[x.id] = clamp((day.m[x.id] || 0) + x.points, -50, 99);
      if (!day.m[x.id]) delete day.m[x.id];
      gained[x.id] = (gained[x.id] || 0) + x.points;
    });
    r.counters.forEach((x) => { if (ai.sel['c:' + x.id]) day.c[x.id] = round1((day.c[x.id] || 0) + x.amount); });
    r.milestones.forEach((x) => { if (ai.sel['m:' + x.id] && !day.ms.includes(x.id)) day.ms.push(x.id); });
    if (note.trim()) day.note = day.note && day.note.trim() ? day.note.trim() + '\n' + note.trim() : note.trim();
  });
  closeSheet();
  ai = { phase: 'input', text: '', result: null, sel: {}, error: '' };
  SFX.play('quest');
  const x = innerWidth / 2, y = innerHeight * 0.32;
  burst(x, y, 14);
  floats(x, y, Object.entries(gained).filter(([id, v]) => v && statById(id)).slice(0, 5)
    .map(([id, v]) => ({ icon: statById(id).icon, text: sign(v), color: statById(id).color })));
  const dt = $('#daytotal'); if (dt) dt.classList.add('bump');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Голосовой ввод (Web Speech API), если браузер его поддерживает.
function micToggle() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  if (rec) { micStop(); return; }
  const ta = $('#ai-text');
  const base = ta && ta.value.trim() ? ta.value.trim() + ' ' : '';
  try {
    rec = new SR();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      ai.text = base + t;
      const el = $('#ai-text'); if (el) el.value = ai.text;
    };
    rec.onerror = (e) => {
      const h = $('#ai-mic-hint');
      if (h) h.textContent = e.error === 'not-allowed' ? 'Нет доступа к микрофону — разреши его в настройках Safari' : 'Диктовка недоступна, используй микрофон на клавиатуре';
    };
    rec.onend = () => { rec = null; const b = $('[data-act=ai-mic]'); if (b) b.classList.remove('rec'); };
    rec.start();
    const b = $('[data-act=ai-mic]'); if (b) b.classList.add('rec');
    const h = $('#ai-mic-hint'); if (h) h.textContent = 'Слушаю… нажми ещё раз, чтобы остановить';
  } catch (e) { rec = null; }
}
function micStop() { if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } rec = null; } }

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
      S = hydrate(data);
      save();
      toast('Данные восстановлены', 'gold', 'download');
      render(true);
    } catch (e) {
      toast('Файл не похож на резервную копию Level Up');
    }
  };
  reader.readAsText(file);
}

/* ---------------------- Обработчики ---------------------- */

function go(t) { tab = t; render(true); window.scrollTo(0, 0); }

document.addEventListener('click', (e) => {
  const tb = e.target.closest('#tabbar button');
  if (tb) {
    SFX.play('tab');
    if (tb.dataset.tab === 'day') curDate = todayKey();
    go(tb.dataset.tab);
    return;
  }
  if (e.target.id === 'sheet') { closeSheet(); return; }

  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  const snd = act in SOUND_FOR ? SOUND_FOR[act] : 'tap';
  if (snd) SFX.play(snd);

  switch (act) {
    case 'go-today': curDate = todayKey(); go('day'); break;
    case 'prev-day': curDate = addDays(curDate, -1); render(true); break;
    case 'next-day': if (curDate < todayKey()) { curDate = addDays(curDate, 1); render(true); } break;

    case 'inc':
    case 'dec': {
      const st = statById(id);
      const d = act === 'inc' ? 1 : -1;
      const [x, y] = centerOf($('#val-' + id));
      mutate(() => {
        const day = ensureDay(curDate);
        day.m[id] = clamp((day.m[id] || 0) + d, -50, 99);
        if (!day.m[id]) delete day.m[id];
      });
      ['#val-' + id, '#daytotal'].forEach((s) => { const n = $(s); if (n) n.classList.add('bump'); });
      fx('float', x, y - 10, `color:${d > 0 ? st.color : 'var(--bad)'}`, sign(d), 1200);
      if (d > 0) burst(x, y, 6);
      break;
    }
    case 'quest': {
      const q = S.quests.find((x) => x.id === id);
      if (!q) break;
      const [x, y] = [e.clientX || centerOf(el)[0], e.clientY || centerOf(el)[1]];
      mutate(() => { ensureDay(curDate).d.push({ q: q.id, n: q.name, i: q.icon, r: clone(q.rewards), c: clone(q.c || {}) }); });
      const card = $(`[data-act=quest][data-id="${id}"]`);
      if (card) { card.classList.add('hit'); }
      const dt = $('#daytotal'); if (dt) dt.classList.add('bump');
      burst(x, y, 12);
      floats(x, y - 20, Object.entries(q.rewards).filter(([sid, v]) => v && statById(sid))
        .map(([sid, v]) => ({ icon: statById(sid).icon, text: sign(v), color: statById(sid).color })));
      break;
    }
    case 'undo-quest':
      mutate(() => { ensureDay(curDate).d.splice(Number(el.dataset.idx), 1); });
      break;
    case 'open-day': curDate = el.dataset.k; go('day'); break;
    case 'range': histRange = Number(el.dataset.r); render(true); break;
    case 'avatar': S.profile.avatar = el.dataset.a; save(); render(false); break;
    case 'close-lu': { const lu = el.closest('.lu'); lu.style.transition = 'opacity .3s'; lu.style.opacity = '0'; setTimeout(() => lu.remove(), 300); break; }
    case 'close-sheet': closeSheet(); break;

    case 'pick-icon':
      document.querySelectorAll('#icon-picker button').forEach((b) => b.classList.toggle('sel', b === el));
      $('#pick-icon').value = el.dataset.k;
      break;
    case 'edit-stat': statEditor(id); break;
    case 'add-stat': statEditor(null); break;
    case 'pick-color':
      document.querySelectorAll('.colors button').forEach((b) => b.classList.toggle('sel', b === el));
      $('#s-color').value = el.dataset.c;
      break;
    case 'save-stat': {
      const name = $('#s-name').value.trim();
      if (!name) { toast('Введите название'); break; }
      const icon = $('#pick-icon').value || 'star';
      const color = $('#s-color').value;
      if (id) Object.assign(statById(id), { name, icon, color });
      else S.stats.push({ id: uid('s'), name, icon, color });
      save(); closeSheet(); render(false);
      break;
    }
    case 'del-stat':
      if (confirm('Удалить параметр? Накопленные очки этого параметра перестанут учитываться.')) {
        S.stats = S.stats.filter((s) => s.id !== id);
        save(); closeSheet(); render(false);
      }
      break;

    case 'edit-quest': questEditor(id); break;
    case 'add-quest': questEditor(null); break;
    case 'qr-inc':
    case 'qr-dec': {
      const v = $('#qr-' + id);
      const n = clamp(Number(v.dataset.v) + (act === 'qr-inc' ? 1 : -1), -20, 20);
      v.dataset.v = n; v.textContent = n;
      v.className = 'val bump ' + (n > 0 ? 'pos' : n < 0 ? 'neg' : '');
      void v.offsetWidth;
      break;
    }
    case 'save-quest': {
      const name = $('#q-name').value.trim();
      if (!name) { toast('Введите название'); break; }
      const icon = $('#pick-icon').value || 'bolt';
      const rewards = {};
      S.stats.forEach((s) => { const n = Number($('#qr-' + s.id).dataset.v); if (n) rewards[s.id] = n; });
      const c = {};
      document.querySelectorAll('#qc-list [data-qc]').forEach((row) => { const n = Number($('#qc-' + row.dataset.qc).dataset.v); if (n > 0) c[row.dataset.qc] = n; });
      if (id) Object.assign(S.quests.find((x) => x.id === id), { name, icon, rewards, c });
      else S.quests.push({ id: uid('q'), name, icon, rewards, c });
      save(); closeSheet(); render(false);
      break;
    }
    case 'del-quest':
      if (confirm('Удалить подвиг? Уже начисленные очки сохранятся.')) {
        S.quests = S.quests.filter((q) => q.id !== id);
        save(); closeSheet(); render(false);
      }
      break;

    case 'qc-inc':
    case 'qc-dec': {
      const v = $('#qc-' + id);
      const n = clamp(Number(v.dataset.v) + (act === 'qc-inc' ? 1 : -1), 0, 100);
      if (!n) { v.closest('[data-qc]').remove(); break; }
      v.dataset.v = n; v.textContent = n;
      v.classList.remove('bump'); void v.offsetWidth; v.classList.add('bump');
      break;
    }

    /* --- Достижения --- */
    case 'sphere':
      achSphere = el.dataset.s;
      render(true);
      { const chip = $(`.spheres [data-s="${achSphere}"]`); if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest' }); }
      break;
    case 'counter': counterSheet(id); break;
    case 'counter-add': {
      let n = el.dataset.n === 'custom' ? parseFloat(($('#counter-n').value || '').replace(',', '.')) : Number(el.dataset.n);
      if (!n || !isFinite(n)) { toast('Введи число'); break; }
      n = clamp(round1(n), -1000, 1000);
      const [x, y] = centerOf(el);
      mutate(() => {
        const day = ensureDay(todayKey());
        day.c[id] = round1((day.c[id] || 0) + n);
        if (day.c[id] <= 0) delete day.c[id];
      });
      counterSheet(id);
      if (n > 0) { burst(x, y, 10); fx('float', x, y - 16, `color:${sphereById(counterById(id).sphere).color}`, '+' + fmtNum(n), 1200); }
      break;
    }
    case 'tier': {
      const c = counterById(id), i = Number(el.dataset.i), t = c.tiers[i];
      toast(`«${t.title}» · ${RARITY[Math.min(i, RARITY.length - 1)].name} · ${fmtNum(t.goal)} ${c.unit}`, '', c.icon);
      break;
    }
    case 'milestone': milestoneSheet(id); break;
    case 'add-cc': customCounterEditor(null); break;
    case 'edit-cc': customCounterEditor(id); break;
    case 'save-cc': saveCustomCounter(id); break;
    case 'del-cc': deleteCustomCounter(id); break;
    case 'add-cm': customMilestoneEditor(null); break;
    case 'edit-cm': customMilestoneEditor(id); break;
    case 'save-cm': saveCustomMilestone(id); break;
    case 'del-cm': deleteCustomMilestone(id); break;
    case 'add-tier-row':
      if (document.querySelectorAll('#tier-rows [data-tr]').length >= 6) { toast('Максимум 6 ступеней'); break; }
      $('#tier-rows').insertAdjacentHTML('beforeend', tierRow());
      break;
    case 'rm-tier-row': el.closest('[data-tr]').remove(); break;
    case 'ms-done': {
      closeSheet();
      mutate(() => { const day = ensureDay(todayKey()); if (!day.ms.includes(id)) day.ms.push(id); });
      burst(innerWidth / 2, innerHeight * 0.4, 14);
      break;
    }
    case 'rm-ms':
      if (el.dataset.sheet) closeSheet();
      mutate(() => { for (const k in S.log) if (S.log[k].ms) S.log[k].ms = S.log[k].ms.filter((m) => m !== id); });
      break;
    case 'rm-counter':
      mutate(() => { delete ensureDay(curDate).c[id]; });
      break;

    /* --- ИИ --- */
    case 'ai-open': aiOpen(); break;
    case 'ai-setup': closeSheet(); go('settings'); setTimeout(() => { const h = [...document.querySelectorAll('#view h2')].find((x) => x.textContent.includes('ИИ')); if (h) h.scrollIntoView({ behavior: 'smooth' }); }, 100); break;
    case 'ai-send': aiSend(); break;
    case 'ai-back': ai.phase = 'input'; aiRender(); break;
    case 'ai-apply': aiApply(); break;
    case 'ai-mic': micToggle(); break;
    case 'ai-toggle':
      ai.sel[el.dataset.k] = !ai.sel[el.dataset.k];
      el.classList.toggle('on', !!ai.sel[el.dataset.k]);
      break;
    case 'ai-provider': AI.setCfg({ provider: el.dataset.p }); render(false); break;
    case 'ai-test': {
      const st = $('#ai-status');
      st.className = 'small muted'; st.textContent = 'Проверяю…';
      AI.test().then((msg) => { st.className = 'small ok'; st.textContent = '✓ ' + msg; SFX.play('confirm'); })
        .catch((err) => { st.className = 'small err'; st.textContent = '✕ ' + (err.message || err); SFX.play('error'); });
      break;
    }
    case 'sound':
      S.settings.sound = !S.settings.sound;
      SFX.enabled = S.settings.sound;
      save(); render(false);
      if (S.settings.sound) SFX.play('confirm');
      break;

    case 'export': doExport(); break;
    case 'import': $('#importfile').click(); break;
    case 'reset':
      if (confirm('Удалить весь прогресс и начать заново? Это нельзя отменить.')) {
        S = defaultState(); save(); go('hero');
      }
      break;
  }
});

const SOUND_FOR = {
  inc: 'zap', dec: 'down', quest: 'quest', 'undo-quest': 'down', 'rm-ms': 'down', 'rm-counter': 'down',
  'counter-add': 'zap', 'ms-done': null, 'ai-send': null, 'ai-apply': null, 'ai-test': null, sound: null, 'close-lu': 'tap',
};

document.addEventListener('input', (e) => {
  const aiField = { 'ai-claude-key': 'claudeKey', 'ai-base': 'baseUrl', 'ai-model': 'model', 'ai-key': 'apiKey' }[e.target.id];
  if (aiField) { AI.setCfg({ [aiField]: e.target.value }); return; }
  if (e.target.id === 'ai-text') { ai.text = e.target.value; return; }
  if (e.target.id === 'note') {
    ensureDay(curDate).note = e.target.value;
    save();
  } else if (e.target.id === 'pname') {
    S.profile.name = e.target.value.trim() || 'Герой';
    save();
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'note') { checkAchievements(false); save(); }
  if (e.target.id === 'importfile' && e.target.files[0]) { doImport(e.target.files[0]); e.target.value = ''; }
  if (e.target.id === 'ai-claude-model') AI.setCfg({ claudeModel: e.target.value });
  if (e.target.id === 'qc-add' && e.target.value) {
    const cid = e.target.value;
    if (!$('#qc-' + cid)) $('#qc-list').insertAdjacentHTML('beforeend', qcRow(cid, 1));
    e.target.value = '';
  }
});

// При возвращении в приложение после полуночи — обновить «сегодня».
let lastToday = todayKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayKey() !== lastToday) {
    if (curDate === lastToday) curDate = todayKey();
    lastToday = todayKey();
    render(false);
  }
});

/* ---------------------- Старт ---------------------- */

$('#tabbar').innerHTML = TABS.map(([k, label, icon]) => `<button data-tab="${k}">${ico(icon)}<span>${label}</span></button>`).join('');
SFX.enabled = S.settings.sound;
checkAchievements(true);
save();
render(true);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
