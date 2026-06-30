# Historische und theologische Content-Policy

Status: Entwurf · Geltungsbereich: bestehendes 2D-Web-Spiel (`constants.ts` `QUESTIONS`, `services/gemini.ts`, `server.ts`) und das geplante Godot-4-3D-Spiel unter `/game` (additiv, sobald dort eigener Glaubensfrage-Content entsteht).

## 1. Zweck

"Sola Fide: The Luther Run" ist ein Lernspiel über die Theologie der lutherischen Reformation. Der Bildungsanspruch des Spiels steht und fällt mit der historischen und theologischen Genauigkeit der `QUESTIONS`-Inhalte und der KI-generierten Bewertungen im Disputatio-Mechanismus (`components/DebateInterface.tsx`). Eine falsche, verzerrende oder konfessionell abwertende Darstellung untergräbt den Lernzweck und ist ein inhaltlicher Defekt, kein stilistisches Detail — sie wird mit derselben Ernsthaftigkeit behandelt wie ein Funktionsbug.

Diese Policy regelt, welche Quellen für neue Glaubensfragen zulässig sind, welcher Redaktionsprozess vor dem Merge greift, welche Darstellungen ausgeschlossen sind, und woran sich neue Inhalte qualitativ messen lassen müssen.

## 2. Quellenlage und Grundsätze

**Zulässige Quellen, in Prioritätsreihenfolge:**

1. **Primärquellen**: Bibelstellen (Lutherbibel oder vergleichbar etablierte Übersetzung, mit Stellenangabe), Luthers eigene Schriften (95 Thesen, *De servo arbitrio*, *Von der Freiheit eines Christenmenschen*, Tischreden) sowie zeitgenössische katholische Gegenpositionen (z. B. Konzil von Trient, kanonisches Recht zu Ablässen), wo eine Gegenposition dargestellt wird.
2. **Anerkannte historische und theologische Sekundärliteratur**: Standardwerke der Reformationsgeschichte und konfessionskundliche Darstellungen (z. B. Reformationshistoriker wie Heiko Oberman, Volker Leppin, Bernd Moeller; Nachschlagewerke wie RGG, TRE). Keine Wikipedia-Zusammenfassungen als alleinige Quelle, keine unbelegten Allgemeinplätze.
3. **Gemini-generierte Inhalte** (`checkTheologicalArgument`, `askLutherDeepDive` in `services/gemini.ts`) sind Bewertungs- und Erklärwerkzeuge zur Laufzeit, **keine** Quelle für neue `QUESTIONS`-Einträge. Modellantworten können theologisch unscharf oder anachronistisch sein; sie werden im Spiel als Feedback ausgespielt, aber jede neue Frage/Kontext-Kombination in `constants.ts` muss redaktionell gegen Primär- oder anerkannte Sekundärquellen geprüft werden, bevor sie in den Code wandert.

**Grundsätze:**

- Jede `QUESTIONS`-Frage braucht einen historisch verorteten Bibel- oder Quellenbezug (siehe `context`-Feld), keine freischwebende Doktrin-Behauptung.
- Lutherische Position und etwaige katholische Gegenposition werden beide in ihrer eigenen Begrifflichkeit und Ernsthaftigkeit dargestellt — Reformationsgeschichte ist Streit zweier ernstzunehmender theologischer Systeme, nicht Lehrmeinung gegen Karikatur.
- Theologische Komplexität darf für die Spielmechanik (Persuasion-Meter, kurze Texteingabe) zugespitzt, aber nicht sachlich verfälscht werden. Zuspitzung ist ein Vereinfachungsgrad, keine Lizenz für Falschaussagen.
- Deutsch ist die Zielsprache für Fragen und Kontext, konsistent mit den bestehenden drei Einträgen.

## 3. Redaktionsprozess

Vor dem Merge **jeder** neuen oder geänderten `QUESTIONS`-Frage (in `constants.ts`) oder jedes geänderten theologischen System-Prompts (in `server.ts` / `services/gemini.ts`):

1. **Entwurf**: Frage, `context`-Feld (Bibelstelle + Kurzzitat) und – falls die Antwortbewertung berührt ist – der zugehörige Gemini-Prompt werden vollständig ausformuliert, inklusive Quellenangabe außerhalb des Codes (z. B. im PR-Beschreibungstext oder Commit-Message).
2. **Review durch `theology-accuracy-reviewer`**: Der in `AGENTS.md` definierte Subagent (`tools: Read, Grep, Glob`) prüft den Diff auf:
   - historische Fehler (Daten, Personen, Ereignisse),
   - doktrinäre Fehldarstellung von Sola Fide, Sola Scriptura, Ablasslehre oder der katholisch-lutherischen Differenz,
   - Vereinfachungen, die Spielern etwas sachlich Falsches beibringen würden.
   Der Reviewer meldet jeden Befund mit exakter Datei/Zeile und einer korrigierten Formulierung; Stil- oder Balancing-Fragen sind explizit nicht sein Mandat.
3. **Korrektur**: Befunde werden eingearbeitet, bis der Reviewer-Pass ohne offene Beanstandung durchläuft.
4. **Merge-Gate**: Kein PR mit neuen oder geänderten `QUESTIONS`-Einträgen oder theologischen Prompts wird gemergt, ohne dass dieser Review-Pass durchgelaufen und dokumentiert ist (PR-Kommentar oder Review-Notiz genügt als Nachweis).

Dieser Prozess ergänzt, ersetzt aber nicht den allgemeinen Workflow aus `CLAUDE.md` (Build muss grün sein, Opus-Review-Pass bei größeren Eingriffen).

## 4. No-Gos

- **Anachronismen**: Begriffe, Institutionen oder Konflikte späterer Jahrhunderte (z. B. moderne Konfessionskunde-Begriffe, nachtridentinische katholische Lehrentwicklungen) dürfen nicht unkommentiert in die Zeit vor/um 1517–1546 zurückprojiziert werden.
- **Doktrin-Vereinfachung bis zur Falschaussage**: "Katholiken glauben, man kann sich den Himmel erkaufen" ist keine zulässige Kurzform für die Ablasspraxis — die tatsächliche Lehrdifferenz (Werkgerechtigkeit, Buße, Schatz der Kirche) muss erkennbar bleiben, auch in zugespitzter Spielsprache.
- **Einseitige Darstellung katholisch vs. lutherisch**: Keine Partei wird als dumm, bösartig oder per se unterlegen dargestellt. Strittige Positionen werden als das benannt, was sie historisch waren — ernsthafte theologische Auseinandersetzung —, nicht als Gut-Böse-Schema.
- **Stellenangaben ohne Beleg**: Keine erfundenen oder ungeprüften Bibel-/Quellenverweise. Jede Stellenangabe im `context`-Feld muss verifizierbar sein.
- **Gemini-Output ungeprüft als Fakteninhalt übernehmen**: Modellantworten dürfen das Spielgefühl (Feedback, Deep-Dive-Erklärung) tragen, aber nicht ungeprüft in feste `constants.ts`-Inhalte einfließen.

## 5. Qualitätsmaßstab: die drei bestehenden Fragen

Die aktuellen drei Einträge in `constants.ts` (`QUESTIONS`) sind der Referenzstandard für Form und Tiefe neuer Fragen:

| # | Frage | Kontext (Bibelstelle) | Theologisches Spannungsfeld |
|---|---|---|---|
| 1 | "Muss ich gute Werke tun, um von Gott geliebt zu werden?" | Matthäus 7,21 | Sola Fide vs. Werkgerechtigkeit |
| 2 | "Ist der Papst das Oberhaupt der Kirche?" | Matthäus 16,18 | Papstprimat / Petrus-Stelle vs. reformatorisches Kirchenverständnis |
| 3 | "Haben wir einen freien Willen zum Guten?" | Römer 3,23 | Sola Gratia / Erbsünde vs. freier Wille |

Jede Frage erfüllt drei Kriterien, an denen sich Backlog-Kandidaten messen lassen müssen:

1. Sie benennt eine konkrete, historisch belegte Streitfrage der Reformation (keine generische Glaubensfrage).
2. Sie ist mit einer konkreten, korrekt zitierten Bibelstelle als Ausgangspunkt der Disputatio verankert.
3. Sie ist so formuliert, dass eine lutherische Antwort *und* eine erkennbare katholische Gegenposition möglich sind — der Spieler muss tatsächlich argumentieren, nicht nur eine vorgegebene Lehrmeinung wiederholen.

## 6. Prozess für neue Fragen im Backlog

Der aktuelle Content-Stand ist bewusst schmal (3 Fragen). Geplante Erweiterungen (z. B. Ablässe / 95 Thesen, Sola Scriptura, Abendmahlsstreit, Rechtfertigungslehre im Detail) durchlaufen vor Aufnahme in den Sprint-Backlog:

1. **Themenvorschlag**: kurze Notiz, welches reformationsgeschichtliche Thema fehlt und warum es lehrplanrelevant ist.
2. **Quellenrecherche**: Bibelstelle(n) und mindestens eine Sekundärquelle gemäß Abschnitt 2 werden vor der Implementierung benannt, nicht nachträglich.
3. **Entwurf** der Frage + `context`-Feld nach dem Muster aus Abschnitt 5.
4. **Review** durch `theology-accuracy-reviewer` gemäß Abschnitt 3, vor dem ersten Merge.
5. **Aufnahme in `constants.ts`** erst nach abgeschlossenem Review; parallel dazu Prüfung, ob ein zugehöriger Gemini-Prompt (Bewertungslogik) angepasst werden muss.

Backlog-Kandidaten ohne benannte Quelle werden nicht priorisiert.
