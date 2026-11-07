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
