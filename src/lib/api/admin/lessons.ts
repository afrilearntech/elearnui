import { apiRequest } from "../client";

export type LessonStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "REVIEW_REQUESTED"
  | "DRAFT";

export type LessonType = "PDF" | "VIDEO" | string;

export interface Lesson {
  id: number;
  subject: number;
  topic: number;
  period: number;
  title: string;
  description: string;
  type: LessonType;
  status: LessonStatus;
  resource: string;
  thumbnail: string | null;
  created_by: number;
  moderation_comment: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: number;
  subject: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SubjectSummary {
  id: number;
  name: string;
  grade: string;
}

export async function getLessons(): Promise<Lesson[]> {
  return apiRequest<Lesson[]>("/content/lessons/");
}

export async function getTopic(id: number): Promise<Topic> {
  return apiRequest<Topic>(`/topics/${id}/`);
}

export async function getSubject(id: number): Promise<SubjectSummary> {
  return apiRequest<SubjectSummary>(`/subjects/${id}/`);
}


