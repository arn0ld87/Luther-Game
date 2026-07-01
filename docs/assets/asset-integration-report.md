# Asset-Integrationsbericht (Issue #25)

> Integration der im Audit (#10) freigegebenen Drittassets nach `/game/assets/`.
> Stand: 2026-07-01 · Branch: `feature/godot-approved-assets-integration` · Godot 4.7-stable.

## Was integriert wurde

Nur `APPROVED` / `APPROVED_WITH_ATTRIBUTION` aus [`asset-decision-register.csv`](./asset-decision-register.csv).
Kuratierte, CI-sicher importierbare **Runtime-Auswahl** (nicht die vollständigen Rohpakete):

| Pack | Format | Dateien (Modelle) | Lizenz |
|---|---|---|---|
| Kenney Castle Kit | GLB (+ geteilte `Textures/colormap.png`) | 15 | CC0 |
| Quaternius Medieval Village MegaKit | glTF + .bin + PBR-Texturen | 6 | CC0 |
| KayKit Medieval Hexagon Pack | glTF + .bin + Atlas | 6 | CC0 |
| poly.pizza (Church, Temple, gothic-set) | GLB | 7 | 6× CC-BY 3.0, 1× CC0 |
| Quaternius Knight | OBJ + MTL | 2 | CC0 |
| Quaternius LowPoly RPG Characters | OBJ + MTL + PNG | 4 (inkl. Monk) | CC0 |
| Kenney Impact / RPG / UI Audio | OGG | 12 | CC0 |
| StarNinjas Sword Sounds | OGG | 4 | CC0 |
| OpenGameArt CC0-Musik (Town, Battle) | MP3 | 2 | CC0 |

**Katalog:** `game/resources/asset_catalog/asset_catalog.json` — **62 Einträge** (44 Modelle + 18 Audio), davon **6 attributionspflichtig** (CC-BY, poly.pizza) und 56 CC0.

## Struktur

```
game/assets/
  third_party/{kenney,quaternius,kaykit,polypizza,opengameart}/…   # je SOURCE.md
  audio/{music,sfx/…}/                                             # je SOURCE.md
  licenses/                                                        # CC0-Lizenzkopien + README
game/resources/asset_catalog/asset_catalog.json
game/scenes/dev/asset_gallery.tscn        + scripts/dev/asset_gallery.gd
game/scenes/world/asset_integration_test_world.tscn + scripts/dev/asset_integration_test_world.gd
game/tests/asset_integration_test.gd
game/tools/stage_approved_assets.mjs      # reproduzierbares Staging aus godot_assets/
game/tools/generate_asset_catalog.mjs     # Katalog/SOURCE.md/licenses aus Audit-Quelle
```

Gesamtgröße des Runtime-Sets: **~21 MB** (größte Einzeldatei 5,1 MB — kein Git-LFS nötig).

## Reproduzierbarkeit & Größe

- Rohpakete (206 MB ZIPs, volle Packs) werden **nicht** committet. `game/tools/stage_approved_assets.mjs`
  kopiert die freigegebene Runtime-Auswahl reproduzierbar aus dem git-ignorierten `godot_assets/`
  und löst glTF-/OBJ-Abhängigkeiten (`.bin`, Texturen, `.mtl`, geteilte `colormap.png`) auf.
- Bewusst **nicht** übernommen: `oga_monk_cc0.blend` (CC0, aber `.blend` braucht Blender → CI-untauglich;
  stattdessen `Monk.obj` aus dem RPG-Characters-Pack), `BossBattle_JuhaniJunkala_cc0.wav` (20 MB, CC0),
  sowie alle `QUARANTINED`/`EXCLUDED`-Assets.
- Kein Runtime-Bezug auf `godot_assets/`: das Projekt bootet ohne das lokale Verzeichnis.

## Szenen

- **`scenes/dev/asset_gallery.tscn`** (script-getrieben): lädt jedes Modell aus dem Katalog, stellt es im
  Raster aus, beschriftet mit Dateiname + Pack + Lizenzstatus (`[CC-BY]`-Marker) und meldet fehlende
  Ressourcen sichtbar (roter Marker) + `push_error`. Einfache Beleuchtung (DirectionalLight + Ambient), Audio-Probe.
- **`scenes/world/asset_integration_test_world.tscn`**: kleine Mittelalter-/Wittenberg-Blockout-Umgebung —
  Boden (mit Kollision), Gebäudegruppe (Kirche, Kathedrale, Burg, Tempel, Kenney-Mauer/Tor/Turm),
  Prop-Gruppe (KayKit-Kisten/Fahne/Leiter, Ritter), Kollisions-Testbereich (echte Trimesh-Kollision auf
  einem Turm) und Audio-Testknoten (Musik + Sword-SFX). **Kein** fertiger Vertical Slice.

## Technische Prüfergebnisse (lokal, Godot 4.7-stable macOS)

| Prüfung | Ergebnis |
|---|---|
| `--headless --import` | exit 0, **0 `ERROR:`-Zeilen** (nach Ergänzung der geteilten Kenney-`colormap.png`) |
| `asset_integration_test.gd` | **ALL TESTS PASSED** — Katalog 44 Modelle + 18 Audio geladen; Galerie 44 platziert / 0 fehlend; Testwelt Gebäude=8 Props=6 Kollision=2 Audio=2 |
| `player_movement_test.gd` (Bestand) | ALL TESTS PASSED (keine Regression) |
| `camera_rig_test.gd` (Bestand) | ALL TESTS PASSED (keine Regression) |
| Boot `--path game --quit` | exit 0, 0 Fehler |
| 72 `.import`-Dateien | erzeugt und mitversioniert; keine fehlenden Modell-/Texturreferenzen |

**Behobenes Import-Problem:** Die Kenney-Castle-GLBs (UnityGLTF-Export) referenzieren extern die geteilte
Textur `Textures/colormap.png` — ohne sie erscheinen die Modelle pink. Das Staging-Skript kopiert sie mit.

## Attribution

Die verpflichtende CC-BY-Attribution der 6 poly.pizza-Modelle steht in der versionierten Root-Datei
[`/ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md); der Katalog markiert diese Einträge mit
`attribution_required: true` + `attribution_text`.
