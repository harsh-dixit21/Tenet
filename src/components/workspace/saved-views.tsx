import {useState, type FormEvent} from 'react';
import {renameSavedView, decodeViews, saveView, type RegisterFilters, type SavedView} from '@/lib/saved-views';
import {CopyRegisterLink} from './copy-register-link';
import {Button} from '../ui/button';
import {Input} from '../ui/input';

export function SavedViews({storageKey, filters, onApply}: {storageKey: string; filters: RegisterFilters; onApply: (filters: RegisterFilters) => void}) {
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
  function rename(previous: string) {
    setError(''); setMessage('');
    try {
      persist(renameSavedView(decodeViews(localStorage.getItem(storageKey)), previous, name));
      setName(''); setMessage('Saved view renamed.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Unable to rename saved view.'); }
  }
  function remove(name: string) {
    setError(''); setMessage('');
    try {
      persist(decodeViews(localStorage.getItem(storageKey)).filter(v => v.name !== name));
      setMessage(`Deleted “${name}”. Current filters were kept.`);
    } catch { setError('Could not delete this view. Browser storage is unavailable.'); }
  }
  return <section aria-label="Saved register views" className="mb-5 border-b pb-5">
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">Save current filters
        <Input value={name} onChange={e => setName(e.target.value)} maxLength={40} required placeholder="e.g. Verified deposits" />
      </label>
      <Button variant="outline" type="submit">Save view</Button>
    </form>
    <p className="mt-2 text-xs text-muted-foreground">{views.length}/5 saved on this screen · Stored in this browser only.</p>
    {views.length > 0 && <ul className="mt-3 flex flex-col gap-2">
      {views.map(view => <li key={view.name} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
        <span className="min-w-0 break-all text-sm">{view.name}</span>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" aria-label={`Apply ${view.name}`} onClick={() => {onApply({...view.filters}); setError(''); setMessage(`Applied “${view.name}”.`);}}>Apply</Button>
          <Button type="button" variant="ghost" size="sm" disabled={!name.trim()} aria-label={`Rename ${view.name}`} onClick={() => rename(view.name)}>Rename using name</Button>
          <CopyRegisterLink filters={view.filters} name={view.name}/>
          <Button type="button" variant="ghost" size="sm" aria-label={`Delete ${view.name}`} onClick={() => remove(view.name)}>Delete</Button>
        </div>
      </li>)}
    </ul>}
    <p role="status" className="mt-2 text-sm">{message}</p>
    {error && <p role="alert" className="mt-2 text-sm text-amber-300">{error}</p>}
  </section>;
}
