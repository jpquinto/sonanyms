"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bot } from "@/bots/bots";
import { Word } from "@/types/word";
import { getWords } from "@/actions/get_words";
import { Avatar, AvatarImage } from "../ui/avatar";
import Image from "next/image";

interface BotGameClientProps {
  username: string;
  bot: Bot;
}

type GamePhase = "countdown" | "active" | "between_rounds" | "game_over";

interface BotSubmission {
  point_value: number;
}

const createSynonymsMap = (word: Word): Map<string, number> => {
  const map = new Map<string, number>();

  word.strongest_matches.forEach((syn) => map.set(syn.toLowerCase(), 3));
  word.strong_matches.forEach((syn) => map.set(syn.toLowerCase(), 2));
  word.weak_matches.forEach((syn) => map.set(syn.toLowerCase(), 1));

  return map;
};

export const BotGameClient = ({
  username,
  bot,
}: BotGameClientProps) => {
  const [gamePhase, setGamePhase] = useState<GamePhase>("countdown");
  const [countdown, setCountdown] = useState(3);
  const [currentRound, setCurrentRound] = useState(1);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [roundTimeLeft, setRoundTimeLeft] = useState(30);

  // Scores
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);

  // User input
  const [userAnswer, setUserAnswer] = useState("");

  // Answer tracking
  const [correctStrongestMatches, setCorrectStrongestMatches] = useState<
    string[]
  >([]);
  const [correctStrongMatches, setCorrectStrongMatches] = useState<string[]>(
    []
  );
  const [correctWeakMatches, setCorrectWeakMatches] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);

  // Bot submissions
  const [botSubmissions, setBotSubmissions] = useState<BotSubmission[]>([]);
  const [botVoiceLine, setBotVoiceLine] = useState<string | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Fetch words on mount
  useEffect(() => {
    const fetchWords = async () => {
      const response = await getWords(5);
      if (response.success && response.words) {
        setWords(response.words);
        setCurrentWord(response.words[0]);
        setIsLoading(false);
      }
    };
    fetchWords();
  }, []);

  // Initial countdown
  useEffect(() => {
    if (gamePhase === "countdown" && !isLoading) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGamePhase("active");
        setRoundTimeLeft(30);
      }
    }
  }, [countdown, gamePhase, isLoading]);

  // Round timer and bot simulation
  useEffect(() => {
    if (gamePhase !== "active") return;

    if (roundTimeLeft === 0) {
      finishRound();
      return;
    }

    const timer = setInterval(() => {
      setRoundTimeLeft((prev) => prev - 1);

      // Simulate bot behavior each second
      const botAction = bot.simulateSecond();
      if (botAction) {
        const points =
          currentRound === 5 ? botAction.pointValue * 2 : botAction.pointValue;
        setBotScore((prev) => prev + points);
        setBotSubmissions((prev) => [...prev, { point_value: points }]);
      }

      // Check for bot voice line
      const voiceLine = bot.getRandomVoiceLine();
      if (voiceLine) {
        setBotVoiceLine(voiceLine);
        setTimeout(() => setBotVoiceLine(null), 5000);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [roundTimeLeft, gamePhase, currentRound]);

  const finishRound = () => {
    if (currentRound === 5) {
      setGamePhase("game_over");
      return;
    }

    // Move to next round
    setGamePhase("between_rounds");
    setCountdown(3);

    // Start countdown for next round
    setTimeout(() => {
      setCurrentRound((prev) => prev + 1);
      setCurrentWord(words[currentRound]);
      setRoundTimeLeft(30);
      setUserAnswer("");
      setCorrectStrongestMatches([]);
      setCorrectStrongMatches([]);
      setCorrectWeakMatches([]);
      setIncorrectAnswers([]);
      setBotSubmissions([]);
      setGamePhase("countdown");
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWord) return;

    const normalizedAnswer = userAnswer.trim().toLowerCase();
    if (normalizedAnswer === "") return;

    // Check if already submitted
    const alreadySubmitted =
      correctStrongestMatches.includes(normalizedAnswer) ||
      correctStrongMatches.includes(normalizedAnswer) ||
      correctWeakMatches.includes(normalizedAnswer) ||
      incorrectAnswers.includes(normalizedAnswer);

    if (alreadySubmitted) {
      setUserAnswer("");
      return;
    }

    const synonymsMap = createSynonymsMap(currentWord);

    if (synonymsMap.has(normalizedAnswer)) {
      let points = synonymsMap.get(normalizedAnswer)!;

      // Double points in round 5
      if (currentRound === 5) {
        points *= 2;
      }

      setUserScore((prev) => prev + points);

      // Track by strength (use original point value for categorization)
      const originalPoints = synonymsMap.get(normalizedAnswer)!;
      if (originalPoints === 3) {
        setCorrectStrongestMatches((prev) => [...prev, normalizedAnswer]);
      } else if (originalPoints === 2) {
        setCorrectStrongMatches((prev) => [...prev, normalizedAnswer]);
      } else if (originalPoints === 1) {
        setCorrectWeakMatches((prev) => [...prev, normalizedAnswer]);
      }
    } else {
      setIncorrectAnswers((prev) => [...prev, normalizedAnswer]);
    }

    setUserAnswer("");
  };

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          </div>
        </Card>
      </div>
    );
  }

  // Game Over Screen
  if (gamePhase === "game_over") {
    const winner =
      userScore > botScore ? username : userScore < botScore ? bot.name : "Tie";

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
                <p className="text-3xl font-bold">{userScore}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{bot.name}</p>
                <p className="text-3xl font-bold">{botScore}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Countdown screens (initial and between rounds)
  if (gamePhase === "countdown" || gamePhase === "between_rounds") {
    return (
      <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <Card className="p-8 max-w-2xl">
          <div className="text-center space-y-6">
            <h2 className="text-3xl font-bold">
              {gamePhase === "countdown" && currentRound === 1
                ? "Get Ready!"
                : `Round ${currentRound} Starting...`}
            </h2>
            {gamePhase === "between_rounds" && (
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <p className="font-semibold text-lg">{username}</p>
                  <p className="text-4xl font-bold">{userScore}</p>
                </div>
                <p className="text-4xl font-bold">VS</p>
                <div className="text-center">
                  <p className="font-semibold text-lg">{bot.name}</p>
                  <p className="text-4xl font-bold">{botScore}</p>
                </div>
              </div>
            )}
            <div className="mt-8">
              <p className="text-muted-foreground mb-2">Starting in</p>
              <p className="text-6xl font-bold">{countdown}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentWord) return null;

  const formattedTimeLeft =
    roundTimeLeft < 10 ? `0${roundTimeLeft}` : roundTimeLeft;

  return (
    <div className="h-[100dvh] flex justify-center items-center min-w-2xl max-2xl bg-gradient-to-b from-background to-secondary-background">
      <div className="relative">
        <Card className="absolute left-0 -top-13 p-3 pb-15 ml-2 z-[10] bg-secondary-background shadow-lg">
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

        {/* Bot voice line */}
        {botVoiceLine && (
          <Card className="absolute right-0 -top-13 p-3 ml-2 z-[10] bg-secondary-background text-white shadow-lg animate-in fade-in slide-in-from-right">
            <p className="font-semibold text-sm">💬 {botVoiceLine}</p>
          </Card>
        )}

        <Card className="p-6 shadow-lg min-w-2xl bg-secondary border-white relative z-[999] max-w-2xl">
          <div className="flex justify-between items-center z-[999] mb-4">
            <div className="text-center">
              <p className="font-semibold text-sm text-muted-foreground">
                {username}
              </p>
              <p className="font-bold text-2xl">{userScore}</p>
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
            <div className="text-center flex flex-col items-center space-y-2">
              <p className="font-semibold text-sm text-primary">
                {bot.name}
              </p>
              <Image
                src={bot.profilePicture}
                alt={bot.name}
                width={500}
                height={500}
                className="rounded-full w-30 h-30 object-cover"
              />
              <p className="font-bold text-2xl">{botScore}</p>
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
            {botSubmissions.length > 0 && (
              <div className="pb-3">
                <Separator className="my-5" />
                <strong>{bot.name}'s Words</strong>
                <div className="pt-2 space-y-3">
                  {botSubmissions.map((submission, idx) => (
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
