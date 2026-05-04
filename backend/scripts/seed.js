const pool = require("../db/pool");

async function seedConversations() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM conversations;");

  if (rows[0].count > 0) {
    console.log("Seed skipped: conversations table already has data.");
    return;
  }

  const seedData = [
    {
      user: "Where is my order #1051?",
      ai: "Your order #1051 is in transit and should arrive tomorrow.",
    },
    {
      user: "How can I return a jacket?",
      ai: "You can start a return from your account orders page within 30 days.",
    },
    {
      user: "Do you offer weekend delivery?",
      ai: "Yes, weekend delivery is available in select areas at checkout.",
    },
  ];

  for (const item of seedData) {
    await pool.query(
      `
      INSERT INTO conversations (user_text, ai_text, pair_count)
      VALUES ($1, $2, $3);
      `,
      [item.user, item.ai, 1]
    );
  }

  console.log(`Seed completed: inserted ${seedData.length} conversations.`);
}

async function main() {
  try {
    await seedConversations();
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
