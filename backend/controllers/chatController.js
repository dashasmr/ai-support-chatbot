const {
  generateAIResponse,
  generateAIStream,
} = require("../services/aiService");
const {
  createConversation,
  getConversationHistory,
  getConversationsForExport,
  getAnalytics,
} = require("../repositories/conversationRepository");

function mapConversationRow(row) {
  return {
    id: row.id,
    user: row.user_text,
    ai: row.ai_text,
    pairCount: row.pair_count,
    createdAt: row.created_at,
  };
}

async function getChatHistory(req, res) {
  try {
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);
    const offset = Math.max(Number.parseInt(req.query.offset, 10) || 0, 0);
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    const result = await getConversationHistory({ limit, offset, query });

    return res.json({
      conversations: result.rows.map(mapConversationRow),
      pagination: {
        limit,
        offset,
        total: result.totalCount,
        hasMore: offset + limit < result.totalCount,
      },
    });
  } catch (error) {
    console.error("History error:", error.message);
    return res.status(500).json({
      error: "Failed to load chat history.",
    });
  }
}

function formatCsvCell(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function escapeCsvField(value) {
  const text = formatCsvCell(value);
  return `"${text.replace(/"/g, '""')}"`;
}

async function getChatHistoryExport(req, res) {
  try {
    const query = typeof req.query.query === "string" ? req.query.query.trim() : "";
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const maxRows = Math.min(Number.parseInt(req.query.max, 10) || 5000, 10000);

    const rows = await getConversationsForExport({ query, from, to, maxRows });
    const header = ["id", "user_text", "ai_text", "pair_count", "created_at"]
      .map(escapeCsvField)
      .join(",");
    const body = rows
      .map((row) =>
        [row.id, row.user_text, row.ai_text, row.pair_count, row.created_at].map(escapeCsvField).join(",")
      )
      .join("\r\n");
    const csv = `\uFEFF${header}\r\n${body}`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="conversations-export.csv"');
    return res.send(csv);
  } catch (error) {
    console.error("History export error:", error.message);
    return res.status(500).json({
      error: "Failed to export chat history.",
    });
  }
}

async function getChatAnalytics(req, res) {
  try {
    const from = typeof req.query.from === "string" ? req.query.from : undefined;
    const to = typeof req.query.to === "string" ? req.query.to : undefined;
    const analytics = await getAnalytics({ from, to });

    return res.json({
      conversationCount: analytics.conversationCount,
      averagePairCount: analytics.averagePairCount,
      messagesToday: analytics.messagesToday,
      conversationsByHour: analytics.conversationsByHour,
      conversationsByDay: analytics.conversationsByDay,
      recentConversations: analytics.recentConversations.map(mapConversationRow),
    });
  } catch (error) {
    console.error("Analytics error:", error.message);
    return res.status(500).json({
      error: "Failed to load analytics.",
    });
  }
}

async function handleChat(req, res) {
  try {
    const chatMessages = req.body?.messages;

    if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
      return res.status(400).json({
        error: "Messages are required",
      });
    }

    const userMessage = chatMessages[chatMessages.length - 1].text;
    console.log("User message:", userMessage);

    const aiReply = await generateAIResponse(chatMessages);

    await createConversation({
      userText: userMessage,
      aiText: aiReply,
      pairCount: 1,
    });

    return res.json({
      reply: aiReply,
    });
  } catch (error) {
    console.error("Chat error:", error.message);

    return res.status(500).json({
      error: "Something went wrong while generating the AI response",
    });
  }
}

async function handleChatStream(req, res) {
  const chatMessages = req.body?.messages;
  const isValidMessages =
    Array.isArray(chatMessages) &&
    chatMessages.length > 0 &&
    chatMessages.every((message) => typeof message?.text === "string");

  if (!isValidMessages) {
    return res.status(400).json({
      error: "Messages are required",
    });
  }

  const userMessage = chatMessages[chatMessages.length - 1].text;
  console.log("Streaming user message:", userMessage);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await generateAIStream(chatMessages);
    let fullReply = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        res.write(delta);
        fullReply += delta;
      }
    }

    await createConversation({
      userText: userMessage,
      aiText: fullReply,
      pairCount: 1,
    });

    res.end();
  } catch (error) {
    console.error("Streaming chat error:", error.message);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Sorry, something went wrong while streaming the AI response.",
      });
    }
    res.write("Sorry, something went wrong while streaming the AI response.");
    return res.end();
  }
}

module.exports = {
  handleChat,
  handleChatStream,
  getChatHistory,
  getChatHistoryExport,
  getChatAnalytics,
};