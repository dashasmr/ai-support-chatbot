const { generateAIResponse } = require("../services/aiService");

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

module.exports = {
  handleChat,
};