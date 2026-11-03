import {defaultRegisterFilters, validFilters, type RegisterFilters} from './saved-views';

export function readRegisterLink(params: URLSearchParams): RegisterFilters | null {
  if (params.get('filters') !== '1') return null;
  const filters = {
    query: params.get('q') ?? defaultRegisterFilters.query,
    status: params.get('status') ?? defaultRegisterFilters.status,
    sort: params.get('sort') ?? defaultRegisterFilters.sort,
    bank: params.get('bank') ?? defaultRegisterFilters.bank,
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    activeOnly: params.get('active') === '1',
    pageSize: Number(params.get('rows') ?? defaultRegisterFilters.pageSize),
  };
  return validFilters(filters) ? filters : null;
}

export function registerLink(href: string, filters: RegisterFilters): string {
  if (!validFilters(filters)) throw new Error('Check the filters and date range before copying.');
  const url = new URL(href);
  const [route, query] = url.hash.slice(1).split('?', 2);
  const current = new URLSearchParams(query);
  const params = new URLSearchParams({filters: '1'});
  for (const key of ['institution', 'institutionId']) {
    const scope = current.get(key);
    if (scope) params.set(key, scope);
  }
  const values = {
    q: filters.query, status: filters.status, sort: filters.sort, bank: filters.bank,
    from: filters.from, to: filters.to, active: filters.activeOnly ? '1' : '',
    rows: String(filters.pageSize),
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  url.hash = route + '?' + params.toString();
  return url.href;
}

export function isRegisterLink(hash: string): boolean {
  const [route, query] = hash.slice(1).split('?', 2);
  return ['records', 'review', 'maturity'].includes(route) &&
    readRegisterLink(new URLSearchParams(query)) !== null;
}
