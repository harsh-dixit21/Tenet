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
  const [sort, setSort] = useState<p.SortField>('maturity');
  const [descending, setDescending] = useState(false);
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(10);
  const [visibleColumns,setVisibleColumns] = useState<Column[]>([...columns]);
  const [dense,setDense] = useState(false);
  const [selected,setSelected] = useState<string[]>([]);
  function change(patch: Partial<p.PortfolioFilters>) { setFilters(current => ({...current, ...patch})); setPage(1); }
  const rows = useMemo(() => p.filterPortfolio(workspace.records, filters, referenceDate), [workspace.records, filters, referenceDate]);
  const sorted = useMemo(()=>p.sortPortfolio(rows,sort,descending),[rows,sort,descending]);
  const paged = p.paginate(sorted,page,pageSize);
  const selectedRows = p.selectedInScope(rows,selected);
  const selectedSet = new Set(selectedRows.map(record=>record.id));
  const selection = p.selectionSummary(selectedRows);
  
  return <section className="portfolio" aria-label="Deposit portfolio">
    <div className="portfolio-heading"><div><h2>Deposit portfolio</h2><p className="portfolio-note">{live ? 'Authorized workspace records' : 'Synthetic demo records'} Â· Amounts in INR</p></div><div className="portfolio-actions"><button disabled={!rows.length} onClick={()=>{download('tenet-portfolio.csv',csv(p.portfolioCsvRows(sorted)));setNotice(`Exported ${rows.length} filtered instruments as CSV.`);}}>Export portfolio CSV</button>
<button disabled={!rows.length} onClick={()=>{download('tenet-portfolio.json',JSON.stringify(p.portfolioSnapshot(sorted,referenceDate),null,2),'application/json');setNotice('Exported a portfolio data snapshot without attachment contents.');}}>Export portfolio JSON</button>
<button disabled={!rows.some(record=>record.status!=='Draft'&&!['Released','Refunded','Discharged','Renewed','Replaced'].includes(record.status))} onClick={()=>{download('tenet-maturities.ics',p.maturityCalendar(sorted,referenceDate),'text/calendar;charset=utf-8');setNotice('Exported active maturity dates as all-day calendar events.');}}>Export maturity calendar</button>
<button disabled={!rows.length} onClick={()=>window.print()}>Print portfolio report</button></div></div>
    <div className="portfolio-totals"><div><span>Matching instruments</span><strong>{rows.length.toLocaleString('en-IN')}</strong></div><div><span>Matching face value</span><strong>{p.formatMinor(p.totalMinor(rows))}</strong></div></div>
    <div className="portfolio-filters">
      <Field label="Search portfolio"><input type="search" value={filters.query} onChange={event => change({query: event.target.value})} placeholder="Institution, bank, ID or instrument number"/></Field>
      <Field label="Portfolio bank"><select value={filters.bank || ''} onChange={event=>change({bank:event.target.value})}><option value="">All banks</option>{p.distinct(workspace.records,'bank').map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Portfolio institution"><select value={filters.institution || ''} onChange={event=>change({institution:event.target.value})}><option value="">All institutions</option>{p.distinct(workspace.records,'institution').map(value=><option key={value}>{value}</option>)}</select></Field>
      <button type="button" onClick={() => {setFilters({query: ''}); setPage(1);}}>Clear filters</button>
    </div>
    <details className="portfolio-advanced"><summary>More filters</summary><div className="portfolio-filters"><Field label="Portfolio status"><select value={filters.status || ''} onChange={event=>change({status:event.target.value})}><option value="">All statuses</option>{p.distinct(workspace.records,'status').map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Lifecycle scope"><select value={filters.activeOnly?'active':'all'} onChange={event=>change({activeOnly:event.target.value==='active'})}><option value="all">All lifecycle history</option><option value="active">Active exposure only</option></select></Field>
<Field label="Required documents"><select value={filters.documents || ''} onChange={event=>change({documents:event.target.value as p.PortfolioFilters['documents']})}><option value="">Any completeness</option><option value="complete">All required categories</option><option value="missing">Missing required categories</option></select></Field>
<Field label="Minimum amount INR"><input inputMode="decimal" value={filters.minimum || ''} onChange={event=>change({minimum:event.target.value})} placeholder="0.00"/></Field>
<Field label="Maximum amount INR"><input inputMode="decimal" value={filters.maximum || ''} onChange={event=>change({maximum:event.target.value})} placeholder="No maximum"/></Field>
<Field label="Maturity from"><input type="date" value={filters.maturityFrom || ''} onChange={event=>change({maturityFrom:event.target.value})}/></Field><Field label="Maturity through"><input type="date" value={filters.maturityTo || ''} onChange={event=>change({maturityTo:event.target.value})}/></Field>
<Field label="Issued from"><input type="date" value={filters.issuedFrom || ''} onChange={event=>change({issuedFrom:event.target.value})}/></Field><Field label="Issued through"><input type="date" value={filters.issuedTo || ''} onChange={event=>change({issuedTo:event.target.value})}/></Field>
<Field label="Maturity horizon"><select value={filters.horizon || ''} onChange={event=>change({horizon:event.target.value as p.PortfolioFilters['horizon']})}><option value="">Any maturity</option><option value="overdue">Overdue active instruments</option><option value="7">Next 7 days</option><option value="30">Next 30 days</option><option value="90">Next 90 days</option></select></Field></div></details>
    {notice && <p role="status" className="portfolio-note">{notice}</p>}
    <div className="portfolio-filters"><Field label="Sort portfolio"><select value={sort} onChange={event=>setSort(event.target.value as p.SortField)}>{(['maturity','amount','institution','bank','status','id'] as const).map(value=><option key={value}>{value}</option>)}</select></Field><Field label="Sort direction"><select value={descending?'descending':'ascending'} onChange={event=>setDescending(event.target.value==='descending')}><option value="ascending">Ascending</option><option value="descending">Descending</option></select></Field></div>
<details className="portfolio-advanced"><summary>Visible columns</summary><div className="portfolio-actions">{columns.map(column=><label key={column} className="portfolio-check"><input type="checkbox" checked={visibleColumns.includes(column)} onChange={()=>setVisibleColumns(current=>current.includes(column)?current.filter(value=>value!==column):columns.filter(value=>value===column||current.includes(value)))}/>{column}</label>)}</div></details>
<label className="portfolio-check"><input aria-label="Compact portfolio rows" type="checkbox" checked={dense} onChange={event=>setDense(event.target.checked)}/>Compact row spacing</label>
<div className="portfolio-actions"><span className="portfolio-note">{selectedRows.length} selected within current filters</span><button disabled={!selected.length} onClick={()=>setSelected([])}>Clear selection</button></div>
{selection.count>0 && <p className="portfolio-selection" role="status">Selected face value: <strong>{p.formatMinor(selection.amountMinor)}</strong> · {selection.count} instruments · Maturities {selection.earliest} through {selection.latest}</p>}
<button disabled={!selectedRows.length} onClick={()=>{download('tenet-selected-portfolio.csv',csv(p.portfolioCsvRows(selectedRows)));setNotice(`Exported ${selectedRows.length} selected instruments within current filters.`);}}>Export selected CSV</button>
    <div className="portfolio-scroll" tabIndex={0} role="region" aria-label="Portfolio instrument results"><table className=""><caption className="sr-only">Filtered deposit portfolio, {rows.length} instruments</caption><thead><tr><th scope="col"><input type="checkbox" aria-label="Select current portfolio page" checked={paged.items.length>0&&paged.items.every(record=>selectedSet.has(record.id))} onChange={event=>setSelected(current=>event.target.checked?[...new Set([...current,...paged.items.map(record=>record.id)])]:current.filter(id=>!paged.items.some(record=>record.id===id)))}/></th><th scope="col">Instrument</th>{visibleColumns.map(column => <th key={column} scope="col" className={column === 'Amount INR' ? 'portfolio-number' : undefined}>{column}</th>)}</tr></thead><tbody>{paged.items.map(record => <tr key={record.id}><td><input type="checkbox" aria-label={`Select portfolio instrument ${record.id}`} checked={selectedSet.has(record.id)} onChange={()=>setSelected(current=>p.toggleSelection(current,record.id))}/></td><td><a href={`#instrument/${encodeURIComponent(record.id)}`}>{record.id}</a></td>{visibleColumns.map(column => <td key={column} className={column === 'Amount INR' ? 'portfolio-number' : undefined}>{cell(record, column)}</td>)}</tr>)}</tbody></table>{!rows.length && <p className="portfolio-empty">No matching instruments. Adjust the filters or clear them to see all authorized records.</p>}</div>
    <div className="portfolio-paging"><p className="portfolio-note" role="status">{paged.start}–{paged.end} of {rows.length} instruments · Page {paged.page} of {paged.pages}</p><div className="portfolio-actions"><Field label="Portfolio rows per page"><select value={pageSize} onChange={event=>{setPageSize(Number(event.target.value));setPage(1);}}>{[10,25,50].map(size=><option key={size}>{size}</option>)}</select></Field><button disabled={paged.page===1} onClick={()=>setPage(paged.page-1)}>Previous page</button><button disabled={paged.page===paged.pages} onClick={()=>setPage(paged.page+1)}>Next page</button></div></div>
    <Panel title="Compare selected instruments" note="Select two to four instruments in the results to compare them side by side.">{selectedRows.length>=2&&selectedRows.length<=4?<Grid headers={['Field',...selectedRows.map(record=>record.id)]} rows={p.comparisonRows(selectedRows)}/>:<p className="portfolio-empty">Select between 2 and 4 instruments. Currently selected: {selectedRows.length}.</p>}</Panel>
<div className="portfolio-print-only"><h2>Tenet deposit portfolio</h2><p>Reporting date: {referenceDate} · {rows.length} matching instruments · Face value {p.formatMinor(p.totalMinor(rows))}</p><Grid headers={['Instrument',...columns]} rows={sorted.map(record=>[record.id,...columns.map(column=>cell(record,column))])}/></div>
  </section>;
}
