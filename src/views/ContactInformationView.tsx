import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Building2,
  Siren,
  AlertTriangle,
  X,
  Search,
  ChevronDown,
  Edit3,
  BookOpen,
  Plus,
  Check,
  Mail,
  Ban,
  Upload,
  Download,
  MoreHorizontal,
  Clock,
  Send,
  Phone,
  ArrowUpDown,
  Filter,
  ShieldCheck,
  User,
} from 'lucide-react';
import { UserProfile } from '../types';

export type ContactType = 'Station Personnel' | 'Administrative' | 'Emergency' | 'External Coordination';
export type VerificationStatus = 'Verified' | 'Pending Verification';
export type ActiveStatus = 'Active' | 'Inactive';

export interface ContactRecord {
  id: string;
  name: string;
  organization: string;
  stationCode: string;
  stationName: string;
  role: string;
  email: string;
  contactNumber: string;
  alternateContact: string;
  contactType: ContactType;
  verificationStatus: VerificationStatus;
  activeStatus: ActiveStatus;
  lastVerified: string;
  notes: string;
}

const INITIAL_CONTACTS: ContactRecord[] = [
  {
    id: 'CNT-000',
    name: 'Glyn Bryan Ebardo',
    organization: 'DOST-PHIVOLCS Disaster Response',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    role: 'Emergency Response Coordinator',
    email: 'ebardo.glynbryan1@gmail.com',
    contactNumber: '0917 888 2345',
    alternateContact: '02 8426 1468',
    contactType: 'Emergency',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Just now (Verified Alert Target)',
    notes: 'Primary emergency alert contact for Palayan Seismic Station (PCP AOR).',
  },
  {
    id: 'CNT-001',
    name: 'Wilmer A. Legaspi',
    organization: 'PHIVOLCS',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    role: 'Station Personnel',
    email: 'wilmer.legaspi@phivolcs.dost.gov.ph',
    contactNumber: '0917 123 4567',
    alternateContact: '02 8426 1468',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 20, 2025 09:15 AM',
    notes: 'Primary contact for earthquake alerts in Nueva Ecija and nearby areas.',
  },
  {
    id: 'CNT-002',
    name: 'Evelyn B. Seranado',
    organization: 'PHIVOLCS',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    role: 'Station Personnel',
    email: '—',
    contactNumber: '0918 234 5678',
    alternateContact: '02 8426 1469',
    contactType: 'Station Personnel',
    verificationStatus: 'Pending Verification',
    activeStatus: 'Active',
    lastVerified: 'Pending verification',
    notes: 'Secondary focal person for Surigao del Sur and eastern Mindanao stations.',
  },
  {
    id: 'CNT-003',
    name: 'Mark Louegie Juarbal',
    organization: 'PHIVOLCS',
    stationCode: 'CGP',
    stationName: 'Cagayan de Oro Seismic Station',
    role: 'Station Personnel',
    email: 'mark.juarbal@phivolcs.dost.gov.ph',
    contactNumber: '0917 345 6789',
    alternateContact: '088 856 2345',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 18, 2025 02:30 PM',
    notes: 'Duty officer and station technical lead for Northern Mindanao coverage.',
  },
  {
    id: 'CNT-004',
    name: 'Glyn Bryan Ebardo',
    organization: 'PHIVOLCS Main Office',
    stationCode: 'QVP',
    stationName: 'Main Office',
    role: 'Administrative Recipient',
    email: 'glyn.ebardo@phivolcs.dost.gov.ph',
    contactNumber: '0920 456 7890',
    alternateContact: '02 8929 9254',
    contactType: 'Administrative',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 22, 2025 11:00 AM',
    notes: 'Administrator receiving system-wide dispatch and AOR boundary exception logs.',
  },
  {
    id: 'CNT-005',
    name: 'PHIVOLCS Emergency Operations Center',
    organization: 'PHIVOLCS',
    stationCode: 'National Coordination',
    stationName: 'Disaster Operations Desk',
    role: 'Emergency Contact',
    email: 'eoc@phivolcs.dost.gov.ph',
    contactNumber: '02 8426 1468',
    alternateContact: '0917 899 1234',
    contactType: 'Emergency',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 15, 2025 08:00 AM',
    notes: 'Central 24/7 disaster monitoring desk for rapid response and alert escalations.',
  },
  {
    id: 'CNT-006',
    name: 'Local Government Unit Coordination Desk',
    organization: 'Various AORs',
    stationCode: 'External Coordination',
    stationName: 'Inter-Agency Desk',
    role: 'LGU Coordination',
    email: 'lgu.coord@phivolcs.dost.gov.ph',
    contactNumber: '02 8426 1468',
    alternateContact: '02 8928 3757',
    contactType: 'External Coordination',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 19, 2025 04:15 PM',
    notes: 'Liaison channel for provincial and municipal disaster risk reduction councils.',
  },
  {
    id: 'CNT-007',
    name: 'Eduardo M. Perez',
    organization: 'PHIVOLCS',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    role: 'Senior Seismologist',
    email: 'eduardo.perez@phivolcs.dost.gov.ph',
    contactNumber: '0917 456 7891',
    alternateContact: '044 940 1234',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 19, 2025 10:00 AM',
    notes: 'Senior station officer handling rapid post-event field assessments.',
  },
  {
    id: 'CNT-008',
    name: 'Grace T. Villaruel',
    organization: 'PHIVOLCS',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    role: 'Technical Officer',
    email: 'grace.villaruel@phivolcs.dost.gov.ph',
    contactNumber: '0918 567 8902',
    alternateContact: '044 940 1235',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 18, 2025 03:20 PM',
    notes: 'Telemetry and digital data stream monitor for Central Luzon cluster.',
  },
  {
    id: 'CNT-009',
    name: 'Rodrigo S. Alcantara',
    organization: 'PHIVOLCS',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    role: 'Station In-Charge',
    email: 'rodrigo.alcantara@phivolcs.dost.gov.ph',
    contactNumber: '0919 678 9013',
    alternateContact: '086 853 4567',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 21, 2025 08:45 AM',
    notes: 'Primary point of contact for Bislig station and Surigao trench seismic activity.',
  },
  {
    id: 'CNT-010',
    name: 'Nathalie C. Mendoza',
    organization: 'PHIVOLCS',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    role: 'Assistant Science Research Specialist',
    email: 'nathalie.mendoza@phivolcs.dost.gov.ph',
    contactNumber: '0917 789 0124',
    alternateContact: '086 853 4568',
    contactType: 'Station Personnel',
    verificationStatus: 'Pending Verification',
    activeStatus: 'Active',
    lastVerified: 'Pending verification',
    notes: 'Awaiting email authorization update for automated bulletin notifications.',
  },
  {
    id: 'CNT-011',
    name: 'Christian D. Ramos',
    organization: 'PHIVOLCS',
    stationCode: 'CGP',
    stationName: 'Cagayan de Oro Seismic Station',
    role: 'Field Analyst',
    email: 'christian.ramos@phivolcs.dost.gov.ph',
    contactNumber: '0920 890 1235',
    alternateContact: '088 856 2346',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 17, 2025 01:10 PM',
    notes: 'Northern Mindanao network field sensor calibration and telemetry maintenance.',
  },
  {
    id: 'CNT-012',
    name: 'Lourdes K. Tan',
    organization: 'PHIVOLCS',
    stationCode: 'CGP',
    stationName: 'Cagayan de Oro Seismic Station',
    role: 'Data Officer',
    email: 'lourdes.tan@phivolcs.dost.gov.ph',
    contactNumber: '0918 901 2346',
    alternateContact: '088 856 2347',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 16, 2025 04:30 PM',
    notes: 'Coordinates station records with regional disaster risk reduction offices.',
  },
  {
    id: 'CNT-013',
    name: 'Arnel F. Bautista',
    organization: 'PHIVOLCS Main Office',
    stationCode: 'QVP',
    stationName: 'Main Office',
    role: 'IT Systems Admin',
    email: 'arnel.bautista@phivolcs.dost.gov.ph',
    contactNumber: '0917 012 3457',
    alternateContact: '02 8929 9255',
    contactType: 'Administrative',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 21, 2025 11:20 AM',
    notes: 'Infrastructure engineer overseeing automated email alert queue & server cluster.',
  },
  {
    id: 'CNT-014',
    name: 'Teresa V. Santos',
    organization: 'PHIVOLCS Main Office',
    stationCode: 'QVP',
    stationName: 'Main Office',
    role: 'Alert Operations Lead',
    email: 'teresa.santos@phivolcs.dost.gov.ph',
    contactNumber: '0922 123 4568',
    alternateContact: '02 8929 9256',
    contactType: 'Administrative',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 20, 2025 08:30 AM',
    notes: 'Oversees alert dispatch policy and cross-regional boundary escalation rules.',
  },
  {
    id: 'CNT-015',
    name: 'NDRRMC Operations Center',
    organization: 'NDRRMC',
    stationCode: 'National Coordination',
    stationName: 'Camp Aguinaldo Command Desk',
    role: 'National Disaster Agency',
    email: 'opcen@ndrrmc.gov.ph',
    contactNumber: '02 8911 1406',
    alternateContact: '02 8912 2665',
    contactType: 'Emergency',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 19, 2025 09:00 AM',
    notes: 'Direct bridge to the national disaster council for M≥5.5 or high-intensity shocks.',
  },
  {
    id: 'CNT-016',
    name: 'Office of Civil Defense Duty Desk',
    organization: 'OCD',
    stationCode: 'National Coordination',
    stationName: 'Central Monitoring Desk',
    role: 'Emergency Response Coordinator',
    email: 'operations@ocd.gov.ph',
    contactNumber: '02 8912 5668',
    alternateContact: '0917 888 3333',
    contactType: 'Emergency',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 16, 2025 02:00 PM',
    notes: 'Handles nationwide civil defense alerts and logistical deployment coordination.',
  },
  {
    id: 'CNT-017',
    name: 'Region III PDRRMO Nueva Ecija',
    organization: 'Province of Nueva Ecija',
    stationCode: 'Various AORs',
    stationName: 'Palayan City Center',
    role: 'Provincial Disaster Officer',
    email: 'pdrrmo.nuevaecija@gov.ph',
    contactNumber: '044 940 7890',
    alternateContact: '0919 111 2233',
    contactType: 'External Coordination',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 18, 2025 10:15 AM',
    notes: 'Provincial emergency dispatch for Palayan seismic station area of responsibility.',
  },
  {
    id: 'CNT-018',
    name: 'Region XIII PDRRMO Surigao del Sur',
    organization: 'Province of Surigao del Sur',
    stationCode: 'Various AORs',
    stationName: 'Tandag City Center',
    role: 'Provincial Disaster Officer',
    email: 'pdrrmo.surigaodelsur@gov.ph',
    contactNumber: '086 211 4000',
    alternateContact: '0917 222 3344',
    contactType: 'External Coordination',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 17, 2025 09:30 AM',
    notes: 'Covers Bislig seismic station coastal municipalities and tsunami alert chains.',
  },
  {
    id: 'CNT-019',
    name: 'Region X CDRRMO Cagayan de Oro',
    organization: 'City of Cagayan de Oro',
    stationCode: 'Various AORs',
    stationName: 'City Hall Command Center',
    role: 'City Disaster Risk Reduction Officer',
    email: 'cdrrmo.cdo@gov.ph',
    contactNumber: '088 858 4000',
    alternateContact: '0918 333 4455',
    contactType: 'External Coordination',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 20, 2025 01:45 PM',
    notes: 'Urban command post for earthquakes affecting Cagayan de Oro metropolitan basin.',
  },
  {
    id: 'CNT-020',
    name: 'Danilo C. Reyes',
    organization: 'PHIVOLCS',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    role: 'Station Technician',
    email: 'danilo.reyes@phivolcs.dost.gov.ph',
    contactNumber: '0917 654 3210',
    alternateContact: '044 940 1236',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 15, 2025 11:30 AM',
    notes: 'Station hardware monitoring and solar power battery backup specialist.',
  },
  {
    id: 'CNT-021',
    name: 'Rowena J. Mercado',
    organization: 'PHIVOLCS',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    role: 'Communications Assistant',
    email: 'rowena.mercado@phivolcs.dost.gov.ph',
    contactNumber: '0918 765 4321',
    alternateContact: '086 853 4569',
    contactType: 'Station Personnel',
    verificationStatus: 'Pending Verification',
    activeStatus: 'Active',
    lastVerified: 'Pending verification',
    notes: 'Assists with local radio transmissions and emergency telecommunication relays.',
  },
  {
    id: 'CNT-022',
    name: 'Samuel P. Navarro',
    organization: 'PHIVOLCS',
    stationCode: 'CGP',
    stationName: 'Cagayan de Oro Seismic Station',
    role: 'Data Verification Analyst',
    email: 'samuel.navarro@phivolcs.dost.gov.ph',
    contactNumber: '0920 876 5432',
    alternateContact: '088 856 2348',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 19, 2025 03:00 PM',
    notes: 'Cross-verifies instrumental acceleration records with regional bulletin feeds.',
  },
  {
    id: 'CNT-023',
    name: 'Vicente L. Cordero',
    organization: 'PHIVOLCS',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    role: 'Field Observer',
    email: 'vicente.cordero@phivolcs.dost.gov.ph',
    contactNumber: '0919 987 6543',
    alternateContact: '044 940 1237',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 14, 2025 09:20 AM',
    notes: 'Coordinates immediate visual ground surveys for tremors detected in Nueva Ecija.',
  },
  {
    id: 'CNT-024',
    name: 'Melissa A. Gutierrez',
    organization: 'PHIVOLCS',
    stationCode: 'BIP',
    stationName: 'Bislig Seismic Station',
    role: 'Seismic Telemetry Specialist',
    email: 'melissa.gutierrez@phivolcs.dost.gov.ph',
    contactNumber: '0922 098 7654',
    alternateContact: '086 853 4570',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    lastVerified: 'Apr 17, 2025 10:10 AM',
    notes: 'Monitors broadband seismometer satellite links and real-time waveforms.',
  },
];

interface ContactInformationViewProps {
  currentUser?: UserProfile;
}

export const ContactInformationView: React.FC<ContactInformationViewProps> = ({ currentUser }) => {
  const isPcpRestricted = currentUser?.assignedAor === 'PCP';
  const [contacts, setContacts] = useState<ContactRecord[]>(INITIAL_CONTACTS);
  const [selectedId, setSelectedId] = useState<string>('CNT-001');
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [contactTypeFilter, setContactTypeFilter] = useState('All Types');
  const [stationFilter, setStationFilter] = useState(isPcpRestricted ? 'PCP' : 'All Stations/AORs');
  const [verificationFilter, setVerificationFilter] = useState('All Statuses');
  const [activeStatusFilter, setActiveStatusFilter] = useState('All Statuses');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'name' | 'email'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // User Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTestMessageModalOpen, setIsTestMessageModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add/Edit Form State
  const [formData, setFormData] = useState<Partial<ContactRecord>>({
    name: '',
    organization: 'PHIVOLCS',
    stationCode: 'PCP',
    stationName: 'Palayan Seismic Station',
    role: 'Station Personnel',
    email: '',
    contactNumber: '',
    alternateContact: '',
    contactType: 'Station Personnel',
    verificationStatus: 'Verified',
    activeStatus: 'Active',
    notes: '',
  });

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedContact = useMemo(() => {
    return contacts.find((c) => c.id === selectedId) || contacts[0];
  }, [contacts, selectedId]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      if (isPcpRestricted && contact.stationCode !== 'PCP') {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          contact.name.toLowerCase().includes(q) ||
          contact.organization.toLowerCase().includes(q) ||
          contact.stationCode.toLowerCase().includes(q) ||
          contact.stationName.toLowerCase().includes(q) ||
          contact.email.toLowerCase().includes(q) ||
          contact.contactNumber.toLowerCase().includes(q) ||
          contact.role.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (contactTypeFilter !== 'All Types' && contact.contactType !== contactTypeFilter) {
        return false;
      }

      if (stationFilter !== 'All Stations/AORs') {
        if (stationFilter === 'Various AORs' && contact.stationCode !== 'Various AORs') return false;
        if (stationFilter === 'National Coordination' && contact.stationCode !== 'National Coordination') return false;
        if (stationFilter === 'QVP Main Office' && contact.stationCode !== 'QVP') return false;
        if (['PCP', 'BIP', 'CGP'].includes(stationFilter) && contact.stationCode !== stationFilter) return false;
      }

      if (verificationFilter !== 'All Statuses' && contact.verificationStatus !== verificationFilter) {
        return false;
      }

      if (activeStatusFilter !== 'All Statuses' && contact.activeStatus !== activeStatusFilter) {
        return false;
      }

      return true;
    });
  }, [contacts, searchQuery, contactTypeFilter, stationFilter, verificationFilter, activeStatusFilter]);

  // Sorted contacts
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      let valA = a[sortField].toLowerCase();
      let valB = b[sortField].toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortField, sortAsc]);

  // Paginated contacts
  const totalPages = Math.ceil(sortedContacts.length / rowsPerPage) || 1;
  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedContacts.slice(start, start + rowsPerPage);
  }, [sortedContacts, currentPage, rowsPerPage]);

  const toggleSort = (field: 'name' | 'email') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Actions
  const handleVerifySelected = () => {
    if (!selectedContact) return;
    setContacts((prev) =>
      prev.map((c) =>
        c.id === selectedContact.id
          ? {
              ...c,
              verificationStatus: 'Verified',
              lastVerified: new Date().toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
            }
          : c
      )
    );
    showNotification(`Contact ${selectedContact.name} verified successfully.`);
  };

  const handleToggleDeactivate = () => {
    if (!selectedContact) return;
    const newStatus = selectedContact.activeStatus === 'Active' ? 'Inactive' : 'Active';
    setContacts((prev) =>
      prev.map((c) => (c.id === selectedContact.id ? { ...c, activeStatus: newStatus } : c))
    );
    showNotification(
      `Contact ${selectedContact.name} has been ${newStatus === 'Active' ? 'activated' : 'deactivated'}.`
    );
  };

  const handleOpenEdit = (contact?: ContactRecord) => {
    const target = contact || selectedContact;
    if (!target) return;
    setFormData({ ...target });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;
    setContacts((prev) =>
      prev.map((c) => (c.id === formData.id ? ({ ...c, ...formData } as ContactRecord) : c))
    );
    setIsEditModalOpen(false);
    showNotification(`Contact ${formData.name} updated successfully.`);
  };

  const handleOpenAdd = () => {
    setFormData({
      id: `CNT-${String(contacts.length + 1).padStart(3, '0')}`,
      name: '',
      organization: 'PHIVOLCS',
      stationCode: 'PCP',
      stationName: 'Palayan Seismic Station',
      role: 'Station Personnel',
      email: '',
      contactNumber: '',
      alternateContact: '',
      contactType: 'Station Personnel',
      verificationStatus: 'Verified',
      activeStatus: 'Active',
      lastVerified: 'Just now',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const newContact: ContactRecord = {
      id: `CNT-${String(contacts.length + 1).padStart(3, '0')}`,
      name: formData.name || 'Unnamed Contact',
      organization: formData.organization || 'PHIVOLCS',
      stationCode: formData.stationCode || 'PCP',
      stationName: formData.stationName || 'Palayan Seismic Station',
      role: formData.role || 'Station Personnel',
      email: formData.email || '—',
      contactNumber: formData.contactNumber || '—',
      alternateContact: formData.alternateContact || '—',
      contactType: (formData.contactType as ContactType) || 'Station Personnel',
      verificationStatus: (formData.verificationStatus as VerificationStatus) || 'Verified',
      activeStatus: (formData.activeStatus as ActiveStatus) || 'Active',
      lastVerified: new Date().toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      notes: formData.notes || '',
    };
    setContacts((prev) => [newContact, ...prev]);
    setSelectedId(newContact.id);
    setIsAddModalOpen(false);
    showNotification(`Contact ${newContact.name} added to directory.`);
  };

  const handleExportCSV = () => {
    const headers = [
      'Contact ID',
      'Contact Name',
      'Organization / Office',
      'Station / AOR Code',
      'Station / AOR Name',
      'Role',
      'Email Address',
      'Contact Number',
      'Alternate Contact',
      'Contact Type',
      'Verification Status',
      'Active Status',
      'Last Verified',
      'Notes',
    ];
    const rows = contacts.map((c) => [
      `"${c.id}"`,
      `"${c.name}"`,
      `"${c.organization}"`,
      `"${c.stationCode}"`,
      `"${c.stationName}"`,
      `"${c.role}"`,
      `"${c.email}"`,
      `"${c.contactNumber}"`,
      `"${c.alternateContact}"`,
      `"${c.contactType}"`,
      `"${c.verificationStatus}"`,
      `"${c.activeStatus}"`,
      `"${c.lastVerified}"`,
      `"${c.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Contact_Info_Directory_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Contact directory exported successfully.');
  };

  return (
    <div className="space-y-4">
      {/* Station Account Restricted Notice Banner */}
      {isPcpRestricted && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" />
            <span>
              <strong>Station View Active:</strong> You are logged in with the <strong>Palayan Seismic Station</strong> user account. Displaying personnel and emergency contacts for <strong>PCP AOR</strong> only.
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded border border-blue-300 shrink-0 ml-2">
            PCP Contacts Only
          </span>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-50 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Row 1: Four Top Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contacts */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-full bg-blue-100/70 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-700">Total Contacts</div>
            <div className="text-3xl font-extrabold text-blue-700 font-mono tracking-tight leading-none mt-1">
              24
            </div>
            <div className="text-xs text-slate-500 font-normal mt-1">All registered contacts</div>
          </div>
        </div>

        {/* Verified Contacts */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700">Verified Contacts</div>
            <div className="text-3xl font-extrabold text-emerald-700 font-mono tracking-tight leading-none mt-1">
              20
            </div>
            <div className="text-xs text-slate-500 font-normal mt-1">83% of total contacts</div>
          </div>
        </div>

        {/* Station Contacts */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700">Station Contacts</div>
            <div className="text-3xl font-extrabold text-purple-700 font-mono tracking-tight leading-none mt-1">
              15
            </div>
            <div className="text-xs text-slate-500 font-normal mt-1">Across all stations/AORs</div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-full bg-rose-100/80 flex items-center justify-center shrink-0">
            <Siren className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <div className="text-xs font-semibold text-rose-600">Emergency Contacts</div>
            <div className="text-3xl font-extrabold text-rose-600 font-mono tracking-tight leading-none mt-1">
              3
            </div>
            <div className="text-xs text-slate-500 font-normal mt-1">Key emergency recipients</div>
          </div>
        </div>
      </div>

      {/* Row 2: Warning Banner */}
      {isBannerVisible && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-full bg-amber-100 shrink-0 text-amber-600 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Contact information must be verified before it is used for automatic alert delivery.
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 font-normal">
                Unverified or incomplete contact details may result in failed alert delivery and delayed
                response.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBannerVisible(false)}
            className="text-amber-600 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Row 3: Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Search by name, station, email... */}
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name, station, email, or organization..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-blue-400 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium transition-colors"
              />
            </div>
          </div>

          {/* Contact Type Filter */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Contact Type</label>
            <div className="relative">
              <select
                value={contactTypeFilter}
                onChange={(e) => {
                  setContactTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-8 bg-white border border-blue-400 rounded-lg text-xs text-slate-800 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>All Types</option>
                <option>Station Personnel</option>
                <option>Administrative</option>
                <option>Emergency</option>
                <option>External Coordination</option>
              </select>
              <ChevronDown className="w-4 h-4 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Station/AOR Filter */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Station/AOR {isPcpRestricted && <span className="text-blue-600 font-normal">(PCP Only)</span>}
            </label>
            <div className="relative">
              <select
                value={isPcpRestricted ? 'PCP' : stationFilter}
                disabled={isPcpRestricted}
                onChange={(e) => {
                  setStationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full px-3 py-2 pr-8 border rounded-lg text-xs text-slate-800 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  isPcpRestricted
                    ? 'bg-slate-50 border-blue-200 text-blue-900 cursor-default'
                    : 'bg-white border-blue-400 cursor-pointer'
                }`}
              >
                {isPcpRestricted ? (
                  <option value="PCP">PCP (Palayan Station Only)</option>
                ) : (
                  <>
                    <option>All Stations/AORs</option>
                    <option>PCP</option>
                    <option>BIP</option>
                    <option>CGP</option>
                    <option>QVP Main Office</option>
                    <option>National Coordination</option>
                    <option>Various AORs</option>
                  </>
                )}
              </select>
              {!isPcpRestricted && (
                <ChevronDown className="w-4 h-4 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              )}
            </div>
          </div>

          {/* Verification Status Filter */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Verification Status</label>
            <div className="relative">
              <select
                value={verificationFilter}
                onChange={(e) => {
                  setVerificationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-8 bg-white border border-blue-400 rounded-lg text-xs text-slate-800 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>All Statuses</option>
                <option>Verified</option>
                <option>Pending Verification</option>
              </select>
              <ChevronDown className="w-4 h-4 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Active Status Filter */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Active Status</label>
            <div className="relative">
              <select
                value={activeStatusFilter}
                onChange={(e) => {
                  setActiveStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 pr-8 bg-white border border-blue-400 rounded-lg text-xs text-slate-800 font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
              <ChevronDown className="w-4 h-4 text-blue-600 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Main 2-Column Content Layout (Table on left, Details on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Table Container (8 Cols on desktop) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-blue-50/60 border-b border-slate-200 text-slate-700 font-semibold select-none">
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-blue-700 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Contact Name</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Organization / Office</th>
                  <th className="py-3 px-3 whitespace-nowrap">Station / AOR</th>
                  <th className="py-3 px-3 whitespace-nowrap">Role</th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-blue-700 transition-colors whitespace-nowrap"
                    onClick={() => toggleSort('email')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Email Address</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Contact Number</th>
                  <th className="py-3 px-3 whitespace-nowrap">Contact Type</th>
                  <th className="py-3 px-3 whitespace-nowrap">Verification Status</th>
                  <th className="py-3 px-3 whitespace-nowrap">Active Status</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedContacts.map((contact) => {
                  const isSelected = contact.id === selectedId;
                  return (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedId(contact.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-100/70 border-l-4 border-l-blue-600 font-medium'
                          : 'hover:bg-slate-50/80 text-slate-700'
                      }`}
                    >
                      {/* Contact Name */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            isSelected ? 'text-blue-700' : 'text-blue-600 hover:underline'
                          }`}
                        >
                          {contact.name}
                        </span>
                      </td>

                      {/* Organization / Office */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        {contact.organization}
                      </td>

                      {/* Station / AOR */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{contact.stationCode}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{contact.stationName}</div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        {contact.role}
                      </td>

                      {/* Email Address */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {contact.email}
                      </td>

                      {/* Contact Number */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-700">
                        {contact.contactNumber}
                      </td>

                      {/* Contact Type Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {contact.contactType === 'Station Personnel' && (
                          <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded text-[11px] font-semibold inline-block">
                            Station Personnel
                          </span>
                        )}
                        {contact.contactType === 'Administrative' && (
                          <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[11px] font-semibold inline-block">
                            Administrative
                          </span>
                        )}
                        {contact.contactType === 'Emergency' && (
                          <span className="bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded text-[11px] font-semibold inline-block">
                            Emergency
                          </span>
                        )}
                        {contact.contactType === 'External Coordination' && (
                          <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded text-[11px] font-semibold inline-block">
                            External Coordination
                          </span>
                        )}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {contact.verificationStatus === 'Verified' ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-700 font-semibold text-xs">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Pending Verification</span>
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {contact.activeStatus === 'Active' ? (
                          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs">
                            <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(contact.id);
                            handleOpenEdit(contact);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Actions menu"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginatedContacts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-semibold">No contacts match the selected criteria.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setContactTypeFilter('All Types');
                          setStationFilter('All Stations/AORs');
                          setVerificationFilter('All Statuses');
                          setActiveStatusFilter('All Statuses');
                        }}
                        className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Reset filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/50">
            <div className="text-slate-500 font-medium">
              Showing {paginatedContacts.length} of {filteredContacts.length} contacts
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-colors ${
                    currentPage === pg
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                ›
              </button>
            </div>

            {/* Rows Per Page */}
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-[11px] font-medium">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 outline-none"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right: Side Cards (4 Cols on desktop) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Contact Details */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-blue-700">Contact Details</h3>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedContact)}
                className="border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Contact</span>
              </button>
            </div>

            {selectedContact ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Contact Name</span>
                  <span className="font-bold text-slate-900 text-right">{selectedContact.name}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Organization</span>
                  <span className="text-slate-800 text-right font-medium">{selectedContact.organization}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Station/AOR</span>
                  <span className="text-slate-800 text-right font-medium">
                    {selectedContact.stationCode} / {selectedContact.stationName}
                  </span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Role</span>
                  <span className="text-slate-800 text-right font-medium">{selectedContact.role}</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <span className="text-slate-800 text-right font-mono text-[11px] max-w-[200px] truncate" title={selectedContact.email}>
                    {selectedContact.email}
                  </span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Contact Number</span>
                  <span className="text-slate-800 text-right font-mono text-[11px] font-semibold">
                    {selectedContact.contactNumber}
                  </span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Alternate Contact</span>
                  <span className="text-slate-800 text-right font-mono text-[11px]">
                    {selectedContact.alternateContact || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Contact Type</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                    {selectedContact.contactType}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Verification Status</span>
                  {selectedContact.verificationStatus === 'Verified' ? (
                    <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Pending Verification
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Last Verified</span>
                  <span className="text-slate-700 text-right font-medium">{selectedContact.lastVerified}</span>
                </div>

                {/* Notes Box */}
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1">Notes</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-slate-700 text-xs leading-relaxed">
                    {selectedContact.notes || 'No remarks or special notes entered for this contact.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">Select a contact to view full details</div>
            )}
          </div>

          {/* Card 2: Contact Coverage */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-blue-700">Contact Coverage</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* PCP Palayan */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 w-9">PCP</span>
                  <span className="text-slate-700">Palayan Seismic Station</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ready (3/3)
                </span>
              </div>

              {/* BIP Bislig */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 w-9">BIP</span>
                  <span className="text-slate-700">Bislig Seismic Station</span>
                </div>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Partial (2/3)
                </span>
              </div>

              {/* CGP Cagayan de Oro */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 w-9">CGP</span>
                  <span className="text-slate-700">Cagayan de Oro Seismic Station</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ready (3/3)
                </span>
              </div>

              {/* QVP Main Office */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 w-9">QVP</span>
                  <span className="text-slate-700">Main Office</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ready (2/2)
                </span>
              </div>

              {/* Emergency Operations */}
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-700 font-medium">Emergency Operations</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ready (3/3)
                </span>
              </div>

              {/* External Coordination (LGUs) */}
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-700 font-medium">External Coordination (LGUs)</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ready (5/5)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Bottom Action Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* + Add Contact */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>

          {/* Edit Contact */}
          <button
            type="button"
            onClick={() => handleOpenEdit(selectedContact)}
            className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Contact</span>
          </button>

          {/* Verify Contact */}
          <button
            type="button"
            onClick={handleVerifySelected}
            className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Verify Contact</span>
          </button>

          {/* Send Test Message */}
          <button
            type="button"
            onClick={() => setIsTestMessageModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Test Message</span>
          </button>

          {/* Deactivate / Activate Button */}
          <button
            type="button"
            onClick={handleToggleDeactivate}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors ${
              selectedContact?.activeStatus === 'Active'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>{selectedContact?.activeStatus === 'Active' ? 'Deactivate' : 'Activate'}</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-px bg-slate-300 hidden md:block" />

          {/* Import Contacts */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Contacts</span>
          </button>

          {/* Export Directory */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-blue-50 border border-blue-500 text-blue-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Directory</span>
          </button>
        </div>
      </div>

      {/* MODAL 1: Add Contact */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Add New Directory Contact</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Maria Santos"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization || ''}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g. PHIVOLCS"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Station/AOR Code</label>
                  <select
                    value={formData.stationCode || 'PCP'}
                    onChange={(e) => {
                      const code = e.target.value;
                      let name = 'Palayan Seismic Station';
                      if (code === 'BIP') name = 'Bislig Seismic Station';
                      if (code === 'CGP') name = 'Cagayan de Oro Seismic Station';
                      if (code === 'QVP') name = 'Main Office';
                      if (code === 'National Coordination') name = 'Disaster Operations Desk';
                      if (code === 'Various AORs') name = 'Inter-Agency Desk';
                      setFormData({ ...formData, stationCode: code, stationName: name });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="PCP">PCP (Palayan)</option>
                    <option value="BIP">BIP (Bislig)</option>
                    <option value="CGP">CGP (Cagayan de Oro)</option>
                    <option value="QVP">QVP (Main Office)</option>
                    <option value="National Coordination">National Coordination</option>
                    <option value="Various AORs">Various AORs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role</label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Station Personnel"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@domain.gov.ph"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="0917 123 4567"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Alternate Contact</label>
                  <input
                    type="text"
                    value={formData.alternateContact || ''}
                    onChange={(e) => setFormData({ ...formData, alternateContact: e.target.value })}
                    placeholder="02 8426 1468"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Type</label>
                  <select
                    value={formData.contactType || 'Station Personnel'}
                    onChange={(e) => setFormData({ ...formData, contactType: e.target.value as ContactType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Station Personnel">Station Personnel</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Emergency">Emergency</option>
                    <option value="External Coordination">External Coordination</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Coverage Area</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Operational details, coverage areas, or special dispatch instructions..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Contact */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Contact Information</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Organization *</label>
                  <input
                    type="text"
                    required
                    value={formData.organization || ''}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Station/AOR Code</label>
                  <input
                    type="text"
                    value={formData.stationCode || ''}
                    onChange={(e) => setFormData({ ...formData, stationCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role</label>
                  <input
                    type="text"
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="text"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Alternate Contact</label>
                  <input
                    type="text"
                    value={formData.alternateContact || ''}
                    onChange={(e) => setFormData({ ...formData, alternateContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Type</label>
                  <select
                    value={formData.contactType || 'Station Personnel'}
                    onChange={(e) => setFormData({ ...formData, contactType: e.target.value as ContactType })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Station Personnel">Station Personnel</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Emergency">Emergency</option>
                    <option value="External Coordination">External Coordination</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Verification Status</label>
                  <select
                    value={formData.verificationStatus || 'Verified'}
                    onChange={(e) =>
                      setFormData({ ...formData, verificationStatus: e.target.value as VerificationStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Pending Verification">Pending Verification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Active Status</label>
                  <select
                    value={formData.activeStatus || 'Active'}
                    onChange={(e) =>
                      setFormData({ ...formData, activeStatus: e.target.value as ActiveStatus })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Send Test Message */}
      {isTestMessageModalOpen && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Send Test Alert Message</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTestMessageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-slate-700 space-y-1">
                <div className="font-semibold text-blue-900">Recipient Target:</div>
                <div className="font-bold text-slate-900">{selectedContact.name}</div>
                <div className="text-slate-600">Email: {selectedContact.email}</div>
                <div className="text-slate-600">SMS: {selectedContact.contactNumber}</div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Test Message Type</label>
                <select className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none font-medium bg-white">
                  <option>Standard AOR In-Bound Seismic Bulletin Test</option>
                  <option>Emergency High-Magnitude Priority Broadcast</option>
                  <option>Station Offline Waveform Telemetry Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Message Preview</label>
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg font-mono text-[11px] leading-relaxed border border-slate-200">
                  [TEST BULLETIN] DOST-PHIVOLCS EQInfo Alert: A test earthquake advisory has been generated for
                  station {selectedContact.stationCode} ({selectedContact.stationName}). No action required.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsTestMessageModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTestMessageModalOpen(false);
                  showNotification(`Test message dispatched to ${selectedContact.email || selectedContact.contactNumber}.`);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Test</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Import Contacts */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Import Contacts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                Upload a CSV file containing contact records. Format should include Contact Name, Station/AOR, Email, and Phone number.
              </p>

              <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center hover:bg-blue-50/50 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">Click to upload or drag & drop</p>
                <p className="text-[11px] text-slate-400 mt-0.5">CSV, XLSX (max 5MB)</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                Tip: You can export the current directory first to get the exact schema template.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  showNotification('Contacts imported successfully.');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs"
              >
                Process File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
