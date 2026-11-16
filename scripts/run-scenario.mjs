import {parseArgs} from 'node:util';
import {scenarioBatch, scenarioCatalog, summarizeScenario} from './lib/scenario-runner.mjs';

const options = {
  help: {type: 'boolean', short: 'h'},
  list: {type: 'boolean'},
  catalog: {type: 'boolean'},
  date: {type: 'string'},
  repeat: {type: 'string'},
  compact: {type: 'boolean'},
  format: {type: 'string'},
};

function main(args) {
  const {values, positionals} = parseArgs({args, options, allowPositionals: true});
  if (values.help || args.length === 0) {
    return 'Usage: npm run --silent scenario -- NAME [options]\n'
      + 'Set --date YYYY-MM-DD to move the synthetic reference day.\n'
      + 'Set --repeat COUNT to generate 1–100 independent copies.\n'
      + 'Use --list for descriptions or --catalog for JSON. This command runs locally on synthetic data.';
  }

  if (values.catalog) {
    if (positionals.length || values.list) throw Error('--catalog is a standalone catalogue mode.');
    return JSON.stringify(scenarioCatalog(), null, 2);
  }

  if (values.list) {
    if (positionals.length) throw Error('--list cannot be combined with a scenario name.');
    return scenarioCatalog().map(({name, description}) => name + '  ' + description).join('\n');
  }

  if (positionals.length !== 1) throw Error('Pass one scenario name. Use --list to see the available scenarios.');
  const runs = scenarioBatch(positionals[0], values.repeat ?? '1', values.date);
  const format = values.format ?? 'json';
  if (format === 'ndjson') return runs.map(run => JSON.stringify(run)).join('\n');
  if (format === 'summary') {
    const summaries = runs.map(summarizeScenario);
    return JSON.stringify(summaries.length === 1 ? summaries[0] : summaries, null, values.compact ? 0 : 2);
  }
  if (format !== 'json') throw Error('Unsupported output format. Choose json, ndjson or summary.');
  return JSON.stringify(runs.length === 1 ? runs[0] : runs, null, values.compact ? 0 : 2);
}

try {
  console.log(main(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
