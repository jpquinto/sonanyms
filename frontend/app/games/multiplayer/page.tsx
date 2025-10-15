import { MultiplayerGameClient } from "@/components/game_clients/multiplayer_game_client";

export default function MultiplayerGamePage() {
  return (
    <div>
      <MultiplayerGameClient
        userId={undefined}
        username="Guest"
        profileImageUrl={undefined}
        gameMode="standard"
      />
    </div>
  );
}
