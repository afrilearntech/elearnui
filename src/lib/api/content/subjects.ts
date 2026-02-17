import { apiRequest, ApiClientError } from "../client";

export type ObjectiveItem = {
  id: number;
  text: string;
};

export type SubjectRecord = {
  id: number;
  name: string;
  grade: string;
  status: string;
  description: string;
  thumbnail: string | null;
  teachers: number | number[] | null;
  lessons_count?: number;
  moderation_comment: string | null;
  objective_items: ObjectiveItem[];
  objectives?: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
};

export async function getSubjects(token: string): Promise<SubjectRecord[]> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<SubjectRecord[]>("/content/subjects/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export type CreateSubjectRequest = {
  name: string;
  grade: string;
  status: string;
  description: string;
  thumbnail?: File | string | null;
  moderation_comment?: string | null;
  objectives: string;
};

export type CreateSubjectResponse = SubjectRecord;

export async function createSubject(
  payload: CreateSubjectRequest,
  token: string,
): Promise<CreateSubjectResponse> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const url = `${API_BASE_URL}/content/subjects/`;

  if (payload.thumbnail instanceof File) {
    const formData = new FormData();
    formData.append('name', payload.name);
    formData.append('grade', payload.grade);
    formData.append('status', payload.status);
    formData.append('description', payload.description);
    formData.append('thumbnail', payload.thumbnail);
    formData.append('objectives', payload.objectives);
    if (payload.moderation_comment) {
      formData.append('moderation_comment', payload.moderation_comment);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = 
        isJson && (data as any).message 
          ? (data as any).message 
          : isJson && (data as any).error
          ? (data as any).error
          : isJson && (data as any).detail
          ? (data as any).detail
          : `Request failed with status ${response.status}`;
      
      const errors = isJson && (data as any).errors ? (data as any).errors : undefined;
      throw new ApiClientError(errorMessage, response.status, errors);
    }

    return data as CreateSubjectResponse;
  } else {
  return apiRequest<CreateSubjectResponse>("/content/subjects/", {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({
        ...payload,
        thumbnail: payload.thumbnail || null,
      }),
    });
  }
}

export type TopicRecord = {
  id: number;
  subject: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CreateTopicRequest = {
  subject: number;
  name: string;
};

export async function createTopic(
  payload: CreateTopicRequest,
  token: string,
): Promise<TopicRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<TopicRecord>("/topics/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getTopics(token: string, subjectId: number): Promise<TopicRecord[]> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  if (!subjectId) {
    throw new ApiClientError("Subject ID is required", 400);
  }

  const url = `/topics/?subject=${subjectId}`;
  return apiRequest<TopicRecord[]>(url, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export type SubjectDetailRecord = {
  id: number;
  name: string;
  grade: string;
  status: string;
  description: string;
  thumbnail: string | null;
  teachers: number[];
  moderation_comment: string;
  objectives: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  teacher_count: number;
  topics?: TopicRecord[];
  stats?: {
    total_instructors: number;
    total_lessons: number;
    total_students: number;
    estimated_duration_hours: number;
  };
};

export async function getSubjectById(
  id: number,
  token: string,
): Promise<SubjectDetailRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<SubjectDetailRecord>(`/subjects/${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export type UpdateSubjectRequest = {
  name?: string;
  grade?: string;
  status?: string;
  description?: string;
  thumbnail?: File | string | null;
  teachers?: number[];
  moderation_comment?: string;
  objectives?: string | string[];
};

export async function updateSubject(
  id: number,
  payload: UpdateSubjectRequest,
  token: string,
): Promise<SubjectDetailRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  if (payload.thumbnail instanceof File) {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new ApiClientError("API base URL is not configured", 0);
    }

    const formData = new FormData();
    if (payload.name !== undefined) formData.append("name", payload.name);
    if (payload.grade !== undefined) formData.append("grade", payload.grade);
    if (payload.status !== undefined) formData.append("status", payload.status);
    if (payload.description !== undefined) formData.append("description", payload.description);
    formData.append("thumbnail", payload.thumbnail);
    if (payload.teachers !== undefined) {
      payload.teachers.forEach((teacherId) => {
        formData.append("teachers", teacherId.toString());
      });
    }
    if (payload.moderation_comment !== undefined && payload.moderation_comment !== null) {
      formData.append("moderation_comment", payload.moderation_comment);
    }
    if (payload.objectives !== undefined) {
      if (Array.isArray(payload.objectives)) {
        formData.append("objectives", payload.objectives.join(", "));
      } else if (typeof payload.objectives === "string") {
        formData.append("objectives", payload.objectives);
      }
    }

    const response = await fetch(`${API_BASE_URL}/subjects/${id}/`, {
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
        isJson && (data as any).message
          ? (data as any).message
          : isJson && (data as any).error
            ? (data as any).error
            : isJson && (data as any).detail
              ? (data as any).detail
              : `Request failed with status ${response.status}`;
      const errors = isJson && (data as any).errors ? (data as any).errors : undefined;
      throw new ApiClientError(errorMessage, response.status, errors);
    }

    return data as SubjectDetailRecord;
  }

  const jsonPayload: any = { ...payload };
  if (payload.objectives !== undefined && Array.isArray(payload.objectives)) {
    jsonPayload.objectives = payload.objectives;
  }

  return apiRequest<SubjectDetailRecord>(`/subjects/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(jsonPayload),
  });
}

