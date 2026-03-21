import { ChatProvider, useChat } from './context/ChatContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { motion, AnimatePresence } from 'motion/react';

function ChatApp() {
  const { currentUser, activeChat } = useChat();

  return (
    <div className="h-screen w-screen overflow-hidden flex items-center justify-center p-0 md:p-8">
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <Login key="login" />
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full max-w-7xl flex shadow-2xl rounded-3xl overflow-hidden border border-white/10"
          >
            <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 h-full`}>
              <Sidebar />
            </div>
            <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 h-full`}>
              <ChatArea />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <ChatApp />
    </ChatProvider>
  );
}
