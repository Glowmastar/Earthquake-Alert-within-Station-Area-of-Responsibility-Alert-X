/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatusCards } from './components/StatusCards';
import { MetricCards } from './components/MetricCards';
import { PhilippinesMap } from './components/PhilippinesMap';
import { AlertDeliveryCard } from './components/AlertDeliveryCard';
import { RecentAlertsTable } from './components/RecentAlertsTable';
import { EarthquakeModal } from './components/EarthquakeModal';

// Separate Views
import { EarthquakeRecordsView } from './views/EarthquakeRecordsView';
import { InsideAORRecordsView } from './views/InsideAORRecordsView';
import { OutsideAORRecordsView } from './views/OutsideAORRecordsView';
import { AORMapView } from './views/AORMapView';
import { BoundaryReviewView } from './views/BoundaryReviewView';
import { ExceptionReviewView } from './views/ExceptionReviewView';
import { RecipientsView } from './views/RecipientsView';
import { ContactInformationView } from './views/ContactInformationView';
import { IntensityReportsView } from './views/IntensityReportsView';
import { FieldIntensityReportsView } from './views/FieldIntensityReportsView';
import { SocialMediaView } from './views/SocialMediaView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { AORRulesView } from './views/AORRulesView';
import { RolesView } from './views/RolesView';
import { LoginView } from './views/LoginView';

import { INITIAL_EARTHQUAKES, INITIAL_RECIPIENTS } from './data/mockData';
import { EarthquakeRecord, Recipient, UserProfile, PRECONFIGURED_USERS } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('alertx_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email === 'palayanz@phivolcs.dost.gov.ph') {
          return PRECONFIGURED_USERS['palayanz@phivolcs.dost.gov.ph'];
        }
        return parsed;
      } catch {
        // ignore
      }
    }
    // Default to the requested Palayan Seismic Station account
    return PRECONFIGURED_USERS['palayanz@phivolcs.dost.gov.ph'];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('alertx_auth') !== 'false';
  });
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [recordFilter, setRecordFilter] = useState<string>('INSIDE_AOR');
  const [mapSubView, setMapSubView] = useState<'STATION_BOUNDARIES' | 'BOUNDARY_REVIEW'>('BOUNDARY_REVIEW');
  const [settingsSubView, setSettingsSubView] = useState<'AOR_RULES' | 'EQINFO_SOURCE' | 'ROLES'>('ROLES');
  const [exceptionFilter, setExceptionFilter] = useState<string>('ALL');

  // Main State
  const [earthquakes, setEarthquakes] = useState<EarthquakeRecord[]>(INITIAL_EARTHQUAKES);
  const [recipients, setRecipients] = useState<Recipient[]>(INITIAL_RECIPIENTS);
  const [selectedEarthquake, setSelectedEarthquake] = useState<EarthquakeRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Scoped Earthquakes: When logged in as Palayan Seismic Station (PCP), ONLY display AOR within PCP!
  const scopedEarthquakes = useMemo(() => {
    if (currentUser?.assignedAor && currentUser.assignedAor !== 'ALL') {
      return earthquakes.filter((eq) => eq.aor === currentUser.assignedAor);
    }
    return earthquakes;
  }, [earthquakes, currentUser]);

  // Scoped Recipients: When logged in as Palayan Station, only display recipients registered under PCP!
  const scopedRecipients = useMemo(() => {
    if (currentUser?.assignedAor && currentUser.assignedAor !== 'ALL') {
      return recipients.filter((r) => r.aor === currentUser.assignedAor);
    }
    return recipients;
  }, [recipients, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Quick action to approve an exception review event
  const handleApproveReview = (id: string) => {
    setEarthquakes((prev) =>
      prev.map((eq) =>
        eq.id === id
          ? {
              ...eq,
              status: 'Alert Sent',
              alertDetails: {
                ...eq.alertDetails,
                sentAt: 'Just now (Approved by Admin)',
                deliveryRate: '100%',
                notes: 'Manual review completed: Approved and email dispatch triggered to AOR recipients.',
              },
            }
          : eq
      )
    );
    showToast(`Event ${id} approved and dispatched to AOR distribution list.`);
  };

  const handleResendAlert = (record: EarthquakeRecord) => {
    showToast(`Alert bulletin re-dispatched to all contacts in ${record.aor} AOR.`);
  };

  const handleAddRecipient = (newRec: Recipient) => {
    setRecipients((prev) => [newRec, ...prev]);
    showToast(`New recipient ${newRec.name} added to ${newRec.aor} sector.`);
  };

  const fetchLivePhivolcsData = async (silent: boolean = false) => {
    try {
      const res = await fetch('/api/phivolcs-earthquakes');
      if (res.ok) {
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          setEarthquakes(data.records);
          if (!silent) {
            showToast(`Synchronized ${data.records.length} live earthquakes from earthquake.phivolcs.dost.gov.ph`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch PHIVOLCS live data:', err);
    }
  };

  useEffect(() => {
    fetchLivePhivolcsData(true);
  }, []);

  const handleRefreshData = () => {
    fetchLivePhivolcsData(false);
  };

  const handleRunAorCheck = () => {
    showToast('AOR Geofence check completed. 24 records verified against active shapefile perimeters.');
  };

  const handleSendPendingAlerts = () => {
    // Approve any pending review or send alerts
    setEarthquakes((prev) =>
      prev.map((eq) =>
        eq.status === 'For Review'
          ? {
              ...eq,
              status: 'Alert Sent',
              alertDetails: {
                ...eq.alertDetails,
                sentAt: 'Just now',
                deliveryRate: '100%',
                notes: 'Dispatched via bulk pending alert action.',
              },
            }
          : eq
      )
    );
    showToast('Pending alerts dispatched to emergency response contacts.');
  };

  const handleExportReport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Time,Location,Magnitude,Depth,AOR,Status']
        .concat(
          earthquakes.map(
            (e) =>
              `"${e.id}","${e.timePHT}","${e.location}",${e.magnitude},${e.depthKm},"${e.aor}","${e.status}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AOR_Seismic_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export report downloaded successfully.');
  };

  const navigateTo = (view: string, filter?: string) => {
    setCurrentView(view);
    if (view === 'records') {
      if (filter) {
        setRecordFilter(filter);
      }
    } else if (view === 'map') {
      if (filter === 'BOUNDARY_REVIEW' || filter === 'STATION_BOUNDARIES') {
        setMapSubView(filter);
      }
    } else if (view === 'exceptions') {
      if (filter) {
        setExceptionFilter(filter);
      } else {
        setExceptionFilter('ALL');
      }
    } else if (view === 'settings') {
      if (filter === 'EQINFO_SOURCE' || filter === 'AOR_RULES' || filter === 'ROLES') {
        setSettingsSubView(filter);
      } else {
        setSettingsSubView('ROLES');
      }
    } else if (view === 'roles') {
      setCurrentView('settings');
      setSettingsSubView('ROLES');
    }
    setIsMobileSidebarOpen(false);
  };

  // Header Titles
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'records':
        return {
          title:
            recordFilter === 'INSIDE_AOR'
              ? 'Inside AOR Earthquake Records'
              : recordFilter === 'OUTSIDE_AOR'
              ? 'Outside AOR Earthquake Records'
              : 'Earthquake Records',
          subtitle:
            recordFilter === 'INSIDE_AOR'
              ? 'Review earthquake events matched within approved station Areas of Responsibility'
              : recordFilter === 'OUTSIDE_AOR'
              ? 'Review earthquake events located beyond station perimeters and oceanic boundary buffer zones'
              : 'Monitor, classify, and review earthquake events from EQInfo',
          breadcrumb:
            recordFilter === 'INSIDE_AOR'
              ? 'Earthquake Records / Inside AOR'
              : recordFilter === 'OUTSIDE_AOR'
              ? 'Earthquake Records / Outside AOR'
              : 'Earthquake Records / All Records',
          subtitleClassName:
            recordFilter === 'INSIDE_AOR' || recordFilter === 'OUTSIDE_AOR'
              ? 'text-xs text-blue-600 font-normal mt-0.5'
              : undefined,
        };
      case 'map':
        if (mapSubView === 'BOUNDARY_REVIEW') {
          return {
            title: 'Boundary Review',
            subtitle: 'Review boundary exceptions, GIS validation results, and station AOR assignments',
            breadcrumb: 'AOR Map / Boundary Review',
            subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
          };
        }
        return {
          title: 'Station Boundaries',
          subtitle: 'View and manage approved station Areas of Responsibility',
          breadcrumb: 'AOR Map / Station Boundaries',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'exceptions':
        return {
          title: 'Exception Review',
          subtitle: 'Resolve boundary, offshore, duplicate, ambiguous, and corrected earthquake records',
          breadcrumb: 'Exception Review',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'recipients':
        return {
          title: 'Recipients',
          subtitle: 'Manage station personnel, email verification, and earthquake-alert delivery routing',
          breadcrumb: 'Recipients',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'contacts':
        return {
          title: 'Contact Information Directory',
          subtitle: 'Manage official station, personnel, office, and emergency contact information',
          breadcrumb: 'Contact Information Directory',
          titleClassName: 'text-2xl font-black text-blue-600 tracking-tight leading-tight',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'intensity-field':
        return {
          title: 'Field Intensity Reports',
          subtitle: 'Review, verify, and correlate citizen and DRRMO felt intensity observations',
          breadcrumb: 'Intensity Reports / Field Intensity Reports',
          titleClassName: 'text-2xl font-black text-blue-700 tracking-tight leading-tight',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'intensity':
        return {
          title: 'Intensity Consolidator',
          subtitle: 'Consolidate town-level observed and instrumental earthquake-intensity reports',
          breadcrumb: 'Intensity Reports / Intensity Consolidator',
          titleClassName: 'text-2xl font-black text-blue-700 tracking-tight leading-tight',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'social-media':
        return {
          title: 'Social Media',
          subtitle: 'Prepare, review, approve, and publish earthquake-intensity updates for official social-media channels',
          breadcrumb: 'Intensity Reports / Social Media',
          titleClassName: 'text-2xl font-black text-blue-600 tracking-tight leading-tight',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'audit':
        return {
          title: 'Audit Log',
          subtitle: 'Track earthquake decisions, AOR classifications, alert delivery, and system activity',
          breadcrumb: 'Audit Log',
          titleClassName: 'text-2xl font-black text-blue-600 tracking-tight leading-tight',
          subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
        };
      case 'settings':
        if (settingsSubView === 'ROLES') {
          return {
            title: 'Roles & Permissions',
            subtitle: 'Manage capability-based access and station-scoped permissions',
            breadcrumb: 'Administration / Roles',
            titleClassName: 'text-2xl font-bold text-blue-600 tracking-tight leading-tight',
            subtitleClassName: 'text-xs text-blue-500 font-normal mt-0.5',
          };
        }
        if (settingsSubView === 'AOR_RULES') {
          return {
            title: 'AOR Rules',
            subtitle: 'Configure geographic classification, alert decisions, boundary handling, and station assignment rules',
            breadcrumb: 'Administration / AOR Rules',
            titleClassName: 'text-2xl font-black text-blue-700 tracking-tight leading-tight',
            subtitleClassName: 'text-xs text-blue-600 font-normal mt-0.5',
          };
        }
        return {
          title: 'EQInfo Source',
          subtitle: 'Manage earthquake data source connection and synchronization',
          breadcrumb: 'Administration / EQInfo Source',
          titleClassName: 'text-2xl font-bold text-blue-600 tracking-tight leading-tight',
          subtitleClassName: 'text-xs text-blue-500 font-normal mt-0.5',
        };
      case 'roles':
        return {
          title: 'Roles & Permissions',
          subtitle: 'Manage capability-based access and station-scoped permissions',
          breadcrumb: 'Administration / Roles',
          titleClassName: 'text-2xl font-bold text-blue-600 tracking-tight leading-tight',
          subtitleClassName: 'text-xs text-blue-500 font-normal mt-0.5',
        };
      case 'dashboard':
      default:
        return {
          title: 'Earthquake Monitoring Dashboard',
          subtitle: 'Real-time monitoring, AOR classification, and email alert management',
          breadcrumb: 'Dashboard',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const reviewCount = scopedEarthquakes.filter((e: EarthquakeRecord) => e.status === 'For Review').length;

  // Metric counts dynamically scoped to user's AOR
  const scopedNewCount = scopedEarthquakes.length;
  const scopedInsideCount = scopedEarthquakes.filter(
    (e: EarthquakeRecord) => e.aorStatus === 'Inside' || e.status !== 'Outside AOR'
  ).length;
  const scopedInsidePct =
    scopedNewCount > 0
      ? `(${((scopedInsideCount / scopedNewCount) * 100).toFixed(1)}%)`
      : '(100.0%)';
  const scopedSentCount = scopedEarthquakes.filter((e: EarthquakeRecord) => e.status === 'Alert Sent').length;
  const scopedSentPct =
    scopedNewCount > 0
      ? `(${((scopedSentCount / scopedNewCount) * 100).toFixed(1)}%)`
      : '(0.0%)';
  const scopedOutsideCount = scopedEarthquakes.filter((e: EarthquakeRecord) => e.status === 'Outside AOR').length;
  const scopedOutsidePct =
    scopedNewCount > 0
      ? `(${((scopedOutsideCount / scopedNewCount) * 100).toFixed(1)}%)`
      : '(0.0%)';
  const scopedReviewPct =
    scopedNewCount > 0
      ? `(${((reviewCount / scopedNewCount) * 100).toFixed(1)}%)`
      : '(0.0%)';

  if (!isAuthenticated) {
    return (
      <LoginView
        onLogin={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('alertx_auth', 'true');
          localStorage.setItem('alertx_current_user', JSON.stringify(user));
          showToast(
            `Welcome, ${user.name}! ${
              user.assignedAor === 'PCP'
                ? 'Portal scoped exclusively to Palayan AOR (PCP).'
                : 'Central administrator access active.'
            }`
          );
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans antialiased text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        currentFilter={
          currentView === 'settings'
            ? settingsSubView
            : currentView === 'map'
            ? mapSubView
            : currentView === 'exceptions'
            ? exceptionFilter
            : recordFilter
        }
        currentMapSubView={mapSubView}
        onNavigate={navigateTo}
        reviewCount={reviewCount}
        recipientCount={scopedRecipients.length}
        currentUser={currentUser}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full min-w-0">
        {/* Top Header */}
        <Header
          title={headerInfo.title}
          subtitle={
            currentUser.assignedAor === 'PCP'
              ? `${headerInfo.subtitle} • Scoped to Palayan Station (PCP AOR)`
              : headerInfo.subtitle
          }
          breadcrumb={headerInfo.breadcrumb}
          titleClassName={headerInfo.titleClassName}
          subtitleClassName={headerInfo.subtitleClassName}
          currentUser={currentUser}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          onLogout={() => {
            setIsAuthenticated(false);
            localStorage.setItem('alertx_auth', 'false');
            showToast('You have been logged out.');
          }}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Station Restriction Notice Banner if logged in as Palayan Station */}
          {currentUser.assignedAor === 'PCP' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
                <span>
                  <strong>Station View Active:</strong> You are logged in with the <strong>Palayan Seismic Station</strong> user account (<code>{currentUser.email}</code>). Only earthquake records, alerts, and recipients within the <strong>PCP AOR</strong> are displayed.
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-300 shrink-0 ml-2">
                PCP AOR Only
              </span>
            </div>
          )}

          {currentView === 'dashboard' && (
            <>
              {/* Row 1: System Status Cards (4 cards) */}
              <StatusCards />

              {/* Row 2: 5 Metric Cards */}
              <MetricCards
                onNavigate={navigateTo}
                newCount={scopedNewCount}
                insideCount={scopedInsideCount}
                insidePct={scopedInsidePct}
                sentCount={scopedSentCount}
                sentPct={scopedSentPct}
                outsideCount={scopedOutsideCount}
                outsidePct={scopedOutsidePct}
                reviewCount={reviewCount}
                reviewPct={scopedReviewPct}
              />

              {/* Row 3: 2-Column Split: Map on Left, Recent Alerts Table + Alert Delivery Summary on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* Left: Philippines AOR Monitoring Map (7 cols) */}
                <div className="lg:col-span-7 flex flex-col min-h-[580px]">
                  <PhilippinesMap
                    earthquakes={scopedEarthquakes}
                    onSelectEarthquake={setSelectedEarthquake}
                    selectedEarthquake={selectedEarthquake}
                    selectedAorFilter={currentUser.assignedAor === 'PCP' ? 'PCP' : 'ALL'}
                  />
                </div>

                {/* Right: Recent AOR Alerts Table & Alert Delivery Summary (5 cols) */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  <RecentAlertsTable
                    records={scopedEarthquakes}
                    onSelectRecord={setSelectedEarthquake}
                    onViewAllRecords={() => navigateTo('records', 'ALL')}
                    onRefreshData={handleRefreshData}
                    onRunAorCheck={handleRunAorCheck}
                    onSendPendingAlerts={handleSendPendingAlerts}
                    onExportReport={handleExportReport}
                  />

                  <AlertDeliveryCard
                    onViewRecipients={() => setCurrentView('recipients')}
                  />
                </div>
              </div>
            </>
          )}

          {currentView === 'records' && (
            recordFilter === 'INSIDE_AOR' ? (
              <InsideAORRecordsView
                records={scopedEarthquakes}
                onSelectRecord={setSelectedEarthquake}
                onOpenMap={() => navigateTo('map')}
              />
            ) : recordFilter === 'OUTSIDE_AOR' ? (
              <OutsideAORRecordsView
                records={scopedEarthquakes}
                onSelectRecord={setSelectedEarthquake}
                onOpenMap={() => navigateTo('map')}
              />
            ) : (
              <EarthquakeRecordsView
                records={scopedEarthquakes}
                initialFilter={recordFilter}
                onSelectRecord={setSelectedEarthquake}
              />
            )
          )}

          {currentView === 'map' && (
            mapSubView === 'BOUNDARY_REVIEW' ? (
              <BoundaryReviewView
                onOpenMap={() => setMapSubView('STATION_BOUNDARIES')}
                currentUser={currentUser}
              />
            ) : (
              <AORMapView
                earthquakes={scopedEarthquakes}
                onSelectEarthquake={setSelectedEarthquake}
                onNavigateToRecords={() => navigateTo('records', 'INSIDE_AOR')}
                currentUser={currentUser}
              />
            )
          )}

          {currentView === 'exceptions' && (
            <ExceptionReviewView
              records={scopedEarthquakes}
              initialFilter={exceptionFilter}
              onApprove={handleApproveReview}
              onSelectRecord={setSelectedEarthquake}
              onOpenMap={() => navigateTo('map', 'STATION_BOUNDARIES')}
              onOpenRecord={() => navigateTo('records', 'ALL')}
            />
          )}

          {currentView === 'recipients' && (
            <RecipientsView
              recipients={scopedRecipients}
              onAddRecipient={handleAddRecipient}
            />
          )}

          {currentView === 'contacts' && <ContactInformationView currentUser={currentUser} />}

          {currentView === 'intensity-field' && (
            <FieldIntensityReportsView
              onNavigateToConsolidator={() => setCurrentView('intensity')}
              onNavigateToSocialMedia={() => setCurrentView('social-media')}
            />
          )}

          {currentView === 'intensity' && (
            <IntensityReportsView
              onNavigateToSocialMedia={() => setCurrentView('social-media')}
              onNavigateToFieldReports={() => setCurrentView('intensity-field')}
            />
          )}

          {currentView === 'social-media' && (
            <SocialMediaView
              onNavigateToFieldReports={() => setCurrentView('intensity-field')}
              onNavigateToConsolidator={() => setCurrentView('intensity')}
            />
          )}

          {currentView === 'audit' && (
            <AuditLogView
              onOpenEvent={(eventId) => {
                const eq = earthquakes.find((e) => e.id === eventId || eventId.includes(e.id));
                if (eq) {
                  setSelectedEarthquake(eq);
                } else {
                  setRecordFilter('ALL');
                  setCurrentView('records');
                }
              }}
              onOpenMap={() => {
                setMapSubView('STATION_BOUNDARIES');
                setCurrentView('map');
              }}
            />
          )}

          {currentView === 'settings' && (
            settingsSubView === 'ROLES' ? (
              <RolesView onNavigateToAudit={() => navigateTo('audit')} />
            ) : settingsSubView === 'AOR_RULES' ? (
              <AORRulesView currentUser={currentUser} />
            ) : (
              <SettingsView onSync={handleRefreshData} />
            )
          )}

          {currentView === 'roles' && (
            <RolesView onNavigateToAudit={() => navigateTo('audit')} />
          )}
        </main>
      </div>

      {/* Detailed Earthquake Inspection & Action Modal */}
      <EarthquakeModal
        earthquake={selectedEarthquake}
        onClose={() => setSelectedEarthquake(null)}
        onApproveReview={handleApproveReview}
        onResendAlert={handleResendAlert}
      />
    </div>
  );
}
