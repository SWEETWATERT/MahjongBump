import { createBoardState } from "./game/board.js";
import { createUI } from "./game/ui.js";
import { playMatchEffect, playSelectEffect, playShuffleEffect } from "./game/effects.js";
import { canMatch, findAvailableMove } from "./game/match.js";

const state = {
  level: 1,
  score: 0,
  coins: 0,
  steps: 0,
  combo: 0,
  status: "playing",
  selectedKey: "",
  message: "点击相同麻将，同行或同列无遮挡即可消除",
  board: []
};

const ui = createUI({
  onTilePress: handleTilePress,
  onShuffle: shuffleLevel,
  onRestart: restartLevel,
  onNext: nextLevel
});

startLevel(1);

function startLevel(level) {
  const boardState = createBoardState(level);
  state.level = level;
  state.score = 0;
  state.steps = 0;
  state.combo = 0;
  state.status = "playing";
  state.selectedKey = "";
  state.message = "点击相同麻将，同行或同列无遮挡即可消除";
  state.board = boardState.cells;
  render();
}

function handleTilePress(key) {
  if (state.status !== "playing") return;

  const tile = state.board.find((cell) => cell.key === key);
  if (!tile || tile.empty) return;

  const selected = state.board.find((cell) => cell.key === state.selectedKey);
  if (!selected) {
    selectOnly(tile, `已选中 ${tile.name}`);
    playSelectEffect(tile.key);
    return;
  }

  if (selected.key === tile.key) {
    clearSelection();
    state.message = "已取消选择";
    render();
    return;
  }

  if (canMatch(state.board, selected, tile)) {
    removePair(selected, tile);
    return;
  }

  selectOnly(tile, "这两张还连不上，换一张试试");
  playSelectEffect(tile.key);
}

function selectOnly(tile, message) {
  clearSelection();
  tile.selected = true;
  state.selectedKey = tile.key;
  state.combo = 0;
  state.message = message;
  markHints(tile);
  render();
}

function clearSelection() {
  state.board.forEach((cell) => {
    cell.selected = false;
    cell.hint = false;
  });
  state.selectedKey = "";
}

function markHints(selected) {
  state.board.forEach((cell) => {
    cell.hint = canMatch(state.board, selected, cell);
  });
}

function removePair(a, b) {
  state.board.forEach((cell) => {
    if (cell.key === a.key || cell.key === b.key) {
      cell.empty = true;
      cell.selected = false;
      cell.hint = false;
    }
  });

  state.selectedKey = "";
  state.steps += 1;
  state.combo += 1;
  state.score += 10 + Math.max(0, state.combo - 1) * 2;
  state.coins += 2;
  state.message = `${a.name} 消除成功，连击 ${state.combo}`;
  playMatchEffect([a.key, b.key]);

  const remaining = countRemaining();
  if (remaining === 0) {
    state.status = "win";
    state.coins += 20;
    state.message = "过关！奖励金币 +20";
  } else if (!findAvailableMove(state.board)) {
    state.status = "blocked";
    state.message = "没有可消除的牌了，洗牌继续";
  }

  render();
}

function shuffleLevel() {
  const remaining = state.board.filter((cell) => !cell.empty).map((cell) => cell.tileId);
  const next = createBoardState(state.level, remaining);
  state.board = next.cells;
  state.status = "playing";
  state.selectedKey = "";
  state.combo = 0;
  state.message = "已重新洗牌";
  playShuffleEffect();
  render();
}

function restartLevel() {
  startLevel(state.level);
}

function nextLevel() {
  if (state.status === "win") {
    startLevel(state.level + 1);
  }
}

function countRemaining() {
  return state.board.filter((cell) => !cell.empty).length;
}

function render() {
  ui.render({
    ...state,
    remaining: countRemaining(),
    nextEnabled: state.status === "win"
  });
}
