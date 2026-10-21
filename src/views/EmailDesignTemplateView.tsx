import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Edit3,
  Eye,
  Code,
  Check,
  CheckCircle2,
  Mail,
  Save,
  Plus,
  Trash2,
  Copy,
  ExternalLink,
  X,
  Send,
  Radio,
  Sliders,
  Smartphone,
  Monitor,
  Activity,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Info,
  Clock,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  Palette,
  Type,
  Layout,
  PhoneCall,
  Download,
  Flame,
  CheckSquare,
  Square,
  Server,
  Zap,
  Globe,
} from 'lucide-react';
import { UserProfile, EarthquakeRecord } from '../types';
import { isRecordInCgpAor } from '../utils/earthquakeHelpers';

export interface EmailDesignDraft {
  id: string;
  name: string;
  description: string;
  stationAor: 'CGP' | 'PCP' | 'BIP' | 'ALL';
  status: 'Draft' | 'Review' | 'Active';
  lastUpdated: string;

  // Visual Styling & Typography
  theme: 'official_dost' | 'emergency_crimson' | 'modern_seismic' | 'charcoal_dark' | 'amber_warning';
  headerStyle: 'dost_phivolcs_masthead' | 'alertx_station_header' | 'minimal_compact';
  fontFamily: 'sans' | 'mono' | 'serif';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  primaryColor?: string;
  accentColor?: string;

  // Header & Severity Banner
  severityBanner: boolean;
  severityStyle: 'hero_card' | 'seismograph_bar' | 'compact_badge';

  // Toggleable Design Blocks
  showGeofenceVerification: boolean;
  showTelemetryGrid: boolean;
  showIntensityTable: boolean;
  showSafetyAdvisory: boolean;
  showStationHotlines: boolean;
  showActionButton: boolean;
  showDutySignoff: boolean;

  // Content Templates & Dynamic Tags
  subjectTemplate: string;
  preheaderTemplate: string;
  bodyIntro: string;
  actionButtonText: string;
  actionButtonUrl: string;
  safetyInstructions: string;
  stationHotlinesText: string;
  closingNotes: string;
  dutySeismologistTitle: string;
}

const STORAGE_KEY = 'alertx_aor_email_design_drafts_v2';
const ACTIVE_TEMPLATE_KEY = 'alertx_active_aor_template_id';

// Official territories for CGP
export const CGP_STATION_AOR_TERRITORIES: readonly string[] = [
  'Lanao del Sur',
  'Lanao del Norte',
  'Misamis Oriental',
  'Misamis Occidental',
  'Bukidnon',
  'Cagayan de Oro',
  'Camiguin',
];

// Default station design drafts tailored for actual earthquake bulletins inside station AOR
const DEFAULT_AOR_DESIGN_DRAFTS: EmailDesignDraft[] = [
  {
    id: 'draft-cgp-rapid',
    name: 'CGP Rapid AOR Earthquake Alert (M4.0+)',
    description: 'High-priority automated seismic bulletin layout for urgent dissemination to LGUs and disaster councils within Northern Mindanao AOR.',
    stationAor: 'CGP',
    status: 'Active',
    lastUpdated: 'Oct 4, 2026',
    theme: 'official_dost',
    headerStyle: 'dost_phivolcs_masthead',
    fontFamily: 'sans',
    borderRadius: 'medium',
    primaryColor: '#0f172a',
    accentColor: '#0284c7',
    severityBanner: true,
    severityStyle: 'hero_card',
    showGeofenceVerification: true,
    showTelemetryGrid: true,
    showIntensityTable: true,
    showSafetyAdvisory: true,
    showStationHotlines: true,
    showActionButton: true,
    showDutySignoff: true,
    subjectTemplate: '[PHIVOLCS-CGP ALERT] M {{magnitude}} Earthquake — {{location}} (Within Station AOR)',
    preheaderTemplate: 'Seismic bulletin issued by CGP Station. Event verified within approved Northern Mindanao territorial geofence.',
    bodyIntro:
      'This official seismic notification is automatically dispatched to authorized disaster risk reduction councils, local chief executives, and designated emergency personnel for an earthquake confirmed inside the station Area of Responsibility (AOR).',
    actionButtonText: 'Access Full Earthquake Bulletin & Telemetry in Alert X',
    actionButtonUrl: 'https://alertx.phivolcs.gov.ph/bulletin/{{bulletin_id}}',
    safetyInstructions:
      'Duck, Cover, and Hold during ground shaking. Local DRRM officers in {{province}} are advised to inspect critical lifeline facilities, bridges, and municipal infrastructure. Monitor official channels for potential aftershocks.',
    stationHotlinesText:
      'CGP Station Telemetry Desk: (088) 856-4288 / Mobile: 0917-814-2247 | Regional OCD 10 Hotline: (088) 857-3988 | Email: cgp@phivolcs.dost.gov.ph',
    closingNotes:
      'Seismic telemetry calculated by the Philippine Seismic Network and processed by DOST-PHIVOLCS automated geofence algorithms. AOR perimeter check confirmed inside station boundaries.',
    dutySeismologistTitle: 'Supervising Seismologist, Cagayan de Oro Seismic Station (CGP)',
  },
  {
    id: 'draft-cgp-felt',
    name: 'Major Felt AOR Earthquake & Intensity Advisory (PEIS IV+)',
    description: 'Detailed municipal felt intensity breakdown template with municipal PEIS report table and immediate emergency checklist.',
    stationAor: 'CGP',
    status: 'Review',
    lastUpdated: 'Oct 4, 2026',
    theme: 'emergency_crimson',
    headerStyle: 'alertx_station_header',
    fontFamily: 'sans',
    borderRadius: 'medium',
    primaryColor: '#881337',
    accentColor: '#e11d48',
    severityBanner: true,
    severityStyle: 'hero_card',
    showGeofenceVerification: true,
    showTelemetryGrid: true,
    showIntensityTable: true,
    showSafetyAdvisory: true,
    showStationHotlines: true,
    showActionButton: true,
    showDutySignoff: true,
    subjectTemplate: '[URGENT FELT SEISMIC ADVISORY] M {{magnitude}} — {{location}} (Reported PEIS {{intensity}})',
    preheaderTemplate: 'Moderately strong to strong ground shaking reported inside {{province}}, Northern Mindanao AOR.',
    bodyIntro:
      'A significant seismic event has been registered and verified within our station Area of Responsibility. Observable ground motion has been felt across multiple member municipalities.',
    actionButtonText: 'View Incident Command & Intensity Map',
    actionButtonUrl: 'https://alertx.phivolcs.gov.ph/incident/{{bulletin_id}}',
    safetyInstructions:
      'Expect aftershocks. Stay away from damaged structures, steep mountain slopes susceptible to landslides, and coastal shores if maritime disturbances occur. Coordinate immediately with provincial PDRRMO operations centers.',
    stationHotlinesText:
      'Emergency Dispatch Hotline: (088) 856-4288 | PDRRMO Emergency Desk: Dial 911 | CDO CDRRMO Hotlines: (088) 853-9111',
    closingNotes:
      'Official bulletin issued in accordance with DOST-PHIVOLCS National Earthquake Monitoring Operating Guidelines.',
    dutySeismologistTitle: 'Senior Seismological Observer On-Duty, Regional Seismic Operations Center',
  },
  {
    id: 'draft-cgp-minor',
    name: 'Minor AOR Tremor Routine Digest (M3.0 – M3.9)',
    description: 'Streamlined, low-bandwidth notification design for minor tremors occurring inside station boundaries with minimal disruption.',
    stationAor: 'CGP',
    status: 'Draft',
    lastUpdated: 'Oct 3, 2026',
    theme: 'modern_seismic',
    headerStyle: 'minimal_compact',
    fontFamily: 'mono',
    borderRadius: 'small',
    primaryColor: '#083344',
    accentColor: '#06b6d4',
    severityBanner: false,
    severityStyle: 'compact_badge',
    showGeofenceVerification: true,
    showTelemetryGrid: true,
    showIntensityTable: false,
    showSafetyAdvisory: false,
    showStationHotlines: false,
    showActionButton: true,
    showDutySignoff: true,
    subjectTemplate: '[ROUTINE SEISMIC DIGEST] Minor Tremor: M {{magnitude}} — {{location}}',
    preheaderTemplate: 'Minor seismic tremor recorded inside station AOR. No tsunami or structural threat expected.',
    bodyIntro:
      'A minor earthquake has been recorded by local seismic sensors. Preliminary evaluations confirm the epicenter is within the station Area of Responsibility with no anticipated damage.',
    actionButtonText: 'Review Event Telemetry Log',
    actionButtonUrl: 'https://alertx.phivolcs.gov.ph/events/{{bulletin_id}}',
    safetyInstructions: 'No emergency response action currently required. Routine seismic surveillance continues.',
    stationHotlinesText: 'CGP Monitoring Desk: (088) 856-4288',
    closingNotes: 'Standard seismic bulletin issued for informational reference and research archive.',
    dutySeismologistTitle: 'Duty Seismic Observer, CGP Station',
  },
  {
    id: 'draft-cgp-aftershock',
    name: 'AOR Aftershock Sequence Advisory',
    description: 'Specialized bulletin design focusing on aftershock probability, cumulative structural stress notices, and reassuring public advisories.',
    stationAor: 'CGP',
    status: 'Draft',
    lastUpdated: 'Oct 4, 2026',
    theme: 'amber_warning',
    headerStyle: 'alertx_station_header',
    fontFamily: 'sans',
    borderRadius: 'medium',
    primaryColor: '#78350f',
    accentColor: '#d97706',
    severityBanner: true,
    severityStyle: 'seismograph_bar',
    showGeofenceVerification: true,
    showTelemetryGrid: true,
    showIntensityTable: true,
    showSafetyAdvisory: true,
    showStationHotlines: true,
    showActionButton: true,
    showDutySignoff: true,
    subjectTemplate: '[AFTERSHOCK SEQUENCE ADVISORY] M {{magnitude}} — {{location}} (AOR Surveillance)',
    preheaderTemplate: 'Aftershock sequence monitored in {{province}} jurisdiction following earlier seismic activity.',
    bodyIntro:
      'Station seismographs have recorded an aftershock associated with recent seismic activity inside the station Area of Responsibility. Continuous telemetry monitoring is actively maintained.',
    actionButtonText: 'View Aftershock Sequence Timeline',
    actionButtonUrl: 'https://alertx.phivolcs.gov.ph/sequence/{{bulletin_id}}',
    safetyInstructions:
      'Communities near the epicenter may experience repeated minor to moderate shaking. Stay calm, inspect homes for fresh masonry cracks, and do not enter unstable buildings.',
    stationHotlinesText:
      'Hotline Desk: (088) 856-4288 | Regional DRRM Operation Center: (088) 857-3988',
    closingNotes:
      'Issued by DOST-PHIVOLCS Regional Seismic Center in coordination with National Disaster Risk Reduction & Management Council.',
    dutySeismologistTitle: 'Supervising Seismologist, Cagayan de Oro Seismic Station (CGP)',
  },
];

// Built-in actual earthquakes within CGP AOR covering all 7 territories
interface ActualAorEarthquake {
  id: string;
  magnitude: number;
  location: string;
  province: string;
  municipality: string;
  originTime: string;
  depthKm: number;
  latitude: number;
  longitude: number;
  intensity: string;
  stationName: string;
  stationAor: string;
  sampleIntensities: { locality: string; peis: string }[];
}

const BUILTIN_AOR_EARTHQUAKES: Record<string, ActualAorEarthquake> = {
  'cgp-cdo': {
    id: 'PHIVOLCS-2025-0422-0098',
    magnitude: 3.9,
    location: 'Cagayan de Oro City, Misamis Oriental',
    province: 'Cagayan de Oro',
    municipality: 'Cagayan de Oro',
    originTime: 'Apr 22, 2025 08:27:30 PHT',
    depthKm: 18,
    latitude: 8.482,
    longitude: 124.647,
    intensity: 'PEIS III (Weak)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Cagayan de Oro City Proper', peis: 'Intensity III' },
      { locality: 'Barangay Carmen, Cagayan de Oro', peis: 'Intensity III' },
      { locality: 'Opol, Misamis Oriental', peis: 'Intensity II' },
      { locality: 'Tagoloan, Misamis Oriental', peis: 'Intensity II' },
    ],
  },
  'cgp-marawi': {
    id: 'PHIVOLCS-2025-0422-0091',
    magnitude: 3.6,
    location: 'Marawi City, Lanao del Sur',
    province: 'Lanao del Sur',
    municipality: 'Marawi City',
    originTime: 'Apr 22, 2025 03:12:00 PHT',
    depthKm: 22,
    latitude: 8.003,
    longitude: 124.285,
    intensity: 'PEIS II (Slightly Felt)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Marawi City, Lanao del Sur', peis: 'Intensity II' },
      { locality: 'Saguiaran, Lanao del Sur', peis: 'Intensity II' },
      { locality: 'Iligan City, Lanao del Norte', peis: 'Intensity I' },
    ],
  },
  'cgp-iligan': {
    id: 'PHIVOLCS-2025-0417-0006',
    magnitude: 3.8,
    location: 'Iligan City, Lanao del Norte',
    province: 'Lanao del Norte',
    municipality: 'Iligan City',
    originTime: 'Apr 17, 2025 02:18:02 PM',
    depthKm: 15,
    latitude: 8.228,
    longitude: 124.245,
    intensity: 'PEIS III (Weak)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Iligan City, Lanao del Norte', peis: 'Intensity III' },
      { locality: 'Linamon, Lanao del Norte', peis: 'Intensity III' },
      { locality: 'Lugait, Misamis Oriental', peis: 'Intensity II' },
    ],
  },
  'cgp-tagoloan': {
    id: 'PHIVOLCS-2025-0423-0020',
    magnitude: 4.2,
    location: 'Tagoloan, Misamis Oriental',
    province: 'Misamis Oriental',
    municipality: 'Tagoloan',
    originTime: 'Apr 23, 2025 09:42:15 AM',
    depthKm: 12,
    latitude: 8.541,
    longitude: 124.756,
    intensity: 'PEIS IV (Moderately Strong)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Tagoloan, Misamis Oriental', peis: 'Intensity IV' },
      { locality: 'Cagayan de Oro City', peis: 'Intensity IV' },
      { locality: 'El Salvador City, Misamis Oriental', peis: 'Intensity III' },
      { locality: 'Manolo Fortich, Bukidnon', peis: 'Intensity III' },
    ],
  },
  'cgp-malaybalay': {
    id: 'PHIVOLCS-2025-0418-0015',
    magnitude: 3.5,
    location: 'Malaybalay City, Bukidnon',
    province: 'Bukidnon',
    municipality: 'Malaybalay City',
    originTime: 'Apr 18, 2025 11:05:40 AM',
    depthKm: 20,
    latitude: 8.156,
    longitude: 125.127,
    intensity: 'PEIS III (Weak)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Malaybalay City, Bukidnon', peis: 'Intensity III' },
      { locality: 'Valencia City, Bukidnon', peis: 'Intensity II' },
      { locality: 'Impasugong, Bukidnon', peis: 'Intensity II' },
    ],
  },
  'cgp-mambajao': {
    id: 'PHIVOLCS-2025-0419-0008',
    magnitude: 3.3,
    location: 'Mambajao, Camiguin',
    province: 'Camiguin',
    municipality: 'Mambajao',
    originTime: 'Apr 19, 2025 06:14:22 AM',
    depthKm: 9,
    latitude: 9.251,
    longitude: 124.717,
    intensity: 'PEIS II (Slightly Felt)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Mambajao, Camiguin', peis: 'Intensity II' },
      { locality: 'Catarman, Camiguin', peis: 'Intensity II' },
      { locality: 'Mahinog, Camiguin', peis: 'Intensity I' },
    ],
  },
  'cgp-ozamiz': {
    id: 'PHIVOLCS-2025-0421-0006',
    magnitude: 3.7,
    location: 'Ozamiz City, Misamis Occidental',
    province: 'Misamis Occidental',
    municipality: 'Ozamiz City',
    originTime: 'Apr 21, 2025 07:40:10 PM',
    depthKm: 25,
    latitude: 8.148,
    longitude: 123.842,
    intensity: 'PEIS III (Weak)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Ozamiz City, Misamis Occidental', peis: 'Intensity III' },
      { locality: 'Tangub City, Misamis Occidental', peis: 'Intensity II' },
      { locality: 'Clarin, Misamis Occidental', peis: 'Intensity II' },
    ],
  },
};

const AOR_VARIABLE_TAGS = [
  { tag: '{{magnitude}}', desc: 'Calculated Richter magnitude (e.g. 3.9)' },
  { tag: '{{location}}', desc: 'Official locality string (e.g. Cagayan de Oro City, Misamis Oriental)' },
  { tag: '{{province}}', desc: 'Station AOR Member territory (e.g. Bukidnon, Lanao del Sur, Misamis Oriental)' },
  { tag: '{{municipality}}', desc: 'Epicenter town or city (e.g. Marawi City, Tagoloan)' },
  { tag: '{{origin_time}}', desc: 'Philippine Standard Time date & time of seismic rupture' },
  { tag: '{{depth_km}}', desc: 'Calculated focal depth in kilometers (e.g. 18)' },
  { tag: '{{latitude}}', desc: 'Epicenter latitude coordinate (e.g. 8.482°N)' },
  { tag: '{{longitude}}', desc: 'Epicenter longitude coordinate (e.g. 124.647°E)' },
  { tag: '{{intensity}}', desc: 'Reported maximum PEIS intensity (e.g. PEIS III - Weak)' },
  { tag: '{{station_name}}', desc: 'Designated PHIVOLCS station name' },
  { tag: '{{station_aor}}', desc: 'Station AOR code (e.g. CGP)' },
  { tag: '{{bulletin_id}}', desc: 'Unique sequence bulletin tracking identifier' },
];

interface EmailDesignTemplateViewProps {
  currentUser?: UserProfile;
  onNavigateToAudit?: () => void;
  earthquakes?: EarthquakeRecord[];
}

export const EmailDesignTemplateView: React.FC<EmailDesignTemplateViewProps> = ({
  currentUser,
  onNavigateToAudit,
  earthquakes = [],
}) => {
  // Scoped station code
  const stationCode =
    currentUser?.assignedAor === 'PCP'
      ? 'PCP'
      : currentUser?.assignedAor === 'BIP'
      ? 'BIP'
      : 'CGP';

  const stationDisplayName =
    stationCode === 'CGP'
      ? 'Cagayan de Oro Seismic Station (CGP)'
      : stationCode === 'PCP'
      ? 'Palayan Seismic Station (PCP)'
      : 'Bislig Seismic Station (BIP)';

  // Official monitored territories for station
  const stationMonitoredTerritories = useMemo(() => {
    if (stationCode === 'CGP') {
      return CGP_STATION_AOR_TERRITORIES;
    }
    if (stationCode === 'PCP') {
      return ['Nueva Ecija', 'Aurora', 'Bulacan', 'Pampanga', 'Tarlac', 'Pangasinan', 'Nueva Vizcaya', 'Quirino', 'Zambales', 'Bataan'];
    }
    return ['Surigao del Sur', 'Agusan del Sur', 'Davao Oriental', 'Davao de Oro'];
  }, [stationCode]);

  // Load saved drafts from localStorage
  const [drafts, setDrafts] = useState<EmailDesignDraft[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_AOR_DESIGN_DRAFTS;
  });

  const [activeDraftId, setActiveDraftId] = useState<string>(() => {
    try {
      const savedActive = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
      if (savedActive && drafts.some((d) => d.id === savedActive)) {
        return savedActive;
      }
    } catch {
      // ignore
    }
    return drafts[0]?.id || 'draft-cgp-rapid';
  });

  const activeDraft = useMemo(() => {
    return drafts.find((d) => d.id === activeDraftId) || drafts[0];
  }, [drafts, activeDraftId]);

  // Real PHIVOLCS earthquakes for live template preview (strictly inside station AOR)
  const availableAorEarthquakes = useMemo<Record<string, ActualAorEarthquake>>(() => {
    const map: Record<string, ActualAorEarthquake> = {};

    // First add real earthquakes passed from App.tsx matching station AOR
    earthquakes.forEach((eq) => {
      if (eq.aor === 'CGP' && isRecordInCgpAor(eq)) {
        const key = eq.id;
        map[key] = {
          id: eq.id,
          magnitude: eq.magnitude,
          location: eq.location,
          province: eq.province || 'Misamis Oriental',
          municipality: eq.municipality || 'Cagayan de Oro',
          originTime: eq.timePHT,
          depthKm: eq.depthKm,
          latitude: eq.coordinates?.lat || 8.482,
          longitude: eq.coordinates?.lng || 124.647,
          intensity: eq.intensity || 'PEIS III - Weak',
          stationName: stationDisplayName,
          stationAor: 'CGP',
          sampleIntensities: [
            { locality: eq.location, peis: eq.intensity || 'Intensity III' },
            { locality: 'Nearby LGU Monitoring Sector', peis: 'Intensity II' },
          ],
        };
      }
    });

    // If no CGP events yet, inject real Inside AOR records
    if (Object.keys(map).length === 0) {
      earthquakes.filter((e) => e.aorStatus === 'Inside').slice(0, 15).forEach((eq) => {
        map[eq.id] = {
          id: eq.id,
          magnitude: eq.magnitude,
          location: eq.location,
          province: eq.province || 'Philippine Seismic Network',
          municipality: eq.municipality || eq.location,
          originTime: eq.timePHT,
          depthKm: eq.depthKm,
          latitude: eq.coordinates?.lat || 8.8,
          longitude: eq.coordinates?.lng || 126.7,
          intensity: eq.intensity || 'PEIS III - Weak',
          stationName: eq.stationName || stationDisplayName,
          stationAor: eq.aor || 'CGP',
          sampleIntensities: [
            { locality: eq.location, peis: eq.intensity || 'Intensity III' },
          ],
        };
      });
    }

    return map;
  }, [earthquakes, stationDisplayName]);

  // Selected actual earthquake for live preview within station AOR
  const availableKeys = useMemo(() => Object.keys(availableAorEarthquakes), [availableAorEarthquakes]);
  const [selectedEarthquakeKey, setSelectedEarthquakeKey] = useState<string>('');

  useEffect(() => {
    if ((!selectedEarthquakeKey || !availableAorEarthquakes[selectedEarthquakeKey]) && availableKeys.length > 0) {
      setSelectedEarthquakeKey(availableKeys[0]);
    }
  }, [availableKeys, availableAorEarthquakes, selectedEarthquakeKey]);

  const previewEvent = availableAorEarthquakes[selectedEarthquakeKey] || availableAorEarthquakes[availableKeys[0]] || {
    id: 'PHIVOLCS-LIVE',
    magnitude: 3.5,
    location: 'Real PHIVOLCS Live Telemetry',
    province: 'Misamis Oriental',
    municipality: 'Cagayan de Oro City',
    originTime: 'Live Real-Time PHIVOLCS Feed',
    depthKm: 15,
    latitude: 8.482,
    longitude: 124.647,
    intensity: 'PEIS III (Weak)',
    stationName: 'Cagayan de Oro Seismic Station (CGP)',
    stationAor: 'CGP',
    sampleIntensities: [
      { locality: 'Cagayan de Oro City Proper', peis: 'Intensity III' },
    ],
  };

  // Viewport mode
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile' | 'code'>('desktop');

  // Toast notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals & Dispatch State
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('alertx_test_recipient');
      if (saved && saved.includes('@')) return saved;
    } catch {}
    return 'ebardo.glynbryan1@gmail.com';
  });
  const [deliveryEngine, setDeliveryEngine] = useState<'smtp' | 'brevo' | 'resend'>(() => {
    try {
      const saved = localStorage.getItem('alertx_delivery_engine');
      if (saved === 'smtp' || saved === 'resend') return saved;
    } catch {}
    return 'smtp';
  });
  const [testSending, setTestSending] = useState(false);
  const [lastDispatchResult, setLastDispatchResult] = useState<{
    success: boolean;
    messageId: string;
    to: string;
    time: string;
    provider: string;
    notice?: string;
  } | null>(null);
  const [isNewDraftModalOpen, setIsNewDraftModalOpen] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');
  const [newDraftPreset, setNewDraftPreset] = useState<'rapid' | 'felt' | 'minor' | 'aftershock' | 'blank'>('rapid');

  // Persistence handler
  const saveDraftsToStorage = (updatedDrafts: EmailDesignDraft[]) => {
    setDrafts(updatedDrafts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDrafts));
    } catch {
      // ignore
    }
  };

  // Update active draft field
  const updateActiveDraft = (field: keyof EmailDesignDraft, value: any) => {
    const updated = drafts.map((d) => {
      if (d.id === activeDraft.id) {
        return {
          ...d,
          [field]: value,
          lastUpdated: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };
      }
      return d;
    });
    saveDraftsToStorage(updated);
  };

  // Save draft
  const handleSaveDraft = () => {
    saveDraftsToStorage(drafts);
    showToast(`Draft "${activeDraft.name}" saved to station templates.`);
  };

  // Set as primary active template
  const handleSetActiveTemplate = () => {
    const updated = drafts.map((d) => ({
      ...d,
      status: d.id === activeDraft.id ? ('Active' as const) : d.status === 'Active' ? ('Draft' as const) : d.status,
    }));
    saveDraftsToStorage(updated);
    try {
      localStorage.setItem(ACTIVE_TEMPLATE_KEY, activeDraft.id);
    } catch {
      // ignore
    }
    showToast(`"${activeDraft.name}" is now the active station email alert template.`);
  };

  // Duplicate draft
  const handleDuplicateDraft = () => {
    const newId = `draft-${Date.now()}`;
    const copy: EmailDesignDraft = {
      ...activeDraft,
      id: newId,
      name: `${activeDraft.name} (Copy)`,
      status: 'Draft',
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    const updated = [copy, ...drafts];
    saveDraftsToStorage(updated);
    setActiveDraftId(newId);
    showToast(`Duplicated draft created: "${copy.name}".`);
  };

  // Delete draft
  const handleDeleteDraft = () => {
    if (drafts.length <= 1) {
      showToast('Cannot delete the only remaining template draft.');
      return;
    }
    const remaining = drafts.filter((d) => d.id !== activeDraft.id);
    saveDraftsToStorage(remaining);
    setActiveDraftId(remaining[0].id);
    showToast(`Draft "${activeDraft.name}" deleted.`);
  };

  // Create new draft
  const handleCreateNewDraft = () => {
    if (!newDraftName.trim()) {
      showToast('Please provide a name for the new draft template.');
      return;
    }

    const newId = `draft-${Date.now()}`;
    let templateData: Partial<EmailDesignDraft> = {};

    if (newDraftPreset === 'felt') {
      templateData = {
        theme: 'emergency_crimson',
        headerStyle: 'alertx_station_header',
        severityBanner: true,
        severityStyle: 'hero_card',
        showIntensityTable: true,
        showSafetyAdvisory: true,
        showStationHotlines: true,
        subjectTemplate: '[URGENT FELT SEISMIC ADVISORY] M {{magnitude}} — {{location}}',
        preheaderTemplate: 'Felt earthquake verified inside {{province}}, Northern Mindanao AOR.',
        safetyInstructions: 'Duck, Cover, and Hold. Coordinate with provincial PDRRMO for aftershock assessment.',
      };
    } else if (newDraftPreset === 'minor') {
      templateData = {
        theme: 'modern_seismic',
        headerStyle: 'minimal_compact',
        severityBanner: false,
        severityStyle: 'compact_badge',
        showIntensityTable: false,
        showSafetyAdvisory: false,
        showStationHotlines: false,
        subjectTemplate: '[ROUTINE SEISMIC DIGEST] Minor Tremor: M {{magnitude}} — {{location}}',
        preheaderTemplate: 'Minor seismic tremor recorded inside station AOR.',
        safetyInstructions: 'Routine seismic surveillance ongoing. No alert action required.',
      };
    } else if (newDraftPreset === 'aftershock') {
      templateData = {
        theme: 'amber_warning',
        headerStyle: 'alertx_station_header',
        severityBanner: true,
        severityStyle: 'seismograph_bar',
        showIntensityTable: true,
        showSafetyAdvisory: true,
        showStationHotlines: true,
        subjectTemplate: '[AFTERSHOCK SEQUENCE ADVISORY] M {{magnitude}} — {{location}}',
        preheaderTemplate: 'Aftershock sequence monitored in {{province}} jurisdiction.',
        safetyInstructions: 'Remain alert for subsequent tremors. Check residences for structural instability.',
      };
    } else if (newDraftPreset === 'blank') {
      templateData = {
        theme: 'official_dost',
        headerStyle: 'dost_phivolcs_masthead',
        severityBanner: true,
        severityStyle: 'hero_card',
        showIntensityTable: false,
        showSafetyAdvisory: true,
        showStationHotlines: true,
        subjectTemplate: '[SEISMIC BULLETIN] M {{magnitude}} — {{location}}',
        preheaderTemplate: 'Seismic advisory dispatched for station AOR.',
        safetyInstructions: 'Follow official PHIVOLCS instructions and stay informed.',
      };
    } else {
      templateData = {
        theme: 'official_dost',
        headerStyle: 'dost_phivolcs_masthead',
        severityBanner: true,
        severityStyle: 'hero_card',
        showIntensityTable: true,
        showSafetyAdvisory: true,
        showStationHotlines: true,
        subjectTemplate: '[PHIVOLCS-{{station_aor}} ALERT] M {{magnitude}} Earthquake — {{location}}',
        preheaderTemplate: 'Official seismic bulletin for earthquake inside {{station_aor}} Station AOR.',
        safetyInstructions: 'Duck, Cover, and Hold during ground shaking. Follow official PHIVOLCS instructions.',
      };
    }

    const newDraft: EmailDesignDraft = {
      id: newId,
      name: newDraftName.trim(),
      description: `Custom earthquake alert design draft for ${stationDisplayName}.`,
      stationAor: stationCode as any,
      status: 'Draft',
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      theme: templateData.theme || 'official_dost',
      headerStyle: templateData.headerStyle || 'dost_phivolcs_masthead',
      fontFamily: 'sans',
      borderRadius: 'medium',
      severityBanner: templateData.severityBanner ?? true,
      severityStyle: templateData.severityStyle || 'hero_card',
      showGeofenceVerification: true,
      showTelemetryGrid: true,
      showIntensityTable: templateData.showIntensityTable ?? true,
      showSafetyAdvisory: templateData.showSafetyAdvisory ?? true,
      showStationHotlines: templateData.showStationHotlines ?? true,
      showActionButton: true,
      showDutySignoff: true,
      subjectTemplate: templateData.subjectTemplate || '[PHIVOLCS ALERT] M {{magnitude}} — {{location}}',
      preheaderTemplate: templateData.preheaderTemplate || 'Earthquake verified inside station AOR.',
      bodyIntro:
        'This official seismic notification is dispatched to registered disaster management councils and emergency responders for an earthquake verified inside the station Area of Responsibility (AOR).',
      actionButtonText: 'View Official Earthquake Bulletin in Alert X',
      actionButtonUrl: 'https://alertx.phivolcs.gov.ph/bulletin/{{bulletin_id}}',
      safetyInstructions:
        templateData.safetyInstructions ||
        'Duck, Cover, and Hold during ground shaking. Local DRRM officers are advised to inspect critical facilities.',
      stationHotlinesText:
        'CGP Station Hotlines: (088) 856-4288 | Regional OCD Hotline: (088) 857-3988',
      closingNotes:
        'Data generated by the Philippine Seismic Network and processed by DOST-PHIVOLCS automated geofence algorithms.',
      dutySeismologistTitle: `Duty Seismologist, ${stationDisplayName}`,
    };

    const updated = [newDraft, ...drafts];
    saveDraftsToStorage(updated);
    setActiveDraftId(newId);
    setNewDraftName('');
    setIsNewDraftModalOpen(false);
    showToast(`Created new email design draft: "${newDraft.name}".`);
  };

  // Helper to substitute dynamic tags with actual earthquake values
  const substituteVariables = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{{magnitude}}/g, previewEvent.magnitude.toFixed(1))
      .replace(/{{location}}/g, previewEvent.location)
      .replace(/{{province}}/g, previewEvent.province)
      .replace(/{{municipality}}/g, previewEvent.municipality)
      .replace(/{{origin_time}}/g, previewEvent.originTime)
      .replace(/{{depth_km}}/g, String(previewEvent.depthKm))
      .replace(/{{latitude}}/g, `${previewEvent.latitude.toFixed(3)}°N`)
      .replace(/{{longitude}}/g, `${previewEvent.longitude.toFixed(3)}°E`)
      .replace(/{{intensity}}/g, previewEvent.intensity)
      .replace(/{{station_name}}/g, previewEvent.stationName)
      .replace(/{{station_aor}}/g, previewEvent.stationAor)
      .replace(/{{bulletin_id}}/g, previewEvent.id);
  };

  // Insert tag helper
  const handleInsertTag = (tag: string, field: 'subjectTemplate' | 'preheaderTemplate' | 'bodyIntro' | 'safetyInstructions') => {
    const current = activeDraft[field];
    updateActiveDraft(field, `${current} ${tag}`);
    showToast(`Inserted ${tag} into template.`);
  };

  // Send actual test email
  const handleSendTestEmail = async (overrideRecipient?: string) => {
    const targetRecipient = (overrideRecipient || testEmailRecipient || 'ebardo.glynbryan1@gmail.com').trim();
    if (!targetRecipient || !targetRecipient.includes('@')) {
      showToast('Please enter a valid recipient email address.');
      return;
    }
    setTestSending(true);
    try {
      localStorage.setItem('alertx_test_recipient', targetRecipient);
      let savedSmtpConfig;
      let savedBrevoKey = '';
      let savedBrevoSender = '';
      let savedBrevoSenderName = '';
      let savedResendKey = '';
      try {
        const stored = localStorage.getItem('alertx_smtp_config');
        if (stored) savedSmtpConfig = JSON.parse(stored);
        savedBrevoKey = localStorage.getItem('alertx_brevo_api_key') || '';
        savedBrevoSender = localStorage.getItem('alertx_brevo_sender') || '';
        savedBrevoSenderName = localStorage.getItem('alertx_brevo_sender_name') || '';
        savedResendKey = localStorage.getItem('alertx_resend_api_key') || '';
      } catch {}

      const engineToUse = deliveryEngine || 'smtp';
      const isCustomSmtp = Boolean(savedSmtpConfig?.user && savedSmtpConfig?.pass);

      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetRecipient,
          subject: substituteVariables(activeDraft.subjectTemplate),
          html: generatedHtmlCode,
          template: activeDraft.name,
          sampleEvent: previewEvent.location,
          record: {
            id: previewEvent.id,
            timePHT: previewEvent.originTime,
            location: previewEvent.location,
            province: previewEvent.province,
            municipality: previewEvent.municipality,
            magnitude: previewEvent.magnitude,
            depthKm: previewEvent.depthKm,
            coordinates: { lat: previewEvent.latitude, lng: previewEvent.longitude },
            aor: previewEvent.stationAor,
            stationName: previewEvent.stationName,
            intensity: previewEvent.intensity,
          },
          provider: engineToUse,
          brevoApiKey: savedBrevoKey,
          brevoSenderEmail: savedBrevoSender,
          brevoSenderName: savedBrevoSenderName,
          resendApiKey: savedResendKey,
          smtpConfig: isCustomSmtp ? savedSmtpConfig : undefined,
        }),
      });

      const data = await res.json();
      setTestSending(false);

      if (data.success) {
        const confirmedRecipient = (data.accepted && data.accepted[0]) || targetRecipient;
        setLastDispatchResult({
          success: true,
          messageId: data.messageId,
          to: confirmedRecipient,
          time: new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }).format(new Date()),
          provider: data.provider || 'Direct SMTP Relay (Port 465 SSL)',
          notice: data.message,
        });
        setIsTestEmailModalOpen(false);
        showToast(`Template test email successfully dispatched to ${confirmedRecipient}! Check inbox.`);
      } else {
        showToast(`Failed to send test email: ${data.error || 'Check server connection'}`);
      }
    } catch (err: any) {
      setTestSending(false);
      showToast(`Network error sending test email: ${err.message}`);
    }
  };

  // Production HTML generator with inline styles for email client compatibility
  const generatedHtmlCode = useMemo(() => {
    const renderedSubject = substituteVariables(activeDraft.subjectTemplate);
    const renderedPreheader = substituteVariables(activeDraft.preheaderTemplate);
    const renderedBodyIntro = substituteVariables(activeDraft.bodyIntro);
    const renderedSafety = substituteVariables(activeDraft.safetyInstructions);
    const renderedClosing = substituteVariables(activeDraft.closingNotes);
    const renderedHotlines = substituteVariables(activeDraft.stationHotlinesText);

    const themeColors = {
      official_dost: { header: '#0f172a', accent: '#0284c7', magBg: '#f8fafc', border: '#e2e8f0' },
      emergency_crimson: { header: '#881337', accent: '#e11d48', magBg: '#fff1f2', border: '#fecdd3' },
      modern_seismic: { header: '#083344', accent: '#06b6d4', magBg: '#ecfeff', border: '#a5f3fc' },
      charcoal_dark: { header: '#18181b', accent: '#71717a', magBg: '#fafafa', border: '#e4e4e7' },
      amber_warning: { header: '#78350f', accent: '#d97706', magBg: '#fffbeb', border: '#fde68a' },
    }[activeDraft.theme];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${renderedSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b; }
    .email-wrapper { max-width: 600px; margin: 24px auto; background-color: #ffffff; border: 1px solid ${themeColors.border}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .masthead { background-color: ${themeColors.header}; padding: 20px 24px; color: #ffffff; }
    .masthead-title { font-size: 15px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; }
    .masthead-sub { font-size: 11px; color: #cbd5e1; margin-top: 3px; }
    .geofence-banner { background-color: #ecfdf5; border-bottom: 1px solid #a7f3d0; color: #065f46; padding: 10px 24px; font-size: 11px; font-weight: 700; display: flex; align-items: center; }
    .hero-banner { padding: 20px 24px; background-color: ${themeColors.magBg}; border-bottom: 2px solid ${themeColors.accent}; }
    .mag-text { font-size: 30px; font-weight: 900; color: #0f172a; line-height: 1; }
    .loc-text { font-size: 14px; font-weight: 700; color: #0369a1; margin-top: 4px; }
    .time-text { font-size: 11px; color: #64748b; margin-top: 2px; }
    .content-body { padding: 24px; }
    .telemetry-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12px; }
    .telemetry-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
    .telemetry-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .telemetry-table td.val { font-weight: 700; color: #0f172a; font-family: monospace; }
    .intensity-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin: 16px 0; }
    .safety-box { background-color: #fffbeb; border: 1px solid #fef3c7; color: #92400e; border-radius: 8px; padding: 12px; font-size: 11px; margin: 16px 0; }
    .cta-container { text-align: center; margin: 24px 0 16px 0; }
    .cta-btn { display: inline-block; background-color: ${themeColors.accent}; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 13px; }
    .hotlines-box { background-color: #f1f5f9; border-radius: 8px; padding: 10px 14px; font-size: 10px; color: #475569; margin: 16px 0; }
    .footer { padding: 20px 24px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${renderedPreheader}
  </div>
  <div class="email-wrapper">
    <div class="masthead">
      <div class="masthead-title">DOST-PHIVOLCS ALERT X</div>
      <div class="masthead-sub">${previewEvent.stationName} • Area of Responsibility Operations</div>
    </div>
    ${
      activeDraft.showGeofenceVerification
        ? `<div class="geofence-banner">
      ✓ VERIFIED INSIDE STATION AOR: ${previewEvent.province} (${previewEvent.stationAor} Jurisdiction)
    </div>`
        : ''
    }
    ${
      activeDraft.severityBanner
        ? `<div class="hero-banner">
      <div class="mag-text">Magnitude ${previewEvent.magnitude.toFixed(1)}</div>
      <div class="loc-text">${previewEvent.location}</div>
      <div class="time-text">Origin Time: ${previewEvent.originTime}</div>
    </div>`
        : ''
    }
    <div class="content-body">
      <p style="font-size:12px;line-height:1.6;color:#334155;margin-top:0;">${renderedBodyIntro}</p>
      ${
        activeDraft.showTelemetryGrid
          ? `<table class="telemetry-table">
        <tr><td class="label">Bulletin ID</td><td class="val">${previewEvent.id}</td></tr>
        <tr><td class="label">Magnitude</td><td class="val">M ${previewEvent.magnitude.toFixed(1)}</td></tr>
        <tr><td class="label">Focal Depth</td><td class="val">${previewEvent.depthKm} km</td></tr>
        <tr><td class="label">Coordinates</td><td class="val">${previewEvent.latitude.toFixed(3)}°N, ${previewEvent.longitude.toFixed(3)}°E</td></tr>
        <tr><td class="label">Epicenter Locality</td><td class="val">${previewEvent.location}</td></tr>
        <tr><td class="label">AOR Territory</td><td class="val">${previewEvent.province}</td></tr>
        <tr><td class="label">Issuing Station</td><td class="val">${previewEvent.stationName}</td></tr>
      </table>`
          : ''
      }
      ${
        activeDraft.showIntensityTable
          ? `<div class="intensity-box">
        <div style="font-size:11px;font-weight:700;color:#0f172a;margin-bottom:8px;">Reported Town-Level PEIS Felt Intensities:</div>
        ${previewEvent.sampleIntensities
          .map(
            (si) =>
              `<div style="display:flex;justify-content:space-between;font-size:11px;padding:3px 0;border-bottom:1px dashed #e2e8f0;">
            <span style="color:#334155;">${si.locality}</span>
            <span style="font-weight:700;color:#0284c7;">${si.peis}</span>
          </div>`
          )
          .join('')}
      </div>`
          : ''
      }
      ${
        activeDraft.showSafetyAdvisory
          ? `<div class="safety-box">
        <strong>Safety Advisory:</strong> ${renderedSafety}
      </div>`
          : ''
      }
      ${
        activeDraft.showActionButton
          ? `<div class="cta-container">
        <a href="${activeDraft.actionButtonUrl.replace(/{{bulletin_id}}/g, previewEvent.id)}" class="cta-btn">${activeDraft.actionButtonText}</a>
      </div>`
          : ''
      }
      ${
        activeDraft.showStationHotlines
          ? `<div class="hotlines-box">
        <strong>Emergency Response Directory:</strong><br>${renderedHotlines}
      </div>`
          : ''
      }
    </div>
    <div class="footer">
      ${
        activeDraft.showDutySignoff
          ? `<div><strong>Authority:</strong> ${activeDraft.dutySeismologistTitle}</div>`
          : ''
      }
      <div style="margin-top:6px;">${renderedClosing}</div>
      <div style="margin-top:8px;font-size:10px;color:#94a3b8;">
        Official earthquake bulletin dispatched strictly for seismic events verified within station territorial boundaries.
      </div>
    </div>
  </div>
</body>
</html>`;
  }, [activeDraft, previewEvent]);

  return (
    <div className="space-y-4 pb-12 max-w-[1720px] mx-auto font-sans antialiased text-slate-800 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Banner: Dedicated AOR Designing Studio */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-cyan-600 animate-pulse" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              AOR Earthquake Email Design Studio
            </h1>
            <span className="text-[11px] font-mono font-bold bg-cyan-50 text-cyan-700 px-2.5 py-0.5 rounded-full border border-cyan-200">
              {stationCode} AOR Mode
            </span>
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Template Designer Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Create, customize, and refine draft email designs created exclusively as templates for dispatching actual earthquake bulletins inside the{' '}
            <strong>{stationDisplayName}</strong> Area of Responsibility.
          </p>
        </div>

        {/* Global Studio Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsNewDraftModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Design Draft</span>
          </button>

          <button
            type="button"
            onClick={handleSetActiveTemplate}
            className="border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Make this draft the primary template for inside AOR alerts"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Set as Active Template</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicateDraft}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            title="Duplicate active draft"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Duplicate</span>
          </button>

          <button
            type="button"
            onClick={() => setIsHtmlModalOpen(true)}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            title="View production responsive HTML"
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>Export HTML</span>
          </button>

          {/* Send Test Email Action Group */}
          <div className="flex items-center rounded-xl bg-blue-600 text-white shadow-xs overflow-hidden">
            <button
              type="button"
              disabled={testSending}
              onClick={() => handleSendTestEmail()}
              className="hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 transition-colors cursor-pointer"
              title={`Send test email immediately to ${testEmailRecipient}`}
            >
              {testSending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-blue-200" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsTestEmailModalOpen(true)}
              className="border-l border-blue-500/80 hover:bg-blue-700 px-2.5 py-2 text-blue-100 hover:text-white transition-colors"
              title="Configure recipient or SMTP channels"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="bg-slate-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* Live Test Bulletin Dispatch Success Banner */}
      {lastDispatchResult && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="font-bold text-emerald-900 flex items-center gap-2">
                <span>Test Bulletin Successfully Dispatched to {lastDispatchResult.to}</span>
                <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  250 OK Delivered
                </span>
              </div>
              <div className="text-[11px] text-emerald-800 mt-0.5 flex flex-wrap items-center gap-2">
                <span>Engine: <strong>{lastDispatchResult.provider}</strong></span>
                <span>•</span>
                <span>Time: <strong>{lastDispatchResult.time}</strong></span>
                <span>•</span>
                <span className="font-mono text-[10px] text-emerald-700">Message ID: {lastDispatchResult.messageId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              disabled={testSending}
              onClick={() => handleSendTestEmail()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
            >
              Send Another Test
            </button>
            <button
              type="button"
              onClick={() => setLastDispatchResult(null)}
              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Station AOR Territory Clearance Ribbon */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 text-white rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs border border-slate-800">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold flex items-center gap-2 text-cyan-200">
              <span>Station Territorial Geofence Scope: {stationDisplayName}</span>
              <span className="text-[10px] font-mono bg-cyan-900/80 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700">
                Inside AOR Template Engine
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5 flex flex-wrap items-center gap-1.5">
              <span>Monitored AOR Jurisdictions:</span>
              {stationMonitoredTerritories.map((t) => (
                <span
                  key={t}
                  className="bg-slate-800 text-cyan-200 px-1.5 py-0.5 rounded text-[10px] font-medium border border-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Draft Tabs Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 overflow-x-auto self-start md:self-auto max-w-full">
          {drafts.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDraftId(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                d.id === activeDraft.id
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  d.status === 'Active'
                    ? 'bg-emerald-400'
                    : d.status === 'Review'
                    ? 'bg-amber-400'
                    : 'bg-slate-400'
                }`}
              />
              <span className="truncate max-w-[150px]">{d.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Designing Studio Workspace (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            COLUMN 1: DESIGN CONTROLS & LAYOUT CUSTOMIZER (4 cols)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Design Specifications & Meta */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Draft Specifications
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeDraft.id}
              </span>
            </div>

            {/* Template Name & Status */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Draft Template Title
                </label>
                <input
                  type="text"
                  value={activeDraft.name}
                  onChange={(e) => updateActiveDraft('name', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Template Description
                </label>
                <input
                  type="text"
                  value={activeDraft.description}
                  onChange={(e) => updateActiveDraft('description', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Station Jurisdiction
                  </label>
                  <select
                    value={activeDraft.stationAor}
                    onChange={(e) => updateActiveDraft('stationAor', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="CGP">CGP (Northern Mindanao)</option>
                    <option value="PCP">PCP (Central Luzon)</option>
                    <option value="BIP">BIP (Caraga/Eastern)</option>
                    <option value="ALL">All Station Networks</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Design Status
                  </label>
                  <select
                    value={activeDraft.status}
                    onChange={(e) => updateActiveDraft('status', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="Draft">Draft (Editing)</option>
                    <option value="Review">Station Review</option>
                    <option value="Active">Active Production Template</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Visual Theme Selection */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-600" />
                  <span>Seismic Theme & Color Scheme</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'official_dost', name: 'DOST Official Navy', color: 'bg-slate-900 border-blue-600' },
                  { id: 'emergency_crimson', name: 'Emergency Crimson', color: 'bg-rose-900 border-rose-600' },
                  { id: 'modern_seismic', name: 'Modern Cyan Alert', color: 'bg-cyan-950 border-cyan-500' },
                  { id: 'amber_warning', name: 'Seismic Amber Warning', color: 'bg-amber-900 border-amber-500' },
                  { id: 'charcoal_dark', name: 'Telegraphic Minimal', color: 'bg-slate-800 border-slate-400' },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => updateActiveDraft('theme', th.id)}
                    className={`p-2 rounded-xl border text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                      activeDraft.theme === th.id
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${th.color} shrink-0`} />
                    <span className="text-[11px] leading-tight">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header Style & Typography */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Header Masthead
                </label>
                <select
                  value={activeDraft.headerStyle}
                  onChange={(e) => updateActiveDraft('headerStyle', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl outline-none"
                >
                  <option value="dost_phivolcs_masthead">DOST-PHIVOLCS Masthead</option>
                  <option value="alertx_station_header">Alert X Station Header</option>
                  <option value="minimal_compact">Minimal Compact</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Typography
                </label>
                <select
                  value={activeDraft.fontFamily}
                  onChange={(e) => updateActiveDraft('fontFamily', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl outline-none"
                >
                  <option value="sans">Clean System Sans</option>
                  <option value="mono">Technical Monospace</option>
                  <option value="serif">Official Serif</option>
                </select>
              </div>
            </div>

            {/* Toggleable Design Blocks */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Design Blocks
                </label>
                <span className="text-[10px] text-slate-400">Toggle sections</span>
              </div>

              <div className="space-y-1.5 text-xs font-medium text-slate-700">
                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Magnitude & Severity Hero Card</span>
                  <input
                    type="checkbox"
                    checked={activeDraft.severityBanner}
                    onChange={(e) => updateActiveDraft('severityBanner', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <span>AOR Geofence Verification Stamp</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">✓ Station Stamp</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={activeDraft.showGeofenceVerification}
                    onChange={(e) => updateActiveDraft('showGeofenceVerification', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Hypocenter Telemetry Grid</span>
                  <input
                    type="checkbox"
                    checked={activeDraft.showTelemetryGrid}
                    onChange={(e) => updateActiveDraft('showTelemetryGrid', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Town-Level Reported PEIS Intensities</span>
                  <input
                    type="checkbox"
                    checked={activeDraft.showIntensityTable}
                    onChange={(e) => updateActiveDraft('showIntensityTable', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Safety Advisory & Aftershock Notice</span>
                  <input
                    type="checkbox"
                    checked={activeDraft.showSafetyAdvisory}
                    onChange={(e) => updateActiveDraft('showSafetyAdvisory', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Station Hotline & Emergency Directory</span>
                  <input
                    type="checkbox"
                    checked={activeDraft.showStationHotlines}
                    onChange={(e) => updateActiveDraft('showStationHotlines', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>LGU Disaster Action Portal Button (CTA)</span>
                  <input
                    type="checkbox"
                    checked={activeDraft.showActionButton}
                    onChange={(e) => updateActiveDraft('showActionButton', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <span>Duty Seismologist Official Sign-Off</span>
                  <input
                    type="checkbox"
                    checked={activeDraft.showDutySignoff}
                    onChange={(e) => updateActiveDraft('showDutySignoff', e.target.checked)}
                    className="rounded text-blue-600"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Email Copy & Dynamic Tags Editor */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Email Copy & Dynamic Tags
                </h3>
              </div>
            </div>

            {/* Subject Template */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Email Subject Line
                </label>
                <button
                  type="button"
                  onClick={() => handleInsertTag('{{magnitude}}', 'subjectTemplate')}
                  className="text-[10px] text-blue-600 font-semibold hover:underline"
                >
                  + {'{{magnitude}}'}
                </button>
              </div>
              <input
                type="text"
                value={activeDraft.subjectTemplate}
                onChange={(e) => updateActiveDraft('subjectTemplate', e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400 italic">
                Preview: "{substituteVariables(activeDraft.subjectTemplate)}"
              </p>
            </div>

            {/* Preheader */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Preheader (Inbox Preview Teaser)
                </label>
                <button
                  type="button"
                  onClick={() => handleInsertTag('{{province}}', 'preheaderTemplate')}
                  className="text-[10px] text-blue-600 font-semibold hover:underline"
                >
                  + {'{{province}}'}
                </button>
              </div>
              <input
                type="text"
                value={activeDraft.preheaderTemplate}
                onChange={(e) => updateActiveDraft('preheaderTemplate', e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Body Intro */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Lead Bulletin Introduction
              </label>
              <textarea
                rows={2}
                value={activeDraft.bodyIntro}
                onChange={(e) => updateActiveDraft('bodyIntro', e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none"
              />
            </div>

            {/* Safety Advisory Text */}
            {activeDraft.showSafetyAdvisory && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Safety Advisory & Emergency Advice
                </label>
                <textarea
                  rows={2}
                  value={activeDraft.safetyInstructions}
                  onChange={(e) => updateActiveDraft('safetyInstructions', e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed resize-none"
                />
              </div>
            )}

            {/* Station Hotlines */}
            {activeDraft.showStationHotlines && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Station Hotlines & Emergency Directory
                </label>
                <input
                  type="text"
                  value={activeDraft.stationHotlinesText}
                  onChange={(e) => updateActiveDraft('stationHotlinesText', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>
            )}

            {/* Action Button Label & URL */}
            {activeDraft.showActionButton && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={activeDraft.actionButtonText}
                    onChange={(e) => updateActiveDraft('actionButtonText', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Button Destination URL
                  </label>
                  <input
                    type="text"
                    value={activeDraft.actionButtonUrl}
                    onChange={(e) => updateActiveDraft('actionButtonUrl', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>
            )}

            {/* Duty Seismologist Sign-off */}
            {activeDraft.showDutySignoff && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Authority Clearance Title
                </label>
                <input
                  type="text"
                  value={activeDraft.dutySeismologistTitle}
                  onChange={(e) => updateActiveDraft('dutySeismologistTitle', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl outline-none"
                />
              </div>
            )}

            {/* Delete Draft Button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleDeleteDraft}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Draft</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2: LIVE EMAIL CANVAS & VIEWPORT PREVIEW (5 cols)
            ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col space-y-4">
            {/* Viewport Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Live Email Canvas
                </h2>
              </div>

              {/* Viewport Device Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setViewportMode('desktop')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    viewportMode === 'desktop'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (600px)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewportMode('mobile')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
                    viewportMode === 'mobile'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewportMode('code')}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                    viewportMode === 'code'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="View HTML Source"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML</span>
                </button>
              </div>
            </div>

            {/* Email Canvas Viewport Frame */}
            <div className="bg-slate-100/80 rounded-2xl p-4 md:p-6 flex justify-center border border-slate-200/80 overflow-x-auto min-h-[750px]">
              {viewportMode === 'code' ? (
                <div className="w-full bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono overflow-auto max-h-[720px] border border-slate-800 leading-relaxed">
                  <pre>{generatedHtmlCode}</pre>
                </div>
              ) : (
                <div
                  className={`bg-white rounded-xl shadow-md border border-slate-200/90 overflow-hidden transition-all duration-200 flex flex-col ${
                    viewportMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[600px]'
                  } ${activeDraft.fontFamily === 'mono' ? 'font-mono' : activeDraft.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                >
                  {/* 1. Header Masthead */}
                  <div
                    className={`px-5 py-4 text-white flex items-center justify-between ${
                      activeDraft.theme === 'emergency_crimson'
                        ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-950 border-b-2 border-rose-500'
                        : activeDraft.theme === 'modern_seismic'
                        ? 'bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 border-b-2 border-cyan-400'
                        : activeDraft.theme === 'amber_warning'
                        ? 'bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 border-b-2 border-amber-500'
                        : activeDraft.theme === 'charcoal_dark'
                        ? 'bg-slate-900 border-b-2 border-slate-500'
                        : 'bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-b-2 border-blue-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-base shrink-0">
                        🇵🇭
                      </div>
                      <div>
                        <div className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                          <span>DOST-PHIVOLCS</span>
                          <span className="text-[10px] text-cyan-400 font-mono">ALERT X</span>
                        </div>
                        <div className="text-[10px] text-slate-300 font-medium">
                          {previewEvent.stationName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-cyan-300 font-bold border border-white/10">
                        {previewEvent.stationAor} AOR
                      </span>
                    </div>
                  </div>

                  {/* 2. Geofence Verification Stamp */}
                  {activeDraft.showGeofenceVerification && (
                    <div className="bg-emerald-50 px-5 py-2.5 border-b border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <span className="font-bold text-[11px]">
                          ✓ VERIFIED INSIDE STATION AOR:
                        </span>
                        <span className="font-bold text-emerald-800 text-[11px]">
                          {previewEvent.province}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        Official Boundary Snapped
                      </span>
                    </div>
                  )}

                  {/* 3. Hero Severity & Magnitude Block */}
                  {activeDraft.severityBanner && (
                    <div
                      className={`px-5 py-4 border-b ${
                        activeDraft.theme === 'emergency_crimson'
                          ? 'bg-rose-50/60 border-rose-200'
                          : activeDraft.theme === 'modern_seismic'
                          ? 'bg-cyan-50/60 border-cyan-200'
                          : activeDraft.theme === 'amber_warning'
                          ? 'bg-amber-50/60 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-slate-900 tracking-tight">
                            Magnitude {previewEvent.magnitude.toFixed(1)}
                          </span>
                          <span className="text-xs font-bold text-slate-500 uppercase">
                            Richter Scale
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {previewEvent.intensity}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-blue-900 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{previewEvent.location}</span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Origin Time: {previewEvent.originTime}</span>
                      </div>
                    </div>
                  )}

                  {/* 4. Bulletin Content & Telemetry */}
                  <div className="p-5 space-y-4 text-xs">
                    {/* Lead Intro Note */}
                    <p className="text-slate-600 leading-relaxed text-[12px]">
                      {substituteVariables(activeDraft.bodyIntro)}
                    </p>

                    {/* Telemetry Grid Table */}
                    {activeDraft.showTelemetryGrid && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <tbody>
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td className="px-3 py-2 text-slate-500 font-semibold w-1/3">Bulletin ID</td>
                              <td className="px-3 py-2 font-mono font-bold text-slate-900">{previewEvent.id}</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-3 py-2 text-slate-500 font-semibold">Magnitude</td>
                              <td className="px-3 py-2 font-mono font-bold text-blue-700">M {previewEvent.magnitude.toFixed(1)}</td>
                            </tr>
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td className="px-3 py-2 text-slate-500 font-semibold">Focal Depth</td>
                              <td className="px-3 py-2 font-mono text-slate-800">{previewEvent.depthKm} km</td>
                            </tr>
                            <tr className="border-b border-slate-100">
                              <td className="px-3 py-2 text-slate-500 font-semibold">Epicenter Coordinates</td>
                              <td className="px-3 py-2 font-mono text-slate-800">
                                {previewEvent.latitude.toFixed(3)}°N, {previewEvent.longitude.toFixed(3)}°E
                              </td>
                            </tr>
                            <tr className="bg-slate-50/70 border-b border-slate-200">
                              <td className="px-3 py-2 text-slate-500 font-semibold">Territory Monitored</td>
                              <td className="px-3 py-2 font-bold text-slate-900">{previewEvent.province}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-2 text-slate-500 font-semibold">Monitoring Station</td>
                              <td className="px-3 py-2 text-slate-800">{previewEvent.stationName}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Town-Level Felt Intensity Observations */}
                    {activeDraft.showIntensityTable && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                        <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                          <span>Reported Municipal Felt Intensities (PEIS)</span>
                          <span className="text-[10px] text-slate-500 font-normal">AOR Localities</span>
                        </div>
                        <div className="space-y-1">
                          {previewEvent.sampleIntensities.map((si, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200/60 last:border-0"
                            >
                              <span className="text-slate-700">{si.locality}</span>
                              <span className="font-bold text-blue-700 font-mono">{si.peis}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safety Advisory Callout */}
                    {activeDraft.showSafetyAdvisory && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1 text-amber-900">
                        <div className="font-bold flex items-center gap-1.5 text-xs text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Safety Advisory & Ground Shaking Guidance</span>
                        </div>
                        <p className="text-[11px] text-amber-900 leading-relaxed">
                          {substituteVariables(activeDraft.safetyInstructions)}
                        </p>
                      </div>
                    )}

                    {/* Action Button CTA */}
                    {activeDraft.showActionButton && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => showToast('Simulating LGU portal link click.')}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-xs transition-colors flex items-center justify-center gap-2 ${
                            activeDraft.theme === 'emergency_crimson'
                              ? 'bg-rose-700 hover:bg-rose-800'
                              : activeDraft.theme === 'amber_warning'
                              ? 'bg-amber-700 hover:bg-amber-800'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          <span>{activeDraft.actionButtonText}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Station Emergency Hotlines Directory */}
                    {activeDraft.showStationHotlines && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <PhoneCall className="w-3 h-3 text-blue-600" />
                          <span>Emergency Response Contacts Directory</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {substituteVariables(activeDraft.stationHotlinesText)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 5. Official Sign-off & Footer */}
                  <div className="bg-slate-50 p-5 border-t border-slate-200 text-[11px] text-slate-500 space-y-2 mt-auto">
                    {activeDraft.showDutySignoff && (
                      <div className="border-b border-slate-200 pb-2">
                        <div className="font-bold text-slate-800">
                          Authority: {activeDraft.dutySeismologistTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          DOST-PHIVOLCS Regional Seismic Center • Emergency Dispatch Operations
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-500 leading-tight">
                      {substituteVariables(activeDraft.closingNotes)}
                    </p>

                    <div className="pt-1 text-[9px] text-slate-400 font-mono flex items-center justify-between">
                      <span>ALERTX-AOR-TEMPLATE-STUDIO</span>
                      <span>DOST-PHIVOLCS OFFICIAL</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 3: AOR EARTHQUAKE SIMULATOR & TELEMETRY INJECTOR (3 cols)
            ========================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card: Live Earthquake Telemetry Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                AOR Earthquake Telemetry
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Select an actual earthquake occurring inside <strong>{stationCode} AOR</strong> to preview dynamic parameter injection in this draft design:
            </p>

            {/* Event Selector Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Actual Seismic Event
              </label>
              <div className="relative">
                <select
                  value={selectedEarthquakeKey}
                  onChange={(e) => setSelectedEarthquakeKey(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-8 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600"
                >
                  <optgroup label="Real PHIVOLCS Earthquakes (Station AOR)">
                    {availableKeys.map((k) => (
                      <option key={k} value={k}>
                        M{availableAorEarthquakes[k].magnitude.toFixed(1)} • {availableAorEarthquakes[k].location} ({availableAorEarthquakes[k].originTime})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Selected Event Details Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Magnitude:</span>
                <span className="font-bold text-blue-700 font-mono">
                  M {previewEvent.magnitude.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">AOR Territory:</span>
                <span className="font-bold text-slate-900">{previewEvent.province}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Depth:</span>
                <span className="font-mono text-slate-800">{previewEvent.depthKm} km</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Coordinates:</span>
                <span className="font-mono text-slate-800">
                  {previewEvent.latitude.toFixed(3)}°N, {previewEvent.longitude.toFixed(3)}°E
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Intensity:</span>
                <span className="font-semibold text-emerald-700">{previewEvent.intensity}</span>
              </div>
            </div>
          </div>

          {/* Card: Dynamic Tags Quick-Copy Cloud */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Dynamic Telemetry Tags
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Click to copy</span>
            </div>

            <p className="text-xs text-slate-500">
              Click any tag chip below to copy to clipboard for use in subject or body text:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {AOR_VARIABLE_TAGS.map((t) => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(t.tag);
                    showToast(`Copied ${t.tag} to clipboard.`);
                  }}
                  className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-mono transition-colors active:scale-95 text-left"
                  title={t.desc}
                >
                  {t.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Card: Station AOR Territory Clearance Checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Monitored Territories ({stationCode})
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              This draft template applies strictly to earthquakes occurring inside these approved territories:
            </p>

            <div className="space-y-1 text-xs">
              {stationMonitoredTerritories.map((prov) => (
                <div
                  key={prov}
                  className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <span className="font-semibold text-slate-800">{prov}</span>
                  <span className="text-[10px] text-emerald-700 font-bold font-mono">✓ Monitored</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* 1. New Design Draft Modal */}
      {isNewDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    New AOR Email Design Draft
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Create template for actual earthquake bulletins inside station AOR
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewDraftModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Draft Template Title
                </label>
                <input
                  type="text"
                  value={newDraftName}
                  onChange={(e) => setNewDraftName(e.target.value)}
                  placeholder="e.g. CGP Regional Felt Earthquake Bulletin"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Design Starter Preset
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'rapid', title: 'Rapid AOR Seismic Bulletin (M4.0+)', desc: 'High-impact magnitude banner with geofence stamp & quick telemetry' },
                    { id: 'felt', title: 'Major Felt Event with Intensity Table', desc: 'Municipal PEIS breakdown table, emergency safety checklist & LGU action CTA' },
                    { id: 'minor', title: 'Minor Tremor Digest (M3.0–M3.9)', desc: 'Compact low-bandwidth format for tremors with minimal impact' },
                    { id: 'aftershock', title: 'Aftershock Sequence Advisory', desc: 'Specialized bulletin highlighting aftershock precautions and hotline contacts' },
                    { id: 'blank', title: 'Blank Design Canvas', desc: 'Empty canvas to build custom layout from scratch' },
                  ].map((p) => (
                    <label
                      key={p.id}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                        newDraftPreset === p.id
                          ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preset"
                        checked={newDraftPreset === p.id}
                        onChange={() => setNewDraftPreset(p.id as any)}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{p.title}</div>
                        <div className="text-[11px] text-slate-500">{p.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewDraftModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewDraft}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
              >
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Production HTML Code Export Modal */}
      {isHtmlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Production Email HTML Code
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Client-compatible inline HTML ready for PHIVOLCS mail dispatch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHtmlModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-[420px] overflow-y-auto leading-relaxed border border-slate-800">
                {generatedHtmlCode}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Rendered with {previewEvent.location} (M {previewEvent.magnitude.toFixed(1)})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHtmlModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedHtmlCode);
                    showToast('HTML code copied to clipboard!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy HTML Code</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Send Test Email Modal */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Send Test AOR Earthquake Email
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify layout and dynamic parameters in your inbox
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryEngine('smtp');
                      localStorage.setItem('alertx_delivery_engine', 'smtp');
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      deliveryEngine === 'smtp'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] flex items-center gap-1 font-bold text-emerald-800">
                      <Server className="w-3 h-3 text-emerald-600" />
                      Direct SMTP
                    </div>
                    <div className="text-[9px] text-slate-500">Port 465 SSL</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryEngine('brevo');
                      localStorage.setItem('alertx_delivery_engine', 'brevo');
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      deliveryEngine === 'brevo'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] flex items-center gap-1 font-bold text-amber-800">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Brevo API
                    </div>
                    <div className="text-[9px] text-slate-500">Port 443 HTTPS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryEngine('resend');
                      localStorage.setItem('alertx_delivery_engine', 'resend');
                    }}
                    className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                      deliveryEngine === 'resend'
                        ? 'border-blue-500 bg-blue-50 text-blue-950 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-[11px] flex items-center gap-1 font-bold text-blue-800">
                      <Globe className="w-3 h-3 text-blue-600" />
                      Resend API
                    </div>
                    <div className="text-[9px] text-slate-500">Port 443 HTTPS</div>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 text-[11px] space-y-1 text-slate-600">
                <div className="font-semibold text-slate-800">Test Dispatch Details:</div>
                <div>Subject: <span className="font-mono text-slate-800">{substituteVariables(activeDraft.subjectTemplate)}</span></div>
                <div>Station Scope: <span className="font-semibold text-cyan-800">{previewEvent.stationName}</span></div>
                <div>AOR Territory: <span className="font-semibold text-slate-800">{previewEvent.province}</span></div>
                <div>Actual Telemetry: <span className="font-semibold text-slate-800">{previewEvent.location} (M {previewEvent.magnitude.toFixed(1)})</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={testSending}
                onClick={() => handleSendTestEmail()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                {testSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
