import type {Instrument,DocumentItem,RequestItem} from '@/components/workspace/store';
const terminalStatuses=new Set(['Released','Refunded','Discharged','Renewed','Replaced']);
const requiredKinds=['Instrument copy','Bank letter','Declaration'];
const currentDay=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export function byteSize(bytes:number){if(!Number.isFinite(bytes)||bytes<0)return 'Unknown size';if(bytes<1024)return `${bytes} B`;if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;return `${(bytes/1024/1024).toFixed(1)} MB`;}
