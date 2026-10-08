import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RotateCcw,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Map as MapIcon,
  UserCheck,
  Check,
  X,
  Save,
  Download,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Equal,
  MapPin,
  Compass,
  Sun,
  Moon,
  Key,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ALL_SNAPPED_STATION_AORS } from '../data/allSnappedAorData';
import { CGP_SNAPPED_AOR_COORDINATES, CGP_AOR_PROVINCES } from '../data/cgpSnappedAorData';
import { PHIVOLCS_SCSS_NETWORK } from '../data/philippinesGeoData';

export interface BoundaryReviewItem {
  id: string;
  eventOrBoundary: string;
  reviewType: 'Offshore/Boundary Check' | 'Province Assignment' | 'Boundary Validation' | 'Dataset Validation';
  station: 'PCP' | 'BIP' | 'CGP';
  stationFullName: string;
  issueSummary: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Review' | 'Resolved';
  lastUpdatedDate: string;
  lastUpdatedTime: string;
  coordinates: string;
  lat: number;
  lng: number;
  currentFinding: string;
  recommendedAction: string;
  reviewer: string;
  reviewerRole: string;
  decision: string;
  decisionNotes?: string;
  magnitude?: number;
  eventDate?: string;
}

const INITIAL_REVIEW_ITEMS: BoundaryReviewItem[] = [
  {
    id: 'BR-2025-004',
    eventOrBoundary: 'Iligan Bay Coastal Perimeter',
    reviewType: 'Boundary Validation',
    station: 'CGP',
    stationFullName: 'CGP (Cagayan de Oro Seismic Station)',
    issueSummary: 'Coordinate near Misamis Oriental & Lanao del Norte boundary',
    priority: 'High',
    status: 'Pending',
    lastUpdatedDate: 'Apr 24, 2025',
    lastUpdatedTime: '10:45 AM',
    coordinates: '8.3450° N, 124.2800° E',
    lat: 8.345,
    lng: 124.28,
    magnitude: 4.4,
    eventDate: 'Apr 24, 2025',
    currentFinding: 'Offshore event within 3 km of coastal buffer zone; assigned to CGP Northern Mindanao.',
    recommendedAction: 'Verify maritime perimeter against Region X GIS coastline polygon.',
    reviewer: 'Maria Santos',
    reviewerRole: 'Geospatial Analyst',
    decision: '—',
    decisionNotes: '',
  },
  {
    id: 'BR-2025-005',
    eventOrBoundary: 'Camiguin Island Marine Buffer',
    reviewType: 'Offshore/Boundary Check',
    station: 'CGP',
    stationFullName: 'CGP (Cagayan de Oro Seismic Station)',
    issueSummary: 'Bohol Sea seismic swarm proximity',
    priority: 'High',
    status: 'In Review',
    lastUpdatedDate: 'Apr 23, 2025',
    lastUpdatedTime: '02:15 PM',
    coordinates: '9.2150° N, 124.6800° E',
    lat: 9.215,
    lng: 124.68,
    magnitude: 4.9,
    eventDate: 'Apr 23, 2025',
    currentFinding: 'Epicenter in Bohol Sea 18 km north of Mambajao; verified within CGP Camiguin oceanic perimeter.',
    recommendedAction: 'Reconcile 22 km marine buffer rule with PHIVOLCS Northern Mindanao baseline.',
    reviewer: 'Danilo Reyes',
    reviewerRole: 'Geodetic Engineer',
    decision: 'Under Review',
    decisionNotes: 'Telemetry confirmed by Camiguin Seismic Station.',
  },
  {
    id: 'BR-2025-006',
    eventOrBoundary: 'Bukidnon - Cotabato Boundary Zone',
    reviewType: 'Province Assignment',
    station: 'CGP',
    stationFullName: 'CGP (Cagayan de Oro Seismic Station)',
    issueSummary: 'Regional demarcation check (Region X vs Region XII)',
    priority: 'Medium',
    status: 'Pending',
    lastUpdatedDate: 'Apr 20, 2025',
    lastUpdatedTime: '08:30 AM',
    coordinates: '7.6400° N, 124.8200° E',
    lat: 7.64,
    lng: 124.82,
    magnitude: 5.1,
    eventDate: 'Apr 20, 2025',
    currentFinding: 'Epicenter within 2.5 km of southern Bukidnon boundary line.',
    recommendedAction: 'Run point-in-polygon verification check against PSA PSGC 2024 boundary dataset.',
    reviewer: 'Maria Santos',
    reviewerRole: 'Geospatial Analyst',
    decision: '—',
    decisionNotes: '',
  },
  {
    id: 'BR-2025-001',
    eventOrBoundary: 'Dalupiri Island',
    reviewType: 'Offshore/Boundary Check',
    station: 'PCP',
    stationFullName: 'PCP (Palayan Seismic Station)',
    issueSummary: 'Coordinate near AOR edge',
    priority: 'High',
    status: 'Pending',
    lastUpdatedDate: 'Apr 23, 2025',
    lastUpdatedTime: '09:15 AM',
    coordinates: '18.5742° N, 121.0168° E',
    lat: 18.5742,
    lng: 121.0168,
    magnitude: 4.8,
    eventDate: 'Apr 23, 2025',
    currentFinding: 'Coordinate near AOR edge; within 5 km of boundary',
    recommendedAction: 'Verify with GIS and station coverage rules',
    reviewer: 'Maria Santos',
    reviewerRole: 'Geospatial Analyst',
    decision: '—',
    decisionNotes: '',
  },
  {
    id: 'BR-2025-002',
    eventOrBoundary: 'Sarangani Island',
    reviewType: 'Province Assignment',
    station: 'BIP',
    stationFullName: 'BIP (Bislig Seismic Station)',
    issueSummary: 'EQInfo and GIS result differ',
    priority: 'Medium',
    status: 'In Review',
    lastUpdatedDate: 'Apr 22, 2025',
    lastUpdatedTime: '04:32 PM',
    coordinates: '5.4120° N, 125.4320° E',
    lat: 5.412,
    lng: 125.432,
    magnitude: 5.3,
    eventDate: 'Apr 22, 2025',
    currentFinding: 'PHIVOLCS EQInfo tagged Davao Occidental; polygon calculation overlaps BIP boundary zone.',
    recommendedAction: 'Reconcile municipal coastal boundary polygon with Region XI GIS dataset',
    reviewer: 'Danilo Reyes',
    reviewerRole: 'Geodetic Engineer',
    decision: 'Under Review',
    decisionNotes: 'Consulting PHIVOLCS regional geodetic coordinates table.',
  },
  {
    id: 'BR-2025-003',
    eventOrBoundary: 'Burgos, Surigao del Norte',
    reviewType: 'Boundary Validation',
    station: 'BIP',
    stationFullName: 'BIP (Bislig Seismic Station)',
    issueSummary: 'Municipal boundary requires confirmation',
    priority: 'Medium',
    status: 'Pending',
    lastUpdatedDate: 'Apr 21, 2025',
    lastUpdatedTime: '11:17 AM',
    coordinates: '10.0123° N, 126.0684° E',
    lat: 10.0123,
    lng: 126.0684,
    magnitude: 4.2,
    eventDate: 'Apr 21, 2025',
    currentFinding: 'Epicenter plotted 1.2 km outside coastal perimeter buffer; local municipal shapefile awaiting confirmation.',
    recommendedAction: 'Run 5 km maritime buffer check against Region XIII dataset.',
    reviewer: 'Maria Santos',
    reviewerRole: 'Geospatial Analyst',
    decision: '—',
    decisionNotes: '',
  },
];

interface BoundaryReviewViewProps {
  onOpenMap?: () => void;
  currentUser?: UserProfile;
}

export const BoundaryReviewView: React.FC<BoundaryReviewViewProps> = ({
  onOpenMap,
  currentUser,
}) => {
  const isAdmin =
    currentUser?.role === 'Administrator' ||
    currentUser?.assignedAor === 'ALL' ||
    !currentUser?.assignedAor ||
    currentUser?.name === 'Juan Dela Cruz';

  const userStationAor = currentUser?.assignedAor;
  const isCgpRestricted = !isAdmin && userStationAor === 'CGP';
  const isPcpRestricted = !isAdmin && userStationAor === 'PCP';
  const isBipRestricted = !isAdmin && userStationAor === 'BIP';
  const isStationScoped = !isAdmin && !!userStationAor && userStationAor !== 'ALL';

  // Default station filter
  const initialStationFilter = isCgpRestricted
    ? 'CGP'
    : isPcpRestricted
    ? 'PCP'
    : isBipRestricted
    ? 'BIP'
    : 'All Stations';

  const [items, setItems] = useState<BoundaryReviewItem[]>(INITIAL_REVIEW_ITEMS);
  const [selectedId, setSelectedId] = useState<string>(isCgpRestricted ? 'BR-2025-004' : 'BR-2025-001');
  const [selectedCheckboxIds, setSelectedCheckboxIds] = useState<string[]>([
    isCgpRestricted ? 'BR-2025-004' : 'BR-2025-001',
  ]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('All Types');
  const [stationFilter, setStationFilter] = useState(initialStationFilter);
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Decision notes edit
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignedReviewer, setAssignedReviewer] = useState('Maria Santos');

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
  const [provincesGeoJson, setProvincesGeoJson] = useState<any | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Map API Key State
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('alertx_map_api_key') || '';
  });
  const [apiKeyNotice, setApiKeyNotice] = useState<string | null>(null);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // If station restricted (e.g. CGP), only show their items!
      if (isStationScoped && item.station !== userStationAor) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.id.toLowerCase().includes(q) ||
          item.eventOrBoundary.toLowerCase().includes(q) ||
          item.issueSummary.toLowerCase().includes(q) ||
          item.station.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (reviewTypeFilter !== 'All Types' && item.reviewType !== reviewTypeFilter) {
        return false;
      }
      if (stationFilter !== 'All Stations' && item.station !== stationFilter) {
        return false;
      }
      if (priorityFilter !== 'All Priorities' && item.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== 'All Statuses' && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, reviewTypeFilter, stationFilter, priorityFilter, statusFilter, isStationScoped, userStationAor]);

  const selectedItem = useMemo(() => {
    return filteredItems.find((i) => i.id === selectedId) || filteredItems[0] || items[0];
  }, [filteredItems, selectedId, items]);

  // Load official PSGC province boundaries GeoJSON
  useEffect(() => {
    let isMounted = true;
    fetch('/data/philippines-provinces-psgc.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load provinces GeoJSON');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setProvincesGeoJson(data);
      })
      .catch((err) => {
        console.warn('Could not load provinces GeoJSON:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Leaflet Map for Boundary Review
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = selectedItem?.lat || 8.482;
    const initialLng = selectedItem?.lng || 124.647;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 8.5,
      minZoom: 5,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;

    // Tile Layer: Esri World Street (Default Light Mode - 100% Free & No Watermarks)
    const tileLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        opacity: 0.95,
      }
    ).addTo(map);
    tileLayerRef.current = tileLayer;

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap when mapTheme changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const url =
      mapTheme === 'dark'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    tileLayerRef.current.setUrl(url);
    tileLayerRef.current.setOpacity(mapTheme === 'dark' ? 0.85 : 0.95);
  }, [mapTheme]);

  // Render Leaflet Layers for the selected review item
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group || !selectedItem) return;

    group.clearLayers();

    const stationCode = selectedItem.station;
    const isCgp = stationCode === 'CGP';
    const stationData = PHIVOLCS_SCSS_NETWORK[stationCode] || PHIVOLCS_SCSS_NETWORK['CGP'];
    const snappedAor = ALL_SNAPPED_STATION_AORS.find((a) => a.code === stationCode);

    // 1. RENDER PROVINCES FOR THIS STATION
    if (provincesGeoJson) {
      const stationProvs = isCgp
        ? CGP_AOR_PROVINCES
        : snappedAor?.provincesIncluded || stationData.provinces;

      const geoJsonLayer = L.geoJSON(provincesGeoJson, {
        filter: (feature: any) => {
          const provName = (feature.properties?.adm2_en || feature.properties?.name || '').toLowerCase();
          return stationProvs.some((p) => provName.includes(p.toLowerCase()) || p.toLowerCase().includes(provName));
        },
        style: () => {
          return {
            color: isCgp ? '#a855f7' : stationCode === 'BIP' ? '#10b981' : '#38bdf8',
            weight: 1.8,
            fillColor: isCgp ? '#c084fc' : stationCode === 'BIP' ? '#34d399' : '#0284c7',
            fillOpacity: 0.22,
            dashArray: '2, 4',
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const provName = feature.properties?.adm2_en || 'Province';
          layer.bindTooltip(
            `<div class="px-2.5 py-1 bg-slate-950/95 text-white rounded text-xs font-semibold border border-purple-400 shadow-md">
              <span class="text-amber-300 font-bold block">${provName}</span>
              <span class="text-[10px] text-slate-300">Station: ${stationCode} AOR</span>
            </div>`,
            { sticky: true }
          );

          layer.on({
            mouseover: (e) => {
              const target = e.target;
              target.setStyle({
                weight: 3.5,
                color: isCgp ? '#e879f9' : '#38bdf8',
                fillColor: isCgp ? '#d946ef' : '#0ea5e9',
                fillOpacity: 0.65,
                dashArray: '',
              });
              if (target.bringToFront) {
                target.bringToFront();
              }
              setHoveredProvince(provName);
            },
            mouseout: (e) => {
              geoJsonLayer.resetStyle(e.target);
              setHoveredProvince(null);
            },
          });
        },
      });

      group.addLayer(geoJsonLayer);
    }

    // 2. RENDER STATION AOR SNAPPED POLYGON
    const aorCoords = isCgp
      ? (CGP_SNAPPED_AOR_COORDINATES as any)
      : snappedAor?.coordinates || [];

    if (aorCoords && aorCoords.length > 0) {
      const aorPoly = L.polygon(aorCoords, {
        color: isCgp ? '#9333ea' : stationCode === 'BIP' ? '#059669' : '#2563eb',
        weight: 2.5,
        fillColor: isCgp ? '#a855f7' : stationCode === 'BIP' ? '#10b981' : '#3b82f6',
        fillOpacity: 0.18,
      });
      aorPoly.bindTooltip(
        `<div class="px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded">
          ${stationCode} AOR Snapped Boundary
        </div>`,
        { sticky: true }
      );
      group.addLayer(aorPoly);
    }

    // 3. RENDER 5KM BUFFER ZONE AROUND REVIEW EVENT
    const bufferCircle = L.circle([selectedItem.lat, selectedItem.lng], {
      radius: 5000,
      color: '#f59e0b',
      fillColor: '#fbbf24',
      fillOpacity: 0.15,
      weight: 1.5,
      dashArray: '4, 4',
    });
    bufferCircle.bindTooltip(
      `<div class="px-2 py-1 bg-amber-950 text-amber-200 text-xs font-mono rounded">
        5 km Geodetic Buffer Zone
      </div>`,
      { sticky: true }
    );
    group.addLayer(bufferCircle);

    // 4. RENDER EVENT EPICENTER MARKER
    const eventIcon = L.divIcon({
      className: 'custom-review-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full bg-rose-500/30 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-white font-black text-[9px]">
            ${selectedItem.magnitude ? `M${selectedItem.magnitude.toFixed(1)}` : 'EQ'}
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const eventMarker = L.marker([selectedItem.lat, selectedItem.lng], { icon: eventIcon });
    eventMarker.bindPopup(
      `<div class="p-2 text-xs space-y-1">
        <div class="font-bold text-slate-900 text-sm">${selectedItem.eventOrBoundary}</div>
        <div class="text-rose-600 font-semibold font-mono">${selectedItem.id} &bull; ${selectedItem.coordinates}</div>
        <div class="text-slate-600">${selectedItem.issueSummary}</div>
        <div class="pt-1 text-[11px] text-slate-500 border-t border-slate-200">
          Status: <strong>${selectedItem.status}</strong> &bull; Priority: <strong>${selectedItem.priority}</strong>
        </div>
      </div>`
    );
    group.addLayer(eventMarker);

    // Fly smoothly to event location
    map.flyTo([selectedItem.lat, selectedItem.lng], 9, { duration: 1 });
  }, [selectedItem, provincesGeoJson]);

  // Handlers
  const handleClearFilters = () => {
    setSearchQuery('');
    setReviewTypeFilter('All Types');
    if (!isStationScoped) {
      setStationFilter('All Stations');
    }
    setPriorityFilter('All Priorities');
    setStatusFilter('All Statuses');
  };

  const toggleSelectAll = () => {
    if (selectedCheckboxIds.length === filteredItems.length) {
      setSelectedCheckboxIds([]);
    } else {
      setSelectedCheckboxIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleCheckbox = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApprove = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              status: 'Resolved',
              decision: 'Approved',
              decisionNotes: decisionNotes || 'Approved by operator review.',
            }
          : i
      )
    );
    setActionNotice(`Item ${selectedItem.id} (${selectedItem.eventOrBoundary}) has been Approved.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              status: 'Resolved',
              decision: 'Rejected (Suppressed)',
              decisionNotes: decisionNotes || 'Rejected by operator review.',
            }
          : i
      )
    );
    setActionNotice(`Item ${selectedItem.id} rejected. Station assignment withheld.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleAssignReviewer = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              reviewer: assignedReviewer,
              reviewerRole:
                assignedReviewer === 'Maria Santos'
                  ? 'Geospatial Analyst'
                  : 'Geodetic Engineer',
            }
          : i
      )
    );
    setIsAssignModalOpen(false);
    setActionNotice(`Assigned ${assignedReviewer} to ${selectedItem.id}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const pendingCount = filteredItems.filter((i) => i.status === 'Pending').length;

  return (
    <div className="space-y-4">
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

      {/* 1. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Reviews */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-800 block">
              Pending Reviews
            </span>
            <div className="text-3xl font-bold text-amber-700 tracking-tight mt-0.5">
              {pendingCount}
            </div>
            <span className="text-[10px] text-slate-500">
              {isStationScoped ? `${userStationAor} Station Scope` : 'Requires action'}
            </span>
          </div>
        </div>

        {/* Card 2: Boundary Events */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-600 block">
              Boundary Events
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-bold text-blue-600 tracking-tight">
                {filteredItems.length}
              </span>
              <span className="text-xs text-slate-500 font-normal">Active items</span>
            </div>
          </div>
        </div>

        {/* Card 3: GIS Mismatches */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-red-700 block">
              GIS Buffer Flags
            </span>
            <div className="text-3xl font-bold text-red-600 tracking-tight mt-0.5">
              {filteredItems.filter((i) => i.priority === 'High').length}
            </div>
            <span className="text-[10px] text-slate-500">High priority edges</span>
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">
              Resolved &amp; Locked
            </span>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight mt-0.5">
              {filteredItems.filter((i) => i.status === 'Resolved').length}
            </div>
            <span className="text-[10px] text-slate-500">Verified by analyst</span>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Search Input (4 cols) */}
          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Search review items
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by location, ID, or keywords..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Review Type Dropdown */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Review Type
            </label>
            <select
              value={reviewTypeFilter}
              onChange={(e) => setReviewTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="All Types">All Types</option>
              <option value="Offshore/Boundary Check">Offshore/Boundary Check</option>
              <option value="Province Assignment">Province Assignment</option>
              <option value="Boundary Validation">Boundary Validation</option>
            </select>
          </div>

          {/* Station Filter Dropdown */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Station AOR
            </label>
            <select
              value={stationFilter}
              disabled={isStationScoped}
              onChange={(e) => setStationFilter(e.target.value)}
              className={`w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs ${
                isStationScoped ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
              }`}
            >
              {!isStationScoped && <option value="All Stations">All Stations</option>}
              <option value="CGP">CGP (Cagayan de Oro)</option>
              {!isCgpRestricted && <option value="PCP">PCP (Palayan)</option>}
              {!isCgpRestricted && <option value="BIP">BIP (Bislig)</option>}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="All Priorities">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 w-full justify-center shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Review Items Table (7 cols) + Selected Review Item & Leaflet Map (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Items Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Boundary Review Events
              </h3>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {filteredItems.length} Events
              </span>
            </div>
            {isStationScoped && (
              <span className="text-[11px] font-mono font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                {userStationAor} Scoped
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-700">
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedCheckboxIds.length === filteredItems.length &&
                        filteredItems.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600"
                    />
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap">ID</th>
                  <th className="py-2.5 px-3">Event Location</th>
                  <th className="py-2.5 px-3">Review Type</th>
                  <th className="py-2.5 px-3">Station</th>
                  <th className="py-2.5 px-3 text-center">Priority</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem.id === item.id;
                  const isChecked = selectedCheckboxIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/70 font-medium'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => toggleCheckbox(item.id, e as any)}
                          className="rounded text-blue-600"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {item.eventOrBoundary}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {item.coordinates}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                        {item.reviewType}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-slate-700">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            item.station === 'CGP'
                              ? 'bg-purple-100 text-purple-800'
                              : item.station === 'BIP'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.station}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.priority === 'High'
                              ? 'bg-rose-100 text-rose-700'
                              : item.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'In Review'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Selected AOR Card & Leaflet Map with subtle dark blue gradient background (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col space-y-4">
          {/* Card Header (Only show selected AOR; if CGP only show CGP AOR) */}
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600">
                  {selectedItem.id}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    selectedItem.station === 'CGP'
                      ? 'bg-purple-100 text-purple-800'
                      : selectedItem.station === 'BIP'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedItem.station} AOR Exclusive
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                {selectedItem.eventOrBoundary}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {selectedItem.coordinates}
              </p>
            </div>

            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {selectedItem.status}
            </span>
          </div>

          {/* Leaflet Boundary Review Map with subtle dark blue gradient background */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-600" />
                AOR Geographic Boundary Context
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMapTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                    mapTheme === 'light'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={`Switch to ${mapTheme === 'light' ? 'Dark Mode' : 'Light Mode (Default)'}`}
                >
                  {mapTheme === 'light' ? (
                    <>
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span>Light (Default)</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3 text-indigo-400" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  5km Maritime Buffer Check
                </span>
              </div>
            </div>

            {/* Subtle dark blue gradient container */}
            <div className="relative bg-gradient-to-b from-[#071326] via-[#0d2146] to-[#15326a] rounded-xl border border-slate-800 overflow-hidden min-h-[290px] shadow-inner select-none flex flex-col">
              {/* Leaflet Map DOM Element */}
              <div
                ref={mapContainerRef}
                className="w-full flex-1 z-0"
                style={{ minHeight: '290px', background: 'transparent' }}
              />

              {/* Floating Legend on top-left of Leaflet Map */}
              <div className="absolute top-2.5 left-2.5 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2 text-[10px] space-y-1 text-white shadow-xl pointer-events-auto">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  <span>{selectedItem.station} AOR Boundary</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 border border-dashed border-sky-400 inline-block" />
                  <span>Provinces ({selectedItem.station === 'CGP' ? 'Northern Mindanao' : selectedItem.station})</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  <span>Event Epicenter</span>
                </div>
                <div className="pt-1.5 mt-0.5 border-t border-slate-800 flex items-center justify-between text-[9px]">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {mapTheme === 'light' ? 'Esri Street (Light - Active)' : 'Esri Dark Canvas (Active)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowApiKeyModal(true)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold underline ml-1 cursor-pointer"
                    title="Configure or view Map API Key"
                  >
                    Map Key Info
                  </button>
                </div>
              </div>

              {/* Map Zoom Controls on top-right */}
              <div className="absolute top-2.5 right-2.5 z-20 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg shadow-xl divide-y divide-slate-800 text-slate-200 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 text-xs"
                  title="Zoom In"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 text-xs"
                  title="Zoom Out"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    mapInstanceRef.current?.flyTo([selectedItem.lat, selectedItem.lng], 9);
                  }}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-800 text-cyan-400 text-xs"
                  title="Recenter Event"
                >
                  <Crosshair className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Finding & Recommendation Details */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Current Finding
              </span>
              <p className="text-slate-800 font-medium leading-relaxed mt-0.5">
                {selectedItem.currentFinding}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Recommended Action
              </span>
              <p className="text-slate-700 leading-relaxed mt-0.5">
                {selectedItem.recommendedAction}
              </p>
            </div>
          </div>

          {/* Decision Notes & Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-700 block">
              Review Decision &amp; Audit Notes
            </label>
            <textarea
              rows={2}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Enter analysis findings, geodetic alignment justification, or override instructions..."
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 resize-none shadow-2xs"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleReject}
                className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject / Suppress</span>
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Boundary</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Map API Key & Cartography Provider Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Boundary Review Map API Key & Engine</h3>
                  <p className="text-[11px] text-slate-500">Cartography and Tile Service Configuration</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowApiKeyModal(false);
                  setApiKeyNotice(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-3.5 text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Active Map Engine: Open GIS &amp; Esri Cartography (100% Free &amp; Zero Watermarks)
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  All watermarks and &quot;API key required&quot; notices have been removed. The Boundary Review Map streams directly via Esri World Street (Default Light Mode) and Esri Dark Canvas with PSGC 2024 boundary layers. This tier is <strong>active, fully operational, and 100% free</strong> without requiring any paid API key.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Optional Custom Map API Key (Mapbox / Stadia / Custom Tile Server)
                </label>
                <input
                  type="text"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="e.g., pk.eyJ1IjoiZXhhbXBsZSI... (Optional)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Synchronized across <strong>Dashboard Map</strong>, <strong>Station Boundaries</strong>, and <strong>Boundary Review</strong>. Built-in Esri GIS cartography powers all review maps with zero watermark and zero cost.
                </span>
              </div>

              {apiKeyNotice && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-blue-800 text-[11px] font-medium flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{apiKeyNotice}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Leaflet v1.9.4 / PSGC 2024
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setApiKeyNotice(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('alertx_map_api_key', customApiKey.trim());
                    setApiKeyNotice('API configuration saved successfully.');
                    setTimeout(() => {
                      setShowApiKeyModal(false);
                      setApiKeyNotice(null);
                    }, 1200);
                  }}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
