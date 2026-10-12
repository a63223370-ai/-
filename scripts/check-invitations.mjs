import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8787',key=process.env.ADMIN_KEY||readFileSync('.dev.vars','utf8').match(/^ADMIN_KEY\s*=\s*(.+)$/m)[1].trim(),bank=JSON.parse(readFileSync('lib/content/questions.json','utf8'));
const request=async(path,data,admin=false)=>{if(process.env.TEST_TRACE)console.log(data?'POST':'GET',path);const r=await fetch(base+path,{signal:AbortSignal.timeout(15000),method:data?'POST':'GET',headers:{'Connection':'close','Content-Type':'application/json',...(admin?{Authorization:'Bearer '+key}:{})},...(data?{body:JSON.stringify(data)}:{})});return {code:r.status,data:await r.json()};};
assert.equal((await request('/api/manage')).code,401);
const created=await request('/api/manage',{count:3},true);assert.equal(created.code,200);assert.equal(created.data.tokens.length,3);const [token,revoke,expire]=created.data.tokens,path='/api/invitations/'+token;
assert.equal(new Set(created.data.tokens).size,3);
if(process.env.TEST_BULK==='true'){
 const batch=await request('/api/manage',{count:100},true);assert.equal(batch.code,200);assert.equal(new Set(batch.data.tokens).size,100);
}
let r=await request(path);assert.equal(r.data.status,'ready');r=await request(path,{action:'start'});assert.equal(r.data.status,'active');assert.equal(r.data.expiresAt-r.data.startsAt,86400000);let version=r.data.version;
assert.equal(r.data.questionnaireVersion,bank.version);
const first=bank.questions[0].id;r=await request(path,{action:'save',version,answers:{[first]:4}});assert.equal(r.code,200);assert.equal(r.data.answers[first],4);
assert.equal((await request(path,{action:'save',version,answers:{[first]:2}})).code,409);version=r.data.version;
assert.equal((await request(path,{action:'submit',version,answers:{[first]:4}})).code,400);
assert.equal((await request(path,{action:'save',version,answers:{[first]:6}})).code,400);
const answers=Object.fromEntries(bank.questions.map((q,i)=>[q.id,i%5+1]));const inputs={action:'submit',version,answers,nickname:'流程检查'};const concurrent=await Promise.all([request(path,inputs),request(path,{...inputs,nickname:'并发检查'})]);assert(concurrent.every(r=>r.code===200));assert.deepEqual(concurrent[0].data.report,concurrent[1].data.report);const report=concurrent[0].data.report;
assert.equal(report.careers.length,6);assert.equal(new Set(report.careers.map(c=>c.id)).size,6);assert.equal(Object.keys(report.scores).length,10);
assert.deepEqual((await request(path)).data.report,report);assert.deepEqual((await request(path,{action:'start'})).data.report,report);assert.deepEqual((await request(path,{action:'submit',version:0,answers:{}})).data.report,report);
await request('/api/manage',{action:'revoke',token:revoke},true);assert.equal((await request('/api/invitations/'+revoke,{action:'start'})).code,410);
if(process.env.TEST_INVITATION_ONLY==='true'){
 assert.equal((await request('/api/explore')).data.requiresInvitation,true);
 assert.equal((await request('/api/explore',{})).code,403);
}
writeFileSync('.sites-runtime/test-tokens.json',JSON.stringify({completed:token,expire}));
console.log('PASS: admin authentication, issue/start, 24h window, cloud resume, conflict, answer validation, concurrent submit, frozen result, revoke.');
