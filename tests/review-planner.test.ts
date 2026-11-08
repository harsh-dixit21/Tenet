import test from 'node:test';
import assert from 'node:assert/strict';
import * as p from '../src/lib/review-planner.ts';
import type {Instrument,RequestItem} from '../src/components/workspace/store.ts';
const now='2026-11-09T09:00:00.000Z';
const initial=()=>p.addTask(p.emptyPlanner(),{recordId:'A',title:'Review bank evidence'},'task-a',now);
const instrument=(patch:Partial<Instrument>={}):Instrument=>({id:'A',institution:'Alpha College',bank:'State Bank',branch:'Main',number:'N-001',amount:100,amountMinor:10000,issued:'2026-01-01',maturity:'2026-11-15',status:'Verified',docs:[],...patch});

test('task creation round trips and isolates account and instrument scopes',()=>{const data=initial();assert.equal(p.readPlanner(JSON.stringify(data)).tasks[0].title,'Review bank evidence');assert.notEqual(p.plannerKey('a:b'),p.plannerKey('a%3Ab'));assert.equal(p.scopedTasks(data.tasks,['foreign']).length,0);assert.throws(()=>p.addTask(data,{recordId:'A',title:'  '},'task-b',now),/Task title/);assert.throws(()=>p.addTask(data,{recordId:'A',title:'Valid'},'task-a',now),/already exists/);assert.throws(()=>p.readPlanner('{broken'));assert.throws(()=>p.readPlanner('{"version":2,"tasks":[]}'));assert.deepEqual(p.readPlanner(null),p.emptyPlanner());});

test('due dates accept leap days and reject impossible dates',()=>{assert.equal(p.taskDue('2028-02-29'),'2028-02-29');assert.throws(()=>p.taskDue('2026-02-30'),/valid task due date/);assert.equal(p.taskDue(undefined),'');});

test('priorities use an explicit supported vocabulary',()=>{assert.equal(p.taskPriority(undefined),'Medium');assert.equal(p.taskPriority('High'),'High');assert.throws(()=>p.taskPriority('Critical'),/supported task priority/);});

test('categories round trip and reject unsupported imported values',()=>{const data=p.addTask(p.emptyPlanner(),{recordId:'A',title:'Review',category:'Documents'},'task-a',now);assert.equal(p.readPlanner(JSON.stringify(data)).tasks[0].category,'Documents');assert.throws(()=>p.taskCategory('Admin'),/supported review category/);});

test('notes preserve multiline content without accepting unsafe controls',()=>{assert.equal(p.taskNotes('First\r\nSecond'),'First\nSecond');assert.equal(p.taskNotes('<script>literal text</script>'),'<script>literal text</script>');assert.throws(()=>p.taskNotes('x'.repeat(1001)),/1000 characters/);assert.throws(()=>p.taskNotes('bad\u0000note'),/unsafe controls/);});

test('completion changes task status without changing linkage or mutating input',()=>{const data=initial();const done=p.updateTask(data,'task-a',{completed:true},now);assert.equal(done.tasks[0].completed,true);assert.equal(data.tasks[0].completed,false);assert.equal(done.tasks[0].recordId,'A');assert.equal(p.updateTask(done,'task-a',{completed:false},now).tasks[0].completed,false);});

test('editing preserves immutable identity and rejects stale task IDs',()=>{const data=initial();const edited=p.updateTask(data,'task-a',{title:'Check updated evidence',recordId:'foreign'},'2026-11-09T10:00:00Z');assert.equal(edited.tasks[0].recordId,'A');assert.equal(edited.tasks[0].createdAt,now);assert.equal(edited.tasks[0].title,'Check updated evidence');assert.throws(()=>p.updateTask(data,'missing',{title:'Changed'}),/was removed/);});

test('rescheduling can remove a due date and preserves completion state',()=>{const data=p.updateTask(initial(),'task-a',{due:'2026-11-15',priority:'High',notes:'Follow up'},now);const changed=p.updateTask(data,'task-a',{due:'',notes:'Revised'},now);assert.equal(changed.tasks[0].due,'');assert.equal(changed.tasks[0].priority,'High');assert.equal(changed.tasks[0].notes,'Revised');});

test('delete and restore preserve content and reject conflicting identities',()=>{const data=initial();const removed=p.removeTask(data,'task-a');assert.equal(removed.tasks.length,0);assert.deepEqual(p.restoreTask(removed,data.tasks[0]).tasks,data.tasks);assert.throws(()=>p.restoreTask(data,data.tasks[0]),/already exists/);assert.throws(()=>p.removeTask(removed,'task-a'),/already removed/);});

test('task search combines tokens across titles and notes with accent folding',()=>{const task=p.updateTask(initial(),'task-a',{title:'Vérify evidence',notes:'Call bank branch'},now).tasks;assert.equal(p.filterTasks(task,{query:'verify branch'},'2026-11-09').length,1);assert.equal(p.filterTasks(task,{query:'unmatched'},'2026-11-09').length,0);});

test('instrument task filters use exact authorized linkage',()=>{const tasks=p.addTask(initial(),{recordId:'B',title:'Other review'},'task-b',now).tasks;assert.deepEqual(p.filterTasks(tasks,{query:'',recordId:'B'},'2026-11-09').map(task=>task.id),['task-b']);});

test('priority filters combine with instrument scope',()=>{const tasks=p.addTask(initial(),{recordId:'B',title:'Urgent',priority:'High'},'task-b',now).tasks;assert.equal(p.filterTasks(tasks,{query:'',priority:'High'},'2026-11-09').length,1);assert.equal(p.filterTasks(tasks,{query:'',priority:'High',recordId:'A'},'2026-11-09').length,0);});

test('completion filtering distinguishes open completed and all states',()=>{const data=p.updateTask(initial(),'task-a',{completed:true},now);assert.equal(p.filterTasks(data.tasks,{query:'',completion:'open'},'2026-11-09').length,0);assert.equal(p.filterTasks(data.tasks,{query:'',completion:'completed'},'2026-11-09').length,1);assert.equal(p.filterTasks(data.tasks,{query:'',completion:'all'},'2026-11-09').length,1);});

test('due horizons include exact day boundaries and exclude unscheduled tasks',()=>{const task=p.updateTask(initial(),'task-a',{due:'2026-11-16'},now).tasks[0];assert.equal(p.dueMatches(task,'week','2026-11-09'),true);assert.equal(p.dueMatches(task,'today','2026-11-16'),true);assert.equal(p.dueMatches(task,'overdue','2026-11-17'),true);assert.equal(p.dueMatches(initial().tasks[0],'week','2026-11-09'),false);assert.equal(p.dueMatches(initial().tasks[0],'unscheduled','2026-11-09'),true);});

test('task sorting uses safe tie breakers without mutating input',()=>{const data=p.addTask(initial(),{recordId:'A',title:'Another',due:'2026-11-10',priority:'High'},'task-b',now);assert.deepEqual(p.sortTasks(data.tasks,'due').map(t=>t.id),['task-b','task-a']);assert.equal(p.sortTasks(data.tasks,'priority')[0].id,'task-b');assert.deepEqual(data.tasks.map(t=>t.id),['task-a','task-b']);});

test('agenda buckets reconcile exactly and remain disjoint',()=>{let data=initial();for(const[id,due]of[['b','2026-11-08'],['c','2026-11-09'],['d','2026-11-16'],['e','2026-11-17']])data=p.addTask(data,{recordId:'A',title:id,due},id,now);const groups=p.taskAgenda(data.tasks,'2026-11-09');assert.deepEqual(groups.map(g=>g.label),['Overdue','Today','Next 7 days','Later','No due date']);assert.equal(groups.reduce((sum,g)=>sum+g.tasks.length,0),5);});

test('bulk completion only changes selected authorized tasks',()=>{const data=p.addTask(initial(),{recordId:'foreign',title:'Other'},'task-b',now);const done=p.completeTasks(data,['task-a','task-b'],['A'],now);assert.equal(done.tasks[0].completed,true);assert.equal(done.tasks[1].completed,false);assert.equal(p.taskSelection([data.tasks[0]],['task-b']).length,0);});

test('bulk rescheduling preserves completion and respects scope',()=>{const data=p.updateTask(initial(),'task-a',{completed:true},now);const moved=p.rescheduleTasks(data,['task-a'],['A'],'2026-11-20',now);assert.equal(moved.tasks[0].due,'2026-11-20');assert.equal(moved.tasks[0].completed,true);assert.equal(p.rescheduleTasks(data,['task-a'],['foreign'],'2026-11-20',now).tasks[0].due,'');assert.throws(()=>p.rescheduleTasks(data,['task-a'],['A'],'bad',now),/valid task due date/);});

test('duplicates reopen work with independent identity and bounded title length',()=>{const data=p.updateTask(initial(),'task-a',{completed:true,title:'x'.repeat(120)},now);const duplicate=p.duplicateTask(data,'task-a','task-copy','2026-11-10T09:00:00Z');assert.equal(duplicate.tasks[1].completed,false);assert.equal(duplicate.tasks[1].title.length,120);assert.equal(duplicate.tasks[1].createdAt,'2026-11-10T09:00:00Z');assert.equal(data.tasks.length,1);});

test('task CSV has a fixed schema and explicit completion vocabulary',()=>{const rows=p.taskCsvRows(initial().tasks);assert.equal(rows[0].length,rows[1].length);assert.equal(rows[1][6],'Open');assert.equal(rows[1][1],'A');assert.equal(p.taskCsvRows([]).length,1);});

test('JSON backup round trips all whitelisted task fields',()=>{const data=p.updateTask(initial(),'task-a',{notes:'Private follow-up',due:'2026-11-12'},now);const backup=p.taskBackup(data.tasks,now);assert.equal(backup.exportedAt,now);assert.deepEqual(p.readPlanner(JSON.stringify(backup)).tasks,data.tasks);assert.equal('docs' in backup.tasks[0],false);});

test('backup import previews additions rejects foreign records and never overwrites IDs',()=>{const data=initial();const backup=p.addTask(data,{recordId:'A',title:'New task'},'task-b',now);const preview=p.previewTaskImport(JSON.stringify(backup),data,['A']);assert.equal(preview.tasks.length,1);assert.equal(preview.skipped,1);assert.equal(p.mergeTaskImport(data,preview.tasks,['A']).tasks.length,2);assert.equal(data.tasks.length,1);assert.throws(()=>p.previewTaskImport(JSON.stringify(backup),data,['foreign']),/outside this authorized workspace/);assert.throws(()=>p.previewTaskImport('{bad',data,['A']));});

test('task calendar excludes completed unscheduled work and personal notes',()=>{let data=p.updateTask(initial(),'task-a',{due:'2026-11-15',title:'Review, bank; copy',notes:'PRIVATE-NOTE'},now);data=p.addTask(data,{recordId:'A',title:'Undated'},'task-b',now);const calendar=p.taskCalendar(data.tasks,'2026-11-09');assert.equal((calendar.match(/BEGIN:VEVENT/g)||[]).length,1);assert.match(calendar,/DTEND;VALUE=DATE:20261116/);assert.ok(calendar.includes('Review'+String.fromCharCode(92)+', bank'+String.fromCharCode(92)+'; copy'));assert.equal(calendar.includes('PRIVATE-NOTE'),false);for(const line of calendar.split(String.fromCharCode(13,10)))assert.ok(new TextEncoder().encode(line).length<=75);assert.throws(()=>p.taskDue('9999-12-31'),/valid task due date/);});

test('document suggestions skip closed records and deduplicate repeated generation',()=>{const candidates=p.documentSuggestions([instrument(),instrument({id:'closed',status:'Released'})],'2026-11-09');assert.equal(candidates.length,3);let id=0;const data=p.addSuggestedTasks(p.emptyPlanner(),candidates,()=>`suggest-${++id}`,now);assert.equal(data.tasks.length,3);assert.equal(p.addSuggestedTasks(data,candidates,()=>`suggest-${++id}`,now).tasks.length,3);assert.equal(p.duplicateTask(data,data.tasks[0].id,'copy',now).tasks[3].origin,'');});
