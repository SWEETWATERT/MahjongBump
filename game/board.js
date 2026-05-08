import { makeTileCell } from "./tile.js";

const LEVELS = [
  {
    rows: 5,
    cols: 5,
    tiles: ["wan1", "wan1", "tiao1", "tiao1", "tong1", "tong1", "east", "east"]
  },
  {
    rows: 6,
    cols: 5,
    tiles: [
      "wan1",
      "wan1",
      "wan2",
      "wan2",
      "tiao1",
      "tiao1",
      "tiao2",
      "tiao2",
      "tong1",
      "tong1",
      "red",
      "red",
      "green",
      "green"
    ]
  },
  {
    rows: 6,
    cols: 6,
    tiles: [
      "wan1",
      "wan1",
      "wan2",
      "wan2",
      "wan3",
      "wan3",
      "tiao1",
      "tiao1",
      "tiao2",
      "tiao2",
      "tong1",
      "tong1",
      "tong2",
      "tong2",
      "east",
      "east",
      "south",
      "south",
      "white",
      "white"
    ]
  }
];

export function createBoardState(level, tileIds) {
  const config = LEVELS[(level - 1) % LEVELS.length];
  const cells = placePairs(config.rows, config.cols, tileIds || config.tiles);
  return {
    rows: config.rows,
    cols: config.cols,
    cells
  };
}

function placePairs(rows, cols, tileIds) {
  const board = makeEmptyBoard(rows, cols);
  const pairs = makePairs(tileIds);

  shuffle(pairs).forEach((pair, pairIndex) => {
    const empties = shuffle(board.filter((cell) => cell.empty));
    let placed = false;

    for (let i = 0; i < empties.length && !placed; i += 1) {
      const first = empties[i];
      const secondKey = adjacentEmptyKeys(board, first, rows, cols)[0];
      if (!secondKey) continue;

      const firstIndex = board.findIndex((cell) => cell.key === first.key);
      const secondIndex = board.findIndex((cell) => cell.key === secondKey);

      board[firstIndex] = makeTileCell(first.row, first.col, pair[0], pairIndex * 2);
      board[secondIndex] = makeTileCell(
        board[secondIndex].row,
        board[secondIndex].col,
        pair[1],
        pairIndex * 2 + 1
      );
      placed = true;
    }
  });

  return board;
}

function makeEmptyBoard(rows, cols) {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return makeTileCell(row, col, null, index);
  });
}

function adjacentEmptyKeys(board, cell, rows, cols) {
  const candidates = [
    { row: cell.row - 1, col: cell.col },
    { row: cell.row + 1, col: cell.col },
    { row: cell.row, col: cell.col - 1 },
    { row: cell.row, col: cell.col + 1 }
  ];

  return shuffle(candidates)
    .filter((item) => item.row >= 0 && item.row < rows && item.col >= 0 && item.col < cols)
    .map((item) => `${item.row}-${item.col}`)
    .filter((key) => {
      const match = board.find((cellItem) => cellItem.key === key);
      return match && match.empty;
    });
}

function makePairs(tileIds) {
  const buckets = {};
  tileIds.forEach((tileId) => {
    buckets[tileId] ||= [];
    buckets[tileId].push(tileId);
  });

  const pairs = [];
  Object.keys(buckets).forEach((tileId) => {
    while (buckets[tileId].length >= 2) {
      pairs.push([buckets[tileId].pop(), buckets[tileId].pop()]);
    }
  });
  return pairs;
}

function shuffle(items) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
