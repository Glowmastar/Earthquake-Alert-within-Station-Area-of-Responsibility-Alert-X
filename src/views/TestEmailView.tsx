import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Check,
  CheckCircle2,
  Clock,
  User,
  FileText,
  AlertTriangle,
  RotateCw,
  Send,
  Info,
  ShieldCheck,
  Save,
  Activity,
  Layers,
  Sparkles,
  Server,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  Settings,
  X,
  Users,
  Search,
  Globe,
  Radio,
  BookOpen,
  HelpCircle,
  Zap,
  Copy,
} from 'lucide-react';
import { UserProfile, EarthquakeRecord } from '../types';

interface TestEmailViewProps {
  currentUser?: UserProfile;
  earthquakes?: EarthquakeRecord[];
  recipients?: any[];
  onNavigateToAudit?: () => void;
}

interface TestSendLog {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  timestamp: string;
  status:
    | 'Delivered (Inbox)'
    | 'Delivered (Direct SMTP Relay)'
    | 'Delivered (Sandbox)'
    | 'Delivered (Brevo HTTPS API - Port 443)'
    | 'Delivered (Resend HTTPS API - Port 443)'
    | 'Failed'
    | 'Delivered (Simulated)';
  previewUrl?: string | null;
  error?: string;
}

interface SmtpSettings {
  preset: 'direct' | 'brevo' | 'gmail' | 'outlook' | 'custom' | 'sandbox';
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
}

export const TestEmailView: React.FC<TestEmailViewProps> = ({
  currentUser,
  earthquakes = [],
  recipients = [],
  onNavigateToAudit,
}) => {
  // Scoped station identity
  const stationAor = currentUser?.assignedAor === 'PCP' ? 'PCP' : currentUser?.assignedAor === 'BIP' ? 'BIP' : 'CGP';
  const stationDisplayName = stationAor === 'CGP' ? 'Cagayan de Oro Seismic Station (CGP)' : stationAor === 'PCP' ? 'Palayan Seismic Station (PCP)' : 'Bislig Seismic Station (BIP)';

  // Delivery Engine Selection: 'brevo' (HTTPS Port 443, 300 free/day) | 'resend' | 'smtp'
  const [deliveryEngine, setDeliveryEngine] = useState<'brevo' | 'resend' | 'smtp'>(() => {
    try {
      return (localStorage.getItem('alertx_delivery_engine') as any) || 'brevo';
    } catch {
      return 'brevo';
    }
  });

  // Brevo Settings State
  const [brevoApiKey, setBrevoApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('alertx_brevo_api_key') || '';
    } catch {
      return '';
    }
  });
  const [brevoSenderEmail, setBrevoSenderEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('alertx_brevo_sender') || currentUser?.email || 'ebardo.glynbryan1@gmail.com';
    } catch {
      return currentUser?.email || 'ebardo.glynbryan1@gmail.com';
    }
  });
  const [brevoSenderName, setBrevoSenderName] = useState<string>(() => {
    try {
      return localStorage.getItem('alertx_brevo_sender_name') || 'DOST-PHIVOLCS Alert X';
    } catch {
      return 'DOST-PHIVOLCS Alert X';
    }
  });
  const [showBrevoKey, setShowBrevoKey] = useState<boolean>(false);
  const [isBrevoGuideOpen, setIsBrevoGuideOpen] = useState<boolean>(false);

  // Resend Settings State
  const [resendApiKey, setResendApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('alertx_resend_api_key') || '';
    } catch {
      return '';
    }
  });
  const [resendFromAddress, setResendFromAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('alertx_resend_from') || 'Alert X <onboarding@resend.dev>';
    } catch {
      return 'Alert X <onboarding@resend.dev>';
    }
  });
  const [showApiKey, setShowApiKey] = useState<boolean>(false);

  // Recipients list selection
  const [isRecipientPickerOpen, setIsRecipientPickerOpen] = useState<boolean>(false);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');

  // Form State
  const [recipientEmail, setRecipientEmail] = useState<string>(
    currentUser?.email || 'ebardo.glynbryan1@gmail.com'
  );
  const [emailTemplate, setEmailTemplate] = useState<string>('Earthquake AOR Alert');
  const [language, setLanguage] = useState<string>('English');
  const [subjectLine, setSubjectLine] = useState<string>('[TEST] Alert X earthquake AOR email');
  const [senderDisplayName, setSenderDisplayName] = useState<string>('Alert X Test');
  const [senderAddress, setSenderAddress] = useState<string>('alerts@alertx.dost.gov.ph');
  const [sampleEvent, setSampleEvent] = useState<string>('cgp-demo-001');

  // Load all recipients from prop or localStorage
  const allRecipientsList = useMemo(() => {
    if (Array.isArray(recipients) && recipients.length > 0) return recipients;
    try {
      const saved = localStorage.getItem('alertx_recipients_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'REC-000',
        recipientName: 'Glyn Bryan Ebardo',
        emailAddress: 'ebardo.glynbryan1@gmail.com',
        role: 'Administrative Recipient',
        stationCode: 'PCP',
        stationName: 'Palayan Seismic Station',
        verificationStatus: 'Verified',
      },
      {
        id: 'REC-001',
        recipientName: 'Wilmer A. Legaspi',
        emailAddress: 'wilmer.legaspi@phivolcs.gov.ph',
        role: 'Station Personnel',
        stationCode: 'PCP',
        stationName: 'Palayan Seismic Station',
        verificationStatus: 'Verified',
      },
      {
        id: 'REC-003',
        recipientName: 'Mark Louegie Juarbal',
        emailAddress: 'mark.juarbal@phivolcs.gov.ph',
        role: 'Station Personnel',
        stationCode: 'CGP',
        stationName: 'Cagayan de Oro Seismic Station',
        verificationStatus: 'Verified',
      },
      {
        id: 'REC-004',
        recipientName: 'Glyn Bryan Ebardo',
        emailAddress: 'glyn.ebardo@phivolcs.gov.ph',
        role: 'Administrative Recipient',
        stationCode: 'QVP',
        stationName: 'Main Office',
        verificationStatus: 'Pending Verification',
      },
    ];
  }, [recipients]);

  const filteredRecipients = useMemo(() => {
    const q = recipientSearchQuery.toLowerCase().trim();
    if (!q) return allRecipientsList;
    return allRecipientsList.filter(
      (r) =>
        (r.recipientName && r.recipientName.toLowerCase().includes(q)) ||
        (r.emailAddress && r.emailAddress.toLowerCase().includes(q)) ||
        (r.stationCode && r.stationCode.toLowerCase().includes(q)) ||
        (r.role && r.role.toLowerCase().includes(q))
    );
  }, [allRecipientsList, recipientSearchQuery]);

  // SMTP Settings State
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(() => {
    try {
      const saved = localStorage.getItem('alertx_smtp_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      preset: 'gmail',
      host: 'smtp.gmail.com',
      port: '465',
      secure: true,
      user: currentUser?.email || '',
      pass: '',
    };
  });
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [lastConnectionError, setLastConnectionError] = useState<string | null>(null);

  // Interactive Test State
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'not_tested' | 'testing' | 'connected'>('not_tested');
  const [connectionLatency, setConnectionLatency] = useState<number | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendLogs, setSendLogs] = useState<TestSendLog[]>([]);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Real PHIVOLCS Events catalog for live AOR testing
  const sampleEventsMap = useMemo(() => {
    const map: Record<
      string,
      {
        ref: string;
        title: string;
        location: string;
        station: string;
        aorDetails: string;
        locality: string;
        record?: EarthquakeRecord;
      }
    > = {};

    // Sort: prioritize Inside AOR earthquakes (CGP, PCP, BIP), then other recent PHIVOLCS events
    const sorted = [...earthquakes].sort((a, b) => {
      if (a.aorStatus === 'Inside' && b.aorStatus !== 'Inside') return -1;
      if (b.aorStatus === 'Inside' && a.aorStatus !== 'Inside') return 1;
      return 0;
    });

    sorted.slice(0, 100).forEach((eq) => {
      const stationLabel = eq.aor && eq.aor !== 'Outside AOR' ? eq.aor : 'PHIVOLCS';
      const aorDesc =
        eq.aorStatus === 'Inside'
          ? `AOR: ${eq.matchedAORFull || eq.stationName || eq.aor} (Active Perimeter)`
          : `Outside Station AOR • ${eq.location}`;

      map[eq.id] = {
        ref: eq.id,
        title: `Magnitude ${eq.magnitude.toFixed(1)} • ${eq.location}`,
        location: eq.location,
        station: stationLabel,
        aorDetails: aorDesc,
        locality: eq.provinceMunicipality || eq.municipality || eq.location,
        record: eq,
      };
    });

    return map;
  }, [earthquakes]);

  const availableEventKeys = useMemo(() => Object.keys(sampleEventsMap), [sampleEventsMap]);
  const activeEventKey = sampleEvent && sampleEventsMap[sampleEvent] ? sampleEvent : (availableEventKeys[0] || '');
  const activeEvent = sampleEventsMap[activeEventKey] || {
    ref: 'PHIVOLCS-LIVE',
    title: 'Real PHIVOLCS Seismic Telemetry',
    location: 'Philippine Seismic Network (earthquake.phivolcs.dost.gov.ph)',
    station: 'CGP',
    aorDetails: 'AOR: Northern Mindanao (CGP)',
    locality: 'Northern Mindanao',
  };

  // Sync active event if current selection is invalid
  useEffect(() => {
    if ((!sampleEvent || !sampleEventsMap[sampleEvent]) && availableEventKeys.length > 0) {
      setSampleEvent(availableEventKeys[0]);
    }
  }, [availableEventKeys, sampleEventsMap, sampleEvent]);

  // Validate address action
  const handleValidateAddress = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailRegex.test(recipientEmail.trim())) {
      setIsValidated(true);
      showToast(`Recipient address "${recipientEmail.trim()}" successfully validated.`);
    } else {
      setIsValidated(false);
      showToast('Please enter a valid email address format.');
    }
  };

  // Preset switch
  const handlePresetChange = (preset: SmtpSettings['preset']) => {
    if (preset === 'direct') {
      setSmtpSettings((prev) => ({
        ...prev,
        preset: 'direct',
        host: 'smtp.resend.com',
        port: '465',
        secure: true,
        user: 'resend',
        pass: '',
      }));
    } else if (preset === 'brevo') {
      setSmtpSettings((prev) => ({
        ...prev,
        preset: 'brevo',
        host: 'smtp-relay.brevo.com',
        port: '587',
        secure: false,
        // Brevo's SMTP login can differ from the account email. Require the
        // user to enter the login shown in Brevo instead of reusing old creds.
        user: '',
        pass: '',
      }));
    } else if (preset === 'gmail') {
      setSmtpSettings((prev) => ({
        ...prev,
        preset: 'gmail',
        host: 'smtp.gmail.com',
        port: '465',
        secure: true,
        user: prev.user || currentUser?.email || 'ebardo.glynbryan1@gmail.com',
      }));
    } else if (preset === 'outlook') {
      setSmtpSettings((prev) => ({
        ...prev,
        preset: 'outlook',
        host: 'smtp.office365.com',
        port: '587',
        secure: false,
      }));
    } else if (preset === 'sandbox') {
      setSmtpSettings((prev) => ({
        ...prev,
        preset: 'sandbox',
        host: 'smtp.ethereal.email',
        port: '587',
        secure: false,
        pass: '',
      }));
    } else {
      setSmtpSettings((prev) => ({ ...prev, preset: 'custom' }));
    }
  };

  // Save Service Settings
  const handleSaveServiceSettings = () => {
    try {
      localStorage.setItem('alertx_delivery_engine', deliveryEngine);
      localStorage.setItem('alertx_brevo_api_key', brevoApiKey.trim());
      localStorage.setItem('alertx_brevo_sender', brevoSenderEmail.trim());
      localStorage.setItem('alertx_brevo_sender_name', brevoSenderName.trim());
      localStorage.setItem('alertx_resend_api_key', resendApiKey.trim());
      localStorage.setItem('alertx_resend_from', resendFromAddress.trim());
      localStorage.setItem('alertx_smtp_config', JSON.stringify(smtpSettings));
      showToast('Email service configuration and credentials saved successfully.');
    } catch {
      showToast('Configuration stored for this session.');
    }
    setIsSmtpModalOpen(false);
  };

  // Test connection action (real API call over port 443 for Brevo, Resend or SMTP)
  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setLastConnectionError(null);
    try {
      const payload = deliveryEngine === 'brevo'
        ? {
            provider: 'brevo',
            brevoApiKey: brevoApiKey.trim(),
            brevoSenderEmail: brevoSenderEmail.trim(),
          }
        : deliveryEngine === 'resend'
        ? {
            provider: 'resend',
            resendApiKey: resendApiKey.trim(),
          }
        : {
            provider: 'smtp',
            host: smtpSettings.host,
            port: smtpSettings.port,
            secure: smtpSettings.secure,
            user: smtpSettings.user,
            pass: smtpSettings.pass,
          };

      const res = await fetch('/api/test-email-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setConnectionStatus('connected');
        setConnectionLatency(data.latencyMs || 120);
        showToast(data.message || 'Email service connection verified successfully!');
      } else {
        setConnectionStatus('not_tested');
        setLastConnectionError(data.error || 'Connection failed');
        showToast(`Connection check failed: ${data.error || 'Unable to connect'}`);
      }
    } catch (err: any) {
      setConnectionStatus('not_tested');
      setLastConnectionError(err.message);
      showToast(`Network error testing connection: ${err.message}`);
    }
  };

  // Reset fields action
  const handleResetFields = () => {
    setRecipientEmail(currentUser?.email || 'ebardo.glynbryan1@gmail.com');
    setEmailTemplate('Earthquake AOR Alert');
    setLanguage('English');
    setSubjectLine('[TEST] Alert X earthquake AOR email');
    setSenderDisplayName('Alert X Test');
    setSenderAddress('alerts@alertx.dost.gov.ph');
    setSampleEvent(availableEventKeys[0] || '');
    setIsValidated(false);
    showToast('Test message setup reset to default values.');
  };

  // Save configuration action
  const handleSaveConfiguration = () => {
    try {
      localStorage.setItem(
        'alertx_test_email_config',
        JSON.stringify({
          recipientEmail,
          emailTemplate,
          language,
          subjectLine,
          senderDisplayName,
          senderAddress,
          sampleEvent,
        })
      );
      showToast('Test email configuration saved successfully.');
    } catch {
      showToast('Configuration saved to current session.');
    }
  };

  // Send Actual Test Email action (calls real backend /api/send-test-email with Brevo HTTPS API / Resend / Port 443)
  const handleSendTestEmail = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      showToast('Please specify a valid test recipient email address.');
      return;
    }

    if (deliveryEngine === 'brevo' && !brevoApiKey.trim()) {
      setIsSmtpModalOpen(true);
      showToast('Please provide your Brevo API Key (xkeysib-...) to send via Brevo HTTPS Port 443.');
      return;
    }

    if (deliveryEngine === 'resend' && !resendApiKey.trim()) {
      setIsSmtpModalOpen(true);
      showToast('Please provide your Resend API Key (re_...) to send via HTTPS Port 443.');
      return;
    }

    setIsSending(true);
    try {
      const isCustomSmtp = smtpSettings.preset !== 'sandbox' && smtpSettings.user && smtpSettings.pass;
      const res = await fetch('/api/send-test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          subject: subjectLine,
          template: emailTemplate,
          language,
          senderDisplayName: deliveryEngine === 'brevo' ? brevoSenderName : senderDisplayName,
          senderAddress: deliveryEngine === 'brevo' ? brevoSenderEmail : deliveryEngine === 'resend' ? resendFromAddress : senderAddress,
          sampleEvent: activeEvent.title,
          provider: deliveryEngine,
          brevoApiKey: brevoApiKey.trim(),
          brevoSenderEmail: brevoSenderEmail.trim(),
          brevoSenderName: brevoSenderName.trim(),
          resendApiKey: resendApiKey.trim(),
          smtpConfig: deliveryEngine === 'smtp' && isCustomSmtp
            ? {
                host: smtpSettings.host,
                port: smtpSettings.port,
                secure: smtpSettings.secure,
                user: smtpSettings.user,
                pass: smtpSettings.pass,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      setIsSending(false);

      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      if (data.success) {
        setConnectionStatus('connected');
        const isBrevo = deliveryEngine === 'brevo';
        const isResend = deliveryEngine === 'resend';
        const isDirect = deliveryEngine === 'smtp' && (data.isDirectRelay || data.provider?.includes('Direct SMTP'));
        const newLog: TestSendLog = {
          id: data.messageId
            ? (isBrevo ? `BREVO-${String(data.messageId).slice(-6)}` : isResend ? `RESEND-${String(data.messageId).slice(-6)}` : isDirect ? `SMTP-${String(data.messageId).slice(-6)}` : `DISP-${Date.now().toString().slice(-4)}`)
            : `DISP-${Date.now().toString().slice(-4)}`,
          recipient: recipientEmail.trim(),
          template: emailTemplate,
          subject: subjectLine,
          timestamp: timeFormatted,
          status: isBrevo
            ? 'Delivered (Brevo HTTPS API - Port 443)'
            : isResend
            ? 'Delivered (Resend HTTPS API - Port 443)'
            : isDirect
            ? 'Delivered (Direct SMTP Relay)'
            : (!data.isSandbox ? 'Delivered (Inbox)' : 'Delivered (Sandbox)'),
          previewUrl: data.previewUrl,
        };
        setSendLogs((prev) => [newLog, ...prev]);

        if (isBrevo) {
          showToast(`Test email successfully sent via Brevo HTTPS API (Port 443) to ${recipientEmail.trim()}!`);
        } else if (isResend) {
          showToast(`Test email successfully sent via Resend HTTPS API (Port 443) to ${recipientEmail.trim()}!`);
        } else if (isDirect) {
          showToast(`Actual AOR alert successfully delivered via Direct SMTP Relay to ${recipientEmail.trim()}! Check inbox.`);
        } else if (!data.isSandbox) {
          showToast(`Test email successfully delivered to ${recipientEmail.trim()}! Check inbox.`);
        } else {
          showToast(`Test email dispatched via relay! View message preview in Recent Test Sends.`);
        }
      } else {
        const failedLog: TestSendLog = {
          id: `ERR-${Date.now().toString().slice(-4)}`,
          recipient: recipientEmail.trim(),
          template: emailTemplate,
          subject: subjectLine,
          timestamp: timeFormatted,
          status: 'Failed',
          error: data.error,
        };
        setSendLogs((prev) => [failedLog, ...prev]);
        showToast(`Failed to dispatch: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      setIsSending(false);
      showToast(`Network error dispatching email: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 pb-16 max-w-[1720px] mx-auto font-sans antialiased text-slate-800 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Brevo Integration Quick Action Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Brevo Email Integration</span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                300 Free Emails / Day Forever
              </span>
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-200 px-1.5 py-0.5 rounded border border-blue-400/30">
                Port 443 HTTPS API
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Connect Brevo (formerly Sendinblue) to dispatch live earthquake bulletins and test emails with 100% inbox deliverability.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setDeliveryEngine('brevo');
              setIsSmtpModalOpen(true);
            }}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Brevo</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBrevoGuideOpen(true)}
            className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Integration Guide</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics / Status Cards (Matching Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: EMAIL SERVICE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              deliveryEngine === 'brevo' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {deliveryEngine === 'brevo' ? <Zap className="w-5 h-5 text-amber-600" /> : <Globe className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>EMAIL SERVICE</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-200">
                  PORT 443
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {deliveryEngine === 'brevo'
                  ? 'Brevo HTTPS API'
                  : deliveryEngine === 'resend'
                  ? 'Resend HTTPS API'
                  : 'Direct SMTP Server'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {connectionStatus === 'connected'
                  ? `Connected (${connectionLatency}ms latency)`
                  : deliveryEngine === 'brevo'
                  ? '300 Free/Day • Port 443'
                  : 'HTTPS Port 443 (Firewall Ready)'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsBrevoGuideOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
              title="Brevo Integration Guide"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsSmtpModalOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              title="Configure Email Service & Port 443 API"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: TEST RECIPIENT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                TEST RECIPIENT
              </div>
              <div className="text-sm font-bold text-slate-900 truncate">
                {recipientEmail ? recipientEmail.split('@')[0] : '1 address'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {isValidated ? '✓ Validated recipient' : 'Needs validation'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsRecipientPickerOpen(true)}
            className="px-2 py-1 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-2xs"
            title="Select recipient from registered recipients"
          >
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pick</span>
          </button>
        </div>

        {/* Card 3: TEMPLATE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              TEMPLATE
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {emailTemplate}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              Selected for preview
            </div>
          </div>
        </div>

        {/* Card 4: DELIVERY LOG */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              DELIVERY LOG
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {sendLogs.length > 0 ? `${sendLogs.length} test${sendLogs.length > 1 ? 's' : ''} sent` : 'No test sent yet'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {sendLogs.length > 0 ? `Latest at ${sendLogs[0].timestamp}` : 'Ready for dispatch'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Content Layout (Matching Screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* =========================================================================
            COLUMN 1: TEST MESSAGE SETUP (5 cols)
            ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            {/* Header with Title and ADMIN TOOL badge */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Test Message Setup
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enter a safe destination or choose a registered recipient from the Recipients tab.
                </p>
              </div>
              <span className="text-[10px] font-bold font-mono tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                ADMIN TOOL
              </span>
            </div>

            {/* Field: TEST RECIPIENT EMAIL + Picker Button + Validate Button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  TEST RECIPIENT EMAIL
                </label>
                <button
                  type="button"
                  onClick={() => setIsRecipientPickerOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  title="Pick a registered recipient from the Recipients tab list"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pick from Recipients list</span>
                  <span className="text-[9px] bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded-full font-bold">
                    {allRecipientsList.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => {
                    setRecipientEmail(e.target.value);
                    setIsValidated(false);
                  }}
                  placeholder="name@example.org"
                  className="flex-1 px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleValidateAddress}
                  className={`shrink-0 border px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isValidated
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Validate address</span>
                </button>
              </div>

              {/* Quick Pick Chips from Recipients Tab */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Pick:
                </span>
                {allRecipientsList.slice(0, 4).map((rec: any) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => {
                      setRecipientEmail(rec.emailAddress);
                      setIsValidated(true);
                      showToast(`Selected "${rec.recipientName}" (${rec.emailAddress}).`);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                      recipientEmail === rec.emailAddress
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span>{rec.recipientName ? rec.recipientName.split(' ')[0] : 'User'}</span>
                    <span className="text-[9px] opacity-75 font-mono">({rec.stationCode || 'PCP'})</span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsRecipientPickerOpen(true)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/70 border border-blue-200 transition-colors cursor-pointer"
                >
                  + All ({allRecipientsList.length})
                </button>
              </div>
            </div>

            {/* Row: EMAIL TEMPLATE & LANGUAGE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  EMAIL TEMPLATE
                </label>
                <select
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="Earthquake AOR Alert">Earthquake AOR Alert</option>
                  <option value="CGP Rapid AOR Earthquake Alert (M4.0+)">CGP Rapid AOR Earthquake Alert</option>
                  <option value="Major Felt AOR Earthquake & Intensity Advisory">Major Felt AOR Earthquake Advisory</option>
                  <option value="Minor AOR Tremor Routine Digest">Minor AOR Tremor Digest</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  LANGUAGE
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Filipino / Tagalog">Filipino / Tagalog</option>
                  <option value="Cebuano / Bisaya">Cebuano / Bisaya</option>
                </select>
              </div>
            </div>

            {/* Field: SUBJECT LINE */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                SUBJECT LINE
              </label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Row: SENDER DISPLAY NAME & SENDER ADDRESS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  SENDER DISPLAY NAME
                </label>
                <input
                  type="text"
                  value={senderDisplayName}
                  onChange={(e) => setSenderDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  SENDER ADDRESS
                </label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Field: REAL PHIVOLCS EVENT */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  REAL PHIVOLCS EVENT BULLETIN
                </label>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {availableEventKeys.length} Real Events Loaded
                </span>
              </div>
              <select
                value={activeEventKey}
                onChange={(e) => setSampleEvent(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              >
                {availableEventKeys.map((key) => {
                  const ev = sampleEventsMap[key];
                  const eq = ev.record;
                  return (
                    <option key={key} value={key}>
                      {eq?.aorStatus === 'Inside' ? `[INSIDE ${ev.station} AOR] ` : ''}
                      M{eq?.magnitude ? eq.magnitude.toFixed(1) : ''} • {ev.location} ({eq?.timePHT || ''})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Controlled test only Callout Box */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                <div className="font-bold text-slate-900">
                  Controlled test only
                </div>
                <p>
                  This message will go only to the address entered above. It will not notify AOR recipients or create an earthquake alert.
                </p>
                <p className="text-[11px] text-slate-400">
                  Use a mailbox you can access to confirm the message arrives.
                </p>
              </div>
            </div>

            {/* Bottom Footer inside Card */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Test sends are recorded in the Audit Log.
              </span>
              <button
                type="button"
                onClick={handleResetFields}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
              >
                Reset fields
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 2: EMAIL PREVIEW (4 cols)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            {/* Header with Title and SAMPLE badge */}
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Email Preview
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Preview the selected template with sample data.
                </p>
              </div>
              <span className="bg-amber-100/80 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                SAMPLE
              </span>
            </div>

            {/* Email Metadata Headers */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider w-16 shrink-0">FROM</span>
                <span className="text-slate-800 text-[11px] font-mono truncate">
                  {senderDisplayName} &lt;{senderAddress}&gt;
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider w-16 shrink-0">TO</span>
                <span className="text-slate-900 text-[11px] font-mono font-medium truncate">
                  {recipientEmail || 'name@example.org'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider w-16 shrink-0">SUBJECT</span>
                <span className="text-slate-900 text-[11px] font-semibold truncate">
                  {subjectLine}
                </span>
              </div>
            </div>

            {/* Rendered Email Card Container */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mt-3">
              {/* Dark Masthead with ALERT X logo */}
              <div className="bg-[#0f172a] text-white px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Activity className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                      <span>ALERT X</span>
                    </div>
                    <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest">
                      EARTHQUAKE AOR NOTIFICATION
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-5 space-y-3.5 text-xs">
                {/* TEST MESSAGE Pill */}
                <div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">
                    TEST MESSAGE
                  </span>
                </div>

                {/* Salutation */}
                <div className="font-bold text-slate-900 text-xs">
                  Hello, CGP recipient,
                </div>

                {/* Body paragraph */}
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  This is a test email from Alert X. It checks that the configured email service can deliver messages to the intended mailbox.
                </p>

                {/* Sample Earthquake Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1 mt-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SAMPLE EARTHQUAKE
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {activeEvent.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Reference: {activeEvent.ref} • Station: {activeEvent.station}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    {activeEvent.aorDetails}
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-slate-400 italic leading-relaxed pt-1">
                  This sample is for email delivery testing only. It is not an official earthquake advisory or public warning.
                </p>

                {/* Open Alert X CTA Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => showToast('Simulating Alert X web portal link.')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg inline-block transition-colors"
                  >
                    Open Alert X
                  </button>
                </div>

                {/* Preview Footnote */}
                <div className="pt-2 text-[10px] text-slate-400 text-center">
                  Alert X • PHIVOLCS workflow preview
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COLUMN 3: EMAIL SERVICE STATUS & RECENT TEST SENDS (3 cols)
            ========================================================================= */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: Email Service Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Email Service Status
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live delivery connection
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSmtpModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 shrink-0"
                title="Configure SMTP Host, Port, and Credentials"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
            </div>

            {/* Warning / Status Callout */}
            {connectionStatus === 'connected' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">Connection verified</div>
                  <div className="text-[11px] text-emerald-700">
                    SMTP connection verified with {connectionLatency}ms round-trip latency.
                  </div>
                </div>
              </div>
            ) : lastConnectionError ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">Connection error</div>
                  <div className="text-[11px] text-rose-700 break-words">
                    {lastConnectionError}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">Connection not tested</div>
                  <div className="text-[11px] text-amber-700">
                    Run a check before sending the test email.
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Parameters */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">PROVIDER</span>
                <span className="text-slate-800 font-medium text-[11px] truncate max-w-[140px]">
                  {deliveryEngine === 'brevo'
                    ? 'Brevo HTTPS API (Port 443)'
                    : deliveryEngine === 'resend'
                    ? 'Resend HTTPS API (Port 443)'
                    : smtpSettings.preset === 'direct'
                    ? 'Direct SMTP Relay (Port 465)'
                    : smtpSettings.preset === 'brevo'
                    ? 'Brevo SMTP Relay'
                    : smtpSettings.preset === 'gmail'
                    ? 'Gmail (smtp.gmail.com)'
                    : smtpSettings.preset === 'outlook'
                    ? 'Outlook (Office 365)'
                    : smtpSettings.preset === 'sandbox'
                    ? 'Ethereal Relay'
                    : smtpSettings.host || 'Custom SMTP'}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">SECURITY</span>
                <span className="text-slate-800 font-medium text-[11px]">
                  {deliveryEngine === 'brevo' || deliveryEngine === 'resend'
                    ? 'HTTPS / TLS 1.3 (Port 443)'
                    : smtpSettings.secure
                    ? 'SSL/TLS (Port ' + smtpSettings.port + ')'
                    : 'STARTTLS (Port ' + smtpSettings.port + ')'}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">SENDER USER</span>
                <span className="text-slate-800 font-mono text-[11px] truncate max-w-[140px]">
                  {deliveryEngine === 'brevo'
                    ? brevoSenderEmail || 'Not configured'
                    : deliveryEngine === 'resend'
                    ? resendFromAddress
                    : smtpSettings.user || senderAddress}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                disabled={connectionStatus === 'testing'}
                onClick={handleTestConnection}
                className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Testing connection...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Test connection</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSmtpModalOpen(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-slate-500" />
                <span>Configure SMTP Credentials</span>
              </button>
            </div>
          </div>

          {/* Card 2: Recent Test Sends */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Test Sends
              </h2>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {sendLogs.length} DISPATCHED
              </span>
            </div>

            {/* Empty State or Log Items */}
            {sendLogs.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  No test emails sent in this session
                </div>
                <div className="text-[11px] text-slate-400">
                  Click "Send Test Email" below to dispatch.
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {sendLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{log.id}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                          log.status === 'Delivered (Inbox)'
                            ? 'text-emerald-700 bg-emerald-100'
                            : log.status === 'Delivered (Sandbox)'
                            ? 'text-blue-700 bg-blue-100'
                            : log.status === 'Failed'
                            ? 'text-rose-700 bg-rose-100'
                            : 'text-amber-700 bg-amber-100'
                        }`}
                      >
                        {log.status === 'Delivered (Inbox)' && <CheckCircle2 className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 truncate text-[11px]">{log.recipient}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[120px]">{log.template}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    {log.previewUrl && (
                      <div className="pt-1 border-t border-slate-200/60">
                        <a
                          href={log.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Rendered Email</span>
                        </a>
                      </div>
                    )}
                    {log.error && (
                      <div className="text-[10px] text-rose-600 font-medium">
                        {log.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Live Operational Notice */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-800 space-y-0.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Live Mail Transport Active
              </div>
              <div className="text-[10px] text-emerald-700 leading-relaxed">
                Test messages are processed through the backend email server and transmitted to destination mailboxes.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-500">
            Target recipient
          </div>
          <div className="text-xs font-mono font-bold text-slate-800 truncate max-w-md">
            {recipientEmail || 'ebardo.glynbryan1@gmail.com'}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSaveConfiguration}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Save configuration
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={handleSendTestEmail}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isSending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending actual email...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Test Email</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Info Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          Test messages go directly to the target email address specified. They do not trigger public AOR alerts or notify community recipient lists.
        </span>
      </div>

      {/* Registered Recipients Picker Modal */}
      {isRecipientPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Select Test Recipient
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick any registered recipient from the official Recipients directory to receive test alerts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecipientPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Filter Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={recipientSearchQuery}
                onChange={(e) => setRecipientSearchQuery(e.target.value)}
                placeholder="Search recipient name, station, email, or role..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
              />
              {recipientSearchQuery && (
                <button
                  type="button"
                  onClick={() => setRecipientSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Recipients List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px] max-h-[380px]">
              {filteredRecipients.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 space-y-1">
                  <Users className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold">No recipients found</p>
                  <p className="text-[11px] text-slate-400">Try adjusting your search query.</p>
                </div>
              ) : (
                filteredRecipients.map((rec: any) => {
                  const isCurrent = recipientEmail.toLowerCase() === (rec.emailAddress || '').toLowerCase();
                  const hasEmail = Boolean(rec.emailAddress && rec.emailAddress.includes('@'));

                  return (
                    <div
                      key={rec.id}
                      onClick={() => {
                        if (hasEmail) {
                          setRecipientEmail(rec.emailAddress);
                          setIsValidated(true);
                          setIsRecipientPickerOpen(false);
                          showToast(`Selected "${rec.recipientName}" (${rec.emailAddress}) as test receiver.`);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                        !hasEmail
                          ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                          : isCurrent
                          ? 'border-blue-600 bg-blue-50/80 shadow-xs cursor-pointer'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rec.recipientName ? rec.recipientName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {rec.recipientName}
                            </span>
                            <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                              {rec.stationCode || 'PCP'}
                            </span>
                            {rec.verificationStatus === 'Verified' && (
                              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                            {rec.emailAddress || <span className="text-rose-500 font-sans italic">Missing email address</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {rec.role || 'Station Personnel'} &bull; {rec.stationName || 'Regional Hub'}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isCurrent ? (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </span>
                        ) : hasEmail ? (
                          <span className="text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors">
                            Use this
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            No email
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Showing {filteredRecipients.length} registered recipients
              </span>
              <button
                type="button"
                onClick={() => setIsRecipientPickerOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Service Configuration Modal (Resend HTTPS API / Port 443 + SMTP Fallback) */}
      {isSmtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Email Dispatch Service &amp; Credentials
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send via HTTPS Email API (Port 443) or direct SMTP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSmtpModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Engine Switcher */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                DELIVERY PROTOCOL &amp; ENGINE
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryEngine('brevo')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryEngine === 'brevo'
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Brevo HTTPS API
                    </span>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full border border-amber-300">
                      300 Free/Day
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Port 443 &bull; Free forever &bull; High deliverability (Recommended)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryEngine('resend')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryEngine === 'resend'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      Resend HTTPS API
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full border border-emerald-200">
                      Port 443
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    HTTPS Port 443 &bull; Cloud Run &amp; Firewall Ready
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryEngine('smtp')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    deliveryEngine === 'smtp'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-600" />
                      Direct SMTP
                    </span>
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full border border-slate-200">
                      Port 587/465
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Brevo Relay, Gmail App Passwords, Custom Server
                  </div>
                </button>
              </div>
            </div>

            {/* TAB 1: BREVO HTTPS API (PORT 443 - RECOMMENDED) */}
            {deliveryEngine === 'brevo' && (
              <div className="space-y-3.5">
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                  <div className="font-bold flex items-center justify-between text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      300 Free Emails / Day Forever &bull; HTTPS Port 443
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBrevoGuideOpen(true)}
                      className="text-[10px] font-bold text-blue-700 bg-white hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                    >
                      Step-by-Step Guide &rarr;
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    Brevo (formerly Sendinblue) provides <strong>300 free emails per day forever</strong>. Alerts transmit via secure <strong>HTTPS POST on Port 443</strong> (<code className="font-mono bg-amber-100/90 px-1 rounded">https://api.brevo.com/v3/smtp/email</code>), bypassing SMTP firewall restrictions.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      BREVO API KEY (v3)
                    </label>
                    <a
                      href="https://app.brevo.com/settings/keys/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Get API Key at brevo.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showBrevoKey ? 'text' : 'password'}
                      value={brevoApiKey}
                      onChange={(e) => setBrevoApiKey(e.target.value)}
                      placeholder="your-brevo-api-key"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:border-blue-500 outline-none pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowBrevoKey(!showBrevoKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {showBrevoKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Generate this in Brevo under <strong>SMTP &amp; API &rarr; API Keys</strong> (key starts with <code className="font-mono text-slate-700">xkeysib-</code>).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        VERIFIED SENDER EMAIL
                      </label>
                      <a
                        href="https://app.brevo.com/senders"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                      >
                        <span>Senders list</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="email"
                      value={brevoSenderEmail}
                      onChange={(e) => setBrevoSenderEmail(e.target.value)}
                      placeholder="your-verified-email@gmail.com"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Your Brevo registration email is automatically verified.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      SENDER DISPLAY NAME
                    </label>
                    <input
                      type="text"
                      value={brevoSenderName}
                      onChange={(e) => setBrevoSenderName(e.target.value)}
                      placeholder="DOST-PHIVOLCS Alert X"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Name appearing in recipient mailboxes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RESEND HTTPS API (PORT 443) */}
            {deliveryEngine === 'resend' && (
              <div className="space-y-3.5">
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    HTTPS Port 443 Egress &bull; No SMTP Blocking
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Resend transmits email alerts via <strong>HTTPS POST on Port 443</strong> (<code className="font-mono bg-emerald-100/80 px-1 rounded">https://api.resend.com/emails</code>). Standard cloud container environments (like Google Cloud Run) allow Port 443 while blocking raw SMTP ports (25, 465, 587).
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      RESEND API KEY (PORT 443)
                    </label>
                    <a
                      href="https://resend.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Get free key at resend.com</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={resendApiKey}
                      onChange={(e) => setResendApiKey(e.target.value)}
                      placeholder="your-resend-api-key"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:border-blue-500 outline-none pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Free accounts can send immediately to their registered mailbox using <code className="font-mono bg-slate-100 px-1 rounded">onboarding@resend.dev</code>.
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    SENDER "FROM" ADDRESS
                  </label>
                  <input
                    type="text"
                    value={resendFromAddress}
                    onChange={(e) => setResendFromAddress(e.target.value)}
                    placeholder="Alert X <onboarding@resend.dev>"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Default <code className="font-mono text-slate-600">Alert X &lt;onboarding@resend.dev&gt;</code> works out of the box with any Resend key.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: DIRECT SMTP FALLBACK */}
            {deliveryEngine === 'smtp' && (
              <div className="space-y-3">
                {/* Provider Preset Selector */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    SMTP PRESET
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePresetChange('direct')}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        smtpSettings.preset === 'direct'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Direct SMTP
                      </div>
                      <div className="text-[10px] text-slate-500">Port 465 SSL Relay</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetChange('brevo')}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        smtpSettings.preset === 'brevo'
                          ? 'border-amber-500 bg-amber-50/70 text-amber-950 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        Brevo Relay
                      </div>
                      <div className="text-[10px] text-slate-500">smtp-relay.brevo.com:587</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetChange('gmail')}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        smtpSettings.preset === 'gmail'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Gmail / Google</div>
                      <div className="text-[10px] text-slate-500">smtp.gmail.com:465</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetChange('outlook')}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        smtpSettings.preset === 'outlook'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Microsoft 365</div>
                      <div className="text-[10px] text-slate-500">smtp.office365.com</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetChange('custom')}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        smtpSettings.preset === 'custom'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Custom SMTP</div>
                      <div className="text-[10px] text-slate-500">Custom host & port</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePresetChange('sandbox')}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        smtpSettings.preset === 'sandbox'
                          ? 'border-blue-600 bg-blue-50/70 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">Ethereal Relay</div>
                      <div className="text-[10px] text-slate-500">Sandbox with preview</div>
                    </button>
                  </div>
                </div>

                {/* Direct SMTP Callout */}
                {smtpSettings.preset === 'direct' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Direct SMTP Configuration
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Configured for <code className="font-mono bg-emerald-100 px-1 rounded">{smtpSettings.host || 'your SMTP host'}:{smtpSettings.port}</code> using {smtpSettings.secure ? 'SSL/TLS' : 'STARTTLS'}. Confirm these settings and credentials with your email provider.
                    </p>
                  </div>
                )}

                {/* Brevo SMTP Tip Callout */}
                {smtpSettings.preset === 'brevo' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      Brevo SMTP Relay Configuration
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Use the SMTP login shown in Brevo under <strong>Settings &rarr; SMTP &amp; API &rarr; SMTP</strong> as the username. Depending on your account, it may differ from your Brevo account email. Use an <strong>SMTP key</strong> as the password; an API key or account password will not work. Port 587 uses STARTTLS, so leave SSL unchecked.
                    </p>
                  </div>
                )}

                {/* Gmail App Password Tip Callout */}
                {smtpSettings.preset === 'gmail' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      Sending via Gmail App Password
                    </div>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      To send emails from a Gmail account, use a <strong>16-character App Password</strong> (from <code>myaccount.google.com/apppasswords</code>). If your network blocks outbound TCP ports 465/587, use Brevo HTTPS API instead.
                    </p>
                  </div>
                )}

                {/* SMTP Fields */}
                {smtpSettings.preset !== 'sandbox' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          SMTP HOST
                        </label>
                        <input
                          type="text"
                          value={smtpSettings.host}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                          placeholder="smtp.gmail.com"
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          PORT
                        </label>
                        <input
                          type="text"
                          value={smtpSettings.port}
                          onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                          placeholder="465"
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        USERNAME / SENDER EMAIL
                      </label>
                      <input
                        type="email"
                        value={smtpSettings.user}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                        placeholder={smtpSettings.preset === 'brevo' ? 'SMTP login shown in Brevo SMTP settings' : 'your-email@gmail.com'}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          PASSWORD / SMTP KEY
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={smtpSettings.pass}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                        placeholder={smtpSettings.preset === 'gmail' ? '16-character Google App Password' : smtpSettings.preset === 'brevo' ? 'Brevo SMTP key' : '••••••••••••'}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="secureSsl"
                        checked={smtpSettings.secure}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, secure: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="secureSsl" className="text-xs text-slate-700 font-medium cursor-pointer">
                        Use SSL encryption (Port 465). Uncheck for STARTTLS (Port 587).
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
                className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${connectionStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test {deliveryEngine === 'brevo' ? 'Brevo Connection' : deliveryEngine === 'resend' ? 'Resend Connection' : 'SMTP Connection'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSmtpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveServiceSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save &amp; Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brevo Comprehensive Step-by-Step Integration Guide Modal */}
      {isBrevoGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Brevo (Sendinblue) Email Integration Guide
                  </h3>
                  <p className="text-xs text-slate-500">
                    Step-by-step instructions to deliver live earthquake bulletins with 300 free emails/day.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBrevoGuideOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Why Brevo Callout */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5">
              <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                Why Brevo is ideal for Alert X:
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-900">
                <li><strong>300 free emails per day forever:</strong> No trial expiration and no credit card required.</li>
                <li><strong>Port 443 HTTPS REST API:</strong> Cloud hosting (Cloud Run) allows Port 443 while blocking raw SMTP ports (25, 465, 587).</li>
                <li><strong>Immediate Sending:</strong> Your Brevo signup email is instantly verified as a sender—no custom domain setup needed to start testing.</li>
              </ul>
            </div>

            {/* Step-by-Step Steps */}
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">1</span>
                    <span className="text-xs font-bold text-slate-900">Create a Free Brevo Account</span>
                  </div>
                  <a
                    href="https://www.brevo.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Visit brevo.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                  Go to <strong>brevo.com</strong> and click "Sign up free". Choose the <strong>Free Plan</strong> (300 emails/day forever). Complete the email verification sent to your inbox.
                </p>
              </div>

              {/* Step 2 */}
              <div className="border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">2</span>
                    <span className="text-xs font-bold text-slate-900">Generate Your Brevo API Key</span>
                  </div>
                  <a
                    href="https://app.brevo.com/settings/keys/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Direct API Keys Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-xs text-slate-600 pl-7 space-y-1.5 leading-relaxed">
                  <p>In your Brevo dashboard:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-[11px]">
                    <li>Click your account name in top-right &rarr; <strong>SMTP &amp; API</strong>.</li>
                    <li>Click the <strong>API Keys</strong> tab.</li>
                    <li>Click <strong>Generate a new API key</strong>.</li>
                    <li>Name it (e.g. <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">AlertX-Dispatcher</code>) and click Generate.</li>
                    <li>Copy your key (starts with <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">xkeysib-...</code>).</li>
                  </ol>
                </div>
              </div>

              {/* Step 3 */}
              <div className="border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">3</span>
                    <span className="text-xs font-bold text-slate-900">Check Your Verified Sender Email</span>
                  </div>
                  <a
                    href="https://app.brevo.com/senders"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>Senders &amp; IP Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                  Go to <strong>Senders &amp; IP &rarr; Senders</strong>. The email address you used to register on Brevo (e.g. <code className="font-mono text-slate-800">{currentUser?.email || 'ebardo.glynbryan1@gmail.com'}</code>) is already verified! If you wish to send from an organizational email, click <em>Add a sender</em> and verify the confirmation email.
                </p>
              </div>

              {/* Step 4 */}
              <div className="border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">4</span>
                  <span className="text-xs font-bold text-slate-900">Paste Credentials into Alert X</span>
                </div>
                <div className="text-xs text-slate-600 pl-7 space-y-1.5 leading-relaxed">
                  <p>In Alert X:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-[11px]">
                    <li>Open <strong>Email Service Settings</strong> &rarr; Select <strong>Brevo HTTPS API</strong>.</li>
                    <li>Paste your API Key (<code className="font-mono text-slate-800">xkeysib-...</code>) into the Brevo API Key field.</li>
                    <li>Enter your verified Brevo email in <strong>Sender Email</strong>.</li>
                    <li>Click <strong>Test Brevo Connection</strong> to confirm live latency and account authentication.</li>
                    <li>Click <strong>Save &amp; Apply</strong>.</li>
                  </ol>
                </div>
              </div>

              {/* Step 5 */}
              <div className="border border-slate-200 rounded-xl p-3.5 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">5</span>
                  <span className="text-xs font-bold text-slate-900">Send Live Test Alert &amp; Check Inbox</span>
                </div>
                <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                  Enter your target email (e.g. <code className="font-mono text-slate-800">{recipientEmail || 'your-email@gmail.com'}</code>) in <strong>Test Recipient</strong> and click <strong>Send Test Email</strong>. Your test bulletin will be immediately dispatched and delivered to your inbox with full event telemetry!
                </p>
              </div>

              {/* Advanced Environment Variables Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Server className="w-3.5 h-3.5 text-slate-600" />
                  Optional: Production Environment Variables (.env)
                </div>
                <p className="text-[11px] text-slate-600">
                  To persist Brevo across all server instances and background jobs without manual UI entry, you can configure these variables in your deployment environment:
                </p>
                <div className="relative font-mono text-[10px] bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto">
                  <pre>
{`BREVO_API_KEY="your-brevo-api-key"
BREVO_SENDER_EMAIL="${brevoSenderEmail || 'your-email@domain.com'}"
BREVO_SENDER_NAME="DOST-PHIVOLCS Alert X"`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href="https://app.brevo.com/settings/keys/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5"
              >
                <span>Open Brevo Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBrevoGuideOpen(false);
                    setDeliveryEngine('brevo');
                    setIsSmtpModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Configure Brevo Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsBrevoGuideOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
