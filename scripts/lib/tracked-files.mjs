import {readFileSync, lstatSync} from 'node:fs';
import {resolve} from 'node:path';

export function inspectTrackedFiles(root, files) {
  const errors = [];
  for (const file of files) {
    if (/(^|\/)(node_modules|dist|\.firebase|\.local)(\/|$)/i.test(file)) errors.push(`${file} (generated or local data)`);
    if (/(^|\/)(\.env(?:\..*)?|service-account[^/]*\.json|[^/]*-adminsdk-[^/]*\.json)$/i.test(file) && !/(^|\/)\.env\.example$/.test(file)) errors.push(`${file} (environment credentials)`);
    const path = resolve(root, file);
    let info;
    try { info = lstatSync(path); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      errors.push(`${file} (missing tracked file)`);
      continue;
    }
    if (!info.isFile()) { errors.push(`${file} (not a regular file)`); continue; }
    if (info.size > 2e6) continue;
    if (/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/.test(readFileSync(path, 'utf8'))) errors.push(`${file} (private key)`);
  }
  return errors;
}
