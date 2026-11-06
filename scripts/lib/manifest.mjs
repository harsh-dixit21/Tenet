import {readdirSync, createReadStream} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';

export async function buildManifest(root, commit) {
  function walk(dir, prefix = '') {
    return readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
      const path = prefix + entry.name;
      return entry.isDirectory() ? walk(join(dir, entry.name), path + '/') : [path];
    }).sort();
  }
  const files = [];
  for (const path of walk(root)) {
    const hash = createHash('sha256');
    let bytes = 0;
    for await (const chunk of createReadStream(join(root, path))) {
      bytes += chunk.length;
      hash.update(chunk);
    }
    files.push({path, bytes, sha256: hash.digest('hex')});
  }
  return {commit, files};
}
