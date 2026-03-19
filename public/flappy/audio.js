window.GameAudio = (function () {
    let ctx = null;
  
    function get() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      return ctx;
    }
  
    function tone({ freq = 440, freq2 = null, duration = 0.1, type = 'sine', volume = 0.15, attack = 0.005, decay = 0.05, delay = 0 } = {}) {
      try {
        const ac = get();
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
        if (freq2) osc.frequency.linearRampToValueAtTime(freq2, ac.currentTime + delay + duration);
        gain.gain.setValueAtTime(0, ac.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, ac.currentTime + delay + attack);
        gain.gain.linearRampToValueAtTime(0.001, ac.currentTime + delay + attack + decay + duration);
        osc.start(ac.currentTime + delay);
        osc.stop(ac.currentTime + delay + duration + attack + decay + 0.05);
      } catch (e) {}
    }
  
    return {
      jump()      { tone({ freq: 520, freq2: 640, duration: 0.08, type: 'sine', volume: 0.18, decay: 0.06 }); },
      whoosh()    { tone({ freq: 800, freq2: 200, duration: 0.15, type: 'sine', volume: 0.08, decay: 0.1 }); },
      score()     { tone({ freq: 880, duration: 0.06, volume: 0.14 }); tone({ freq: 1100, duration: 0.06, volume: 0.14, delay: 0.06 }); },
      hit()       { tone({ freq: 200, freq2: 80, duration: 0.25, type: 'sawtooth', volume: 0.22, decay: 0.15 }); },
      die()       { tone({ freq: 300, freq2: 150, duration: 0.3, type: 'square', volume: 0.18, decay: 0.2 }); tone({ freq: 150, freq2: 60, duration: 0.4, type: 'sawtooth', volume: 0.14, delay: 0.25, decay: 0.3 }); },
      milestone() { [0, 0.09, 0.18].forEach((d, i) => tone({ freq: 660 + i * 220, duration: i === 2 ? 0.12 : 0.08, volume: 0.18, delay: d })); },
      newBest()   { [0, 0.08, 0.16, 0.24, 0.32].forEach((d, i) => tone({ freq: 440 + i * 110, duration: 0.1, volume: 0.16, delay: d })); },
    };
  })();