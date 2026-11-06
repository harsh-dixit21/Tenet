import {useState, type FormEvent} from 'react';
import {duplicateWatchlist, createWatchlist, deleteWatchlist, renameWatchlist, type Watchlist} from '@/lib/watchlists';
import {Button} from '../ui/button';
import {download, csv} from './store';
import {Input} from '../ui/input';
type Props = {
  lists: Watchlist[]; selected: string; onSelect: (name: string) => void;
  update: (transform: (lists: Watchlist[]) => Watchlist[], message: string) => boolean;
};
export function WatchlistControls({lists, selected, onSelect, update}: Props) {
  const [name, setName] = useState('');
  function create(event: FormEvent) {
    event.preventDefault();
    if (update(current => createWatchlist(current, name), 'Watchlist created.')) {
      onSelect(name.trim()); setName('');
    }
  }
  return <section aria-label="Instrument watchlists" className="mb-5 space-y-3 border-b pb-5">
    <p className="text-sm font-medium">Watchlists</p>
    <p className="text-xs text-muted-foreground">Keep important instruments together in this browser.</p>
    <form onSubmit={create} className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">Watchlist name
        <Input value={name} onChange={event => setName(event.target.value)} maxLength={40} required/>
      </label>
      <Button type="submit" variant="outline">Create watchlist</Button>
    </form>
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm">Current watchlist
        <select className="workspace-select max-w-full" value={selected} onChange={event => onSelect(event.target.value)}>
          <option value="">Select a watchlist</option>
          {lists.map(list => <option key={list.name} value={list.name}>{list.name}</option>)}
        </select>
      </label>
      <Button type="button" variant="outline" disabled={!selected || !name.trim()} onClick={() => {
        if (update(current => renameWatchlist(current, selected, name), 'Watchlist renamed.')) {
          onSelect(name.trim()); setName('');
        }
      }}>Rename using name</Button>
      <Button type="button" variant="outline" disabled={!selected || !name.trim()} onClick={() => {
        if (update(current => duplicateWatchlist(current, selected, name), 'Watchlist duplicated.')) {
          onSelect(name.trim()); setName('');
        }
      }}>Duplicate using name</Button>
      <Button type="button" variant="ghost" disabled={!selected} onClick={() => {
        if (update(current => deleteWatchlist(current, selected), 'Watchlist deleted.')) onSelect('');
      }}>Delete watchlist</Button>
      <Button type="button" variant="outline" disabled={!selected} onClick={() => {
        const list = lists.find(item => item.name === selected);
        if (list) download('tenet-watchlist.csv', csv([['Watchlist', 'Instrument ID'], ...list.ids.map(id => [list.name, id])]));
      }}>Export watchlist IDs</Button>
    </div>
  </section>;
}
