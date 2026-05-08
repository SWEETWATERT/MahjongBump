export function canMatch(board, a, b) {
  return sameTile(a, b) && (areAdjacent(a, b) || hasClearLine(board, a, b));
}

export function findAvailableMove(board) {
  const tiles = board.filter((cell) => !cell.empty);
  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      if (canMatch(board, tiles[i], tiles[j])) {
        return [tiles[i], tiles[j]];
      }
    }
  }
  return null;
}

function sameTile(a, b) {
  return a && b && !a.empty && !b.empty && a.tileId === b.tileId && a.key !== b.key;
}

function areAdjacent(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function hasClearLine(board, a, b) {
  if (a.row !== b.row && a.col !== b.col) {
    return false;
  }

  if (a.row === b.row) {
    const min = Math.min(a.col, b.col);
    const max = Math.max(a.col, b.col);
    return board.every((cell) => {
      if (cell.row !== a.row || cell.col <= min || cell.col >= max) return true;
      return cell.empty;
    });
  }

  const min = Math.min(a.row, b.row);
  const max = Math.max(a.row, b.row);
  return board.every((cell) => {
    if (cell.col !== a.col || cell.row <= min || cell.row >= max) return true;
    return cell.empty;
  });
}
