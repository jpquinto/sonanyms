
'use client';

import React, { useState, useEffect } from 'react'


export default function Homepage() {

  const [word, setWord] = useState('destroy')
  const [guess, setGuess] = useState<string>('')
  const [guesses, setGuesses] = useState<string[]>([]);

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
    setGuesses([...guesses,guess.trim()])
    setGuess('')
    //incorporate logic later to check if the guess is correct
  }

  return (
    <div className='flex flex-col items-center justify-center h-screen bg-gray-800'>
      <h1 className='text-4xl font-bold text-white mb-6'>Sonanyms Guessing Game</h1>
      <p className='text-lg text-gray-300 mb-4'>Type a synonym for: {word}</p>
      <ul className='list-none'>
        {guesses.map((guess, index) => (
          <li key={index}>
            {index + 1}. {guess}
          </li>
        ))}
      </ul>
      
      <input
        type='text'
        value={guess}
        placeholder='Enter your guess'
        onChange={handleInput}
        className='p-2 mb-4 border border-gray-600 rounded'
      />
      <button
        onClick={handleSubmit}
        className='px-4 py-2 text-white bg-blue-950 rounded hover:bg-blue-500'
      >
        Submit
      </button>
    </div>
  )
}

