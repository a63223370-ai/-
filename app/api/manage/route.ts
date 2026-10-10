import { authorized, body, db, response, sameOrigin } from '@/lib/access';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  try{if(!await authorized(request))return response({error:'管理密钥不正确。'},401);
    const rows=await db().prepare('SELECT token,created_at,starts_at,expires_at,completed_at,status,nickname,questionnaire_version FROM invitations ORDER BY created_at DESC LIMIT 500').all();
    return response({items:rows.results});
  }catch{return response({error:'暂时无法读取发货记录。'},503);}
}
export async function POST(request:Request){
  try{if(!await authorized(request)||!sameOrigin(request))return response({error:'无管理权限。'},403);
    const input=await body(request);
    if(input.action==='revoke'){
      if(typeof input.token!=='string'||!/^[a-f0-9]{64}$/.test(input.token))return response({error:'链接格式不正确。'},400);
      await db().prepare("UPDATE invitations SET status='revoked',version=version+1 WHERE token=? AND status IN ('ready','active')").bind(input.token).run();return response({ok:true});
    }
    const count=Number(input.count);
    if(!Number.isInteger(count)||count<1||count>100)return response({error:'每次可以生成1—100条。'},400);
    const now=Date.now(),tokens=Array.from({length:count},()=>{const b=crypto.getRandomValues(new Uint8Array(32));return Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');});
    await db().batch(tokens.map(token=>db().prepare('INSERT INTO invitations (token,created_at) VALUES (?,?)').bind(token,now)));
    return response({tokens});
  }catch{return response({error:'操作没有完成，请刷新记录后再试。'},503);}
}
