import assert from 'node:assert/strict';
import {applyCommand, date, DomainError, requiredDocs} from '../../functions/src/domain.js';
import {generateAlerts} from '../../functions/src/alerts.js';
import {documentChecksum} from '../../functions/src/protocol.js';
import {scenarios} from './scenario-cases.mjs';

const DEFAULT_DATE = '2026-11-17';
const MS_PER_DAY = 86_400_000;
const initialSettings = {reminderDays: 30, escalationDays: 7};

function shiftDay(referenceDay, days) {
  return new Date(Date.parse(referenceDay) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

function syntheticActor(role, name, scope = 'north') {
  return {
    uid: 'synthetic-' + name,
    role,
    active: true,
    institutionId: 'synthetic-' + scope,
    institutionName: scope === 'north' ? 'Synthetic North College' : 'Synthetic South College',
  };
}

const institution = syntheticActor('Institution', 'north-maker');
const otherInstitution = syntheticActor('Institution', 'south-maker', 'south');
const reviewer = syntheticActor('Reviewer', 'reviewer');
const approver = syntheticActor('Approver', 'approver');

function createRun(prefix, referenceDay) {
  const records = new Map();
  const requests = new Map();
  const events = [];
  const steps = [];
  let settings = {...initialSettings};
  let minute = 0;

  function execute(actor, command, options = {}) {
    const record = records.get(command.recordId ?? command.id);
    const parent = records.get(record?.parent ?? command.parent);
    const request = requests.get(command.requestId);
    const now = new Date(Date.parse(referenceDay + 'T06:00:00Z') + minute++ * 60_000).toISOString();
    const successorExists = [...records.values()].some(candidate =>
      candidate.id !== record?.id && candidate.parent === (command.type === 'saveInstrument' ? parent?.id : record?.id));
    try {
      const outcome = applyCommand({actor, command, record, parent, request, now, successorExists, document: options.document});
      if (options.reject) throw Error('Expected rejection: ' + options.reject.code);
      if (outcome.record) records.set(outcome.record.id, outcome.record);
      if (outcome.parent) records.set(outcome.parent.id, outcome.parent);
      if (outcome.request) requests.set(outcome.request.id, outcome.request);
      if (outcome.settings) settings = outcome.settings;
      events.push({...outcome.event, id: prefix + '-event-' + minute});
      if (outcome.parent) {
        events.push({...outcome.event, id: prefix + '-parent-event-' + minute, recordId: outcome.parent.id,
          action: outcome.parent.status + ' by ' + outcome.record.id, details: {successorId: outcome.record.id}});
      }
      steps.push({action: command.type, actor: actor.role, at: now, result: 'Accepted'});
      return outcome.record;
    } catch (error) {
      if (!(error instanceof DomainError) || error.code !== options.reject?.code ||
          !options.reject.message.test(error.message)) throw error;
      steps.push({action: command.type, actor: actor.role, at: now, result: 'Rejected',
        code: error.code, message: error.message});
      return undefined;
    }
  }

  const id = (suffix = 'main') => prefix + '-' + suffix;
  function create({suffix = 'main', status = 'Draft', actor = institution, maturity = 30, parent, relation,
    fields = {}, reject} = {}) {
    const recordId = id(suffix);
    return execute(actor, {
      type: 'saveInstrument', id: recordId, status, parent, relation,
      fields: {
        bank: 'Synthetic Cooperative Bank', number: recordId, branch: 'Synthetic Main Branch',
        amount: 125000.25, issued: shiftDay(referenceDay, -90), maturity: shiftDay(referenceDay, maturity),
        ...fields,
      },
    }, {reject});
  }

  function attachment(kind, tag = 'initial') {
    const bytes = Buffer.from('TENET SYNTHETIC EVIDENCE\n' + kind + '\n' + tag + '\n');
    return {
      id: prefix + '-document-' + (minute + 1), kind, name: kind.toLowerCase().replaceAll(' ', '-') + '.txt',
      size: bytes.length, mime: 'text/plain', sha256: documentChecksum(bytes),
      data: 'data:text/plain;base64,' + bytes.toString('base64'),
    };
  }

  function upload(record, kind, {tag, actor = institution, reject} = {}) {
    return execute(actor, {type: 'uploadDocument', recordId: record.id},
      {document: attachment(kind, tag), reject});
  }

  function documentAll(record) {
    return requiredDocs.reduce((current, kind) => upload(current, kind), record);
  }

  function verify(record, {actor = reviewer, evidence = {}, reject} = {}) {
    return execute(actor, {type: 'verify', recordId: record.id, evidence: {
      source: 'Synthetic bank confirmation', reference: 'SYNTHETIC-' + record.id,
      note: 'Synthetic workflow scenario', date: referenceDay, ...evidence,
    }}, {reject});
  }

  function submitted(options = {}) {
    return create({...options, status: 'Awaiting verification'});
  }

  function verified(options) {
    return verify(documentAll(submitted(options)));
  }

  function closure(record, requestType = 'Release', {actor = institution, suffix = 'closure', reject} = {}) {
    const requestId = id(suffix);
    execute(actor, {type: 'request', recordId: record.id, requestId, requestType,
      reason: 'Synthetic ' + requestType.toLowerCase() + ' request'}, {reject});
    return requests.get(requestId);
  }

  function decide(request, decision = 'Approved', {actor = approver, confirm = true, reject} = {}) {
    return execute(actor, {type: 'decide', recordId: request.recordId, requestId: request.id, decision,
      eligibilityConfirmed: confirm, note: 'Synthetic ' + decision.toLowerCase() + ' decision'}, {reject});
  }

  function correct(record, {actor = reviewer, reject} = {}) {
    return execute(actor, {type: 'correct', recordId: record.id,
      note: 'Confirm the maturity date on the synthetic instrument.'}, {reject});
  }

  function finish(name, description) {
    const instruments = [...records.values()];
    const snapshot = {
      version: 1, records: instruments, requests: [...requests.values()],
      events: [...events].reverse(), settings, readAlerts: [],
      serverAlerts: generateAlerts(instruments, settings, referenceDay + 'T06:00:00Z'),
    };
    return {format: 'tenet-synthetic-scenario', version: 1, synthetic: true, name, description,
      referenceDay, steps, snapshot};
  }

  return {id, create, upload, documentAll, verify, submitted, verified, closure, decide, correct,
    execute, finish, institution, otherInstitution, reviewer, approver, shift: days => shiftDay(referenceDay, days), assert};
}

export function runScenario(name, {referenceDay = DEFAULT_DATE, prefix = 'synthetic-' + name} = {}) {
  if (!Object.hasOwn(scenarios, name)) throw Error('Unknown scenario: ' + name);
  date(referenceDay, 'Reference date');
  if (referenceDay < '1900-04-01' || referenceDay > '2199-11-01') {
    throw Error('Reference date must be between 1900-04-01 and 2199-11-01 to keep generated dates in range.');
  }
  const scenario = scenarios[name];
  const run = createRun(prefix, referenceDay);
  scenario.run(run);
  return run.finish(name, scenario.description);
}

export function scenarioCatalog() {
  return Object.entries(scenarios).map(([name, scenario]) => ({name, description: scenario.description}))
    .sort((left, right) => left.name.localeCompare(right.name));
}
