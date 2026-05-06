const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { generateRoadmap } = require("../controllers/roadmapController"); //Ye assume karta hai ki roadmapController file object export kar rahi hai jisme generateRoadmap function defined hai, jo ki roadmap generation logic ko handle karta hai. jab frontend se /api/roadmap/generate par POST request aayegi, to ye route trigger hoga aur protect middleware ke through user authentication check kiya jayega. agar user authenticated hai to generateRoadmap controller function call hoga, jo ki roadmap generation process ko execute karega aur generated roadmap ko response me bhej dega. isse users apne placement preparation ke liye personalized study plans generate kar sakte hain, jo unke target company aur role ke hisab se customized hote hain.

router.post("/generate", protect, generateRoadmap);

module.exports = router;