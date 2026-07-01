extends SceneTree

## Headless-Verifikation des AccessibilityManager (Issue #18, Accessibility-Teil).
##
## Deckt:
##  - text_scale + high_contrast get/set + Persistenz (user://accessibility.json).
##  - Remapping: set_remap ändert die InputMap (Key ersetzt), get_remap liefert sie.
##  - reset_remap stellt den Default-Snapshot wieder her.
##
## GUI-Anwendung (font_size/Kontrast in DebateUI, Remapping-Buttons im PauseMenu)
## ist nicht headless testbar — die Kernlogik (Persistenz + InputMap) hier.

const SETTINGS_PATH := "user://accessibility.json"
const TEST_KEY := 88  # Key.KEY_X

func _initialize() -> void:
	var AccessibilityManager: Node = root.get_node_or_null("AccessibilityManager")
	if AccessibilityManager == null:
		push_error("FAIL: AccessibilityManager-Autoload nicht geladen")
		quit(1)
		return

	# Im --script-Modus läuft _ready der Autoloads nicht → manuell anstoßen
	# (Default-Snapshot + Settings-Load + Remap-Apply).
	AccessibilityManager._ready()
	_DirAccess_remove(SETTINGS_PATH)
	AccessibilityManager._ready()  # neu laden mit cleanem File → Defaults

	# --- Test 1: text_scale Roundtrip + Persistenz ---
	AccessibilityManager.call("set_text_scale", 1.2)
	if absf(float(AccessibilityManager.call("get_text_scale")) - 1.2) > 0.001:
		_fail("text_scale nicht 1.2: %s" % AccessibilityManager.call("get_text_scale"))
		return
	if not _file_has("text_scale", 1.2):
		_fail("text_scale nicht persistiert")
		return
	print("PASS text_scale get/set + persistiert (1.2)")

	# --- Test 2: high_contrast Roundtrip + Persistenz ---
	AccessibilityManager.call("set_high_contrast", true)
	if not bool(AccessibilityManager.call("get_high_contrast")):
		_fail("high_contrast nicht true")
		return
	if not _file_has("high_contrast", true):
		_fail("high_contrast nicht persistiert")
		return
	print("PASS high_contrast get/set + persistiert (true)")

	# --- Test 3: Remapping ändert InputMap ---
	# Default VOR dem Remap merken (danach ist jump auf KEY_X, nicht mehr Default).
	var default_kc := _first_keycode("jump")
	AccessibilityManager.call("set_remap", "jump", TEST_KEY)
	if int(AccessibilityManager.call("get_remap", "jump")) != TEST_KEY:
		_fail("get_remap nicht %d: %s" % [TEST_KEY, AccessibilityManager.call("get_remap", "jump")])
		return
	if not _action_has_keycode("jump", TEST_KEY):
		_fail("InputMap hat jump nicht auf KEY_X")
		return
	print("PASS set_remap ändert InputMap (jump → KEY_X)")

	# --- Test 4: reset_remap stellt Default wieder her ---
	AccessibilityManager.call("reset_remap", "jump")
	if int(AccessibilityManager.call("get_remap", "jump")) != 0:
		_fail("get_remap nach reset nicht 0: %s" % AccessibilityManager.call("get_remap", "jump"))
		return
	if not _action_has_keycode("jump", default_kc):
		_fail("InputMap hat nach reset nicht den Default (kc=%d)" % default_kc)
		return
	print("PASS reset_remap stellt Default wieder her (jump → kc=%d)" % default_kc)

	# --- Test 5: Remapping übersteht Neustart (Persistenz + Reload) ---
	AccessibilityManager.call("set_remap", "interact", TEST_KEY)
	# Simuliert Neustart: neuer AccessibilityManager-Lifecycle mit _ready.
	AccessibilityManager._ready()
	if int(AccessibilityManager.call("get_remap", "interact")) != TEST_KEY:
		_fail("remap nach Reload nicht vorhanden: %s" % AccessibilityManager.call("get_remap", "interact"))
		return
	if not _action_has_keycode("interact", TEST_KEY):
		_fail("InputMap nach Reload hat interact nicht auf KEY_X")
		return
	print("PASS Remapping übersteht Neustart (interact → KEY_X)")

	_cleanup()
	print("ALL TESTS PASSED")
	quit(0)


func _fail(msg: String) -> void:
	push_error("FAIL: " + msg)
	_cleanup()
	quit(1)


func _cleanup() -> void:
	_DirAccess_remove(SETTINGS_PATH)


func _action_has_keycode(action: String, kc: int) -> bool:
	if not InputMap.has_action(action):
		return false
	for e in InputMap.action_get_events(action):
		if e is InputEventKey and int((e as InputEventKey).physical_keycode) == kc:
			return true
	return false


func _first_keycode(action: String) -> int:
	if not InputMap.has_action(action):
		return 0
	for e in InputMap.action_get_events(action):
		if e is InputEventKey:
			return int((e as InputEventKey).physical_keycode)
	return 0


func _file_has(key: String, expected: Variant) -> bool:
	if not FileAccess.file_exists(SETTINGS_PATH):
		return false
	var f := FileAccess.open(SETTINGS_PATH, FileAccess.READ)
	if f == null:
		return false
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if not (parsed is Dictionary):
		return false
	var v: Variant = (parsed as Dictionary).get(key, null)
	if expected is float:
		return absf(float(v) - float(expected)) < 0.001
	return v == expected


func _DirAccess_remove(path: String) -> void:
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)