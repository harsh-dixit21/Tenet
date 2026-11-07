import test from 'node:test';
import assert from 'node:assert/strict';
import * as p from '../src/lib/portfolio.ts';
import type {Instrument, RequestItem, EventItem} from '../src/components/workspace/store.ts';
const record = (patch: Partial<Instrument> = {}): Instrument => ({id: 'A', institution: 'Alpha College', bank: 'State Bank', branch: 'Main', number: 'N-001', amount: 100, amountMinor: 10000, issued: '2026-01-01', maturity: '2026-11-15', status: 'Verified', docs: [], ...patch});
const records = [record(), record({id:'B',institution:'Beta College',bank:'Other Bank',number:'N-002',amount:200,amountMinor:20000,maturity:'2026-12-01',status:'Discrepancy'}), record({id:'C',number:'N-003',amount:50,amountMinor:5000,maturity:'2026-10-01',status:'Released'})];
const filter = (patch: Partial<p.PortfolioFilters> = {}) => p.filterPortfolio(records, {query:'', ...patch}, '2026-11-08');

test('portfolio search combines tokens and preserves authorized input records', () => {
  assert.deepEqual(filter({query:'alpha N-001'}).map(record=>record.id), ['A']);
  assert.equal(filter({query:'unmatched'}).length, 0);
  assert.equal(p.totalMinor(records),35000);
  assert.equal(records.length,3);
  assert.equal(p.filterPortfolio([record({institution:'École'})],{query:'ecole'},'2026-11-08').length,1);
});

test('bank filter uses exact names',()=>{assert.deepEqual(filter({bank:'Other Bank'}).map(r=>r.id),['B']);assert.equal(filter({bank:'Bank'}).length,0);assert.deepEqual(p.distinct(records,'bank'),['Other Bank','State Bank']);});

test('institution scope combines with bank',()=>{assert.equal(filter({institution:'Alpha College'}).length,2);assert.equal(filter({institution:'Alpha College',bank:'Other Bank'}).length,0);});

test('status scope excludes other lifecycle stages',()=>{assert.deepEqual(filter({status:'Verified'}).map(r=>r.id),['A']);});

test('active exposure excludes drafts and terminal records',()=>{assert.deepEqual(filter({activeOnly:true}).map(r=>r.id),['A','B']);assert.equal(p.filterPortfolio([record({status:'Draft'})],{query:'',activeOnly:true},'2026-11-08').length,0);});

test('required categories ignore unrelated uploads',()=>{const complete=record({docs:['Instrument copy','Bank letter','Declaration'].map((kind,i)=>({id:String(i),kind,name:'file.txt',version:1,date:'2026-01-01',data:'',size:1}))});assert.equal(p.filterPortfolio([complete],{query:'',documents:'complete'},'2026-11-08').length,1);assert.equal(filter({documents:'complete'}).length,0);assert.equal(filter({documents:'missing'}).length,3);});

test('minimum amounts use paise and reject unsafe or malformed input',()=>{assert.equal(p.parseAmount('10.01'),1001);assert.equal(p.parseAmount('1e3'),null);assert.equal(p.parseAmount('1.001'),null);assert.equal(p.parseAmount('9007199254740992'),null);assert.deepEqual(filter({minimum:'100.00'}).map(r=>r.id),['A','B']);});

test('maximum amounts and reversed amount bounds fail closed',()=>{assert.deepEqual(filter({maximum:'100'}).map(r=>r.id),['A','C']);assert.equal(filter({minimum:'200',maximum:'100'}).length,0);assert.equal(filter({maximum:'0'}).length,0);});

test('maturity windows include both boundaries',()=>{assert.deepEqual(filter({maturityFrom:'2026-11-15',maturityTo:'2026-12-01'}).map(r=>r.id),['A','B']);assert.equal(filter({maturityFrom:'2026-12-01',maturityTo:'2026-11-01'}).length,0);assert.equal(p.validDate('2026-02-30'),false);});

test('issue periods combine with maturity constraints',()=>{assert.equal(filter({issuedFrom:'2026-01-01',issuedTo:'2026-01-01',maturityFrom:'2026-11-01'}).length,2);assert.equal(filter({issuedFrom:'2026-01-02'}).length,0);});

test('maturity horizons exclude closed history and include day boundaries',()=>{assert.deepEqual(filter({horizon:'7'}).map(r=>r.id),['A']);assert.equal(filter({horizon:'overdue'}).length,0);assert.equal(p.filterPortfolio([record({maturity:'2026-11-08'})],{query:'',horizon:'7'},'2026-11-08').length,1);});

test('portfolio sorting is stable and immutable',()=>{assert.deepEqual(p.sortPortfolio(records,'amount',true).map(r=>r.id),['B','A','C']);assert.deepEqual(records.map(r=>r.id),['A','B','C']);assert.deepEqual(p.sortPortfolio([record({id:'Z'}),record({id:'A'})],'maturity').map(r=>r.id),['A','Z']);});
