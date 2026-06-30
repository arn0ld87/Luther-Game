extends CharacterBody3D

## Issue #11 — minimal player movement + gravity + collision. Reference
## script for future GDScript contributions (Risk Register Risiko 5), kept
## intentionally simple: no acceleration smoothing, no animations.
##
## Tastenbelegung ist bewusst hartcodiert (Input.is_key_pressed statt
## Godots Input-Map) — konfigurierbares Mapping ist eigenständig Issue #10
## und löst dies dort ab.

@export var speed: float = 5.0
@export var gravity: float = 9.8

func _physics_process(delta: float) -> void:
	if is_on_floor():
		velocity.y = 0.0
	else:
		velocity.y -= gravity * delta

	var input_dir := Vector3.ZERO
	if Input.is_key_pressed(KEY_W):
		input_dir.z -= 1.0
	if Input.is_key_pressed(KEY_S):
		input_dir.z += 1.0
	if Input.is_key_pressed(KEY_A):
		input_dir.x -= 1.0
	if Input.is_key_pressed(KEY_D):
		input_dir.x += 1.0
	input_dir = input_dir.normalized()

	velocity.x = input_dir.x * speed
	velocity.z = input_dir.z * speed

	move_and_slide()
