import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Info, CheckCircle2, ShieldAlert, Sparkles, Check, Trash2, Calendar } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onDeleteNotification
}: NotificationCenterModalProps) {
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Helper safely mapping notification type to beautiful icons & colors
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        );
      case 'alert':
        return (
          <div className="w-9 h-9 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
          </div>
        );
      case 'booking':
        return (
          <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
        );
      case 'system':
        return (
          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 animate-bounce">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
        );
    }
  };

  const getNotificationBg = (notification: AppNotification) => {
    if (!notification.isRead) {
      return 'bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 hover:border-amber-500/25';
    }
    return 'bg-[#090e1a]/60 border border-blue-900/15 hover:border-blue-500/15';
  };

  // Human-friendly time parser
  const getReadableTime = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('bn-BD', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end overflow-hidden">
          {/* Backdrop Mask */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
          />

          {/* Sliding Content Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            className="relative w-full max-w-md h-full bg-[#030816] text-white flex flex-col shadow-2xl border-l border-amber-500/10"
          >
            {/* Top Header Card */}
            <div className="p-5 border-b border-blue-950/40 bg-gradient-to-b from-[#05112e] to-[#030816] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shadow-lg shadow-amber-500/5">
                  <Bell className="w-5 h-5 text-amber-400 animate-swing" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white font-sans flex items-center gap-1.5">
                    Messages Center
                  </h3>
                  <span className="text-[10px] text-amber-500 font-bold tracking-widest uppercase font-mono block">
                    {unreadCount > 0 ? `${unreadCount} NEW UPDATES` : "ALL CORES DISPATCHED"}
                  </span>
                </div>
              </div>

              {/* Close Handle Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-black/40 hover:bg-rose-950/25 border border-slate-800/60 hover:border-rose-500/30 flex items-center justify-center text-slate-400 hover:text-rose-400 transition cursor-pointer"
                title="Close Center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub-Actions Toolbar */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 bg-[#05112e]/30 border-b border-blue-950/40 flex items-center justify-between text-xs">
                <button
                  onClick={onMarkAllAsRead}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-black uppercase tracking-wider flex items-center gap-1.1 bg-cyan-950/20 px-2.5 py-1 rounded border border-cyan-800/10 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  Mark all read
                </button>

                <button
                  onClick={onClearAll}
                  className="text-[10px] text-rose-400 hover:text-rose-350 font-black uppercase tracking-wider flex items-center gap-1.1 bg-rose-950/20 px-2.5 py-1 rounded border border-rose-800/10 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all history
                </button>
              </div>
            )}

            {/* Render Notifications list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-900/60 border border-slate-800/50 flex items-center justify-center text-slate-700 animate-pulse">
                    <Bell className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-400">কোনো নোটিফিকেশন নেই</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                      এডমিন যখনই নতুন অফার, মেম্বারশিপ আপডেট বা বুকিং কনফার্ম করবে, তা এখানে রিয়েল-টাইমে দেখতে পাবেন।
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3.5 rounded-2xl transition duration-150 relative text-left group overflow-hidden ${getNotificationBg(notification)}`}
                    >
                      {/* Read Indicator side tag */}
                      {!notification.isRead && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500 animate-pulse" />
                      )}

                      <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        {getNotificationIcon(notification.type)}

                        {/* Text details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="text-[12px] font-black text-slate-100 uppercase tracking-tight leading-snug">
                              {notification.title}
                            </h4>
                            <button
                              onClick={() => onDeleteNotification(notification.id)}
                              className="text-slate-500 hover:text-rose-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Delete notification log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <p className="text-[11.5px] text-slate-350 leading-relaxed mt-1 font-medium select-text break-words">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-1.5 mt-2 text-[9px] text-slate-500 font-semibold font-mono">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{getReadableTime(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Footer block */}
            <div className="p-4 border-t border-blue-950/40 bg-black/60 text-center">
              <p className="text-[10px] text-slate-500 font-medium font-sans">
                🛡️ Discretion & secure websocket notifications enabled
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
