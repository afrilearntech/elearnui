import { apiRequest, getApiUrl } from '../client';
import { fetchAdminList } from './normalize';
import { validateCsvUpload } from '@/lib/uploads';

export interface County {
  id: number;
  name: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'REVIEW_REQUESTED' | 'DRAFT';
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateCountyRequest {
  name?: string;
  status: 'APPROVED' | 'REJECTED' | 'REVIEW_REQUESTED';
  moderation_comment?: string;
}

export interface CreateCountyRequest {
  name: string;
  status: 'APPROVED';
  moderation_comment?: string;
}

export interface BulkUploadCountyResult {
  row?: number;
  status: string;
  county_id?: number;
  name?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

export interface BulkUploadCountyResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadCountyResult[];
}

export async function getCounties(): Promise<County[]> {
  return fetchAdminList<County>('/admin/counties/', ['counties']);
}

export async function createCounty(
  data: CreateCountyRequest
): Promise<County> {
  return apiRequest<County>('/admin/counties/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCounty(
  id: number,
  data: UpdateCountyRequest
): Promise<County> {
  return apiRequest<County>(`/admin/counties/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function downloadCountyBulkTemplate(): Promise<Blob> {
  const response = await fetch(getApiUrl('/admin/counties/bulk-template/'), {
    method: 'GET',
    headers: {
      ...(typeof window !== 'undefined' && localStorage.getItem('auth_token') && {
        Authorization: `Token ${localStorage.getItem('auth_token')}`,
      }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download county bulk template.');
  }

  return await response.blob();
}

export async function bulkCreateCounties(file: File): Promise<BulkUploadCountyResponse> {
  validateCsvUpload(file);
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<BulkUploadCountyResponse>('/admin/counties/bulk-create/', {
    method: 'POST',
    body: formData,
  });
}


