extends Area2D
class_name MahjongTile

signal tile_pressed(tile: MahjongTile)

const LABELS := {
	"wan1": "1万", "wan2": "2万", "wan3": "3万", "wan4": "4万", "wan5": "5万",
	"tiao1": "幺鸡", "tiao2": "二条", "tiao3": "三条",
	"tong1": "一筒", "tong2": "二筒",
	"east": "东", "south": "南", "west": "西", "north": "北",
	"red": "中", "green": "发", "white": "白"
}

var tile_id := ""
var grid_pos := Vector2i.ZERO
var removed := false
var selected := false
var _base_position := Vector2.ZERO
var _texture: Texture2D

@onready var shadow: Polygon2D = $Shadow
@onready var body: Polygon2D = $Body
@onready var face: Polygon2D = $Face
@onready var highlight: Polygon2D = $Highlight
@onready var icon: Sprite2D = $Icon
@onready var label: Label = $Label
@onready var glow: Polygon2D = $Glow
@onready var collision: CollisionShape2D = $Collision

func _ready() -> void:
	input_event.connect(_on_input_event)
	_build_shape()
	_base_position = position

func setup(id: String, pos: Vector2i, texture: Texture2D) -> void:
	tile_id = id
	grid_pos = pos
	_texture = texture
	removed = false
	selected = false
	visible = true
	modulate.a = 1.0
	scale = Vector2.ONE
	if is_node_ready():
		apply_data()

func apply_data() -> void:
	label.text = LABELS.get(tile_id, tile_id)
	icon.texture = _texture
	glow.color.a = 0.0
	_base_position = position

func set_selected(value: bool) -> void:
	selected = value
	var target_scale := Vector2(1.1, 1.1) if value else Vector2.ONE
	var target_y := _base_position.y - 10.0 if value else _base_position.y
	var glow_alpha := 0.42 if value else 0.0
	var tween := create_tween().set_parallel(true)
	tween.tween_property(self, "scale", target_scale, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "position:y", target_y, 0.12).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(glow, "color:a", glow_alpha, 0.12)

func play_tap() -> void:
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector2(1.08, 1.08), 0.06).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.10).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

func play_remove() -> void:
	removed = true
	set_selected(false)
	var tween := create_tween().set_parallel(true)
	tween.tween_property(self, "scale", Vector2(0.18, 0.18), 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	tween.tween_property(self, "modulate:a", 0.0, 0.18)
	await tween.finished
	visible = false

func recycle() -> void:
	removed = false
	selected = false
	visible = true
	modulate.a = 1.0
	scale = Vector2.ONE
	position = _base_position
	glow.color.a = 0.0

func _on_input_event(_viewport: Node, event: InputEvent, _shape_idx: int) -> void:
	if removed:
		return
	if event is InputEventScreenTouch and event.pressed:
		tile_pressed.emit(self)
	elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		tile_pressed.emit(self)

func _build_shape() -> void:
	var half := Global.TILE_SIZE * 0.5
	var front := PackedVector2Array([
		Vector2(-half.x, -half.y + 8), Vector2(half.x, -half.y + 8),
		Vector2(half.x, half.y - 5), Vector2(-half.x, half.y - 5)
	])
	var thick := PackedVector2Array([
		Vector2(-half.x, -half.y + 12), Vector2(half.x, -half.y + 12),
		Vector2(half.x, half.y + 7), Vector2(-half.x, half.y + 7)
	])
	body.polygon = thick
	face.polygon = front
	shadow.polygon = thick
	highlight.polygon = PackedVector2Array([
		Vector2(-half.x + 10, -half.y + 14), Vector2(half.x - 10, -half.y + 14),
		Vector2(half.x - 18, -half.y + 36), Vector2(-half.x + 18, -half.y + 36)
	])
	glow.polygon = PackedVector2Array([
		Vector2(-half.x - 6, -half.y + 2), Vector2(half.x + 6, -half.y + 2),
		Vector2(half.x + 6, half.y + 10), Vector2(-half.x - 6, half.y + 10)
	])
	var shape := RectangleShape2D.new()
	shape.size = Global.TILE_SIZE
	collision.shape = shape
