import {useEffect, useState} from 'react';
import {readWatchlists, type Watchlist} from '@/lib/watchlists';
export function useWatchlists(key: string) {
  const [lists, setLists] = useState<Watchlist[]>(() => {
    try { return readWatchlists(localStorage.getItem(key)); } catch { return []; }
  });
  const [notice, setNotice] = useState('');
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
      const next = transform(readWatchlists(localStorage.getItem(key)));
      localStorage.setItem(key, JSON.stringify({version: 1, lists: next}));
      setLists(next); setNotice(message); return true;
    } catch (error) {
      setNotice(error instanceof Error && !['SecurityError', 'QuotaExceededError'].includes(error.name)
        ? error.message : 'Browser storage is unavailable. Try again when storage is enabled.');
      return false;
    }
  }
  return {lists, notice, update};
}
