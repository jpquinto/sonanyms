"use client";

import { getWords } from "@/actions/get_words";
import { Word } from "@/types/word";
import { createSynonymsMap } from "@/utils/create_synonyms_map";
import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Opponent, WebSocketMessage } from "@/types/multiplayer";

interface MultiplayerGameClientProps {
  userId?: string;
  username: string;
  profileImageUrl?: string;
  gameMode: string;
}

type ConnectionStatus = "connecting" | "waiting" | "matched" | "playing" | "disconnected";

export const MultiplayerGameClient = ({
  userId,
  username,
  profileImageUrl,
  gameMode,
}: MultiplayerGameClientProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_API_URL;

    if (!wsUrl) {
      console.error("WebSocket URL not configured");
      setConnectionStatus("disconnected");
      return;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected, readyState:", ws.readyState);

      const message = {
        action: "join_queue",
        username,
        game_mode: gameMode,
        ...(userId && { user_id: userId }),
        ...(profileImageUrl && { profile_image_url: profileImageUrl }),
      };

      console.log("Sending join_queue message:", JSON.stringify(message));

      try {
        ws.send(JSON.stringify(message));
        console.log("Message sent successfully");
      } catch (error) {
        console.error("Error sending message:", error);
      }

      setConnectionStatus("waiting");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Check if it's an error response
        if (data.message && data.statusCode) {
          console.error("API Gateway error response:", data);
          return;
        }

        switch (data.type) {
          case "waiting":
            console.log("Waiting for opponent...");
            setConnectionStatus("waiting");
            break;

          case "game_start":
            console.log("Game starting:", data.game_id);
            setOpponent(data.opponent);
            setGameId(data.game_id);
            setCurrentWord(data.word);
            setStartTimestamp(data.start_timestamp);
            setConnectionStatus("playing");
            break;

          default:
            console.warn("Unknown message type:", data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("disconnected");
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setConnectionStatus("disconnected");
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId, username, profileImageUrl, gameMode]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl p-6">
        {connectionStatus === "connecting" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connecting...</h2>
            <p className="text-muted-foreground">
              Establishing connection to game server
            </p>
          </div>
        )}

        {connectionStatus === "waiting" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Finding Opponent...</h2>
            <p className="text-muted-foreground">
              Searching for a player in {gameMode} mode
            </p>
            <div className="mt-4">
              <Badge variant="secondary">{username}</Badge>
            </div>
          </div>
        )}

        {connectionStatus === "matched" && opponent && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Match Found!</h2>
            <p className="text-muted-foreground mb-4">
              You will play against {opponent.username}
            </p>
            <div className="flex justify-center gap-4">
              <Badge variant="secondary">{username}</Badge>
              <span className="text-2xl">VS</span>
              <Badge variant="secondary">{opponent.username}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Starting game...
            </p>
          </div>
        )}

        {connectionStatus === "playing" && currentWord && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Game Started!</h2>
            <p className="text-muted-foreground mb-4">
              Playing against {opponent?.username}
            </p>
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-2">Current Word:</h3>
              <Badge variant="default" className="text-lg px-4 py-2">
                {currentWord.word}
              </Badge>
            </div>
            {/* TODO: Add game UI here */}
          </div>
        )}

        {connectionStatus === "disconnected" && (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-destructive">
              Disconnected
            </h2>
            <p className="text-muted-foreground">
              Connection to server lost. Please refresh to try again.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};