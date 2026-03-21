import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Send, Paperclip, Image as ImageIcon, FileText, X, Download, Mic, Square, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ChatArea: React.FC = () => {
  const { messages, activeChat, currentUser, sendMessage, setTyping, isTyping } = useChat();
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  
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

  const requestPermissionAndStart = async () => {
    setShowPermissionModal(false);
    await startRecording();
  };

  const handleMicClick = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (permissionStatus.state === 'granted') {
        startRecording();
      } else {
        setShowPermissionModal(true);
      }
    } catch (e) {
      // Fallback if permissions API is not supported
      setShowPermissionModal(true);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          await uploadAudio(audioBlob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording with a 1-second timeslice to ensure data is captured
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions and ensure your microphone is not muted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      cleanupRecording();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      cleanupRecording();
    }
  };

  const cleanupRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', blob, `voice-message-${Date.now()}.webm`);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      sendMessage(JSON.stringify(data), 'file');
    } catch (err) {
      console.error('Audio upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div className="flex-1 flex flex-col h-full glass rounded-l-none border-l-0">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
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
                      ) : fileData.type.startsWith('audio/') ? (
                        <div className="flex flex-col gap-2 min-w-[250px]">
                          <div className="flex items-center gap-2 text-xs opacity-70">
                            <Mic className="w-3 h-3" /> Voice Message
                          </div>
                          <audio controls src={fileData.url} className="w-full h-10 filter invert brightness-200" />
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
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-4 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-mono text-xl">{formatTime(recordingTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={cancelRecording}
                  className="p-3 hover:bg-white/10 rounded-xl text-red-400 transition-all"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
                <button 
                  onClick={stopRecording}
                  className="glass-button bg-red-600 hover:bg-red-500 h-12 w-12 flex items-center justify-center p-0"
                >
                  <Square className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
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
              
              {input.trim() ? (
                <button
                  type="submit"
                  disabled={uploading}
                  className="glass-button h-[60px] w-[60px] flex items-center justify-center rounded-2xl p-0"
                >
                  <Send className="w-6 h-6" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={uploading}
                  className="glass-button h-[60px] w-[60px] flex items-center justify-center rounded-2xl p-0 bg-blue-600/50"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Permission Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-white/20"
            >
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mic className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Microphone Access</h3>
              <p className="text-white/60 mb-8">
                We need your permission to access the microphone so you can record and send voice messages.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={requestPermissionAndStart}
                  className="glass-button w-full py-3 text-lg"
                >
                  Grant Permission
                </button>
                <button 
                  onClick={() => setShowPermissionModal(false)}
                  className="p-3 text-white/40 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
