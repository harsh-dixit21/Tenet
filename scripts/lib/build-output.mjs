import {readFileSync, existsSync, statSync, realpathSync} from 'node:fs';
import {resolve, relative, isAbsolute, dirname} from 'node:path';

function assertInside(root, target) {
  const rel = relative(realpathSync(root), target);
  if (rel === '..' || rel.startsWith('../') || rel.startsWith('..\\') || isAbsolute(rel)) throw new Error('Built asset escapes the dist directory');
}

export function validateBuild(root = 'dist') {
  for (const entry of ['index.html', 'portal/index.html']) {
    const entryPath = resolve(root, entry);
    if (!existsSync(entryPath)) throw new Error(`Missing build entry: ${entry}. Run npm run build first.`);
    const html = readFileSync(entryPath, 'utf8');
    if (!/<title\b[^>]*>[^<]*\bTenet\b[^<]*<\/title\s*>/i.test(html)) throw new Error(`Missing Tenet page title in ${entry}`);
    // Inspect resource tags only: navigation links and external URLs are not build artifacts.
    const resources = [...html.matchAll(/<(script|link|img|source|video|audio)\b[^>]*>/gi)].flatMap(([tag, kind]) => {
      if (kind.toLowerCase() === 'link' && !/\brel\s*=\s*(["'])(?:stylesheet|icon|preload|modulepreload)\1/i.test(tag)) return [];
      return [...tag.matchAll(/\b(?:src|href|poster)\s*=\s*(["'])([^"']+)\1/gi)].map(match => match[2]);
    });
    for (const resource of resources) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(resource)) continue;
      const reference = decodeURIComponent(resource.split(/[?#]/)[0]);
      if (!reference) continue;
      const path = reference.startsWith('/') ? resolve(root, '.' + reference) : resolve(dirname(entryPath), reference);
      assertInside(root, path);
      if (!existsSync(path)) throw new Error(`Missing built asset: ${reference}`);
      assertInside(root, realpathSync(path));
      if (!statSync(path).isFile() || statSync(path).size === 0) throw new Error(`Built asset is not a nonempty file: ${reference}`);
    }
  }
  const video = resolve(root, 'assets/tenet-background.mp4');
  if (!existsSync(video) || statSync(video).size < 1024) throw new Error('Background video is missing or empty');
}
