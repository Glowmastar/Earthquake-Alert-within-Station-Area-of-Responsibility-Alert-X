import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Eye,
  Check,
  X,
  Plus,
  Download,
  Share2,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export interface FieldObservationReport {
  id: string;
  referenceEqInfo: string;
  eventDate: string;
  townCity: string;
  province: string;
  region: string;
  reportedIntensity: string; // e.g. "PEIS V", "PEIS IV"
  intensityNum: number;
  reporterType: 'DRRMO' | 'Police/BFP' | 'DepEd Official' | 'Barangay Official' | 'Citizen Observer';
  reporterName: string;
  contactNumber: string;
  timeReceived: string;
  status: 'Verified' | 'Pending' | 'Under Review';
  feltEffects: string;
  correlatesInstrumental: boolean;
  instrumentalReading?: string;
}

const INITIAL_FIELD_REPORTS: FieldObservationReport[] = [
  {
    id: 'FIR-2025-001',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Lebak',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    reportedIntensity: 'PEIS V',
    intensityNum: 5,
    reporterType: 'DRRMO',
    reporterName: 'MDRRMO Operations Center',
    contactNumber: '+63 917 555 0192',
    timeReceived: '08:24 AM (9m post-event)',
    status: 'Verified',
    feltEffects: 'Strong shaking felt generally throughout the municipality. Hanging objects swung violently; liquids spilled from open containers.',
    correlatesInstrumental: true,
    instrumentalReading: 'V (PCP Station)',
  },
  {
    id: 'FIR-2025-002',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Kalamansig',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    reportedIntensity: 'PEIS V',
    intensityNum: 5,
    reporterType: 'Police/BFP',
    reporterName: 'Kalamansig MPS Desk Officer',
    contactNumber: '+63 920 888 1234',
    timeReceived: '08:27 AM (12m post-event)',
    status: 'Verified',
    feltEffects: 'Felt strongly indoors and outdoors. Sleepers awakened; small church bells chimed.',
    correlatesInstrumental: true,
    instrumentalReading: 'V (PCP Station)',
  },
  {
    id: 'FIR-2025-003',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Cotabato City',
    province: 'Maguindanao del Norte',
    region: 'BARMM',
    reportedIntensity: 'PEIS IV',
    intensityNum: 4,
    reporterType: 'DRRMO',
    reporterName: 'CDRRMO Cotabato City',
    contactNumber: '+63 918 444 8821',
    timeReceived: '08:31 AM (16m post-event)',
    status: 'Verified',
    feltEffects: 'Felt generally indoors by many. Plates and glasses clattered; parked vehicles rocked noticeably.',
    correlatesInstrumental: true,
    instrumentalReading: 'IV (Cotabato Seismic)',
  },
  {
    id: 'FIR-2025-004',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Isulan',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    reportedIntensity: 'PEIS IV',
    intensityNum: 4,
    reporterType: 'DepEd Official',
    reporterName: 'District Supervisor - Division Office',
    contactNumber: '+63 919 772 3109',
    timeReceived: '08:35 AM (20m post-event)',
    status: 'Verified',
    feltEffects: 'School personnel evacuated buildings smoothly. Light fixtures swayed for 15 seconds.',
    correlatesInstrumental: true,
    instrumentalReading: 'IV (PCP Network)',
  },
  {
    id: 'FIR-2025-005',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Palimbang',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    reportedIntensity: 'PEIS IV',
    intensityNum: 4,
    reporterType: 'Barangay Official',
    reporterName: 'Brgy. Captain - Poblacion',
    contactNumber: '+63 921 334 9012',
    timeReceived: '08:42 AM (27m post-event)',
    status: 'Pending',
    feltEffects: 'Residents along coastal road reported distinct tremors. No infrastructural damage noted.',
    correlatesInstrumental: true,
    instrumentalReading: 'IV (PCP Sensor)',
  },
  {
    id: 'FIR-2025-006',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Tacurong City',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    reportedIntensity: 'PEIS III',
    intensityNum: 3,
    reporterType: 'DRRMO',
    reporterName: 'Tacurong City DRRMO',
    contactNumber: '+63 917 222 9981',
    timeReceived: '08:45 AM (30m post-event)',
    status: 'Verified',
    feltEffects: 'Felt by many people indoors. Slight dizziness experienced by some upper-floor occupants.',
    correlatesInstrumental: true,
    instrumentalReading: 'III (Regional Net)',
  },
  {
    id: 'FIR-2025-007',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Upi',
    province: 'Maguindanao del Norte',
    region: 'BARMM',
    reportedIntensity: 'PEIS III',
    intensityNum: 3,
    reporterType: 'Citizen Observer',
    reporterName: 'PHIVOLCS Felt-It Mobile User #4419',
    contactNumber: '+63 908 111 4452',
    timeReceived: '08:49 AM (34m post-event)',
    status: 'Under Review',
    feltEffects: 'Rumbling sound heard before mild floor vibrations felt for 8 seconds.',
    correlatesInstrumental: true,
    instrumentalReading: 'III (Sub-station)',
  },
  {
    id: 'FIR-2025-008',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    townCity: 'Esperanza',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    reportedIntensity: 'PEIS III',
    intensityNum: 3,
    reporterType: 'DRRMO',
    reporterName: 'MDRRMO Duty Officer',
    contactNumber: '+63 917 333 4455',
    timeReceived: '08:52 AM (37m post-event)',
    status: 'Verified',
    feltEffects: 'Weak ground shaking felt indoors. Hanging lamps swung gently.',
    correlatesInstrumental: true,
    instrumentalReading: 'III (PCP Net)',
  },
];

interface FieldIntensityReportsViewProps {
  onNavigateToConsolidator?: () => void;
  onNavigateToSocialMedia?: () => void;
}

export const FieldIntensityReportsView: React.FC<FieldIntensityReportsViewProps> = ({
  onNavigateToConsolidator,
  onNavigateToSocialMedia,
}) => {
  const [reports, setReports] = useState<FieldObservationReport[]>(INITIAL_FIELD_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [intensityFilter, setIntensityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState<FieldObservationReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.townCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.feltEffects.toLowerCase().includes(searchQuery.toLowerCase());
      const matchIntensity = intensityFilter === 'ALL' || r.reportedIntensity === intensityFilter;
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchIntensity && matchStatus;
    });
  }, [reports, searchQuery, intensityFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = reports.length;
    const verified = reports.filter((r) => r.status === 'Verified').length;
    const pending = reports.filter((r) => r.status === 'Pending').length;
    const underReview = reports.filter((r) => r.status === 'Under Review').length;
    return { total, verified, pending, underReview };
  }, [reports]);

  const handleVerify = (id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Verified' as const } : r))
    );
    showToast(`Report ${id} marked as Verified.`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Report ID',
      'Reference EQInfo',
      'Date',
      'Town/City',
      'Province',
      'Region',
      'Reported Intensity',
      'Reporter Type',
      'Reporter Name',
      'Contact',
      'Time Received',
      'Status',
      'Felt Effects',
    ];
    const rows = filteredReports.map((r) => [
      r.id,
      r.referenceEqInfo,
      r.eventDate,
      `"${r.townCity}"`,
      `"${r.province}"`,
      `"${r.region}"`,
      r.reportedIntensity,
      `"${r.reporterType}"`,
      `"${r.reporterName}"`,
      `"${r.contactNumber}"`,
      `"${r.timeReceived}"`,
      r.status,
      `"${r.feltEffects.replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Field_Intensity_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Field Intensity Reports exported to CSV.');
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium">
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

      {/* Tab Navigation Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-xs flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Field Intensity Reports</span>
          </button>
          {onNavigateToConsolidator && (
            <button
              type="button"
              onClick={onNavigateToConsolidator}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-600 border border-slate-200 flex items-center gap-2 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Intensity Consolidator</span>
            </button>
          )}
          {onNavigateToSocialMedia && (
            <button
              type="button"
              onClick={onNavigateToSocialMedia}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-600 border border-slate-200 flex items-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Social Media Updates</span>
            </button>
          )}
        </div>

        {onNavigateToConsolidator && (
          <button
            type="button"
            onClick={onNavigateToConsolidator}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <span>Proceed to Intensity Consolidator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Submissions
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Field observer entries</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Verified Entries
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.verified}</div>
          <div className="text-[11px] text-slate-500 mt-1">Correlated with DRRMO/MPS</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending Validation
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pending}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires analyst review</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Under Review
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600">{stats.underReview}</div>
          <div className="text-[11px] text-slate-500 mt-1">Citizen reports in triage</div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search town, province, observer, felt effects..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Intensity Filter */}
          <select
            value={intensityFilter}
            onChange={(e) => setIntensityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Reported PEIS</option>
            <option value="PEIS V">PEIS V - Strong</option>
            <option value="PEIS IV">PEIS IV - Moderately Strong</option>
            <option value="PEIS III">PEIS III - Weak</option>
            <option value="PEIS II">PEIS II - Slightly Felt</option>
            <option value="PEIS I">PEIS I - Scarcely Perceptible</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
          </select>

          {(searchQuery || intensityFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setIntensityFilter('ALL');
                setStatusFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Report ID</th>
                <th className="px-4 py-3">Town / Municipality</th>
                <th className="px-4 py-3">Province / Region</th>
                <th className="px-4 py-3 text-center">Reported PEIS</th>
                <th className="px-4 py-3">Observer / Source</th>
                <th className="px-4 py-3">Time Received</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-sm">No field intensity reports found</div>
                    <div className="text-xs text-slate-400 mt-1">Try adjusting search or filters.</div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const getIntensityBadgeClass = (peis: string) => {
                    if (peis.includes('V')) return 'bg-amber-100 text-amber-900 border-amber-300';
                    if (peis.includes('IV')) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
                    if (peis.includes('III')) return 'bg-blue-100 text-blue-900 border-blue-300';
                    return 'bg-slate-100 text-slate-800 border-slate-300';
                  };

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedReport(report)}
                    >
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">
                        {report.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {report.townCity}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{report.province}</div>
                        <div className="text-[10px] text-slate-400">{report.region}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getIntensityBadgeClass(
                            report.reportedIntensity
                          )}`}
                        >
                          {report.reportedIntensity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{report.reporterName}</div>
                        <div className="text-[10px] text-slate-400">{report.reporterType} • {report.contactNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {report.timeReceived}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            report.status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : report.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {report.status === 'Verified' ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{report.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {report.status !== 'Verified' && (
                            <button
                              type="button"
                              onClick={() => handleVerify(report.id)}
                              className="px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Mark as Verified"
                            >
                              <Check className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedReport(report)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                            title="View report details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredReports.length}</span> of{' '}
            <span className="font-bold text-slate-700">{reports.length}</span> field intensity entries
          </div>
          <div className="text-[11px] text-slate-400">
            Click any row to view full observer details and instrumental correlation.
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="text-xs font-mono font-bold text-blue-600">{selectedReport.id}</div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Field Intensity Report - {selectedReport.townCity}, {selectedReport.province}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Reported PEIS Intensity
                </span>
                <span className="text-base font-black text-slate-900">
                  {selectedReport.reportedIntensity}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Instrumental Sensor Correlation
                </span>
                <span className="text-base font-black text-blue-600">
                  {selectedReport.instrumentalReading || 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700 block mb-0.5">Felt Effects & Damage Notes:</span>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                  {selectedReport.feltEffects}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <span className="font-semibold text-slate-500 text-[10px] block">Reporter:</span>
                  <div className="font-bold text-slate-800">{selectedReport.reporterName}</div>
                  <div className="text-slate-500 text-[11px]">{selectedReport.reporterType}</div>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 text-[10px] block">Contact & Time:</span>
                  <div className="font-mono text-slate-800">{selectedReport.contactNumber}</div>
                  <div className="text-slate-500 text-[11px]">{selectedReport.timeReceived}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              {selectedReport.status !== 'Verified' && (
                <button
                  type="button"
                  onClick={() => {
                    handleVerify(selectedReport.id);
                    setSelectedReport(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verify Report</span>
                </button>
              )}
              {onNavigateToConsolidator && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    onNavigateToConsolidator();
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <span>Open in Consolidator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
