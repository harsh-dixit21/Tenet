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
