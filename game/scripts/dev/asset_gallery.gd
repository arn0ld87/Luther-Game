extends Node3D
## Dev-Asset-Galerie (Issue #25).
## Lädt alle Modelle aus dem Asset-Katalog (res://resources/asset_catalog/asset_catalog.json),
## stellt sie in einem Raster aus, beschriftet jedes mit Dateiname + Pack + Lizenzstatus
## und meldet fehlende Ressourcen sichtbar (roter Marker) sowie über push_error.
##
## Keine Gameplay-Annahmen — reines Entwickler-Schaufenster.

const CATALOG_PATH := "res://resources/asset_catalog/asset_catalog.json"
const COLS := 6
const SPACING := 3.0
const TARGET_SIZE := 2.0

# Von asset_integration_test.gd nach dem Instanziieren ausgewertet:
var placed_count := 0
var missing_count := 0
var model_total := 0
var audio_total := 0

func _ready() -> void:
	var assets := _load_catalog()
	var models: Array = assets.filter(func(a): return String(a.get("kind", "")) == "model")
	model_total = models.size()
	var i := 0
	for a in models:
		var pos := Vector3(float(i % COLS) * SPACING, 0.0, float(i / COLS) * SPACING)
		var node := _instantiate_model(String(a.get("path", "")))
		if node == null:
			_add_marker(pos + Vector3(0.0, 1.0, 0.0), "MISSING\n" + String(a.get("path", "")), Color(0.9, 0.1, 0.1))
			missing_count += 1
		else:
			add_child(node)
			node.position = pos
			_fit(node)
			var attr := " [CC-BY]" if bool(a.get("attribution_required", false)) else ""
			_add_marker(pos + Vector3(0.0, TARGET_SIZE + 0.6, 0.0),
				"%s\n%s%s" % [String(a.get("path", "")).get_file(), String(a.get("pack", "")), attr],
				Color(1.0, 1.0, 1.0))
			placed_count += 1
		i += 1

	var audios: Array = assets.filter(func(a): return String(a.get("kind", "")) == "audio")
	audio_total = audios.size()
	if audio_total > 0:
		_add_audio_probe(String(audios[0].get("path", "")))

	print("[gallery] Modelle platziert=%d fehlend=%d gesamt=%d, Audio-Einträge=%d" %
		[placed_count, missing_count, model_total, audio_total])

func _load_catalog() -> Array:
	if not FileAccess.file_exists(CATALOG_PATH):
		push_error("[gallery] Katalog fehlt: " + CATALOG_PATH)
		return []
	var f := FileAccess.open(CATALOG_PATH, FileAccess.READ)
	var parsed = JSON.parse_string(f.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY or not parsed.has("assets"):
		push_error("[gallery] Katalog ungültig oder ohne 'assets': " + CATALOG_PATH)
		return []
	return parsed["assets"]

## Lädt ein Modell und liefert eine platzierbare Node3D — behandelt sowohl
## als PackedScene importierte (GLB/glTF) als auch als Mesh importierte (OBJ) Ressourcen.
func _instantiate_model(path: String) -> Node3D:
	if path.is_empty() or not ResourceLoader.exists(path):
		push_error("[gallery] Ressource fehlt: " + path)
		return null
	var res := load(path)
	if res is PackedScene:
		return (res as PackedScene).instantiate() as Node3D
	if res is Mesh:
		var mi := MeshInstance3D.new()
		mi.mesh = res
		return mi
	push_error("[gallery] Unbekannter Ressourcentyp für: " + path)
	return null

func _fit(node: Node3D) -> void:
	var box := _global_aabb(node)
	var m := maxf(box.size.x, maxf(box.size.y, box.size.z))
	if m > 0.001:
		var s := TARGET_SIZE / m
		node.scale = Vector3(s, s, s)

func _global_aabb(root: Node3D) -> AABB:
	var out := AABB()
	var first := true
	for vi in root.find_children("*", "VisualInstance3D", true, false):
		var v := vi as VisualInstance3D
		var b := v.get_aabb()
		var gt := v.global_transform
		for c in 8:
			var corner := b.position + Vector3(
				b.size.x * float(c & 1),
				b.size.y * float((c >> 1) & 1),
				b.size.z * float((c >> 2) & 1))
			var g := gt * corner
			if first:
				out = AABB(g, Vector3.ZERO)
				first = false
			else:
				out = out.expand(g)
	return out

func _add_marker(pos: Vector3, text: String, color: Color) -> void:
	var label := Label3D.new()
	label.text = text
	label.modulate = color
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	label.pixel_size = 0.008
	label.position = pos
	add_child(label)

func _add_audio_probe(path: String) -> void:
	var p := AudioStreamPlayer.new()
	p.name = "AudioProbe"
	if ResourceLoader.exists(path):
		var s := load(path)
		if s is AudioStream:
			p.stream = s
	add_child(p)
