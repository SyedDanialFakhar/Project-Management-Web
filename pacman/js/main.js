// main.js - COMPLETE VERSION
(function () {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = MazeConfig.CANVAS_WIDTH;
  canvas.height = MazeConfig.CANVAS_HEIGHT;

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const TILE_SIZE = MazeConfig.TILE_SIZE;

  const scoreEl = document.getElementById("hud-score");
  const levelEl = document.getElementById("hud-level");
  const highScoreEl = document.getElementById("hud-highscore");
  const livesContainer = document.getElementById("lives-container");

  const startScreen = document.getElementById("start-screen");
  const pauseScreen = document.getElementById("pause-screen");
  const gameoverScreen = document.getElementById("gameover-screen");
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");
  const gameoverTitle = document.getElementById("gameover-title");
  const gameoverText = document.getElementById("gameover-text");

  const STATE_MENU = "menu";
  const STATE_PLAYING = "playing";
  const STATE_PAUSED = "paused";
  const STATE_GAMEOVER = "gameover";

  let gameState = STATE_MENU;
  let mazeState, pacman, ghosts = [];
  let score = 0;
  let highScore = Number(localStorage.getItem("pacman_high_score") || 0);
  let level = 1;
  let lives = 3;
  let extraLifeGranted = false;
  let powerTimer = 0;
  const BASE_POWER_DURATION = 9000;
  let ghostStreak = 0;

  let ghostMode = GhostsModule.MODE_CHASE;
  let modeTimer = 0;
  let modeIndex = 0;
  const MODE_SEQUENCE = [
    { mode: GhostsModule.MODE_SCATTER, duration: 7000 },
    { mode: GhostsModule.MODE_CHASE, duration: 20000 },
    { mode: GhostsModule.MODE_SCATTER, duration: 7000 },
    { mode: GhostsModule.MODE_CHASE, duration: 20000 }
  ];

  let fruit = null;
  const particles = [];

  function spawnParticles(x, y, color, count = 6, radius = 2) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 60;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.25 + Math.random() * 0.2,
        radius,
        color
      });
    }
  }

  const input = { up: false, down: false, left: false, right: false };

  function resetMazeAndEntities() {
    mazeState = MazeConfig.createMazeState();
    pacman = PacmanModule.createPacman(mazeState);
    ghosts = GhostsModule.createGhosts(mazeState);
    powerTimer = 0; ghostStreak = 0; ghostMode = GhostsModule.MODE_CHASE;
    modeTimer = 0; modeIndex = 0; fruit = null; particles.length = 0;
    updateHUD();
  }

  function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    highScoreEl.textContent = highScore;
    renderLives();
  }

  function renderLives() {
    livesContainer.innerHTML = "";
    for (let i = 0; i < lives; i++) {
      const span = document.createElement("span");
      span.className = "life-icon";
      livesContainer.appendChild(span);
    }
  }

  function addScore(points) {
    score += points;
    if (!extraLifeGranted && score >= 10000) {
      lives++; extraLifeGranted = true; renderLives();
    }
    if (score > highScore) {
      highScore = score;
      localStorage.setItem("pacman_high_score", String(highScore));
    }
    scoreEl.textContent = score;
    highScoreEl.textContent = highScore;
  }

  function loseLife() {
    lives--;
    renderLives();
    if (lives <= 0) { endGame(false); return; }
    setTimeout(() => {
      pacman = PacmanModule.createPacman(mazeState);
      ghosts = GhostsModule.createGhosts(mazeState);
      powerTimer = 0; ghostStreak = 0;
    }, 700);
  }

  function nextLevel() {
    level++;
    extraLifeGranted = score >= 10000;
    mazeState = MazeConfig.createMazeState();
    pacman = PacmanModule.createPacman(mazeState);
    ghosts = GhostsModule.createGhosts(mazeState);
    powerTimer = 0; ghostStreak = 0; modeTimer = 0; modeIndex = 0; fruit = null; particles.length = 0;
    updateHUD();
  }

  function handleDotPowerCollisions() {
    const tile = MazeConfig.tileFromPosition(pacman.x, pacman.y);
    if (tile.col < 0 || tile.col >= MazeConfig.COLS || tile.row < 0 || tile.row >= MazeConfig.ROWS) return;
    const val = mazeState.grid[tile.row][tile.col];
    if (val === 2) {
      mazeState.grid[tile.row][tile.col] = 0;
      mazeState.dotsRemaining--;
      addScore(10);
      GameUtils.Sounds.dot();
      spawnParticles(pacman.x, pacman.y, "#ffcc00", 5, 2);
    } else if (val === 3) {
      mazeState.grid[tile.row][tile.col] = 0;
      mazeState.dotsRemaining--;
      addScore(50);
      GameUtils.Sounds.power();
      spawnParticles(pacman.x, pacman.y, "#66ccff", 10, 2.5);
      powerTimer = BASE_POWER_DURATION * Math.max(0.5, 1 - (level - 1) * 0.08);
      ghostStreak = 0;
      GhostsModule.setFrightened(ghosts);
    }
    if (mazeState.dotsRemaining <= 0) nextLevel();
  }

  function maybeSpawnFruit() {
    if (fruit && fruit.active) return;
    const eaten = mazeState.dotsTotal - mazeState.dotsRemaining;
    if (eaten > mazeState.dotsTotal * 0.25 && eaten < mazeState.dotsTotal * 0.7 && Math.random() < 0.002) {
      const tile = { col: Math.floor(MazeConfig.COLS / 2), row: 16 };
      fruit = {
        x: MazeConfig.OFFSET_X + tile.col * TILE_SIZE + TILE_SIZE / 2,
        y: MazeConfig.OFFSET_Y + tile.row * TILE_SIZE + TILE_SIZE / 2,
        active: true,
        timer: 12000,
        score: [100, 300, 700, 1500, 3000, 5000][Math.min(level - 1, 5)]
      };
    }
  }

  function updateFruit(dt) {
    if (!fruit || !fruit.active) return;
    fruit.timer -= dt;
    if (fruit.timer <= 0) { fruit.active = false; return; }
    if (GameUtils.distanceSquared(pacman, fruit) < (TILE_SIZE * 0.7) ** 2) {
      addScore(fruit.score);
      GameUtils.Sounds.fruit();
      spawnParticles(fruit.x, fruit.y, "#ff66aa", 12, 2.5);
      fruit.active = false;
    }
  }

  function drawMaze() {
    ctx.save();
    ctx.translate(MazeConfig.OFFSET_X, MazeConfig.OFFSET_Y);
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, MazeConfig.MAZE_WIDTH, MazeConfig.MAZE_HEIGHT);
    ctx.lineWidth = 3; ctx.lineJoin = "round";

    for (let r = 0; r < MazeConfig.ROWS; r++) {
      for (let c = 0; c < MazeConfig.COLS; c++) {
        const val = mazeState.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        if (val === 1) {
          ctx.strokeStyle = "#1a8cff";
          ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        }
        if (val === 2) {
          ctx.fillStyle = "#ffcc00";
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (val === 3) {
          ctx.fillStyle = "#ffffff";
          const pulse = 4 + Math.sin(performance.now() / 150) * 1.2;
          ctx.beginPath();
          ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function drawFruit() {
    if (!fruit || !fruit.active) return;
    const pulse = 1 + Math.sin(performance.now() / 200) * 0.12;
    ctx.save();
    ctx.translate(fruit.x, fruit.y);
    ctx.scale(pulse, pulse);
    ctx.strokeStyle = "#33aa33"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(0, -12, -4, -14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(0, -12, 4, -14); ctx.stroke();
    ctx.fillStyle = "#ff3366";
    ctx.beginPath(); ctx.arc(-4, -1, 4, 0, Math.PI * 2); ctx.arc(4, -1, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt / 1000;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * (dt / 1000);
      p.y += p.vy * (dt / 1000);
      ctx.globalAlpha = Math.max(0, p.life * 3);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawOverlays() {
    if (powerTimer > 0) {
      const t = performance.now() / 120;
      const alpha = 0.07 + 0.03 * Math.sin(t);
      ctx.fillStyle = `rgba(0, 70, 255, ${alpha})`;
      ctx.fillRect(
        MazeConfig.OFFSET_X - 6,
        MazeConfig.OFFSET_Y - 6,
        MazeConfig.MAZE_WIDTH + 12,
        MazeConfig.MAZE_HEIGHT + 12
      );
    }
  }

  function updateGhostMode(dt) {
    modeTimer += dt;
    const current = MODE_SEQUENCE[modeIndex % MODE_SEQUENCE.length];
    if (modeTimer >= current.duration) {
      modeIndex++;
      modeTimer = 0;
      ghostMode = MODE_SEQUENCE[modeIndex % MODE_SEQUENCE.length].mode;
    }
  }

  function hideAllScreens() {
    startScreen.style.display = "none";
    pauseScreen.style.display = "none";
    gameoverScreen.style.display = "none";
  }

  function startNewGame() {
    score = 0; level = 1; lives = 3; extraLifeGranted = false;
    resetMazeAndEntities();
    hideAllScreens();
    gameState = STATE_PLAYING;
  }

  function restartLevel() {
    resetMazeAndEntities();
    hideAllScreens();
    gameState = STATE_PLAYING;
  }

  function endGame(won) {
    window.parent.postMessage({ type: "PACMAN_GAME_OVER", score, level }, window.location.origin);
    gameState = STATE_GAMEOVER;
    hideAllScreens();
    gameoverTitle.textContent = won ? "You Win!" : "Game Over";
    gameoverText.textContent = `Score: ${score} · Level: ${level}`;
    gameoverScreen.style.display = "flex";
  }

  let lastTime = performance.now();

  function loop(now) {
    const dt = Math.min(now - lastTime, 100);
    lastTime = now;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (gameState === STATE_PLAYING) {
      PacmanModule.updatePacman(pacman, mazeState, input, dt, level);
      handleDotPowerCollisions();
      maybeSpawnFruit();
      updateFruit(dt);

      if (powerTimer > 0) {
        powerTimer -= dt;
        if (powerTimer <= 0) {
          powerTimer = 0;
          ghostStreak = 0;
          GhostsModule.clearFrightened(ghosts);
        }
      }

      updateGhostMode(dt);
      GhostsModule.updateGhosts(ghosts, mazeState, pacman, level, dt, ghostMode);

      const result = GhostsModule.handleGhostCollisions(ghosts, pacman, ghostStreak, loseLife);
      if (result.points > 0) addScore(result.points);
      ghostStreak = result.newStreak;

      drawMaze();
      drawFruit();
      PacmanModule.drawPacman(ctx, pacman);
      GhostsModule.drawGhosts(ctx, ghosts);
      drawOverlays();
      drawParticles(dt);
    } else {
      if (!mazeState) resetMazeAndEntities();
      drawMaze();
      drawFruit();
      PacmanModule.drawPacman(ctx, pacman);
      GhostsModule.drawGhosts(ctx, ghosts);
      drawOverlays();
    }
    requestAnimationFrame(loop);
  }

  // Keyboard controls
  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "Up"].includes(e.key)) input.up = true;
    if (["ArrowDown", "Down"].includes(e.key)) input.down = true;
    if (["ArrowLeft", "Left"].includes(e.key)) input.left = true;
    if (["ArrowRight", "Right"].includes(e.key)) input.right = true;

    if (e.key.toLowerCase() === "p") {
      gameState = gameState === STATE_PLAYING ? STATE_PAUSED : STATE_PLAYING;
      pauseScreen.style.display = gameState === STATE_PAUSED ? "flex" : "none";
    }
    if (e.key.toLowerCase() === "r" && (gameState === STATE_PLAYING || gameState === STATE_PAUSED)) restartLevel();
    if (e.key.toLowerCase() === "f") {
      if (!document.fullscreenElement) canvas.requestFullscreen();
      else document.exitFullscreen();
    }
    if (e.key === "Enter" && gameState === STATE_MENU) {
      GameUtils.initAudio();
      startNewGame();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (["ArrowUp", "Up"].includes(e.key)) input.up = false;
    if (["ArrowDown", "Down"].includes(e.key)) input.down = false;
    if (["ArrowLeft", "Left"].includes(e.key)) input.left = false;
    if (["ArrowRight", "Right"].includes(e.key)) input.right = false;
  });

  startButton.addEventListener("click", () => { GameUtils.initAudio(); startNewGame(); });
  restartButton.addEventListener("click", () => { GameUtils.initAudio(); startNewGame(); });

  resetMazeAndEntities();
  renderLives();
  scoreEl.textContent = score;
  levelEl.textContent = level;
  highScoreEl.textContent = highScore;
  startScreen.style.display = "flex";

  requestAnimationFrame(loop);
})();