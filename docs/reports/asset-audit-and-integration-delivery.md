# Abschlussbericht — Asset-Lizenzprüfung, Freigabe & Godot-Integration

> Stand: 2026-07-01 · Godot 4.7-stable · Repo: arn0ld87/Luther-Game

## 1. Übersicht aller geprüften Assets

Geprüft wurde der vollständige Bestand von `godot_assets/` (git-ignoriert, 3198 Dateien, ~526 MB inkl. Roh-ZIPs): Kenney Castle Kit, Quaternius Medieval Village MegaKit (Standard-FREE) + LowPoly RPG Characters + Knight, KayKit Medieval Hexagon Pack, poly.pizza-Modelle (Church, Temple, gothic-set), OpenGameArt-Charaktere (Monk) sowie Kenney-Audio (Impact/RPG/UI), StarNinjas-Sword-Sounds und OpenGameArt-Musik (Town/Battle/Boss/ChurchBell). 7 lokale `License.txt` wurden wörtlich gelesen; alle Packs ohne lokale Lizenz wurden über die offizielle Ursprungsseite (OpenGameArt/poly.pizza, Abruf 2026-07-01) verifiziert. Security-Scan: **keine** Skripte/Executables/Symlinks.

Belege: [`docs/assets/asset-license-audit.md`](../assets/asset-license-audit.md), Register [`docs/assets/asset-decision-register.csv`](../assets/asset-decision-register.csv), Inventur [`docs/assets/asset-inventory.md`](../assets/asset-inventory.md), Worklog [`docs/assets/asset-audit-worklog.md`](../assets/asset-audit-worklog.md).

## 2. Freigabeübersicht (Zahlen)

| Entscheidung | Anzahl |
|---|---|
| `APPROVED` (CC0 / Public Domain) | 14 |
| `APPROVED_WITH_ATTRIBUTION` (CC-BY 3.0) | 6 |
| `QUARANTINED` | 0 |
| `EXCLUDED` | 4 |
| **Registereinträge gesamt** | **24** |

## 3. Quarantäne / Ausschluss (mit Begründung)

- **QUARANTINED** — keine Einträge mehr (die früheren Church-Varianten wurden nach Kandidatenprüfung auf EXCLUDED gesetzt).
- **EXCLUDED** — `polypizza_gothic-set/Church.glb`, `Church (1).glb`: Kandidatenquellen (Abruf 2026-07-01: `6vzTphxL9w4` CC-BY / `8jSIJfw17cz` CC-BY / Poly by Google, `GHzPfvoyzX` CC0 / CreativeTrio) stammen von **zwei verschiedenen Autoren/Lizenzen** ohne eindeutige Datei-zu-Quelle-Zuordnung → bei CC-BY zwingende korrekte Attribution nicht garantierbar; zudem redundant zur freigegebenen `polypizza_church_poly-by-google.glb` → **ausgeschlossen**. `oga_music/ChurchBell_ccbysa.mp3`: verifiziert **CC-BY-SA 3.0** (Share-Alike), für ein veröffentlichbares Spiel rechtlich unpassend. **Sketchfab-Monk (Inuciian, CC-BY 4.0):** nicht im Bestand vorhanden.

## 4. Lizenz- und Attributionsstrategie

Nur `APPROVED`/`APPROVED_WITH_ATTRIBUTION` werden verwendet. Verpflichtende CC-BY-Attribution (6 poly.pizza-Modelle) steht in der versionierten Root-[`/ATTRIBUTIONS.md`](../../ATTRIBUTIONS.md); der Asset-Katalog markiert diese mit `attribution_required`/`attribution_text`. CC0-Lizenztexte liegen verbatim (unverändert) unter `game/assets/licenses/`. Freiwillige CC0-Credits sind in `/ATTRIBUTIONS.md` als freiwillig gekennzeichnet.

## 5. Integrierte Godot-Verzeichnisse und Szenen

- `game/assets/third_party/{kenney,quaternius,kaykit,polypizza,opengameart}/` + `game/assets/audio/{music,sfx/…}/` (je `SOURCE.md`), `game/assets/licenses/`.
- `game/resources/asset_catalog/asset_catalog.json` — 62 Einträge (44 Modelle + 18 Audio).
- `game/scenes/dev/asset_gallery.tscn` (+ `scripts/dev/asset_gallery.gd`) — Dev-Galerie mit Lizenz-Labels + Fehlerreport.
- `game/scenes/world/asset_integration_test_world.tscn` (+ Script) — Mittelalter-/Wittenberg-Blockout mit Gebäude-, Prop-, Kollisions- und Audiogruppe.
- Tools: `game/tools/stage_approved_assets.mjs`, `game/tools/generate_asset_catalog.mjs`. Test: `game/tests/asset_integration_test.gd`.

## 6. Nachweis der Godot-Import-/Boot-Prüfung

Lokal (Godot 4.7-stable, macOS):

- `--headless --path game --import` → exit 0, **0 `ERROR:`-Zeilen** (nach Ergänzung der geteilten Kenney-`colormap.png`).
- `--script res://tests/asset_integration_test.gd` → **ALL TESTS PASSED**: Katalog 44 Modelle + 18 Audio geladen; Galerie 44 platziert / 0 fehlend; Testwelt Gebäude=8, Props=6, Kollisionskörper=2, Audio=2.
- Bestandstests `player_movement_test.gd` und `camera_rig_test.gd` → ALL TESTS PASSED (keine Regression).
- Boot `--path game --quit` → exit 0, 0 Fehler.

## 7. GitHub-PR-/Issue-Links

- Issue #10 (Lizenz-Audit) — **CLOSED** via PR **#24** („docs: audit and approve third-party Godot assets", gemergt).
- Issue #25 (Integration) — offen, adressiert durch PR **#26** („feat: integrate audited third-party assets into Godot", `Closes #25`).

## 8. Bekannte Risiken

- poly.pizza-/OGA-Lizenzen sind Momentaufnahmen (Abrufdatum dokumentiert); CC-BY 3.0 der Google-Modelle ist stabil.
- Kuratierte Teilmenge je Pack (Größenkontrolle) — vollständige Packs nur via lokalem `godot_assets/` + Staging-Skript.
- CI-`ERROR:`-Heuristik könnte theoretisch auf plattformspezifische, gutartige Meldungen (Linux) reagieren; lokal auf macOS 0 Fehler.
- Kenney-GLBs referenzieren eine externe geteilte Textur — beim Nachziehen weiterer Kenney-Modelle muss `colormap.png` mitgeführt werden (das Staging-Skript tut das).

## 9. Nächste drei sinnvolle Issues

1. ~~**QUARANTINE auflösen**~~ — **erledigt** (Issue #27): Church-Varianten nach Kandidatenprüfung (zwei Autoren/Lizenzen, keine eindeutige Zuordnung, redundant zur freigegebenen Church) auf `EXCLUDED` gesetzt. Ein CC-BY-Kirchen-Asset für Wittenberg steht mit `polypizza_church_poly-by-google.glb` bereits freigegeben zur Verfügung.
2. **Mönch-/Luther-Charakter-Pipeline:** `oga_monk_cc0.blend` (CC0) nach GLB exportieren bzw. Blender-Import in Build/CI dokumentieren — oder bewusst den `Monk.obj`/einen RPG-Charakter als Luther-Platzhalter festlegen.
3. **Wiederverwendbare Lizenz-Checkliste + optionales CI-License-Gate** (Risk Register #7): Standardprozess für künftige Asset-Packs, damit neue Assets nicht ungeprüft nach `/game` gelangen.

---

### Faktenbasierte Kurzzusammenfassung

- **Issue #10:** geschlossen (via PR #24) — Audit vollständig, jedes Asset entschieden, Attributionen dokumentiert.
- **APPROVED:** 14 · **APPROVED_WITH_ATTRIBUTION:** 6 · **QUARANTINED:** 0 · **EXCLUDED:** 4.
- **Asset-Gallery:** vorhanden (`game/scenes/dev/asset_gallery.tscn`).
- **Testwelt:** vorhanden (`game/scenes/world/asset_integration_test_world.tscn`).
- **Headless-Import:** exit 0, 0 ERROR; Integrationstest ALL TESTS PASSED.
- **GitHub-Action:** `godot-validate.yml` gehärtet (SHA512 + ERROR-Erkennung + Asset-Test); Ergebnis auf PR #26 abzuwarten.
- **Nächste drei Issues:** siehe Abschnitt 9.
