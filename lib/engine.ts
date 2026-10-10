import bank from './content/questions.json';
import libraryData from './content/library.json';

export const questions=bank.questions;
export const dimensions=libraryData.dimensions;
export const library=libraryData;
export const options=bank.options;
export const VERSION='3.0.0';
export type Answers=Record<string,number>;
export type Scores=Record<string,number>;
type Career=typeof library.careers[number];
export type SelectedCareer=Career & { group:string; relaxed:boolean; distant:boolean };
export type Report={version:string;id:string;nickname:string;createdAt:number;mode:string;name:string;
  scores:Scores;ranked:string[];answers:Answers;careers:SelectedCareer[]};
export const names=Object.fromEntries(dimensions.map(d=>[d.id,d.name]));
const contributions=library.plan_dimension_contributions as Record<string,string>;
export const dimIcons:Record<string,string>={reason:'Network',language:'MessagesSquare',people:'Users',self:'Compass',nature:'Leaf',action:'Hand',sound:'AudioLines',space:'Box',visual:'Palette',create:'Sparkles'};

export function validateAnswers(input:unknown,complete=false):input is Answers {
  if(!input || typeof input!=='object' || Array.isArray(input))return false;
  const entries=Object.entries(input); const known=new Set(questions.map(q=>q.id));
  return (!complete || entries.length===50) && entries.every(([key,value])=>known.has(key)&&Number.isInteger(value)&&Number(value)>=1&&Number(value)<=5);
}
export function scoreAnswers(answers:Answers):Scores {
  if(!validateAnswers(answers,true))throw new Error('需要完成全部50题。');
  const scores:Scores=Object.fromEntries(dimensions.map(d=>[d.id,0]));
  for(const q of questions)scores[q.dimension]+=answers[q.id];
  return scores;
}
export function rankScores(scores:Scores){return dimensions.map(d=>d.id).sort((a,b)=>scores[b]-scores[a]||dimensions.findIndex(d=>d.id===a)-dimensions.findIndex(d=>d.id===b));}
export function getMode(scores:Scores,answers:Answers){
  if(new Set(Object.values(answers)).size===1)return 'uniform';
  if(Math.max(...Object.values(scores))<=16)return 'low';
  if(Math.max(...Object.values(scores))-Math.min(...Object.values(scores))<=3)return 'balanced';
  if(Math.min(...Object.values(scores))>=21)return 'high';
  return 'regular';
}
export function pairFor(ranked:string[]){return library.pairs.find(p=>p.id===[ranked[0],ranked[1]].sort().join('__'))!;}
export function band(score:number){return score>=21?'较强自评线索':score>=17?'较明显倾向':'待探索线索';}
export function selectCareers(scores:Scores,uniform=false):SelectedCareer[]{
  if(uniform){const ids=['content_editor','craft','nature_content','software_qa','community_ops','finance_ops'];return ids.map(id=>({...library.careers.find(c=>c.id===id)!,group:'开放体验',relaxed:false,distant:false}));}
  const base=(c:Career)=>Object.entries(c.weights).reduce((sum,[key,w])=>sum+scores[key]*Number(w),0);
  const ranked=[...library.careers].sort((a,b)=>base(b)-base(a)||a.id.localeCompare(b.id,'en'));
  const best=base(ranked[0]),near=ranked.filter(c=>base(c)>=best-3),chosen:SelectedCareer[]=[],counts:Record<string,number>={};
  const overlap=(a:Career,b:Career)=>dimensions.reduce((s,d)=>s+Math.min(Number((a.weights as unknown as Scores)[d.id]||0),Number((b.weights as unknown as Scores)[d.id]||0)),0);
  while(chosen.length<6){
    const used=new Set(chosen.map(c=>c.id));
    let pool=near.filter(c=>!used.has(c.id)&&(counts[c.family]||0)<2);
    if(!pool.length)pool=near.filter(c=>!used.has(c.id));
    if(!pool.length)pool=ranked.filter(c=>!used.has(c.id)&&(counts[c.family]||0)<2);
    const utility=(c:Career)=>chosen.length<2?base(c):base(c)-.8*Math.max(0,...chosen.map(p=>overlap(c,p)))-.5*(counts[c.family]||0);
    pool.sort((a,b)=>utility(b)-utility(a)||base(b)-base(a)||a.id.localeCompare(b.id,'en'));
    const c=pool[0];chosen.push({...c,group:chosen.length<2?'优先体验':chosen.length<4?'相邻拓展':'补充探索',relaxed:(counts[c.family]||0)>=2,distant:base(c)<best-3});counts[c.family]=(counts[c.family]||0)+1;
  }
  return chosen;
}
export function makeReport(answers:Answers,nickname:string,id:string,createdAt=Date.now()):Report{
  const scores=scoreAnswers(answers),ranked=rankScores(scores),mode=getMode(scores,answers),pair=pairFor(ranked);
  const special=library.special_modes as unknown as Record<string, {name:string}>;
  return {version:VERSION,id,nickname:nickname.trim().slice(0,24)||'探索者',createdAt,mode,name:mode==='regular'?pair.name:special[mode].name,scores,ranked,answers:{...answers},careers:selectCareers(scores,mode==='uniform')};
}
export function readingFor(report:Report){
  const pair=pairFor(report.ranked),[a,b,c]=report.ranked;
  const variants=pair.order_variants as unknown as Record<string,{label:string;explanation:string}>;
  const overlays=pair.third_overlays as unknown as Record<string,{explanation:string}>;
  const special=library.special_modes as unknown as Record<string,{interpretation:string;strategy:string;share:string}>;
  return {pair,summary:report.mode==='regular'?pair.interpretation:special[report.mode].interpretation,
    order:report.scores[a]-report.scores[b]>=3?variants[a]:pair.balanced_variant,
    third:overlays[c].explanation,
    uncertain:Object.values(report.answers).filter(v=>v===3).length>=25,
    tied:report.scores[a]===report.scores[b]||report.ranked.slice(3).some(d=>report.scores[d]===report.scores[c])};
}
export function evidenceFor(report:Report,dim:string){return questions.filter(q=>q.dimension===dim&&report.answers[q.id]>=4).sort((a,b)=>report.answers[b.id]-report.answers[a.id]||a.position-b.position).slice(0,2);}
export function planFor(report:Report,career:SelectedCareer){
  const relevant=Object.entries(career.weights).sort(([ka,wa],[kb,wb])=>report.scores[kb]*Number(wb)-report.scores[ka]*Number(wa)||ka.localeCompare(kb)).slice(0,2).map(([k])=>k);
  return {...career.seven_day_plan,bridge:report.mode==='uniform'?'先选一项感兴趣的任务，体验比急着定义自己更重要。':`这次观察${names[relevant[0]]}如何帮助你${contributions[relevant[0]]}，以及${names[relevant[1]]}如何帮助你${contributions[relevant[1]]}。`};
}
export function sampleReport(){const scores:Scores={reason:18,language:19,people:16,self:17,nature:12,action:18,sound:20,space:21,visual:24,create:23};const answers:Answers={};for(const d of dimensions){const base=Math.floor(scores[d.id]/5),extra=scores[d.id]%5;questions.filter(q=>q.dimension===d.id).forEach((q,i)=>answers[q.id]=base+(i<extra?1:0));}return makeReport(answers,'林间来信','SAMPLE-0300',Date.UTC(2026,9,10,0));}

