extends Node3D
## Mittelalter-/Wittenberg-Blockout-Testwelt (Issue #25).
## Baut aus den freigegebenen Assets eine kleine, begehbar angelegte Umgebung:
## Boden, Gebäudegruppe, Prop-Gruppe, ein Kollisions-Testbereich (echte
## Trimesh-Kollision) und ein Audio-Testknoten. KEIN fertiger Vertical Slice —
## ein Integrations-/Blockout-Nachweis.

const KENNEY := "res://assets/third_party/kenney/castle-kit/"
const POLY := "res://assets/third_party/polypizza/"
const KAY := "res://assets/third_party/kaykit/medieval-hexagon/"
const OGA := "res://assets/third_party/opengameart/"
const MUSIC := "res://assets/audio/music/TownTheme.mp3"
const SWORD := "res://assets/audio/sfx/oga-sword/sword.1.ogg"

# Von asset_integration_test.gd ausgewertet:
var building_count := 0
var prop_count := 0
var collision_bodies := 0
var audio_players := 0

func _ready() -> void:
	_build_ground()
	_build_buildings()
	_build_props()
	_build_collision_area()
	_build_audio()
	print("[world] Gebäude=%d Props=%d Kollisionskörper=%d Audio=%d" %
		[building_count, prop_count, collision_bodies, audio_players])

func _load_model(path: String) -> Node3D:
	if not ResourceLoader.exists(path):
		push_error("[world] Ressource fehlt: " + path)
		return null
	var res := load(path)
	if res is PackedScene:
		return (res as PackedScene).instantiate() as Node3D
	if res is Mesh:
		var mi := MeshInstance3D.new()
		mi.mesh = res
		return mi
	push_error("[world] Unbekannter Ressourcentyp: " + path)
	return null

func _place(path: String, pos: Vector3, rot_y_deg := 0.0) -> Node3D:
	var n := _load_model(path)
	if n == null:
		return null
	add_child(n)
	n.position = pos
	n.rotation.y = deg_to_rad(rot_y_deg)
	return n

func _build_ground() -> void:
	var body := StaticBody3D.new()
	body.name = "Ground"
	var col := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(48, 0.2, 48)
	col.shape = box
	col.position = Vector3(0, -0.1, 0)
	body.add_child(col)
	var mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(48, 48)
	mi.mesh = pm
	body.add_child(mi)
	add_child(body)
	collision_bodies += 1

func _build_buildings() -> void:
	var placed := [
		_place(POLY + "church.glb", Vector3(-8, 0, -6), 20.0),
		_place(POLY + "gothic/Cathedral.glb", Vector3(8, 0, -9)),
		_place(POLY + "gothic/Castle.glb", Vector3(0, 0, -14)),
		_place(POLY + "temple.glb", Vector3(14, 0, -4)),
		_place(KENNEY + "wall.glb", Vector3(-4, 0, 2)),
		_place(KENNEY + "wall-corner.glb", Vector3(-6, 0, 2)),
		_place(KENNEY + "gate.glb", Vector3(-2, 0, 2)),
		_place(KENNEY + "tower-square.glb", Vector3(-8, 0, 2)),
	]
	for n in placed:
		if n != null:
			building_count += 1

func _build_props() -> void:
	var placed := [
		_place(KAY + "crate_long_A.gltf", Vector3(2, 0, 3)),
		_place(KAY + "resource_stone.gltf", Vector3(3.5, 0, 3)),
		_place(KAY + "ladder.gltf", Vector3(5, 0, 3)),
		_place(KAY + "flag_red.gltf", Vector3(6.5, 0, 3)),
		_place(KENNEY + "flag.glb", Vector3(8, 0, 3)),
		_place(OGA + "knight/KnightCharacter.obj", Vector3(0, 0, 4)),
	]
	for n in placed:
		if n != null:
			prop_count += 1

## Kollisions-Testbereich: ein Gebäude mit echter (Trimesh-)Kollision, damit
## mindestens eine exemplarische Umgebung kollidierbar ist.
func _build_collision_area() -> void:
	var model := _place(KENNEY + "tower-square.glb", Vector3(10, 0, 4))
	if model == null:
		return
	var before := collision_bodies
	for mi in model.find_children("*", "MeshInstance3D", true, false):
		(mi as MeshInstance3D).create_trimesh_collision()
		collision_bodies += 1
	if collision_bodies == before:
		# Fallback: einfacher Box-Kollider, falls das Modell keine MeshInstance3D exponiert
		var body := StaticBody3D.new()
		var col := CollisionShape3D.new()
		var box := BoxShape3D.new()
		box.size = Vector3(1.5, 3.0, 1.5)
		col.shape = box
		body.add_child(col)
		body.position = Vector3(10, 1.5, 4)
		add_child(body)
		collision_bodies += 1

func _build_audio() -> void:
	var music := AudioStreamPlayer.new()
	music.name = "Music"
	if ResourceLoader.exists(MUSIC):
		var s := load(MUSIC)
		if s is AudioStream:
			music.stream = s
	add_child(music)
	audio_players += 1

	var sfx := AudioStreamPlayer.new()
	sfx.name = "SwordSfx"
	if ResourceLoader.exists(SWORD):
		var s := load(SWORD)
		if s is AudioStream:
			sfx.stream = s
	add_child(sfx)
	audio_players += 1
