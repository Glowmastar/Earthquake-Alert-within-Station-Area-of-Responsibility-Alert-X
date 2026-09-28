export type AORType = 'PCP' | 'BIP' | 'CGP' | 'Outside AOR';

export type AlertStatus =
  | 'Alert Sent'
  | 'Pending Alert'
  | 'For Review'
  | 'No Alert'
  | 'Pending'
  | 'Outside AOR'
  | 'Duplicate';

export interface EarthquakeRecord {
  id: string;
  timePHT: string;
  date: string;
  location: string;
  magnitude: number;
  depthKm: number;
  aor: AORType;
  status: AlertStatus;
  coordinates: {
    lat: number;
    lng: number;
  };
  isRecent24h: boolean;
  intensity?: string;
  source: string;
  faultSystem?: string;
  province?: string;
  municipality?: string;
  provinceMunicipality?: string;
  aorStatus?: 'Inside' | 'Outside';
  stationName?: string;
  matchedAORFull?: string;
  recipientName?: string;
  recipientRole?: string;
  deliveryStatus?: 'Success' | 'Pending' | 'Under Review' | 'Failed';
  datasetVersion?: string;
  coordinateLocation?: string;
  nearestStation?: string;
  distanceToBoundaryKm?: number;
  epicenterZone?: string;
  outsideReason?: string;
  alertDetails?: {
    sentAt?: string;
    recipientsCount?: number;
    deliveryRate?: string;
    notes?: string;
  };
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  agency: string;
  aor: 'PCP' | 'BIP' | 'CGP';
  minMagnitude: number;
  status: 'Active' | 'Inactive';
  lastAlertSent?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 'PHIVOLCS_SYNC' | 'AOR_CHECK' | 'ALERT_DISPATCH' | 'EXCEPTION_REVIEW' | 'SETTINGS_UPDATE';
  description: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR' | 'FLAGGED';
  details: string;
  actor: string;
}

export interface AORZoneInfo {
  id?: 'PCP' | 'BIP' | 'CGP';
  name: string;
  fullName: string;
  region: string;
  color: string;
  fillColor?: string;
  strokeColor?: string;
  recipientsCount: number;
  activeIncidents?: number;
  centerCoordinates: { lat: number; lng: number };
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'Administrator' | 'User' | 'Supervisor';
  assignedAor: 'PCP' | 'BIP' | 'CGP' | 'ALL' | string;
  stationName?: string;
}

export const PRECONFIGURED_USERS: Record<string, UserProfile & { passwordPlainText: string }> = {
  'palayanz@phivolcs.dost.gov.ph': {
    id: 'user-pcp-palayan',
    username: 'palayanz@phivolcs.dost.gov.ph',
    email: 'palayanz@phivolcs.dost.gov.ph',
    name: 'Palayan Seismic Station',
    role: 'User',
    assignedAor: 'PCP',
    stationName: 'PCP - Palayan Seismic Station (Central Luzon)',
    passwordPlainText: '12345',
  },
  'j.delacruz@phivolcs.dost.gov.ph': {
    id: 'user-admin-global',
    username: 'j.delacruz@phivolcs.dost.gov.ph',
    email: 'j.delacruz@phivolcs.dost.gov.ph',
    name: 'Juan Dela Cruz',
    role: 'Administrator',
    assignedAor: 'ALL',
    stationName: 'PHIVOLCS Central Seismology (Global)',
    passwordPlainText: '12345',
  },
};

