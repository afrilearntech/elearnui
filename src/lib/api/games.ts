import { apiRequest } from './client';

export interface Game {
  id: number;
  name: string;
  instructions: string;
  description: string;
  hint: string;
  correct_answer: string;
  type: string;
  image: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

type GamesResponseShape =
  | Game[]
  | {
      results?: Game[];
      games?: Game[];
      data?: Game[];
    };

function normalizeGamesResponse(payload: GamesResponseShape): Game[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  if (Array.isArray(payload.games)) return payload.games;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

export async function getGames(token: string): Promise<Game[]> {
  const response = await apiRequest<GamesResponseShape>('/games/?limit=1000', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
  return normalizeGamesResponse(response);
}

export async function getGameById(id: number | string, token: string): Promise<Game> {
  return apiRequest<Game>(`/games/${id}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

