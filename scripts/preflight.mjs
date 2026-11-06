import {validateDeployment} from './lib/deployment.mjs';

try {
  validateDeployment(process.cwd(), process.argv[2]);
  console.log('Local preflight passed. Verify billing, Google provider, authorized domains, App Check and backups in Firebase before deploying. No resources were changed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
