import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Crosshair,
  Plus,
  Minus,
  Maximize2,
  Search,
  Eye,
  EyeOff,
  Radio,
  MapPin,
  Compass,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  Info,
  X,
  Clock,
  Filter,
  Calendar,
  RotateCcw,
  Sparkles,
  Check,
  CheckCircle2,
  Key,
  Sun,
  Moon,
} from 'lucide-react';
import { EarthquakeRecord, AORType, UserProfile } from '../types';
import {
  PHILIPPINES_REGIONS,
  PHILIPPINES_PROVINCES,
  SEISMIC_STATIONS,
  STATION_AORS,
  PhilippineRegion,
  PhilippineProvince,
} from '../data/philippinesGeoData';

interface PhilippinesMapProps {
  earthquakes: EarthquakeRecord[];
  onSelectEarthquake: (eq: EarthquakeRecord) => void;
  selectedEarthquake?: EarthquakeRecord | null;
  onClearSelectedEarthquake?: () => void;
  selectedAorFilter?: AORType | 'ALL';
  currentUser?: UserProfile;
  isDashboard?: boolean;
  mapHeight?: number;
  onHeightChange?: (height: number) => void;
  mapWidthPercent?: number;
  onWidthPercentChange?: (pct: number) => void;
}

type BasemapType =
  | 'esri_street'
  | 'esri_topo'
  | 'osm'
  | 'esri_light_gray'
  | 'esri_dark_gray'
  | 'satellite';

interface BasemapConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  subdomains?: string | string[];
  theme: 'light' | 'dark' | 'satellite';
}

const BASEMAP_TILES: Record<BasemapType, BasemapConfig> = {
  esri_street: {
    name: 'Esri World Street (Default Light)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Street Map (Free & No Watermark)',
    maxZoom: 19,
    theme: 'light',
  },
  esri_topo: {
    name: 'Esri World Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Topographic (Free & No Watermark)',
    maxZoom: 18,
    theme: 'light',
  },
  osm: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors (Free & No Watermark)',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
    theme: 'light',
  },
  esri_light_gray: {
    name: 'Esri Light Gray Canvas',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Minimalist Canvas (Free & No Watermark)',
    maxZoom: 18,
    theme: 'light',
  },
  esri_dark_gray: {
    name: 'Esri Dark Gray Tactical',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Dark Tactical Canvas (Free & No Watermark)',
    maxZoom: 18,
    theme: 'dark',
  },
  satellite: {
    name: 'Esri Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; High-Res Satellite Imagery (Free & No Watermark)',
    maxZoom: 18,
    theme: 'satellite',
  },
};

export const PhilippinesMap: React.FC<PhilippinesMapProps> = ({
  earthquakes,
  onSelectEarthquake,
  selectedEarthquake,
  onClearSelectedEarthquake,
  selectedAorFilter = 'ALL',
  currentUser,
  isDashboard = false,
  mapHeight = 680,
  onHeightChange,
  mapWidthPercent = 52,
  onWidthPercentChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Station scoping check: Cagayan de Oro CGP account vs Palayan PCP vs Global
  const isCgpScoped =
    selectedAorFilter === 'CGP' ||
    currentUser?.assignedAor === 'CGP' ||
    currentUser?.email?.includes('cagayan') ||
    currentUser?.name?.toLowerCase().includes('cagayan');

  const isStationScoped =
    isCgpScoped ||
    selectedAorFilter === 'PCP' ||
    (currentUser?.assignedAor && currentUser.assignedAor !== 'ALL');

  // Layer groups refs
  const regionsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const provincesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const aorLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const earthquakesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer visibility state
  const [showRegions, setShowRegions] = useState<boolean>(true);
  const [showProvinces, setShowProvinces] = useState<boolean>(!isDashboard);
  const [showAorBoundaries, setShowAorBoundaries] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showEarthquakes, setShowEarthquakes] = useState<boolean>(true);

  // Official Philippine Regions Boundary GeoJSON (NAMRIA Geoportal Philippines & PSA PSGC)
  const [regionsGeoJson, setRegionsGeoJson] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/data/philippines-regions-psgc.geojson')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load regions geojson');
        return res.json();
      })
      .then((data) => {
        if (isMounted) setRegionsGeoJson(data);
      })
      .catch((err) => {
        console.warn('Could not load official region geojson, will use fallback', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Map Theme & Basemap State (DEFAULT: Light Mode with Esri World Street)
  const [mapTheme, setMapTheme] = useState<'light' | 'dark'>('light');
  const [basemap, setBasemap] = useState<BasemapType>('esri_street');

  const handleToggleMapTheme = () => {
    if (mapTheme === 'light') {
      setMapTheme('dark');
      setBasemap('esri_dark_gray');
    } else {
      setMapTheme('light');
      setBasemap('esri_street');
    }
  };

  const handleSelectBasemap = (key: BasemapType) => {
    setBasemap(key);
    if (key === 'esri_dark_gray') {
      setMapTheme('dark');
    } else if (key === 'esri_street' || key === 'esri_topo' || key === 'osm' || key === 'esri_light_gray') {
      setMapTheme('light');
    }
  };
  const [showLayersDropdown, setShowLayersDropdown] = useState<boolean>(false);
  const [showQuickJumpDropdown, setShowQuickJumpDropdown] = useState<boolean>(false);
  const quickJumpDropdownRef = useRef<HTMLDivElement | null>(null);
  const layersDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close header dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        quickJumpDropdownRef.current &&
        !quickJumpDropdownRef.current.contains(target)
      ) {
        setShowQuickJumpDropdown(false);
      }
      if (
        layersDropdownRef.current &&
        !layersDropdownRef.current.contains(target)
      ) {
        setShowLayersDropdown(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowQuickJumpDropdown(false);
        setShowLayersDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  const [showBoundaryInfoModal, setShowBoundaryInfoModal] = useState<boolean>(false);
  // Map API Key State (synchronized across Dashboard Map, Station Boundaries, and Boundary Review)
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('alertx_map_api_key') || '';
  });
  const [apiKeyNotice, setApiKeyNotice] = useState<string | null>(null);
  const [hoveredLocationInfo, setHoveredLocationInfo] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(6);
  const [filterMode, setFilterMode] = useState<'ALL' | 'INSIDE' | 'OUTSIDE'>('ALL');
  const [provinceSearch, setProvinceSearch] = useState<string>('');

  // Search by parameters state (DEFAULT: only latest earthquakes within the day)
  const [showSearchParametersPanel, setShowSearchParametersPanel] = useState<boolean>(false);
  const [earthquakeSearchQuery, setEarthquakeSearchQuery] = useState<string>('');
  const [timeWindow, setTimeWindow] = useState<'TODAY' | '24H' | '7D' | 'ALL' | 'CUSTOM'>('TODAY');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>('');
  const [minMagnitudeFilter, setMinMagnitudeFilter] = useState<number>(0);
  const [depthFilter, setDepthFilter] = useState<'ALL' | 'SHALLOW' | 'INTERMEDIATE' | 'DEEP'>('ALL');

  // Determine latest calendar date in current earthquake feed for "within the day" default
  const latestDatasetDate = useMemo(() => {
    if (!earthquakes || earthquakes.length === 0) return '';
    for (const eq of earthquakes) {
      if (eq.date) return eq.date;
    }
    return '';
  }, [earthquakes]);

  // Unique dates for custom parameter search
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    earthquakes.forEach((eq) => {
      if (eq.date) set.add(eq.date);
    });
    return Array.from(set).sort().reverse();
  }, [earthquakes]);

  // Check if record is within latest day
  const isEarthquakeWithinDay = (eq: EarthquakeRecord) => {
    if (eq.isRecent24h) return true;
    if (latestDatasetDate && eq.date === latestDatasetDate) return true;
    const todayIso = new Date().toISOString().slice(0, 10);
    if (eq.date && eq.date.includes(todayIso)) return true;
    return false;
  };

  const isCustomFilterActive =
    timeWindow !== 'TODAY' ||
    earthquakeSearchQuery.trim() !== '' ||
    minMagnitudeFilter > 0 ||
    depthFilter !== 'ALL' ||
    filterMode !== 'ALL' ||
    selectedCustomDate !== '';

  const handleResetToTodayDefault = () => {
    setTimeWindow('TODAY');
    setEarthquakeSearchQuery('');
    setMinMagnitudeFilter(0);
    setDepthFilter('ALL');
    setFilterMode('ALL');
    setSelectedCustomDate('');
  };

  // Count earthquakes by province and region for tooltips
  const earthquakesByProvince = useMemo(() => {
    const counts: Record<string, number> = {};
    earthquakes.forEach((eq) => {
      if (eq.province) {
        counts[eq.province] = (counts[eq.province] || 0) + 1;
      }
      // Match province from location text
      PHILIPPINES_PROVINCES.forEach((prov) => {
        if (eq.location?.toLowerCase().includes(prov.name.toLowerCase())) {
          counts[prov.name] = (counts[prov.name] || 0) + 1;
        }
      });
    });
    return counts;
  }, [earthquakes]);

  const filteredEarthquakes = useMemo(() => {
    return earthquakes.filter((eq) => {
      // 1. Time / Day parameter (Default: TODAY - only earthquakes within the day)
      if (timeWindow === 'TODAY') {
        if (!isEarthquakeWithinDay(eq)) return false;
      } else if (timeWindow === '24H') {
        if (!eq.isRecent24h) return false;
      } else if (timeWindow === 'CUSTOM' && selectedCustomDate) {
        if (!eq.date?.includes(selectedCustomDate)) return false;
      }

      // 2. Text Search parameter
      if (earthquakeSearchQuery.trim()) {
        const q = earthquakeSearchQuery.toLowerCase().trim();
        const matchLoc = eq.location?.toLowerCase().includes(q);
        const matchProv = eq.province?.toLowerCase().includes(q);
        const matchMuni = eq.municipality?.toLowerCase().includes(q);
        const matchId = eq.id?.toLowerCase().includes(q);
        const matchStation = eq.stationName?.toLowerCase().includes(q);
        if (!matchLoc && !matchProv && !matchMuni && !matchId && !matchStation) {
          return false;
        }
      }

      // 3. Magnitude parameter
      if (minMagnitudeFilter > 0 && eq.magnitude < minMagnitudeFilter) {
        return false;
      }

      // 4. Depth parameter
      if (depthFilter === 'SHALLOW' && eq.depthKm > 30) return false;
      if (depthFilter === 'INTERMEDIATE' && (eq.depthKm <= 30 || eq.depthKm > 70)) return false;
      if (depthFilter === 'DEEP' && eq.depthKm <= 70) return false;

      // 5. AOR / Scoping parameter
      if (filterMode === 'INSIDE') {
        if (isCgpScoped) return eq.aor === 'CGP';
        if (selectedAorFilter === 'PCP') return eq.aor === 'PCP';
        if (selectedAorFilter === 'BIP') return eq.aor === 'BIP';
        return eq.aor === 'PCP' || eq.aor === 'BIP' || eq.aor === 'CGP';
      }
      if (filterMode === 'OUTSIDE') {
        if (isCgpScoped) return eq.aor !== 'CGP';
        if (selectedAorFilter === 'PCP') return eq.aor !== 'PCP';
        return eq.aor === 'Outside AOR';
      }
      return true;
    });
  }, [
    earthquakes,
    timeWindow,
    selectedCustomDate,
    earthquakeSearchQuery,
    minMagnitudeFilter,
    depthFilter,
    filterMode,
    selectedAorFilter,
    isCgpScoped,
    latestDatasetDate,
  ]);

  // Initial Map Setup
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Philippines Bounds: 4.5°N to 21.5°N, 116.0°E to 127.5°E
    const philippinesCenter: [number, number] =
      isCgpScoped
        ? [8.482, 124.647]
        : selectedAorFilter === 'PCP'
        ? [15.541, 121.084]
        : [12.8797, 121.774];
    const initialZoom = isCgpScoped || selectedAorFilter === 'PCP' ? 8 : 6;

    const map = L.map(mapContainerRef.current, {
      center: philippinesCenter,
      zoom: initialZoom,
      minZoom: 5,
      maxZoom: 17,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [
        [3.0, 114.0],
        [22.5, 130.0],
      ],
      maxBoundsViscosity: 0.8,
    });

    // Add scale bar
    L.control
      .scale({
        imperial: false,
        metric: true,
        position: 'bottomleft',
      })
      .addTo(map);

    // Initial tile layer
    const initialConfig = BASEMAP_TILES[basemap];
    const initialTile = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: initialConfig.maxZoom || 18,
      subdomains: initialConfig.subdomains || 'abc',
    }).addTo(map);
    tileLayerRef.current = initialTile;

    // Create layer groups
    regionsLayerGroupRef.current = L.layerGroup().addTo(map);
    provincesLayerGroupRef.current = L.layerGroup().addTo(map);
    aorLayerGroupRef.current = L.layerGroup().addTo(map);
    stationsLayerGroupRef.current = L.layerGroup().addTo(map);
    earthquakesLayerGroupRef.current = L.layerGroup().addTo(map);

    // Track mouse move for coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: parseFloat(e.latlng.lat.toFixed(4)),
        lng: parseFloat(e.latlng.lng.toFixed(4)),
      });
    });

    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapInstanceRef.current = map;

    // Attach ResizeObserver to automatically invalidate Leaflet size when stretched horizontally or vertically
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size whenever mapHeight or mapWidthPercent changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [mapHeight, mapWidthPercent]);

  // Update Basemap Tiles
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const cfg = BASEMAP_TILES[basemap];
    const newTile = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: cfg.maxZoom || 18,
      subdomains: cfg.subdomains || 'abc',
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
    newTile.bringToBack();
  }, [basemap]);

  // Render Administrative Regions with Official NAMRIA / PSA PSGC Boundary Polygons
  useEffect(() => {
    const group = regionsLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showRegions) return;

    if (regionsGeoJson && regionsGeoJson.features) {
      // Official high-resolution NAMRIA / PSA PSGC boundary polygons
      const geoJsonLayer = L.geoJSON(regionsGeoJson, {
        style: (feature) => {
          const color = feature?.properties?.color || '#3b82f6';
          return {
            color: color,
            weight: 1.8,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: 0.08,
            dashArray: '3, 4',
          };
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          const color = props.color || '#3b82f6';
          const provs: string[] = props.provinces || [];

          // Hover interaction
          layer.on({
            mouseover: (e) => {
              const target = e.target;
              target.setStyle({
                weight: 2.8,
                fillOpacity: 0.22,
                opacity: 1,
              });
              if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                target.bringToFront();
              }
              setHoveredLocationInfo(
                `${props.name} (${props.shortName}) – ${props.islandGroup} [Official NAMRIA/PSA Boundary]`
              );
            },
            mouseout: (e) => {
              geoJsonLayer.resetStyle(e.target);
              setHoveredLocationInfo(null);
            },
            click: (e) => {
              mapInstanceRef.current?.flyToBounds(e.target.getBounds(), {
                padding: [30, 30],
                duration: 1,
              });
            },
          });

          // Live earthquake count for provinces in this region
          const regionEqCount = provs.reduce(
            (acc, p) => acc + (earthquakesByProvince[p] || 0),
            0
          );

          // Rich tooltip with official source badge
          layer.bindTooltip(
            `<div class="text-xs font-sans">
              <div class="flex items-center gap-1.5 font-bold text-slate-900">
                <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
                ${props.name}
              </div>
              <div class="text-[11px] text-slate-600 mt-0.5">
                ${props.islandGroup} &bull; ${provs.length} provinces &bull; PSGC: ${props.psgcCode || ''}
              </div>
              <div class="text-[10px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>●</span> ${regionEqCount} live events recorded
              </div>
              <div class="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 inline-block font-medium">
                ✓ Official NAMRIA / PSA PSGC Boundary
              </div>
            </div>`,
            {
              permanent: false,
              direction: 'center',
              className: 'region-tooltip bg-white shadow-md border border-slate-200 rounded px-2.5 py-1.5',
            }
          );

          // Rich official popup on click
          layer.bindPopup(
            `<div class="p-1 font-sans text-xs max-w-[280px]">
              <div class="flex items-center gap-1.5 font-bold text-slate-900 text-sm border-b border-slate-200 pb-1.5">
                <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${color}"></span>
                <span>${props.name}</span>
              </div>
              <div class="mt-2 space-y-1 text-slate-600 text-[11px]">
                <div><span class="font-semibold text-slate-800">Designation:</span> ${props.code || ''} (${props.shortName || ''})</div>
                <div><span class="font-semibold text-slate-800">Island Group:</span> ${props.islandGroup || ''}</div>
                <div><span class="font-semibold text-slate-800">PSGC Code:</span> <code class="font-mono bg-slate-100 px-1 rounded">${props.psgcCode || 'Official'}</code></div>
                <div><span class="font-semibold text-slate-800">Provinces (${provs.length}):</span> ${provs.join(', ')}</div>
                <div class="text-blue-700 font-semibold pt-1"><span>Live Earthquake Activity:</span> ${regionEqCount} events</div>
              </div>
              <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span class="text-emerald-700 font-bold">✓ NAMRIA / PSA PSGC 2024</span>
                <span class="text-slate-400">geoportal.gov.ph</span>
              </div>
            </div>`
          );
        },
      });

      group.addLayer(geoJsonLayer);
    } else {
      // Fallback while loading
      PHILIPPINES_REGIONS.forEach((region) => {
        const polygon = L.polygon(region.boundary, {
          color: region.color,
          weight: 1.8,
          opacity: 0.85,
          fillColor: region.color,
          fillOpacity: 0.08,
          dashArray: '3, 4',
        });

        polygon.on('mouseover', () => {
          polygon.setStyle({
            weight: 2.8,
            fillOpacity: 0.22,
            opacity: 1,
          });
          setHoveredLocationInfo(`${region.name} (${region.shortName}) – ${region.islandGroup}`);
        });

        polygon.on('mouseout', () => {
          polygon.setStyle({
            weight: 1.8,
            fillOpacity: 0.08,
            opacity: 0.85,
          });
          setHoveredLocationInfo(null);
        });

        polygon.on('click', () => {
          mapInstanceRef.current?.flyToBounds(polygon.getBounds(), {
            padding: [30, 30],
            duration: 1,
          });
        });

        const regionEqCount = region.provinces.reduce(
          (acc, p) => acc + (earthquakesByProvince[p] || 0),
          0
        );

        polygon.bindTooltip(
          `<div class="text-xs font-sans">
            <div class="font-bold text-slate-900">${region.name}</div>
            <div class="text-[11px] text-slate-600">${region.islandGroup} &bull; ${region.provinces.length} provinces</div>
            <div class="text-[10px] text-blue-600 font-semibold mt-0.5">${regionEqCount} live events recorded</div>
          </div>`,
          {
            permanent: false,
            direction: 'center',
            className: 'region-tooltip bg-white shadow-md border border-slate-200 rounded px-2 py-1',
          }
        );

        group.addLayer(polygon);
      });
    }
  }, [showRegions, regionsGeoJson, earthquakesByProvince]);

  // Render Philippine Provinces
  useEffect(() => {
    const group = provincesLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showProvinces) return;

    PHILIPPINES_PROVINCES.forEach((province) => {
      const eqCount = earthquakesByProvince[province.name] || 0;
      const hasEvents = eqCount > 0;

      // Custom DivIcon for province centroid
      const provinceIcon = L.divIcon({
        className: 'custom-province-icon',
        html: `
          <div class="group relative flex items-center justify-center cursor-pointer">
            <div class="w-2 h-2 rounded-full ${
              hasEvents ? 'bg-amber-500 ring-2 ring-amber-300' : 'bg-slate-400/80 ring-1 ring-white'
            } transition-transform group-hover:scale-150"></div>
            <span class="absolute left-3 whitespace-nowrap text-[9px] font-medium tracking-tight px-1 py-0.5 rounded shadow-xs bg-white/85 text-slate-700 border border-slate-200/60 pointer-events-none group-hover:opacity-100 group-hover:bg-slate-900 group-hover:text-white transition-opacity ${
              currentZoom >= 8 ? 'opacity-90' : 'opacity-0 group-hover:opacity-100'
            }">
              ${province.name}
            </span>
          </div>
        `,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });

      const marker = L.marker(province.center, { icon: provinceIcon });

      marker.bindTooltip(
        `<div class="text-xs font-sans">
          <div class="font-bold text-slate-900">${province.name}</div>
          <div class="text-[11px] text-slate-600">Capital: ${province.capital} &bull; ${province.regionCode}</div>
          <div class="text-[10px] ${hasEvents ? 'text-amber-600 font-semibold' : 'text-slate-500'} mt-0.5">
            ${eqCount} monitored earthquakes
          </div>
        </div>`,
        {
          direction: 'top',
          offset: [0, -6],
          className: 'province-tooltip bg-white shadow-md border border-slate-200 rounded px-2.5 py-1.5',
        }
      );

      marker.on('click', () => {
        mapInstanceRef.current?.flyTo(province.center, 9, { duration: 1 });
      });

      group.addLayer(marker);
    });
  }, [showProvinces, currentZoom, earthquakesByProvince]);

  // Auto-focus map when selectedAorFilter changes to PCP or CGP
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (isCgpScoped) {
      mapInstanceRef.current.flyTo([8.482, 124.647], 8.5, { duration: 1 });
    } else if (selectedAorFilter === 'PCP') {
      mapInstanceRef.current.flyTo([15.541, 121.084], 8, { duration: 1 });
    }
  }, [selectedAorFilter, isCgpScoped]);

  // Render Official Station AOR Boundaries (PCP, BIP, CGP)
  useEffect(() => {
    const group = aorLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showAorBoundaries) return;

    // For the Cagayan de Oro CGP account, remove PCP and BIP AORs from the map:
    let aorsToRender = STATION_AORS;
    if (isCgpScoped) {
      aorsToRender = STATION_AORS.filter((aor) => aor.code === 'CGP');
    } else if (selectedAorFilter && selectedAorFilter !== 'ALL') {
      aorsToRender = STATION_AORS.filter((aor) => aor.code === selectedAorFilter);
    }

    aorsToRender.forEach((aor) => {
      const isFocused = isCgpScoped ? aor.code === 'CGP' : selectedAorFilter === aor.code;
      const strokeColor = isFocused ? '#00f0ff' : '#2563eb';
      const fillColor = isFocused ? '#00f0ff' : '#0a1d47';
      const polygon = L.polygon(aor.coordinates as any, {
        color: strokeColor,
        weight: isFocused ? 2.8 : 1.8,
        opacity: 0.95,
        fillColor: fillColor,
        fillOpacity: isFocused ? 0.22 : 0.14,
        dashArray: isFocused ? undefined : '5, 5',
      });

      polygon.on('mouseover', () => {
        polygon.setStyle({
          color: '#00f0ff',
          weight: 3.2,
          fillColor: '#06b6d4',
          fillOpacity: 0.3,
        });
        setHoveredLocationInfo(
          `${aor.name} – Snapped to Official PSGC Province Boundaries (${aor.provincesIncluded.join(', ')})`
        );
      });

      polygon.on('mouseout', () => {
        polygon.setStyle({
          color: strokeColor,
          weight: isFocused ? 2.8 : 1.8,
          fillColor: fillColor,
          fillOpacity: isFocused ? 0.22 : 0.14,
        });
        setHoveredLocationInfo(null);
      });

      polygon.on('click', () => {
        mapInstanceRef.current?.flyToBounds(polygon.getBounds(), {
          padding: [30, 30],
          duration: 1,
        });
      });

      polygon.bindPopup(
        `<div class="p-1 space-y-1.5 max-w-xs font-sans text-slate-100">
          <div class="flex items-center gap-2 border-b border-slate-700/80 pb-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span class="font-bold text-sm text-white">${aor.name}</span>
          </div>
          <p class="text-xs text-slate-300 font-medium">Headquarters: <span class="text-cyan-300 font-mono">${aor.headquarters}</span></p>
          <div>
            <span class="text-[10px] uppercase font-bold tracking-wider text-slate-400">Covered Provinces (${aor.provincesIncluded.length}):</span>
            <p class="text-[11px] text-slate-200 mt-0.5 leading-snug">${aor.provincesIncluded.join(', ')}</p>
          </div>
          <div class="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800 font-semibold mt-1 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Snapped to Official PSGC / NAMRIA Boundaries</span>
          </div>
          <div class="pt-1 text-[10px] text-cyan-400 font-semibold flex items-center justify-between border-t border-slate-800 mt-1">
            <span>Telemetric Dispatch: ACTIVE</span>
            <span class="font-mono text-slate-400">${aor.code} AOR</span>
          </div>
        </div>`
      );

      group.addLayer(polygon);
    });
  }, [showAorBoundaries, selectedAorFilter, isCgpScoped]);

  // Render Seismic Monitoring Stations
  useEffect(() => {
    const group = stationsLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showStations) return;

    const stationsToRender = isCgpScoped
      ? isDashboard
        ? SEISMIC_STATIONS.filter((st) => st.code === 'CGP')
        : SEISMIC_STATIONS.filter((st) => {
            // Strictly exclude PCP and BIP stations
            if (
              st.code === 'PCP' ||
              st.code === 'BIP' ||
              st.parentScss === 'PCP' ||
              st.parentScss === 'BIP' ||
              st.aorZone === 'PCP' ||
              st.aorZone === 'BIP'
            ) {
              return false;
            }
            return (
              st.code === 'CGP' ||
              st.parentScss === 'CGP' ||
              st.aorZone === 'CGP' ||
              st.location.includes('Misamis') ||
              st.location.includes('Cagayan de Oro') ||
              st.location.includes('Bukidnon') ||
              st.location.includes('Camiguin') ||
              st.location.includes('Lanao')
            );
          })
      : isDashboard && selectedAorFilter === 'PCP'
      ? SEISMIC_STATIONS.filter((st) => st.code === 'PCP')
      : selectedAorFilter && selectedAorFilter !== 'ALL'
      ? SEISMIC_STATIONS.filter((st) => {
          if (selectedAorFilter === 'PCP') {
            return (
              st.code === 'PCP' ||
              st.parentScss === 'PCP' ||
              st.aorZone === 'PCP' ||
              st.location.includes('Nueva Ecija') ||
              st.location.includes('Aurora') ||
              st.location.includes('Bulacan') ||
              st.location.includes('Pampanga') ||
              st.location.includes('Tarlac') ||
              st.location.includes('Bataan') ||
              st.location.includes('Zambales')
            );
          }
          return (
            st.code === selectedAorFilter ||
            st.parentScss === selectedAorFilter ||
            st.aorZone === selectedAorFilter
          );
        })
      : SEISMIC_STATIONS;

    stationsToRender.forEach((st) => {
      const isAorHead = st.type === 'AOR Head';

      const stationIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <!-- Concentric Expanding Radar Pulse Waves -->
            <div class="absolute w-7 h-7 rounded-full border border-cyan-400 opacity-60 animate-ping pointer-events-none"></div>
            <div class="absolute w-4 h-4 rounded-full border border-sky-400/80 opacity-70 pointer-events-none"></div>
            <!-- Center glowing core beacon -->
            <div class="relative w-3.5 h-3.5 rounded-full ${
              isAorHead ? 'bg-cyan-400 shadow-[0_0_12px_#00f0ff]' : 'bg-emerald-400 shadow-[0_0_10px_#10b981]'
            } flex items-center justify-center border-2 border-white">
              <div class="w-1 h-1 rounded-full bg-white"></div>
            </div>
            <!-- Sleek Glowing Station Code Pill Badge -->
            <div class="absolute left-4 -top-2 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-[#020817]/95 border ${
              isAorHead ? 'border-cyan-400/90 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.4)]' : 'border-slate-700 text-slate-200'
            } text-[9px] font-mono font-bold tracking-wider pointer-events-none transition-transform group-hover:scale-110">
              ${st.code}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(st.coordinates, { icon: stationIcon });

      marker.bindPopup(
        `<div class="p-1 font-sans space-y-1.5 min-w-[210px] text-slate-100">
          <div class="flex items-center justify-between border-b border-slate-700/80 pb-1">
            <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              isAorHead
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }">
              ${isAorHead ? 'SCSS Controlling Hub' : 'STSS Satellite Sensor'}
            </span>
            ${
              st.parentScss
                ? `<span class="text-[9px] font-mono font-semibold text-slate-400">Hub: ${st.parentScss}</span>`
                : ''
            }
          </div>
          <div class="flex items-center gap-1.5 font-bold text-sm text-white">
            <span class="w-2 h-2 rounded-full ${isAorHead ? 'bg-cyan-400' : 'bg-emerald-400'}"></span>
            ${st.fullName}
          </div>
          <div class="text-xs text-slate-300">Location: ${st.location}</div>
          <div class="text-[11px] text-slate-400 font-mono">GPS: ${st.coordinates[0].toFixed(
            3
          )}°N, ${st.coordinates[1].toFixed(3)}°E</div>
          <div class="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded inline-block mt-0.5 border border-emerald-800">
            ● Real-Time Satellite Telemetry: 100% Active
          </div>
        </div>`
      );

      group.addLayer(marker);
    });
  }, [showStations, selectedAorFilter]);

  // Render Earthquake Epicenters
  useEffect(() => {
    const group = earthquakesLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showEarthquakes) return;

    // Identify the latest earthquake record (most recent event in the list)
    const latestEarthquakeId = filteredEarthquakes.length > 0 ? filteredEarthquakes[0]?.id : null;

    filteredEarthquakes.forEach((eq) => {
      const isInside =
        isCgpScoped
          ? eq.aor === 'CGP'
          : selectedAorFilter === 'PCP'
          ? eq.aor === 'PCP'
          : eq.aor === 'PCP' || eq.aor === 'BIP' || eq.aor === 'CGP';
      const isSelected = selectedEarthquake?.id === eq.id;
      const isLatest = eq.id === latestEarthquakeId;

      // Clean, simple epicenter point (no magnitude number inside)
      const mag = eq.magnitude || 2.0;
      const sizePx = Math.max(12, Math.min(22, Math.round(mag * 3.2)));

      // Colors
      let color = '#38bdf8'; // Outside AOR (cyan/sky)
      let labelBg = 'bg-sky-600';

      if (isInside) {
        color = '#ef4444'; // Inside AOR (red/rose)
        labelBg = 'bg-rose-600';
      } else if (eq.status === 'For Review' || eq.status === 'Pending') {
        color = '#f59e0b'; // Amber
        labelBg = 'bg-amber-600';
      }

      // ONLY the latest earthquake information epicenter pulses (or if user selected it)
      const shouldPulse = isLatest || isSelected;

      const eqIcon = L.divIcon({
        className: 'custom-eq-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-125'
          } transition-transform">
            ${
              shouldPulse
                ? `<div class="absolute rounded-full animate-ping opacity-75" style="width: ${sizePx * 2.2}px; height: ${sizePx * 2.2}px; border: 2px solid ${color};"></div>`
                : ''
            }
            <div class="absolute rounded-full opacity-35 blur-xs" style="width: ${sizePx * 1.4}px; height: ${sizePx * 1.4}px; background-color: ${color};"></div>
            <div class="relative rounded-full shadow-[0_0_12px_${color}] border-2 ${
              isSelected ? 'border-amber-300 ring-4 ring-rose-400' : 'border-white ring-1 ring-slate-900/70'
            } flex items-center justify-center" style="width: ${sizePx}px; height: ${sizePx}px; background-color: ${color}">
              <div class="w-1.5 h-1.5 rounded-full bg-white opacity-95"></div>
            </div>
          </div>
        `,
        iconSize: [sizePx, sizePx],
        iconAnchor: [sizePx / 2, sizePx / 2],
      });

      const marker = L.marker([eq.coordinates.lat, eq.coordinates.lng], { icon: eqIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'font-sans p-1 text-slate-100 space-y-2 min-w-[220px]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[11px] font-bold text-white ${labelBg} shadow-sm">
              M ${mag.toFixed(1)}
            </span>
            <span class="text-xs font-bold text-white">${eq.id}</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
            isInside ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }">
            ${eq.aor}
          </span>
        </div>
        <div class="space-y-1 text-xs">
          <div class="font-bold text-white">${eq.location}</div>
          <div class="text-[11px] text-slate-300">
            <strong>Time:</strong> <span class="font-mono text-cyan-300">${eq.timePHT || eq.date}</span>
          </div>
          <div class="text-[11px] text-slate-300">
            <strong>Depth:</strong> ${eq.depthKm} km &bull; <strong>Coords:</strong> <span class="font-mono">${eq.coordinates.lat.toFixed(2)}°N, ${eq.coordinates.lng.toFixed(2)}°E</span>
          </div>
          ${eq.stationName ? `<div class="text-[11px] text-cyan-400 font-medium">Station: ${eq.stationName}</div>` : ''}
        </div>
      `;

      const viewBtn = document.createElement('button');
      viewBtn.className =
        'w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-colors mt-1 cursor-pointer flex items-center justify-center gap-1.5';
      viewBtn.innerText = 'View Earthquake Details';
      viewBtn.onclick = () => {
        onSelectEarthquake(eq);
      };
      popupContent.appendChild(viewBtn);

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectEarthquake(eq);
      });

      group.addLayer(marker);
    });
  }, [filteredEarthquakes, selectedEarthquake, showEarthquakes, onSelectEarthquake]);

  // Center on selected earthquake when changed externally
  useEffect(() => {
    if (!selectedEarthquake || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [selectedEarthquake.coordinates.lat, selectedEarthquake.coordinates.lng],
      9.5,
      { duration: 1.2 }
    );
  }, [selectedEarthquake]);

  // Preset Views Navigation
  const handleResetView = () => {
    if (isCgpScoped) {
      mapInstanceRef.current?.flyTo([8.482, 124.647], 8.5, { duration: 1 });
    } else if (selectedAorFilter === 'PCP') {
      mapInstanceRef.current?.flyTo([15.541, 121.084], 8.5, { duration: 1 });
    } else {
      mapInstanceRef.current?.flyTo([12.8797, 121.774], 6, { duration: 1 });
    }
  };

  const handleZoomToPreset = (center: [number, number], zoom: number) => {
    mapInstanceRef.current?.flyTo(center, zoom, { duration: 1 });
  };

  const handleSelectRegion = (region: PhilippineRegion) => {
    handleZoomToPreset(region.center, region.zoom);
    setShowQuickJumpDropdown(false);
  };

  const handleSelectProvince = (province: PhilippineProvince) => {
    handleZoomToPreset(province.center, 9);
    setShowQuickJumpDropdown(false);
  };

  // Filtered provinces for search
  const filteredProvincesList = useMemo(() => {
    if (!provinceSearch.trim()) return PHILIPPINES_PROVINCES;
    const query = provinceSearch.toLowerCase();
    return PHILIPPINES_PROVINCES.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.capital.toLowerCase().includes(query) ||
        p.regionCode.toLowerCase().includes(query)
    );
  }, [provinceSearch]);

  return (
    <div className={`rounded-2xl border shadow-xl flex flex-col h-full relative font-sans transition-colors duration-200 ${
      mapTheme === 'dark'
        ? 'bg-[#02091c] border-slate-800 text-white map-dark-theme'
        : 'bg-white border-slate-200 text-slate-800 map-light-theme'
    }`}>
      {/* Top Header Bar */}
      <div className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-30 border-b rounded-t-2xl transition-colors ${
        mapTheme === 'dark'
          ? 'bg-[#030d24] text-white border-slate-800/90'
          : 'bg-white text-slate-900 border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight flex items-center gap-2">
              <span className={mapTheme === 'dark' ? 'text-white' : 'text-slate-900'}>
                {isCgpScoped
                  ? 'CGP Station Geographic Seismic Map'
                  : selectedAorFilter === 'PCP'
                  ? 'PCP Station Geographic Seismic Map'
                  : 'Philippines Geographic Seismic Monitoring Map'}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isCgpScoped
                    ? mapTheme === 'dark'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/60'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                    : selectedAorFilter === 'PCP'
                    ? mapTheme === 'dark'
                      ? 'bg-blue-950 text-cyan-300 border border-cyan-500/50'
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {isCgpScoped
                  ? 'CGP AOR (Northern Mindanao)'
                  : selectedAorFilter === 'PCP'
                  ? 'PCP AOR (Central Luzon)'
                  : 'Tactical GIS Telemetry • 15 AORs'}
              </span>
            </h2>
            <p className={`text-xs ${mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              {isCgpScoped
                ? 'Real-time CGP station AOR & earthquake epicenter locations'
                : selectedAorFilter === 'PCP'
                ? 'Real-time PCP station AOR & Central Luzon epicenter projection'
                : 'Automated satellite telemetry & official PHIVOLCS station AORs'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Jump Dropdown */}
          <div className="relative" ref={quickJumpDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowQuickJumpDropdown((prev) => !prev);
                setShowLayersDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-2xs cursor-pointer ${
                showQuickJumpDropdown
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : mapTheme === 'dark'
                  ? 'bg-[#061433] hover:bg-[#0b1f4d] text-slate-200 border-slate-700/80'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Jump to Region or Province"
            >
              <MapPin className={`w-3.5 h-3.5 ${mapTheme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>{isCgpScoped ? 'CGP AOR (Northern Mindanao)' : selectedAorFilter === 'PCP' ? 'PCP AOR (Central Luzon)' : 'Jump to Region / Province'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showQuickJumpDropdown ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {showQuickJumpDropdown && (
              <div
                className={`absolute left-0 top-full mt-2 w-84 sm:w-96 max-w-[calc(100vw-2.5rem)] rounded-2xl shadow-2xl border p-3.5 z-50 transition-all backdrop-blur-md animate-fadeIn ${
                  mapTheme === 'dark'
                    ? 'bg-[#02091c]/98 border-slate-700/80 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
                    : 'bg-white/98 border-slate-300 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)]'
                }`}
              >
                <div className="mb-2.5 flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 ${mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="text"
                      placeholder="Search province, capital, region..."
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      className={`w-full pl-8 pr-7 py-1.5 rounded-lg text-xs font-medium border focus:outline-hidden transition-colors ${
                        mapTheme === 'dark'
                          ? 'bg-[#06122c] border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white'
                      }`}
                      autoFocus
                    />
                    {provinceSearch && (
                      <button
                        type="button"
                        onClick={() => setProvinceSearch('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-200 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickJumpDropdown(false)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      mapTheme === 'dark'
                        ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border-slate-200'
                    }`}
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Regions Quick Chips */}
                {!provinceSearch && (
                  <div className="mb-3">
                    <div className={`text-[10px] uppercase font-bold tracking-wider mb-1.5 flex items-center justify-between ${
                      mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      <span>17 Administrative Regions</span>
                      <span className="text-[9px] font-normal lowercase">click to pan</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {PHILIPPINES_REGIONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectRegion(r)}
                          className={`text-left px-2 py-1 rounded-md text-[11px] font-medium truncate border transition-colors ${
                            mapTheme === 'dark'
                              ? 'hover:bg-slate-800 hover:text-cyan-300 text-slate-300 border-transparent hover:border-slate-700'
                              : 'hover:bg-blue-50 hover:text-blue-700 text-slate-700 border-transparent hover:border-blue-200'
                          }`}
                          title={r.name}
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5 shrink-0"
                            style={{ backgroundColor: r.color }}
                          />
                          <span>{r.shortName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Provinces List */}
                <div>
                  <div className={`text-[10px] uppercase font-bold mb-1 flex justify-between ${
                    mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    <span>Provinces ({filteredProvincesList.length})</span>
                    <span className="font-normal">Click to locate</span>
                  </div>
                  <div className={`max-h-52 overflow-y-auto divide-y pr-1 text-xs custom-scrollbar ${
                    mapTheme === 'dark' ? 'divide-slate-800/80' : 'divide-slate-200'
                  }`}>
                    {filteredProvincesList.slice(0, 30).map((p) => {
                      const count = earthquakesByProvince[p.name] || 0;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectProvince(p)}
                          className={`w-full text-left py-1.5 px-2 rounded-md flex items-center justify-between group transition-colors ${
                            mapTheme === 'dark'
                              ? 'hover:bg-slate-800/80 text-slate-200'
                              : 'hover:bg-slate-100/80 text-slate-800'
                          }`}
                        >
                          <div>
                            <span className={`font-medium ${
                              mapTheme === 'dark' ? 'group-hover:text-cyan-300' : 'group-hover:text-blue-600'
                            }`}>
                              {p.name}
                            </span>
                            <span className={`text-[10px] ml-1.5 ${
                              mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              {p.regionCode} &bull; {p.capital}
                            </span>
                          </div>
                          {count > 0 && (
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full border ${
                              mapTheme === 'dark'
                                ? 'bg-rose-950 text-rose-300 border-rose-800'
                                : 'bg-rose-100 text-rose-700 border-rose-300'
                            }`}>
                              {count} eq
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Islands Presets (Shown when not station scoped) */}
          {!isStationScoped && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={handleResetView}
                className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              >
                All PH
              </button>
              <button
                type="button"
                onClick={() => handleZoomToPreset([16.5, 121.0], 7)}
                className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              >
                Luzon
              </button>
              <button
                type="button"
                onClick={() => handleZoomToPreset([11.0, 123.5], 7.5)}
                className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              >
                Visayas
              </button>
              <button
                type="button"
                onClick={() => handleZoomToPreset([8.0, 125.0], 7)}
                className="px-2 py-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white transition-colors"
              >
                Mindanao
              </button>
            </div>
          )}

          {/* Layers Dropdown */}
          <div className="relative" ref={layersDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setShowLayersDropdown((prev) => !prev);
                setShowQuickJumpDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shadow-2xs cursor-pointer ${
                showLayersDropdown
                  ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                  : mapTheme === 'dark'
                  ? 'bg-[#061433] hover:bg-[#0b1f4d] text-slate-200 border-slate-700/80'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Toggle Map Layers"
            >
              <Layers className={`w-3.5 h-3.5 ${mapTheme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>Layers</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showLayersDropdown ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {showLayersDropdown && (
              <div className={`absolute right-0 top-full mt-2 w-76 sm:w-80 rounded-2xl shadow-2xl border p-3.5 z-50 space-y-3.5 backdrop-blur-md animate-fadeIn ${
                mapTheme === 'dark'
                  ? 'bg-[#02091c]/98 border-slate-700/80 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.8)]'
                  : 'bg-white/98 border-slate-300 text-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)]'
              }`}>
                {/* Basemap Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Basemap Tiles (Watermark-Free)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyModal(true)}
                      className="text-[9px] font-semibold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 hover:border-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1"
                      title="View Map API Key & Engine details"
                    >
                      <span>✓ 100% Free Tier</span>
                      <span className="text-cyan-400 font-bold underline">API Key Info</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(BASEMAP_TILES) as BasemapType[]).map((key) => {
                      const cfg = BASEMAP_TILES[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectBasemap(key)}
                          className={`text-left px-2 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            basemap === key
                              ? 'bg-blue-600/30 border-blue-400 text-blue-200 shadow-sm font-bold ring-1 ring-blue-400'
                              : mapTheme === 'dark'
                              ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="font-semibold truncate">{cfg.name}</div>
                          <div className={`text-[9px] capitalize ${
                            mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>{cfg.theme} Mode • Free</div>
                        </button>
                      );
                    })}
                  </div>
                  <p className={`text-[10px] mt-1.5 leading-tight ${
                    mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Crisp, watermark-free GIS cartography with zero API keys required.
                  </p>
                </div>

                {/* Overlays Visibility */}
                <div className={`pt-2 border-t space-y-2 ${
                  mapTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Administrative &amp; AOR Overlays
                  </div>

                  <label className={`flex items-center justify-between cursor-pointer text-xs font-medium ${
                    mapTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                  }`}>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs bg-indigo-950 border border-indigo-400 shrink-0" />
                      <span>
                        <span className={`font-semibold ${mapTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>17 Regions Boundary</span>
                        <span className="block text-[10px] text-emerald-500 font-medium">Updated NAMRIA Geoportal / PSA PSGC</span>
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showRegions}
                      onChange={(e) => setShowRegions(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                    />
                  </label>

                  <label className={`flex items-center justify-between cursor-pointer text-xs font-medium ${
                    mapTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                  }`}>
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-300" />
                      82 Provinces &amp; Centroids
                    </span>
                    <input
                      type="checkbox"
                      checked={showProvinces}
                      onChange={(e) => setShowProvinces(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                    />
                  </label>

                  <label className={`flex items-center justify-between cursor-pointer text-xs font-medium ${
                    mapTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                  }`}>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs border-2 border-dashed border-cyan-400 bg-cyan-950/60" />
                      {isCgpScoped ? 'CGP Station AOR Boundary' : 'Station AOR Boundaries (Snapped to Provinces)'}
                    </span>
                    <input
                      type="checkbox"
                      checked={showAorBoundaries}
                      onChange={(e) => setShowAorBoundaries(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                    />
                  </label>

                  <label className={`flex items-center justify-between cursor-pointer text-xs font-medium ${
                    mapTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                  }`}>
                    <span className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      Seismic Stations
                    </span>
                    <input
                      type="checkbox"
                      checked={showStations}
                      onChange={(e) => setShowStations(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                    />
                  </label>

                  <label className={`flex items-center justify-between cursor-pointer text-xs font-medium ${
                    mapTheme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
                  }`}>
                    <span className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-rose-400" />
                      Live Earthquakes
                    </span>
                    <input
                      type="checkbox"
                      checked={showEarthquakes}
                      onChange={(e) => setShowEarthquakes(e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-cyan-500 bg-slate-800 border-slate-700"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Controls for Dashboard View: Quick Width Stretch & Height Adjust buttons */}
          {isDashboard ? (
            <div className="flex items-center gap-1.5">
              {/* Width presets */}
              {onWidthPercentChange && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold px-1">Width:</span>
                  <button
                    type="button"
                    onClick={() => onWidthPercentChange(50)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                      Math.abs(mapWidthPercent - 50) < 3
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                    title="Default 50% split"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => onWidthPercentChange(65)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                      Math.abs(mapWidthPercent - 65) < 3
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                    title="Stretch map to 65% width"
                  >
                    65%
                  </button>
                  <button
                    type="button"
                    onClick={() => onWidthPercentChange(75)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                      Math.abs(mapWidthPercent - 75) < 3
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                    title="Stretch map to 75% width"
                  >
                    75%
                  </button>
                </div>
              )}

              {/* Height presets */}
              {onHeightChange && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold px-1">Height:</span>
                  <button
                    type="button"
                    onClick={() => onHeightChange(Math.min(1100, mapHeight + 100))}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-700 hover:text-blue-700 hover:bg-white transition-colors"
                    title="Stretch map downwards (+100px)"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => onHeightChange(Math.max(460, mapHeight - 100))}
                    className="px-1.5 py-0.5 rounded text-[11px] font-bold text-slate-700 hover:text-blue-700 hover:bg-white transition-colors"
                    title="Shrink map height (-100px)"
                  >
                    -
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Search & Filter Parameters Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowSearchParametersPanel((prev) => !prev);
                    setShowLayersDropdown(false);
                    setShowQuickJumpDropdown(false);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-xs cursor-pointer ${
                    showSearchParametersPanel
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : isCustomFilterActive
                      ? 'bg-amber-950 text-amber-200 border-amber-500 hover:bg-amber-900'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Search and filter earthquakes by parameters"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Search &amp; Parameters</span>
                  {isCustomFilterActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              </div>

              {/* Light Mode / Dark Mode Switcher (Default: Light Mode) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleToggleMapTheme}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-xs cursor-pointer ${
                    mapTheme === 'light'
                      ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border-amber-400/60 hover:border-amber-300 ring-1 ring-amber-400/40'
                      : 'bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border-indigo-700/80 hover:border-indigo-500'
                  }`}
                  title={`Currently in ${mapTheme === 'light' ? 'Light Mode (Default)' : 'Dark Mode'}. Click to toggle.`}
                >
                  {mapTheme === 'light' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-300 fill-amber-400/40" />
                      <span>Light Mode</span>
                      <span className="text-[9px] bg-amber-400/30 text-amber-200 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                        Default
                      </span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-indigo-300 fill-indigo-400/30" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Earthquakes Parameter Status & Controls Strip */}
      <div className={`border-b px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5 z-20 text-xs transition-colors ${
        mapTheme === 'dark'
          ? 'bg-[#0b172a] text-white border-slate-800'
          : 'bg-white text-slate-800 border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          {timeWindow === 'TODAY' && !isCustomFilterActive ? (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs ${
                mapTheme === 'dark'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/50'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300'
              }`}>
                <Clock className="w-3 h-3 text-emerald-500 shrink-0" />
                <span>Latest Within the Day (Default): <strong>{filteredEarthquakes.length}</strong> events</span>
              </span>
              {latestDatasetDate && (
                <span className={`text-[10px] hidden sm:inline ${mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Date: <strong className={mapTheme === 'dark' ? 'text-slate-300' : 'text-slate-700'}>{latestDatasetDate}</strong>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs ${
                mapTheme === 'dark'
                  ? 'bg-amber-950/90 text-amber-300 border-amber-600/50'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                <Filter className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Custom Filter Active: <strong>{filteredEarthquakes.length}</strong> of <strong>{earthquakes.length}</strong> events</span>
              </span>
              <button
                type="button"
                onClick={handleResetToTodayDefault}
                className={`text-[11px] font-medium flex items-center gap-1 hover:underline cursor-pointer px-2 py-0.5 rounded border ${
                  mapTheme === 'dark'
                    ? 'text-amber-400 hover:text-white bg-slate-800/80 border-slate-700'
                    : 'text-amber-700 hover:text-amber-900 bg-amber-100/70 border-amber-300'
                }`}
                title="Reset to default within-the-day earthquakes"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset to Today</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSearchParametersPanel((prev) => !prev)}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              mapTheme === 'dark'
                ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700/80'
                : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
            }`}
          >
            <Search className="w-3 h-3 text-blue-500" />
            <span>{showSearchParametersPanel ? 'Hide Search Parameters' : 'Search by Parameters...'}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform ${
                showSearchParametersPanel ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Earthquake Parameter Search Panel */}
      {showSearchParametersPanel && (
        <div className="bg-slate-900 text-white border-b border-slate-800 p-4 z-20 space-y-3.5 shadow-xl animate-in fade-in slide-in-from-top-2">
          {/* Top Search Input */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search earthquakes by location, municipality, province, station, event ID..."
                value={earthquakeSearchQuery}
                onChange={(e) => setEarthquakeSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {earthquakeSearchQuery && (
                <button
                  type="button"
                  onClick={() => setEarthquakeSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  title="Clear text search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleResetToTodayDefault}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition-colors shrink-0"
              title="Reset all search parameters to default (Within the day)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset to Default</span>
            </button>
          </div>

          {/* Filter Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Timeframe Filter */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Timeframe
                </span>
                {timeWindow === 'TODAY' && (
                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                    Default
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setTimeWindow('TODAY');
                    setSelectedCustomDate('');
                  }}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    timeWindow === 'TODAY'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Default: Only display latest earthquakes within the day"
                >
                  ⚡ Within Day (Today)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeWindow('24H');
                    setSelectedCustomDate('');
                  }}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    timeWindow === '24H'
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Past 24 Hours
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeWindow('ALL');
                    setSelectedCustomDate('');
                  }}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    timeWindow === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  All Recorded
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeWindow('CUSTOM');
                    if (!selectedCustomDate && availableDates.length > 0) {
                      setSelectedCustomDate(availableDates[0]);
                    }
                  }}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    timeWindow === 'CUSTOM'
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Specific Date...
                </button>
              </div>

              {/* Date dropdown for CUSTOM */}
              {timeWindow === 'CUSTOM' && (
                <div className="pt-1">
                  <select
                    value={selectedCustomDate}
                    onChange={(e) => setSelectedCustomDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">Select a recorded date...</option>
                    {availableDates.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Magnitude Filter */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-rose-400" />
                  Min Magnitude
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {minMagnitudeFilter === 0 ? 'All' : `≥ M ${minMagnitudeFilter.toFixed(1)}`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                {[0, 3.0, 4.0, 5.0].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMinMagnitudeFilter(m)}
                    className={`py-1.5 rounded font-medium border text-center transition-all ${
                      minMagnitudeFilter === m
                        ? 'bg-rose-600 text-white border-rose-500 font-bold shadow-2xs'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {m === 0 ? 'All' : `≥ ${m.toFixed(1)}`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-500">Threshold:</span>
                <input
                  type="range"
                  min="0"
                  max="6.0"
                  step="0.5"
                  value={minMagnitudeFilter}
                  onChange={(e) => setMinMagnitudeFilter(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>
            </div>

            {/* 3. Depth Filter */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-400" />
                  Focal Depth
                </span>
                <span className="text-[10px] text-slate-300 font-mono">
                  {depthFilter === 'ALL'
                    ? 'All'
                    : depthFilter === 'SHALLOW'
                    ? '≤ 30km'
                    : depthFilter === 'INTERMEDIATE'
                    ? '31-70km'
                    : '> 70km'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDepthFilter('ALL')}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    depthFilter === 'ALL'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  All Depths
                </button>
                <button
                  type="button"
                  onClick={() => setDepthFilter('SHALLOW')}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    depthFilter === 'SHALLOW'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Shallow (≤30 km)
                </button>
                <button
                  type="button"
                  onClick={() => setDepthFilter('INTERMEDIATE')}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    depthFilter === 'INTERMEDIATE'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Intermediate (31-70km)
                </button>
                <button
                  type="button"
                  onClick={() => setDepthFilter('DEEP')}
                  className={`px-2 py-1.5 rounded font-medium border text-left transition-all ${
                    depthFilter === 'DEEP'
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Deep (&gt;70 km)
                </button>
              </div>
            </div>

            {/* 4. AOR Perimeter Status */}
            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  AOR Perimeter
                </span>
                <span className="text-[10px] text-slate-300">
                  {filterMode === 'ALL'
                    ? 'All Events'
                    : filterMode === 'INSIDE'
                    ? 'Inside AOR'
                    : 'Outside AOR'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={`py-1.5 rounded font-medium border text-center transition-all ${
                    filterMode === 'ALL'
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  All AORs
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('INSIDE')}
                  className={`py-1.5 rounded font-medium border text-center transition-all ${
                    filterMode === 'INSIDE'
                      ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Inside AOR
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('OUTSIDE')}
                  className={`py-1.5 rounded font-medium border text-center transition-all ${
                    filterMode === 'OUTSIDE'
                      ? 'bg-amber-600 text-white border-amber-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Outside AOR
                </button>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                Filter based on official provincial polygon boundaries.
              </div>
            </div>
          </div>

          {/* Quick Matching Earthquakes List (if filtered) */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="text-slate-300">
              Found <strong>{filteredEarthquakes.length}</strong> earthquakes matching criteria
              {timeWindow === 'TODAY' && (
                <span className="text-emerald-400 font-medium ml-1.5">
                  (Showing only events within the day)
                </span>
              )}
            </div>

            {filteredEarthquakes.length > 0 && filteredEarthquakes.length <= 15 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400">Quick Jump to Epicenter:</span>
                {filteredEarthquakes.slice(0, 5).map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => {
                      onSelectEarthquake(eq);
                      mapInstanceRef.current?.flyTo([eq.coordinates.lat, eq.coordinates.lng], 9.5, {
                        duration: 1.2,
                      });
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-blue-600 text-[10px] text-slate-200 hover:text-white border border-slate-700 transition-colors"
                  >
                    <span className="font-bold text-amber-400">M{eq.magnitude.toFixed(1)}</span>
                    <span className="truncate max-w-[90px]">{eq.location?.split(',')[0]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scoped to CGP AOR Notice Banner */}
      {isCgpScoped && (
        <div className="bg-cyan-950 border-b border-cyan-800 px-4 py-1.5 flex items-center justify-between text-xs text-cyan-100 z-20 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span>
              <strong>Station View Active:</strong> Displaying Area of Responsibility (AOR), seismic stations, and events for <strong>Cagayan Seismic Station (CGP AOR)</strong>: Lanao del Sur, Lanao del Norte, Misamis Oriental, Misamis Occidental, Bukidnon, Cagayan de Oro, and Camiguin.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded border border-cyan-700 shrink-0 ml-2">
            CGP AOR Only
          </span>
        </div>
      )}

      {/* Scoped to PCP AOR Notice Banner */}
      {!isCgpScoped && selectedAorFilter === 'PCP' && (
        <div className="bg-blue-950 border-b border-blue-800 px-4 py-1.5 flex items-center justify-between text-xs text-blue-100 z-20 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span>
              <strong>Station View Active:</strong> Displaying only Area of Responsibility (AOR), seismic stations, and events within <strong>Palayan Seismic Station (PCP AOR)</strong>.
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-blue-800 text-cyan-300 px-2 py-0.5 rounded border border-blue-600 shrink-0 ml-2">
            PCP AOR Only
          </span>
        </div>
      )}

      {/* Map Canvas & Floating Controls */}
      <div className={`relative flex-1 min-h-[580px] w-full rounded-b-2xl overflow-hidden transition-colors ${mapTheme === 'dark' ? 'bg-[#02091c]' : 'bg-[#f1f5f9]'}`}>
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className={`w-full h-full absolute inset-0 z-0 rounded-b-2xl transition-colors ${mapTheme === 'dark' ? 'bg-[#02091c]' : 'bg-[#f1f5f9]'}`} />

        {/* Empty state notice if filtered results are 0 */}
        {filteredEarthquakes.length === 0 && (
          <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in border ${
            mapTheme === 'dark'
              ? 'bg-[#02091c]/95 text-white border-slate-700'
              : 'bg-white/95 text-slate-800 border-slate-200'
          }`}>
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>No earthquakes match the current search parameters.</span>
            <button
              type="button"
              onClick={handleResetToTodayDefault}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-semibold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Reset to Today (Default)
            </button>
          </div>
        )}

        {/* Floating Legend Bottom Right */}
        <div className={`absolute bottom-4 right-4 z-20 backdrop-blur-md rounded-xl p-3 shadow-md text-xs space-y-2 min-w-[210px] pointer-events-auto transition-colors ${
          mapTheme === 'dark'
            ? 'bg-[#02091c]/92 border border-slate-700/80 text-slate-200'
            : 'bg-white/95 border border-slate-200 text-slate-800'
        }`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-3.5 rounded-xs border-2 border-emerald-500 bg-emerald-500/10 inline-block shrink-0" />
              <span className="font-semibold text-slate-800 text-[11px]">
                {isCgpScoped
                  ? 'CGP AOR (Northern Mindanao)'
                  : selectedAorFilter === 'PCP'
                  ? 'PCP AOR (Central Luzon)'
                  : 'Active Station AOR'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 inline-block ring-2 ring-rose-200 shrink-0" />
              <span className="font-semibold text-slate-800 text-[11px]">
                Earthquake Epicenter (Inside AOR)
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 bg-white flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </span>
              <span className="font-semibold text-slate-800 text-[11px]">
                {isCgpScoped
                  ? 'CGP Seismic Station'
                  : selectedAorFilter === 'PCP'
                  ? 'PCP Seismic Station'
                  : 'PHIVOLCS Seismic Station'}
              </span>
            </div>
          </div>
        </div>

        {/* Floating Map Zoom / Recenter Controls on Left */}
        <div className={`absolute top-4 left-4 z-20 flex flex-col backdrop-blur-md rounded-xl shadow-xl overflow-hidden transition-colors ${
          mapTheme === 'dark'
            ? 'bg-[#02091c]/92 border border-slate-700/80 divide-y divide-slate-800 text-slate-200'
            : 'bg-white/95 border border-slate-200 divide-y divide-slate-200 text-slate-700'
        }`}>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mapTheme === 'dark' ? 'hover:bg-slate-800 hover:text-cyan-300' : 'hover:bg-slate-100 hover:text-blue-600'
            }`}
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mapTheme === 'dark' ? 'hover:bg-slate-800 hover:text-cyan-300' : 'hover:bg-slate-100 hover:text-blue-600'
            }`}
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              mapTheme === 'dark'
                ? 'hover:bg-slate-800 hover:text-cyan-300 text-cyan-400'
                : 'hover:bg-slate-100 hover:text-blue-700 text-blue-600'
            }`}
            title="Reset View to Philippines"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Hovered Location Banner */}
        {hoveredLocationInfo && (
          <div className={`absolute top-4 left-16 z-20 backdrop-blur-md text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl pointer-events-none animate-fadeIn flex items-center gap-2 border ${
            mapTheme === 'dark'
              ? 'bg-[#02091c]/95 text-white border-cyan-500/50'
              : 'bg-white/95 text-slate-900 border-blue-400 shadow-lg'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-ping shrink-0 ${mapTheme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'}`} />
            <span>{hoveredLocationInfo}</span>
          </div>
        )}

        {/* Bottom Bar: Coordinates, Zoom, and Live Event Filter Chips */}
        <div className="absolute bottom-3 right-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Quick Filter Inside vs Outside */}
          <div className={`flex items-center backdrop-blur-md rounded-xl p-0.5 shadow-xl text-xs border ${
            mapTheme === 'dark'
              ? 'bg-[#02091c]/92 border-slate-700/80'
              : 'bg-white/95 border-slate-200 shadow-md'
          }`}>
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : mapTheme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({earthquakes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('INSIDE')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'INSIDE'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : mapTheme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inside AOR (
              {
                earthquakes.filter((e) =>
                  isCgpScoped
                    ? e.aor === 'CGP'
                    : selectedAorFilter === 'PCP'
                    ? e.aor === 'PCP'
                    : selectedAorFilter === 'BIP'
                    ? e.aor === 'BIP'
                    : e.aor === 'PCP' || e.aor === 'BIP' || e.aor === 'CGP'
                ).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('OUTSIDE')}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                filterMode === 'OUTSIDE'
                  ? mapTheme === 'dark'
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-xs font-bold'
                    : 'bg-slate-800 text-white shadow-xs font-bold'
                  : mapTheme === 'dark'
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Outside AOR (
              {
                earthquakes.filter((e) =>
                  isCgpScoped
                    ? e.aor !== 'CGP'
                    : selectedAorFilter === 'PCP'
                    ? e.aor !== 'PCP'
                    : selectedAorFilter === 'BIP'
                    ? e.aor !== 'BIP'
                    : e.aor === 'Outside AOR'
                ).length
              }
              )
            </button>
          </div>

          {/* Coordinates readout */}
          {cursorCoords && (
            <div className={`hidden md:flex items-center gap-1.5 backdrop-blur-md rounded-xl px-2.5 py-1 text-[11px] font-mono shadow-xl border ${
              mapTheme === 'dark'
                ? 'bg-[#02091c]/92 border-slate-700/80 text-cyan-300'
                : 'bg-white/95 border-slate-200 text-slate-700 shadow-md'
            }`}>
              <MapPin className={`w-3 h-3 ${mapTheme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
              <span>
                {cursorCoords.lat.toFixed(4)}°N, {cursorCoords.lng.toFixed(4)}°E
              </span>
              <span className={mapTheme === 'dark' ? 'text-slate-600' : 'text-slate-300'}>|</span>
              <span className={`font-sans ${mapTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Zoom {currentZoom}</span>
            </div>
          )}
        </div>

        {/* Epicenter Identified Floating Card on Map */}
        {selectedEarthquake && (
          <div className="absolute top-14 left-4 right-4 sm:right-auto sm:max-w-md z-30 bg-slate-950/92 text-white rounded-xl border border-rose-500/60 p-3.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40 shadow-inner">
                  <Crosshair className="w-5 h-5 text-rose-400 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-rose-300 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-800 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping inline-block" />
                      Epicenter Identified
                    </span>
                    <span className="font-mono text-[11px] font-bold text-amber-300">
                      Mag {selectedEarthquake.magnitude.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-300 font-mono">
                      Depth: {selectedEarthquake.depthKm} km
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white line-clamp-1 mt-1">
                    {selectedEarthquake.location}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onClearSelectedEarthquake) {
                    onClearSelectedEarthquake();
                  } else {
                    handleResetView();
                  }
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss Epicenter Focus"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] gap-2">
              <div className="font-mono text-slate-300 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">
                  {selectedEarthquake.coordinates.lat.toFixed(4)}°N, {selectedEarthquake.coordinates.lng.toFixed(4)}°E
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 font-sans font-medium whitespace-nowrap">
                  {selectedEarthquake.aor} AOR
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectEarthquake(selectedEarthquake)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-xs shrink-0"
                title="Open Event Bulletin Modal"
              >
                <Eye className="w-3 h-3" />
                <span>Bulletin</span>
              </button>
            </div>
          </div>
        )}

        {/* Official NAMRIA Geoportal Attribution Badge */}
        <div className="absolute bottom-3 left-4 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={() => setShowBoundaryInfoModal(true)}
            className={`flex items-center gap-1.5 backdrop-blur-md rounded-xl px-2.5 py-1 text-[11px] font-medium shadow-xl transition-colors cursor-pointer border ${
              mapTheme === 'dark'
                ? 'bg-[#02091c]/90 hover:bg-[#061433] border-slate-700/80 text-slate-300 hover:text-cyan-300'
                : 'bg-white/95 hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-blue-700 shadow-md'
            }`}
            title="Click to view official Philippine mapping website & boundary source metadata"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className={`font-semibold ${mapTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>NAMRIA Geoportal / PSA PSGC 2024</span>
            <span className={`text-[10px] font-mono underline font-semibold ml-0.5 ${mapTheme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>Info</span>
          </button>
        </div>

        {/* Official Philippine Mapping Authority & Boundary Metadata Modal */}
        {showBoundaryInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full shadow-2xl p-5 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                    🇵🇭
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Official Philippine Administrative Boundaries
                    </h3>
                    <p className="text-xs text-slate-500">
                      Accurate &amp; Updated Geographic Data from Official Mapping Authority
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBoundaryInfoModal(false)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 space-y-1 text-blue-950">
                  <div className="font-bold flex items-center gap-1.5 text-blue-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Official Mapping Website &amp; Agency</span>
                  </div>
                  <p>
                    <strong>National Mapping and Resource Information Authority (NAMRIA)</strong>, under the Department of Environment and Natural Resources (DENR), is the central mapping agency of the Philippine Government.
                  </p>
                  <p className="text-[11px] text-blue-700 pt-1 font-medium">
                    Official Portal: <a href="https://geoportal.gov.ph" target="_blank" rel="noreferrer" className="underline font-bold">geoportal.gov.ph</a> (Geoportal Philippines)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-800">
                    Boundary Standards &amp; Recent Updates (2024):
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px]">
                    <li>
                      <strong>17 Administrative Regions:</strong> Accurate MultiPolygon geometries capturing all islands, gulfs, and provincial boundaries.
                    </li>
                    <li>
                      <strong>Philippine Standard Geographic Code (PSGC):</strong> Synchronized with the Philippine Statistics Authority (PSA) PSGC 2024 master list.
                    </li>
                    <li>
                      <strong>Updated Administrative Jurisdictions:</strong> Reflects the latest official boundaries, including BARMM (with Maguindanao del Norte and Maguindanao del Sur), Davao de Oro, and MIMAROPA.
                    </li>
                    <li>
                      <strong>Geodetic Alignment:</strong> WGS84 (EPSG:4326) / PRS92 aligned spatial coordinates ensuring zero polygon displacement.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowBoundaryInfoModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Close &amp; Return to Map
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Map API Key & Cartography Engine Modal */}
        {showApiKeyModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-[#02091c] rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150 text-white">
              {/* Header */}
              <div className="px-5 py-4 bg-[#040e29] border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Map API Key &amp; Cartography Engine</h3>
                    <p className="text-[11px] text-slate-400">Dashboard &amp; AOR Map Tile Service Status</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setApiKeyNotice(null);
                  }}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 text-xs">
                <div className="bg-emerald-950/80 border border-emerald-700/80 rounded-xl p-3.5 text-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Active Map Engine: Open GIS &amp; Esri Cartography (100% Free &amp; Zero Watermarks)
                  </div>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                    All watermarks and &quot;API key required&quot; notices have been removed. The Dashboard Map, Station Boundaries, and Boundary Review use direct Esri GIS and OpenStreetMap services with full <strong>Light Mode (Default)</strong> and <strong>Dark Mode</strong> options. This tier is <strong>active, fully operational, and 100% free</strong> without requiring any paid API key.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Optional Custom Map API Key (Mapbox / Stadia / Custom Enterprise Tile Server)
                  </label>
                  <input
                    type="text"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="e.g., pk.eyJ1IjoiZXhhbXBsZSI... (Optional - leave blank for default free tier)"
                    className="w-full px-3 py-2 bg-[#06122c] border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Synchronized across <strong>Dashboard Map</strong>, <strong>Station Boundaries</strong>, and <strong>Boundary Review</strong>. Built-in Esri World Street (Default Light), Esri Topo, and Esri Dark Tactical services power all maps with zero watermark and zero cost.
                  </span>
                </div>

                {apiKeyNotice && (
                  <div className="bg-cyan-950 border border-cyan-800 rounded-lg p-2.5 text-cyan-200 text-[11px] font-medium flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{apiKeyNotice}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3.5 bg-[#040e29] border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Engine: Leaflet v1.9.4 / PSGC 2024
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowApiKeyModal(false);
                      setApiKeyNotice(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('alertx_map_api_key', customApiKey.trim());
                      setApiKeyNotice('API configuration synchronized across all maps.');
                      setTimeout(() => {
                        setShowApiKeyModal(false);
                        setApiKeyNotice(null);
                      }, 1200);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md transition-colors cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
