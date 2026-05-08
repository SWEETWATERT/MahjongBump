extends Node2D
class_name MahjongEffects

@onready var line := Line2D.new()

func _ready() -> void:
	add_child(line)
	line.width = 8
	line.default_color = Color(1, 0.96, 0.55, 1)
	line.joint_mode = Line2D.LINE_JOINT_ROUND
	line.begin_cap_mode = Line2D.LINE_CAP_ROUND
	line.end_cap_mode = Line2D.LINE_CAP_ROUND
	line.visible = false

func play_success_line(points: PackedVector2Array) -> void:
	line.clear_points()
	line.visible = true
	for point in points:
		line.add_point(point)
	line.modulate.a = 0.0
	var tween := create_tween()
	tween.tween_property(line, "modulate:a", 1.0, 0.08)
	tween.tween_interval(0.14)
	tween.tween_property(line, "modulate:a", 0.0, 0.12)
	tween.finished.connect(func() -> void:
		line.visible = false
		line.clear_points()
	)

func burst_at(global_position: Vector2) -> void:
	var particles := CPUParticles2D.new()
	add_child(particles)
	particles.global_position = global_position
	particles.amount = 22
	particles.lifetime = 0.45
	particles.one_shot = true
	particles.explosiveness = 1.0
	particles.initial_velocity_min = 120
	particles.initial_velocity_max = 220
	particles.spread = 180
	particles.scale_amount_min = 3
	particles.scale_amount_max = 6
	particles.color = Color(1, 0.88, 0.32, 1)
	particles.emitting = true
	var timer := get_tree().create_timer(0.7)
	timer.timeout.connect(particles.queue_free)

func play_combo(combo: int, target: CanvasItem) -> void:
	if combo < 2:
		return
	var tween := create_tween()
	tween.tween_property(target, "scale", Vector2(1.08, 1.08), 0.08)
	tween.tween_property(target, "scale", Vector2.ONE, 0.12)

func play_error_flash(target: CanvasItem) -> void:
	var tween := create_tween()
	tween.tween_property(target, "modulate", Color(1.0, 0.16, 0.12, 1), 0.045)
	tween.tween_property(target, "modulate", Color.WHITE, 0.09)
	tween.tween_property(target, "modulate", Color(1.0, 0.30, 0.24, 1), 0.045)
	tween.tween_property(target, "modulate", Color.WHITE, 0.14)

func shake(target: Node2D) -> void:
	var base := target.position
	var tween := create_tween()
	tween.tween_property(target, "position", base + Vector2(10, 0), 0.04)
	tween.tween_property(target, "position", base + Vector2(-10, 0), 0.04)
	tween.tween_property(target, "position", base + Vector2(5, 0), 0.04)
	tween.tween_property(target, "position", base, 0.05)
