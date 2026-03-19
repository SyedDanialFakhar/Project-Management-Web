(function () {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
  
    const W = 360;
    const H = 640;
    canvas.width = W;
    canvas.height = H;
  
    // ── Constants ─────────────────────────────────────────────
    const GRAVITY       = 0.5;
    const JUMP_FORCE    = -9;
    const PIPE_WIDTH    = 60;
    const PIPE_GAP      = 155;
    const PIPE_SPEED    = 2.8;
    const PIPE_INTERVAL = 90;
    const BIRD_X        = 80;
    const BIRD_SIZE     = 26;
    const GROUND_H      = 80;
  
    // ── State ─────────────────────────────────────────────────
    const STATE = { MENU: 0, PLAYING: 1, DEAD: 2 };
    let state = STATE.MENU;
    let bird, pipes, frame, score, highScore, flashTimer;
    let shakeX = 0, shakeY = 0, shakePower = 0;
    let particles = [];
    let scorePopups = [];
    let milestoneTimer = 0;
    let milestoneText = '';
    let newBest = false;
    highScore = Number(localStorage.getItem('flappy_hs') || 0);
  
    // ── Audio (Web Audio API) ─────────────────────────────────
    let audioCtx = null;
  
    function getAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return audioCtx;
    }
  
    function playTone({ freq = 440, freq2 = null, duration = 0.1, type = 'sine', volume = 0.15, attack = 0.005, decay = 0.05, delay = 0 } = {}) {
      try {
        const ac = getAudio();
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
  
    const Sounds = {
      jump() {
        playTone({ freq: 520, freq2: 640, duration: 0.08, type: 'sine', volume: 0.18, decay: 0.06 });
      },
      score() {
        playTone({ freq: 880, duration: 0.06, type: 'sine', volume: 0.14 });
        playTone({ freq: 1100, duration: 0.06, type: 'sine', volume: 0.14, delay: 0.06 });
      },
      milestone() {
        playTone({ freq: 660, duration: 0.08, type: 'sine', volume: 0.18 });
        playTone({ freq: 880, duration: 0.08, type: 'sine', volume: 0.18, delay: 0.09 });
        playTone({ freq: 1100, duration: 0.12, type: 'sine', volume: 0.18, delay: 0.18 });
      },
      newHighScore() {
        [0, 0.08, 0.16, 0.24, 0.32].forEach((delay, i) => {
          playTone({ freq: 440 + i * 110, duration: 0.1, type: 'sine', volume: 0.16, delay });
        });
      },
      hit() {
        playTone({ freq: 200, freq2: 80, duration: 0.25, type: 'sawtooth', volume: 0.22, decay: 0.15 });
      },
      die() {
        playTone({ freq: 300, freq2: 150, duration: 0.3, type: 'square', volume: 0.18, decay: 0.2 });
        playTone({ freq: 150, freq2: 60, duration: 0.4, type: 'sawtooth', volume: 0.14, delay: 0.25, decay: 0.3 });
      },
      whoosh() {
        playTone({ freq: 800, freq2: 200, duration: 0.15, type: 'sine', volume: 0.08, decay: 0.1 });
      },
    };
  
    // ── Colors ────────────────────────────────────────────────
    const COLORS = {
      sky: ['#0f0c29', '#302b63'],
      bird: '#ffd700',
      birdBeak: '#ff8c00',
      birdEye: '#ffffff',
      birdPupil: '#1a1a2e',
      pipe: '#22c55e',
      pipeDark: '#16a34a',
      pipeGlow: 'rgba(34,197,94,0.3)',
      ground: '#78350f',
      groundTop: '#92400e',
      text: '#ffffff',
      shadow: 'rgba(0,0,0,0.5)',
    };
  
    // ── Stars & clouds ────────────────────────────────────────
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * W,
      y: Math.random() * (H - GROUND_H - 60),
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
    }));
  
    const clouds = Array.from({ length: 4 }, (_, i) => ({
      x: (W / 4) * i + Math.random() * 60,
      y: 60 + Math.random() * 120,
      w: 60 + Math.random() * 50,
      speed: 0.3 + Math.random() * 0.3,
      alpha: 0.06 + Math.random() * 0.06,
    }));
  
    // ── Screen shake ──────────────────────────────────────────
    function triggerShake(power) {
      shakePower = power;
    }
  
    function updateShake() {
      if (shakePower > 0.1) {
        shakeX = (Math.random() - 0.5) * shakePower;
        shakeY = (Math.random() - 0.5) * shakePower;
        shakePower *= 0.8;
      } else {
        shakeX = 0; shakeY = 0; shakePower = 0;
      }
    }
  
    // ── Particles ─────────────────────────────────────────────
    function spawnParticles(x, y, color, count = 8, speed = 80) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const s = speed * (0.5 + Math.random() * 0.8);
        particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          life: 1,
          decay: 0.025 + Math.random() * 0.02,
          r: 2 + Math.random() * 3,
          color,
        });
      }
    }
  
    function spawnFeathers(x, y) {
      const colors = ['#ffd700', '#f59e0b', '#fef3c7', '#ff8c00'];
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = 60 + Math.random() * 100;
        particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s - 30,
          life: 1,
          decay: 0.015 + Math.random() * 0.015,
          r: 3 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          isFeather: true,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
        });
      }
    }
  
    function updateParticles(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt / 1000;
        p.y += p.vy * dt / 1000;
        p.vy += 120 * dt / 1000; // gravity on particles
        if (p.isFeather) p.rotation += p.rotSpeed;
      }
    }
  
    function drawParticles() {
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = p.color;
        if (p.isFeather) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  
    // ── Score popups ──────────────────────────────────────────
    function spawnScorePopup(x, y, text, color = '#ffffff') {
      scorePopups.push({ x, y, text, color, life: 1, vy: -60 });
    }
  
    function updateScorePopups(dt) {
      for (let i = scorePopups.length - 1; i >= 0; i--) {
        const p = scorePopups[i];
        p.life -= 0.025;
        p.y += p.vy * dt / 1000;
        if (p.life <= 0) scorePopups.splice(i, 1);
      }
    }
  
    function drawScorePopups() {
      for (const p of scorePopups) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.textAlign = 'center';
        ctx.font = `bold 18px Segoe UI`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  
    // ── Init ──────────────────────────────────────────────────
    function init() {
      bird = {
        x: BIRD_X, y: H / 2 - 50,
        vy: 0, angle: 0,
        wingAngle: 0, wingDir: 1,
        alive: true,
      };
      pipes = [];
      frame = 0;
      score = 0;
      flashTimer = 0;
      particles = [];
      scorePopups = [];
      newBest = false;
      milestoneTimer = 0;
      shakePower = 0;
    }
  
    // ── Pipe helpers ──────────────────────────────────────────
    function spawnPipe() {
      const minTop = 80;
      const maxTop = H - GROUND_H - PIPE_GAP - 80;
      const topH = minTop + Math.random() * (maxTop - minTop);
      pipes.push({ x: W + 10, topH, scored: false });
    }
  
    // ── Jump ──────────────────────────────────────────────────
    function jump() {
      if (state === STATE.MENU) {
        state = STATE.PLAYING;
        bird.vy = JUMP_FORCE;
        Sounds.jump();
        return;
      }
      if (state === STATE.PLAYING && bird.alive) {
        bird.vy = JUMP_FORCE;
        Sounds.jump();
        Sounds.whoosh();
        // Wing burst particles
        spawnParticles(bird.x - 8, bird.y + 4, '#fef3c7', 4, 40);
      }
      if (state === STATE.DEAD) {
        init();
        state = STATE.PLAYING;
      }
    }
  
    // ── Input ─────────────────────────────────────────────────
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    });
    canvas.addEventListener('click', jump);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });
  
    // ── Collision ─────────────────────────────────────────────
    function checkCollision(pipe) {
      const bx = bird.x - BIRD_SIZE / 2 + 5;
      const by = bird.y - BIRD_SIZE / 2 + 5;
      const bw = BIRD_SIZE - 10;
      const bh = BIRD_SIZE - 10;
      if (bx + bw < pipe.x || bx > pipe.x + PIPE_WIDTH) return false;
      if (by < pipe.topH) return true;
      if (by + bh > pipe.topH + PIPE_GAP) return true;
      return false;
    }
  
    // ── Update ────────────────────────────────────────────────
    let lastTime = performance.now();
  
    function update(now) {
      const dt = Math.min(now - lastTime, 100);
      lastTime = now;
      frame++;
  
      updateShake();
      updateParticles(dt);
      updateScorePopups(dt);
  
      // Milestone timer
      if (milestoneTimer > 0) milestoneTimer--;
  
      // Wing flap
      bird.wingAngle += 0.2 * bird.wingDir;
      if (Math.abs(bird.wingAngle) > 0.6) bird.wingDir *= -1;
  
      if (state === STATE.MENU) {
        bird.y = H / 2 - 50 + Math.sin(frame * 0.05) * 10;
        // Clouds drift
        for (const c of clouds) { c.x -= c.speed; if (c.x + c.w < 0) c.x = W + c.w; }
        return;
      }
  
      if (state === STATE.DEAD) {
        flashTimer = Math.max(0, flashTimer - 1);
        for (const c of clouds) { c.x -= c.speed * 0.3; if (c.x + c.w < 0) c.x = W + c.w; }
        return;
      }
  
      // Clouds
      for (const c of clouds) { c.x -= c.speed; if (c.x + c.w < 0) c.x = W + c.w; }
  
      // Gravity
      bird.vy += GRAVITY;
      bird.vy = Math.min(bird.vy, 13);
      bird.y += bird.vy;
      bird.angle = Math.min(Math.PI / 2, Math.max(-0.45, bird.vy * 0.065));
  
      // Spawn pipes
      if (frame % PIPE_INTERVAL === 0) spawnPipe();
  
      // Move pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
  
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < BIRD_X) {
          pipes[i].scored = true;
          score++;
  
          const wasHighScore = score > highScore;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappy_hs', String(highScore));
            if (!newBest) {
              newBest = true;
              Sounds.newHighScore();
              spawnParticles(bird.x, bird.y, '#ffd700', 16, 100);
              spawnScorePopup(bird.x, bird.y - 30, '🏆 NEW BEST!', '#ffd700');
            }
          }
  
          Sounds.score();
          spawnParticles(bird.x, bird.y, '#22c55e', 6, 60);
          spawnScorePopup(bird.x, bird.y - 20, `+1`, '#ffffff');
  
          // Milestones
          const milestones = { 5: '🔥 5!', 10: '⚡ 10!', 20: '🌟 20!', 30: '💎 30!', 50: '👑 50!' };
          if (milestones[score]) {
            milestoneText = milestones[score];
            milestoneTimer = 90;
            Sounds.milestone();
            spawnParticles(W / 2, H / 3, '#ffd700', 20, 120);
          }
        }
  
        if (pipes[i].x + PIPE_WIDTH < -10) { pipes.splice(i, 1); continue; }
  
        if (checkCollision(pipes[i])) { die(); return; }
      }
  
      // Ground / ceiling
      if (bird.y + BIRD_SIZE / 2 > H - GROUND_H || bird.y - BIRD_SIZE / 2 < 0) { die(); }
    }
  
    function die() {
      bird.alive = false;
      state = STATE.DEAD;
      flashTimer = 14;
      triggerShake(12);
      Sounds.hit();
      setTimeout(() => Sounds.die(), 120);
      spawnFeathers(bird.x, bird.y);
      spawnParticles(bird.x, bird.y, '#ef4444', 12, 100);
  
      window.parent.postMessage(
        { type: 'FLAPPY_GAME_OVER', score, level: 1 },
        window.location.origin
      );
    }
  
    // ── Draw helpers ──────────────────────────────────────────
    function drawBackground() {
      const grad = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
      grad.addColorStop(0, COLORS.sky[0]);
      grad.addColorStop(1, COLORS.sky[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H - GROUND_H);
  
      // Stars twinkle
      for (const s of stars) {
        s.twinkle += 0.03;
        ctx.globalAlpha = s.alpha + Math.sin(s.twinkle) * 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
  
      // Clouds
      for (const c of clouds) {
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.w * 0.35, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.3, c.y - c.w * 0.1, c.w * 0.28, 0, Math.PI * 2);
        ctx.arc(c.x + c.w * 0.55, c.y, c.w * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  
    function drawGround() {
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
      ctx.fillStyle = COLORS.groundTop;
      ctx.fillRect(0, H - GROUND_H, W, 10);
  
      // Scrolling grass
      ctx.fillStyle = '#65a30d';
      for (let x = -(frame * PIPE_SPEED % 44); x < W + 44; x += 44) {
        ctx.beginPath();
        ctx.arc(x, H - GROUND_H + 5, 10, Math.PI, 0);
        ctx.fill();
      }
  
      // Ground detail stripes
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let x = -(frame * PIPE_SPEED % 30); x < W + 30; x += 30) {
        ctx.fillRect(x, H - GROUND_H + 14, 14, 4);
      }
    }
  
    function drawPipe(pipe) {
      const { x, topH } = pipe;
      const botY = topH + PIPE_GAP;
      const botH = H - GROUND_H - botY;
      const cap = 14;
  
      // Glow
      ctx.shadowColor = COLORS.pipeGlow;
      ctx.shadowBlur = 10;
  
      // Top pipe
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(x, 0, PIPE_WIDTH, topH - cap);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(x - 5, topH - cap, PIPE_WIDTH + 10, cap);
  
      // Bottom pipe
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(x, botY + cap, PIPE_WIDTH, botH);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(x - 5, botY, PIPE_WIDTH + 10, cap);
  
      ctx.shadowBlur = 0;
  
      // Highlights
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 6, 0, 10, topH - cap);
      ctx.fillRect(x + 6, botY + cap, 10, botH);
  
      // Inner shadow on caps
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(x - 5, topH - cap, PIPE_WIDTH + 10, 4);
      ctx.fillRect(x - 5, botY, PIPE_WIDTH + 10, 4);
    }
  
    function drawBird() {
      ctx.save();
      ctx.translate(bird.x + shakeX, bird.y + shakeY);
      ctx.rotate(bird.angle);
  
      // Glow when alive
      if (bird.alive && state === STATE.PLAYING) {
        ctx.shadowColor = 'rgba(255,215,0,0.4)';
        ctx.shadowBlur = 12;
      }
  
      // Shadow on ground
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(2, BIRD_SIZE / 2, BIRD_SIZE / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
  
      // Wing
      ctx.fillStyle = '#f59e0b';
      ctx.save();
      ctx.rotate(bird.wingAngle * (state === STATE.PLAYING ? 1.4 : 1));
      ctx.beginPath();
      ctx.ellipse(-5, 3, 11, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  
      // Body
      ctx.fillStyle = COLORS.bird;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
  
      ctx.shadowBlur = 0;
  
      // Belly
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(3, 5, 8, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
  
      // Eye white
      ctx.fillStyle = COLORS.birdEye;
      ctx.beginPath();
      ctx.arc(7, -5, 6, 0, Math.PI * 2);
      ctx.fill();
  
      // Pupil — looks in direction of movement
      const pupilX = bird.vy < 0 ? 9 : 8;
      const pupilY = bird.vy < 0 ? -7 : -4;
      ctx.fillStyle = COLORS.birdPupil;
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, 3, 0, Math.PI * 2);
      ctx.fill();
  
      // Gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pupilX + 1.2, pupilY - 1.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
  
      // Beak
      ctx.fillStyle = COLORS.birdBeak;
      ctx.beginPath();
      ctx.moveTo(11, -2);
      ctx.lineTo(20, 1);
      ctx.lineTo(11, 4);
      ctx.closePath();
      ctx.fill();
  
      // Beak line
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(11, 1);
      ctx.lineTo(19, 1);
      ctx.stroke();
  
      ctx.restore();
    }
  
    function drawScore() {
      ctx.textAlign = 'center';
  
      // Score shadow
      ctx.font = 'bold 44px Segoe UI';
      ctx.fillStyle = COLORS.shadow;
      ctx.fillText(score, W / 2 + 2, 72);
  
      // Score text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(score, W / 2, 70);
  
      // New best indicator
      if (newBest && state === STATE.PLAYING) {
        ctx.font = 'bold 12px Segoe UI';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★ NEW BEST ★', W / 2, 90);
      }
  
      // Milestone banner
      if (milestoneTimer > 0) {
        const alpha = milestoneTimer > 20 ? 1 : milestoneTimer / 20;
        const scale = milestoneTimer > 70 ? 1 + (90 - milestoneTimer) * 0.03 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(W / 2, H / 3);
        ctx.scale(scale, scale);
        ctx.textAlign = 'center';
        ctx.font = 'bold 32px Segoe UI';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(milestoneText, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  
    function drawMenu() {
      // Animated title glow
      const glow = 0.7 + Math.sin(frame * 0.06) * 0.3;
      ctx.shadowColor = `rgba(255,215,0,${glow})`;
      ctx.shadowBlur = 20;
  
      // Panel
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(W / 2 - 135, H / 2 - 115, 270, 220, 22);
      ctx.fill();
      ctx.shadowBlur = 0;
  
      // Border
      ctx.strokeStyle = 'rgba(255,215,0,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(W / 2 - 135, H / 2 - 115, 270, 220, 22);
      ctx.stroke();
  
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 42px Segoe UI';
      ctx.shadowColor = 'rgba(255,215,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText('Flappy Bird', W / 2, H / 2 - 55);
      ctx.shadowBlur = 0;
  
      // Animated dots
      const dots = '.'.repeat(1 + (Math.floor(frame / 20) % 3));
      ctx.fillStyle = '#ffffff';
      ctx.font = '17px Segoe UI';
      ctx.fillText(`Tap or Space to start${dots}`, W / 2, H / 2 - 8);
  
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Segoe UI';
      ctx.fillText(`Best: ${highScore}`, W / 2, H / 2 + 28);
  
      // Controls hint
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '12px Segoe UI';
      ctx.fillText('Space / Tap to flap', W / 2, H / 2 + 60);
    }
  
    function drawDead() {
      // Flash
      if (flashTimer > 0) {
        ctx.fillStyle = `rgba(255,80,80,${(flashTimer / 14) * 0.5})`;
        ctx.fillRect(0, 0, W, H);
      }
  
      // Panel
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      roundRect(W / 2 - 135, H / 2 - 145, 270, 290, 22);
      ctx.fill();
  
      ctx.strokeStyle = 'rgba(239,68,68,0.35)';
      ctx.lineWidth = 1.5;
      roundRect(W / 2 - 135, H / 2 - 145, 270, 290, 22);
      ctx.stroke();
  
      ctx.textAlign = 'center';
  
      // Game over
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px Segoe UI';
      ctx.shadowColor = 'rgba(239,68,68,0.4)';
      ctx.shadowBlur = 10;
      ctx.fillText('Game Over', W / 2, H / 2 - 92);
      ctx.shadowBlur = 0;
  
      // Divider
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 100, H / 2 - 68);
      ctx.lineTo(W / 2 + 100, H / 2 - 68);
      ctx.stroke();
  
      // Score
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Segoe UI';
      ctx.fillText(`Score: ${score}`, W / 2, H / 2 - 38);
  
      // Best
      ctx.fillStyle = newBest ? '#ffd700' : '#94a3b8';
      ctx.font = `${newBest ? 'bold' : 'normal'} 18px Segoe UI`;
      if (newBest) {
        ctx.shadowColor = 'rgba(255,215,0,0.5)';
        ctx.shadowBlur = 8;
      }
      ctx.fillText(newBest ? `🏆 New Best: ${highScore}!` : `Best: ${highScore}`, W / 2, H / 2 + 2);
      ctx.shadowBlur = 0;
  
      // Restart hint
      ctx.fillStyle = 'rgba(148,163,184,0.7)';
      ctx.font = '14px Segoe UI';
      ctx.fillText('Tap or Space to restart', W / 2, H / 2 + 42);
  
      // Medal
      const medalY = H / 2 + 100;
      if (score >= 5) {
        const isGold   = score >= 30;
        const isSilver = score >= 20;
        const medal = isGold ? '🥇' : isSilver ? '🥈' : '🥉';
        const medalColor = isGold ? '#ffd700' : isSilver ? '#e2e8f0' : '#cd7c2f';
  
        ctx.fillStyle = medalColor;
        ctx.shadowColor = medalColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(W / 2, medalY, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
  
        ctx.font = '22px Segoe UI';
        ctx.fillText(medal, W / 2, medalY + 8);
  
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px Segoe UI';
        ctx.fillText(isGold ? 'Gold' : isSilver ? 'Silver' : 'Bronze', W / 2, medalY + 36);
      }
    }
  
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  
    // ── Main loop ─────────────────────────────────────────────
    function loop(now) {
      update(now);
  
      ctx.save();
      ctx.translate(shakeX, shakeY);
  
      drawBackground();
      for (const p of pipes) drawPipe(p);
      drawGround();
      drawParticles();
      drawBird();
  
      if (state === STATE.PLAYING || state === STATE.DEAD) drawScore();
      if (state === STATE.PLAYING) drawScorePopups();
      if (state === STATE.MENU) drawMenu();
      if (state === STATE.DEAD) drawDead();
  
      ctx.restore();
  
      requestAnimationFrame(loop);
    }
  
    init();
    requestAnimationFrame(loop);
  })();