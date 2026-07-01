extends Node
## Lade-/Parse-Logik für das Quest-/Dialog-Datenmodell (Issue #14).
##
## Lädt `res://resources/quests/quest_stations.json` und hält die Stationen als
## typisierte `QuestStation`-Instanzen bereit. Konsumierbar durch die künftige
## Content-Migration (Issue #15) und die Debatten-UI (Issue #16), ohne dass diese
## das JSON selbst parsen müssen.
##
## Gespiegelt am etablierten `TheologyData`-Autoload (M1) — bewusst gleiche Struktur,
## damit beide Datenquellen einheitlich konsumiert werden. Theologische Inhalte
## bleiben datengetrieben statt im Skript verdrahtet (Risk Register Risk 6).

const PATH := "res://resources/quests/quest_stations.json"

var stations: Array[QuestStation] = []
var version: int = 0


func _ready() -> void:
	_reload()


func _reload() -> void:
	stations = []
	version = 0

	if not ResourceLoader.exists(PATH):
		push_error("[quest_data] JSON fehlt: " + PATH)
		return

	var file := FileAccess.open(PATH, FileAccess.READ)
	if file == null:
		push_error("[quest_data] Kann JSON nicht öffnen: " + PATH)
		return

	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed == null or not parsed is Dictionary:
		push_error("[quest_data] JSON nicht parsebar: " + PATH)
		return

	var data := parsed as Dictionary
	version = int(data.get("version", 0))

	var raw: Variant = data.get("stations", [])
	if not raw is Array:
		push_error("[quest_data] 'stations' ist kein Array")
		return

	for item: Variant in raw:
		if item is Dictionary:
			var station := QuestStation.from_dict(item as Dictionary)
			if station.is_valid():
				stations.append(station)
			else:
				push_error("[quest_data] Ungültige Station übersprungen (id/Fragetext fehlt)")


## Liefert die Station mit der gegebenen ID oder `null`, wenn keine passt.
func get_station_by_id(id: String) -> QuestStation:
	for station in stations:
		if station.id == id:
			return station
	return null


## Liefert alle Stationen nach `order` aufsteigend sortiert (stabile Kopie).
func get_stations_in_order() -> Array[QuestStation]:
	var sorted := stations.duplicate()
	sorted.sort_custom(func(a: QuestStation, b: QuestStation) -> bool:
		return a.order < b.order
	)
	return sorted
