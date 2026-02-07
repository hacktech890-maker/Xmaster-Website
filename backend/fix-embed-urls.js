const mongoose = require('mongoose');
const Video = require('./models/Video');
require('dotenv').config();

async function fixEmbedUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const videos = await Video.find({});
    console.log(`📊 Found ${videos.length} videos`);

    let fixed = 0;
    let failed = 0;
    let skipped = 0;

    for (const video of videos) {
      try {
        if (!video.embed_code) {
          skipped++;
          continue;
        }

        // Fix old wrong embed format
        if (video.embed_code.includes('abyss.to/e/')) {
          console.log(`⚠️ Found old embed URL: ${video.embed_code}`);

          const filecode = video.file_code;

          if (filecode) {
            // New embed format
            const newEmbedUrl = `https://abyss.to/embed/${filecode}`;

            video.embed_code = newEmbedUrl;
            await video.save();

            console.log(`✅ Fixed: ${video.title} -> ${newEmbedUrl}`);
            fixed++;
          } else {
            console.log(`❌ No file_code for: ${video.title}`);
            failed++;
          }
        } else {
          skipped++;
        }
      } catch (err) {
        console.error(`❌ Error fixing ${video.title}:`, err.message);
        failed++;
      }
    }

    console.log('\n📊 Migration Complete:');
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏭️ Skipped: ${skipped}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixEmbedUrls();
