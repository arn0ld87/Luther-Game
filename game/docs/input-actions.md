# Input Actions

Diese Dokumentation beschreibt die in Godot definierten Input-Actions für "Sola Fide: The Luther Run".

## Actions & Bindings

| Action Name | Zweck | Keyboard / Maus Bindings | Joypad Bindings |
|-------------|-------|--------------------------|-----------------|
| `move_forward` | Vorwärtsbewegung | `W`, `Up Arrow` | `Left Stick Up` (Axis 1-) |
| `move_back` | Rückwärtsbewegung | `S`, `Down Arrow` | `Left Stick Down` (Axis 1+) |
| `move_left` | Linksbewegung | `A`, `Left Arrow` | `Left Stick Left` (Axis 0-) |
| `move_right` | Rechtsbewegung | `D`, `Right Arrow` | `Left Stick Right` (Axis 0+) |
| `interact` | Interaktion / Bestätigen | `E` | `Button A` (Button 0) |
| `pause` | Menü / Pause | `Escape` | `Start` (Button 6) |
| `look_left` | Kamera nach links drehen | - | `Right Stick Left` (Axis 2-) |
| `look_right` | Kamera nach rechts drehen | - | `Right Stick Right` (Axis 2+) |
| `look_up` | Kamera nach oben neigen | - | `Right Stick Up` (Axis 3-) |
| `look_down` | Kamera nach unten neigen | - | `Right Stick Down` (Axis 3+) |
| `camera_zoom_in` | Kamera-Zoom heran | `Mouse Wheel Up` | - |
| `camera_zoom_out` | Kamera-Zoom weg | `Mouse Wheel Down` | - |

## Verwendung im Code (GDScript)

Statt direkter Key-Abfragen (`KEY_W` etc.) werden ausschließlich die Action-Namen verwendet.

### Bewegung
Für die 2D-Bewegung wird `Input.get_vector()` genutzt, um ein normalisiertes Ergebnis zu erhalten:
```gdscript
var input_vector := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
```

### Interaktion & Menü
Für einzelne Impulse oder Zustandsabfragen:
```gdscript
if Input.is_action_just_pressed("interact"):
    # Interaktions-Logik
    pass

if Input.is_action_just_pressed("pause"):
    # Pause-Menü öffnen
    pass
```
