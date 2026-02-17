import { apiRequest, ApiClientError } from "../client";

export interface TeacherProfile {
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

export type TeacherStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "REVIEW_REQUESTED"
  | "DRAFT";

export interface TeacherRecord {
  id: number;
  profile: TeacherProfile;
  school: number | null;
  status: TeacherStatus;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function getTeachers(): Promise<TeacherRecord[]> {
  return apiRequest<TeacherRecord[]>("/content/teachers/");
}

export interface CreateTeacherRequest {
  name: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;
  school_id: number;
  status?: string;
}

export interface CreateTeacherResponse {
  id: number;
  teacher_id: string;
  profile: {
    id: number;
    email: string;
    phone: string;
    name: string;
    role: string;
    dob: string;
    gender: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    phone_verified: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
  };
  school: number;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface BulkUploadTeacherResult {
  row?: number;
  status: string;
  teacher_id?: string | null;
  name?: string;
  phone?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

export interface BulkUploadTeacherResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadTeacherResult[];
}

export async function createTeacher(payload: CreateTeacherRequest): Promise<CreateTeacherResponse> {
  return apiRequest<CreateTeacherResponse>("/content/teachers/create/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function downloadTeacherBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/content/teachers/bulk-template/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    
    const errorMessage =
      isJson && data?.message
        ? data.message
        : isJson && data?.error
        ? data.error
        : isJson && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(errorMessage, response.status);
  }

  return await response.blob();
}

export async function bulkCreateTeachers(file: File): Promise<BulkUploadTeacherResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/content/teachers/bulk-create/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
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

    const errors = isJson && data?.errors ? data.errors : undefined;
    throw new ApiClientError(errorMessage, response.status, errors);
  }

  return data as BulkUploadTeacherResponse;
}

export interface ApproveRejectTeacherResponse {
  id: number;
  teacher_id: string;
  profile: {
    id: number;
    email: string;
    phone: string;
    name: string;
    role: string;
    dob: string;
    gender: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    phone_verified: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
  };
  school: number;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function approveAdminTeacher(teacherId: number): Promise<ApproveRejectTeacherResponse> {
  return apiRequest<ApproveRejectTeacherResponse>(`/admin/teachers/${teacherId}/approve/`, {
    method: "POST",
  });
}

export async function rejectAdminTeacher(teacherId: number): Promise<ApproveRejectTeacherResponse> {
  return apiRequest<ApproveRejectTeacherResponse>(`/admin/teachers/${teacherId}/reject/`, {
    method: "POST",
  });
}

export interface AssignSubjectsRequest {
  teacher_id: number;
  subject_ids: number[];
}

export interface AssignSubjectsResponse {
  id: number;
  teacher_id: string;
  profile: {
    id: number;
    email: string;
    phone: string;
    name: string;
    role: string;
    dob: string;
    gender: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    phone_verified: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
  };
  school: number;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function assignSubjectsToTeacher(payload: AssignSubjectsRequest): Promise<AssignSubjectsResponse> {
  return apiRequest<AssignSubjectsResponse>("/content/teachers/assign-subjects/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

