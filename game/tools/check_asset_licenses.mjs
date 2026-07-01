#!/usr/bin/env node
// check_asset_licenses.mjs
// ---------------------------------------------------------------------------
// CI-License-Gate (Issue #28, adressiert Risk #7).
//
// Stellt sicher, dass KEIN un-auditiertes Modell/Audio unbemerkt nach
// game/assets/ gelangt: jede Modell-/Audio-Datei unter game/assets/** muss als
// Eintrag (per res://-Pfad) im maschinenlesbaren Katalog
//   game/resources/asset_catalog/asset_catalog.json
// geführt sein. Der Katalog wird ausschließlich aus dem Lizenz-Audit
// (docs/assets/asset-decision-register.csv, nur APPROVED/APPROVED_WITH_ATTRIBUTION)
// via game/tools/generate_asset_catalog.mjs erzeugt.
//
// Nicht-Katalog-Dateien (Texturen, .bin, .mtl, .import, Doku) sind Abhängigkeiten
// der Modelle, keine eigenständigen Katalogeinträge, und werden ignoriert.
//
// Exit 1 + Liste, falls un-katalogisierte Modelle/Audio gefunden werden.
// Warnung (kein Fehler) für Katalogeinträge, deren Datei fehlt.
// Exit 0 + Erfolgsmeldung sonst.
//
// Aufruf: node game/tools/check_asset_licenses.mjs
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS = path.join(ROOT, 'game', 'assets');
const CATALOG = path.join(ROOT, 'game', 'resources', 'asset_catalog', 'asset_catalog.json');

// Katalogpflichtige Datei-Endungen (Modelle + Audio).
const CATALOGED_EXT = /\.(glb|gltf|obj|ogg|mp3|wav)$/i;

// Relativpfad (game/assets/…) -> res://-Pfad, wie im Katalog geführt.
function toResPath(relFromAssets) {
  return `res://assets/${relFromAssets.split(path.sep).join('/')}`;
}

// game/assets/** rekursiv nach katalogpflichtigen Dateien absuchen.
function walkAssets(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAssets(abs, acc);
    } else if (entry.isFile() && CATALOGED_EXT.test(entry.name)) {
      acc.push(path.relative(ASSETS, abs));
    }
  }
  return acc;
}

if (!fs.existsSync(ASSETS)) {
  console.error(`[license-gate] FEHLER: Asset-Verzeichnis fehlt: ${ASSETS}`);
  process.exit(1);
}
if (!fs.existsSync(CATALOG)) {
  console.error(`[license-gate] FEHLER: Asset-Katalog fehlt: ${CATALOG}`);
  console.error(`[license-gate] Katalog erzeugen: node game/tools/generate_asset_catalog.mjs`);
  process.exit(1);
}

let catalog;
try {
  catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
} catch (err) {
  console.error(`[license-gate] FEHLER: Katalog nicht parsebar: ${err.message}`);
  process.exit(1);
}
const entries = (catalog && Array.isArray(catalog.assets)) ? catalog.assets : [];
const cataloguedPaths = new Set(
  entries.filter(a => a && typeof a === 'object' && a.path).map(a => String(a.path))
);

// 1) Jede katalogpflichtige Datei muss im Katalog stehen.
const onDisk = walkAssets(ASSETS).sort();
const uncatalogued = onDisk.filter(rel => !cataloguedPaths.has(toResPath(rel)));

// 2) Warnung: Katalogeintrag, dessen Datei fehlt (kein Fehler).
const missing = [];
for (const a of entries) {
  if (!a || typeof a !== 'object' || !a.path) continue;
  const p = String(a.path);
  if (!p.startsWith('res://assets/')) continue;
  const abs = path.join(ASSETS, p.slice('res://assets/'.length));
  if (!fs.existsSync(abs)) missing.push(p);
}

if (missing.length > 0) {
  console.warn(`[license-gate] WARNUNG: ${missing.length} Katalogeintrag/-einträge ohne Datei im Projekt:`);
  for (const p of missing) console.warn(`  - ${p}`);
}

if (uncatalogued.length > 0) {
  console.error(`[license-gate] FEHLER: ${uncatalogued.length} un-katalogisierte(s) Modell/Audio unter game/assets/:`);
  for (const rel of uncatalogued) console.error(`  - ${toResPath(rel)}`);
  console.error('');
  console.error('[license-gate] Jede solche Datei muss zuerst den Lizenz-Freigabeprozess durchlaufen:');
  console.error('[license-gate]   docs/contributing/asset-license-checklist.md');
  console.error('[license-gate] und danach über game/tools/generate_asset_catalog.mjs in den Katalog aufgenommen werden.');
  process.exit(1);
}

console.log(`[license-gate] OK: alle ${onDisk.length} Modell-/Audio-Dateien unter game/assets/ sind katalogisiert (${entries.length} Katalogeinträge).`);
process.exit(0);
