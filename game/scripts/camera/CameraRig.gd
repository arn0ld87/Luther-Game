extends Node3D

## Issue #12 — Third-Person-Kamera-Rig. Folgt `target` per Lerp/Smoothing
## (kein 1:1-Parenting) und vermeidet Wand-/Gebäude-Clipping über den
## Shape-Cast des SpringArm3D-Kindknotens. Liefert rotate_yaw()/rotate_pitch()
## als input-quellenunabhängige öffentliche API für den Orbit; verdrahtet
## bewusst KEINEN Input-Listener (kein _unhandled_input) — das konkrete
## Anbinden einer Eingabequelle (Maus/Stick/Tastatur) an diese API ist
## explizit Issue #13 (Konfigurierbares Input-Mapping) vorbehalten.

@export var target: CharacterBody3D
## Serialisierte/aufzulösende Form von `target`. Godot 4.7 löst einen
## in der .tscn (insbesondere als Instanz-Override) hand-gesetzten NodePath
## NICHT in das typisierte Node-Export `target` auf — es bliebe still null
## (NodePath→Object-Mismatch). Daher wird der Pfad explizit in `_ready()`
## via get_node_or_null() aufgelöst. Direktes Zuweisen von `target` im
## Editor-Inspector bleibt unverändert möglich und hat Vorrang.
@export var target_path: NodePath
@export var pivot_height: float = 0.7
@export var spring_length: float = 4.5
@export var collision_margin: float = 0.3
@export var camera_collision_radius: float = 0.2
@export var position_smoothing: float = 8.0
@export var initial_pitch_deg: float = -15.0
@export var pitch_min_deg: float = -40.0
@export var pitch_max_deg: float = 60.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

var _pitch: float = 0.0

func rotate_yaw(delta_rad: float) -> void:
	rotation.y += delta_rad

func rotate_pitch(delta_rad: float) -> void:
	_pitch = clampf(_pitch + delta_rad, deg_to_rad(pitch_min_deg), deg_to_rad(pitch_max_deg))
	spring_arm.rotation.x = _pitch

func _ready() -> void:
	if target == null and not target_path.is_empty():
		target = get_node_or_null(target_path) as CharacterBody3D

	if target == null:
		push_error("CameraRig: 'target' ist nicht gesetzt — Rig kann der Spielfigur nicht folgen.")
		return

	spring_arm.spring_length = spring_length
	spring_arm.margin = collision_margin
	spring_arm.collision_mask = 1 # Layer "world" — Layer "player" bewusst ausgeschlossen

	var cast_shape := SphereShape3D.new()
	cast_shape.radius = camera_collision_radius
	spring_arm.shape = cast_shape # Shape-Cast statt Default-Raycast: vermeidet Tunneling

	_pitch = deg_to_rad(initial_pitch_deg)
	spring_arm.rotation.x = _pitch

	# Erstes Frame ohne Smoothing direkt auf die Zielfigur springen.
	global_position = target.global_position + Vector3.UP * pivot_height

func _physics_process(delta: float) -> void:
	if target == null:
		return

	var desired_position: Vector3 = target.global_position + Vector3.UP * pivot_height
	var factor: float = clampf(1.0 - exp(-position_smoothing * delta), 0.0, 1.0)
	global_position = global_position.lerp(desired_position, factor)
