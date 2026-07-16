import React, { useState, useEffect } from 'react';
import { 
  Send, 
  ChevronLeft, 
  ExternalLink, 
  Sparkles, 
  HelpCircle,
  Copy,
  Check,
  Globe
} from 'lucide-react';
import { db, doc, getDoc } from '../firebase';
import { BrandLogo } from './BrandLogo';

interface TelegramPageProps {
  onBack?: () => void;
  triggerToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const TelegramPage: React.FC<TelegramPageProps> = ({ onBack, triggerToast }) => {
  const [groupId, setGroupId] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchTelegramSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'telegram_settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.groupId) setGroupId(data.groupId);
        }
      } catch (err) {
        console.warn('Failed to fetch Telegram settings:', err);
      }
    };
    fetchTelegramSettings();
  }, []);

  // Custom or default group channel link
  const cleanGroupLink = groupId.startsWith('-') || !groupId.trim() 
    ? 'https://t.me/BodyTouchVIP' // Fallback official handle
    : `https://t.me/${groupId.trim().replace('@', '')}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    if (triggerToast) {
      triggerToast(`${label} copied to clipboard!`, 'success');
    }
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#020510] text-slate-100 flex flex-col justify-start items-center relative overflow-hidden py-8 px-4 sm:px-6 select-none font-sans">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] bg-gradient-to-b from-blue-950/20 via-[#dbaa61]/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-8">
        {/* Top bar with Back Button */}
        <div className="flex justify-between items-center">
          <button 
            type="button"
            onClick={handleGoBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-white transition cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </button>
          
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/5 border border-amber-500/10 text-[10px] text-[#dbaa61] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3 animate-pulse" />
            <span>Official Gateway</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-1.5 rounded-full bg-gradient-to-b from-[#dbaa61]/30 via-[#dbaa61]/10 to-transparent border border-[#dbaa61]/30 shadow-xl shadow-amber-500/5">
            <BrandLogo size={64} className="border-2 border-[#dbaa61]/30" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fce2b6] via-[#dbaa61] to-[#b3843b]">
              BODY TOUCH TELEGRAM
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
              Official Partner & Client Channel
            </p>
          </div>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#dbaa61]/30 to-transparent mx-auto pt-2" />
        </div>

        {/* Center Card for Channel QR and Join Button */}
        <div className="bg-slate-950/50 border border-[#dbaa61]/20 rounded-3xl p-6 sm:p-8 flex flex-col items-center hover:border-[#dbaa61]/40 hover:bg-slate-950/80 transition-all duration-300 shadow-xl shadow-black/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition" />
          
          {/* Channel Label */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span className="text-[11px] font-black uppercase text-green-400 tracking-wider">
              Official Live Channel
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 text-center leading-relaxed max-w-md mb-6">
            Join our official VIP channel to get instant model listings, dispatch status logs, exclusive live updates, and secure vacancy announcements.
          </p>

          {/* Centered Large Official Telegram Logo */}
          <div className="flex flex-col items-center justify-center py-6 mb-6 w-full">
            <a 
              href={cleanGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block hover:scale-105 active:scale-95 transition-all duration-300 group/telegram-logo"
            >
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#2AABEE] to-[#229ED9] opacity-40 blur-2xl group-hover:opacity-60 transition-opacity duration-300" />
              
              {/* High-fidelity Circular Official Telegram Logo */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-b from-[#2AABEE] to-[#229ED9] flex items-center justify-center shadow-2xl shadow-blue-500/30 border-4 border-white/10 group-hover:border-white/20 transition-all duration-300">
                <svg
                  viewBox="0 0 24 24"
                  className="w-18 h-18 sm:w-20 sm:h-20 transform group-hover/telegram-logo:translate-x-1 group-hover/telegram-logo:-translate-y-1 transition-transform duration-300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.5 5.5L3.5 11.6C2.4 12 2.4 12.6 3.3 12.9L7.4 14.2L16.9 8.2C17.3 7.9 17.7 8.1 17.4 8.4L9.7 15.3L9.4 19.5C9.8 19.5 10 19.3 10.2 19.1L12.2 17.1L16.4 20.2C17.2 20.6 17.7 20.4 17.9 19.5L20.6 6.6C20.9 5.4 20.2 4.9 19.5 5.5Z"
                    fill="white"
                  />
                </svg>
              </div>


            </a>
          </div>

          {/* Interactive controls */}
          <div className="w-full space-y-3">
            <a 
              href={cleanGroupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-[#a67c33] to-[#dbaa61] hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 uppercase tracking-wider cursor-pointer"
            >
              <span>Join Channel Now</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(cleanGroupLink, 'Channel Link')}
                className="flex-1 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {copiedLink === 'Channel Link' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink === 'Channel Link' ? 'Copied Link' : 'Copy Channel Link'}</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-900">
              <a 
                href="https://bodytouch.site"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-[#dbaa61]/30 text-slate-300 hover:text-[#dbaa61] font-bold text-xs sm:text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg uppercase tracking-wider cursor-pointer"
              >
                <Globe className="w-4 h-4 text-[#dbaa61]" />
                <span>Visit Website: bodytouch.site</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </div>
        </div>

        {/* Security / Notice banner */}
        <div className="bg-blue-950/15 border border-blue-900/40 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 shrink-0 mx-auto sm:mx-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Verification Notice / নির্দেশনা
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              সরাসরি অফিশিয়াল কন্টাক্ট এবং আমাদের ভেরিফাইড টেলিগ্রাম চ্যানেল ছাড়া অন্য কোনো থার্ড-পার্টি গ্রুপ বা ব্যক্তির নিকট লেনদেন করবেন না। বডি টাচ কখনোই কোনো অননুমোদিত চ্যানেলে পেমেন্ট গ্রহণ করবে না।
            </p>
          </div>
        </div>

        {/* Footer Brand Credit */}
        <p className="text-center text-[10px] text-slate-600 font-mono tracking-widest pt-4">
          SECURE CHANNEL MANAGEMENT • © BODYTOUCH VIP
        </p>
      </div>
    </div>
  );
};

