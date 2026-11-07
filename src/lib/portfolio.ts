import type {Instrument, RequestItem, EventItem} from '../components/workspace/store.ts';
export type PortfolioFilters = {query: string; referenceDate?: string; institution?: string; bank?: string};
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
    // FILTERS
    return true;
  });
}

export const distinct = (records: Instrument[], field: 'bank' | 'institution' | 'status') => [...new Set(records.map(record=>record[field]))].sort((a,b)=>a.localeCompare(b));
