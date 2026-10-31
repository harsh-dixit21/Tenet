import {readFileSync,existsSync} from 'node:fs';
const file=process.argv[2]||'.env.local';
if(!existsSync(file)){console.error('Missing environment file. Copy .env.example to .env.local and configure Firebase.');process.exit(1)}
const entries=Object.fromEntries(readFileSync(file,'utf8').split(/\r?\n/).filter(s=>s.trim()&&!s.trim().startsWith('#')).map(line=>{const i=line.indexOf('=');return [line.slice(0,i).trim(),line.slice(i+1).trim().replace(/^(["'])(.*)\1$/,'$2')]}));
const required=['API_KEY','AUTH_DOMAIN','PROJECT_ID','STORAGE_BUCKET','MESSAGING_SENDER_ID','APP_ID'].map(k=>'VITE_FIREBASE_'+k);
const errors=required.filter(k=>!entries[k]).map(k=>`${k} is required`);
if(entries.VITE_FIREBASE_PROJECT_ID?.startsWith('demo-')&&entries.VITE_FIREBASE_USE_EMULATORS!=='true')errors.push('Demo projects require emulator mode');
if(entries.VITE_FIREBASE_USE_EMULATORS!=='true'&&!entries.VITE_FIREBASE_APPCHECK_SITE_KEY)errors.push('Production requires the App Check site key');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Firebase environment fields are present. Values were not printed; connectivity is not verified.');
