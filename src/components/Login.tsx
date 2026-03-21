import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { User, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const { setCurrentUser } = useChat();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setCurrentUser(username.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-3xl w-full max-w-md text-center"
      >
        <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
          <LogIn className="w-10 h-10 text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">LAN Chat Pro</h1>
        <p className="text-white/60 mb-8">Enter your username to start chatting</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input w-full pl-12 py-3 text-lg"
              autoFocus
            />
          </div>
          <button type="submit" className="glass-button w-full py-4 text-lg">
            Join Chat
          </button>
        </form>
      </motion.div>
    </div>
  );
};
