import { apiRequest } from '../client';

export interface ReportFilter {
  month?: number; // 1-12, defaults to current month
  year?: number; // e.g. 2025, defaults to current year
}

export interface SystemReportSummary {
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_schools: number;
}

export interface SystemReportDetailed {
  period: string;
  users: number;
  students: number;
  teachers: number;
  parents: number;
  schools: number;
  subjects: number;
  lessons: number;
  submissions_total: number;
  submissions_graded: number;
}

export interface SystemReportContentStats {
  content_creators: number;
  content_validators: number;
  approved_subjects: number;
  pending_subjects: number;
  approved_lessons: number;
  pending_lessons: number;
  total_games: number;
}

export interface SystemReportActivityStats {
  new_users: number;
  new_students: number;
  new_teachers: number;
  new_parents: number;
  active_users: number;
  total_assessments: number;
  pending_submissions: number;
}

export interface SystemReport {
  period: string;
  summary: SystemReportSummary;
  detailed: SystemReportDetailed[];
  content_stats: SystemReportContentStats;
  activity_stats: SystemReportActivityStats;
}

// Flattened version for display
export interface FlattenedSystemReport {
  period: string;
  total_users: number;
  total_students: number;
  total_teachers: number;
  total_parents: number;
  total_schools: number;
  total_subjects: number;
  total_lessons: number;
  total_submissions: number;
  graded_submissions: number;
  content_creators: number;
  content_validators: number;
  approved_subjects: number;
  pending_subjects: number;
  approved_lessons: number;
  pending_lessons: number;
  total_games: number;
  new_users: number;
  new_students: number;
  new_teachers: number;
  new_parents: number;
  active_users: number;
  total_assessments: number;
  pending_submissions: number;
}

export async function getSystemReports(filter?: ReportFilter): Promise<SystemReport[]> {
  const queryParams = new URLSearchParams();
  
  if (filter) {
    if (filter.month !== undefined && filter.month > 0) {
      queryParams.append('month', filter.month.toString());
    }
    if (filter.year !== undefined && filter.year > 0) {
      queryParams.append('year', filter.year.toString());
    }
  }

  const queryString = queryParams.toString();
  const endpoint = `/admin/system-reports/${queryString ? `?${queryString}` : ''}`;
  
  const response = await apiRequest<SystemReport | SystemReport[]>(endpoint);
  
  // Handle both single object and array responses
  if (Array.isArray(response)) {
    return response;
  } else {
    return [response];
  }
}

export async function exportReports(filter?: ReportFilter, format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!API_BASE_URL) {
    throw new Error('API base URL is not configured');
  }

  const queryParams = new URLSearchParams();
  
  if (filter) {
    if (filter.month !== undefined) {
      queryParams.append('month', filter.month.toString());
    }
    if (filter.year !== undefined) {
      queryParams.append('year', filter.year.toString());
    }
  }
  
  queryParams.append('format', format);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const url = `${API_BASE_URL}/admin/system-reports/export/?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token && { Authorization: `Token ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export reports: ${response.statusText}`);
  }

  return await response.blob();
}

