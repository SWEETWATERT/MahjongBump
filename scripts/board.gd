extends Node2D
class_name MahjongBoard

signal tile_pressed(tile)

const Match = preload("res://scripts/match.gd")
const TileLibrary = preload("res://scripts/tile_library.gd")

@export var tile_scene: PackedScene

var rows := 0
var cols := 0
var board: Array = []
var tile_pool: Array = []
var textures := {}
var full_deck: Array = []
var wall: Array = []
var player_hands: Array = []
var dealer_index := 0

func _ready() -> void:
	_load_textures()
	reset_deck()

func setup_level(config: Dictionary) -> void:
	rows = config.get("rows", 5)
	cols = config.get("cols", 6)
	reset_deck()
	deal_four_players(config.get("dealer_index", 0))
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

func reset_deck() -> void:
	full_deck = TileLibrary.build_shuffled_deck()
	wall = full_deck.duplicate(true)
	player_hands = []

func shuffle(deck := []) -> Array:
	return TileLibrary.shuffle(full_deck if deck.is_empty() else deck)

func deal_four_players(next_dealer_index := 0) -> Dictionary:
	dealer_index = clampi(next_dealer_index, 0, 3)
	var deal := TileLibrary.deal_hands(TileLibrary.build_shuffled_deck(), dealer_index)
	player_hands = deal.hands
	wall = deal.wall
	return deal

func draw_tile(player_index: int) -> Dictionary:
	if wall.is_empty() or player_index < 0 or player_index >= player_hands.size():
		return {}
	var card: Dictionary = wall.pop_front()
	player_hands[player_index].append(card)
	return card

func discard_tile(player_index: int, hand_index: int) -> Dictionary:
	if player_index < 0 or player_index >= player_hands.size():
		return {}
	var hand: Array = player_hands[player_index]
	if hand_index < 0 or hand_index >= hand.size():
		return {}
	return hand.pop_at(hand_index)

func animate_draw_tile(tile: MahjongTile, from_pos: Vector2, to_pos: Vector2) -> Tween:
	tile.position = from_pos
	return tile.play_draw(to_pos)

func animate_discard_tile(tile: MahjongTile, to_pos: Vector2) -> Tween:
	return tile.play_discard(to_pos)

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
	var tile_ids := TileLibrary.tile_ids()
	for i in range(pair_count):
		var tile_id: String = tile_ids[i % min(type_count, tile_ids.size())]
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
	textures = TileLibrary.load_textures()
