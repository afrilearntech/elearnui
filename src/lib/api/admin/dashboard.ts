import { apiRequest } from "../client";

export interface SummaryCard {
  count: number;
  change_pct: number;
}

export interface SummaryCards {
  schools: SummaryCard;
  districts: SummaryCard;
  teachers: SummaryCard;
  parents: SummaryCard;
  content_creators: SummaryCard;
  content_validators: SummaryCard;
  approved_subjects: SummaryCard;
  lessons_pending_approval: SummaryCard;
}

export interface LessonsChartPoint {
  period: string;
  submitted: number;
  approved: number;
  rejected: number;
}

export interface LessonsChart {
  granularity: string;
  points: LessonsChartPoint[];
}

export interface HighLearner {
  student_id: number;
  name: string;
  subtitle: string;
}

export interface DashboardData {
  summary_cards: SummaryCards;
  lessons_chart: LessonsChart;
  high_learners: HighLearner[];
}

export async function getDashboardData(): Promise<DashboardData | DashboardData[]> {
  return apiRequest<DashboardData | DashboardData[]>("/admin/dashboard/", {
    method: "GET",
  });
}
