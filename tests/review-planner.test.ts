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
