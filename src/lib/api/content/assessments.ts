import { apiRequest, ApiClientError } from "../client";

export type AssessmentRecord = {
  kind: "general" | "lesson";
  id: number;
  title: string;
  type: string;
  marks: number;
  due_at: string;
  grade: string;
  given_by_id: number;
  lesson_id?: number;
  lesson_title?: string;
  subject_id?: number;
  subject_name?: string;
  status?: string;
  moderation_comment?: string | null;
};

export async function getAssessments(token: string): Promise<AssessmentRecord[]> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<AssessmentRecord[]>("/content/all-assessments/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

