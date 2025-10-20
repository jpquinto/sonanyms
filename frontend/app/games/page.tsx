'use client';


import Game from "../components/Game"
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Display different game modes
export default function GamesPage() {

  const [selectMode, setSelectMode] = useState<"standard" | "multiplayer" | "bots">();


return (
  <div className="flex flex-col items-center justify-starter min-h-screen bg-gray-800 text-white">
    <div className="text-6xl font-bold mb-8">Select Game Mode</div>
    <div className="flex flex-col space-y-4">
      <Link 
        href="/games/standard"
        className={`text-3xl px-4 py-2 rounded ${
          selectMode === 'standard' ? 'bg-blue-600' : 'bg-gray-400 hover:bg-blue-500'
        }`}
        >
        Standard
      </Link>

      <Link 
        href="/games/multiplayer"
        className={`text-3xl px-4 py-2 rounded ${
          selectMode === 'multiplayer' ? 'bg-blue-600' : 'bg-gray-400 hover:bg-blue-500'
        }`}
        >
        Multiplayer
      </Link>

      <Link 
        href="/games/bots"
        className={`text-3xl px-4 py-2 rounded ${
          selectMode === 'bots' ? 'bg-blue-600' : 'bg-gray-400 hover:bg-blue-500'
        }`}
        >
        Play Bots
      </Link>
      </div>

  </div>
)
}

