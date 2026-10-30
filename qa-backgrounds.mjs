import {Browser,sleep} from 'file:///C:/Users/HARSH%20DIXIT/.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import {createServer} from 'node:http';import {readFileSync,writeFileSync} from 'node:fs';import {resolve,extname} from 'node:path';
const root=resolve('dist');const server=createServer((req,res)=>{try{let p=new URL(req.url,'http://x').pathname;if(p.endsWith('/'))p+='index.html';const file=resolve(root,'.'+p);if(!file.startsWith(root))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file))}catch{res.writeHead(404);res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;const browser=await Browser.launch();const result={};
try {
for (const reduced of [false,true]) {
const page=await browser.newPage();await page.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:reduced?'reduce':'no-preference'}]});await page.goto(origin,{settleMs:1000});
const video=()=>page.eval(()=>{const v=document.querySelector('video');return {frames:v.getVideoPlaybackQuality().totalVideoFrames,paused:v.paused,source:v.currentSrc,error:v.error?.message}});
const a=await video();await sleep(1400);const b=await video();result['video-'+reduced]={moving:b.frames>a.frames,...b};
await page.goto(origin+'/portal/#auth',{settleMs:700});
for(const width of [1440,390]) {
await page.setViewport({width,height:900,mobile:width<500});await sleep(100);
const paths=()=>page.eval(()=>{const fields=[...document.querySelectorAll('.auth-path-field')].filter(p=>p.getBoundingClientRect().width>0);const f=fields.at(-1),p=f?.querySelector('path');return {transform:f&&getComputedStyle(f).transform,dash:p&&getComputedStyle(p).strokeDashoffset,overflow:document.documentElement.scrollWidth>innerWidth}});
const c=await paths();await sleep(800);const d=await paths();result['auth-'+reduced+'-'+width]={moving:c.dash!==d.dash,depth:c.transform!==d.transform,overflow:d.overflow};
if(reduced)await page.screenshot({path:'qa/fixed-auth-'+width+'.jpg'});
}
result['errors-'+reduced]=page.consoleErrors;await page.close();
}
console.log(JSON.stringify(result));writeFileSync('qa/background-checks.json',JSON.stringify(result,null,2));if(Object.values(result).some(r=>r.moving===false||r.depth===false||r.overflow===true))process.exitCode=1;
}finally{await browser.close();server.close()}
