#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Converts large PNGs to optimized WebP format.
 * - Avatars: 512x512 max
 * - Other images: 1920x1080 max
 *
 * Usage: node scripts/optimize-images.js
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_DIR = path.join(__dirname, "../public");

// Size configurations per directory
const SIZE_CONFIG = {
  avatars: { maxWidth: 512, maxHeight: 512 },
  "pitt-boss": { maxWidth: 800, maxHeight: 800 },
  default: { maxWidth: 1920, maxHeight: 1080 },
};

const WEBP_QUALITY = 85;

/**
 * Get all image files recursively
 */
function getImageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getImageFiles(filePath, fileList);
    } else if (/\.(png|jpe?g)$/i.test(file)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Get size config for a file path
 */
function getSizeConfig(filePath) {
  const relativePath = path.relative(PUBLIC_DIR, filePath);
  for (const [dir, config] of Object.entries(SIZE_CONFIG)) {
    if (relativePath.includes(dir)) {
      return config;
    }
  }
  return SIZE_CONFIG.default;
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const relativePath = path.relative(PUBLIC_DIR, inputPath);
  const originalSize = fs.statSync(inputPath).size;

  // Skip small files (< 100KB)
  if (originalSize < 100 * 1024) {
    console.log(`Skipping (small): ${relativePath}`);
    return { skipped: true };
  }

  const config = getSizeConfig(inputPath);
  const webpPath = inputPath.replace(/\.(png|jpe?g)$/i, ".webp");

  try {
    const metadata = await sharp(inputPath).metadata();

    console.log(`Processing: ${relativePath}`);
    console.log(`  Original: ${metadata.width}x${metadata.height} (${(originalSize / 1024).toFixed(0)} KB)`);

    // Resize and convert to WebP
    await sharp(inputPath)
      .resize({
        width: config.maxWidth,
        height: config.maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    const newSize = fs.statSync(webpPath).size;
    const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

    console.log(`  WebP: ${(newSize / 1024).toFixed(0)} KB (${savings}% smaller)`);

    // Delete original PNG/JPG
    fs.unlinkSync(inputPath);
    console.log(`  Deleted original: ${path.basename(inputPath)}`);

    return { originalSize, newSize, savings: parseFloat(savings) };
  } catch (error) {
    console.error(`  ERROR: ${error.message}`);
    return { error: true };
  }
}

/**
 * Update code references from .png/.jpg to .webp
 */
function updateCodeReferences() {
  const srcDir = path.join(__dirname, "../src");
  const extensions = [".tsx", ".ts", ".js", ".jsx"];

  function processFile(filePath) {
    let content = fs.readFileSync(filePath, "utf8");
    const original = content;

    // Replace avatar references
    content = content.replace(/\/avatars\/([^"']+)\.(png|jpg|jpeg)/gi, "/avatars/$1.webp");
    // Replace pit-boss references
    content = content.replace(/\/pitt-boss\/([^"']+)\.(png|jpg|jpeg)/gi, "/pitt-boss/$1.webp");
    // Replace logo
    content = content.replace(/\/logo\.png/g, "/logo.webp");

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated references in: ${path.relative(srcDir, filePath)}`);
    }
  }

  function processDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory() && !file.includes("node_modules")) {
        processDir(filePath);
      } else if (extensions.some((ext) => file.endsWith(ext))) {
        processFile(filePath);
      }
    });
  }

  console.log("\nUpdating code references...");
  processDir(srcDir);
}

async function main() {
  console.log("=".repeat(50));
  console.log("  Image Optimization Script");
  console.log("=".repeat(50));
  console.log("");

  const imageFiles = getImageFiles(PUBLIC_DIR);
  const pngFiles = imageFiles.filter((f) => /\.(png|jpe?g)$/i.test(f));

  if (pngFiles.length === 0) {
    console.log("No PNG/JPG images found to optimize");
    return;
  }

  console.log(`Found ${pngFiles.length} images to optimize\n`);

  let totalOriginal = 0;
  let totalNew = 0;
  let optimized = 0;

  for (const imagePath of pngFiles) {
    const result = await optimizeImage(imagePath);
    if (result.originalSize) {
      totalOriginal += result.originalSize;
      totalNew += result.newSize;
      optimized++;
    }
    console.log("");
  }

  // Update code references
  updateCodeReferences();

  console.log("\n" + "=".repeat(50));
  console.log("  Optimization Complete!");
  console.log("=".repeat(50));
  console.log(`  Images optimized: ${optimized}`);
  console.log(`  Total before: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total after: ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total savings: ${((1 - totalNew / totalOriginal) * 100).toFixed(1)}%`);
  console.log("");
}

main().catch((error) => {
  console.error("FATAL ERROR:", error);
  process.exit(1);
});
