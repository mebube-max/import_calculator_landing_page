import { env } from "cloudflare:workers";
export const COOKIE="zolan_access";
export async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,"0")).join("")}
export async function hasAccess(token?:string){if(!token||!env.DB)return false;return !!(await env.DB.prepare("SELECT token_hash FROM access WHERE token_hash=? AND expires_at>?").bind(await hash(token),Date.now()).first())}
export function cookie(token:string,age:number,secure:boolean){return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure?"; Secure":""}`}
