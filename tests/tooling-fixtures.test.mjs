import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {generateFixtures} from '../scripts/lib/fixtures.mjs';

test('accept decimal fixture counts only within the supported bounds', () => {
  for (const count of ['', ' ', '0', '-1', '501', '1.5', '1e2', '0x10', 'Infinity', 'NaN']) assert.throws(() => generateFixtures(count), /integer from 1 to 500/);
  assert.equal(generateFixtures().records.length, 10);
  assert.equal(generateFixtures('1').records.length, 1);
  const fixture = generateFixtures('500');
  assert.equal(fixture.synthetic, true);
  assert.equal(new Set(fixture.records.map(record => record.id)).size, 500);
  assert.ok(fixture.records.every(record => record.amountMinor === record.amount * 100));
  assert.deepEqual(generateFixtures('12'), generateFixtures('12'));
});

test('fixture CLI separates help JSON and errors without writing data', () => {
  const cli = fileURLToPath(new URL('../scripts/generate-fixtures.mjs', import.meta.url));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], {encoding: 'utf8'});
  assert.match(run('--help').stdout, /No database is contacted/);
  const result = run('2');
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).records.length, 2);
  for (const args of [['2', '3'], ['invalid']]) {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(result.stderr.length > 0);
  }
});
