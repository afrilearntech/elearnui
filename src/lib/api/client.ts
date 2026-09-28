const API_PROXY_PATH = '/api/backend';
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

export const AUTH_SESSION_MARKER = 'cookie-session';

type ServerManagedField = 'given_by' | 'moderation_comment' | 'status';

export function stripServerManagedFields<T extends object>(
  payload: T,
): Omit<T, ServerManagedField> {
  const sanitized = { ...payload } as Record<string, unknown>;
  delete sanitized.given_by;
  delete sanitized.moderation_comment;
  delete sanitized.status;
  return sanitized as Omit<T, ServerManagedField>;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export class ApiClientError extends Error {
  errors?: Record<string, string[]>;
  status?: number;

  constructor(message: string, status?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_grade');
      localStorage.removeItem('student_id');
    }
    const errorMessage = 
      isJson && data.detail
        ? data.detail
        : isJson && data.message 
        ? data.message 
        : isJson && data.error
        ? data.error
        : `Request failed with status ${response.status}`;
    
    const errors = isJson && data.errors ? data.errors : undefined;
    
    throw new ApiClientError(errorMessage, response.status, errors);
  }

  return data as T;
}

function normalizeEndpoint(endpoint: string): string {
  if (!endpoint.startsWith('/')) {
    return `/${endpoint}`;
  }
  return endpoint;
}

export function getApiUrl(endpoint: string): string {
  const normalized = normalizeEndpoint(endpoint);

  if (typeof window !== 'undefined') {
    return `${API_PROXY_PATH}${normalized}`;
  }

  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  return `${API_BASE_URL.replace(/\/$/, '')}${normalized}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Token ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const hostLabel = typeof window !== 'undefined'
        ? window.location.host
        : 'API host';
      throw new ApiClientError(
        `Network error: Unable to reach ${hostLabel}. This is usually a DNS/host resolution issue (ERR_NAME_NOT_RESOLVED).`,
        0
      );
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

/**
 * Use for login, registration, and other calls that must NOT send an existing
 * `Authorization` header. {@link apiRequest} always attaches `localStorage.auth_token`,
 * which causes "Invalid token" on login if a stale token is still stored.
 */
export async function unauthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

export interface PaginatedApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const LIST_KEYS = [
  'results',
  'data',
  'items',
  'users',
  'students',
  'parents',
  'teachers',
  'content_managers',
  'counties',
  'districts',
  'schools',
  'subjects',
  'topics',
  'lessons',
  'games',
  'stories',
  'assessments',
  'questions',
  'reports',
] as const;

export function normalizeListResponse<T>(
  payload: unknown,
  preferredKeys: string[] = [],
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  for (const key of [...preferredKeys, ...LIST_KEYS]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return [];
}

function withPageParams(endpoint: string, page: number): string {
  const [path, query = ''] = endpoint.split('?', 2);
  const params = new URLSearchParams(query);
  params.set('page', String(page));
  params.set('page_size', '100');
  return `${path}?${params.toString()}`;
}

/**
 * Compatibility adapter for list screens that pre-date server pagination.
 * It fetches bounded 100-row pages and combines them without exposing response
 * envelope differences to every role-specific screen.
 */
export async function apiRequestAllPages<T>(
  endpoint: string,
  options: RequestInit = {},
  preferredKeys: string[] = [],
): Promise<T[]> {
  const firstPayload = await apiRequest<unknown>(withPageParams(endpoint, 1), options);
  const firstItems = normalizeListResponse<T>(firstPayload, preferredKeys);

  if (Array.isArray(firstPayload) || !firstPayload || typeof firstPayload !== 'object') {
    return firstItems;
  }

  const count = Number((firstPayload as Record<string, unknown>).count);
  if (!Number.isFinite(count) || count <= firstItems.length || firstItems.length === 0) {
    return firstItems;
  }

  const totalPages = Math.ceil(count / 100);
  const items = [...firstItems];
  const concurrency = 4;

  for (let page = 2; page <= totalPages; page += concurrency) {
    const pageNumbers = Array.from(
      { length: Math.min(concurrency, totalPages - page + 1) },
      (_, index) => page + index,
    );
    const payloads = await Promise.all(
      pageNumbers.map((pageNumber) =>
        apiRequest<unknown>(withPageParams(endpoint, pageNumber), options),
      ),
    );
    for (const payload of payloads) {
      items.push(...normalizeListResponse<T>(payload, preferredKeys));
    }
  }

  return items;
}
