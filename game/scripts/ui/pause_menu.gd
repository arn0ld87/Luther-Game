class_name PauseMenu
extends CanvasLayer
## Pause-Menü (Issue #17, AK5 — Speichern/Laden über die Spiel-UI auslösbar).
##
## Minimal-Overlay (dunkles Backdrop + Button-Reihe), Code-generiert statt als
## .tscn, damit kein zusätzlicher Scene-Editor-Schritt nötig ist. Entkoppelt
## über Signals: das Level (wittenberg_intro) verdrahtet save/load/quit mit
## SaveManager + Spiellogik, die UI bleibt frei von Spielspezifika.
##
## process_mode = ALWAYS, damit das Menü auch während `get_tree().paused`
## Interaktion erlaubt (Pause friert die Welt ein, nicht das Menü).
##
## ESC-Handling (Opus-Review M1) liegt HIER im PauseMenu, nicht im Level: ein
## pausiertes Level (process_mode INHERIT → PAUSABLE) bekommt bei paused=true
## kein _input mehr — ESC käme nicht mehr an. PauseMenu mit ALWAYS empfängt
## den pause-Input in beiden Zuständen und togglet sich selbst + get_tree().paused.

signal save_requested()
signal load_requested()
signal quit_requested()
signal opened()

var _root: Control
var _save_btn: Button
var _load_btn: Button
var _text_size_option: OptionButton
var _contrast_check: CheckButton
var _remap_buttons: Dictionary = {}  # action -> Button (zeigt aktuelle Taste)
var _waiting_for_action := ""       # Action, deren Taste neu belegt werden soll

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()
	_set_visible(false)

	# Laden-Button deaktivieren, wenn es keinen Spielstand gibt — verhindert
	# Frustration über einen klickbaren Button, der nichts bewirkt.
	_load_btn.disabled = not _save_manager_has_save()
	var sm := _save_manager()
	if sm != null:
		# Gemini-Review: nach Save/Load den Laden-Button-Status synchronisieren
		# (erstmals inaktiv falls kein Stand, aktiv nach erstem Save) und das
		# Menü nach erfolgreichem Load automatisch schließen (resume).
		sm.loaded.connect(_on_loaded)
		sm.saved.connect(_on_saved)


func _input(event: InputEvent) -> void:
	# Remapping-Capture hat Vorrang: wartet eine Action auf Neubelegung, fängt
	# der nächste gedrückte Key diese ab (statt ESC/Buttons auszulösen).
	if _waiting_for_action != "" and event is InputEventKey and event.pressed and not event.echo:
		if event.physical_keycode != 0:
			_commit_remap(int(event.physical_keycode))
			get_viewport().set_input_as_handled()
			return
	# ESC öffnet/schließt das Menü in BEIDEN Zuständen (ALWAYS). Konsumiert,
	# damit kein anderer pause-Handler (z. B. ein künftiger Level-Handler)
	# dasselbe Event doppelt verarbeitet. CanvasLayer hat die Methode nicht
	# direkt → über den Viewport.
	if event.is_action_pressed("pause") and not event.is_echo():
		_toggle()
		get_viewport().set_input_as_handled()


func _build_ui() -> void:
	_root = Control.new()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_STOP

	var color := ColorRect.new()
	color.color = Color(0.0, 0.0, 0.0, 0.65)
	color.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(color)

	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.add_child(center)

	var panel := PanelContainer.new()
	center.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.custom_minimum_size = Vector2(260, 0)
	vbox.add_theme_constant_override("separation", 8)
	panel.add_child(vbox)

	var title := Label.new()
	title.text = "Pause"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title)

	# Issue #18 — Lautstärkeregler (Musik/SFX) wirken sofort beim Verschieben
	# und werden vom AudioManager persistiert (überleben Neustart).
	_add_volume_slider(vbox, "Musik", "music")
	_add_volume_slider(vbox, "Effekte", "sfx")

	_build_accessibility_section(vbox)
	_build_remapping_section(vbox)

	_save_btn = _add_button(vbox, "Speichern", _on_save)
	_load_btn = _add_button(vbox, "Laden", _on_load)
	_add_button(vbox, "Weiterspielen", _on_resume)
	_add_button(vbox, "Beenden", _on_quit)

	add_child(_root)


func _add_button(parent: Control, label: String, cb: Callable) -> Button:
	var b := Button.new()
	b.text = label
	b.custom_minimum_size = Vector2(220, 36)
	b.pressed.connect(cb)
	parent.add_child(b)
	return b


func _add_volume_slider(parent: Control, label: String, bus: String) -> void:
	# Issue #18 — horizontaler Regler 0..1 (linear), sofort wirksam + persistiert.
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	var l := Label.new()
	l.text = label
	l.custom_minimum_size = Vector2(80, 0)
	row.add_child(l)
	var s := HSlider.new()
	s.min_value = 0.0
	s.max_value = 1.0
	s.step = 0.01
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var am := _save_manager_audio()
	s.value = _audio_volume(bus, am)
	s.value_changed.connect(func(v: float) -> void: _set_audio_volume(bus, v, am))
	row.add_child(s)
	parent.add_child(row)


func _save_manager_audio() -> Node:
	# AudioManager-Lookup (gleiche headless-robuste Pattern wie SaveManager).
	return get_tree().root.get_node_or_null("/root/AudioManager")


func _audio_volume(bus: String, am: Node) -> float:
	if am == null:
		return 1.0
	if bus == "music":
		return float(am.get_music_volume())
	return float(am.get_sfx_volume())


func _set_audio_volume(bus: String, v: float, am: Node) -> void:
	if am == null:
		return
	if bus == "music":
		am.set_music_volume(v)
	else:
		am.set_sfx_volume(v)


# Spielrelevante Actions, die umbelegt werden dürfen (Sync mit
# AccessibilityManager.MAPPABLE_ACTIONS; hier lokal, um im --script-Kontext nicht
# vom globalen Identifier abzuhängen).
const _MAPPABLE_ACTIONS := [
	"move_forward", "move_back", "move_left", "move_right",
	"jump", "interact", "pause",
]

# Textgrößen-Stufen (Index ↔ Scale), zu _build_accessibility_section synchron.
const _TEXT_SCALES := [0.85, 1.0, 1.2, 1.5]


func _accessibility_manager() -> Node:
	return get_tree().root.get_node_or_null("/root/AccessibilityManager")


func _build_accessibility_section(parent: Control) -> void:
	var am := _accessibility_manager()
	var heading := Label.new()
	heading.text = "Barrierefreiheit"
	heading.add_theme_font_size_override("font_size", 14)
	parent.add_child(heading)

	# Textgröße — OptionButton mit Stufen.
	var ts_row := HBoxContainer.new()
	ts_row.add_theme_constant_override("separation", 8)
	var ts_label := Label.new()
	ts_label.text = "Textgröße"
	ts_label.custom_minimum_size = Vector2(80, 0)
	ts_row.add_child(ts_label)
	_text_size_option = OptionButton.new()
	_text_size_option.add_item("Klein")
	_text_size_option.add_item("Normal")
	_text_size_option.add_item("Groß")
	_text_size_option.add_item("Sehr groß")
	_text_size_option.select(_text_size_index_for(am))
	_text_size_option.item_selected.connect(_on_text_size_selected)
	ts_row.add_child(_text_size_option)
	parent.add_child(ts_row)

	# Hoher Kontrast — Toggle.
	_contrast_check = CheckButton.new()
	_contrast_check.text = "Hoher Kontrast (Debatten-UI)"
	_contrast_check.set_pressed_no_signal(am != null and bool(am.get_high_contrast()))
	_contrast_check.toggled.connect(_on_contrast_toggled)
	parent.add_child(_contrast_check)


func _build_remapping_section(parent: Control) -> void:
	var heading := Label.new()
	heading.text = "Steuerung anpassen"
	heading.add_theme_font_size_override("font_size", 14)
	parent.add_child(heading)

	for action in _MAPPABLE_ACTIONS:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 8)
		var l := Label.new()
		l.text = _friendly_action_name(action)
		l.custom_minimum_size = Vector2(140, 0)
		row.add_child(l)
		var b := Button.new()
		b.custom_minimum_size = Vector2(180, 0)
		b.pressed.connect(_on_remap_button.bind(action))
		row.add_child(b)
		_remap_buttons[action] = b
		parent.add_child(row)
	_refresh_remap_labels()


func _refresh_remap_labels() -> void:
	var am := _accessibility_manager()
	for action in _remap_buttons.keys():
		var b: Button = _remap_buttons[action]
		if _waiting_for_action == action:
			b.text = "Taste drücken …"
			continue
		var kc := _current_keycode(action, am)
		b.text = "Taste: " + (OS.get_keycode_string(kc) if kc != 0 else "—")


func _current_keycode(action: String, am: Node) -> int:
	# Remap (falls gesetzt) schlägt Default.
	if am != null:
		var r := int(am.get_remap(action))
		if r != 0:
			return r
	# Default = erste physische Taste der Action aus der InputMap.
	if InputMap.has_action(action):
		for e in InputMap.action_get_events(action):
			if e is InputEventKey:
				return int((e as InputEventKey).physical_keycode)
	return 0


func _on_remap_button(action: String) -> void:
	_waiting_for_action = action
	_refresh_remap_labels()


func _on_text_size_selected(idx: int) -> void:
	var am := _accessibility_manager()
	if am != null and idx >= 0 and idx < _TEXT_SCALES.size():
		am.set_text_scale(_TEXT_SCALES[idx])


func _on_contrast_toggled(on: bool) -> void:
	var am := _accessibility_manager()
	if am != null:
		am.set_high_contrast(on)


func _text_size_index_for(am: Node) -> int:
	if am == null:
		return 1  # Normal
	var s := float(am.get_text_scale())
	var best := 1
	var best_diff := 999.0
	for i in range(_TEXT_SCALES.size()):
		var diff := absf(_TEXT_SCALES[i] - s)
		if diff < best_diff:
			best_diff = diff
			best = i
	return best


func _friendly_action_name(action: String) -> String:
	var names := {
		"move_forward": "Vorwärts",
		"move_back": "Rückwärts",
		"move_left": "Links",
		"move_right": "Rechts",
		"jump": "Springen",
		"interact": "Interagieren",
		"pause": "Pause",
	}
	return String(names.get(action, action))


func _commit_remap(keycode: int) -> void:
	var am := _accessibility_manager()
	if am != null and _waiting_for_action != "":
		am.set_remap(_waiting_for_action, keycode)
	_waiting_for_action = ""
	_refresh_remap_labels()


func _toggle() -> void:
	_set_visible(not _root.visible)


func _set_visible(v: bool) -> void:
	_root.visible = v
	get_tree().paused = v
	# Save-Button nur aktiv, wenn ein Spieler existiert — wird vom Level beim
	# Öffnen gesetzt (set_can_save). Load-Button nur, wenn ein Spielstand da ist.
	_load_btn.disabled = not _save_manager_has_save()
	if v:
		opened.emit()


func is_open() -> bool:
	return _root.visible


func set_can_save(can: bool) -> void:
	_save_btn.disabled = not can


func _on_save() -> void:
	save_requested.emit()


func _on_load() -> void:
	load_requested.emit()


func _on_resume() -> void:
	# „Weiterspielen": Menü schließen + entpausieren (gleicher Pfad wie ESC).
	_set_visible(false)


func _on_quit() -> void:
	quit_requested.emit()


func _on_loaded(_state: Dictionary) -> void:
	# Gemini-Review: nach erfolgreichem Load Menü schließen + entpausieren, damit
	# der Spieler direkt mit dem geladenen Stand weiter spielt.
	_set_visible(false)


func _on_saved() -> void:
	# Nach erstem Save existiert nun ein Spielstand → Laden-Button aktivieren,
	# falls er vorher (kein Stand) deaktiviert war.
	_load_btn.disabled = not _save_manager_has_save()


## Autoload-Lookup per Node-Pfad (headless-robust, siehe debate_ui.gd) — der
## globale Identifier SaveManager ist in --script-Läufen nicht garantiert.
func _save_manager() -> Node:
	return get_tree().root.get_node_or_null("/root/SaveManager")


func _save_manager_has_save() -> bool:
	var sm := _save_manager()
	return sm != null and sm.has_method("has_save") and sm.has_save()