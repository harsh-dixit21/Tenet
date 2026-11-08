import {useState,useEffect,useRef} from 'react';
import {readPlanner,emptyPlanner,type PlannerData} from '@/lib/review-planner';

function load(key:string) {try{return {data:readPlanner(localStorage.getItem(key)),error:'',blocked:false};}catch{return {data:emptyPlanner(),error:'Saved personal tasks could not be read. The existing browser data has been preserved.',blocked:true};}}
export function useReviewPlanner(key:string) {
  const [snapshot,setSnapshot]=useState(()=>load(key));
  const [notice,setNotice]=useState('');
  const [error,setError]=useState(snapshot.error);
  const ref=useRef(snapshot);ref.current=snapshot;
  function update(transform:(data:PlannerData)=>PlannerData,message:string) {
    if(ref.current.blocked){setError('Resolve unreadable planner storage before saving changes.');return false;}
    try {
      const current=readPlanner(localStorage.getItem(key));
      const next=readPlanner(JSON.stringify(transform(current)));
      localStorage.setItem(key,JSON.stringify(next));
      setSnapshot({data:next,error:'',blocked:false});setError('');setNotice(message);return true;
    }catch(error){setError(error instanceof Error&&error.name!=='QuotaExceededError'?error.message:'Browser storage is full. No personal task changes were saved.');return false;}
  }
  function reset(){try{localStorage.removeItem(key);setSnapshot({data:emptyPlanner(),error:'',blocked:false});setError('');setNotice('Unreadable personal planner data removed.');}catch{setError('Browser storage is unavailable.');}}
  // CROSS_TAB
  return {data:snapshot.data,blocked:snapshot.blocked,error,notice,notify:setNotice,update,reset};
}
