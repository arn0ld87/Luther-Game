extends SceneTree

## Headless behavioral check für das erste echte Level (Issue #25 Folge, M1).
## Prüft Ladbarkeit, Player-/Kamera-Setup, Kollisionskörper und Audioplayer.

const EXPECTED_BUILDINGS := 8
const EXPECTED_PROPS := 4
const EXPECTED_COLLISION_BODIES := 6

func _initialize() -> void:
	var ps: PackedScene = load("res://scenes/world/wittenberg_intro.tscn")
	var level := ps.instantiate() as Node3D
	root.add_child(level)

	# _ready() des Levels baut Geometrie asynchron auf; erst danach prüfen.
	await level.ready

	var player := level.get_node_or_null("Player") as CharacterBody3D
	if player == null:
		push_error("FAIL: Player node missing")
		quit(1)
		return
	print("PASS Player present")

	var camera_rig := level.get_node_or_null("CameraRig") as Node3D
	if camera_rig == null:
		push_error("FAIL: CameraRig node missing")
		quit(1)
		return
	print("PASS CameraRig present")

	var ground := level.get_node_or_null("Ground") as StaticBody3D
	if ground == null:
		push_error("FAIL: Ground collision body missing")
		quit(1)
		return
	print("PASS Ground present")

	var music := level.get_node_or_null("AmbientMusic") as AudioStreamPlayer
	if music == null:
		push_error("FAIL: AmbientMusic player missing")
		quit(1)
		return
	print("PASS AmbientMusic present")

	var building_count: int = level.get("building_count")
	var prop_count: int = level.get("prop_count")
	var collision_bodies: int = level.get("collision_bodies")

	if building_count < EXPECTED_BUILDINGS:
		push_error("FAIL: building_count=%d, expected >= %d" % [building_count, EXPECTED_BUILDINGS])
		quit(1)
		return
	print("PASS buildings: %d" % building_count)

	if prop_count < EXPECTED_PROPS:
		push_error("FAIL: prop_count=%d, expected >= %d" % [prop_count, EXPECTED_PROPS])
		quit(1)
		return
	print("PASS props: %d" % prop_count)

	if collision_bodies < EXPECTED_COLLISION_BODIES:
		push_error("FAIL: collision_bodies=%d, expected >= %d" % [collision_bodies, EXPECTED_COLLISION_BODIES])
		quit(1)
		return
	print("PASS collision bodies: %d" % collision_bodies)

	print("ALL TESTS PASSED")
	quit(0)
