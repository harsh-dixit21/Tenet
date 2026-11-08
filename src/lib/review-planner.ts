import type {Instrument,RequestItem} from '../components/workspace/store.ts';
import {validDate,daysBetween,missingKinds} from './portfolio.ts';
export type ReviewTask={id:string;recordId:string;title:string;createdAt:string;updatedAt:string; /* FIELDS */};
export type PlannerData={version:1;tasks:ReviewTask[]};
export type TaskInput={recordId:string;title:string; /* INPUT */};
export const plannerKey=(account:string)=>'tenet:review-planner:v1:'+encodeURIComponent(account);
export const emptyPlanner=():PlannerData=>({version:1,tasks:[]});
function text(value:unknown,label:string,max:number) {if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw new Error(`${label} is missing, too long or contains control characters.`);return value.trim();}
function timestamp(value:unknown) {if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error('Invalid task timestamp.');return value;}
export function readTask(value:unknown):ReviewTask {
  if(!value||typeof value!=='object')throw new Error('Invalid review task.');
  const item=value as Record<string,unknown>;
  const id=text(item.id,'Task ID',80);if(!/^[A-Za-z0-9_-]+$/.test(id))throw new Error('Invalid task ID.');
  return {id,recordId:text(item.recordId,'Instrument ID',120),title:text(item.title,'Task title',120),createdAt:timestamp(item.createdAt),updatedAt:timestamp(item.updatedAt), /* READ */};
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
export function addTask(data:PlannerData,input:TaskInput,id=crypto.randomUUID(),now=new Date().toISOString()):PlannerData {
  if(data.tasks.length>=200)throw new Error('Personal planner capacity is 200 tasks.');
  if(data.tasks.some(task=>task.id===id))throw new Error('Task ID already exists.');
  const task=readTask({...input,id,createdAt:now,updatedAt:now});return {...data,tasks:[...data.tasks,task]};
}
export function updateTask(data:PlannerData,id:string,patch:Partial<TaskInput>,now=new Date().toISOString()):PlannerData {
  if(!data.tasks.some(task=>task.id===id))throw new Error('This task was removed. Refresh your planner.');
  return {...data,tasks:data.tasks.map(task=>task.id===id?readTask({...task,...patch,id:task.id,recordId:task.recordId,createdAt:task.createdAt,updatedAt:now}):task)};
}
