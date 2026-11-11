import {useMemo} from 'react';
import {findingsFrom, reviewControls} from '@/lib/controls-review';
import {useWorkspace, today} from './store';

export function ControlsReview() {
  const {state, live} = useWorkspace();
  const referenceDay = today();
  const results = useMemo(() => reviewControls({
    records: state.records, requests: state.requests, today: referenceDay, live,
  }), [state.records, state.requests, referenceDay, live]);
  const findings = useMemo(() => findingsFrom(results), [results]);
  const shown = findings.slice(0, 50);

  return <section aria-label="Workspace controls review" className="min-w-0 space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">Workspace checks</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {live ? 'Loaded workspace snapshot' : 'Demo workspace'} · {referenceDay}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap gap-x-8 gap-y-3 border-y py-4 text-sm">
      <p><strong className="text-xl tabular-nums">{findings.length}</strong> findings</p>
      <p><strong className="text-xl tabular-nums">{state.records.length}</strong> instruments reviewed</p>
    </div>
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Findings</h3>
      {shown.length ? <div className="max-w-full overflow-x-auto" role="region" tabIndex={0} aria-label="Control findings">
        <table className="w-full min-w-[35rem] border-collapse text-left text-sm">
          <thead className="text-muted-foreground"><tr>
            <th scope="col" className="px-3 py-2 font-medium">Instrument</th>
            <th scope="col" className="px-3 py-2 font-medium">Finding</th>
            <th scope="col" className="px-3 py-2 font-medium">Type</th>
          </tr></thead>
          <tbody>{shown.map((finding, index) => <tr key={index} className="border-t align-top">
            <td className="whitespace-nowrap px-3 py-3">
              <a className="underline underline-offset-4" href={'#instrument/' + encodeURIComponent(finding.recordId)}>{finding.recordId}</a>
              {finding.subject && <span className="mt-1 block max-w-40 whitespace-normal break-all text-xs text-muted-foreground">{finding.subject}</span>}
            </td>
            <td className="px-3 py-3">
              <p>{finding.control.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{finding.control.description}</p>
            </td>
            <td className="whitespace-nowrap px-3 py-3">{finding.control.level}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="text-sm text-muted-foreground" role="status">No findings in the current results.</p>}
      {findings.length > 50 && <p className="text-xs text-muted-foreground">Showing the first 50 findings.</p>}
    </div>
    <details className="border-y py-3">
      <summary className="cursor-pointer text-sm font-medium">Check catalogue</summary>
      <ul className="mt-3 divide-y">{results.map(result => <li key={result.control.id} className="py-3 text-sm">
        <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
          <span>{result.control.title}</span>
          <span className="text-muted-foreground">{result.evaluated ? result.observations.length + ' findings' : 'Live data required'}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{result.control.description}</p>
      </li>)}</ul>
    </details>
  </section>;
}
