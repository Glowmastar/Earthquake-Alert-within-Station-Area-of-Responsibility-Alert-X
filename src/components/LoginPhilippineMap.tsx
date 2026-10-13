import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ALL_SNAPPED_STATION_AORS } from '../data/allSnappedAorData';
import { Activity, ShieldCheck, MapPin, Eye } from 'lucide-react';

interface LoginPhilippineMapProps {
  className?: string;
  externalHoverCode?: string | null;
  onSelectStation?: (aorCode: string) => void;
}

// Exact official PHIVOLCS station headquarters coordinates [lat, lng]
const STATION_HEADQUARTERS: Record<string, [number, number]> = {
  SIPP: [17.868, 120.458], // Sinait Seismic Station (Ilocos Sur)
  BCP: [16.402, 120.596],  // Baguio Seismic Station (Benguet)
  CVP: [17.705, 121.821],  // Callao Seismic Station (Cagayan)
  PCP: [15.541, 121.084],  // Palayan Seismic Station (Nueva Ecija)
  LQP: [14.115, 121.556],  // Lucban Seismic Station (Quezon)
  PGP: [13.504, 120.957],  // Puerto Galera Seismic Station (Mindoro)
  GQP: [13.916, 122.454],  // Guinayangan Seismic Station (Quezon / Bicol)
  LLP: [10.315, 123.950],  // Lapu-Lapu Seismic Station (Cebu)
  PLP: [11.160, 124.990],  // Palo Seismic Station (Leyte)
  SNP: [9.356, 123.284],   // Sibulan Seismic Station (Negros Oriental)
  PPR: [9.739, 118.735],   // Puerto Princesa Seismic Station (Palawan)
  CGP: [8.482, 124.647],   // Cagayan de Oro Seismic Station (Northern Mindanao)
  BIP: [8.216, 126.316],   // Bislig Seismic Station (Surigao del Sur)
  DMP: [7.073, 125.612],   // Davao Seismic Station (Davao Region)
  ZCP: [6.921, 122.079],   // Zamboanga Seismic Station (Zamboanga Peninsula)
};

export const LoginPhilippineMap: React.FC<LoginPhilippineMapProps> = ({
  className = '',
  externalHoverCode = null,
  onSelectStation,
}) => {
  // SVG dimensions & coordinate projection for Philippine archipelago
  const SVG_WIDTH = 680;
  const SVG_HEIGHT = 920;
  const MIN_LAT = 4.5;
  const MAX_LAT = 21.5;
  const MIN_LNG = 116.5;
  const MAX_LNG = 127.2;

  // Project [lat, lng] to SVG [x, y]
  const project = (lat: number, lng: number): [number, number] => {
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * (SVG_WIDTH - 60) + 30;
    const y = ((MAX_LAT - lat) / (MAX_LAT - MIN_LAT)) * (SVG_HEIGHT - 60) + 30;
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  };

  // Precompute SVG polygon paths and exact headquarters coordinates for all 15 AORs
  const aorItems = useMemo(() => {
    return ALL_SNAPPED_STATION_AORS.map((aor, index) => {
      const pathData = aor.coordinates
        .map((polygon) => {
          return (
            'M ' +
            polygon
              .map(([lat, lng]) => {
                const [x, y] = project(lat, lng);
                return `${x} ${y}`;
              })
              .join(' L ') +
            ' Z'
          );
        })
        .join(' ');

      // Use verified station headquarters GPS coords
      const hqCoords = STATION_HEADQUARTERS[aor.code] || [12.0, 122.0];
      const [stationX, stationY] = project(hqCoords[0], hqCoords[1]);

      return {
        index,
        code: aor.code,
        name: aor.name,
        headquarters: aor.headquarters,
        islandGroup: aor.islandGroup,
        provinces: aor.provincesIncluded,
        pathData,
        stationPos: [stationX, stationY] as [number, number],
      };
    });
  }, []);

  // Animation & Hover state
  // Requirement 1: Starts with ALL stations deselected (null)
  const [activeAorIndex, setActiveAorIndex] = useState<number | null>(null);
  const [hoveredAorCode, setHoveredAorCode] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // References to manage timers cleanly
  const hasHoveredOnceRef = useRef<boolean>(false);
  const delayTimerRef = useRef<any>(null);
  const intervalTimerRef = useRef<any>(null);
  const debounceLeaveTimerRef = useRef<any>(null);

  // Clear random cycling timers helper
  const clearCycleTimers = useCallback(() => {
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (intervalTimerRef.current) {
      clearInterval(intervalTimerRef.current);
      intervalTimerRef.current = null;
    }
  }, []);

  // Handler when user hovers on an AOR polygon
  const handleAorEnter = useCallback(
    (code: string, e?: React.MouseEvent) => {
      // Cancel any pending exit debounce
      if (debounceLeaveTimerRef.current) {
        clearTimeout(debounceLeaveTimerRef.current);
        debounceLeaveTimerRef.current = null;
      }

      // Stop any pending or ongoing random cycling immediately
      clearCycleTimers();

      // Flag that the user has hovered on an AOR
      hasHoveredOnceRef.current = true;

      // Update state for hover inspection
      setHoveredAorCode(code);
      const match = aorItems.find((a) => a.code === code);
      if (match) {
        setActiveAorIndex(match.index);
      }

      if (e) {
        const rect = e.currentTarget.getBoundingClientRect();
        setCursorPos({
          x: Math.round(e.clientX - rect.left),
          y: Math.round(e.clientY - rect.top),
        });
      }
    },
    [aorItems, clearCycleTimers]
  );

  // Handler when user stops hovering on AORs (leaves into ocean or outside map)
  const handleAorLeave = useCallback(() => {
    // Debounce slightly (120ms) to prevent flickering when moving across internal borders or islands
    if (debounceLeaveTimerRef.current) {
      clearTimeout(debounceLeaveTimerRef.current);
    }

    debounceLeaveTimerRef.current = setTimeout(() => {
      setHoveredAorCode(null);
      setCursorPos(null);

      // Requirement 1: Immediately deselect all stations
      setActiveAorIndex(null);

      // Requirement 2: Only after the user has hovered the cursor on any AOR,
      // give it 1 sec (1000ms) with all stations deselected to do the random selection of station AOR
      if (hasHoveredOnceRef.current) {
        clearCycleTimers();

        delayTimerRef.current = setTimeout(() => {
          // Pick a random station AOR
          setActiveAorIndex((current) => {
            let next: number;
            do {
              next = Math.floor(Math.random() * aorItems.length);
            } while (current !== null && next === current && aorItems.length > 1);
            return next;
          });

          // Continue random cycling every 3.5 seconds
          intervalTimerRef.current = setInterval(() => {
            setActiveAorIndex((current) => {
              let next: number;
              do {
                next = Math.floor(Math.random() * aorItems.length);
              } while (current !== null && next === current && aorItems.length > 1);
              return next;
            });
          }, 3500);
        }, 1000);
      }
    }, 120);
  }, [aorItems.length, clearCycleTimers]);

  // Synchronize external hover (e.g. from quick account buttons)
  useEffect(() => {
    if (externalHoverCode) {
      handleAorEnter(externalHoverCode);
    } else if (externalHoverCode === null && !cursorPos) {
      // If cleared externally and cursor not inside map
      if (hoveredAorCode) {
        handleAorLeave();
      }
    }
  }, [externalHoverCode, handleAorEnter, handleAorLeave, cursorPos, hoveredAorCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCycleTimers();
      if (debounceLeaveTimerRef.current) {
        clearTimeout(debounceLeaveTimerRef.current);
      }
    };
  }, [clearCycleTimers]);

  // Active code determination
  const effectiveHoverCode = hoveredAorCode || externalHoverCode;
  const isHovering = Boolean(effectiveHoverCode);
  const currentAor = activeAorIndex !== null ? aorItems[activeAorIndex] : null;
  const activeCode = effectiveHoverCode || (currentAor ? currentAor.code : null);
  const activeAorItem = activeCode ? aorItems.find((a) => a.code === activeCode) || null : null;

  // Render order: render the active AOR last so its glowing border paints cleanly on top of neighbors
  const sortedAorItems = useMemo(() => {
    if (!activeCode) return aorItems;
    const others = aorItems.filter((a) => a.code !== activeCode);
    const active = aorItems.find((a) => a.code === activeCode);
    return active ? [...others, active] : aorItems;
  }, [aorItems, activeCode]);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none pointer-events-auto ${className}`}
      onMouseLeave={handleAorLeave}
    >
      {/* Top-Right HUD Telemetry Card (Matching Target GUI Exactly) */}
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6 lg:top-8 lg:right-10 z-30 min-w-[280px] max-w-[340px] bg-[#02091c]/95 backdrop-blur-md border border-cyan-700/60 rounded-2xl p-4 text-white shadow-2xl transition-all duration-300 pointer-events-auto">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isHovering ? 'bg-amber-400' : activeAorItem ? 'bg-cyan-400' : 'bg-slate-500'
              } ${isHovering || activeAorItem ? 'animate-ping' : ''} shrink-0`}
            />
            <span
              className={`text-[10px] font-bold tracking-wider uppercase ${
                isHovering ? 'text-amber-300' : activeAorItem ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {isHovering
                ? 'AOR HOVER INSPECTION'
                : activeAorItem
                ? 'AOR TELEMETRY ACTIVE'
                : 'AOR TELEMETRY READY'}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#041938] text-cyan-300 px-2.5 py-0.5 rounded-md border border-cyan-800/80">
            {activeAorItem ? activeAorItem.islandGroup : 'PHILIPPINES'}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-cyan-400 tracking-tight">
              {activeAorItem ? activeAorItem.code : 'ALL AORs'}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {activeAorItem ? activeAorItem.name.replace(/AOR.*$/, '').trim() : 'National Network'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
            {activeAorItem ? activeAorItem.headquarters : 'DOST-PHIVOLCS Seismic Station Network'}
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
              COVERED PROVINCES &amp; BASIN:
            </div>
            <div className="text-[11px] text-slate-200 font-medium mt-0.5 leading-snug max-h-16 overflow-y-auto custom-scrollbar">
              {activeAorItem
                ? activeAorItem.provinces.join(', ')
                : 'Hover cursor over any Station AOR to inspect regional coverage, or wait 1 sec after hover for random selection.'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/80 text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Real-Time Satellite Link: 100%</span>
            </span>
            <span
              className={`font-semibold ${
                isHovering ? 'text-amber-300' : activeAorItem ? 'text-cyan-400' : 'text-slate-400'
              }`}
            >
              {isHovering
                ? 'Hover Inspection Active'
                : activeAorItem
                ? 'Looping Random AOR'
                : 'Hover Any AOR to Begin'}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Map of the Philippines (Seamless Transparent Canvas Floating in Scene) */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full max-h-[92vh] object-contain drop-shadow-[0_0_40px_rgba(2,132,199,0.22)] select-none pointer-events-auto cursor-default"
        xmlns="http://www.w3.org/2000/svg"
        onMouseLeave={handleAorLeave}
      >
        <defs>
          {/* Intense Neon Glow Filters for Active AOR and Beacon */}
          <filter id="neonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="beaconGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Transparent Ocean Canvas Background to detect when cursor leaves AOR polygons */}
        <rect
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          fill="transparent"
          style={{ pointerEvents: 'all' }}
          onMouseEnter={handleAorLeave}
        />

        {/* All 15 Station AOR Polygons (Interactive Hover & Snapped Vector Boundaries) */}
        <g>
          {sortedAorItems.map((item) => {
            const isHighlighted = item.code === activeCode;
            const isDirectHover = item.code === effectiveHoverCode;

            return (
              <path
                key={item.code}
                d={item.pathData}
                fill={isHighlighted ? '#06b6d4' : '#0a1d47'}
                fillOpacity={isHighlighted ? (isDirectHover ? 0.46 : 0.35) : 0.28}
                stroke={isHighlighted ? '#00f0ff' : '#1d4ed8'}
                strokeWidth={isHighlighted ? (isDirectHover ? 3.4 : 2.6) : 1.3}
                strokeOpacity={isHighlighted ? 1 : 0.8}
                filter={isHighlighted ? 'url(#neonGlow)' : undefined}
                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                className="transition-colors duration-150"
                onMouseEnter={(e) => handleAorEnter(item.code, e)}
                onMouseMove={(e) => handleAorEnter(item.code, e)}
                onClick={() => {
                  handleAorEnter(item.code);
                  if (onSelectStation) {
                    onSelectStation(item.code);
                  }
                }}
              >
                <title>{`${item.name} (${item.code}) - Click or Hover to inspect AOR`}</title>
              </path>
            );
          })}
        </g>

        {/* Active Station Pulse Radar Beacon & Code Pill Badge */}
        {/* CRITICAL: style pointerEvents none so beacon NEVER blocks mouse events on polygons */}
        {activeAorItem && (
          <g
            key={`marker-${activeAorItem.code}`}
            transform={`translate(${activeAorItem.stationPos[0]}, ${activeAorItem.stationPos[1]})`}
            style={{ pointerEvents: 'none' }}
            className="transition-all duration-300 ease-in-out pointer-events-none"
          >
            {/* Concentric Expanding Radar Pulse Waves */}
            <circle
              r="32"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              opacity="0.4"
              className="animate-ping"
              style={{ pointerEvents: 'none' }}
            />
            <circle
              r="18"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              opacity="0.65"
              style={{ pointerEvents: 'none' }}
            />
            <circle
              r="8"
              fill="#00f0ff"
              opacity="0.85"
              filter="url(#beaconGlow)"
              style={{ pointerEvents: 'none' }}
            />
            <circle r="3.5" fill="#ffffff" style={{ pointerEvents: 'none' }} />

            {/* Glowing Station Code Pill Badge [ CODE ] */}
            <g transform="translate(13, -10)" style={{ pointerEvents: 'none' }}>
              <rect
                x="0"
                y="0"
                width={activeAorItem.code.length > 3 ? 44 : 38}
                height="20"
                rx="5"
                fill="#020817"
                stroke="#00f0ff"
                strokeWidth="1.5"
                filter="url(#neonGlow)"
                style={{ pointerEvents: 'none' }}
              />
              <text
                x={activeAorItem.code.length > 3 ? 22 : 19}
                y="14"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="10"
                fontWeight="800"
                fontFamily="sans-serif"
                letterSpacing="0.05em"
                style={{ pointerEvents: 'none' }}
              >
                {activeAorItem.code}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
