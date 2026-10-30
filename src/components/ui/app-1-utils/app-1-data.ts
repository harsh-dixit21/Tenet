import type {ChartConfig} from '../chart';
export type Role='Institution'|'Reviewer'|'Approver';
export type FdrRecord={id:string;institution:string;amount:number;bank:string;maturity:string;status:'Verified'|'Awaiting verification'|'Discrepancy'|'Release requested';documents:number;required:number};
export const records:FdrRecord[]=[
 {id:'FDR-2026-001',institution:'Northfield Institute of Technology',amount:1500000,bank:'Sample Bank A',maturity:'2026-11-12',status:'Verified',documents:5,required:5},
 {id:'FDR-2026-002',institution:'Westbridge College of Engineering',amount:1000000,bank:'Sample Bank B',maturity:'2026-12-04',status:'Awaiting verification',documents:3,required:5},
 {id:'FDR-2026-003',institution:'Riverview Polytechnic',amount:750000,bank:'Sample Bank A',maturity:'2026-11-05',status:'Discrepancy',documents:2,required:5},
 {id:'FDR-2026-004',institution:'Eastwood Institute of Management',amount:2000000,bank:'Sample Bank C',maturity:'2027-03-15',status:'Verified',documents:5,required:5},
 {id:'FDR-2026-005',institution:'Hillcrest Technical College',amount:1000000,bank:'Sample Bank B',maturity:'2026-10-20',status:'Release requested',documents:5,required:5},
];
export const referenceDate=Date.UTC(2026,9,30);
export const daysUntil=(date:string)=>Math.ceil((Date.parse(date)-referenceDate)/86400000);
export const money=(n:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export const formatDate=(date:string)=>new Date(date+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
export const app1User={name:'Reviewing official',initials:'RO',avatar:''};
export const app1Chart=[{week:'11 Sep',opened:4,completed:2},{week:'18 Sep',opened:7,completed:5},{week:'25 Sep',opened:5,completed:6},{week:'2 Oct',opened:9,completed:7},{week:'9 Oct',opened:6,completed:8},{week:'16 Oct',opened:11,completed:8},{week:'23 Oct',opened:8,completed:10},{week:'30 Oct',opened:10,completed:9}];
export const app1ChartConfig={opened:{label:'Submitted',color:'#8a8a8a'},completed:{label:'Reviewed',color:'#e3e3e3'}} satisfies ChartConfig;
export const app1Projects=records;
export const app1Activity=[
 {id:'a1',person:{name:'Hillcrest Technical College',initials:'HT'},action:'requested release of FDR-2026-005.',time:'21 Oct 2026',recordId:'FDR-2026-005'},
 {id:'a2',person:{name:'Reviewing official',initials:'RO'},action:'requested a maturity-date correction for Riverview.',time:'15 Oct 2026',recordId:'FDR-2026-003'},
 {id:'a3',person:{name:'Westbridge College',initials:'WC'},action:'submitted instrument details for scrutiny.',time:'24 Oct 2026',recordId:'FDR-2026-002'},
 {id:'a4',person:{name:'Reviewing official',initials:'RO'},action:'recorded sample verification for Northfield.',time:'20 Sep 2026',recordId:'FDR-2026-001'},
].sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));
export function readDemoUser():{email:string;role:Role}{try{const user=JSON.parse(sessionStorage.getItem('tenet-demo-user')||'null');if(user&&['Institution','Reviewer','Approver'].includes(user.role))return user}catch{}return {email:'',role:'Reviewer'}}
