// maze.js
// Maze config, layout, and tile/collision helpers.

window.MazeConfig = (function () {
  const TILE_SIZE = 20;
  const COLS = 19;
  const ROWS = 23;

  // Offset inside the canvas where the maze is drawn.
  const OFFSET_X = 40;
  const OFFSET_Y = 80;

  const MAZE_WIDTH = COLS * TILE_SIZE;
  const MAZE_HEIGHT = ROWS * TILE_SIZE;

  const CANVAS_WIDTH = MAZE_WIDTH + OFFSET_X * 2;
  const CANVAS_HEIGHT = MAZE_HEIGHT + OFFSET_Y * 2;

  // Tile encoding:
  // 0 = empty
  // 1 = wall
  // 2 = dot
  // 3 = power pellet
  // 4 = Pac-Man start
  // 5 = ghost start / ghost house floor

  const BASE_MAZE = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 2, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 3, 2, 2, 3, 1],
    [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 5, 5, 5, 1, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 2, 1, 2, 1, 5, 5, 5, 1, 2, 1, 2, 1, 1, 1, 1],
    [0, 0, 0, 1, 2, 1, 2, 1, 5, 5, 5, 1, 2, 1, 2, 1, 0, 0, 0],
    [1, 1, 1, 1, 2, 1, 2, 1, 5, 5, 5, 1, 2, 1, 2, 1, 1, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 1, 1, 1, 5, 1, 1, 1, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 1, 2, 2, 2, 2, 2, 5, 2, 2, 2, 2, 2, 1, 2, 2, 1],
    [1, 1, 2, 1, 2, 1, 2, 1, 2, 5, 2, 1, 2, 1, 2, 1, 2, 1, 1],
    [0, 2, 2, 2, 2, 1, 2, 2, 2, 5, 2, 2, 2, 1, 2, 2, 2, 2, 0],
    [1, 2, 1, 1, 2, 1, 2, 1, 2, 5, 2, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 2, 2, 1, 2, 2, 2, 1, 2, 5, 2, 1, 2, 2, 2, 1, 2, 2, 1],
    [1, 1, 2, 1, 2, 1, 2, 1, 2, 5, 2, 1, 2, 1, 2, 1, 2, 1, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 5, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1],
    [1, 3, 2, 1, 2, 2, 2, 1, 2, 4, 2, 1, 2, 2, 2, 1, 2, 3, 1],
    [1, 2, 2, 2, 2, 1, 2, 2, 2, 0, 2, 2, 2, 1, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  ];

  // Rows that behave as tunnels (horizontal wrap).
  const TUNNEL_ROWS = new Set([8, 14]);

  function cloneGridAndLocateSpecials() {
    const grid = [];
    let pacmanStart = null;
    const ghostStarts = [];
    let dots = 0;

    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        let val = BASE_MAZE[r][c];
        if (val === 4) {
          pacmanStart = { col: c, row: r };
          val = 0;
        } else if (val === 5) {
          ghostStarts.push({ col: c, row: r });
          val = 0;
        }
        if (val === 2 || val === 3) dots++;
        row.push(val);
      }
      grid.push(row);
    }

    return { grid, pacmanStart, ghostStarts, dots };
  }

  function createMazeState() {
    const { grid, pacmanStart, ghostStarts, dots } =
      cloneGridAndLocateSpecials();
    return {
      grid,
      pacmanStart,
      ghostStarts,
      dotsTotal: dots,
      dotsRemaining: dots
    };
  }

  function tileFromPosition(x, y) {
    const col = Math.floor((x - OFFSET_X) / TILE_SIZE);
    const row = Math.floor((y - OFFSET_Y) / TILE_SIZE);
    return { col, row };
  }

  function isInside(col, row) {
    return col >= 0 && col < COLS && row >= 0 && row < ROWS;
  }

  function isWall(col, row, mazeState) {
    if (!isInside(col, row)) return true;
    return mazeState.grid[row][col] === 1;
  }

  function isTunnelRow(row) {
    return TUNNEL_ROWS.has(row);
  }

  function wrapEntityIfTunnel(entity) {
    const tile = tileFromPosition(entity.x, entity.y);
    if (!isTunnelRow(tile.row)) return;

    const minX = OFFSET_X;
    const maxX = OFFSET_X + MAZE_WIDTH;
    const margin = TILE_SIZE / 2;
    if (entity.x < minX - margin) {
      entity.x = maxX + margin;
    } else if (entity.x > maxX + margin) {
      entity.x = minX - margin;
    }
  }

  return {
    TILE_SIZE,
    COLS,
    ROWS,
    OFFSET_X,
    OFFSET_Y,
    MAZE_WIDTH,
    MAZE_HEIGHT,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    BASE_MAZE,
    createMazeState,
    tileFromPosition,
    isWall,
    isTunnelRow,
    wrapEntityIfTunnel
  };
})();

