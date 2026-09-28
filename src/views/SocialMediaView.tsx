import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  Calendar,
  Megaphone,
  Search,
  Filter,
  RotateCcw,
  Edit,
  Trash2,
  CheckCircle2,
  Info,
  X,
  Plus,
  Send,
  Eye,
  Archive,
  Download,
  Check,
  Share2,
  Sparkles,
} from 'lucide-react';

export type PlatformType = 'Facebook' | 'X / Twitter' | 'Website';
export type PostStatus = 'Draft' | 'Pending Approval' | 'Scheduled' | 'Published' | 'Rejected';
export type ContentType = 'Intensity Update' | 'Infographic' | 'Advisory' | 'General Update' | 'Safety Tips';

export interface SocialMediaPost {
  id: string; // e.g. SM-2025-0423-001
  referenceEqInfo: string; // e.g. 2025-04-23 08:15
  eventDate: string; // e.g. Apr 23, 2025
  contentType: ContentType;
  platform: PlatformType;
  createdBy: string; // e.g. MDRRMO
  scheduledTime: string; // e.g. Apr 23, 2025 11:00 AM or —
  status: PostStatus;
  title: string;
  content: string;
  hashtags: string;
  hasInfographic: boolean;
  checklist: {
    reportValidated: boolean;
    duplicateChecked: boolean;
    eqInfoConfirmed: boolean;
    intensityVerified: boolean;
    imageAttached: boolean;
    approvalCompleted: boolean;
  };
}

const INITIAL_POSTS: SocialMediaPost[] = [
  {
    id: 'SM-2025-0423-001',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    contentType: 'Intensity Update',
    platform: 'Facebook',
    createdBy: 'MDRRMO',
    scheduledTime: 'Apr 23, 2025 11:00 AM',
    status: 'Draft',
    title: 'PHIVOLCS Earthquake Intensity Report',
    content: `PHIVOLCS Earthquake Intensity Report\n\nIntensity V in Lebak, Sultan Kudarat; IV in Kalamansig; III in Surallah; II in General Santos City; and I in Koronadal based on instrumental and reported intensities.\n\nStay informed and be prepared.`,
    hashtags: '#PHIVOLCS #EarthquakePH #EarthquakeIntensity',
    hasInfographic: true,
    checklist: {
      reportValidated: true,
      duplicateChecked: true,
      eqInfoConfirmed: true,
      intensityVerified: true,
      imageAttached: true,
      approvalCompleted: true,
    },
  },
  {
    id: 'SM-2025-0423-002',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    contentType: 'Intensity Update',
    platform: 'X / Twitter',
    createdBy: 'Kalamansig',
    scheduledTime: '—',
    status: 'Pending Approval',
    title: 'Earthquake Intensity Update (M6.1 Sultan Kudarat)',
    content: `PHIVOLCS EQ UPDATE: Intensity V recorded in Lebak, IV in Kalamansig, III in Surallah. Take precautionary safety measures and expect aftershocks. Keep emergency lines clear.`,
    hashtags: '#EarthquakePH #SultanKudarat #PHIVOLCS',
    hasInfographic: true,
    checklist: {
      reportValidated: true,
      duplicateChecked: true,
      eqInfoConfirmed: true,
      intensityVerified: true,
      imageAttached: true,
      approvalCompleted: false,
    },
  },
  {
    id: 'SM-2025-0423-003',
    referenceEqInfo: '2025-04-23 08:15',
    eventDate: 'Apr 23, 2025',
    contentType: 'Infographic',
    platform: 'Facebook',
    createdBy: 'GSC DRRMO',
    scheduledTime: 'Apr 23, 2025 02:00 PM',
    status: 'Scheduled',
    title: 'Official Intensity Map & Summary Bulletin',
    content: `General Santos City DRRMO shares the official PHIVOLCS Earthquake Intensity Map for the M6.1 offshore Sultan Kudarat earthquake. Intensity II felt in GenSan. No major damages reported.`,
    hashtags: '#GenSanDRRMO #PHIVOLCS #StaySafe',
    hasInfographic: true,
    checklist: {
      reportValidated: true,
      duplicateChecked: true,
      eqInfoConfirmed: true,
      intensityVerified: true,
      imageAttached: true,
      approvalCompleted: true,
    },
  },
  {
    id: 'SM-2025-0422-008',
    referenceEqInfo: '2025-04-22 14:30',
    eventDate: 'Apr 22, 2025',
    contentType: 'Advisory',
    platform: 'Website',
    createdBy: 'PHIVOLCS',
    scheduledTime: 'Apr 22, 2025 03:00 PM',
    status: 'Published',
    title: 'Earthquake Information No. 2 - Davao Oriental',
    content: `PHIVOLCS Earthquake Information No. 2: Magnitude 5.4 located 35 km SE of Governor Generoso, Davao Oriental. Felt at Intensity IV in Mati City, III in Tagum City.`,
    hashtags: '#EarthquakeInformation #PHIVOLCS',
    hasInfographic: true,
    checklist: {
      reportValidated: true,
      duplicateChecked: true,
      eqInfoConfirmed: true,
      intensityVerified: true,
      imageAttached: true,
      approvalCompleted: true,
    },
  },
  {
    id: 'SM-2025-0421-005',
    referenceEqInfo: '2025-04-21 11:10',
    eventDate: 'Apr 21, 2025',
    contentType: 'Infographic',
    platform: 'X / Twitter',
    createdBy: 'Surallah',
    scheduledTime: 'Apr 21, 2025 01:00 PM',
    status: 'Published',
    title: 'Surallah LDRRMO Felt Intensity Advisory',
    content: `Surallah MDRRMO Intensity Notice: Instrumental Intensity III recorded at the local municipal hall seismic station. Inspect structures for hairline fissures.`,
    hashtags: '#Surallah #SouthCotabato #EarthquakePH',
    hasInfographic: true,
    checklist: {
      reportValidated: true,
      duplicateChecked: true,
      eqInfoConfirmed: true,
      intensityVerified: true,
      imageAttached: true,
      approvalCompleted: true,
    },
  },
  {
    id: 'SM-2025-0420-004',
    referenceEqInfo: '2025-04-20 09:05',
    eventDate: 'Apr 20, 2025',
    contentType: 'General Update',
    platform: 'Facebook',
    createdBy: 'Koronadal',
    scheduledTime: '—',
    status: 'Rejected',
    title: 'Unverified Intensity Claim (Superseded)',
    content: `Preliminary report from field survey team indicated higher localized shaking. Post rejected after instrumental calibration confirmed Intensity I only.`,
    hashtags: '#EarthquakeReport',
    hasInfographic: false,
    checklist: {
      reportValidated: false,
      duplicateChecked: true,
      eqInfoConfirmed: true,
      intensityVerified: false,
      imageAttached: false,
      approvalCompleted: false,
    },
  },
  {
    id: 'SM-2025-0419-003',
    referenceEqInfo: '2025-04-19 16:20',
    eventDate: 'Apr 19, 2025',
    contentType: 'Safety Tips',
    platform: 'X / Twitter',
    createdBy: 'PHIVOLCS',
    scheduledTime: 'Apr 19, 2025 06:00 PM',
    status: 'Published',
    title: 'What to Do During an Earthquake: Duck, Cover, and Hold',
    content: `SAFETY REMINDER: During strong ground shaking, practice Duck, Cover, and Hold under a sturdy table. Stay away from glass windows and heavy hanging fixtures.`,
    hashtags: '#DuckCoverHold #BatingawPH #DisasterPreparedness',
    hasInfographic: true,
    checklist: {
      reportValidated: true,
      duplicateChecked: true,
      eqInfoConfirmed: true,
      intensityVerified: true,
      imageAttached: true,
      approvalCompleted: true,
    },
  },
];

export interface SocialMediaViewProps {
  onNavigateToFieldReports?: () => void;
  onNavigateToConsolidator?: () => void;
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({
  onNavigateToFieldReports,
  onNavigateToConsolidator,
}) => {
  const [posts, setPosts] = useState<SocialMediaPost[]>(INITIAL_POSTS);
  const [selectedPostId, setSelectedPostId] = useState<string>('SM-2025-0423-001');
  const [bannerVisible, setBannerVisible] = useState<boolean>(true);

  // Filters
  const [refEqFilter, setRefEqFilter] = useState('All EQInfo');
  const [dateRange, setDateRange] = useState('2025-04-01 — 2025-04-30');
  const [platformFilter, setPlatformFilter] = useState('All Platforms');
  const [postStatusFilter, setPostStatusFilter] = useState('All Statuses');
  const [analystFilter, setAnalystFilter] = useState('All Analysts');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Post for Editor
  const selectedPost = useMemo(() => {
    return posts.find((p) => p.id === selectedPostId) || posts[0];
  }, [posts, selectedPostId]);

  // Form State for Active Editing
  const [editTitle, setEditTitle] = useState(selectedPost.title);
  const [editPlatform, setEditPlatform] = useState<PlatformType>(selectedPost.platform);
  const [editRefEq, setEditRefEq] = useState(selectedPost.referenceEqInfo + ' (M6.1)');
  const [editEventDate, setEditEventDate] = useState(selectedPost.eventDate);
  const [editContent, setEditContent] = useState(selectedPost.content);
  const [editHashtags, setEditHashtags] = useState(selectedPost.hashtags);
  const [checklist, setChecklist] = useState(selectedPost.checklist);

  // Sync state when selectedPost changes
  React.useEffect(() => {
    if (selectedPost) {
      setEditTitle(selectedPost.title);
      setEditPlatform(selectedPost.platform);
      setEditRefEq(selectedPost.referenceEqInfo.includes('(') ? selectedPost.referenceEqInfo : `${selectedPost.referenceEqInfo} (M6.1)`);
      setEditEventDate(selectedPost.eventDate);
      setEditContent(selectedPost.content);
      setEditHashtags(selectedPost.hashtags);
      setChecklist(selectedPost.checklist);
    }
  }, [selectedPost]);

  // Toast Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (refEqFilter !== 'All EQInfo' && !p.referenceEqInfo.includes(refEqFilter)) return false;
      if (platformFilter !== 'All Platforms' && p.platform !== platformFilter) return false;
      if (postStatusFilter !== 'All Statuses' && p.status !== postStatusFilter) return false;
      if (analystFilter !== 'All Analysts' && p.createdBy !== analystFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.id.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.createdBy.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [posts, refEqFilter, platformFilter, postStatusFilter, analystFilter, searchQuery]);

  // Handle Clear Filters
  const handleClear = () => {
    setRefEqFilter('All EQInfo');
    setDateRange('2025-04-01 — 2025-04-30');
    setPlatformFilter('All Platforms');
    setPostStatusFilter('All Statuses');
    setAnalystFilter('All Analysts');
    setSearchQuery('');
    showToast('Filters cleared.');
  };

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Toggle checklist item
  const toggleCheck = (key: keyof typeof checklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    setPosts((prev) =>
      prev.map((p) => (p.id === selectedPostId ? { ...p, checklist: updated } : p))
    );
  };

  // Save changes to current post
  const handleSaveDraft = () => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPostId
          ? {
              ...p,
              title: editTitle,
              platform: editPlatform,
              content: editContent,
              hashtags: editHashtags,
              eventDate: editEventDate,
              checklist,
            }
          : p
      )
    );
    showToast('Post draft updated successfully.');
  };

  // Actions
  const handleCreatePost = () => {
    const newId = `SM-2025-0423-${String(posts.length + 1).padStart(3, '0')}`;
    const newPost: SocialMediaPost = {
      id: newId,
      referenceEqInfo: '2025-04-23 08:15',
      eventDate: 'Apr 23, 2025',
      contentType: 'Intensity Update',
      platform: 'Facebook',
      createdBy: 'PHIVOLCS',
      scheduledTime: '—',
      status: 'Draft',
      title: 'New Earthquake Intensity Update',
      content: `PHIVOLCS Earthquake Intensity Report\n\nPreliminary earthquake intensity observations gathered across affected provinces. Please stay tuned for instrumental validation.`,
      hashtags: '#PHIVOLCS #EarthquakePH',
      hasInfographic: true,
      checklist: {
        reportValidated: false,
        duplicateChecked: true,
        eqInfoConfirmed: true,
        intensityVerified: false,
        imageAttached: false,
        approvalCompleted: false,
      },
    };
    setPosts([newPost, ...posts]);
    setSelectedPostId(newId);
    showToast(`New draft post ${newId} created.`);
  };

  const handleGenerateFromEQP = () => {
    const generatedContent = `PHIVOLCS Earthquake Intensity Report\n\nIntensity V in Lebak, Sultan Kudarat; IV in Kalamansig; III in Surallah; II in General Santos City; and I in Koronadal based on instrumental and reported intensities.\n\nStay informed and be prepared.`;
    setEditTitle('PHIVOLCS Earthquake Intensity Report');
    setEditContent(generatedContent);
    setEditHashtags('#PHIVOLCS #EarthquakePH #EarthquakeIntensity');
    setPosts((prev) =>
      prev.map((p) =>
        p.id === selectedPostId
          ? {
              ...p,
              title: 'PHIVOLCS Earthquake Intensity Report',
              content: generatedContent,
              hashtags: '#PHIVOLCS #EarthquakePH #EarthquakeIntensity',
              checklist: { ...p.checklist, reportValidated: true, intensityVerified: true },
            }
          : p
      )
    );
    showToast('Synthesized official content from latest EQP Intensity Report.');
  };

  const handleSubmitApproval = () => {
    setPosts((prev) =>
      prev.map((p) => (p.id === selectedPostId ? { ...p, status: 'Pending Approval' } : p))
    );
    showToast(`Post ${selectedPostId} submitted for supervisor approval.`);
  };

  const handleSchedule = () => {
    const time = 'Apr 23, 2025 03:00 PM';
    setPosts((prev) =>
      prev.map((p) => (p.id === selectedPostId ? { ...p, status: 'Scheduled', scheduledTime: time } : p))
    );
    showToast(`Post ${selectedPostId} scheduled for publication at ${time}.`);
  };

  const handlePublishNow = () => {
    setPosts((prev) =>
      prev.map((p) => (p.id === selectedPostId ? { ...p, status: 'Published' } : p))
    );
    showToast(`Post ${selectedPostId} published to ${editPlatform}!`);
  };

  const handleArchive = () => {
    setPosts((prev) =>
      prev.map((p) => (p.id === selectedPostId ? { ...p, status: 'Rejected' } : p))
    );
    showToast(`Post ${selectedPostId} archived.`);
  };

  const handleDeletePost = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete post ${id}?`)) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (selectedPostId === id && posts.length > 1) {
        setSelectedPostId(posts.find((p) => p.id !== id)?.id || '');
      }
      showToast(`Post ${id} removed.`);
    }
  };

  const handleExportLog = () => {
    const headers = ['Post ID', 'Reference EQInfo', 'Event Date', 'Content Type', 'Platform', 'Created By', 'Scheduled Time', 'Status', 'Title'];
    const rows = filteredPosts.map((p) => [
      `"${p.id}"`,
      `"${p.referenceEqInfo}"`,
      `"${p.eventDate}"`,
      `"${p.contentType}"`,
      `"${p.platform}"`,
      `"${p.createdBy}"`,
      `"${p.scheduledTime}"`,
      `"${p.status}"`,
      `"${p.title}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `Social_Media_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Social media log exported to CSV.');
  };

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

      {/* Top Tab Bar: Field Reports vs Consolidator vs Social Media */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-2">
          {onNavigateToFieldReports && (
            <button
              type="button"
              onClick={onNavigateToFieldReports}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-blue-50/60 text-slate-600 hover:text-blue-600 border border-slate-200 flex items-center gap-2 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Field Intensity Reports</span>
            </button>
          )}
          {onNavigateToConsolidator && (
            <button
              type="button"
              onClick={onNavigateToConsolidator}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-blue-50/60 text-slate-600 hover:text-blue-600 border border-slate-200 flex items-center gap-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Intensity Consolidator</span>
            </button>
          )}
          <button
            type="button"
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-xs flex items-center gap-2"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Media Updates</span>
          </button>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline-block">
          Official PHIVOLCS Social-Media Communication Channel
        </span>
      </div>

      {/* Row 1: KPI Summary Cards (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Draft Posts */}
        <button
          type="button"
          onClick={() => setPostStatusFilter('Draft')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-blue-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 fill-blue-600 text-white" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-blue-700">Draft Posts</span>
            <span className="text-3xl font-bold text-blue-600 mt-0.5 block leading-tight">3</span>
            <span className="text-[11px] text-slate-500 font-normal">For review and editing</span>
          </div>
        </button>

        {/* Card 2: Pending Approval */}
        <button
          type="button"
          onClick={() => setPostStatusFilter('Pending Approval')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-amber-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-amber-700">Pending Approval</span>
            <span className="text-3xl font-bold text-amber-600 mt-0.5 block leading-tight">2</span>
            <span className="text-[11px] text-slate-500 font-normal">Awaiting supervisor approval</span>
          </div>
        </button>

        {/* Card 3: Scheduled Posts */}
        <button
          type="button"
          onClick={() => setPostStatusFilter('Scheduled')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-indigo-600 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-indigo-700">Scheduled Posts</span>
            <span className="text-3xl font-bold text-indigo-600 mt-0.5 block leading-tight">4</span>
            <span className="text-[11px] text-slate-500 font-normal">Planned for publication</span>
          </div>
        </button>

        {/* Card 4: Published This Month */}
        <button
          type="button"
          onClick={() => setPostStatusFilter('Published')}
          className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-3.5 text-left hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-emerald-700">Published This Month</span>
            <span className="text-3xl font-bold text-emerald-600 mt-0.5 block leading-tight">18</span>
            <span className="text-[11px] text-slate-500 font-normal">Across all platforms</span>
          </div>
        </button>
      </div>

      {/* Row 2: Search & Multi-Facet Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Reference EQInfo */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Reference EQInfo
            </label>
            <select
              value={refEqFilter}
              onChange={(e) => setRefEqFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All EQInfo</option>
              <option>2025-04-23 08:15</option>
              <option>2025-04-22 14:30</option>
              <option>2025-04-21 11:10</option>
            </select>
          </div>

          {/* Event Date */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Event Date</label>
            <div className="relative">
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              <Calendar className="w-3.5 h-3.5 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Platform */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Platform</label>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Platforms</option>
              <option>Facebook</option>
              <option>X / Twitter</option>
              <option>Website</option>
            </select>
          </div>

          {/* Post Status */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Post Status</label>
            <select
              value={postStatusFilter}
              onChange={(e) => setPostStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Statuses</option>
              <option>Draft</option>
              <option>Pending Approval</option>
              <option>Scheduled</option>
              <option>Published</option>
              <option>Rejected</option>
            </select>
          </div>

          {/* Analyst / Author */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Analyst / Author
            </label>
            <select
              value={analystFilter}
              onChange={(e) => setAnalystFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            >
              <option>All Analysts</option>
              <option>MDRRMO</option>
              <option>Kalamansig</option>
              <option>GSC DRRMO</option>
              <option>PHIVOLCS</option>
              <option>Surallah</option>
              <option>Koronadal</option>
            </select>
          </div>

          {/* Search Posts & Buttons */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search post ID, content..."
                className="w-full pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={() => showToast('Filters applied.')}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-8 px-2.5 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: 3-Panel Main Layout (Queue Left + Editor Center + Checklist Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Panel 1: Social Media Post Queue (Cols 5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold text-blue-600">Social Media Post Queue</h2>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Showing 1–{filteredPosts.length} of {posts.length} posts
            </span>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-50/50 border-b border-slate-200 text-slate-700 font-semibold select-none">
                  <th className="py-2 px-2 text-center whitespace-nowrap">#</th>
                  <th className="py-2 px-2 whitespace-nowrap">Post ID</th>
                  <th className="py-2 px-2 whitespace-nowrap">Reference EQInfo</th>
                  <th className="py-2 px-2 whitespace-nowrap">Event Date</th>
                  <th className="py-2 px-2 whitespace-nowrap">Content Type</th>
                  <th className="py-2 px-2 whitespace-nowrap">Platform</th>
                  <th className="py-2 px-2 whitespace-nowrap">Created By</th>
                  <th className="py-2 px-2 whitespace-nowrap">Scheduled Time</th>
                  <th className="py-2 px-2 whitespace-nowrap">Status</th>
                  <th className="py-2 px-2 whitespace-nowrap text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post, index) => {
                  const isSelected = post.id === selectedPostId;
                  return (
                    <tr
                      key={post.id}
                      onClick={() => setSelectedPostId(post.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-100/70 border-l-4 border-l-blue-600 font-medium'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      {/* # */}
                      <td className="py-2.5 px-2 text-center text-slate-600 font-semibold">
                        {index + 1}
                      </td>

                      {/* Post ID */}
                      <td className="py-2.5 px-2 font-medium text-blue-600 whitespace-nowrap">
                        {post.id}
                      </td>

                      {/* Reference EQInfo */}
                      <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                        {post.referenceEqInfo}
                      </td>

                      {/* Event Date */}
                      <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                        {post.eventDate}
                      </td>

                      {/* Content Type */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className="text-blue-600 font-medium">{post.contentType}</span>
                      </td>

                      {/* Platform */}
                      <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                        {post.platform}
                      </td>

                      {/* Created By */}
                      <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                        {post.createdBy}
                      </td>

                      {/* Scheduled Time */}
                      <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">
                        {post.scheduledTime}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {post.status === 'Draft' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800">
                            Draft
                          </span>
                        )}
                        {post.status === 'Pending Approval' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                            Pending Approval
                          </span>
                        )}
                        {post.status === 'Scheduled' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                            Scheduled
                          </span>
                        )}
                        {post.status === 'Published' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            Published
                          </span>
                        )}
                        {post.status === 'Rejected' && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPostId(post.id);
                            }}
                            className="w-6 h-6 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                            title="Edit post"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeletePost(post.id, e)}
                            className="w-6 h-6 rounded border border-rose-300 text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                            title="Delete post"
                          >
                            <Trash2 className="w-3 h-3" />
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

        {/* Panel 2: Post Editor / Preview (Cols 4) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col h-full space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
            <Edit className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Post Editor / Preview</h2>
          </div>

          {/* Platform Radios */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
            <span className="text-slate-600">Platform</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="platform"
                checked={editPlatform === 'Facebook'}
                onChange={() => setEditPlatform('Facebook')}
                className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[10px] font-bold">
                f
              </span>
              <span>Facebook</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="platform"
                checked={editPlatform === 'X / Twitter'}
                onChange={() => setEditPlatform('X / Twitter')}
                className="text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="w-4 h-4 rounded bg-black text-white flex items-center justify-center text-[10px] font-bold">
                𝕏
              </span>
              <span>X / Twitter</span>
            </label>
          </div>

          {/* Post Title */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Post Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Reference EQInfo & Event Date */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Reference EQInfo
              </label>
              <input
                type="text"
                value={editRefEq}
                onChange={(e) => setEditRefEq(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Event Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className="w-full pl-3 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                />
                <Calendar className="w-3.5 h-3.5 text-blue-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-700">Post Content</label>
              <span className="text-[10px] text-slate-400">
                {editContent.length} / {editPlatform === 'X / Twitter' ? 280 : 2000}
              </span>
            </div>
            <textarea
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white resize-none"
            />
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Hashtags</label>
            <input
              type="text"
              value={editHashtags}
              onChange={(e) => setEditHashtags(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Infographic Graphic Preview Banner */}
          <div className="rounded-xl border border-sky-200 overflow-hidden shadow-2xs relative bg-gradient-to-br from-sky-50 via-blue-50/80 to-slate-100 p-3 select-none">
            {/* Top brand */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-black tracking-tighter">
                  PH
                </div>
                <span className="text-[10px] font-bold text-blue-900 tracking-wider">PHIVOLCS</span>
              </div>
              <span className="text-[9px] font-medium text-slate-500 uppercase tracking-widest">
                Official Report
              </span>
            </div>

            {/* Infographic Main Content */}
            <div className="flex items-center justify-between gap-2">
              {/* Left Details */}
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  Earthquake Intensity Report
                </h3>
                <p className="text-[10px] font-semibold text-blue-700">
                  April 23, 2025 | 08:15 AM (M6.1)
                </p>

                {/* Intensity levels list */}
                <div className="space-y-1 pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-red-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      V
                    </span>
                    <span className="text-[10px] font-medium text-slate-800">
                      Lebak, Sultan Kudarat
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      IV
                    </span>
                    <span className="text-[10px] font-medium text-slate-800">
                      Kalamansig, Sultan Kudarat
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-lime-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      III
                    </span>
                    <span className="text-[10px] font-medium text-slate-800">
                      Surallah, South Cotabato
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      II
                    </span>
                    <span className="text-[10px] font-medium text-slate-800">
                      General Santos City, South Cotabato
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      I
                    </span>
                    <span className="text-[10px] font-medium text-slate-800">
                      Koronadal, South Cotabato
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Seismic Epicenter Waves Graphic */}
              <div className="w-32 h-28 relative flex flex-col items-center justify-center shrink-0">
                {/* Concentric rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                  <div className="w-20 h-20 rounded-full border border-red-300 animate-ping duration-1000" />
                  <div className="absolute w-14 h-14 rounded-full border-2 border-red-400" />
                  <div className="absolute w-8 h-8 rounded-full border-2 border-red-500" />
                  <div className="absolute w-2.5 h-2.5 rounded-full bg-red-600" />
                </div>

                {/* Waveform graphic */}
                <svg
                  className="w-full h-8 text-blue-600 relative z-10 opacity-75"
                  viewBox="0 0 120 30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M0,15 L20,15 L30,5 L40,25 L50,10 L60,20 L70,8 L80,22 L90,15 L120,15" />
                </svg>

                <span className="text-[8px] font-black text-slate-800 tracking-wider text-center mt-2 relative z-10 leading-tight">
                  STAY INFORMED.
                  <br />
                  BE PREPARED.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Publication Checklist (Cols 3) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-blue-600">Publication Checklist</h2>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3.5 flex-1">
            {/* 1. Report Validated */}
            <button
              type="button"
              onClick={() => toggleCheck('reportValidated')}
              className="w-full flex items-start gap-2.5 text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  checklist.reportValidated ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Report Validated</span>
                <span className="block text-[11px] text-slate-500">EQP report reviewed and confirmed</span>
              </div>
            </button>

            {/* 2. Duplicate Checked */}
            <button
              type="button"
              onClick={() => toggleCheck('duplicateChecked')}
              className="w-full flex items-start gap-2.5 text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  checklist.duplicateChecked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Duplicate Checked</span>
                <span className="block text-[11px] text-slate-500">No similar post exists</span>
              </div>
            </button>

            {/* 3. EQInfo Reference Confirmed */}
            <button
              type="button"
              onClick={() => toggleCheck('eqInfoConfirmed')}
              className="w-full flex items-start gap-2.5 text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  checklist.eqInfoConfirmed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">EQInfo Reference Confirmed</span>
                <span className="block text-[11px] text-slate-500">Correct EQInfo and event details</span>
              </div>
            </button>

            {/* 4. Intensity Values Verified */}
            <button
              type="button"
              onClick={() => toggleCheck('intensityVerified')}
              className="w-full flex items-start gap-2.5 text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  checklist.intensityVerified ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Intensity Values Verified</span>
                <span className="block text-[11px] text-slate-500">Intensities match approved report</span>
              </div>
            </button>

            {/* 5. Image Attached */}
            <button
              type="button"
              onClick={() => toggleCheck('imageAttached')}
              className="w-full flex items-start gap-2.5 text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  checklist.imageAttached ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Image Attached</span>
                <span className="block text-[11px] text-slate-500">Graphic or map included</span>
              </div>
            </button>

            {/* 6. Approval Completed */}
            <button
              type="button"
              onClick={() => toggleCheck('approvalCompleted')}
              className="w-full flex items-start gap-2.5 text-left p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  checklist.approvalCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-900">Approval Completed</span>
                <span className="block text-[11px] text-slate-500">Approved by authorized personnel</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Bottom Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Side Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Create Post */}
          <button
            type="button"
            onClick={handleCreatePost}
            className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Post</span>
          </button>

          {/* Edit Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Draft</span>
          </button>

          {/* Generate from EQP Report */}
          <button
            type="button"
            onClick={handleGenerateFromEQP}
            className="h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate from EQP Report</span>
          </button>

          {/* Preview */}
          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <span className="h-5 w-[1px] bg-slate-300 mx-1 hidden sm:inline-block" />

          {/* Submit for Approval */}
          <button
            type="button"
            onClick={handleSubmitApproval}
            className="h-8 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit for Approval</span>
          </button>

          {/* Schedule Post */}
          <button
            type="button"
            onClick={handleSchedule}
            className="h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Post</span>
          </button>

          {/* Publish Now */}
          <button
            type="button"
            onClick={handlePublishNow}
            className="h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Publish Now</span>
          </button>

          {/* Archive Post */}
          <button
            type="button"
            onClick={handleArchive}
            className="h-8 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Post</span>
          </button>
        </div>

        {/* Right Side Button */}
        <div>
          <button
            type="button"
            onClick={handleExportLog}
            className="h-8 px-3.5 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Social Media Log</span>
          </button>
        </div>
      </div>

      {/* Row 5: Guidance Banner */}
      {bannerVisible && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <span className="font-normal text-blue-900">
              All social-media posts must be validated and approved before publication. Ensure that information is accurate, consistent with the approved intensity report, and follows PHIVOLCS communication guidelines.
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

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {editPlatform === 'Facebook' ? 'f' : '𝕏'}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editPlatform} Post Live Preview
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {/* Account simulation header */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  PH
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">PHIVOLCS-DOST</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px]">
                      ✓
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">Just now • 🌐 Public</span>
                </div>
              </div>

              {/* Text content */}
              <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                {editContent}
              </div>

              {/* Hashtags */}
              <div className="text-xs text-blue-600 font-medium">
                {editHashtags}
              </div>

              {/* Attached graphic card preview */}
              <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-3">
                <div className="text-[11px] font-bold text-slate-900 uppercase">
                  Earthquake Intensity Report
                </div>
                <div className="text-[10px] text-blue-700 font-semibold mb-2">
                  {editEventDate} | M6.1 Sultan Kudarat
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                      V
                    </span>
                    <span>Lebak, Sultan Kudarat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                      IV
                    </span>
                    <span>Kalamansig, Sultan Kudarat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-lime-500 text-white text-[9px] font-bold flex items-center justify-center">
                      III
                    </span>
                    <span>Surallah, South Cotabato</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  handlePublishNow();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Publish Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
