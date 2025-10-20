import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getCurrentId, getQuestionsBatch } from "./utils";

/**
 * Lambda function for the GET /chain-words API Gateway endpoint.
 * This function retrieves random chain words from the word bank.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    "Received GET /chain-words request:",
    JSON.stringify(event, null, 2)
  );

  try {
    // Get the batch_size from query parameters (default to 10)
    const batchSize = parseInt(event.queryStringParameters?.batch_size || "10");

    if (batchSize < 1 || batchSize > 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "batch_size must be between 1 and 50",
        }),
      };
    }

    // Get previously answered word IDs from query parameters
    const excludeIdsParam = event.queryStringParameters?.exclude_ids;
    const excludeIds = new Set<number>();

    if (excludeIdsParam) {
      try {
        // Parse comma-separated IDs or JSON array
        const parsedIds = excludeIdsParam.includes("[")
          ? JSON.parse(excludeIdsParam)
          : excludeIdsParam.split(",");

        parsedIds.forEach((id: string | number) => {
          const numId = typeof id === "string" ? parseInt(id.trim()) : id;
          if (!isNaN(numId)) {
            excludeIds.add(numId);
          }
        });
      } catch (error) {
        console.error("Error parsing exclude_ids:", error);
        return {
          statusCode: 400,
          body: JSON.stringify({
            message:
              "Invalid exclude_ids format. Use comma-separated numbers or JSON array.",
          }),
        };
      }
    }

    // Get the current ID from the word bank
    const currentId = await getCurrentId();

    if (currentId <= 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No chain words available in the database",
        }),
      };
    }

    // Check if there are enough available words
    const availableWords = currentId - excludeIds.size;
    if (availableWords < batchSize) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Not enough chain words available. Requested: ${batchSize}, Available: ${availableWords}`,
        }),
      };
    }

    // Generate multiple random IDs
    const usedIds = new Set<number>(excludeIds);
    const ids: string[] = [];

    let attempts = 0;
    const maxAttempts = batchSize * 10; // Prevent infinite loops

    while (ids.length < batchSize && attempts < maxAttempts) {
      const randomId = Math.floor(Math.random() * currentId) + 1;

      if (!usedIds.has(randomId)) {
        usedIds.add(randomId);
        ids.push(randomId.toString());
      }

      attempts++;
    }

    if (ids.length < batchSize) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Could not generate enough unique word IDs",
        }),
      };
    }

    // Batch fetch all chain words
    const chainWords = await getQuestionsBatch(ids);

    if (chainWords.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No chain words could be fetched",
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        chain_words: chainWords,
        count: chainWords.length,
      }),
    };
  } catch (error) {
    console.error("Error fetching chain words:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
