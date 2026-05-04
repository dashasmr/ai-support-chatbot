const pool = require("../db/pool");

async function createConversation({ userText, aiText, pairCount = 1 }) {
  const query = `
    INSERT INTO conversations (user_text, ai_text, pair_count)
    VALUES ($1, $2, $3)
    RETURNING id, user_text, ai_text, pair_count, created_at;
  `;

  const { rows } = await pool.query(query, [userText, aiText, pairCount]);
  return rows[0];
}

async function getConversationHistory() {
  const query = `
    SELECT
      id,
      user_text,
      ai_text,
      pair_count,
      created_at
    FROM conversations
    ORDER BY created_at DESC;
  `;

  const { rows } = await pool.query(query);
  return rows;
}

async function getAnalytics() {
  const [countResult, averageResult, todayResult, byHourResult, recentResult] =
    await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM conversations;"),
      pool.query(
        "SELECT COALESCE(ROUND(AVG(pair_count)::numeric, 2), 0) AS average_pair_count FROM conversations;"
      ),
      pool.query(
        "SELECT COUNT(*)::int AS count FROM conversations WHERE created_at >= date_trunc('day', NOW());"
      ),
      pool.query(`
        SELECT
          TO_CHAR(date_trunc('hour', created_at), 'HH24:00') AS hour,
          COUNT(*)::int AS count
        FROM conversations
        GROUP BY date_trunc('hour', created_at)
        ORDER BY date_trunc('hour', created_at) ASC;
      `),
      pool.query(`
        SELECT
          id,
          user_text,
          ai_text,
          pair_count,
          created_at
        FROM conversations
        ORDER BY created_at DESC
        LIMIT 10;
      `),
    ]);

  return {
    conversationCount: countResult.rows[0].count,
    averagePairCount: Number(averageResult.rows[0].average_pair_count),
    messagesToday: todayResult.rows[0].count,
    conversationsByHour: byHourResult.rows,
    recentConversations: recentResult.rows,
  };
}

module.exports = {
  createConversation,
  getConversationHistory,
  getAnalytics,
};
