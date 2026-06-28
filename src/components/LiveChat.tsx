import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { MessageCircle, Send, Lock, User, ShieldAlert, Sparkles, AlertCircle, Check, CheckCheck, Image, X, Phone, Mic, Volume2, Square, PhoneOff, MicOff, VolumeX, Radio } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MemberLevel } from "../types";
import { compressImage } from "../services/imageService";
import { playNotificationSound, startRingingSound, stopRingingSound, playCallEndSound, playCallConnectSound } from "../lib/audio";
import AudioPlayer from "./AudioPlayer";

interface LiveChatProps {
  isLoggedIn: boolean;
  userLevel: MemberLevel;
  username: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  onGoToMembership: () => void;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "admin";
  text: string;
  image?: string;
  audio?: string;
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
  onGoToMembership,
  onClose
}: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);

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
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const isTypingRef = useRef<boolean>(false);

  const hasAccess = userLevel !== "FREE";

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (hasAccess && isLoggedIn && username) {
      scrollToBottom();
    }
  }, [messages, isAdminTyping, hasAccess, isLoggedIn, username]);

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
        
        // Play notification sound if message is received from support agent/admin
        if (message.sender === "admin") {
          playNotificationSound();
        }
        return [...prev, message];
      });
    });

    socket.on("admin_typing", (data: { username: string; isTyping: boolean }) => {
      if (data.username === username) {
        setIsAdminTyping(data.isTyping);
      }
    });

    socket.on("chat_history", (data: { username: string; history: ChatMessage[] }) => {
      if (data.username === username) {
        setMessages(data.history || []);
      }
    });

    // Support Voice Call Listeners
    socket.on("call_initiated", (data: { username: string; sender: 'user' | 'admin' }) => {
      if (data.username === username) {
        if (data.sender === "admin") {
          setCallState("ringing");
          startRingingSound();
        }
      }
    });

    socket.on("call_accepted", (data: { username: string; sender: 'user' | 'admin' }) => {
      if (data.username === username) {
        stopRingingSound();
        playCallConnectSound();
        setCallState("connected");
        setCallDuration(0);
      }
    });

    socket.on("call_declined", (data: { username: string; sender: 'user' | 'admin' }) => {
      if (data.username === username) {
        stopRingingSound();
        playCallEndSound();
        setCallState("idle");
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }
      }
    });

    socket.on("call_ended", (data: { username: string; sender: 'user' | 'admin' }) => {
      if (data.username === username) {
        stopRingingSound();
        playCallEndSound();
        setCallState("ended");
        setTimeout(() => setCallState("idle"), 2500);
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }
      }
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current && socketRef.current) {
        socketRef.current.emit("typing", { username, sender: "user", isTyping: false });
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
  }, [hasAccess, isLoggedIn, username, fullName, userLevel, avatarUrl, phone]);

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
        "⚠️ মাইক্রোফোন অ্যাক্সেস করা যাচ্ছে না!\n\n" +
        "সম্ভাব্য কারণ: আপনার ফোনের স্ক্রিনে যদি Facebook Messenger বা অন্য কোনো অ্যাপের ভাসমান চ্যাট বাবল (Floating Bubble / Chat Head / Screen Overlay) সচল থাকে, তবে অ্যান্ড্রয়েডের সিকিউরিটি পলিসির কারণে ব্রাউজার মাইক্রোফোন পারমিশন ডায়ালগটি দেখাতে পারে না।\n\n" +
        "করণীয়: অনুগ্রহ করে স্ক্রিনে থাকা সব ভাসমান বাবল বা ওভারলে অ্যাপ সাময়িকভাবে বন্ধ করে আবার চেষ্টা করুন।"
      );
    }
  };

  const stopRecording = (shouldSend: boolean) => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);

    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      if (shouldSend && audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (socketRef.current && isConnected) {
            socketRef.current.emit("send_message", {
              username,
              sender: "user",
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
    if (!socketRef.current || !isConnected) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      
      setCallState("dialing");
      startRingingSound();
      socketRef.current.emit("initiate_call", { username, sender: "user" });
    } catch (err) {
      console.error("Calling mic error:", err);
      alert(
        "⚠️ কল করার জন্য মাইক্রোফোন অ্যাক্সেস প্রয়োজন!\n\n" +
        "সম্ভাব্য কারণ: আপনার ফোনের স্ক্রিনে যদি Facebook Messenger বা অন্য কোনো অ্যাপের ভাসমান চ্যাট বাবল (Floating Bubble / Chat Head / Screen Overlay) সচল থাকে, তবে অ্যান্ড্রয়েডের সিকিউরিটি পলিসির কারণে ব্রাউজার মাইক্রোফোন পারমিশন ডায়ালগটি দেখাতে পারে না।\n\n" +
        "করণীয়: অনুগ্রহ করে স্ক্রিনে থাকা সব ভাসমান বাবল বা ওভারলে অ্যাপ সাময়িকভাবে বন্ধ করে আবার চেষ্টা করুন।"
      );
    }
  };

  const acceptCall = () => {
    if (!socketRef.current || !isConnected) return;
    stopRingingSound();
    playCallConnectSound();
    setCallState("connected");
    socketRef.current.emit("accept_call", { username, sender: "user" });
  };

  const declineCall = () => {
    if (!socketRef.current || !isConnected) return;
    stopRingingSound();
    playCallEndSound();
    setCallState("idle");
    socketRef.current.emit("decline_call", { username, sender: "user" });
  };

  const endCall = () => {
    if (!socketRef.current || !isConnected) return;
    stopRingingSound();
    playCallEndSound();
    setCallState("idle");
    socketRef.current.emit("end_call", { username, sender: "user" });
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !socketRef.current || !isConnected) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current && socketRef.current) {
      isTypingRef.current = false;
      socketRef.current.emit("typing", { username, sender: "user", isTyping: false });
    }

    socketRef.current.emit("send_message", {
      username,
      sender: "user",
      text: inputText.trim(),
      image: selectedImage || undefined
    });

    setInputText("");
    setSelectedImage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (socketRef.current && isConnected) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socketRef.current.emit("typing", { username, sender: "user", isTyping: true });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current && socketRef.current) {
          isTypingRef.current = false;
          socketRef.current.emit("typing", { username, sender: "user", isTyping: false });
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
      console.error("Failed to compress chat image:", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Standardized header for all states to allow close option
  const renderHeader = (title: string, subtitle?: string) => (
    <div className="px-6 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10 select-none">
      <div className="flex items-center gap-3">
        <div className="relative">
          {isLoggedIn && avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-10 h-10 rounded-full object-cover border border-[#ceff00]/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="w-5 h-5 text-slate-400" />
            </div>
          )}
          {isLoggedIn && (
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-950 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
          )}
        </div>
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            {title}
            {isLoggedIn && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider leading-none ${userLevel === "ELITE" ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "bg-[#ceff00]/15 text-[#ceff00] border border-[#ceff00]/20"}`}>
                {userLevel}
              </span>
            )}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">{subtitle || (isLoggedIn ? fullName : "Discretion Guaranteed")}</span>
            {isLoggedIn && (
              <>
                <span className="text-slate-600 text-[9px]">•</span>
                <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">
                  {isConnected ? "Connected" : "Reconnecting..."}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest leading-none">Response Time</p>
          <p className="text-[11px] font-bold text-[#ceff00] mt-0.5">Instant Agent Dispatched</p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition cursor-pointer"
            title="চ্যাট উইন্ডো বন্ধ করুন (Minimize support)"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // 1. Not Logged In Screen
  if (!isLoggedIn) {
    return (
      <div 
        className="bg-[#020714] border border-[#1e293b] rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl relative" 
        id="chat-not-logged-in-container"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1.5px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#ceff00]/5 rounded-full blur-3xl pointer-events-none"></div>
        {renderHeader("Live Chat Support", "Login Required")}
        
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700 mb-4 shadow-lg shadow-blue-500/5">
            <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">লগইন প্রয়োজন (Login Required)</h3>
          <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">
            লাইভ চ্যাট ব্যবহারের জন্য অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন। 
            (Please log in to your account to use the live support feature.)
          </p>
        </div>
      </div>
    );
  }

  // 2. Lock Screen for Regular/Free Users
  if (!hasAccess) {
    return (
      <div 
        className="bg-[#020714] border border-[#1e293b] rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl relative" 
        id="chat-locked-screen-container"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1.5px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        {renderHeader("Live Chat Support", "Premium Access Only")}

        <div className="flex-1 flex flex-col justify-center items-center p-6 text-center z-10 overflow-y-auto">
          <div className="relative z-10 max-w-md w-full">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#ceff00] to-[#bcfc00] p-[1px] mb-4 inline-block shadow-lg shadow-[#ceff00]/20">
              <div className="w-full h-full bg-[#020714] rounded-2xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#ceff00] animate-pulse" />
              </div>
            </div>

            <span className="block w-fit mx-auto items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-[#ceff00]/10 text-[#ceff00] border border-[#ceff00]/20 mb-3">
              <Sparkles className="w-3 h-3 inline mr-1" /> Premium Feature
            </span>

            <h3 className="text-base font-black text-white mb-2 tracking-tight">
              লাইভ চ্যাট মেম্বারদের জন্য (Exclusive Access)
            </h3>
            
            <p className="text-slate-400 text-xs mb-6 leading-relaxed max-w-sm mx-auto">
              সাপোর্ট বা এজেন্টদের সাথে সরাসরি লাইভ চ্যাট ফিচারটি শুধুমাত্র <span className="text-[#ceff00] font-bold">Regular</span>, <span className="text-[#ceff00] font-bold">Premium</span> এবং <span className="text-[#ceff00] font-bold">Elite</span> মেম্বারদের জন্য উপলব্ধ। অনুগ্রহ করে যেকোনো একটি মেম্বারশিপ টায়ার ক্রয় অথবা আপগ্রেড করুন।
            </p>

            <button
              onClick={onGoToMembership}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#ceff00] to-[#bcfc00] text-black font-extrabold text-[11px] uppercase tracking-widest transition-all duration-300 shadow-lg shadow-[#ceff00]/15 transform hover:-translate-y-0.5 cursor-pointer"
            >
              মেম্বারশিপ আপগ্রেড করুন (Upgrade Membership)
            </button>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-medium">
              <ShieldAlert className="w-3.5 h-3.5" /> Secure end-to-end support encryption active
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Chat Screen (Premium/Elite Users)
  return (
    <div 
      className="bg-[#020714] border border-[#1e293b] rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl relative" 
      id="chat-active-panel"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1.5px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#ceff00]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ceff00]/2 rounded-full blur-3xl pointer-events-none"></div>

      {/* Voice Call Overlay Screen */}
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
                SECURE VOIP DISPATCH
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">VIP SUPPORT VOICE CALL</h3>
              <p className="text-xs text-slate-400 mt-1">Anika (Premium Live Agent)</p>
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
                {callState === "dialing" && "Dialing support team..."}
                {callState === "ringing" && "Incoming voice call..."}
                {callState === "connected" && "Active call connected"}
                {callState === "ended" && "Call ended"}
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
                {isMuted => null}
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

      {/* Header */}
      {renderHeader("Live Chat Support")}

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
                      className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-bold ${
                        isUser
                          ? "bg-[#ceff00] text-black rounded-tr-none shadow-md shadow-[#ceff00]/10"
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
                      {msg.audio && (
                        <div className="mb-1.5">
                          <AudioPlayer src={msg.audio} isAdmin={!isUser} />
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
            {isAdminTyping && (
              <div className="flex justify-start" id="admin-typing-indicator">
                <div className="max-w-[85%] flex flex-col items-start">
                  <div className="bg-slate-900 border border-slate-800 text-slate-200 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2.5 shadow-lg">
                    <span className="text-[11px] text-slate-400 font-bold">Anika is typing</span>
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
        <div className="px-4 py-2 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between z-10 animate-fadeIn">
          <div className="flex items-center gap-2">
            <img
              src={selectedImage}
              alt="Preview"
              className="w-10 h-10 object-cover rounded border border-[#ceff00]/30"
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
      {isRecording ? (
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 z-10 flex gap-4 items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
            <span className="text-xs font-black text-rose-500 tracking-wide uppercase">
              RECORDING • {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => stopRecording(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-rose-400 hover:text-rose-300 transition cursor-pointer text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
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
            title="ছবি সংযুক্ত করুন (Attach photo)"
          >
            <Image className="w-4 h-4 text-[#ceff00]" />
          </button>



          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder={isUploadingImage ? "প্রসেসিং হচ্ছে..." : "আপনার বার্তা লিখুন... (Type your message...)"}
            disabled={!isConnected || isUploadingImage}
            className="flex-1 bg-slate-950 border border-slate-800 focus:border-[#ceff00]/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || !isConnected || isUploadingImage}
            className="px-5 py-3 rounded-xl bg-[#ceff00] hover:bg-[#bbf200] text-black font-black text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-[#ceff00]/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      )}
    </div>
  );
}
