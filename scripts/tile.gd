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
	_apply_text_color()
	glow.color.a = 0.0
	_base_position = position

func set_selected(value: bool) -> void:
	selected = value
	var target_scale := Vector2(1.14, 1.14) if value else Vector2.ONE
	var target_y := _base_position.y - 14.0 if value else _base_position.y
	var glow_alpha := 0.72 if value else 0.0
	var tween := create_tween().set_parallel(true)
	tween.tween_property(self, "scale", target_scale, 0.14).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "position:y", target_y, 0.14).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(glow, "color:a", glow_alpha, 0.14)

func play_tap() -> void:
	var target := Vector2(1.14, 1.14) if selected else Vector2.ONE
	var tween := create_tween()
	tween.tween_property(self, "scale", target * 0.94, 0.045).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", target * 1.08, 0.07).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "scale", target, 0.10).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)

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
	var front := _rounded_rect_points(Vector2(-half.x, -half.y + 7), Vector2(Global.TILE_SIZE.x, Global.TILE_SIZE.y - 12), 12.0, 6)
	var thick := _rounded_rect_points(Vector2(-half.x - 2, -half.y + 12), Vector2(Global.TILE_SIZE.x + 4, Global.TILE_SIZE.y - 2), 13.0, 6)
	body.polygon = thick
	face.polygon = front
	shadow.polygon = thick
	highlight.polygon = PackedVector2Array([
		Vector2(-half.x + 10, -half.y + 14), Vector2(half.x - 10, -half.y + 14),
		Vector2(half.x - 18, -half.y + 36), Vector2(-half.x + 18, -half.y + 36)
	])
	glow.polygon = _rounded_rect_points(Vector2(-half.x - 10, -half.y - 2), Vector2(Global.TILE_SIZE.x + 20, Global.TILE_SIZE.y + 16), 18.0, 6)
	var shape := RectangleShape2D.new()
	shape.size = Global.TILE_SIZE
	collision.shape = shape

func _rounded_rect_points(origin: Vector2, size: Vector2, radius: float, steps: int) -> PackedVector2Array:
	var points := PackedVector2Array()
	var corners := [
		{"center": origin + Vector2(radius, radius), "from": PI, "to": PI * 1.5},
		{"center": origin + Vector2(size.x - radius, radius), "from": PI * 1.5, "to": TAU},
		{"center": origin + Vector2(size.x - radius, size.y - radius), "from": 0.0, "to": PI * 0.5},
		{"center": origin + Vector2(radius, size.y - radius), "from": PI * 0.5, "to": PI}
	]
	for corner in corners:
		for i in range(steps + 1):
			var t := float(i) / float(steps)
			var angle: float = lerp(corner.from, corner.to, t)
			points.append(corner.center + Vector2(cos(angle), sin(angle)) * radius)
	return points

func _apply_text_color() -> void:
	var color := Color(0.12, 0.08, 0.04)
	if tile_id.begins_with("tiao") or tile_id == "green":
		color = Color(0.02, 0.42, 0.18)
	elif tile_id.begins_with("tong") or tile_id == "red":
		color = Color(0.75, 0.08, 0.06)
	label.add_theme_color_override("font_color", color)
