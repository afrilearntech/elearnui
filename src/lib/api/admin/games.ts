import { apiRequest } from "../client";
import { normalizeAdminListResponse } from "./normalize";

export type GameStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "REVIEW_REQUESTED"
  | "DRAFT";

export type GameType =
  | "IMAGE_PUZZLE"
  | "WORD_PUZZLE"
  | "NUMBER"
  | string;

export interface Game {
  id: number;
  name: string;
  instructions: string;
  description: string;
  hint: string;
  correct_answer: string;
  type: GameType;
  image: string | null;
  status: GameStatus;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export async function getGames(): Promise<Game[]> {
  const response = await apiRequest<unknown>("/content/games/");
  return normalizeAdminListResponse<Game>(response, ["games"]);
}


