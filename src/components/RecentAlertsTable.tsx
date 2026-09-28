import React from 'react';
import { Eye, RefreshCw, Play, Mail, Download } from 'lucide-react';
import { EarthquakeRecord } from '../types';

interface RecentAlertsTableProps {
  records: EarthquakeRecord[];
  onSelectRecord: (record: EarthquakeRecord) => void;
  onViewAllRecords: () => void;
  onRefreshData?: () => void;
  onRunAorCheck?: () => void;
  onSendPendingAlerts?: () => void;
  onExportReport?: () => void;
}

export const RecentAlertsTable: React.FC<RecentAlertsTableProps> = ({
  records,
  onSelectRecord,
  onViewAllRecords,
  onRefreshData,
  onRunAorCheck,
  onSendPendingAlerts,
  onExportReport,
}) => {
  const displayRecords = records.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Alert Sent':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            Alert Sent
          </span>
        );
      case 'For Review':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            For Review
          </span>
        );
      case 'No Alert':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
            No Alert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Recent AOR Alerts
          </h3>
          <button
            type="button"
            onClick={onViewAllRecords}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            View All
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-blue-900">
                <th className="py-2.5 px-4 whitespace-nowrap">Time (PST)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Event ID</th>
                <th className="py-2.5 px-4">Location</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Magnitude</th>
                <th className="py-2.5 px-3">AOR</th>
                <th className="py-2.5 px-4 text-center">Alert Status</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {displayRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap text-[11px]">
                    {record.timePHT}
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-600 font-semibold whitespace-nowrap text-[11px]">
                    {record.id}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => onSelectRecord(record)}
                      className="text-left font-medium text-blue-600 hover:underline line-clamp-1"
                    >
                      {record.location}
                    </button>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800 text-center">
                    {record.magnitude.toFixed(1)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-700 whitespace-nowrap">
                      {record.aor}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectRecord(record)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors inline-flex items-center justify-center"
                      title="Inspect Event Bulletin"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={onRefreshData}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>

        <button
          type="button"
          onClick={onRunAorCheck}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-blue-600" />
          <span>Run AOR Check</span>
        </button>

        <button
          type="button"
          onClick={onSendPendingAlerts}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <Mail className="w-3.5 h-3.5 text-blue-600" />
          <span>Send Pending Alerts</span>
        </button>

        <button
          type="button"
          onClick={onExportReport}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-blue-50 border border-blue-600 text-blue-600 text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
};
