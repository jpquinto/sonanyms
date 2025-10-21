import {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Webhook } from "svix";

const client = new DynamoDBClient({});
const { USERS_TABLE_NAME, CLERK_WEBHOOK_SECRET } = process.env;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * Lambda function for handling Clerk user.deleted webhooks
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log("Received Clerk webhook:", JSON.stringify(event, null, 2));

  try {
    // Verify webhook signature
    if (!CLERK_WEBHOOK_SECRET) {
      console.error("CLERK_WEBHOOK_SECRET is not configured");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Webhook secret not configured" }),
      };
    }

    const headers = event.headers;
    const body = event.body || "";

    const svixId = headers["svix-id"] || headers["Svix-Id"];
    const svixTimestamp =
      headers["svix-timestamp"] || headers["Svix-Timestamp"];
    const svixSignature =
      headers["svix-signature"] || headers["Svix-Signature"];

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing Svix headers");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing webhook headers" }),
      };
    }

    // Verify the webhook
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);
    let payload: any;

    try {
      payload = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid signature" }),
      };
    }

    console.log("Webhook verified successfully:", payload);

    // Check if this is a user.deleted event
    if (payload.type !== "user.deleted") {
      console.log(`Ignoring event type: ${payload.type}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Event ignored" }),
      };
    }

    // Extract Clerk sub from webhook payload
    const clerkSub = payload.data.id;

    if (!clerkSub) {
      console.error("No Clerk sub found in payload");
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing user ID" }),
      };
    }

    console.log("Looking up user with Clerk sub:", clerkSub);

    // Scan the table to find the user by clerk_sub
    const scanCommand = new ScanCommand({
      TableName: USERS_TABLE_NAME,
      FilterExpression: "clerk_sub = :clerk_sub",
      ExpressionAttributeValues: marshall({
        ":clerk_sub": clerkSub,
      }),
    });

    const scanResult = await client.send(scanCommand);

    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.error("User not found with Clerk sub:", clerkSub);
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    // Get the first matching user
    const user = unmarshall(scanResult.Items[0]);
    const userId = user.user_id;
    const sortKey = user.sort_key;

    console.log("Found user to delete:", { userId, sortKey });

    // Delete the user from DynamoDB
    const deleteCommand = new DeleteItemCommand({
      TableName: USERS_TABLE_NAME,
      Key: marshall({
        user_id: userId,
        sort_key: sortKey,
      }),
    });

    await client.send(deleteCommand);

    console.log("User deleted successfully:", userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User deleted successfully",
        user_id: userId,
      }),
    };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
