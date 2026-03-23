// ============================================================
//  SEED VIDEOS SCRIPT
//
//  USAGE (run from backend folder):
//    node seedVideos.js              → Insert 200 seed videos
//    node seedVideos.js 500          → Insert 500 seed videos
//    node seedVideos.js --delete     → Remove ALL seed videos
//    node seedVideos.js --count      → Count existing seed videos
//
//  All seed videos are tagged with "seed-video" so they can be
//  identified and removed at any time without affecting real content.
//
//  IMPORTANT: Your Video model requires file_code (unique).
//  This script generates unique file_codes for each seed video.
// ============================================================

require('dotenv').config();
const mongoose = require('mongoose');

// ===================== PARSE ARGS =====================
const args = process.argv.slice(2);
const ACTION = args.find(a => a.startsWith('--'));
const SEED_COUNT = ACTION ? 200 : (parseInt(args[0]) || 200);
const MIN_VIEWS = 1000;
const MAX_VIEWS = 50000;

// ===================== DB CONNECTION =====================
const MONGO_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.DB_URI ||
  process.env.DATABASE_URL;

if (!MONGO_URI) {
  console.error('❌ No MongoDB URI found in .env file.');
  console.error('   Make sure MONGODB_URI is set in backend/.env');
  process.exit(1);
}

// ===================== LOAD VIDEO MODEL =====================
let Video;
try {
  Video = require('./models/Video');
  console.log('✅ Loaded Video model from ./models/Video');
} catch (e) {
  console.log('⚠️  Could not load ./models/Video, using inline schema');

  const videoSchema = new mongoose.Schema(
    {
      file_code: { type: String, required: true, unique: true, index: true },
      embed_code: { type: String, default: '' },
      title: { type: String, required: true, trim: true, maxlength: 200 },
      slug: { type: String, unique: true, sparse: true },
      description: { type: String, default: '', maxlength: 5000 },
      thumbnail: { type: String, default: '' },
      thumbnailUrl: { type: String, default: '' },
      cloudinary_public_id: { type: String, default: '' },
      duration: { type: String, default: '00:00' },
      duration_seconds: { type: Number, default: 0 },
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
      categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
      tags: [{ type: String, lowercase: true, trim: true }],
      views: { type: Number, default: 0, index: true },
      likes: { type: Number, default: 0 },
      dislikes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      status: { type: String, default: 'public', index: true },
      featured: { type: Boolean, default: false, index: true },
      isDuplicate: { type: Boolean, default: false },
      titleNormalized: { type: String, default: '' },
      uploadDate: { type: Date, default: Date.now, index: true },
    },
    { timestamps: true }
  );

  Video = mongoose.model('Video', videoSchema);
}

// ===================== DATA POOLS =====================
const adjectives = [
  'Hot', 'Sexy', 'Beautiful', 'Stunning', 'Amazing', 'Gorgeous', 'Cute',
  'Naughty', 'Wild', 'Passionate', 'Sensual', 'Exotic', 'Pretty', 'Lovely',
  'Busty', 'Petite', 'Curvy', 'Slim', 'Young', 'Mature', 'Thick',
  'Kinky', 'Innocent', 'Dirty', 'Juicy', 'Sweet', 'Spicy', 'Sultry',
  'Alluring', 'Seductive', 'Charming', 'Irresistible', 'Tempting',
];

const subjects = [
  'Babe', 'Girl', 'MILF', 'Teen', 'Brunette', 'Blonde', 'Redhead',
  'Latina', 'Asian', 'Ebony', 'Indian', 'Desi', 'Model', 'GF',
  'Wife', 'Stepmom', 'Stepsister', 'Neighbor', 'College Girl', 'Amateur',
  'Couple', 'BBW', 'Beauty', 'Goddess', 'Queen', 'Angel', 'Pornstar',
  'Camgirl', 'Housewife', 'Nurse',
];

const actions = [
  'Gets Fucked Hard', 'Solo Masturbation', 'Blowjob POV', 'Riding Compilation',
  'Doggystyle Scene', 'Anal First Time', 'Creampie Surprise', 'Deepthroat',
  'Squirting Orgasm', 'Hardcore Scene', 'Leaked MMS', 'Viral Video',
  'Homemade Sex Tape', 'Webcam Show', 'Strip Tease', 'Shower Scene',
  'Bedroom Fun', 'Outdoor Adventure', 'Office Hookup', 'Massage Happy Ending',
  'Casting Couch', 'POV Fuck', 'Threesome FFM', 'Gangbang Party',
  'Rough Sex', 'Romantic Lovemaking', 'One Night Stand', 'Hotel Room Fun',
  'Car Sex', 'Pool Party', 'Gym Workout', 'Roleplay Fantasy',
  'JOI Video', 'ASMR Moaning', 'Cum Compilation', 'Best Moments',
  'Morning Sex', 'Late Night Fun', 'First Date', 'Reunion Sex',
];

const suffixes = [
  'HD', '4K UHD', 'Full Video', 'Part 1', 'Part 2', 'Part 3',
  'Exclusive', 'Premium', 'Uncut', 'Extended', 'New 2024', 'New 2025',
  'Must Watch', 'Trending', 'Viral', 'Best Ever', 'Top Rated',
  '', '', '', '', '', '', '', // empty for variety
];

const allTags = [
  'amateur', 'hd', 'homemade', 'pov', 'solo', 'couple', 'webcam',
  'brunette', 'blonde', 'redhead', 'asian', 'latina', 'ebony',
  'milf', 'teen', 'mature', 'bbw', 'petite', 'curvy', 'big-ass',
  'big-tits', 'anal', 'oral', 'hardcore', 'softcore', 'romantic',
  'passionate', 'rough', 'new', 'trending', 'popular', 'viral',
  'exclusive', 'premium', '4k', 'full-hd', 'indian', 'desi', 'mms',
  'creampie', 'cumshot', 'blowjob', 'doggystyle', 'missionary',
  'threesome', 'gangbang', 'lesbian', 'interracial', 'compilation',
];

// ===================== HELPERS =====================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomHex(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate UNIQUE file_code (required by Video model)
function generateFileCode(index) {
  // Format: seed_{random8chars}_{paddedIndex}
  // Ensures uniqueness via index + randomness for realism
  return `seed${randomHex(8)}${index.toString().padStart(5, '0')}`;
}

// Generate slug from title + file_code (mimics pre-save hook)
function generateSlug(title, fileCode) {
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 70);
  return `${titleSlug}-${fileCode.substring(0, 8)}`;
}

function generateTitle() {
  const adj = randomPick(adjectives);
  const sub = randomPick(subjects);
  const act = randomPick(actions);
  const suf = randomPick(suffixes);
  return `${adj} ${sub} ${act}${suf ? ' - ' + suf : ''}`;
}

function generateDuration() {
  const mins = randomInt(5, 45);
  const secs = randomInt(0, 59);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseDurationToSeconds(duration) {
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function generatePastDate(maxDaysAgo = 120) {
  const daysAgo = randomInt(1, maxDaysAgo);
  const hoursAgo = randomInt(0, 23);
  const minsAgo = randomInt(0, 59);
  return new Date(Date.now() - daysAgo * 86400000 - hoursAgo * 3600000 - minsAgo * 60000);
}

function generateTags() {
  const count = randomInt(3, 7);
  const picked = shuffleArray(allTags).slice(0, count);
  picked.push('seed-video'); // Always tag for easy cleanup
  return [...new Set(picked)];
}

function generateTitleNormalized(title) {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

// Thumbnail: use picsum.photos with unique seed for varied real images
function generateThumbnail(index) {
  return `https://picsum.photos/seed/xm${index}/640/360`;
}

// ===================== SEED FUNCTION =====================
async function seedVideos() {
  console.log(`\n🌱 Preparing ${SEED_COUNT} seed videos...\n`);

  // Check for existing seed videos
  const existingCount = await Video.countDocuments({ tags: 'seed-video' });
  if (existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing seed videos.`);
    console.log(`   New ones will be added alongside them.`);
    console.log(`   Run "node seedVideos.js --delete" first to remove old ones.\n`);
  }

  const videos = [];
  const usedTitles = new Set();
  const usedFileCodes = new Set();

  for (let i = 0; i < SEED_COUNT; i++) {
    // Generate unique title
    let title;
    let attempts = 0;
    do {
      title = generateTitle();
      attempts++;
    } while (usedTitles.has(title) && attempts < 50);
    usedTitles.add(title);

    // Generate unique file_code
    let fileCode;
    do {
      fileCode = generateFileCode(i);
    } while (usedFileCodes.has(fileCode));
    usedFileCodes.add(fileCode);

    // Generate all computed fields that pre-save hook normally handles
    const slug = generateSlug(title, fileCode);
    const embedCode = `https://short.icu/${fileCode}`;
    const titleNormalized = generateTitleNormalized(title);
    const duration = generateDuration();
    const durationSeconds = parseDurationToSeconds(duration);
    const uploadDate = generatePastDate(120);

    // Random realistic stats
    const views = randomInt(MIN_VIEWS, MAX_VIEWS);
    const likes = randomInt(Math.floor(views * 0.02), Math.floor(views * 0.08));
    const dislikes = randomInt(0, Math.floor(likes * 0.1));
    const shares = randomInt(0, Math.floor(views * 0.01));

    videos.push({
      // Required fields
      file_code: fileCode,
      title: title,

      // Computed fields (normally from pre-save hook)
      slug: slug,
      embed_code: embedCode,
      titleNormalized: titleNormalized,

      // Content fields
      description: `Watch ${title} in HD quality. Free streaming on Xmaster. Enjoy this exclusive content now!`,
      thumbnail: generateThumbnail(i),
      thumbnailUrl: '',
      cloudinary_public_id: '',

      // Duration
      duration: duration,
      duration_seconds: durationSeconds,

      // Stats (random 1K–50K views)
      views: views,
      likes: likes,
      dislikes: dislikes,
      shares: shares,

      // Tags (always includes "seed-video")
      tags: generateTags(),

      // Category: null (no category assigned)
      category: null,
      categories: [],

      // Status
      status: 'public',
      featured: Math.random() < 0.05, // 5% chance

      // Duplicate detection
      isDuplicate: false,
      duplicateOf: null,
      duplicateReasons: [],
      fileHash: '',

      // Dates
      uploadDate: uploadDate,
      createdAt: uploadDate,
      updatedAt: uploadDate,
    });
  }

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    try {
      const result = await Video.insertMany(batch, { ordered: false });
      inserted += result.length;
    } catch (err) {
      // Handle partial insert (some may fail due to duplicate keys)
      if (err.insertedDocs) {
        inserted += err.insertedDocs.length;
        failed += batch.length - err.insertedDocs.length;
      } else if (err.result && err.result.nInserted) {
        inserted += err.result.nInserted;
        failed += batch.length - err.result.nInserted;
      } else {
        failed += batch.length;
      }
    }

    const total = inserted + failed;
    const pct = Math.round((total / videos.length) * 100);
    process.stdout.write(`\r   📦 Progress: ${total}/${videos.length} (${pct}%) — ✅ ${inserted} inserted, ❌ ${failed} failed`);
  }

  console.log('\n');
  console.log('━'.repeat(50));
  console.log(`✅ Successfully seeded ${inserted} videos!`);
  if (failed > 0) console.log(`⚠️  ${failed} failed (likely duplicate file_code/slug)`);
  console.log(`👁️  Views range: ${MIN_VIEWS.toLocaleString()} – ${MAX_VIEWS.toLocaleString()}`);
  console.log(`🏷️  All tagged with "seed-video" for easy removal`);
  console.log('━'.repeat(50));
  console.log(`\n📌 To remove seed videos later, run:`);
  console.log(`   node seedVideos.js --delete\n`);
}

// ===================== DELETE FUNCTION =====================
async function deleteSeedVideos() {
  console.log('\n🗑️  Deleting all seed videos...\n');

  const count = await Video.countDocuments({ tags: 'seed-video' });
  if (count === 0) {
    console.log('ℹ️  No seed videos found. Nothing to delete.\n');
    return;
  }

  console.log(`   Found ${count} seed videos to delete...`);
  const result = await Video.deleteMany({ tags: 'seed-video' });
  console.log(`\n✅ Deleted ${result.deletedCount} seed videos.`);
  console.log(`   Your real videos are untouched.\n`);
}

// ===================== COUNT FUNCTION =====================
async function countSeedVideos() {
  const seedCount = await Video.countDocuments({ tags: 'seed-video' });
  const totalCount = await Video.countDocuments({});
  const activeCount = await Video.countDocuments({ status: 'active', isDuplicate: { $ne: true } });
  const publicCount = await Video.countDocuments({ status: 'public', isDuplicate: { $ne: true } });

  console.log('\n📊 Video Statistics:');
  console.log('━'.repeat(35));
  console.log(`   Seed videos:   ${seedCount}`);
  console.log(`   Real videos:   ${totalCount - seedCount}`);
  console.log(`   Total:         ${totalCount}`);
  console.log(`   Active:        ${activeCount}`);
  console.log(`   Public:        ${publicCount}`);
  console.log('━'.repeat(35));
  console.log('');
}

// ===================== MAIN =====================
async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    switch (ACTION) {
      case '--delete':
        await deleteSeedVideos();
        break;
      case '--count':
        await countSeedVideos();
        break;
      default:
        await seedVideos();
        break;
    }
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.code === 11000) {
      console.error('   Duplicate key error — try running --delete first, then seed again.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

main();