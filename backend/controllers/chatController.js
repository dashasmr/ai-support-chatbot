// Temporary in-memory storage for chat history
const conversations = [];

const { 
    generateAIResponse, 
    generateAIStream,
  } = require("../services/aiService");


async function handleChat(req, res) {
  try {
    const userMessage = req.body?.message;

    if (!userMessage) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    console.log("User message:", userMessage);

    const aiReply = await generateAIResponse(userMessage);

    conversations.push({ user: userMessage, ai: aiReply });
    
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
  const userMessage = req.body?.message;

  if (!userMessage) {
    return res.status(400).json({
      error: "Message is required",
    });
  }

  console.log("Streaming user message:", userMessage);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await generateAIStream(userMessage);

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        res.write(event.delta);
      }
    }

    res.end();
  } catch (error) {
    console.error("Streaming chat error:", error.message);
    res.write("Sorry, something went wrong while streaming the AI response.");
    res.end();
  }
}

module.exports = {
  handleChat,
  handleChatStream,
};