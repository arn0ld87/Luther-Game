# Charakter-Assets — Zuordnung & Platzhalter

> Kontext: Issue #29 (Folge aus #25). Lizenz-/Herkunftsgrundlage ist das
> [Asset-Lizenz-Audit](./asset-license-audit.md); nur `APPROVED` /
> `APPROVED_WITH_ATTRIBUTION` Assets werden im Spiel verwendet.

## Zuordnung

| Rolle im Spiel | Asset | Lizenz | Autor | Pfad |
|---|---|---|---|---|
| **Luther (Player-Charakter)** | `monk.glb` (CDmir *Monk*, .blend → GLB) | CC0-1.0 | CDmir (Collaborators: TinyWorlds) | `res://assets/third_party/opengameart/monk.glb` |
| **Guard-Enemy** | `KnightCharacter.obj` (OGA *LowPoly Animated Knight*) | CC0-1.0 | Quaternius | `res://assets/third_party/opengameart/knight/KnightCharacter.obj` |

## Player-Charakter

Das `monk.glb` ist dem Player (`scenes/Player.tscn`, `CharacterBody3D`) als rein
kosmetisches Kind **`Visual`** zugewiesen. Die Kollision
(`PlayerCollision`, `CapsuleShape3D` radius 0.4 / height 1.8) und die
Bewegungslogik (`scripts/entities/Player.gd`) bleiben unverändert — das Visual
trägt keine eigene Kollision.

Maße / Ausrichtung:

- Native GLB-AABB: `size ≈ (1.11, 1.77, 0.64)`, Füße bei `y ≈ 0`.
- Uniform-Scale `0.95` → Zielhöhe `≈ 1.68` (innerhalb der Kapselhöhe 1.8).
- Y-Offset `-0.877` → Füße stehen am unteren Kapselende (`y = -0.9`).
- Ausrichtung: Default (Blickrichtung `-Z`, Godot-Forward). Rotation bei Bedarf
  später anpassen.

Das Modell ist ein **Platzhalter**: keine finale Charaktermodellierung, kein
Gameplay-Rigging/Animation.

## `.blend` → GLB Export

Godot importiert `.blend` nicht direkt ohne Blender-Toolchain; die Quelldatei
wird einmalig zu GLB exportiert:

- **Quelle (git-ignoriert):** `godot_assets/characters/oga_monk_cc0.blend`
- **Ziel im Projekt:** `res://assets/third_party/opengameart/monk.glb`
- **Autor:** CDmir (Collaborators: TinyWorlds) · **Lizenz:** CC0-1.0
  ([OpenGameArt](https://opengameart.org/content/monk))
- **Audit-Eintrag:** `oga_monk_cdmir` → `APPROVED` (siehe
  [asset-decision-register.csv](./asset-decision-register.csv)).

Headless Export-Befehl (Blender muss installiert sein):

```bash
blender godot_assets/characters/oga_monk_cc0.blend \
  --background \
  --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='game/assets/third_party/opengameart/monk.glb', export_format='GLB')"
```

Nach dem Export muss `scenes/Player.tscn` das `Visual`-Node auf die neue
`PackedScene` umstellen und Scale/Offset neu bestimmt werden.
