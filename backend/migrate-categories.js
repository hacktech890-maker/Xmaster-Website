/**
 * MIGRATION SCRIPT: Convert category from String to ObjectId
 * 
 * Run this ONCE: node migrate-categories.js
 * 
 * What it does:
 * 1. Finds all unique category strings in videos
 * 2. Creates Category documents for any that don't exist
 * 3. Updates all videos to use ObjectId references
 * 4. Handles "General" and empty categories
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// Models
const Category = require('./models/Category');

// We need the OLD video schema (string category) to read data
const oldVideoSchema = new mongoose.Schema({}, { strict: false, collection: 'videos' });
const OldVideo = mongoose.model('OldVideo', oldVideoSchema);

async function migrate() {
  console.log('\n═══════════════════════════════════════');
  console.log('🔄 CATEGORY MIGRATION STARTED');
  console.log('═══════════════════════════════════════\n');

  // Step 1: Find all unique category values in videos
  const uniqueCategories = await OldVideo.distinct('category');
  console.log(`📋 Found ${uniqueCategories.length} unique category values in videos:`);
  console.log(uniqueCategories);

  // Step 2: Create Category documents for each unique value
  let categoryMap = {}; // string -> ObjectId

  // First, load existing categories
  const existingCategories = await Category.find({});
  existingCategories.forEach(cat => {
    categoryMap[cat.name.toLowerCase()] = cat._id;
    categoryMap[cat.slug] = cat._id;
  });
  console.log(`\n📂 ${existingCategories.length} categories already exist in DB`);

  // Create missing categories
  let created = 0;
  for (const catValue of uniqueCategories) {
    if (!catValue || catValue === '' || catValue === 'null' || catValue === 'undefined') continue;

    // Check if it's already an ObjectId (already migrated)
    if (mongoose.Types.ObjectId.isValid(catValue) && String(new mongoose.Types.ObjectId(catValue)) === catValue) {
      // It's already an ObjectId, check if it exists
      const exists = await Category.findById(catValue);
      if (exists) {
        categoryMap[catValue] = exists._id;
        continue;
      }
    }

    const normalizedName = catValue.toString().trim();
    if (!normalizedName) continue;

    // Check if category already exists by name (case-insensitive)
    if (categoryMap[normalizedName.toLowerCase()]) continue;

    const slug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (categoryMap[slug]) continue;

    try {
      const newCat = await Category.create({
        name: normalizedName,
        slug: slug,
        icon: '📁',
        color: '#ef4444',
        isActive: true,
      });
      categoryMap[normalizedName.toLowerCase()] = newCat._id;
      categoryMap[slug] = newCat._id;
      categoryMap[catValue] = newCat._id;
      created++;
      console.log(`  ✅ Created category: "${normalizedName}" (${newCat._id})`);
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate - find existing
        const existing = await Category.findOne({
          $or: [
            { name: { $regex: new RegExp(`^${normalizedName}$`, 'i') } },
            { slug: slug }
          ]
        });
        if (existing) {
          categoryMap[normalizedName.toLowerCase()] = existing._id;
          categoryMap[catValue] = existing._id;
          console.log(`  ⚠️ Already exists: "${normalizedName}" -> ${existing._id}`);
        }
      } else {
        console.error(`  ❌ Failed to create "${normalizedName}":`, err.message);
      }
    }
  }
  console.log(`\n📊 Created ${created} new categories`);

  // Ensure "General" category exists as fallback
  let generalCatId;
  const generalCat = await Category.findOne({ name: { $regex: /^general$/i } });
  if (generalCat) {
    generalCatId = generalCat._id;
  } else {
    const newGeneral = await Category.create({
      name: 'General',
      slug: 'general',
      icon: '📁',
      color: '#6b7280',
      isActive: true,
    });
    generalCatId = newGeneral._id;
    console.log(`✅ Created "General" fallback category: ${generalCatId}`);
  }

  // Step 3: Update all videos
  console.log('\n🔄 Updating videos...');
  const allVideos = await OldVideo.find({});
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of allVideos) {
    try {
      const catValue = video.category;
      let newCatId = null;

      if (!catValue || catValue === '' || catValue === 'null' || catValue === 'undefined') {
        newCatId = generalCatId;
      } else if (mongoose.Types.ObjectId.isValid(catValue) && String(new mongoose.Types.ObjectId(catValue)) === String(catValue)) {
        // Already an ObjectId
        const exists = await Category.findById(catValue);
        if (exists) {
          skipped++;
          continue; // Already migrated
        }
        newCatId = generalCatId;
      } else {
        // It's a string, find the mapped category
        const normalizedName = catValue.toString().trim().toLowerCase();
        newCatId = categoryMap[normalizedName] || categoryMap[catValue] || generalCatId;
      }

      await OldVideo.updateOne(
        { _id: video._id },
        {
          $set: {
            category: newCatId,
            categories: [newCatId], // Also set categories array
          }
        }
      );
      updated++;
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed to update video ${video._id}:`, err.message);
    }
  }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ MIGRATION COMPLETE`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (already done): ${skipped}`);
  console.log(`   Failed: ${failed}`);
  console.log(`═══════════════════════════════════════\n`);

  // Update video counts for all categories
  console.log('📊 Updating category video counts...');
  const allCats = await Category.find({});
  for (const cat of allCats) {
    const count = await OldVideo.countDocuments({
      category: cat._id,
      status: 'public',
      isDuplicate: { $ne: true }
    });
    await Category.updateOne({ _id: cat._id }, { $set: { videoCount: count } });
  }
  console.log('✅ Video counts updated');

  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});