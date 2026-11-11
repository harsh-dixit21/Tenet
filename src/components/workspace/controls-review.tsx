import {useMemo, useState} from 'react';
import {
  controls, controlSummaryRows, findingCsvRows, findingsFrom, institutionKey,
  reviewControls, reviewInstitutions, scopeControlResults, searchControlResults,
} from '@/lib/controls-review';
import {controlsHref, readControlsCheck, readControlsRecord} from '@/lib/control-links';
import {paginate} from '@/lib/portfolio';
import {Button} from '../ui/button';
import {useWorkspace, today, csv, download} from './store';

export function ControlsReview() {
  const {state, live} = useWorkspace();
  const referenceDay = today();
  const linkedRecord = readControlsRecord(location.hash);
  const linkedCheck = readControlsCheck(location.hash);
  const selectedCheck = controls.find(control => control.id === linkedCheck);
  const [filters, setFilters] = useState({query: '', category: '', findingsOnly: false, institution: '', level: ''});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  function changeFilters(patch: Partial<typeof filters>) {
    setFilters(current => ({...current, ...patch}));
    setPage(1);
  }
  const evaluated = useMemo(() => reviewControls({
    records: state.records, requests: state.requests, today: referenceDay, live,
  }), [state.records, state.requests, referenceDay, live]);
  const names = useMemo(() => new Map(state.records.map(record => [record.id, record.institution])), [state.records]);
  const linkedScope = useMemo(() => linkedRecord === undefined ? state.records :
    state.records.filter(record => record.id === linkedRecord), [state.records, linkedRecord]);
  const institutions = useMemo(() => reviewInstitutions(linkedScope), [linkedScope]);
  const scope = useMemo(() => linkedScope.filter(record =>
    !filters.institution || institutionKey(record) === filters.institution), [linkedScope, filters.institution]);
  const results = useMemo(() => {
    const scoped = filters.institution || linkedRecord !== undefined ? scopeControlResults(evaluated, new Set(scope.map(record => record.id))) : evaluated;
    const matching = scoped.filter(({control}) =>
      (!filters.category || control.category === filters.category) &&
      (!filters.level || control.level === filters.level) &&
      (!linkedCheck || control.id === linkedCheck));
    const searched = searchControlResults(matching, filters.query, names);
    return filters.findingsOnly ? searched.filter(result => result.observations.length > 0) : searched;
  }, [evaluated, filters, linkedCheck, linkedRecord, names, scope]);
  const findings = useMemo(() => findingsFrom(results), [results]);
  const pagination = paginate(findings, page, pageSize);
  const shown = pagination.items;

  if (linkedRecord !== undefined && !linkedScope.length) {
    return <section className="space-y-3" aria-label="Workspace controls review">
      <p role="status">This instrument is unavailable in the loaded workspace.</p>
      <a className="underline underline-offset-4" href={controlsHref()}>Open workspace controls</a>
    </section>;
  }

  return <section aria-label="Workspace controls review" className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">Workspace checks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {live ? 'Loaded workspace snapshot' : 'Demo workspace'} · {referenceDay}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={!findings.length}
          onClick={() => download('tenet-control-findings.csv', csv(findingCsvRows(findings)))}>
          Export findings CSV
        </Button>
        <Button variant="outline" disabled={!results.length}
          onClick={() => download('tenet-control-summary.csv', csv(controlSummaryRows(results)))}>
          Export check summary
        </Button>
      </div>
    </div>
    <div className="flex flex-wrap gap-x-8 gap-y-3 border-y py-4 text-sm">
      <p><strong className="text-xl tabular-nums">{findings.length}</strong> findings</p>
      <p><strong className="text-xl tabular-nums">{scope.length}</strong> instruments in scope</p>
    </div>
    {linkedRecord && <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm">
      <a className="underline underline-offset-4" href={'#instrument/' + encodeURIComponent(linkedRecord)}>{linkedRecord}</a>
      <a className="underline underline-offset-4" href={controlsHref({check: linkedCheck})}>Show all instruments</a>
    </div>}
    {linkedCheck && <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm">
      <span>{selectedCheck?.title ?? 'This check is unavailable.'}</span>
      <a className="underline underline-offset-4" href={controlsHref({record: linkedRecord ?? undefined})}>Show all checks</a>
    </div>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <label className="col-span-2 flex min-w-0 flex-col gap-2 text-sm sm:col-span-1">Search controls
        <input className="workspace-select min-h-11 w-full" type="search" value={filters.query}
          placeholder="Check, instrument or reference"
          onChange={event => changeFilters({query: event.target.value})}/>
      </label>
      <label className="flex min-w-0 flex-col gap-2 text-sm">Category
        <select className="workspace-select min-h-11 w-full" value={filters.category}
          onChange={event => changeFilters({category: event.target.value})}>
          <option value="">All categories</option>
          {[...new Set(controls.map(control => control.category))].map(category =>
            <option key={category}>{category}</option>)}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2 text-sm">Institution
        <select className="workspace-select min-h-11 w-full" value={filters.institution}
          onChange={event => changeFilters({institution: event.target.value})}>
          <option value="">All institutions</option>
          {institutions.map(institution => <option key={institution.key} value={institution.key}>{institution.label}</option>)}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-2 text-sm">Finding type
        <select className="workspace-select min-h-11 w-full" value={filters.level}
          onChange={event => changeFilters({level: event.target.value})}>
          <option value="">All types</option>
          <option>Inconsistency</option>
          <option>Review</option>
        </select>
      </label>
    </div>
    <label className="flex min-h-11 w-fit items-center gap-2 text-sm">
      <input type="checkbox" checked={filters.findingsOnly}
        onChange={event => changeFilters({findingsOnly: event.target.checked})}/>
      Checks with findings only
    </label>
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Findings</h3>
      {shown.length ? <div className="max-w-full overflow-x-auto" role="region" tabIndex={0} aria-label="Control findings">
        <table className="w-full table-fixed border-collapse text-left text-sm sm:table-auto">
          <thead className="text-muted-foreground"><tr>
            <th scope="col" className="w-[32%] px-3 py-2 font-medium sm:w-auto">Instrument</th>
            <th scope="col" className="px-3 py-2 font-medium">Finding</th>
            <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">Type</th>
          </tr></thead>
          <tbody>{shown.map((finding, index) => <tr key={index} className="border-t align-top">
            <td className="break-all px-3 py-3">
              <a className="underline underline-offset-4" href={'#instrument/' + encodeURIComponent(finding.recordId)}>{finding.recordId}</a>
              {finding.subject && <span className="mt-1 block max-w-40 whitespace-normal break-all text-[13px] text-muted-foreground">{finding.subject}</span>}
            </td>
            <td className="px-3 py-3">
              <p>{finding.control.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{finding.control.description}</p>
              <p className="mt-1 text-[13px] text-muted-foreground sm:hidden">{finding.control.level}</p>
            </td>
            <td className="hidden whitespace-nowrap px-3 py-3 sm:table-cell">{finding.control.level}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="text-sm text-muted-foreground" role="status">No findings in the current results.</p>}
      {findings.length > 0 && <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-muted-foreground tabular-nums" role="status">
          {pagination.start}–{pagination.end} of {findings.length} findings
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs">Findings per page
            <select className="workspace-select" value={pageSize} onChange={event => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}>
              {[10, 25, 50].map(size => <option key={size}>{size}</option>)}
            </select>
          </label>
          <Button variant="outline" disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}>Previous</Button>
          <Button variant="outline" disabled={pagination.page >= pagination.pages}
            onClick={() => setPage(pagination.page + 1)}>Next</Button>
        </div>
      </div>}
    </div>
    <details className="border-y py-3">
      <summary className="cursor-pointer text-sm font-medium">Check catalogue</summary>
      {!results.length && <p className="mt-3 text-sm text-muted-foreground">No checks match the current filters.</p>}
      <ul className="mt-3 divide-y">{results.map(result => <li key={result.control.id} className="py-3 text-sm">
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
          <a className="underline underline-offset-4"
            href={controlsHref({check: result.control.id, record: linkedRecord ?? undefined})}>{result.control.title}</a>
          <span className="text-muted-foreground">{result.evaluated ? result.observations.length + ' findings' : 'Live data required'}</span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{result.control.description}</p>
      </li>)}</ul>
    </details>
  </section>;
}
