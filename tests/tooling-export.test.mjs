import {test} from 'node:test';
import assert from 'node:assert/strict';
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
