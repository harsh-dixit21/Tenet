import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBuild} from '../scripts/lib/build-output.mjs';
import {sandbox} from './tooling-helpers.mjs';

function setup(t) {
  return sandbox(t, {'index.html': '<title>Tenet</title>', 'portal/index.html': '<title>Tenet Workspace</title>', 'assets/tenet-background.mp4': Buffer.alloc(1024)});
}
test('explain missing build entry points and accept complete builds', t => {
  const {root} = sandbox(t, {});
  assert.throws(() => validateBuild(root), /Missing build entry: index.html.*npm run build/);
  assert.doesNotThrow(() => validateBuild(setup(t).root));
});
