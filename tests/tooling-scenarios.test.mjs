import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {demoWorkspace, runScenario, scenarioBatch, scenarioCatalog} from '../scripts/lib/scenario-runner.mjs';
import {sandbox} from './tooling-helpers.mjs';

const cli = fileURLToPath(new URL('../scripts/run-scenario.mjs', import.meta.url));
const command = (...args) => spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8'});

test('every catalogue entry runs deterministically and produces only linked synthetic data', () => {
  for (const {name} of scenarioCatalog()) {
    const result = runScenario(name);
    assert.equal(result.synthetic, true, name);
    assert.deepEqual(result, runScenario(name), name);
    const {records, requests, events} = result.snapshot;
    const ids = new Set(records.map(record => record.id));
    assert.ok(records.every(record => record.id.startsWith('synthetic-')), name);
    assert.ok(requests.every(request => ids.has(request.recordId)), name);
    assert.ok(events.every(event => ids.has(event.recordId)), name);
    assert.ok(records.every(record => !record.parent || ids.has(record.parent)), name);
    assert.ok(result.steps.length > 0, name);
  }
});

test('expected rejection remains diagnostic while successful actions alone enter the audit', () => {
  const result = runScenario('duplicate-evidence');
  assert.equal(result.steps.at(-1).code, 'already-exists');
  assert.equal(result.snapshot.events.length, 2);
  assert.equal(result.snapshot.records[0].docs.length, 1);
  const summary = command('premature-release', '--format', 'summary');
  assert.equal(summary.status, 0, summary.stderr);
  const json = JSON.parse(summary.stdout);
  assert.equal(json.rejected, 1);
  assert.equal(json.instrumentsByStatus['Release requested'], 1);
  assert.match(json.rejections[0].message, /requires maturity/);
});

test('repeat bundles preserve request and successor references without sharing record IDs', () => {
  const runs = scenarioBatch('renewed', 2, '2028-02-29');
  const workspace = demoWorkspace(runs);
  assert.equal(new Set(workspace.records.map(record => record.id)).size, 4);
  assert.equal(new Set(workspace.events.map(event => event.id)).size, workspace.events.length);
  for (const run of runs) {
    const child = run.snapshot.records.find(record => record.parent);
    const parent = run.snapshot.records.find(record => record.id === child.parent);
    assert.equal(parent.status, 'Renewed');
    assert.equal(parent.updatedAt.slice(0, 10), '2028-02-29');
    assert.ok(child.maturity > parent.maturity);
  }
  for (const run of scenarioBatch('released', 2)) {
    assert.equal(run.snapshot.requests[0].recordId, run.snapshot.records[0].id);
  }
});

test('command output modes separate catalogues and newline-delimited data', () => {
  const catalogue = command('--catalog');
  assert.equal(catalogue.status, 0, catalogue.stderr);
  assert.deepEqual(JSON.parse(catalogue.stdout), scenarioCatalog());
  const result = command('draft', '--repeat', '2', '--format', 'ndjson');
  assert.equal(result.status, 0, result.stderr);
  const lines = result.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.equal(lines.length, 2);
  assert.notEqual(lines[0].snapshot.records[0].id, lines[1].snapshot.records[0].id);
  const compact = command('draft', '--compact');
  assert.equal(compact.stdout.trim().split('\n').length, 1);
  assert.equal(JSON.parse(compact.stdout).name, 'draft');
});

test('CLI rejects unsupported scenarios and malformed options without writing results', () => {
  for (const [args, reason] of [
    [['toString'], /Unknown scenario/],
    [['draft', '--repeat', '101'], /Repeat count/],
    [['draft', '--repeat', '1e2'], /Repeat count/],
    [['draft', '--date', '2026-02-30'], /valid date/],
    [['draft', '--date', '2199-12-01'], /keep generated dates in range/],
    [['draft', '--format', 'xml'], /Unsupported output format/],
    [['--catalog', '--date', '2026-11-17'], /require a scenario name/],
  ]) {
    const result = command(...args);
    assert.equal(result.status, 1, args.join(' '));
    assert.equal(result.stdout, '');
    assert.match(result.stderr, reason);
  }
});

test('file output creates a workspace fixture and never overwrites an existing file', t => {
  const fixture = sandbox(t, {});
  const output = join(fixture.root, 'workspace.json');
  const result = command('verified', '--format', 'workspace', '--output', output);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  const workspace = JSON.parse(readFileSync(output, 'utf8'));
  assert.equal(workspace.records[0].status, 'Verified');
  assert.equal(workspace.records[0].docs.length, 3);
  writeFileSync(output, 'keep existing content');
  const repeated = command('draft', '--output', output);
  assert.equal(repeated.status, 1);
  assert.equal(readFileSync(output, 'utf8'), 'keep existing content');
});
