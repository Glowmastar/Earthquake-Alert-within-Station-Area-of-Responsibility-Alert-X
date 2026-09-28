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
} from 'lucide-react';
import { EarthquakeRecord, AORType } from '../types';
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
  selectedAorFilter?: AORType | 'ALL';
}

type BasemapType = 'osm' | 'esri_topo' | 'esri_street' | 'hot' | 'satellite';

interface BasemapConfig {
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  subdomains?: string | string[];
}

const BASEMAP_TILES: Record<BasemapType, BasemapConfig> = {
  osm: {
    name: 'OpenStreetMap (Clean & Free)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  esri_topo: {
    name: 'Esri World Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, USGS, DeLorme, TomTom, FAO, NOAA',
    maxZoom: 18,
  },
  esri_street: {
    name: 'Esri World Street',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC',
    maxZoom: 18,
  },
  hot: {
    name: 'Humanitarian OSM (Disaster)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank" rel="noreferrer">HOT</a>',
    maxZoom: 19,
    subdomains: ['a', 'b'],
  },
  satellite: {
    name: 'Esri Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
};

export const PhilippinesMap: React.FC<PhilippinesMapProps> = ({
  earthquakes,
  onSelectEarthquake,
  selectedEarthquake,
  selectedAorFilter = 'ALL',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer groups refs
  const regionsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const provincesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const aorLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const earthquakesLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Layer visibility state
  const [showRegions, setShowRegions] = useState<boolean>(true);
  const [showProvinces, setShowProvinces] = useState<boolean>(true);
  const [showAorBoundaries, setShowAorBoundaries] = useState<boolean>(true);
  const [showStations, setShowStations] = useState<boolean>(true);
  const [showEarthquakes, setShowEarthquakes] = useState<boolean>(true);

  // Basemap & UI state
  const [basemap, setBasemap] = useState<BasemapType>('osm');
  const [showLayersDropdown, setShowLayersDropdown] = useState<boolean>(false);
  const [showQuickJumpDropdown, setShowQuickJumpDropdown] = useState<boolean>(false);
  const [hoveredLocationInfo, setHoveredLocationInfo] = useState<string | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(6);
  const [filterMode, setFilterMode] = useState<'ALL' | 'INSIDE' | 'OUTSIDE'>('ALL');
  const [provinceSearch, setProvinceSearch] = useState<string>('');

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
      if (filterMode === 'INSIDE') {
        return eq.aor === 'PCP' || eq.aor === 'BIP' || eq.aor === 'CGP';
      }
      if (filterMode === 'OUTSIDE') {
        return eq.aor === 'Outside AOR';
      }
      return true;
    });
  }, [earthquakes, filterMode]);

  // Initial Map Setup
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Philippines Bounds: 4.5°N to 21.5°N, 116.0°E to 127.5°E
    const philippinesCenter: [number, number] =
      selectedAorFilter === 'PCP' ? [15.541, 121.084] : [12.8797, 121.774];
    const initialZoom = selectedAorFilter === 'PCP' ? 8 : 6;

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

    // Cleanup on unmount
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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

  // Render Administrative Regions
  useEffect(() => {
    const group = regionsLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showRegions) return;

    PHILIPPINES_REGIONS.forEach((region) => {
      const polygon = L.polygon(region.boundary, {
        color: region.color,
        weight: 1.8,
        opacity: 0.85,
        fillColor: region.color,
        fillOpacity: 0.08,
        dashArray: '3, 4',
      });

      // Hover styling
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

      // Click zooms to region
      polygon.on('click', () => {
        mapInstanceRef.current?.flyToBounds(polygon.getBounds(), {
          padding: [30, 30],
          duration: 1,
        });
      });

      // Tooltip
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
  }, [showRegions, earthquakesByProvince]);

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

  // Auto-focus map when selectedAorFilter changes to PCP
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedAorFilter === 'PCP') {
      mapInstanceRef.current.flyTo([15.541, 121.084], 8, { duration: 1 });
    }
  }, [selectedAorFilter]);

  // Render Official Station AOR Boundaries (PCP, BIP, CGP)
  useEffect(() => {
    const group = aorLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showAorBoundaries) return;

    const aorsToRender =
      selectedAorFilter && selectedAorFilter !== 'ALL'
        ? STATION_AORS.filter((aor) => aor.code === selectedAorFilter)
        : STATION_AORS;

    aorsToRender.forEach((aor) => {
      const polygon = L.polygon(aor.coordinates, {
        color: aor.strokeColor,
        weight: 2.5,
        opacity: 0.95,
        fillColor: aor.fillColor,
        fillOpacity: 0.14,
        dashArray: '5, 5',
      });

      polygon.on('mouseover', () => {
        polygon.setStyle({
          weight: 3.5,
          fillOpacity: 0.28,
        });
        setHoveredLocationInfo(`${aor.name} – ${aor.headquarters}`);
      });

      polygon.on('mouseout', () => {
        polygon.setStyle({
          weight: 2.5,
          fillOpacity: 0.14,
        });
        setHoveredLocationInfo(null);
      });

      polygon.bindPopup(
        `<div class="p-1 space-y-1.5 max-w-xs font-sans">
          <div class="flex items-center gap-2 border-b border-slate-200 pb-1">
            <span class="w-3 h-3 rounded-full" style="background-color: ${aor.fillColor}"></span>
            <span class="font-bold text-sm text-slate-900">${aor.name}</span>
          </div>
          <p class="text-xs text-slate-600 font-medium">Headquarters: ${aor.headquarters}</p>
          <div>
            <span class="text-[11px] font-semibold text-slate-700">Covered Provinces:</span>
            <p class="text-[11px] text-slate-600">${aor.provincesIncluded.join(', ')}</p>
          </div>
          <div class="pt-1 text-[10px] text-blue-600 font-semibold">
            Status: Fully Operational &bull; Automated Dispatch Active
          </div>
        </div>`
      );

      group.addLayer(polygon);
    });
  }, [showAorBoundaries, selectedAorFilter]);

  // Render Seismic Monitoring Stations
  useEffect(() => {
    const group = stationsLayerGroupRef.current;
    if (!group || !mapInstanceRef.current) return;

    group.clearLayers();

    if (!showStations) return;

    const stationsToRender =
      selectedAorFilter && selectedAorFilter !== 'ALL'
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
          <div class="relative flex items-center justify-center cursor-pointer">
            <div class="absolute ${
              isAorHead ? 'w-6 h-6 animate-ping opacity-30' : 'w-4 h-4 opacity-20'
            } rounded-full" style="background-color: ${st.color}"></div>
            <div class="relative ${
              isAorHead ? 'w-4 h-4' : 'w-3 h-3'
            } rounded-full flex items-center justify-center shadow-md border-2 border-white text-[8px] font-bold text-white" style="background-color: ${
          st.color
        }">
              ${isAorHead ? '●' : '▲'}
            </div>
            <div class="absolute -bottom-3.5 whitespace-nowrap text-[8.5px] font-bold px-1 rounded shadow-xs ${
              isAorHead ? 'bg-slate-900 text-white' : 'bg-slate-800/90 text-slate-100'
            } pointer-events-none">
              ${st.code}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(st.coordinates, { icon: stationIcon });

      marker.bindPopup(
        `<div class="p-1 font-sans space-y-1 min-w-[200px]">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              isAorHead
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }">
              ${isAorHead ? 'SCSS Controlling Hub' : 'STSS Satellite Sensor'}
            </span>
            ${
              st.parentScss
                ? `<span class="text-[9px] font-mono font-semibold text-slate-500">Hub: ${st.parentScss}</span>`
                : ''
            }
          </div>
          <div class="flex items-center gap-1.5 font-bold text-sm text-slate-900">
            <span class="w-2 h-2 rounded-full" style="background-color: ${st.color}"></span>
            ${st.fullName}
          </div>
          <div class="text-xs text-slate-600">Location: ${st.location}</div>
          <div class="text-[11px] text-slate-500 font-mono">GPS: ${st.coordinates[0].toFixed(
            3
          )}°N, ${st.coordinates[1].toFixed(3)}°E</div>
          <div class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5 border border-emerald-200">
            ● Real-Time Satellite Telemetry Active
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

    filteredEarthquakes.forEach((eq) => {
      const isInside = eq.aor === 'PCP' || eq.aor === 'BIP' || eq.aor === 'CGP';
      const isSelected = selectedEarthquake?.id === eq.id;

      // Marker sizing based on magnitude
      const mag = eq.magnitude || 2.0;
      const sizePx = Math.max(16, Math.min(42, Math.round(mag * 5.5)));

      // Colors
      let color = '#3b82f6'; // Outside AOR (blue)
      let ringColor = 'rgba(59, 130, 246, 0.4)';
      let labelBg = 'bg-blue-600';

      if (isInside) {
        color = '#ef4444'; // Inside AOR (red/rose)
        ringColor = 'rgba(239, 68, 68, 0.4)';
        labelBg = 'bg-rose-600';
      } else if (eq.status === 'For Review' || eq.status === 'Pending') {
        color = '#f59e0b'; // Amber
        ringColor = 'rgba(245, 158, 11, 0.4)';
        labelBg = 'bg-amber-600';
      }

      const eqIcon = L.divIcon({
        className: 'custom-eq-icon',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer ${
            isSelected ? 'scale-125 z-50' : 'hover:scale-115'
          } transition-transform">
            ${
              eq.isRecent24h
                ? `<div class="absolute rounded-full animate-ping opacity-40" style="width: ${sizePx * 1.6}px; height: ${sizePx * 1.6}px; background-color: ${ringColor}"></div>`
                : ''
            }
            <div class="relative rounded-full flex items-center justify-center shadow-lg border-2 ${
              isSelected ? 'border-amber-300 ring-4 ring-rose-400' : 'border-white ring-1 ring-slate-900/20'
            } text-white font-bold text-[10px]" style="width: ${sizePx}px; height: ${sizePx}px; background-color: ${color}">
              ${mag.toFixed(1)}
            </div>
          </div>
        `,
        iconSize: [sizePx, sizePx],
        iconAnchor: [sizePx / 2, sizePx / 2],
      });

      const marker = L.marker([eq.coordinates.lat, eq.coordinates.lng], { icon: eqIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'font-sans p-1 text-slate-800 space-y-2 min-w-[210px]';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[11px] font-bold text-white ${labelBg}">
              M ${mag.toFixed(1)}
            </span>
            <span class="text-xs font-bold text-slate-900">${eq.id}</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.5 rounded font-semibold ${
            isInside ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
          }">
            ${eq.aor}
          </span>
        </div>
        <div class="space-y-1 text-xs">
          <div class="font-medium text-slate-900">${eq.location}</div>
          <div class="text-[11px] text-slate-600">
            <strong>Time:</strong> ${eq.timePHT || eq.date}
          </div>
          <div class="text-[11px] text-slate-600">
            <strong>Depth:</strong> ${eq.depthKm} km &bull; <strong>Coords:</strong> ${eq.coordinates.lat.toFixed(2)}°N, ${eq.coordinates.lng.toFixed(2)}°E
          </div>
          ${eq.stationName ? `<div class="text-[11px] text-blue-700 font-medium">Station: ${eq.stationName}</div>` : ''}
        </div>
      `;

      const viewBtn = document.createElement('button');
      viewBtn.className =
        'w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition-colors mt-1';
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
      8.5,
      { duration: 1.2 }
    );
  }, [selectedEarthquake]);

  // Preset Views Navigation
  const handleResetView = () => {
    mapInstanceRef.current?.flyTo([12.8797, 121.774], 6, { duration: 1 });
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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-full relative font-sans">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Philippines Geographic Seismic Map
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Accurate Regions &amp; 82 Provinces
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              Real-time PHIVOLCS station AORs &amp; earthquake epicenter projection
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Jump Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowQuickJumpDropdown((prev) => !prev);
                setShowLayersDropdown(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors shadow-xs"
              title="Jump to Region or Province"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span>Jump to Region / Province</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showQuickJumpDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-slate-800">
                <div className="mb-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search province, capital, region..."
                      value={provinceSearch}
                      onChange={(e) => setProvinceSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Regions Quick Chips */}
                {!provinceSearch && (
                  <div className="mb-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                      17 Administrative Regions
                    </div>
                    <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto pr-1">
                      {PHILIPPINES_REGIONS.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleSelectRegion(r)}
                          className="text-left px-2 py-1 rounded text-[11px] font-medium hover:bg-blue-50 hover:text-blue-700 text-slate-700 truncate border border-transparent hover:border-blue-200"
                          title={r.name}
                        >
                          <span
                            className="inline-block w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: r.color }}
                          />
                          {r.shortName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Provinces List */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex justify-between">
                    <span>Provinces ({filteredProvincesList.length})</span>
                    <span className="text-slate-400">Click to locate</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
                    {filteredProvincesList.slice(0, 30).map((p) => {
                      const count = earthquakesByProvince[p.name] || 0;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => handleSelectProvince(p)}
                          className="w-full text-left py-1.5 px-2 hover:bg-slate-50 rounded flex items-center justify-between group"
                        >
                          <div>
                            <span className="font-medium text-slate-800 group-hover:text-blue-600">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-500 ml-1.5">
                              {p.regionCode} &bull; {p.capital}
                            </span>
                          </div>
                          {count > 0 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-100 text-rose-700">
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

          {/* Quick Islands Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              onClick={handleResetView}
              className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              All PH
            </button>
            <button
              type="button"
              onClick={() => handleZoomToPreset([15.5, 121.0], 7.5)}
              className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Luzon (PCP)
            </button>
            <button
              type="button"
              onClick={() => handleZoomToPreset([11.0, 123.5], 7.5)}
              className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Visayas
            </button>
            <button
              type="button"
              onClick={() => handleZoomToPreset([8.0, 125.5], 7.5)}
              className="px-2 py-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              Mindanao (BIP/CGP)
            </button>
          </div>

          {/* Layers Toggle Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowLayersDropdown((prev) => !prev);
                setShowQuickJumpDropdown(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shadow-xs ${
                showLayersDropdown
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Toggle Map Layers"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Layers</span>
            </button>

            {showLayersDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 text-slate-800 space-y-3">
                {/* Basemap Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Basemap Tiles
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ No API Key Required
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(BASEMAP_TILES) as BasemapType[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setBasemap(key)}
                        className={`text-left px-2 py-1.5 rounded text-xs font-medium border transition-all ${
                          basemap === key
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {key === 'osm' && '🌐 OSM Standard'}
                        {key === 'esri_topo' && '⛰️ Esri Topo'}
                        {key === 'esri_street' && '🏙️ Esri Street'}
                        {key === 'hot' && '🚨 Humanitarian'}
                        {key === 'satellite' && '🛰️ Satellite'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">
                    Clean GIS basemaps with zero watermarks and full Philippine coverage.
                  </p>
                </div>

                {/* Overlays Visibility */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Administrative &amp; AOR Overlays
                  </div>

                  <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs bg-indigo-100 border border-indigo-500" />
                      17 Regions Boundary
                    </span>
                    <input
                      type="checkbox"
                      checked={showRegions}
                      onChange={(e) => setShowRegions(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-300" />
                      82 Provinces &amp; Centroids
                    </span>
                    <input
                      type="checkbox"
                      checked={showProvinces}
                      onChange={(e) => setShowProvinces(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-xs border-2 border-dashed border-blue-600 bg-blue-100/60" />
                      Station AOR Boundaries
                    </span>
                    <input
                      type="checkbox"
                      checked={showAorBoundaries}
                      onChange={(e) => setShowAorBoundaries(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900">
                    <span className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-blue-600" />
                      Seismic Stations
                    </span>
                    <input
                      type="checkbox"
                      checked={showStations}
                      onChange={(e) => setShowStations(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-xs font-medium text-slate-700 hover:text-slate-900">
                    <span className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-rose-500" />
                      Live Earthquakes
                    </span>
                    <input
                      type="checkbox"
                      checked={showEarthquakes}
                      onChange={(e) => setShowEarthquakes(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scoped to PCP AOR Notice Banner */}
      {selectedAorFilter === 'PCP' && (
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
      <div className="relative flex-1 min-h-[580px] w-full bg-slate-100">
        {/* Leaflet DOM container */}
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0 z-0" />

        {/* Floating Legend Top Right */}
        <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-xl p-3 shadow-md text-[11px] space-y-2 max-w-[210px] pointer-events-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>AOR Stations &amp; Events</span>
            <span className="text-slate-400 font-normal">{selectedAorFilter === 'PCP' ? 'PCP Only' : 'Active'}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-xs bg-blue-100 border border-blue-500 inline-block" />
              <span className="text-slate-700 font-medium">PCP AOR (Central Luzon)</span>
            </div>
            {selectedAorFilter !== 'PCP' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-xs bg-emerald-100 border border-emerald-500 inline-block" />
                  <span className="text-slate-700 font-medium">BIP AOR (Caraga/Eastern)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-xs bg-purple-100 border border-purple-500 inline-block" />
                  <span className="text-slate-700 font-medium">CGP AOR (Northern Mind.)</span>
                </div>
              </>
            )}
          </div>

          <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-300 inline-block" />
              <span className="text-slate-700 font-medium">Epicenter (Inside AOR)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              <span className="text-slate-700 font-medium">Epicenter (Outside AOR)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-1 ring-amber-300 inline-block" />
              <span className="text-slate-700 font-medium">Province Capital Centroid</span>
            </div>
          </div>
        </div>

        {/* Floating Map Zoom / Recenter Controls on Left */}
        <div className="absolute top-4 left-4 z-20 flex flex-col bg-white border border-slate-200 rounded-lg shadow-md divide-y divide-slate-100 overflow-hidden text-slate-700">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 transition-colors text-blue-600"
            title="Reset View to Philippines"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* Hovered Location Banner */}
        {hoveredLocationInfo && (
          <div className="absolute top-4 left-16 z-20 bg-slate-900/90 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md border border-slate-700 pointer-events-none animate-fadeIn">
            {hoveredLocationInfo}
          </div>
        )}

        {/* Bottom Bar: Coordinates, Zoom, and Live Event Filter Chips */}
        <div className="absolute bottom-3 right-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Quick Filter Inside vs Outside */}
          <div className="flex items-center bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg p-0.5 shadow-sm text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('ALL')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                filterMode === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({earthquakes.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('INSIDE')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                filterMode === 'INSIDE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inside AOR (
              {
                earthquakes.filter(
                  (e) => e.aor === 'PCP' || e.aor === 'BIP' || e.aor === 'CGP'
                ).length
              }
              )
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('OUTSIDE')}
              className={`px-2 py-1 rounded font-medium transition-all ${
                filterMode === 'OUTSIDE'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Outside AOR (
              {earthquakes.filter((e) => e.aor === 'Outside AOR').length})
            </button>
          </div>

          {/* Coordinates readout */}
          {cursorCoords && (
            <div className="hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-700 shadow-sm">
              <MapPin className="w-3 h-3 text-blue-600" />
              <span>
                {cursorCoords.lat.toFixed(4)}°N, {cursorCoords.lng.toFixed(4)}°E
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500 font-sans">Zoom {currentZoom}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
