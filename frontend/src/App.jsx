import { useState, useRef, useEffect } from "react";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("chatMessages");

    if (savedMessages) {
      return JSON.parse(savedMessages);
    }

    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

 async function handleSendMessage(event) {
  event.preventDefault();

  if (!inputValue.trim()) {
    return;
  }

  const userMessage = {
    role: "user",
    text: inputValue,
  };

  setMessages((prev) => [...prev, userMessage]);
  setInputValue("");
  setIsLoading(true);

  const aiMessage = {
    role: "assistant",
    text: "",
  };

  setMessages((prev) => [...prev, aiMessage]);

  try {
    const response = await fetch("http://localhost:5000/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [...messages, userMessage],
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let finished = false;

    while (!finished) {
      const { value, done } = await reader.read();

      finished = done;

      const chunk = decoder.decode(value);

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

    const errorMessage = {
      role: "assistant",
      text: "Sorry, something went wrong. Please try again.",
    };

    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setIsLoading(false);
  }
}
  return (
    <main className="app">
      <section className="chat-container">
        <header className="chat-header">
          <h1>AI Customer Support</h1>
          <p>Ask about orders, delivery, returns, or general support.</p>
        </header>

        <div className="messages">
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}

          <div ref={messagesEndRef} />
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