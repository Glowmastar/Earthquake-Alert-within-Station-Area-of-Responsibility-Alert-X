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
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  onNavigate,
  newCount = 24,
  insideCount = 14,
  insidePct = '(58.3%)',
  sentCount = 11,
  sentPct = '(45.8%)',
  outsideCount = 7,
  outsidePct = '(29.2%)',
  reviewCount = 3,
  reviewPct = '(12.5%)',
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* 1. New Earthquakes */}
      <div
        onClick={() => onNavigate('records', 'ALL')}
        className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-rose-300 transition-all cursor-pointer flex items-center gap-3.5 group"
      >
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-rose-100">
          <Activity className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-rose-500 block">
            New Earthquakes
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-extrabold text-rose-600 leading-none">
              {newCount}
            </span>
            <span className="text-xs text-slate-500 truncate">
              Last 24 hours
            </span>
          </div>
        </div>
      </div>

      {/* 2. Inside AOR */}
      <div
        onClick={() => onNavigate('records', 'INSIDE_AOR')}
        className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-3.5 group"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-100">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-emerald-800 block">
            Inside AOR
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-extrabold text-emerald-800 leading-none">
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
        className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-blue-300 transition-all cursor-pointer flex items-center gap-3.5 group"
      >
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-blue-100">
          <Mail className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-blue-700 block">
            Alerts Sent
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-extrabold text-blue-700 leading-none">
              {sentCount}
            </span>
            <span className="text-xs text-blue-500 font-medium">
              {sentPct}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Outside AOR */}
      <div
        onClick={() => onNavigate('records', 'OUTSIDE_AOR')}
        className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-amber-300 transition-all cursor-pointer flex items-center gap-3.5 group"
      >
        <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-orange-100">
          <Navigation className="w-6 h-6 rotate-45" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-amber-800 block">
            Outside AOR
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-extrabold text-amber-800 leading-none">
              {outsideCount}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              {outsidePct}
            </span>
          </div>
        </div>
      </div>

      {/* 5. For Review */}
      <div
        onClick={() => onNavigate('exceptions')}
        className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-sky-300 transition-all cursor-pointer flex items-center gap-3.5 group"
      >
        <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-sky-100">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold text-blue-900 block">
            For Review
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-extrabold text-blue-900 leading-none">
              {reviewCount}
            </span>
            <span className="text-xs text-blue-600 font-medium">
              {reviewPct}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
