// Vice Cover Maker entry program: hand the app in by copying app/ and
// screenshots/ into the output directory and writing dossier.json there.
// Both runs write identical bytes: copies are byte-preserving and the
// dossier library is deterministic, with no timestamps or randomness here.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = import.meta.dirname;
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function requireEntryFile(relativePath: string): void {
  if (!existsSync(join(repoRoot, relativePath))) {
    throw new Error(`Vice Cover Maker: missing required entry file ${relativePath}`);
  }
}

function copyEntryTree(relativePath: string): void {
  cpSync(join(repoRoot, relativePath), join(outputDir, relativePath), { recursive: true });
}

requireEntryFile('app/index.html');
requireEntryFile('screenshots');

mkdirSync(outputDir, { recursive: true });
copyEntryTree('app');
copyEntryTree('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
