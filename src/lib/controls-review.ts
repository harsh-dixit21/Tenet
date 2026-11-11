import {validateUpload} from './workspace-utils.ts';
import {validDate} from './portfolio.ts';
import type {DocumentItem, Instrument, RequestItem} from '../components/workspace/store.ts';

export type ControlCategory = 'Instrument' | 'Verification' | 'Documents' | 'Requests' | 'Successors';
export type ControlLevel = 'Inconsistency' | 'Review';

export type ReviewSnapshot = {
  records: readonly Instrument[];
  requests: readonly RequestItem[];
  today: string;
  live: boolean;
};

type Observation = {recordId: string; subject?: string};
type ControlInfo = {
  id: string;
  title: string;
  category: ControlCategory;
  level: ControlLevel;
  description: string;
  liveOnly?: boolean;
};
export type Control = ControlInfo & {inspect(snapshot: ReviewSnapshot): Observation[]};
export type ControlResult = {control: Control; evaluated: boolean; observations: Observation[]};
export type Finding = Observation & {control: Control};

function recordControl(info: ControlInfo, matches: (record: Instrument, snapshot: ReviewSnapshot) => boolean): Control {
  return {
    ...info,
    inspect: snapshot => snapshot.records.filter(record => matches(record, snapshot)).map(record => ({recordId: record.id})),
  };
}

function instrumentDate(value: string) {
  return validDate(value) && value >= '1900-01-01' && value <= '2199-12-31';
}

function exceedsTextLimit(value: string, limit: number) {
  return typeof value !== 'string' || !value.trim() || value.trim().length > limit;
}

const verifiedStates = new Set(['Verified', 'Release requested', 'Released', 'Refunded', 'Discharged', 'Renewed', 'Replaced']);

function timestamp(value: string) {
  const validPrefix = /^\d{4}-\d{2}-\d{2}T/.test(value) && validDate(value.slice(0, 10));
  return validPrefix ? Date.parse(value) : NaN;
}

function documentControl(info: ControlInfo, matches: (document: DocumentItem, snapshot: ReviewSnapshot) => boolean): Control {
  return {
    ...info,
    inspect: snapshot => snapshot.records.flatMap(record => record.docs
      .filter(document => matches(document, snapshot))
      .map(document => ({recordId: record.id, subject: document.id}))),
  };
}

function duplicates<T>(values: readonly T[], key: (value: T) => string) {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    const id = key(value);
    if (seen.has(id)) repeated.add(id);
    seen.add(id);
  }
  return repeated;
}

function hasVersionGap(record: Instrument) {
  const versionsByKind = new Map<string, Set<number>>();
  for (const document of record.docs) {
    if (!Number.isSafeInteger(document.version) || document.version < 1) continue;
    const versions = versionsByKind.get(document.kind) ?? new Set<number>();
    versions.add(document.version);
    versionsByKind.set(document.kind, versions);
  }
  return [...versionsByKind.values()].some(versions =>
    [...versions].sort((a, b) => a - b).some((version, index) => version !== index + 1));
}

const documentKinds = new Set(['Instrument copy', 'Bank letter', 'Declaration', 'Approval letter', 'Other']);

const checksumPattern = /^[a-f0-9]{64}$/i;

export const controls: Control[] = [
  recordControl({
    id: 'paise-reconciliation',
    title: 'Stored rupees disagree with stored paise',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'Compare the saved INR value with the authoritative integer amount in paise.',
  }, record => Number.isSafeInteger(record.amountMinor) && Number.isFinite(record.amount) &&
    Math.round(record.amount * 100) !== record.amountMinor),
  recordControl({
    id: 'amount-validity',
    title: 'Detect invalid instrument amounts',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'Review missing, nonpositive, out of range or sub-paise INR amounts and invalid stored paise.',
  }, record => {
    const scaled = record.amount * 100;
    const invalidRupees = !Number.isFinite(record.amount) || record.amount <= 0 ||
      record.amount > 1e12 || Math.abs(scaled - Math.round(scaled)) > 0.001;
    const invalidPaise = record.amountMinor !== undefined &&
      (!Number.isSafeInteger(record.amountMinor) || record.amountMinor <= 0 || record.amountMinor > 1e14);
    return invalidRupees || invalidPaise;
  }),
  recordControl({
    id: 'issue-date',
    title: 'Identify invalid instrument issue dates',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'The issue date must be a real calendar date between 1900 and 2199.',
  }, record => !instrumentDate(record.issued)),
  recordControl({
    id: 'maturity-date',
    title: 'Identify invalid instrument maturity dates',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'The maturity date must be a real calendar date between 1900 and 2199.',
  }, record => !instrumentDate(record.maturity)),
  recordControl({
    id: 'instrument-chronology',
    title: 'Flag maturities on or before issue dates',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'Maturity must follow the issue date when both dates are valid.',
  }, record => instrumentDate(record.issued) && instrumentDate(record.maturity) && record.maturity <= record.issued),
  recordControl({
    id: 'future-issue',
    title: 'Flag future instrument issue dates',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'The issue date is later than the current India calendar date.',
  }, (record, snapshot) => instrumentDate(record.issued) && record.issued > snapshot.today),
  recordControl({
    id: 'instrument-identity',
    title: 'Check bank branch and instrument identifiers',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'Review blank bank, branch or instrument-number fields and values above their submission limits.',
  }, record => exceedsTextLimit(record.bank, 100) || exceedsTextLimit(record.branch, 100) ||
    exceedsTextLimit(record.number, 60)),
  recordControl({
    id: 'institution-link',
    title: 'Detect missing live institution identifiers',
    category: 'Instrument',
    level: 'Review',
    description: 'The live instrument has no recorded institution identifier.',
    liveOnly: true,
  }, record => !record.institutionId?.trim()),
  recordControl({
    id: 'creator-identity',
    title: 'Detect missing live submission creators',
    category: 'Instrument',
    level: 'Review',
    description: 'The live instrument has no recorded submission creator.',
    liveOnly: true,
  }, record => !record.createdBy?.trim()),
  recordControl({
    id: 'self-verification',
    title: 'Flag matching submission and verification identities',
    category: 'Verification',
    level: 'Inconsistency',
    description: 'The recorded creator and verifier have the same account identifier.',
  }, record => Boolean(record.createdBy && record.verifiedBy && record.createdBy === record.verifiedBy)),
  recordControl({
    id: 'verifier-identity',
    title: 'Detect missing live verifier identities',
    category: 'Verification',
    level: 'Review',
    description: 'The lifecycle indicates verification has occurred and the loaded record has no verifier identifier.',
    liveOnly: true,
  }, record => verifiedStates.has(record.status) && !record.verifiedBy?.trim()),
  recordControl({
    id: 'verification-before-issue',
    title: 'Flag verification evidence dated before issue',
    category: 'Verification',
    level: 'Inconsistency',
    description: 'The recorded verification date precedes the instrument issue date.',
  }, record => Boolean(record.evidence && instrumentDate(record.evidence.date) &&
    instrumentDate(record.issued) && record.evidence.date < record.issued)),
  recordControl({
    id: 'future-verification',
    title: 'Flag verification evidence dated in the future',
    category: 'Verification',
    level: 'Inconsistency',
    description: 'The recorded verification date is later than the current India calendar date.',
  }, (record, snapshot) => Boolean(record.evidence && instrumentDate(record.evidence.date) &&
    record.evidence.date > snapshot.today)),
  recordControl({
    id: 'verification-timestamp',
    title: 'Validate recorded verification timestamps',
    category: 'Verification',
    level: 'Inconsistency',
    description: 'The verification timestamp is present and does not represent a valid date and time.',
  }, record => record.verifiedAt !== undefined && !Number.isFinite(timestamp(record.verifiedAt))),
  recordControl({
    id: 'update-chronology',
    title: 'Flag updates timestamped before record creation',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'The saved update time precedes the saved creation time.',
  }, record => Boolean(record.createdAt && record.updatedAt &&
    timestamp(record.updatedAt) < timestamp(record.createdAt))),
  recordControl({
    id: 'correction-note',
    title: 'Detect returned instruments without correction instructions',
    category: 'Verification',
    level: 'Review',
    description: 'A returned instrument has no recorded correction note for the submitting institution.',
  }, record => record.status === 'Discrepancy' && !record.correction?.trim()),
  recordControl({
    id: 'duplicate-document-id',
    title: 'Find repeated document identifiers within an instrument',
    category: 'Documents',
    level: 'Inconsistency',
    description: 'Two or more entries on the same instrument use the same document identifier.',
  }, record => duplicates(record.docs, document => document.id).size > 0),
  documentControl({
    id: 'document-version-number',
    title: 'Identify invalid evidence version numbers',
    category: 'Documents',
    level: 'Inconsistency',
    description: 'Document versions must be positive integers.',
  }, document => !Number.isSafeInteger(document.version) || document.version < 1),
  recordControl({
    id: 'document-version-duplicate',
    title: 'Find duplicate evidence versions within a category',
    category: 'Documents',
    level: 'Inconsistency',
    description: 'An instrument has multiple document entries with the same category and version.',
  }, record => duplicates(record.docs, document => JSON.stringify([document.kind, document.version])).size > 0),
  recordControl({
    id: 'document-version-gap',
    title: 'Find gaps in evidence version sequences',
    category: 'Documents',
    level: 'Review',
    description: 'Review categories whose stored version sequence skips one or more numbers.',
  }, hasVersionGap),
  documentControl({
    id: 'document-category',
    title: 'Flag unrecognized evidence categories',
    category: 'Documents',
    level: 'Review',
    description: 'The recorded document category is outside the current upload vocabulary.',
  }, document => !documentKinds.has(document.kind)),
  documentControl({
    id: 'document-size',
    title: 'Check stored evidence sizes against upload bounds',
    category: 'Documents',
    level: 'Inconsistency',
    description: 'The recorded file size is outside the range of 1 byte to 1 MiB.',
  }, document => document.size !== undefined &&
    (!Number.isSafeInteger(document.size) || document.size < 1 || document.size > 1024 * 1024)),
  documentControl({
    id: 'checksum-format',
    title: 'Validate recorded SHA-256 metadata format',
    category: 'Documents',
    level: 'Inconsistency',
    description: 'A recorded checksum must contain 64 hexadecimal characters.',
  }, document => Boolean(document.sha256 && !checksumPattern.test(document.sha256))),
  documentControl({
    id: 'document-format',
    title: 'Check stored evidence type against filename extension',
    category: 'Documents',
    level: 'Inconsistency',
    description: 'The saved MIME type and filename do not match a supported upload format.',
  }, document => Boolean(document.mime && validateUpload({name: document.name, type: document.mime, size: 1}))),
];

export function reviewControls(snapshot: ReviewSnapshot): ControlResult[] {
  return controls.map(control => {
    const evaluated = !control.liveOnly || snapshot.live;
    return {control, evaluated, observations: evaluated ? control.inspect(snapshot) : []};
  });
}

export function findingsFrom(results: readonly ControlResult[]): Finding[] {
  return results.flatMap(({control, observations}) => observations.map(observation => ({...observation, control})));
}
