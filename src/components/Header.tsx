import React, { useState } from 'react';
import { Home, Bell, ChevronDown, CheckCircle2, ShieldCheck, Menu, LogOut, MapPin, Radio } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumb?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  currentUser?: UserProfile;
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
  onToggleMobileSidebar,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const breadcrumbSegments = breadcrumb.split('/').map((s) => s.trim());
  const isPcpScoped = currentUser?.assignedAor === 'PCP';

  return (
    <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-4 shrink-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle, Breadcrumb, Main Title & Subtitle */}
        <div className="flex items-start gap-3">
          {/* Mobile hamburger menu button */}
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="p-2 -ml-1 text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-100 lg:hidden transition-colors mt-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            title="Toggle navigation sidebar"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-5 h-5 text-slate-700" />
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
        <div className="flex items-center gap-5 self-end md:self-auto">
          {/* Philippine Standard Time Display */}
          <div className="text-right hidden sm:block">
            <span className="block text-[11px] font-semibold text-blue-600 tracking-wide">
              Philippine Standard Time (PST)
            </span>
            <span className="block text-xs font-bold text-slate-800 font-mono mt-0.5">
              Wed, Apr 23, 2025 10:42 AM
            </span>
          </div>

          {/* Notification Bell with red alert dot */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-blue-600" />
              {/* Notification indicator red badge */}
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-300" />
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
