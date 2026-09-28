import React, { useState, useMemo } from 'react';
import {
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RotateCcw,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Map as MapIcon,
  UserCheck,
  Check,
  X,
  Save,
  Download,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Equal,
} from 'lucide-react';
import { UserProfile } from '../types';

export interface BoundaryReviewItem {
  id: string;
  eventOrBoundary: string;
  reviewType: 'Offshore/Boundary Check' | 'Province Assignment' | 'Boundary Validation' | 'Dataset Validation';
  station: 'PCP' | 'BIP' | 'CGP';
  stationFullName: string;
  issueSummary: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Review' | 'Resolved';
  lastUpdatedDate: string;
  lastUpdatedTime: string;
  coordinates: string;
  lat: number;
  lng: number;
  currentFinding: string;
  recommendedAction: string;
  reviewer: string;
  reviewerRole: string;
  decision: string;
  decisionNotes?: string;
  magnitude?: number;
  eventDate?: string;
}

const INITIAL_REVIEW_ITEMS: BoundaryReviewItem[] = [
  {
    id: 'BR-2025-001',
    eventOrBoundary: 'Dalupiri Island',
    reviewType: 'Offshore/Boundary Check',
    station: 'PCP',
    stationFullName: 'PCP (Palayan Seismic Station)',
    issueSummary: 'Coordinate near AOR edge',
    priority: 'High',
    status: 'Pending',
    lastUpdatedDate: 'Apr 23, 2025',
    lastUpdatedTime: '09:15 AM',
    coordinates: '18.5742° N, 121.0168° E',
    lat: 18.5742,
    lng: 121.0168,
    magnitude: 4.8,
    eventDate: 'Apr 23, 2025',
    currentFinding: 'Coordinate near AOR edge; within 5 km of boundary',
    recommendedAction: 'Verify with GIS and station coverage rules',
    reviewer: 'Maria Santos',
    reviewerRole: 'Geospatial Analyst',
    decision: '—',
    decisionNotes: '',
  },
  {
    id: 'BR-2025-002',
    eventOrBoundary: 'Sarangani Island',
    reviewType: 'Province Assignment',
    station: 'BIP',
    stationFullName: 'BIP (Bislig Seismic Station)',
    issueSummary: 'EQInfo and GIS result differ',
    priority: 'Medium',
    status: 'In Review',
    lastUpdatedDate: 'Apr 22, 2025',
    lastUpdatedTime: '04:32 PM',
    coordinates: '5.4120° N, 125.4320° E',
    lat: 5.412,
    lng: 125.432,
    magnitude: 5.3,
    eventDate: 'Apr 22, 2025',
    currentFinding: 'PHIVOLCS EQInfo tagged Davao Occidental; polygon calculation overlaps BIP boundary zone.',
    recommendedAction: 'Reconcile municipal coastal boundary polygon with Region XI GIS dataset',
    reviewer: 'Danilo Reyes',
    reviewerRole: 'Geodetic Engineer',
    decision: 'Under Review',
    decisionNotes: 'Consulting PHIVOLCS regional geodetic coordinates table.',
  },
  {
    id: 'BR-2025-003',
    eventOrBoundary: 'Burgos, Surigao del Norte',
    reviewType: 'Boundary Validation',
    station: 'BIP',
    stationFullName: 'BIP (Bislig Seismic Station)',
    issueSummary: 'Municipal boundary requires confirmation',
    priority: 'Medium',
    status: 'Pending',
    lastUpdatedDate: 'Apr 21, 2025',
    lastUpdatedTime: '11:17 AM',
    coordinates: '10.0123° N, 126.0684° E',
    lat: 10.0123,
    lng: 126.0684,
    magnitude: 4.2,
    eventDate: 'Apr 21, 2025',
    currentFinding: 'Epicenter plotted 1.2 km outside coastal perimeter buffer; local municipal shapefile awaiting confirmation.',
    recommendedAction: 'Run 5 km maritime buffer check against Region XIII dataset.',
    reviewer: 'Maria Santos',
    reviewerRole: 'Geospatial Analyst',
    decision: '—',
    decisionNotes: '',
  },
  {
    id: 'BR-2025-004',
    eventOrBoundary: 'AOR Dataset 2024.12.15',
    reviewType: 'Dataset Validation',
    station: 'CGP',
    stationFullName: 'CGP (Cagayan de Oro Seismic Station)',
    issueSummary: 'Approved dataset verified',
    priority: 'Low',
    status: 'Resolved',
    lastUpdatedDate: 'Jan 15, 2025',
    lastUpdatedTime: '09:24 AM',
    coordinates: '8.4800° N, 124.6400° E',
    lat: 8.48,
    lng: 124.64,
    magnitude: 3.9,
    eventDate: 'Jan 15, 2025',
    currentFinding: 'Topological integrity check completed with zero self-intersections or sliver polygons.',
    recommendedAction: 'Approved dataset verified and locked into production baseline.',
    reviewer: 'Maria Santos',
    reviewerRole: 'Geospatial Analyst',
    decision: 'Approved & Locked',
    decisionNotes: 'Full GIS topology verified. Signed off by Lead Analyst.',
  },
];

interface BoundaryReviewViewProps {
  onOpenMap?: () => void;
  currentUser?: UserProfile;
}

export const BoundaryReviewView: React.FC<BoundaryReviewViewProps> = ({
  onOpenMap,
  currentUser,
}) => {
  const isPcpRestricted = currentUser?.assignedAor === 'PCP';
  const [items, setItems] = useState<BoundaryReviewItem[]>(INITIAL_REVIEW_ITEMS);
  const [selectedId, setSelectedId] = useState<string>('BR-2025-001');
  const [selectedCheckboxIds, setSelectedCheckboxIds] = useState<string[]>(['BR-2025-001']);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewTypeFilter, setReviewTypeFilter] = useState('All Types');
  const [stationFilter, setStationFilter] = useState(isPcpRestricted ? 'PCP' : 'All Stations');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Decision notes edit
  const [decisionNotes, setDecisionNotes] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignedReviewer, setAssignedReviewer] = useState('Maria Santos');

  // Mini-map zoom
  const [mapZoom, setMapZoom] = useState(1);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedId) || items[0];
  }, [items, selectedId]);

  // Sync decision notes with selected item
  React.useEffect(() => {
    if (selectedItem) {
      setDecisionNotes(selectedItem.decisionNotes || '');
    }
  }, [selectedItem]);

  // Counts
  const pendingCount = items.filter((i) => i.status === 'Pending').length;
  const inReviewCount = items.filter((i) => i.status === 'In Review').length;
  const resolvedCount = items.filter((i) => i.status === 'Resolved').length;

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (isPcpRestricted && item.station !== 'PCP') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.id.toLowerCase().includes(q) ||
          item.eventOrBoundary.toLowerCase().includes(q) ||
          item.issueSummary.toLowerCase().includes(q) ||
          item.station.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (reviewTypeFilter !== 'All Types' && item.reviewType !== reviewTypeFilter) {
        return false;
      }
      if (stationFilter !== 'All Stations' && item.station !== stationFilter) {
        return false;
      }
      if (priorityFilter !== 'All Priorities' && item.priority !== priorityFilter) {
        return false;
      }
      if (statusFilter !== 'All Statuses' && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, reviewTypeFilter, stationFilter, priorityFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setReviewTypeFilter('All Types');
    setStationFilter('All Stations');
    setPriorityFilter('All Priorities');
    setStatusFilter('All Statuses');
  };

  const toggleSelectAll = () => {
    if (selectedCheckboxIds.length === filteredItems.length) {
      setSelectedCheckboxIds([]);
    } else {
      setSelectedCheckboxIds(filteredItems.map((i) => i.id));
    }
  };

  const toggleCheckbox = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleApprove = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              status: 'Resolved',
              decision: 'Approved',
              decisionNotes: decisionNotes || 'Approved by operator review.',
            }
          : i
      )
    );
    setActionNotice(`Item ${selectedItem.id} (${selectedItem.eventOrBoundary}) has been Approved.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              status: 'Resolved',
              decision: 'Rejected (Suppressed)',
              decisionNotes: decisionNotes || 'Rejected by operator review.',
            }
          : i
      )
    );
    setActionNotice(`Item ${selectedItem.id} rejected. Station assignment withheld.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSaveDecision = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              decisionNotes,
              decision: decisionNotes ? 'Recorded' : i.decision,
            }
          : i
      )
    );
    setActionNotice(`Decision notes for ${selectedItem.id} saved successfully.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAssignReviewer = () => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedItem.id
          ? {
              ...i,
              reviewer: assignedReviewer,
              reviewerRole:
                assignedReviewer === 'Maria Santos'
                  ? 'Geospatial Analyst'
                  : 'Geodetic Engineer',
            }
          : i
      )
    );
    setIsAssignModalOpen(false);
    setActionNotice(`Assigned ${assignedReviewer} to ${selectedItem.id}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportReviewLog = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Review ID,Event or Boundary,Review Type,Station,Issue Summary,Priority,Status,Last Updated,Reviewer']
        .concat(
          items.map(
            (i) =>
              `"${i.id}","${i.eventOrBoundary}","${i.reviewType}","${i.station}","${i.issueSummary}","${i.priority}","${i.status}","${i.lastUpdatedDate} ${i.lastUpdatedTime}","${i.reviewer}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Boundary_Review_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setActionNotice('Boundary review log exported successfully.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-4">
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

      {/* 1. Top 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Reviews */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-800 block">
              Pending Reviews
            </span>
            <div className="text-3xl font-bold text-amber-700 tracking-tight mt-0.5">
              {pendingCount}
            </div>
          </div>
        </div>

        {/* Card 2: Boundary Events */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-blue-600 block">
              Boundary Events
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl font-bold text-blue-600 tracking-tight">12</span>
              <span className="text-xs text-slate-500 font-normal">(Last 30 days)</span>
            </div>
          </div>
        </div>

        {/* Card 3: GIS Mismatches */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-red-700 block">
              GIS Mismatches
            </span>
            <div className="text-3xl font-bold text-red-600 tracking-tight mt-0.5">
              5
            </div>
          </div>
        </div>

        {/* Card 4: Resolved This Month */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">
              Resolved This Month
            </span>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight mt-0.5">
              8
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Search Input (5 cols) */}
          <div className="md:col-span-4">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Search review items
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by location, ID, or keywords..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Review Type Dropdown */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Review Type
            </label>
            <select
              value={reviewTypeFilter}
              onChange={(e) => setReviewTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="All Types">All Types</option>
              <option value="Offshore/Boundary Check">Offshore/Boundary Check</option>
              <option value="Province Assignment">Province Assignment</option>
              <option value="Boundary Validation">Boundary Validation</option>
              <option value="Dataset Validation">Dataset Validation</option>
            </select>
          </div>

          {/* Station Dropdown */}
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Station {isPcpRestricted && <span className="text-[10px] text-blue-600 font-normal">(PCP Only)</span>}
            </label>
            <select
              value={isPcpRestricted ? 'PCP' : stationFilter}
              disabled={isPcpRestricted}
              onChange={(e) => setStationFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs ${
                isPcpRestricted
                  ? 'bg-slate-50 border-blue-200 text-blue-900 font-semibold cursor-default'
                  : 'bg-white border-slate-200 cursor-pointer'
              }`}
            >
              {isPcpRestricted ? (
                <option value="PCP">PCP (Palayan Station AOR Only)</option>
              ) : (
                <>
                  <option value="All Stations">All Stations</option>
                  <option value="PCP">PCP</option>
                  <option value="BIP">BIP</option>
                  <option value="CGP">CGP</option>
                </>
              )}
            </select>
          </div>

          {/* Priority Dropdown */}
          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="All Priorities">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="md:col-span-1">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Action Buttons: Filter & Clear (2 cols) */}
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="button"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 bg-white hover:bg-slate-50 border border-blue-600 text-blue-600 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Review Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold select-none">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 &&
                      selectedCheckboxIds.length === filteredItems.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    Review ID
                    <span className="text-[10px] text-slate-400">↕</span>
                  </span>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">Event or Boundary</th>
                <th className="px-4 py-3 whitespace-nowrap">Review Type</th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    Station/AOR
                    <span className="text-[10px] text-slate-400">↕</span>
                  </span>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">Issue Summary</th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    Priority
                    <span className="text-[10px] text-slate-400">↕</span>
                  </span>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    Status
                    <span className="text-[10px] text-slate-400">↕</span>
                  </span>
                </th>
                <th className="px-4 py-3 whitespace-nowrap">
                  <span className="flex items-center gap-1">
                    Last Updated
                    <span className="text-[10px] text-slate-400">↕</span>
                  </span>
                </th>
                <th className="px-4 py-3 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isSelected = item.id === selectedId;
                const isChecked = selectedCheckboxIds.includes(item.id);

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onClick={(e) => toggleCheckbox(item.id, e)}
                        onChange={() => {}}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600 whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {item.eventOrBoundary}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                      {item.reviewType}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {item.station}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                      {item.issueSummary}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.priority === 'High' && (
                        <span className="bg-red-100 text-red-700 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                          <ArrowUp className="w-3 h-3" />
                          High
                        </span>
                      )}
                      {item.priority === 'Medium' && (
                        <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                          <Equal className="w-3 h-3" />
                          Medium
                        </span>
                      )}
                      {item.priority === 'Low' && (
                        <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                          <ArrowDown className="w-3 h-3" />
                          Low
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.status === 'Pending' && (
                        <span className="bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                          Pending
                        </span>
                      )}
                      {item.status === 'In Review' && (
                        <span className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                          In Review
                        </span>
                      )}
                      {item.status === 'Resolved' && (
                        <span className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{item.lastUpdatedDate}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.lastUpdatedTime}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(item.id);
                        }}
                        className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Split Bottom Section: Selected Review Item (Left) & Geographic Context (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Panel: Selected Review Item (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 tracking-tight mb-4">
            Selected Review Item
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
            {/* Left 6 cols: Attributes */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Review ID</span>
                <span className="text-slate-900 font-mono font-bold">
                  {selectedItem.id}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Issue Type</span>
                <span className="text-slate-900 font-semibold">
                  {selectedItem.reviewType}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Event/Boundary</span>
                <span className="text-slate-900 font-semibold">
                  {selectedItem.eventOrBoundary}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Coordinates</span>
                <span className="text-slate-900 font-mono font-semibold">
                  {selectedItem.coordinates}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Station</span>
                <span className="text-slate-900 font-semibold">
                  {selectedItem.stationFullName}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium shrink-0">
                  Current Finding
                </span>
                <span className="text-slate-800 font-medium text-right max-w-[210px] leading-snug">
                  {selectedItem.currentFinding}
                </span>
              </div>

              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500 font-medium shrink-0">
                  Recommended Action
                </span>
                <span className="text-slate-800 font-medium text-right max-w-[210px] leading-snug">
                  {selectedItem.recommendedAction}
                </span>
              </div>
            </div>

            {/* Right 5 cols: Decision & Reviewer Status */}
            <div className="md:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Priority</span>
                {selectedItem.priority === 'High' && (
                  <span className="bg-red-100 text-red-700 font-semibold px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    High
                  </span>
                )}
                {selectedItem.priority === 'Medium' && (
                  <span className="bg-amber-100 text-amber-700 font-semibold px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1">
                    <Equal className="w-3 h-3" />
                    Medium
                  </span>
                )}
                {selectedItem.priority === 'Low' && (
                  <span className="bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-0.5 rounded text-xs inline-flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" />
                    Low
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Status</span>
                <span className="bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full text-xs">
                  {selectedItem.status}
                </span>
              </div>

              <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Reviewer</span>
                <div className="text-right">
                  <span className="text-slate-900 font-semibold block">
                    {selectedItem.reviewer}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    ({selectedItem.reviewerRole})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-medium">Decision</span>
                <span className="text-slate-800 font-medium">
                  {selectedItem.decision}
                </span>
              </div>

              {/* Decision Notes Textarea */}
              <div className="pt-1">
                <div className="relative">
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Add decision notes..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 resize-none shadow-2xs"
                  />
                  <span className="absolute bottom-1.5 right-2 text-[10px] text-slate-400 font-mono">
                    {decisionNotes.length}/500
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Geographic Context (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight mb-3">
              Geographic Context
            </h3>

            {/* Interactive Context Map Container */}
            <div className="relative bg-[#d7ecf8] rounded-xl border border-slate-200/80 overflow-hidden min-h-[220px] select-none">
              {/* Floating Legend on top-left */}
              <div className="absolute top-2.5 left-2.5 z-20 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg p-2 text-[10px] space-y-1 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-3 h-3 rounded-xs inline-block border ${
                      selectedItem.station === 'PCP'
                        ? 'bg-blue-100 border-blue-500'
                        : selectedItem.station === 'BIP'
                        ? 'bg-emerald-100 border-emerald-500'
                        : 'bg-purple-100 border-purple-500'
                    }`}
                  />
                  <span className="text-slate-700 font-medium">
                    {selectedItem.station === 'PCP'
                      ? 'PCP AOR (Palayan)'
                      : selectedItem.station === 'BIP'
                      ? 'BIP AOR (Bislig)'
                      : 'CGP AOR (Cagayan de Oro)'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-dashed border-slate-400 inline-block" />
                  <span className="text-slate-600 font-medium">Province Boundaries</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 border border-white inline-block" />
                  <span className="text-slate-600 font-medium">Earthquake Epicenter</span>
                </div>
              </div>

              {/* Map Controls on top-right */}
              <div className="absolute top-2.5 right-2.5 z-20 flex flex-col bg-white border border-slate-200 rounded shadow-xs divide-y divide-slate-100 text-slate-700">
                <button
                  type="button"
                  onClick={() => setMapZoom((prev) => Math.min(prev + 0.2, 2))}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-xs"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom((prev) => Math.max(prev - 0.2, 0.8))}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-xs"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom(1)}
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-blue-600 text-xs"
                >
                  <Crosshair className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="w-6 h-6 flex items-center justify-center hover:bg-slate-50 text-xs"
                >
                  <Layers className="w-3 h-3" />
                </button>
              </div>

              {/* Scale bar at bottom-left */}
              <div className="absolute bottom-2.5 left-2.5 z-20 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 text-[9px] text-slate-700 flex flex-col items-start pointer-events-none">
                <div className="flex justify-between w-28 text-[8px] text-slate-600 font-mono">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                  <span>200 km</span>
                </div>
                <div className="w-28 h-1 bg-slate-900 flex border border-slate-900 mt-0.5">
                  <div className="w-1/4 h-full bg-white" />
                  <div className="w-1/4 h-full bg-slate-900" />
                  <div className="w-1/4 h-full bg-white" />
                  <div className="w-1/4 h-full bg-slate-900" />
                </div>
              </div>

              {/* SVG Canvas */}
              <svg
                viewBox="0 0 450 240"
                className="w-full h-full transition-transform duration-200"
                style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center' }}
              >
                {/* Background Water */}
                <rect width="450" height="240" fill="#d7ecf8" />

                {/* Landmass representation for context */}
                <path
                  d="M100,50 Q160,40 220,70 Q240,110 230,160 Q210,210 180,230 Q140,210 120,180 Q105,140 100,90 Z"
                  fill="#f1f5f9"
                  stroke="#cbd5e1"
                  strokeWidth="1.2"
                />

                {/* Station AOR Polygon */}
                {selectedItem.station === 'PCP' && (
                  <path
                    d="M130,70 Q180,60 215,85 Q225,120 210,160 Q185,190 160,180 Q140,160 135,120 Z"
                    fill="#3b82f6"
                    fillOpacity="0.38"
                    stroke="#2563eb"
                    strokeWidth="2"
                  />
                )}
                {selectedItem.station === 'BIP' && (
                  <path
                    d="M140,75 Q195,65 225,90 Q230,130 215,170 Q185,195 160,185 Q145,150 140,100 Z"
                    fill="#22c55e"
                    fillOpacity="0.38"
                    stroke="#16a34a"
                    strokeWidth="2"
                  />
                )}
                {selectedItem.station === 'CGP' && (
                  <path
                    d="M120,80 Q170,70 205,95 Q220,130 200,170 Q170,190 145,175 Q130,140 120,105 Z"
                    fill="#a855f7"
                    fillOpacity="0.38"
                    stroke="#9333ea"
                    strokeWidth="2"
                  />
                )}

                {/* Region Label */}
                <text
                  x="180"
                  y="135"
                  className="font-serif italic text-slate-700 text-sm tracking-wider pointer-events-none select-none"
                >
                  Luzon
                </text>
                <text
                  x="300"
                  y="180"
                  className="font-serif italic text-sky-900/60 text-xs tracking-wider pointer-events-none select-none"
                >
                  Philippine Sea
                </text>

                {/* Station Pin */}
                <g className="cursor-pointer">
                  <circle cx="180" cy="155" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                  <rect
                    x="188"
                    y="148"
                    width="22"
                    height="14"
                    rx="2"
                    fill="#ffffff"
                    stroke="#2563eb"
                    strokeWidth="1"
                  />
                  <text
                    x="199"
                    y="158"
                    textAnchor="middle"
                    className="fill-blue-700 font-bold text-[8px] font-sans"
                  >
                    PCP
                  </text>
                </g>

                {/* Earthquake Epicenter Marker */}
                <circle cx="215" cy="85" r="5" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />

                {/* Epicenter Details Callout Card */}
                <g>
                  <rect
                    x="230"
                    y="60"
                    width="100"
                    height="46"
                    rx="4"
                    fill="#ffffff"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    className="drop-shadow-xs"
                  />
                  <text x="238" y="74" className="fill-slate-900 font-bold text-[10px] font-sans">
                    M4.8
                  </text>
                  <text x="238" y="86" className="fill-slate-500 text-[8px] font-sans">
                    Apr 23, 2025
                  </text>
                  <text x="238" y="98" className="fill-slate-700 font-mono text-[8px]">
                    18.5742° N, 121.0168° E
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Left Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenMap}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <MapIcon className="w-4 h-4" />
            <span>Open Map</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-white hover:bg-blue-50/50 border border-blue-600 text-blue-600 font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-2xs"
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>Assign Reviewer</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleApprove}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Approve</span>
          </button>

          <button
            type="button"
            onClick={handleReject}
            className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-xs"
          >
            <X className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDecision}
            className={`py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              decisionNotes.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>Save Decision</span>
          </button>

          <button
            type="button"
            onClick={handleExportReviewLog}
            className="bg-white hover:bg-blue-50/50 border border-blue-600 text-blue-600 font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Export Review Log</span>
          </button>
        </div>
      </div>

      {/* Assign Reviewer Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Assign Reviewer to {selectedItem.id}
              </h3>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Select a qualified geospatial or geodetic analyst to lead this boundary review.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Assignee
                </label>
                <select
                  value={assignedReviewer}
                  onChange={(e) => setAssignedReviewer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-blue-600"
                >
                  <option value="Maria Santos">Maria Santos (Geospatial Analyst)</option>
                  <option value="Danilo Reyes">Danilo Reyes (Geodetic Engineer)</option>
                  <option value="Juan Dela Cruz">Juan Dela Cruz (System Administrator)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignReviewer}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-xs"
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
