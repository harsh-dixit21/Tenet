import {generateFixtures} from './lib/fixtures.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length > 1) throw new Error('Pass one count only. Use --help for usage.');
  if (args[0] === '--help' || args[0] === '-h') {
    console.log('Usage: npm run fixtures -- [count]\nGenerate synthetic JSON records. Count: 1 to 500 (default 10). No database is contacted.');
  } else {
    console.log(JSON.stringify(generateFixtures(args[0]), null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
