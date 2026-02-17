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

export async function getGames(token: string): Promise<Game[]> {
  return apiRequest<Game[]>('/games/', {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

export async function getGameById(id: number | string, token: string): Promise<Game> {
  return apiRequest<Game>(`/games/${id}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Token ${token}`,
    },
  });
}

