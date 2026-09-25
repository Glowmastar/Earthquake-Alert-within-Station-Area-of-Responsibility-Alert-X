import pg from 'pg';
import { readFileSync } from 'node:fs';
import { config } from './config.js';
export const pool = new pg.Pool({connectionString:config.DATABASE_URL,max:10,
 connectionTimeoutMillis:10000, idleTimeoutMillis:30000,
 ssl:config.DB_SSL==='true'?{rejectUnauthorized:true,...(config.DB_CA_FILE?{ca:readFileSync(config.DB_CA_FILE,'utf8')}: {})}:undefined});
pool.on('error', error=>console.error(JSON.stringify({event:'database_error',message:error.message})));
export const query = <T extends pg.QueryResultRow=any>(text:string,params:any[]=[]):Promise<pg.QueryResult<T>>=>pool.query<T>(text,params);
export async function transaction<T>(fn:(c:pg.PoolClient)=>Promise<T>):Promise<T>{
 const c=await pool.connect(); try {await c.query('BEGIN'); const result=await fn(c); await c.query('COMMIT'); return result;}
 catch(e){await c.query('ROLLBACK'); throw e;} finally {c.release();}
}
export async function audit(c:Pick<pg.PoolClient,'query'>,actor:string|null,description:string,type='APP_ACTION',stationId:string|null=null){
 await c.query(`INSERT INTO audit_events(audit_event_type_id,actor_user_id,event_status,description,station_id)
 SELECT audit_event_type_id,$1,'SUCCESS',$2,$4 FROM audit_event_types WHERE event_type_code=$3`,[actor,description,type,stationId]);
}
export async function auditRevision(c:Pick<pg.PoolClient,'query'>,actor:string,revision:string,description:string,type='APP_ACTION'){
 const stations=(await c.query(`SELECT DISTINCT a.station_id FROM aors a JOIN aor_boundary_versions b USING(aor_id)
  JOIN event_aor_evaluations ev USING(aor_boundary_version_id) WHERE ev.revision_id=$1
  AND ev.classification_type_id IN (SELECT classification_type_id FROM aor_classification_types WHERE classification_code<>'OUTSIDE')
  UNION SELECT DISTINCT a.station_id FROM aors a JOIN event_aor_decision_assignments da USING(aor_id)
  JOIN event_aor_decisions d USING(decision_id) WHERE d.revision_id=$1`,[revision])).rows;
 if(!stations.length)await audit(c,actor,description,type);
 for(const row of stations)await audit(c,actor,description,type,String(row.station_id));
}
