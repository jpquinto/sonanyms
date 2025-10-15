"use client";

import { BOTS } from "@/bots/bots";
import { BotGameClient } from "@/components/game_clients/bot_game_client";

export default function BotGamePage() {
  return (
    <div>
      <BotGameClient 
        username="Guest"
        bot={BOTS.THEORDORE_BAGWELL}
      />
    </div>
  );
}
