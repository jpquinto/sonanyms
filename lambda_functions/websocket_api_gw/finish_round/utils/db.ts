import {
  DynamoDBClient,
  QueryCommand,
  UpdateItemCommand,
  ConditionalCheckFailedException,
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

/**
 * Atomically update player status to finished
 * Uses conditional expression to ensure player hasn't already finished
 * Returns null if player already finished (race condition handled)
 */
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
      UpdateExpression: `SET round_status = :finished, round_${round_number}_submissions = :submissions, last_updated = :timestamp`,
      ConditionExpression:
        "round_status <> :finished OR attribute_not_exists(round_status)",
      ExpressionAttributeValues: marshall({
        ":finished": "finished",
        ":submissions": submissions,
        ":timestamp": Date.now(),
      }),
      ReturnValues: "ALL_NEW",
    });

    const result = await client.send(command);
    console.log(`Updated player ${connection_id} status to finished`);
    return unmarshall(result.Attributes!);
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      // Player already finished - this is expected in race conditions
      console.log(
        `Player ${connection_id} already finished round ${round_number}`
      );
      return null;
    }
    console.error("Error updating player status:", error);
    throw error;
  }
};

/**
 * Atomically increment the finished_players_count
 * Uses conditional expression to ensure count doesn't exceed 2
 * Returns whether this player is the last one to finish (count reached 2)
 */
export const incrementFinishedCount = async (
  game_id: string,
  round_number: number
): Promise<{ isLastPlayer: boolean; count: number }> => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  try {
    const command = new UpdateItemCommand({
      TableName: GAME_SESSIONS_TABLE_NAME,
      Key: marshall({
        game_id,
        sort_key: "A",
      }),
      UpdateExpression:
        "ADD finished_players_count :inc SET last_updated = :timestamp",
      ConditionExpression:
        "finished_players_count < :max OR attribute_not_exists(finished_players_count)",
      ExpressionAttributeValues: marshall({
        ":inc": 1,
        ":max": 2,
        ":timestamp": Date.now(),
      }),
      ReturnValues: "ALL_NEW",
    });

    const result = await client.send(command);
    const attributes = unmarshall(result.Attributes!);
    const count = attributes.finished_players_count || 0;

    console.log(
      `Finished players count is now ${count} for round ${round_number}`
    );

    return {
      isLastPlayer: count === 2,
      count,
    };
  } catch (error) {
    if (error instanceof ConditionalCheckFailedException) {
      // Count already at 2 or higher - we must be late
      // This shouldn't happen with proper logic, but handle defensively
      console.log("Finished count already at max");
      return {
        isLastPlayer: false,
        count: 2,
      };
    }
    console.error("Error incrementing finished count:", error);
    throw error;
  }
};

/**
 * Reset round state for both players and increment current_round
 * Called by the last player to finish
 */
export const resetRoundState = async (
  game_id: string,
  player1_connection_id: string,
  player2_connection_id: string,
  next_round: number
) => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  try {
    await Promise.all([
      // Reset player 1 round_status
      client.send(
        new UpdateItemCommand({
          TableName: GAME_SESSIONS_TABLE_NAME,
          Key: marshall({
            game_id,
            sort_key: player1_connection_id,
          }),
          UpdateExpression: "SET round_status = :in_progress",
          ExpressionAttributeValues: marshall({
            ":in_progress": "in_progress",
          }),
        })
      ),
      // Reset player 2 round_status
      client.send(
        new UpdateItemCommand({
          TableName: GAME_SESSIONS_TABLE_NAME,
          Key: marshall({
            game_id,
            sort_key: player2_connection_id,
          }),
          UpdateExpression: "SET round_status = :in_progress",
          ExpressionAttributeValues: marshall({
            ":in_progress": "in_progress",
          }),
        })
      ),
      // Update A record - increment current_round and reset finished_players_count
      client.send(
        new UpdateItemCommand({
          TableName: GAME_SESSIONS_TABLE_NAME,
          Key: marshall({
            game_id,
            sort_key: "A",
          }),
          UpdateExpression:
            "SET current_round = :next_round, finished_players_count = :zero",
          ExpressionAttributeValues: marshall({
            ":next_round": next_round,
            ":zero": 0,
          }),
        })
      ),
    ]);

    console.log(`Reset round state for next round ${next_round}`);
  } catch (error) {
    console.error("Error resetting round state:", error);
    throw error;
  }
};

/**
 * Update game with final submissions and optionally calculate total scores
 */
export const updateGame = async (
  game_id: string,
  connection_id: string,
  opponent_connection_id: string,
  submissions: Submission[],
  round_number: number,
  isGameOver: boolean = false
) => {
  if (!GAME_SESSIONS_TABLE_NAME) {
    throw new Error("GAME_SESSIONS_TABLE_NAME environment variable is not set");
  }

  try {
    // If game is over, we need to calculate total scores
    if (isGameOver) {
      // Get both player records to calculate totals
      const gameRecords = await getGame(game_id);
      const player1Record = gameRecords?.find(
        (r) => r.sort_key === connection_id
      );
      const player2Record = gameRecords?.find(
        (r) => r.sort_key === opponent_connection_id
      );

      if (!player1Record || !player2Record) {
        throw new Error("Player records not found for final score calculation");
      }

      // Calculate total scores from all rounds
      const calculateTotalScore = (playerRecord: any) => {
        let total = 0;
        for (let i = 1; i <= 5; i++) {
          const roundSubmissions = playerRecord[`round_${i}_submissions`] || [];
          const roundScore = roundSubmissions.reduce(
            (sum: number, sub: Submission) => sum + sub.point_value,
            0
          );
          total += roundScore;
        }
        return total;
      };

      const player1TotalScore = calculateTotalScore(player1Record);
      const player2TotalScore = calculateTotalScore(player2Record);

      // Update both players with total scores
      const results = await Promise.all([
        client.send(
          new UpdateItemCommand({
            TableName: GAME_SESSIONS_TABLE_NAME,
            Key: marshall({
              game_id,
              sort_key: connection_id,
            }),
            UpdateExpression: `SET total_score = :total_score, game_status = :game_over`,
            ExpressionAttributeValues: marshall({
              ":total_score": player1TotalScore,
              ":game_over": "completed",
            }),
            ReturnValues: "ALL_NEW",
          })
        ),
        client.send(
          new UpdateItemCommand({
            TableName: GAME_SESSIONS_TABLE_NAME,
            Key: marshall({
              game_id,
              sort_key: opponent_connection_id,
            }),
            UpdateExpression: `SET total_score = :total_score, game_status = :game_over`,
            ExpressionAttributeValues: marshall({
              ":total_score": player2TotalScore,
              ":game_over": "completed",
            }),
            ReturnValues: "ALL_NEW",
          })
        ),
        // Update A record
        client.send(
          new UpdateItemCommand({
            TableName: GAME_SESSIONS_TABLE_NAME,
            Key: marshall({
              game_id,
              sort_key: "A",
            }),
            UpdateExpression: "SET game_status = :game_over",
            ExpressionAttributeValues: marshall({
              ":game_over": "completed",
            }),
            ReturnValues: "ALL_NEW",
          })
        ),
      ]);

      console.log(`Game ${game_id} completed with final scores`);
      return results.map((result) => unmarshall(result.Attributes!));
    } else {
      // Mid-game update (shouldn't be used with new logic, but kept for compatibility)
      const results = await Promise.all([
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
      ]);

      return results.map((result) => unmarshall(result.Attributes!));
    }
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};
