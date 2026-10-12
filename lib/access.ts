import { env } from 'cloudflare:workers';
import { makeReport, validateAnswers, supportsQuestionnaire } from './engine';

type Row={token:string;created_at:number;starts_at:number|null;expires_at:number|null;completed_at:number|null;status:string;answers:string;nickname:string;version:number;questionnaire_version:string;report:string|null};
const bindings=()=>env as unknown as {DB:D1Database;ADMIN_KEY?:string;ALLOW_PUBLIC_EXPLORE?:string};
export function publicExplorationEnabled(){return bindings().ALLOW_PUBLIC_EXPLORE==='true';}
export function db(){const database=bindings().DB;if(!database)throw new Error('存储服务暂不可用');return database;}
export function response(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});}
export async function authorized(request:Request){
  const expected=bindings().ADMIN_KEY,provided=request.headers.get('authorization')?.replace(/^Bearer /,'');
  if(!expected||!provided)return false;
  const digest=async(s:string)=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
  const [a,b]=await Promise.all([digest(expected),digest(provided)]);let diff=0;for(let i=0;i<a.length;i++)diff|=a[i]^b[i];return diff===0;
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
export async function getRow(token:string){if(!/^[a-f0-9]{64}$/.test(token))return null;return db().prepare('SELECT * FROM invitations WHERE token = ?').bind(token).first<Row>();}
export function view(row:Row){
  if(row.status==='completed')return {status:'completed',report:JSON.parse(row.report!),version:row.version};
  const status=row.status==='revoked'?'revoked':row.expires_at&&Date.now()>=row.expires_at?'expired':row.status;
  return {status,startsAt:row.starts_at,expiresAt:row.expires_at,answers:status==='active'?JSON.parse(row.answers):{},nickname:row.nickname,version:row.version,questionnaireVersion:row.questionnaire_version};
}
export async function body(request:Request){if(Number(request.headers.get('content-length'))>25000)throw new Error('请求过大');const text=await request.text();if(text.length>25000)throw new Error('请求过大');return JSON.parse(text);}
export async function updateInvitation(request:Request,token:string){
  if(!sameOrigin(request))return response({error:'来源不正确'},403);
  const input=await body(request);let row=await getRow(token);
  if(!row)return response({error:'专属链接不存在，请核对购买后收到的完整链接。'},404);
  if(row.status==='completed')return response(view(row));
  if(row.status==='revoked')return response({error:'此链接已停用。',state:view(row)},410);
  if(!supportsQuestionnaire(row.questionnaire_version))return response({error:'题库版本不一致，请联系店铺处理。'},409);
  const now=Date.now();
  if(row.expires_at&&now>=row.expires_at)return response({error:'24小时答题时间已结束。',state:view(row)},410);
  if(input.action==='start'){
    await db().prepare("UPDATE invitations SET status='active', starts_at=?, expires_at=?, version=version+1 WHERE token=? AND status='ready' AND starts_at IS NULL")
      .bind(now,now+86400000,token).run();return response(view((await getRow(token))!));
  }
  if(row.status!=='active')return response({error:'请先开始测试。'},409);
  if(!Number.isInteger(input.version)||input.version!==row.version)return response({error:'此链接已在另一处更新，已恢复最新进度。',state:view(row)},409);
  if(!validateAnswers(input.answers,input.action==='submit'))return response({error:'请检查答题内容，完成全部50题后生成报告。'},400);
  const nickname=typeof input.nickname==='string'?input.nickname.trim().slice(0,24):row.nickname;
  if(input.action==='save'){
    const changed=await db().prepare("UPDATE invitations SET answers=?, nickname=?, version=version+1 WHERE token=? AND version=? AND status='active' AND expires_at>?")
      .bind(JSON.stringify(input.answers),nickname,token,row.version,now).run();
    if(!changed.meta.changes)return response({error:'进度已更新，请使用最新内容。',state:view((await getRow(token))!)},409);
    return response(view((await getRow(token))!));
  }
  if(input.action==='submit'){
    const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)));
    const reportId='PC-'+Array.from(hash.slice(0,6),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
    const report=makeReport(input.answers,nickname,reportId,now,row.questionnaire_version);
    const changed=await db().prepare("UPDATE invitations SET status='completed',answers=?,nickname=?,report=?,completed_at=?,version=version+1 WHERE token=? AND version=? AND status='active' AND expires_at>?")
      .bind(JSON.stringify(input.answers),nickname,JSON.stringify(report),now,token,row.version,now).run();
    const latest=(await getRow(token))!;
    if(!changed.meta.changes&&latest.status!=='completed')return response({error:'提交状态发生变化，请查看最新进度。',state:view(latest)},409);
    return response(view(latest));
  }
  return response({error:'不支持的操作。'},400);
}
