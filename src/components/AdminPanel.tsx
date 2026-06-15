import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentRecord, Companion, HotelLocation, Booking, EmailLog, PaymentGateway, ParentArea, ReferralRecord, WithdrawalRecord, MemberLevel } from '../types';
import { 
  ShieldCheck, 
  RefreshCw, 
  XCircle, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  Users, 
  Hotel, 
  Image as ImageIcon, 
  DollarSign, 
  Globe, 
  Layers,
  Save,
  X,
  Mail,
  Clock,
  Lock,
  CheckCircle2,
  Briefcase,
  LayoutDashboard,
  Copy,
  Check,
  ChevronRight,
  Server,
  Terminal,
  Search,
  ExternalLink,
  CreditCard,
  Menu,
  UserCheck,
  ShieldAlert,
  Link2,
  Award,
  Sparkles,
  TrendingUp,
  HandCoins
} from 'lucide-react';

interface AdminPanelProps {
  payments: PaymentRecord[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  companions: Companion[];
  onUpdateCompanions: (updated: Companion[]) => void;
  locations: HotelLocation[];
  onUpdateLocations: (updated: HotelLocation[]) => void;
  bookings: Booking[];
  onApproveBooking: (id: string) => void;
  onDeclineBooking: (id: string) => void;
  onMarkOutgoingBooking?: (id: string) => void;
  onMarkCompletedBooking?: (id: string) => void;
  emailLogs: EmailLog[];
  onClearEmailLogs: () => void;
  emailjsServiceId: string;
  onSetEmailjsServiceId: (id: string) => void;
  emailjsTemplateId: string;
  onSetEmailjsTemplateId: (id: string) => void;
  emailjsPublicKey: string;
  onSetEmailjsPublicKey: (id: string) => void;
  telegramBotToken: string;
  onSetTelegramBotToken: (token: string) => void;
  telegramGroupId: string;
  onSetTelegramGroupId: (id: string) => void;
  telegramHelpline?: string;
  onSetTelegramHelpline?: (helpline: string) => void;
  onApproveCompanion: (id: string) => void;
  onDeclineCompanion: (id: string) => void;
  onSendEmail?: (toEmail: string, subject: string, bodyText: string) => Promise<void>;
  cities?: string[];
  onUpdateCities?: (updated: string[]) => void;
  structuredCities?: ParentArea[];
  onUpdateStructuredCities?: (updated: ParentArea[]) => void;
  paymentGateways?: PaymentGateway[];
  onUpdatePaymentGateways?: (updated: PaymentGateway[]) => void;
  shortLinkStats?: {
    [key: string]: { clicks: number; joins: number };
  };
  pricingConfig?: {
    registrationFee: number;
    regularPlanFee: number;
    premiumPlanFee: number;
    elitePlanFee: number;
  };
  onUpdatePricingConfig?: (config: any) => void;
  referrals?: ReferralRecord[];
  onUpdateReferrals?: (updated: ReferralRecord[]) => void;
  withdrawals?: WithdrawalRecord[];
  onUpdateWithdrawals?: (updated: WithdrawalRecord[]) => void;
  categories?: string[];
  onUpdateCategories?: (updated: string[]) => void;
}

// Beautiful and elegant Unsplash placeholder images to select instantly
const PRESET_MODEL_IMAGES = [
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?auto=format&fit=crop&q=80&w=600'
];

const PRESET_HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=600'
];

export default function AdminPanel({ 
  payments, 
  onApprove, 
  onReject, 
  isOpen, 
  onClose,
  companions,
  onUpdateCompanions,
  locations,
  onUpdateLocations,
  bookings = [],
  onApproveBooking,
  onDeclineBooking,
  onMarkOutgoingBooking,
  onMarkCompletedBooking,
  emailLogs = [],
  onClearEmailLogs,
  emailjsServiceId,
  onSetEmailjsServiceId,
  emailjsTemplateId,
  onSetEmailjsTemplateId,
  emailjsPublicKey,
  onSetEmailjsPublicKey,
  telegramBotToken,
  onSetTelegramBotToken,
  telegramGroupId,
  onSetTelegramGroupId,
  telegramHelpline = 'BodyTouchSupport',
  onSetTelegramHelpline,
  onApproveCompanion,
  onDeclineCompanion,
  onSendEmail,
  cities = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi'],
  onUpdateCities,
  structuredCities = [],
  onUpdateStructuredCities,
  paymentGateways = [],
  onUpdatePaymentGateways,
  shortLinkStats = {
    'join-female-1': { clicks: 0, joins: 0 },
    'join-female-2': { clicks: 0, joins: 0 },
    'join-male-1': { clicks: 0, joins: 0 },
    'join-male-2': { clicks: 0, joins: 0 },
    'join-sparm-1': { clicks: 0, joins: 0 },
    'join-sparm-2': { clicks: 0, joins: 0 },
  },
  pricingConfig = {
    registrationFee: 3000,
    regularPlanFee: 10000,
    premiumPlanFee: 22000,
    elitePlanFee: 50000,
  },
  onUpdatePricingConfig,
  referrals = [],
  onUpdateReferrals,
  withdrawals = [],
  onUpdateWithdrawals,
  categories = ['Female Model', 'Male Model', 'Sperm Donor'],
  onUpdateCategories
}: AdminPanelProps) {
  
  if (!isOpen) return null;

  // Security gate authentication using sessionStorage
  const [isAuth, setIsAuth] = useState(() => {
    return sessionStorage.getItem('metro_maa_admin_auth') === 'true';
  });

  const [adminEmail, setAdminEmail] = useState(() => {
    return localStorage.getItem('metro_maa_admin_validated_email') || '';
  });
  const [otpSentCode, setOtpSentCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [authStep, setAuthStep] = useState<'email' | 'otp'>('email');
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showInUIWarning, setShowInUIWarning] = useState<string | null>(null);
  const [newCityInput, setNewCityInput] = useState('');
  const [newDivisionInput, setNewDivisionInput] = useState('');
  const [subAreaInputMap, setSubAreaInputMap] = useState<{[divisionId: string]: string}>({});
  const [citiesError, setCitiesError] = useState<string | null>(null);

  // Payment Gateway Forms State
  const [gwName, setGwName] = useState('');
  const [gwMethod, setGwMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [gwWalletType, setGwWalletType] = useState<'Personal' | 'Agent' | 'Merchant'>('Personal');
  const [gwNumber, setGwNumber] = useState('');
  const [gwInstructions, setGwInstructions] = useState('');
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);

  // Brand Logo Custom Upload State
  const [tempLogo, setTempLogo] = useState<string>(() => {
    return localStorage.getItem('bt_custom_logo') || '';
  });
  const [logoSaveSuccess, setLogoSaveSuccess] = useState(false);
  const [logoZoom, setLogoZoom] = useState(100); // percentage: 10% to 300%
  const [logoX, setLogoX] = useState(0); // offset pixels
  const [logoY, setLogoY] = useState(0); // offset pixels
  const [logoRotate, setLogoRotate] = useState(0); // degrees: 0 to 360
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleApplyCrop = () => {
    if (!tempLogo) return;
    setIsProcessingCrop(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 400, 400);
          // Dark background filler
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, 400, 400);

          ctx.save();
          // Circular clipping mask
          ctx.beginPath();
          ctx.arc(200, 200, 200, 0, Math.PI * 2);
          ctx.clip();

          // Apply Translation (Pan)
          ctx.translate(200 + logoX, 200 + logoY);
          // Apply Rotation
          ctx.rotate((logoRotate * Math.PI) / 180);

          // Base scaling logic so image covers canvas nicely
          const baseScale = Math.min(400 / img.width, 400 / img.height) || 1;
          const scale = (logoZoom / 100);
          const drawWidth = img.width * baseScale * scale;
          const drawHeight = img.height * baseScale * scale;

          // Render centered
          ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
          ctx.restore();

          const croppedBase64 = canvas.toDataURL('image/png');
          setTempLogo(croppedBase64);
          localStorage.setItem('bt_custom_logo', croppedBase64);
          window.dispatchEvent(new Event('bt_logo_updated'));

          // Reset positioning sliders
          setLogoZoom(100);
          setLogoX(0);
          setLogoY(0);
          setLogoRotate(0);

          setLogoSaveSuccess(true);
          setTimeout(() => setLogoSaveSuccess(false), 3000);
        }
      } catch (err) {
        console.error("Branding crop failed:", err);
        alert("লোগো ক্রপ করার প্রক্রিয়া ব্যর্থ হয়েছে। অনুগ্রহ করে অন্য ছবি দিয়ে চেষ্টা করুন।");
      } finally {
        setIsProcessingCrop(false);
      }
    };
    img.onerror = () => {
      setIsProcessingCrop(false);
      alert("ছবি থেকে ইমেজ ডাটা রিড করতে ব্যর্থ হয়েছে।");
    };
    img.src = tempLogo;
  };

  // Timer loop for countdown
  React.useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const [adminEmails, setAdminEmails] = useState<string[]>(() => {
    const stored = localStorage.getItem('bt_admin_emails');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return ['akhi.akther.ofc@gmail.com', 'admin@metromaa.com'];
  });

  const updateAdminEmails = (updated: string[]) => {
    setAdminEmails(updated);
    localStorage.setItem('bt_admin_emails', JSON.stringify(updated));
  };

  const generateNumericOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = adminEmail.trim().toLowerCase();
    
    if (!normalizedEmail) {
      setAuthError('দয়া করে একটি সঠিক ইমেল অ্যাড্রেস লিখুন।');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setAuthError('দয়া করে একটি সঠিক ইমেল ফরম্যাট ব্যবহার করুন (যেমন user@domain.com)।');
      return;
    }

    // STRICT Whitelist Security Check
    const isAllowed = adminEmails.map(e => e.toLowerCase()).includes(normalizedEmail);
    if (!isAllowed) {
      setAuthError('অ্যাক্সেস অস্বীকৃত! এই ইমেলটি পোর্টালের অনুমোদিত এডমিন তালিকায় নিবন্ধিত নয়। শুধুমাত্র প্রকৃত অনার ও এডমিনরাই সাইন-ইন করতে পারবেন।');
      return;
    }

    setIsSending(true);
    setAuthError('');
    setShowInUIWarning(null);

    const code = generateNumericOTP();
    const mailSubject = `🔒 Metro Maa Admin Portal: Secure 2FA Authentication Code`;
    const mailBody = `
========= METRO MAA SECURE NETWORK DIRECTORY =========

[CONFIDENTIAL CONTROL ACCESS SECTOR]

Your requested 2-Factor Authentication (2FA) verification code is:
👉 [ ${code} ]

For secure access login, enter this security OTP code.
The code is valid for 10 minutes. If you did not make this request, please lock the server terminal.

------------------------------------------------------
Timestamp: ${new Date().toUTCString()}
Secure Session: Active Ingress Gateway 3000
    `;

    try {
      if (onSendEmail) {
        await onSendEmail(normalizedEmail, mailSubject, mailBody);
      }
      
      setOtpSentCode(code);
      setAuthStep('otp');
      setCooldown(60); // 1 minute cooldown
      localStorage.setItem('metro_maa_admin_validated_email', normalizedEmail);

      // Secure in-app preview bypass ONLY for whitelisted emails,
      // and only if SMTP configs are missing!
      if (!emailjsServiceId || !emailjsTemplateId || !emailjsPublicKey) {
        setShowInUIWarning(code);
      }
    } catch (err: any) {
      console.error(err);
      setAuthError('ইমেল প্রেরণ ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = otpInput.trim();
    if (!cleanInput) {
      setAuthError('ভেরিফিকেশন কোড লিখুন।');
      return;
    }

    // STRICT Security check: Only allow either the real generated OTP, or a highly secure custom master passkey 'akhi@secure#admin'
    if (cleanInput === otpSentCode || cleanInput === 'akhi@secure#admin') {
      sessionStorage.setItem('metro_maa_admin_auth', 'true');
      setIsAuth(true);
      setAuthError('');
      setOtpInput('');
      setShowInUIWarning(null);
    } else {
      setAuthError('ভুল ভেরিফিকেশন কোড! দয়া করে আপনার মেইলে পাঠানো ৬ সংখ্যার কোডটি আবার দেখে সঠিকভাবে লিখুন।');
    }
  };

  // Render High Security Portal Gate if not authenticated
  if (!isAuth) {
    return (
      <div className="my-16 bg-[#090b11]/95 border border-red-500/30 rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(239,68,68,0.06)] max-w-md mx-auto font-sans animate-in fade-in zoom-in-95 duration-500">
        
        {/* Operations Terminal Header */}
        <div className="bg-[#0e111a] py-3.5 px-5 flex items-center justify-between text-xs text-slate-300 select-none border-b border-[#281313]/40">
          <div className="flex items-center gap-2 text-red-500 font-extrabold tracking-wider uppercase font-mono">
            <Lock className="w-3.5 h-3.5 animate-pulse" />
            <span>METRO MAA CRYPTO-OPS CONTROL</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Return to Site"
          >
            ✕
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 text-center bg-gradient-to-b from-[#090b11] to-[#040508]">
          {/* Logo / Badge */}
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-[#21090c]/80 border-2 border-red-500/40 rounded-2xl flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider font-display">CONFIDENTIAL GATEWAY</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              এটি একটি সুরক্ষিত অ্যাডমিন ডাটা সিকিউরিটি লেয়ার। ইমেলে <span className="text-red-500 font-bold">Two-Factor Authentication (2FA)</span> কোড পাঠিয়ে লগইন ভেরিফাই করা হবে।
            </p>
          </div>

          {authStep === 'email' ? (
            /* STEP 1: INPUT ACTIVE EMAIL */
            <form onSubmit={handleSendOTP} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black tracking-widest text-[#5c6985] uppercase">
                  ENTER REGISTERED SECURITY EMAIL *
                </label>
                
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500/60 font-medium">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="admin@metromaa.com"
                    className="w-full bg-[#05060a] border border-[#232a3d] hover:border-red-500/30 focus:border-red-500/60 rounded-xl !pl-12 pr-4 py-3 text-white text-sm font-sans placeholder-slate-700 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {authError && (
                <div className="bg-red-950/20 border border-red-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-semibold leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-[#fa1e27] hover:bg-red-550 text-white font-extrabold uppercase text-xs tracking-widest py-3.5 rounded-xl transition duration-300 shadow-lg shadow-red-950/30 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting secure SMTP tunnel...
                  </>
                ) : (
                  'REQUEST 2FA OTP SECURITY KEY'
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: VERIFY CODE */
            <form onSubmit={handleVerifyOTP} className="space-y-4 text-left">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black tracking-widest text-[#5d6a85] uppercase">
                    ENTER 6-DIGIT ACCESS OTP CODE *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('email');
                      setAuthError('');
                      setShowInUIWarning(null);
                    }}
                    className="text-xs text-red-400 hover:underline hover:text-red-300 font-bold text-right"
                  >
                    Change Email
                  </button>
                </div>
                
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/\D/g, ''));
                    if (authError) setAuthError('');
                  }}
                  autoFocus
                  placeholder="••••••"
                  className="w-full bg-[#05060a] border border-red-500/20 hover:border-red-500/35 focus:border-red-500/65 rounded-xl px-4 py-3.5 text-white text-center font-mono placeholder-slate-800 tracking-widest text-xl focus:outline-none transition-all uppercase"
                />
              </div>

              {authError && (
                <div className="bg-red-950/20 border border-red-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-semibold leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{authError}</span>
                </div>
              )}

              {showInUIWarning && (
                <div className="bg-amber-950/15 border border-amber-500/20 px-4 py-3.5 rounded-xl space-y-2.5 text-[11px] text-amber-200">
                  <p className="font-extrabold flex items-center gap-1.5 font-sans text-amber-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Development Mock Bypass Triggered</span>
                  </p>
                  <p className="leading-relaxed font-sans text-slate-300">
                    বর্তমানে আপনার SMTP সার্ভিস কী কনফিগার করা নেই। তাই ইমেলের পরিবর্তে সরাসরি স্ক্রিনেই ২এফএ কোডটি দেওয়া হল:
                  </p>
                  <div className="bg-black/65 py-2.5 rounded-lg border border-amber-500/10 text-center text-lg font-black tracking-widest text-white select-all font-mono">
                    {showInUIWarning}
                  </div>
                  <p className="text-[9.5px] leading-relaxed text-slate-400 font-sans">
                    মেইলে কোড পেতে অ্যাডমিন ড্যাশবোর্ডের <strong className="text-white">"SMTP Configuration"</strong> ট্যাবে আপনার মেইল আইডি এবং EmailJS সার্ভিস কী যুক্ত করে সেভ করুন।
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={handleSendOTP}
                  className="flex-1 bg-black/40 hover:bg-black/75 border border-[#161925] disabled:opacity-50 text-slate-300 text-[10px] font-black uppercase tracking-wider py-3.5 rounded-xl transition cursor-pointer text-center"
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition shadow-lg shadow-emerald-555/15 cursor-pointer text-center"
                >
                  Verify & Unlock
                </button>
              </div>
            </form>
          )}

          {/* Secure Details Tracker */}
          <div className="pt-3 border-t border-[#131622] flex justify-between items-center text-[8.5px] font-mono text-slate-500 text-left">
            <span>🖥️ DEPLOYED: CLOUD RUN</span>
            <span>🔒 SYSTEM TUNNEL: SSL-TLS</span>
          </div>
        </div>
      </div>
    );
  }

  // Tabs configured to align with User's specific requirements
  // Clint Management (payments), Partner Management (companions & career apps), Media (assets), Order (bookings)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'partners' | 'media' | 'orders' | 'hotels' | 'smtp' | 'cities' | 'gateways' | 'admins' | 'verification' | 'shortlinks' | 'referrals'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // States for Referral and Withdrawal Tracking Tab
  const [refSearch, setRefSearch] = useState('');
  const [withdSearch, setWithdSearch] = useState('');
  
  // States for manual referral generator
  const [newRefReferrer, setNewRefReferrer] = useState('');
  const [newRefUser, setNewRefUser] = useState('');
  const [newRefFullName, setNewRefFullName] = useState('');
  const [newRefPhone, setNewRefPhone] = useState('');
  const [newRefEmail, setNewRefEmail] = useState('');
  const [newRefTier, setNewRefTier] = useState<MemberLevel>('REGULAR');

  // States for manual withdrawal generator
  const [newWithdUser, setNewWithdUser] = useState('');
  const [newWithdAmount, setNewWithdAmount] = useState('');
  const [newWithdMethod, setNewWithdMethod] = useState('bKash Personal');
  const [newWithdAccount, setNewWithdAccount] = useState('');

  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const clientsList = useMemo(() => {
    const clientsMap: { [key: string]: any } = {};

    // 1. Scan bookings to extract actual client profiles filled out during the checkout process
    bookings.forEach(b => {
      const name = b.clientName || 'Unnamed Client';
      const phone = b.clientPhone || 'No Phone';
      const email = b.clientEmail || 'No Email';
      const photo = b.userPhoto || '';
      const nidFront = b.nidFront || '';
      const nidBack = b.nidBack || '';

      const key = `${name}-${phone}`.toLowerCase();
      if (!clientsMap[key]) {
        clientsMap[key] = {
          id: b.id + '-client-profile',
          name,
          phone,
          email,
          userPhoto: photo,
          nidFront,
          nidBack,
          bookingsCount: 0,
          bookings: []
        };
      }
      clientsMap[key].bookingsCount += 1;
      clientsMap[key].bookings.push(b);
      if (photo && !clientsMap[key].userPhoto) clientsMap[key].userPhoto = photo;
      if (nidFront && !clientsMap[key].nidFront) clientsMap[key].nidFront = nidFront;
      if (nidBack && !clientsMap[key].nidBack) clientsMap[key].nidBack = nidBack;
    });

    // 2. Add realistic seed files if there are no bookings yet to make sure the app doesn't start completely blank!
    if (Object.keys(clientsMap).length === 0) {
      clientsMap['akhi akther-01711223344'] = {
        id: 'client-1',
        name: 'Akhi Akther',
        phone: '+8801711223344',
        email: 'akhi.akther.ofc@gmail.com',
        userPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        nidFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=600',
        nidBack: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&q=80&w=600',
        bookingsCount: 1,
        bookings: []
      };
      clientsMap['tasnim ahmed-01723456789'] = {
        id: 'client-2',
        name: 'Tasnim Ahmed',
        phone: '+8801723456789',
        email: 'tasnim@gmail.com',
        userPhoto: '',
        nidFront: '',
        nidBack: '',
        bookingsCount: 0,
        bookings: []
      };
    }

    return Object.values(clientsMap);
  }, [bookings]);

  const [orderTierFilter, setOrderTierFilter] = useState<'ALL' | 'REGULAR' | 'PREMIUM' | 'ELITE'>('ALL');

  const getBookingTier = (book: Booking): 'REGULAR' | 'PREMIUM' | 'ELITE' | 'DEMO' => {
    // 1. Try to find the companion by modelName
    const companion = companions.find(c => c.name.toLowerCase() === book.modelName.toLowerCase());
    if (companion) {
      return companion.badge;
    }
    
    // 2. Fallback to inspecting the tag (common tags: "Class REGULAR", "Class PREMIUM", "Class ELITE")
    const tagUpper = book.modelTag.toUpperCase();
    if (tagUpper.includes('ELITE')) return 'ELITE';
    if (tagUpper.includes('PREMIUM')) return 'PREMIUM';
    if (tagUpper.includes('DEMO')) return 'DEMO';
    return 'REGULAR'; // Default fallback
  };
  
  // Media Vault State with default values (loaded from localStorage if present)
  const [customMedia, setCustomMedia] = useState<{ id: string; title: string; url: string; category: 'Portraits' | 'Hotel Interiors' | 'Promotional' }[]>(() => {
    const saved = localStorage.getItem('bt_custom_media');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading bt_custom_media:", e);
      }
    }
    const portraits = PRESET_MODEL_IMAGES.map((url, i) => ({
      id: `media-portrait-${i}`,
      title: `Model Portrait Preset ${i + 1}`,
      url,
      category: 'Portraits' as const
    }));
    const hotels = PRESET_HOTEL_IMAGES.map((url, i) => ({
      id: `media-hotel-${i}`,
      title: `Luxury Suite Sanctuary ${i + 1}`,
      url,
      category: 'Hotel Interiors' as const
    }));
    return [...portraits, ...hotels];
  });

  // Save custom media changes to localStorage
  useEffect(() => {
    localStorage.setItem('bt_custom_media', JSON.stringify(customMedia));
  }, [customMedia]);

  // Media upload form state
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaCategory, setNewMediaCategory] = useState<'Portraits' | 'Hotel Interiors' | 'Promotional'>('Portraits');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic pricing editable values
  const [localRegFee, setLocalRegFee] = useState(pricingConfig.registrationFee);
  const [localRegularFee, setLocalRegularFee] = useState(pricingConfig.regularPlanFee);
  const [localPremiumFee, setLocalPremiumFee] = useState(pricingConfig.premiumPlanFee);
  const [localEliteFee, setLocalEliteFee] = useState(pricingConfig.elitePlanFee);
  const [pricingSuccess, setPricingSuccess] = useState(false);

  // Search inside media
  const [mediaSearch, setMediaSearch] = useState('');

  // Companion form states
  const [editingCompanionId, setEditingCompanionId] = useState<string | null>(null);
  const [showCompanionForm, setShowCompanionForm] = useState(false);
  const [compName, setCompName] = useState('');
  const [compAge, setCompAge] = useState(22);
  const [compHeight, setCompHeight] = useState("5'5\"");
  const [compBodyColor, setCompBodyColor] = useState('');
  const [compWeight, setCompWeight] = useState('');
  const [compBust, setCompBust] = useState('');
  const [compWaist, setCompWaist] = useState('');
  const [compHip, setCompHip] = useState('');
  const [compLanguages, setCompLanguages] = useState('English, Bengali');
  const [compSpecialty, setCompSpecialty] = useState('');
  const [compRate, setCompRate] = useState(8000);
  const [compRateReal, setCompRateReal] = useState<string | number>('');
  const [compRateCam, setCompRateCam] = useState<string | number>('');
  const [compRateMakeOut, setCompRateMakeOut] = useState<string | number>('');
  const [compRateLiveTogether, setCompRateLiveTogether] = useState<string | number>('');
  const [compCity, setCompCity] = useState('Dhaka');
  const [compBadge, setCompBadge] = useState<'DEMO' | 'REGULAR' | 'PREMIUM' | 'ELITE'>('REGULAR');
  const [compImage, setCompImage] = useState('');
  const [compCategory, setCompCategory] = useState<string>('Female Model');

  // Location form states
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locName, setLocName] = useState('');
  const [locStar, setLocStar] = useState('5 STAR');
  const [locCity, setLocCity] = useState('Dhaka');
  const [locImage, setLocImage] = useState('');
  const [locDesc, setLocDesc] = useState('');
  const [locPrice, setLocPrice] = useState<string | number>('8000');
  const [locMapEmbedUrl, setLocMapEmbedUrl] = useState('');

  // Partner filter (Active database vs Applicants)
  const [partnerSubTab, setPartnerSubTab] = useState<'active' | 'applicants'>('active');
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<string>('Female Model');

  // Model Verification Sub tab / filters
  const [verifySearch, setVerifySearch] = useState('');
  const [verifyCategoryFilter, setVerifyCategoryFilter] = useState<string>('ALL');
  const [verifyCityFilter, setVerifyCityFilter] = useState('ALL');
  const [verifyEditingConfig, setVerifyEditingConfig] = useState<{ [id: string]: { badge: 'DEMO' | 'REGULAR' | 'PREMIUM' | 'ELITE', rate: number, rateReal?: number, rateCam?: number, rateLiveTogether?: number } }>({});

  const pendingPaymentsList = payments.filter((p) => p.status === 'Pending Verification');
  const pendingApplicantsList = companions.filter(c => c.status === 'Pending');
  const pendingBookingsList = bookings.filter(b => b.status === 'Awaiting Dispatch');

  // Triggered when copying elements
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Triggered when editing a companion
  const handleEditCompanion = (comp: Companion) => {
    setEditingCompanionId(comp.id);
    setCompName(comp.name);
    setCompAge(comp.age);
    setCompHeight(comp.height);
    setCompBodyColor(comp.bodyColor || '');
    setCompWeight(comp.weight || '');
    setCompBust(comp.bust || '');
    setCompWaist(comp.waist || '');
    setCompHip(comp.hip || '');
    setCompLanguages(comp.languages.join(', '));
    setCompSpecialty(comp.specialty);
    setCompRate(comp.rate);
    setCompRateReal(comp.rateReal !== undefined ? comp.rateReal : '');
    setCompRateCam(comp.rateCam !== undefined ? comp.rateCam : '');
    setCompRateMakeOut(comp.rateMakeOut !== undefined ? comp.rateMakeOut : '');
    setCompRateLiveTogether(comp.rateLiveTogether !== undefined ? comp.rateLiveTogether : '');
    setCompCity(comp.city || 'Dhaka');
    setCompBadge(comp.badge);
    setCompImage(comp.image);
    setCompCategory(comp.category || 'Female Model');
    setShowCompanionForm(true);
    setPartnerSubTab('active');
  };

  // Reset companion form
  const resetCompanionForm = () => {
    setEditingCompanionId(null);
    setCompName('');
    setCompAge(22);
    setCompHeight("5'5\"");
    setCompBodyColor('');
    setCompWeight('');
    setCompBust('');
    setCompWaist('');
    setCompHip('');
    setCompLanguages('English, Bengali');
    setCompSpecialty('');
    setCompRate(8000);
    setCompRateReal('');
    setCompRateCam('');
    setCompRateMakeOut('');
    setCompRateLiveTogether('');
    setCompCity('Dhaka');
    setCompBadge('REGULAR');
    setCompImage('');
    setCompCategory('Female Model');
    setShowCompanionForm(false);
  };

  // Save/Add companion
  const handleSaveCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;

    const languagesArray = compLanguages.split(',').map(lang => lang.trim()).filter(Boolean);
    const finalImage = compImage.trim() || PRESET_MODEL_IMAGES[Math.floor(Math.random() * PRESET_MODEL_IMAGES.length)];

    const rReal = compRateReal !== '' ? Number(compRateReal) : undefined;
    const rCam = compRateCam !== '' ? Number(compRateCam) : undefined;
    const rMakeOut = compRateMakeOut !== '' ? Number(compRateMakeOut) : undefined;
    const rLiveTogether = compRateLiveTogether !== '' ? Number(compRateLiveTogether) : undefined;

    if (editingCompanionId) {
      // Edit existing
      const updatedList = companions.map(comp => {
        if (comp.id === editingCompanionId) {
          return {
            ...comp,
            name: compName,
            age: Number(compAge),
            height: compHeight,
            bodyColor: compBodyColor || undefined,
            weight: compWeight || undefined,
            bust: compBust || undefined,
            waist: compWaist || undefined,
            hip: compHip || undefined,
            languages: languagesArray,
            specialty: compSpecialty,
            rate: Number(compRate),
            rateReal: rReal,
            rateCam: rCam,
            rateMakeOut: rMakeOut,
            rateLiveTogether: rLiveTogether,
            city: compCity,
            badge: compBadge,
            image: finalImage,
            category: compCategory
          };
        }
        return comp;
      });
      onUpdateCompanions(updatedList);
    } else {
      // Create new
      const newId = 'comp-' + Date.now();
      const newTag = '# ' + Math.floor(100000 + Math.random() * 900000);
      const newComp: Companion = {
        id: newId,
        name: compName,
        tag: newTag,
        badge: compBadge,
        image: finalImage,
        age: Number(compAge),
        height: compHeight,
        bodyColor: compBodyColor || undefined,
        weight: compWeight || undefined,
        bust: compBust || undefined,
        waist: compWaist || undefined,
        hip: compHip || undefined,
        languages: languagesArray,
        specialty: compSpecialty || 'Executive High-Society VIP Hostess',
        rate: Number(compRate),
        rateReal: rReal,
        rateCam: rCam,
        rateMakeOut: rMakeOut,
        rateLiveTogether: rLiveTogether,
        city: compCity,
        status: 'Approved',
        category: compCategory
      };
      onUpdateCompanions([newComp, ...companions]);
    }

    resetCompanionForm();
  };

  // Delete companion
  const handleDeleteCompanion = (id: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this companion profile?");
    if (isConfirmed) {
      const filtered = companions.filter(c => c.id !== id);
      onUpdateCompanions(filtered);
    }
  };

  // Triggered when editing a hotel location
  const handleEditLocation = (loc: HotelLocation) => {
    setEditingLocationId(loc.id);
    setLocName(loc.name);
    setLocStar(loc.star);
    setLocCity(loc.location);
    setLocImage(loc.image);
    setLocDesc(loc.description);
    setLocPrice(loc.price || 8000);
    setLocMapEmbedUrl(loc.mapEmbedUrl || '');
    setShowLocationForm(true);
  };

  // Reset hotel location form
  const resetLocationForm = () => {
    setEditingLocationId(null);
    setLocName('');
    setLocStar('5 STAR');
    setLocCity('Dhaka');
    setLocImage('');
    setLocDesc('');
    setLocPrice('8000');
    setLocMapEmbedUrl('');
    setShowLocationForm(false);
  };

  // Save/Add hotel location
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;

    const finalImage = locImage.trim() || PRESET_HOTEL_IMAGES[Math.floor(Math.random() * PRESET_HOTEL_IMAGES.length)];

    if (editingLocationId) {
       // Edit existing
      const updatedList = locations.map(loc => {
        if (loc.id === editingLocationId) {
          return {
            ...loc,
            name: locName,
            star: locStar,
            location: locCity,
            image: finalImage,
            description: locDesc,
            price: Number(locPrice) || 8000,
            mapEmbedUrl: locMapEmbedUrl.trim() || undefined
          };
        }
        return loc;
      });
      onUpdateLocations(updatedList);
    } else {
      // Create new
      const newId = 'loc-' + Date.now();
      const newLoc: HotelLocation = {
        id: newId,
        name: locName,
        star: locStar,
        location: locCity,
        image: finalImage,
        description: locDesc || 'Premium high-security hotel sanctuary designed for extreme confidentiality.',
        price: Number(locPrice) || 8000,
        mapEmbedUrl: locMapEmbedUrl.trim() || undefined
      };
      onUpdateLocations([...locations, newLoc]);
    }

    resetLocationForm();
  };

  // Delete hotel
  const handleDeleteLocation = (id: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this hotel sanctuary?");
    if (isConfirmed) {
      const filtered = locations.filter(l => l.id !== id);
      onUpdateLocations(filtered);
    }
  };

  // Add custom media
  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) return;
    const newMedia = {
      id: `media-custom-${Date.now()}`,
      title: newMediaTitle.trim() || `Asset Upload ${customMedia.length + 1}`,
      url: newMediaUrl.trim(),
      category: newMediaCategory
    };
    setCustomMedia([newMedia, ...customMedia]);
    setNewMediaTitle('');
    setNewMediaUrl('');
  };

  const handleRemoveMedia = (id: string) => {
    setCustomMedia(customMedia.filter(m => m.id !== id));
  };

  // Filter media based on search
  const filteredMedia = customMedia.filter(m => 
    m.title.toLowerCase().includes(mediaSearch.toLowerCase()) || 
    m.category.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  // Helper to render the sidebar navigation content (shared between desktop and mobile drawer)
  const renderSidebarContent = (isMobile: boolean = false) => {
    const handleNavItemClick = (tab: typeof activeTab) => {
      setActiveTab(tab);
      if (isMobile) {
        setIsMobileSidebarOpen(false);
      }
    };

    return (
      <div className="flex flex-col h-full justify-between overflow-y-auto">
        <div className="flex flex-col">
          {/* Dynamic System Specs Box */}
          <div className="p-4 bg-gradient-to-r from-red-950/10 to-transparent text-white flex items-center justify-between border-b border-[#161a24]">
            <div className="flex items-center gap-2.5 text-left font-semibold">
              <Server className="w-4 h-3.5 text-red-500 animate-pulse" />
              <span className="font-black tracking-widest text-[11px] uppercase text-red-105">CORE COMMAND CHANNELS</span>
            </div>
            {isMobile ? (
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-lg transition active:scale-95"
                title="Close Navigation"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-[10px] bg-red-500/10 text-red-400 font-mono font-bold px-1.5 py-0.5 rounded border border-red-500/20">LINKED</span>
            )}
          </div>

          {/* Menu categories */}
          <div className="p-3 border-b border-[#131722] bg-black/10 text-left">
            <span className="text-[9px] text-[#5c6985] font-black uppercase tracking-[0.2em] block px-1">OPS COMMAND SECTIONS</span>
          </div>

          <nav className="p-2.5 space-y-1 text-slate-300">
            {/* Dashboard */}
            <button
              onClick={() => handleNavItemClick('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'dashboard'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0 text-red-500" />
                <span>Dashboard Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>

            {/* Client Management */}
            <button
              onClick={() => handleNavItemClick('clients')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'clients'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0 text-red-500" />
                <span>Client Management</span>
              </div>
              {pendingPaymentsList.length > 0 &&
                <span className="bg-red-650 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none animate-pulse">
                  {pendingPaymentsList.length}
                </span>
              }
            </button>

            {/* Partner Management */}
            <button
              onClick={() => handleNavItemClick('partners')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'partners'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 shrink-0 text-red-500" />
                <span>Partner Management</span>
              </div>
              {pendingApplicantsList.length > 0 ? (
                <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
                  {pendingApplicantsList.length} App
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  {companions.length} Active
                </span>
              )}
            </button>

            {/* Model Verification Tab */}
            <button
              onClick={() => handleNavItemClick('verification')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'verification'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 shrink-0 text-red-500" />
                <span>Model Verification</span>
              </div>
              {pendingApplicantsList.length > 0 ? (
                <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none animate-pulse">
                  {pendingApplicantsList.length} Pending
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold font-mono">
                  All Checked
                </span>
              )}
            </button>

            {/* Media Card */}
            <button
              onClick={() => handleNavItemClick('media')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'media'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 shrink-0 text-red-500" />
                <span>Media Bank / Presets</span>
              </div>
              <span className="bg-indigo-650/30 text-indigo-200 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {customMedia.length}
              </span>
            </button>

            {/* Orders */}
            <button
              onClick={() => handleNavItemClick('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'orders'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 shrink-0 text-red-500" />
                <span>Order Dispatches</span>
              </div>
              {pendingBookingsList.length > 0 &&
                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none animate-pulse">
                  {pendingBookingsList.length} New
                </span>
              }
            </button>

            {/* Hotels */}
            <button
              onClick={() => handleNavItemClick('hotels')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'hotels'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Hotel className="w-4 h-4 shrink-0 text-red-500" />
                <span>Hotel Sanctuaries</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{locations.length} suite</span>
            </button>

            {/* Cities & Regions */}
            <button
              onClick={() => handleNavItemClick('cities')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'cities'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 shrink-0 text-red-500" />
                <span>Cities & Areas</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{cities.length} areas</span>
            </button>

            {/* Payment Gateways */}
            <button
              onClick={() => handleNavItemClick('gateways')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'gateways'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 shrink-0 text-red-500" />
                <span>Payment Gateways</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{paymentGateways.length} active</span>
            </button>

            {/* Manage Admins */}
            <button
              onClick={() => handleNavItemClick('admins')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'admins'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0 text-red-500" />
                <span>Administrative Team</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{adminEmails.length} staff</span>
            </button>

            {/* Mail SMTP Logs */}
            <button
              onClick={() => handleNavItemClick('smtp')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'smtp'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-red-500" />
                <span>SMTP & Branding Settings</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold font-mono">{emailLogs.length} logs</span>
            </button>

            {/* shortlinks */}
            <button
              onClick={() => handleNavItemClick('shortlinks')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'shortlinks'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Link2 className="w-4 h-4 shrink-0 text-red-500" />
                <span>Registration Short Links</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold font-mono">3 links</span>
            </button>

            {/* Referrals & Affiliate Tracking */}
            <button
              onClick={() => handleNavItemClick('referrals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${
                activeTab === 'referrals'
                  ? 'bg-red-950/40 border border-red-500/25 text-white font-heavy shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 shrink-0 text-red-500" />
                <span>Affiliate Referrals</span>
              </div>
              <span className="text-[10px] bg-red-500/10 text-red-400 font-bold font-mono px-1.5 py-0.5 rounded border border-red-500/20">
                {referrals.length} Joins
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 bg-[#0a0b10] border-t border-[#131722] text-[10px] text-slate-500 space-y-1.5 text-left font-mono">
          <p className="flex items-center justify-between">
            <span>🛡️ Active Session: SECURE</span>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('metro_maa_admin_auth');
                setIsAuth(false);
              }}
              className="text-red-400 hover:text-red-300 font-extrabold hover:underline underline-offset-2 transition ml-1"
              title="Lock admin session immediately"
            >
              [LOCK]
            </button>
          </p>
          <p>🖥️ Port: 3000 Ingress</p>
          <p>⚙️ Engine: Node.js CMS V1</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#07080c] font-sans flex flex-col text-slate-100 animate-in fade-in duration-300 relative">
      
      {/* Mobile/Tablet Drawer Backdrop & Sliding Nav */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-[285px] max-w-[85vw] bg-[#0a0b10] border-r border-[#161a24] z-50 shadow-[10px_0_40px_rgba(0,0,0,0.8)] lg:hidden flex flex-col"
            >
              {renderSidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Real-time Secure Core Ops Header */}
      <div className="bg-[#0b0c10] border-b border-[#161a24] py-3.5 px-4 sm:px-6 flex items-center justify-between text-xs text-slate-300 select-none">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none max-w-[70%] lg:max-w-none">
          
          {/* Hamburger Menu Toggler for Mobile/Tablet */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden text-slate-300 hover:text-white p-2 hover:bg-slate-800/20 active:bg-slate-800/40 rounded-xl border border-[#161a24] active:scale-95 transition-all outline-none"
            title="Toggle Secure Operations Navigation"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* Executive Shield Logo */}
          <div className="flex items-center gap-2.5 font-extrabold text-white shrink-0">
            <div className="w-8 h-8 rounded-lg bg-red-650/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span className="tracking-widest uppercase text-xs font-black sm:text-sm">METRO MAA OPERATIONS COMMAND</span>
            <span className="hidden sm:inline-flex bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
              CONFIDENTIAL CONTROL
            </span>
          </div>

          <div className="hidden lg:block h-5 w-px bg-slate-800" />

          <div className="hidden lg:flex items-center gap-4.5 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer">
              🟢 SYSTEM GATEWAY: ONLINE
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer">
              🛡️ SECURE ENCRYPTION DETECTED
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex bg-[#030903] border border-emerald-500/15 text-[#52d37c] text-[9.5px] font-mono px-3 py-1 rounded-md items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SECURE ROUTE: ACTIVE (PORT 3000)
          </span>
          <button 
            onClick={onClose}
            className="text-slate-205 hover:text-white font-heavy text-xs h-9 px-3 sm:px-4 bg-red-950/20 hover:bg-red-950/35 border border-red-500/20 hover:border-red-500/40 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shrink-0"
            title="Log out and return to site"
          >
            <span className="hidden sm:inline">Exit to Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 min-h-[640px] w-full relative">
        
        {/* DESKTOP SIDEBAR NAVIGATION - Hidden completely on mobile/tablet below lg breakpoint */}
        <div className="hidden lg:flex lg:col-span-3 xl:col-span-2.5 bg-[#0a0b10] border-r border-[#161a24] flex-col justify-between">
          {renderSidebarContent(false)}
        </div>

        {/* RIGHT DISPLAY PANEL - Takes full width on mobile/tablet, and lg:col-span-9/xl:col-span-9.5 on PC */}
        <div className="col-span-full lg:col-span-9 xl:col-span-9.5 p-4 sm:p-8 lg:p-10 space-y-8 bg-[#07080c] min-h-screen overflow-y-auto">
          
          {/* Active section header mapping */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2333] pb-5">
            <div className="text-left">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight font-display flex items-center gap-2">
                {activeTab === 'dashboard' && 'SYSTEM DASHBOARD'}
                {activeTab === 'clients' && 'CLIENTS & MEMBERSHIP TRANSACTION LEDGER'}
                {activeTab === 'partners' && 'PARTNER & MODEL PROFILE MANAGEMENT'}
                {activeTab === 'media' && 'MEDIA LIBRARY & ASSETS STORAGE'}
                {activeTab === 'orders' && 'ORDER MANAGEMENT & DISPATCH QUEUE'}
                {activeTab === 'hotels' && 'HOTEL SANCTUARY DATABASE'}
                {activeTab === 'cities' && 'CITIES & OPERATIONAL AREA DIRECTORY'}
                {activeTab === 'gateways' && 'PAYMENT GATEWAYS AND LIMITS'}
                {activeTab === 'verification' && 'MODEL APPLICATIONS VERIFICATION (মডেল যাচাইকরণ)'}
                {activeTab === 'admins' && 'ADMINISTRATIVE TEAM DIRECTORY'}
                {activeTab === 'smtp' && 'SMTP ROUTER & SITE BRANDING SETTINGS'}
                {activeTab === 'shortlinks' && 'REGISTRATION SHORT LINKS DIRECTORY'}
                {activeTab === 'referrals' && 'AFILLIATE REFERRALS & PAYOUTS LEDGER'}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {activeTab === 'shortlinks' && 'View, test, and copy user registration and application forms for different model types.'}
                {activeTab === 'dashboard' && 'Global system overview, telemetry statistics, and quick-action shortcuts.'}
                {activeTab === 'clients' && 'Review manual transaction tickets submitted by clients to activate VIP badges.'}
                {activeTab === 'partners' && 'Manage model dispatch statuses, review talent applications, register profile criteria.'}
                {activeTab === 'media' && 'Store and retrieve high-fidelity portal assets. Quick click copies secure URLs.'}
                {activeTab === 'orders' && 'Process active VIP client bookings, authorize dispatch, sync notifications.'}
                {activeTab === 'hotels' && 'Configure designated private hotels and luxury safehouses.'}
                {activeTab === 'cities' && 'Manage urban locations and regional dispatch boundaries. Add or remove operational areas.'}
                {activeTab === 'gateways' && 'Add or change active payment gateways, set wallet roles (Personal, Agent, Merchant), and write custom instructions.'}
                {activeTab === 'verification' && 'Review, edit, reject, or verify and approve incoming Model or Companion applications.'}
                {activeTab === 'admins' && 'Add or change authorized administrator emails to control secure 2FA dashboard entry.'}
                {activeTab === 'smtp' && 'Configure EmailJS keys, upload custom brand logos, and view outgoing delivery mails.'}
                {activeTab === 'referrals' && 'Audit affiliate registration chains, track downline user levels, manage payout commissions, and process bKash/Nagad withdrawals.'}
              </p>
            </div>
          </div>

          {/* =======================================================
              DASHBOARD OVERVIEW TAB
             ======================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-left">
              
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-[#11131c] border border-blue-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-blue-400">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Members</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-white">{payments.filter(p => p.status === 'Approved').length}</h3>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Active Premium Tier</p>
                  </div>
                </div>

                <div className="bg-[#11131c] border border-emerald-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Partners</span>
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-white">{companions.filter(c => c.status !== 'Pending').length}</h3>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Dispatched Models</p>
                  </div>
                </div>

                <div className="bg-[#11131c] border border-pink-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-pink-400">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Media Assets</span>
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-white">{customMedia.length}</h3>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Copyable Preset URLs</p>
                  </div>
                </div>

                <div className="bg-[#11131c] border border-indigo-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-indigo-400">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Orders</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-3xl font-black text-white">{bookings.length}</h3>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Dispatches processed</p>
                  </div>
                </div>

              </div>

              {/* Bangla Welcome Banner and Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                <div className="col-span-full md:col-span-7 bg-gradient-to-br from-[#121626] to-[#0a0d17] border border-blue-500/15 p-6 rounded-3xl flex flex-col justify-between">
                  <div>
                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[8.5px] font-mono tracking-widest px-2 py-0.5 rounded font-black uppercase">SYSTEM ONLINE</span>
                    <h3 className="text-xl font-extrabold text-white mt-3 leading-tight">স্বাগতম, মেট্রো মা অ্যাডমিন প্যানেল!</h3>
                    <p className="text-xs text-slate-350 leading-relaxed font-semibold mt-2">
                      এই কন্ট্রোল প্যানেল থেকে আপনি মেম্বার ট্রানজেকশন (Client), পার্টনার প্রফাইল (Partner Models), মিডিয়া লাইব্রেরি (Media Gallery), এবং বুকিং অর্ডার ও SMTP ইমেল সার্ভিস পুরোপুরি নিয়ন্ত্রণ করতে পারবেন। বাম পাশের ক্যাটাগরি মেনু ব্যবহার করে যেকোনো সেকশনে প্রবেশ করুন।
                    </p>
                  </div>
                  <div className="pt-5 border-t border-blue-500/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Admin Level Support Active</span>
                    <span className="text-[#3b82f6]">Secure-Port SSL</span>
                  </div>
                </div>

                <div className="col-span-full md:col-span-5 bg-[#12141c] border border-[#1b1e2a] p-5 rounded-3xl space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">⚡ QUICK SHORTCUTS</h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    
                    <button
                      onClick={() => setActiveTab('clients')}
                      className="bg-black/30 hover:bg-black/60 border border-slate-800 hover:border-slate-700 py-3 px-4 rounded-xl text-left text-white font-semibold transition flex items-center justify-between"
                    >
                      <span>Process {pendingPaymentsList.length} Pending Clients</span>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => { setActiveTab('partners'); setShowCompanionForm(true); setPartnerSubTab('active'); }}
                      className="bg-black/30 hover:bg-black/60 border border-slate-800 hover:border-slate-700 py-3 px-4 rounded-xl text-left text-white font-semibold transition flex items-center justify-between"
                    >
                      <span>Register New Partner Companion</span>
                      <Plus className="w-4 h-4 text-emerald-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('media')}
                      className="bg-black/30 hover:bg-black/60 border border-slate-800 hover:border-slate-700 py-3 px-4 rounded-xl text-left text-white font-semibold transition flex items-center justify-between"
                    >
                      <span>View Custom Media Bank</span>
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                    </button>

                  </div>
                </div>

              </div>

              {/* Ticker Logs Area for Brutalist/Tech aesthetic */}
              <div className="bg-[#05060b] border border-red-500/5 rounded-2xl p-4 font-mono text-[10px] text-slate-500 space-y-1.5 leading-normal">
                <div className="flex items-center gap-1.5 text-blue-500 font-bold border-b border-white/5 pb-1.5 mb-2 uppercase">
                  <Terminal className="w-4 h-4" />
                  <span>Real-time Secure Operations Ticker</span>
                </div>
                <p><span className="text-emerald-500">[2026-06-08 08:32]</span> - CMS Core Connection Establish successfully with Port 3000 Ingress Router.</p>
                <p><span className="text-emerald-500">[2026-06-08 08:30]</span> - EmailJS dispatch daemon initialized inside Hostinger memory.</p>
                <p><span className="text-blue-500">[2026-06-08 07:44]</span> - Admin Secure Hash matching confirmed for route <strong className="text-blue-300">/theadmin</strong>.</p>
              </div>

            </div>
          )}

          {/* =======================================================
              CLINT / CLIENT MANAGEMENT TAB
             ======================================================= */}
          {activeTab === 'clients' && (
            <div className="space-y-5 text-left">
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                মেট্রো মা গ্রাহকদের ট্রানজেকশন তালিকা নিচে দেওয়া হলো। অ্যাডমিন হিসেবে ট্রানজেকশন আইডি মিলিয়ে মেম্বার সেকশন 
                <strong className="text-emerald-400"> Approve </strong> (VIP এক্টিভেশন টিকিট) অথবা <strong className="text-rose-400"> Reject </strong> করুন।
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingPaymentsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    🚀 NO PENDING TRANSACTION TICKETS TO VERIFY
                  </div>
                ) : (
                  pendingPaymentsList.map((pay) => (
                    <div
                      key={pay.id}
                      className="bg-[#11131a] border border-blue-500/15 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-500/30 transition-all font-sans"
                    >
                      <div className="flex justify-between items-start text-xs border-b border-white/5 pb-3">
                        <div>
                          <p className="text-white font-extrabold text-sm font-sans">
                            Client: <span className="text-blue-400 font-mono font-bold select-all">{pay.username}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-black tracking-normal uppercase mt-1">
                            {pay.tierName} • {pay.method}
                          </p>
                        </div>
                        <span className="text-emerald-400 font-black font-mono text-base bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                          ৳ {pay.price}
                        </span>
                      </div>

                      <div className="bg-black/40 p-3 rounded-xl border border-blue-550/10 text-[11px] flex justify-between items-center font-mono">
                        <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider">Trx ID:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-extrabold tracking-normal select-all">{pay.trxId}</span>
                          <button
                            onClick={() => handleCopyToClipboard(pay.trxId, pay.id)}
                            className="text-slate-500 hover:text-white transition"
                            title="Copy TrxID"
                          >
                            {copiedId === pay.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2.5 pt-1">
                        <button
                          onClick={() => onReject(pay.id)}
                          className="flex-1 bg-rose-955/30 hover:bg-rose-950/80 border border-rose-500/20 hover:border-rose-500/55 text-rose-400 text-[10.5px] font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => onApprove(pay.id)}
                          className="flex-1 bg-emerald-955/30 hover:bg-emerald-950/80 border border-emerald-500/20 hover:border-emerald-500/55 text-emerald-400 text-[10.5px] font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                        >
                          Approve Payment
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* History area of payments */}
              <div className="bg-[#11131a] border border-[#1b1e2a] p-4.5 rounded-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] mb-3">Verified Transaction History logs</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {payments.filter(p => p.status !== 'Pending Verification').length === 0 ? (
                    <p className="text-[10px] text-slate-500 font-semibold italic text-center py-4">No verified records yet inside logs</p>
                  ) : (
                    payments.filter(p => p.status !== 'Pending Verification').map(pay => (
                      <div key={pay.id} className="bg-black/25 p-2 px-3 rounded-xl flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className={pay.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}>●</span>
                          <span className="text-slate-300 font-bold">{pay.username}</span>
                          <span className="text-slate-500 font-medium">({pay.tierName})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">৳{pay.price}</span>
                          <span className={`text-[9px] font-bold uppercase ${pay.status === 'Approved' ? 'text-emerald-500' : 'text-rose-500'}`}>{pay.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Registered Client Profiles Directory */}
              <div className="bg-[#11131a] border border-[#1b1e2a] p-4.5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Registered Client Profiles Directory / গ্রাহক ডাটাবেজ</h4>
                    <p className="text-[9px] text-slate-500 font-medium">বুকিং করার সময় গ্রাহকদের থেকে সংগৃহীত বিস্তারিত তথ্যাদি</p>
                  </div>
                  <span className="bg-blue-500/10 text-blue-400 text-[10px] font-black font-mono px-2.5 py-1 rounded-lg border border-blue-500/15">
                    {clientsList.length} Clients
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {clientsList.map((client) => (
                    <button
                      type="button"
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="bg-black/25 hover:bg-black/50 border border-blue-500/10 hover:border-blue-500/35 p-3.5 rounded-xl flex items-center gap-3 transition text-left w-full cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-xs font-black text-blue-400 overflow-hidden shrink-0">
                        {client.userPhoto ? (
                          <img src={client.userPhoto} alt={client.name} className="w-full h-full object-cover" />
                        ) : (
                          client.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-black group-hover:text-blue-400 transition truncate">{client.name}</p>
                        <p className="text-[10px] text-slate-400 truncate font-mono">{client.phone}</p>
                        <p className="text-[9px] text-[#5c75ab] font-bold uppercase tracking-wider mt-0.5">
                          {client.bookingsCount} {client.bookingsCount === 1 ? 'Service' : 'Services'} booked
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Client Information Modal */}
              <AnimatePresence>
                {selectedClient && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#020510]/95 backdrop-blur-md flex items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#0b0f19] border border-blue-500/20 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 text-left shadow-2xl relative font-sans scrollbar-none"
                    >
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={() => setSelectedClient(null)}
                        className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Header containing name & primary avatar */}
                      <div className="flex items-center gap-4.5 pb-5 border-b border-white/5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-500/5 border-2 border-blue-500/20 flex items-center justify-center text-xl sm:text-2xl font-black text-blue-400 overflow-hidden shadow-inner shrink-0">
                          {selectedClient.userPhoto ? (
                            <img src={selectedClient.userPhoto} alt={selectedClient.name} className="w-full h-full object-cover" />
                          ) : (
                            selectedClient.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-500/25 tracking-widest block w-fit">
                            Client Profile
                          </span>
                          <h3 className="text-lg sm:text-xl font-black text-white leading-tight truncate mt-1">
                            {selectedClient.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Registered via Scheduler Platform
                          </p>
                        </div>
                      </div>

                      {/* Form Details in elegant display */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">FULL NAME / গ্রাহকের নাম</span>
                          <span className="text-xs text-white font-black block mt-1 select-all">{selectedClient.name}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">PHONE NUMBER / মোবাইল নম্বর</span>
                          <span className="text-xs text-emerald-400 font-mono font-black block mt-1 select-all">{selectedClient.phone}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-2">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">EMAIL ADDRESS / ইমেইল</span>
                          <span className="text-xs text-blue-400 font-mono font-black block mt-1 select-all">{selectedClient.email}</span>
                        </div>
                      </div>

                      {/* NID Section */}
                      <div className="space-y-3.5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Verification Documents / ভেরিফিকেশন ডকুমেন্ট</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Front image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID Card Front / সামনের অংশ</span>
                            {selectedClient.nidFront ? (
                              <a href={selectedClient.nidFront} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-blue-500/10">
                                <img src={selectedClient.nidFront} alt="NID Front" className="w-full h-32 object-cover rounded-xl group-hover:scale-105 transition duration-300" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold text-white">
                                  Click to Open Full View ↗
                                </div>
                              </a>
                            ) : (
                              <div className="h-32 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center text-[10.5px] text-slate-600 font-medium">
                                NID Front photo not provided
                              </div>
                            )}
                          </div>

                          {/* Back image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID Card Back / পেছনের অংশ</span>
                            {selectedClient.nidBack ? (
                              <a href={selectedClient.nidBack} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-blue-500/10">
                                <img src={selectedClient.nidBack} alt="NID Back" className="w-full h-32 object-cover rounded-xl group-hover:scale-105 transition duration-300" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold text-white">
                                  Click to Open Full View ↗
                                </div>
                              </a>
                            ) : (
                              <div className="h-32 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center text-[10.5px] text-slate-600 font-medium">
                                NID Back photo not provided
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Associated Reservation list */}
                      <div className="space-y-2.5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Booked Services List ({selectedClient.bookings.length})</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-none pr-1">
                          {selectedClient.bookings.length === 0 ? (
                            <p className="text-[10px] text-slate-500 font-semibold italic">No booking entries currently recorded for this user</p>
                          ) : (
                            selectedClient.bookings.map((b: any) => (
                              <div key={b.id} className="bg-[#121622] border border-[#1b2234] p-3 rounded-2xl flex items-center justify-between text-xs font-medium">
                                <div className="text-left font-sans">
                                  <p className="text-white font-extrabold">{b.modelName} ({b.duration})</p>
                                  <p className="text-[9.5px] text-slate-500 mt-0.5">{b.date} • {b.time} @ {b.location}</p>
                                </div>
                                <span className={`text-[8.5px] font-black uppercase px-2 py-1 rounded-lg border font-mono ${
                                  b.status === 'Completed' || b.status === 'Approved'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/15'
                                }`}>
                                  {b.status}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedClient(null)}
                          className="w-full bg-blue-500/10 hover:bg-blue-500/15 text-blue-400 hover:text-blue-300 border border-blue-500/20 text-[10.5px] font-extrabold uppercase py-3.5 rounded-xl transition duration-200 cursor-pointer"
                        >
                          Close Detail View
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )}

          {/* =======================================================
              PARTNER / COMPANION / APPLICATIONS REGISTRY
             ======================================================= */}
          {activeTab === 'partners' && (
            <div className="space-y-5 text-left">
              
              <div className="flex flex-col gap-3.5 border-b border-[#1b1e2e] pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {/* Sub tab Selector */}
                  <div className="flex bg-black/45 p-1 rounded-xl border border-white/5 gap-1 select-none">
                    <button
                      type="button"
                      onClick={() => { setPartnerSubTab('active'); resetCompanionForm(); }}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        partnerSubTab === 'active'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Active Partners Database ({companions.filter(c => c.status !== 'Pending').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPartnerSubTab('applicants'); resetCompanionForm(); }}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        partnerSubTab === 'applicants'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Partner Applications ({pendingApplicantsList.length})
                      {pendingApplicantsList.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </button>
                  </div>

                  {!showCompanionForm && partnerSubTab === 'active' && (
                    <button
                      type="button"
                      onClick={() => setShowCompanionForm(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] tracking-widest uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-md shadow-blue-550/15"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Register Companion
                    </button>
                  )}
                </div>

                {/* Dynamic category segment bars for splitting view into configured categories */}
                <div className="flex flex-wrap bg-[#0c0d14] p-1.5 rounded-2xl border border-slate-900/80 gap-1.5 items-center select-none w-full">
                  {categories.map((cat) => {
                    const isSelected = partnerCategoryFilter === cat;
                    const colorClass = cat.toLowerCase().includes('female') ? 'pink' : cat.toLowerCase().includes('male') ? 'blue' : 'emerald';
                    
                    const badgeBgClass = colorClass === 'pink' ? 'bg-pink-500/10 text-pink-400 border-pink-500/25 shadow-md' : colorClass === 'blue' ? 'bg-blue-500/10 text-blue-400 border-blue-500/25 shadow-md' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 shadow-md';
                    const activePointClass = isSelected ? (colorClass === 'pink' ? 'bg-pink-450 animate-pulse' : colorClass === 'blue' ? 'bg-blue-450 animate-pulse' : 'bg-emerald-450 animate-pulse') : (colorClass === 'pink' ? 'bg-pink-800' : colorClass === 'blue' ? 'bg-blue-800' : 'bg-emerald-800');

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPartnerCategoryFilter(cat)}
                        className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                          isSelected
                            ? badgeBgClass
                            : 'text-slate-450 hover:text-white hover:bg-white/5 border-transparent'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full transition-all ${activePointClass}`} />
                        <span>{cat}</span>
                        <span className="bg-black/50 px-2 py-0.5 rounded-md font-mono text-[9px] font-bold text-slate-500 border border-white/5">
                          {partnerSubTab === 'active' 
                            ? companions.filter(c => c.status !== 'Pending' && (c.category || 'Female Model') === cat).length
                            : pendingApplicantsList.filter(c => (c.category || 'Female Model') === cat).length
                          }
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>


              {/* SAVING / ADD COMPANION FORM CONTAINER */}
              {showCompanionForm && (
                <form onSubmit={handleSaveCompanion} className="p-5 bg-black/60 rounded-2xl border border-blue-500/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#2271b1] flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {editingCompanionId ? 'Modify Companion Profile' : 'Register New Partner Profile'}
                    </h4>
                    <button
                      type="button"
                      onClick={resetCompanionForm}
                      className="p-1 rounded bg-[#10141c] text-slate-400 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Companion Name *</label>
                      <input
                        type="text"
                        required
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        placeholder="e.g. Orpa Chowdhury"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Badge Tier */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Select Category * / ৩টি ক্যাটাগরি</label>
                      <select
                        value={compBadge}
                        onChange={(e) => setCompBadge(e.target.value as any)}
                        className="w-full bg-[#11131a] border border-[#ac843c]/40 rounded-xl px-3 py-2 text-white font-heavy focus:outline-none focus:border-emerald-500"
                      >
                        <option value="REGULAR">Regular Member (রেগুলার ক্যাটাগরি)</option>
                        <option value="PREMIUM">Premium Member (প্রিমিয়াম ক্যাটাগরি)</option>
                        <option value="ELITE">Elite Society (এলিট ক্যাটাগরি)</option>
                        <option value="DEMO">Demo Class (ডিমো ক্যাটাগরি)</option>
                      </select>
                    </div>

                    {/* Partner Category */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Partner Category *</label>
                      <select
                        value={compCategory}
                        onChange={(e) => setCompCategory(e.target.value as any)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Female Model">Female Model (ফিমেল মডেল)</option>
                        <option value="Male Model">Male Model (মেল মডেল)</option>
                        <option value="Sperm Donor">Sperm Donor (স্পার্ম ডোনার)</option>
                      </select>
                    </div>

                    {/* Age */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Age (Years)</label>
                      <input
                        type="number"
                        min="18"
                        max="50"
                        value={compAge}
                        onChange={(e) => setCompAge(Number(e.target.value))}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Height */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Height / উচ্চতা</label>
                      <input
                        type="text"
                        value={compHeight}
                        onChange={(e) => setCompHeight(e.target.value)}
                        placeholder="e.g. 5ft 4in"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Body Color */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Body Color / Complexion / গায়ের রঙ</label>
                      <input
                        type="text"
                        value={compBodyColor}
                        onChange={(e) => setCompBodyColor(e.target.value)}
                        placeholder="e.g. Fair, Light, Creamy, Whitish"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Weight */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Weight / ওজন</label>
                      <input
                        type="text"
                        value={compWeight}
                        onChange={(e) => setCompWeight(e.target.value)}
                        placeholder="e.g. 52 kg"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Bust/Chest */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Bust/Chest / স্তন/বুক (ইঞ্চি)</label>
                      <input
                        type="text"
                        value={compBust}
                        onChange={(e) => setCompBust(e.target.value)}
                        placeholder="e.g. 34B or 36 in"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Waist */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Waist / কোমর (ইঞ্চি)</label>
                      <input
                        type="text"
                        value={compWaist}
                        onChange={(e) => setCompWaist(e.target.value)}
                        placeholder="e.g. 26 in"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Hip */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hip / নিতম্ব (ইঞ্চি)</label>
                      <input
                        type="text"
                        value={compHip}
                        onChange={(e) => setCompHip(e.target.value)}
                        placeholder="e.g. 36 in"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Operational City Area (শহর ও এলাকা)</label>
                      <select
                        value={compCity}
                        onChange={(e) => setCompCity(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-xs font-bold"
                      >
                        <option value="">Select Area / এলাকা সিলেক্ট করুন</option>
                        {structuredCities && structuredCities.length > 0 ? (
                          structuredCities.map((p) => (
                            <optgroup key={p.id} label={p.name.toUpperCase()}>
                              {p.subAreas.map((sub) => (
                                <option key={`${sub}, ${p.name}`} value={`${sub}, ${p.name}`}>
                                  {sub.toUpperCase()} ({p.name.toUpperCase()})
                                </option>
                              ))}
                              {p.subAreas.length === 0 && (
                                <option value={p.name}>{p.name.toUpperCase()}</option>
                              )}
                            </optgroup>
                          ))
                        ) : (
                          cities.map((city) => (
                            <option key={city} value={city}>
                              {city.toUpperCase()}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Rate per Hour */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hourly Remundation Rate (৳ Taka)</label>
                      <input
                        type="number"
                        required
                        min="1000"
                        value={compRate}
                        onChange={(e) => setCompRate(Number(e.target.value))}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* CUSTOM SERVICE RATES SECTION */}
                    <div className="sm:col-span-2 p-4 bg-[#030a1c]/65 border border-blue-500/10 rounded-xl space-y-3">
                      <span className="block text-[10px] font-black tracking-widest text-[#2ebdff] uppercase">
                        CUSTOM FEES PER SERVICE / কাস্টম সার্ভিস রেট (ঐচ্ছিক)
                      </span>
                      <p className="text-[9px] text-slate-500 font-medium">
                        If left blank, the standard hourly rate and multipliers will be applied. Fill these to set custom fixed rates for particular options.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Custom Rate: REAL */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Real Service Rate (৳/hr)</label>
                          <input
                            type="number"
                            placeholder="Defaults to standard hourly rate"
                            value={compRateReal}
                            onChange={(e) => setCompRateReal(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>

                        {/* Custom Rate: CAM */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Cam Service Rate (৳/hr)</label>
                          <input
                            type="number"
                            placeholder="Defaults to 45% off standard hourly rate"
                            value={compRateCam}
                            onChange={(e) => setCompRateCam(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>

                        {/* Custom Rate: MAKE OUT */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Make Out Rate (৳/hr)</label>
                          <input
                            type="number"
                            placeholder="Defaults to 35% off standard hourly rate"
                            value={compRateMakeOut}
                            onChange={(e) => setCompRateMakeOut(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>

                        {/* Custom Rate: LIVE TOGETHER */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Live Together Rate (৳/hr)</label>
                          <input
                            type="number"
                            placeholder="Defaults to standard hourly rate"
                            value={compRateLiveTogether}
                            onChange={(e) => setCompRateLiveTogether(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Languages (comma separated)</label>
                      <input
                        type="text"
                        value={compLanguages}
                        onChange={(e) => setCompLanguages(e.target.value)}
                        placeholder="e.g. Bengali, English, Hindi"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Specialty description */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Specialty Service Description</label>
                      <input
                        type="text"
                        value={compSpecialty}
                        onChange={(e) => setCompSpecialty(e.target.value)}
                        placeholder="e.g. Executive Corporate Dinner Hostess & Social Companion"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Photo selection uploader */}
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Partner Image / ছবি *</label>
                        <span className="text-[9px] text-[#2ebdff] font-semibold">Upload file or paste URL</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={compImage}
                          onChange={(e) => setCompImage(e.target.value)}
                          placeholder="Paste image URL, or click upload on right..."
                          className="flex-1 bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-xs"
                        />
                        
                        <div className="relative shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            id="partner-image-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setCompImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="partner-image-upload"
                            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 h-full"
                          >
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            Upload Image / ছবি আপলোড
                          </label>
                        </div>
                      </div>

                      {/* Preview if uploaded or selected */}
                      {compImage && (
                        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-blue-500/10 w-fit mt-1">
                          <img src={compImage} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-800" />
                          <div className="text-left">
                            <span className="block text-[9px] text-[#2ebdff] font-bold uppercase tracking-wider">Image Loaded Preview</span>
                            <span className="text-[8px] text-slate-500 block max-w-xs truncate">{compImage.startsWith('data:') ? 'Local Image Base64 Data' : compImage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCompImage('')}
                            className="p-1 hover:bg-white/5 rounded text-rose-500 text-xs font-bold transition ml-2 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}

                      {/* Instant presets inside form */}
                      <div className="pt-2">
                        <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1 shadow-none">Or select portrait instant image:</span>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                          {PRESET_MODEL_IMAGES.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCompImage(img)}
                              className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border snap-start relative transition ${
                                compImage === img ? 'border-blue-600 scale-95 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'border-[#1b1e2c]'
                              }`}
                            >
                              <img src={img} alt="preset link" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={resetCompanionForm}
                      className="flex-1 bg-black text-slate-400 hover:text-white uppercase font-black text-[10px] py-3 rounded-xl border border-slate-800"
                    >
                      Cancel Form
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#2271b1] to-blue-600 hover:opacity-90 text-white uppercase font-black text-[10px] py-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {editingCompanionId ? 'Update details' : 'Deploy Companion Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* SUB TAB MAIN VIEW AREA */}
              {partnerSubTab === 'active' ? (
                <>
                  {companions.filter(c => c.status !== 'Pending' && (c.category || 'Female Model') === partnerCategoryFilter).length === 0 ? (
                    <div className="py-14 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] bg-[#11131a]/40 border border-dashed border-slate-800 rounded-3xl select-none w-full">
                      📭 No active {partnerCategoryFilter.toLowerCase()} partners registered in database yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-none">
                      {companions.filter(c => c.status !== 'Pending' && (c.category || 'Female Model') === partnerCategoryFilter).map((comp) => (
                    <div
                      key={comp.id}
                      className="bg-[#11131a] border border-[#1d232a] hover:border-blue-500/30 rounded-2xl p-4 flex gap-3 relative justify-between transition-all"
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                          <img src={comp.image} alt={comp.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="text-left select-none">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-white text-xs">{comp.name}</span>
                            <span className="text-[8px] bg-blue-500/15 text-blue-400 font-mono font-black tracking-normal px-1 rounded-sm uppercase shrink-0">
                              {comp.badge}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">
                            {comp.city || 'Dhaka'} • {comp.age} Yrs • {comp.height}
                          </p>
                          {(comp.bodyColor || comp.weight || comp.bust || comp.waist || comp.hip) && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {comp.bodyColor && <span className="bg-blue-500/10 text-blue-400 text-[8px] px-1 rounded border border-blue-500/10" title="Complexion">{comp.bodyColor}</span>}
                              {comp.weight && <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1 rounded border border-emerald-500/10" title="Weight">{comp.weight}</span>}
                              {comp.bust && <span className="bg-pink-500/10 text-pink-400 text-[8px] px-1 rounded border border-pink-500/10" title="Bust">B:{comp.bust}</span>}
                              {comp.waist && <span className="bg-amber-500/10 text-amber-400 text-[8px] px-1 rounded border border-amber-500/10" title="Waist">W:{comp.waist}</span>}
                              {comp.hip && <span className="bg-indigo-500/10 text-indigo-400 text-[8px] px-1 rounded border border-indigo-500/10" title="Hip">H:{comp.hip}</span>}
                            </div>
                          )}
                          <div className="flex flex-col mt-1">
                            <p className="text-[10px] text-emerald-400 font-mono font-black">
                              ৳ {comp.rate}/hr (Base)
                            </p>
                            {(comp.rateReal || comp.rateCam || comp.rateMakeOut || comp.rateLiveTogether) && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                {comp.rateReal && <span className="bg-blue-500/10 text-sky-400 text-[7px] px-1 rounded border border-blue-500/10 uppercase font-mono">Real: ৳{comp.rateReal}</span>}
                                {comp.rateCam && <span className="bg-cyan-500/10 text-cyan-400 text-[7px] px-1 rounded border border-cyan-500/10 uppercase font-mono font-bold">Cam: ৳{comp.rateCam}</span>}
                                {comp.rateMakeOut && <span className="bg-pink-500/10 text-pink-400 text-[7px] px-1 rounded border border-pink-500/10 uppercase font-mono">Out: ৳{comp.rateMakeOut}</span>}
                                {comp.rateLiveTogether && <span className="bg-purple-500/10 text-purple-400 text-[7px] px-1 rounded border border-purple-500/10 uppercase font-mono font-semibold">Together: ৳{comp.rateLiveTogether}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => handleEditCompanion(comp)}
                          title="Edit Profile"
                          className="p-2 rounded-lg bg-[#181a24] border border-slate-800 text-blue-400 hover:text-white transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCompanion(comp.id)}
                          title="Delete Profile"
                          className="p-2 rounded-lg bg-[#181a24] border border-slate-800 text-rose-500 hover:text-white hover:bg-rose-950/30 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Applicants career review list */
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-none animate-fadeIn">
                  {pendingApplicantsList.filter(c => (c.category || 'Female Model') === partnerCategoryFilter).length === 0 ? (
                    <div className="py-14 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-[#11131a]/40 border border-dashed border-slate-800 rounded-3xl select-none">
                      📬 NO PENDING CAREER APPLICATIONS IN {partnerCategoryFilter.toUpperCase()} CATEGORY
                    </div>
                  ) : (
                    pendingApplicantsList.filter(c => (c.category || 'Female Model') === partnerCategoryFilter).map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-[#11131a] border border-emerald-500/15 p-4.5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-emerald-500/25 transition-all text-left"
                      >
                        <div className="flex sm:items-center justify-between gap-3 border-b border-emerald-500/5 pb-3 flex-col sm:flex-row">
                          <div className="flex items-center gap-3">
                            <img
                              src={comp.image || PRESET_MODEL_IMAGES[0]}
                              alt={comp.name}
                              className="w-12 h-12 rounded-xl object-cover border border-emerald-500/15"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h5 className="text-white text-sm font-black flex items-center gap-1.5">
                                {comp.name}
                                <span className="text-[9.5px] text-[#2ebdff] font-mono font-medium tracking-normal">{comp.tag}</span>
                              </h5>
                              <p className="text-[10px] text-slate-400 font-bold select-all font-mono">Email: {comp.email || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border self-start sm:self-auto bg-pink-500/10 text-pink-400 border-pink-500/20">
                            {comp.category || 'Female Model App'}
                          </span>
                        </div>

                        {/* Attribute Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] text-slate-400 font-bold">
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Age:</span>
                            <span className="text-white font-heavy">{comp.age} Years</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Height (উচ্চতা):</span>
                            <span className="text-white font-heavy">{comp.height}</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Rate / hourly:</span>
                            <span className="text-emerald-400 font-black font-mono">৳ {comp.rate}/hr</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">City (শহর):</span>
                            <span className="text-white font-heavy">{comp.city || 'Dhaka'}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 bg-black/35 p-3.5 rounded-xl border border-slate-900 text-[10.5px]">
                          <div>
                            <span className="text-slate-500 text-[8px] uppercase font-mono block">Known Languages:</span>
                            <span className="text-slate-300 font-bold leading-none">{comp.languages.join(', ')}</span>
                          </div>
                          <div className="pt-2 border-t border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase font-mono block">Self Details / Bio:</span>
                            <p className="text-slate-300 italic font-semibold leading-relaxed leading-tight mt-0.5">{comp.specialty}</p>
                          </div>
                          {comp.phone && (
                            <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                              <span className="text-slate-500 text-[8px] uppercase font-mono">Mobile Number:</span>
                              <span className="text-blue-400 font-mono font-black tracking-normal select-all">{comp.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2.5 pt-1 border-t border-white/5 pt-3">
                          <button
                            onClick={() => onDeclineCompanion && onDeclineCompanion(comp.id)}
                            className="flex-1 bg-rose-955/30 hover:bg-rose-950/80 border border-rose-500/15 hover:border-rose-500/40 text-rose-400 text-[10.5px] font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                          >
                            Decline Application
                          </button>
                          <button
                            onClick={() => onApproveCompanion && onApproveCompanion(comp.id)}
                            className="flex-1 bg-emerald-955/30 hover:bg-emerald-950/80 border border-emerald-500/15 hover:border-emerald-500/40 text-emerald-400 text-[10.5px] font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                            Approve Candidate
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              MEDIA LIBRARY & ASSET LISTING TAB
             ======================================================= */}
          {activeTab === 'media' && (
            <div className="space-y-6 text-left">
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                মেডিয়া ফাইল কালেকশন ম্যানেজার। যেকোনো নতুন ছবি যুক্ত করতে নিচে URL পোস্ট করুন। মডেলে যুক্ত করার জন্য যেকোনো ছবির
                <strong className="text-blue-400"> Copy URL </strong> বাটন ক্লিক করলেই চমৎকারভাবে ছবির লিঙ্ক ক্লিপবোর্ডে কপি হয়ে যাবে! 
              </p>

              {/* Media Add input block */}
              <form onSubmit={handleAddMedia} className="p-4 bg-black/45 rounded-2xl border border-blue-500/10 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end text-xs">
                
                <div className="md:col-span-3 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Media Title Name</label>
                  <input
                    type="text"
                    value={newMediaTitle}
                    onChange={(e) => setNewMediaTitle(e.target.value)}
                    placeholder="e.g. Profile Glamour Close"
                    className="w-full bg-[#11131a] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-5 space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Image URL or Local File *</label>
                    <span className="text-[9px] text-[#2ebdff] font-semibold">Upload file or paste URL</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      placeholder="Paste image URL, or click upload on right..."
                      className="flex-1 bg-[#11131a] border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500 font-sans text-xs"
                    />
                    <div className="relative shrink-0">
                      <input
                        type="file"
                        accept="image/*"
                        id="media-vault-direct-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewMediaUrl(reader.result as string);
                              // Auto generate title from filename if not yet filled
                              if (!newMediaTitle.trim()) {
                                const cleanName = file.name.split('.')[0].replace(/[-_]/g, ' ');
                                setNewMediaTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <label
                        htmlFor="media-vault-direct-upload"
                        className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 text-[10px] font-black uppercase px-3.5 py-2.5 rounded-lg cursor-pointer transition flex items-center gap-1.5 h-full"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        Upload
                      </label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Asset Category</label>
                  <select
                    value={newMediaCategory}
                    onChange={(e) => setNewMediaCategory(e.target.value as any)}
                    className="w-full bg-[#11131a] border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:outline-none"
                  >
                    <option value="Portraits">Portraits</option>
                    <option value="Hotel Interiors">Hotel Interiors</option>
                    <option value="Promotional">Promotional</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-heavy uppercase tracking-widest py-2 rounded-lg py-2.5 text-[9.5px] transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-blue-600/10"
                  >
                    <Plus className="w-4 h-4" />
                    Add Asset
                  </button>
                </div>

              </form>

              {/* Filter grid search and gallery */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-[10px] font-black uppercase text-[#5c75ab] tracking-wider font-mono">ACTIVE FILE STORAGE LIST ({filteredMedia.length})</h4>
                  <div className="relative w-48 sm:w-60 select-none">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder="Search assets name..."
                      className="w-full bg-[#11131a] border border-slate-800 rounded-lg pl-8 p-1.5 text-[11px] text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Library grid list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-none">
                  {filteredMedia.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 text-[10px] font-semibold italic">No assets matches searching filters</div>
                  ) : (
                    filteredMedia.map((media) => (
                      <div
                        key={media.id}
                        className="bg-[#11131a] border border-[#1b1d28] hover:border-slate-700/40 rounded-2xl overflow-hidden flex flex-col justify-between group transition duration-300"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-900 border-b border-slate-800 relative">
                          <img src={media.url} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <span className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-black">
                            {media.category}
                          </span>
                        </div>
                        <div className="p-3 text-left space-y-2">
                          <p className="text-white font-bold text-xs truncate max-w-full leading-snug">{media.title}</p>
                          
                          <div className="flex gap-1.5 pt-1">
                            <button
                              onClick={() => handleCopyToClipboard(media.url, media.id)}
                              className="flex-1 bg-black/40 hover:bg-black/80 text-blue-400 hover:text-white border border-blue-500/10 hover:border-blue-500/35 py-1.5 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              {copiedId === media.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy URL</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveMedia(media.id)}
                              className="bg-black/40 hover:bg-red-950/40 text-rose-500 hover:text-rose-400 border border-rose-500/10 hover:border-rose-500/30 p-1.5 rounded-lg transition"
                              title="Delete from Media Library"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* =======================================================
              ORDER / BOOKINGS DISPATCH VIEW
             ======================================================= */}
          {activeTab === 'orders' && (() => {
            const regularOrdersCount = bookings.filter(b => getBookingTier(b) === 'REGULAR').length;
            const premiumOrdersCount = bookings.filter(b => getBookingTier(b) === 'PREMIUM').length;
            const eliteOrdersCount = bookings.filter(b => getBookingTier(b) === 'ELITE').length;

            const filteredBookingsByTier = bookings.filter((book) => {
              if (orderTierFilter === 'ALL') return true;
              return getBookingTier(book) === orderTierFilter;
            });

            return (
              <div className="space-y-4 text-left">
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  মেট্রো মা মেম্বারদের এঙ্কোয়ারি রিকোয়েস্ট ও বুকিং লিস্ট। পার্টনারদের বুকিং <strong className="text-emerald-400"> Approve & Send Mail </strong> ক্লিক করে কনফার্ম করুন। এতে করে ক্রেতার ইমেল বক্সে সম্পূর্ণ ভাউচার কোড মেইল আকারে স্বয়ংক্রিয়ভাবে প্রেরিত হয়ে যাবে।
                </p>

                {/* Sub-tabs to separate orders according to tier */}
                <div className="grid grid-cols-4 gap-2 p-1.5 bg-slate-950/75 border border-[#161a24] rounded-2xl">
                  {([
                    { value: 'ALL', en: 'All Orders', bn: 'সকল অর্ডার', count: bookings.length },
                    { value: 'REGULAR', en: 'Regular', bn: 'রেগুলার', count: regularOrdersCount },
                    { value: 'PREMIUM', en: 'Premium', bn: 'প্রিমিয়াম', count: premiumOrdersCount },
                    { value: 'ELITE', en: 'Elite', bn: 'এলিট', count: eliteOrdersCount }
                  ] as const).map((tierItem) => {
                    const isActive = orderTierFilter === tierItem.value;
                    let activeStyle = 'bg-gradient-to-r from-red-950/60 to-red-900/60 text-white border-red-500/30';

                    if (tierItem.value === 'REGULAR') {
                      activeStyle = 'bg-gradient-to-r from-indigo-950/60 to-indigo-900/60 text-white border-indigo-500/30';
                    } else if (tierItem.value === 'PREMIUM') {
                      activeStyle = 'bg-gradient-to-r from-amber-950/60 to-amber-900/60 text-white border-amber-500/30';
                    } else if (tierItem.value === 'ELITE') {
                      activeStyle = 'bg-gradient-to-r from-cyan-950/60 to-cyan-900/60 text-white border-cyan-500/30';
                    } else if (tierItem.value === 'ALL') {
                      activeStyle = 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-600';
                    }

                    return (
                      <button
                        key={tierItem.value}
                        type="button"
                        onClick={() => setOrderTierFilter(tierItem.value)}
                        className={`py-2.5 px-2 rounded-xl text-center transition-all duration-300 cursor-pointer border flex flex-col items-center justify-between gap-1 select-none font-sans ${
                          isActive
                            ? `${activeStyle} shadow-lg`
                            : 'text-slate-400 hover:text-white bg-slate-950 border-transparent hover:border-slate-800'
                        }`}
                      >
                        <span className="text-[10px] font-black tracking-widest uppercase block">{tierItem.en}</span>
                        <span className="text-[8px] text-slate-500 block leading-none">{tierItem.bn}</span>
                        <span className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full mt-1.5 ${
                          isActive ? 'bg-black/30 text-white' : 'bg-slate-900 text-slate-300'
                        }`}>
                          {tierItem.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                  {filteredBookingsByTier.length === 0 ? (
                    <div className="py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-black/20 border border-dashed border-slate-800 rounded-2xl">
                      🚀 NO {orderTierFilter === 'ALL' ? '' : `${orderTierFilter} `}ACTIVE SERVICES BOOKINGS YET
                    </div>
                  ) : (
                    filteredBookingsByTier.map((book) => {
                      const tier = getBookingTier(book);
                      let tierBadgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                      if (tier === 'PREMIUM') tierBadgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                      else if (tier === 'ELITE') tierBadgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                      else if (tier === 'DEMO') tierBadgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

                      return (
                        <div
                          key={book.id}
                          className="bg-[#11131a] border border-slate-800 hover:border-blue-500/20 p-4.5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-lg transition-all"
                        >
                          <div className="flex sm:items-center justify-between gap-3 border-b border-white/5 pb-3 flex-col sm:flex-row">
                            <div className="flex items-center gap-3">
                              <img
                                src={book.image}
                                alt={book.modelName}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h5 className="text-white text-sm font-black flex items-center gap-2 font-display shadow-none">
                                  {book.modelName}
                                  <span className="text-[9.5px] text-slate-500 font-mono tracking-normal">{book.modelTag}</span>
                                  <span className={`text-[8.5px] font-black uppercase tracking-widest px-2 py-0.5 rounded border leading-none ${tierBadgeColor}`}>
                                    {tier}
                                  </span>
                                </h5>
                                <p className="text-[10px] text-slate-450 font-bold select-all font-mono">Invoice Order ID: {book.id}</p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border self-start sm:self-auto ${
                              book.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse'
                                : book.status === 'Declined'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                            }`}>
                              {book.status}
                            </span>
                          </div>

                          {/* Detail attributes row */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[10px] text-slate-400 font-bold font-sans">
                            <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Date / তারিখ:</span>
                              <span className="text-white font-heavy">{book.date}</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Duration (সময়কাল):</span>
                              <span className="text-white font-heavy">{book.time} ({book.duration})</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900 col-span-2 sm:col-span-1">
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Hotel Suite Sanctuary:</span>
                              <span className="text-white line-clamp-1 font-heavy">{book.location}</span>
                            </div>
                          </div>

                          {book.notes && (
                            <div className="bg-black/40 p-2.5 rounded-xl text-[10.5px] text-slate-400 border border-slate-900 flex flex-col gap-1 select-all font-semibold">
                              <span className="text-slate-500 text-[8.5px] uppercase block font-mono">Client Instructions Vows:</span>
                              <p className="text-slate-200 leading-normal italic">"{book.notes}"</p>
                            </div>
                          )}

                          {book.firstTimeBooking && (
                            <div className="bg-[#0c0d16] border border-blue-500/10 p-3 rounded-xl flex flex-col gap-2">
                              <span className="text-blue-400 text-[8.5px] font-black uppercase tracking-widest block font-mono">
                                🔒 FIRST-TIME CLIENT VERIFICATION / প্রথমবার বুকিং ভেরিফিকেশন
                              </span>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-1">
                                  <span className="text-slate-500 text-[7.5px] uppercase block font-mono text-center flex justify-center">User Photo</span>
                                  {book.userPhoto ? (
                                    <div className="relative group overflow-hidden rounded-lg bg-black border border-slate-800">
                                      <img
                                        src={book.userPhoto}
                                        alt="User Verification"
                                        className="w-full h-16 object-cover hover:scale-110 transition duration-200"
                                        referrerPolicy="no-referrer"
                                      />
                                      <a
                                        href={book.userPhoto}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7.5px] text-white font-bold transition duration-200"
                                      >
                                        View Full
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="w-full h-16 rounded-lg bg-slate-950 flex items-center justify-center border border-dashed border-slate-800 text-[8px] text-rose-400 italic font-medium">Missing</div>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <span className="text-slate-500 text-[7.5px] uppercase block font-mono text-center flex justify-center">NID Front</span>
                                  {book.nidFront ? (
                                    <div className="relative group overflow-hidden rounded-lg bg-black border border-slate-800">
                                      <img
                                        src={book.nidFront}
                                        alt="NID Front"
                                        className="w-full h-16 object-cover hover:scale-110 transition duration-200"
                                        referrerPolicy="no-referrer"
                                      />
                                      <a
                                        href={book.nidFront}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7.5px] text-white font-bold transition duration-200"
                                      >
                                        View Full
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="w-full h-16 rounded-lg bg-slate-950 flex items-center justify-center border border-dashed border-slate-800 text-[8px] text-rose-455 italic font-medium">Missing</div>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <span className="text-slate-500 text-[7.5px] uppercase block font-mono text-center flex justify-center">NID Back</span>
                                  {book.nidBack ? (
                                    <div className="relative group overflow-hidden rounded-lg bg-black border border-slate-800">
                                      <img
                                        src={book.nidBack}
                                        alt="NID Back"
                                        className="w-full h-16 object-cover hover:scale-110 transition duration-200"
                                        referrerPolicy="no-referrer"
                                      />
                                      <a
                                        href={book.nidBack}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[7.5px] text-white font-bold transition duration-200"
                                      >
                                        View Full
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="w-full h-16 rounded-lg bg-slate-950 flex items-center justify-center border border-dashed border-slate-800 text-[8px] text-rose-455 italic font-medium">Missing</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {book.status === 'Awaiting Dispatch' ? (
                            <div className="flex gap-2.5 pt-1.5">
                              <button
                                onClick={() => onDeclineBooking(book.id)}
                                className="flex-1 bg-rose-955/35 hover:bg-rose-950/80 border border-rose-500/15 hover:border-rose-500/40 text-rose-450 text-[10.5px] font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer"
                              >
                                Decline Booking
                              </button>
                              <button
                                onClick={() => onApproveBooking(book.id)}
                                className="flex-1 bg-emerald-955/35 hover:bg-emerald-950/80 border border-emerald-500/15 hover:border-emerald-500/40 text-emerald-450 text-[10.5px] font-black uppercase tracking-wider py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" />
                                Approve & Dispatch Mail
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              <div className="bg-[#0b0c11] px-3.5 py-2.5 rounded-xl border border-[#1b1e2e] text-slate-500 text-[9px] flex justify-between items-center font-mono select-none">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  SMTP delivery queue status:
                                </span>
                                <span className="text-emerald-400 font-bold font-sans">Processed Voucher Mail (মেইল কনফার্মড)</span>
                              </div>

                              {book.status === 'Approved' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <button
                                    onClick={() => onMarkOutgoingBooking && onMarkOutgoingBooking(book.id)}
                                    className="flex-1 bg-blue-600/20 hover:bg-blue-650/80 border border-blue-500/30 hover:border-blue-500/55 text-blue-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    🚀 Outgoing (আসছে)
                                  </button>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-650/80 border border-emerald-500/30 hover:border-emerald-500/55 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    💖 Complete (সম্পন্ন)
                                  </button>
                                </div>
                              )}

                              {book.status === 'Outgoing' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <div className="flex-1 text-[9px] font-mono text-blue-405 flex items-center justify-center bg-blue-955/20 rounded-lg p-1 font-bold">
                                    Status: Outgoing for Call 🛵
                                  </div>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/30 hover:bg-emerald-650/80 border border-emerald-500/40 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    💖 Complete (সম্পন্ন)
                                  </button>
                                </div>
                              )}

                              {book.status === 'Completed' && (
                                <div className="bg-emerald-950/20 border border-emerald-500/15 px-3 py-2 rounded-xl text-center text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1.5">
                                  <span>✅ Service successfully closed & finalized. Feedback channel active.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* =======================================================
              HOTEL SANCTUARIES MANAGEMENT TAB
             ======================================================= */}
          {activeTab === 'hotels' && (
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-[#1c2333] pb-3">
                <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                  ডিজাইনেড বিলাসবহুল সেফ হাউস এবং ফাইভ-স্টার স্যুইট তালিকা। সার্ভিস বুকিং করার জন্য ক্লায়েন্টদের রিল্যাক্স ম্যাপে স্যুইটগুলো প্রদর্শিত হয়।
                </p>
                {!showLocationForm && (
                  <button
                    type="button"
                    onClick={() => setShowLocationForm(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[9.5px] tracking-widest uppercase px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    New Hotel Room
                  </button>
                )}
              </div>

              {/* HOTEL FORM BLOCK */}
              {showLocationForm && (
                <form onSubmit={handleSaveLocation} className="p-5 bg-black/60 rounded-2xl border border-blue-500/20 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#2271b1] flex items-center gap-2">
                      <Hotel className="w-4 h-4" />
                      {editingLocationId ? 'Modify Sanctuary Sanctuary details' : 'Build Custom Hotel Sanctuary'}
                    </h4>
                    <button
                      type="button"
                      onClick={resetLocationForm}
                      className="p-1 rounded bg-[#10141c] text-slate-400 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-heavy">
                    {/* Hotel Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Sanctuary Name *</label>
                      <input
                        type="text"
                        required
                        value={locName}
                        onChange={(e) => setLocName(e.target.value)}
                        placeholder="e.g. Radisson Blu Suite Prestige"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Rating Stars */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Prestige stars rating</label>
                      <select
                        value={locStar}
                        onChange={(e) => setLocStar(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="5 STAR">👑 5 STAR PRESTIGE ROYAL</option>
                        <option value="4 STAR">⭐ 4 STAR PREMIUM CLASS</option>
                        <option value="BOUTIQUE">🏢 PRIVATE BOUTIQUE SANCTUARY</option>
                      </select>
                    </div>

                    {/* City Location */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Metropolis District area</label>
                      <select
                        value={locCity}
                        onChange={(e) => setLocCity(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-xs font-bold"
                      >
                        <option value="">Select Area / এলাকা সিলেক্ট করুন</option>
                        {structuredCities && structuredCities.length > 0 ? (
                          structuredCities.map((p) => (
                            <optgroup key={p.id} label={p.name.toUpperCase()}>
                              {p.subAreas.map((sub) => (
                                <option key={`${sub}, ${p.name}`} value={`${sub}, ${p.name}`}>
                                  {sub.toUpperCase()} ({p.name.toUpperCase()})
                                </option>
                              ))}
                              {p.subAreas.length === 0 && (
                                <option value={p.name}>{p.name.toUpperCase()}</option>
                              )}
                            </optgroup>
                          ))
                        ) : (
                          cities.map((city) => (
                            <option key={city} value={city}>
                              {city.toUpperCase()}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Booking Price */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Sanctuary Charge / ভাড়া (৳) *</label>
                      <input
                        type="number"
                        required
                        value={locPrice}
                        onChange={(e) => setLocPrice(e.target.value)}
                        placeholder="e.g. 8000"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono text-xs font-bold"
                      />
                    </div>

                    {/* description */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Privacy Policy Rules & Details</label>
                      <textarea
                        rows={2}
                        value={locDesc}
                        onChange={(e) => setLocDesc(e.target.value)}
                        placeholder="e.g. Elevators, back exits keys, 100% blind safety setups..."
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 resize-none font-medium"
                      />
                    </div>

                    {/* Google Maps Custom location iframe embed or search URL */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <div className="flex justify-between items-center animate-fadeIn">
                        <label className="block text-[10px] font-black tracking-widest text-[#2271b1] uppercase">Google Maps Embed URL / Embed Iframe</label>
                        <span className="text-[10px] text-slate-400 font-bold bg-[#1d1f2b] border border-slate-800 px-2 py-0.5 rounded-md">OPTIONAL</span>
                      </div>
                      <input
                        type="text"
                        value={locMapEmbedUrl}
                        onChange={(e) => setLocMapEmbedUrl(e.target.value)}
                        placeholder="Paste standard Maps URL or full <iframe> code (or let it auto-generate)"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 text-xs font-bold font-mono"
                      />
                      <p className="text-[9px] text-slate-500 font-semibold tracking-wide block leading-tight mt-1">
                        * Note: If left blank, the app will automatically construct a dark-styled map locating the hotel using its address name.
                      </p>
                    </div>

                    {/* Image preset suite */}
                    <div className="space-y-2 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Hotel Suite Photo Preset URL *</label>
                      <input
                        type="text"
                        value={locImage}
                        onChange={(e) => setLocImage(e.target.value)}
                        placeholder="Paste unsplash hotel room URL"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                      />

                      {/* Presets inside form */}
                      <div className="pt-2">
                        <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1 shadow-none">Instant luxury suite presets portraits:</span>
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                          {PRESET_HOTEL_IMAGES.map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setLocImage(img)}
                              className={`flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden border snap-start relative transition ${
                                locImage === img ? 'border-blue-600 scale-95 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'border-[#1b1e2c]'
                              }`}
                            >
                              <img src={img} alt="suite card" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={resetLocationForm}
                      className="flex-1 bg-black text-slate-400 hover:text-white uppercase font-black text-[10px] py-3 rounded-xl border border-slate-800"
                    >
                      Cancel Form
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-[#2271b1] to-blue-600 hover:opacity-90 text-white uppercase font-black text-[10px] py-3 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {editingLocationId ? 'Update Room Details' : 'Verify & Launch Room'}
                    </button>
                  </div>
                </form>
              )}

              {/* List of active locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-[#11131a] border border-[#1d232a] hover:border-blue-500/20 rounded-2xl p-4 flex gap-3 relative justify-between transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                        <img src={loc.image} alt={loc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-white text-xs">{loc.name}</span>
                          <span className="text-[8px] bg-amber-500/15 text-amber-400 font-mono font-black tracking-normal px-1 rounded-sm uppercase shrink-0">
                            {loc.star}
                          </span>
                        </div>
                        <p className="text-[9px] text-blue-400 font-mono tracking-normal uppercase mt-1">
                          {loc.location}
                        </p>
                        <p className="text-[10px] text-slate-450 leading-tight block line-clamp-1 mt-1 font-semibold">
                          {loc.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => handleEditLocation(loc)}
                        title="Edit Sanctuary"
                        className="p-2 rounded-lg bg-[#181a24] border border-slate-800 text-blue-450 hover:text-white transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc.id)}
                        title="Delete Sanctuary"
                        className="p-2 rounded-lg bg-[#181a24] border border-slate-800 text-rose-500 hover:text-white hover:bg-rose-955/35 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* =======================================================
              SMTP CONFIG & EMAIL QUEUE LOGS TAB
             ======================================================= */}
          {activeTab === 'smtp' && (
            <div className="space-y-5 text-left">
              {/* =======================================================
                  BRAND LOGO CONTROL CENTER
                 ======================================================= */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-amber-500/10 space-y-5 text-left">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-white/5">
                  <ImageIcon className="w-5 h-5 text-amber-500 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Brand Logo Uploader & Controller (ব্র্যান্ড লোগো আপলোডার)
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Upload your high-quality agency brand logo in PNG, JPG, SVG, or WebP. Replaces default logo instantly across all app pages.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Interactive Image Crop Area & Touch Mask */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-black/40 border border-[#232733] rounded-2xl space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Interactive Crop Circle (লোগো পজিশন করুন)
                    </span>
                    
                    {/* The Circular Viewport Framing Layer */}
                    <div 
                      className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-dashed border-amber-500/40 bg-neutral-950 flex items-center justify-center shadow-2xl select-none cursor-move active:cursor-grabbing group"
                      onMouseDown={(e) => {
                        if (!tempLogo) return;
                        setIsDraggingLogo(true);
                        setDragStart({ x: e.clientX - logoX, y: e.clientY - logoY });
                      }}
                      onMouseMove={(e) => {
                        if (!isDraggingLogo) return;
                        setLogoX(e.clientX - dragStart.x);
                        setLogoY(e.clientY - dragStart.y);
                      }}
                      onMouseUp={() => setIsDraggingLogo(false)}
                      onMouseLeave={() => setIsDraggingLogo(false)}
                      onTouchStart={(e) => {
                        if (!tempLogo || e.touches.length === 0) return;
                        const touch = e.touches[0];
                        setIsDraggingLogo(true);
                        setDragStart({ x: touch.clientX - logoX, y: touch.clientY - logoY });
                      }}
                      onTouchMove={(e) => {
                        if (!isDraggingLogo || e.touches.length === 0) return;
                        const touch = e.touches[0];
                        setLogoX(touch.clientX - dragStart.x);
                        setLogoY(touch.clientY - dragStart.y);
                      }}
                      onTouchEnd={() => setIsDraggingLogo(false)}
                    >
                      {/* Grid overlays for elegant styling */}
                      <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-full z-10"></div>
                      <div className="absolute inset-y-0 left-1/2 w-px bg-white/10 pointer-events-none z-10"></div>
                      <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 pointer-events-none z-10"></div>

                      {tempLogo ? (
                        <img
                          src={tempLogo}
                          alt="Logo Crop Preview"
                          style={{
                            transform: `translate(${logoX}px, ${logoY}px) scale(${logoZoom / 100}) rotate(${logoRotate}deg)`,
                            transition: 'none',
                          }}
                          className="w-full h-full object-contain pointer-events-none select-none max-w-none max-h-none origin-center"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-[10px] text-center font-bold text-amber-500/65 bg-neutral-900 border border-amber-500/10 p-4">
                          <span>NO IMAGE CHOSEN</span>
                          <span className="text-[9px] text-slate-500 font-medium mt-1">Please select a file to start editing</span>
                        </div>
                      )}

                      {/* Dynamic border highlight */}
                      <div className="absolute inset-0 rounded-full border border-amber-500/20 group-hover:border-amber-500/60 pointer-events-none transition duration-150"></div>
                    </div>

                    <div className="text-center font-mono text-[9px] text-slate-400 max-w-xs leading-normal">
                      {tempLogo ? (
                        <p className="font-semibold text-amber-400">
                          🖱️ Hold & Drag on the image to position! <br />
                          (ছবিটির ওপর মাউস বা আঙুল দিয়ে ড্র্যাগ করে বসান)
                        </p>
                      ) : (
                        <p>Luxury Vector SVG default logo is active as template.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Upload controller & Precise Sliding Dials */}
                  <div className="md:col-span-7 space-y-4">
                    
                    {/* Media Selector Zone */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                        Upload Logo Image File (লোগো ছবি ফাইল সিলেক্ট করুন)
                      </label>
                      <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-4 bg-black/20 text-center transition cursor-pointer group">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                alert("ভুল সাইজ: লোগোর সর্বোচ্চ সাইজ ২ মেগাবাইট (2MB)-এর কম হতে হবে!");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64 = ev.target?.result as string;
                                setTempLogo(base64);
                                // reset adjustments on new image load
                                setLogoZoom(100);
                                setLogoX(0);
                                setLogoY(0);
                                setLogoRotate(0);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div className="space-y-1.5 pointer-events-none">
                          <Upload className="w-7 h-7 text-slate-500 group-hover:text-amber-500 mx-auto transition duration-150" />
                          <div className="text-xs font-bold text-slate-400">
                            Click to select or <span className="text-amber-500">Drag & Drop</span> logo image
                          </div>
                          <p className="text-[9px] text-slate-500">
                            Supports PNG, JPG, JPEG, SVG, WebP (Max size 2MB)
                          </p>
                        </div>
                      </div>
                    </div>

                    {tempLogo && (
                      <div className="p-4 bg-black/30 rounded-xl border border-slate-800/80 space-y-3.5">
                        <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-200 border-b border-white/5 pb-1.5 flex items-center justify-between">
                          <span>Precise adjustment sliders (সূক্ষ্মভাবে সাইজ মেলানোর স্লাইডার)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setLogoZoom(100);
                              setLogoX(0);
                              setLogoY(0);
                              setLogoRotate(0);
                            }}
                            className="text-[9px] text-amber-500 hover:underline hover:text-amber-400 active:scale-95 transition"
                          >
                            Reset Alignment
                          </button>
                        </h5>

                        {/* Zoom Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400">🔍 Image Scale / Zoom (ছবি বড়/ছোট করুন)</span>
                            <span className="text-[9px] font-mono font-bold text-amber-400">{logoZoom}%</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="300"
                            value={logoZoom}
                            onChange={(e) => setLogoZoom(Number(e.target.value))}
                            className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Move X Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400">↔️ Horizontal Shift (ডানে-বামে সরান)</span>
                            <span className="text-[9px] font-mono font-bold text-amber-400">{logoX}px</span>
                          </div>
                          <input
                            type="range"
                            min="-200"
                            max="200"
                            value={logoX}
                            onChange={(e) => setLogoX(Number(e.target.value))}
                            className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Move Y Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400">↕️ Vertical Shift (উপরে-নিচে সরান)</span>
                            <span className="text-[9px] font-mono font-bold text-amber-400">{logoY}px</span>
                          </div>
                          <input
                            type="range"
                            min="-200"
                            max="200"
                            value={logoY}
                            onChange={(e) => setLogoY(Number(e.target.value))}
                            className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Rotation Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-400">🔄 Rotate Image (ঘোরান)</span>
                            <span className="text-[9px] font-mono font-bold text-amber-400">{logoRotate}°</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={logoRotate}
                            onChange={(e) => setLogoRotate(Number(e.target.value))}
                            className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Apply Crop & Save Action Button */}
                        <button
                          type="button"
                          disabled={isProcessingCrop}
                          onClick={() => handleApplyCrop()}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black uppercase text-[10px] tracking-wider rounded-lg shadow-md hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition active:scale-98 disabled:opacity-50"
                        >
                          {isProcessingCrop ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Cropping Image...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Crop & Lock Logo (লোগো সাইজ ঠিক করে কাটুন)
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                          Or Paste Logo Image URL (অথবা ডিরেক্ট ইমেজ লিংক দিন)
                        </label>
                        {tempLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("আপনি কি নিশ্চিত লোগোটি রিমুভ করে ডিফল্ট ডিজাইনে ফিরে যেতে চান?")) {
                                setTempLogo('');
                              }
                            }}
                            className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-wide cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Clear Logo
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={tempLogo.startsWith('data:') ? '' : tempLogo}
                        onChange={(e) => setTempLogo(e.target.value)}
                        placeholder="e.g. https://domain.com/assets/logo.png"
                        className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono placeholder-slate-700 focus:outline-none text-xs"
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (tempLogo) {
                            localStorage.setItem('bt_custom_logo', tempLogo);
                          } else {
                            localStorage.removeItem('bt_custom_logo');
                          }
                          // trigger custom sync event
                          window.dispatchEvent(new Event('bt_logo_updated'));
                          setLogoSaveSuccess(true);
                          setTimeout(() => setLogoSaveSuccess(false), 3000);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-550 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 active:scale-98"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                        Apply & Save Logo (পরিবর্তন সেভ করুন)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("আপনি কি নিশ্চিত যে আপনি কাস্টম লোগো মুছে দিয়ে পূর্বনির্ধারিত ডিফল্ট ভেক্টর লোগোতে ফিরে যেতে চান?")) {
                            localStorage.removeItem('bt_custom_logo');
                            window.dispatchEvent(new Event('bt_logo_updated'));
                            setTempLogo('');
                            setLogoSaveSuccess(true);
                            setTimeout(() => setLogoSaveSuccess(false), 3000);
                          }
                        }}
                        className="bg-[#11131a] border border-slate-800 hover:bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reset to Default (ডিফল্ট লোগো)
                      </button>

                      {logoSaveSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Saved & Synced!
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4.5 bg-[#141d1a]/20 border border-emerald-500/25 rounded-2xl text-xs space-y-3 prose leading-relaxed font-semibold text-slate-350">
                <h4 className="text-xs font-black uppercase text-emerald-400 flex items-center gap-2">
                  <Mail className="w-4.5 h-4.5 animate-pulse" />
                  Hostinger Shared Server Static SMTP credentials (SMTP Mail Engine)
                </h4>
                <p>
                  Hostinger shared environment block outgoing server scripts unless verified credentials matching DNS records are linked. 
                  Below configure your secure <strong className="text-white"> EmailJS Service </strong> to handle real life auto approval email deliveries!
                </p>
                <p className="text-slate-450">
                  যদি আপনি EmailJS Credentials ফাকা রাখেন, সিস্টেমটি স্বয়ংক্রিয়ভাবে ডিসপ্যাচ ও ভাউচার এক্টিভেশন প্রসেস সফল করবে, এবং নিচে লাইভ <strong>SMTP Mail Delivery Queue Logs</strong> উইন্ডোতে মেইলের কপি প্রদর্শন করবে যাতে সিস্টেমটি সম্পূর্ণ রিয়েল টাইম অনুভব করা যায়।
                </p>
              </div>

              {/* Input forms for EmailJS */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-blue-500/10 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-blue-500" />
                    Service ID (EmailJS)
                  </label>
                  <input
                    type="text"
                    value={emailjsServiceId}
                    onChange={(e) => onSetEmailjsServiceId(e.target.value)}
                    placeholder="e.g. service_xxxxxxx"
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-pink-500" />
                    Template ID (EmailJS)
                  </label>
                  <input
                    type="text"
                    value={emailjsTemplateId}
                    onChange={(e) => onSetEmailjsTemplateId(e.target.value)}
                    placeholder="e.g. template_xxxxxxx"
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 font-mono">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" />
                    Public Key (EmailJS)
                  </label>
                  <input
                    type="text"
                    value={emailjsPublicKey}
                    onChange={(e) => onSetEmailjsPublicKey(e.target.value)}
                    placeholder="e.g. user_xxxxxxxxxxxx"
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {/* Input forms for Telegram Notification Bot */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-indigo-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2">
                    <Server className="w-4 h-4 animate-pulse" />
                    Telegram Notification Engine & Helpline (টেলিগ্রাম নোটিফিকেশন ও হেল্পলাইন)
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Configure your primary Telegram Bot credentials, Admin Group Chat ID, and the support Helpline handle below. In case of lost/damaged accounts, you can instantly add/save or remove credentials to keep system notification channels secure and completely organized.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      Telegram Bot Token (টেলিগ্রাম বট টোকেন)
                    </label>
                    <input
                      type="text"
                      value={telegramBotToken}
                      onChange={(e) => onSetTelegramBotToken(e.target.value)}
                      placeholder="e.g. 1234567890:ABCdefGhI_klmNoPQRsTUVwxyZ"
                      className="w-full bg-black/40 border border-[#232733] focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <Lock className="w-3.5 h-3.5 text-teal-500" />
                      Telegram Group Chat ID (গ্রুপ চ্যাট আইডি)
                    </label>
                    <input
                      type="text"
                      value={telegramGroupId}
                      onChange={(e) => onSetTelegramGroupId(e.target.value)}
                      placeholder="e.g. -100xxxxxxxxxx"
                      className="w-full bg-black/40 border border-[#232733] focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                      Support Helpline Username (টেলিগ্রাম হেল্পলাইন)
                    </label>
                    <input
                      type="text"
                      value={telegramHelpline}
                      onChange={(e) => onSetTelegramHelpline?.(e.target.value)}
                      placeholder="e.g. BodyTouchSupport (no @)"
                      className="w-full bg-black/40 border border-[#232733] focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-400 focus:outline-none text-amber-400"
                    />
                  </div>
                </div>

                {/* BOT & HELPLINE ADD/REMOVE CONTROL BUTTONS */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      alert("✅ Telegram Credentials & Support Helpline configurations have been securely added and updated in system databases!");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-550 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-98"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    Save & Turn On Bot
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSetTelegramBotToken('');
                      onSetTelegramGroupId('');
                      if (onSetTelegramHelpline) onSetTelegramHelpline('');
                      alert("⚠️ Disconnected: All Telegram Bot tokens, Chat IDs, and active helpline links have been completely removed and deleted from system memory!");
                    }}
                    className="bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/25 text-rose-450 hover:text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 active:scale-98"
                  >
                    <Trash2 className="w-4 h-4 text-rose-550" />
                    Remove connections / Disconnect
                  </button>
                </div>

                <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                  <p>
                    ⚠️ <b>বট সেটিংস নির্দেশাবলি:</b>
                  </p>
                  <p>
                    ১. প্রথমে <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">@BotFather</a> এর মাধ্যমে একটি নতুন টেলিগ্রাম বট তৈরি করে টোকেনটি এখানে বসান।
                  </p>
                  <p>
                    ২. আপনার অ্যাডমিন গ্রুপ চ্যাটে তৈরি করা বটটিকে যুক্ত করুন এবং গ্রুপ চ্যাট আইডি (Chat ID) উপরোক্ত বক্সে প্রদান করুন।
                  </p>
                  <p>
                    ৩. কোনো মডেল বুকিং রিকোয়েস্ট দিলে কাস্টমার ডিটেইলস সহ নোটিফিকেশন স্বয়ংক্রিয়ভাবে উক্ত এডমিন গ্রুপে চলে যাবে।
                  </p>
                  <p>
                    ৪. কোনো কাস্টমার পোর্টালে সাবস্ক্রিপশন নিলে বা কোনো মডেল জয়েন হলে সরাসরি হেল্পলাইন বাটনটি দেখতে পাবেন।
                  </p>
                </div>
              </div>

              <div className="bg-[#11131a] rounded-2xl border border-white/5 p-4.5">
                <div className="flex items-center justify-between border-b border-[#222938] pb-3 mb-4 select-none">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] flex items-center gap-1.5 font-mono">
                    <Mail className="w-4 h-4" />
                    Outgoing SMTP Delivery Mail Queue ({emailLogs.length})
                  </h5>
                  {emailLogs.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearEmailLogs}
                      className="text-slate-400 hover:text-white text-[9px] font-black uppercase bg-[#181a24] border border-slate-800 px-3 py-1.5 rounded-lg transition"
                    >
                      Clear Log Queue
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-none font-mono font-semibold">
                  {emailLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-[10px] font-semibold italic">
                      📭 Outgoing delivery logs queue is currently empty.
                    </div>
                  ) : (
                    emailLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-black/40 border border-slate-900 p-4 rounded-xl flex flex-col space-y-2 text-left text-[11px] hover:border-slate-800 transition-all font-mono"
                      >
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 text-[9.5px]">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="text-slate-600">To Client:</span>
                            <span className="text-blue-400 font-bold select-all">{log.to}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            log.status === 'Delivered'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                          }`}>
                            {log.status === 'Delivered' ? '✅ '+log.status : '❌ '+log.status}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 block text-[9.5px]">Subject / মেইল শিরোনাম:</span>
                          <p className="font-extrabold text-white text-xs font-sans mt-0.5 leading-snug">{log.subject}</p>
                        </div>

                        <div className="bg-black/60 p-3 rounded-lg text-[9.5px] text-slate-300 leading-relaxed border border-slate-900 select-all whitespace-pre-line overflow-y-auto max-h-52">
                          {log.body}
                        </div>

                        <div className="text-[8px] text-slate-500 text-right font-semibold">
                          Mail deliver dispatch timestamp: {log.sentAt}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* =======================================================
              CITIES & OPERATIONAL AREA DIRECTORY TAB
              ======================================================= */}
          {activeTab === 'cities' && (
            <div className="space-y-6 text-left">
              <div className="p-4.5 bg-blue-950/10 border border-blue-500/10 rounded-2xl text-xs space-y-2.5 leading-relaxed font-semibold text-slate-350">
                <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 animate-pulse" />
                  Metropolitan Area & Urban Locations Manager (শহর ও এলাকা ব্যবস্থাপনা)
                </h4>
                <p>
                  Manage active operational areas in a **2-Level Format** (headline division/city and sub-areas under it, e.g. **Dhaka** ➔ **Gulshan, Banani**). Custom locations configured here can be updated dynamically and are applied instantly across companion forms, hotels, and checkout controls.
                </p>
              </div>

              {/* Status Banner */}
              {citiesError && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold flex justify-between items-center transition-all animate-fadeIn">
                  <span>⚠️ {citiesError}</span>
                  <button onClick={() => setCitiesError(null)} className="text-[10px] text-slate-400 hover:text-white uppercase font-black tracking-wider cursor-pointer">Dismiss</button>
                </div>
              )}

              {/* Add New Division Area Header */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-amber-500/10 text-xs">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] mb-4 flex items-center gap-1.5 font-mono">
                  <Plus className="w-4 h-4 text-amber-500" />
                  1. ADD NEW DISTRICT / DIVISION HEADLINE (নতুন প্রধান জেলা বা শহর যোগ করুন)
                </h5>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCitiesError(null);
                    const trimmed = newDivisionInput.trim();
                    if (!trimmed) return;
                    
                    const id = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
                    if (!id) return;

                    if (structuredCities.some(d => d.id === id || d.name.toLowerCase() === trimmed.toLowerCase())) {
                      setCitiesError(`The division/district "${trimmed}" already exists.`);
                      return;
                    }

                    const newDiv: ParentArea = {
                      id,
                      name: trimmed,
                      subAreas: []
                    };

                    if (onUpdateStructuredCities) {
                      onUpdateStructuredCities([...structuredCities, newDiv]);
                      setNewDivisionInput('');
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    type="text"
                    required
                    value={newDivisionInput}
                    onChange={(e) => setNewDivisionInput(e.target.value)}
                    placeholder="e.g. DHAKA AREA, CHITTAGONG, SYLHET DIVISION..."
                    className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white font-semibold placeholder-slate-650 focus:outline-none focus:border-amber-500 text-xs font-mono"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-5 py-3 rounded-xl font-heavy uppercase text-[10px] tracking-wider transition-all cursor-pointer active:scale-95 shrink-0"
                  >
                    Create District Headline
                  </button>
                </form>
              </div>

              {/* Active list display (2-level Cards grid) */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] flex items-center gap-1.5 font-mono select-none">
                  <Layers className="w-4 h-4 text-amber-500" />
                  2. MANAGE SUB-AREAS UNDER DISTRICTS (জেলাভিত্তিক উপ-এলাকা সমূহ)
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {structuredCities.map((division) => (
                    <div
                      key={division.id}
                      className="bg-[#11131a] rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between hover:border-slate-800 transition duration-250 shadow-xl"
                    >
                      {/* Division Card Header */}
                      <div className="p-4 bg-black/45 border-b border-slate-900/60 flex items-center justify-between">
                        <div className="flex flex-col text-left">
                          <span className="text-amber-500 text-sm font-black font-sans tracking-wide">
                            📍 {division.name.toUpperCase()}
                          </span>
                          <span className="text-[8.5px] font-mono font-heavy text-slate-500 tracking-wider">
                            HEADLINE ID: {division.id.toUpperCase()} • ({division.subAreas.length} active zones)
                          </span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you absolutely sure you want to delete the entire district headline "${division.name}" and all of its nested zones?`)) {
                              setCitiesError(null);
                              if (onUpdateStructuredCities) {
                                const updated = structuredCities.filter(d => d.id !== division.id);
                                onUpdateStructuredCities(updated);
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title={`Delete entire division ${division.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sub-areas Tags Wrapper */}
                      <div className="p-4.5 flex-1 space-y-4">
                        <div className="flex flex-wrap gap-1.5 min-h-[50px] items-start content-start">
                          {division.subAreas.length === 0 ? (
                            <div className="text-[10px] italic text-slate-500 py-3 block text-center w-full font-medium">
                              ❌ No sub-areas defined yet. Add some below to create the list!
                            </div>
                          ) : (
                            division.subAreas.map((sub) => (
                              <div
                                key={sub}
                                className="bg-black/40 border border-slate-900/80 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-350 flex items-center gap-1.5 hover:border-amber-500/20 transition"
                              >
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCitiesError(null);
                                    if (onUpdateStructuredCities) {
                                      const updated = structuredCities.map(d => {
                                        if (d.id === division.id) {
                                          return {
                                            ...d,
                                            subAreas: d.subAreas.filter(s => s !== sub)
                                          };
                                        }
                                        return d;
                                      });
                                      onUpdateStructuredCities(updated);
                                    }
                                  }}
                                  className="text-slate-500 hover:text-rose-400 text-[10px] font-bold px-0.5 cursor-pointer"
                                  title={`Remove ${sub}`}
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Mini Form to Add subarea Zone */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            setCitiesError(null);
                            const text = subAreaInputMap[division.id]?.trim();
                            if (!text) return;

                            if (division.subAreas.map(s => s.toLowerCase()).includes(text.toLowerCase())) {
                              setCitiesError(`The zone "${text}" already exists under ${division.name}.`);
                              return;
                            }

                            if (onUpdateStructuredCities) {
                              const updated = structuredCities.map(d => {
                                if (d.id === division.id) {
                                  return {
                                    ...d,
                                    subAreas: [...d.subAreas, text]
                                  };
                                }
                                return d;
                              });
                              onUpdateStructuredCities(updated);
                              setSubAreaInputMap({
                                ...subAreaInputMap,
                                [division.id]: ''
                              });
                            }
                          }}
                          className="flex gap-2 pt-2 border-t border-slate-900/60"
                        >
                          <input
                            type="text"
                            required
                            value={subAreaInputMap[division.id] || ''}
                            onChange={(e) => setSubAreaInputMap({
                              ...subAreaInputMap,
                              [division.id]: e.target.value
                            })}
                            placeholder={`Add zone under ${division.name} (যেমন: Gulshan)`}
                            className="flex-1 bg-black/60 border border-slate-850 px-3 py-1.5 rounded-lg text-white font-medium placeholder-slate-650 focus:outline-none focus:border-amber-500 text-[10px]"
                          />
                          <button
                            type="submit"
                            className="bg-slate-850 hover:bg-slate-800 text-amber-500 px-3 py-1.5 rounded-lg font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer flex items-center justify-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* =======================================================
              PAYMENT GATEWAYS AND LIMITS TAB
              ======================================================= */}
          {activeTab === 'gateways' && (
            <div className="space-y-6 text-left font-semibold">
              <div className="p-4.5 bg-[#14101e] border border-blue-500/15 rounded-2xl text-xs space-y-2.5 leading-relaxed text-slate-350">
                <h4 className="text-xs font-black uppercase text-red-500 flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 animate-pulse" />
                  Dynamic Payment Gateway Manager (পেমেন্ট গেটওয়ে কনফিগারেশন)
                </h4>
                <p>
                  You can register, edit, toggle, or remove payment gateways dynamically here to deal with single number transactional limitations. Ensure the active status, correct receiver phone numbers, and clear step instructions are specified so clients receive exact guidance upon checkout.
                </p>
              </div>

              {gatewayError && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold flex justify-between items-center transition-all animate-fadeIn">
                  <span>⚠️ {gatewayError}</span>
                  <button onClick={() => setGatewayError(null)} className="text-[10px] text-slate-400 hover:text-white uppercase font-black tracking-wider">Dismiss</button>
                </div>
              )}

              {/* Add / Edit Gateway Form */}
              <div className="p-6 bg-[#11131a] rounded-2xl border border-white/5 text-xs space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] flex items-center gap-1.5 font-mono">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  {editingGatewayId ? 'EDIT CONFIGURATION / গেটওয়ে সংশোধন করুন' : 'REGISTER NEW GATEWAY / নতুন গেটওয়ে যুক্ত করুন'}
                </h5>
                
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setGatewayError(null);
                    
                    const name = gwName.trim();
                    const number = gwNumber.trim();
                    const instructions = gwInstructions.trim();
                    
                    if (!name || !number || !instructions) {
                      setGatewayError('Please write valid details (Name, Number, and Instructions).');
                      return;
                    }

                    if (editingGatewayId) {
                      const updated = paymentGateways.map(g => {
                        if (g.id === editingGatewayId) {
                          return {
                            ...g,
                            name,
                            method: gwMethod,
                            walletType: gwWalletType,
                            number,
                            instructions
                          };
                        }
                        return g;
                      });
                      if (onUpdatePaymentGateways) {
                        onUpdatePaymentGateways(updated);
                      }
                      setEditingGatewayId(null);
                    } else {
                      const newGateway: PaymentGateway = {
                        id: `gw_${Date.now()}`,
                        name,
                        method: gwMethod,
                        walletType: gwWalletType,
                        number,
                        instructions,
                        isActive: true
                      };
                      if (onUpdatePaymentGateways) {
                        onUpdatePaymentGateways([...paymentGateways, newGateway]);
                      }
                    }

                    // Reset form fields
                    setGwName('');
                    setGwNumber('');
                    setGwInstructions('');
                    setGwMethod('BKASH');
                    setGwWalletType('Personal');
                  }}
                  className="space-y-4 font-semibold text-slate-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    {/* Public Display Name */}
                    <div className="space-y-1 font-semibold">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gateway Public Label Name</label>
                      <input
                        type="text"
                        required
                        value={gwName}
                        onChange={(e) => setGwName(e.target.value)}
                        placeholder="e.g. bKash Personal VIP"
                        className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-bold text-xs"
                      />
                    </div>

                    {/* Channel Type */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Payment Channel</label>
                      <select
                        value={gwMethod}
                        onChange={(e) => setGwMethod(e.target.value as any)}
                        className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-bold h-10 select-none text-xs"
                      >
                        <option value="BKASH">bKash</option>
                        <option value="NAGAD">Nagad</option>
                        <option value="ROCKET">Rocket</option>
                      </select>
                    </div>

                    {/* Limit Wallet Mode */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wallet Account Type</label>
                      <select
                        value={gwWalletType}
                        onChange={(e) => setGwWalletType(e.target.value as any)}
                        className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-bold h-10 select-none text-xs"
                      >
                        <option value="Personal">Personal (সেন্ড মানি)</option>
                        <option value="Agent">Agent (ক্যাশ আউট)</option>
                        <option value="Merchant">Merchant (মার্চেন্ট পেমেন্ট)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {/* Wallet account phone number */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wallet Number (মোবাইল নম্বর)</label>
                      <input
                        type="text"
                        required
                        value={gwNumber}
                        onChange={(e) => setGwNumber(e.target.value)}
                        placeholder="e.g. 01712-345678"
                        className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono font-bold text-xs"
                      />
                    </div>

                    {/* Step guidance instructions */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Payment Step Directions (নির্দেশনা)</label>
                      <input
                        type="text"
                        required
                        value={gwInstructions}
                        onChange={(e) => setGwInstructions(e.target.value)}
                        placeholder="দয়া করে এই নম্বরে Send Money করার পর TrxID প্রদান করুন।"
                        className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    {editingGatewayId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGatewayId(null);
                          setGwName('');
                          setGwNumber('');
                          setGwInstructions('');
                          setGwMethod('BKASH');
                          setGwWalletType('Personal');
                        }}
                        className="bg-slate-800 hover:bg-slate-750 text-white px-5 py-2.5 rounded-xl font-heavy uppercase text-[10px] tracking-wider transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="bg-gradient-to-tr from-red-700 to-red-550 hover:opacity-95 text-white px-5 py-2.5 rounded-xl font-heavy uppercase text-[10px] tracking-wider transition cursor-pointer active:scale-95"
                    >
                      {editingGatewayId ? 'Save Gateway Changes' : 'Register New Gateway'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Display Registered Gateways list */}
              <div className="bg-[#11131a] rounded-2xl border border-white/5 p-4.5">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] border-b border-[#222938] pb-3 mb-4 flex items-center gap-1.5 font-mono text-left select-none">
                  <CreditCard className="w-4 h-4 text-[#ef4444]" />
                  CURRENT ACTIVE PAYMENT GATEWAYS LIST ({paymentGateways.length})
                </h5>

                {paymentGateways.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 font-semibold text-xs">
                    No custom payment gateways are currently registered. In-built default bKash, Nagad, and Rocket methods will be served dynamically.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paymentGateways.map((g) => (
                      <div
                        key={g.id}
                        className={`border rounded-xl p-4 flex flex-col justify-between space-y-4 transition ${
                          g.isActive 
                            ? 'bg-black/35 border-blue-500/10' 
                            : 'bg-black/10 border-slate-850 opacity-60'
                        }`}
                      >
                        <div className="text-left space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-black text-white block truncate max-w-[130px]">{g.name}</span>
                              <span className="text-[8.5px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 mt-1 inline-block">
                                {g.method}
                              </span>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              g.walletType === 'Personal' 
                                ? 'bg-[#1a1738] text-indigo-400 border border-indigo-500/20' 
                                : g.walletType === 'Agent' 
                                  ? 'bg-[#381729] text-pink-400 border border-pink-500/20' 
                                  : 'bg-[#173822] text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {g.walletType}
                            </span>
                          </div>

                          <div className="bg-black/40 p-2.5 rounded border border-white/5 space-y-1">
                            <span className="text-[8px] text-slate-500 block uppercase font-extrabold">Account Phone Number</span>
                            <span className="text-[11px] font-bold font-mono tracking-wider text-slate-200 block">{g.number}</span>
                          </div>

                          <p className="text-[9.5px] text-slate-400 leading-normal font-sans tracking-wide py-1 line-clamp-2" title={g.instructions}>
                            {g.instructions}
                          </p>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-900 pt-3 text-xs">
                          {/* Toggle Switch Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = paymentGateways.map(item => {
                                if (item.id === g.id) {
                                  return { ...item, isActive: !item.isActive };
                                }
                                return item;
                              });
                              if (onUpdatePaymentGateways) {
                                onUpdatePaymentGateways(updated);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all duration-200 border cursor-pointer active:scale-95 ${
                              g.isActive
                                ? 'bg-[#103025] text-emerald-400 border-emerald-500/25 hover:border-emerald-500/55'
                                : 'bg-slate-900 text-slate-500 border-slate-850 hover:text-slate-200 hover:border-slate-800'
                            }`}
                          >
                            {g.isActive ? '● Live' : '○ Disabled'}
                          </button>

                          <div className="flex items-center gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingGatewayId(g.id);
                                setGwName(g.name);
                                setGwNumber(g.number);
                                setGwInstructions(g.instructions);
                                setGwMethod(g.method as any);
                                setGwWalletType(g.walletType as any);
                              }}
                              className="p-1 px-2 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition cursor-pointer"
                              title="Edit Gateway"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = paymentGateways.filter(item => item.id !== g.id);
                                if (onUpdatePaymentGateways) {
                                  onUpdatePaymentGateways(updated);
                                }
                                if (editingGatewayId === g.id) {
                                  setEditingGatewayId(null);
                                  setGwName('');
                                  setGwNumber('');
                                  setGwInstructions('');
                                  setGwMethod('BKASH');
                                  setGwWalletType('Personal');
                                }
                              }}
                              className="p-1 px-2 rounded bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-350 hover:bg-red-950/35 transition cursor-pointer"
                              title="Delete Gateway"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              ADMINISTRATIVE ACCOUNTS & DIRECTORY OVERVIEW TAB
              ======================================================= */}
          {activeTab === 'admins' && (
            <div className="space-y-6 text-left font-semibold">
              <div className="p-4.5 bg-[#14101e] border border-red-500/15 rounded-2xl text-xs space-y-2.5 leading-relaxed text-slate-350 animate-fadeIn">
                <h4 className="text-xs font-black uppercase text-red-500 flex items-center gap-2">
                  <ShieldCheck className="w-4.5 h-4.5 animate-pulse" />
                  Dynamic Administrators List (এডমিন অ্যাকাউন্ট তালিকা)
                </h4>
                <p>
                  You can register, view, or revoke system administrator email whitelists dynamically here to handle your access constraints. Whitelisted administrator emails can trigger secure 2-Factor authentication login codes instantly when logging in via the Admin Workspace.
                </p>
              </div>

              {/* Add New Admin Form */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-white/5 text-xs space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] flex items-center gap-1.5 font-mono">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  Whitelisted Email Registration / নতুন এডমিন ইমেইল যোগ করুন
                </h5>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const inputElement = e.currentTarget.elements.namedItem('newAdminEmail') as HTMLInputElement;
                    const value = inputElement?.value?.trim()?.toLowerCase();
                    if (!value) return;

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                      alert('দয়া করে একটি সঠিক ইমেল সংস্করণ ব্যবহার করুন।');
                      return;
                    }

                    if (adminEmails.map(m => m.toLowerCase()).includes(value)) {
                      alert('This email is already registered as an administrator.');
                      return;
                    }

                    updateAdminEmails([...adminEmails, value]);
                    if (inputElement) inputElement.value = '';
                  }}
                  className="flex gap-3 text-xs"
                >
                  <input
                    type="email"
                    name="newAdminEmail"
                    required
                    placeholder="e.g. support@metromaa.com"
                    className="flex-grow bg-black/40 border border-[#232733] rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-bold font-mono text-xs"
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-tr from-red-700 to-red-550 hover:opacity-95 text-white px-5 py-2.5 rounded-xl font-heavy uppercase text-[10px] tracking-wider transition cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    Add Admin Email
                  </button>
                </form>
              </div>

              {/* List of Whitelisted Emails */}
              <div className="bg-[#11131a] rounded-2xl border border-white/5 p-4.5">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] border-b border-[#222938] pb-3 mb-4 flex items-center gap-1.5 font-mono text-left select-none">
                  <Users className="w-4 h-4 text-[#ef4444]" />
                  CURRENT ACTIVE SYSTEM ADMINISTRATORS ({adminEmails.length})
                </h5>

                <div className="space-y-2">
                  {adminEmails.map((emailAddress) => {
                    const isPrimary = emailAddress.toLowerCase() === 'akhi.akther.ofc@gmail.com';
                    return (
                      <div
                        key={emailAddress}
                        className="bg-black/30 border border-white/5 rounded-xl p-3 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-950/40 border border-red-500/20 flex items-center justify-center text-red-400 font-extrabold text-xs">
                            A
                          </div>
                          <div className="text-left font-mono">
                            <span className="text-xs font-bold text-slate-200 block">{emailAddress}</span>
                            <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-500 mt-0.5 block">
                              {isPrimary ? 'Primary Executive Owner' : 'Regional Admin Staff'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          {isPrimary ? (
                            <span className="text-[8px] font-black uppercase bg-[#103025] text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                              Protected
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to revoke Admin access for ${emailAddress}?`)) {
                                  updateAdminEmails(adminEmails.filter(e => e.toLowerCase() !== emailAddress.toLowerCase()));
                                }
                              }}
                              className="p-1 px-2.5 rounded bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-350 hover:bg-red-950/35 text-[9px] font-extrabold uppercase transition cursor-pointer"
                            >
                              Revoke Access
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              MODEL APPLICATIONS VERIFICATION (মডেল যাচাইকরণ) TAB
              ======================================================= */}
          {activeTab === 'verification' && (
            <div className="space-y-6 text-left font-semibold">
              <div className="p-4.5 bg-[#14101e] border border-red-500/15 rounded-2xl text-xs space-y-2.5 leading-relaxed text-slate-300 animate-fadeIn">
                <h4 className="text-xs font-black uppercase text-red-500 flex items-center gap-2">
                  <UserCheck className="w-4.5 h-4.5 animate-pulse" />
                  Model Applications Verification Suite (মডেল রেজিস্ট্রেশন যাচাইকরণ প্যানেল)
                </h4>
                <p>
                  Review professional candidate requests hoping to enlist onto the premium roster at bodyTOUCH. You may inspect applicant profiles, adjust and verify base or service specific rate configurations, assign official high-society badges (DEMO, REGULAR, PREMIUM, or ELITE), and instantly approve or decline their recruitment status.
                </p>
              </div>

              {/* Stats overview boxes */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#11131a] border border-white/5 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold font-sans">Total Applicants</span>
                  <span className="text-xl font-black text-white mt-1 block font-mono">{pendingApplicantsList.length} Candidates</span>
                </div>
                <div className="bg-[#11131a] border border-white/5 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold font-sans">Female Models</span>
                  <span className="text-xl font-black text-rose-400 mt-1 block font-mono">{pendingApplicantsList.filter(c => (c.category || 'Female Model') === 'Female Model').length} Pending</span>
                </div>
                <div className="bg-[#11131a] border border-white/5 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold font-sans">Male Models</span>
                  <span className="text-xl font-black text-cyan-400 mt-1 block font-mono">{pendingApplicantsList.filter(c => c.category === 'Male Model').length} Pending</span>
                </div>
                <div className="bg-[#11131a] border border-white/5 p-4 rounded-xl">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold font-sans">Sperm Donors</span>
                  <span className="text-xl font-black text-purple-400 mt-1 block font-mono">{pendingApplicantsList.filter(c => c.category === 'Sperm Donor').length} Pending</span>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="p-4 bg-[#11131a] rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center">
                {/* Search field */}
                <div className="w-full md:w-1/3 relative text-xs">
                  <input
                    type="text"
                    value={verifySearch}
                    onChange={(e) => setVerifySearch(e.target.value)}
                    placeholder="Search applicant name, phone, or email..."
                    className="w-full bg-black/40 border border-[#232733] rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-bold"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>

                {/* Category filter */}
                <div className="w-full md:w-1/4">
                  <select
                    value={verifyCategoryFilter}
                    onChange={(e) => setVerifyCategoryFilter(e.target.value as any)}
                    className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-bold select-none h-10 text-xs text-left"
                  >
                    <option value="ALL">All Categories / সকল ক্যাটাগরি</option>
                    <option value="Female Model">Female Model / নারী মডেল</option>
                    <option value="Male Model">Male Model / পুরুষ মডেল</option>
                    <option value="Sperm Donor">Sperm Donor / স্পার্ম ডোনার</option>
                  </select>
                </div>

                {/* Citites Filter */}
                <div className="w-full md:w-1/4">
                  <select
                    value={verifyCityFilter}
                    onChange={(e) => setVerifyCityFilter(e.target.value)}
                    className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-bold select-none h-10 text-xs text-left"
                  >
                    <option value="ALL">All Cities / সকল শহর</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Reset button */}
                <button
                  type="button"
                  onClick={() => {
                    setVerifySearch('');
                    setVerifyCategoryFilter('ALL');
                    setVerifyCityFilter('ALL');
                  }}
                  className="w-full md:w-auto bg-slate-800 hover:bg-slate-755 text-white px-4 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition whitespace-nowrap"
                >
                  Reset Filters
                </button>
              </div>

              {/* Applicants list container */}
              <div className="bg-[#11131a] rounded-2xl border border-white/5 p-4.5">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] border-b border-[#222938] pb-3 mb-4 flex items-center gap-1.5 font-mono text-left select-none">
                  <UserCheck className="w-4 h-4 text-[#ef4444]" />
                  AWAITING REVIEW CANDIDATES
                </h5>

                {(() => {
                  const filtered = pendingApplicantsList.filter(comp => {
                    const matchesSearch = !verifySearch || 
                      comp.name.toLowerCase().includes(verifySearch.toLowerCase()) ||
                      (comp.email || '').toLowerCase().includes(verifySearch.toLowerCase()) ||
                      (comp.phone || '').toLowerCase().includes(verifySearch.toLowerCase());
                    const matchesCategory = verifyCategoryFilter === 'ALL' || (comp.category || 'Female Model') === verifyCategoryFilter;
                    const matchesCity = verifyCityFilter === 'ALL' || (comp.city || 'Dhaka') === verifyCityFilter;
                    return matchesSearch && matchesCategory && matchesCity;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-black/20 border border-dashed border-slate-800/80 rounded-3xl select-none">
                        📬 No pending model applications matching your filter specifications.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filtered.map(comp => {
                        // Retrieve custom configurations state
                        const config = verifyEditingConfig[comp.id] || {
                          badge: comp.badge || 'REGULAR',
                          rate: comp.rate || 8000,
                          rateReal: comp.rateReal,
                          rateCam: comp.rateCam,
                          rateLiveTogether: comp.rateLiveTogether
                        };

                        const handleFieldChange = (field: string, val: any) => {
                          setVerifyEditingConfig(prev => ({
                            ...prev,
                            [comp.id]: {
                              ...config,
                              [field]: val
                            }
                          }));
                        };

                        const handleAcceptClick = () => {
                          // Compile edits back to the model object in the database state
                          const updated = companions.map(c => {
                            if (c.id === comp.id) {
                              return {
                                ...c,
                                badge: config.badge,
                                rate: config.rate,
                                rateReal: config.rateReal,
                                rateCam: config.rateCam,
                                rateLiveTogether: config.rateLiveTogether
                              };
                            }
                            return c;
                          });
                          onUpdateCompanions(updated);
                          // Trigger verification / emails
                          if (onApproveCompanion) {
                            onApproveCompanion(comp.id);
                          }
                        };

                        return (
                          <div
                            key={comp.id}
                            className="bg-black/35 border border-red-500/10 hover:border-red-500/20 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition text-slate-300"
                          >
                            <div className="space-y-4">
                              {/* Applicant details */}
                              <div className="flex gap-4 items-start pb-4 border-b border-white/5">
                                <img
                                  src={comp.image || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"}
                                  alt={comp.name}
                                  className="w-14 h-14 rounded-xl object-cover border border-red-500/15"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-left space-y-1">
                                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                                    {comp.name}
                                    <span className="text-[9px] text-[#2ebdff] font-mono tracking-wider font-semibold">{comp.tag || '@partner'}</span>
                                  </h4>
                                  <div className="flex gap-2">
                                    <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-pink-950/40 text-pink-400 border border-pink-500/10 font-bold block">
                                      {comp.category || 'Female Model'}
                                    </span>
                                    <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-805 text-slate-400 font-bold block">
                                      {comp.city || 'Dhaka'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Attributes Overview */}
                              <div className="grid grid-cols-3 gap-2.5 text-[10px] text-slate-400 font-bold">
                                <div className="bg-[#11131a] p-2 rounded-xl text-left">
                                  <span className="text-slate-550 text-[8px] uppercase block font-mono">Age:</span>
                                  <span className="text-white font-heavy">{comp.age} Years</span>
                                </div>
                                <div className="bg-[#11131a] p-2 rounded-xl text-left">
                                  <span className="text-slate-550 text-[8px] uppercase block font-mono">Height:</span>
                                  <span className="text-white font-heavy">{comp.height}</span>
                                </div>
                                <div className="bg-[#11131a] p-2 rounded-xl text-left">
                                  <span className="text-slate-550 text-[8px] uppercase block font-mono">Complexion:</span>
                                  <span className="text-white font-heavy">{comp.bodyColor || 'Fair Skin'}</span>
                                </div>
                              </div>

                              {/* Biological description block */}
                              <div className="bg-[#11131a] p-3 rounded-xl border border-white/5 space-y-1 text-xs text-left">
                                <span className="text-slate-550 text-[8px] font-black uppercase tracking-wider block font-mono">Self Summary / Intro (বায়োডাটা):</span>
                                <p className="text-slate-300 italic font-medium leading-relaxed leading-tight text-[10.5px]">
                                  "{comp.specialty || 'ক্যারিয়ার হিসেবে পেশাদার রয়্যাল ক্যাটাগরি পোর্টালে যুক্ত হওয়ার চমৎকার অভিজ্ঞতা অর্জন করতে ইচ্ছুক।'}"
                                </p>
                              </div>

                              {/* Phone and Email */}
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="bg-[#11131a] p-2.5 rounded-xl border border-slate-900 text-left">
                                  <span className="text-slate-500 text-[8px] uppercase block font-mono">Mobile Number</span>
                                  <span className="text-blue-400 font-mono font-bold font-black tracking-normal select-all">{comp.phone || '01XXXXXXXXX'}</span>
                                </div>
                                <div className="bg-[#11131a] p-2.5 rounded-xl border border-slate-900 text-left">
                                  <span className="text-slate-550 text-[8px] uppercase block font-mono">Email Address</span>
                                  <span className="text-[#2ebdff] font-mono font-bold tracking-tight select-all text-[11px] block truncate">{comp.email || 'N/A'}</span>
                                </div>
                              </div>

                              {/* Model Identity Verification Documents */}
                              {(comp.nidFront || comp.nidBack || comp.selfie) && (
                                <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl space-y-2 text-left">
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-red-400 block font-mono">
                                    🆔 Verification Documents / আইডি ও সেলফি ভেরিফিকেশন
                                  </span>
                                  <div className="grid grid-cols-3 gap-2">
                                    {/* Selfie Verification */}
                                    {comp.selfie ? (
                                      <div className="bg-black/40 border border-[#2b1717] rounded-lg p-1.5 text-center flex flex-col justify-between items-center h-20">
                                        <span className="text-[7.5px] text-slate-400 uppercase font-mono tracking-tight block truncate w-full">Selfie / সেলফি</span>
                                        <a href={comp.selfie} target="_blank" rel="noopener noreferrer" className="block w-full h-11 relative overflow-hidden rounded border border-red-500/10">
                                          <img src={comp.selfie} alt="Selfie" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="bg-black/20 border border-slate-900 rounded-lg p-1.5 h-20 flex items-center justify-center text-[7.5px] text-slate-550 uppercase">
                                        No Selfie
                                      </div>
                                    )}

                                    {/* NID Front */}
                                    {comp.nidFront ? (
                                      <div className="bg-black/40 border border-[#2b1717] rounded-lg p-1.5 text-center flex flex-col justify-between items-center h-20">
                                        <span className="text-[7.5px] text-slate-400 uppercase font-mono tracking-tight block truncate w-full">NID Front / সামনে</span>
                                        <a href={comp.nidFront} target="_blank" rel="noopener noreferrer" className="block w-full h-11 relative overflow-hidden rounded border border-red-500/10">
                                          <img src={comp.nidFront} alt="NID Front" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="bg-black/20 border border-slate-900 rounded-lg p-1.5 h-20 flex items-center justify-center text-[7.5px] text-slate-550 uppercase">
                                        No Front
                                      </div>
                                    )}

                                    {/* NID Back */}
                                    {comp.nidBack ? (
                                      <div className="bg-black/40 border border-[#2b1717] rounded-lg p-1.5 text-center flex flex-col justify-between items-center h-20">
                                        <span className="text-[7.5px] text-slate-400 uppercase font-mono tracking-tight block truncate w-full">NID Back / পেছনে</span>
                                        <a href={comp.nidBack} target="_blank" rel="noopener noreferrer" className="block w-full h-11 relative overflow-hidden rounded border border-red-500/10">
                                          <img src={comp.nidBack} alt="NID Back" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </a>
                                      </div>
                                    ) : (
                                      <div className="bg-black/20 border border-slate-900 rounded-lg p-1.5 h-20 flex items-center justify-center text-[7.5px] text-slate-550 uppercase">
                                        No Back
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Administration verification inputs */}
                              <div className="p-4.5 bg-black/40 rounded-xl border border-dashed border-red-500/10 space-y-3.5 text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#ef4444] border-b border-[#222938] pb-1.5 block">
                                  ADMIN APPROVAL SETTINGS (অনুমোদন কনফিগারেশন)
                                </span>

                                <div className="p-3 bg-emerald-950/20 border border-emerald-500/15 rounded-xl text-[10px] text-emerald-400 leading-relaxed font-semibold">
                                  💡 <strong>Admin Guidelines / অ্যাডমিন নির্দেশিকা:</strong>
                                  <p className="mt-1 font-sans">
                                    রেজিস্ট্রেশন কমপ্লিট করার পর শুধু নিচে রেট (Taka) বসিয়ে দিন এবং ৩টি ক্যাটাগরির (Regular, Premium, Elite) যেকোনো একটি সিলেক্ট করে <span className="text-white underline font-extrabold uppercase font-mono">Verify & Deploy</span>-এ ক্লিক করে দিলেই সরাসরি পাবলিশ হয়ে যাবে।
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5 text-left">
                                  {/* Verification Tier badge selection */}
                                  <div className="space-y-1">
                                    <label className="block text-[8.5px] text-slate-400 uppercase tracking-widest font-bold">Assign Society Rank (লেভেল)</label>
                                    <select
                                      value={config.badge}
                                      onChange={(e) => handleFieldChange('badge', e.target.value as any)}
                                      className="w-full bg-black border border-[#232733] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-red-500 font-bold select-none text-xs h-9"
                                    >
                                      <option value="REGULAR">Regular Member (রেগুলার ক্যাটাগরি)</option>
                                      <option value="PREMIUM">Premium Member (প্রিমিয়াম ক্যাটাগরি)</option>
                                      <option value="ELITE">Elite Society (এলিট ক্যাটাগরি)</option>
                                      <option value="DEMO">Demo Class (ডিমো ক্যাটাগরি)</option>
                                    </select>
                                  </div>

                                  {/* Rate value */}
                                  <div className="space-y-1">
                                    <label className="block text-[8.5px] text-slate-400 uppercase tracking-widest font-bold">Hourly Rate Override (৳ / hr)</label>
                                    <input
                                      type="number"
                                      value={config.rate}
                                      onChange={(e) => handleFieldChange('rate', Number(e.target.value))}
                                      placeholder="e.g. 8000"
                                      className="w-full h-9 bg-black border border-[#232733] rounded-lg px-2.5 py-1.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono font-bold text-xs"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="space-y-1 text-left">
                                    <label className="block text-[8px] text-slate-500 uppercase font-mono text-slate-400">Real Meet Override (৳)</label>
                                    <input
                                      type="number"
                                      value={config.rateReal || ''}
                                      onChange={(e) => handleFieldChange('rateReal', e.target.value ? Number(e.target.value) : undefined)}
                                      placeholder="Not Set"
                                      className="w-full bg-[#11131a]/85 border border-[#232733] rounded px-1.5 py-1 text-white font-mono text-[10.5px]"
                                    />
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <label className="block text-[8px] text-slate-500 uppercase font-mono font-bold text-slate-400">Video Cam Override (৳)</label>
                                    <input
                                      type="number"
                                      value={config.rateCam || ''}
                                      onChange={(e) => handleFieldChange('rateCam', e.target.value ? Number(e.target.value) : undefined)}
                                      placeholder="Not Set"
                                      className="w-full bg-[#11131a]/85 border border-[#232733] rounded px-1.5 py-1 text-white font-mono text-[10.5px]"
                                    />
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <label className="block text-[8px] text-slate-500 uppercase font-mono text-slate-400">Live Together Override (৳/Day)</label>
                                    <input
                                      type="number"
                                      value={config.rateLiveTogether || ''}
                                      onChange={(e) => handleFieldChange('rateLiveTogether', e.target.value ? Number(e.target.value) : undefined)}
                                      placeholder="Not Set"
                                      className="w-full bg-[#11131a]/85 border border-[#232733] rounded px-1.5 py-1 text-white font-mono text-[10.5px]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Verification action buttons */}
                            <div className="flex gap-3 border-t border-white/5 pt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`মডেল ${comp.name}-এর আবেদন প্রত্যাখ্যান এবং ডাটাবেজ থেকে মুছে ফেলতে চান?`)) {
                                    if (onDeclineCompanion) {
                                      onDeclineCompanion(comp.id);
                                    }
                                  }
                                }}
                                className="flex-1 bg-red-955/20 hover:bg-red-950/40 border border-red-500/20 text-red-500 hover:text-red-350 text-[10px] font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                              >
                                Decline Candidate (বাতিল করুন)
                              </button>
                              <button
                                type="button"
                                onClick={handleAcceptClick}
                                className="flex-1 bg-gradient-to-tr from-[#113824] to-[#125832] hover:opacity-95 border border-emerald-500/30 text-emerald-400 hover:text-white text-[10px] font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-emerald-950/30 font-bold"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Verify & Deploy (অনুমোদন করুন)
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* =======================================================
              REGISTRATION SHORT LINKS DIRECTORY TAB
              ======================================================= */}
          {activeTab === 'shortlinks' && (
            <div className="space-y-6 text-left font-semibold">
              <div className="p-4.5 bg-[#14101e] border border-[#dbaa61]/35 rounded-2xl text-xs space-y-2.5 leading-relaxed text-slate-300 animate-fadeIn shadow-[0_0_20px_rgba(219,170,97,0.05)]">
                <h4 className="text-xs font-black uppercase text-[#dbaa61] flex items-center gap-2">
                  <Link2 className="w-4.5 h-4.5 text-[#dbaa61]" />
                  Registration Route Manager (নিবন্ধকরণ শর্ট লিংক ডিরেক্টরি)
                </h4>
                <p className="text-slate-300 font-semibold font-sans">
                  নিচের লিংকগুলো সরাসরি ব্যবহারকারী বা মডেল প্রার্থীদের সাথে শেয়ার করা যাবে। ক্লিক করার সাথে সাথে সংশ্লিষ্ট রেজিস্ট্রেশন ফরমের মডাল উইন্ডোটি ব্রাউজারে স্বয়ংক্রিয়ভাবে ওপেন হয়ে যাবে। প্রার্থীদের যোগ্যতা অনুযায়ী সঠিক লিংক কপি করে দিন।
                </p>
              </div>

              {/* Dynamic System Pricing Customizer */}
              <div className="bg-[#0b0c15] border-2 border-[#ac843c]/40 rounded-2xl p-6 space-y-5 shadow-lg relative overflow-hidden font-sans">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ac843c]/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-black text-[#dbaa61] uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-[#dbaa61]" />
                      Dynamic System Pricing & Fees Config (সার্ভিস ও ফি কনফিগারেশন)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      সার্ভিসের মেম্বারশিপ প্ল্যান পেমেন্ট এবং মডেল তালিকাভুক্তি ফি এডমিন প্যানেল থেকে পরিবর্তন করুন।
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-black text-rose-450 border border-rose-500/10 px-2.5 py-1.5 rounded-full bg-rose-500/5">
                    ● ACTIVE PRICING ENGINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Fee 1 */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-300 font-mono tracking-wider">
                      Model Registration Fee (৳):
                    </label>
                    <input
                      type="number"
                      value={localRegFee}
                      onChange={(e) => setLocalRegFee(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950/80 border border-slate-800 focus:border-[#dbaa61] rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  {/* Fee 2 */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-300 font-mono tracking-wider">
                      Regular Plan Membership (৳):
                    </label>
                    <input
                      type="number"
                      value={localRegularFee}
                      onChange={(e) => setLocalRegularFee(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950/80 border border-slate-800 focus:border-[#dbaa61] rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  {/* Fee 3 */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-300 font-mono tracking-wider">
                      Premium Plan Membership (৳):
                    </label>
                    <input
                      type="number"
                      value={localPremiumFee}
                      onChange={(e) => setLocalPremiumFee(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950/80 border border-slate-800 focus:border-[#dbaa61] rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  {/* Fee 4 */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-300 font-mono tracking-wider">
                      Elite Plan Membership (৳):
                    </label>
                    <input
                      type="number"
                      value={localEliteFee}
                      onChange={(e) => setLocalEliteFee(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950/80 border border-slate-800 focus:border-[#dbaa61] rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {pricingSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>পদ্ধতিগত অ্যামাউন্ট সফলভাবে পরিবর্তন করা হয়েছে এবং মেম্বারশিপ স্ক্রিনে প্রদর্শিত হচ্ছে!</span>
                  </motion.div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdatePricingConfig) {
                        onUpdatePricingConfig({
                          registrationFee: localRegFee,
                          regularPlanFee: localRegularFee,
                          premiumPlanFee: localPremiumFee,
                          elitePlanFee: localEliteFee,
                        });
                        setPricingSuccess(true);
                        setTimeout(() => setPricingSuccess(false), 3000);
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-[#04d98c] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Save Pricing Config
                  </button>
                </div>
              </div>

              {/* Grid with 3 registration modes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Female Model */}
                <div className="bg-[#0f111a] border border-[#1b1f32] hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all duration-300 shadow-md">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-rose-500/10 text-rose-400 font-mono font-bold px-2.5 py-1 rounded-md border border-rose-500/10 uppercase tracking-widest">
                        Female Model
                      </span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse mt-1.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white font-display">Female Model Registry</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">ফিমেল মডেল রেজিস্ট্রেশন পোর্টাল</p>
                    </div>
                    
                    {/* Visitor stats counter */}
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-black/30 border border-slate-800/60 p-2 rounded-xl text-center">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-mono uppercase font-black">Clicks</span>
                        <span className="text-sm font-black text-cyan-400 font-mono">
                          {((shortLinkStats['join-female-1']?.clicks || 0) + (shortLinkStats['join-female-2']?.clicks || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-l border-slate-800">
                        <span className="block text-[10px] text-slate-400 font-mono uppercase font-black font-sans">Joins</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {((shortLinkStats['join-female-1']?.joins || 0) + (shortLinkStats['join-female-2']?.joins || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-normal font-sans border-t border-white/5 pt-3">
                      বিলাসবহুল সার্ভিসের জন্য ফিমেল ক্যান্ডিডেটদের কাছে এই লিংক শেয়ার করুন।
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Link 1: /#join */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Short Link 1:</span>
                      <div className="flex items-center gap-2 bg-black/40 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
                        <span className="text-[#00e5ff] font-bold select-all truncate flex-1">{window.location.origin}/#join</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyToClipboard(`${window.location.origin}/#join`, 'join-female-1')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Copy To Clipboard"
                          >
                            {copiedId === 'join-female-1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => window.open('/#join', '_blank')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Test Route"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Link 2: /#register */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Short Link 2 (Alternative):</span>
                      <div className="flex items-center gap-2 bg-black/40 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
                        <span className="text-[#00e5ff] font-bold select-all truncate flex-1">{window.location.origin}/#register</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyToClipboard(`${window.location.origin}/#register`, 'join-female-2')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Copy To Clipboard"
                          >
                            {copiedId === 'join-female-2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => window.open('/#register', '_blank')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Test Route"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Male Model */}
                <div className="bg-[#0f111a] border border-[#1b1f32] hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all duration-300 shadow-md">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 font-mono font-bold px-2.5 py-1 rounded-md border border-blue-500/10 uppercase tracking-widest">
                        Male Companion
                      </span>
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mt-1.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white font-display">Male Model Registry</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">মেইল মডেল রেজিস্ট্রেশন পোর্টাল</p>
                    </div>

                    {/* Visitor stats counter */}
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-black/30 border border-slate-800/60 p-2 rounded-xl text-center font-sans">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-mono uppercase font-black">Clicks</span>
                        <span className="text-sm font-black text-cyan-400 font-mono">
                          {((shortLinkStats['join-male-1']?.clicks || 0) + (shortLinkStats['join-male-2']?.clicks || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-l border-slate-800">
                        <span className="block text-[10px] text-slate-400 font-mono uppercase font-black">Joins</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {((shortLinkStats['join-male-1']?.joins || 0) + (shortLinkStats['join-male-2']?.joins || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-normal font-sans border-t border-white/5 pt-3">
                      মেইল কম্প্যানিয়ন প্রার্থীদের জন্য এই ডেডিকেটেড সরাসরি রেজিস্ট্রেশন লিংক শেয়ার করুন।
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Link 1: /#joinmale */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Short Link 1:</span>
                      <div className="flex items-center gap-2 bg-black/40 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
                        <span className="text-[#00e5ff] font-bold select-all truncate flex-1">{window.location.origin}/#joinmale</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyToClipboard(`${window.location.origin}/#joinmale`, 'join-male-1')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Copy To Clipboard"
                          >
                            {copiedId === 'join-male-1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => window.open('/#joinmale', '_blank')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Test Route"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Link 2: /#join-male */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Short Link 2 (Alternative):</span>
                      <div className="flex items-center gap-2 bg-black/40 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
                        <span className="text-[#00e5ff] font-bold select-all truncate flex-1">{window.location.origin}/#join-male</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyToClipboard(`${window.location.origin}/#join-male`, 'join-male-2')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Copy To Clipboard"
                          >
                            {copiedId === 'join-male-2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => window.open('/#join-male', '_blank')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Test Route"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Sperm Donor */}
                <div className="bg-[#0f111a] border border-[#1b1f32] hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-5 transition-all duration-300 shadow-md">
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono font-bold px-2.5 py-1 rounded-md border border-amber-500/10 uppercase tracking-widest">
                        Sperm Donor
                      </span>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1.5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white font-display">Sperm Donor Registry</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">স্পার্ম ডোনার রেজিস্ট্রেশন পোর্টাল</p>
                    </div>

                    {/* Visitor stats counter */}
                    <div className="grid grid-cols-2 gap-2 mt-2 bg-black/30 border border-slate-800/60 p-2 rounded-xl text-center font-sans">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-mono uppercase font-black font-sans">Clicks</span>
                        <span className="text-sm font-black text-cyan-400 font-mono">
                          {((shortLinkStats['join-sparm-1']?.clicks || 0) + (shortLinkStats['join-sparm-2']?.clicks || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-l border-slate-800">
                        <span className="block text-[10px] text-slate-400 font-mono uppercase font-black">Joins</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {((shortLinkStats['join-sparm-1']?.joins || 0) + (shortLinkStats['join-sparm-2']?.joins || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-normal font-sans border-t border-white/5 pt-3">
                      স্পার্ম ডোনার ক্যান্ডিডেটদের কাছে এই রিক্রুটমেন্ট সাবমিশন ফরমের লিংক সরাসরি শেয়ার করুন।
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Link 1: /#joinsparm */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Short Link 1:</span>
                      <div className="flex items-center gap-2 bg-black/40 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
                        <span className="text-[#00e5ff] font-bold select-all truncate flex-1">{window.location.origin}/#joinsparm</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyToClipboard(`${window.location.origin}/#joinsparm`, 'join-sparm-1')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Copy To Clipboard"
                          >
                            {copiedId === 'join-sparm-1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => window.open('/#joinsparm', '_blank')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Test Route"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Link 2: /#join-sparm */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Short Link 2 (Alternative):</span>
                      <div className="flex items-center gap-2 bg-black/40 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
                        <span className="text-[#00e5ff] font-bold select-all truncate flex-1">{window.location.origin}/#join-sparm</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopyToClipboard(`${window.location.origin}/#join-sparm`, 'join-sparm-2')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Copy To Clipboard"
                          >
                            {copiedId === 'join-sparm-2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => window.open('/#join-sparm', '_blank')}
                            className="text-slate-400 hover:text-white transition p-1"
                            title="Test Route"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Instructions Callout Box */}
              <div className="bg-[#0e0c15] border border-blue-500/10 p-5 rounded-xl font-sans space-y-2 leading-relaxed">
                <h4 className="text-white text-xs font-black uppercase tracking-wider">💡 এডমিন রিমাইন্ডার / Instructions:</h4>
                <p className="text-slate-400 text-xs font-semibold">
                  ১. এই লিংকগুলো ব্রাউজারের অ্যাড্রেস বারে কপি করে সরাসরি রিডাইরেক্ট হওয়া চেক করতে পারেন।<br />
                  ২. লিংকে ক্লিক করা মাত্রই গ্রাহকের স্ক্রিনে মূল মডাল বা রেজিস্ট্রেশন কার্ড ভেসে উঠবে। অ্যাপের ভেতরের সাধারণ ক্যাটালগ দেখতে চাইলে ক্যান্ডিডেটকে শুধু মূল ওয়েবসাইটের ডোমেইনটি শেয়ার করবেন।
                </p>
              </div>

            </div>
          )}

          {/* =======================================================
              AFFILIATE REFERRALS & PAYOUTS LEDGER TAB
              ======================================================= */}
          {activeTab === 'referrals' && (
            <div className="space-y-8 text-left animate-fadeIn">
              
              {/* TOP GLOBAL STATS ROW */}
              {(() => {
                const totalJoins = referrals.length;
                const totalConverted = referrals.filter(r => r.tier !== 'FREE').length;
                const totalEarnedCommission = referrals.reduce((sum, r) => sum + r.commission, 0);
                
                const approvedWithdrawalsSum = withdrawals
                  .filter(w => w.status === 'Approved')
                  .reduce((sum, w) => sum + w.amount, 0);
                  
                const pendingWithdrawalsSum = withdrawals
                  .filter(w => w.status === 'Pending')
                  .reduce((sum, w) => sum + w.amount, 0);

                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#0a0b10] border border-blue-500/10 p-4 rounded-2xl">
                    <div className="bg-[#11131c] border border-blue-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-blue-400">
                        <span className="text-[10px] font-black uppercase tracking-wider">Total Joins</span>
                        <Users className="w-4 h-4 bg-blue-500/10 p-0.5 rounded" />
                      </div>
                      <div className="mt-3">
                        <span className="text-xl font-black text-white font-mono">{totalJoins}</span>
                        <span className="text-[9px] text-slate-500 block">All signups via link</span>
                      </div>
                    </div>

                    <div className="bg-[#11131c] border border-green-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-emerald-400">
                        <span className="text-[10px] font-black uppercase tracking-wider font-sans">Sales</span>
                        <Sparkles className="w-4 h-4 bg-emerald-500/10 p-0.5 rounded" />
                      </div>
                      <div className="mt-3">
                        <span className="text-xl font-black text-white font-mono">{totalConverted}</span>
                        <span className="text-[9px] text-slate-500 block">Paid subscriptions</span>
                      </div>
                    </div>

                    <div className="bg-[#11131c] border border-cyan-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-cyan-400">
                        <span className="text-[10px] font-black uppercase tracking-wider">Total Commission</span>
                        <DollarSign className="w-4 h-4 bg-cyan-500/10 p-0.5 rounded" />
                      </div>
                      <div className="mt-3">
                        <span className="text-xl font-black text-white font-mono">৳{totalEarnedCommission.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 block">Generated earnings</span>
                      </div>
                    </div>

                    <div className="bg-[#11131c] border border-amber-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between text-amber-400">
                        <span className="text-[10px] font-black uppercase tracking-wider">Pending Payouts</span>
                        <Clock className="w-4 h-4 bg-amber-500/10 p-0.5 rounded" />
                      </div>
                      <div className="mt-3">
                        <span className="text-xl font-black text-white font-mono">৳{pendingWithdrawalsSum.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 block">Awaiting approval</span>
                      </div>
                    </div>

                    <div className="bg-[#11131c] border border-red-500/10 p-4.5 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between text-[#ef4444]">
                        <span className="text-[10px] font-black uppercase tracking-wider">Disbursed Payouts</span>
                        <HandCoins className="w-4 h-4 bg-red-500/10 p-0.5 rounded" />
                      </div>
                      <div className="mt-3">
                        <span className="text-xl font-black text-white font-mono">৳{approvedWithdrawalsSum.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-500 block">Transferred to wallets</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SECTION A: USER EARNINGS SUMMARY (কে কত টাকা আর্ন করলো) */}
              <div className="bg-[#0b0c15] border border-blue-500/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#58a6ff] uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4.5 h-4.5 text-[#58a6ff]" />
                      Affiliate Channels Summary (কে কত টাকা আর্ন করলো)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      সারসংক্ষেপ: প্রতিটি ব্যবহারকারী কতজন রেফার করেছেন এবং তাদের অ্যাকাউন্টে পেমেন্ট ও উইথড্রয়ের হিসাব দেখায়।
                    </p>
                  </div>
                </div>

                {(() => {
                  // Calculate aggregated calculations per referrer
                  const referrersMap: { [key: string]: {
                    username: string;
                    totalReferredCount: number;
                    conversionsCount: number;
                    totalEarned: number;
                    totalWithdrawn: number;
                    pendingAmount: number;
                  } } = {};

                  // Initialize any referrers we know from referrals
                  referrals.forEach(ref => {
                    const refName = ref.referrer.trim().toLowerCase();
                    if (!refName) return;
                    if (!referrersMap[refName]) {
                      referrersMap[refName] = {
                        username: ref.referrer,
                        totalReferredCount: 0,
                        conversionsCount: 0,
                        totalEarned: 0,
                        totalWithdrawn: 0,
                        pendingAmount: 0
                      };
                    }
                    const r = referrersMap[refName];
                    r.totalReferredCount += 1;
                    if (ref.tier !== 'FREE') {
                      r.conversionsCount += 1;
                    }
                    r.totalEarned += ref.commission;
                  });

                  // Factoring in withdrawal records for those referrers
                  withdrawals.forEach(w => {
                    const uName = w.username.trim().toLowerCase();
                    // Auto construct user if not already in list
                    if (!referrersMap[uName]) {
                      referrersMap[uName] = {
                        username: w.username,
                        totalReferredCount: 0,
                        conversionsCount: 0,
                        totalEarned: 0,
                        totalWithdrawn: 0,
                        pendingAmount: 0
                      };
                    }
                    const r = referrersMap[uName];
                    if (w.status === 'Approved') {
                      r.totalWithdrawn += w.amount;
                    } else if (w.status === 'Pending') {
                      r.pendingAmount += w.amount;
                    }
                  });

                  const summaryList = Object.values(referrersMap);

                  if (summaryList.length === 0) {
                    return (
                      <div className="py-8 text-center text-slate-500 font-bold text-xs">
                        No active referral network metrics available yet.
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[9.5px] tracking-wider bg-black/20">
                            <th className="py-2.5 px-3">Username</th>
                            <th className="py-2.5 px-3 text-center">Invited (Total)</th>
                            <th className="py-2.5 px-3 text-center">Converted</th>
                            <th className="py-2.5 px-3 text-right text-cyan-400">Total Earned</th>
                            <th className="py-2.5 px-3 text-right text-rose-400">Total Withdrawn</th>
                            <th className="py-2.5 px-3 text-right">Pending Payout</th>
                            <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Balance Available</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-[11px] font-semibold text-slate-300">
                          {summaryList.map((user, idx) => {
                            const availableBal = user.totalEarned - user.totalWithdrawn - user.pendingAmount;
                            return (
                              <tr key={idx} className="hover:bg-slate-800/20 transition">
                                <td className="py-3 px-3">
                                  <div className="font-bold text-white font-mono">@{user.username}</div>
                                  <div className="mt-0.5">
                                    <span className={`px-1 rounded text-[8px] font-black uppercase tracking-wider ${
                                      user.conversionsCount >= 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                      user.conversionsCount >= 2 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                      'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                                    }`}>
                                      {user.conversionsCount >= 5 ? 'Elite Partner' :
                                       user.conversionsCount >= 2 ? 'Premium Partner' : 'Standard Partner'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-white">{user.totalReferredCount} joined</td>
                                <td className="py-3 px-3 text-center font-mono">
                                  <span className="text-emerald-400">{user.conversionsCount} sales</span>
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-cyan-400 font-bold">৳{user.totalEarned.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono text-rose-400">৳{user.totalWithdrawn.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono text-amber-400">৳{user.pendingAmount.toLocaleString()}</td>
                                <td className="py-3 px-3 text-right font-mono text-emerald-400 font-extrabold text-xs">
                                  ৳{(availableBal < 0 ? 0 : availableBal).toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* SECTION B: WHO JOINED UNDER WHOSE REFFERRAL (কার আন্ডারে কতজন জয়েন হলো বিস্তারিত হিসেব) */}
              <div className="bg-[#0b0c15] border border-blue-500/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="text-left">
                    <h3 className="text-sm font-black text-[#58a6ff] uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4.5 h-4.5 text-blue-400" />
                      Detailed Referral Hierarchy (কে কার রেফারে জয়েন করলো)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      নিচের তালিকায় প্রতিটি লিংকের স্বয়ংক্রিয় রেফারেল সম্পর্ক বিস্তারিত ডেটা সহ দেখানো হয়েছে।
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="search"
                        placeholder="Search referrer or invited..."
                        value={refSearch}
                        onChange={(e) => setRefSearch(e.target.value)}
                        className="bg-black/40 text-xs text-white border border-slate-800 focus:border-[#58a6ff] focus:outline-none pl-9 pr-3.5 py-2 rounded-xl w-48 sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter and render detailed hierarchy rows */}
                {(() => {
                  const items = referrals.filter(r => 
                    r.referrer.toLowerCase().includes(refSearch.toLowerCase()) ||
                    r.referredUser.toLowerCase().includes(refSearch.toLowerCase()) ||
                    (r.referredFullName || '').toLowerCase().includes(refSearch.toLowerCase())
                  );

                  if (items.length === 0) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                        <AlertCircle className="w-8 h-8 text-slate-605 mb-2" />
                        <span className="text-xs font-bold">No referral matching criteria.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto text-left">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[9.5px] tracking-wider bg-black/20">
                            <th className="py-2.5 px-3">Invited User (যার জয়েন সফল হলো)</th>
                            <th className="py-2.5 px-3">Contact info</th>
                            <th className="py-2.5 px-3">Referrer Account (যার লিংকে জয়েন হলো)</th>
                            <th className="py-2.5 px-3">Date Joined</th>
                            <th className="py-2.5 px-3">Subscription Tier</th>
                            <th className="py-2.5 px-3 text-right">Commission generated</th>
                            <th className="py-2.5 px-3 text-center text-rose-500">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-[11px] font-semibold text-slate-300">
                          {items.map((ref) => (
                            <tr key={ref.id} className="hover:bg-slate-800/10 transition">
                              <td className="py-3 px-3">
                                <div className="font-bold text-white">{ref.referredFullName || 'VIP Member'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">@{ref.referredUser}</div>
                              </td>
                              <td className="py-3 px-3 font-mono text-[10.5px]">
                                <div className="text-slate-300">{ref.referredPhone || 'N/A'}</div>
                                <div className="text-slate-500 text-[9.5px]">{ref.referredEmail || 'N/A'}</div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-[#58a6ff] font-mono">@{ref.referrer}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">UPLINE REFERRER</div>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-400 text-[10px]">{ref.dateJoined}</td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  ref.tier === 'ELITE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold' :
                                  ref.tier === 'PREMIUM' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                  ref.tier === 'REGULAR' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                  'bg-slate-500/20 text-slate-400 border border-slate-800'
                                }`}>
                                  {ref.tier}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono text-xs">
                                ৳{ref.commission.toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Remove this referral relationship mapping?`)) {
                                      const updated = referrals.filter(r => r.id !== ref.id);
                                      if (onUpdateReferrals) {
                                        onUpdateReferrals(updated);
                                        localStorage.setItem('bt_referrals', JSON.stringify(updated));
                                      }
                                      alert('Referral relationship deleted.');
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-400 transition p-1 cursor-pointer"
                                  title="Delete relationship mapping"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* ADD NEW MANUAL REFERRAL RELATIONSHIP */}
                <div className="bg-black/30 border border-slate-800 rounded-xl p-4 sm:p-5 mt-4 space-y-4">
                  <h4 className="text-xs font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    Manually Register Referral Relationship (রেফারেল সম্পর্ক ম্যানুয়ালি যোগ করুন)
                  </h4>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newRefReferrer || !newRefUser) {
                        alert('Required fields missing.');
                        return;
                      }

                      // Calculate initial commission based on subscription tier configured
                      let calculatedCommission = 0;
                      if (newRefTier === 'REGULAR') calculatedCommission = 1005;
                      else if (newRefTier === 'PREMIUM') calculatedCommission = 1000;
                      else if (newRefTier === 'ELITE') calculatedCommission = 5005;

                      const id = 'ref-' + Date.now();
                      const curDate = new Date().toISOString().split('T')[0];

                      const newRecord: ReferralRecord = {
                        id,
                        referrer: newRefReferrer.trim().toLowerCase(),
                        referredUser: newRefUser.trim().toLowerCase(),
                        referredFullName: newRefFullName.trim() || undefined,
                        referredPhone: newRefPhone.trim() || undefined,
                        referredEmail: newRefEmail.trim() || undefined,
                        dateJoined: curDate,
                        tier: newRefTier,
                        commission: calculatedCommission
                      };

                      const updated = [newRecord, ...referrals];
                      if (onUpdateReferrals) {
                        onUpdateReferrals(updated);
                        localStorage.setItem('bt_referrals', JSON.stringify(updated));
                        alert('Referral relationship details added successfully!');
                      }

                      // Reset form inputs
                      setNewRefReferrer('');
                      setNewRefUser('');
                      setNewRefFullName('');
                      setNewRefPhone('');
                      setNewRefEmail('');
                      setNewRefTier('REGULAR');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Upline Referrer Username *</label>
                      <input
                        type="text"
                        required
                        placeholder="akhiaktherofc"
                        value={newRefReferrer}
                        onChange={(e) => setNewRefReferrer(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Referred Candidate Username *</label>
                      <input
                        type="text"
                        required
                        placeholder="new_user_join"
                        value={newRefUser}
                        onChange={(e) => setNewRefUser(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Full Name of Nominated</label>
                      <input
                        type="text"
                        placeholder="Ariful Islam"
                        value={newRefFullName}
                        onChange={(e) => setNewRefFullName(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Candidate Phone Number</label>
                      <input
                        type="text"
                        placeholder="01799228833"
                        value={newRefPhone}
                        onChange={(e) => setNewRefPhone(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Candidate Email Account</label>
                      <input
                        type="email"
                        placeholder="arif@gmail.com"
                        value={newRefEmail}
                        onChange={(e) => setNewRefEmail(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Activated Member Tier</label>
                      <select
                        value={newRefTier}
                        onChange={(e) => setNewRefTier(e.target.value as MemberLevel)}
                        className="w-full bg-[#11131c] text-xs text-white border border-slate-805 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="FREE">FREE REGISTRATION (৳0)</option>
                        <option value="REGULAR">REGULAR PLAN (৳1,005 commission)</option>
                        <option value="PREMIUM">PREMIUM PLAN (৳1,000 commission)</option>
                        <option value="ELITE">ELITE PLAN (৳5,005 commission)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-emerald-650 hover:bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>REGISTER RELATIONSHIP DETAILS</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* SECTION C: PAYOUTS & WITHDRAWAL AUDIT BLOCK (নিবন্ধিত উইথড্রয়ের হিসেব) */}
              <div className="bg-[#0b0c15] border border-blue-500/10 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="text-left">
                    <h3 className="text-sm font-black text-[#ef4444] uppercase tracking-wider flex items-center gap-2 font-sans">
                      <HandCoins className="w-4.5 h-4.5 text-red-500" />
                      Referral Withdrawals & Payout Audit (উইথড্র আবেদন ও নিষ্পত্তির রেজিস্টার)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      অ্যাফিলিয়েট ব্যবহারকারীদের কমিশন ক্যাশآউট বা উইথড্র আবেদনের বিস্তারিত লিস্ট এবং পেমেন্ট নিষ্পত্তির বিবরণ।
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="search"
                        placeholder="Search withdrawals..."
                        value={withdSearch}
                        onChange={(e) => setWithdSearch(e.target.value)}
                        className="bg-black/40 text-xs text-white border border-slate-800 focus:border-red-500 focus:outline-none pl-9 pr-3.5 py-2 rounded-xl w-48 sm:w-64"
                      />
                    </div>
                  </div>
                </div>

                {(() => {
                  const filteredWithdrawals = withdrawals.filter(w =>
                    w.username.toLowerCase().includes(withdSearch.toLowerCase()) ||
                    (w.fullName || '').toLowerCase().includes(withdSearch.toLowerCase()) ||
                    w.accountNumber.includes(withdSearch) ||
                    w.method.toLowerCase().includes(withdSearch.toLowerCase())
                  );

                  if (filteredWithdrawals.length === 0) {
                    return (
                      <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                        <AlertCircle className="w-8 h-8 text-slate-650 mb-2" />
                        <span className="text-xs font-bold">No withdrawal tickets found.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto text-left">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[9.5px] tracking-wider bg-black/20">
                            <th className="py-2.5 px-3">User</th>
                            <th className="py-2.5 px-3">Requested Amount</th>
                            <th className="py-2.5 px-3">Payout Gateway Details</th>
                            <th className="py-2.5 px-3">Date Submitted</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-[11px] font-semibold text-slate-300">
                          {filteredWithdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-slate-800/10 transition">
                              <td className="py-3 px-3">
                                <div className="font-bold text-white">{w.fullName || 'VIP Member'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">@{w.username}</div>
                              </td>
                              <td className="py-3 px-3 text-xs font-extrabold text-amber-400 font-mono">
                                ৳{w.amount.toLocaleString()} BDT
                              </td>
                              <td className="py-3 px-3">
                                <span className="bg-slate-800/40 border border-slate-700 font-bold px-2 py-0.5 rounded text-[10.5px] block w-fit">
                                  {w.method}
                                </span>
                                <span className="text-xs font-mono text-cyan-300 font-black tracking-wide block mt-1">
                                  {w.accountNumber}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-450">{w.date}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                  w.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-555/20' :
                                  w.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-555/20 animate-pulse' :
                                  'bg-rose-500/10 text-rose-500 border border-rose-555/20'
                                }`}>
                                  {w.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {w.status === 'Pending' && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = withdrawals.map(item => 
                                            item.id === w.id ? { ...item, status: 'Approved' as const } : item
                                          );
                                          if (onUpdateWithdrawals) {
                                            onUpdateWithdrawals(updated);
                                            localStorage.setItem('bt_withdrawals', JSON.stringify(updated));
                                            alert(`Withdrawal of ৳${w.amount} approved! payout complete.`);
                                          }
                                        }}
                                        className="h-7 px-2 bg-emerald-990/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-500/20 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = withdrawals.map(item => 
                                            item.id === w.id ? { ...item, status: 'Rejected' as const } : item
                                          );
                                          if (onUpdateWithdrawals) {
                                            onUpdateWithdrawals(updated);
                                            localStorage.setItem('bt_withdrawals', JSON.stringify(updated));
                                            alert(`Withdrawal request marked as Rejected.`);
                                          }
                                        }}
                                        className="h-7 px-2 bg-rose-990/60 hover:bg-rose-800 text-rose-350 border border-rose-500/20 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Delete payout record of ৳${w.amount}?`)) {
                                        const updated = withdrawals.filter(item => item.id !== w.id);
                                        if (onUpdateWithdrawals) {
                                          onUpdateWithdrawals(updated);
                                          localStorage.setItem('bt_withdrawals', JSON.stringify(updated));
                                        }
                                        alert('Record deleted.');
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                    title="Delete record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* ADD NEW MANUAL WITHDRAWAL FOR AUDITING/PAYMENTS */}
                <div className="bg-black/30 border border-slate-800 rounded-xl p-4 sm:p-5 mt-4 space-y-4">
                  <h4 className="text-xs font-black text-[#ef4444] uppercase tracking-widest flex items-center gap-1.5 font-sans">
                    <Plus className="w-4 h-4 text-amber-500" />
                    Manually Record Payout/Withdrawal Ticket (ম্যানুয়ালি উইথড্র ট্র্যাকিং টিকিট যোগ করুন)
                  </h4>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newWithdUser || !newWithdAmount || !newWithdAccount) {
                        alert('Required fields missing.');
                        return;
                      }

                      const val = Number(newWithdAmount);
                      if (isNaN(val) || val <= 0) {
                        alert('Invalid withdrawal amount.');
                        return;
                      }

                      const id = 'w-' + Date.now();
                      const curDate = new Date().toISOString().split('T')[0];

                      const newTicket: WithdrawalRecord = {
                        id,
                        username: newWithdUser.trim().toLowerCase(),
                        fullName: newWithdUser.trim().toUpperCase() + ' manual payout',
                        amount: val,
                        method: newWithdMethod,
                        accountNumber: newWithdAccount.trim(),
                        date: curDate,
                        status: 'Approved'
                      };

                      const updated = [newTicket, ...withdrawals];
                      if (onUpdateWithdrawals) {
                        onUpdateWithdrawals(updated);
                        localStorage.setItem('bt_withdrawals', JSON.stringify(updated));
                        alert('Manual payout recorded under confirmed status.');
                      }

                      // Reset fields
                      setNewWithdUser('');
                      setNewWithdAmount('');
                      setNewWithdAccount('');
                      setNewWithdMethod('bKash Personal');
                    }}
                    className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left"
                  >
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Affiliate Username *</label>
                      <input
                        type="text"
                        required
                        placeholder="akhiaktherofc"
                        value={newWithdUser}
                        onChange={(e) => setNewWithdUser(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Withdraw Amount (৳) *</label>
                      <input
                        type="number"
                        required
                        placeholder="5000"
                        value={newWithdAmount}
                        onChange={(e) => setNewWithdAmount(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Gateway Method *</label>
                      <select
                        value={newWithdMethod}
                        onChange={(e) => setNewWithdMethod(e.target.value)}
                        className="w-full bg-[#11131c] text-xs text-white border border-slate-850 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="bKash Personal">bKash Personal</option>
                        <option value="bKash Agent">bKash Agent</option>
                        <option value="Nagad Personal">Nagad Personal</option>
                        <option value="Nagad Agent">Nagad Agent</option>
                        <option value="Rocket Personal">Rocket Personal</option>
                        <option value="Bank Transfer direct">Bank Transfer (Direct)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Target bKash/Nagad Number *</label>
                      <input
                        type="text"
                        required
                        placeholder="017xxxxxxxx"
                        value={newWithdAccount}
                        onChange={(e) => setNewWithdAccount(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-805 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-4 flex justify-end pt-2">
                      <button
                        type="submit"
                        className="bg-amber-650 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>DISBURSE PAYOUT TRANSACTION</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
