import { render, screen } from '@testing-library/react';
import MessageBubble from '../src/components/chat/MessageBubble';

const baseMessage = {
  _id: 'msg1',
  senderId: 'user-abc',
  content: 'Hello there!',
  timestamp: '2025-01-15T14:30:00.000Z',
};

describe('MessageBubble', () => {
  it('renders the message text', () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('applies own-bubble class when isOwn is true', () => {
    const { container } = render(<MessageBubble message={baseMessage} isOwn={true} />);
    expect(container.firstChild).toHaveClass('message-bubble--own');
  });

  it('applies other-bubble class when isOwn is false', () => {
    const { container } = render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(container.firstChild).toHaveClass('message-bubble--other');
  });

  it('renders a timestamp element', () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(document.querySelector('.message-bubble__time')).toBeInTheDocument();
  });

  it('shows a pending indicator when message.pending is true', () => {
    const pendingMsg = { ...baseMessage, pending: true };
    const { container } = render(<MessageBubble message={pendingMsg} isOwn={true} />);
    expect(container.querySelector('.message-bubble__pending')).toBeInTheDocument();
  });

  it('does not show pending indicator for delivered messages', () => {
    const { container } = render(<MessageBubble message={baseMessage} isOwn={true} />);
    expect(container.querySelector('.message-bubble__pending')).not.toBeInTheDocument();
  });

  it('adds block-start class when isFirstInBlock is true', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwn={false} isFirstInBlock={true} />
    );
    expect(container.firstChild).toHaveClass('message-bubble--block-start');
  });

  it('does not add block-start class when isFirstInBlock is false', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwn={false} isFirstInBlock={false} />
    );
    expect(container.firstChild).not.toHaveClass('message-bubble--block-start');
  });

  it('renders avatar when senderName is provided and showAvatar is true', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwn={false} senderName="Alice" showAvatar={true} />
    );
    expect(container.querySelector('.message-bubble__avatar')).toBeInTheDocument();
    expect(container.querySelector('.message-bubble__avatar-spacer')).not.toBeInTheDocument();
  });

  it('renders a spacer (not avatar) when senderName is provided and showAvatar is false', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwn={false} senderName="Alice" showAvatar={false} />
    );
    expect(container.querySelector('.message-bubble__avatar-spacer')).toBeInTheDocument();
    expect(container.querySelector('.message-bubble__avatar')).not.toBeInTheDocument();
  });

  it('renders no avatar slot when senderName is null (DM or own message)', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwn={false} senderName={null} />
    );
    expect(container.querySelector('.message-bubble__avatar')).not.toBeInTheDocument();
    expect(container.querySelector('.message-bubble__avatar-spacer')).not.toBeInTheDocument();
  });

  it('renders no avatar slot for own messages even when senderName is provided', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isOwn={true} senderName="Me" showAvatar={true} />
    );
    expect(container.querySelector('.message-bubble__avatar')).not.toBeInTheDocument();
  });
});
