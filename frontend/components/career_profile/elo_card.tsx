"use client";

import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getProgressInfo } from "@/utils/rank_elo_helpers";
import { rankStyles } from "@/utils/elo_styles";
import { Rank } from "@/types/rank";

interface EloCardProps {
  title: string;
  elo: number;
  rank: Rank;
}

export function EloCard({ title, elo, rank }: EloCardProps) {
  const progressInfo = getProgressInfo(elo);
  const rankStyle = rankStyles[rank];

  return (
    <Card className="p-6 bg-accent/10 border-accent/20 shadow-lg">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      <div className="flex items-start gap-6">
        <div
          className={cn(
            "rounded-full overflow-hidden",
            rankStyle.border,
            rankStyle.shadow
          )}
        >
          <Image
            src={`/emblems/${rank}.png`}
            alt={`${rank} rank`}
            width={80}
            height={80}
            className="w-20 h-20"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-foreground">{elo}</span>
          </div>
          <p className="text-lg font-semibold text-accent capitalize mb-2">
            {rank}
          </p>

          {progressInfo ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                {progressInfo.pointsNeeded} points to {progressInfo.nextRank}
              </p>
              {/* Progress Bar */}
              <div className="w-full bg-gray-700/30 rounded-full h-2.5 overflow-hidden">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-500 ease-out",
                    rankStyle.background
                  )}
                  style={{
                    width: `${Math.min(progressInfo.progressPercentage, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {elo - progressInfo.currentRankMin} /{" "}
                {progressInfo.nextRankThreshold - progressInfo.currentRankMin}
              </p>
            </>
          ) : (
            <p className="text-sm text-green-400 font-semibold">
              MAX RANK
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

