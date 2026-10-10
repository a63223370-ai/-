'use client';
import {useRef,useState,useEffect} from 'react';
import {Report,dimensions,names,library,readingFor,band,dimIcons,evidenceFor,planFor} from '@/lib/engine';
import {shareCard,reportImage} from '@/lib/share';
import {Icon,Brand} from './Icons';
import {Radar} from './Radar';

export function ReportView({report,sample=false,onExit}:{report:Report;sample?:boolean;onExit:()=>void}){
  const [careerIndex,setCareerIndex]=useState(0),[exporting,setExporting]=useState(''),[image,setImage]=useState<{url:string;blob:Blob;kind:string}|null>(null),[notice,setNotice]=useState('');
  const reportRef=useRef<HTMLDivElement>(null);const reading=readingFor(report),top=report.ranked.slice(0,3),career=report.careers[careerIndex],plan=planFor(report,career);
  const visible=report.mode!=='uniform';const sorted=report.ranked.map(id=>dimensions.find(d=>d.id===id)!);
  useEffect(()=>()=>{if(image)URL.revokeObjectURL(image.url);},[image]);
  const generate=async(kind:string)=>{if(exporting)return;setExporting(kind);setNotice('');try{const blob=kind==='card'?await shareCard(report):await reportImage(reportRef.current!);setImage({blob,url:URL.createObjectURL(blob),kind});}catch(e){setNotice(e instanceof Error?e.message:'生成失败，请重试。');}finally{setExporting('');}};
  const download=()=>{if(!image)return;const a=document.createElement('a');a.href=image.url;a.download=`潜能坐标-${report.name}-${image.kind==='card'?'分享卡':'完整报告'}.png`;a.click();};
  const nativeShare=async()=>{if(!image)return;const f=new File([image.blob],'潜能坐标.png',{type:'image/png'});try{if(navigator.canShare?.({files:[f]}))await navigator.share({files:[f],title:'我的潜能坐标'});else download();}catch(e){if((e as Error).name!=='AbortError')setNotice('当前浏览器未能唤起分享，请下载或长按保存。');}};
  return <>
    <header className="site-header report-header no-export"><Brand/><button className="text-button" onClick={onExit}><Icon name="ArrowLeft" size={16}/>返回首页</button></header>
    {sample&&<div className="sample-strip no-export"><Icon name="CircleHelp" size={16}/>这是示例报告，使用模拟答案展示。你的专属报告将根据自己的回答生成。</div>}
    <nav className="report-nav no-export"><a href="#map">十维图谱</a><a href="#strengths">优势解读</a><a href="#careers">职业探索</a><a href="#plan">7天计划</a><button onClick={()=>generate('card')}><Icon name="Share2" size={15}/>分享报告</button></nav>
    <div ref={reportRef} className="report-content">
      <section className="report-cover">
        <div className="cover-grid"/>
        <div className="report-cover-inner">
          <div className="eyebrow light">YOUR POTENTIAL, IN PERSPECTIVE <span>探索报告 / V3.0</span></div>
          <p className="cover-greeting">{report.nickname}，这是属于你的探索坐标。</p>
          <h1>{report.name}<span className="coral-dot"/></h1>
          <div className="cover-dims">{visible?top.map(id=><span key={id}><Icon name={dimIcons[id]} size={17}/>{names[id]}</span>):<span><Icon name="Compass" size={17}/>先体验，再给自己一个答案</span>}</div>
          <p className="cover-summary">{reading.summary}</p>
          <div className="cover-meta"><span>报告编号 {report.id}</span><span>{new Date(report.createdAt).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'})}</span><span>50个场景 · 10个维度</span></div>
        </div>
      </section>
      <main className="report-main">
        {(reading.uncertain||reading.tied||report.mode!=='regular')&&<div className="report-note"><Icon name="Compass"/><div>{reading.uncertain&&<p>{library.special_modes.uncertain_note}</p>}{reading.tied&&visible&&<p>{library.special_modes.tie_note}</p>}{report.mode==='low'&&<p>以下内容作为可尝试的方向阅读，从30—60分钟的小任务开始即可。</p>}{report.mode==='balanced'&&<p>各项回答比较接近，组合只是一条阅读路径，无需强分主次。</p>}</div></div>}
        <section id="map" className="report-section">
          <SectionTitle no="01" title="你的十维图谱" text="看见分布，找到值得优先探索的线索。"/>
          <div className="map-grid">
            <div className="paper radar-paper"><div className="card-kicker"><span>倾向分布</span><small>原始分 / 25</small></div><Radar scores={report.scores}/><p className="chart-caption"><span className="legend-dot"/>本次回答 · 每维5题 · 最低5分</p></div>
            <div className="paper ranking-paper"><div className="card-kicker"><span>维度排序</span><small>同分不区分高低</small></div>{sorted.map(d=><div className="rank-row" key={d.id}><span className="rank-icon"><Icon name={dimIcons[d.id]} size={17}/></span><div className="rank-label"><strong>{d.name}</strong><div className="mini-track"><i style={{width:`${report.scores[d.id]/25*100}%`}}/></div></div><div className="rank-value"><b>{report.scores[d.id]}</b><small>{band(report.scores[d.id])}</small></div></div>)}</div>
          </div><p className="fine-print">图形展示本次自评的分布；分数与阅读分段不代表人群排名、行业水平或职业成功率。</p>
        </section>
        {visible&&<section className="report-section">
          <SectionTitle no="02" title="你的组合，怎样一起发挥" text={reading.pair.reading_headline}/>
          <div className="combination-paper paper"><div className="combo-diagram">{top.map((id,i)=><div className="combo-node" key={id}><span>{i===2?'补充视角':'核心线索 '+(i+1)}</span><Icon name={dimIcons[id]} size={26}/><strong>{names[id]}</strong></div>)}</div><div className="combo-reading"><p className="large-reading">{reading.pair.interaction_mechanism}</p><div className="reading-split"><div><h4><Icon name="ScanLine" size={17}/>在这样的场景里</h4><p>{reading.pair.recognition_scene}</p><small>场景用于举例，请对照自己的经历。</small></div><div><h4><Icon name="ArrowUpRight" size={17}/>从这里开始</h4><p>{reading.order.explanation}</p></div></div><div className="third-reading"><Icon name={dimIcons[top[2]]}/><p>{reading.third}</p></div><div className="friction-inline"><strong>留意这个卡点</strong><p>{reading.pair.pair_specific_friction}</p></div></div></div>
        </section>}
        {visible&&<section id="strengths" className="report-section">
          <SectionTitle no="03" title="把优势线索看得更具体" text="不是一句标签，而是可以回想、可以尝试的细节。"/>
          <div className="strength-list">{top.map((id,i)=>{const d=dimensions.find(d=>d.id===id)!,evidence=evidenceFor(report,id);return <article className="paper strength-paper" key={id}><div className="strength-heading"><span className="big-icon"><Icon name={dimIcons[id]} size={28}/></span><div><small>探索线索 0{i+1}</small><h3>{d.name}</h3></div><div className="strength-score">{report.scores[id]}<small>/ 25</small></div></div><p className="strength-anchor">{d.anchor}</p><p className="body-copy">{d.analysis}</p><div className="strength-columns"><div><h4 className="green-label">值得验证的优势</h4>{d.strengths.map(t=><p className="check-line" key={t}><Icon name="Check" size={16}/>{t}</p>)}</div><div><h4 className="coral-label">可能卡住的地方</h4>{d.frictions.map(t=><p className="dot-line" key={t}><span/> {t}</p>)}</div></div><details className="strength-details"><summary>查看回答依据与更多细节<Icon name="ChevronDown" size={17}/></summary><div className="evidence-block"><h4>你比较认同的具体反应</h4>{evidence.length?evidence.map(q=><p key={q.id}><b>{q.facet}</b>{q.text}<span>{report.answers[q.id]} / 5</span></p>):<p>这一维尚没有4—5分的题目，先把它作为待探索线索，不急着给自己定型。</p>}<h4>可以对照自己的经历</h4>{d.experiences.map(t=><p key={t}>{t}</p>)}<h4>可能表现出的特征</h4>{d.traits.map(t=><p key={t}>{t}</p>)}<p className="boundary-note">{d.measurement_boundary.definition} {d.measurement_boundary.distinction}</p></div></details><div className="action-note"><Icon name="Target" size={19}/><p><strong>一个小行动</strong>{d.action}</p></div></article>;})}</div>
        </section>}
        <section id="careers" className="report-section">
          <SectionTitle no="04" title="把线索，带进真实工作" text="从80个方向中选出6个入口。先试一小步，再决定投入哪里。"/>
          <div className="career-grid">{report.careers.map((c,i)=><article key={c.id} className={'paper career-card'+(careerIndex===i?' selected':'')}><div className="career-card-top"><span>0{i+1} / {c.group}</span><Icon name="ArrowUpRight" size={19}/></div><small className="career-family">{c.family}</small><h3>{c.title}</h3><div className="career-chips">{Object.entries(c.weights).sort(([,a],[,b])=>Number(b)-Number(a)).slice(0,2).map(([k])=><span key={k}><Icon name={dimIcons[k]} size={12}/>{names[k]} {report.scores[k]}</span>)}</div><p className="career-fit">{c.fit}</p><dl><dt>需要核实</dt><dd>{c.risk}</dd><dt>第一步</dt><dd>{c.first_step}</dd></dl>{c.relaxed&&<p className="fine-print">相关线索集中，保留了同族群的任务。</p>}{c.distant&&<p className="fine-print">较远的补充入口，优先级低于前面的方向。</p>}<button className="career-plan-button no-export" onClick={()=>{setCareerIndex(i);document.getElementById('plan')?.scrollIntoView({behavior:'smooth',block:'start'});}}>查看这个方向的7天计划<Icon name="ArrowRight" size={16}/></button></article>)}</div>
        </section>
        <section id="plan" className="report-section">
          <SectionTitle no="05" title="给下一步，七天时间" text="不必七天确定一生，只需要比现在多一点真实了解。"/>
          <div className="paper plan-paper"><div className="plan-heading"><div><span className="card-eyebrow">YOUR NEXT SMALL EXPERIMENT</span><h3>{career.title}</h3></div><select className="no-export" aria-label="选择职业验证计划" value={careerIndex} onChange={e=>setCareerIndex(Number(e.target.value))}>{report.careers.map((c,i)=><option value={i} key={c.id}>{c.title}</option>)}</select></div><p className="plan-bridge">{plan.bridge}</p>{report.mode==='low'&&<p className="fine-print">从30—60分钟的子任务开始，不以完成速度评价自己。</p>}<div className="timeline">{(['day1','day2_4','day5_7'] as const).map((key,i)=>{const step=plan[key];return <div className="timeline-step" key={key}><div className="timeline-marker"><span>0{i+1}</span></div><div className="timeline-body"><small>{['DAY 1','DAY 2—4','DAY 5—7'][i]}</small><h4>{step.title}</h4><ul>{step.actions.map(t=><li key={t}>{t}</li>)}</ul><p className="deliverable"><Icon name="CheckCheck" size={16}/><span>留下的成果：{step.deliverable}</span></p></div></div>;})}</div><p className="plan-completion">{plan.completion_note}</p></div>
        </section>
        <section className="report-outro"><CompassArt/><p className="card-eyebrow">YOUR STORY IS STILL UNFOLDING</p><h2>你不是一个固定的答案。</h2><p>这份报告是一张起点地图。<br/>真正的方向，藏在接下来愿意尝试的事情里。</p><div className="export-actions no-export"><button className="primary" disabled={!!exporting} onClick={()=>generate('card')}><Icon name={exporting==='card'?'LoaderCircle':'Share2'} className={exporting==='card'?'spin':''}/>{exporting==='card'?'正在生成':'生成分享卡'}</button><button className="secondary" disabled={!!exporting} onClick={()=>generate('full')}><Icon name={exporting==='full'?'LoaderCircle':'FileImage'} className={exporting==='full'?'spin':''}/>{exporting==='full'?'正在生成长图':'保存完整报告'}</button><button className="text-button" onClick={()=>window.print()}><Icon name="Printer" size={17}/>打印 / PDF</button></div>{notice&&<p className="error-text no-export" role="status">{notice}</p>}</section>
        <footer className="report-disclaimer"><strong>阅读提示</strong><p>{library.disclaimer}</p><div><span>潜能坐标 · POTENTIAL COORDINATES</span><span>{report.id} / V{report.version}</span></div></footer>
      </main>
    </div>
    <div className="mobile-share no-export"><button className="primary" disabled={!!exporting} onClick={()=>generate('card')}><Icon name="Share2" size={17}/>{exporting?'正在生成…':'一键生成分享卡'}</button></div>
    {image&&<div className="modal-backdrop no-export" onClick={()=>setImage(null)}><section className="image-modal" role="dialog" aria-modal="true" aria-label="报告图片预览" onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><h3>{image.kind==='card'?'你的分享卡已生成':'完整报告已生成'}</h3><p>手机可长按图片保存，或使用下方按钮。</p></div><button aria-label="关闭预览" className="icon-button" onClick={()=>setImage(null)}><Icon name="X"/></button></div><div className="image-scroll"><img src={image.url} alt={report.name+'报告分享图片'}/></div><div className="modal-actions"><button className="secondary" onClick={download}><Icon name="Download" size={17}/>下载图片</button><button className="primary" onClick={nativeShare}><Icon name="Share2" size={17}/>保存 / 分享</button></div></section></div>}
  </>;
}
function SectionTitle({no,title,text}:{no:string;title:string;text:string}){return <div className="section-heading"><span className="section-number">{no}</span><div><h2>{title}</h2><p>{text}</p></div></div>;}
function CompassArt(){return <div className="outro-compass"><Icon name="Compass" size={35}/></div>;}
