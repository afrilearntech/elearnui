import { apiRequest } from "../client";

export type SubjectStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "REVIEW_REQUESTED"
  | "DRAFT";

export interface Subject {
  id: number;
  name: string;
  grade: string;
  status: SubjectStatus;
  description: string;
  thumbnail: string | null;
  teachers: number[];
  moderation_comment: string;
  objectives: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  teacher_count: number;
}

export interface UpdateSubjectRequest {
  status?: SubjectStatus;
  moderation_comment?: string;
}

export async function getSubjects(): Promise<Subject[]> {
  return apiRequest<Subject[]>("/content/subjects/");
}

export async function updateSubject(
  id: number,
  data: UpdateSubjectRequest
): Promise<Subject> {
  return apiRequest<Subject>(`/content/subjects/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}


