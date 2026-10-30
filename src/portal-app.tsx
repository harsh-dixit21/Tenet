import {lazy,Suspense,useEffect,useState} from 'react';
import {AuthPage} from '@/components/ui/auth-page';
const App1=lazy(()=>import('@/components/ui/app-1'));
const LegacyRecords=lazy(()=>import('@/components/legacy-records'));
export default function App(){const[route,setRoute]=useState(location.hash||'#auth');useEffect(()=>{const sync=()=>{setRoute(location.hash||'#auth');window.scrollTo(0,0)};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);return <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm" role="status">Opening Tenet…</div>}>{route==='#records'?<LegacyRecords/>:route==='#dashboard'?<App1/>:<AuthPage/>}</Suspense>}
