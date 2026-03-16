import { render, screen } from '@testing-library/react';
import MessageList from '../src/components/chat/MessageList';

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', firstName: 'Me' } }),
}));

const makeMsg = (id, senderId, content, extra = {}) => ({
  _id: id,
  senderId,
  content,
  timestamp: '2025-01-15T14:30:00.000Z',
  ...extra,
});

describe('MessageList', () => {
  it('shows loading spinner when isLoading is true', () => {
    render(<MessageList messages={[]} isLoading={true} error={null} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error message when error is provided', () => {
    render(<MessageList messages={[]} isLoading={false} error="Something went wrong" />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no messages', () => {
    render(<MessageList messages={[]} isLoading={false} error={null} />);
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('renders a regular message as a bubble', () => {
    const messages = [makeMsg('m1', 'u2', 'Hey!')];
    render(<MessageList messages={messages} isLoading={false} error={null} />);
    expect(screen.getByText('Hey!')).toBeInTheDocument();
  });

  it('renders a leave notice as a system notice, not a bubble', () => {
    const messages = [makeMsg('m1', 'u2', 'Alice has left the conversation.')];
    const { container } = render(<MessageList messages={messages} isLoading={false} error={null} />);
    expect(screen.getByText('Alice has left the conversation.')).toBeInTheDocument();
    expect(container.querySelector('.message-system-notice')).toBeInTheDocument();
    expect(container.querySelector('.message-bubble')).not.toBeInTheDocument();
  });

  it('renders a join notice as a system notice', () => {
    const messages = [makeMsg('m1', 'u2', 'Bob has been added to the group.')];
    const { container } = render(<MessageList messages={messages} isLoading={false} error={null} />);
    expect(container.querySelector('.message-system-notice')).toBeInTheDocument();
    expect(container.querySelector('.message-bubble')).not.toBeInTheDocument();
  });

  it('renders group-leave notice as system notice', () => {
    const messages = [makeMsg('m1', 'u2', 'Alice has left the group.')];
    const { container } = render(<MessageList messages={messages} isLoading={false} error={null} />);
    expect(container.querySelector('.message-system-notice')).toBeInTheDocument();
  });

  it('shows avatar only on the last bubble of a consecutive run', () => {
    const members = [{ _id: 'u2', displayName: 'Alice' }];
    const messages = [
      makeMsg('m1', 'u2', 'First'),
      makeMsg('m2', 'u2', 'Second'),
      makeMsg('m3', 'u2', 'Third'),
    ];
    const { container } = render(
      <MessageList messages={messages} isLoading={false} error={null} isGroup={true} members={members} />
    );
    const avatars = container.querySelectorAll('.message-bubble__avatar');
    const spacers = container.querySelectorAll('.message-bubble__avatar-spacer');
    // Only one avatar (last in run), two spacers for the earlier bubbles.
    expect(avatars).toHaveLength(1);
    expect(spacers).toHaveLength(2);
  });

  it('adds block-start spacing between messages from different senders', () => {
    const members = [
      { _id: 'u2', displayName: 'Alice' },
      { _id: 'u3', displayName: 'Bob' },
    ];
    const messages = [
      makeMsg('m1', 'u2', 'Hi'),
      makeMsg('m2', 'u3', 'Hey'),
    ];
    const { container } = render(
      <MessageList messages={messages} isLoading={false} error={null} isGroup={true} members={members} />
    );
    const blockStarts = container.querySelectorAll('.message-bubble--block-start');
    expect(blockStarts.length).toBeGreaterThan(0);
  });
});
