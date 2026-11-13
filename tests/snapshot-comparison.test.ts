import assert from 'node:assert/strict';
import test from 'node:test';
import type {Instrument, RequestItem} from '../src/components/workspace/store.ts';
import {
  comparableValueDelta, compareSnapshots, comparisonCsvRows, comparisonReport, createSnapshot,
  inActiveComparison, readSnapshot, unavailableBaselineCount,
} from '../src/lib/snapshot-comparison.ts';

const instrument: Instrument = {
  id: 'FDR-A', institution: 'Northfield College', institutionId: 'northfield',
  bank: 'Sample Bank', branch: 'Main Branch', number: '123', amount: 1000, amountMinor: 100000,
  issued: '2026-01-01', maturity: '2026-12-01', status: 'Verified', docs: [],
};
const request: RequestItem = {
  id: 'REQ-A', recordId: 'FDR-A', status: 'Pending', type: 'Release',
  reason: 'PRIVATE REQUEST REASON', date: '2026-11-12',
};
const date = '2026-11-14';
const capture = '2026-11-14T06:00:00Z';

test('baseline round trips only the supported metadata fields', () => {
  const record = {...instrument, docs: [{
    id: 'd', name: 'document.pdf', kind: 'Bank letter', version: 3,
    date, data: 'PRIVATE FILE DATA', path: 'PRIVATE STORAGE PATH', size: 200,
  }], evidence: {source: 'PRIVATE SOURCE', reference: 'PRIVATE REF', date, note: 'PRIVATE NOTE'}};
  const original = createSnapshot([record], [request], 'demo', capture);
  const json = JSON.stringify(original);
  assert.doesNotMatch(json, /PRIVATE/);
  assert.deepEqual(readSnapshot(json, 'demo'), original);
  assert.equal(original.records[0].documentVersions['Bank letter'], 3);
  assert.throws(() => readSnapshot(json, 'live'), /same workspace mode/);
  assert.throws(() => readSnapshot('{', 'demo'), /not valid JSON/);
});

test('imports reject duplicate records and requests and oversized collections', () => {
  const baseline = createSnapshot([instrument], [request], 'demo', capture);
  const row = baseline.records[0];
  assert.throws(() => readSnapshot(JSON.stringify({...baseline, records: [row, row]}), 'demo'), /instrument ID/);
  assert.throws(() => readSnapshot(JSON.stringify({...baseline, records: [
    {...row, requests: [...row.requests, ...row.requests]},
  ]}), 'demo'), /request ID/);
  assert.throws(() => readSnapshot(JSON.stringify({...baseline, records: Array(501).fill(row)}), 'demo'), /collection limits/);
  assert.throws(() => readSnapshot(JSON.stringify({...baseline, records: [{...row, amountMinor: 1.25}]}), 'demo'), /numeric field/);
});

test('comparison tracks decisions and leaves unavailable baseline instruments out of rows', () => {
  const baseline = createSnapshot([instrument, {...instrument, id: 'unavailable'}], [request], 'demo', capture);
  const current = createSnapshot([
    {...instrument, amountMinor: 110005, maturity: '2026-11-17', status: 'Released'},
    {...instrument, id: 'new'},
  ], [{...request, status: 'Approved'}], 'demo', capture);
  const rows = compareSnapshots(baseline, current, date);
  assert.deepEqual(rows.map(row => row.record.id), ['FDR-A', 'new']);
  assert.equal(unavailableBaselineCount(baseline, current), 1);
  assert.equal(comparableValueDelta(rows), 10005n);
  assert.equal(inActiveComparison(rows[0]), true);
  assert.ok(rows[0].changes.some(change => change.id === 'active'));
  assert.ok(rows[0].changes.some(change => change.id === 'maturity-window' && change.after === 'Within 7 days'));
  assert.ok(rows[0].changes.some(change => change.id === 'request-status:REQ-A' && change.after === 'Approved'));
  assert.equal(rows[1].changes[0].id, 'added');
  const report = comparisonReport(rows, baseline, date);
  assert.equal(report.comparableValueDeltaMinor, '10005');
  assert.equal(JSON.stringify(report).includes('unavailable'), false);
  assert.equal(comparisonCsvRows(rows).length, 1 + rows[0].changes.length + rows[1].changes.length);
});

test('aggregate paise totals stay exact above the safe Number range', () => {
  const records = Array.from({length: 100}, (_, index) => ({
    ...instrument, id: 'FDR-' + index, amountMinor: 1,
  }));
  const baseline = createSnapshot(records, [], 'demo', capture);
  const current = createSnapshot(records.map(record => ({...record, amountMinor: 1e14})), [], 'demo', capture);
  assert.equal(comparableValueDelta(compareSnapshots(baseline, current, date)), 9999999999999900n);
});
