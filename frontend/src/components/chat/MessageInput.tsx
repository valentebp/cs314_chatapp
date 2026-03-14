import { useState } from 'react';
import { useChat } from '../../context/ChatContext';

/**
 * Text input for composing and sending messages.
 * Disabled when no conversation is selected.
 * Submits on Enter (without Shift) or by clicking Send.
 */
const MessageInput = () => {
  const { selectedConversation, sendMessage } = useChat();
  const [text, setText] = useState('');
  const isDisabled = !selectedConversation;

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isDisabled) return;
    sendMessage(trimmed);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input">
      <textarea
        className="message-input__field"
        placeholder={isDisabled ? 'Select a conversation to start chatting' : 'Type a message...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isDisabled}
        rows={1}
        aria-label="Message input"
      />
      <button
        className="btn btn--primary message-input__send"
        onClick={handleSend}
        disabled={isDisabled || !text.trim()}
        aria-label="Send message"
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
