import {readFileSync,existsSync,statSync} from 'node:fs';import {resolve} from 'node:path';
for(const entry of ['index.html','portal/index.html']){const html=readFileSync('dist/'+entry,'utf8');if(!html.includes('Tenet'))throw new Error(`Missing title in ${entry}`);for(const match of html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)/g)){const path=resolve('dist','.'+match[1]);if(!existsSync(path))throw new Error(`Missing built asset: ${match[1]}`)}}
if(statSync('dist/assets/tenet-background.mp4').size<1024)throw new Error('Background video is empty');
console.log('Both entry points and their referenced local assets are present.');
