const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

const layerRoot = path.resolve(__dirname, "build/layers/shared/nodejs");
const zipPath = path.resolve(__dirname, "build/layers/shared_layer.zip");

const packageJsonSrc = path.resolve(__dirname, "package.json");
const localNodeModules = path.resolve(__dirname, "node_modules");
const distSharedSrc = path.resolve(__dirname, "dist/layers/shared/nodejs");

// Packages and patterns to exclude from the layer
const EXCLUDE_PATTERNS = [
  // Development dependencies
  /^@types\//,
  /^typescript$/,
  /eslint/,
  /^@eslint/,
  /jest/,
  /^@jest/,
  /^@babel/,
  /webpack/,
  /rollup/,
  /prettier/,
  /nodemon/,
  /concurrently/,

  // Large packages that might not be needed
  /puppeteer/,
  /chrome-aws-lambda/,
];

// File patterns to exclude when copying
const EXCLUDE_FILES = [
  "*.md",
  "*.txt",
  "*.map",
  "*.d.ts",
  "*.spec.js",
  "*.test.js",
  "CHANGELOG*",
  "README*",
  "LICENSE*",
  "LICENCE*",
  "*.log",
];

// Directory patterns to exclude
const EXCLUDE_DIRS = [
  "test",
  "tests",
  "__tests__",
  "spec",
  "specs",
  "docs",
  "documentation",
  "examples",
  "example",
  "coverage",
  ".nyc_output",
  "bench",
  "benchmark",
  ".git",
];

function shouldExcludePackage(packageName) {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(packageName));
}

function shouldExcludeFile(fileName) {
  return EXCLUDE_FILES.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(fileName);
    }
    return fileName === pattern;
  });
}

function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.includes(dirName.toLowerCase());
}

async function copyNodeModulesOptimized(src, dest) {
  console.log("📦 Copying and optimizing node_modules...");

  await fs.ensureDir(dest);
  const packages = await fs.readdir(src);
  let excludedCount = 0;
  let includedCount = 0;

  for (const pkg of packages) {
    const srcPath = path.join(src, pkg);
    const destPath = path.join(dest, pkg);
    const stat = await fs.stat(srcPath);

    if (!stat.isDirectory()) continue;

    if (pkg === "aws-sdk") {
      console.log(`✅ Forcing full inclusion of: ${pkg}`);
      await fs.copy(srcPath, destPath);
      includedCount++;
      continue;
    }

    // Handle scoped packages (@org/package)
    if (pkg.startsWith("@")) {
      const destOrgDir = path.join(dest, pkg);
      await fs.ensureDir(destOrgDir);

      const scopedPackages = await fs.readdir(srcPath);
      for (const scopedPkg of scopedPackages) {
        const fullPkgName = `${pkg}/${scopedPkg}`;
        if (shouldExcludePackage(fullPkgName)) {
          console.log(`🗑️  Excluding: ${fullPkgName}`);
          excludedCount++;
          continue;
        }

        const scopedSrcPath = path.join(srcPath, scopedPkg);
        const scopedDestPath = path.join(destOrgDir, scopedPkg);

        // Special case for @corkvision packages
        if (pkg === "@corkvision") {
          console.log(`✅ Forcing inclusion of: ${fullPkgName}`);
          await fs.copy(scopedSrcPath, scopedDestPath, {
            overwrite: true,
            filter: (src, dest) => {
              // This filter is intentionally loose to include everything
              const basename = path.basename(src);
              return !shouldExcludeDir(basename);
            },
          });
          includedCount++;
          continue;
        }

        await copyPackageOptimized(scopedSrcPath, scopedDestPath);
        includedCount++;
      }
    } else {
      if (shouldExcludePackage(pkg)) {
        console.log(`🗑️  Excluding: ${pkg}`);
        excludedCount++;
        continue;
      }

      await copyPackageOptimized(srcPath, destPath);
      includedCount++;
    }
  }

  console.log(
    `✅ Processed ${includedCount} packages, excluded ${excludedCount} packages`
  );
}

async function copyPackageOptimized(src, dest) {
  await fs.ensureDir(dest);

  const items = await fs.readdir(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = await fs.stat(srcPath);

    if (stat.isDirectory()) {
      if (shouldExcludeDir(item)) {
        continue; // Skip excluded directories
      }
      await copyPackageOptimized(srcPath, destPath);
    } else {
      if (shouldExcludeFile(item)) {
        continue; // Skip excluded files
      }
      await fs.copy(srcPath, destPath);
    }
  }
}

async function buildLayer() {
  console.log("🧹 Cleaning previous build...");
  await fs.remove(layerRoot);
  await fs.remove(zipPath);

  console.log("📁 Creating layer directory...");
  await fs.ensureDir(layerRoot);
  const layerNodeModules = path.join(layerRoot, "node_modules");

  // Copy and optimize node_modules
  await copyNodeModulesOptimized(localNodeModules, layerNodeModules);

  console.log("📄 Copying package.json...");
  await fs.copy(packageJsonSrc, path.join(layerRoot, "package.json"));

  if (await fs.pathExists(distSharedSrc)) {
    console.log("📁 Copying shared compiled files...");
    const files = await fs.readdir(distSharedSrc);
    for (const file of files) {
      const srcPath = path.join(distSharedSrc, file);
      const destPath = path.join(layerRoot, file);
      await fs.copy(srcPath, destPath);
    }
  } else {
    console.warn(`⚠️ No compiled shared files found at: ${distSharedSrc}`);
  }

  // Check layer size before zipping
  console.log("📊 Layer optimized and ready for zipping");

  console.log("📦 Creating zip file...");
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.log(`✅ Layer zip created at: ${zipPath}`);
      console.log("🎉 Layer build completed successfully!");
      resolve();
    });

    archive.on("error", (err) => {
      console.error("❌ Error creating zip:", err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(layerRoot, "nodejs");
    archive.finalize();
  });
}

buildLayer().catch((err) => {
  console.error("❌ Error building layer:", err);
  process.exit(1);
});
