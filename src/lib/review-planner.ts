import type {Instrument,RequestItem} from '../components/workspace/store.ts';
import {validDate,daysBetween,missingKinds,foldCalendarLine} from './portfolio.ts';
export type ReviewTask={id:string;recordId:string;title:string;createdAt:string;updatedAt:string; due:string; priority:Priority; category:TaskCategory; notes:string; completed:boolean; origin:string; checklist:ChecklistItem[]; pinned:boolean; /* FIELDS */};
export type PlannerEvent={id:string;taskId:string;recordId:string;action:string;at:string};
export type PlannerData={version:1;tasks:ReviewTask[];events:PlannerEvent[]};
export type TaskInput={recordId:string;title:string; due?:string; priority?:Priority; category?:TaskCategory; notes?:string; completed?:boolean; origin?:string; checklist?:ChecklistItem[]; pinned?:boolean; /* INPUT */};
export const plannerKey=(account:string)=>'tenet:review-planner:v1:'+encodeURIComponent(account);
export const emptyPlanner=():PlannerData=>({version:1,tasks:[],events:[]});
function text(value:unknown,label:string,max:number) {if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw new Error(`${label} is missing, too long or contains control characters.`);return value.trim();}
function timestamp(value:unknown) {if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error('Invalid task timestamp.');return value;}
export function readTask(value:unknown):ReviewTask {
  if(!value||typeof value!=='object')throw new Error('Invalid review task.');
  const item=value as Record<string,unknown>;
  const id=text(item.id,'Task ID',80);if(!/^[A-Za-z0-9_-]+$/.test(id))throw new Error('Invalid task ID.');
  return {id,recordId:text(item.recordId,'Instrument ID',120),title:text(item.title,'Task title',120),createdAt:timestamp(item.createdAt),updatedAt:timestamp(item.updatedAt), due:taskDue(item.due), priority:taskPriority(item.priority), category:taskCategory(item.category), notes:taskNotes(item.notes), completed:item.completed===true, origin:item.origin===undefined||item.origin===''?'':text(item.origin,'Task source key',240), checklist:readChecklist(item.checklist), pinned:item.pinned===true, /* READ */};
}
export function readPlanner(raw:string|null):PlannerData {
  if(raw===null)return emptyPlanner();
  if(raw.length>2000000)throw new Error('Planner data exceeds the 2 MB text limit.');
  const value=JSON.parse(raw);
  if(!value||value.version!==1||!Array.isArray(value.tasks)||value.tasks.length>200)throw new Error('Unsupported or oversized planner data.');
  const tasks:ReviewTask[]=value.tasks.map(readTask);
  if(new Set(tasks.map(task=>task.id)).size!==tasks.length)throw new Error('Duplicate task IDs in planner data.');
  const events=readPlannerEvents(value.events);
  return {version:1,tasks,events};
}
export function scopedTasks(tasks:ReviewTask[],authorizedIds:string[]) {const ids=new Set(authorizedIds);return tasks.filter(task=>ids.has(task.recordId));}
export function addTask(data:PlannerData,input:TaskInput,id:string=crypto.randomUUID(),now=new Date().toISOString()):PlannerData {
  if(data.tasks.length>=200)throw new Error('Personal planner capacity is 200 tasks.');
  if(data.tasks.some(task=>task.id===id))throw new Error('Task ID already exists.');
  const task=readTask({...input,id,createdAt:now,updatedAt:now});return {...data,tasks:[...data.tasks,task]};
}
export function updateTask(data:PlannerData,id:string,patch:Partial<TaskInput>,now=new Date().toISOString()):PlannerData {
  if(!data.tasks.some(task=>task.id===id))throw new Error('This task was removed. Refresh your planner.');
  return {...data,tasks:data.tasks.map(task=>task.id===id?readTask({...task,...patch,id:task.id,recordId:task.recordId,createdAt:task.createdAt,updatedAt:now}):task)};
}

export function taskDue(value:unknown) {if(value===undefined||value==='')return '';if(typeof value!=='string'||(!validDate(value)||value>'9999-12-30'))throw new Error('Choose a valid task due date.');return value;}

export const priorities=['High','Medium','Low'] as const;
export type Priority=typeof priorities[number];
export function taskPriority(value:unknown):Priority {if(value===undefined)return 'Medium';if(!priorities.includes(value as Priority))throw new Error('Choose a supported task priority.');return value as Priority;}

export const categories=['General','Documents','Verification','Maturity','Requests'] as const;
export type TaskCategory=typeof categories[number];
export function taskCategory(value:unknown):TaskCategory {if(value===undefined)return 'General';if(!categories.includes(value as TaskCategory))throw new Error('Choose a supported review category.');return value as TaskCategory;}

export function taskNotes(value:unknown) {if(value===undefined)return '';if(typeof value!=='string'||value.length>1000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value))throw new Error('Task notes must contain at most 1000 characters without unsafe controls.');return value.replaceAll('\r\n','\n');}

export function removeTask(data:PlannerData,id:string) {if(!data.tasks.some(task=>task.id===id))throw new Error('This task was already removed.');return {...data,tasks:data.tasks.filter(task=>task.id!==id)};}
export function restoreTask(data:PlannerData,task:ReviewTask) {if(data.tasks.length>=200)throw new Error('Personal planner capacity is 200 tasks.');if(data.tasks.some(item=>item.id===task.id))throw new Error('This task already exists.');return {...data,tasks:[...data.tasks,readTask(task)]};}

export type TaskFilters={query:string; recordId?:string; priority?:Priority; completion?:'open'|'completed'|'all'; horizon?:'all'|'overdue'|'today'|'week'|'unscheduled'; /* FILTER_FIELDS */};
const searchText=(value:string)=>value.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function filterTasks(tasks:ReviewTask[],filters:TaskFilters,reference:string) {
  const tokens=searchText(filters.query).trim().split(/\s+/).filter(Boolean);
  return tasks.filter(task=>{
    if(!tokens.every(token=>searchText([task.title,task.notes,task.recordId,task.category].join(' ')).includes(token)))return false;
    if(filters.recordId&&task.recordId!==filters.recordId)return false;
    if(filters.priority&&task.priority!==filters.priority)return false;
    if(filters.completion==='open'&&task.completed||filters.completion==='completed'&&!task.completed)return false;
    if(!dueMatches(task,filters.horizon,reference))return false;
    /* FILTER_RULES */
    return true;
  });
}

export function dueMatches(task:ReviewTask,horizon:string|undefined,reference:string) {
  if(!horizon||horizon==='all')return true;
  if(horizon==='unscheduled')return !task.due;
  if(!task.due)return false;
  const days=daysBetween(task.due,reference);
  return horizon==='overdue'?days<0:horizon==='today'?days===0:horizon==='week'?days>=0&&days<=7:false;
}

export type TaskSort='due'|'priority'|'created'|'title';
export function sortTasks(tasks:ReviewTask[],sort:TaskSort) {
  return [...tasks].sort((a,b)=>{
    if(a.pinned!==b.pinned)return a.pinned?-1:1;
    const result=sort==='priority'?priorities.indexOf(a.priority)-priorities.indexOf(b.priority):sort==='created'?b.createdAt.localeCompare(a.createdAt):sort==='title'?a.title.localeCompare(b.title):(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31');
    return result||a.id.localeCompare(b.id);
  });
}

export function taskAgenda(tasks:ReviewTask[],reference:string) {
  const labels=['Overdue','Today','Next 7 days','Later','No due date'];
  return labels.map(label=>({label,tasks:sortTasks(tasks.filter(task=>{const days=task.due?daysBetween(task.due,reference):NaN;return label==='No due date'?!task.due:label==='Overdue'?days<0:label==='Today'?days===0:label==='Next 7 days'?days>0&&days<=7:days>7;}),'due')})).filter(group=>group.tasks.length);
}

export function taskSelection(tasks:ReviewTask[],ids:string[]) {const selected=new Set(ids);return tasks.filter(task=>selected.has(task.id));}
export function completeTasks(data:PlannerData,ids:string[],authorizedIds:string[],now=new Date().toISOString()) {
  const selected=new Set(ids);const allowed=new Set(authorizedIds);
  return {...data,tasks:data.tasks.map(task=>selected.has(task.id)&&allowed.has(task.recordId)?{...task,completed:true,updatedAt:now}:task)};
}

export function rescheduleTasks(data:PlannerData,ids:string[],authorizedIds:string[],due:string,now=new Date().toISOString()) {
  const nextDue=taskDue(due);const selected=new Set(ids);const allowed=new Set(authorizedIds);
  return {...data,tasks:data.tasks.map(task=>selected.has(task.id)&&allowed.has(task.recordId)?{...task,due:nextDue,updatedAt:now}:task)};
}

export function duplicateTask(data:PlannerData,id:string,newId:string=crypto.randomUUID(),now=new Date().toISOString()) {
  const task=data.tasks.find(task=>task.id===id);if(!task)throw new Error('This task was removed.');
  return addTask(data,{...structuredClone(task),title:task.title.slice(0,113)+' (copy)',completed:false,origin:'',pinned:false,checklist:task.checklist.map(item=>({...item,id:crypto.randomUUID(),done:false}))},newId,now);
}

export function taskCsvRows(tasks:ReviewTask[]):(string|number)[][] {return [['Task ID','Instrument ID','Title','Due date','Priority','Category','Completion','Personal notes'],...tasks.map(task=>[task.id,task.recordId,task.title,task.due,task.priority,task.category,task.completed?'Completed':'Open',task.notes])];}

export function taskBackup(tasks:ReviewTask[],exportedAt=new Date().toISOString()) {return {version:1 as const,exportedAt,tasks:tasks.map(readTask)};}

export function previewTaskImport(raw:string,data:PlannerData,authorizedIds:string[]) {
  const incoming=readPlanner(raw).tasks;const allowed=new Set(authorizedIds);
  if(incoming.some(task=>!allowed.has(task.recordId)))throw new Error('Backup references instruments outside this authorized workspace.');
  const existing=new Set(data.tasks.map(task=>task.id));const additions=incoming.filter(task=>!existing.has(task.id));
  if(data.tasks.length+additions.length>200)throw new Error('Import would exceed the 200-task capacity.');
  return {tasks:additions,skipped:incoming.length-additions.length};
}
export function mergeTaskImport(data:PlannerData,tasks:ReviewTask[],authorizedIds:string[]) {
  const preview=previewTaskImport(JSON.stringify({version:1,tasks}),data,authorizedIds);
  return {...data,tasks:[...data.tasks,...preview.tasks]};
}

const calendarSlash=String.fromCharCode(92),calendarNewline=String.fromCharCode(10),calendarCR=String.fromCharCode(13);
const taskCalendarEscape=(value:string)=>value.replaceAll(calendarSlash,calendarSlash+calendarSlash).replaceAll(calendarCR+calendarNewline,calendarNewline).replaceAll(calendarCR,calendarNewline).replaceAll(calendarNewline,calendarSlash+'n').replaceAll(';',calendarSlash+';').replaceAll(',',calendarSlash+',');
export function taskCalendar(tasks:ReviewTask[],reference:string) {
  if(!validDate(reference))throw new Error('Choose a valid reporting date.');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Tenet//Personal Review Tasks//EN','CALSCALE:GREGORIAN'];
  for(const task of tasks.filter(task=>!task.completed&&task.due)){
    const end=new Date(Date.parse(task.due)+86400000).toISOString().slice(0,10).replaceAll('-','');
    lines.push('BEGIN:VEVENT',`UID:review-${task.id}@tenet.local`,`DTSTAMP:${reference.replaceAll('-','')}T000000Z`,`DTSTART;VALUE=DATE:${task.due.replaceAll('-','')}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${taskCalendarEscape(task.title)}`,`DESCRIPTION:${taskCalendarEscape('Instrument '+task.recordId+'; '+task.category+'; '+task.priority+' priority')}`,'END:VEVENT');
  }
  lines.push('END:VCALENDAR');return lines.map(foldCalendarLine).join(calendarCR+calendarNewline)+calendarCR+calendarNewline;
}

const terminalStatuses=new Set(['Released','Refunded','Discharged','Renewed','Replaced']);
const activeReviewRecord=(record:Instrument)=>record.status!=='Draft'&&!terminalStatuses.has(record.status);
export function addSuggestedTasks(data:PlannerData,candidates:TaskInput[],idFactory:()=>string=()=>crypto.randomUUID(),now=new Date().toISOString()) {
  const origins=new Set(data.tasks.map(task=>task.origin).filter(Boolean));let next=data;
  for(const candidate of candidates){if(!candidate.origin)throw new Error('Suggested tasks need a source key.');if(origins.has(candidate.origin))continue;next=addTask(next,{...candidate,title:candidate.title.slice(0,120)},idFactory(),now);origins.add(candidate.origin);}
  return next;
}
export function documentSuggestions(records:Instrument[],reference:string):TaskInput[] {
  taskDue(reference);
  return records.filter(activeReviewRecord).flatMap(record=>missingKinds(record).map(kind=>({recordId:record.id,title:`Collect ${kind} for ${record.id}`,due:reference,priority:'Medium' as Priority,category:'Documents' as TaskCategory,origin:`document:${record.id}:${kind}`})));
}

export function evidenceSuggestions(records:Instrument[],reference:string):TaskInput[] {
  taskDue(reference);
  return records.filter(record=>['Verified','Release requested'].includes(record.status)&&(!record.evidence?.source?.trim()||!record.evidence.reference?.trim()||!validDate(record.evidence.date))).map(record=>({recordId:record.id,title:`Review evidence metadata for ${record.id}`,due:reference,priority:'High',category:'Verification',origin:`evidence:${record.id}`}));
}

export function maturitySuggestions(records:Instrument[],reference:string,horizon:number):TaskInput[] {
  taskDue(reference);if(!Number.isInteger(horizon)||horizon<1||horizon>365)throw new Error('Maturity horizon must be 1 to 365 days.');
  return records.filter(record=>activeReviewRecord(record)&&daysBetween(record.maturity,reference)>=0&&daysBetween(record.maturity,reference)<=horizon).map(record=>({recordId:record.id,title:`Review upcoming maturity for ${record.id}`,due:record.maturity,priority:daysBetween(record.maturity,reference)<=7?'High':'Medium',category:'Maturity',origin:`maturity:${record.id}:${record.maturity}`}));
}

export function requestSuggestions(records:Instrument[],requests:RequestItem[],reference:string,threshold:number):TaskInput[] {
  taskDue(reference);if(!Number.isInteger(threshold)||threshold<1||threshold>90)throw new Error('Pending request age must be 1 to 90 days.');
  const authorized=new Set(records.map(record=>record.id));
  return requests.filter(request=>authorized.has(request.recordId)&&request.status==='Pending'&&daysBetween(reference,request.date.slice(0,10))>=threshold).map(request=>({recordId:request.recordId,title:`Follow up ${request.type.toLowerCase()} request ${request.id}`,due:reference,priority:'High',category:'Requests',origin:`request:${request.id}`}));
}

export function readPlannerEvents(value:unknown):PlannerEvent[] {
  if(value===undefined)return [];if(!Array.isArray(value)||value.length>100)throw new Error('Invalid personal planner history.');
  return value.map(raw=>{if(!raw||typeof raw!=='object')throw new Error('Invalid planner event.');const event=raw as Record<string,unknown>;return {id:text(event.id,'Event ID',80),taskId:text(event.taskId,'Task ID',80),recordId:text(event.recordId,'Instrument ID',120),action:text(event.action,'Planner action',120),at:timestamp(event.at)};});
}
export function recordPlannerChanges(before:PlannerData,next:PlannerData,now=new Date().toISOString()):PlannerData {
  const previous=new Map(before.tasks.map(task=>[task.id,task]));const after=new Set(next.tasks.map(task=>task.id));const changes:PlannerEvent[]=[];
  for(const task of next.tasks){const prior=previous.get(task.id);let action='';if(!prior)action='Created task';else if(task.completed!==prior.completed)action=task.completed?'Completed task':'Reopened task';else if(task.due!==prior.due)action='Rescheduled task';else if(JSON.stringify(task)!==JSON.stringify(prior))action='Edited task';if(action)changes.push({id:crypto.randomUUID(),taskId:task.id,recordId:task.recordId,action,at:now});}
  for(const task of before.tasks)if(!after.has(task.id))changes.push({id:crypto.randomUUID(),taskId:task.id,recordId:task.recordId,action:'Deleted task',at:now});
  return {...next,events:[...changes.reverse(),...before.events].slice(0,100)};
}
export function scopedPlannerEvents(events:PlannerEvent[],authorizedIds:string[]) {const allowed=new Set(authorizedIds);return events.filter(event=>allowed.has(event.recordId));}

export type ChecklistItem={id:string;label:string;done:boolean};
export function readChecklist(value:unknown):ChecklistItem[] {
  if(value===undefined)return [];if(!Array.isArray(value)||value.length>10)throw new Error('A task checklist supports at most 10 steps.');
  const items=value.map(raw=>{if(!raw||typeof raw!=='object')throw new Error('Invalid checklist step.');const item=raw as Record<string,unknown>;if(item.done!==undefined&&typeof item.done!=='boolean')throw new Error('Invalid checklist completion state.');return {id:text(item.id,'Checklist ID',80),label:text(item.label,'Checklist label',80),done:item.done===true};});
  if(new Set(items.map(item=>item.id)).size!==items.length||new Set(items.map(item=>item.label.toLowerCase())).size!==items.length)throw new Error('Checklist steps must have unique IDs and labels.');
  return items;
}
export function checklistFromLines(existing:ChecklistItem[],source:string) {
  const labels=source.replaceAll(String.fromCharCode(13),'').split(String.fromCharCode(10)).map(line=>line.trim()).filter(Boolean);
  const previous=new Map(existing.map(item=>[item.label.toLowerCase(),item]));
  return readChecklist(labels.map(label=>{const item=previous.get(label.toLowerCase());return {id:item?.id||crypto.randomUUID(),label,done:item?.done||false};}));
}
export function toggleChecklist(data:PlannerData,taskId:string,itemId:string,now=new Date().toISOString()) {
  const task=data.tasks.find(task=>task.id===taskId);if(!task||!task.checklist.some(item=>item.id===itemId))throw new Error('This checklist step was removed.');
  return updateTask(data,taskId,{checklist:task.checklist.map(item=>item.id===itemId?{...item,done:!item.done}:item)},now);
}

export function checklistProgress(task:ReviewTask) {const total=task.checklist.length;const done=task.checklist.filter(item=>item.done).length;return {total,done,percent:total?Math.round(done/total*100):0};}

export function nextReviewTask(tasks:ReviewTask[]) {
  return [...tasks].filter(task=>!task.completed).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||priorities.indexOf(a.priority)-priorities.indexOf(b.priority)||(a.due||'9999-12-31').localeCompare(b.due||'9999-12-31')||a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id))[0];
}
export function focusQueue(tasks:ReviewTask[]) {const next=nextReviewTask(tasks);return next?[next]:[];}

export function plannerSummary(tasks:ReviewTask[],reference:string) {
  const open=tasks.filter(task=>!task.completed);
  return {open:open.length,overdue:open.filter(task=>task.due&&daysBetween(task.due,reference)<0).length,today:open.filter(task=>task.due===reference).length,completed:tasks.filter(task=>task.completed).length};
}

export const plannerStorageKeyMatches=(expected:string,incoming:string|null)=>incoming===expected||incoming===null;
