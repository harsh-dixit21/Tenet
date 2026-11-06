import {execFileSync} from 'node:child_process';
import {inspectTrackedFiles} from './lib/tracked-files.mjs';

try {
  const files = execFileSync('git', ['ls-files', '-z'], {encoding: 'utf8'}).split('\0').filter(Boolean);
  const errors = inspectTrackedFiles(process.cwd(), files);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('No tracked credentials, private keys, linked files or generated data detected. This is a targeted check, not a comprehensive secret scanner.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
