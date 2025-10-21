import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { Webhook } from "svix";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const { USERS_TABLE_NAME, CLERK_WEBHOOK_SECRET } = process.env;

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

/**
 * Lambda function for handling Clerk user.created webhooks
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

    // Check if this is a user.created event
    if (payload.type !== "user.created") {
      console.log(`Ignoring event type: ${payload.type}`);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Event ignored" }),
      };
    }

    // Extract user data from Clerk webhook payload
    const userData = payload.data;

    const userId = randomUUID();
    const clerkSub = userData.id;
    const firstName = userData.first_name || "";
    const lastName = userData.last_name || "";
    const profileImage = userData.image_url || userData.profile_image_url || "";

    // Create the DynamoDB item
    const item = {
      user_id: userId,
      sort_key: "A",
      clerk_sub: clerkSub,
      first_name: firstName,
      last_name: lastName,
      profile_image: profileImage,
      created_at: new Date().toISOString(),
    };

    console.log("Creating user item:", item);

    // Put item into DynamoDB
    const command = new PutItemCommand({
      TableName: USERS_TABLE_NAME,
      Item: marshall(item),
    });

    await client.send(command);

    console.log("User added successfully:", userId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User created successfully",
        user_id: userId,
      }),
    };
  } catch (error) {
    console.error("Error adding user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
