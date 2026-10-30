import { mountTechText } from './tech-text.js';
const wordmark = document.querySelector('.wordmark');
try {
  mountTechText(document.querySelector('.tech-text'), {text:'Tenet',fontFamily:'Inter',fontWeight:600,fontSize:150,reveal:'letter',dashLength:4,dashGap:2,specks:15,intro:'none',introDuration:2,clickKick:true,guides:false,sweep:true});
  wordmark.classList.add('canvas-ready');
} catch (error) { console.error('TechText could not start:',error); }
const burger=document.querySelector('.burger'), menu=document.querySelector('.mobile-menu'), overlay=document.querySelector('.menu-overlay');
function setMenu(open, restore=false){burger.setAttribute('aria-expanded',String(open));burger.setAttribute('aria-label',open?'Close menu':'Open menu');menu.hidden=overlay.hidden=!open;document.body.classList.toggle('menu-open',open);if(open)menu.querySelector('a').focus();else if(restore)burger.focus();}
burger.addEventListener('click',()=>setMenu(burger.getAttribute('aria-expanded')!=='true'));
overlay.addEventListener('click',()=>setMenu(false,true));
document.addEventListener('keydown',e=>{if(menu.hidden)return;if(e.key==='Escape')setMenu(false,true);if(e.key==='Tab'){const items=[burger,...menu.querySelectorAll('a')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
window.addEventListener('resize',()=>{if(innerWidth>720)setMenu(false)});
const copy={home:'Every deposit. Every deadline. One record.<br>Manage security deposits and FDRs from submission to authorized release.',product:'Security deposits and FDRs in one place.<br>Keep institution details, bank information and supporting documents together.',workflow:'Submit. Review. Renew. Release.<br>Follow each instrument through verification, maturity and authorized decisions.',roles:'A clear view for every role.<br>Institutions submit. Reviewers verify. Approvers record the decision.'};
function showCopy(){const key=location.hash.slice(1)||'home';document.querySelector('.subhead').innerHTML=copy[key]||copy.home;document.querySelectorAll('.nav a').forEach(a=>{const active=a.hash==='#'+key;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});}
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>setMenu(false,true)));
window.addEventListener('hashchange',showCopy);showCopy();
const video=document.querySelector('video');
// Background motion explicitly requested by the user, including reduced-motion systems.
video.muted=true; video.defaultMuted=true;
function syncVideo(){if(document.hidden)video.pause();else video.play().catch(()=>{document.addEventListener('pointerdown',()=>video.play().catch(()=>{}),{once:true})});}
document.addEventListener('visibilitychange',syncVideo);syncVideo();

video.addEventListener('loadeddata',syncVideo);
window.addEventListener('pageshow',syncVideo);
