// Experience routes are mounted under /api/experiences.

const express = require("express");
const router = express.Router();

const {
  getExperiences,
  createExperience,
} = require("../controllers/experienceController");

const { protect } = require("../middleware/auth");

router.get("/", getExperiences); //iska mtlb hai ki jab bhi frontend se /api/experiences par GET request aayegi, to ye getExperiences controller function ko call karega, jo ki database se experiences ko retrieve karke response me bhejega. is route ko public access diya gaya hai, jisse koi bhi user, chahe wo authenticated ho ya nahi, experiences ko dekh sakta hai.
router.post("/", protect, createExperience); 

module.exports = router;