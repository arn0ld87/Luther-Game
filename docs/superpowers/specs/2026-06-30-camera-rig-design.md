# Third-Person-Kamera-Rig für die Spielfigur

**Issue:** #12 — Third-Person-Kamera-Rig für die Spielfigur · **Meilenstein:** M1 · **Status:** Entwurf · **Godot-Version:** 4.7 (Forward+, siehe `project.godot`)
**Abhängigkeiten:** Issue #11 (Spielercharakter mit Bewegung und Kollision, *erledigt*, `scripts/entities/Player.gd` + `scenes/Player.tscn`); Issue #10 (Asset-Lizenzprüfung `godot_assets/`, formal noch offen — für dieses private, nicht veröffentlichte Projekt wurde die Verwendung der `godot_assets/`-Inhalte vom Projekt-Owner ausdrücklich freigegeben, siehe Risiken)

## Problem/Kontext

Die Spielfigur aus Issue #11 (`Player.tscn`, `CharacterBody3D` mit `move_and_slide()`-Bewegung und Schwerkraft) bewegt sich bereits kollisionssicher durch die 3D-Welt, hat aber keine Kamera, die ihr nachvollziehbar folgt. `bootstrap.tscn` enthält aktuell nur eine statische `Camera3D` mit fest codiertem `transform` — sie folgt der Spielfigur nicht und ist als reine Platzhalterkamera aus der M0-Bootstrap-Stage entstanden.

Laut Roadmap (`docs/planning/roadmap.md`, Abschnitt „M1 — Spielercharakter + Kamera + Steuerung") ist ein „Kamera-Rig (z. B. Third-Person-Follow-Kamera, passend zum Lowpoly-Wittenberg-/Dorf-Setting)" explizit Teil des M1-Umfangs; die M1-Definition-of-Done verlangt zusätzlich, dass die Kamera „bei Bewegung/Kollision stabil [bleibt] (kein Clipping durch Geometrie ohne Behandlung)". Eine starre oder 1:1 an die Spielfigur geparentete Kamera würde bei Annäherung an Wände/Gebäude (perspektivisch Kenney Castle Kit / Quaternius Medieval Village MegaKit aus `godot_assets/`) zwangsläufig durch Geometrie clippen.

Dieses Issue liefert das Kamera-*Verhalten* (Folgen, Kollisionsvermeidung, Orbit-Rotation), nicht die Spielfigur-Bewegung (#11, Voraussetzung) und nicht die Eingabebindung (#13, separat). Godots dokumentierter Standardansatz für kollisionssicheres Third-Person-Following ist `SpringArm3D` mit einem `Camera3D`-Kind: Der Node castet eine Form entlang seiner Z-Achse und zieht seine Kinder bei Geometrie dazwischen automatisch näher heran — das deckt das Clipping-Kriterium der DoD direkt ab, ohne eine manuelle Raycast-Lösung selbst bauen zu müssen.

## Architektur (Szenenbaum als Code-Block)

Neue, eigenständige Szene `res://scenes/CameraRig.tscn` (entkoppelt von `Player.tscn`, damit die Kamera nicht 1:1 an die Spielfigur geparentet ist und unabhängig instanziiert/getestet werden kann):

```
CameraRig (Node3D, script: res://scripts/camera/CameraRig.gd)
└── SpringArm3D
    └── Camera3D                      # current = true, keine eigene Rotation/Position (sitzt an der Spitze des SpringArm3D)
```

`CameraRig` selbst trägt die Yaw-Rotation (horizontaler Orbit, `rotation.y`) und das Positions-Smoothing; `SpringArm3D` trägt die Pitch-Rotation (vertikaler Orbit, `rotation.x`) und die Kollisionsvermeidung (Shape-Cast). Kein zusätzlicher Pivot-Zwischenknoten nötig — bei `rotation = (0,0,0)` auf beiden Knoten positioniert sich die Kamera, exakt wie in der offiziellen Godot-SpringArm3D-Doku beschrieben, automatisch hinter der Figur (deren Vorwärtsrichtung laut `Player.gd` `-Z` ist, siehe `KEY_W → input_dir.z -= 1.0`) und blickt in deren Blickrichtung.

`bootstrap.tscn` nach Integration (Änderungen markiert):

```
Bootstrap (Node3D)
├── Floor (StaticBody3D)                          # collision_layer=1 "world", collision_mask=0 [GEÄNDERT: explizit gesetzt]
│   ├── FloorMesh (MeshInstance3D)
│   └── FloorCollision (CollisionShape3D)
├── DirectionalLight3D
├── Player (CharacterBody3D, instance=res://scenes/Player.tscn)   # collision_layer=2 "player", collision_mask=1 [GEÄNDERT]
│   ├── PlayerCollision (CollisionShape3D)
│   └── PlayerMesh (MeshInstance3D)
├── Obstacle (StaticBody3D)                        # collision_layer=1, collision_mask=0 [GEÄNDERT: explizit gesetzt]
│   ├── ObstacleMesh (MeshInstance3D)
│   └── ObstacleCollision (CollisionShape3D)
├── CameraWall (StaticBody3D)                      # [NEU] echtes Kenney-Castle-Kit-Wandstück, Haupt-Clipping-Test
│   ├── CameraWallMesh (MeshInstance3D / instance=res://assets/buildings/kenney_castle-kit/wall.glb)
│   └── CameraWallCollision (CollisionShape3D)
├── CameraThinObstacle (StaticBody3D)              # [NEU] dünne synthetische Box, dedizierter Tunneling-Test
│   ├── CameraThinObstacleMesh (MeshInstance3D)
│   └── CameraThinObstacleCollision (CollisionShape3D)
└── CameraRig (Node3D, instance=res://scenes/CameraRig.tscn)      # [NEU, ersetzt das alte statische Camera3D-Node]
    target = NodePath("../Player")
    └── SpringArm3D
        └── Camera3D                               # current = true
```

Das alte Top-Level-`Camera3D`-Node von `bootstrap.tscn` entfällt ersatzlos zugunsten der `CameraRig`-Instanz.

## Komponenten (`CameraRig.gd`)

Datei: `res://scripts/camera/CameraRig.gd` (neues Unterverzeichnis `scripts/camera/`, analog zu `scripts/entities/`). Godot legt beim ersten Speichern automatisch eine begleitende `CameraRig.gd.uid` an (wie bei `Player.gd.uid`) — kein manueller Schritt.

### Felder

| Feld | Typ | Sichtbarkeit | Zweck |
|---|---|---|---|
| `target` | `CharacterBody3D` | `@export` | Zu verfolgende Spielfigur; in `.tscn` als `NodePath` serialisiert (z. B. `NodePath("../Player")`), von Godot vor `_ready()` aufgelöst |
| `pivot_height` | `float` | `@export` | s. Tunable-Tabelle |
| `spring_length` | `float` | `@export` | s. Tunable-Tabelle |
| `collision_margin` | `float` | `@export` | s. Tunable-Tabelle |
| `camera_collision_radius` | `float` | `@export` | s. Tunable-Tabelle |
| `position_smoothing` | `float` | `@export` | s. Tunable-Tabelle |
| `initial_pitch_deg` | `float` | `@export` | s. Tunable-Tabelle |
| `pitch_min_deg` / `pitch_max_deg` | `float` | `@export` | s. Tunable-Tabelle |
| `spring_arm` | `SpringArm3D` | `@onready` (`$SpringArm3D`) | Referenz auf das Kollisions-/Pitch-Kind |
| `camera` | `Camera3D` | `@onready` (`$SpringArm3D/Camera3D`) | Referenz auf die eigentliche Kamera |
| `_pitch` | `float` | privat (Laufzeitzustand, Radiant) | Aktueller geklemmter Pitch-Wert, aus `initial_pitch_deg` initialisiert |

### Methoden

| Signatur | Verantwortlichkeit |
|---|---|
| `func _ready() -> void` | Validiert `target` (sonst `push_error`, analog zum defensiven Stil in `player_movement_test.gd`); überträgt die exportierten Kollisions-/Längenwerte einmalig auf `spring_arm` (`spring_length`, `margin`, `collision_mask`, `shape`); baut eine `SphereShape3D` aus `camera_collision_radius` und weist sie `spring_arm.shape` zu (macht aus dem SpringArm3D-Standard-Raycast einen Shape-Cast, siehe Kollisions-Layer-Setup); initialisiert `_pitch` aus `initial_pitch_deg`; springt einmalig ohne Smoothing auf `target.global_position + Vector3.UP * pivot_height`, damit der Rig nicht sichtbar von seiner Editor-Ausgangsposition heranfliegt |
| `func _physics_process(delta: float) -> void` | Berechnet `desired_position := target.global_position + Vector3.UP * pivot_height`; glättet `global_position` exponentiell in Richtung `desired_position` (frameratenunabhängig, s. u.); läuft bewusst im Physik-Tick (nicht `_process`), um synchron zur `CharacterBody3D`-Bewegung aus `Player.gd` zu bleiben |
| `func rotate_yaw(delta_rad: float) -> void` | Öffentliche API: addiert `delta_rad` auf `rotation.y` des `CameraRig`. Kein Clamping (horizontaler Orbit ist frei, 360°) |
| `func rotate_pitch(delta_rad: float) -> void` | Öffentliche API: addiert `delta_rad` auf `_pitch`, klemmt auf `[deg_to_rad(pitch_min_deg), deg_to_rad(pitch_max_deg)]`, schreibt das Ergebnis nach `spring_arm.rotation.x` |

`CameraRig.gd` verdrahtet bewusst **keinen** eigenen Input-Listener (kein `_unhandled_input`, keine Maus-/Tasten-Bindung) — Issue #12 selbst trennt im Scope-Wortlaut „Umfang der Steuerbarkeit … ist Teil dieses Issues zu definieren" von „die konkrete Input-Verdrahtung (Tasten-/Achsenbelegung) gehört … in das separate Input-Mapping-Issue". `rotate_yaw()`/`rotate_pitch()` bilden exakt diese Grenze: eine von der Eingabequelle vollständig entkoppelte öffentliche API, die Issue #13 (Konfigurierbares Input-Mapping) als erstes tatsächlich an eine Eingabequelle (Maus, Stick, Tastatur) bindet.

Referenzimplementierung (Stand dieses Spec, exakte Defaults siehe Tunable-Tabelle):

```gdscript
extends Node3D

## Issue #12 — Third-Person-Kamera-Rig. Folgt `target` per Lerp/Smoothing
## (kein 1:1-Parenting) und vermeidet Wand-/Gebäude-Clipping über den
## Shape-Cast des SpringArm3D-Kindknotens. Liefert rotate_yaw()/rotate_pitch()
## als input-quellenunabhängige öffentliche API für den Orbit; verdrahtet
## bewusst KEINEN Input-Listener (kein _unhandled_input) — das konkrete
## Anbinden einer Eingabequelle (Maus/Stick/Tastatur) an diese API ist
## explizit Issue #13 (Konfigurierbares Input-Mapping) vorbehalten.

@export var target: CharacterBody3D
@export var pivot_height: float = 0.7
@export var spring_length: float = 4.5
@export var collision_margin: float = 0.3
@export var camera_collision_radius: float = 0.2
@export var position_smoothing: float = 8.0
@export var initial_pitch_deg: float = -15.0
@export var pitch_min_deg: float = -40.0
@export var pitch_max_deg: float = 60.0

@onready var spring_arm: SpringArm3D = $SpringArm3D
@onready var camera: Camera3D = $SpringArm3D/Camera3D

var _pitch: float = 0.0

func _ready() -> void:
	if target == null:
		push_error("CameraRig: 'target' ist nicht gesetzt — Rig kann der Spielfigur nicht folgen.")
		return

	spring_arm.spring_length = spring_length
	spring_arm.margin = collision_margin
	spring_arm.collision_mask = 1 # Layer "world" — Layer "player" bewusst ausgeschlossen, siehe Kollisions-Layer-Setup

	var cast_shape := SphereShape3D.new()
	cast_shape.radius = camera_collision_radius
	spring_arm.shape = cast_shape # Shape-Cast statt Default-Raycast: vermeidet Tunneling an Kanten/dünner Geometrie

	_pitch = deg_to_rad(initial_pitch_deg)
	spring_arm.rotation.x = _pitch

	# Erstes Frame ohne Smoothing direkt auf die Zielfigur springen, statt
	# sichtbar von der Editor-Ausgangsposition heranzufliegen.
	global_position = target.global_position + Vector3.UP * pivot_height

func _physics_process(delta: float) -> void:
	if target == null:
		return

	var desired_position: Vector3 = target.global_position + Vector3.UP * pivot_height
	var factor: float = clampf(1.0 - exp(-position_smoothing * delta), 0.0, 1.0)
	global_position = global_position.lerp(desired_position, factor)

func rotate_yaw(delta_rad: float) -> void:
	rotation.y += delta_rad

func rotate_pitch(delta_rad: float) -> void:
	_pitch = clampf(_pitch + delta_rad, deg_to_rad(pitch_min_deg), deg_to_rad(pitch_max_deg))
	spring_arm.rotation.x = _pitch
```

### Verantwortlichkeiten

- Folgt der Zielfigur in Position mit Smoothing (`_physics_process`/Lerp), explizit **kein** 1:1-Parenting — deckt das Akzeptanzkriterium „kein Jitter bei schneller Bewegung/Richtungswechseln".
- Verwaltet Yaw (`CameraRig.rotation.y`) und Pitch (`SpringArm3D.rotation.x`) als Orbit um die Zielfigur, mit geklemmtem Pitch-Bereich gegen Überschlag/Bodenclipping.
- Konfiguriert die `SpringArm3D`-Kollisionsparameter zentral aus exportierten Feldern (`_ready()`) — keine Magic Numbers oder doppelt gepflegten Werte zwischen Script und `.tscn`, wie im Issue technisch gefordert.
- Stellt mit `rotate_yaw()`/`rotate_pitch()` eine von der Eingabequelle vollständig entkoppelte öffentliche API bereit; `CameraRig.gd` selbst bindet keine Eingabequelle an — die konkrete Input-Verdrahtung ist laut Issue #12 explizit Issue #13 (Konfigurierbares Input-Mapping) vorbehalten.
- Liefert **keine** Kollisionsabfrage für die Spielfigur-Bewegung — das bleibt vollständig in `Player.gd`/`move_and_slide()` (Issue #11), strikte Trennung der Verantwortlichkeiten.

## Kollisions-Layer-Setup

`project.godot` definiert bislang keine benannten Physik-Layer (Default „Layer 1"/„Layer 2" …). Ergänzung eines `[layer_names]`-Abschnitts:

```ini
[layer_names]

3d_physics/layer_1="world"
3d_physics/layer_2="player"
```

| Knoten | Datei | `collision_layer` | `collision_mask` | Begründung |
|---|---|---|---|---|
| `Floor` (StaticBody3D) | `bootstrap.tscn` | `1` ("world") | `0` | Level-Geometrie, von SpringArm3D-Cast erfasst |
| `Obstacle` (StaticBody3D) | `bootstrap.tscn` | `1` ("world") | `0` | dito (bestehend aus Issue #11, jetzt explizit gesetzt statt implizitem Default) |
| `CameraWall` (StaticBody3D, neu) | `bootstrap.tscn` | `1` ("world") | `0` | echtes Kenney-Castle-Kit-Wandstück (`wall.glb`, CC0), Haupt-Clipping-Test gegen reale Level-Geometrie (erfüllt Scope-Punkt 5 des Issues wörtlich) |
| `CameraThinObstacle` (StaticBody3D, neu) | `bootstrap.tscn` | `1` ("world") | `0` | synthetische 0,15 m dünne Box, dediziert für den Tunneling-Test an dünner Geometrie — im Kit kein ausreichend breites dünnes CC0-Stück verfügbar, gleiches Muster wie der bestehende `Obstacle`-Platzhalter aus Issue #11 (synthetisches Primitiv als reine Physik-Testgeometrie) |
| `Player` (CharacterBody3D) | `Player.tscn` | `2` ("player") | `1` | Spielfigur kollidiert weiterhin mit „world" (Issue #11 unverändert), liegt aber selbst **nicht** mehr auf Layer 1 — Voraussetzung für die Trennung im technischen Hinweis des Issues |
| `SpringArm3D` (in `CameraRig.gd`/`_ready()`) | `CameraRig.tscn` | – (kein eigener Layer, kein PhysicsBody) | `1` ("world") | Shape-Cast erfasst ausschließlich „world", **nicht** „player" — verhindert, dass die Kamera mit dem eigenen Charakter-Collider kollidiert (genau das im Issue genannte Risiko) |

Mechanismus laut Issue-technischem-Hinweis: `SpringArm3D.shape` wird in `_ready()` explizit auf eine `SphereShape3D` (Radius `camera_collision_radius`) gesetzt — Godots Default ohne `shape` ist ein reiner Raycast, der an Kanten/dünner Geometrie eher durchrutscht. Der Shape-Cast plus `margin` ist der dokumentierte, im PR zu nennende Mechanismus samt getesteten Parametern (siehe Tunable-Tabelle und Testplan).

## Tunable-Parameter

| Name | Typ | Default | Einheit | Zweck |
|---|---|---|---|---|
| `target` | `CharacterBody3D` | *(muss gesetzt werden)* | – | Zu verfolgende Spielfigur (`NodePath` in `.tscn`) |
| `pivot_height` | `float` | `0.7` | m | Höhen-Offset über `target.global_position` (Kapselzentrum, bei Idle ≈ 0,9 m über Boden laut `player_movement_test.gd`-Konstante `FLOOR_REST_Y`); ergibt einen absoluten Pivot von ≈ 1,6 m, knapp unter der Kapseloberkante (1,8 m) — Schulter-/Augenhöhe |
| `spring_length` | `float` | `4.5` | m | Ziel-Abstand `SpringArm3D` → `Camera3D` vor Kollisionsverkürzung |
| `collision_margin` | `float` | `0.3` | m | `SpringArm3D.margin` — Abstand, um den die Kamera vor der Trefferfläche stehen bleibt; bewusst über dem Godot-Default (0,01 m), da der Maßstab weiterer (noch nicht platzierter) Kenney-/Quaternius-Assets noch nicht durchgängig verifiziert ist (siehe Risiken) |
| `camera_collision_radius` | `float` | `0.2` | m | Radius der `SphereShape3D`, die dem `SpringArm3D` als `shape` zugewiesen wird — macht aus dem Default-Raycast einen Shape-Cast gegen Tunneling an dünner/kantiger Geometrie |
| `position_smoothing` | `float` | `8.0` | 1/s (Dämpfungsrate) | Glättungsfaktor für das Positions-Follow in `_physics_process` (`1 - e^(-rate·Δt)`), framerate-unabhängig |
| `initial_pitch_deg` | `float` | `-15.0` | ° | Start-Vertikalwinkel (`SpringArm3D.rotation.x`); negativ = Kamera leicht von oben auf die Figur geneigt |
| `pitch_min_deg` | `float` | `-40.0` | ° | Untere Clamp-Grenze (max. Blick von oben herab, verhindert zu starke Aufsicht/Bodenclipping) |
| `pitch_max_deg` | `float` | `60.0` | ° | Obere Clamp-Grenze (max. Blick von unten, verhindert Überschlag) |

## Testszene-Änderungen

**Asset-Pfad-Änderung:** Die Kamera lag bisher inline als `[node name="Camera3D" type="Camera3D" parent="."]` direkt in `res://scenes/bootstrap.tscn` (kein eigener Dateipfad) → neu ausgelagert in `res://scenes/CameraRig.tscn` (eigene `PackedScene`), in `bootstrap.tscn` nur noch per `ext_resource` referenziert und instanziiert.

Konkrete Änderungen:

1. **`game/scenes/CameraRig.tscn`** (neu): Szenenbaum wie im Architektur-Abschnitt, `script = ExtResource("CameraRig.gd")`, Camera3D-Kind mit `current = true`.
2. **`game/scripts/camera/CameraRig.gd`** (neu): siehe Komponenten-Abschnitt.
3. **Asset-Import:** `godot_assets/buildings/kenney_castle-kit/Models/GLB format/wall.glb` (CC0, Kenney Castle Kit, Quelle/Lizenz bereits in `godot_assets/MANIFEST.md` dokumentiert; Bounding-Box gemessen: 1,00 m × 1,31 m × 1,00 m, Pivot an der Basis bei y=0) wird nach `game/assets/buildings/kenney_castle-kit/wall.glb` kopiert und committet — `godot_assets/` selbst ist repo-weit `.gitignore`d und liegt außerhalb von `game/` (dem Godot-Projektroot), ist also nicht direkt als `res://...` ansprechbar. Erstes echtes Drittanbieter-Asset im Projekt; Lizenz für dieses private, nicht veröffentlichte Projekt ausdrücklich vom Projekt-Owner freigegeben (siehe Risiken zu Issue #10).
4. **`game/scenes/bootstrap.tscn`**:
   - `ext_resource type="PackedScene" path="res://scenes/CameraRig.tscn"` ergänzen.
   - `ext_resource type="PackedScene" path="res://assets/buildings/kenney_castle-kit/wall.glb"` ergänzen.
   - Bestehendes `[node name="Camera3D" type="Camera3D" parent="."]`-Node entfernen.
   - Neues Node `[node name="CameraRig" parent="." instance=ExtResource("camera_rig")]` mit `target = NodePath("../Player")` ergänzen.
   - `Floor`- und `Obstacle`-StaticBody3D-Nodes um `collision_layer = 1` und `collision_mask = 0` ergänzen (bisher impliziter Default).
   - Neues Node `CameraWall` (StaticBody3D, `collision_layer = 1`, `collision_mask = 0`) mit `CameraWallMesh` (Instanz des importierten `wall.glb`) und `CameraWallCollision` (`BoxShape3D`, Größe `Vector3(1.0, 1.31, 1.0)`, lokaler Transform-Offset `y = 0.655` damit die Box die Mesh-Ausdehnung 0→1,31 statt einer um den Ursprung zentrierten Box trifft) ergänzen, Node-Transform-Origin `(0, 0, 3.5)` — direkt im Standard-Sichtfeld der unrotierten Kamera hinter der Spielfigur-Startposition (Player bei `(0,1,0)`, Default-`spring_length` 4,5 m), damit der Clipping-Test bereits ohne Aufruf von `rotate_yaw()` greift.
   - Neues Node `CameraThinObstacle` (StaticBody3D, `collision_layer = 1`, `collision_mask = 0`) mit `CameraThinObstacleMesh` (`BoxMesh`, Größe `Vector3(2.0, 2.0, 0.15)`) und `CameraThinObstacleCollision` (`BoxShape3D`, gleiche Größe) ergänzen, Transform-Origin `(3.0, 1.0, -2.0)` — seitlich versetzt, im Testskript gezielt per `rotate_yaw()` anvisiert, damit Test 5 (Box) und Test 6 (dünne Wand) eindeutig unterscheidbare Geometrie treffen.
   - Exakte Positionen/Größen sind Startwerte und im Editor visuell zu verifizieren/nachzujustieren (DoD-Anforderung „Szene tatsächlich geöffnet und geprüft", siehe Verifikation-Abschnitt).
5. **`game/scenes/Player.tscn`**: `[node name="Player" type="CharacterBody3D"]` um `collision_layer = 2` und `collision_mask = 1` ergänzen.
6. **`game/project.godot`**: `[layer_names]`-Abschnitt mit `3d_physics/layer_1="world"` und `3d_physics/layer_2="player"` ergänzen.
7. **`.github/workflows/godot-validate.yml`**: neuen Schritt „Run camera rig behavior test (headless)" ergänzen, der `res://tests/camera_rig_test.gd` headless ausführt (siehe Verifikation-Abschnitt) — ohne diesen Schritt läuft der Testplan unten nie automatisiert im CI.

## Testplan

Neue Datei `game/tests/camera_rig_test.gd` (SceneTree-Script, Stil/Aufbau analog `player_movement_test.gd`, Ausführung via `godot --headless --path game --script res://tests/camera_rig_test.gd`):

1. **Folgt in Ruheposition:** Nach hinreichend vielen Settle-Frames muss `camera_rig.global_position` nahe `player.global_position + Vector3.UP * pivot_height` liegen — prüft die Grundfunktion des Folgeverhaltens.
2. **Smoothing statt 1:1-Sprung:** Nach einem abrupten Teleport der Spielfigur darf der Rig im unmittelbar folgenden Physik-Frame noch nicht auf der neuen Position stehen (näher an der alten als an der neuen) — prüft, dass tatsächlich geglättet wird statt 1:1-Parenting zu simulieren.
3. **Konvergenz nach Teleport:** Nach ausreichend vielen weiteren Frames muss der Rig die neue Spielfigur-Position erreicht haben (innerhalb Toleranz) — prüft, dass das Smoothing konvergiert statt dauerhaft nachzuhinken.
4. **Kein Hindernis → volle Spring-Länge:** Spielfigur an einer Position ohne `CameraWall`/`CameraThinObstacle` im Sichtfeld (z. B. Spawn vor jeglicher Bewegung, Blick in eine hindernisfreie Richtung) — `spring_arm.get_hit_length()` ≈ `spring_length` — Referenzwert für die folgenden Kollisionstests.
5. **Clipping-Vermeidung an `CameraWall` (echtes Asset):** In der Standard-Spawnkonstellation (keine Rotation nötig, `CameraWall` liegt im Default-Sichtfeld) muss `get_hit_length() < spring_length` sein und `camera.global_position` darf nicht innerhalb der `CameraWall`-AABB liegen — prüft das Kern-Akzeptanzkriterium „kein sichtbares Clipping durch Wände/Gebäude" gegen echte Level-Geometrie aus `godot_assets/`.
6. **Tunneling-Vermeidung an `CameraThinObstacle` (dünne Wand):** Nach `rotate_yaw()` in Richtung der 0,15 m dünnen Box muss die Kamera ebenfalls vor der Wand stehen bleiben (`get_hit_length() < spring_length`) — prüft explizit das Akzeptanzkriterium „kein Tunneling durch dünne Geometrie", das Test 5 mit der 1 m dicken `CameraWall` nicht abdeckt.
7. **Keine Eigenkollision mit der Spielfigur:** Bei minimal reduziertem `spring_length` (z. B. `0.5`, nahe am Charakter) darf `get_hit_length()` nicht durch den eigenen `PlayerCollision`-Collider verkürzt werden (`get_hit_length()` ≈ `spring_length`) — prüft die Layer/Mask-Trennung aus dem technischen Hinweis des Issues.
8. **Pitch-Clamping:** Wiederholte `rotate_pitch()`-Aufrufe weit über den erlaubten Bereich hinaus dürfen `spring_arm.rotation.x` nicht über `pitch_max_deg` hinaus bzw. unter `pitch_min_deg` hinaus treiben — prüft den Schutz gegen Bodenclipping/Überschlag.
9. **Yaw-Rotation wirkt:** Ein `rotate_yaw()`-Aufruf muss `camera_rig.rotation.y` um den erwarteten Betrag verändern — prüft die Orbit-Rotation unabhängig von der späteren Input-Verdrahtung aus Issue #13.
10. **Bootstrap-Integration:** Die geladene `bootstrap.tscn` muss genau ein Node `CameraRig` unter dem Root enthalten, dessen `Camera3D`-Kind `current = true` gesetzt hat — Regressionsschutz dafür, dass tatsächlich die neue Kamera statt der alten statischen `Camera3D` verwendet wird.
11. **Regressionsfreiheit für Issue #11:** `player_movement_test.gd` muss nach den `bootstrap.tscn`-Änderungen unverändert mit `ALL TESTS PASSED` durchlaufen — prüft, dass das Kamera-Rig-Feature (insbesondere die neuen Collision-Layer-Zuweisungen und die zusätzliche Level-Geometrie) keine Regression an Spielfigur-Bewegung/-Kollision aus Issue #11 verursacht.

## Verifikation (Definition of Done)

Issue #12, Akzeptanzkriterien Punkt 4 verweist wörtlich auf `docs/planning/definition-of-done.md` Abschnitt (c) und verlangt zwei Nachweise, die über den reinen Testplan hinausgehen:

1. **`godot --headless --import` läuft fehlerfrei.** Bereits durch den bestehenden CI-Schritt „Import /game (headless)" in `.github/workflows/godot-validate.yml` abgedeckt (`"$GODOT_BIN" --headless --path game --import --quit-after 1000`) — muss nach dem Asset-Import (`wall.glb`) erneut grün laufen, der PR muss explizit auf den grünen CI-Lauf verweisen, nicht stillschweigend voraussetzen.
2. **Die betroffene Szene wurde tatsächlich im Editor geöffnet und geprüft**, mit Screenshot oder konkreter Verhaltensbeschreibung im PR — nicht nur als `.tscn`-Diff angenommen. Das gilt für das *gesamte* CameraRig-Feature (Folgeverhalten, Yaw/Pitch-Orbit, Clipping-Vermeidung an `CameraWall` und `CameraThinObstacle`), inklusive einer visuellen Kontrolle, dass `wall.glb` in plausiblem Maßstab zur Spielfigur erscheint.
3. **CI-Erweiterung:** `.github/workflows/godot-validate.yml` wird um einen neuen Schritt „Run camera rig behavior test (headless)" ergänzt, analog zum bestehenden „Run player movement behavior test (headless)"-Schritt:

   ```yaml
   - name: Run camera rig behavior test (headless)
     run: |
       GODOT_BIN="$HOME/godot-editor/Godot_v${GODOT_VERSION}_linux.x86_64"
       "$GODOT_BIN" --headless --path game --script res://tests/camera_rig_test.gd
   ```

   Ohne diesen Schritt liefe der 11-Punkte-Testplan oben nie automatisiert im CI und hätte keine Merge-Gate-Wirkung, anders als der bereits CI-gebundene Test aus Issue #11.

Punkt 11 des Testplans (Regressionsfreiheit für Issue #11) wird durch denselben CI-Job automatisch mitgeprüft, da `player_movement_test.gd` im selben Workflow weiterhin ausgeführt wird.

## Out of Scope

(aus Issue #12, Abschnitt „Non-Goals", unverändert übernommen)

- Kein Input-Mapping/keine Tasten-/Achsenkonfiguration — eigenes Issue #13 („Konfigurierbares Input-Mapping"); dieses Feature liefert das Kamera-*Verhalten* (inkl. `rotate_yaw()`/`rotate_pitch()` als API), nicht die Eingabebindung. `CameraRig.gd` registriert dafür bewusst keinen eigenen Input-Listener.
- Keine Spielfigur-Bewegung/-Kollision selbst — eigenes Issue #11 (erledigt), Voraussetzung statt Teil dieses Scopes.
- Keine Quest-/Debatten-Kameraführung (z. B. Cutscene- oder Dialog-Kameras) — M2-Scope.
- Keine finale Kamera-Politur (Field-of-View-Tuning, Post-Processing, Kamera-Shake) — M4-Polish-Pass.
- Kein Gamepad-spezifisches Kamera-Tuning über das hinaus, was für Tastatur/Maus ohnehin gebraucht wird (Gamepad laut Roadmap optional).
- Keine formale Dokumentation der Asset-Lizenzprüfung selbst (das bleibt Issue #10) — dieses Issue nutzt nur ein einzelnes, bereits in `godot_assets/MANIFEST.md` als CC0 dokumentiertes Asset, mit ausdrücklicher Owner-Freigabe für dieses private Projekt.

## Risiken

(aus Issue #12, Abschnitt „Risiko", übernommen, Asset-/Lizenz-Risiko aktualisiert auf den tatsächlich gewählten Ansatz)

- **Scope-Creep (Risk Register Risiko 9):** Versuchung, Kamera-Tuning mit Input-Mapping oder ersten Quest-Trigger-Volumes zu vermischen, da alle drei in M1 zeitlich nah beieinander liegen — PR strikt auf das Kamera-Rig begrenzen; `CameraRig.gd` liefert bewusst nur `rotate_yaw()`/`rotate_pitch()` als öffentliche API ohne eigenen Input-Listener, keine Vorgriffe auf Issue #13.
- **Asset-Lizenzprüfung (Issue #10) formal offen:** `godot_assets/` ist insgesamt noch nicht formal lizenzgeprüft/dokumentiert über das hinaus, was `MANIFEST.md` bereits zusammenfasst (Kenney Castle Kit ist dort als CC0 gelistet). Für dieses private, nicht veröffentlichte Projekt hat der Projekt-Owner die Verwendung ausdrücklich freigegeben; dieser PR importiert deshalb genau ein Asset (`wall.glb`) gezielt für den Kamera-Kollisionstest, nicht den gesamten Asset-Bestand. Sobald Issue #10 abgeschlossen ist, sollte rückwirkend geprüft werden, ob die Verwendung mit dem dann formal dokumentierten Stand übereinstimmt — insbesondere falls das Projekt später veröffentlicht wird (dann wird CC0 ohnehin attributionsfrei nutzbar bleiben, andere im Kit enthaltene CC-BY-Stücke laut `MANIFEST.md` aber nicht).
- **Maßstabs-Risiko (verbleibend, jetzt teilweise adressiert):** `wall.glb` ist das erste real platzierte Asset im Projekt (Bounding-Box 1,00 × 1,31 × 1,00 m, gemessen) und liefert damit einen ersten echten Referenzpunkt gegen die Spielfigur-Kapsel (Radius 0,4 m, Höhe 1,8 m) — die Roadmap-Anforderung „Erste Verwendung von Assets aus `godot_assets/` … zur Maßstabs- und Kollisionsprüfung" wird durch diesen PR erstmals erfüllt. Der Maßstab *weiterer*, noch nicht platzierter Kenney-/Quaternius-Assets (z. B. Quaternius Medieval Village MegaKit) bleibt unverifiziert; alle in diesem Spec festgelegten Kamera-Default-Werte (`pivot_height`, `spring_length`, `collision_margin`, `camera_collision_radius`) sind deshalb ausschließlich als `@export`-Felder umgesetzt (keine Magic Numbers im Code), also ohne Code-Änderung nachjustierbar, falls sich nach weiteren Asset-Platzierungen andere Abstände als sinnvoller erweisen.
- **GDScript-Lernkurve (Risk Register Risiko 5):** `SpringArm3D`/Physik-Interpolation (insbesondere die framerate-unabhängige Smoothing-Formel `1 - e^(-rate·Δt)`) ist für Mitwirkende, die bisher nur TypeScript/React kennen, nicht selbsterklärend — `CameraRig.gd` ist deshalb analog zu `Player.gd` durchgängig kommentiert, insbesondere die Begründung für Shape-Cast statt Default-Raycast und die Layer/Mask-Trennung.
