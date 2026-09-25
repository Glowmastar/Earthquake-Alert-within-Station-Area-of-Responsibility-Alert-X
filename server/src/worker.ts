import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {pool,query,transaction} from './db.js';
import {pollSources} from './ingestion.js';
import {recoverExpiredJobs,dispatchOne} from './delivery.js';
import {evaluateRevision} from './workflow.js';
import {log} from './observability.js';
const id=randomUUID();let stopping=false;
const heartbeat=setInterval(()=>{void query("UPDATE worker_health SET heartbeat_at=now() WHERE worker_id=$1",[id]).catch(()=>{});},30000);
process.on('SIGTERM',()=>{stopping=true;});process.on('SIGINT',()=>{stopping=true;});
try{
 log('worker_started',{workerId:id});
 while(!stopping){
  try{
   await query("INSERT INTO worker_health(worker_id,status) VALUES($1,'RUNNING') ON CONFLICT(worker_id) DO UPDATE SET heartbeat_at=now(),status='RUNNING'",[id]);
   await recoverExpiredJobs();await pollSources();
   const pending=(await query("SELECT p.revision_id,r.earthquake_id FROM event_processing p JOIN earthquake_revisions r USING(revision_id) WHERE p.status IN ('PENDING','BLOCKED') AND r.revision_status='CURRENT' ORDER BY p.revision_id LIMIT 20")).rows;
   for(const r of pending)await transaction(async c=>{await c.query('SELECT 1 FROM earthquake_events WHERE earthquake_id=$1 FOR UPDATE',[r.earthquake_id]);
    const s=(await c.query('SELECT status FROM event_processing WHERE revision_id=$1',[r.revision_id])).rows[0];if(['PENDING','BLOCKED'].includes(s.status))await evaluateRevision(c,r.revision_id);});
   for(let i=0;i<10&&!stopping;i++){if(!await dispatchOne())break;}
   await query('DELETE FROM app_sessions WHERE expires_at<now()');await query('DELETE FROM oidc_transactions WHERE expires_at<now()');
  }catch(e){log('worker_error',{workerId:id,message:e instanceof Error?e.message:'Unknown failure'});}
  if(!stopping)await delay(5000);
 }
}finally{clearInterval(heartbeat);await query("UPDATE worker_health SET status='STOPPED',heartbeat_at=now() WHERE worker_id=$1",[id]);log('worker_stopped',{workerId:id});await pool.end();}
