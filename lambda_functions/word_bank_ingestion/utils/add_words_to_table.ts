import {
  DynamoDBClient,
  BatchWriteItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});
const { WORD_BANK_TABLE_NAME } = process.env;

interface WordItem {
  id: number;
  word: string;
  strongest: string[];
  strong: string[];
  weak: string[];
  all_synonyms: string[];
  created_at: string;
}

interface AddWordsParams {
  words: WordItem[];
  currentId: number;
}

export const addWordsToTable = async ({
  words,
  currentId,
}: AddWordsParams): Promise<number> => {
  let nextId = currentId;

  // DynamoDB BatchWriteItem supports up to 25 items per request
  const BATCH_SIZE = 25;

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);

    const writeRequests = batch.map((wordItem) => {
      const item = {
        word_id: nextId,
        word: wordItem.word,
        strongest_matches: wordItem.strongest,
        strong_matches: wordItem.strong,
        weak_matches: wordItem.weak,
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
      `Batch written: ${batch.length} words (IDs ${nextId - batch.length} to ${
        nextId - 1
      })`
    );
  }

  // Return the next ID that will be used
  return nextId;
};
