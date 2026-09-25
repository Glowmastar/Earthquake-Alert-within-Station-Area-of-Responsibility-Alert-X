import {createHash,randomUUID} from 'node:crypto';
import {load} from 'cheerio';
import {z} from 'zod';
import {query,transaction,audit} from './db.js';
import {evaluateRevision} from './workflow.js';
import {refreshAlertStatus} from './delivery.js';
import {config} from './config.js';
import {archiveSourceResponse} from './archive.js';
export const inputEvent=z.object({externalId:z.string().min(1).max(100),originTime:z.iso.datetime({offset:true}),magnitude:z.number().min(0).max(9.9),depthKm:z.number().min(0).max(99999),latitude:z.number().min(-90).max(90),longitude:z.number().min(-180).max(180),location:z.string().max(2000),retracted:z.boolean().default(false),bulletinNumber:z.number().int().positive().default(1)});
export type InputEvent=z.infer<typeof inputEvent>;
const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
export function parsePht(text:string){
 const m=text.replace(/\s+/g,' ').trim().match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})\s*[-–]\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
 if(!m)throw new Error('Unrecognized Philippine date format');
 const month=months.indexOf(m[2].slice(0,3).toLowerCase());const day=+m[1],h=+m[4],minute=+m[5],second=+(m[6]||0);
 if(month<0||day<1||day>31||h<1||h>12||minute>59||second>59)throw new Error('Invalid source date');
 const local=new Date(Date.UTC(+m[3],month,day,h%12+(m[7].toUpperCase()==='PM'?12:0),minute,second));
 if(local.getUTCDate()!==day||local.getUTCMonth()!==month)throw new Error('Invalid calendar date');
 return new Date(local.getTime()-8*3600000).toISOString();
}
export function parseEqInfo(html:string){
 const $=load(html),events:InputEvent[]=[],rejected:{raw:string;reason:string}[]=[];
 $('tr').each((_i,row)=>{
  const cells=$(row).children('td');if(cells.length<6)return;
  const first=$(cells[0]).text().replace(/\s+/g,' ').trim();
  const link=$(cells[0]).find('a[href]').attr('href');
  if(!link&&!/^\d{1,2} [A-Za-z]+ \d{4}/.test(first))return;
  if(!/^\d{1,2} [A-Za-z]+ \d{4}/.test(first))return;
  const values=cells.toArray().slice(0,6).map(x=>$(x).text().replace(/\s+/g,' ').trim());
  try{
   const id=link?.match(/(\d{4}_\d{4}_\d{4,6})_B(\d+)/i);if(!id)throw new Error('Missing stable bulletin identity');
   const nums=values.slice(1,5).map(v=>{if(!/^-?\d+(\.\d+)?$/.test(v))throw new Error('Invalid numeric field');return Number(v);});
   events.push(inputEvent.parse({externalId:id[1],bulletinNumber:+id[2],originTime:parsePht(first),latitude:nums[0],longitude:nums[1],depthKm:nums[2],magnitude:nums[3],location:values[5]}));
  }catch(e){rejected.push({raw:JSON.stringify(values),reason:e instanceof Error?e.message:'Invalid source row'});}
 });
 if(!events.length&&!rejected.length)throw new Error('EQInfo page contains no recognized event rows; parser needs review');
 // Only the highest bulletin on this page may update an event.
 const latest=new Map<string,InputEvent>();for(const e of events)if(!latest.has(e.externalId)||latest.get(e.externalId)!.bulletinNumber<e.bulletinNumber)latest.set(e.externalId,e);
 return {events:[...latest.values()],rejected};
}
export async function ingestEvent(source:string,event:InputEvent,run:string|null=null,actor:string|null=null){
 return transaction(async c=>{
  await c.query(`INSERT INTO earthquake_events(source_id,external_event_id,first_received_at) VALUES($1,$2,now()) ON CONFLICT DO NOTHING`,[source,event.externalId]);
  const eq=(await c.query('SELECT earthquake_id FROM earthquake_events WHERE source_id=$1 AND external_event_id=$2 FOR UPDATE',[source,event.externalId])).rows[0];
  const latest=(await c.query('SELECT * FROM earthquake_revisions WHERE earthquake_id=$1 ORDER BY revision_number DESC LIMIT 1',[eq.earthquake_id])).rows[0];
  const canonical=JSON.stringify({...event,originTime:new Date(event.originTime).toISOString()});const hash=createHash('sha256').update(canonical).digest('hex');
  if(latest?.content_hash===hash)return 'unchanged';
  if(latest && Number(latest.source_bulletin_number)>event.bulletinNumber)return 'unchanged';
  if(latest && latest.revision_status==='RETRACTED'&&!event.retracted && event.bulletinNumber<=Number(latest.source_bulletin_number))return 'unchanged';
  await c.query(`UPDATE earthquake_revisions SET revision_status='SUPERSEDED' WHERE earthquake_id=$1 AND revision_status='CURRENT'`,[eq.earthquake_id]);
  // Stop unclaimed deliveries for older revisions. In-flight outcomes remain recorded honestly.
  await c.query(`UPDATE alert_delivery_jobs j SET state='CANCELLED',last_error='Source revised or retracted',updated_at=now()
 FROM alert_deliveries d JOIN alerts a USING(alert_id) JOIN earthquake_revisions r USING(revision_id)
 WHERE j.delivery_id=d.delivery_id AND r.earthquake_id=$1 AND j.state='READY'`,[eq.earthquake_id]);
  await c.query(`UPDATE alert_deliveries d SET delivery_status='CANCELLED',failure_reason='Source revised or retracted'
 FROM alert_delivery_jobs j WHERE j.delivery_id=d.delivery_id AND j.state='CANCELLED' AND d.delivery_status='QUEUED'`);
  const oldAlerts=(await c.query('SELECT alert_id FROM alerts JOIN earthquake_revisions USING(revision_id) WHERE earthquake_id=$1',[eq.earthquake_id])).rows;
  for(const a of oldAlerts)await refreshAlertStatus(c,a.alert_id);
  await c.query(`UPDATE review_cases rc SET case_status='CLOSED',closed_at=now(),updated_at=now()
 FROM operational_reviews o JOIN earthquake_revisions r USING(revision_id)
 WHERE rc.review_case_id=o.review_case_id AND r.earthquake_id=$1 AND rc.case_status IN ('OPEN','IN_REVIEW')`,[eq.earthquake_id]);
  const revision=(await c.query(`INSERT INTO earthquake_revisions(earthquake_id,revision_number,origin_time,magnitude,depth_km,latitude,longitude,epicenter,source_location_text,received_at,revision_status,content_hash,source_bulletin_number)
 VALUES($1,$2,$3,$4,$5,$6::numeric,$7::numeric,ST_SetSRID(ST_MakePoint($7::double precision,$6::double precision),4326)::geography,$8,now(),$9,$10,$11) RETURNING revision_id`,[eq.earthquake_id,(latest?.revision_number||0)+1,event.originTime,event.magnitude,event.depthKm,event.latitude,event.longitude,event.location,event.retracted?'RETRACTED':'CURRENT',hash,event.bulletinNumber])).rows[0].revision_id;
  await c.query(`INSERT INTO source_payload_archives(revision_id,ingestion_run_id,content_type,raw_payload) VALUES($1,$2,'application/json',$3)`,[revision,run,canonical]);
  await c.query(`INSERT INTO event_processing(revision_id,status,reason) VALUES($1,$2,$3)`,[revision,event.retracted?'RETRACTED':'PENDING',event.retracted?'Explicit source retraction':null]);
  if(!event.retracted)await evaluateRevision(c,String(revision));
  await audit(c,actor,`Stored ${event.externalId} revision ${revision}${event.retracted?' (retracted)':''}`,'EQINFO_RETRIEVED');
  return latest?'updated':'created';
 });
}
export async function pollSources(){
 if(config.INGESTION_ENABLED!=='true')return;
 const sources=(await query("SELECT * FROM earthquake_sources WHERE active AND source_code='EQINFO'")).rows;
 for(const source of sources){
  await query('INSERT INTO ingest_controls(source_id) VALUES($1) ON CONFLICT DO NOTHING',[source.source_id]);const lease=randomUUID();
  const claim=await query(`UPDATE ingest_controls SET lease_token=$2,lease_until=now()+interval '2 minutes',next_poll_at=now()+(GREATEST($3,60)*interval '1 second')
 WHERE source_id=$1 AND next_poll_at<=now() AND (lease_until IS NULL OR lease_until<now()) RETURNING source_id`,[source.source_id,lease,source.poll_interval_seconds||300]);
  if(!claim.rowCount)continue;
  const run=(await query("INSERT INTO ingestion_runs(source_id,started_at,run_status) VALUES($1,now(),'RUNNING') RETURNING ingestion_run_id",[source.source_id])).rows[0].ingestion_run_id;
  let received=0,created=0,updated=0;
  try{
   const url=new URL(source.endpoint_url);if(url.origin!=='https://earthquake.phivolcs.dost.gov.ph')throw new Error('EQInfo endpoint must use the approved PHIVOLCS origin');
   const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{'User-Agent':'AlertX/0.2 earthquake monitoring'}});
   if(!response.ok)throw new Error(`EQInfo HTTP ${response.status}`);
   const reader=response.body!.getReader();const parts:Uint8Array[]=[];let size=0;
   while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>5000000){await reader.cancel();throw new Error('Source response exceeded 5 MB');}parts.push(value);}
   const raw=Buffer.concat(parts);
   // Preserve the exact source page before parsing so records can be replayed and audited.
   await archiveSourceResponse({sourceId:String(source.source_id),ingestionRunId:String(run),sourceUrl:url.toString(),contentType:response.headers.get('content-type')||'text/html; charset=utf-8',body:raw});
   const {events,rejected}=parseEqInfo(raw.toString('utf8'));received=events.length+rejected.length;
   for(const bad of rejected)await query('INSERT INTO ingestion_quarantine(source_id,ingestion_run_id,raw_payload,reason) VALUES($1,$2,$3,$4)',[source.source_id,run,bad.raw,bad.reason]);
   let failures=rejected.length;
   for(const event of events){await query("UPDATE ingest_controls SET lease_until=now()+interval '2 minutes' WHERE source_id=$1 AND lease_token=$2",[source.source_id,lease]);try{const state=await ingestEvent(String(source.source_id),event,String(run));created+=Number(state==='created');updated+=Number(state==='updated');}
    catch(e){failures++;await query('INSERT INTO ingestion_quarantine(source_id,ingestion_run_id,raw_payload,reason) VALUES($1,$2,$3,$4)',[source.source_id,run,JSON.stringify(event),e instanceof Error?e.message:'Processing failed']);}}
   await query('UPDATE ingestion_runs SET completed_at=now(),run_status=$2,records_received=$3,records_created=$4,records_updated=$5 WHERE ingestion_run_id=$1',[run,failures?'PARTIAL':'COMPLETED',received,created,updated]);
  }catch(e){await query("UPDATE ingestion_runs SET completed_at=now(),run_status='FAILED',error_message=$2,records_received=$3,records_created=$4,records_updated=$5 WHERE ingestion_run_id=$1",[run,e instanceof Error?e.message:'Source failed',received,created,updated]);}
  finally{await query('UPDATE ingest_controls SET lease_token=NULL,lease_until=NULL WHERE source_id=$1 AND lease_token=$2',[source.source_id,lease]);}
 }
}
