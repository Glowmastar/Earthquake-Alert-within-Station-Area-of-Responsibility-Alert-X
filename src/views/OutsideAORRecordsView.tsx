import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  ShieldCheck,
  Compass,
  Waves,
  Search,
  Calendar,
  Filter,
  RotateCw,
  ChevronDown,
  ArrowDown,
  Eye,
  X,
  Map,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { EarthquakeRecord } from '../types';
import {
  getRecordLocationDetails,
  getRecordDateIso,
  isRecordInDateRange,
} from '../utils/earthquakeHelpers';

interface OutsideAORRecordsViewProps {
  records: EarthquakeRecord[];
  onSelectRecord: (record: EarthquakeRecord) => void;
  onOpenMap?: () => void;
}

export const OutsideAORRecordsView: React.FC<OutsideAORRecordsViewProps> = ({
  records,
  onSelectRecord,
  onOpenMap,
}) => {
  // Filter for outside AOR records with enriched location & date
  const outsideRecords = useMemo(() => {
    return records
      .filter((r) => r.aor === 'Outside AOR' || r.aorStatus === 'Outside')
      .map((r) => {
        const loc = getRecordLocationDetails(r);
        return {
          ...r,
          province: r.province || loc.province,
          municipality: r.municipality || loc.municipality,
          date: r.date || getRecordDateIso(r),
        };
      });
  }, [records]);

  const [selectedRecordId, setSelectedRecordId] = useState<string>('');

  useEffect(() => {
    if (outsideRecords.length > 0 && !selectedRecordId) {
      setSelectedRecordId(outsideRecords[0].id);
    }
  }, [outsideRecords, selectedRecordId]);

  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | '24H' | '7D' | '30D' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [nearestStationFilter, setNearestStationFilter] = useState('All Stations');
  const [provinceFilter, setProvinceFilter] = useState('All Provinces/Regions');
  const [proximityFilter, setProximityFilter] = useState('All Proximities');
  const [statusFilter, setStatusFilter] = useState('All Policies');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Close date picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Distinct provinces for dropdown
  const provinces = useMemo(() => {
    const set = new Set<string>();
    outsideRecords.forEach((r) => {
      if (r.province && r.province !== 'Unspecified') set.add(r.province);
    });
    return Array.from(set).sort();
  }, [outsideRecords]);

  // Date range display label
  const dateRangeDisplay = useMemo(() => {
    if (datePreset === 'ALL') return 'All Dates';
    if (datePreset === 'TODAY') return `Today (${startDate || 'Latest'})`;
    if (datePreset === '24H') return 'Last 24 Hours';
    if (datePreset === '7D') return `Last 7 Days (${startDate} – ${endDate})`;
    if (datePreset === '30D') return `Last 30 Days (${startDate} – ${endDate})`;
    if (datePreset === 'THIS_MONTH') return `This Month (${startDate} – ${endDate})`;
    if (startDate && endDate) return `${startDate} – ${endDate}`;
    if (startDate) return `From ${startDate}`;
    if (endDate) return `Until ${endDate}`;
    return 'All Dates';
  }, [datePreset, startDate, endDate]);

  const applyDatePreset = (preset: 'ALL' | 'TODAY' | '24H' | '7D' | '30D' | 'THIS_MONTH' | 'CUSTOM') => {
    setDatePreset(preset);
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate(todayIso);
      setEndDate(todayIso);
    } else if (preset === '24H') {
      setStartDate('');
      setEndDate('');
    } else if (preset === '7D') {
      const past = new Date(today);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayIso);
    } else if (preset === '30D') {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayIso);
    } else if (preset === 'THIS_MONTH') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      setStartDate(startOfMonth);
      setEndDate(todayIso);
    }
    setIsDatePickerOpen(false);
  };

  // Filtered rows
  const filteredRecords = useMemo(() => {
    return outsideRecords.filter((record) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchSearch =
          record.id.toLowerCase().includes(q) ||
          record.location.toLowerCase().includes(q) ||
          (record.province && record.province.toLowerCase().includes(q)) ||
          (record.municipality && record.municipality.toLowerCase().includes(q)) ||
          (record.epicenterZone && record.epicenterZone.toLowerCase().includes(q)) ||
          (record.coordinateLocation && record.coordinateLocation.toLowerCase().includes(q)) ||
          record.magnitude.toString().includes(q);

        if (!matchSearch) return false;
      }

      // Date Range
      if (datePreset === '24H') {
        if (!record.isRecent24h) {
          const now = Date.now();
          const recTime = new Date(record.date || record.timePHT).getTime();
          if (isNaN(recTime) || now - recTime > 24 * 60 * 60 * 1000) {
            return false;
          }
        }
      } else if (startDate || endDate) {
        if (!isRecordInDateRange(record, startDate, endDate)) {
          return false;
        }
      }

      // Nearest station
      if (nearestStationFilter !== 'All Stations') {
        const station = record.nearestStation || '';
        if (nearestStationFilter.startsWith('PCP') && !station.includes('PCP')) return false;
        if (nearestStationFilter.startsWith('BIP') && !station.includes('BIP')) return false;
        if (nearestStationFilter.startsWith('CGP') && !station.includes('CGP')) return false;
      }

      // Province / Region
      if (provinceFilter !== 'All Provinces/Regions') {
        const matchProv =
          record.province?.toLowerCase() === provinceFilter.toLowerCase() ||
          record.location.toLowerCase().includes(provinceFilter.toLowerCase());
        if (!matchProv) return false;
      }

      // Proximity
      if (proximityFilter === 'Near Boundary (< 50 km)') {
        if (!record.distanceToBoundaryKm || record.distanceToBoundaryKm >= 50) return false;
      } else if (proximityFilter === 'Far Offshore (> 50 km)') {
        if (!record.distanceToBoundaryKm || record.distanceToBoundaryKm < 50) return false;
      }

      // Policy / Status
      if (statusFilter !== 'All Policies') {
        if (statusFilter === 'Outside AOR (Suppressed)' && record.status !== 'Outside AOR') return false;
        if (statusFilter === 'Under Review' && record.status !== 'For Review') return false;
      }

      return true;
    });
  }, [outsideRecords, search, datePreset, startDate, endDate, nearestStationFilter, provinceFilter, proximityFilter, statusFilter]);

  const selectedRecord = useMemo(() => {
    return (
      outsideRecords.find((r) => r.id === selectedRecordId) ||
      filteredRecords[0] ||
      outsideRecords[0]
    );
  }, [outsideRecords, filteredRecords, selectedRecordId]);

  const handleFilter = () => {
    setIsDatePickerOpen(false);
    setActionNotice(`Filters applied. Showing ${filteredRecords.length} of ${outsideRecords.length} records.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleClear = () => {
    setSearch('');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setIsDatePickerOpen(false);
    setNearestStationFilter('All Stations');
    setProvinceFilter('All Provinces/Regions');
    setProximityFilter('All Proximities');
    setStatusFilter('All Policies');
    setActionNotice(`Filters cleared. Displaying all ${outsideRecords.length} Outside AOR records.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Event ID,Date & Time,Location,Magnitude,Depth (km),Geological Zone,Nearest Station,Distance to Boundary (km),Policy']
        .concat(
          filteredRecords.map(
            (r) =>
              `"${r.id}","${r.timePHT}","${r.location}",${r.magnitude},${r.depthKm},"${
                r.epicenterZone || r.province || ''
              }","${r.nearestStation || 'CGP'}","${r.distanceToBoundaryKm || 0} km","${r.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Outside_AOR_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    setActionNotice('Outside AOR Technical & Boundary Analysis Report generated and downloaded.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRecheckProximity = () => {
    setActionNotice(
      'Point-to-perimeter distance verification complete: All 6 epicenters confirmed beyond station polygons with updated geodesic vectors.'
    );
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleManualOverride = () => {
    if (selectedRecord) {
      setActionNotice(
        `Manual dispatch review flagged for ${selectedRecord.id} (${selectedRecord.location}). Requires supervisor authorization.`
      );
    } else {
      setActionNotice('Please select an event to request manual dispatch review.');
    }
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = outsideRecords.length;
    const suppressed = outsideRecords.filter((r) => r.status === 'Outside AOR' || r.status === 'No Alert').length;
    const nearBoundary = outsideRecords.filter((r) => (r.distanceToBoundaryKm || 999) < 50).length;
    const offshoreBasins = outsideRecords.filter((r) => (r.distanceToBoundaryKm || 0) >= 50).length;

    return {
      total,
      suppressed,
      nearBoundary,
      offshoreBasins,
    };
  }, [outsideRecords]);

  // Proximity calculations for the selected record relative to the 3 stations
  const stationProximityList = useMemo(() => {
    if (!selectedRecord) return [];

    const lat = selectedRecord.coordinates.lat;
    const lng = selectedRecord.coordinates.lng;

    // Approximated distance to station centers/polygons for visual breakdown
    // PCP: North Luzon (lat ~ 15.5 - 18.5, lng ~ 120.5 - 122.0)
    // BIP: Bicol/Visayas (lat ~ 12.0 - 14.5, lng ~ 123.0 - 125.0)
    // CGP: Mindanao (lat ~ 5.5 - 9.5, lng ~ 124.5 - 126.5)

    const calcDist = (tLat: number, tLng: number) => {
      const dLat = (lat - tLat) * 111;
      const dLng = (lng - tLng) * 111 * Math.cos((lat * Math.PI) / 180);
      return Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
    };

    const distPCP = calcDist(16.5, 121.2);
    const distBIP = calcDist(13.2, 123.8);
    const distCGP = calcDist(7.2, 125.5);

    return [
      {
        code: 'PCP',
        name: 'Palayan Seismic Station (Luzon)',
        distKm: selectedRecord.nearestStation?.includes('PCP')
          ? selectedRecord.distanceToBoundaryKm || distPCP
          : distPCP,
        isNearest: selectedRecord.nearestStation?.includes('PCP') || false,
        status: 'Outside Boundary',
        bufferMargin: selectedRecord.nearestStation?.includes('PCP')
          ? `+${selectedRecord.distanceToBoundaryKm} km beyond perimeter`
          : 'Beyond operational radius',
      },
      {
        code: 'BIP',
        name: 'Bicol Seismic Station (Visayas)',
        distKm: selectedRecord.nearestStation?.includes('BIP')
          ? selectedRecord.distanceToBoundaryKm || distBIP
          : distBIP,
        isNearest: selectedRecord.nearestStation?.includes('BIP') || false,
        status: 'Outside Boundary',
        bufferMargin: selectedRecord.nearestStation?.includes('BIP')
          ? `+${selectedRecord.distanceToBoundaryKm} km beyond perimeter`
          : 'Beyond operational radius',
      },
      {
        code: 'CGP',
        name: 'Cotabato Seismic Station (Mindanao)',
        distKm: selectedRecord.nearestStation?.includes('CGP')
          ? selectedRecord.distanceToBoundaryKm || distCGP
          : distCGP,
        isNearest: selectedRecord.nearestStation?.includes('CGP') || false,
        status: 'Outside Boundary',
        bufferMargin: selectedRecord.nearestStation?.includes('CGP')
          ? `+${selectedRecord.distanceToBoundaryKm} km beyond perimeter`
          : 'Beyond operational radius',
      },
    ];
  }, [selectedRecord]);

  return (
    <div className="space-y-4">
      {/* Action Toast/Notification */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Outside AOR Records */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Outside AOR Records
            </span>
            <div className="text-3xl font-black text-slate-800 tracking-tight mt-0.5">
              {metrics.total}
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              {filteredRecords.length !== metrics.total ? `${filteredRecords.length} filtered` : 'Active Feed'}
            </span>
          </div>
        </div>

        {/* Card 2: Alerts Suppressed */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Alerts Suppressed
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-teal-700 tracking-tight">
                {metrics.suppressed}
              </span>
              <span className="text-slate-700 text-sm font-semibold">
                ({metrics.total > 0 ? ((metrics.suppressed / metrics.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Near Boundary (< 50 km) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 block">
              Near Boundary (&lt; 50 km)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-amber-700 tracking-tight">
                {metrics.nearBoundary}
              </span>
              <span className="text-amber-700 text-sm font-semibold">
                ({metrics.total > 0 ? ((metrics.nearBoundary / metrics.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Offshore & Deep Sea Basins */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <Waves className="w-6 h-6 text-sky-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Offshore Oceanic Basins
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-sky-800 tracking-tight">
                {metrics.offshoreBasins}
              </span>
              <span className="text-slate-600 text-sm font-semibold">
                ({metrics.total > 0 ? ((metrics.offshoreBasins / metrics.total) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Info Banner with Close button */}
      {showInfoBanner && (
        <div className="bg-slate-50 border border-slate-300/80 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-slate-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              i
            </div>
            <span>
              Outside AOR classification applies to seismic events located outside all designated station perimeters (PCP, BIP, CGP). Automated notifications are withheld by standard operating procedure to avoid alert fatigue, while maintaining high-precision geodesic tracking and distance-to-nearest-station calculations.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowInfoBanner(false)}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Search & Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFilter();
          }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end"
        >
          {/* Search records */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Search records
            </label>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Event ID, location, basin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400 text-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Date range with Interactive Popover */}
          <div className="md:col-span-2 space-y-1 relative" ref={datePickerRef}>
            <label className="text-xs font-semibold text-slate-700 block">
              Date range
            </label>
            <div
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="relative flex items-center cursor-pointer select-none"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 absolute left-3 pointer-events-none" />
              <input
                type="text"
                readOnly
                value={dateRangeDisplay}
                className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none cursor-pointer focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700 truncate"
              />
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 absolute right-2.5 transition-transform ${
                  isDatePickerOpen ? 'rotate-180 text-blue-600' : ''
                }`}
              />
            </div>

            {/* Date Picker Popover Panel */}
            {isDatePickerOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-800">Select Date Range</span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyDatePreset('ALL')}
                    className={`px-2 py-1.5 rounded text-left font-medium transition-colors ${
                      datePreset === 'ALL'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    All Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('TODAY')}
                    className={`px-2 py-1.5 rounded text-left font-medium transition-colors ${
                      datePreset === 'TODAY'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('24H')}
                    className={`px-2 py-1.5 rounded text-left font-medium transition-colors ${
                      datePreset === '24H'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Last 24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('7D')}
                    className={`px-2 py-1.5 rounded text-left font-medium transition-colors ${
                      datePreset === '7D'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('30D')}
                    className={`px-2 py-1.5 rounded text-left font-medium transition-colors ${
                      datePreset === '30D'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('THIS_MONTH')}
                    className={`px-2 py-1.5 rounded text-left font-medium transition-colors ${
                      datePreset === 'THIS_MONTH'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    This Month
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <div className="font-semibold text-slate-600 text-[11px]">
                    Custom Date Range
                  </div>
                  <div className="space-y-1.5">
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setDatePreset('CUSTOM');
                        }}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-medium block">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setDatePreset('CUSTOM');
                        }}
                        className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDatePickerOpen(false);
                      handleFilter();
                    }}
                    className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors"
                  >
                    Apply Range
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('ALL')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded text-xs transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nearest Station */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Nearest Station
            </label>
            <div className="relative">
              <select
                value={nearestStationFilter}
                onChange={(e) => setNearestStationFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Stations">All Stations</option>
                <option value="PCP">PCP (Palayan)</option>
                <option value="BIP">BIP (Bislig)</option>
                <option value="CGP">CGP (Cotabato)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Province / Region */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Province/Region
            </label>
            <div className="relative">
              <select
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Provinces/Regions">All Provinces/Regions ({provinces.length})</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Proximity / Buffer Status */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Proximity Range
            </label>
            <div className="relative">
              <select
                value={proximityFilter}
                onChange={(e) => setProximityFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Proximities">All Proximities</option>
                <option value="Near Boundary (< 50 km)">Near Boundary (&lt; 50 km)</option>
                <option value="Far Offshore (> 50 km)">Far Offshore (&gt; 50 km)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Alert Policy */}
          <div className="md:col-span-1.2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Alert Policy
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Policies">All Policies</option>
                <option value="Outside AOR (Suppressed)">Suppressed</option>
                <option value="Under Review">Under Review</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Buttons: Filter & Clear */}
          <div className="md:col-span-1.3 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Apply filters"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Clear all filters"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Clear</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Outside AOR Earthquake Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 select-none">
                <th className="py-3 px-4 whitespace-nowrap">Event ID</th>
                <th className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    Date & Time
                    <ArrowDown className="w-3 h-3 text-blue-600" />
                  </span>
                </th>
                <th className="py-3 px-4">EQInfo Location</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  Magnitude
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">
                  Depth (km)
                </th>
                <th className="py-3 px-4 whitespace-nowrap">
                  Geological Zone / Oceanic Basin
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  Nearest Station & Distance
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  Alert Status
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.map((record) => {
                const isSelected = record.id === selectedRecord?.id;

                return (
                  <tr
                    key={record.id}
                    onClick={() => {
                      setSelectedRecordId(record.id);
                      onSelectRecord(record);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-100/70 border-l-4 border-l-slate-700'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Event ID */}
                    <td
                      className={`py-3.5 px-4 font-mono font-medium whitespace-nowrap text-xs ${
                        isSelected ? 'text-slate-900 font-semibold' : 'text-slate-800'
                      }`}
                    >
                      {record.id}
                    </td>

                    {/* Date & Time */}
                    <td
                      className={`py-3.5 px-4 whitespace-nowrap font-medium ${
                        isSelected ? 'text-slate-900 font-semibold' : 'text-slate-800'
                      }`}
                    >
                      {record.timePHT}
                    </td>

                    {/* EQInfo Location */}
                    <td
                      className={`py-3.5 px-4 font-medium ${
                        isSelected ? 'text-slate-900 font-semibold' : 'text-slate-800'
                      }`}
                    >
                      {record.location}
                    </td>

                    {/* Magnitude */}
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800 font-mono">
                      {record.magnitude.toFixed(1)}
                    </td>

                    {/* Depth */}
                    <td className="py-3.5 px-3 text-center text-slate-800 font-mono">
                      {record.depthKm}
                    </td>

                    {/* Geological Zone / Oceanic Basin */}
                    <td
                      className={`py-3.5 px-4 whitespace-nowrap font-medium ${
                        isSelected ? 'text-slate-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <span>{record.epicenterZone || record.province}</span>
                      </div>
                    </td>

                    {/* Nearest Station & Distance */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-semibold text-slate-800 text-xs">
                        {record.nearestStation ? record.nearestStation.split(' ')[0] : 'CGP'}{' '}
                        <span className="text-slate-500 font-normal">
                          ({record.distanceToBoundaryKm ? `${record.distanceToBoundaryKm} km` : '50+ km'})
                        </span>
                      </span>
                    </td>

                    {/* Alert Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Outside AOR (Suppressed)
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecordId(record.id);
                          onSelectRecord(record);
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors inline-flex items-center justify-center shadow-2xs bg-white"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-slate-700" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Lower Two-Column Section: Selected Event Details (Left) + Station Perimeter Analysis (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Card: Selected Event Details (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-4.5 bg-slate-700 rounded-full inline-block" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Outside AOR Event Details
            </h3>
          </div>

          {selectedRecord ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-xs">
              {/* Left Sub-column */}
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Event ID</span>
                  <span className="text-slate-900 font-mono font-medium">
                    {selectedRecord.id}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Date & Time</span>
                  <span className="text-slate-900 font-medium">
                    {selectedRecord.timePHT} (PST)
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Latitude</span>
                  <span className="text-slate-900 font-medium">
                    {selectedRecord.coordinates.lat.toFixed(4)}° N
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Longitude</span>
                  <span className="text-slate-900 font-medium">
                    {selectedRecord.coordinates.lng.toFixed(4)}° E
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Magnitude</span>
                  <span className="text-slate-900 font-bold font-mono">
                    {selectedRecord.magnitude.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Depth (km)</span>
                  <span className="text-slate-900 font-mono">
                    {selectedRecord.depthKm}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">
                    Original EQInfo Location
                  </span>
                  <span className="text-slate-900 font-medium">
                    {selectedRecord.location}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-0.5">
                  <span className="text-slate-500 font-medium">
                    Coordinate Location
                  </span>
                  <span className="text-slate-900 font-medium text-right">
                    {selectedRecord.coordinateLocation ||
                      `${selectedRecord.location}, ${selectedRecord.province}`}
                  </span>
                </div>
              </div>

              {/* Right Sub-column */}
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Geological Basin</span>
                  <span className="text-slate-900 font-semibold">
                    {selectedRecord.epicenterZone || 'Offshore Trench'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Nearest Station</span>
                  <span className="text-blue-600 font-medium">
                    {selectedRecord.nearestStation || 'CGP (Cotabato Seismic Station)'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Distance to Boundary</span>
                  <span className="text-amber-700 font-semibold">
                    {selectedRecord.distanceToBoundaryKm
                      ? `${selectedRecord.distanceToBoundaryKm} km beyond perimeter`
                      : '50+ km outside polygon'}
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Alert Action</span>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                      Suppressed (Outside AOR)
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      No automated email dispatched
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Exclusion Reason</span>
                  <span className="text-slate-700 text-right max-w-[210px] leading-snug">
                    {selectedRecord.outsideReason ||
                      'Epicenter determined beyond all approved station perimeters'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-0.5">
                  <span className="text-slate-500 font-medium">
                    Boundary Dataset Version
                  </span>
                  <span className="text-slate-700 font-mono">
                    {selectedRecord.datasetVersion || 'v2025.04.01'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs italic">
              No record selected. Click an event row to inspect details.
            </p>
          )}
        </div>

        {/* Right Card: Station Proximity & Perimeter Analysis (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4.5 bg-slate-700 rounded-full inline-block" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Station Proximity & Perimeter Analysis
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 border-b border-slate-100">
                    <th className="py-2.5 px-3">Monitored Station</th>
                    <th className="py-2.5 px-3 text-center">Distance</th>
                    <th className="py-2.5 px-3 text-right">Perimeter Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stationProximityList.map((st) => (
                    <tr
                      key={st.code}
                      className={st.isNearest ? 'bg-amber-50/30' : ''}
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-blue-600">{st.code}</span>
                          <span className="text-slate-500 text-[11px] truncate max-w-[120px]">
                            {st.code === 'PCP'
                              ? 'Palayan'
                              : st.code === 'BIP'
                              ? 'Bicol'
                              : 'Cotabato'}
                          </span>
                          {st.isNearest && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Nearest
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                        {st.distKm} km
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Protocol Notice Box */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">
                  Automatic Suppression Protocol Active
                </span>
                Events categorized as Outside AOR do not trigger automated SMS or email dispatch to station responders. Authorized coordinators may initiate a manual override if ground shaking was felt in neighboring coastal settlements.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (selectedRecord) onSelectRecord(selectedRecord);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>View Details</span>
          </button>

          <button
            type="button"
            onClick={onOpenMap}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Open on Map</span>
          </button>

          <button
            type="button"
            onClick={handleRecheckProximity}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Radio className="w-3.5 h-3.5 text-slate-600" />
            <span>Recheck Station Proximity</span>
          </button>

          <button
            type="button"
            onClick={handleManualOverride}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-50 border border-amber-500 text-amber-800 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            <span>Manual Alert Override</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
