import {useState, type FormEvent} from 'react';
import {decodeViews, saveView, type RegisterFilters, type SavedView} from '@/lib/saved-views';
import {Button} from '../ui/button';
import {Input} from '../ui/input';

export function SavedViews({storageKey, filters}: {storageKey: string; filters: RegisterFilters}) {
  const [views, setViews] = useState<SavedView[]>(() => {
    try { return decodeViews(localStorage.getItem(storageKey)); } catch { return []; }
  });
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function persist(next: SavedView[]) {
    localStorage.setItem(storageKey, JSON.stringify({version: 1, views: next}));
    setViews(next);
  }
  function save(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      // Read again so another open tab's saved views are not overwritten.
      const current = decodeViews(localStorage.getItem(storageKey));
      persist(saveView(current, name, filters));
      setMessage(`Saved “${name.trim()}” in this browser.`); setName('');
    } catch (e) {
      setError(e instanceof Error && e.name !== 'QuotaExceededError' && e.name !== 'SecurityError' ? e.message : 'Browser storage is unavailable. Your filters are still active.');
    }
  }
  return <section aria-label="Saved register views" className="mb-5 border-b pb-5">
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">Save current filters
        <Input value={name} onChange={e => setName(e.target.value)} maxLength={40} required placeholder="e.g. Verified deposits" />
      </label>
      <Button variant="outline" type="submit">Save view</Button>
    </form>
    <p className="mt-2 text-xs text-muted-foreground">{views.length}/5 saved on this screen · Stored in this browser only.</p>
    <p role="status" className="mt-2 text-sm">{message}</p>
    {error && <p role="alert" className="mt-2 text-sm text-amber-300">{error}</p>}
  </section>;
}
