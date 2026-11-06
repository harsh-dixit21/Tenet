import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDeployment} from '../scripts/lib/deployment.mjs';
import {sandbox} from './tooling-helpers.mjs';

const config = {firestore: {rules: 'firestore.rules', indexes: 'firestore.indexes.json'}, storage: {rules: 'storage.rules'}, functions: [{source: 'functions', codebase: 'tenet', runtime: 'nodejs22'}]};
function setup(t) {
  return sandbox(t, {
    'firebase.json': JSON.stringify(config),
    'firestore.rules': 'rules_version = "2";',
    'storage.rules': 'rules_version = "2";',
    'firestore.indexes.json': '{"indexes": [], "fieldOverrides": []}',
    'functions/.env': 'INITIAL_ADMIN_EMAIL=admin@example.org\nTENET_ENFORCE_APP_CHECK=true\n',
    'functions/package.json': '{"engines":{"node":"22"}}',
    '.env.local': 'VITE_FIREBASE_API_KEY=configured-key\nVITE_FIREBASE_AUTH_DOMAIN=tenet-live.firebaseapp.com\nVITE_FIREBASE_PROJECT_ID=tenet-live\nVITE_FIREBASE_STORAGE_BUCKET=tenet-live.firebasestorage.app\nVITE_FIREBASE_MESSAGING_SENDER_ID=123456789\nVITE_FIREBASE_APP_ID=1:123456789:web:abc123\nVITE_FIREBASE_APPCHECK_SITE_KEY=configured-site-key\nVITE_FIREBASE_USE_EMULATORS=false\n'
  });
}

test('require explicit production App Check enforcement', t => {
  const {root, put} = setup(t);
  assert.doesNotThrow(() => validateDeployment(root, 'tenet-live'));
  for (const value of ['', 'false', 'TRUE']) {
    put('functions/.env', `INITIAL_ADMIN_EMAIL=admin@example.org\nTENET_ENFORCE_APP_CHECK=${value}`);
    assert.throws(() => validateDeployment(root, 'tenet-live'), /TENET_ENFORCE_APP_CHECK=true/);
  }
  assert.throws(() => validateDeployment(root, 'demo-tenet'), /real Firebase project/);
});

test('parse quoted administrator settings and reject malformed mailboxes', t => {
  const {root, put} = setup(t);
  put('functions/.env', 'export INITIAL_ADMIN_EMAIL="admin@example.org" # owner\nTENET_ENFORCE_APP_CHECK="true"');
  assert.doesNotThrow(() => validateDeployment(root, 'tenet-live'));
  for (const value of ['admin@@example.org', 'admin@example', 'admin example@org.test']) {
    put('functions/.env', `INITIAL_ADMIN_EMAIL=${value}\nTENET_ENFORCE_APP_CHECK=true`);
    assert.throws(() => validateDeployment(root, 'tenet-live'), /Set INITIAL_ADMIN_EMAIL/);
  }
});

test('reject absolute traversal directory and missing configuration paths', t => {
  const {root, put} = setup(t);
  for (const path of ['../outside.rules', root, 'functions', '', 'missing.rules']) {
    put('firebase.json', JSON.stringify({...config, storage: {rules: path}}));
    assert.throws(() => validateDeployment(root, 'tenet-live'), /checkout|Missing/);
  }
});

test('reject empty and whitespace-only deployment rules', t => {
  const {root, put} = setup(t);
  for (const value of ['', ' \r\n\t']) {
    put('storage.rules', value);
    assert.throws(() => validateDeployment(root, 'tenet-live'), /Empty deployment file: storage.rules/);
  }
});

test('verify Firestore index document shape', t => {
  const {root, put} = setup(t);
  for (const value of ['null', '{}', '{"indexes":{}}', '{"indexes":[],"fieldOverrides":{}}']) {
    put('firestore.indexes.json', value);
    assert.throws(() => validateDeployment(root, 'tenet-live'), /indexes array/);
  }
  put('firestore.indexes.json', '{"indexes":[]}');
  assert.doesNotThrow(() => validateDeployment(root, 'tenet-live'));
});

test('detect runtime drift between Firebase and the functions package', t => {
  const {root, put} = setup(t);
  put('functions/package.json', '{"engines":{"node":"20"}}');
  assert.throws(() => validateDeployment(root, 'tenet-live'), /Node.js 22/);
  put('functions/package.json', '{"engines":{"node":"22"}}');
  put('firebase.json', JSON.stringify({...config, functions: [{source: 'functions', codebase: 'tenet', runtime: 'nodejs20'}]}));
  assert.throws(() => validateDeployment(root, 'tenet-live'), /nodejs22 runtime/);
});

test('bind production preflight to the validated frontend project', t => {
  const {root, put} = setup(t);
  assert.throws(() => validateDeployment(root, 'other-live'), /does not match/);
  put('.env.local', 'VITE_FIREBASE_PROJECT_ID=tenet-live');
  assert.throws(() => validateDeployment(root, 'tenet-live'), /VITE_FIREBASE_API_KEY is required/);
});
test('refuse emulator-enabled frontend configurations for production', t => {
  const {root, put} = setup(t);
  const {readFileSync} = process.getBuiltinModule('node:fs');
  put('.env.local', readFileSync(root + '/.env.local', 'utf8').replace('EMULATORS=false', 'EMULATORS=true'));
  assert.throws(() => validateDeployment(root, 'tenet-live'), /Disable frontend emulators/);
});
