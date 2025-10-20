"use client";

import { getFirstChains } from "@/actions/get_first_chains";
import { FirstChain } from "@/types/chains";
import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface GuessedWord {
    word: string;
    rank: number;
    points: number;
}

export const FirstChainGameClient = () => {
  const [firstChains, setFirstChains] = useState<FirstChain[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");

  const [gameScore, setGameScore] = useState(0);
  const [roundScore, setRoundScore] = useState(0);

  const [roundTimeLeft, setRoundTimeLeft] = useState(60); // seconds

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const [guessedWords, setGuessedWords] = useState<GuessedWord[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);
  const [outsideTop10, setOutsideTop10] = useState<string[]>([]);

  const currentChain = firstChains[currentWordIndex];

  console.log(firstChains);

  const fetchFirstChains = async (excludeIds: number[] = []) => {
    setIsLoading(true);
    setError(null);

    const response = await getFirstChains(5, excludeIds);

    if (response.success && response.words) {
      setFirstChains((prevChains) => [...prevChains, ...response.words!]);
    } else {
      setError(response.error || "Failed to fetch chain words");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchFirstChains();
  }, []);

  useEffect(() => {
    if (currentWordIndex >= 5) {
      setGameOver(true);
      return;
    }

    // Round over
    if (roundTimeLeft === 0) {
      handleRoundEnd();
      return;
    }

    const timer = setInterval(() => {
      setRoundTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [roundTimeLeft, currentWordIndex]);

  const handleRoundEnd = () => {
    // If we are at the last round, end game
    if (currentWordIndex >= 4) {
      setGameOver(true);
      return;
    }

    setCurrentWordIndex((prev) => prev + 1);
    setRoundTimeLeft(60);
    setRoundScore(0);
    setGuessedWords([]);
    setIncorrectAnswers([]);
    setOutsideTop10([]);
    setUserAnswer("");
  };

  if (gameOver) {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <Card className="p-8 shadow-lg">
          <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
          <p className="text-2xl">Final Score: {gameScore}</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!currentChain) {
    return (
      <div className="h-[100dvh] flex justify-center items-center">
        <div>No chain words available</div>
      </div>
    );
  }

  // Helper function to check if two words match (exact, plural, or close)
  const wordsMatch = (word1: string, word2: string): boolean => {
    const w1 = word1.toLowerCase().trim();
    const w2 = word2.toLowerCase().trim();

    // Exact match
    if (w1 === w2) return true;

    // Plural matching - check if one is plural of the other
    // Handle common plural patterns
    const pluralPatterns = [
      { singular: w1, plural: w1 + "s" },
      { singular: w1, plural: w1 + "es" },
      { singular: w1.replace(/y$/, ""), plural: w1.replace(/y$/, "ies") },
      { singular: w2, plural: w2 + "s" },
      { singular: w2, plural: w2 + "es" },
      { singular: w2.replace(/y$/, ""), plural: w2.replace(/y$/, "ies") },
    ];

    for (const pattern of pluralPatterns) {
      if (
        (w1 === pattern.singular && w2 === pattern.plural) ||
        (w1 === pattern.plural && w2 === pattern.singular)
      ) {
        return true;
      }
    }

    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedAnswer = userAnswer.trim().toLowerCase();
    if (normalizedAnswer === "") return;

    // Check if already guessed (using fuzzy matching)
    if (
      guessedWords.some((g) => wordsMatch(g.word, normalizedAnswer)) ||
      incorrectAnswers.some((w) => wordsMatch(w, normalizedAnswer)) ||
      outsideTop10.some((w) => wordsMatch(w, normalizedAnswer))
    ) {
      setUserAnswer("");
      return;
    }

    // Find the word in the links (top 20) using fuzzy matching
    const wordIndex = currentChain.links.findIndex((link) =>
      wordsMatch(link.word, normalizedAnswer)
    );

    if (wordIndex !== -1) {
      const rank = wordIndex + 1;

      if (rank <= 10) {
        // Top 10 - award points
        let points = 0;
        if (rank <= 3) {
          points = 3;
        } else if (rank <= 6) {
          points = 2;
        } else {
          points = 1;
        }

        setGameScore((prev) => prev + points);
        setRoundScore((prev) => prev + points);
        setGuessedWords((prev) => [
          ...prev,
          { word: normalizedAnswer, rank, points },
        ]);
      } else {
        // Rank 11-20 - no points
        setOutsideTop10((prev) => [...prev, normalizedAnswer]);
      }
    } else {
      // Not in top 20
      setIncorrectAnswers((prev) => [...prev, normalizedAnswer]);
    }

    setUserAnswer("");
  };

  const formattedTimeLeft =
    roundTimeLeft < 10 ? `0${roundTimeLeft}` : roundTimeLeft;

  // Create array of top 10 slots
  const top10Slots = Array.from({ length: 10 }, (_, index) => {
    const rank = index + 1;
    const guessed = guessedWords.find((g) => g.rank === rank);
    return {
      rank,
      word: guessed ? currentChain.links[index].word : null,
      isGuessed: !!guessed,
    };
  });

  return (
    <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background p-4">
      <div className="flex gap-4 items-start">
        {/* Main Game Card */}
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
          <Card className="p-6 shadow-lg min-w-2xl bg-secondary border-white relative z-[999]">
            <div className="flex justify-between items-center z-[999] mb-4">
              <p className="font-semibold text-xl">
                Round: {currentWordIndex + 1} / 5
              </p>
              <p className="font-semibold text-xl">
                Score: {gameScore} (Round: {roundScore})
              </p>
            </div>
            <Card className="w-full p-6 text-center bg-accent shadow-lg mb-4">
              <p className="text-6xl font-bold">{currentChain.first_chain}...</p>
            </Card>
            <Input
              className="focus-visible:ring-accent dark:bg-secondary-background h-12 text-2xl mb-4"
              placeholder="Enter a word that follows..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(e);
                }
              }}
            />
            <div>
              {outsideTop10.length > 0 && (
                <div className="pb-3">
                  <strong>Outside Top 10 (No Points)</strong>
                  <div className="pt-2">
                    {outsideTop10.map((match) => (
                      <Badge
                        key={match}
                        className="ml-2 text-base font-semibold bg-yellow-500"
                      >
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
                        className="ml-2 text-base font-semibold bg-red-500"
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
        {/* Top 10 Box Display */}
        <Card className="p-4 shadow-lg bg-secondary border-white">
          <h3 className="font-semibold text-lg mb-3 text-center">Top 10</h3>
          <div className="flex flex-col gap-2">
            {top10Slots.map((slot, index) => (
              <div
                key={slot.rank}
                className={cn(
                  "w-48 h-12 border-2 rounded flex items-center justify-center font-semibold transition-all",
                  slot.isGuessed
                    ? "bg-green-500 border-green-600 text-white"
                    : "bg-gray-200 border-gray-400 dark:bg-gray-700 dark:border-gray-600"
                )}
              >
                {slot.isGuessed ? (
                  <span>
                    #{slot.rank}: {slot.word}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-lg">
                    {currentChain.links[index].word.charAt(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
