import {readFileSync, existsSync, realpathSync, statSync} from 'node:fs';
import {resolve, relative, isAbsolute} from 'node:path';
import {parseEnv, validateFirebaseEnv} from './env.mjs';

function localFile(root, file) {
  if (typeof file !== 'string' || !file || isAbsolute(file)) throw new Error('Configuration paths must be relative files inside the checkout');
  const target = resolve(root, file);
  const inside = path => { const rel = relative(realpathSync(root), path); return rel !== '..' && !rel.startsWith('..\\') && !rel.startsWith('../') && !isAbsolute(rel); };
  if (!inside(target)) throw new Error('Configuration path escapes the checkout');
  if (!existsSync(target)) throw new Error(`Missing ${file}`);
  if (!inside(realpathSync(target)) || !statSync(target).isFile()) throw new Error('Configuration paths must resolve to files inside the checkout');
  return target;
}

export function validateDeployment(root, project) {
  if (!project || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project) || project.startsWith('demo-')) throw new Error('Pass a real Firebase project ID: npm run check:deploy -- project-id');
  const config = JSON.parse(readFileSync(resolve(root, 'firebase.json'), 'utf8'));
  for (const file of [config.firestore.rules, config.firestore.indexes, config.storage.rules, 'functions/.env']) {
    localFile(root, file);
  }
  const backend = parseEnv(readFileSync(resolve(root, 'functions/.env'), 'utf8'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(backend.INITIAL_ADMIN_EMAIL || '')) throw new Error('Set INITIAL_ADMIN_EMAIL in functions/.env');
  if (backend.TENET_ENFORCE_APP_CHECK !== 'true') throw new Error('Set TENET_ENFORCE_APP_CHECK=true for production');
}
