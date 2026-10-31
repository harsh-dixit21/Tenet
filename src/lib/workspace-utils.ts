import type {Instrument,DocumentItem,RequestItem} from '@/components/workspace/store';
const terminalStatuses=new Set(['Released','Refunded','Discharged','Renewed','Replaced']);
const requiredKinds=['Instrument copy','Bank letter','Declaration'];
const currentDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export function byteSize(bytes:number){if(!Number.isFinite(bytes)||bytes<0)return 'Unknown size';if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/1024/1024).toFixed(1)} MB`;}
export function latestDocuments(docs:DocumentItem[]){return docs.filter(d=>!docs.some(other=>other.kind===d.kind&&other.version>d.version));}
export function missingDocuments(record:Instrument){return requiredKinds.filter(kind=>!latestDocuments(record.docs).some(d=>d.kind===kind));}
export function completeness(record:Instrument){return Math.round((requiredKinds.length-missingDocuments(record).length)/requiredKinds.length*100);}
export function activeDeposits(records:Instrument[]){return records.filter(r=>r.status!=='Draft'&&!terminalStatuses.has(r.status));}
