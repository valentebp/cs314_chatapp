import { render, screen } from '@testing-library/react';
import MessageBubble from '../src/components/chat/MessageBubble';

const baseMessage = {
  _id: 'msg1',
  senderId: 'user-abc',
  content: 'Hello there!',
  createdAt: '2025-01-15T14:30:00.000Z',
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
});
