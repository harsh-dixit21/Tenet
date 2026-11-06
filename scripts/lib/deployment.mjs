import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseEnv, validateFirebaseEnv} from './env.mjs';

export function validateDeployment(root, project) {
  if (!project || !/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project) || project.startsWith('demo-')) throw new Error('Pass a real Firebase project ID: npm run check:deploy -- project-id');
  const config = JSON.parse(readFileSync(resolve(root, 'firebase.json'), 'utf8'));
  for (const file of [config.firestore.rules, config.firestore.indexes, config.storage.rules, 'functions/.env']) {
    if (!existsSync(resolve(root, file))) throw new Error(`Missing ${file}`);
  }
  const backend = parseEnv(readFileSync(resolve(root, 'functions/.env'), 'utf8'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(backend.INITIAL_ADMIN_EMAIL || '')) throw new Error('Set INITIAL_ADMIN_EMAIL in functions/.env');
  if (backend.TENET_ENFORCE_APP_CHECK !== 'true') throw new Error('Set TENET_ENFORCE_APP_CHECK=true for production');
}
