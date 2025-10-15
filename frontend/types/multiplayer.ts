import { Word } from "./word";

export interface Opponent {
  connection_id: string;
  username: string;
  user_id?: string;
  user_profile_image_url?: string;
}

export interface GameStartData {
  type: "game_start";
  game_id: string;
  start_timestamp: number;
  word: Word;
}

export interface MatchFoundData {
  type: "match_found";
  opponent: Opponent;
}

export type WebSocketMessage = MatchFoundData | GameStartData;
