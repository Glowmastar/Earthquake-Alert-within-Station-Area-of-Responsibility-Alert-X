import {randomUUID} from 'node:crypto';
import nodemailer from 'nodemailer';
import {query,transaction,audit} from './db.js';
import {config} from './config.js';
export function retryDelay(attempt:number){return Math.min(3600,30*2**Math.max(0,attempt-1));}
export function deliveryFailure(error:any):'RETRY'|'FAILED'|'UNCERTAIN'{
 if(error.responseCode>=500)return 'FAILED';
 if(error.responseCode>=400&&error.responseCode<500)return 'RETRY';
 if(['EDNS','ECONNECTION','ECONNREFUSED'].includes(error.code))return 'RETRY';
 if(error.code==='EAUTH')return 'FAILED';
 return 'UNCERTAIN'; // Includes timeouts after DATA and unknown transport outcomes.
}
export async function recoverExpiredJobs(){
 await transaction(async c=>{
  const jobs=(await c.query(`UPDATE alert_delivery_jobs SET state='UNCERTAIN',last_error='Worker lease expired; provider acceptance may have occurred',lease_until=NULL,updated_at=now()
 WHERE state='RUNNING' AND lease_until<now() RETURNING delivery_id,attempts`)).rows;
  for(const j of jobs){await c.query("UPDATE alert_deliveries SET delivery_status='UNCERTAIN',failure_reason='Worker stopped during delivery; reconcile before retry' WHERE delivery_id=$1",[j.delivery_id]);
   await c.query(`INSERT INTO delivery_attempts(delivery_id,attempt_number,attempt_status,error_message) VALUES($1,$2,'UNCERTAIN','Worker lease expired') ON CONFLICT DO NOTHING`,[j.delivery_id,j.attempts]);
   const a=(await c.query('SELECT alert_id FROM alert_deliveries WHERE delivery_id=$1',[j.delivery_id])).rows[0];await refreshAlertStatus(c,a.alert_id);}
 });
}
export async function claimDelivery(){
 return transaction(async c=>{
  const token=randomUUID();const j=(await c.query(`WITH candidate AS(SELECT delivery_id FROM alert_delivery_jobs WHERE state='READY' AND next_attempt_at<=now() AND attempts<max_attempts ORDER BY next_attempt_at,delivery_id FOR UPDATE SKIP LOCKED LIMIT 1)
 UPDATE alert_delivery_jobs j SET state='RUNNING',attempts=attempts+1,lease_token=$1,lease_until=now()+interval '2 minutes',updated_at=now()
 FROM candidate WHERE j.delivery_id=candidate.delivery_id RETURNING j.*`,[token])).rows[0];if(!j)return null;
  const d=(await c.query(`SELECT d.*,a.revision_id,a.alert_status,r.revision_status,m.subject,m.message_body
 FROM alert_deliveries d JOIN alerts a USING(alert_id) JOIN earthquake_revisions r USING(revision_id)
 JOIN LATERAL(SELECT subject,message_body FROM alert_messages WHERE alert_id=a.alert_id AND channel='EMAIL' ORDER BY alert_message_id DESC LIMIT 1)m ON true WHERE delivery_id=$1`,[j.delivery_id])).rows[0];
  const eligible=(await c.query(`SELECT 1 FROM alert_subscriptions sub JOIN contact_assignments ca USING(contact_assignment_id)
 JOIN contacts co USING(contact_id) JOIN subscription_contact_methods scm USING(subscription_id)
 JOIN contact_methods cm ON cm.contact_method_id=scm.contact_method_id AND cm.contact_id=co.contact_id
 JOIN LATERAL(SELECT verification_status FROM contact_method_verifications WHERE contact_method_id=cm.contact_method_id ORDER BY verification_id DESC LIMIT 1)ver ON true
 WHERE sub.subscription_id=$1 AND cm.contact_method_id=$2 AND cm.method_value=$3 AND co.active AND scm.enabled AND sub.subscription_status='ACTIVE' AND ver.verification_status='VERIFIED'
 AND sub.active_from<=now() AND (sub.active_to IS NULL OR sub.active_to>now())
 AND ca.effective_from<=now() AND (ca.effective_to IS NULL OR ca.effective_to>now())
 AND cm.active_from<=now() AND (cm.active_to IS NULL OR cm.active_to>now())
 AND EXISTS(SELECT 1 FROM alerts a JOIN earthquake_revisions r USING(revision_id) WHERE a.alert_id=$4
 AND (sub.minimum_magnitude IS NULL OR sub.minimum_magnitude<=r.magnitude)
 AND (sub.scope_type='ALL_AORS' OR EXISTS(SELECT 1 FROM subscription_aors sa JOIN event_aor_decision_assignments da USING(aor_id) WHERE sa.subscription_id=sub.subscription_id AND da.decision_id=a.decision_id)))`,[d?.subscription_id,d?.contact_method_id,d?.destination_value,d?.alert_id])).rowCount;
  if(!d||!eligible||d.revision_status!=='CURRENT'||!['APPROVED','DISPATCHING'].includes(d.alert_status)){
   await c.query("UPDATE alert_delivery_jobs SET state='CANCELLED',last_error='Revision, alert or recipient no longer eligible' WHERE delivery_id=$1",[j.delivery_id]);
   await c.query("UPDATE alert_deliveries SET delivery_status='CANCELLED',failure_reason='Revision, alert or recipient no longer eligible' WHERE delivery_id=$1",[j.delivery_id]);if(d)await refreshAlertStatus(c,d.alert_id);return null;
  }
  await c.query("UPDATE alert_deliveries SET delivery_status='SENDING' WHERE delivery_id=$1",[j.delivery_id]);
  await c.query("UPDATE alerts SET alert_status='DISPATCHING' WHERE alert_id=$1",[d.alert_id]);
  return {...d,...j};
 });
}
export async function finishDelivery(job:any,outcome:'SENT'|'RETRY'|'FAILED'|'UNCERTAIN',message:string|null=null,providerId:string|null=null){
 await transaction(async c=>{
  const current=(await c.query("SELECT * FROM alert_delivery_jobs WHERE delivery_id=$1 AND state='RUNNING' AND lease_token=$2 FOR UPDATE",[job.delivery_id,job.lease_token])).rows[0];if(!current)return;
  if(outcome==='RETRY'&&current.attempts>=current.max_attempts)outcome='FAILED';
  const state=outcome==='SENT'?'DONE':outcome==='RETRY'?'READY':outcome;
  await c.query(`UPDATE alert_delivery_jobs SET state=$2,lease_token=NULL,lease_until=NULL,last_error=$3,next_attempt_at=now()+($4*interval '1 second'),updated_at=now() WHERE delivery_id=$1`,[job.delivery_id,state,message,retryDelay(current.attempts)]);
  await c.query(`UPDATE alert_deliveries SET delivery_status=$2::text,provider_message_id=$3,failure_reason=$4,sent_at=CASE WHEN $2='SENT' THEN now() ELSE sent_at END,failed_at=CASE WHEN $2='FAILED' THEN now() ELSE failed_at END WHERE delivery_id=$1`,[job.delivery_id,outcome==='RETRY'?'QUEUED':outcome,providerId,message]);
  await c.query(`INSERT INTO delivery_attempts(delivery_id,attempt_number,attempt_status,provider_message_id,error_message) VALUES($1,$2,$3,$4,$5)`,[job.delivery_id,current.attempts,outcome==='SENT'?'SUCCESS':outcome==='RETRY'?'RETRYING':outcome,providerId,message]);
  await refreshAlertStatus(c,job.alert_id);
  await audit(c,null,`Delivery ${job.delivery_id}: ${outcome}${message?`; ${message}`:''}`,outcome==='SENT'?'ALERT_SENT':'ALERT_FAILED');
 });
}
let transport:ReturnType<typeof nodemailer.createTransport>|undefined;
export async function dispatchOne(){
 if(config.DELIVERY_ENABLED!=='true')return false;
 const job=await claimDelivery();if(!job)return false;
 transport??=nodemailer.createTransport({host:config.SMTP_HOST,port:config.SMTP_PORT,secure:config.SMTP_SECURE==='true',requireTLS:config.SMTP_SECURE!=='true',
 auth:config.SMTP_USER?{user:config.SMTP_USER,pass:config.SMTP_PASSWORD}:undefined,
 connectionTimeout:10000,greetingTimeout:10000,socketTimeout:30000,tls:{rejectUnauthorized:true}});
 try{
  const result=await transport.sendMail({from:config.EMAIL_FROM,to:job.destination_value,subject:job.subject,text:job.message_body,messageId:`<alertx-${job.delivery_id}@${new URL(config.APP_ORIGIN).hostname}>`});
  if(!result.accepted?.length)throw Object.assign(new Error('Recipient rejected'),{responseCode:550});
  await finishDelivery(job,'SENT',null,result.messageId);
 }catch(e){const error=e as any;await finishDelivery(job,deliveryFailure(error),String(error.message).slice(0,1000));}
 return true;
}

export async function refreshAlertStatus(c:Pick<import('pg').PoolClient,'query'>,alertId:string){
  await c.query(`UPDATE alerts SET alert_status=CASE
   WHEN NOT EXISTS(SELECT 1 FROM alert_deliveries WHERE alert_id=$1) THEN alert_status
   WHEN EXISTS(SELECT 1 FROM alert_deliveries WHERE alert_id=$1 AND delivery_status IN ('QUEUED','SENDING')) THEN 'DISPATCHING'
   WHEN EXISTS(SELECT 1 FROM alert_deliveries WHERE alert_id=$1 AND delivery_status IN ('FAILED','UNCERTAIN')) THEN 'FAILED'
   WHEN NOT EXISTS(SELECT 1 FROM alert_deliveries WHERE alert_id=$1 AND delivery_status NOT IN ('SENT','DELIVERED')) THEN 'COMPLETED'
   ELSE 'SUPPRESSED' END WHERE alert_id=$1`,[alertId]);
}
