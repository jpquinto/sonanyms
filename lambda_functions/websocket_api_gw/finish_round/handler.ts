import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  getGame,
  updatePlayerStatus,
  incrementFinishedCount,
  resetRoundState,
  updateGame,
} from "./utils/db";
const { sendWsMessage } = require("/opt/nodejs/send_ws_message");

interface Submission {
  word: string;
  point_value: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Finish round handler invoked", JSON.stringify(event));

    // Extract connection context
    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    if (!connectionId || !domainName || !stage) {
      console.error("Missing connection context");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing connection context" }),
      };
    }

    // Parse the message body
    const body = JSON.parse(event.body || "{}");
    console.log("Parsed body:", body);

    const gameId = body.game_id;
    const submissions: Submission[] = body.submissions;

    // Validate required parameters
    if (!gameId || !submissions) {
      console.error("Missing required parameters");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required parameters: game_id and submissions are required",
        }),
      };
    }

    // Get the entire game partition
    const gameRecords = await getGame(gameId);

    if (!gameRecords || gameRecords.length === 0) {
      console.error("Game not found");
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "Game not found" }),
      };
    }

    // Find the A record to get current round
    const aRecord = gameRecords.find((record) => record.sort_key === "A");
    if (!aRecord) {
      console.error("Game metadata record not found");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Game metadata not found" }),
      };
    }

    const currentRound = aRecord.current_round;

    // Find current player and opponent records
    const currentPlayerRecord = gameRecords.find(
      (record) => record.sort_key === connectionId
    );
    const opponentRecord = gameRecords.find(
      (record) => record.sort_key !== connectionId && record.sort_key !== "A"
    );

    if (!currentPlayerRecord || !opponentRecord) {
      console.error("Player records not found");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Player records not found" }),
      };
    }

    const opponentConnectionId = opponentRecord.sort_key;

    // Step 1: Atomically update current player's status
    const playerUpdateResult = await updatePlayerStatus(
      gameId,
      connectionId,
      submissions,
      currentRound
    );

    if (!playerUpdateResult) {
      // Player already finished this round (shouldn't happen, but handle gracefully)
      console.log(
        `Player ${connectionId} already finished round ${currentRound}`
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Already finished this round" }),
      };
    }

    console.log(
      `Player ${connectionId} successfully marked as finished for round ${currentRound}`
    );

    // Step 2: Atomically increment finished_players_count
    // Only ONE of the two simultaneous requests will successfully increment from 1 to 2
    const incrementResult = await incrementFinishedCount(gameId, currentRound);

    if (!incrementResult.isLastPlayer) {
      // We're the first player to finish - just wait
      await sendWsMessage(
        connectionId,
        {
          type: "waiting_for_opponent",
        },
        domainName,
        stage
      );

      console.log(
        `Player ${connectionId} finished round ${currentRound}, waiting for opponent`
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Round finished, waiting for opponent",
          status: "waiting",
        }),
      };
    }

    // Step 3: We ARE the last player - handle game progression
    console.log(
      `Both players finished round ${currentRound}, progressing game`
    );

    const nextRound = currentRound + 1;

    // Check if game is over (5 rounds total, so after round 5)
    if (nextRound > 5) {
      console.log("Game over - all 5 rounds completed");

      // Calculate final scores from all rounds
      const updatedRecords = await updateGame(
        gameId,
        connectionId,
        opponentConnectionId,
        submissions,
        currentRound,
        true // isGameOver flag
      );

      // Get both player records for final scores
      const player1Record = updatedRecords.find(
        (record) => record.sort_key === connectionId
      );
      const player2Record = updatedRecords.find(
        (record) => record.sort_key === opponentConnectionId
      );

      // Send game_over message to both players
      await Promise.all([
        sendWsMessage(
          connectionId,
          {
            type: "game_over",
            your_record: player1Record,
            opponent_record: player2Record,
          },
          domainName,
          stage
        ),
        sendWsMessage(
          opponentConnectionId,
          {
            type: "game_over",
            your_record: player2Record,
            opponent_record: player1Record,
          },
          domainName,
          stage
        ),
      ]);

      // TODO: Update win/loss record of both players

      console.log("Notified both players of game over");

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Game complete",
          status: "game_over",
        }),
      };
    }

    // More rounds to play - reset state and get next word
    await resetRoundState(
      gameId,
      connectionId,
      opponentConnectionId,
      nextRound
    );

    // Get next word from A record
    const nextWord = aRecord.words?.[nextRound - 1]; // Array is 0-indexed, rounds are 1-indexed

    if (!nextWord) {
      console.error("Next word not found");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Next word not found" }),
      };
    }

    // Set start timestamp 5 seconds in the future
    const startTimestamp = Date.now() + 5000;

    // Send next_round message to both players
    await Promise.all([
      sendWsMessage(
        connectionId,
        {
          type: "next_round",
          round_number: nextRound,
          word: nextWord,
          start_timestamp: startTimestamp,
        },
        domainName,
        stage
      ),
      sendWsMessage(
        opponentConnectionId,
        {
          type: "next_round",
          round_number: nextRound,
          word: nextWord,
          start_timestamp: startTimestamp,
        },
        domainName,
        stage
      ),
    ]);

    console.log(`Notified both players of next round ${nextRound}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Moving to next round",
        next_round: nextRound,
      }),
    };
  } catch (error) {
    console.error("Finish round error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to finish round",
      }),
    };
  }
};
