import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { MessageCircle, Send, Lock, User, ShieldAlert, Sparkles, AlertCircle, Check, CheckCheck, Image, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MemberLevel } from "../types";
import { compressImage } from "../services/imageService";

interface LiveChatProps {
  isLoggedIn: boolean;
  userLevel: MemberLevel;
  username: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  onGoToMembership: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "admin";
  text: string;
  image?: string;
  status?: "sent" | "delivered" | "seen";
  timestamp: number;
}

export default function LiveChat({
  isLoggedIn,
  userLevel,
  username,
  fullName,
  avatarUrl,
  phone,
  onGoToMembership
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const hasAccess = userLevel !== "FREE";

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (hasAccess && isLoggedIn && username) {
      scrollToBottom();
    }
  }, [messages, hasAccess, isLoggedIn, username]);

  useEffect(() => {
    if (!hasAccess || !isLoggedIn || !username) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    // Connect to the same origin
    const socket: Socket = io(window.location.origin, {
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      console.log("[LiveChat] Connected to socket server");
      
      // Join room
      socket.emit("join_room", {
        username,
        role: "user",
        fullName,
        userLevel,
        avatarUrl,
        phone
      });

      // Get chat history
      socket.emit("get_chat_history", { username });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("[LiveChat] Disconnected from socket server");
    });

    socket.on("receive_message", (message: ChatMessage) => {
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    socket.on("chat_history", (data: { username: string; history: ChatMessage[] }) => {
      if (data.username === username) {
        setMessages(data.history || []);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [hasAccess, isLoggedIn, username, fullName, userLevel, avatarUrl, phone]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !socketRef.current || !isConnected) return;

    socketRef.current.emit("send_message", {
      username,
      sender: "user",
      text: inputText.trim(),
      image: selectedImage || undefined
    });

    setInputText("");
    setSelectedImage("");
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const compressed = await compressImage(file, 800, 800, 0.7);
      setSelectedImage(compressed);
    } catch (err) {
      console.error("Failed to compress chat image:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 1. Not Logged In Screen
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]" id="chat-not-logged-in">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700 mb-4 shadow-lg shadow-blue-500/5">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">লগইন প্রয়োজন (Login Required)</h3>
        <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
          লাইভ চ্যাট ব্যবহারের জন্য অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন। 
          (Please log in to your account to use the live support feature.)
        </p>
      </div>
    );
  }

  // 2. Lock Screen for Regular/Free Users
  if (!hasAccess) {
    return (
      <div className="p-1" id="chat-locked-screen">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center backdrop-blur-md relative overflow-hidden min-h-[450px] flex flex-col justify-center items-center">
          {/* Neon background decorations */}
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-[1px] mb-6 inline-block shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-955 rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
              <Sparkles className="w-3 h-3" /> Premium Feature
            </span>

            <h3 className="text-xl font-black text-white mb-3 tracking-tight">
              লাইভ চ্যাট মেম্বারদের জন্য (Exclusive Access)
            </h3>
            
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              সাপোর্ট বা এজেন্টদের সাথে সরাসরি লাইভ চ্যাট ফিচারটি শুধুমাত্র <span className="text-cyan-450 font-bold">Regular</span>, <span className="text-cyan-450 font-bold">Premium</span> এবং <span className="text-amber-450 font-bold">Elite</span> মেম্বারদের জন্য উপলব্ধ। অনুগ্রহ করে যেকোনো একটি মেম্বারশিপ টায়ার ক্রয় অথবা আপগ্রেড করুন।
            </p>

            <button
              onClick={onGoToMembership}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-cyan-500/15 transform hover:-translate-y-0.5"
            >
              মেম্বারশিপ আপগ্রেড করুন (Upgrade Membership)
            </button>

            <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-[10px] font-medium">
              <ShieldAlert className="w-3.5 h-3.5" /> Secure end-to-end support encryption active
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Chat Screen (Premium/Elite Users)
  return (
    <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden flex flex-col h-[550px] shadow-2xl relative" id="chat-active-panel">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border border-cyan-500/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                <User className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              Live Chat Support
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider leading-none ${userLevel === "ELITE" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"}`}>
                {userLevel}
              </span>
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">{fullName}</span>
              <span className="text-slate-600 text-[9px]">•</span>
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">
                {isConnected ? "Connected" : "Reconnecting..."}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">Response Time</p>
            <p className="text-[11px] font-bold text-cyan-400 mt-0.5">Instant Agent Dispatched</p>
          </div>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
            <MessageCircle className="w-10 h-10 text-slate-700 mb-3 animate-bounce" />
            <p className="text-xs font-bold text-slate-400">কোনো বার্তা নেই (No messages yet)</p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
              সাপোর্টের সাথে চ্যাট শুরু করতে নিচে আপনার বার্তা লিখে পাঠান। 
              (Send a message below to start chatting with our 24/7 dedicated agents.)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";
              const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-medium ${
                        isUser
                          ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-none shadow-md shadow-cyan-550/10"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
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
                    <span className={`text-[9px] text-slate-500 font-medium mt-1 uppercase tracking-wider px-1 flex items-center gap-1 ${isUser ? "justify-end" : "justify-start"}`}>
                      {isUser ? `You • ${timeStr}` : `Support Agent • ${timeStr}`}
                      {isUser && (
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
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between z-10 animate-fadeIn">
          <div className="flex items-center gap-2">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-10 h-10 object-cover rounded border border-cyan-500/30"
              referrerPolicy="no-referrer"
            />
            <span className="text-[10px] text-slate-400 font-bold">ছবি সংযুক্ত করা হয়েছে (Attachment Ready)</span>
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

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/60 border-t border-slate-800 z-10 flex gap-2 items-center">
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
          className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
          title="ছবি আপলোড করুন (Upload image)"
        >
          <Image className="w-4 h-4 text-cyan-400" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isUploadingImage ? "প্রসেসিং হচ্ছে..." : "আপনার বার্তা লিখুন... (Type your message...)"}
          disabled={!isConnected || isUploadingImage}
          className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedImage) || !isConnected || isUploadingImage}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-cyan-500/10 flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
