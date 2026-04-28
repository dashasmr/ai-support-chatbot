async function handleChat(req, res) {
  const userMessage = req.body?.message;

  if (!userMessage) {
    return res.status(400).json({
      error: "Message is required",
    });
  }

  console.log("User message:", userMessage);

  // Temporary response until AI integration is added
  return res.json({
    reply: "This is a fake AI response",
  });
}

module.exports = {
  handleChat,
};