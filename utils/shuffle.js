const Match = require("./match");
const Tile = require("./tile");

function shuffleArray(items) {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

function shuffleBoard(board, rows, cols) {
  const cells = Match.activeCells(board);
  const tileIds = shuffleArray(cells.map((cell) => cell.tileId));
  const labels = {};
  cells.forEach((cell) => {
    labels[cell.tileId] = cell.label;
  });

  cells.forEach((cell, index) => {
    const meta = Tile.byId(tileIds[index]);
    cell.tileId = meta.id;
    cell.label = labels[tileIds[index]] || meta.label;
    cell.image = meta.image;
  });

  return Match.findAvailablePair(board, rows, cols);
}

function ensurePlayable(board, rows, cols, maxTimes) {
  let move = Match.findAvailablePair(board, rows, cols);
  let times = 0;
  while (!move && times < (maxTimes || 40)) {
    move = shuffleBoard(board, rows, cols);
    times += 1;
  }
  return move;
}

module.exports = {
  shuffleArray,
  shuffleBoard,
  ensurePlayable
};
