import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {symlinkSync} from 'node:fs';
import {join} from 'node:path';
import {buildManifest} from '../scripts/lib/manifest.mjs';
import {sandbox} from './tooling-helpers.mjs';

test('stream exact file hashes in deterministic portable path order', async t => {
  const bytes = Buffer.alloc(3 * 1024 * 1024, 7);
  const {root} = sandbox(t, {'z/video.mp4': bytes, 'a.html': 'Tenet', 'empty.txt': ''});
  const manifest = await buildManifest(root, 'test-commit');
  assert.equal(manifest.commit, 'test-commit');
  assert.deepEqual(manifest.files.map(file => file.path), ['a.html', 'empty.txt', 'z/video.mp4']);
  assert.equal(manifest.files[2].bytes, bytes.length);
  assert.equal(manifest.files[2].sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.deepEqual(await buildManifest(root, 'test-commit'), manifest);
});
