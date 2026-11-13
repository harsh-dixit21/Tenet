import {useMemo, useRef, useState, type ChangeEvent} from 'react';
import {comparableValueDelta, compareSnapshots, createSnapshot, readSnapshot, unavailableBaselineCount, type WorkspaceSnapshot} from '@/lib/snapshot-comparison';
import {paginate} from '@/lib/portfolio';
import {institutionKey, reviewInstitutions} from '@/lib/controls-review';
import {searchMatches} from '@/lib/workspace-utils';
import {Button} from '../ui/button';
import {download, today, useWorkspace} from './store';

export function SnapshotComparison() {
  const {state, live} = useWorkspace();
  const mode = live ? 'live' : 'demo';
  const current = useMemo(() => createSnapshot(state.records, state.requests, mode),
    [state.records, state.requests, mode]);

  const [baseline, setBaseline] = useState<WorkspaceSnapshot | null>(null);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<'instrument' | 'value'>('instrument');
  const [includeUnchanged, setIncludeUnchanged] = useState(false);
  const [institution, setInstitution] = useState('');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const loadSequence = useRef(0);

  async function openBaseline(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const sequence = ++loadSequence.current;
    setError('');
    setReading(true);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Choose a baseline of 8 MB or less.');
      const snapshot = readSnapshot(await file.text(), mode);
      if (sequence === loadSequence.current) setBaseline(snapshot);
    } catch (failure) {
      if (sequence === loadSequence.current) setError(failure instanceof Error ? failure.message : 'Could not open the baseline.');
    } finally {
      if (sequence === loadSequence.current) setReading(false);
    }
  }

  const referenceDay = today();
  const compared = useMemo(() => baseline ? compareSnapshots(baseline, current, referenceDay) : [],
    [baseline, current, referenceDay]);
  const groups = [...new Set(compared.flatMap(row => row.changes.map(change => change.group)))].sort();
  const grouped = compared.map(row => group ? {...row, changes: row.changes.filter(change => change.group === group)} : row);
  const searched = grouped.filter(({record}) => searchMatches(
    [record.id, record.institution, record.bank, record.branch, record.number].join(' '), query));
  const institutions = useMemo(() => reviewInstitutions(current.records), [current.records]);
  const scoped = searched.filter(({record}) => !institution || institutionKey(record) === institution);
  const unchanged = new Set(compared.filter(row => !row.changes.length).map(row => row.record.id));
  const visible = scoped.filter(row => row.changes.length || (includeUnchanged && unchanged.has(row.record.id)))
    .sort((a, b) => {
      const valueChange = (row: typeof a) => row.previous ? Math.abs(row.record.amountMinor - row.previous.amountMinor) : 0;
      return (sort === 'value' ? valueChange(b) - valueChange(a) : 0) || a.record.id.localeCompare(b.record.id);
    });

  const pagination = paginate(visible, page, 10);

  return <section aria-label="Workspace snapshot comparison" className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">Compare workspace snapshots</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use a downloaded baseline to review changes over time.</p>
      </div>
      <Button variant="outline" onClick={() =>
        download('tenet-baseline.json', JSON.stringify({...current, capturedAt: new Date().toISOString()}, null, 2), 'application/json')}>
        Download current baseline
      </Button>
    </div>
    <label className="flex max-w-full flex-col gap-2 text-sm">
      Open baseline JSON
      <input type="file" accept=".json,application/json" className="workspace-select max-w-full" onChange={openBaseline}/>
    </label>
    {reading && <p role="status" className="text-sm">Reading baseline…</p>}
    {error && <p role="alert" className="text-sm">{error}</p>}
    {baseline && <p className="text-sm text-muted-foreground">
      Baseline captured {new Date(baseline.capturedAt).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}
    </p>}
    {baseline && <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex min-w-0 flex-col gap-2 text-sm">Search current instruments
          <input className="workspace-select w-full" type="search" value={query}
            onChange={event => { setQuery(event.target.value); setPage(1); }}/>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">Change group
          <select className="workspace-select w-full" value={group} onChange={event => { setGroup(event.target.value); setPage(1); }}>
            <option value="">All change groups</option>
            {groups.map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">Institution
          <select className="workspace-select w-full" value={institution} onChange={event => { setInstitution(event.target.value); setPage(1); }}>
            <option value="">All institutions</option>
            {institutions.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-2 text-sm">Sort comparison
          <select className="workspace-select w-full" value={sort} onChange={event => { setSort(event.target.value === 'value' ? 'value' : 'instrument'); setPage(1); }}>
            <option value="instrument">Instrument ID</option>
            <option value="value">Largest face value change</option>
          </select>
        </label>
      </div>
      <label className="flex min-h-11 w-fit items-center gap-2 text-sm">
        <input type="checkbox" checked={includeUnchanged} onChange={event => { setIncludeUnchanged(event.target.checked); setPage(1); }}/>
        Include unchanged instruments
      </label>
      <p className="border-y py-3 text-sm" role="status">{visible.length} matching instruments</p>
      <p className="text-sm tabular-nums">
        Comparable face value change <strong>{comparableValueDelta(scoped).toLocaleString('en-IN')} paise</strong>
      </p>
      <p className="text-sm text-muted-foreground">{unavailableBaselineCount(baseline, current)} baseline instruments unavailable in the current scope</p>
      {!visible.length && <p className="text-sm text-muted-foreground">No differences found in the current scope.</p>}
      <div className="divide-y">{pagination.items.map(row => <article key={row.record.id} className="min-w-0 space-y-2 py-3">
        <h3 className="break-words text-sm font-medium">
          <a className="underline underline-offset-4" href={'#instrument/' + encodeURIComponent(row.record.id)}>{row.record.id}</a>
          <span className="ml-2 text-muted-foreground">{row.record.institution}</span>
        </h3>
        {!row.changes.length && <p className="text-sm text-muted-foreground">Unchanged</p>}
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {row.changes.map(change => <div key={change.id} className="min-w-0 break-words">
            <dt className="font-medium">{change.label}</dt>
            <dd className="text-muted-foreground">{change.before === '' ? '—' : change.before} → {change.after === '' ? '—' : change.after}</dd>
          </div>)}
        </dl>
      </article>)}</div>
      {visible.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm tabular-nums text-muted-foreground" role="status">
          {pagination.start}–{pagination.end} of {visible.length} instruments
        </p>
        <div className="flex gap-2">
          <Button variant="outline" disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}>Previous</Button>
          <Button variant="outline" disabled={pagination.page >= pagination.pages}
            onClick={() => setPage(pagination.page + 1)}>Next</Button>
        </div>
      </div>}
    </div>}
  </section>;
}
