import {parseArgs} from 'node:util';
import {runScenario, scenarioCatalog} from './lib/scenario-runner.mjs';

const options = {
  help: {type: 'boolean', short: 'h'},
  list: {type: 'boolean'},
};

function main(args) {
  const {values, positionals} = parseArgs({args, options, allowPositionals: true});
  if (values.help || args.length === 0) {
    return 'Usage: npm run --silent scenario -- NAME [options]\n'
      + 'Use --list to find scenarios. This command runs locally on synthetic data.';
  }

  if (values.list) {
    if (positionals.length) throw Error('--list cannot be combined with a scenario name.');
    return scenarioCatalog().map(({name, description}) => name + '  ' + description).join('\n');
  }

  if (positionals.length !== 1) throw Error('Pass one scenario name. Use --list to see the available scenarios.');
  return JSON.stringify(runScenario(positionals[0]), null, 2);
}

try {
  console.log(main(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
