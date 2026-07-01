extends SceneTree

## Headless-Verifikation des AudioManager (Issue #18, Audio-Kern).
##
## Deckt:
##  - Busse Music + SFX werden (nach _ready) angelegt und auf Master geroutet.
##  - get/set_music_volume + get/set_sfx_volume Roundtrip (linear 0..1).
##  - Stumm (0.0) → -80 dB statt -inf (Slider-freundlich).
##  - Persistenz: set_*_volume schreibt user://settings.json, Werte stimmen.
##
## Audio-Ausgabe ist im headless-Modus nicht hörbar, aber Bus-Metadata und
## Lautstärke-DB lassen sich ohne Audiogerät prüfen. play_sfx/stream laden
## ist hier nicht abgedeckt (braucht ResourceLoader-Kontext).

const SETTINGS_PATH := "user://settings.json"

func _initialize() -> void:
	var AudioManager: Node = root.get_node_or_null("AudioManager")
	if AudioManager == null:
		push_error("FAIL: AudioManager-Autoload nicht geladen")
		quit(1)
		return

	# Im --script-Modus (extends SceneTree) läuft der Main-Loop nicht, also werden
	# die _ready-Callbacks der Autoloads NICHT ausgeführt. AudioServer-Bus-Setup
	# und Settings-Load passieren aber in _ready → hier manuell anstoßen.
	AudioManager._ready()

	# Sauberer Start — ggf. vorhandene Settings löschen und Defaults anwenden.
	_DirAccess_remove(SETTINGS_PATH)
	AudioManager.call("set_music_volume", 1.0)
	AudioManager.call("set_sfx_volume", 1.0)

	# --- Test 1: Busse angelegt + auf Master geroutet ---
	var mi := AudioServer.get_bus_index("Music")
	var si := AudioServer.get_bus_index("SFX")
	if mi == -1 or si == -1:
		push_error("FAIL: Music/SFX-Bus fehlt (mi=%d si=%d)" % [mi, si])
		_cleanup()
		quit(1)
		return
	if AudioServer.get_bus_send(mi) != "Master" or AudioServer.get_bus_send(si) != "Master":
		push_error("FAIL: Bus-Send nicht Master: music=%s sfx=%s" %
			[AudioServer.get_bus_send(mi), AudioServer.get_bus_send(si)])
		_cleanup()
		quit(1)
		return
	print("PASS Busse Music/SFX angelegt und auf Master geroutet")

	# --- Test 2: Volume get/set Roundtrip ---
	AudioManager.call("set_music_volume", 0.5)
	AudioManager.call("set_sfx_volume", 0.25)
	if absf(float(AudioManager.call("get_music_volume")) - 0.5) > 0.001:
		push_error("FAIL: music_volume nicht 0.5: %s" % AudioManager.call("get_music_volume"))
		_cleanup()
		quit(1)
		return
	if absf(float(AudioManager.call("get_sfx_volume")) - 0.25) > 0.001:
		push_error("FAIL: sfx_volume nicht 0.25: %s" % AudioManager.call("get_sfx_volume"))
		_cleanup()
		quit(1)
		return
	print("PASS Volume get/set Roundtrip (music=0.5 sfx=0.25)")

	# --- Test 3: Bus-DB korrekt + Stumm → -80 dB ---
	var music_db := AudioServer.get_bus_volume_db(mi)
	var expected_db := linear_to_db(0.5)
	if absf(music_db - expected_db) > 0.01:
		push_error("FAIL: music bus db=%s erwartet=%s" % [music_db, expected_db])
		_cleanup()
		quit(1)
		return
	AudioManager.call("set_sfx_volume", 0.0)
	if AudioServer.get_bus_volume_db(si) != -80.0:
		push_error("FAIL: sfx stumm db=%s erwartet -80" % AudioServer.get_bus_volume_db(si))
		_cleanup()
		quit(1)
		return
	print("PASS Bus-DB korrekt, Stumm → -80 dB")

	# --- Test 4: Persistenz (settings.json geschrieben + Werte stimmen) ---
	AudioManager.call("set_music_volume", 0.7)
	AudioManager.call("set_sfx_volume", 0.3)
	if not FileAccess.file_exists(SETTINGS_PATH):
		push_error("FAIL: settings.json nicht geschrieben")
		_cleanup()
		quit(1)
		return
	var f := FileAccess.open(SETTINGS_PATH, FileAccess.READ)
	if f == null:
		push_error("FAIL: settings.json nicht lesbar")
		_cleanup()
		quit(1)
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if not (parsed is Dictionary):
		push_error("FAIL: settings.json kein gültiges JSON")
		_cleanup()
		quit(1)
		return
	var d := parsed as Dictionary
	if absf(float(d.get("music_volume", 99.0)) - 0.7) > 0.001 \
			or absf(float(d.get("sfx_volume", 99.0)) - 0.3) > 0.001:
		push_error("FAIL: settings.json Werte falsch: %s" % d)
		_cleanup()
		quit(1)
		return
	print("PASS Persistenz: settings.json Werte korrekt (music=0.7 sfx=0.3)")

	_cleanup()
	print("ALL TESTS PASSED")
	quit(0)


func _cleanup() -> void:
	_DirAccess_remove(SETTINGS_PATH)


func _DirAccess_remove(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)