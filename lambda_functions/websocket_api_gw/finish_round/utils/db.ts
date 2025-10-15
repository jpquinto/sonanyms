import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});

const { GAME_SESSIONS_TABLE_NAME } = process.env;

interface Submission {
  word: string;
  point_value: number;
}

export const getGame = async (game_id: string) => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  try {
    const command = new QueryCommand({
      TableName: GAME_SESSIONS_TABLE_NAME,
      KeyConditionExpression: "game_id = :game_id",
      ExpressionAttributeValues: marshall({
        ":game_id": game_id,
      }),
    });

    const response = await client.send(command);

    if (!response.Items || response.Items.length === 0) {
      return null;
    }

    // Return all items unmarshalled
    return response.Items.map((item) => unmarshall(item));
  } catch (error) {
    console.error("Error getting game:", error);
    throw error;
  }
};

export const updatePlayerStatus = async (
  game_id: string,
  connection_id: string,
  submissions: Submission[],
  round_number: number
) => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  try {
    const command = new UpdateItemCommand({
      TableName: GAME_SESSIONS_TABLE_NAME,
      Key: marshall({
        game_id,
        sort_key: connection_id,
      }),
      UpdateExpression: `SET round_status = :finished, round_${round_number}_submissions = :submissions`,
      ExpressionAttributeValues: marshall({
        ":finished": "finished",
        ":submissions": submissions,
      }),
    });

    await client.send(command);
    console.log(`Updated player ${connection_id} status to finished`);
  } catch (error) {
    console.error("Error updating player status:", error);
    throw error;
  }
};

export const updateGame = async (
  game_id: string,
  connection_id: string,
  opponent_connection_id: string,
  submissions: Submission[],
  round_number: number
) => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  try {
    const results = await Promise.all([
      // Update current player - set submissions without changing round_status
      client.send(
        new UpdateItemCommand({
          TableName: GAME_SESSIONS_TABLE_NAME,
          Key: marshall({
            game_id,
            sort_key: connection_id,
          }),
          UpdateExpression: `SET round_${round_number}_submissions = :submissions`,
          ExpressionAttributeValues: marshall({
            ":submissions": submissions,
          }),
          ReturnValues: "ALL_NEW",
        })
      ),
      // Update opponent - set round_status to in_progress
      client.send(
        new UpdateItemCommand({
          TableName: GAME_SESSIONS_TABLE_NAME,
          Key: marshall({
            game_id,
            sort_key: opponent_connection_id,
          }),
          UpdateExpression: "SET round_status = :in_progress",
          ExpressionAttributeValues: marshall({
            ":in_progress": "in_progress",
          }),
          ReturnValues: "ALL_NEW",
        })
      ),
      // Update A record - increment current_round
      client.send(
        new UpdateItemCommand({
          TableName: GAME_SESSIONS_TABLE_NAME,
          Key: marshall({
            game_id,
            sort_key: "A",
          }),
          UpdateExpression: "SET current_round = :next_round",
          ExpressionAttributeValues: marshall({
            ":next_round": round_number + 1,
          }),
          ReturnValues: "ALL_NEW",
        })
      ),
    ]);

    console.log(`Updated game ${game_id} for round ${round_number} completion`);

    // Return the updated items
    return results.map((result) => unmarshall(result.Attributes!));
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};