import {deliverAccess,type EmailConfig} from "../../../lib/email";
import { env } from "cloudflare:workers";
import { COOKIE, cookie, hash, hasAccess } from "../../../lib/access";
export async function GET(req:Request){let token=req.headers.get("cookie")?.split("; ").find(s=>s.startsWith(COOKIE+"="))?.split("=")[1];return Response.json({granted:await hasAccess(token)},{headers:{"Cache-Control":"no-store"}})}
export async function POST(req:Request){
 const origin=new URL(req.url).origin;if(req.headers.get("origin")!==origin)return Response.json({error:"Request not allowed."},{status:403});
 if(!env.DB)return Response.json({error:"We couldn’t save your email. Please try again."},{status:503});
 try{
  if(Number(req.headers.get("content-length")||0)>4096)return Response.json({error:"Request too large."},{status:413});
  const b=await req.json() as {email?:unknown;website?:unknown;consent?:unknown;source?:unknown;attribution?:Record<string,unknown>};const email=typeof b.email==="string"?b.email.trim().toLowerCase():"";
  if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({error:"Enter a valid email address."},{status:400});
  if(b.website)return Response.json({error:"Request not allowed."},{status:400});
  const now=Date.now(),window=Math.floor(now/3600000),ip=req.headers.get("cf-connecting-ip")||"local";
  const key=await hash(ip+":"+window);
  await env.DB.prepare("INSERT INTO limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1").bind(key,now+3600000).run();
  const limit=await env.DB.prepare("SELECT count FROM limits WHERE key=?").bind(key).first<{count:number}>();
  if(limit&&limit.count>20)return Response.json({error:"Too many attempts. Please try again later."},{status:429});
  const token=crypto.randomUUID()+crypto.randomUUID();const configuredDays=Number((env as {ACCESS_DAYS?:string}).ACCESS_DAYS||30);const seconds=(Number.isFinite(configuredDays)&&configuredDays>0?Math.min(configuredDays,365):30)*86400;
  const attribution:Record<string,string>={};for(const k of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term"]){if(typeof b.attribution?.[k]==="string")attribution[k]=b.attribution[k].slice(0,150)}
  await env.DB.batch([
   env.DB.prepare("INSERT INTO leads(email,created_at,updated_at,consent,consent_version,page_version,source,attribution) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET updated_at=excluded.updated_at,consent=excluded.consent,consent_version=excluded.consent_version").bind(email,now,now,b.consent===true?1:0,"tips-v1","landing-v1",b.source==="final"?"final":"hero",JSON.stringify(attribution)),
   env.DB.prepare("INSERT INTO access(token_hash,expires_at) VALUES(?,?)").bind(await hash(token),now+seconds*1000)
  ]);
  const emailSent=await deliverAccess(env as EmailConfig,email,origin+"/api/access/recover?token="+token);
  return Response.json({granted:true,emailSent},{headers:{"Set-Cookie":cookie(token,seconds,new URL(req.url).protocol==="https:"),"Cache-Control":"no-store"}});
 }catch{console.error("Lead capture failed");return Response.json({error:"We couldn’t save your email. Please try again."},{status:500})}
}