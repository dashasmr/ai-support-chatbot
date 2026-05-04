function ChatInput({ inputValue, onInputChange, onSendMessage, isLoading }) {
  return (
    <form className="chat-input-form" onSubmit={onSendMessage}>
      <input
        type="text"
        value={inputValue}
        onChange={onInputChange}
        placeholder="Type your message..."
        disabled={isLoading}
      />

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

export default ChatInput;