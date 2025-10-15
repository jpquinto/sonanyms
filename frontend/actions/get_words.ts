"use server";

import { GetWordsResponse } from "@/types/word";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;
const USER_API_KEY = process.env.USER_API_KEY!;

export const getWords = async (
  batchSize: number = 5,
  excludeIds: number[] = []
): Promise<GetWordsResponse> => {
  try {
    // Build query parameters
    const params = new URLSearchParams({
      batch_size: batchSize.toString(),
    });

    // Add exclude_ids if provided (convert number array to comma-separated string)
    if (excludeIds.length > 0) {
      params.append("exclude_ids", excludeIds.join(","));
    }

    const response = await axios.get(
      `${BACKEND_API_URL}/get-words?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${USER_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const data = response.data;

    return {
      success: true,
      words: data.words,
      count: data.count,
    };
  } catch (error) {
    console.error("Error fetching words:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          success: false,
          error:
            error.response.data?.message ||
            "No words available in the database",
          statusCode: 404,
        };
      } else if (error.response?.status === 400) {
        return {
          success: false,
          error: error.response.data?.message || "Invalid request parameters",
          statusCode: 400,
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          error: "Access forbidden. Please check your API credentials.",
          statusCode: 403,
        };
      } else if (error.response?.status === 429) {
        return {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
          statusCode: 429,
        };
      } else if (error.response?.status === 500) {
        return {
          success: false,
          error:
            error.response.data?.message ||
            "Server error occurred. Please try again later.",
          statusCode: 500,
        };
      } else {
        return {
          success: false,
          error:
            error.response?.data?.message || "An unexpected error occurred",
          statusCode: error.response?.status,
        };
      }
    }

    if (error instanceof Error && error.message.includes("timeout")) {
      return {
        success: false,
        error: "Request timed out. Please try again.",
      };
    }

    return {
      success: false,
      error: "Network error occurred while fetching words",
    };
  }
};
