type RoundStats = {
  word: string;
  guesses: string[];
  score: number;
};

type RoundSummaryProps = {
  roundStats: RoundStats[];
};

export default function RoundSummary({ roundStats }: RoundSummaryProps) {
  if (roundStats.length === 0) {
    return (
      <div className="text-gray-500 text-lg">
        No rounds completed yet.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-4 text-white">Game Summary</h2>
      <div className="space-y-4">
        {roundStats.map((round, index) => (
          <div key={index} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
            <h3 className="text-xl font-bold mb-2 text-white">Round {index + 1}</h3>
            <p className="text-lg mb-2 text-gray-200"><span className="font-semibold">Word:</span> {round.word}</p>
            <p className="text-lg mb-2 text-gray-200">
              <span className="font-semibold">Guesses ({round.guesses.length}): </span> 
              {round.guesses.length > 0 ? round.guesses.join(', ') : 'No guesses made'}
            </p>
            <p className="text-lg font-semibold text-green-400">Score: {round.score}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
