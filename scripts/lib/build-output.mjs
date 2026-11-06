import {readFileSync, existsSync, statSync} from 'node:fs';
import {resolve} from 'node:path';

export function validateBuild(root = 'dist') {
  for (const entry of ['index.html', 'portal/index.html']) {
    const entryPath = resolve(root, entry);
    if (!existsSync(entryPath)) throw new Error(`Missing build entry: ${entry}. Run npm run build first.`);
    const html = readFileSync(entryPath, 'utf8');
    if (!html.includes('Tenet')) throw new Error(`Missing title in ${entry}`);
    for (const match of html.matchAll(/(?:src|href)\s*=\s*(["'])(\/assets\/[^"']+)\1/gi)) {
      const reference = match[2].split(/[?#]/)[0];
      const path = resolve(root, '.' + reference);
      if (!existsSync(path)) throw new Error(`Missing built asset: ${reference}`);
    }
  }
  const video = resolve(root, 'assets/tenet-background.mp4');
  if (!existsSync(video) || statSync(video).size < 1024) throw new Error('Background video is missing or empty');
}
