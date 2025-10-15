// lambda_functions/src/websocket_api_gw/connect/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const connectionId = event.requestContext.connectionId;

  console.log(`WebSocket connected: ${connectionId}`);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Connected" }),
  };
};
