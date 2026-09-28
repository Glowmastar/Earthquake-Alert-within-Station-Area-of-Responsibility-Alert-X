import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  MapPin,
  Waves,
  Copy,
  CheckCircle2,
  HelpCircle,
  Edit3,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Calendar,
  ChevronDown,
  FileText,
  Map,
  Users,
  Check,
  Ban,
  Download,
  X,
  Compass,
} from 'lucide-react';
import { EarthquakeRecord } from '../types';

export type ExceptionIssueType =
  | 'Boundary Event'
  | 'Offshore Event'
  | 'Duplicate Record'
  | 'Ambiguous Location'
  | 'Corrected Event';

export interface ExceptionItem {
  id: string; // e.g. "EX-2025-001"
  eventId: string; // e.g. "PHIVOLCS-2025-0423-0013"
  issueType: ExceptionIssueType;
  eqInfoLocation: string;
  coordinatesText: string;
  depthKm: number;
  lat: number;
  lng: number;
  relatedAOR: 'PCP' | 'BIP' | 'CGP' | 'None';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Review' | 'Resolved';
  originalEQInfoLocation: string;
  coordinateDerivedLocation: string;
  suggestedAOR: string;
  recommendedAction: string;
  reviewer: string;
  decisionNotes: string;
  lastUpdated: string;
  reviewZoneKm: number;
  magnitude: number;
}

const INITIAL_EXCEPTIONS: ExceptionItem[] = [
  {
    id: 'EX-2025-001',
    eventId: 'PHIVOLCS-2025-0423-0013',
    issueType: 'Boundary Event',
    eqInfoLocation: 'Dalupiri Island, Calayan',
    coordinatesText: '19.2° N, 121.9° E',
    depthKm: 10,
    lat: 19.2,
    lng: 121.9,
    relatedAOR: 'PCP',
    priority: 'High',
    status: 'Pending',
    originalEQInfoLocation: 'Dalupiri Island, Calayan',
    coordinateDerivedLocation: 'Calayan, Cagayan (within 15 km)',
    suggestedAOR: 'PCP (Based on coordinates)',
    recommendedAction: 'Assign to PCP and verify station coverage near boundary.',
    reviewer: 'Maria Santos',
    decisionNotes:
      'Event located near boundary between PCP and BIP. Coordinate check confirms within PCP. For final review.',
    lastUpdated: 'Apr 23, 2025 09:21 AM',
    reviewZoneKm: 50,
    magnitude: 4.8,
  },
  {
    id: 'EX-2025-002',
    eventId: 'PHIVOLCS-2025-0422-0097',
    issueType: 'Offshore Event',
    eqInfoLocation: 'Sarangani Island',
    coordinatesText: '5.0° N, 125.6° E',
    depthKm: 28,
    lat: 5.0,
    lng: 125.6,
    relatedAOR: 'BIP',
    priority: 'Medium',
    status: 'In Review',
    originalEQInfoLocation: 'Sarangani Island, Davao Occidental',
    coordinateDerivedLocation: 'Sarangani, Davao Occidental (within 12 km)',
    suggestedAOR: 'BIP (Based on coastal buffer)',
    recommendedAction: 'Validate offshore buffer threshold and notify BIP maritime monitors.',
    reviewer: 'Ramon Cruz',
    decisionNotes:
      'Event detected 18 km off the southern tip of Sarangani. Coastal buffer calculation qualifies for BIP boundary.',
    lastUpdated: 'Apr 22, 2025 04:45 PM',
    reviewZoneKm: 50,
    magnitude: 4.5,
  },
  {
    id: 'EX-2025-003',
    eventId: 'PHIVOLCS-2025-0422-0095',
    issueType: 'Duplicate Record',
    eqInfoLocation: 'Tandag, Surigao del Sur',
    coordinatesText: '9.1° N, 126.4° E',
    depthKm: 15,
    lat: 9.1,
    lng: 126.4,
    relatedAOR: 'BIP',
    priority: 'Low',
    status: 'Resolved',
    originalEQInfoLocation: 'Tandag, Surigao del Sur',
    coordinateDerivedLocation: 'Tandag City, Surigao del Sur',
    suggestedAOR: 'BIP (Primary)',
    recommendedAction: 'Merge with earlier telemetry feed #0093 and suppress second notification.',
    reviewer: 'Elena Reyes',
    decisionNotes:
      'Verified secondary automated report from auxiliary seismograph. Deduplicated and consolidated under primary BIP alert.',
    lastUpdated: 'Apr 22, 2025 02:10 PM',
    reviewZoneKm: 40,
    magnitude: 4.2,
  },
  {
    id: 'EX-2025-004',
    eventId: 'PHIVOLCS-2025-0421-0082',
    issueType: 'Ambiguous Location',
    eqInfoLocation: 'Philippine Sea',
    coordinatesText: '15.8° N, 130.2° E',
    depthKm: 35,
    lat: 15.8,
    lng: 130.2,
    relatedAOR: 'None',
    priority: 'High',
    status: 'Pending',
    originalEQInfoLocation: 'Philippine Sea (Deep oceanic basin)',
    coordinateDerivedLocation: 'Eastern Seaboard oceanic basin (>280 km offshore)',
    suggestedAOR: 'None (Regional trench solution)',
    recommendedAction: 'Confirm outside territorial AOR coverage and suppress national SMS broadcast.',
    reviewer: 'Maria Santos',
    decisionNotes:
      'Epicenter far beyond Philippine coastal monitoring perimeters. Requires senior seismologist sign-off.',
    lastUpdated: 'Apr 21, 2025 11:30 AM',
    reviewZoneKm: 80,
    magnitude: 5.3,
  },
  {
    id: 'EX-2025-005',
    eventId: 'PHIVOLCS-2025-0420-0064',
    issueType: 'Corrected Event',
    eqInfoLocation: 'Baganga, Davao Oriental',
    coordinatesText: '7.0° N, 126.1° E',
    depthKm: 22,
    lat: 7.0,
    lng: 126.1,
    relatedAOR: 'CGP',
    priority: 'Medium',
    status: 'Resolved',
    originalEQInfoLocation: 'Baganga, Davao Oriental',
    coordinateDerivedLocation: 'Baganga, Davao Oriental (refined epicentral solution)',
    suggestedAOR: 'CGP (Confirmed)',
    recommendedAction: 'Update magnitude from 4.9 to 5.1 and re-dispatch corrected bulletin to CGP network.',
    reviewer: 'Ramon Cruz',
    decisionNotes:
      'Manual relocation refined epicenter depth to 22 km and magnitude to 5.1. Corrected alert dispatched successfully.',
    lastUpdated: 'Apr 20, 2025 05:15 PM',
    reviewZoneKm: 45,
    magnitude: 5.1,
  },
];

interface ExceptionReviewViewProps {
  records?: EarthquakeRecord[];
  initialFilter?: string;
  onApprove?: (id: string) => void;
  onSelectRecord?: (record: EarthquakeRecord) => void;
  onOpenMap?: () => void;
  onOpenRecord?: (eventId: string) => void;
}

export const ExceptionReviewView: React.FC<ExceptionReviewViewProps> = ({
  records: _records,
  initialFilter,
  onApprove,
  onSelectRecord: _onSelectRecord,
  onOpenMap,
  onOpenRecord,
}) => {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(INITIAL_EXCEPTIONS);
  const [selectedId, setSelectedId] = useState<string>('EX-2025-001');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [exceptionTypeFilter, setExceptionTypeFilter] = useState(() => {
    if (initialFilter === 'OFFSHORE') return 'Offshore Event';
    if (initialFilter === 'BOUNDARY') return 'Boundary Event';
    return 'All Types';
  });

  React.useEffect(() => {
    if (initialFilter === 'OFFSHORE') {
      setExceptionTypeFilter('Offshore Event');
    } else if (initialFilter === 'BOUNDARY') {
      setExceptionTypeFilter('Boundary Event');
    } else if (initialFilter === 'ALL') {
      setExceptionTypeFilter('All Types');
    }
  }, [initialFilter]);
  const [stationFilter, setStationFilter] = useState('All Stations/AOR');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [dateRange, setDateRange] = useState('Apr 16, 2025 – Apr 23, 2025');
  const [isDatePresetsOpen, setIsDatePresetsOpen] = useState(false);

  // Modals & User Feedback
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignedReviewer, setAssignedReviewer] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const selectedItem = useMemo(() => {
    return exceptions.find((item) => item.id === selectedId) || exceptions[0];
  }, [exceptions, selectedId]);

  // Sync edited notes when selected item changes
  React.useEffect(() => {
    if (selectedItem) {
      setEditedNotes(selectedItem.decisionNotes);
      setIsEditingNotes(false);
    }
  }, [selectedItem?.id]);

  // Filtered Exceptions
  const filteredExceptions = useMemo(() => {
    return exceptions.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.id.toLowerCase().includes(q) ||
          item.eventId.toLowerCase().includes(q) ||
          item.eqInfoLocation.toLowerCase().includes(q) ||
          item.issueType.toLowerCase().includes(q) ||
          item.reviewer.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (exceptionTypeFilter !== 'All Types' && item.issueType !== exceptionTypeFilter) {
        return false;
      }
      if (stationFilter !== 'All Stations/AOR') {
        if (item.relatedAOR !== stationFilter) return false;
      }
      if (priorityFilter !== 'All Priorities' && item.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== 'All Status' && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [exceptions, searchQuery, exceptionTypeFilter, stationFilter, priorityFilter, statusFilter]);

  // Metrics (Matching values in screenshot: 12 (24%), 8 (16%), 6 (12%), 5 (10%), 19 (38%))
  const metrics = useMemo(() => {
    const pendingCount = 12;
    const boundaryCount = 8;
    const offshoreCount = 6;
    const duplicateCount = 5;
    const resolvedCount = 19;
    const total = 50;

    return {
      pending: { count: pendingCount, pct: ((pendingCount / total) * 100).toFixed(1) },
      boundary: { count: boundaryCount, pct: ((boundaryCount / total) * 100).toFixed(1) },
      offshore: { count: offshoreCount, pct: ((offshoreCount / total) * 100).toFixed(1) },
      duplicate: { count: duplicateCount, pct: ((duplicateCount / total) * 100).toFixed(1) },
      resolved: { count: resolvedCount, pct: ((resolvedCount / total) * 100).toFixed(1) },
    };
  }, []);

  const handleClearFilters = () => {
    setSearchQuery('');
    setExceptionTypeFilter('All Types');
    setStationFilter('All Stations/AOR');
    setPriorityFilter('All Priorities');
    setStatusFilter('All Status');
    setDateRange('Apr 16, 2025 – Apr 23, 2025');
    setIsDatePresetsOpen(false);
    showNotification('Filters reset to default.');
  };

  const handleApplyAOR = () => {
    if (!selectedItem) return;
    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: 'Resolved',
              lastUpdated: 'Apr 23, 2025 10:45 AM',
              decisionNotes: `${item.decisionNotes} [AOR ${item.suggestedAOR} applied and confirmed by operator].`,
            }
          : item
      )
    );
    if (onApprove) {
      onApprove(selectedItem.id);
    }
    showNotification(`AOR ${selectedItem.suggestedAOR} applied to ${selectedItem.id}. Record resolved.`);
  };

  const handleSuppressAlert = () => {
    if (!selectedItem) return;
    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: 'Resolved',
              lastUpdated: 'Apr 23, 2025 10:46 AM',
              decisionNotes: `${item.decisionNotes} [Alert delivery suppressed by operator].`,
            }
          : item
      )
    );
    showNotification(`Alert delivery for ${selectedItem.id} has been suppressed.`);
  };

  const handleMarkResolved = () => {
    if (!selectedItem) return;
    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              status: 'Resolved',
              lastUpdated: 'Apr 23, 2025 10:47 AM',
            }
          : item
      )
    );
    showNotification(`Exception ${selectedItem.id} marked as resolved.`);
  };

  const handleSaveNotes = () => {
    if (!selectedItem) return;
    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              decisionNotes: editedNotes,
              lastUpdated: 'Apr 23, 2025 10:48 AM',
            }
          : item
      )
    );
    setIsEditingNotes(false);
    showNotification(`Decision notes updated for ${selectedItem.id}.`);
  };

  const handleAssignReviewer = (reviewerName: string) => {
    if (!selectedItem) return;
    setExceptions((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? {
              ...item,
              reviewer: reviewerName,
              status: item.status === 'Pending' ? 'In Review' : item.status,
              lastUpdated: 'Apr 23, 2025 10:48 AM',
            }
          : item
      )
    );
    setIsAssignModalOpen(false);
    showNotification(`Assigned ${reviewerName} to review ${selectedItem.id}.`);
  };

  const handleExportExceptions = () => {
    const headers = [
      'Exception ID',
      'Event ID',
      'Issue Type',
      'Location',
      'Coordinates',
      'Related AOR',
      'Priority',
      'Status',
      'Reviewer',
      'Decision Notes',
      'Last Updated',
    ];
    const rows = filteredExceptions.map((e) => [
      `"${e.id}"`,
      `"${e.eventId}"`,
      `"${e.issueType}"`,
      `"${e.eqInfoLocation}"`,
      `"${e.coordinatesText}"`,
      `"${e.relatedAOR}"`,
      `"${e.priority}"`,
      `"${e.status}"`,
      `"${e.reviewer}"`,
      `"${e.decisionNotes.replace(/"/g, '""')}"`,
      `"${e.lastUpdated}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Exception_Review_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exception review dataset downloaded.');
  };

  // Helper for issue type badge with icon
  const renderIssueTypeBadge = (type: ExceptionIssueType) => {
    switch (type) {
      case 'Boundary Event':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Boundary Event</span>
          </span>
        );
      case 'Offshore Event':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
            <Waves className="w-3 h-3 text-teal-600 shrink-0" />
            <span>Offshore Event</span>
          </span>
        );
      case 'Duplicate Record':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Copy className="w-3 h-3 text-purple-600 shrink-0" />
            <span>Duplicate Record</span>
          </span>
        );
      case 'Ambiguous Location':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <HelpCircle className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Ambiguous Location</span>
          </span>
        );
      case 'Corrected Event':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Edit3 className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Corrected Event</span>
          </span>
        );
    }
  };

  // Helper for priority badge
  const renderPriorityBadge = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Low
          </span>
        );
    }
  };

  // Helper for status badge
  const renderStatusBadge = (status: 'Pending' | 'In Review' | 'Resolved') => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-200">
            Pending
          </span>
        );
      case 'In Review':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            In Review
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Resolved
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Row 1: Summary Metric KPI Cards (5 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Pending Review */}
        <button
          type="button"
          onClick={() => setStatusFilter('Pending')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-rose-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 fill-rose-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-rose-700">Pending Review</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-rose-600">{metrics.pending.count}</span>
              <span className="text-xs font-medium text-rose-500">({metrics.pending.pct}%)</span>
            </div>
          </div>
        </button>

        {/* Card 2: Boundary Events */}
        <button
          type="button"
          onClick={() => setExceptionTypeFilter('Boundary Event')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 fill-blue-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-blue-700">Boundary Events</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-blue-600">{metrics.boundary.count}</span>
              <span className="text-xs font-medium text-blue-500">({metrics.boundary.pct}%)</span>
            </div>
          </div>
        </button>

        {/* Card 3: Offshore Events */}
        <button
          type="button"
          onClick={() => setExceptionTypeFilter('Offshore Event')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-teal-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-teal-700">Offshore Events</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-teal-600">{metrics.offshore.count}</span>
              <span className="text-xs font-medium text-teal-500">({metrics.offshore.pct}%)</span>
            </div>
          </div>
        </button>

        {/* Card 4: Duplicate Records */}
        <button
          type="button"
          onClick={() => setExceptionTypeFilter('Duplicate Record')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-purple-700">Duplicate Records</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-purple-600">{metrics.duplicate.count}</span>
              <span className="text-xs font-medium text-purple-500">({metrics.duplicate.pct}%)</span>
            </div>
          </div>
        </button>

        {/* Card 5: Resolved */}
        <button
          type="button"
          onClick={() => setStatusFilter('Resolved')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-emerald-300 hover:shadow-sm transition-all col-span-2 md:col-span-1"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 fill-emerald-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-emerald-700">Resolved</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-emerald-600">{metrics.resolved.count}</span>
              <span className="text-xs font-medium text-emerald-500">({metrics.resolved.pct}%)</span>
            </div>
          </div>
        </button>
      </div>

      {/* Row 2: Search and Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        {/* Primary Row: Search, Date Range Filter, Action Buttons */}
        <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3">
          {/* Search exceptions */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Search exceptions
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Exception ID, Event ID, location..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Date Range Date Filter (Comfortable horizontal footprint with full range visibility) */}
          <div className="w-full md:w-[285px] shrink-0 relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700">Date Range</label>
              <button
                type="button"
                onClick={() => setIsDatePresetsOpen(!isDatePresetsOpen)}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Presets
              </button>
            </div>
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-blue-600 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                onClick={() => setIsDatePresetsOpen(true)}
                title={dateRange}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors cursor-pointer"
                placeholder="Select date range"
              />
              <button
                type="button"
                onClick={() => setIsDatePresetsOpen(!isDatePresetsOpen)}
                className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600"
                title="Choose Date Preset"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Presets popover menu */}
            {isDatePresetsOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsDatePresetsOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Date Range Presets
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {[
                      { label: 'Last 7 Days', range: 'Apr 16, 2025 – Apr 23, 2025' },
                      { label: 'Last 14 Days', range: 'Apr 09, 2025 – Apr 23, 2025' },
                      { label: 'Last 30 Days', range: 'Mar 24, 2025 – Apr 23, 2025' },
                      { label: 'Month to Date', range: 'Apr 01, 2025 – Apr 23, 2025' },
                      { label: 'Year to Date 2025', range: 'Jan 01, 2025 – Apr 23, 2025' },
                      { label: 'All Recorded Events', range: 'All Recorded Events' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setDateRange(preset.range);
                          setIsDatePresetsOpen(false);
                          showNotification(`Date range set to ${preset.label}.`);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          dateRange === preset.range
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {preset.range === 'All Recorded Events' ? 'All' : preset.range.split(' – ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Filter & Clear Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => showNotification('Filters updated.')}
              className="h-[38px] px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-[38px] px-3.5 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Facet Dropdowns Row: Exception Type, Station/AOR, Priority, Status */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-slate-100">
          {/* Exception Type Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Exception Type
            </label>
            <select
              value={exceptionTypeFilter}
              onChange={(e) => setExceptionTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Types</option>
              <option>Boundary Event</option>
              <option>Offshore Event</option>
              <option>Duplicate Record</option>
              <option>Ambiguous Location</option>
              <option>Corrected Event</option>
            </select>
          </div>

          {/* Station/AOR Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Station/AOR
            </label>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Stations/AOR</option>
              <option>PCP</option>
              <option>BIP</option>
              <option>CGP</option>
              <option>None</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Priorities</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Status</option>
              <option>Pending</option>
              <option>In Review</option>
              <option>Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 3: Exceptions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blue-50/50 border-b border-slate-200 text-slate-700 font-semibold select-none">
                <th className="py-2.5 px-3 whitespace-nowrap">Exception ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Event ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Issue Type</th>
                <th className="py-2.5 px-3 whitespace-nowrap">EQInfo Location</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Coordinates</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Related AOR</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Priority</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExceptions.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100/70 border-l-4 border-l-blue-600 font-medium'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    {/* Exception ID */}
                    <td className="py-2.5 px-3 font-semibold text-blue-600 whitespace-nowrap">
                      {item.id}
                    </td>

                    {/* Event ID */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {item.eventId}
                    </td>

                    {/* Issue Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {renderIssueTypeBadge(item.issueType)}
                    </td>

                    {/* EQInfo Location */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-800">
                      {item.eqInfoLocation}
                    </td>

                    {/* Coordinates */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {item.coordinatesText}
                    </td>

                    {/* Related AOR */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-700">
                      {item.relatedAOR}
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {renderPriorityBadge(item.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {renderStatusBadge(item.status)}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(item.id);
                          if (onOpenRecord) {
                            onOpenRecord(item.eventId);
                          }
                        }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 4: Split Lower Section (Exception Details Left + Geographic Context Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Panel: Exception Details (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with blue accent bar */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
              <h2 className="text-base font-bold text-slate-900">Exception Details</h2>
            </div>

            {/* 2-Column Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-3.5 gap-x-4 text-xs">
              {/* Left Column (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Exception ID
                  </span>
                  <span className="font-bold text-slate-800 text-sm">{selectedItem.id}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">Event ID</span>
                  <span className="font-mono text-slate-700">{selectedItem.eventId}</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Issue Type
                  </span>
                  {renderIssueTypeBadge(selectedItem.issueType)}
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Original EQInfo Location
                  </span>
                  <span className="text-slate-800 font-medium">
                    {selectedItem.originalEQInfoLocation}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Coordinates
                  </span>
                  <span className="font-mono text-slate-800">
                    {selectedItem.coordinatesText} (Depth: {selectedItem.depthKm} km)
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Coordinate-Derived Location
                  </span>
                  <span className="text-slate-800 font-medium">
                    {selectedItem.coordinateDerivedLocation}
                  </span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Suggested AOR
                  </span>
                  <span className="font-semibold text-blue-600">
                    {selectedItem.suggestedAOR}
                  </span>
                </div>
              </div>

              {/* Right Column (7 cols) */}
              <div className="md:col-span-7 space-y-3">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">
                    Recommended Action
                  </span>
                  <p className="text-slate-800 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedItem.recommendedAction}
                  </p>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500">Reviewer</span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{selectedItem.reviewer}</span>
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Decision Notes */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-500">Decision Notes</span>
                    {!isEditingNotes ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(true)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit Notes
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveNotes}
                          className="text-[11px] text-emerald-600 font-bold hover:underline"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditedNotes(selectedItem.decisionNotes);
                            setIsEditingNotes(false);
                          }}
                          className="text-[11px] text-slate-400 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditingNotes ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 text-xs bg-white border border-blue-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                    />
                  ) : (
                    <div className="bg-blue-50/50 border border-blue-200/80 rounded-lg p-3 text-xs text-slate-700 leading-relaxed font-normal">
                      {selectedItem.decisionNotes}
                    </div>
                  )}

                  <span className="block text-[10px] text-slate-400 mt-1.5 text-right">
                    Last updated: {selectedItem.lastUpdated}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Geographic Context Map (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with blue accent bar */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
              <h2 className="text-base font-bold text-slate-900">Geographic Context</h2>
            </div>

            {/* Satellite / Oceanic Style Map Box */}
            <div className="relative w-full h-[270px] rounded-xl overflow-hidden bg-[#07192f] border border-slate-700 shadow-inner select-none">
              {/* Compass Rose (North Arrow) */}
              <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-center bg-slate-900/75 px-1.5 py-1 rounded-md border border-slate-700/60 backdrop-blur-xs text-[10px] font-bold text-white">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span className="leading-none text-[9px] mt-0.5">N</span>
              </div>

              {/* Floating Map Legend (Top-Right) */}
              <div className="absolute top-2.5 right-2.5 z-10 bg-slate-900/85 backdrop-blur-xs p-2 rounded-lg border border-slate-700/80 text-[10px] text-slate-200 space-y-1 shadow-md">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-600 border border-white flex items-center justify-center text-[7px] font-black text-white">
                    ★
                  </span>
                  <span>Epicenter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 bg-cyan-400 inline-block rounded-full shadow-[0_0_4px_#22d3ee]" />
                  <span>AOR Boundary ({selectedItem.relatedAOR !== 'None' ? selectedItem.relatedAOR : 'Region'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-0.5 border-t border-dashed border-rose-500 inline-block" />
                  <span>Review Zone ({selectedItem.reviewZoneKm} km)</span>
                </div>
              </div>

              {/* Interactive SVG Rendering tailored to Selected Item */}
              <svg className="w-full h-full" viewBox="0 0 420 280">
                <defs>
                  {/* Subtle Grid Pattern for Maritime GIS coordinates */}
                  <pattern id="gis-grid" width="35" height="35" patternUnits="userSpaceOnUse">
                    <path
                      d="M 35 0 L 0 0 0 35"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="0.5"
                      strokeOpacity="0.4"
                    />
                  </pattern>

                  {/* Radial Gradient for Epicenter Pulse */}
                  <radialGradient id="pulse-grad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                    <stop offset="60%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ocean Background & Grid */}
                <rect width="420" height="280" fill="#07192f" />
                <rect width="420" height="280" fill="url(#gis-grid)" />

                {/* Coastal / Island Landmasses (adapted to selected location) */}
                {selectedItem.id === 'EX-2025-001' ? (
                  // Dalupiri Island, Calayan (PCP Zone)
                  <g>
                    {/* Northern Luzon Mainland (Southern portion of map) */}
                    <path
                      d="M 240,280 Q 280,240 330,220 T 420,200 L 420,280 Z"
                      fill="#1e3a29"
                      stroke="#2d5a3f"
                      strokeWidth="1.5"
                    />
                    {/* Calayan Island */}
                    <path
                      d="M 285,145 Q 315,130 335,150 T 320,185 T 280,175 Z"
                      fill="#264e36"
                      stroke="#3b7a54"
                      strokeWidth="1.5"
                    />
                    {/* Dalupiri Island */}
                    <path
                      d="M 175,140 Q 185,130 190,145 T 180,165 T 168,155 Z"
                      fill="#22422f"
                      stroke="#3b7a54"
                      strokeWidth="1.2"
                    />
                    {/* Camiguin de Babuyanes */}
                    <path
                      d="M 370,160 Q 385,150 395,165 T 385,185 Z"
                      fill="#22422f"
                      stroke="#3b7a54"
                      strokeWidth="1"
                    />

                    {/* AOR Boundary Polygon (PCP) in bright cyan glow */}
                    <polygon
                      points="230,110 370,105 400,210 260,250 210,180"
                      fill="#06b6d4"
                      fillOpacity="0.15"
                      stroke="#00e5ff"
                      strokeWidth="2"
                      strokeDasharray="none"
                    />

                    {/* 50 km Review Zone around Epicenter */}
                    <circle
                      cx="178"
                      cy="150"
                      r="48"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    <circle cx="178" cy="150" r="48" fill="url(#pulse-grad)" />

                    {/* Calayan (PCP) Station Marker */}
                    <circle cx="310" cy="158" r="5" fill="#00e5ff" />
                    <circle cx="310" cy="158" r="9" fill="none" stroke="#00e5ff" strokeWidth="1" />
                    <text
                      x="310"
                      y="180"
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      Calayan
                    </text>
                    <text
                      x="310"
                      y="192"
                      textAnchor="middle"
                      fill="#38bdf8"
                      fontSize="9"
                      fontWeight="600"
                    >
                      (PCP)
                    </text>

                    {/* Epicenter Marker (Red Star) */}
                    <circle cx="178" cy="150" r="12" fill="#ef4444" fillOpacity="0.3" />
                    <circle cx="178" cy="150" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      x="178"
                      y="153"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ★
                    </text>
                    <circle cx="168" cy="160" r="2" fill="#ffffff" />
                    <text
                      x="160"
                      y="140"
                      textAnchor="end"
                      fill="#f87171"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      Dalupiri
                    </text>
                    <text
                      x="160"
                      y="152"
                      textAnchor="end"
                      fill="#cbd5e1"
                      fontSize="9"
                      fontWeight="500"
                    >
                      Island
                    </text>
                  </g>
                ) : (
                  // Dynamic generic maritime plot for other selected events
                  <g>
                    {/* Landmass contour */}
                    <path
                      d="M 40,280 Q 90,180 150,140 T 260,70 L 320,0 L 0,0 L 0,280 Z"
                      fill="#1e3a29"
                      stroke="#2d5a3f"
                      strokeWidth="1.5"
                    />

                    {/* Station AOR boundary */}
                    <polygon
                      points="120,60 280,40 330,190 190,230 100,160"
                      fill="#06b6d4"
                      fillOpacity="0.15"
                      stroke="#00e5ff"
                      strokeWidth="2"
                    />

                    {/* Review Zone around epicenter */}
                    <circle
                      cx="230"
                      cy="130"
                      r="45"
                      fill="url(#pulse-grad)"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />

                    {/* Station Pin */}
                    <circle cx="160" cy="100" r="5" fill="#00e5ff" />
                    <circle cx="160" cy="100" r="9" fill="none" stroke="#00e5ff" strokeWidth="1" />
                    <text
                      x="160"
                      y="120"
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {selectedItem.relatedAOR !== 'None' ? selectedItem.relatedAOR : 'REG'} Station
                    </text>

                    {/* Epicenter Marker */}
                    <circle cx="230" cy="130" r="8" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      x="230"
                      y="133"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      ★
                    </text>
                    <text
                      x="230"
                      y="155"
                      textAnchor="middle"
                      fill="#fca5a5"
                      fontSize="10"
                      fontWeight="bold"
                    >
                      {selectedItem.eqInfoLocation.split(',')[0]}
                    </text>
                  </g>
                )}

                {/* Scale Bar (Bottom Right) */}
                <g transform="translate(310, 255)">
                  <rect x="0" y="8" width="80" height="3" fill="#ffffff" />
                  <rect x="0" y="8" width="20" height="3" fill="#0f172a" />
                  <rect x="40" y="8" width="20" height="3" fill="#0f172a" />
                  <text x="0" y="5" fill="#e2e8f0" fontSize="8" textAnchor="middle">
                    0
                  </text>
                  <text x="20" y="5" fill="#e2e8f0" fontSize="8" textAnchor="middle">
                    25
                  </text>
                  <text x="40" y="5" fill="#e2e8f0" fontSize="8" textAnchor="middle">
                    50
                  </text>
                  <text x="80" y="5" fill="#e2e8f0" fontSize="8" textAnchor="middle">
                    100 km
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Bottom Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Side Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Open Record */}
          <button
            type="button"
            onClick={() => {
              if (onOpenRecord) {
                onOpenRecord(selectedItem.eventId);
              } else {
                showNotification(`Opened full event log for ${selectedItem.eventId}`);
              }
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Record</span>
          </button>

          {/* Open Map */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMap) {
                onOpenMap();
              } else {
                showNotification('Opening AOR Map Station Boundaries...');
              }
            }}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Map className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Map</span>
          </button>

          {/* Assign Reviewer */}
          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Assign Reviewer</span>
          </button>
        </div>

        {/* Middle & Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Apply AOR (Solid Blue) */}
          <button
            type="button"
            onClick={handleApplyAOR}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply AOR</span>
          </button>

          {/* Suppress Alert (White with Red Border) */}
          <button
            type="button"
            onClick={handleSuppressAlert}
            className="px-3.5 py-1.5 rounded-lg border border-rose-500 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Suppress Alert</span>
          </button>

          {/* Mark Resolved (White with Green Border) */}
          <button
            type="button"
            onClick={handleMarkResolved}
            className="px-3.5 py-1.5 rounded-lg border border-emerald-500 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Resolved</span>
          </button>

          <span className="h-5 w-px bg-slate-200 mx-1 hidden sm:inline-block" />

          {/* Export Exceptions */}
          <button
            type="button"
            onClick={handleExportExceptions}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Exceptions</span>
          </button>
        </div>
      </div>

      {/* Assign Reviewer Modal Dialog */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Assign Reviewer for {selectedItem.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Select a qualified seismology analyst or GIS engineer to review this exception record:
              </p>

              <div className="space-y-2">
                {[
                  { name: 'Maria Santos', role: 'Lead Geospatial Analyst (PCP Sector)' },
                  { name: 'Ramon Cruz', role: 'Senior Geodetic Engineer (BIP / CGP)' },
                  { name: 'Elena Reyes', role: 'Data Quality & Telemetry Specialist' },
                  { name: 'David Tan', role: 'On-duty Seismologist (Night Shift)' },
                ].map((member) => (
                  <label
                    key={member.name}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      (assignedReviewer || selectedItem.reviewer) === member.name
                        ? 'border-blue-500 bg-blue-50/60'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reviewer-select"
                      checked={(assignedReviewer || selectedItem.reviewer) === member.name}
                      onChange={() => setAssignedReviewer(member.name)}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="block text-xs font-bold text-slate-800">
                        {member.name}
                      </span>
                      <span className="block text-[11px] text-slate-500">{member.role}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleAssignReviewer(assignedReviewer || selectedItem.reviewer)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
