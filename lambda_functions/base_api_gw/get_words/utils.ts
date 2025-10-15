import {
  DynamoDBClient,
  QueryCommand,
  BatchGetItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});
const { WORD_BANK_TABLE_NAME, ID_STATUS_TABLE_NAME } = process.env;

export const getCurrentId = async (): Promise<number> => {
  const queryCommand = new QueryCommand({
    TableName: ID_STATUS_TABLE_NAME,
    KeyConditionExpression: "metric_name = :metricName",
    ExpressionAttributeValues: marshall({
      ":metricName": "word_bank_current_id",
    }),
  });

  const response = await client.send(queryCommand);

  if (response.Items && response.Items.length > 0) {
    const item = unmarshall(response.Items[0]);
    return item.current_id;
  } else {
    throw new Error(`No current_id found`);
  }
};

export const getQuestionsBatch = async (ids: string[]): Promise<any[]> => {
  const BATCH_SIZE = 100; // BatchGetItem supports up to 100 items per request
  const allQuestions: any[] = [];

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batchIds = ids.slice(i, i + BATCH_SIZE);

    const keys = batchIds.map((id) =>
      marshall({
        word_id: parseInt(id), // Convert string ID to number
      })
    );

    const command = new BatchGetItemCommand({
      RequestItems: {
        [WORD_BANK_TABLE_NAME!]: {
          Keys: keys,
        },
      },
    });

    const response = await client.send(command);

    if (response.Responses && response.Responses[WORD_BANK_TABLE_NAME!]) {
      const items = response.Responses[WORD_BANK_TABLE_NAME!].map((item) =>
        unmarshall(item)
      );
      allQuestions.push(...items);
    }
  }

  return allQuestions;
};
