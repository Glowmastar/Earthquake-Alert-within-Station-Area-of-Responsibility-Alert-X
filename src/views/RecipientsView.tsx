import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Trash2,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  FileText,
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
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  coveredAreas?: string;
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
  onDeleteRecipient?: (recipientId: string) => void;
}

export const RecipientsView: React.FC<RecipientsViewProps> = ({
  onAddRecipient: _onAddRecipient,
  onDeleteRecipient,
}) => {
  const [recipients, setRecipients] = useState<RecipientRecord[]>(() => {
    try {
      const saved = localStorage.getItem('alertx_recipients_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_RECIPIENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('alertx_recipients_records', JSON.stringify(recipients));
    } catch {
      // ignore
    }
  }, [recipients]);

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recipientToDelete, setRecipientToDelete] = useState<RecipientRecord | null>(null);

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

  const openDeleteModal = (recipient: RecipientRecord) => {
    setRecipientToDelete(recipient);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!recipientToDelete) return;
    const deletedName = recipientToDelete.recipientName;
    const deletedId = recipientToDelete.id;

    setRecipients((prev) => {
      const updated = prev.filter((r) => r.id !== deletedId);
      if (selectedId === deletedId) {
        setSelectedId(updated.length > 0 ? updated[0].id : '');
      }
      return updated;
    });

    onDeleteRecipient?.(deletedId);
    setIsDeleteModalOpen(false);
    setRecipientToDelete(null);
    showNotification(`Recipient "${deletedName}" has been deleted.`);
  };

  // CSV Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedCsvRecords, setParsedCsvRecords] = useState<RecipientRecord[]>([]);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [csvError, setCsvError] = useState<string | null>(null);
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template Downloader with exact required headers
  const handleDownloadTemplate = () => {
    const headers = [
      'First Name',
      'Last Name',
      'Middle Initial',
      'Email Address',
      'Contact Number',
      'Station Name',
      'AOR Provinces / Covered Areas',
    ];
    const sampleRows = [
      [
        '"Wilmer"',
        '"Legaspi"',
        '"A"',
        '"wilmer.legaspi@phivolcs.gov.ph"',
        '"0917 123 4567"',
        '"Palayan Seismic Station"',
        '"Nueva Ecija, Aurora, Bulacan"',
      ],
      [
        '"Mark Louegie"',
        '"Juarbal"',
        '""',
        '"mark.juarbal@phivolcs.gov.ph"',
        '"0920 555 0101"',
        '"Cagayan de Oro Seismic Station"',
        '"Misamis Oriental, Bukidnon, Camiguin"',
      ],
      [
        '"Evelyn"',
        '"Seranado"',
        '"B"',
        '"evelyn.seranado@phivolcs.gov.ph"',
        '"0918 765 4321"',
        '"Bislig Seismic Station"',
        '"Surigao del Sur, Agusan del Sur"',
      ],
    ];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Recipients_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Recipients CSV import template downloaded.');
  };

  // CSV Parser with support for quoted strings and flexible column mapping
  const parseCsvText = (text: string, filename: string) => {
    setIsParsingCsv(true);
    setCsvError(null);
    try {
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setCsvError('The CSV file does not contain any data rows.');
        setIsParsingCsv(false);
        return;
      }

      // Robust CSV tokenizer
      const parseLine = (line: string): string[] => {
        const tokens: string[] = [];
        let curr = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              curr += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            tokens.push(curr.trim());
            curr = '';
          } else {
            curr += char;
          }
        }
        tokens.push(curr.trim());
        return tokens;
      };

      const rawHeaders = parseLine(lines[0]);
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Identify column indices
      const colFirst = rawHeaders.findIndex((h) => norm(h).includes('firstname') || norm(h) === 'first');
      const colLast = rawHeaders.findIndex((h) => norm(h).includes('lastname') || norm(h) === 'last');
      const colMi = rawHeaders.findIndex(
        (h) => norm(h).includes('middleinitial') || norm(h) === 'mi' || norm(h) === 'middle'
      );
      const colEmail = rawHeaders.findIndex((h) => norm(h).includes('email'));
      const colContact = rawHeaders.findIndex(
        (h) => norm(h).includes('contact') || norm(h).includes('phone') || norm(h).includes('number')
      );
      const colStation = rawHeaders.findIndex((h) => norm(h).includes('station'));
      const colAreas = rawHeaders.findIndex(
        (h) => norm(h).includes('aor') || norm(h).includes('province') || norm(h).includes('covered')
      );

      if (colEmail === -1 && colLast === -1 && colFirst === -1) {
        setCsvError(
          'Missing required headers. File must contain "First Name", "Last Name", "Email Address", "Contact Number", "Station Name", "AOR Provinces / Covered Areas".'
        );
        setIsParsingCsv(false);
        return;
      }

      const parsed: RecipientRecord[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseLine(lines[i]);
        if (row.length === 0 || row.every((c) => !c.trim())) continue;

        const firstName = colFirst !== -1 ? (row[colFirst] || '').trim() : '';
        const lastName = colLast !== -1 ? (row[colLast] || '').trim() : '';
        const mi = colMi !== -1 ? (row[colMi] || '').trim().replace(/\.$/, '') : '';
        const email = colEmail !== -1 ? (row[colEmail] || '').trim() : '';
        const contact = colContact !== -1 ? (row[colContact] || '').trim() : '';
        const stationRaw = colStation !== -1 ? (row[colStation] || '').trim() : '';
        const coveredAreas = colAreas !== -1 ? (row[colAreas] || '').trim() : '';

        // Determine recipient display name
        const middlePart = mi ? `${mi}. ` : '';
        const fullName =
          `${firstName} ${middlePart}${lastName}`.trim() ||
          email.split('@')[0] ||
          `Recipient ${recipients.length + i}`;

        // Map station code & station name
        let stationCode = 'PCP';
        let stationName = 'Palayan Seismic Station';
        const stLower = stationRaw.toLowerCase();
        if (stLower.includes('cgp') || stLower.includes('cagayan')) {
          stationCode = 'CGP';
          stationName = 'Cagayan de Oro Seismic Station';
        } else if (stLower.includes('bip') || stLower.includes('bislig')) {
          stationCode = 'BIP';
          stationName = 'Bislig Seismic Station';
        } else if (stLower.includes('tgy') || stLower.includes('tagaytay')) {
          stationCode = 'TGY';
          stationName = 'Tagaytay Seismic Station';
        } else if (stLower.includes('dav') || stLower.includes('davao')) {
          stationCode = 'DAV';
          stationName = 'Davao Seismic Station';
        } else if (stLower.includes('qvp') || stLower.includes('main') || stLower.includes('central')) {
          stationCode = 'QVP';
          stationName = 'Main Office (Global)';
        } else if (stationRaw) {
          stationName = stationRaw;
          stationCode = stationRaw.slice(0, 3).toUpperCase();
        }

        const isEmailProvided = email.length > 0 && email.includes('@');
        const newRecord: RecipientRecord = {
          id: `REC-IMP-${Date.now().toString().slice(-4)}-${i}`,
          stationCode,
          stationName,
          recipientName: fullName,
          role: 'Station Personnel',
          emailAddress: email,
          contactNumber: contact || '—',
          verificationStatus: isEmailProvided ? 'Verified' : 'Missing Email',
          alertScope: 'Station AOR Alerts',
          accountStatus: isEmailProvided ? 'Active' : 'Pending Setup',
          lastVerified: isEmailProvided ? 'Verified via CSV import' : '—',
          lastAlertSent: '—',
          firstName,
          lastName,
          middleInitial: mi,
          coveredAreas,
        };

        parsed.push(newRecord);
      }

      if (parsed.length === 0) {
        setCsvError('No valid recipient rows found in the CSV file.');
      } else {
        setParsedCsvRecords(parsed);
        setCsvFileName(filename);
      }
    } catch (err: any) {
      setCsvError(`Error reading CSV file: ${err?.message || 'Invalid CSV structure'}`);
    } finally {
      setIsParsingCsv(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCsvText(text, file.name);
        setIsImportModalOpen(true);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (parsedCsvRecords.length === 0) return;
    setRecipients((prev) => [...parsedCsvRecords, ...prev]);
    setSelectedId(parsedCsvRecords[0].id);
    parsedCsvRecords.forEach((r) => _onAddRecipient?.(r));
    setIsImportModalOpen(false);
    showNotification(`Successfully imported ${parsedCsvRecords.length} recipients from ${csvFileName}.`);
    setParsedCsvRecords([]);
    setCsvFileName('');
  };

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

          {/* Filter, Clear & Import Action Buttons */}
          <div className="lg:col-span-1 flex items-center gap-1.5 justify-end">
            <button
              type="button"
              onClick={() => showNotification('Filters updated.')}
              className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
              title="Apply filters"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="h-8 px-2 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="h-8 px-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-500 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Import recipients from CSV file"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Import</span>
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
                      <div className="flex items-center justify-center gap-1.5">
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
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(item);
                          }}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                          title={`Delete ${item.recipientName}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            {/* Header with blue vertical bar and actions */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
                <h2 className="text-base font-bold text-slate-900">Recipient Details</h2>
              </div>
              {selectedRecipient && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Edit recipient"
                  >
                    <Edit2 className="w-3 h-3 text-blue-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(selectedRecipient)}
                    className="px-2.5 py-1 rounded-md border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 text-xs font-medium flex items-center gap-1 transition-colors"
                    title={`Delete ${selectedRecipient.recipientName}`}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
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

              {selectedRecipient.coveredAreas && (
                <div className="grid grid-cols-12 py-1 border-b border-slate-100/70">
                  <span className="col-span-5 font-semibold text-slate-700">Covered Areas</span>
                  <span className="col-span-7 text-slate-800 font-medium">{selectedRecipient.coveredAreas}</span>
                </div>
              )}

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
            disabled={!selectedRecipient}
            onClick={openEditModal}
            className="px-3.5 py-1.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Recipient</span>
          </button>

          {/* Delete Recipient */}
          <button
            type="button"
            disabled={!selectedRecipient}
            onClick={() => selectedRecipient && openDeleteModal(selectedRecipient)}
            className="px-3.5 py-1.5 rounded-lg border border-rose-500 text-rose-600 hover:bg-rose-50 disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title={selectedRecipient ? `Delete ${selectedRecipient.recipientName}` : 'Select a recipient to delete'}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Recipient</span>
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

        {/* Right Side Buttons: Import & Export */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input for CSV */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Import recipients from CSV file"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Import Recipients</span>
          </button>
          <button
            type="button"
            onClick={handleExportRecipients}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* Delete Recipient Confirmation Modal */}
      {isDeleteModalOpen && recipientToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delete Recipient</h3>
                  <p className="text-[11px] text-slate-500">Remove recipient from alert notification registry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRecipientToDelete(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-900 font-semibold">{recipientToDelete.recipientName}</strong>?
                This will remove their contact information and stop all automated earthquake alerts to this address.
              </p>

              {/* Recipient Details Summary */}
              <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Recipient Summary
                  </span>
                  <span className="font-mono text-[10px] font-bold text-slate-500">
                    {recipientToDelete.id}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Station</span>
                    <span className="font-semibold text-slate-800">
                      {recipientToDelete.stationCode} - {recipientToDelete.stationName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Role</span>
                    <span className="font-semibold text-slate-800">
                      {recipientToDelete.role}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[10px]">Email Address</span>
                    <span className="font-mono text-slate-800 font-medium">
                      {recipientToDelete.emailAddress || '— (No email)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Alert Scope</span>
                    <span className="text-slate-700">
                      {recipientToDelete.alertScope}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Verification Status</span>
                    <span className="text-slate-700 font-medium">
                      {recipientToDelete.verificationStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3 flex items-start gap-2.5 text-[11px] text-amber-800 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  This action cannot be undone. To temporarily halt alerts without deletion, you can disable the recipient instead.
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setRecipientToDelete(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Recipient</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Recipients CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Import Recipients from CSV</h3>
                  <p className="text-[11px] text-slate-500">
                    Upload a CSV file containing station personnel and disaster response contacts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setParsedCsvRecords([]);
                  setCsvFileName('');
                  setCsvError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Header Specification Callout */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-blue-900 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold flex items-center gap-1.5 text-xs text-blue-950">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Required CSV Column Headers:
                  </span>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-2.5 py-1 bg-white hover:bg-blue-100/60 border border-blue-300 text-blue-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    title="Download template CSV with sample rows"
                  >
                    <Download className="w-3 h-3 text-blue-600" />
                    <span>Download Template</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    'First Name',
                    'Last Name',
                    'Middle Initial',
                    'Email Address',
                    'Contact Number',
                    'Station Name',
                    'AOR Provinces / Covered Areas',
                  ].map((header) => (
                    <span
                      key={header}
                      className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-blue-800 text-[10px] font-mono font-semibold"
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Select CSV File
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        if (text) {
                          parseCsvText(text, file.name);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-6 bg-slate-50/60 hover:bg-blue-50/40 text-center transition-all cursor-pointer group"
                >
                  <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-semibold text-slate-800">
                    {csvFileName ? (
                      <span className="text-blue-700 font-bold">{csvFileName}</span>
                    ) : (
                      'Click to browse or drag and drop CSV file here'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Accepts comma-separated (.csv) files up to 5MB
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {csvError && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">CSV Parsing Error</span>
                    <span>{csvError}</span>
                  </div>
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedCsvRecords.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Preview ({parsedCsvRecords.length} recipients ready to import)
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Choose Different File
                    </button>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email Address</th>
                          <th className="py-2 px-3">Contact</th>
                          <th className="py-2 px-3">Station</th>
                          <th className="py-2 px-3">AOR Covered Areas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedCsvRecords.map((r, idx) => (
                          <tr key={r.id || idx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                              {r.recipientName}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              {r.emailAddress ? (
                                <span className="text-blue-600 font-medium">{r.emailAddress}</span>
                              ) : (
                                <span className="text-rose-500 font-semibold text-[11px]">(Missing Email)</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                              {r.contactNumber}
                            </td>
                            <td className="py-2 px-3 whitespace-nowrap">
                              <span className="font-bold text-blue-600 mr-1">{r.stationCode}</span>
                              <span className="text-slate-600 text-[11px]">{r.stationName}</span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px] max-w-xs truncate">
                              {r.coveredAreas || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Sample Template</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setParsedCsvRecords([]);
                    setCsvFileName('');
                    setCsvError(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={parsedCsvRecords.length === 0 || isParsingCsv}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Import {parsedCsvRecords.length > 0 ? `${parsedCsvRecords.length} ` : ''}Recipients
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
