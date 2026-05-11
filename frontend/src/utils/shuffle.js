// src/utils/shuffle.js
// Session-stable video shuffle utility
//
// Generates a random seed ONCE per browser session (stored in
// sessionStorage). Using the same seed within a session means
// the order stays consistent during browsing but refreshes on
// every new page load / tab open.

const SESSION_KEY = 'xm_shuffle_seed';

const getSessionSeed = () => {
  try {
    let seed = sessionStorage.getItem(SESSION_KEY);
    if (!seed) {
      seed = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, seed);
    }
    return seed;
  } catch {
    return Math.random().toString(36).slice(2);
  }
};

// Seeded PRNG (mulberry32)
const seedToInt = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return h >>> 0;
};

const mulberry32 = (seed) => {
  let a = seedToInt(seed);
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

const seededShuffle = (array, rng) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Shuffle an array using the session seed.
 * Stable within a session, fresh on every reload.
 * @param {Array}  arr   — array to shuffle
 * @param {string} salt  — extra salt so different sections get different orders
 */
export const sessionShuffle = (arr, salt = '') => {
  if (!Array.isArray(arr) || arr.length <= 1) return arr;
  const rng = mulberry32(getSessionSeed() + salt);
  return seededShuffle(arr, rng);
};

/**
 * Shuffle only the tail, keeping the first `keepFirst` items in place.
 * Use for trending where top items should stay prominent.
 */
export const sessionShuffleTail = (arr, keepFirst = 4, salt = '') => {
  if (!Array.isArray(arr) || arr.length <= keepFirst + 1) return arr;
  const head = arr.slice(0, keepFirst);
  const tail = sessionShuffle(arr.slice(keepFirst), salt + '_tail');
  return [...head, ...tail];
};