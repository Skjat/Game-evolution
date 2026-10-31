'use strict';

/* =====================================================================
   ИИ-помощник: разбирает рассказ о дне и превращает его в прогресс.

   Провайдеры:
   - claude — Claude API через официальный SDK (@anthropic-ai/sdk, собран
     в vendor/anthropic-sdk.mjs). Ключ хранится только на этом устройстве.
   - custom — свой сервер с OpenAI-совместимым API (/v1/chat/completions):
     например, Hermes, запущенный через Ollama, vLLM или llama.cpp.

   Настройки ИИ лежат отдельно от игровых данных и не попадают в экспорт.
   ===================================================================== */

const AI = (() => {
  const KEY = 'lvlup.ai';
  const DEFAULTS = { provider: 'claude', claudeKey: '', claudeModel: 'claude-opus-5-5', baseUrl: '', apiKey: '', model: '' };
  const CLAUDE_MODELS = [
    ['claude-opus-5-5', 'Claude Opus 5.5 — самый точный (по умолчанию)'],
    ['claude-sonnet-5-5', 'Claude Sonnet 5.5 — быстрее и дешевле'],
    ['claude-haiku-5-5', 'Claude Haiku 5.5 — самый дешёвый'],
  ];
  // Модели, для которых доступен серверный fallback при отказе классификатора безопасности.
  const FALLBACK_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-opus-5', 'claude-fable-5-1'];

  function cfg() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
    catch (e) { return { ...DEFAULTS }; }
  }
  function setCfg(patch) {
    const c = { ...cfg(), ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* ignore */ }
    return c;
  }
  function ready(c = cfg()) {
    return c.provider === 'claude' ? !!c.claudeKey.trim() : !!(c.baseUrl.trim() && c.model.trim());
  }
  function providerName(c = cfg()) {
    if (c.provider === 'claude') return (CLAUDE_MODELS.find((m) => m[0] === c.claudeModel) || [c.claudeModel, c.claudeModel])[1].split(' — ')[0];
    return c.model ? c.model + ' · свой сервер' : 'свой сервер';
  }

  class AIError extends Error {
    constructor(message, kind = 'error') { super(message); this.kind = kind; }
  }

  let sdkPromise = null;
  function loadSDK() {
    if (!sdkPromise) sdkPromise = import('./vendor/anthropic-sdk.mjs').then((m) => m.Anthropic).catch((e) => { sdkPromise = null; throw e; });
    return sdkPromise;
  }

  /* ---------------- Каталог и схема ответа ---------------- */

  const fmtRewards = (r, stats) => Object.entries(r || {}).filter(([id, v]) => v && stats.find((s) => s.id === id))
    .map(([id, v]) => `${id} ${v > 0 ? '+' : ''}${v}`).join(', ') || '—';

  function catalogue(S) {
    const lines = [];
    lines.push('STATS (id — name):');
    S.stats.forEach((s) => lines.push(`- ${s.id} — ${s.name}`));
    lines.push('', 'QUESTS (id — name | stat rewards | counters added automatically):');
    S.quests.forEach((q) => lines.push(`- ${q.id} — ${q.name} | ${fmtRewards(q.rewards, S.stats)} | ${Object.entries(q.c || {}).map(([k, v]) => `${k} +${v}`).join(', ') || '—'}`));
    lines.push('', 'COUNTERS (id — name, unit | sphere):');
    COUNTERS.forEach((c) => lines.push(`- ${c.id} — ${c.name}, ${c.unit} | ${c.sphere}`));
    lines.push('', 'MILESTONES (id — name: description):');
    MILESTONES.forEach((m) => lines.push(`- ${m.id} — ${m.name}: ${m.desc}`));
    return lines.join('\n');
  }

  function systemPrompt(S) {
    return `You are the game master of "Level Up", a personal RPG in which the player levels up their real life. In the evening the player tells you, in Russian and often by voice dictation (expect transcription mistakes), what they did during the day. Turn the report into game progress using only the ids from the catalogue below.

How to fill the answer:
- quests: activities that clearly match a quest from the catalogue, with count (usually 1). Quest stat rewards and the counters linked to a quest are added automatically — never repeat them in stats or counters.
- stats: extra points for meaningful effort that no quest covers. Usually 1–3 points, up to 5 for an exceptional effort. Nothing for passive or trivial things. Give a short reason in Russian.
- counters: increments of lifetime counters in the counter's unit (km, hours, pieces). Count only what the player states or what clearly follows from it: "пробежал 7 км" → run_km 7; "дочитал книгу" → books 1; "позанимался английским" → lang 1. Skip counters already added by the chosen quests. Give a short reason in Russian.
- milestones: one-time life achievements, only when the player clearly accomplished one today and it is not in the list of already unlocked milestones. Give a short reason in Russian.
- summary: 1–2 sentences in Russian addressed to the player as «ты», in an energetic game-master voice; highlight the best of the day. Praise only what was actually done.
- note: a short diary entry in Russian, first person, 1–3 sentences, faithful to the report.

Record only what the player says they did on this day; never invent activities, and when something is vague, choose the smaller number. If the report contains nothing relevant, return empty lists and say so in the summary.

CATALOGUE
${catalogue(S)}`;
  }

  function schema(S) {
    const idField = (ids) => (ids.length ? { type: 'string', enum: ids } : { type: 'string' });
    const obj = (props) => ({ type: 'object', additionalProperties: false, required: Object.keys(props), properties: props });
    return obj({
      summary: { type: 'string' },
      quests: { type: 'array', items: obj({ id: idField(S.quests.map((q) => q.id)), count: { type: 'integer' } }) },
      stats: { type: 'array', items: obj({ id: idField(S.stats.map((s) => s.id)), points: { type: 'integer' }, reason: { type: 'string' } }) },
      counters: { type: 'array', items: obj({ id: idField(COUNTERS.map((c) => c.id)), amount: { type: 'number' }, reason: { type: 'string' } }) },
      milestones: { type: 'array', items: obj({ id: idField(MILESTONES.map((m) => m.id)), reason: { type: 'string' } }) },
      note: { type: 'string' },
    });
  }

  function userMessage(text, ctx) {
    return [
      `Дата отчёта: ${ctx.dateLabel}.`,
      ctx.already ? `Уже записано за этот день (не дублируй): ${ctx.already}.` : 'За этот день ещё ничего не записано.',
      `Уже открытые вехи (не выдавай повторно): ${ctx.unlocked.length ? ctx.unlocked.join(', ') : 'нет'}.`,
      '',
      'Отчёт игрока:',
      text.trim(),
    ].join('\n');
  }

  /* ---------------- Проверка ответа ---------------- */

  function normalize(raw, S, unlocked) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const str = (v, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const arr = (v) => (Array.isArray(v) ? v : []);
    const out = { summary: str(r.summary, 400), note: str(r.note, 1000), quests: [], stats: [], counters: [], milestones: [] };

    const qMap = {};
    arr(r.quests).forEach((x) => {
      if (!x || !S.quests.find((q) => q.id === x.id)) return;
      qMap[x.id] = Math.min(5, (qMap[x.id] || 0) + Math.max(1, Math.round(Number(x.count) || 1)));
    });
    out.quests = Object.entries(qMap).map(([id, count]) => ({ id, count }));

    const sMap = {};
    arr(r.stats).forEach((x) => {
      if (!x || !S.stats.find((s) => s.id === x.id)) return;
      const p = Math.round(Number(x.points) || 0);
      if (!p) return;
      const prev = sMap[x.id];
      sMap[x.id] = { id: x.id, points: Math.max(-5, Math.min(10, (prev ? prev.points : 0) + p)), reason: [prev && prev.reason, str(x.reason, 160)].filter(Boolean).join('; ') };
    });
    out.stats = Object.values(sMap);

    const cMap = {};
    arr(r.counters).forEach((x) => {
      if (!x || !COUNTERS.find((c) => c.id === x.id)) return;
      const a = Math.round((Number(x.amount) || 0) * 10) / 10;
      if (!(a > 0)) return;
      const prev = cMap[x.id];
      cMap[x.id] = { id: x.id, amount: Math.min(1000, (prev ? prev.amount : 0) + a), reason: [prev && prev.reason, str(x.reason, 160)].filter(Boolean).join('; ') };
    });
    out.counters = Object.values(cMap);

    const seen = new Set();
    arr(r.milestones).forEach((x) => {
      if (!x || seen.has(x.id) || unlocked.includes(x.id) || !MILESTONES.find((m) => m.id === x.id)) return;
      seen.add(x.id);
      out.milestones.push({ id: x.id, reason: str(x.reason, 160) });
    });
    return out;
  }

  function extractJSON(text) {
    if (!text) throw new AIError('Модель вернула пустой ответ.');
    const t = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    try { return JSON.parse(t); } catch (e) { /* ищем объект внутри текста */ }
    const a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { /* ниже */ } }
    throw new AIError('Не удалось разобрать ответ модели.');
  }

  /* ---------------- Claude API (официальный SDK) ---------------- */

  async function callClaude(c, system, user, sch) {
    let Anthropic;
    try { Anthropic = await loadSDK(); }
    catch (e) { throw new AIError('Не удалось загрузить модуль Claude. Проверь интернет и попробуй ещё раз.', 'network'); }

    const client = new Anthropic({ apiKey: c.claudeKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 2, timeout: 120000 });
    const model = c.claudeModel || DEFAULTS.claudeModel;
    const params = {
      model,
      max_tokens: 16000,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: sch } },
    };
    if (FALLBACK_MODELS.includes(model)) {
      // Если классификатор безопасности ошибочно отклонит запрос, сервер повторит его на рекомендованной модели.
      params.betas = ['server-side-fallback-2026-07-01'];
      params.fallbacks = 'default';
    }

    let res;
    try {
      res = params.betas ? await client.beta.messages.create(params) : await client.messages.create(params);
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) throw new AIError('Неверный API-ключ Claude. Проверь его в настройках.', 'auth');
      if (e instanceof Anthropic.PermissionDeniedError) throw new AIError('У ключа нет доступа к этой модели.', 'auth');
      if (e instanceof Anthropic.NotFoundError) throw new AIError('Модель не найдена. Выбери другую в настройках.', 'config');
      if (e instanceof Anthropic.RateLimitError) throw new AIError('Слишком много запросов. Попробуй через минуту.', 'rate');
      if (e instanceof Anthropic.APIConnectionError) throw new AIError('Нет связи с сервером Claude. Проверь интернет.', 'network');
      if (e instanceof Anthropic.APIError) {
        if (e.type === 'billing_error') throw new AIError('На аккаунте Claude закончился баланс.', 'billing');
        if (e.status === 529 || e.type === 'overloaded_error') throw new AIError('Claude сейчас перегружен. Попробуй чуть позже.', 'rate');
        throw new AIError(`Ошибка Claude API (${e.status || '?'}): ${(e.error && e.error.error && e.error.error.message) || e.message}`);
      }
      throw new AIError('Неожиданная ошибка: ' + (e && e.message ? e.message : e));
    }

    if (res.stop_reason === 'refusal') throw new AIError('Claude отказался обработать этот отчёт. Попробуй переформулировать.', 'refusal');
    if (res.stop_reason === 'max_tokens') throw new AIError('Ответ оказался слишком длинным. Попробуй рассказать короче.');
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    return extractJSON(text);
  }

  /* ---------------- Свой сервер (OpenAI-совместимый API) ---------------- */

  async function callCustom(c, system, user, sch) {
    const base = c.baseUrl.trim().replace(/\/+$/, '');
    const url = /\/chat\/completions$/.test(base) ? base : base + '/chat/completions';
    const headers = { 'Content-Type': 'application/json' };
    if (c.apiKey.trim()) headers.Authorization = 'Bearer ' + c.apiKey.trim();
    const formats = [
      { type: 'json_schema', json_schema: { name: 'day_report', strict: true, schema: sch } },
      { type: 'json_object' },
      null,
    ];
    const sys = system + '\n\nReply with a single JSON object that matches this JSON Schema, with no other text:\n' + JSON.stringify(sch);
    let lastErr = null;
    for (const rf of formats) {
      const body = { model: c.model.trim(), messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0.2 };
      if (rf) body.response_format = rf;
      let resp;
      try {
        resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      } catch (e) {
        throw new AIError('Нет связи с сервером. Проверь адрес, интернет и CORS на сервере.', 'network');
      }
      if (resp.status === 400 || resp.status === 422) { lastErr = await resp.text().catch(() => ''); continue; }
      if (resp.status === 401 || resp.status === 403) throw new AIError('Сервер отклонил ключ доступа.', 'auth');
      if (!resp.ok) throw new AIError(`Сервер ответил ошибкой ${resp.status}.`);
      const data = await resp.json().catch(() => null);
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      return extractJSON(text);
    }
    throw new AIError('Сервер не принял запрос: ' + String(lastErr || '').slice(0, 200));
  }

  /* ---------------- Публичные функции ---------------- */

  async function analyze(S, text, ctx) {
    const c = cfg();
    if (!ready(c)) throw new AIError('ИИ не настроен.', 'config');
    const system = systemPrompt(S);
    const sch = schema(S);
    const user = userMessage(text, ctx);
    const raw = c.provider === 'claude' ? await callClaude(c, system, user, sch) : await callCustom(c, system, user, sch);
    return normalize(raw, S, ctx.unlocked);
  }

  // Проверка связи без траты токенов: запрос информации о модели / списка моделей.
  async function test() {
    const c = cfg();
    if (!ready(c)) throw new AIError('Заполни настройки.', 'config');
    if (c.provider === 'claude') {
      let Anthropic;
      try { Anthropic = await loadSDK(); } catch (e) { throw new AIError('Не удалось загрузить модуль Claude.', 'network'); }
      const client = new Anthropic({ apiKey: c.claudeKey.trim(), dangerouslyAllowBrowser: true, maxRetries: 1 });
      try {
        const m = await client.models.retrieve(c.claudeModel || DEFAULTS.claudeModel);
        return 'Связь есть: ' + (m.display_name || m.id);
      } catch (e) {
        if (e instanceof Anthropic.AuthenticationError) throw new AIError('Неверный API-ключ.', 'auth');
        if (e instanceof Anthropic.NotFoundError) throw new AIError('Модель недоступна для этого ключа.', 'config');
        if (e instanceof Anthropic.APIConnectionError) throw new AIError('Нет связи с сервером Claude.', 'network');
        if (e instanceof Anthropic.APIError) throw new AIError(`Ошибка API (${e.status || '?'})`);
        throw new AIError('Ошибка: ' + (e && e.message));
      }
    }
    const base = c.baseUrl.trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    const headers = {};
    if (c.apiKey.trim()) headers.Authorization = 'Bearer ' + c.apiKey.trim();
    let resp;
    try { resp = await fetch(base + '/models', { headers }); }
    catch (e) { throw new AIError('Нет связи с сервером. Проверь адрес и CORS.', 'network'); }
    if (resp.status === 401 || resp.status === 403) throw new AIError('Сервер отклонил ключ.', 'auth');
    if (!resp.ok) throw new AIError(`Сервер ответил ${resp.status}.`);
    const data = await resp.json().catch(() => ({}));
    const ids = (data.data || []).map((m) => m.id);
    return ids.length ? `Связь есть. Модели: ${ids.slice(0, 4).join(', ')}${ids.length > 4 ? '…' : ''}` : 'Связь есть.';
  }

  return { cfg, setCfg, ready, providerName, analyze, test, CLAUDE_MODELS, AIError };
})();
