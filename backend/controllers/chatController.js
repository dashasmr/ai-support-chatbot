const {
  generateAIResponse,
  generateAIStream,
} = require("../services/aiService");
const {
  createConversation,
  getConversationHistory,
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
    const rows = await getConversationHistory();
    return res.json({
      conversations: rows.map(mapConversationRow),
    });
  } catch (error) {
    console.error("History error:", error.message);
    return res.status(500).json({
      error: "Failed to load chat history.",
    });
  }
}

async function getChatAnalytics(req, res) {
  try {
    const analytics = await getAnalytics();

    return res.json({
      conversationCount: analytics.conversationCount,
      averagePairCount: analytics.averagePairCount,
      messagesToday: analytics.messagesToday,
      conversationsByHour: analytics.conversationsByHour,
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
  getChatAnalytics,
};