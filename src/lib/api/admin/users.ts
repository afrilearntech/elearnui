import { apiRequest } from '../client';

export interface AdminUser {
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

export async function getAdminUsers(): Promise<AdminUser[]> {
  return await apiRequest<AdminUser[]>('/admin/users/');
}

export interface AdminParent {
  name: string;
  email: string;
  linked_students: string;
  status: string;
  date_joined: string;
}

export async function getAdminParents(): Promise<AdminParent[]> {
  return await apiRequest<AdminParent[]>('/admin/parents/');
}

