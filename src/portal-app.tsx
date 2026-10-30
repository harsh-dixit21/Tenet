import {lazy,Suspense,useEffect,useState} from 'react';
import {AuthPage} from '@/components/ui/auth-page';
const App1=lazy(()=>import('@/components/ui/app-1'));
import {WorkspaceProvider} from '@/components/workspace/store';
export default function App(){const[route,setRoute]=useState(location.hash||'#auth');useEffect(()=>{const sync=()=>{setRoute(location.hash||'#auth');window.scrollTo(0,0)};window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync)},[]);return <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm" role="status">Opening Tenet…</div>}>{route==='#auth'||!route||route==='#'?<AuthPage/>:<WorkspaceProvider><App1/></WorkspaceProvider>}</Suspense>}
