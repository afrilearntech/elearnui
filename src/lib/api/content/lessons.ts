import { apiRequest, ApiClientError } from "../client";

export type LessonRecord = {
  id: number;
  subject: number;
  topic: number;
  period: number;
  title: string;
  description: string;
  type: string;
  status: string;
  resource: string | null;
  thumbnail: string | null;
  created_by: number;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  moderation_comment?: string | null;
};

export type CreateLessonRequest = {
  subject: number;
  topic: number;
  period: number;
  title: string;
  description: string;
  type: string;
  status: string;
  resource?: File | string | null;
  thumbnail?: File | string | null;
  moderation_comment?: string | null;
  duration_minutes: number;
};

export type UpdateLessonRequest = Partial<CreateLessonRequest>;
export type LessonResponse = LessonRecord | LessonRecord[];

export async function getLessons(token: string): Promise<LessonRecord[]> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<LessonRecord[]>("/content/lessons/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

function normalizeLessonResponse(response: LessonResponse): LessonRecord {
  if (Array.isArray(response)) {
    if (response.length === 0) {
      throw new ApiClientError("Lesson request succeeded but no record was returned", 500);
    }
    return response[0];
  }
  return response;
}

export async function createLesson(payload: CreateLessonRequest, token: string): Promise<LessonRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const requiresFormData = payload.resource instanceof File || payload.thumbnail instanceof File;
  if (requiresFormData) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new ApiClientError("API base URL is not configured", 0);
    }

    const formData = new FormData();
    formData.append("subject", payload.subject.toString());
    formData.append("topic", payload.topic.toString());
    formData.append("period", payload.period.toString());
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("type", payload.type);
    formData.append("status", payload.status);
    formData.append("duration_minutes", payload.duration_minutes.toString());
    if (payload.moderation_comment !== undefined && payload.moderation_comment !== null) {
      formData.append("moderation_comment", payload.moderation_comment);
    }
    if (payload.resource instanceof File) {
      formData.append("resource", payload.resource);
    } else if (typeof payload.resource === "string") {
      formData.append("resource", payload.resource);
    }
    if (payload.thumbnail instanceof File) {
      formData.append("thumbnail", payload.thumbnail);
    } else if (typeof payload.thumbnail === "string") {
      formData.append("thumbnail", payload.thumbnail);
    }

    const response = await fetch(`${API_BASE_URL}/content/lessons/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
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

    return normalizeLessonResponse(data as LessonResponse);
  }

  const response = await apiRequest<LessonResponse>("/content/lessons/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return normalizeLessonResponse(response);
}

export async function updateLesson(id: number, payload: UpdateLessonRequest, token: string): Promise<LessonRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const requiresFormData = payload.resource instanceof File || payload.thumbnail instanceof File;
  if (requiresFormData) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new ApiClientError("API base URL is not configured", 0);
    }

    const formData = new FormData();
    if (payload.subject !== undefined) formData.append("subject", payload.subject.toString());
    if (payload.topic !== undefined) formData.append("topic", payload.topic.toString());
    if (payload.period !== undefined) formData.append("period", payload.period.toString());
    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.description !== undefined) formData.append("description", payload.description);
    if (payload.type !== undefined) formData.append("type", payload.type);
    if (payload.status !== undefined) formData.append("status", payload.status);
    if (payload.duration_minutes !== undefined) formData.append("duration_minutes", payload.duration_minutes.toString());
    if (payload.moderation_comment !== undefined && payload.moderation_comment !== null) {
      formData.append("moderation_comment", payload.moderation_comment);
    }
    if (payload.resource instanceof File) {
      formData.append("resource", payload.resource);
    } else if (typeof payload.resource === "string") {
      formData.append("resource", payload.resource);
    }
    if (payload.thumbnail instanceof File) {
      formData.append("thumbnail", payload.thumbnail);
    } else if (typeof payload.thumbnail === "string") {
      formData.append("thumbnail", payload.thumbnail);
    }

    const response = await fetch(`${API_BASE_URL}/lessons/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
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

    return data as LessonRecord;
  }

  return apiRequest<LessonRecord>(`/lessons/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getLessonById(id: number, token: string): Promise<LessonRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<LessonRecord>(`/lessons/${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export async function deleteLesson(
  id: number,
  token: string,
): Promise<void> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError("API base URL is not configured", 0);
  }

  const response = await fetch(`${API_BASE_URL}/lessons/${id}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Token ${token}`,
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    if (isJson) {
      const data = await response.json();
      const errorMessage =
        data.detail || data.message || data.error || `Delete failed with status ${response.status}`;
      throw new ApiClientError(errorMessage, response.status);
    }
    throw new ApiClientError(`Delete failed with status ${response.status}`, response.status);
  }
}

export type ModerateModel =
  | "subject"
  | "lesson"
  | "general_assessment"
  | "lesson_assessment"
  | "game"
  | "school"
  | "teacher"
  | "county"
  | "district";

export type ModerateAction = "approve" | "reject" | "request_changes" | "request_review";

export interface ModerateContentRequest {
  model: ModerateModel;
  id: number | string;
  action: ModerateAction;
  moderation_comment?: string;
}

export interface ModerateContentResponse {
  id: number;
  model: string;
  status: string;
  moderation_comment?: string | null;
}

export async function moderateContent(
  payload: ModerateContentRequest,
  token: string,
): Promise<ModerateContentResponse> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<ModerateContentResponse>("/content/moderate/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}


