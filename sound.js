'use strict';

/* =====================================================================
   Звуки «Алого реактора» — синтез через Web Audio, без аудиофайлов.
   На iPhone звук включается после первого касания экрана и, как и всё
   в Safari, молчит при включённом беззвучном режиме.
   ===================================================================== */

const SFX = (() => {
  let ctx = null, out = null, enabled = true, noiseBuf = null;

  function init() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4;
    out = ctx.createGain();
    out.gain.value = 0.55;
    out.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  // Разблокировка звука на iOS — только из обработчика касания.
  function unlock() {
    if (!enabled) return;
    init();
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
  }

  function env(g, t, vol, attack, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  // Тон с частотной кривой и (по желанию) фильтром.
  function tone({ type = 'sine', f0 = 440, f1 = f0, at = 0, dur = 0.15, vol = 0.2, attack = 0.004, lp = 0, lp1 = lp, q = 1, detune = 0 }) {
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    let node = o;
    if (lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.Q.value = q;
      f.frequency.setValueAtTime(lp, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(40, lp1), t + dur);
      o.connect(f); node = f;
    }
    node.connect(g); g.connect(out);
    env(g, t, vol, attack, dur);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // Шум (взрыв, свист, «шшш» энергии).
  function noise({ at = 0, dur = 0.3, vol = 0.2, type = 'bandpass', f0 = 2000, f1 = 300, q = 0.8, attack = 0.01 }) {
    const t = ctx.currentTime + at;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    s.connect(f); f.connect(g); g.connect(out);
    env(g, t, vol, attack, dur);
    s.start(t); s.stop(t + dur + 0.05);
  }

  const SOUNDS = {
    // Короткий щелчок интерфейса
    tap() { tone({ type: 'square', f0: 1900, f1: 1300, dur: 0.035, vol: 0.05, lp: 4000 }); },
    // Переключение вкладки
    tab() { tone({ type: 'triangle', f0: 620, f1: 940, dur: 0.07, vol: 0.09 }); tone({ type: 'sine', f0: 1240, dur: 0.05, vol: 0.04, at: 0.03 }); },
    // Лазерный выстрел — начисление очков
    zap() {
      tone({ type: 'sawtooth', f0: 1600, f1: 160, dur: 0.2, vol: 0.13, lp: 5200, lp1: 500, q: 6 });
      tone({ type: 'sine', f0: 240, f1: 90, dur: 0.16, vol: 0.18 });
      tone({ type: 'triangle', f0: 2400, f1: 3600, dur: 0.06, vol: 0.05, at: 0.02 });
    },
    // Подвиг: лазер + искры
    quest() {
      SOUNDS.zap();
      [0, 1, 2].forEach((i) => tone({ type: 'triangle', f0: 1800 + i * 420, f1: 2600 + i * 420, dur: 0.05, vol: 0.045, at: 0.06 + i * 0.045 }));
      noise({ at: 0, dur: 0.18, vol: 0.06, type: 'highpass', f0: 3000, f1: 6000 });
    },
    // Минус / отмена
    down() { tone({ type: 'square', f0: 420, f1: 180, dur: 0.12, vol: 0.07, lp: 1800 }); },
    // Параметр повысил уровень
    levelup() {
      tone({ type: 'sawtooth', f0: 180, f1: 1400, dur: 0.55, vol: 0.12, lp: 900, lp1: 6000, q: 4 });
      noise({ dur: 0.6, vol: 0.12, type: 'bandpass', f0: 400, f1: 5000, q: 1.2, attack: 0.2 });
      [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.45, vol: 0.12, at: 0.35 + i * 0.08 }));
    },
    // Перегрузка ядра — новый уровень персонажа
    overload() {
      tone({ type: 'sine', f0: 140, f1: 32, dur: 1.2, vol: 0.5, attack: 0.005 });
      noise({ dur: 1.4, vol: 0.35, type: 'lowpass', f0: 5000, f1: 120, q: 0.5, attack: 0.005 });
      tone({ type: 'sawtooth', f0: 110, f1: 880, dur: 0.9, vol: 0.1, lp: 600, lp1: 4000, q: 5, at: 0.15 });
      [392, 523, 659, 784, 1047, 1319].forEach((f, i) => {
        tone({ type: 'triangle', f0: f, dur: 1.1, vol: 0.09, at: 0.55 + i * 0.07 });
        tone({ type: 'sine', f0: f * 2, dur: 0.8, vol: 0.03, at: 0.55 + i * 0.07, detune: 8 });
      });
    },
    // Достижение
    achieve() {
      [1047, 1319, 1568, 2093].forEach((f, i) => {
        tone({ type: 'triangle', f0: f, dur: 0.55, vol: 0.09, at: i * 0.07 });
        tone({ type: 'sine', f0: f, dur: 0.55, vol: 0.05, at: i * 0.07, detune: 12 });
      });
    },
    // ИИ анализирует отчёт: поток данных
    scan() {
      for (let i = 0; i < 9; i++) tone({ type: 'square', f0: 600 + Math.random() * 1600, dur: 0.035, vol: 0.035, at: i * 0.055, lp: 3000 });
      tone({ type: 'sine', f0: 300, f1: 900, dur: 0.5, vol: 0.05 });
    },
    // ИИ ответил
    confirm() { tone({ type: 'triangle', f0: 880, dur: 0.12, vol: 0.1 }); tone({ type: 'triangle', f0: 1320, dur: 0.22, vol: 0.1, at: 0.1 }); },
    // Ошибка
    error() { tone({ type: 'square', f0: 160, f1: 120, dur: 0.25, vol: 0.09, lp: 900 }); tone({ type: 'square', f0: 150, f1: 110, dur: 0.25, vol: 0.07, at: 0.18, lp: 900 }); },
  };

  let lastAt = {};
  function play(name) {
    if (!enabled || !SOUNDS[name]) return;
    if (!init()) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    // Не наслаиваем одинаковые звуки чаще, чем раз в 60 мс.
    const now = performance.now();
    if (lastAt[name] && now - lastAt[name] < 60) return;
    lastAt[name] = now;
    try { SOUNDS[name](); } catch (e) { /* звук не критичен */ }
  }

  return {
    play, unlock,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; },
  };
})();

['pointerdown', 'touchstart', 'keydown'].forEach((ev) => document.addEventListener(ev, () => SFX.unlock(), { passive: true, capture: true }));
