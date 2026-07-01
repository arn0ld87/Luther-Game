# Roadmap: Godot-3D-Desktop-Spiel (`/game`)

- Status: M0–M2 abgeschlossen, M3 aktueller Meilenstein
- Datum: 2026-06-30, aktualisiert 2026-07-01
- Bezug: [ADR 001 – Godot 4.x als Desktop-Engine](../architecture/adr/001-godot-desktop-engine.md), [Repository-Audit](../00-discovery/repository-audit.md)

## Zweck dieses Dokuments

Diese Roadmap konkretisiert den in ADR 001 skizzierten Migrationsplan (Stage C ff.) zu fünf Meilensteinen M0–M4. Sie ist die Detaillierung von "Stage C: `/game`-Projektgrundgerüst" und den darauf folgenden Folge-Sessions aus der ADR. Jeder Meilenstein wird in einem eigenen Branch/PR umgesetzt (kein Sammel-PR über mehrere Meilensteine).

**Stand 2026-07-01:** M0, M1 und M2 sind abgeschlossen. **M3** (Save/Load + Audio + Accessibility, Issues #17/#18) ist der aktuelle Meilenstein. M4 ist noch nicht begonnen.

Das bestehende Web-Spiel (React 19 + Express 5, 2D-Canvas, Root-Verzeichnis) ist von keinem der Meilenstein berührt — `/game` entsteht additiv und parallel dazu (siehe ADR 001, Konsequenzen).

Jeder Meilenstein gilt erst als abgeschlossen, wenn er die projektweite Definition of Done erfüllt: [`docs/planning/definition-of-done.md`](definition-of-done.md).

## Übersicht

| Meilenstein | Titel | Entspricht | Status |
|---|---|---|---|
| M0 | Projektgrundgerüst + CI | Stage C aus ADR 001 | ✅ abgeschlossen |
| M1 | Spielercharakter + Kamera + Steuerung | Folge-Session 1 | ✅ abgeschlossen (PR #36) |
| M2 | Quest-/Dialog-/Debattensystem | Folge-Session 2 | ✅ abgeschlossen (PRs #37, #38, #39; Issues #14, #15, #16) |
| M3 | Save/Load + Audio + Accessibility | Folge-Session 3 | in Arbeit (Issues #17, #18) |
| M4 | Polish + Export-Builds + Release | Folge-Session 4 | offen (Issue #19) |

Reihenfolge ist strikt sequenziell — jeder Meilenstein baut auf der lauffähigen Grundlage des vorherigen auf. Kein Meilenstein wird vorgezogen, solange der vorherige nicht die Definition of Done erfüllt.

---

## M0 — Projektgrundgerüst + CI (= Stage C)

**✅ Abgeschlossen.**

### Ziel

Ein neues, leeres, aber lauffähiges Godot-4.x-Projekt unter `/game` existiert im Repository, ist in CI eingebunden und validiert sich automatisch — ohne dass bereits Gameplay existiert.

### Umfang

- Godot-4.x-Projekt unter `/game` anlegen (Projektstruktur, `project.godot`, Verzeichniskonventionen für Szenen/Skripte/Assets)
- Minimal-3D-Bootstrap-Szene: leere 3D-Szene mit Kamera und Boden-Mesh, startet fehlerfrei im Editor und im Headless-Export
- `.gitignore`-Ergänzungen für Godot-spezifische Artefakte (`.godot/`, `.import/`, Export-Presets-Secrets)
- Neue CI-Pipeline `godot-validate.yml`: lädt Godot 4.x von GitHub Releases, importiert das Projekt headless, prüft auf Parse-/Import-Fehler
- Korrektur der Fehlbeschreibung "3D React Three Fiber" in `CLAUDE.md`/`metadata.json` (bereits in ADR 001 als Konsequenz benannt)
- Asset-Lizenzprüfung von `godot_assets/` (Kenney Castle Kit, Quaternius Medieval Village MegaKit) dokumentieren, bevor Assets ins Projekt importiert werden
- Kein Vertical Slice, kein Gameplay-Code

### Abhängigkeiten

- ADR 001 muss verabschiedet sein (Status aktuell: Vorgeschlagen → wird mit dieser PR-Serie faktisch bestätigt)
- Stage B (GitHub-Issue-Backlog) sollte für M1–M4 angelegt sein, ist aber kein hartes Blocker für M0 selbst
- Keine Abhängigkeit zum bestehenden Web-Spiel (additiv, kein Code-Sharing auf Engine-Ebene)

### Definition of Done

Siehe [`docs/planning/definition-of-done.md`](definition-of-done.md). Zusätzlich M0-spezifisch:

- `/game` öffnet ohne Fehler im Godot-4.x-Editor
- `godot-validate.yml` läuft grün auf dem PR
- README/Docs verweisen korrekt auf zwei getrennte Toolchains (Node/npm für Web, Godot-Editor für `/game`)
- Keine Gameplay-Logik enthalten (Scope-Treue zu Stage C)

---

## M1 — Spielercharakter + Kamera + Steuerung

**✅ Abgeschlossen (PR #36).**

### Ziel

Eine steuerbare Spielfigur bewegt sich in der 3D-Welt; Kamera folgt nachvollziehbar; Basis-Input-Mapping ist definiert und konfigurierbar.

### Umfang

- Spielercharakter-Szene (CharacterBody3D oder vergleichbar) mit Bewegung, Kollision, einfacher Gravitation
- Kamera-Rig (z. B. Third-Person-Follow-Kamera, passend zum Lowpoly-Wittenberg-/Dorf-Setting aus `godot_assets/`)
- Input-Mapping-Konfiguration (Tastatur/Maus, optional Gamepad) über Godots Input-Map, keine Hardcoded-Keycodes im Skript
- Erste Verwendung von Assets aus `godot_assets/` (Boden/Gebäude-Platzhalter) zur Maßstabs- und Kollisionsprüfung
- Keine Quest-/Debattenlogik, kein Save/Load

### Abhängigkeiten

- M0 muss abgeschlossen sein (lauffähiges Projektgrundgerüst + CI)
- Asset-Lizenzprüfung aus M0 muss vorliegen, bevor `godot_assets/`-Inhalte importiert werden

### Definition of Done

Siehe [`docs/planning/definition-of-done.md`](definition-of-done.md). Zusätzlich M1-spezifisch:

- Spielfigur lässt sich kollisionsfrei durch eine Testszene steuern
- Kamera bleibt bei Bewegung/Kollision stabil (kein Clipping durch Geometrie ohne Behandlung)
- Input-Mapping ist über Projekteinstellungen änderbar, nicht im Code verdrahtet

---

## M2 — Quest-/Dialog-/Debattensystem (3D-Pendant zum Web-`DebateInterface`)

**✅ Abgeschlossen (PRs #37, #38, #39; Issues #14, #15, #16).**

### Ziel

Ein generisches Dialog-/Quest-System, dessen Debattenmodus die theologische Kernmechanik des bestehenden Web-Spiels (`DebateInterface`, `QUESTIONS` aus `constants.ts`) als 3D-Pendant abbildet — inklusive Übernahme oder Migration des aktuell schmalen Content-Stands (3 Fragen: Werkgerechtigkeit/Mt 7,21, Papst-Primat/Mt 16,18, freier Wille/Röm 3,23).

### Umfang

- Dialog-/Quest-Datenmodell in Godot (z. B. `.tres`-Ressourcen oder JSON), entkoppelt von `constants.ts` im Web-Repo
- Klären und umsetzen, wie die theologischen Inhalte aus `constants.ts` `QUESTIONS` in das Godot-Format überführt werden (manuelle Duplikation vs. Build-Schritt-Generator) — diese Entscheidung ist laut ADR 001 ausdrücklich Folgearbeit und in M2 zu treffen
- Debatten-UI (3D-Welt-Overlay oder eigener UI-Layer) als Pendant zum Web-`DebateInterface`
- Bewertungslogik für Antworten (richtig/falsch/Begründungstiefe), ohne zwingend den Gemini-Backend-Validierungspfad des Web-Spiels wiederzuverwenden (laut ADR 001 nicht in dieser ADR festgelegt, hier zu entscheiden)
- Erste 1–3 begehbare Quest-Stationen, die die Debattenmechanik im 3D-Raum auslösen
- Theologische Content-Erweiterung über die bestehenden 3 Fragen hinaus ist NICHT Teil von M2 (Content-Breite ist eigenes Backlog-Thema, kein Engine-Meilenstein)

### Abhängigkeiten

- M1 muss abgeschlossen sein (Spielfigur + Kamera, um Quest-Stationen im Raum zu erreichen)
- Entscheidung aus Stage B-Backlog, ob das Express-Theologie-Backend per HTTP aus Godot wiederverwendet wird oder eine eigenständige Godot-Validierungslogik entsteht

### Definition of Done

Siehe [`docs/planning/definition-of-done.md`](definition-of-done.md). Zusätzlich M2-spezifisch:

- Mindestens die 3 bestehenden theologischen Fragen sind im Godot-Format spielbar
- Debattenausgang (richtig/falsch) ist nachvollziehbar und führt zu sichtbarem Spielfortschritt
- Datenquelle für Fragen ist dokumentiert (Duplikat vs. generiert) und nicht hart im Skriptcode verdrahtet

---

## M3 — Save/Load + Audio + Accessibility

**Aktueller Meilenstein (Issue #17 Save/Load, Issue #18 Audio/Accessibility).**

### Ziel

Spielstand ist persistent speicher- und ladbar, das Spiel hat eine Basis-Audiokulisse, und grundlegende Accessibility-Anforderungen sind erfüllt.

### Umfang

- Save/Load-System (Spielerposition, Quest-/Debattenfortschritt, Zeitstempel), Godot-eigenes Serialisierungsformat
- Audio: Hintergrundmusik, Basis-SFX (Schritte, UI-Feedback, Debattenausgang), Lautstärkeregler getrennt nach Musik/SFX
- Accessibility-Grundausstattung: Textgrößen-/Kontrastoptionen für Dialog-/Debatten-UI, Remappable Controls (Fortsetzung aus M1), Untertitel/Text für alle Audio-Hinweise mit Informationsgehalt
- Kein neuer Gameplay-Content, kein neues Levelgebiet

### Abhängigkeiten

- M2 muss abgeschlossen sein (es muss Fortschritt/Zustand geben, der gespeichert werden kann)

### Definition of Done

Siehe [`docs/planning/definition-of-done.md`](definition-of-done.md). Zusätzlich M3-spezifisch:

- Spielstand übersteht einen vollständigen Neustart der Anwendung (Speichern → Beenden → Starten → Laden funktioniert)
- Lautstärkeregler wirken sofort und werden persistiert
- Mindestens eine Accessibility-Option (z. B. Textgröße oder Remapping) ist nachweisbar nutzbar, nicht nur als UI-Attrappe vorhanden

---

## M4 — Polish + Export-Builds + Release

**Nicht Teil der aktuellen Sitzung — Planungsgegenstand für eine künftige Session.**

### Ziel

Das Spiel ist für macOS/Windows/Linux exportierbar, optisch/akustisch poliert und in einer ersten Release-Form veröffentlichbar.

### Umfang

- Export-Presets für macOS, Windows, Linux (Desktop-Ziel gemäß ADR 001 — kein Web-/Mobile-Export in diesem Meilenstein)
- Polish-Pass: Beleuchtung, Materialfeinschliff der Kenney/Quaternius-Assets, UI-Politur, Performance-Optimierung (Frametime-Budget definieren und einhalten)
- Versionierung/Release-Notes-Prozess für `/game`, getrennt vom Web-Spiel-Versionsstand
- Vollständiger End-to-End-Durchlauf: Menü → Bewegung → mindestens eine Debatte → Speichern/Laden → Beenden, ohne Crash
- Lizenz-/Attributionsnachweis für `godot_assets/` (Kenney/Quaternius) im Release-Build sichtbar dokumentiert (Fortsetzung der M0-Prüfung)

### Abhängigkeiten

- M3 muss abgeschlossen sein (Save/Load, Audio, Accessibility als Release-Voraussetzung)
- CI-Pipeline aus M0 muss Export-Builds mit abdecken oder um einen Export-Job erweitert werden

### Definition of Done

Siehe [`docs/planning/definition-of-done.md`](definition-of-done.md). Zusätzlich M4-spezifisch:

- Export-Builds für alle drei Zielplattformen werden erzeugt und starten fehlerfrei
- End-to-End-Durchlauf ist manuell verifiziert und protokolliert
- Lizenzhinweise für verwendete Asset-Kits sind im Build enthalten

---

## Nicht-Ziele dieser Roadmap

- Keine Aussage zu mobilen Plattformen oder Web-Export von Godot — ADR 001 legt explizit Desktop fest
- Keine Festlegung, ob/wie das bestehende Express-Theologie-Backend von Godot aus wiederverwendet wird — das bleibt Entscheidung innerhalb von M2
- Keine Erweiterung des theologischen Content-Umfangs (z. B. Ablässe, 95 Thesen) — das ist ein eigenständiges Content-Backlog-Thema, unabhängig vom Engine-Fortschritt
- Keine Änderung am bestehenden Web-Spiel (Root-Verzeichnis) in irgendeinem Meilenstein
