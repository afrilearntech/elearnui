import { apiRequest, ApiClientError } from "../client";

export type GameRecord = {
  id: number;
  name: string;
  instructions: string;
  description: string;
  hint: string;
  correct_answer: string;
  type: string;
  image: string | null;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  moderation_comment?: string | null;
};

export async function getGames(token: string): Promise<GameRecord[]> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  return apiRequest<GameRecord[]>("/content/games/", {
    method: "GET",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export type CreateGameRequest = {
  name: string;
  instructions: string;
  description: string;
  hint: string;
  correct_answer: string;
  type: string;
  image?: string | File | null;
  status: string;
};

export type CreateGameResponse = GameRecord | GameRecord[];

export async function createGame(payload: CreateGameRequest, token: string): Promise<GameRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  if (payload.image instanceof File) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("instructions", payload.instructions);
    formData.append("description", payload.description);
    formData.append("hint", payload.hint);
    formData.append("correct_answer", payload.correct_answer);
    formData.append("type", payload.type);
    formData.append("status", payload.status);
    formData.append("image", payload.image);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new ApiClientError("API base URL is not configured", 0);
    }

    const response = await fetch(`${API_BASE_URL}/content/games/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
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

    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new ApiClientError("Game creation succeeded but no record was returned", 500);
      }
      return data[0] as GameRecord;
    }

    return data as GameRecord;
  }

  const response = await apiRequest<CreateGameResponse>("/content/games/", {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (Array.isArray(response)) {
    if (response.length === 0) {
      throw new ApiClientError("Game creation succeeded but no record was returned", 500);
    }
    return response[0];
  }

  return response;
}

export type UpdateGameRequest = Partial<CreateGameRequest>;

export async function updateGame(id: number, payload: UpdateGameRequest, token: string): Promise<GameRecord> {
  if (!token) {
    throw new ApiClientError("Authentication token is missing", 401);
  }

  if (payload.image instanceof File) {
    const formData = new FormData();
    if (payload.name !== undefined) formData.append("name", payload.name);
    if (payload.instructions !== undefined) formData.append("instructions", payload.instructions);
    if (payload.description !== undefined) formData.append("description", payload.description);
    if (payload.hint !== undefined) formData.append("hint", payload.hint);
    if (payload.correct_answer !== undefined) formData.append("correct_answer", payload.correct_answer);
    if (payload.type !== undefined) formData.append("type", payload.type);
    if (payload.status !== undefined) formData.append("status", payload.status);
    formData.append("image", payload.image);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!API_BASE_URL) {
      throw new ApiClientError("API base URL is not configured", 0);
    }

    const response = await fetch(`${API_BASE_URL}/games/${id}/`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
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

    return data as GameRecord;
  }

  return apiRequest<GameRecord>(`/games/${id}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

