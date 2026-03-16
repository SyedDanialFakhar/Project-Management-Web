// pacman.js
// Pac-Man entity, movement, and drawing.

window.PacmanModule = (function () {
  const TILE_SIZE = MazeConfig.TILE_SIZE;

  function createPacman(mazeState) {
    const start = mazeState.pacmanStart || {
      col: 1,
      row: MazeConfig.ROWS - 3
    };
    const x =
      MazeConfig.OFFSET_X +
      start.col * TILE_SIZE +
      TILE_SIZE / 2;
    const y =
      MazeConfig.OFFSET_Y +
      start.row * TILE_SIZE +
      TILE_SIZE / 2;

    return {
      x,
      y,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      speedBase: 4, // px per frame at 60 FPS
      radius: TILE_SIZE * 0.45,
      mouthAngle: 0.1,
      mouthOpening: true,
      alive: true
    };
  }

  function handleInput(pacman, input) {
    if (input.up) pacman.nextDir = { x: 0, y: -1 };
    else if (input.down) pacman.nextDir = { x: 0, y: 1 };
    else if (input.left) pacman.nextDir = { x: -1, y: 0 };
    else if (input.right) pacman.nextDir = { x: 1, y: 0 };
  }

  function updatePacman(pacman, mazeState, input, dt, level) {
    if (!pacman.alive) return;

    handleInput(pacman, input);

    const frameScale = dt / (1000 / 60);
    const speed =
      pacman.speedBase * (1 + (level - 1) * 0.01) * frameScale;

    const tile = MazeConfig.tileFromPosition(pacman.x, pacman.y);
    const centerX =
      MazeConfig.OFFSET_X +
      tile.col * TILE_SIZE +
      TILE_SIZE / 2;
    const centerY =
      MazeConfig.OFFSET_Y +
      tile.row * TILE_SIZE +
      TILE_SIZE / 2;

    // Turning at center of tile
    if (
      pacman.nextDir &&
      Math.abs(pacman.x - centerX) < 2 &&
      Math.abs(pacman.y - centerY) < 2
    ) {
      const nextCol = tile.col + pacman.nextDir.x;
      const nextRow = tile.row + pacman.nextDir.y;
      if (!MazeConfig.isWall(nextCol, nextRow, mazeState)) {
        pacman.dir = { ...pacman.nextDir };
        pacman.x = centerX;
        pacman.y = centerY;
      }
    }

    const nextCol = tile.col + pacman.dir.x;
    const nextRow = tile.row + pacman.dir.y;
    const blocked = MazeConfig.isWall(nextCol, nextRow, mazeState);

    if (!blocked) {
      pacman.x += pacman.dir.x * speed;
      pacman.y += pacman.dir.y * speed;
    } else {
      pacman.x = centerX;
      pacman.y = centerY;
    }

    MazeConfig.wrapEntityIfTunnel(pacman);

    // Mouth animation (4-ish frame feel with continuous value)
    const maxMouth = Math.PI / 4;
    const minMouth = 0.08;
    const mouthSpeed = 8 * frameScale * 0.05;
    if (pacman.mouthOpening) {
      pacman.mouthAngle += mouthSpeed;
      if (pacman.mouthAngle >= maxMouth) pacman.mouthOpening = false;
    } else {
      pacman.mouthAngle -= mouthSpeed;
      if (pacman.mouthAngle <= minMouth) pacman.mouthOpening = true;
    }
  }

  function drawPacman(ctx, pacman) {
    ctx.save();
    ctx.translate(pacman.x, pacman.y);

    let dirAngle = 0;
    if (pacman.dir.x === 1) dirAngle = 0;
    else if (pacman.dir.x === -1) dirAngle = Math.PI;
    else if (pacman.dir.y === -1) dirAngle = -Math.PI / 2;
    else if (pacman.dir.y === 1) dirAngle = Math.PI / 2;

    ctx.rotate(dirAngle);

    const angle = pacman.mouthAngle;

    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, pacman.radius, angle, Math.PI * 2 - angle, false);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  return {
    createPacman,
    updatePacman,
    drawPacman
  };
})();

