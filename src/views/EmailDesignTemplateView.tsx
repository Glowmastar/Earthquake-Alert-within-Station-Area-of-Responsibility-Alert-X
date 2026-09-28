import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Edit3,
  Eye,
  Code,
  Info,
  Check,
  CheckCircle2,
  Mail,
  Save,
  Plus,
  MoreVertical,
  AlertTriangle,
  Copy,
  ExternalLink,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Image as ImageIcon,
  X,
  Send,
  Sparkles,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { UserProfile, EarthquakeRecord } from '../types';

export interface EmailTemplate {
  id: string;
  name: string;
  status: 'Active' | 'Draft';
  subject: string;
  preheader: string;
  bodyIntro: string;
  eventHeading: string;
  closingNote1: string;
  closingNote2: string;
  actionButtonText: string;
  lastUpdated: string;
}

const INITIAL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-1',
    name: 'AOR Earthquake Alert',
    status: 'Active',
    subject: 'Earthquake Alert: {{magnitude}} — {{location}}',
    preheader: 'New earthquake event matched to your station AOR.',
    bodyIntro:
      "An earthquake event has been matched to your station's approved Area of Responsibility.",
    eventHeading: 'Event Details',
    closingNote1:
      'Alert decision is based on validated coordinates and the approved station AOR.',
    closingNote2: 'Open Alert X to review event details.',
    actionButtonText: 'View Event Details',
    lastUpdated: 'Sep 24, 2026',
  },
  {
    id: 'tpl-2',
    name: 'Recipient Verification',
    status: 'Active',
    subject: 'Alert X — Verify your station alert subscription for {{station_name}}',
    preheader: 'Please confirm your email address to receive immediate seismic warnings.',
    bodyIntro:
      "You have been registered to receive critical seismic bulletins for {{station_name}} Area of Responsibility.",
    eventHeading: 'Subscription Details',
    closingNote1:
      'Please click below to verify your email address and activate real-time alerts.',
    closingNote2: 'If you did not request this, please notify your station administrator.',
    actionButtonText: 'Confirm Verification',
    lastUpdated: 'Sep 20, 2026',
  },
  {
    id: 'tpl-3',
    name: 'Test Notification',
    status: 'Draft',
    subject: '[DRILL] Alert X Earthquake Warning Simulation — {{magnitude}}',
    preheader: 'This is a test notification for station equipment and email deliverability checks.',
    bodyIntro:
      'This is a routine drill bulletin issued to test email alert latency and deliverability.',
    eventHeading: 'Test Event Parameters',
    closingNote1: 'No action required. This drill verifies emergency response channels.',
    closingNote2: 'Contact station communications team for queries.',
    actionButtonText: 'Acknowledge Drill Receipt',
    lastUpdated: 'Sep 24, 2026',
  },
];

const AVAILABLE_VARIABLES = [
  { tag: '{{origin_time}}', desc: 'Date & time of earthquake origin in PST' },
  { tag: '{{magnitude}}', desc: 'Calculated Richter magnitude (e.g. M 5.8)' },
  { tag: '{{depth_km}}', desc: 'Hypocenter focal depth in kilometers' },
  { tag: '{{latitude}}', desc: 'Epicenter latitude coordinate' },
  { tag: '{{longitude}}', desc: 'Epicenter longitude coordinate' },
  { tag: '{{eqinfo_location}}', desc: 'Official PHIVOLCS reference locality' },
  { tag: '{{station_name}}', desc: 'Name of the designated seismic station' },
];

interface EmailDesignTemplateViewProps {
  currentUser?: UserProfile;
  onNavigateToAudit?: () => void;
  earthquakes?: EarthquakeRecord[];
}

export const EmailDesignTemplateView: React.FC<EmailDesignTemplateViewProps> = ({
  currentUser,
  onNavigateToAudit,
  earthquakes = [],
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(INITIAL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-1');

  // Active Template being edited
  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // Template Editor form state
  const [templateName, setTemplateName] = useState(currentTemplate.name);
  const [emailSubject, setEmailSubject] = useState(currentTemplate.subject);
  const [preheader, setPreheader] = useState(currentTemplate.preheader);
  const [bodyIntro, setBodyIntro] = useState(currentTemplate.bodyIntro);
  const [closingNote1, setClosingNote1] = useState(currentTemplate.closingNote1);
  const [closingNote2, setClosingNote2] = useState(currentTemplate.closingNote2);

  // Sync editor when switching template selection
  const handleSelectTemplate = (tpl: EmailTemplate) => {
    setSelectedTemplateId(tpl.id);
    setTemplateName(tpl.name);
    setEmailSubject(tpl.subject);
    setPreheader(tpl.preheader);
    setBodyIntro(tpl.bodyIntro);
    setClosingNote1(tpl.closingNote1);
    setClosingNote2(tpl.closingNote2);
  };

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modals & Menus
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState(
    'ebardo.glynbryan1@gmail.com'
  );
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailSentSuccess, setTestEmailSentSuccess] = useState(false);

  const [isNewTemplateModalOpen, setIsNewTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Stats
  const activeCount = templates.filter((t) => t.status === 'Active').length;
  const draftCount = templates.filter((t) => t.status === 'Draft').length;

  // Save changes
  const handleSaveDraft = () => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === currentTemplate.id
          ? {
              ...t,
              name: templateName,
              subject: emailSubject,
              preheader: preheader,
              bodyIntro: bodyIntro,
              closingNote1: closingNote1,
              closingNote2: closingNote2,
              lastUpdated: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            }
          : t
      )
    );
    showToast(`Template "${templateName}" saved successfully.`);
  };

  const handleToggleActive = () => {
    const nextStatus = currentTemplate.status === 'Active' ? 'Draft' : 'Active';
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === currentTemplate.id
          ? {
              ...t,
              status: nextStatus,
              lastUpdated: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            }
          : t
      )
    );
    showToast(
      nextStatus === 'Active'
        ? `Template "${templateName}" is now Active.`
        : `Template "${templateName}" changed to Draft.`
    );
  };

  const handleCreateNewTemplate = () => {
    if (!newTemplateName.trim()) {
      showToast('Please enter a template name.');
      return;
    }
    const newId = `tpl-${Date.now()}`;
    const newTpl: EmailTemplate = {
      id: newId,
      name: newTemplateName.trim(),
      status: 'Draft',
      subject: 'Earthquake Advisory: {{magnitude}} — {{station_name}}',
      preheader: 'Preliminary bulletin regarding recent seismic event.',
      bodyIntro:
        'An advisory event has been logged and matched to station monitoring guidelines.',
      eventHeading: 'Event Details',
      closingNote1:
        'Information verified by automated seismic network algorithms.',
      closingNote2: 'Please log in to the Alert X console for complete telemetry.',
      actionButtonText: 'View Event Details',
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setTemplates((prev) => [...prev, newTpl]);
    handleSelectTemplate(newTpl);
    setNewTemplateName('');
    setIsNewTemplateModalOpen(false);
    showToast(`New template "${newTpl.name}" created as Draft.`);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (templates.length <= 1) {
      showToast('Cannot delete the only remaining template.');
      return;
    }
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (selectedTemplateId === id) {
      const remaining = templates.filter((t) => t.id !== id);
      handleSelectTemplate(remaining[0]);
    }
    setActiveMenuId(null);
    showToast(`Template "${name}" removed.`);
  };

  const handleDuplicateTemplate = (tpl: EmailTemplate) => {
    const copyId = `tpl-${Date.now()}`;
    const copyTpl: EmailTemplate = {
      ...tpl,
      id: copyId,
      name: `${tpl.name} (Copy)`,
      status: 'Draft',
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setTemplates((prev) => [...prev, copyTpl]);
    handleSelectTemplate(copyTpl);
    setActiveMenuId(null);
    showToast(`Duplicated template as "${copyTpl.name}".`);
  };

  const handleCopyVariable = (tag: string) => {
    navigator.clipboard.writeText(tag);
    showToast(`Copied ${tag} to clipboard.`);
  };

  const handleSendTestEmail = () => {
    setTestEmailSending(true);
    setTimeout(() => {
      setTestEmailSending(false);
      setTestEmailSentSuccess(true);
      setTimeout(() => {
        setIsTestEmailModalOpen(false);
        setTestEmailSentSuccess(false);
        showToast(`Test email successfully dispatched to ${testEmailRecipient}`);
      }, 1500);
    }, 1200);
  };

  // Sample event for realistic preview (M 5.8 Davao Oriental, matching the screenshot)
  const sampleEvent = {
    magnitude: '5.8',
    location: 'Davao Oriental',
    originTime: 'Sep 22, 2026 17:17:57 (PST)',
    depthKm: '29.0',
    latitude: '7.550',
    longitude: '126.540',
    eqinfoLocation: '003 km S 35° W of Baganga (Davao Oriental)',
    stationName: 'Tandag Station',
  };

  return (
    <div className="space-y-4 pb-8 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs border border-slate-700 animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Row 1: Top 3 Stat Cards (Matches Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Templates Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center gap-4 transition-all hover:border-slate-300">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 tracking-wide">
              Active Templates
            </div>
            <div className="text-3xl font-extrabold text-blue-600 tracking-tight mt-0.5">
              {activeCount}
            </div>
          </div>
        </div>

        {/* Draft Templates Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center gap-4 transition-all hover:border-slate-300">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 tracking-wide">
              Draft Templates
            </div>
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight mt-0.5">
              {draftCount}
            </div>
          </div>
        </div>

        {/* Last Updated Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex items-center gap-4 transition-all hover:border-slate-300">
          <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 tracking-wide">
              Last Updated
            </div>
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight mt-0.5">
              {currentTemplate.lastUpdated}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 3-Column Working Grid (Templates List | Template Editor | Email Preview & Variables) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Column 1: Templates List (col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col">
          {/* Card Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Templates
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsNewTemplateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Template</span>
            </button>
          </div>

          {/* Templates Stack */}
          <div className="space-y-2.5">
            {templates.map((tpl) => {
              const isSelected = tpl.id === selectedTemplateId;
              const isActive = tpl.status === 'Active';

              return (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`relative group rounded-xl p-3.5 transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 shadow-xs ring-1 ring-blue-500/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Status indicator dot and text */}
                      <div className="flex items-center gap-1.5 text-[11px] mb-1">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isActive ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        <span
                          className={`font-semibold ${
                            isActive ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {tpl.status}
                        </span>
                      </div>

                      {/* Template Title */}
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {tpl.name}
                      </div>
                    </div>

                    {/* Three-dots menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(
                            activeMenuId === tpl.id ? null : tpl.id
                          );
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Template actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === tpl.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleActive();
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              Set as {tpl.status === 'Active' ? 'Draft' : 'Active'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateTemplate(tpl)}
                            className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Duplicate</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                            className="w-full text-left px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Template Editor (col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Template Editor
            </h2>
          </div>

          {/* Field 1: Template Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="e.g. AOR Earthquake Alert"
            />
          </div>

          {/* Field 2: Email Subject */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Email Subject
              </label>
              <span className="text-[10px] text-slate-400">
                Variables supported
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                placeholder="Earthquake Alert: {{magnitude}} — {{location}}"
              />
            </div>
          </div>

          {/* Field 3: Preheader (preview text) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Preheader (preview text)
            </label>
            <input
              type="text"
              value={preheader}
              onChange={(e) => setPreheader(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              placeholder="New earthquake event matched to your station AOR."
            />
          </div>

          {/* Field 4: Rich Text Toolbar & Body Area */}
          <div className="space-y-1.5 pt-1">
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
              <button
                type="button"
                className="p-1 hover:bg-slate-200/80 rounded transition-colors"
                title="Bold"
                onClick={() => showToast('Formatting applied.')}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-slate-200/80 rounded transition-colors"
                title="Italic"
                onClick={() => showToast('Formatting applied.')}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-slate-200/80 rounded transition-colors"
                title="Insert Link"
                onClick={() => showToast('Link tool ready.')}
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3.5 bg-slate-200 mx-0.5" />
              <button
                type="button"
                className="p-1 hover:bg-slate-200/80 rounded transition-colors"
                title="Bullet List"
                onClick={() => showToast('List inserted.')}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-slate-200/80 rounded transition-colors"
                title="Numbered List"
                onClick={() => showToast('Numbered list inserted.')}
              >
                <ListOrdered className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-slate-200/80 rounded transition-colors"
                title="Insert Image / Logo"
                onClick={() => showToast('Brand logo embedded.')}
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Editor Canvas Box (Stylized representation matching Screenshot) */}
            <div className="border border-slate-200 rounded-xl bg-slate-50/40 p-4 space-y-3 font-sans text-xs">
              {/* Brand Header */}
              <div>
                <div className="font-black text-sm tracking-wider text-slate-900 flex items-center gap-1">
                  ALERT <span className="text-cyan-500">X</span>
                </div>
                <div className="font-bold text-blue-600 text-xs tracking-tight">
                  EARTHQUAKE ALERT
                </div>
              </div>

              {/* Intro Text */}
              <input
                type="text"
                value={bodyIntro}
                onChange={(e) => setBodyIntro(e.target.value)}
                className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-slate-700 text-xs py-0.5"
              />

              {/* Event Details Section */}
              <div className="pt-1">
                <div className="font-bold text-blue-600 text-xs mb-2">
                  Event Details
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-700 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-slate-600 font-medium">
                      Date & Time:
                    </span>
                    <span className="bg-blue-100/90 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      {'{{origin_time}}'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-slate-600 font-medium">
                      Magnitude:
                    </span>
                    <span className="bg-blue-100/90 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      {'{{magnitude}}'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-slate-600 font-medium">
                      Depth:
                    </span>
                    <span className="bg-blue-100/90 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      {'{{depth_km}}'}
                    </span>
                    <span className="font-sans text-slate-600">km</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-slate-600 font-medium">
                      Epicenter:
                    </span>
                    <span className="bg-blue-100/90 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      {'{{latitude}}'}
                    </span>
                    <span>,</span>
                    <span className="bg-blue-100/90 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      {'{{longitude}}'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-slate-600 font-medium">
                      Reference Location:
                    </span>
                    <span className="bg-blue-100/90 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      {'{{eqinfo_location}}'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans text-slate-600 font-medium">
                      Station:
                    </span>
                    <span className="bg-blue-100/90 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                      {'{{station_name}}'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footers */}
              <div className="pt-2 text-[11px] text-slate-500 space-y-1">
                <input
                  type="text"
                  value={closingNote1}
                  onChange={(e) => setClosingNote1(e.target.value)}
                  className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-[11px] py-0.5 text-slate-500"
                />
                <input
                  type="text"
                  value={closingNote2}
                  onChange={(e) => setClosingNote2(e.target.value)}
                  className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none text-[11px] py-0.5 text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons in Middle Column (Save Draft & Preview Email) */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Email</span>
            </button>
          </div>
        </div>

        {/* Column 3: Email Preview & Available Variables (col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Top Card: Email Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
              <Eye className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Email Preview
              </h2>
            </div>

            {/* Email Canvas Box */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
              {/* Email Top Header with Seismic Brand & Waveform */}
              <div className="flex items-center justify-between pb-2 border-b-2 border-cyan-400">
                <div className="font-black text-sm tracking-wider text-slate-900 flex items-center gap-1 leading-none">
                  ALERT <span className="text-cyan-500">X</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-600">
                  <svg
                    className="w-5 h-5 text-cyan-500 shrink-0"
                    viewBox="0 0 32 32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 16h4l3-8 5 18 4-13 3 6 2-3h7" />
                  </svg>
                  <div className="text-[8px] font-bold tracking-wider uppercase leading-tight text-slate-700">
                    People Safer
                    <br />
                    <span className="text-cyan-600">Communities Stronger</span>
                  </div>
                </div>
              </div>

              {/* Title & Preheader */}
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight leading-snug">
                  Earthquake Alert: M {sampleEvent.magnitude} — {sampleEvent.location}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  {preheader}
                </p>
              </div>

              {/* Event Details Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs space-y-2">
                <div className="font-bold text-blue-700 text-xs tracking-tight">
                  Event Details
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Date & Time:</span>
                    <span className="text-slate-900 font-semibold">
                      {sampleEvent.originTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Magnitude:</span>
                    <span className="text-slate-900 font-semibold">
                      {sampleEvent.magnitude}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Depth:</span>
                    <span className="text-slate-900 font-semibold">
                      {sampleEvent.depthKm} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Epicenter:</span>
                    <span className="text-slate-900 font-semibold">
                      {sampleEvent.latitude}, {sampleEvent.longitude}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium shrink-0">
                      Reference Location:
                    </span>
                    <span className="text-slate-900 font-semibold text-right truncate pl-2">
                      {sampleEvent.eqinfoLocation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Station:</span>
                    <span className="text-slate-900 font-semibold">
                      {sampleEvent.stationName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-500 leading-tight">
                {closingNote1}
              </p>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => showToast('Opening event details...')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <span>▷</span>
                <span>{currentTemplate.actionButtonText}</span>
              </button>
            </div>
          </div>

          {/* Bottom Card: Available Variables */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Code className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Available Variables
              </h2>
            </div>

            {/* Pills grid */}
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleCopyVariable(v.tag)}
                  title={`Click to copy: ${v.desc}`}
                  className="bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/70 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>{v.tag}</span>
                </button>
              ))}
            </div>

            {/* Amber Warning Notice Card */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-xs text-amber-800">
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                !
              </span>
              <p className="text-[11px] leading-tight">
                Template variables are filled from validated event and station data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Bottom Action Bar (Matches Screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Audit Log Link Notice */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-serif font-bold shrink-0">
            i
          </div>
          <span>
            Template edits are recorded in the{' '}
            <button
              type="button"
              onClick={onNavigateToAudit}
              className="font-semibold text-slate-800 underline hover:text-blue-600 transition-colors"
            >
              Audit Log
            </button>
            .
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsTestEmailModalOpen(true)}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Test Email</span>
          </button>
          <button
            type="button"
            onClick={handleToggleActive}
            className={`font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs ${
              currentTemplate.status === 'Active'
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>
              {currentTemplate.status === 'Active' ? 'Active' : 'Set as Active'}
            </span>
          </button>
        </div>
      </div>

      {/* Send Test Email Modal */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Send Test Alert Email
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Verify email layout rendering and deliverability
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Active Template
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    {templateName}
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    {currentTemplate.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Simulated Event
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-[11px] text-slate-600">
                  <div>
                    <strong>Magnitude:</strong> M {sampleEvent.magnitude}
                  </div>
                  <div>
                    <strong>Location:</strong> {sampleEvent.location}
                  </div>
                  <div>
                    <strong>Station:</strong> {sampleEvent.stationName}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={testEmailSending || testEmailSentSuccess}
                onClick={handleSendTestEmail}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                {testEmailSending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : testEmailSentSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Sent!</span>
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
        </div>
      )}

      {/* New Template Modal */}
      {isNewTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Create New Template
              </h3>
              <button
                type="button"
                onClick={() => setIsNewTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Tsunami Advisory Alert"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewTemplateModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Template</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Full Email Client Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Chrome Mockup */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 text-xs border-b border-slate-200 text-slate-600 flex items-center justify-between">
                <div>
                  <strong>Subject:</strong> Earthquake Alert: M {sampleEvent.magnitude} — {sampleEvent.location}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  From: alerts@alertx.gov.ph
                </div>
              </div>
              <div className="p-6 bg-white space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b-2 border-cyan-400">
                  <div className="font-black text-lg tracking-wider text-slate-900">
                    ALERT <span className="text-cyan-500">X</span>
                  </div>
                  <div className="text-[10px] font-bold text-cyan-600 uppercase text-right">
                    People Safer • Communities Stronger
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-base text-slate-900">
                    Earthquake Alert: M {sampleEvent.magnitude} — {sampleEvent.location}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{preheader}</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                  <div className="font-bold text-blue-700">Event Details</div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-500">Date & Time: </span>
                      {sampleEvent.originTime}
                    </div>
                    <div>
                      <span className="text-slate-500">Magnitude: </span>
                      {sampleEvent.magnitude}
                    </div>
                    <div>
                      <span className="text-slate-500">Depth: </span>
                      {sampleEvent.depthKm} km
                    </div>
                    <div>
                      <span className="text-slate-500">Epicenter: </span>
                      {sampleEvent.latitude}, {sampleEvent.longitude}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Reference: </span>
                      {sampleEvent.eqinfoLocation}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Station: </span>
                      {sampleEvent.stationName}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500">{closingNote1}</p>
                <div className="pt-2">
                  <button
                    type="button"
                    className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg text-xs"
                  >
                    ▷ {currentTemplate.actionButtonText}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
