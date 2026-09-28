import React, { useState } from 'react';
import {
  Home,
  Bell,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Menu,
  LogOut,
  MapPin,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useRealtimeClock } from '../utils/useRealtimeClock';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  currentUser?: UserProfile;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  onToggleMobileSidebar?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Earthquake Monitoring Dashboard',
  subtitle = 'Real-time monitoring, AOR classification, and email alert management',
  breadcrumb = 'Dashboard',
  titleClassName,
  subtitleClassName,
  currentUser,
  isSidebarHidden = false,
  onToggleSidebar,
  onToggleMobileSidebar,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);

  const {
    formattedFullPST,
    formattedTimePST,
    isOnline,
    isSynced,
    syncNow,
  } = useRealtimeClock();

  const handleManualSync = async () => {
    setIsResyncing(true);
    await syncNow();
    setTimeout(() => setIsResyncing(false), 500);
  };

  const breadcrumbSegments = breadcrumb.split('/').map((s) => s.trim());
  const isPcpScoped = currentUser?.assignedAor === 'PCP';

  const handleToggle = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else if (onToggleMobileSidebar) {
      onToggleMobileSidebar();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-4 shrink-0 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Sidebar Toggle, Breadcrumb, Main Title & Subtitle */}
        <div className="flex items-start gap-3">
          {/* Universal Sidebar Toggle Button (Hides/Shows sidebar on Desktop, opens drawer on Mobile) */}
          <button
            type="button"
            onClick={handleToggle}
            className={`p-2 -ml-1 rounded-lg transition-all mt-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40 flex items-center justify-center shrink-0 ${
              isSidebarHidden
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
            title={
              isSidebarHidden
                ? 'Show sidebar (Ctrl+B)'
                : 'Hide sidebar (Ctrl+B)'
            }
            aria-label={isSidebarHidden ? 'Show sidebar' : 'Hide sidebar'}
          >
            {isSidebarHidden ? (
              <PanelLeftOpen className="w-5 h-5 text-blue-600" />
            ) : (
              <PanelLeft className="w-5 h-5 text-slate-700" />
            )}
          </button>

          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium mb-1">
              <Home className="w-3.5 h-3.5 text-blue-600" />
              {breadcrumbSegments.map((seg, idx) => (
                <React.Fragment key={seg}>
                  {idx > 0 && <span className="text-slate-400">/</span>}
                  <span
                    className={
                      idx === breadcrumbSegments.length - 1
                        ? 'text-slate-700 font-medium'
                        : 'text-slate-500 hover:text-blue-600'
                    }
                  >
                    {seg}
                  </span>
                </React.Fragment>
              ))}
            </div>

            <h1 className={titleClassName || "text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight"}>
              {title}
            </h1>
            <p className={subtitleClassName || "text-xs text-slate-500 font-normal mt-0.5"}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right: Clock & User Profile Bar */}
        <div className="flex items-center gap-3 sm:gap-5 self-end md:self-auto">
          {/* Philippine Standard Time Display (Desktop / Tablet) */}
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-1.5">
              {isOnline ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200"
                  title="Synced with real-time network clock"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Synced</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200"
                  title="Offline mode: Using device system clock"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Offline</span>
                </span>
              )}

              <span className="text-[11px] font-semibold text-blue-600 tracking-wide">
                Philippine Standard Time (PST)
              </span>

              <button
                type="button"
                onClick={handleManualSync}
                className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                title="Resync clock with time server"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isResyncing ? 'animate-spin text-blue-600' : ''}`}
                />
              </button>
            </div>

            <div
              onClick={handleManualSync}
              className="text-xs font-bold text-slate-800 font-mono mt-0.5 tabular-nums cursor-pointer hover:text-blue-600 transition-colors select-none"
              title="Click to resync time"
            >
              {formattedFullPST}
            </div>
          </div>

          {/* Compact Clock for Mobile (< sm) */}
          <div
            onClick={handleManualSync}
            className="sm:hidden flex items-center gap-1 text-[11px] font-mono font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title={`Philippine Standard Time: ${formattedFullPST} (Tap to resync)`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span>{formattedTimePST}</span>
          </div>

          {/* Notification Bell with red alert count */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-blue-600" />
              {/* Notification count badge */}
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold border-2 border-white">
                1
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-slate-900">System Notifications</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                    3 unread
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="font-semibold text-emerald-900">Alert Dispatched</div>
                    <div className="text-[11px] text-emerald-700">M4.8 Calayan, Cagayan email sent to 12 PCP contacts.</div>
                    <div className="text-[10px] text-emerald-600 mt-1">2 mins ago</div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="font-semibold text-amber-900">Review Required</div>
                    <div className="text-[11px] text-amber-700">M5.1 Burgos, Ilocos Norte pending AOR confirmation.</div>
                    <div className="text-[10px] text-amber-600 mt-1">45 mins ago</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Station Scope Badge (if PCP scoped) */}
          {isPcpScoped && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>AOR: Palayan Station (PCP Only)</span>
            </div>
          )}

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              {/* Avatar circle */}
              <div className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs ${
                isPcpScoped ? 'bg-blue-600' : 'bg-emerald-600'
              }`}>
                {isPcpScoped ? 'PCP' : currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'JD'}
              </div>

              {/* Name & Role */}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser?.name || 'Juan Dela Cruz'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentUser ? `${currentUser.role} • ${currentUser.assignedAor === 'PCP' ? 'PCP AOR' : 'Global'}` : 'System Administrator'}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 text-xs text-slate-700">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="font-bold text-slate-900">{currentUser?.name || 'Juan Dela Cruz'}</div>
                  <div className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'j.delacruz@phivolcs.dost.gov.ph'}</div>
                </div>
                <div className="py-1">
                  <div className="px-4 py-1.5 flex items-center gap-2 text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Role: <strong>{currentUser?.role || 'Administrator'}</strong></span>
                  </div>
                  <div className="px-4 py-1.5 flex items-center gap-2 text-slate-600">
                    <Radio className="w-4 h-4 text-blue-600" />
                    <span>Station: <strong>{currentUser?.assignedAor || 'ALL'}</strong></span>
                  </div>
                  {isPcpScoped && (
                    <div className="mx-3 my-1 p-2 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-800">
                      <strong>Station Restriction Active:</strong> Displaying only earthquakes and recipients within Palayan AOR.
                    </div>
                  )}
                  <div className="px-4 py-1.5 flex items-center gap-2 text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>PHIVOLCS Directory SSO</span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout?.();
                    }}
                    className="w-full px-4 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
