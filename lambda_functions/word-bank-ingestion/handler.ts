import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as csv from "csv-parser";

// Initialize the S3 client and DynamoDB DocumentClient
const s3Client = new S3Client({});
const dynamodbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Get the DynamoDB table name from an environment variable.
// Make sure this is set in your Lambda function's configuration.
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

if (!DYNAMODB_TABLE_NAME) {
  throw new Error("The DYNAMODB_TABLE_NAME environment variable is not set.");
}

export const handler = async (event: S3Event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Get the bucket name and file key from the S3 event record
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const fileKey = record.s3.object.key;

    console.log(`Processing file '${fileKey}' from bucket '${bucketName}'`);

    // Get the CSV object from S3
    const getObjectParams = {
      Bucket: bucketName,
      Key: fileKey,
    };
    const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));

    if (!Body) {
      throw new Error("S3 object body is empty.");
    }

    // TODO: Process the CSV data and insert it into DynamoDB

    return {
      statusCode: 200,
      body: JSON.stringify("File processed successfully!"),
    };
  } catch (e) {
    console.error("Error processing file:", e);
    return {
      statusCode: 500,
      body: JSON.stringify("Error processing file."),
    };
  }
};
