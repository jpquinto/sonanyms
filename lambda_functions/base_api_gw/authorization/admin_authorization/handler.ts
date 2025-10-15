import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

/**
 * Lambda authorizer for admin endpoints.
 * Validates the API key in the Authorization header.
 */
export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  console.log("Admin authorizer invoked:", JSON.stringify(event, null, 2));

  const token = event.authorizationToken;
  const methodArn = event.methodArn;

  // Get the expected API key from environment variable
  const expectedApiKey = process.env.ADMIN_API_KEY;

  if (!expectedApiKey) {
    console.error("ADMIN_API_KEY environment variable not set");
    throw new Error("Unauthorized");
  }

  try {
    // Check if the token matches the expected API key
    // Token format: "Bearer <API_KEY>" or just "<API_KEY>"
    const apiKey = token.startsWith("Bearer ") ? token.substring(7) : token;

    if (apiKey === expectedApiKey) {
      console.log("Admin authorization successful");
      return generatePolicy("admin", "Allow", methodArn);
    } else {
      console.log("Admin authorization failed: Invalid API key");
      throw new Error("Unauthorized");
    }
  } catch (error) {
    console.error("Admin authorization error:", error);
    throw new Error("Unauthorized");
  }
};

/**
 * Helper function to generate IAM policy
 */
function generatePolicy(
  principalId: string,
  effect: "Allow" | "Deny",
  resource: string
): APIGatewayAuthorizerResult {
  const authResponse: APIGatewayAuthorizerResult = {
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
    context: {
      userType: "admin",
    },
  };

  return authResponse;
}
