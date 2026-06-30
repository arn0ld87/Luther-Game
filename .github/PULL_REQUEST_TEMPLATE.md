<!--
Vorlage gemäß PR-Beschreibungskonvention aus plan.md ("PR-Beschreibung mit Was/Warum/Test/Risiko").
Nicht benötigte Abschnitte bitte nicht löschen, sondern mit "Entfällt – Begründung" kennzeichnen.
-->

## Was

<!-- Kurze, sachliche Zusammenfassung der Änderung. Welche Dateien/Bereiche sind betroffen (web / godot / backend / docs)? -->

## Warum

<!-- Motivation/Kontext. Bezug auf Issue(s) mit "Closes #" / "Refs #", auf ADRs (docs/architecture/adr/) oder Backlog-Einträge, falls vorhanden. -->

## Test

<!--
Beleg, dass die Änderung funktioniert – konkrete Befehle/Ausgabe, kein "sollte funktionieren".
Je nach betroffenem Bereich relevant:
-->

- [ ] `npm run build` läuft fehlerfrei durch (Exit 0)
- [ ] `npx tsc --noEmit` geprüft (bekannte Altlast: 12 vorbestehende TS-Fehler in `ErrorBoundary.tsx`/`useCanvasDrawing.ts`, siehe `docs/00-discovery/repository-audit.md` Abschnitt 3 — neue Fehler durch diesen PR? ja/nein)
- [ ] `npm run dev` + `npm run server` parallel gestartet, Browser-Konsole auf Fehler geprüft
- [ ] Bei Änderungen unter `/game`: `godot --headless --import` (bzw. `--headless --quit`) fehlerfrei durchgelaufen, Konsolenausgabe unten eingefügt
- [ ] Manuelle Spielprüfung des betroffenen Flows durchgeführt (kurz beschreiben, was geprüft wurde)

```
<!-- ggf. relevante Konsolen-/Build-/Godot-Ausgabe hier einfügen -->
```

## Risiko

<!-- Was kann schiefgehen, was ist bewusst nicht abgedeckt, welche Folgearbeit bleibt offen? -->

- Auswirkung auf bestehendes 2D-Web-Spiel: <!-- z. B. "keine, nur /game betroffen" -->
- Auswirkung auf Godot-Projekt unter `/game`: <!-- z. B. "keine, nur Web-Teil betroffen" -->
- Rollback-Plan: <!-- z. B. Revert des Commits / PR -->

### Theologischer/historischer Content betroffen?

<!-- Nur ausfüllen, falls `constants.ts` QUESTIONS, Gemini-Prompts (server.ts/services/gemini.ts) oder Godot-Äquivalent geändert wurden. -->

- [ ] Diese PR ändert **keine** theologischen/historischen Inhalte – Abschnitt kann entfallen.
- [ ] Diese PR ändert theologische/historische Inhalte. Redaktionsprozess gemäß `docs/product/historical-and-theological-content-policy.md` eingehalten:
  - [ ] Quellenangabe (Primär- oder anerkannte Sekundärquelle) in dieser PR-Beschreibung dokumentiert
  - [ ] Review durch `theology-accuracy-reviewer` (siehe `AGENTS.md`) durchgeführt, Befund/Ergebnis verlinkt oder zitiert

## Checkliste

- [ ] Minimale, fokussierte Diffs (keine unangeforderten Refactors unbeteiligter Komponenten)
- [ ] `GameContext`-State nur per `dispatch`, keine direkten Mutationen
- [ ] Keine hartkodierten Farben/Scores/Speeds/Fragen außerhalb von `constants.ts`
- [ ] Keine `.env.local`/`GEMINI_API_KEY`-Werte committet oder geloggt
- [ ] Bei größeren Eingriffen (neue Subsysteme, Multi-File-Refactors): zusätzlicher Opus-Review-Pass über den Diff durchgeführt
