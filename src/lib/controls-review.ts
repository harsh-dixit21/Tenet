import {validDate} from './portfolio.ts';
import type {Instrument, RequestItem} from '../components/workspace/store.ts';

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
