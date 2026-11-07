import test from 'node:test';
import assert from 'node:assert/strict';
import * as p from '../src/lib/portfolio.ts';
import type {Instrument, RequestItem, EventItem} from '../src/components/workspace/store.ts';
const record = (patch: Partial<Instrument> = {}): Instrument => ({id: 'A', institution: 'Alpha College', bank: 'State Bank', branch: 'Main', number: 'N-001', amount: 100, amountMinor: 10000, issued: '2026-01-01', maturity: '2026-11-15', status: 'Verified', docs: [], ...patch});
const records = [record(), record({id:'B',institution:'Beta College',bank:'Other Bank',number:'N-002',amount:200,amountMinor:20000,maturity:'2026-12-01',status:'Discrepancy'}), record({id:'C',number:'N-003',amount:50,amountMinor:5000,maturity:'2026-10-01',status:'Released'})];
const filter = (patch: Partial<p.PortfolioFilters> = {}) => p.filterPortfolio(records, {query:'', ...patch}, '2026-11-08');

test('portfolio search combines tokens and preserves authorized input records', () => {
  assert.deepEqual(filter({query:'alpha N-001'}).map(record=>record.id), ['A']);
  assert.equal(filter({query:'unmatched'}).length, 0);
  assert.equal(p.totalMinor(records),35000);
  assert.equal(records.length,3);
  assert.equal(p.filterPortfolio([record({institution:'École'})],{query:'ecole'},'2026-11-08').length,1);
});

test('bank filter uses exact names',()=>{assert.deepEqual(filter({bank:'Other Bank'}).map(r=>r.id),['B']);assert.equal(filter({bank:'Bank'}).length,0);assert.deepEqual(p.distinct(records,'bank'),['Other Bank','State Bank']);});

test('institution scope combines with bank',()=>{assert.equal(filter({institution:'Alpha College'}).length,2);assert.equal(filter({institution:'Alpha College',bank:'Other Bank'}).length,0);});
