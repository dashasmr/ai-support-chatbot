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

async function getConversationHistory({ limit = 20, offset = 0, query = "" }) {
  const params = [];
  const whereParts = [];

  if (query) {
    params.push(`%${query}%`);
    whereParts.push(`(user_text ILIKE $${params.length} OR ai_text ILIKE $${params.length})`);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";

  params.push(limit);
  params.push(offset);

  const historySql = `
    SELECT
      id,
      user_text,
      ai_text,
      pair_count,
      created_at
    FROM conversations
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length - 1}
    OFFSET $${params.length};
  `;

  const countParams = query ? [`%${query}%`] : [];
  const countWhere = query ? "WHERE (user_text ILIKE $1 OR ai_text ILIKE $1)" : "";
  const countSql = `SELECT COUNT(*)::int AS count FROM conversations ${countWhere};`;

  const [historyResult, countResult] = await Promise.all([
    pool.query(historySql, params),
    pool.query(countSql, countParams),
  ]);

  return {
    rows: historyResult.rows,
    totalCount: countResult.rows[0].count,
  };
}

async function getConversationsForExport({ query = "", from, to, maxRows = 5000 }) {
  const params = [];
  const whereParts = [];

  if (query) {
    params.push(`%${query}%`);
    whereParts.push(`(user_text ILIKE $${params.length} OR ai_text ILIKE $${params.length})`);
  }

  if (from) {
    params.push(from);
    whereParts.push(`created_at >= $${params.length}::timestamptz`);
  }

  if (to) {
    params.push(to);
    whereParts.push(`created_at <= $${params.length}::timestamptz`);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const safeMax = Math.min(Math.max(Number(maxRows) || 5000, 1), 10000);
  params.push(safeMax);

  const sql = `
    SELECT
      id,
      user_text,
      ai_text,
      pair_count,
      created_at
    FROM conversations
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${params.length};
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}

async function getAnalytics({ from, to }) {
  const params = [];
  const whereParts = [];

  if (from) {
    params.push(from);
    whereParts.push(`created_at >= $${params.length}::timestamptz`);
  }

  if (to) {
    params.push(to);
    whereParts.push(`created_at <= $${params.length}::timestamptz`);
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
  const todayCountSql = `
    SELECT COUNT(*)::int AS count
    FROM conversations
    WHERE created_at >= date_trunc('day', NOW())
  `;

  const [countResult, averageResult, todayResult, byHourResult, byDayResult, recentResult] =
    await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM conversations ${whereClause};`, params),
      pool.query(
        `SELECT COALESCE(ROUND(AVG(pair_count)::numeric, 2), 0) AS average_pair_count
         FROM conversations ${whereClause};`,
        params
      ),
      pool.query(todayCountSql),
      pool.query(`
        SELECT
          TO_CHAR(date_trunc('hour', created_at), 'HH24:00') AS hour,
          COUNT(*)::int AS count
        FROM conversations
        ${whereClause}
        GROUP BY date_trunc('hour', created_at), TO_CHAR(date_trunc('hour', created_at), 'HH24:00')
        ORDER BY date_trunc('hour', created_at) ASC;
      `, params),
      pool.query(`
        SELECT
          TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
          COUNT(*)::int AS count
        FROM conversations
        ${whereClause}
        GROUP BY date_trunc('day', created_at), TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD')
        ORDER BY date_trunc('day', created_at) ASC;
      `, params),
      pool.query(`
        SELECT
          id,
          user_text,
          ai_text,
          pair_count,
          created_at
        FROM conversations
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT 10;
      `, params),
    ]);

  return {
    conversationCount: countResult.rows[0].count,
    averagePairCount: Number(averageResult.rows[0].average_pair_count),
    messagesToday: todayResult.rows[0].count,
    conversationsByHour: byHourResult.rows,
    conversationsByDay: byDayResult.rows,
    recentConversations: recentResult.rows,
  };
}

module.exports = {
  createConversation,
  getConversationHistory,
  getConversationsForExport,
  getAnalytics,
};
