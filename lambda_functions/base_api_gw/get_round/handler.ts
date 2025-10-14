import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * Boilerplate Lambda function for the GET /round API Gateway endpoint.
 * This function is intended to retrieve and return round details.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received GET /round request:", JSON.stringify(event, null, 2));

  try {
    // Here you would add the logic to fetch round details, for example, from a database.
    const roundDetails = {
      roundId: "12345",
      status: "active",
      players: ["playerA", "playerB"],
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello from GET /round!",
        details: roundDetails,
      }),
    };
  } catch (error) {
    console.error("Error handling GET /round request:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "An internal server error occurred.",
      }),
    };
  }
};
