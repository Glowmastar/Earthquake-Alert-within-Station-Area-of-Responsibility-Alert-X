import { createHash,randomBytes,timingSafeEqual } from 'node:crypto';
import type {Request,Response,NextFunction} from 'express';
import type pg from 'pg';
import {query,audit,transaction} from './db.js';
import {config} from './config.js';
import {ensure,HttpError} from './errors.js';
export type AuthUser={userId:string;email:string;fullName:string;roles:string[];stationIds:string[]};
declare global {namespace Express {interface Request {authUser?:AuthUser;sessionHash?:string;csrfToken?:string;}}}
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const random=()=>randomBytes(32).toString('base64url');
export const sessionName=config.secure?'__Host-alertx_session':'alertx_session';
const cookieOptions={httpOnly:true,secure:config.secure,sameSite:'lax' as const,path:'/'};
export async function userById(id:string):Promise<AuthUser|null>{
 const r=await query(`SELECT u.user_id,u.email,u.full_name,
 ARRAY(SELECT role_code FROM roles JOIN user_roles USING(role_id) WHERE user_id=u.user_id) AS roles,
 ARRAY(SELECT station_id::text FROM user_station_access WHERE user_id=u.user_id) AS stations
 FROM users u WHERE user_id=$1 AND account_status='ACTIVE'`,[id]);
 const u=r.rows[0]; return u?{userId:u.user_id,email:u.email,fullName:u.full_name,roles:u.roles,stationIds:u.stations}:null;
}
export async function createSession(req:Request,res:Response,user:AuthUser){
 const token=random(),csrf=random();
 await transaction(async c=>{
  if(req.cookies?.[sessionName])await c.query('DELETE FROM app_sessions WHERE token_hash=$1',[hash(req.cookies[sessionName])]);
  await c.query(`INSERT INTO app_sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+($4*interval '1 hour'))`,[hash(token),user.userId,csrf,config.SESSION_HOURS]);
  await c.query('UPDATE users SET last_login_at=now() WHERE user_id=$1',[user.userId]);
  await audit(c,user.userId,'Session created','AUTH_SESSION');
 });
 res.cookie(sessionName,token,{...cookieOptions,maxAge:config.SESSION_HOURS*3600000});
 return csrf;
}
export async function requireAuth(req:Request,_res:Response,next:NextFunction){
 const token=req.cookies?.[sessionName];ensure(typeof token==='string',401,'Please sign in');
 const h=hash(token); const s=(await query('SELECT user_id,csrf_token FROM app_sessions WHERE token_hash=$1 AND expires_at>now()',[h])).rows[0];
 ensure(s,401,'Session expired. Please sign in');
 const u=await userById(s.user_id);ensure(u,401,'Account is unavailable');
 req.authUser=u;req.sessionHash=h;req.csrfToken=s.csrf_token;
 if(!['GET','HEAD','OPTIONS'].includes(req.method)){
  const supplied=req.get('X-CSRF-Token')||'';const a=Buffer.from(supplied),b=Buffer.from(s.csrf_token);
  ensure(a.length===b.length && timingSafeEqual(a,b),403,'Invalid session verification. Refresh and retry');
 }
 next();
}
export function originGuard(req:Request,_res:Response,next:NextFunction){
 if(!['GET','HEAD','OPTIONS'].includes(req.method))ensure(req.get('Origin')===config.origin,403,'Request origin is not allowed');
 next();
}
export function requireRole(...roles:string[]){return(req:Request,_res:Response,next:NextFunction)=>{
 ensure(req.authUser && (req.authUser.roles.includes('ADMIN')||req.authUser.roles.some(r=>roles.includes(r))),403,'You do not have permission for this action');next();
};}
export async function logout(req:Request,res:Response){await query('DELETE FROM app_sessions WHERE token_hash=$1',[req.sessionHash]);res.clearCookie(sessionName,cookieOptions);res.status(204).end();}
// Permission predicates are shared by list, detail, review and delivery endpoints.
export const eventScope=`($1::boolean OR EXISTS(SELECT 1 FROM event_aor_evaluations ev
 JOIN aor_boundary_versions bv USING(aor_boundary_version_id) JOIN aors aa USING(aor_id)
 WHERE ev.revision_id=v.revision_id AND aa.station_id=ANY($2::bigint[])
 AND ev.classification_type_id IN (SELECT classification_type_id FROM aor_classification_types WHERE classification_code<>'OUTSIDE'))
 OR EXISTS(SELECT 1 FROM event_aor_decision_assignments da JOIN aors aa USING(aor_id)
 WHERE da.decision_id=v.decision_id AND aa.station_id=ANY($2::bigint[]))
 OR (v.revision_status='RETRACTED' AND EXISTS(SELECT 1 FROM earthquake_revisions oldr
 JOIN event_aor_decisions oldd USING(revision_id) JOIN event_aor_decision_assignments da USING(decision_id)
 JOIN aors aa USING(aor_id) WHERE oldr.earthquake_id=v.earthquake_id AND aa.station_id=ANY($2::bigint[]))))`;
export const scopeArgs=(u:AuthUser)=>[u.roles.includes('ADMIN'),u.stationIds];
export function canAccessStation(u:AuthUser,stationId:string){return u.roles.includes('ADMIN')||u.stationIds.includes(String(stationId));}
export async function checkStationAccess(c:Pick<pg.PoolClient,'query'>,u:AuthUser,stationId:string){
 ensure(canAccessStation(u,stationId),403,'Station is outside your permissions');
 ensure((await c.query('SELECT 1 FROM stations WHERE station_id=$1',[stationId])).rowCount,404,'Station not found');
}
// Review cases are event-wide. A station user cannot close a case shared with another station.
export async function checkReviewStationScope(c:Pick<pg.PoolClient,'query'>,u:AuthUser,revision:string){
 if(u.roles.includes('ADMIN'))return;
 const stations=(await c.query(`SELECT DISTINCT a.station_id FROM event_aor_evaluations ev
  JOIN aor_boundary_versions b USING(aor_boundary_version_id) JOIN aors a USING(aor_id)
  JOIN aor_classification_types t USING(classification_type_id)
  WHERE ev.revision_id=$1 AND t.classification_code<>'OUTSIDE'`,[revision])).rows;
 ensure(stations.length>0 && stations.every(row=>u.stationIds.includes(String(row.station_id))),403,
  'This review affects multiple stations and requires an administrator');
}
export async function checkRevisionAccess(c:Pick<pg.PoolClient,'query'>,u:AuthUser,revision:string){
 const r=await c.query(`SELECT 1 FROM vw_operational_events v WHERE ${eventScope} AND v.revision_id=$3`,[...scopeArgs(u),revision]);
 ensure(r.rowCount,404,'Event is unavailable in your station scope');
}
