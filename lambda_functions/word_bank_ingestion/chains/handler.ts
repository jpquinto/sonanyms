import { S3Event } from "aws-lambda";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import csv from "csv-parser";
import { getCurrentId } from "./utils/get_current_id";
import { getChainWords } from "./utils/get_chain_words";
import { addWordsToTable } from "./utils/add_words_to_table";
import { updateCurrentId } from "./utils/update_current_id";

// Initialize the S3 client
const s3Client = new S3Client({});

interface ChainLink {
  word: string;
  score: number;
}

interface ChainWordItem {
  first_chain: string;
  links: ChainLink[];
}

export const handler = async (event: S3Event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Get the bucket name and file key from the S3 event record
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const fileKey = record.s3.object.key;

    if (!fileKey.startsWith("chain_words")) {
      console.log(
        `Ignoring file '${fileKey}' as it is not in the 'chain_words' folder.`
      );
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `File '${fileKey}' ignored. Not in 'chain_words' folder.`,
        }),
      };
    }

    console.log(`Processing file '${fileKey}' from bucket '${bucketName}'`);

    // Get the current ID from DynamoDB
    const startingId = await getCurrentId();
    console.log(`Starting with ID: ${startingId}`);

    // Get the CSV object from S3
    const getObjectParams = {
      Bucket: bucketName,
      Key: fileKey,
    };
    const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));

    if (!Body) {
      throw new Error("S3 object body is empty.");
    }

    // Convert Body to a readable stream
    const stream = Body as Readable;

    // Process CSV and collect words
    const words: string[] = [];

    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (row: any) => {
          // Assuming the CSV has a column named 'word' or is a single column
          const word = row.word || row[Object.keys(row)[0]];
          if (word && word.trim()) {
            words.push(word.trim().toLowerCase());
          }
        })
        .on("end", () => {
          console.log(`Parsed ${words.length} words from CSV`);
          resolve();
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    // Process each word and get chain words
    const wordData: ChainWordItem[] = [];
    let processedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const word of words) {
      try {
        console.log(`Processing word: ${word}`);

        // Get chain words using our helper function
        const chainWords = await getChainWords(word);

        // If no chain words returned (didn't meet minimum requirements), skip
        if (chainWords.length === 0) {
          console.log(
            `Skipping word '${word}' - did not meet minimum requirements`
          );
          skippedCount++;
          continue;
        }

        // Prepare the item data with chain words and scores
        const item: ChainWordItem = {
          first_chain: word,
          links: chainWords,
        };

        wordData.push(item);
        console.log(
          `Successfully processed word '${word}' with ${chainWords.length} chain words`
        );
        processedCount++;

      } catch (error) {
        console.error(`Error processing word '${word}':`, error);
        errorCount++;
        // Continue processing other words even if one fails
      }
    }

    console.log(
      `Processing complete. Processed: ${processedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`
    );

    // Batch write words to DynamoDB
    if (wordData.length > 0) {
      console.log(`Writing ${wordData.length} words to DynamoDB...`);
      const nextId = await addWordsToTable({
        words: wordData,
        currentId: startingId,
      });

      console.log(`All words written. Next available ID: ${nextId}`);

      // Update the current ID in the status table
      await updateCurrentId(nextId);
      console.log(`Updated current_id in status table to ${nextId}`);
    } else {
      console.log("No words to write to DynamoDB");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File processed successfully!",
        processedCount,
        skippedCount,
        errorCount,
        totalWords: words.length,
      }),
    };
  } catch (e) {
    console.error("Error processing file:", e);
    return {
      statusCode: 500,
      body: JSON.stringify("Error processing file."),
    };
  }
};
