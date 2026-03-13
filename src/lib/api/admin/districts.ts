import { apiRequest } from '../client';
import { normalizeAdminListResponse } from './normalize';

export interface District {
  id: number;
  county: number;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "REVIEW_REQUESTED" | "DRAFT";
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateDistrictRequest {
  county?: number;
  name?: string;
  status: "APPROVED" | "REJECTED" | "REVIEW_REQUESTED";
  moderation_comment?: string;
}

export interface CreateDistrictRequest {
  county: number;
  name: string;
  status: "APPROVED";
  moderation_comment?: string;
}

export interface BulkUploadDistrictResult {
  row?: number;
  status: string;
  district_id?: number;
  name?: string;
  county?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

export interface BulkUploadDistrictResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadDistrictResult[];
}

export async function getDistricts(): Promise<District[]> {
  const response = await apiRequest<unknown>('/admin/districts/');
  return normalizeAdminListResponse<District>(response, ['districts']);
}

export async function getApprovedDistricts(): Promise<District[]> {
  const districts = await getDistricts();
  return districts.filter(district => district.status === "APPROVED");
}

export async function updateDistrict(id: number, data: UpdateDistrictRequest): Promise<District> {
  return apiRequest<District>(`/admin/districts/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function createDistrict(data: CreateDistrictRequest): Promise<District> {
  return apiRequest<District>('/admin/districts/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function downloadDistrictBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured');
  }

  const response = await fetch(`${API_BASE_URL}/admin/districts/bulk-template/`, {
    method: 'GET',
    headers: {
      ...(typeof window !== 'undefined' && localStorage.getItem('auth_token') && {
        Authorization: `Token ${localStorage.getItem('auth_token')}`,
      }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download district bulk template.');
  }

  return await response.blob();
}

export async function bulkCreateDistricts(file: File): Promise<BulkUploadDistrictResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/admin/districts/bulk-create/`, {
    method: 'POST',
    headers: {
      ...(typeof window !== 'undefined' && localStorage.getItem('auth_token') && {
        Authorization: `Token ${localStorage.getItem('auth_token')}`,
      }),
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      isJson && data?.message
        ? data.message
        : isJson && data?.error
        ? data.error
        : isJson && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  return data as BulkUploadDistrictResponse;
}
