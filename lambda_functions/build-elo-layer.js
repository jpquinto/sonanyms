const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

async function zipLambdaLayer() {
  const sourceDir = path.join(__dirname, "dist/layers/elo/nodejs");
  const outputDir = path.join(__dirname, "build/layers");
  const outputFile = path.join(outputDir, "elo_layer.zip");

  // Ensure the output directory exists
  await fs.ensureDir(outputDir);

  // Create a write stream
  const output = fs.createWriteStream(outputFile);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // Maximum compression
  });

  // Listen for all archive data to be written
  output.on("close", () => {
    console.log(`✅ Lambda layer zipped successfully!`);
    console.log(`   Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Output: ${outputFile}`);
  });

  // Handle errors
  archive.on("error", (err) => {
    throw err;
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // Add the directory contents
  archive.directory(sourceDir, "nodejs");

  // Finalize the archive
  await archive.finalize();
}

// Run the script
zipLambdaLayer().catch((err) => {
  console.error("❌ Error zipping lambda layer:", err);
  process.exit(1);
});
