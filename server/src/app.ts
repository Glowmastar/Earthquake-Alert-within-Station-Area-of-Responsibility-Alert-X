import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {rateLimit} from 'express-rate-limit';
import {z,ZodError} from 'zod';
import path from 'node:path';
import {existsSync} from 'node:fs';
import {config} from './config.js';
import {pool,query,transaction,audit,auditRevision} from './db.js';
import {requireAuth,requireRole,originGuard,createSession,userById,logout,eventScope,scopeArgs,checkRevisionAccess,checkReviewStationScope} from './auth.js';
import {HttpError,ensure} from './errors.js';
import {approveReview} from './workflow.js';
import {oidcRouter,oidcEnabled} from './oidc.js';
import {adminRouter} from './admin.js';
import {stationRouter} from './stations.js';
import {log,safeRequestId} from './observability.js';
export const app=express();
app.disable('x-powered-by');app.set('trust proxy',config.TRUST_PROXY);
app.use((req,res,next)=>{
 const requestId=safeRequestId(req.get('x-request-id'));const started=Date.now();res.set('X-Request-ID',requestId);
 res.on('finish',()=>{if(!req.path.startsWith('/api/health'))log('http_request',{requestId,method:req.method,path:req.path,status:res.statusCode,durationMs:Date.now()-started});});next();
});
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'"],imgSrc:["'self'",'data:','https:'],connectSrc:["'self'"],objectSrc:["'none'"],frameAncestors:["'none'"],upgradeInsecureRequests:config.secure?[]:null}}}));
app.use(express.json({limit:'5mb'}));app.use(cookieParser());
app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.get('/api/health/live',(_req,res)=>res.json({status:'alive'}));
app.get('/api/health',async(_req,res)=>{try{await query('SELECT 1');res.json({status:'ok'});}catch{res.status(503).json({status:'unavailable'});}});
app.get('/api/auth/config',(_req,res)=>res.json({oidcEnabled}));
app.use('/api/auth/oidc',oidcRouter);
app.use('/api',originGuard);
const loginLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false});
app.post('/api/auth/login',loginLimiter,async(req,res)=>{
 const body=z.object({email:z.email().max(150),password:z.string().min(1).max(72)}).parse(req.body);
 const result=await query(`SELECT user_id FROM users WHERE lower(email)=lower($1) AND account_status='ACTIVE' AND password_hash=crypt($2,password_hash)`,[body.email,body.password]);
 ensure(result.rows[0],401,'Invalid credentials or inactive account');const user=await userById(result.rows[0].user_id);ensure(user,401,'Account unavailable');
 res.json({user,csrfToken:await createSession(req,res,user)});
});
app.use('/api',requireAuth);
app.get('/api/auth/me',(req,res)=>res.json({user:req.authUser,csrfToken:req.csrfToken}));app.post('/api/auth/logout',logout);
app.get('/api/dashboard',async(req,res)=>{
 const args=scopeArgs(req.authUser!);
 const metrics=(await query(`SELECT count(*) FILTER(WHERE origin_time>=now()-interval '24 hours' AND origin_time<=now())::int AS new_earthquakes,
 count(*) FILTER(WHERE classification_code='INSIDE')::int AS inside_aor,
 count(*) FILTER(WHERE classification_code='OUTSIDE')::int AS outside_aor,
 count(*) FILTER(WHERE accepted_count>0)::int AS alerts_sent,
 count(*) FILTER(WHERE case_status IN ('OPEN','IN_REVIEW'))::int AS for_review,
 count(*) FILTER(WHERE processing_status='BLOCKED')::int AS blocked
 FROM vw_operational_events v WHERE ${eventScope} AND revision_status='CURRENT'`,args)).rows[0];
 const delivery=(await query(`SELECT count(*) FILTER(WHERE d.delivery_status IN ('SENT','DELIVERED'))::int AS sent,
 count(*) FILTER(WHERE d.delivery_status='DELIVERED')::int AS delivered,
 count(*) FILTER(WHERE d.delivery_status IN ('QUEUED','SENDING'))::int AS pending,
 count(*) FILTER(WHERE d.delivery_status='FAILED')::int AS failed,
 count(*) FILTER(WHERE d.delivery_status='UNCERTAIN')::int AS uncertain,
 count(*) FILTER(WHERE d.delivery_status='CANCELLED')::int AS cancelled
 FROM alert_deliveries d JOIN alerts a USING(alert_id) JOIN vw_operational_events v USING(revision_id) WHERE ${eventScope}`,args)).rows[0];
 const status=(await query(`SELECT
 (SELECT max(completed_at) FROM ingestion_runs WHERE run_status='COMPLETED') AS last_ingestion,
 (SELECT run_status FROM ingestion_runs ORDER BY started_at DESC LIMIT 1) AS latest_run_status,
 (SELECT max(heartbeat_at) FROM worker_health WHERE status='RUNNING') AS worker_heartbeat,
 (SELECT count(*)::int FROM aor_boundary_versions WHERE status='ACTIVE') AS boundaries`)).rows[0];
 res.json({metrics,delivery,status:{...status,ingestionEnabled:config.INGESTION_ENABLED==='true',deliveryEnabled:config.DELIVERY_ENABLED==='true'},asOf:new Date().toISOString()});
});
app.get('/api/earthquakes',async(req,res)=>{
 const q=z.object({limit:z.coerce.number().int().min(1).max(200).default(100),offset:z.coerce.number().int().min(0).default(0),classification:z.enum(['ALL','INSIDE','OUTSIDE','BOUNDARY','OVERLAP','UNRESOLVED']).default('ALL')}).parse(req.query);
 const args=[...scopeArgs(req.authUser!),q.classification,q.limit,q.offset];
 const records=(await query(`SELECT v.*,count(*) OVER()::int AS total_count FROM vw_operational_events v
 WHERE ${eventScope} AND ($3='ALL' OR classification_code=$3) ORDER BY origin_time DESC,earthquake_id LIMIT $4 OFFSET $5`,args)).rows;
 res.json({records,total:records[0]?.total_count||0,limit:q.limit,offset:q.offset});
});
app.get('/api/earthquakes/:id',async(req,res)=>{
 const id=z.uuid().parse(req.params.id);const record=(await query(`SELECT v.* FROM vw_operational_events v WHERE ${eventScope} AND earthquake_id=$3`,[...scopeArgs(req.authUser!),id])).rows[0];ensure(record,404,'Event unavailable');res.json({record});
});
app.get('/api/aors',async(req,res)=>{
 const aors=(await query(`SELECT a.aor_id,a.aor_code,a.aor_name,a.station_id,s.station_code,s.station_name,s.latitude,s.longitude,
 b.aor_boundary_version_id,b.version_number,ST_AsGeoJSON(b.boundary_geometry)::json AS geometry,
 (SELECT validation_status FROM boundary_validations WHERE aor_boundary_version_id=b.aor_boundary_version_id ORDER BY validation_id DESC LIMIT 1) AS validation_status
 FROM aors a JOIN stations s USING(station_id) LEFT JOIN aor_boundary_versions b ON b.aor_id=a.aor_id AND b.status='ACTIVE'
 WHERE a.active AND ($1 OR a.station_id=ANY($2::bigint[])) ORDER BY a.aor_code`,scopeArgs(req.authUser!))).rows;res.json({aors});
});
app.get('/api/reviews',async(req,res)=>{
 const reviews=(await query(`SELECT v.*,rc.issue_summary,rc.priority FROM vw_operational_events v JOIN review_cases rc USING(review_case_id)
 WHERE ${eventScope} AND v.case_status IN ('OPEN','IN_REVIEW') ORDER BY rc.opened_at DESC`,scopeArgs(req.authUser!))).rows;res.json({reviews});
});
app.post('/api/reviews/:id/approve',requireRole('USER','REVIEWER'),async(req,res)=>{
 const id=z.uuid().parse(req.params.id),b=z.object({aorId:z.string().regex(/^\d+$/),reason:z.string().trim().min(10).max(2000)}).parse(req.body);
 res.json(await approveReview(req.authUser!,id,b.aorId,b.reason));
});
app.post('/api/reviews/:id/reject',requireRole('USER','REVIEWER'),async(req,res)=>{
 const id=z.uuid().parse(req.params.id),reason=z.string().trim().min(10).max(2000).parse(req.body.reason);
 await transaction(async c=>{const r=(await c.query(`SELECT * FROM operational_reviews WHERE review_case_id=$1`,[id])).rows[0];ensure(r,404,'Review unavailable');
 await c.query('SELECT 1 FROM earthquake_events WHERE earthquake_id=(SELECT earthquake_id FROM earthquake_revisions WHERE revision_id=$1) FOR UPDATE',[r.revision_id]);
 await checkRevisionAccess(c,req.authUser!,String(r.revision_id));
 await checkReviewStationScope(c,req.authUser!,String(r.revision_id));
 const rc=(await c.query('SELECT * FROM review_cases WHERE review_case_id=$1 FOR UPDATE',[id])).rows[0];ensure(['OPEN','IN_REVIEW'].includes(rc.case_status),409,'Review is already closed');
 await c.query("UPDATE review_cases SET case_status='REJECTED',closed_at=now(),updated_at=now() WHERE review_case_id=$1",[id]);
 await c.query(`INSERT INTO review_case_actions(review_case_id,action_type,from_status,to_status,decision,performed_by) VALUES($1,'REJECT',$2,'REJECTED',$3,$4)`,[id,rc.case_status,reason,req.authUser!.userId]);await auditRevision(c,req.authUser!.userId,String(r.revision_id),`Review ${id} rejected: ${reason}`,'REVIEW_RESOLVED');});res.json({ok:true});
});
app.get('/api/deliveries',async(req,res)=>{
 const records=(await query(`SELECT d.*,e.external_event_id,j.attempts,j.state AS job_state,j.next_attempt_at FROM alert_deliveries d
 JOIN alerts a USING(alert_id) JOIN earthquake_revisions r USING(revision_id) JOIN earthquake_events e USING(earthquake_id)
 JOIN alert_delivery_jobs j USING(delivery_id) WHERE $1 OR EXISTS(SELECT 1 FROM event_aor_decision_assignments da JOIN aors aa USING(aor_id) WHERE da.decision_id=a.decision_id AND aa.station_id=ANY($2::bigint[])) ORDER BY d.queued_at DESC LIMIT 200`,scopeArgs(req.authUser!))).rows;res.json({records});
});
app.get('/api/contacts',async(req,res)=>{
 const contacts=(await query(`SELECT c.*,COALESCE((SELECT json_agg(json_build_object('id',cm.contact_method_id,'type',cm.method_type,'value',cm.method_value,'verification',(SELECT verification_status FROM contact_method_verifications WHERE contact_method_id=cm.contact_method_id ORDER BY verification_id DESC LIMIT 1))) FROM contact_methods cm WHERE cm.contact_id=c.contact_id AND cm.active_to IS NULL),'[]') AS methods
 FROM contacts c WHERE $1 OR EXISTS(SELECT 1 FROM contact_assignments ca WHERE ca.contact_id=c.contact_id AND ca.station_id=ANY($2::bigint[]) AND ca.effective_from<=now() AND (ca.effective_to IS NULL OR ca.effective_to>now())) ORDER BY c.full_name LIMIT 500`,scopeArgs(req.authUser!))).rows;res.json({contacts});
});
app.get('/api/recipients',async(req,res)=>{
 const records=(await query(`SELECT sub.*,c.full_name,c.contact_id,s.station_name,ca.station_id,
 ARRAY(SELECT a.aor_code FROM subscription_aors sa JOIN aors a USING(aor_id) WHERE sa.subscription_id=sub.subscription_id AND a.station_id=ca.station_id) AS aors,
 ARRAY(SELECT a.aor_id::text FROM subscription_aors sa JOIN aors a USING(aor_id) WHERE sa.subscription_id=sub.subscription_id AND a.station_id=ca.station_id) AS aor_ids
 FROM alert_subscriptions sub JOIN contact_assignments ca USING(contact_assignment_id) JOIN contacts c USING(contact_id) LEFT JOIN stations s USING(station_id)
 WHERE $1 OR ca.station_id=ANY($2::bigint[]) ORDER BY c.full_name LIMIT 500`,scopeArgs(req.authUser!))).rows;res.json({records});
});
app.get('/api/intensity',async(req,res)=>{const records=(await query(`SELECT i.* FROM vw_intensity_consolidator i JOIN vw_operational_events v USING(earthquake_id) WHERE ${eventScope} ORDER BY v.origin_time DESC LIMIT 500`,scopeArgs(req.authUser!))).rows;res.json({records});});
app.get('/api/field-reports',async(req,res)=>{const records=(await query(`SELECT f.*,ar.area_name,il.roman_numeral,v.external_event_id FROM field_intensity_reports f JOIN administrative_areas ar USING(area_id) JOIN intensity_levels il USING(intensity_level_id) JOIN vw_operational_events v USING(earthquake_id) WHERE ${eventScope} ORDER BY received_at DESC LIMIT 200`,scopeArgs(req.authUser!))).rows;res.json({records});});
app.post('/api/field-reports',requireRole('USER','OPERATOR','SEISMIC_SPECIALIST'),async(req,res)=>{
 const b=z.object({earthquakeId:z.uuid(),areaId:z.string().regex(/^\d+$/),reportingSourceId:z.string().regex(/^\d+$/),intensityLevelId:z.string().regex(/^\d+$/),feltEffects:z.string().max(2000)}).parse(req.body);
 await transaction(async c=>{const v=(await c.query('SELECT revision_id FROM vw_operational_events WHERE earthquake_id=$1',[b.earthquakeId])).rows[0];ensure(v,404,'Event not found');await checkRevisionAccess(c,req.authUser!,String(v.revision_id));
 await c.query(`INSERT INTO field_intensity_reports(earthquake_id,area_id,reporting_source_id,intensity_level_id,received_at,felt_effects,created_by) VALUES($1,$2,$3,$4,now(),$5,$6)`,[b.earthquakeId,b.areaId,b.reportingSourceId,b.intensityLevelId,b.feltEffects,req.authUser!.userId]);await auditRevision(c,req.authUser!.userId,String(v.revision_id),`Field report added for ${b.earthquakeId}`);});res.status(201).json({ok:true});
});
app.post('/api/field-reports/:id/verify',requireRole('USER','SEISMIC_SPECIALIST','REVIEWER'),async(req,res)=>{
 const id=z.uuid().parse(req.params.id);await transaction(async c=>{const f=(await c.query(`SELECT v.revision_id FROM field_intensity_reports f JOIN vw_operational_events v USING(earthquake_id) WHERE field_report_id=$1 FOR UPDATE OF f`,[id])).rows[0];ensure(f,404,'Report not found');await checkRevisionAccess(c,req.authUser!,String(f.revision_id));ensure((await c.query("UPDATE field_intensity_reports SET verification_status='VERIFIED',verified_at=now(),verified_by=$2 WHERE field_report_id=$1 AND verification_status='PENDING' RETURNING field_report_id",[id,req.authUser!.userId])).rowCount,409,'Report has already been processed');await auditRevision(c,req.authUser!.userId,String(f.revision_id),`Field report ${id} verified`);});res.json({ok:true});
});
app.get('/api/social',async(req,res)=>{const records=(await query(`SELECT sp.* FROM social_posts sp LEFT JOIN vw_operational_events v USING(earthquake_id) WHERE ($1 OR (${eventScope})) ORDER BY created_at DESC LIMIT 200`,scopeArgs(req.authUser!))).rows;res.json({records});});
app.post('/api/social',requireRole('USER','OPERATOR'),async(req,res)=>{
 const b=z.object({earthquakeId:z.uuid(),title:z.string().max(250),content:z.string().min(1).max(20000),platform:z.enum(['FACEBOOK','X','WEBSITE'])}).parse(req.body);
 await transaction(async c=>{const v=(await c.query('SELECT revision_id FROM vw_operational_events WHERE earthquake_id=$1',[b.earthquakeId])).rows[0];ensure(v,404,'Event not found');await checkRevisionAccess(c,req.authUser!,String(v.revision_id));
 await c.query(`INSERT INTO social_posts(earthquake_id,platform_id,content_type_id,title,content,created_by) SELECT $1,platform_id,content_type_id,$3,$4,$5 FROM social_platforms CROSS JOIN social_content_types WHERE platform_code=$2 AND content_type_code='GENERAL_UPDATE'`,[b.earthquakeId,b.platform,b.title,b.content,req.authUser!.userId]);await auditRevision(c,req.authUser!.userId,String(v.revision_id),`Social draft saved for ${b.earthquakeId}`);});res.status(201).json({ok:true});
});
app.get('/api/reference',async(_req,res)=>{res.json({areas:(await query('SELECT area_id,area_name FROM administrative_areas WHERE active ORDER BY area_name LIMIT 5000')).rows,levels:(await query('SELECT intensity_level_id,roman_numeral FROM intensity_levels ORDER BY numeric_level')).rows,reportingSources:(await query('SELECT reporting_source_id,source_name FROM reporting_sources WHERE active ORDER BY source_name')).rows});});
app.use('/api/stations',requireRole('USER'),stationRouter);
app.use('/api/admin',requireRole(),adminRouter);
app.use('/api',(_req,res)=>res.status(404).json({error:'API endpoint not found'}));
if(existsSync(path.resolve('dist'))){app.use(express.static(path.resolve('dist')));app.get('/{*path}',(_req,res)=>res.sendFile(path.resolve('dist/index.html')));}
app.use((error:any,_req:express.Request,res:express.Response,_next:express.NextFunction)=>{
 if(error instanceof ZodError){res.status(400).json({error:'Invalid request',issues:error.issues.map(x=>({path:x.path,message:x.message}))});return;}
 if(error instanceof HttpError){res.status(error.status).json({error:error.message});return;}
 if(error.code==='23505'){res.status(409).json({error:'This record already exists'});return;}
 if(['23503','23514','22P02'].includes(error.code)){res.status(400).json({error:'Invalid reference or field value'});return;}
 console.error(JSON.stringify({event:'api_error',message:error.message}));res.status(500).json({error:'Request could not be completed'});
});
