extends SceneTree

## Headless behavioral check for Issue #12 (Third-Person-Kamera-Rig). Run via:
##   .godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/camera_rig_test.gd
## Exits 0 and prints "ALL TESTS PASSED" on success, exits 1 and prints a FAIL
## line on the first violated assertion. Mirrors the style of
## player_movement_test.gd — no test framework dependency.

const PIVOT_HEIGHT := 0.7
const FOLLOW_TOLERANCE := 0.05
const SETTLE_FRAMES := 60 # 1s at 60Hz — position_smoothing=8.0 converges to <0.1% error well within this
const TELEPORT_DX := 5.0
const SMOOTH_CHECK_FRAMES := 1 # immediately after a teleport, before convergence
const CONVERGE_FRAMES := 60
const SPRING_LENGTH := 4.5
const SPRING_LENGTH_TOLERANCE := 0.05
const REDUCED_SPRING_LENGTH := 0.5 # for the self-collision test, Step "no self-collision"

var player: CharacterBody3D
var camera_rig: Node3D
var spring_arm: SpringArm3D
var frame := 0
var phase := "follow_settle"
var teleport_target_x := 0.0

func _initialize() -> void:
	var bootstrap_scene: PackedScene = load("res://scenes/bootstrap.tscn")
	var bootstrap: Node = bootstrap_scene.instantiate()
	root.add_child(bootstrap)

	player = bootstrap.get_node_or_null("Player") as CharacterBody3D
	if player == null:
		push_error("FAIL: no 'Player' CharacterBody3D node found under scenes/bootstrap.tscn root")
		quit(1)
		return

	camera_rig = bootstrap.get_node_or_null("CameraRig") as Node3D
	if camera_rig == null:
		push_error("FAIL: no 'CameraRig' node found under scenes/bootstrap.tscn root")
		quit(1)
		return

	spring_arm = camera_rig.get_node_or_null("SpringArm3D") as SpringArm3D
	if spring_arm == null:
		push_error("FAIL: no 'SpringArm3D' child found under CameraRig")
		quit(1)
		return

	var cam: Node = spring_arm.get_node_or_null("Camera3D")
	if cam == null or not (cam is Camera3D) or not (cam as Camera3D).current:
		push_error("FAIL: CameraRig/SpringArm3D/Camera3D missing or not 'current'")
		quit(1)
		return
	print("PASS bootstrap integration: CameraRig + SpringArm3D + current Camera3D present")

	physics_frame.connect(_on_physics_frame)

func _on_physics_frame() -> void:
	frame += 1

	if phase == "follow_settle":
		if frame < SETTLE_FRAMES:
			return
		var expected: Vector3 = player.global_position + Vector3.UP * PIVOT_HEIGHT
		var dist: float = camera_rig.global_position.distance_to(expected)
		if dist > FOLLOW_TOLERANCE:
			push_error("FAIL: camera_rig.global_position=%s, expected near %s (dist=%f)" % [camera_rig.global_position, expected, dist])
			quit(1)
			return
		print("PASS follow settle: camera_rig at %s (dist to expected=%f)" % [camera_rig.global_position, dist])

		phase = "no_hindrance"
		frame = 0
		return

	if phase == "no_hindrance":
		# Default (un-rotated) orientation faces CameraWall — rotate 180 degrees
		# to an empty-space direction before measuring the unobstructed spring length.
		if frame == 1:
			camera_rig.rotate_yaw(PI)
			return
		if frame < 1 + SETTLE_FRAMES:
			return
		var hit_length: float = spring_arm.get_hit_length()
		if absf(hit_length - SPRING_LENGTH) > SPRING_LENGTH_TOLERANCE:
			push_error("FAIL: get_hit_length()=%f in an unobstructed direction, expected ~%f (no hindrance baseline)" % [hit_length, SPRING_LENGTH])
			quit(1)
			return
		print("PASS no-hindrance baseline: get_hit_length()=%f" % hit_length)

		phase = "clipping_camera_wall"
		frame = 0
		camera_rig.rotate_yaw(PI) # rotate back to the default orientation, facing CameraWall
		return

	if phase == "clipping_camera_wall":
		if frame < SETTLE_FRAMES:
			return
		var hit_length: float = spring_arm.get_hit_length()
		if hit_length >= SPRING_LENGTH - SPRING_LENGTH_TOLERANCE:
			push_error("FAIL: get_hit_length()=%f facing CameraWall, expected < %f (clipping avoidance)" % [hit_length, SPRING_LENGTH])
			quit(1)
			return
		var cam_pos: Vector3 = spring_arm.get_node("Camera3D").global_position
		# CameraWall AABB: x in [-0.5,0.5], y in [0,3.0], z in [3.0,4.0] (1x3x1m box centered at x=0,z=3.5)
		if cam_pos.x > -0.5 and cam_pos.x < 0.5 and cam_pos.y > 0.0 and cam_pos.y < 3.0 and cam_pos.z > 3.0 and cam_pos.z < 4.0:
			push_error("FAIL: camera.global_position=%s lies inside the CameraWall AABB — visible clipping" % cam_pos)
			quit(1)
			return
		print("PASS CameraWall clipping avoidance: get_hit_length()=%f, camera at %s (outside wall AABB)" % [hit_length, cam_pos])

		phase = "no_self_collision"
		frame = 0
		spring_arm.spring_length = REDUCED_SPRING_LENGTH
		return

	if phase == "no_self_collision":
		if frame < SETTLE_FRAMES:
			return
		var hit_length: float = spring_arm.get_hit_length()
		if absf(hit_length - REDUCED_SPRING_LENGTH) > SPRING_LENGTH_TOLERANCE:
			push_error("FAIL: get_hit_length()=%f with reduced spring_length=%f near the player's own capsule, expected no shortening (layer/mask separation)" % [hit_length, REDUCED_SPRING_LENGTH])
			quit(1)
			return
		print("PASS no self-collision: get_hit_length()=%f at reduced spring_length=%f (player capsule correctly excluded)" % [hit_length, REDUCED_SPRING_LENGTH])
		spring_arm.spring_length = SPRING_LENGTH

		phase = "smoothing_not_1to1"
		frame = 0
		teleport_target_x = player.global_position.x + TELEPORT_DX
		player.global_position.x = teleport_target_x
		return

	if phase == "smoothing_not_1to1":
		if frame < SMOOTH_CHECK_FRAMES:
			return
		var dist_to_old: float = absf(camera_rig.global_position.x - (teleport_target_x - TELEPORT_DX))
		var dist_to_new: float = absf(camera_rig.global_position.x - teleport_target_x)
		if dist_to_new < dist_to_old:
			push_error("FAIL: one frame after a %fm teleport, camera_rig.x=%f is already closer to the new position than the old one — smoothing is not happening (looks like 1:1 parenting)" % [TELEPORT_DX, camera_rig.global_position.x])
			quit(1)
			return
		print("PASS smoothing (not 1:1): one frame after teleport, camera_rig.x=%f (closer to old=%f than new=%f)" % [camera_rig.global_position.x, teleport_target_x - TELEPORT_DX, teleport_target_x])

		phase = "convergence"
		frame = 0
		return

	if phase == "convergence":
		if frame < CONVERGE_FRAMES:
			return
		var dist: float = absf(camera_rig.global_position.x - teleport_target_x)
		if dist > FOLLOW_TOLERANCE:
			push_error("FAIL: %d frames after teleport, camera_rig.x=%f still %fm from target x=%f — smoothing did not converge" % [CONVERGE_FRAMES, camera_rig.global_position.x, dist, teleport_target_x])
			quit(1)
			return
		print("PASS convergence after teleport: camera_rig.x=%f (within %fm of target)" % [camera_rig.global_position.x, FOLLOW_TOLERANCE])

		# Spielfigur zurück auf die X-Achsen-Mitte teleportieren, damit der spätere
		# Tunneling-Test wieder relativ zum Ursprung (und damit zur Testgeometrie)
		# misst, statt um den Teleport-Versatz (5 m) verschoben ins Leere zu zielen.
		player.global_position.x = 0.0
		phase = "pitch_clamp"
		frame = 0
		return

	if phase == "pitch_clamp":
		if frame == 1:
			for i in range(50):
				camera_rig.rotate_pitch(deg_to_rad(10.0)) # way past pitch_max_deg
			return
		var pitch_deg: float = rad_to_deg(spring_arm.rotation.x)
		if pitch_deg > 60.0 + 0.01:
			push_error("FAIL: spring_arm.rotation.x=%f deg exceeds pitch_max_deg=60.0 after repeated rotate_pitch() calls" % pitch_deg)
			quit(1)
			return
		for i in range(100):
			camera_rig.rotate_pitch(deg_to_rad(-10.0)) # way past pitch_min_deg
		pitch_deg = rad_to_deg(spring_arm.rotation.x)
		if pitch_deg < -40.0 - 0.01:
			push_error("FAIL: spring_arm.rotation.x=%f deg exceeds pitch_min_deg=-40.0 after repeated rotate_pitch() calls" % pitch_deg)
			quit(1)
			return
		print("PASS pitch clamping: spring_arm.rotation.x stays within [-40, 60] degrees")

		phase = "yaw_rotation"
		frame = 0
		return

	if phase == "yaw_rotation":
		var before: float = camera_rig.rotation.y
		var delta: float = deg_to_rad(30.0)
		camera_rig.rotate_yaw(delta)
		var after: float = camera_rig.rotation.y
		if absf((after - before) - delta) > 0.001:
			push_error("FAIL: rotate_yaw(%f) changed rotation.y from %f to %f, expected a delta of exactly %f" % [delta, before, after, delta])
			quit(1)
			return
		print("PASS yaw rotation: rotate_yaw() changed rotation.y by the exact requested delta")

		phase = "tunneling_thin_obstacle"
		frame = 0
		return

	if phase == "tunneling_thin_obstacle":
		# CameraThinObstacle ist eine 0,15 m dünne, 4 m hohe Wand bei +X (relativ
		# zum Ursprung). Erst den Rig nach dem Convergence-Teleport zurück zum
		# Ursprung konvergieren lassen, dann den Arm waagerecht in ihre Richtung
		# drehen und messen.
		if frame < SETTLE_FRAMES:
			return # Rig konvergiert zurück zum Ursprung (Spieler steht wieder bei x=0)
		if frame == SETTLE_FRAMES:
			camera_rig.rotation.y = 0.0
			spring_arm.rotation.x = 0.0 # Arm waagerecht: die Wandhöhe ist hier kein Faktor
			camera_rig.rotate_yaw(PI / 2.0) # Vierteldrehung zur dünnen Wand (Vorzeichen ggf. kippen, s. Plan Task 3/4)
			return
		if frame < SETTLE_FRAMES * 2:
			return # Spring-Cast in der neuen Richtung einschwingen lassen
		var hit_length: float = spring_arm.get_hit_length()
		if hit_length >= SPRING_LENGTH - SPRING_LENGTH_TOLERANCE:
			push_error("FAIL: get_hit_length()=%f facing the 0.15m CameraThinObstacle, expected < %f (thin-geometry tunneling avoidance)" % [hit_length, SPRING_LENGTH])
			quit(1)
			return
		print("PASS thin-geometry tunneling avoidance: get_hit_length()=%f facing CameraThinObstacle" % hit_length)
		print("ALL TESTS PASSED")
		quit(0)
