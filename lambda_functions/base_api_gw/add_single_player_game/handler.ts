import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { randomUUID } from "crypto";
const {
  adjustSinglePlayerElo,
} = require("/opt/nodejs/adjust_single_player_elo");

const client = new DynamoDBClient({});
const { USER_GAME_HISTORY_TABLE_NAME, USERS_TABLE_NAME } = process.env;

interface RoundInfo {
  word: string;
  score: number;
}

interface GameHistoryBody {
  user_id: string;
  game_mode: string;
  round_info: RoundInfo | RoundInfo[];
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

    // Validate round_info structure (can be single object or array)
    const roundInfoArray = Array.isArray(body.round_info)
      ? body.round_info
      : [body.round_info];

    for (const round of roundInfoArray) {
      if (!round.word || round.score === undefined) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Each round_info must contain word and score",
          }),
        };
      }
    }

    // Validate this is a solo game mode
    if (!body.game_mode.includes("solo")) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "This endpoint only handles solo game modes",
        }),
      };
    }

    // Fetch user's current ELO from users table
    const getUserCommand = new GetItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: marshall({
        user_id: body.user_id,
        sort_key: "A",
      }),
    });

    const userResponse = await client.send(getUserCommand);

    if (!userResponse.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    const userData = unmarshall(userResponse.Item);
    const currentElo = userData.single_player_elo ?? 0;

    const baseGameMode = body.game_mode;

    // Calculate new ELO
    const eloResult = adjustSinglePlayerElo(
      currentElo,
      baseGameMode,
      body.final_score
    );
    const newElo = eloResult.newElo;
    const eloChange = eloResult.eloChange;

    // Generate game_id using crypto
    const game_id = randomUUID();

    // Calculate TTL (30 days from now, in seconds)
    const ttl = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    // Create the item to insert into game history
    const gameHistoryItem = {
      user_id: body.user_id,
      game_id: game_id,
      game_mode: body.game_mode,
      round_info: roundInfoArray,
      final_score: body.final_score,
      elo_before: currentElo,
      elo_after: newElo,
      elo_change: eloChange,
      created_at: new Date().toISOString(),
      ttl: ttl,
    };

    // Insert into game history table
    const putGameHistoryCommand = new PutItemCommand({
      TableName: USER_GAME_HISTORY_TABLE_NAME,
      Item: marshall(gameHistoryItem),
    });

    await client.send(putGameHistoryCommand);

    // Update user's single player ELO in users table
    const updateEloCommand = new UpdateItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: marshall({
        user_id: body.user_id,
        sort_key: "A",
      }),
      UpdateExpression:
        "SET single_player_elo = :newElo, updated_at = :timestamp",
      ExpressionAttributeValues: marshall({
        ":newElo": newElo,
        ":timestamp": new Date().toISOString(),
      }),
    });

    await client.send(updateEloCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Game history recorded successfully",
        game_id: game_id,
        elo_change: eloChange,
        new_elo: newElo,
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
