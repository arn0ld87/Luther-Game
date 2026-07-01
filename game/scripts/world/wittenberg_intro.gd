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

## Flache Farbmaterialien für Assets ohne Texturen: Die OBJ/MTL-Exporte der
## RPG-Charaktere (und der Ritter) referenzieren keine Texturen (kein map_Kd),
## sie rendern sonst neutralgrau. Reihenfolge = Surface-Reihenfolge des Meshes.
## Boden bewusst hell + warm gewählt: Filmic-Tonemap dunkelt Mitteltöne ab und das
## bläuliche Sky-Ambient erzeugt sonst einen Blaustich — warmes Sand-Albedo (~R>G>B)
## bei hoher Helligkeit hält den Kirchenvorplatz lesbar.
const COLOR_GROUND := Color(0.55, 0.47, 0.36)
const NPC_COLORS := {
	"cleric": [Color(0.91, 0.87, 0.76), Color(0.45, 0.30, 0.18)],
	"wizard": [Color(0.27, 0.33, 0.62), Color(0.50, 0.36, 0.20)],
	"warrior": [Color(0.56, 0.23, 0.18), Color(0.36, 0.34, 0.31)],
	"knight": [Color(0.58, 0.60, 0.64), Color(0.35, 0.30, 0.25)],
	"monk": [Color(0.35, 0.25, 0.16)],
}

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
	_tint_player()
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
		{"qid": 1, "pos": Vector3(-4, 0, -6), "npc": OGA + "rpg-characters/Cleric.obj", "tint": "cleric"},
		{"qid": 2, "pos": Vector3(0, 0, -6), "npc": OGA + "rpg-characters/Wizard.obj", "tint": "wizard"},
		{"qid": 3, "pos": Vector3(4, 0, -6), "npc": OGA + "rpg-characters/Warrior.obj", "tint": "warrior"},
	]
	for s in stations:
		var trigger := trigger_scene.instantiate() as QuestStationTrigger
		trigger.question_id_override = int(s["qid"])
		add_child(trigger)
		trigger.position = s["pos"] as Vector3
		var npc := _load_model(s["npc"] as String)
		if npc != null:
			_tint(npc, s["tint"] as String)
			trigger.add_child(npc)
		quest_station_count += 1

func _tint(model: Node3D, palette_key: String) -> void:
	## Surface-Override-Materialien für texturlose Modelle (siehe NPC_COLORS).
	var colors: Array = NPC_COLORS.get(palette_key, [])
	if colors.is_empty():
		return
	var targets := model.find_children("*", "MeshInstance3D", true, false)
	if model is MeshInstance3D:
		targets.append(model)
	for child in targets:
		var mi := child as MeshInstance3D
		if mi.mesh == null:
			continue
		# Surface-Reihenfolge muss zur Palette passen (siehe Kommentar am NPC_COLORS-Block):
		# OBJ/MTL-Re-Exports können die Materialreihenfolge ändern → stille Fehlfärbung.
		# Warnung macht das beim Asset-Update sichtbar; Modulo-Wrap ist Fallback.
		var sc := mi.mesh.get_surface_count()
		if colors.size() > 1 and sc != colors.size():
			push_warning("[wittenberg_intro] %s: %d Surfaces, Palette '%s' hat %d Farben — Indizes prüfen" %
				[model.name, sc, palette_key, colors.size()])
		for s in mi.mesh.get_surface_count():
			var mat := StandardMaterial3D.new()
			mat.albedo_color = colors[s % colors.size()]
			mat.roughness = 1.0
			mi.set_surface_override_material(s, mat)

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
	## AABB World-Space über die echten Mesh-Vertices, mit Ausreißer-Filter:
	## Manche Dritt-Assets (z.B. polypizza/church.glb) haben degenerierte Meshes,
	## deren Vertices über einen riesigen Bereich verstreut sind (x/z=±56, y=138),
	## die AABB also das gesamte Level überdeckt und den Player am Bodenkontakt
	## hindert. Wir behalten nur Vertices, die (a) plausible Höhe haben (y∈[0,25])
	## und (b) innerhalb MAX_RADIUS um den Model-Ursprung liegen — das liefert die
	## echte kompakte Gebäudegröße und fängt degenerierte Assets pro-Modell ab.
	const MAX_RADIUS := 20.0  # plausible max. Gebäude-Ausdehnung um den Ursprung
	const MAX_HEIGHT := 25.0
	var origin := model.global_position
	var aabb := AABB()
	var first := true
	for mi in model.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		if m.mesh == null:
			continue
		var mdt := MeshDataTool.new()
		for s in range(m.mesh.get_surface_count()):
			if mdt.create_from_surface(m.mesh, s) != OK:
				push_warning("[wittenberg_intro] create_from_surface fehlgeschlagen: %s surface %d" %
					[m.name, s])
				continue
			for v in range(mdt.get_vertex_count()):
				var world_p := m.global_transform * mdt.get_vertex(v)
				if world_p.y < 0.0 or world_p.y > MAX_HEIGHT:
					continue
				if (world_p - origin).length() > MAX_RADIUS:
					continue
				if first:
					aabb = AABB(world_p, Vector3.ZERO)
					first = false
				else:
					aabb = aabb.expand(world_p)
			mdt.clear()

	if first:
		push_warning("[wittenberg_intro] Modell ohne plausible Vertices: " + model.name)
		return

	# Degenerierte AABBs überspringen: Tritt auf, wenn ein Asset nur innerhalb des
	# Radius einen flachen Boden-Plane bringt (z.B. church.glb: Wände sind Ausreißer
	# außerhalb MAX_RADIUS, nur der Boden bleibt → size.y≈0). Eine flache Box bei
	# y=0 würde den Kirchenvorplatz blockieren und den Zugang zu Quest-Stationen
	# versperren. Lieber keine Collision als eine falsche. Schmale Boxen (z.B. das
	# schmale Stadttor, size.x≈0.15) sind legitim und bleiben erhalten.
	if aabb.size.y < 0.5:
		push_warning("[wittenberg_intro] Degenerierte AABB übersprungen: %s size=%s" %
			[model.name, aabb.size])
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
	# aabb ist World-Space (achsenaligniert, siehe Kommentar am Dateikopf). Das
	# Collision-Body MUSS daher unter dem Level-Root hängen — als Child des
	# (ggf. rotierten/verschobenen) Models würde model.transform die World-
	# Position ein zweites Mal aufgeschlagen und die Box am falschen Ort landen
	# (ursprünglicher Bug: Spawn-Punkt lag in der doppelt-verschobenen Church-Box,
	# Player fiel durchs Level). Level-Root hat Identity-Transform.
	body.position = aabb.position + aabb.size / 2.0
	add_child(body)
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
	var ground_mat := StandardMaterial3D.new()
	ground_mat.albedo_color = COLOR_GROUND
	ground_mat.roughness = 1.0
	pm.material = ground_mat
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
	if placed[3] != null:
		_tint(placed[3], "knight")
	for n in placed:
		if n != null:
			prop_count += 1

func _tint_player() -> void:
	## Der monk.glb-Export bringt kein Material mit — Luther bekommt seine
	## braune Augustinerkutte per Override, ohne Player.tscn anzufassen.
	var player := get_node_or_null("Player") as Node3D
	if player != null:
		_tint(player, "monk")

func _build_audio() -> void:
	var music := AudioStreamPlayer.new()
	music.name = "AmbientMusic"
	if ResourceLoader.exists(MUSIC):
		var s := load(MUSIC)
		if s is AudioStream:
			music.stream = s
	add_child(music)
