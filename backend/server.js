const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const chatRoutes = require("./routes/chatRoutes");
const pool = require("./db/pool");

function parseAllowedOrigins() {
  const raw = process.env.FRONTEND_URL;
  if (raw && raw.trim()) {
    return raw
      .split(",")
      .map((part) => normalizeOrigin(part))
      .filter(Boolean);
  }
  return [
    normalizeOrigin("http://localhost:5173"),
    normalizeOrigin("http://127.0.0.1:5173"),
    normalizeOrigin("http://localhost:4173"),
    normalizeOrigin("http://127.0.0.1:4173"),
  ];
}

function normalizeOrigin(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

function extractHostname(value) {
  const normalized = normalizeOrigin(value);
  if (!normalized) return "";
  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    try {
      return new URL(`https://${normalized}`).hostname.toLowerCase();
    } catch {
      return normalized.replace(/^https?:\/\//, "").split("/")[0];
    }
  }
}

function isOriginAllowed(origin) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return true;

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  const originHost = extractHostname(normalizedOrigin);
  if (!originHost) return false;

  // Allow exact host match even when FRONTEND_URL is entered without protocol.
  const hostMatches = allowedOrigins.some((candidate) => {
    const candidateHost = extractHostname(candidate);
    return candidateHost && candidateHost === originHost;
  });
  if (hostMatches) return true;

  // Convenience for Vercel previews in portfolio deployments.
  if (originHost.endsWith(".vercel.app")) {
    return true;
  }

  return false;
}

const allowedOrigins = parseAllowedOrigins();

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "AI Customer Support Backend is running",
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, database: "connected" });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      database: "error",
      error: error.message,
    });
  }
});

app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});