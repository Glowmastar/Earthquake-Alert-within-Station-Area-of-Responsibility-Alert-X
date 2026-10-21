import React, { useState, useEffect } from 'react';
import { Database, Settings, Layers, Clock, RefreshCw } from 'lucide-react';

interface StatusCardsProps {
  lastUpdated?: Date | string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const StatusCards: React.FC<StatusCardsProps> = ({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}) => {
  // Normalize update time to a Date object
  const [updateTime, setUpdateTime] = useState<Date>(() => {
    if (lastUpdated instanceof Date) return lastUpdated;
    if (typeof lastUpdated === 'string' && lastUpdated.trim()) {
      const parsed = new Date(lastUpdated);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [relativeText, setRelativeText] = useState<string>('Just now');
  const [formattedTimeText, setFormattedTimeText] = useState<string>('');

  // Update updateTime state whenever lastUpdated prop changes
  useEffect(() => {
    if (lastUpdated) {
      if (lastUpdated instanceof Date) {
        setUpdateTime(lastUpdated);
      } else if (typeof lastUpdated === 'string' && lastUpdated.trim()) {
        const parsed = new Date(lastUpdated);
        if (!isNaN(parsed.getTime())) {
          setUpdateTime(parsed);
        } else {
          // If string like '10:42 AM', set today with that time
          setUpdateTime(new Date());
        }
      }
    }
  }, [lastUpdated]);

  // Format the absolute date & time and compute live relative time every second
  useEffect(() => {
    const updateDisplay = () => {
      const now = new Date();
      const diffMs = Math.max(0, now.getTime() - updateTime.getTime());
      const diffSec = Math.floor(diffMs / 1000);

      // Relative text
      if (diffSec < 5) {
        setRelativeText('Just now');
      } else if (diffSec < 60) {
        setRelativeText(`${diffSec}s ago`);
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        setRelativeText(`${mins}m ago`);
      } else if (diffSec < 86400) {
        const hours = Math.floor(diffSec / 3600);
        setRelativeText(`${hours}h ago`);
      } else {
        const days = Math.floor(diffSec / 86400);
        setRelativeText(`${days}d ago`);
      }

      // Formatted date and time (e.g., "Apr 23, 2025 10:42 AM" or current date)
      const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setFormattedTimeText(new Intl.DateTimeFormat('en-US', options).format(updateTime));
    };

    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [updateTime]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. EQInfo Source */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium block leading-none">
              EQInfo Source
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block animate-pulse" />
          </div>
          <span className="text-base font-bold text-slate-900 leading-tight block mt-1">
            Connected
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            Receiving real-time data
          </span>
        </div>
      </div>

      {/* 2. Alert Service */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium block leading-none">
              Alert Service
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
          </div>
          <span className="text-base font-bold text-slate-900 leading-tight block mt-1">
            Active
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            Email service operational
          </span>
        </div>
      </div>

      {/* 3. GIS Dataset */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium block leading-none">
              GIS Dataset
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
          </div>
          <span className="text-base font-bold text-slate-900 leading-tight block mt-1">
            Approved
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
            AOR boundaries up to date
          </span>
        </div>
      </div>

      {/* 4. Last Update */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center gap-3 relative group">
        <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
          <Clock className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium block leading-none">
              Last Update
            </span>
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                title="Sync now"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            )}
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-1 leading-tight font-mono" title={formattedTimeText}>
            {formattedTimeText || 'Synchronizing...'}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
            <span className="text-[11px] text-slate-600 font-medium">
              {relativeText}
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              (Live Synced)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
