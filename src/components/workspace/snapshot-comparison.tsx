import {useMemo} from 'react';
import {createSnapshot} from '@/lib/snapshot-comparison';
import {Button} from '../ui/button';
import {download, useWorkspace} from './store';

export function SnapshotComparison() {
  const {state, live} = useWorkspace();
  const mode = live ? 'live' : 'demo';
  const current = useMemo(() => createSnapshot(state.records, state.requests, mode),
    [state.records, state.requests, mode]);

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
  </section>;
}
