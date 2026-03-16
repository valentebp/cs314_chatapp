import { render, screen } from '@testing-library/react';
import ChatWindow from '../src/components/chat/ChatWindow';

jest.mock('../src/context/ChatContext', () => ({
  useChat: jest.fn(),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', displayName: 'Me' } }),
}));

jest.mock('../src/components/conversations/AddMemberModal', () => () => <div data-testid="add-member-modal" />);
jest.mock('../src/components/conversations/MemberListModal', () => () => <div data-testid="member-list-modal" />);

import { useChat } from '../src/context/ChatContext';

const baseChat = {
  selectedConversation: null,
  messages: [],
  isLoadingMessages: false,
  messagesError: null,
  leaveConversation: jest.fn(),
};

const dmConversation = {
  dmId: 'dm1',
  type: 'dm',
  contact: { _id: 'u2', displayName: 'Alice', profilePic: null },
};

const groupConversation = {
  dmId: 'grp1',
  type: 'group',
  groupName: 'Study Group',
  members: [
    { _id: 'u1', displayName: 'Me' },
    { _id: 'u2', displayName: 'Alice' },
  ],
};

describe('ChatWindow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows empty state when no conversation is selected', () => {
    (useChat as jest.Mock).mockReturnValue(baseChat);
    render(<ChatWindow />);
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it('shows the contact name in the header for a DM', () => {
    (useChat as jest.Mock).mockReturnValue({ ...baseChat, selectedConversation: dmConversation });
    render(<ChatWindow />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows the group name in the header for a group', () => {
    (useChat as jest.Mock).mockReturnValue({ ...baseChat, selectedConversation: groupConversation });
    render(<ChatWindow />);
    expect(screen.getByText('Study Group')).toBeInTheDocument();
  });

  it('shows member count for group conversations', () => {
    (useChat as jest.Mock).mockReturnValue({ ...baseChat, selectedConversation: groupConversation });
    render(<ChatWindow />);
    expect(screen.getByText(/2 members/i)).toBeInTheDocument();
  });

  it('shows a loading spinner when messages are loading', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: dmConversation,
      isLoadingMessages: true,
    });
    render(<ChatWindow />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders a message from the messages array', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: dmConversation,
      messages: [{ _id: 'msg1', senderId: 'u2', content: 'Hi there!', timestamp: new Date().toISOString() }],
    });
    render(<ChatWindow />);
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('Leave button is always shown when a conversation is selected', () => {
    (useChat as jest.Mock).mockReturnValue({ ...baseChat, selectedConversation: dmConversation });
    render(<ChatWindow />);
    expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
  });

  it('Leave button is disabled when dmId is null', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: { ...dmConversation, dmId: null },
    });
    render(<ChatWindow />);
    expect(screen.getByRole('button', { name: /leave/i })).toBeDisabled();
  });

  it('shows Add button for group conversations', () => {
    (useChat as jest.Mock).mockReturnValue({ ...baseChat, selectedConversation: groupConversation });
    render(<ChatWindow />);
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
  });

  it('does not show Add button for DM conversations', () => {
    (useChat as jest.Mock).mockReturnValue({ ...baseChat, selectedConversation: dmConversation });
    render(<ChatWindow />);
    expect(screen.queryByRole('button', { name: /add member/i })).not.toBeInTheDocument();
  });

  it('shows member list modal when group name is clicked', () => {
    const { fireEvent } = require('@testing-library/react');
    (useChat as jest.Mock).mockReturnValue({ ...baseChat, selectedConversation: groupConversation });
    render(<ChatWindow />);
    const groupNameBtn = screen.getByRole('button', { name: /view group members/i });
    fireEvent.click(groupNameBtn);
    expect(screen.getByTestId('member-list-modal')).toBeInTheDocument();
  });
});
