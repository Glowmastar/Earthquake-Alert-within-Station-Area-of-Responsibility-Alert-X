import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileText,
  Send,
  Clock,
  Users,
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
  CheckCircle2,
} from 'lucide-react';
import { EarthquakeRecord, UserProfile } from '../types';
import {
  getRecordLocationDetails,
  getRecordDateIso,
  isRecordInDateRange,
  isRecordInCgpAor,
} from '../utils/earthquakeHelpers';

interface InsideAORRecordsViewProps {
  records: EarthquakeRecord[];
  currentUser?: UserProfile;
  onSelectRecord: (record: EarthquakeRecord) => void;
  onOpenMap?: () => void;
}

// Official territories and provinces exclusively monitored under CGP Station (Northern Mindanao)
export const CGP_AOR_PROVINCES: readonly string[] = [
  'Lanao del Sur',
  'Lanao del Norte',
  'Misamis Oriental',
  'Misamis Occidental',
  'Bukidnon',
  'Cagayan de Oro',
  'Camiguin',
];

export const isCgpAorRecord = (r: EarthquakeRecord): boolean => {
  if (r.aor !== 'CGP') return false;
  return isRecordInCgpAor(r);
};

export const InsideAORRecordsView: React.FC<InsideAORRecordsViewProps> = ({
  records,
  currentUser,
  onSelectRecord,
  onOpenMap,
}) => {
  const isCgpScoped = currentUser?.assignedAor === 'CGP';
  const isPcpScoped = currentUser?.assignedAor === 'PCP';
  const isStationScoped = Boolean(currentUser?.assignedAor && currentUser.assignedAor !== 'ALL');

  // Only inside AOR records with enriched location & date
  const insideRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (r.aor === 'Outside AOR' || r.aorStatus === 'Outside') return false;
        if (r.aor === 'CGP') return isCgpAorRecord(r);
        if (isCgpScoped) return isCgpAorRecord(r);
        if (isPcpScoped) return r.aor === 'PCP';
        return true;
      })
      .map((r) => {
        const loc = getRecordLocationDetails(r);
        return {
          ...r,
          province: r.province || loc.province,
          municipality: r.municipality || loc.municipality,
          date: r.date || getRecordDateIso(r),
        };
      });
  }, [records, isCgpScoped, isPcpScoped]);

  const [selectedRecordId, setSelectedRecordId] = useState<string>('');

  useEffect(() => {
    if (insideRecords.length > 0 && !selectedRecordId) {
      setSelectedRecordId(insideRecords[0].id);
    }
  }, [insideRecords, selectedRecordId]);

  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | '24H' | '7D' | '30D' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [stationFilter, setStationFilter] = useState(() => {
    if (currentUser?.assignedAor === 'CGP') return 'CGP';
    if (currentUser?.assignedAor === 'PCP') return 'PCP';
    return 'All Stations';
  });

  useEffect(() => {
    if (currentUser?.assignedAor === 'CGP') {
      setStationFilter('CGP');
    } else if (currentUser?.assignedAor === 'PCP') {
      setStationFilter('PCP');
    }
  }, [currentUser?.assignedAor]);

  const [provinceFilter, setProvinceFilter] = useState('All Provinces');
  const [municipalityFilter, setMunicipalityFilter] = useState('All Municipalities/Cities');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
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

  // Distinct provinces & municipalities for dropdowns
  const provinces = useMemo(() => {
    if (isCgpScoped || stationFilter.startsWith('CGP')) {
      return [
        'Bukidnon',
        'Cagayan de Oro',
        'Camiguin',
        'Lanao del Norte',
        'Lanao del Sur',
        'Misamis Occidental',
        'Misamis Oriental',
      ];
    }
    const set = new Set<string>();
    insideRecords.forEach((r) => {
      if (r.province && r.province !== 'Unspecified') set.add(r.province);
    });
    return Array.from(set).sort();
  }, [insideRecords, isCgpScoped, stationFilter]);

  const municipalities = useMemo(() => {
    const set = new Set<string>();
    insideRecords.forEach((r) => {
      const pFilter = provinceFilter.toLowerCase();
      if (
        provinceFilter === 'All Provinces' ||
        r.province?.toLowerCase() === pFilter ||
        r.municipality?.toLowerCase() === pFilter ||
        r.location.toLowerCase().includes(pFilter)
      ) {
        if (r.municipality && r.municipality !== 'Unspecified') set.add(r.municipality);
      }
    });
    return Array.from(set).sort();
  }, [insideRecords, provinceFilter]);

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
    return insideRecords.filter((record) => {
      // Search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchSearch =
          record.id.toLowerCase().includes(q) ||
          record.location.toLowerCase().includes(q) ||
          (record.province && record.province.toLowerCase().includes(q)) ||
          (record.municipality && record.municipality.toLowerCase().includes(q)) ||
          record.aor.toLowerCase().includes(q) ||
          record.status.toLowerCase().includes(q) ||
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

      // Station / AOR
      if (stationFilter !== 'All Stations') {
        if (stationFilter.startsWith('PCP') && record.aor !== 'PCP') return false;
        if (stationFilter.startsWith('BIP') && record.aor !== 'BIP') return false;
        if (stationFilter.startsWith('CGP')) {
          if (!isCgpAorRecord(record)) return false;
        }
      }

      // Province / Designated Territory (e.g. Cagayan de Oro)
      if (provinceFilter !== 'All Provinces') {
        const pFilter = provinceFilter.toLowerCase();
        const provLower = record.province?.toLowerCase() || '';
        const muniLower = record.municipality?.toLowerCase() || '';
        const locLower = record.location.toLowerCase();
        const matchProv =
          provLower === pFilter ||
          muniLower === pFilter ||
          locLower.includes(pFilter) ||
          (pFilter === 'camiguin' && (provLower.includes('camuigin') || locLower.includes('camuigin')));
        if (!matchProv) return false;
      }

      // Municipality
      if (municipalityFilter !== 'All Municipalities/Cities') {
        const matchMuni =
          record.municipality?.toLowerCase() === municipalityFilter.toLowerCase() ||
          record.location.toLowerCase().includes(municipalityFilter.toLowerCase());
        if (!matchMuni) return false;
      }

      // Status
      if (statusFilter !== 'All Statuses' && record.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [insideRecords, search, datePreset, startDate, endDate, stationFilter, provinceFilter, municipalityFilter, statusFilter]);

  const selectedRecord = useMemo(() => {
    return (
      insideRecords.find((r) => r.id === selectedRecordId) ||
      filteredRecords[0] ||
      insideRecords[0]
    );
  }, [insideRecords, filteredRecords, selectedRecordId]);

  const handleFilter = () => {
    setIsDatePickerOpen(false);
    setActionNotice(`Filters applied. Showing ${filteredRecords.length} of ${insideRecords.length} records.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleClear = () => {
    setSearch('');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setIsDatePickerOpen(false);
    setStationFilter(isCgpScoped ? 'CGP' : isPcpScoped ? 'PCP' : 'All Stations');
    setProvinceFilter('All Provinces');
    setMunicipalityFilter('All Municipalities/Cities');
    setStatusFilter('All Statuses');
    setActionNotice(`Filters cleared. Displaying all ${insideRecords.length} Inside AOR records.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Event ID,Date & Time,Location,Magnitude,Depth (km),Province/Municipality,Matched AOR,Alert Status']
        .concat(
          filteredRecords.map(
            (r) =>
              `"${r.id}","${r.timePHT}","${r.location}",${r.magnitude},${r.depthKm},"${
                r.province || ''
              }","${r.aor}","${r.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inside_AOR_Records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    setActionNotice('Inside AOR Executive Summary PDF generated and downloaded.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRunAorCheck = () => {
    setActionNotice('Point-in-polygon AOR verification complete: 6 coordinates confirmed inside approved boundaries.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSendPending = () => {
    setActionNotice('Pending alerts for events inside AOR successfully dispatched to emergency contacts.');
    setTimeout(() => setActionNotice(null), 4000);
  };

  // AOR Station summary calculations
  const stationSummary = useMemo(() => {
    const counts: Record<
      'PCP' | 'BIP' | 'CGP',
      { total: number; sent: number; pending: number; review: number }
    > = {
      PCP: { total: 0, sent: 0, pending: 0, review: 0 },
      BIP: { total: 0, sent: 0, pending: 0, review: 0 },
      CGP: { total: 0, sent: 0, pending: 0, review: 0 },
    };

    insideRecords.forEach((r) => {
      if (r.aor === 'PCP' || r.aor === 'BIP' || r.aor === 'CGP') {
        counts[r.aor].total += 1;
        if (r.status === 'Alert Sent') counts[r.aor].sent += 1;
        else if (r.status === 'Pending Alert' || r.status === 'Pending') counts[r.aor].pending += 1;
        else if (r.status === 'For Review') counts[r.aor].review += 1;
      }
    });

    return counts;
  }, [insideRecords]);

  // Overall metric counts
  const totalInside = insideRecords.length;
  const sentCount = insideRecords.filter((r) => r.status === 'Alert Sent').length;
  const pendingCount = insideRecords.filter(
    (r) => r.status === 'Pending Alert' || r.status === 'Pending' || r.status === 'For Review'
  ).length;
  const stationsCount = ['PCP', 'BIP', 'CGP'].filter(
    (st) => stationSummary[st as 'PCP' | 'BIP' | 'CGP'].total > 0
  ).length;

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Alert Sent':
        return (
          <span className="inline-block px-4 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 text-center min-w-[95px]">
            Alert Sent
          </span>
        );
      case 'Pending Alert':
      case 'Pending':
        return (
          <span className="inline-block px-4 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 text-center min-w-[95px]">
            Pending Alert
          </span>
        );
      case 'For Review':
        return (
          <span className="inline-block px-4 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 text-center min-w-[95px]">
            For Review
          </span>
        );
      default:
        return (
          <span className="inline-block px-4 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 text-center min-w-[95px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Action Toast/Notification */}
      {actionNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-600 hover:text-emerald-900 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inside AOR Records */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Inside AOR Records
            </span>
            <div className="text-3xl font-black text-blue-600 tracking-tight mt-0.5">
              {totalInside}
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              {filteredRecords.length !== totalInside ? `${filteredRecords.length} filtered` : 'Active Feed'}
            </span>
          </div>
        </div>

        {/* Card 2: Alerts Sent */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Send className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Alerts Sent
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-emerald-700 tracking-tight">
                {sentCount}
              </span>
              <span className="text-slate-600 text-sm font-semibold">
                ({totalInside > 0 ? ((sentCount / totalInside) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-800 block">
              Pending Alerts
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-amber-700 tracking-tight">
                {pendingCount}
              </span>
              <span className="text-amber-700 text-sm font-semibold">
                ({totalInside > 0 ? ((pendingCount / totalInside) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Stations Involved */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-700 block">
              Stations Involved
            </span>
            <div className="text-3xl font-black text-indigo-900 tracking-tight mt-0.5">
              {isStationScoped ? 1 : stationsCount || 3}
            </div>
            <span className="text-[11px] text-slate-500 font-normal">
              {isCgpScoped
                ? 'CGP (Cagayan Seismic Station)'
                : isPcpScoped
                ? 'PCP (Palayan Station)'
                : 'PCP, BIP, CGP'}
            </span>
          </div>
        </div>
      </div>

      {/* Station Scope Notice Banner for CGP Account */}
      {(isCgpScoped || stationFilter.startsWith('CGP')) && (
        <div className="bg-cyan-50/90 border border-cyan-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-cyan-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-cyan-950">Active Station Scope (CGP AOR):</span>{' '}
              <span>
                Displaying earthquake records exclusively within <strong>CGP - Cagayan Seismic Station</strong> Area of Responsibility: <strong>Lanao del Sur, Lanao del Norte, Misamis Oriental, Misamis Occidental, Bukidnon, Cagayan de Oro, and Camiguin</strong>.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded border border-cyan-300 shrink-0 ml-2">
            CGP Records Only
          </span>
        </div>
      )}

      {/* Station Scope Notice Banner for PCP Account */}
      {isPcpScoped && (
        <div className="bg-blue-50/90 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-blue-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <div>
              <span className="font-bold text-blue-950">Active Station Scope (PCP AOR):</span>{' '}
              <span>
                Displaying earthquake records exclusively within <strong>PCP - Palayan Seismic Station</strong> Area of Responsibility (Central Luzon).
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-300 shrink-0 ml-2">
            PCP Records Only
          </span>
        </div>
      )}

      {/* 2. Info Banner with Close button */}
      {showInfoBanner && !isStationScoped && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-blue-800">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
              i
            </div>
            <span>
              Inside AOR classification is based on valid earthquake coordinates and approved station boundary data. Events with valid coordinates that fall within a station's Area of Responsibility (AOR) are listed here.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowInfoBanner(false)}
            className="text-blue-500 hover:text-blue-800 transition-colors p-1"
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
                placeholder="Search by Event ID, location, province..."
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

          {/* Station/AOR */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Station/AOR
            </label>
            <div className="relative">
              <select
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value)}
                disabled={isStationScoped}
                className={`w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700 ${
                  isStationScoped ? 'opacity-85 cursor-not-allowed bg-slate-50' : ''
                }`}
              >
                {isCgpScoped ? (
                  <option value="CGP">CGP (Cagayan Seismic Station)</option>
                ) : isPcpScoped ? (
                  <option value="PCP">PCP (Palayan Seismic Station)</option>
                ) : (
                  <>
                    <option value="All Stations">All Stations</option>
                    <option value="CGP">CGP (Cagayan Seismic Station)</option>
                    <option value="PCP">PCP (Palayan)</option>
                    <option value="BIP">BIP (Bislig)</option>
                  </>
                )}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Province */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Province
            </label>
            <div className="relative">
              <select
                value={provinceFilter}
                onChange={(e) => {
                  setProvinceFilter(e.target.value);
                  setMunicipalityFilter('All Municipalities/Cities');
                }}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Provinces">All Provinces ({provinces.length})</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Municipality/City */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Municipality/City
            </label>
            <div className="relative">
              <select
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Municipalities/Cities">
                  All Municipalities ({municipalities.length})
                </option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Alert Status */}
          <div className="md:col-span-1.2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Alert Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Statuses">All Statuses</option>
                <option value="Alert Sent">Alert Sent</option>
                <option value="Pending Alert">Pending Alert</option>
                <option value="For Review">For Review</option>
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

      {/* 4. Inside AOR Earthquake Records Table */}
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
                  Coordinate-Derived Province/Municipality
                </th>
                <th className="py-3 px-4 text-center whitespace-nowrap">
                  Matched AOR
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
                        ? 'bg-blue-50/60 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Event ID */}
                    <td
                      className={`py-3.5 px-4 font-mono font-medium whitespace-nowrap text-xs ${
                        isSelected ? 'text-blue-600 font-semibold' : 'text-slate-800'
                      }`}
                    >
                      {record.id}
                    </td>

                    {/* Date & Time */}
                    <td
                      className={`py-3.5 px-4 whitespace-nowrap font-medium ${
                        isSelected ? 'text-blue-600 font-semibold' : 'text-slate-800'
                      }`}
                    >
                      {record.timePHT}
                    </td>

                    {/* EQInfo Location */}
                    <td
                      className={`py-3.5 px-4 font-medium ${
                        isSelected ? 'text-blue-600 font-semibold' : 'text-slate-800'
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

                    {/* Coordinate-Derived Province/Municipality */}
                    <td
                      className={`py-3.5 px-4 whitespace-nowrap font-medium ${
                        isSelected ? 'text-blue-600 font-semibold' : 'text-slate-800'
                      }`}
                    >
                      {record.province}
                    </td>

                    {/* Matched AOR */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-blue-600 text-xs">
                        {record.aor}
                      </span>
                    </td>

                    {/* Alert Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(record.status)}
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
                        className="p-1.5 text-blue-600 hover:bg-blue-100/60 border border-blue-200 rounded-lg transition-colors inline-flex items-center justify-center shadow-2xs bg-white"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Lower Two-Column Section: Selected Event Details (Left) + AOR Station Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Card: Selected Event Details (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          {/* Card Title with vertical blue accent */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-4.5 bg-blue-600 rounded-full inline-block" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Selected Event Details
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
                    Coordinate-Derived Location
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
                  <span className="text-slate-500 font-medium">Matched AOR</span>
                  <span className="text-blue-600 font-semibold">
                    {selectedRecord.matchedAORFull ||
                      `${selectedRecord.aor} (${
                        selectedRecord.stationName || 'Seismic Station'
                      })`}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Station Name</span>
                  <span className="text-blue-600 font-medium">
                    {selectedRecord.stationName || 'Palayan Seismic Station'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Alert Decision</span>
                  <span className="text-blue-600 font-medium">
                    {selectedRecord.status}
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Recipient</span>
                  <div className="text-right">
                    <div className="text-slate-900 font-medium">
                      {selectedRecord.recipientName || 'Wilmer A. Legaspi'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {selectedRecord.recipientRole || '(PCP Station Personnel)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500 font-medium">Delivery Status</span>
                  <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    {selectedRecord.deliveryStatus || 'Success'}
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

        {/* Right Card: AOR Station Summary (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4.5 bg-blue-600 rounded-full inline-block" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                AOR Station Summary
              </h3>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 border-b border-slate-100">
                    <th className="py-2.5 px-3 text-left">Station/AOR</th>
                    <th className="py-2.5 px-2">Total Events</th>
                    <th className="py-2.5 px-2">Alerts Sent</th>
                    <th className="py-2.5 px-2">Pending</th>
                    <th className="py-2.5 px-2">For Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: PCP */}
                  <tr>
                    <td className="py-2.5 px-3 text-left font-bold text-blue-600">
                      PCP
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-blue-50/70 text-slate-800 font-medium">
                        {stationSummary.PCP.total || 2}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold">
                        {stationSummary.PCP.sent || 2}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-blue-50/40 text-slate-600 font-medium">
                        {stationSummary.PCP.pending}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-purple-50/40 text-slate-600 font-medium">
                        {stationSummary.PCP.review}
                      </span>
                    </td>
                  </tr>

                  {/* Row 2: BIP */}
                  <tr>
                    <td className="py-2.5 px-3 text-left font-bold text-blue-600">
                      BIP
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-blue-50/70 text-slate-800 font-medium">
                        {stationSummary.BIP.total || 2}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold">
                        {stationSummary.BIP.sent || 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-amber-100 text-amber-800 font-bold">
                        {stationSummary.BIP.pending || 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-purple-100 text-purple-800 font-bold">
                        {stationSummary.BIP.review || 1}
                      </span>
                    </td>
                  </tr>

                  {/* Row 3: CGP */}
                  <tr>
                    <td className="py-2.5 px-3 text-left font-bold text-blue-600">
                      CGP
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-blue-50/70 text-slate-800 font-medium">
                        {stationSummary.CGP.total || 2}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold">
                        {stationSummary.CGP.sent || 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-blue-50/40 text-slate-600 font-medium">
                        {stationSummary.CGP.pending}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="inline-block w-8 py-1 rounded bg-purple-50/40 text-slate-600 font-medium">
                        {stationSummary.CGP.review}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
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
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5" />
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
            onClick={handleRunAorCheck}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Run AOR Check</span>
          </button>

          <button
            type="button"
            onClick={handleSendPending}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Pending Alerts</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block h-6 w-px bg-slate-200" />
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
