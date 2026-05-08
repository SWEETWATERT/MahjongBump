const TILE_TYPES = [
  { id: "wan1", text: "1万", suit: "wan", image: "/assets/tiles_ascii/wan1.png" },
  { id: "wan2", text: "2万", suit: "wan", image: "/assets/tiles_ascii/wan2.png" },
  { id: "wan3", text: "3万", suit: "wan", image: "/assets/tiles_ascii/wan3.png" },
  { id: "wan4", text: "4万", suit: "wan", image: "/assets/tiles_ascii/wan4.png" },
  { id: "tiao1", text: "幺鸡", suit: "tiao", image: "/assets/tiles_ascii/tiao1.png" },
  { id: "tiao2", text: "二条", suit: "tiao", image: "/assets/tiles_ascii/tiao2.png" },
  { id: "tiao3", text: "三条", suit: "tiao", image: "/assets/tiles_ascii/tiao3.png" },
  { id: "tong1", text: "一筒", suit: "tong", image: "/assets/tiles_ascii/tong1.png" },
  { id: "tong2", text: "二筒", suit: "tong", image: "/assets/tiles_ascii/tong2.png" },
  { id: "dong", text: "东", suit: "wind", image: "/assets/tiles_ascii/east.png" },
  { id: "nan", text: "南", suit: "wind", image: "/assets/tiles_ascii/south.png" },
  { id: "zhong", text: "中", suit: "dragon", image: "/assets/tiles_ascii/red.png" },
  { id: "fa", text: "发", suit: "dragon", image: "/assets/tiles_ascii/green.png" },
  { id: "bai", text: "白", suit: "dragon", image: "/assets/tiles_ascii/white.png" }
];

const LEVELS = [
  {
    rows: 5,
    cols: 5,
    pairs: ["wan1", "wan1", "tiao1", "tiao1", "tong1", "tong1", "dong", "dong"]
  },
  {
    rows: 6,
    cols: 5,
    pairs: [
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
      "zhong",
      "zhong",
      "fa",
      "fa"
    ]
  },
  {
    rows: 6,
    cols: 6,
    pairs: [
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
      "dong",
      "dong",
      "nan",
      "nan",
      "bai",
      "bai"
    ]
  }
];

function shuffle(items) {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function tileById(id) {
  return TILE_TYPES.find((tile) => tile.id === id);
}

function makeCell(row, col, tileId, index) {
  if (!tileId) {
    return {
      key: `${row}-${col}`,
      row,
      col,
      empty: true
    };
  }

  const tile = tileById(tileId);
  return {
    key: `${row}-${col}`,
    row,
    col,
    id: `${tileId}-${index}`,
    tileId,
    text: tile.text,
    suit: tile.suit,
    image: tile.image,
    empty: false,
    selected: false,
    hint: false
  };
}

function buildBoard(levelIndex) {
  const level = LEVELS[levelIndex % LEVELS.length];
  return placeTilePairs(level.rows, level.cols, level.pairs);
}

function makeEmptyBoard(rows, cols) {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return makeCell(row, col, null, index);
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

function placeTilePairs(rows, cols, tileIds) {
  const board = makeEmptyBoard(rows, cols);
  const pairs = makePairs(tileIds);

  shuffle(pairs).forEach((pair, pairIndex) => {
    const empties = shuffle(board.filter((cell) => cell.empty));
    let placed = false;

    for (let i = 0; i < empties.length && !placed; i += 1) {
      const first = empties[i];
      const secondKey = adjacentEmptyKeys(board, first, rows, cols)[0];
      if (!secondKey) {
        continue;
      }
      const firstIndex = board.findIndex((cell) => cell.key === first.key);
      const secondIndex = board.findIndex((cell) => cell.key === secondKey);
      board[firstIndex] = makeCell(first.row, first.col, pair[0], pairIndex * 2);
      board[secondIndex] = makeCell(board[secondIndex].row, board[secondIndex].col, pair[1], pairIndex * 2 + 1);
      placed = true;
    }
  });

  return board;
}

function makePairs(tileIds) {
  const buckets = {};
  tileIds.forEach((tileId) => {
    if (!buckets[tileId]) {
      buckets[tileId] = [];
    }
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

function createGame(level = 1) {
  const levelIndex = level - 1;
  const config = LEVELS[levelIndex % LEVELS.length];
  return {
    level,
    rows: config.rows,
    cols: config.cols,
    board: buildBoard(levelIndex),
    selectedKey: "",
    score: 0,
    coins: Math.max(0, level - 1) * 12,
    steps: 0,
    combo: 0,
    status: "playing",
    toast: "点击相同麻将，同行或同列无遮挡即可消除"
  };
}

function cloneGame(game) {
  return {
    ...game,
    board: game.board.map((cell) => ({ ...cell }))
  };
}

function sameTile(a, b) {
  return a && b && !a.empty && !b.empty && a.tileId === b.tileId && a.key !== b.key;
}

function areAdjacent(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function isClearLine(board, a, b) {
  if (a.row !== b.row && a.col !== b.col) {
    return false;
  }

  if (a.row === b.row) {
    const min = Math.min(a.col, b.col);
    const max = Math.max(a.col, b.col);
    return board.every((cell) => {
      if (cell.row !== a.row || cell.col <= min || cell.col >= max) {
        return true;
      }
      return cell.empty;
    });
  }

  const min = Math.min(a.row, b.row);
  const max = Math.max(a.row, b.row);
  return board.every((cell) => {
    if (cell.col !== a.col || cell.row <= min || cell.row >= max) {
      return true;
    }
    return cell.empty;
  });
}

function canPair(board, a, b) {
  return sameTile(a, b) && (areAdjacent(a, b) || isClearLine(board, a, b));
}

function clearSelection(board) {
  board.forEach((cell) => {
    cell.selected = false;
    cell.hint = false;
  });
}

function markHints(game, selected) {
  game.board.forEach((cell) => {
    cell.hint = canPair(game.board, selected, cell);
  });
}

function remainingTiles(board) {
  return board.filter((cell) => !cell.empty).length;
}

function hasMove(game) {
  const tiles = game.board.filter((cell) => !cell.empty);
  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      if (canPair(game.board, tiles[i], tiles[j])) {
        return true;
      }
    }
  }
  return false;
}

function removePair(game, a, b) {
  const next = cloneGame(game);
  next.board = next.board.map((cell) => {
    if (cell.key === a.key || cell.key === b.key) {
      return {
        key: cell.key,
        row: cell.row,
        col: cell.col,
        empty: true,
        selected: false,
        hint: false
      };
    }
    return {
      ...cell,
      selected: false,
      hint: false
    };
  });
  next.selectedKey = "";
  next.steps += 1;
  next.combo += 1;
  next.score += 10 + Math.max(0, next.combo - 1) * 2;
  next.coins += 2;

  const left = remainingTiles(next.board);
  if (left === 0) {
    next.status = "win";
    next.coins += 20;
    next.toast = `过关！奖励金币 +20`;
  } else if (!hasMove(next)) {
    next.status = "blocked";
    next.toast = "没有可消除的牌了，洗牌再试";
  } else {
    next.toast = `${a.text} 消除成功，连击 ${next.combo}`;
  }

  return next;
}

function selectCell(game, key) {
  const next = cloneGame(game);
  if (next.status !== "playing") {
    return next;
  }

  const tapped = next.board.find((cell) => cell.key === key);
  if (!tapped || tapped.empty) {
    return next;
  }

  const selected = next.board.find((cell) => cell.key === next.selectedKey);
  if (!selected) {
    clearSelection(next.board);
    tapped.selected = true;
    next.selectedKey = tapped.key;
    next.combo = 0;
    markHints(next, tapped);
    next.toast = `已选中 ${tapped.text}`;
    return next;
  }

  if (selected.key === tapped.key) {
    clearSelection(next.board);
    next.selectedKey = "";
    next.toast = "已取消选择";
    return next;
  }

  if (canPair(next.board, selected, tapped)) {
    return removePair(next, selected, tapped);
  }

  clearSelection(next.board);
  tapped.selected = true;
  next.selectedKey = tapped.key;
  next.combo = 0;
  markHints(next, tapped);
  next.toast = "这两张还连不上，换一张试试";
  return next;
}

function shuffleBoard(game) {
  const next = cloneGame(game);
  const remaining = [];
  next.board
    .filter((cell) => !cell.empty)
    .forEach((cell) => {
      remaining.push(cell.tileId);
    });

  next.board = placeTilePairs(next.rows, next.cols, remaining);
  next.selectedKey = "";
  next.combo = 0;
  next.status = "playing";
  next.toast = "已重新洗牌";
  return next;
}

function nextLevel(game) {
  return createGame(game.level + 1);
}

module.exports = {
  createGame,
  hasMove,
  nextLevel,
  selectCell,
  shuffleBoard
};
