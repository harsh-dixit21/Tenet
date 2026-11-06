import {validateBuild} from './lib/build-output.mjs';

try {
  validateBuild();
  console.log('Both entry points and their referenced local assets are present.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
