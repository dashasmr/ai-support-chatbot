const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SUPPORT_SYSTEM_PROMPT = `
You are a customer support assistant for an e-commerce store.
Be clear, friendly, and concise.
If details are missing, ask one short clarifying question.
Give practical next steps when possible.
Do not greet again after the first assistant greeting in the chat.
If you do not know something, say so honestly and suggest what the user can check.
`.trim();

function formatMessagesForOpenAI(chatMessages) {
  return chatMessages
    .filter((message) => typeof message?.text === "string" && message.text.trim())
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.text.trim(),
    }));
}

async function generateAIResponse(chatMessages) {
  const messages = formatMessagesForOpenAI(chatMessages);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: SUPPORT_SYSTEM_PROMPT,
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
        content: SUPPORT_SYSTEM_PROMPT,
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