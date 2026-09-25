import React,{useState} from 'react';
import {api} from '../services/api';
import {Form,Notice,Table,useRemote} from '../components/OperationalUI';
const options=(rows:any[],key:string,label:string)=>rows.map(r=>({value:String(r[key]),label:String(r[label])}));
const numberOrNull=(v:any)=>v==null||v===''?null:Number(v);

export function StationRules({refresh,onSaved}:{refresh:number;onSaved:()=>void}){
 const state=useRemote('/stations/overview',refresh),d=state.data;
 if(!d)return <Notice {...state}/>;
 return <div className="space-y-5"><Notice {...state}/>
 <div className="notice">Changing an AOR rule affects future earthquake classification and notifications. Use only an approved rule; record the approval reference and confirm your password.</div>
 <h2 className="font-semibold">Active rules for your stations</h2>
 <Table rows={d.rules} columns={[["aor_code","AOR"],["version_number","Version"],["minimum_magnitude","Minimum magnitude"],["boundary_tolerance_km","Boundary tolerance (km)"],["offshore_action","Offshore action"]]}/>
 {d.aors.length>0&&<Form title="Activate approved station AOR rule" submit="Confirm and activate new version" initial={{sendInsideAorAlert:true,feltEventRequired:false,boundaryToleranceKm:0,offshoreAction:'REVIEW',boundaryAction:'REVIEW',overlapAction:'REVIEW',correctedEventAction:'REVIEW'}} fields={[
  {key:'aorId',label:'Assigned AOR',type:'select',options:options(d.aors,'aor_id','aor_name')},
  {key:'minimumMagnitude',label:'Minimum magnitude (blank = none)',type:'number',required:false,min:0,max:9.9},
  {key:'maximumDepthKm',label:'Maximum depth, km (blank = none)',type:'number',required:false,min:0},
  {key:'stationDistanceKm',label:'Maximum station distance, km (blank = none)',type:'number',required:false,min:0},
  {key:'boundaryToleranceKm',label:'Boundary review tolerance, km',type:'number',min:0,max:100},
  {key:'sendInsideAorAlert',label:'Enable alerts inside this AOR',type:'checkbox'},
  {key:'feltEventRequired',label:'Require a verified felt report',type:'checkbox'},
  ...(['offshore','boundary','overlap','correctedEvent'] as const).map(x=>({key:`${x}Action`,label:`${x==='correctedEvent'?'Corrected event':x} action`,type:'select',options:[{value:'REVIEW',label:'Hold for review'},{value:'SUPPRESS',label:'Suppress notification'}]})),
  {key:'reason',label:'Approved change reason / reference (at least 10 characters)',type:'textarea'},
  {key:'password',label:'Confirm your password',type:'password'}
 ]} onSubmit={async v=>{await api.post('/stations/rules',{...v,minimumMagnitude:numberOrNull(v.minimumMagnitude),maximumDepthKm:numberOrNull(v.maximumDepthKm),stationDistanceKm:numberOrNull(v.stationDistanceKm),boundaryToleranceKm:Number(v.boundaryToleranceKm)});onSaved();}}/>}
 <p className="text-sm text-slate-500">Boundary imports, global EQInfo and land datasets, account access, held alert release and delivery reconciliation remain administrator controlled.</p>
 </div>;
}

export function StationActivity({refresh}:{refresh:number}){
 const overview=useRemote('/stations/overview',refresh);
 const [stationId,setStationId]=useState('');
 const selected=stationId||String(overview.data?.stations?.[0]?.station_id||'');
 const activity=useRemote(selected?`/stations/activity?stationId=${selected}`:null,refresh);
 return <div className="space-y-4"><Notice {...overview}/><div className="panel"><label className="block font-semibold mb-2" htmlFor="activity-station">Station</label>
 <select id="activity-station" value={selected} onChange={e=>setStationId(e.target.value)}>
 {(overview.data?.stations||[]).map((s:any)=><option key={s.station_id} value={String(s.station_id)}>{s.station_name}</option>)}</select></div>
 {selected?<><Notice {...activity}/><Table rows={activity.data?.records||[]} columns={[["occurred_at","Time"],["event_type_name","Event"],["actor_name","Actor"],["description","Description"]]}/></>:<div className="notice">No station is assigned to your account.</div>}
 <p className="text-xs text-slate-500">This view includes actions recorded with a station. Older audit entries without station context remain in the administrator log.</p>
 </div>;
}
