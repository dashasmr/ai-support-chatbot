function ChatInput({ inputValue, onInputChange, onSendMessage }) {
  return (
    <form className="chat-input-form" onSubmit={onSendMessage}>
      <input
        type="text"
        value={inputValue}
        onChange={onInputChange}
        placeholder="Type your message..."
      />

      <button type="submit">Send</button>
    </form>
  );
}

export default ChatInput;