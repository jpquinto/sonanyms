import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { addToQueue, addToSessionsTable, checkQueue, getCurrentId, getQuestionsBatch, removeFromQueue } from "./utils/db";
const { sendWsMessage } = require("/opt/nodejs/send_ws_message");

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Step 1. Extract the connectionId from the event
    const connectionId = event.requestContext.connectionId;
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;

    if (!connectionId || !domainName || !stage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No connection ID found" }),
      };
    }

    // Step 2. Parse the message body (NOT query parameters!)
    const body = JSON.parse(event.body || "{}");
    console.log("Parsed body:", body);

    const userId = body.user_id;
    const username = body.username;
    const profileImageUrl = body.profile_image_url;
    const gameMode = body.game_mode;

    // Step 3. Validate required parameters
    if (!username || !gameMode) {
      console.error("Missing required parameters");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required parameters: username and game_mode are required",
        }),
      };
    }

    // Step 4. Check if there's a player waiting in the queue
    const waitingPlayer = await checkQueue(gameMode);

    if (!waitingPlayer) {
      // No one in queue, add this player to the queue
      await addToQueue(
        gameMode,
        connectionId,
        username,
        userId,
        profileImageUrl
      );

      console.log(
        `Player ${username} added to queue for game mode: ${gameMode}`
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Added to matchmaking queue",
          status: "waiting",
        }),
      };
    }

    // Step 5. Match found - remove waiting player from queue
    console.log(
      `Match found! ${username} matched with ${waitingPlayer.username}`
    );

    await removeFromQueue(waitingPlayer.game_mode, waitingPlayer.time_joined),

    console.log(`Both players notified of match`);

    // Get random words for the game
    const maxWordId = await getCurrentId();
    const randomWordIds: string[] = [];

    // Pick 5 random unique word IDs
    while (randomWordIds.length < 5) {
      const randomId = Math.floor(Math.random() * maxWordId) + 1;
      if (!randomWordIds.includes(randomId.toString())) {
        randomWordIds.push(randomId.toString());
      }
    }

    const words = await getQuestionsBatch(randomWordIds);

    // Create game session in database
    const gameId = await addToSessionsTable(
      connectionId,
      userId,
      username,
      waitingPlayer.connection_id,
      waitingPlayer.user_id,
      waitingPlayer.username,
      words
    );

    console.log(`Game session ${gameId} created with ${words.length} words`);

    // Set start timestamp 3 seconds in the future to give clients time to prepare
    const startTimestamp = Date.now() + 5000;

    // Send game_start message to both players
    await Promise.all([
      sendWsMessage(
        waitingPlayer.connection_id,
        {
          type: "game_start",
          game_id: gameId,
          start_timestamp: startTimestamp,
          word: words[0],
          opponent: {
            connection_id: connectionId,
            username: username,
            user_id: userId,
            user_profile_image_url: profileImageUrl,
          }
        },
        domainName,
        stage
      ),
      sendWsMessage(
        connectionId,
        {
          type: "game_start",
          game_id: gameId,
          start_timestamp: startTimestamp,
          word: words[0],
          opponent: {
            connection_id: waitingPlayer.connection_id,
            username: waitingPlayer.username,
            user_id: waitingPlayer.user_id,
            user_profile_image_url: waitingPlayer.user_profile_image_url,
          }
        },
        domainName,
        stage
      ),
    ]);

    console.log(`Game ${gameId} starting at ${startTimestamp}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Connection successful",
      }),
    };
  } catch (error) {
    console.error("Connection error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to join queue",
      }),
    };
  }
};
