import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});
const { ID_STATUS_TABLE_NAME } = process.env;

export const updateCurrentId = async (next_id: number): Promise<void> => {
  const command = new UpdateItemCommand({
    TableName: ID_STATUS_TABLE_NAME!,
    Key: marshall({
      metric_name: "chain_word_bank_current_id",
    }),
    UpdateExpression: "SET current_id = :currentId",
    ExpressionAttributeValues: marshall({
      ":currentId": next_id,
    }),
  });

  await client.send(command);
};
