import assert from 'node:assert/strict';
import test from 'node:test';
import {
  controlSummaryRows, controls, findingCsvRows, findingsFrom, institutionKey, reviewControls,
  reviewInstitutions, scopeControlResults, searchControlResults, successorCycles,
} from '../src/lib/controls-review.ts';
import {controlsHref, readControlsCheck, readControlsRecord} from '../src/lib/control-links.ts';
import {csvCell} from '../src/lib/workspace-utils.ts';
import type {DocumentItem, Instrument, RequestItem} from '../src/components/workspace/store.ts';

const document: DocumentItem = {
  id: 'evidence-1', name: 'confirmation.pdf', kind: 'Bank letter', version: 1,
  date: '2026-11-10', data: '', size: 128,
};
const instrument: Instrument = {
  id: 'FDR-A', institutionId: 'institution-a', institution: 'Northfield College',
  bank: 'Example Bank', branch: 'Main Branch', number: 'FDR-123',
  amount: 100.25, amountMinor: 10025, issued: '2026-01-01', maturity: '2026-12-01',
  status: 'Draft', docs: [document], createdBy: 'maker',
};
const request: RequestItem = {
  id: 'request-a', recordId: 'FDR-A', institutionId: 'institution-a', createdBy: 'requester',
  type: 'Release', status: 'Pending', reason: 'Synthetic request', date: '2026-11-11',
};

function evaluate(records: Instrument[], requests: RequestItem[] = [], live = true) {
  return reviewControls({records, requests, today: '2026-11-12', live});
}

function ids(records: Instrument[], requests: RequestItem[] = [], live = true) {
  return findingsFrom(evaluate(records, requests, live)).map(finding => finding.control.id);
}

test('valid instruments produce no findings and legacy demo fields skip live-only checks', () => {
  assert.equal(controls.length, 32);
  assert.equal(new Set(controls.map(control => control.id)).size, 32);
  assert.deepEqual(ids([instrument]), []);
  const legacy = {...instrument, status: 'Verified' as const, amountMinor: undefined,
    institutionId: undefined, createdBy: undefined};
  const result = evaluate([legacy], [], false);
  assert.deepEqual(findingsFrom(result), []);
  const summary = controlSummaryRows(result);
  const skipped = summary.find(row => row[0] === 'Detect missing live verifier identities');
  assert.deepEqual(skipped?.slice(3), ['Live data required', '']);
  assert.ok(ids([legacy]).includes('verifier-identity'));
});

test('paise reconciliation and calendar checks distinguish mismatches and impossible dates', () => {
  assert.ok(ids([{...instrument, amountMinor: 10024}]).includes('paise-reconciliation'));
  assert.ok(ids([{...instrument, amount: 1.001}]).includes('amount-validity'));
  assert.deepEqual(ids([{...instrument, issued: '2026-02-30'}]), ['issue-date']);
  assert.ok(ids([{...instrument, issued: '2026-11-13'}]).includes('future-issue'));
  assert.ok(ids([{...instrument, maturity: instrument.issued}]).includes('instrument-chronology'));
  assert.deepEqual(ids([{...instrument, verifiedAt: '2026-02-30T09:00:00Z'}]), ['verification-timestamp']);
  assert.deepEqual(ids([{...instrument, createdAt: '2026-11-12T10:00:00+05:30',
    updatedAt: '2026-11-12T04:31:00Z'}]), []);
});

test('evidence version gaps and duplicate versions have independent findings', () => {
  const valid = {...instrument, docs: [document, {...document, id: 'evidence-2', version: 2}]};
  assert.deepEqual(ids([valid]), []);
  assert.deepEqual(ids([{...valid, docs: [document, {...document, id: 'evidence-3', version: 3}]}]),
    ['document-version-gap']);
  assert.deepEqual(ids([{...valid, docs: [document, {...document, id: 'evidence-2'}]}]),
    ['document-version-duplicate']);
  const malformed = {...document, mime: 'image/png', sha256: 'unavailable', data: 'private evidence', path: 'private path'};
  const findings = findingsFrom(evaluate([{...instrument, docs: [malformed]}]));
  assert.deepEqual(findings.map(finding => finding.control.id), ['checksum-format', 'document-format']);
  assert.equal(JSON.stringify(findingCsvRows(findings)).includes('private'), false);
});

test('request checks reconcile state and use explicit actor identity without exposing it', () => {
  const release = {...instrument, status: 'Release requested' as const, verifiedBy: 'verifier'};
  assert.deepEqual(ids([release], [request]), []);
  assert.deepEqual(ids([release]), ['pending-link']);
  assert.deepEqual(ids([release], [request, {...request, id: 'request-b'}]), ['parallel-pending-requests']);
  const decided = {...request, status: 'Approved' as const, decidedBy: 'verifier', institutionId: 'other'};
  const findings = findingsFrom(evaluate([{...release, status: 'Released'}], [decided]));
  assert.deepEqual(findings.map(finding => finding.control.id), ['request-institution', 'decision-separation']);
  assert.equal(findingCsvRows(findings).flat().includes('verifier'), false);
  assert.deepEqual(ids([instrument], [{...request, recordId: 'unavailable'}]), []);
});

test('cycles include only their members and renewal checks use loaded predecessors', () => {
  const first = {...instrument, id: 'A', parent: 'B'};
  const second = {...instrument, id: 'B', parent: 'A'};
  const prefix = {...instrument, id: 'prefix', parent: 'A'};
  const self = {...instrument, id: 'self', parent: 'self'};
  const unknown = {...instrument, id: 'unknown', parent: 'absent', relation: 'Renewal' as const};
  assert.deepEqual([...successorCycles([prefix, first, second, self, unknown])], ['A', 'B', 'self']);
  assert.deepEqual(ids([unknown]), []);
  const renewal = {...instrument, id: 'renewal', parent: instrument.id, relation: 'Renewal' as const};
  const scoped = scopeControlResults(evaluate([instrument, renewal]), new Set(['renewal']));
  assert.deepEqual(findingsFrom(scoped).map(finding => finding.control.id), ['renewal-extension']);
});

test('institution grouping keeps distinct identifiers and searches preserve observation scope', () => {
  const second = {...instrument, id: 'FDR-B', institutionId: 'institution-b', amountMinor: 10024};
  const first = {...instrument, amountMinor: 10024};
  const options = reviewInstitutions([first, second]);
  assert.equal(options.length, 2);
  assert.notEqual(options[0].label, options[1].label);
  assert.notEqual(institutionKey(first), institutionKey(second));
  const results = evaluate([first, second]);
  const names = new Map([[first.id, 'Northfield'], [second.id, 'Westbridge']]);
  const searched = searchControlResults(results, 'paise westbridge', names);
  assert.deepEqual(findingsFrom(searched).map(finding => finding.recordId), ['FDR-B']);
  assert.deepEqual(findingsFrom(searchControlResults(results, 'stored rupees', names))
    .map(finding => finding.recordId), ['FDR-A', 'FDR-B']);
});

test('control links preserve encoded references and reject ambiguous record scope', () => {
  const href = controlsHref({check: 'paise-reconciliation', record: 'A+B & #123'});
  assert.equal(readControlsCheck(href), 'paise-reconciliation');
  assert.equal(readControlsRecord(href), 'A+B & #123');
  assert.equal(readControlsRecord('#controls?record=A&record=B'), null);
  assert.equal(readControlsRecord('#controls?record='), null);
  assert.equal(readControlsRecord('#controls'), undefined);
  const unsafe = {...instrument, id: '=SUM(1,2)', amountMinor: 10024};
  const rows = findingCsvRows(findingsFrom(evaluate([unsafe])));
  assert.equal(csvCell(rows[1][0]), '"\'=SUM(1,2)"');
});
