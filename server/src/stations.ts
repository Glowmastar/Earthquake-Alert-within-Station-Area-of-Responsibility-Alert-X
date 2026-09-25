import {Router} from 'express';
import {z} from 'zod';
import {query,transaction,audit} from './db.js';
import {checkStationAccess,canAccessStation} from './auth.js';
import {ensure} from './errors.js';

export const stationRouter=Router();
const id=z.string().regex(/^\d+$/),nullableNumber=z.number().nonnegative().nullable();
const stationOfContact=async(c:any,contactId:string,user:Express.Request['authUser'])=>{
 ensure((await c.query('SELECT 1 FROM contacts WHERE contact_id=$1 FOR UPDATE',[contactId])).rowCount,404,'Contact is unavailable');
 const rows=(await c.query(`SELECT ca.station_id FROM contact_assignments ca
 WHERE ca.contact_id=$1 AND ca.effective_from<=now() AND (ca.effective_to IS NULL OR ca.effective_to>now()) FOR UPDATE OF ca`,[contactId])).rows;
 const stations=[...new Set<string>(rows.map((r:any)=>String(r.station_id)))];ensure(stations.length,404,'Contact is unavailable');
 // A contact shared with another station cannot be changed through a station user's account.
 ensure(user!.roles.includes('ADMIN')||stations.length===1,403,'Shared contacts require system administration');
 const stationId=stations[0];await checkStationAccess(c,user!,stationId);return stationId;
};

stationRouter.get('/overview',async(req,res)=>{
 const [stations,aors,rules]=await Promise.all([
  query("SELECT station_id,station_code,station_name FROM stations WHERE station_type IN ('SCSS','OFFICE') AND ($1 OR station_id=ANY($2::bigint[])) ORDER BY station_code",[req.authUser!.roles.includes('ADMIN'),req.authUser!.stationIds]),
  query('SELECT aor_id,aor_code,aor_name,station_id FROM aors WHERE active AND ($1 OR station_id=ANY($2::bigint[])) ORDER BY aor_code',[req.authUser!.roles.includes('ADMIN'),req.authUser!.stationIds]),
  query(`SELECT rv.*,a.aor_id,a.aor_code,a.station_id FROM rule_versions rv JOIN aor_rule_assignments ra USING(rule_version_id)
   JOIN aors a USING(aor_id) WHERE ra.effective_to IS NULL AND ($1 OR a.station_id=ANY($2::bigint[])) ORDER BY rv.created_at DESC`,[req.authUser!.roles.includes('ADMIN'),req.authUser!.stationIds])
 ]);
 res.json({stations:stations.rows,aors:aors.rows,rules:rules.rows});
});

stationRouter.get('/activity',async(req,res)=>{
 const stationId=id.parse(req.query.stationId);
 ensure(canAccessStation(req.authUser!,stationId),403,'Station is outside your permissions');
 const records=(await query(`SELECT e.audit_event_id,e.occurred_at,e.description,e.event_status,t.event_type_name,u.full_name AS actor_name,s.station_name
 FROM audit_events e JOIN audit_event_types t USING(audit_event_type_id) LEFT JOIN users u ON u.user_id=e.actor_user_id
 JOIN stations s USING(station_id) WHERE e.station_id=$1 ORDER BY e.occurred_at DESC LIMIT 200`,[stationId])).rows;
 res.json({records});
});

stationRouter.post('/contacts',async(req,res)=>{
 const b=z.object({name:z.string().trim().min(1).max(150),email:z.email().max(200),stationId:id,aorIds:z.array(id).min(1),minimumMagnitude:nullableNumber}).parse(req.body);
 await transaction(async c=>{
  await checkStationAccess(c,req.authUser!,b.stationId);
  const station=(await c.query('SELECT organization_id FROM stations WHERE station_id=$1',[b.stationId])).rows[0];ensure(station?.organization_id,400,'Station needs an organization');
  for(const aid of b.aorIds)ensure((await c.query('SELECT 1 FROM aors WHERE aor_id=$1 AND station_id=$2 AND active',[aid,b.stationId])).rowCount,400,'Selected AOR must belong to this station');
  const contact=(await c.query('INSERT INTO contacts(full_name) VALUES($1) RETURNING contact_id',[b.name])).rows[0];
  const assignment=(await c.query(`INSERT INTO contact_assignments(contact_id,organization_id,station_id,contact_role_id,effective_from)
   SELECT $1,$2,$3,contact_role_id,now() FROM contact_roles WHERE role_code='STATION_PERSONNEL' RETURNING contact_assignment_id`,[contact.contact_id,station.organization_id,b.stationId])).rows[0];
  const method=(await c.query("INSERT INTO contact_methods(contact_id,method_type,method_value,is_primary) VALUES($1,'EMAIL',$2,true) RETURNING contact_method_id",[contact.contact_id,b.email])).rows[0];
  await c.query("INSERT INTO contact_method_verifications(contact_method_id,verification_status) VALUES($1,'UNVERIFIED')",[method.contact_method_id]);
  const sub=(await c.query("INSERT INTO alert_subscriptions(contact_assignment_id,scope_type,minimum_magnitude) VALUES($1,'SELECTED_AORS',$2) RETURNING subscription_id",[assignment.contact_assignment_id,b.minimumMagnitude])).rows[0];
  for(const aid of b.aorIds)await c.query('INSERT INTO subscription_aors VALUES($1,$2)',[sub.subscription_id,aid]);
  await c.query('INSERT INTO subscription_contact_methods(subscription_id,contact_method_id) VALUES($1,$2)',[sub.subscription_id,method.contact_method_id]);
  await audit(c,req.authUser!.userId,`Contact ${contact.contact_id} created; verification pending`,'CONTACT_UPDATED',b.stationId);
 });res.status(201).json({ok:true});
});

stationRouter.patch('/contacts/:id',async(req,res)=>{
 const contactId=z.uuid().parse(req.params.id),b=z.object({name:z.string().trim().min(1).max(150),active:z.boolean()}).parse(req.body);
 await transaction(async c=>{
  const stationId=await stationOfContact(c,contactId,req.authUser);
  ensure((await c.query('UPDATE contacts SET full_name=$2,active=$3,updated_at=now() WHERE contact_id=$1 RETURNING contact_id',[contactId,b.name,b.active])).rowCount,404,'Contact not found');
  await audit(c,req.authUser!.userId,`Contact ${contactId} updated`,'CONTACT_UPDATED',stationId);
 });res.json({ok:true});
});

stationRouter.post('/contact-methods/:id/verify',async(req,res)=>{
 const methodId=id.parse(req.params.id),b=z.object({status:z.enum(['VERIFIED','FAILED','EXPIRED']),evidence:z.string().trim().min(10).max(1000)}).parse(req.body);
 await transaction(async c=>{
  const m=(await c.query('SELECT contact_id FROM contact_methods WHERE contact_method_id=$1 AND active_to IS NULL',[methodId])).rows[0];ensure(m,404,'Method unavailable');
  const stationId=await stationOfContact(c,m.contact_id,req.authUser);
  await c.query('INSERT INTO contact_method_verifications(contact_method_id,verification_status,verified_at,verified_by,verification_notes) VALUES($1,$2,now(),$3,$4)',[methodId,b.status,req.authUser!.userId,b.evidence]);
  await audit(c,req.authUser!.userId,`Contact method ${methodId}: ${b.status}; ${b.evidence}`,'CONTACT_UPDATED',stationId);
 });res.json({ok:true});
});

stationRouter.patch('/subscriptions/:id',async(req,res)=>{
 const subscriptionId=id.parse(req.params.id),b=z.object({status:z.enum(['ACTIVE','INACTIVE','SUSPENDED']),minimumMagnitude:nullableNumber,scope:z.enum(['SELECTED_AORS','ALL_AORS']),aorIds:z.array(id)}).parse(req.body);
 ensure(b.scope==='ALL_AORS'||b.aorIds.length>0,400,'Select at least one AOR');
 ensure(b.scope!=='ALL_AORS'||b.aorIds.length===0,400,'All AORs is station-local and cannot include selected AOR mappings');
 await transaction(async c=>{
  const row=(await c.query(`SELECT ca.station_id,ca.contact_id FROM alert_subscriptions sub
   JOIN contact_assignments ca USING(contact_assignment_id) WHERE sub.subscription_id=$1 FOR UPDATE OF sub`,[subscriptionId])).rows[0];ensure(row,404,'Subscription not found');
  const stationId=String(row.station_id);await checkStationAccess(c,req.authUser!,stationId);
  ensure((await c.query('SELECT 1 FROM contact_assignments WHERE contact_assignment_id=(SELECT contact_assignment_id FROM alert_subscriptions WHERE subscription_id=$1) AND effective_from<=now() AND (effective_to IS NULL OR effective_to>now())',[subscriptionId])).rowCount,409,'Assignment is no longer active');
  for(const aid of b.aorIds)ensure((await c.query('SELECT 1 FROM aors WHERE aor_id=$1 AND station_id=$2 AND active',[aid,stationId])).rowCount,400,'Selected AOR must belong to this station');
  await c.query('DELETE FROM subscription_aors WHERE subscription_id=$1',[subscriptionId]);
  await c.query('UPDATE alert_subscriptions SET subscription_status=$2,minimum_magnitude=$3,scope_type=$4 WHERE subscription_id=$1',[subscriptionId,b.status,b.minimumMagnitude,b.scope]);
  for(const aid of b.aorIds)await c.query('INSERT INTO subscription_aors VALUES($1,$2)',[subscriptionId,aid]);
  await audit(c,req.authUser!.userId,`Subscription ${subscriptionId} updated`,'CONTACT_UPDATED',stationId);
 });res.json({ok:true});
});

// Station rule changes are versioned, require a fresh password and a recorded reason.
stationRouter.post('/rules',async(req,res)=>{
 const b=z.object({aorId:id,minimumMagnitude:nullableNumber,maximumDepthKm:nullableNumber,stationDistanceKm:nullableNumber,
  boundaryToleranceKm:z.number().min(0).max(100),sendInsideAorAlert:z.boolean(),feltEventRequired:z.boolean(),
  offshoreAction:z.enum(['REVIEW','SUPPRESS']),boundaryAction:z.enum(['REVIEW','SUPPRESS']),overlapAction:z.enum(['REVIEW','SUPPRESS']),
  correctedEventAction:z.enum(['REVIEW','SUPPRESS']),reason:z.string().trim().min(10).max(1000),password:z.string().min(1).max(72)}).parse(req.body);
 await transaction(async c=>{
  const aor=(await c.query('SELECT station_id FROM aors WHERE aor_id=$1 AND active FOR UPDATE',[b.aorId])).rows[0];ensure(aor,404,'AOR not found');
  const stationId=String(aor.station_id);await checkStationAccess(c,req.authUser!,stationId);
  ensure((await c.query("SELECT 1 FROM users WHERE user_id=$1 AND account_status='ACTIVE' AND password_hash=crypt($2,password_hash)",[req.authUser!.userId,b.password])).rowCount,403,'Password confirmation failed');
  const rs=(await c.query("INSERT INTO rule_sets(rule_set_name) VALUES($1) ON CONFLICT(rule_set_name) DO UPDATE SET rule_set_name=EXCLUDED.rule_set_name RETURNING rule_set_id",[`AOR ${b.aorId}`])).rows[0];
  await c.query("UPDATE rule_versions SET status='SUPERSEDED' WHERE rule_set_id=$1 AND status='ACTIVE'",[rs.rule_set_id]);
  await c.query('UPDATE aor_rule_assignments SET effective_to=now() WHERE aor_id=$1 AND effective_to IS NULL',[b.aorId]);
  const rv=(await c.query(`INSERT INTO rule_versions(rule_set_id,version_number,aor_basis,location_method,boundary_tolerance_km,send_inside_aor_alert,minimum_magnitude,maximum_depth_km,felt_event_required,station_distance_km,offshore_action,boundary_action,overlap_action,duplicate_action,missing_coordinate_action,corrected_event_action,status,created_by,activated_at)
   VALUES($1,to_char(clock_timestamp(),'YYYYMMDDHH24MISSUS'),'EPICENTER','POINT_IN_POLYGON',$2,$3,$4,$5,$6,$7,$8,$9,$10,'SUPPRESS','REVIEW',$11,'ACTIVE',$12,now()) RETURNING rule_version_id`,
   [rs.rule_set_id,b.boundaryToleranceKm,b.sendInsideAorAlert,b.minimumMagnitude,b.maximumDepthKm,b.feltEventRequired,b.stationDistanceKm,b.offshoreAction,b.boundaryAction,b.overlapAction,b.correctedEventAction,req.authUser!.userId])).rows[0];
  await c.query('INSERT INTO aor_rule_assignments(aor_id,rule_version_id,effective_from,assigned_by) VALUES($1,$2,now(),$3)',[b.aorId,rv.rule_version_id,req.authUser!.userId]);
  await audit(c,req.authUser!.userId,`Rule ${rv.rule_version_id} activated for AOR ${b.aorId}: ${b.reason}`,'RULE_CHANGED',stationId);
 });res.status(201).json({ok:true});
});
