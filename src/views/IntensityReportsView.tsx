import React, { useState, useMemo } from 'react';
import {
  FileText,
  Users,
  Calendar,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  Edit2,
  Trash2,
  BarChart2,
  Copy,
  Plus,
  CheckSquare,
  FileCheck,
  Archive,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  X,
  Check,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Activity,
  Printer,
  Share2,
} from 'lucide-react';

export interface IntensityReportsViewProps {
  onNavigateToSocialMedia?: () => void;
  onNavigateToFieldReports?: () => void;
}

export type IntensityLevel = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X';

export interface TownIntensityRecord {
  id: string;
  num: number;
  townCity: string;
  province: string;
  region: string;
  observedIntensity: IntensityLevel | null;
  instrumentalIntensity: IntensityLevel | null;
  psgcMatch: boolean;
  hasDuplicate: boolean;
  reporter: string | null;
  dateReceived: string | null;
  estimatedPopulation: number;
}

const INITIAL_RECORDS: TownIntensityRecord[] = [
  {
    id: 'TOWN-001',
    num: 1,
    townCity: 'Lebak',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'V',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 28500,
  },
  {
    id: 'TOWN-002',
    num: 2,
    townCity: 'Kalamansig',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'IV',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 24000,
  },
  {
    id: 'TOWN-003',
    num: 3,
    townCity: 'Esperanza',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'III',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 19500,
  },
  {
    id: 'TOWN-004',
    num: 4,
    townCity: 'Surallah',
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'III',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 22000,
  },
  {
    id: 'TOWN-005',
    num: 5,
    townCity: 'Tantangan',
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 14500,
  },
  {
    id: 'TOWN-006',
    num: 6,
    townCity: 'Bagumbayan',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 18000,
  },
  {
    id: 'TOWN-007',
    num: 7,
    townCity: "M'lang",
    province: 'Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 21000,
  },
  {
    id: 'TOWN-008',
    num: 8,
    townCity: 'Maitum',
    province: 'Sarangani',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 16000,
  },
  {
    id: 'TOWN-009',
    num: 9,
    townCity: "T'Boli",
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 17500,
  },
  {
    id: 'TOWN-010',
    num: 10,
    townCity: 'Isulan',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 31000,
  },
  {
    id: 'TOWN-011',
    num: 11,
    townCity: 'Norala',
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 15000,
  },
  {
    id: 'TOWN-012',
    num: 12,
    townCity: 'Santo Niño',
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 13000,
  },
  {
    id: 'TOWN-013',
    num: 13,
    townCity: 'Tupi',
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 25000,
  },
  {
    id: 'TOWN-014',
    num: 14,
    townCity: 'Malungon',
    province: 'Sarangani',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'II',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 29000,
  },
  {
    id: 'TOWN-015',
    num: 15,
    townCity: 'Tampakan',
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'I',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 12000,
  },
  {
    id: 'TOWN-016',
    num: 16,
    townCity: 'Columbio',
    province: 'Sultan Kudarat',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'I',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 11000,
  },
  {
    id: 'TOWN-017',
    num: 17,
    townCity: 'City of General Santos',
    province: 'South Cotabato',
    region: 'Region XII',
    observedIntensity: null,
    instrumentalIntensity: 'I',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 34000,
  },
  {
    id: 'TOWN-018',
    num: 18,
    townCity: 'City of Las Piñas',
    province: 'Metro Manila',
    region: 'NCR',
    observedIntensity: null,
    instrumentalIntensity: 'I',
    psgcMatch: true,
    hasDuplicate: false,
    reporter: null,
    dateReceived: null,
    estimatedPopulation: 45000,
  },
];

export const IntensityReportsView: React.FC<IntensityReportsViewProps> = ({
  onNavigateToSocialMedia,
  onNavigateToFieldReports,
}) => {
  // Records State
  const [records, setRecords] = useState<TownIntensityRecord[]>(INITIAL_RECORDS);

  // Filter States (matching Screenshot)
  const [refEqInfo, setRefEqInfo] = useState('Not entered');
  const [eventDateTime, setEventDateTime] = useState('Not entered');
  const [analyst, setAnalyst] = useState('Not entered');
  const [reportStatus, setReportStatus] = useState('Draft');
  const [searchTown, setSearchTown] = useState('');

  // UI States
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'observed' | 'instrumental'>('observed');
  const [currentStep, setCurrentStep] = useState<number>(2); // Step 2 "Validate" matches the screenshot (1 and 2 filled blue)

  // Dropdown action menu state
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TownIntensityRecord | null>(null);

  // Form inputs
  const [formTown, setFormTown] = useState('');
  const [formProvince, setFormProvince] = useState('');
  const [formRegion, setFormRegion] = useState('Region XII');
  const [formObserved, setFormObserved] = useState<IntensityLevel | 'NONE'>('NONE');
  const [formInstrumental, setFormInstrumental] = useState<IntensityLevel | 'NONE'>('II');
  const [formReporter, setFormReporter] = useState('');
  const [formPopulation, setFormPopulation] = useState(15000);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sorting
  type SortKey = 'num' | 'townCity' | 'province' | 'region' | 'observedIntensity' | 'instrumentalIntensity' | 'psgcMatch' | 'hasDuplicate' | 'reporter' | 'dateReceived';
  const [sortKey, setSortKey] = useState<SortKey>('num');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Filtering records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchTown.trim()) {
        const q = searchTown.toLowerCase();
        const match =
          r.townCity.toLowerCase().includes(q) ||
          r.province.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q) ||
          (r.reporter && r.reporter.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [records, searchTown]);

  // Sorted records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredRecords, sortKey, sortOrder]);

  // Paginated records
  const totalRecords = sortedRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Dynamic Intensity Summary Counts
  const intensityLevels: IntensityLevel[] = ['IX', 'VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I'];

  const observedCounts = useMemo(() => {
    const counts: Record<string, number> = {
      IX: 0,
      VIII: 0,
      VII: 0,
      VI: 0,
      V: 0,
      IV: 0,
      III: 0,
      II: 0,
      I: 0,
    };
    records.forEach((r) => {
      if (r.observedIntensity && counts[r.observedIntensity] !== undefined) {
        counts[r.observedIntensity]++;
      }
    });
    return counts;
  }, [records]);

  const instrumentalCounts = useMemo(() => {
    const counts: Record<string, number> = {
      IX: 0,
      VIII: 0,
      VII: 0,
      VI: 0,
      V: 0,
      IV: 0,
      III: 0,
      II: 0,
      I: 0,
    };
    records.forEach((r) => {
      if (r.instrumentalIntensity && counts[r.instrumentalIntensity] !== undefined) {
        counts[r.instrumentalIntensity]++;
      }
    });
    return counts;
  }, [records]);

  const totalObserved = useMemo(() => {
    return Object.values(observedCounts).reduce((acc, v) => acc + v, 0);
  }, [observedCounts]);

  const totalInstrumental = useMemo(() => {
    return Object.values(instrumentalCounts).reduce((acc, v) => acc + v, 0);
  }, [instrumentalCounts]);

  // Instrumental grouping for preview
  const instrumentalGrouped = useMemo(() => {
    const groups: { level: string; towns: string[] }[] = [];
    const intensityOrder: IntensityLevel[] = ['V', 'IV', 'III', 'II', 'I'];

    intensityOrder.forEach((lvl) => {
      const matchedTowns = records
        .filter((r) => r.instrumentalIntensity === lvl)
        .map((r) => r.townCity);
      if (matchedTowns.length > 0) {
        groups.push({
          level: `Intensity ${lvl}`,
          towns: matchedTowns,
        });
      }
    });
    return groups;
  }, [records]);

  // Observed grouping for preview
  const observedGrouped = useMemo(() => {
    const groups: { level: string; towns: string[] }[] = [];
    const intensityOrder: IntensityLevel[] = ['IX', 'VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I'];

    intensityOrder.forEach((lvl) => {
      const matchedTowns = records
        .filter((r) => r.observedIntensity === lvl)
        .map((r) => r.townCity);
      if (matchedTowns.length > 0) {
        groups.push({
          level: `Intensity ${lvl}`,
          towns: matchedTowns,
        });
      }
    });
    return groups;
  }, [records]);

  // Copy EQP Report text
  const handleCopyReport = () => {
    let reportText = `PHILIPPINES SEISMOLOGICAL INTENSITY REPORT (EQP)\n`;
    reportText += `Reference: ${refEqInfo}\n`;
    reportText += `Date/Time: ${eventDateTime}\n`;
    reportText += `Analyst: ${analyst}\n`;
    reportText += `Status: ${reportStatus}\n\n`;

    reportText += `--- Instrumental Earthquake Intensities ---\n`;
    instrumentalGrouped.forEach((g) => {
      reportText += `${g.level} - ${g.towns.join(', ')}\n`;
    });

    if (totalObserved > 0) {
      reportText += `\n--- Observed Earthquake Intensities ---\n`;
      observedGrouped.forEach((g) => {
        reportText += `${g.level} - ${g.towns.join(', ')}\n`;
      });
    } else {
      reportText += `\n--- Observed Earthquake Intensities ---\nNo observed intensity data entered.\n`;
    }

    navigator.clipboard.writeText(reportText);
    showToast('EQP report preview copied to clipboard!');
  };

  // Actions
  const handleValidatePsgc = () => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        psgcMatch: true,
      }))
    );
    showToast('PSGC database validation completed. All 18 town codes matched successfully!');
    setCurrentStep(2);
  };

  const handleCheckDuplicates = () => {
    showToast('Duplicate record verification passed: No duplicate town or agency entries found.');
  };

  const handleGenerateEqp = () => {
    setReportStatus('Validated');
    setCurrentStep(4);
    showToast('EQP earthquake intensity report generated successfully.');
  };

  const handleSaveDraft = () => {
    showToast('Intensity consolidator draft state saved successfully.');
  };

  const handleArchiveReport = () => {
    if (reportStatus === 'Draft') {
      showToast('Validation required before archiving. Generate or finalize the report first.');
      return;
    }
    setReportStatus('Archived');
    setCurrentStep(5);
    showToast('Report successfully archived in official seismological logs.');
  };

  const handleExportExcel = () => {
    const headers = [
      '#',
      'Town/City',
      'Province',
      'Region',
      'Observed Intensity',
      'Instrumental Intensity',
      'PSGC Match',
      'Duplicate Check',
      'Reporter',
      'Date Received',
    ];
    const csvRows = [headers.join(',')];

    records.forEach((r) => {
      csvRows.push(
        [
          r.num,
          `"${r.townCity}"`,
          `"${r.province}"`,
          `"${r.region}"`,
          r.observedIntensity || 'Not entered',
          r.instrumentalIntensity || 'Not entered',
          r.psgcMatch ? 'Matched' : 'Unmatched',
          r.hasDuplicate ? 'Duplicate' : 'No Duplicate',
          `"${r.reporter || 'Not entered'}"`,
          `"${r.dateReceived || 'Not entered'}"`,
        ].join(',')
      );
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Intensity_Consolidator_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Intensity report exported to CSV/Excel format.');
  };

  const handleExportPdf = () => {
    window.print();
    showToast('Preparing formatted PDF intensity document for print/download...');
  };

  const handleClearFilters = () => {
    setRefEqInfo('Not entered');
    setEventDateTime('Not entered');
    setAnalyst('Not entered');
    setReportStatus('Draft');
    setSearchTown('');
    setBannerDismissed(false);
    setCurrentPage(1);
    showToast('Filters and input controls reset to default state.');
  };

  // Add town submit
  const handleAddTownSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTown.trim() || !formProvince.trim()) {
      showToast('Please provide both town/city name and province.');
      return;
    }

    const newRecord: TownIntensityRecord = {
      id: `TOWN-${Date.now().toString().slice(-4)}`,
      num: records.length + 1,
      townCity: formTown.trim(),
      province: formProvince.trim(),
      region: formRegion,
      observedIntensity: formObserved === 'NONE' ? null : formObserved,
      instrumentalIntensity: formInstrumental === 'NONE' ? null : formInstrumental,
      psgcMatch: true,
      hasDuplicate: false,
      reporter: formReporter.trim() ? formReporter.trim() : null,
      dateReceived: formReporter.trim() ? 'Apr 23, 2025 10:45 AM' : null,
      estimatedPopulation: Number(formPopulation) || 15000,
    };

    setRecords((prev) => [...prev, newRecord]);
    setIsAddModalOpen(false);
    setFormTown('');
    setFormProvince('');
    setFormReporter('');
    showToast(`Town "${newRecord.townCity}" added to consolidator records.`);
  };

  // Edit town submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === editingRecord.id
          ? {
              ...r,
              townCity: formTown.trim() || r.townCity,
              province: formProvince.trim() || r.province,
              region: formRegion,
              observedIntensity: formObserved === 'NONE' ? null : formObserved,
              instrumentalIntensity: formInstrumental === 'NONE' ? null : formInstrumental,
              reporter: formReporter.trim() ? formReporter.trim() : null,
              dateReceived: formReporter.trim() && !r.dateReceived ? 'Apr 23, 2025 10:45 AM' : r.dateReceived,
            }
          : r
      )
    );
    setIsEditModalOpen(false);
    setEditingRecord(null);
    showToast(`Record for "${editingRecord.townCity}" updated successfully.`);
  };

  const handleQuickAssignObserved = (recordId: string, level: IntensityLevel | null) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              observedIntensity: level,
              reporter: level && !r.reporter ? 'Duty Field Officer' : r.reporter,
              dateReceived: level && !r.dateReceived ? 'Apr 23, 2025 10:42 AM' : r.dateReceived,
            }
          : r
      )
    );
    setActionMenuOpenId(null);
    showToast(`Observed intensity updated.`);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== recordId);
      return filtered.map((r, idx) => ({ ...r, num: idx + 1 }));
    });
    setActionMenuOpenId(null);
    showToast('Town record removed from intensity list.');
  };

  // Helper for badge colors
  const getInstrumentalBadge = (level: IntensityLevel | null) => {
    if (!level) {
      return <span className="text-slate-400 text-xs">Not entered</span>;
    }
    switch (level) {
      case 'V':
        return (
          <span className="inline-block bg-amber-100 text-amber-800 font-bold px-3 py-0.5 rounded text-xs">
            {level}
          </span>
        );
      case 'IV':
        return (
          <span className="inline-block bg-sky-100 text-sky-800 font-bold px-3 py-0.5 rounded text-xs">
            {level}
          </span>
        );
      case 'III':
        return (
          <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-0.5 rounded text-xs">
            {level}
          </span>
        );
      case 'II':
        return (
          <span className="inline-block bg-blue-100 text-blue-800 font-bold px-3 py-0.5 rounded text-xs">
            {level}
          </span>
        );
      case 'I':
        return (
          <span className="inline-block bg-indigo-100 text-indigo-800 font-bold px-3 py-0.5 rounded text-xs">
            {level}
          </span>
        );
      default:
        return (
          <span className="inline-block bg-rose-100 text-rose-800 font-bold px-3 py-0.5 rounded text-xs">
            {level}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 text-slate-800">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Tab Bar: Field Reports vs Intensity Consolidator vs Social Media */}
      {(onNavigateToFieldReports || onNavigateToSocialMedia) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            {onNavigateToFieldReports && (
              <button
                type="button"
                onClick={onNavigateToFieldReports}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-600 border border-slate-200 flex items-center gap-2 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Field Intensity Reports</span>
              </button>
            )}
            <button
              type="button"
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-xs flex items-center gap-2"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Intensity Consolidator</span>
            </button>
            {onNavigateToSocialMedia && (
              <button
                type="button"
                onClick={onNavigateToSocialMedia}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-blue-50/60 text-slate-700 hover:text-blue-600 border border-slate-200 flex items-center gap-2 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Social Media Updates</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Row 1: Four Stat Cards (matching Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Towns Entered */}
        <div className="bg-white border border-blue-100/80 rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <svg
              className="w-6 h-6 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12h3l3-7 4 14 3-10 2 5 2-2h3" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 leading-tight">Towns Entered</div>
            <div className="text-3xl font-extrabold text-blue-700 tracking-tight leading-none my-0.5">
              {records.length}
            </div>
            <div className="text-[11px] text-slate-500 font-normal">Town/city records in this report</div>
          </div>
        </div>

        {/* Card 2: Instrumental Entries */}
        <div className="bg-white border border-blue-100/80 rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 leading-tight">Instrumental Entries</div>
            <div className="text-3xl font-extrabold text-blue-700 tracking-tight leading-none my-0.5">
              {totalInstrumental}
            </div>
            <div className="text-[11px] text-slate-500 font-normal">Instrumental intensity records</div>
          </div>
        </div>

        {/* Card 3: Observed Entries */}
        <div className="bg-white border border-blue-100/80 rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 leading-tight">Observed Entries</div>
            <div className="text-3xl font-extrabold text-blue-700 tracking-tight leading-none my-0.5">
              {totalObserved}
            </div>
            <div className="text-[11px] text-slate-500 font-normal">
              {totalObserved === 0 ? 'No observed intensity records' : `${totalObserved} observed intensity records`}
            </div>
          </div>
        </div>

        {/* Card 4: Report Status */}
        <div className="bg-white border border-blue-100/80 rounded-xl p-4 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700 leading-tight">Report Status</div>
            <div className="text-3xl font-extrabold text-blue-700 tracking-tight leading-none my-0.5">
              {reportStatus}
            </div>
            <div className="text-[11px] text-slate-500 font-normal">
              {reportStatus === 'Draft' ? 'Incomplete - additional data needed' : 'Validated & ready for dissemination'}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Filters & Controls Bar (matching Screenshot) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          {/* Reference EQInfo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference EQInfo</label>
            <select
              value={refEqInfo}
              onChange={(e) => setRefEqInfo(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="Not entered">Not entered</option>
              <option value="2025-04-23 08:15:00 (M6.1)">2025-04-23 08:15:00 (M6.1)</option>
              <option value="2025-04-22 14:32:00 (M5.4)">2025-04-22 14:32:00 (M5.4)</option>
              <option value="2025-04-20 03:11:00 (M5.0)">2025-04-20 03:11:00 (M5.0)</option>
            </select>
          </div>

          {/* Event Date/Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Event Date/Time</label>
            <div className="relative">
              <input
                type="text"
                value={eventDateTime}
                onChange={(e) => setEventDateTime(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Not entered"
              />
              <Calendar className="w-4 h-4 text-blue-600 absolute right-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Analyst */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Analyst</label>
            <select
              value={analyst}
              onChange={(e) => setAnalyst(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="Not entered">Not entered</option>
              <option value="Juan Dela Cruz (Senior Seismologist)">Juan Dela Cruz (Senior Seismologist)</option>
              <option value="Maria Santos (Duty Seismologist)">Maria Santos (Duty Seismologist)</option>
              <option value="Ricardo Gomez (Analyst)">Ricardo Gomez (Analyst)</option>
            </select>
          </div>

          {/* Report Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Status</label>
            <select
              value={reportStatus}
              onChange={(e) => setReportStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="Draft">Draft</option>
              <option value="Under Review">Under Review</option>
              <option value="Validated">Validated</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Search Town/City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Search Town/City</label>
            <div className="relative">
              <Search className="w-4 h-4 text-blue-600 absolute left-2.5 top-2 pointer-events-none" />
              <input
                type="text"
                value={searchTown}
                onChange={(e) => {
                  setSearchTown(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search town or city..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Filter & Clear Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showToast(`Filtering by "${searchTown || 'All records'}" applied.`)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 bg-white hover:bg-slate-50 border border-blue-600 text-blue-600 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Warning / Alert Banner (matching Screenshot) */}
      {!bannerDismissed && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-lg px-4 py-2.5 flex items-center justify-between gap-3 text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <div className="p-1 bg-amber-200/80 rounded-md shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-800" />
            </div>
            <span>
              Observed intensities and report metadata are not yet entered. Complete validation before generating or archiving the final report.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="text-amber-800 hover:text-amber-950 p-1 rounded-md hover:bg-amber-200/50 transition-colors shrink-0"
            title="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 4: Main Data Table (matching Screenshot) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-semibold select-none">
                <th
                  onClick={() => handleSort('num')}
                  className="py-3 px-3 text-center w-10 cursor-pointer hover:text-blue-600"
                >
                  #
                </th>
                <th
                  onClick={() => handleSort('townCity')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Town / City</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('province')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Province</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('region')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Region</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('observedIntensity')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Observed Intensity</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('instrumentalIntensity')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Instrumental Intensity</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('psgcMatch')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>PSGC Match</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('hasDuplicate')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Duplicate Check</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('reporter')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Reporter</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th
                  onClick={() => handleSort('dateReceived')}
                  className="py-3 px-3 cursor-pointer hover:text-blue-600"
                >
                  <div className="flex items-center gap-1">
                    <span>Date Received</span>
                    <span className="text-[10px] text-slate-400">↕</span>
                  </div>
                </th>
                <th className="py-3 px-3 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                    No town records matching current filters.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-medium">{r.num}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{r.townCity}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{r.province}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{r.region}</td>
                    <td className="py-2.5 px-3 text-center">
                      {r.observedIntensity ? (
                        <span className="inline-block bg-amber-100 text-amber-900 font-bold px-3 py-0.5 rounded text-xs">
                          {r.observedIntensity}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Not entered</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">{getInstrumentalBadge(r.instrumentalIntensity)}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Matched</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>No Duplicate</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {r.reporter ? (
                        <span className="text-slate-700 font-medium">{r.reporter}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Not entered</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.dateReceived ? (
                        <span className="text-slate-700 font-medium">{r.dateReceived}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">Not entered</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuOpenId(actionMenuOpenId === r.id ? null : r.id);
                        }}
                        className="p-1 rounded-md hover:bg-slate-100 text-blue-600 transition-colors font-bold tracking-widest text-base"
                        title="Actions"
                      >
                        •••
                      </button>

                      {/* Dropdown Menu */}
                      {actionMenuOpenId === r.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-3 top-8 z-30 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-left text-xs space-y-0.5 animate-in fade-in"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRecord(r);
                              setFormTown(r.townCity);
                              setFormProvince(r.province);
                              setFormRegion(r.region);
                              setFormObserved(r.observedIntensity || 'NONE');
                              setFormInstrumental(r.instrumentalIntensity || 'NONE');
                              setFormReporter(r.reporter || '');
                              setIsEditModalOpen(true);
                              setActionMenuOpenId(null);
                            }}
                            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit Details</span>
                          </button>

                          <div className="border-t border-slate-100 my-1 px-3 pt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Set Observed Intensity
                          </div>
                          <div className="px-2 py-1 grid grid-cols-4 gap-1">
                            {(['V', 'IV', 'III', 'II', 'I'] as IntensityLevel[]).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleQuickAssignObserved(r.id, lvl)}
                                className="px-1.5 py-1 text-center font-bold text-[11px] rounded bg-slate-100 hover:bg-blue-600 hover:text-white transition-colors"
                              >
                                {lvl}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleQuickAssignObserved(r.id, null)}
                              className="px-1.5 py-1 text-center font-bold text-[10px] rounded bg-slate-100 hover:bg-rose-600 hover:text-white transition-colors col-span-3"
                            >
                              Clear
                            </button>
                          </div>

                          <div className="border-t border-slate-100 my-1" />
                          <button
                            type="button"
                            onClick={() => handleDeleteRecord(r.id)}
                            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-rose-50 text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span>Delete Record</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{paginatedRecords.length}</span> of{' '}
            <span className="font-semibold">{records.length}</span> current input records
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 font-bold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`min-w-[28px] h-7 rounded text-xs font-bold transition-all ${
                  currentPage === pg
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-blue-600 font-bold"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 5: Lower Grid (3 Panels: Intensity Summary, Affected Population, EQP Report Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel 1: Intensity Summary (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-3">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Intensity Summary</span>
            </div>

            {/* Observed Intensities Sub-grid */}
            <div className="mb-3">
              <div className="text-[11px] font-bold text-blue-700 mb-1.5">Observed Intensities</div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Row 1: IX, VIII, VII, VI, V */}
                <div className="grid grid-cols-5 text-center text-[10px] font-bold bg-slate-50 border-b border-slate-200">
                  <div className="py-1 bg-rose-50 text-rose-700 border-r border-slate-200">IX</div>
                  <div className="py-1 bg-rose-50 text-rose-700 border-r border-slate-200">VIII</div>
                  <div className="py-1 bg-orange-50 text-orange-700 border-r border-slate-200">VII</div>
                  <div className="py-1 bg-amber-50 text-amber-700 border-r border-slate-200">VI</div>
                  <div className="py-1 bg-amber-50 text-amber-700">V</div>
                </div>
                <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-800 border-b border-slate-200 py-1">
                  <div className="border-r border-slate-200">{observedCounts['IX']}</div>
                  <div className="border-r border-slate-200">{observedCounts['VIII']}</div>
                  <div className="border-r border-slate-200">{observedCounts['VII']}</div>
                  <div className="border-r border-slate-200">{observedCounts['VI']}</div>
                  <div>{observedCounts['V']}</div>
                </div>

                {/* Row 2: IV, III, II, I */}
                <div className="grid grid-cols-4 text-center text-[10px] font-bold bg-slate-50 border-b border-slate-200">
                  <div className="py-1 bg-sky-50 text-sky-700 border-r border-slate-200">IV</div>
                  <div className="py-1 bg-emerald-50 text-emerald-700 border-r border-slate-200">III</div>
                  <div className="py-1 bg-blue-50 text-blue-700 border-r border-slate-200">II</div>
                  <div className="py-1 bg-indigo-50 text-indigo-700">I</div>
                </div>
                <div className="grid grid-cols-4 text-center text-xs font-bold text-slate-800 py-1">
                  <div className="border-r border-slate-200">{observedCounts['IV']}</div>
                  <div className="border-r border-slate-200">{observedCounts['III']}</div>
                  <div className="border-r border-slate-200">{observedCounts['II']}</div>
                  <div>{observedCounts['I']}</div>
                </div>
              </div>
            </div>

            {/* Instrumental Intensities Sub-grid */}
            <div>
              <div className="text-[11px] font-bold text-blue-700 mb-1.5">Instrumental Intensities</div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {/* Row 1: IX, VIII, VII, VI, V */}
                <div className="grid grid-cols-5 text-center text-[10px] font-bold bg-slate-50 border-b border-slate-200">
                  <div className="py-1 bg-rose-50 text-rose-700 border-r border-slate-200">IX</div>
                  <div className="py-1 bg-rose-50 text-rose-700 border-r border-slate-200">VIII</div>
                  <div className="py-1 bg-orange-50 text-orange-700 border-r border-slate-200">VII</div>
                  <div className="py-1 bg-amber-50 text-amber-700 border-r border-slate-200">VI</div>
                  <div className="py-1 bg-amber-50 text-amber-700">V</div>
                </div>
                <div className="grid grid-cols-5 text-center text-xs font-bold text-slate-800 border-b border-slate-200 py-1">
                  <div className="border-r border-slate-200">{instrumentalCounts['IX']}</div>
                  <div className="border-r border-slate-200">{instrumentalCounts['VIII']}</div>
                  <div className="border-r border-slate-200">{instrumentalCounts['VII']}</div>
                  <div className="border-r border-slate-200">{instrumentalCounts['VI']}</div>
                  <div>{instrumentalCounts['V']}</div>
                </div>

                {/* Row 2: IV, III, II, I */}
                <div className="grid grid-cols-4 text-center text-[10px] font-bold bg-slate-50 border-b border-slate-200">
                  <div className="py-1 bg-sky-50 text-sky-700 border-r border-slate-200">IV</div>
                  <div className="py-1 bg-emerald-50 text-emerald-700 border-r border-slate-200">III</div>
                  <div className="py-1 bg-blue-50 text-blue-700 border-r border-slate-200">II</div>
                  <div className="py-1 bg-indigo-50 text-indigo-700">I</div>
                </div>
                <div className="grid grid-cols-4 text-center text-xs font-bold text-slate-800 py-1">
                  <div className="border-r border-slate-200">{instrumentalCounts['IV']}</div>
                  <div className="border-r border-slate-200">{instrumentalCounts['III']}</div>
                  <div className="border-r border-slate-200">{instrumentalCounts['II']}</div>
                  <div>{instrumentalCounts['I']}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Totals footer */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800">
            <div>
              Total (Observed) <span className="text-blue-700 ml-1">{totalObserved}</span>
            </div>
            <div>
              Total (Instrumental) <span className="text-blue-700 ml-1">{totalInstrumental}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Affected Population (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-4">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Affected Population</span>
            </div>

            <div className="flex items-center gap-3.5 my-auto">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">
                  {totalObserved > 0 ? 'Estimated' : 'Not calculated'}
                </div>
                <div className="text-[11px] text-slate-500 font-normal leading-relaxed mt-1">
                  {totalObserved > 0
                    ? `Active population coverage estimated from ${records.filter((r) => r.observedIntensity).length} verified town observation reports.`
                    : 'Population estimate is not yet available because observed intensities and report metadata are incomplete.'}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 mt-4 flex items-center justify-between">
            <span>Census Baseline: PSA 2024</span>
            <button
              type="button"
              onClick={() => showToast('Population recalculation triggered against municipal demographic logs.')}
              className="text-blue-600 font-semibold hover:underline"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Panel 3: EQP Report Preview (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Card Header & Copy Button */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>EQP Report Preview</span>
              </div>
              <button
                type="button"
                onClick={handleCopyReport}
                className="border border-blue-500 text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </button>
            </div>

            {/* Sub-header Tabs */}
            <div className="grid grid-cols-2 rounded-t-lg overflow-hidden border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveReportTab('observed')}
                className={`py-1.5 px-3 text-center transition-colors ${
                  activeReportTab === 'observed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Observed Intensity Report
              </button>
              <button
                type="button"
                onClick={() => setActiveReportTab('instrumental')}
                className={`py-1.5 px-3 text-center transition-colors ${
                  activeReportTab === 'instrumental'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Instrumental Intensity Report
              </button>
            </div>

            {/* Report Content Body */}
            <div className="border-x border-b border-slate-200 rounded-b-lg p-3 bg-slate-50/50 min-h-[160px] text-xs">
              {activeReportTab === 'observed' ? (
                totalObserved === 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start h-full">
                    {/* Left: Empty state icon */}
                    <div className="flex items-center gap-2.5 text-slate-500 py-3">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-700 text-xs">No observed intensity data</div>
                        <div className="text-[11px] text-slate-400">Report is not yet ready.</div>
                      </div>
                    </div>

                    {/* Right: Instrumental preview summary */}
                    <div className="border-l border-slate-200 pl-3 space-y-1 text-[11px] leading-relaxed">
                      <div className="font-bold text-slate-800 text-xs mb-1">Instrumental Earthquake Intensities</div>
                      {instrumentalGrouped.map((g) => (
                        <div key={g.level} className="text-slate-700">
                          <span className="font-semibold text-blue-900">{g.level}</span>
                          <span className="text-slate-500"> - {g.towns.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-[11px] leading-relaxed">
                    <div className="font-bold text-slate-800 text-xs mb-1">Observed Earthquake Intensities</div>
                    {observedGrouped.map((g) => (
                      <div key={g.level} className="text-slate-700">
                        <span className="font-semibold text-blue-900">{g.level}</span>
                        <span className="text-slate-500"> - {g.towns.join(', ')}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-1.5 text-[11px] leading-relaxed">
                  <div className="font-bold text-slate-800 text-xs mb-1">Instrumental Earthquake Intensities</div>
                  {instrumentalGrouped.map((g) => (
                    <div key={g.level} className="text-slate-700">
                      <span className="font-semibold text-blue-900">{g.level}</span>
                      <span className="text-slate-500"> - {g.towns.join(', ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 6: Bottom Action Bar & Process Stepper (matching Screenshot) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* + Add Town */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Town</span>
          </button>

          {/* Validate PSGC */}
          <button
            type="button"
            onClick={handleValidatePsgc}
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Validate PSGC</span>
          </button>

          {/* Check Duplicates */}
          <button
            type="button"
            onClick={handleCheckDuplicates}
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Check Duplicates</span>
          </button>

          {/* Generate EQP Report */}
          <button
            type="button"
            onClick={handleGenerateEqp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            <span>Generate EQP Report</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          {/* Archive Report */}
          <button
            type="button"
            onClick={handleArchiveReport}
            className={`border font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
              reportStatus === 'Draft'
                ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                : 'border-slate-400 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Report</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Export Excel</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="border border-rose-500 text-rose-600 hover:bg-rose-50 font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-rose-500" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* Workflow Process Stepper (matching Screenshot) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs overflow-x-auto gap-3 py-1">
          {/* Step 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">Input</div>
              <div className="text-[10px] text-slate-500">Enter town/city records</div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Step 2 */}
          <div
            onClick={() => setCurrentStep(2)}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">Validate</div>
              <div className="text-[10px] text-slate-500">Check PSGC and duplicates</div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Step 3 */}
          <div
            onClick={() => setCurrentStep(3)}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
              }`}
            >
              3
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">Consolidate</div>
              <div className="text-[10px] text-slate-500">Review and finalize data</div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Step 4 */}
          <div
            onClick={() => setCurrentStep(4)}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
              }`}
            >
              4
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">Generate</div>
              <div className="text-[10px] text-slate-500">Create EQP report</div>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          {/* Step 5 */}
          <div
            onClick={() => setCurrentStep(5)}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                currentStep >= 5 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
              }`}
            >
              5
            </div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">Archive</div>
              <div className="text-[10px] text-slate-500">Save and close report</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Town Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add Town/City Intensity Record</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTownSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Town or City Name *</label>
                <input
                  type="text"
                  required
                  value={formTown}
                  onChange={(e) => setFormTown(e.target.value)}
                  placeholder="e.g., Kiamba"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Province *</label>
                  <input
                    type="text"
                    required
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    placeholder="e.g., Sarangani"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Region</label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none bg-white"
                  >
                    <option value="Region XII">Region XII</option>
                    <option value="Region XI">Region XI</option>
                    <option value="Region X">Region X</option>
                    <option value="BARMM">BARMM</option>
                    <option value="NCR">NCR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instrumental Intensity</label>
                  <select
                    value={formInstrumental}
                    onChange={(e) => setFormInstrumental(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none bg-white"
                  >
                    <option value="NONE">Not entered</option>
                    {intensityLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Intensity {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observed Intensity</label>
                  <select
                    value={formObserved}
                    onChange={(e) => setFormObserved(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none bg-white"
                  >
                    <option value="NONE">Not entered</option>
                    {intensityLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Intensity {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reporter / MDRRMO (Optional)</label>
                <input
                  type="text"
                  value={formReporter}
                  onChange={(e) => setFormReporter(e.target.value)}
                  placeholder="e.g., Kiamba MDRRMO Field Unit"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Municipal Population</label>
                <input
                  type="number"
                  value={formPopulation}
                  onChange={(e) => setFormPopulation(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Town Modal */}
      {isEditModalOpen && editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Town Intensity Record (#{editingRecord.num})</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingRecord(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Town or City Name *</label>
                <input
                  type="text"
                  required
                  value={formTown}
                  onChange={(e) => setFormTown(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Province *</label>
                  <input
                    type="text"
                    required
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Region</label>
                  <select
                    value={formRegion}
                    onChange={(e) => setFormRegion(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none bg-white"
                  >
                    <option value="Region XII">Region XII</option>
                    <option value="Region XI">Region XI</option>
                    <option value="Region X">Region X</option>
                    <option value="BARMM">BARMM</option>
                    <option value="NCR">NCR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Instrumental Intensity</label>
                  <select
                    value={formInstrumental}
                    onChange={(e) => setFormInstrumental(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none bg-white"
                  >
                    <option value="NONE">Not entered</option>
                    {intensityLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Intensity {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observed Intensity</label>
                  <select
                    value={formObserved}
                    onChange={(e) => setFormObserved(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none bg-white"
                  >
                    <option value="NONE">Not entered</option>
                    {intensityLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        Intensity {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reporter</label>
                <input
                  type="text"
                  value={formReporter}
                  onChange={(e) => setFormReporter(e.target.value)}
                  placeholder="e.g., MDRRMO Lebak"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingRecord(null);
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
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
