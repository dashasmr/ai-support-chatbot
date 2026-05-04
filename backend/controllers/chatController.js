const {
  generateAIResponse,
  generateAIStream,
} = require("../services/aiService");

// Temporary in-memory storage for chat history
const conversations = [];

function getChatHistory(req, res) {
  return res.json({
    conversations,
  });
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

    conversations.push({
      user: userMessage,
      ai: aiReply,
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

    conversations.push({
      user: userMessage,
      ai: fullReply,
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
};