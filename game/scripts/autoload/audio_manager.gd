extends Node
## AudioManager (Issue #18, M3) — zentrale Audio-Kulisse + Lautstärkeregelung.
##
## Zuständig für:
##  - Audio-Busse (Master → Music/SFX) per AudioServer, statt nur Master — damit
##    zwei getrennte Lautstärkeregler greifen (AK).
##  - Hintergrundmusik-Loop (TownTheme) auf dem Music-Bus.
##  - SFX-Trigger (Schritte, UI-Klick, Debattenausgang richtig/falsch) auf dem
##    SFX-Bus über einen kleinen Player-Pool für überlappende Effekte.
##  - Persistenz der Lautstärkeeinstellungen (user://settings.json) über Neustart.
##
## Lautstärke wird linear (0.0–1.0) geführt (UI-freundlich) und beim Anwenden
## nach dB gewandelt (linear_to_db); 0.0 → -80 dB (stumm, statt -inf).
##
## Autoload-Lookup in --script-Tests: globale Identifier sind dort nicht
## garantiert → Lookup per Node-Pfad (siehe debate_ui.gd).

const SETTINGS_PATH := "user://settings.json"
const BUS_MASTER := "Master"
const BUS_MUSIC := "Music"
const BUS_SFX := "SFX"

const MUSIC := "res://assets/audio/music/TownTheme.mp3"
const SFX_FOOTSTEPS := [
	"res://assets/audio/sfx/kenney-impact/footstep_carpet_000.ogg",
	"res://assets/audio/sfx/kenney-impact/footstep_carpet_001.ogg",
	"res://assets/audio/sfx/kenney-impact/footstep_carpet_002.ogg",
	"res://assets/audio/sfx/kenney-impact/footstep_carpet_003.ogg",
]
const SFX_UI_CLICK := "res://assets/audio/sfx/kenney-ui/click1.ogg"
const SFX_DEBATE_WIN := "res://assets/audio/sfx/kenney-rpg/bookFlip1.ogg"
const SFX_DEBATE_LOSE := "res://assets/audio/sfx/oga-sword/sword_clash.1.ogg"

signal volumes_changed()

var _music: AudioStreamPlayer
var _sfx_pool: Array[AudioStreamPlayer] = []
var _sfx_index := 0
const SFX_POOL_SIZE := 4

# Linear 0.0–1.0. Defaults: alles auf.
var _music_volume := 1.0
var _sfx_volume := 1.0


func _ready() -> void:
	_setup_buses()
	_load_settings()
	_apply_volumes()
	_start_music()


func _setup_buses() -> void:
	# Busse nur anlegen, falls sie nicht schon (z. B. aus Editor-Layout) existieren.
	if AudioServer.get_bus_index(BUS_MUSIC) == -1:
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.get_bus_count() - 1, BUS_MUSIC)
		AudioServer.set_bus_send(AudioServer.get_bus_count() - 1, BUS_MASTER)
	if AudioServer.get_bus_index(BUS_SFX) == -1:
		AudioServer.add_bus()
		AudioServer.set_bus_name(AudioServer.get_bus_count() - 1, BUS_SFX)
		AudioServer.set_bus_send(AudioServer.get_bus_count() - 1, BUS_MASTER)


func _start_music() -> void:
	_music = AudioStreamPlayer.new()
	_music.name = "Music"
	_music.bus = BUS_MUSIC
	if ResourceLoader.exists(MUSIC):
		var s := load(MUSIC)
		if s is AudioStreamMP3:
			(s as AudioStreamMP3).loop = true
		if s is AudioStream:
			_music.stream = s
	add_child(_music)
	# play() braucht den Baum (im --script-Test ohne Main-Loop ist der Player
	# ggf. noch nicht verbunden) — nur spielen, wenn wirklich eingehängt.
	if _music.is_inside_tree():
		_music.play()


func set_music_volume(linear: float) -> void:
	_music_volume = clampf(linear, 0.0, 1.0)
	_apply_volumes()
	_save_settings()
	volumes_changed.emit()


func set_sfx_volume(linear: float) -> void:
	_sfx_volume = clampf(linear, 0.0, 1.0)
	_apply_volumes()
	_save_settings()
	volumes_changed.emit()


func get_music_volume() -> float:
	return _music_volume


func get_sfx_volume() -> float:
	return _sfx_volume


func _apply_volumes() -> void:
	var mi := AudioServer.get_bus_index(BUS_MUSIC)
	var si := AudioServer.get_bus_index(BUS_SFX)
	if mi != -1:
		AudioServer.set_bus_volume_db(mi, _linear_to_db(_music_volume))
	if si != -1:
		AudioServer.set_bus_volume_db(si, _linear_to_db(_sfx_volume))


func _linear_to_db(v: float) -> float:
	# 0.0 → stumm (-80 dB), sonst Standard-Umrechnung. Vermeidet -inf beim Slider.
	if v <= 0.0001:
		return -80.0
	return linear_to_db(v)


func play_sfx(path: String) -> void:
	if _sfx_pool.is_empty():
		_ensure_sfx_pool()
	if not ResourceLoader.exists(path):
		push_warning("[AudioManager] SFX fehlt: " + path)
		return
	var stream := load(path)
	if not (stream is AudioStream):
		push_warning("[AudioManager] keine AudioStream: " + path)
		return
	var p := _sfx_pool[_sfx_index]
	_sfx_index = (_sfx_index + 1) % SFX_POOL_SIZE
	p.stream = stream
	p.play()


func _ensure_sfx_pool() -> void:
	for i in range(SFX_POOL_SIZE):
		var p := AudioStreamPlayer.new()
		p.name = "SFX_%d" % i
		p.bus = BUS_SFX
		add_child(p)
		_sfx_pool.append(p)


func play_footstep() -> void:
	# Variation über die 4 Teppich-Schritte, damit es nicht mechanisch klingt.
	play_sfx(SFX_FOOTSTEPS[randi() % SFX_FOOTSTEPS.size()])


func play_ui_click() -> void:
	play_sfx(SFX_UI_CLICK)


func play_debate_result(won: bool) -> void:
	play_sfx(SFX_DEBATE_WIN if won else SFX_DEBATE_LOSE)


func _load_settings() -> void:
	if not FileAccess.file_exists(SETTINGS_PATH):
		return
	var f := FileAccess.open(SETTINGS_PATH, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	f.close()
	if not (parsed is Dictionary):
		push_warning("[AudioManager] settings.json ungültig, nutze Defaults")
		return
	var d := parsed as Dictionary
	_music_volume = clampf(float(d.get("music_volume", 1.0)), 0.0, 1.0)
	_sfx_volume = clampf(float(d.get("sfx_volume", 1.0)), 0.0, 1.0)


func _save_settings() -> void:
	var d := {
		"music_volume": _music_volume,
		"sfx_volume": _sfx_volume,
	}
	var f := FileAccess.open(SETTINGS_PATH, FileAccess.WRITE)
	if f == null:
		push_error("[AudioManager] settings.json nicht schreibbar")
		return
	f.store_string(JSON.stringify(d, "\t"))
	f.close()