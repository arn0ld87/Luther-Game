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

	# Issue #18 — Hintergrundmusik wird zentral vom AudioManager-Autoload gespielt
	# (nicht mehr als AmbientMusic-Player im Level). Prüfe nur, dass das Autoload
	# geladen ist; Bus-/Musik-Details deckt audio_test ab.
	var am := root.get_node_or_null("AudioManager")
	if am == null:
		push_error("FAIL: AudioManager-Autoload fehlt")
		quit(1)
		return
	print("PASS AudioManager-Autoload present")

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

	# Bug #1-Regressionsschutz: Spieler muss nach 1 s Physics-Simulation auf dem
	# Boden stehen, nicht durchs Level fallen (ursprünglicher Bug: degenerierte
	# Building-AABB überdeckte den Spawn, move_and_slide fand keinen Bodenkontakt).
	# 60 physics_frame = 1 s bei Godot-Default 60 Hz physics tick.
	# Capsule (height=1.8, radius=0.4) auf Ground-Top y=0 → Player-Origin y≈0.9;
	# Schwelle 0.7 fängt „komplett durchgefallen" UND „im Boden versackt" ab.
	player.global_position = Vector3(0, 2, 12)
	player.velocity = Vector3.ZERO
	for _i in range(60):
		await physics_frame
	if not player.is_on_floor() or player.global_position.y < 0.7:
		push_error("FAIL: Spieler fällt durchs Level — y=%.3f on_floor=%s" %
			[player.global_position.y, player.is_on_floor()])
		quit(1)
		return
	print("PASS player on floor after 1s: y=%.3f" % player.global_position.y)

	print("ALL TESTS PASSED")
	quit(0)
