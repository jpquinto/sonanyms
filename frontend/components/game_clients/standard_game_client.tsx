"use client";

import { getWords } from "@/actions/get_words";
import { addSinglePlayerGame } from "@/actions/add_single_player_game";
import { Word } from "@/types/word";
import { createSynonymsMap } from "@/utils/create_synonyms_map";
import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import GameOver from "@/app/components/GameOver";
import { useUser } from "@clerk/nextjs";
import { useUserInfo } from "@/hooks/use_user_info";

export const StandardGameClient = () => {
  const { user, isLoading: isUserLoading } = useUserInfo();

  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answeredWordIds, setAnsweredWordIds] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState("");

  const [gameScore, setGameScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);

  const [roundTimeLeft, setRoundTimeLeft] = useState(60); // seconds

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [correctStrongestMatches, setCorrectStrongestMatches] = useState<
    string[]
  >([]);
  const [correctStrongMatches, setCorrectStrongMatches] = useState<string[]>(
    []
  );
  const [correctWeakMatches, setCorrectWeakMatches] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);
  const [roundStats, setRoundStats] = useState<
    { word: string; guesses: string[]; score: number }[]
  >([]);
  const [gameSaved, setGameSaved] = useState(false);

  const currentWord = words[currentWordIndex];

  const fetchWords = async (excludeIds: number[] = []) => {
    setIsLoading(true);
    setError(null);

    const response = await getWords(5, excludeIds);

    if (response.success && response.words) {
      setWords((prevWords) => [...prevWords, ...response.words!]);
    } else {
      setError(response.error || "Failed to fetch words");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchWords();
  }, []);

  // Save game results when game is over
  useEffect(() => {
    const saveGameResults = async () => {
      // Only save if user is logged in, game is over, and we haven't saved yet
      if (!gameOver || isUserLoading || !user?.user_id || gameSaved) {
        return;
      }

      // Prepare round info for the API
      const roundInfoForAPI = roundStats.map((stat) => ({
        word: stat.word,
        score: stat.score,
      }));

      try {
        const result = await addSinglePlayerGame(
          user.user_id,
          "synonyms-solo",
          roundInfoForAPI,
          gameScore
        );

        if (result.success) {
          console.log("Game saved successfully with ID:", result.game_id);
          setGameSaved(true);
        } else {
          console.error("Failed to save game:", result.error);
        }
      } catch (error) {
        console.error("Error saving game results:", error);
      }
    };

    saveGameResults();
  }, [
    gameOver,
    isUserLoading,
    user?.user_id,
    roundStats,
    gameScore,
    gameSaved,
  ]);

  useEffect(() => {
    if (currentWordIndex >= 4) {
      if (currentWord && roundStats.length < 5) {
        const allGuesses = [
          ...correctStrongestMatches,
          ...correctStrongMatches,
          ...correctWeakMatches,
          ...incorrectAnswers,
        ];

        setRoundStats((prev) => [
          ...prev,
          {
            word: currentWord.word,
            guesses: allGuesses,
            score: roundScore,
          },
        ]);
      }
      setGameOver(true);
      return;
    }

    if (roundTimeLeft === 0) {
      const allGuesses = [
        ...correctStrongestMatches,
        ...correctStrongMatches,
        ...correctWeakMatches,
        ...incorrectAnswers,
      ];

      setRoundStats((prev) => [
        ...prev,
        {
          word: currentWord.word,
          guesses: allGuesses,
          score: roundScore,
        },
      ]);

      setCurrentWordIndex((prev) => prev + 1);
      setRoundTimeLeft(60);
      setRoundScore(0);
      setCorrectStrongestMatches([]);
      setCorrectStrongMatches([]);
      setCorrectWeakMatches([]);
      setIncorrectAnswers([]);
      setAnsweredWordIds((prev) => [...prev, currentWord.word_id.toString()]);
      setUserAnswer("");

      return;
    }

    const timer = setInterval(() => {
      setRoundTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [roundTimeLeft]);

  if (gameOver) {
    return (
      <div>
        <GameOver roundStats={roundStats} totalScore={gameScore} />
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const currentWordSynonymsMap = createSynonymsMap(currentWord);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedAnswer = userAnswer.trim().toLowerCase();
    if (normalizedAnswer === "") return;

    if (currentWordSynonymsMap.has(normalizedAnswer)) {
      const points = currentWordSynonymsMap.get(normalizedAnswer)!;
      setGameScore((prev) => prev + points);
      setRoundScore((prev) => prev + points);

      // Track correct answers by strength
      if (points === 3) {
        setCorrectStrongestMatches((prev) => [...prev, normalizedAnswer]);
        // setRoundTimeLeft((prev) => prev + 10);
      } else if (points === 2) {
        setCorrectStrongMatches((prev) => [...prev, normalizedAnswer]);
        // setRoundTimeLeft((prev) => prev + 5);
      } else if (points === 1) {
        setCorrectWeakMatches((prev) => [...prev, normalizedAnswer]);
        // setRoundTimeLeft((prev) => prev + 3);
      }
    } else {
      setIncorrectAnswers((prev) => [...prev, normalizedAnswer]);
    }

    setUserAnswer("");
  };

  const formattedTimeLeft =
    roundTimeLeft < 10 ? `0${roundTimeLeft}` : roundTimeLeft;

  return (
    <div className="h-[100dvh] flex justify-center items-center min-w-2xl max-2xl bg-gradient-to-b from-background to-secondary-background">
      <div className="relative">
        <Card className="absolute right-0 -top-13 p-3 pb-15 mr-2 z-[10] bg-secondary-background shadow-lg">
          <p
            className={cn(
              "font-semibold text-2xl transition-colors",
              roundTimeLeft <= 30 && "text-yellow-500",
              roundTimeLeft <= 10 && "text-red-500"
            )}
          >
            00:{formattedTimeLeft}
          </p>
        </Card>
        <Card className="p-6 shadow-lg min-w-2xl bg-secondary border-white relative z-[999]">
          <div className="flex justify-between items-center z-[999]">
            <p className="font-semibold text-xl">
              Round: {currentWordIndex + 1} / 5
            </p>
            <p className="font-semibold text-xl">
              Score: {gameScore} (Round: {roundScore})
            </p>
          </div>
          <Card className="w-full p-6 text-center bg-accent shadow-lg">
            <p className="text-6xl font-bold">{currentWord.word}</p>
          </Card>
          <Input
            className="focus-visible:ring-accent dark:bg-secondary-background h-12 text-2xl"
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
            {correctStrongestMatches.length > 0 && (
              <div className="pb-3">
                <strong>Strongest Matches</strong>
                <div className="pt-2">
                  {correctStrongestMatches.map((match) => (
                    <Badge key={match} className="ml-2 text-base font-semibold">
                      {match}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {correctStrongMatches.length > 0 && (
              <div className="pb-3">
                <strong>Strong Matches</strong>
                <div className="pt-2">
                  {correctStrongMatches.map((match) => (
                    <Badge key={match} className="ml-2 text-base font-semibold">
                      {match}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {correctWeakMatches.length > 0 && (
              <div className="pb-3">
                <strong>Weak Matches</strong>
                <div className="pt-2">
                  {correctWeakMatches.map((match) => (
                    <Badge key={match} className="ml-2 text-base font-semibold">
                      {match}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {incorrectAnswers.length > 0 && (
              <div className="pb-3">
                <strong>Incorrect</strong>
                <div className="pt-2">
                  {incorrectAnswers.map((match) => (
                    <Badge
                      key={match}
                      className="ml-2 text-base font-semibold bg-red-300"
                    >
                      {match}
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
