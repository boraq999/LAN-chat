import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Paperclip, Image as ImageIcon, FileText, X, Download, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ChatArea: React.FC = () => {
  const { messages, activeChat, setActiveChat, currentUser, sendMessage, setTyping, isTyping } = useChat();
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
      setTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setTyping(e.target.value.length > 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      sendMessage(JSON.stringify(data), 'file');
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredMessages = messages.filter(m => 
    (activeChat === 'all' && m.receiver === 'all') ||
    (activeChat !== 'all' && (
      (m.sender === currentUser && m.receiver === activeChat) ||
      (m.sender === activeChat && m.receiver === currentUser)
    ))
  );

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center glass rounded-l-none border-l-0 text-white/20">
        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Send className="w-12 h-12" />
        </div>
        <p className="text-xl font-medium">Select a contact to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full glass rounded-l-none border-l-0">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10 flex items-center gap-4">
        <button 
          onClick={() => setActiveChat(null)}
          className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-xl md:text-2xl font-bold">
            {activeChat === 'all' ? 'General Chat' : activeChat}
          </h2>
          {activeChat !== 'all' && (
            <div className="text-sm text-white/40">
              {isTyping[activeChat] ? 'Typing...' : 'Direct Message'}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredMessages.map((msg, i) => {
          const isMe = msg.sender === currentUser;
          let content = msg.content;
          let fileData = null;
          if (msg.type === 'file') {
            try { fileData = JSON.parse(msg.content); } catch(e) {}
          }

          return (
            <motion.div
              initial={{ opacity: 0, x: isMe ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={i}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] group`}>
                {!isMe && activeChat === 'all' && (
                  <div className="text-xs text-white/40 mb-1 ml-4">{msg.sender}</div>
                )}
                <div className={`p-4 rounded-2xl shadow-lg ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white/10 backdrop-blur-md border border-white/10 rounded-tl-none'
                }`}>
                  {msg.type === 'file' && fileData ? (
                    <div className="space-y-3">
                      {fileData.type.startsWith('image/') ? (
                        <div className="relative group/img">
                          <img src={fileData.url} alt="upload" className="max-w-full rounded-lg" referrerPolicy="no-referrer" />
                          <a 
                            href={fileData.url} 
                            download={fileData.filename}
                            className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <Download className="w-5 h-5 text-white" />
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4 bg-white/5 p-3 rounded-xl border border-white/10">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <FileText className="w-6 h-6 text-blue-400" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-sm font-medium truncate">{fileData.filename}</div>
                              <div className="text-[10px] opacity-50 uppercase">{fileData.type.split('/')[1]}</div>
                            </div>
                          </div>
                          <a 
                            href={fileData.url} 
                            download={fileData.filename}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg leading-relaxed">{msg.content}</p>
                  )}
                  <div className={`text-[10px] mt-2 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMe && <span className="ml-1">✓✓</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10">
        <form 
          onSubmit={handleSend} 
          className="flex items-center gap-4"
        >
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="glass-input w-full py-4 pl-6 pr-24 text-lg"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
                disabled={uploading}
              >
                <Paperclip className="w-6 h-6" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={uploading || !input.trim()}
            className={`glass-button h-[60px] w-[60px] flex items-center justify-center rounded-2xl p-0 ${!input.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};
