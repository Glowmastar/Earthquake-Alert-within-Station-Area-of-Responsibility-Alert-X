import React from 'react';
import { Mail, Clock, XCircle, Ban } from 'lucide-react';

interface AlertDeliveryCardProps {
  onViewRecipients?: () => void;
  onOpenPendingAlerts?: () => void;
  sentCount?: number;
  sentPct?: string;
  pendingCount?: number;
  pendingPct?: string;
  failedCount?: number;
  failedPct?: string;
  suppressedCount?: number;
  suppressedPct?: string;
}

export const AlertDeliveryCard: React.FC<AlertDeliveryCardProps> = ({
  onViewRecipients,
  onOpenPendingAlerts,
  sentCount = 11,
  sentPct = '(45.8%)',
  pendingCount = 3,
  pendingPct = '(12.5%)',
  failedCount = 1,
  failedPct = '(4.2%)',
  suppressedCount = 0,
  suppressedPct = '(0.0%)',
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Alert Delivery Summary
        </h3>
        <span className="text-xs font-semibold text-slate-500">
          Last 24 hours
        </span>
      </div>

      {/* 4 Cards in a Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Sent */}
        <div
          onClick={onViewRecipients}
          className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center gap-3 hover:border-slate-300 transition-colors cursor-pointer"
          title="View Recipients & Delivery History"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-600 block leading-tight">
              Sent
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">
                {sentCount}
              </span>
              <span className="text-[11px] font-medium text-emerald-600">
                {sentPct}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Pending */}
        <div
          onClick={onOpenPendingAlerts}
          className="bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-center gap-3 hover:border-amber-300 hover:bg-amber-50/40 transition-colors cursor-pointer"
          title="Click to view and dispatch pending alerts modal"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-600 block leading-tight">
              Pending
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-none">
                {pendingCount}
              </span>
              <span className="text-[11px] font-medium text-amber-600">
                {pendingPct}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Failed */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-600 block leading-tight">
              Failed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">
                {failedCount}
              </span>
              <span className="text-[11px] font-medium text-rose-600">
                {failedPct}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Suppressed */}
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
            <Ban className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-600 block leading-tight">
              Suppressed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-900 leading-none">
                {suppressedCount}
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                {suppressedPct}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
