import {commandFingerprint,canonicalBase64} from './protocol.js';
import {generateAlerts} from './alerts.js';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {defineString} from 'firebase-functions/params';
import {randomUUID,createHash} from 'node:crypto';
import {DomainError,applyCommand,canRead,text,uniqueKey} from './domain.js';
initializeApp();const db=getFirestore();
const initialAdmin=defineString('INITIAL_ADMIN_EMAIL',{default:'harshd21507@gmail.com'});
const options={region:'asia-south1',maxInstances:10,timeoutSeconds:60,enforceAppCheck:process.env.FUNCTIONS_EMULATOR!=='true'&&process.env.TENET_ENFORCE_APP_CHECK!=='false'};
function callable(fn){return onCall(options,async req=>{try{if(!req.auth||req.auth.token.firebase?.sign_in_provider!=='google.com'||req.auth.token.email_verified!==true)throw new HttpsError('unauthenticated','Sign in with a verified Google account.');return await fn(req)}catch(e){if(e instanceof HttpsError)throw e;if(e instanceof DomainError)throw new HttpsError(e.code,e.message);console.error('Tenet operation failed',{name:e?.name,code:e?.code});throw new HttpsError('internal','The operation could not be completed. Please retry.')}})}
const id=(value,label='ID')=>{if(typeof value!=='string'||!/^[A-Za-z0-9_-]{1,120}$/.test(value))throw new HttpsError('invalid-argument',`Invalid ${label}.`);return value};
async function profile(uid){const p=(await db.doc(`users/${uid}`).get()).data();if(!p?.active)throw new HttpsError('permission-denied','Account access is disabled or not provisioned.');return {...p,uid}}
async function bounded(query){const result=await query.limit(501).get();if(result.size>500)throw new HttpsError('resource-exhausted','This workspace exceeds the current 500-item view limit. Contact your administrator to archive/export older cases.');return result.docs.map(d=>d.data())}
async function snapshot(actor){
 const scope=(name)=>actor.role==='Institution'?db.collection(name).where('institutionId','==',actor.institutionId||'__unassigned__'):db.collection(name);
 const [records,requests,events,settings,read]=await Promise.all([bounded(scope('instruments')),bounded(scope('requests')),scope('audit').orderBy('date','desc').limit(200).get().then(s=>s.docs.map(d=>d.data())),db.doc('system/settings').get(),db.doc(`alertReads/${actor.uid}`).get()]);
 return {version:1,records,requests,events:events.sort((a,b)=>b.date.localeCompare(a.date)),settings:settings.data()||{reminderDays:30,escalationDays:7},readAlerts:read.data()?.ids||[],serverAlerts:generateAlerts(records,settings.data()||{reminderDays:30,escalationDays:7})};
}
export const bootstrap=callable(async req=>{
 const uid=req.auth.uid,ref=db.doc(`users/${uid}`),lock=db.doc('system/adminBootstrap');
 await db.runTransaction(async tx=>{const [user,bootstrap]=await Promise.all([tx.get(ref),tx.get(lock)]);if(user.exists)return;const admin=!bootstrap.exists&&req.auth.token.email?.toLowerCase()===initialAdmin.value().toLowerCase();tx.create(ref,{uid,email:req.auth.token.email,role:admin?'Admin':'Institution',active:true,institutionId:null,institutionName:'',createdAt:new Date().toISOString()});if(admin)tx.create(lock,{uid,createdAt:new Date().toISOString()})});
 const p=await profile(uid);return {profile:p,state:await snapshot(p)};
});
export const getWorkspace=callable(async req=>{const p=await profile(req.auth.uid);return {profile:p,state:await snapshot(p)}});
export const registerInstitution=callable(async req=>{
 const name=text(req.data?.name,'Institution name',120),uid=req.auth.uid;await db.runTransaction(async tx=>{const ref=db.doc(`users/${uid}`),p=(await tx.get(ref)).data();if(!p?.active||p.role!=='Institution'||p.institutionId)throw new HttpsError('permission-denied','Institution enrollment is not available.');tx.create(db.doc(`institutions/${uid}`),{id:uid,name,createdBy:uid,createdAt:new Date().toISOString()});tx.update(ref,{institutionId:uid,institutionName:name})});const p=await profile(uid);return {profile:p,state:await snapshot(p)};
});
function fileData(payload){
 const name=text(payload?.name,'File name',160),kind=text(payload?.kind,'Document category',40);if(!['Instrument copy','Bank letter','Declaration','Approval letter','Other'].includes(kind))throw new HttpsError('invalid-argument','Invalid document category.');
 if(/[\\/\u202a-\u202e\u2066-\u2069]/u.test(name))throw new HttpsError('invalid-argument','File name contains unsupported path or direction characters.');
 const match=typeof payload.data==='string'&&/^data:(application\/pdf|image\/png|image\/jpeg|text\/plain);base64,([A-Za-z0-9+/=]+)$/.exec(payload.data);if(!match||match[2].length>1400000)throw new HttpsError('invalid-argument','Choose a PDF, PNG, JPEG or text file up to 1 MB.');
 const bytes=canonicalBase64(match[2]),mime=match[1];const extensions={'application/pdf':/\.pdf$/i,'image/png':/\.png$/i,'image/jpeg':/\.jpe?g$/i,'text/plain':/\.txt$/i};if(!extensions[mime].test(name))throw new HttpsError('invalid-argument','File extension must match the document type.');if(!bytes.length||bytes.length>1024*1024)throw new HttpsError('invalid-argument','The file must be between 1 byte and 1 MB.');
 const valid=mime==='application/pdf'?bytes.subarray(0,5).toString()==='%PDF-':mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:!bytes.includes(0);
 if(!valid)throw new HttpsError('invalid-argument','The file content does not match its declared type.');return {name,kind,bytes,mime};
}
export const executeCommand=callable(async req=>{
 const c=req.data?.command;if(!c||typeof c!=='object')throw new HttpsError('invalid-argument','Workflow command is required.');const commandId=id(req.data.commandId,'command ID'),uid=req.auth.uid,fingerprint=commandFingerprint(c);
 const recordId=c.type==='saveInstrument'?id(c.id):c.type==='settings'?null:id(c.recordId);if(c.type==='request')id(c.requestId);if(c.type==='decide')id(c.requestId);
 const actor=await profile(uid);let uploaded;
 if(c.type==='uploadDocument'){
   const file=fileData(c.document);const r=(await db.doc(`instruments/${recordId}`).get()).data();canRead(actor,r);if(actor.role!=='Institution'||!['Draft','Awaiting verification','Discrepancy'].includes(r.status))throw new HttpsError('permission-denied','Document upload is not permitted.');
   const documentId=randomUUID(),path=`instruments/${recordId}/${documentId}`;await getStorage().bucket().file(path).save(file.bytes,{resumable:false,metadata:{contentType:file.mime,metadata:{sha256:createHash('sha256').update(file.bytes).digest('hex')}}});uploaded={id:documentId,path,name:file.name,kind:file.kind,size:file.bytes.length,mime:file.mime,data:''};
 }
 try{
 await db.runTransaction(async tx=>{
   const receipt=db.doc(`users/${uid}/commands/${commandId}`);const [receiptSnap,userSnap]=await Promise.all([tx.get(receipt),tx.get(db.doc(`users/${uid}`))]);if(receiptSnap.exists){if(receiptSnap.data().type!==c.type||receiptSnap.data().recordId!==recordId||receiptSnap.data().fingerprint&&receiptSnap.data().fingerprint!==fingerprint)throw new HttpsError('already-exists','This command ID was used for another action.');return;}
   const user={...userSnap.data(),uid};const recordRef=recordId?db.doc(`instruments/${recordId}`):null,record=recordRef?(await tx.get(recordRef)).data():null;
   const parentId=record?.parent||c.parent,parentRef=parentId?db.doc(`instruments/${id(parentId)}`):null,parent=parentRef?(await tx.get(parentRef)).data():null;
   const requestRef=c.type==='request'||c.type==='decide'?db.doc(`requests/${c.requestId}`):null,request=requestRef?(await tx.get(requestRef)).data():null;if(c.type==='request'&&request)throw new HttpsError('already-exists','Request ID already exists.');
   const successorId=c.type==='saveInstrument'?parentId:recordId,successorRef=successorId?db.doc(`successors/${successorId}`):null,successor=successorRef?(await tx.get(successorRef)).data():null;
   let uniqueRef,oldUniqueRef;
   if(c.type==='saveInstrument'){
     const key=uniqueKey(text(c.fields?.bank,'Bank',100),text(c.fields?.number,'Instrument number',60));uniqueRef=db.doc(`instrumentKeys/${key}`);const existing=(await tx.get(uniqueRef)).data();if(existing&&existing.recordId!==recordId)throw new HttpsError('already-exists','This bank and instrument number already exist.');
     if(record){const old=uniqueKey(record.bank,record.number);if(old!==key)oldUniqueRef=db.doc(`instrumentKeys/${old}`);}
   }
   const outcome=applyCommand({actor:user,command:c,record,parent,request,document:uploaded,successorExists:!!successor&&successor.recordId!==recordId});
   if(outcome.record)tx.set(recordRef,outcome.record);
   if(outcome.parent)tx.set(parentRef,outcome.parent);
   if(outcome.request)tx.set(requestRef,outcome.request);
   if(outcome.settings)tx.set(db.doc('system/settings'),outcome.settings);
   if(uniqueRef){tx.set(uniqueRef,{recordId});if(oldUniqueRef)tx.delete(oldUniqueRef);if(parentId)tx.set(successorRef,{recordId});}
   const auditId=randomUUID();tx.create(db.doc(`audit/${auditId}`),{...outcome.event,id:auditId});if(outcome.parent){const parentAudit=randomUUID();tx.create(db.doc(`audit/${parentAudit}`),{...outcome.event,id:parentAudit,recordId:outcome.parent.id,action:`${outcome.parent.status} by ${recordId}`})}
   tx.create(receipt,{type:c.type,recordId,fingerprint,createdAt:new Date().toISOString()});
 });
 }catch(e){if(uploaded)await getStorage().bucket().file(uploaded.path).delete().catch(()=>{});throw e}
 // If a duplicate command uploaded another blob, remove that unattached copy.
 if(uploaded){const stored=(await db.doc(`instruments/${recordId}`).get()).data();if(!stored.docs.some(d=>d.id===uploaded.id))await getStorage().bucket().file(uploaded.path).delete().catch(()=>{})}
 const p=await profile(uid);return {profile:p,state:await snapshot(p)};
});
export const downloadDocument=callable(async req=>{const p=await profile(req.auth.uid),r=(await db.doc(`instruments/${id(req.data?.recordId)}`).get()).data();canRead(p,r);const doc=r.docs.find(d=>d.id===id(req.data?.documentId));if(!doc)throw new HttpsError('not-found','Document not found.');const [buffer]=await getStorage().bucket().file(doc.path).download();return {name:doc.name,data:`data:${doc.mime};base64,${buffer.toString('base64')}`}});
export const markAlertsRead=callable(async req=>{await profile(req.auth.uid);const ids=req.data?.ids;if(!Array.isArray(ids)||ids.length>2000||ids.some(id=>typeof id!=='string'||id.length>2000))throw new HttpsError('invalid-argument','Invalid alert IDs.');await db.doc(`alertReads/${req.auth.uid}`).set({ids:[...new Set(ids)]});const p=await profile(req.auth.uid);return {profile:p,state:await snapshot(p)}});
export const listUsers=callable(async req=>{if((await profile(req.auth.uid)).role!=='Admin')throw new HttpsError('permission-denied','Administrator access required.');return bounded(db.collection('users'))});
export const assignUser=callable(async req=>{
 const uid=req.auth.uid,target=id(req.data?.uid,'user ID'),role=req.data?.role;if(target===uid||!['Institution','Reviewer','Approver','Admin'].includes(role)||typeof req.data.active!=='boolean')throw new HttpsError('invalid-argument','Select another user, a valid role and active state.');
 await db.runTransaction(async tx=>{const [admin,user]=await Promise.all([tx.get(db.doc(`users/${uid}`)),tx.get(db.doc(`users/${target}`))]);if(!admin.data()?.active||admin.data()?.role!=='Admin')throw new HttpsError('permission-denied','Administrator access required.');if(!user.exists)throw new HttpsError('not-found','User must sign in once before assignment.');
 const institutionId=role==='Institution'?id(req.data.institutionId,'institution ID'):null;const institution=institutionId?(await tx.get(db.doc(`institutions/${institutionId}`))).data():null;if(institutionId&&!institution)throw new HttpsError('not-found','Institution not found.');tx.update(user.ref,{role,active:req.data.active,institutionId,institutionName:institution?.name||''});const auditId=randomUUID();tx.create(db.doc(`audit/${auditId}`),{id:auditId,recordId:'workspace',institutionId:null,actor:'Admin',actorUid:uid,date:new Date().toISOString(),action:`Account access updated for ${target}: ${role}, active=${req.data.active}`})});return {ok:true};
});
