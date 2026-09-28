import React from 'react';
import { Database, Settings, Layers, Clock } from 'lucide-react';

export const StatusCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. EQInfo Source */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Database className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs text-slate-500 font-medium block leading-none">
            EQInfo Source
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-base font-bold text-slate-900 leading-tight">
              Connected
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            Receiving real-time data
          </span>
        </div>
      </div>

      {/* 2. Alert Service */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Settings className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs text-slate-500 font-medium block leading-none">
            Alert Service
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-base font-bold text-slate-900 leading-tight">
              Active
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            Email service operational
          </span>
        </div>
      </div>

      {/* 3. GIS Dataset */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs text-slate-500 font-medium block leading-none">
            GIS Dataset
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-base font-bold text-slate-900 leading-tight">
              Approved
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block" />
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            AOR boundaries up to date
          </span>
        </div>
      </div>

      {/* 4. Last Update */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 border border-sky-100">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs text-slate-500 font-medium block leading-none">
            Last Update
          </span>
          <div className="text-sm font-bold text-blue-600 truncate mt-1 leading-tight">
            Apr 23, 2025 10:42 AM
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            3 minutes ago
          </span>
        </div>
      </div>
    </div>
  );
};
