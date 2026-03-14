import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConversationItem from '../src/components/conversations/ConversationItem';

const conv = {
  dmId: 'dm1',
  contact: { _id: 'u1', displayName: 'Alice', profilePic: null },
  lastMessage: { content: 'Hey!', createdAt: new Date().toISOString() },
};

describe('ConversationItem', () => {
  it('renders the contact display name', () => {
    render(<ConversationItem conversation={conv} isSelected={false} unreadCount={0} onClick={() => {}} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders the last message preview', () => {
    render(<ConversationItem conversation={conv} isSelected={false} unreadCount={0} onClick={() => {}} />);
    expect(screen.getByText('Hey!')).toBeInTheDocument();
  });

  it('applies selected class when isSelected is true', () => {
    const { container } = render(
      <ConversationItem conversation={conv} isSelected={true} unreadCount={0} onClick={() => {}} />
    );
    expect(container.firstChild).toHaveClass('conversation-item--selected');
  });

  it('does not apply selected class when isSelected is false', () => {
    const { container } = render(
      <ConversationItem conversation={conv} isSelected={false} unreadCount={0} onClick={() => {}} />
    );
    expect(container.firstChild).not.toHaveClass('conversation-item--selected');
  });

  it('renders unread badge when unreadCount > 0', () => {
    render(<ConversationItem conversation={conv} isSelected={false} unreadCount={3} onClick={() => {}} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not render unread badge when unreadCount is 0', () => {
    render(<ConversationItem conversation={conv} isSelected={false} unreadCount={0} onClick={() => {}} />);
    expect(document.querySelector('.conversation-item__badge')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(
      <ConversationItem conversation={conv} isSelected={false} unreadCount={0} onClick={handleClick} />
    );
    await user.click(screen.getByText('Alice'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows 99+ for unread counts over 99', () => {
    render(<ConversationItem conversation={conv} isSelected={false} unreadCount={150} onClick={() => {}} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});
