window.Pipes = (function () {
    const S = window.State;
  
    function spawn() {
      const minTop = 80;
      const maxTop = S.H - S.GROUND_H - S.PIPE_GAP - 80;
      const topH = minTop + Math.random() * (maxTop - minTop);
      S.pipes.push({ x: S.W + 10, topH, scored: false });
    }
  
    function checkCollision(pipe) {
      const b = S.bird;
      const bx = b.x - S.BIRD_SIZE / 2 + 5;
      const by = b.y - S.BIRD_SIZE / 2 + 5;
      const bw = S.BIRD_SIZE - 10;
      const bh = S.BIRD_SIZE - 10;
      if (bx + bw < pipe.x || bx > pipe.x + S.PIPE_WIDTH) return false;
      if (by < pipe.topH) return true;
      if (by + bh > pipe.topH + S.PIPE_GAP) return true;
      return false;
    }
  
    function update(onScore, onCollide) {
      if (S.frame % S.PIPE_INTERVAL === 0) spawn();
  
      for (let i = S.pipes.length - 1; i >= 0; i--) {
        S.pipes[i].x -= S.PIPE_SPEED;
  
        if (!S.pipes[i].scored && S.pipes[i].x + S.PIPE_WIDTH < S.BIRD_X) {
          S.pipes[i].scored = true;
          onScore();
        }
  
        if (S.pipes[i].x + S.PIPE_WIDTH < -10) { S.pipes.splice(i, 1); continue; }
        if (checkCollision(S.pipes[i])) { onCollide(); return; }
      }
    }
  
    function draw(ctx) {
      for (const pipe of S.pipes) {
        const { x, topH } = pipe;
        const botY = topH + S.PIPE_GAP;
        const botH = S.H - S.GROUND_H - botY;
        const cap = 14;
  
        ctx.shadowColor = 'rgba(34,197,94,0.3)';
        ctx.shadowBlur = 10;
  
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, 0, S.PIPE_WIDTH, topH - cap);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(x - 5, topH - cap, S.PIPE_WIDTH + 10, cap);
  
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x, botY + cap, S.PIPE_WIDTH, botH);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(x - 5, botY, S.PIPE_WIDTH + 10, cap);
  
        ctx.shadowBlur = 0;
  
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + 6, 0, 10, topH - cap);
        ctx.fillRect(x + 6, botY + cap, 10, botH);
  
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x - 5, topH - cap, S.PIPE_WIDTH + 10, 4);
        ctx.fillRect(x - 5, botY, S.PIPE_WIDTH + 10, 4);
      }
    }
  
    return { update, draw };
  })();