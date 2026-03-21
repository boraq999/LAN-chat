import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id?: number;
  sender: string;
  receiver: string;
  content: string;
  type: 'text' | 'file';
  timestamp: string;
}

interface User {
  username: string;
  last_seen: string;
}

interface ChatContextType {
  socket: Socket | null;
  currentUser: string | null;
  setCurrentUser: (user: string) => void;
  onlineUsers: string[];
  allUsers: User[];
  messages: Message[];
  activeChat: string | null; // 'all' or username
  setActiveChat: (chat: string | null) => void;
  sendMessage: (content: string, type?: 'text' | 'file') => void;
  isTyping: Record<string, boolean>;
  setTyping: (isTyping: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('chat_username'));
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    if (currentUser) {
      newSocket.emit('join', currentUser);
    }

    newSocket.on('user-status', (data: { allUsers: User[], onlineUsers: string[] }) => {
      setAllUsers(data.allUsers);
      setOnlineUsers(data.onlineUsers);
    });

    newSocket.on('receive-msg', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('typing', (data: { sender: string, receiver: string }) => {
      if (data.receiver === currentUser || data.receiver === 'all') {
        setIsTyping(prev => ({ ...prev, [data.sender]: true }));
      }
    });

    newSocket.on('stop-typing', (data: { sender: string, receiver: string }) => {
      setIsTyping(prev => ({ ...prev, [data.sender]: false }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && activeChat) {
      fetch(`/api/messages/${currentUser}/${activeChat}`)
        .then(res => res.json())
        .then(data => setMessages(data));
    }
  }, [currentUser, activeChat]);

  const sendMessage = useCallback((content: string, type: 'text' | 'file' = 'text') => {
    if (socket && currentUser && activeChat) {
      socket.emit('send-msg', {
        sender: currentUser,
        receiver: activeChat,
        content,
        type
      });
    }
  }, [socket, currentUser, activeChat]);

  const setTyping = useCallback((typing: boolean) => {
    if (socket && currentUser && activeChat) {
      socket.emit(typing ? 'typing' : 'stop-typing', {
        sender: currentUser,
        receiver: activeChat
      });
    }
  }, [socket, currentUser, activeChat]);

  return (
    <ChatContext.Provider value={{
      socket,
      currentUser,
      setCurrentUser: (user) => {
        localStorage.setItem('chat_username', user);
        setCurrentUser(user);
      },
      onlineUsers,
      allUsers,
      messages,
      activeChat,
      setActiveChat,
      sendMessage,
      isTyping,
      setTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
