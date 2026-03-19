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
    const PIPE_GAP      = 160;
    const PIPE_SPEED    = 2.8;
    const PIPE_INTERVAL = 90;  // frames
    const BIRD_X        = 80;
    const BIRD_SIZE     = 26;
    const GROUND_H      = 80;
  
    // ── State ─────────────────────────────────────────────────
    const STATE = { MENU: 0, PLAYING: 1, DEAD: 2 };
    let state = STATE.MENU;
  
    let bird, pipes, frame, score, highScore, flashTimer;
    highScore = Number(localStorage.getItem('flappy_hs') || 0);
  
    // ── Colors ────────────────────────────────────────────────
    const COLORS = {
      sky:        ['#1a1a2e', '#16213e'],
      bird:       '#ffd700',
      birdBeak:   '#ff8c00',
      birdEye:    '#ffffff',
      birdPupil:  '#1a1a2e',
      pipe:       '#22c55e',
      pipeDark:   '#16a34a',
      ground:     '#854d0e',
      groundTop:  '#a16207',
      text:       '#ffffff',
      shadow:     'rgba(0,0,0,0.4)',
    };
  
    // ── Stars ─────────────────────────────────────────────────
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * (H - GROUND_H),
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
    }));
  
    // ── Init ──────────────────────────────────────────────────
    function init() {
      bird = {
        x: BIRD_X,
        y: H / 2 - 50,
        vy: 0,
        angle: 0,
        wingAngle: 0,
        wingDir: 1,
        alive: true,
      };
      pipes = [];
      frame = 0;
      score = 0;
      flashTimer = 0;
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
        return;
      }
      if (state === STATE.PLAYING && bird.alive) {
        bird.vy = JUMP_FORCE;
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
      const bx = bird.x - BIRD_SIZE / 2 + 4;
      const by = bird.y - BIRD_SIZE / 2 + 4;
      const bw = BIRD_SIZE - 8;
      const bh = BIRD_SIZE - 8;
  
      const pRight = pipe.x + PIPE_WIDTH;
      const pLeft  = pipe.x;
  
      if (bx + bw < pLeft || bx > pRight) return false;
      if (by < pipe.topH) return true;
      if (by + bh > pipe.topH + PIPE_GAP) return true;
      return false;
    }
  
    // ── Update ────────────────────────────────────────────────
    function update() {
      frame++;
  
      // Wing flap
      bird.wingAngle += 0.18 * bird.wingDir;
      if (Math.abs(bird.wingAngle) > 0.5) bird.wingDir *= -1;
  
      if (state === STATE.MENU) {
        bird.y = H / 2 - 50 + Math.sin(frame * 0.05) * 8;
        return;
      }
  
      if (state === STATE.DEAD) {
        flashTimer = Math.max(0, flashTimer - 1);
        return;
      }
  
      // Gravity
      bird.vy += GRAVITY;
      bird.vy = Math.min(bird.vy, 12);
      bird.y += bird.vy;
  
      // Angle
      bird.angle = Math.min(Math.PI / 2, Math.max(-0.4, bird.vy * 0.06));
  
      // Spawn pipes
      if (frame % PIPE_INTERVAL === 0) spawnPipe();
  
      // Move pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
  
        // Score
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < BIRD_X) {
          pipes[i].scored = true;
          score++;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappy_hs', String(highScore));
          }
        }
  
        // Remove off-screen
        if (pipes[i].x + PIPE_WIDTH < -10) {
          pipes.splice(i, 1);
          continue;
        }
  
        // Collision
        if (checkCollision(pipes[i])) {
          die();
          return;
        }
      }
  
      // Ground / ceiling
      if (bird.y + BIRD_SIZE / 2 > H - GROUND_H || bird.y - BIRD_SIZE / 2 < 0) {
        die();
      }
    }
  
    function die() {
      bird.alive = false;
      state = STATE.DEAD;
      flashTimer = 12;
      // ── Post score to parent (React app) ──────────────────
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
  
      // Stars
      for (const s of stars) {
        ctx.globalAlpha = s.alpha + Math.sin(frame * 0.02 + s.x) * 0.1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  
    function drawGround() {
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
      ctx.fillStyle = COLORS.groundTop;
      ctx.fillRect(0, H - GROUND_H, W, 12);
  
      // Grass tufts
      ctx.fillStyle = '#65a30d';
      for (let x = (frame * PIPE_SPEED) % 40; x < W; x += 40) {
        ctx.beginPath();
        ctx.arc(x, H - GROUND_H + 6, 8, Math.PI, 0);
        ctx.fill();
      }
    }
  
    function drawPipe(pipe) {
      const { x, topH } = pipe;
      const botY = topH + PIPE_GAP;
      const botH = H - GROUND_H - botY;
      const cap = 14;
  
      // Top pipe body
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(x, 0, PIPE_WIDTH, topH - cap);
  
      // Top pipe cap
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(x - 4, topH - cap, PIPE_WIDTH + 8, cap);
  
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 6, 0, 10, topH - cap);
  
      // Bottom pipe body
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(x, botY + cap, PIPE_WIDTH, botH);
  
      // Bottom pipe cap
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(x - 4, botY, PIPE_WIDTH + 8, cap);
  
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 6, botY + cap, 10, botH);
    }
  
    function drawBird() {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.angle);
  
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(2, BIRD_SIZE / 2 - 2, BIRD_SIZE / 2 - 2, 5, 0, 0, Math.PI * 2);
      ctx.fill();
  
      // Wing
      ctx.fillStyle = '#f59e0b';
      ctx.save();
      ctx.rotate(bird.wingAngle);
      ctx.beginPath();
      ctx.ellipse(-4, 2, 10, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
  
      // Body
      ctx.fillStyle = COLORS.bird;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
  
      // Belly
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(3, 4, 8, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
  
      // Eye white
      ctx.fillStyle = COLORS.birdEye;
      ctx.beginPath();
      ctx.arc(7, -5, 6, 0, Math.PI * 2);
      ctx.fill();
  
      // Pupil
      ctx.fillStyle = COLORS.birdPupil;
      ctx.beginPath();
      ctx.arc(8.5, -5, 3, 0, Math.PI * 2);
      ctx.fill();
  
      // Gleam
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9.5, -6.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
  
      // Beak
      ctx.fillStyle = COLORS.birdBeak;
      ctx.beginPath();
      ctx.moveTo(11, -2);
      ctx.lineTo(19, 1);
      ctx.lineTo(11, 3);
      ctx.closePath();
      ctx.fill();
  
      ctx.restore();
    }
  
    function drawScore() {
      ctx.textAlign = 'center';
      ctx.font = 'bold 42px Segoe UI';
      ctx.fillStyle = COLORS.shadow;
      ctx.fillText(score, W / 2 + 2, 72);
      ctx.fillStyle = COLORS.text;
      ctx.fillText(score, W / 2, 70);
    }
  
    function drawMenu() {
      // Panel
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      roundRect(W / 2 - 130, H / 2 - 100, 260, 200, 20);
      ctx.fill();
  
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 44px Segoe UI';
      ctx.fillText('Flappy Bird', W / 2, H / 2 - 48);
  
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Segoe UI';
      ctx.fillText('Tap or press Space to start', W / 2, H / 2);
  
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px Segoe UI';
      ctx.fillText(`Best: ${highScore}`, W / 2, H / 2 + 34);
    }
  
    function drawDead() {
      // Flash
      if (flashTimer > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flashTimer / 12 * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }
  
      // Panel
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      roundRect(W / 2 - 130, H / 2 - 130, 260, 260, 20);
      ctx.fill();
  
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 38px Segoe UI';
      ctx.fillText('Game Over', W / 2, H / 2 - 76);
  
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px Segoe UI';
      ctx.fillText(`Score: ${score}`, W / 2, H / 2 - 28);
  
      ctx.fillStyle = '#ffd700';
      ctx.font = '22px Segoe UI';
      ctx.fillText(`Best: ${highScore}`, W / 2, H / 2 + 14);
  
      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px Segoe UI';
      ctx.fillText('Tap or Space to restart', W / 2, H / 2 + 60);
  
      // Medal
      if (score >= 10) {
        ctx.fillStyle = score >= 30 ? '#ffd700' : score >= 20 ? '#e2e8f0' : '#cd7c2f';
        ctx.beginPath();
        ctx.arc(W / 2, H / 2 + 110, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.font = 'bold 14px Segoe UI';
        ctx.fillText(score >= 30 ? '🥇' : score >= 20 ? '🥈' : '🥉', W / 2, H / 2 + 115);
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
    function loop() {
      update();
  
      drawBackground();
      for (const p of pipes) drawPipe(p);
      drawGround();
      drawBird();
  
      if (state === STATE.PLAYING || state === STATE.DEAD) drawScore();
      if (state === STATE.MENU) drawMenu();
      if (state === STATE.DEAD) drawDead();
  
      requestAnimationFrame(loop);
    }
  
    init();
    loop();
  })();