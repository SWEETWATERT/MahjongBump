extends Node

const START_TIME := 60
const COMBO_WINDOW := 2.0
const TILE_SIZE := Vector2(78, 98)
const TILE_GAP := Vector2(10, 10)
const UI_FONT_PATH := "res://assets/fonts/mahjong_cjk_subset.ttf"

const LEVELS := [
	{
		"index": 1,
		"rows": 5,
		"cols": 6,
		"types": 10,
		"time": 60
	},
	{
		"index": 2,
		"rows": 6,
		"cols": 6,
		"types": 12,
		"time": 60
	},
	{
		"index": 3,
		"rows": 7,
		"cols": 6,
		"types": 16,
		"time": 60
	}
]

var current_level := 1
var _ui_font: FontFile

func ui_font() -> Font:
	if _ui_font == null:
		_ui_font = load(UI_FONT_PATH)
		if _ui_font == null:
			push_warning("Failed to load UI font: %s" % UI_FONT_PATH)
	return _ui_font

func get_level_config(level: int) -> Dictionary:
	var safe_index := clampi(level - 1, 0, LEVELS.size() - 1)
	return LEVELS[safe_index]

func request_rewarded_ad(reason: String) -> bool:
	# WeChat小游戏导出后在这里接激励视频。
	# reason: "hint" / "shuffle" / "revive"
	print("Rewarded ad placeholder:", reason)
	return true
