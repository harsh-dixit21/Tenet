import {useMemo,useState,type FormEvent,type ReactNode} from 'react';
import * as p from '@/lib/review-planner';
import {useSession} from '@/lib/firebase/session';
import {useWorkspace,today,download,csv} from './store';
import {useReviewPlanner} from './use-review-planner';
import './review-planner.css';

function Field({label,children}:{label:string;children:ReactNode}) { return <label className="planner-field"><span>{label}</span>{children}</label>; }
function Panel({title,children}:{title:string;children:ReactNode}) {const[open,setOpen]=useState(false);return <details className="planner-panel" onToggle={event=>setOpen(event.currentTarget.open)}><summary>{title}</summary>{open&&<div className="planner-panel-body">{children}</div>}</details>;}

export function ReviewPlanner() {
  const {state:workspace}=useWorkspace();
  const session=useSession();
  const planner=useReviewPlanner(p.plannerKey(session.user?.uid||'demo'));
  const reference=today();
  const scoped=useMemo(()=>p.scopedTasks(planner.data.tasks,workspace.records.map(record=>record.id)),[planner.data.tasks,workspace.records]);
  const recordNames=useMemo(()=>new Map(workspace.records.map(record=>[record.id,record.institution])),[workspace.records]);
  const [editing,setEditing]=useState('');
  const [deleted,setDeleted]=useState<p.ReviewTask|null>(null);
  const [taskFilters,setTaskFilters]=useState<p.TaskFilters>({query:'',completion:'open'});
  const [sort,setSort]=useState<p.TaskSort>('due');
  const [selected,setSelected]=useState<string[]>([]);
  const [bulkDue,setBulkDue]=useState('');

  const visible = p.sortTasks(p.filterTasks(scoped,taskFilters,reference),sort);
  function create(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();const form=event.currentTarget;const values=new FormData(form);
    if(planner.update(data=>p.addTask(data,{title:String(values.get('title')||''),recordId:String(values.get('recordId')||'') ,due:String(values.get('due')||''),priority:String(values.get('priority')||'Medium') as p.Priority,category:String(values.get('category')||'General') as p.TaskCategory,notes:String(values.get('notes')||'')}), 'Review task created.'))form.reset();
  }
  return <section className="review-planner" aria-label="Personal review planner">
    <div className="planner-heading"><div><h2>Personal review tasks</h2><p className="planner-note">Saved for this account in this browser. Task changes do not change instrument decisions.</p></div><span className="planner-note">{scoped.length} tasks linked to authorized instruments</span></div>
    {planner.error&&<div role="alert" className="planner-note">{planner.error}{planner.blocked&&<button onClick={()=>{if(window.confirm('Remove unreadable personal planner data for this account in this browser?'))planner.reset();}}>Reset unreadable planner data</button>}</div>}
    {planner.notice&&<p role="status" className="planner-note">{planner.notice}</p>}
    {deleted&&<div className="planner-actions"><p className="planner-note">Deleted task: {deleted.title}</p><button onClick={()=>{if(workspace.records.some(record=>record.id===deleted.recordId)&&planner.update(data=>p.restoreTask(data,deleted),'Task restored.'))setDeleted(null);}}>Undo task deletion</button></div>}
    <details className="planner-create" open><summary>Add a review task</summary><form onSubmit={create} className="planner-form">
      <Field label="Review task title"><input name="title" required maxLength={120} placeholder="Follow up on a deposit review"/></Field>
      <Field label="Linked instrument"><select name="recordId" required defaultValue=""><option value="" disabled>Choose an authorized instrument</option>{workspace.records.map(record=><option key={record.id} value={record.id}>{record.id} · {record.institution}</option>)}</select></Field>
      <Field label="Task due date"><input name="due" type="date"/></Field>
<Field label="Task priority"><select name="priority" defaultValue="Medium">{p.priorities.map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Review category"><select name="category" defaultValue="General">{p.categories.map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Personal task notes"><textarea name="notes" maxLength={1000} placeholder="Optional follow-up context"/></Field>
      <button className="planner-primary" type="submit" disabled={planner.blocked||!workspace.records.length}>Create review task</button>
    </form></details>
    <div className="planner-filters"><Field label="Search personal tasks"><input type="search" value={taskFilters.query} onChange={event=>setTaskFilters(current=>({...current,query:event.target.value}))} placeholder="Task title, notes, category or instrument"/></Field>
<Field label="Filter task instrument"><select value={taskFilters.recordId||''} onChange={event=>setTaskFilters(current=>({...current,recordId:event.target.value}))}><option value="">All authorized instruments</option>{workspace.records.map(record=><option key={record.id} value={record.id}>{record.id}</option>)}</select></Field>
<Field label="Filter task priority"><select value={taskFilters.priority||''} onChange={event=>setTaskFilters(current=>({...current,priority:(event.target.value||undefined) as p.Priority|undefined}))}><option value="">All priorities</option>{p.priorities.map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Task completion filter"><select value={taskFilters.completion||'all'} onChange={event=>setTaskFilters(current=>({...current,completion:event.target.value as p.TaskFilters['completion']}))}><option value="open">Open tasks</option><option value="completed">Completed tasks</option><option value="all">All completion states</option></select></Field>
<Field label="Task due horizon"><select value={taskFilters.horizon||'all'} onChange={event=>setTaskFilters(current=>({...current,horizon:event.target.value as p.TaskFilters['horizon']}))}><option value="all">Any due date</option><option value="overdue">Overdue tasks</option><option value="today">Due today</option><option value="week">Next 7 days</option><option value="unscheduled">No due date</option></select></Field>
<Field label="Review task order"><select value={sort} onChange={event=>setSort(event.target.value as p.TaskSort)}><option value="due">Due date first</option><option value="priority">Priority first</option><option value="created">Newest created</option><option value="title">Title A–Z</option></select></Field></div>
    <Panel title="Planner tools"><div className="planner-tools"><div className="planner-form"><Field label="Selected tasks due date"><input type="date" value={bulkDue} onChange={event=>setBulkDue(event.target.value)}/></Field><button disabled={!p.taskSelection(visible,selected).length} onClick={()=>planner.update(data=>p.rescheduleTasks(data,p.taskSelection(visible,selected).map(task=>task.id),workspace.records.map(record=>record.id),bulkDue),bulkDue?'Selected task due dates updated.':'Selected task due dates cleared.')}>Reschedule selected tasks</button><p className="planner-note">A blank date clears selected due dates.</p></div></div></Panel>
    <div className="planner-actions"><label className="planner-check"><input type="checkbox" checked={visible.length>0&&visible.every(task=>selected.includes(task.id))} onChange={event=>setSelected(event.target.checked?visible.map(task=>task.id):[])}/>Select matching tasks</label><span className="planner-note">{p.taskSelection(visible,selected).length} selected in current filters</span><button disabled={!p.taskSelection(visible,selected).length} onClick={()=>{if(planner.update(data=>p.completeTasks(data,p.taskSelection(visible,selected).map(task=>task.id),workspace.records.map(record=>record.id)),'Selected review tasks completed.'))setSelected([]);}}>Complete selected tasks</button></div>
    <p className="planner-note" role="status">{visible.length} matching review tasks</p>
    <div className="planner-task-list">{visible.map(task=><article key={task.id} id={`review-task-${task.id}`} className="planner-task" tabIndex={-1}>
      <div className="planner-task-main"><label className="planner-check"><input type="checkbox" aria-label={`Select review task ${task.title}`} checked={selected.includes(task.id)} onChange={()=>setSelected(current=>current.includes(task.id)?current.filter(id=>id!==task.id):[...current,task.id])}/><span className="sr-only">Select task</span></label><div className="planner-task-identity"><h3>{task.title}</h3><p className="planner-note"><a href={`#instrument/${encodeURIComponent(task.recordId)}`}>{task.recordId}</a> · {recordNames.get(task.recordId)}</p><div className="planner-task-meta"><span>{task.due?`Due ${task.due}`:'No due date'}</span>
<span>{task.priority} priority</span>
<span>{task.category}</span>
<span>{task.completed?'Completed':'Open'}</span></div></div><div className="planner-actions"><button onClick={()=>planner.update(data=>p.updateTask(data,task.id,{completed:!task.completed}),task.completed?'Review task reopened.':'Review task completed.')}>{task.completed?'Reopen task':'Complete task'}</button>
<button onClick={()=>setEditing(task.id)}>Edit task</button>
<button onClick={()=>{if(window.confirm(`Delete personal task “${task.title}”?`)&&planner.update(data=>p.removeTask(data,task.id),'Task deleted. You can undo this deletion.'))setDeleted(task);}}>Delete task</button></div></div>

      <Panel title={`Notes for ${task.title}`}>{task.notes?<p className="planner-notes">{task.notes}</p>:<p className="planner-note">No personal notes added.</p>}</Panel>
      {editing===task.id&&<form className="planner-edit planner-form" onSubmit={event=>{event.preventDefault();const values=new FormData(event.currentTarget);if(planner.update(data=>p.updateTask(data,task.id,{ title:String(values.get('title')||''),due:String(values.get('due')||''),priority:String(values.get('priority')||'Medium') as p.Priority,category:String(values.get('category')||'General') as p.TaskCategory,notes:String(values.get('notes')||'') }),'Review task updated.'))setEditing('');}}>
        <Field label="Edit review task title"><input name="title" required maxLength={120} defaultValue={task.title}/></Field>
<Field label="Edit task due date"><input name="due" type="date" defaultValue={task.due}/></Field>
<Field label="Edit task priority"><select name="priority" defaultValue={task.priority}>{p.priorities.map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Edit review category"><select name="category" defaultValue={task.category}>{p.categories.map(value=><option key={value}>{value}</option>)}</select></Field>
<Field label="Edit personal notes"><textarea name="notes" maxLength={1000} defaultValue={task.notes}/></Field>
        <button type="submit">Save task changes</button><button type="button" onClick={()=>setEditing('')}>Cancel editing</button>
      </form>}
    </article>)}</div>
    {!visible.length&&<p className="planner-empty">No matching review tasks. Create a task for an authorized instrument or adjust the task filters.</p>}
    <Panel title="Due-date agenda">{p.taskAgenda(visible,reference).map(group=><section key={group.label} className="planner-agenda"><h3>{group.label} · {group.tasks.length}</h3><ul>{group.tasks.map(task=><li key={task.id}><a href={`#instrument/${encodeURIComponent(task.recordId)}`}>{task.recordId}</a> — {task.title}{task.due?` · ${task.due}`:''}</li>)}</ul></section>)}</Panel>
  </section>;
}
