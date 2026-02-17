import { apiRequest } from "../client";

export type ModerateModel =
  | "subject"
  | "lesson"
  | "general_assessment"
  | "lesson_assessment"
  | "game"
  | "school"
  | "teacher"
  | "county"
  | "district";

export type ModerateAction = "approve" | "reject" | "request_changes" | "request_review";

export interface ModerateContentRequest {
  model: ModerateModel;
  id: number | string;
  action: ModerateAction;
  moderation_comment?: string;
}

export interface ModerateContentResponse {
  id: number;
  model: string;
  status: string;
  moderation_comment?: string | null;
}

export async function moderateContent(
  payload: ModerateContentRequest
): Promise<ModerateContentResponse> {
  return apiRequest<ModerateContentResponse>("/content/moderate/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
