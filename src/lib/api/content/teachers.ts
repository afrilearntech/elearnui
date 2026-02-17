import { apiRequest, ApiClientError } from "../client";
import { ModerateAction, ModerateContentRequest, ModerateContentResponse } from "./lessons";

export type TeacherProfile = {
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

export type TeacherRecord = {
  id: number;
  profile: TeacherProfile;
  school: number;
  status: string;
  moderation_comment?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getTeachers(token: string): Promise<TeacherRecord[]> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<TeacherRecord[]>("/content/teachers/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export async function moderateTeacher(
  teacherId: number | string,
  action: ModerateAction,
  moderationComment?: string,
  token?: string,
): Promise<ModerateContentResponse> {
  if (!token) {
    if (typeof window === "undefined") {
      throw new ApiClientError("Authentication token is missing", 401);
    }
    token = localStorage.getItem("auth_token") || "";
  }
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const payload: ModerateContentRequest = {
    model: "school",
    id: teacherId,
    action,
    moderation_comment: moderationComment,
  };

  return apiRequest<ModerateContentResponse>("/content/moderate/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export interface AssignSubjectsRequest {
  teacher_id: number;
  subject_ids: number[];
}

export interface AssignSubjectsResponse {
  id: number;
  teacher_id: string;
  profile: TeacherProfile;
  school: number;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function assignSubjectsToTeacher(
  payload: AssignSubjectsRequest,
  token: string
): Promise<AssignSubjectsResponse> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<AssignSubjectsResponse>("/content/teachers/assign-subjects/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

