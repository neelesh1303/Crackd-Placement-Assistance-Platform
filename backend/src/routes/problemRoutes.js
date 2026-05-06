const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const { createProblem, getProblems } = require("../controllers/problemController");

router.get("/", protect, getProblems); //jb request /api/problems par GET method ke sath aayegi to ye route trigger hoga aur getProblems controller function call hoga
router.post("/", protect, createProblem); //jb request /api/problems par POST method ke sath aayegi to ye route trigger hoga aur createProblem controller function call hoga.

module.exports = router;