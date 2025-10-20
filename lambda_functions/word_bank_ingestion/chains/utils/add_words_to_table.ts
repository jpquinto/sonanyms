import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});
const { WORD_BANK_TABLE_NAME } = process.env;

interface ChainLink {
  word: string;
  score: number;
}

interface ChainWordItem {
  first_chain: string;
  links: ChainLink[];
}

interface AddChainWordsParams {
  words: ChainWordItem[];
  currentId: number;
}

export const addWordsToTable = async ({
  words,
  currentId,
}: AddChainWordsParams): Promise<number> => {
  let nextId = currentId;

  // DynamoDB BatchWriteItem supports up to 25 items per request
  const BATCH_SIZE = 25;

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);

    const writeRequests = batch.map((wordItem) => {
      const item = {
        bank_id: "first_chain", // String partition key
        word_id: nextId, // Number sort key
        first_chain: wordItem.first_chain,
        links: wordItem.links,
      };
      nextId++;

      return {
        PutRequest: {
          Item: marshall(item),
        },
      };
    });

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [WORD_BANK_TABLE_NAME!]: writeRequests,
      },
    });

    await client.send(command);
    console.log(
      `Batch written: ${batch.length} chain words (IDs ${
        nextId - batch.length
      } to ${nextId - 1})`
    );
  }

  // Return the next ID that will be used
  return nextId;
};
