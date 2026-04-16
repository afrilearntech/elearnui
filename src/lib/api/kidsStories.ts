import { apiRequest } from "./client";

export interface KidsStoryCoverImage {
  prompt: string;
  image_url: string;
  alt_text: string;
}

export interface KidsStoryListItem {
  id: number;
  title: string;
  grade: string;
  tag: string;
  estimated_minutes: number;
  moral: string;
  cover_image: KidsStoryCoverImage | null;
  is_published: boolean;
  school: number;
  created_by: number;
  created_at: string;
}

export interface KidsStoryCharacter {
  name: string;
  description: string;
  role: string;
}

export interface KidsStoryVocabulary {
  word: string;
  definition: string;
}

export interface KidsStoryDetail extends KidsStoryListItem {
  characters: KidsStoryCharacter[];
  vocabulary: KidsStoryVocabulary[];
  body: string;
  updated_at: string;
}

export interface GetKidsStoriesFilters {
  grade?: string;
  tag?: string;
}

export async function getKidsStories(
  token: string,
  filters?: GetKidsStoriesFilters
): Promise<KidsStoryListItem[]> {
  const params = new URLSearchParams();
  if (filters?.grade) params.set("grade", filters.grade);
  if (filters?.tag) params.set("tag", filters.tag);
  const query = params.toString();

  return apiRequest<KidsStoryListItem[]>(`/kids/stories/${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export async function getKidsStoryById(
  token: string,
  id: number | string
): Promise<KidsStoryDetail> {
  return apiRequest<KidsStoryDetail>(`/kids/stories/${id}/`, {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}
