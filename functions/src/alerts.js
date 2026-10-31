import {day,closed} from './domain.js';
export function generateAlerts(records,settings,now=new Date().toISOString()){
 const difference=date=>Math.ceil((Date.parse(date)-Date.parse(day(now)))/86400000);
 return records.flatMap(r=>{
  if(closed(r)||r.status==='Draft')return [];
  const alerts=[];
  if(difference(r.maturity)<=settings.reminderDays)alerts.push({id:`maturity-${r.id}-${r.maturity}`,recordId:r.id,title:difference(r.maturity)<0?'Maturity overdue':'Approaching maturity',detail:`${r.institution} · ${r.maturity}`});
  if(r.status==='Discrepancy')alerts.push({id:`correction-${r.id}-${r.updatedAt}`,recordId:r.id,title:'Correction required',detail:r.correction||r.institution});
  if(['Awaiting verification','Release requested'].includes(r.status)&&difference(r.updatedAt.slice(0,10))<=-settings.escalationDays)alerts.push({id:`overdue-${r.id}-${r.updatedAt}`,recordId:r.id,title:'Pending action overdue',detail:`${r.institution} · ${r.status}`});
  return alerts;
 });
}
