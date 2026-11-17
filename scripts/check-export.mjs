import {parseArgs} from 'node:util';
import {openSync, closeSync, fstatSync, readSync} from 'node:fs';
import {inspectRows} from './lib/export-validation.mjs';
import {profiles, detectProfile} from './lib/export-profiles.mjs';
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

const options = {json:{type:'boolean'}, list:{type:'boolean'}, profile:{type:'string'}, 'allow-unknown':{type:'boolean'}, strict:{type:'boolean'}, 'max-issues':{type:'string'}};

function inspect(file, expectedProfile, limit, allowUnknown) {
  const records = parseCsv(new TextDecoder('utf-8',{fatal:true}).decode(readExport(file)));
  if (!records.length) throw new Error('The CSV has no header.');
  const [header,...rows] = records;
  if (header.cells.some(value=>!value.trim())) throw new Error('The CSV contains an empty column name.');
  if (new Set(header.cells).size!==header.cells.length) throw new Error('The CSV contains duplicate column names.');
  const badRow=rows.find(row=>row.cells.length!==header.cells.length);
  if (badRow) throw new Error('Column count differs from the header on line '+badRow.line+'.');
  const profile=detectProfile(header.cells);
  if (expectedProfile && profile!==expectedProfile) throw new Error('The CSV header does not match the requested '+expectedProfile+' profile.');
  if (!profile&&!allowUnknown) throw new Error('Unrecognized Tenet CSV header. Use --list to see supported profiles.');
  return {file,profile,rows:rows.length,...inspectRows(profile,header.cells,rows,limit)};
}

function run() {
  const {values,positionals:files} = parseArgs({options,allowPositionals:true});
  if (values.list) {
    if (files.length) throw new Error('--list cannot be combined with input files.');
    if (values.json) console.log(JSON.stringify(Object.fromEntries(profiles),null,2));
    else for (const [name,header] of profiles) console.log(name+'  '+header.join(', '));
    return;
  }
  if (!files.length) throw new Error('Usage: npm run --silent check:export -- FILE [FILE ...]');
  if (values.profile && !profiles.has(values.profile)) throw new Error('Unknown profile. Use --list to inspect options.');
  const limit=Number(values['max-issues']??100);
  if (!Number.isInteger(limit)||limit<1||limit>10000) throw new Error('--max-issues must be between 1 and 10000.');
  const results = files.map(file=>{
    try { return inspect(file,values.profile,limit,values['allow-unknown']); }
    catch (error) { return {file,failure:error.message}; }
  });
  if (values.json) console.log(JSON.stringify(results.length===1?results[0]:results,null,2));
  else for (const result of results) {
    if (result.failure) { console.log(result.file+': '+result.failure); continue; }
    console.log(result.file+' ('+(result.profile??'unknown export')+'): '+result.rows+' rows, '+result.errorCount+' errors, '+result.warningCount+' warnings.');
    for (const issue of result.issues) console.log(issue.severity+' on line '+issue.line+' ('+issue.column+'): '+issue.message);
    if (result.omitted) console.log(result.omitted+' additional findings omitted.');
  }
  if (results.some(result=>result.failure||result.errorCount||(values.strict&&result.warningCount))) process.exitCode=1;
}

try { run(); }
catch (error) {
  console.error(error.message);
  process.exitCode=1;
}
