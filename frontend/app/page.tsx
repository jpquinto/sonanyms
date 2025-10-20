'use client';
import React from 'react';
import Link from 'next/link';


export default function Homepage() {

  return (
    //Homepage
    <div className='flex flex-col items-center justify-center h-screen bg-gray-800'>
      <h1 className='text-4xl font-bold text-white mb-6'>Welcome to Sonanyms</h1>
      <p className='text-lg text-gray-300 mb-4'>A fun game to test your vocabulary!</p>
      <Link href={"/games"}
        className='px-4 py-2 text-white bg-blue-950 rounded hover:bg-blue-500'
      >
        Start Game
      </Link>
    </div>
  )
}

