import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({});
const { ID_STATUS_TABLE_NAME } = process.env;

export const getCurrentId = async (): Promise<number> => {
  const defaultId = 1;

  const getItemCommand = new GetItemCommand({
    TableName: ID_STATUS_TABLE_NAME!,
    Key: marshall({
      metric_name: "chain_word_bank_current_id",
    }),
  });

  const response = await client.send(getItemCommand);

  if (response.Item) {
    const item = unmarshall(response.Item);
    return item.current_id;
  }

  return defaultId;
};
