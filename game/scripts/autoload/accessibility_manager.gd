extends Node
## AccessibilityManager (Issue #18, M3) — Accessibility-Optionen + Control-Remapping.
##
## Zuständig für:
##  - Textgröße (text_scale: 0.85 / 1.0 / 1.2 / 1.5) für Dialog-/Debatten-UI.
##  - Hoher Kontrast (high_contrast) für Dialog-/Debatten-UI.
##  - Remappable Controls: nutzbare Umbelegung der Spiel-Actions auf andere
##    Tasten (kein Mockup) — gespeicherte Belegungen werden beim Start auf die
##    InputMap angewendet und überstehen einen Neustart.
##
## Persistenz in user://accessibility.json (separat vom AudioManager-settings.json,
## damit beide unabhängig schreiben können). Anwendung von text_scale/Kontrast
## passiert verbraucherseitig (DebateUI liest die Getter), nur die InputMap-Logic
## ist hier zentral (headless testbar).
##
## Autoload-Lookup in --script-Tests: globale Identifier nicht garantiert →
## Lookup per Node-Pfad (siehe debate_ui.gd).

const SETTINGS_PATH := "user://accessibility.json"

# Spielrelevante Actions, die der Spieler umbelegen darf (keine Debug-/Quick-Keys).
const MAPPABLE_ACTIONS := [
	"move_forward", "move_back", "move_left", "move_right",
	"jump", "interact", "pause",
]

# Default-Snapshot der InputMap-Events, damit ein Reset möglich ist (Godot liefert
# keine API, um Projekt-Defaults wiederherzustellen → selbst merken, vor dem ersten
# Apply). Bei _ready gefüllt, bevor user-Remappings angewendet werden.
var _default_events: Dictionary = {}

var _text_scale := 1.0
var _high_contrast := false
var _remappings: Dictionary = {}  # action -> physical_keycode (int)


func _ready() -> void:
	# Snapshot nur beim ersten Lifecycle (Autoload-Init). Ein wiederholter Aufruf
	# (z. B. im --script-Test oder nach Live-Remap) würde sonst geremapte Tasten
	# als „Default" einfrieren und reset_remap ginge ins Leere.
	if _default_events.is_empty():
		_snapshot_defaults()
	_load_settings()
	_apply_remappings()


func _snapshot_defaults() -> void:
	# Alle Key-Belegungen je Action als Array merken (Gemini-Review: eine Action
	# kann standardmäßig mehrere Keys haben, z. B. W + Pfeiltaste Oben für
	# move_forward — nur der erste zu snapshotten würde die sekundären beim
	# Reset verlieren).
	for action in MAPPABLE_ACTIONS:
		if InputMap.has_action(action):
			var keycodes: Array[int] = []
			for e in InputMap.action_get_events(action):
				if e is InputEventKey:
					keycodes.append(int((e as InputEventKey).physical_keycode))
			_default_events[action] = keycodes


func get_text_scale() -> float:
	return _text_scale


func set_text_scale(s: float) -> void:
	_text_scale = clampf(s, 0.5, 2.0)
	_save_settings()


func get_high_contrast() -> bool:
	return _high_contrast


func set_high_contrast(on: bool) -> void:
	_high_contrast = on
	_save_settings()


func get_remap(action: String) -> int:
	# 0 = kein Remap (Default aktiv).
	return int(_remappings.get(action, 0))


func set_remap(action: String, physical_keycode: int) -> void:
	if not MAPPABLE_ACTIONS.has(action):
		push_warning("[Accessibility] nicht remap-bare Action: " + action)
		return
	_remappings[action] = physical_keycode
	_apply_remap(action)
	_save_settings()


func reset_remap(action: String) -> void:
	_remappings.erase(action)
	_restore_default(action)
	_save_settings()


func reset_all_remappings() -> void:
	_remappings.clear()
	for action in MAPPABLE_ACTIONS:
		_restore_default(action)
	_save_settings()


func _apply_remappings() -> void:
	for action in _remappings.keys():
		_apply_remap(action)


func _apply_remap(action: String) -> void:
	if not InputMap.has_action(action):
		return
	var keycode := int(_remappings.get(action, 0))
	if keycode == 0:
		return
	# Nur Key-Events ersetzen; Gamepad-/Maus-Events bleiben unangetastet, damit
	# zukünftige Controller-Unterstützung nicht kaputtgeht.
	var keep: Array[InputEvent] = []
	for e in InputMap.action_get_events(action):
		if not (e is InputEventKey):
			keep.append(e)
	InputMap.action_erase_events(action)
	for e in keep:
		InputMap.action_add_event(action, e)
	var k := InputEventKey.new()
	k.physical_keycode = keycode
	InputMap.action_add_event(action, k)


func _restore_default(action: String) -> void:
	if not InputMap.has_action(action):
		return
	var keep: Array[InputEvent] = []
	for e in InputMap.action_get_events(action):
		if not (e is InputEventKey):
			keep.append(e)
	InputMap.action_erase_events(action)
	for e in keep:
		InputMap.action_add_event(action, e)
	# Alle gesnapshotteten Default-Keys wiederherstellen (Gemini-Review: Array,
	# nicht nur der erste — siehe _snapshot_defaults).
	var default_kcs: Variant = _default_events.get(action, [])
	if default_kcs is Array:
		for default_kc in (default_kcs as Array):
			var k := InputEventKey.new()
			k.physical_keycode = int(default_kc)
			InputMap.action_add_event(action, k)


func _load_settings() -> void:
	if not FileAccess.file_exists(SETTINGS_PATH):
		return
	var f := FileAccess.open(SETTINGS_PATH, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if not (parsed is Dictionary):
		push_warning("[Accessibility] accessibility.json ungültig, nutze Defaults")
		return
	var d := parsed as Dictionary
	_text_scale = clampf(float(d.get("text_scale", 1.0)), 0.5, 2.0)
	_high_contrast = bool(d.get("high_contrast", false))
	var r: Variant = d.get("remappings", {})
	if r is Dictionary:
		# JSON liefert keys als String, values als float → int casten.
		var rd := (r as Dictionary).duplicate()
		_remappings.clear()
		for k in rd.keys():
			_remappings[String(k)] = int(rd[k])


func _save_settings() -> void:
	var d := {
		"text_scale": _text_scale,
		"high_contrast": _high_contrast,
		"remappings": _remappings,
	}
	var f := FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if f == null:
		push_error("[Accessibility] accessibility.json nicht schreibbar")
		return
	f.store_string(JSON.stringify(d, "\t"))
	f.close()