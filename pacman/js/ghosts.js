// ghosts.js
window.GhostsModule = (function () {
  const TILE_SIZE = MazeConfig.TILE_SIZE;
  const utils = GameUtils;

  const MODE_CHASE = "chase";
  const MODE_SCATTER = "scatter";

  const COLORS = {
    blinky: "#ff0000",
    pinky: "#ffb8ff",
    inky: "#00ffff",
    clyde: "#ffb851"
  };

  function createGhost(name, type, mazeState, index) {
    const starts = mazeState.ghostStarts;
    const base = starts[index % starts.length] || starts[0] || { col: Math.floor(MazeConfig.COLS / 2), row: 9 };
    const offset = (index - 1.5) * 0.8;
    const col = base.col + offset;
    const row = base.row;
    const x = MazeConfig.OFFSET_X + col * TILE_SIZE + TILE_SIZE / 2;
    const y = MazeConfig.OFFSET_Y + row * TILE_SIZE + TILE_SIZE / 2;

    const corners = [
      { col: MazeConfig.COLS - 2, row: 1 },
      { col: 1, row: 1 },
      { col: MazeConfig.COLS - 2, row: MazeConfig.ROWS - 2 },
      { col: 1, row: MazeConfig.ROWS - 2 }
    ];

    return {
      name, type, color: COLORS[type], x, y,
      dir: { x: 0, y: -1 },
      speedBase: 3.6,
      frightened: false, eaten: false, eyesOnly: false,
      inHouse: true, exitDelay: 800 + index * 700, exitTimer: 0,
      scatterTarget: corners[index % corners.length]
    };
  }

  function createGhosts(mazeState) {
    return [
      createGhost("Blinky", "blinky", mazeState, 0),
      createGhost("Pinky", "pinky", mazeState, 1),
      createGhost("Inky", "inky", mazeState, 2),
      createGhost("Clyde", "clyde", mazeState, 3)
    ];
  }

  function atIntersection(entity) {
    const tile = MazeConfig.tileFromPosition(entity.x, entity.y);
    const centerX = MazeConfig.OFFSET_X + tile.col * TILE_SIZE + TILE_SIZE / 2;
    const centerY = MazeConfig.OFFSET_Y + tile.row * TILE_SIZE + TILE_SIZE / 2;
    return Math.abs(entity.x - centerX) < 1 && Math.abs(entity.y - centerY) < 1;
  }

  function availableDirections(ghost, mazeState, avoidReverse) {
    const tile = MazeConfig.tileFromPosition(ghost.x, ghost.y);
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    const opposite = { x: -ghost.dir.x, y: -ghost.dir.y };
    const out = [];
    for (const d of dirs) {
      if (avoidReverse && d.x === opposite.x && d.y === opposite.y) continue;
      const nc = tile.col + d.x; const nr = tile.row + d.y;
      if (!MazeConfig.isWall(nc, nr, mazeState)) out.push(d);
    }
    return out;
  }

  function ghostTargetTile(ghost, ghosts, pacman, mode) {
    const pTile = MazeConfig.tileFromPosition(pacman.x, pacman.y);
    const pDir = pacman.dir;
    const blinky = ghosts[0];
    const bTile = MazeConfig.tileFromPosition(blinky.x, blinky.y);
    const gTile = MazeConfig.tileFromPosition(ghost.x, ghost.y);

    if (mode === MODE_SCATTER && !ghost.frightened && !ghost.eaten) return ghost.scatterTarget;

    switch (ghost.type) {
      case "blinky": return { col: pTile.col, row: pTile.row };
      case "pinky": return { col: pTile.col + 4 * pDir.x, row: pTile.row + 4 * pDir.y };
      case "inky": {
        const twoAhead = { col: pTile.col + 2 * pDir.x, row: pTile.row + 2 * pDir.y };
        const vec = { col: twoAhead.col - bTile.col, row: twoAhead.row - bTile.row };
        return { col: twoAhead.col + vec.col, row: twoAhead.row + vec.row };
      }
      case "clyde": {
        const dx = pTile.col - gTile.col; const dy = pTile.row - gTile.row;
        const distSq = dx * dx + dy * dy;
        if (distSq > 64) return { col: pTile.col, row: pTile.row };
        return ghost.scatterTarget;
      }
      default: return { col: pTile.col, row: pTile.row };
    }
  }

  function chooseDirection(ghost, ghosts, mazeState, pacman, mode) {
    const tile = MazeConfig.tileFromPosition(ghost.x, ghost.y);
    let dirs = availableDirections(ghost, mazeState, true);
    if (!dirs.length) return;
    const target = ghostTargetTile(ghost, ghosts, pacman, mode);
    let bestDir = dirs[0]; let bestScore = Infinity;
    for (const d of dirs) {
      const nextCol = tile.col + d.x; const nextRow = tile.row + d.y;
      const dx = target.col - nextCol; const dy = target.row - nextRow;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bestScore) { bestScore = distance; bestDir = d; }
    }
    ghost.dir = bestDir;
  }

  function updateGhosts(ghosts, mazeState, pacman, level, dt, mode) {
    const frameScale = dt / (1000 / 60);
    const levelFactor = 1 + (level - 1) * 0.18;
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      if (g.inHouse) {
        g.exitTimer += dt;
        if (g.exitTimer >= g.exitDelay) { g.inHouse = false; g.dir = { x: 0, y: -1 }; } else continue;
      }
      let speed = g.speedBase * levelFactor * frameScale;
      if (g.frightened && !g.eaten) speed *= 0.55;
      if (g.eaten) speed *= 1.4;

      if (atIntersection(g)) chooseDirection(g, ghosts, mazeState, pacman, mode);

      const tile = MazeConfig.tileFromPosition(g.x, g.y);
      const nextCol = tile.col + g.dir.x; const nextRow = tile.row + g.dir.y;
      if (!MazeConfig.isWall(nextCol, nextRow, mazeState)) {
        g.x += g.dir.x * speed; g.y += g.dir.y * speed;
      }
      MazeConfig.wrapEntityIfTunnel(g);

      if (g.eaten) {
        const house = { x: MazeConfig.OFFSET_X + Math.floor(MazeConfig.COLS / 2) * TILE_SIZE + TILE_SIZE / 2, y: MazeConfig.OFFSET_Y + 9 * TILE_SIZE + TILE_SIZE / 2 };
        if (utils.distanceSquared(g, house) < (TILE_SIZE / 2) ** 2) {
          g.eaten = false; g.frightened = false; g.eyesOnly = false; g.inHouse = true; g.exitTimer = 0;
        }
      }
    }
  }

  function setFrightened(ghosts) { for (const g of ghosts) { if (!g.eaten) { g.frightened = true; g.eyesOnly = false; g.dir = { x: -g.dir.x, y: -g.dir.y }; } } }
  function clearFrightened(ghosts) { for (const g of ghosts) { if (!g.eaten) { g.frightened = false; g.eyesOnly = false; } } }

  function drawGhost(ctx, ghost) {
    const TILE = TILE_SIZE;
    ctx.save(); ctx.translate(ghost.x, ghost.y);
    const bodyWidth = TILE * 0.9; const bodyHeight = TILE * 0.9; const radius = bodyWidth / 2;

    if (ghost.eyesOnly) {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath(); ctx.arc(-4, -2, 4, 0, Math.PI * 2); ctx.arc(4, -2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0000aa";
      ctx.beginPath(); ctx.arc(-4, -2, 2, 0, Math.PI * 2); ctx.arc(4, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return;
    }

    const bodyColor = ghost.frightened ? "#0033ff" : ghost.color;
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, radius, Math.PI, 0, false);
    ctx.lineTo(radius, bodyHeight / 2);
    const scallops = 4; const scallopWidth = bodyWidth / scallops;
    for (let i = scallops; i >= 0; i--) {
      const x = -radius + i * scallopWidth;
      const y = bodyHeight / 2;
      ctx.quadraticCurveTo(x + scallopWidth / 2, y + 4, x, y);
    }
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.arc(-4, -3, 4, 0, Math.PI * 2); ctx.arc(4, -3, 4, 0, Math.PI * 2); ctx.fill();

    let eyeDx = ghost.dir.x * 1.5; let eyeDy = ghost.dir.y * 1.5;
    if (ghost.frightened) { eyeDx = 0; eyeDy = -1; }
    ctx.fillStyle = "#0000aa";
    ctx.beginPath(); ctx.arc(-4 + eyeDx, -3 + eyeDy, 2, 0, Math.PI * 2); ctx.arc(4 + eyeDx, -3 + eyeDy, 2, 0, Math.PI * 2); ctx.fill();

    if (ghost.frightened) {
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(-6, 5); ctx.lineTo(-3, 7); ctx.lineTo(0, 5); ctx.lineTo(3, 7); ctx.lineTo(6, 5); ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhosts(ctx, ghosts) { for (const g of ghosts) drawGhost(ctx, g); }

  function handleGhostCollisions(ghosts, pacman, currentGhostStreak, onPacmanDeath) {
    if (!pacman.alive) return { points: 0, newStreak: currentGhostStreak };
    let totalPoints = 0; let newStreak = currentGhostStreak;
    for (const g of ghosts) {
      const d2 = GameUtils.distanceSquared(pacman, g);
      if (d2 > (MazeConfig.TILE_SIZE * 0.6) ** 2) continue;
      if (g.frightened && !g.eaten) {
        g.eaten = true; g.eyesOnly = true; g.frightened = false;
        newStreak++;
        const points = 200 * Math.pow(2, newStreak - 1);
        totalPoints += points;
        GameUtils.Sounds.ghostEaten();
      } else if (!g.eaten) {
        pacman.alive = false;
        GameUtils.Sounds.death();
        if (typeof onPacmanDeath === "function") onPacmanDeath();
        break;
      }
    }
    return { points: totalPoints, newStreak };
  }

  return {
    MODE_CHASE, MODE_SCATTER,
    createGhosts, updateGhosts, drawGhosts,
    setFrightened, clearFrightened, handleGhostCollisions
  };
})();