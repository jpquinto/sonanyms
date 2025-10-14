import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

// Initialize the DynamoDB DocumentClient
const dynamodbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Make sure to configure this environment variable in your Lambda settings.
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_RESULTS_TABLE_NAME;

/**
 * Boilerplate Lambda function for the POST /round-results API Gateway endpoint.
 * This function is intended to write round results to a DynamoDB table.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    "Received POST /round-results request:",
    JSON.stringify(event, null, 2)
  );

  if (!DYNAMODB_TABLE_NAME) {
    console.error(
      "DYNAMODB_RESULTS_TABLE_NAME environment variable is not set."
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Server configuration error." }),
    };
  }

  try {
    // Parse the request body
    const requestBody = event.body ? JSON.parse(event.body) : {};
    console.log("Request body:", requestBody);

    // Here is a simple example of writing to DynamoDB.
    // You would typically validate the requestBody first.
    const command = new PutCommand({
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        id: requestBody.roundId,
        results: requestBody.results,
        timestamp: new Date().toISOString(),
      },
    });

    await docClient.send(command);
    console.log("Successfully wrote data to DynamoDB.");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Hello from POST /round-results!",
        receivedData: requestBody,
      }),
    };
  } catch (error) {
    console.error("Error handling POST /round-results request:", error);
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
