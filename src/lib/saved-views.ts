export type RegisterFilters = {
  query: string; status: string; sort: string; bank: string;
  from: string; to: string; activeOnly: boolean; pageSize: number;
};
export const defaultRegisterFilters: RegisterFilters = {
  query: '', status: 'All', sort: 'maturity', bank: 'All',
  from: '', to: '', activeOnly: false, pageSize: 10,
};

export type SavedView = {name: string; filters: RegisterFilters};
export const SAVED_VIEW_LIMIT = 5;
const statuses = ['All','Draft','Awaiting verification','Discrepancy','Verified','Release requested','Released','Refunded','Discharged','Renewed','Replaced'];
const validDate = (value: unknown): value is string => typeof value === 'string' && (value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value));
export function validFilters(value: unknown): value is RegisterFilters {
  if (!value || typeof value !== 'object') return false;
  const f = value as RegisterFilters;
  return typeof f.query === 'string' && f.query.length <= 200 &&
    statuses.includes(f.status) && ['priority','maturity','amount','institution'].includes(f.sort) &&
    typeof f.bank === 'string' && f.bank.length <= 100 && validDate(f.from) && validDate(f.to) &&
    (!f.from || !f.to || f.from <= f.to) && typeof f.activeOnly === 'boolean' && [10,25,50].includes(f.pageSize);
}
export function decodeViews(raw: string | null): SavedView[] {
  try {
    const data = JSON.parse(raw || 'null');
    if (data?.version !== 1 || !Array.isArray(data.views)) return [];
    const names = new Set<string>();
    return data.views.filter((v: SavedView) => {
      if (!v || typeof v.name !== 'string' || !v.name.trim() || v.name.length > 40 || !validFilters(v.filters)) return false;
      const name = v.name.trim().toLowerCase();
      if (names.has(name)) return false;
      names.add(name); return true;
    }).slice(0, SAVED_VIEW_LIMIT);
  } catch { return []; }
}
export function saveView(views: SavedView[], name: string, filters: RegisterFilters): SavedView[] {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 40) throw new Error('Use a view name from 1 to 40 characters.');
  if (!validFilters(filters)) throw new Error('Check the filters and date range before saving.');
  if (views.some(v => v.name.toLowerCase() === trimmed.toLowerCase())) throw new Error('That view name already exists. Choose another name.');
  if (views.length >= SAVED_VIEW_LIMIT) throw new Error('You can save five views per screen. Delete one to make room.');
  return [...views, {name: trimmed, filters: {...filters}}];
}
export const viewsKey = (account: string, screen: string) => `tenet-saved-views-v1:${encodeURIComponent(account)}:${encodeURIComponent(screen)}`;
export function renameSavedView(views: SavedView[], previous: string, name: string): SavedView[] {
  const existing = views.find(view => view.name === previous);
  if (!existing) throw new Error('This saved view was removed.');
  const others = views.filter(view => view.name !== previous);
  const renamed = saveView(others, name, existing.filters).at(-1)!;
  return views.map(view => view.name === previous ? renamed : view);
}
