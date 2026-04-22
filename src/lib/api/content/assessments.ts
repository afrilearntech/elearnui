import { apiRequest, ApiClientError } from "../client";

export type AssessmentRecord = {
  kind: "general" | "lesson";
  id: number;
  title: string;
  type: string;
  instructions?: string;
  marks: number;
  due_at: string;
  grade: string;
  given_by_id: number;
  ai_recommended?: boolean;
  is_targeted?: boolean;
  target_student?: number | null;
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

  const [generalRaw, lessonRaw] = await Promise.all([
    apiRequest<Array<Record<string, unknown>>>("/content/general-assessments/", {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
      },
    }),
    apiRequest<Array<Record<string, unknown>>>("/content/lesson-assessments/", {
      method: "GET",
      headers: {
        Authorization: `Token ${token}`,
      },
    }),
  ]);

  const general = generalRaw.map((item) => ({
    kind: "general" as const,
    id: Number(item.id),
    title: String(item.title ?? ""),
    type: String(item.type ?? ""),
    instructions: String(item.instructions ?? ""),
    marks: Number(item.marks ?? 0),
    due_at: String(item.due_at ?? ""),
    grade: String(item.grade ?? ""),
    given_by_id: Number(item.given_by ?? 0),
    ai_recommended: Boolean(item.ai_recommended),
    is_targeted: Boolean(item.is_targeted),
    target_student:
      typeof item.target_student === "number" ? item.target_student : item.target_student === null ? null : undefined,
    status: typeof item.status === "string" ? item.status : undefined,
    moderation_comment: typeof item.moderation_comment === "string" ? item.moderation_comment : null,
  }));

  const lesson = lessonRaw.map((item) => ({
    kind: "lesson" as const,
    id: Number(item.id),
    title: String(item.title ?? ""),
    type: String(item.type ?? ""),
    instructions: String(item.instructions ?? ""),
    marks: Number(item.marks ?? 0),
    due_at: String(item.due_at ?? ""),
    grade: String(item.grade ?? ""),
    given_by_id: Number(item.given_by ?? 0),
    ai_recommended: Boolean(item.ai_recommended),
    is_targeted: Boolean(item.is_targeted),
    target_student:
      typeof item.target_student === "number" ? item.target_student : item.target_student === null ? null : undefined,
    lesson_id: Number(item.lesson ?? 0),
    status: typeof item.status === "string" ? item.status : undefined,
    moderation_comment: typeof item.moderation_comment === "string" ? item.moderation_comment : null,
  }));

  return [...general, ...lesson];
}

export type CreateGeneralAssessmentRequest = {
  title: string;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  given_by?: number;
  instructions: string;
  marks: number;
  due_at: string;
  grade: string;
  ai_recommended?: boolean;
  is_targeted?: boolean;
  target_student?: number | null;
  status?: string;
  moderation_comment?: string;
};

export type CreateLessonAssessmentRequest = {
  lesson: number;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  given_by?: number;
  title: string;
  instructions: string;
  marks: number;
  due_at: string;
  grade: string;
  ai_recommended?: boolean;
  is_targeted?: boolean;
  target_student?: number | null;
  status?: string;
  moderation_comment?: string;
};

async function createAtFirstAvailableEndpoint<TPayload, TResponse>(
  endpoints: string[],
  payload: TPayload,
  token: string,
): Promise<TResponse> {
  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      return await apiRequest<TResponse>(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      lastError = error;
      if (error instanceof ApiClientError && error.status === 404) {
        continue;
      }
      throw error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new ApiClientError("No supported create assessment endpoint found", 404);
}

export async function createGeneralAssessment(
  payload: CreateGeneralAssessmentRequest,
  token: string,
): Promise<AssessmentRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const response = await createAtFirstAvailableEndpoint<
    CreateGeneralAssessmentRequest,
    AssessmentRecord | AssessmentRecord[]
  >(
    ["/content/general-assessments/", "/content/general-assessments/create/", "/teacher/general-assessments/create/"],
    payload,
    token,
  );

  if (Array.isArray(response)) {
    if (!response.length) {
      throw new ApiClientError("General assessment was created but no record was returned", 502);
    }
    return response[0];
  }

  return response;
}

export async function createLessonAssessment(
  payload: CreateLessonAssessmentRequest,
  token: string,
): Promise<AssessmentRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const response = await createAtFirstAvailableEndpoint<
    CreateLessonAssessmentRequest,
    AssessmentRecord | AssessmentRecord[]
  >(
    ["/content/lesson-assessments/", "/content/lesson-assessments/create/", "/teacher/lesson-assessments/create/"],
    payload,
    token,
  );

  if (Array.isArray(response)) {
    if (!response.length) {
      throw new ApiClientError("Lesson assessment was created but no record was returned", 502);
    }
    return response[0];
  }

  return response;
}

export type CreateContentQuestionRequest = {
  general_assessment_id?: number;
  lesson_assessment_id?: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK";
  question: string;
  answer: string;
  options?: string[];
};

export type CreateContentQuestionResponse = {
  general_assessment_id?: number;
  lesson_assessment_id?: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK";
  question: string;
  answer: string;
  options: string[];
};

export type UpdateContentAssessmentStatusRequest = Record<string, unknown> & {
  status: "APPROVED" | "REJECTED" | "REQUEST_CHANGES" | "PENDING" | "DRAFT";
  moderation_comment?: string;
};

export type UpdateContentAssessmentResponse = Record<string, unknown>;

export async function updateContentAssessmentStatus(
  kind: "general" | "lesson",
  assessmentId: number,
  payload: UpdateContentAssessmentStatusRequest,
  token: string,
): Promise<UpdateContentAssessmentResponse> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  const basePath = kind === "general" ? "/content/general-assessments" : "/content/lesson-assessments";
  return apiRequest<UpdateContentAssessmentResponse>(`${basePath}/${assessmentId}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function createContentQuestion(
  payload: CreateContentQuestionRequest,
  token: string,
): Promise<CreateContentQuestionResponse> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<CreateContentQuestionResponse>("/content/questions/create/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

