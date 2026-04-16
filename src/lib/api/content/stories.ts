import { apiRequest } from "../client";

export interface StoryCoverImage {
  prompt: string;
  image_url: string;
  alt_text: string;
}

export interface ContentStoryListItem {
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

export interface GetContentStoriesFilters {
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

export async function getContentStories(
  filters?: GetContentStoriesFilters
): Promise<ContentStoryListItem[]> {
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
  const endpoint = `/content/stories/${query ? `?${query}` : ""}`;
  return await apiRequest<ContentStoryListItem[]>(endpoint);
}

export async function publishContentStories(
  payload: PublishStoriesRequest
): Promise<PublishStoriesResponse> {
  return await apiRequest<PublishStoriesResponse>("/content/stories/publish/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
