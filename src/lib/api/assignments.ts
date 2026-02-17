import { ApiClientError } from './client';

export interface SubmitSolutionRequest {
  general_id?: number;
  lesson_id?: number;
  solution?: string;
  attachment?: File;
}

export interface SubmitSolutionResponse {
  detail: string;
  solution_id: number;
}

export async function submitSolution(
  data: SubmitSolutionRequest,
  token: string
): Promise<SubmitSolutionResponse> {
  const formData = new FormData();
  
  if (data.general_id) {
    formData.append('general_id', data.general_id.toString());
  }
  if (data.lesson_id) {
    formData.append('lesson_id', data.lesson_id.toString());
  }
  if (data.solution) {
    formData.append('solution', data.solution);
  }
  if (data.attachment) {
    formData.append('attachment', data.attachment);
  }


  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api-v1';
  const response = await fetch(`${API_BASE_URL}/kids/submit-solution/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${token}`,

    },
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  
  const responseData = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorData = isJson ? responseData as any : null;
    const errorMessage = 
      errorData?.detail
        ? errorData.detail
        : errorData?.message 
        ? errorData.message 
        : errorData?.error
        ? errorData.error
        : `Request failed with status ${response.status}`;
    
    const errors = errorData?.errors ? errorData.errors : undefined;
    
    throw new ApiClientError(errorMessage, response.status, errors);
  }

  return responseData as SubmitSolutionResponse;
}

export interface QuestionOption {
  id: number;
  value: string;
}

export interface AssessmentQuestion {
  id: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK";
  question: string;
  options?: QuestionOption[];
}

export interface AssessmentInfo {
  id: number;
  title: string;
  type: string;
}

export interface AssessmentQuestionsResponse {
  assessment: AssessmentInfo;
  questions: AssessmentQuestion[];
}

export async function getAssessmentQuestions(
  params: { general_id?: number; lesson_id?: number },
  token: string
): Promise<AssessmentQuestionsResponse> {
  const queryParams = new URLSearchParams();
  if (params.general_id) {
    queryParams.append('general_id', params.general_id.toString());
  }
  if (params.lesson_id) {
    queryParams.append('lesson_id', params.lesson_id.toString());
  }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api-v1';
  const endpoint = `/kids/assessment-questions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiClientError(
      errorData.detail || errorData.message || `Failed to fetch questions: ${response.status}`,
      response.status
    );
  }

  return await response.json();
}

