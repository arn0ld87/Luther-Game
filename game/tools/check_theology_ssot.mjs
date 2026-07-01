#!/usr/bin/env node
// check_theology_ssot.mjs
// ---------------------------------------------------------------------------
// CI-Konsistenz-Gate (Issue #15, adressiert Risk #6 — Doppelpflege theologischer
// Inhalte).
//
// Hintergrund: Die 3 theologischen Debattenfragen leben als EINZIGE Quelle in
//   game/resources/theology/theology_questions.json
// Beide Spiele lesen genau diese Datei:
//   - Web:   constants.ts importiert die JSON und re-exportiert `QUESTIONS`
//   - Godot: der Autoload TheologyData (game/scripts/autoload/theology_data.gd)
// Dadurch existiert keine Duplikation — die Inhalte KÖNNEN nicht auseinanderlaufen,
// solange diese Verdrahtung bestehen bleibt. Dieses Gate sichert genau das ab.
//
// Prüft:
//   1. Struktur/Vollständigkeit der JSON (version, genau 3 Fragen, eindeutige IDs,
//      nicht-leere text/context, text ist eine Frage).
//   2. Kanonische Bibelstellen-Anker (Mt 7,21 / Mt 16,18 / Röm 3,23) als
//      Integritätsprüfung gegen stille Content-Änderungen — bewusst nur die kurzen,
//      stabilen Stellenangaben, KEIN Volltext-Duplikat der Fragen im Testcode.
//   3. SSOT-Verdrahtung: constants.ts liest weiterhin aus der JSON (kein Rückfall
//      auf eine inline hartcodierte Frageliste, die Web und Godot divergieren ließe).
//
// Exit 1 + Fehlerliste bei Verstoß, Exit 0 + Erfolgsmeldung sonst.
// Reines Node (kein tsx/Godot nötig) → deterministisch und CI-billig.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const JSON_PATH = path.join(repoRoot, "game", "resources", "theology", "theology_questions.json");
const CONSTANTS_PATH = path.join(repoRoot, "constants.ts");

// Kanonische Anker: id + erwartete Bibelstelle (stabile Kurz-Referenz, kein Volltext).
const EXPECTED = [
  { id: 1, scripture: "Matthäus 7,21" },
  { id: 2, scripture: "Matthäus 16,18" },
  { id: 3, scripture: "Römer 3,23" },
];

const errors = [];

// --- 1./2. JSON-Struktur + kanonische Integrität ---------------------------
let data;
try {
  data = JSON.parse(readFileSync(JSON_PATH, "utf8"));
} catch (e) {
  console.error(`FEHLER: theology_questions.json nicht lesbar/parsebar: ${e.message}`);
  process.exit(1);
}

if (typeof data.version !== "number") errors.push("version fehlt oder ist keine Zahl");

if (!Array.isArray(data.questions)) {
  errors.push("'questions' ist kein Array");
} else {
  if (data.questions.length !== EXPECTED.length) {
    errors.push(`erwartete ${EXPECTED.length} Fragen, gefunden ${data.questions.length}`);
  }

  const ids = [];
  for (const q of data.questions) {
    ids.push(q.id);
    if (typeof q.id !== "number") {
      errors.push(`Frage ohne numerische id: ${JSON.stringify(q).slice(0, 60)}`);
    }
    if (typeof q.text !== "string" || q.text.trim() === "") {
      errors.push(`Frage id=${q.id}: text fehlt oder ist leer`);
    } else if (!q.text.trim().endsWith("?")) {
      errors.push(`Frage id=${q.id}: text ist keine Frage (endet nicht auf '?')`);
    }
    if (typeof q.context !== "string" || q.context.trim() === "") {
      errors.push(`Frage id=${q.id}: context (Bibelstelle) fehlt oder ist leer`);
    }
  }

  if (new Set(ids).size !== ids.length) {
    errors.push(`Fragen-IDs sind nicht eindeutig: [${ids.join(", ")}]`);
  }

  for (const exp of EXPECTED) {
    const q = data.questions.find((x) => x.id === exp.id);
    if (!q) {
      errors.push(`kanonische Frage id=${exp.id} fehlt`);
      continue;
    }
    if (typeof q.context !== "string" || !q.context.includes(exp.scripture)) {
      errors.push(
        `Frage id=${exp.id}: erwartete Bibelstelle "${exp.scripture}" nicht im context gefunden`
      );
    }
  }
}

// --- 3a. SSOT-Verdrahtung im Web-Spiel -------------------------------------
let constantsSrc;
try {
  constantsSrc = readFileSync(CONSTANTS_PATH, "utf8");
} catch (e) {
  console.error(`FEHLER: constants.ts nicht lesbar: ${e.message}`);
  process.exit(1);
}

// Den importierten Bezeichner einfangen und den QUESTIONS-Re-Export an GENAU
// diesen binden. Sonst würde ein ungenutzter Import + `QUESTIONS = fake.questions`
// (inline hartcodierte Kopie) durchrutschen — die zwei Prüfungen dürfen nicht
// unabhängig sein.
const importMatch = constantsSrc.match(
  /import\s+(\w+)\s+from\s+['"][^'"]*theology_questions\.json['"]/
);

if (!importMatch) {
  errors.push(
    "constants.ts importiert theology_questions.json nicht mehr — SSOT-Verdrahtung gebrochen (Web-Spiel würde von Godot divergieren)"
  );
} else {
  const importedId = importMatch[1]; // reine \w+-Zeichen, sicher als Regex-Literal
  const reExportRe = new RegExp(
    `QUESTIONS\\s*:\\s*Question\\[\\]\\s*=\\s*${importedId}\\.questions`
  );
  if (!reExportRe.test(constantsSrc)) {
    errors.push(
      `constants.ts re-exportiert QUESTIONS nicht direkt aus dem theology_questions.json-Import (${importedId}.questions) — mögliche inline hartcodierte Kopie (Risk #6)`
    );
  }
}

// --- 3b. SSOT-Verdrahtung im Godot-Spiel -----------------------------------
// Das Gate soll BEIDE Seiten absichern. res://resources/theology/... entspricht
// physisch game/resources/theology/... — also derselben JSON wie im Web.
const AUTOLOAD_PATH = path.join(repoRoot, "game", "scripts", "autoload", "theology_data.gd");
let autoloadSrc = "";
try {
  autoloadSrc = readFileSync(AUTOLOAD_PATH, "utf8");
} catch (e) {
  errors.push(`Godot-Autoload theology_data.gd nicht lesbar: ${e.message}`);
}
// Konkret die `const PATH := "..."`-Zuweisung prüfen (nicht bloß irgendeine
// Erwähnung des Pfads in einem Kommentar) — sonst bliebe ein geänderter const
// bei belassenem Doc-Kommentar unentdeckt.
const godotPathAssign = /const\s+PATH\s*:=\s*["']res:\/\/resources\/theology\/theology_questions\.json["']/;
if (autoloadSrc && !godotPathAssign.test(autoloadSrc)) {
  errors.push(
    "game/scripts/autoload/theology_data.gd: const PATH zeigt nicht mehr auf res://resources/theology/theology_questions.json — Godot würde von der Web-Quelle divergieren (Risk #6)"
  );
}

// --- Ergebnis --------------------------------------------------------------
if (errors.length > 0) {
  console.error("Theologie-SSOT-Check FEHLGESCHLAGEN:");
  for (const e of errors) console.error("  - " + e);
  console.error(`\nSingle Source of Truth: ${path.relative(repoRoot, JSON_PATH)}`);
  process.exit(1);
}

console.log(
  `Theologie-SSOT-Check OK: ${data.questions.length} Fragen konsistent; ` +
    `constants.ts (Web) und TheologyData (Godot) lesen dieselbe Quelle ` +
    `${path.relative(repoRoot, JSON_PATH)}.`
);
process.exit(0);
