import {writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';
import {demoWorkspace, scenarioBatch, scenarioCatalog, summarizeScenario} from './lib/scenario-runner.mjs';

const options = {
  help: {type: 'boolean', short: 'h'},
  list: {type: 'boolean'},
  catalog: {type: 'boolean'},
  date: {type: 'string'},
  repeat: {type: 'string'},
  compact: {type: 'boolean'},
  format: {type: 'string'},
  output: {type: 'string'},
};

function render(args, values, positionals) {
  if (values.help || args.length === 0) {
    return 'Usage: npm run --silent scenario -- NAME [options]\n'
      + 'Set --date YYYY-MM-DD to move the synthetic reference day.\n'
      + 'Set --repeat COUNT to generate 1–100 independent copies.\n'
      + 'Choose --format json|ndjson|summary|workspace. Use --compact for single-line JSON.\n'
      + 'Pass --output FILE to create a new file without overwriting an existing file.\n'
      + 'Use --list for descriptions or --catalog for JSON. This command runs locally on synthetic data.';
  }

  if ((values.catalog || values.list) && [values.date, values.repeat, values.format].some(value => value !== undefined)) {
    throw Error('--date, --repeat and --format require a scenario name.');
  }
  if (values.catalog) {
    if (positionals.length || values.list) throw Error('--catalog is a standalone catalogue mode.');
    return JSON.stringify(scenarioCatalog(), null, values.compact ? 0 : 2);
  }

  if (values.list) {
    if (positionals.length) throw Error('--list cannot be combined with a scenario name.');
    return scenarioCatalog().map(({name, description}) => name + '  ' + description).join('\n');
  }

  if (positionals.length !== 1) throw Error('Pass one scenario name. Use --list to see the available scenarios.');
  const runs = scenarioBatch(positionals[0], values.repeat ?? '1', values.date);
  const format = values.format ?? 'json';
  if (format === 'ndjson') return runs.map(run => JSON.stringify(run)).join('\n');
  if (format === 'workspace') {
    return JSON.stringify(demoWorkspace(runs), null, values.compact ? 0 : 2);
  }
  if (format === 'summary') {
    const summaries = runs.map(summarizeScenario);
    return JSON.stringify(summaries.length === 1 ? summaries[0] : summaries, null, values.compact ? 0 : 2);
  }
  if (format !== 'json') throw Error('Unsupported output format. Choose json, ndjson, summary or workspace.');
  return JSON.stringify(runs.length === 1 ? runs[0] : runs, null, values.compact ? 0 : 2);
}

try {
  const args = process.argv.slice(2);
  const {values, positionals} = parseArgs({args, options, allowPositionals: true});
  if (values.output !== undefined && !values.output.trim()) throw Error('Choose a destination file for --output.');
  const result = render(args, values, positionals) + '\n';
  if (values.output !== undefined && !values.help) {
    writeFileSync(values.output, result, {encoding: 'utf8', flag: 'wx'});
  } else {
    process.stdout.write(result);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
