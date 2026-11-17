import {openSync, closeSync, fstatSync, readSync} from 'node:fs';
import {parseCsv} from './lib/export-csv.mjs';

const MAX_BYTES = 20 * 1024 * 1024;
function readExport(file) {
  const fd = openSync(file,'r');
  try {
    const info = fstatSync(fd);
    if (!info.isFile()) throw new Error('Choose a regular CSV file.');
    if (info.size > MAX_BYTES) throw new Error('The export exceeds 20 MiB.');
    const bytes = Buffer.alloc(info.size+1);
    let length = 0;
    while (length < bytes.length) {
      const count = readSync(fd,bytes,length,bytes.length-length,null);
      if (!count) break;
      length += count;
    }
    if (length !== info.size) throw new Error('The export changed while it was being read.');
    return bytes.subarray(0,length);
  } finally { closeSync(fd); }
}

try {
  const [file,...extra] = process.argv.slice(2);
  if (!file || extra.length) throw new Error('Usage: npm run --silent check:export -- FILE');
  const records = parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(readExport(file)));
  if (!records.length) throw new Error('The CSV has no header.');
  const [header,...rows] = records;
  if (header.cells.some(value=>!value.trim())) throw new Error('The CSV contains an empty column name.');
  if (new Set(header.cells).size!==header.cells.length) throw new Error('The CSV contains duplicate column names.');
  const badRow=rows.find(row=>row.cells.length!==header.cells.length);
  if (badRow) throw new Error('Column count differs from the header on line '+badRow.line+'.');
  console.log(rows.length+' data rows parsed.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
