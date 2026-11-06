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

test('verify single quoted uppercase and cache-busted asset references', t => {
  const {root, put} = setup(t);
  put('index.html', "<title>Tenet</title><script SRC = '/assets/app.js?v=1#module'></script>");
  assert.throws(() => validateBuild(root), /Missing built asset: \/assets\/app.js/);
  put('assets/app.js', 'export {};');
  assert.doesNotThrow(() => validateBuild(root));
});

test('reject encoded traversal and accept encoded filenames inside dist', t => {
  const {root, put} = setup(t);
  put('index.html', '<title>Tenet</title><script src="/assets/%2e%2e/%2e%2e/outside.js"></script>');
  assert.throws(() => validateBuild(root), /escapes the dist/);
  put('index.html', '<title>Tenet</title><script src="/assets/my%20app.js"></script>');
  put('assets/my app.js', 'export {};');
  assert.doesNotThrow(() => validateBuild(root));
});

test('reject empty assets and directory references', t => {
  const {root, put} = setup(t);
  put('index.html', '<title>Tenet</title><script src="/assets/app.js"></script>');
  put('assets/app.js', '');
  assert.throws(() => validateBuild(root), /nonempty file/);
  put('index.html', '<title>Tenet</title><script src="/assets/"></script>');
  assert.throws(() => validateBuild(root), /nonempty file/);
});
