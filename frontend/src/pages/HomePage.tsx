import Sidebar from '../components/conversations/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useChat } from '../context/ChatContext';

/**
 * The main application screen shown after login.
 * Layout: sidebar on the left, chat window on the right.
 * On mobile, only one panel is visible at a time.
 */
const HomePage = () => {
  const { selectedConversation } = useChat();

  return (
    <div className={`home-layout${selectedConversation ? ' home-layout--chat-open' : ''}`}>
      <Sidebar />
      <main className="home-layout__main">
        <ChatWindow />
      </main>
    </div>
  );
};

export default HomePage;
