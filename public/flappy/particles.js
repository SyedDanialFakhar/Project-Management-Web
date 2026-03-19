window.Particles = (function () {
    let particles = [];
    let popups = [];
  
    function spawn(x, y, color, count = 8, speed = 80) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const s = speed * (0.5 + Math.random() * 0.8);
        particles.push({ x, y, vx: Math.cos(angle) * s, vy: Math.sin(angle) * s, life: 1, decay: 0.025 + Math.random() * 0.02, r: 2 + Math.random() * 3, color });
      }
    }
  
    function spawnFeathers(x, y) {
      const colors = ['#ffd700', '#f59e0b', '#fef3c7', '#ff8c00'];
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const s = 60 + Math.random() * 100;
        particles.push({
          x, y,
          vx: Math.cos(angle) * s, vy: Math.sin(angle) * s - 30,
          life: 1, decay: 0.015 + Math.random() * 0.015,
          r: 3 + Math.random() * 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          isFeather: true, rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
        });
      }
    }
  
    function spawnPopup(x, y, text, color = '#ffffff') {
      popups.push({ x, y, text, color, life: 1, vy: -60 });
    }
  
    function update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt / 1000;
        p.y += p.vy * dt / 1000;
        p.vy += 120 * dt / 1000;
        if (p.isFeather) p.rotation += p.rotSpeed;
      }
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.life -= 0.025;
        p.y += p.vy * dt / 1000;
        if (p.life <= 0) popups.splice(i, 1);
      }
    }
  
    function draw(ctx) {
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
  
      for (const p of popups) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px Segoe UI';
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x, p.y);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  
    function reset() { particles = []; popups = []; }
  
    return { spawn, spawnFeathers, spawnPopup, update, draw, reset };
  })();