import {readdirSync,readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]).sort()}
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
console.log(JSON.stringify({commit,files:walk('dist').map(file=>{const bytes=readFileSync(file);return {path:file.slice(5),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}})},null,2));
