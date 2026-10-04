import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Calendar,
  Filter,
  RotateCw,
  Download,
  FileSpreadsheet,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Info,
  HelpCircle,
  MapPin,
  Mail,
  X,
  CheckCircle2,
  Radio,
  ExternalLink,
  Globe,
  Activity,
} from 'lucide-react';
import { EarthquakeRecord } from '../types';
import {
  getRecordLocationDetails,
  getRecordDateIso,
  isRecordInDateRange,
  isRecordInCgpAor,
} from '../utils/earthquakeHelpers';

interface EarthquakeRecordsViewProps {
  records: EarthquakeRecord[];
  initialFilter?: string;
  onSelectRecord: (record: EarthquakeRecord) => void;
  onRefreshLive?: () => void;
  isLiveUpdating?: boolean;
  lastSyncTime?: string;
  sourceUrl?: string;
}

type DatePreset = 'ALL' | 'TODAY' | '24H' | '7D' | '30D' | 'THIS_MONTH' | 'CUSTOM';

export const EarthquakeRecordsView: React.FC<EarthquakeRecordsViewProps> = ({
  records,
  initialFilter = 'ALL',
  onSelectRecord,
  onRefreshLive,
  isLiveUpdating = false,
  lastSyncTime,
  sourceUrl = 'https://earthquake.phivolcs.dost.gov.ph/',
}) => {
  // Enriched records with parsed province & municipality
  const enrichedRecords = useMemo(() => {
    return records.map((record) => {
      const loc = getRecordLocationDetails(record);
      return {
        ...record,
        province: record.province || loc.province,
        municipality: record.municipality || loc.municipality,
        date: record.date || getRecordDateIso(record),
      };
    });
  }, [records]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [aorFilter, setAorFilter] = useState(() => {
    if (initialFilter === 'INSIDE_AOR') return 'Inside AOR';
    if (initialFilter === 'OUTSIDE_AOR') return 'Outside AOR';
    return 'All AOR';
  });
  const [provinceFilter, setProvinceFilter] = useState('All Provinces');
  const [municipalityFilter, setMunicipalityFilter] = useState('All Municipalities');
  const [statusFilter, setStatusFilter] = useState('All Status');

  // Date Range State
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Feedback Notification
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync initialFilter prop if it changes
  useEffect(() => {
    if (initialFilter === 'INSIDE_AOR') {
      setAorFilter('Inside AOR');
    } else if (initialFilter === 'OUTSIDE_AOR') {
      setAorFilter('Outside AOR');
    } else if (initialFilter === 'ALL') {
      setAorFilter('All AOR');
    }
  }, [initialFilter]);

  // Distinct provinces for dropdown
  const provinces = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => {
      if (r.province && r.province !== 'Unspecified') {
        set.add(r.province);
      }
    });
    return Array.from(set).sort();
  }, [enrichedRecords]);

  // Distinct municipalities for dropdown (scoped to province if selected)
  const municipalities = useMemo(() => {
    const set = new Set<string>();
    enrichedRecords.forEach((r) => {
      if (
        provinceFilter === 'All Provinces' ||
        r.province?.toLowerCase() === provinceFilter.toLowerCase()
      ) {
        if (r.municipality && r.municipality !== 'Unspecified') {
          set.add(r.municipality);
        }
      }
    });
    return Array.from(set).sort();
  }, [enrichedRecords, provinceFilter]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return enrichedRecords.filter((record) => {
      // 1. Search filter
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const searchTarget = `${record.id} ${record.location} ${record.province || ''} ${
          record.municipality || ''
        } ${record.aor} ${record.status} M${record.magnitude} ${record.magnitude} ${
          record.coordinates?.lat || ''
        } ${record.coordinates?.lng || ''}`.toLowerCase();

        if (!searchTarget.includes(q)) {
          return false;
        }
      }

      // 2. Date Range filter
      if (datePreset === '24H') {
        if (!record.isRecent24h) {
          // Fallback check timestamp
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

      // 3. AOR filter
      if (aorFilter === 'Inside AOR' || aorFilter === 'Inside') {
        if (record.aor === 'Outside AOR' || record.aorStatus === 'Outside') return false;
        if (record.aor === 'CGP' && !isRecordInCgpAor(record)) return false;
      } else if (aorFilter === 'Outside AOR') {
        if (record.aor !== 'Outside AOR' && record.aorStatus !== 'Outside') return false;
      } else if (aorFilter === 'CGP') {
        if (record.aor !== 'CGP' || !isRecordInCgpAor(record)) return false;
      } else if (aorFilter !== 'All AOR') {
        if (record.aor !== aorFilter) return false;
      }

      // 4. Province filter
      if (provinceFilter !== 'All Provinces') {
        const provMatch =
          record.province?.toLowerCase() === provinceFilter.toLowerCase() ||
          record.location.toLowerCase().includes(provinceFilter.toLowerCase());
        if (!provMatch) return false;
      }

      // 5. Municipality/City filter
      if (municipalityFilter !== 'All Municipalities') {
        const muniMatch =
          record.municipality?.toLowerCase() === municipalityFilter.toLowerCase() ||
          record.location.toLowerCase().includes(municipalityFilter.toLowerCase());
        if (!muniMatch) return false;
      }

      // 6. Status filter
      if (statusFilter !== 'All Status') {
        if (record.status !== statusFilter) return false;
      }

      return true;
    });
  }, [
    enrichedRecords,
    search,
    datePreset,
    startDate,
    endDate,
    aorFilter,
    provinceFilter,
    municipalityFilter,
    statusFilter,
  ]);

  // Overall metric calculations
  const totalCount = records.length;
  const insideAorCount = records.filter(
    (r) => r.aor !== 'Outside AOR' && r.aorStatus !== 'Outside' && (r.aor !== 'CGP' || isRecordInCgpAor(r))
  ).length;
  const alertsSentCount = records.filter((r) => r.status === 'Alert Sent').length;
  const forReviewCount = records.filter((r) => r.status === 'For Review').length;

  // Active filter checks
  const hasActiveFilters =
    search.trim() !== '' ||
    datePreset !== 'ALL' ||
    aorFilter !== 'All AOR' ||
    provinceFilter !== 'All Provinces' ||
    municipalityFilter !== 'All Municipalities' ||
    statusFilter !== 'All Status';

  // Handle Preset Selection
  const applyDatePreset = (preset: DatePreset) => {
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
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      setStartDate(startOfMonth);
      setEndDate(todayIso);
    }
    setIsDatePickerOpen(false);
    setCurrentPage(1);
  };

  // Date Range Display Text
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

  // Apply Filter Action
  const handleApplyFilter = () => {
    setIsDatePickerOpen(false);
    setCurrentPage(1);
    setFeedbackNotice(`Filters applied. Showing ${filteredRecords.length} matching records.`);
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Clear Filters Action
  const handleClearFilters = () => {
    setSearch('');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setIsDatePickerOpen(false);
    setAorFilter('All AOR');
    setProvinceFilter('All Provinces');
    setMunicipalityFilter('All Municipalities');
    setStatusFilter('All Status');
    setCurrentPage(1);
    setFeedbackNotice(`Filters cleared. Displaying all ${records.length} records.`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Reset currentPage to 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    datePreset,
    startDate,
    endDate,
    aorFilter,
    provinceFilter,
    municipalityFilter,
    statusFilter,
    rowsPerPage,
  ]);

  // Dynamic pagination calculations
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  const getVisiblePageNumbers = () => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let start = Math.max(1, safeCurrentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Event ID,Date & Time (PST),Location,Magnitude,Depth (km),Province,Municipality,AOR,Alert Status']
        .concat(
          filteredRecords.map(
            (r) =>
              `"${r.id}","${r.timePHT}","${r.location}",${r.magnitude},${r.depthKm},"${
                r.province || ''
              }","${r.municipality || ''}","${r.aor}","${r.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PHIVOLCS_Earthquakes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    handleExportCSV();
  };

  const renderStatusPill = (status: string) => {
    switch (status) {
      case 'Alert Sent':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 text-center min-w-[95px]">
            Alert Sent
          </span>
        );
      case 'Pending Alert':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 text-center min-w-[95px]">
            Pending Alert
          </span>
        );
      case 'For Review':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 text-center min-w-[95px]">
            For Review
          </span>
        );
      case 'Outside AOR':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-rose-100 text-rose-700 text-center min-w-[95px]">
            Outside AOR
          </span>
        );
      case 'Duplicate':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-slate-200 text-slate-700 text-center min-w-[95px]">
            Duplicate
          </span>
        );
      case 'No Alert':
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 text-center min-w-[95px]">
            No Alert
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 text-center min-w-[95px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Live PHIVOLCS DOST Feed Status & Sync Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
            <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-slate-900">
                PHIVOLCS DOST Live Earthquake Feed
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Live Connected
              </span>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Official Bulletins
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>
                Source:{' '}
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-1 font-mono text-[11px]"
                >
                  earthquake.phivolcs.dost.gov.ph
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
              <span className="text-slate-300">&bull;</span>
              <span>
                {lastSyncTime
                  ? `Last synchronized: ${lastSyncTime} (PST)`
                  : 'Automatic real-time polling active (60s)'}
              </span>
              <span className="text-slate-300">&bull;</span>
              <span className="font-semibold text-slate-700">
                {totalCount.toLocaleString()} total seismic bulletins available
              </span>
            </div>
          </div>
        </div>

        {onRefreshLive && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onRefreshLive}
              disabled={isLiveUpdating}
              className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-60"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${isLiveUpdating ? 'animate-spin' : ''}`}
              />
              <span>{isLiveUpdating ? 'Fetching PHIVOLCS...' : 'Pull Updated Bulletins'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Feedback Notice */}
      {feedbackNotice && (
        <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-blue-500 hover:text-blue-800 p-0.5"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Top 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Records */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100">
            <svg
              className="w-6 h-6 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <div>
            <span className="text-xs font-bold text-rose-600 block">Total Records</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-rose-600 tracking-tight">
                {totalCount}
              </span>
              <span className="text-slate-500 text-xs font-normal">
                {hasActiveFilters ? `(${filteredRecords.length} filtered)` : 'Live Feed'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Inside AOR */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-700 block">Inside AOR</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-emerald-700 tracking-tight">
                {insideAorCount}
              </span>
              <span className="text-slate-600 text-sm font-semibold">
                ({totalCount > 0 ? ((insideAorCount / totalCount) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Alerts Sent */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-600 block">Alerts Sent</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-blue-600 tracking-tight">
                {alertsSentCount}
              </span>
              <span className="text-blue-500 text-sm font-semibold">
                ({totalCount > 0 ? ((alertsSentCount / totalCount) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: For Review */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 border border-purple-100">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-purple-700 block">For Review</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-purple-700 tracking-tight">
                {forReviewCount}
              </span>
              <span className="text-purple-600 text-sm font-semibold">
                ({totalCount > 0 ? ((forReviewCount / totalCount) * 100).toFixed(1) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs relative z-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApplyFilter();
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
                placeholder="Search Event ID, location, mag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400 text-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Clear search input"
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

                {/* Quick Presets */}
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

                {/* Custom Date Pickers */}
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

                {/* Actions inside popover */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDatePickerOpen(false);
                      handleApplyFilter();
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

          {/* AOR Dropdown */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              AOR
            </label>
            <div className="relative">
              <select
                value={aorFilter}
                onChange={(e) => setAorFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All AOR">All AOR</option>
                <option value="Inside AOR">Inside AOR (All)</option>
                <option value="PCP">PCP (Palayan)</option>
                <option value="BIP">BIP (Bislig)</option>
                <option value="CGP">CGP (Cagayan de Oro)</option>
                <option value="Outside AOR">Outside AOR</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Province Dropdown */}
          <div className="md:col-span-1.5 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Province
            </label>
            <div className="relative">
              <select
                value={provinceFilter}
                onChange={(e) => {
                  setProvinceFilter(e.target.value);
                  setMunicipalityFilter('All Municipalities');
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

          {/* Municipality/City Dropdown */}
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
                <option value="All Municipalities">
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

          {/* Status Dropdown */}
          <div className="md:col-span-1.2 space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium text-slate-700"
              >
                <option value="All Status">All Status</option>
                <option value="Alert Sent">Alert Sent</option>
                <option value="Pending Alert">Pending Alert</option>
                <option value="For Review">For Review</option>
                <option value="Outside AOR">Outside AOR</option>
                <option value="No Alert">No Alert</option>
                <option value="Duplicate">Duplicate</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons: Filter and Clear */}
          <div className="md:col-span-1.3 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              title="Apply filters"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Clear all filters"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-600" />
              <span>Clear</span>
            </button>
          </div>
        </form>

        {/* Filter Summary indicator */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-700">Active filters:</span>
              {search.trim() && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  Search: "{search.trim()}"
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="hover:text-slate-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {datePreset !== 'ALL' && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  Date: {dateRangeDisplay}
                  <button
                    type="button"
                    onClick={() => applyDatePreset('ALL')}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {aorFilter !== 'All AOR' && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  AOR: {aorFilter}
                  <button
                    type="button"
                    onClick={() => setAorFilter('All AOR')}
                    className="hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {provinceFilter !== 'All Provinces' && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  Prov: {provinceFilter}
                  <button
                    type="button"
                    onClick={() => setProvinceFilter('All Provinces')}
                    className="hover:text-purple-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {municipalityFilter !== 'All Municipalities' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  Muni: {municipalityFilter}
                  <button
                    type="button"
                    onClick={() => setMunicipalityFilter('All Municipalities')}
                    className="hover:text-amber-900"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== 'All Status' && (
                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium text-[11px]">
                  Status: {statusFilter}
                  <button
                    type="button"
                    onClick={() => setStatusFilter('All Status')}
                    className="hover:text-slate-900"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-800 text-xs font-semibold ml-auto"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Earthquake Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold text-slate-600 select-none">
                <th className="py-3 px-4 whitespace-nowrap">Event ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Date & Time (PST)</th>
                <th className="py-3 px-4">EQInfo Location</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Magnitude</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Depth (km)</th>
                <th className="py-3 px-4 whitespace-nowrap">Province / Municipality</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">AOR</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Alert Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-slate-500 font-medium"
                  >
                    <div className="space-y-2">
                      <p className="text-slate-700 font-semibold text-sm">
                        No earthquake records match the selected filters.
                      </p>
                      <p className="text-slate-500 text-xs">
                        Try adjusting your search keywords, date range, or AOR/province filters.
                      </p>
                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors mt-2"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Clear All Filters</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRecords.map((record) => {
                  // Split date & time for clean 2-line rendering
                  const timeParts = record.timePHT.split(' ');
                  const datePart =
                    timeParts.length >= 3
                      ? `${timeParts[0]} ${timeParts[1]} ${timeParts[2]}`
                      : record.date || record.timePHT;
                  const timePart =
                    timeParts.length >= 5 ? `${timeParts[3]} ${timeParts[4]}` : '';

                  // Location split for clean multi-line display
                  const locationParts = record.location.split(',');
                  const locLine1 = locationParts[0]?.trim();
                  const locLine2 = locationParts.slice(1).join(',').trim();

                  const isOutsideAor =
                    record.aor === 'Outside AOR' || record.aorStatus === 'Outside';

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Event ID */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800 whitespace-nowrap text-xs">
                        {record.id}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 leading-tight">
                          {datePart}
                        </div>
                        {timePart && (
                          <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            {timePart}
                          </div>
                        )}
                      </td>

                      {/* EQInfo Location */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 leading-tight">
                          {locLine1}
                          {locLine2 && ','}
                        </div>
                        {locLine2 && (
                          <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                            {locLine2}
                          </div>
                        )}
                      </td>

                      {/* Magnitude */}
                      <td className="py-3.5 px-3 text-center font-bold text-blue-600 font-mono">
                        {record.magnitude.toFixed(1)}
                      </td>

                      {/* Depth */}
                      <td className="py-3.5 px-3 text-center text-slate-800 font-mono">
                        {record.depthKm}
                      </td>

                      {/* Province / Municipality */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 leading-tight">
                          {record.province || '—'}
                        </div>
                        <div className="text-[11px] text-slate-600 leading-tight mt-0.5">
                          {record.municipality || '—'}
                        </div>
                      </td>

                      {/* AOR */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isOutsideAor ? (
                          <span className="font-medium text-slate-500 text-xs">
                            Outside AOR
                          </span>
                        ) : (
                          <span className="font-semibold text-blue-600 text-xs">
                            {record.aor}
                          </span>
                        )}
                      </td>

                      {/* Alert Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {renderStatusPill(record.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectRecord(record)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors inline-flex items-center justify-center shadow-2xs cursor-pointer"
                            title="View event details in Alert X"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>
                          {record.bulletinUrl && (
                            <a
                              href={record.bulletinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors inline-flex items-center justify-center shadow-2xs"
                              title="Open official bulletin on earthquake.phivolcs.dost.gov.ph"
                            >
                              <ExternalLink className="w-4 h-4 text-emerald-600" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Informational Note Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl px-4 py-2.5 flex items-center gap-2.5 text-xs text-blue-700 font-medium">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          Final AOR classification uses valid earthquake coordinates and approved station boundaries.
        </span>
      </div>

      {/* 5. Table Bottom Action Bar & Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleClearFilters()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Right Pagination Controls */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows per page:</span>
            <div className="relative">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 rounded-md px-2.5 py-1 pr-6 text-xs font-medium text-slate-700 outline-none cursor-pointer hover:border-slate-300"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Range count */}
          <span className="font-medium text-slate-700">
            {totalItems === 0
              ? '0 of 0'
              : `${startIndex + 1}–${endIndex} of ${totalItems}`}
          </span>

          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            {/* First Page button */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                safeCurrentPage <= 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                  : 'border-slate-200 text-blue-600 hover:bg-slate-50 cursor-pointer'
              }`}
              title="First page"
              aria-label="First page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page button */}
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                safeCurrentPage <= 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                  : 'border-slate-200 text-blue-600 hover:bg-slate-50 cursor-pointer'
              }`}
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dynamic Page Number Buttons */}
            {getVisiblePageNumbers().map((p) => {
              const isActive = p === safeCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-xs cursor-default'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  title={`Page ${p}`}
                >
                  {p}
                </button>
              );
            })}

            {/* Next Page button */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                safeCurrentPage >= totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                  : 'border-slate-200 text-blue-600 hover:bg-slate-50 cursor-pointer'
              }`}
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page button */}
            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors ${
                safeCurrentPage >= totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50/50'
                  : 'border-slate-200 text-blue-600 hover:bg-slate-50 cursor-pointer'
              }`}
              title="Last page"
              aria-label="Last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
