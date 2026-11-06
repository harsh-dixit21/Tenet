import {generateFixtures} from './lib/fixtures.mjs';

try {
  console.log(JSON.stringify(generateFixtures(process.argv[2]), null, 2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
