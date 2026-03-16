// utils.js
// Shared helpers and Web Audio beep-based sound effects.

window.GameUtils = (function () {
  const utils = {};

  // --- Math helpers ---
  utils.distanceSquared = function (a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  };

  utils.clamp = function (v, min, max) {
    return Math.max(min, Math.min(max, v));
  };

  // --- Audio helpers (Web Audio API) ---
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    return audioCtx;
  }

  function playTone({
    freq = 440,
    duration = 0.08,
    type = "square",
    volume = 0.12,
    attack = 0.005,
    decay = 0.04
  } = {}) {
    const ctx = ensureAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.linearRampToValueAtTime(0.001, now + attack + decay + duration);

    osc.start(now);
    osc.stop(now + duration + attack + decay + 0.05);
  }

  utils.initAudio = function () {
    ensureAudio();
  };

  // --- Game sound palette ---
  utils.Sounds = {
    dot() {
      playTone({ freq: 880, duration: 0.04, type: "square", volume: 0.12 });
    },
    power() {
      // Slight siren-like wobble using two quick tones
      playTone({ freq: 440, duration: 0.14, type: "sine", volume: 0.15 });
      setTimeout(
        () =>
          playTone({
            freq: 520,
            duration: 0.14,
            type: "sine",
            volume: 0.15
          }),
        120
      );
    },
    ghostEaten() {
      playTone({
        freq: 900,
        duration: 0.09,
        type: "triangle",
        volume: 0.16
      });
      setTimeout(
        () =>
          playTone({
            freq: 1200,
            duration: 0.09,
            type: "triangle",
            volume: 0.16
          }),
        80
      );
    },
    death() {
      playTone({
        freq: 300,
        duration: 0.20,
        type: "sawtooth",
        volume: 0.18
      });
      setTimeout(
        () =>
          playTone({
            freq: 200,
            duration: 0.35,
            type: "sawtooth",
            volume: 0.16
          }),
        220
      );
    },
    fruit() {
      playTone({
        freq: 1046,
        duration: 0.08,
        type: "triangle",
        volume: 0.16
      });
      setTimeout(
        () =>
          playTone({
            freq: 1318,
            duration: 0.08,
            type: "triangle",
            volume: 0.16
          }),
        80
      );
    }
  };

  return utils;
})();

