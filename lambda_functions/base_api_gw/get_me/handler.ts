import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const { USERS_TABLE_NAME } = process.env;

interface UserResponse {
  user_id: string;
  clerk_sub: string;
  first_name: string;
  last_name: string;
  username?: string;
  profile_image?: string;
  single_player_elo?: number;
  multiplayer_elo?: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get clerk_sub from query parameters
    const clerk_sub = event.queryStringParameters?.clerk_sub;

    if (!clerk_sub) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "clerk_sub parameter is required",
        }),
      };
    }

    // Query using the clerk_sub index
    const command = new QueryCommand({
      TableName: USERS_TABLE_NAME,
      IndexName: "clerk_sub_index",
      KeyConditionExpression: "clerk_sub = :clerk_sub AND sort_key = :sort_key",
      ExpressionAttributeValues: marshall({
        ":clerk_sub": clerk_sub,
        ":sort_key": "A",
      }),
    });

    const response = await client.send(command);

    // Check if user was found
    if (!response.Items || response.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    // Unmarshall the DynamoDB item
    const user = unmarshall(response.Items[0]);

    // Return only the required fields
    const userResponse: UserResponse = {
      user_id: user.user_id,
      clerk_sub: user.clerk_sub,
      first_name: user.first_name,
      last_name: user.last_name,
      ...(user.username && { username: user.username }),
      ...(user.profile_image && { profile_image: user.profile_image }),
      ...(user.single_player_elo && { single_player_elo: user.single_player_elo }),
      ...(user.multiplayer_elo && { multiplayer_elo: user.multiplayer_elo }),
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User retrieved successfully",
        user: userResponse,
      }),
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to get user",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
