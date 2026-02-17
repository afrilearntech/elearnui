import { apiRequest } from "../client";

export interface ContentManager {
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

export interface CreateContentManagerRequest {
  name: string;
  phone: string;
  email: string;
  role: "CONTENTCREATOR" | "CONTENTVALIDATOR";
  gender?: string;
  dob?: string;
}

export interface BulkUploadContentManagerResult {
  row: number;
  status: "created" | "error";
  user_id?: number;
  name?: string;
  phone?: string;
  email?: string;
  role?: string;
  errors?: Record<string, string[]>;
}

export interface BulkUploadContentManagerResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadContentManagerResult[];
}

export async function createContentManager(data: CreateContentManagerRequest): Promise<ContentManager> {
  return apiRequest<ContentManager>("/admin/content-managers/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function downloadContentManagerBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const url = `${API_BASE_URL}/admin/content-managers/bulk-template/`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download template: ${response.statusText}`);
  }

  return await response.blob();
}

export async function bulkCreateContentManagers(file: File): Promise<BulkUploadContentManagerResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured");
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const url = `${API_BASE_URL}/admin/content-managers/bulk-create/`;

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
    body: formData,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      isJson && data.message
        ? data.message
        : isJson && data.error
        ? data.error
        : isJson && data.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    const errors = isJson && data.errors ? data.errors : undefined;
    throw new Error(errorMessage);
  }

  return data as BulkUploadContentManagerResponse;
}
