import { useState, useRef, useEffect } from "react";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";

const INITIAL_ASSISTANT_MESSAGE = {
  role: "assistant",
  text: "Hi! I’m your AI support assistant. How can I help you today?",
};

const QUICK_REPLIES = [
  "Where is my order?",
  "How can I return an item?",
  "What are the delivery options?",
  "I need help with a refund.",
];

function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");

    if (savedMessages) {
      return JSON.parse(savedMessages);
    }

    return [INITIAL_ASSISTANT_MESSAGE];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    messagesRef.current = messages;
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

 async function sendMessage(rawText) {
  const messageText = rawText.trim();
  if (!messageText || isLoading) {
    return;
  }

  const userMessage = {
    role: "user",
    text: messageText,
  };

  setMessages((prev) => [...prev, userMessage, { role: "assistant", text: "" }]);
  setInputValue("");
  setIsLoading(true);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch("http://localhost:5000/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [...messagesRef.current, userMessage],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorText = "Request failed";
      try {
        const payload = await response.json();
        errorText = payload.error || errorText;
      } catch {
        errorText = await response.text();
      }
      throw new Error(errorText || "Request failed");
    }

    if (!response.body) {
      throw new Error("Streaming is not available right now.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let finished = false;

    while (!finished) {
      const { value, done } = await reader.read();
      finished = done;
      const chunk = decoder.decode(value || new Uint8Array(), {
        stream: !done,
      });

      if (!chunk) {
        continue;
      }

      setMessages((prev) => {
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];

        updatedMessages[updatedMessages.length - 1] = {
          ...lastMessage,
          text: lastMessage.text + chunk,
        };

        return updatedMessages;
      });
    }
  } catch (error) {
    console.error("Error:", error);
    const fallbackText =
      error?.name === "AbortError"
        ? "The request timed out. Please try again."
        : "Sorry, something went wrong. Please try again.";

    setMessages((prev) => {
      const updatedMessages = [...prev];
      const lastMessage = updatedMessages[updatedMessages.length - 1];

      if (lastMessage?.role === "assistant" && !lastMessage.text) {
        updatedMessages[updatedMessages.length - 1] = {
          role: "assistant",
          text: fallbackText,
        };
        return updatedMessages;
      }

      return [...updatedMessages, { role: "assistant", text: fallbackText }];
    });
  } finally {
    clearTimeout(timeoutId);
    setIsLoading(false);
  }
}

 function handleSendMessage(event) {
  event.preventDefault();
  sendMessage(inputValue);
}

 function handleQuickReply(reply) {
  sendMessage(reply);
}

function handleClearChat() {
  setMessages([INITIAL_ASSISTANT_MESSAGE]);
  localStorage.removeItem("chatMessages");
}

  return (
    <main className="app">
      <section className="chat-container">
        <header className="chat-header">
          <div className="chat-header-content">
            <h1>AI Customer Support</h1>
            <p>Ask about orders, delivery, returns, or general support.</p>
          </div>
          <button onClick={handleClearChat} className="clear-chat-button">
            Clear Chat
          </button>
        </header>

        <div className="messages">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          <div ref={messagesEndRef} />
        </div>

        <div className="quick-replies">
          <span className="quick-replies-label">Quick prompts:</span>
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              className="quick-reply-button"
              onClick={() => handleQuickReply(reply)}
              disabled={isLoading}
            >
              {reply}
            </button>
          ))}
        </div>

        <ChatInput
          inputValue={inputValue}
          onInputChange={(e) => setInputValue(e.target.value)}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </section>
    </main>
  );
}

export default App;