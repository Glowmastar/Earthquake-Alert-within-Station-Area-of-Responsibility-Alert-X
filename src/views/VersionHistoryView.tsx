import React, { useState, useMemo } from 'react';
import {
  History,
  GitCommit,
  Tag,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck,
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Database,
  Radio,
  MapPin,
  RefreshCw,
  Terminal,
  FileCode,
  AlertCircle,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { UserProfile } from '../types';

interface VersionHistoryViewProps {
  currentUser?: UserProfile;
  onNavigateToAudit?: () => void;
}

interface ReleaseItem {
  version: string;
  releaseDate: string;
  releaseType: 'Major' | 'Minor' | 'Patch' | 'AOR Revision' | 'Security';
  status: 'Current Production' | 'Stable Archive' | 'Archived';
  title: string;
  description: string;
  author: string;
  commitHash: string;
  highlights: {
    category: 'Leaflet & GIS' | 'AOR Scoping' | 'Recipients' | 'Email Engine' | 'Security' | 'Core Architecture';
    text: string;
  }[];
  affectedStations: string[];
}

const RELEASES: ReleaseItem[] = [
  {
    version: 'v2.4.2',
    releaseDate: 'October 6, 2026',
    releaseType: 'Minor',
    status: 'Current Production',
    title: 'Interactive Leaflet AOR Mapping, Province Boundaries & Dashboard Epicenter Identification',
    description:
      'Replaced static vector representations in AOR Map Station Boundaries and Boundary Review with interactive Leaflet GIS layers. Enforced station-scoped boundary rendering (CGP only vs full national AOR for Central Admin), improved Cordillera and regional polygon snapping, added direct map epicenter identification from recent alerts, and introduced Version History administration.',
    author: 'PHIVOLCS SOEPD Systems Engineering',
    commitHash: 'a7f9204',
    highlights: [
      {
        category: 'Leaflet & GIS',
        text: 'Integrated Leaflet interactive mapping with dark blue gradient backdrop for Station Boundaries and Boundary Review views.',
      },
      {
        category: 'AOR Scoping',
        text: 'Role-scoped boundary visibility: Station accounts (CGP, PCP) only view their respective AOR provinces; Central Admin accounts view all national station AORs.',
      },
      {
        category: 'Leaflet & GIS',
        text: 'Dashboard Recent AOR Alerts table now triggers real-time map epicenter identification, smooth fly-to animation, and pulsing seismic target markers.',
      },
      {
        category: 'Core Architecture',
        text: 'All navigation tabs set to closed state upon initial authentication with automatic landing on Monitoring Dashboard.',
      },
      {
        category: 'Recipients',
        text: 'Added Recipient Deletion with multi-step confirmation modal and real-time registry synchronization.',
      },
    ],
    affectedStations: ['CGP', 'PCP', 'BIP', 'BCP', 'ALL'],
  },
  {
    version: 'v2.4.1',
    releaseDate: 'September 28, 2026',
    releaseType: 'Patch',
    status: 'Stable Archive',
    title: 'Recipient Management Deletion Workflow & UI State Normalization',
    description:
      'Implemented full recipient deletion lifecycle with audit log integration. Added UI state persistence safeguards and streamlined authentication handoff.',
    author: 'J. Dela Cruz (Central Admin)',
    commitHash: 'e31b819',
    highlights: [
      {
        category: 'Recipients',
        text: 'Added Delete Recipient action in Recipients table rows and detail inspection pane with safe confirmation dialog.',
      },
      {
        category: 'Security',
        text: 'Prevented accidental deletion of primary station emergency notification contacts through confirmation validation.',
      },
      {
        category: 'Email Engine',
        text: 'Synchronized test email dispatch registry with active recipient verification states.',
      },
    ],
    affectedStations: ['ALL'],
  },
  {
    version: 'v2.4.0',
    releaseDate: 'September 15, 2026',
    releaseType: 'Major',
    status: 'Stable Archive',
    title: 'National SCSS 15-Station AOR Architecture & Scoped Data Segregation',
    description:
      'Scaled system from single-station testbed to 15 Seismic Cluster and Sub-station (SCSS) AOR network covering the entire Philippine archipelago. Introduced snapped province boundaries and station-level session scoping.',
    author: 'PHIVOLCS Data Integration Team',
    commitHash: 'c458d92',
    highlights: [
      {
        category: 'AOR Scoping',
        text: 'Enrolled all 15 PHIVOLCS SCSS stations with official coordinates, province rosters, and island grouping.',
      },
      {
        category: 'Leaflet & GIS',
        text: 'Generated snapped polygon boundary datasets matching official NAMRIA and PSA PSGC provincial coastline borders.',
      },
      {
        category: 'AOR Scoping',
        text: 'Implemented strict station isolation: CGP accounts only receive Northern Mindanao events and recipients.',
      },
    ],
    affectedStations: ['CGP', 'PCP', 'BIP', 'BCP', 'CVP', 'SIPP', 'GQP', 'LQP', 'PGP', 'LLP', 'PLP', 'PPR', 'SNP', 'DMP', 'ZCP'],
  },
  {
    version: 'v2.3.8',
    releaseDate: 'August 22, 2026',
    releaseType: 'Minor',
    status: 'Stable Archive',
    title: 'Real-Time PHIVOLCS EQInfo Ingestion Engine & Oceanic Buffer Rules',
    description:
      'Integrated live HTML scraping and JSON parsing of DOST-PHIVOLCS official earthquake bulletins with automated point-in-polygon assignment.',
    author: 'Telemetry Automation Unit',
    commitHash: '8b91a04',
    highlights: [
      {
        category: 'Core Architecture',
        text: 'Real-time sync worker polling earthquake.phivolcs.dost.gov.ph with 60-second automatic refresh intervals.',
      },
      {
        category: 'Leaflet & GIS',
        text: 'Oceanic 15-nautical-mile buffer calculations for offshore epicenter classification.',
      },
      {
        category: 'Security',
        text: 'Sanitized bulletin payloads and enforced TLS payload verification on upstream feeds.',
      },
    ],
    affectedStations: ['ALL'],
  },
  {
    version: 'v2.3.5',
    releaseDate: 'July 14, 2026',
    releaseType: 'Minor',
    status: 'Stable Archive',
    title: 'Email Design Template Customization & Dispatch Queue Engine',
    description:
      'Added WYSIWYG email template customizer with dynamic seismic tags, DOST branding, recipient variable injection, and automated SMTP dispatch.',
    author: 'Communications Systems Team',
    commitHash: '5f12e88',
    highlights: [
      {
        category: 'Email Engine',
        text: 'Dynamic placeholder syntax ({{magnitude}}, {{location}}, {{depth}}, {{intensity}}) with live preview.',
      },
      {
        category: 'Email Engine',
        text: 'Automated dispatch triggers for verified recipients matching threshold criteria (Mag >= 4.0 or PEIS >= IV).',
      },
    ],
    affectedStations: ['ALL'],
  },
  {
    version: 'v2.2.0',
    releaseDate: 'May 30, 2026',
    releaseType: 'Minor',
    status: 'Stable Archive',
    title: 'Field Intensity Reports & Social Media Sentiment Aggregator',
    description:
      'Introduced citizen felt reports ingestion, crowdsourced intensity mapping, and social media keyword monitoring for rapid earthquake confirmation.',
    author: 'Seismic Hazard Assessment Group',
    commitHash: '2d87e11',
    highlights: [
      {
        category: 'Core Architecture',
        text: 'PEIS Scale I-X field observation consolidator with geotagged citizen submissions.',
      },
      {
        category: 'Leaflet & GIS',
        text: 'Isoseismal contour overlay rendering on provincial maps.',
      },
    ],
    affectedStations: ['PCP', 'BIP', 'CGP'],
  },
  {
    version: 'v2.0.0',
    releaseDate: 'January 10, 2026',
    releaseType: 'Major',
    status: 'Stable Archive',
    title: 'Alert X Platform Re-Architecture & Centralized Dashboard',
    description:
      'Initial production rollout of the modern Alert X React + TypeScript monitoring platform with role-based access control, responsive layout, and audit logging.',
    author: 'PHIVOLCS Core Engineering',
    commitHash: '1a00fc3',
    highlights: [
      {
        category: 'Core Architecture',
        text: 'Vite + React single-page application foundation with Tailwind CSS and Express telemetry proxy.',
      },
      {
        category: 'Security',
        text: 'Station-level credential store and capability-based authorization matrix.',
      },
    ],
    affectedStations: ['ALL'],
  },
];

const TELEMETRY_RULES_REVISIONS = [
  {
    revisionId: 'REV-2026.10-A',
    date: 'Oct 04, 2026',
    scope: 'CGP (Cagayan de Oro) & Camiguin Island',
    summary: 'Adjusted Camiguin marine boundary polygon buffer to 22km geodetic distance to include Bohol Sea seismic swarms.',
    status: 'Approved & Active',
    engineer: 'E. Balce (GIS Team)',
  },
  {
    revisionId: 'REV-2026.08-C',
    date: 'Aug 19, 2026',
    scope: 'PCP (Palayan) Central Luzon Snapping',
    summary: 'Harmonized Nueva Ecija and Aurora boundary coastline with NAMRIA 2026 high-resolution tidal datum.',
    status: 'Approved & Active',
    engineer: 'R. Perez (Geodetic Div)',
  },
  {
    revisionId: 'REV-2026.05-B',
    date: 'May 12, 2026',
    scope: 'BIP (Bislig) Philippine Trench Buffer',
    summary: 'Expanded eastern boundary buffer to 65km offshore to capture subduction trench foreshocks impacting Surigao del Sur.',
    status: 'Approved & Active',
    engineer: 'D. Reyes (Seismology Div)',
  },
  {
    revisionId: 'REV-2026.01-A',
    date: 'Jan 15, 2026',
    scope: 'National Base Grid Calibration',
    summary: 'Initial baseline provincial polygon boundary definitions loaded from PSA PSGC 2025 dataset.',
    status: 'Baseline Established',
    engineer: 'Central Architecture Board',
  },
];

export const VersionHistoryView: React.FC<VersionHistoryViewProps> = ({
  currentUser,
  onNavigateToAudit,
}) => {
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedRelease, setSelectedRelease] = useState<ReleaseItem | null>(RELEASES[0]);
  const [activeTab, setActiveTab] = useState<'releases' | 'telemetry_rules'>('releases');

  const filteredReleases = useMemo(() => {
    return RELEASES.filter((rel) => {
      const matchType =
        selectedType === 'All' ||
        rel.releaseType.toLowerCase() === selectedType.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        rel.version.toLowerCase().includes(q) ||
        rel.title.toLowerCase().includes(q) ||
        rel.description.toLowerCase().includes(q) ||
        rel.commitHash.toLowerCase().includes(q) ||
        rel.highlights.some((h) => h.text.toLowerCase().includes(q));
      return matchType && matchSearch;
    });
  }, [selectedType, searchQuery]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportReleases = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(RELEASES, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AlertX_Version_History_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Overview */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0f284e] to-[#1e3a8a] rounded-2xl p-6 text-white shadow-md border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Current Production: v2.4.2
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-200 border border-blue-400/20">
                Build a7f9204
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <History className="w-6 h-6 text-cyan-400" />
              Alert X Version History & Deployment Registry
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Official audit log of system releases, AOR GIS polygon calibrations, telemetry rule updates, and security patches for DOST-PHIVOLCS Alert X.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportReleases}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl border border-white/15 transition-colors shadow-2xs backdrop-blur-xs"
              title="Download full version release notes as JSON"
            >
              <Download className="w-3.5 h-3.5 text-cyan-300" />
              <span>Export Changelog</span>
            </button>
            {onNavigateToAudit && (
              <button
                type="button"
                onClick={onNavigateToAudit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>View System Audit</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Active Release
            </span>
            <span className="text-lg font-black font-mono text-cyan-300 mt-0.5 block">
              v2.4.2
            </span>
            <span className="text-[10px] text-slate-400">Deployed Oct 2026</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              AOR GIS Engine
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
              Leaflet 1.9.4
            </span>
            <span className="text-[10px] text-slate-400">15 Station Polygons</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Telemetry Revision
            </span>
            <span className="text-lg font-black font-mono text-amber-300 mt-0.5 block">
              REV-2026.10-A
            </span>
            <span className="text-[10px] text-slate-400">Camiguin / Bohol Sea</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
              Historical Releases
            </span>
            <span className="text-lg font-black font-mono text-white mt-0.5 block">
              {RELEASES.length} Versions
            </span>
            <span className="text-[10px] text-slate-400">Jan 2026 – Present</span>
          </div>
        </div>
      </div>

      {/* Tab Selector & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('releases')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'releases'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Application Releases ({RELEASES.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry_rules')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'telemetry_rules'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>AOR Telemetry Revisions ({TELEMETRY_RULES_REVISIONS.length})</span>
          </button>
        </div>

        {/* Filter and Search (For Releases tab) */}
        {activeTab === 'releases' && (
          <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              {['All', 'Major', 'Minor', 'Patch'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selectedType === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search changelog, build..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'releases' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Release List (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {filteredReleases.map((release) => {
              const isSelected = selectedRelease?.version === release.version;
              const isLatest = release.status === 'Current Production';

              return (
                <div
                  key={release.version}
                  onClick={() => setSelectedRelease(release)}
                  className={`bg-white rounded-xl border p-4.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-base text-slate-900">
                        {release.version}
                      </span>
                      {isLatest ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Current Production
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {release.releaseType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {release.releaseDate}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 mt-2">
                    {release.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {release.description}
                  </p>

                  {/* Highlights Summary Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    {release.highlights.slice(0, 3).map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100"
                      >
                        <Tag className="w-2.5 h-2.5 opacity-70" />
                        {h.category}
                      </span>
                    ))}
                    {release.highlights.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{release.highlights.length - 3} more
                      </span>
                    )}
                    <span className="ml-auto text-[11px] font-mono text-slate-400">
                      Commit: {release.commitHash}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredReleases.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No matching releases found</p>
                <p className="text-[11px] text-slate-400 mt-1">Try adjusting your filter or search query.</p>
              </div>
            )}
          </div>

          {/* Release Inspection Detail Card (5 Cols) */}
          <div className="lg:col-span-5 sticky top-4">
            {selectedRelease ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h2 className="text-sm font-bold text-white font-mono">
                        {selectedRelease.version} Release Specification
                      </h2>
                      <span className="text-[10px] text-slate-400">
                        {selectedRelease.releaseDate} • {selectedRelease.author}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(selectedRelease.commitHash)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 transition-colors"
                    title="Copy commit hash"
                  >
                    {copiedHash === selectedRelease.commitHash ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>{selectedRelease.commitHash}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {selectedRelease.title}
                    </h3>
                    <p className="text-slate-600 mt-1.5 leading-relaxed text-xs">
                      {selectedRelease.description}
                    </p>
                  </div>

                  {/* Highlights Detailed */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Key Capabilities & Changes
                    </h4>
                    <div className="space-y-2">
                      {selectedRelease.highlights.map((h, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80 flex items-start gap-2"
                        >
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 shrink-0 mt-0.5">
                            {h.category}
                          </span>
                          <span className="text-slate-700 text-xs leading-snug">
                            {h.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Enrolled Stations Impacted */}
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Target Station Scope
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedRelease.affectedStations.map((st) => (
                        <span
                          key={st}
                          className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Architecture Metadata */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Release Type</span>
                      <span className="font-semibold text-slate-800">
                        {selectedRelease.releaseType} Release
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Verification Status</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Passes CI/CD QA
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        /* Telemetry & GIS Revision Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                AOR Geodetic Boundary Revision Register
              </h2>
              <p className="text-xs text-slate-500">
                Historical record of geodetic snapping, buffer zone recalibration, and provincial boundary adjustments
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-700">
                  <th className="py-2.5 px-4 whitespace-nowrap">Revision ID</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Effective Date</th>
                  <th className="py-2.5 px-4">Station / Island Scope</th>
                  <th className="py-2.5 px-4">Recalibration Summary</th>
                  <th className="py-2.5 px-4 whitespace-nowrap">Certifying Engineer</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TELEMETRY_RULES_REVISIONS.map((rev) => (
                  <tr key={rev.revisionId} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {rev.revisionId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {rev.date}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {rev.scope}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-relaxed">
                      {rev.summary}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {rev.engineer}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {rev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
