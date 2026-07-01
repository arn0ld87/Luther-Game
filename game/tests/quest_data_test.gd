extends SceneTree
## Headless-Test für den QuestData-Autoload und das QuestStation-Datenmodell (Issue #14).
##
## Weist nach, dass sich die Platzhalter-Dateninstanz zur Laufzeit über das
## generische Datenmodell laden und ausgeben lässt (Akzeptanzkriterium: tatsächlich
## ausgeführter Godot-Lauf mit dokumentiertem Output, nicht nur Code-Diff).
##
## Zugriff bewusst über Node-Lookup (`/root/QuestData`) + `get()`/`call()` statt über
## das globale Autoload-Identifier `QuestData`: In headless `--script`-SceneTree-Läufen
## sind Autoload-Namen NICHT als globale Compile-Zeit-Identifier verfügbar
## ("Identifier not found: QuestData"). Der bestehende `theology_data_test.gd` nutzt
## dasselbe Muster aus genau diesem Grund.
##
## Lauf: godot --headless --path game --script res://tests/quest_data_test.gd
## Erfolg = Exit-Code 0 und "ALL TESTS PASSED"; jeder Fehlschlag ruft quit(1).


func _initialize() -> void:
	var ps: PackedScene = load("res://scenes/bootstrap.tscn")
	var scene := ps.instantiate() as Node3D
	root.add_child(scene)
	await scene.ready

	var data := root.get_node_or_null("/root/QuestData")
	print("DEBUG: QuestData=", data)
	if data == null:
		push_error("FAIL: QuestData Autoload missing")
		quit(1)
		return
	print("PASS Autoload present")

	var stations: Array = data.get("stations")
	print("DEBUG: stations size=", stations.size())
	if stations.size() != 2:
		push_error("FAIL: expected 2 placeholder stations, got %d" % stations.size())
		quit(1)
		return
	print("PASS station count: %d" % stations.size())

	# Station per ID abrufen und typisierte Felder prüfen.
	var intro := data.call("get_station_by_id", "placeholder_intro") as QuestStation
	print("DEBUG: intro=", intro)
	if intro == null:
		push_error("FAIL: station 'placeholder_intro' not found")
		quit(1)
		return
	if intro.question_text == "" or intro.title == "":
		push_error("FAIL: intro station missing question_text/title")
		quit(1)
		return
	print("PASS station 'placeholder_intro' loaded: %s" % intro.question_text)

	# 3D-/Quest-spezifische Felder nachweisen (world_position, order, prerequisites,
	# theology_question_id, next_on_success) — belegt die Erweiterung über das
	# schmale Web-`Question`-Interface hinaus.
	var second := data.call("get_station_by_id", "placeholder_second") as QuestStation
	if second == null:
		push_error("FAIL: station 'placeholder_second' not found")
		quit(1)
		return
	if second.world_position == Vector3.ZERO:
		push_error("FAIL: expected non-zero world_position on 'placeholder_second'")
		quit(1)
		return
	if second.theology_question_id != 1:
		push_error("FAIL: expected theology_question_id=1, got %d" % second.theology_question_id)
		quit(1)
		return
	if not second.prerequisites.has("placeholder_intro"):
		push_error("FAIL: expected prerequisite 'placeholder_intro'")
		quit(1)
		return
	print("PASS 3D/quest fields on 'placeholder_second': pos=%s, order=%d, theology_id=%d, prereqs=%s" % [
		second.world_position, second.order, second.theology_question_id, str(second.prerequisites)
	])

	# Verknüpfung zur Theologie-SSOT auflösbar (belegt Konsumierbarkeit für Issue #15).
	# Hart erzwungen: fehlt der TheologyData-Autoload oder ist die verknüpfte Frage
	# nicht auflösbar, schlägt der Test fehl — dieses Akzeptanzkriterium darf nicht
	# stillschweigend übersprungen werden.
	var theology := root.get_node_or_null("/root/TheologyData")
	if theology == null:
		push_error("FAIL: TheologyData Autoload missing — Theologie-Verknüpfung (Issue #15) nicht prüfbar")
		quit(1)
		return
	var linked := theology.call("get_question_by_id", second.theology_question_id) as Dictionary
	if linked.is_empty():
		push_error("FAIL: theology_question_id=%d not resolvable in TheologyData" % second.theology_question_id)
		quit(1)
		return
	print("PASS theology link resolved: id=%d -> '%s'" % [second.theology_question_id, linked.get("text", "")])

	# Sortierte Ausgabe (belegt get_stations_in_order für konsumierende Systeme).
	var ordered := data.call("get_stations_in_order") as Array
	print("DEBUG: ordered ids=", ordered.map(func(s: QuestStation) -> String: return s.id))
	if ordered.size() != 2 or (ordered[0] as QuestStation).order > (ordered[1] as QuestStation).order:
		push_error("FAIL: get_stations_in_order did not sort ascending")
		quit(1)
		return
	print("PASS stations sorted by order")

	print("ALL TESTS PASSED")
	quit(0)
