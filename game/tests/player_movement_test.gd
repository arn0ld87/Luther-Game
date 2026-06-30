extends SceneTree

## Headless behavioral check for Issue #11 (Spielercharakter: Bewegung, Kollision,
## Gravitation). Run via:
##   godot --headless --path game --script res://tests/player_movement_test.gd
## Exits 0 and prints "ALL TESTS PASSED" on success, exits 1 and prints a FAIL
## line on the first violated assertion. No test framework dependency (GUT/GDUnit
## not set up yet in this project) — this is a temporary, self-contained
## SceneTree script.

const FLOOR_REST_Y := 0.9 # capsule (radius 0.4, height 1.8, centered on origin) resting on floor top at y=0
const FLOOR_TOLERANCE := 0.05
const GRAVITY_SETTLE_FRAMES := 90 # 1.5s at 60Hz physics tick — generous margin for a ~0.1m fall
const MOVE_FRAMES := 90 # 1.5s — well past the ~25 frames needed to reach the Obstacle box, plus settle time
const MIN_EXPECTED_DX := 1.0 # proves real movement happened before the obstacle is reached
const OBSTACLE_NEAR_FACE_X := 2.5 # Obstacle box at x=3, half-size 0.5 -> near face at x=2.5
const OBSTACLE_MAX_X := 2.45 # must stay short of the near face -> proves the player was blocked, not clipped through

var player: CharacterBody3D
var frame := 0
var phase := "gravity"
var move_start_x := 0.0

func _initialize() -> void:
	var bootstrap_scene: PackedScene = load("res://scenes/bootstrap.tscn")
	var bootstrap: Node = bootstrap_scene.instantiate()
	root.add_child(bootstrap)

	player = bootstrap.get_node_or_null("Player") as CharacterBody3D
	if player == null:
		push_error("FAIL: no 'Player' CharacterBody3D node found under scenes/bootstrap.tscn root")
		quit(1)
		return

	physics_frame.connect(_on_physics_frame)

func _on_physics_frame() -> void:
	if player == null:
		return
	frame += 1

	if phase == "gravity":
		if frame < GRAVITY_SETTLE_FRAMES:
			return
		var y: float = player.global_position.y
		var on_floor: bool = player.is_on_floor()
		if not on_floor:
			push_error("FAIL: player.is_on_floor() is false after %d physics frames (gravity not settling)" % GRAVITY_SETTLE_FRAMES)
			quit(1)
			return
		if absf(y - FLOOR_REST_Y) > FLOOR_TOLERANCE:
			push_error("FAIL: player.global_position.y = %f, expected ~%f (capsule resting on floor)" % [y, FLOOR_REST_Y])
			quit(1)
			return
		print("PASS gravity+collision: is_on_floor()=true, y=%f" % y)

		phase = "move"
		frame = 0
		move_start_x = player.global_position.x
		var key_event := InputEventKey.new()
		key_event.physical_keycode = KEY_D # Player.gd reads is_physical_key_pressed(), not is_key_pressed()
		key_event.pressed = true
		Input.parse_input_event(key_event)
		return

	if phase == "move":
		if frame < MOVE_FRAMES:
			return
		var dx: float = player.global_position.x - move_start_x
		if dx < MIN_EXPECTED_DX:
			push_error("FAIL: horizontal movement too small after %d frames holding D: dx=%f (expected >= %f)" % [MOVE_FRAMES, dx, MIN_EXPECTED_DX])
			quit(1)
			return
		var x: float = player.global_position.x
		if x >= OBSTACLE_MAX_X:
			push_error("FAIL: player.global_position.x = %f reached/passed the Obstacle's near face (%f) — collision did not block movement" % [x, OBSTACLE_NEAR_FACE_X])
			quit(1)
			return
		var y: float = player.global_position.y
		if absf(y - FLOOR_REST_Y) > FLOOR_TOLERANCE:
			push_error("FAIL: player.global_position.y = %f after colliding with the Obstacle, expected ~%f (should still rest on the floor, not fall through)" % [y, FLOOR_REST_Y])
			quit(1)
			return
		print("PASS movement+obstacle collision: dx=%f, x=%f (blocked before %f), y=%f" % [dx, x, OBSTACLE_NEAR_FACE_X, y])
		print("ALL TESTS PASSED")
		quit(0)
