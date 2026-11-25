// Sizzle & Serve — the hand-in program (Node 22, standard library only).
//
// The game lives in game/ as plain static files a desktop browser loads
// offline, and its screenshots live in screenshots/. This program copies
// both into /output and writes /output/dossier.json, the summary the judge
// reads, using the vendored make.fun library. It runs twice in the grader
// and must write the same bytes both times, so it does nothing time- or
// random-dependent: a straight copy plus a deterministic dossier.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(repoRoot, 'screenshots');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps, from the kit's gate: at most 4 screenshots of at
// most 256 KiB each; game/ at most 993 entries and 48 MiB in all, no path
// over 1000 bytes; the dossier's text capped at 160 KiB.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
