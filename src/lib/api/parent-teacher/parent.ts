import { apiRequest } from '../client';

export interface DashboardChild {
  name: string;
  student_id: string | null;
  student_db_id: number;
  grade: string;
  school: string;
}

export interface GradeOverview {
  child_name: string;
  student_id: string | null;
  subject: string;
  overall_score: number;
  score_grade: string;
  score_remark: string;
}

export interface ParentDashboardResponse {
  children: DashboardChild[];
  grades_overview: GradeOverview[];
}

export async function getParentDashboard(): Promise<ParentDashboardResponse> {
  return await apiRequest<ParentDashboardResponse>('/parent/dashboard/');
}

export interface MyChild {
  id: number;
  name: string;
  school: string;
  grade: string;
  student_id: string | null;
  created_at: string;
}

export async function getMyChildren(): Promise<MyChild[]> {
  return await apiRequest<MyChild[]>('/parent/mychildren/');
}

export interface ParentGrade {
  child_name: string;
  student_id: string | null;
  subject: string;
  overall_score: number;
  score_grade: string;
  score_remark: string;
  updated_at: string;
}

export async function getParentGrades(): Promise<ParentGrade[]> {
  return await apiRequest<ParentGrade[]>('/parent/grades/');
}

export interface ParentAssessment {
  child_name: string;
  assessment_title: string;
  subject: string | null;
  assessment_type: string;
  assessment_score: number;
  child_score: number | null;
  assessment_status: string;
  start_date: string;
  due_date: string;
}

export interface ParentAssessmentsResponse {
  assessments: ParentAssessment[];
  summary: {
    completed: number;
    pending: number;
    in_progress: number;
  };
}

export async function getParentAssessments(): Promise<ParentAssessmentsResponse> {
  return await apiRequest<ParentAssessmentsResponse>('/parent/assessments/');
}

export interface ParentSubmission {
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
}

export interface ParentSubmissionsResponse {
  submissions: ParentSubmission[];
  summary: {
    graded: number;
    pending: number;
  };
}

export async function getParentSubmissions(): Promise<ParentSubmissionsResponse> {
  return await apiRequest<ParentSubmissionsResponse>('/parent/submissions/');
}

export interface LinkChildRequest {
  student_id: number;
  student_email: string;
  student_phone: string;
}

export interface LinkChildResponse {
  id: number;
  name: string;
  school: string;
  grade: string;
  student_id: string | null;
  created_at: string;
}

export async function linkChild(data: LinkChildRequest): Promise<LinkChildResponse> {
  return await apiRequest<LinkChildResponse>('/onboarding/linkchild/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface EstimatedTimeSpent {
  subject: string;
  time: string;
  percentage: number;
}

export interface ParentAnalyticsResponse {
  summarycards: {
    total_assessments: number;
    total_completed_assessments: number;
    overall_average_score: number;
    total_subjects_touched: number;
    estimated_total_hours: number;
  };
  estimated_time_spent: EstimatedTimeSpent[];
}

export async function getParentAnalytics(childId?: string | null): Promise<ParentAnalyticsResponse> {
  const endpoint = childId 
    ? `/parent/analytics/?child=${childId}`
    : '/parent/analytics/';
  return await apiRequest<ParentAnalyticsResponse>(endpoint);
}

