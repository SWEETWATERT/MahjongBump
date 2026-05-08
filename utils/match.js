function sameTile(a, b) {
  return a && b && !a.removed && !b.removed && a.id !== b.id && a.tileId === b.tileId;
}

function isInside(row, col, rows, cols) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function isBlocked(board, rows, cols, row, col, target) {
  if (!isInside(row, col, rows, cols)) {
    return false;
  }
  if (target && target.row === row && target.col === col) {
    return false;
  }
  const cell = board[row][col];
  return cell && !cell.removed;
}

function compressPath(path) {
  if (path.length <= 2) {
    return path;
  }

  const result = [path[0]];
  for (let i = 1; i < path.length - 1; i += 1) {
    const prev = path[i - 1];
    const current = path[i];
    const next = path[i + 1];
    const straightRow = prev.row === current.row && current.row === next.row;
    const straightCol = prev.col === current.col && current.col === next.col;
    if (!straightRow && !straightCol) {
      result.push(current);
    }
  }
  result.push(path[path.length - 1]);
  return result;
}

function canConnect(board, rows, cols, first, second) {
  if (!sameTile(first, second)) {
    return { ok: false, path: [] };
  }

  const directions = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 }
  ];
  const minRow = -1;
  const maxRow = rows;
  const minCol = -1;
  const maxCol = cols;
  const queue = [];
  const visited = {};

  directions.forEach((direction, index) => {
    const nextRow = first.row + direction.row;
    const nextCol = first.col + direction.col;
    if (nextRow < minRow || nextRow > maxRow || nextCol < minCol || nextCol > maxCol) {
      return;
    }
    if (isBlocked(board, rows, cols, nextRow, nextCol, second)) {
      return;
    }
    queue.push({
      row: nextRow,
      col: nextCol,
      dir: index,
      turns: 0,
      path: [{ row: first.row, col: first.col }, { row: nextRow, col: nextCol }]
    });
    visited[`${nextRow},${nextCol},${index}`] = 0;
  });

  while (queue.length) {
    const state = queue.shift();
    if (state.row === second.row && state.col === second.col) {
      return { ok: true, path: compressPath(state.path) };
    }

    for (let dirIndex = 0; dirIndex < directions.length; dirIndex += 1) {
      const direction = directions[dirIndex];
      const turns = state.turns + (dirIndex === state.dir ? 0 : 1);
      if (turns > 2) {
        continue;
      }

      const nextRow = state.row + direction.row;
      const nextCol = state.col + direction.col;
      if (nextRow < minRow || nextRow > maxRow || nextCol < minCol || nextCol > maxCol) {
        continue;
      }
      if (isBlocked(board, rows, cols, nextRow, nextCol, second)) {
        continue;
      }

      const key = `${nextRow},${nextCol},${dirIndex}`;
      if (visited[key] !== undefined && visited[key] <= turns) {
        continue;
      }

      visited[key] = turns;
      queue.push({
        row: nextRow,
        col: nextCol,
        dir: dirIndex,
        turns,
        path: state.path.concat({ row: nextRow, col: nextCol })
      });
    }
  }

  return { ok: false, path: [] };
}

function activeCells(board) {
  return board.reduce((cells, row) => {
    row.forEach((cell) => {
      if (cell && !cell.removed) {
        cells.push(cell);
      }
    });
    return cells;
  }, []);
}

function findAvailablePair(board, rows, cols) {
  const cells = activeCells(board);
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      if (cells[i].tileId !== cells[j].tileId) {
        continue;
      }
      const result = canConnect(board, rows, cols, cells[i], cells[j]);
      if (result.ok) {
        return { first: cells[i], second: cells[j], path: result.path };
      }
    }
  }
  return null;
}

module.exports = {
  canConnect,
  findAvailablePair,
  activeCells
};
