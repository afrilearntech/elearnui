import { apiRequest, unauthenticatedRequest, ApiClientError } from '../client';

export interface ContentLoginRequest {
  identifier: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
}

export interface ContentLoginResponse {
  token: string;
  user: User;
}

export async function contentLogin(
  data: ContentLoginRequest
): Promise<ContentLoginResponse> {
  return unauthenticatedRequest<ContentLoginResponse>('/auth/content/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  detail: string;
}

export async function changePassword(
  data: ChangePasswordRequest,
  token: string
): Promise<ChangePasswordResponse> {
  if (!token) {
    throw new ApiClientError('Authentication token is missing', 401);
  }

  return apiRequest<ChangePasswordResponse>('/auth/change-password/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      current_password: data.currentPassword,
      new_password: data.newPassword,
      confirm_password: data.confirmPassword,
    }),
  });
}

