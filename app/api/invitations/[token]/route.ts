import { getRow, response, updateInvitation, view } from '@/lib/access';
export const dynamic='force-dynamic';
export async function GET(_request:Request,context:{params:Promise<{token:string}>}){
  try{const {token}=await context.params;const row=await getRow(token);return row?response(view(row)):response({error:'专属链接不存在，请核对完整链接。'},404);}catch{return response({error:'暂时无法读取进度，请稍后重试。'},503);}
}
export async function POST(request:Request,context:{params:Promise<{token:string}>}){
  try{const {token}=await context.params;return await updateInvitation(request,token);}catch(e){return response({error:e instanceof SyntaxError?'请求内容格式不正确。':'暂时无法保存，请检查网络并重试。'},e instanceof SyntaxError?400:503);}
}
