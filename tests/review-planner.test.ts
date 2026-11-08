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
