type RoundStats = {
  word: string;
  guesses: string[];
  score: number;
};

type RoundSummaryProps = {
  roundStats: RoundStats[];
};

export default function RoundSummary({ roundStats }: RoundSummaryProps) {
  return (
    <div>
      <h2>Round Summary</h2>
      <ul>
        {roundStats.map((round, index) => (
          <li key={index}>
            <h3>Round {index + 1}</h3>
            <p>Word: {round.word}</p>
            <p>Guesses: {round.guesses.join(', ')}</p>
            <p>Score: {round.score}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
