import { useState } from "react";
import MessageBubble from "./components/MessageBubble";
import ChatInput from "./components/ChatInput";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);

  async function handleSendMessage(event) {
    event.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    // Create user message
    const userMessage = {
      role: "user",
      text: inputValue,
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);

    setInputValue("");

    try {
      // Send message to backend
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
        }),
      });

      const data = await response.json();

      // Add AI response to chat
      const aiMessage = {
        role: "assistant",
        text: data.reply,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
      </div>
      <ChatInput
        inputValue={inputValue}
        onInputChange={(e) => setInputValue(e.target.value)}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}

export default App;