export const meta = {
  name: 'luther-game-stage-a-docs',
  description: 'Erzeugt 13 Planungsdokumente fuer die Godot-Migration parallel per Subagenten, dann Konsistenz-Review',
  phases: [
    { title: 'Draft', detail: '11 parallele Agenten schreiben Planungsdokumente direkt auf Platte' },
    { title: 'Consistency Review', detail: 'Ein Agent liest alle Dokumente + Audit/ADR, prueft Konsistenz, fixt kleinere Widersprueche' },
  ],
}

const ROOT = '/Volumes/T7/Projekte/Luther-Game'

const CONTEXT = `
KONTEXT (verifizierte Fakten, NICHT erfinden, bei Bedarf selbst nachlesen):
- Repo: ${ROOT}, Branch chore/game-foundation-planning. Lies zuerst ${ROOT}/docs/00-discovery/repository-audit.md und ${ROOT}/docs/architecture/adr/001-godot-desktop-engine.md fuer den vollstaendigen verifizierten Stand.
- Ist-Zustand: 2D-Canvas-Web-Spiel (React 19 + Express 5, KEIN Three.js/R3F). Ziel: NEUES Godot-4.x-3D-Desktop-Spiel unter /game, additiv, bestehendes Web-Spiel bleibt unveraendert bestehen.
- Theologischer Content-Stand ist SCHMAL: constants.ts QUESTIONS hat nur 3 Eintraege (Werkgerechtigkeit/Mt 7,21, Papst-Primat/Mt 16,18, freier Wille/Roem 3,23), auf Deutsch. NICHT von einer breiteren Abdeckung (Ablaesse, 95 Thesen) als bereits vorhanden ausgehen - das ist Zielzustand/Backlog, nicht Ist-Zustand.
- godot_assets/ (lokal, 331MB, git-ignoriert, vom Nutzer bewusst angelegt): Kenney Castle Kit + Quaternius Medieval Village MegaKit - Lowpoly-Gebaeude/Dorf-Assets, passend zu einem Wittenberg-/Reformations-Setting. Als reale Asset-Grundlage fuer Stage C referenzieren.
- GitHub: Repo arn0ld87/Luther-Game, 0 offene Issues, 2 gemergte PRs, 9 Standard-Labels (bug, documentation, duplicate, enhancement, good first issue, help wanted, invalid, question, wontfix), 0 Milestones, gh CLI lokal real verfuegbar (anders als eine fruehere Sandbox-Annahme).
- Sprache: Alle Dokumente auf Deutsch verfassen (Projekt/Team ist deutschsprachig), technische Bezeichner (Dateinamen, Code, GameState, QUESTIONS etc.) im Original belassen.
- Schreibe NUR die dir zugewiesene Datei. Schreibe sie direkt mit dem Write-Tool an den absoluten Pfad. Gib am Ende NUR eine 1-2 Satz Bestaetigung zurueck (Dateipfad + worum es geht), NICHT den vollen Inhalt - das spart Kontext fuer die Orchestrierung.
`

phase('Draft')
const draftTasks = [
  {
    label: 'lastenheft',
    path: `${ROOT}/docs/product/lastenheft.md`,
    prompt: `Schreibe ein Lastenheft (Anforderungsdokument aus Auftraggebersicht) fuer die Godot-Migration. Struktur: Zielsetzung, Ist-Zustand (kurz, Verweis auf Audit), Funktionale Anforderungen (3D-Desktop-Spiel, Reformationstheologie-Lerninhalt, Debattensystem, Speicherstand, Steuerung), Nicht-funktionale Anforderungen (Cross-Plattform macOS/Windows/Linux, Performance, Zugaenglichkeit), Abgrenzung (was NICHT Teil des Lastenhefts ist, z.B. bestehendes Web-Spiel bleibt unangetastet), Liefergegenstaende je Stage (A/B/C), Abnahmekriterien.`,
  },
  {
    label: 'gdd',
    path: `${ROOT}/docs/product/game-design-document.md`,
    prompt: `Schreibe ein Game Design Document fuer das neue Godot-3D-Spiel. Lies zusaetzlich ${ROOT}/constants.ts und ${ROOT}/types.ts fuer die exakten 3 bestehenden Theologie-Fragen und die Game-State-Maschine (MENU/PLAYING/DEBATE/...) als Ausgangsbasis fuer das Godot-Pendant. Struktur: Vision/Pitch, Zielgruppe, Core Loop, Spielwelt (Wittenberg/Reformationssetting, passend zu den vorhandenen godot_assets Lowpoly-Kits), Spielmechaniken (Bewegung, Debattensystem als 3D-Pendant zum bestehenden DebateInterface, Sammelmechanik/Resourcen), Content-Umfang realistisch ausgehend von 3 bestehenden Fragen + Backlog fuer Erweiterung, Progression, UI/HUD-Konzept, Art-Direction (Lowpoly, abgeleitet aus Kenney/Quaternius-Stil), Sound/Musik (Platzhalter, kein bestehendes Audio-Asset fuer Godot vorhanden). Keine Erfindung von bereits existierenden Inhalten - klar als Zielkonzept kennzeichnen.`,
  },
  {
    label: 'content-policy',
    path: `${ROOT}/docs/product/historical-and-theological-content-policy.md`,
    prompt: `Schreibe eine historische/theologische Content-Policy. Lies zusaetzlich ${ROOT}/constants.ts (QUESTIONS) und ${ROOT}/components/DebateInterface.tsx fuer den bestehenden Debatten-Mechanismus. Struktur: Zweck (historische/theologische Genauigkeit fuer ein Lernspiel ueber lutherische Reformationstheologie), Quellenlage/Grundsaetze (Primaerquellen wie Bibelstellen, anerkannte historische Sekundaerliteratur, keine konfessionelle Abwertung), Redaktionsprozess (Review durch den bestehenden theology-accuracy-reviewer Subagenten aus AGENTS.md vor Merge neuer Glaubensfragen), No-Gos (Anachronismen, Doktrin-Vereinfachung, einseitige Darstellung katholisch vs. lutherisch), Beispiel anhand der 3 bestehenden Fragen als Qualitaetsmassstab, Prozess fuer neue Fragen im Backlog.`,
  },
  {
    label: 'architecture',
    path: `${ROOT}/docs/architecture/game-architecture.md`,
    prompt: `Schreibe ein Architekturdokument fuer beide Codebasen (bestehendes Web-2D-Spiel + neues Godot-3D-Spiel). Nutze, falls verfuegbar, die MCP-Tools mcp__code-review-graph__get_architecture_overview_tool und mcp__code-review-graph__list_communities_tool (repo_root=${ROOT}) um die tatsaechliche bestehende Code-Struktur des Web-Teils zu erden statt zu erfinden - falls die Tools nicht erreichbar sind, lies stattdessen App.tsx, GameApp.tsx, context/GameContext.tsx, server.ts direkt. Struktur: Ist-Architektur Web-Teil (State via Context+useReducer, Game-State-Maschine, Express-Backend-Routen, Datei-Organisation), Ziel-Architektur Godot-Teil unter /game (Szenen-/Node-Struktur, Autoload-Singletons fuer Game-State, geplante Verzeichnisse assets/scenes/scripts/resources/tests), Schnittstellen/Trennung (keine geteilte Codebasis, ggf. spaetere HTTP-Bruecke zum bestehenden Express-Theologie-Backend als offene Frage), Datenfluss-Diagramm (Mermaid), Begruendung Verzeichnistrennung (Verweis auf ADR 001).`,
  },
  {
    label: 'roadmap',
    path: `${ROOT}/docs/planning/roadmap.md`,
    prompt: `Schreibe eine Roadmap mit Meilensteinen M0-M4. Lies ${ROOT}/docs/architecture/adr/001-godot-desktop-engine.md fuer den Migrationsplan-Kurzabriss. Struktur je Meilenstein: Ziel, Umfang, Abhaengigkeiten, Definition of Done (Verweis auf docs/planning/definition-of-done.md), realistische Reihenfolge: M0 Projektgrundgeruest+CI (=Stage C), M1 Spielercharakter+Kamera+Steuerung, M2 Quest-/Dialog-/Debattensystem (3D-Pendant zum bestehenden Web-DebateInterface), M3 Save/Load+Audio+Accessibility, M4 Polish+Export-Builds+Release. Explizit vermerken: M1-M4 sind NICHT Teil der aktuellen Sitzung, nur M0 (Stage C) wird ggf. direkt im Anschluss begonnen.`,
  },
  {
    label: 'risk-register',
    path: `${ROOT}/docs/planning/risk-register.md`,
    prompt: `Schreibe ein Risk-Register als Tabelle (Risiko, Wahrscheinlichkeit, Auswirkung, Massnahme, Owner-Platzhalter). Lies ${ROOT}/docs/00-discovery/repository-audit.md Abschnitt 6 fuer bereits identifizierte Risiken (12 TS-Fehler von vite build nicht erkannt, 12 npm-Audit-Vulnerabilities, veraltete 3D-Beschreibung in CLAUDE.md/metadata.json, godot_assets Lizenzpruefung). Ergaenze migrationsspezifische Risiken: GDScript-Lernkurve fuer Mitwirkende, Doppelpflege von Theologie-Content in zwei Formaten (React+Godot), Asset-Lizenz-Compliance, CI-Kosten/Zeit fuer Godot-Downloads, Scope-Creep bei Vertical Slice.`,
  },
  {
    label: 'dod',
    path: `${ROOT}/docs/planning/definition-of-done.md`,
    prompt: `Schreibe eine Definition of Done, getrennt nach: (a) Doku-/Planungs-PRs (wie diese Stage-A-PR), (b) Code-PRs im bestehenden Web-Teil (Verweis auf CLAUDE.md Hard Rules: npm run build muss bestehen, dispatch-only State-Updates, ErrorBoundary fuer neue UI), (c) Code-PRs im neuen Godot-Teil (godot --headless --import laeuft fehlerfrei, Szenen geprueft, Export-Presets unveraendert lauffaehig). Allgemeine Kriterien: Tests/Verifikation dokumentiert mit echtem Befehls-Output, kein unbelegter Erfolgsclaim, Review-Anforderung bei groesseren Eingriffen (Opus-Review-Pass laut CLAUDE.md Workflow-Abschnitt).`,
  },
  {
    label: 'backlog',
    path: `${ROOT}/docs/planning/backlog.md`,
    prompt: `Schreibe das Backlog-Dokument. Enthaelt: 1) Vorgeschlagene Label-Taxonomie (type:feature/type:bug/type:docs/type:chore, area:godot/area:web/area:backend/area:content, priority:p0-p3, status:blocked/status:ready) als TABELLE mit Name+Farbe+Beschreibung - als Dokumentation, da die tatsaechliche Anlage eine offene Entscheidung mit dem Auftraggeber ist (gh CLI ist lokal zwar verfuegbar, aber das Anlegen neuer Labels/Milestones auf einem Repo mit echtem Kollaborator arn0ld87 ist eine bewusste Owner-Entscheidung, kein automatischer Schritt). 2) Milestones M0-M4 (Name, Kurzbeschreibung, Verweis auf roadmap.md) ebenfalls als Tabelle. 3) Liste der 16 grob geplanten Issue-Themen (kurzer Titel + 1 Satz) als Vorschau auf Stage B - NICHT die volle Issue-Beschreibung, die kommt erst in Stage B per separatem Workflow-Lauf.`,
  },
  {
    label: 'test-plan',
    path: `${ROOT}/docs/qa/test-plan.md`,
    prompt: `Schreibe einen Testplan. Struktur: Teststrategie Web-Teil (kein automatisiertes Test-Setup vorhanden laut CLAUDE.md - manuelle Verifikation via npm run build + beide Dev-Server + Browser-Konsole, ergaenzend tsc --noEmit fuer echte Typpruefung da vite build das nicht abdeckt - siehe Audit), Teststrategie Godot-Teil (godot --headless --import als Mindestverifikation nach jeder Szenenaenderung, spaeter GUT/GdUnit fuer Unit-Tests als Backlog-Item), manuelle Test-Charta fuer Theologie-Content (Review durch theology-accuracy-reviewer aus AGENTS.md), Akzeptanztest-Kriterien je Meilenstein (Verweis auf roadmap.md), Regressionstest-Hinweis fuer bestehendes Web-Spiel bei Aenderungen.`,
  },
  {
    label: 'contributing',
    path: null,
    prompt: `Schreibe ZWEI Dateien: 1) ${ROOT}/docs/contributing/workflow.md - detaillierter Mitwirkenden-Workflow (Branch-Namenskonvention, PR-Workflow als Default laut CLAUDE.md, Commit-Konventionen, Review-Anforderungen inkl. Opus-Review-Pass bei groesseren Eingriffen, Unterschied Web-PR vs. Godot-PR). 2) ${ROOT}/CONTRIBUTING.md - kurze, einsteigerfreundliche Zusammenfassung (Setup beider Toolchains: npm fuer Web, Godot-Editor-Download fuer /game, Verweis auf docs/contributing/workflow.md fuer Details, Verweis auf .github/ISSUE_TEMPLATE und good-first-issue-Label). Schreibe BEIDE Dateien direkt mit dem Write-Tool. Bestaetige am Ende beide Pfade kurz.`,
  },
  {
    label: 'github-meta',
    path: null,
    prompt: `Schreibe FUENF GitHub-Metadateien direkt mit dem Write-Tool: 1) ${ROOT}/.github/PULL_REQUEST_TEMPLATE.md (Was/Warum/Test/Risiko-Struktur, passend zu plan.md PR-Beschreibungskonvention). 2) ${ROOT}/.github/ISSUE_TEMPLATE/feature.yml (GitHub Issue Form Schema YAML: Titel, Beschreibung, Akzeptanzkriterien, betroffener Bereich web/godot/backend). 3) ${ROOT}/.github/ISSUE_TEMPLATE/bug.yml (Reproduktionsschritte, erwartetes/tatsaechliches Verhalten, Umgebung). 4) ${ROOT}/.github/ISSUE_TEMPLATE/content.yml (fuer theologische/historische Content-Vorschlaege, mit Pflichtfeld Quellenangabe, Verweis auf historical-and-theological-content-policy.md). 5) ${ROOT}/.github/ISSUE_TEMPLATE/config.yml (blank_issues_enabled: false, contact_links leer oder auf CONTRIBUTING.md verweisend). Nutze echtes GitHub Issue-Forms-YAML-Schema (name, description, title, labels, body mit type/id/attributes). Bestaetige am Ende alle 5 Pfade kurz.`,
  },
]

const drafted = await parallel(draftTasks.map(t => () =>
  agent(`${CONTEXT}\n\nDEINE AUFGABE:\n${t.prompt}${t.path ? `\n\nZielpfad: ${t.path}` : ''}`, { label: `draft:${t.label}`, phase: 'Draft' })
))
log(`Draft abgeschlossen: ${drafted.filter(Boolean).length}/${draftTasks.length} Agenten erfolgreich`)

phase('Consistency Review')
const ALL_PATHS = [
  `${ROOT}/docs/product/lastenheft.md`,
  `${ROOT}/docs/product/game-design-document.md`,
  `${ROOT}/docs/product/historical-and-theological-content-policy.md`,
  `${ROOT}/docs/architecture/game-architecture.md`,
  `${ROOT}/docs/planning/roadmap.md`,
  `${ROOT}/docs/planning/risk-register.md`,
  `${ROOT}/docs/planning/definition-of-done.md`,
  `${ROOT}/docs/planning/backlog.md`,
  `${ROOT}/docs/qa/test-plan.md`,
  `${ROOT}/docs/contributing/workflow.md`,
  `${ROOT}/CONTRIBUTING.md`,
  `${ROOT}/.github/PULL_REQUEST_TEMPLATE.md`,
  `${ROOT}/.github/ISSUE_TEMPLATE/feature.yml`,
  `${ROOT}/.github/ISSUE_TEMPLATE/bug.yml`,
  `${ROOT}/.github/ISSUE_TEMPLATE/content.yml`,
  `${ROOT}/.github/ISSUE_TEMPLATE/config.yml`,
]

const review = await agent(
  `Lies ALLE folgenden Dateien vollstaendig (sie existieren bereits) und pruefe sie auf Konsistenz untereinander und mit ${ROOT}/docs/00-discovery/repository-audit.md sowie ${ROOT}/docs/architecture/adr/001-godot-desktop-engine.md:\n${ALL_PATHS.join('\n')}\n\nPruefe insbesondere: (1) einheitliche Terminologie (Meilenstein-Namen M0-M4, Stage A/B/C-Bezeichnungen), (2) keine Datei behauptet faelschlich einen breiteren Theologie-Content-Stand als die real vorhandenen 3 QUESTIONS-Eintraege, (3) keine Datei beschreibt das NEUE Godot-Spiel als bereits implementiert (es ist Zielkonzept), (4) Querverweise zwischen den Dokumenten sind plausibel (z.B. roadmap.md referenziert definition-of-done.md korrekt), (5) keine Datei widerspricht der Aussage, dass gh CLI hier real verfuegbar ist und Label/Milestone-Anlage eine offene Entscheidung ist (nicht: technisch unmoeglich). Behebe gefundene Widersprueche/Inkonsistenzen DIREKT per Edit-Tool in den betroffenen Dateien (kleine, gezielte Korrekturen, keine Neuschreibung ganzer Dateien). Gib am Ende eine kompakte Liste zurueck: was wurde wo korrigiert, und was (falls etwas) bleibt als bekannte Inkonsistenz offen.`,
  { label: 'consistency-review', phase: 'Consistency Review' }
)

return { drafted: drafted.filter(Boolean).length, total: draftTasks.length, review }
