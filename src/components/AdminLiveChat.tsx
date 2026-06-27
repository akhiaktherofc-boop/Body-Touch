import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  MessageSquare, 
  Send, 
  User, 
  Check, 
  CheckCheck,
  Image,
  X,
  ShieldCheck, 
  Phone, 
  Sparkles, 
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../services/imageService';

interface ActiveChatSession {
  username: string;
  fullName: string;
  userLevel: string;
  avatarUrl: string;
  lastMessageTime: number;
  unreadCount: number;
  phone?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  image?: string;
  status?: 'sent' | 'delivered' | 'seen';
  timestamp: number;
}

export default function AdminLiveChat() {
  const [activeChats, setActiveChats] = useState<ActiveChatSession[]>([]);
  const [selectedUser, setSelectedUser] = useState<ActiveChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Establish socket connection to the same origin
    const socket: Socket = io(window.location.origin, {
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[AdminLiveChat] Socket connected');
      // Join as admin
      socket.emit('join_room', {
        username: 'admin',
        role: 'admin'
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[AdminLiveChat] Socket disconnected');
    });

    socket.on('active_chats_list', (list: ActiveChatSession[]) => {
      // Sort by last message timestamp descending
      const sorted = [...list].sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setActiveChats(sorted);

      // If we have a selected user, update their state in real-time in case unreadCount changed
      if (selectedUser) {
        const updatedSelected = list.find(u => u.username === selectedUser.username);
        if (updatedSelected) {
          setSelectedUser(updatedSelected);
        }
      }
    });

    socket.on('receive_message', (message: ChatMessage) => {
      // If message is for currently active selected user chat, append it
      if (selectedUser) {
        // Socket room sends to all clients, but get_chat_history or room_${username} isolates it.
        // Let's make sure we only append if it belongs to selected user
        // Wait, receive_message event is caught here only if we joined that user's room.
        // But admin only joined admin_room! Admin gets 'receive_message_admin' which includes username!
      }
    });

    socket.on('receive_message_admin', (data: { username: string; message: ChatMessage }) => {
      if (selectedUser && selectedUser.username === data.username) {
        setMessages((prev) => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        
        // Mark as read immediately on active chat
        socket.emit('mark_as_read', { username: data.username });
      } else {
        // Just play alert or update list (list update is handled by active_chats_list anyway)
      }
    });

    socket.on('chat_history', (data: { username: string; history: ChatMessage[] }) => {
      if (selectedUser && data.username === selectedUser.username) {
        setMessages(data.history || []);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [selectedUser?.username]);

  // Fetch chat history when selectedUser changes
  useEffect(() => {
    if (selectedUser && socketRef.current && isConnected) {
      socketRef.current.emit('get_chat_history', { username: selectedUser.username });
      socketRef.current.emit('mark_as_read', { username: selectedUser.username });
    } else {
      setMessages([]);
    }
  }, [selectedUser?.username, isConnected]);

  const handleSelectUser = (user: ActiveChatSession) => {
    setSelectedUser(user);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !selectedUser || !socketRef.current || !isConnected) return;

    socketRef.current.emit('send_message', {
      username: selectedUser.username,
      sender: 'admin',
      text: inputText.trim(),
      image: selectedImage || undefined
    });

    setInputText('');
    setSelectedImage('');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const compressed = await compressImage(file, 800, 800, 0.7);
      setSelectedImage(compressed);
    } catch (err) {
      console.error("Failed to compress admin chat image:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Filter users by search bar query
  const filteredChats = activeChats.filter(chat => 
    chat.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.phone && chat.phone.includes(searchQuery))
  );

  return (
    <div className="bg-[#0b0c14] border border-[#1b2030] rounded-2xl overflow-hidden grid grid-cols-12 h-[650px] shadow-2xl relative">
      
      {/* Left Column - Active Chats Directory */}
      <div className="col-span-12 md:col-span-4 border-r border-[#1a1f30] flex flex-col h-full bg-[#07080f]">
        
        {/* Search header */}
        <div className="p-4 border-b border-[#1c2235] bg-[#090b14]/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase text-[#dbaa61] tracking-widest flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Active Client Chats
            </h3>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
              {isConnected ? 'Server Online' : 'Offline'}
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, phone or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0e1a] border border-[#1b2032] focus:border-[#dbaa61]/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#151a28] scrollbar-thin scrollbar-thumb-slate-800">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <MessageSquare className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-xs font-semibold">No active chat sessions</p>
              <p className="text-[10px] text-slate-600 mt-1">Waiting for customers to connect...</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedUser?.username === chat.username;
              const hasUnread = chat.unreadCount > 0;
              const formattedTime = new Date(chat.lastMessageTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <button
                  key={chat.username}
                  onClick={() => handleSelectUser(chat)}
                  className={`w-full text-left p-4 transition-all duration-200 flex items-center justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-[#dbaa61]/10 border-l-2 border-[#dbaa61]' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {chat.avatarUrl ? (
                        <img 
                          src={chat.avatarUrl} 
                          alt={chat.fullName} 
                          className="w-10 h-10 rounded-full object-cover border border-[#dbaa61]/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      {hasUnread && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-650 text-[10px] font-black text-white flex items-center justify-center animate-bounce border-2 border-[#07080f]">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{chat.fullName}</h4>
                        <span className={`text-[8px] font-black tracking-wide px-1 rounded ${chat.userLevel === 'ELITE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10'}`}>
                          {chat.userLevel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">@{chat.username}</p>
                      {chat.phone && (
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-medium">
                          <Phone className="w-2.5 h-2.5 shrink-0" /> {chat.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[9px] text-slate-500 font-mono block">{formattedTime}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column - Chat Room Dialogue Console */}
      <div className="col-span-12 md:col-span-8 flex flex-col h-full bg-[#05060b]">
        {selectedUser ? (
          <div className="flex flex-col h-full">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1a1f30] bg-[#07080f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedUser.avatarUrl ? (
                  <img 
                    src={selectedUser.avatarUrl} 
                    alt={selectedUser.fullName} 
                    className="w-10 h-10 rounded-full object-cover border border-[#dbaa61]/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-black text-white flex items-center gap-2">
                    {selectedUser.fullName} 
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${selectedUser.userLevel === 'ELITE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                      {selectedUser.userLevel} MEMBER
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">@{selectedUser.username} {selectedUser.phone ? `• Phone: ${selectedUser.phone}` : ''}</p>
                </div>
              </div>

              <div className="text-right flex items-center gap-2">
                <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> SECURE DIALOGUE
                </span>
              </div>
            </div>

            {/* Conversation Thread Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center p-6">
                  <MessageSquare className="w-10 h-10 text-slate-800 mb-3" />
                  <p className="text-xs font-bold text-slate-400">No chat history available</p>
                  <p className="text-[10px] text-slate-600 mt-1">Send a message below to initiate support response.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';
                    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={msg.id || index}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isAdmin
                                ? 'bg-amber-650 hover:bg-amber-600 text-white rounded-tr-none shadow-lg shadow-amber-950/20'
                                : 'bg-[#121624] text-slate-200 border border-[#1d2338] rounded-tl-none'
                            }`}
                          >
                            {msg.image && (
                              <div className="mb-1.5 max-w-[240px] rounded-lg overflow-hidden border border-white/5 bg-black/20">
                                <img
                                  src={msg.image}
                                  alt="Chat attachment"
                                  className="max-h-52 w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  referrerPolicy="no-referrer"
                                  onClick={() => window.open(msg.image, '_blank')}
                                />
                              </div>
                            )}
                            {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                          </div>
                          <span className="text-[8px] text-slate-500 font-semibold mt-1 uppercase tracking-wider px-1 flex items-center gap-1">
                            {isAdmin ? `Administrative Staff • ${timeStr}` : `${selectedUser.fullName} • ${timeStr}`}
                            {!isAdmin && (
                              <span className="flex items-center">
                                {!msg.status || msg.status === "sent" ? (
                                  <Check className="w-3 h-3 text-slate-500" />
                                ) : msg.status === "delivered" ? (
                                  <CheckCheck className="w-3 h-3 text-slate-400" />
                                ) : (
                                  <CheckCheck className="w-3 h-3 text-amber-500" />
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Selected Image Preview Bar */}
            {selectedImage && (
              <div className="px-4 py-2 bg-[#090b14] border-t border-[#1a1f30] flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-10 h-10 object-cover rounded border border-[#dbaa61]/30"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">Attachment ready to send...</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedImage("")}
                  className="p-1 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-full transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Form Box */}
            <form onSubmit={handleSendMessage} className="p-4 bg-[#07080f] border-t border-[#1a1f30] flex gap-2 items-center">
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              <button
                type="button"
                disabled={isUploadingImage || !isConnected}
                onClick={() => imageInputRef.current?.click()}
                className="p-3 rounded-xl bg-[#0c0e18] border border-[#1c2235] text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
                title="Upload image attachment"
              >
                <Image className="w-4 h-4 text-[#dbaa61]" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isUploadingImage ? "Compressing image..." : `Type support response to ${selectedUser.fullName}...`}
                disabled={isUploadingImage}
                className="flex-1 bg-[#0c0e18] border border-[#1c2235] focus:border-[#dbaa61]/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={(!inputText.trim() && !selectedImage) || !isConnected || isUploadingImage}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-650 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-950/15 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-800/20 flex items-center justify-center border border-slate-700/30 mb-4 animate-pulse">
              <MessageSquare className="w-6 h-6 text-[#dbaa61]/60" />
            </div>
            <Sparkles className="w-4 h-4 text-[#dbaa61] mb-2" />
            <h3 className="text-sm font-black uppercase text-white tracking-widest">Administrative Chat Desk</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
              Select a customer chat thread from the left directory column to load conversation history and exchange live real-time support responses securely.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
