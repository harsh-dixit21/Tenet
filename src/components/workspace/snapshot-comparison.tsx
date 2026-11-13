import {useMemo, useRef, useState, type ChangeEvent} from 'react';
import {createSnapshot, readSnapshot, type WorkspaceSnapshot} from '@/lib/snapshot-comparison';
import {Button} from '../ui/button';
import {download, useWorkspace} from './store';

export function SnapshotComparison() {
  const {state, live} = useWorkspace();
  const mode = live ? 'live' : 'demo';
  const current = useMemo(() => createSnapshot(state.records, state.requests, mode),
    [state.records, state.requests, mode]);

  const [baseline, setBaseline] = useState<WorkspaceSnapshot | null>(null);
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
  </section>;
}
