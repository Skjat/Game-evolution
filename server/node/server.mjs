/* =====================================================================
   Сервер лиги без Cloudflare: тот же server/worker.js, но на Node.js
   со встроенной базой SQLite (node:sqlite). Для своего сервера.

   Запуск:  node server/node/server.mjs
   Переменные окружения:
     PORT     — порт HTTP (по умолчанию 8787)
     HOST     — адрес прослушивания (по умолчанию 0.0.0.0)
     DB_PATH  — файл базы (по умолчанию ./levelup.db)
   ===================================================================== */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import worker from '../worker.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'levelup.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const sqlite = new DatabaseSync(DB_PATH);
sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
sqlite.exec(fs.readFileSync(path.join(here, '..', 'schema.sql'), 'utf8'));

// Минимальная совместимая с Cloudflare D1 обёртка: prepare().bind().first()/all()/run(), batch().
class Statement {
  constructor(sql, args = []) { this.sql = sql; this.args = args; }
  bind(...args) { return new Statement(this.sql, args.map((a) => (a === undefined ? null : a))); }
  async first() { return sqlite.prepare(this.sql).get(...this.args) ?? null; }
  async all() { return { results: sqlite.prepare(this.sql).all(...this.args), success: true }; }
  async run() { return this.runSync(); }
  runSync() {
    const r = sqlite.prepare(this.sql).run(...this.args);
    return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}
const DB = {
  prepare: (sql) => new Statement(sql),
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const out = statements.map((s) => s.runSync());
      sqlite.exec('COMMIT');
      return out;
    } catch (e) {
      sqlite.exec('ROLLBACK');
      throw e;
    }
  },
};
const env = { DB };

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) {
      chunks.push(c);
      if (chunks.reduce((n, b) => n + b.length, 0) > 64 * 1024) { res.writeHead(413).end(); return; }
    }
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const request = new Request(url, { method: req.method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });
    const response = await worker.fetch(request, env);
    const out = {};
    response.headers.forEach((v, k) => { out[k] = v; });
    res.writeHead(response.status, out);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
    res.end(JSON.stringify({ error: 'Ошибка сервера' }));
  }
});

server.listen(PORT, HOST, () => console.log(`Level Up league server: http://${HOST}:${PORT} (база ${DB_PATH})`));
