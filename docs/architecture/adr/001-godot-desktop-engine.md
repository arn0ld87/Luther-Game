# ADR 001: Godot 4.x als Desktop-Engine unter `/game`

- Status: Vorgeschlagen
- Datum: 2026-06-30
- Kontext-Dokument: [`docs/00-discovery/repository-audit.md`](../../00-discovery/repository-audit.md)

## Kontext

Der Auftrag verlangt ein echtes, spielbares 3D-Desktop-Spiel. Der reale Ist-Zustand des Repos ist jedoch ein 2D-React-Canvas-Spiel (siehe Audit, Abschnitt 1): keine Three.js/R3F-Dependency, `Game2DCanvas.tsx` + `engine/Player2D.ts`/`Enemy.ts`/`Combat.ts` als Laufzeit-Kern, Express-Backend für Gemini-Theologie-Validierung bleibt unverändert relevant. `CLAUDE.md`/`metadata.json` beschreiben fälschlich noch "3D (React Three Fiber/Three.js)".

Drei strukturelle Optionen für ein echtes 3D-Desktop-Spiel:

1. Im Web-Stack bleiben und React Three Fiber nachrüsten (3D-Web statt 3D-Desktop).
2. Eine dedizierte Game-Engine für Desktop-3D einsetzen, parallel zum bestehenden Web-Repo.
3. Beim 2D-Web-Spiel bleiben und den Auftrag (3D-Desktop) nicht erfüllen.

Zusätzlich bereits vorhanden: Der Nutzer hat `godot_assets/` (331 MB, Kenney Castle Kit + Quaternius Medieval Village MegaKit) lokal vorbereitet — ein klares Signal für Godot als Zielplattform, nicht nur eine offene Engine-Wahl.

## Entscheidung

**Godot 4.x** als separates Projekt unter `/game` im selben Repository, GDScript als primäre Skriptsprache, bestehendes React/Express-Repo bleibt unverändert als Web-Begleitprodukt (Theologie-Backend ggf. später per HTTP-Request aus Godot wiederverwendbar — keine Festlegung in dieser ADR).

## Alternativen

| Option | Bewertung |
|---|---|
| **React Three Fiber (3D-Web)** | Würde den Auftrag (Desktop-Spiel) nicht erfüllen; Web-Performance/Distribution für ein echtes Desktop-Erlebnis ungeeignet. Verworfen. |
| **Bevy (Rust)** | Technisch potent, aber kein visueller Editor, deutlich höhere Einstiegshürde für Content-/Level-Iteration, kein bestehendes Asset-Tooling für die vorhandenen Kenney/Quaternius-Kits ohne zusätzliche Pipeline. Verworfen für dieses Projekt. |
| **Unity** | Lizenz-/Account-Pflicht, proprietär, schwerer Editor-Download, für ein Bildungsprojekt mit Fokus auf offene Distribution unpassend. Verworfen. |
| **Unreal Engine** | Massiv überdimensioniert für ein 2D-artiges Reformations-Lernspiel im Voxel-/Lowpoly-Stil (passend zu Kenney/Quaternius-Assets), hohe Lernkurve, große Editor-Downloads. Verworfen. |
| **Beim 2D-Web-Spiel bleiben** | Erfüllt den expliziten Auftrag (3D-Desktop) nicht. Verworfen, aber als "Rollback"-Option unten gehalten. |
| **Godot 4.x** | Kostenlos, Open Source, nativer 3D- und Desktop-Export (macOS/Windows/Linux), visueller Editor für schnelle Level-Iteration, GDScript niedrige Einstiegshürde, große Community-Dokumentation, passt zu den bereits vorhandenen Lowpoly-Asset-Kits. **Gewählt.** |

## Konsequenzen

- Zwei parallele Codebasen im selben Repo: bestehendes Web-2D-Spiel (`/` Root, unverändert) und neues Godot-3D-Spiel (`/game`). Kein Code-Sharing auf Engine-Ebene; theologische Inhalte (`constants.ts` `QUESTIONS`) müssen für Godot in einem Godot-lesbaren Format (z. B. `.tres`/JSON) dupliziert oder per Build-Schritt aus `constants.ts` generiert werden — Entscheidung dazu ist Folgearbeit, nicht Teil dieser ADR.
- Neue CI-Pipeline nötig (`godot-validate.yml`), die Godot 4.x von GitHub Releases lädt — zusätzlicher CI-Wartungsaufwand.
- Mitwirkende brauchen künftig zwei Toolchains (Node/npm für das Web-Spiel, Godot-Editor für `/game`).
- `godot_assets/` muss vor Verwendung lizenzrechtlich geprüft (siehe Audit Abschnitt 4) und in eine Godot-Importstruktur überführt werden.
- Die in `CLAUDE.md`/`metadata.json` vorhandene Fehlbeschreibung ("3D React Three Fiber") muss spätestens mit dieser ADR korrigiert werden, um Verwirrung zwischen Web- und Godot-Teil zu vermeiden.

## Migrationsplan (Kurzform, Details in `docs/planning/roadmap.md`)

1. Stage A (diese PR): Audit, ADR, Produkt-/Architekturdoku, Backlog — keine Codeänderung.
2. Stage B: GitHub-Issue-Backlog für alle Folgearbeiten.
3. Stage C (eigener Branch/PR): `/game`-Projektgrundgerüst, Minimal-3D-Bootstrap-Szene, CI-Validierung — kein Vertical Slice.
4. Folge-Sessions (je eigene Branches/PRs, aus Stage-B-Issues): Controller, Kamera, Quest-/Dialog-/Debattensystem, Save/Load, Audio, Accessibility, Asset-Import aus `godot_assets/`, Export-Builds.

## Rollback

Falls sich Godot als ungeeignet erweist (z. B. GDScript-Performance-Probleme, Team-Präferenz für C#/Rust), kann `/game` isoliert entfernt werden, ohne den bestehenden Web-Teil zu beeinträchtigen — die beiden Codebasen sind durch die Verzeichnistrennung entkoppelt. Ein Rückfall auf "2D-Web-Spiel bleibt alleinige Plattform" ist jederzeit möglich, da `/game` additiv ist.
