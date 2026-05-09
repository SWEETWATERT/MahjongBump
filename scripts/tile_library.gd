extends RefCounted
class_name MahjongTileLibrary

const TILE_DIR := "res://assets/tiles/"
const COPIES_PER_TILE := 4

const TILE_DEFINITIONS := [
	{"id": "wan1", "type": "wan", "value": 1, "label": "一万"},
	{"id": "wan2", "type": "wan", "value": 2, "label": "二万"},
	{"id": "wan3", "type": "wan", "value": 3, "label": "三万"},
	{"id": "wan4", "type": "wan", "value": 4, "label": "四万"},
	{"id": "wan5", "type": "wan", "value": 5, "label": "五万"},
	{"id": "wan6", "type": "wan", "value": 6, "label": "六万"},
	{"id": "wan7", "type": "wan", "value": 7, "label": "七万"},
	{"id": "wan8", "type": "wan", "value": 8, "label": "八万"},
	{"id": "wan9", "type": "wan", "value": 9, "label": "九万"},
	{"id": "tong1", "type": "tong", "value": 1, "label": "一筒"},
	{"id": "tong2", "type": "tong", "value": 2, "label": "二筒"},
	{"id": "tong3", "type": "tong", "value": 3, "label": "三筒"},
	{"id": "tong4", "type": "tong", "value": 4, "label": "四筒"},
	{"id": "tong5", "type": "tong", "value": 5, "label": "五筒"},
	{"id": "tong6", "type": "tong", "value": 6, "label": "六筒"},
	{"id": "tong7", "type": "tong", "value": 7, "label": "七筒"},
	{"id": "tong8", "type": "tong", "value": 8, "label": "八筒"},
	{"id": "tong9", "type": "tong", "value": 9, "label": "九筒"},
	{"id": "tiao1", "type": "tiao", "value": 1, "label": "幺鸡"},
	{"id": "tiao2", "type": "tiao", "value": 2, "label": "二条"},
	{"id": "tiao3", "type": "tiao", "value": 3, "label": "三条"},
	{"id": "tiao4", "type": "tiao", "value": 4, "label": "四条"},
	{"id": "tiao5", "type": "tiao", "value": 5, "label": "五条"},
	{"id": "tiao6", "type": "tiao", "value": 6, "label": "六条"},
	{"id": "tiao7", "type": "tiao", "value": 7, "label": "七条"},
	{"id": "tiao8", "type": "tiao", "value": 8, "label": "八条"},
	{"id": "tiao9", "type": "tiao", "value": 9, "label": "九条"},
	{"id": "east", "type": "wind", "value": 1, "label": "东"},
	{"id": "south", "type": "wind", "value": 2, "label": "南"},
	{"id": "west", "type": "wind", "value": 3, "label": "西"},
	{"id": "north", "type": "wind", "value": 4, "label": "北"},
	{"id": "red", "type": "dragon", "value": 1, "label": "中"},
	{"id": "green", "type": "dragon", "value": 2, "label": "发"},
	{"id": "white", "type": "dragon", "value": 3, "label": "白"}
]

static func tile_ids() -> Array:
	return TILE_DEFINITIONS.map(func(def: Dictionary): return def["id"])

static func definition_for(tile_id: String) -> Dictionary:
	for def: Dictionary in TILE_DEFINITIONS:
		if def["id"] == tile_id:
			return def.duplicate()
	return {}

static func texture_path(tile_id: String) -> String:
	return "%s%s.png" % [TILE_DIR, tile_id]

static func load_textures() -> Dictionary:
	var textures := {}
	for def: Dictionary in TILE_DEFINITIONS:
		var path := texture_path(def["id"])
		if ResourceLoader.exists(path):
			textures[def["id"]] = load(path)
		else:
			push_warning("Missing mahjong tile texture: %s" % path)
	return textures

static func build_deck() -> Array:
	var deck := []
	for def: Dictionary in TILE_DEFINITIONS:
		for copy_index in range(COPIES_PER_TILE):
			var card: Dictionary = def.duplicate()
			card["tile_id"] = def["id"]
			card["copy_index"] = copy_index
			card["uid"] = "%s_%d" % [def["id"], copy_index]
			card["texture_path"] = texture_path(def["id"])
			deck.append(card)
	return deck

static func shuffle(deck: Array) -> Array:
	var shuffled: Array = deck.duplicate(true)
	shuffled.shuffle()
	return shuffled

static func build_shuffled_deck() -> Array:
	return shuffle(build_deck())

static func deal_hands(deck: Array, dealer_index := 0) -> Dictionary:
	var wall: Array = deck.duplicate(true)
	var hands: Array = [[], [], [], []]
	for player_index in range(4):
		var count := 14 if player_index == dealer_index else 13
		for _i in range(count):
			if wall.is_empty():
				break
			hands[player_index].append(wall.pop_front())
	return {
		"dealer_index": dealer_index,
		"hands": hands,
		"wall": wall
	}
