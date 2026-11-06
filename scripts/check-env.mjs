import {readFileSync} from 'node:fs';
import {parseEnv, validateFirebaseEnv} from './lib/env.mjs';

try {
  const entries = parseEnv(readFileSync(process.argv[2] || '.env.local', 'utf8'));
  const errors = validateFirebaseEnv(entries);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Firebase environment fields are valid. Values were not printed; connectivity is not verified.');
} catch (error) {
  console.error(error.code === 'ENOENT' ? 'Missing environment file. Copy .env.example to .env.local and configure Firebase.' : error.message);
  process.exitCode = 1;
}
