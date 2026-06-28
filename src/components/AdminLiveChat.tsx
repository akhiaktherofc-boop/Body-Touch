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
  AlertCircle,
  Trash2,
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  Volume2,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage } from '../services/imageService';
import { playNotificationSound, startRingingSound, stopRingingSound, playCallEndSound, playCallConnectSound } from '../lib/audio';
import AudioPlayer from './AudioPlayer';

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
  audio?: string;
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
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Voice Call States
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const callIntervalRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [incomingCallFrom, setIncomingCallFrom] = useState<string | null>(null); // To show ring notification alert if not actively in that chat thread!
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser ? typingUsers[selectedUser.username] : false]);

  useEffect(() => {
    if (callState === "connected") {
      setCallDuration(0);
      callIntervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
        callIntervalRef.current = null;
      }
    }
    return () => {
      if (callIntervalRef.current) {
        clearInterval(callIntervalRef.current);
      }
    };
  }, [callState]);

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
      // Play sound when user sends a message
      if (data.message.sender === 'user') {
        playNotificationSound();
      }

      if (selectedUser && selectedUser.username === data.username) {
        setMessages((prev) => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        
        // Mark as read immediately on active chat
        socket.emit('mark_as_read', { username: data.username });
      }
    });

    socket.on('user_typing', (data: { username: string; isTyping: boolean }) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.username]: data.isTyping
      }));
    });

    socket.on('chat_history', (data: { username: string; history: ChatMessage[] }) => {
      if (selectedUser && data.username === selectedUser.username) {
        setMessages(data.history || []);
      }
    });

    socket.on('chat_history_cleared', (data: { username: string }) => {
      if (selectedUser && data.username === selectedUser.username) {
        setMessages([]);
      }
    });

    socket.on('all_chats_cleared', () => {
      setMessages([]);
      setSelectedUser(null);
    });

    // Voice Call Listeners
    socket.on("call_initiated_admin", (data: { username: string; sender: 'user' | 'admin' }) => {
      if (data.sender === "user") {
        setIncomingCallFrom(data.username);
        setCallState("ringing");
        startRingingSound();
      }
    });

    socket.on("call_accepted_admin", (data: { username: string; sender: 'user' | 'admin' }) => {
      stopRingingSound();
      playCallConnectSound();
      setCallState("connected");
      setCallDuration(0);
    });

    socket.on("call_declined_admin", (data: { username: string; sender: 'user' | 'admin' }) => {
      stopRingingSound();
      playCallEndSound();
      setCallState("idle");
      setIncomingCallFrom(null);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    });

    socket.on("call_ended_admin", (data: { username: string; sender: 'user' | 'admin' }) => {
      stopRingingSound();
      playCallEndSound();
      setCallState("ended");
      setIncomingCallFrom(null);
      setTimeout(() => setCallState("idle"), 2500);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && socketRef.current && selectedUser) {
        socketRef.current.emit('typing', { username: selectedUser.username, sender: 'admin', isTyping: false });
      }
      stopRingingSound();
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
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

  const handleClearChat = (username: string) => {
    if (!socketRef.current || !isConnected) return;
    if (window.confirm(`Are you sure you want to delete all messages for @${username}?`)) {
      socketRef.current.emit("clear_chat", { username });
    }
  };

  const handleClearAllChats = () => {
    if (!socketRef.current || !isConnected) return;
    if (window.confirm("Are you sure you want to delete ALL chats from all clients? This is irreversible!")) {
      socketRef.current.emit("clear_all_chats");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert(
        "⚠️ Failed to access microphone!\n\n" +
        "Potential cause: If you have active screen overlays or floating bubble overlays (like Facebook Messenger chat heads or screen filter apps) running, Android security will prevent the browser from prompting for microphone permissions.\n\n" +
        "Solution: Please temporarily close all floating bubbles or overlays and try again."
      );
    }
  };

  const stopRecording = (shouldSend: boolean) => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);

    if (!mediaRecorderRef.current || !selectedUser) return;

    mediaRecorderRef.current.onstop = () => {
      if (shouldSend && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (socketRef.current && isConnected) {
            socketRef.current.emit("send_message", {
              username: selectedUser.username,
              sender: "admin",
              text: "",
              audio: base64Audio
            });
          }
        };
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };

    mediaRecorderRef.current.stop();
  };

  const initiateCall = async () => {
    if (!socketRef.current || !isConnected || !selectedUser) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      setCallState("dialing");
      startRingingSound();
      socketRef.current.emit("initiate_call", { username: selectedUser.username, sender: "admin" });
    } catch (err) {
      console.error("Calling mic error:", err);
      alert(
        "⚠️ Microphone permission is required to make outbound voice calls!\n\n" +
        "Potential cause: If you have active screen overlays or floating bubble overlays (like Facebook Messenger chat heads or screen filter apps) running, Android security will prevent the browser from prompting for microphone permissions.\n\n" +
        "Solution: Please temporarily close all floating bubbles or overlays and try again."
      );
    }
  };

  const acceptCall = () => {
    if (!socketRef.current || !isConnected) return;
    const callerName = incomingCallFrom || (selectedUser ? selectedUser.username : null);
    if (!callerName) return;
    stopRingingSound();
    playCallConnectSound();
    setCallState("connected");
    socketRef.current.emit("accept_call", { username: callerName, sender: "admin" });
  };

  const declineCall = () => {
    if (!socketRef.current || !isConnected) return;
    const callerName = incomingCallFrom || (selectedUser ? selectedUser.username : null);
    if (!callerName) return;
    stopRingingSound();
    playCallEndSound();
    setCallState("idle");
    setIncomingCallFrom(null);
    socketRef.current.emit("decline_call", { username: callerName, sender: "admin" });
  };

  const endCall = () => {
    if (!socketRef.current || !isConnected) return;
    const callerName = incomingCallFrom || (selectedUser ? selectedUser.username : null);
    if (!callerName) return;
    stopRingingSound();
    playCallEndSound();
    setCallState("idle");
    setIncomingCallFrom(null);
    socketRef.current.emit("end_call", { username: callerName, sender: "admin" });
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !selectedUser || !socketRef.current || !isConnected) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socketRef.current && selectedUser) {
      isTypingRef.current = false;
      socketRef.current.emit('typing', { username: selectedUser.username, sender: 'admin', isTyping: false });
    }

    socketRef.current.emit('send_message', {
      username: selectedUser.username,
      sender: 'admin',
      text: inputText.trim(),
      image: selectedImage || undefined
    });

    setInputText('');
    setSelectedImage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (selectedUser && socketRef.current && isConnected) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socketRef.current.emit('typing', { username: selectedUser.username, sender: 'admin', isTyping: true });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current && socketRef.current && selectedUser) {
          isTypingRef.current = false;
          socketRef.current.emit('typing', { username: selectedUser.username, sender: 'admin', isTyping: false });
        }
      }, 1500);
    }
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
            <h3 className="text-xs font-black uppercase text-[#ceff00] tracking-widest flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Active Client Chats
            </h3>
            <div className="flex items-center gap-1.5">
              {filteredChats.length > 0 && (
                <button
                  onClick={handleClearAllChats}
                  title="Clear all chat history"
                  className="p-1 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                {isConnected ? 'Server Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, phone or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0e1a] border border-[#1b2032] focus:border-[#ceff00]/40 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
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
                      ? 'bg-[#ceff00]/10 border-l-2 border-[#ceff00]' 
                      : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      {chat.avatarUrl ? (
                        <img 
                          src={chat.avatarUrl} 
                          alt={chat.fullName} 
                          className="w-10 h-10 rounded-full object-cover border border-[#ceff00]/20"
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
                      {typingUsers[chat.username] ? (
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-400 font-bold animate-pulse">
                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDuration: '1s' }} />
                          <span>Typing...</span>
                        </div>
                      ) : chat.phone ? (
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-medium">
                          <Phone className="w-2.5 h-2.5 shrink-0" /> {chat.phone}
                        </div>
                      ) : null}
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
      <div className="col-span-12 md:col-span-8 flex flex-col h-full bg-[#05060b] relative">
        {/* Voice Call Overlay Screen for Admin */}
        <AnimatePresence>
          {callState !== "idle" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 bg-[#020512]/98 z-50 flex flex-col items-center justify-between p-8 backdrop-blur-lg"
            >
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#ceff00]/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-rose-500/5 rounded-full blur-[60px] pointer-events-none" />

              <div className="text-center mt-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-850 text-[10px] uppercase tracking-wider font-extrabold text-[#ceff00] shadow-inner mb-4">
                  <Radio className="w-3.5 h-3.5 text-[#ceff00] animate-pulse shrink-0" />
                  SECURE OUTBOUND CONNECTION
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">ACTIVE OUTBOUND DISPATCH</h3>
                <p className="text-xs text-slate-400 mt-1">Client: {incomingCallFrom || selectedUser?.fullName || "Premium Member"}</p>
              </div>

              <div className="relative flex items-center justify-center my-auto">
                <div className="absolute w-32 h-32 rounded-full border border-[#ceff00]/20 animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute w-44 h-44 rounded-full border border-slate-800 animate-ping" style={{ animationDuration: '4s' }} />

                <div className={`w-28 h-28 rounded-full bg-slate-900 border-2 ${callState === "connected" ? "border-[#ceff00]" : "border-slate-700"} flex items-center justify-center p-1.5 shadow-2xl relative z-10 overflow-hidden`}>
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                    <User className="w-12 h-12 text-slate-400" />
                  </div>
                </div>

                {callState === "connected" && (
                  <div className="absolute -bottom-8 flex items-center gap-1">
                    <span className="w-1 h-3 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
                    <span className="w-1 h-5 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
                    <span className="w-1 h-8 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
                    <span className="w-1 h-4 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '450ms', animationDuration: '0.8s' }} />
                    <span className="w-1 h-2 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '600ms', animationDuration: '0.8s' }} />
                  </div>
                )}
              </div>

              <div className="text-center mb-6">
                <span className={`block text-xs uppercase font-extrabold tracking-widest ${callState === "connected" ? "text-emerald-400" : callState === "ended" ? "text-rose-500" : "text-[#ceff00] animate-pulse"}`}>
                  {callState === "dialing" && "Calling member..."}
                  {callState === "ringing" && "Incoming call from customer..."}
                  {callState === "connected" && "Active session connected"}
                  {callState === "ended" && "Call completed"}
                </span>

                {callState === "connected" && (
                  <p className="text-xl font-bold font-mono text-white mt-1">
                    {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6 mb-8 relative z-20">
                <button
                  type="button"
                  onClick={() => setIsCallMuted(!isCallMuted)}
                  disabled={callState !== "connected"}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition cursor-pointer ${isCallMuted ? "bg-rose-500/10 text-rose-400 border border-rose-500/30" : "bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-850"}`}
                  title="Mute microphone"
                >
                  {isCallMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {callState === "ringing" ? (
                  <>
                    <button
                      type="button"
                      onClick={declineCall}
                      className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/25 transition cursor-pointer transform hover:scale-105"
                      title="Decline Call"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>

                    <button
                      type="button"
                      onClick={acceptCall}
                      className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 transition cursor-pointer transform hover:scale-105"
                      title="Accept Call"
                    >
                      <Phone className="w-6 h-6" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={endCall}
                    className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/25 transition cursor-pointer transform hover:scale-105"
                    title="End Call"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast Banner for Incoming Calls from non-selected users */}
        <AnimatePresence>
          {incomingCallFrom && (!selectedUser || selectedUser.username !== incomingCallFrom) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-45 bg-slate-900 border border-[#ceff00]/50 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-sm w-full backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20 shrink-0">
                <Phone className="w-5 h-5 text-emerald-400 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#ceff00] font-black uppercase tracking-wider">Incoming Call</p>
                <p className="text-xs font-bold text-white truncate">@{incomingCallFrom} is calling support</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={declineCall}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const targetSession = activeChats.find(u => u.username === incomingCallFrom);
                    if (targetSession) setSelectedUser(targetSession);
                    acceptCall();
                  }}
                  className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white transition cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedUser ? (
          <div className="flex flex-col h-full">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1a1f30] bg-[#07080f] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedUser.avatarUrl ? (
                  <img 
                    src={selectedUser.avatarUrl} 
                    alt={selectedUser.fullName} 
                    className="w-10 h-10 rounded-full object-cover border border-[#ceff00]/30"
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

              <div className="text-right flex items-center gap-3">

                <button
                  onClick={() => handleClearChat(selectedUser.username)}
                  title="Delete this client's chat history"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Chat
                </button>
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
                            className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-bold ${
                              isAdmin
                                ? 'bg-[#ceff00] text-black rounded-tr-none shadow-lg shadow-[#ceff00]/10'
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
                            {msg.audio && (
                              <div className="mb-1.5">
                                <AudioPlayer src={msg.audio} isAdmin={isAdmin} />
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
                  {selectedUser && typingUsers[selectedUser.username] && (
                    <div className="flex justify-start animate-pulse" id="user-typing-indicator">
                      <div className="max-w-[80%] flex flex-col items-start">
                        <div className="bg-[#121624] text-slate-200 border border-[#1d2338] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2.5 shadow-lg">
                          <span className="text-[11px] text-slate-400 font-bold">{selectedUser.fullName} is typing</span>
                          <div className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                            <span className="w-1.5 h-1.5 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                            <span className="w-1.5 h-1.5 bg-[#ceff00] rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                    className="w-10 h-10 object-cover rounded border border-[#ceff00]/30"
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
            {isRecording ? (
              <div className="p-4 bg-[#0a0c16] border-t border-[#1a1f30] z-10 flex gap-4 items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="text-xs font-black text-rose-500 tracking-wide uppercase">
                    RECORDING RESPONSE • {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stopRecording(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 text-rose-400 hover:text-rose-300 transition cursor-pointer text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    title="Cancel recording"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => stopRecording(true)}
                    className="px-5 py-2.5 rounded-xl bg-[#ceff00] hover:bg-[#bbf200] text-black font-extrabold transition cursor-pointer text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-[#ceff00]/20"
                    title="Stop and send voice message"
                  >
                    <Check className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            ) : (
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
                  <Image className="w-4 h-4 text-[#ceff00]" />
                </button>



                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={isUploadingImage ? "Compressing image..." : `Type support response to ${selectedUser.fullName}...`}
                  disabled={isUploadingImage}
                  className="flex-1 bg-[#0c0e18] border border-[#1c2235] focus:border-[#ceff00]/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={(!inputText.trim() && !selectedImage) || !isConnected || isUploadingImage}
                  className="px-6 py-3 rounded-xl bg-[#ceff00] hover:bg-[#bbf200] text-black font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#ceff00]/15 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            )}

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-800/20 flex items-center justify-center border border-slate-700/30 mb-4 animate-pulse">
              <MessageSquare className="w-6 h-6 text-[#ceff00]/60" />
            </div>
            <Sparkles className="w-4 h-4 text-[#ceff00] mb-2" />
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
