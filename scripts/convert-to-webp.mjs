import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IMAGES_DIR = path.resolve('Final_Upload_Ready_23-09-2026/Images');
const CSV_PATH = path.resolve('Final_Upload_Ready_23-09-2026/Product_Import_Upload.csv');

async function main() {
  console.log('--- Starting WebP Optimization ---');
  console.log('Images Directory:', IMAGES_DIR);

  // 1. Clean residual non-image files
  const cleanResiduals = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'Picflow Images Sep 24') {
          console.log('Removing residual directory:', fullPath);
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          cleanResiduals(fullPath);
        }
      } else {
        if (entry.name === '.DS_Store' || entry.name.endsWith('.zip')) {
          console.log('Removing residual file:', fullPath);
          fs.unlinkSync(fullPath);
        }
      }
    }
  };
  cleanResiduals(IMAGES_DIR);

  // 2. Collect all images to convert
  const imageFiles = [];
  const collectImages = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectImages(fullPath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
          imageFiles.push({
            fullPath,
            dir,
            name: entry.name,
            ext,
            base: path.basename(entry.name, ext)
          });
        }
      }
    }
  };
  collectImages(IMAGES_DIR);

  console.log(`Found ${imageFiles.length} image files to process.`);

  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;
  let convertedCount = 0;
  let errorCount = 0;

  // Track processed base names per directory to avoid duplicate collisions
  const processedByDir = new Map();

  for (const item of imageFiles) {
    const origStat = fs.statSync(item.fullPath);
    totalOriginalBytes += origStat.size;

    const dirKey = item.dir;
    if (!processedByDir.has(dirKey)) {
      processedByDir.set(dirKey, new Set());
    }
    const dirSet = processedByDir.get(dirKey);

    const targetFileName = `${item.base}.webp`;
    const targetPath = path.join(item.dir, targetFileName);

    // If we already converted this base name in this folder (e.g. pawan-bar_12.jpg and pawan-bar_12.png)
    if (dirSet.has(item.base.toLowerCase())) {
      console.log(`Skipping duplicate base name: ${item.name} in ${item.dir}`);
      if (item.ext !== '.webp') {
        fs.unlinkSync(item.fullPath);
      }
      continue;
    }

    try {
      if (item.ext === '.webp') {
        // Already webp, re-optimize to ensure max 2000px and uniform quality
        const tempPath = targetPath + '.tmp.webp';
        await sharp(item.fullPath)
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toFile(tempPath);

        fs.unlinkSync(item.fullPath);
        fs.renameSync(tempPath, targetPath);
      } else {
        // Convert JPG/PNG to WebP
        await sharp(item.fullPath)
          .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toFile(targetPath);

        // Remove old file
        fs.unlinkSync(item.fullPath);
      }

      const newStat = fs.statSync(targetPath);
      totalOptimizedBytes += newStat.size;
      dirSet.add(item.base.toLowerCase());
      convertedCount++;

      if (convertedCount % 50 === 0 || convertedCount === imageFiles.length) {
        console.log(`Processed ${convertedCount}/${imageFiles.length} images...`);
      }
    } catch (err) {
      console.error(`Error processing ${item.fullPath}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n--- Image Processing Complete ---');
  console.log(`Successfully converted: ${convertedCount} images`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Original Total Size: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Optimized Total Size: ${(totalOptimizedBytes / (1024 * 1024)).toFixed(2)} MB`);
  const savings = ((1 - totalOptimizedBytes / totalOriginalBytes) * 100).toFixed(1);
  console.log(`Total Reduction: ${savings}% (${((totalOriginalBytes - totalOptimizedBytes) / (1024 * 1024)).toFixed(2)} MB saved!)`);

  // 3. Update Product_Import_Upload.csv
  console.log('\n--- Updating Product_Import_Upload.csv ---');
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = csvContent.split('\n');

  if (lines.length > 0) {
    const headerLine = lines[0];
    const headers = headerLine.split(',');
    const imageColIdx = headers.indexOf('image_urls');

    if (imageColIdx === -1) {
      console.error('Could not find image_urls column in CSV!');
    } else {
      let updatedRows = 0;
      const newLines = lines.map((line, idx) => {
        if (idx === 0 || !line.trim()) return line;

        // Custom CSV parser for lines with quotes
        let inQuotes = false;
        let currentField = '';
        const fields = [];

        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
            currentField += char;
          } else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
          } else {
            currentField += char;
          }
        }
        fields.push(currentField);

        if (fields.length > imageColIdx) {
          let imgVal = fields[imageColIdx];
          if (imgVal) {
            // Replace .jpg, .jpeg, .png with .webp
            const updatedImgVal = imgVal.replace(/\.(jpg|jpeg|png)/gi, '.webp');
            if (updatedImgVal !== imgVal) {
              fields[imageColIdx] = updatedImgVal;
              updatedRows++;
            }
          }
        }

        return fields.join(',');
      });

      fs.writeFileSync(CSV_PATH, newLines.join('\n'), 'utf-8');
      console.log(`Updated ${updatedRows} product rows in Product_Import_Upload.csv with .webp extensions.`);
    }
  }

  console.log('\n--- WebP Conversion and CSV Synchronization Complete ---');
}

main().catch(err => {
  console.error('Fatal error during optimization:', err);
  process.exit(1);
});
