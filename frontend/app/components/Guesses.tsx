// Gueeses List containg all the guesses made by the player

// import React from 'react';
type GuessesProps = {
  guesses: string[];
};
export default function Guesses({ guesses }: GuessesProps) {
  return (
    <ul className='list-none'>
      {guesses.map((guess, index) => (
        <li key={index} className='text-gray-300 mb-2'>
          {index + 1}. {guess}
        </li>
      ))}
    </ul>
  );
}