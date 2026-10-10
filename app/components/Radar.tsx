'use client';
import { useEffect,useRef,useState } from 'react';
import { dimensions, names, Scores } from '@/lib/engine';

export function Radar({scores,compact=false}:{scores:Scores;compact?:boolean}){
  const ref=useRef<HTMLDivElement>(null);const [ready,setReady]=useState(false);
  useEffect(()=>{let disposed=false;let instance:import('echarts').ECharts|undefined;let ro:ResizeObserver|undefined;
    import('echarts').then(echarts=>{if(disposed||!ref.current)return;
      instance=echarts.init(ref.current,undefined,{renderer:'canvas',devicePixelRatio:2});
      instance.setOption({animation:false,tooltip:{trigger:'item',formatter:()=>dimensions.map(d=>`${d.name}　${scores[d.id]}/25`).join('<br/>')},
        radar:{center:['50%','50%'],radius:compact?'62%':'61%',splitNumber:5,
          indicator:dimensions.map(d=>({name:d.name,max:25,min:5})),
          axisName:{color:'#40546a',fontSize:compact?9:10,lineHeight:18,fontFamily:'Microsoft YaHei, sans-serif'},
          splitArea:{areaStyle:{color:['#fff','#f6f8f8']}},splitLine:{lineStyle:{color:'#dce5e8'}},axisLine:{lineStyle:{color:'#e0e7e9'}}},
        series:[{type:'radar',symbol:'circle',symbolSize:5,lineStyle:{width:2.5,color:'#0755ff'},itemStyle:{color:'#0755ff',borderColor:'#fff',borderWidth:1.5},areaStyle:{color:'rgba(7,85,255,.13)'},data:[{name:'本次自评图谱',value:dimensions.map(d=>scores[d.id])}]}]});
      setReady(true);ro=new ResizeObserver(()=>instance?.resize());ro.observe(ref.current);
    }).catch(()=>setReady(false));
    return()=>{disposed=true;ro?.disconnect();instance?.dispose();};
  },[scores,compact]);
  const points=dimensions.map((d,i)=>{const angle=(i/10)*Math.PI*2-Math.PI/2;const r=((scores[d.id]-5)/20)*130;return `${180+Math.cos(angle)*r},${180+Math.sin(angle)*r}`;}).join(' ');
  return <div className={'radar-wrap'+(compact?' compact':'')} role="img" aria-label={'本次自评雷达图：'+dimensions.map(d=>`${names[d.id]}${scores[d.id]}分`).join('，')}>
    {!ready&&<svg className="radar-fallback" viewBox="0 0 360 360" aria-hidden="true">{[30,55,80,105,130].map(r=><circle key={r} cx="180" cy="180" r={r} fill="none" stroke="#e0e7e9"/>)}<polygon points={points} fill="#0755ff25" stroke="#0755ff" strokeWidth="2"/></svg>}
    <div ref={ref} className="radar-chart"/>
  </div>;
}
