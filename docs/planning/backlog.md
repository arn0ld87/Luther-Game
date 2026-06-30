# Backlog: Label-Taxonomie, Milestones, Issue-Vorschau

- Stand: 2026-06-30, Branch `chore/game-foundation-planning`
- Bezug: [Repository-Audit](../00-discovery/repository-audit.md), [ADR 001 – Godot 4.x als Desktop-Engine](../architecture/adr/001-godot-desktop-engine.md), [Roadmap M0–M4](roadmap.md), [Risk Register](risk-register.md)

## Zweck dieses Dokuments

Dieses Dokument bereitet Stage B (GitHub-Issue-Backlog) vor, legt sie aber nicht fest:

1. Eine vorgeschlagene Label-Taxonomie (Dokumentation, keine angelegten Labels).
2. Die fünf Meilensteine M0–M4 mit Kurzbeschreibung und Verweis auf die Roadmap.
3. Eine Vorschau auf 16 grob geplante Issue-Themen — nur Titel + ein Satz, keine vollständige Issue-Beschreibung (Problem/Scope/Akzeptanzkriterien/Risiko folgen erst in Stage B per eigenem Workflow-Lauf).

**Wichtig:** Das tatsächliche Anlegen von Labels und Milestones auf `arn0ld87/Luther-Game` ist **keine** automatisierte Aktion dieser Sitzung. `gh` ist in dieser lokalen Umgebung zwar real installiert und authentifiziert (siehe Audit Abschnitt 5), aber das Repository hat einen echten Kollaborator (`arn0ld87`) — neue Labels/Milestones sichtbar anzulegen ist eine bewusste Owner-Entscheidung, kein impliziter Nebeneffekt einer Planungs-PR. Dieses Dokument ist die Entscheidungsgrundlage dafür, nicht die Ausführung.

---

## 1. Vorgeschlagene Label-Taxonomie

14 Labels in vier Gruppen: `type:*` (Art der Arbeit), `area:*` (betroffener Teil des Repos), `priority:*` (Dringlichkeit), `status:*` (Bearbeitungszustand). Farben sind als Hex-Codes für `gh label create --color` angegeben.

### type:* — Art der Arbeit

| Name | Farbe | Beschreibung |
|---|---|---|
| `type:feature` | `#0E8A16` (grün) | Neue Funktionalität oder neuer Inhalt, der vorher nicht existierte |
| `type:bug` | `#D73A4A` (rot) | Fehlerhaftes Verhalten, das korrigiert werden muss |
| `type:docs` | `#0075CA` (blau) | Reine Dokumentationsänderung, kein Code betroffen |
| `type:chore` | `#BFD4F2` (hellblau) | Wartung, Tooling, CI, Refactor ohne Verhaltensänderung |

### area:* — Betroffener Teil des Repos

| Name | Farbe | Beschreibung |
|---|---|---|
| `area:godot` | `#5319E7` (violett) | Betrifft das neue Godot-3D-Desktop-Spiel unter `/game` |
| `area:web` | `#1D76DB` (cyan-blau) | Betrifft das bestehende React/Vite-Web-Spiel im Root-Verzeichnis |
| `area:backend` | `#D93F0B` (orange) | Betrifft das Express-Backend (`server.ts`, Gemini-Routen) |
| `area:content` | `#FEF2C0` (gelb) | Betrifft theologische Inhalte, Texte, Frageninhalte (`QUESTIONS` o. Godot-Pendant) |

### priority:* — Dringlichkeit

| Name | Farbe | Beschreibung |
|---|---|---|
| `priority:p0` | `#B60205` (dunkelrot) | Blockiert laufende Arbeit, sofort zu klären |
| `priority:p1` | `#D93F0B` (orange-rot) | Hoch, relevant für den aktuell anstehenden Meilenstein |
| `priority:p2` | `#FBCA04` (gelb) | Mittel, eingeplant, aber nicht zeitkritisch |
| `priority:p3` | `#C2E0C6` (hellgrün) | Niedrig, Backlog-Kandidat ohne festen Termin |

### status:* — Bearbeitungszustand

| Name | Farbe | Beschreibung |
|---|---|---|
| `status:blocked` | `#E99695` (helles Rot) | Wartet auf eine Entscheidung oder Abhängigkeit (z. B. Owner-Entscheidung, Vorgänger-Meilenstein) |
| `status:ready` | `#006B75` (petrol) | Keine offenen Abhängigkeiten, kann direkt begonnen werden |

Diese 14 Labels ergänzen die bestehenden 9 Standard-Labels des Repos (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`); sie ersetzen sie nicht. Solange die Taxonomie nicht angelegt ist, verwendet Stage B beim Erstellen der Issues ausschließlich die bereits vorhandenen Standard-Labels.

---

## 2. Milestones M0–M4

Vollständige Ziele, Umfang, Abhängigkeiten und Definition of Done je Meilenstein stehen in [`roadmap.md`](roadmap.md). Hier nur die Kurzübersicht.

| Milestone | Name | Kurzbeschreibung | Verweis |
|---|---|---|---|
| M0 | Projektgrundgerüst + CI | Godot-4.x-Projekt unter `/game` anlegen, Minimal-3D-Bootstrap-Szene, CI-Validierung (`godot-validate.yml`), Doku-Korrektur, Asset-Lizenzprüfung. Entspricht Stage C aus ADR 001. | [roadmap.md](roadmap.md), Abschnitt „M0 — Projektgrundgerüst + CI (= Stage C)" |
| M1 | Spielercharakter + Kamera + Steuerung | Steuerbare Spielfigur (`CharacterBody3D`), Kamera-Rig, konfigurierbares Input-Mapping. | [roadmap.md](roadmap.md), Abschnitt „M1 — Spielercharakter + Kamera + Steuerung" |
| M2 | Quest-/Dialog-/Debattensystem | 3D-Pendant zum Web-`DebateInterface`, Übernahme der 3 bestehenden theologischen Fragen in ein Godot-lesbares Format, erste begehbare Quest-Stationen. | [roadmap.md](roadmap.md), Abschnitt „M2 — Quest-/Dialog-/Debattensystem" |
| M3 | Save/Load + Audio + Accessibility | Persistenter Spielstand, Musik/SFX mit Lautstärkeregler, Accessibility-Grundausstattung (Textgröße, Remapping, Untertitel). | [roadmap.md](roadmap.md), Abschnitt „M3 — Save/Load + Audio + Accessibility" |
| M4 | Polish + Export-Builds + Release | Export-Presets für macOS/Windows/Linux, Polish-Pass, vollständiger End-to-End-Durchlauf, Lizenz-/Attributionsnachweis für `godot_assets/`. | [roadmap.md](roadmap.md), Abschnitt „M4 — Polish + Export-Builds + Release" |

Reihenfolge ist strikt sequenziell (siehe Roadmap); kein Milestone wird vorgezogen, solange der vorherige nicht die projektweite Definition of Done erfüllt.

---

## 3. Vorschau: 16 geplante Issue-Themen (Stage B)

Grobe Vorschau, keine vollständigen Issue-Beschreibungen. Jedes Thema erhält in Stage B per separatem Workflow-Lauf eine vollständige Struktur (Problem/Scope/Non-Goals/Akzeptanzkriterien/technische Hinweise/Abhängigkeiten/Risiko) und wird einzeln über `issue_write`/`gh issue create` angelegt.

| # | Titel | Ein Satz |
|---|---|---|
| 1 | TypeScript-Fehler im Web-Spiel beheben + `tsc --noEmit` in CI | Die 12 von `vite build` unerkannten TS-Fehler in `ErrorBoundary.tsx` und `useCanvasDrawing.ts` beheben und einen eigenen Typprüf-Schritt in der CI ergänzen. |
| 2 | npm-Audit-Vulnerabilities triagieren | Die 12 gemeldeten Schwachstellen (2 kritisch, 6 hoch) einzeln bewerten und gezielt beheben statt pauschal `npm audit fix --force` auszuführen. |
| 3 | Tech-Stack-Fehlbeschreibung in `CLAUDE.md`/`metadata.json` korrigieren | Die Behauptung eines 3D-React-Three-Fiber-Spiels durch eine Beschreibung des realen 2D-Canvas-Stands ersetzen. |
| 4 | Godot-4.x-Projektgrundgerüst unter `/game` anlegen | Projektstruktur, `project.godot` und Verzeichniskonventionen für Szenen/Skripte/Assets aufsetzen (M0). |
| 5 | Minimal-3D-Bootstrap-Szene erstellen | Leere 3D-Szene mit Kamera und Boden-Mesh, die im Editor und im Headless-Export fehlerfrei startet (M0). |
| 6 | CI-Pipeline `godot-validate.yml` einrichten | Godot 4.x headless laden, das Projekt importieren und auf Parse-/Import-Fehler prüfen, inkl. Binary-Caching (M0). |
| 7 | Asset-Lizenzprüfung für `godot_assets/` dokumentieren | `License.txt` von Kenney Castle Kit und Quaternius Medieval Village MegaKit wörtlich prüfen und das Ergebnis vor jeder Verwendung dokumentieren (M0). |
| 8 | Spielercharakter mit Bewegung und Kollision | `CharacterBody3D` mit Bewegung, Kollision und einfacher Gravitation implementieren (M1). |
| 9 | Third-Person-Kamera-Rig | Kamera-Rig bauen, das der Spielfigur stabil folgt und an der Lowpoly-Dorf-/Burg-Szenerie nicht clippt (M1). |
| 10 | Konfigurierbares Input-Mapping | Tastatur-/Maus- (optional Gamepad-)Steuerung über Godots Input-Map definieren statt Keycodes im Skript zu verdrahten (M1). |
| 11 | Dialog-/Quest-Datenmodell in Godot | Generisches Datenmodell (z. B. `.tres`/JSON) für Quest- und Dialogstationen entwerfen, entkoppelt von `constants.ts` (M2). |
| 12 | Übernahme der theologischen Fragen ins Godot-Format | Entscheiden und umsetzen, wie die 3 bestehenden `QUESTIONS`-Einträge nach Godot kommen (manuelle Duplikation vs. Generator-Skript) (M2). |
| 13 | Debatten-UI als 3D-Pendant zu `DebateInterface` | UI samt Bewertungslogik (richtig/falsch) für die Debattenmechanik im 3D-Raum bauen (M2). |
| 14 | Save/Load-System für den Spielstand | Spielerposition sowie Quest-/Debattenfortschritt persistent speichern und nach Neustart korrekt laden (M3). |
| 15 | Audio- und Accessibility-Grundausstattung | Musik/SFX mit getrennten Lautstärkereglern sowie Textgrößen-, Remapping- und Untertitel-Optionen ergänzen (M3). |
| 16 | Export-Builds und Release-Prozess | Export-Presets für macOS/Windows/Linux einrichten, End-to-End-Durchlauf verifizieren und Lizenz-/Attributionsnachweise in den Build aufnehmen (M4). |

Diese Auswahl ist nicht erschöpfend (weitere Kandidaten aus dem [Risk Register](risk-register.md) — z. B. ein GDScript-Onboarding-Dokument oder eine Lizenz-Checkliste für künftige Asset-Packs — können in Stage B als zusätzliche Issues ergänzt werden); sie deckt aber die in der Roadmap (M0–M4) und im Risk Register bereits explizit als „Stage-B-Issue" markierten Punkte ab.
