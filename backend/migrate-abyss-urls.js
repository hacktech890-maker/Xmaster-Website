/**
 * backend/migrate-abyss-urls.js
 *
 * One-time migration script to update all existing Video documents:
 *   - Extract abyssSlug from embed_code / embedUrl / file_code
 *   - Set embedUrl to https://abyssplayer.com/{slug}
 *   - Set abyssSlug field
 *
 * Run with:
 *   node backend/migrate-abyss-urls.js
 *
 * Safe to run multiple times (idempotent).
 */

require('dotenv').config({ path: __dirname + '/.env' });

const mongoose  = require('mongoose');
const Video     = require('./models/Video');
const { extractAbyssSlug, buildEmbedUrl } = require('./utils/abyssHelper');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function migrate() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected');

  const total  = await Video.countDocuments({});
  console.log(`📊 Total videos: ${total}`);

  let updated  = 0;
  let skipped  = 0;
  let failed   = 0;
  let cursor   = Video.find({}).cursor();

  for await (const video of cursor) {
    try {
      let slug = video.abyssSlug;

      // Already migrated with a valid slug?
      if (
        slug &&
        video.embedUrl &&
        video.embedUrl.includes('abyssplayer.com')
      ) {
        skipped++;
        continue;
      }

      // Try to extract slug from existing fields
      if (!slug) slug = extractAbyssSlug(video.embed_code  || '');
      if (!slug) slug = extractAbyssSlug(video.embedUrl    || '');
      if (!slug) slug = extractAbyssSlug(video.file_code   || '');

      if (!slug) {
        console.warn(`⚠️ Could not extract slug for video ${video._id} (${video.title})`);
        failed++;
        continue;
      }

      const newEmbedUrl = buildEmbedUrl(slug);

      await Video.updateOne(
        { _id: video._id },
        {
          $set: {
            abyssSlug:  slug,
            embedUrl:   newEmbedUrl,
            embed_code: newEmbedUrl, // keep legacy field in sync
          },
        }
      );

      updated++;
      if (updated % 100 === 0) {
        console.log(`   ✅ Updated ${updated}/${total}...`);
      }
    } catch (err) {
      console.error(`❌ Failed for video ${video._id}:`, err.message);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log(`✅ Migration complete`);
  console.log(`   Updated:  ${updated}`);
  console.log(`   Skipped:  ${skipped} (already migrated)`);
  console.log(`   Failed:   ${failed}`);
  console.log('═══════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});