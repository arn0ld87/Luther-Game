extends Node3D
## Wittenberg — Intro-Level (M1).
## Erstes echtes, begehbares Spiel-Level: Kirchenvorplatz mit Schlosskirche,
## Stadtmauer und Spawn-Punkt für Luther. Alle Gebäude bekommen eine
## achsenalignierte Box-Kollision über ihre World-Space-AABB, damit der Player
## nicht durch Geometrie laufen kann (deutlich effizienter als Trimesh pro Mesh).

const KENNEY := "res://assets/third_party/kenney/castle-kit/"
const POLY := "res://assets/third_party/polypizza/"
const KAY := "res://assets/third_party/kaykit/medieval-hexagon/"
const OGA := "res://assets/third_party/opengameart/"
const MUSIC := "res://assets/audio/music/TownTheme.mp3"
const DEBATE_TRIGGER := "res://scenes/world/QuestStationTrigger.tscn"

const LEVEL_SIZE := 60.0

var building_count := 0
var prop_count := 0
var collision_bodies := 0
var quest_station_count := 0

func _ready() -> void:
	_build_ground()
	_build_walls()
	_build_church_area()
	_build_props()
	_build_quest_stations()
	_build_audio()
	print("[wittenberg_intro] Gebäude=%d Props=%d Kollisionskörper=%d Quest-Stationen=%d" %
		[building_count, prop_count, collision_bodies, quest_station_count])


func _build_quest_stations() -> void:
	# Drei begehbare Debatten-Stationen (Issue #16) auf dem Kirchenvorplatz. Jede trägt
	# einen sichtbaren Gesprächspartner (katalogisiertes Asset) und öffnet beim Betreten
	# die Debatten-UI zur verknüpften Theologie-Frage (question_id_override 1/2/3).
	# Zählt bewusst separat — bricht die M1-Zählungen (Gebäude/Props/Kollision) nicht.
	var trigger_scene := load(DEBATE_TRIGGER) as PackedScene
	if trigger_scene == null:
		push_error("[wittenberg_intro] QuestStationTrigger-Szene fehlt: " + DEBATE_TRIGGER)
		return
	var stations := [
		{"qid": 1, "pos": Vector3(-4, 0, -6), "npc": OGA + "rpg-characters/Cleric.obj"},
		{"qid": 2, "pos": Vector3(0, 0, -6), "npc": OGA + "rpg-characters/Wizard.obj"},
		{"qid": 3, "pos": Vector3(4, 0, -6), "npc": OGA + "rpg-characters/Warrior.obj"},
	]
	for s in stations:
		var trigger := trigger_scene.instantiate() as Area3D
		trigger.set("question_id_override", int(s["qid"]))
		add_child(trigger)
		trigger.position = s["pos"] as Vector3
		var npc := _load_model(s["npc"] as String)
		if npc != null:
			trigger.add_child(npc)
		quest_station_count += 1

func _load_model(path: String) -> Node3D:
	if not ResourceLoader.exists(path):
		push_error("[wittenberg_intro] Ressource fehlt: " + path)
		return null
	var res := load(path)
	if res == null:
		push_error("[wittenberg_intro] Ressource konnte nicht geladen werden: " + path)
		return null
	if res is PackedScene:
		return (res as PackedScene).instantiate() as Node3D
	if res is Mesh:
		var mi := MeshInstance3D.new()
		mi.mesh = res
		return mi
	push_error("[wittenberg_intro] Unbekannter Ressourcentyp: " + path)
	return null

func _place(path: String, pos: Vector3, rot_y_deg := 0.0) -> Node3D:
	var n := _load_model(path)
	if n == null:
		return null
	add_child(n)
	n.position = pos
	n.rotation.y = deg_to_rad(rot_y_deg)
	return n

func _add_box_collision(model: Node3D) -> void:
	var aabb := AABB()
	var first := true
	for mi in model.find_children("*", "MeshInstance3D", true, false):
		var mesh_aabb := (mi as MeshInstance3D).mesh.get_aabb()
		var global_aabb := (mi as MeshInstance3D).global_transform * mesh_aabb
		if first:
			aabb = global_aabb
			first = false
		else:
			aabb = aabb.merge(global_aabb)

	if first:
		push_warning("[wittenberg_intro] Modell ohne MeshInstance3D: " + model.name)
		return

	var body := StaticBody3D.new()
	body.name = "Collision_%s" % model.name
	body.collision_layer = 1
	body.collision_mask = 0
	var col := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = aabb.size
	col.shape = box
	body.add_child(col)
	body.position = aabb.position + aabb.size / 2.0
	model.add_child(body)
	collision_bodies += 1

func _build_ground() -> void:
	var body := StaticBody3D.new()
	body.name = "Ground"
	body.collision_layer = 1
	body.collision_mask = 0
	var col := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(LEVEL_SIZE, 0.2, LEVEL_SIZE)
	col.shape = box
	col.position = Vector3(0, -0.1, 0)
	body.add_child(col)
	var mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(LEVEL_SIZE, LEVEL_SIZE)
	mi.mesh = pm
	body.add_child(mi)
	add_child(body)
	collision_bodies += 1

func _build_walls() -> void:
	## Stadtmauer als Level-Begrenzung (drei Seiten, vorne offen für den Vorplatz).
	var half := LEVEL_SIZE / 2.0
	var wall_models := [
		[KENNEY + "wall.glb", Vector3(-half + 2, 0, -half + 2), 0.0],
		[KENNEY + "wall.glb", Vector3(-half + 6, 0, -half + 2), 0.0],
		[KENNEY + "wall-corner.glb", Vector3(-half + 10, 0, -half + 2), 0.0],
		[KENNEY + "wall.glb", Vector3(-half + 2, 0, half - 2), 0.0],
		[KENNEY + "wall.glb", Vector3(-half + 6, 0, half - 2), 0.0],
		[KENNEY + "wall-corner.glb", Vector3(-half + 10, 0, half - 2), -90.0],
	]
	for w in wall_models:
		var model := _place(w[0], w[1], w[2])
		if model != null:
			_add_box_collision(model)
			building_count += 1

	# Ecktürme an den beiden hinteren Ecken
	var towers := [
		[KENNEY + "tower-square.glb", Vector3(-half + 2, 0, -half + 10), 0.0],
		[KENNEY + "tower-square.glb", Vector3(-half + 2, 0, half - 10), 0.0],
	]
	for t in towers:
		var model := _place(t[0], t[1], t[2])
		if model != null:
			_add_box_collision(model)
			building_count += 1

func _build_church_area() -> void:
	## Schlosskirche als zentrales Gebäude am hinteren Ende.
	var church := _place(POLY + "church.glb", Vector3(-5, 0, -20), 15.0)
	if church != null:
		_add_box_collision(church)
		building_count += 1

	var cathedral := _place(POLY + "gothic/Cathedral.glb", Vector3(8, 0, -18), -10.0)
	if cathedral != null:
		_add_box_collision(cathedral)
		building_count += 1

	var gate := _place(KENNEY + "gate.glb", Vector3(0, 0, -12), 0.0)
	if gate != null:
		_add_box_collision(gate)
		building_count += 1

func _build_props() -> void:
	var placed := [
		_place(KAY + "crate_long_A.gltf", Vector3(4, 0, 4)),
		_place(KAY + "resource_stone.gltf", Vector3(6, 0, 5)),
		_place(KENNEY + "flag.glb", Vector3(-6, 0, 8), 20.0),
		_place(OGA + "knight/KnightCharacter.obj", Vector3(2, 0, 8), -30.0),
	]
	for n in placed:
		if n != null:
			prop_count += 1

func _build_audio() -> void:
	var music := AudioStreamPlayer.new()
	music.name = "AmbientMusic"
	if ResourceLoader.exists(MUSIC):
		var s := load(MUSIC)
		if s is AudioStream:
			music.stream = s
	add_child(music)
