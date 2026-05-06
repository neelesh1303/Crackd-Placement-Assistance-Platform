const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getTracker,
  updateChecklistItem,
  getStreak,
  getReadiness,
  saveRoadmapToTracker,
} = require("../controllers/trackerController");

// Tracker get/update
router.get("/", protect, getTracker);
router.put("/checklist", protect, updateChecklistItem);

// Streak aur readiness endpoints
router.get("/streak", protect, getStreak);
router.get("/readiness", protect, getReadiness);

// Save roadmap to tracker
router.post("/save-roadmap", protect, saveRoadmapToTracker);

module.exports = router;