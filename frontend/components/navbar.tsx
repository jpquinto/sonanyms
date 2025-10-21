"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { AvatarEmblem } from "./ui/avatar-emblem";
import { useUserInfo } from "@/hooks/use_user_info";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
  const { user } = useUserInfo();
  const router = useRouter();

  const handleAvatarClick = () => {
    router.push("/career-profile");
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-secondary-background z-50">
      <div className="mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">SONANYMS</h1>
          </div>

          {/* Auth Section */}
          <div className="flex items-center">
            {!isLoaded ? (
              // Loading state
              <div className="h-9 w-9 animate-pulse rounded-full bg-accent/20" />
            ) : isSignedIn && user ? (
              // Show AvatarEmblem when signed in and user data is loaded
              <button
                onClick={handleAvatarClick}
                className="hover:scale-105 transition-transform cursor-pointer"
                title="View Career Profile"
              >
                <AvatarEmblem
                  profile_picture={user.profile_image || ""}
                  size="sm"
                  rank="master"
                />
              </button>
            ) : isSignedIn && !user ? (
              // Loading user data
              <div className="h-9 w-9 animate-pulse rounded-full bg-accent/20" />
            ) : (
              // Show sign in button when not signed in
              <SignInButton mode="modal">
                <button className="hover:cursor-pointer rounded-md px-4 py-2 text-sm font-medium bg-secondary-background hover:bg-accent text-white transition-colors">
                  Sign In
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
