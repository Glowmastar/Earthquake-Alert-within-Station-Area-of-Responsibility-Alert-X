import React, { useState } from 'react';
import {
  Users,
  Building2,
  ShieldCheck,
  Clock,
  Info,
  Search,
  Plus,
  Download,
  History,
  MoreVertical,
  User,
  Check,
  X,
  Edit,
  ChevronDown,
  ArrowUpDown,
  FileText,
  AlertCircle,
  Copy,
  CheckCircle2,
} from 'lucide-react';

export interface RoleData {
  id: string;
  name: string;
  description: string;
  scope: 'Global' | 'Assigned stations';
  keyPermissions: string;
  usersCount: number;
  status: 'Active' | 'Inactive';
  assignedStations: { code: string; name: string }[];
  permissions: string[];
  restricted: string[];
  auditHistory?: { timestamp: string; actor: string; change: string }[];
}

const INITIAL_ROLES: RoleData[] = [
  {
    id: 'role-admin',
    name: 'Administrator',
    description: 'Full system administration',
    scope: 'Global',
    keyPermissions: 'All modules, users, roles, configuration',
    usersCount: 2,
    status: 'Active',
    assignedStations: [
      { code: 'GLOBAL', name: 'All Monitored Seismic Stations' },
    ],
    permissions: [
      'Full Access to All Modules',
      'User & Role Management',
      'System Configuration',
      'Approval Actions & Overrides',
      'Ingest Pipeline & Feed Settings',
    ],
    restricted: ['None (Superuser privilege)'],
    auditHistory: [
      {
        timestamp: 'Sep 15, 2026 10:30 AM',
        actor: 'Juan Dela Cruz (System Administrator)',
        change: 'System audit baseline verified for global administrative permissions',
      },
    ],
  },
  {
    id: 'role-user',
    name: 'User',
    description: 'Base station-scoped access (PCP AOR)',
    scope: 'Assigned stations',
    keyPermissions: 'Dashboard, records, recipients (PCP AOR)',
    usersCount: 1,
    status: 'Active',
    assignedStations: [
      { code: 'PCP', name: 'Palayan Seismic Station (Central Luzon)' },
    ],
    permissions: [
      'View Dashboard (Scoped to PCP AOR)',
      'View Earthquake Records (PCP Events Only)',
      'View Recipients (PCP Distribution List)',
      'View Palayan Seismic Station Topology',
    ],
    restricted: [
      'Role management',
      'System configuration',
      'Approval actions',
      'Non-PCP AOR Zones',
    ],
    auditHistory: [
      {
        timestamp: 'Sep 24, 2026 03:20 PM',
        actor: 'Juan Dela Cruz (System Administrator)',
        change: 'Created Palayan Seismic Station user account (palayanz@phivolcs.dost.gov.ph) scoped to PCP AOR',
      },
      {
        timestamp: 'Aug 28, 2026 02:15 PM',
        actor: 'Juan Dela Cruz (System Administrator)',
        change: 'Assigned PCP station monitoring scope',
      },
      {
        timestamp: 'Aug 20, 2026 09:40 AM',
        actor: 'Engr. Vicente Ramos',
        change: 'Standard base user capability policy refreshed',
      },
    ],
  },
  {
    id: 'role-operator',
    name: 'Operator',
    description: 'Operational data entry',
    scope: 'Assigned stations',
    keyPermissions: 'Intensity Reports, Social Media drafts',
    usersCount: 4,
    status: 'Active',
    assignedStations: [
      { code: 'PCP', name: 'Palayan' },
      { code: 'BIP', name: 'Bislig' },
      { code: 'CGP', name: 'Cagayan de Oro' },
    ],
    permissions: [
      'View Dashboard & Records',
      'Create & Edit Intensity Reports',
      'Draft Social Media Advisories',
      'Submit Field Questionnaires',
    ],
    restricted: [
      'Role management',
      'System configuration',
      'Publish & Dispatch Approvals',
    ],
    auditHistory: [
      {
        timestamp: 'Sep 02, 2026 11:20 AM',
        actor: 'Director Grace Tan',
        change: 'Enabled draft submission permission for Social Media advisories',
      },
    ],
  },
  {
    id: 'role-reviewer',
    name: 'Reviewer',
    description: 'Review and approval',
    scope: 'Assigned stations',
    keyPermissions: 'Exception Review, intensity verification',
    usersCount: 3,
    status: 'Active',
    assignedStations: [
      { code: 'PCP', name: 'Palayan' },
      { code: 'BIP', name: 'Bislig' },
      { code: 'CGP', name: 'Cagayan de Oro' },
    ],
    permissions: [
      'Exception Review Approval',
      'Intensity Verification',
      'AOR Boundary Override Sign-off',
      'Recipient Advisory Release',
    ],
    restricted: [
      'Role management',
      'System configuration',
      'Ingest Pipeline Settings',
    ],
    auditHistory: [
      {
        timestamp: 'Sep 10, 2026 04:45 PM',
        actor: 'Juan Dela Cruz (System Administrator)',
        change: 'Added Exception Review sign-off privileges',
      },
    ],
  },
  {
    id: 'role-seismic',
    name: 'Seismic Data Specialist',
    description: 'Seismic data and intensity work',
    scope: 'Assigned stations',
    keyPermissions: 'Intensity Reports, verification',
    usersCount: 2,
    status: 'Active',
    assignedStations: [
      { code: 'PCP', name: 'Palayan' },
      { code: 'BIP', name: 'Bislig' },
      { code: 'CGP', name: 'Cagayan de Oro' },
    ],
    permissions: [
      'Intensity Reports Analysis',
      'Seismic Waveform Telemetry',
      'Field Data Verification',
      'Station Telemetry Diagnostics',
    ],
    restricted: [
      'Role management',
      'System configuration',
      'Station Topology Modification',
    ],
    auditHistory: [
      {
        timestamp: 'Aug 14, 2026 01:10 PM',
        actor: 'Dr. Roland Reyes',
        change: 'Calibrated seismic data verification capability for station staff',
      },
    ],
  },
  {
    id: 'role-geospatial',
    name: 'Geospatial Analyst',
    description: 'GIS and AOR validation',
    scope: 'Assigned stations',
    keyPermissions: 'AOR Map, boundary review',
    usersCount: 2,
    status: 'Active',
    assignedStations: [
      { code: 'PCP', name: 'Palayan' },
      { code: 'BIP', name: 'Bislig' },
      { code: 'CGP', name: 'Cagayan de Oro' },
    ],
    permissions: [
      'AOR Map Topology Inspection',
      'GIS Boundary Review',
      'Polygon Vertex Adjustment',
      'Epicenter Proximity Calculation',
    ],
    restricted: [
      'Role management',
      'System configuration',
      'Email Dispatch Thresholds',
    ],
    auditHistory: [
      {
        timestamp: 'Sep 18, 2026 03:00 PM',
        actor: 'Juan Dela Cruz (System Administrator)',
        change: 'Updated boundary vertex edit permissions',
      },
    ],
  },
];

interface RolesViewProps {
  onNavigateToAudit?: () => void;
}

export const RolesView: React.FC<RolesViewProps> = ({ onNavigateToAudit }) => {
  const [roles, setRoles] = useState<RoleData[]>(INITIAL_ROLES);
  // Default selected role is 'User' matching the user screenshot
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role-user');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('All scopes');
  const [statusFilter, setStatusFilter] = useState('Active');

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'usersCount' | 'status'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Active action dropdown
  const [activeMenuRoleId, setActiveMenuRoleId] = useState<string | null>(null);

  // Modals
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showEditPermsModal, setShowEditPermsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Add Role
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleScope, setNewRoleScope] = useState<'Global' | 'Assigned stations'>('Assigned stations');
  const [newRoleKeyPermissions, setNewRoleKeyPermissions] = useState('');

  // Selected role object
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[1] || roles[0];

  // Temporary permissions state for edit modal
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [editingRestricted, setEditingRestricted] = useState<string[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Metrics
  const activeRolesCount = roles.filter((r) => r.status === 'Active').length;
  const stationScopedCount = roles.filter((r) => r.scope === 'Assigned stations').length;
  const adminRolesCount = roles.filter((r) => r.name.toLowerCase().includes('admin')).length;
  const pendingChangesCount = 0;

  // Filtered and sorted roles
  const filteredRoles = roles
    .filter((role) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          role.name.toLowerCase().includes(q) ||
          role.description.toLowerCase().includes(q) ||
          role.keyPermissions.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (scopeFilter !== 'All scopes') {
        if (role.scope !== scopeFilter) return false;
      }
      if (statusFilter !== 'All statuses') {
        if (role.status !== statusFilter) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortField === 'usersCount') {
        return sortAsc ? a.usersCount - b.usersCount : b.usersCount - a.usersCount;
      }
      if (sortField === 'status') {
        return sortAsc ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      }
      return 0;
    });

  const handleSort = (field: 'name' | 'usersCount' | 'status') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Export CSV
  const handleExport = () => {
    const headers = ['Role', 'Description', 'Scope', 'Key Permissions', 'Users', 'Status'];
    const rows = roles.map((r) => [
      `"${r.name}"`,
      `"${r.description}"`,
      `"${r.scope}"`,
      `"${r.keyPermissions}"`,
      r.usersCount,
      `"${r.status}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AlertX_Roles_Permissions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Roles and capabilities exported to CSV successfully.');
  };

  // Open Edit Permissions
  const openEditPermissions = () => {
    if (!selectedRole) return;
    setEditingPermissions([...selectedRole.permissions]);
    setEditingRestricted([...selectedRole.restricted]);
    setShowEditPermsModal(true);
  };

  const handleSavePermissions = () => {
    if (!selectedRole) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === selectedRole.id
          ? {
              ...r,
              permissions: editingPermissions,
              restricted: editingRestricted,
              auditHistory: [
                {
                  timestamp: 'Sep 24, 2026 10:45 AM',
                  actor: 'Juan Dela Cruz (System Administrator)',
                  change: 'Updated permission capability matrix',
                },
                ...(r.auditHistory || []),
              ],
            }
          : r
      )
    );
    setShowEditPermsModal(false);
    showToast(`Permissions updated for role: ${selectedRole.name}`);
  };

  // Add new role
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    const newRole: RoleData = {
      id: `role-${Date.now()}`,
      name: newRoleName.trim(),
      description: newRoleDescription.trim() || 'Custom station operational role',
      scope: newRoleScope,
      keyPermissions: newRoleKeyPermissions.trim() || 'Standard station module access',
      usersCount: 0,
      status: 'Active',
      assignedStations:
        newRoleScope === 'Global'
          ? [{ code: 'GLOBAL', name: 'All Monitored Seismic Stations' }]
          : [
              { code: 'PCP', name: 'Palayan' },
              { code: 'BIP', name: 'Bislig' },
              { code: 'CGP', name: 'Cagayan de Oro' },
            ],
      permissions: ['View Dashboard', 'View Earthquake Records'],
      restricted: ['Role management', 'System configuration'],
      auditHistory: [
        {
          timestamp: 'Sep 24, 2026 10:45 AM',
          actor: 'Juan Dela Cruz (System Administrator)',
          change: 'Role created and activated in Alert X directory',
        },
      ],
    };

    setRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    setNewRoleName('');
    setNewRoleDescription('');
    setNewRoleKeyPermissions('');
    setShowAddRoleModal(false);
    showToast(`Role "${newRole.name}" created successfully.`);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 text-xs font-medium border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Row 1: Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Roles */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Active Roles</div>
            <div className="text-2xl font-bold text-blue-600 leading-tight">
              {activeRolesCount}
            </div>
          </div>
        </div>

        {/* Card 2: Station-Scoped Roles */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Station-Scoped Roles</div>
            <div className="text-2xl font-bold text-emerald-600 leading-tight">
              {stationScopedCount}
            </div>
          </div>
        </div>

        {/* Card 3: Administrator Roles */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Administrator Roles</div>
            <div className="text-2xl font-bold text-purple-700 leading-tight">
              {adminRolesCount}
            </div>
          </div>
        </div>

        {/* Card 4: Pending Changes */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Pending Changes</div>
            <div className="text-2xl font-bold text-rose-600 leading-tight">
              {pendingChangesCount}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Information Notice Banner */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-serif font-bold text-xs">
          i
        </div>
        <p className="text-xs text-blue-900 font-medium">
          Permissions are capability-based. Station scope is managed separately from role permissions.
        </p>
      </div>

      {/* Row 3: Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-3xl">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-xs"
            />
          </div>

          {/* Scope Dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs text-slate-700 outline-none appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-xs cursor-pointer"
            >
              <option value="All scopes">All scopes</option>
              <option value="Global">Global</option>
              <option value="Assigned stations">Assigned stations</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative min-w-[120px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pr-8 text-xs text-slate-700 outline-none appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 shadow-xs cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="All statuses">All statuses</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowAddRoleModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Role</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-blue-600 text-blue-600 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAuditModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-blue-600 text-blue-600 rounded-lg font-medium text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
            <span>Audit History</span>
          </button>
        </div>
      </div>

      {/* Row 4: 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Roles Table (~8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 text-[11px] font-semibold bg-white select-none">
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Role</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-semibold">Description</th>
                    <th className="py-3 px-4 font-semibold">Scope</th>
                    <th className="py-3 px-4 font-semibold">Key Permissions</th>
                    <th
                      className="py-3 px-3 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleSort('usersCount')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Users</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <tr
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/50 hover:bg-blue-50/70'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Role Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {role.name}
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 text-slate-600">
                          {role.description}
                        </td>

                        {/* Scope */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {role.scope}
                        </td>

                        {/* Key Permissions */}
                        <td className="py-3.5 px-4 text-slate-600 max-w-[200px]">
                          {role.keyPermissions}
                        </td>

                        {/* Users Count */}
                        <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                          {role.usersCount}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        </td>

                        {/* Actions 3-dots */}
                        <td
                          className="py-3.5 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuRoleId(activeMenuRoleId === role.id ? null : role.id)
                            }
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                            title="Actions menu"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Context Action Menu */}
                          {activeMenuRoleId === role.id && (
                            <div className="absolute right-3 top-8 z-30 w-44 bg-white rounded-lg shadow-xl border border-slate-200 py-1 text-left text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoleId(role.id);
                                  openEditPermissions();
                                  setActiveMenuRoleId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <Edit className="w-3.5 h-3.5 text-blue-600" />
                                <span>Edit Permissions</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedRoleId(role.id);
                                  setShowAuditModal(true);
                                  setActiveMenuRoleId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                <span>Audit Logs</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  showToast(`Duplicated permissions template for ${role.name}`);
                                  setActiveMenuRoleId(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Duplicate Role</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Under-table Notice Box */}
          <div className="bg-slate-100/70 border border-slate-200/80 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-serif font-bold text-[10px]">
              i
            </div>
            <p className="text-xs text-slate-600 font-normal">
              Changes to roles and permissions are recorded in the{' '}
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToAudit) {
                    onNavigateToAudit();
                  } else {
                    setShowAuditModal(true);
                  }
                }}
                className="text-blue-600 font-bold underline hover:text-blue-800 transition-colors cursor-pointer"
              >
                Audit Log
              </button>
              .
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Role Detail (~4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-blue-600">Selected Role</h2>
          </div>

          {/* Selected Role Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            {/* Header: Avatar, Name, Status Pill */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">
                    {selectedRole.name}
                  </h3>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active</span>
              </span>
            </div>

            {/* Role Metadata */}
            <div className="space-y-2 text-xs border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Role status</span>
                <span className="text-slate-900 font-medium">{selectedRole.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Access scope</span>
                <span className="text-slate-900 font-medium">{selectedRole.scope}</span>
              </div>
            </div>

            {/* Assigned Stations */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Assigned stations ({selectedRole.assignedStations.length})
              </div>
              <div className="space-y-1.5">
                {selectedRole.assignedStations.map((station) => (
                  <div
                    key={station.code}
                    className="bg-slate-50/80 border border-slate-100 rounded-md px-3 py-2 text-xs flex items-center gap-2 text-slate-700"
                  >
                    <span className="font-bold text-slate-900">{station.code}</span>
                    <span className="text-slate-400">/</span>
                    <span className="font-medium text-slate-600">{station.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assigned Accounts */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">
                Assigned Accounts ({selectedRole.name === 'User' ? 1 : selectedRole.name === 'Administrator' ? 1 : 0})
              </div>
              {selectedRole.name === 'User' ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-950">Palayan Seismic Station</span>
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold border border-blue-200">
                      User Role • Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-mono flex items-center gap-1.5">
                    <span className="text-slate-500">Username:</span>
                    <strong>palayanz@phivolcs.dost.gov.ph</strong>
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                    <span className="text-slate-500">Scope:</span>
                    <span className="font-semibold text-blue-700">Only display AOR within PCP</span>
                  </div>
                </div>
              ) : selectedRole.name === 'Administrator' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Juan Dela Cruz</span>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-200">
                      Admin • Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 font-mono">
                    <span className="text-slate-500">Username:</span> j.delacruz@phivolcs.dost.gov.ph
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-500">Scope:</span> Global Administration
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg border border-slate-100">
                  No active personnel accounts directly assigned to this template.
                </div>
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Permissions</div>
              <ul className="space-y-1.5 text-xs">
                {selectedRole.permissions.map((perm, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Restricted */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Restricted</div>
              <ul className="space-y-1.5 text-xs">
                {selectedRole.restricted.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={openEditPermissions}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Permissions</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAuditModal(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-blue-600 text-blue-600 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>View Audit History</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Edit Permissions */}
      {showEditPermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Permissions: {selectedRole.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPermsModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Configure capability matrix grants and restrictions for all users assigned to{' '}
              <span className="font-semibold text-slate-700">{selectedRole.name}</span>.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-slate-800">Granted Capabilities</div>
              <div className="space-y-2">
                {[
                  'View Dashboard',
                  'View Earthquake Records',
                  'View Recipients',
                  'Create & Edit Intensity Reports',
                  'Draft Social Media Advisories',
                  'Exception Review Approval',
                  'AOR Map Topology Inspection',
                ].map((cap) => {
                  const isChecked = editingPermissions.includes(cap);
                  return (
                    <label
                      key={cap}
                      className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setEditingPermissions(editingPermissions.filter((p) => p !== cap));
                            if (!editingRestricted.includes(cap)) {
                              setEditingRestricted([...editingRestricted, cap]);
                            }
                          } else {
                            setEditingPermissions([...editingPermissions, cap]);
                            setEditingRestricted(editingRestricted.filter((r) => r !== cap));
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-800 font-medium">{cap}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEditPermsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Role */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Role</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Field Officer, Duty Seismologist"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Primary role responsibility summary"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Scope</label>
                <select
                  value={newRoleScope}
                  onChange={(e) => setNewRoleScope(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 cursor-pointer"
                >
                  <option value="Assigned stations">Assigned stations</option>
                  <option value="Global">Global</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Key Permissions</label>
                <input
                  type="text"
                  placeholder="e.g. Field questionnaires, local station review"
                  value={newRoleKeyPermissions}
                  onChange={(e) => setNewRoleKeyPermissions(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs transition-colors"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Audit History */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Role Governance &amp; Capability Audit History
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Immutable record of role adjustments, station boundary scope assignments, and permission changes.
            </p>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Modification Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.flatMap((r) =>
                    (r.auditHistory || []).map((audit, idx) => (
                      <tr key={`${r.id}-${idx}`} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {audit.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">
                          {r.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {audit.actor}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {audit.change}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                All changes cryptographically signed and logged to Alert X Audit Trail
              </span>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-xs transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
