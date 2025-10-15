import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { sendWsMessage } from "./utils/send_ws_message";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Submit word handler invoked", JSON.stringify(event));

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

    const opponentConnectionId = body.opponent_connection_id;
    const answeredWord = body.answered_word;
    const pointValue = body.point_value;

    // Validate required parameters
    if (!opponentConnectionId || !answeredWord || pointValue === undefined) {
      console.error("Missing required parameters");
      return {
        statusCode: 400,
        body: JSON.stringify({
          message:
            "Missing required parameters: opponent_connection_id, answered_word, and point_value are required",
        }),
      };
    }

    console.log(
      `Player ${connectionId} submitted word: ${answeredWord} (${pointValue} points)`
    );

    // Send message to opponent
    await sendWsMessage(
      opponentConnectionId,
      {
        type: "opponent_submit_word",
        point_value: pointValue,
      },
      domainName,
      stage
    );

    console.log(`Notified opponent ${opponentConnectionId} of word submission`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Word submission sent to opponent",
      }),
    };
  } catch (error) {
    console.error("Submit word error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to submit word",
      }),
    };
  }
};
