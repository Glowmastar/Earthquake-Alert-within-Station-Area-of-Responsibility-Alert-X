import React, { useState, useEffect, useMemo } from 'react';
import { ALL_SNAPPED_STATION_AORS } from '../data/allSnappedAorData';
import { Activity } from 'lucide-react';

interface LoginPhilippineMapProps {
  className?: string;
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

export const LoginPhilippineMap: React.FC<LoginPhilippineMapProps> = ({ className = '' }) => {
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

  // Initialize with SIPP (matches target GUI screenshot), then loop randomly
  const initialIndex = useMemo(() => {
    const idx = aorItems.findIndex((a) => a.code === 'SIPP');
    return idx >= 0 ? idx : 0;
  }, [aorItems]);

  const [activeAorIndex, setActiveAorIndex] = useState<number>(initialIndex);
  const [hoveredAorCode, setHoveredAorCode] = useState<string | null>(null);

  // Animation: Loop through AORs randomly every 3.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAorIndex((current) => {
        let next: number;
        do {
          next = Math.floor(Math.random() * aorItems.length);
        } while (next === current && aorItems.length > 1);
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [aorItems.length]);

  const currentAor = aorItems[activeAorIndex] || aorItems[0];
  const activeCode = hoveredAorCode || currentAor?.code;
  const activeAorItem = aorItems.find((a) => a.code === activeCode) || currentAor;

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center select-none ${className}`}>
      {/* Top-Right HUD Telemetry Card (Matching Target GUI Exactly) */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-10 z-30 min-w-[290px] max-w-[340px] bg-[#02091c]/92 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 text-white shadow-2xl transition-all duration-500 pointer-events-auto">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400">
              AOR TELEMETRY ACTIVE
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-[#041938] text-cyan-300 px-2.5 py-0.5 rounded-md border border-cyan-800/80">
            {activeAorItem?.islandGroup}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-cyan-400 tracking-tight">
              {activeAorItem?.code}
            </span>
            <span className="text-xs font-bold text-white truncate">
              {activeAorItem?.name.replace(/AOR.*$/, '').trim()}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 font-mono mt-0.5">
            {activeAorItem?.headquarters}
          </p>

          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
            <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
              COVERED PROVINCES &amp; BASIN:
            </div>
            <div className="text-[11px] text-slate-200 font-medium mt-0.5 leading-snug">
              {activeAorItem?.provinces.join(', ')}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/80 text-[10px]">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Satellite Link: 100%</span>
            </span>
            <span className="text-slate-400 font-medium">Looping Random AOR</span>
          </div>
        </div>
      </div>

      {/* SVG Map of the Philippines (Seamless Transparent Canvas Floating in Scene) */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-full max-h-[92vh] object-contain drop-shadow-[0_0_40px_rgba(2,132,199,0.22)] select-none pointer-events-auto"
        xmlns="http://www.w3.org/2000/svg"
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

        {/* Inactive AOR Polygons (Dark Blue Silhouettes with Crisp Outlines) */}
        <g>
          {aorItems.map((item) => {
            const isHighlighted = item.code === activeCode;
            if (isHighlighted) return null; // Rendered on top layer

            return (
              <path
                key={item.code}
                d={item.pathData}
                fill="#0a1d47"
                fillOpacity="0.22"
                stroke="#1d4ed8"
                strokeWidth="1.2"
                strokeOpacity="0.8"
                className="transition-colors duration-500 cursor-pointer hover:stroke-cyan-400"
                onMouseEnter={() => setHoveredAorCode(item.code)}
                onMouseLeave={() => setHoveredAorCode(null)}
                onClick={() => setActiveAorIndex(item.index)}
              >
                <title>{`${item.name} (${item.code})`}</title>
              </path>
            );
          })}
        </g>

        {/* Active Highlighted AOR Polygon (Brilliant Luminous Cyan Neon Glow) */}
        {activeAorItem && (
          <g key={`active-${activeAorItem.code}`}>
            <path
              d={activeAorItem.pathData}
              fill="#06b6d4"
              fillOpacity="0.28"
              stroke="#00f0ff"
              strokeWidth="2.6"
              filter="url(#neonGlow)"
              className="transition-all duration-700 ease-in-out cursor-pointer"
              onMouseEnter={() => setHoveredAorCode(activeAorItem.code)}
              onMouseLeave={() => setHoveredAorCode(null)}
            >
              <title>{`${activeAorItem.name} (${activeAorItem.code})`}</title>
            </path>
          </g>
        )}

        {/* Active Station Pulse Radar Beacon & Code Pill Badge */}
        {activeAorItem && (
          <g
            key={`marker-${activeAorItem.code}`}
            transform={`translate(${activeAorItem.stationPos[0]}, ${activeAorItem.stationPos[1]})`}
            className="transition-all duration-700 ease-in-out"
          >
            {/* Concentric Expanding Radar Pulse Waves */}
            <circle
              r="30"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              opacity="0.35"
              className="animate-ping"
            />
            <circle
              r="18"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              opacity="0.65"
            />
            <circle
              r="8"
              fill="#00f0ff"
              opacity="0.85"
              filter="url(#beaconGlow)"
            />
            <circle r="3.5" fill="#ffffff" />

            {/* Glowing Station Code Pill Badge [ CODE ] (Matching Screenshot Pill Tag) */}
            <g transform="translate(13, -10)">
              <rect
                x="0"
                y="0"
                width={activeAorItem.code.length > 3 ? 42 : 36}
                height="19"
                rx="5"
                fill="#020817"
                stroke="#00f0ff"
                strokeWidth="1.4"
                filter="url(#neonGlow)"
              />
              <text
                x={activeAorItem.code.length > 3 ? 21 : 18}
                y="13"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9.5"
                fontWeight="800"
                fontFamily="sans-serif"
                letterSpacing="0.05em"
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
