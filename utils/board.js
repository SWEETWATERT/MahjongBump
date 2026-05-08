const Tile = require("./tile");
const Shuffle = require("./shuffle");
const Match = require("./match");

function createLayout(screenWidth, rows, cols) {
  const width = Math.min(screenWidth - 24, 430);
  const padding = 14;
  const gap = 7;
  const tileWidth = Math.floor((width - padding * 2 - gap * (cols - 1)) / cols);
  const tileHeight = Math.floor(tileWidth * 1.2);
  const height = padding * 2 + rows * tileHeight + (rows - 1) * gap;

  return { width, height, rows, cols, padding, gap, tileWidth, tileHeight };
}

function createBoard(rows, cols) {
  const pairCount = Math.floor((rows * cols) / 2);
  const pool = [];

  for (let i = 0; i < pairCount; i += 1) {
    const tile = Tile.TILE_LIBRARY[i % Tile.TILE_LIBRARY.length];
    pool.push(tile.id, tile.id);
  }

  const ids = Shuffle.shuffleArray(pool);
  const board = [];
  let index = 0;

  for (let row = 0; row < rows; row += 1) {
    const line = [];
    for (let col = 0; col < cols; col += 1) {
      const meta = Tile.byId(ids[index]);
      line.push({
        id: `${row}-${col}`,
        row,
        col,
        tileId: meta.id,
        label: meta.label,
        image: meta.image,
        removed: false,
        removing: false,
        removeProgress: 0
      });
      index += 1;
    }
    board.push(line);
  }

  Shuffle.ensurePlayable(board, rows, cols, 80);
  return board;
}

function activeTiles(board) {
  return Match.activeCells(board);
}

function tileAt(board, layout, x, y) {
  for (let row = 0; row < layout.rows; row += 1) {
    for (let col = 0; col < layout.cols; col += 1) {
      const tile = board[row][col];
      if (!tile || tile.removed || tile.removing) {
        continue;
      }
      const rect = Tile.getRect(layout, tile, 1);
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return tile;
      }
    }
  }
  return null;
}

function drawTable(ctx, layout, errorProgress) {
  ctx.clearRect(0, 0, layout.width, layout.height);
  const table = ctx.createLinearGradient(0, 0, 0, layout.height);
  table.addColorStop(0, "#16885a");
  table.addColorStop(0.55, "#0f6d47");
  table.addColorStop(1, "#084f34");
  Tile.roundedRect(ctx, 0, 0, layout.width, layout.height, 20);
  ctx.fillStyle = table;
  ctx.fill();

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#d8ffd9";
  ctx.lineWidth = 1;
  for (let x = 18; x < layout.width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 8);
    ctx.lineTo(x - 42, layout.height - 8);
    ctx.stroke();
  }
  ctx.restore();

  if (errorProgress > 0) {
    ctx.save();
    ctx.globalAlpha = errorProgress * 0.42;
    Tile.roundedRect(ctx, 0, 0, layout.width, layout.height, 20);
    ctx.fillStyle = "#ff4141";
    ctx.fill();
    ctx.restore();
  }
}

function drawBoard(ctx, board, layout, viewState) {
  drawTable(ctx, layout, viewState.errorProgress || 0);

  board.forEach((row) => {
    row.forEach((tile) => {
      if (!tile || tile.removed) {
        return;
      }
      const isSelected = viewState.selectedId === tile.id;
      const isHinted = viewState.hintIds && viewState.hintIds.indexOf(tile.id) !== -1;
      Tile.drawTile(ctx, tile, layout, {
        selected: isSelected,
        hinted: isHinted,
        image: viewState.images && viewState.images[tile.tileId]
      });
    });
  });
}

module.exports = {
  createLayout,
  createBoard,
  activeTiles,
  tileAt,
  drawBoard
};
