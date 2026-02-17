import { apiRequest } from './client';

export interface StudyStatsResponse {
  active_subjects: number;
  avg_grade: number;
  study_time_hours: number;
  badges: number;
}

export async function getStudyStats(token: string): Promise<StudyStatsResponse> {
  return apiRequest<StudyStatsResponse>('/dashboard/studystats/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

export interface MySubject {
  id: number;
  name: string;
  grade: string;
  description: string;
  thumbnail: string;
  teachers: number[];
  created_at: string;
  updated_at: string;
  created_by: number;
}

export async function getMySubjects(token: string): Promise<MySubject[]> {
  return apiRequest<MySubject[]>('/subjects/mysubjects/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

export interface AssignmentDue {
  type: string;
  id: number;
  title: string;
  course: string;
  due_at: string;
  due_in_days: number;
}

export async function getAssignmentsDue(token: string): Promise<AssignmentDue[]> {
  return apiRequest<AssignmentDue[]>('/dashboard/assignmentsdue/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

export interface Subject {
  id: number;
  name: string;
  grade: string;
  description: string;
  thumbnail: string | null;
  teachers: number[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

export async function getSubjects(
  token: string,
  params?: { search?: string; ordering?: string }
): Promise<Subject[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.ordering) {
    queryParams.append('ordering', params.ordering);
  }
  
  const queryString = queryParams.toString();
  const endpoint = `/subjects/${queryString ? `?${queryString}` : ''}`;
  
  return apiRequest<Subject[]>(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

