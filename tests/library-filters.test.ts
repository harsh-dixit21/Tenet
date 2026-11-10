import test from 'node:test';
import assert from 'node:assert/strict';
import {auditDay, documentFormat} from '../src/lib/library-filters.ts';

test('legacy evidence formats remain discoverable without MIME metadata', () => {
  assert.equal(documentFormat('CONFIRMATION.PDF'), 'PDF');
  assert.equal(documentFormat('scan.JPEG'), 'Image');
  assert.equal(documentFormat('notes.txt'), 'Text');
  assert.equal(documentFormat('evidence'), 'Other');
  assert.equal(documentFormat('download', 'image/png'), 'Image');
  assert.equal(documentFormat('download', 'application/pdf'), 'PDF');
});

test('audit date filtering uses the Indian calendar day at UTC boundaries', () => {
  assert.equal(auditDay('2026-11-10T18:29:59Z'), '2026-11-10');
  assert.equal(auditDay('2026-11-10T18:30:00Z'), '2026-11-11');
  assert.equal(auditDay('2026-11-11T00:00:00+05:30'), '2026-11-11');
  assert.equal(auditDay('invalid'), '');
});
