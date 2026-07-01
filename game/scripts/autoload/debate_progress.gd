extends Node
## Globaler Fortschritts-State über die Debatten-/Quest-Stationen (Issue #16, AK3).
##
## Zählt gewonnene Debatten je Theologie-Frage-ID — idempotent, dieselbe Station zählt
## nur einmal. Als Autoload registriert (DebateProgress in project.godot), damit der
## Fortschritt über einzelne, per queue_free() verworfene DebateUI-Instanzen hinweg
## erhalten bleibt und als "X/N" sichtbar gemacht werden kann.

signal progress_changed(won_count: int, total: int)

## Anzahl der Stationen im aktuellen Level (die 3 Wittenberg-Debatten, Issue #16).
## Bewusst als Konstante gehalten — wächst die Stationszahl, wird sie hier angepasst.
const TOTAL_STATIONS: int = 3

var _won_ids: Dictionary = {}


## Markiert die Station/Frage als gewonnen. Idempotent — mehrfaches Melden derselben
## Frage-ID verändert den Zähler nicht.
func mark_won(question_id: int) -> void:
	if _won_ids.has(question_id):
		return
	_won_ids[question_id] = true
	progress_changed.emit(won_count(), TOTAL_STATIONS)


func won_count() -> int:
	return _won_ids.size()


func total() -> int:
	return TOTAL_STATIONS


func is_won(question_id: int) -> bool:
	return _won_ids.has(question_id)


## Setzt den Fortschritt zurück (z. B. bei Level-Neustart oder im Test).
func reset() -> void:
	_won_ids.clear()
	progress_changed.emit(0, TOTAL_STATIONS)


## Serialisiert den Fortschritt für SaveManager (Issue #17). `won_ids` als
## Array statt Dictionary-Keys, damit das JSON-Format stabil und lesbar bleibt
## (Dictionary mit int-Keys würde in Godots JSON zu String-Keys).
func to_dict() -> Dictionary:
	return {"won_ids": _won_ids.keys()}


## Stellt den Fortschritt aus einem Save wieder her. Idempotent mit reset,
## damit keine Reste eines alten Spielstands hängen bleiben. Emitiert
## progress_changed, damit die UI („X/N") sofort den geladenen Stand zeigt.
func from_dict(d: Dictionary) -> void:
	_won_ids.clear()
	var ids: Array = d.get("won_ids", [])
	for id in ids:
		_won_ids[int(id)] = true
	progress_changed.emit(won_count(), TOTAL_STATIONS)
