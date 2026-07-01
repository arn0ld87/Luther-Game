extends Node

## Single-Source-of-Truth für theologische Debattenthemen.
## Lädt `res://resources/theology/theology_questions.json` und hält die
## Fragen als Array von Dictionaries bereit. Web-Frontend und Godot lesen
## dieselbe JSON-Datei (Risk Register Risk #6).

const PATH := "res://resources/theology/theology_questions.json"

var questions: Array[Dictionary] = []
var version: int = 0

func _ready() -> void:
	_reload()

func _reload() -> void:
	if not ResourceLoader.exists(PATH):
		push_error("[theology_data] JSON fehlt: " + PATH)
		return
	var file := FileAccess.open(PATH, FileAccess.READ)
	if file == null:
		push_error("[theology_data] Kann JSON nicht öffnen: " + PATH)
		return
	var text := file.get_as_text()
	var parsed: Variant = JSON.parse_string(text)
	if parsed == null or not parsed is Dictionary:
		push_error("[theology_data] JSON nicht parsebar")
		return
	var data := parsed as Dictionary
	version = data.get("version", 0) as int
	var q: Variant = data.get("questions", [])
	questions = []
	if q is Array:
		for item: Variant in q:
			if item is Dictionary:
				questions.append(item as Dictionary)

func get_question_by_id(id: int) -> Dictionary:
	for question in questions:
		if question.get("id", -1) == id:
			return question
	return {}
