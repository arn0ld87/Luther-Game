# Definition of Done — Sola Fide: The Luther Run / Godot-Migration

Stand: 2026-06-30, Branch `chore/game-foundation-planning`. Gilt für alle drei Teilbereiche des Repos: Doku/Planung, bestehender Web-Teil (Root, React/Express), neuer Godot-Teil (`/game`). Quelle der Hard Rules: [`CLAUDE.md`](../../CLAUDE.md); Quelle des Migrationskontexts: [`docs/00-discovery/repository-audit.md`](../00-discovery/repository-audit.md) und [ADR 001](../architecture/adr/001-godot-desktop-engine.md).

## Allgemeine Kriterien (gelten für jeden PR, unabhängig vom Teilbereich)

Diese Kriterien sind Pflicht, bevor ein PR als „done" gilt — unabhängig davon, ob er Doku, Web-Code oder Godot-Code ändert:

1. **Tests/Verifikation mit echtem Befehls-Output dokumentiert.** Jede Verifikationsaussage (Build läuft, Import läuft, Szene öffnet) muss mit tatsächlich ausgeführtem Befehl + Output belegt sein, nicht behauptet. Vorbild: Abschnitt 3 in `repository-audit.md` (`npm install`, `npm run build`, `npx tsc --noEmit` jeweils mit Output und Exit-Code).
2. **Kein unbelegter Erfolgsclaim.** Formulierungen wie „funktioniert", „läuft durch", „keine Fehler" sind ohne zugehörigen Befehls-Output im PR-Text oder Commit unzulässig. Wenn etwas nicht geprüft werden konnte (z. B. fehlendes Tool, keine Laufzeitumgebung), ist das explizit als Annahme/Lücke zu benennen — nicht stillschweigend als „erledigt" zu behandeln.
3. **Review-Anforderung bei größeren Eingriffen.** Für neue Subsysteme, größere Refactors oder Multi-File-Architekturänderungen ist laut `CLAUDE.md`-Workflow-Abschnitt vor dem Öffnen des PRs ein zusätzlicher Review-Pass mit dem Opus-Modell über den Diff durchzuführen. Kleine, lokal begrenzte Fixes benötigen diesen Pass nicht — Minimal-Diff-Prinzip hat Vorrang vor reflexhaftem Review-Overhead.
4. **Scope-Trennung respektiert.** Ein PR bleibt innerhalb seiner Stage (siehe ADR 001 Migrationsplan: Stage A Doku, Stage B Issue-Backlog, Stage C Godot-Grundgerüst). Funde, die außerhalb des PR-Scopes liegen (z. B. TS-Fehler im Web-Teil während einer Doku-PR), werden dokumentiert/verlinkt, nicht nebenbei mitgefixt.
5. **Sprache und Stil konsistent.** Neue Dokumente auf Deutsch, technische Bezeichner (Dateinamen, Code-Identifier, `GameState`, `QUESTIONS` etc.) im Original belassen — analog zu den bestehenden Stage-A-Dokumenten.

## (a) Doku-/Planungs-PRs (z. B. diese Stage-A-PR)

Ein Doku-/Planungs-PR ist „done", wenn zusätzlich zu den allgemeinen Kriterien gilt:

- **Keine Codeänderung enthalten.** Stage A ist laut ADR 001 ausdrücklich „Audit, ADR, Produkt-/Architekturdoku, Backlog — keine Codeänderung". Ein Doku-PR, der nebenbei Code anfasst, gehört nicht in diese Kategorie.
- **Faktenbehauptungen sind verifiziert, nicht angenommen.** Aussagen über den Ist-Zustand (z. B. „kein Three.js", „nur 3 `QUESTIONS`-Einträge", „`npm run build` läuft durch") müssen auf real ausgeführten Befehlen oder tatsächlich gelesenem Code/Dateien beruhen, mit Quellenangabe (Datei + Zeile oder Befehls-Output), nicht auf Annahmen aus früheren Sessions übernommen werden. Vorbild: `repository-audit.md` Abschnitt 7 macht Annahmen explizit kenntlich.
- **Querverweise sind konsistent und funktionieren.** Relative Markdown-Links zwischen den Planungsdokumenten (Audit, ADR, Roadmap, Risk Register, diese DoD) zeigen auf existierende Dateien und korrekte Pfade.
- **Widersprüche zum bestehenden Stand sind benannt, nicht verschwiegen.** Bekannte Diskrepanzen (z. B. `CLAUDE.md`/`metadata.json` behaupten fälschlich 3D/React Three Fiber) werden explizit als Befund dokumentiert statt stillschweigend übernommen oder ignoriert.
- **Offene Entscheidungen sind als solche markiert**, nicht als bereits getroffen dargestellt (z. B. Owner-Platzhalter `_TBD_` im Risk Register, „Status: Vorgeschlagen" in der ADR).
- **Kein Drive-by-Fix an unrelated Inhalten.** Eine Doku-PR korrigiert nicht nebenbei Tippfehler oder Inhalte in Dateien außerhalb ihres deklarierten Scopes, wenn das nicht explizit Teil des Auftrags ist.

## (b) Code-PRs im bestehenden Web-Teil (Root, React/Express)

Ein Code-PR im Web-Teil ist „done", wenn zusätzlich zu den allgemeinen Kriterien die Hard Rules aus `CLAUDE.md` eingehalten sind:

- **`npm run build` muss bestehen** (Exit Code 0), Output im PR dokumentiert. Zu beachten: Laut Audit (Abschnitt 3) prüft `vite build` nicht vollständig auf TS-Fehler — wo Typsicherheit relevant ist, zusätzlich `npx tsc --noEmit` ausführen und Output dokumentieren, nicht nur den (potenziell trügerischen) Vite-Build-Erfolg als Beleg nehmen.
- **State-Updates ausschließlich per `dispatch`.** Keine direkte Mutation von `GameContext`-State; jede Änderung geht über `dispatch({ type, payload })` im `useReducer` aus `context/GameContext.tsx`.
- **Neue Top-Level-UI ist in eine `ErrorBoundary` eingebettet.**
- **Keine inline hartcodierten Farben, Scores, Speeds oder theologischen Fragen** — diese gehören in `constants.ts`.
- **Jede neue/geänderte `server.ts`-Route hat try/catch und liefert im Fehlerfall ein valides Fallback-Objekt** (z. B. `DEFAULT_THEOLOGICAL_ERROR`), nie einen rohen Gemini-Fehler an den Client durchreichen.
- **`.env.local` nicht committet, `GEMINI_API_KEY` nicht geloggt.**
- **Beide Dev-Server (`npm run dev` + `npm run server`) lokal gestartet und Browser-Konsole auf Fehler geprüft**, bevor die Änderung als funktionsfähig behauptet wird — reiner Build-Erfolg ersetzt diesen manuellen Check nicht.
- **Minimal-Diff bei kleinen Fixes** — kein ungefragter Refactor unbeteiligter Komponenten.
- **Path-Alias `@/*` weiterhin korrekt aufgelöst**, keine gebrochenen Imports.
- **Passender Subagent aus `AGENTS.md` als Review-Schritt, analog zu `theology-accuracy-reviewer`** (siehe `historical-and-theological-content-policy.md`, `test-plan.md`): `api-security-reviewer` bei Änderungen an `server.ts`/`services/gemini.ts`, `canvas2d-perf-reviewer` bei Änderungen an `Game2DCanvas.tsx`/`engine/*`. Empfohlen vor dem Merge, kein hartes Blocker-Gate wie bei Theologie-Inhalten.

## (c) Code-PRs im neuen Godot-Teil (`/game`)

Ein Code-PR im Godot-Teil ist „done", wenn zusätzlich zu den allgemeinen Kriterien gilt:

- **`godot --headless --import` läuft fehlerfrei durch**, Exit Code 0, vollständiger Konsolen-Output im PR dokumentiert (keine übersprungenen Importfehler, keine stillschweigend ignorierten Warnungen bei neu hinzugefügten Assets).
- **Betroffene Szenen wurden tatsächlich im Editor (oder headless, falls zutreffend) geöffnet/geprüft**, nicht nur als `.tscn`-Diff angenommen. Bei sichtbaren Inhalten (z. B. Bootstrap-Szene) ist ein Screenshot oder eine konkrete Beschreibung des geprüften Verhaltens beizulegen.
- **Export-Presets bleiben unverändert lauffaehig.** Wird `export_presets.cfg` nicht geändert, ist das im PR zu bestätigen; wird es geändert, muss mindestens ein betroffener Export-Preset real exportiert (oder zumindest validiert) und das Ergebnis dokumentiert werden.
- **Godot-Version ist gepinnt und im PR genannt** (konkrete 4.x-Versionsnummer, siehe ADR 001 — Versionsermittlung erfolgt zur Implementierungszeit, ist aber ab dann verbindlich zu dokumentieren, nicht offen zu lassen).
- **Asset-Lizenzen sind vor Verwendung geprüft, nicht angenommen.** Wird Material aus `godot_assets/` (Kenney Castle Kit, Quaternius Medieval Village MegaKit) übernommen, muss die jeweilige `License.txt` real gelesen und das Ergebnis im PR oder in `docs/architecture/game-architecture.md` referenziert sein (siehe Audit Abschnitt 4, Risk Register Risiko 4).
- **Scope bleibt auf die jeweilige Stage begrenzt.** Stage C ist laut ADR 001 explizit „Minimal-3D-Bootstrap-Szene", kein Vertical Slice — Controller, Kamera, Quest-/Dialog-/Debattensystem etc. gehören in eigene, spätere PRs aus dem Stage-B-Backlog (siehe Risk Register Risiko 9).
- **Keine Vermischung mit dem Web-Teil.** `/game`-Änderungen berühren keine Root-Dateien des bestehenden Web-Spiels; theologische Inhalte, die für Godot dupliziert/generiert werden, sind als solche gekennzeichnet (Single-Source-of-Truth-Frage ist laut ADR 001 noch offen, siehe Risk Register Risiko 6 — bis zur Klärung keine stillschweigende Doppelpflege ohne Hinweis).
- **CI-Validierung (`godot-validate.yml`, sobald vorhanden) ist grün**, Output/Link zum Run im PR.

## Pflege dieses Dokuments

Diese Definition of Done wird bei jeder neuen Stage (B, C, Folge-Sessions) überprüft und bei Bedarf ergänzt — insbesondere Abschnitt (c), sobald `godot-validate.yml` existiert und die ersten realen Godot-PR-Erfahrungen vorliegen.
