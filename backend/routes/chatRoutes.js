const express = require("express");
const {
  handleChat,
  handleChatStream,
  getChatHistory,
  getChatHistoryExport,
  getChatAnalytics,
} = require("../controllers/chatController");

const router = express.Router();
const chatRateState = new Map();

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const CHAT_RATE_LIMIT_WINDOW_MS = parsePositiveInt(
  process.env.CHAT_RATE_LIMIT_WINDOW_MS,
  10 * 60 * 1000
);
const CHAT_RATE_LIMIT_MAX_REQUESTS = parsePositiveInt(
  process.env.CHAT_RATE_LIMIT_MAX_REQUESTS,
  20
);

function getClientIp(req) {
  // Works with reverse proxies (Render) when trust proxy is enabled.
  return req.ip || req.connection?.remoteAddress || "unknown";
}

function enforceChatRateLimit(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const current = chatRateState.get(ip);

  if (!current || now > current.resetAt) {
    chatRateState.set(ip, {
      count: 1,
      resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS,
    });
    return next();
  }

  if (current.count >= CHAT_RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000)
    );
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: "Too many chat requests. Please try again later.",
    });
  }

  current.count += 1;
  return next();
}

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

router.post("/", enforceChatRateLimit, handleChat);
router.post("/stream", enforceChatRateLimit, handleChatStream);
router.get("/history/export", requireAdminKey, getChatHistoryExport);
router.get("/history", requireAdminKey, getChatHistory);
router.get("/analytics", requireAdminKey, getChatAnalytics);

module.exports = router;