"use client";

import { useUserInfo } from "@/hooks/use_user_info";
import { Loader2, RefreshCw, User } from "lucide-react";
import { AvatarEmblem } from "../ui/avatar-emblem";
import { Card } from "../ui/card";
import { getRankFromElo } from "@/utils/rank_elo_helpers";
import { EloCard } from "./elo_card";

export function CareerProfile() {
  const { user, isLoading, error, refetch } = useUserInfo();

  if (isLoading) {
    return (
      <div className="h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <Card className="bg-secondary-background border-white shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Error Loading Profile
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors font-semibold"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex justify-center items-center bg-gradient-to-b from-background to-secondary-background">
        <Card className="bg-secondary-background border-white shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Not Logged In
            </h2>
            <p className="text-muted-foreground">
              Please log in to view your career profile
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const singlePlayerElo = user.single_player_elo ?? 0;
  const multiplayerElo = user.multiplayer_elo ?? 0;
  const singlePlayerRank = getRankFromElo(singlePlayerElo);
  const multiplayerRank = getRankFromElo(multiplayerElo);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-secondary-background py-8 px-4 flex justify-center items-center">
      <div className="min-w-2xl max-w-4xl mx-auto">
        <Card className="bg-secondary-background border-white shadow-lg overflow-hidden pt-0">
          {/* Header Section */}
          <div className="bg-accent px-8 py-12 shadow-xl">
            <div className="flex items-center gap-6">
              {user.profile_image ? (
                <AvatarEmblem
                  profile_picture={user.profile_image}
                  size="lg"
                  rank={singlePlayerRank}
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center">
                  <User className="w-12 h-12 text-accent" />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-accent-foreground mb-2">
                  {user.first_name} {user.last_name}
                </h1>
                {user.username && (
                  <p className="text-accent-foreground/80 text-lg">
                    @{user.username}
                  </p>
                )}
              </div>
              <button
                onClick={() => refetch()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Refresh profile"
              >
                <RefreshCw className="w-5 h-5 text-accent-foreground" />
              </button>
            </div>
          </div>

          {/* Ranking Section */}
          <div className="px-8 py-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Rankings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EloCard
                title="Solo"
                elo={1800}
                rank={"diamond"}
              />
              <EloCard
                title="Multiplayer"
                elo={3450}
                rank={"champion"}
              />
            </div>
          </div>

          {/* Profile Information */}
          <div className="px-8 py-6 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Profile Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 bg-accent/10 border-accent/20">
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <p className="text-foreground font-semibold text-lg">
                    {user.first_name}
                  </p>
                </Card>
                <Card className="p-4 bg-accent/10 border-accent/20">
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <p className="text-foreground font-semibold text-lg">
                    {user.last_name}
                  </p>
                </Card>
              </div>

              {user.username && (
                <Card className="p-4 bg-accent/10 border-accent/20">
                  <label className="text-sm font-medium text-muted-foreground">
                    Username
                  </label>
                  <p className="text-foreground font-semibold text-lg">
                    @{user.username}
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Career Statistics Section */}
          <div className="px-8 py-6 bg-secondary border-t border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Career Statistics
            </h2>
            <Card className="p-6 bg-accent/10 border-accent/20">
              <p className="text-muted-foreground text-center">
                Game history and statistics coming soon...
              </p>
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
}
