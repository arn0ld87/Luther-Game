class_name PauseMenu
extends CanvasLayer
## Pause-Menü (Issue #17, AK5 — Speichern/Laden über die Spiel-UI auslösbar).
##
## Minimal-Overlay (dunkles Backdrop + Button-Reihe), Code-generiert statt als
## .tscn, damit kein zusätzlicher Scene-Editor-Schritt nötig ist. Entkoppelt
## über Signals: das Level (wittenberg_intro) verdrahtet save/load/resume/quit
## mit SaveManager + Spiellogik, die UI bleibt frei von Spielspezifika.
##
## process_mode = ALWAYS, damit das Menü auch während `get_tree().paused`
## Interaktion erlaubt (Pause friert die Welt ein, nicht das Menü).

signal save_requested()
signal load_requested()
signal resume_requested()
signal quit_requested()

var _root: Control
var _save_btn: Button
var _load_btn: Button

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_ui()
	_set_visible(false)

	# Save-Button deaktivieren, wenn es keinen Spielstand gibt — verhindert
	# Frustration über einen klickbaren Button, der nichts bewirkt.
	_load_btn.disabled = not _save_manager_has_save()
	var sm := _save_manager()
	if sm != null:
		sm.loaded.connect(_on_loaded)


## Autoload-Lookup per Node-Pfad (headless-robust, siehe debate_ui.gd) — der
## globale Identifier SaveManager ist in --script-Läufen nicht garantiert.
func _save_manager() -> Node:
	return get_tree().root.get_node_or_null("/root/SaveManager")


func _save_manager_has_save() -> bool:
	var sm := _save_manager()
	return sm != null and sm.has_method("has_save") and sm.has_save()


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


func toggle() -> void:
	_set_visible(not _root.visible)


func is_open() -> bool:
	return _root.visible


func _set_visible(v: bool) -> void:
	_root.visible = v
	# Während das Menü offen ist, läuft die Welt pausiert ( Aufrufer setzt
	# get_tree().paused). Save-Button nur aktiv, wenn ein Spieler existiert —
	# wird vom Level beim Öffnen gesetzt (set_can_save).
	_load_btn.disabled = not _save_manager_has_save()


func set_can_save(can: bool) -> void:
	_save_btn.disabled = not can


func _on_save() -> void:
	save_requested.emit()


func _on_load() -> void:
	load_requested.emit()


func _on_resume() -> void:
	resume_requested.emit()


func _on_quit() -> void:
	quit_requested.emit()


func _on_loaded(_state: Dictionary) -> void:
	# Nach erfolgreichem Load ist der Button sinnlos bis zum nächsten Save.
	_load_btn.disabled = not _save_manager_has_save()