class_name TheologyEvaluator
extends RefCounted
## Lokale, deterministische Bewertung theologischer Debatten-Antworten (Issue #16, Option b).
##
## Liest die Bewertungsdaten aus resources/theology/debate_stances.json und bewertet die
## binäre Ja/Nein-Haltung des Spielers gegen die reformatorische Antwort. Kein Netzwerk,
## kein Gemini-Backend, kein API-Key — deterministisch und headless testbar.
##
## Bewusst hinter dieser Klasse gekapselt: Ein späterer Wechsel auf einen HTTP-/LLM-Pfad
## (Option a, siehe docs/architecture/game-architecture.md Abschnitt 8) betrifft nur diese
## Datei, nicht die Debatten-UI.

const PATH := "res://resources/theology/debate_stances.json"

# question_id (int) -> Haltungs-Dictionary
var _stances: Dictionary = {}


func _init() -> void:
	_load()


func _load() -> void:
	if not FileAccess.file_exists(PATH):
		push_error("[theology_evaluator] JSON fehlt: " + PATH)
		return
	var file := FileAccess.open(PATH, FileAccess.READ)
	if file == null:
		push_error("[theology_evaluator] Kann JSON nicht öffnen: " + PATH)
		return
	var json := JSON.new()
	if json.parse(file.get_as_text()) != OK:
		push_error("[theology_evaluator] JSON nicht parsebar: %s (Zeile %d)" % [
			json.get_error_message(), json.get_error_line()
		])
		return
	if not json.data is Dictionary:
		push_error("[theology_evaluator] JSON-Wurzel ist kein Dictionary")
		return
	var raw: Variant = (json.data as Dictionary).get("stances", [])
	if raw is Array:
		for item: Variant in raw:
			if item is Dictionary:
				var d := item as Dictionary
				_stances[int(d.get("question_id", -1))] = d


## Bewertet die binäre Antwort ("ja"/"nein") auf die Frage `question_id`.
## Rückgabe: { valid: bool, correct: bool, feedback: String }
## valid == false, wenn zur Frage keine Bewertungsdaten vorliegen (statt falscher Sicherheit).
func evaluate(question_id: int, answer: String) -> Dictionary:
	if not _stances.has(question_id):
		return {
			"valid": false,
			"correct": false,
			"feedback": "Keine Bewertungsdaten für Frage %d." % question_id,
		}
	var d := _stances[question_id] as Dictionary
	var expected := str(d.get("correct_answer", "")).to_lower().strip_edges()
	var given := answer.to_lower().strip_edges()
	var correct := given == expected
	var key := "feedback_correct" if correct else "feedback_wrong"
	return {
		"valid": true,
		"correct": correct,
		"feedback": str(d.get(key, "")),
	}


## True, wenn zu allen gegebenen Frage-IDs Bewertungsdaten vorliegen (Vollständigkeitscheck).
func has_stance(question_id: int) -> bool:
	return _stances.has(question_id)
