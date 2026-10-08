import React, { useState } from 'react';
import {
  Home,
  ChevronDown,
  ChevronUp,
  Map,
  AlertTriangle,
  Users,
  Contact,
  FileText,
  BarChart2,
  ScrollText,
  Shield,
  IdCard,
  X,
  Radio,
  Mail,
  Settings as SettingsIcon,
  PanelLeftClose,
  LogOut,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  currentView: string;
  currentFilter?: string;
  currentMapSubView?: 'STATION_BOUNDARIES' | 'BOUNDARY_REVIEW';
  onNavigate: (view: string, filter?: string) => void;
  reviewCount?: number;
  recipientCount?: number;
  isOpenMobile?: boolean;
  currentUser?: UserProfile;
  onCloseMobile?: () => void;
  isHidden?: boolean;
  onToggleHide?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  currentFilter = 'ALL',
  currentMapSubView = 'STATION_BOUNDARIES',
  onNavigate,
  reviewCount = 27,
  isOpenMobile = false,
  currentUser,
  onCloseMobile,
  isHidden = false,
  onToggleHide,
  onLogout,
}) => {
  const [recordsExpanded, setRecordsExpanded] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [exceptionExpanded, setExceptionExpanded] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [intensityExpanded, setIntensityExpanded] = useState(false);
  const [adminExpanded, setAdminExpanded] = useState(false);

  const handleNavigate = (view: string, filter?: string) => {
    onNavigate(view, filter);
    onCloseMobile?.();
  };

  const isRecordsView = currentView === 'records';
  const isAllRecordsActive = isRecordsView && (currentFilter === 'ALL' || !currentFilter);
  const isInsideAorActive = isRecordsView && currentFilter === 'INSIDE_AOR';
  const isAdmin = currentUser?.role === 'Administrator';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 z-40 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a1628] text-slate-300 flex flex-col justify-between shrink-0 select-none overflow-y-auto border-r border-slate-800/80 transition-all duration-300 ease-in-out lg:static ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${
          isHidden
            ? 'lg:-ml-64 lg:opacity-0 lg:pointer-events-none lg:border-r-0'
            : 'lg:ml-0 lg:opacity-100 lg:translate-x-0'
        }`}
      >
        {/* Top Brand Section */}
        <div className="p-5 pb-3">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Custom Seismic Pulse Waveform Icon */}
              <div className="text-cyan-400 shrink-0">
                <svg
                  className="w-9 h-9 text-cyan-400"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 16h4l3-8 5 18 4-13 3 6 2-3h7" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl font-black text-white tracking-wider flex items-center gap-1 leading-none">
                  ALERT <span className="text-cyan-400">X</span>
                </h1>
                <p className="text-[8.5px] font-bold tracking-wider text-cyan-400/90 uppercase mt-1 leading-tight">
                  Earthquake Alert
                  <br />
                  <span className="text-cyan-300">Within Station AOR</span>
                </p>
              </div>
            </div>

            {/* Controls: Close on mobile, Hide on desktop */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden transition-colors"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>

              {onToggleHide && (
                <button
                  type="button"
                  onClick={onToggleHide}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                  title="Hide sidebar (Ctrl+B)"
                  aria-label="Hide sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Station Scope Banner (when station scoped) */}
          {currentUser?.assignedAor && currentUser.assignedAor !== 'ALL' && (
            <div className="mt-3.5 p-2.5 rounded-xl bg-blue-950/80 border border-blue-700/60 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white text-[11px] block truncate">
                    {currentUser.stationName ? currentUser.stationName.split('(')[0].trim() : `${currentUser.name} (${currentUser.assignedAor})`}
                  </span>
                  <span className="text-[9px] text-cyan-300 block truncate">
                    {currentUser.role} Role &bull; Scoped to {currentUser.assignedAor} AOR
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="mt-6 space-y-1 text-xs">
            {/* Dashboard */}
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

          {/* Earthquake Records Dropdown */}
          <div>
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                isRecordsView
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  handleNavigate('records', 'ALL');
                  setRecordsExpanded(true);
                }}
                className="flex items-center gap-3 flex-1 text-left focus:outline-none"
                title="Go to Earthquake Records"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12h4l2-5 4 10 3-7 2 4 1-2h6" />
                </svg>
                <span>Earthquake Records</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecordsExpanded(!recordsExpanded);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={recordsExpanded ? "Collapse section" : "Expand section"}
                aria-label={recordsExpanded ? "Collapse section" : "Expand section"}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                    recordsExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                  }`}
                />
              </button>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                recordsExpanded
                  ? 'grid-rows-[1fr] opacity-100 mt-1'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden ml-2 pl-2 space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('records', 'ALL')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isAllRecordsActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      isAllRecordsActive ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>All Records</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('records', 'INSIDE_AOR')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isInsideAorActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      isInsideAorActive ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>Inside AOR</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('records', 'OUTSIDE_AOR')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentFilter === 'OUTSIDE_AOR' && isRecordsView
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentFilter === 'OUTSIDE_AOR' && isRecordsView ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>Outside AOR</span>
                </button>
              </div>
            </div>
          </div>

          {/* AOR Map Dropdown */}
          <div>
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                currentView === 'map'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  handleNavigate('map', 'STATION_BOUNDARIES');
                  setMapExpanded(true);
                }}
                className="flex items-center gap-3 flex-1 text-left focus:outline-none"
                title="Go to AOR Map"
              >
                <Map className="w-4 h-4 shrink-0" />
                <span>AOR Map</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMapExpanded(!mapExpanded);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={mapExpanded ? "Collapse section" : "Expand section"}
                aria-label={mapExpanded ? "Collapse section" : "Expand section"}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                    mapExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                  }`}
                />
              </button>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                mapExpanded
                  ? 'grid-rows-[1fr] opacity-100 mt-1'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden ml-2 pl-2 space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('map', 'STATION_BOUNDARIES')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'map' && currentMapSubView !== 'BOUNDARY_REVIEW'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'map' && currentMapSubView !== 'BOUNDARY_REVIEW'
                        ? 'bg-white'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>Station Boundaries</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('map', 'BOUNDARY_REVIEW')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'map' && currentMapSubView === 'BOUNDARY_REVIEW'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'map' && currentMapSubView === 'BOUNDARY_REVIEW'
                        ? 'bg-white'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>Boundary Review</span>
                </button>
              </div>
            </div>
          </div>

          {/* Exception Review Dropdown */}
          <div>
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                currentView === 'exceptions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  handleNavigate('exceptions', 'ALL');
                  setExceptionExpanded(true);
                }}
                className="flex items-center gap-3 flex-1 text-left focus:outline-none"
                title="Go to Exception Review"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                <span>Exception Review</span>
              </button>
              <div className="flex items-center gap-1.5">
                {reviewCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      currentView === 'exceptions' ? 'bg-white text-blue-600' : 'bg-red-500/80 text-white'
                    }`}
                  >
                    {reviewCount}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExceptionExpanded(!exceptionExpanded);
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title={exceptionExpanded ? "Collapse section" : "Expand section"}
                  aria-label={exceptionExpanded ? "Collapse section" : "Expand section"}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                      exceptionExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                exceptionExpanded
                  ? 'grid-rows-[1fr] opacity-100 mt-1'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden ml-2 pl-2 space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('exceptions', 'Offshore Event')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'exceptions' && currentFilter === 'Offshore Event'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'exceptions' && currentFilter === 'Offshore Event'
                        ? 'bg-white'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>Offshore Events</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('exceptions', 'Boundary Event')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'exceptions' && currentFilter === 'Boundary Event'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'exceptions' && currentFilter === 'Boundary Event'
                        ? 'bg-white'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span>Boundary Events</span>
                </button>
              </div>
            </div>
          </div>

          {/* Email Dropdown (Matching Screenshot) */}
          <div>
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                currentView === 'email'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  handleNavigate('email', 'DESIGN_TEMPLATE');
                  setEmailExpanded(true);
                }}
                className="flex items-center gap-3 flex-1 text-left focus:outline-none"
                title="Go to Email Design Template"
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEmailExpanded(!emailExpanded);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={emailExpanded ? "Collapse section" : "Expand section"}
                aria-label={emailExpanded ? "Collapse section" : "Expand section"}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                    emailExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                  }`}
                />
              </button>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                emailExpanded
                  ? 'grid-rows-[1fr] opacity-100 mt-1'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden ml-2 pl-2 space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('email', 'DESIGN_TEMPLATE')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'email' && currentFilter !== 'TEST_EMAIL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'email' && currentFilter !== 'TEST_EMAIL' ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>Design Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('email', 'TEST_EMAIL')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'email' && currentFilter === 'TEST_EMAIL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'email' && currentFilter === 'TEST_EMAIL' ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>Test Email</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <button
            type="button"
            onClick={() => handleNavigate('recipients')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
              currentView === 'recipients'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Recipients</span>
          </button>

          {/* Contact Info Directory */}
          <button
            type="button"
            onClick={() => handleNavigate('contacts')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
              currentView === 'contacts'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Contact className="w-4 h-4 shrink-0" />
            <span>Contact Info Directory</span>
          </button>

          {/* Intensity Reports Dropdown */}
          <div>
            <div
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                currentView === 'intensity' || currentView === 'intensity-field' || currentView === 'social-media'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  handleNavigate('intensity');
                  setIntensityExpanded(true);
                }}
                className="flex items-center gap-3 flex-1 text-left focus:outline-none"
                title="Go to Intensity Reports"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Intensity Reports</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIntensityExpanded(!intensityExpanded);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title={intensityExpanded ? "Collapse section" : "Expand section"}
                aria-label={intensityExpanded ? "Collapse section" : "Expand section"}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                    intensityExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                  }`}
                />
              </button>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                intensityExpanded
                  ? 'grid-rows-[1fr] opacity-100 mt-1'
                  : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden ml-2 pl-2 space-y-1">
                {/* Previous Tab: Field Intensity Reports */}
                <button
                  type="button"
                  onClick={() => handleNavigate('intensity-field')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'intensity-field'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'intensity-field' ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>Field Intensity Reports</span>
                </button>
                {/* Intensity Consolidator */}
                <button
                  type="button"
                  onClick={() => handleNavigate('intensity')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'intensity'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'intensity' ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>Intensity Consolidator</span>
                </button>
                {/* Social Media */}
                <button
                  type="button"
                  onClick={() => handleNavigate('social-media')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentView === 'social-media'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${
                      currentView === 'social-media' ? 'bg-white' : 'bg-slate-400'
                    }`}
                  />
                  <span>Social Media</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <button
            type="button"
            onClick={() => handleNavigate('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
              currentView === 'audit'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScrollText className="w-4 h-4 shrink-0" />
            <span>Audit Log</span>
          </button>

          {/* Administration Dropdown (Admin Only) */}
          {isAdmin && (
            <div>
              <div
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-all ${
                  currentView === 'settings' || currentView === 'roles'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleNavigate('settings', 'GENERAL');
                    setAdminExpanded(true);
                  }}
                  className="flex items-center gap-3 flex-1 text-left focus:outline-none cursor-pointer"
                  title="Go to Administration Settings"
                >
                  <SettingsIcon className="w-4 h-4 shrink-0" />
                  <span>Administration</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdminExpanded(!adminExpanded);
                  }}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title={adminExpanded ? "Collapse section" : "Expand section"}
                  aria-label={adminExpanded ? "Collapse section" : "Expand section"}
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ease-in-out ${
                      adminExpanded ? 'rotate-180 text-white' : 'rotate-0 text-slate-400'
                    }`}
                  />
                </button>
              </div>

              <div
                className={`grid transition-all duration-300 ease-in-out overflow-hidden ${
                  adminExpanded
                    ? 'grid-rows-[1fr] opacity-100 mt-1'
                    : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="overflow-hidden ml-2 pl-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => handleNavigate('settings', 'EQINFO_SOURCE')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'settings' && currentFilter === 'EQINFO_SOURCE'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        currentView === 'settings' && currentFilter === 'EQINFO_SOURCE'
                          ? 'bg-white'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>EQInfo Source</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('settings', 'AOR_RULES')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'settings' && currentFilter === 'AOR_RULES'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        currentView === 'settings' && currentFilter === 'AOR_RULES'
                          ? 'bg-white'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>AOR Rules</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('settings', 'ROLES')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'roles' || (currentView === 'settings' && currentFilter === 'ROLES')
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        currentView === 'roles' || (currentView === 'settings' && currentFilter === 'ROLES')
                          ? 'bg-white'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>Roles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('settings', 'GENERAL')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'settings' && (currentFilter === 'GENERAL' || !currentFilter)
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        currentView === 'settings' && (currentFilter === 'GENERAL' || !currentFilter)
                          ? 'bg-white'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('settings', 'VERSION_HISTORY')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentView === 'settings' && currentFilter === 'VERSION_HISTORY'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full inline-block ${
                        currentView === 'settings' && currentFilter === 'VERSION_HISTORY'
                          ? 'bg-white'
                          : 'bg-slate-400'
                      }`}
                    />
                    <span>Version History</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Desktop Quick Collapse Button */}
      {onToggleHide && (
        <div className="hidden lg:block px-3 mb-2">
          <button
            type="button"
            onClick={onToggleHide}
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 transition-all group"
            title="Hide sidebar (Ctrl+B)"
          >
            <div className="flex items-center gap-2">
              <PanelLeftClose className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <span>Hide Sidebar</span>
            </div>
            <kbd className="text-[10px] font-mono text-slate-400 bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-700/60">
              Ctrl+B
            </kbd>
          </button>
        </div>
      )}

      {/* Logout Button on Lower Left under Hide Sidebar */}
      {onLogout && (
        <div className="px-3 mb-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 hover:border-rose-700/70 transition-all group cursor-pointer shadow-2xs"
            title="Log out of system"
          >
            <div className="flex items-center gap-2">
              <LogOut className="w-4 h-4 text-rose-400 group-hover:text-rose-200 transition-colors shrink-0" />
              <span>Logout</span>
            </div>
            <span className="text-[10px] text-rose-400/80 group-hover:text-rose-200 font-medium">
              Sign out
            </span>
          </button>
        </div>
      )}

      {/* Bottom Organic Waves & Slogan Section */}
      <div className="relative pt-10 pb-5 px-3 text-center mt-auto">
        {/* Layered Decorative Wave SVG Background */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-60">
          <svg viewBox="0 0 250 120" className="w-full h-auto" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" stopOpacity="0.8" />
                <stop offset="0%" stopColor="#0369a1" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="wave2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 C50,20 90,80 140,40 C190,10 210,60 250,30 L250,120 L0,120 Z"
              fill="url(#wave2)"
            />
            <path
              d="M0,75 C60,50 110,95 160,70 C210,45 230,85 250,65 L250,120 L0,120 Z"
              fill="url(#wave1)"
            />
          </svg>
        </div>

        {/* Slogan */}
        <div className="relative z-10 space-y-1">
          <div className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
            MONITOR • ALERT • PREPARE
          </div>
          <div className="text-[10px] font-bold text-cyan-300 tracking-wider">
            FOR A SAFER TOMORROW
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
