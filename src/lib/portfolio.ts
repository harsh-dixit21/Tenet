import type {Instrument, RequestItem, EventItem} from '../components/workspace/store.ts';
export type PortfolioFilters = {query: string; referenceDate?: string; horizon?: '' | 'overdue' | '7' | '30' | '90'; issuedFrom?: string; issuedTo?: string; maturityFrom?: string; maturityTo?: string; maximum?: string; minimum?: string; documents?: '' | 'complete' | 'missing'; activeOnly?: boolean; status?: string; institution?: string; bank?: string};
const closed = new Set(['Released', 'Refunded', 'Discharged', 'Renewed', 'Replaced']);
export const minor = (record: Instrument) => record.amountMinor ?? Math.round(record.amount * 100);
export const totalMinor = (records: Instrument[]) => records.reduce((sum, record) => sum + minor(record), 0);
export const formatMinor = (value: number) => new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', minimumFractionDigits: 2}).format(value / 100);
const normalize = (value: string) => value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase();
export function filterPortfolio(records: Instrument[], filters: PortfolioFilters, referenceDate: string) {
  const tokens = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return records.filter(record => {
    const text = normalize([record.id, record.institution, record.bank, record.number, record.branch].join(' '));
    if (!tokens.every(token => text.includes(token))) return false;
    if (filters.bank && record.bank !== filters.bank) return false;
    if (filters.institution && record.institution !== filters.institution) return false;
    if (filters.status && record.status !== filters.status) return false;
    if (filters.activeOnly && (record.status === 'Draft' || closed.has(record.status))) return false;
    if (filters.documents === 'complete' && missingKinds(record).length) return false;
    if (filters.documents === 'missing' && !missingKinds(record).length) return false;
    if (filters.minimum && (parseAmount(filters.minimum) === null || minor(record) < parseAmount(filters.minimum)!)) return false;
    if (filters.maximum && (parseAmount(filters.maximum) === null || minor(record) > parseAmount(filters.maximum)!)) return false;
    if ((filters.maturityFrom || filters.maturityTo) && !withinDate(record.maturity, filters.maturityFrom, filters.maturityTo)) return false;
    if ((filters.issuedFrom || filters.issuedTo) && !withinDate(record.issued, filters.issuedFrom, filters.issuedTo)) return false;
    if (filters.horizon) {
      const days = daysBetween(record.maturity, referenceDate);
      if (closed.has(record.status) || record.status === 'Draft' || !Number.isFinite(days) || (filters.horizon === 'overdue' ? days >= 0 : days < 0 || days > Number(filters.horizon))) return false;
    }
    // FILTERS
    return true;
  });
}

export const distinct = (records: Instrument[], field: 'bank' | 'institution' | 'status') => [...new Set(records.map(record=>record[field]))].sort((a,b)=>a.localeCompare(b));

export const missingKinds = (record: Instrument) => ['Instrument copy','Bank letter','Declaration'].filter(kind=>!record.docs.some(doc=>doc.kind===kind));

export function parseAmount(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction=''] = value.split('.');
  const result = Number(whole)*100 + Number(fraction.padEnd(2,'0'));
  return Number.isSafeInteger(result) ? result : null;
}

export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value; }
export function withinDate(value: string, from='', to='') { return validDate(value) && (!from || validDate(from) && value >= from) && (!to || validDate(to) && value <= to); }

export const daysBetween = (date: string, referenceDate: string) => validDate(date) && validDate(referenceDate) ? Math.round((Date.parse(date)-Date.parse(referenceDate))/86400000) : NaN;

export type SortField = 'id' | 'institution' | 'bank' | 'amount' | 'maturity' | 'status';
export function sortPortfolio(records: Instrument[], field: SortField, descending=false) {
  return [...records].sort((a,b)=> ((field === 'amount' ? minor(a)-minor(b) : a[field].localeCompare(b[field])) || a.id.localeCompare(b.id)) * (descending ? -1 : 1));
}

export function paginate<T>(items: T[], requestedPage: number, pageSize: number) {
  const size = [10,25,50].includes(pageSize) ? pageSize : 10;
  const pages = Math.max(1,Math.ceil(items.length/size));
  const page = Math.min(pages,Math.max(1,Number.isInteger(requestedPage) ? requestedPage : 1));
  return {items:items.slice((page-1)*size,page*size),page,pages,start:items.length ? (page-1)*size+1 : 0,end:Math.min(page*size,items.length)};
}

export const portfolioColumns = ['Institution','Bank','Amount INR','Maturity','Status'] as const;
export function readColumns(value: unknown) { return Array.isArray(value) ? portfolioColumns.filter(column=>value.includes(column)) : [...portfolioColumns]; }

export const readDensity = (value: unknown) => value === 'compact' ? 'compact' : 'comfortable';

export function toggleSelection(ids: string[], id: string) { return ids.includes(id) ? ids.filter(value=>value!==id) : [...new Set([...ids,id])]; }
export function selectedInScope(records: Instrument[], ids: string[]) { const selected=new Set(ids); return records.filter(record=>selected.has(record.id)); }

export function selectionSummary(records: Instrument[]) {
  const dates=records.map(record=>record.maturity).filter(validDate).sort();
  return {count:records.length,amountMinor:totalMinor(records),earliest:dates[0]||'—',latest:dates.at(-1)||'—'};
}

export function comparisonRows(records: Instrument[]) {
  if (records.length<2 || records.length>4) return [];
  return [
    ['Institution',...records.map(record=>record.institution)],
    ['Bank',...records.map(record=>record.bank)],
    ['Face value INR',...records.map(record=>formatMinor(minor(record)))],
    ['Issued',...records.map(record=>record.issued)],
    ['Maturity',...records.map(record=>record.maturity)],
    ['Status',...records.map(record=>record.status)],
    ['Missing categories',...records.map(record=>missingKinds(record).join(', ')||'None')]
  ];
}

export function portfolioCsvRows(records: Instrument[]): (string|number)[][] { return [['Instrument ID','Institution','Bank','Instrument number','Amount INR','Issued','Maturity','Status','Missing document categories'],...records.map(record=>[record.id,record.institution,record.bank,record.number,minor(record)/100,record.issued,record.maturity,record.status,missingKinds(record).join('; ')])]; }

export function portfolioSnapshot(records: Instrument[], referenceDate: string) {
  return {version:1,referenceDate,currency:'INR',count:records.length,totalAmountMinor:totalMinor(records),records:records.map(record=>({id:record.id,institution:record.institution,bank:record.bank,branch:record.branch,number:record.number,amountMinor:minor(record),issued:record.issued,maturity:record.maturity,status:record.status,missingDocuments:missingKinds(record)}))};
}

const calendarEscape = (value: string) => value.replaceAll('\\','\\\\').replace(/\r?\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
export function foldCalendarLine(line: string) {
  const lines: string[]=[]; let chunk=''; let bytes=0; let limit=75;
  for (const character of line) {
    const size=new TextEncoder().encode(character).length;
    if (bytes+size>limit) {lines.push(chunk);chunk=' ';bytes=1;limit=75;}
    chunk+=character;bytes+=size;
  }
  lines.push(chunk);return lines.join('\r\n');
}
export function maturityCalendar(records: Instrument[], referenceDate: string) {
  if (!validDate(referenceDate)) throw new Error('Choose a valid reporting date.');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Tenet//Deposit Maturities//EN','CALSCALE:GREGORIAN'];
  for (const record of records.filter(record=>record.status!=='Draft'&&!closed.has(record.status)&&validDate(record.maturity))) {
    const end=new Date(Date.parse(record.maturity)+86400000).toISOString().slice(0,10).replaceAll('-','');
    lines.push('BEGIN:VEVENT',`UID:${encodeURIComponent(record.id)}@tenet.local`,`DTSTAMP:${referenceDate.replaceAll('-','')}T000000Z`,`DTSTART;VALUE=DATE:${record.maturity.replaceAll('-','')}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${calendarEscape('Deposit matures: '+record.id)}`,`DESCRIPTION:${calendarEscape(record.institution+'; '+record.bank+'; '+formatMinor(minor(record)))}`,'END:VEVENT');
  }
  lines.push('END:VCALENDAR');return lines.map(foldCalendarLine).join('\r\n')+'\r\n';
}

export const portfolioIds = (records: Instrument[]) => records.map(record=>record.id).join('\n');

export function concentration(records: Instrument[], field: 'bank'|'institution') {
  const groups = new Map<string,{label:string;count:number;amountMinor:number;share:number}>();
  const total = totalMinor(records);
  for (const record of records) {const label=record[field];const group=groups.get(label)||{label,count:0,amountMinor:0,share:0};group.count++;group.amountMinor+=minor(record);groups.set(label,group);}
  return [...groups.values()].map(group=>({...group,share:total ? group.amountMinor/total*100 : 0})).sort((a,b)=>b.amountMinor-a.amountMinor||a.label.localeCompare(b.label));
}

export function maturityLadder(records: Instrument[]) {
  const groups=new Map<string,{month:string;count:number;amountMinor:number}>();
  for (const record of records) {
    if (record.status==='Draft'||closed.has(record.status)||!validDate(record.maturity)) continue;
    const month=record.maturity.slice(0,7);const group=groups.get(month)||{month,count:0,amountMinor:0};group.count++;group.amountMinor+=minor(record);groups.set(month,group);
  }
  return [...groups.values()].sort((a,b)=>a.month.localeCompare(b.month));
}

export function documentGaps(records: Instrument[]) {
  return records.filter(record=>record.status!=='Draft'&&!closed.has(record.status)).map(record=>({record,missing:missingKinds(record)})).filter(row=>row.missing.length).sort((a,b)=>b.missing.length-a.missing.length||a.record.id.localeCompare(b.record.id));
}

export function duplicateCandidates(records: Instrument[]) {
  const groups=new Map<string,Instrument[]>();
  const clean=(value:string)=>value.normalize('NFKC').replace(/\s+/g,'').toUpperCase();
  for (const record of records) {if(!record.number.trim())continue;const key=JSON.stringify([clean(record.bank),clean(record.number)]);groups.set(key,[...(groups.get(key)||[]),record]);}
  return [...groups.values()].filter(group=>group.length>1).sort((a,b)=>a[0].bank.localeCompare(b[0].bank)||a[0].number.localeCompare(b[0].number));
}

export function evidenceGaps(records: Instrument[]) {
  return records.filter(record=>['Verified','Release requested'].includes(record.status)&&(!record.evidence?.source?.trim()||!record.evidence.reference?.trim()||!validDate(record.evidence.date))).sort((a,b)=>a.id.localeCompare(b.id));
}

export function successorLinks(records: Instrument[], authorized: Instrument[]) {
  const lookup=new Map(authorized.map(record=>[record.id,record]));
  const children=new Map<string,Instrument[]>();
  for(const record of authorized) if(record.parent) children.set(record.parent,[...(children.get(record.parent)||[]),record]);
  return records.filter(record=>record.parent||children.has(record.id)).map(record=>({record,parent:record.parent ? lookup.get(record.parent)?.id||'Unavailable in this workspace' : 'None',children:children.get(record.id)||[]}));
}

export function requestAging(records: Instrument[], requests: RequestItem[], referenceDate: string) {
  const ids=new Set(records.map(record=>record.id));
  return requests.filter(request=>request.status==='Pending'&&ids.has(request.recordId)).map(request=>{const age=daysBetween(referenceDate,request.date.slice(0,10));return {request,ageDays:Number.isFinite(age)?Math.max(0,age):null};}).sort((a,b)=>(b.ageDays??-1)-(a.ageDays??-1)||a.request.id.localeCompare(b.request.id));
}

export function portfolioActivity(records: Instrument[], events: EventItem[], query='', actor='') {
  const ids=new Set(records.map(record=>record.id));const tokens=normalize(query).trim().split(/\s+/).filter(Boolean);
  return events.filter(event=>ids.has(event.recordId)&&(!actor||event.actor===actor)&&tokens.every(token=>normalize(event.action+' '+event.recordId+' '+event.actor).includes(token))).sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)||a.id.localeCompare(b.id));
}

export const portfolioPreferencesKey = (account: string) => 'tenet:portfolio:preferences:v1:'+encodeURIComponent(account);
export type PortfolioPreferences = {version:1;sort:SortField;descending:boolean;pageSize:number;columns:typeof portfolioColumns[number][];dense:boolean};
export function readPreferences(raw: string|null): PortfolioPreferences {
  const defaults:PortfolioPreferences={version:1,sort:'maturity',descending:false,pageSize:10,columns:[...portfolioColumns],dense:false};
  try {
    const value=JSON.parse(raw||'null');
    if(!value||value.version!==1)return defaults;
    const sort:SortField=['id','institution','bank','amount','maturity','status'].includes(value.sort)?value.sort:'maturity';
    return {version:1,sort,descending:value.descending===true,pageSize:[10,25,50].includes(value.pageSize)?value.pageSize:10,columns:readColumns(value.columns),dense:value.dense===true};
  } catch { return defaults; }
}

export function filterWarnings(filters: PortfolioFilters) {
  const errors:string[]=[];
  for(const [label,value] of [['Minimum',filters.minimum],['Maximum',filters.maximum]]) if(value&&parseAmount(value)===null)errors.push(`${label} amount must be a nonnegative decimal with at most two places.`);
  if(filters.minimum&&filters.maximum&&parseAmount(filters.minimum)!==null&&parseAmount(filters.maximum)!==null&&parseAmount(filters.minimum)!>parseAmount(filters.maximum)!)errors.push('Minimum amount must not exceed maximum amount.');
  for(const [label,from,to] of [['Maturity',filters.maturityFrom,filters.maturityTo],['Issue',filters.issuedFrom,filters.issuedTo]])if(from&&to&&from>to)errors.push(`${label} start date must not follow its end date.`);
  return errors;
}
