import {readFileSync} from 'node:fs';
import {parseCsv} from './lib/export-csv.mjs';

try {
  const [file,...extra] = process.argv.slice(2);
  if (!file || extra.length) throw new Error('Usage: npm run --silent check:export -- FILE');
  const records = parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(file)));
  if (!records.length) throw new Error('The CSV has no header.');
  console.log((records.length-1)+' data rows parsed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
