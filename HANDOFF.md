# HANDOFF — Aktueller Projektzustand

> Einstiegspunkt für die nächste Session.
> Stand: 2026-07-01 · Godot 4.7-stable · Binary: `.godot-editor/Godot.app/Contents/MacOS/Godot` (lokal, gitignoriert — siehe `game/README.md`)

## Meilensteine

| Meilenstein | Status | PRs / Issues |
|---|---|---|
| M0 — Projektgrundgerüst + CI | ✅ abgeschlossen | — |
| M1 — Spielercharakter + Kamera + Steuerung | ✅ abgeschlossen | PR #36 |
| M2 — Quest-/Dialog-/Debattensystem | ✅ abgeschlossen | PRs #37, #38, #39 · Issues #14, #15, #16 geschlossen |
| M3 — Save/Load + Audio + Accessibility | offen, aktueller Fokus | Issue #17 (Save/Load), Issue #18 (Audio/Accessibility) |
| M4 — Polish + Export-Builds + Release | offen | Issue #19 |

Weitere gemergte Schlüssel-PRs: #22 Player-Movement (Issue #11), #23 Kamera-Rig (#12), #24 Asset-Lizenz-Audit, #26 Asset-Integration nach `game/assets/`, #30 Freigabe quarantänisierter poly.pizza-Kirchen, #31 CC0-Mönch als Luther-Player-Visual, #32 Asset-Lizenz-CI-Gate, #33 TypeScript-Fixes + CI-Typecheck, #34 npm-Vulnerability-Triage, #35 konfigurierbares Input-Mapping (#13), #40 Umstellung der Hauptszene auf `wittenberg_intro.tscn`.

## Projektzustand (Godot-Seite, `game/`)

- **Hauptszene:** `world/wittenberg_intro.tscn` (`run/main_scene`, seit PR #40) — erstes echtes Level: Kirchenvorplatz, Schlosskirche, Stadtmauer, 11 Gebäude, 4 Props, 12 Kollisionskörper, 3 Quest-Stationen mit NPCs aus den OGA-RPG-Charakteren, Ambient-Musik. `bootstrap.tscn` bleibt als Dev-Blockout-/Testszene erhalten.
- **Weitere Szenen:** `Player.tscn` (`CharacterBody3D` + Mönch-GLB-Visual), `CameraRig.tscn` (Third-Person, Follow/Collision/Orbit), `ui/DebateUI.tscn`, `world/QuestStationTrigger.tscn`, `dev/asset_gallery.tscn`, `world/asset_integration_test_world.tscn`.
- **Autoloads:** `TheologyData`, `QuestData`, `DebateProgress`.
- **Steuerung:** Input-Map-Actions in `project.godot` (`move_forward/back/left/right`, `jump`, `interact`, `pause`, `look_*`, `camera_zoom_*`) — WASD ist nicht mehr hardcodiert.
- **Theologie-SSOT:** `game/resources/theology/theology_questions.json` + `debate_stances.json`, abgesichert durch CI-Gate `game/tools/check_theology_ssot.mjs` (npm-Script, eingebunden in `godot-validate.yml`).
- **Tests/CI:** 7 Headless-Tests unter `game/tests/`; `.github/workflows/godot-validate.yml` (Import-Check + Tests, fail on ERROR-Zeilen) + `typecheck.yml`.

## Asset-Status (verifiziert)

Staging `godot_assets/` (Roh-Packs, nicht committet): KayKit Medieval Hexagon 926 · Quaternius Medieval Village MegaKit 528 · Kenney Castle Kit 228 · Kenney Audio 234 · LowPoly RPG Characters 35 · Quaternius Knight 27 · OGA Sword 20 · poly.pizza 9 · OGA Musik 4 · `oga_monk_cc0.blend` 1.

Davon kuratiert nach `game/assets/` übernommen: **63 Katalog-Einträge** (`game/resources/asset_catalog/asset_catalog.json`): Kenney Castle Kit 15 · Quaternius MegaKit 6 · KayKit 10 · Knight 2 · RPG Characters 4 · OGA Monk 1 (als `monk.glb` exportiert, Player-Visual) · poly.pizza 7 · Kenney Impact/RPG/UI Audio je 4 · StarNinjas Sword 4 · OGA Music 2.

Alle auditiert (`docs/assets/asset-decision-register.csv`, 24 Einträge, alle `APPROVED`/`APPROVED_WITH_ATTRIBUTION`; 6 CC-BY-attributionspflichtig → `ATTRIBUTIONS.md`). Verbaut in: `wittenberg_intro` (Gebäude/Props/NPCs/Musik), `Player` (Mönch), `bootstrap` (Kenney-Wall), `asset_gallery` + `asset_integration_test_world` (laden ganzen Katalog).

Bewusst nicht committet: `BossBattle_JuhaniJunkala_cc0.wav` (20 MB) und `oga_monk_cc0.blend` (Quelle). Die restliche Staging-Masse bleibt bewusst draußen (Repo-Größe/CI-Importzeit) und wird bei Levelausbau (M3+) selektiv nachgezogen.

## Wie weitermachen (Befehle)

```bash
git checkout main && git pull --ff-only
GODOT=.godot-editor/Godot.app/Contents/MacOS/Godot

# Import + alle Headless-Tests
"$GODOT" --headless --path game --import --quit-after 2000
for t in game/tests/*.gd; do
  "$GODOT" --headless --path game --script "res://tests/$(basename "$t")"
done

# License-Gate + Theologie-SSOT-Gate
node game/tools/check_asset_licenses.mjs
node game/tools/check_theology_ssot.mjs

# Editor (GUI): Szenen ansehen
"$GODOT" --path game
```

- Neue Assets: erst `docs/contributing/asset-license-checklist.md` durchgehen, dann via `stage_approved_assets.mjs` + `generate_asset_catalog.mjs` einpflegen (Gate erzwingt Katalogisierung).
- Rohpakete liegen lokal in `godot_assets/` (git-ignoriert) — nicht im Repo.

## Nächste sinnvolle Schritte (priorisiert)

1. **Issue #17 — Save/Load-System** (M3): Spielerposition + Quest-/Debattenfortschritt persistieren, Serialisierungsformat begründet wählen (siehe Issue-Text), UI-Anbindung, Versionsfeld.
2. **Issue #18 — Audio- und Accessibility-Grundausstattung** (M3): Musik/SFX-Busse mit Lautstärkereglern, Textgröße/Kontrast, nutzbares Remapping, Untertitel für Audio-Hinweise.
3. **Mönch-Feinschliff:** Ausrichtung/Scale des `Visual` in `Player.tscn` prüfen; optional die höherwertige `oga_monk_cc0.blend` neu nach GLB exportieren (Anleitung in `docs/assets/character-assets.md`).
4. **`godot_assets/`-Nachzug bei Levelausbau:** weitere Staging-Assets selektiv kuratieren, sobald neue Levelgebiete über `wittenberg_intro` hinaus entstehen.
5. **Issue #19 — Export-Builds** (M4): erst relevant, sobald M3 abgeschlossen ist.

## Offene Threads / bekannte Grenzen

- Zwei identische Kenney-`wall.glb` (`buildings/kenney_castle-kit/` aus PR #23 + `third_party/kenney/castle-kit/` aus #25) — beide CC0, beide katalogisiert; ggf. auf eine konsolidieren.
- Modell-Ausrichtung des Mönchs: default -Z-Forward, bei Bedarf rotieren (in `character-assets.md` vermerkt).
- CI-`ERROR:`-Heuristik ist bewusst streng; falls Linux mal gutartige ERROR-Zeilen wirft, in `godot-validate.yml` gezielt whitelisten.

## Zentrale Doku

- Audit: `docs/assets/asset-license-audit.md` · Register: `docs/assets/asset-decision-register.csv` · Attribution: `ATTRIBUTIONS.md`
- Integration/Abschluss: `docs/assets/asset-integration-report.md` · `docs/reports/asset-audit-and-integration-delivery.md`
- Checkliste: `docs/contributing/asset-license-checklist.md` · Charaktere: `docs/assets/character-assets.md`
- Roadmap: `docs/planning/roadmap.md` · Risk Register: `docs/planning/risk-register.md`
