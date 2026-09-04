/**
 * SAFE IMAGE MIGRATION SCRIPT
 * Migrates Base64 image strings from MongoDB to Cloudinary.
 * 
 * USAGE:
 *   Preview only (no changes):   node migrate-images.js --dry-run
 *   Execute migration:            node migrate-images.js --execute
 * 
 * SAFETY:
 *   - NEVER deletes original Base64 data unless migration succeeds first.
 *   - If Cloudinary upload fails, original data is preserved.
 *   - Skips records that already have Cloudinary/external URLs.
 *   - Writes a JSON report to ./migrate-images-report.json
 */

import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const isDryRun = process.argv.includes('--dry-run');
const isExecute = process.argv.includes('--execute');

if (!isDryRun && !isExecute) {
  console.log('\n  No mode specified. Run with --dry-run to preview or --execute to migrate.\n');
  console.log('  Preview only:   node migrate-images.js --dry-run');
  console.log('  Execute:        node migrate-images.js --execute\n');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function isBase64(str) { return typeof str === 'string' && str.startsWith('data:'); }
function isRemoteUrl(str) { return typeof str === 'string' && (str.startsWith('http://') || str.startsWith('https://')); }

async function uploadBase64ToCloudinary(base64String, folder, publicIdHint) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(base64String, { folder: `ecommerce/${folder}`, resource_type: 'auto', ...(publicIdHint ? { public_id: publicIdHint } : {}) }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
}

async function migrateCategories(Category) {
  const stats = { total: 0, base64Found: 0, alreadyUrls: 0, migrated: 0, failed: 0, skipped: 0 };
  const failures = [];
  const categories = await Category.find({}).lean();
  stats.total = categories.length;
  console.log(`\nCategories: ${stats.total} total\n`);
  for (const cat of categories) {
    if (!cat.image) { stats.skipped++; continue; }
    if (isRemoteUrl(cat.image)) { console.log(`  SKIP [${cat.name}] Already a URL`); stats.alreadyUrls++; continue; }
    if (isBase64(cat.image)) {
      stats.base64Found++;
      const approxSizeKB = Math.round(cat.image.length * 0.75 / 1024);
      console.log(`  BASE64 [${cat.name}] (~${approxSizeKB} KB) ${isDryRun ? 'DRY RUN' : 'uploading...'}`);
      if (isDryRun) continue;
      try {
        const result = await uploadBase64ToCloudinary(cat.image, 'categories', `cat_${cat._id}`);
        await Category.findByIdAndUpdate(cat._id, { image: result.secure_url });
        console.log(`  OK [${cat.name}] => ${result.secure_url}`);
        stats.migrated++;
      } catch (err) {
        console.error(`  FAIL [${cat.name}] ${err.message}`);
        stats.failed++;
        failures.push({ type: 'category', id: cat._id, name: cat.name, error: err.message });
      }
    } else { stats.skipped++; }
  }
  return { stats, failures };
}

async function migrateProducts(Product) {
  const stats = { total: 0, base64Found: 0, alreadyUrls: 0, migrated: 0, failed: 0, skipped: 0 };
  const failures = [];
  const products = await Product.find({}).lean();
  stats.total = products.length;
  console.log(`\nProducts: ${stats.total} total\n`);
  for (const prod of products) {
    let productNeedsUpdate = false;
    const updatedImages = [];
    const updatedDesigns = [];
    if (prod.images && prod.images.length > 0) {
      for (let i = 0; i < prod.images.length; i++) {
        const imgObj = prod.images[i];
        const url = imgObj.url || (typeof imgObj === 'string' ? imgObj : null);
        if (!url) { updatedImages.push(imgObj); continue; }
        if (isRemoteUrl(url)) { updatedImages.push(imgObj); stats.alreadyUrls++; continue; }
        if (isBase64(url)) {
          stats.base64Found++;
          const approxSizeKB = Math.round(url.length * 0.75 / 1024);
          console.log(`  BASE64 [${prod.sku}] image[${i}] (~${approxSizeKB} KB) ${isDryRun ? 'DRY RUN' : 'uploading...'}`);
          if (isDryRun) { updatedImages.push(imgObj); continue; }
          try {
            const result = await uploadBase64ToCloudinary(url, 'products', `prod_${prod._id}_img${i}`);
            updatedImages.push({ ...imgObj, url: result.secure_url, public_id: result.public_id });
            console.log(`  OK [${prod.sku}] image[${i}] => ${result.secure_url}`);
            stats.migrated++; productNeedsUpdate = true;
          } catch (err) {
            console.error(`  FAIL [${prod.sku}] image[${i}] ${err.message}`);
            stats.failed++;
            failures.push({ type: 'product', id: prod._id, sku: prod.sku, field: `images[${i}]`, error: err.message });
            updatedImages.push(imgObj);
          }
        } else { updatedImages.push(imgObj); stats.skipped++; }
      }
    }
    if (prod.designs && prod.designs.length > 0) {
      for (let j = 0; j < prod.designs.length; j++) {
        const design = prod.designs[j];
        if (!design.modelImage) { updatedDesigns.push(design); continue; }
        if (isRemoteUrl(design.modelImage)) { updatedDesigns.push(design); stats.alreadyUrls++; continue; }
        if (isBase64(design.modelImage)) {
          stats.base64Found++;
          const approxSizeKB = Math.round(design.modelImage.length * 0.75 / 1024);
          console.log(`  BASE64 [${prod.sku}] design[${j}].modelImage (~${approxSizeKB} KB) ${isDryRun ? 'DRY RUN' : 'uploading...'}`);
          if (isDryRun) { updatedDesigns.push(design); continue; }
          try {
            const result = await uploadBase64ToCloudinary(design.modelImage, 'designs', `prod_${prod._id}_design${j}`);
            updatedDesigns.push({ ...design, modelImage: result.secure_url });
            console.log(`  OK [${prod.sku}] design[${j}].modelImage => ${result.secure_url}`);
            stats.migrated++; productNeedsUpdate = true;
          } catch (err) {
            console.error(`  FAIL [${prod.sku}] design[${j}] ${err.message}`);
            stats.failed++;
            failures.push({ type: 'product', id: prod._id, sku: prod.sku, field: `designs[${j}].modelImage`, error: err.message });
            updatedDesigns.push(design);
          }
        } else { updatedDesigns.push(design); stats.skipped++; }
      }
    }
    if (!isDryRun && productNeedsUpdate) {
      const updatePayload = {};
      if (prod.images?.length > 0) updatePayload.images = updatedImages;
      if (prod.designs?.length > 0) updatePayload.designs = updatedDesigns;
      await Product.findByIdAndUpdate(prod._id, { '$set': updatePayload }, { runValidators: false });
    }
  }
  return { stats, failures };
}

async function main() {
  console.log(`\nIMAGE MIGRATION SCRIPT - Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTE'}\n`);
  if (!isDryRun && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
    console.error('FATAL: Missing Cloudinary credentials in .env'); process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected');
  const { default: Category } = await import('./models/Category.js');
  const { default: Product } = await import('./models/Product.js');
  const catResult = await migrateCategories(Category);
  const prodResult = await migrateProducts(Product);
  await mongoose.disconnect();
  console.log('\n=== SUMMARY ===');
  console.log('Categories:', catResult.stats);
  console.log('Products:', prodResult.stats);
  const report = { mode: isDryRun ? 'dry-run' : 'execute', timestamp: new Date().toISOString(), categories: catResult, products: prodResult };
  fs.writeFileSync(path.join(__dirname, 'migrate-images-report.json'), JSON.stringify(report, null, 2));
  console.log('\nReport written to migrate-images-report.json');
  if (isDryRun) console.log('\nDRY RUN complete. Run with --execute to apply changes.');
}

main().catch(err => { console.error('Fatal:', err); mongoose.disconnect(); process.exit(1); });
