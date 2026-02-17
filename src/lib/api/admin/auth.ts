import { apiRequest } from '../client';

export interface AdminLoginRequest {
  identifier: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: string;
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

export interface AdminLoginResponse {
  token: string;
  user: User;
}

export async function adminLogin(
  data: AdminLoginRequest
): Promise<AdminLoginResponse> {
  return apiRequest<AdminLoginResponse>('/auth/admin/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
  return apiRequest<ChangePasswordResponse>('/api-v1/auth/change-password/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

