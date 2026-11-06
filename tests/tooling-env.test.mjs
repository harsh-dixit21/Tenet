import test from 'node:test';
import assert from 'node:assert/strict';
import {parseEnv, validateFirebaseEnv} from '../scripts/lib/env.mjs';

const valid = () => ({VITE_FIREBASE_API_KEY: 'configured-key', VITE_FIREBASE_AUTH_DOMAIN: 'tenet-live.firebaseapp.com', VITE_FIREBASE_PROJECT_ID: 'tenet-live', VITE_FIREBASE_STORAGE_BUCKET: 'tenet-live.firebasestorage.app', VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789', VITE_FIREBASE_APP_ID: '1:123456789:web:abc123', VITE_FIREBASE_APPCHECK_SITE_KEY: 'configured-site-key', VITE_FIREBASE_USE_EMULATORS: 'false'});
test('reject malformed assignments with line numbers and no values', () => {
  for (const line of ['SECRET_VALUE', '=SECRET_VALUE', 'BAD KEY=SECRET_VALUE']) {
    assert.throws(() => parseEnv('# comment\n' + line), error => error.message === 'Invalid environment assignment on line 2');
  }
  assert.equal(parseEnv('TOKEN=a=b').TOKEN, 'a=b');
  assert.deepEqual(validateFirebaseEnv(valid()), []);
});

test('accept BOM CRLF and exported assignments', () => {
  assert.equal(parseEnv('\uFEFFexport KEY=value\r\nOTHER=two\r\n').KEY, 'value');
  assert.equal(parseEnv('exported=value').exported, 'value');
});

test('parse comments without truncating quoted hashes or equals', () => {
  assert.equal(parseEnv('KEY=value # comment').KEY, 'value');
  assert.equal(parseEnv('KEY="a # b=c" # comment').KEY, 'a # b=c');
  assert.equal(parseEnv("KEY='literal#value'").KEY, 'literal#value');
  assert.throws(() => parseEnv('KEY="secret'), /Invalid quoted value on line 1/);
});

test('reject duplicate keys instead of silently overriding configuration', () => {
  assert.throws(() => parseEnv('KEY=first\nKEY=second'), /Duplicate environment key KEY on line 2/);
  assert.equal(parseEnv('__proto__=literal').__proto__, 'literal');
});

test('reject copied placeholder configuration', () => {
  for (const value of ['your-api-key', 'REPLACE_ME', '<project-id>', 'changeme']) {
    assert.ok(validateFirebaseEnv({...valid(), VITE_FIREBASE_API_KEY: value}).includes('VITE_FIREBASE_API_KEY contains a placeholder'));
  }
});

test('reject mistyped emulator switches and allow the production default', () => {
  for (const value of ['', 'TRUE', '1', 'yes']) assert.ok(validateFirebaseEnv({...valid(), VITE_FIREBASE_USE_EMULATORS: value}).some(error => error.includes('must be true or false')));
  const entries = valid(); delete entries.VITE_FIREBASE_USE_EMULATORS;
  assert.deepEqual(validateFirebaseEnv(entries), []);
});

test('validate Firebase project ID boundaries', () => {
  for (const value of ['abc', 'Uppercase-id', 'project_', '-project', 'project-', 'a'.repeat(31)]) assert.ok(validateFirebaseEnv({...valid(), VITE_FIREBASE_PROJECT_ID: value}).some(error => error.includes('valid project ID')));
  assert.deepEqual(validateFirebaseEnv({...valid(), VITE_FIREBASE_PROJECT_ID: 'demo-tenet', VITE_FIREBASE_USE_EMULATORS: 'true', VITE_FIREBASE_APPCHECK_SITE_KEY: ''}), []);
});

test('accept custom auth domains and reject URLs or malformed hosts', () => {
  assert.deepEqual(validateFirebaseEnv({...valid(), VITE_FIREBASE_AUTH_DOMAIN: 'auth.example.org'}), []);
  for (const value of ['https://auth.example.org', 'auth.example.org/path', 'auth..org', '-auth.example.org']) assert.ok(validateFirebaseEnv({...valid(), VITE_FIREBASE_AUTH_DOMAIN: value}).some(error => error.includes('must be a hostname')));
});

test('require numeric sender IDs without converting their precision', () => {
  assert.deepEqual(validateFirebaseEnv({...valid(), VITE_FIREBASE_MESSAGING_SENDER_ID: '12345678901234567890'}), []);
  for (const value of ['123abc', '1e10', '12 34']) assert.ok(validateFirebaseEnv({...valid(), VITE_FIREBASE_MESSAGING_SENDER_ID: value}).some(error => error.includes('only digits')));
});
