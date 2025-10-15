import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  PutItemCommand,
  QueryCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});

const { MATCHMAKING_TABLE_NAME, GAME_SESSIONS_TABLE_NAME } = process.env;

/**
 * Remove a player from the matchmaking queue using the connection_id GSI
 * Returns true if player was found and removed, false otherwise
 */
export const removeFromQueue = async (
  connection_id: string
): Promise<boolean> => {
  if (!MATCHMAKING_TABLE_NAME) {
    throw new Error("MATCHMAKING_TABLE_NAME environment variable is not set");
  }

  try {
    // Step 1: Query the GSI to find the player's queue entry
    const queryCommand = new QueryCommand({
      TableName: MATCHMAKING_TABLE_NAME,
      IndexName: "connection_id_index",
      KeyConditionExpression: "connection_id = :connection_id",
      ExpressionAttributeValues: marshall({
        ":connection_id": connection_id,
      }),
    });

    const queryResult = await client.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      console.log(`No queue entry found for connection ${connection_id}`);
      return false;
    }

    // Step 2: Delete each entry found (should be only 1, but handle multiple)
    for (const item of queryResult.Items) {
      const unmarshalled = unmarshall(item);
      const game_mode = unmarshalled.game_mode;
      const time_joined = unmarshalled.time_joined;

      const deleteCommand = new DeleteItemCommand({
        TableName: MATCHMAKING_TABLE_NAME,
        Key: marshall({
          game_mode,
          time_joined,
        }),
      });

      await client.send(deleteCommand);
      console.log(
        `Deleted queue entry for ${connection_id} in mode ${game_mode}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error removing from queue:", error);
    throw error;
  }
};

/**
 * Check if a player is in any active game sessions using the sort_key GSI
 * Returns array of game session records where the player is participating
 */
export const checkGameSessions = async (
  connection_id: string
): Promise<any[]> => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  try {
    // Query the GSI where sort_key = connection_id
    // This will return all games where this connection_id is a player
    const queryCommand = new QueryCommand({
      TableName: GAME_SESSIONS_TABLE_NAME,
      IndexName: "sort_key_index",
      KeyConditionExpression: "sort_key = :connection_id",
      ExpressionAttributeValues: marshall({
        ":connection_id": connection_id,
      }),
    });

    const queryResult = await client.send(queryCommand);

    if (!queryResult.Items || queryResult.Items.length === 0) {
      console.log(`No active games found for connection ${connection_id}`);
      return [];
    }

    const gameSessions = queryResult.Items.map((item) => unmarshall(item));

    // For each game session, we need to get the full game data to find the opponent
    const enrichedSessions = await Promise.all(
      gameSessions.map(async (session) => {
        const gameId = session.game_id;

        // Query all records for this game
        const gameQuery = new QueryCommand({
          TableName: GAME_SESSIONS_TABLE_NAME,
          KeyConditionExpression: "game_id = :game_id",
          ExpressionAttributeValues: marshall({
            ":game_id": gameId,
          }),
        });

        const gameResult = await client.send(gameQuery);

        if (!gameResult.Items || gameResult.Items.length === 0) {
          return session;
        }

        const allGameRecords = gameResult.Items.map((item) => unmarshall(item));

        // Find the opponent (not the A record, not the current player)
        const opponentRecord = allGameRecords.find(
          (record) =>
            record.sort_key !== "A" && record.sort_key !== connection_id
        );

        return {
          ...session,
          opponent_connection_id: opponentRecord?.sort_key || null,
          all_game_records: allGameRecords,
        };
      })
    );

    console.log(
      `Found ${enrichedSessions.length} active game(s) for ${connection_id}`
    );
    return enrichedSessions;
  } catch (error) {
    console.error("Error checking game sessions:", error);
    throw error;
  }
};
