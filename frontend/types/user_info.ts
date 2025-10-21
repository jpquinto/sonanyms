export interface UserInfo {
  user_id: string;
  clerk_sub: string;
  first_name: string;
  last_name: string;
  username?: string;
  profile_image?: string;
  single_player_elo?: number;
  multiplayer_elo?: number;
}
