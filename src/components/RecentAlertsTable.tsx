import React from 'react';
import { Eye, RefreshCw, Play, Mail, Download, MapPin, Radio } from 'lucide-react';
import { EarthquakeRecord } from '../types';

interface RecentAlertsTableProps {
  records: EarthquakeRecord[];
  onSelectRecord: (record: EarthquakeRecord) => void;
  onIdentifyEpicenter?: (record: EarthquakeRecord) => void;
  onInspectBulletin?: (record: EarthquakeRecord) => void;
  activeEpicenterId?: string | null;
  onViewAllRecords: () => void;
  onRefreshData?: () => void;
  onRunAorCheck?: () => void;
  onSendPendingAlerts?: () => void;
  onExportReport?: () => void;
  hideActionButtons?: boolean;
}

export const RecentAlertsTable: React.FC<RecentAlertsTableProps> = ({
  records,
  onSelectRecord,
  onIdentifyEpicenter,
  onInspectBulletin,
  activeEpicenterId,
  onViewAllRecords,
  onRefreshData,
  onRunAorCheck,
  onSendPendingAlerts,
  onExportReport,
  hideActionButtons = false,
}) => {
  const displayRecords = records.slice(0, 5);

  const handleRowClick = (record: EarthquakeRecord) => {
    if (onIdentifyEpicenter) {
      onIdentifyEpicenter(record);
    } else {
      onSelectRecord(record);
    }
  };

  const handleInspect = (e: React.MouseEvent, record: EarthquakeRecord) => {
    e.stopPropagation();
    if (onInspectBulletin) {
      onInspectBulletin(record);
    } else {
      onSelectRecord(record);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Alert Sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 shadow-2xs">
            Alert Sent
          </span>
        );
      case 'For Review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 shadow-2xs">
            For Review
          </span>
        );
      case 'No Alert':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 shadow-2xs">
            No Alert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Radio className="w-4 h-4 text-rose-600 animate-pulse" />
              Recent AOR Alerts
            </h3>
            <p className="text-[11px] text-slate-500">
              Click any earthquake info to identify its epicenter and display it on the map
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAllRecords}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors shrink-0 cursor-pointer"
          >
            View All
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-600">
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
              {displayRecords.map((record) => {
                const isActive = activeEpicenterId === record.id;
                return (
                  <tr
                    key={record.id}
                    onClick={() => handleRowClick(record)}
                    className={`cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-blue-50/70 hover:bg-blue-50 border-l-4 border-l-blue-600'
                        : 'hover:bg-slate-50/70'
                    }`}
                    title="Click to identify and focus epicenter on map"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                      {record.timePHT}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-semibold whitespace-nowrap text-[11px]">
                      <span className="flex items-center gap-1">
                        {record.id}
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping inline-block" />
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-left font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                          {record.location}
                        </span>
                        {isActive && (
                          <span className="text-[10px] text-blue-600 font-medium flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            Epicenter identified on map
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-center">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                          record.magnitude >= 5.0
                            ? 'bg-rose-100 text-rose-800 font-extrabold'
                            : record.magnitude >= 4.0
                            ? 'bg-amber-100 text-amber-800 font-bold'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {record.magnitude.toFixed(1)}
                      </span>
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
                        onClick={(e) => handleInspect(e, record)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer"
                        title="Open Full Event Bulletin Modal"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons Bar */}
      {!hideActionButtons && (
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
      )}
    </div>
  );
};
