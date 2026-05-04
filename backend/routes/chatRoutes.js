const express = require("express");
const {
  handleChat,
  handleChatStream,
  getChatHistory,
} = require("../controllers/chatController");

const router = express.Router();

router.post("/", handleChat);
router.post("/stream", handleChatStream);
router.get("/history", getChatHistory);

module.exports = router;