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
	# ESC öffnet/schließt das Menü in BEIDEN Zuständen (ALWAYS). Konsumiert,
	# damit kein anderer pause-Handler (z. B. ein künftiger Level-Handler)
	# dasselbe Event doppelt verarbeitet.
	if event.is_action_pressed("pause") and not event.is_echo():
		_toggle()
		# Event konsumieren, damit kein anderer pause-Handler (z. B. ein
		# künftiger Level-Handler) dasselbe Event doppelt verarbeitet. CanvasLayer
		# hat die Methode nicht direkt → über den Viewport.
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