import {execFileSync} from 'node:child_process';
import {buildManifest} from './lib/manifest.mjs';

try {
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  console.log(JSON.stringify(await buildManifest('dist', commit), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
