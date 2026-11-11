import {parseHash} from './workspace-utils.ts';

export function controlsHref({check, record}: {check?: string; record?: string} = {}) {
  const parameters = new URLSearchParams();
  if (check) parameters.set('check', check);
  if (record) parameters.set('record', record);
  const query = parameters.toString();
  return '#controls' + (query ? '?' + query : '');
}

export function readControlsCheck(hash: string) {
  const {params, route} = parseHash(hash);
  const checks = params.getAll('check');
  return route === 'controls' && checks.length === 1 ? checks[0] : '';
}
