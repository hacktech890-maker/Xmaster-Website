// backend/config/abyss.js
// Re-exports the main AbyssService from /backend/abyssServices.js
// This prevents duplicate service instances and keeps one source of truth
//
// If you were importing from "../config/abyss" anywhere, it will still work.
// All actual logic lives in /backend/abyssServices.js

const abyssService = require("../abyssServices");
module.exports = abyssService;