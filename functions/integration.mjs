// Run only under: firebase emulators:exec --project demo-tenet --only auth,firestore,storage,functions "node functions/integration.mjs"
import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const project='demo-tenet',base=`http://127.0.0.1:5001/${project}/asia-south1`;
const results=[];const check=(value,label)=>{assert.ok(value,label);results.push(label);console.log('PASS',label)};
async function login(email){const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');const jwt=`${encode({alg:'none',typ:'JWT'})}.${encode({iss:'https://accounts.google.com',aud:project,sub:email.replace(/[^a-z0-9]/g,''),email,email_verified:true,name:email})}.`;const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=fake-api-key',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postBody:`id_token=${encodeURIComponent(jwt)}&providerId=google.com`,requestUri:'http://localhost',returnSecureToken:true})});const result=await response.json();assert.ok(result.idToken,JSON.stringify(result));return {token:result.idToken,uid:result.localId}}
async function call(user,name,data={}){const response=await fetch(`${base}/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(user?{Authorization:`Bearer ${user.token}`}:{})},body:JSON.stringify({data})});const result=await response.json();if(result.error){const e=new Error(result.error.message);e.code=result.error.status;throw e}return result.result}
const deny=async(fn,label)=>{await assert.rejects(fn);check(true,label)};
const command=(u,c,commandId=randomUUID())=>call(u,'executeCommand',{command:c,commandId});
try{
 await deny(()=>call(null,'getWorkspace'),'Anonymous workspace access denied');
 const admin=await login('harshd21507@gmail.com');check((await call(admin,'bootstrap')).profile.role==='Admin','Initial administrator bootstrapped from verified Google identity');
 const institution=await login('institution@example.edu'),foreign=await login('foreign@example.edu'),reviewer=await login('reviewer@example.edu'),approver=await login('approver@example.edu');
 for(const user of [institution,foreign,reviewer,approver])await call(user,'bootstrap');
 await call(institution,'registerInstitution',{name:'Integration College A'});await call(foreign,'registerInstitution',{name:'Integration College B'});
 for(const [user,role] of [[reviewer,'Reviewer'],[approver,'Approver']])await call(admin,'assignUser',{uid:user.uid,role,active:true});
 await deny(()=>call(institution,'assignUser',{uid:institution.uid,role:'Admin',active:true}),'Client cannot grant its own privileges');
 const today=new Date().toISOString().slice(0,10);const fields={institution:'Forged value',bank:'Integration Bank',branch:'Central',number:'TEST-1',amount:100000.25,issued:'2020-01-01',maturity:today};
 const create=id=>({type:'saveInstrument',id,fields,status:'Awaiting verification'});
 const race=await Promise.allSettled([command(institution,create('FDR-TEST-1')),command(institution,create('FDR-TEST-2'))]);check(race.filter(r=>r.status==='fulfilled').length===1,'Concurrent duplicate submissions allow exactly one record');
 let state=(await call(institution,'getWorkspace')).state;const record=state.records[0];check(record.institution==='Integration College A','Institution identity is server-owned');
 check((await call(foreign,'getWorkspace')).state.records.length===0,'Institution workspace is isolated');
 await deny(()=>call(foreign,'downloadDocument',{recordId:record.id,documentId:'missing'}),'Cross-institution document access denied');
 const evidence={source:'Authorized test source',reference:'TEST-REF',date:today,note:'Evidence confirmed'};
 await deny(()=>command(institution,{type:'verify',recordId:record.id,evidence}),'Institution cannot verify through forged command');
 await deny(()=>command(reviewer,{type:'verify',recordId:record.id,evidence}),'Incomplete documents block verification');
 for(const kind of ['Instrument copy','Bank letter','Declaration'])await command(institution,{type:'uploadDocument',recordId:record.id,document:{name:'evidence.txt',kind,data:'data:text/plain;base64,'+Buffer.from('Private evidence for emulator QA.').toString('base64')}});
 state=(await call(institution,'getWorkspace')).state;check(state.records[0].docs.length===3,'Private documents stored and version metadata committed');
 const file=await call(institution,'downloadDocument',{recordId:record.id,documentId:state.records[0].docs[0].id});check(file.data.includes('base64,'),'Authenticated document download succeeds');
 await command(reviewer,{type:'correct',recordId:record.id,note:'Check branch details'});await command(institution,{type:'resubmit',recordId:record.id});
 const verified=await command(reviewer,{type:'verify',recordId:record.id,evidence});check(verified.state.records[0].status==='Verified','Correction, resubmission and verification complete');
 await deny(()=>command(institution,{type:'uploadDocument',recordId:record.id,document:{name:'locked.txt',kind:'Other',data:'data:text/plain;base64,aGVsbG8='}}),'Verified instrument documents cannot be changed');
 const request={type:'request',recordId:record.id,requestId:'REQ-TEST-1',requestType:'Release',reason:'Matured instrument release'};const receipt=randomUUID();await command(institution,request,receipt);await command(institution,request,receipt);check((await call(approver,'getWorkspace')).state.requests.length===1,'Retrying command ID does not duplicate requests');
 await deny(()=>command(reviewer,{type:'decide',recordId:record.id,requestId:'REQ-TEST-1',decision:'Approved',note:'Forged',eligibilityConfirmed:true}),'Reviewer cannot approve its own review');
 const decisions=await Promise.allSettled([command(approver,{type:'decide',recordId:record.id,requestId:'REQ-TEST-1',decision:'Approved',note:'Eligibility checked',eligibilityConfirmed:true}),command(approver,{type:'decide',recordId:record.id,requestId:'REQ-TEST-1',decision:'Rejected',note:'Competing decision'})]);check(decisions.filter(r=>r.status==='fulfilled').length===1,'Concurrent request decisions commit only once');
 const final=(await call(approver,'getWorkspace')).state;check(final.events.some(e=>e.actorUid===approver.uid),'Audit events capture trusted actor UID');
 await call(admin,'assignUser',{uid:institution.uid,role:'Institution',institutionId:institution.uid,active:false});await deny(()=>call(institution,'getWorkspace'),'Disabled account cannot read workspace');
 const direct=await fetch(`http://127.0.0.1:8080/v1/projects/${project}/databases/(default)/documents/instruments/${record.id}`,{headers:{Authorization:`Bearer ${approver.token}`}});check(direct.status===403,'Firestore rules reject direct client reads');
 console.log(JSON.stringify({passed:results.length,checks:results}));
}catch(e){console.error(e);process.exitCode=1}
