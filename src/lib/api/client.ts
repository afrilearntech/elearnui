const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
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
      throw new ApiClientError(
        'Network error: Unable to reach the server. Please check your connection and try again.',
        0
      );
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

export async function unauthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
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
