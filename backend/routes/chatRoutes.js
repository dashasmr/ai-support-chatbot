const express = require("express");
const {
  handleChat,
  handleChatStream,
} = require("../controllers/chatController");

const router = express.Router();

router.post("/", handleChat);
router.post("/stream", handleChatStream);

module.exports = router;