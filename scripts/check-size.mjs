import {execFileSync} from 'node:child_process';import {statSync} from 'node:fs';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const oversized=files.map(file=>({file,bytes:statSync(file).size})).filter(({file,bytes})=>bytes>(file.endsWith('.mp4')?90:5)*1024*1024);
if(oversized.length){for(const f of oversized)console.error(`${f.file}: ${f.bytes} bytes exceeds budget`);process.exit(1)}
console.log('Tracked assets fit the 5 MB file budget and 90 MB video budget.');
