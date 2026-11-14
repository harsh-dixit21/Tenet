import {day,closed} from './domain.js';
export function generateAlerts(records,settings,now=new Date().toISOString()){
 const today = Date.parse(day(now));
 const difference=date=>Math.ceil((Date.parse(date)-today)/86400000);
 return records.flatMap(r=>{
  if(closed(r)||r.status==='Draft')return [];
  const alerts=[];
  const maturityDays = difference(r.maturity);
  if(maturityDays<=settings.reminderDays)alerts.push({id:`maturity-${r.id}-${r.maturity}`,recordId:r.id,title:maturityDays<0?'Maturity overdue':'Approaching maturity',detail:`${r.institution} · ${r.maturity}`});
  if(r.status==='Discrepancy')alerts.push({id:`correction-${r.id}-${r.updatedAt||r.createdAt||'legacy'}`,recordId:r.id,title:'Correction required',detail:r.correction||r.institution});
  if(['Awaiting verification','Release requested'].includes(r.status)&&r.updatedAt&&difference(day(r.updatedAt))<=-settings.escalationDays)alerts.push({id:`overdue-${r.id}-${r.updatedAt}`,recordId:r.id,title:'Pending action overdue',detail:`${r.institution} · ${r.status}`});
  return alerts;
 });
}
