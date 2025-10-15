import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";

export const sendWsMessage = async (
  connection_id: string,
  message: any,
  domainName: string,
  stage: string
): Promise<void> => {
  // Construct the endpoint from API Gateway context
  const endpoint = `https://${domainName}/${stage}`;

  const client = new ApiGatewayManagementApiClient({
    endpoint: endpoint,
  });

  try {
    const command = new PostToConnectionCommand({
      ConnectionId: connection_id,
      Data: JSON.stringify(message),
    });

    await client.send(command);

    console.log(`Message sent to connection ${connection_id}`);
  } catch (error: any) {
    // Handle case where connection is stale/closed
    if (error.statusCode === 410) {
      console.log(`Connection ${connection_id} is gone (stale connection)`);
    } else {
      console.error(`Error sending message to ${connection_id}:`, error);
      throw error;
    }
  }
};
