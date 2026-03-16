import { render, screen } from '@testing-library/react';
import MemberListModal from '../src/components/conversations/MemberListModal';

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', displayName: 'Me' } }),
}));

const mockChat = {
  kickMember: jest.fn(),
};

jest.mock('../src/context/ChatContext', () => ({
  useChat: () => mockChat,
}));

jest.mock('../src/components/profile/AvatarDisplay', () => () => <div data-testid="avatar" />);

const mockConversation = {
  dmId: 'grp1',
  creatorId: 'u1',
  members: [
    { _id: 'u1', displayName: 'Me' },
    { _id: 'u2', displayName: 'Alice' },
    { _id: 'u3', displayName: 'Bob' },
  ],
};

describe('MemberListModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('renders a list of members', () => {
    render(<MemberListModal conversation={mockConversation} onClose={() => {}} />);
    expect(screen.getByText(/Group Members/i)).toBeInTheDocument();
    expect(screen.getByText('Me (You)')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows Kick buttons for leader on other members', () => {
    render(<MemberListModal conversation={mockConversation} onClose={() => {}} />);
    // creatorId is 'u1' (Me)
    expect(screen.getByRole('button', { name: /kick alice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /kick bob/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /kick me/i })).not.toBeInTheDocument();
  });

  it('does not show Kick buttons if user is not leader', () => {
    const nonLeaderConversation = { ...mockConversation, creatorId: 'u99' };
    render(<MemberListModal conversation={nonLeaderConversation} onClose={() => {}} />);
    expect(screen.queryByRole('button', { name: /kick alice/i })).not.toBeInTheDocument();
  });

  it('calls kickMember when Kick button is clicked', async () => {
    const { fireEvent } = require('@testing-library/react');
    render(<MemberListModal conversation={mockConversation} onClose={() => {}} />);
    const kickBtn = screen.getByRole('button', { name: /kick alice/i });
    fireEvent.click(kickBtn);
    expect(window.confirm).toHaveBeenCalled();
    expect(mockChat.kickMember).toHaveBeenCalledWith('grp1', 'u2', 'Alice');
  });

  it('shows empty message when no members', () => {
    render(<MemberListModal conversation={{ ...mockConversation, members: [] }} onClose={() => {}} />);
    expect(screen.getByText(/No members found/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const { fireEvent } = require('@testing-library/react');
    const onClose = jest.fn();
    render(<MemberListModal conversation={mockConversation} onClose={onClose} />);
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
