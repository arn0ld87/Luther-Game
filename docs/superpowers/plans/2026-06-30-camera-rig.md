# Third-Person-Kamera-Rig Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Issue #11 player a collision-safe third-person follow camera (SpringArm3D-based), per `docs/superpowers/specs/2026-06-30-camera-rig-design.md`.

**Architecture:** A new, decoupled `CameraRig.tscn` (`Node3D` → `SpringArm3D` → `Camera3D`) follows the `Player` with exponential position smoothing (no 1:1 parenting), exposes `rotate_yaw()`/`rotate_pitch()` as an input-source-agnostic API, and uses a `SpringArm3D` shape-cast (separate physics layer from the player) to avoid clipping through level geometry — including one real Kenney-Castle-Kit asset (`wall.glb`) imported for the first time into the project.

**Tech Stack:** Godot 4.7-stable (Forward+), GDScript, headless `SceneTree`-script behavior tests (no GUT/GDUnit yet, same pattern as `game/tests/player_movement_test.gd`).

## Global Constraints

- Physics layer 1 = "world", layer 2 = "player" (named in `project.godot` `[layer_names]`) — `Player` lives on layer 2 only; all static level geometry stays on layer 1; `SpringArm3D.collision_mask` is layer 1 only (excludes the player's own collider).
- No magic numbers in `CameraRig.gd` — every tunable (`pivot_height`, `spring_length`, `collision_margin`, `camera_collision_radius`, `position_smoothing`, `initial_pitch_deg`, `pitch_min_deg`, `pitch_max_deg`) is an `@export` field.
- `CameraRig.gd` registers **no** input listener (no `_unhandled_input`) — `rotate_yaw()`/`rotate_pitch()` are a pure API; wiring an actual input source is Issue #13's scope, not this plan's.
- Every behavioral change is verified with a real headless Godot 4.7-stable run (`.godot-editor/Godot.app/Contents/MacOS/Godot` locally, matching `game/README.md` §4) — never claim a test passes without having run it and seen the output.
- `game/tests/player_movement_test.gd` (Issue #11) must print `ALL TESTS PASSED` and exit `0` after every task in this plan — regression-protect it at every step.
- Exactly one third-party asset (`wall.glb`, CC0, already documented in `godot_assets/MANIFEST.md`) is copied into the tracked `game/assets/`; `godot_assets/` itself stays `.gitignore`d (533 MB staging dir, not a versioned source).
- All commands below assume cwd = repo root `/Volumes/T7/Projekte/Luther-Game`.

---

### Task 1: Collision-layer foundation

**Files:**
- Modify: `game/project.godot`
- Modify: `game/scenes/Player.tscn`
- Modify: `game/scenes/bootstrap.tscn`
- Test: `game/tests/player_movement_test.gd` (unchanged — used as a regression gate, not modified)

**Interfaces:**
- Consumes: nothing new.
- Produces: named physics layers `3d_physics/layer_1="world"`, `3d_physics/layer_2="player"` in `project.godot` (later tasks' `SpringArm3D.collision_mask = 1` depends on this naming); `Player` root node has `collision_layer = 2`, `collision_mask = 1`; `Floor`/`Obstacle` root nodes have `collision_layer = 1`, `collision_mask = 0`.

- [ ] **Step 1: Confirm the current regression baseline (before touching anything)**

Run:
```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/player_movement_test.gd
echo "EXIT: $?"
```
Expected output (tail):
```
PASS gravity+collision: is_on_floor()=true, y=0.900000
PASS movement+obstacle collision: dx=..., x=..., y=0.900000
ALL TESTS PASSED
EXIT: 0
```
This is the baseline every later step must keep reproducing.

- [ ] **Step 2: Add named physics layers to `project.godot`**

Append at the end of `game/project.godot` (after the existing `[rendering]` section):

```ini
[layer_names]

3d_physics/layer_1="world"
3d_physics/layer_2="player"
```

- [ ] **Step 3: Set `Player` collision layer/mask**

In `game/scenes/Player.tscn`, change:
```
[node name="Player" type="CharacterBody3D"]
script = ExtResource("1_script")
```
to:
```
[node name="Player" type="CharacterBody3D"]
script = ExtResource("1_script")
collision_layer = 2
collision_mask = 1
```

- [ ] **Step 4: Set explicit collision layer/mask on `Floor` and `Obstacle` in `bootstrap.tscn`**

In `game/scenes/bootstrap.tscn`, change:
```
[node name="Floor" type="StaticBody3D" parent="."]
```
to:
```
[node name="Floor" type="StaticBody3D" parent="."]
collision_layer = 1
collision_mask = 0
```
and change:
```
[node name="Obstacle" type="StaticBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 3, 0.5, 0)
```
to:
```
[node name="Obstacle" type="StaticBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 3, 0.5, 0)
collision_layer = 1
collision_mask = 0
```

- [ ] **Step 5: Re-import and re-run the regression test**

Run:
```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --import --quit-after 1000
echo "IMPORT EXIT: $?"
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/player_movement_test.gd
echo "TEST EXIT: $?"
```
Expected: `IMPORT EXIT: 0`, no error lines from the import step, and the exact same `ALL TESTS PASSED` / `TEST EXIT: 0` as Step 1 — `Player`'s own `move_and_slide()` collision against `Floor`/`Obstacle` is governed by `Player.collision_mask` (still `1`, unchanged), not by `Player.collision_layer`, so this must stay green. If it doesn't, stop and investigate before continuing — do not proceed to Task 2 on a red regression test.

- [ ] **Step 6: Commit**

```bash
git add game/project.godot game/scenes/Player.tscn game/scenes/bootstrap.tscn
git commit -m "$(cat <<'EOF'
feat: add named physics collision layers (world/player) for Issue #12

Separates the player's own collider onto layer 2 ("player") from
static level geometry on layer 1 ("world"), so a later SpringArm3D
camera shape-cast can exclude the player's own capsule. No behavior
change for Player.gd's own move_and_slide() collision (driven by its
mask, unchanged) — verified via the existing Issue #11 regression test.
EOF
)"
```

---

### Task 2: Asset import + camera test geometry

**Files:**
- Create: `game/assets/buildings/kenney_castle-kit/wall.glb` (binary copy, CC0, see `godot_assets/MANIFEST.md`)
- Modify: `game/scenes/bootstrap.tscn`

**Interfaces:**
- Consumes: `collision_layer = 1` / `collision_mask = 0` convention from Task 1 (applied to the two new static bodies here).
- Produces: `CameraWall` node (real asset, bounding box 1.0 × 1.31 × 1.0 m, base pivot at local y=0) and `CameraThinObstacle` node (synthetic 0.15 m-thick box) in `bootstrap.tscn`, both on layer 1 — later tasks' `camera_rig_test.gd` references these two node names directly.

- [ ] **Step 1: Copy the asset into the tracked project**

```bash
mkdir -p game/assets/buildings/kenney_castle-kit
cp "godot_assets/buildings/kenney_castle-kit/Models/GLB format/wall.glb" game/assets/buildings/kenney_castle-kit/wall.glb
ls -la game/assets/buildings/kenney_castle-kit/wall.glb
```
Expected: file exists, ~16 KB (measured size of the source file).

- [ ] **Step 2: Add `ext_resource` for the wall and bump `load_steps`**

In `game/scenes/bootstrap.tscn`, change the header line:
```
[gd_scene load_steps=6 format=3]

[ext_resource type="PackedScene" path="res://scenes/Player.tscn" id="1_player"]
```
to:
```
[gd_scene load_steps=7 format=3]

[ext_resource type="PackedScene" path="res://scenes/Player.tscn" id="1_player"]
[ext_resource type="PackedScene" path="res://assets/buildings/kenney_castle-kit/wall.glb" id="2_wall"]
```

- [ ] **Step 3: Add a `BoxShape3D` sub-resource for the wall's collision and for the thin obstacle**

After the existing `[sub_resource type="BoxShape3D" id="BoxShape3D_obstacle"]` block, add:
```
[sub_resource type="BoxShape3D" id="BoxShape3D_camera_wall"]
size = Vector3(1.0, 1.31, 1.0)

[sub_resource type="BoxMesh" id="BoxMesh_camera_thin"]
size = Vector3(2.0, 2.0, 0.15)

[sub_resource type="BoxShape3D" id="BoxShape3D_camera_thin"]
size = Vector3(2.0, 2.0, 0.15)
```

- [ ] **Step 4: Add the `CameraWall` and `CameraThinObstacle` nodes**

After the existing `ObstacleCollision` node block at the end of `bootstrap.tscn`, append:
```
[node name="CameraWall" type="StaticBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 3.5)
collision_layer = 1
collision_mask = 0

[node name="CameraWallMesh" parent="CameraWall" instance=ExtResource("2_wall")]

[node name="CameraWallCollision" type="CollisionShape3D" parent="CameraWall"]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0.655, 0)
shape = SubResource("BoxShape3D_camera_wall")

[node name="CameraThinObstacle" type="StaticBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, -3.5, 1.0, 0)
collision_layer = 1
collision_mask = 0

[node name="CameraThinObstacleMesh" type="MeshInstance3D" parent="CameraThinObstacle"]
mesh = SubResource("BoxMesh_camera_thin")

[node name="CameraThinObstacleCollision" type="CollisionShape3D" parent="CameraThinObstacle"]
shape = SubResource("BoxShape3D_camera_thin")
```

Notes on the transforms (per the spec's own caveat — these are reasoned starting values, not yet visually verified in the editor, which happens in Task 6):
- `CameraWall` sits at world `(0, 0, 3.5)`, directly along the default (un-rotated) camera's rest direction behind the player spawn at `(0, 1, 0)` — within the default `spring_length` of 4.5 m, so it's hit without needing any `rotate_yaw()` call.
- `CameraWallCollision`'s `BoxShape3D` is offset `y = 0.655` (half of the mesh's 1.31 m height) because `wall.glb`'s own pivot is at its base (y=0→1.31), not centered, while `BoxShape3D` is centered on its node origin by default.
- `CameraThinObstacle` sits at world `(-3.5, 1.0, 0)`, along the player's local **-X** axis — reached by rotating the camera rig a quarter turn from its default orientation (see Task 4, Step where this is exercised). The exact sign of that quarter turn is reasoned from the spec's stated default-orientation convention but not yet empirically run; Task 4 verifies it for real and flips the sign if needed.

- [ ] **Step 5: Re-import and regression-check**

```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --import --quit-after 1000
echo "IMPORT EXIT: $?"
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/player_movement_test.gd
echo "TEST EXIT: $?"
```
Expected: `IMPORT EXIT: 0` (confirms `wall.glb` imports cleanly), `TEST EXIT: 0` with `ALL TESTS PASSED` (the new static geometry is far from the Issue #11 obstacle-collision test path along `+X` near the origin, so it must not interfere).

- [ ] **Step 6: Commit**

```bash
git add game/assets/buildings/kenney_castle-kit/wall.glb game/scenes/bootstrap.tscn
git commit -m "$(cat <<'EOF'
feat: import first real asset (Kenney wall.glb) and add camera test geometry

Copies wall.glb (CC0, godot_assets/MANIFEST.md) into the tracked
game/assets/ tree and adds two static test obstacles to bootstrap.tscn
(CameraWall: real asset, CameraThinObstacle: synthetic thin box) for
the upcoming camera-rig collision-avoidance tests (Issue #12). First
real-asset placement in the project — also gives a first scale
reference for the player capsule against Kenney-kit geometry.
EOF
)"
```

---

### Task 3: `CameraRig.tscn` + `CameraRig.gd` core (follow, smoothing, collision) + `camera_rig_test.gd`

**Files:**
- Create: `game/scenes/CameraRig.tscn`
- Create: `game/scripts/camera/CameraRig.gd`
- Create: `game/tests/camera_rig_test.gd`
- Modify: `game/scenes/bootstrap.tscn`

**Interfaces:**
- Consumes: `collision_layer`/`collision_mask` convention from Task 1; `CameraWall` node from Task 2 (for the clipping test).
- Produces: `CameraRig` (`Node3D`, script `CameraRig.gd`) with `@export var target: CharacterBody3D`, `@export var pivot_height/spring_length/collision_margin/camera_collision_radius/position_smoothing: float`, `@onready var spring_arm: SpringArm3D`, `@onready var camera: Camera3D`. Task 4 adds `rotate_yaw(delta_rad: float)`/`rotate_pitch(delta_rad: float)` and `initial_pitch_deg/pitch_min_deg/pitch_max_deg` to this same script — those names are reserved now so Task 4 doesn't drift.

- [ ] **Step 1: Write the failing test file**

Create `game/tests/camera_rig_test.gd`:

```gdscript
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
		# CameraWall AABB: x in [-0.5,0.5], y in [0,1.31], z in [3.0,4.0] (1m box centered at x=0,z=3.5)
		if cam_pos.x > -0.5 and cam_pos.x < 0.5 and cam_pos.y > 0.0 and cam_pos.y < 1.31 and cam_pos.z > 3.0 and cam_pos.z < 4.0:
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
		print("ALL TESTS PASSED")
		quit(0)
```

- [ ] **Step 2: Run it and confirm it fails for the right reason**

```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/camera_rig_test.gd
echo "EXIT: $?"
```
Expected:
```
ERROR: FAIL: no 'CameraRig' node found under scenes/bootstrap.tscn root
EXIT: 1
```

- [ ] **Step 3: Create `game/scenes/CameraRig.tscn`**

```
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/camera/CameraRig.gd" id="1_script"]

[node name="CameraRig" type="Node3D"]
script = ExtResource("1_script")

[node name="SpringArm3D" type="SpringArm3D" parent="."]

[node name="Camera3D" type="Camera3D" parent="SpringArm3D"]
current = true
```

- [ ] **Step 4: Create `game/scripts/camera/CameraRig.gd` (follow + collision only — rotation API added in Task 4)**

```gdscript
extends Node3D

## Issue #12 — Third-Person-Kamera-Rig. Folgt `target` per Lerp/Smoothing
## (kein 1:1-Parenting) und vermeidet Wand-/Gebäude-Clipping über den
## Shape-Cast des SpringArm3D-Kindknotens. rotate_yaw()/rotate_pitch()
## (input-quellenunabhängige öffentliche API) werden in einem Folge-Task
## ergänzt — dieses Skript verdrahtet bewusst KEINEN Input-Listener.

@export var target: CharacterBody3D
@export var pivot_height: float = 0.7
@export var spring_length: float = 4.5
@export var collision_margin: float = 0.3
@export var camera_collision_radius: float = 0.2
@export var position_smoothing: float = 8.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

func _ready() -> void:
	if target == null:
		push_error("CameraRig: 'target' ist nicht gesetzt — Rig kann der Spielfigur nicht folgen.")
		return

	spring_arm.spring_length = spring_length
	spring_arm.margin = collision_margin
	spring_arm.collision_mask = 1 # Layer "world" — Layer "player" bewusst ausgeschlossen

	var cast_shape := SphereShape3D.new()
	cast_shape.radius = camera_collision_radius
	spring_arm.shape = cast_shape # Shape-Cast statt Default-Raycast: vermeidet Tunneling

	# Erstes Frame ohne Smoothing direkt auf die Zielfigur springen.
	global_position = target.global_position + Vector3.UP * pivot_height

func _physics_process(delta: float) -> void:
	if target == null:
		return

	var desired_position: Vector3 = target.global_position + Vector3.UP * pivot_height
	var factor: float = clampf(1.0 - exp(-position_smoothing * delta), 0.0, 1.0)
	global_position = global_position.lerp(desired_position, factor)
```

- [ ] **Step 5: Wire `CameraRig` into `bootstrap.tscn`, remove the old static camera**

In `game/scenes/bootstrap.tscn`, change the header (building on Task 2's `load_steps=7`):
```
[gd_scene load_steps=7 format=3]

[ext_resource type="PackedScene" path="res://scenes/Player.tscn" id="1_player"]
[ext_resource type="PackedScene" path="res://assets/buildings/kenney_castle-kit/wall.glb" id="2_wall"]
```
to:
```
[gd_scene load_steps=8 format=3]

[ext_resource type="PackedScene" path="res://scenes/Player.tscn" id="1_player"]
[ext_resource type="PackedScene" path="res://assets/buildings/kenney_castle-kit/wall.glb" id="2_wall"]
[ext_resource type="PackedScene" path="res://scenes/CameraRig.tscn" id="3_camera_rig"]
```

Remove this entire block:
```
[node name="Camera3D" type="Camera3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 0.857493, 0.514496, 0, -0.514496, 0.857493, 0, 3, 6)
current = true
```

Add, after the `Player` node block:
```
[node name="CameraRig" parent="." instance=ExtResource("3_camera_rig")]
target = NodePath("../Player")
```

- [ ] **Step 6: Re-import, run the new test, confirm it passes**

```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --import --quit-after 1000
echo "IMPORT EXIT: $?"
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/camera_rig_test.gd
echo "TEST EXIT: $?"
```
Expected: `IMPORT EXIT: 0`, then PASS lines for `bootstrap integration`, `follow settle`, `no-hindrance baseline`, `CameraWall clipping avoidance`, `no self-collision`, `smoothing (not 1:1)`, `convergence after teleport`, then `ALL TESTS PASSED` / `TEST EXIT: 0`. If the `CameraWall clipping avoidance` or `no-hindrance baseline` checks fail, the most likely cause is the default-orientation-faces-`+Z` assumption from the spec being backwards for this Godot version — flip the `rotate_yaw(PI)` direction or the `CameraWall` z-coordinate sign and re-run; do not change the assertions themselves to make a wrong geometry pass.

- [ ] **Step 7: Regression-check Issue #11's test**

```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/player_movement_test.gd
echo "TEST EXIT: $?"
```
Expected: `ALL TESTS PASSED`, `TEST EXIT: 0`, unchanged from Task 1/2.

- [ ] **Step 8: Commit**

```bash
git add game/scenes/CameraRig.tscn game/scripts/camera/CameraRig.gd game/tests/camera_rig_test.gd game/scenes/bootstrap.tscn
git commit -m "$(cat <<'EOF'
feat: add CameraRig follow + collision-avoidance core (Issue #12)

Decoupled CameraRig.tscn (SpringArm3D + Camera3D, not parented to
Player) follows the player with exponential position smoothing and
avoids clipping through level geometry via a SphereShape3D shape-cast
on a separate physics layer. Replaces bootstrap.tscn's static debug
Camera3D. Verified headless: follow/smoothing/convergence, clipping
avoidance against the real wall.glb asset, and exclusion of the
player's own collider from the shape-cast (game/tests/camera_rig_test.gd).
Rotation API (rotate_yaw/rotate_pitch) follows in a separate commit.
EOF
)"
```

---

### Task 4: `rotate_yaw()`/`rotate_pitch()` + pitch clamping + tunneling test

**Files:**
- Modify: `game/scripts/camera/CameraRig.gd`
- Modify: `game/tests/camera_rig_test.gd`

**Interfaces:**
- Consumes: `spring_arm: SpringArm3D` (`@onready`, from Task 3), `CameraThinObstacle` node (from Task 2).
- Produces: `rotate_yaw(delta_rad: float) -> void`, `rotate_pitch(delta_rad: float) -> void` on `CameraRig` — this is the exact public API Issue #13 will later bind an input source to.

- [ ] **Step 1: Extend `CameraRig.gd` with the rotation fields and methods**

In `game/scripts/camera/CameraRig.gd`, change:
```gdscript
@export var position_smoothing: float = 8.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

func _ready() -> void:
```
to:
```gdscript
@export var position_smoothing: float = 8.0
@export var initial_pitch_deg: float = -15.0
@export var pitch_min_deg: float = -40.0
@export var pitch_max_deg: float = 60.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

var _pitch: float = 0.0

func rotate_yaw(delta_rad: float) -> void:
	rotation.y += delta_rad

func rotate_pitch(delta_rad: float) -> void:
	_pitch = clampf(_pitch + delta_rad, deg_to_rad(pitch_min_deg), deg_to_rad(pitch_max_deg))
	spring_arm.rotation.x = _pitch

func _ready() -> void:
```

Then, inside `_ready()`, change:
```gdscript
	var cast_shape := SphereShape3D.new()
	cast_shape.radius = camera_collision_radius
	spring_arm.shape = cast_shape # Shape-Cast statt Default-Raycast: vermeidet Tunneling

	# Erstes Frame ohne Smoothing direkt auf die Zielfigur springen.
	global_position = target.global_position + Vector3.UP * pivot_height
```
to:
```gdscript
	var cast_shape := SphereShape3D.new()
	cast_shape.radius = camera_collision_radius
	spring_arm.shape = cast_shape # Shape-Cast statt Default-Raycast: vermeidet Tunneling

	_pitch = deg_to_rad(initial_pitch_deg)
	spring_arm.rotation.x = _pitch

	# Erstes Frame ohne Smoothing direkt auf die Zielfigur springen.
	global_position = target.global_position + Vector3.UP * pivot_height
```

- [ ] **Step 2: Extend `camera_rig_test.gd` with pitch-clamp, yaw, and tunneling tests**

In `game/tests/camera_rig_test.gd`, change the final block:
```gdscript
		print("PASS convergence after teleport: camera_rig.x=%f (within %fm of target)" % [camera_rig.global_position.x, FOLLOW_TOLERANCE])
		print("ALL TESTS PASSED")
		quit(0)
```
to:
```gdscript
		print("PASS convergence after teleport: camera_rig.x=%f (within %fm of target)" % [camera_rig.global_position.x, FOLLOW_TOLERANCE])

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
		# CameraThinObstacle sits along -X from spawn. Rotate to face it.
		if frame == 1:
			camera_rig.rotation.y = 0.0 # reset to default orientation first
			camera_rig.rotate_yaw(PI / 2.0) # quarter turn toward -X; flip sign here if geometry says otherwise (see Task 3 note)
			return
		if frame < 1 + SETTLE_FRAMES:
			return
		var hit_length: float = spring_arm.get_hit_length()
		if hit_length >= SPRING_LENGTH - SPRING_LENGTH_TOLERANCE:
			push_error("FAIL: get_hit_length()=%f facing the 0.15m CameraThinObstacle, expected < %f (thin-geometry tunneling avoidance)" % [hit_length, SPRING_LENGTH])
			quit(1)
			return
		print("PASS thin-geometry tunneling avoidance: get_hit_length()=%f facing CameraThinObstacle" % hit_length)
		print("ALL TESTS PASSED")
		quit(0)
```

- [ ] **Step 3: Re-import, run, confirm all phases pass**

```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --import --quit-after 1000
echo "IMPORT EXIT: $?"
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/camera_rig_test.gd
echo "TEST EXIT: $?"
```
Expected: all PASS lines from Task 3 plus `PASS pitch clamping`, `PASS yaw rotation`, `PASS thin-geometry tunneling avoidance`, then `ALL TESTS PASSED` / `TEST EXIT: 0`. As flagged in Task 3 Step 6: if `tunneling_thin_obstacle` fails because the camera ends up facing empty space instead of `CameraThinObstacle`, flip the sign of the `PI / 2.0` rotation (or move `CameraThinObstacle` to `+X` instead of `-X` in `bootstrap.tscn`) and re-run — do not weaken the assertion.

- [ ] **Step 4: Regression-check Issue #11's test one more time**

```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --headless --path game --script res://tests/player_movement_test.gd
echo "TEST EXIT: $?"
```
Expected: `ALL TESTS PASSED`, `TEST EXIT: 0`.

- [ ] **Step 5: Commit**

```bash
git add game/scripts/camera/CameraRig.gd game/tests/camera_rig_test.gd
git commit -m "$(cat <<'EOF'
feat: add CameraRig rotate_yaw()/rotate_pitch() API (Issue #12)

Input-source-agnostic orbit API (no listener registered — Issue #13
binds an actual input source later) with clamped pitch to prevent
overshoot/ground-clipping. Adds a dedicated headless test against the
thin synthetic CameraThinObstacle to cover the DoD's "no tunneling
through thin geometry" criterion separately from the thicker
CameraWall clipping test.
EOF
)"
```

---

### Task 5: CI integration

**Files:**
- Modify: `.github/workflows/godot-validate.yml`

**Interfaces:**
- Consumes: `game/tests/camera_rig_test.gd` (Tasks 3-4), `game/tests/player_movement_test.gd` (existing).
- Produces: a CI gate that fails the PR if either headless test regresses.

- [ ] **Step 1: Add the new CI step**

In `.github/workflows/godot-validate.yml`, change:
```yaml
      - name: Run player movement behavior test (headless)
        run: |
          GODOT_BIN="$HOME/godot-editor/Godot_v${GODOT_VERSION}_linux.x86_64"
          "$GODOT_BIN" --headless --path game --script res://tests/player_movement_test.gd
```
to:
```yaml
      - name: Run player movement behavior test (headless)
        run: |
          GODOT_BIN="$HOME/godot-editor/Godot_v${GODOT_VERSION}_linux.x86_64"
          "$GODOT_BIN" --headless --path game --script res://tests/player_movement_test.gd

      - name: Run camera rig behavior test (headless)
        run: |
          GODOT_BIN="$HOME/godot-editor/Godot_v${GODOT_VERSION}_linux.x86_64"
          "$GODOT_BIN" --headless --path game --script res://tests/camera_rig_test.gd
```

- [ ] **Step 2: Validate the YAML is well-formed**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/godot-validate.yml'))" && echo "YAML OK"
```
Expected: `YAML OK`, no exception.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/godot-validate.yml
git commit -m "$(cat <<'EOF'
ci: run camera rig behavior test in godot-validate.yml (Issue #12)

Mirrors the existing player-movement test step so the new headless
camera_rig_test.gd actually gates merges, not just local runs.
EOF
)"
```

---

### Task 6: Manual DoD verification (editor check, not automated)

**Files:** none changed — this task produces PR description content, not code.

- [ ] **Step 1: Open the project in the Godot editor**

```bash
.godot-editor/Godot.app/Contents/MacOS/Godot --path game
```

- [ ] **Step 2: Run the `bootstrap.tscn` scene (F6 or the "Run Current Scene" button) and visually confirm, recording the result for the PR description:**

- The camera follows the player when moving with `D` (and other directions if you temporarily test them) — no lag spikes, no sudden snapping.
- Approaching `CameraWall` (north of spawn) pulls the camera in instead of clipping through it.
- The `wall.glb` mesh renders at a plausible scale next to the player capsule (roughly chest-to-head height relative to the player, per the measured 1.31 m wall height vs. the player's 1.8 m capsule).
- No console errors/warnings during play.

- [ ] **Step 3: Take a screenshot or write a precise behavior description for the PR**

Save a screenshot (e.g. `docs/superpowers/specs/camera-rig-verification.png`, not committed if it's only needed for the PR description) or write 2-3 sentences describing exactly what was observed, per `docs/planning/definition-of-done.md` §(c) — "Szene tatsächlich geöffnet und geprüft", not just a `.tscn` diff taken on faith.

- [ ] **Step 4: No commit for this task** — its output (screenshot/description) goes directly into the PR body created after this plan's tasks are all done.

---

## Self-Review Notes

- **Spec coverage:** Architektur (Task 3), Komponenten/Felder/Methoden (Tasks 3-4), Kollisions-Layer-Setup (Task 1, used by Tasks 2-4), Tunable-Parameter (all `@export` fields across Tasks 3-4, no magic numbers), Testszene-Änderungen 1-7 (Tasks 2-3: asset import, both new nodes, `CameraRig.tscn`, `bootstrap.tscn` wiring, layer assignment, CI step in Task 5), Testplan 1-11 (Tasks 3-4 test phases map 1:1: follow=1, smoothing=2, convergence=3, no-hindrance=4, CameraWall clipping=5, thin tunneling=6, self-collision=7, pitch clamp=8, yaw=9, bootstrap integration=10, Issue #11 regression=11 re-checked at the end of every task), Verifikation/DoD 1-3 (import-check baked into every task's Step, editor-check Task 6, CI step Task 5).
- **Known open question, flagged not hidden:** the exact sign of the yaw rotation needed to face `CameraThinObstacle` (Task 4) and which direction is "behind" the player by default (Task 3's `no_hindrance`/`clipping_camera_wall` phases) are reasoned from the spec's stated convention, not empirically run — Tasks 3 and 4 explicitly call out the flip-the-sign fallback rather than presenting false certainty.
