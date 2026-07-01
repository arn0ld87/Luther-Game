extends CharacterBody3D

## Issue #11 — minimal player movement + gravity + collision. Reference
## script for future GDScript contributions (Risk Register Risiko 5), kept
## intentionally simple: no acceleration smoothing, no animations.
##
## Steuerung über Godots Input-Map (move_forward, move_back, move_left,
## move_right) statt hartcodierter Keycodes. get_vector() liefert einen
## normalisierten Richtungsvektor inkl. Stick-Deadzone-Handling.

@export var speed: float = 5.0
@export var gravity: float = 9.8

func _physics_process(delta: float) -> void:
	# Kein manuelles velocity.y = 0 im Bodenkontakt: move_and_slide()s eigenes
	# Floor-Snapping hält die Figur am Boden, ein erzwungener Reset würde bei
	# künftigen Schrägen mit der Snap-Logik kollidieren.
	if not is_on_floor():
		velocity.y -= gravity * delta

	var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var input_dir := Vector3(input_vector.x, 0, input_vector.y)

	velocity.x = input_dir.x * speed
	velocity.z = input_dir.z * speed

	move_and_slide()
