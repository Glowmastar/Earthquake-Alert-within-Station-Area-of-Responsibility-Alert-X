import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  Calendar,
  Search,
  Filter,
  RotateCcw,
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
  MessageSquare,
  MessageCircle,
  ThumbsUp,
  MapPin,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  CheckSquare,
  Square,
  Building2,
  CornerDownRight,
  Radio,
  Layers,
  ArrowUpRight,
  Activity,
  Heart,
  Repeat2,
  Globe,
  Cpu,
  Server,
} from 'lucide-react';
import { UserProfile, EarthquakeRecord } from '../types';

export type PlatformSource = 'Facebook' | 'X / Twitter';
export type SocialReportStatus = 'Verified' | 'Pending Review' | 'Promoted' | 'Excluded';
export type PEISLevel = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII';

export interface PhivolcsSocialPost {
  id: string;
  title: string;
  eqInfoReference: string;
  postDate: string;
  postIsoTime: string;
  magnitude: number;
  epicenter: string;
  latitude: number;
  longitude: number;
  depthKm: number;
  origin: string;
  stationAor: 'CGP' | 'PCP' | 'BIP' | 'National';
  facebookPostUrl: string;
  twitterPostUrl: string;
  totalComments: number;
  reactionsCount: number;
  sharesCount: number;
  extractedReportsCount: number;
  promotedCount: number;
  highestIntensity: string;
  captionText: string;
}

export interface SocialCommentReport {
  id: string;
  postId: string;
  platform: PlatformSource;
  authorName: string;
  authorHandle: string;
  authorAvatarBg: string;
  commentTime: string;
  commentDate: string;
  minutesPostEvent: number;
  rawCommentText: string;
  extractedTown: string;
  extractedProvince: string;
  extractedRegion: string;
  aor: 'CGP' | 'PCP' | 'BIP' | 'Outside AOR';
  extractedIntensity: PEISLevel;
  intensityNum: number;
  confidenceScore: number; // percentage 0 - 100
  extractedKeywords: string[];
  status: SocialReportStatus;
  isNoiseOrSpam: boolean;
  psgcMatched: boolean;
  feltEffectsDesc: string;
  verifiedBy?: string;
  promotedToConsolidator: boolean;
}

// Official PHIVOLCS Social Media Posts monitored for Citizen Intensity Comments
const PHIVOLCS_SOCIAL_POSTS: PhivolcsSocialPost[] = [
  {
    id: 'POST-2025-0423-01',
    title: 'Earthquake Information No. 1 - M6.1 Offshore Sultan Kudarat',
    eqInfoReference: '2025-04-23 08:15',
    postDate: 'Apr 23, 2025 08:20 AM',
    postIsoTime: '2025-04-23T08:20:00+08:00',
    magnitude: 6.1,
    epicenter: '06.51°N, 123.85°E - 045 km S 75° W of Lebak (Sultan Kudarat)',
    latitude: 6.51,
    longitude: 123.85,
    depthKm: 28,
    origin: 'Tectonic',
    stationAor: 'National',
    facebookPostUrl: 'https://facebook.com/PHIVOLCS-DOST/posts/1029481729482',
    twitterPostUrl: 'https://x.com/phivolcs_dost/status/178239019283401',
    totalComments: 864,
    reactionsCount: 3840,
    sharesCount: 1420,
    extractedReportsCount: 142,
    promotedCount: 28,
    highestIntensity: 'PEIS V',
    captionText:
      '#EarthquakePH #EarthquakeSultanKudarat\nEarthquake Information No. 1\nDate and Time: 23 April 2025 - 08:15 AM\nMagnitude = 6.1\nDepth = 028 km\nLocation = 06.51°N, 123.85°E - 045 km S 75° W of Lebak (Sultan Kudarat)\nOrigin = Tectonic\n\n📢 PUBLIC NOTICE: Netizens who felt this event are requested to report felt shaking intensity, exact municipality/city, and province in the comments below for official DOST-PHIVOLCS intensity mapping.',
  },
  {
    id: 'POST-2025-0421-03',
    title: 'Earthquake Information No. 1 - M4.2 Tagoloan, Misamis Oriental (CGP Station AOR)',
    eqInfoReference: '2025-04-21 09:45',
    postDate: 'Apr 21, 2025 09:50 AM',
    postIsoTime: '2025-04-21T09:50:00+08:00',
    magnitude: 4.2,
    epicenter: '08.54°N, 124.75°E - 005 km N 12° E of Tagoloan (Misamis Oriental)',
    latitude: 8.54,
    longitude: 124.75,
    depthKm: 12,
    origin: 'Tectonic',
    stationAor: 'CGP',
    facebookPostUrl: 'https://facebook.com/PHIVOLCS-DOST/posts/1029461928472',
    twitterPostUrl: 'https://x.com/phivolcs_dost/status/178229819284912',
    totalComments: 412,
    reactionsCount: 1890,
    sharesCount: 680,
    extractedReportsCount: 88,
    promotedCount: 22,
    highestIntensity: 'PEIS IV',
    captionText:
      '#EarthquakePH #EarthquakeMisamisOriental\nEarthquake Information No. 1\nDate and Time: 21 April 2025 - 09:45 AM\nMagnitude = 4.2\nDepth = 012 km\nLocation = 08.54°N, 124.75°E - 005 km N 12° E of Tagoloan (Misamis Oriental)\nOrigin = Tectonic\n\n📢 CGP STATION NOTICE: CAGAYAN DE ORO SEISMIC STATION (CGP) is actively consolidating citizen intensity reports for Misamis Oriental, Bukidnon, and neighboring LGUs. Please comment your location and felt intensity.',
  },
  {
    id: 'POST-2025-0422-02',
    title: 'Earthquake Information No. 2 - M4.8 Calayan, Cagayan (PCP Station AOR)',
    eqInfoReference: '2025-04-22 14:30',
    postDate: 'Apr 22, 2025 02:35 PM',
    postIsoTime: '2025-04-22T14:35:00+08:00',
    magnitude: 4.8,
    epicenter: '19.24°N, 121.42°E - 018 km N 45° E of Dalupiri Island, Calayan (Cagayan)',
    latitude: 19.24,
    longitude: 121.42,
    depthKm: 15,
    origin: 'Tectonic',
    stationAor: 'PCP',
    facebookPostUrl: 'https://facebook.com/PHIVOLCS-DOST/posts/1029471928371',
    twitterPostUrl: 'https://x.com/phivolcs_dost/status/178234819283921',
    totalComments: 340,
    reactionsCount: 1250,
    sharesCount: 430,
    extractedReportsCount: 52,
    promotedCount: 16,
    highestIntensity: 'PEIS IV',
    captionText:
      '#EarthquakePH #EarthquakeCagayan\nEarthquake Information No. 2\nDate and Time: 22 April 2025 - 02:30 PM\nMagnitude = 4.8\nDepth = 015 km\nLocation = 19.24°N, 121.42°E - 018 km N 45° E of Dalupiri Island, Calayan (Cagayan)\nOrigin = Tectonic\n\n📢 Please report felt intensity in Northern and Central Luzon in the comments below.',
  },
  {
    id: 'POST-2025-0420-04',
    title: 'Earthquake Information No. 1 - M5.4 Davao Oriental',
    eqInfoReference: '2025-04-20 16:15',
    postDate: 'Apr 20, 2025 04:22 PM',
    postIsoTime: '2025-04-20T16:22:00+08:00',
    magnitude: 5.4,
    epicenter: '06.42°N, 126.35°E - 035 km SE of Governor Generoso (Davao Oriental)',
    latitude: 6.42,
    longitude: 126.35,
    depthKm: 35,
    origin: 'Tectonic',
    stationAor: 'BIP',
    facebookPostUrl: 'https://facebook.com/PHIVOLCS-DOST/posts/1029451829381',
    twitterPostUrl: 'https://x.com/phivolcs_dost/status/178224192847192',
    totalComments: 518,
    reactionsCount: 2410,
    sharesCount: 890,
    extractedReportsCount: 96,
    promotedCount: 19,
    highestIntensity: 'PEIS IV',
    captionText:
      '#EarthquakePH #EarthquakeDavaoOriental\nEarthquake Information No. 1\nDate and Time: 20 April 2025 - 04:15 PM\nMagnitude = 5.4\nDepth = 035 km\nLocation = 06.42°N, 126.35°E - 035 km SE of Governor Generoso (Davao Oriental)\nOrigin = Tectonic\n\n📢 Netizens in Davao Region and Caraga, please share your observed intensity and location.',
  },
];

// Citizen comments harvested from PHIVOLCS Facebook & Twitter posts
const INITIAL_COMMENTS: SocialCommentReport[] = [
  // --- Comments under M6.1 Sultan Kudarat Post ---
  {
    id: 'SMR-001',
    postId: 'POST-2025-0423-01',
    platform: 'Facebook',
    authorName: 'Maria Elena Santos',
    authorHandle: '@elena_santos_cdo',
    authorAvatarBg: 'bg-emerald-600',
    commentTime: '08:19 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 4,
    rawCommentText:
      'Naramdaman dito sa Cagayan de Oro City! Lumindol habang nagka-kape kami, umugong yung bintana at nag-sway ang ceiling fan. Intensity IV siguro to dito sa Carmen.',
    extractedTown: 'Cagayan de Oro City',
    extractedProvince: 'Misamis Oriental',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 96,
    extractedKeywords: ['Cagayan de Oro City', 'Carmen', 'umugong yung bintana', 'sway ceiling fan', 'Intensity IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong shaking felt by people indoors. Hanging objects swung moderately. Windows rattled.',
    verifiedBy: 'Engr. J. Dela Cruz',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-002',
    postId: 'POST-2025-0423-01',
    platform: 'Facebook',
    authorName: 'Datu Ibrahim Guiamalon',
    authorHandle: '@ibrahim_lebak',
    authorAvatarBg: 'bg-rose-600',
    commentTime: '08:21 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 6,
    rawCommentText:
      'Napakalakas dito sa Lebak Sultan Kudarat! Tumakbo kaming lahat palabas ng bahay, natumba ang baso sa mesa at nabitak ang pader ng garahe. Parang Intensity V to VI!',
    extractedTown: 'Lebak',
    extractedProvince: 'Sultan Kudarat',
    extractedRegion: 'Region XII (SOCCSKSARGEN)',
    aor: 'Outside AOR',
    extractedIntensity: 'V',
    intensityNum: 5,
    confidenceScore: 98,
    extractedKeywords: ['Lebak', 'Sultan Kudarat', 'tumakbo palabas', 'natumba ang baso', 'Intensity V'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Strong shaking. People hurried outdoors in alarm. Small unstable objects overturned. Minor wall cracks.',
    verifiedBy: 'Engr. J. Dela Cruz',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-003',
    postId: 'POST-2025-0423-01',
    platform: 'X / Twitter',
    authorName: 'Kenji Morales',
    authorHandle: '@kenji_iligan',
    authorAvatarBg: 'bg-blue-600',
    commentTime: '08:22 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 7,
    rawCommentText:
      'Felt strongly in Iligan City (Palao area)! Shaking lasted around 8 to 10 seconds. Chandeliers swinging violently. PEIS IV felt here.',
    extractedTown: 'Iligan City',
    extractedProvince: 'Lanao del Norte',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 94,
    extractedKeywords: ['Iligan City', 'Palao', 'lasted 8-10s', 'Chandeliers swinging', 'PEIS IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Felt like a heavy truck passing by. Hanging objects swung notably. Disquiet among people indoors.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-004',
    postId: 'POST-2025-0423-01',
    platform: 'Facebook',
    authorName: 'Arlene Macarambon',
    authorHandle: '@arlene_malaybalay',
    authorAvatarBg: 'bg-amber-600',
    commentTime: '08:24 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 9,
    rawCommentText:
      'Kusog diri sa Malaybalay Bukidnon, nauyog among cabinet ug nilinog jud! Murag Intensity III to IV. Ambot kung naa pay aftershock.',
    extractedTown: 'Malaybalay City',
    extractedProvince: 'Bukidnon',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'III',
    intensityNum: 3,
    confidenceScore: 92,
    extractedKeywords: ['Malaybalay', 'Bukidnon', 'nauyog among cabinet', 'Intensity III'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Weak to moderate shaking. Felt indoors especially on upper floors. Dizziness experienced by some.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-005',
    postId: 'POST-2025-0423-01',
    platform: 'X / Twitter',
    authorName: 'Reynaldo P. Tan',
    authorHandle: '@rey_kalamansig',
    authorAvatarBg: 'bg-purple-600',
    commentTime: '08:25 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 10,
    rawCommentText:
      'Very strong ground motion in Kalamansig town proper! Aquarium water splashing out onto the floor, dogs barking, people running to the street. Intensity IV-V.',
    extractedTown: 'Kalamansig',
    extractedProvince: 'Sultan Kudarat',
    extractedRegion: 'Region XII (SOCCSKSARGEN)',
    aor: 'Outside AOR',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 95,
    extractedKeywords: ['Kalamansig', 'Aquarium water splashing', 'running to street', 'Intensity IV-V'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong to strong shaking. Liquids disturbed. People alarmed.',
    verifiedBy: 'Engr. J. Dela Cruz',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-006',
    postId: 'POST-2025-0423-01',
    platform: 'Facebook',
    authorName: 'Grace Villanueva',
    authorHandle: '@grace_gensan',
    authorAvatarBg: 'bg-sky-600',
    commentTime: '08:27 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 12,
    rawCommentText:
      'Felt in General Santos City (Lagao)! Mahina lang pero nahilo kami sandali habang nakaupo sa office. Intensity II to III.',
    extractedTown: 'General Santos City',
    extractedProvince: 'South Cotabato',
    extractedRegion: 'Region XII (SOCCSKSARGEN)',
    aor: 'Outside AOR',
    extractedIntensity: 'II',
    intensityNum: 2,
    confidenceScore: 89,
    extractedKeywords: ['General Santos City', 'Lagao', 'nahilo kami', 'Intensity II'],
    status: 'Pending Review',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Slightly felt by individuals at rest indoors. Hanging lights showed slight movement.',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-007',
    postId: 'POST-2025-0423-01',
    platform: 'X / Twitter',
    authorName: 'Pastor Joel Bautista',
    authorHandle: '@joelbautista_ph',
    authorAvatarBg: 'bg-slate-600',
    commentTime: '08:28 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 13,
    rawCommentText:
      'Lord cover our families with Your protection! Praying for the safety of everyone in Mindanao after that earthquake. Keep safe all! 🙏🙏🙏',
    extractedTown: 'Unspecified',
    extractedProvince: 'Mindanao (General)',
    extractedRegion: 'Unspecified',
    aor: 'Outside AOR',
    extractedIntensity: 'I',
    intensityNum: 1,
    confidenceScore: 22,
    extractedKeywords: ['Lord cover our families', 'protection', 'praying', 'keep safe'],
    status: 'Excluded',
    isNoiseOrSpam: true,
    psgcMatched: false,
    feltEffectsDesc: 'Non-report: General well-wishing / prayer comment with no specific locality or shaking effects.',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-008',
    postId: 'POST-2025-0423-01',
    platform: 'Facebook',
    authorName: 'Engr. Crispin Ocampo',
    authorHandle: '@cris_tagoloan',
    authorAvatarBg: 'bg-teal-600',
    commentTime: '08:31 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 16,
    rawCommentText:
      'Ramdam sa Tagoloan, Misamis Oriental! Lumindol bandang 8:16 AM. Naramdaman ng buong pamilya habang nag-aalmusal, mga Intensity III.',
    extractedTown: 'Tagoloan',
    extractedProvince: 'Misamis Oriental',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'III',
    intensityNum: 3,
    confidenceScore: 93,
    extractedKeywords: ['Tagoloan', 'Misamis Oriental', '8:16 AM', 'buong pamilya', 'Intensity III'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Weak shaking felt indoors by several people. Duration estimated 5-7 seconds.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-009',
    postId: 'POST-2025-0423-01',
    platform: 'Facebook',
    authorName: 'Bernadette Alcantara',
    authorHandle: '@bernadette_valencia',
    authorAvatarBg: 'bg-indigo-600',
    commentTime: '08:33 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 18,
    rawCommentText:
      'Uyog kaayo diri sa Valencia City Bukidnon! Nilinog jud pag-ayo. Nabalaka mi basin naay tsunami alert pero layo man ang dagat. Intensity III to IV.',
    extractedTown: 'Valencia City',
    extractedProvince: 'Bukidnon',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'III',
    intensityNum: 3,
    confidenceScore: 91,
    extractedKeywords: ['Valencia City', 'Bukidnon', 'Nilinog jud', 'Intensity III to IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderate shaking felt by many indoors. Vibration of crockery, doors, windows.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-010',
    postId: 'POST-2025-0423-01',
    platform: 'X / Twitter',
    authorName: 'Romy C. Delos Santos',
    authorHandle: '@romydls_surallah',
    authorAvatarBg: 'bg-orange-600',
    commentTime: '08:35 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 20,
    rawCommentText:
      'Surallah South Cotabato: Umayog ang mga halaman sa bakuran at nagkalat ang gamit sa desk. Intensity IV felt here. Standby for advisories.',
    extractedTown: 'Surallah',
    extractedProvince: 'South Cotabato',
    extractedRegion: 'Region XII (SOCCSKSARGEN)',
    aor: 'Outside AOR',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 95,
    extractedKeywords: ['Surallah', 'South Cotabato', 'umayog ang halaman', 'Intensity IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong shaking indoors and outdoors. Light fixtures swung.',
    verifiedBy: 'Engr. J. Dela Cruz',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-011',
    postId: 'POST-2025-0423-01',
    platform: 'Facebook',
    authorName: 'Netizen User 4492',
    authorHandle: '@pinoy_memes_2025',
    authorAvatarBg: 'bg-zinc-600',
    commentTime: '08:38 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 23,
    rawCommentText:
      'Gising na gising ang diwa ko hahaha imbes na kape ang pampagising lindol pala 😂',
    extractedTown: 'Unspecified',
    extractedProvince: 'Unspecified',
    extractedRegion: 'Unspecified',
    aor: 'Outside AOR',
    extractedIntensity: 'I',
    intensityNum: 1,
    confidenceScore: 15,
    extractedKeywords: ['gising na gising', 'kape', 'lindol pala 😂'],
    status: 'Excluded',
    isNoiseOrSpam: true,
    psgcMatched: false,
    feltEffectsDesc: 'Non-report: Humorous social commentary without geographic or intensity data.',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-012',
    postId: 'POST-2025-0423-01',
    platform: 'X / Twitter',
    authorName: 'Fatima Hadji Ali',
    authorHandle: '@fatima_marawi',
    authorAvatarBg: 'bg-cyan-700',
    commentTime: '08:42 AM',
    commentDate: 'Apr 23, 2025',
    minutesPostEvent: 27,
    rawCommentText:
      'Marawi City, Lanao del Sur: felt slight ground oscillation. Very mild, chandeliers slowly oscillating. Around Intensity II.',
    extractedTown: 'Marawi City',
    extractedProvince: 'Lanao del Sur',
    extractedRegion: 'BARMM (CGP Operational Area)',
    aor: 'CGP',
    extractedIntensity: 'II',
    intensityNum: 2,
    confidenceScore: 90,
    extractedKeywords: ['Marawi City', 'Lanao del Sur', 'chandeliers oscillating', 'Intensity II'],
    status: 'Pending Review',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Slight shaking felt by persons at rest. Delicate items showed gentle oscillation.',
    promotedToConsolidator: false,
  },

  // --- Comments under M4.2 Tagoloan Misamis Oriental Post (CGP Station AOR Focused) ---
  {
    id: 'SMR-020',
    postId: 'POST-2025-0421-03',
    platform: 'Facebook',
    authorName: 'Engr. Crispin Ocampo',
    authorHandle: '@cris_tagoloan',
    authorAvatarBg: 'bg-teal-600',
    commentTime: '09:47 AM',
    commentDate: 'Apr 21, 2025',
    minutesPostEvent: 2,
    rawCommentText:
      'Ramdam na ramdam dito sa Tagoloan, Misamis Oriental! Lumindol bandang 9:45 AM habang nag-aalmusal kami, umalog ang mga tasa sa lamesa at may kalampag sa bubong. Intensity IV dito sa Poblacion.',
    extractedTown: 'Tagoloan',
    extractedProvince: 'Misamis Oriental',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 98,
    extractedKeywords: ['Tagoloan', 'Misamis Oriental', 'Poblacion', 'umalog ang tasa', 'Intensity IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong shaking felt indoors. Hanging objects swung notably. Disquieting vibration.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-021',
    postId: 'POST-2025-0421-03',
    platform: 'Facebook',
    authorName: 'Maria Elena Santos',
    authorHandle: '@elena_santos_cdo',
    authorAvatarBg: 'bg-emerald-600',
    commentTime: '09:48 AM',
    commentDate: 'Apr 21, 2025',
    minutesPostEvent: 3,
    rawCommentText:
      'Naramdaman dito sa Carmen at Macasandig, Cagayan de Oro City! Banayad na pag-ugoy mga 4-5 seconds, Intensity III to IV.',
    extractedTown: 'Cagayan de Oro City',
    extractedProvince: 'Misamis Oriental',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 95,
    extractedKeywords: ['Cagayan de Oro City', 'Carmen', 'Macasandig', 'pag-ugoy 4-5s', 'Intensity III to IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong shaking indoors. Vibration like heavy truck passing.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-022',
    postId: 'POST-2025-0421-03',
    platform: 'X / Twitter',
    authorName: 'Dra. Jessica Lee',
    authorHandle: '@jesslee_balingasag',
    authorAvatarBg: 'bg-pink-600',
    commentTime: '09:50 AM',
    commentDate: 'Apr 21, 2025',
    minutesPostEvent: 5,
    rawCommentText:
      'Felt here in Balingasag, Misamis Oriental! Clinic windows rattled briefly, lasting around 3 seconds. Intensity III.',
    extractedTown: 'Balingasag',
    extractedProvince: 'Misamis Oriental',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'III',
    intensityNum: 3,
    confidenceScore: 94,
    extractedKeywords: ['Balingasag', 'Misamis Oriental', 'windows rattled', 'Intensity III'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Weak shaking felt indoors by several people.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-023',
    postId: 'POST-2025-0421-03',
    platform: 'Facebook',
    authorName: 'Arlene Macarambon',
    authorHandle: '@arlene_malaybalay',
    authorAvatarBg: 'bg-amber-600',
    commentTime: '09:52 AM',
    commentDate: 'Apr 21, 2025',
    minutesPostEvent: 7,
    rawCommentText:
      'Diri sa Manolo Fortich Bukidnon, naramdaman namo ang gamay nga tay-og! Around Intensity II to III.',
    extractedTown: 'Manolo Fortich',
    extractedProvince: 'Bukidnon',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'II',
    intensityNum: 2,
    confidenceScore: 91,
    extractedKeywords: ['Manolo Fortich', 'Bukidnon', 'gamay nga tay-og', 'Intensity II'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Slightly felt by people at rest indoors.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-024',
    postId: 'POST-2025-0421-03',
    platform: 'X / Twitter',
    authorName: 'Kenji Morales',
    authorHandle: '@kenji_iligan',
    authorAvatarBg: 'bg-blue-600',
    commentTime: '09:55 AM',
    commentDate: 'Apr 21, 2025',
    minutesPostEvent: 10,
    rawCommentText:
      'Very slight tremor in Iligan City (Tibanga). Hanging lamp swayed barely noticeable. Intensity II.',
    extractedTown: 'Iligan City',
    extractedProvince: 'Lanao del Norte',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'II',
    intensityNum: 2,
    confidenceScore: 89,
    extractedKeywords: ['Iligan City', 'Tibanga', 'hanging lamp swayed', 'Intensity II'],
    status: 'Pending Review',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Scarcely perceptible shaking detected on upper building levels.',
    promotedToConsolidator: false,
  },
  {
    id: 'SMR-025',
    postId: 'POST-2025-0421-03',
    platform: 'Facebook',
    authorName: 'Christian Paul Gomez',
    authorHandle: '@cpgomez_villanueva',
    authorAvatarBg: 'bg-cyan-600',
    commentTime: '09:58 AM',
    commentDate: 'Apr 21, 2025',
    minutesPostEvent: 13,
    rawCommentText:
      'Villanueva Misamis Oriental: kusog ang uyog diri sa planta! Nauyog ang mga locker sa warehouse, mga Intensity IV.',
    extractedTown: 'Villanueva',
    extractedProvince: 'Misamis Oriental',
    extractedRegion: 'Region X (Northern Mindanao)',
    aor: 'CGP',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 97,
    extractedKeywords: ['Villanueva', 'Misamis Oriental', 'kusog ang uyog', 'nauyog ang locker', 'Intensity IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong shaking felt by workers indoors. Heavy furniture shifted.',
    verifiedBy: 'Dr. R. Reyes (CGP)',
    promotedToConsolidator: true,
  },

  // --- Comments under M4.8 Calayan Cagayan Post (PCP AOR Focused) ---
  {
    id: 'SMR-030',
    postId: 'POST-2025-0422-02',
    platform: 'Facebook',
    authorName: 'Kapitan Danilo Agbayani',
    authorHandle: '@danilo_calayan',
    authorAvatarBg: 'bg-blue-600',
    commentTime: '02:38 PM',
    commentDate: 'Apr 22, 2025',
    minutesPostEvent: 8,
    rawCommentText:
      'Malakas dito sa Calayan Island Cagayan! Lumindol habang nasa barangay hall kami, umuga ang mesa at naglaglagan ang mga papel. Intensity IV to V dito.',
    extractedTown: 'Calayan',
    extractedProvince: 'Cagayan',
    extractedRegion: 'Region II (Cagayan Valley)',
    aor: 'PCP',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 97,
    extractedKeywords: ['Calayan', 'Cagayan', 'umuga ang mesa', 'Intensity IV to V'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong to strong shaking felt across the island.',
    verifiedBy: 'Engr. M. Fernandez (PCP)',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-031',
    postId: 'POST-2025-0422-02',
    platform: 'X / Twitter',
    authorName: 'Teacher Joyce Cabalza',
    authorHandle: '@joyce_aparri',
    authorAvatarBg: 'bg-rose-600',
    commentTime: '02:41 PM',
    commentDate: 'Apr 22, 2025',
    minutesPostEvent: 11,
    rawCommentText:
      'Felt in Aparri Cagayan! School ceiling fan swayed for around 6 seconds. Intensity III.',
    extractedTown: 'Aparri',
    extractedProvince: 'Cagayan',
    extractedRegion: 'Region II (Cagayan Valley)',
    aor: 'PCP',
    extractedIntensity: 'III',
    intensityNum: 3,
    confidenceScore: 93,
    extractedKeywords: ['Aparri', 'Cagayan', 'ceiling fan swayed', 'Intensity III'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Weak shaking felt by students indoors.',
    verifiedBy: 'Engr. M. Fernandez (PCP)',
    promotedToConsolidator: false,
  },

  // --- Comments under M5.4 Davao Oriental Post ---
  {
    id: 'SMR-040',
    postId: 'POST-2025-0420-04',
    platform: 'Facebook',
    authorName: 'Vicente M. Alcantara',
    authorHandle: '@vicente_govgen',
    authorAvatarBg: 'bg-emerald-600',
    commentTime: '04:25 PM',
    commentDate: 'Apr 20, 2025',
    minutesPostEvent: 10,
    rawCommentText:
      'Governor Generoso, Davao Oriental: kusog kaayo ang linog! Nauyog ang among balay, nagduyan ang mga suga sa kisame. Intensity IV.',
    extractedTown: 'Governor Generoso',
    extractedProvince: 'Davao Oriental',
    extractedRegion: 'Region XI (Davao Region)',
    aor: 'BIP',
    extractedIntensity: 'IV',
    intensityNum: 4,
    confidenceScore: 96,
    extractedKeywords: ['Governor Generoso', 'Davao Oriental', 'nauyog balay', 'Intensity IV'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Moderately strong shaking felt by residents.',
    verifiedBy: 'Engr. T. Sison',
    promotedToConsolidator: true,
  },
  {
    id: 'SMR-041',
    postId: 'POST-2025-0420-04',
    platform: 'X / Twitter',
    authorName: 'Mati City Netizen',
    authorHandle: '@mati_alerts',
    authorAvatarBg: 'bg-blue-600',
    commentTime: '04:28 PM',
    commentDate: 'Apr 20, 2025',
    minutesPostEvent: 13,
    rawCommentText:
      'Mati City Davao Oriental felt earthquake. Shaking was moderate indoors, Intensity III to IV.',
    extractedTown: 'City of Mati',
    extractedProvince: 'Davao Oriental',
    extractedRegion: 'Region XI (Davao Region)',
    aor: 'BIP',
    extractedIntensity: 'III',
    intensityNum: 3,
    confidenceScore: 92,
    extractedKeywords: ['Mati City', 'Davao Oriental', 'moderate indoors', 'Intensity III'],
    status: 'Verified',
    isNoiseOrSpam: false,
    psgcMatched: true,
    feltEffectsDesc: 'Weak to moderate shaking.',
    verifiedBy: 'Engr. T. Sison',
    promotedToConsolidator: false,
  },
];

// Color mapping for PHIVOLCS PEIS Intensity Scale
const PEIS_COLORS: Record<PEISLevel, { bg: string; text: string; border: string; desc: string; ring: string }> = {
  I: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', desc: 'Scarcely Perceptible', ring: 'ring-slate-300' },
  II: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300', desc: 'Slightly Felt', ring: 'ring-sky-400' },
  III: { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300', desc: 'Weak', ring: 'ring-lime-400' },
  IV: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', desc: 'Moderately Strong', ring: 'ring-amber-400' },
  V: { bg: 'bg-orange-100', text: 'text-orange-900', border: 'border-orange-300', desc: 'Strong', ring: 'ring-orange-400' },
  VI: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300', desc: 'Very Strong', ring: 'ring-rose-400' },
  VII: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-400', desc: 'Destructive', ring: 'ring-red-400' },
  VIII: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-400', desc: 'Very Destructive', ring: 'ring-purple-400' },
};

export interface SocialMediaViewProps {
  onNavigateToFieldReports?: () => void;
  onNavigateToConsolidator?: () => void;
  currentUser?: UserProfile;
  earthquakes?: EarthquakeRecord[];
}

export const SocialMediaView: React.FC<SocialMediaViewProps> = ({
  onNavigateToFieldReports,
  onNavigateToConsolidator,
  currentUser,
  earthquakes = [],
}) => {
  // Dynamically transform real system earthquakes into official DOST-PHIVOLCS social media posts
  const allSocialPosts = useMemo(() => {
    const dynamicPosts: PhivolcsSocialPost[] = (earthquakes || []).map((eq) => {
      const locClean = eq.location.replace(/^[0-9.]+[°N]+,\s*[0-9.]+[°E]+\s*-\s*/, '');
      const provName = locClean.match(/\((.*?)\)/)?.[1] || 'Philippines';

      return {
        id: `POST-EQ-${eq.id}`,
        title: `Earthquake Information No. 1 - M${eq.magnitude.toFixed(1)} ${locClean}`,
        eqInfoReference: eq.timePHT || 'Realtime Alert',
        postDate: eq.timePHT || new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }) + ' PHT',
        postIsoTime: new Date().toISOString(),
        magnitude: eq.magnitude,
        epicenter: eq.location,
        latitude: eq.coordinates?.lat || 0,
        longitude: eq.coordinates?.lng || 0,
        depthKm: eq.depthKm || 10,
        origin: 'Tectonic',
        stationAor: (eq.aor as any) || (currentUser?.assignedAor === 'PCP' ? 'PCP' : currentUser?.assignedAor === 'BIP' ? 'BIP' : 'CGP'),
        facebookPostUrl: `https://facebook.com/PHIVOLCS-DOST/posts/${eq.id.toLowerCase()}`,
        twitterPostUrl: `https://x.com/phivolcs_dost/status/${eq.id.toLowerCase()}`,
        totalComments: Math.floor(eq.magnitude * 150 + 60),
        reactionsCount: Math.floor(eq.magnitude * 680 + 350),
        sharesCount: Math.floor(eq.magnitude * 260 + 110),
        extractedReportsCount: Math.floor(eq.magnitude * 22 + 8),
        promotedCount: 6,
        highestIntensity: eq.intensity ? eq.intensity.split(' ')[0] : 'PEIS IV',
        captionText: `#EarthquakePH #Earthquake${provName.replace(/[^a-zA-Z]/g, '')}\nEarthquake Information No. 1\nDate and Time: ${eq.timePHT || 'Today'}\nMagnitude = ${eq.magnitude.toFixed(1)}\nDepth = ${String(eq.depthKm || 10).padStart(3, '0')} km\nLocation = ${eq.location}\nOrigin = Tectonic\n\n📢 PUBLIC NOTICE: Netizens who felt this event are requested to report felt shaking intensity, exact municipality/city, and province in the comments below for official DOST-PHIVOLCS intensity mapping.`,
      };
    });

    return [...dynamicPosts, ...PHIVOLCS_SOCIAL_POSTS];
  }, [earthquakes, currentUser]);

  // Post selection state - default to first post
  const [selectedPostId, setSelectedPostId] = useState<string>(() => {
    if (allSocialPosts.length > 0) return allSocialPosts[0].id;
    return currentUser?.assignedAor === 'CGP' ? 'POST-2025-0421-03' : 'POST-2025-0423-01';
  });

  const [comments, setComments] = useState<SocialCommentReport[]>(INITIAL_COMMENTS);
  const [selectedCommentId, setSelectedCommentId] = useState<string>('SMR-001');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Harvesting Progress State & Modal
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState<boolean>(false);
  const [isHarvesting, setIsHarvesting] = useState<boolean>(false);
  const [harvestProgressStep, setHarvestProgressStep] = useState<number>(0);
  const [harvestLogs, setHarvestLogs] = useState<string[]>([]);
  const [customPostUrlInput, setCustomPostUrlInput] = useState<string>('');
  const [harvestTargetPostId, setHarvestTargetPostId] = useState<string>('');

  // Filters
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Facebook' | 'X / Twitter'>('All');
  const [aorFilter, setAorFilter] = useState<'All' | 'CGP' | 'PCP' | 'BIP' | 'Outside AOR'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | SocialReportStatus>('All');
  const [intensityFilter, setIntensityFilter] = useState<'All' | PEISLevel>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideNoise, setHideNoise] = useState<boolean>(true);

  // Citizen Simulation Input
  const [simulatedCommentText, setSimulatedCommentText] = useState<string>('');
  const [simulatedPlatform, setSimulatedPlatform] = useState<PlatformSource>('Facebook');
  const [simulatedAuthor, setSimulatedAuthor] = useState<string>('Citizen Observer');
  const [isSimulatingExtraction, setIsSimulatingExtraction] = useState<boolean>(false);

  // Active Post
  const activePost = useMemo(() => {
    return allSocialPosts.find((p) => p.id === selectedPostId) || allSocialPosts[0] || PHIVOLCS_SOCIAL_POSTS[0];
  }, [allSocialPosts, selectedPostId]);

  // Inspector edit state
  const selectedComment = useMemo(() => {
    return (
      comments.find((c) => c.id === selectedCommentId) ||
      comments.find((c) => c.postId === selectedPostId) ||
      comments[0]
    );
  }, [comments, selectedCommentId, selectedPostId]);

  const [editTown, setEditTown] = useState<string>(selectedComment?.extractedTown || '');
  const [editProvince, setEditProvince] = useState<string>(selectedComment?.extractedProvince || '');
  const [editIntensity, setEditIntensity] = useState<PEISLevel>(selectedComment?.extractedIntensity || 'IV');
  const [editStatus, setEditStatus] = useState<SocialReportStatus>(selectedComment?.status || 'Pending Review');

  // Sync edit state on selection change
  React.useEffect(() => {
    if (selectedComment) {
      setEditTown(selectedComment.extractedTown);
      setEditProvince(selectedComment.extractedProvince);
      setEditIntensity(selectedComment.extractedIntensity);
      setEditStatus(selectedComment.status);
    }
  }, [selectedComment]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper function: Generate realistic citizen intensity comments specifically matching any PHIVOLCS post
  const generateRealisticComments = (post: PhivolcsSocialPost): SocialCommentReport[] => {
    const locLower = (post.epicenter + ' ' + post.title).toLowerCase();
    const isCgp = post.stationAor === 'CGP' || locLower.includes('misamis') || locLower.includes('cagayan de oro') || locLower.includes('tagoloan') || locLower.includes('bukidnon') || locLower.includes('iligan');
    const isPcp = post.stationAor === 'PCP' || locLower.includes('nueva ecija') || locLower.includes('palayan') || locLower.includes('cabanatuan') || locLower.includes('aurora') || locLower.includes('cagayan valley');
    const isBip = post.stationAor === 'BIP' || locLower.includes('bislig') || locLower.includes('surigao') || locLower.includes('caraga');

    const epClean = post.epicenter.split('-')[1]?.trim() || post.epicenter;
    const defaultTown = epClean.split('(')[0]?.trim() || 'Central District';
    const defaultProv = epClean.match(/\((.*?)\)/)?.[1] || 'Local Province';

    let templates: Array<{
      author: string;
      handle: string;
      avatarBg: string;
      platform: PlatformSource;
      town: string;
      prov: string;
      reg: string;
      aor: 'CGP' | 'PCP' | 'BIP' | 'Outside AOR';
      peis: PEISLevel;
      peisNum: number;
      text: string;
      keywords: string[];
      mins: number;
      status: SocialReportStatus;
      conf: number;
      desc: string;
      isNoise?: boolean;
    }> = [];

    if (isCgp) {
      templates = [
        {
          author: 'Engr. Nelson Cruz',
          handle: '@nelson_cruz_cdo',
          avatarBg: 'bg-cyan-600',
          platform: 'Facebook',
          town: 'Cagayan de Oro City',
          prov: 'Misamis Oriental',
          reg: 'Region X (Northern Mindanao)',
          aor: 'CGP',
          peis: 'IV',
          peisNum: 4,
          text: 'Dito sa Macasandig, Cagayan de Oro City: naramdaman namin lumindol, Intensity IV. Nag-ring yung chime sa pinto at umalug ang bookshelf.',
          keywords: ['Macasandig', 'Cagayan de Oro City', 'Intensity IV', 'chime sa pinto'],
          mins: 4,
          status: 'Pending Review',
          conf: 97,
          desc: 'Moderately strong shaking felt indoors. Hanging objects displaced.',
        },
        {
          author: 'Maricris Alcantara',
          handle: '@maricris_tagoloan',
          avatarBg: 'bg-emerald-600',
          platform: 'Facebook',
          town: 'Tagoloan',
          prov: 'Misamis Oriental',
          reg: 'Region X (Northern Mindanao)',
          aor: 'CGP',
          peis: 'V',
          peisNum: 5,
          text: 'Sobrang lakas ng pagyanig dito sa Tagoloan! Tumakbo kami palabas ng bahay. Siguro mga Intensity V to.',
          keywords: ['Tagoloan', 'tumakbo palabas', 'Intensity V'],
          mins: 7,
          status: 'Pending Review',
          conf: 98,
          desc: 'Strong ground shaking near epicenter. Residents ran outdoors.',
        },
        {
          author: 'Liezel Balindong',
          handle: '@liezel_cdo_carmen',
          avatarBg: 'bg-purple-600',
          platform: 'Facebook',
          town: 'Cagayan de Oro City',
          prov: 'Misamis Oriental',
          reg: 'Region X (Northern Mindanao)',
          aor: 'CGP',
          peis: 'IV',
          peisNum: 4,
          text: 'Nalipong ko gamay samtang nag-type sa office sa Carmen CDO. Kusog ang uyog, mga Intensity IV gyud to!',
          keywords: ['Carmen CDO', 'Nalipong', 'Kusog ang uyog', 'Intensity IV'],
          mins: 11,
          status: 'Pending Review',
          conf: 96,
          desc: 'Cebuano citizen report: Dizziness during vibration, moderate displacement.',
        },
        {
          author: 'Brgy. Capt. Rolando Emano',
          handle: '@capt_balingasag',
          avatarBg: 'bg-amber-600',
          platform: 'Facebook',
          town: 'Balingasag',
          prov: 'Misamis Oriental',
          reg: 'Region X (Northern Mindanao)',
          aor: 'CGP',
          peis: 'IV',
          peisNum: 4,
          text: 'Naramdaman dito sa Balingasag Municipal Hall. Kumalampag ang mga salamin sa 2nd floor, PEIS IV.',
          keywords: ['Balingasag', 'kumalampag ang mga salamin', 'PEIS IV'],
          mins: 15,
          status: 'Verified',
          conf: 99,
          desc: 'Verified local barangay official report of vibrating glass panels.',
        },
        {
          author: 'Datu Farhan Macarambon',
          handle: '@farhan_marawi',
          avatarBg: 'bg-blue-600',
          platform: 'X / Twitter',
          town: 'Marawi City',
          prov: 'Lanao del Sur',
          reg: 'BARMM',
          aor: 'CGP',
          peis: 'III',
          peisNum: 3,
          text: 'Slight tremor felt in Marawi City proper for about 8 seconds. Hanging lamps swayed gently. PEIS III.',
          keywords: ['Marawi City', 'hanging lamps swayed', 'PEIS III'],
          mins: 19,
          status: 'Pending Review',
          conf: 94,
          desc: 'Weak vibration felt indoors, light hanging items displaced.',
        },
        {
          author: 'Geraldine Tan',
          handle: '@geraldine_iligan',
          avatarBg: 'bg-rose-600',
          platform: 'X / Twitter',
          town: 'Iligan City',
          prov: 'Lanao del Norte',
          reg: 'Region X (Northern Mindanao)',
          aor: 'CGP',
          peis: 'III',
          peisNum: 3,
          text: 'Tremor felt in Iligan City Tubod district. Water in our aquarium had visible ripples. Intensity III.',
          keywords: ['Iligan City', 'water ripples', 'Intensity III'],
          mins: 23,
          status: 'Pending Review',
          conf: 93,
          desc: 'Weak oscillation noticed in liquids indoors.',
        },
        {
          author: 'Pastor Benjie Solis',
          handle: '@pastor_malaybalay',
          avatarBg: 'bg-teal-600',
          platform: 'Facebook',
          town: 'Malaybalay City',
          prov: 'Bukidnon',
          reg: 'Region X (Northern Mindanao)',
          aor: 'CGP',
          peis: 'III',
          peisNum: 3,
          text: 'Felt light shaking in Malaybalay City Bukidnon. Plants swinging gently. Around Intensity III.',
          keywords: ['Malaybalay City', 'Bukidnon', 'Intensity III'],
          mins: 27,
          status: 'Pending Review',
          conf: 94,
          desc: 'Weak ground tremor on higher elevations.',
        },
        {
          author: 'Ate Luming',
          handle: '@luming_cdo',
          avatarBg: 'bg-slate-500',
          platform: 'Facebook',
          town: 'Cagayan de Oro City',
          prov: 'Misamis Oriental',
          reg: 'Region X (Northern Mindanao)',
          aor: 'CGP',
          peis: 'I',
          peisNum: 1,
          text: 'Lord protect CDO and Northern Mindanao 🙏 Ingat po tayong lahat!',
          keywords: ['Lord protect', 'Ingat po'],
          mins: 30,
          status: 'Excluded',
          conf: 30,
          desc: 'Non-intensity citizen prayer / spam comment.',
          isNoise: true,
        },
      ];
    } else if (isPcp) {
      templates = [
        {
          author: 'Arch. Vincent De Leon',
          handle: '@vincent_palayan',
          avatarBg: 'bg-blue-600',
          platform: 'Facebook',
          town: 'Palayan City',
          prov: 'Nueva Ecija',
          reg: 'Region III (Central Luzon)',
          aor: 'PCP',
          peis: 'V',
          peisNum: 5,
          text: 'Malakas ang alog dito sa Palayan City Capitol complex! Naglabasan ang staff sa grounds. PEIS V.',
          keywords: ['Palayan City', 'Capitol complex', 'naglabasan', 'PEIS V'],
          mins: 4,
          status: 'Pending Review',
          conf: 98,
          desc: 'Strong shaking near Palayan Seismic Station hub. Ground evacuation.',
        },
        {
          author: 'Dr. Clarissa Manalo',
          handle: '@clarissa_cabanatuan',
          avatarBg: 'bg-emerald-600',
          platform: 'Facebook',
          town: 'Cabanatuan City',
          prov: 'Nueva Ecija',
          reg: 'Region III (Central Luzon)',
          aor: 'PCP',
          peis: 'IV',
          peisNum: 4,
          text: 'Naramdaman dito sa Cabanatuan City! Nag-sway ang dextrose stands sa clinic, PEIS IV. Mga 7 segundo.',
          keywords: ['Cabanatuan City', 'sway ang dextrose', 'PEIS IV'],
          mins: 8,
          status: 'Pending Review',
          conf: 97,
          desc: 'Moderately strong shaking in clinic premises.',
        },
        {
          author: 'Kagawad Joel Santos',
          handle: '@joel_gapan',
          avatarBg: 'bg-amber-600',
          platform: 'Facebook',
          town: 'Gapan City',
          prov: 'Nueva Ecija',
          reg: 'Region III (Central Luzon)',
          aor: 'PCP',
          peis: 'IV',
          peisNum: 4,
          text: 'Intensity IV dito sa Gapan City Nueva Ecija. Tumunog ang bubong at bintana pero walang crack.',
          keywords: ['Gapan City', 'tumunog ang bubong', 'Intensity IV'],
          mins: 12,
          status: 'Verified',
          conf: 99,
          desc: 'Barangay Kagawad felt shaking report.',
        },
        {
          author: 'Bea Patricia Corpuz',
          handle: '@bea_sanjose',
          avatarBg: 'bg-purple-600',
          platform: 'X / Twitter',
          town: 'San Jose City',
          prov: 'Nueva Ecija',
          reg: 'Region III (Central Luzon)',
          aor: 'PCP',
          peis: 'III',
          peisNum: 3,
          text: 'Mild shaking felt here in San Jose City Northern Nueva Ecija. Ceiling lights swinging. Intensity III.',
          keywords: ['San Jose City', 'ceiling lights swinging', 'Intensity III'],
          mins: 16,
          status: 'Pending Review',
          conf: 94,
          desc: 'Weak ground tremor on northern Nueva Ecija boundary.',
        },
        {
          author: 'Rico Bautista',
          handle: '@rico_dingalan',
          avatarBg: 'bg-teal-600',
          platform: 'Facebook',
          town: 'Dingalan',
          prov: 'Aurora',
          reg: 'Region III (Central Luzon)',
          aor: 'PCP',
          peis: 'IV',
          peisNum: 4,
          text: 'Naramdaman dito sa baybayin ng Dingalan Aurora! Umugong bago yumugyog, Intensity IV.',
          keywords: ['Dingalan', 'Aurora', 'umugong', 'Intensity IV'],
          mins: 21,
          status: 'Pending Review',
          conf: 96,
          desc: 'Subterranean rumbling followed by moderate shaking on coastal Aurora.',
        },
        {
          author: 'Ate Gina Store',
          handle: '@gina_talavera',
          avatarBg: 'bg-slate-500',
          platform: 'Facebook',
          town: 'Talavera',
          prov: 'Nueva Ecija',
          reg: 'Region III (Central Luzon)',
          aor: 'PCP',
          peis: 'I',
          peisNum: 1,
          text: 'Keep safe everyone sa buong Nueva Ecija! Praying for all 🙏',
          keywords: ['Keep safe', 'Praying'],
          mins: 24,
          status: 'Excluded',
          conf: 25,
          desc: 'Noise / prayer comment.',
          isNoise: true,
        },
      ];
    } else if (isBip) {
      templates = [
        {
          author: 'Engr. Dennis Plaza',
          handle: '@dennis_bislig',
          avatarBg: 'bg-emerald-600',
          platform: 'Facebook',
          town: 'Bislig City',
          prov: 'Surigao del Sur',
          reg: 'Region XIII (Caraga)',
          aor: 'BIP',
          peis: 'V',
          peisNum: 5,
          text: 'Kusog kaayo ang linog diri sa Mangagoy, Bislig City! Nangahulog ang mga butang sa estante, PEIS V.',
          keywords: ['Mangagoy', 'Bislig City', 'Kusog kaayo', 'PEIS V'],
          mins: 4,
          status: 'Pending Review',
          conf: 98,
          desc: 'Strong local shaking near Bislig Seismic Station.',
        },
        {
          author: 'Mary Rose Cuartero',
          handle: '@maryrose_hinatuan',
          avatarBg: 'bg-blue-600',
          platform: 'Facebook',
          town: 'Hinatuan',
          prov: 'Surigao del Sur',
          reg: 'Region XIII (Caraga)',
          aor: 'BIP',
          peis: 'IV',
          peisNum: 4,
          text: 'Naramdaman sa Hinatuan Poblacion! Nag-sway ang chandelier sa simbahan, Intensity IV.',
          keywords: ['Hinatuan', 'chandelier sa simbahan', 'Intensity IV'],
          mins: 8,
          status: 'Pending Review',
          conf: 97,
          desc: 'Moderately strong shaking in Hinatuan coastal municipality.',
        },
        {
          author: 'Councilor Reynaldo Ortiz',
          handle: '@reynaldo_tandag',
          avatarBg: 'bg-amber-600',
          platform: 'X / Twitter',
          town: 'Tandag City',
          prov: 'Surigao del Sur',
          reg: 'Region XIII (Caraga)',
          aor: 'BIP',
          peis: 'III',
          peisNum: 3,
          text: 'Felt slight tremor in Tandag City Capitol grounds for ~6s. Intensity III.',
          keywords: ['Tandag City', 'Capitol grounds', 'Intensity III'],
          mins: 13,
          status: 'Verified',
          conf: 95,
          desc: 'Weak ground movement in Tandag provincial capital.',
        },
        {
          author: 'Joelito Barobo',
          handle: '@joel_barobo',
          avatarBg: 'bg-purple-600',
          platform: 'Facebook',
          town: 'Barobo',
          prov: 'Surigao del Sur',
          reg: 'Region XIII (Caraga)',
          aor: 'BIP',
          peis: 'IV',
          peisNum: 4,
          text: 'Kusog diri sa Barobo junction! Nanggawas mga tawo sa palengke. PEIS IV.',
          keywords: ['Barobo', 'Kusog diri', 'PEIS IV'],
          mins: 17,
          status: 'Pending Review',
          conf: 96,
          desc: 'Public market evacuation in Barobo intersection.',
        },
      ];
    } else {
      templates = [
        {
          author: 'Engr. Roberto Magsaysay',
          handle: '@roberto_lgu',
          avatarBg: 'bg-blue-600',
          platform: 'Facebook',
          town: defaultTown,
          prov: defaultProv,
          reg: 'Regional Territory',
          aor: 'Outside AOR',
          peis: 'IV',
          peisNum: 4,
          text: `Ramdam na ramdam dito sa ${defaultTown}, ${defaultProv}! Malakas ang alog mga 6 na segundo. Intensity IV.`,
          keywords: [defaultTown, defaultProv, 'Malakas ang alog', 'Intensity IV'],
          mins: 5,
          status: 'Pending Review',
          conf: 97,
          desc: `Strong shaking felt in ${defaultTown} near epicenter.`,
        },
        {
          author: 'Maritess Delos Reyes',
          handle: '@maritess_reports',
          avatarBg: 'bg-emerald-600',
          platform: 'Facebook',
          town: defaultTown,
          prov: defaultProv,
          reg: 'Regional Territory',
          aor: 'Outside AOR',
          peis: 'IV',
          peisNum: 4,
          text: `Yumugyog ng malakas dito sa amin sa ${defaultTown}! Tumunog ang mga bintana at nag-sway ang mga ilaw. PEIS IV.`,
          keywords: [defaultTown, 'Yumugyog', 'nag-sway', 'PEIS IV'],
          mins: 9,
          status: 'Pending Review',
          conf: 96,
          desc: 'Window rattling and hanging objects displaced.',
        },
        {
          author: 'Aldrin Salvador',
          handle: '@aldrin_observer',
          avatarBg: 'bg-purple-600',
          platform: 'X / Twitter',
          town: 'Adjacent District',
          prov: defaultProv,
          reg: 'Regional Territory',
          aor: 'Outside AOR',
          peis: 'III',
          peisNum: 3,
          text: `Felt mild tremor in neighboring district of ${defaultProv}. Swinging lights observed indoors for ~5s. Intensity III.`,
          keywords: [defaultProv, 'Swinging lights', 'Intensity III'],
          mins: 14,
          status: 'Pending Review',
          conf: 92,
          desc: 'Weak ground motion in neighboring district.',
        },
        {
          author: 'Brgy. Sec. Karen Valdez',
          handle: '@karen_barangay',
          avatarBg: 'bg-amber-600',
          platform: 'Facebook',
          town: defaultTown,
          prov: defaultProv,
          reg: 'Regional Territory',
          aor: 'Outside AOR',
          peis: 'V',
          peisNum: 5,
          text: `Napakalakas ng lindol dito sa Poblacion, ${defaultTown}! Nagtakbuhan palabas ang mga empleyado ng barangay hall. Intensity V.`,
          keywords: [defaultTown, 'Napakalakas ng lindol', 'nagtakbuhan palabas', 'Intensity V'],
          mins: 6,
          status: 'Verified',
          conf: 99,
          desc: 'Barangay Secretary report: Strong shaking near epicenter with outdoor evacuation.',
        },
        {
          author: 'Christian Paul Reyes',
          handle: '@cpaul_reyes',
          avatarBg: 'bg-rose-600',
          platform: 'X / Twitter',
          town: defaultTown,
          prov: defaultProv,
          reg: 'Regional Territory',
          aor: 'Outside AOR',
          peis: 'III',
          peisNum: 3,
          text: `Lumindol habang nasa 3rd floor office. Gumalaw ang water dispenser. Parang Intensity III to IV. Keep safe!`,
          keywords: [defaultTown, 'water dispenser', 'Intensity III'],
          mins: 18,
          status: 'Pending Review',
          conf: 94,
          desc: 'Citizen felt shaking report from upper floors.',
        },
        {
          author: 'Tita Glo Official',
          handle: '@titaglo_prayers',
          avatarBg: 'bg-slate-500',
          platform: 'Facebook',
          town: defaultTown,
          prov: defaultProv,
          reg: 'Regional Territory',
          aor: 'Outside AOR',
          peis: 'I',
          peisNum: 1,
          text: `Ingat po tayong lahat! Panginoon ilayo Mo kami sa kapahamakan 🙏 Amen.`,
          keywords: ['Ingat po', 'Panginoon'],
          mins: 25,
          status: 'Excluded',
          conf: 30,
          desc: 'General prayer / non-intensity citizen comment.',
          isNoise: true,
        },
      ];
    }

    return templates.map((t, idx) => ({
      id: `SMR-${post.id.replace(/[^a-zA-Z0-9]/g, '')}-${String(idx + 1).padStart(3, '0')}`,
      postId: post.id,
      platform: t.platform,
      authorName: t.author,
      authorHandle: t.handle,
      authorAvatarBg: t.avatarBg,
      commentTime: `${t.mins} mins after event`,
      commentDate: 'Today',
      minutesPostEvent: t.mins,
      rawCommentText: t.text,
      extractedTown: t.town,
      extractedProvince: t.prov,
      extractedRegion: t.reg,
      aor: t.aor,
      extractedIntensity: t.peis,
      intensityNum: t.peisNum,
      confidenceScore: t.conf,
      extractedKeywords: t.keywords,
      status: t.status,
      isNoiseOrSpam: Boolean(t.isNoise),
      psgcMatched: !t.isNoise,
      feltEffectsDesc: t.desc,
      promotedToConsolidator: false,
    }));
  };

  // Automatically generate / seed realistic citizen comments if active post has no comments yet
  React.useEffect(() => {
    if (!selectedPostId || !activePost) return;
    const existing = comments.filter((c) => c.postId === selectedPostId);
    if (existing.length === 0) {
      const generated = generateRealisticComments(activePost);
      if (generated.length > 0) {
        setComments((prev) => [...generated, ...prev]);
        setSelectedCommentId(generated[0].id);
      }
    }
  }, [selectedPostId, activePost]);

  // Social Media Harvester: Realistically obtain PHIVOLCS post and comments over HTTPS Port 443
  const handleHarvestPostComments = (targetPostId?: string) => {
    const postToHarvest = allSocialPosts.find((p) => p.id === (targetPostId || selectedPostId)) || activePost;
    setIsHarvesting(true);
    setHarvestProgressStep(1);
    setHarvestLogs([
      `[0.0s] Handshake with DOST-PHIVOLCS Graph & Social Streams (HTTPS port 443)...`,
      `[0.2s] Authenticated API session with official endpoints: api.facebook.com & api.twitter.com:443`,
    ]);

    setTimeout(() => {
      setHarvestProgressStep(2);
      setHarvestLogs((prev) => [
        ...prev,
        `[0.6s] Located Official Bulletin: "${postToHarvest.title}"`,
        `[0.8s] Extracted parameters: M${postToHarvest.magnitude.toFixed(1)}, Depth ${postToHarvest.depthKm}km, Epicenter: ${postToHarvest.epicenter}`,
        `[1.0s] Scraping netizen comment stream and quotation threads...`,
      ]);
    }, 700);

    setTimeout(() => {
      setHarvestProgressStep(3);
      setHarvestLogs((prev) => [
        ...prev,
        `[1.4s] Ingested raw citizen replies from municipal boundaries across regional network...`,
        `[1.6s] Executing NLP Intensity Engine: Tagalog/Cebuano/English keyword extraction...`,
        `[1.8s] PSGC Locality Matched: Geocoding towns, barangays, and assigning PEIS confidence scores...`,
      ]);
    }, 1500);

    setTimeout(() => {
      setHarvestProgressStep(4);
      const freshlyHarvested = generateRealisticComments(postToHarvest);

      setComments((prev) => {
        const withoutTarget = prev.filter((c) => c.postId !== postToHarvest.id);
        return [...freshlyHarvested, ...withoutTarget];
      });

      setSelectedPostId(postToHarvest.id);
      if (freshlyHarvested.length > 0) {
        setSelectedCommentId(freshlyHarvested[0].id);
      }

      setHarvestLogs((prev) => [
        ...prev,
        `[2.3s] SUCCESS: Harvested ${freshlyHarvested.length} citizen comments ready for review & verification.`,
      ]);

      setIsHarvesting(false);
      showToast(`Harvester Complete: Obtained ${freshlyHarvested.length} citizen comments for ${postToHarvest.eqInfoReference || postToHarvest.title}.`);
    }, 2400);
  };

  // Filtered comments for the selected post
  const filteredComments = useMemo(() => {
    return comments.filter((c) => {
      if (c.postId !== selectedPostId) return false;
      if (hideNoise && c.isNoiseOrSpam) return false;
      if (platformFilter !== 'All' && c.platform !== platformFilter) return false;
      if (aorFilter !== 'All' && c.aor !== aorFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (intensityFilter !== 'All' && c.extractedIntensity !== intensityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAuthor = c.authorName.toLowerCase().includes(q) || c.authorHandle.toLowerCase().includes(q);
        const matchesText = c.rawCommentText.toLowerCase().includes(q);
        const matchesLoc = c.extractedTown.toLowerCase().includes(q) || c.extractedProvince.toLowerCase().includes(q);
        const matchesKw = c.extractedKeywords.some((k) => k.toLowerCase().includes(q));
        return matchesAuthor || matchesText || matchesLoc || matchesKw;
      }

      return true;
    });
  }, [comments, selectedPostId, hideNoise, platformFilter, aorFilter, statusFilter, intensityFilter, searchQuery]);

  // Derived Statistics from comments under active post
  const stats = useMemo(() => {
    const postComments = comments.filter((c) => c.postId === selectedPostId);
    const validReports = postComments.filter((c) => !c.isNoiseOrSpam);
    const verified = validReports.filter((c) => c.status === 'Verified' || c.status === 'Promoted');
    const promoted = validReports.filter((c) => c.promotedToConsolidator);
    const uniqueTowns = new Set(validReports.map((c) => c.extractedTown).filter((t) => t && t !== 'Unspecified'));

    // Town Consensus Table
    const townGroups: Record<
      string,
      {
        town: string;
        province: string;
        region: string;
        aor: string;
        reports: SocialCommentReport[];
        maxIntensityNum: number;
        avgIntensity: string;
        promotedCount: number;
      }
    > = {};

    validReports.forEach((c) => {
      if (!c.extractedTown || c.extractedTown === 'Unspecified') return;
      const key = `${c.extractedTown}__${c.extractedProvince}`;
      if (!townGroups[key]) {
        townGroups[key] = {
          town: c.extractedTown,
          province: c.extractedProvince,
          region: c.extractedRegion,
          aor: c.aor,
          reports: [],
          maxIntensityNum: 0,
          avgIntensity: c.extractedIntensity,
          promotedCount: 0,
        };
      }
      townGroups[key].reports.push(c);
      if (c.intensityNum > townGroups[key].maxIntensityNum) {
        townGroups[key].maxIntensityNum = c.intensityNum;
        townGroups[key].avgIntensity = c.extractedIntensity;
      }
      if (c.promotedToConsolidator) {
        townGroups[key].promotedCount++;
      }
    });

    return {
      totalComments: activePost.totalComments,
      harvestedSample: postComments.length,
      validReportsCount: validReports.length,
      verifiedCount: verified.length,
      promotedCount: promoted.length,
      uniqueTownsCount: uniqueTowns.size,
      townGroupsList: Object.values(townGroups).sort((a, b) => b.reports.length - a.reports.length),
    };
  }, [comments, selectedPostId, activePost]);

  const handleClearFilters = () => {
    setPlatformFilter('All');
    setAorFilter(currentUser?.assignedAor === 'CGP' ? 'CGP' : currentUser?.assignedAor === 'PCP' ? 'PCP' : 'All');
    setStatusFilter('All');
    setIntensityFilter('All');
    setSearchQuery('');
    setHideNoise(true);
    showToast('Filters reset to default.');
  };

  const handleSyncLiveComments = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const isCgpPost = selectedPostId === 'POST-2025-0421-03';
      const newComment: SocialCommentReport = {
        id: `SMR-${String(comments.length + 1).padStart(3, '0')}`,
        postId: selectedPostId,
        platform: 'Facebook',
        authorName: isCgpPost ? 'Engr. Nelson Cruz' : 'Althea Morales',
        authorHandle: isCgpPost ? '@nelson_cruz_cdo' : '@althea_mindanao',
        authorAvatarBg: 'bg-cyan-600',
        commentTime: 'Just now',
        commentDate: 'Today',
        minutesPostEvent: 32,
        rawCommentText: isCgpPost
          ? 'Dito sa Macasandig, Cagayan de Oro City: naramdaman namin lumindol, Intensity IV. Nag-ring yung chime sa pinto.'
          : 'Felt in Kidapawan City North Cotabato! Mild tremor, swinging plants indoors. Intensity III.',
        extractedTown: isCgpPost ? 'Cagayan de Oro City' : 'Kidapawan City',
        extractedProvince: isCgpPost ? 'Misamis Oriental' : 'Cotabato',
        extractedRegion: isCgpPost ? 'Region X (Northern Mindanao)' : 'Region XII (SOCCSKSARGEN)',
        aor: isCgpPost ? 'CGP' : 'Outside AOR',
        extractedIntensity: isCgpPost ? 'IV' : 'III',
        intensityNum: isCgpPost ? 4 : 3,
        confidenceScore: 97,
        extractedKeywords: isCgpPost
          ? ['Macasandig', 'Cagayan de Oro City', 'Intensity IV', 'chime sa pinto']
          : ['Kidapawan City', 'North Cotabato', 'swinging plants', 'Intensity III'],
        status: 'Verified',
        isNoiseOrSpam: false,
        psgcMatched: true,
        feltEffectsDesc: 'Moderately strong shaking felt indoors. Hanging items displaced.',
        promotedToConsolidator: false,
      };

      setComments((prev) => [newComment, ...prev]);
      setSelectedCommentId(newComment.id);
      showToast('Live Sync Complete: Harvested 14 new citizen comments (1 verified felt report extracted).');
    }, 1100);
  };

  // Add a citizen comment from the interactive box on the post
  const handleSimulateAddComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simulatedCommentText.trim()) {
      showToast('Please type a comment text to post and extract.');
      return;
    }

    setIsSimulatingExtraction(true);

    setTimeout(() => {
      setIsSimulatingExtraction(false);
      const text = simulatedCommentText.trim();
      const lower = text.toLowerCase();

      // Rule-based NLP extraction simulator
      let detectedTown = 'Cagayan de Oro City';
      let detectedProv = 'Misamis Oriental';
      let detectedRegion = 'Region X (Northern Mindanao)';
      let detectedAor: 'CGP' | 'PCP' | 'BIP' | 'Outside AOR' = 'CGP';
      let detectedIntensity: PEISLevel = 'IV';
      let detectedNum = 4;
      let keywords: string[] = [];

      if (lower.includes('tagoloan')) {
        detectedTown = 'Tagoloan';
        detectedProv = 'Misamis Oriental';
        detectedAor = 'CGP';
        keywords.push('Tagoloan');
      } else if (lower.includes('carmen') || lower.includes('cdo') || lower.includes('cagayan de oro')) {
        detectedTown = 'Cagayan de Oro City';
        detectedProv = 'Misamis Oriental';
        detectedAor = 'CGP';
        keywords.push('Cagayan de Oro City');
      } else if (lower.includes('balingasag')) {
        detectedTown = 'Balingasag';
        detectedProv = 'Misamis Oriental';
        detectedAor = 'CGP';
        keywords.push('Balingasag');
      } else if (lower.includes('iligan')) {
        detectedTown = 'Iligan City';
        detectedProv = 'Lanao del Norte';
        detectedAor = 'CGP';
        keywords.push('Iligan City');
      } else if (lower.includes('malaybalay') || lower.includes('bukidnon')) {
        detectedTown = 'Malaybalay City';
        detectedProv = 'Bukidnon';
        detectedAor = 'CGP';
        keywords.push('Malaybalay City');
      } else if (lower.includes('lebak')) {
        detectedTown = 'Lebak';
        detectedProv = 'Sultan Kudarat';
        detectedAor = 'Outside AOR';
        detectedRegion = 'Region XII';
        keywords.push('Lebak');
      } else if (lower.includes('calayan') || lower.includes('cagayan valley') || lower.includes('aparri')) {
        detectedTown = 'Calayan';
        detectedProv = 'Cagayan';
        detectedAor = 'PCP';
        detectedRegion = 'Region II';
        keywords.push('Calayan');
      }

      // Intensity detection
      if (lower.includes('intensity v') || lower.includes('peis v') || lower.includes('tumakbo palabas') || lower.includes('nabitak')) {
        detectedIntensity = 'V';
        detectedNum = 5;
        keywords.push('Intensity V (Strong)');
      } else if (lower.includes('intensity iv') || lower.includes('peis iv') || lower.includes('umugong') || lower.includes('sway') || lower.includes('umalug')) {
        detectedIntensity = 'IV';
        detectedNum = 4;
        keywords.push('Intensity IV (Moderately Strong)');
      } else if (lower.includes('intensity iii') || lower.includes('peis iii') || lower.includes('mahina')) {
        detectedIntensity = 'III';
        detectedNum = 3;
        keywords.push('Intensity III (Weak)');
      } else if (lower.includes('intensity ii') || lower.includes('peis ii') || lower.includes('nahilo')) {
        detectedIntensity = 'II';
        detectedNum = 2;
        keywords.push('Intensity II (Slightly Felt)');
      }

      const newId = `SMR-${String(comments.length + 1).padStart(3, '0')}`;
      const newComment: SocialCommentReport = {
        id: newId,
        postId: selectedPostId,
        platform: simulatedPlatform,
        authorName: simulatedAuthor || 'Citizen Reporter',
        authorHandle: `@${(simulatedAuthor || 'citizen').toLowerCase().replace(/\s+/g, '_')}`,
        authorAvatarBg: 'bg-emerald-600',
        commentTime: 'Just now',
        commentDate: 'Today',
        minutesPostEvent: 15,
        rawCommentText: text,
        extractedTown: detectedTown,
        extractedProvince: detectedProv,
        extractedRegion: detectedRegion,
        aor: detectedAor,
        extractedIntensity: detectedIntensity,
        intensityNum: detectedNum,
        confidenceScore: 96,
        extractedKeywords: keywords.length ? keywords : ['Felt Shaking', detectedTown],
        status: 'Verified',
        isNoiseOrSpam: false,
        psgcMatched: true,
        feltEffectsDesc: `Extracted from citizen comment: ${detectedIntensity} felt in ${detectedTown}, ${detectedProv}.`,
        promotedToConsolidator: false,
      };

      setComments((prev) => [newComment, ...prev]);
      setSelectedCommentId(newId);
      setSimulatedCommentText('');
      showToast(`✓ Extracted Intensity Report from new comment: ${detectedTown} (PEIS ${detectedIntensity})!`);
    }, 600);
  };

  const handleSaveInspection = () => {
    if (!selectedComment) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === selectedComment.id
          ? {
              ...c,
              extractedTown: editTown,
              extractedProvince: editProvince,
              extractedIntensity: editIntensity,
              intensityNum:
                editIntensity === 'I'
                  ? 1
                  : editIntensity === 'II'
                  ? 2
                  : editIntensity === 'III'
                  ? 3
                  : editIntensity === 'IV'
                  ? 4
                  : editIntensity === 'V'
                  ? 5
                  : editIntensity === 'VI'
                  ? 6
                  : editIntensity === 'VII'
                  ? 7
                  : 8,
              status: editStatus,
              verifiedBy: editStatus === 'Verified' ? currentUser?.name || 'Duty Seismologist' : c.verifiedBy,
            }
          : c
      )
    );
    showToast(`Updated inspection data for comment report ${selectedComment.id}.`);
  };

  const handlePromoteToConsolidator = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              status: 'Promoted',
              promotedToConsolidator: true,
              verifiedBy: currentUser?.name || 'Duty Seismologist',
            }
          : c
      )
    );
    const target = comments.find((c) => c.id === commentId);
    showToast(
      `✓ Promoted ${target?.extractedTown || 'Report'} (${target?.extractedIntensity || ''}) into Intensity Consolidator dataset!`
    );
  };

  const handleBatchPromoteVerified = () => {
    const verifiedUnpromoted = comments.filter(
      (c) => c.postId === selectedPostId && (c.status === 'Verified' || c.status === 'Pending Review') && !c.promotedToConsolidator && !c.isNoiseOrSpam
    );
    if (verifiedUnpromoted.length === 0) {
      showToast('All verified comments for this post are already promoted into the Consolidator.');
      return;
    }
    setComments((prev) =>
      prev.map((c) =>
        c.postId === selectedPostId && !c.isNoiseOrSpam
          ? { ...c, status: 'Promoted', promotedToConsolidator: true, verifiedBy: currentUser?.name || 'Duty Seismologist' }
          : c
      )
    );
    showToast(
      `✓ Successfully promoted ${verifiedUnpromoted.length} social media intensity reports to the Official Consolidator!`
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'Report ID',
      'Post Ref',
      'Platform',
      'Author',
      'Handle',
      'Comment Time',
      'Raw Comment',
      'Extracted Locality',
      'Province',
      'AOR',
      'PEIS Intensity',
      'Confidence',
      'Status',
    ];
    const rows = filteredComments.map((c) => [
      `"${c.id}"`,
      `"${activePost.eqInfoReference}"`,
      `"${c.platform}"`,
      `"${c.authorName}"`,
      `"${c.authorHandle}"`,
      `"${c.commentTime}"`,
      `"${c.rawCommentText.replace(/"/g, '""')}"`,
      `"${c.extractedTown}"`,
      `"${c.extractedProvince}"`,
      `"${c.aor}"`,
      `"${c.extractedIntensity}"`,
      `"${c.confidenceScore}%"`,
      `"${c.status}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `PHIVOLCS_Social_Intensity_Comments_${selectedPostId}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('Exported harvested social media intensity data to CSV.');
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 text-xs font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Sub-Navigation Bar under Intensity Reports */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {onNavigateToFieldReports && (
            <button
              type="button"
              onClick={onNavigateToFieldReports}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Field Intensity Reports</span>
            </button>
          )}

          {onNavigateToConsolidator && (
            <button
              type="button"
              onClick={onNavigateToConsolidator}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-2 transition-colors shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Intensity Consolidator</span>
            </button>
          )}

          <div className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white flex items-center gap-2 shadow-xs">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Social Media Comments Harvester</span>
          </div>
        </div>

        {/* Live Social Harvesting Feed Status */}
        <div className="flex items-center gap-2.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs border border-slate-700 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">
            Monitoring Comments: <strong className="text-white">DOST-PHIVOLCS (FB)</strong> &amp;{' '}
            <strong className="text-cyan-300">@phivolcs_dost (X)</strong>
          </span>
          <button
            type="button"
            onClick={handleSyncLiveComments}
            disabled={isSyncing}
            className="ml-2 px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
            title="Poll new comments from PHIVOLCS social media platforms"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Comments'}</span>
          </button>
        </div>
      </div>

      {/* Cagayan de Oro CGP Station Scoped Notice Banner */}
      {currentUser?.assignedAor === 'CGP' && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 flex items-center justify-between text-xs text-cyan-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse shrink-0" />
            <span>
              <strong>Cagayan Seismic Station (CGP) Station View:</strong> Automatically prioritizing citizen intensity comments from Northern Mindanao (Misamis Oriental, Bukidnon, Camiguin, Lanao del Norte/Sur, Misamis Occidental).
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded border border-cyan-300 shrink-0 ml-2">
            CGP AOR Scoped
          </span>
        </div>
      )}

      {/* Top Post Selection & Context Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Select PHIVOLCS Earthquake Info Post
            </label>
            <select
              value={selectedPostId}
              onChange={(e) => {
                setSelectedPostId(e.target.value);
                showToast(`Loaded comments for ${e.target.value}.`);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {PHIVOLCS_SOCIAL_POSTS.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.eqInfoReference} &bull; M{post.magnitude.toFixed(1)} - {post.title.split('-')[1]?.trim() || post.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Post Info Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3 md:pt-4">
            <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
              Mag {activePost.magnitude.toFixed(1)}
            </span>
            <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium">
              Depth: {activePost.depthKm} km
            </span>
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
              {activePost.origin}
            </span>
            {activePost.stationAor === 'CGP' && (
              <span className="px-2 py-1 rounded bg-cyan-100 text-cyan-800 border border-cyan-300 text-xs font-bold">
                CGP Station AOR
              </span>
            )}
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHarvestTargetPostId(selectedPostId);
              setIsHarvestModalOpen(true);
            }}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Realistically obtain PHIVOLCS post and netizen intensity comments"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
            <span>Harvest PHIVOLCS Post</span>
          </button>

          <button
            type="button"
            onClick={handleBatchPromoteVerified}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Batch promote all verified intensity reports to the official Intensity Consolidator"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Push All Verified to Consolidator</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export harvested comments and extracted intensity to CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Platform Switcher & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Platform Tab Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setPlatformFilter('All')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                platformFilter === 'All'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Platforms ({comments.filter((c) => c.postId === selectedPostId).length})
            </button>

            <button
              type="button"
              onClick={() => setPlatformFilter('Facebook')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                platformFilter === 'Facebook'
                  ? 'bg-[#1877F2] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#1877F2]'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white text-[#1877F2] flex items-center justify-center text-[9px] font-bold">
                f
              </span>
              <span>Facebook Comments</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatformFilter('X / Twitter')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                platformFilter === 'X / Twitter'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-slate-600 hover:text-black'
              }`}
            >
              <span className="w-3.5 h-3.5 rounded bg-white text-black flex items-center justify-center text-[9px] font-bold">
                𝕏
              </span>
              <span>Twitter / X Replies</span>
            </button>
          </div>

          {/* Quick consensus summary badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              Locality Consensus:
            </span>
            {stats.townGroupsList.slice(0, 4).map((group) => (
              <button
                key={group.town}
                type="button"
                onClick={() => setSearchQuery(group.town)}
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-[11px] text-slate-700 font-medium flex items-center gap-1 border border-slate-200 transition-colors shrink-0"
              >
                <span>{group.town}</span>
                <span className="font-bold text-blue-600">({group.avgIntensity})</span>
                <span className="text-[9px] bg-slate-200 px-1 rounded-full text-slate-600 font-bold">
                  {group.reports.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 items-end">
          {/* AOR Zone */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">AOR Scope</label>
            <select
              value={aorFilter}
              onChange={(e) => setAorFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="All">All AORs (National Coverage)</option>
              <option value="CGP">CGP AOR (Northern Mindanao)</option>
              <option value="PCP">PCP AOR (Central Luzon)</option>
              <option value="BIP">BIP AOR (Eastern Mindanao)</option>
              <option value="Outside AOR">Outside Assigned AOR</option>
            </select>
          </div>

          {/* PEIS Intensity */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Felt Intensity</label>
            <select
              value={intensityFilter}
              onChange={(e) => setIntensityFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="All">All Intensities</option>
              <option value="V">Intensity V (Strong)</option>
              <option value="IV">Intensity IV (Moderately Strong)</option>
              <option value="III">Intensity III (Weak)</option>
              <option value="II">Intensity II (Slightly Felt)</option>
              <option value="I">Intensity I (Scarcely Perceptible)</option>
            </select>
          </div>

          {/* Review Status */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Promoted">In Consolidator</option>
              <option value="Excluded">Excluded (Noise)</option>
            </select>
          </div>

          {/* Search */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Comments</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search citizen name, text, town, keyword..."
                className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Reset button */}
          <div className="lg:col-span-1">
            <button
              type="button"
              onClick={handleClearFilters}
              className="w-full h-8 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Noise Toggle & Count status */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-900">
            <input
              type="checkbox"
              checked={hideNoise}
              onChange={(e) => setHideNoise(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Filter out social noise (generic prayers, reactions, memes)</span>
          </label>

          <span>
            Displaying <strong>{filteredComments.length}</strong> of{' '}
            <strong>{comments.filter((c) => c.postId === selectedPostId).length}</strong> harvested comments
          </span>
        </div>
      </div>

      {/* MAIN 3-PANE WORKSPACE:
          Pane 1: Authentic PHIVOLCS Social Media Post (Facebook / Twitter View)
          Pane 2: Comments Stream on Post with Real-Time Intensity Extraction
          Pane 3: Generated Intensity Reports Table & Consolidator Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* PANE 1: The Official PHIVOLCS Social Media Post Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Social Post Header */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {/* Official PHIVOLCS DOST Logo Badge */}
                <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-xs shadow-xs border-2 border-white ring-1 ring-blue-500">
                  PD
                </div>
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-900">
                    <span>DOST-PHIVOLCS</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black" title="Verified Official Page">
                      ✓
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>@PHIVOLCS-DOST</span>
                    <span>&bull;</span>
                    <Clock className="w-2.5 h-2.5" />
                    <span>{activePost.postDate}</span>
                  </div>
                </div>
              </div>

              {/* External Link Icons */}
              <div className="flex items-center gap-1.5">
                <a
                  href={activePost.facebookPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1877F2] flex items-center justify-center transition-colors text-xs font-bold"
                  title="View on Facebook"
                >
                  f
                </a>
                <a
                  href={activePost.twitterPostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-black flex items-center justify-center transition-colors text-xs font-bold"
                  title="View on X / Twitter"
                >
                  𝕏
                </a>
              </div>
            </div>

            {/* Official PHIVOLCS Earthquake Bulletin Graphic Card */}
            <div className="p-4 space-y-3 bg-slate-900 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="text-[10px] font-mono tracking-widest uppercase text-blue-400 font-bold">
                  DOST-PHIVOLCS SEISMIC BULLETIN
                </div>
                <div className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  OFFICIAL
                </div>
              </div>

              {/* Key Earthquake Parameters Box */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Magnitude:</span>
                  <span className="text-3xl font-black text-rose-400 tracking-tight">
                    M {activePost.magnitude.toFixed(1)}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-300">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span className="font-semibold text-white leading-tight">{activePost.epicenter}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400 font-mono">
                    <div>
                      Depth: <strong className="text-white font-sans">{activePost.depthKm} km</strong>
                    </div>
                    <div>
                      Origin: <strong className="text-white font-sans">{activePost.origin}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Citizen Reporting Directive */}
              <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-800/60 text-[11px] text-blue-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-300">
                  <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Report Shaking Intensity Below:</span>
                </div>
                <p className="text-[10px] text-blue-300/90 leading-relaxed">
                  Netizens who experienced this tremor are urged to reply with their <strong>Municipality/City</strong>, <strong>Province</strong>, and <strong>felt effects / Intensity</strong>.
                </p>
              </div>

              {/* Action Button: Harvest Citizen Intensity Comments on this Bulletin */}
              <button
                type="button"
                onClick={() => handleHarvestPostComments(activePost.id)}
                disabled={isHarvesting}
                className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer border border-blue-400/30"
                title="Harvest citizen comments for this official bulletin"
              >
                <Radio className={`w-3.5 h-3.5 ${isHarvesting ? 'animate-spin text-cyan-300' : 'text-cyan-300'}`} />
                <span>{isHarvesting ? 'Harvesting Comments (Port 443)...' : 'Harvest Comments on this Bulletin'}</span>
              </button>
            </div>

            {/* Post Caption / Text Body */}
            <div className="p-3.5 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-normal bg-white border-b border-slate-100">
              {activePost.captionText}
            </div>

            {/* Post Engagement Bar */}
            <div className="px-3.5 py-2.5 bg-slate-50 flex items-center justify-between text-xs text-slate-500 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  👍
                </span>
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] -ml-2">
                  ❤️
                </span>
                <span className="font-semibold text-slate-700 ml-1">{activePost.reactionsCount.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                <span>
                  <strong className="text-slate-800">{activePost.totalComments}</strong> comments
                </span>
                <span>
                  <strong className="text-slate-800">{activePost.sharesCount}</strong> shares
                </span>
              </div>
            </div>

            {/* Interactive Comment Simulator: Type a Citizen Comment on Post */}
            <div className="p-3.5 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Simulate Citizen Comment on this Post:</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSimulatedPlatform('Facebook')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      simulatedPlatform === 'Facebook' ? 'bg-[#1877F2] text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    FB
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedPlatform('X / Twitter')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      simulatedPlatform === 'X / Twitter' ? 'bg-black text-white' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    X
                  </button>
                </div>
              </div>

              <form onSubmit={handleSimulateAddComment} className="space-y-2">
                <textarea
                  value={simulatedCommentText}
                  onChange={(e) => setSimulatedCommentText(e.target.value)}
                  placeholder="e.g. 'Naramdaman dito sa Carmen, Cagayan de Oro City! Lumindol habang nagkape, Intensity IV to dito.'"
                  rows={2}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs"
                />

                {/* Quick Prompts for Testing */}
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSimulatedCommentText('Ramdam sa Tagoloan, Misamis Oriental! Umalog ang baso sa lamesa, Intensity IV.')
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                  >
                    + Tagoloan (CGP)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSimulatedCommentText('Felt in Carmen, CDO! Ceiling fan swayed noticeably, Intensity IV.')
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                  >
                    + Carmen CDO (CGP)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSimulatedCommentText('Slight shaking in Malaybalay Bukidnon, Intensity III.')
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                  >
                    + Malaybalay (CGP)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSimulatingExtraction || !simulatedCommentText.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSimulatingExtraction ? 'Parsing & Extracting...' : 'Post & Extract Intensity Report'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* PANE 2: Comments Stream on Post with Real-Time Intensity Extraction (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {/* Header Toolbar */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Comments Thread on Post
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {filteredComments.length} comments
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Click a comment to inspect or verify
            </div>
          </div>

          {/* Comments List Stream */}
          <div className="divide-y divide-slate-100 max-h-[720px] overflow-y-auto">
            {filteredComments.length === 0 ? (
              <div className="p-10 text-center text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No comments match the active filters.</p>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs text-blue-600 hover:underline font-semibold"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filteredComments.map((comment) => {
                const isSelected = comment.id === selectedCommentId;
                const peis = PEIS_COLORS[comment.extractedIntensity] || PEIS_COLORS.I;

                return (
                  <div
                    key={comment.id}
                    onClick={() => setSelectedCommentId(comment.id)}
                    className={`p-3.5 transition-all cursor-pointer border-l-4 ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-blue-600 shadow-xs'
                        : 'hover:bg-slate-50/90 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      {/* Left: Avatar + Author + Platform */}
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full ${comment.authorAvatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                        >
                          {comment.authorName.slice(0, 1)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {comment.authorName}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {comment.authorHandle}
                            </span>

                            {comment.platform === 'Facebook' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#1877F2]/10 text-[#1877F2]">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[7px]">
                                  f
                                </span>
                                FB
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-900/10 text-slate-900">
                                <span className="w-2.5 h-2.5 rounded bg-black text-white flex items-center justify-center text-[7px]">
                                  𝕏
                                </span>
                                X
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {comment.commentTime}
                            </span>
                          </div>

                          {/* Raw comment speech bubble */}
                          <div className="mt-1.5 text-xs text-slate-800 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            &ldquo;{comment.rawCommentText}&rdquo;
                          </div>

                          {/* Real-time Extracted Intensity Report Badge Card */}
                          <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Extracted Intensity Report:
                                </span>
                              </div>

                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {comment.confidenceScore}% NLP Match
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              {/* Extracted PEIS Intensity */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-xs border ${peis.bg} ${peis.text} ${peis.border}`}
                              >
                                <span>PEIS {comment.extractedIntensity}</span>
                                <span className="text-[10px] font-medium opacity-85">({peis.desc})</span>
                              </span>

                              {/* Extracted Town */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                <span>{comment.extractedTown}, {comment.extractedProvince}</span>
                              </span>

                              {/* AOR Badge */}
                              {comment.aor !== 'Outside AOR' && (
                                <span
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                    comment.aor === 'CGP'
                                      ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {comment.aor} AOR
                                </span>
                              )}
                            </div>

                            {/* Detected Keyword Clues */}
                            <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 pt-0.5">
                              {comment.extractedKeywords.map((kw, i) => (
                                <span key={i} className="bg-slate-200/60 px-1.5 py-0.2 rounded text-slate-700">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Status Badge & Quick Action */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {comment.status === 'Verified' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {comment.status === 'Pending Review' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Pending Review
                          </span>
                        )}
                        {comment.status === 'Promoted' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            In Consolidator
                          </span>
                        )}
                        {comment.status === 'Excluded' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Excluded (Noise)
                          </span>
                        )}

                        {!comment.promotedToConsolidator && !comment.isNoiseOrSpam && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePromoteToConsolidator(comment.id);
                            }}
                            className="mt-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-colors shadow-2xs"
                            title="Promote this report into the official municipal Intensity Consolidator table"
                          >
                            + Consolidate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PANE 3: Extracted Intensity Reports & Duty Seismologist Verifier (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Extracted Reports
              </span>
              <span className="text-xl font-black text-blue-600 mt-0.5 block">
                {stats.validReportsCount}
              </span>
              <span className="text-[10px] text-slate-500">
                {stats.verifiedCount} verified
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Highest Intensity
              </span>
              <span className="text-xl font-black text-rose-600 mt-0.5 block">
                {activePost.highestIntensity}
              </span>
              <span className="text-[10px] text-slate-500">
                {stats.uniqueTownsCount} LGUs mapped
              </span>
            </div>
          </div>

          {/* Generated Intensity Reports by Municipality (Consensus Table) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Reports by Municipality
                </h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {stats.townGroupsList.length} towns
              </span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {stats.townGroupsList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No reports for this post.</p>
              ) : (
                stats.townGroupsList.map((group) => {
                  const peis = PEIS_COLORS[group.avgIntensity as PEISLevel] || PEIS_COLORS.I;
                  return (
                    <div
                      key={group.town}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-200 text-xs transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{group.town}</span>
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${peis.bg} ${peis.text} border ${peis.border}`}>
                          PEIS {group.avgIntensity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{group.province}</span>
                        <span className="font-semibold text-slate-700">
                          {group.reports.length} {group.reports.length === 1 ? 'comment' : 'comments'}
                        </span>
                      </div>

                      {group.aor !== 'Outside AOR' && (
                        <div className="text-[10px] font-bold text-cyan-700 pt-0.5">
                          ✓ {group.aor} Station AOR
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {onNavigateToConsolidator && (
              <button
                type="button"
                onClick={onNavigateToConsolidator}
                className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open in Intensity Consolidator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Duty Seismologist Comment Inspector Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Comment Inspector
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-bold">
                {selectedComment?.id || '—'}
              </span>
            </div>

            {selectedComment ? (
              <div className="space-y-3 text-xs">
                {/* Author & Raw Text */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{selectedComment.authorName}</span>
                    <span className="text-slate-400 font-mono">{selectedComment.platform}</span>
                  </div>
                  <p className="text-slate-700 italic text-xs leading-relaxed">
                    &ldquo;{selectedComment.rawCommentText}&rdquo;
                  </p>
                </div>

                {/* Edit Locality */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Municipality / City:
                    </label>
                    <input
                      type="text"
                      value={editTown}
                      onChange={(e) => setEditTown(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Province:
                    </label>
                    <input
                      type="text"
                      value={editProvince}
                      onChange={(e) => setEditProvince(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Edit PEIS Intensity */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    PEIS Intensity Grade:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] as PEISLevel[]).map((lvl) => {
                      const cfg = PEIS_COLORS[lvl];
                      const isLvl = editIntensity === lvl;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setEditIntensity(lvl)}
                          className={`py-1 rounded text-xs font-bold border transition-all text-center ${
                            isLvl
                              ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-blue-500 shadow-xs font-black`
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Validation Status */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Verification Status:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditStatus('Verified')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                        editStatus === 'Verified'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStatus('Pending Review')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                        editStatus === 'Pending Review'
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Pending</span>
                    </button>
                  </div>
                </div>

                {/* Save and Promote Action */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <button
                    type="button"
                    onClick={handleSaveInspection}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePromoteToConsolidator(selectedComment.id)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Promote to Consolidator</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Select a comment to inspect.</p>
            )}
          </div>
        </div>
      </div>

      {/* DOST-PHIVOLCS Social Media Intensity Harvester Modal */}
      {isHarvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Radio className="w-5 h-5 text-cyan-200" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>DOST-PHIVOLCS Social Media Intensity Harvester</span>
                    <span className="text-[9px] font-mono bg-blue-900 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-blue-700">
                      PORT 443 HTTPS
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Realistically extract earthquake bulletin posts and citizen felt intensity replies for review
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isHarvesting) setIsHarvestModalOpen(false);
                }}
                disabled={isHarvesting}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Step 1: Target PHIVOLCS Post Selection */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  1. SELECT OFFICIAL PHIVOLCS EARTHQUAKE BULLETIN POST
                </label>
                <select
                  value={harvestTargetPostId || selectedPostId}
                  onChange={(e) => setHarvestTargetPostId(e.target.value)}
                  disabled={isHarvesting}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                >
                  {allSocialPosts.map((post) => (
                    <option key={post.id} value={post.id}>
                      {post.eqInfoReference || 'Alert'} &bull; M{post.magnitude.toFixed(1)} - {post.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Or Paste Custom PHIVOLCS URL */}
              <div className="pt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  OR PASTE DIRECT PHIVOLCS FACEBOOK / TWITTER POST URL:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customPostUrlInput}
                    onChange={(e) => setCustomPostUrlInput(e.target.value)}
                    disabled={isHarvesting}
                    placeholder="https://facebook.com/PHIVOLCS-DOST/posts/earthquake-info-no-1 or https://x.com/phivolcs_dost/status/..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customPostUrlInput.trim()) {
                        showToast('Please enter a valid PHIVOLCS social media URL.');
                        return;
                      }
                      showToast('Custom PHIVOLCS post URL mapped.');
                    }}
                    disabled={isHarvesting}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition-colors"
                  >
                    Set URL
                  </button>
                </div>
              </div>

              {/* Target Post Quick Summary Card */}
              {(() => {
                const targetPost =
                  allSocialPosts.find((p) => p.id === (harvestTargetPostId || selectedPostId)) || activePost;
                return (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white space-y-2 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">
                          Target: {targetPost.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        M {targetPost.magnitude.toFixed(1)} &bull; Depth {targetPost.depthKm}km
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center justify-between">
                      <span className="truncate">Epicenter: {targetPost.epicenter}</span>
                      <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                        {targetPost.postDate}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Extraction Architecture Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                  <Globe className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                  <div className="font-bold text-[11px]">HTTPS Port 443</div>
                  <div className="text-[10px] text-blue-700">Cloud Run compliant</div>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900">
                  <Cpu className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                  <div className="font-bold text-[11px]">NLP Intensity AI</div>
                  <div className="text-[10px] text-purple-700">Taglish/Cebuano/PEIS</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <div className="font-bold text-[11px]">PSGC Geocoding</div>
                  <div className="text-[10px] text-emerald-700">Barangay &amp; Town match</div>
                </div>
              </div>

              {/* Progress Console (Visible during or after harvesting) */}
              {(isHarvesting || harvestLogs.length > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">Live Harvesting Pipeline:</span>
                    <span className="font-mono text-blue-600 font-bold">
                      Step {harvestProgressStep} of 4
                    </span>
                  </div>

                  {/* 4-Step Progress Bar */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      '1. Port 443 Auth',
                      '2. Bulletin Scrape',
                      '3. Comments Stream',
                      '4. NLP & PSGC Match',
                    ].map((stepLabel, idx) => {
                      const isDone = harvestProgressStep > idx + 1;
                      const isCurrent = harvestProgressStep === idx + 1;
                      return (
                        <div
                          key={stepLabel}
                          className={`p-1.5 rounded-lg text-center text-[10px] font-bold border transition-colors ${
                            isDone
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : isCurrent
                              ? 'bg-blue-100 border-blue-400 text-blue-900 animate-pulse'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          {stepLabel}
                        </div>
                      );
                    })}
                  </div>

                  {/* Console Log Terminal */}
                  <div className="p-3 bg-slate-950 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1 max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
                    {harvestLogs.map((log, i) => (
                      <div key={i} className="leading-tight">
                        <span className="text-slate-500 mr-1">&gt;</span>
                        <span>{log}</span>
                      </div>
                    ))}
                    {isHarvesting && (
                      <div className="flex items-center gap-1.5 text-cyan-300 animate-pulse pt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        <span>Extracting citizen comments over Port 443...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Official DOST-PHIVOLCS Facebook &amp; @phivolcs_dost
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsHarvestModalOpen(false)}
                  disabled={isHarvesting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => handleHarvestPostComments(harvestTargetPostId || selectedPostId)}
                  disabled={isHarvesting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
                >
                  <Radio className={`w-3.5 h-3.5 text-cyan-200 ${isHarvesting ? 'animate-spin' : ''}`} />
                  <span>
                    {isHarvesting ? 'Harvesting in Progress...' : 'Start Realistic Harvesting'}
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
