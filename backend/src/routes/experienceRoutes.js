//ye router file experience related routes ko handle karta hai, jisme hum experiences ko get karne, create karne, aur upvote toggle karne ke liye endpoints define karte hain. is file me hum protect middleware ka use karke ensure karte hain ki sirf authenticated users hi experience create aur upvote toggle kar sake. ye router backend me /api/experiences path ke sath mount kiya jata hai, jisse frontend se experience related API calls is router ke through handle hoti hain.

const express = require("express");
const router = express.Router();

const {
  getExperiences,
  createExperience,
  toggleUpvoteExperience,
} = require("../controllers/experienceController");

const { protect } = require("../middleware/auth");

router.get("/", getExperiences); //iska mtlb hai ki jab bhi frontend se /api/experiences par GET request aayegi, to ye getExperiences controller function ko call karega, jo ki database se experiences ko retrieve karke response me bhejega. is route ko public access diya gaya hai, jisse koi bhi user, chahe wo authenticated ho ya nahi, experiences ko dekh sakta hai.
router.post("/", protect, createExperience); 
router.put("/:id/upvote", protect, toggleUpvoteExperience); //ye route experience ke upvote toggle karne ke liye hai, jisme :id URL parameter ke through specific experience ko target kiya jata hai. is route ko protect middleware ke through secure kiya gaya hai, jisse sirf authenticated users hi kisi experience ko upvote ya un-upvote kar sakte hain. jab frontend se /api/experiences/:id/upvote par PUT request aayegi, to ye toggleUpvoteExperience controller function ko call karega, jo ki specified experience ke upvotes array me current user ka id add ya remove karke upvote status toggle karega, aur updated upvotes count aur status response me bhejega.

module.exports = router;