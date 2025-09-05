import { useEffect } from "react"; 
import React from 'react';

type TimerProps = {
  timeleft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Timer({ timeleft, setTimeLeft, setGameOver }: TimerProps) {
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    if (timeleft <= 0) {
      setGameOver(true);
      clearInterval(timer);
    }

    return () => clearInterval(timer);
  }, [setTimeLeft, setGameOver, timeleft]);

  return (
    <div className="text-lg text-gray-300 mb-4">
      Time left: {timeleft} seconds
    </div>
  );

}