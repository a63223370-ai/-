import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';

const readJson=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const bank=readJson('../lib/content/questions.json');
const old=readJson('../lib/content/questions-v3.0.json');
const revision=readJson('../lib/content/questions-v3.1.json');
const library=readJson('../lib/content/library.json');
// Run the actual engine without depending on a browser or Cloudflare bindings.
let source=readFileSync(new URL('../lib/engine.ts',import.meta.url),'utf8');
for(const [name,data] of [['bank',bank],['previousBank',old],['revisionBank',revision],['libraryData',library]]){
 source=source.replace(new RegExp(`import ${name} from '[^']+';`),()=>`const ${name}=${JSON.stringify(data)};`);
}
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const engine=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

assert.equal(bank.questions.length,50);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,50);
assert.deepEqual(bank.options.map(o=>o.label),['很不符合','不太符合','我不确定','比较符合','很符合']);
assert.deepEqual(bank.options.map(o=>o.value),[1,2,3,4,5]);
for(const [i,q] of bank.questions.entries()){
 assert.equal(q.id,old.questions[i].id);
 assert.equal(q.dimension,old.questions[i].dimension);
 assert.equal(q.facet,old.questions[i].facet);
 assert.equal(q.reverse,old.questions[i].reverse);
 assert.notEqual(q.text,old.questions[i].text);
}
for(const d of bank.dimensions)assert.equal(bank.questions.filter(q=>q.dimension===d.id).length,5);
const neutral=Object.fromEntries(bank.questions.map(q=>[q.id,3]));
const neutralReport=engine.makeReport(neutral,'中性检查','NEUTRAL',0);
assert(Object.values(neutralReport.scores).every(score=>score===15));
assert.equal(neutralReport.mode,'uniform');
assert.equal(engine.readingFor(neutralReport).uncertain,true);
assert.equal(engine.evidenceFor(neutralReport,'reason').length,0);
assert.equal(engine.validateAnswers({...neutral,reason_01:6},true),false);
assert.equal(engine.validateAnswers({reason_01:3},true),false);
const varied={...neutral,reason_01:5,reason_02:4,visual_01:5,visual_02:4};
const currentReport=engine.makeReport(varied,'新版','NEW',0);
const oldReport=engine.makeReport(varied,'旧版','OLD',0,'3.0.0');
assert.equal(currentReport.version,bank.version);
assert.equal(oldReport.version,'3.0.0');
assert.deepEqual(currentReport.scores,oldReport.scores);
assert.deepEqual(currentReport.careers,oldReport.careers);
assert.equal(engine.evidenceFor(currentReport,'reason')[0].text,bank.questions[0].text);
assert.equal(engine.evidenceFor(oldReport,'reason')[0].text,old.questions[0].text);
assert.equal(engine.questionnaireFor('3.0.0').options[2].label,old.options[2].label);
assert.equal(engine.questionnaireFor().options[2].label,'我不确定');
assert.equal(engine.questionnaireFor('3.1.0').questions[8].text,revision.questions[8].text);
assert.equal(engine.evidenceFor(engine.makeReport(varied,'过渡版','MID',0,'3.1.0'),'visual')[0].text,revision.questions[8].text);
assert.equal(engine.supportsQuestionnaire('unknown'),false);
assert.throws(()=>engine.questionnaireFor('unknown'));
const portraitSource=readFileSync(new URL('../lib/portrait.ts',import.meta.url),'utf8');
const portraitCompiled=ts.transpileModule(portraitSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {portraitFor}=await import('data:text/javascript;base64,'+Buffer.from(portraitCompiled).toString('base64'));
assert.equal(portraitFor(neutralReport).qualities.length,0);
assert.equal(portraitFor(neutralReport).scenes.length,3);
const artAnswers=Object.fromEntries(bank.questions.map(q=>[q.id,['visual','create'].includes(q.dimension)?5:3]));
const artReport=engine.makeReport(artAnswers,'艺术检查','ART',0);
const artPortrait=portraitFor(artReport);
assert.match(artPortrait.title,/美感/);
assert(artPortrait.qualities.includes('有视觉感受力'));
assert(artPortrait.qualities.includes('思路灵活'));
assert(artReport.careers.some(c=>c.id==='illustration'));
assert(artReport.careers.some(c=>c.id==='brand_visual'));
assert.equal(library.careers.length,80);
const reasonAnswers=Object.fromEntries(bank.questions.map(q=>[q.id,q.dimension==='reason'?5:3]));
assert.notEqual(portraitFor(engine.makeReport(reasonAnswers,'推理检查','REASON',0)).title,artPortrait.title);
for(const value of [1,3,5]){
 const uniform=engine.makeReport(Object.fromEntries(bank.questions.map(q=>[q.id,value])),'一致检查','UNIFORM',0);
 assert.equal(portraitFor(uniform).qualities.length,0);
}
console.log('PASS: 50 questions, preserved dimensions/facets, neutral scoring, validation, unchanged career selection, version-specific questions and report evidence.');
console.log('PASS: personalized introductions, life/work/study scenes, neutral and uniform fallbacks, 80 careers, art career recommendations.');
