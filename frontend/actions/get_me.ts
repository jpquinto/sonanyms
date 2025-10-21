"use server";

import { UserInfo } from "@/types/user_info";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL!;
const USER_API_KEY = process.env.USER_API_KEY!;

interface GetUserResponse {
  success: boolean;
  user?: UserInfo;
  message?: string;
  error?: string;
  statusCode?: number;
}

export const getUserByClerkSub = async (
  clerk_sub: string
): Promise<GetUserResponse> => {
  try {
    if (!clerk_sub) {
      return {
        success: false,
        error: "clerk_sub is required",
        statusCode: 400,
      };
    }

    const response = await axios.get(`${BACKEND_API_URL}/get-me`, {
      params: {
        clerk_sub,
      },
      headers: {
        "Content-Type": "application/json",
        "x-api-key": USER_API_KEY,
      },
      timeout: 10000, // 10 second timeout
    });

    return {
      success: true,
      user: response.data.user,
      message: response.data.message,
      statusCode: response.status,
    };
  } catch (error) {
    console.error("Error fetching user:", error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return {
          success: false,
          error: error.response.data?.message || "User not found",
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
      error: "Network error occurred while fetching user",
    };
  }
};
