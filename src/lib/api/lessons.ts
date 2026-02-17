import { apiRequest } from './client';

export interface LessonDetail {
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
}

export async function getLessonById(id: number | string, token: string): Promise<LessonDetail> {
  return apiRequest<LessonDetail>(`/lessons/${id}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

export interface TakenLessonRequest {
  student: number;
  lesson: number;
}

export interface TakenLessonResponse {
  id: number;
  student: number;
  lesson: number;
  created_at: string;
  updated_at: string;
}

export async function markLessonTaken(
  payload: TakenLessonRequest,
  token: string,
): Promise<TakenLessonResponse> {
  return apiRequest<TakenLessonResponse>('/taken-lessons/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export interface LessonListItem {
  id: number;
  subject: number;
  topic: number;
  period: number | null;
  title: string;
  description: string;
  type: string;
  status: string;
  resource: string | null;
  thumbnail: string | null;
  created_by: number;
  moderation_comment: string;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export async function getAllLessons(token: string): Promise<LessonListItem[]> {
  return apiRequest<LessonListItem[]>('/lessons/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

