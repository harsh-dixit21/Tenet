import {runScenario} from './lib/scenario-runner.mjs';

try {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && ['--help', '-h'].includes(args[0]))) {
    console.log('Usage: npm run scenario -- NAME\nRun a synthetic Tenet workflow and emit its final state and step history. Runs locally.');
  } else {
    if (args.length !== 1) throw Error('Pass a single scenario name. Use --help for usage.');
    console.log(JSON.stringify(runScenario(args[0]), null, 2));
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
