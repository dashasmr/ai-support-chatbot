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
  const [viewMode, setViewMode] = useState("chat");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");

    if (savedMessages) {
      return JSON.parse(savedMessages);
    }

    return [INITIAL_ASSISTANT_MESSAGE];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [adminError, setAdminError] = useState("");
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    if (viewMode !== "chat") {
      return;
    }
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading, viewMode]);

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

  async function loadAdminData() {
    if (!adminKey.trim()) {
      setAdminError("Please enter admin key.");
      return;
    }

    setIsAdminLoading(true);
    setAdminError("");

    try {
      const headers = { "x-admin-key": adminKey.trim() };
      const [analyticsResponse, historyResponse] = await Promise.all([
        fetch("http://localhost:5000/api/chat/analytics", { headers }),
        fetch("http://localhost:5000/api/chat/history", { headers }),
      ]);

      const analyticsPayload = await analyticsResponse.json();
      const historyPayload = await historyResponse.json();

      if (!analyticsResponse.ok) {
        throw new Error(analyticsPayload.error || "Failed to load analytics.");
      }

      if (!historyResponse.ok) {
        throw new Error(historyPayload.error || "Failed to load history.");
      }

      setAnalytics(analyticsPayload);
      setHistory(historyPayload.conversations || []);
    } catch (error) {
      setAdminError(error.message || "Failed to load admin data.");
    } finally {
      setIsAdminLoading(false);
    }
  }

  return (
    <main className="app">
      <section className="chat-container">
        <header className="chat-header">
          <div className="chat-header-content">
            <h1>{viewMode === "chat" ? "AI Customer Support" : "Admin Dashboard"}</h1>
            <p>
              {viewMode === "chat"
                ? "Ask about orders, delivery, returns, or general support."
                : "Review conversation stats and latest chat history."}
            </p>
          </div>
          <div className="header-actions">
            <div className="mode-switch">
              <button
                type="button"
                className={viewMode === "chat" ? "mode-button active" : "mode-button"}
                onClick={() => setViewMode("chat")}
              >
                Chat
              </button>
              <button
                type="button"
                className={viewMode === "admin" ? "mode-button active" : "mode-button"}
                onClick={() => setViewMode("admin")}
              >
                Admin
              </button>
            </div>
            {viewMode === "chat" && (
              <button onClick={handleClearChat} className="clear-chat-button">
                Clear Chat
              </button>
            )}
          </div>
        </header>

        {viewMode === "chat" ? (
          <>
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
          </>
        ) : (
          <section className="admin-view">
            <div className="admin-toolbar">
              <input
                type="password"
                placeholder="Enter x-admin-key"
                value={adminKey}
                onChange={(event) => setAdminKey(event.target.value)}
              />
              <button type="button" onClick={loadAdminData} disabled={isAdminLoading}>
                {isAdminLoading ? "Loading..." : "Load analytics"}
              </button>
            </div>

            {adminError && <p className="admin-error">{adminError}</p>}

            <div className="analytics-grid">
              <article className="stat-card">
                <p>Total conversations</p>
                <strong>{analytics?.conversationCount ?? 0}</strong>
              </article>
              <article className="stat-card">
                <p>Average pair count</p>
                <strong>{analytics?.averagePairCount ?? 0}</strong>
              </article>
              <article className="stat-card">
                <p>Messages today</p>
                <strong>{analytics?.messagesToday ?? 0}</strong>
              </article>
            </div>

            <div className="admin-lists">
              <div className="list-card">
                <h3>Conversations by hour</h3>
                {analytics?.conversationsByHour?.length ? (
                  <ul>
                    {analytics.conversationsByHour.map((item) => (
                      <li key={item.hour}>
                        <span>{item.hour}</span>
                        <strong>{item.count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No data yet.</p>
                )}
              </div>

              <div className="list-card">
                <h3>Recent conversations</h3>
                {history.length ? (
                  <ul className="recent-list">
                    {history.slice(0, 10).map((item, index) => (
                      <li key={`${item.createdAt || "no-date"}-${index}`}>
                        <p>
                          <strong>User:</strong> {item.user}
                        </p>
                        <p>
                          <strong>AI:</strong> {item.ai}
                        </p>
                        <small>
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString()
                            : "No timestamp"}
                        </small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-state">No conversations yet.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;