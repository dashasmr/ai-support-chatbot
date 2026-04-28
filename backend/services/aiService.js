const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateAIResponse(userMessage) {
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: `You are a helpful customer support assistant. Answer clearly and politely.

User message: ${userMessage}`,
  });

  return response.output_text;
}

module.exports = {
  generateAIResponse,
};