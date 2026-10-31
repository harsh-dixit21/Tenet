import type {Instrument,DocumentItem,RequestItem} from '@/components/workspace/store';
const terminalStatuses=new Set(['Released','Refunded','Discharged','Renewed','Replaced']);
const requiredKinds=['Instrument copy','Bank letter','Declaration'];
const currentDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export function byteSize(bytes:number){if(!Number.isFinite(bytes)||bytes<0)return 'Unknown size';if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/1024/1024).toFixed(1)} MB`;}
export function latestDocuments(docs:DocumentItem[]){return docs.filter(d=>!docs.some(other=>other.kind===d.kind&&other.version>d.version));}
export function missingDocuments(record:Instrument){return requiredKinds.filter(kind=>!latestDocuments(record.docs).some(d=>d.kind===kind));}
export function completeness(record:Instrument){return Math.round((requiredKinds.length-missingDocuments(record).length)/requiredKinds.length*100);}
export function activeDeposits(records:Instrument[]){return records.filter(r=>r.status!=='Draft'&&!terminalStatuses.has(r.status));}
export function amountMinor(record:Pick<Instrument,'amount'|'amountMinor'>){const n=record.amountMinor??Math.round(record.amount*100);return Number.isSafeInteger(n)?n:0;}
export function sumDeposits(records:Instrument[]){return records.reduce((total,r)=>total+amountMinor(r),0);}
export function statusSummary(records:Instrument[]){return ['Draft','Awaiting verification','Discrepancy','Verified','Release requested','Released','Refunded','Discharged','Renewed','Replaced'].map(label=>{const rows=records.filter(r=>r.status===label);return {label,count:rows.length,amountMinor:sumDeposits(rows)};});}
export function bankSummary(records:Instrument[]){return [...new Set(records.map(r=>r.bank))].sort().map(label=>{const rows=records.filter(r=>r.bank===label);return {label,count:rows.length,amountMinor:sumDeposits(rows)};});}
export function maturitySummary(records:Instrument[],today=currentDay()){const bounds=[[-Infinity,-1,'Overdue'],[0,7,'Next 7 days'],[8,30,'8–30 days'],[31,90,'31–90 days'],[91,Infinity,'Later']] as const;return bounds.map(([min,max,label])=>{const rows=activeDeposits(records).filter(r=>{const days=Math.ceil((Date.parse(r.maturity)-Date.parse(today))/86400000);return days>=min&&days<=max;});return {label,count:rows.length,amountMinor:sumDeposits(rows)};});}
export function searchMatches(value:string,query:string){const normalize=(s:string)=>s.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase();const text=normalize(value);return normalize(query).trim().split(/\s+/).filter(Boolean).every(token=>text.includes(token));}
export function ageDays(date:string,today=currentDay()){const difference=Math.floor((Date.parse(today)-Date.parse(date.slice(0,10)))/86400000);return Number.isFinite(difference)?Math.max(0,difference):0;}
