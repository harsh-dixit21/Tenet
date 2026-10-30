import {createContext,useContext,useState,useRef,type ReactNode} from 'react';
import {records as samples,readDemoUser,type Role} from '../ui/app-1-utils/app-1-data';
export type Status='Draft'|'Awaiting verification'|'Discrepancy'|'Verified'|'Release requested'|'Released'|'Refunded'|'Discharged'|'Renewed'|'Replaced';
export type DocumentItem={id:string;name:string;kind:string;version:number;date:string;data:string;size:number};
export type Instrument={id:string;institution:string;bank:string;branch:string;number:string;amount:number;issued:string;maturity:string;status:Status;docs:DocumentItem[];evidence?:{source:string;reference:string;date:string;note:string};correction?:string;parent?:string;relation?:'Renewal'|'Replacement'};
export type RequestItem={id:string;recordId:string;type:'Release'|'Refund'|'Discharge';reason:string;status:'Pending'|'Approved'|'Rejected';date:string;decision?:string};
export type EventItem={id:string;recordId:string;action:string;actor:Role;date:string};
type State={version:1;records:Instrument[];requests:RequestItem[];events:EventItem[];settings:{reminderDays:number;escalationDays:number};readAlerts:string[]};
export const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export const terminal=(r:Instrument)=>['Released','Refunded','Discharged','Renewed','Replaced'].includes(r.status);
export const days=(s:string)=>Math.ceil((Date.parse(s)-Date.parse(today()))/86400000);
const key='tenet-workspace-v1';
const uid=()=>crypto.randomUUID();
function seed():State{return {version:1,records:samples.map((r,i)=>({id:r.id,institution:r.institution,bank:r.bank,branch:'Demo branch',number:`DEMO-${10001+i}`,amount:r.amount,issued:'2026-07-01',maturity:r.maturity,status:r.status,docs:Array.from({length:r.documents},(_,j)=>({id:uid(),name:`${['Instrument copy','Bank letter','Institution declaration','Approval letter','Supporting note'][j]}.txt`,kind:['Instrument copy','Bank letter','Declaration','Approval letter','Other'][j],version:1,date:'2026-10-24',data:'data:text/plain;charset=utf-8,'+encodeURIComponent(`TENET SAMPLE DOCUMENT\n${r.id}\nSynthetic document for workflow demonstration.`),size:120})),...(['Verified','Release requested'].includes(r.status)?{evidence:{source:'Sample manual bank confirmation',reference:'DEMO-EVIDENCE-'+(i+1),date:'2026-10-24',note:'Synthetic evidence only; not connected to a bank.'}}:{}),...(r.status==='Discrepancy'?{correction:'Please confirm the maturity date against the instrument copy.'}:{})})),requests:[{id:'REQ-DEMO-001',recordId:samples[4].id,type:'Release',reason:'Instrument has matured; request authorized review.',status:'Pending',date:'2026-10-25'}],events:samples.map(r=>({id:uid(),recordId:r.id,action:`Sample record loaded · ${r.status}`,actor:'Reviewer',date:'2026-10-24T09:00:00.000Z'})),settings:{reminderDays:30,escalationDays:7},readAlerts:[]}}
function load():State{try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s?.version===1&&Array.isArray(s.records)&&Array.isArray(s.requests)&&Array.isArray(s.events)&&s.settings&&Array.isArray(s.readAlerts))return s}catch{}return seed()}
type ContextValue={state:State;role:Role;setRole:(r:Role)=>void;notice:string;notify:(s:string)=>void;commit:(fn:(s:State)=>void)=>boolean;event:(s:State,id:string,action:string)=>void;reset:()=>void};
const Context=createContext<ContextValue|null>(null);
export function WorkspaceProvider({children}:{children:ReactNode}){const[state,setState]=useState(load),[role,changeRole]=useState<Role>(readDemoUser().role),[notice,notify]=useState('');const ref=useRef(state);ref.current=state;
function commit(fn:(s:State)=>void){try{const next=structuredClone(ref.current);fn(next);localStorage.setItem(key,JSON.stringify(next));ref.current=next;setState(next);notify('Changes saved in this browser.');return true}catch(error){notify(error instanceof Error&&error.message!=='QuotaExceededError'?error.message:'Storage is full. Remove a document or use smaller files.');return false}}
function event(s:State,id:string,action:string){s.events.unshift({id:uid(),recordId:id,action,actor:role,date:new Date().toISOString()})}
function setRole(r:Role){changeRole(r);try{sessionStorage.setItem('tenet-demo-user',JSON.stringify({...readDemoUser(),role:r}))}catch{}notify(`Demo role changed to ${r}.`)}
function reset(){const s=seed();try{localStorage.setItem(key,JSON.stringify(s));ref.current=s;setState(s);notify('Sample workspace restored.')}catch{notify('Unable to reset browser storage.')}}
return <Context.Provider value={{state,role,setRole,notice,notify,commit,event,reset}}>{children}</Context.Provider>}
export function useWorkspace(){const s=useContext(Context);if(!s)throw new Error('Workspace provider required');return s}
export function download(name:string,data:string,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function csv(rows:(string|number)[][]){return rows.map(row=>row.map(v=>'"'+String(v).replace(/^[=+@\-]/,"'$&").replaceAll('"','""')+'"').join(',')).join('\r\n')}
