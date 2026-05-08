extends Node2D

const Match = preload("res://scripts/match.gd")

@onready var board = $Board
@onready var ui = $UI
@onready var effects = $Effects
@onready var background: ColorRect = $Background

var level := 1
var score := 0
var time_left := 60
var combo := 0
var last_clear_time := -99.0
var selected
var timer: Timer

func _ready() -> void:
	board.tile_pressed.connect(_on_tile_pressed)
	ui.shuffle_requested.connect(_on_shuffle_requested)
	ui.hint_requested.connect(_on_hint_requested)
	ui.restart_requested.connect(restart_level)
	timer = Timer.new()
	timer.wait_time = 1.0
	timer.timeout.connect(_on_tick)
	add_child(timer)
	start_level(1)

func start_level(next_level: int) -> void:
	level = next_level
	var config := Global.get_level_config(level)
	time_left = config.get("time", Global.START_TIME)
	score = 0
	combo = 0
	selected = null
	board.setup_level(config)
	timer.start()
	_update_ui("第%d关开始" % level)

func restart_level() -> void:
	start_level(level)

func _on_tick() -> void:
	time_left -= 1
	if time_left <= 0:
		timer.stop()
		_update_ui("时间到，可预留复活广告")
		Global.request_rewarded_ad("revive")
	else:
		_update_ui()

func _on_tile_pressed(tile) -> void:
	if time_left <= 0:
		return
	tile.play_tap()
	if selected == null:
		selected = tile
		tile.set_selected(true)
		ui.show_message("再点一张相同麻将")
		return
	if selected == tile:
		selected.set_selected(false)
		selected = null
		ui.show_message("已取消选择")
		return

	var result: Dictionary = Match.can_connect(board.board, board.rows, board.cols, selected, tile)
	if result.get("ok", false):
		_clear_pair(selected, tile, result.get("path", []))
	else:
		_wrong_pick()

func _clear_pair(first, second, path: Array) -> void:
	var now := Time.get_ticks_msec() / 1000.0
	combo = combo + 1 if now - last_clear_time <= Global.COMBO_WINDOW else 1
	last_clear_time = now
	score += 10 * combo
	time_left += 3 if combo >= 2 else 1
	first.set_selected(false)
	second.set_selected(false)
	selected = null
	effects.play_success_line(board.path_to_world(path))
	effects.burst_at(first.global_position)
	effects.burst_at(second.global_position)
	if combo >= 2:
		effects.play_combo(combo, ui.combo_label)
	_clear_tiles_async(first, second)
	_update_ui("连击 +3秒" if combo >= 2 else "消除 +1秒", true)

func _clear_tiles_async(first, second) -> void:
	await first.play_remove()
	await second.play_remove()
	if board.active_tiles().is_empty():
		timer.stop()
		_update_ui("过关！进入下一关", true)
		if level < Global.LEVELS.size():
			await get_tree().create_timer(0.8).timeout
			start_level(level + 1)
		return
	if board.hint_pair().is_empty():
		board.shuffle_remaining()
	_update_ui()

func _wrong_pick() -> void:
	if selected:
		selected.set_selected(false)
	selected = null
	combo = 0
	last_clear_time = -99.0
	effects.play_error_flash(background)
	effects.shake(board)
	_update_ui("这两张连不上，最多2次转折")

func _on_shuffle_requested() -> void:
	if not Global.request_rewarded_ad("shuffle"):
		return
	board.shuffle_remaining()
	board.ensure_playable()
	combo = 0
	_update_ui("已洗牌")

func _on_hint_requested() -> void:
	if not Global.request_rewarded_ad("hint"):
		return
	var hint: Dictionary = board.hint_pair()
	if hint.is_empty():
		board.shuffle_remaining()
		_update_ui("已自动洗牌")
		return
	var first = hint.get("first")
	var second = hint.get("second")
	first.set_selected(true)
	second.set_selected(true)
	effects.play_success_line(board.path_to_world(hint.get("path", [])))
	await get_tree().create_timer(0.8).timeout
	if not first.removed:
		first.set_selected(false)
	if not second.removed:
		second.set_selected(false)

func _update_ui(message := "", success := false) -> void:
	ui.update_hud(score, time_left, combo, board.active_tiles().size())
	if not message.is_empty():
		ui.show_message(message, success)
