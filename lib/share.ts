import { dimensions,names,Report,readingFor } from './engine';

function wrap(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,maxLines=6){let line='',lines=0;for(const char of text){if(ctx.measureText(line+char).width>width&&line){ctx.fillText(line,x,y+lines*lineHeight);lines++;line='';if(lines>=maxLines)return y+lines*lineHeight;}line+=char;}if(line){ctx.fillText(line,x,y+lines*lineHeight);lines++;}return y+lines*lineHeight;}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
export async function shareCard(report:Report):Promise<Blob>{
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1600;
  const c=canvas.getContext('2d')!;c.fillStyle='#f6f3ed';c.fillRect(0,0,1080,1600);
  c.fillStyle='#102f45';c.fillRect(0,0,1080,460);
  c.strokeStyle='#ffffff12';c.lineWidth=1;for(let r=90;r<=470;r+=75){c.beginPath();c.arc(1000,60,r,0,Math.PI*2);c.stroke();}
  c.fillStyle='#eeb492';c.font='20px Arial';c.fillText('POTENTIAL COORDINATES  /  个人探索报告',70,78);
  c.fillStyle='#ffffffb3';c.font='28px Microsoft YaHei, sans-serif';c.fillText(report.nickname+' 的潜能坐标',70,145);
  c.fillStyle='#fff';c.font='bold 70px Microsoft YaHei, sans-serif';c.fillText(report.name,65,245);
  c.fillStyle='#ffffffc0';c.font='28px Microsoft YaHei, sans-serif';
  const reading=readingFor(report);wrap(c,reading.summary,70,310,900,44,3);
  rounded(c,45,495,990,640,24,'#ffffff');c.fillStyle='#102f45';c.font='bold 30px Microsoft YaHei, sans-serif';c.fillText('我的十维图谱',80,555);
  c.fillStyle='#7c898d';c.font='20px Microsoft YaHei, sans-serif';c.fillText('本次自评 · 5—25分',760,553);
  const cx=540,cy=835,radius=190;
  for(let ring=1;ring<=5;ring++){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,x=cx+Math.cos(a)*radius*ring/5,y=cy+Math.sin(a)*radius*ring/5;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.closePath();c.strokeStyle='#dfe7e7';c.lineWidth=1.5;c.stroke();}
  dimensions.forEach((d,i)=>{const a=-Math.PI/2+i*Math.PI/5;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);c.strokeStyle='#e1e7e7';c.stroke();c.textAlign='center';c.font='23px Microsoft YaHei, sans-serif';c.fillStyle='#4b626b';const x=cx+Math.cos(a)*(radius+82),y=cy+Math.sin(a)*(radius+65);c.fillText(d.name,x,y);c.fillStyle='#16746f';c.font='bold 24px Arial';c.fillText(String(report.scores[d.id]),x,y+30);});
  c.beginPath();dimensions.forEach((d,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=radius*((report.scores[d.id]-5)/20),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;if(i)c.lineTo(x,y);else c.moveTo(x,y);});c.closePath();c.fillStyle='#16746f26';c.fill();c.strokeStyle='#16746f';c.lineWidth=4;c.stroke();
  c.textAlign='left';c.font='bold 27px Microsoft YaHei, sans-serif';c.fillStyle='#102f45';c.fillText(report.mode==='uniform'?'我的下一步：先尝试，再定义':'值得优先探索的三条线索',70,1200);
  if(report.mode!=='uniform')report.ranked.slice(0,3).forEach((d,i)=>{const x=60+i*325;rounded(c,x,1235,310,115,16,i===0?'#e9efeb':'#fff');c.fillStyle='#16746f';c.font='18px Arial';c.fillText('0'+(i+1),x+20,1267);c.fillStyle='#102f45';c.font='bold 28px Microsoft YaHei, sans-serif';c.fillText(names[d],x+20,1307);c.font='23px Arial';c.fillText(report.scores[d]+'/25',x+198,1307);});
  else{c.font='27px Microsoft YaHei, sans-serif';c.fillStyle='#40546a';wrap(c,'这次回答的方向尚未拉开，先完成两个感兴趣的小任务，为自己积累更具体的证据。',70,1250,930,44,3);}
  c.fillStyle='#687b80';c.font='22px Microsoft YaHei, sans-serif';wrap(c,report.mode==='regular'?'每个人都有不同的发挥方式。让真实尝试，成为下一步的坐标。':reading.summary,70,1410,930,33,2);
  c.strokeStyle='#d8dfda';c.beginPath();c.moveTo(70,1498);c.lineTo(1010,1498);c.stroke();c.font='18px Arial';c.fillStyle='#7c898d';c.fillText(report.id+'  ·  '+new Date(report.createdAt).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}),70,1536);
  c.font='16px Microsoft YaHei, sans-serif';c.fillText('兴趣与行为自评探索 · 非实际能力认证 · 潜能坐标',70,1570);
  return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片生成失败，请重试。')),'image/png'));
}
export async function reportImage(node:HTMLElement){
  await document.fonts.ready;
  const {toBlob}=await import('html-to-image');
  const details=Array.from(node.querySelectorAll('details'));const opened=details.map(d=>d.open);details.forEach(d=>d.open=true);
  try{const blob=await toBlob(node,{backgroundColor:'#f6f3ed',pixelRatio:node.scrollHeight>10000?1:1.5,cacheBust:false,
    filter:n=>!(n instanceof HTMLElement&&n.classList.contains('no-export'))});
  if(!blob)throw new Error('长图未能生成，可使用打印功能保存PDF。');return blob;
  }finally{details.forEach((d,i)=>d.open=opened[i]);}
}
