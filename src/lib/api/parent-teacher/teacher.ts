import { apiRequest, ApiClientError } from '../client';

export interface TeacherRecord {
  id: number;
  teacher_id: string | null;
  profile: {
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
  school: number;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherSubject {
  id: number;
  name: string;
  grade: string;
  status: string;
  description: string;
  thumbnail: string;
  teachers: number[];
  moderation_comment: string;
  objectives: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  teacher_count: number;
}

export interface TeacherDashboard {
  summarycards: {
    total_students: number;
    class_average: number;
    pending_review: number;
    completion_rate: number;
  };
  top_performers: {
    student_name: string;
    student_id: string;
    percentage: number;
    improvement: number;
  }[];
  pending_submissions: {
    student_name: string;
    student_id: string;
    assessment_title: string;
    subject: string;
    due_at: string;
    submitted_at: string;
  }[];
  upcoming_deadlines: {
    assessment_title: string;
    subject: string;
    submissions_done: number;
    submissions_expected: number;
    completion_percentage: number;
    due_at: string;
    days_left: number;
  }[];
}

export async function getTeacherDashboard(): Promise<TeacherDashboard> {
  return await apiRequest<TeacherDashboard>('/teacher/dashboard/');
}

export interface HeadTeacherDashboard extends TeacherDashboard {}

export async function getHeadTeacherDashboard(): Promise<HeadTeacherDashboard> {
  return await apiRequest<HeadTeacherDashboard>('/headteacher/dashboard/');
}

export async function getTeachers(): Promise<TeacherRecord[]> {
  return await apiRequest<TeacherRecord[]>('/content/teachers/');
}

export async function getHeadTeacherTeachers(): Promise<TeacherRecord[]> {
  return await apiRequest<TeacherRecord[]>('/headteacher/teachers/');
}

export interface GeneralAssessment {
  id: number;
  title: string;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  given_by: number;
  instructions: string;
  marks: number;
  due_at: string;
  grade: string;
  ai_recommended?: boolean;
  is_targeted?: boolean;
  target_student?: number | null;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGeneralAssessmentRequest {
  title: string;
  type: "QUIZ" | "ASSIGNMENT";
  given_by?: number; // Optional - backend infers from token
  instructions: string;
  marks: number;
  due_at: string;
  grade: string;
  status: string;
  moderation_comment?: string;
}

export interface CreateGeneralAssessmentResponse {
  id: number;
  title: string;
  type: "QUIZ" | "ASSIGNMENT";
  given_by: number;
  instructions: string;
  marks: number;
  due_at: string;
  grade: string;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function getGeneralAssessments(): Promise<GeneralAssessment[]> {
  return await apiRequest<GeneralAssessment[]>('/teacher/general-assessments/');
}

export async function getHeadTeacherGeneralAssessments(): Promise<GeneralAssessment[]> {
  return await apiRequest<GeneralAssessment[]>('/headteacher/general-assessments/');
}

export async function createGeneralAssessment(payload: CreateGeneralAssessmentRequest): Promise<CreateGeneralAssessmentResponse> {
  // Don't send given_by - let the backend infer it from the authentication token
  const { given_by, ...requestPayload } = payload;
  
  return await apiRequest<CreateGeneralAssessmentResponse>('/teacher/general-assessments/create/', {
    method: 'POST',
    body: JSON.stringify(requestPayload),
  });
}

export interface CreateTeacherRequest {
  name: string;
  phone: string;
  email: string;
  gender: string;
  dob: string;
  school_id: number;
  status?: string;
}

export interface CreateTeacherResponse {
  id: number;
  teacher_id: string;
  profile: {
    id: number;
    email: string;
    phone: string;
    name: string;
    role: string;
    dob: string;
    gender: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    phone_verified: boolean;
    email_verified: boolean;
    created_at: string;
    updated_at: string;
  };
  school: number;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function createTeacher(payload: CreateTeacherRequest): Promise<CreateTeacherResponse> {
  return await apiRequest<CreateTeacherResponse>('/content/teachers/create/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createHeadTeacherTeacher(payload: CreateTeacherRequest): Promise<CreateTeacherResponse> {
  return await apiRequest<CreateTeacherResponse>('/headteacher/teachers/create/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface BulkUploadTeacherResult {
  row?: number;
  status: string;
  teacher_id?: string | null;
  name?: string;
  phone?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

export interface BulkUploadTeacherResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadTeacherResult[];
}

export async function downloadTeacherBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/content/teachers/bulk-template/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    
    const errorMessage =
      isJson && data?.message
        ? data.message
        : isJson && data?.error
        ? data.error
        : isJson && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(errorMessage, response.status);
  }

  return await response.blob();
}

export async function downloadHeadTeacherTeacherBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/headteacher/teachers/bulk-template/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    const errorMessage =
      isJson && data?.message
        ? data.message
        : isJson && data?.error
        ? data.error
        : isJson && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(errorMessage, response.status);
  }

  return await response.blob();
}

export async function bulkCreateTeachers(file: File): Promise<BulkUploadTeacherResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/content/teachers/bulk-create/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
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

  return data as BulkUploadTeacherResponse;
}

export async function bulkCreateHeadTeacherTeachers(file: File): Promise<BulkUploadTeacherResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/headteacher/teachers/bulk-create/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
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

  return data as BulkUploadTeacherResponse;
}

export interface TeacherStudent {
  id: number;
  student_id: string | null;
  profile: {
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
  school: {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
    county_id: number;
    county_name: string;
  };
  grade: string;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function getTeacherStudents(): Promise<TeacherStudent[]> {
  return await apiRequest<TeacherStudent[]>('/teacher/students/');
}

export interface HeadTeacherStudent extends TeacherStudent {
  points: number;
  current_login_streak: number;
  max_login_streak: number;
  last_login_activity_date: string | null;
}

export async function getHeadTeacherStudents(): Promise<HeadTeacherStudent[]> {
  return await apiRequest<HeadTeacherStudent[]>('/headteacher/students/');
}

export interface CreateStudentRequest {
  name: string;
  phone: string;
  email: string;
  grade: string;
  gender: string;
  dob: string;
  school_id?: number;
  status?: string; // Optional, but we'll set it to "APPROVED" when teacher creates
}

export interface CreateStudentResponse {
  id: number;
  student_id: string;
  profile: {
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
  school: {
    id: number;
    name: string;
    district_id: number;
    district_name: string;
    county_id: number;
    county_name: string;
  };
  grade: string;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function createTeacherStudent(payload: CreateStudentRequest): Promise<CreateStudentResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const url = `${API_BASE_URL}/teacher/students/create/`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  console.log('Creating student with payload:', payload);
  console.log('URL:', url);
  console.log('Token present:', !!token);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Token ${token}` }),
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    let data;
    try {
      data = isJson ? await response.json() : await response.text();
      console.log('Response data:', data);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new ApiClientError(
        `Server error (${response.status}): Unable to parse response`,
        response.status
      );
    }

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
      
      console.error('API Error:', {
        status: response.status,
        message: errorMessage,
        errors: errors,
        fullResponse: data
      });
      
      throw new ApiClientError(errorMessage, response.status, errors);
    }

    return data as CreateStudentResponse;
  } catch (error) {
    console.error('Error in createTeacherStudent:', error);
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new ApiClientError(
        'Network error: Unable to reach the server. Please check your connection and try again.',
        0
      );
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0
    );
  }
}

export async function createHeadTeacherStudent(payload: CreateStudentRequest): Promise<CreateStudentResponse> {
  return await apiRequest<CreateStudentResponse>('/headteacher/students/create/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface BulkUploadResult {
  row?: number;
  status: string;
  student_db_id?: number;
  student_id?: string | null;
  name?: string;
  phone?: string;
  errors?: Record<string, string[]>;
  [key: string]: any;
}

export interface BulkUploadResponse {
  summary: {
    total_rows: number;
    created: number;
    failed: number;
  };
  results: BulkUploadResult[];
}

export async function downloadBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/teacher/students/bulk-template/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();
    
    const errorMessage =
      isJson && data?.message
        ? data.message
        : isJson && data?.error
        ? data.error
        : isJson && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(errorMessage, response.status);
  }

  return await response.blob();
}

export async function downloadHeadTeacherBulkTemplate(): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/headteacher/students/bulk-template/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    const errorMessage =
      isJson && data?.message
        ? data.message
        : isJson && data?.error
        ? data.error
        : isJson && data?.detail
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(errorMessage, response.status);
  }

  return await response.blob();
}

export async function bulkCreateStudents(file: File): Promise<BulkUploadResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/teacher/students/bulk-create/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
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

  return data as BulkUploadResponse;
}

export async function bulkCreateHeadTeacherStudents(file: File): Promise<BulkUploadResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new ApiClientError('API base URL is not configured', 0);
  }

  const formData = new FormData();
  formData.append('file', file);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/headteacher/students/bulk-create/`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
    body: formData,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
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

  return data as BulkUploadResponse;
}

export interface TeacherGrades {
  summary: {
    total_grades: number;
    excellent: number;
    good: number;
    needs_improvement: number;
  };
  grades: {
    student_name: string;
    student_id: string;
    subject: string;
    grade_letter: string;
    percentage: number;
    status: string;
    updated_at: string;
  }[];
}

export async function getTeacherGrades(): Promise<TeacherGrades> {
  return await apiRequest<TeacherGrades>('/teacher/grades/');
}

export async function getHeadTeacherGrades(): Promise<TeacherGrades> {
  return await apiRequest<TeacherGrades>('/headteacher/grades/');
}

export interface TeacherSubmissions {
  submissions: {
    child_name: string;
    assessment_title: string;
    subject: string | null;
    score: number | null;
    assessment_score: number;
    submission_status: string;
    solution: {
      solution: string;
      attachment: string | null;
    };
    date_submitted: string;
  }[];
  summary: {
    graded: number;
    pending: number;
  };
}

export async function getTeacherSubmissions(): Promise<TeacherSubmissions> {
  return await apiRequest<TeacherSubmissions>('/teacher/submissions/');
}

export async function getHeadTeacherSubmissions(): Promise<TeacherSubmissions> {
  return await apiRequest<TeacherSubmissions>('/headteacher/submissions/');
}

export interface HeadTeacherLeaderboard {
  scope: {
    kind: string;
    timeframe: string;
    school_id: number;
    school_name: string;
    grades: string[];
    grade: string;
    county_id: number;
    district_id: number;
  };
  total_students: number;
  leaderboard: {
    rank: number;
    student_db_id: number;
    student_id: string;
    student_name: string;
    grade: string;
    points: number;
    current_login_streak: number;
    school_id: number;
    school_name: string;
    district_id: number;
    district_name: string;
    county_id: number;
    county_name: string;
  }[];
}

export async function getHeadTeacherLeaderboard(): Promise<HeadTeacherLeaderboard> {
  return await apiRequest<HeadTeacherLeaderboard>('/headteacher/leaderboard/');
}

export interface TeacherTopic {
  id: number;
  subject: number;
  subject_name: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function getTeacherTopics(): Promise<TeacherTopic[]> {
  return await apiRequest<TeacherTopic[]>('/teacher/topics/');
}

export async function getTeacherSubjects(): Promise<TeacherSubject[]> {
  return await apiRequest<TeacherSubject[]>('/teacher/subjects/');
}

export async function getHeadTeacherSubjects(): Promise<TeacherSubject[]> {
  return await apiRequest<TeacherSubject[]>('/headteacher/subjects/');
}

export interface StoryCoverImage {
  prompt: string;
  image_url: string;
  alt_text: string;
}

export interface TeacherStoryListItem {
  id: number;
  title: string;
  grade: string;
  tag: string;
  estimated_minutes: number;
  moral: string;
  cover_image: StoryCoverImage | null;
  is_published: boolean;
  school: number;
  created_by: number;
  created_at: string;
}

export interface TeacherStoryCharacter {
  name: string;
  description: string;
  role: string;
}

export interface TeacherStoryVocabulary {
  word: string;
  definition: string;
}

export interface TeacherStoryDetail extends TeacherStoryListItem {
  characters: TeacherStoryCharacter[];
  vocabulary: TeacherStoryVocabulary[];
  body: string;
  updated_at: string;
}

export interface GenerateTeacherStoriesRequest {
  grade: string;
  tag: string;
  count: number;
}

export interface GenerateTeacherStoriesResponse {
  detail?: string;
  message?: string;
}

export async function getTeacherStories(filters?: {
  grade?: string;
  tag?: string;
}): Promise<TeacherStoryListItem[]> {
  const params = new URLSearchParams();
  if (filters?.grade) params.set('grade', filters.grade);
  if (filters?.tag) params.set('tag', filters.tag);
  const query = params.toString();
  const endpoint = `/teacher/stories/${query ? `?${query}` : ''}`;
  return await apiRequest<TeacherStoryListItem[]>(endpoint);
}

export async function getTeacherStoryDetail(id: number): Promise<TeacherStoryDetail> {
  return await apiRequest<TeacherStoryDetail>(`/teacher/stories/${id}/`);
}

export async function generateTeacherStories(
  payload: GenerateTeacherStoriesRequest
): Promise<GenerateTeacherStoriesResponse> {
  return await apiRequest<GenerateTeacherStoriesResponse>('/teacher/stories/generate/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface GetHeadTeacherStoriesFilters {
  grade?: string;
  tag?: string;
  is_published?: boolean;
  school_id?: number;
}

export interface PublishStoriesRequest {
  story_ids: number[];
}

export interface PublishStoriesResponse {
  detail?: string;
  message?: string;
}

export async function getHeadTeacherStories(
  filters?: GetHeadTeacherStoriesFilters
): Promise<TeacherStoryListItem[]> {
  const params = new URLSearchParams();
  if (filters?.grade) params.set("grade", filters.grade);
  if (filters?.tag) params.set("tag", filters.tag);
  if (typeof filters?.is_published === "boolean") {
    params.set("is_published", String(filters.is_published));
  }
  if (typeof filters?.school_id === "number") {
    params.set("school_id", String(filters.school_id));
  }

  const query = params.toString();
  const endpoint = `/headteacher/stories/${query ? `?${query}` : ""}`;
  return await apiRequest<TeacherStoryListItem[]>(endpoint);
}

export async function publishHeadTeacherStories(
  payload: PublishStoriesRequest
): Promise<PublishStoriesResponse> {
  return await apiRequest<PublishStoriesResponse>("/headteacher/stories/publish/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface GeneratedGeneralAssessment {
  id: number;
  title: string;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  given_by: number;
  instructions: string;
  marks: number;
  due_at: string;
  grade: string;
  ai_recommended: boolean;
  is_targeted: boolean;
  target_student: number | null;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedLessonAssessment {
  id: number;
  lesson: number;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  given_by: number;
  title: string;
  grade: string;
  instructions: string;
  marks: number;
  due_at: string;
  ai_recommended: boolean;
  is_targeted: boolean;
  target_student: number | null;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateAiAssessmentsResponse {
  general_assessments: GeneratedGeneralAssessment[];
  lesson_assessments: GeneratedLessonAssessment[];
}

/**
 * Backend docs vary between `/teacher/{id}/generate-ai-assessments/{pk}/`
 * and `/teacher/{id}/generate-ai-assessments/`. Try both to stay compatible.
 */
export async function generateAiAssessmentsForStudent(
  teacherId: number,
  studentPk: number
): Promise<GenerateAiAssessmentsResponse> {
  const attempts: Array<() => Promise<GenerateAiAssessmentsResponse>> = [
    () =>
      apiRequest<GenerateAiAssessmentsResponse>(
        `/teacher/${teacherId}/generate-ai-assessments/${studentPk}/`,
        { method: "POST" }
      ),
    () =>
      apiRequest<GenerateAiAssessmentsResponse>(
        `/teacher/${teacherId}/generate-ai-assessments/`,
        {
          method: "POST",
          body: JSON.stringify({ pk: studentPk }),
        }
      ),
  ];

  let lastError: unknown = null;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      if (error instanceof ApiClientError && [404, 405, 400].includes(error.status ?? 0)) {
        continue;
      }
      throw error;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new ApiClientError("Failed to generate AI assessments for this student.", 0);
}

export interface TeacherLesson {
  id: number;
  subject: number;
  topic: number;
  period: number;
  title: string;
  description: string;
  type: string;
  status: string;
  resource: string;
  thumbnail: string;
  created_by: number;
  moderation_comment: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
  grade?: string | null;
  subject_grade?: string | null;
  topic_grade?: string | null;
  period_grade?: string | null;
  subject_detail?: { grade?: string | null };
}

export async function getTeacherLessons(): Promise<TeacherLesson[]> {
  return await apiRequest<TeacherLesson[]>('/teacher/lessons/');
}

export async function getHeadTeacherLessons(): Promise<TeacherLesson[]> {
  return await apiRequest<TeacherLesson[]>('/headteacher/lessons/');
}

export interface UnlockLessonRequest {
  student_id: number;
  lesson_id: number;
  duration_hours: number;
  reason: string;
}

export interface UnlockLessonResponse {
  id: number;
  student_id: number;
  lesson_id: number;
  unlocked_by_id: number;
  reason: string;
  expires_at: string | null;
  revoked_at: string | null;
}

export async function unlockLessonForStudent(payload: UnlockLessonRequest): Promise<UnlockLessonResponse> {
  return await apiRequest<UnlockLessonResponse>('/teacher/unlock-lesson/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function unlockHeadTeacherLessonForStudent(
  payload: UnlockLessonRequest
): Promise<UnlockLessonResponse> {
  return await apiRequest<UnlockLessonResponse>('/headteacher/unlock-lesson/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface RevokeLessonUnlockRequest {
  student_id: number;
  lesson_id: number;
}

export async function revokeTeacherLessonUnlock(
  payload: RevokeLessonUnlockRequest
): Promise<UnlockLessonResponse> {
  return await apiRequest<UnlockLessonResponse>('/teacher/revoke-lesson-unlock/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function revokeHeadTeacherLessonUnlock(
  payload: RevokeLessonUnlockRequest
): Promise<UnlockLessonResponse> {
  return await apiRequest<UnlockLessonResponse>('/headteacher/revoke-lesson-unlock/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface TeacherLessonAssessment {
  id: number;
  lesson: number;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  given_by: number;
  title: string;
  grade?: string;
  instructions: string;
  marks: number;
  due_at: string;
  ai_recommended?: boolean;
  is_targeted?: boolean;
  target_student?: number | null;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function getTeacherLessonAssessments(): Promise<TeacherLessonAssessment[]> {
  return await apiRequest<TeacherLessonAssessment[]>('/teacher/lesson-assessments/');
}

export async function getHeadTeacherLessonAssessments(): Promise<TeacherLessonAssessment[]> {
  return await apiRequest<TeacherLessonAssessment[]>('/headteacher/lesson-assessments/');
}

export interface AssessmentStatisticsSummary {
  submissions: number;
  total_score: number;
  mean: number;
  median: number;
  mode: number;
  range: string;
  Q1: number;
  Q3: number;
  standard_deviation: number;
  skewness_coefficient: number;
}

export interface AssessmentStatisticsChart {
  labels: string[];
  values: number[];
}

export interface AssessmentStatisticsResponse {
  summary: AssessmentStatisticsSummary;
  chart: AssessmentStatisticsChart;
}

export async function getHeadTeacherAssessmentStatistics(params: {
  general_assessment_id?: number;
  lesson_assessment_id?: number;
}): Promise<AssessmentStatisticsResponse> {
  const hasGeneral = typeof params.general_assessment_id === "number";
  const hasLesson = typeof params.lesson_assessment_id === "number";

  if ((hasGeneral && hasLesson) || (!hasGeneral && !hasLesson)) {
    throw new ApiClientError("Provide exactly one of general_assessment_id or lesson_assessment_id.", 400);
  }

  const search = new URLSearchParams();
  if (hasGeneral) {
    search.set("general_assessment_id", String(params.general_assessment_id));
  }
  if (hasLesson) {
    search.set("lesson_assessment_id", String(params.lesson_assessment_id));
  }

  return await apiRequest<AssessmentStatisticsResponse>(`/headteacher/assessment-statistics/?${search.toString()}`);
}

export async function getTeacherAssessmentStatistics(params: {
  general_assessment_id?: number;
  lesson_assessment_id?: number;
}): Promise<AssessmentStatisticsResponse> {
  const hasGeneral = typeof params.general_assessment_id === "number";
  const hasLesson = typeof params.lesson_assessment_id === "number";

  if ((hasGeneral && hasLesson) || (!hasGeneral && !hasLesson)) {
    throw new ApiClientError("Provide exactly one of general_assessment_id or lesson_assessment_id.", 400);
  }

  const search = new URLSearchParams();
  if (hasGeneral) {
    search.set("general_assessment_id", String(params.general_assessment_id));
  }
  if (hasLesson) {
    search.set("lesson_assessment_id", String(params.lesson_assessment_id));
  }

  return await apiRequest<AssessmentStatisticsResponse>(`/teacher/assessment-statistics/?${search.toString()}`);
}

export interface CreateLessonAssessmentRequest {
  lesson: number;
  type: "QUIZ" | "ASSIGNMENT";
  given_by?: number;
  title: string;
  instructions: string;
  marks: number;
  due_at: string;
  status: string;
  moderation_comment?: string;
}

export interface CreateLessonAssessmentResponse {
  id: number;
  lesson: number;
  type: "QUIZ" | "ASSIGNMENT";
  given_by: number;
  title: string;
  instructions: string;
  marks: number;
  due_at: string;
  status: string;
  moderation_comment: string;
  created_at: string;
  updated_at: string;
}

export async function createLessonAssessment(payload: CreateLessonAssessmentRequest): Promise<CreateLessonAssessmentResponse> {
  return await apiRequest<CreateLessonAssessmentResponse>('/teacher/lesson-assessments/create/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface CreateLessonRequest {
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
}

export interface CreateLessonResponse {
  id: number;
  subject: number;
  topic: number;
  period: number;
  title: string;
  description: string;
  type: string;
  status: string;
  resource: string;
  thumbnail: string;
  created_by: number;
  moderation_comment: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

async function createLessonAtEndpoint(
  endpoint: string,
  payload: CreateLessonRequest
): Promise<CreateLessonResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured');
  }

  const requiresFormData = payload.resource instanceof File || payload.thumbnail instanceof File;
  
  if (requiresFormData) {
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

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Token ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
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
      throw new Error(errorMessage);
    }

    return data as CreateLessonResponse;
  }

  return await apiRequest<CreateLessonResponse>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createTeacherLesson(payload: CreateLessonRequest): Promise<CreateLessonResponse> {
  return createLessonAtEndpoint('/teacher/lessons/create/', payload);
}

export async function createHeadTeacherLesson(payload: CreateLessonRequest): Promise<CreateLessonResponse> {
  return createLessonAtEndpoint('/headteacher/lessons/create/', payload);
}

export interface SubjectOption {
  id: number;
  name: string;
  grade: string;
}

export interface TopicOption {
  id: number;
  name: string;
  subject: number;
  created_at: string;
  updated_at: string;
}

// Use the same endpoints as content creators
export async function getSubjectsForSelect(): Promise<SubjectOption[]> {
  const subjects = await apiRequest<any[]>('/content/subjects/');
  return subjects.map((s) => ({
    id: s.id,
    name: s.name,
    grade: s.grade,
  }));
}

export async function getTopicsForSubject(subjectId: number): Promise<TopicOption[]> {
  if (!subjectId) {
    return [];
  }
  // Use the same endpoint as content creators: /topics/?subject=${subjectId}
  return await apiRequest<TopicOption[]>(`/topics/?subject=${subjectId}`);
}

export interface CreateSubjectRequest {
  name: string;
  grade: string;
  status: string;
  description: string;
  thumbnail?: File | string | null;
  moderation_comment?: string | null;
  objectives: string;
}

export interface CreateSubjectResponse {
  id: number;
  name: string;
  grade: string;
  status: string;
  description: string;
  thumbnail: string;
  teachers: number[];
  moderation_comment: string;
  objectives: string[];
  created_at: string;
  updated_at: string;
  created_by: number;
  teacher_count: number;
}

export async function createTeacherSubject(payload: CreateSubjectRequest): Promise<CreateSubjectResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured');
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

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Token ${token}` }),
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
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
      throw new Error(errorMessage);
    }

    const responseData = Array.isArray(data) ? data[0] : data;
    return responseData as CreateSubjectResponse;
  } else {
    const response = await apiRequest<CreateSubjectResponse | CreateSubjectResponse[]>('/content/subjects/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return Array.isArray(response) ? response[0] : response;
  }
}

export interface QuestionOption {
  id: number;
  question: number;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  general_assessment: number | null;
  lesson_assessment: number | null;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK";
  question: string;
  answer: string;
  options: QuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface CreateQuestionRequest {
  general_assessment_id?: number;
  lesson_assessment_id?: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK";
  question: string;
  answer: string;
  options?: string[];
}

export interface CreateQuestionResponse {
  general_assessment_id?: number;
  lesson_assessment_id?: number;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK";
  question: string;
  answer: string;
  options: string[];
}

export async function getQuestions(params?: {
  general_assessment_id?: number;
  lesson_assessment_id?: number;
}): Promise<Question[]> {
  const queryParams = new URLSearchParams();
  if (params?.general_assessment_id) {
    queryParams.append('general_assessment_id', params.general_assessment_id.toString());
  }
  if (params?.lesson_assessment_id) {
    queryParams.append('lesson_assessment_id', params.lesson_assessment_id.toString());
  }

  const endpoint = `/teacher/questions/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiRequest<Question[]>(endpoint);
}

export async function createQuestion(payload: CreateQuestionRequest): Promise<CreateQuestionResponse> {
  return await apiRequest<CreateQuestionResponse>('/teacher/questions/create/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface GradeGeneralAssessmentRequest {
  assessment_id: number;
  student_id: number;
  score: number;
}

export interface GradeGeneralAssessmentResponse {
  assessment_id: number;
  student_id: number;
  score: number;
}

export interface GradeLessonAssessmentRequest {
  assessment_id: number;
  student_id: number;
  score: number;
}

export interface GradeLessonAssessmentResponse {
  assessment_id: number;
  student_id: number;
  score: number;
}

export async function gradeGeneralAssessment(payload: GradeGeneralAssessmentRequest): Promise<GradeGeneralAssessmentResponse> {
  return await apiRequest<GradeGeneralAssessmentResponse>('/teacher/grade/general/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function gradeLessonAssessment(payload: GradeLessonAssessmentRequest): Promise<GradeLessonAssessmentResponse> {
  return await apiRequest<GradeLessonAssessmentResponse>('/teacher/grade/lesson/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type ModerationModel = "subject" | "lesson" | "general_assessment" | "lesson_assessment" | "game" | "school" | "county" | "district" | "student" | "teacher";
export type ModerationAction = "approve" | "reject" | "request_changes" | "request_review";

export interface ModerateRequest {
  model: ModerationModel;
  id: number;
  action: ModerationAction;
  moderation_comment?: string;
}

export interface ModerateResponse {
  id: number;
  model: string;
  status: string;
  moderation_comment: string;
}

export async function moderateContent(payload: ModerateRequest): Promise<ModerateResponse> {
  return await apiRequest<ModerateResponse>('/content/moderate/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approveStudent(studentId: number): Promise<TeacherStudent> {
  return await apiRequest<TeacherStudent>(`/teacher/${studentId}/approve-student/`, {
    method: 'POST',
  });
}

export async function rejectStudent(studentId: number): Promise<TeacherStudent> {
  return await apiRequest<TeacherStudent>(`/teacher/${studentId}/reject-student/`, {
    method: 'POST',
  });
}

export async function approveHeadTeacherStudent(studentId: number): Promise<HeadTeacherStudent> {
  return await apiRequest<HeadTeacherStudent>(`/headteacher/${studentId}/approve-student/`, {
    method: 'POST',
  });
}

export async function rejectHeadTeacherStudent(studentId: number): Promise<HeadTeacherStudent> {
  return await apiRequest<HeadTeacherStudent>(`/headteacher/${studentId}/reject-student/`, {
    method: 'POST',
  });
}

