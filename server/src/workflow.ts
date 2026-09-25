import type pg from 'pg';
import {audit,transaction} from './db.js';
import {ensure} from './errors.js';
import {checkRevisionAccess,checkReviewStationScope,type AuthUser} from './auth.js';
export function policyReason(rule:any,event:any):string|null{
 if(!rule.send_inside_aor_alert)return 'Inside-AOR alerts are disabled by this rule';
 if(rule.minimum_magnitude!=null && Number(event.magnitude)<Number(rule.minimum_magnitude))return 'Below the configured magnitude threshold';
 if(rule.maximum_depth_km!=null && Number(event.depth_km)>Number(rule.maximum_depth_km))return 'Exceeds the configured depth threshold';
 if(rule.station_distance_km!=null && Number(event.station_distance_km)>Number(rule.station_distance_km))return 'Beyond the configured station distance';
 if(rule.felt_event_required && !event.felt_verified)return 'A verified felt report is required';
 return null;
}
export const reviewNotificationEligible=(classification:string)=>['INSIDE','BOUNDARY','OVERLAP'].includes(classification);
export async function createAlert(c:pg.PoolClient,revision:string,decision:string,actor:string|null,key:string){
 const old=(await c.query('SELECT alert_id,alert_status FROM alerts WHERE idempotency_key=$1',[key])).rows[0];if(old&&old.alert_status!=='HELD_FOR_REVIEW')return old.alert_id;
 const event=(await c.query(`SELECT e.external_event_id,r.*,a.aor_name,a.aor_id,a.station_id FROM earthquake_revisions r
 JOIN earthquake_events e USING(earthquake_id) JOIN event_aor_decision_assignments da ON da.decision_id=$2 AND assignment_type='PRIMARY'
 JOIN aors a USING(aor_id) WHERE r.revision_id=$1`,[revision,decision])).rows[0];ensure(event,409,'An explicit AOR assignment is required');
 const recipients=(await c.query(`SELECT DISTINCT ON(lower(cm.method_value)) sub.subscription_id,cm.contact_method_id,cm.method_value
 FROM alert_subscriptions sub JOIN contact_assignments ca USING(contact_assignment_id) JOIN contacts c USING(contact_id)
 JOIN subscription_contact_methods scm USING(subscription_id) JOIN contact_methods cm ON cm.contact_method_id=scm.contact_method_id AND cm.contact_id=c.contact_id
 JOIN LATERAL(SELECT verification_status FROM contact_method_verifications WHERE contact_method_id=cm.contact_method_id ORDER BY verification_id DESC LIMIT 1) ver ON true
 WHERE c.active AND scm.enabled AND sub.subscription_status='ACTIVE' AND cm.method_type='EMAIL' AND ver.verification_status='VERIFIED'
 AND ca.effective_from<=now() AND (ca.effective_to IS NULL OR ca.effective_to>now())
 AND sub.active_from<=now() AND (sub.active_to IS NULL OR sub.active_to>now())
 AND cm.active_from<=now() AND (cm.active_to IS NULL OR cm.active_to>now())
 AND (sub.minimum_magnitude IS NULL OR sub.minimum_magnitude<=$2)
 AND ((sub.scope_type='ALL_AORS' AND ca.station_id=$3) OR EXISTS(SELECT 1 FROM subscription_aors sa WHERE sa.subscription_id=sub.subscription_id AND sa.aor_id=$1))
 ORDER BY lower(cm.method_value),sub.subscription_id`,[event.aor_id,event.magnitude,event.station_id])).rows;
 const alert=old?.alert_id||(await c.query(`INSERT INTO alerts(revision_id,decision_id,alert_type,alert_status,approved_by,approved_at,idempotency_key,suppression_reason)
 VALUES($1,$2,'AOR_EMAIL',$3,$4,now(),$5,$6) RETURNING alert_id`,[revision,decision,recipients.length?'APPROVED':'HELD_FOR_REVIEW',actor,key,recipients.length?null:'No eligible verified recipients; configure recipients and release this alert explicitly'])).rows[0].alert_id;
 const subject=`Alert X: M${event.magnitude} earthquake — ${event.aor_name}`;
 const body=`Earthquake: ${event.external_event_id}\nRevision: ${event.revision_number}\nOrigin (UTC): ${new Date(event.origin_time).toISOString()}\nLocation: ${event.source_location_text||'See coordinates'}\nCoordinates: ${event.latitude}, ${event.longitude}\nMagnitude: ${event.magnitude}\nDepth: ${event.depth_km} km\nAssigned AOR: ${event.aor_name}\n\nThis is an earthquake monitoring notification. Refer to the official PHIVOLCS bulletin for authoritative information.`;
 if(!old)await c.query(`INSERT INTO alert_messages(alert_id,channel,subject,message_body,template_version) VALUES($1,'EMAIL',$2,$3,'1')`,[alert,subject,body]);
 if(old&&recipients.length)await c.query("UPDATE alerts SET alert_status='APPROVED',suppression_reason=NULL,approved_by=$2,approved_at=now() WHERE alert_id=$1",[alert,actor]);
 for(const r of recipients){
  const d=(await c.query(`INSERT INTO alert_deliveries(alert_id,subscription_id,contact_method_id,delivery_status,destination_type,destination_value)
   VALUES($1,$2,$3,'QUEUED','EMAIL',$4) RETURNING delivery_id`,[alert,r.subscription_id,r.contact_method_id,r.method_value])).rows[0];
  await c.query('INSERT INTO alert_delivery_jobs(delivery_id) VALUES($1)',[d.delivery_id]);
 }
 await audit(c,actor,`Alert ${alert} approved with ${recipients.length} queued deliveries`,'ALERT_APPROVED');return alert;
}
async function openReview(c:pg.PoolClient,revision:string,decision:string|null,type:string,reason:string){
 if((await c.query('SELECT 1 FROM operational_reviews WHERE revision_id=$1',[revision])).rowCount)return;
 const rc=(await c.query(`INSERT INTO review_cases(review_case_type_id,priority,issue_summary)
 SELECT review_case_type_id,'HIGH',$2 FROM review_case_types WHERE case_type_code=$1 RETURNING review_case_id`,[type,reason])).rows[0];
 await c.query('INSERT INTO review_case_events(review_case_id,revision_id) VALUES($1,$2)',[rc.review_case_id,revision]);
 await c.query('INSERT INTO operational_reviews(review_case_id,revision_id,decision_id) VALUES($1,$2,$3)',[rc.review_case_id,revision,decision]);
 await c.query(`UPDATE event_processing SET status='REVIEW',reason=$2,processed_at=now() WHERE revision_id=$1`,[revision,reason]);
 await audit(c,null,`Review ${rc.review_case_id}: ${reason}`,'REVIEW_OPENED');
}
export async function evaluateRevision(c:pg.PoolClient,revision:string){
 const r=(await c.query(`SELECT r.*,EXISTS(SELECT 1 FROM field_intensity_reports WHERE earthquake_id=r.earthquake_id AND verification_status='VERIFIED') AS felt_verified
 FROM earthquake_revisions r WHERE revision_id=$1`,[revision])).rows[0];ensure(r,404,'Revision not found');
 if(r.revision_status!=='CURRENT')return;
 const candidates=(await c.query(`SELECT b.aor_boundary_version_id,b.aor_id,a.station_id,rv.*,
 ST_Covers(b.boundary_geometry,r.epicenter::geometry) AS covered,
 ST_DWithin(ST_Boundary(b.boundary_geometry)::geography,r.epicenter,rv.boundary_tolerance_km*1000) AS near_boundary,
 ST_Distance(ST_Boundary(b.boundary_geometry)::geography,r.epicenter)/1000 AS boundary_distance,
 ST_Distance(st.location,r.epicenter)/1000 AS station_distance_km
 FROM aor_boundary_versions b JOIN aors a USING(aor_id) JOIN stations st USING(station_id)
 JOIN aor_rule_assignments ra ON ra.aor_id=a.aor_id AND ra.effective_from<=now() AND (ra.effective_to IS NULL OR ra.effective_to>now())
 JOIN rule_versions rv USING(rule_version_id) CROSS JOIN earthquake_revisions r
 WHERE r.revision_id=$1 AND b.status='ACTIVE' AND a.active AND st.station_status='ACTIVE'
 AND b.effective_from<=now() AND (b.effective_to IS NULL OR b.effective_to>now()) AND rv.status='ACTIVE'
 AND EXISTS(SELECT 1 FROM boundary_validations bv WHERE bv.aor_boundary_version_id=b.aor_boundary_version_id
 AND bv.validation_status='VALID' AND bv.validation_id=(SELECT max(validation_id) FROM boundary_validations WHERE aor_boundary_version_id=b.aor_boundary_version_id))
 ORDER BY b.aor_id`,[revision])).rows;
 const configured=(await c.query("SELECT count(*)::int AS n FROM aors JOIN stations USING(station_id) WHERE active AND station_status='ACTIVE'")).rows[0].n;
 const unsupported=candidates.some(x=>x.aor_basis!=='EPICENTER' || x.location_method!=='POINT_IN_POLYGON');
 if(!candidates.length || new Set(candidates.map(x=>String(x.aor_id))).size!==candidates.length || candidates.length!==configured || unsupported){
  await c.query(`UPDATE event_processing SET status='BLOCKED',reason='Approved boundaries and one supported active rule per active AOR are required',processed_at=now() WHERE revision_id=$1`,[revision]);return;
 }
 const types=Object.fromEntries((await c.query('SELECT classification_code,classification_type_id FROM aor_classification_types')).rows.map(x=>[x.classification_code,x.classification_type_id]));
 const evals=[];for(const a of candidates){
  const cl=a.near_boundary?'BOUNDARY':a.covered?'INSIDE':'OUTSIDE';
  const e=(await c.query(`INSERT INTO event_aor_evaluations(revision_id,aor_boundary_version_id,rule_version_id,classification_type_id,distance_to_boundary_km)
 VALUES($1,$2,$3,$4,$5) ON CONFLICT(revision_id,aor_boundary_version_id,rule_version_id) DO UPDATE SET classification_type_id=EXCLUDED.classification_type_id,distance_to_boundary_km=EXCLUDED.distance_to_boundary_km
 RETURNING evaluation_id`,[revision,a.aor_boundary_version_id,a.rule_version_id,types[cl],a.boundary_distance])).rows[0];evals.push(e.evaluation_id);
 }
 const matches=candidates.filter(x=>x.covered||x.near_boundary);const chosen=matches[0]||candidates[0];
 const classification=matches.length>1?'OVERLAP':matches.some(x=>x.near_boundary)?'BOUNDARY':matches.some(x=>x.covered)?'INSIDE':'OUTSIDE';
 const ruleFailure=classification==='INSIDE'?policyReason(chosen,{...r,station_distance_km:chosen.station_distance_km}):null;
 const land=(await c.query('SELECT version_id,ST_Covers(boundary_geometry,$1::geography::geometry) AS on_land FROM approved_land_mask WHERE singleton=true',[r.epicenter])).rows[0];
 if(land)await c.query('UPDATE event_processing SET land_mask_version_id=$2 WHERE revision_id=$1',[revision,land.version_id]);
 const offshore=land?!land.on_land:null;
 const corrected=Number(r.revision_number)>1;
 let reason=classification==='INSIDE'?'Epicenter inside an approved AOR':`Spatial classification: ${classification}`;
 if(ruleFailure)reason=ruleFailure;
 if(offshore===null)reason='Land/offshore status cannot be verified: approved land mask required';
 else if(offshore)reason='Offshore event: apply configured offshore policy';
 if(corrected)reason='Source correction requires review of the new revision';
 const prev=(await c.query('SELECT decision_id FROM event_aor_decisions WHERE revision_id=$1 ORDER BY decided_at DESC,decision_id DESC LIMIT 1',[revision])).rows[0];
 const d=(await c.query(`INSERT INTO event_aor_decisions(revision_id,rule_version_id,classification_type_id,decision_source,decision_reason,supersedes_decision_id)
 VALUES($1,$2,$3,'SYSTEM',$4,$5) RETURNING decision_id`,[revision,chosen.rule_version_id,types[classification],reason,prev?.decision_id||null])).rows[0].decision_id;
 if(classification==='INSIDE')await c.query(`INSERT INTO event_aor_decision_assignments VALUES($1,$2,'PRIMARY')`,[d,chosen.aor_id]);
 for(const e of evals)await c.query('INSERT INTO event_aor_decision_evaluations VALUES($1,$2)',[d,e]);
 await c.query(`UPDATE event_processing SET status='EVALUATED',reason=$2,processed_at=now() WHERE revision_id=$1`,[revision,reason]);
 await audit(c,null,`Revision ${revision}: ${classification}; ${reason}`,'AOR_CLASSIFIED');
 const exceptionAction=corrected?chosen.corrected_event_action:offshore===null?'REVIEW':offshore?chosen.offshore_action:
 classification==='BOUNDARY'?chosen.boundary_action:classification==='OVERLAP'?chosen.overlap_action:null;
 if(exceptionAction==='SUPPRESS')return;
 if(exceptionAction==='REVIEW' || ruleFailure==='A verified felt report is required'){
  await openReview(c,revision,d,corrected?'CORRECTED_EVENT':offshore?'OFFSHORE_EVENT':classification==='BOUNDARY'?'BOUNDARY_EVENT':'AMBIGUOUS_LOCATION',reason);return;
 }
 if(classification==='INSIDE'&&!ruleFailure)await createAlert(c,revision,d,null,`auto:${revision}`);
}
export async function approveReview(user:AuthUser,caseId:string,aorId:string,reason:string){
 return transaction(async c=>{
  // Match ingestion's event lock before checking revision or review state.
  const lookup=(await c.query(`SELECT r.earthquake_id FROM operational_reviews o JOIN earthquake_revisions r USING(revision_id) WHERE review_case_id=$1`,[caseId])).rows[0];ensure(lookup,404,'Review not found');
  await c.query('SELECT 1 FROM earthquake_events WHERE earthquake_id=$1 FOR UPDATE',[lookup.earthquake_id]);
  const rc=(await c.query(`SELECT o.*,rc.case_status,r.revision_status FROM operational_reviews o JOIN review_cases rc USING(review_case_id)
 JOIN earthquake_revisions r USING(revision_id) WHERE review_case_id=$1 FOR UPDATE OF rc`,[caseId])).rows[0];
  await checkRevisionAccess(c,user,String(rc.revision_id));
  await checkReviewStationScope(c,user,String(rc.revision_id));
  ensure(rc.revision_status==='CURRENT',409,'This review refers to a superseded or retracted revision');
  if(rc.result_alert_id)return{alertId:rc.result_alert_id,reused:true};
  ensure(['OPEN','IN_REVIEW'].includes(rc.case_status),409,'Review is already closed');
  const chosen=(await c.query(`SELECT ev.*,a.station_id,ct.classification_code FROM event_aor_evaluations ev
 JOIN aor_boundary_versions b USING(aor_boundary_version_id) JOIN aors a USING(aor_id)
 JOIN aor_classification_types ct USING(classification_type_id)
 WHERE ev.revision_id=$1 AND a.aor_id=$2 AND a.active`,[rc.revision_id,aorId])).rows[0];
  ensure(chosen,409,'Choose an AOR evaluated for this revision');
  ensure(user.roles.includes('ADMIN')||user.stationIds.includes(String(chosen.station_id)),403,'AOR is outside your station permissions');
  ensure(reviewNotificationEligible(chosen.classification_code),409,'An outside AOR evaluation cannot be approved for notification');
  const latest=(await c.query('SELECT decision_id FROM event_aor_decisions WHERE revision_id=$1 ORDER BY decided_at DESC,decision_id DESC LIMIT 1',[rc.revision_id])).rows[0];
  const d=(await c.query(`INSERT INTO event_aor_decisions(revision_id,rule_version_id,classification_type_id,decision_source,decision_reason,decided_by,supersedes_decision_id)
 SELECT $1,$2,classification_type_id,'MANUAL',$3,$4,$5 FROM aor_classification_types WHERE classification_code='INSIDE' RETURNING decision_id`,[rc.revision_id,chosen.rule_version_id,reason,user.userId,latest?.decision_id||null])).rows[0].decision_id;
  await c.query(`INSERT INTO event_aor_decision_assignments VALUES($1,$2,'PRIMARY')`,[d,aorId]);
  await c.query('INSERT INTO event_aor_decision_evaluations VALUES($1,$2)',[d,chosen.evaluation_id]);
  const alertId=await createAlert(c,String(rc.revision_id),d,user.userId,`review:${caseId}`);
  await c.query(`UPDATE review_cases SET case_status='RESOLVED',closed_at=now(),updated_at=now() WHERE review_case_id=$1`,[caseId]);
  await c.query('UPDATE operational_reviews SET selected_aor_id=$2,result_alert_id=$3,decision_id=$4 WHERE review_case_id=$1',[caseId,aorId,alertId,d]);
  await c.query(`INSERT INTO review_case_actions(review_case_id,action_type,from_status,to_status,decision,performed_by) VALUES($1,'APPROVE',$2,'RESOLVED',$3,$4)`,[caseId,rc.case_status,reason,user.userId]);
  await audit(c,user.userId,`Review ${caseId} approved for AOR ${aorId}: ${reason}`,'REVIEW_RESOLVED',String(chosen.station_id));return{alertId,reused:false};
 });
}
