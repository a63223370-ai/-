'use client';
import {useEffect,useId,useRef} from 'react';
import {MARK_BLUE,MARK_ORANGE,WORDMARK} from '@/lib/brand';

export function Mark({className='',mono=false}:{className?:string;mono?:boolean}){
 return <svg className={'brand-mark '+className} viewBox="0 0 240 140" fill="none" aria-hidden="true"><path d={MARK_BLUE} fill={mono?'currentColor':'#0755ff'} fillRule="evenodd"/><path d={MARK_ORANGE} fill={mono?'currentColor':'#ff965b'} fillRule="evenodd"/></svg>;
}
export function Wordmark(){return <svg className="brand-wordmark" viewBox="0 0 247 140" aria-hidden="true"><path d={WORDMARK} fill="currentColor" fillRule="evenodd"/></svg>;}

const width=1000;
type Curve=(x:number)=>number;
const base:Curve=x=>258-112*Math.sin((x-16)/width*Math.PI*2);
const lower:Curve=x=>base(x)+98;
const upper:Curve=x=>246-108*Math.sin((x+76)/width*Math.PI*2);
function path(curve:Curve,from=-70,to=1070){
 const slope=(x:number)=>(curve(x+.1)-curve(x-.1))/.2;
 let d=`M${from.toFixed(2)} ${curve(from).toFixed(2)}`;
 for(let x=from;x<to;x+=40){const next=Math.min(x+40,to),h=(next-x)/3;d+=`C${(x+h).toFixed(2)} ${(curve(x)+slope(x)*h).toFixed(2)} ${(next-h).toFixed(2)} ${(curve(next)-slope(next)*h).toFixed(2)} ${next.toFixed(2)} ${curve(next).toFixed(2)}`;}
 return d;
}
function restingPoint(curve:Curve,x:number,lift=66){const slope=(curve(x+.1)-curve(x-.1))/.2,n=Math.sqrt(1+slope*slope);return {x:x+slope*lift/n,y:curve(x)-lift/n};}

export function Ribbon({variant=0}:{variant?:number}){
 const dot=restingPoint(base,720);
 return <svg className="ribbon-art" viewBox="0 0 1000 560" fill="none" aria-hidden="true">
  <path d={path(upper)} stroke="#e6efff" strokeWidth="28"/>
  <path d={path(lower)} stroke="#dfebff" strokeWidth="32"/>
  {variant===2&&<path d={path(x=>392-79*Math.sin((x+160)/width*Math.PI*2))} stroke="#b8d3ff" strokeWidth="46"/>}
  <path d={path(base)} stroke="#0755ff" strokeWidth="82"/>
  <circle cx={dot.x} cy={dot.y} r="23" fill="#ff965b"/>
 </svg>;
}

type Motion={target:number;x:number;velocity:number;hover:number;hoverTarget:number;time:number;impact:number;impactX:number;visible:boolean;reduced:boolean;wake:()=>void};
export function LivingRibbon(){
 const id=useId().replace(/:/g,''),button=useRef<HTMLButtonElement>(null),main=useRef<SVGPathElement>(null),back=useRef<SVGPathElement>(null),echo=useRef<SVGPathElement>(null),trail=useRef<SVGPathElement>(null),dot=useRef<SVGGElement>(null),ripple=useRef<SVGCircleElement>(null);
 const motion=useRef<Motion>({target:720,x:720,velocity:0,hover:0,hoverTarget:0,time:0,impact:20,impactX:720,visible:true,reduced:false,wake:()=>{}});
 useEffect(()=>{
  const m=motion.current,reduce=matchMedia('(prefers-reduced-motion: reduce)');m.reduced=reduce.matches;
  let frame=0,last=0,disposed=false;
  const render=(dt:number)=>{
   m.time+=dt;m.impact+=dt;
   const decay=m.reduced?0:Math.exp(-m.impact*1.8),ambient=m.reduced?0:Math.sin(m.time*.55)*5;
   m.hover+=(m.hoverTarget-m.hover)*Math.min(1,dt*4);
   if(m.reduced){m.x=m.target;m.velocity=0;}else{
    const acceleration=(m.target-m.x)*34-m.velocity*10;
    m.velocity+=acceleration*dt;m.x+=m.velocity*dt;
   }
   const curve:Curve=x=>base(x)+(ambient+m.hover*8)*Math.sin(x/width*Math.PI)+decay*24*Math.sin((x-m.impactX)/150-m.impact*8)*Math.sin(x/width*Math.PI);
   main.current?.setAttribute('d',path(curve));
   back.current?.setAttribute('d',path(x=>upper(x)+ambient*.7+decay*9*Math.sin(x/160-m.impact*5)));
   echo.current?.setAttribute('d',path(x=>curve(x)+98+Math.sin(m.time*.4+x/300)*3));
   const p=restingPoint(curve,m.x),bounce=decay*Math.abs(Math.sin(m.impact*6))*23;
   dot.current?.setAttribute('transform',`translate(${p.x.toFixed(2)} ${(p.y-bounce).toFixed(2)})`);
   const travel=Math.min(1,Math.abs(m.velocity)/220);
   trail.current?.setAttribute('d',path(x=>curve(x)-67,m.x-90,m.x-28));
   trail.current?.setAttribute('opacity',(travel*.38).toFixed(3));
   const hit=restingPoint(curve,m.impactX);
   ripple.current?.setAttribute('cx',hit.x.toFixed(2));ripple.current?.setAttribute('cy',hit.y.toFixed(2));
   ripple.current?.setAttribute('r',(26+Math.min(m.impact,1.5)*48).toFixed(2));
   ripple.current?.setAttribute('opacity',m.reduced?'0':(Math.max(0,1-m.impact/1.25)*.38).toFixed(3));
  };
  const tick=(now:number)=>{frame=0;if(disposed||!m.visible||document.hidden)return;const dt=last?Math.min((now-last)/1000,.032):.016;last=now;render(dt);if(!m.reduced)frame=requestAnimationFrame(tick);};
  const wake=()=>{if(!frame&&!disposed&&m.visible&&!document.hidden){last=0;frame=requestAnimationFrame(tick);}};m.wake=wake;
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else wake();};
  const observer=new IntersectionObserver(([entry])=>{m.visible=entry.isIntersecting;if(m.visible)wake();else{cancelAnimationFrame(frame);frame=0;}},{rootMargin:'80px'});
  if(button.current)observer.observe(button.current);
  const preference=()=>{m.reduced=reduce.matches;wake();};reduce.addEventListener('change',preference);document.addEventListener('visibilitychange',visibility);wake();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();reduce.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);m.wake=()=>{};};
 },[]);
 const move=(clientX:number)=>{const bounds=button.current?.getBoundingClientRect();if(!bounds)return;motion.current.target=Math.max(85,Math.min(915,(clientX-bounds.left)/bounds.width*width));motion.current.wake();};
 const pulse=()=>{motion.current.impact=0;motion.current.impactX=motion.current.target;motion.current.wake();};
 const initial=restingPoint(base,720);
 return <div className="living-art">
  <button ref={button} className="art-touch" aria-label="点击波浪，让橙点沿曲线移动；也可使用左右方向键" onPointerMove={e=>{if(e.pointerType==='mouse'||e.buttons===1){move(e.clientX);motion.current.hoverTarget=(e.clientY-e.currentTarget.getBoundingClientRect().top)/e.currentTarget.clientHeight-.5;}}} onPointerLeave={()=>{motion.current.hoverTarget=0;}} onClick={e=>{if(e.detail===0)motion.current.target=motion.current.target>500?260:740;else move(e.clientX);pulse();}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();motion.current.target=Math.max(85,Math.min(915,motion.current.target+(e.key==='ArrowLeft'?-130:130)));pulse();}}}>
   <svg className="wave-scene" viewBox="0 0 1000 560" fill="none" aria-hidden="true">
    <defs><linearGradient id={'wave-'+id} x1="0" y1="80" x2="1000" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="#0755ff"/><stop offset=".55" stopColor="#0755ff"/><stop offset="1" stopColor="#2168ff"/></linearGradient></defs>
    <path ref={back} d={path(upper)} stroke="#e6efff" strokeWidth="28"/>
    <path ref={echo} d={path(lower)} stroke="#dfebff" strokeWidth="32"/>
    <path ref={main} d={path(base)} stroke={'url(#wave-'+id+')'} strokeWidth="82"/>
    <path ref={trail} stroke="#ff965b" strokeWidth="9" strokeLinecap="round" opacity="0"/>
    <circle ref={ripple} cx={initial.x} cy={initial.y} r="26" stroke="#ff965b" strokeWidth="2" opacity="0"/>
    <g ref={dot} transform={`translate(${initial.x} ${initial.y})`}><circle r="23" fill="#ff965b"/></g>
   </svg>
  </button>
  <div className="art-caption"><span>每一种可能，都有自己的路径。</span><span className="art-hint"><i/>轻触波浪</span></div>
 </div>;
}
