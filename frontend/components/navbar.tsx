"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <nav className="absolute top-0 left-0 w-full bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">SONANYMS</h1>
          </div>

          {/* Auth Section */}
          <div className="flex items-center">
            {!isLoaded ? (
              // Loading state
              <div className="h-8 w-8 animate-pulse rounded-full" />
            ) : isSignedIn ? (
              // Show user avatar when signed in
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />
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