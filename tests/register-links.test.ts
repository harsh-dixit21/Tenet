import test from 'node:test';
import assert from 'node:assert/strict';
import {isRegisterLink, readRegisterLink, registerLink} from '../src/lib/register-links.ts';
import {defaultRegisterFilters} from '../src/lib/saved-views.ts';

test('filter links round-trip punctuation, Unicode and institution scope', () => {
  const filters = {...defaultRegisterFilters, query:'Caf\u00e9? # & +', status:'Verified', from:'2026-01-01', to:'2026-12-31', activeOnly:true, pageSize:25};
  const url = new URL(registerLink('https://example.test/portal/#records?institutionId=school-1&extra=old', filters));
  const params = new URLSearchParams(url.hash.split('?')[1]);
  assert.deepEqual(readRegisterLink(params), filters);
  assert.equal(params.get('institutionId'), 'school-1');
  assert.equal(params.has('extra'), false);
  assert.equal(isRegisterLink(url.hash), true);
});

test('invalid links fall back and unrelated routes cannot redirect sign-in', () => {
  for (const query of ['filters=2', 'filters=1&rows=0', 'filters=1&from=2026-12-31&to=2026-01-01', 'filters=1&status=unknown']) {
    assert.equal(readRegisterLink(new URLSearchParams(query)), null);
  }
  assert.equal(isRegisterLink('#instrument?filters=1'), false);
  assert.throws(() => registerLink('https://example.test/portal/#records', {...defaultRegisterFilters, pageSize:100}));
});

test('ambiguous link flags and duplicate parameters are rejected', () => {
  for (const query of ['filters=1&active=maybe','filters=1&rows=10&rows=50','filters=1&q=a&q=b'])
    assert.equal(readRegisterLink(new URLSearchParams(query)), null);
});
