extends Node
## SaveManager — Persistenter Spielstand (Issue #17, M3).
##
## Kapselt Speichern/Laden eines einzelnen Spielstands unter `user://save.json`.
## Serialisierungsformat bewusst JSON via FileAccess (kein binäres Godot-Resource):
## menschenlesbar → Debugging-/Support-Fall ist trivial, Schema-Drift über das
## `save_version`-Feld beherrschbar, und bei einem Lernspiel-Spielstand (wenige
## KB) ist der Performance-/Größen-Nachteil vernachlässigbar. Begründung siehe
## `docs/architecture/game-architecture.md` (Format-Entscheidung Save/Load).
##
## Fehlerverhalten (Akzeptanzkriterium 6): eine fehlende Datei liefert `null`/
## leeres Dictionary (Start ohne Spielstand), eine korrupte Datei wird verworfen
## + per push_warning gemeldet — beides OHNE Crash. Der Aufrufer entscheidet
## anhand `has_save()`, ob beim Start ein Load-Screen/Prompt gezeigt wird.
##
## Single-Save (Non-Goal: keine Multi-Slots). `user://` wird plattformabhängig
## aufgelöst (macOS: ~/Library/Application Support/Godot/app_userdata/…), kein
## manuelles Pfad-Handling nötig.

const SAVE_PATH := "user://save.json"
const SAVE_VERSION := 1

signal saved()
signal loaded(state: Dictionary)


## Schreibt den Spielstand. Gibt `true` zurück, wenn die Datei erfolgreich
## geschrieben wurde. `won_ids` ist die Liste gewonnener Theologie-Frage-IDs
## (aus DebateProgress.to_dict()).
func save_game(player_position: Vector3, player_rotation_y: float, won_ids: Array) -> bool:
	var state := {
		"save_version": SAVE_VERSION,
		"saved_at": Time.get_datetime_string_from_system(true),
		"player": {
			"x": player_position.x,
			"y": player_position.y,
			"z": player_position.z,
			"rotation_y": player_rotation_y,
		},
		"debate": {
			"won_ids": won_ids,
		},
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file == null:
		push_error("[save_manager] Kann Save-Datei nicht öffnen (Schreiben): " + SAVE_PATH)
		return false
	file.store_string(JSON.stringify(state, "\t"))
	file.close()
	saved.emit()
	return true


## Lädt den Spielstand. Gibt ein leeres Dictionary zurück, wenn keine Datei
## existiert oder die Datei korrupt ist (kein Crash). Der Aufrufer prüft
## `is_empty()` / `has_save()`, um zwischen „kein Spielstand" und „gültiger
## Spielstand" zu unterscheiden. Ein Versionskonflikt wird gemeldet und
## ebenfalls als „kein Spielstand" behandelt (bewusst: ein automatisches
## Migrieren noch nicht spezifizierter künftiger Schemata würde stillschweigend
## Daten verändern — statt dessen klarer Fallback und Hinweis).
func load_game() -> Dictionary:
	if not has_save():
		return {}
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		push_warning("[save_manager] Save-Datei existiert, lässt sich aber nicht öffnen: " + SAVE_PATH)
		return {}
	var text := file.get_as_text()
	file.close()

	var parsed: Variant = JSON.parse_string(text)
	if parsed == null or not parsed is Dictionary:
		push_warning("[save_manager] Korrupter Spielstand (kein JSON-Dictionary): " + SAVE_PATH)
		return {}
	var state := parsed as Dictionary

	var v: int = int(state.get("save_version", 0))
	if v != SAVE_VERSION:
		push_warning("[save_manager] Save-Version %d ≠ erwartet %d — Spielstand ignoriert (Migration nicht definiert)" % [v, SAVE_VERSION])
		return {}
	if not _validate(state):
		push_warning("[save_manager] Save-Schema unvollständig (player/debate fehlt): " + SAVE_PATH)
		return {}
	loaded.emit(state)
	return state


## True, wenn eine Save-Datei existiert (Inhaltsvalidierung erst bei load_game).
func has_save() -> bool:
	return FileAccess.file_exists(SAVE_PATH)


## ISO-Zeitstempel des letzten Speicherns oder leerer String, wenn kein Save.
func get_save_timestamp() -> String:
	if not has_save():
		return ""
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return ""
	var text := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(text)
	if parsed is Dictionary:
		return String((parsed as Dictionary).get("saved_at", ""))
	return ""


func delete_save() -> bool:
	if not has_save():
		return true
	var err := DirAccess.remove_absolute(SAVE_PATH)
	if err != OK:
		push_warning("[save_manager] Kann Save-Datei nicht löschen: %s (err=%d)" % [SAVE_PATH, err])
		return false
	return true


## Minimal-Schema-Check: die beiden Top-Level-Knoten müssen als Dictionary
## vorliegen. Tiefervalidierung der Felder übernimmt der konsumierende Code
## (Position defaulten z.B. auf 0 bei fehlenden Koordinaten).
func _validate(state: Dictionary) -> bool:
	return state.has("player") and state.get("player") is Dictionary \
		and state.has("debate") and state.get("debate") is Dictionary