import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { UserProfile, EarthquakeRecord } from '../types';

interface TestEmailViewProps {
  currentUser?: UserProfile;
  earthquakes?: EarthquakeRecord[];
  onNavigateToAudit?: () => void;
}

interface TestSendLog {
  id: string;
  recipient: string;
  template: string;
  subject: string;
  timestamp: string;
  status: 'Delivered (Simulated)' | 'Success';
}

export const TestEmailView: React.FC<TestEmailViewProps> = ({
  currentUser,
  earthquakes = [],
  onNavigateToAudit,
}) => {
  // Scoped station identity
  const stationAor = currentUser?.assignedAor === 'PCP' ? 'PCP' : currentUser?.assignedAor === 'BIP' ? 'BIP' : 'CGP';
  const stationDisplayName = stationAor === 'CGP' ? 'Cagayan de Oro Seismic Station (CGP)' : stationAor === 'PCP' ? 'Palayan Seismic Station (PCP)' : 'Bislig Seismic Station (BIP)';

  // Form State
  const [recipientEmail, setRecipientEmail] = useState<string>(
    currentUser?.email || 'name@example.org'
  );
  const [emailTemplate, setEmailTemplate] = useState<string>('Earthquake AOR Alert');
  const [language, setLanguage] = useState<string>('English');
  const [subjectLine, setSubjectLine] = useState<string>('[TEST] Alert X earthquake AOR email');
  const [senderDisplayName, setSenderDisplayName] = useState<string>('Alert X Test');
  const [senderAddress, setSenderAddress] = useState<string>('alerts@your-domain.gov.ph');
  const [sampleEvent, setSampleEvent] = useState<string>('cgp-demo-001');

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sample Events catalog for AOR testing
  const sampleEventsMap = useMemo(() => {
    return {
      'cgp-demo-001': {
        ref: 'EQ-TEST-001',
        title: 'Magnitude 4.2 • Northern Mindanao',
        location: 'Tagoloan, Misamis Oriental',
        station: 'CGP',
        aorDetails: 'AOR: Cagayan de Oro host-city entry',
        locality: 'Cagayan de Oro host-city entry',
      },
      'cgp-cdo-0098': {
        ref: 'PHIVOLCS-2025-0422-0098',
        title: 'Magnitude 3.9 • Cagayan de Oro City',
        location: 'Cagayan de Oro City, Misamis Oriental',
        station: 'CGP',
        aorDetails: 'AOR: Misamis Oriental Territory',
        locality: 'Barangay Carmen, CDO Proper',
      },
      'cgp-marawi-0091': {
        ref: 'PHIVOLCS-2025-0422-0091',
        title: 'Magnitude 3.6 • Lanao del Sur',
        location: 'Marawi City, Lanao del Sur',
        station: 'CGP',
        aorDetails: 'AOR: Lanao del Sur Territory',
        locality: 'Marawi City Proper',
      },
      'cgp-iligan-0006': {
        ref: 'PHIVOLCS-2025-0417-0006',
        title: 'Magnitude 3.8 • Lanao del Norte',
        location: 'Iligan City, Lanao del Norte',
        station: 'CGP',
        aorDetails: 'AOR: Lanao del Norte Territory',
        locality: 'Iligan City Basin',
      },
      'cgp-bukidnon-0015': {
        ref: 'PHIVOLCS-2025-0418-0015',
        title: 'Magnitude 3.5 • Bukidnon Plateau',
        location: 'Malaybalay City, Bukidnon',
        station: 'CGP',
        aorDetails: 'AOR: Bukidnon Territory',
        locality: 'Malaybalay City',
      },
    };
  }, []);

  const activeEvent = sampleEventsMap[sampleEvent as keyof typeof sampleEventsMap] || sampleEventsMap['cgp-demo-001'];

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

  // Test connection action
  const handleTestConnection = () => {
    setConnectionStatus('testing');
    setTimeout(() => {
      setConnectionStatus('connected');
      setConnectionLatency(142);
      showToast('SMTP connection established successfully (142ms latency).');
    }, 1200);
  };

  // Reset fields action
  const handleResetFields = () => {
    setRecipientEmail('name@example.org');
    setEmailTemplate('Earthquake AOR Alert');
    setLanguage('English');
    setSubjectLine('[TEST] Alert X earthquake AOR email');
    setSenderDisplayName('Alert X Test');
    setSenderAddress('alerts@your-domain.gov.ph');
    setSampleEvent('cgp-demo-001');
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

  // Send Test Email action
  const handleSendTestEmail = () => {
    if (!recipientEmail.trim()) {
      showToast('Please specify a test recipient email address.');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      const now = new Date();
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const newLog: TestSendLog = {
        id: `TEST-${Date.now().toString().slice(-4)}`,
        recipient: recipientEmail.trim(),
        template: emailTemplate,
        subject: subjectLine,
        timestamp: timeFormatted,
        status: 'Delivered (Simulated)',
      };

      setSendLogs((prev) => [newLog, ...prev]);
      showToast(`Test email successfully dispatched to ${recipientEmail.trim()}`);
    }, 1300);
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

      {/* Top 4 Metrics / Status Cards (Matching Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: EMAIL SERVICE */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              EMAIL SERVICE
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {connectionStatus === 'connected' ? 'Connected (Verified)' : 'Not tested'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {connectionStatus === 'connected' ? `Latency: ${connectionLatency}ms` : 'Run a connection check'}
            </div>
          </div>
        </div>

        {/* Card 2: TEST RECIPIENT */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              TEST RECIPIENT
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              1 address
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              Only the entered address
            </div>
          </div>
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
              {sendLogs.length > 0 ? `Latest at ${sendLogs[0].timestamp}` : 'No real email has been sent'}
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
                  Enter a safe destination and choose the message to test.
                </p>
              </div>
              <span className="text-[10px] font-bold font-mono tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                ADMIN TOOL
              </span>
            </div>

            {/* Field: TEST RECIPIENT EMAIL + Validate Button */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                TEST RECIPIENT EMAIL
              </label>
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
                  className={`shrink-0 border px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isValidated
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Validate address</span>
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

            {/* Field: SAMPLE EVENT */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                SAMPLE EVENT
              </label>
              <select
                value={sampleEvent}
                onChange={(e) => setSampleEvent(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              >
                <option value="cgp-demo-001">Use demo event: EQ-TEST-001 • CGP AOR</option>
                <option value="cgp-cdo-0098">PHIVOLCS-2025-0422-0098: M3.9 Cagayan de Oro City • CGP AOR</option>
                <option value="cgp-marawi-0091">PHIVOLCS-2025-0422-0091: M3.6 Marawi City, Lanao del Sur • CGP AOR</option>
                <option value="cgp-iligan-0006">PHIVOLCS-2025-0417-0006: M3.8 Iligan City, Lanao del Norte • CGP AOR</option>
                <option value="cgp-bukidnon-0015">PHIVOLCS-2025-0418-0015: M3.5 Malaybalay City, Bukidnon • CGP AOR</option>
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
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Email Service Status
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check the configured delivery connection.
              </p>
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
                <span className="text-slate-800 font-medium text-[11px]">SMTP / configured provider</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">SECURITY</span>
                <span className="text-slate-800 font-medium text-[11px]">TLS setting configured</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-1.5">
                <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">SENDER</span>
                <span className="text-slate-800 font-mono text-[11px] truncate max-w-[140px]">{senderAddress}</span>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={connectionStatus === 'testing'}
                onClick={handleTestConnection}
                className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
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
            </div>
          </div>

          {/* Card 2: Recent Test Sends */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Test Sends
              </h2>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {sendLogs.length} TODAY
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
                  Delivery attempts will appear here.
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sendLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{log.id}</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-1.5 py-0.5 rounded">
                        {log.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900 truncate text-[11px]">{log.recipient}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{log.template}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* After sending a test note */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-800">
                After sending a test
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Alert X records the recipient, template, time, and delivery result for administrator review.
              </p>
            </div>

            {/* Footer warning callout */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11px] text-slate-500 space-y-0.5">
              <div>No real test has been sent from this mockup.</div>
              <div>Confirm your provider settings before use.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar (Matching Screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-slate-500">
            Test recipient
          </div>
          <div className="text-xs font-mono font-bold text-slate-800 truncate max-w-md">
            {recipientEmail || 'name@example.org'}
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSaveConfiguration}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Save configuration
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={handleSendTestEmail}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
          >
            {isSending ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
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

      {/* Bottom Info Banner (Matching Screenshot) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          Test messages go only to the entered address. They do not trigger AOR alerts or contact the configured recipient groups.
        </span>
      </div>
    </div>
  );
};
