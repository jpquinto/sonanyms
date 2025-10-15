import { BatchGetItemCommand, BatchWriteItemCommand, DeleteItemCommand, DynamoDBClient, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { MatchmakingTableEntry } from "../types";

const client = new DynamoDBClient({});

const {
  MATCHMAKING_TABLE_NAME,
  GAME_SESSIONS_TABLE_NAME,
  WORD_BANK_TABLE_NAME,
  ID_STATUS_TABLE_NAME,
} = process.env;

export const checkQueue = async (game_mode: string): Promise<MatchmakingTableEntry | null> => {
  if (!MATCHMAKING_TABLE_NAME) {
    throw new Error("MATCHMAKING_TABLE_NAME environment variable is not set");
  }

  try {
    const command = new QueryCommand({
      TableName: MATCHMAKING_TABLE_NAME,
      KeyConditionExpression: "game_mode = :game_mode",
      ExpressionAttributeValues: marshall({
        ":game_mode": game_mode,
      }),
      Limit: 1, // Only get the oldest player
      ScanIndexForward: true, // Sort ascending (oldest first)
    });

    const response = await client.send(command);

    // If no items found, return null
    if (!response.Items || response.Items.length === 0) {
      return null;
    }

    // Return the unmarshalled item
    return unmarshall(response.Items[0]) as MatchmakingTableEntry;
  } catch (error) {
    console.error("Error checking queue:", error);
    throw error;
  }
};

export const addToQueue = async (
  game_mode: string,
  connection_id: string,
  username: string,
  user_id?: string,
  user_profile_image_url?: string
): Promise<MatchmakingTableEntry> => {
  if (!MATCHMAKING_TABLE_NAME) {
    throw new Error("MATCHMAKING_TABLE_NAME environment variable is not set");
  }

  const now = new Date();
  const time_joined = now.toISOString();

  // TTL is 10 minutes in the future (in seconds since epoch)
  const ttl = Math.floor(now.getTime() / 1000) + 10 * 60;

  const entry: MatchmakingTableEntry & { ttl: number } = {
    game_mode,
    connection_id,
    username,
    user_id,
    user_profile_image_url,
    time_joined,
    ttl,
  };

  try {
    const command = new PutItemCommand({
      TableName: MATCHMAKING_TABLE_NAME,
      Item: marshall(entry, { removeUndefinedValues: true }),
    });

    await client.send(command);

    return entry;
  } catch (error) {
    console.error("Error adding to queue:", error);
    throw error;
  }
};

export const removeFromQueue = async (
  game_mode: string,
  time_joined: string
): Promise<void> => {
  if (!MATCHMAKING_TABLE_NAME) {
    throw new Error("MATCHMAKING_TABLE_NAME environment variable is not set");
  }

  try {
    const command = new DeleteItemCommand({
      TableName: MATCHMAKING_TABLE_NAME,
      Key: marshall({
        game_mode,
        time_joined,
      }),
    });

    await client.send(command);

    console.log(
      `Removed player from queue for game mode: ${game_mode} at ${time_joined}`
    );
  } catch (error) {
    console.error("Error removing from queue:", error);
    throw error;
  }
};

export const getCurrentId = async (): Promise<number> => {
  const queryCommand = new QueryCommand({
    TableName: ID_STATUS_TABLE_NAME,
    KeyConditionExpression: "metric_name = :metricName",
    ExpressionAttributeValues: marshall({
      ":metricName": "word_bank_current_id",
    }),
  });

  const response = await client.send(queryCommand);

  if (response.Items && response.Items.length > 0) {
    const item = unmarshall(response.Items[0]);
    return item.current_id;
  } else {
    throw new Error(`No current_id found`);
  }
};

export const getQuestionsBatch = async (ids: string[]): Promise<any[]> => {
  const BATCH_SIZE = 100; // BatchGetItem supports up to 100 items per request
  const allQuestions: any[] = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batchIds = ids.slice(i, i + BATCH_SIZE);

    const keys = batchIds.map((id) =>
      marshall({
        word_id: parseInt(id), // Convert string ID to number
      })
    );

    const command = new BatchGetItemCommand({
      RequestItems: {
        [WORD_BANK_TABLE_NAME!]: {
          Keys: keys,
        },
      },
    });

    const response = await client.send(command);

    if (response.Responses && response.Responses[WORD_BANK_TABLE_NAME!]) {
      const items = response.Responses[WORD_BANK_TABLE_NAME!].map((item) =>
        unmarshall(item)
      );
      allQuestions.push(...items);
    }
  }

  return allQuestions;
};


export const addToSessionsTable = async (
  player1_connection_id: string,
  player1_user_id: string | undefined,
  player1_username: string,
  player2_connection_id: string,
  player2_user_id: string | undefined,
  player2_username: string,
  words: any[]
): Promise<string> => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  const gameId = randomUUID();
  const now = new Date();
  // TTL is 30 minutes in the future (in seconds since epoch)
  const ttl = Math.floor(now.getTime() / 1000) + 30 * 60;

  try {
    const command = new BatchWriteItemCommand({
      RequestItems: {
        [GAME_SESSIONS_TABLE_NAME]: [
          // Record A - game metadata
          {
            PutRequest: {
              Item: marshall(
                {
                  game_id: gameId,
                  sort_key: "A",
                  current_round: 1,
                  words: words,
                  ttl: ttl,
                },
                { removeUndefinedValues: true }
              ),
            },
          },
          // Player 1 record
          {
            PutRequest: {
              Item: marshall(
                {
                  game_id: gameId,
                  sort_key: player1_connection_id,
                  user_id: player1_user_id,
                  username: player1_username,
                  ttl: ttl,
                },
                { removeUndefinedValues: true }
              ),
            },
          },
          // Player 2 record
          {
            PutRequest: {
              Item: marshall(
                {
                  game_id: gameId,
                  sort_key: player2_connection_id,
                  user_id: player2_user_id,
                  username: player2_username,
                  ttl: ttl,
                },
                { removeUndefinedValues: true }
              ),
            },
          },
        ],
      },
    });

    await client.send(command);

    console.log(`Created game session ${gameId} with 3 records`);

    return gameId;
  } catch (error) {
    console.error("Error adding to sessions table:", error);
    throw error;
  }
};