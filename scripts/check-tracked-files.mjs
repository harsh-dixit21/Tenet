import {execFileSync} from 'node:child_process';
import {readFileSync,statSync} from 'node:fs';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const forbidden=files.filter(f=>/(^|\/)(\.env(\..*)?|service-account[^/]*\.json|[^/]*-adminsdk-[^/]*\.json)$/.test(f)&&!f.endsWith('.env.example'));
for(const file of files){if(statSync(file).size>2e6)continue;const text=readFileSync(file,'utf8');if(/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/.test(text))forbidden.push(file+' (private key)')}
if(forbidden.length){console.error(forbidden.join('\n'));process.exit(1)}
console.log('No tracked environment credentials or private keys detected. This is a targeted check, not a comprehensive secret scanner.');
