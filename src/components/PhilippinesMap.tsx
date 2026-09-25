import React from 'react';
import {MapContainer,TileLayer,CircleMarker,GeoJSON,Popup,ScaleControl} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
export function PhilippinesMap({earthquakes,onSelectEarthquake,aors=[]}:{earthquakes:any[];onSelectEarthquake:(r:any)=>void;aors?:any[];selectedEarthquake?:any;selectedAorFilter?:any}){
 const tile=import.meta.env.VITE_TILE_URL as string|undefined;
 return <div className="rounded-xl border bg-white overflow-hidden"><div className="px-4 py-3 font-semibold">Station AORs and epicenters <span className="text-xs font-normal text-slate-500">• Approved boundaries from the database</span></div>
 {!tile&&<div className="px-4 py-2 text-xs bg-amber-50">Basemap unavailable. Geographic overlays and coordinates remain visible.</div>}
 <MapContainer center={[12.5,122]} zoom={5} style={{height:500,width:'100%',background:'#eaf1f8'}}>
 {tile&&<TileLayer url={tile} attribution={import.meta.env.VITE_TILE_ATTRIBUTION||'Map provider'}/>}
 <ScaleControl position="bottomleft"/>
 {aors.filter(a=>a.geometry&&a.validation_status==='VALID').map(a=><GeoJSON key={`${a.aor_id}-${a.version_number}`} data={a.geometry} style={{color:'#2563eb',weight:2,fillOpacity:.1}}><Popup>{a.aor_name}<br/>{a.station_name}<br/>Boundary version {a.version_number}</Popup></GeoJSON>)}
 {aors.map(a=><CircleMarker key={`station-${a.aor_id}`} center={[Number(a.latitude),Number(a.longitude)]} radius={5} pathOptions={{color:'#0f172a',fillOpacity:1}}><Popup>{a.station_name} ({a.station_code})</Popup></CircleMarker>)}
 {earthquakes.filter(r=>r.latitude!=null&&r.longitude!=null&&r.revision_status!=='RETRACTED').map(r=><CircleMarker key={r.earthquake_id||r.id} center={[Number(r.latitude),Number(r.longitude)]} radius={Math.max(4,Number(r.magnitude)*2)} pathOptions={{color:r.case_status==='OPEN'?'#d97706':r.classification_code==='INSIDE'?'#dc2626':'#64748b',fillOpacity:.6}} eventHandlers={{click:()=>onSelectEarthquake(r)}}><Popup><b>M {r.magnitude}</b><br/>{r.source_location_text}<br/>{r.classification_code||'Awaiting evaluation'}</Popup></CircleMarker>)}
 </MapContainer>{!aors.some(a=>a.geometry)&&<p className="p-3 text-sm text-slate-600">No approved station boundaries are available in your scope.</p>}</div>;
}
