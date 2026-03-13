import { apiRequest, ApiClientError } from "../client";
import { normalizeAdminListResponse } from "./normalize";

export interface StudentRecord {
  id: number;
  student_id: string | null;
  profile: {
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
  };
  school: {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
    county_id: number;
    county_name: string;
  };
  grade: string;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentRequest {
  name: string;
  phone: string;
  email: string;
  grade: string;
  gender: string;
  dob: string;
  /**
   * Optional school context.
   * - When called by a **teacher**, backend can infer school from the teacher context,
   *   so this may be omitted.
   * - When called by an **admin**, we should pass an explicit school_id so the same
   *   endpoint can still assign the student to the correct school.
   */
  school_id?: number;
  status?: string;
}

export interface CreateStudentResponse {
  id: number;
  student_id: string;
  profile: {
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
  };
  school: {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
    county_id: number;
    county_name: string;
  };
  grade: string;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface BulkUploadStudentResult {
  row?: number;
  status: string;
  student_db_id?: number;
  student_id?: string | null;
  name?: string;
  phone?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

export interface BulkUploadStudentResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadStudentResult[];
}

export async function createStudent(payload: CreateStudentRequest): Promise<CreateStudentResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  // Both admins and teachers use the same endpoint.
  // - Teachers can rely on their own school context.
  // - Admins must pass an explicit `school_id` in the payload.
  const url = `${API_BASE_URL}/teacher/students/create/`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Token ${token}` }),
      },
      body: JSON.stringify(payload),
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

    return data as CreateStudentResponse;
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

export async function downloadStudentBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/teacher/students/bulk-template/`;

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

export async function bulkCreateStudents(file: File): Promise<BulkUploadStudentResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/teacher/students/bulk-create/`;

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

  return data as BulkUploadStudentResponse;
}

export interface AdminStudent {
  id: number;
  name: string;
  school: string;
  email: string;
  linked_parents: string;
  grade: string;
  status: string;
}

export interface ApproveRejectStudentResponse {
  id: number;
  student_id: string;
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
  school: {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
    county_id: number;
    county_name: string;
  };
  grade: string;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function getAdminStudents(): Promise<AdminStudent[]> {
  const response = await apiRequest<unknown>("/admin/students/", {
    method: "GET",
  });
  return normalizeAdminListResponse<AdminStudent>(response, ["students"]);
}

export async function approveAdminStudent(studentId: number): Promise<ApproveRejectStudentResponse> {
  return apiRequest<ApproveRejectStudentResponse>(`/admin/students/${studentId}/approve/`, {
    method: "POST",
  });
}

export async function rejectAdminStudent(studentId: number): Promise<ApproveRejectStudentResponse> {
  return apiRequest<ApproveRejectStudentResponse>(`/admin/students/${studentId}/reject/`, {
    method: "POST",
  });
}
