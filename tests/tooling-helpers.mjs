import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';

export function sandbox(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'tenet-tools-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const put = (path, content) => {
    const target = join(root, path);
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, content);
  };
  for (const [path, content] of Object.entries(files)) put(path, content);
  return {root, put};
}
