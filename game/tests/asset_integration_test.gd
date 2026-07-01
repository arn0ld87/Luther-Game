extends SceneTree
## Headless-Integrationstest für den Asset-Import/-Katalog (Issue #25). Aufruf:
##   godot --headless --path game --script res://tests/asset_integration_test.gd
## Exit 0 + "ALL TESTS PASSED" bei Erfolg; Exit 1 + FAIL-Zeile bei der ersten
## verletzten Zusage. Kein Test-Framework — self-contained SceneTree-Skript,
## im Stil von tests/player_movement_test.gd / camera_rig_test.gd.

const CATALOG_PATH := "res://resources/asset_catalog/asset_catalog.json"
const GALLERY := "res://scenes/dev/asset_gallery.tscn"
const WORLD := "res://scenes/world/asset_integration_test_world.tscn"

func _fail(msg: String) -> void:
	push_error("FAIL: " + msg)
	quit(1)

func _initialize() -> void:
	# 1) Katalog vorhanden und valide
	if not FileAccess.file_exists(CATALOG_PATH):
		_fail("Katalog fehlt: " + CATALOG_PATH)
		return
	var parsed = JSON.parse_string(FileAccess.open(CATALOG_PATH, FileAccess.READ).get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY or not parsed.has("assets"):
		_fail("Katalog ungültig")
		return
	var assets: Array = parsed["assets"]
	if assets.is_empty():
		_fail("Katalog leer")
		return

	# 2) Jede katalogisierte Ressource existiert und lädt (kein pinkes/fehlendes Asset)
	var models := 0
	var audios := 0
	for a in assets:
		var path := String(a.get("path", ""))
		if not ResourceLoader.exists(path):
			_fail("Katalog-Ressource fehlt im Projekt: " + path)
			return
		var res := load(path)
		if res == null:
			_fail("Katalog-Ressource lädt als null: " + path)
			return
		var kind := String(a.get("kind", ""))
		if kind == "model":
			if not (res is PackedScene or res is Mesh):
				_fail("Modell hat unerwarteten Typ (%s): %s" % [res.get_class(), path])
				return
			models += 1
		elif kind == "audio":
			if not (res is AudioStream):
				_fail("Audio hat unerwarteten Typ (%s): %s" % [res.get_class(), path])
				return
			audios += 1
	print("PASS Katalog: %d Modelle + %d Audio geladen, alle Ressourcen vorhanden" % [models, audios])

	# 3) Asset-Galerie lädt und platziert alle Modelle ohne fehlende
	var gallery_scene: PackedScene = load(GALLERY)
	if gallery_scene == null:
		_fail("Galerie-Szene lädt nicht: " + GALLERY)
		return
	var gallery := gallery_scene.instantiate()
	root.add_child(gallery)
	await process_frame # _ready wird in diesem SceneTree-Kontext verzögert ausgeführt
	if int(gallery.missing_count) != 0:
		_fail("Galerie meldet %d fehlende Modelle" % int(gallery.missing_count))
		return
	if int(gallery.placed_count) != int(gallery.model_total) or int(gallery.placed_count) == 0:
		_fail("Galerie platzierte %d von %d Modellen" % [int(gallery.placed_count), int(gallery.model_total)])
		return
	print("PASS Galerie: %d Modelle platziert, 0 fehlend" % int(gallery.placed_count))

	# 4) Testwelt baut Gebäude-, Prop-, Kollisions- und Audiogruppen auf
	var world_scene: PackedScene = load(WORLD)
	if world_scene == null:
		_fail("Testwelt-Szene lädt nicht: " + WORLD)
		return
	var world := world_scene.instantiate()
	root.add_child(world)
	await process_frame
	if int(world.building_count) <= 0:
		_fail("Testwelt ohne Gebäude")
		return
	if int(world.prop_count) <= 0:
		_fail("Testwelt ohne Props")
		return
	if int(world.collision_bodies) <= 0:
		_fail("Testwelt ohne Kollisionskörper")
		return
	if int(world.audio_players) <= 0:
		_fail("Testwelt ohne Audioknoten")
		return
	print("PASS Testwelt: Gebäude=%d Props=%d Kollision=%d Audio=%d" %
		[int(world.building_count), int(world.prop_count), int(world.collision_bodies), int(world.audio_players)])

	print("ALL TESTS PASSED")
	quit(0)
