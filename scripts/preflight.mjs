import {readFileSync,existsSync} from 'node:fs';
const project=process.argv[2];
if(!project||!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project)||project.startsWith('demo-')){console.error('Pass a real Firebase project ID: npm run check:deploy -- project-id');process.exit(1)}
const config=JSON.parse(readFileSync('firebase.json','utf8'));
for(const file of [config.firestore.rules,config.firestore.indexes,config.storage.rules,'functions/.env'])if(!existsSync(file))throw new Error(`Missing ${file}`);
const backend=readFileSync('functions/.env','utf8');
if(!/^INITIAL_ADMIN_EMAIL=\S+@\S+$/m.test(backend))throw new Error('Set INITIAL_ADMIN_EMAIL in functions/.env');
if(/^TENET_ENFORCE_APP_CHECK=false\s*$/m.test(backend))throw new Error('Enable App Check for production');
console.log('Local preflight passed. Verify billing, Google provider, authorized domains, App Check and backups in Firebase before deploying. No resources were changed.');
