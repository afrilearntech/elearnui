import { apiRequest } from '../client';
import { normalizeAdminListResponse } from './normalize';

export interface School {
  id: number;
  district: number;
  name: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "REQUEST_CHANGES" | "DRAFT";
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSchoolRequest {
  district: number;
  name: string;
  status: "APPROVED";
  moderation_comment?: string;
}

export interface BulkUploadSchoolResult {
  row?: number;
  status: string;
  school_id?: number;
  name?: string;
  district?: string;
  county?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

export interface BulkUploadSchoolResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadSchoolResult[];
}

export async function getSchools(): Promise<School[]> {
  const response = await apiRequest<unknown>('/admin/schools/');
  return normalizeAdminListResponse<School>(response, ['schools']);
}

export async function createSchool(data: CreateSchoolRequest): Promise<School> {
  return apiRequest<School>('/admin/schools/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function downloadSchoolBulkTemplate(): Promise<Blob> {
  // The schools bulk template endpoint returns a file (CSV).
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/schools/bulk-template/`,
    {
      method: 'GET',
      headers: {
        ...(typeof window !== 'undefined' &&
          localStorage.getItem('auth_token') && {
            Authorization: `Token ${localStorage.getItem('auth_token')}`,
          }),
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to download school bulk template.');
  }

  return await response.blob();
}

export async function bulkCreateSchools(file: File): Promise<BulkUploadSchoolResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/admin/schools/bulk-create/`, {
    method: 'POST',
    headers: {
      ...(typeof window !== 'undefined' &&
        localStorage.getItem('auth_token') && {
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

  return data as BulkUploadSchoolResponse;
}


