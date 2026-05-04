CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  user_text TEXT NOT NULL,
  ai_text TEXT NOT NULL,
  pair_count INTEGER NOT NULL DEFAULT 1 CHECK (pair_count >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
