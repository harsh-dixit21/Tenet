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
