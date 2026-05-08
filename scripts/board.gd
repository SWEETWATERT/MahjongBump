extends Node2D
class_name MahjongBoard

signal tile_pressed(tile)

const Match = preload("res://scripts/match.gd")

@export var tile_scene: PackedScene

const TILE_IDS := [
	"wan1", "wan2", "wan3", "wan4", "wan5",
	"tiao1", "tiao2", "tiao3",
	"tong1", "tong2",
	"east", "south", "west", "north", "red", "green", "white"
]

var rows := 0
var cols := 0
var board: Array = []
var tile_pool: Array = []
var textures := {}

func _ready() -> void:
	_load_textures()

func setup_level(config: Dictionary) -> void:
	rows = config.get("rows", 5)
	cols = config.get("cols", 6)
	_build_board(config.get("types", 10))

func active_tiles() -> Array:
	return Match.active_tiles(board)

func shuffle_remaining() -> void:
	var active := active_tiles()
	var ids := []
	for tile in active:
		ids.append(tile.tile_id)
	ids.shuffle()
	for i in active.size():
		active[i].setup(ids[i], active[i].grid_pos, textures.get(ids[i]))

func ensure_playable() -> void:
	var tries := 0
	while Match.find_available_pair(board, rows, cols).is_empty() and tries < 40:
		shuffle_remaining()
		tries += 1

func hint_pair() -> Dictionary:
	return Match.find_available_pair(board, rows, cols)

func grid_to_world(pos: Vector2i) -> Vector2:
	var total := Vector2(
		cols * Global.TILE_SIZE.x + (cols - 1) * Global.TILE_GAP.x,
		rows * Global.TILE_SIZE.y + (rows - 1) * Global.TILE_GAP.y
	)
	var start := -total * 0.5 + Global.TILE_SIZE * 0.5
	return start + Vector2(pos.x * (Global.TILE_SIZE.x + Global.TILE_GAP.x), pos.y * (Global.TILE_SIZE.y + Global.TILE_GAP.y))

func path_to_world(path: Array) -> PackedVector2Array:
	var result := PackedVector2Array()
	for point in path:
		result.append(to_global(grid_to_world(point)))
	return result

func _build_board(type_count: int) -> void:
	_clear_tiles()
	board.clear()
	var pair_count := int(rows * cols / 2)
	var ids := []
	for i in range(pair_count):
		var tile_id: String = TILE_IDS[i % min(type_count, TILE_IDS.size())]
		ids.append(tile_id)
		ids.append(tile_id)
	ids.shuffle()

	var index := 0
	for y in range(rows):
		var line := []
		for x in range(cols):
			var tile = _get_tile()
			var id: String = ids[index]
			tile.position = grid_to_world(Vector2i(x, y))
			tile.setup(id, Vector2i(x, y), textures.get(id))
			line.append(tile)
			index += 1
		board.append(line)
	ensure_playable()

func _get_tile():
	for tile in tile_pool:
		if not tile.visible:
			tile.recycle()
			return tile
	var tile = tile_scene.instantiate()
	add_child(tile)
	tile.tile_pressed.connect(func(pressed_tile) -> void:
		tile_pressed.emit(pressed_tile)
	)
	tile_pool.append(tile)
	return tile

func _clear_tiles() -> void:
	for tile in tile_pool:
		tile.visible = false
		tile.removed = true

func _load_textures() -> void:
	for id in TILE_IDS:
		var path := "res://assets/tiles/%s.png" % id
		if ResourceLoader.exists(path):
			textures[id] = load(path)
