import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sandbox} from './tooling-helpers.mjs';
import {parseCsv} from '../scripts/lib/export-csv.mjs';

test('CSV parsing preserves escaped quotes, embedded line breaks, blank fields and row positions',()=>{
  const csv='\uFEFF"A","B"\r\n"first\r\nsecond","comma, and ""quotes"""\r\n"",""';
  assert.deepEqual(parseCsv(csv),[
    {line:1,cells:['A','B']},
    {line:2,cells:['first\r\nsecond','comma, and "quotes"']},
    {line:4,cells:['','']},
  ]);
  assert.deepEqual(parseCsv('a,b,c\r\na,,\r\n').at(-1),{line:2,cells:['a','','']});
});

test('CSV rejects ambiguous quotes and bounded field and column violations',()=>{
  assert.throws(()=>parseCsv('"unclosed'),/Unclosed quoted field/);
  assert.throws(()=>parseCsv('"closed"junk'),/Invalid quoting/);
  assert.throws(()=>parseCsv('plain"quote'),/Invalid quoting/);
  assert.throws(()=>parseCsv('a'.repeat(65537)),/65,536/);
  assert.throws(()=>parseCsv(Array(101).fill('a').join(',')),/Too many columns/);
});

const command = fileURLToPath(new URL('../scripts/check-export.mjs',import.meta.url));
const run = (cwd,...args) => spawnSync(process.execPath,[command,...args],{cwd,encoding:'utf8'});
const header = 'Instrument,Institution,Bank,Instrument number,Amount INR,Issue date,Maturity,Status,Linked instrument';
const valid = header+'\nFDR-1,College,Demo Bank,Demo-1,100.25,2024-02-29,2026-11-18,Verified,\n';

test('CLI recognizes the actual instrument register schema and reports invalid rows in a batch',t=>{
  const {root}=sandbox(t,{
    'valid.csv':valid,
    'bad.csv':valid+'FDR-1,College,Demo Bank,Demo-2,12.345,2026-02-29,2026-11-18,Unexpected,\n',
    'width.csv':'Watchlist,Instrument ID\nOne\n',
  });
  const result=run(root,'--json','--max-issues','1','valid.csv','bad.csv','width.csv');
  assert.equal(result.status,1,result.stderr);
  const [clean,bad,width]=JSON.parse(result.stdout);
  assert.equal(clean.profile,'register');
  assert.equal(clean.rows,1);
  assert.equal(clean.errorCount,0);
  assert.equal(bad.errorCount,4);
  assert.equal(bad.omitted,3);
  assert.equal(bad.issues[0].line,3);
  assert.match(width.failure,/line 2/);
});

test('CLI strict mode detects unescaped formulas without echoing cell values',t=>{
  const {root}=sandbox(t,{'unsafe.csv':'Watchlist,Instrument ID\n"=SECRET_DATA()",FDR-1\n','safe.csv':"Watchlist,Instrument ID\n\"'=SECRET_DATA()\",FDR-1\n"});
  const normal=run(root,'--json','unsafe.csv');
  assert.equal(normal.status,0,normal.stderr);
  assert.equal(JSON.parse(normal.stdout).warningCount,1);
  assert.doesNotMatch(normal.stdout,/SECRET_DATA/);
  assert.equal(run(root,'--strict','unsafe.csv').status,1);
  assert.equal(run(root,'--strict','safe.csv').status,0);
});

test('CLI lists fourteen profiles, accepts explicit format and can inspect custom CSV structure',t=>{
  const {root}=sandbox(t,{'register.csv':valid,'custom.csv':'Name,Date\nTest,custom date\n'});
  const catalogue=run(root,'--list','--json');
  assert.equal(catalogue.status,0,catalogue.stderr);
  const profiles=JSON.parse(catalogue.stdout);
  assert.equal(Object.keys(profiles).length,14);
  assert.deepEqual(profiles.register,header.split(','));
  assert.equal(run(root,'--profile','register','register.csv').status,0);
  assert.equal(run(root,'--profile','portfolio','register.csv').status,1);
  assert.equal(run(root,'custom.csv').status,1);
  assert.equal(run(root,'--allow-unknown','custom.csv').status,0);
});
