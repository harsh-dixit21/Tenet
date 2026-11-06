import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectTrackedFiles} from '../scripts/lib/tracked-files.mjs';
import {sandbox} from './tooling-helpers.mjs';

test('flag generated data credential filenames and private key formats', t => {
  const key = ['-----BEGIN ', 'OPENSSH ', 'PRIVATE KEY-----'].join('');
  const {root} = sandbox(t, {'dist/output.js': 'bundle', '.ENV.production': 'secret=value', 'key.txt': key, '.env.example': 'KEY=', 'src/app.js': 'export {};'});
  const errors = inspectTrackedFiles(root, ['dist/output.js', '.ENV.production', 'key.txt', 'missing.txt']);
  assert.equal(errors.length, 4);
  assert.ok(errors.some(error => error.includes('missing tracked file')));
  assert.deepEqual(inspectTrackedFiles(root, ['.env.example', 'src/app.js']), []);
  assert.ok(errors.every(error => !error.includes('secret=value')));
});
