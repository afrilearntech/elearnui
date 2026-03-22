import { apiRequest } from '../client';
import { ApiClientError } from '../client';

export { ApiClientError };

export interface User {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: 'PARENT' | 'TEACHER' | 'HEADTEACHER';
  dob: string | null;
  gender: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginParent(
  credentials: LoginRequest
): Promise<LoginResponse> {
  try {
    const response = await apiRequest<LoginResponse>('/auth/parent/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Login failed',
      0
    );
  }
}

export async function loginTeacher(
  credentials: LoginRequest
): Promise<LoginResponse> {
  try {
    const response = await apiRequest<LoginResponse>('/auth/content/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'Login failed',
      0
    );
  }
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  message?: string;
  detail?: string;
}

export async function changePassword(
  payload: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return await apiRequest<ChangePasswordResponse>('/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

