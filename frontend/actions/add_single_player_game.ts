"use server";

import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;
const USER_API_KEY = process.env.USER_API_KEY!;

interface AddGameResponse {
  success: boolean;
  message?: string;
  game_id?: string;
  error?: string;
  statusCode?: number;
}

export const addSinglePlayerGame = async (
  user_id: string,
  game_mode: string,
  round_info: { word: string; score: number },
  final_score: number
): Promise<AddGameResponse> => {
  try {
    const response = await axios.post(
      `${BACKEND_API_URL}/game-history`,
      {
        user_id,
        game_mode,
        round_info,
        final_score,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": USER_API_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return {
      success: true,
      message: response.data.message,
      game_id: response.data.game_id,
      statusCode: response.status,
    };
  } catch (error) {
    console.error("Error adding game history:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          success: false,
          error: error.response.data?.message || "Endpoint not found",
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
      error: "Network error occurred while saving game history",
    };
  }
};
