const required = ['API_KEY', 'AUTH_DOMAIN', 'PROJECT_ID', 'STORAGE_BUCKET', 'MESSAGING_SENDER_ID', 'APP_ID'].map(key => 'VITE_FIREBASE_' + key);

// Never include assignment values in diagnostics: environment files can contain secrets.
export function parseEnv(source) {
  const entries = Object.create(null);
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) throw new Error(`Invalid environment assignment on line ${index + 1}`);
    const [, key, value] = match;
    entries[key] = value.replace(/^(["'])(.*)\1$/, '$2');
  }
  return entries;
}

export function validateFirebaseEnv(entries) {
  const errors = required.filter(key => !entries[key]).map(key => `${key} is required`);
  if (entries.VITE_FIREBASE_PROJECT_ID?.startsWith('demo-') && entries.VITE_FIREBASE_USE_EMULATORS !== 'true') errors.push('Demo projects require emulator mode');
  if (entries.VITE_FIREBASE_USE_EMULATORS !== 'true' && !entries.VITE_FIREBASE_APPCHECK_SITE_KEY) errors.push('Production requires the App Check site key');
  return errors;
}
