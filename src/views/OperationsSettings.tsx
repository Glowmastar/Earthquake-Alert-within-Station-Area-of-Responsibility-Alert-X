import React from 'react';
import {api} from '../services/api';
import {Form,Table,Notice,useRemote} from '../components/OperationalUI';
const options=(rows:any[],id:string,label:string)=>rows.map(r=>({value:String(r[id]),label:r[label]}));
const numberOrNull=(v:any)=>v==null||v===''?null:Number(v);
export function OperationsSettings({refresh,onSaved}:{refresh:number;onSaved:()=>void}){
 const state=useRemote('/admin/overview',refresh);const d=state.data;
 if(!d)return <Notice {...state}/>;
 const aors=options(d.aors,'aor_id','aor_name'),stations=options(d.stations,'station_id','station_name');
 const save=async(path:string,b:any)=>{await api.post(path,b);onSaved();};
 return <div className="space-y-5"><Notice {...state}/>
 <div className="notice">Activate only approved station boundaries and rules. Live retrieval and email sending also require the deployment settings to be enabled.</div>
 <div className="grid lg:grid-cols-2 gap-5">
 {d.sources.map((s:any)=><Form key={`source-${s.source_id}`} title={`${s.source_name} source`} initial={{active:s.active,endpointUrl:s.endpoint_url,pollIntervalSeconds:s.poll_interval_seconds||300}} submit="Save source settings" fields={[{key:'endpointUrl',label:'Official source URL',type:'url'},{key:'pollIntervalSeconds',label:'Poll interval (seconds)',type:'number',min:60},{key:'active',label:'Enable scheduled retrieval',type:'checkbox'}]} onSubmit={v=>save(`/admin/sources/${s.source_id}`,{...v,pollIntervalSeconds:Number(v.pollIntervalSeconds)})}/>)}
 <Form title="Import approved station boundary" submit="Import and activate boundary" fields={[{key:'stationCode',label:'Official station code'},{key:'stationName',label:'Station name'},{key:'latitude',label:'Station latitude',type:'number',min:-90,max:90},{key:'longitude',label:'Station longitude',type:'number',min:-180,max:180},{key:'aorCode',label:'AOR code'},{key:'aorName',label:'AOR name'},{key:'datasetName',label:'Boundary dataset name'},{key:'source',label:'Source / approval reference'},{key:'geometry',label:'GeoJSON Polygon or MultiPolygon file',type:'file'},{key:'approved',label:'I confirm this boundary is approved for operational use',type:'checkbox'}]} onSubmit={v=>save('/admin/aors/import',{...v,latitude:Number(v.latitude),longitude:Number(v.longitude)})}/>
 <Form title="Approved land boundary" submit="Activate land boundary" fields={[{key:'source',label:'Source / approval reference'},{key:'geometry',label:'Land GeoJSON Polygon or MultiPolygon file',type:'file'},{key:'approved',label:'I confirm this dataset is approved for land/offshore checks',type:'checkbox'}]} onSubmit={v=>save('/admin/land-mask',v)}/>
 <Form title="Activate AOR rules" initial={{sendInsideAorAlert:true,feltEventRequired:false,boundaryToleranceKm:0,offshoreAction:'REVIEW',boundaryAction:'REVIEW',overlapAction:'REVIEW',correctedEventAction:'REVIEW'}} submit="Activate new rule version" fields={[{key:'aorId',label:'AOR',type:'select',options:aors},{key:'minimumMagnitude',label:'Minimum magnitude (blank = none)',type:'number',required:false,min:0,max:9.9},{key:'maximumDepthKm',label:'Maximum depth, km (blank = none)',type:'number',required:false,min:0},{key:'stationDistanceKm',label:'Maximum station distance, km (blank = none)',type:'number',required:false,min:0},{key:'boundaryToleranceKm',label:'Boundary review tolerance, km',type:'number',min:0,max:100},{key:'sendInsideAorAlert',label:'Enable alerts for eligible events inside the AOR',type:'checkbox'},{key:'feltEventRequired',label:'Require a verified felt report',type:'checkbox'},...(['offshore','boundary','overlap','correctedEvent'] as const).map(x=>({key:`${x}Action`,label:`${x==='correctedEvent'?'Corrected event':x} action`,type:'select',options:[{value:'REVIEW',label:'Hold for review'},{value:'SUPPRESS',label:'Suppress notification'}]}))]} onSubmit={v=>save('/admin/rules',{...v,minimumMagnitude:numberOrNull(v.minimumMagnitude),maximumDepthKm:numberOrNull(v.maximumDepthKm),stationDistanceKm:numberOrNull(v.stationDistanceKm),boundaryToleranceKm:Number(v.boundaryToleranceKm)})}/>
 <Form title="Add user" submit="Create user" fields={[{key:'name',label:'Full name'},{key:'email',label:'Email',type:'email'},{key:'password',label:'Initial password (14–72 characters)',type:'password'},{key:'role',label:'Role',type:'select',options:options(d.roles,'role_code','role_name')},{key:'stationId',label:'Station access (required for station users)',type:'select',required:false,options:stations}]} onSubmit={v=>save('/admin/users',{name:v.name,email:v.email,password:v.password,roles:[v.role],stationIds:v.stationId?[v.stationId]:[]})}/>
 <Form title="Update user access" submit="Save and revoke existing sessions" fields={[{key:'userId',label:'User',type:'select',options:options(d.users,'user_id','email')},{key:'status',label:'Account status',type:'select',options:['ACTIVE','INACTIVE','LOCKED','SUSPENDED'].map(x=>({value:x,label:x}))},{key:'role',label:'Role',type:'select',options:options(d.roles,'role_code','role_name')},{key:'stationId',label:'Station',type:'select',required:false,options:stations}]} onSubmit={async v=>{await api.patch(`/admin/users/${v.userId}`,{status:v.status,roles:[v.role],stationIds:v.stationId?[v.stationId]:[]});onSaved();}}/>
 <Form title="Reset password" submit="Reset password and revoke sessions" fields={[{key:'userId',label:'User',type:'select',options:options(d.users,'user_id','email')},{key:'password',label:'New password (14–72 characters)',type:'password'}]} onSubmit={v=>save(`/admin/users/${v.userId}/reset-password`,{password:v.password})}/>
 <Form title="Link organizational sign-in" submit="Link approved identity" fields={[{key:'userId',label:'Alert X user',type:'select',options:options(d.users,'user_id','email')},{key:'issuer',label:'Identity provider issuer URL',type:'url'},{key:'subject',label:'Verified identity subject identifier'}]} onSubmit={v=>save('/admin/oidc-identities',v)}/>
 <Form title="Add administrative area" submit="Add area" fields={[{key:'psgcCode',label:'Official PSGC code'},{key:'name',label:'Area name'},{key:'type',label:'Area type',type:'select',options:['REGION','PROVINCE','CITY','MUNICIPALITY','BARANGAY'].map(x=>({value:x,label:x}))},{key:'parentId',label:'Parent area ID (optional)',type:'number',required:false}]} onSubmit={v=>save('/admin/areas',{...v,parentId:v.parentId||null})}/>
 <Form title="Add intensity reporting source" submit="Add reporting source" fields={[{key:'name',label:'Source name'},{key:'type',label:'Reporter type',type:'select',options:['DRRMO','POLICE_BFP','DEPED','BARANGAY','CITIZEN','OTHER'].map(x=>({value:x,label:x}))}]} onSubmit={v=>save('/admin/reporting-sources',v)}/>
 <Form title="Import verified event records" submit="Import records" fields={[{key:'sourceId',label:'Source',type:'select',options:options(d.sources,'source_id','source_name')},{key:'events',label:'Normalized event JSON array',type:'file'}]} onSubmit={v=>save('/admin/ingest',v)}/>
 </div>
 <h3 className="font-semibold">Current rule assignments</h3><Table rows={d.rules} columns={[["aor_code","AOR"],["version_number","Version"],["minimum_magnitude","Minimum magnitude"],["boundary_tolerance_km","Boundary tolerance (km)"],["offshore_action","Offshore action"]]}/>
 <h3 className="font-semibold">Source retrieval history</h3><Table rows={d.ingestionRuns} columns={[["started_at","Started"],["run_status","Status"],["records_received","Received"],["records_created","Created"],["records_updated","Revised"],["error_message","Error"]]}/>
 <h3 className="font-semibold">Quarantined source records</h3><Table rows={d.quarantine} columns={[["received_at","Received"],["reason","Reason"]]}/>
 </div>;
}
export function DataQualityReview({refresh,onSaved}:{refresh:number;onSaved:()=>void}){
 const state=useRemote('/admin/data-quality',refresh);const d=state.data;
 const overview=useRemote('/admin/overview',refresh);
 if(!d)return <Notice {...state}/>;
 const summary=d.summary||{};
 const assignmentOptions=(d.assignments||[]).map((r:any)=>({value:String(r.assignment_id),label:`${r.station_code} — ${r.raw_area_name} [${r.approval_status}]`}));
 const save=async(path:string,b:any)=>{await api.patch(path,b);onSaved();};
 return <div className="space-y-5">
  <Notice {...state}/><Notice {...overview}/>
  <div className="notice">Workbook province assignments are staged as drafts. They do not classify earthquakes or route alerts until an administrator links an authoritative province PSGC record and an approved operational AOR.</div>
  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
   {[[`SCSS / STSS`,`${summary.scss_count||0} / ${summary.stss_count||0}`],['Draft assignments',summary.draft_assignments],['Open issues',summary.open_issues],['Blocking issues',summary.blocking_issues]].map(([label,value])=><div className="panel" key={String(label)}><p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-bold mt-2">{value??'—'}</p></div>)}
  </div>
  <h3 className="font-semibold">Imported station hierarchy</h3>
  <Table rows={d.stations||[]} columns={[['station_code','Code'],['station_name','Station'],['station_type','Type'],['parent_station_code','Parent SCSS'],['cluster_name','Cluster'],['raw_location_text','Source location'],['validation_status','Validation']]}/>
  <h3 className="font-semibold">Draft administrative AOR assignments</h3>
  <Table rows={d.assignments||[]} columns={[['assignment_id','ID'],['station_code','SCSS'],['raw_area_name','Source province'],['standardized_area_name','Reviewed province'],['psgc_code','PSGC'],['aor_code','Operational AOR'],['approval_status','Status'],['review_notes','Review notes']]}/>
  <div className="grid lg:grid-cols-2 gap-5">
   <Form title="Review workbook AOR assignment" submit="Save assignment review" fields={[
    {key:'assignmentId',label:'Draft assignment',type:'select',options:assignmentOptions},
    {key:'standardizedAreaName',label:'Reviewed province name'},
    {key:'status',label:'Review status',type:'select',options:['DRAFT','IN_REVIEW','APPROVED','REJECTED'].map(x=>({value:x,label:x}))},
    {key:'psgcCode',label:'Authoritative province PSGC code (required for approval)',required:false},
    {key:'aorId',label:'Approved operational AOR (required for approval)',type:'select',required:false,options:options(overview.data?.aors||[],'aor_id','aor_name')},
    {key:'notes',label:'Review evidence and decision',type:'textarea'}
   ]} onSubmit={v=>save(`/admin/aor-assignments/${v.assignmentId}`,{status:v.status,standardizedAreaName:v.standardizedAreaName,psgcCode:v.psgcCode||'',aorId:v.aorId||'',notes:v.notes})}/>
   <Form title="Resolve validation issue" submit="Save issue resolution" fields={[
    {key:'issueId',label:'Validation issue',type:'select',options:(d.issues||[]).map((r:any)=>({value:String(r.validation_issue_id),label:`${r.severity}: ${r.entity_reference} — ${r.issue_code}`}))},
    {key:'status',label:'Issue status',type:'select',options:['OPEN','RESOLVED','WONT_FIX'].map(x=>({value:x,label:x}))},
    {key:'notes',label:'Resolution evidence and notes',type:'textarea'}
   ]} onSubmit={v=>save(`/admin/validation-issues/${v.issueId}`,{status:v.status,notes:v.notes})}/>
  </div>
  <h3 className="font-semibold">Validation issues</h3>
  <Table rows={d.issues||[]} columns={[['validation_issue_id','ID'],['severity','Severity'],['entity_type','Entity'],['entity_reference','Reference'],['issue_code','Issue'],['issue_description','Description'],['issue_status','Status'],['resolution_notes','Resolution']]}/>
 </div>;
}
export function AddRecipient({refresh,onSaved}:{refresh:number;onSaved:()=>void}){const state=useRemote('/stations/overview',refresh);if(!state.data)return <Notice {...state}/>;const d=state.data;return <Form title="Add recipient" submit="Save recipient with verification pending" fields={[{key:'name',label:'Full name'},{key:'email',label:'Email address',type:'email'},{key:'stationId',label:'Station',type:'select',options:options(d.stations,'station_id','station_name')},{key:'aorId',label:'AOR',type:'select',options:d.aors.map((a:any)=>({value:String(a.aor_id),label:`${d.stations.find((station:any)=>String(station.station_id)===String(a.station_id))?.station_name||'Station'} — ${a.aor_name}`}))},{key:'minimumMagnitude',label:'Minimum magnitude (optional)',type:'number',required:false,min:0,max:9.9}]} onSubmit={async v=>{await api.post('/stations/contacts',{name:v.name,email:v.email,stationId:v.stationId,aorIds:[v.aorId],minimumMagnitude:numberOrNull(v.minimumMagnitude)});onSaved();}}/>;}
