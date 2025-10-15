"use client";

import { Word } from "@/types/word";
import { createSynonymsMap } from "@/utils/create_synonyms_map";
import { useState, useEffect, useRef } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Opponent } from "@/types/multiplayer";
import { Separator } from "../ui/separator";

interface MultiplayerGameClientProps {
  userId?: string;
  username: string;
  profileImageUrl?: string;
  gameMode: string;
}

type ConnectionStatus =
  | "connecting"
  | "waiting"
  | "matched"
  | "playing"
  | "disconnected"
  | "game_over"
  | "opponent_forfeit";

type GamePhase = "waiting_for_start" | "between_rounds" | "active";

interface OpponentSubmission {
  point_value: number;
}

interface Submission {
  word: string;
  point_value: number;
}

export const MultiplayerGameClient = ({
  userId,
  username,
  profileImageUrl,
  gameMode,
}: MultiplayerGameClientProps) => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [gamePhase, setGamePhase] = useState<GamePhase>("waiting_for_start");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState(1);

  // Game state
  const [userAnswer, setUserAnswer] = useState("");
  const [gameScore, setGameScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);
  const [roundTimeLeft, setRoundTimeLeft] = useState(30);

  // Answer tracking
  const [correctStrongestMatches, setCorrectStrongestMatches] = useState<
    string[]
  >([]);
  const [correctStrongMatches, setCorrectStrongMatches] = useState<string[]>(
    []
  );
  const [correctWeakMatches, setCorrectWeakMatches] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);

  // Opponent submissions
  const [opponentSubmissions, setOpponentSubmissions] = useState<
    OpponentSubmission[]
  >([]);

  // Track current round submissions
  const currentRoundSubmissions = useRef<Submission[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const gameStarted = useRef(false);

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
      console.log("WebSocket connected");

      const message = {
        action: "join_queue",
        username,
        game_mode: gameMode,
        ...(userId && { user_id: userId }),
        ...(profileImageUrl && { profile_image_url: profileImageUrl }),
      };

      ws.send(JSON.stringify(message));
      setConnectionStatus("waiting");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "waiting":
            setConnectionStatus("waiting");
            break;

          case "game_start":
            console.log("Game start:", data);
            setOpponent(data.opponent);
            setGameId(data.game_id);
            setCurrentWord(data.word);
            setStartTimestamp(data.start_timestamp);
            setConnectionStatus("playing");
            setGamePhase("waiting_for_start");
            setCurrentRound(1);

            // Start countdown
            startCountdownTimer(data.start_timestamp);
            break;

          case "opponent_submit_word":
            console.log("Opponent submitted:", data.point_value);
            setOpponentSubmissions((prev) => [
              ...prev,
              {
                point_value: data.point_value,
              },
            ]);
            setOpponentScore((prev) => prev + data.point_value);
            break;

          case "waiting_for_opponent":
            console.log("Waiting for opponent to finish round");
            setGamePhase("between_rounds");
            break;

          case "next_round":
            console.log("Next round starting:", data);
            setCurrentRound(data.round_number);
            setCurrentWord(data.word);
            setStartTimestamp(data.start_timestamp);
            setGamePhase("between_rounds");

            // Reset round-specific state
            setRoundTimeLeft(30);
            setCorrectStrongestMatches([]);
            setCorrectStrongMatches([]);
            setCorrectWeakMatches([]);
            setIncorrectAnswers([]);
            setOpponentSubmissions([]);
            currentRoundSubmissions.current = [];

            // Start countdown for next round
            startCountdownTimer(data.start_timestamp);
            break;

          case "game_over":
            console.log("Game over:", data);
            setConnectionStatus("game_over");
            // Update final scores from records
            const yourRecord = data.your_record;
            const opponentRecord = data.opponent_record;
            if (yourRecord) {
              setGameScore(yourRecord.total_score || 0);
            }
            if (opponentRecord) {
              setOpponentScore(opponentRecord.total_score || 0);
            }
            break;

          case "opponent_forfeit":
            console.log("Opponent forfeited");
            setConnectionStatus("opponent_forfeit");
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

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [userId, username, profileImageUrl, gameMode]);

  const startCountdownTimer = (targetTimestamp: number) => {
    const updateCountdown = () => {
      const now = Date.now();
      const timeUntilStart = Math.max(0, targetTimestamp - now);
      const secondsLeft = Math.ceil(timeUntilStart / 1000);

      if (secondsLeft > 0) {
        setCountdown(secondsLeft);
        requestAnimationFrame(updateCountdown);
      } else {
        setCountdown(null);
        setGamePhase("active");
        gameStarted.current = true;
      }
    };

    updateCountdown();
  };

  // Timer logic
  useEffect(() => {
    if (gamePhase !== "active") return;

    if (roundTimeLeft === 0) {
      // Time's up - finish the round
      finishRound();
      return;
    }

    const timer = setInterval(() => {
      setRoundTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [roundTimeLeft, gamePhase]);

  const finishRound = () => {
    if (!wsRef.current || !gameId) return;

    console.log(
      "Finishing round with submissions:",
      currentRoundSubmissions.current
    );

    // Send finish_round action
    wsRef.current.send(
      JSON.stringify({
        action: "finish_round",
        game_id: gameId,
        submissions: currentRoundSubmissions.current,
      })
    );

    setGamePhase("between_rounds");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentWord || !opponent || !wsRef.current) return;

    const normalizedAnswer = userAnswer.trim().toLowerCase();
    if (normalizedAnswer === "") return;

    // Check if already submitted (in any category)
    const alreadySubmitted =
      correctStrongestMatches.includes(normalizedAnswer) ||
      correctStrongMatches.includes(normalizedAnswer) ||
      correctWeakMatches.includes(normalizedAnswer) ||
      incorrectAnswers.includes(normalizedAnswer);

    if (alreadySubmitted) {
      setUserAnswer("");
      return;
    }

    const currentWordSynonymsMap = createSynonymsMap(currentWord);

    if (currentWordSynonymsMap.has(normalizedAnswer)) {
      let points = currentWordSynonymsMap.get(normalizedAnswer)!;

      // Double points in round 5
      if (currentRound === 5) {
        points *= 2;
      }

      setGameScore((prev) => prev + points);
      setRoundScore((prev) => prev + points);

      // Track correct answers by strength (use original point value for categorization)
      const originalPoints = currentWordSynonymsMap.get(normalizedAnswer)!;
      if (originalPoints === 3) {
        setCorrectStrongestMatches((prev) => [...prev, normalizedAnswer]);
      } else if (originalPoints === 2) {
        setCorrectStrongMatches((prev) => [...prev, normalizedAnswer]);
      } else if (originalPoints === 1) {
        setCorrectWeakMatches((prev) => [...prev, normalizedAnswer]);
      }

      // Add to round submissions
      currentRoundSubmissions.current.push({
        word: normalizedAnswer,
        point_value: points,
      });

      // Send to opponent via WebSocket
      wsRef.current.send(
        JSON.stringify({
          action: "submit_word",
          opponent_connection_id: opponent.connection_id,
          answered_word: normalizedAnswer,
          point_value: points,
        })
      );

      console.log("Sent word submission to opponent");
    } else {
      setIncorrectAnswers((prev) => [...prev, normalizedAnswer]);
    }

    setUserAnswer("");
  };

  if (connectionStatus === "game_over" && currentWord) {
    const winner =
      gameScore > opponentScore
        ? username
        : gameScore < opponentScore
        ? opponent?.username
        : "Tie";

    return (
      <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <Card className="p-8 max-w-2xl">
          <h2 className="text-4xl font-bold text-center mb-6">Game Over!</h2>
          <div className="space-y-4">
            <div className="text-center text-2xl">
              {winner === "Tie" ? (
                <p className="font-semibold">It's a Tie!</p>
              ) : (
                <p className="font-semibold">{winner} Wins!</p>
              )}
            </div>
            <div className="flex justify-around text-xl">
              <div className="text-center">
                <p className="font-semibold">{username}</p>
                <p className="text-3xl font-bold">{gameScore}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{opponent?.username}</p>
                <p className="text-3xl font-bold">{opponentScore}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (connectionStatus === "opponent_forfeit") {
    return (
      <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <Card className="p-8 max-w-2xl">
          <h2 className="text-4xl font-bold text-center mb-6">Victory!</h2>
          <div className="space-y-4">
            <div className="text-center text-2xl">
              <p className="font-semibold text-muted-foreground mb-2">
                {opponent?.username || "Your opponent"} has disconnected
              </p>
              <p className="text-5xl font-bold text-green-500">You Win!</p>
            </div>
            <div className="text-center mt-6">
              <p className="text-muted-foreground">
                Your opponent forfeited the match
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (connectionStatus === "connecting") {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <Card className="p-6 max-w-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Connecting...</h2>
            <p className="text-muted-foreground">
              Establishing connection to game server
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (connectionStatus === "waiting") {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <Card className="p-6 max-w-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Finding Opponent...</h2>
            <p className="text-muted-foreground">
              Searching for a player in {gameMode} mode
            </p>
            <div className="mt-4">
              <Badge variant="secondary">{username}</Badge>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <Card className="p-6 max-w-2xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-destructive">
              Disconnected
            </h2>
            <p className="text-muted-foreground">
              Connection to server lost. Please refresh to try again.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentWord) return null;

  // Waiting for game start screen (shows VS matchup with countdown)
  if (gamePhase === "waiting_for_start" && opponent) {
    return (
      <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <Card className="p-8 max-w-2xl">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">Match Found!</h2>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-3xl font-bold">
                    {username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold">{username}</p>
              </div>
              <p className="text-4xl font-bold">VS</p>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-2 mx-auto">
                  <span className="text-3xl font-bold">
                    {opponent.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold">{opponent.username}</p>
              </div>
            </div>
            {countdown !== null && (
              <div className="mt-8">
                <p className="text-muted-foreground mb-2">Starting in</p>
                <p className="text-6xl font-bold">{countdown}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Between rounds screen (shows scores and countdown)
  if (gamePhase === "between_rounds" && opponent) {
    return (
      <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <Card className="p-8 max-w-2xl">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">
              {countdown !== null
                ? `Round ${currentRound} Starting...`
                : "Waiting for Opponent..."}
            </h2>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="font-semibold text-lg">{username}</p>
                <p className="text-4xl font-bold">{gameScore}</p>
              </div>
              <p className="text-4xl font-bold">VS</p>
              <div className="text-center">
                <p className="font-semibold text-lg">{opponent.username}</p>
                <p className="text-4xl font-bold">{opponentScore}</p>
              </div>
            </div>
            {countdown !== null && (
              <div className="mt-8">
                <p className="text-muted-foreground mb-2">Get ready!</p>
                <p className="text-6xl font-bold">{countdown}</p>
              </div>
            )}
            {countdown === null && (
              <div className="mt-4">
                <p className="text-muted-foreground">
                  Waiting for opponent to finish...
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const currentWordSynonymsMap = createSynonymsMap(currentWord);
  const formattedTimeLeft =
    roundTimeLeft < 10 ? `0${roundTimeLeft}` : roundTimeLeft;

  return (
    <div className="h-[100dvh] flex justify-center items-center min-w-2xl max-2xl bg-gradient-to-b from-background to-secondary-background">
      <div className="relative">
        <Card className="absolute right-0 -top-13 p-3 pb-15 mr-2 z-[10] bg-secondary-background shadow-lg">
          <p
            className={cn(
              "font-semibold text-2xl transition-colors",
              roundTimeLeft <= 15 && "text-yellow-500",
              roundTimeLeft <= 5 && "text-red-500"
            )}
          >
            00:{formattedTimeLeft}
          </p>
        </Card>
        <Card className="p-6 shadow-lg min-w-2xl bg-secondary border-white relative z-[999] max-w-2xl">
          <div className="flex justify-between items-center z-[999] mb-4">
            <div className="text-center">
              <p className="font-semibold text-sm text-muted-foreground">
                {username}
              </p>
              <p className="font-bold text-2xl">{gameScore}</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-xl">Round {currentRound}/5</p>
              {currentRound === 5 && (
                <Badge
                  variant="default"
                  className="mt-1 bg-yellow-500 hover:bg-yellow-600"
                >
                  2x Points!
                </Badge>
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm text-muted-foreground">
                {opponent?.username}
              </p>
              <p className="font-bold text-2xl">{opponentScore}</p>
            </div>
          </div>

          <Card className="w-full p-6 text-center bg-accent shadow-lg mb-4">
            <p className="text-6xl font-bold">{currentWord.word}</p>
          </Card>

          <Input
            className="focus-visible:ring-accent dark:bg-secondary-background h-12 text-2xl mb-4"
            placeholder="Enter a synonym..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit(e);
              }
            }}
          />

          <div>
            {(correctStrongestMatches.length > 0 ||
              correctStrongMatches.length > 0 ||
              correctWeakMatches.length > 0) && (
              <div className="pb-3">
                <strong>Your Correct Words</strong>
                <div className="pt-2 space-y-3">
                  {correctStrongestMatches.map((match, index) => (
                    <Badge
                      key={`${match}-${index}`}
                      className="ml-2 text-base font-semibold bg-green-400 hover:bg-green-400"
                    >
                      {match} (+{currentRound === 5 ? 6 : 3})
                    </Badge>
                  ))}
                  {correctStrongMatches.map((match, index) => (
                    <Badge
                      key={`${match}-${index}`}
                      className="ml-2 text-base font-semibold bg-green-500 hover:bg-green-500"
                    >
                      {match} (+{currentRound === 5 ? 4 : 2})
                    </Badge>
                  ))}
                  {correctWeakMatches.map((match, index) => (
                    <Badge
                      key={`${match}-${index}`}
                      className="ml-2 text-base font-semibold bg-green-600 hover:bg-green-600"
                    >
                      {match} (+{currentRound === 5 ? 2 : 1})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {incorrectAnswers.length > 0 && (
              <div className="pb-3">
                <strong>Incorrect</strong>
                <div className="pt-2 space-y-3">
                  {incorrectAnswers.map((match, index) => (
                    <Badge
                      key={`${match}-${index}`}
                      className="ml-2 text-base font-semibold bg-red-300"
                    >
                      {match}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {opponentSubmissions.length > 0 && (
              <div className="pb-3">
                <Separator className="my-5" />
                <strong>Opponent's Words</strong>
                <div className="pt-2 space-y-3">
                  {opponentSubmissions.map((submission, idx) => (
                    <Badge
                      key={`${submission}-${idx}`}
                      className={cn(
                        "ml-2 text-base font-semibold min-w-[60px] justify-center",
                        (submission.point_value === 3 ||
                          submission.point_value === 6) &&
                          "bg-green-400 hover:bg-green-400",
                        (submission.point_value === 2 ||
                          submission.point_value === 4) &&
                          "bg-green-500 hover:bg-green-500",
                        (submission.point_value === 1 ||
                          submission.point_value === 2) &&
                          "bg-green-600 hover:bg-green-600"
                      )}
                    >
                      +{submission.point_value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
