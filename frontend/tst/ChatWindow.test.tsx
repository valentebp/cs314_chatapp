import { render, screen } from '@testing-library/react';
import ChatWindow from '../src/components/chat/ChatWindow';

jest.mock('../src/context/ChatContext', () => ({
  useChat: jest.fn(),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1', displayName: 'Me' } }),
}));

import { useChat } from '../src/context/ChatContext';

const baseChat = {
  selectedConversation: null,
  messages: [],
  isLoadingMessages: false,
  messagesError: null,
  deleteConversation: jest.fn(),
  leaveConversation: jest.fn(),
};

describe('ChatWindow', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows empty state when no conversation is selected', () => {
    (useChat as jest.Mock).mockReturnValue(baseChat);
    render(<ChatWindow />);
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it('shows the contact name in the header when a conversation is selected', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: {
        dmId: 'dm1',
        creatorId: 'u1',
        contact: { _id: 'u2', displayName: 'Alice', profilePic: null },
      },
    });
    render(<ChatWindow />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows a loading spinner when messages are loading', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: { dmId: 'dm1', creatorId: 'u1', contact: { _id: 'u2', displayName: 'Alice' } },
      isLoadingMessages: true,
    });
    render(<ChatWindow />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders a message from the messages array', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: { dmId: 'dm1', creatorId: 'u1', contact: { _id: 'u2', displayName: 'Alice' } },
      messages: [
        {
          _id: 'msg1',
          senderId: 'u2',
          content: 'Hi there!',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    render(<ChatWindow />);
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('disables the Delete button when dmId is null (new conversation)', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: { dmId: null, creatorId: 'u1', contact: { _id: 'u2', displayName: 'Alice' } },
    });
    render(<ChatWindow />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
  });

  it('shows Leave button when user is not the creator', () => {
    (useChat as jest.Mock).mockReturnValue({
      ...baseChat,
      selectedConversation: { dmId: 'dm1', creatorId: 'u2', contact: { _id: 'u2', displayName: 'Alice' } },
    });
    render(<ChatWindow />);
    expect(screen.getByRole('button', { name: /leave/i })).toBeInTheDocument();
  });
});
