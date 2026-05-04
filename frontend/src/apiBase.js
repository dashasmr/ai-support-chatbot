/**
 * Base URL for the Express API (no trailing slash).
 * Set VITE_API_URL in frontend/.env — required for production builds.
 */
const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE_URL = String(raw).replace(/\/$/, "");
