import RoundSummary from "./RoundSummary";

type RoundStats = {
  word: string;
  guesses: string[];
  score: number;
};

type GameOverProps = {
  roundStats: RoundStats[];
  totalScore: number;
};

export default function GameOver({ roundStats, totalScore }: GameOverProps) {

    return (
        <div className="min-h-screen bg-gray-800 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl font-mono font-bold text-center mb-8">Game Over</h1>
                <div className="text-center mb-8">
                    <p className="text-4xl font-bold text-yellow-400 mb-2">Final Score: {totalScore}</p>
                    <p className="text-xl text-gray-300">Rounds Completed: {roundStats.length}</p>
                </div>
                <RoundSummary roundStats={roundStats} />
                <div className="text-center mt-8">
                    <p className="text-2xl font-semibold">Thank you for playing!</p>
                    <p className="text-lg text-gray-300 mt-2">Try our other game modes!</p>
                </div>
            </div>
        </div>
    )
}