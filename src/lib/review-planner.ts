import type {Instrument,RequestItem} from '../components/workspace/store.ts';
import {validDate,daysBetween,missingKinds} from './portfolio.ts';
export type ReviewTask={id:string;recordId:string;title:string;createdAt:string;updatedAt:string; due:string; priority:Priority; category:TaskCategory; notes:string; completed:boolean; /* FIELDS */};
export type PlannerData={version:1;tasks:ReviewTask[]};
export type TaskInput={recordId:string;title:string; due?:string; priority?:Priority; category?:TaskCategory; notes?:string; completed?:boolean; /* INPUT */};
export const plannerKey=(account:string)=>'tenet:review-planner:v1:'+encodeURIComponent(account);
export const emptyPlanner=():PlannerData=>({version:1,tasks:[]});
function text(value:unknown,label:string,max:number) {if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw new Error(`${label} is missing, too long or contains control characters.`);return value.trim();}
function timestamp(value:unknown) {if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error('Invalid task timestamp.');return value;}
export function readTask(value:unknown):ReviewTask {
  if(!value||typeof value!=='object')throw new Error('Invalid review task.');
  const item=value as Record<string,unknown>;
  const id=text(item.id,'Task ID',80);if(!/^[A-Za-z0-9_-]+$/.test(id))throw new Error('Invalid task ID.');
  return {id,recordId:text(item.recordId,'Instrument ID',120),title:text(item.title,'Task title',120),createdAt:timestamp(item.createdAt),updatedAt:timestamp(item.updatedAt), due:taskDue(item.due), priority:taskPriority(item.priority), category:taskCategory(item.category), notes:taskNotes(item.notes), completed:item.completed===true, /* READ */};
}
export function readPlanner(raw:string|null):PlannerData {
  if(raw===null)return emptyPlanner();
  if(raw.length>2000000)throw new Error('Planner data exceeds the 2 MB text limit.');
  const value=JSON.parse(raw);
  if(!value||value.version!==1||!Array.isArray(value.tasks)||value.tasks.length>200)throw new Error('Unsupported or oversized planner data.');
  const tasks:ReviewTask[]=value.tasks.map(readTask);
  if(new Set(tasks.map(task=>task.id)).size!==tasks.length)throw new Error('Duplicate task IDs in planner data.');
  return {version:1,tasks};
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

export function taskDue(value:unknown) {if(value===undefined||value==='')return '';if(typeof value!=='string'||!validDate(value))throw new Error('Choose a valid task due date.');return value;}

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
  return addTask(data,{...structuredClone(task),title:task.title.slice(0,113)+' (copy)',completed:false},newId,now);
}
