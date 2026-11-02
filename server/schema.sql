-- Схема базы лиги. Все команды идемпотентны: файл можно применять повторно.

CREATE TABLE IF NOT EXISTS leagues (
  code       TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  id         TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  league     TEXT NOT NULL,
  name       TEXT NOT NULL,
  avatar     TEXT,
  profile    TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  joined_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS members_league ON members (league);

CREATE TABLE IF NOT EXISTS events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  league     TEXT NOT NULL,
  member     TEXT,
  kind       TEXT NOT NULL,
  text       TEXT NOT NULL,
  icon       TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_league ON events (league, id DESC);

CREATE TABLE IF NOT EXISTS reactions (
  event_id   INTEGER NOT NULL,
  member     TEXT NOT NULL,
  kind       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (event_id, member, kind)
);

-- Общие достижения лиги: цепочки и вехи, которыми участник поделился с друзьями.
CREATE TABLE IF NOT EXISTS items (
  id         TEXT NOT NULL,
  league     TEXT NOT NULL,
  author     TEXT NOT NULL,
  kind       TEXT NOT NULL,          -- 'counter' | 'milestone'
  data       TEXT NOT NULL,          -- JSON: name, unit, desc, icon, sphere, tiers
  created_at INTEGER NOT NULL,
  PRIMARY KEY (league, id)
);

-- Суд лиги: доносы и похвалы на других участников. ИИ автора превращает рассказ в отчёт за день,
-- лига голосует; утверждённый отчёт телефон участника добавляет в его день.
CREATE TABLE IF NOT EXISTS proposals (
  id          TEXT PRIMARY KEY,
  league      TEXT NOT NULL,
  author      TEXT NOT NULL,
  target      TEXT NOT NULL,
  day         TEXT NOT NULL,          -- YYYY-MM-DD
  kind        TEXT NOT NULL,          -- 'complaint' | 'praise'
  text        TEXT NOT NULL,          -- что рассказал автор
  summary     TEXT NOT NULL,
  data        TEXT NOT NULL,          -- JSON: подвиги, слабости, очки, счётчики, вехи, запись в дневник
  status      TEXT NOT NULL,          -- 'pending' | 'approved' | 'rejected' | 'expired' | 'withdrawn'
  applied     INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX IF NOT EXISTS proposals_league ON proposals (league, created_at DESC);

CREATE TABLE IF NOT EXISTS votes (
  proposal   TEXT NOT NULL,
  member     TEXT NOT NULL,
  vote       INTEGER NOT NULL,        -- 1 за, -1 против
  created_at INTEGER NOT NULL,
  PRIMARY KEY (proposal, member)
);
