import { apiRequest } from './client';

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
  
  return apiRequest<DistrictsResponse>('/lookup/districts/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
}

export async function getSchools(token: string, districtId?: number): Promise<SchoolsResponse> {
  // Ensure token is properly formatted
  const authToken = token?.trim();
  if (!authToken) {
    throw new Error('Authentication token is required');
  }
  
  const response = await apiRequest<SchoolsResponse>('/lookup/schools/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (districtId) {
    const filteredResults = response.results.filter(school => school.district_id === districtId);
    return {
      ...response,
      results: filteredResults,
      count: filteredResults.length,
    };
  }
  
  return response;
}

