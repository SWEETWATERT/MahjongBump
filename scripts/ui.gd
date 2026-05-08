extends CanvasLayer
class_name MahjongUI

signal shuffle_requested
signal hint_requested
signal restart_requested

@onready var score_label: Label = $TopPanel/ScoreLabel
@onready var time_label: Label = $TopPanel/TimeLabel
@onready var remain_label: Label = $TopPanel/RemainLabel
@onready var combo_label: Label = $TopPanel/ComboLabel
@onready var message_label: Label = $MessageLabel
@onready var top_panel: Panel = $TopPanel
@onready var shuffle_button: Button = $BottomPanel/ShuffleButton
@onready var hint_button: Button = $BottomPanel/HintButton
@onready var restart_button: Button = $BottomPanel/RestartButton

func _ready() -> void:
	_style_panel()
	shuffle_button.pressed.connect(func() -> void: shuffle_requested.emit())
	hint_button.pressed.connect(func() -> void: hint_requested.emit())
	restart_button.pressed.connect(func() -> void: restart_requested.emit())
	_style_label(score_label)
	_style_label(time_label)
	_style_label(remain_label)
	_style_label(combo_label, Color(1.0, 0.91, 0.20))
	_style_label(message_label)
	_style_button(shuffle_button, Color(1.0, 0.86, 0.28), Color(0.12, 0.35, 0.21))
	_style_button(hint_button, Color(1.0, 0.50, 0.13), Color.WHITE)
	_style_button(restart_button, Color(0.98, 0.94, 0.74), Color(0.12, 0.35, 0.21))
	_bind_button_feedback(shuffle_button)
	_bind_button_feedback(hint_button)
	_bind_button_feedback(restart_button)

func update_hud(score: int, time_left: int, combo: int, remaining: int) -> void:
	score_label.text = "分数 %d" % score
	time_label.text = "时间 %d" % time_left
	remain_label.text = "剩余 %d" % remaining
	combo_label.text = "COMBO x%d" % combo if combo >= 2 else ""
	time_label.modulate = Color(1, 0.35, 0.3) if time_left <= 10 else Color.WHITE

func show_message(text: String, success := false) -> void:
	message_label.text = text
	message_label.modulate = Color(1.0, 0.92, 0.35) if success else Color.WHITE

func _style_button(button: Button, bg: Color, fg: Color) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.border_width_top = 2
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_bottom = 4
	style.border_color = bg.lightened(0.28)
	style.corner_radius_top_left = 18
	style.corner_radius_top_right = 18
	style.corner_radius_bottom_left = 18
	style.corner_radius_bottom_right = 18
	style.shadow_color = Color(0, 0, 0, 0.34)
	style.shadow_size = 12
	style.shadow_offset = Vector2(0, 6)
	var pressed := style.duplicate()
	pressed.bg_color = bg.darkened(0.10)
	pressed.shadow_size = 4
	pressed.shadow_offset = Vector2(0, 2)
	button.add_theme_stylebox_override("normal", style)
	button.add_theme_stylebox_override("hover", style)
	button.add_theme_stylebox_override("pressed", pressed)
	button.add_theme_color_override("font_color", fg)
	button.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.32))
	button.add_theme_constant_override("shadow_offset_x", 2)
	button.add_theme_constant_override("shadow_offset_y", 3)

func _style_panel() -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.02, 0.16, 0.10, 0.72)
	style.corner_radius_top_left = 22
	style.corner_radius_top_right = 22
	style.corner_radius_bottom_left = 22
	style.corner_radius_bottom_right = 22
	style.border_width_bottom = 2
	style.border_color = Color(1, 0.9, 0.45, 0.25)
	style.shadow_color = Color(0, 0, 0, 0.30)
	style.shadow_size = 10
	top_panel.add_theme_stylebox_override("panel", style)

func _style_label(target: Label, color := Color.WHITE) -> void:
	target.add_theme_color_override("font_color", color)
	target.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.48))
	target.add_theme_constant_override("shadow_offset_x", 2)
	target.add_theme_constant_override("shadow_offset_y", 3)

func _bind_button_feedback(button: Button) -> void:
	button.pivot_offset = button.custom_minimum_size * 0.5
	button.button_down.connect(func() -> void:
		_tween_button_scale(button, Vector2(0.94, 0.94))
	)
	button.button_up.connect(func() -> void:
		_tween_button_scale(button, Vector2.ONE)
	)

func _tween_button_scale(button: Button, target: Vector2) -> void:
	var tween := create_tween()
	tween.tween_property(button, "scale", target, 0.08).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
