window.Renderer = (function () {
    const S = window.State;
  
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * S.W,
      y: Math.random() * (S.H - S.GROUND_H - 60),
      r: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.6 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
    }));
  
    const clouds = Array.from({ length: 4 }, (_, i) => ({
      x: (S.W / 4) * i + Math.random() * 60,
      y: 60 + Math.random() * 120,
      w: 60 + Math.random() * 50,
      speed: 0.3 + Math.random() * 0.3,
      alpha: 0.06 + Math.random() * 0.06,
    }));
  
    function updateClouds(speedMul = 1) {
      for (const c of clouds) { c.x -= c.speed * speedMul; if (c.x + c.w < 0) c.x = S.W + c.w; }
    }
  
    function roundRect(ctx, x, y, w, h, r) {
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
  
    function drawBackground(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, S.H - S.GROUND_H);
      grad.addColorStop(0, '#0f0c29');
      grad.addColorStop(1, '#302b63');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, S.W, S.H - S.GROUND_H);
  
      for (const s of stars) {
        s.twinkle += 0.03;
        ctx.globalAlpha = s.alpha + Math.sin(s.twinkle) * 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
  
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
  
    function drawGround(ctx) {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, S.H - S.GROUND_H, S.W, S.GROUND_H);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, S.H - S.GROUND_H, S.W, 10);
      ctx.fillStyle = '#65a30d';
      for (let x = -(S.frame * S.PIPE_SPEED % 44); x < S.W + 44; x += 44) {
        ctx.beginPath(); ctx.arc(x, S.H - S.GROUND_H + 5, 10, Math.PI, 0); ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let x = -(S.frame * S.PIPE_SPEED % 30); x < S.W + 30; x += 30) {
        ctx.fillRect(x, S.H - S.GROUND_H + 14, 14, 4);
      }
    }
  
    function drawScore(ctx) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 44px Segoe UI';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(S.score, S.W / 2 + 2, 72);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(S.score, S.W / 2, 70);
  
      if (S.newBest && S.current === S.STATES.PLAYING) {
        ctx.font = 'bold 12px Segoe UI';
        ctx.fillStyle = '#ffd700';
        ctx.fillText('★ NEW BEST ★', S.W / 2, 90);
      }
  
      if (S.milestoneTimer > 0) {
        const alpha = S.milestoneTimer > 20 ? 1 : S.milestoneTimer / 20;
        const scale = S.milestoneTimer > 70 ? 1 + (90 - S.milestoneTimer) * 0.03 : 1;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(S.W / 2, S.H / 3);
        ctx.scale(scale, scale);
        ctx.font = 'bold 32px Segoe UI';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(S.milestoneText, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
  
    function drawMenu(ctx) {
      const glow = 0.7 + Math.sin(S.frame * 0.06) * 0.3;
      ctx.shadowColor = `rgba(255,215,0,${glow})`;
      ctx.shadowBlur = 20;
  
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, S.W / 2 - 135, S.H / 2 - 115, 270, 220, 22);
      ctx.fill();
      ctx.shadowBlur = 0;
  
      ctx.strokeStyle = 'rgba(255,215,0,0.3)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, S.W / 2 - 135, S.H / 2 - 115, 270, 220, 22);
      ctx.stroke();
  
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 42px Segoe UI';
      ctx.shadowColor = 'rgba(255,215,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.fillText('Flappy Bird', S.W / 2, S.H / 2 - 55);
      ctx.shadowBlur = 0;
  
      const dots = '.'.repeat(1 + (Math.floor(S.frame / 20) % 3));
      ctx.fillStyle = '#ffffff';
      ctx.font = '17px Segoe UI';
      ctx.fillText(`Tap or Space to start${dots}`, S.W / 2, S.H / 2 - 8);
  
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px Segoe UI';
      ctx.fillText(`Best: ${S.highScore}`, S.W / 2, S.H / 2 + 28);
  
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '12px Segoe UI';
      ctx.fillText('Space / Tap to flap', S.W / 2, S.H / 2 + 60);
    }
  
    function drawDead(ctx) {
      if (S.flashTimer > 0) {
        ctx.fillStyle = `rgba(255,80,80,${(S.flashTimer / 14) * 0.5})`;
        ctx.fillRect(0, 0, S.W, S.H);
      }
  
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      roundRect(ctx, S.W / 2 - 135, S.H / 2 - 145, 270, 290, 22);
      ctx.fill();
  
      ctx.strokeStyle = 'rgba(239,68,68,0.35)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, S.W / 2 - 135, S.H / 2 - 145, 270, 290, 22);
      ctx.stroke();
  
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 36px Segoe UI';
      ctx.shadowColor = 'rgba(239,68,68,0.4)';
      ctx.shadowBlur = 10;
      ctx.fillText('Game Over', S.W / 2, S.H / 2 - 92);
      ctx.shadowBlur = 0;
  
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(S.W / 2 - 100, S.H / 2 - 68);
      ctx.lineTo(S.W / 2 + 100, S.H / 2 - 68);
      ctx.stroke();
  
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px Segoe UI';
      ctx.fillText(`Score: ${S.score}`, S.W / 2, S.H / 2 - 38);
  
      ctx.fillStyle = S.newBest ? '#ffd700' : '#94a3b8';
      ctx.font = `${S.newBest ? 'bold' : 'normal'} 18px Segoe UI`;
      if (S.newBest) { ctx.shadowColor = 'rgba(255,215,0,0.5)'; ctx.shadowBlur = 8; }
      ctx.fillText(S.newBest ? `🏆 New Best: ${S.highScore}!` : `Best: ${S.highScore}`, S.W / 2, S.H / 2 + 2);
      ctx.shadowBlur = 0;
  
      ctx.fillStyle = 'rgba(148,163,184,0.7)';
      ctx.font = '14px Segoe UI';
      ctx.fillText('Tap or Space to restart', S.W / 2, S.H / 2 + 42);
  
      if (S.score >= 5) {
        const isGold = S.score >= 30, isSilver = S.score >= 20;
        const medal = isGold ? '🥇' : isSilver ? '🥈' : '🥉';
        const medalColor = isGold ? '#ffd700' : isSilver ? '#e2e8f0' : '#cd7c2f';
        const medalY = S.H / 2 + 100;
  
        ctx.fillStyle = medalColor;
        ctx.shadowColor = medalColor;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(S.W / 2, medalY, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
  
        ctx.font = '22px Segoe UI';
        ctx.fillText(medal, S.W / 2, medalY + 8);
  
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px Segoe UI';
        ctx.fillText(isGold ? 'Gold' : isSilver ? 'Silver' : 'Bronze', S.W / 2, medalY + 36);
      }
    }
  
    return { drawBackground, drawGround, drawScore, drawMenu, drawDead, updateClouds };
  })();