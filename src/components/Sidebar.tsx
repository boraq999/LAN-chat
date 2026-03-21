import React from 'react';
import { useChat } from '../context/ChatContext';
import { Users, Circle, Hash } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { allUsers, onlineUsers, activeChat, setActiveChat, currentUser } = useChat();

  return (
    <div className="w-full glass border-r-0 rounded-r-none flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-400" />
          Contacts
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <button
          onClick={() => setActiveChat('all')}
          className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
            activeChat === 'all' ? 'bg-blue-600/30 border border-blue-500/50 shadow-lg scale-[1.02]' : 'hover:bg-white/5'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Hash className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-lg">General Chat</div>
            <div className="text-sm text-white/40">Everyone is here</div>
          </div>
        </button>

        <div className="pt-4 pb-2 px-2 text-xs font-bold text-white/30 uppercase tracking-widest">
          Direct Messages
        </div>

        {allUsers.filter(u => u.username !== currentUser).map((user) => {
          const isOnline = onlineUsers.includes(user.username);
          return (
            <button
              key={user.username}
              onClick={() => setActiveChat(user.username)}
              className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${
                activeChat === user.username ? 'bg-blue-600/30 border border-blue-500/50 shadow-lg scale-[1.02]' : 'hover:bg-white/5'
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold border border-white/10">
                  {user.username[0].toUpperCase()}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#0f172a] rounded-full" />
                )}
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-lg">{user.username}</div>
                <div className="text-sm text-white/40 flex items-center gap-1">
                  {isOnline ? (
                    <span className="text-green-400">Online</span>
                  ) : (
                    <span>Offline</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="p-6 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
            {currentUser?.[0].toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{currentUser}</div>
            <div className="text-xs text-white/40">My Account</div>
          </div>
        </div>
      </div>
    </div>
  );
};
