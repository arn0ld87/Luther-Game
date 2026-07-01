class_name DebateUI
extends CanvasLayer
## Debatten-UI (Issue #16) — 3D-Pendant zum Web-`DebateInterface`.
##
## Zeigt eine theologische Frage + Bibelstellen-Kontext (aus dem TheologyData-Autoload, M1)
## und lässt den Spieler binär (Ja/Nein) antworten. Die Bewertung läuft lokal über
## TheologyEvaluator (Option b, siehe docs/architecture/game-architecture.md Abschnitt 8) —
## kein Backend, kein API-Key. Additive Trennung zum Web-Spiel (kein Code-Sharing).
##
## Der Control-Baum wird programmatisch in _ready() aufgebaut, damit die Szene minimal
## bleibt und headless testbar ist.

signal debate_finished(question_id: int, won: bool)

var _evaluator := TheologyEvaluator.new()
var _current_question_id: int = -1
var _finished: bool = false

var _progress_label: Label
var _question_label: Label
var _context_label: Label
var _feedback_label: Label
var _result_label: Label
var _panel: PanelContainer
var _ja_button: Button
var _nein_button: Button
var _again_button: Button
var _close_button: Button


func _ready() -> void:
	_ensure_built()
	hide_ui()


## Baut den Control-Baum genau einmal auf — idempotent, damit open_for_question()
## auch dann sicher ist, wenn es vor _ready() aufgerufen wird (z. B. direkt nach
## instantiate()+add_child() durch den QuestStationTrigger).
func _ensure_built() -> void:
	if _question_label == null:
		_build_ui()


func _build_ui() -> void:
	_panel = PanelContainer.new()
	_panel.name = "DebatePanel"
	_panel.set_anchors_preset(Control.PRESET_CENTER)
	_panel.custom_minimum_size = Vector2(560, 320)
	add_child(_panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 16)
	margin.add_theme_constant_override("margin_right", 16)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_bottom", 16)
	_panel.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 12)
	margin.add_child(vbox)

	_progress_label = Label.new()
	_progress_label.modulate = Color(0.7, 0.85, 1.0)
	vbox.add_child(_progress_label)

	_question_label = Label.new()
	_question_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(_question_label)

	_context_label = Label.new()
	_context_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_context_label.modulate = Color(0.8, 0.8, 0.8)
	vbox.add_child(_context_label)

	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)
	vbox.add_child(hbox)

	_ja_button = Button.new()
	_ja_button.text = "Ja"
	hbox.add_child(_ja_button)

	_nein_button = Button.new()
	_nein_button.text = "Nein"
	hbox.add_child(_nein_button)

	_feedback_label = Label.new()
	_feedback_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(_feedback_label)

	_result_label = Label.new()
	vbox.add_child(_result_label)

	_again_button = Button.new()
	_again_button.text = "Nochmal versuchen"
	_again_button.hide()
	vbox.add_child(_again_button)

	_close_button = Button.new()
	_close_button.text = "Schließen"
	_close_button.hide()
	vbox.add_child(_close_button)

	_ja_button.pressed.connect(_on_answer.bind("ja"))
	_nein_button.pressed.connect(_on_answer.bind("nein"))
	_again_button.pressed.connect(_reset_answer_state)
	_close_button.pressed.connect(close_debate)


## Öffnet die Debatte für die gegebene Theologie-Frage-ID (aus TheologyData).
func open_for_question(question_id: int) -> void:
	_ensure_built()
	_current_question_id = question_id
	var q := _get_question(question_id)
	_question_label.text = str(q.get("text", "(keine Frage gefunden)"))
	_context_label.text = str(q.get("context", ""))
	_connect_progress()
	_update_progress_label()
	_reset_answer_state()
	show_ui()
	_apply_accessibility()


func _get_question(question_id: int) -> Dictionary:
	# Autoload per Node-Lookup (in headless --script-Läufen ist der globale Identifier
	# TheologyData nicht verfügbar).
	var td := get_tree().root.get_node_or_null("/root/TheologyData")
	if td != null:
		var result: Variant = td.call("get_question_by_id", question_id)
		if result is Dictionary:
			return result as Dictionary
	return {}


## Autoload-Lookup per Node-Pfad (headless-robust, wie bei TheologyData) — der globale
## Identifier DebateProgress ist in --script-Läufen nicht garantiert verfügbar.
func _get_progress() -> Node:
	if get_tree() == null:
		return null
	return get_tree().root.get_node_or_null("/root/DebateProgress")


## AudioManager-Lookup (Issue #18) — gleiche headless-robuste Pattern wie oben.
func _audio_manager() -> Node:
	if get_tree() == null:
		return null
	return get_tree().root.get_node_or_null("/root/AudioManager")


func _play_ui_click() -> void:
	var am := _audio_manager()
	if am != null:
		am.play_ui_click()


## AccessibilityManager-Lookup (Issue #18) — headless-robuste Pattern wie oben.
func _accessibility_manager() -> Node:
	if get_tree() == null:
		return null
	return get_tree().root.get_node_or_null("/root/AccessibilityManager")


## Wendet Textgröße + Kontrast aus dem AccessibilityManager an (Issue #18).
func _apply_accessibility() -> void:
	if _panel == null:
		return
	var am := _accessibility_manager()
	if am == null:
		return
	var scale := float(am.get_text_scale())
	# Basis 16 (Godot-Default) skaliert — wirkt auf Fragentext + Feedback.
	var fs := int(round(16.0 * scale))
	for l in [_progress_label, _question_label, _context_label, _feedback_label, _result_label]:
		if l != null:
			l.add_theme_font_size_override("font_size", fs)

	if bool(am.get_high_contrast()):
		# Hoher Kontrast: schwarzes Panel, weißer Text, weißer Rand.
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color.BLACK
		sb.border_color = Color.WHITE
		sb.set_border_width_all(2)
		sb.content_margin_left = 16
		sb.content_margin_right = 16
		sb.content_margin_top = 16
		sb.content_margin_bottom = 16
		_panel.add_theme_stylebox_override("panel", sb)
		for l in [_progress_label, _question_label, _context_label, _feedback_label, _result_label]:
			if l != null:
				l.modulate = Color.WHITE
	else:
		# Defaults wiederherstellen (Toggle im laufenden Spiel unterstützen).
		# Defensive Null-Prüfungen (Gemini-Review): die Methode kann vor
		# vollständiger Label-Initialisierung aufgerufen werden (Testkontext);
		# der if-Zweig prüft bereits, der else-Zweig analog.
		if _panel != null:
			_panel.remove_theme_stylebox_override("panel")
		if _progress_label != null:
			_progress_label.modulate = Color(0.7, 0.85, 1.0)
		if _context_label != null:
			_context_label.modulate = Color(0.8, 0.8, 0.8)
		if _question_label != null:
			_question_label.modulate = Color.WHITE
		if _feedback_label != null:
			_feedback_label.modulate = Color.WHITE
		# _result_label.modulate wird bewusst nicht angerührt: SIEG/NIEDERLAGE
		# färbt sich per Antwort neu (grün/rot) und würde sonst überschrieben.


func _connect_progress() -> void:
	var progress := _get_progress()
	if progress != null and not progress.is_connected("progress_changed", _on_progress_changed):
		progress.connect("progress_changed", _on_progress_changed)


func _update_progress_label() -> void:
	var progress := _get_progress()
	if progress != null:
		_set_progress_text(int(progress.call("won_count")), int(progress.call("total")))
	else:
		_progress_label.text = ""


func _on_progress_changed(won: int, total: int) -> void:
	_set_progress_text(won, total)


func _set_progress_text(won: int, total: int) -> void:
	_progress_label.text = "Fortschritt: %d/%d Debatten gewonnen" % [won, total]


func _reset_answer_state() -> void:
	_finished = false
	_feedback_label.text = ""
	_result_label.text = ""
	_again_button.hide()
	_close_button.hide()
	_set_answer_buttons_enabled(true)


func _set_answer_buttons_enabled(is_enabled: bool) -> void:
	_ja_button.disabled = not is_enabled
	_nein_button.disabled = not is_enabled


func _on_answer(answer: String) -> void:
	_play_ui_click()
	if _finished:
		return
	var res := _evaluator.evaluate(_current_question_id, answer)
	if not bool(res.get("valid", false)):
		# Ungültige Bewertung (z. B. fehlende Stance-Daten für die Frage-ID): Antwort-Buttons
		# deaktivieren und Schließen anbieten, damit der Spieler nicht in der UI gefangen ist.
		_feedback_label.text = str(res.get("feedback", ""))
		_set_answer_buttons_enabled(false)
		_close_button.show()
		return
	var won := bool(res.get("correct", false))
	_feedback_label.text = str(res.get("feedback", ""))
	_result_label.text = "SIEG" if won else "NIEDERLAGE"
	_result_label.modulate = Color(0.3, 0.9, 0.3) if won else Color(0.9, 0.3, 0.3)
	_finished = true
	_set_answer_buttons_enabled(false)
	# Issue #18 — akustisches Debattenausgang-Feedback. Das sichtbare Pendant
	# (_result_label „SIEG"/„NIEDERLAGE") ist das Untertitel-Äquivalent für
	# hörgeschädigte Spieler:innen (Accessibility, gleicher Informationsgehalt).
	var am := _audio_manager()
	if am != null:
		am.play_debate_result(won)
	if not won:
		_again_button.show()
	_close_button.show()
	debate_finished.emit(_current_question_id, won)


func show_ui() -> void:
	visible = true


func hide_ui() -> void:
	visible = false


## Schließt die Debatte und entfernt die UI aus dem Szenenbaum. Der QuestStationTrigger
## instanziiert die UI pro Betreten frisch (add_child an /root), daher wird sie hier
## freigegeben statt nur versteckt — sonst häufen sich unsichtbare CanvasLayer an.
func close_debate() -> void:
	hide_ui()
	queue_free()


# --- Test-Hilfen (headless nachprüfbar) ---

func get_displayed_question_text() -> String:
	return _question_label.text if _question_label != null else ""


func get_result_text() -> String:
	return _result_label.text if _result_label != null else ""


func get_progress_text() -> String:
	return _progress_label.text if _progress_label != null else ""


func is_finished() -> bool:
	return _finished


func is_close_available() -> bool:
	return _close_button != null and _close_button.visible


## Löst den Schließen-Button über seinen echten pressed-Signal-Pfad aus (testet die
## Verdrahtung _close_button.pressed -> close_debate mit, nicht nur close_debate selbst).
func press_close_for_test() -> void:
	_close_button.pressed.emit()
