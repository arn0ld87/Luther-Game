# GitHub-Import-Backlog — Ergebnis Stage B

Stand: 2026-06-30, durchgeführt auf `arn0ld87/Luther-Game` per `gh` CLI (lokal real verfügbar, siehe [Repository-Audit](../00-discovery/repository-audit.md) Abschnitt 5). Owner-Entscheidung zur realen Anlage (statt nur Dokumentation laut ursprünglichem Plan) wurde vor Ausführung eingeholt.

Alle Angaben unten sind per `gh label list` / `gh api .../milestones` / `gh issue list --json` real verifiziert, nicht nur behauptet.

## 1. Labels (14 neu angelegt)

Alle 14 Labels aus [`backlog.md`](backlog.md) Abschnitt 1 wurden via `gh label create` angelegt und per `gh label list` bestätigt: `type:feature`, `type:bug`, `type:docs`, `type:chore`, `area:godot`, `area:web`, `area:backend`, `area:content`, `priority:p0`, `priority:p1`, `priority:p2`, `priority:p3`, `status:blocked`, `status:ready`. Die 9 bestehenden Standard-Labels bleiben unverändert erhalten.

`priority:p0` und `area:backend` wurden angelegt, aber von keinem der 16 Issues benötigt (kein P0-Blocker, kein reines Backend-Issue im aktuellen Batch) — bleiben für künftige Issues verfügbar.

## 2. Milestones (5 neu angelegt)

| # | Titel |
|---|---|
| 1 | M0 — Projektgrundgerüst + CI |
| 2 | M1 — Spielercharakter + Kamera + Steuerung |
| 3 | M2 — Quest-/Dialog-/Debattensystem |
| 4 | M3 — Save/Load + Audio + Accessibility |
| 5 | M4 — Polish + Export-Builds + Release |

## 3. Issues (16 angelegt, alle Assignee `arn0ld87`)

Inhalte (Problem/Scope/Non-Goals/Akzeptanzkriterien/technische Hinweise/Abhängigkeiten/Risiko) wurden per `Workflow`-Subagenten strukturiert vorformuliert, mit den verifizierten Audit-/Roadmap-/Risk-Register-Fakten als Kontext, und 1:1 über `gh issue create` angelegt. Tabelle per `gh issue list --json number,title,labels,milestone,assignees` real ausgelesen:

| # | Titel | Labels | Milestone |
|---|---|---|---|
| [#4](https://github.com/arn0ld87/Luther-Game/issues/4) | TypeScript-Fehler im Web-Spiel beheben + `tsc --noEmit` in CI | `type:bug` `area:web` `priority:p1` `status:ready` | — |
| [#5](https://github.com/arn0ld87/Luther-Game/issues/5) | npm-Audit-Vulnerabilities triagieren | `type:chore` `area:web` `priority:p1` `status:ready` | — |
| [#6](https://github.com/arn0ld87/Luther-Game/issues/6) | Tech-Stack-Fehlbeschreibung in CLAUDE.md/metadata.json korrigieren | `type:docs` `area:web` `priority:p1` `status:ready` | M0 |
| [#7](https://github.com/arn0ld87/Luther-Game/issues/7) | Godot-4.x-Projektgrundgerüst unter /game anlegen | `type:chore` `area:godot` `priority:p1` `status:ready` | M0 |
| [#8](https://github.com/arn0ld87/Luther-Game/issues/8) | Minimal-3D-Bootstrap-Szene erstellen | `type:feature` `area:godot` `priority:p1` `status:blocked` | M0 |
| [#9](https://github.com/arn0ld87/Luther-Game/issues/9) | CI-Pipeline `godot-validate.yml` einrichten | `type:chore` `area:godot` `priority:p1` `status:blocked` | M0 |
| [#10](https://github.com/arn0ld87/Luther-Game/issues/10) | Asset-Lizenzprüfung für `godot_assets/` dokumentieren | `type:docs` `area:godot` `priority:p1` `status:ready` | M0 |
| [#11](https://github.com/arn0ld87/Luther-Game/issues/11) | Spielercharakter mit Bewegung und Kollision | `type:feature` `area:godot` `priority:p1` `status:blocked` | M1 |
| [#12](https://github.com/arn0ld87/Luther-Game/issues/12) | Third-Person-Kamera-Rig für die Spielfigur | `type:feature` `area:godot` `priority:p1` `status:blocked` | M1 |
| [#13](https://github.com/arn0ld87/Luther-Game/issues/13) | Konfigurierbares Input-Mapping für Spielersteuerung | `type:feature` `area:godot` `priority:p2` `status:blocked` | M1 |
| [#14](https://github.com/arn0ld87/Luther-Game/issues/14) | Dialog-/Quest-Datenmodell in Godot entwerfen | `type:feature` `area:godot` `priority:p2` `status:blocked` | M2 |
| [#15](https://github.com/arn0ld87/Luther-Game/issues/15) | Übernahme der theologischen Fragen ins Godot-Format | `type:feature` `area:content` `priority:p2` `status:blocked` | M2 |
| [#16](https://github.com/arn0ld87/Luther-Game/issues/16) | Debatten-UI als 3D-Pendant zu `DebateInterface` implementieren | `type:feature` `area:godot` `priority:p1` `status:blocked` | M2 |
| [#17](https://github.com/arn0ld87/Luther-Game/issues/17) | Save/Load-System für den Spielstand | `type:feature` `area:godot` `priority:p2` `status:blocked` | M3 |
| [#18](https://github.com/arn0ld87/Luther-Game/issues/18) | Audio- und Accessibility-Grundausstattung | `type:feature` `area:godot` `priority:p2` `status:blocked` | M3 |
| [#19](https://github.com/arn0ld87/Luther-Game/issues/19) | Export-Builds und Release-Prozess | `type:feature` `area:godot` `priority:p3` `status:blocked` | M4 |

Issues #4–#6 sind unabhängig vom Godot-Migrationspfad und sofort umsetzbar (`status:ready`). #7 und #10 sind die einzigen `status:ready`-Issues innerhalb M0 (Grundgerüst anlegen, Lizenzprüfung) — alle anderen M0-M4-Issues sind `status:blocked`, da sie auf das jeweils vorherige Issue/Milestone aufbauen (siehe Abhängigkeiten-Abschnitt im jeweiligen Issue).

## 4. Offen / nicht Teil dieser Stage

- Keine weiteren Labels/Milestones außer den oben genannten — `priority:p0` bleibt ungenutzt, bis ein echter Blocker auftritt.
- Die volle Issue-Beschreibung je Thema lebt ausschließlich im jeweiligen GitHub-Issue, nicht zusätzlich in diesem Dokument (Vermeidung von Doppelpflege/Drift).
- Stage C (Godot-Fundament, referenziert Issues #7 + #8) ist eigener, separater Branch/PR — nicht Teil dieser Stage-B-Mutation.

## 5. Status-Addendum (Stand 2026-07-01)

Issues #4–#16 sind geschlossen (M0, M1 und M2 vollständig abgeschlossen). Offen sind #17 (Save/Load, M3), #18 (Audio- und Accessibility-Grundausstattung, M3) und #19 (Export-Builds und Release-Prozess, M4).
