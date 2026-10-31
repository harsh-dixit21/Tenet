import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {onAuthStateChanged,type User} from 'firebase/auth';
import {auth,callBackend,firebaseConfigured,finishRedirect,firebaseLogout} from './client';
import type {Role} from '@/components/ui/app-1-utils/app-1-data';
import type {State} from '@/components/workspace/store';
export type Profile={uid:string;email:string;role:Role;active:boolean;institutionId:string|null;institutionName:string};
export type CloudWorkspace={profile:Profile;state:State};
type Session={user:User|null;profile:Profile|null;cloud:CloudWorkspace|null;demo:boolean;loading:boolean;error:string;setCloud:(c:CloudWorkspace)=>void;enterDemo:()=>void;logout:()=>Promise<void>;retry:()=>Promise<void>};
const Context=createContext<Session|null>(null);
export function SessionProvider({children}:{children:ReactNode}){const[user,setUser]=useState<User|null>(null),[cloud,setCloudRaw]=useState<CloudWorkspace|null>(null),[loading,setLoading]=useState(!!auth),[error,setError]=useState(''),[demo,setDemo]=useState(()=>sessionStorage.getItem('tenet-demo-mode')==='true');
async function load(){const uid=auth?.currentUser?.uid;if(!uid)return;setLoading(true);setError('');try{const result=await callBackend<CloudWorkspace>('bootstrap');if(auth?.currentUser?.uid===uid)setCloudRaw(result)}catch(e){setCloudRaw(null);setError(e instanceof Error?e.message:'Unable to load your account.')}finally{setLoading(false)}}
useEffect(()=>{if(!auth)return;let generation=0;finishRedirect().catch(e=>setError(e.message));const off=onAuthStateChanged(auth,async u=>{const ticket=++generation;setUser(u);setCloudRaw(null);setError('');if(!u){setLoading(false);return}setLoading(true);try{const result=await callBackend<CloudWorkspace>('bootstrap');if(ticket===generation){setCloudRaw(result);setDemo(false);sessionStorage.removeItem('tenet-demo-mode')}}catch(e){if(ticket===generation)setError(e instanceof Error?e.message:'Unable to load your account.')}finally{if(ticket===generation)setLoading(false)}});return()=>{generation++;off()}},[]);
function setCloud(c:CloudWorkspace){if(auth?.currentUser?.uid===c.profile.uid)setCloudRaw(c)}
function enterDemo(){if(user){setError('Sign out before switching to the sample workspace.');return}sessionStorage.setItem('tenet-demo-mode','true');setDemo(true)}
async function logout(){await firebaseLogout();sessionStorage.removeItem('tenet-demo-mode');sessionStorage.removeItem('tenet-demo-user');setDemo(false);setCloudRaw(null);location.hash='auth'}
return <Context.Provider value={{user,profile:cloud?.profile||null,cloud,demo,loading,error,setCloud,enterDemo,logout,retry:load}}>{children}</Context.Provider>}
export function useSession(){const s=useContext(Context);if(!s)throw new Error('Session provider required');return s}
export {firebaseConfigured};
