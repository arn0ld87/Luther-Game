extends SceneTree

## Headless-Verifikation des Save/Load-Systems (Issue #17).
##
## Deckt die Akzeptanzkriterien 1–3 + 6 + 7 ab:
##  - AK1/2: save_game persistiert Position + Debattenfortschritt in user://
##  - AK3: Save enthält einen Zeitstempel
##  - AK6: fehlende + korrupte Datei → definierter Fallback (kein Crash)
##  - AK7: Save enthält save_version
## AK4 (Full-Neustart-Zyklus) und AK5 (UI-Anbindung) brauchen Editor-Prüfung;
## die Logik ist hier abgedeckt.

const SAVE_PATH := "user://save.json"

func _initialize() -> void:
	# Autoload-Lookup per Node-Pfad (headless-robust, siehe debate_ui.gd) — die
	# globalen Identifier SaveManager/DebateProgress sind in --script-Läufen nicht
	# garantiert verfügbar. Im extends-SceneTree-Test sind absolute Pfade in
	# _initialize nicht nutzbar („outside active scene tree"), daher relativ zum
	# root-Viewport (Autoloads hängen direkt an root). Lokale Variablen gleichen
	# Namens shadowen sauber.
	var SaveManager: Node = root.get_node_or_null("SaveManager")
	var DebateProgress: Node = root.get_node_or_null("DebateProgress")
	if SaveManager == null or DebateProgress == null:
		push_error("FAIL: Autoloads nicht geladen (SaveManager=%s DebateProgress=%s)" %
			[SaveManager != null, DebateProgress != null])
		quit(1)
		return

	# Sauberer Start — ggf. vorhandener Save vorher löschen.
	SaveManager.delete_save()

	# --- Test 1: Speichern + Laden des vollen Spielstands ---
	var saved: bool = SaveManager.save_game(Vector3(2.5, 1.0, -7.0), 1.5, [1, 3])
	if not saved:
		push_error("FAIL: save_game returned false")
		quit(1)
		return
	if not SaveManager.has_save():
		push_error("FAIL: has_save false nach save_game")
		quit(1)
		return
	print("PASS save_game schreibt Datei")

	var state: Dictionary = SaveManager.load_game()
	if state.is_empty():
		push_error("FAIL: load_game leer nach gültigem Save")
		quit(1)
		return
	if int(state.get("save_version", 0)) != 1:
		push_error("FAIL: save_version fehlt/falsch: %s" % state.get("save_version"))
		quit(1)
		return
	if String(state.get("saved_at", "")).is_empty():
		push_error("FAIL: saved_at Zeitstempel fehlt")
		quit(1)
		return
	var p: Dictionary = state.get("player", {})
	if absf(float(p.get("x", 99.0)) - 2.5) > 0.001 \
			or absf(float(p.get("y", 99.0)) - 1.0) > 0.001 \
			or absf(float(p.get("z", 99.0)) - -7.0) > 0.001 \
			or absf(float(p.get("rotation_y", 99.0)) - 1.5) > 0.001:
		push_error("FAIL: Player-State nicht korrekt wiedergegeben: %s" % p)
		quit(1)
		return
	var d: Dictionary = state.get("debate", {})
	# JSON-Roundtrip liefert numbers als float → für den Vergleich int-casten
	# (DebateProgress.from_dict macht das produktiv genauso mit int(id)).
	var ids: Array = d.get("won_ids", [])
	var int_ids: Array = []
	for x in ids:
		int_ids.append(int(x))
	if int_ids.size() != 2 or not int_ids.has(1) or not int_ids.has(3):
		push_error("FAIL: won_ids nicht korrekt gespeichert: %s" % [ids])
		quit(1)
		return
	print("PASS load_game stellt Position + Debattenfortschritt + Version + Zeitstempel wieder her")

	# --- Test 2: DebateProgress.to_dict / from_dict Roundtrip ---
	DebateProgress.reset()
	DebateProgress.mark_won(1)
	DebateProgress.mark_won(2)
	DebateProgress.mark_won(1)  # idempotent — darf Zähler nicht erhöhen
	if DebateProgress.won_count() != 2:
		push_error("FAIL: mark_won idempotenz verletzt: %d" % DebateProgress.won_count())
		quit(1)
		return
	var dd: Dictionary = DebateProgress.to_dict()
	DebateProgress.reset()
	DebateProgress.from_dict(dd)
	if DebateProgress.won_count() != 2 or not DebateProgress.is_won(1) or not DebateProgress.is_won(2):
		push_error("FAIL: from_dict Roundtrip: count=%d" % DebateProgress.won_count())
		quit(1)
		return
	print("PASS DebateProgress to_dict/from_dict Roundtrip + idempotent mark_won")

	# --- Test 3: Korrupte Datei → leerer Fallback, kein Crash ---
	SaveManager.delete_save()
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	f.store_string("{ das ist kein gültiges json ")
	f.close()
	var corrupt: Dictionary = SaveManager.load_game()
	if not corrupt.is_empty():
		push_error("FAIL: korrupter Save sollte leeres Dictionary liefern")
		quit(1)
		return
	print("PASS korrupte Datei → leerer Fallback ohne Crash")

	# --- Test 4: Fehlende Datei → leerer Fallback ---
	SaveManager.delete_save()
	if SaveManager.has_save():
		push_error("FAIL: has_save true nach delete_save")
		quit(1)
		return
	if not SaveManager.load_game().is_empty():
		push_error("FAIL: load_game bei fehlender Datei nicht leer")
		quit(1)
		return
	if not SaveManager.get_save_timestamp().is_empty():
		push_error("FAIL: get_save_timestamp nicht leer ohne Save")
		quit(1)
		return
	print("PASS fehlende Datei → leerer Fallback, has_save=false, timestamp leer")

	# Aufräumen — Test darf keinen Spielstand im user://-Verzeichnis hinterlassen.
	SaveManager.delete_save()

	print("ALL TESTS PASSED")
	quit(0)