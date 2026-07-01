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

# Issue #18 — Schrittabstand (Meter) bis zum nächsten Fußstapf-SFX. Distanzbasiert
# statt timerbasiert, damit die Taktfrequenz mit der Laufgeschwindigkeit skaliert.
const STEP_DISTANCE := 1.8
var _step_accum := 0.0

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

	_play_footsteps(delta)


func _play_footsteps(delta: float) -> void:
	# Schritte nur am Boden und bei horizontaler Bewegung (nicht im Sprung/Stehen).
	if not is_on_floor():
		return
	var h := Vector2(velocity.x, velocity.z).length()
	if h < 0.5:
		return
	_step_accum += h * delta
	if _step_accum >= STEP_DISTANCE:
		_step_accum = 0.0
		var am := _audio_manager()
		if am != null:
			am.play_footstep()


## Autoload-Lookup per Node-Pfad (headless-robust, siehe debate_ui.gd) — der
## globale Identifier AudioManager ist in --script-Läufen nicht garantiert.
func _audio_manager() -> Node:
	return get_tree().root.get_node_or_null("/root/AudioManager")
