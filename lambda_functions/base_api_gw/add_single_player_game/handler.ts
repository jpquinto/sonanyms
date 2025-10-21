import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const { USER_GAME_HISTORY_TABLE_NAME } = process.env;

interface RoundInfo {
  word: string;
  score: number;
}

interface GameHistoryBody {
  user_id: string;
  game_mode: string;
  round_info: RoundInfo;
  final_score: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse and validate request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Request body is required",
        }),
      };
    }

    const body: GameHistoryBody = JSON.parse(event.body);

    // Validate required fields
    if (
      !body.user_id ||
      !body.game_mode ||
      !body.round_info ||
      body.final_score === undefined
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required fields: user_id, game_mode, round_info, final_score",
        }),
      };
    }

    // Validate round_info structure
    if (!body.round_info.word || body.round_info.score === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "round_info must contain word and score",
        }),
      };
    }

    // Generate game_id using crypto
    const game_id = randomUUID();

    // Create the item to insert
    const item = {
      user_id: body.user_id,
      game_id: game_id,
      game_mode: body.game_mode,
      round_info: body.round_info,
      final_score: body.final_score,
      created_at: new Date().toISOString(),
    };

    // Insert into DynamoDB
    const command = new PutItemCommand({
      TableName: USER_GAME_HISTORY_TABLE_NAME,
      Item: marshall(item),
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Game history recorded successfully",
        game_id: game_id,
      }),
    };
  } catch (error) {
    console.error("Error recording game history:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to record game history",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
