extends Node3D

## Issue #12 — Third-Person-Kamera-Rig. Folgt `target` per Lerp/Smoothing
## (kein 1:1-Parenting) und vermeidet Wand-/Gebäude-Clipping über den
## Shape-Cast des SpringArm3D-Kindknotens. Liefert rotate_yaw()/rotate_pitch()
## als input-quellenunabhängige öffentliche API für den Orbit.
##
## Issue #13 — Verarbeitung der Input-Map Actions `look_*` (Right Stick /
## Pfeiltasten) und `camera_zoom_*` (Mausrad) in _unhandled_input().

@export var target: CharacterBody3D:
	set(value):
		target = value
		# Laufzeit-Reassign: sofort auf das neue Ziel springen statt heranzugleiten,
		# und die Physik-Verarbeitung an die Ziel-Gültigkeit koppeln.
		if is_node_ready():
			if is_instance_valid(target):
				set_physics_process(true)
				global_position = target.global_position + Vector3.UP * pivot_height
			else:
				set_physics_process(false)
## Serialisierte/aufzulösende Form von `target`. Godot 4.7 löst einen
## in der .tscn (insbesondere als Instanz-Override) hand-gesetzten NodePath
## NICHT in das typisierte Node-Export `target` auf — es bliebe still null
## (NodePath→Object-Mismatch). Daher wird der Pfad explizit in `_ready()`
## via get_node_or_null() aufgelöst. Direktes Zuweisen von `target` im
## Editor-Inspector bleibt unverändert möglich und hat Vorrang.
@export var target_path: NodePath
@export var pivot_height: float = 0.7
@export var spring_length: float = 4.5:
	set(value):
		spring_length = value
		if is_node_ready():
			spring_arm.spring_length = value
@export var collision_margin: float = 0.3:
	set(value):
		collision_margin = value
		if is_node_ready():
			spring_arm.margin = value
@export var camera_collision_radius: float = 0.2:
	set(value):
		camera_collision_radius = value
		if is_node_ready() and spring_arm.shape is SphereShape3D:
			spring_arm.shape.radius = value
## Physik-Layer, gegen die der SpringArm-Shape-Cast prüft. Default = nur
## Layer 1 ("world"); Layer 2 ("player") bewusst ausgeschlossen, damit die
## Kamera nicht mit dem eigenen Charakter-Collider kollidiert. Als Flags-Export,
## damit der Editor die in project.godot benannten Layer zeigt (keine Magic Number).
@export_flags_3d_physics var world_collision_mask: int = 1:
	set(value):
		world_collision_mask = value
		if is_node_ready():
			spring_arm.collision_mask = value
@export var position_smoothing: float = 8.0
@export var initial_pitch_deg: float = -15.0
@export var pitch_min_deg: float = -40.0
@export var pitch_max_deg: float = 60.0
@export var yaw_speed_deg_per_sec: float = 120.0
@export var pitch_speed_deg_per_sec: float = 90.0
@export var zoom_step: float = 0.5
@export var zoom_min: float = 1.5
@export var zoom_max: float = 8.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

var _pitch: float = 0.0

func rotate_yaw(delta_rad: float) -> void:
	rotation.y += delta_rad

func rotate_pitch(delta_rad: float) -> void:
	_pitch = clampf(_pitch + delta_rad, deg_to_rad(pitch_min_deg), deg_to_rad(pitch_max_deg))
	# spring_arm ist @onready: vor _ready() (z. B. API-Aufruf vor Tree-Eintritt)
	# noch null — Zugriff absichern.
	if is_node_ready():
		spring_arm.rotation.x = _pitch

func _ready() -> void:
	if target == null and not target_path.is_empty():
		target = get_node_or_null(target_path) as CharacterBody3D

	if not is_instance_valid(target):
		push_error("CameraRig: 'target' ist nicht gesetzt — Rig kann der Spielfigur nicht folgen.")
		set_physics_process(false)
		return

	spring_arm.spring_length = spring_length
	spring_arm.margin = collision_margin
	spring_arm.collision_mask = world_collision_mask # nur "world", "player" ausgeschlossen

	var cast_shape := SphereShape3D.new()
	cast_shape.radius = camera_collision_radius
	spring_arm.shape = cast_shape # Shape-Cast statt Default-Raycast: vermeidet Tunneling

	# Initial-Pitch ebenfalls klemmen, damit ein außerhalb [min,max] konfigurierter
	# Startwert nicht beim ersten rotate_pitch() abrupt in den Bereich zurückspringt.
	_pitch = clampf(deg_to_rad(initial_pitch_deg), deg_to_rad(pitch_min_deg), deg_to_rad(pitch_max_deg))
	spring_arm.rotation.x = _pitch

	# Erstes Frame ohne Smoothing direkt auf die Zielfigur springen.
	global_position = target.global_position + Vector3.UP * pivot_height

func _unhandled_input(event: InputEvent) -> void:
	# Mausrad-Zoom ist ein Impuls (is_action_just_released), keine Stärke.
	if event.is_action_pressed("camera_zoom_in"):
		_set_zoom(spring_length - zoom_step)
	elif event.is_action_pressed("camera_zoom_out"):
		_set_zoom(spring_length + zoom_step)

func _physics_process(delta: float) -> void:
	if not is_instance_valid(target):
		# Ziel zur Laufzeit ungültig geworden: Verarbeitung ganz abschalten
		# statt jeden Frame erneut zu prüfen.
		set_physics_process(false)
		return

	var look_vector := Input.get_vector("look_left", "look_right", "look_up", "look_down")
	if look_vector.length_squared() > 0.0:
		rotate_yaw(deg_to_rad(look_vector.x * yaw_speed_deg_per_sec * delta))
		rotate_pitch(deg_to_rad(-look_vector.y * pitch_speed_deg_per_sec * delta))

	var desired_position: Vector3 = target.global_position + Vector3.UP * pivot_height
	var factor: float = clampf(1.0 - exp(-position_smoothing * delta), 0.0, 1.0)
	global_position = global_position.lerp(desired_position, factor)

func _set_zoom(value: float) -> void:
	spring_length = clampf(value, zoom_min, zoom_max)
	if is_node_ready():
		spring_arm.spring_length = spring_length
