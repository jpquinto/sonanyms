"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserByClerkSub } from "@/actions/get_me";
import { UserInfo } from "@/types/user_info";


interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class UserCache {
  private isClient = typeof window !== "undefined";
  private readonly CACHE_KEY = "user_info";

  set(data: UserInfo, ttlHours: number = 24) {
    if (!this.isClient) return;

    const item: CacheItem<UserInfo> = {
      data,
      timestamp: Date.now(),
      ttl: ttlHours * 60 * 60 * 1000,
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(item));
  }

  get(): UserInfo | null {
    if (!this.isClient) return null;

    const stored = localStorage.getItem(this.CACHE_KEY);
    if (!stored) return null;

    try {
      const item: CacheItem<UserInfo> = JSON.parse(stored);

      // Check if cache has expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.clear();
        return null;
      }

      return item.data;
    } catch {
      // Invalid cache data, remove it
      this.clear();
      return null;
    }
  }

  clear() {
    if (!this.isClient) return;
    localStorage.removeItem(this.CACHE_KEY);
  }
}

const userCache = new UserCache();

interface UseUserInfoReturn {
  user: UserInfo | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

export const useUserInfo = (): UseUserInfoReturn => {
  const { user: clerkUser, isLoaded } = useUser();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = userCache.get();
    if (cached) {
      setUser(cached);
    }
  }, []);

  const fetchUserInfo = useCallback(
    async (forceRefresh = false) => {
      // If user is not logged in, clear everything and return
      if (!clerkUser?.id) {
        setUser(null);
        setIsLoading(false);
        userCache.clear();
        return;
      }

      // Check if we already have cached data and don't need to force refresh
      if (!forceRefresh) {
        const cached = userCache.get();
        if (cached && cached.clerk_sub === clerkUser.id) {
          setUser(cached);
          setIsLoading(false);
          return;
        }
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await getUserByClerkSub(clerkUser.id);

        if (result.success && result.user) {
          setUser(result.user);
          userCache.set(result.user);
        } else {
          setError(result.error || "Failed to fetch user information");
          setUser(null);
          userCache.clear();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
        setUser(null);
        userCache.clear();
      } finally {
        setIsLoading(false);
      }
    },
    [clerkUser?.id]
  );

  useEffect(() => {
    if (isLoaded) {
      fetchUserInfo();
    }
  }, [clerkUser?.id, isLoaded, fetchUserInfo]);

  const clearCache = useCallback(() => {
    userCache.clear();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    error,
    refetch: () => fetchUserInfo(true),
    clearCache,
  };
};
