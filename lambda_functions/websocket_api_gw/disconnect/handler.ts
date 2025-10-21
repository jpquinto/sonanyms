import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { removeFromQueue, checkGameSessions } from "./utils/db";
const { sendWsMessage } = require("/opt/nodejs/send_ws_message");

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Disconnect handler invoked", JSON.stringify(event));

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

    // Step 1: Remove from matchmaking queue if present
    console.log(`Removing ${connectionId} from matchmaking queue...`);
    const removedFromQueue = await removeFromQueue(connectionId);

    if (removedFromQueue) {
      console.log(`Successfully removed ${connectionId} from queue`);
    } else {
      console.log(`${connectionId} was not in queue`);
    }

    // Step 2: Check if player is in an active game
    console.log(`Checking if ${connectionId} is in an active game...`);
    const gameSessions = await checkGameSessions(connectionId);

    if (gameSessions && gameSessions.length > 0) {
      console.log(
        `Found ${gameSessions.length} active game(s) for ${connectionId}`
      );

      // Handle each active game (should typically be just 1)
      for (const gameSession of gameSessions) {
        const gameId = gameSession.game_id;

        console.log(`Processing disconnect for game ${gameId}`);

        // Find opponent in this game
        // gameSession is the player's record, we need to find their opponent
        // The opponent will have the same game_id but different sort_key
        const opponentConnectionId = gameSession.opponent_connection_id;

        if (!opponentConnectionId) {
          console.warn(`No opponent found for game ${gameId}`);
          continue;
        }

        console.log(`Notifying opponent ${opponentConnectionId} of forfeit`);

        // Notify opponent that this player forfeited
        try {
          await sendWsMessage(
            opponentConnectionId,
            {
              type: "opponent_forfeit",
              message: "Your opponent has disconnected",
            },
            domainName,
            stage
          );
          console.log(`Successfully notified opponent ${opponentConnectionId}`);
        } catch (error) {
          console.error(
            `Failed to notify opponent ${opponentConnectionId}:`,
            error
          );
          // Continue processing - opponent might also be disconnected
        }

        // TODO: Update game session to mark as forfeited
        // TODO: Update player records (winner/loser)
      }
    } else {
      console.log(`${connectionId} was not in any active games`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Disconnection handled successfully",
      }),
    };
  } catch (error) {
    console.error("Disconnect handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to handle disconnection",
      }),
    };
  }
};
