import React, { useState, useMemo } from 'react';
import {
  Globe,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Play,
  Save,
  Send,
  RotateCcw,
  Download,
  ExternalLink,
  Edit2,
  Info,
  X,
  Shield,
  FileText,
  Clock,
  MapPin,
  Settings,
  Check,
  ChevronDown,
  Search,
} from 'lucide-react';
import { ALL_SCSS_STATIONS } from '../data/philippinesGeoData';
import { UserProfile } from '../types';

export interface StationAssignment {
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
  coveredAreas: string;
  ruleAssignment: string;
  islandGroup?: 'Luzon' | 'Visayas' | 'Mindanao';
  satelliteCount?: number;
}

const INITIAL_STATIONS: StationAssignment[] = ALL_SCSS_STATIONS.map((scss) => ({
  code: scss.code,
  name: scss.name.replace(' Seismic Station', ''),
  status: 'Active',
  coveredAreas: scss.provinces.join(', '),
  ruleAssignment: 'Standard Rules',
  islandGroup: scss.islandGroup,
  satelliteCount: scss.subStations.length,
}));

interface VersionRecord {
  version: string;
  date: string;
  author: string;
  role: string;
  summary: string;
  status: 'Current' | 'Archived';
}

const VERSION_HISTORY: VersionRecord[] = [
  {
    version: '1.3.0',
    date: 'Apr 20, 2025 02:15 PM',
    author: 'Juan Dela Cruz',
    role: 'System Administrator',
    summary: 'Updated boundary tolerance to 10 km and enabled point-in-polygon coordinate validation.',
    status: 'Current',
  },
  {
    version: '1.2.1',
    date: 'Mar 15, 2025 09:40 AM',
    author: 'Maria Santos',
    role: 'Seismic Data Specialist',
    summary: 'Refined Bislig AOR covered areas to explicitly isolate coastal border municipalities.',
    status: 'Archived',
  },
  {
    version: '1.2.0',
    date: 'Jan 10, 2025 11:30 AM',
    author: 'Juan Dela Cruz',
    role: 'System Administrator',
    summary: 'Initial 2025 release incorporating PSGC 2024.12.15 geospatial dataset.',
    status: 'Archived',
  },
];

interface AORRulesViewProps {
  currentUser?: UserProfile;
}

export const AORRulesView: React.FC<AORRulesViewProps> = ({ currentUser }) => {
  const isPcpRestricted = currentUser?.assignedAor === 'PCP';
  // Banner visibility
  const [bannerVisible, setBannerVisible] = useState(true);

  // KPI States
  const [ruleStatus, setRuleStatus] = useState<'Active' | 'Draft'>('Active');
  const [pendingChangesCount, setPendingChangesCount] = useState(0);

  // Geographic Classification Rules
  const [aorBasis, setAorBasis] = useState('Explicit municipalities and cities');
  const [finalLocationMethod, setFinalLocationMethod] = useState('Coordinate-based point-in-polygon');
  const [provinceWideCoverage, setProvinceWideCoverage] = useState(false);
  const [boundaryDataset, setBoundaryDataset] = useState('PHIVOLCS AOR / PSGC');
  const [datasetVersion, setDatasetVersion] = useState('2024.12.15');
  const [boundaryTolerance, setBoundaryTolerance] = useState('10');
  const [coordinateValidation, setCoordinateValidation] = useState('Required');
  const [eqinfoRefLocation, setEqinfoRefLocation] = useState('Display only, not final decision');

  // Alert Decision Rules
  const [sendAlertInsideAor, setSendAlertInsideAor] = useState(true);
  const [minimumMagnitude, setMinimumMagnitude] = useState('Not Defined');
  const [maximumDepth, setMaximumDepth] = useState('Not Defined');
  const [feltEventRequired, setFeltEventRequired] = useState(false);
  const [distanceFromStation, setDistanceFromStation] = useState('Not Defined');
  const [duplicateSuppression, setDuplicateSuppression] = useState(true);
  const [correctedEventHandling, setCorrectedEventHandling] = useState('Review and update');

  // Special Event Handling
  const [offshoreEvents, setOffshoreEvents] = useState('Manual Review');
  const [boundaryEvents, setBoundaryEvents] = useState('Manual Review');
  const [overlappingAors, setOverlappingAors] = useState('Apply Primary AOR');
  const [duplicateRecords, setDuplicateRecords] = useState('Suppress Duplicate');
  const [missingCoordinates, setMissingCoordinates] = useState('Hold for Review');
  const [correctedRecords, setCorrectedRecords] = useState('Review and update');

  // Station Assignments
  const [stations, setStations] = useState<StationAssignment[]>(INITIAL_STATIONS);
  const [stationTableSearch, setStationTableSearch] = useState('');
  const [stationIslandFilter, setStationIslandFilter] = useState<'All' | 'Luzon' | 'Visayas' | 'Mindanao'>('All');

  const filteredStations = useMemo(() => {
    return stations.filter((st) => {
      if (isPcpRestricted && st.code !== 'PCP') return false;
      const matchIsland =
        stationIslandFilter === 'All' || st.islandGroup === stationIslandFilter;
      const q = stationTableSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        st.code.toLowerCase().includes(q) ||
        st.name.toLowerCase().includes(q) ||
        st.coveredAreas.toLowerCase().includes(q);
      return matchIsland && matchSearch;
    });
  }, [stations, stationIslandFilter, stationTableSearch]);

  // Modals & Feedback
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditAreasModal, setShowEditAreasModal] = useState(false);
  const [showLogicPreviewModal, setShowLogicPreviewModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected station for editing in modal
  const [editingStation, setEditingStation] = useState<StationAssignment | null>(null);
  const [editAreasValue, setEditAreasValue] = useState('');

  // Decision Logic Simulation State
  const [simLat, setSimLat] = useState('15.54');
  const [simLon, setSimLon] = useState('121.08');
  const [simMag, setSimMag] = useState('5.3');
  const [simDepth, setSimDepth] = useState('15');
  const [simLocation, setSimLocation] = useState('008 km N 45° E of Palayan City (Nueva Ecija)');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveRules = () => {
    showToast('AOR Rules successfully saved to current profile (Version 1.3.0).');
    setPendingChangesCount(0);
  };

  const handleSubmitApproval = () => {
    setPendingChangesCount(1);
    showToast('Rules submitted for supervisor approval. Tracking Ticket: CHG-2025-0423-01.');
  };

  const handleRestorePrevious = () => {
    setBoundaryTolerance('10');
    setAorBasis('Explicit municipalities and cities');
    setFinalLocationMethod('Coordinate-based point-in-polygon');
    setProvinceWideCoverage(false);
    setBoundaryDataset('PHIVOLCS AOR / PSGC');
    setDatasetVersion('2024.12.15');
    setSendAlertInsideAor(true);
    setMinimumMagnitude('Not Defined');
    setDuplicateSuppression(true);
    setOffshoreEvents('Manual Review');
    setBoundaryEvents('Manual Review');
    setOverlappingAors('Apply Primary AOR');
    showToast('Configuration restored to baseline Version 1.3.0.');
  };

  const handleExportConfig = () => {
    const configData = {
      ruleVersion: '1.3.0',
      exportedAt: new Date().toISOString(),
      geographicClassification: {
        aorBasis,
        finalLocationMethod,
        provinceWideCoverage,
        boundaryDataset,
        datasetVersion,
        boundaryToleranceKm: boundaryTolerance,
        coordinateValidation,
        eqinfoRefLocation,
      },
      alertDecisionRules: {
        sendAlertInsideAor,
        minimumMagnitude,
        maximumDepth,
        feltEventRequired,
        distanceFromStationThreshold: distanceFromStation,
        duplicateSuppression,
        correctedEventHandling,
      },
      specialEventHandling: {
        offshoreEvents,
        boundaryEvents,
        overlappingAors,
        duplicateRecords,
        missingCoordinates,
        correctedRecords,
      },
      stations,
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AOR_Rules_v1.3.0_config_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('AOR configuration exported as JSON.');
  };

  const openEditStation = (st: StationAssignment) => {
    setEditingStation(st);
    setEditAreasValue(st.coveredAreas);
    setShowEditAreasModal(true);
  };

  const saveEditedAreas = () => {
    if (!editingStation) return;
    setStations((prev) =>
      prev.map((s) => (s.code === editingStation.code ? { ...s, coveredAreas: editAreasValue } : s))
    );
    setShowEditAreasModal(false);
    showToast(`Updated covered areas for ${editingStation.code} - ${editingStation.name}.`);
  };

  // Evaluate Simulation logic
  const isInsidePalayan =
    parseFloat(simLat) >= 15.0 &&
    parseFloat(simLat) <= 16.5 &&
    parseFloat(simLon) >= 120.5 &&
    parseFloat(simLon) <= 121.8;
  const isInsideBislig =
    parseFloat(simLat) >= 7.8 &&
    parseFloat(simLat) <= 8.9 &&
    parseFloat(simLon) >= 125.8 &&
    parseFloat(simLon) <= 126.6;
  const isInsideCagayan =
    parseFloat(simLat) >= 8.0 &&
    parseFloat(simLat) <= 8.8 &&
    parseFloat(simLon) >= 124.3 &&
    parseFloat(simLon) <= 125.2;

  let assignedStation = 'Outside AOR';
  if (isInsidePalayan) assignedStation = 'PCP (Palayan Station)';
  else if (isInsideBislig) assignedStation = 'BIP (Bislig Station)';
  else if (isInsideCagayan) assignedStation = 'CGP (Cagayan de Oro Station)';

  const finalDecision = assignedStation !== 'Outside AOR' && sendAlertInsideAor ? 'SEND ALERT' : 'OUTSIDE AOR (NO ALERT)';

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12 select-none">
      {/* Station Account Restricted Notice Banner */}
      {isPcpRestricted && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span>
              <strong>Station View Active:</strong> You are logged in with the <strong>Palayan Seismic Station</strong> user account. Displaying operational rules and boundaries for <strong>PCP AOR</strong> only.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300 shrink-0 ml-2">
            PCP Rules Only
          </span>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Row 1: KPI Metric Cards (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Rule Set Status */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 leading-none mb-1">Rule Set Status</div>
            <div className="text-base font-bold text-emerald-600 flex items-center gap-1.5 leading-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>{ruleStatus}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Version 1.3.0</div>
          </div>
        </div>

        {/* Card 2: Approved AORs */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 leading-none mb-1">Approved AORs</div>
            <div className="text-2xl font-black text-blue-700 leading-none">3</div>
            <div className="text-[11px] text-slate-400 mt-1">of 3 station AORs</div>
          </div>
        </div>

        {/* Card 3: Events Classified Today */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 leading-none mb-1">Events Classified Today</div>
            <div className="text-2xl font-black text-blue-700 leading-none">52</div>
            <div className="text-[11px] text-slate-400 mt-1">(0 pending)</div>
          </div>
        </div>

        {/* Card 4: Rules Pending Approval */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 border border-orange-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-500 leading-none mb-1">Rules Pending Approval</div>
            <div className="text-2xl font-black text-orange-600 leading-none">{pendingChangesCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {pendingChangesCount > 0 ? `${pendingChangesCount} change pending` : 'No changes pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Blue Informational Banner */}
      {bannerVisible && (
        <div className="bg-blue-50/80 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between text-blue-900 shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-[11px] font-bold">
              i
            </div>
            <span>
              <strong className="font-bold text-blue-950">Base rule:</strong> Send one alert for every new valid earthquake inside an approved AOR.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className="text-blue-500 hover:text-blue-800 p-1 rounded-md hover:bg-blue-100/60 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 2: Two Major Rule Configuration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Geographic Classification Rules */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Globe className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-blue-700">Geographic Classification Rules</h2>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* AOR Basis */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">AOR Basis</label>
                <div className="sm:col-span-3">
                  <select
                    value={aorBasis}
                    onChange={(e) => setAorBasis(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="Explicit municipalities and cities">Explicit municipalities and cities</option>
                    <option value="Provincial centroid polygons">Provincial centroid polygons</option>
                    <option value="Seismic grid sectors (0.25°)">Seismic grid sectors (0.25°)</option>
                  </select>
                </div>
              </div>

              {/* Final Location Method */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Final Location Method</label>
                <div className="sm:col-span-3">
                  <select
                    value={finalLocationMethod}
                    onChange={(e) => setFinalLocationMethod(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="Coordinate-based point-in-polygon">Coordinate-based point-in-polygon</option>
                    <option value="Reported municipal text match">Reported municipal text match</option>
                    <option value="Hybrid centroid ray-casting">Hybrid centroid ray-casting</option>
                  </select>
                </div>
              </div>

              {/* Province-Wide Coverage */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Province-Wide Coverage</label>
                <div className="sm:col-span-3 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setProvinceWideCoverage(!provinceWideCoverage)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      provinceWideCoverage ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        provinceWideCoverage ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-[11px] text-slate-700 font-bold uppercase tracking-wider">
                    {provinceWideCoverage ? 'ON' : 'OFF'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {provinceWideCoverage ? '(Cover entire provinces)' : '(Use explicit AOR boundaries)'}
                  </span>
                </div>
              </div>

              {/* Boundary Dataset */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Boundary Dataset</label>
                <div className="sm:col-span-3">
                  <select
                    value={boundaryDataset}
                    onChange={(e) => setBoundaryDataset(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="PHIVOLCS AOR / PSGC">PHIVOLCS AOR / PSGC</option>
                    <option value="NAMRIA Official Cadastral 2024">NAMRIA Official Cadastral 2024</option>
                    <option value="PSA Administrative Shapefiles">PSA Administrative Shapefiles</option>
                  </select>
                </div>
              </div>

              {/* Dataset Version */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Dataset Version</label>
                <div className="sm:col-span-3">
                  <select
                    value={datasetVersion}
                    onChange={(e) => setDatasetVersion(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="2024.12.15">2024.12.15</option>
                    <option value="2024.08.01">2024.08.01</option>
                    <option value="2023.11.20">2023.11.20</option>
                  </select>
                </div>
              </div>

              {/* Boundary Tolerance */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Boundary Tolerance</label>
                <div className="sm:col-span-3 flex items-center">
                  <input
                    type="number"
                    value={boundaryTolerance}
                    onChange={(e) => setBoundaryTolerance(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-l-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  />
                  <span className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs font-medium rounded-r-lg">
                    km
                  </span>
                </div>
              </div>

              {/* Coordinate Validation */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Coordinate Validation</label>
                <div className="sm:col-span-3">
                  <select
                    value={coordinateValidation}
                    onChange={(e) => setCoordinateValidation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="Required">Required</option>
                    <option value="Optional (Allow City Centroid)">Optional (Allow City Centroid)</option>
                    <option value="Strict (WGS84 EPSG:4326 Bounds)">Strict (WGS84 EPSG:4326 Bounds)</option>
                  </select>
                </div>
              </div>

              {/* EQInfo Reference Location */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">EQInfo Reference Location</label>
                <div className="sm:col-span-3">
                  <select
                    value={eqinfoRefLocation}
                    onChange={(e) => setEqinfoRefLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="Display only, not final decision">Display only, not final decision</option>
                    <option value="Fallback if GPS offline">Fallback if GPS offline</option>
                    <option value="Primary authority">Primary authority</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Alert Decision Rules */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <Bell className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-blue-700">Alert Decision Rules</h2>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* New valid earthquake inside approved AOR */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">
                  New valid earthquake inside approved AOR
                </label>
                <div className="sm:col-span-3 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSendAlertInsideAor(!sendAlertInsideAor)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      sendAlertInsideAor ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        sendAlertInsideAor ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      sendAlertInsideAor ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {sendAlertInsideAor ? 'SEND ALERT' : 'DO NOT SEND'}
                  </span>
                </div>
              </div>

              {/* Minimum Magnitude */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Minimum Magnitude</label>
                <div className="sm:col-span-3">
                  <select
                    value={minimumMagnitude}
                    onChange={(e) => setMinimumMagnitude(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="Not Defined">Not Defined</option>
                    <option value="M 3.0">M 3.0</option>
                    <option value="M 4.0">M 4.0</option>
                    <option value="M 4.5">M 4.5</option>
                    <option value="M 5.0">M 5.0</option>
                  </select>
                </div>
              </div>

              {/* Maximum Depth */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Maximum Depth</label>
                <div className="sm:col-span-3 flex items-center">
                  <input
                    type="text"
                    value={maximumDepth}
                    onChange={(e) => setMaximumDepth(e.target.value)}
                    placeholder="Not Defined"
                    className="w-full px-3 py-1.5 rounded-l-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  />
                  <span className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs font-medium rounded-r-lg">
                    km
                  </span>
                </div>
              </div>

              {/* Felt Event Required */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Felt Event Required</label>
                <div className="sm:col-span-3 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFeltEventRequired(!feltEventRequired)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      feltEventRequired ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        feltEventRequired ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {feltEventRequired ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>

              {/* Distance from Station Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">
                  Distance from Station Threshold
                </label>
                <div className="sm:col-span-3 flex items-center">
                  <input
                    type="text"
                    value={distanceFromStation}
                    onChange={(e) => setDistanceFromStation(e.target.value)}
                    placeholder="Not Defined"
                    className="w-full px-3 py-1.5 rounded-l-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  />
                  <span className="px-3 py-1.5 bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs font-medium rounded-r-lg">
                    km
                  </span>
                </div>
              </div>

              {/* Duplicate Alert Suppression */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Duplicate Alert Suppression</label>
                <div className="sm:col-span-3 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDuplicateSuppression(!duplicateSuppression)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      duplicateSuppression ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        duplicateSuppression ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      duplicateSuppression ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  >
                    {duplicateSuppression ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Corrected Event Handling */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                <label className="sm:col-span-2 text-slate-700 font-semibold">Corrected Event Handling</label>
                <div className="sm:col-span-3">
                  <select
                    value={correctedEventHandling}
                    onChange={(e) => setCorrectedEventHandling(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium focus:border-blue-500 outline-none"
                  >
                    <option value="Review and update">Review and update</option>
                    <option value="Re-send alert bulletin automatically">Re-send alert bulletin automatically</option>
                    <option value="Log in audit trail only">Log in audit trail only</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Special Event Handling, Station AOR Assignment, Rule Version and Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left (3 cols): Special Event Handling */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-blue-700">Special Event Handling</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Offshore Events</label>
                <select
                  value={offshoreEvents}
                  onChange={(e) => setOffshoreEvents(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium outline-none focus:border-blue-500"
                >
                  <option value="Manual Review">Manual Review</option>
                  <option value="Auto-Include if < 20km">Auto-Include if &lt; 20km</option>
                  <option value="Exclude Offshore">Exclude Offshore</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Boundary Events</label>
                <select
                  value={boundaryEvents}
                  onChange={(e) => setBoundaryEvents(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium outline-none focus:border-blue-500"
                >
                  <option value="Manual Review">Manual Review</option>
                  <option value="Buffer Auto-Inclusion">Buffer Auto-Inclusion</option>
                  <option value="Strict Point Only">Strict Point Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Overlapping AORs</label>
                <select
                  value={overlappingAors}
                  onChange={(e) => setOverlappingAors(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium outline-none focus:border-blue-500"
                >
                  <option value="Apply Primary AOR">Apply Primary AOR</option>
                  <option value="Notify All Overlapping Stations">Notify All Overlapping Stations</option>
                  <option value="Closest Epicenter Station">Closest Epicenter Station</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Duplicate Records</label>
                <select
                  value={duplicateRecords}
                  onChange={(e) => setDuplicateRecords(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium outline-none focus:border-blue-500"
                >
                  <option value="Suppress Duplicate">Suppress Duplicate</option>
                  <option value="Append Revision Suffix">Append Revision Suffix</option>
                  <option value="Force Operator Prompt">Force Operator Prompt</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Missing Coordinates</label>
                <select
                  value={missingCoordinates}
                  onChange={(e) => setMissingCoordinates(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium outline-none focus:border-blue-500"
                >
                  <option value="Hold for Review">Hold for Review</option>
                  <option value="Use Municipality Centroid">Use Municipality Centroid</option>
                  <option value="Discard Bulletin">Discard Bulletin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Corrected Records</label>
                <select
                  value={correctedRecords}
                  onChange={(e) => setCorrectedRecords(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-medium outline-none focus:border-blue-500"
                >
                  <option value="Review and update">Review and update</option>
                  <option value="Auto-resend revised bulletin">Auto-resend revised bulletin</option>
                  <option value="Log in audit trail only">Log in audit trail only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Center (6 cols): Station AOR Assignment */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-blue-700 leading-tight">
                    Station AOR Assignment ({stations.length} Stations)
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Official PHIVOLCS SCSS network &amp; provincial boundaries
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEditStation(stations[0])}
                className="px-2.5 py-1 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Covered Areas</span>
              </button>
            </div>

            {/* Station Table Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1">
                {(['All', 'Luzon', 'Visayas', 'Mindanao'] as const).map((isl) => (
                  <button
                    key={isl}
                    type="button"
                    onClick={() => setStationIslandFilter(isl)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      stationIslandFilter === isl
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isl}
                  </button>
                ))}
              </div>
              <div className="relative max-w-xs w-full">
                <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                <input
                  type="text"
                  value={stationTableSearch}
                  onChange={(e) => setStationTableSearch(e.target.value)}
                  placeholder="Filter station or province..."
                  className="w-full pl-7 pr-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] font-semibold">
                    <th className="py-2 px-2.5">Code</th>
                    <th className="py-2 px-2.5">Station Name</th>
                    <th className="py-2 px-2.5">Region</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5">STSS Nodes</th>
                    <th className="py-2 px-2.5">Covered Areas</th>
                    <th className="py-2 px-2.5">Rule Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStations.map((st: StationAssignment) => (
                    <tr key={st.code} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2.5 font-bold font-mono text-blue-700">{st.code}</td>
                      <td className="py-2 px-2.5 text-slate-800 font-medium">{st.name}</td>
                      <td className="py-2 px-2.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {st.islandGroup || 'Luzon'}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span>{st.status}</span>
                        </span>
                      </td>
                      <td className="py-2 px-2.5 font-mono text-slate-600 text-[11px]">
                        {st.satelliteCount ?? 0} STSS
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <span className="truncate max-w-[180px]" title={st.coveredAreas}>
                            {st.coveredAreas}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditStation(st)}
                            className="text-blue-500 hover:text-blue-700 p-0.5 rounded shrink-0"
                            title="Edit covered areas"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2 px-2.5">
                        <select
                          value={st.ruleAssignment}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStations((prev) =>
                              prev.map((s) => (s.code === st.code ? { ...s, ruleAssignment: val } : s))
                            );
                            showToast(`Updated rule assignment for ${st.code}.`);
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 font-medium outline-none focus:border-blue-500"
                        >
                          <option value="Standard Rules">Standard Rules</option>
                          <option value="Strict Offshore Rules">Strict Offshore Rules</option>
                          <option value="Custom High-Sensitivity">Custom High-Sensitivity</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredStations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-4 text-center text-slate-400 text-xs">
                        No stations match "{stationTableSearch}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right (3 cols): Rule Version and Audit */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-3">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-blue-700">Rule Version and Audit</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Rule Version</span>
                <span className="font-bold text-slate-900">1.3.0</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Last Updated</span>
                <span className="font-semibold text-blue-700">Apr 20, 2025 02:15 PM</span>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <div className="text-slate-500 font-medium mb-0.5">Last Approved By</div>
                <div className="font-bold text-slate-900">Juan Dela Cruz</div>
                <div className="text-[11px] text-slate-500">System Administrator</div>
              </div>

              <div>
                <div className="text-slate-500 font-medium mb-1.5">Change History</div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full py-1.5 px-3 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View History</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Action Buttons Bottom Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Validate Rules */}
          <button
            type="button"
            onClick={() => setShowValidationModal(true)}
            className="px-3.5 py-2 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Validate Rules</span>
          </button>

          {/* Preview Decision Logic */}
          <button
            type="button"
            onClick={() => setShowLogicPreviewModal(true)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Preview Decision Logic</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Save Rules */}
          <button
            type="button"
            onClick={handleSaveRules}
            className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Rules</span>
          </button>

          {/* Submit for Approval */}
          <button
            type="button"
            onClick={handleSubmitApproval}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Submit for Approval</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Restore Previous Version */}
          <button
            type="button"
            onClick={handleRestorePrevious}
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Previous Version</span>
          </button>

          {/* Export Configuration */}
          <button
            type="button"
            onClick={handleExportConfig}
            className="px-3 py-2 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Configuration</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Preview Decision Logic */}
      {showLogicPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-blue-600 fill-blue-600" />
                <h3 className="text-base font-bold text-slate-900">AOR Decision Engine Simulator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogicPreviewModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Test how an incoming earthquake bulletin coordinates are evaluated through active point-in-polygon rules, boundary buffers, and alert filters.
            </p>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs font-semibold text-slate-500 self-center">Preset Test:</span>
              <button
                type="button"
                onClick={() => {
                  setSimLat('15.54');
                  setSimLon('121.08');
                  setSimMag('5.3');
                  setSimDepth('15');
                  setSimLocation('Palayan City, Nueva Ecija');
                }}
                className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-medium hover:bg-blue-100"
              >
                Inside Palayan AOR (M5.3)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimLat('8.21');
                  setSimLon('126.31');
                  setSimMag('4.8');
                  setSimDepth('22');
                  setSimLocation('Bislig, Surigao del Sur');
                }}
                className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-md font-medium hover:bg-blue-100"
              >
                Inside Bislig AOR (M4.8)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimLat('13.41');
                  setSimLon('120.45');
                  setSimMag('4.1');
                  setSimDepth('30');
                  setSimLocation('Offshore Mindoro (Outside AOR)');
                }}
                className="px-2.5 py-1 text-xs bg-slate-100 text-slate-700 rounded-md font-medium hover:bg-slate-200"
              >
                Outside AOR (Mindoro)
              </button>
            </div>

            {/* Coordinates Input Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Latitude (°N)</label>
                <input
                  type="text"
                  value={simLat}
                  onChange={(e) => setSimLat(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Longitude (°E)</label>
                <input
                  type="text"
                  value={simLon}
                  onChange={(e) => setSimLon(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Magnitude</label>
                <input
                  type="text"
                  value={simMag}
                  onChange={(e) => setSimMag(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Depth (km)</label>
                <input
                  type="text"
                  value={simDepth}
                  onChange={(e) => setSimDepth(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded font-mono font-medium"
                />
              </div>
            </div>

            {/* Decision Pipeline Result */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Simulation Pipeline Evaluation
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">1. Coordinate Validation (WGS84)</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Valid GPS Bounds
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">2. Boundary Point-In-Polygon Check ({datasetVersion})</span>
                  <span className="font-bold text-blue-700">{assignedStation}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">3. Boundary Tolerance Applied</span>
                  <span className="font-semibold text-slate-800">{boundaryTolerance} km buffer active</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">4. Magnitude &amp; Depth Threshold Filter</span>
                  <span className="font-semibold text-emerald-600">Pass (No minimum floor restriction)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600">5. Duplicate Suppression Check</span>
                  <span className="font-semibold text-emerald-600">Pass (Unique Event)</span>
                </div>
              </div>

              <div
                className={`mt-4 p-3.5 rounded-xl border flex items-center justify-between ${
                  finalDecision === 'SEND ALERT'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Final Decision Output
                  </div>
                  <div className="text-base font-black tracking-tight">{finalDecision}</div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    finalDecision === 'SEND ALERT'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {finalDecision === 'SEND ALERT' ? 'Action: Dispatch Email Alert' : 'Action: Log Only'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowLogicPreviewModal(false)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Rule Validation Passed */}
      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Rule Validation Report</h3>
                <p className="text-xs text-slate-500">Version 1.3.0 Configuration Integrity</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span>Geographic Classification Rules:</span>
                <span className="font-bold text-emerald-600">8 / 8 Checks Passed</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Alert Decision Pipeline:</span>
                <span className="font-bold text-emerald-600">7 / 7 Checks Passed</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Station AOR Spatial Geometries:</span>
                <span className="font-bold text-emerald-600">3 / 3 Stations Validated</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Boundary Dataset PSGC 2024.12.15:</span>
                <span className="font-bold text-emerald-600">Synced &amp; Intact</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-bold text-slate-900">
                <span>Overall Status:</span>
                <span className="text-emerald-600">No Conflicts Detected (Ready)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Covered Areas */}
      {showEditAreasModal && editingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Covered Areas - {editingStation.code} ({editingStation.name})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditAreasModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Specify the provinces, municipalities, or cities assigned to the{' '}
                <strong>{editingStation.name}</strong> seismic station AOR.
              </p>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Covered Areas (comma-separated):
                </label>
                <textarea
                  value={editAreasValue}
                  onChange={(e) => setEditAreasValue(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditAreasModal(false)}
                className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditedAreas}
                className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Version History & Audit */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">AOR Rules Version History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {VERSION_HISTORY.map((vh) => (
                <div key={vh.version} className="py-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-700 text-sm">v{vh.version}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          vh.status === 'Current'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {vh.status}
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{vh.date}</span>
                  </div>
                  <p className="text-slate-700">{vh.summary}</p>
                  <div className="text-[11px] text-slate-500">
                    Approved by: <span className="font-semibold text-slate-700">{vh.author}</span> ({vh.role})
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
