extends SceneTree
## Headless-Test für die Debatten-UI (Issue #16): TheologyEvaluator (lokale Bewertung),
## DebateUI (Anzeige + Sieg/Niederlage + Signal) und den begehbaren QuestStationTrigger.
##
## Lauf: godot --headless --path game --script res://tests/debate_ui_test.gd
## Erfolg = Exit-Code 0 und "ALL TESTS PASSED"; jeder Fehlschlag ruft quit(1).
##
## Hinweis: Nodes werden nach dem laufenden Main-Loop hinzugefügt — `_ready()` läuft
## dann synchron im add_child(), daher KEIN `await node.ready` (das würde hängen, weil
## das ready-Signal bereits gefeuert hat). Die UI ist über `_ensure_built()` robust.

var _finished_events: Array = []


func _initialize() -> void:
	# Bootstrap in _initialize laden (vor Loop-Start) — hier ist `await ready` korrekt und
	# stellt die Autoloads (TheologyData, QuestData) bereit.
	var boot: PackedScene = load("res://scenes/bootstrap.tscn")
	var scene := boot.instantiate() as Node3D
	root.add_child(scene)
	await scene.ready
	# Die Fortsetzung nach `await scene.ready` läuft noch im Node-Setup-Kontext des Trees
	# ("busy setting up children"). Erst nach einem Idle-Frame ist root frei für add_child().
	await process_frame

	if not _test_evaluator():
		quit(1)
		return
	if not await _test_debate_ui_win():
		quit(1)
		return
	if not _test_debate_ui_lose():
		quit(1)
		return
	if not _test_trigger():
		quit(1)
		return

	print("ALL TESTS PASSED")
	quit(0)


func _fail(msg: String) -> bool:
	push_error("FAIL: " + msg)
	return false


func _test_evaluator() -> bool:
	var ev := TheologyEvaluator.new()
	for qid in [1, 2, 3]:
		var ok := ev.evaluate(qid, "nein")
		if not bool(ok.get("valid", false)) or not bool(ok.get("correct", false)):
			return _fail("evaluator: 'nein' auf Frage %d sollte korrekt sein" % qid)
		var bad := ev.evaluate(qid, "ja")
		if not bool(bad.get("valid", false)) or bool(bad.get("correct", true)):
			return _fail("evaluator: 'ja' auf Frage %d sollte falsch sein" % qid)
	var unknown := ev.evaluate(999, "nein")
	if bool(unknown.get("valid", true)):
		return _fail("evaluator: unbekannte Frage sollte valid=false liefern")
	print("PASS evaluator: 3 Fragen korrekt bewertet, unbekannte Frage abgefangen")
	return true


func _open_ui(question_id: int) -> CanvasLayer:
	var ps: PackedScene = load("res://scenes/ui/DebateUI.tscn")
	var ui := ps.instantiate() as CanvasLayer
	root.add_child(ui)
	ui.connect("debate_finished", func(qid: int, won: bool): _finished_events.append({"qid": qid, "won": won}))
	ui.call("open_for_question", question_id)
	return ui


func _test_debate_ui_win() -> bool:
	_finished_events.clear()
	var ui := _open_ui(1)
	var text := str(ui.call("get_displayed_question_text"))
	if text.strip_edges() == "" or text.find("Werke") == -1:
		return _fail("DebateUI: Fragetext für id=1 nicht korrekt aus TheologyData geladen: '%s'" % text)
	ui.call("_on_answer", "nein")
	if str(ui.call("get_result_text")) != "SIEG":
		return _fail("DebateUI: 'nein' auf Frage 1 sollte SIEG ergeben")
	if _finished_events.size() != 1 or not bool(_finished_events[0]["won"]):
		return _fail("DebateUI: debate_finished(won=true) nicht korrekt emittiert")
	if not bool(ui.call("is_close_available")):
		return _fail("DebateUI: Schließen-Button nach Abschluss nicht sichtbar")
	ui.call("close_debate")
	await process_frame
	if is_instance_valid(ui):
		return _fail("DebateUI: close_debate() hat die UI nicht aus dem Baum entfernt")
	print("PASS DebateUI: Frage 1 geladen, 'nein' -> SIEG + Signal + Schließen")
	return true


func _test_debate_ui_lose() -> bool:
	_finished_events.clear()
	var ui := _open_ui(2)
	ui.call("_on_answer", "ja")
	if str(ui.call("get_result_text")) != "NIEDERLAGE":
		return _fail("DebateUI: 'ja' auf Frage 2 sollte NIEDERLAGE ergeben")
	if _finished_events.size() != 1 or bool(_finished_events[0]["won"]):
		return _fail("DebateUI: debate_finished(won=false) nicht korrekt emittiert")
	ui.queue_free()
	print("PASS DebateUI: Frage 2, 'ja' -> NIEDERLAGE + Signal")
	return true


func _test_trigger() -> bool:
	var events: Array = []
	var ps: PackedScene = load("res://scenes/world/QuestStationTrigger.tscn")
	var trigger := ps.instantiate() as Area3D
	trigger.set("question_id_override", 3)
	root.add_child(trigger)
	trigger.connect("station_entered", func(qid: int): events.append(qid))

	var dummy := CharacterBody3D.new()
	root.add_child(dummy)
	trigger.call("_on_body_entered", dummy)

	if events.size() != 1 or events[0] != 3:
		return _fail("Trigger: station_entered(3) nicht emittiert")
	var ui := trigger.call("get_debate_ui") as CanvasLayer
	if ui == null:
		return _fail("Trigger: DebateUI wurde nicht geöffnet")
	if str(ui.call("get_displayed_question_text")).strip_edges() == "":
		return _fail("Trigger: geöffnete DebateUI zeigt keine Frage")

	dummy.queue_free()
	trigger.queue_free()
	print("PASS Trigger: Betreten öffnet Debatte für Frage 3")
	return true
