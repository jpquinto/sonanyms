'use client';

//importing necessary components and hooks
import React, { useState, useEffect } from 'react'
import Timer from "./Timer";
import GuessInput from "./GuessInput";
import Guesses from "./Guesses";
import ScoreBoard from "./ScoreBoard";
import RoundSummary from "./RoundSummary";
// import { targetWords } from '../lib/mockData';

export default function Game() {

  const [word, setWord] = useState('destroy')
  const [guess, setGuess] = useState<string>('')
  const [guesses, setGuesses] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeleft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [roundStats, setRoundStats] = useState<{ word: string, guesses: string[], score: number }[]>([]);

  useEffect(() => {
    if (timeleft <= 0) {
      setGameOver(true);
      setRoundStats((prevStats) => [...prevStats, { word, guesses, score }]);
    }
  }, [timeleft, word, guesses, score]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuess(e.target.value)
  }

  const handleSubmit = async () => {
    //add the guess to the list
    if (guess.trim() === '') return;

    if (guesses.length >= 3) {
      alert("You can only make 3 guesses!");
      return;
    }
    setGuesses([...guesses, guess.trim()]);

    // Example scoring logic: +10 points for each guess
    setScore((prevScore) => prevScore + 10);

    setGuess('');
    //incorporate logic later to check if the guess is correct
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-800'>
      <div><Timer timeleft={timeleft} setTimeLeft={setTimeLeft} setGameOver={setGameOver} /></div>
      <h1 className='text-white text-3xl font-bold mb-4'>Currently Guessed Words</h1>

      <div><GuessInput guess={guess} handleInput={handleInput} handleSubmit={handleSubmit} /></div>
      <div><Guesses guesses={guesses} /></div>
      <div><ScoreBoard score={score} /></div>
      <div><RoundSummary roundStats={roundStats} /></div>

      {/* Displaying useState hooks for debugging */}
      <div className='text-gray-300 mt-4'>
        <p>Word: {word}</p>
        <p>Guess: {guess}</p>
        <p>Guesses: {guesses.join(', ')}</p>
        <p>Score: {score}</p>
        <p>Time Left: {timeleft}</p>
        <p>Game Over: {gameOver ? 'Yes' : 'No'}</p>
        <p>Round Stats: {JSON.stringify(roundStats)}</p>
      </div>
    </div>
  )
}

