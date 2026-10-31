import {createHash} from 'node:crypto';
export class DomainError extends Error {constructor(code,message){super(message);this.code=code}}
const fail=(message,code='failed-precondition')=>{throw new DomainError(code,message)};
export const requireRole=(actor,...roles)=>{if(!actor?.active||!roles.includes(actor.role))fail('Your assigned role cannot perform this action.','permission-denied')};
export const text=(value,label,max=1500)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail(`${label} is required (maximum ${max} characters).`,'invalid-argument');if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value))fail(`${label} contains unsupported control characters.`,'invalid-argument');return value.trim().normalize('NFC')};
export function date(value,label){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||(!Number.isFinite(Date.parse(value+'T00:00:00Z'))||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value))fail(`${label} must be a valid date.`,'invalid-argument');if(Number(value.slice(0,4))<1900||Number(value.slice(0,4))>2199)fail(`${label} must be between 1900 and 2199.`,'invalid-argument');return value}
export const day=now=>new Date(now).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
export const closed=r=>['Released','Refunded','Discharged','Renewed','Replaced'].includes(r.status);
export const requiredDocs=['Instrument copy','Bank letter','Declaration'];
const complete=r=>requiredDocs.every(kind=>r.docs.some(d=>d.kind===kind));
export const uniqueKey=(bank,number)=>createHash('sha256').update(bank.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ')+'\0'+number.normalize('NFKC').trim().toLowerCase().replace(/\s+/g,'')).digest('hex');
export function owns(actor,record){if(!record)fail('Instrument not found.','not-found');if(actor.role==='Institution'&&actor.institutionId!==record.institutionId)fail('This instrument belongs to another institution.','permission-denied')}
export function canRead(actor,record){owns(actor,record);requireRole(actor,'Institution','Reviewer','Approver','Admin')}
export function applyCommand({actor,command,record,parent,request,now=new Date().toISOString(),document,successorExists=false}){
  if(typeof actor?.uid!=='string'||!actor.uid.trim())fail('A trusted actor identity is required.','permission-denied');
  if(!actor?.active)fail('Account access is disabled.','permission-denied');
  if(!command||typeof command!=='object'||Array.isArray(command))fail('A workflow command object is required.','invalid-argument');
  if(!['Institution','Reviewer','Approver','Admin'].includes(actor.role))fail('Unknown account role.','permission-denied');
  const c=command,type=c.type;let r=record?structuredClone(record):null,p=parent?structuredClone(parent):null,q=request?structuredClone(request):null,settings;
  if(r&&!['Draft','Awaiting verification','Discrepancy','Verified','Release requested','Released','Refunded','Discharged','Renewed','Replaced'].includes(r.status))fail('Instrument has an invalid lifecycle state.');
  if(type==='saveInstrument'){
    requireRole(actor,'Institution');if(!actor.institutionId||!actor.institutionName)fail('Complete institution onboarding first.');
    if(r&&c.parent&&r.parent&&c.parent!==r.parent)fail('An existing predecessor link cannot be changed.');
    if(r){owns(actor,r);if(!['Draft','Discrepancy'].includes(r.status))fail('Only a draft or returned submission can be edited.');}
    const f=c.fields||{};const bank=text(f.bank,'Bank',100),number=text(f.number,'Instrument number',60),branch=text(f.branch,'Branch',100),issued=date(f.issued,'Issue date'),maturity=date(f.maturity,'Maturity date');
    const amount=f.amount;if(typeof amount!=='number'||!Number.isFinite(amount)||amount<=0||amount>1e12||Math.abs(amount*100-Math.round(amount*100))>.001)fail('Enter a positive INR amount with at most two decimal places.','invalid-argument');
    if(issued>day(now)||issued>=maturity)fail('Issue date must be on/before today and earlier than maturity.','invalid-argument');
    if(!['Draft','Awaiting verification'].includes(c.status))fail('Invalid submission status.','invalid-argument');
    if(c.parent===c.id||r?.parent===r?.id&&r?.parent)fail('An instrument cannot link to itself.','invalid-argument');
    if(c.parent||r?.parent){if(!p)fail('Original instrument not found.');owns(actor,p);if(p.status!=='Verified'||successorExists&&!r)fail('Original instrument is not eligible or already has a successor.');if(!['Renewal','Replacement'].includes(r?.relation||c.relation))fail('Invalid successor type.','invalid-argument');if((r?.relation||c.relation)==='Renewal'&&maturity<=p.maturity)fail('Renewal maturity must extend the original maturity.');}
    r={...(r||{}),id:c.id,institutionId:actor.institutionId,institution:actor.institutionName,bank,number,branch,amountMinor:Math.round(amount*100),amount:Math.round(amount*100)/100,issued,maturity,status:c.status,docs:r?.docs||[],createdBy:r?.createdBy||actor.uid,createdAt:r?.createdAt||now,updatedAt:now,...(p?{parent:p.id,relation:r?.relation||c.relation}:{})};
  }else if(type==='settings'){
    requireRole(actor,'Approver','Admin');const {reminderDays,escalationDays}=c.settings||{};if(!Number.isInteger(reminderDays)||reminderDays<1||reminderDays>365||!Number.isInteger(escalationDays)||escalationDays<1||escalationDays>90)fail('Reminder and escalation thresholds are out of range.','invalid-argument');settings={reminderDays,escalationDays};
  }else{
    owns(actor,r);
    if(type==='uploadDocument'){
      requireRole(actor,'Institution');if(!['Draft','Awaiting verification','Discrepancy'].includes(r.status))fail('Documents are locked after verification.');if(r.docs.length>=100)fail('This instrument has reached its document-version limit.');
      if(!document)fail('Document upload is missing.');const version=Math.max(0,...r.docs.filter(d=>d.kind===document.kind).map(d=>d.version))+1;r.docs.push({...document,version,date:day(now)});
    }else if(type==='verify'){
      requireRole(actor,'Reviewer','Admin');if(r.status!=='Awaiting verification')fail('Only a submitted instrument can be verified.');if(r.createdBy===actor.uid)fail('You cannot verify your own submission.','permission-denied');if(!complete(r))fail('Instrument copy, bank letter and declaration are required.');
      const e=c.evidence||{};const verifiedDate=date(e.date,'Verification date');if(verifiedDate<r.issued)fail('Verification date cannot precede issue date.');if(verifiedDate>day(now))fail('Verification date cannot be in the future.');r.evidence={source:text(e.source,'Verification source',200),reference:text(e.reference,'Evidence reference',200),note:text(e.note,'Review note'),date:verifiedDate};r.status='Verified';r.verifiedBy=actor.uid;r.verifiedAt=now;delete r.correction;
      if(r.parent){if(!p||p.status!=='Verified'||p.institutionId!==r.institutionId)fail('Original instrument is no longer eligible.');p.status=r.relation==='Replacement'?'Replaced':'Renewed';p.updatedAt=now;}
    }else if(type==='correct'){
      requireRole(actor,'Reviewer','Admin');if(r.createdBy===actor.uid)fail('You cannot review your own submission.','permission-denied');if(r.status!=='Awaiting verification')fail('Only submitted instruments can be returned.');r.correction=text(c.note,'Correction note');r.status='Discrepancy';
    }else if(type==='resubmit'){
      requireRole(actor,'Institution');if(r.status!=='Discrepancy'||!complete(r))fail('A returned record with all required documents is needed.');r.status='Awaiting verification';
    }else if(type==='request'){
      requireRole(actor,'Institution');if(r.status!=='Verified'||successorExists)fail('Use a verified instrument with no pending successor.');if(!['Release','Refund','Discharge'].includes(c.requestType))fail('Invalid request type.','invalid-argument');q={id:c.requestId,recordId:r.id,institutionId:r.institutionId,type:c.requestType,reason:text(c.reason,'Request reason'),status:'Pending',date:day(now),createdBy:actor.uid,createdAt:now};r.status='Release requested';
    }else if(type==='decide'){
      requireRole(actor,'Approver','Admin');if(!q||q.recordId!==r.id||q.status!=='Pending'||r.status!=='Release requested')fail('This request is not pending.');if(q.institutionId!==r.institutionId)fail('Request institution does not match its instrument.');if(actor.uid===r.createdBy||actor.uid===r.verifiedBy||actor.uid===q.createdBy)fail('A different official must decide this request.','permission-denied');if(!['Approved','Rejected'].includes(c.decision))fail('Invalid decision.','invalid-argument');
      if(c.decision==='Approved'){if(c.eligibilityConfirmed!==true)fail('Confirm that applicable release conditions have been reviewed.');if(['Release','Refund'].includes(q.type)&&r.maturity>day(now))fail('Release/refund requires maturity.');if(!r.evidence||!complete(r))fail('Verification evidence and required documents must be present.');}
      q.status=c.decision;q.decision=text(c.note,'Decision notes');q.decidedBy=actor.uid;q.decidedAt=now;r.status=c.decision==='Rejected'?'Verified':q.type==='Refund'?'Refunded':q.type==='Discharge'?'Discharged':'Released';
    }else fail('Unknown workflow command.','invalid-argument');
    r.updatedAt=now;
  }
  const descriptions={saveInstrument:c.status==='Draft'?'Draft saved':'Instrument submitted for review',uploadDocument:'Supporting document uploaded',verify:'Verification recorded',correct:'Correction requested',resubmit:'Corrections submitted for review',request:`${c.requestType} requested`,decide:`Request ${c.decision?.toLowerCase()}`,settings:'Reminder rules updated'};
  const details=type==='verify'?r.evidence:type==='correct'?{note:r.correction}:type==='decide'?{requestId:q.id,decision:q.status,note:q.decision}:type==='request'?{requestId:q.id,type:q.type,reason:q.reason}:type==='uploadDocument'?{documentId:document.id,kind:document.kind,name:document.name}:type==='settings'?settings:{status:r?.status};const event={recordId:r?.id||'workspace',institutionId:r?.institutionId||null,action:descriptions[type],actor:actor.role,actorUid:actor.uid,date:now,details};
  return {record:r,parent:type==='verify'?p:null,request:q,settings,event};
}
