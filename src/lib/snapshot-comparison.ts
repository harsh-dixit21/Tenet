import type {Instrument, RequestItem} from '../components/workspace/store.ts';
import {amountMinor} from './workspace-utils.ts';

const statuses = [
  'Draft', 'Awaiting verification', 'Discrepancy', 'Verified', 'Release requested',
  'Released', 'Refunded', 'Discharged', 'Renewed', 'Replaced',
] as const;
const documentKinds = ['Instrument copy', 'Bank letter', 'Declaration', 'Approval letter', 'Other'] as const;
const requestStates = ['Pending', 'Approved', 'Rejected'] as const;

type SnapshotRequest = {id: string; type: RequestItem['type']; status: RequestItem['status']};
export type SnapshotRecord = {
  id: string;
  institution: string;
  institutionId: string;
  bank: string;
  branch: string;
  number: string;
  amountMinor: number;
  issued: string;
  maturity: string;
  status: Instrument['status'];
  parent: string;
  relation: string;
  documentCount: number;
  documentVersions: Partial<Record<typeof documentKinds[number], number>>;
  verifiedDate: string;
  requests: SnapshotRequest[];
};
export type WorkspaceSnapshot = {
  version: 1;
  format: 'tenet-workspace-baseline';
  capturedAt: string;
  mode: 'demo' | 'live';
  records: SnapshotRecord[];
};

export function createSnapshot(
  records: readonly Instrument[], requests: readonly RequestItem[],
  mode: WorkspaceSnapshot['mode'], capturedAt = new Date().toISOString(),
): WorkspaceSnapshot {
  const requestIndex = new Map<string, SnapshotRequest[]>();
  for (const request of requests) {
    const items = requestIndex.get(request.recordId) ?? [];
    items.push({id: request.id, type: request.type, status: request.status});
    requestIndex.set(request.recordId, items);
  }
  return {
    version: 1,
    format: 'tenet-workspace-baseline',
    capturedAt,
    mode,
    records: records.map(record => {
      const documentVersions: SnapshotRecord['documentVersions'] = {};
      for (const kind of documentKinds) {
        const versions = record.docs.filter(document => document.kind === kind)
          .map(document => document.version)
          .filter(version => Number.isSafeInteger(version) && version > 0);
        if (versions.length) documentVersions[kind] = Math.max(...versions);
      }
      return {
        id: record.id, institution: record.institution, institutionId: record.institutionId ?? '',
        bank: record.bank, branch: record.branch, number: record.number,
        amountMinor: amountMinor(record), issued: record.issued, maturity: record.maturity,
        status: record.status, parent: record.parent ?? '', relation: record.relation ?? '',
        documentCount: record.docs.length, documentVersions,
        verifiedDate: record.evidence?.date ?? '',
        requests: requestIndex.get(record.id) ?? [],
      };
    }),
  };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid baseline structure.');
  return value as Record<string, unknown>;
}
function text(value: unknown, required = false): string {
  if (typeof value !== 'string' || value.length > 1024 || (required && !value.trim())) {
    throw new Error('Invalid text field in the baseline.');
  }
  return value;
}
function integer(value: unknown, minimum: number, maximum: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error('Invalid numeric field in the baseline.');
  }
  return value;
}
function member<T extends string>(value: unknown, choices: readonly T[]): T {
  const matching = choices.find(choice => choice === value);
  if (matching === undefined) throw new Error('Unsupported value in the baseline.');
  return matching;
}
function list(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length > maximum) throw new Error('Baseline exceeds its supported collection limits.');
  return value;
}

export function readSnapshot(raw: string, mode: WorkspaceSnapshot['mode']): WorkspaceSnapshot {
  if (raw.length > 8 * 1024 * 1024) throw new Error('Choose a baseline of 8 MB or less.');
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new Error('The baseline is not valid JSON.');
  }
  const value = object(decoded);
  if (value.version !== 1 || value.format !== 'tenet-workspace-baseline') {
    throw new Error('Choose a supported Tenet workspace baseline.');
  }
  if (value.mode !== mode) throw new Error('Choose a baseline from the same workspace mode.');
  const capturedAt = text(value.capturedAt, true);
  if (!Number.isFinite(Date.parse(capturedAt))) throw new Error('The baseline capture time is invalid.');
  const recordIds = new Set<string>();
  const requestIds = new Set<string>();
  const records = list(value.records, 500).map(rawRecord => {
    const row = object(rawRecord);
    const id = text(row.id, true);
    if (recordIds.has(id)) throw new Error('The baseline repeats an instrument ID.');
    recordIds.add(id);
    const documentVersions: SnapshotRecord['documentVersions'] = {};
    const versions = object(row.documentVersions);
    for (const kind of documentKinds) {
      if (Object.hasOwn(versions, kind)) documentVersions[kind] = integer(versions[kind], 1, Number.MAX_SAFE_INTEGER);
    }
    const requests = list(row.requests, 500).map(rawRequest => {
      const request = object(rawRequest);
      const requestId = text(request.id, true);
      if (requestIds.has(requestId)) throw new Error('The baseline repeats a request ID.');
      requestIds.add(requestId);
      if (requestIds.size > 500) throw new Error('Baseline exceeds its supported request limit.');
      return {id: requestId, type: member(request.type, ['Release', 'Refund', 'Discharge'] as const),
        status: member(request.status, requestStates)};
    });
    return {
      id, institution: text(row.institution), institutionId: text(row.institutionId),
      bank: text(row.bank), branch: text(row.branch), number: text(row.number),
      amountMinor: integer(row.amountMinor, 0, 1e14),
      issued: text(row.issued), maturity: text(row.maturity), status: member(row.status, statuses),
      parent: text(row.parent), relation: member(row.relation, ['', 'Renewal', 'Replacement'] as const),
      documentCount: integer(row.documentCount, 0, 100), documentVersions,
      verifiedDate: text(row.verifiedDate), requests,
    };
  });
  return {version: 1, format: 'tenet-workspace-baseline', capturedAt, mode, records};
}

export type Change = {
  id: string;
  group: string;
  label: string;
  before: string | number;
  after: string | number;
};
export type RecordComparison = {
  record: SnapshotRecord;
  previous?: SnapshotRecord;
  changes: Change[];
};
type Comparison = {
  id: string;
  group: string;
  label: string;
  value(record: SnapshotRecord, referenceDay: string): Change['before'];
};
const comparisons: Comparison[] = [
  {id: 'verified-date', group: 'Evidence', label: 'Verification date', value: record => record.verifiedDate},
  {id: 'other-version', group: 'Evidence', label: 'Other version', value: record => record.documentVersions['Other'] ?? 0},
  {id: 'approval-letter-version', group: 'Evidence', label: 'Approval letter version', value: record => record.documentVersions['Approval letter'] ?? 0},
  {id: 'declaration-version', group: 'Evidence', label: 'Declaration version', value: record => record.documentVersions['Declaration'] ?? 0},
  {id: 'bank-letter-version', group: 'Evidence', label: 'Bank letter version', value: record => record.documentVersions['Bank letter'] ?? 0},
  {id: 'instrument-copy-version', group: 'Evidence', label: 'Instrument copy version', value: record => record.documentVersions['Instrument copy'] ?? 0},
  {id: 'document-count', group: 'Evidence', label: 'Evidence entries', value: record => record.documentCount},
  {id: 'relation', group: 'Lifecycle', label: 'Successor classification', value: record => record.relation},
  {id: 'parent', group: 'Lifecycle', label: 'Predecessor', value: record => record.parent},
  {id: 'institution', group: 'Identity', label: 'Institution', value: record => record.institution},
  {id: 'number', group: 'Identity', label: 'Instrument number', value: record => record.number},
  {id: 'branch', group: 'Identity', label: 'Branch', value: record => record.branch},
  {id: 'bank', group: 'Identity', label: 'Bank', value: record => record.bank},
  {id: 'issue', group: 'Dates', label: 'Issue date', value: record => record.issued},
  {id: 'maturity', group: 'Dates', label: 'Maturity date', value: record => record.maturity},
  {id: 'amount', group: 'Value', label: 'Face value in paise', value: record => record.amountMinor},
  {id: 'status', group: 'Lifecycle', label: 'Lifecycle state', value: record => record.status},
];

export function compareSnapshots(baseline: WorkspaceSnapshot, current: WorkspaceSnapshot, referenceDay: string) {
  const previous = new Map(baseline.records.map(record => [record.id, record]));
  return current.records.map((record): RecordComparison => {
    const old = previous.get(record.id);
    if (!old) return {record, changes: [{id: 'added', group: 'Membership', label: 'New in current snapshot', before: 'Absent', after: 'Present'}]};
    const changes = comparisons.flatMap(comparison => {
      const before = comparison.value(old, referenceDay);
      const after = comparison.value(record, referenceDay);
      return before === after ? [] : [{id: comparison.id, group: comparison.group, label: comparison.label, before, after}];
    });
    return {record, previous: old, changes};
  });
}

export function unavailableBaselineCount(baseline: WorkspaceSnapshot, current: WorkspaceSnapshot) {
  const currentIds = new Set(current.records.map(record => record.id));
  return baseline.records.filter(record => !currentIds.has(record.id)).length;
}
