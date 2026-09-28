import React, { useState, useMemo } from 'react';
import {
  FileText,
  Send,
  AlertTriangle,
  Info,
  X,
  Search,
  Calendar,
  Filter,
  RotateCcw,
  Eye,
  Map,
  Download,
  Printer,
  ChevronDown,
} from 'lucide-react';

export type AuditActivityType =
  | 'Alert Sent'
  | 'AOR Classification'
  | 'Duplicate Suppressed'
  | 'Manual Review'
  | 'Recipient Updated';

export type AuditDecision =
  | 'Inside AOR'
  | 'Boundary Review'
  | 'Outside AOR'
  | 'Offshore Event'
  | 'Configuration';

export type AuditDeliveryStatus = 'Success' | 'Held' | 'Failed' | 'N/A';

export interface TimelineStep {
  time: string;
  action: string;
  description: string;
  status: 'completed' | 'current';
}

export interface AuditRecordItem {
  id: string; // e.g. AL-2025-001
  timestamp: string; // e.g. Apr 23, 2025 08:14 AM
  sourceTime: string; // e.g. Apr 23, 2025 08:12 AM (PST)
  processingTime: string; // e.g. Apr 23, 2025 08:14 AM (PST)
  eventId: string; // e.g. PHIVOLCS-2025-0423-0013
  activityType: AuditActivityType;
  stationCode: string; // e.g. PCP, BIP, CGP, None, QVP
  stationName: string; // e.g. Palayan Seismic Station
  decision: AuditDecision;
  decisionReason: string;
  recipientName: string; // e.g. Wilmer A. Legaspi
  recipientRole?: string; // e.g. PCP Station Personnel
  deliveryStatus: AuditDeliveryStatus;
  performedBy: string; // e.g. System, Maria Santos, Administrator
  originalLocation: string; // e.g. 14 km N of Mabini, Batangas
  coordinates: string; // e.g. 13.7770° N, 120.9000° E
  parsedLocation: string; // e.g. Mabini, Batangas
  coordinateDerivedLocation: string; // e.g. Mabini, Batangas
  boundaryDatasetVersion: string; // e.g. v2025.04.01
  timeline: TimelineStep[];
}

const INITIAL_AUDIT_RECORDS: AuditRecordItem[] = [
  {
    id: 'AL-2025-001',
    timestamp: 'Apr 23, 2025 08:14 AM',
    sourceTime: 'Apr 23, 2025 08:12 AM (PST)',
    processingTime: 'Apr 23, 2025 08:14 AM (PST)',
    eventId: 'PHIVOLCS-2025-0423-0013',
    activityType: 'Alert Sent',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    decision: 'Inside AOR',
    decisionReason: 'Event located within PCP AOR (boundary v2025.04.01)',
    recipientName: 'Wilmer A. Legaspi',
    recipientRole: 'PCP Station Personnel',
    deliveryStatus: 'Success',
    performedBy: 'System',
    originalLocation: '14 km N of Mabini, Batangas',
    coordinates: '13.7770° N, 120.9000° E',
    parsedLocation: 'Mabini, Batangas',
    coordinateDerivedLocation: 'Mabini, Batangas',
    boundaryDatasetVersion: 'v2025.04.01',
    timeline: [
      { time: '08:12 AM', action: 'Retrieved', description: 'Event data retrieved from EQInfo feed', status: 'completed' },
      { time: '08:12 AM', action: 'Validated', description: 'Event passed initial validation checks', status: 'completed' },
      { time: '08:13 AM', action: 'Classified', description: 'Location classified within PCP AOR', status: 'completed' },
      { time: '08:13 AM', action: 'Decision Made', description: 'Alert approved for PCP (Inside AOR)', status: 'completed' },
      { time: '08:14 AM', action: 'Alert Sent', description: 'Email delivered to Wilmer A. Legaspi', status: 'current' },
    ],
  },
  {
    id: 'AL-2025-002',
    timestamp: 'Apr 23, 2025 07:52 AM',
    sourceTime: 'Apr 23, 2025 07:48 AM (PST)',
    processingTime: 'Apr 23, 2025 07:52 AM (PST)',
    eventId: 'PHIVOLCS-2025-0423-0012',
    activityType: 'AOR Classification',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    decision: 'Boundary Review',
    decisionReason: 'Epicenter lies within 15 km buffer of BIP/CGP dividing perimeter',
    recipientName: 'None',
    recipientRole: 'Unassigned',
    deliveryStatus: 'Held',
    performedBy: 'Maria Santos',
    originalLocation: '22 km E of Hinatuan, Surigao del Sur',
    coordinates: '8.3600° N, 126.5400° E',
    parsedLocation: 'Hinatuan, Surigao del Sur',
    coordinateDerivedLocation: 'Hinatuan, Surigao del Sur',
    boundaryDatasetVersion: 'v2025.04.01',
    timeline: [
      { time: '07:48 AM', action: 'Retrieved', description: 'Event data retrieved from EQInfo feed', status: 'completed' },
      { time: '07:49 AM', action: 'Validated', description: 'Event passed initial validation checks', status: 'completed' },
      { time: '07:50 AM', action: 'Border Flag', description: 'Spatial intersection detected across BIP/CGP boundary', status: 'completed' },
      { time: '07:52 AM', action: 'Held for Review', description: 'Automated alert suppressed pending operator review', status: 'current' },
    ],
  },
  {
    id: 'AL-2025-003',
    timestamp: 'Apr 23, 2025 07:34 AM',
    sourceTime: 'Apr 23, 2025 07:30 AM (PST)',
    processingTime: 'Apr 23, 2025 07:34 AM (PST)',
    eventId: 'PHIVOLCS-2025-0423-0011',
    activityType: 'Alert Sent',
    stationCode: 'CGP',
    stationName: 'Cagayan de Oro Seismic Station',
    decision: 'Inside AOR',
    decisionReason: 'Event confirmed inside CGP AOR. SMTP handshake timed out with mail relay.',
    recipientName: 'Mark Louegie Juarbal',
    recipientRole: 'CGP Station Personnel',
    deliveryStatus: 'Failed',
    performedBy: 'System',
    originalLocation: '08 km SW of Claveria, Misamis Oriental',
    coordinates: '8.5800° N, 124.8500° E',
    parsedLocation: 'Claveria, Misamis Oriental',
    coordinateDerivedLocation: 'Claveria, Misamis Oriental',
    boundaryDatasetVersion: 'v2025.04.01',
    timeline: [
      { time: '07:30 AM', action: 'Retrieved', description: 'Event data retrieved from EQInfo feed', status: 'completed' },
      { time: '07:31 AM', action: 'Validated', description: 'Event passed initial validation checks', status: 'completed' },
      { time: '07:32 AM', action: 'Classified', description: 'Location confirmed inside CGP AOR', status: 'completed' },
      { time: '07:34 AM', action: 'Delivery Failed', description: 'SMTP timeout on primary mail gateway: connection reset', status: 'current' },
    ],
  },
  {
    id: 'AL-2025-004',
    timestamp: 'Apr 22, 2025 11:18 PM',
    sourceTime: 'Apr 22, 2025 11:15 PM (PST)',
    processingTime: 'Apr 22, 2025 11:18 PM (PST)',
    eventId: 'PHIVOLCS-2025-0422-0098',
    activityType: 'Duplicate Suppressed',
    stationCode: 'None',
    stationName: 'Outside Station Network',
    decision: 'Outside AOR',
    decisionReason: 'Epicenter outside Philippine territory; automatic suppression triggered',
    recipientName: 'None',
    recipientRole: 'None',
    deliveryStatus: 'N/A',
    performedBy: 'System',
    originalLocation: '185 km NW of Pag-asa Island, Kalayaan',
    coordinates: '11.8500° N, 112.9200° E',
    parsedLocation: 'West Philippine Sea',
    coordinateDerivedLocation: 'Offshore International Waters',
    boundaryDatasetVersion: 'v2025.04.01',
    timeline: [
      { time: '11:15 PM', action: 'Retrieved', description: 'Event data retrieved from EQInfo feed', status: 'completed' },
      { time: '11:16 PM', action: 'Analyzed', description: 'Epicenter evaluated against active AOR polygons', status: 'completed' },
      { time: '11:18 PM', action: 'Suppressed', description: 'Outside all station jurisdictions: alerts silenced', status: 'current' },
    ],
  },
  {
    id: 'AL-2025-005',
    timestamp: 'Apr 22, 2025 09:21 PM',
    sourceTime: 'Apr 22, 2025 09:16 PM (PST)',
    processingTime: 'Apr 22, 2025 09:21 PM (PST)',
    eventId: 'PHIVOLCS-2025-0422-0097',
    activityType: 'Manual Review',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    decision: 'Offshore Event',
    decisionReason: 'Epicenter in Philippine Trench 48 km offshore. Flagged for manual review.',
    recipientName: 'None',
    recipientRole: 'None',
    deliveryStatus: 'Held',
    performedBy: 'Maria Santos',
    originalLocation: '48 km NE of Tandag, Surigao del Sur',
    coordinates: '9.3100° N, 126.5100° E',
    parsedLocation: 'Tandag, Surigao del Sur (Offshore)',
    coordinateDerivedLocation: 'Philippine Sea Trench',
    boundaryDatasetVersion: 'v2025.04.01',
    timeline: [
      { time: '09:16 PM', action: 'Retrieved', description: 'Event data retrieved from EQInfo feed', status: 'completed' },
      { time: '09:18 PM', action: 'Flagged', description: 'Offshore seismic event detected in oceanic trench', status: 'completed' },
      { time: '09:21 PM', action: 'Held for Operator', description: 'Assigned to Maria Santos for manual inspection', status: 'current' },
    ],
  },
  {
    id: 'AL-2025-006',
    timestamp: 'Apr 22, 2025 07:45 PM',
    sourceTime: 'Apr 22, 2025 07:40 PM (PST)',
    processingTime: 'Apr 22, 2025 07:45 PM (PST)',
    eventId: 'PHIVOLCS-2025-0422-0095',
    activityType: 'Recipient Updated',
    stationCode: 'QVP',
    stationName: 'Main Office',
    decision: 'Configuration',
    decisionReason: 'Administrative email routing preference updated to All AOR Alerts',
    recipientName: 'Glyn Bryan Ebardo',
    recipientRole: 'Administrative Recipient',
    deliveryStatus: 'N/A',
    performedBy: 'Administrator',
    originalLocation: 'PHIVOLCS Central Office, Quezon City',
    coordinates: '14.6537° N, 121.0685° E',
    parsedLocation: 'Diliman, Quezon City',
    coordinateDerivedLocation: 'Quezon City, Metro Manila',
    boundaryDatasetVersion: 'v2025.04.01',
    timeline: [
      { time: '07:40 PM', action: 'Config Requested', description: 'Admin initiated recipient profile edit', status: 'completed' },
      { time: '07:42 PM', action: 'Verified', description: 'Admin authentication validated via security credentials', status: 'completed' },
      { time: '07:45 PM', action: 'Saved', description: 'Recipient alert scope changed to All AOR Alerts', status: 'current' },
    ],
  },
];

interface AuditLogViewProps {
  onOpenEvent?: (eventId: string) => void;
  onOpenMap?: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ onOpenEvent, onOpenMap }) => {
  const [records] = useState<AuditRecordItem[]>(INITIAL_AUDIT_RECORDS);
  const [selectedId, setSelectedId] = useState<string>('AL-2025-001');
  const [bannerVisible, setBannerVisible] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('Apr 20, 2025 - Apr 23, 2025');
  const [eventTypeFilter, setEventTypeFilter] = useState('All Types');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [decisionFilter, setDecisionFilter] = useState('All Decisions');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('All Statuses');
  const [userFilter, setUserFilter] = useState('All Users');

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const selectedRecord = useMemo(() => {
    return records.find((r) => r.id === selectedId) || records[0];
  }, [records, selectedId]);

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.id.toLowerCase().includes(q) ||
          r.eventId.toLowerCase().includes(q) ||
          r.recipientName.toLowerCase().includes(q) ||
          r.performedBy.toLowerCase().includes(q) ||
          r.stationCode.toLowerCase().includes(q) ||
          r.originalLocation.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (eventTypeFilter !== 'All Types' && r.activityType !== eventTypeFilter) {
        return false;
      }
      if (stationFilter !== 'All Stations' && r.stationCode !== stationFilter) {
        return false;
      }
      if (decisionFilter !== 'All Decisions' && r.decision !== decisionFilter) {
        return false;
      }
      if (deliveryStatusFilter !== 'All Statuses' && r.deliveryStatus !== deliveryStatusFilter) {
        return false;
      }
      if (userFilter !== 'All Users' && r.performedBy !== userFilter) {
        return false;
      }
      return true;
    });
  }, [
    records,
    searchQuery,
    eventTypeFilter,
    stationFilter,
    decisionFilter,
    deliveryStatusFilter,
    userFilter,
  ]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateRange('Apr 20, 2025 - Apr 23, 2025');
    setEventTypeFilter('All Types');
    setStationFilter('All Stations');
    setDecisionFilter('All Decisions');
    setDeliveryStatusFilter('All Statuses');
    setUserFilter('All Users');
    showNotification('Audit filters reset.');
  };

  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Audit ID',
      'Event ID',
      'Activity Type',
      'AOR/Station',
      'Decision',
      'Recipient',
      'Delivery Status',
      'Performed By',
      'Location',
      'Coordinates',
      'Decision Reason',
    ];
    const rows = filteredRecords.map((r) => [
      `"${r.timestamp}"`,
      `"${r.id}"`,
      `"${r.eventId}"`,
      `"${r.activityType}"`,
      `"${r.stationCode}"`,
      `"${r.decision}"`,
      `"${r.recipientName}"`,
      `"${r.deliveryStatus}"`,
      `"${r.performedBy}"`,
      `"${r.originalLocation}"`,
      `"${r.coordinates}"`,
      `"${r.decisionReason}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Audit records exported to CSV.');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-8 relative select-none">
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

      {/* Row 1: KPI Summary Cards (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Audit Entries */}
        <button
          type="button"
          onClick={() => handleClearFilters()}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 fill-blue-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-blue-700">Total Audit Entries</span>
            <span className="text-3xl font-bold text-blue-600 mt-0.5 block leading-tight">
              320
            </span>
          </div>
        </button>

        {/* Card 2: Alerts Sent */}
        <button
          type="button"
          onClick={() => setEventTypeFilter('Alert Sent')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 fill-emerald-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-emerald-700">Alerts Sent</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-emerald-600 leading-tight">146</span>
              <span className="text-xs font-medium text-slate-700">(45.6%)</span>
            </div>
          </div>
        </button>

        {/* Card 3: Decisions for Review */}
        <button
          type="button"
          onClick={() => setDecisionFilter('Boundary Review')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 fill-amber-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-amber-700">Decisions for Review</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-amber-600 leading-tight">78</span>
              <span className="text-xs font-medium text-slate-700">(24.4%)</span>
            </div>
          </div>
        </button>

        {/* Card 4: Failed Deliveries */}
        <button
          type="button"
          onClick={() => setDeliveryStatusFilter('Failed')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-rose-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 fill-rose-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-rose-700">Failed Deliveries</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-rose-600 leading-tight">12</span>
              <span className="text-xs font-medium text-rose-500">(3.8%)</span>
            </div>
          </div>
        </button>
      </div>

      {/* Row 2: Notice Banner */}
      {bannerVisible && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <span className="font-normal text-blue-900">
              Audit records are immutable and preserve the decision reason, processing timestamp, boundary dataset version, recipient, and delivery result.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className="text-blue-500 hover:text-blue-800 p-1 rounded-md transition-colors shrink-0"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 3: Search and Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
        {/* Top filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Search audit entries */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Search audit entries
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Audit ID, Event ID, user..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Date range */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date range</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Event Type */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Types</option>
              <option>Alert Sent</option>
              <option>AOR Classification</option>
              <option>Duplicate Suppressed</option>
              <option>Manual Review</option>
              <option>Recipient Updated</option>
            </select>
          </div>

          {/* Station/AOR */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Station/AOR</label>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Stations</option>
              <option>PCP</option>
              <option>BIP</option>
              <option>CGP</option>
              <option>QVP</option>
              <option>None</option>
            </select>
          </div>

          {/* Decision */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Decision</label>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Decisions</option>
              <option>Inside AOR</option>
              <option>Boundary Review</option>
              <option>Outside AOR</option>
              <option>Offshore Event</option>
              <option>Configuration</option>
            </select>
          </div>

          {/* Filter & Clear Action Buttons */}
          <div className="lg:col-span-1 flex items-center gap-1.5 justify-end">
            <button
              type="button"
              onClick={() => showNotification('Audit filters applied.')}
              className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-8 px-2.5 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Second filter row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
          {/* Delivery Status */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Delivery Status
            </label>
            <select
              value={deliveryStatusFilter}
              onChange={(e) => setDeliveryStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Statuses</option>
              <option>Success</option>
              <option>Held</option>
              <option>Failed</option>
              <option>N/A</option>
            </select>
          </div>

          {/* User */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">User</label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Users</option>
              <option>System</option>
              <option>Maria Santos</option>
              <option>Administrator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Row 4: Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blue-50/50 border-b border-slate-200 text-slate-700 font-semibold select-none">
                <th className="py-2.5 px-3 whitespace-nowrap">Timestamp ↓</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Audit ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Event ID</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Activity Type</th>
                <th className="py-2.5 px-3 whitespace-nowrap">AOR/Station</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Decision</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Recipient</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Delivery Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Performed By</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((item) => {
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
                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-blue-600 font-medium whitespace-nowrap">
                      {item.timestamp}
                    </td>

                    {/* Audit ID */}
                    <td className="py-2.5 px-3 font-bold text-blue-600 whitespace-nowrap">
                      {item.id}
                    </td>

                    {/* Event ID */}
                    <td className="py-2.5 px-3 font-medium text-blue-600 whitespace-nowrap">
                      {item.eventId}
                    </td>

                    {/* Activity Type */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.activityType === 'Alert Sent' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                          Alert Sent
                        </span>
                      )}
                      {item.activityType === 'AOR Classification' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          AOR Classification
                        </span>
                      )}
                      {item.activityType === 'Duplicate Suppressed' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                          Duplicate Suppressed
                        </span>
                      )}
                      {item.activityType === 'Manual Review' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Manual Review
                        </span>
                      )}
                      {item.activityType === 'Recipient Updated' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                          Recipient Updated
                        </span>
                      )}
                    </td>

                    {/* AOR/Station */}
                    <td className="py-2.5 px-3 font-bold text-blue-600 whitespace-nowrap">
                      {item.stationCode}
                    </td>

                    {/* Decision */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.decision === 'Inside AOR' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Inside AOR
                        </span>
                      )}
                      {item.decision === 'Boundary Review' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Boundary Review
                        </span>
                      )}
                      {item.decision === 'Outside AOR' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          Outside AOR
                        </span>
                      )}
                      {item.decision === 'Offshore Event' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          Offshore Event
                        </span>
                      )}
                      {item.decision === 'Configuration' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                          Configuration
                        </span>
                      )}
                    </td>

                    {/* Recipient */}
                    <td className="py-2.5 px-3 text-blue-600 whitespace-nowrap font-medium">
                      {item.recipientName}
                    </td>

                    {/* Delivery Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.deliveryStatus === 'Success' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Success
                        </span>
                      )}
                      {item.deliveryStatus === 'Held' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Held
                        </span>
                      )}
                      {item.deliveryStatus === 'Failed' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                          Failed
                        </span>
                      )}
                      {item.deliveryStatus === 'N/A' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          N/A
                        </span>
                      )}
                    </td>

                    {/* Performed By */}
                    <td className="py-2.5 px-3 text-blue-600 whitespace-nowrap font-medium">
                      {item.performedBy}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(item.id);
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

      {/* Row 5: Split Lower Section (Selected Audit Entry Details Left + Event Processing Timeline Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Panel: Selected Audit Entry Details (~7 cols / 58%) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with blue vertical accent bar */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
              <h2 className="text-base font-bold text-slate-900">Selected Audit Entry Details</h2>
            </div>

            {/* 2-Column Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs">
              {/* Left Column Fields */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Audit ID</span>
                  <span className="col-span-7 font-bold text-blue-600">{selectedRecord.id}</span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Event ID</span>
                  <span className="col-span-7 font-medium text-blue-600">{selectedRecord.eventId}</span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Source Time</span>
                  <span className="col-span-7 text-slate-800 font-medium">{selectedRecord.sourceTime}</span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Processing Time</span>
                  <span className="col-span-7 text-slate-800 font-medium">{selectedRecord.processingTime}</span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Activity Type</span>
                  <span className="col-span-7">
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
                      {selectedRecord.activityType}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Original EQInfo Location</span>
                  <span className="col-span-7 text-slate-800 font-medium">{selectedRecord.originalLocation}</span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Coordinates</span>
                  <span className="col-span-7 font-mono text-slate-800">{selectedRecord.coordinates}</span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Parsed Location</span>
                  <span className="col-span-7 text-slate-800 font-medium">{selectedRecord.parsedLocation}</span>
                </div>

                <div className="grid grid-cols-12 py-1">
                  <span className="col-span-5 font-semibold text-slate-700">Coordinate-Derived Location</span>
                  <span className="col-span-7 text-slate-800 font-medium">{selectedRecord.coordinateDerivedLocation}</span>
                </div>
              </div>

              {/* Right Column Fields */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Matched AOR</span>
                  <span className="col-span-7 font-semibold text-slate-900">
                    {selectedRecord.stationCode} ({selectedRecord.stationName})
                  </span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Decision Reason</span>
                  <span className="col-span-7 text-slate-800 leading-relaxed">{selectedRecord.decisionReason}</span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Recipient</span>
                  <span className="col-span-7 text-slate-900 font-medium">
                    {selectedRecord.recipientName}{' '}
                    {selectedRecord.recipientRole ? `(${selectedRecord.recipientRole})` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Delivery Status</span>
                  <span className="col-span-7">
                    {selectedRecord.deliveryStatus === 'Success' && (
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Success
                      </span>
                    )}
                    {selectedRecord.deliveryStatus === 'Held' && (
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        Held
                      </span>
                    )}
                    {selectedRecord.deliveryStatus === 'Failed' && (
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                        Failed
                      </span>
                    )}
                    {selectedRecord.deliveryStatus === 'N/A' && (
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        N/A
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-12 py-1">
                  <span className="col-span-5 font-semibold text-slate-700">Boundary Dataset Version</span>
                  <span className="col-span-7 font-mono text-blue-600 font-semibold">{selectedRecord.boundaryDatasetVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Event Processing Timeline (~5 cols / 42%) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with blue vertical accent bar */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
              <h2 className="text-base font-bold text-slate-900">Event Processing Timeline</h2>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-2 py-2">
              <div className="space-y-4">
                {selectedRecord.timeline.map((step, idx) => {
                  const isLast = idx === selectedRecord.timeline.length - 1;
                  const isBluePoint = isLast || step.status === 'current';

                  return (
                    <div key={idx} className="relative flex items-start gap-3 text-xs">
                      {/* Vertical line connecting dots */}
                      {!isLast && (
                        <div className="absolute left-[7px] top-[14px] bottom-[-16px] w-[2px] bg-emerald-200" />
                      )}

                      {/* Dot */}
                      <div className="relative z-10 pt-0.5 shrink-0">
                        {isBluePoint ? (
                          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full bg-emerald-600 ring-2 ring-emerald-100" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex items-baseline gap-2">
                        <span className="text-slate-500 font-mono text-[11px] shrink-0 w-16">
                          {step.time}
                        </span>
                        <div className="flex-1">
                          <span className="font-bold text-blue-600 mr-2">{step.action}</span>
                          <span className="text-slate-700">{step.description}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 6: Bottom Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Event */}
          <button
            type="button"
            onClick={() => {
              if (onOpenEvent) {
                onOpenEvent(selectedRecord.eventId);
              } else {
                showNotification(`Opened event ${selectedRecord.eventId}`);
              }
            }}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>View Event</span>
          </button>

          {/* Open Map */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMap) {
                onOpenMap();
              } else {
                showNotification(`Opened spatial map for ${selectedRecord.stationCode}`);
              }
            }}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Map className="w-3.5 h-3.5" />
            <span>Open Map</span>
          </button>

          {/* View Full History */}
          <button
            type="button"
            onClick={() => {
              showNotification(`Viewing comprehensive history audit trail for ${selectedRecord.eventId}`);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>View Full History</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {/* Print Log */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
