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
