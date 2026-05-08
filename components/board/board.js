const Shuffle = require("../../utils/shuffle");

const TILE_LIBRARY = [
  { id: "wan1", label: "1万", image: "/assets/tiles/wan1.png" },
  { id: "wan2", label: "2万", image: "/assets/tiles/wan2.png" },
  { id: "wan3", label: "3万", image: "/assets/tiles/wan3.png" },
  { id: "wan4", label: "4万", image: "/assets/tiles/wan4.png" },
  { id: "wan5", label: "5万", image: "/assets/tiles/wan5.png" },
  { id: "tiao1", label: "幺鸡", image: "/assets/tiles/tiao1.png" },
  { id: "tiao2", label: "二条", image: "/assets/tiles/tiao2.png" },
  { id: "tiao3", label: "三条", image: "/assets/tiles/tiao3.png" },
  { id: "tong1", label: "一筒", image: "/assets/tiles/tong1.png" },
  { id: "tong2", label: "二筒", image: "/assets/tiles/tong2.png" },
  { id: "east", label: "东", image: "/assets/tiles/east.png" },
  { id: "south", label: "南", image: "/assets/tiles/south.png" },
  { id: "red", label: "中", image: "/assets/tiles/red.png" },
  { id: "green", label: "发", image: "/assets/tiles/green.png" },
  { id: "white", label: "白", image: "/assets/tiles/white.png" }
];

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function createMetrics(screenWidth, rows, cols) {
  const width = Math.min(screenWidth - 24, 420);
  const padding = 12;
  const gap = 6;
  const tileWidth = Math.floor((width - padding * 2 - gap * (cols - 1)) / cols);
  const tileHeight = Math.floor(tileWidth * 1.22);
  const height = padding * 2 + rows * tileHeight + (rows - 1) * gap;

  return {
    width,
    height,
    rows,
    cols,
    padding,
    gap,
    tileWidth,
    tileHeight
  };
}

function createBoard(rows, cols) {
  const pairCount = Math.floor((rows * cols) / 2);
  const pool = [];
  for (let i = 0; i < pairCount; i += 1) {
    const tile = TILE_LIBRARY[i % TILE_LIBRARY.length];
    pool.push(tile, tile);
  }

  const tiles = Shuffle.shuffleArray(pool);
  let index = 0;
  const board = [];

  for (let row = 0; row < rows; row += 1) {
    const line = [];
    for (let col = 0; col < cols; col += 1) {
      const tile = tiles[index];
      line.push({
        id: `${row}-${col}`,
        row,
        col,
        tileId: tile.id,
        label: tile.label,
        image: tile.image,
        removed: false
      });
      index += 1;
    }
    board.push(line);
  }

  Shuffle.ensurePlayable(board, rows, cols, 60);
  return board;
}

function getCellRect(metrics, row, col, scale) {
  const normalX = metrics.padding + col * (metrics.tileWidth + metrics.gap);
  const normalY = metrics.padding + row * (metrics.tileHeight + metrics.gap);
  const width = metrics.tileWidth * (scale || 1);
  const height = metrics.tileHeight * (scale || 1);
  return {
    x: normalX - (width - metrics.tileWidth) / 2,
    y: normalY - (height - metrics.tileHeight) / 2,
    width,
    height,
    centerX: normalX + metrics.tileWidth / 2,
    centerY: normalY + metrics.tileHeight / 2
  };
}

function tileAtPoint(board, metrics, x, y) {
  for (let row = 0; row < metrics.rows; row += 1) {
    for (let col = 0; col < metrics.cols; col += 1) {
      const cell = board[row][col];
      if (!cell || cell.removed) {
        continue;
      }
      const rect = getCellRect(metrics, row, col, 1);
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return cell;
      }
    }
  }
  return null;
}

function drawTile(ctx, cell, metrics, options) {
  const selected = options.selected && options.selected.id === cell.id;
  const hinted = options.hintIds && options.hintIds.indexOf(cell.id) !== -1;
  const scale = selected ? 1.08 : 1;
  const rect = getCellRect(metrics, cell.row, cell.col, scale);
  const radius = 9;

  if (hinted || selected) {
    ctx.setShadow(0, 0, 18, hinted ? "rgba(255, 244, 130, 0.95)" : "rgba(255, 255, 255, 0.95)");
  } else {
    ctx.setShadow(0, 5, 9, "rgba(0, 0, 0, 0.22)");
  }

  roundRect(ctx, rect.x, rect.y, rect.width, rect.height, radius);
  ctx.setFillStyle("#fffdf3");
  ctx.fill();
  ctx.setShadow(0, 0, 0, "transparent");

  roundRect(ctx, rect.x + 3, rect.y + 3, rect.width - 6, rect.height - 8, radius - 3);
  ctx.setFillStyle("#ffffff");
  ctx.fill();

  ctx.setStrokeStyle(selected ? "#fff176" : hinted ? "#ffe260" : "#e7dbc3");
  ctx.setLineWidth(selected || hinted ? 4 : 2);
  roundRect(ctx, rect.x + 2, rect.y + 2, rect.width - 4, rect.height - 6, radius - 2);
  ctx.stroke();

  const imagePadding = 7;
  ctx.drawImage(
    cell.image,
    rect.x + imagePadding,
    rect.y + imagePadding,
    rect.width - imagePadding * 2,
    rect.height - imagePadding * 2 - 2
  );

  const textColor = cell.tileId.indexOf("tiao") === 0 || cell.tileId === "green" ? "#138b45" :
    cell.tileId.indexOf("tong") === 0 || cell.tileId === "red" ? "#c92d28" :
      "#222222";
  ctx.setShadow(0, 1, 0, "rgba(255, 255, 255, 0.9)");
  ctx.setFillStyle(textColor);
  ctx.setFontSize(Math.max(18, Math.floor(rect.width * 0.34)));
  ctx.setTextAlign("center");
  ctx.setTextBaseline("middle");
  ctx.fillText(cell.label, rect.centerX, rect.centerY);
  ctx.setShadow(0, 0, 0, "transparent");
}

function pointForPath(metrics, point) {
  const x = metrics.padding + point.col * (metrics.tileWidth + metrics.gap) + metrics.tileWidth / 2;
  const y = metrics.padding + point.row * (metrics.tileHeight + metrics.gap) + metrics.tileHeight / 2;
  return { x, y };
}

function drawLine(ctx, metrics, path) {
  if (!path || path.length < 2) {
    return;
  }

  ctx.setLineCap("round");
  ctx.setLineJoin("round");
  ctx.setShadow(0, 0, 12, "rgba(255, 255, 255, 0.95)");
  ctx.setStrokeStyle("rgba(255, 255, 255, 0.96)");
  ctx.setLineWidth(6);
  ctx.beginPath();
  path.forEach((point, index) => {
    const pixel = pointForPath(metrics, point);
    if (index === 0) {
      ctx.moveTo(pixel.x, pixel.y);
    } else {
      ctx.lineTo(pixel.x, pixel.y);
    }
  });
  ctx.stroke();
  ctx.setShadow(0, 0, 0, "transparent");
}

function drawParticles(ctx, metrics, particles) {
  if (!particles || !particles.length) {
    return;
  }

  particles.forEach((particle) => {
    const rect = getCellRect(metrics, particle.row, particle.col, 1);
    ctx.setGlobalAlpha(particle.alpha);
    ctx.setFillStyle(particle.color);
    ctx.beginPath();
    ctx.arc(rect.centerX + particle.x, rect.centerY + particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.setGlobalAlpha(1);
}

function drawBoard(ctx, board, metrics, options) {
  ctx.clearRect(0, 0, metrics.width, metrics.height);

  ctx.setFillStyle(options.errorFlash ? "rgba(255, 76, 76, 0.35)" : "rgba(5, 86, 49, 0.28)");
  roundRect(ctx, 0, 0, metrics.width, metrics.height, 18);
  ctx.fill();

  for (let row = 0; row < metrics.rows; row += 1) {
    for (let col = 0; col < metrics.cols; col += 1) {
      const cell = board[row][col];
      if (cell && !cell.removed) {
        drawTile(ctx, cell, metrics, options || {});
      }
    }
  }

  drawLine(ctx, metrics, options.linePath);
  drawParticles(ctx, metrics, options.particles);
  ctx.draw();
}

module.exports = {
  TILE_LIBRARY,
  createMetrics,
  createBoard,
  drawBoard,
  tileAtPoint
};
