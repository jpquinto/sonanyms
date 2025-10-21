import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    

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
        message: "Failed to connect",
      }),
    };
  }
};
