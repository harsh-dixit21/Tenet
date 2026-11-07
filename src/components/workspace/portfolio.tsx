import {useEffect, useMemo, useState, type ReactNode} from 'react';
import * as p from '@/lib/portfolio';
import {useWorkspace, today, download, csv, type Instrument} from './store';
import {useSession} from '@/lib/firebase/session';
import './portfolio.css';

function Field({label, children}: {label: string; children: ReactNode}) {
  return <label className="portfolio-field"><span>{label}</span>{children}</label>;
}
function Panel({title, note, children}: {title: string; note?: string; children: ReactNode}) {
  return <details className="portfolio-panel"><summary>{title}</summary>{note && <p className="portfolio-note">{note}</p>}<div className="portfolio-panel-content">{children}</div></details>;
}
function Grid({headers, rows}: {headers: string[]; rows: ReactNode[][]}) {
  return <div className="portfolio-scroll" tabIndex={0} role="region" aria-label={headers.join(', ')}><table><thead><tr>{headers.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{rows.map((cells, index) => <tr key={index}>{cells.map((cell, col) => <td key={col}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="portfolio-empty">No matching instruments.</p>}</div>;
}
const columns = ['Institution', 'Bank', 'Amount INR', 'Maturity', 'Status'] as const;
type Column = typeof columns[number];
function cell(record: Instrument, column: Column) {
  switch (column) {
    case 'Institution': return record.institution;
    case 'Bank': return record.bank;
    case 'Amount INR': return p.formatMinor(p.minor(record));
    case 'Maturity': return record.maturity;
    case 'Status': return record.status;
  }
}

export function Portfolio() {
  const {state: workspace, live} = useWorkspace();
  const session = useSession();
  const [filters, setFilters] = useState<p.PortfolioFilters>({query: ''});
  const [notice, setNotice] = useState('');
  const referenceDate = filters.referenceDate || today();
  
  function change(patch: Partial<p.PortfolioFilters>) { setFilters(current => ({...current, ...patch}));  }
  const rows = useMemo(() => p.filterPortfolio(workspace.records, filters, referenceDate), [workspace.records, filters, referenceDate]);
  
  
  return <section className="portfolio" aria-label="Deposit portfolio">
    <div className="portfolio-heading"><div><h2>Deposit portfolio</h2><p className="portfolio-note">{live ? 'Authorized workspace records' : 'Synthetic demo records'} · Amounts in INR</p></div><div className="portfolio-actions"></div></div>
    <div className="portfolio-totals"><div><span>Matching instruments</span><strong>{rows.length.toLocaleString('en-IN')}</strong></div><div><span>Matching face value</span><strong>{p.formatMinor(p.totalMinor(rows))}</strong></div></div>
    <div className="portfolio-filters">
      <Field label="Search portfolio"><input type="search" value={filters.query} onChange={event => change({query: event.target.value})} placeholder="Institution, bank, ID or instrument number"/></Field>
      <Field label="Portfolio bank"><select value={filters.bank || ''} onChange={event=>change({bank:event.target.value})}><option value="">All banks</option>{p.distinct(workspace.records,'bank').map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Portfolio institution"><select value={filters.institution || ''} onChange={event=>change({institution:event.target.value})}><option value="">All institutions</option>{p.distinct(workspace.records,'institution').map(value=><option key={value}>{value}</option>)}</select></Field>
      <button type="button" onClick={() => {setFilters({query: ''}); }}>Clear filters</button>
    </div>
    <details className="portfolio-advanced"><summary>More filters</summary><div className="portfolio-filters"><Field label="Portfolio status"><select value={filters.status || ''} onChange={event=>change({status:event.target.value})}><option value="">All statuses</option>{p.distinct(workspace.records,'status').map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Lifecycle scope"><select value={filters.activeOnly?'active':'all'} onChange={event=>change({activeOnly:event.target.value==='active'})}><option value="all">All lifecycle history</option><option value="active">Active exposure only</option></select></Field>
<Field label="Required documents"><select value={filters.documents || ''} onChange={event=>change({documents:event.target.value as p.PortfolioFilters['documents']})}><option value="">Any completeness</option><option value="complete">All required categories</option><option value="missing">Missing required categories</option></select></Field>
<Field label="Minimum amount INR"><input inputMode="decimal" value={filters.minimum || ''} onChange={event=>change({minimum:event.target.value})} placeholder="0.00"/></Field>
<Field label="Maximum amount INR"><input inputMode="decimal" value={filters.maximum || ''} onChange={event=>change({maximum:event.target.value})} placeholder="No maximum"/></Field></div></details>
    {notice && <p role="status" className="portfolio-note">{notice}</p>}
    
    <div className="portfolio-scroll" tabIndex={0} role="region" aria-label="Portfolio instrument results"><table className=""><caption className="sr-only">Filtered deposit portfolio, {rows.length} instruments</caption><thead><tr><th scope="col">Instrument</th>{columns.map(column => <th key={column} scope="col" className={column === 'Amount INR' ? 'portfolio-number' : undefined}>{column}</th>)}</tr></thead><tbody>{rows.map(record => <tr key={record.id}><td><a href={`#instrument/${encodeURIComponent(record.id)}`}>{record.id}</a></td>{columns.map(column => <td key={column} className={column === 'Amount INR' ? 'portfolio-number' : undefined}>{cell(record, column)}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="portfolio-empty">No matching instruments. Adjust the filters or clear them to see all authorized records.</p>}</div>
    
    
  </section>;
}
