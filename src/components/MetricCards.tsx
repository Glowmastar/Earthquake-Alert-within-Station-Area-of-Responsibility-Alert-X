import React from 'react';
import { Activity, MapPin, Mail, Navigation, HelpCircle } from 'lucide-react';

interface MetricCardsProps {
  onNavigate: (view: string, filter?: string) => void;
  newCount?: number;
  insideCount?: number;
  insidePct?: string;
  sentCount?: number;
  sentPct?: string;
  outsideCount?: number;
  outsidePct?: string;
  reviewCount?: number;
  reviewPct?: string;
  showOutside?: boolean;
  onOpenPendingModal?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  onNavigate,
  newCount = 11,
  insideCount = 11,
  insidePct = '(100.0%)',
  sentCount = 0,
  sentPct = '(0.0%)',
  outsideCount = 0,
  outsidePct = '(0.0%)',
  reviewCount = 1,
  reviewPct = '(9.1%)',
  showOutside = false,
  onOpenPendingModal,
}) => {
  return (
    <div className={`grid grid-cols-2 ${showOutside ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3`}>
      {/* 1. New Earthquakes */}
      <div
        onClick={() => onNavigate('records', 'ALL')}
        className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3 group"
        title="View All Records"
      >
        <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Activity className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-700 block">
            New Earthquakes
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 leading-none">
              {newCount}
            </span>
            <span className="text-xs text-slate-400 truncate">
              Last 24 hours
            </span>
          </div>
        </div>
      </div>

      {/* 2. Inside AOR */}
      <div
        onClick={() => onNavigate('records', 'INSIDE_AOR')}
        className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3 group"
        title="View Inside AOR Records"
      >
        <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-700 block">
            Inside AOR
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 leading-none">
              {insideCount}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {insidePct}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Alerts Sent */}
      <div
        onClick={() => onNavigate('records', 'ALERT_SENT')}
        className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3 group"
        title="View Sent Alerts"
      >
        <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Mail className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-700 block">
            Alerts Sent
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 leading-none">
              {sentCount}
            </span>
            <span className="text-xs text-blue-600 font-medium">
              {sentPct}
            </span>
          </div>
        </div>
      </div>

      {/* Outside AOR (Optional for full view) */}
      {showOutside && (
        <div
          onClick={() => onNavigate('records', 'OUTSIDE_AOR')}
          className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3 group"
          title="View Outside AOR Records"
        >
          <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Navigation className="w-5 h-5 rotate-45" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-700 block">
              Outside AOR
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 leading-none">
                {outsideCount}
              </span>
              <span className="text-xs text-amber-600 font-medium">
                {outsidePct}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. For Review / Pending */}
      <div
        onClick={() => {
          if (onOpenPendingModal) {
            onOpenPendingModal();
          } else {
            onNavigate('exceptions');
          }
        }}
        className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-3 group"
        title="View Pending Alerts / Events for Review"
      >
        <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-slate-700 block">
            For Review
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-600 leading-none">
              {reviewCount}
            </span>
            <span className="text-xs text-purple-600 font-medium">
              {reviewPct}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
