const express = require("express");
const { protect } = require("../middleware/auth");
const { chat, chatStream } = require("../controllers/chatController");

const router = express.Router();

router.post("/", protect, chat);
router.post("/stream", protect, chatStream);

module.exports = router;