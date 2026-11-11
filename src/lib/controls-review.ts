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

export const controls: Control[] = [
  recordControl({
    id: 'paise-reconciliation',
    title: 'Stored rupees disagree with stored paise',
    category: 'Instrument',
    level: 'Inconsistency',
    description: 'Compare the saved INR value with the authoritative integer amount in paise.',
  }, record => Number.isSafeInteger(record.amountMinor) && Number.isFinite(record.amount) &&
    Math.round(record.amount * 100) !== record.amountMinor),
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
