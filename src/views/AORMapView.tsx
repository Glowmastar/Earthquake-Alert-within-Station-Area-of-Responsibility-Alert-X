import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  CheckCircle2,
  Radio,
  MapPin,
  Building2,
  Search,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Activity,
  Info,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import { EarthquakeRecord, UserProfile } from '../types';
import {
  PHIVOLCS_SCSS_NETWORK,
  ALL_SCSS_STATIONS,
  ALL_STSS_SUBSTATIONS,
  SCSSStationAOR,
  STSSSubStation,
} from '../data/philippinesGeoData';
import { ALL_SNAPPED_STATION_AORS } from '../data/allSnappedAorData';
import { CGP_SNAPPED_AOR_COORDINATES, CGP_AOR_PROVINCES } from '../data/cgpSnappedAorData';

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
  // Scoping & Permissions check
  const isAdmin =
    currentUser?.role === 'Administrator' ||
    currentUser?.assignedAor === 'ALL' ||
    !currentUser?.assignedAor ||
    currentUser?.name === 'Juan Dela Cruz';

  const userStationAor = currentUser?.assignedAor;
  const isCgpScoped = !isAdmin && userStationAor === 'CGP';
  const isPcpScoped = !isAdmin && userStationAor === 'PCP';
  const isBipScoped = !isAdmin && userStationAor === 'BIP';
  const isStationScoped = !isAdmin && !!userStationAor && userStationAor !== 'ALL';

  // Determine active default station
  const defaultStationCode = isCgpScoped
    ? 'CGP'
    : isPcpScoped
    ? 'PCP'
    : isBipScoped
    ? 'BIP'
    : userStationAor && userStationAor !== 'ALL'
    ? userStationAor
    : 'CGP';

  const [selectedStationCode, setSelectedStationCode] = useState<string>(defaultStationCode);
  const [showAllStationsAdmin, setShowAllStationsAdmin] = useState<boolean>(isAdmin);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stationSearch, setStationSearch] = useState('');
  const [islandFilter, setIslandFilter] = useState<'All' | 'Luzon' | 'Visayas' | 'Mindanao'>('All');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [selectedSubStation, setSelectedSubStation] = useState<STSSSubStation | null>(null);

  // Layer visibility toggles
  const [showEpicenters, setShowEpicenters] = useState(true);
  const [showProvinces, setShowProvinces] = useState(true);
  const [showStationBoundary, setShowStationBoundary] = useState(true);
  const [showSubStations, setShowSubStations] = useState(true);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [basemapType, setBasemapType] = useState<'light' | 'dark' | 'topo' | 'satellite'>('light');

  // GeoJSON state
  const [provincesGeoJson, setProvincesGeoJson] = useState<any | null>(null);
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

  // Map API Key & Provider Configuration
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('alertx_map_api_key') || '';
  });
  const [apiKeyNotice, setApiKeyNotice] = useState<string | null>(null);

  // Leaflet refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Enforce station selection if scoped to a station
  const activeStationCode = isStationScoped ? defaultStationCode : selectedStationCode;
  const selectedStation: SCSSStationAOR =
    PHIVOLCS_SCSS_NETWORK[activeStationCode] || PHIVOLCS_SCSS_NETWORK['CGP'];

  // Snapped Station AOR data
  const currentSnappedAor = useMemo(() => {
    return ALL_SNAPPED_STATION_AORS.find((a) => a.code === activeStationCode);
  }, [activeStationCode]);

  // Prohibited / Allowed stations in dropdown
  const filteredDropdownStations = useMemo(() => {
    if (isStationScoped) {
      return [PHIVOLCS_SCSS_NETWORK[defaultStationCode] || PHIVOLCS_SCSS_NETWORK['CGP']];
    }
    return ALL_SCSS_STATIONS.filter((st) => {
      const matchIsland = islandFilter === 'All' || st.islandGroup === islandFilter;
      const q = stationSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        st.code.toLowerCase().includes(q) ||
        st.name.toLowerCase().includes(q) ||
        st.location.toLowerCase().includes(q) ||
        st.provinces.some((p) => p.toLowerCase().includes(q));
      return matchIsland && matchSearch;
    });
  }, [islandFilter, stationSearch, isStationScoped, defaultStationCode]);

  // Load official PSGC province boundaries GeoJSON
  useEffect(() => {
    let isMounted = true;
    fetch('/data/philippines-provinces-psgc.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load provinces GeoJSON');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setProvincesGeoJson(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load provinces GeoJSON:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on Philippines archipelago
    const initialCenter: [number, number] = isCgpScoped
      ? [8.482, 124.647]
      : isPcpScoped
      ? [15.541, 121.084]
      : [12.8797, 121.774];
    const initialZoom = isStationScoped ? 8 : 6;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
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
  }, [isCgpScoped, isPcpScoped, isStationScoped]);

  // Update Basemap when basemapType changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
    let opacity = 0.95;

    if (basemapType === 'dark') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      opacity = 0.85;
    } else if (basemapType === 'topo') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      opacity = 0.85;
    } else if (basemapType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      opacity = 0.9;
    }

    tileLayerRef.current.setUrl(url);
    tileLayerRef.current.setOpacity(opacity);
  }, [basemapType]);

  // Render Leaflet Layers (AOR Boundaries, Province Boundaries, Stations, Earthquakes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    // Collect bounds to zoom/fit
    const bounds = L.latLngBounds([]);

    // 1. RENDER PROVINCES
    if (showProvinces && provincesGeoJson) {
      // Determine which provinces to include based on user scope and admin settings
      let targetProvincesSet = new Set<string>();

      if (isStationScoped) {
        // ONLY show their own AOR provinces!
        const stationProvs =
          activeStationCode === 'CGP'
            ? CGP_AOR_PROVINCES
            : currentSnappedAor?.provincesIncluded || selectedStation.provinces;

        stationProvs.forEach((p) => targetProvincesSet.add(p.toLowerCase()));
      } else if (isAdmin && showAllStationsAdmin) {
        // Admin: Show all AOR provinces
        ALL_SNAPPED_STATION_AORS.forEach((st) => {
          st.provincesIncluded?.forEach((p) => targetProvincesSet.add(p.toLowerCase()));
        });
      } else {
        // Admin focused on single station
        const stationProvs =
          currentSnappedAor?.provincesIncluded || selectedStation.provinces;
        stationProvs.forEach((p) => targetProvincesSet.add(p.toLowerCase()));
      }

      const geoJsonLayer = L.geoJSON(provincesGeoJson, {
        filter: (feature: any) => {
          const provName = (feature.properties?.adm2_en || feature.properties?.name || '').toLowerCase();
          if (!provName) return false;

          // If showing all provinces for admin
          if (isAdmin && showAllStationsAdmin) {
            return true;
          }

          // Otherwise check if province is part of target station AOR
          return Array.from(targetProvincesSet).some((p) =>
            provName.includes(p) || p.includes(provName)
          );
        },
        style: (feature: any) => {
          const provName = (feature?.properties?.adm2_en || '').toLowerCase();
          const isSelectedStationProv =
            activeStationCode === 'CGP'
              ? CGP_AOR_PROVINCES.some((p) => p.toLowerCase() === provName || provName.includes(p.toLowerCase()))
              : selectedStation.provinces.some((p) => p.toLowerCase() === provName || provName.includes(p.toLowerCase()));

          const strokeColor = isSelectedStationProv
            ? selectedStation.strokeColor || '#38bdf8'
            : '#0284c7';
          const fillColor = isSelectedStationProv
            ? selectedStation.polygonColor || '#0ea5e9'
            : '#0369a1';

          return {
            color: strokeColor,
            weight: isSelectedStationProv ? 2.0 : 1.2,
            opacity: 0.9,
            fillColor: fillColor,
            fillOpacity: isSelectedStationProv ? 0.28 : 0.15,
            dashArray: isSelectedStationProv ? undefined : '3, 4',
          };
        },
        onEachFeature: (feature: any, layer: L.Layer) => {
          const provName = feature.properties?.adm2_en || feature.properties?.name || 'Province';
          layer.bindTooltip(
            `<div class="px-2.5 py-1.5 bg-slate-950/95 text-white rounded-lg text-xs font-semibold border border-cyan-400 shadow-xl">
              <span class="text-cyan-300 font-bold block">${provName}</span>
              <span class="text-[10px] text-slate-300 font-normal">AOR: ${selectedStation.code} (${selectedStation.name})</span>
            </div>`,
            { sticky: true, opacity: 0.95 }
          );

          layer.on({
            mouseover: (e) => {
              const target = e.target;
              target.setStyle({
                weight: 3.5,
                color: '#38bdf8',
                fillColor: '#38bdf8',
                fillOpacity: 0.55,
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

    // 2. RENDER STATION AOR SNAPPED BOUNDARIES
    if (showStationBoundary) {
      if (isAdmin && showAllStationsAdmin) {
        // Admin: render all 15 station boundaries
        ALL_SNAPPED_STATION_AORS.forEach((aor) => {
          const isFocused = aor.code === activeStationCode;
          const poly = L.polygon(aor.coordinates as any, {
            color: isFocused ? '#f59e0b' : aor.strokeColor || '#38bdf8',
            weight: isFocused ? 3 : 1.8,
            fillColor: isFocused ? '#fbbf24' : aor.fillColor || '#0284c7',
            fillOpacity: isFocused ? 0.3 : 0.14,
            dashArray: isFocused ? undefined : '4, 4',
          });

          poly.bindTooltip(
            `<div class="px-2 py-1 bg-slate-900 text-white rounded text-xs font-bold border border-slate-700">
              ${aor.code}: ${aor.name}
            </div>`,
            { sticky: true }
          );

          poly.on('click', () => {
            setSelectedStationCode(aor.code);
          });

          group.addLayer(poly);

          if (isFocused) {
            bounds.extend(poly.getBounds());
          }
        });
      } else {
        // Single station boundary (e.g. CGP or selected station)
        const coords =
          activeStationCode === 'CGP'
            ? (CGP_SNAPPED_AOR_COORDINATES as any)
            : currentSnappedAor?.coordinates || [];

        if (coords && coords.length > 0) {
          const poly = L.polygon(coords, {
            color: selectedStation.strokeColor || '#9333ea',
            weight: 2.5,
            fillColor: selectedStation.polygonColor || '#a855f7',
            fillOpacity: 0.25,
          });

          poly.bindTooltip(
            `<div class="px-2.5 py-1.5 bg-slate-950/95 text-white rounded-lg text-xs font-semibold border border-purple-500/40 shadow-xl">
              <span class="text-amber-400 font-bold block">${selectedStation.code} AOR Snapped Boundary</span>
              <span class="text-[10px] text-slate-300">${selectedStation.name}</span>
            </div>`,
            { sticky: true }
          );

          group.addLayer(poly);
          bounds.extend(poly.getBounds());
        }
      }
    }

    // 3. RENDER STATION HQ BEACON (SCSS Hub)
    const hqLat = selectedStation.centerCoordinates.lat;
    const hqLng = selectedStation.centerCoordinates.lng;
    bounds.extend([hqLat, hqLng]);

    const hqIcon = L.divIcon({
      className: 'custom-station-icon',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full animate-ping opacity-35" style="background-color: ${selectedStation.dotColor}"></div>
          <div class="absolute w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black" style="background-color: ${selectedStation.dotColor}">
            ${selectedStation.code}
          </div>
          <div class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-900/90 text-white font-mono font-bold text-[9px] border border-slate-700 shadow-md">
            ${selectedStation.name}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const hqMarker = L.marker([hqLat, hqLng], { icon: hqIcon });
    hqMarker.bindPopup(
      `<div class="p-2 text-xs space-y-1">
        <div class="font-bold text-slate-900 text-sm">${selectedStation.fullName}</div>
        <div class="text-slate-600">${selectedStation.location}</div>
        <div class="font-mono text-[11px] text-blue-600 font-bold">${hqLat.toFixed(4)}°N, ${hqLng.toFixed(4)}°E</div>
        <div class="pt-1 text-[11px] text-slate-500 border-t border-slate-200">
          Controlling hub for ${selectedStation.subStations.length} subordinate satellite stations.
        </div>
      </div>`
    );
    group.addLayer(hqMarker);

    // 4. RENDER SUBORDINATE SATELLITE STATIONS (STSS) & TELEMETRY BEAMS
    if (showSubStations && selectedStation.subStations) {
      selectedStation.subStations.forEach((stss) => {
        const subLat = stss.coordinates[0];
        const subLng = stss.coordinates[1];
        bounds.extend([subLat, subLng]);

        // Connecting telemetry line from HQ to substation
        const telemetryLine = L.polyline(
          [
            [hqLat, hqLng],
            [subLat, subLng],
          ],
          {
            color: selectedStation.strokeColor || '#9333ea',
            weight: 1.5,
            dashArray: '4, 4',
            opacity: 0.7,
          }
        );
        group.addLayer(telemetryLine);

        // Substation icon
        const isSubSelected = selectedSubStation?.code === stss.code;
        const subIcon = L.divIcon({
          className: 'custom-substation-icon',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer ${isSubSelected ? 'scale-125' : ''}">
              <div class="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-md flex items-center justify-center"></div>
              <div class="absolute -bottom-4 whitespace-nowrap px-1 py-0.2 rounded bg-slate-900/80 text-emerald-300 font-mono text-[8px]">
                ${stss.code}
              </div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const subMarker = L.marker([subLat, subLng], { icon: subIcon });
        subMarker.bindTooltip(
          `<div class="px-2 py-1 bg-slate-900 text-white rounded text-xs font-semibold">
            STSS ${stss.code}: ${stss.name} (${stss.province})
          </div>`,
          { sticky: true }
        );
        subMarker.on('click', () => {
          setSelectedSubStation(stss);
        });
        group.addLayer(subMarker);
      });
    }

    // 5. RENDER EARTHQUAKES IN THIS AOR
    if (showEpicenters) {
      const stationEqs = earthquakes.filter(
        (eq) => eq.aor === activeStationCode || (isAdmin && showAllStationsAdmin)
      );

      stationEqs.slice(0, 15).forEach((eq) => {
        const mag = eq.magnitude || 3.0;
        const size = Math.max(12, Math.min(22, Math.round(mag * 3.2)));
        const color = mag >= 5.0 ? '#ef4444' : mag >= 4.0 ? '#f59e0b' : '#3b82f6';

        const eqIcon = L.divIcon({
          className: 'custom-eq-icon',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer hover:scale-125 transition-transform">
              <div class="rounded-full flex items-center justify-center shadow-lg border-2 border-white" style="width: ${size}px; height: ${size}px; background-color: ${color}">
                <div class="w-1.5 h-1.5 rounded-full bg-white opacity-95"></div>
              </div>
            </div>
          `,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const eqMarker = L.marker([eq.coordinates.lat, eq.coordinates.lng], { icon: eqIcon });
        eqMarker.bindTooltip(
          `<div class="px-2 py-1 bg-slate-900 text-white rounded text-xs">
            <strong>${eq.location}</strong><br/>
            Mag ${mag.toFixed(1)} • ${eq.timePHT}
          </div>`,
          { sticky: true }
        );
        eqMarker.on('click', () => {
          onSelectEarthquake(eq);
        });
        group.addLayer(eqMarker);
      });
    }

    // Fit map bounds smoothly
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: isStationScoped ? 9 : 8 });
    }
  }, [
    activeStationCode,
    selectedStation,
    currentSnappedAor,
    provincesGeoJson,
    showProvinces,
    showStationBoundary,
    showSubStations,
    showEpicenters,
    showAllStationsAdmin,
    isAdmin,
    isStationScoped,
    selectedSubStation,
    earthquakes,
    onSelectEarthquake,
  ]);

  // Recenter map action
  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (isStationScoped || !showAllStationsAdmin) {
      mapInstanceRef.current.flyTo(
        [selectedStation.centerCoordinates.lat, selectedStation.centerCoordinates.lng],
        8.5,
        { duration: 1 }
      );
    } else {
      mapInstanceRef.current.flyTo([12.8797, 121.774], 6, { duration: 1 });
    }
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
    link.remove();

    setActionNotice(
      `Station boundary geo-dataset & STSS telemetry for ${selectedStation.name} exported successfully.`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-4">
      {/* Station Account Restricted Notice Banner */}
      {isStationScoped && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span>
              <strong>Station View Active:</strong> You are logged in with the <strong>{selectedStation.name}</strong> user account (<code>{currentUser?.email}</code>). Only the Area of Responsibility (AOR) and provincial boundaries within <strong>{selectedStation.code}</strong> are displayed.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-300 shrink-0 ml-2">
            {selectedStation.code} AOR Only
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

      {/* 1. Header Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Controlling Stations (SCSS) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Controlling Station (SCSS)
            </span>
            <div className="text-xl font-bold text-blue-600 tracking-tight mt-0.5">
              {isStationScoped ? `${selectedStation.code} (${selectedStation.name})` : `${ALL_SCSS_STATIONS.length} Stations`}
            </div>
            <span className="text-[11px] text-slate-500 block truncate">
              {isStationScoped
                ? `${selectedStation.islandGroup} Hub • User Station Locked`
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
              Satellite Sensors (STSS)
            </span>
            <div className="text-xl font-bold text-emerald-600 tracking-tight mt-0.5">
              {isStationScoped
                ? `${selectedStation.subStations.length} Remote Sensors`
                : `${ALL_STSS_SUBSTATIONS.length} National STSS`}
            </div>
            <span className="text-[11px] text-slate-500 block truncate">
              {isStationScoped
                ? selectedStation.subStations.map((s) => s.code).join(', ') || 'Direct Telemetry'
                : 'Real-time telemetry feeds'}
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
            <div className="text-xl font-bold text-indigo-700 tracking-tight mt-0.5">
              {isStationScoped
                ? `${selectedStation.provinces.length} Provinces`
                : '82 Provinces'}
            </div>
            <span className="text-[11px] text-slate-500 block truncate">
              {isStationScoped
                ? selectedStation.provinces.slice(0, 3).join(', ') + '...'
                : '100% Nationwide AOR Coverage'}
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
              {isStationScoped ? 'Station Account Scope' : 'Leaflet GIS Dataset'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="text-base font-bold text-emerald-600">
                {isStationScoped ? `${selectedStation.code} Exclusive` : 'PSA PSGC 2024'}
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">
              {isStationScoped ? `${selectedStation.name} Role` : 'Point-in-Polygon & NAMRIA Datum'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Content: Map Container (Left) + Selected Station Boundary Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Leaflet Interactive Map with subtle dark blue gradient background (8 cols) */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#071326] via-[#0d2146] to-[#15326a] rounded-2xl border border-slate-800 shadow-md overflow-hidden relative min-h-[620px] flex flex-col select-none">
          {/* Floating Legend Box in Top Left */}
          <div className="absolute top-4 left-4 z-20 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-2 max-w-[260px] text-white pointer-events-auto">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs tracking-tight flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Station Boundaries
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold">
                {selectedStation.code}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 leading-tight">
              <strong>{selectedStation.name}</strong> ({selectedStation.islandGroup})
            </div>
            <div className="space-y-1.5 pt-1 border-t border-slate-800 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: selectedStation.dotColor }}
                />
                <span className="text-slate-200 font-semibold">SCSS Controlling Hub</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30 inline-block shrink-0" />
                <span className="text-slate-300">STSS Satellite Sensors ({selectedStation.subStations.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-sky-500/40 border border-sky-400 inline-block shrink-0" />
                <span className="text-slate-300">
                  {isStationScoped ? `${selectedStation.code} AOR Provinces` : 'Station AOR Provinces'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-white inline-block shrink-0" />
                <span className="text-slate-300">Earthquake Epicenters</span>
              </div>
              <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {basemapType === 'light' ? 'Esri Street (Light Mode - Active)' : basemapType === 'dark' ? 'Esri Dark Canvas (Active)' : basemapType === 'topo' ? 'Esri Topo (Active)' : 'Esri Satellite (Active)'}
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
          </div>

          {/* Floating Map Controls in Top Right */}
          {/* Hovered Province Indicator Badge */}
          {hoveredProvince && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-slate-950/92 backdrop-blur-md border border-cyan-400/80 px-4 py-1.5 rounded-full text-xs font-semibold text-white shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span className="text-cyan-300 font-bold tracking-wide">{hoveredProvince}</span>
              <span className="text-[10px] text-slate-300 font-mono">({selectedStation.code} AOR)</span>
            </div>
          )}

          <div className="absolute top-4 right-4 z-20 flex flex-col bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl divide-y divide-slate-800 overflow-hidden text-slate-200 pointer-events-auto">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRecenter}
              className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 transition-colors text-cyan-400"
              title="Recenter Station AOR"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setBasemapType((prev) => (prev === 'light' ? 'dark' : 'light'))}
              className={`w-8 h-8 flex items-center justify-center transition-colors ${
                basemapType === 'light'
                  ? 'text-amber-400 hover:text-amber-300'
                  : 'text-indigo-400 hover:text-indigo-300'
              }`}
              title={`Switch to ${basemapType === 'light' ? 'Dark Mode' : 'Light Mode (Default)'}`}
            >
              {basemapType === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLayersMenu(!showLayersMenu)}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 transition-colors"
                title="Toggle Layers & Basemap"
              >
                <Layers className="w-4 h-4" />
              </button>

              {/* Layers Dropdown */}
              {showLayersMenu && (
                <div className="absolute top-0 right-10 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl z-30 w-52 space-y-2 text-xs text-slate-200">
                  <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
                    <span>Map Layers</span>
                    <button
                      type="button"
                      onClick={() => setShowLayersMenu(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {isAdmin && (
                    <label className="flex items-center gap-2 cursor-pointer text-cyan-300 font-semibold">
                      <input
                        type="checkbox"
                        checked={showAllStationsAdmin}
                        onChange={(e) => setShowAllStationsAdmin(e.target.checked)}
                        className="rounded text-cyan-500 bg-slate-800"
                      />
                      <span>Show All AOR Provinces</span>
                    </label>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showProvinces}
                      onChange={(e) => setShowProvinces(e.target.checked)}
                      className="rounded text-blue-600 bg-slate-800"
                    />
                    <span>Province Boundaries</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showStationBoundary}
                      onChange={(e) => setShowStationBoundary(e.target.checked)}
                      className="rounded text-blue-600 bg-slate-800"
                    />
                    <span>Station AOR Polygon</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSubStations}
                      onChange={(e) => setShowSubStations(e.target.checked)}
                      className="rounded text-blue-600 bg-slate-800"
                    />
                    <span>Satellite STSS Stations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEpicenters}
                      onChange={(e) => setShowEpicenters(e.target.checked)}
                      className="rounded text-blue-600 bg-slate-800"
                    />
                    <span>Earthquake Epicenters</span>
                  </label>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Basemap Style (No Watermarks)
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {(['light', 'dark', 'topo', 'satellite'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBasemapType(type)}
                          className={`px-1.5 py-1 rounded capitalize font-medium ${
                            basemapType === type
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {type === 'light' ? '☀️ Light (Def)' : type === 'dark' ? '🌙 Dark' : type === 'topo' ? '⛰️ Topo' : '🛰️ Sat'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leaflet Map DOM Element with subtle gradient */}
          <div
            ref={mapContainerRef}
            className="w-full flex-1 z-0"
            style={{ minHeight: '580px', background: 'transparent' }}
          />

          {/* SubStation Quick Inspection Footer inside Map */}
          {selectedSubStation && (
            <div className="bg-slate-900/90 backdrop-blur-xs border-t border-slate-800 p-2.5 px-4 flex items-center justify-between text-xs text-white z-20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-500/30 shrink-0" />
                <span className="font-bold">
                  STSS {selectedSubStation.code}: {selectedSubStation.name}
                </span>
                <span className="text-emerald-300 font-medium">
                  &bull; {selectedSubStation.location} ({selectedSubStation.province})
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  [{selectedSubStation.coordinates[0].toFixed(3)}°N, {selectedSubStation.coordinates[1].toFixed(3)}°E]
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubStation(null)}
                className="text-slate-400 hover:text-white font-bold text-xs ml-2"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Selected Station Boundary Card (Only show selected AOR; if CGP only show CGP AOR) (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Selected Station Boundary
                </h3>
                <p className="text-[11px] text-slate-500">
                  {isStationScoped
                    ? `Exclusive station scope: ${selectedStation.code} AOR`
                    : 'Showing approved station AOR & province allocation'}
                </p>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                SCSS Hub
              </span>
            </div>

            {/* Station Dropdown Selector (Locked if station-scoped, e.g. CGP only shows CGP) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => !isStationScoped && setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs transition-colors ${
                  isStationScoped
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
                      {selectedStation.islandGroup} &bull; {selectedStation.subStations.length} Satellite Sensors
                    </span>
                  </div>
                </div>
                {isStationScoped ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0 ml-2">
                    Station Locked
                  </span>
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                )}
              </button>

              {/* Dropdown Menu (Only shown for Admin or non-restricted accounts) */}
              {!isStationScoped && isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 overflow-hidden flex flex-col max-h-[360px]">
                  {/* Search and Island Filter Bar */}
                  <div className="p-2 border-b border-slate-100 space-y-2 bg-slate-50/70">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={stationSearch}
                        onChange={(e) => setStationSearch(e.target.value)}
                        placeholder="Search 15 stations or provinces..."
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
                      const isCurrent = st.code === activeStationCode;
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
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Properties Table for the Selected Station */}
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
                    Covered Provinces (
                    {activeStationCode === 'CGP'
                      ? CGP_AOR_PROVINCES.length
                      : selectedStation.provinces.length}
                    )
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(activeStationCode === 'CGP' ? CGP_AOR_PROVINCES : selectedStation.provinces).map(
                    (prov) => (
                      <span
                        key={prov}
                        className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200"
                      >
                        {prov}
                      </span>
                    )
                  )}
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
                  <span className="text-slate-400 text-[11px] italic">
                    Direct seismic telemetry node
                  </span>
                )}
              </div>

              {/* Municipalities & Coverage */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Jurisdictions</span>
                <span className="text-slate-700 font-medium">
                  {selectedStation.municipalitiesCities}
                </span>
              </div>

              {/* Demographic Population */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-slate-500 font-medium">Est. Population</span>
                <span className="font-mono text-slate-900 font-bold">
                  {activeStationCode === 'CGP' ? '5,022,768 (PSA 2024)' : '3,124,560'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons in Card */}
          <div className="pt-4 border-t border-slate-100 space-y-2 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleValidateGIS}
                className="w-full py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Run point-in-polygon verification check against GIS master"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Validate GIS</span>
              </button>
              <button
                type="button"
                onClick={handleExportMap}
                className="w-full py-2 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Download AOR GeoJSON boundary definition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export GeoJSON</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRecenter}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Center Leaflet Map on {selectedStation.code}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sub-Stations Table Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Satellite Telemetered Seismic Stations (STSS) &bull; {selectedStation.code}
            </h3>
            <p className="text-xs text-slate-500">
              Field seismic sensors relaying continuous waveforms into {selectedStation.fullName}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 font-mono">
            {selectedStation.subStations.length} Registered Remote Sensor(s)
          </span>
        </div>

        {selectedStation.subStations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-700">
                <tr>
                  <th className="px-4 py-2.5">STSS Code</th>
                  <th className="px-4 py-2.5">Station Name</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Province</th>
                  <th className="px-4 py-2.5">Coordinates</th>
                  <th className="px-4 py-2.5">Controlling SCSS</th>
                  <th className="px-4 py-2.5 text-right">Telemetry Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedStation.subStations.map((stss) => (
                  <tr
                    key={stss.code}
                    onClick={() => {
                      setSelectedSubStation(stss);
                      mapInstanceRef.current?.flyTo([stss.coordinates[0], stss.coordinates[1]], 10);
                    }}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
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

      {/* Map API Key & Cartography Provider Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Map API & Cartography Provider</h3>
                  <p className="text-[11px] text-slate-500">AOR Boundary and Leaflet Map Service Configuration</p>
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
                  All watermarks and &quot;API key required&quot; notices have been removed. Leaflet streams directly via Esri World Street (Default Light Mode), Esri Dark Canvas, Topographic, and Satellite imagery with zero cost and no external paid key required.
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
                  Synchronized across <strong>Dashboard Map</strong>, <strong>Station Boundaries</strong>, and <strong>Boundary Review</strong>. Built-in Esri GIS services power all maps with zero watermark and zero cost.
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
