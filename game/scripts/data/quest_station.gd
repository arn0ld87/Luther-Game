class_name QuestStation
extends Resource
## Typisiertes Datenmodell für eine Quest-/Dialogstation im Godot-3D-Spiel.
##
## Pendant zum Web-Interface `Question { id, text, context }` (types.ts:138-142),
## erweitert um 3D-/Quest-spezifische Felder für M2. Die Instanzen werden zur
## Laufzeit aus JSON geladen (siehe QuestData-Autoload), NICHT hart im Skript
## verdrahtet — theologische Inhalte bleiben datengetrieben (Risk Register Risk 6).
##
## Formatwahl JSON-auf-Platte + typisiertes Modell: siehe
## docs/architecture/game-architecture.md Abschnitt 6.
##
## Erweiterbar ohne Schema-Bruch für Issue #15 (Content-Migration) und
## Issue #16 (Debatten-UI): neue optionale Felder mit Default ergänzen, `from_dict`
## erweitern; bestehende Konsumenten bleiben funktionsfähig.

## Eindeutige, stabile ID der Station (String, damit ein Generator sprechende
## Schlüssel statt fortlaufender Zahlen vergeben kann). Pflichtfeld.
@export var id: String = ""

## Anzeigename/Kurztitel der Station (z. B. für Log/HUD/Debug).
@export var title: String = ""

## Fragetext der Debatte an dieser Station (Pendant zu `Question.text`).
@export var question_text: String = ""

## Theologischer Kontext / Bibelstelle (Pendant zu `Question.context`).
@export var scripture_reference: String = ""

## Verknüpfung zur Theologie-SSOT (`resources/theology/theology_questions.json`,
## Autoload `TheologyData`): ID der zugehörigen Frage, oder -1 wenn eigenständig.
## Erlaubt es Issue #15, echten Content über TheologyData zu beziehen, statt ihn
## hier zu duplizieren.
@export var theology_question_id: int = -1

## Position der begehbaren Quest-Station in der 3D-Welt (Trigger-Ort). 3D-/Quest-
## spezifisches Zusatzfeld — verbindet das Datenmodell mit dem Spielraum (M1-Player).
@export var world_position: Vector3 = Vector3.ZERO

## Reihenfolge der Station im Quest-Ablauf (aufsteigend). Steuert Sortierung.
@export var order: int = 0

## IDs von Stationen, die zuvor abgeschlossen sein müssen (Vorbedingungen).
@export var prerequisites: Array[String] = []

## ID der Folge-Station bei erfolgreichem Debattenausgang ("" = keine/Ende).
## Verknüpfung zum Debattenausgang für Issue #16.
@export var next_on_success: String = ""


## Baut eine QuestStation defensiv aus einem geparsten JSON-Dictionary.
##
## Unbekannte Schlüssel werden ignoriert, fehlende Felder erhalten den Default —
## so bleibt das Laden robust gegen Teil-Daten und spätere Schema-Erweiterungen.
static func from_dict(d: Dictionary) -> QuestStation:
	var station := QuestStation.new()
	station.id = str(d.get("id", ""))
	station.title = str(d.get("title", ""))
	station.question_text = str(d.get("question_text", ""))
	station.scripture_reference = str(d.get("scripture_reference", ""))
	station.theology_question_id = int(d.get("theology_question_id", -1))
	station.order = int(d.get("order", 0))
	station.next_on_success = str(d.get("next_on_success", ""))

	var pos: Variant = d.get("world_position", null)
	if pos is Dictionary:
		var p := pos as Dictionary
		station.world_position = Vector3(
			float(p.get("x", 0.0)),
			float(p.get("y", 0.0)),
			float(p.get("z", 0.0))
		)

	var prereq: Variant = d.get("prerequisites", [])
	if prereq is Array:
		var typed: Array[String] = []
		for item: Variant in prereq:
			typed.append(str(item))
		station.prerequisites = typed

	return station


## True, wenn die Station ein theologisch valides Minimalset trägt: nicht-leere ID
## und Fragetext. Von QuestData zur Validierung geladener Daten genutzt.
func is_valid() -> bool:
	return id != "" and question_text != ""
