# Asset-Audit — Worklog (Phase 0: Inventur & Sicherheitscheck)

> Arbeitsprotokoll zur Lizenzprüfung von `godot_assets/` (GitHub-Issue #10).
> **Keine Freigaben in diesem Dokument** — reine Inventur und Sicherheitsprüfung.
> Freigabeentscheidungen stehen in [`asset-license-audit.md`](./asset-license-audit.md)
> und [`asset-decision-register.csv`](./asset-decision-register.csv).

## Rahmendaten

- **Audit-Datum:** 2026-07-01
- **Commit-Stand (Branch-Basis):** `main` @ `58020b5` (Camera-Rig PR #23 gemergt)
- **Audit-Branch:** `feature/asset-license-audit`
- **Geprüftes Verzeichnis:** `godot_assets/` (vollständig per `.gitignore:16` git-ignoriert, ~526 MB inkl. Roh-ZIPs)
- **Prüfwerkzeuge:** Datei-Walk + `shasum -a 256` (SHA-256 je Ursprungspaket), wörtliches Lesen jeder lokalen Lizenzdatei, Verifikation fehlender Lizenzen über die offizielle Ursprungsquelle.

## Mengengerüst (`godot_assets/`, rekursiv)

| Kategorie | Anzahl | Größe |
|---|---|---|
| Dateien gesamt | 3198 | 526,1 MB |
| 3D-Modelle `.fbx` | 715 | 47,0 MB |
| 3D-Modelle `.obj` (+ `.mtl` 536) | 536 | 26,9 MB |
| 3D-Modelle `.gltf` (+ `.bin` 397) | 397 | 1,3 MB |
| 3D-Modelle `.glb` | 85 | 5,2 MB |
| 3D-Quellen `.blend` | 21 | 27,4 MB |
| Texturen `.png` | 206 | 152,9 MB |
| Texturen `.jpg` | 7 | 4,3 MB |
| Audio `.ogg` | 254 | 2,8 MB |
| Audio `.mp3` | 3 | 5,8 MB |
| Audio `.wav` | 1 | 20,8 MB |
| Lizenzdateien `License*.txt` | 7 | < 0,1 MB |
| Roh-ZIPs `_downloads/*.zip` (Ursprungspakete) | 10 | 206,2 MB |
| Sonstiges (`.pdf` UserGuide ×1, `.html` Overview ×1, `.url` Shortcuts ×12) | 14 | 8,6 MB |
| **Potenziell ausführbare Dateien** (`.gd/.cs/.py/.sh/.exe/.dll/.dylib/.so/.bat/.ps1/.js/.jar/.app/.scpt`) | **0** | — |
| **Symlinks** | **0** | — |

## Gefundene Asset-Packs / Einzelassets

### `buildings/`
- `kenney_castle-kit/` — lokale `License.txt` vorhanden
- `quaternius_medieval-village-megakit/Medieval Village MegaKit[Standard]/` — lokale `License_Standard.txt` (explizit Standard-FREE-Teilmenge)
- `kaykit_medieval-hexagon-pack/KayKit_Medieval_Hexagon_Pack_1.0_FREE/` — lokale `License.txt` vorhanden (+ `Medieval_Hexagon_UserGuide_v1.pdf`)
- `polypizza_church_poly-by-google.glb` — Einzeldatei, **keine** lokale Lizenz
- `polypizza_temple_quaternius_cc0.glb` — Einzeldatei, **keine** lokale Lizenz
- `polypizza_gothic-set/` — 7 GLB (Archway, Castle, Cathedral, Cemetary, `Church.glb`, `Church (1).glb`, Gate), **keine** lokale Lizenz

### `characters/`
- `knight-character_quaternius_cc0/Knight Character by @Quaternius/` — **keine** lokale Lizenz
- `lowpoly-rpg-characters_cc0/RPG Characters - Nov 2020/` — lokale `License.txt` vorhanden
- `oga_monk_cc0.blend` — Einzeldatei, **keine** lokale Lizenz

### `audio/`
- `kenney_impact-sounds/` — lokale `License.txt`
- `kenney_rpg-audio/` — lokale `License.txt`
- `kenney_ui-audio/` — lokale `License.txt`
- `oga_sword-sounds_cc0/` — 20 `.ogg` (StarNinjas), **keine** lokale Lizenz
- `oga_music/` — `TownTheme_cc0.mp3`, `BattleTheme_cc0.mp3`, `BossBattle_JuhaniJunkala_cc0.wav`, `ChurchBell_ccbysa.mp3`, **keine** lokale Lizenz

### `items/`, `props/`
- Leer (nur Platzhalterordner).

### `_downloads/`
- 10 Ursprungs-ZIPs (Roh-Downloads). SHA-256 erfasst, siehe `asset-decision-register.csv`. Werden **nicht** ins Repo übernommen (Roh-Bearbeitungsquellen, > GitHub-sinnvolle Größe).

## Sicherheitsbefund

- **Keine** Skripte, Plugins oder Executables (`.gd/.cs/.py/.sh/.exe/.dll/.dylib/.so/...`) in `godot_assets/`. Security-Scan sauber.
- **Keine** Symlinks.
- `.url`-Dateien sind reine Windows-Internet-Shortcuts (Verweise auf kenney.nl / patreon.com / itch.io / discord) — kein ausführbarer Code; werden nicht ins Spiel übernommen.
- `.DS_Store`-Dateien (macOS) sind vorhanden, werden nicht übernommen.

## Unklare / riskante Funde (für Phase 1 zu entscheiden)

1. **`audio/oga_music/ChurchBell_ccbysa.mp3`** — Dateiname signalisiert **CC-BY-SA** (Share-Alike). Share-Alike ist für ein später veröffentlichbares Spiel rechtlich heikel → konservativ Richtung **EXCLUDED**.
2. **Sketchfab-Monk (Inuciian, CC-BY 4.0)** — laut `MANIFEST.md` „noch offen, Login erforderlich" → **nicht im Bestand vorhanden** (kein Treffer in der Inventur) → **EXCLUDED** (out of scope).
3. **`polypizza_gothic-set/Church.glb` und `Church (1).glb`** — mehrere Church-Varianten, Modell-zu-Quelle-Zuordnung laut `MANIFEST.md` nicht eindeutig → Kandidaten für **QUARANTINED**, bis pro Datei eindeutig einer poly.pizza-Quelle zuordenbar.
4. **Alle OGA- und poly.pizza-Assets** haben **keine lokale Lizenzdatei** → Lizenz ausschließlich über die offizielle Ursprungsseite verifizieren (dokumentiert in der CSV mit URL + Abrufdatum), nicht aus dem Dateinamen ableiten.

## Abgrenzung — was unberührt bleibt

- Das alte **React-/Canvas-Webspiel** (Root: `components/`, `engine/`, `services/`, `server.ts`, `constants.ts` etc.) wird **nicht** verändert. Diese Phase betrifft ausschließlich Dokumentation unter `docs/assets/`, `ATTRIBUTIONS.md` und (Phase 2) `game/`.
- `godot_assets/` bleibt git-ignoriert; alle Audit-Artefakte liegen an versionierten Orten außerhalb davon.
