extends CharacterBody3D

## Issue #11 — minimal player movement + gravity + collision. Reference
## script for future GDScript contributions (Risk Register Risiko 5), kept
## intentionally simple: no acceleration smoothing, no animations.
##
## Tastenbelegung ist bewusst hartcodiert (Input.is_physical_key_pressed statt
## Godots Input-Map) — konfigurierbares Mapping ist eigenständig Issue #10
## und löst dies dort ab. is_physical_key_pressed (statt is_key_pressed) prüft
## die physische Tastenposition statt des layoutabhängigen Zeichens, damit
## WASD auch auf nicht-QWERTY-Layouts an der erwarteten Stelle liegt.

@export var speed: float = 5.0
@export var gravity: float = 9.8

func _physics_process(delta: float) -> void:
	# Kein manuelles velocity.y = 0 im Bodenkontakt: move_and_slide()s eigenes
	# Floor-Snapping hält die Figur am Boden, ein erzwungener Reset würde bei
	# künftigen Schrägen mit der Snap-Logik kollidieren.
	if not is_on_floor():
		velocity.y -= gravity * delta

	var input_dir := Vector3.ZERO
	if Input.is_physical_key_pressed(KEY_W):
		input_dir.z -= 1.0
	if Input.is_physical_key_pressed(KEY_S):
		input_dir.z += 1.0
	if Input.is_physical_key_pressed(KEY_A):
		input_dir.x -= 1.0
	if Input.is_physical_key_pressed(KEY_D):
		input_dir.x += 1.0
	input_dir = input_dir.normalized()

	velocity.x = input_dir.x * speed
	velocity.z = input_dir.z * speed

	move_and_slide()
