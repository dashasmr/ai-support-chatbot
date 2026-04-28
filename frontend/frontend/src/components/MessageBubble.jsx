function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={isUser ? "message user-message" : "message ai-message"}>
      {message.text}
    </div>
  );
}

export default MessageBubble;