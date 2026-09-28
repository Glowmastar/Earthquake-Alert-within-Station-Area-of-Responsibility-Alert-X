import React, { useState, useMemo } from 'react';
import {
  Users,
  Mail,
  AlertTriangle,
  Building2,
  Info,
  X,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Plus,
  Edit2,
  CheckCircle2,
  Send,
  Check,
  Ban,
  Download,
} from 'lucide-react';

export type RecipientRole = 'Station Personnel' | 'Administrative Recipient';
export type VerificationStatus = 'Verified' | 'Pending Verification' | 'Missing Email';
export type AccountStatus = 'Active' | 'Pending Setup' | 'Disabled';
export type AlertScope = 'Station AOR Alerts' | 'All AOR Alerts';

export interface RecipientRecord {
  id: string;
  stationCode: string;
  stationName: string;
  recipientName: string;
  role: RecipientRole;
  emailAddress: string;
  contactNumber: string;
  verificationStatus: VerificationStatus;
  alertScope: AlertScope;
  accountStatus: AccountStatus;
  lastVerified: string;
  lastAlertSent: string;
}

const INITIAL_RECIPIENTS: RecipientRecord[] = [
  {
    id: 'REC-000',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    recipientName: 'Glyn Bryan Ebardo',
    role: 'Administrative Recipient',
    emailAddress: 'ebardo.glynbryan1@gmail.com',
    contactNumber: '0917 888 2345',
    verificationStatus: 'Verified',
    alertScope: 'Station AOR Alerts',
    accountStatus: 'Active',
    lastVerified: 'Verified & Active',
    lastAlertSent: 'Just now (Test Alert Dispatched)',
  },
  {
    id: 'REC-001',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    recipientName: 'Wilmer A. Legaspi',
    role: 'Station Personnel',
    emailAddress: 'wilmer.legaspi@phivolcs.gov.ph',
    contactNumber: '0917 123 4567',
    verificationStatus: 'Verified',
    alertScope: 'Station AOR Alerts',
    accountStatus: 'Active',
    lastVerified: 'Apr 10, 2025 09:15 AM',
    lastAlertSent: 'Apr 23, 2025 07:34 AM',
  },
  {
    id: 'REC-002',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    recipientName: 'Evelyn B. Seranado',
    role: 'Station Personnel',
    emailAddress: '',
    contactNumber: '0918 765 4321',
    verificationStatus: 'Missing Email',
    alertScope: 'Station AOR Alerts',
    accountStatus: 'Pending Setup',
    lastVerified: '—',
    lastAlertSent: '—',
  },
  {
    id: 'REC-003',
    stationCode: 'CGP',
    stationName: 'Cagayan de Oro Seismic Station',
    recipientName: 'Mark Louegie Juarbal',
    role: 'Station Personnel',
    emailAddress: 'mark.juarbal@phivolcs.gov.ph',
    contactNumber: '0920 555 0101',
    verificationStatus: 'Verified',
    alertScope: 'Station AOR Alerts',
    accountStatus: 'Active',
    lastVerified: 'Apr 12, 2025 02:40 PM',
    lastAlertSent: 'Apr 22, 2025 04:18 PM',
  },
  {
    id: 'REC-004',
    stationCode: 'QVP',
    stationName: 'Main Office',
    recipientName: 'Glyn Bryan Ebardo',
    role: 'Administrative Recipient',
    emailAddress: 'glyn.ebardo@phivolcs.gov.ph',
    contactNumber: '0917 888 2345',
    verificationStatus: 'Pending Verification',
    alertScope: 'All AOR Alerts',
    accountStatus: 'Active',
    lastVerified: 'Pending verification email',
    lastAlertSent: 'Apr 21, 2025 11:32 AM',
  },
];

interface RecipientsViewProps {
  recipients?: any[];
  onAddRecipient?: (recipient: any) => void;
}

export const RecipientsView: React.FC<RecipientsViewProps> = ({ onAddRecipient: _onAddRecipient }) => {
  const [recipients, setRecipients] = useState<RecipientRecord[]>(INITIAL_RECIPIENTS);
  const [selectedId, setSelectedId] = useState<string>('REC-001');
  const [bannerVisible, setBannerVisible] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stationFilter, setStationFilter] = useState('All Stations');
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [verificationFilter, setVerificationFilter] = useState('All Statuses');
  const [accountStatusFilter, setAccountStatusFilter] = useState('All Statuses');

  // Modals & User Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form State for Add / Edit
  const [formStationCode, setFormStationCode] = useState('PCP');
  const [formStationName, setFormStationName] = useState('Palayan Seismic Station');
  const [formRecipientName, setFormRecipientName] = useState('');
  const [formRole, setFormRole] = useState<RecipientRole>('Station Personnel');
  const [formEmail, setFormEmail] = useState('');
  const [formContactNumber, setFormContactNumber] = useState('');
  const [formAlertScope, setFormAlertScope] = useState<AlertScope>('Station AOR Alerts');

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const selectedRecipient = useMemo(() => {
    return recipients.find((r) => r.id === selectedId) || recipients[0];
  }, [recipients, selectedId]);

  // Metrics
  const metrics = useMemo(() => {
    const total = recipients.length;
    const verified = recipients.filter((r) => r.verificationStatus === 'Verified').length;
    const missing = recipients.filter((r) => r.verificationStatus === 'Missing Email' || !r.emailAddress).length;
    const activeStationsCount = new Set(recipients.map((r) => r.stationCode)).size;

    return {
      total,
      verifiedCount: verified,
      verifiedPct: total > 0 ? ((verified / total) * 100).toFixed(1) : '0.0',
      missingCount: missing,
      missingPct: total > 0 ? ((missing / total) * 100).toFixed(1) : '0.0',
      activeStations: activeStationsCount,
      activeStationsPct: '100.0',
    };
  }, [recipients]);

  // Filtered Recipients
  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.recipientName.toLowerCase().includes(q) ||
          r.emailAddress.toLowerCase().includes(q) ||
          r.stationCode.toLowerCase().includes(q) ||
          r.stationName.toLowerCase().includes(q) ||
          r.contactNumber.includes(q);
        if (!match) return false;
      }
      if (stationFilter !== 'All Stations' && r.stationCode !== stationFilter) {
        return false;
      }
      if (roleFilter !== 'All Roles' && r.role !== roleFilter) {
        return false;
      }
      if (verificationFilter !== 'All Statuses' && r.verificationStatus !== verificationFilter) {
        return false;
      }
      if (accountStatusFilter !== 'All Statuses' && r.accountStatus !== accountStatusFilter) {
        return false;
      }
      return true;
    });
  }, [recipients, searchQuery, stationFilter, roleFilter, verificationFilter, accountStatusFilter]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStationFilter('All Stations');
    setRoleFilter('All Roles');
    setVerificationFilter('All Statuses');
    setAccountStatusFilter('All Statuses');
    showNotification('Recipients filters reset.');
  };

  const openEditModal = () => {
    if (!selectedRecipient) return;
    setFormStationCode(selectedRecipient.stationCode);
    setFormStationName(selectedRecipient.stationName);
    setFormRecipientName(selectedRecipient.recipientName);
    setFormRole(selectedRecipient.role);
    setFormEmail(selectedRecipient.emailAddress);
    setFormContactNumber(selectedRecipient.contactNumber);
    setFormAlertScope(selectedRecipient.alertScope);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipient) return;
    const isEmailProvided = formEmail.trim().length > 0;
    const newVerificationStatus: VerificationStatus = isEmailProvided
      ? formEmail === selectedRecipient.emailAddress && selectedRecipient.verificationStatus === 'Verified'
        ? 'Verified'
        : 'Pending Verification'
      : 'Missing Email';

    setRecipients((prev) =>
      prev.map((r) =>
        r.id === selectedRecipient.id
          ? {
              ...r,
              stationCode: formStationCode,
              stationName: formStationName,
              recipientName: formRecipientName,
              role: formRole,
              emailAddress: formEmail.trim(),
              contactNumber: formContactNumber,
              alertScope: formAlertScope,
              verificationStatus: newVerificationStatus,
              accountStatus: isEmailProvided ? 'Active' : 'Pending Setup',
            }
          : r
      )
    );
    setIsEditModalOpen(false);
    showNotification(`Recipient ${formRecipientName} updated successfully.`);
  };

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecipientName.trim()) return;
    const isEmailProvided = formEmail.trim().length > 0;
    const newRec: RecipientRecord = {
      id: `REC-00${recipients.length + 1}`,
      stationCode: formStationCode,
      stationName: formStationName,
      recipientName: formRecipientName,
      role: formRole,
      emailAddress: formEmail.trim(),
      contactNumber: formContactNumber,
      verificationStatus: isEmailProvided ? 'Pending Verification' : 'Missing Email',
      alertScope: formAlertScope,
      accountStatus: isEmailProvided ? 'Active' : 'Pending Setup',
      lastVerified: isEmailProvided ? 'Pending verification link' : '—',
      lastAlertSent: '—',
    };
    setRecipients((prev) => [...prev, newRec]);
    setSelectedId(newRec.id);
    setIsAddModalOpen(false);
    showNotification(`Added new recipient ${formRecipientName}.`);
  };

  const handleVerifyEmail = () => {
    if (!selectedRecipient) return;
    if (!selectedRecipient.emailAddress) {
      showNotification('Cannot verify recipient with missing email address. Please edit and provide an email first.');
      return;
    }
    setRecipients((prev) =>
      prev.map((r) =>
        r.id === selectedRecipient.id
          ? {
              ...r,
              verificationStatus: 'Verified',
              lastVerified: 'Apr 23, 2025 10:43 AM',
            }
          : r
      )
    );
    showNotification(`Verification email confirmed for ${selectedRecipient.recipientName} (${selectedRecipient.emailAddress}).`);
  };

  const handleSendTestAlert = () => {
    if (!selectedRecipient) return;
    if (selectedRecipient.verificationStatus !== 'Verified' && !selectedRecipient.emailAddress) {
      showNotification(`Alert failed: ${selectedRecipient.recipientName} does not have a verified email address.`);
      return;
    }
    showNotification(
      `Test earthquake alert sent to ${selectedRecipient.recipientName} (${selectedRecipient.emailAddress || 'No Email'}).`
    );
  };

  const handleToggleDisabled = () => {
    if (!selectedRecipient) return;
    const newStatus: AccountStatus = selectedRecipient.accountStatus === 'Disabled' ? 'Active' : 'Disabled';
    setRecipients((prev) =>
      prev.map((r) =>
        r.id === selectedRecipient.id
          ? {
              ...r,
              accountStatus: newStatus,
            }
          : r
      )
    );
    showNotification(`Recipient ${selectedRecipient.recipientName} account is now ${newStatus}.`);
  };

  const handleExportRecipients = () => {
    const headers = [
      'Station Code',
      'Station Name',
      'Recipient Name',
      'Role',
      'Email Address',
      'Contact Number',
      'Verification Status',
      'Alert Scope',
      'Account Status',
      'Last Verified',
      'Last Alert Sent',
    ];
    const rows = filteredRecipients.map((r) => [
      `"${r.stationCode}"`,
      `"${r.stationName}"`,
      `"${r.recipientName}"`,
      `"${r.role}"`,
      `"${r.emailAddress || '—'}"`,
      `"${r.contactNumber}"`,
      `"${r.verificationStatus}"`,
      `"${r.alertScope}"`,
      `"${r.accountStatus}"`,
      `"${r.lastVerified}"`,
      `"${r.lastAlertSent}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Station_Recipients_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Recipient distribution list exported as CSV.');
  };

  // Delivery readiness count
  const readyCount = useMemo(() => {
    return recipients.filter((r) => r.verificationStatus === 'Verified').length;
  }, [recipients]);

  const readyPct = useMemo(() => {
    return recipients.length > 0 ? ((readyCount / recipients.length) * 100).toFixed(1) : '0.0';
  }, [readyCount, recipients.length]);

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-8 relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium">
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

      {/* Row 1: KPI Metric Cards (4 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Recipients */}
        <button
          type="button"
          onClick={() => handleClearFilters()}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 fill-blue-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-blue-700">Total Recipients</span>
            <span className="text-3xl font-bold text-blue-600 mt-0.5 block leading-tight">
              {metrics.total}
            </span>
          </div>
        </button>

        {/* Card 2: Verified Emails */}
        <button
          type="button"
          onClick={() => setVerificationFilter('Verified')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 fill-emerald-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-emerald-700">Verified Emails</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-emerald-600 leading-tight">
                {metrics.verifiedCount}
              </span>
              <span className="text-xs font-medium text-emerald-500">
                ({metrics.verifiedPct}%)
              </span>
            </div>
          </div>
        </button>

        {/* Card 3: Missing Emails */}
        <button
          type="button"
          onClick={() => setVerificationFilter('Missing Email')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-rose-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 fill-rose-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-rose-700">Missing Emails</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-rose-600 leading-tight">
                {metrics.missingCount}
              </span>
              <span className="text-xs font-medium text-rose-500">
                ({metrics.missingPct}%)
              </span>
            </div>
          </div>
        </button>

        {/* Card 4: Active Stations */}
        <button
          type="button"
          onClick={() => setStationFilter('All Stations')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 fill-blue-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-blue-700">Active Stations</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-bold text-blue-600 leading-tight">
                {metrics.activeStations}
              </span>
              <span className="text-xs font-medium text-blue-500">
                ({metrics.activeStationsPct}%)
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Row 2: Info Alert Notice Banner */}
      {bannerVisible && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <span className="font-normal text-blue-900">
              Automatic earthquake alerts must not be sent to blank or unverified email addresses. Please verify all recipient email addresses before enabling alert delivery.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className="text-blue-500 hover:text-blue-800 p-1 rounded-md transition-colors shrink-0"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 3: Search and Filter Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Search recipients */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Search recipients
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, station..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Station Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Station</label>
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Stations</option>
              <option>PCP</option>
              <option>BIP</option>
              <option>CGP</option>
              <option>QVP</option>
            </select>
          </div>

          {/* Recipient Role Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Recipient Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Roles</option>
              <option>Station Personnel</option>
              <option>Administrative Recipient</option>
            </select>
          </div>

          {/* Verification Status Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Verification Status
            </label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Statuses</option>
              <option>Verified</option>
              <option>Pending Verification</option>
              <option>Missing Email</option>
            </select>
          </div>

          {/* Account Status Dropdown */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Account Status
            </label>
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Pending Setup</option>
              <option>Disabled</option>
            </select>
          </div>

          {/* Filter & Clear Action Buttons */}
          <div className="lg:col-span-1 flex items-center gap-1.5 justify-end">
            <button
              type="button"
              onClick={() => showNotification('Filters updated.')}
              className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-8 px-2.5 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Recipients Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-blue-50/50 border-b border-slate-200 text-slate-700 font-semibold select-none">
                <th className="py-2.5 px-3 whitespace-nowrap">Station Code</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Station Name</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Recipient Name</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Role</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Email Address</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Contact Number</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Verification Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Alert Scope</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Account Status</th>
                <th className="py-2.5 px-3 whitespace-nowrap text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecipients.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-100/70 border-l-4 border-l-blue-600 font-medium'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    {/* Station Code */}
                    <td className="py-2.5 px-3 font-bold text-blue-600 whitespace-nowrap">
                      {item.stationCode}
                    </td>

                    {/* Station Name */}
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {item.stationName}
                    </td>

                    {/* Recipient Name */}
                    <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {item.recipientName}
                    </td>

                    {/* Role */}
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                      {item.role}
                    </td>

                    {/* Email Address */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.emailAddress ? (
                        <span className="text-blue-600">{item.emailAddress}</span>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>

                    {/* Contact Number */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                      {item.contactNumber}
                    </td>

                    {/* Verification Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.verificationStatus === 'Verified' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Verified
                        </span>
                      )}
                      {item.verificationStatus === 'Missing Email' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                          Missing Email
                        </span>
                      )}
                      {item.verificationStatus === 'Pending Verification' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Pending Verification
                        </span>
                      )}
                    </td>

                    {/* Alert Scope */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {item.alertScope}
                      </span>
                    </td>

                    {/* Account Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.accountStatus === 'Active' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                      {item.accountStatus === 'Pending Setup' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Pending Setup
                        </span>
                      )}
                      {item.accountStatus === 'Disabled' && (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(item.id);
                        }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 5: Split Lower Section (Recipient Details Left + Delivery Readiness Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Panel: Recipient Details (~5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with blue vertical bar */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
              <h2 className="text-base font-bold text-slate-900">Recipient Details</h2>
            </div>

            {/* Recipient Field List */}
            <div className="space-y-2.5 text-xs">
              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Station Code</span>
                <span className="col-span-7 font-bold text-blue-600">{selectedRecipient.stationCode}</span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Station Name</span>
                <span className="col-span-7 text-slate-800 font-medium">{selectedRecipient.stationName}</span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Recipient Name</span>
                <span className="col-span-7 text-slate-800 font-bold">{selectedRecipient.recipientName}</span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Role</span>
                <span className="col-span-7 text-slate-800">{selectedRecipient.role}</span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Email Address</span>
                <span className="col-span-7 text-blue-600 font-medium">
                  {selectedRecipient.emailAddress || <span className="text-slate-400">—</span>}
                </span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Contact Number</span>
                <span className="col-span-7 font-mono text-slate-800">{selectedRecipient.contactNumber}</span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Alert Scope</span>
                <span className="col-span-7 text-blue-700 font-semibold">{selectedRecipient.alertScope}</span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Verification Status</span>
                <span className="col-span-7">
                  {selectedRecipient.verificationStatus === 'Verified' && (
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  )}
                  {selectedRecipient.verificationStatus === 'Missing Email' && (
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                      Missing Email
                    </span>
                  )}
                  {selectedRecipient.verificationStatus === 'Pending Verification' && (
                    <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      Pending Verification
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                <span className="col-span-5 font-semibold text-slate-700">Last Verified</span>
                <span className="col-span-7 text-slate-800 font-medium">{selectedRecipient.lastVerified}</span>
              </div>

              <div className="grid grid-cols-12 py-1">
                <span className="col-span-5 font-semibold text-slate-700">Last Alert Sent</span>
                <span className="col-span-7 text-slate-800 font-medium">{selectedRecipient.lastAlertSent}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Delivery Readiness (~7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with blue envelope icon */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">Delivery Readiness</h2>
            </div>

            {/* Delivery Readiness Mini Table */}
            <div className="border border-slate-200/80 rounded-lg overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-blue-50/50 border-b border-slate-200 text-slate-700 font-semibold select-none">
                    <th className="py-2 px-3 whitespace-nowrap">Station Code</th>
                    <th className="py-2 px-3 whitespace-nowrap">Station Name</th>
                    <th className="py-2 px-3 whitespace-nowrap">Email Address</th>
                    <th className="py-2 px-3 whitespace-nowrap text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipients.map((rec) => {
                    const isReady = rec.verificationStatus === 'Verified';
                    const isMissing = !rec.emailAddress || rec.verificationStatus === 'Missing Email';
                    const isPending = rec.verificationStatus === 'Pending Verification';

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-blue-600 whitespace-nowrap">
                          {rec.stationCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {rec.stationName}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {rec.emailAddress ? (
                            <span className="text-blue-600">{rec.emailAddress}</span>
                          ) : (
                            <span className="text-rose-500 font-semibold">(not set)</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-center">
                          {isReady && (
                            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              Ready
                            </span>
                          )}
                          {isMissing && (
                            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                              Not Ready
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Status Banner inside Delivery Readiness */}
            <div className="mt-4 bg-blue-50/80 border border-blue-200/90 rounded-lg p-3 flex items-center gap-2.5 text-xs text-blue-900">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-blue-900">
                {readyCount} of {recipients.length} recipients are ready to receive automatic alerts ({readyPct}%).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 6: Bottom Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Side Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Recipient */}
          <button
            type="button"
            onClick={() => {
              setFormStationCode('PCP');
              setFormStationName('Palayan Seismic Station');
              setFormRecipientName('');
              setFormRole('Station Personnel');
              setFormEmail('');
              setFormContactNumber('');
              setFormAlertScope('Station AOR Alerts');
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Recipient</span>
          </button>

          {/* Edit Recipient */}
          <button
            type="button"
            onClick={openEditModal}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Recipient</span>
          </button>

          {/* Verify Email */}
          <button
            type="button"
            onClick={handleVerifyEmail}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verify Email</span>
          </button>

          {/* Send Test Alert */}
          <button
            type="button"
            onClick={handleSendTestAlert}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Test Alert</span>
          </button>

          {/* Save Changes */}
          <button
            type="button"
            onClick={() => showNotification('Recipient configurations saved successfully.')}
            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>

          {/* Disable Recipient */}
          <button
            type="button"
            onClick={handleToggleDisabled}
            className="px-3.5 py-1.5 rounded-lg border border-rose-500 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{selectedRecipient.accountStatus === 'Disabled' ? 'Enable Recipient' : 'Disable Recipient'}</span>
          </button>
        </div>

        {/* Right Side Button */}
        <div>
          <button
            type="button"
            onClick={handleExportRecipients}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Recipients</span>
          </button>
        </div>
      </div>

      {/* Add Recipient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Add New Recipient</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Station Code
                  </label>
                  <select
                    value={formStationCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setFormStationCode(code);
                      if (code === 'PCP') setFormStationName('Palayan Seismic Station');
                      else if (code === 'BIP') setFormStationName('Bislig Seismic Station');
                      else if (code === 'CGP') setFormStationName('Cagayan de Oro Seismic Station');
                      else setFormStationName('Main Office');
                    }}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="PCP">PCP</option>
                    <option value="BIP">BIP</option>
                    <option value="CGP">CGP</option>
                    <option value="QVP">QVP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Station Name
                  </label>
                  <input
                    type="text"
                    value={formStationName}
                    onChange={(e) => setFormStationName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={formRecipientName}
                  onChange={(e) => setFormRecipientName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as RecipientRole)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Station Personnel">Station Personnel</option>
                    <option value="Administrative Recipient">Administrative Recipient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alert Scope
                  </label>
                  <select
                    value={formAlertScope}
                    onChange={(e) => setFormAlertScope(e.target.value as AlertScope)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Station AOR Alerts">Station AOR Alerts</option>
                    <option value="All AOR Alerts">All AOR Alerts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="recipient@phivolcs.gov.ph"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  Leave blank if pending provision.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="0917 000 0000"
                  value={formContactNumber}
                  onChange={(e) => setFormContactNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs"
                >
                  Create Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recipient Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Edit Recipient ({selectedRecipient.stationCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Station Code
                  </label>
                  <input
                    type="text"
                    value={formStationCode}
                    onChange={(e) => setFormStationCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Station Name
                  </label>
                  <input
                    type="text"
                    value={formStationName}
                    onChange={(e) => setFormStationName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={formRecipientName}
                  onChange={(e) => setFormRecipientName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as RecipientRole)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Station Personnel">Station Personnel</option>
                    <option value="Administrative Recipient">Administrative Recipient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alert Scope
                  </label>
                  <select
                    value={formAlertScope}
                    onChange={(e) => setFormAlertScope(e.target.value as AlertScope)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Station AOR Alerts">Station AOR Alerts</option>
                    <option value="All AOR Alerts">All AOR Alerts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="recipient@phivolcs.gov.ph"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={formContactNumber}
                  onChange={(e) => setFormContactNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
