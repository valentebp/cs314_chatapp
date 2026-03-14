import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '../src/components/chat/MessageInput';

const mockSendMessage = jest.fn();

jest.mock('../src/context/ChatContext', () => ({
  useChat: jest.fn(),
}));

import { useChat } from '../src/context/ChatContext';

describe('MessageInput', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is disabled when no conversation is selected', () => {
    (useChat as jest.Mock).mockReturnValue({ selectedConversation: null, sendMessage: mockSendMessage });
    render(<MessageInput />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('is enabled when a conversation is selected', () => {
    (useChat as jest.Mock).mockReturnValue({
      selectedConversation: { dmId: 'dm1', contact: { _id: 'u1', displayName: 'Alice' } },
      sendMessage: mockSendMessage,
    });
    render(<MessageInput />);
    expect(screen.getByRole('textbox')).not.toBeDisabled();
  });

  it('calls sendMessage with the typed text when Send is clicked', async () => {
    (useChat as jest.Mock).mockReturnValue({
      selectedConversation: { dmId: 'dm1', contact: { _id: 'u1' } },
      sendMessage: mockSendMessage,
    });
    const user = userEvent.setup();
    render(<MessageInput />);
    await user.type(screen.getByRole('textbox'), 'Hello!');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(mockSendMessage).toHaveBeenCalledWith('Hello!');
  });

  it('clears the input after sending', async () => {
    (useChat as jest.Mock).mockReturnValue({
      selectedConversation: { dmId: 'dm1', contact: { _id: 'u1' } },
      sendMessage: mockSendMessage,
    });
    const user = userEvent.setup();
    render(<MessageInput />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(textarea).toHaveValue('');
  });

  it('does not call sendMessage when input is empty or whitespace-only', async () => {
    (useChat as jest.Mock).mockReturnValue({
      selectedConversation: { dmId: 'dm1', contact: { _id: 'u1' } },
      sendMessage: mockSendMessage,
    });
    const user = userEvent.setup();
    render(<MessageInput />);
    await user.type(screen.getByRole('textbox'), '   ');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('sends on Enter key press (without Shift)', async () => {
    (useChat as jest.Mock).mockReturnValue({
      selectedConversation: { dmId: 'dm1', contact: { _id: 'u1' } },
      sendMessage: mockSendMessage,
    });
    const user = userEvent.setup();
    render(<MessageInput />);
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello!');
    await user.keyboard('{Enter}');
    expect(mockSendMessage).toHaveBeenCalledWith('Hello!');
  });
});
