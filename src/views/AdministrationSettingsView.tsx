import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Clock,
  MapPin,
  Mail,
  Database,
  Shield,
  Smartphone,
  Check,
  RotateCcw,
  Activity,
  Layers,
  FileText,
  Sliders,
  Bell,
  Lock,
  Globe,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types';

interface AdministrationSettingsViewProps {
  currentUser?: UserProfile;
  onShowToast?: (msg: string) => void;
  onNavigateToAudit?: () => void;
}

type SettingCategory =
  | 'general'
  | 'monitoring'
  | 'gis_aor'
  | 'alerts_email'
  | 'data_retention'
  | 'access_security';

export const AdministrationSettingsView: React.FC<AdministrationSettingsViewProps> = ({
  currentUser,
  onShowToast,
  onNavigateToAudit,
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Active Station Code & Name
  const userAor = currentUser?.assignedAor || 'CGP';
  const defaultStation =
    userAor === 'PCP'
      ? 'PCP — Palayan Seismic Station (Central Luzon)'
      : userAor === 'BIP'
      ? 'BIP — Bislig Seismic Station (Bicol / Eastern Mindanao)'
      : userAor === 'ALL'
      ? 'ALL — PHIVOLCS Central (All Stations)'
      : 'CGP — Cagayan de Oro Seismic Station';

  const defaultStationCode =
    userAor === 'PCP' ? 'PCP' : userAor === 'BIP' ? 'BIP' : userAor === 'ALL' ? 'GLOBAL' : 'CGP';

  // --- Form State: General Settings (exact match to screenshot) ---
  const [appName, setAppName] = useState('Alert X');
  const [agencyName, setAgencyName] = useState('PHIVOLCS');
  const [activeStation, setActiveStation] = useState(defaultStation);
  const [timeZone, setTimeZone] = useState('Asia/Manila (UTC+08:00)');
  const [defaultDashboardView, setDefaultDashboardView] = useState('Station overview');
  const [mapBoundaryLayer, setMapBoundaryLayer] = useState(true);
  const [otherStationOverlays, setOtherStationOverlays] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState('5 minutes');
  const [rememberMapZoom, setRememberMapZoom] = useState(true);

  // --- Form State: Monitoring Settings ---
  const [pollingFrequency, setPollingFrequency] = useState('5 minutes');
  const [autoIngestBulletins, setAutoIngestBulletins] = useState(true);
  const [bulletinEndpoint, setBulletinEndpoint] = useState('https://earthquake.phivolcs.dost.gov.ph/');
  const [minMagnitudeIngest, setMinMagnitudeIngest] = useState('2.0');
  const [retryFailedRequests, setRetryFailedRequests] = useState(true);

  // --- Form State: GIS & AOR Settings ---
  const [boundaryBufferKm, setBoundaryBufferKm] = useState('15');
  const [defaultZoomLevel, setDefaultZoomLevel] = useState('8');
  const [basemapStyle, setBasemapStyle] = useState('osm');
  const [highlightInsideAorColor, setHighlightInsideAorColor] = useState('#2563eb');
  const [oceanicBufferDetection, setOceanicBufferDetection] = useState(true);

  // --- Form State: Alerts & Email Settings ---
  const [alertDispatchThreshold, setAlertDispatchThreshold] = useState('4.0');
  const [autoDispatchCountdown, setAutoDispatchCountdown] = useState('120');
  const [rateLimitPerStation, setRateLimitPerStation] = useState('10 per hour');
  const [emailBrandingHeader, setEmailBrandingHeader] = useState('PHIVOLCS Earthquake Information');
  const [includeIntensityMapAttachment, setIncludeIntensityMapAttachment] = useState(true);

  // --- Form State: Data & Retention Settings ---
  const [bulletinArchiveDays, setBulletinArchiveDays] = useState('365 days');
  const [auditLogRetention, setAuditLogRetention] = useState('Permanent (DOST Compliance)');
  const [telemetryPurgeDays, setTelemetryPurgeDays] = useState('30 days');
  const [scheduledExport, setScheduledExport] = useState(true);

  // --- Form State: Access & Security Settings ---
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('60 minutes');
  const [enforceStationAorScoping, setEnforceStationAorScoping] = useState(true);
  const [dostSsoDirectorySync, setDostSsoDirectorySync] = useState(true);
  const [require2FAForAdmin, setRequire2FAForAdmin] = useState(true);

  // Load saved settings if any
  useEffect(() => {
    const saved = localStorage.getItem('alertx_admin_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.appName) setAppName(parsed.appName);
        if (parsed.agencyName) setAgencyName(parsed.agencyName);
        if (parsed.activeStation) setActiveStation(parsed.activeStation);
        if (parsed.timeZone) setTimeZone(parsed.timeZone);
        if (parsed.defaultDashboardView) setDefaultDashboardView(parsed.defaultDashboardView);
        if (parsed.mapBoundaryLayer !== undefined) setMapBoundaryLayer(parsed.mapBoundaryLayer);
        if (parsed.otherStationOverlays !== undefined) setOtherStationOverlays(parsed.otherStationOverlays);
        if (parsed.refreshInterval) setRefreshInterval(parsed.refreshInterval);
        if (parsed.rememberMapZoom !== undefined) setRememberMapZoom(parsed.rememberMapZoom);
      } catch {
        // fallback
      }
    }
  }, []);

  const currentStationCode = activeStation.split('—')[0].trim() || defaultStationCode;

  // Handle Save
  const handleSaveChanges = () => {
    const settingsPayload = {
      appName,
      agencyName,
      activeStation,
      timeZone,
      defaultDashboardView,
      mapBoundaryLayer,
      otherStationOverlays,
      refreshInterval,
      rememberMapZoom,
      pollingFrequency,
      autoIngestBulletins,
      bulletinEndpoint,
      minMagnitudeIngest,
      boundaryBufferKm,
      alertDispatchThreshold,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem('alertx_admin_settings', JSON.stringify(settingsPayload));
    setHasUnsavedChanges(false);
    setSaveSuccessNotice(true);

    if (onShowToast) {
      onShowToast(`Settings saved successfully to ${currentStationCode} workspace.`);
    }

    setTimeout(() => {
      setSaveSuccessNotice(false);
    }, 4000);
  };

  // Handle Reset Defaults
  const handleResetDefaults = () => {
    setAppName('Alert X');
    setAgencyName('PHIVOLCS');
    setActiveStation(defaultStation);
    setTimeZone('Asia/Manila (UTC+08:00)');
    setDefaultDashboardView('Station overview');
    setMapBoundaryLayer(true);
    setOtherStationOverlays(false);
    setRefreshInterval('5 minutes');
    setRememberMapZoom(true);

    setPollingFrequency('5 minutes');
    setAutoIngestBulletins(true);
    setBulletinEndpoint('https://earthquake.phivolcs.dost.gov.ph/');
    setMinMagnitudeIngest('2.0');
    setBoundaryBufferKm('15');
    setAlertDispatchThreshold('4.0');

    setHasUnsavedChanges(false);
    localStorage.removeItem('alertx_admin_settings');

    if (onShowToast) {
      onShowToast('Workspace settings restored to factory defaults.');
    }
  };

  const categories = [
    {
      id: 'general' as SettingCategory,
      title: 'General',
      subtitle: 'System identity and defaults',
      icon: SettingsIcon,
    },
    {
      id: 'monitoring' as SettingCategory,
      title: 'Monitoring',
      subtitle: 'EQInfo polling and event rules',
      icon: Clock,
    },
    {
      id: 'gis_aor' as SettingCategory,
      title: 'GIS & AOR',
      subtitle: 'Boundary and map display',
      icon: Smartphone,
    },
    {
      id: 'alerts_email' as SettingCategory,
      title: 'Alerts & Email',
      subtitle: 'Delivery behavior and templates',
      icon: Mail,
    },
    {
      id: 'data_retention' as SettingCategory,
      title: 'Data & Retention',
      subtitle: 'Records and audit history',
      icon: Database,
    },
    {
      id: 'access_security' as SettingCategory,
      title: 'Access & Security',
      subtitle: 'Sessions and account controls',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Top Header Section: Title, Subtitle, Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Settings
          </h2>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Configure the defaults for monitoring, maps, alerts, and data handling.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            Reset defaults
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Save changes</span>
          </button>
        </div>
      </div>

      {/* 3-Column Grid Layout matching the screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUMN 1 (Left): Categories & Current Workspace */}
        <div className="lg:col-span-3 space-y-4">
          {/* Settings Categories List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5 mb-1">
              SETTINGS CATEGORIES
            </div>

            <div className="space-y-1">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/90 text-blue-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-normal'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isActive ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-tight truncate">
                        {cat.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-normal mt-0.5 truncate">
                        {cat.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Workspace Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              CURRENT WORKSPACE
            </div>

            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentStationCode} station workspace
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Station scoped &bull; Active
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Changes apply to the selected station workspace.
            </p>
          </div>
        </div>

        {/* COLUMN 2 (Center): Active Category Settings Forms */}
        <div className="lg:col-span-6 space-y-5">
          {activeCategory === 'general' && (
            <>
              {/* Card 1: Organization & station defaults */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Organization & station defaults
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5 mb-5">
                  Set the workspace identity and regional defaults used throughout Alert X.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Application Name */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      APPLICATION NAME
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => {
                        setAppName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Agency / Organization */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      AGENCY / ORGANIZATION
                    </label>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => {
                        setAgencyName(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Active Station */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      ACTIVE STATION
                    </label>
                    <select
                      value={activeStation}
                      onChange={(e) => {
                        setActiveStation(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="CGP — Cagayan de Oro Seismic Station">
                        CGP — Cagayan de Oro Seismic Station
                      </option>
                      <option value="PCP — Palayan Seismic Station (Central Luzon)">
                        PCP — Palayan Seismic Station (Central Luzon)
                      </option>
                      <option value="BIP — Bislig Seismic Station (Bicol / Eastern Mindanao)">
                        BIP — Bislig Seismic Station (Bicol / Eastern Mindanao)
                      </option>
                      <option value="ALL — PHIVOLCS Central (All Stations)">
                        ALL — PHIVOLCS Central (All Stations)
                      </option>
                    </select>
                  </div>

                  {/* Default Time Zone */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      DEFAULT TIME ZONE
                    </label>
                    <select
                      value={timeZone}
                      onChange={(e) => {
                        setTimeZone(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="Asia/Manila (UTC+08:00)">Asia/Manila (UTC+08:00)</option>
                      <option value="UTC (UTC+00:00)">UTC (UTC+00:00)</option>
                    </select>
                  </div>
                </div>

                {/* Scope Notice Banner */}
                <div className="mt-5 bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-800">
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Station scope is currently restricted to the {currentStationCode} workspace.
                  </span>
                </div>
              </div>

              {/* Card 2: Dashboard & map preferences */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Dashboard & map preferences
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Choose how maps and monitoring panels appear when users open the dashboard.
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Row 1: Default dashboard view */}
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Default dashboard view
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Open to the active station overview and recent AOR activity.
                      </div>
                    </div>
                    <select
                      value={defaultDashboardView}
                      onChange={(e) => {
                        setDefaultDashboardView(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
                    >
                      <option value="Station overview">Station overview</option>
                      <option value="National overview">National overview</option>
                      <option value="Recent alerts table">Recent alerts table</option>
                      <option value="Full screen map">Full screen map</option>
                    </select>
                  </div>

                  {/* Row 2: Map boundary layer */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Map boundary layer
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Show province boundaries on the station AOR map.
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={mapBoundaryLayer}
                      onClick={() => {
                        setMapBoundaryLayer(!mapBoundaryLayer);
                        setHasUnsavedChanges(true);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        mapBoundaryLayer ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          mapBoundaryLayer ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 3: Other station AOR overlays */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Other station AOR overlays
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Start with other stations' AORs hidden; {currentStationCode} AOR remains visible.
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={otherStationOverlays}
                      onClick={() => {
                        setOtherStationOverlays(!otherStationOverlays);
                        setHasUnsavedChanges(true);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        otherStationOverlays ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          otherStationOverlays ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Row 4: Dashboard refresh interval */}
                  <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Dashboard refresh interval
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        How often live status cards refresh automatically.
                      </div>
                    </div>
                    <select
                      value={refreshInterval}
                      onChange={(e) => {
                        setRefreshInterval(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
                    >
                      <option value="1 minute">1 minute</option>
                      <option value="2 minutes">2 minutes</option>
                      <option value="5 minutes">5 minutes</option>
                      <option value="10 minutes">10 minutes</option>
                      <option value="Manual only">Manual only</option>
                    </select>
                  </div>

                  {/* Row 5: Remember map zoom and layers */}
                  <div className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Remember map zoom and layers
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Restore the user's most recent map view on return.
                      </div>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={rememberMapZoom}
                      onClick={() => {
                        setRememberMapZoom(!rememberMapZoom);
                        setHasUnsavedChanges(true);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        rememberMapZoom ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          rememberMapZoom ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeCategory === 'monitoring' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Monitoring & Polling Rules
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Configure PHIVOLCS EQInfo bulletin polling frequency and ingestion filters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    POLLING FREQUENCY
                  </label>
                  <select
                    value={pollingFrequency}
                    onChange={(e) => {
                      setPollingFrequency(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="1 minute">Every 1 minute (High Priority)</option>
                    <option value="2 minutes">Every 2 minutes</option>
                    <option value="5 minutes">Every 5 minutes (Standard)</option>
                    <option value="15 minutes">Every 15 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    MINIMUM MAGNITUDE INGEST
                  </label>
                  <select
                    value={minMagnitudeIngest}
                    onChange={(e) => {
                      setMinMagnitudeIngest(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="1.0">M1.0+ (Micro-seismic)</option>
                    <option value="2.0">M2.0+ (Standard Regional)</option>
                    <option value="3.0">M3.0+ (Felt Earthquakes)</option>
                    <option value="4.0">M4.0+ (Significant Events)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  EQINFO ENDPOINT URL
                </label>
                <input
                  type="text"
                  value={bulletinEndpoint}
                  onChange={(e) => {
                    setBulletinEndpoint(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs font-mono text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 divide-y divide-slate-100">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Automatic Bulletin Ingestion</div>
                    <div className="text-xs text-slate-500">Automatically parse new seismic records from PHIVOLCS DOST RSS/JSON feed.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoIngestBulletins(!autoIngestBulletins);
                      setHasUnsavedChanges(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      autoIngestBulletins ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        autoIngestBulletins ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Retry Failed Ingestions</div>
                    <div className="text-xs text-slate-500">Retry with exponential backoff if remote PHIVOLCS feed experiences SSL timeout.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRetryFailedRequests(!retryFailedRequests);
                      setHasUnsavedChanges(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      retryFailedRequests ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        retryFailedRequests ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'gis_aor' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  GIS & AOR Boundary Display
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Configure polygon buffering, coastal oceanic extension, and cartographic projections.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    OFFSHORE BUFFER THRESHOLD (KM)
                  </label>
                  <input
                    type="number"
                    value={boundaryBufferKm}
                    onChange={(e) => {
                      setBoundaryBufferKm(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Standard coastal buffer: 15 km</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    DEFAULT STATION ZOOM
                  </label>
                  <select
                    value={defaultZoomLevel}
                    onChange={(e) => {
                      setDefaultZoomLevel(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="7">Zoom Level 7 (Regional Overview)</option>
                    <option value="8">Zoom Level 8 (Station Province Detail)</option>
                    <option value="9">Zoom Level 9 (Municipality Focus)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 divide-y divide-slate-100">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Oceanic Buffer Proximity Detection</div>
                    <div className="text-xs text-slate-500">Route offshore earthquakes within 15 km of provincial coastline to Exception Review.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOceanicBufferDetection(!oceanicBufferDetection);
                      setHasUnsavedChanges(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      oceanicBufferDetection ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        oceanicBufferDetection ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'alerts_email' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Alerts & Email Delivery Rules
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Configure automated email dispatch trigger thresholds, countdown timers, and recipient throttling.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    AUTO-DISPATCH MAGNITUDE THRESHOLD
                  </label>
                  <select
                    value={alertDispatchThreshold}
                    onChange={(e) => {
                      setAlertDispatchThreshold(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="3.5">M3.5+ (High Sensitivity)</option>
                    <option value="4.0">M4.0+ (Standard PHIVOLCS Protocol)</option>
                    <option value="4.5">M4.5+ (Moderate & Strong Only)</option>
                    <option value="5.0">M5.0+ (Damaging Earthquakes)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    DISPATCH COUNTDOWN (SECONDS)
                  </label>
                  <input
                    type="number"
                    value={autoDispatchCountdown}
                    onChange={(e) => {
                      setAutoDispatchCountdown(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  EMAIL TEMPLATE BRANDING HEADER
                </label>
                <input
                  type="text"
                  value={emailBrandingHeader}
                  onChange={(e) => {
                    setEmailBrandingHeader(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 divide-y divide-slate-100">
                <div className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Attach Interactive Intensity Map</div>
                    <div className="text-xs text-slate-500">Embed high-resolution PEIS shake map rendering in outgoing notification emails.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeIntensityMapAttachment(!includeIntensityMapAttachment);
                      setHasUnsavedChanges(true);
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      includeIntensityMapAttachment ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        includeIntensityMapAttachment ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'data_retention' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Data Retention & Archiving
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Configure historical bulletin archiving, telemetry purge periods, and compliance exports.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    EARTHQUAKE BULLETIN ARCHIVE
                  </label>
                  <select
                    value={bulletinArchiveDays}
                    onChange={(e) => {
                      setBulletinArchiveDays(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="90 days">90 days</option>
                    <option value="180 days">180 days</option>
                    <option value="365 days">365 days (1 Year)</option>
                    <option value="Permanent">Permanent Storage</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    AUDIT LOG RETENTION
                  </label>
                  <select
                    value={auditLogRetention}
                    onChange={(e) => {
                      setAuditLogRetention(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="Permanent (DOST Compliance)">Permanent (DOST Compliance)</option>
                    <option value="5 years">5 years</option>
                    <option value="3 years">3 years</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeCategory === 'access_security' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Access & Security Controls
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Manage station account boundaries, DOST SSO identity tokens, and session limits.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    INACTIVITY SESSION TIMEOUT
                  </label>
                  <select
                    value={sessionTimeoutMinutes}
                    onChange={(e) => {
                      setSessionTimeoutMinutes(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="60 minutes">60 minutes (Standard)</option>
                    <option value="120 minutes">120 minutes</option>
                    <option value="Never">Never (Operations Wallboard)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    STATION AOR ENFORCEMENT
                  </label>
                  <select
                    value={enforceStationAorScoping ? 'Enforced' : 'Advisory'}
                    onChange={(e) => {
                      setEnforceStationAorScoping(e.target.value === 'Enforced');
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="Enforced">Strict Isolation (Station Boundary)</option>
                    <option value="Advisory">Advisory Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3 (Right): Service Status & Configuration Notes */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: Service status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Service status</h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Live configuration indicators
              </p>
            </div>

            <div className="space-y-2.5">
              {/* EQInfo source */}
              <div className="border border-slate-200/80 rounded-xl p-3 flex items-center gap-3 bg-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-800">EQInfo source</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Connected &bull; real-time data</div>
                </div>
              </div>

              {/* Alert service */}
              <div className="border border-slate-200/80 rounded-xl p-3 flex items-center gap-3 bg-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-800">Alert service</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Active &bull; email operational</div>
                </div>
              </div>

              {/* GIS dataset */}
              <div className="border border-slate-200/80 rounded-xl p-3 flex items-center gap-3 bg-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-slate-800">GIS dataset</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Approved &bull; boundaries current</div>
                </div>
              </div>
            </div>

            {/* Save status badge indicator */}
            <div
              className={`rounded-xl p-3 flex items-center gap-2 text-xs font-semibold transition-all ${
                saveSuccessNotice
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : hasUnsavedChanges
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-emerald-50/70 border border-emerald-200/80 text-emerald-800'
              }`}
            >
              <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
              <span>
                {saveSuccessNotice
                  ? 'Changes saved successfully'
                  : hasUnsavedChanges
                  ? 'Unsaved changes pending'
                  : 'No unsaved changes'}
              </span>
            </div>
          </div>

          {/* Card 2: Configuration notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configuration notes</h3>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                Useful details for this workspace
              </p>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                AOR DISPLAY
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentStationCode} Station AOR stays visible when other station overlays are off.
              </p>
            </div>

            <div className="border-t border-slate-100" />

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                BOUNDARY LEVEL
              </div>
              <div className="text-xs font-bold text-slate-800">Province level</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Source: DENR provincial boundaries
              </div>
            </div>

            <div className="border-t border-slate-100" />

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                DATA TIME ZONE
              </div>
              <div className="text-xs font-bold text-slate-800">Philippine Standard Time</div>
              <div className="text-[11px] text-slate-500 mt-0.5">UTC +08:00</div>
            </div>

            {/* Gray bottom note box */}
            <div className="mt-4 bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
              <div
                className="text-xs font-bold text-slate-700 cursor-pointer hover:text-blue-600 transition-colors flex items-center justify-between"
                onClick={onNavigateToAudit}
                title="View Audit Log"
              >
                <span>Changes are recorded in the Audit Log.</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">
                Only administrators can edit these system-wide settings.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
