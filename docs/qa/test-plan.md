# Testplan — Sola Fide: The Luther Run

- Stand: 2026-06-30, Branch `chore/game-foundation-planning`
- Bezug: [`docs/00-discovery/repository-audit.md`](../00-discovery/repository-audit.md), [`docs/architecture/adr/001-godot-desktop-engine.md`](../architecture/adr/001-godot-desktop-engine.md), [`docs/planning/roadmap.md`](../planning/roadmap.md), [`docs/planning/risk-register.md`](../planning/risk-register.md), [`AGENTS.md`](../../AGENTS.md)

## Zweck und Geltungsbereich

Dieser Testplan deckt zwei parallele, durch Verzeichnistrennung entkoppelte Codebasen ab (siehe ADR 001):

1. **Web-Teil** (Root-Verzeichnis): bestehendes 2D-Canvas-Spiel, React 19 + Express 5. Bleibt laut ADR 001 in allen Godot-Meilensteinen unverändert.
2. **Godot-Teil** (`/game`): neu entstehendes Godot-4.x-3D-Desktop-Spiel, ab M0 (Stage C) aufgebaut.

Es existiert in keinem der beiden Teile ein automatisiertes Test-Setup. `CLAUDE.md` hält das für den Web-Teil explizit fest ("No test suite configured — verification is build + manual run"). Dieser Plan beschreibt deshalb überwiegend manuelle Verifikationsschritte und benennt automatisierte Ergänzungen als Backlog-Items.

## 1. Teststrategie Web-Teil

### 1.1 Status quo

Kein Test-Framework (kein Jest/Vitest/Playwright) in `package.json` vorhanden. Verifikation laut `CLAUDE.md` und Audit (Abschnitt 3):

- `npm run build` (`vite build`) — muss mit Exit-Code 0 durchlaufen
- Beide Dev-Server parallel starten (`npm run dev` auf Port 5173, `npm run server` auf Port 3000) und im Browser durchklicken
- Browser-Konsole auf Fehler/Warnungen prüfen

### 1.2 Lücke: `vite build` prüft Typen nicht vollständig

Der Audit hat real verifiziert, dass `vite build` (esbuild-basiert) **keine vollständige TypeScript-Typprüfung** durchführt. Mit `npx tsc --noEmit` wurden 12 echte Typfehler gefunden (9× `ErrorBoundary.tsx`, 3× `useCanvasDrawing.ts`), die `npm run build` nicht erkennt. Die Behauptung in `CLAUDE.md` ("must pass with zero TS errors") ist für den reinen Vite-Build erfüllt, aber irreführend bezogen auf echte Typsicherheit.

**Verbindliche Ergänzung für diesen Testplan:** `npx tsc --noEmit` ist ab sofort fester Bestandteil der Web-Verifikation, zusätzlich zu `npm run build`, nicht als Ersatz dafür.

### 1.3 Manueller Test-Workflow (Pflicht vor jedem Web-Commit/PR)

1. `npm install` (falls `node_modules` fehlt oder `package.json` sich geändert hat)
2. `npx tsc --noEmit` — muss ohne Fehler durchlaufen; bestehende 12 Fehler sind bekanntes Backlog-Item (Risk-Register #1), kein neuer PR darf weitere Typfehler hinzufügen
3. `npm run build` — muss mit Exit 0 durchlaufen, Bundle-Warnungen (z. B. der bekannte Dynamic/Static-Import-Konflikt bei `services/audio.ts`) dokumentieren, nicht stillschweigend ignorieren
4. `npm run dev` und `npm run server` parallel starten, Anwendung unter `http://localhost:5173` im Browser öffnen
5. Manueller Klickdurchlauf der betroffenen Flows (siehe 1.4), dabei Browser-Devtools-Konsole offen halten — keine unerwarteten Fehler/Warnungen
6. Bei Änderungen an `server.ts`-Routen: mindestens einen Request pro geänderter Route real auslösen (z. B. `/api/check-theology`) und Fallback-Pfad (Gemini-Fehler simulieren, z. B. durch ungültigen Key) verifizieren — jede Route muss laut `CLAUDE.md` try/catch + gültiges Fallback-Objekt liefern

### 1.4 Manuelle Flow-Checkliste (Web)

- MENU → PLAYING: Spielstart funktioniert, `GameState`-Übergang korrekt
- PLAYING → DEBATE: Trigger einer theologischen Frage aus `constants.ts` `QUESTIONS` löst Debatte aus
- DEBATE-Antwortpfad: richtige und falsche Antwort jeweils einmal testen, `dispatch`-Reaktion (Score, State-Übergang) prüfen — niemals direkte State-Mutation, siehe Hard Rule in `CLAUDE.md`
- MENU → ART_STUDIO / MAP: beide Nebenpfade erreichbar und verlassbar
- ErrorBoundary: bewusst einen Render-Fehler in einer Testkomponente provozieren, prüfen ob Fallback-UI greift statt weißem Bildschirm

### 1.5 Backlog (nicht Teil dieses Plans, nur dokumentiert)

- Einführung eines echten Test-Frameworks (Vitest für Unit, Playwright für E2E) ist nicht beauftragt und nicht Teil der aktuellen Sitzung — als mögliches künftiges Issue im GitHub-Backlog vermerken (Stage B), nicht hier vorwegnehmen.
- CI-Schritt `tsc --noEmit` ergänzen (Risk-Register #1), sobald eine CI-Pipeline für den Web-Teil existiert.

## 2. Teststrategie Godot-Teil (`/game`)

### 2.1 Status quo

`/game` existiert zum Zeitpunkt dieses Testplans noch nicht (M0/Stage C ist erst die nächste geplante Arbeit, siehe Roadmap). Diese Strategie gilt ab dem ersten Commit unter `/game`.

### 2.2 Minimalverifikation: Headless-Import

Mindestverifikation nach **jeder** Szenenänderung, jedem neuen Skript und jedem CI-Lauf:

```
godot --headless --import --path game/
```

- Prüft, dass das Projekt fehlerfrei parst und importiert (keine kaputten `.tscn`/`.gd`-Referenzen, keine fehlenden Ressourcen)
- Exit-Code 0 ist Pflichtkriterium, kein PR mit `/game`-Änderungen darf ohne diesen Lauf gemergt werden
- Entspricht der in ADR 001 vorgesehenen CI-Pipeline `godot-validate.yml` (lädt Godot 4.x von GitHub Releases, importiert headless, prüft auf Parse-/Import-Fehler) — lokal vor jedem Commit zusätzlich manuell ausführen, nicht nur in CI abwarten
- Godot-Version muss mit der zur Implementierungszeit in ADR 001/Roadmap festgelegten 4.x-Version übereinstimmen (Versionspinning, siehe Risk-Register #10)

### 2.3 Manuelle Editor-Verifikation

Zusätzlich zum Headless-Import, vor jedem PR mit Gameplay-relevanten Änderungen:

- Projekt im Godot-4.x-Editor öffnen, muss ohne Fehlermeldung laden
- Betroffene Szene(n) im Editor-Play-Modus (F6) starten, kein Crash, keine roten Fehlermeldungen in der Godot-Konsole
- Bei Kamera-/Bewegungs-Änderungen (ab M1): manueller Durchlauf der Testszene, Kollisionsverhalten und Kamera-Clipping visuell prüfen

### 2.4 Backlog: automatisierte Godot-Tests

Kein automatisiertes Unit-/Integrationstest-Framework für GDScript ist aktuell eingerichtet. Als Backlog-Item für eine spätere Stage (frühestens ab M1, wenn erste testbare Logik — Bewegung, Kollision — existiert):

- **GUT** (Godot Unit Test) oder **GdUnit4** als Test-Framework evaluieren und einführen
- Kandidaten für erste automatisierte Tests: Bewegungs-/Kollisionslogik (M1), Debatten-Bewertungslogik (M2), Save/Load-Serialisierung (M3)
- Integration in `godot-validate.yml` als zusätzlicher CI-Job, sobald Tests existieren
- Diese Einführung ist nicht Teil von M0 (Stage C laut ADR 001 ist reines Projektgrundgerüst ohne Gameplay-Code) und wird hier nur als Backlog-Hinweis festgehalten, nicht terminiert

## 3. Manuelle Test-Charta: Theologie-Content

### 3.1 Geltungsbereich

Jede Änderung an theologischen Inhalten — aktuell `constants.ts` `QUESTIONS` (3 Einträge: Werkgerechtigkeit/Mt 7,21, päpstlicher Primat/Mt 16,18, freier Wille/Röm 3,23) sowie jede Änderung an Gemini-System-Prompts in `server.ts`/`services/gemini.ts`, die theologische Bewertung beeinflussen — sowie das spätere Godot-Pendant ab M2 (siehe Roadmap).

### 3.2 Reviewer

`theology-accuracy-reviewer` aus [`AGENTS.md`](../../AGENTS.md) (Tools: Read, Grep, Glob). Prüft:

- Historische Ungenauigkeiten (Daten, Personen, Ereignisse)
- Doktrinäre Fehldarstellung von Sola Fide, Sola Scriptura, Ablässen oder katholischer vs. lutherischer Position
- Vereinfachungen, die Spielern etwas Falsches beibringen würden

Flaggt jeden Befund mit exakter Datei/Zeile und korrigierter Fassung. Bewertet ausdrücklich **keine** Stil- oder Balancing-Fragen — nur fachliche Korrektheit.

### 3.3 Pflichtschritte vor Merge

1. Bei jeder PR, die `QUESTIONS`-Einträge, Gemini-Theologie-Prompts oder (ab M2) das Godot-Dialog-/Debatten-Datenmodell ändert: `theology-accuracy-reviewer` als Review-Schritt ausführen, bevor der PR gemergt wird
2. Befunde des Reviewers sind vor Merge zu beheben oder begründet zurückzuweisen (Begründung im PR dokumentieren)
3. Content-Erweiterungen über die bestehenden 3 Fragen hinaus (z. B. Ablässe, 95 Thesen — laut Audit aktuell **nicht** vorhanden, nur Zielzustand) durchlaufen denselben Review zwingend, da hier das größte Risiko für doktrinäre Fehler liegt
4. Bei Doppelpflege der Inhalte in zwei Formaten (TypeScript für Web, `.tres`/JSON für Godot ab M2, siehe Risk-Register #6): beide Fassungen müssen inhaltlich übereinstimmen, Abweichungen sind ein Theologie-Review-Befund, kein reines Engineering-Problem

## 4. Akzeptanztestkriterien je Meilenstein

Detaillierte Umfangs- und Abhängigkeitsbeschreibung je Meilenstein: [`docs/planning/roadmap.md`](../planning/roadmap.md). Jeder Meilenstein gilt erst als abgeschlossen, wenn zusätzlich die projektweite Definition of Done (`docs/planning/definition-of-done.md`) erfüllt ist. Dieser Testplan ergänzt die dortigen DoD-Kriterien um die konkreten Prüfschritte aus Abschnitt 2:

| Meilenstein | Akzeptanzkriterium (Auszug, Quelle: Roadmap) | Konkreter Test |
|---|---|---|
| M0 — Projektgrundgerüst + CI | `/game` öffnet ohne Fehler im Godot-4.x-Editor; `godot-validate.yml` läuft grün auf dem PR; kein Gameplay-Code enthalten | `godot --headless --import` lokal + CI grün; manuelles Öffnen im Editor; Diff-Review auf Gameplay-Code-Abwesenheit |
| M1 — Spielercharakter + Kamera + Steuerung | Spielfigur kollisionsfrei steuerbar; Kamera stabil ohne unbehandeltes Clipping; Input-Mapping über Projekteinstellungen änderbar | Manueller Editor-Play-Test in Testszene; Input-Map-Eintrag ändern und Wirkung ohne Codeänderung verifizieren |
| M2 — Quest-/Dialog-/Debattensystem | Mindestens die 3 bestehenden theologischen Fragen im Godot-Format spielbar; Debattenausgang nachvollziehbar; Datenquelle dokumentiert | Manueller Durchlauf aller 3 Fragen (richtig/falsch je einmal) + theology-accuracy-reviewer-Lauf (Abschnitt 3) |
| M3 — Save/Load + Audio + Accessibility | Speichern → Beenden → Starten → Laden funktioniert; Lautstärkeregler wirken sofort und persistieren; mind. eine Accessibility-Option nachweisbar nutzbar | Manueller Full-Cycle-Test des Save/Load; Regler-Test vor/nach Neustart; Accessibility-Option real umschalten und Effekt beobachten |
| M4 — Polish + Export-Builds + Release | Export-Builds für macOS/Windows/Linux starten fehlerfrei; End-to-End-Durchlauf manuell verifiziert; Lizenzhinweise im Build sichtbar | Je Zielplattform Export erzeugen und starten; vollständiger Durchlauf Menü → Bewegung → Debatte → Speichern/Laden → Beenden protokollieren; Lizenztext-Sichtprüfung im Build |

Kein Meilenstein gilt als getestet, solange nicht sowohl die generische Definition of Done als auch die hier aufgeführten meilensteinspezifischen Tests durchlaufen wurden.

## 5. Regressionstest-Hinweis für das bestehende Web-Spiel

Laut ADR 001 ist `/game` additiv; das Web-Spiel im Root-Verzeichnis bleibt in allen Godot-Meilensteinen (M0–M4) unverändert. Trotzdem gilt:

- Jeder PR, der **ausschließlich** `/game` betrifft, löst keine Pflicht zur Web-Regressionstestung nach Abschnitt 1 aus, sofern der Diff keine Dateien außerhalb von `/game` (außer reiner Doku wie `CLAUDE.md`/`metadata.json`-Korrekturen, siehe Risk-Register #3) verändert
- Jeder PR, der Dateien **außerhalb** von `/game` verändert (Root-Verzeichnis, `server.ts`, `constants.ts`, `package.json`, CI-Konfiguration mit Wirkung auf den Web-Build), durchläuft verpflichtend den vollständigen manuellen Web-Test-Workflow aus Abschnitt 1.3, auch wenn die Änderung "nur" dokumentarisch wirkt
- Sonderfall künftige HTTP-Wiederverwendung des Express-Theologie-Backends durch Godot (ab M2 zu entscheiden, siehe Roadmap-Nicht-Ziele und ADR 001): Sobald diese Kopplung entsteht, ist sie ein Cross-Cutting-Concern — dann sind Änderungen an `server.ts`-Routen sowohl gegen den Web-Client als auch gegen den Godot-Client zu regressionstesten, dieser Testplan ist zu diesem Zeitpunkt entsprechend zu erweitern
- Bis dahin gibt es keine Laufzeit-Abhängigkeit zwischen den beiden Codebasen; ein roter Godot-CI-Lauf (`godot-validate.yml`) darf keinen Web-Build/-Deploy blockieren und umgekehrt
