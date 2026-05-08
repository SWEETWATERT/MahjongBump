extends RefCounted
class_name MahjongMatch

static func can_connect(board: Array, rows: int, cols: int, first, second) -> Dictionary:
	if not _same_tile(first, second):
		return {"ok": false, "path": []}

	var directions := [Vector2i.UP, Vector2i.DOWN, Vector2i.LEFT, Vector2i.RIGHT]
	var queue: Array = []
	var visited := {}

	for dir_index in directions.size():
		var next_pos: Vector2i = first.grid_pos + directions[dir_index]
		if not _in_extended(next_pos, rows, cols):
			continue
		if _blocked(board, rows, cols, next_pos, second):
			continue
		queue.push_back({
			"pos": next_pos,
			"dir": dir_index,
			"turns": 0,
			"path": [first.grid_pos, next_pos]
		})
		visited[_key(next_pos, dir_index)] = 0

	while not queue.is_empty():
		var state: Dictionary = queue.pop_front()
		var state_pos: Vector2i = state.get("pos")
		var state_dir: int = state.get("dir")
		var state_turns: int = state.get("turns")
		var state_path: Array = state.get("path")
		if state_pos == second.grid_pos:
			return {"ok": true, "path": _compress_path(state_path)}

		for dir_index in directions.size():
			var turns: int = state_turns + (0 if dir_index == state_dir else 1)
			if turns > 2:
				continue
			var next_pos: Vector2i = state_pos + directions[dir_index]
			if not _in_extended(next_pos, rows, cols):
				continue
			if _blocked(board, rows, cols, next_pos, second):
				continue
			var key := _key(next_pos, dir_index)
			if visited.has(key) and visited[key] <= turns:
				continue
			visited[key] = turns
			var path: Array = state_path.duplicate()
			path.append(next_pos)
			queue.push_back({
				"pos": next_pos,
				"dir": dir_index,
				"turns": turns,
				"path": path
			})

	return {"ok": false, "path": []}

static func find_available_pair(board: Array, rows: int, cols: int) -> Dictionary:
	var tiles := active_tiles(board)
	for i in tiles.size():
		for j in range(i + 1, tiles.size()):
			if tiles[i].tile_id != tiles[j].tile_id:
				continue
			var result: Dictionary = can_connect(board, rows, cols, tiles[i], tiles[j])
			if result.get("ok", false):
				return {"first": tiles[i], "second": tiles[j], "path": result.get("path", [])}
	return {}

static func active_tiles(board: Array) -> Array:
	var result := []
	for row in board:
		for tile in row:
			if tile != null and not tile.removed:
				result.append(tile)
	return result

static func _same_tile(a, b) -> bool:
	return a != null and b != null and a != b and not a.removed and not b.removed and a.tile_id == b.tile_id

static func _in_extended(pos: Vector2i, rows: int, cols: int) -> bool:
	return pos.x >= -1 and pos.x <= cols and pos.y >= -1 and pos.y <= rows

static func _blocked(board: Array, rows: int, cols: int, pos: Vector2i, target) -> bool:
	if pos.x < 0 or pos.x >= cols or pos.y < 0 or pos.y >= rows:
		return false
	if target != null and target.grid_pos == pos:
		return false
	var tile = board[pos.y][pos.x]
	return tile != null and not tile.removed

static func _compress_path(path: Array) -> Array:
	if path.size() <= 2:
		return path
	var result := [path[0]]
	for i in range(1, path.size() - 1):
		var prev: Vector2i = path[i - 1]
		var current: Vector2i = path[i]
		var next: Vector2i = path[i + 1]
		if not ((prev.x == current.x and current.x == next.x) or (prev.y == current.y and current.y == next.y)):
			result.append(current)
	result.append(path[path.size() - 1])
	return result

static func _key(pos: Vector2i, dir_index: int) -> String:
	return "%s,%s,%s" % [pos.x, pos.y, dir_index]
