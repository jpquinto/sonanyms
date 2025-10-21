import { Webhook } from "svix";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function handler(event: any) {
  console.log("Webhook authorizer event:", JSON.stringify(event, null, 2));

  try {
    if (!WEBHOOK_SECRET) {
      console.error("CLERK_WEBHOOK_SECRET is not configured");
      return generatePolicy("webhook", "Deny", event.methodArn);
    }

    // Extract Svix headers
    const headers = event.headers || {};
    const svixId = headers["svix-id"] || headers["Svix-Id"];
    const svixTimestamp =
      headers["svix-timestamp"] || headers["Svix-Timestamp"];
    const svixSignature =
      headers["svix-signature"] || headers["Svix-Signature"];

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error("Missing Svix headers");
      return generatePolicy("webhook", "Deny", event.methodArn);
    }

    // Get the raw body
    const body = event.body || "";

    // Verify the webhook signature
    const wh = new Webhook(WEBHOOK_SECRET);

    try {
      wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });

      console.log("Webhook signature verified successfully");

      return generatePolicy("clerk-webhook", "Allow", event.methodArn);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return generatePolicy("webhook", "Deny", event.methodArn);
    }
  } catch (error) {
    console.error("Authorization error:", error);
    return generatePolicy("webhook", "Deny", event.methodArn);
  }
}

function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string
) {
  return {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}
