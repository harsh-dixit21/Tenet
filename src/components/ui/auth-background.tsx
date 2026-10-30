import {useEffect,useRef} from 'react';

// Sample the supplied two cubic curves once; project their points rather than
// promoting 72 animated SVG paths and their clipped parents into GPU layers.
const curves=[1,-1].flatMap(position=>Array.from({length:36},(_,i)=>{
  const x=380-i*5*position;
  const points:{x:number;y:number}[]=[];
  const cubic=(a:number,b:number,c:number,d:number,t:number)=>((1-t)**3)*a+3*((1-t)**2)*t*b+3*(1-t)*t*t*c+t**3*d;
  const add=(a:number[],b:number[],c:number[],d:number[])=>{for(let j=0;j<=40;j++){const t=j/40;points.push({x:cubic(a[0],b[0],c[0],d[0],t),y:cubic(a[1],b[1],c[1],d[1],t)})}};
  add([-x,-189-i*6],[-x,-189-i*6],[-312+i*5*position,216-i*6],[152-i*5*position,343-i*6]);
  add([152-i*5*position,343-i*6],[616-i*5*position,470-i*6],[684-i*5*position,875-i*6],[684-i*5*position,875-i*6]);
  return {points,width:.5+i*.03,alpha:Math.min(.1+i*.03,1),phase:i*.11+(position===1?0:Math.PI)};
}));

export function AuthBackground({active}:{active:boolean}){
  const canvasRef=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=canvasRef.current,ctx=canvas?.getContext('2d');if(!canvas||!ctx)return;
    let width=0,height=0,raf=0,last=0,clock=0,alive=true;
    const draw=(now:number)=>{
      raf=0;if(!alive||!active||document.hidden||!width||!height)return;
      if(now-last<1000/60){raf=requestAnimationFrame(draw);return}
      const dt=last?Math.min((now-last)/1000,.05):0;last=now;clock+=dt;
      const dpr=Math.min(devicePixelRatio||1,1.5);
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
      const scale=Math.min(width/696,height/316),left=(width-696*scale)/2,top=(height-316*scale)/2;
      const ry=Math.sin(clock*.2)*.14,rx=Math.cos(clock*.17)*.09;
      for(const curve of curves){
        ctx.beginPath();
        curve.points.forEach((p,j)=>{
          const x=p.x-348,y=p.y-158;
          const rotatedX=x*Math.cos(ry),z=-x*Math.sin(ry)+y*Math.sin(rx);
          const perspective=1200/(1200+z);
          const px=left+(348+rotatedX*perspective)*scale,py=top+(158+y*Math.cos(rx)*perspective)*scale;
          if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        });
        const cycle=.5-.5*Math.cos(clock*.22+curve.phase);
        ctx.strokeStyle=`rgba(255,255,255,${curve.alpha*(.3+.3*cycle)})`;
        ctx.lineWidth=curve.width*scale;
        ctx.setLineDash([(450+650*cycle)*scale,1100*scale]);
        ctx.lineDashOffset=-(clock*42+curve.phase*100)*scale;
        ctx.stroke();
      }
      raf=requestAnimationFrame(draw);
    };
    const wake=()=>{if(active&&!document.hidden&&width&&height&&!raf){last=0;raf=requestAnimationFrame(draw)}};
    const resize=()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));wake()};
    const observer=new ResizeObserver(resize);observer.observe(canvas);document.addEventListener('visibilitychange',wake);resize();
    return()=>{alive=false;cancelAnimationFrame(raf);observer.disconnect();document.removeEventListener('visibilitychange',wake)};
  },[active]);
  return <canvas ref={canvasRef} className="auth-background-canvas" aria-hidden="true"/>;
}
