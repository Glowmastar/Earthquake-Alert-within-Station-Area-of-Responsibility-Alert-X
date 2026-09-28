import React from 'react';
import { Mail, Clock, XCircle, Ban } from 'lucide-react';

interface AlertDeliveryCardProps {
  onViewRecipients?: () => void;
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
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 tracking-tight">
          Alert Delivery Summary
        </h3>
        <span className="text-xs font-semibold text-blue-600">
          Last 24 hours
        </span>
      </div>

      {/* 4 Cards in a Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Sent */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-emerald-800 block leading-tight">
              Sent
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-emerald-800 leading-none">
                {sentCount}
              </span>
              <span className="text-[11px] font-medium text-emerald-600">
                {sentPct}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Pending */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-amber-800 block leading-tight">
              Pending
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-amber-800 leading-none">
                {pendingCount}
              </span>
              <span className="text-[11px] font-medium text-amber-600">
                {pendingPct}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Failed */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-rose-800 block leading-tight">
              Failed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-rose-800 leading-none">
                {failedCount}
              </span>
              <span className="text-[11px] font-medium text-rose-600">
                {failedPct}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Suppressed */}
        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 border border-slate-200">
            <Ban className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-700 block leading-tight">
              Suppressed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-700 leading-none">
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
