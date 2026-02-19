import { apiRequest, ApiClientError } from '../client';

export interface Period {
  id: number;
  name: string;
  start_month: number;
  end_month: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePeriodRequest {
  name: string;
  start_month: number;
  end_month: number;
}

export interface UpdatePeriodRequest {
  name?: string;
  start_month?: number;
  end_month?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function getPeriods(): Promise<Period[]> {
  const data = await apiRequest<Period[] | PaginatedResponse<Period>>('/periods/?limit=1000');

  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return data.results;
  }

  return [];
}

export async function getPeriodById(id: number): Promise<Period> {
  return apiRequest<Period>(`/periods/${id}/`);
}

export async function createPeriod(data: CreatePeriodRequest): Promise<Period> {
  return apiRequest<Period>('/periods/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePeriod(id: number, data: UpdatePeriodRequest): Promise<Period> {
  return apiRequest<Period>(`/periods/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePeriod(id: number): Promise<void> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const response = await fetch(`${API_BASE_URL}/periods/${id}/`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    if (isJson) {
      const data = await response.json();
      throw new ApiClientError(
        data.detail || data.message || data.error || `Delete failed with status ${response.status}`,
        response.status,
      );
    }
    throw new ApiClientError(`Delete failed with status ${response.status}`, response.status);
  }
}
