import {useEffect, useState} from 'react';
import {readWatchlists, type Watchlist} from '@/lib/watchlists';
export function useWatchlists(key: string) {
  const [lists, setLists] = useState<Watchlist[]>(() => {
    try { return readWatchlists(localStorage.getItem(key)); } catch { return []; }
  });
  const [notice, setNotice] = useState('');
  const [previous, setPrevious] = useState<{before: Watchlist[]; after: string} | null>(null);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.storageArea === localStorage && (event.key === key || event.key === null))
        setLists(readWatchlists(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key]);
  function update(transform: (current: Watchlist[]) => Watchlist[], message: string) {
    try {
      const before = readWatchlists(localStorage.getItem(key));
      const next = transform(before);
      localStorage.setItem(key, JSON.stringify({version: 1, lists: next}));
      setPrevious({before, after: JSON.stringify({version: 1, lists: next})});
      setLists(next); setNotice(message); return true;
    } catch (error) {
      setNotice(error instanceof Error && !['SecurityError', 'QuotaExceededError'].includes(error.name)
        ? error.message : 'Browser storage is unavailable. Try again when storage is enabled.');
      return false;
    }
  }
  function undo() {
    if (!previous) return;
    try {
      if (localStorage.getItem(key) !== previous.after) {
        setPrevious(null); setNotice('Watchlists changed in another tab. Undo is no longer available.'); return;
      }
      localStorage.setItem(key, JSON.stringify({version: 1, lists: previous.before}));
      setLists(previous.before); setPrevious(null); setNotice('Last watchlist change undone.');
    } catch { setNotice('Unable to undo while browser storage is unavailable.'); }
  }
  return {lists, notice, update, undo, canUndo: !!previous};
}
