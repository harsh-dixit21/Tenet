import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronRight, FileText, LayoutDashboard, Search, Plus, X, Clock3, Files, CircleCheck, Download, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AnimatedGroup } from './motion-primitives/animated-group';

type Status = 'Verified' | 'Awaiting verification' | 'Discrepancy' | 'Release requested';
type RecordItem = { id: string; institution: string; bank: string; amount: number; maturity: string; status: Status; submitted: string; note: string; history: string[] };
const sampleRecords: RecordItem[] = [
  { id: 'FDR-2026-001', institution: 'Northfield Institute of Technology', bank: 'Sample Bank A', amount: 1500000, maturity: '2026-11-12', status: 'Verified', submitted: '2026-09-18', note: 'Sample manual verification recorded by a reviewing official. No live bank connection.', history: ['18 Sep 2026 · Institution submitted instrument details.', '20 Sep 2026 · Reviewing official recorded sample verification evidence.'] },
  { id: 'FDR-2026-002', institution: 'Westbridge College of Engineering', bank: 'Sample Bank B', amount: 1000000, maturity: '2026-12-04', status: 'Awaiting verification', submitted: '2026-10-24', note: 'Institution-submitted details. Bank confirmation has not been recorded.', history: ['24 Oct 2026 · Institution submitted instrument details.', '25 Oct 2026 · Assigned for document scrutiny.'] },
  { id: 'FDR-2026-003', institution: 'Riverview Polytechnic', bank: 'Sample Bank A', amount: 750000, maturity: '2026-11-05', status: 'Discrepancy', submitted: '2026-10-12', note: 'The maturity date on the supporting document needs clarification.', history: ['12 Oct 2026 · Institution submitted instrument details.', '15 Oct 2026 · Correction requested: confirm maturity date.'] },
  { id: 'FDR-2026-004', institution: 'Eastwood Institute of Management', bank: 'Sample Bank C', amount: 2000000, maturity: '2027-03-15', status: 'Verified', submitted: '2026-08-02', note: 'Sample verification recorded. Renewal linked to FDR-2025-014.', history: ['02 Aug 2026 · Renewal submitted for FDR-2025-014.', '06 Aug 2026 · Sample verification completed.'] },
  { id: 'FDR-2026-005', institution: 'Hillcrest Technical College', bank: 'Sample Bank B', amount: 1000000, maturity: '2026-10-20', status: 'Release requested', submitted: '2026-07-08', note: 'Release request is pending review by an approving authority. No financial release has occurred.', history: ['08 Jul 2026 · Institution submitted instrument details.', '21 Oct 2026 · Institution requested release after maturity.'] },
];
const referenceDate = Date.UTC(2026, 9, 30);
const daysUntil = (date: string) => Math.ceil((Date.parse(date) - referenceDate) / 86400000);
const formatDate = (date: string) => new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
const tabs = [{ label: 'Overview', icon: LayoutDashboard }, { label: 'Records', icon: Files }, { label: 'Maturity calendar', icon: Clock3 }, { label: 'Requests', icon: FileText }];

export default function Dashboard({ initialTab }: { initialTab: string }) {
  const [tab, setTab] = useState(initialTab);
  const [records, setRecords] = useState(sampleRecords);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All statuses');
  const [selected, setSelected] = useState<RecordItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  const [notice, setNotice] = useState('');
  const detailDialog = useRef<HTMLDialogElement>(null);
  const createDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => setTab(initialTab), [initialTab]);
  useEffect(() => { if (selected) detailDialog.current?.showModal(); else detailDialog.current?.close(); }, [selected]);
  useEffect(() => { if (creating) createDialog.current?.showModal(); else createDialog.current?.close(); }, [creating]);
  const filtered = useMemo(() => records.filter(record => {
    const textMatch = `${record.id} ${record.institution} ${record.bank}`.toLowerCase().includes(query.toLowerCase());
    const statusMatch = status === 'All statuses' || status === record.status;
    const tabMatch = tab !== 'Requests' || record.status === 'Release requested' || record.status === 'Discrepancy';
    return textMatch && statusMatch && tabMatch;
  }), [query, status, records, tab]);
  const dueSoon = records.filter(record => daysUntil(record.maturity) >= 0 && daysUntil(record.maturity) <= 30);
  const exportRecords = () => {
    const csvCell = (value: string | number) => '"' + String(value).replace(/^[=+@\-]/, "'$&").replaceAll('"', '""') + '"';
    const csv = [['Record', 'Institution', 'Bank', 'Amount INR', 'Maturity', 'Status'], ...filtered.map(r => [r.id, r.institution, r.bank, r.amount, r.maturity, r.status])].map(row => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'tenet-demo-records.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Filtered records exported.');
  };
  const addRecord = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const record: RecordItem = { id: `FDR-2026-${String(records.length + 1).padStart(3, '0')}`, institution: String(values.get('institution')).trim(), bank: String(values.get('bank')).trim(), amount: Number(values.get('amount')), maturity: String(values.get('maturity')), submitted: '2026-10-30', status: 'Awaiting verification', note: 'Institution-submitted details. Bank confirmation has not been recorded.', history: ['30 Oct 2026 · Demo submission created.'] };
    if (!record.institution || !record.bank || !Number.isFinite(record.amount) || record.amount <= 0) return;
    setRecords(current => [record, ...current]); setCreating(false); setTab('Records'); setQuery(''); setStatus('All statuses'); setNotice(`${record.id} added to this demo session.`); event.currentTarget.reset();
  };
  return <div className="dashboard-shell">
    <aside className={`sidebar ${sidebar ? 'is-open' : ''}`}>
      <a href="/" className="wordmark">tenet</a>
      <p className="sidebar-caption">WORKSPACE</p>
      <nav aria-label="Dashboard navigation">{tabs.map(({ label, icon: Icon }) => <button type="button" key={label} aria-current={tab === label ? 'page' : undefined} onClick={() => { if(label === 'Overview'){location.hash='dashboard';return;} setTab(label); setStatus('All statuses'); setQuery(''); setSidebar(false); }}><Icon size={18} strokeWidth={1.5} />{label}</button>)}</nav>
      <div className="sidebar-bottom"><span className="avatar">TO</span><div><strong>Reviewing official</strong><small>Demo workspace</small></div></div>
      <a className="back-home" href="/"><ArrowLeft size={16} /> Back to home</a>
    </aside>
    {sidebar && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebar(false)} />}
    <div className="dashboard-body"><header className="dashboard-header"><button className="icon-button sidebar-toggle" aria-label={sidebar ? 'Close navigation' : 'Open navigation'} onClick={() => setSidebar(!sidebar)}>{sidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}</button><span>Workspace <ChevronRight size={12} /> <strong>{tab}</strong></span><span className="demo-label">Prototype · sample data</span></header>
      <main id="main" tabIndex={-1} className="dashboard-main">
        <div className="page-heading"><div><p className="eyebrow">SECURITY DEPOSITS / FDR</p><h1>{tab === 'Overview' ? 'Deposit overview' : tab}</h1><p>Institution-wise records, verification and pending actions.</p></div><button className="primary-button" onClick={() => setCreating(true)}><Plus size={16} /> New record</button></div>
        <div className="demo-note">Demo as of 30 October 2026. Records are synthetic; changes last for this session. Bank verification and approvals are not connected.</div>
        <p className="status-message" role="status">{notice}</p>
        {tab === 'Overview' && <AnimatedGroup className="stats-grid" preset="slide">
          {[{ label: 'Total deposits', value: money(records.reduce((sum, r) => sum + r.amount, 0)), note: `${records.length} instruments on record` }, { label: 'Awaiting verification', value: String(records.filter(r => r.status === 'Awaiting verification').length).padStart(2, '0'), note: 'Submitted, not bank-confirmed' }, { label: 'Maturing in 30 days', value: String(dueSoon.length).padStart(2, '0'), note: 'Review renewal requirements' }, { label: 'Pending requests', value: String(records.filter(r => r.status === 'Discrepancy' || r.status === 'Release requested').length).padStart(2, '0'), note: 'Corrections and release review' }].map(item => <section className="stat-card" key={item.label}><p>{item.label}</p><strong>{item.value}</strong><small>{item.note}</small></section>)}
        </AnimatedGroup>}
        {tab === 'Maturity calendar' ? <section className="panel"><div className="panel-heading"><h2>Instrument maturity</h2><span>Earliest first</span></div><div className="maturity-list">{[...records].sort((a, b) => a.maturity.localeCompare(b.maturity)).map(record => <button key={record.id} onClick={() => setSelected(record)}><time>{formatDate(record.maturity)}</time><span><strong>{record.institution}</strong><small>{record.id} · {money(record.amount)}</small></span><span className="maturity-days">{daysUntil(record.maturity) < 0 ? 'Matured' : `${daysUntil(record.maturity)} days`}</span><ArrowUpRight size={17} /></button>)}</div></section> : <section className="panel">
          <div className="panel-heading"><h2>{tab === 'Overview' ? 'Instrument register' : tab === 'Requests' ? 'Cases requiring action' : 'All instruments'}</h2><button className="text-button" onClick={exportRecords}><Download size={15} /> Export CSV</button></div>
          <div className="table-tools"><label className="search-field"><Search size={17} /><span className="sr-only">Search records</span><input placeholder="Search institution, ID or bank" value={query} onChange={e => setQuery(e.target.value)} /></label><label><span className="sr-only">Filter by status</span><select value={status} onChange={e => setStatus(e.target.value)}>{['All statuses', 'Verified', 'Awaiting verification', 'Discrepancy', 'Release requested'].map(value => <option key={value}>{value}</option>)}</select></label></div>
          <div className="table-scroll"><table><thead><tr><th>Institution / instrument</th><th>Deposit</th><th>Maturity</th><th>Verification / status</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{filtered.map(record => <tr key={record.id}><td><button className="record-link" onClick={() => setSelected(record)}>{record.institution}</button><small>{record.id} · {record.bank}</small></td><td className="numeric">{money(record.amount)}</td><td>{formatDate(record.maturity)}<small>{daysUntil(record.maturity) < 0 ? 'Matured' : daysUntil(record.maturity) <= 30 ? `In ${daysUntil(record.maturity)} days` : 'Upcoming'}</small></td><td><span className={`status-badge ${record.status === 'Verified' ? 'verified' : ''}`}>{record.status === 'Verified' && <CircleCheck size={12} />}{record.status}</span></td><td><button className="icon-button" aria-label={`View ${record.id}`} onClick={() => setSelected(record)}><ArrowUpRight size={17} /></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty-state"><Search size={24} /><h3>No matching records</h3><p>Try a different institution, ID or status.</p><button className="text-button" onClick={() => { setQuery(''); setStatus('All statuses'); }}>Clear filters</button></div>}</div>
          <div className="table-footer">{filtered.length} of {records.length} sample instruments<span>Amounts in INR</span></div>
        </section>}
        {tab === 'Overview' && <div className="overview-bottom"><section className="panel"><div className="panel-heading"><h2>Approaching maturity</h2><Clock3 size={17} /></div>{dueSoon.map(record => <button className="attention-row" key={record.id} onClick={() => setSelected(record)}><span><strong>{record.institution}</strong><small>{record.id}</small></span><span>{daysUntil(record.maturity)} days <ChevronRight size={14} /></span></button>)}</section><section className="panel"><div className="panel-heading"><h2>Latest activity</h2><span>Sample history</span></div>{records.slice(0, 3).map(record => <div className="activity-row" key={record.id}><FileText size={16} /><div><p>{record.history.at(-1)}</p><small>{record.id}</small></div></div>)}</section></div>}
      </main>
    </div>
    <dialog ref={detailDialog} className="record-dialog" onCancel={() => setSelected(null)} onClose={() => setSelected(null)}>{selected && <><div className="dialog-heading"><div><p className="eyebrow">INSTRUMENT DETAILS</p><h2>{selected.id}</h2></div><button className="icon-button" aria-label="Close record details" onClick={() => setSelected(null)}><X size={20} /></button></div><h3>{selected.institution}</h3><dl className="record-fields"><div><dt>Submitted bank</dt><dd>{selected.bank}</dd></div><div><dt>Submitted amount</dt><dd>{money(selected.amount)}</dd></div><div><dt>Maturity date</dt><dd>{formatDate(selected.maturity)}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl><section className="verification-note"><h3>Verification evidence</h3><p>{selected.note}</p><small>Sample evidence only. No live bank confirmation.</small></section><h3 className="history-title">Action history</h3><ol className="history-list">{selected.history.map(item => <li key={item}>{item}</li>)}</ol><p className="dialog-footnote">Documents and financial approvals require an authorized backend. This preview does not release funds.</p></>}</dialog>
    <dialog ref={createDialog} className="record-dialog" onCancel={() => setCreating(false)} onClose={() => setCreating(false)}><div className="dialog-heading"><div><p className="eyebrow">DEMO SUBMISSION</p><h2>New instrument</h2></div><button className="icon-button" aria-label="Close new record" onClick={() => setCreating(false)}><X size={20} /></button></div><form className="record-form" onSubmit={addRecord}><label>Institution name<input name="institution" required maxLength={100} placeholder="Enter institution name" /></label><label>Bank name<input name="bank" required maxLength={80} placeholder="Enter bank name" /></label><div className="form-row"><label>Deposit amount (INR)<input name="amount" type="number" min="1" max="999999999999" step="1" required /></label><label>Maturity date<input name="maturity" type="date" min="2026-10-29" required /></label></div><p>Creates an unverified record in this demo session. Do not enter real financial information.</p><button className="primary-button" type="submit">Create record <ArrowUpRight size={17} /></button></form></dialog>
  </div>;
}
