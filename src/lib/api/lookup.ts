import { apiRequestAllPages } from './client';

export interface District {
  id: number;
  name: string;
  county_id: number;
  county_name: string;
}

export interface DistrictsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: District[];
}

export interface School {
  id: number;
  name: string;
  district_id: number;
  district_name: string;
  county_id: number;
  county_name: string;
}

export interface SchoolsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: School[];
}

export async function getDistricts(token: string): Promise<DistrictsResponse> {
  // Ensure token is properly formatted
  const authToken = token?.trim();
  if (!authToken) {
    throw new Error('Authentication token is required');
  }
  
  const results = await apiRequestAllPages<District>('/lookup/districts/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
  }, ['districts']);
  return { count: results.length, next: null, previous: null, results };
}

export async function getSchools(token: string, districtId?: number): Promise<SchoolsResponse> {
  // Ensure token is properly formatted
  const authToken = token?.trim();
  if (!authToken) {
    throw new Error('Authentication token is required');
  }
  
  const endpoint = districtId
    ? `/lookup/schools/?district_id=${encodeURIComponent(String(districtId))}`
    : '/lookup/schools/';
  const results = await apiRequestAllPages<School>(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
  }, ['schools']);

  return { count: results.length, next: null, previous: null, results };
}

