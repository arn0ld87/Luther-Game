# Charakter-Assets — Zuordnung & Platzhalter

> Kontext: Issue #29 (Folge aus #25). Lizenz-/Herkunftsgrundlage ist das
> [Asset-Lizenz-Audit](./asset-license-audit.md); nur `APPROVED` /
> `APPROVED_WITH_ATTRIBUTION` Assets werden im Spiel verwendet.

## Zuordnung

| Rolle im Spiel | Asset | Lizenz | Autor | Pfad |
|---|---|---|---|---|
| **Luther (Player-Platzhalter)** | `Monk.obj` (Quaternius *LowPoly RPG Characters*) | CC0-1.0 | Quaternius | `res://assets/third_party/opengameart/rpg-characters/Monk.obj` |
| **Guard-Enemy** | `KnightCharacter.obj` (OGA *LowPoly Animated Knight*) | CC0-1.0 | Quaternius | `res://assets/third_party/opengameart/knight/KnightCharacter.obj` |

## Player-Platzhalter (aktuell)

Der `Monk.obj` ist dem Player (`scenes/Player.tscn`, `CharacterBody3D`) als rein
kosmetisches `MeshInstance3D`-Kind **`Visual`** zugewiesen. Die Kollision
(`PlayerCollision`, `CapsuleShape3D` radius 0.4 / height 1.8) und die
Bewegungslogik (`scripts/entities/Player.gd`) bleiben unverändert — das Visual
trägt keine eigene Kollision.

Maße / Ausrichtung:

- Native Mesh-AABB: `size ≈ (1.58, 2.90, 0.81)`, Füße bei `y ≈ 0`.
- Uniform-Scale `0.586` → Zielhöhe `≈ 1.70` (≈ Kapselhöhe 1.8).
- Y-Offset `-0.9` → Füße stehen am unteren Kapselende (`y = -0.9`).
- Ausrichtung: Default (Blickrichtung `-Z`, Godot-Forward). Rotation bei Bedarf
  später anpassen.

Der Mönch ist ein **Platzhalter**: keine finale Charaktermodellierung, kein
Rigging/Animation.

## Spätere höherwertige Alternative: `oga_monk_cc0.blend`

Eine höherwertige, gerigg­te Monk-Variante liegt als `.blend` vor und bleibt für
einen späteren Austausch vorgesehen (kein Teil dieses Platzhalter-Issues):

- **Quelle (git-ignoriert):** `godot_assets/characters/oga_monk_cc0.blend`
- **Autor:** CDmir (Collaborators: TinyWorlds) · **Lizenz:** CC0-1.0
  ([OpenGameArt](https://opengameart.org/content/monk))
- **Audit-Eintrag:** `oga_monk_cdmir` → `APPROVED` (siehe
  [asset-decision-register.csv](./asset-decision-register.csv)).

### Export-Pfad (`.blend` → GLB)

Godot importiert `.blend` nicht direkt ohne Blender-Toolchain; für die
Übernahme ins Spiel wird die Datei einmalig zu GLB exportiert:

1. `oga_monk_cc0.blend` in Blender öffnen.
2. `File → Export → glTF 2.0 (.glb)`; Format **glTF Binary (.glb)**,
   `+Y up`, Meshes + Materials aktiv.
3. Ziel gemäß Staging-Konvention:
   `game/assets/third_party/opengameart/monk.glb`
   (Audit-Zielpfad: `game/assets/third_party/opengameart/monk.blend`).
4. Godot importiert die GLB automatisch; das `Visual`-Mesh in
   `scenes/Player.tscn` auf die neue Mesh/Szene umstellen und Scale/Offset
   analog neu bestimmen.

Bis dahin bleibt `Monk.obj` der aktive Luther-Platzhalter.
