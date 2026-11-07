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

test('pagination clamps stale pages and empty ranges',()=>{const list=Array.from({length:26},(_,i)=>i);assert.deepEqual(p.paginate(list,3,10).items,[20,21,22,23,24,25]);assert.equal(p.paginate(list,99,10).page,3);assert.equal(p.paginate([],99,10).start,0);assert.equal(p.paginate(list,1,0).end,10);});

test('column visibility removes unknown and duplicate saved fields',()=>{assert.deepEqual(p.readColumns(['Bank','Bank','Injected']),['Bank']);assert.deepEqual(p.readColumns(null),[...p.portfolioColumns]);assert.deepEqual(p.readColumns([]),[]);});

test('density preferences fall back to comfortable spacing',()=>{assert.equal(p.readDensity('compact'),'compact');assert.equal(p.readDensity('unsupported'),'comfortable');});

test('selection toggles immutably and excludes out-of-scope IDs',()=>{const initial=['A'];assert.deepEqual(p.toggleSelection(initial,'B'),['A','B']);assert.deepEqual(initial,['A']);assert.deepEqual(p.toggleSelection(initial,'A'),[]);assert.deepEqual(p.selectedInScope(records,['A','foreign']).map(r=>r.id),['A']);});

test('selection totals and date spans reconcile with selected records',()=>{assert.deepEqual(p.selectionSummary([records[0],records[1]]),{count:2,amountMinor:30000,earliest:'2026-11-15',latest:'2026-12-01'});assert.equal(p.selectionSummary([]).earliest,'—');});

test('comparison enforces bounds and preserves exact monetary values',()=>{assert.equal(p.comparisonRows([records[0]]).length,0);assert.equal(p.comparisonRows(Array(5).fill(records[0])).length,0);assert.equal(p.comparisonRows(records.slice(0,2))[2][1],p.formatMinor(10000));});

test('CSV rows use authoritative amounts and a stable export schema',()=>{const row=p.portfolioCsvRows([record({amount:999,amountMinor:10001})]);assert.equal(row[1][4],100.01);assert.equal(row[0].length,row[1].length);assert.equal(p.portfolioCsvRows([]).length,1);});

test('snapshot exports metadata and reconciled totals without evidence or file contents',()=>{const snapshot=p.portfolioSnapshot([record({evidence:{source:'private source',reference:'private',date:'2026-01-01',note:'private note'}})],'2026-11-08');assert.equal(snapshot.totalAmountMinor,10000);assert.equal(snapshot.currency,'INR');assert.equal(JSON.stringify(snapshot).includes('private note'),false);assert.equal('docs' in snapshot.records[0],false);});

test('selected exports exclude hidden and foreign records',()=>{const selected=p.selectedInScope(filter({bank:'Other Bank'}),['A','B','foreign']);assert.deepEqual(p.portfolioCsvRows(selected).slice(1).map(row=>row[0]),['B']);});

test('calendar exports active maturities with escaped and folded RFC lines',()=>{const calendar=p.maturityCalendar([record({institution:'Alpha, College; Unit\nTwo'}),records[2]],'2026-11-08');assert.equal((calendar.match(/BEGIN:VEVENT/g)||[]).length,1);assert.match(calendar,/DTSTART;VALUE=DATE:20261115/);assert.match(calendar,/DTEND;VALUE=DATE:20261116/);assert.ok(calendar.includes('Alpha\\, College\\; Unit\\nTwo'));for(const line of p.foldCalendarLine('SUMMARY:'+ 'कॉलेज'.repeat(30)).split('\r\n')) assert.ok(new TextEncoder().encode(line).length<=75);});

test('print report totals cover all filtered pages',()=>{const many=Array.from({length:26},(_,i)=>record({id:String(i)}));assert.equal(p.portfolioSnapshot(many,'2026-11-08').count,26);assert.equal(p.totalMinor(many),260000);assert.equal(p.paginate(many,1,10).items.length,10);});

test('ID copy output preserves order and handles empty results',()=>{assert.equal(p.portfolioIds([records[1],records[0]]),'B\nA');assert.equal(p.portfolioIds([]),'');});

test('bank concentration reconciles amounts shares and zero totals',()=>{const groups=p.concentration(records,'bank');assert.equal(groups.reduce((sum,g)=>sum+g.amountMinor,0),35000);assert.ok(Math.abs(groups.reduce((sum,g)=>sum+g.share,0)-100)<1e-10);assert.equal(p.concentration([record({amountMinor:0})],'bank')[0].share,0);});

test('institution concentration groups across banks and retains count totals',()=>{const groups=p.concentration(records,'institution');assert.equal(groups.reduce((sum,g)=>sum+g.count,0),3);assert.equal(groups.find(g=>g.label==='Alpha College')?.amountMinor,15000);assert.deepEqual(p.concentration([],'institution'),[]);});

test('maturity ladder excludes closed drafts and invalid dates',()=>{const ladder=p.maturityLadder([...records,record({status:'Draft'}),record({maturity:'invalid'})]);assert.deepEqual(ladder.map(g=>g.month),['2026-11','2026-12']);assert.equal(ladder.reduce((sum,g)=>sum+g.amountMinor,0),30000);});

test('document worklist ignores closed history and orders by missing categories',()=>{const gaps=p.documentGaps(records);assert.deepEqual(gaps.map(g=>g.record.id),['A','B']);assert.equal(gaps[0].missing.length,3);});

test('duplicate candidates require both matching bank and nonempty number',()=>{const same=record({id:'D',number:' n-001 ',bank:'State Bank'});assert.equal(p.duplicateCandidates([...records,same]).length,1);assert.equal(p.duplicateCandidates([records[0],record({id:'D',number:'N-001',bank:'Different Bank'})]).length,0);assert.equal(p.duplicateCandidates([record({number:''}),record({id:'D',number:' '})]).length,0);});

test('evidence gap report checks metadata only for verified lifecycle states',()=>{assert.deepEqual(p.evidenceGaps(records).map(r=>r.id),['A']);assert.equal(p.evidenceGaps([record({evidence:{source:'Bank',reference:'REF1',date:'2026-11-01',note:''}})]).length,0);assert.equal(p.evidenceGaps([record({evidence:{source:'Bank',reference:'REF1',date:'bad',note:''}})]).length,1);});
