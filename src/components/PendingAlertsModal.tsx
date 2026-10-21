import React, { useState } from 'react';
import { X, Clock, Mail, CheckCircle2, AlertTriangle, Eye, Send, Radio, ChevronRight, Check } from 'lucide-react';
import { EarthquakeRecord } from '../types';

interface PendingAlertsModalProps {
  pendingRecords: EarthquakeRecord[];
  onClose: () => void;
  onApproveAlert: (record: EarthquakeRecord) => void;
  onDispatchAll: () => void;
  onInspectBulletin?: (record: EarthquakeRecord) => void;
}

export const PendingAlertsModal: React.FC<PendingAlertsModalProps> = ({
  pendingRecords,
  onClose,
  onApproveAlert,
  onDispatchAll,
  onInspectBulletin,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    pendingRecords.map((r) => r.id)
  );
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccessMsg, setDispatchSuccessMsg] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pendingRecords.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingRecords.map((r) => r.id));
    }
  };

  const handleDispatchSelected = async () => {
    setIsDispatching(true);
    setDispatchSuccessMsg(null);
    try {
      await onDispatchAll();
      setDispatchSuccessMsg(`Successfully dispatched ${selectedIds.length} pending alert(s) to designated emergency contacts.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">
                  Pending Earthquake Alerts
                </h3>
                <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  {pendingRecords.length} Awaiting Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Review and approve seismic events requiring immediate or batch email alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {dispatchSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{dispatchSuccessMsg}</span>
            </div>
          )}

          {pendingRecords.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900">All Caught Up!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                There are no pending alerts awaiting approval. All seismic events in your current AOR have either been dispatched or marked as reviewed.
              </p>
            </div>
          ) : (
            <>
              {/* Batch Select Controls */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedIds.length === pendingRecords.length && pendingRecords.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="select-all" className="font-semibold cursor-pointer select-none">
                    Select All ({selectedIds.length} of {pendingRecords.length} selected)
                  </label>
                </div>
                <span className="text-[11px] text-slate-400">
                  Ready to send via configured Direct SMTP Relay
                </span>
              </div>

              {/* Records List */}
              <div className="space-y-2.5">
                {pendingRecords.map((record) => {
                  const isSelected = selectedIds.includes(record.id);
                  return (
                    <div
                      key={record.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(record.id)}
                            className="w-4 h-4 mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-blue-600">
                                {record.id}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  record.magnitude >= 5.0
                                    ? 'bg-rose-100 text-rose-800'
                                    : record.magnitude >= 4.0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                M{record.magnitude.toFixed(1)}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                {record.timePHT}
                              </span>
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                {record.status || 'Pending Alert'}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                              {record.location}
                            </p>
                            <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                              <span>Depth: <strong>{record.depthKm} km</strong></span>
                              <span>AOR: <strong className="text-blue-700">{record.aor}</strong></span>
                              <span>Target Recipients: <strong>AOR Emergency Group</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onInspectBulletin && (
                            <button
                              type="button"
                              onClick={() => onInspectBulletin(record)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
                              title="Inspect Bulletin"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onApproveAlert(record)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          {pendingRecords.length > 0 && (
            <button
              type="button"
              disabled={selectedIds.length === 0 || isDispatching}
              onClick={handleDispatchSelected}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>
                {isDispatching
                  ? 'Dispatching Alerts...'
                  : `Dispatch ${selectedIds.length} Alert(s) Now`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
