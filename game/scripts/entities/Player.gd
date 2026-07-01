extends CharacterBody3D

## Issue #11 — minimal player movement + gravity + collision. Reference
## script for future GDScript contributions (Risk Register Risiko 5), kept
## intentionally simple: no acceleration smoothing, no animations.
##
## Steuerung über Godots Input-Map (move_forward, move_back, move_left,
## move_right, jump) statt hartcodierter Keycodes. get_vector() liefert einen
## normalisierten Richtungsvektor inkl. Stick-Deadzone-Handling. Die Actions
## verwenden physical_keycode, damit WASD auf nicht-QWERTY-Layouts an der
## erwarteten physischen Position liegt.

@export var speed: float = 5.0
@export var gravity: float = 9.8
@export var jump_velocity: float = 5.0

func _physics_process(delta: float) -> void:
	# Kein manuelles velocity.y = 0 im Bodenkontakt: move_and_slide()s eigenes
	# Floor-Snapping hält die Figur am Boden, ein erzwungener Reset würde bei
	# künftigen Schrägen mit der Snap-Logik kollidieren.
	if not is_on_floor():
		velocity.y -= gravity * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = jump_velocity

	var input_vec := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var input_dir := Vector3(input_vec.x, 0.0, input_vec.y).normalized()

	velocity.x = input_dir.x * speed
	velocity.z = input_dir.z * speed

	move_and_slide()
