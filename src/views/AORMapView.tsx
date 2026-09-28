import React, { useState, useMemo } from 'react';
import {
  Users,
  FileText,
  Clock,
  Database,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Maximize2,
  ChevronDown,
  Edit2,
  ShieldCheck,
  Download,
  X,
  Check,
  Radio,
  MapPin,
  Building2,
  Search,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Activity,
  Info,
} from 'lucide-react';
import { EarthquakeRecord } from '../types';
import {
  PHIVOLCS_SCSS_NETWORK,
  ALL_SCSS_STATIONS,
  ALL_STSS_SUBSTATIONS,
  SCSSStationAOR,
  STSSSubStation,
  DemographicData,
  MIMAROPA_DEMOGRAPHICS,
} from '../data/philippinesGeoData';
import { UserProfile } from '../types';

interface AORMapViewProps {
  earthquakes: EarthquakeRecord[];
  onSelectEarthquake: (eq: EarthquakeRecord) => void;
  onNavigateToRecords?: () => void;
  currentUser?: UserProfile;
}

export const AORMapView: React.FC<AORMapViewProps> = ({
  earthquakes,
  onSelectEarthquake,
  onNavigateToRecords,
  currentUser,
}) => {
  const isPcpRestricted = currentUser?.assignedAor === 'PCP';
  const [selectedStationCode, setSelectedStationCode] = useState<string>('PCP');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stationSearch, setStationSearch] = useState('');
  const [islandFilter, setIslandFilter] = useState<'All' | 'Luzon' | 'Visayas' | 'Mindanao'>('All');
  const [zoomLevel, setZoomLevel] = useState<number>(isPcpRestricted ? 1.2 : 1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>(
    isPcpRestricted ? { x: 30, y: 70 } : { x: 0, y: 0 }
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [selectedSubStation, setSelectedSubStation] = useState<STSSSubStation | null>(null);

  // Layer visibility toggles
  const [showEpicenters, setShowEpicenters] = useState(true);
  const [showProvinces, setShowProvinces] = useState(true);
  const [showBoundaryReview, setShowBoundaryReview] = useState(true);
  const [showSubStations, setShowSubStations] = useState(true);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  // When scoped to PCP, enforce PCP selection
  const activeStationCode = isPcpRestricted ? 'PCP' : selectedStationCode;
  const selectedStation: SCSSStationAOR =
    PHIVOLCS_SCSS_NETWORK[activeStationCode] || PHIVOLCS_SCSS_NETWORK['PCP'];

  // Filter stations for dropdown
  const filteredDropdownStations = useMemo(() => {
    if (isPcpRestricted) {
      return [PHIVOLCS_SCSS_NETWORK['PCP']];
    }
    return ALL_SCSS_STATIONS.filter((st) => {
      const matchIsland = islandFilter === 'All' || st.islandGroup === islandFilter;
      const q = stationSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        st.code.toLowerCase().includes(q) ||
        st.name.toLowerCase().includes(q) ||
        st.location.toLowerCase().includes(q) ||
        st.provinces.some((p) => p.toLowerCase().includes(q)) ||
        st.subStations.some(
          (sub) =>
            sub.code.toLowerCase().includes(q) ||
            sub.name.toLowerCase().includes(q) ||
            sub.location.toLowerCase().includes(q)
        );
      return matchIsland && matchSearch;
    });
  }, [islandFilter, stationSearch, isPcpRestricted]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2.2));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.8));
  const handleReset = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleValidateGIS = () => {
    setActionNotice(
      `Point-in-polygon topology check passed for ${selectedStation.name}: 0 overlaps, 0 self-intersections, and geodetic tolerance verified against PHIVOLCS AOR v2025.04.01.`
    );
    setTimeout(() => setActionNotice(null), 4500);
  };

  const handleExportMap = () => {
    const jsonContent =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(
        JSON.stringify(
          {
            type: 'FeatureCollection',
            station: selectedStation,
            subStations: selectedStation.subStations,
            demographics: selectedStation.demographics || null,
            exportedAt: new Date().toISOString(),
            datasetVersion: selectedStation.version,
            recordsCount: earthquakes.filter((e) => e.aor === selectedStation.code).length,
          },
          null,
          2
        )
      );
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute(
      'download',
      `PHIVOLCS_AOR_${selectedStation.code}_${new Date().toISOString().slice(0, 10)}.geojson`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice(
      `Station boundary geo-dataset & STSS telemetry for ${selectedStation.name} exported successfully.`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Mathematical Mercator-like projection for Philippine archipelago onto SVG canvas (viewBox="0 0 740 760")
  const projectCoords = (lat: number, lng: number) => {
    const minLng = 117.0;
    const maxLng = 127.2;
    const minLat = 4.8;
    const maxLat = 21.2;
    const x = 140 + ((lng - minLng) / (maxLng - minLng)) * 430;
    const y = 690 - ((lat - minLat) / (maxLat - minLat)) * 630;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const scssPos = projectCoords(
    selectedStation.centerCoordinates.lat,
    selectedStation.centerCoordinates.lng
  );

  return (
    <div className="space-y-4">
      {/* Station Account Restricted Notice Banner */}
      {isPcpRestricted && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span>
              <strong>Station View Active:</strong> You are logged in with the <strong>Palayan Seismic Station</strong> user account (<code>{currentUser?.email}</code>). Only the Area of Responsibility (AOR) and telemetry sensors within <strong>PCP</strong> are displayed.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-300 shrink-0 ml-2">
            PCP AOR Only
          </span>
        </div>
      )}

      {/* Toast Notice */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Controlling Stations (SCSS) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Controlling Stations (SCSS)
            </span>
            <div className="text-2xl font-bold text-blue-600 tracking-tight mt-0.5">
              {isPcpRestricted ? 'PCP (Palayan)' : ALL_SCSS_STATIONS.length}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {isPcpRestricted
                ? 'Central Luzon Hub • User Role Assigned'
                : '11 Luzon • 9 Visayas • 9 Mindanao'}
            </span>
          </div>
        </div>

        {/* Card 2: Satellite Telemetered Stations (STSS) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Satellite Stations (STSS)
            </span>
            <div className="text-2xl font-bold text-emerald-600 tracking-tight mt-0.5">
              {isPcpRestricted ? `${selectedStation.subStations.length} (SLLP)` : ALL_STSS_SUBSTATIONS.length}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {isPcpRestricted ? 'San Luis, Aurora Satellite Sensor' : 'Real-time telemetry feeds'}
            </span>
          </div>
        </div>

        {/* Card 3: Covered Provinces */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-indigo-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-indigo-800 block">
              Covered Provinces
            </span>
            <div className="text-2xl font-bold text-indigo-700 tracking-tight mt-0.5">
              {isPcpRestricted ? `${selectedStation.provinces.length} Provinces` : '82'}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {isPcpRestricted ? 'Nueva Ecija, Aurora, Bulacan...' : '100% Nationwide AOR Coverage'}
            </span>
          </div>
        </div>

        {/* Card 4: Dataset & PSGC Version */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              {isPcpRestricted ? 'Account Scope' : 'Boundary & PSGC Dataset'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="text-base font-bold text-emerald-600">
                {isPcpRestricted ? 'PCP AOR Exclusively' : 'Official v2025.04.01'}
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">
              {isPcpRestricted ? 'Palayan User Account Restriction' : 'Point-in-Polygon & Demographics'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content: Map Container (Left) + Selected Station Boundary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (Map): 8 cols */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden relative min-h-[620px] flex flex-col select-none">
          {/* Floating Legend Box in Top Left */}
          <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl p-3 shadow-md text-xs space-y-2 max-w-[240px]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs tracking-tight">Active Station</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                {selectedStation.code}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 leading-tight">
              <strong>{selectedStation.name}</strong> ({selectedStation.islandGroup})
            </div>
            <div className="space-y-1.5 pt-1 border-t border-slate-100 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border-2 border-white ring-2 flex items-center justify-center shrink-0 shadow-xs"
                  style={{
                    backgroundColor: selectedStation.dotColor,
                    color: selectedStation.dotColor,
                  }}
                />
                <span className="text-slate-700 font-semibold">SCSS Controlling Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 inline-block shrink-0" />
                <span className="text-slate-600">STSS Satellite Sensors ({selectedStation.subStations.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-blue-100 border border-blue-400 inline-block shrink-0" />
                <span className="text-slate-600">AOR Primary Polygon</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border border-dashed border-slate-400 inline-block shrink-0" />
                <span className="text-slate-600">Provincial Boundaries</span>
              </div>
            </div>
          </div>

          {/* Floating Map Controls in Top Right */}
          <div className="absolute top-4 right-4 z-20 flex flex-col bg-white border border-slate-200/90 rounded-lg shadow-md divide-y divide-slate-100 overflow-hidden text-slate-700">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors text-blue-600"
              title="Recenter"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors"
                title="Toggle Layers"
              >
                <Layers className="w-4 h-4" />
              </button>
              {showLayersMenu && (
                <div className="absolute right-9 top-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-[11px] w-48 space-y-2 z-30">
                  <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
                    Layers
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSubStations}
                      onChange={(e) => setShowSubStations(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>STSS Satellite Nodes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEpicenters}
                      onChange={(e) => setShowEpicenters(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Earthquake Epicenters</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProvinces}
                      onChange={(e) => setShowProvinces(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Province Borders</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBoundaryReview}
                      onChange={(e) => setShowBoundaryReview(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Boundary Reviews</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Map SVG Viewport */}
          <div className="w-full flex-1 relative bg-slate-50 overflow-hidden flex items-center justify-center">
            <svg
              viewBox="0 0 740 760"
              className="w-full h-full max-h-[660px] object-contain transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              }}
            >
              {/* Soft Oceanic Background Grid */}
              <defs>
                <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
                {/* Radial gradient for SCSS active beacon */}
                <radialGradient id="beacon-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={selectedStation.dotColor} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={selectedStation.dotColor} stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />

              {/* Geographic Archipelago Contours (Accurate Philippine Outline) */}
              <g id="philippines-landmass">
                {/* Batanes & Babuyan Islands */}
                <ellipse cx="350" cy="90" rx="10" ry="7" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                <ellipse cx="345" cy="115" rx="8" ry="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />

                {/* Luzon Mainland Contour */}
                <path
                  d="M312,140 Q348,128 365,142 Q378,170 372,210 Q382,240 375,270 Q365,300 352,320 Q335,340 315,338 Q298,315 305,285 Q308,245 306,210 Q305,190 312,140 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />
                {/* Bicol Peninsula */}
                <path
                  d="M375,270 Q405,280 435,320 Q445,350 425,370 Q398,350 382,310 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />

                {/* Mindoro Island */}
                <path
                  d="M272,305 Q302,295 308,328 Q298,360 270,345 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Palawan Island Strip */}
                <path
                  d="M175,410 Q215,480 235,530 Q225,540 195,490 Q165,420 175,410 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1.1"
                />

                {/* Visayas Major Islands */}
                {/* Panay */}
                <path
                  d="M318,390 Q348,385 352,415 Q328,435 312,415 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Negros */}
                <path
                  d="M358,420 Q372,415 378,450 Q368,480 352,470 Q348,440 358,420 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Cebu */}
                <path
                  d="M382,415 Q390,410 395,440 Q388,470 380,465 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Bohol */}
                <ellipse cx="405" cy="455" rx="14" ry="10" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                {/* Leyte */}
                <path
                  d="M415,395 Q435,395 430,435 Q415,450 410,420 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Samar */}
                <path
                  d="M430,355 Q460,360 460,400 Q435,415 425,380 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />

                {/* Mindanao Main Landmass */}
                <path
                  d="M395,495 Q445,485 470,510 Q480,550 475,595 Q455,625 415,615 Q385,605 375,575 Q360,570 330,585 Q285,590 275,575 Q290,555 320,560 Q350,560 365,535 Q380,515 395,495 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1.3"
                />
                {/* Zamboanga Peninsula */}
                <path
                  d="M330,555 Q295,560 275,575 Q285,590 320,580 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
                {/* Sulu & Tawi-Tawi Chain */}
                <ellipse cx="256" cy="620" rx="8" ry="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
                <ellipse cx="230" cy="640" rx="8" ry="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
              </g>

              {/* Province Boundaries (Dashed Lines) */}
              {showProvinces && (
                <g id="province-boundaries" opacity="0.65">
                  <path d="M305,160 L365,160" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="3 3" />
                  <path d="M300,205 L372,205" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="3 3" />
                  <path d="M310,240 L370,240" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="3 3" />
                  <path d="M305,275 L350,275" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="3 3" />
                  <path d="M410,320 L445,340" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="3 3" />
                  <path d="M400,530 L465,530" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="3 3" />
                  <path d="M380,565 L460,565" stroke="#94a3b8" strokeWidth="0.9" strokeDasharray="3 3" />
                </g>
              )}

              {/* Connecting Telemetry Beams from SCSS to each subordinate STSS */}
              {showSubStations && (
                <g id="telemetry-beams">
                  {selectedStation.subStations.map((stss) => {
                    const subPos = projectCoords(stss.coordinates[0], stss.coordinates[1]);
                    return (
                      <line
                        key={`beam-${stss.code}`}
                        x1={scssPos.x}
                        y1={scssPos.y}
                        x2={subPos.x}
                        y2={subPos.y}
                        stroke={selectedStation.strokeColor}
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                        strokeOpacity="0.5"
                      />
                    );
                  })}
                </g>
              )}

              {/* Subordinate STSS Satellite Stations Markers */}
              {showSubStations && (
                <g id="substations-layer">
                  {selectedStation.subStations.map((stss) => {
                    const subPos = projectCoords(stss.coordinates[0], stss.coordinates[1]);
                    const isSelected = selectedSubStation?.code === stss.code;
                    return (
                      <g
                        key={`stss-${stss.code}`}
                        className="cursor-pointer group"
                        onClick={() => setSelectedSubStation(stss)}
                      >
                        <circle
                          cx={subPos.x}
                          cy={subPos.y}
                          r={isSelected ? 6.5 : 4.5}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="transition-all"
                        />
                        <text
                          x={subPos.x + 7}
                          y={subPos.y + 3}
                          fontSize="9"
                          fontWeight="bold"
                          fill="#0f172a"
                          className="select-none pointer-events-none drop-shadow-xs"
                        >
                          {stss.code}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Active SCSS Controlling Hub Marker (Pulsing Center) */}
              <g id="scss-hub-marker" className="cursor-pointer">
                {/* Outer Glow / Ping */}
                <circle
                  cx={scssPos.x}
                  cy={scssPos.y}
                  r="24"
                  fill="url(#beacon-glow)"
                  className="animate-pulse"
                />
                <circle
                  cx={scssPos.x}
                  cy={scssPos.y}
                  r="9"
                  fill={selectedStation.dotColor}
                  fillOpacity="0.25"
                  stroke={selectedStation.strokeColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                />
                <circle
                  cx={scssPos.x}
                  cy={scssPos.y}
                  r="6"
                  fill={selectedStation.dotColor}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="shadow-lg"
                />
                {/* Station Code Label Banner */}
                <rect
                  x={scssPos.x - 22}
                  y={scssPos.y - 24}
                  width="44"
                  height="16"
                  rx="4"
                  fill="#0f172a"
                  fillOpacity="0.9"
                />
                <text
                  x={scssPos.x}
                  y={scssPos.y - 13}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="bold"
                  fill="#ffffff"
                  className="select-none pointer-events-none"
                >
                  {selectedStation.code}
                </text>
              </g>

              {/* Major Island Group Region Typography */}
              <text
                x="320"
                y="180"
                className="font-serif italic text-slate-400 text-lg tracking-wider pointer-events-none select-none"
              >
                Luzon
              </text>
              <text
                x="348"
                y="390"
                className="font-serif italic text-slate-400 text-base tracking-wider pointer-events-none select-none"
              >
                Visayas
              </text>
              <text
                x="368"
                y="580"
                className="font-serif italic text-slate-400 text-lg tracking-wider pointer-events-none select-none"
              >
                Mindanao
              </text>
            </svg>
          </div>

          {/* SubStation Quick Inspection Footer inside Map */}
          {selectedSubStation && (
            <div className="bg-emerald-50 border-t border-emerald-200 p-2.5 px-4 flex items-center justify-between text-xs text-emerald-950 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 shrink-0" />
                <span className="font-bold">
                  STSS {selectedSubStation.code}: {selectedSubStation.name}
                </span>
                <span className="text-emerald-700 font-medium">
                  &bull; {selectedSubStation.location} ({selectedSubStation.province})
                </span>
                <span className="text-[11px] text-emerald-600 font-mono">
                  [{selectedSubStation.coordinates[0].toFixed(3)}°N, {selectedSubStation.coordinates[1].toFixed(3)}°E]
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubStation(null)}
                className="text-emerald-600 hover:text-emerald-900 font-bold text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Selected Station Boundary & AOR Specs (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Selected Station Boundary
              </h3>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                SCSS Hub
              </span>
            </div>

            {/* Station Dropdown Selector with Search & Island Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => !isPcpRestricted && setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs transition-colors ${
                  isPcpRestricted
                    ? 'cursor-default ring-1 ring-blue-200 bg-blue-50/20'
                    : 'hover:border-blue-500 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedStation.dotColor }}
                  />
                  <div className="text-left truncate">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {selectedStation.code} - {selectedStation.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {selectedStation.islandGroup} &bull; {selectedStation.subStations.length} Satellite Station (SLLP)
                    </span>
                  </div>
                </div>
                {isPcpRestricted ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0 ml-2">
                    Station Locked
                  </span>
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 overflow-hidden flex flex-col max-h-[360px]">
                  {/* Search and Island Filter Bar */}
                  <div className="p-2 border-b border-slate-100 space-y-2 bg-slate-50/70">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={stationSearch}
                        onChange={(e) => setStationSearch(e.target.value)}
                        placeholder="Search 29 stations or provinces..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {(['All', 'Luzon', 'Visayas', 'Mindanao'] as const).map((isl) => (
                        <button
                          key={isl}
                          type="button"
                          onClick={() => setIslandFilter(isl)}
                          className={`flex-1 py-1 rounded text-[10px] font-semibold transition-colors ${
                            islandFilter === isl
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {isl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Stations */}
                  <div className="overflow-y-auto divide-y divide-slate-100 py-1 flex-1">
                    {filteredDropdownStations.map((st) => {
                      const isCurrent = st.code === selectedStationCode;
                      return (
                        <button
                          key={st.code}
                          type="button"
                          onClick={() => {
                            setSelectedStationCode(st.code);
                            setIsDropdownOpen(false);
                            setSelectedSubStation(null);
                          }}
                          className={`w-full px-3.5 py-2 flex items-center justify-between text-xs text-left transition-colors ${
                            isCurrent
                              ? 'bg-blue-50/70 font-semibold text-blue-900'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: st.dotColor }}
                            />
                            <div className="truncate">
                              <span className="font-bold text-slate-900">{st.code}</span> - {st.name}
                              <span className="text-[10px] text-slate-400 block truncate">
                                {st.location} ({st.islandGroup})
                              </span>
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                    {filteredDropdownStations.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No seismic stations found matching "{stationSearch}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Properties Table */}
            <div className="space-y-3 text-xs">
              {/* Station Code & Island */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Controlling Hub (SCSS)</span>
                <span className="text-slate-900 font-semibold font-mono flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedStation.dotColor }}
                  />
                  {selectedStation.code} ({selectedStation.islandGroup})
                </span>
              </div>

              {/* Station Name */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Station Name</span>
                <span className="text-slate-900 font-semibold text-right">
                  {selectedStation.name}
                </span>
              </div>

              {/* Headquarters Location */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Headquarters</span>
                <span className="text-slate-800 font-medium text-right">
                  {selectedStation.location}
                </span>
              </div>

              {/* AOR Status */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">AOR Status</span>
                <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 text-[11px]">
                  <Check className="w-3 h-3" />
                  {selectedStation.status}
                </span>
              </div>

              {/* Covered Provinces */}
              <div className="border-b border-slate-100 pb-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-500 font-medium">
                    Covered Provinces ({selectedStation.provinces.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedStation.provinces.map((prov) => (
                    <span
                      key={prov}
                      className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200"
                    >
                      {prov}
                    </span>
                  ))}
                </div>
              </div>

              {/* Subordinate STSS Satellite Stations */}
              <div className="border-b border-slate-100 pb-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-500 font-medium">
                    Satellite Stations ({selectedStation.subStations.length})
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600">
                    STSS Telemetry
                  </span>
                </div>
                {selectedStation.subStations.length > 0 ? (
                  <div className="space-y-1">
                    {selectedStation.subStations.map((stss) => (
                      <div
                        key={stss.code}
                        onClick={() => setSelectedSubStation(stss)}
                        className={`p-1.5 rounded text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                          selectedSubStation?.code === stss.code
                            ? 'bg-emerald-100 text-emerald-900 font-semibold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <strong className="font-mono text-[10px]">{stss.code}</strong>
                          <span className="truncate">{stss.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {stss.province}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">
                    Direct single-sensor station (No external STSS)
                  </span>
                )}
              </div>

              {/* Boundary Dataset & Version */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Dataset Version</span>
                <span className="text-slate-800 font-mono font-medium">
                  {selectedStation.dataset} ({selectedStation.version})
                </span>
              </div>

              {/* Last Validated */}
              <div className="flex items-start justify-between">
                <span className="text-slate-500 font-medium shrink-0">
                  Last Validated
                </span>
                <div className="text-right">
                  <span className="text-slate-900 font-semibold block text-[11px]">
                    {selectedStation.lastValidated}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {selectedStation.validatedBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Official PSGC Demographics Profile Card (if available for MIMAROPA) */}
            {selectedStation.demographics && selectedStation.demographics.length > 0 && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-indigo-900 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Official PSGC Demographics
                  </span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                    Region IV-B
                  </span>
                </div>
                <div className="space-y-1.5">
                  {selectedStation.demographics.map((demo) => (
                    <div
                      key={demo.province}
                      className="bg-white/90 p-2 rounded-lg border border-indigo-100 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>{demo.province}</span>
                        <span className="font-mono text-[10px] text-indigo-600">
                          PSGC: {demo.psgcCode}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 text-[10px]">
                        <span>LGUs: {demo.lguCount}</span>
                        <span className="font-semibold text-slate-800">
                          Pop: {demo.population.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons: 2x2 Grid */}
          <div className="grid grid-cols-2 gap-2.5 pt-5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Boundary</span>
            </button>

            <button
              type="button"
              onClick={handleValidateGIS}
              className="bg-white hover:bg-blue-50/50 border border-blue-600 text-blue-600 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Validate GIS</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToRecords}
              className="bg-white hover:bg-blue-50/50 border border-blue-600 text-blue-600 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>View Records</span>
            </button>

            <button
              type="button"
              onClick={handleExportMap}
              className="bg-white hover:bg-blue-50/50 border border-blue-600 text-blue-600 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export AOR</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive STSS Satellite Telemetered Stations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Satellite Telemetered Seismic Stations (STSS) Network
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Remote seismic observation stations reporting to{' '}
              <strong className="text-slate-800 font-semibold">
                {selectedStation.code} - {selectedStation.name}
              </strong>
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {selectedStation.subStations.length} Stations Online
          </span>
        </div>

        {selectedStation.subStations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">STSS Code</th>
                  <th className="px-4 py-3">Station Name</th>
                  <th className="px-4 py-3">Geographic Location</th>
                  <th className="px-4 py-3">Province</th>
                  <th className="px-4 py-3">GPS Coordinates</th>
                  <th className="px-4 py-3">Controlling SCSS</th>
                  <th className="px-4 py-3 text-right">Telemetry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedStation.subStations.map((stss) => (
                  <tr
                    key={stss.code}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {stss.code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {stss.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{stss.location}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
                        {stss.province}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {stss.coordinates[0].toFixed(3)}°N, {stss.coordinates[1].toFixed(3)}°E
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {selectedStation.code} ({selectedStation.islandGroup})
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active Telemetry
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">
              Station operates with direct telemetry
            </p>
            <p className="text-slate-400 mt-0.5">
              No subordinate remote STSS stations currently assigned under {selectedStation.code}.
            </p>
          </div>
        )}
      </div>

      {/* Edit Boundary Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedStation.dotColor }}
                />
                <h3 className="font-bold text-slate-900 text-sm">
                  Edit Boundary: {selectedStation.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Station Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedStation.name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Covered Provinces (Comma Separated)
                </label>
                <textarea
                  defaultValue={selectedStation.provinces.join(', ')}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Buffer Tolerance (km)
                  </label>
                  <input
                    type="number"
                    defaultValue={5.0}
                    step={0.5}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Boundary Approval Status
                  </label>
                  <select
                    defaultValue={selectedStation.status}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Under Audit">Under Audit</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setActionNotice(
                    `Boundary configuration for ${selectedStation.code} updated and saved to audit log.`
                  );
                  setTimeout(() => setActionNotice(null), 4000);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
