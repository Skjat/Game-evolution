'use strict';

/* =====================================================================
   Level Up — прокачка себя как RPG-персонажа. Тема «Алый реактор».
   Все данные хранятся локально на устройстве (localStorage).
   ===================================================================== */

const STORAGE_KEY = 'lvlup.v1';
const APP_VERSION = 26;
const EDIT_BACK_DAYS = 1;    // править можно сегодня и вчера; более ранние дни — только чтение
const NIGHT_HOUR = 4;        // до 4 утра «Итоги» открываются на вчерашнем дне
const COURT_POINTS = 3;   // штраф суда за утверждённый донос / бонус за похвалу — в каждый связанный параметр (до двух)   // совпадает с номером в sw.js (lvlup-vN)
const QUEST_MAX_REWARD = 5;   // максимум очков подвига в один параметр
const QUEST_DAY_LIMIT = 3;    // один подвиг — не больше 3 раз за день
const DATA_VERSION = 5;

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
  burger: '<path d="M4 10a8 5.5 0 0 1 16 0z M3 13h18 M4 16h16v1a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z M9 7h.01M13 6h.01M15 8h.01"/>',
  candy: '<circle cx="12" cy="12" r="4"/><path d="M8.5 10L4 7l1 5-1 5 4.5-3M15.5 10L20 7l-1 5 1 5-4.5-3"/>',
  bottle: '<path d="M10 2h4v4l2 3v13H8V9l2-3z M8 13h8"/>',
  cigarette: '<path d="M2 15h14v4H2z M16 15h2v4h-2 M20 15v4 M18 11c0-2 2-2 2-4s-2-2-2-4"/>',
  couch: '<path d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3 M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2z M4 18v2M20 18v2"/>',
  cart: '<path d="M3 4h2l3 11h10l3-8H6.5"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
  arrowDown: '<path d="M12 4v16M5 13l7 7 7-7"/>',
  // ---- Минимал ----
  kettlebell: '<path d="M8.5 9.5V8a3.5 3.5 0 0 1 7 0v1.5"/><path d="M6 15a6 6 0 0 1 12 0c0 2.2-.8 4-2 5H8c-1.2-1-2-2.8-2-5z"/>',
  runner: '<circle cx="15" cy="4.5" r="1.8"/><path d="M8 10.5L13 8l3 3.5 3 .5M13 8l-2 6 3 3-1 4.5M11 14l-3 3H4.5"/>',
  heartPulse: '<path d="M12 20.5s-8.5-5-8.5-11A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 8.5 2.7c0 6-8.5 11-8.5 11z"/><path d="M3.5 12.5h4l1.5-2.5 2.5 5 1.5-2.5h7.5"/>',
  bulb: '<path d="M9 18h6M10 21.5h4M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.7v.5h6V16c0-.7.3-1.3.8-1.7A6.5 6.5 0 0 0 12 2.5z"/>',
  owl: '<path d="M6 3.5l2.5 2.5h7L18 3.5V13a6 6 0 0 1-12 0z"/><circle cx="9.5" cy="10" r="2"/><circle cx="14.5" cy="10" r="2"/><path d="M11.2 13.2l.8 1 .8-1M9 21l1-2M15 21l-1-2"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>',
  checklist: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M7.5 9l1.5 1.5L11.5 8M7.5 15l1.5 1.5 2.5-2.5M14 9.5h3M14 15.5h3"/>',
  bars: '<path d="M4 20.5h16M7 16.5v-4M12 16.5V7M17 16.5V10"/>',
  sliders: '<path d="M4 6h10M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',
  refresh: '<path d="M20 11A8 8 0 0 0 5.3 6.7L4 8M4 4v4h4M4 13a8 8 0 0 0 14.7 4.3L20 16M20 20v-4h-4"/>',
  // ---- Дзен ----
  peak: '<path d="M2 20L9.5 7l4 6 2.5-3.5L22 20z M7.3 10.8l2.2 1.4 1.6-1.2"/>',
  wave: '<path d="M2 8.5c2.5-3 5-3 7.5 0s5 3 7.5 0c1.6-1.8 3.4-2 5-1M2 15.5c2.5-3 5-3 7.5 0s5 3 7.5 0c1.6-1.8 3.4-2 5-1"/>',
  bamboo: '<path d="M10 2v20M8.5 8h3M8.5 15h3"/><path d="M10 8c2-2 5-3 8-2.5-1.5 2.5-4.5 3.5-8 2.5zM10 15c-1.5-2-4-3-6.5-2.5 1.2 2.2 3.5 3 6.5 2.5z"/>',
  lantern: '<path d="M12 1.5v2M9 3.5h6M8.5 3.5C5.8 5.5 5.8 16 8.5 18h7c2.7-2 2.7-12.5 0-14.5zM6.6 8.5h10.8M6.6 13h10.8M9.5 18v2.5h5V18"/>',
  enso: '<path d="M17.8 17.6A8 8 0 1 1 20 11"/><path d="M20 11c.3 1.2.1 2.4-.6 3.3"/>',
  bloom: [0, 72, 144, 216, 288].map((r) => `<path transform="rotate(${r} 12 12)" d="M12 12c-2.2-2-2.8-5-1.2-7.8.4.6.8.9 1.2.9s.8-.3 1.2-.9c1.6 2.8 1 5.8-1.2 7.8z"/>`).join('') + '<circle cx="12" cy="12" r=".8"/>',
  cairn: '<ellipse cx="12" cy="19" rx="7.5" ry="2.6"/><ellipse cx="12" cy="13.3" rx="5.2" ry="2.4"/><ellipse cx="12" cy="8.2" rx="3.4" ry="2"/><ellipse cx="12" cy="4.3" rx="1.9" ry="1.3"/>',
  quill: '<path d="M20.5 3C12.5 4 7.5 9 5.5 17l-1.5 4 4-1.5c8-2 12-7 13-15.5zM5.5 17c3-1.5 6-4.5 8-8.5"/>',
  // ---- Чёрный гримуар ----
  greatsword: '<path d="M9 2h6v12.5l-3 3.5-3-3.5z M12 5v9M4.5 15h15M12 18v4"/>',
  tornado: '<path d="M3 4.5h18M5 8.5h13M7.5 12.5h9M9.5 16.5h5M11 20.5h2"/>',
  ward: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M12 7l2.8 4.5L12 16l-2.8-4.5z"/>',
  tome: '<path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5z M8 3v18"/><path d="M13.5 7.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z"/>',
  sigil: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="6.5"/><path d="M12 5.5l5.6 9.75H6.4z M12 2.5v3M3.8 16.7l2.6-1.45M20.2 16.7l-2.6-1.45"/>',
  bull: '<path d="M3 4.5c0 4 2.5 6.5 6 6.5M21 4.5c0 4-2.5 6.5-6 6.5"/><path d="M7.5 9.5h9l-1 7.5-3.5 3.5-3.5-3.5z"/><path d="M10 13.5h.01M14 13.5h.01M10.5 18h3"/>',
  wand: '<path d="M3.5 20.5L15 9M13.3 7.3l3.4 3.4"/><path d="M18 2l.9 2.1 2.1.9-2.1.9L18 8l-.9-2.1L15 5l2.1-.9zM8 3l.5 1.5L10 5l-1.5.5L8 7l-.5-1.5L6 5l1.5-.5z"/>',
  banner: '<path d="M5 21.5V2.5M5 3.5h14l-3.5 4.5 3.5 4.5H5"/>',
  clover: [0, 72, 144, 216, 288].map((r) => `<path transform="rotate(${r} 12 11)" d="M12 11c-1.7-1.4-3.4-3.3-2.2-4.8.8-1 2.2-.6 2.2.5 0-1.1 1.4-1.5 2.2-.5 1.2 1.5-.5 3.4-2.2 4.8z"/>`).join('') + '<path d="M12 11c.6 3.5 1.8 6.5 4 10"/>',
  snowflake: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5"/>',
  planet: '<circle cx="12" cy="12" r="5.5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-20 12 12)"/>',
  terminal: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M6.5 9l3 3-3 3M12 15h5"/>',
  sprout: '<path d="M12 21v-8M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-3 2.5-5 6-5 0 3-2.5 5-6 5z"/>',
};
// Пиксельные иконки темы «Терминал»: сетка 12×12, клетка 2×2.
const PIXEL_ICONS = {
  px_str: ['............', '............', '.##......##.', '.##......##.', '###......###', '############', '############', '###......###', '.##......##.', '.##......##.', '............', '............'],
  px_agi: ['......###...', '.....###....', '....###.....', '...###......', '..########..', '.......###..', '......###...', '.....###....', '....###.....', '...##.......', '..#.........', '............'],
  px_end: ['............', '............', '##########..', '#........#..', '#.##.##..###', '#.##.##..###', '#.##.##..###', '#.##.##..###', '#........#..', '##########..', '............', '............'],
  px_int: ['....#..#....', '....#..#....', '..########..', '###......###', '..#.####.#..', '..#.#..#.#..', '..#.#..#.#..', '..#.####.#..', '###......###', '..########..', '....#..#....', '....#..#....'],
  px_wis: ['............', '............', '....####....', '..##....##..', '.#...##...#.', '#...####...#', '#...####...#', '.#...##...#.', '..##....##..', '....####....', '............', '............'],
  px_cha: ['..........##', '..........##', '..........##', '.......##.##', '.......##.##', '.......##.##', '....##.##.##', '....##.##.##', '....##.##.##', '.##.##.##.##', '.##.##.##.##', '.##.##.##.##'],
  px_hero: ['....####....', '...######...', '...######...', '...######...', '....####....', '............', '..########..', '.##########.', '.##########.', '.##########.', '.##########.', '............'],
  px_day: ['............', '.#..........', '.##.........', '..##........', '...##.......', '....##......', '...##.......', '..##........', '.##.........', '.#....######', '......######', '............'],
  px_hist: ['............', '.........##.', '.........##.', '.....##..##.', '.....##..##.', '.....##..##.', '.##..##..##.', '.##..##..##.', '.##..##..##.', '.##..##..##.', '############', '............'],
  px_ach: ['.##########.', '#.########.#', '#.########.#', '#.########.#', '.#.######.#.', '...######...', '....####....', '.....##.....', '.....##.....', '....####....', '...######...', '............'],
  px_league: ['............', '..##....##..', '.####..####.', '.####..####.', '..##....##..', '............', '.####..####.', '#####..#####', '#####..#####', '#####..#####', '............', '............'],
  px_gear: ['.....##.....', '.##..##..##.', '.##########.', '..##....##..', '..#......#..', '####....####', '####....####', '..#......#..', '..##....##..', '.##########.', '.##..##..##.', '.....##.....'],
  px_act: ['............', '...#........', '...###......', '...#####....', '...#######..', '...########.', '...########.', '...#######..', '...#####....', '...###......', '...#........', '............'],
  px_magic: ['.....##.....', '.....##.....', '.....##.....', '....####....', '...######...', '############', '############', '...######...', '....####....', '.....##.....', '.....##.....', '.....##.....'],
};
for (const [k, rows] of Object.entries(PIXEL_ICONS)) {
  let d = '';
  rows.forEach((row, y) => row.replace(/#+/g, (m, x) => { d += `M${x * 2} ${y * 2}h${m.length * 2}v2h-${m.length * 2}z`; return m; }));
  ICONS[k] = `<path class="px" fill="currentColor" stroke="none" d="${d}"/>`;
}
const ICON_CHOICES = ['sword', 'swift', 'shield', 'hex', 'eye', 'crown', 'flame', 'bolt', 'star', 'gem', 'atom', 'moon', 'sun',
  'dumbbell', 'wind', 'lotus', 'ball', 'book', 'cap', 'candle', 'link', 'mic', 'leaf', 'heart', 'brush', 'note', 'coin',
  'target', 'rocket', 'compass', 'globe', 'pen', 'home', 'skull', 'claw', 'seed', 'mountain', 'bike', 'swim', 'drop',
  'chat', 'users', 'hourglass', 'briefcase', 'wallet', 'pot', 'phoneOff', 'tree', 'gift', 'camera', 'plane', 'sparkle',
  'burger', 'candy', 'bottle', 'cigarette', 'couch', 'cart', 'clover', 'snowflake', 'planet', 'terminal', 'sprout',
  'kettlebell', 'runner', 'heartPulse', 'bulb', 'owl', 'smile', 'peak', 'wave', 'bamboo', 'lantern', 'enso', 'bloom', 'cairn',
  'greatsword', 'tornado', 'ward', 'tome', 'sigil', 'bull', 'banner', 'wand', 'px_str', 'px_agi', 'px_end', 'px_int', 'px_wis', 'px_cha'];
const AVATAR_CHOICES = ['reactor', 'flame', 'skull', 'eye', 'crown', 'sword', 'star', 'moon', 'claw', 'atom', 'gem', 'bolt', 'clover', 'terminal', 'sprout', 'planet', 'snowflake', 'heart', 'owl', 'cairn', 'bull', 'px_hero'];

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

/* ---------------------- Темы оформления ---------------------- */

// fx: neon — игровые свечения; calm — спокойно, без эффектов; crt — терминал; magic — гримуар.
const THEMES = [
  { id: 'reactor', name: 'Алый реактор', desc: 'Игровая: неон, лазеры, ядро реактора', fx: 'neon', meta: '#050203', particles: 0, avatar: 'reactor',
    icons: { stats: { str: 'sword', agi: 'swift', end: 'shield', int: 'hex', wis: 'eye', cha: 'crown' }, tabs: { hero: 'shieldStar', day: 'doc', history: 'chart', ach: 'trophy', league: 'users', settings: 'gear' }, act: 'bolt', magic: 'sparkle', refresh: 'refresh' },
    sw: ['#ff1f3d', '#ff7a1a', '#ffb020', '#050203'],
    stats: { str: '#ff2340', agi: '#ffc23d', end: '#ff7a1a', int: '#ff5c8a', wis: '#ffcfa3', cha: '#ff3dbb' },
    text: { sub: 'reactor core · online', cta: 'Зарядить ядро', done: 'Ядро заряжено', up: 'ПЕРЕГРУЗКА ЯДРА', stat: 'ПРОКАЧКА', down: 'ДЕГРАДАЦИЯ', ai: 'Ядро анализирует день', ok: 'Принять силу' } },
  { id: 'light', name: 'Минимал', desc: 'Светлая и чистая: белые карточки, без эффектов', fx: 'calm', meta: '#f4f5f7', particles: 0, avatar: 'star',
    icons: { stats: { str: 'kettlebell', agi: 'runner', end: 'heartPulse', int: 'bulb', wis: 'owl', cha: 'smile' }, tabs: { hero: 'home', day: 'checklist', history: 'bars', ach: 'medal', league: 'users', settings: 'sliders' }, act: 'play', magic: 'sparkle', refresh: 'refresh' },
    sw: ['#4f5bd5', '#6b77ee', '#ffffff', '#f4f5f7'],
    stats: { str: '#e5484d', agi: '#f2a20d', end: '#f76b15', int: '#4f5bd5', wis: '#12a594', cha: '#d6409f' },
    text: { sub: 'мой прогресс', cta: 'Подвести итоги дня', done: 'Итоги подведены', up: 'Новый уровень', stat: 'Параметр вырос', down: 'Уровень снижен', ai: 'Анализирую день', ok: 'Отлично' } },
  { id: 'terminal', name: 'Терминал', desc: 'Техно: зелёный фосфор, моноширинный шрифт', fx: 'crt', meta: '#000000', particles: 0, avatar: 'terminal',
    icons: { stats: { str: 'px_str', agi: 'px_agi', end: 'px_end', int: 'px_int', wis: 'px_wis', cha: 'px_cha' }, tabs: { hero: 'px_hero', day: 'px_day', history: 'px_hist', ach: 'px_ach', league: 'px_league', settings: 'px_gear' }, act: 'px_act', magic: 'px_magic', refresh: 'px_act' },
    sw: ['#39ff88', '#00d65c', '#ffd400', '#000000'],
    stats: { str: '#ff5f5f', agi: '#ffd400', end: '#ff9f1c', int: '#39ff88', wis: '#5ec8ff', cha: '#e07bff' },
    text: { sub: '> system ready', cta: '> run daily_report', done: '> report.ok', up: 'LEVEL_UP', stat: 'STAT_UP', down: 'SYSTEM_DEGRADED', ai: '> parsing day.log', ok: '> ok' } },
  { id: 'zen', name: 'Дзен', desc: 'Тёмная и тихая: шалфей, песок, мягкое дыхание', fx: 'calm', meta: '#14171a', particles: 12, avatar: 'sprout',
    icons: { stats: { str: 'peak', agi: 'wave', end: 'bamboo', int: 'lantern', wis: 'enso', cha: 'bloom' }, tabs: { hero: 'cairn', day: 'quill', history: 'hourglass', ach: 'lotus', league: 'users', settings: 'sliders' }, act: 'sprout', magic: 'bloom', refresh: 'refresh' },
    sw: ['#8fb39a', '#d8b98a', '#e8e4dc', '#14171a'],
    stats: { str: '#c9846a', agi: '#d8b98a', end: '#b8a27a', int: '#8fa9c4', wis: '#8fb39a', cha: '#c49ab8' },
    text: { sub: 'шаг за шагом', cta: 'Записать день', done: 'День записан', up: 'Новая ступень', stat: 'Рост', down: 'Шаг назад', ai: 'Размышляю над днём', ok: 'Спасибо' } },
  { id: 'grimoire', name: 'Чёрный гримуар', desc: 'Аниме в духе «Чёрного клевера»: тьма, изумруд, золото', fx: 'magic', meta: '#030503', particles: 26, avatar: 'clover',
    icons: { stats: { str: 'greatsword', agi: 'tornado', end: 'ward', int: 'tome', wis: 'sigil', cha: 'bull' }, tabs: { hero: 'clover', day: 'scroll', history: 'hourglass', ach: 'crown', league: 'banner', settings: 'wand' }, act: 'bolt', magic: 'sparkle', refresh: 'refresh' },
    sw: ['#13b865', '#4dff9a', '#e8c35a', '#030503'],
    stats: { str: '#e8c35a', agi: '#4dff9a', end: '#2ec4a0', int: '#6fb6ff', wis: '#d8f5d0', cha: '#c58bff' },
    text: { sub: 'гримуар пробуждён', cta: 'Наполнить гримуар', done: 'Гримуар наполнен', up: 'ГРИМУАР ПРОБУЖДЁН', stat: 'НОВОЕ ЗАКЛИНАНИЕ', down: 'АНТИМАГИЯ', ai: 'Гримуар читает день', ok: 'Превзойти себя' } },
];
const themeOf = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
const TT = () => themeOf((S && S.settings && S.settings.theme) || 'reactor').text;
const TI = () => themeOf((S && S.settings && S.settings.theme) || 'reactor').icons;

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
// День для отчёта: ночью (до 4 утра) — ещё вчерашний.
function reportDay() { const d = new Date(); if (d.getHours() < NIGHT_HOUR) d.setDate(d.getDate() - 1); return dateKey(d); }
const isEditable = (k) => k >= addDays(todayKey(), -EDIT_BACK_DAYS) && k <= todayKey();
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
    debuffs: clone(DEFAULT_DEBUFFS),   // слабости: вредные действия со штрафом
    // 'YYYY-MM-DD' -> { m: {statId: очки}, d: [{q, n, i, r, c}], c: {counterId: n}, ms: [milestoneId], note }
    log: {},
    ach: {},   // achievementId -> dateKey
    settings: { sound: true, theme: 'reactor' },
    custom: { counters: [], milestones: [] },   // свои достижения игрока
    shared: { counters: [], milestones: [] },   // общие достижения лиги (приходят с сервера)
    courtDone: [],                              // id решений суда лиги, уже добавленных в дни
    courtSeen: [],
    archivedStats: [],                          // скрытые параметры (очки сохраняются)                              // id моих доносов, итог которых уже засчитан в «Поборника» / «Ябеду»
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
  if (v < 4 && !Array.isArray(s.debuffs)) s.debuffs = clone(DEFAULT_DEBUFFS);
  if (v < 5 && Array.isArray(s.debuffs)) {   // новые слабости по умолчанию
    for (const d of DEFAULT_DEBUFFS) if (['b_night', 'b_overeat', 'b_energy'].includes(d.id) && !s.debuffs.find((x) => x.id === d.id)) s.debuffs.push(clone(d));
  }
  s.settings = Object.assign({ sound: true, theme: 'reactor' }, s.settings || {});
  if (s.settings.onboarded === undefined && Object.keys(s.log || {}).length) s.settings.onboarded = true;   // старые игроки знакомство не видят
  s.custom = Object.assign({ counters: [], milestones: [] }, s.custom || {});
  s.shared = Object.assign({ counters: [], milestones: [] }, s.shared || {});
  if (!Array.isArray(s.courtDone)) s.courtDone = [];
  if (!Array.isArray(s.courtSeen)) s.courtSeen = [];
  if (!Array.isArray(s.archivedStats)) s.archivedStats = [];
  for (const q of s.quests || []) for (const k in q.rewards || {}) q.rewards[k] = Math.max(-QUEST_MAX_REWARD, Math.min(QUEST_MAX_REWARD, Number(q.rewards[k]) || 0));
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

let counterCache = null;   // кэш расчёта счётчиков и искупления, сбрасывается при сохранении
let S = load();
function save() {
  counterCache = null;
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
  if (!d.b) d.b = [];
  return d;
}
// Сколько можно добавить в счётчик за один день вручную или через ИИ.
const counterDayCap = (c) => ({ 'км': 100, 'ч': 24, 'мин': 600, 'шагов': 60000, 'страниц': 500 }[c.unit] || 20);
const capRewards = (r) => Object.fromEntries(Object.entries(r || {}).map(([k, v]) => [k, clamp(Number(v) || 0, -QUEST_MAX_REWARD, QUEST_MAX_REWARD)]));

// Очки дня: от ИИ + подвиги + штрафы за клейма, полученные (или снятые искуплением) в этот день.
// Сами слабости очков не отнимают — они копят позор; параметры падают, когда набирается ступень клейма.
function dayPoints(day, k) {
  const p = {};
  if (day) {
    for (const id in day.m) p[id] = (p[id] || 0) + day.m[id];
    for (const x of day.d || []) for (const id in x.r) p[id] = (p[id] || 0) + x.r[id];
    for (const x of day.court || []) for (const id in x.r) p[id] = (p[id] || 0) + x.r[id];
  }
  if (k) for (const e of brandEvents(k)) for (const id in e.r) p[id] = (p[id] || 0) + e.r[id];
  return p;
}
function dayTotal(day, k) {
  const p = dayPoints(day, k);
  return S.stats.reduce((s, st) => s + (p[st.id] || 0), 0);
}
// День засчитывается в серию только за полезное: подвиги, плюсы, полезные счётчики, вехи. Слабости не в счёт.
function isActive(day) {
  if (!day) return false;
  if ((day.d || []).length || (day.ms || []).length) return true;
  if (Object.values(day.m || {}).some((v) => v > 0)) return true;
  return Object.keys(day.c || {}).some((id) => { const c = counterById(id); return c && !c.shame && day.c[id] > 0; });
}
// Сколько XP потеряно за день (штрафы за клейма + отрицательные ручные очки).
function dayLoss(day, k) {
  let l = 0;
  if (k) for (const e of brandEvents(k)) if (!e.redeem) for (const id in e.r) if (statById(id)) l += Math.min(0, e.r[id]);
  if (day) for (const id in day.m || {}) if (statById(id)) l += Math.min(0, day.m[id]);
  if (day) for (const x of day.court || []) for (const id in x.r) if (statById(id)) l += Math.min(0, x.r[id]);
  return l;
}
// Сколько раз за день поддался слабостям.
const dayWeak = (day) => (day && day.b ? day.b.length : 0);

/* ---------------------- Счётчики и вехи ---------------------- */

const round1 = (n) => Math.round(n * 10) / 10;
const counterById = (id) => counterList(S).find((c) => c.id === id);
const milestoneById = (id) => milestoneList(S).find((m) => m.id === id);
const sphereById = (id) => SPHERES.find((s) => s.id === id) || SPHERES[0];

function dayCounters(day) {
  const c = {};
  if (!day) return c;
  for (const id in day.c || {}) c[id] = (c[id] || 0) + day.c[id];
  for (const id in day.cc || {}) c[id] = (c[id] || 0) + day.cc[id];   // счётчики суда лиги
  for (const x of day.d || []) for (const id in x.c || {}) c[id] = (c[id] || 0) + x.c[id];
  for (const x of day.b || []) for (const id in x.c || {}) c[id] = (c[id] || 0) + x.c[id];
  for (const id in c) c[id] = round1(c[id]);
  return c;
}
/* Искупление: каждые REDEEM_DAYS «чистых» дней без слабости снимают одну ступень позорного клейма.
   Чистым считается только день, когда игрок что-то отметил (иначе позор смывался бы забрасыванием приложения).
   Пропущенные дни не засчитываются, но и не обнуляют отсчёт. Срыв обнуляет отсчёт. */
const REDEEM_DAYS = 14;
function isLogged(day) { return !!day && (isActive(day) || (day.b || []).length > 0 || Object.keys(day.c || {}).length > 0 || !!(day.note || '').trim()); }

/* Штрафы за клейма. Первая ступень клейма — предупреждение, дальше параметры падают:
   основным параметрам слабости — полный штраф, остальным — половина. Искупление ступени возвращает очки. */
const BRAND_PENALTY = [0, 5, 10, 20, 30, 50];
const SHAME_MS_PENALTY = 10;
const SHAME_MS_STATS = {
  blackout: ['end', 'wis'], hangover_day: ['end', 'str'], cancel_plans: ['cha'], overslept_big: ['wis'],
  asleep_at_work: ['int'], all_nighter: ['end', 'int'], forgot_birthday: ['cha'], rage_break: ['cha', 'wis'],
  broke_before_payday: ['wis'], feast_day: ['end'], ghost_gym: ['str'], diet_crash: ['wis'],
};
const brandPenalty = (tier) => BRAND_PENALTY[Math.min(tier, BRAND_PENALTY.length - 1)];
const fallbackStat = () => (statById('wis') ? 'wis' : S.stats[0] && S.stats[0].id);
// Какие параметры страдают от цепочки позора: по слабостям, которые её пополняют.
const COUNTER_STATS = { court_rat: { cha: 2, wis: 1 } };   // цепочки позора без слабостей: по каким параметрам бьют клейма
function brandWeights(cid) {
  const w = {};
  if (COUNTER_STATS[cid]) { for (const id in COUNTER_STATS[cid]) if (statById(id)) w[id] = COUNTER_STATS[cid][id]; if (Object.keys(w).length) return w; }
  const seen = new Set();
  for (const q of [...(S.debuffs || []), ...DEFAULT_DEBUFFS]) {
    if (seen.has(q.id) || !(q.c && q.c[cid] > 0)) continue;
    seen.add(q.id);
    for (const id in q.rewards || {}) if (statById(id) && q.rewards[id] < 0) w[id] = (w[id] || 0) - q.rewards[id];
  }
  if (!Object.keys(w).length) { const f = fallbackStat(); if (f) w[f] = 1; }
  return w;
}
function penaltyR(w, P, sign) {
  const max = Math.max(...Object.values(w));
  const r = {};
  for (const id in w) r[id] = sign * (w[id] >= max ? P : Math.ceil(P / 2));
  return r;
}
const brandEvents = (k) => computeCounters().pen[k] || [];
// Штраф, который ждёт на следующей ступени цепочки позора.
function nextBrand(cid) {
  const c = counterById(cid);
  if (!c) return null;
  const v = counterTotals()[cid] || 0;
  const i = c.tiers.findIndex((t) => v < t.goal);
  if (i < 0) return null;
  return { title: c.tiers[i].title, left: round1(c.tiers[i].goal - v), P: brandPenalty(i), r: penaltyR(brandWeights(cid), brandPenalty(i), -1) };
}

function computeCounters() {
  const key = todayKey();
  if (counterCache && counterCache.key === key) return counterCache;
  const raw = {}, shame = {}, pen = {}, msSeen = new Set();
  const shameList = counterList(S).filter(isShame);
  const tierN = (sc, v) => sc.tiers.filter((t) => v >= t.goal).length;
  shameList.forEach((c) => { shame[c.id] = { value: 0, clean: 0, redeemed: 0, run: 0, maxRun: 0, lastInc: '', cleanRun: 0, relapse: '' }; });
  for (const k of Object.keys(S.log).sort()) {
    if (k > key) continue;
    const day = S.log[k];
    const c = dayCounters(day);
    for (const id in c) raw[id] = (raw[id] || 0) + c[id];
    const logged = isLogged(day);
    for (const sc of shameList) shame[sc.id].pv = shame[sc.id].value;
    for (const sc of shameList) {
      const st = shame[sc.id], inc = c[sc.id] || 0;
      if (inc) {
        if (inc > 0) {
          // Антисерия: та же слабость в календарно соседние дни.
          st.run = st.lastInc === addDays(k, -1) ? st.run + 1 : 1;
          st.maxRun = Math.max(st.maxRun, st.run);
          // Рецидив: срыв после долгого «чистого» периода, если привычка уже была.
          if (st.lastInc && st.cleanRun >= RELAPSE_DAYS && !st.relapse) st.relapse = k;
          st.lastInc = k;
          st.clean = 0; st.cleanRun = 0;
        }
        st.value = Math.max(0, round1(st.value + inc));
        continue;
      }
      if (!logged) continue;                       // незаполненный день не засчитывается и не обнуляет
      if (st.lastInc) st.cleanRun++;
      if (st.value <= 0) { st.clean = 0; continue; }
      if (++st.clean >= REDEEM_DAYS) {
        let i = -1;
        sc.tiers.forEach((t, j) => { if (st.value >= t.goal) i = j; });
        st.value = i > 0 ? sc.tiers[i - 1].goal : 0;   // откат к порогу предыдущей ступени
        st.redeemed++;
        st.clean = 0;
      }
    }
    // Новые ступени клейма — штраф, снятые искуплением — возврат очков.
    for (const sc of shameList) {
      const st = shame[sc.id], a = tierN(sc, st.pv), b = tierN(sc, st.value);
      if (a === b) continue;
      const w = brandWeights(sc.id);
      for (let j = Math.min(a, b); j < Math.max(a, b); j++) {
        const P = brandPenalty(j);
        if (!P) continue;
        (pen[k] = pen[k] || []).push({ id: sc.id, title: sc.tiers[j].title, name: sc.name, redeem: b < a, r: penaltyR(w, P, b < a ? 1 : -1) });
      }
    }
    // Позорные вехи — разовый штраф.
    for (const id of day.ms || []) {
      const m = milestoneById(id);
      if (!m || m.sphere !== 'shame' || msSeen.has(id)) continue;
      msSeen.add(id);
      const ids = (SHAME_MS_STATS[id] || []).filter(statById);
      const w = {}; (ids.length ? ids : [fallbackStat()].filter(Boolean)).forEach((x) => { w[x] = 1; });
      if (Object.keys(w).length) (pen[k] = pen[k] || []).push({ id, title: m.name, name: 'позорная веха', ms: true, r: penaltyR(w, SHAME_MS_PENALTY, -1) });
    }
  }
  for (const id in raw) raw[id] = Math.max(0, round1(raw[id]));
  const totals = { ...raw };
  shameList.forEach((c) => { totals[c.id] = shame[c.id].value; });
  counterCache = { key, totals, raw, shame, pen };
  return counterCache;
}
function counterTotals() { return computeCounters().totals; }
const shameInfo = (id) => computeCounters().shame[id] || { value: 0, clean: 0, redeemed: 0 };
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
  const pen = computeCounters().pen;
  for (const k in pen) for (const e of pen[k]) for (const id in e.r) if (id in xp) xp[id] += e.r[id];
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
    bigDay = Math.max(bigDay, dayTotal(d, k));
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
      id: `t_${c.id}_${t.goal}`, kind: c.shame || c.sphere === 'shame' ? 'shame' : 'tier', counter: c, tier: i, sphere: c.sphere, icon: c.icon,
      name: t.title, desc: `${c.name}: ${fmtNum(t.goal)} ${c.unit}`, ok: v >= t.goal, v: Math.min(v, t.goal), goal: t.goal,
    }));
  }
  const md = milestoneDates();
  for (const m of milestoneList(S)) list.push({ id: 'm_' + m.id, kind: m.sphere === 'shame' ? 'shame' : 'milestone', shameKind: 'milestone', m, sphere: m.sphere, icon: m.icon, name: m.name, desc: m.desc, ok: !!md[m.id], date: md[m.id] });
  // Антисерии и рецидив — по всем цепочкам позора.
  const sh = computeCounters().shame;
  const maxRun = Math.max(0, ...Object.values(sh).map((x) => x.maxRun));
  for (const a of ANTI_STREAKS) list.push({ id: a.id, kind: 'shame', shameKind: 'anti', sphere: 'shame', icon: a.icon, name: a.name, desc: a.desc, ok: maxRun >= a.days, v: Math.min(maxRun, a.days), goal: a.days });
  const relapses = Object.values(sh).map((x) => x.relapse).filter(Boolean).sort();
  list.push({ id: 'as_relapse', kind: 'shame', shameKind: 'anti', sphere: 'shame', icon: 'arrowDown', name: 'Рецидив', desc: `Сорвался после ${RELAPSE_DAYS}+ чистых дней`, ok: relapses.length > 0, date: relapses[0] });
  return list;
}

function checkAchievements(silent) {
  const fresh = [], cleared = [];
  for (const a of allAchievements()) {
    if (a.ok && !S.ach[a.id]) { S.ach[a.id] = a.date || todayKey(); fresh.push(a); }
    else if (!a.ok && S.ach[a.id]) {   // отменили запись или искупили позор — награда снова закрыта
      delete S.ach[a.id];
      if (a.kind === 'shame') cleared.push(a);
    }
  }
  if (!silent && cleared.length) {
    const top = cleared.reduce((m, a) => (a.goal > m.goal ? a : m), cleared[0]);
    toast(`Искупление: клеймо «${top.name}» снято`, 'gold', 'sparkle');
    SFX.play('achieve');
    if (cleared.some((a) => a.kind === 'shame')) LEAGUE.push({ kind: 'redeem', text: `искупил клеймо «${top.name}»`, icon: 'sparkle' });
  }
  if (silent || !fresh.length) return;
  const good = fresh.filter((a) => a.kind !== 'shame'), bad = fresh.filter((a) => a.kind === 'shame');
  if (good.length > 3) LEAGUE.push({ kind: 'ach', text: `открыл достижений: ${good.length}`, icon: 'trophy' });
  else good.forEach((a) => LEAGUE.push({ kind: 'ach', text: a.kind === 'tier' ? `открыл «${a.name}» (${a.counter.name})` : `открыл «${a.name}»`, icon: a.icon }));
  bad.slice(0, 3).forEach((a) => LEAGUE.push({ kind: 'shame', text: `получил клеймо «${a.name}»`, icon: 'skull' }));
  if (good.length > 3) toast(`Открыто достижений: ${good.length}`, 'gold', 'trophy');
  else good.forEach((a, i) => setTimeout(() => toast(
    a.kind === 'tier' ? `${a.counter.name}: «${a.name}» · ${rarityOf(a.counter, a.tier).name}` : 'Достижение: ' + a.name,
    'gold', a.icon), i * 350));
  const penText = (a) => {
    const ev = Object.values(computeCounters().pen).flat().find((e) => !e.redeem && e.title === a.name);
    if (ev) return ' · ' + Object.entries(ev.r).filter(([id]) => statById(id)).map(([id, v]) => `−${Math.abs(v)} ${statById(id).name}`).join(', ');
    return a.counter && a.tier === 0 ? ' · пока без штрафа' : '';
  };
  bad.slice(0, 3).forEach((a, i) => setTimeout(() => toast((a.shameKind ? `Позор: «${a.name}»` : `Позор: ты теперь «${a.name}»`) + penText(a), 'shame', 'skull'), (good.length + i) * 350 + 200));
  if (good.length) SFX.play('achieve');
  if (bad.length) setTimeout(() => SFX.play('fail'), good.length ? 450 : 0);
}

const isShame = (c) => !!c && (c.shame || c.sphere === 'shame');
const rarityOf = (c, i) => { const R = isShame(c) ? SHAME_RARITY : RARITY; return R[Math.min(i, R.length - 1)]; };

/* ---------------------- Изменения с отслеживанием уровня ---------------------- */

let afterRender = [];   // эффекты, которые нужно применить к свежему DOM

function mutate(fn) {
  const before = snapshot();
  fn();
  save();
  const after = snapshot();
  const ups = [], downs = [];
  for (const st of S.stats) {
    const a = before.lv[st.id] || 1, b = after.lv[st.id] || 1;
    if (b > a) ups.push({ st, from: a, to: b });
    if (b < a) downs.push({ st, from: a, to: b });
  }
  const charUp = after.char > before.char ? after.char : 0;
  const charDown = after.char < before.char ? after.char : 0;
  checkAchievements(false);
  save();
  render(false);
  if (ups.length || charUp) setTimeout(() => celebrate(ups, charUp), 450);
  else if (downs.length || charDown) setTimeout(() => degrade(downs, charDown, before.char), 450);
  if (charUp) LEAGUE.push({ kind: 'level', text: `достиг ${charUp} уровня — ${titleFor(charUp)}`, icon: 'crown' });
  if (charDown) LEAGUE.push({ kind: 'down', text: `деградировал до ${charDown} уровня`, icon: 'arrowDown' });
  scheduleSync();
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
      <div class="t">${charLvl ? TT().up : TT().stat}</div>
      ${charLvl ? `<div class="lv">${charLvl}</div><div class="lt">уровень · ${titleFor(charLvl)}</div>` : ''}
      ${rows ? `<div class="ups">${rows}</div>` : '<div style="height:16px"></div>'}
      <button class="btn primary block" data-act="close-lu">${esc(TT().ok)}</button>
    </div>`;
  document.body.appendChild(el);
}

// Удар по персонажу: красная вспышка, тряска, падающие минусы.
function hurt(x, y, items, light = false) {
  SFX.play('fail');
  if (!light) {
    document.body.classList.remove('hurt'); void document.body.offsetWidth; document.body.classList.add('hurt');
    setTimeout(() => document.body.classList.remove('hurt'), 650);
    fx('crack', x, y, '', '', 700);
  }
  items.forEach((it, i) => {
    const dx = (i - (items.length - 1) / 2) * 62;
    setTimeout(() => fx('float sink', x + dx, y, `color:${it.color}`, `${it.icon ? ico(it.icon) : ''}${esc(it.text)}`, 1300), i * 110);
  });
}

// Потеря уровня: экран «ДЕГРАДАЦИЯ».
function degrade(downs, charLvl, fromChar) {
  SFX.play('degrade');
  const el = document.createElement('div');
  el.className = 'lu down';
  let debris = '';
  for (let i = 0; i < 40; i++) debris += `<b style="left:${Math.random() * 100}%;--t:${1.2 + Math.random() * 1.4}s;--dl:${Math.random() * .6}s;--w:${2 + Math.random() * 4}px"></b>`;
  const rows = downs.map((u, i) => `
    <div style="color:${u.st.color};animation-delay:${.6 + i * .12}s">${ico(u.st.icon)}<span style="color:var(--text)">${esc(u.st.name)}</span>
      <span class="mono" style="color:var(--muted)">${u.from}</span><span class="arrow">↓</span><span>${u.to}</span></div>`).join('');
  el.innerHTML = `
    <div class="flash"></div>
    <div class="debris">${debris}</div>
    <div class="box">
      <div class="dcore">${ico('arrowDown')}</div>
      <div class="t">${TT().down}</div>
      ${charLvl ? `<div class="lv">${fromChar} → ${charLvl}</div><div class="lt">уровень персонажа упал · ${titleFor(charLvl)}</div>` : '<div class="lt">ты стал слабее</div>'}
      ${rows ? `<div class="ups">${rows}</div>` : '<div style="height:16px"></div>'}
      <button class="btn block shamebtn" data-act="close-lu">Я исправлюсь</button>
    </div>`;
  document.body.appendChild(el);
}

function openSheet(html) {
  $('#sheet-card').innerHTML = `<button class="sheet-x" data-act="close-sheet" aria-label="Закрыть">✕</button>` + html;
  $('#sheet').classList.remove('hidden');
}
let updatePending = false;
function closeSheet() {
  if (!S.settings.onboarded && $('#sheet-card .onb-dots')) { S.settings.onboarded = true; save(); } micStop(); $('#sheet').classList.add('hidden'); $('#sheet-card').innerHTML = ''; if (updatePending) location.reload(); }

function statById(id) { return S.stats.find((s) => s.id === id); }
function rewardsHTML(r) {
  const parts = Object.entries(r).filter(([id, v]) => v && statById(id))
    .map(([id, v]) => { const s = statById(id); return `<span style="color:${s.color}">${ico(s.icon)}${sign(v)}</span>`; });
  return parts.join('') || '<span>без наград</span>';
}
const barHTML = (key, pct, color) =>
  `<div class="bar"><i data-bar="${key}" data-w="${(clamp(pct, 0, 1) * 100).toFixed(1)}" style="${color === 'accent'
    ? '--c:var(--sc);background:linear-gradient(90deg,var(--sc),var(--or))'
    : `--c:${color};background:linear-gradient(90deg,${color}99,${color})`}"></i></div>`;

/* ---------------------- Экраны ---------------------- */

let tab = 'hero';
let curDate = reportDay();
let showAllWeak = false;   // показать все слабости, а не только частые
let histRange = 30;

const TABS = [['hero', 'Герой', 'shieldStar'], ['day', 'Итоги', 'doc'], ['history', 'История', 'chart'], ['ach', 'Награды', 'trophy'], ['league', 'Лига', 'users'], ['settings', 'Ещё', 'gear']];

// Сколько голосований суда лиги ждут моего голоса.
function courtWaiting(b = LEAGUE.joined() ? LEAGUE.cfg().board : null) {
  return b ? (b.proposals || []).filter((p) => p.status === 'pending' && p.canVote && !p.myVote).length : 0;
}
function render(enter) {
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  const lgBtn = $('#tabbar button[data-tab=league]');
  if (lgBtn) {
    const n = courtWaiting();
    let bd = lgBtn.querySelector('.tbadge');
    if (n && !bd) { bd = document.createElement('b'); bd.className = 'tbadge'; lgBtn.appendChild(bd); }
    if (bd) { if (n) bd.textContent = n; else bd.remove(); }
  }
  const v = $('#view');
  const prev = {};
  v.querySelectorAll('[data-bar]').forEach((el) => { prev[el.dataset.bar] = el.style.width; });

  v.classList.remove('enter');
  v.innerHTML = ({ hero: viewHero, day: viewDay, history: viewHistory, ach: viewAch, league: viewLeague, settings: viewSettings }[tab])();
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
    <radialGradient id="rf"><stop offset="0" style="stop-color:var(--or)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--sc)" stop-opacity=".18"/></radialGradient>
    <filter id="rglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="iglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
  for (let k = 1; k <= 4; k++) g += `<circle cx="${cx}" cy="${cy}" r="${R * k / 4}" fill="none" style="stroke:rgba(var(--g1-rgb),.22)"/>`;
  S.stats.forEach((_, i) => { const [x, y] = pt(i, R); g += `<line x1="${cx}" y1="${cy}" x2="${f(x)}" y2="${f(y)}" style="stroke:rgba(var(--g1-rgb),.22)"/>`; });
  const pts = levels.map((l, i) => pt(i, R * Math.max(0.07, l / max)).map(f).join(',')).join(' ');
  g += `<polygon class="fillp" points="${pts}" fill="url(#rf)"/>`;
  g += `<polygon class="shape" pathLength="1" points="${pts}" fill="none" style="stroke:var(--or)" stroke-width="2.5" stroke-linejoin="round" filter="url(#rglow)"/>`;
  g += `<polygon class="shape" pathLength="1" points="${pts}" fill="none" style="stroke:var(--hot)" stroke-width="1" stroke-linejoin="round"/>`;
  levels.forEach((l, i) => {
    const [x, y] = pt(i, R * Math.max(0.07, l / max));
    g += `<circle class="pt" cx="${f(x)}" cy="${f(y)}" r="3.5" fill="#fff" stroke="${S.stats[i].color}" stroke-width="2" filter="url(#iglow)" style="transform-box:fill-box;transform-origin:center;animation-delay:${.9 + i * .06}s"/>`;
  });
  S.stats.forEach((s, i) => {
    const [x, y] = pt(i, R + 26);
    const icon = ICONS[s.icon]
      ? `<svg x="${f(x - 10)}" y="${f(y - 17)}" width="20" height="20" viewBox="0 0 24 24" color="${s.color}" fill="none" stroke="${s.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" filter="url(#iglow)">${ICONS[s.icon]}</svg>`
      : `<text x="${f(x)}" y="${f(y - 2)}" text-anchor="middle" font-size="17">${esc(s.icon)}</text>`;
    g += icon + `<text x="${f(x)}" y="${f(y + 16)}" text-anchor="middle" font-size="12" font-weight="700" style="fill:var(--text);font-family:var(--head)">${levels[i]}</text>`;
  });
  return `<svg class="radar" viewBox="0 0 340 288">${g}</svg>`;
}

function viewHero() {
  const xp = statXP();
  const total = totalXP(xp);
  const ch = levelInfo(total, charK());
  const rday = reportDay();
  const tday = getDay(rday);
  const today = dayPoints(tday, rday);
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
    <div class="sub"><span class="dot"></span>${esc(TT().sub)}</div>
    <div class="card sweep">
      <div class="hero">
        ${reactorHTML(S.profile.avatar, 'LVL ' + ch.level)}
        <div class="hero-name">${esc(S.profile.name)}</div>
        <div class="hero-title">${titleFor(ch.level)} · ${ch.level} уровень</div>
        <div class="xpwrap">
          ${barHTML('char', ch.pct, 'accent')}
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
      ? `<button class="cta done" data-act="go-today">${ico(TI().act)} ${esc(TT().done)} · ${sign(dayTotal(tday, rday))} XP</button>`
      : `<button class="cta" data-act="go-today">${ico(TI().tabs.day)} ${esc(TT().cta)}</button>`}
    ${S.stats.length >= 3 ? `<div class="card" style="padding:8px 6px 4px">${radarSVG(xp)}</div>` : ''}
    <h2>Параметры</h2>
    ${stats || `<div class="empty">${ico(TI().stats.int)}<div>Добавь параметры в разделе «Ещё»</div></div>`}
  `;
}

// Подсказка на карточке слабости: сколько осталось до следующего клейма и чем оно грозит.
function debuffHint(q) {
  const cid = Object.keys(q.c || {}).find((id) => isShame(counterById(id)));
  const nb = cid && nextBrand(cid);
  if (!nb) return '<span>копит позор</span>';
  const left = q.c[cid] > 0 ? Math.ceil(nb.left / q.c[cid]) : nb.left;
  return `<span>ещё ${Math.max(1, left)} до клейма</span>${nb.P ? rewardsHTML(nb.r) : ''}`;
}

function viewDay() {
  const day = getDay(curDate) || { m: {}, d: [], note: '' };
  const pts = dayPoints(day, curDate);
  const total = dayTotal(day, curDate);
  const isToday = curDate === todayKey();
  const editable = isEditable(curDate);
  const lock = editable ? '' : 'disabled';
  const counts = {};
  (day.d || []).forEach((x) => { counts[x.q] = (counts[x.q] || 0) + 1; });

  const quests = S.quests.map((q) => `
    <button class="quest ${counts[q.id] ? 'done' : ''} ${counts[q.id] >= QUEST_DAY_LIMIT ? 'maxed' : ''}" data-act="quest" data-id="${q.id}" ${lock}>
      ${counts[q.id] ? `<span class="qc">${counts[q.id] > 1 ? '×' + counts[q.id] : '✓'}</span>` : ''}
      <span class="qi">${ico(q.icon)}</span>
      <span class="qn">${esc(q.name)}</span>
      <span class="qr">${rewardsHTML(q.rewards)}</span>
    </button>`).join('');

  const bcounts = {};
  (day.b || []).forEach((x) => { bcounts[x.q] = (bcounts[x.q] || 0) + 1; });
  // Частые слабости (за 30 дней и сегодняшние) — сразу, остальные — по кнопке «Показать все».
  const recent = new Set(Object.keys(bcounts));
  for (let i = 1; i <= 30; i++) for (const x of (getDay(addDays(curDate, -i)) || {}).b || []) recent.add(x.q);
  let primary = (S.debuffs || []).filter((q) => recent.has(q.id));
  if (primary.length < 4) primary = [...primary, ...(S.debuffs || []).filter((q) => !recent.has(q.id)).slice(0, 4 - primary.length)];
  const shown = showAllWeak ? (S.debuffs || []) : primary;
  const hiddenWeak = (S.debuffs || []).length - shown.length;
  const debuffs = shown.map((q) => `
    <button class="quest debuff ${bcounts[q.id] ? 'done' : ''}" data-act="debuff" data-id="${q.id}" ${lock}>
      ${bcounts[q.id] ? `<span class="qc">${bcounts[q.id] > 1 ? '×' + bcounts[q.id] : '!'}</span>` : ''}
      <span class="qi">${ico(q.icon)}</span>
      <span class="qn">${esc(q.name)}</span>
      <span class="qr">${debuffHint(q)}</span>
    </button>`).join('');
  const bdone = (day.b || []).map((x, i) => `
    <div class="done-item bad">
      <span class="qi">${ico(x.i)}</span>
      <div class="grow"><div style="font-weight:600;font-size:14px">${esc(x.n)}${x.by ? `<span class="tag shamewk">донос · ${esc(x.by)}</span>` : ''}</div><span class="small muted">${Object.entries(x.c || {}).filter(([cid]) => counterById(cid)).map(([cid, v]) => `${esc(counterById(cid).name)} +${fmtNum(v)}`).join(' · ') || 'без последствий'}</span></div>
      ${editable ? `<button class="icon-btn" data-act="undo-debuff" data-idx="${i}" aria-label="Отменить">✕</button>` : ''}
    </div>`).join('');
  const courtRow = (x) => `
    <div class="done-item ${x.kind === 'praise' ? '' : 'bad'}">
      <span class="qi">${ico(x.kind === 'praise' ? 'medal' : 'balance')}</span>
      <div class="grow"><div style="font-weight:600;font-size:14px">${x.kind === 'praise' ? 'Бонус суда' : 'Штраф суда'}<span class="tag ${x.kind === 'praise' ? 'lg' : 'shamewk'}">${x.kind === 'praise' ? 'похвала' : 'донос'} · ${esc(x.by)}</span></div><span class="qr" style="margin-top:3px">${rewardsHTML(x.r)}</span></div>
    </div>`;
  const courtGood = (day.court || []).filter((x) => x.kind === 'praise').map(courtRow).join('');
  const brands = (day.court || []).filter((x) => x.kind !== 'praise').map(courtRow).join('') + brandEvents(curDate).map((e) => `
    <div class="done-item ${e.redeem ? '' : 'bad'}">
      <span class="qi">${ico(e.redeem ? TI().magic : 'skull')}</span>
      <div class="grow"><div style="font-weight:600;font-size:14px">${e.redeem ? 'Искупление' : e.ms ? 'Позорная веха' : 'Клеймо'} «${esc(e.title)}»</div><span class="qr" style="margin-top:3px">${rewardsHTML(e.r)}</span></div>
    </div>`).join('');
  const loss = dayLoss(day, curDate);

  const done = (day.d || []).map((x, i) => `
    <div class="done-item">
      <span class="qi">${ico(x.i)}</span>
      <div class="grow"><div style="font-weight:600;font-size:14px">${esc(x.n)}${x.by ? `<span class="tag lg">лига · ${esc(x.by)}</span>` : ''}</div><span class="qr" style="margin-top:3px">${rewardsHTML(x.r)}</span></div>
      ${editable ? `<button class="icon-btn" data-act="undo-quest" data-idx="${i}" aria-label="Отменить">✕</button>` : ''}
    </div>`).join('');

  const dc = dayCounters(day);
  const progress = [
    ...Object.entries(dc).filter(([id, v]) => v && counterById(id)).map(([id, v]) => {
      const c = counterById(id), manual = (day.c || {})[id] || 0;
      return `<div class="prog-item"><div class="sico" style="color:${sphereById(c.sphere).color}">${ico(c.icon)}</div>
        <div class="grow"><div class="sn">${esc(c.name)}</div><div class="sx">+${fmtNum(v)} ${c.unit}${c.auto ? ' · суд лиги' : manual !== v ? ' · из подвигов ' + fmtNum(round1(v - manual)) : ''}</div></div>
        ${manual && editable ? `<button class="icon-btn" data-act="rm-counter" data-id="${id}" aria-label="Убрать">✕</button>` : ''}</div>`;
    }),
    ...(day.ms || []).filter(milestoneById).map((id) => {
      const m = milestoneById(id);
      return `<div class="prog-item"><div class="sico ms" style="color:var(--am)">${ico(m.icon)}</div>
        <div class="grow"><div class="sn">${esc(m.name)}</div><div class="sx">веха · ${esc(m.desc)}</div></div>
        ${editable ? `<button class="icon-btn" data-act="rm-ms" data-id="${id}" aria-label="Убрать">✕</button>` : ''}</div>`;
    }),
  ].join('');

  // Очки параметрам напрямую начисляет только ИИ-отчёт; вручную их можно лишь убрать.
  const aiPts = S.stats.filter((s) => (day.m || {})[s.id]).map((s) => `
    <div class="done-item">
      <span class="qi" style="color:${s.color}">${ico(s.icon)}</span>
      <div class="grow"><div style="font-weight:600;font-size:14px">${esc(s.name)} <span class="${day.m[s.id] > 0 ? 'today-plus' : 'today-minus'}">${sign(day.m[s.id])}</span></div><span class="small muted">начислено ИИ-отчётом</span></div>
      ${editable ? `<button class="icon-btn" data-act="rm-points" data-id="${s.id}" aria-label="Убрать">✕</button>` : ''}
    </div>`).join('');

  return `
    <div class="datebar">
      <button class="icon-btn" data-act="prev-day">‹</button>
      <div class="d"><b>${humanDate(curDate)}</b><span>${isToday ? 'итоги дня' : 'прошлый день'}</span></div>
      <button class="icon-btn" data-act="next-day" ${isToday ? 'disabled' : ''}>›</button>
    </div>
    <div class="card sweep center">
      <div class="daytotal ${total < 0 ? 'neg' : ''}" id="daytotal">${total > 0 ? '+' : ''}${total} XP</div>
      <div class="small muted">${total < 0 ? 'день в минусе — ядро теряет энергию' : total ? 'энергии получено за день' : editable ? 'Отметь, что сделал, — и ядро зарядится' : 'в этот день ничего не отмечено'}</div>
      ${loss ? `<div class="lossline">${ico('arrowDown')} потеряно ${loss} XP на клеймах</div>` : ''}
    </div>
    ${!editable ? `<div class="card small lockline">${ico('hourglass')}<span>День закрыт для правок: отмечать можно только сегодня и вчера. Заметку можно дописать.</span></div>`
      : AI.ready() ? `<button class="cta ai-cta" data-act="ai-open">${ico('mic')} Рассказать о дне ИИ</button>`
      : `<button class="btn block ai-soft" data-act="ai-setup">${ico('sparkle')} Подключить ИИ-отчёт — рассказывай о дне своими словами</button>`}
    ${progress ? `<h2>Прогресс достижений</h2><div class="card">${progress}</div>` : ''}
    <h2>Подвиги дня</h2>
    <div class="quests">${quests}</div>
    ${done || courtGood ? `<div class="card" style="margin-top:12px">${courtGood}${done}</div>` : ''}
    <h2 class="bad-h">Слабости дня</h2>
    <div class="small muted" style="margin:-4px 2px 10px">Слабость копит позор; параметры падают, только когда набирается новая ступень клейма.</div>
    <div class="quests">${debuffs}</div>
    ${hiddenWeak > 0 ? `<button class="btn block sm" data-act="weak-more" style="margin-top:10px">Показать все слабости (+${hiddenWeak})</button>`
      : showAllWeak ? '<button class="btn block sm" data-act="weak-more" style="margin-top:10px">Свернуть</button>' : ''}
    ${bdone || brands ? `<div class="card bad-card" style="margin-top:12px">${brands}${bdone}</div>` : ''}
    ${aiPts ? `<h2>Очки от ИИ</h2><div class="card">${aiPts}</div>` : ''}
    <h2>Заметка дня</h2>
    <textarea id="note" placeholder="Что получилось? Чем гордишься? Что улучшить завтра?">${esc(day.note || '')}</textarea>
  `;
}

function viewHistory() {
  const t = todayKey();
  const days = [];
  for (let i = histRange - 1; i >= 0; i--) days.push(addDays(t, -i));

  const W = 340, H = 180, padL = 26, padB = 22, padT = 10;
  const totals = days.map((k) => { const p = dayPoints(getDay(k), k); return S.stats.map((s) => Math.max(0, p[s.id] || 0)); });
  const losses = days.map((k) => dayLoss(getDay(k), k));
  const maxV = Math.max(5, ...totals.map((a) => a.reduce((x, y) => x + y, 0)));
  const minV = Math.min(0, ...losses);
  const bw = (W - padL) / days.length;
  const yT = (v) => H - padB - ((v - minV) / (maxV - minV)) * (H - padB - padT);
  let bars = `<defs><filter id="cglow" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  if (minV < 0) bars += `<line x1="${padL}" x2="${W}" y1="${yT(0)}" y2="${yT(0)}" style="stroke:rgba(var(--tint-rgb),.25)"/>`;
  for (let g = 0; g <= 2; g++) {
    const v = Math.round((maxV * g) / 2), y = yT(v);
    bars += `<line x1="${padL}" x2="${W}" y1="${y}" y2="${y}" style="stroke:rgba(var(--g1-rgb),.15)" stroke-dasharray="2 4"/><text x="${padL - 5}" y="${y + 4}" font-size="10" text-anchor="end" style="fill:rgba(var(--tint-rgb),.5);font-family:'JetBrains Mono',monospace">${v}</text>`;
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
    if (losses[i] < 0) col += `<rect x="${x.toFixed(1)}" y="${yT(0).toFixed(1)}" width="${w.toFixed(1)}" height="${(yT(losses[i]) - yT(0)).toFixed(1)}" style="fill:var(--tox)" opacity=".75" rx="${Math.min(2, w / 3).toFixed(1)}"/>`;
    if (col) cols += `<g class="colb" style="animation-delay:${(i * (600 / days.length)).toFixed(0)}ms">${col}</g>`;
    const step = histRange <= 7 ? 1 : histRange <= 30 ? 5 : 15;
    if ((days.length - 1 - i) % step === 0) {
      const d = parseKey(days[i]);
      const lx = x + w / 2, anchor = lx > W - 14 ? 'end' : 'middle';
      bars += `<text x="${(anchor === 'end' ? W : lx).toFixed(1)}" y="${H - 6}" font-size="10" text-anchor="${anchor}" style="fill:rgba(var(--tint-rgb),.5);font-family:'JetBrains Mono',monospace">${histRange <= 7 ? WD[d.getDay()] : d.getDate() + '.' + pad(d.getMonth() + 1)}</text>`;
    }
  });
  bars += `<g filter="url(#cglow)">${cols}</g>`;

  const sums = S.stats.map((s, j) => totals.reduce((a, arr) => a + arr[j], 0));
  const periodLoss = losses.reduce((a, b) => a + b, 0);
  const periodTotal = sums.reduce((a, b) => a + b, 0) + periodLoss;
  const activeInRange = days.filter((k) => isActive(getDay(k))).length;

  const list = Object.keys(S.log).filter((k) => isActive(S.log[k]) || (S.log[k].b || []).length || (S.log[k].note || '').trim()).sort().reverse().slice(0, 60).map((k) => {
    const d = S.log[k];
    const p = dayPoints(d, k), dt = dayTotal(d, k);
    const chips = S.stats.filter((s) => p[s.id]).map((s) => `<span class="chip" style="color:${s.color}">${ico(s.icon)}${sign(p[s.id])}</span>`).join('');
    const note = (d.note || '').trim();
    return `
      <button class="card hday" data-act="open-day" data-k="${k}">
        <div class="row between"><b>${humanDate(k)}</b><span class="${dt < 0 ? 'today-minus' : 'today-plus'}">${sign(dt)} XP</span></div>
        ${chips ? `<div class="chips">${chips}</div>` : ''}
        ${(d.d || []).length ? `<div class="ic">${d.d.map((x) => ico(x.i)).join('')}</div>` : ''}
        ${(d.b || []).length ? `<div class="ic bad">${d.b.map((x) => ico(x.i)).join('')}</div>` : ''}
        ${(d.ms || []).filter(milestoneById).map((id) => `<div class="ms-line">${ico(milestoneById(id).icon)}<span>${esc(milestoneById(id).name)}</span></div>`).join('')}
        ${note ? `<div class="quote">«${esc(note.slice(0, 140))}${note.length > 140 ? '…' : ''}»</div>` : ''}
      </button>`;
  }).join('');

  return `
    <h1>История</h1>
    <button class="btn block sm" data-act="weekly" data-k="${addDays(weekStartKey(todayKey()), -7)}" style="margin-bottom:12px">${ico('chart')} Итоги прошлой недели</button>
    <div class="seg">
      ${[7, 30, 90].map((r) => `<button data-act="range" data-r="${r}" class="${histRange === r ? 'active' : ''}">${r} дней</button>`).join('')}
    </div>
    <div class="card sweep">
      <div class="row between" style="margin-bottom:8px">
        <span class="bigxp ${periodTotal < 0 ? 'neg' : ''}">${periodTotal < 0 ? '−' + fmt(-periodTotal) : '+' + fmt(periodTotal)} XP</span>
        <span class="small muted mono">${activeInRange}/${histRange} дней</span>
      </div>
      <svg class="chart" viewBox="0 0 ${W} ${H}">${bars}</svg>
      ${periodLoss ? `<div class="lossline">${ico('arrowDown')} потеряно на слабостях ${periodLoss} XP</div>` : ''}
      <div class="legend">${S.stats.map((s, j) => `<span style="color:${s.color}"><i style="background:${s.color}"></i><span style="color:var(--muted)">${esc(s.name)} ${sums[j]}</span></span>`).join('')}</div>
    </div>
    <h2>Летопись</h2>
    ${list || `<div class="empty">${ico('book')}<div>Пока пусто. Подведи итоги первого дня!</div></div>`}
  `;
}

let achSphere = 'system';

function viewAch() {
  const everything = allAchievements();
  const all = everything.filter((a) => a.kind !== 'shame');
  const got = all.filter((a) => a.ok).length;
  const shameGot = everything.filter((a) => a.kind === 'shame' && a.ok).length;
  const bySphere = (id) => everything.filter((a) => a.sphere === id);
  const chips = SPHERES.map((sp) => {
    const list = bySphere(sp.id);
    return `<button class="sp ${sp.id === 'shame' ? 'shame' : ''} ${achSphere === sp.id ? 'on' : ''}" data-act="sphere" data-s="${sp.id}" style="--c:${sp.color}">
      ${ico(sp.icon)}<span>${sp.name}</span><b>${list.filter((a) => a.ok).length}/${list.length}</b></button>`;
  }).join('');

  let body = '';
  if (achSphere === 'system') {
    body = `<div class="achs">${bySphere('system').map((a) => `<div class="card ach ${a.ok ? 'got' : 'locked'}">
        <div class="badge">${ico(a.icon)}</div>
        <div class="an">${a.name}</div>
        <div class="ad">${a.desc}</div>
        ${a.ok ? `<div class="ap">✓ ${shortDate(S.ach[a.id] || todayKey())}</div>`
               : `<div class="ap">${a.v} / ${a.goal}</div>${barHTML('ach-' + a.id, a.v / a.goal, 'accent')}`}
      </div>`).join('')}</div>`;
  } else {
    const sp = sphereById(achSphere);
    const totals = counterTotals();
    const chains = counterList(S).filter((c) => c.sphere === achSphere).map((c) => {
      const v = totals[c.id] || 0;
      const nextI = c.tiers.findIndex((t) => v < t.goal);
      const next = nextI >= 0 ? c.tiers[nextI] : null;
      return `<div class="card chain ${isShame(c) ? 'shame' : ''}">
        <div class="row">
          <div class="sico" style="color:${sp.color}">${ico(c.icon)}</div>
          <div class="grow"><div class="sn">${esc(c.name)}${c.custom ? '<span class="tag">своё</span>' : ''}${c.shared ? `<span class="tag lg">лига${c.authorName ? ' · ' + esc(c.authorName) : ''}</span>` : ''}</div>
            <div class="sx"><b class="cv">${fmtNum(v)}</b> ${c.unit}${next ? ` · далее «${esc(next.title)}» на ${fmtNum(next.goal)}` : ' · все ступени пройдены'}</div></div>
          ${c.auto ? '' : `<button class="icon-btn" data-act="counter" data-id="${c.id}" aria-label="Добавить">+</button>`}
        </div>
        ${barHTML('ch-' + c.id, next ? v / next.goal : 1, sp.color)}
        ${isShame(c) ? redeemHTML(c) : ''}
        <div class="tiers">${c.tiers.map((t, i) => {
          const r = rarityOf(c, i);
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
    if (achSphere === 'league' && !counterList(S).some((c) => c.sphere === 'league') && !milestoneList(S).some((m) => m.sphere === 'league')) {
      body = `<div class="empty">${ico('users')}<div>${LEAGUE.joined() ? 'Общих достижений пока нет. Создай своё в любой сфере и включи «Поделиться с лигой» — или открой карточку своего достижения и нажми «В лигу».' : 'Вступи в лигу, чтобы здесь появились общие достижения друзей.'}</div></div>`;
    } else body = achSphere === 'shame' ? `
      <div class="card shame-intro">${ico('skull')}<div><b>Коллекция позора: ${shameGot}</b><div class="small muted">Клейма даются за слабости. Искупление: ${REDEEM_DAYS} дней без слабости (в дни, когда отмечаешь итоги) снимают одну ступень. Срыв обнуляет отсчёт.</div></div></div>
      <h2 class="bad-h">Клейма</h2>${chains}
      <button class="btn block add-own" data-act="add-cc">${ico(TI().magic)} Своя цепочка позора</button>
      <h2 class="bad-h">Антисерии</h2>
      <div class="achs">${bySphere('shame').filter((a) => a.shameKind === 'anti').map((a) => `<div class="card ach shame ${a.ok ? 'got' : 'locked'}">
          <div class="badge">${ico(a.icon)}</div>
          <div class="an">${esc(a.name)}</div>
          <div class="ad">${esc(a.desc)}</div>
          <div class="ap">${a.ok ? (S.ach[a.id] ? '✕ ' + shortDate(S.ach[a.id]) : '✕') : (a.goal ? `рекорд ${a.v} / ${a.goal}` : 'пока нет')}</div>
        </div>`).join('')}</div>
      <h2 class="bad-h">Позорные вехи</h2>
      <div class="achs">${milestoneList(S).filter((m) => m.sphere === 'shame').map((m) => `
        <button class="card ach shame ${md[m.id] ? 'got' : 'locked'}" data-act="milestone" data-id="${m.id}">
          <div class="badge">${ico(m.icon)}</div>
          <div class="an">${esc(m.name)}</div>
          <div class="ad">${esc(m.desc || '')}</div>
          <div class="ap">${md[m.id] ? '✕ ' + shortDate(md[m.id]) : 'не было'}</div>
        </button>`).join('')}</div>
      <button class="btn block add-own" data-act="add-cm" style="margin-top:12px">${ico(TI().magic)} Своя позорная веха</button>` : `<h2>Цепочки</h2>${chains}
      <button class="btn block add-own" data-act="add-cc">${ico(TI().magic)} Своя цепочка</button>
      <h2>Вехи</h2><div class="achs">${miles}</div>
      <button class="btn block add-own" data-act="add-cm" style="margin-top:12px">${ico(TI().magic)} Своя веха</button>`;
  }

  return `
    <h1>Награды</h1>
    <div class="card sweep">
      <div class="row between"><span class="sn">Открыто</span><span class="bigxp">${got} / ${all.length}</span></div>
      ${barHTML('ach-all', got / all.length, 'accent')}
      ${shameGot ? `<div class="row between" style="margin-top:10px"><span class="sn" style="color:var(--tox)">Позор</span><span class="shamecount">${ico('skull')} ${shameGot}</span></div>` : ''}
    </div>
    <div class="spheres">${chips}</div>
    ${body}
  `;
}

// Настройки: меню разделов и отдельные страницы.
let settingsPage = null;
const IS_IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const IS_STANDALONE = () => window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

function settingsPages() {
  const th = themeOf(S.settings.theme);
  return [
    ['theme', 'Тема оформления', th.name, 'brush'],
    ['hero', 'Персонаж', S.profile.name, 'star'],
    ['stats', 'Параметры', `${S.stats.length} ${plural(S.stats.length, 'параметр', 'параметра', 'параметров')}`, 'hex'],
    ['quests', 'Подвиги', `${S.quests.length} ${plural(S.quests.length, 'подвиг', 'подвига', 'подвигов')}`, 'bolt'],
    ['debuffs', 'Слабости', `${(S.debuffs || []).length} ${plural((S.debuffs || []).length, 'слабость', 'слабости', 'слабостей')}`, 'skull'],
    ['ai', 'ИИ-помощник', AI.ready() ? AI.providerName() : 'не подключён', 'sparkle'],
    ['notify', 'Звук и напоминания', [S.settings.sound ? 'звук вкл.' : 'звук выкл.', S.settings.remind ? 'напоминание ' + S.settings.remindTime : ''].filter(Boolean).join(' · '), 'bolt'],
    ['data', 'Данные и резервные копии', S.settings.cloudAt ? 'облачная копия ' + timeAgo(S.settings.cloudAt) : 'экспорт, импорт, сброс', 'download'],
    ...(IS_STANDALONE() ? [] : [['install', 'Установка на телефон', IS_IOS ? 'iPhone · Safari' : 'Android · Chrome', 'upload']]),
    ['about', 'Как это работает', 'версия ' + APP_VERSION, 'doc'],
  ];
}

function viewSettings() {
  if (!settingsPage) {
    return `
      <h1>Настройки</h1>
      <div class="card menu">${settingsPages().map(([k, t, sub, icon]) => `
        <button class="menu-item" data-act="set-page" data-p="${k}">
          <span class="qi" style="color:${k === 'debuffs' ? 'var(--tox)' : 'var(--ic)'}">${ico(icon)}</span>
          <span class="grow"><span class="mt">${esc(t)}</span><span class="ms">${esc(sub)}</span></span>
          <span class="chev">›</span>
        </button>`).join('')}</div>
      <div class="ver">LEVEL UP · ВЕРСИЯ ${APP_VERSION} · ${esc(themeOf(S.settings.theme).name.toUpperCase())}</div>`;
  }
  const page = settingsPages().find((x) => x[0] === settingsPage) || ['about', 'Настройки'];
  return `
    <button class="backbar" data-act="set-page" data-p="">‹ Настройки</button>
    <h1>${esc(page[1])}</h1>
    ${settingsPageHTML(settingsPage)}`;
}

function settingsPageHTML(k) {
  if (k === 'theme') return `
    <div class="themes">${THEMES.map((t) => `
      <button class="theme-card ${(S.settings.theme || 'reactor') === t.id ? 'on' : ''}" data-act="theme" data-id="${t.id}">
        <span class="sw" style="background:radial-gradient(circle at 35% 30%, ${t.sw[2]}, ${t.sw[0]} 45%, ${t.sw[1]} 70%, ${t.sw[3]} 100%);--glow:${t.sw[0]}66;--ring:${t.sw[1]}"></span>
        <span class="grow"><span class="tn">${esc(t.name)}</span><span class="td" style="display:block">${esc(t.desc)}</span></span>
        ${(S.settings.theme || 'reactor') === t.id ? `<span class="ck">${ico('check')}</span>` : ''}
      </button>`).join('')}</div>`;
  if (k === 'hero') return `
    <div class="card">
      <label class="f" style="margin-top:0">Имя</label>
      <input type="text" id="pname" value="${esc(S.profile.name)}" maxlength="24">
      <label class="f">Символ в ядре</label>
      <div class="picker">${AVATAR_CHOICES.map((a) => `<button data-act="avatar" data-a="${a}" class="${S.profile.avatar === a ? 'sel' : ''}">${ico(a)}</button>`).join('')}</div>
    </div>`;
  if (k === 'stats') return `
    <div class="card">
      ${S.stats.map((s) => `
        <div class="list-item">
          <div class="sico" style="color:${s.color}">${ico(s.icon)}</div>
          <div class="grow sn">${esc(s.name)}</div>
          <button class="btn sm" data-act="edit-stat" data-id="${s.id}">Изменить</button>
        </div>`).join('')}
      <button class="btn block" data-act="add-stat" style="margin-top:10px">＋ Добавить параметр</button>
    </div>
    ${(S.archivedStats || []).length ? `<h2>Скрытые параметры</h2>
    <div class="card">
      <div class="small muted" style="margin-bottom:8px">Очки скрытых параметров сохранены — верни параметр, и они снова начнут учитываться.</div>
      ${S.archivedStats.map((s) => `
        <div class="list-item">
          <div class="sico" style="color:${s.color}">${ico(s.icon)}</div>
          <div class="grow sn">${esc(s.name)}</div>
          <button class="btn sm" data-act="restore-stat" data-id="${s.id}">Вернуть</button>
        </div>`).join('')}
    </div>` : ''}`;
  if (k === 'quests') return `
    <div class="small muted" style="margin:-4px 2px 10px">Подвиг даёт до ${QUEST_MAX_REWARD} очков в параметр и засчитывается до ${QUEST_DAY_LIMIT} раз за день.</div>
    <div class="card">
      ${S.quests.map((q) => `
        <div class="list-item">
          <span class="qi" style="color:var(--ic)">${ico(q.icon)}</span>
          <div class="grow"><div style="font-weight:600">${esc(q.name)}</div><span class="qr" style="margin-top:3px">${rewardsHTML(q.rewards)}</span></div>
          <button class="btn sm" data-act="edit-quest" data-id="${q.id}">Изменить</button>
        </div>`).join('')}
      <button class="btn block" data-act="add-quest" style="margin-top:10px">＋ Добавить подвиг</button>
    </div>`;
  if (k === 'debuffs') return `
    <div class="small muted" style="margin:-4px 2px 10px">Слабость копит позор. Параметры, отмеченные здесь, страдают, когда набирается новая ступень клейма.</div>
    <div class="card bad-card">
      ${(S.debuffs || []).map((q) => `
        <div class="list-item">
          <span class="qi" style="color:var(--tox)">${ico(q.icon)}</span>
          <div class="grow"><div style="font-weight:600">${esc(q.name)}</div><span class="qr" style="margin-top:3px">${rewardsHTML(q.rewards)}</span></div>
          <button class="btn sm" data-act="edit-quest" data-kind="debuff" data-id="${q.id}">Изменить</button>
        </div>`).join('')}
      <button class="btn block" data-act="add-quest" data-kind="debuff" style="margin-top:10px">＋ Добавить слабость</button>
    </div>`;
  if (k === 'ai') return aiSettingsHTML();
  if (k === 'notify') return `
    <div class="card row between">
      <div><div style="font-weight:600">Звуковые эффекты</div><div class="small muted">${IS_IOS ? 'На iPhone молчат в беззвучном режиме' : 'Громкость — как у мультимедиа'}</div></div>
      <button class="switch ${S.settings.sound ? 'on' : ''}" data-act="sound" aria-label="Звук"><i></i></button>
    </div>
    ${notifyHTML()}`;
  if (k === 'data') return `
    ${cloudHTML()}
    <h2>Файл резервной копии</h2>
    <div class="card">
      <div class="small muted" style="margin-bottom:10px">Скачай копию в файл — её можно открыть на другом телефоне через «Импорт».</div>
      <div class="row">
        <button class="btn grow" data-act="export">${ico('upload')} Экспорт</button>
        <button class="btn grow" data-act="import">${ico('download')} Импорт</button>
      </div>
      <input type="file" id="importfile" accept="application/json,.json,text/plain" class="hidden">
    </div>
    <h2 class="bad-h">Опасная зона</h2>
    <div class="card"><button class="btn danger block" data-act="reset">Начать заново…</button></div>`;
  if (k === 'install') return IS_IOS ? `
    <div class="card small">
      1. Открой эту страницу в <b>Safari</b>.<br>
      2. Нажми <b>«Поделиться»</b> (квадрат со стрелкой).<br>
      3. Выбери <b>«На экран „Домой“»</b>.<br>
      <span class="muted">Приложение будет открываться на весь экран, работать без интернета и сможет присылать напоминания.</span>
    </div>` : `
    <div class="card small">
      1. Открой эту страницу в <b>Chrome</b>.<br>
      2. Нажми <b>⋮</b> в правом верхнем углу.<br>
      3. Выбери <b>«Установить приложение»</b> (или «Добавить на главный экран»).<br>
      <span class="muted">Приложение появится среди остальных, будет работать без интернета и сможет присылать напоминания.</span>
    </div>`;
  return `
    <div class="card small muted">
      Каждый вечер отмечай подвиги или расскажи о дне ИИ — он начислит очки за то, что не покрывают подвиги. Вручную очки параметрам не начисляются.
      Чтобы параметр перешёл с уровня N на N+1, нужно 10×N очков: первые уровни даются быстро, дальше нужна регулярность.
      Уровень персонажа растёт от суммы всех очков. Серия — сколько дней подряд ты прокачивался.
      Отмечать можно сегодня и вчера; более ранние дни закрыты для правок. До 4 утра «Итоги» открываются на вчерашнем дне.
      Слабости копят позор: параметры падают, когда набирается новая ступень клейма, а 14 чистых дней снимают ступень и возвращают очки.
    </div>
    <div class="row between small muted" style="margin-top:14px;padding:0 2px">
      <span>Версия приложения ${APP_VERSION}</span>
      <button class="btn sm" data-act="app-update">Проверить обновление</button>
    </div>
    <button class="btn block" data-act="show-onboarding" style="margin-top:12px">Показать знакомство заново</button>`;
}
// Заполняются ниже (напоминания и облачная копия).
function notifyHTML() { return typeof pushSettingsHTML === 'function' ? pushSettingsHTML() : ''; }
function cloudHTML() { return typeof cloudSettingsHTML === 'function' ? cloudSettingsHTML() : ''; }

/* ---------------------- Лига друзей ---------------------- */

function weekStartKey(k) { const d = parseKey(k); return addDays(k, -((d.getDay() + 6) % 7)); }   // понедельник

// Сводка игрока для лиги — единственное, что уходит на сервер.
function leagueProfile() {
  const t = todayKey(), ws = weekStartKey(t), pws = addDays(ws, -7);
  let week = 0, loss = 0, last = 0, lastLoss = 0, weak = 0, lastWeak = 0;
  const src = { quests: 0, manual: 0, penalties: 0 };
  for (const k in S.log) {
    const d = S.log[k];
    if (k >= ws && k <= t) {
      week += dayTotal(d, k); loss += dayLoss(d, k); weak += dayWeak(d);
      for (const x of d.d || []) for (const id in x.r) if (statById(id)) src.quests += x.r[id];
      for (const id in d.m || {}) if (statById(id) && d.m[id] > 0) src.manual += d.m[id];
    } else if (k >= pws && k < ws) { last += dayTotal(d, k); lastLoss += dayLoss(d, k); lastWeak += dayWeak(d); }
  }
  src.penalties = loss;
  const xp = statXP(), total = totalXP(xp), ch = levelInfo(total, charK());
  const all = allAchievements(), totals = counterTotals();
  const shameTitles = counterList(S).filter(isShame).map((c) => {
    let top = null; c.tiers.forEach((x) => { if ((totals[c.id] || 0) >= x.goal) top = x; });
    return top ? { t: top.title, g: top.goal } : null;
  }).filter(Boolean).sort((a, b) => b.g - a.g).slice(0, 4).map((x) => x.t);
  return {
    v: 1, app: APP_VERSION, level: ch.level, title: titleFor(ch.level), xp: total, week, weekLoss: loss, weekWeak: weak, weekStart: ws, lastWeek: last, lastWeekLoss: lastLoss, lastWeekWeak: lastWeak, lastWeekStart: pws,
    streak: currentStreak(), best: bestStreak(), ach: all.filter((a) => a.kind !== 'shame' && a.ok).length,
    shame: all.filter((a) => a.kind === 'shame' && a.ok).length, shameTitles,
    stats: S.stats.slice(0, 8).map((s) => ({ n: s.name, i: s.icon, c: s.color, l: levelInfo(xp[s.id], STAT_K).level })),
    src, today: dayTotal(getDay(t), t), day: t,
  };
}

let syncTimer = null, syncing = false;
function scheduleSync(delay = 2500) {
  if (!LEAGUE.joined()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, delay);
}
async function syncNow() {
  if (!LEAGUE.joined() || syncing) return;
  syncing = true;
  try {
    const board = await LEAGUE.sync({ name: S.profile.name, avatar: S.profile.avatar, profile: leagueProfile() });
    if (applySharedItems(board) && tab === 'ach') render(false);
    applyVerdicts(board);
  } catch (e) {
    LEAGUE.set({ error: e.status === 401 ? 'Тебя нет в этой лиге: тебя исключили или доступ потерян. Покинь лигу и вступи заново по приглашению или восстанови доступ кодом' : e.message });
  }
  syncing = false;
  if ($('#sheet').classList.contains('hidden') && (tab === 'league' || courtWaiting())) render(false);
}

// Сервер лиги, развёрнутый в Cloudflare владельца приложения (можно поменять при создании лиги).
const DEFAULT_LEAGUE_SERVER = 'https://levelup.anton2902.workers.dev';

let leagueMode = 'week';
const LEAGUE_MODES = [['week', 'Неделя'], ['level', 'Уровень'], ['streak', 'Серия'], ['shame', 'Позор']];

function timeAgo(ms) {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.round(h / 24);
  return `${d} ${plural(d, 'день', 'дня', 'дней')} назад`;
}
const miniAvatar = (icon, cls = '') => `<span class="mav ${cls}">${ico(icon || 'reactor')}</span>`;

// «Позор недели»: кто больше всех потерял на слабостях за прошлую неделю. Титул держится до следующего понедельника.
function shameOfWeek(members) {
  const pws = addDays(weekStartKey(todayKey()), -7);
  const pick = (p, f, lf) => (p.weekStart === pws ? p[f] || 0 : p.lastWeekStart === pws ? p[lf] || 0 : 0);
  const lastLoss = (p) => pick(p, 'weekLoss', 'lastWeekLoss'), lastWeak = (p) => pick(p, 'weekWeak', 'lastWeekWeak');
  const worst = members.filter((m) => lastWeak(m.p) > 0 || lastLoss(m.p) < 0)
    .sort((a, b) => lastWeak(b.p) - lastWeak(a.p) || lastLoss(a.p) - lastLoss(b.p))[0];
  return worst ? { id: worst.id, loss: lastLoss(worst.p), weak: lastWeak(worst.p) } : null;
}

function leagueRows(board) {
  const ws = weekStartKey(todayKey()), pws = addDays(ws, -7);
  const weekVal = (p) => (p.weekStart === ws ? p.week || 0 : 0);
  const lastVal = (p) => (p.weekStart === pws ? p.week || 0 : p.lastWeekStart === pws ? p.lastWeek || 0 : 0);
  const members = board.members.map((m) => ({ ...m, p: m.profile || {} }));
  const champ = members.filter((m) => lastVal(m.p) > 0).sort((a, b) => lastVal(b.p) - lastVal(a.p))[0];
  const loser = shameOfWeek(members.map((m) => ({ id: m.id, p: m.p })));
  const val = {
    week: (m) => weekVal(m.p),
    level: (m) => (m.p.level || 1) * 1e6 + (m.p.xp || 0),
    streak: (m) => m.p.streak || 0,
    shame: (m) => m.p.shame || 0,
  }[leagueMode];
  return members.sort((a, b) => val(b) - val(a)).map((m, i) => {
    const p = m.p, me = m.id === board.me;
    let big, sub;
    if (leagueMode === 'week') {
      const v = weekVal(p), l = p.weekStart === ws ? p.weekLoss || 0 : 0, wk = p.weekStart === ws ? p.weekWeak || 0 : 0;
      big = `<span class="${v < 0 ? 'neg' : ''}">${sign(v)}</span><small>XP</small>`;
      sub = `${esc(p.title || 'Новичок')} · ур. ${p.level || 1}${wk || l ? ` · <span class="tox">слабостей ${wk}${l ? `, ${l} XP` : ''}</span>` : ''}`;
    } else if (leagueMode === 'level') {
      big = `${p.level || 1}<small>ур.</small>`;
      sub = `${esc(p.title || 'Новичок')} · ${fmt(p.xp || 0)} XP`;
    } else if (leagueMode === 'streak') {
      big = `${p.streak || 0}${ico('flame')}`;
      sub = `рекорд ${p.best || 0} ${plural(p.best || 0, 'день', 'дня', 'дней')}`;
    } else {
      big = `<span class="tox">${p.shame || 0}</span>${ico('skull')}`;
      sub = (p.shameTitles || []).length ? `<span class="tox">${p.shameTitles.map(esc).join(' · ')}</span>` : 'чист, как слеза';
    }
    const stale = Date.now() - m.updated_at > 2 * 864e5 ? ' · давно не заходил' : '';
    return `<button class="card lrow ${me ? 'me' : ''}" data-act="lg-member" data-id="${m.id}">
      <span class="rank r${i + 1}">${i + 1}</span>
      ${miniAvatar(m.avatar)}
      <span class="grow"><span class="lname">${esc(m.name)}${me ? ' <em>ты</em>' : ''}${champ && champ.id === m.id ? `<span class="crown" title="Чемпион прошлой недели">${ico('crown')}</span>` : ''}${loser && loser.id === m.id ? `<span class="tag shamewk">${ico('skull')} позор недели</span>` : ''}</span>
        <span class="lsub">${sub}${stale}</span></span>
      <span class="lval">${big}</span>
    </button>`;
  }).join('');
}

function leagueFeed(board) {
  const KIND = { shame: 'tox', down: 'tox', debuff: 'tox', redeem: 'good', ach: 'gold', level: 'gold' };
  return (board.feed || []).slice(0, 40).map((e) => {
    const r = e.reactions || {};
    const btn = (k, icon, label) => `<button class="react ${r[k] && r[k].mine ? 'on' : ''}" data-act="lg-react" data-id="${e.id}" data-k="${k}">${ico(icon)}${label}${r[k] ? ` <b>${r[k].n}</b>` : ''}</button>`;
    return `<div class="feed-item ${KIND[e.kind] || ''}">
      <span class="fi">${ico(e.icon || 'bolt')}</span>
      <div class="grow">
        <div class="ft">${e.name ? `<b>${esc(e.name)}</b> ` : ''}${esc(e.text)}</div>
        <div class="row" style="gap:6px;margin-top:6px">
          <span class="fa">${timeAgo(e.created_at)}</span><span class="grow"></span>
          ${btn('respect', 'flame', 'Респект')}${btn('lol', 'skull', 'Позор')}
        </div>
      </div>
    </div>`;
  }).join('') || '<div class="empty">Пока тихо. Открой достижение — и лига узнает.</div>';
}

function viewLeague() {
  const c = LEAGUE.cfg();
  if (!LEAGUE.joined(c)) {
    return `
      <h1>Лига</h1>
      <div class="card small muted">Соревнуйся с друзьями: таблица XP за неделю, уровни, серии и коллекции позора, лента достижений и срывов. На сервер уходит только сводка — заметки и подробности дней остаются на телефоне.</div>
      <h2>Вступить по приглашению</h2>
      <div class="card">
        <input type="text" id="lg-invite" placeholder="ABCD-EFGH@levelup.имя.workers.dev" autocapitalize="off" autocomplete="off" spellcheck="false">
        <button class="btn primary block" data-act="lg-join" style="margin-top:10px">${ico('users')} Вступить</button>
      </div>
      <h2>Создать свою лигу</h2>
      <div class="card">
        <label class="f" style="margin-top:0">Адрес сервера</label>
        <input type="text" id="lg-server" value="${esc(c.server || DEFAULT_LEAGUE_SERVER)}" placeholder="https://levelup.имя.workers.dev" autocapitalize="off" autocomplete="off" spellcheck="false">
        <label class="f">Название лиги</label>
        <input type="text" id="lg-name" placeholder="Лига героев" maxlength="40">
        <button class="btn block" data-act="lg-create" style="margin-top:12px">${ico('crown')} Создать лигу</button>
        <div class="small muted" style="margin-top:10px">Сервер разворачивается в твоём аккаунте Cloudflare — инструкция в README репозитория.</div>
      </div>
      <h2>Перенос с другого телефона</h2>
      <div class="card">
        <input type="text" id="lg-restore" placeholder="LVR1.…" autocapitalize="off" autocomplete="off" spellcheck="false">
        <button class="btn block" data-act="lg-restore" style="margin-top:10px">Восстановить по коду</button>
      </div>
      <div class="small" id="lg-status" style="margin-top:10px"></div>`;
  }
  const b = c.board;
  return `
    <div class="sub"><span class="dot"></span>league · ${esc(c.code)}</div>
    <div class="card sweep">
      <div class="row between">
        <div class="grow"><div class="lgname">${esc(c.name || 'Лига')}</div>
          <div class="sx">${b ? `${b.members.length} ${plural(b.members.length, 'участник', 'участника', 'участников')} · ` : ''}${c.lastSync ? 'обновлено ' + timeAgo(c.lastSync) : 'ещё не синхронизировано'}</div></div>
        <button class="icon-btn" data-act="lg-refresh" aria-label="Обновить">${ico(TI().refresh)}</button>
      </div>
      ${c.error ? `<div class="small err" style="margin-top:8px">${esc(c.error)}</div>` : ''}
      <div class="row" style="margin-top:12px">
        <button class="btn grow" data-act="lg-invite">${ico('upload')} Пригласить</button>
      </div>
    </div>
    ${b && courtWaiting(b) ? courtHTML(b, true) : ''}
    <div class="seg">${LEAGUE_MODES.map(([k, l]) => `<button data-act="lg-mode" data-m="${k}" class="${leagueMode === k ? 'active' : ''}">${l}</button>`).join('')}</div>
    ${b ? leagueRows(b) : '<div class="empty">Загружаю таблицу…</div>'}
    ${b && !courtWaiting(b) ? courtHTML(b) : ''}
    <h2>Лента лиги</h2>
    <div class="card">${b ? leagueFeed(b) : ''}</div>
    <div class="row" style="margin-top:14px">
      <button class="btn grow sm" data-act="lg-recovery">Код восстановления</button>
      <button class="btn grow sm danger" data-act="lg-leave">Покинуть лигу</button>
    </div>`;
}

/* ---------------------- Суд лиги: доносы и похвалы ---------------------- */

function reportOpen(id, kind) {
  const b = LEAGUE.cfg().board;
  const m = b && b.members.find((x) => x.id === id);
  if (!m) return;
  if (!AI.ready()) {
    openSheet(`
      <h1>Нужен ИИ</h1>
      <div class="muted">Донос и похвалу разбирает ИИ: он превращает рассказ в отчёт для голосования. Подключи Claude или свой сервер в настройках.</div>
      <div class="row" style="margin-top:20px">
        <button class="btn grow" data-act="close-sheet">Позже</button>
        <button class="btn primary grow" data-act="ai-setup">Открыть настройки</button>
      </div>`);
    return;
  }
  ai = { phase: 'input', text: '', result: null, sel: {}, error: '', report: { target: id, name: m.name, kind, day: todayKey() } };
  aiRender();
}

// Отчёт для голосования: выбранные пункты вместе с описаниями, чтобы их можно было применить на чужом телефоне.
function reportData() {
  const r = ai.result, sel = ai.sel, out = { q: [], b: [], s: [], c: [], m: [] };
  const pick = (q) => ({ id: q.id, n: q.name, i: q.icon, r: clone(q.rewards || {}), c: clone(q.c || {}) });
  r.quests.forEach((x) => { const q = S.quests.find((y) => y.id === x.id); if (q && sel['q:' + x.id]) out.q.push({ ...pick(q), k: x.count }); });
  (r.debuffs || []).forEach((x) => { const q = (S.debuffs || []).find((y) => y.id === x.id); if (q && sel['b:' + x.id]) out.b.push({ ...pick(q), k: x.count }); });
  r.stats.forEach((x) => { const st = statById(x.id); if (st && sel['s:' + x.id] && x.points > 0) out.s.push({ id: x.id, n: st.name, p: x.points }); });
  r.counters.forEach((x) => { const c = counterById(x.id); if (c && sel['c:' + x.id]) out.c.push({ id: x.id, n: c.name, u: c.unit, i: c.icon, a: x.amount }); });
  r.milestones.forEach((x) => { const m = milestoneById(x.id); if (m && sel['m:' + x.id]) out.m.push({ id: x.id, n: m.name, i: m.icon }); });
  out.note = (($('#ai-note') || {}).value || r.note || '').trim().slice(0, 400);
  return out;
}

async function reportSend() {
  const rp = ai.report;
  if (!rp || !ai.result) return;
  const data = reportData();
  if (!data.q.length && !data.b.length && !data.s.length && !data.c.length && !data.m.length) { toast('Отметь хотя бы один пункт'); return; }
  const btn = $('[data-act=rp-send]'); if (btn) { btn.disabled = true; btn.textContent = 'Отправляю…'; }
  try {
    await LEAGUE.propose(rp.target, rp.day, rp.kind, ai.text.trim(), (ai.result.summary || ai.text).trim().slice(0, 300), data);
    closeSheet();
    ai = { phase: 'input', text: '', result: null, sel: {}, error: '', report: null };
    toast(rp.kind === 'praise' ? 'Похвала отправлена на голосование' : 'Донос отправлен на голосование', 'gold', 'balance');
    SFX.play('confirm');
    go('league');
    syncNow();
  } catch (e) {
    SFX.play('error');
    toast(e.message || String(e));
    if (btn) { btn.disabled = false; btn.textContent = 'Отправить'; }
  }
}

// Что именно предлагается записать — компактно, для карточки голосования.
function verdictItems(d) {
  const chip = (icon, text, color) => `<span class="chip" style="color:${color}">${ico(icon)}${esc(text)}</span>`;
  return [
    ...(d.q || []).map((x) => chip(x.i, x.n + (x.k > 1 ? ' ×' + x.k : ''), 'var(--ic)')),
    ...(d.b || []).map((x) => chip(x.i, x.n + (x.k > 1 ? ' ×' + x.k : ''), 'var(--tox)')),
    ...(d.s || []).map((x) => chip('sparkle', `${x.n} +${x.p}`, 'var(--am)')),
    ...(d.c || []).map((x) => chip(x.i || 'star', `${x.n} +${fmtNum(x.a)} ${x.u || ''}`.trim(), 'var(--ic)')),
    ...(d.m || []).map((x) => chip(x.i || 'medal', 'Веха: ' + x.n, 'var(--am)')),
  ].join('');
}

const VERDICT_STATUS = { approved: 'утверждено лигой', rejected: 'отклонено', expired: 'закрыто: участник покинул лигу', withdrawn: 'отозвано автором' };
// Итог голосования: по большинству или по истечении 3 суток (тогда по текущим голосам, при равенстве — оправдан).
function verdictLabel(p) {
  const timeout = p.deadline && p.resolved_at && p.resolved_at >= p.deadline;
  const praise = p.kind === 'praise';
  if (p.status === 'approved') return timeout ? 'время вышло · утверждено по голосам' : 'утверждено лигой';
  if (p.status === 'rejected') return (timeout ? 'время вышло · ' : '') + (praise ? 'не утверждено' : 'оправдан');
  return VERDICT_STATUS[p.status] || p.status;
}
// Сколько осталось до конца голосования (по часам сервера).
function timeLeft(p, b) {
  if (!p.deadline) return '';
  const skew = (b.serverTime || 0) - (LEAGUE.cfg().lastSync || Date.now());
  const ms = p.deadline - (Date.now() + skew);
  if (ms <= 0) return 'время вышло — итог при следующем обновлении';
  const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
  return 'осталось ' + (h >= 24 ? `${Math.floor(h / 24)} д ${h % 24} ч` : h ? `${h} ч ${m} мин` : `${m} мин`);
}
function courtHTML(b, urgent) {
  const list = (b.proposals || []).filter((p) => p.status === 'pending' || Date.now() - (p.resolved_at || p.created_at) < 3 * 864e5);
  if (!list.length) return `<h2>Суд лиги</h2><div class="card small muted">Открытых голосований нет. Чтобы донести или похвалить, нажми на участника в таблице.</div>`;
  const card = (p) => {
    const praise = p.kind === 'praise', me = b.me;
    const pending = p.status === 'pending';
    const about = p.target === me ? 'о тебе' : '';
    return `<div class="card court ${praise ? 'praise' : 'complaint'} ${pending ? '' : 'closed'}">
      <div class="row" style="gap:10px">${miniAvatar(p.authorAvatar)}
        <div class="grow"><div class="ct"><b>${esc(p.authorName)}</b> ${praise ? 'хвалит' : 'доносит'} → <b>${esc(p.targetName)}</b>${about ? ` <span class="tag ${praise ? 'lg' : 'shamewk'}">${about}</span>` : ''}</div>
          <div class="sx">${shortDate(p.day)} · ${timeAgo(p.created_at)}</div></div>
        <span class="cico ${praise ? '' : 'tox'}">${ico(praise ? 'medal' : 'balance')}</span></div>
      <div class="csum">${esc(p.summary)}</div>
      <div class="chips">${verdictItems(p.data || {})}</div>
      <details class="ctext"><summary>Что рассказал ${esc(p.authorName)}</summary><div>«${esc(p.text)}»</div></details>
      <div class="cvotes">
        <span class="ok">за ${p.yes}</span><span class="err">против ${p.no}</span>
        <span class="muted">${pending ? `нужно ${p.need} из ${p.voters} · ${timeLeft(p, b)}` : verdictLabel(p)}</span>
      </div>
      ${p.eligible ? `<div class="cvoters">${p.eligible.map((id) => {
        const v = (p.votes || []).find((x) => x.m === id), mem = (b.members || []).find((x) => x.id === id);
        const nm = mem ? mem.name : '—', cls = v ? (v.v > 0 ? 'ok' : 'err') : 'muted';
        return `<span class="${cls}">${esc(nm)}${id === me ? ' (ты)' : ''}: ${v ? (v.v > 0 ? 'за' : 'против') : pending ? 'ждём' : 'не голосовал'}</span>`;
      }).join('')}</div>` : ''}
      ${pending && p.author === me ? '<div class="small muted" style="margin-top:6px">Ты автор — твой голос «за» засчитан сразу. Ждём остальных.</div>' : ''}
      ${pending && p.canVote && p.author !== me ? `<div class="row" style="margin-top:10px">
        <button class="btn grow sm ${p.myVote > 0 ? 'primary' : ''}" data-act="rp-vote" data-id="${p.id}" data-v="${p.myVote > 0 ? 0 : 1}">${ico('check')} За</button>
        <button class="btn grow sm ${p.myVote < 0 ? 'danger' : ''}" data-act="rp-vote" data-id="${p.id}" data-v="${p.myVote < 0 ? 0 : -1}">✕ Против</button>
      </div>` : pending && p.target === me ? '<div class="small muted" style="margin-top:8px">Отчёт о тебе — решают остальные участники.</div>' : ''}
      ${pending && p.author === me ? `<button class="btn block sm" style="margin-top:8px" data-act="rp-withdraw" data-id="${p.id}">Отозвать</button>` : ''}
    </div>`;
  };
  const pend = list.filter((p) => p.status === 'pending'), done = list.filter((p) => p.status !== 'pending');
  return `<h2>Суд лиги${urgent ? ' · нужен твой голос' : ''}</h2>${pend.map(card).join('')}${done.length ? `<details class="court-old"><summary>Решения за последние дни (${done.length})</summary>${done.map(card).join('')}</details>` : ''}`;
}

// Штраф или бонус суда: по параметрам, которые затрагивает отчёт (не больше двух самых затронутых).
function courtPoints(p) {
  const d = p.data || {}, w = {};
  const add = (id, v) => { if (statById(id) && v > 0) w[id] = (w[id] || 0) + v; };
  if (p.kind === 'praise') {
    (d.q || []).forEach((x) => { const q = S.quests.find((y) => y.id === x.id) || { rewards: x.r || {} }; for (const id in q.rewards || {}) add(id, q.rewards[id] * (x.k || 1)); });
    (d.s || []).forEach((x) => add(x.id, x.p));
  } else {
    (d.b || []).forEach((x) => { const q = (S.debuffs || []).find((y) => y.id === x.id) || { rewards: x.r || {} }; for (const id in q.rewards || {}) add(id, -q.rewards[id] * (x.k || 1)); });
    (d.c || []).forEach((x) => { if (isShame(counterById(x.id))) { const bw = brandWeights(x.id); for (const id in bw) add(id, bw[id]); } });
    (d.m || []).forEach((x) => (SHAME_MS_STATS[x.id] || []).forEach((id) => add(id, 1)));
  }
  let ids = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
  if (!ids.length) ids = [p.kind === 'praise' ? (statById('cha') ? 'cha' : S.stats[0] && S.stats[0].id) : fallbackStat()].filter(Boolean);
  return Object.fromEntries(ids.map((id) => [id, p.kind === 'praise' ? COURT_POINTS : -COURT_POINTS]));
}

// Итоги моих доносов: утверждённый — в «Поборника справедливости», отклонённый — в «Ябеду».
function courtOutcomes(board) {
  const fresh = (board.proposals || []).filter((p) => p.author === board.me && p.kind === 'complaint'
    && (p.status === 'approved' || p.status === 'rejected') && !S.courtSeen.includes(p.id));
  if (!fresh.length) return;
  mutate(() => {
    for (const p of fresh) {
      const rk = dateKey(new Date(p.resolved_at || Date.now())), t = todayKey();
      const day = ensureDay(rk > t ? t : rk);
      const cid = p.status === 'approved' ? 'court_truth' : 'court_rat';
      day.cc = day.cc || {};
      day.cc[cid] = (day.cc[cid] || 0) + 1;
      S.courtSeen.push(p.id);
    }
    S.courtSeen = S.courtSeen.slice(-500);
  });
}

// Утверждённые лигой отчёты обо мне — добавляем в нужный день.
let applyingVerdicts = false;
function applyVerdicts(board) {
  if (!board || applyingVerdicts) return;
  courtOutcomes(board);
  const mine = (board.proposals || []).filter((p) => p.target === board.me && p.status === 'approved' && !p.applied);
  if (!mine.length) return;
  applyingVerdicts = true;
  const fresh = mine.filter((p) => !S.courtDone.includes(p.id));
  if (fresh.length) {
    mutate(() => {
      for (const p of fresh) {
        const d = p.data || {}, by = p.authorName, t = todayKey();
        const day = ensureDay(/^\d{4}-\d{2}-\d{2}$/.test(p.day) && p.day <= t ? p.day : t);
        const tag = { by, pid: p.id, kind: p.kind };
        const item = (x, list) => {
          const local = list.find((y) => y.id === x.id) || x;
          return { q: local.id, n: local.name || x.n, i: local.icon || x.i, r: capRewards(local.rewards || x.r || {}), c: clone(local.c || {}), ...tag };
        };
        (d.q || []).forEach((x) => { const room = Math.max(0, QUEST_DAY_LIMIT - day.d.filter((z) => z.q === x.id).length); for (let i = 0; i < Math.min(clamp(x.k || 1, 1, 5), room); i++) day.d.push(item(x, S.quests)); });
        (d.b || []).forEach((x) => { for (let i = 0; i < clamp(x.k || 1, 1, 5); i++) day.b.push(item(x, S.debuffs || [])); });
        (d.s || []).forEach((x) => { if (statById(x.id) && x.p > 0) day.m[x.id] = clamp((day.m[x.id] || 0) + Math.min(10, x.p), -50, 99); });
        (d.c || []).forEach((x) => { if (counterById(x.id) && x.a > 0) day.c[x.id] = round1((day.c[x.id] || 0) + Math.min(1000, x.a)); });
        const unlocked = milestoneDates();
        (d.m || []).forEach((x) => { if (milestoneById(x.id) && !unlocked[x.id] && !day.ms.includes(x.id)) day.ms.push(x.id); });
        (day.court = day.court || []).push({ pid: p.id, kind: p.kind, by, r: courtPoints(p) });
        const line = `⚖ Решение лиги — ${p.kind === 'praise' ? 'похвала' : 'донос'}, автор ${by}: ${d.note || p.summary}`;
        day.note = day.note && day.note.trim() ? day.note.trim() + '\n' + line : line;
        S.courtDone.push(p.id);
      }
      S.courtDone = S.courtDone.slice(-300);
    });
    fresh.forEach((p, i) => setTimeout(() => toast(`Лига утвердила ${p.kind === 'praise' ? 'похвалу' : 'донос'} (автор — ${p.authorName}): ${p.summary}`, p.kind === 'praise' ? 'gold' : 'shame', p.kind === 'praise' ? 'medal' : 'balance'), 900 + i * 400));
  }
  Promise.all(mine.map((p) => LEAGUE.markApplied(p.id).catch(() => null))).finally(() => { applyingVerdicts = false; });
}

function memberSheet(id) {
  const b = LEAGUE.cfg().board;
  const m = b && b.members.find((x) => x.id === id);
  if (!m) return;
  const p = m.profile || {}, ws = weekStartKey(todayKey());
  const src = p.src || {};
  const loser = shameOfWeek(b.members.map((x) => ({ id: x.id, p: x.profile || {} })));
  openSheet(`
    <div class="row" style="gap:14px">${miniAvatar(m.avatar, 'big')}
      <div class="grow"><h1 style="margin:0">${esc(m.name)}</h1><div class="hero-title" style="letter-spacing:.12em">${esc(p.title || 'Новичок')} · ${p.level || 1} уровень</div></div></div>
    <div class="kpis">
      <div class="kpi"><b>${sign(p.weekStart === ws ? p.week || 0 : 0)}</b><span>XP за неделю</span></div>
      <div class="kpi"><b>${p.streak || 0}</b><span>серия</span></div>
      <div class="kpi"><b>${p.ach || 0}</b><span>наград</span></div>
    </div>
    ${(p.stats || []).length ? `<h2>Параметры</h2><div class="chips">${p.stats.map((s) => `<span class="chip" style="color:${s.c}">${ico(s.i)}${esc(s.n)} ${s.l}</span>`).join('')}</div>` : ''}
    ${p.weekStart === ws ? `<h2>Откуда XP за неделю</h2><div class="card small">
      <div class="row between"><span>Подвиги</span><b>+${src.quests || 0}</b></div>
      <div class="row between"><span>От ИИ</span><b>+${src.manual || 0}</b></div>
      <div class="row between tox"><span>Слабости и штрафы</span><b>${src.penalties || 0}</b></div></div>` : ''}
    <h2 class="bad-h">Позор</h2>
    ${loser && loser.id === m.id ? `<div class="card small shame-intro" style="margin-bottom:8px">${ico('skull')}<div><b class="tox">Позор недели</b><div class="muted">Больше всех слабостей за прошлую неделю: ${loser.weak}${loser.loss ? ` · штрафы за клейма ${loser.loss} XP` : ''}</div></div></div>` : ''}
    <div class="card small">${(p.shameTitles || []).length ? `<span class="tox">${ico('skull')} ${p.shameTitles.map(esc).join(' · ')}</span><div class="muted" style="margin-top:6px">Всего клейм: ${p.shame || 0}</div>` : 'Клейм нет. Пока.'}</div>
    ${m.id !== b.me ? `<h2>Суд лиги</h2>
    <div class="row">
      <button class="btn grow" data-act="rp-open" data-id="${m.id}" data-k="praise">${ico('medal')} Похвалить</button>
      <button class="btn grow danger" data-act="rp-open" data-id="${m.id}" data-k="complaint">${ico('balance')} Донести</button>
    </div>
    <div class="small muted" style="margin-top:8px">ИИ составит отчёт за день, лига проголосует. При большинстве «за» он добавится в день ${esc(m.name)}.</div>` : ''}
    ${b.owner === b.me && m.id !== b.me ? `<button class="btn block sm danger" style="margin-top:16px" data-act="lg-kick" data-id="${m.id}">Исключить из лиги</button>` : ''}
    <div class="sx" style="margin-top:12px;text-align:center">${b.owner === m.id ? 'основатель лиги · ' : ''}обновлено ${timeAgo(m.updated_at)} · ${(p.app || 0) >= APP_VERSION ? 'версия ' + p.app : `<span class="tox">старая версия приложения${p.app ? ' ' + p.app : ''} — пусть перезапустит</span>`}</div>
  `);
}

async function leagueAction(fn, okMsg) {
  const st = $('#lg-status');
  if (st) { st.className = 'small muted'; st.textContent = 'Связываюсь с сервером…'; }
  try {
    await fn();
    if (okMsg) toast(okMsg, 'gold', 'users');
    SFX.play('confirm');
    await syncNow();
    render(true);
  } catch (e) {
    SFX.play('error');
    if (st) { st.className = 'small err'; st.textContent = '✕ ' + (e.message || e); } else toast(e.message || String(e));
  }
}

async function shareText(text, okMsg) {
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast(okMsg || 'Скопировано', 'gold', 'check'); }
  catch (e) { toast('Не удалось скопировать'); }
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

const questListOf = (kind) => (kind === 'debuff' ? S.debuffs : S.quests);

function questEditor(id, kind = 'quest') {
  const bad = kind === 'debuff';
  const q = id ? questListOf(kind).find((x) => x.id === id) : { id: '', name: '', icon: bad ? 'skull' : 'bolt', rewards: {}, c: {} };
  openSheet(`
    <h1>${bad ? (id ? 'Слабость' : 'Новая слабость') : (id ? 'Подвиг' : 'Новый подвиг')}</h1>
    <label class="f">Название</label>
    <input type="text" id="q-name" value="${esc(q.name)}" maxlength="40" placeholder="${bad ? 'Например, Ночной дожор' : 'Например, Холодный душ'}">
    <label class="f">Символ</label>
    ${iconPicker(q.icon)}
    <label class="f">${bad ? 'По каким параметрам бьют клейма (сильнее — полный штраф, слабее — половина)' : `Награда (до ${QUEST_MAX_REWARD} очков в параметр, подвиг — до ${QUEST_DAY_LIMIT} раз в день)`}</label>
    ${S.stats.map((s) => {
      const v = q.rewards[s.id] || 0;
      return `
      <div class="list-item">
        <div class="sico" style="color:${s.color}">${ico(s.icon)}</div>
        <div class="grow sn">${esc(s.name)}</div>
        <div class="stepper">
          <button class="icon-btn" data-act="qr-dec" data-id="${s.id}">−</button>
          <span class="val ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}" id="qr-${s.id}" data-v="${v}">${v}</span>
          <button class="icon-btn" data-act="qr-inc" data-id="${s.id}" ${bad ? 'data-max="0"' : ''}>+</button>
        </div>
      </div>`;
    }).join('')}
    <label class="f">Счётчики достижений</label>
    <div id="qc-list">${Object.entries(q.c || {}).filter(([cid]) => counterById(cid)).map(([cid, v]) => qcRow(cid, v)).join('')}</div>
    <select id="qc-add" class="select">
      <option value="">＋ Привязать счётчик…</option>
      ${SPHERES.filter((sp) => sp.id !== 'system').map((sp) => `<optgroup label="${sp.name}">${counterList(S).filter((c) => c.sphere === sp.id && !c.auto).map((c) => `<option value="${c.id}">${esc(c.name)} (${c.unit})</option>`).join('')}</optgroup>`).join('')}
    </select>
    <div class="row" style="margin-top:22px">
      ${id ? `<button class="btn danger" data-act="del-quest" data-kind="${kind}" data-id="${id}">Удалить</button>` : ''}
      <button class="btn grow" data-act="close-sheet">Отмена</button>
      <button class="btn primary grow" data-act="save-quest" data-kind="${kind}" data-id="${id || ''}">Сохранить</button>
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
    ${isShame(c) ? `<div class="card" style="margin-top:12px">${redeemHTML(c)}${shameInfo(id).redeemed ? `<div class="small muted" style="margin-top:6px">Уже снято ступеней: ${shameInfo(id).redeemed}</div>` : ''}</div>`
      : `<div class="small muted" style="margin:12px 2px">${next ? `До ступени «${esc(next.title)}»: ${fmtNum(round1(next.goal - total))} ${c.unit}` : 'Все ступени этой цепочки пройдены!'}</div>`}
    ${c.auto ? '<div class="small muted" style="margin:6px 2px">Считается автоматически по решениям суда лиги.</div>' : `<label class="f">Добавить за сегодня</label>
    <div class="row qty">
      ${(big ? [1, 5, 10] : [1, 2, 5]).map((n) => `<button class="btn grow" data-act="counter-add" data-id="${id}" data-n="${n}">+${n}</button>`).join('')}
    </div>
    <div class="row" style="margin-top:8px">
      <input type="text" inputmode="decimal" id="counter-n" placeholder="Своё число, ${c.unit}">
      <button class="btn primary" data-act="counter-add" data-id="${id}" data-n="custom">Добавить</button>
    </div>
    ${(getDay(todayKey()) && (getDay(todayKey()).c || {})[id]) ? `<button class="btn danger block" data-act="counter-add" data-id="${id}" data-n="-1" style="margin-top:8px">−1 за сегодня</button>` : ''}`}
    <div class="tiers big">${c.tiers.map((t, i) => {
      const r = rarityOf(c, i);
      return `<div class="tier ${total >= t.goal ? 'on' : ''}" style="--r:${r.color}"><span class="hx">${ico(total >= t.goal ? c.icon : 'sparkle')}</span><b>${fmtNum(t.goal)}</b><em>${esc(t.title)}</em></div>`;
    }).join('')}</div>
    ${c.desc ? `<div class="small muted" style="margin-top:14px">Что считается: ${esc(c.desc)}</div>` : ''}
    ${c.shared ? `<div class="small muted" style="margin-top:6px">Общее достижение лиги · добавил ${esc(c.authorName || 'участник лиги')}</div>` : ''}
    <div class="row" style="margin-top:16px">
      ${c.custom ? `<button class="btn grow" data-act="edit-cc" data-id="${id}">Изменить</button>` : ''}
      ${c.custom && LEAGUE.joined() ? `<button class="btn grow" data-act="share-item" data-kind="counter" data-id="${id}">${ico('users')} В лигу</button>` : ''}
      ${c.shared && c.author === LEAGUE.cfg().memberId ? `<button class="btn grow danger" data-act="unshare-item" data-id="${id}">Убрать из лиги</button>` : ''}
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
      <div class="sx" style="margin-top:8px">${sphereById(m.sphere).name} · ${date ? 'открыто ' + shortDate(date) : 'ещё не открыто'}${m.custom ? ' · своё' : ''}${m.shared ? ' · общее, добавил ' + esc(m.authorName || 'участник лиги') : ''}</div>
    </div>
    <div class="row" style="margin-top:20px">
      ${m.custom ? `<button class="btn grow" data-act="edit-cm" data-id="${id}">Изменить</button>` : `<button class="btn grow" data-act="close-sheet">Закрыть</button>`}
      ${m.custom && LEAGUE.joined() ? `<button class="btn grow" data-act="share-item" data-kind="milestone" data-id="${id}">${ico('users')} В лигу</button>` : ''}
      ${m.shared && m.author === LEAGUE.cfg().memberId ? `<button class="btn grow danger" data-act="unshare-item" data-id="${id}">Убрать из лиги</button>` : ''}
      ${date ? `<button class="btn danger grow" data-act="rm-ms" data-id="${id}" data-sheet="1">Снять отметку</button>`
             : `<button class="btn ${m.sphere === 'shame' ? 'shamebtn' : 'primary'} grow" data-act="ms-done" data-id="${id}">${ico(m.sphere === 'shame' ? 'skull' : 'check')} ${m.sphere === 'shame' ? 'Было сегодня' : 'Выполнено сегодня'}</button>`}
    </div>
  `);
}

// Полоска искупления для цепочки позора.
function redeemHTML(c) {
  const st = shameInfo(c.id);
  if (st.value <= 0) {
    const had = (computeCounters().raw[c.id] || 0) > 0;
    return `<div class="redeem ok">${ico(TI().magic)}<span>${had ? 'Клеймо снято. Так держать!' : 'Чисто. Не начинай.'}</span></div>`;
  }
  const cur = [...c.tiers].reverse().find((t) => st.value >= t.goal);
  const left = REDEEM_DAYS - st.clean;
  return `<div class="redeem">
    <div class="row between"><span>${ico(TI().magic)} Искупление${cur ? ` «${esc(cur.title)}»` : ''}</span><b>${st.clean}/${REDEEM_DAYS} дн.</b></div>
    ${barHTML('rd-' + c.id, st.clean / REDEEM_DAYS, '#5dffb0')}
    <div class="sx">${left === 1 ? 'Ещё 1 чистый день' : `Ещё ${left} чистых ${plural(left, 'день', 'дня', 'дней')}`} — и ступень снимется</div>
  </div>`;
}

/* ---------------------- Общие достижения лиги ---------------------- */

const itemData = (x, kind) => ({
  name: x.name, desc: x.desc || '', icon: x.icon || 'star', sphere: x.home || x.sphere,
  ...(kind === 'counter' ? { unit: x.unit, tiers: x.tiers.map((t) => ({ goal: t.goal, title: t.title })) } : {}),
});

// Привести список с сервера к общим достижениям на телефоне.
function applySharedItems(board) {
  if (!board || !Array.isArray(board.items)) return false;
  const names = Object.fromEntries((board.members || []).map((m) => [m.id, m.name]));
  const next = { counters: [], milestones: [] };
  for (const it of board.items) {
    const d = it.data || {};
    const home = SPHERES.find((sp) => sp.id === d.sphere && sp.id !== 'system' && sp.id !== 'league') ? d.sphere : 'adventure';
    const base = { id: it.id, name: String(d.name || 'Достижение'), desc: String(d.desc || ''), icon: ICONS[d.icon] ? d.icon : 'star',
      sphere: home === 'shame' ? 'shame' : 'league', home, shared: true, author: it.author, authorName: names[it.author] || it.authorName || '' };
    if (it.kind === 'counter') {
      const tiers = (d.tiers || []).filter((t) => t && t.goal > 0).map((t) => ({ goal: Number(t.goal), title: String(t.title || '') }));
      if (tiers.length) next.counters.push({ ...base, unit: String(d.unit || 'раз'), tiers, shame: home === 'shame' });
    } else next.milestones.push(base);
  }
  const ids = new Set([...next.counters, ...next.milestones].map((x) => x.id));
  // Своё достижение, которое уже в лиге, больше не дублируем как «своё».
  const custom = {
    counters: S.custom.counters.filter((c) => !ids.has(c.id)),
    milestones: S.custom.milestones.filter((m) => !ids.has(m.id)),
  };
  // Достижение убрали из лиги: если по нему есть прогресс — оставляем его себе как своё.
  const totals = counterTotals(), md = milestoneDates();
  S.shared.counters.filter((c) => !ids.has(c.id) && (totals[c.id] || 0) > 0)
    .forEach((c) => custom.counters.push({ ...c, sphere: c.home || 'adventure', shared: false, custom: true }));
  S.shared.milestones.filter((m) => !ids.has(m.id) && md[m.id])
    .forEach((m) => custom.milestones.push({ ...m, sphere: m.home || 'adventure', shared: false, custom: true }));
  const changed = JSON.stringify(next) !== JSON.stringify(S.shared) || JSON.stringify(custom) !== JSON.stringify(S.custom);
  if (changed) {
    S.shared = next; S.custom = custom;
    save();
    checkAchievements(true);
  }
  return changed;
}

async function shareItem(id, kind) {
  const list = kind === 'counter' ? S.custom.counters : S.custom.milestones;
  const x = list.find((y) => y.id === id);
  if (!x || !LEAGUE.joined()) return;
  try {
    const board = await LEAGUE.share(id, kind, itemData(x, kind));
    applySharedItems(board);
    toast(`«${x.name}» теперь в лиге`, 'gold', 'users');
    SFX.play('confirm');
    if (!$('#sheet').classList.contains('hidden')) closeSheet();
    render(false);
  } catch (e) {
    toast('Не удалось поделиться: ' + e.message);
  }
}

async function unshareItem(id) {
  try {
    const board = await LEAGUE.unshare(id);
    // Своё достижение возвращается в «свои» вместе с прогрессом.
    const c = S.shared.counters.find((x) => x.id === id), m = S.shared.milestones.find((x) => x.id === id);
    if (c) { S.shared.counters = S.shared.counters.filter((x) => x.id !== id); S.custom.counters.push({ ...c, sphere: c.home || 'adventure', shared: false, custom: true }); }
    if (m) { S.shared.milestones = S.shared.milestones.filter((x) => x.id !== id); S.custom.milestones.push({ ...m, sphere: m.home || 'adventure', shared: false, custom: true }); }
    save();
    applySharedItems(board);
    closeSheet();
    toast('Убрано из лиги — осталось в твоих достижениях');
    render(false);
  } catch (e) {
    toast('Не удалось убрать: ' + e.message);
  }
}

// При выходе из лиги общие достижения с прогрессом становятся своими.
function sharedToCustomOnLeave() {
  const totals = counterTotals(), md = milestoneDates();
  S.shared.counters.filter((c) => c.author === LEAGUE.cfg().memberId || (totals[c.id] || 0) > 0)
    .forEach((c) => S.custom.counters.push({ ...c, sphere: c.home || 'adventure', shared: false, custom: true }));
  S.shared.milestones.filter((m) => m.author === LEAGUE.cfg().memberId || md[m.id])
    .forEach((m) => S.custom.milestones.push({ ...m, sphere: m.home || 'adventure', shared: false, custom: true }));
  S.shared = { counters: [], milestones: [] };
  save();
  checkAchievements(true);
}

/* ---------------------- Свои достижения (редакторы) ---------------------- */

const shareToggle = () => (LEAGUE.joined() ? `<div class="row between" style="margin-top:16px">
    <div><div style="font-weight:600">Поделиться с лигой</div><div class="small muted">Друзья тоже смогут его получить</div></div>
    <button class="switch on" data-act="toggle-switch" id="own-share" aria-label="Поделиться с лигой"><i></i></button></div>` : '');
const sphereSelect = (cur) => `<select id="own-sphere" class="select">${SPHERES.filter((sp) => sp.id !== 'system' && sp.id !== 'league')
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
    ${id ? '' : shareToggle()}
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
    ${id ? '' : shareToggle()}
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
  const share = !id && $('#own-share') && $('#own-share').classList.contains('on');
  const newId = id || uid('cc');
  closeSheet();
  mutate(() => {
    if (id) Object.assign(S.custom.counters.find((c) => c.id === id), data);
    else S.custom.counters.push({ id: newId, ...data });
  });
  achSphere = data.sphere;
  render(false);
  if (share) shareItem(newId, 'counter');
}

function saveCustomMilestone(id) {
  const name = $('#cm-name').value.trim();
  if (!name) { toast('Введи название'); return; }
  const data = { name, desc: $('#cm-desc').value.trim(), sphere: $('#own-sphere').value, icon: $('#pick-icon').value || 'star', custom: true };
  const share = !id && $('#own-share') && $('#own-share').classList.contains('on');
  const newId = id || uid('cm');
  closeSheet();
  mutate(() => {
    if (id) Object.assign(S.custom.milestones.find((m) => m.id === id), data);
    else S.custom.milestones.push({ id: newId, ...data });
  });
  achSphere = data.sphere;
  render(false);
  if (share) shareItem(newId, 'milestone');
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
      <button class="btn grow" data-act="ai-test">${ico(TI().act)} Проверить связь</button>
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
  if (ai.report) ai = { ...ai, report: null, text: '' };
  ai = { ...ai, phase: 'input', result: null, error: '' };
  aiRender();
}

function aiRender() {
  const rp = ai.report;
  const head = `<div class="sx" style="margin-bottom:10px">${rp ? `${rp.kind === 'praise' ? 'похвала' : 'донос'} · ${esc(rp.name)} · ` : ''}${humanDate(rp ? rp.day : curDate)} · ${esc(AI.providerName())}</div>`;
  if (ai.phase === 'input' && rp) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const t = todayKey();
    openSheet(`
      <h1>${rp.kind === 'praise' ? 'Похвала' : 'Донос'}: ${esc(rp.name)}</h1>${head}
      <div class="small muted" style="margin-bottom:10px">${rp.kind === 'praise'
        ? `Расскажи, чем отличился товарищ. ИИ превратит рассказ в отчёт за день, лига проголосует — и при большинстве «за» подвиги добавятся в его день, плюс бонус суда +${COURT_POINTS}.`
        : `Расскажи, где товарищ сорвался. ИИ составит отчёт, лига проголосует — и при большинстве «за» слабости запишутся в его день, а штраф суда сразу снимет −${COURT_POINTS}.`}</div>
      <div class="seg">${[[t, 'Сегодня'], [addDays(t, -1), 'Вчера'], [addDays(t, -2), 'Позавчера']].map(([k, l]) => `<button data-act="rp-day" data-k="${k}" class="${rp.day === k ? 'active' : ''}">${l}</button>`).join('')}</div>
      <textarea id="ai-text" style="min-height:140px;margin-top:12px" placeholder="${rp.kind === 'praise' ? 'Например: сегодня утром пробежал с нами 10 км и ещё помог другу с переездом' : 'Например: вечером при мне съел два бургера и выпил три энергетика'}">${esc(ai.text)}</textarea>
      <div class="row" style="margin-top:10px">
        ${SR ? `<button class="icon-btn mic ${micOn ? 'rec' : ''}" data-act="ai-mic" aria-label="Диктовка">${ico('mic')}</button>` : ''}
        <span class="small muted grow" id="ai-mic-hint">${SR ? (micOn ? 'Слушаю… нажми ещё раз, чтобы остановить' : 'Можно надиктовать') : 'Для голосового ввода нажми микрофон на клавиатуре'}</span>
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn grow" data-act="close-sheet">Отмена</button>
        <button class="btn primary grow" data-act="ai-send">${ico(TI().act)} Составить отчёт</button>
      </div>`);
  } else if (ai.phase === 'input') {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    openSheet(`
      <h1>Отчёт за день</h1>${head}
      <textarea id="ai-text" style="min-height:150px" placeholder="Например: утром пробежал 6 км, потом 3 часа глубокой работы над проектом, вечером дочитал «Дюну» и познакомился с новым соседом.">${esc(ai.text)}</textarea>
      <div class="row" style="margin-top:10px">
        ${SR ? `<button class="icon-btn mic ${micOn ? 'rec' : ''}" data-act="ai-mic" aria-label="Диктовка">${ico('mic')}</button>` : ''}
        <span class="small muted grow" id="ai-mic-hint">${SR ? (micOn ? 'Слушаю… нажми ещё раз, чтобы остановить' : 'Нажми на микрофон и говори') : 'Для голосового ввода нажми микрофон на клавиатуре'}</span>
      </div>
      <div class="row" style="margin-top:16px">
        <button class="btn grow" data-act="close-sheet">Отмена</button>
        <button class="btn primary grow" data-act="ai-send">${ico(TI().act)} Разобрать день</button>
      </div>`);
  } else if (ai.phase === 'loading') {
    openSheet(`
      <div class="ai-loading">
        ${reactorHTML('atom', '')}
        <div class="t">${esc(TT().ai)}<span class="dots"><i>.</i><i>.</i><i>.</i></span></div>
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
    return row('q:' + x.id, ico(q.icon), esc(q.name) + (x.count > 1 ? ' ×' + x.count : ''), rewardsHTML(Object.fromEntries(Object.entries(q.rewards).map(([k, v]) => [k, v * x.count]))), 'var(--ic)'); }).join('');
  const bs = (r.debuffs || []).map((x) => { const q = (S.debuffs || []).find((y) => y.id === x.id);
    return q ? row('b:' + x.id, ico(q.icon), esc(q.name) + (x.count > 1 ? ' ×' + x.count : ''), ai.report ? 'пойдёт в его цепочку позора' : debuffHint(q), 'var(--tox)') : ''; }).join('');
  const st = r.stats.map((x) => { const s = statById(x.id);
    return row('s:' + x.id, ico(s.icon), `${esc(s.name)} <b style="color:${s.color}">${sign(x.points)}</b>`, esc(x.reason), s.color); }).join('');
  const cs = r.counters.map((x) => { const c = counterById(x.id);
    return row('c:' + x.id, ico(c.icon), `${esc(c.name)} <b style="color:${sphereById(c.sphere).color}">+${fmtNum(x.amount)} ${c.unit}</b>`, esc(x.reason), sphereById(c.sphere).color); }).join('');
  const ms = r.milestones.map((x) => { const m = milestoneById(x.id);
    return row('m:' + x.id, ico(m.icon), `Веха: ${esc(m.name)}`, esc(x.reason || m.desc), 'var(--am)'); }).join('');
  const nc = (r.newCounters || []).map((x, i) => row('nc:' + i, ico(x.icon), `Новая цепочка: ${esc(x.name)}`,
    `${esc(sphereById(x.sphere).name)} · ступени ${x.tiers.map((t) => fmtNum(t.goal)).join(' → ')} ${esc(x.unit)}${x.amount ? ` · сегодня +${fmtNum(x.amount)}` : ''}${x.reason ? ' · ' + esc(x.reason) : ''}`, sphereById(x.sphere).color)).join('');
  const nm = (r.newMilestones || []).map((x, i) => row('nm:' + i, ico(x.icon), `Новая веха: ${esc(x.name)}`,
    `${esc(x.desc)}${x.done ? ' · открыть сегодня' : ''}`, 'var(--am)')).join('');
  const shareRow = (nc || nm) && LEAGUE.joined() ? row('share', ico('users'), 'Поделиться новыми с лигой', 'друзья тоже смогут их получить', 'var(--ic)') : '';
  const empty = !qs && !bs && !st && !cs && !ms && !nc && !nm;
  const rp = ai.report;
  if (rp) return `
    <h1>${rp.kind === 'praise' ? 'Похвала' : 'Донос'} готов</h1>${head}
    ${r.summary ? `<div class="card sweep ai-sum">${ico(TI().magic)}<span>${esc(r.summary)}</span></div>` : ''}
    ${qs ? `<h2>Подвиги</h2>${qs}` : ''}
    ${bs ? `<h2 class="bad-h">Слабости</h2>${bs}` : ''}
    ${st ? `<h2>Очки параметров</h2>${st}` : ''}
    ${cs ? `<h2>Счётчики достижений</h2>${cs}` : ''}
    ${ms ? `<h2>Вехи</h2>${ms}` : ''}
    ${!qs && !bs && !st && !cs && !ms ? '<div class="empty">ИИ не нашёл, что записать. Расскажи конкретнее: что именно и когда.</div>' : ''}
    <h2>Запись в дневник</h2>
    <textarea id="ai-note">${esc(r.note)}</textarea>
    <div class="small muted" style="margin-top:8px">Отчёт увидят все участники лиги и ${esc(rp.name)}. Решение — большинством голосов. На голосование 3 суток: если большинство не набралось, решают текущие голоса, при равенстве — оправдан. ${rp.kind === 'praise' ? `Утверждённая похвала даёт бонус +${COURT_POINTS}` : `Утверждённый донос сразу снимает −${COURT_POINTS}`} в связанные параметры.</div>
    <div class="row" style="margin-top:16px">
      <button class="btn grow" data-act="ai-back">Изменить</button>
      <button class="btn primary grow" data-act="rp-send" ${!qs && !bs && !st && !cs && !ms ? 'disabled' : ''}>${ico('balance')} Отправить</button>
    </div>`;
  return `
    <h1>Отчёт разобран</h1>${head}
    ${r.summary ? `<div class="card sweep ai-sum">${ico(TI().magic)}<span>${esc(r.summary)}</span></div>` : ''}
    ${qs ? `<h2>Подвиги</h2>${qs}` : ''}
    ${bs ? `<h2 class="bad-h">Слабости</h2>${bs}` : ''}
    ${st ? `<h2>Очки параметров</h2>${st}` : ''}
    ${cs ? `<h2>Счётчики достижений</h2>${cs}` : ''}
    ${ms ? `<h2>Вехи</h2>${ms}` : ''}
    ${nc || nm ? `<h2>Новые достижения</h2><div class="small muted" style="margin:-4px 2px 10px">Этого не было в каталоге — ИИ предлагает создать.</div>${nc}${nm}${shareRow}` : ''}
    ${empty ? '<div class="empty">Ничего не нашлось для начисления — попробуй рассказать подробнее.</div>' : ''}
    <h2>Заметка дня</h2>
    <textarea id="ai-note">${esc(r.note)}</textarea>
    <div class="row" style="margin-top:16px">
      <button class="btn grow" data-act="ai-back">Изменить</button>
      <button class="btn primary grow" data-act="ai-apply">${ico(TI().act)} Применить</button>
    </div>`;
}

async function aiSend() {
  const ta = $('#ai-text');
  if (ta) ai.text = ta.value;
  if (!ai.text.trim()) { toast(ai.report ? 'Расскажи, что произошло' : 'Расскажи, что ты сделал за день'); return; }
  micStop();
  ai.phase = 'loading';
  aiRender();
  SFX.play('scan');
  const day = getDay(curDate);
  const already = [];
  if (day) {
    (day.d || []).forEach((x) => already.push('подвиг ' + x.n));
    (day.b || []).forEach((x) => already.push('слабость ' + x.n));
    S.stats.forEach((st) => { if ((day.m || {})[st.id]) already.push(`${st.name} ${sign(day.m[st.id])}`); });
    Object.entries(day.c || {}).forEach(([id, v]) => counterById(id) && already.push(`${counterById(id).name} +${v}`));
    (day.ms || []).forEach((id) => milestoneById(id) && already.push('веха ' + milestoneById(id).name));
  }
  const rp = ai.report;
  const d = parseKey(rp ? rp.day : curDate);
  try {
    const result = await AI.analyze(S, ai.text, rp ? {
      dateLabel: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      about: { name: rp.name, kind: rp.kind },
      unlocked: [],
    } : {
      dateLabel: `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      already: already.join('; '),
      unlocked: Object.keys(milestoneDates()),
    });
    ai.result = result;
    ai.sel = {};
    result.quests.forEach((x) => { ai.sel['q:' + x.id] = true; });
    (result.debuffs || []).forEach((x) => { ai.sel['b:' + x.id] = true; });
    result.stats.forEach((x) => { ai.sel['s:' + x.id] = true; });
    result.counters.forEach((x) => { ai.sel['c:' + x.id] = true; });
    result.milestones.forEach((x) => { ai.sel['m:' + x.id] = true; });
    (result.newCounters || []).forEach((x, i) => { ai.sel['nc:' + i] = true; });
    (result.newMilestones || []).forEach((x, i) => { ai.sel['nm:' + i] = true; });
    ai.sel.share = true;
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
  const created = [];
  const nBefore = brandEvents(curDate).length;
  mutate(() => {
    const day = ensureDay(curDate);
    r.quests.forEach((x) => {
      if (!ai.sel['q:' + x.id]) return;
      const q = S.quests.find((y) => y.id === x.id);
      const room = Math.max(0, QUEST_DAY_LIMIT - day.d.filter((z) => z.q === q.id).length);   // лимит 3 в день — и для ИИ
      x.count = Math.min(x.count, room);
      for (let i = 0; i < x.count; i++) day.d.push({ q: q.id, n: q.name, i: q.icon, r: capRewards(q.rewards), c: clone(q.c || {}) });
      Object.entries(q.rewards).forEach(([k, v]) => { gained[k] = (gained[k] || 0) + v * x.count; });
    });
    (r.debuffs || []).forEach((x) => {
      if (!ai.sel['b:' + x.id]) return;
      const q = S.debuffs.find((y) => y.id === x.id);
      if (!q) return;
      for (let i = 0; i < x.count; i++) day.b.push({ q: q.id, n: q.name, i: q.icon, r: clone(q.rewards), c: clone(q.c || {}) });
      LEAGUE.push({ kind: 'debuff', text: `сорвался: ${q.name}${x.count > 1 ? ' ×' + x.count : ''}`, icon: q.icon });
    });
    r.stats.forEach((x) => {
      if (!ai.sel['s:' + x.id] || x.points <= 0) return;   // очки за вред не снимаются — только клейма
      day.m[x.id] = clamp((day.m[x.id] || 0) + Math.min(x.points, QUEST_MAX_REWARD), -50, 15);
      if (!day.m[x.id]) delete day.m[x.id];
      gained[x.id] = (gained[x.id] || 0) + x.points;
    });
    r.counters.forEach((x) => { const c = counterById(x.id); if (ai.sel['c:' + x.id] && c) day.c[x.id] = round1(Math.min(counterDayCap(c), (day.c[x.id] || 0) + x.amount)); });
    r.milestones.forEach((x) => { if (ai.sel['m:' + x.id] && !day.ms.includes(x.id)) day.ms.push(x.id); });
    (r.newCounters || []).forEach((x, i) => {
      if (!ai.sel['nc:' + i]) return;
      const cid = uid('cc');
      S.custom.counters.push({ id: cid, name: x.name, unit: x.unit, desc: x.desc, sphere: x.sphere, icon: x.icon, tiers: x.tiers, custom: true, ...(x.sphere === 'shame' ? { shame: true } : {}) });
      if (x.amount > 0) day.c[cid] = round1((day.c[cid] || 0) + x.amount);
      created.push([cid, 'counter']);
    });
    (r.newMilestones || []).forEach((x, i) => {
      if (!ai.sel['nm:' + i]) return;
      const mid = uid('cm');
      S.custom.milestones.push({ id: mid, name: x.name, desc: x.desc, sphere: x.sphere, icon: x.icon, custom: true });
      if (x.done) day.ms.push(mid);
      created.push([mid, 'milestone']);
    });
    if (note.trim()) day.note = day.note && day.note.trim() ? day.note.trim() + '\n' + note.trim() : note.trim();
  });
  brandEvents(curDate).slice(nBefore).forEach((ev) => { for (const k in ev.r) gained[k] = (gained[k] || 0) + ev.r[k]; });
  const shareNew = !!ai.sel.share && LEAGUE.joined();
  closeSheet();
  ai = { phase: 'input', text: '', result: null, sel: {}, error: '' };
  if (created.length) toast(`Создано новых достижений: ${created.length}`, 'gold', 'sparkle');
  if (shareNew) (async () => { for (const [cid, kind] of created) await shareItem(cid, kind); })();
  const x = innerWidth / 2, y = innerHeight * 0.32;
  const items = Object.entries(gained).filter(([id, v]) => v && statById(id)).slice(0, 5);
  const net = items.reduce((a, [, v]) => a + v, 0);
  if (net < 0) hurt(x, y, items.map(([id, v]) => ({ icon: statById(id).icon, text: sign(v), color: v < 0 ? 'var(--tox)' : statById(id).color })));
  else {
    SFX.play('quest');
    burst(x, y, 14);
    floats(x, y, items.map(([id, v]) => ({ icon: statById(id).icon, text: sign(v), color: v < 0 ? 'var(--tox)' : statById(id).color })));
  }
  const dt = $('#daytotal'); if (dt) dt.classList.add('bump');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Голосовой ввод (Web Speech API), если браузер его поддерживает.
// Chrome на Android в непрерывном режиме присылает фразы накопительно («я», «я пошёл», «я пошёл в зал»),
// из-за чего слова задваивались. Поэтому на Android слушаем по одной фразе и перезапускаемся,
// а куски склеиваем с удалением повторов на стыке.
const IS_ANDROID = /Android/i.test(navigator.userAgent);
function mergeSpeech(acc, piece) {
  piece = String(piece || '').trim();
  acc = String(acc || '').trim();
  if (!piece) return acc;
  if (!acc) return piece;
  const a = acc.split(/\s+/), b = piece.split(/\s+/);
  const norm = (w) => w.toLowerCase().replace(/[.,!?;:«»"()…-]/g, '');
  for (let k = Math.min(a.length, b.length); k > 0; k--) {
    if (k < 2 && k !== a.length && k !== b.length) break; // одно совпавшее слово на стыке — не повтор
    let ok = true;
    for (let j = 0; j < k; j++) if (norm(a[a.length - k + j]) !== norm(b[j])) { ok = false; break; }
    if (ok) return a.concat(b.slice(k)).join(' ');
  }
  return acc + ' ' + piece;
}
let micOn = false, micText = '', micSilent = 0;
function micToggle() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  if (micOn) { micStop(); return; }
  const ta = $('#ai-text');
  micText = ta ? ta.value.trim() : '';
  micOn = true; micSilent = 0;
  const show = (t) => { ai.text = t; const el = $('#ai-text'); if (el) el.value = t; };
  const startSession = () => {
    let session = '';
    try {
      rec = new SR();
      rec.lang = 'ru-RU';
      rec.continuous = !IS_ANDROID;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let t = '';
        for (let i = 0; i < e.results.length; i++) t = mergeSpeech(t, e.results[i][0].transcript);
        session = t; micSilent = 0;
        show(mergeSpeech(micText, session));
      };
      rec.onerror = (e) => {
        if (e.error === 'aborted') return;
        if (e.error === 'no-speech') { if (++micSilent >= 2) micStop(); return; } // долго тишина — выключаемся
        micOn = false;
        const h = $('#ai-mic-hint');
        if (h) h.textContent = e.error === 'not-allowed' ? 'Нет доступа к микрофону — разреши его в настройках браузера' : 'Диктовка недоступна, используй микрофон на клавиатуре';
      };
      rec.onend = () => {
        micText = mergeSpeech(micText, session);
        show(micText);
        rec = null;
        if (micOn) { startSession(); return; } // Android: следующая фраза
        const b = $('[data-act=ai-mic]'); if (b) b.classList.remove('rec');
      };
      rec.start();
    } catch (e) {
      rec = null; micOn = false;
      const b = $('[data-act=ai-mic]'); if (b) b.classList.remove('rec');
    }
  };
  startSession();
  const b = $('[data-act=ai-mic]'); if (b) b.classList.add('rec');
  const h = $('#ai-mic-hint'); if (h) h.textContent = 'Слушаю… нажми ещё раз, чтобы остановить';
}
function micStop() {
  micOn = false;
  if (rec) { try { rec.stop(); } catch (e) { /* ignore */ } }
  const b = $('[data-act=ai-mic]'); if (b) b.classList.remove('rec');
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
    if (tb.dataset.tab === 'day') curDate = reportDay();
    if (tb.dataset.tab === 'settings') settingsPage = null;
    go(tb.dataset.tab);
    if (tb.dataset.tab === 'league') syncNow();
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
    case 'go-today': curDate = reportDay(); go('day'); break;
    case 'prev-day': curDate = addDays(curDate, -1); render(true); break;
    case 'next-day': if (curDate < todayKey()) { curDate = addDays(curDate, 1); render(true); } break;

    case 'rm-points':
      if (!isEditable(curDate)) break;
      mutate(() => { const day = ensureDay(curDate); delete day.m[id]; });
      break;
    case 'quest': {
      const q = S.quests.find((x) => x.id === id);
      if (!q) break;
      if (!isEditable(curDate)) { toast('Этот день закрыт: отмечать можно сегодня и вчера'); SFX.play('error'); break; }
      const [x, y] = [e.clientX || centerOf(el)[0], e.clientY || centerOf(el)[1]];
      if ((getDay(curDate) || { d: [] }).d.filter((z) => z.q === q.id).length >= QUEST_DAY_LIMIT) {
        toast(`«${q.name}» — не больше ${QUEST_DAY_LIMIT} раз за день`); SFX.play('error'); break;
      }
      mutate(() => { ensureDay(curDate).d.push({ q: q.id, n: q.name, i: q.icon, r: capRewards(q.rewards), c: clone(q.c || {}) }); });
      const card = $(`[data-act=quest][data-id="${id}"]`);
      if (card) { card.classList.add('hit'); }
      const dt = $('#daytotal'); if (dt) dt.classList.add('bump');
      burst(x, y, 12);
      floats(x, y - 20, Object.entries(capRewards(q.rewards)).filter(([sid, v]) => v && statById(sid))
        .map(([sid, v]) => ({ icon: statById(sid).icon, text: sign(v), color: statById(sid).color })));
      break;
    }
    case 'debuff': {
      const q = (S.debuffs || []).find((x) => x.id === id);
      if (!q) break;
      if (!isEditable(curDate)) { toast('Этот день закрыт: отмечать можно сегодня и вчера'); SFX.play('error'); break; }
      const [x, y] = [e.clientX || centerOf(el)[0], e.clientY || centerOf(el)[1]];
      LEAGUE.push({ kind: 'debuff', text: `сорвался: ${q.name}`, icon: q.icon });
      const nBefore = brandEvents(curDate).length;
      mutate(() => { ensureDay(curDate).b.push({ q: q.id, n: q.name, i: q.icon, r: clone(q.rewards), c: clone(q.c || {}) }); });
      const card = $(`[data-act=debuff][data-id="${id}"]`);
      if (card) card.classList.add('hit');
      const fresh = brandEvents(curDate).slice(nBefore).filter((ev) => !ev.redeem);
      const hit = {};
      fresh.forEach((ev) => { for (const sid in ev.r) hit[sid] = (hit[sid] || 0) + ev.r[sid]; });
      const items = Object.entries(hit).filter(([sid, v]) => v && statById(sid)).map(([sid, v]) => ({ icon: statById(sid).icon, text: sign(v), color: 'var(--tox)' }));
      if (items.length) { const dt = $('#daytotal'); if (dt) dt.classList.add('bump'); }
      hurt(x, y - 20, items.length ? items : Object.keys(q.c || {}).filter((cid) => counterById(cid)).slice(0, 2)
        .map((cid) => ({ icon: counterById(cid).icon, text: '+' + fmtNum(q.c[cid]) + ' позора', color: 'var(--tox)' })), !items.length);
      break;
    }
    case 'undo-debuff':
      if (!isEditable(curDate)) break;
      mutate(() => { ensureDay(curDate).b.splice(Number(el.dataset.idx), 1); });
      break;
    case 'undo-quest':
      if (!isEditable(curDate)) break;
      mutate(() => { ensureDay(curDate).d.splice(Number(el.dataset.idx), 1); });
      break;
    case 'open-day': curDate = el.dataset.k; go('day'); break;
    case 'range': histRange = Number(el.dataset.r); render(true); break;
    case 'avatar': S.profile.avatar = el.dataset.a; save(); render(false); scheduleSync(); break;

    /* --- Лига --- */
    case 'lg-mode': leagueMode = el.dataset.m; render(false); break;
    case 'lg-refresh': LEAGUE.set({ error: '' }); syncNow(); break;
    case 'lg-member': memberSheet(id); break;
    case 'lg-create': {
      const server = $('#lg-server').value, name = $('#lg-name').value.trim() || 'Лига героев';
      if (!server.trim()) { toast('Укажи адрес сервера'); break; }
      leagueAction(() => LEAGUE.create(server, name, { name: S.profile.name, avatar: S.profile.avatar, profile: leagueProfile() }), 'Лига создана — пригласи друзей');
      break;
    }
    case 'lg-join':
      leagueAction(() => LEAGUE.join($('#lg-invite').value, $('#lg-server') ? $('#lg-server').value : '', { name: S.profile.name, avatar: S.profile.avatar, profile: leagueProfile() }), 'Ты в лиге!');
      break;
    case 'lg-restore':
      leagueAction(async () => { LEAGUE.restore($('#lg-restore').value); await LEAGUE.refresh(); }, 'Доступ восстановлен');
      break;
    case 'lg-invite': {
      const c = LEAGUE.cfg();
      shareText(`Вступай в мою лигу «${c.name}» в Level Up!

1. Открой https://skjat.github.io/Game-evolution/ в Safari и добавь на экран «Домой».
2. Вкладка «Лига» → вставь приглашение:
${LEAGUE.invite(c)}`, 'Приглашение скопировано');
      break;
    }
    case 'lg-recovery':
      openSheet(`<h1>Код восстановления</h1>
        <div class="small muted">Им можно перенести участие в лиге на другой телефон. Кто знает этот код — может играть за тебя, никому его не показывай.</div>
        <textarea readonly style="margin-top:12px;font:500 13px var(--mono)">${esc(LEAGUE.recoveryCode())}</textarea>
        <button class="btn primary block" data-act="lg-copy-rec" style="margin-top:10px">Скопировать</button>`);
      break;
    case 'lg-copy-rec': shareText(LEAGUE.recoveryCode(), 'Код скопирован'); break;
    case 'lg-react':
      LEAGUE.react(Number(id), el.dataset.k).then((bd) => { applySharedItems(bd); render(false); }).catch((err) => toast(err.message));
      break;
    case 'lg-leave':
      if (confirm('Покинуть лигу? Твоя строка исчезнет из таблицы.')) {
        sharedToCustomOnLeave();
        LEAGUE.leave().then(() => { toast('Ты вышел из лиги'); render(true); }).catch((err) => toast(err.message));
      }
      break;
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
      if (confirm('Скрыть параметр? Его очки сохранятся, и параметр можно будет вернуть в «Настройки → Параметры».')) {
        const st = statById(id);
        S.archivedStats = [...(S.archivedStats || []).filter((x) => x.id !== id), st];
        S.stats = S.stats.filter((s) => s.id !== id);
        save(); closeSheet(); render(false);
      }
      break;
    case 'restore-stat': {
      const st = (S.archivedStats || []).find((x) => x.id === id);
      if (!st) break;
      S.archivedStats = S.archivedStats.filter((x) => x.id !== id);
      S.stats.push(st);
      mutate(() => {});
      toast(`«${st.name}» снова в строю`, 'gold', st.icon);
      break;
    }

    case 'edit-quest': questEditor(id, el.dataset.kind); break;
    case 'add-quest': questEditor(null, el.dataset.kind); break;
    case 'qr-inc':
    case 'qr-dec': {
      const v = $('#qr-' + id);
      const max = el.dataset.max !== undefined ? Number(el.dataset.max) : QUEST_MAX_REWARD;
      const n = clamp(Number(v.dataset.v) + (act === 'qr-inc' ? 1 : -1), -QUEST_MAX_REWARD, max);
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
      S.stats.forEach((s) => { const n = clamp(Number($('#qr-' + s.id).dataset.v) || 0, -QUEST_MAX_REWARD, QUEST_MAX_REWARD); if (n) rewards[s.id] = n; });
      const c = {};
      document.querySelectorAll('#qc-list [data-qc]').forEach((row) => { const n = Number($('#qc-' + row.dataset.qc).dataset.v); if (n > 0) c[row.dataset.qc] = n; });
      const kind = el.dataset.kind || 'quest';
      if (kind === 'debuff') for (const k in rewards) if (rewards[k] > 0) rewards[k] = -rewards[k];   // у слабости только минусы
      const list = questListOf(kind);
      if (id) Object.assign(list.find((x) => x.id === id), { name, icon, rewards, c });
      else list.push({ id: uid(kind === 'debuff' ? 'b' : 'q'), name, icon, rewards, c });
      save(); closeSheet(); render(false);
      break;
    }
    case 'del-quest':
      if (confirm('Удалить? Уже начисленные очки сохранятся.')) {
        if (el.dataset.kind === 'debuff') S.debuffs = S.debuffs.filter((q) => q.id !== id);
        else S.quests = S.quests.filter((q) => q.id !== id);
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
      if ((counterById(id) || {}).auto) break;
      let n = el.dataset.n === 'custom' ? parseFloat(($('#counter-n').value || '').replace(',', '.')) : Number(el.dataset.n);
      if (!n || !isFinite(n)) { toast('Введи число'); break; }
      n = clamp(round1(n), -1000, 1000);
      const cc = counterById(id), cap = counterDayCap(cc), have = ((getDay(todayKey()) || {}).c || {})[id] || 0;
      if (n > 0 && have + n > cap) {
        if (have >= cap) { toast(`За день вручную — не больше ${fmtNum(cap)} ${cc.unit}`); SFX.play('error'); break; }
        n = round1(cap - have);
        toast(`Добавлено ${fmtNum(n)} ${cc.unit}: за день вручную не больше ${fmtNum(cap)}`);
      }
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
      toast(`«${t.title}» · ${rarityOf(c, i).name} · ${fmtNum(t.goal)} ${c.unit}`, isShame(c) ? 'shame' : '', c.icon);
      break;
    }
    case 'milestone': milestoneSheet(id); break;
    case 'share-item': shareItem(id, el.dataset.kind); break;
    case 'unshare-item': if (confirm('Убрать из лиги? У друзей оно останется, только если они уже начали его выполнять.')) unshareItem(id); break;
    case 'toggle-switch': el.classList.toggle('on'); break;
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
    case 'rm-ms': {
      const when = Object.keys(S.log).filter((k) => (S.log[k].ms || []).includes(id));
      if (when.some((k) => !isEditable(k))) { toast('Веха открыта давно — убрать её уже нельзя'); SFX.play('error'); break; }
      if (el.dataset.sheet) closeSheet();
      mutate(() => { for (const k in S.log) if (S.log[k].ms) S.log[k].ms = S.log[k].ms.filter((m) => m !== id); });
      break;
    }
    case 'onb-next': if (onb === 0) onboardingSaveName(); onb = Math.min(2, onb + 1); onboardingRender(); break;
    case 'onb-back': onb = Math.max(0, onb - 1); onboardingRender(); break;
    case 'onb-theme': applyTheme(id, { switching: true }); render(false); onboardingRender(); break;
    case 'onb-done':
      if (onb === 0) onboardingSaveName();
      S.settings.onboarded = true; save(); closeSheet(); scheduleSync();
      if (!el.dataset.skip) { curDate = reportDay(); go('day'); toast('Отметь первый подвиг — и ядро зарядится', 'gold', 'bolt'); } else render(false);
      break;
    case 'show-onboarding': onboardingStart(); break;
    case 'weekly': weeklyOpen(el.dataset.k); break;
    case 'weak-more': showAllWeak = !showAllWeak; render(false); break;
    case 'rm-counter':
      if (!isEditable(curDate)) break;
      mutate(() => { delete ensureDay(curDate).c[id]; });
      break;

    /* --- ИИ --- */
    case 'ai-open': if (!isEditable(curDate)) { toast('Этот день закрыт: отчёт можно составить за сегодня или вчера'); break; } aiOpen(); break;
    case 'ai-setup': closeSheet(); settingsPage = 'ai'; go('settings'); break;
    case 'set-page': settingsPage = el.dataset.p || null; render(true); window.scrollTo(0, 0); break;
    case 'ai-send': aiSend(); break;
    case 'ai-back': ai.phase = 'input'; aiRender(); break;
    case 'ai-apply': aiApply(); break;
    case 'rp-open': reportOpen(id, el.dataset.k); break;
    case 'rp-day': { const ta = $('#ai-text'); if (ta) ai.text = ta.value; ai.report.day = el.dataset.k; aiRender(); break; }
    case 'rp-send': reportSend(); break;
    case 'rp-vote':
      LEAGUE.vote(id, Number(el.dataset.v)).then((bd) => { SFX.play('confirm'); applyVerdicts(bd); render(false); }).catch((err) => { SFX.play('error'); toast(err.message); });
      break;
    case 'lg-kick': {
      const b = LEAGUE.cfg().board, m = b && b.members.find((x) => x.id === id);
      if (!m || !confirm(`Исключить ${m.name} из лиги? Его прогресс на его телефоне останется, но в лиге он пропадёт.`)) break;
      LEAGUE.kick(id).then(() => { closeSheet(); toast(`${m.name} исключён из лиги`, 'gold', 'users'); SFX.play('confirm'); render(false); })
        .catch((err) => { SFX.play('error'); toast(err.message); });
      break;
    }
    case 'rp-withdraw':
      if (!confirm('Отозвать отчёт?')) break;
      LEAGUE.withdraw(id).then(() => render(false)).catch((err) => toast(err.message));
      break;
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
    case 'theme':
      applyTheme(id, { switching: true });
      render(true);
      break;
    case 'sound':
      S.settings.sound = !S.settings.sound;
      SFX.enabled = S.settings.sound;
      save(); render(false);
      if (S.settings.sound) SFX.play('confirm');
      break;

    case 'export': doExport(); break;
    case 'app-update': checkUpdate(true); break;
    case 'import': $('#importfile').click(); break;
    case 'reset':
      openSheet(`
        <h1>Начать заново?</h1>
        <div class="muted">Будут удалены все дни, очки, достижения, клейма и настройки параметров. Отменить это нельзя.</div>
        <div class="card" style="margin-top:14px">
          <div class="small muted" style="margin-bottom:10px">Сначала сохрани копию — по ней всё можно вернуть через «Импорт».</div>
          <button class="btn block" data-act="export">${ico('upload')} Скачать резервную копию</button>
        </div>
        <label class="f">Чтобы подтвердить, напиши слово УДАЛИТЬ</label>
        <input type="text" id="reset-word" autocomplete="off" autocapitalize="characters" placeholder="УДАЛИТЬ">
        <div class="row" style="margin-top:16px">
          <button class="btn grow" data-act="close-sheet">Отмена</button>
          <button class="btn danger grow" data-act="reset-confirm">Удалить всё</button>
        </div>`);
      break;
    case 'reset-confirm':
      if (($('#reset-word').value || '').trim().toUpperCase() !== 'УДАЛИТЬ') { toast('Напиши слово УДАЛИТЬ'); SFX.play('error'); break; }
      S = defaultState(); S.settings.onboarded = true; save(); closeSheet(); settingsPage = null; go('hero');
      toast('Прогресс удалён. Начинаем с чистого листа', 'gold', 'sparkle');
      break;
  }
});

const SOUND_FOR = {
  'lg-create': null, 'lg-join': null, 'lg-restore': null, 'lg-react': 'zap',
  inc: 'zap', dec: 'down', quest: 'quest', 'undo-quest': 'down', debuff: null, 'undo-debuff': 'tap', 'rm-ms': 'down', 'rm-counter': 'down',
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
    scheduleSync(4000);
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
  if (document.visibilityState !== 'visible') return;
  scheduleSync(300);
  if (todayKey() !== lastToday) {
    setTimeout(maybeWeekly, 600);
    if (curDate === lastToday) curDate = reportDay();
    lastToday = todayKey();
    render(false);
  }
});

/* ---------------------- Применение темы ---------------------- */

function applyTheme(id, opts = {}) {
  const t = themeOf(id), prev = themeOf(S.settings.theme || 'reactor');
  const root = document.documentElement;
  root.dataset.theme = t.id;
  root.dataset.fx = t.fx;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', t.meta);
  try { localStorage.setItem('lvlup.theme', t.id); } catch (e) { /* ignore */ }
  // Частицы фона (снег, пылинки, искры)
  const box = $('#particles');
  if (box) {
    let html = '';
    for (let i = 0; i < t.particles; i++) {
      const dur = (t.id === 'zen' ? 22 : 9) + Math.random() * 10;
      html += `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;animation-duration:${dur.toFixed(1)}s;animation-delay:-${(Math.random() * dur).toFixed(1)}s"></i>`;
    }
    box.innerHTML = html;
  }
  const tb = $('#tabbar');
  if (tb) {
    const active = (tb.querySelector('button.active') || {}).dataset;
    tb.innerHTML = TABS.map(([k, label]) => `<button data-tab="${k}" class="${active && active.tab === k ? 'active' : ''}">${ico(t.icons.tabs[k])}<span>${label}</span></button>`).join('');
  }
  // Символы параметров, которые не меняли вручную, — из набора темы (один раз для старых данных и при каждой смене темы).
  if ((opts.switching && prev.id !== t.id) || !S.settings.themeIcons) {
    for (const st of S.stats) if (t.icons.stats[st.id] && THEMES.some((x) => x.icons.stats[st.id] === st.icon)) st.icon = t.icons.stats[st.id];
    if (!S.settings.themeIcons) { S.settings.themeIcons = true; save(); }
  }
  if (opts.switching && prev.id !== t.id) {
    // Параметры и символ, которые не меняли вручную, перекрашиваем в палитру новой темы.
    const anyDefault = (sid, color) => THEMES.some((x) => x.stats[sid] === color) || (DEFAULT_STATS.find((d) => d.id === sid) || {}).color === color;
    for (const st of S.stats) if (t.stats[st.id] && anyDefault(st.id, st.color)) st.color = t.stats[st.id];
    if (THEMES.some((x) => x.avatar === S.profile.avatar)) S.profile.avatar = t.avatar;
    S.settings.theme = t.id;
    save();
    scheduleSync();
  }
}

/* ---------------------- Знакомство (первый запуск) ---------------------- */

let onb = 0;
function onboardingRender() {
  const dots = `<div class="onb-dots">${[0, 1, 2].map((i) => `<i class="${i === onb ? 'on' : ''}"></i>`).join('')}</div>`;
  const steps = [
    () => `
      <div class="onb-hero">${reactorHTML(S.profile.avatar, 'LVL 1')}</div>
      <h1 style="text-align:center">Прокачай себя</h1>
      <div class="muted" style="text-align:center">Level Up превращает твою жизнь в RPG: полезные дела качают параметры персонажа — Силу, Интеллект, Харизму и другие, а вредные привычки дают позорные клейма.</div>
      <label class="f">Как тебя называть?</label>
      <input type="text" id="onb-name" maxlength="24" placeholder="Имя героя" value="${S.profile.name === 'Герой' ? '' : esc(S.profile.name)}">`,
    () => `
      <h1>Выбери стиль</h1>
      <div class="muted" style="margin-bottom:12px">Тему можно поменять в любой момент в «Ещё».</div>
      <div class="themes">${THEMES.map((t) => `
        <button class="theme-card ${(S.settings.theme || 'reactor') === t.id ? 'on' : ''}" data-act="onb-theme" data-id="${t.id}">
          <span class="sw" style="background:radial-gradient(circle at 35% 30%, ${t.sw[2]}, ${t.sw[0]} 45%, ${t.sw[1]} 70%, ${t.sw[3]} 100%);--glow:${t.sw[0]}66;--ring:${t.sw[1]}"></span>
          <span class="grow"><span class="tn">${esc(t.name)}</span><span class="td" style="display:block">${esc(t.desc)}</span></span>
        </button>`).join('')}</div>`,
    () => `
      <h1>Как играть</h1>
      <div class="onb-list">
        <div>${ico(TI().tabs.day)}<span><b>Вечером — итоги дня.</b> Отметь подвиги: тренировку, чтение, новое знакомство. Каждый даёт очки параметрам.</span></div>
        <div>${ico('arrowDown')}<span><b>Честно отметь слабости.</b> Они копят позор, а на новых ступенях клейма параметры падают. 14 чистых дней снимают клеймо.</span></div>
        <div>${ico('mic')}<span><b>Или просто расскажи ИИ</b>, как прошёл день, — он сам всё разнесёт по полочкам (нужен ключ Claude).</span></div>
        <div>${ico('users')}<span><b>Соревнуйся с друзьями</b> в лиге: таблица недели, лента, суд с доносами и похвалами.</span></div>
      </div>`,
  ];
  openSheet(`
    ${dots}
    ${steps[onb]()}
    <div class="row" style="margin-top:20px">
      ${onb ? '<button class="btn grow" data-act="onb-back">Назад</button>' : '<button class="btn grow" data-act="onb-done" data-skip="1">Пропустить</button>'}
      <button class="btn primary grow" data-act="${onb < 2 ? 'onb-next' : 'onb-done'}">${onb < 2 ? 'Дальше' : 'Начать'}</button>
    </div>`);
}
function onboardingSaveName() {
  const n = $('#onb-name');
  if (n && n.value.trim()) { S.profile.name = n.value.trim().slice(0, 24); save(); }
}
function onboardingStart() { onb = 0; onboardingRender(); }

/* ---------------------- Итоги недели ---------------------- */

function weekSummary(ws) {
  const we = addDays(ws, 6), days = [];
  for (let k = ws; k <= we; k = addDays(k, 1)) days.push(k);
  const per = {}; let xp = 0, quests = 0, weak = 0, best = null, active = 0;
  for (const k of days) {
    const d = getDay(k), p = dayPoints(d, k), t = dayTotal(d, k);
    for (const id in p) if (statById(id)) per[id] = (per[id] || 0) + p[id];
    xp += t; if (isActive(d)) active++;
    quests += ((d || {}).d || []).length; weak += ((d || {}).b || []).length;
    if (!best || t > best.t) best = { k, t };
  }
  const brands = days.flatMap((k) => brandEvents(k).filter((e) => !e.redeem));
  const redeems = days.flatMap((k) => brandEvents(k).filter((e) => e.redeem));
  const ach = allAchievements().filter((a) => a.kind !== 'shame' && S.ach[a.id] && S.ach[a.id] >= ws && S.ach[a.id] <= we);
  let place = null;
  const b = LEAGUE.joined() ? LEAGUE.cfg().board : null;
  if (b && b.members && b.members.length > 1) {
    const val = (m) => { const pr = m.profile || {}; return pr.weekStart === ws ? pr.week || 0 : pr.lastWeekStart === ws ? pr.lastWeek || 0 : 0; };
    const sorted = [...b.members].sort((x, y) => val(y) - val(x));
    place = { n: sorted.findIndex((m) => m.id === b.me) + 1, of: sorted.length };
  }
  return { ws, we, per, xp, quests, weak, best, active, brands, redeems, ach, place };
}
function weeklyOpen(ws) {
  const w = weekSummary(ws);
  const statRows = S.stats.filter((s) => w.per[s.id]).sort((a, b) => w.per[b.id] - w.per[a.id]).map((s) =>
    `<span class="chip" style="color:${s.color}">${ico(s.icon)}${esc(s.name)} ${sign(w.per[s.id])}</span>`).join('');
  openSheet(`
    <h1>Итоги недели</h1>
    <div class="sx" style="margin-bottom:12px">${shortDate(w.ws)} — ${shortDate(w.we)}</div>
    <div class="card sweep center"><div class="daytotal ${w.xp < 0 ? 'neg' : ''}">${sign(w.xp)} XP</div>
      <div class="small muted">${w.active} из 7 дней с прогрессом${w.place ? ` · ${w.place.n}-е место в лиге из ${w.place.of}` : ''}</div></div>
    <div class="kpis">
      <div class="kpi"><b>${w.quests}</b><span>${plural(w.quests, 'подвиг', 'подвига', 'подвигов')}</span></div>
      <div class="kpi"><b class="${w.weak ? 'tox' : ''}">${w.weak}</b><span>${plural(w.weak, 'срыв', 'срыва', 'срывов')}</span></div>
      <div class="kpi"><b>${w.ach.length}</b><span>${plural(w.ach.length, 'награда', 'награды', 'наград')}</span></div>
    </div>
    ${statRows ? `<h2>Рост параметров</h2><div class="chips">${statRows}</div>` : ''}
    ${w.best && w.best.t > 0 ? `<div class="card small" style="margin-top:12px">${ico('star')} Лучший день — ${humanDate(w.best.k)}: ${sign(w.best.t)} XP</div>` : ''}
    ${w.ach.length ? `<h2>Новые награды</h2><div class="chips">${w.ach.slice(0, 8).map((a) => `<span class="chip" style="color:var(--am)">${ico(a.icon)}${esc(a.name)}</span>`).join('')}</div>` : ''}
    ${w.brands.length || w.redeems.length ? `<h2 class="bad-h">Позор</h2><div class="card small">
      ${w.brands.map((e) => `<div class="tox">${ico('skull')} Клеймо «${esc(e.title)}»</div>`).join('')}
      ${w.redeems.map((e) => `<div class="ok">${ico('sparkle')} Снято «${esc(e.title)}»</div>`).join('')}</div>` : ''}
    <div class="muted small" style="margin-top:14px">${w.xp > 0 && w.weak === 0 ? 'Чистая неделя без срывов — так держать!' : w.weak > w.quests ? 'Срывов больше, чем подвигов. Новая неделя — новый шанс.' : 'Новая неделя уже началась — вперёд за уровнем!'}</div>
    <button class="btn primary block" data-act="close-sheet" style="margin-top:16px">Вперёд</button>`);
}
// В новую неделю один раз показываем итоги прошлой (если в ней что-то было).
function maybeWeekly() {
  if (!S.settings.onboarded) return;
  const ws = addDays(weekStartKey(todayKey()), -7);
  if (S.settings.weeklySeen === ws) return;
  const any = [0, 1, 2, 3, 4, 5, 6].some((i) => isLogged(getDay(addDays(ws, i))));
  S.settings.weeklySeen = ws; save();
  if (any && $('#sheet').classList.contains('hidden')) weeklyOpen(ws);
}

/* ---------------------- Старт ---------------------- */

applyTheme(S.settings.theme || 'reactor');
SFX.enabled = S.settings.sound;
checkAchievements(true);
save();
render(true);
scheduleSync(800);
if (!S.settings.onboarded && !Object.keys(S.log).length) setTimeout(onboardingStart, 500);
else setTimeout(maybeWeekly, 900);

// Обновления: новая версия ставится в фоне и сразу подхватывается перезагрузкой (если не открыта шторка).
let swReg = null;
async function checkUpdate(manual) {
  if (!swReg) { if (manual) location.reload(); return; }
  if (manual) toast('Проверяю обновление…', '', 'refresh');
  try { await swReg.update(); } catch (e) { /* нет сети */ }
  if (manual && !swReg.installing && !swReg.waiting) setTimeout(() => location.reload(), 600);
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    if ($('#sheet').classList.contains('hidden')) { reloading = true; location.reload(); }
    else { updatePending = true; toast('Вышло обновление — закрой окно, и приложение перезапустится', 'gold', 'refresh'); }
  });
  navigator.serviceWorker.register('sw.js').then((r) => {
    swReg = r;
    // Проверяем обновление при каждом возвращении в приложение (iOS держит его открытым неделями).
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(false); });
  }).catch(() => {});
}
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
