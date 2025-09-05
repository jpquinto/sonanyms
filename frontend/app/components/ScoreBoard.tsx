import React from 'react';

type ScoreBoardProps = {
  score: number;
};

export default function ScoreBoard({ score }: ScoreBoardProps) {
  return (
    <div className="text-center text-white">
      <h2 className="text-2xl font-bold mb-2">Score Board</h2>
      <p className="text-lg">Current Score: {score}</p>
    </div>
  );
}