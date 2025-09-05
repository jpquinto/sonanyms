// GuessInput component for user text input
import React from 'react';
type GuessInputProps = {
  guess: string;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
};

export default function GuessInput({ guess, handleInput, handleSubmit }: GuessInputProps) {
  return (
    <div className='flex flex-col items-center mb-4'>
      <input
        type='text'
        value={guess}
        onChange={handleInput}
        placeholder='Type your guess here...'
        className='px-4 py-2 text-gray-800 rounded mb-2'
      />
      <button
        onClick={handleSubmit}
        className='px-4 py-2 text-white bg-blue-950 rounded hover:bg-blue-500'
      >
        Submit Guess
      </button>
    </div>
  );
}