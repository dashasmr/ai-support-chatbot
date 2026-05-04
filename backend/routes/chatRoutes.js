const express = require("express");
const {
  handleChat,
  handleChatStream,
  getChatHistory,
  getChatAnalytics,
} = require("../controllers/chatController");

const router = express.Router();

function requireAdminKey(req, res, next) {
  const configuredAdminKey = process.env.ADMIN_API_KEY;
  const providedAdminKey = req.header("x-admin-key");

  if (!configuredAdminKey) {
    return res.status(503).json({
      error: "Admin API key is not configured on the server.",
    });
  }

  if (!providedAdminKey || providedAdminKey !== configuredAdminKey) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  return next();
}

router.post("/", handleChat);
router.post("/stream", handleChatStream);
router.get("/history", requireAdminKey, getChatHistory);
router.get("/analytics", requireAdminKey, getChatAnalytics);

module.exports = router;