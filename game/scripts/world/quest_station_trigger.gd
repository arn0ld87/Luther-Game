extends Area3D
## Begehbarer Quest-Stations-Trigger (Issue #16): öffnet die Debatten-UI, sobald der
## Spieler den Bereich betritt. Nutzt das QuestStation-Modell (#14) — Frage-ID wird aus
## der referenzierten Station (QuestData) aufgelöst, mit optionalem direkten Fallback.
##
## Erfüllt Akzeptanzkriterium „UI öffnet sich beim Erreichen einer Quest-Station".
## Der Trigger sitzt physisch bei station.world_position (vom Level gesetzt).

## ID der Quest-Station in QuestData (leer = keine Station, dann question_id_override nutzen).
@export var station_id: String = ""
## Direkte Theologie-Frage-ID als Fallback, falls keine Station referenziert wird.
@export var question_id_override: int = -1
## DebateUI-Szene, die beim Betreten instanziiert und geöffnet wird.
@export var debate_ui_scene: PackedScene

signal station_entered(question_id: int)

var _triggered: bool = false
var _debate_ui: CanvasLayer


func _ready() -> void:
	body_entered.connect(_on_body_entered)


func _on_body_entered(_body: Node3D) -> void:
	if _triggered:
		return
	# Re-Entry bei noch offenem Overlay ignorieren: nach einer Niederlage ist _triggered
	# wieder false, die verlorene DebateUI kann aber noch offen sein (Spieler hat sie noch
	# nicht geschlossen). Ohne diesen Guard würde erneutes Betreten ein zweites Overlay
	# instanziieren und die alte Instanz als Leak im Baum zurücklassen.
	if is_instance_valid(_debate_ui) and _debate_ui.is_inside_tree():
		return
	_triggered = true
	var qid := _resolve_question_id()
	station_entered.emit(qid)
	_open_debate(qid)


func _resolve_question_id() -> int:
	if station_id != "":
		var qd := get_tree().root.get_node_or_null("/root/QuestData")
		if qd != null:
			var station: Variant = qd.call("get_station_by_id", station_id)
			if station != null:
				return int(station.theology_question_id)
	return question_id_override


func _open_debate(question_id: int) -> void:
	if debate_ui_scene == null:
		push_warning("[quest_station_trigger] debate_ui_scene nicht gesetzt — keine UI geöffnet")
		return
	_debate_ui = debate_ui_scene.instantiate() as CanvasLayer
	if _debate_ui == null:
		push_error("[quest_station_trigger] DebateUI-Instanziierung fehlgeschlagen (kaputte/fehlende Szene) — keine UI geöffnet")
		return
	get_tree().root.add_child(_debate_ui)
	if _debate_ui.has_signal("debate_finished"):
		_debate_ui.connect("debate_finished", _on_debate_finished)
	_debate_ui.call("open_for_question", question_id)


## Reagiert auf den Debattenausgang (AK3: sichtbarer Spielfortschritt): ein Sieg wird im
## globalen DebateProgress gezählt und die Station bleibt verbraucht; eine Niederlage macht
## die Station wieder betretbar, sodass der Spieler sie nach dem Verlassen erneut angehen kann.
func _on_debate_finished(_question_id: int, won: bool) -> void:
	if won:
		var progress := get_tree().root.get_node_or_null("/root/DebateProgress")
		if progress != null:
			progress.call("mark_won", _question_id)
		# Station bleibt verbraucht — explizit auch im Retry-nach-Niederlage-Pfad nötig,
		# wo _triggered durch die vorherige Niederlage bereits auf false zurückgesetzt wurde.
		_triggered = true
	else:
		_triggered = false


## Test-Hilfe: die zuletzt geöffnete Debatten-UI (oder null).
func get_debate_ui() -> CanvasLayer:
	return _debate_ui
