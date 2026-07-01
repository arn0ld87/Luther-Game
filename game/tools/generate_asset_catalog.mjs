#!/usr/bin/env node
// generate_asset_catalog.mjs
// ---------------------------------------------------------------------------
// Erzeugt reproduzierbar aus dem integrierten Asset-Bestand:
//   - game/resources/asset_catalog/asset_catalog.json   (maschinenlesbarer Katalog)
//   - game/assets/**/SOURCE.md                           (Herkunft je Pack)
//   - game/assets/licenses/README.md + CC0-Lizenzkopien
//
// Lizenzdaten stammen aus dem Audit (Issue #10): docs/assets/asset-decision-register.csv.
// Nur APPROVED / APPROVED_WITH_ATTRIBUTION werden geführt.
//
// Aufruf: node game/tools/generate_asset_catalog.mjs
// ---------------------------------------------------------------------------
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS = path.join(ROOT, 'game', 'assets');
const CATALOG_DIR = path.join(ROOT, 'game', 'resources', 'asset_catalog');

const MODEL_EXT = /\.(glb|gltf|obj)$/i;
const AUDIO_EXT = /\.(ogg|mp3|wav)$/i;

// Pack-Defaults (dir relativ zu game/assets). status immer approved/approved_with_attribution.
const PACKS = [
  { dir: 'third_party/kenney/castle-kit',            pack: 'Kenney Castle Kit',                    license: 'CC0-1.0', attribution: false, author: 'Kenney', source: 'https://kenney.nl/assets/castle-kit', use: 'Wittenberg-Stadtmauer, Befestigungen, Belagerungsgerät' },
  { dir: 'buildings/kenney_castle-kit',              pack: 'Kenney Castle Kit',                    license: 'CC0-1.0', attribution: false, author: 'Kenney', source: 'https://kenney.nl/assets/castle-kit', use: 'Gebäude-/Mauer-Bausteine (Stadtmauer-Prototyp)', idPrefix: 'buildings' },
  { dir: 'third_party/quaternius/medieval-village',  pack: 'Quaternius Medieval Village MegaKit',   license: 'CC0-1.0', attribution: false, author: '@Quaternius', source: 'https://quaternius.com/packs/medievalvillagemegakit.html', use: 'Modularer Stadt-/Häuseraufbau (Türen, Fenster, Treppen, Ranken)' },
  { dir: 'third_party/kaykit/medieval-hexagon',      pack: 'KayKit Medieval Hexagon Pack',         license: 'CC0-1.0', attribution: false, author: 'Kay Lousberg', source: 'https://kaylousberg.itch.io/kaykit-medieval-hexagon', use: 'Props/Tiles, zusätzliche Gebäudevarianten' },
  { dir: 'third_party/opengameart/knight',           pack: 'Quaternius Knight Character',          license: 'CC0-1.0', attribution: false, author: 'quaternius', source: 'https://opengameart.org/content/lowpoly-animated-knight', use: 'Guard-Enemy' },
  { dir: 'third_party/opengameart/rpg-characters',   pack: 'Quaternius LowPoly RPG Characters',    license: 'CC0-1.0', attribution: false, author: '@Quaternius', source: 'https://opengameart.org/content/lowpoly-rpg-characters', use: 'NPCs, Tetzel, Indulgence Seller, Mönch (Luther-Platzhalter)' },
  { dir: 'third_party/polypizza',                    pack: 'Poly.Pizza (gemischt CC-BY/CC0)',      license: 'CC-BY-3.0', attribution: true, author: 'Poly by Google / Bruno Oliveira / Quaternius', source: 'https://poly.pizza', use: 'Markante Einzelgebäude (Kirche, Kathedrale, Tor)' },
  { dir: 'audio/sfx/kenney-impact',                  pack: 'Kenney Impact Sounds',                 license: 'CC0-1.0', attribution: false, author: 'Kenney', source: 'https://kenney.nl/assets/impact-sounds', use: 'Combat-Treffer' },
  { dir: 'audio/sfx/kenney-rpg',                     pack: 'Kenney RPG Audio',                     license: 'CC0-1.0', attribution: false, author: 'Kenney', source: 'https://kenney.nl/assets/rpg-audio', use: 'Foley, Bewegung, Inventar' },
  { dir: 'audio/sfx/kenney-ui',                      pack: 'Kenney UI Audio',                      license: 'CC0-1.0', attribution: false, author: 'Kenney', source: 'https://kenney.nl/assets/ui-audio', use: 'Menü/HUD' },
  { dir: 'audio/sfx/oga-sword',                      pack: 'StarNinjas Sword Sounds',              license: 'CC0-1.0', attribution: false, author: 'StarNinjas', source: 'https://opengameart.org/content/20-sword-sound-effects-attacks-and-clashes', use: 'Bossfight / Combat' },
  { dir: 'audio/music',                              pack: 'OpenGameArt CC0 Music',                license: 'CC0-1.0', attribution: false, author: 'cynicmusic / Wolfgang_', source: 'https://opengameart.org', use: 'Ambiente / Kampf' },
];

// Datei-Level-Overrides (CC-BY-Attribution je poly.pizza-Modell; Musik-Autoren).
const OVERRIDES = {
  'third_party/polypizza/church.glb':          { license: 'CC-BY-3.0', attribution: true,  author: 'Poly by Google',  source: 'https://poly.pizza/m/0Oe72PEPCK6', attribution_text: '"Church" by Poly by Google, CC-BY 3.0 (via poly.pizza)' },
  'third_party/polypizza/temple.glb':          { license: 'CC0-1.0',   attribution: false, author: 'Quaternius',       source: 'https://poly.pizza/m/JsZnPztvRl' },
  'third_party/polypizza/gothic/Cathedral.glb':{ license: 'CC-BY-3.0', attribution: true,  author: 'Bruno Oliveira',   source: 'https://poly.pizza/m/fEJKTKNRAsN', attribution_text: '"Cathedral" by Bruno Oliveira, CC-BY 3.0 (via poly.pizza)' },
  'third_party/polypizza/gothic/Castle.glb':   { license: 'CC-BY-3.0', attribution: true,  author: 'Poly by Google',  source: 'https://poly.pizza/m/aG0AF5d-zbY', attribution_text: '"Castle" by Poly by Google, CC-BY 3.0 (via poly.pizza)' },
  'third_party/polypizza/gothic/Cemetary.glb': { license: 'CC-BY-3.0', attribution: true,  author: 'Poly by Google',  source: 'https://poly.pizza/m/c5L6hAdX3ua', attribution_text: '"Cemetary" by Poly by Google, CC-BY 3.0 (via poly.pizza)' },
  'third_party/polypizza/gothic/Gate.glb':     { license: 'CC-BY-3.0', attribution: true,  author: 'Poly by Google',  source: 'https://poly.pizza/m/711AlCsueib', attribution_text: '"Gate" by Poly by Google, CC-BY 3.0 (via poly.pizza)' },
  'third_party/polypizza/gothic/Archway.glb':  { license: 'CC-BY-3.0', attribution: true,  author: 'Poly by Google',  source: 'https://poly.pizza/m/d6lqRR2TU0i', attribution_text: '"Archway" by Poly by Google, CC-BY 3.0 (via poly.pizza)' },
  'audio/music/TownTheme.mp3':                 { license: 'CC0-1.0',   attribution: false, author: 'cynicmusic',       source: 'https://opengameart.org/content/town-theme-rpg' },
  'audio/music/BattleTheme.mp3':               { license: 'CC0-1.0',   attribution: false, author: 'Wolfgang_',        source: 'https://opengameart.org/content/battle-theme-0' },
};

function listFiles(dir, re) {
  const abs = path.join(ASSETS, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(f => re.test(f)).sort();
}
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }

const catalog = [];
for (const p of PACKS) {
  const isAudio = p.dir.startsWith('audio/');
  const re = isAudio ? AUDIO_EXT : MODEL_EXT;
  // Modelle: nur Top-Level; Sonderfall polypizza hat Unterordner gothic/
  let rels = listFiles(p.dir, re).map(f => `${p.dir}/${f}`);
  if (p.dir === 'third_party/polypizza') rels = rels.concat(listFiles('third_party/polypizza/gothic', MODEL_EXT).map(f => `third_party/polypizza/gothic/${f}`));
  for (const rel of rels) {
    const ov = OVERRIDES[rel] || {};
    const license = ov.license || p.license;
    const attribution = ov.attribution ?? p.attribution;
    const entry = {
      id: slug(`${p.idPrefix ? p.idPrefix + '_' : ''}${p.pack}_${path.basename(rel)}`),
      pack: p.pack,
      path: `res://assets/${rel}`,
      kind: isAudio ? 'audio' : 'model',
      license,
      attribution_required: !!attribution,
      author: ov.author || p.author,
      source: ov.source || p.source,
      status: attribution ? 'approved_with_attribution' : 'approved',
    };
    if (attribution && ov.attribution_text) entry.attribution_text = ov.attribution_text;
    catalog.push(entry);
  }
}

// asset_catalog.json
fs.mkdirSync(CATALOG_DIR, { recursive: true });
fs.writeFileSync(path.join(CATALOG_DIR, 'asset_catalog.json'),
  JSON.stringify({ generated_from: 'docs/assets/asset-decision-register.csv', audit: 'Issue #10', count: catalog.length, assets: catalog }, null, 2) + '\n');

// SOURCE.md je Pack (Modell-Packs + Audio-Unterordner)
for (const p of PACKS) {
  const abs = path.join(ASSETS, p.dir);
  if (!fs.existsSync(abs)) continue;
  const items = catalog.filter(c => c.path.startsWith(`res://assets/${p.dir}/`));
  const md = `# ${p.pack} — SOURCE\n\n`
    + `- **Quelle:** ${p.source}\n`
    + `- **Autor/Rechteinhaber:** ${p.author}\n`
    + `- **Lizenz:** ${p.license}${p.attribution ? ' — **Attribution Pflicht** (siehe [/ATTRIBUTIONS.md](../../../../ATTRIBUTIONS.md))' : ' — keine Attributionspflicht'}\n`
    + `- **Importdatum:** 2026-07-01\n`
    + `- **Verwendung:** ${p.use}\n`
    + `- **Herkunftsnachweis/Audit:** [docs/assets/asset-license-audit.md](../../../../docs/assets/asset-license-audit.md)\n\n`
    + `> Nur freigegebene (APPROVED / APPROVED_WITH_ATTRIBUTION) Dateien aus dem Audit sind hier enthalten.\n`
    + `> Kopiert reproduzierbar via \`game/tools/stage_approved_assets.mjs\` aus dem git-ignorierten \`godot_assets/\`.\n\n`
    + `## Enthaltene Dateien (${items.length})\n\n`
    + items.map(i => `- \`${path.basename(i.path)}\` — ${i.license}${i.attribution_required ? ` — Attribution: ${i.attribution_text || i.author}` : ''}`).join('\n') + '\n';
  fs.writeFileSync(path.join(abs, 'SOURCE.md'), md);
}

// licenses/: CC0-Lizenzkopien + README
const LIC = path.join(ASSETS, 'licenses');
fs.mkdirSync(LIC, { recursive: true });
const SRC = path.join(ROOT, 'godot_assets');
const CC0_COPIES = [
  ['godot_assets/buildings/kenney_castle-kit/License.txt', 'Kenney_CC0_License.txt'],
  ['godot_assets/buildings/kaykit_medieval-hexagon-pack/KayKit_Medieval_Hexagon_Pack_1.0_FREE/License.txt', 'KayKit_CC0_License.txt'],
  ['godot_assets/buildings/quaternius_medieval-village-megakit/Medieval Village MegaKit[Standard]/License_Standard.txt', 'Quaternius_MegaKit_CC0_License.txt'],
  ['godot_assets/characters/lowpoly-rpg-characters_cc0/RPG Characters - Nov 2020/License.txt', 'Quaternius_RPGCharacters_CC0_License.txt'],
];
let licCopied = 0;
for (const [from, to] of CC0_COPIES) {
  const f = path.join(ROOT, from);
  if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(LIC, to)); licCopied++; }
}
fs.writeFileSync(path.join(LIC, 'README.md'),
  `# Lizenzen — integrierte Drittassets\n\n`
  + `Dieses Verzeichnis enthält Kopien der CC0-Lizenztexte der integrierten Packs.\n`
  + `Die **verbindliche Attribution** für CC-BY-Assets (poly.pizza) steht in der versionierten\n`
  + `Root-Datei [/ATTRIBUTIONS.md](../../../ATTRIBUTIONS.md). Der vollständige Audit mit\n`
  + `Freigabeentscheidungen: [docs/assets/asset-license-audit.md](../../../docs/assets/asset-license-audit.md).\n\n`
  + `- CC0-Assets: Namensnennung nicht erforderlich (Kenney, KayKit, Quaternius, OpenGameArt-CC0-Stücke).\n`
  + `- CC-BY 3.0 (poly.pizza): Namensnennung **Pflicht** — siehe /ATTRIBUTIONS.md.\n`);

console.log(`[catalog] ${catalog.length} Assets im Katalog. SOURCE.md je Pack geschrieben. Lizenzkopien: ${licCopied}.`);
const att = catalog.filter(c => c.attribution_required).length;
console.log(`[catalog] davon attributionspflichtig (CC-BY): ${att}, CC0: ${catalog.length - att}.`);
