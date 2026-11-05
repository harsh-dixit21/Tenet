export type Watchlist = {name: string; ids: string[]};
export const watchlistKey = (account: string) => 'tenet-watchlists-v1:' + encodeURIComponent(account);
export function readWatchlists(raw: string | null): Watchlist[] {
  try {
    const data = JSON.parse(raw || 'null');
    if (data?.version !== 1 || !Array.isArray(data.lists)) return [];
    const names = new Set<string>();
    return data.lists.filter((list: Watchlist) => {
      if (!list || typeof list.name !== 'string' || !list.name.trim() || list.name.length > 40 ||
          !Array.isArray(list.ids) || list.ids.length > 500 ||
          !list.ids.every(id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,120}$/.test(id)) ||
          names.has(list.name.toLowerCase())) return false;
      names.add(list.name.toLowerCase());
      return true;
    }).slice(0, 5).map((list: Watchlist) => ({...list, ids: [...new Set(list.ids)]}));
  } catch { return []; }
}
function checkedName(lists: Watchlist[], name: string, previous?: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) throw new Error('Use a name from 1 to 40 characters.');
  if (lists.some(list => list.name !== previous && list.name.toLowerCase() === trimmed.toLowerCase()))
    throw new Error('That watchlist name already exists.');
  return trimmed;
}
export function createWatchlist(lists: Watchlist[], name: string): Watchlist[] {
  const trimmed = checkedName(lists, name);
  if (lists.length >= 5) throw new Error('You can keep five watchlists. Delete one to make room.');
  return [...lists, {name: trimmed, ids: []}];
}
