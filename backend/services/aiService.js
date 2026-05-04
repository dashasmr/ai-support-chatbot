const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function formatMessagesForOpenAI(chatMessages) {
  return chatMessages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.text,
  }));
}

async function generateAIResponse(chatMessages) {
  const messages = formatMessagesForOpenAI(chatMessages);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful customer support assistant. Answer clearly and politely. Do not greet the user again if the conversation has already started.",
      },
      ...messages,
    ],
  });

  return response.choices[0].message.content;
}

async function generateAIStream(chatMessages) {
  const messages = formatMessagesForOpenAI(chatMessages);

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful customer support assistant. Answer clearly and politely. Do not greet the user again if the conversation has already started.",
      },
      ...messages,
    ],
    stream: true,
  });

  return stream;
}

module.exports = {
  generateAIResponse,
  generateAIStream,
};