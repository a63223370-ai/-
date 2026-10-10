import {db,getRow,response,sameOrigin,view} from '@/lib/access';
export const dynamic='force-dynamic';
const cookieName='other-side-exploration';
function savedToken(request:Request){return request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||'';}
function withCookie(request:Request,token:string,data:unknown){const r=response(data);r.headers.set('Set-Cookie',`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol==='https:'?'; Secure':''}`);return r;}
export async function GET(request:Request){
 try{const token=savedToken(request),row=await getRow(token);return response(row?{token,...view(row)}:{status:'ready'});}catch{return response({error:'暂时无法读取进度，请稍后重试。'},503);}
}
export async function POST(request:Request){
 if(!sameOrigin(request))return response({error:'来源不正确'},403);
 try{
  let token=savedToken(request),row=await getRow(token);
  if(!row){token=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');await db().prepare('INSERT INTO invitations (token,created_at) VALUES (?,?)').bind(token,Date.now()).run();row=await getRow(token);}
  const now=Date.now();
  if(row!.status==='ready')await db().prepare("UPDATE invitations SET status='active',starts_at=?,expires_at=?,version=version+1 WHERE token=? AND status='ready'").bind(now,now+86400000,token).run();
  return withCookie(request,token,{token,...view((await getRow(token))!)});
 }catch{return response({error:'暂时无法开始探索，请稍后重试。'},503);}
}
