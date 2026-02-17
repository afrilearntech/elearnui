import { apiRequest, ApiClientError } from "../client";

export type DashboardStats = {
  overall: {
    total: number;
    approved: number;
    rejected: number;
    review_requested: number;
  };
  by_type: {
    subjects: {
      total: number;
      approved: number;
      rejected: number;
      review_requested: number;
    };
    lessons: {
      total: number;
      approved: number;
      rejected: number;
      review_requested: number;
    };
    general_assessments: {
      total: number;
      approved: number;
      rejected: number;
      review_requested: number;
    };
    lesson_assessments: {
      total: number;
      approved: number;
      rejected: number;
      review_requested: number;
    };
    games: {
      total: number;
      approved: number;
      rejected: number;
      review_requested: number;
    };
    schools: {
      total: number;
      approved: number;
      rejected: number;
      review_requested: number;
    };
  };
};

export async function getDashboardStats(token: string): Promise<DashboardStats> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<DashboardStats>("/content/dashboard/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

