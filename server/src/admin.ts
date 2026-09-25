import {Router} from 'express';
import {z} from 'zod';
import {query,transaction,audit} from './db.js';
import {ensure} from './errors.js';
import {inputEvent,ingestEvent} from './ingestion.js';
import {createAlert} from './workflow.js';
import {refreshAlertStatus} from './delivery.js';
export const adminRouter=Router();
const id=z.string().regex(/^\d+$/), nullableNumber=z.number().nonnegative().nullable();
adminRouter.get('/overview',async(_req,res)=>res.json({
 stations:(await query("SELECT station_id,station_code,station_name FROM stations WHERE station_type IN ('SCSS','OFFICE') ORDER BY station_code")).rows,
 aors:(await query('SELECT aor_id,aor_code,aor_name FROM aors ORDER BY aor_code')).rows,
 sources:(await query('SELECT * FROM earthquake_sources ORDER BY source_code')).rows,
 rules:(await query(`SELECT rv.*,a.aor_code FROM rule_versions rv JOIN aor_rule_assignments ra USING(rule_version_id) JOIN aors a USING(aor_id) WHERE ra.effective_to IS NULL ORDER BY rv.created_at DESC`)).rows,
 users:(await query(`SELECT u.user_id,u.email,u.full_name,u.account_status,
 ARRAY(SELECT r.role_code FROM user_roles ur JOIN roles r USING(role_id) WHERE ur.user_id=u.user_id) AS roles,
 ARRAY(SELECT station_id::text FROM user_station_access WHERE user_id=u.user_id) AS stations FROM users u ORDER BY email`)).rows,
 roles:(await query('SELECT role_code,role_name FROM roles ORDER BY role_code')).rows,
 ingestionRuns:(await query('SELECT * FROM ingestion_runs ORDER BY started_at DESC LIMIT 20')).rows,
 quarantine:(await query('SELECT quarantine_id,source_id,reason,received_at FROM ingestion_quarantine ORDER BY received_at DESC LIMIT 20')).rows
}));
adminRouter.get('/data-quality',async(_req,res)=>{
 const [summary,stations,assignments,issues,batches]=await Promise.all([
  query(`SELECT
   (SELECT count(*)::int FROM stations WHERE station_type='SCSS') AS scss_count,
   (SELECT count(*)::int FROM stations WHERE station_type='STSS') AS stss_count,
   (SELECT count(*)::int FROM stations WHERE station_type='OFFICE') AS office_count,
   (SELECT count(*)::int FROM aor_administrative_assignments WHERE approval_status='DRAFT') AS draft_assignments,
   (SELECT count(*)::int FROM aor_administrative_assignments WHERE approval_status='APPROVED') AS approved_assignments,
   (SELECT count(*)::int FROM data_validation_issues WHERE issue_status='OPEN') AS open_issues,
   (SELECT count(*)::int FROM data_validation_issues WHERE issue_status='OPEN' AND severity='BLOCKING') AS blocking_issues`),
  query(`SELECT s.station_id,s.station_code,s.station_name,s.station_type,s.cluster_name,s.validation_status,
   p.station_code AS parent_station_code,s.raw_location_text,s.latitude,s.longitude
   FROM stations s LEFT JOIN stations p ON p.station_id=s.parent_station_id
   WHERE s.source_reference='Provinces within AOR.xlsx'
   ORDER BY CASE s.station_type WHEN 'OFFICE' THEN 0 WHEN 'SCSS' THEN 1 ELSE 2 END,s.cluster_name,s.station_code`),
  query(`SELECT aa.assignment_id,s.station_code,s.station_name,aa.raw_area_name,aa.standardized_area_name,
   aa.approval_status,ar.psgc_code,a.aor_code,aa.source_sheet,aa.source_row,aa.review_notes
   FROM aor_administrative_assignments aa JOIN stations s USING(station_id)
   LEFT JOIN administrative_areas ar USING(area_id) LEFT JOIN aors a USING(aor_id)
   ORDER BY aa.approval_status,aa.assignment_id`),
  query(`SELECT validation_issue_id,entity_type,entity_reference,issue_code,severity,issue_description,issue_status,resolution_notes
   FROM data_validation_issues ORDER BY CASE severity WHEN 'BLOCKING' THEN 0 WHEN 'WARNING' THEN 1 ELSE 2 END,validation_issue_id`),
  query('SELECT import_batch_id,source_file_name,source_checksum,import_status,imported_at,notes FROM data_import_batches ORDER BY imported_at DESC')
 ]);
 res.json({summary:summary.rows[0],stations:stations.rows,assignments:assignments.rows,issues:issues.rows,batches:batches.rows});
});
adminRouter.patch('/aor-assignments/:id',async(req,res)=>{
 const assignmentId=id.parse(req.params.id);
 const b=z.object({status:z.enum(['DRAFT','IN_REVIEW','APPROVED','REJECTED']),standardizedAreaName:z.string().trim().min(1).max(150),
  psgcCode:z.string().trim().max(20).optional().or(z.literal('')),aorId:id.optional().or(z.literal('')),notes:z.string().trim().min(5).max(2000)}).parse(req.body);
 await transaction(async c=>{
  const current=(await c.query('SELECT * FROM aor_administrative_assignments WHERE assignment_id=$1 FOR UPDATE',[assignmentId])).rows[0];
  ensure(current,404,'Draft AOR assignment not found');
  let areaId=null,aorIdValue=null;
  if(b.status==='APPROVED'){
   ensure(Boolean(b.psgcCode&&b.aorId),400,'Approval requires an authoritative PSGC code and an operational AOR');
   const blockers=(await c.query(`SELECT issue_code FROM data_validation_issues
    WHERE import_batch_id=$1 AND severity='BLOCKING' AND issue_status<>'RESOLVED' ORDER BY validation_issue_id`,[current.import_batch_id])).rows;
   ensure(!blockers.length,409,`Approval is blocked until all blocking workbook issues are resolved (${blockers.map(x=>x.issue_code).join(', ')})`);
   const area=(await c.query(`SELECT aa.area_id FROM administrative_areas aa JOIN administrative_area_types t USING(area_type_id)
    WHERE aa.psgc_code=$1 AND aa.active AND t.area_type_code='PROVINCE'`,[b.psgcCode])).rows[0];
   ensure(area,400,'PSGC code must identify an active province already loaded in Alert X');
   const aor=(await c.query('SELECT aor_id FROM aors WHERE aor_id=$1 AND station_id=$2 AND active',[b.aorId,current.station_id])).rows[0];
   ensure(aor,400,'Operational AOR must belong to the workbook SCSS station');
   areaId=area.area_id;aorIdValue=aor.aor_id;
  }
  await c.query(`UPDATE aor_administrative_assignments SET standardized_area_name=$2,approval_status=$3,area_id=$4,aor_id=$5,
   reviewed_by=$6,reviewed_at=now(),review_notes=$7,effective_from=CASE WHEN $3='APPROVED' THEN COALESCE(effective_from,now()) ELSE NULL END
   WHERE assignment_id=$1`,[assignmentId,b.standardizedAreaName,b.status,areaId,aorIdValue,req.authUser!.userId,b.notes]);
  await audit(c,req.authUser!.userId,`Workbook AOR assignment ${assignmentId} changed to ${b.status}: ${b.notes}`,'BOUNDARY_CHANGED',String(current.station_id));
 });res.json({ok:true});
});
adminRouter.patch('/validation-issues/:id',async(req,res)=>{
 const issueId=id.parse(req.params.id),b=z.object({status:z.enum(['OPEN','RESOLVED','WONT_FIX']),notes:z.string().trim().min(5).max(2000)}).parse(req.body);
 await transaction(async c=>{
  const updated=await c.query(`UPDATE data_validation_issues SET issue_status=$2,resolution_notes=$3,
   resolved_by=CASE WHEN $2='OPEN' THEN NULL ELSE $4::uuid END,resolved_at=CASE WHEN $2='OPEN' THEN NULL ELSE now() END
   WHERE validation_issue_id=$1 RETURNING entity_reference,issue_code`,[issueId,b.status,b.notes,req.authUser!.userId]);
  ensure(updated.rowCount,404,'Validation issue not found');
  await audit(c,req.authUser!.userId,`Workbook validation issue ${issueId} changed to ${b.status}: ${b.notes}`);
 });res.json({ok:true});
});
adminRouter.get('/audit',async(_req,res)=>res.json({records:(await query('SELECT * FROM vw_audit_timeline ORDER BY occurred_at DESC LIMIT 500')).rows}));
adminRouter.post('/sources/:id',async(req,res)=>{
 const b=z.object({active:z.boolean(),pollIntervalSeconds:z.number().int().min(60).max(86400),endpointUrl:z.string().url()}).parse(req.body);
 ensure(new URL(b.endpointUrl).origin==='https://earthquake.phivolcs.dost.gov.ph',400,'Use the approved EQInfo origin');
 await transaction(async c=>{const r=await c.query('UPDATE earthquake_sources SET active=$2,poll_interval_seconds=$3,endpoint_url=$4,updated_at=now() WHERE source_id=$1 RETURNING source_id',[id.parse(req.params.id),b.active,b.pollIntervalSeconds,b.endpointUrl]);ensure(r.rowCount,404,'Source not found');await audit(c,req.authUser!.userId,`EQInfo source ${req.params.id} configuration changed`);});res.json({ok:true});
});
adminRouter.post('/ingest',async(req,res)=>{
 const b=z.object({sourceId:id,events:z.array(inputEvent).min(1).max(200)}).parse(req.body);
 const results=[];for(const event of b.events)results.push(await ingestEvent(b.sourceId,event,null,req.authUser!.userId));res.json({results});
});
adminRouter.post('/aors/import',async(req,res)=>{
 const b=z.object({stationCode:z.string().trim().min(1).max(10),stationName:z.string().trim().min(1).max(150),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),aorCode:z.string().trim().min(1).max(20),aorName:z.string().trim().min(1).max(150),datasetName:z.string().trim().min(3).max(150),source:z.string().trim().min(5).max(150),geometry:z.object({type:z.enum(['Polygon','MultiPolygon']),coordinates:z.array(z.any()).min(1)}),approved:z.literal(true)}).parse(req.body);
 await transaction(async c=>{
  const geometry=JSON.stringify(b.geometry);const valid=(await c.query('SELECT ST_IsValid(g) AND NOT ST_IsEmpty(g) AND ST_XMin(Box3D(g))>=-180 AND ST_XMax(Box3D(g))<=180 AND ST_YMin(Box3D(g))>=-90 AND ST_YMax(Box3D(g))<=90 AS valid FROM (SELECT ST_SetSRID(ST_GeomFromGeoJSON($1),4326)g)s',[geometry])).rows[0];ensure(valid.valid,400,'Geometry is empty, invalid or outside longitude/latitude ranges');
  const station=(await c.query(`INSERT INTO stations(organization_id,station_code,station_name,latitude,longitude,location)
 SELECT organization_id,$1,$2,$3::numeric,$4::numeric,ST_SetSRID(ST_MakePoint($4::double precision,$3::double precision),4326)::geography FROM organizations WHERE organization_code='DOST-PHIVOLCS'
 ON CONFLICT(station_code) DO UPDATE SET station_name=EXCLUDED.station_name,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,location=EXCLUDED.location,updated_at=now() RETURNING station_id`,[b.stationCode,b.stationName,b.latitude,b.longitude])).rows[0];
  const aor=(await c.query(`INSERT INTO aors(station_id,aor_code,aor_name) VALUES($1,$2,$3) ON CONFLICT(aor_code) DO UPDATE SET aor_name=EXCLUDED.aor_name RETURNING aor_id,station_id`,[station.station_id,b.aorCode,b.aorName])).rows[0];ensure(String(aor.station_id)===String(station.station_id),409,'An existing AOR cannot be reassigned to another station by this import');
  await c.query('SELECT 1 FROM aors WHERE aor_id=$1 FOR UPDATE',[aor.aor_id]);
  const dataset=(await c.query('INSERT INTO boundary_datasets(dataset_name,dataset_source) VALUES($1,$2) ON CONFLICT(dataset_name) DO UPDATE SET dataset_source=EXCLUDED.dataset_source RETURNING dataset_id',[b.datasetName,b.source])).rows[0];
  const dv=(await c.query(`INSERT INTO boundary_dataset_versions(dataset_id,version_number,imported_by,checksum) VALUES($1,gen_random_uuid()::text,$2,encode(digest($3,'sha256'),'hex')) RETURNING dataset_version_id`,[dataset.dataset_id,req.authUser!.userId,geometry])).rows[0];
  const version=(await c.query('SELECT COALESCE(max(version_number),0)+1 AS n FROM aor_boundary_versions WHERE aor_id=$1',[aor.aor_id])).rows[0].n;
  await c.query("UPDATE aor_boundary_versions SET status='SUPERSEDED',effective_to=now() WHERE aor_id=$1 AND status='ACTIVE'",[aor.aor_id]);
  const bv=(await c.query(`INSERT INTO aor_boundary_versions(aor_id,dataset_version_id,version_number,boundary_geometry,effective_from,created_by) VALUES($1,$2,$3,ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($4),4326)),now(),$5) RETURNING aor_boundary_version_id`,[aor.aor_id,dv.dataset_version_id,version,geometry,req.authUser!.userId])).rows[0];
  await c.query("INSERT INTO boundary_validations(aor_boundary_version_id,reviewer_id,validation_status,notes) VALUES($1,$2,'VALID',$3)",[bv.aor_boundary_version_id,req.authUser!.userId,`Approved import: ${b.source}`]);
  await audit(c,req.authUser!.userId,`Approved boundary ${bv.aor_boundary_version_id} for ${b.aorCode}; source ${b.source}`,'BOUNDARY_CHANGED');
 });res.status(201).json({ok:true});
});
adminRouter.post('/land-mask',async(req,res)=>{
 const b=z.object({source:z.string().min(5).max(500),geometry:z.object({type:z.enum(['Polygon','MultiPolygon']),coordinates:z.array(z.any()).min(1)}),approved:z.literal(true)}).parse(req.body);
 await transaction(async c=>{const geom=JSON.stringify(b.geometry);const valid=(await c.query('SELECT ST_IsValid(g) AND NOT ST_IsEmpty(g) AND ST_XMin(Box3D(g))>=-180 AND ST_XMax(Box3D(g))<=180 AND ST_YMin(Box3D(g))>=-90 AND ST_YMax(Box3D(g))<=90 AS valid FROM (SELECT ST_SetSRID(ST_GeomFromGeoJSON($1),4326)g)s',[geom])).rows[0];ensure(valid.valid,400,'Invalid land geometry');
 const hist=(await c.query(`INSERT INTO land_mask_history(boundary_geometry,source_name,approved_by) VALUES(ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1),4326)),$2,$3) RETURNING version_id`,[geom,b.source,req.authUser!.userId])).rows[0];
 await c.query(`INSERT INTO approved_land_mask(boundary_geometry,source_name,approved_by,version_id) VALUES(ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1),4326)),$2,$3,$4)
 ON CONFLICT(singleton) DO UPDATE SET boundary_geometry=EXCLUDED.boundary_geometry,source_name=EXCLUDED.source_name,approved_by=EXCLUDED.approved_by,approved_at=now(),version_id=EXCLUDED.version_id`,[geom,b.source,req.authUser!.userId,hist.version_id]);await audit(c,req.authUser!.userId,`Land mask approved: ${b.source}`,'BOUNDARY_CHANGED');});res.json({ok:true});
});
adminRouter.post('/rules',async(req,res)=>{
 const b=z.object({aorId:id,minimumMagnitude:nullableNumber,maximumDepthKm:nullableNumber,stationDistanceKm:nullableNumber,boundaryToleranceKm:z.number().min(0).max(100),sendInsideAorAlert:z.boolean(),feltEventRequired:z.boolean(),offshoreAction:z.enum(['REVIEW','SUPPRESS']),boundaryAction:z.enum(['REVIEW','SUPPRESS']),overlapAction:z.enum(['REVIEW','SUPPRESS']),correctedEventAction:z.enum(['REVIEW','SUPPRESS'])}).parse(req.body);
 await transaction(async c=>{
  ensure((await c.query('SELECT 1 FROM aors WHERE aor_id=$1 FOR UPDATE',[b.aorId])).rowCount,404,'AOR not found');
  const rs=(await c.query("INSERT INTO rule_sets(rule_set_name) VALUES($1) ON CONFLICT(rule_set_name) DO UPDATE SET rule_set_name=EXCLUDED.rule_set_name RETURNING rule_set_id",[`AOR ${b.aorId}`])).rows[0];
  await c.query("UPDATE rule_versions SET status='SUPERSEDED' WHERE rule_set_id=$1 AND status='ACTIVE'",[rs.rule_set_id]);
  await c.query('UPDATE aor_rule_assignments SET effective_to=now() WHERE aor_id=$1 AND effective_to IS NULL',[b.aorId]);
  const rv=(await c.query(`INSERT INTO rule_versions(rule_set_id,version_number,aor_basis,location_method,boundary_tolerance_km,send_inside_aor_alert,minimum_magnitude,maximum_depth_km,felt_event_required,station_distance_km,offshore_action,boundary_action,overlap_action,duplicate_action,missing_coordinate_action,corrected_event_action,status,created_by,activated_at)
 VALUES($1,to_char(clock_timestamp(),'YYYYMMDDHH24MISSUS'),'EPICENTER','POINT_IN_POLYGON',$2,$3,$4,$5,$6,$7,$8,$9,$10,'SUPPRESS','REVIEW',$11,'ACTIVE',$12,now()) RETURNING rule_version_id`,[rs.rule_set_id,b.boundaryToleranceKm,b.sendInsideAorAlert,b.minimumMagnitude,b.maximumDepthKm,b.feltEventRequired,b.stationDistanceKm,b.offshoreAction,b.boundaryAction,b.overlapAction,b.correctedEventAction,req.authUser!.userId])).rows[0];
  await c.query('INSERT INTO aor_rule_assignments(aor_id,rule_version_id,effective_from,assigned_by) VALUES($1,$2,now(),$3)',[b.aorId,rv.rule_version_id,req.authUser!.userId]);await audit(c,req.authUser!.userId,`Rule ${rv.rule_version_id} activated for AOR ${b.aorId}`,'RULE_CHANGED');
 });res.status(201).json({ok:true});
});
adminRouter.post('/contacts',async(req,res)=>{
 const b=z.object({name:z.string().trim().min(1).max(150),email:z.email().max(200),stationId:id,aorIds:z.array(id).min(1),minimumMagnitude:nullableNumber}).parse(req.body);
 await transaction(async c=>{
  const station=(await c.query('SELECT organization_id FROM stations WHERE station_id=$1',[b.stationId])).rows[0];ensure(station?.organization_id,400,'Station needs an organization');
  for(const a of b.aorIds)ensure((await c.query('SELECT 1 FROM aors WHERE aor_id=$1 AND station_id=$2',[a,b.stationId])).rowCount,400,'Selected AOR must belong to this station');
  const contact=(await c.query('INSERT INTO contacts(full_name) VALUES($1) RETURNING contact_id',[b.name])).rows[0];
  const assignment=(await c.query(`INSERT INTO contact_assignments(contact_id,organization_id,station_id,contact_role_id,effective_from) SELECT $1,$2,$3,contact_role_id,now() FROM contact_roles WHERE role_code='STATION_PERSONNEL' RETURNING contact_assignment_id`,[contact.contact_id,station.organization_id,b.stationId])).rows[0];
  const method=(await c.query("INSERT INTO contact_methods(contact_id,method_type,method_value,is_primary) VALUES($1,'EMAIL',$2,true) RETURNING contact_method_id",[contact.contact_id,b.email])).rows[0];
  await c.query("INSERT INTO contact_method_verifications(contact_method_id,verification_status) VALUES($1,'UNVERIFIED')",[method.contact_method_id]);
  const sub=(await c.query("INSERT INTO alert_subscriptions(contact_assignment_id,scope_type,minimum_magnitude) VALUES($1,'SELECTED_AORS',$2) RETURNING subscription_id",[assignment.contact_assignment_id,b.minimumMagnitude])).rows[0];
  for(const a of b.aorIds)await c.query('INSERT INTO subscription_aors VALUES($1,$2)',[sub.subscription_id,a]);
  await c.query('INSERT INTO subscription_contact_methods(subscription_id,contact_method_id) VALUES($1,$2)',[sub.subscription_id,method.contact_method_id]);await audit(c,req.authUser!.userId,`Contact ${contact.contact_id} created; email verification pending`,'CONTACT_UPDATED');
 });res.status(201).json({ok:true});
});
adminRouter.patch('/contacts/:id',async(req,res)=>{
 const cid=z.uuid().parse(req.params.id),b=z.object({name:z.string().min(1).max(150),active:z.boolean()}).parse(req.body);
 await transaction(async c=>{ensure((await c.query('UPDATE contacts SET full_name=$2,active=$3,updated_at=now() WHERE contact_id=$1 RETURNING contact_id',[cid,b.name,b.active])).rowCount,404,'Contact not found');await audit(c,req.authUser!.userId,`Contact ${cid} updated`,'CONTACT_UPDATED');});res.json({ok:true});
});
adminRouter.post('/contact-methods/:id/verify',async(req,res)=>{
 const mid=id.parse(req.params.id),b=z.object({status:z.enum(['VERIFIED','FAILED','EXPIRED']),evidence:z.string().trim().min(10).max(1000)}).parse(req.body);
 await transaction(async c=>{await c.query('INSERT INTO contact_method_verifications(contact_method_id,verification_status,verified_at,verified_by,verification_notes) VALUES($1,$2,now(),$3,$4)',[mid,b.status,req.authUser!.userId,b.evidence]);await audit(c,req.authUser!.userId,`Contact method ${mid}: ${b.status}; ${b.evidence}`,'CONTACT_UPDATED');});res.json({ok:true});
});
adminRouter.patch('/subscriptions/:id',async(req,res)=>{
 const sid=id.parse(req.params.id),b=z.object({status:z.enum(['ACTIVE','INACTIVE','SUSPENDED']),minimumMagnitude:nullableNumber,scope:z.enum(['SELECTED_AORS','ALL_AORS']),aorIds:z.array(id)}).parse(req.body);ensure(b.scope==='ALL_AORS'||b.aorIds.length,400,'Select at least one AOR');
 await transaction(async c=>{const row=(await c.query(`SELECT ca.station_id FROM alert_subscriptions sub JOIN contact_assignments ca USING(contact_assignment_id) WHERE sub.subscription_id=$1 FOR UPDATE OF sub`,[sid])).rows[0];ensure(row,404,'Subscription not found');
  for(const aid of b.aorIds)ensure((await c.query('SELECT 1 FROM aors WHERE aor_id=$1 AND station_id=$2 AND active',[aid,row.station_id])).rowCount,400,'Selected AOR must belong to the recipient station');
  await c.query('DELETE FROM subscription_aors WHERE subscription_id=$1',[sid]);
  await c.query('UPDATE alert_subscriptions SET subscription_status=$2,minimum_magnitude=$3,scope_type=$4 WHERE subscription_id=$1',[sid,b.status,b.minimumMagnitude,b.scope]);
  for(const aid of b.aorIds)await c.query('INSERT INTO subscription_aors VALUES($1,$2)',[sid,aid]);await audit(c,req.authUser!.userId,`Subscription ${sid} updated`,'CONTACT_UPDATED',String(row.station_id));});res.json({ok:true});
});
adminRouter.post('/users',async(req,res)=>{
 const b=z.object({email:z.email().max(150),name:z.string().min(1).max(150),password:z.string().min(14).max(72),roles:z.array(z.string()).min(1),stationIds:z.array(id)}).parse(req.body);
 await transaction(async c=>{const u=(await c.query(`INSERT INTO users(username,email,password_hash,full_name) VALUES($1,$1,crypt($2,gen_salt('bf',12)),$3) RETURNING user_id`,[b.email,b.password,b.name])).rows[0];
 for(const role of b.roles)ensure((await c.query('INSERT INTO user_roles(user_id,role_id,assigned_by) SELECT $1,role_id,$3 FROM roles WHERE role_code=$2 RETURNING user_id',[u.user_id,role,req.authUser!.userId])).rowCount,400,'Unknown role');
 for(const s of b.stationIds)await c.query('INSERT INTO user_station_access VALUES($1,$2)',[u.user_id,s]);await audit(c,req.authUser!.userId,`User ${u.user_id} created`);});res.status(201).json({ok:true});
});
adminRouter.patch('/users/:id',async(req,res)=>{
 const uid=z.uuid().parse(req.params.id),b=z.object({status:z.enum(['ACTIVE','INACTIVE','LOCKED','SUSPENDED']),roles:z.array(z.string()).min(1),stationIds:z.array(id)}).parse(req.body);
 ensure(uid!==req.authUser!.userId,400,'Use another administrator to change your own access');
 await transaction(async c=>{ensure((await c.query('UPDATE users SET account_status=$2,updated_at=now() WHERE user_id=$1 RETURNING user_id',[uid,b.status])).rowCount,404,'User not found');await c.query('DELETE FROM user_roles WHERE user_id=$1',[uid]);await c.query('DELETE FROM user_station_access WHERE user_id=$1',[uid]);
 for(const role of b.roles)ensure((await c.query('INSERT INTO user_roles(user_id,role_id,assigned_by) SELECT $1,role_id,$3 FROM roles WHERE role_code=$2 RETURNING user_id',[uid,role,req.authUser!.userId])).rowCount,400,'Unknown role');for(const s of b.stationIds)await c.query('INSERT INTO user_station_access VALUES($1,$2)',[uid,s]);await c.query('DELETE FROM app_sessions WHERE user_id=$1',[uid]);await audit(c,req.authUser!.userId,`User ${uid} access changed; sessions revoked`);});res.json({ok:true});
});
adminRouter.post('/users/:id/reset-password',async(req,res)=>{
 const uid=z.uuid().parse(req.params.id),password=z.string().min(14).max(72).parse(req.body.password);
 await transaction(async c=>{ensure((await c.query("UPDATE users SET password_hash=crypt($2,gen_salt('bf',12)),updated_at=now() WHERE user_id=$1 RETURNING user_id",[uid,password])).rowCount,404,'User not found');await c.query('DELETE FROM app_sessions WHERE user_id=$1',[uid]);await audit(c,req.authUser!.userId,`Password reset for user ${uid}; sessions revoked`);});res.json({ok:true});
});
adminRouter.post('/oidc-identities',async(req,res)=>{
 const b=z.object({userId:z.uuid(),issuer:z.string().url(),subject:z.string().min(1).max(1000)}).parse(req.body);
 await transaction(async c=>{await c.query('INSERT INTO oidc_identities VALUES($1,$2,$3)',[b.issuer,b.subject,b.userId]);await audit(c,req.authUser!.userId,`Organizational identity linked to ${b.userId}`);});res.status(201).json({ok:true});
});
adminRouter.post('/deliveries/:id/reconcile',async(req,res)=>{
 const did=id.parse(req.params.id),b=z.object({outcome:z.enum(['SENT','DELIVERED','NOT_SENT']),evidence:z.string().trim().min(10).max(1000),providerId:z.string().max(200).optional()}).parse(req.body);
 await transaction(async c=>{const j=(await c.query('SELECT * FROM alert_delivery_jobs WHERE delivery_id=$1 FOR UPDATE',[did])).rows[0];ensure(j&&['UNCERTAIN','FAILED','DONE'].includes(j.state),409,'Delivery is not ready for reconciliation');
 ensure(!(j.state==='DONE'&&b.outcome==='NOT_SENT'),409,'An accepted delivery cannot be blindly resent');
 await c.query(`UPDATE alert_delivery_jobs SET state=$2,last_error=$3,attempts=CASE WHEN $2='READY' THEN 0 ELSE attempts END,next_attempt_at=now(),updated_at=now() WHERE delivery_id=$1`,[did,b.outcome==='NOT_SENT'?'READY':'DONE',b.evidence]);
 // Preserve all attempt numbers when granting more retry capacity.
 if(b.outcome==='NOT_SENT')await c.query(`UPDATE alert_delivery_jobs SET attempts=(SELECT COALESCE(max(attempt_number),0) FROM delivery_attempts WHERE delivery_id=$1),max_attempts=(SELECT COALESCE(max(attempt_number),0)+5 FROM delivery_attempts WHERE delivery_id=$1) WHERE delivery_id=$1`,[did]);
 await c.query(`UPDATE alert_deliveries SET delivery_status=$2::text,failure_reason=$3,provider_message_id=COALESCE($4,provider_message_id),sent_at=CASE WHEN $2 IN ('SENT','DELIVERED') THEN COALESCE(sent_at,now()) ELSE sent_at END,delivered_at=CASE WHEN $2='DELIVERED' THEN now() ELSE delivered_at END WHERE delivery_id=$1`,[did,b.outcome==='NOT_SENT'?'QUEUED':b.outcome,b.evidence,b.providerId||null]);
 const parent=(await c.query('SELECT alert_id FROM alert_deliveries WHERE delivery_id=$1',[did])).rows[0];await refreshAlertStatus(c,parent.alert_id);
 await audit(c,req.authUser!.userId,`Delivery ${did} reconciled as ${b.outcome}: ${b.evidence}`);});res.json({ok:true});
});
adminRouter.post('/alerts/:id/release',async(req,res)=>{
 const aid=z.uuid().parse(req.params.id);const result=await transaction(async c=>{
 await c.query('SELECT 1 FROM earthquake_events WHERE earthquake_id=(SELECT earthquake_id FROM earthquake_revisions JOIN alerts USING(revision_id) WHERE alert_id=$1) FOR UPDATE',[aid]);
 const a=(await c.query('SELECT * FROM alerts WHERE alert_id=$1 FOR UPDATE',[aid])).rows[0];ensure(a?.alert_status==='HELD_FOR_REVIEW',409,'Alert is not held for missing recipients');ensure((await c.query("SELECT 1 FROM earthquake_revisions WHERE revision_id=$1 AND revision_status='CURRENT'",[a.revision_id])).rowCount,409,'Revision is no longer current');return createAlert(c,a.revision_id,a.decision_id,req.authUser!.userId,a.idempotency_key);});res.json({alertId:result});
});
adminRouter.post('/areas',async(req,res)=>{
 const b=z.object({psgcCode:z.string().min(1).max(20),name:z.string().min(1).max(150),type:z.enum(['REGION','PROVINCE','CITY','MUNICIPALITY','BARANGAY']),parentId:id.nullable()}).parse(req.body);
 await transaction(async c=>{await c.query(`INSERT INTO administrative_areas(psgc_code,area_name,area_type_id,parent_area_id) SELECT $1,$2,area_type_id,$4 FROM administrative_area_types WHERE area_type_code=$3`,[b.psgcCode,b.name,b.type,b.parentId]);await audit(c,req.authUser!.userId,`Administrative area ${b.psgcCode} added`);});res.status(201).json({ok:true});
});
adminRouter.post('/reporting-sources',async(req,res)=>{
 const b=z.object({name:z.string().min(1).max(200),type:z.enum(['DRRMO','POLICE_BFP','DEPED','BARANGAY','CITIZEN','OTHER'])}).parse(req.body);
 await transaction(async c=>{await c.query(`INSERT INTO reporting_sources(reporter_type_id,source_name) SELECT reporter_type_id,$2 FROM reporter_types WHERE reporter_type_code=$1`,[b.type,b.name]);await audit(c,req.authUser!.userId,`Reporting source added: ${b.name}`);});res.status(201).json({ok:true});
});
