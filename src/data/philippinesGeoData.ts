/**
 * Real geographic data for the Philippines:
 * All 17 Administrative Regions, 82 Provinces, Seismic Monitoring Stations,
 * and Station Area of Responsibility (AOR) boundaries for PHIVOLCS.
 */

export interface PhilippineRegion {
  id: string;
  code: string;
  name: string;
  shortName: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
  center: [number, number]; // [lat, lng]
  zoom: number;
  color: string;
  provinces: string[];
  boundary: [number, number][]; // [lat, lng] coordinates
}

export interface PhilippineProvince {
  name: string;
  regionId: string;
  regionCode: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
  capital: string;
  center: [number, number]; // [lat, lng]
  boundary?: [number, number][]; // Polygon coordinates
}

import {
  PHIVOLCS_SCSS_NETWORK,
  ALL_SCSS_STATIONS,
  ALL_STSS_SUBSTATIONS,
  MIMAROPA_DEMOGRAPHICS,
  SCSSStationAOR,
  STSSSubStation,
  DemographicData,
} from './phivolcsAorNetwork';
import { CGP_SNAPPED_AOR_COORDINATES, CGP_AOR_PROVINCES } from './cgpSnappedAorData';
import { ALL_SNAPPED_STATION_AORS } from './allSnappedAorData';

export {
  PHIVOLCS_SCSS_NETWORK,
  ALL_SCSS_STATIONS,
  ALL_STSS_SUBSTATIONS,
  MIMAROPA_DEMOGRAPHICS,
  CGP_SNAPPED_AOR_COORDINATES,
  CGP_AOR_PROVINCES,
  ALL_SNAPPED_STATION_AORS,
};
export type { SCSSStationAOR, STSSSubStation, DemographicData };

export interface SeismicStation {
  code: string;
  name: string;
  fullName: string;
  location: string;
  type: 'AOR Head' | 'Network Station' | 'Regional' | 'SCSS' | 'STSS';
  coordinates: [number, number]; // [lat, lng]
  aorZone?: string;
  parentScss?: string;
  islandGroup?: 'Luzon' | 'Visayas' | 'Mindanao';
  color: string;
}

export interface AORBoundary {
  code: string;
  name: string;
  headquarters: string;
  islandGroup: 'Luzon' | 'Visayas' | 'Mindanao';
  provincesIncluded: string[];
  coordinates: [number, number][] | [number, number][][] | [number, number][][][]; // Polygon or MultiPolygon [lat, lng]
  fillColor: string;
  strokeColor: string;
}

// 17 Administrative Regions of the Philippines with realistic boundary polygons
export const PHILIPPINES_REGIONS: PhilippineRegion[] = [
  {
    id: 'NCR',
    code: 'NCR',
    name: 'National Capital Region (Metro Manila)',
    shortName: 'NCR',
    islandGroup: 'Luzon',
    center: [14.5995, 120.9842],
    zoom: 11,
    color: '#3b82f6',
    provinces: ['Metro Manila'],
    boundary: [
      [14.78, 120.95],
      [14.78, 121.12],
      [14.65, 121.15],
      [14.48, 121.08],
      [14.38, 121.02],
      [14.42, 120.95],
      [14.55, 120.92],
      [14.78, 120.95],
    ],
  },
  {
    id: 'CAR',
    code: 'CAR',
    name: 'Cordillera Administrative Region',
    shortName: 'CAR',
    islandGroup: 'Luzon',
    center: [17.3, 121.0],
    zoom: 8,
    color: '#0284c7',
    provinces: ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
    boundary:
      (ALL_SNAPPED_STATION_AORS.find((a) => a.code === 'BCP')?.coordinates[0] as [number, number][]) || [
        [18.5, 121.1],
        [18.3, 121.5],
        [17.8, 121.4],
        [17.0, 121.4],
        [16.4, 120.9],
        [16.2, 120.5],
        [16.6, 120.5],
        [17.2, 120.6],
        [17.7, 120.8],
        [18.5, 121.1],
      ],
  },
  {
    id: 'REGION_1',
    code: 'Region I',
    name: 'Ilocos Region',
    shortName: 'Ilocos',
    islandGroup: 'Luzon',
    center: [16.8, 120.4],
    zoom: 8,
    color: '#06b6d4',
    provinces: ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
    boundary: [
      [18.6, 120.5],
      [18.3, 120.9],
      [17.5, 120.7],
      [16.7, 120.4],
      [16.2, 120.4],
      [15.8, 120.5],
      [15.8, 119.8],
      [16.4, 120.2],
      [17.4, 120.3],
      [18.2, 120.5],
      [18.6, 120.5],
    ],
  },
  {
    id: 'REGION_2',
    code: 'Region II',
    name: 'Cagayan Valley',
    shortName: 'Cagayan Valley',
    islandGroup: 'Luzon',
    center: [17.2, 121.8],
    zoom: 8,
    color: '#0d9488',
    provinces: ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
    boundary: [
      [18.6, 121.1],
      [18.6, 122.3],
      [17.5, 122.4],
      [16.6, 122.3],
      [16.1, 121.6],
      [16.2, 121.1],
      [17.0, 121.4],
      [17.8, 121.5],
      [18.6, 121.1],
    ],
  },
  {
    id: 'REGION_3',
    code: 'Region III',
    name: 'Central Luzon',
    shortName: 'Central Luzon',
    islandGroup: 'Luzon',
    center: [15.4, 120.8],
    zoom: 8,
    color: '#2563eb',
    provinces: ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
    boundary: [
      [16.3, 121.4],
      [16.3, 122.3],
      [15.0, 121.6],
      [14.7, 121.2],
      [14.4, 120.6],
      [14.8, 120.2],
      [15.3, 119.8],
      [15.9, 119.8],
      [15.9, 120.6],
      [16.3, 121.4],
    ],
  },
  {
    id: 'REGION_4A',
    code: 'Region IV-A',
    name: 'CALABARZON',
    shortName: 'CALABARZON',
    islandGroup: 'Luzon',
    center: [14.1, 121.4],
    zoom: 8,
    color: '#4f46e5',
    provinces: ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
    boundary: [
      [14.8, 121.2],
      [15.0, 121.7],
      [14.4, 122.4],
      [13.8, 122.8],
      [13.4, 122.5],
      [13.6, 121.4],
      [13.6, 120.6],
      [14.2, 120.6],
      [14.6, 121.1],
      [14.8, 121.2],
    ],
  },
  {
    id: 'REGION_4B',
    code: 'MIMAROPA',
    name: 'MIMAROPA Region',
    shortName: 'MIMAROPA',
    islandGroup: 'Luzon',
    center: [11.5, 119.5],
    zoom: 7,
    color: '#7c3aed',
    provinces: ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
    boundary: [
      [13.5, 120.4],
      [13.5, 121.5],
      [13.1, 122.2],
      [12.2, 122.7],
      [12.0, 121.2],
      [11.8, 120.0],
      [10.0, 118.5],
      [8.5, 117.2],
      [9.5, 118.0],
      [11.0, 119.3],
      [12.3, 120.0],
      [13.5, 120.4],
    ],
  },
  {
    id: 'REGION_5',
    code: 'Region V',
    name: 'Bicol Region',
    shortName: 'Bicol',
    islandGroup: 'Luzon',
    center: [13.2, 123.6],
    zoom: 8,
    color: '#10b981',
    provinces: ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
    boundary: [
      [14.3, 122.5],
      [14.3, 123.1],
      [14.0, 124.3],
      [13.5, 124.4],
      [12.7, 124.2],
      [12.2, 123.9],
      [11.8, 123.3],
      [12.2, 123.2],
      [13.0, 123.4],
      [13.6, 123.1],
      [13.8, 122.7],
      [14.3, 122.5],
    ],
  },
  {
    id: 'REGION_6',
    code: 'Region VI',
    name: 'Western Visayas',
    shortName: 'Western Visayas',
    islandGroup: 'Visayas',
    center: [11.0, 122.5],
    zoom: 8,
    color: '#14b8a6',
    provinces: ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo', 'Negros Occidental'],
    boundary: [
      [11.8, 122.0],
      [11.8, 123.2],
      [11.1, 123.4],
      [10.6, 123.5],
      [9.8, 123.0],
      [9.2, 122.5],
      [10.0, 122.0],
      [10.6, 122.0],
      [11.0, 122.0],
      [11.8, 122.0],
    ],
  },
  {
    id: 'REGION_7',
    code: 'Region VII',
    name: 'Central Visayas',
    shortName: 'Central Visayas',
    islandGroup: 'Visayas',
    center: [10.0, 123.7],
    zoom: 8,
    color: '#059669',
    provinces: ['Bohol', 'Cebu', 'Negros Oriental', 'Siquijor'],
    boundary: [
      [11.3, 123.8],
      [11.3, 124.1],
      [10.3, 124.6],
      [9.6, 124.6],
      [9.2, 123.6],
      [9.0, 123.0],
      [9.6, 122.8],
      [10.3, 123.2],
      [11.0, 123.8],
      [11.3, 123.8],
    ],
  },
  {
    id: 'REGION_8',
    code: 'Region VIII',
    name: 'Eastern Visayas',
    shortName: 'Eastern Visayas',
    islandGroup: 'Visayas',
    center: [11.5, 125.0],
    zoom: 8,
    color: '#16a34a',
    provinces: ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
    boundary: [
      [12.6, 124.3],
      [12.6, 125.4],
      [11.9, 125.6],
      [11.0, 125.8],
      [9.9, 125.3],
      [10.1, 124.7],
      [10.8, 124.5],
      [11.6, 124.3],
      [12.2, 124.3],
      [12.6, 124.3],
    ],
  },
  {
    id: 'REGION_9',
    code: 'Region IX',
    name: 'Zamboanga Peninsula',
    shortName: 'Zamboanga',
    islandGroup: 'Mindanao',
    center: [7.8, 122.8],
    zoom: 8,
    color: '#e11d48',
    provinces: ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
    boundary: [
      [8.6, 123.0],
      [8.5, 123.7],
      [7.8, 123.6],
      [7.2, 123.0],
      [6.9, 122.0],
      [7.5, 122.1],
      [8.0, 122.4],
      [8.6, 123.0],
    ],
  },
  {
    id: 'REGION_10',
    code: 'Region X',
    name: 'Northern Mindanao',
    shortName: 'Northern Mindanao',
    islandGroup: 'Mindanao',
    center: [8.2, 124.8],
    zoom: 8,
    color: '#9333ea',
    provinces: ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
    boundary: [
      [9.2, 124.7],
      [9.0, 125.2],
      [8.5, 125.3],
      [7.6, 125.2],
      [7.5, 124.5],
      [7.8, 123.8],
      [8.3, 123.7],
      [8.7, 124.2],
      [9.2, 124.7],
    ],
  },
  {
    id: 'REGION_11',
    code: 'Region XI',
    name: 'Davao Region',
    shortName: 'Davao',
    islandGroup: 'Mindanao',
    center: [7.2, 125.8],
    zoom: 8,
    color: '#c026d3',
    provinces: ['Davao de Oro', 'Davao del Norte', 'Davao del Sur', 'Davao Occidental', 'Davao Oriental'],
    boundary: [
      [7.9, 125.5],
      [7.9, 126.5],
      [7.4, 126.6],
      [6.4, 126.2],
      [5.5, 125.6],
      [6.0, 125.4],
      [6.8, 125.3],
      [7.5, 125.3],
      [7.9, 125.5],
    ],
  },
  {
    id: 'REGION_12',
    code: 'Region XII',
    name: 'SOCCSKSARGEN',
    shortName: 'SOCCSKSARGEN',
    islandGroup: 'Mindanao',
    center: [6.6, 124.8],
    zoom: 8,
    color: '#ea580c',
    provinces: ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
    boundary: [
      [7.5, 124.5],
      [7.5, 125.2],
      [6.6, 125.3],
      [6.0, 125.4],
      [5.6, 125.2],
      [6.0, 124.4],
      [6.6, 124.0],
      [7.2, 124.2],
      [7.5, 124.5],
    ],
  },
  {
    id: 'REGION_13',
    code: 'Region XIII',
    name: 'Caraga Region',
    shortName: 'Caraga',
    islandGroup: 'Mindanao',
    center: [8.8, 125.8],
    zoom: 8,
    color: '#84cc16',
    provinces: ['Agusan del Norte', 'Agusan del Sur', 'Dinagat Islands', 'Surigao del Norte', 'Surigao del Sur'],
    boundary: [
      [10.2, 125.6],
      [10.1, 126.0],
      [9.5, 126.3],
      [8.5, 126.5],
      [7.9, 126.2],
      [7.9, 125.5],
      [8.5, 125.4],
      [9.2, 125.3],
      [9.8, 125.4],
      [10.2, 125.6],
    ],
  },
  {
    id: 'BARMM',
    code: 'BARMM',
    name: 'Bangsamoro Autonomous Region in Muslim Mindanao',
    shortName: 'BARMM',
    islandGroup: 'Mindanao',
    center: [7.2, 124.2],
    zoom: 8,
    color: '#d97706',
    provinces: ['Basilan', 'Lanao del Sur', 'Maguindanao del Norte', 'Maguindanao del Sur', 'Sulu', 'Tawi-Tawi'],
    boundary: [
      [8.0, 124.1],
      [7.8, 124.7],
      [7.2, 124.8],
      [6.7, 124.2],
      [7.0, 123.8],
      [6.6, 122.2],
      [5.8, 121.0],
      [5.0, 120.0],
      [5.4, 119.8],
      [6.1, 121.2],
      [6.9, 122.0],
      [7.4, 123.5],
      [8.0, 124.1],
    ],
  },
];

// Philippine Provinces (Centroids and Info)
export const PHILIPPINES_PROVINCES: PhilippineProvince[] = [
  // LUZON
  { name: 'Ilocos Norte', regionId: 'REGION_1', regionCode: 'Region I', islandGroup: 'Luzon', capital: 'Laoag', center: [18.19, 120.6] },
  { name: 'Ilocos Sur', regionId: 'REGION_1', regionCode: 'Region I', islandGroup: 'Luzon', capital: 'Vigan', center: [17.3, 120.5] },
  { name: 'La Union', regionId: 'REGION_1', regionCode: 'Region I', islandGroup: 'Luzon', capital: 'San Fernando', center: [16.6, 120.35] },
  { name: 'Pangasinan', regionId: 'REGION_1', regionCode: 'Region I', islandGroup: 'Luzon', capital: 'Lingayen', center: [15.9, 120.3] },
  { name: 'Batanes', regionId: 'REGION_2', regionCode: 'Region II', islandGroup: 'Luzon', capital: 'Basco', center: [20.45, 121.97] },
  { name: 'Cagayan', regionId: 'REGION_2', regionCode: 'Region II', islandGroup: 'Luzon', capital: 'Tuguegarao', center: [18.2, 121.8] },
  { name: 'Isabela', regionId: 'REGION_2', regionCode: 'Region II', islandGroup: 'Luzon', capital: 'Ilagan', center: [16.9, 121.9] },
  { name: 'Nueva Vizcaya', regionId: 'REGION_2', regionCode: 'Region II', islandGroup: 'Luzon', capital: 'Bayombong', center: [16.3, 121.2] },
  { name: 'Quirino', regionId: 'REGION_2', regionCode: 'Region II', islandGroup: 'Luzon', capital: 'Cabarroguis', center: [16.3, 121.6] },
  { name: 'Abra', regionId: 'CAR', regionCode: 'CAR', islandGroup: 'Luzon', capital: 'Bangued', center: [17.6, 120.8] },
  { name: 'Apayao', regionId: 'CAR', regionCode: 'CAR', islandGroup: 'Luzon', capital: 'Kabugao', center: [18.1, 121.3] },
  { name: 'Benguet', regionId: 'CAR', regionCode: 'CAR', islandGroup: 'Luzon', capital: 'La Trinidad', center: [16.5, 120.7] },
  { name: 'Ifugao', regionId: 'CAR', regionCode: 'CAR', islandGroup: 'Luzon', capital: 'Lagawe', center: [16.8, 121.1] },
  { name: 'Kalinga', regionId: 'CAR', regionCode: 'CAR', islandGroup: 'Luzon', capital: 'Tabuk', center: [17.4, 121.3] },
  { name: 'Mountain Province', regionId: 'CAR', regionCode: 'CAR', islandGroup: 'Luzon', capital: 'Bontoc', center: [17.1, 121.0] },
  { name: 'Aurora', regionId: 'REGION_3', regionCode: 'Region III', islandGroup: 'Luzon', capital: 'Baler', center: [15.8, 121.6] },
  { name: 'Bataan', regionId: 'REGION_3', regionCode: 'Region III', islandGroup: 'Luzon', capital: 'Balanga', center: [14.6, 120.4] },
  { name: 'Bulacan', regionId: 'REGION_3', regionCode: 'Region III', islandGroup: 'Luzon', capital: 'Malolos', center: [14.9, 121.0] },
  { name: 'Nueva Ecija', regionId: 'REGION_3', regionCode: 'Region III', islandGroup: 'Luzon', capital: 'Palayan', center: [15.54, 121.08] },
  { name: 'Pampanga', regionId: 'REGION_3', regionCode: 'Region III', islandGroup: 'Luzon', capital: 'San Fernando', center: [15.05, 120.65] },
  { name: 'Tarlac', regionId: 'REGION_3', regionCode: 'Region III', islandGroup: 'Luzon', capital: 'Tarlac City', center: [15.5, 120.5] },
  { name: 'Zambales', regionId: 'REGION_3', regionCode: 'Region III', islandGroup: 'Luzon', capital: 'Iba', center: [15.3, 120.1] },
  { name: 'Metro Manila', regionId: 'NCR', regionCode: 'NCR', islandGroup: 'Luzon', capital: 'Manila', center: [14.6, 121.0] },
  { name: 'Batangas', regionId: 'REGION_4A', regionCode: 'Region IV-A', islandGroup: 'Luzon', capital: 'Batangas City', center: [13.9, 121.1] },
  { name: 'Cavite', regionId: 'REGION_4A', regionCode: 'Region IV-A', islandGroup: 'Luzon', capital: 'Imus', center: [14.25, 120.9] },
  { name: 'Laguna', regionId: 'REGION_4A', regionCode: 'Region IV-A', islandGroup: 'Luzon', capital: 'Santa Cruz', center: [14.2, 121.3] },
  { name: 'Quezon', regionId: 'REGION_4A', regionCode: 'Region IV-A', islandGroup: 'Luzon', capital: 'Lucena', center: [14.0, 121.9] },
  { name: 'Rizal', regionId: 'REGION_4A', regionCode: 'Region IV-A', islandGroup: 'Luzon', capital: 'Antipolo', center: [14.6, 121.3] },
  { name: 'Marinduque', regionId: 'REGION_4B', regionCode: 'MIMAROPA', islandGroup: 'Luzon', capital: 'Boac', center: [13.35, 121.95] },
  { name: 'Occidental Mindoro', regionId: 'REGION_4B', regionCode: 'MIMAROPA', islandGroup: 'Luzon', capital: 'Mamburao', center: [13.1, 120.7] },
  { name: 'Oriental Mindoro', regionId: 'REGION_4B', regionCode: 'MIMAROPA', islandGroup: 'Luzon', capital: 'Calapan', center: [13.0, 121.3] },
  { name: 'Palawan', regionId: 'REGION_4B', regionCode: 'MIMAROPA', islandGroup: 'Luzon', capital: 'Puerto Princesa', center: [9.8, 118.7] },
  { name: 'Romblon', regionId: 'REGION_4B', regionCode: 'MIMAROPA', islandGroup: 'Luzon', capital: 'Romblon', center: [12.5, 122.3] },
  { name: 'Albay', regionId: 'REGION_5', regionCode: 'Region V', islandGroup: 'Luzon', capital: 'Legazpi', center: [13.2, 123.7] },
  { name: 'Camarines Norte', regionId: 'REGION_5', regionCode: 'Region V', islandGroup: 'Luzon', capital: 'Daet', center: [14.15, 122.8] },
  { name: 'Camarines Sur', regionId: 'REGION_5', regionCode: 'Region V', islandGroup: 'Luzon', capital: 'Pili', center: [13.5, 123.3] },
  { name: 'Catanduanes', regionId: 'REGION_5', regionCode: 'Region V', islandGroup: 'Luzon', capital: 'Virac', center: [13.8, 124.2] },
  { name: 'Masbate', regionId: 'REGION_5', regionCode: 'Region V', islandGroup: 'Luzon', capital: 'Masbate City', center: [12.2, 123.5] },
  { name: 'Sorsogon', regionId: 'REGION_5', regionCode: 'Region V', islandGroup: 'Luzon', capital: 'Sorsogon City', center: [12.8, 123.95] },

  // VISAYAS
  { name: 'Aklan', regionId: 'REGION_6', regionCode: 'Region VI', islandGroup: 'Visayas', capital: 'Kalibo', center: [11.6, 122.3] },
  { name: 'Antique', regionId: 'REGION_6', regionCode: 'Region VI', islandGroup: 'Visayas', capital: 'San Jose de Buenavista', center: [11.1, 122.1] },
  { name: 'Capiz', regionId: 'REGION_6', regionCode: 'Region VI', islandGroup: 'Visayas', capital: 'Roxas', center: [11.4, 122.7] },
  { name: 'Guimaras', regionId: 'REGION_6', regionCode: 'Region VI', islandGroup: 'Visayas', capital: 'Jordan', center: [10.6, 122.6] },
  { name: 'Iloilo', regionId: 'REGION_6', regionCode: 'Region VI', islandGroup: 'Visayas', capital: 'Iloilo City', center: [11.0, 122.7] },
  { name: 'Negros Occidental', regionId: 'REGION_6', regionCode: 'Region VI', islandGroup: 'Visayas', capital: 'Bacolod', center: [10.2, 123.0] },
  { name: 'Bohol', regionId: 'REGION_7', regionCode: 'Region VII', islandGroup: 'Visayas', capital: 'Tagbilaran', center: [9.8, 124.2] },
  { name: 'Cebu', regionId: 'REGION_7', regionCode: 'Region VII', islandGroup: 'Visayas', capital: 'Cebu City', center: [10.3, 123.9] },
  { name: 'Negros Oriental', regionId: 'REGION_7', regionCode: 'Region VII', islandGroup: 'Visayas', capital: 'Dumaguete', center: [9.5, 123.1] },
  { name: 'Siquijor', regionId: 'REGION_7', regionCode: 'Region VII', islandGroup: 'Visayas', capital: 'Siquijor', center: [9.2, 123.55] },
  { name: 'Biliran', regionId: 'REGION_8', regionCode: 'Region VIII', islandGroup: 'Visayas', capital: 'Naval', center: [11.6, 124.5] },
  { name: 'Eastern Samar', regionId: 'REGION_8', regionCode: 'Region VIII', islandGroup: 'Visayas', capital: 'Borongan', center: [11.7, 125.4] },
  { name: 'Leyte', regionId: 'REGION_8', regionCode: 'Region VIII', islandGroup: 'Visayas', capital: 'Tacloban', center: [10.9, 124.8] },
  { name: 'Northern Samar', regionId: 'REGION_8', regionCode: 'Region VIII', islandGroup: 'Visayas', capital: 'Catarman', center: [12.4, 124.6] },
  { name: 'Samar', regionId: 'REGION_8', regionCode: 'Region VIII', islandGroup: 'Visayas', capital: 'Catbalogan', center: [11.8, 124.9] },
  { name: 'Southern Leyte', regionId: 'REGION_8', regionCode: 'Region VIII', islandGroup: 'Visayas', capital: 'Maasin', center: [10.2, 125.0] },

  // MINDANAO
  { name: 'Zamboanga del Norte', regionId: 'REGION_9', regionCode: 'Region IX', islandGroup: 'Mindanao', capital: 'Dipolog', center: [8.2, 123.0] },
  { name: 'Zamboanga del Sur', regionId: 'REGION_9', regionCode: 'Region IX', islandGroup: 'Mindanao', capital: 'Pagadian', center: [7.8, 123.3] },
  { name: 'Zamboanga Sibugay', regionId: 'REGION_9', regionCode: 'Region IX', islandGroup: 'Mindanao', capital: 'Ipil', center: [7.7, 122.7] },
  { name: 'Bukidnon', regionId: 'REGION_10', regionCode: 'Region X', islandGroup: 'Mindanao', capital: 'Malaybalay', center: [8.0, 125.0] },
  { name: 'Camiguin', regionId: 'REGION_10', regionCode: 'Region X', islandGroup: 'Mindanao', capital: 'Mambajao', center: [9.17, 124.73] },
  { name: 'Lanao del Norte', regionId: 'REGION_10', regionCode: 'Region X', islandGroup: 'Mindanao', capital: 'Tubod', center: [8.0, 124.0] },
  { name: 'Misamis Occidental', regionId: 'REGION_10', regionCode: 'Region X', islandGroup: 'Mindanao', capital: 'Oroquieta', center: [8.4, 123.7] },
  { name: 'Misamis Oriental', regionId: 'REGION_10', regionCode: 'Region X', islandGroup: 'Mindanao', capital: 'Cagayan de Oro', center: [8.6, 124.7] },
  { name: 'Davao de Oro', regionId: 'REGION_11', regionCode: 'Region XI', islandGroup: 'Mindanao', capital: 'Nabunturan', center: [7.5, 126.0] },
  { name: 'Davao del Norte', regionId: 'REGION_11', regionCode: 'Region XI', islandGroup: 'Mindanao', capital: 'Tagum', center: [7.5, 125.7] },
  { name: 'Davao del Sur', regionId: 'REGION_11', regionCode: 'Region XI', islandGroup: 'Mindanao', capital: 'Digos', center: [6.7, 125.4] },
  { name: 'Davao Occidental', regionId: 'REGION_11', regionCode: 'Region XI', islandGroup: 'Mindanao', capital: 'Malita', center: [6.2, 125.6] },
  { name: 'Davao Oriental', regionId: 'REGION_11', regionCode: 'Region XI', islandGroup: 'Mindanao', capital: 'Mati', center: [7.0, 126.3] },
  { name: 'Cotabato', regionId: 'REGION_12', regionCode: 'Region XII', islandGroup: 'Mindanao', capital: 'Kidapawan', center: [7.2, 125.0] },
  { name: 'Sarangani', regionId: 'REGION_12', regionCode: 'Region XII', islandGroup: 'Mindanao', capital: 'Alabel', center: [6.0, 125.2] },
  { name: 'South Cotabato', regionId: 'REGION_12', regionCode: 'Region XII', islandGroup: 'Mindanao', capital: 'Koronadal', center: [6.3, 124.8] },
  { name: 'Sultan Kudarat', regionId: 'REGION_12', regionCode: 'Region XII', islandGroup: 'Mindanao', capital: 'Isulan', center: [6.6, 124.4] },
  { name: 'Agusan del Norte', regionId: 'REGION_13', regionCode: 'Region XIII', islandGroup: 'Mindanao', capital: 'Cabadbaran', center: [9.0, 125.5] },
  { name: 'Agusan del Sur', regionId: 'REGION_13', regionCode: 'Region XIII', islandGroup: 'Mindanao', capital: 'Prosperidad', center: [8.5, 125.8] },
  { name: 'Dinagat Islands', regionId: 'REGION_13', regionCode: 'Region XIII', islandGroup: 'Mindanao', capital: 'San Jose', center: [10.1, 125.6] },
  { name: 'Surigao del Norte', regionId: 'REGION_13', regionCode: 'Region XIII', islandGroup: 'Mindanao', capital: 'Surigao City', center: [9.7, 125.6] },
  { name: 'Surigao del Sur', regionId: 'REGION_13', regionCode: 'Region XIII', islandGroup: 'Mindanao', capital: 'Tandag', center: [8.8, 126.1] },
  { name: 'Basilan', regionId: 'BARMM', regionCode: 'BARMM', islandGroup: 'Mindanao', capital: 'Lamitan', center: [6.6, 122.0] },
  { name: 'Lanao del Sur', regionId: 'BARMM', regionCode: 'BARMM', islandGroup: 'Mindanao', capital: 'Marawi', center: [7.8, 124.3] },
  { name: 'Maguindanao del Norte', regionId: 'BARMM', regionCode: 'BARMM', islandGroup: 'Mindanao', capital: 'Datu Odin Sinsuat', center: [7.2, 124.3] },
  { name: 'Maguindanao del Sur', regionId: 'BARMM', regionCode: 'BARMM', islandGroup: 'Mindanao', capital: 'Buluan', center: [6.8, 124.7] },
  { name: 'Sulu', regionId: 'BARMM', regionCode: 'BARMM', islandGroup: 'Mindanao', capital: 'Jolo', center: [5.9, 121.0] },
  { name: 'Tawi-Tawi', regionId: 'BARMM', regionCode: 'BARMM', islandGroup: 'Mindanao', capital: 'Bongao', center: [5.1, 119.9] },
];

// Seismic Stations throughout the Philippine Archipelago
// Generated comprehensively from official PHIVOLCS SCSS controlling stations & STSS satellite telemetered stations
export const SEISMIC_STATIONS: SeismicStation[] = [
  // 29 SCSS Controlling Hubs
  ...ALL_SCSS_STATIONS.map((scss) => ({
    code: scss.code,
    name: scss.name,
    fullName: scss.fullName,
    location: scss.location,
    type: 'AOR Head' as const,
    coordinates: [scss.centerCoordinates.lat, scss.centerCoordinates.lng] as [number, number],
    aorZone: scss.code,
    islandGroup: scss.islandGroup,
    color: scss.dotColor,
  })),

  // 54 STSS Satellite Telemetered Stations
  ...ALL_SCSS_STATIONS.flatMap((scss) =>
    scss.subStations.map((stss) => ({
      code: stss.code,
      name: stss.name,
      fullName: `${stss.code} - ${stss.name} (${stss.location})`,
      location: stss.location,
      type: 'Network Station' as const,
      coordinates: stss.coordinates,
      aorZone: scss.code,
      parentScss: scss.code,
      islandGroup: scss.islandGroup,
      color: scss.polygonColor,
    }))
  ),
];

// Official PHIVOLCS Area of Responsibility (AOR) boundaries with geographic polygons
// Every station AOR polygon is strictly snapped to the official PSGC 2024 / NAMRIA provincial boundary polygons of its member provinces.
export const STATION_AORS: AORBoundary[] = ALL_SNAPPED_STATION_AORS;

