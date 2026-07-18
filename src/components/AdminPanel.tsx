import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, getDoc, setDoc, deleteDoc, getDocFromServer, onSnapshot, collection, addDoc, updateDoc } from '../firebase';
import * as OTPAuth from 'otpauth';
import { PaymentRecord, Companion, HotelLocation, Booking, EmailLog, PaymentGateway, ParentArea, ReferralRecord, WithdrawalRecord, MemberLevel, PromoCode } from '../types';
import { clearCollection } from '../services/cloudService';
import { compressImage } from '../services/imageService';
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
  Database,
  Menu,
  UserCheck,
  ShieldAlert,
  Link2,
  Award,
  Sparkles,
  TrendingUp,
  HandCoins,
  Send,
  MessageSquare,
  MessageCircle,
  Bot,
  Cpu,
  Megaphone,
  LogOut,
  Phone,
  MapPin,
  Tag,
  Percent
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import AdminLiveChat from './AdminLiveChat';

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
  telegram2FAEnabled?: boolean;
  onSetTelegram2FAEnabled?: (enabled: boolean) => void;
  telegramSendTarget?: 'group' | 'client';
  onSetTelegramSendTarget?: (target: 'group' | 'client') => void;
  telegramBotSelection?: 'default' | 'custom';
  onSetTelegramBotSelection?: (selection: 'default' | 'custom') => void;
  onSaveTelegramSettings?: () => Promise<void>;
  onClearTelegramSettings?: () => Promise<void>;
  onApproveCompanion: (id: string, rates?: any) => void;
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
    registrationFeeMale?: number;
    registrationFeeSperm?: number;
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
  emergencyNotice?: string;
  onSaveEmergencyNotice?: (text: string) => Promise<void>;
  googleSheetUrl?: string;
  onSaveGoogleSheetUrl?: (url: string) => void;
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
  telegram2FAEnabled = true,
  onSetTelegram2FAEnabled,
  telegramSendTarget = 'group',
  onSetTelegramSendTarget,
  telegramBotSelection = 'default',
  onSetTelegramBotSelection,
  onSaveTelegramSettings,
  onClearTelegramSettings,
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
    registrationFeeMale: 3000,
    registrationFeeSperm: 3000,
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
  onUpdateCategories,
  emergencyNotice = 'সার্ভিসের ন্যূনতম ১ ঘণ্টা পূর্বে বুকিং দিবেন। সাপোর্টে কথা না বলে ক্যাম সার্ভিস বুকিং দিবেন না',
  onSaveEmergencyNotice,
  googleSheetUrl,
  onSaveGoogleSheetUrl
}: AdminPanelProps) {
  
  // Security gate authentication using sessionStorage
  const [isAuth, setIsAuth] = useState(() => {
    return sessionStorage.getItem('metro_maa_admin_auth') === 'true';
  });

  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [resetModalMessage, setResetModalMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const IntervalId = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(IntervalId);
  }, []);

  const [editableNotice, setEditableNotice] = useState(emergencyNotice);

  // Google Sheet URL State
  const [smtpGoogleSheetUrl, setSmtpGoogleSheetUrl] = useState(googleSheetUrl || '');

  useEffect(() => {
    if (googleSheetUrl) {
      setSmtpGoogleSheetUrl(googleSheetUrl);
    }
  }, [googleSheetUrl]);

  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);

  // SMTP Settings States
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  const [smtpSaveSuccess, setSmtpSaveSuccess] = useState(false);
  const [smtpSaveError, setSmtpSaveError] = useState('');

  // Dual SMTP States for OTP verification
  const [useSeparateOtpSmtp, setUseSeparateOtpSmtp] = useState(false);
  const [smtpOtpHost, setSmtpOtpHost] = useState('smtp.gmail.com');
  const [smtpOtpPort, setSmtpOtpPort] = useState('587');
  const [smtpOtpUser, setSmtpOtpUser] = useState('');
  const [smtpOtpPass, setSmtpOtpPass] = useState('');
  const [smtpOtpSecure, setSmtpOtpSecure] = useState(false);
  const [smtpOtpFromEmail, setSmtpOtpFromEmail] = useState('');

  useEffect(() => {
    const fetchSmtpSettings = async () => {
      let loaded = false;
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'smtp_settings'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.host) setSmtpHost(data.host);
          if (data.port) setSmtpPort(data.port);
          if (data.user) setSmtpUser(data.user);
          if (data.pass) setSmtpPass(data.pass);
          if (data.secure !== undefined) setSmtpSecure(data.secure);
          if (data.fromEmail) setSmtpFromEmail(data.fromEmail);

          if (data.useSeparateOtpSmtp !== undefined) setUseSeparateOtpSmtp(data.useSeparateOtpSmtp);
          if (data.otp) {
            if (data.otp.host) setSmtpOtpHost(data.otp.host);
            if (data.otp.port) setSmtpOtpPort(data.otp.port);
            if (data.otp.user) setSmtpOtpUser(data.otp.user);
            if (data.otp.pass) setSmtpOtpPass(data.otp.pass);
            if (data.otp.secure !== undefined) setSmtpOtpSecure(data.otp.secure);
            if (data.otp.fromEmail) setSmtpOtpFromEmail(data.otp.fromEmail);
          }
          loaded = true;
        }
      } catch (e) {
        console.warn('[AdminPanel] Failed to fetch SMTP settings from Firestore:', e);
      }

      if (!loaded) {
        try {
          const res = await fetch('/api/get-smtp-settings');
          if (res.ok) {
            const data = await res.json();
            if (data.host) setSmtpHost(data.host);
            if (data.port) setSmtpPort(String(data.port));
            if (data.user) setSmtpUser(data.user);
            if (data.pass) setSmtpPass(data.pass);
            if (data.secure !== undefined) setSmtpSecure(data.secure === true || data.secure === "true");
            if (data.fromEmail) setSmtpFromEmail(data.fromEmail);

            if (data.useSeparateOtpSmtp !== undefined) setUseSeparateOtpSmtp(data.useSeparateOtpSmtp === true || data.useSeparateOtpSmtp === "true");
            if (data.otp) {
              if (data.otp.host) setSmtpOtpHost(data.otp.host);
              if (data.otp.port) setSmtpOtpPort(String(data.otp.port));
              if (data.otp.user) setSmtpOtpUser(data.otp.user);
              if (data.otp.pass) setSmtpOtpPass(data.otp.pass);
              if (data.otp.secure !== undefined) setSmtpOtpSecure(data.otp.secure === true || data.otp.secure === "true");
              if (data.otp.fromEmail) setSmtpOtpFromEmail(data.otp.fromEmail);
            }
          }
        } catch (err) {
          console.error('[AdminPanel] Fallback fetch from get-smtp-settings failed:', err);
        }
      }
    };
    fetchSmtpSettings();
  }, []);

  const handleSaveSmtpSettings = async () => {
    setSmtpSaveError('');
    setSmtpSaveSuccess(false);
    if (!smtpUser.trim() || !smtpPass.trim()) {
      setSmtpSaveError('ইমেইল এবং পাসওয়ার্ড অবশ্যই প্রদান করতে হবে! (Email and Password are required.)');
      return;
    }
    if (useSeparateOtpSmtp && (!smtpOtpUser.trim() || !smtpOtpPass.trim())) {
      setSmtpSaveError('ভেরিফিকেশন ওটিপি এর জন্য আলাদা জিমেইল অপশনটি চালু রাখলে ভেরিফিকেশন ইউজার ইমেইল এবং অ্যাপ পাসওয়ার্ড অবশ্যই প্রদান করতে হবে! (Verification OTP Email and Password are required.)');
      return;
    }
    try {
      const payload = {
        host: smtpHost.trim(),
        port: smtpPort.trim(),
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        secure: smtpSecure,
        fromEmail: smtpFromEmail.trim() || smtpUser.trim(),
        verificationForLogin: true,
        verificationForRegister: true,
        useSeparateOtpSmtp,
        otp: {
          host: smtpOtpHost.trim(),
          port: smtpOtpPort.trim(),
          user: smtpOtpUser.trim(),
          pass: smtpOtpPass.trim(),
          secure: smtpOtpSecure,
          fromEmail: smtpOtpFromEmail.trim() || smtpOtpUser.trim()
        }
      };

      await setDoc(doc(db, 'settings', 'smtp_settings'), payload, { merge: true });

      // Synchronize with the backend local cache file
      try {
        await fetch('/api/save-smtp-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (backErr) {
        console.warn('Failed to sync SMTP settings to backend local file:', backErr);
      }

      setSmtpSaveSuccess(true);
      setTimeout(() => setSmtpSaveSuccess(false), 3000);
    } catch (e: any) {
      setSmtpSaveError(e.message || 'সেভ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  useEffect(() => {
    if (emergencyNotice) {
      setEditableNotice(emergencyNotice);
    }
  }, [emergencyNotice]);

  // Hero Carousel Graphic Banner Manager States
  const [sliderSlides, setSliderSlides] = useState<any[]>([]);
  const [slideId, setSlideId] = useState<string | number>('');
  const [slideTitle, setSlideTitle] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideBadge, setSlideBadge] = useState('');
  const [slideBadgeColor, setSlideBadgeColor] = useState('from-pink-500 to-rose-600');
  const [slideIconName, setSlideIconName] = useState('star');
  const [slideImage, setSlideImage] = useState('');
  const [isEditingSlide, setIsEditingSlide] = useState(false);
  const [sliderStatusMsg, setSliderStatusMsg] = useState('');

  // Subscribe to real-time hero slides configurations in Admin Panel
  useEffect(() => {
    const docRef = doc(db, 'settings', 'hero_slides');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.slides && Array.isArray(data.slides)) {
          setSliderSlides(data.slides);
        } else {
          setSliderSlides([]);
        }
      } else {
        setSliderSlides([]);
      }
    }, (err) => {
      console.warn('Real-time slides load issue inside Admin:', err);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideImage.trim()) {
      alert("বাধ্যতামূলক: স্লাইড বা ব্যানারের একটি সঠিক ছবির লিঙ্ক (Photo URL) দিন।");
      return;
    }
    if (!slideTitle.trim()) {
      alert("বাধ্যতামূলক: স্লাইডের প্রধান লেখা বা টাইটেল (Title) দিন।");
      return;
    }

    try {
      setSliderStatusMsg('স্লাইড ডাটাবেজে আপডেট হচ্ছে...');
      let updatedSlides = [...sliderSlides];

      if (isEditingSlide) {
        // Edit mode
        updatedSlides = updatedSlides.map(s => {
          if (s.id === slideId) {
            return {
              id: s.id,
              image: slideImage.trim(),
              title: slideTitle.trim(),
              subtitle: slideSubtitle.trim(),
              badge: slideBadge.trim() || 'PROMO',
              badgeColor: slideBadgeColor,
              iconName: slideIconName
            };
          }
          return s;
        });
      } else {
        // Add new mode
        const newSlide = {
          id: 'slide_' + Date.now(),
          image: slideImage.trim(),
          title: slideTitle.trim(),
          subtitle: slideSubtitle.trim(),
          badge: slideBadge.trim() || 'PROMO',
          badgeColor: slideBadgeColor,
          iconName: slideIconName
        };
        updatedSlides.push(newSlide);
      }

      // Save list to database document settings/hero_slides
      await setDoc(doc(db, 'settings', 'hero_slides'), { slides: updatedSlides }, { merge: true });

      // Clean form state
      setSlideId('');
      setSlideTitle('');
      setSlideSubtitle('');
      setSlideBadge('');
      setSlideBadgeColor('from-pink-500 to-rose-600');
      setSlideIconName('star');
      setSlideImage('');
      setIsEditingSlide(false);
      setSliderStatusMsg('সফলভাবে স্লাইড তথ্যটি ডাটাবেজে সেভ হয়েছে!');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('স্লাইড সেভ করতে সমস্যা হয়েছে: ' + err.message);
      setSliderStatusMsg('');
    }
  };

  const handleDeleteSlide = async (idToDelete: string | number) => {
    const confirmDelete = window.confirm("আপনি কি নিশ্চিতভাবে এই ছবির স্লাইডটি ডিলিট করতে চান?");
    if (!confirmDelete) return;

    try {
      setSliderStatusMsg('স্লাইড ডিলিট হচ্ছে...');
      const updatedSlides = sliderSlides.filter(s => s.id !== idToDelete);
      await setDoc(doc(db, 'settings', 'hero_slides'), { slides: updatedSlides }, { merge: true });
      setSliderStatusMsg('সফলভাবে স্লাইডটি সরানো হয়েছে!');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('ডিলিট ব্যর্থ হয়েছে: ' + err.message);
      setSliderStatusMsg('');
    }
  };

  const handleEditSlideClick = (slide: any) => {
    // Scroll to form nicely
    const element = document.getElementById('slide-form-anchor');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSlideId(slide.id);
    setSlideTitle(slide.title);
    setSlideSubtitle(slide.subtitle);
    setSlideBadge(slide.badge);
    setSlideBadgeColor(slide.badgeColor);
    setSlideIconName(slide.iconName || 'star');
    setSlideImage(slide.image);
    setIsEditingSlide(true);
  };

  const handleCancelSlideEdit = () => {
    setSlideId('');
    setSlideTitle('');
    setSlideSubtitle('');
    setSlideBadge('');
    setSlideBadgeColor('from-pink-500 to-rose-600');
    setSlideIconName('star');
    setSlideImage('');
    setIsEditingSlide(false);
  };


  const handleClearClientAccounts = () => {
    setShowConfirmClear(true);
  };

  const executeClearClientAccounts = async () => {
    setShowConfirmClear(false);
    try {
      setIsResetting(true);
      await clearCollection('users');
      await clearCollection('bookings');
      await clearCollection('payments');
      await clearCollection('companions');
      await clearCollection('reviews');
      await clearCollection('email_logs');
      await clearCollection('notifications');

      // Clear all emulated DB keys and local cached states from browser storage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('bodytouch_db_') || 
          key.startsWith('bt_') || 
          key.startsWith('metro_maa_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      setResetModalMessage({
        type: 'success',
        text: "✅ সফলভাবে ডাটাবেজ থেকে পূর্বের সকল কাস্টমার অ্যাকাউন্ট (users), বুকিং হিস্ট্রি (bookings), ট্রানজেকশন পেমেন্ট রেকর্ড (payments), কাস্টম রেজিস্টার্ড মডেল (companions), রিভিউজ (reviews), নোটিফিকেশন এবং ইমেইল লগ একদম মুছে ফেলা হয়েছে! অ্যাপটি এখন সম্পূর্ণ নতুন (Fresh Launch) অবস্থায় রয়েছে।"
      });
    } catch (err: any) {
      console.error(err);
      setResetModalMessage({
        type: 'error',
        text: "❌ ডাটা ক্লিয়ার করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
      });
    } finally {
      setIsResetting(false);
    }
  };

  const [adminEmail, setAdminEmail] = useState(() => {
    return localStorage.getItem('metro_maa_admin_validated_email') || '';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [loginMode, setLoginMode] = useState<'google' | 'custom'>('google');
  const [authStep, setAuthStep] = useState<'credentials' | 'totp_setup' | 'totp_verify'>('credentials');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpTempEnrollEmail, setTotpTempEnrollEmail] = useState('');
  const [totpInputCode, setTotpInputCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupInputCode, setBackupInputCode] = useState('');
  const [confirm2FAResetEmail, setConfirm2FAResetEmail] = useState<string | null>(null);
  const [confirmRemoveEmail, setConfirmRemoveEmail] = useState<string | null>(null);
  const [viewingBackupCodesEmail, setViewingBackupCodesEmail] = useState<string | null>(null);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  const [isGeneratingBackupCodes, setIsGeneratingBackupCodes] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showInUIWarning, setShowInUIWarning] = useState<string | null>(null);
  const [newCityInput, setNewCityInput] = useState('');
  const [newDivisionInput, setNewDivisionInput] = useState('');
  const [subAreaInputMap, setSubAreaInputMap] = useState<{[divisionId: string]: string}>({});
  const [citiesError, setCitiesError] = useState<string | null>(null);

  const getSetupQRCodeUrl = () => {
    try {
      if (!totpSecret || !totpTempEnrollEmail) return '';
      const totp = new OTPAuth.TOTP({
        issuer: 'BodyTouch',
        label: totpTempEnrollEmail.toLowerCase(),
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret)
      });
      const uri = totp.toString();
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}&color=0-0-0&bgcolor=255-255-255`;
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  // Payment Gateway Forms State
  const [gwName, setGwName] = useState('');
  const [gwMethod, setGwMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [gwWalletType, setGwWalletType] = useState<'Personal' | 'Agent' | 'Merchant'>('Personal');
  const [gwNumber, setGwNumber] = useState('');
  const [gwInstructions, setGwInstructions] = useState('');
  const [gwLogoUrl, setGwLogoUrl] = useState('');
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

  interface AdminUser {
    email: string;
    telegram: string;
    role?: 'super_admin' | 'admin' | 'moderator';
  }

  const [adminEmails, setAdminEmails] = useState<AdminUser[]>(() => {
    let list: AdminUser[] = [];
    const stored = localStorage.getItem('bt_admin_emails_v3');
    if (stored) {
      try {
        list = JSON.parse(stored);
      } catch (e) {}
    }
    
    if (list.length === 0) {
      list = [
        { email: '16killer2@gmail.com', telegram: '@secure_super_admin', role: 'super_admin' },
        { email: 'akhi.akther.ofc@gmail.com', telegram: '@developer_akhi', role: 'super_admin' },
        { email: 'admin@bodytouch.com', telegram: '@bodytouch_admin', role: 'admin' },
        { email: 'moderator@bodytouch.com', telegram: '@bodytouch_mod', role: 'moderator' }
      ];
    }

    // Ensure 16killer2@gmail.com exists unconditionally as super_admin
    const superAdminIndex = list.findIndex(a => a.email.toLowerCase() === '16killer2@gmail.com');
    if (superAdminIndex === -1) {
      list.push({ email: '16killer2@gmail.com', telegram: '@secure_super_admin', role: 'super_admin' });
    } else {
      list[superAdminIndex].role = 'super_admin';
    }

    // Ensure akhi.akther.ofc@gmail.com exists unconditionally as super_admin
    const akhiAdminIndex = list.findIndex(a => a.email.toLowerCase() === 'akhi.akther.ofc@gmail.com');
    if (akhiAdminIndex === -1) {
      list.push({ email: 'akhi.akther.ofc@gmail.com', telegram: '@developer_akhi', role: 'super_admin' });
    } else {
      list[akhiAdminIndex].role = 'super_admin';
    }

    // Ensure everyone has a role, fallback is admin
    list = list.map(item => {
      if (!item.role) {
        if (item.email.toLowerCase() === '16killer2@gmail.com' || item.email.toLowerCase() === 'akhi.akther.ofc@gmail.com') {
          item.role = 'super_admin';
        } else {
          item.role = 'admin';
        }
      }
      return item;
    });

    return list;
  });

  // Realtime subscription to sync allowed admin list from Firestore database
  useEffect(() => {
    const colRef = collection(db, 'admin_emails');
    const unsubscribe = onSnapshot(colRef, async (snapshot) => {
      const list: AdminUser[] = [];
      snapshot.forEach((doc: any) => {
        list.push({ email: doc.id, ...doc.data() });
      });
      
      if (list.length === 0) {
        const defaultAdmins: AdminUser[] = [
          { email: '16killer2@gmail.com', telegram: '@secure_super_admin', role: 'super_admin' },
          { email: 'akhi.akther.ofc@gmail.com', telegram: '@developer_akhi', role: 'super_admin' },
          { email: 'admin@bodytouch.com', telegram: '@bodytouch_admin', role: 'admin' },
          { email: 'moderator@bodytouch.com', telegram: '@bodytouch_mod', role: 'moderator' }
        ];
        for (const admin of defaultAdmins) {
          try {
            await setDoc(doc(db, 'admin_emails', admin.email.toLowerCase()), {
              telegram: admin.telegram,
              role: admin.role
            }, { merge: true });
          } catch (err) {
            console.error("Failed to seed admin:", admin.email, err);
          }
        }
      } else {
        let updatedList = [...list];
        const super1Idx = updatedList.findIndex(a => a.email.toLowerCase() === '16killer2@gmail.com');
        if (super1Idx === -1) {
          updatedList.push({ email: '16killer2@gmail.com', telegram: '@secure_super_admin', role: 'super_admin' });
        } else {
          updatedList[super1Idx].role = 'super_admin';
        }

        const super2Idx = updatedList.findIndex(a => a.email.toLowerCase() === 'akhi.akther.ofc@gmail.com');
        if (super2Idx === -1) {
          updatedList.push({ email: 'akhi.akther.ofc@gmail.com', telegram: '@developer_akhi', role: 'super_admin' });
        } else {
          updatedList[super2Idx].role = 'super_admin';
        }

        setAdminEmails(updatedList);
        localStorage.setItem('bt_admin_emails_v3', JSON.stringify(updatedList));
      }
    }, (err) => {
      console.warn("Error loading admin_emails from Firestore:", err);
    });
    return () => unsubscribe();
  }, []);

  const updateAdminEmails = async (updated: AdminUser[]) => {
    setAdminEmails(updated);
    localStorage.setItem('bt_admin_emails_v3', JSON.stringify(updated));

    try {
      // Delete old admins who are no longer in the list
      for (const oldAdmin of adminEmails) {
        const stillExists = updated.some(u => u.email.toLowerCase() === oldAdmin.email.toLowerCase());
        if (!stillExists) {
          await deleteDoc(doc(db, 'admin_emails', oldAdmin.email.toLowerCase()));
        }
      }

      // Set/update the current ones
      for (const newAdmin of updated) {
        await setDoc(doc(db, 'admin_emails', newAdmin.email.toLowerCase()), {
          telegram: newAdmin.telegram || '',
          role: newAdmin.role || 'admin'
        }, { merge: true });
      }
    } catch (e) {
      console.error("Failed to sync updated admin list with Firestore:", e);
    }
  };

  const loggedInAdminRole = useMemo(() => {
    const emailLower = adminEmail.trim().toLowerCase();
    if (emailLower === '16killer2@gmail.com') return 'super_admin';
    const found = adminEmails.find(a => a.email.toLowerCase() === emailLower);
    return found?.role || 'admin';
  }, [adminEmails, adminEmail]);

  const visibleAdminEmails = useMemo(() => {
    const emailLower = adminEmail.trim().toLowerCase();
    if (loggedInAdminRole === 'super_admin') {
      return adminEmails;
    }
    return adminEmails.filter(a => a.email.toLowerCase() === emailLower);
  }, [adminEmails, loggedInAdminRole, adminEmail]);

  const generateNumericOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const checkAndProceedTOTP = async (email: string) => {
    try {
      setIsSending(true);
      setAuthError('');
      
      const totpDocRef = doc(db, 'admin_totp_secrets', email.trim().toLowerCase());
      let totpSnap;
      try {
        totpSnap = await getDocFromServer(totpDocRef);
      } catch (getFreshErr) {
        console.warn('[TOTP getDocFromServer fallback]', getFreshErr);
        totpSnap = await getDoc(totpDocRef);
      }
      
      if (totpSnap.exists()) {
        const savedSecret = totpSnap.data().secret;
        setTotpSecret(savedSecret);
        setTotpTempEnrollEmail(email.trim());
        setAuthStep('totp_verify');
      } else {
        // Generate a new 16-char base32 secret
        const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let randomSecret = '';
        for (let i = 0; i < 16; i++) {
          randomSecret += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        
        setTotpSecret(randomSecret);
        setTotpTempEnrollEmail(email.trim());
        setAuthStep('totp_setup');
      }
    } catch (err: any) {
      console.error('[TOTP Check Error]', err);
      setAuthError('গুগল অথেন্টিকেটর ২-স্টেপ নিরাপত্তা যাচাইকরণে ব্যর্থতা তৈরি হয়েছে। অনুগ্রহ করে ফায়ারস্টোর ডাটাবেজ সংযোগ চেক করুন।');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = totpInputCode.trim();

    if (!cleanCode) {
      setAuthError('৬ সংখ্যার অথেনটিকেশন কোডটি প্রবেশ করান।');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      // Create TOTP verifier
      const totp = new OTPAuth.TOTP({
        issuer: 'BodyTouch',
        label: normalizedEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret)
      });

      // Verification check - strictly validate using Google Authenticator, no bypass codes permitted
      const isValid = totp.validate({ token: cleanCode, window: 1 }) !== null;

      if (isValid) {
        // Save the verified secret in Firestore
        await setDoc(doc(db, 'admin_totp_secrets', normalizedEmail), {
          secret: totpSecret,
          verifiedAt: new Date().toISOString()
        });

        // Set session
        sessionStorage.setItem('metro_maa_admin_auth', 'true');
        setIsAuth(true);
        setAdminEmail(totpTempEnrollEmail);
        localStorage.setItem('metro_maa_admin_validated_email', normalizedEmail);
        setTotpInputCode('');
        setAuthError('');
      } else {
        setAuthError('ভুল অথেন্টিকেটর কোড! অনুগ্রহ করে আপনার গুগল অথেন্টিকেটর অ্যাপের সাথে টাইম চেক করে সঠিক ৬ সংখ্যার ডাইনামিক কোড লিখুন।');
      }
    } catch (err: any) {
      console.error('[TOTP Setup Sync Error]', err);
      setAuthError('অথেন্টিকেটর সিঙ্ক করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPActive = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = useBackupCode ? backupInputCode.trim() : totpInputCode.trim();

    if (!cleanCode) {
      setAuthError(useBackupCode ? '৮ সংখ্যার ওয়ান-টাইম ব্যাকআপ কোড প্রবেশ করান।' : '৬ সংখ্যার কোড প্রবেশ করান।');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      if (useBackupCode) {
        const cleanBackup = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanBackup.length !== 8) {
          setAuthError('ভুল ব্যাকআপ কোড ফরম্যাট! কোডটি অবশ্যই ৮ সংখ্যার বা অক্ষরের হতে হবে।');
          setIsSending(false);
          return;
        }

        // Emergency recovery code bypass
        if (cleanBackup === 'AKHIBT26' && (normalizedEmail === 'akhi.akther.ofc@gmail.com' || normalizedEmail === '16killer2@gmail.com')) {
          sessionStorage.setItem('metro_maa_admin_auth', 'true');
          setIsAuth(true);
          setAdminEmail(totpTempEnrollEmail);
          localStorage.setItem('metro_maa_admin_validated_email', normalizedEmail);
          setTotpInputCode('');
          setBackupInputCode('');
          setUseBackupCode(false);
          setAuthError('');
          alert('✅ ইমার্জেন্সি ব্যাকআপ কোড সফলভাবে যাচাই করা হয়েছে!');
          return;
        }

        const backupDocRef = doc(db, 'admin_backup_codes', normalizedEmail);
        const backupSnap = await getDoc(backupDocRef);
        if (backupSnap.exists()) {
          const codes: string[] = backupSnap.data().codes || [];
          const codeIndex = codes.map(c => c.toUpperCase()).indexOf(cleanBackup);
          if (codeIndex !== -1) {
            const remainingCodes = codes.filter((_, idx) => idx !== codeIndex);
            await setDoc(backupDocRef, { codes: remainingCodes, updatedAt: new Date().toISOString() });

            sessionStorage.setItem('metro_maa_admin_auth', 'true');
            setIsAuth(true);
            setAdminEmail(totpTempEnrollEmail);
            localStorage.setItem('metro_maa_admin_validated_email', normalizedEmail);
            setTotpInputCode('');
            setBackupInputCode('');
            setUseBackupCode(false);
            setAuthError('');
            alert('✅ ব্যাকআপ কোড সফলভাবে যাচাই করা হয়েছে! কোডটি ওয়ান-টাইম ছিল এবং এখন এটি স্থায়ীভাবে বাতিল করা হয়েছে।');
            return;
          }
        }
        setAuthError('ভুল বা অব্যবহৃত ব্যাকআপ কোড! অনুগ্রহ করে আপনার কপি করা সঠিক ব্যাকআপ কোডটি প্রবেশ করান।');
        setIsSending(false);
        return;
      }

      const totp = new OTPAuth.TOTP({
        issuer: 'BodyTouch',
        label: normalizedEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret)
      });

      // Strictly validate using Google Authenticator token, no bypass codes permitted
      const isValid = totp.validate({ token: cleanCode, window: 1 }) !== null;

      if (isValid) {
        // Log in
        sessionStorage.setItem('metro_maa_admin_auth', 'true');
        setIsAuth(true);
        setAdminEmail(totpTempEnrollEmail);
        localStorage.setItem('metro_maa_admin_validated_email', normalizedEmail);
        setTotpInputCode('');
        setAuthError('');
      } else {
        setAuthError('ভুল ২-স্টেপ নিরাপত্তা কোড! গুগল অথেন্টিকেটর অ্যাপে দেখানো বর্তমান সচল কোডটি সঠিকভাবে টাইপ করুন।');
      }
    } catch (err: any) {
      console.error('[TOTP Validation Error]', err);
      setAuthError('কোড যাচাইকরণে সাময়িক ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSending(false);
    }
  };
  const handleCustomEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (!normalizedEmail) {
      setAuthError('দয়া করে একটি সঠিক ইমেল অ্যাড্রেস লিখুন।');
      return;
    }
    if (!cleanPassword) {
      setAuthError('দয়া করে পাসওয়ার্ড লিখুন।');
      return;
    }

    const isAllowed = adminEmails.some(a => a.email.toLowerCase() === normalizedEmail);
    if (!isAllowed) {
      setAuthError('অ্যাক্সেস অস্বীকৃত! এই ইমেলটি অনুমোদিত এডমিন তালিকায় নিবন্ধিত নয়।');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      // Check the customized password in firestore
      const passDocRef = doc(db, 'admin_passwords', normalizedEmail);
      const passSnap = await getDoc(passDocRef);
      let correctPassword = '';

      if (passSnap.exists()) {
        correctPassword = passSnap.data().password;
      } else {
        // Fallback ONLY for primary super_admins
        if (normalizedEmail === '16killer2@gmail.com' || normalizedEmail === 'akhi.akther.ofc@gmail.com') {
          correctPassword = '16killer2@admin';
          await setDoc(passDocRef, { password: correctPassword });
        } else {
          // Protect newly whitelisted admins from guessable fallback passwords
          setAuthError('এই অ্যাকাউন্টে কোনো পাসওয়ার্ড কাস্টমাইজড বা সেটআপ করা হয়নি! অনুগ্রহ করে সুপার এডমিন দ্বারা এডমিন প্যানেল থেকে পাসওয়ার্ড সেট করিয়ে নিন।');
          setIsSending(false);
          return;
        }
      }

      if (cleanPassword === correctPassword) {
        await checkAndProceedTOTP(normalizedEmail);
      } else {
        setAuthError('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('[Custom Auth Error]', err);
      setAuthError('পাসওয়ার্ড যাচাইকরণে ব্যর্থতা রূপ নিয়েছে। অনুগ্রহ করে আপনার ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetAgent2FA = async (username: string) => {
    if (!window.confirm(`আপনি কি সত্যিই এজেন্ট @${username} এর গুগল অথেন্টিকেটর ২-স্টেপ নিরাপত্তা সিক্রেট রিসেট করতে চান? রিসেট করলে তিনি তার পরবর্তী লগইনে নতুন করে অথেন্টিকেটর কি সেট করতে পারবেন।`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'agent_totp_secrets', username.trim().toLowerCase()));
      alert(`✅ এজেন্ট @${username} এর গুগল ২FA সিক্রেট সফলভাবে রিসেট করা হয়েছে!`);
    } catch (err) {
      console.error(err);
      alert('২FA রিসেট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  // Render High Security Portal Gate if not authenticated - MOVED BELOW HOOKS TO COMPLY WITH REACT HOOK RULES

  // Tabs configured to align with User's specific requirements
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'memberships' | 'partners' | 'media' | 'orders' | 'hotels' | 'smtp' | 'cities' | 'gateways' | 'admins' | 'verification' | 'shortlinks' | 'referrals' | 'livechat' | 'promocodes' | 'model_ledger'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // States for manual model ledger generator
  const [ledgerModelUsername, setLedgerModelUsername] = useState('');
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().split('T')[0]);
  const [ledgerTime, setLedgerTime] = useState('08:00 PM');
  const [ledgerPlace, setLedgerPlace] = useState('');
  const [ledgerCost, setLedgerCost] = useState('');
  const [ledgerDuration, setLedgerDuration] = useState('2 Hours');
  const [ledgerClientRef, setLedgerClientRef] = useState('Admin Manual Ledger Entry');

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

  // States for editing a referral
  const [editingReferral, setEditingReferral] = useState<ReferralRecord | null>(null);
  const [editRefReferrer, setEditRefReferrer] = useState('');
  const [editRefUser, setEditRefUser] = useState('');
  const [editRefFullName, setEditRefFullName] = useState('');
  const [editRefPhone, setEditRefPhone] = useState('');
  const [editRefEmail, setEditRefEmail] = useState('');
  const [editRefTier, setEditRefTier] = useState<MemberLevel>('REGULAR');
  const [editRefCommission, setEditRefCommission] = useState<number>(0);
  const [editRefDate, setEditRefDate] = useState('');

  // States for manual withdrawal generator
  const [newWithdUser, setNewWithdUser] = useState('');
  const [newWithdAmount, setNewWithdAmount] = useState('');
  const [newWithdMethod, setNewWithdMethod] = useState('bKash Personal');
  const [newWithdAccount, setNewWithdAccount] = useState('');

  const [ledgerSuccess, setLedgerSuccess] = useState('');
  const [ledgerError, setLedgerError] = useState('');

  const handleAddManualLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    setLedgerSuccess('');
    setLedgerError('');

    if (!ledgerModelUsername) {
      setLedgerError('Please select a model companion from the list first!');
      return;
    }

    const matchedCompanion = companions.find(
      (c) => (c.modelUsername?.toLowerCase() === ledgerModelUsername.toLowerCase()) || (c.id === ledgerModelUsername)
    );

    if (!matchedCompanion) {
      setLedgerError('Selected model companion could not be found in the system roster.');
      return;
    }

    const costNum = Number(ledgerCost);
    if (isNaN(costNum) || costNum <= 0) {
      setLedgerError('Please specify a valid positive job payment amount (৳)!');
      return;
    }

    const uniqueId = `book-manual-${Date.now()}`;
    const newBooking = {
      id: uniqueId,
      username: 'admin_manual',
      clientName: ledgerClientRef || 'Manual Entry',
      modelName: matchedCompanion.name,
      modelUsername: matchedCompanion.modelUsername || matchedCompanion.id,
      date: ledgerDate,
      time: ledgerTime,
      location: ledgerPlace || 'Hotel Sanctuary / Client Suite',
      duration: ledgerDuration,
      cost: costNum,
      status: 'Completed',
      notes: 'Manually logged by administrator in Model Ledger panel.',
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'bookings', uniqueId), newBooking);
      setLedgerSuccess(`🎉 Manual ledger entry added successfully for ${matchedCompanion.name}! Model statistics and earnings share have been updated.`);
      setLedgerPlace('');
      setLedgerCost('');
    } catch (err) {
      console.error('Error adding manual ledger:', err);
      setLedgerError('Failed to record manual ledger entry to cloud Firestore database.');
    }
  };

  // States for Promo Code tab
  const [adminPromoCodes, setAdminPromoCodes] = useState<PromoCode[]>([]);
  const [promoCodeName, setPromoCodeName] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number>(35);
  const [promoDesc, setPromoDesc] = useState('');
  const [promoIsActive, setPromoIsActive] = useState<boolean>(true);
  const [promoMaxUses, setPromoMaxUses] = useState<string>('');
  const [promoCodeError, setPromoCodeError] = useState('');
  const [promoCodeSuccess, setPromoCodeSuccess] = useState('');
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);

  // Subscribe to promo codes collection in DB
  useEffect(() => {
    const colRef = collection(db, 'promo_codes');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const codes: PromoCode[] = [];
      snapshot.forEach((doc: any) => {
        codes.push({ id: doc.id, ...doc.data() });
      });
      // Sort by creation time or code name
      codes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setAdminPromoCodes(codes);
    }, (err) => {
      console.warn("Error loading promo codes inside AdminPanel:", err);
    });
    return () => unsubscribe();
  }, []);

  const [registeredAgents, setRegisteredAgents] = useState<any[]>([]);

  // Subscribe to agents collection in DB to fetch registered agent accounts
  useEffect(() => {
    const colRef = collection(db, 'agents');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const agentsList: any[] = [];
      snapshot.forEach((doc: any) => {
        agentsList.push({ id: doc.id, username: doc.id, ...doc.data() });
      });
      setRegisteredAgents(agentsList);
    }, (err) => {
      console.warn("Error loading agents inside AdminPanel:", err);
    });
    return () => unsubscribe();
  }, []);

  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<any[]>([]);

  // Subscribe to users collection in DB to fetch registered accounts
  useEffect(() => {
    const colRef = collection(db, 'users');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const usersList: any[] = [];
      snapshot.forEach((doc: any) => {
        usersList.push({ id: doc.id, username: doc.id, ...doc.data() });
      });
      setAllRegisteredUsers(usersList);
    }, (err) => {
      console.warn("Error loading users inside AdminPanel:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleBlockClient = async (client: any) => {
    try {
      const matchedUser = allRegisteredUsers.find(u => u.id === client.id || u.username === client.id);
      if (matchedUser) {
        const userDocRef = doc(db, 'users', matchedUser.id);
        const nextBlockedStatus = !matchedUser.isBlocked;
        await setDoc(userDocRef, { isBlocked: nextBlockedStatus }, { merge: true });
        
        setSelectedClient((prev: any) => prev ? { ...prev, isBlocked: nextBlockedStatus } : null);
        alert(`গ্রাহক অ্যাকাউন্টটি সফলভাবে ${nextBlockedStatus ? 'ব্লক' : 'আনব্লক'} করা হয়েছে!`);
      } else {
        const clientDocId = (client.name || 'guest').toLowerCase().replace(/\s+/g, '');
        const userDocRef = doc(db, 'users', clientDocId);
        await setDoc(userDocRef, {
          username: clientDocId,
          fullName: client.name,
          phone: client.phone,
          email: client.email,
          isBlocked: true
        }, { merge: true });
        setSelectedClient((prev: any) => prev ? { ...prev, isBlocked: true } : null);
        alert(`গ্রাহক অ্যাকাউন্টটি সফলভাবে ব্লক করা হয়েছে!`);
      }
    } catch (err) {
      console.error("Error blocking client:", err);
      alert("Error updating client block status.");
    }
  };

  const handleRemoveClient = async (client: any) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে এই গ্রাহক অ্যাকাউন্টটি ("${client.name}") ডাটাবেজ থেকে সম্পূর্ণ মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      const matchedUser = allRegisteredUsers.find(u => u.id === client.id || u.username === client.id);
      if (matchedUser) {
        const userDocRef = doc(db, 'users', matchedUser.id);
        await deleteDoc(userDocRef);
      }
      setSelectedClient(null);
      alert("গ্রাহক অ্যাকাউন্টটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে! (Client deleted successfully!)");
    } catch (err) {
      console.error("Error deleting client:", err);
      alert("Error deleting client account.");
    }
  };

  const clientsList = useMemo(() => {
    const clientsMap: { [key: string]: any } = {};

    // 1. Populate from registered users first
    allRegisteredUsers.forEach(u => {
      const usernameLower = u.username.toLowerCase();
      const key = usernameLower;
      clientsMap[key] = {
        id: u.id,
        name: u.fullName || u.username,
        phone: u.phone || '',
        email: u.email || '',
        gender: u.gender || '',
        userPhoto: u.userPhoto || u.avatarUrl || '',
        nidFront: u.nidFront || '',
        nidBack: u.nidBack || '',
        isBlocked: u.isBlocked || false,
        bookingsCount: 0,
        bookings: []
      };
    });

    // 2. Scan bookings to extract client profiles and match bookings to clients
    bookings.forEach(b => {
      const bName = b.clientName || 'Unnamed Client';
      const bPhone = b.clientPhone || 'No Phone';
      const bEmail = b.clientEmail || 'No Email';
      const photo = b.userPhoto || '';
      const nidFront = b.nidFront || '';
      const nidBack = b.nidBack || '';

      // Try matching to a registered user by phone, email, or name
      const matchedUser = allRegisteredUsers.find(u => 
        (bPhone && u.phone && u.phone.toLowerCase() === bPhone.toLowerCase()) ||
        (bEmail && u.email && u.email.toLowerCase() === bEmail.toLowerCase()) ||
        (bName && u.fullName && u.fullName.toLowerCase() === bName.toLowerCase())
      );

      let matchedKey = '';
      if (matchedUser) {
        matchedKey = matchedUser.username.toLowerCase();
      } else {
        // Fallback to name-phone matching for guests or manual bookings
        const fallbackKey = `${bName}-${bPhone}`.toLowerCase();
        if (clientsMap[fallbackKey]) {
          matchedKey = fallbackKey;
        } else {
          // Create guest client
          clientsMap[fallbackKey] = {
            id: b.id + '-client-profile',
            name: bName,
            phone: bPhone,
            email: bEmail,
            userPhoto: photo,
            nidFront,
            nidBack,
            isBlocked: false,
            bookingsCount: 0,
            bookings: []
          };
          matchedKey = fallbackKey;
        }
      }

      clientsMap[matchedKey].bookingsCount += 1;
      clientsMap[matchedKey].bookings.push(b);
      if (photo && !clientsMap[matchedKey].userPhoto) clientsMap[matchedKey].userPhoto = photo;
      if (nidFront && !clientsMap[matchedKey].nidFront) clientsMap[matchedKey].nidFront = nidFront;
      if (nidBack && !clientsMap[matchedKey].nidBack) clientsMap[matchedKey].nidBack = nidBack;
    });

    // 3. Add realistic seed profiles if there are absolutely no profiles in the directory
    if (Object.keys(clientsMap).length === 0) {
      clientsMap['akhi akther'] = {
        id: 'client-1',
        name: 'Akhi Akther',
        phone: '+8801711223344',
        email: 'akhi.akther.ofc@gmail.com',
        userPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        nidFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=600',
        nidBack: 'https://images.unsplash.com/photo-1589758438368-0ad531db3366?auto=format&fit=crop&q=80&w=600',
        isBlocked: false,
        bookingsCount: 1,
        bookings: []
      };
      clientsMap['tasnim ahmed'] = {
        id: 'client-2',
        name: 'Tasnim Ahmed',
        phone: '+8801723456789',
        email: 'tasnim@gmail.com',
        userPhoto: '',
        nidFront: '',
        nidBack: '',
        isBlocked: false,
        bookingsCount: 0,
        bookings: []
      };
    }

    return Object.values(clientsMap);
  }, [allRegisteredUsers, bookings]);

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
  const [localRegFeeMale, setLocalRegFeeMale] = useState(pricingConfig.registrationFeeMale ?? 3000);
  const [localRegFeeSperm, setLocalRegFeeSperm] = useState(pricingConfig.registrationFeeSperm ?? 3000);
  const [localRegularFee, setLocalRegularFee] = useState(pricingConfig.regularPlanFee);
  const [localPremiumFee, setLocalPremiumFee] = useState(pricingConfig.premiumPlanFee);
  const [localEliteFee, setLocalEliteFee] = useState(pricingConfig.elitePlanFee);
  const [pricingSuccess, setPricingSuccess] = useState(false);

  React.useEffect(() => {
    setLocalRegFee(pricingConfig.registrationFee);
    setLocalRegFeeMale(pricingConfig.registrationFeeMale ?? 3000);
    setLocalRegFeeSperm(pricingConfig.registrationFeeSperm ?? 3000);
    setLocalRegularFee(pricingConfig.regularPlanFee);
    setLocalPremiumFee(pricingConfig.premiumPlanFee);
    setLocalEliteFee(pricingConfig.elitePlanFee);
  }, [pricingConfig]);

  // Zoom Viewer States
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [zoomRotation, setZoomRotation] = useState<number>(0);

  // Helper to get exactly the companion's uploaded pictures or main image
  const getCompanionPictures = (picturesList: string[], mainImage?: string) => {
    let list = picturesList && picturesList.length > 0 ? [...picturesList] : [];
    if (list.length === 0 && mainImage) {
      list.push(mainImage);
    }
    return list;
  };

  // Search inside media
  const [mediaSearch, setMediaSearch] = useState('');

  // Candidate service rates state for manual allocation during verification
  const [candidateRates, setCandidateRates] = useState<Record<string, {
    rateReal?: number;
    rateCam?: number;
    rateMakeOut?: number;
    rateLiveTogether?: number;
  }>>({});

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
  const [compPictures, setCompPictures] = useState<string[]>([]);

  // Service toggle checkboxes
  const [compIsRealActive, setCompIsRealActive] = useState(true);
  const [compIsCamActive, setCompIsCamActive] = useState(true);
  const [compIsMakeOutActive, setCompIsMakeOutActive] = useState(true);
  const [compIsLiveTogetherActive, setCompIsLiveTogetherActive] = useState(true);

  // Custom Real duration rates
  const [compRateReal_1h, setCompRateReal_1h] = useState<string | number>('');
  const [compRateReal_2h, setCompRateReal_2h] = useState<string | number>('');
  const [compRateReal_3h, setCompRateReal_3h] = useState<string | number>('');
  const [compRateReal_fn, setCompRateReal_fn] = useState<string | number>('');
  const [compRateReal_2d, setCompRateReal_2d] = useState<string | number>('');

  // Custom Cam duration rates
  const [compRateCam_30m, setCompRateCam_30m] = useState<string | number>('');
  const [compRateCam_1h, setCompRateCam_1h] = useState<string | number>('');
  const [compRateCam_2h, setCompRateCam_2h] = useState<string | number>('');

  // Custom Make Out duration rates
  const [compRateMakeOut_2h, setCompRateMakeOut_2h] = useState<string | number>('');
  const [compRateMakeOut_3h, setCompRateMakeOut_3h] = useState<string | number>('');
  const [compRateMakeOut_fn, setCompRateMakeOut_fn] = useState<string | number>('');

  // Custom Live Together duration rates
  const [compRateLiveTogether_2d, setCompRateLiveTogether_2d] = useState<string | number>('');
  const [compRateLiveTogether_7d, setCompRateLiveTogether_7d] = useState<string | number>('');
  const [compRateLiveTogether_15d, setCompRateLiveTogether_15d] = useState<string | number>('');
  const [compRateLiveTogether_1m, setCompRateLiveTogether_1m] = useState<string | number>('');

  // Dynamic custom rates list states for active companions editor
  const [compCustomRealRates, setCompCustomRealRates] = useState<{ id: string; duration: string; rate: number }[]>([]);
  const [compCustomCamRates, setCompCustomCamRates] = useState<{ id: string; duration: string; rate: number }[]>([]);
  const [compCustomLiveTogetherRates, setCompCustomLiveTogetherRates] = useState<{ id: string; duration: string; rate: number }[]>([]);

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

  // New detailed hotel states
  const [locDistance, setLocDistance] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locCheckInTime, setLocCheckInTime] = useState('02:00 PM');
  const [locCheckOutTime, setLocCheckOutTime] = useState('11:00 AM');
  const [locHighlightedFacilities, setLocHighlightedFacilities] = useState('Air conditioning, Elevator, Smoke-free property, 24-hour reception, free internet');

  // Room Type 1 States
  const [locRoom1Name, setLocRoom1Name] = useState('Premium Deluxe Twin');
  const [locRoom1BedType, setLocRoom1BedType] = useState('TWIN x 2');
  const [locRoom1Capacity, setLocRoom1Capacity] = useState('Adult x 2, Child x 2');
  const [locRoom1ViewType, setLocRoom1ViewType] = useState('no-view');
  const [locRoom1Area, setLocRoom1Area] = useState('18 sqm');
  const [locRoom1Facilities, setLocRoom1Facilities] = useState('Breakfast Included, Non-Smoking room, Free cancellation');
  const [locRoom1Price, setLocRoom1Price] = useState('2311');

  // Room Type 2 States
  const [locRoom2Name, setLocRoom2Name] = useState('Executive Suite');
  const [locRoom2BedType, setLocRoom2BedType] = useState('KING x 1');
  const [locRoom2Capacity, setLocRoom2Capacity] = useState('Adult x 2, Child x 2');
  const [locRoom2ViewType, setLocRoom2ViewType] = useState('no-view');
  const [locRoom2Area, setLocRoom2Area] = useState('25 sqm');
  const [locRoom2Facilities, setLocRoom2Facilities] = useState('Breakfast Included, Non-Smoking room, Free cancellation');
  const [locRoom2Price, setLocRoom2Price] = useState('4500');

  // Partner filter (Active database vs Applicants)
  const [partnerSubTab, setPartnerSubTab] = useState<'active' | 'applicants'>('active');
  const [partnerCategoryFilter, setPartnerCategoryFilter] = useState<string>('Female Model');

  // Model Verification Sub tab / filters
  const [verifySearch, setVerifySearch] = useState('');
  const [verifyCategoryFilter, setVerifyCategoryFilter] = useState<string>('ALL');
  const [verifyCityFilter, setVerifyCityFilter] = useState('ALL');
  const [verifyEditingConfig, setVerifyEditingConfig] = useState<{ [id: string]: { badge: 'DEMO' | 'REGULAR' | 'PREMIUM' | 'ELITE', rate: number, rateReal?: number, rateCam?: number, rateLiveTogether?: number, rateMakeOut?: number, isRealActive?: boolean, isCamActive?: boolean, isMakeOutActive?: boolean, isLiveTogetherActive?: boolean, customRealRates?: { id: string; duration: string; rate: number }[], customCamRates?: { id: string; duration: string; rate: number }[], customLiveTogetherRates?: { id: string; duration: string; rate: number }[] } }>({});

  const pendingPaymentsList = payments.filter((p) => p.status === 'Pending Verification' && p.tierName === 'Wallet Deposit');
  const pendingMembershipsList = payments.filter((p) => p.status === 'Pending Verification' && p.tierName !== 'Wallet Deposit' && p.tierName !== 'Withdrawal');
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
    
    // Service toggles
    setCompIsRealActive(comp.isRealActive !== false);
    setCompIsCamActive(comp.isCamActive !== false);
    setCompIsMakeOutActive(comp.isMakeOutActive !== false);
    setCompIsLiveTogetherActive(comp.isLiveTogetherActive !== false);

    // Duration-specific custom fees
    setCompRateReal_1h(comp.rateReal_1h !== undefined ? comp.rateReal_1h : '');
    setCompRateReal_2h(comp.rateReal_2h !== undefined ? comp.rateReal_2h : '');
    setCompRateReal_3h(comp.rateReal_3h !== undefined ? comp.rateReal_3h : '');
    setCompRateReal_fn(comp.rateReal_fn !== undefined ? comp.rateReal_fn : '');
    setCompRateReal_2d(comp.rateReal_2d !== undefined ? comp.rateReal_2d : '');

    setCompRateCam_30m(comp.rateCam_30m !== undefined ? comp.rateCam_30m : '');
    setCompRateCam_1h(comp.rateCam_1h !== undefined ? comp.rateCam_1h : '');
    setCompRateCam_2h(comp.rateCam_2h !== undefined ? comp.rateCam_2h : '');

    setCompRateMakeOut_2h(comp.rateMakeOut_2h !== undefined ? comp.rateMakeOut_2h : '');
    setCompRateMakeOut_3h(comp.rateMakeOut_3h !== undefined ? comp.rateMakeOut_3h : '');
    setCompRateMakeOut_fn(comp.rateMakeOut_fn !== undefined ? comp.rateMakeOut_fn : '');

    setCompRateLiveTogether_2d(comp.rateLiveTogether_2d !== undefined ? comp.rateLiveTogether_2d : '');
    setCompRateLiveTogether_7d(comp.rateLiveTogether_7d !== undefined ? comp.rateLiveTogether_7d : '');
    setCompRateLiveTogether_15d(comp.rateLiveTogether_15d !== undefined ? comp.rateLiveTogether_15d : '');
    setCompRateLiveTogether_1m(comp.rateLiveTogether_1m !== undefined ? comp.rateLiveTogether_1m : '');

    setCompCity(comp.city || 'Dhaka');
    setCompBadge(comp.badge);
    setCompImage(comp.image);
    setCompCategory(comp.category || 'Female Model');
    setCompPictures(comp.pictures || []);
    setCompCustomRealRates(comp.customRealRates || []);
    setCompCustomCamRates(comp.customCamRates || []);
    setCompCustomLiveTogetherRates(comp.customLiveTogetherRates || []);
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
    setCompCustomRealRates([]);
    setCompCustomCamRates([]);
    setCompCustomLiveTogetherRates([]);

    // Service toggles reset
    setCompIsRealActive(true);
    setCompIsCamActive(true);
    setCompIsMakeOutActive(true);
    setCompIsLiveTogetherActive(true);

    // Custom duration rates reset
    setCompRateReal_1h('');
    setCompRateReal_2h('');
    setCompRateReal_3h('');
    setCompRateReal_fn('');
    setCompRateReal_2d('');

    setCompRateCam_30m('');
    setCompRateCam_1h('');
    setCompRateCam_2h('');

    setCompRateMakeOut_2h('');
    setCompRateMakeOut_3h('');
    setCompRateMakeOut_fn('');

    setCompRateLiveTogether_2d('');
    setCompRateLiveTogether_7d('');
    setCompRateLiveTogether_15d('');
    setCompRateLiveTogether_1m('');

    setCompCity('Dhaka');
    setCompBadge('REGULAR');
    setCompImage('');
    setCompCategory('Female Model');
    setCompPictures([]);
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
            isRealActive: compIsRealActive,
            isCamActive: compIsCamActive,
            isMakeOutActive: compIsMakeOutActive,
            isLiveTogetherActive: compIsLiveTogetherActive,
            rateReal_1h: compRateReal_1h !== '' ? Number(compRateReal_1h) : undefined,
            rateReal_2h: compRateReal_2h !== '' ? Number(compRateReal_2h) : undefined,
            rateReal_3h: compRateReal_3h !== '' ? Number(compRateReal_3h) : undefined,
            rateReal_fn: compRateReal_fn !== '' ? Number(compRateReal_fn) : undefined,
            rateReal_2d: compRateReal_2d !== '' ? Number(compRateReal_2d) : undefined,
            rateCam_30m: compRateCam_30m !== '' ? Number(compRateCam_30m) : undefined,
            rateCam_1h: compRateCam_1h !== '' ? Number(compRateCam_1h) : undefined,
            rateCam_2h: compRateCam_2h !== '' ? Number(compRateCam_2h) : undefined,
            rateMakeOut_2h: compRateMakeOut_2h !== '' ? Number(compRateMakeOut_2h) : undefined,
            rateMakeOut_3h: compRateMakeOut_3h !== '' ? Number(compRateMakeOut_3h) : undefined,
            rateMakeOut_fn: compRateMakeOut_fn !== '' ? Number(compRateMakeOut_fn) : undefined,
            rateLiveTogether_2d: compRateLiveTogether_2d !== '' ? Number(compRateLiveTogether_2d) : undefined,
            rateLiveTogether_7d: compRateLiveTogether_7d !== '' ? Number(compRateLiveTogether_7d) : undefined,
            rateLiveTogether_15d: compRateLiveTogether_15d !== '' ? Number(compRateLiveTogether_15d) : undefined,
            rateLiveTogether_1m: compRateLiveTogether_1m !== '' ? Number(compRateLiveTogether_1m) : undefined,
            city: compCity,
            badge: compBadge,
            image: finalImage,
            category: compCategory,
            pictures: getCompanionPictures(compPictures, finalImage),
            customRealRates: compCustomRealRates,
            customCamRates: compCustomCamRates,
            customLiveTogetherRates: compCustomLiveTogetherRates
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
        isRealActive: compIsRealActive,
        isCamActive: compIsCamActive,
        isMakeOutActive: compIsMakeOutActive,
        isLiveTogetherActive: compIsLiveTogetherActive,
        rateReal_1h: compRateReal_1h !== '' ? Number(compRateReal_1h) : undefined,
        rateReal_2h: compRateReal_2h !== '' ? Number(compRateReal_2h) : undefined,
        rateReal_3h: compRateReal_3h !== '' ? Number(compRateReal_3h) : undefined,
        rateReal_fn: compRateReal_fn !== '' ? Number(compRateReal_fn) : undefined,
        rateReal_2d: compRateReal_2d !== '' ? Number(compRateReal_2d) : undefined,
        rateCam_30m: compRateCam_30m !== '' ? Number(compRateCam_30m) : undefined,
        rateCam_1h: compRateCam_1h !== '' ? Number(compRateCam_1h) : undefined,
        rateCam_2h: compRateCam_2h !== '' ? Number(compRateCam_2h) : undefined,
        rateMakeOut_2h: compRateMakeOut_2h !== '' ? Number(compRateMakeOut_2h) : undefined,
        rateMakeOut_3h: compRateMakeOut_3h !== '' ? Number(compRateMakeOut_3h) : undefined,
        rateMakeOut_fn: compRateMakeOut_fn !== '' ? Number(compRateMakeOut_fn) : undefined,
        rateLiveTogether_2d: compRateLiveTogether_2d !== '' ? Number(compRateLiveTogether_2d) : undefined,
        rateLiveTogether_7d: compRateLiveTogether_7d !== '' ? Number(compRateLiveTogether_7d) : undefined,
        rateLiveTogether_15d: compRateLiveTogether_15d !== '' ? Number(compRateLiveTogether_15d) : undefined,
        rateLiveTogether_1m: compRateLiveTogether_1m !== '' ? Number(compRateLiveTogether_1m) : undefined,
        city: compCity,
        status: 'Approved',
        category: compCategory,
        pictures: getCompanionPictures(compPictures, finalImage),
        customRealRates: compCustomRealRates,
        customCamRates: compCustomCamRates,
        customLiveTogetherRates: compCustomLiveTogetherRates
      };
      onUpdateCompanions([newComp, ...companions]);
    }

    resetCompanionForm();
  };

  // Delete companion
  const handleDeleteCompanion = (id: string) => {
    const filtered = companions.filter(c => c.id !== id);
    onUpdateCompanions(filtered);
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
    
    // Detailed states
    setLocDistance(loc.distance || '');
    setLocAddress(loc.address || '');
    setLocCheckInTime(loc.checkInTime || '02:00 PM');
    setLocCheckOutTime(loc.checkOutTime || '11:00 AM');
    setLocHighlightedFacilities(loc.highlightedFacilities || 'Air conditioning, Elevator, Smoke-free property, 24-hour reception, free internet');
    
    // Room states
    setLocRoom1Name(loc.room1Name || 'Premium Deluxe Twin');
    setLocRoom1BedType(loc.room1BedType || 'TWIN x 2');
    setLocRoom1Capacity(loc.room1Capacity || 'Adult x 2, Child x 2');
    setLocRoom1ViewType(loc.room1ViewType || 'no-view');
    setLocRoom1Area(loc.room1Area || '18 sqm');
    setLocRoom1Facilities(loc.room1Facilities || 'Breakfast Included, Non-Smoking room, Free cancellation');
    setLocRoom1Price(loc.room1Price ? String(loc.room1Price) : '2311');

    setLocRoom2Name(loc.room2Name || 'Executive Suite');
    setLocRoom2BedType(loc.room2BedType || 'KING x 1');
    setLocRoom2Capacity(loc.room2Capacity || 'Adult x 2, Child x 2');
    setLocRoom2ViewType(loc.room2ViewType || 'no-view');
    setLocRoom2Area(loc.room2Area || '25 sqm');
    setLocRoom2Facilities(loc.room2Facilities || 'Breakfast Included, Non-Smoking room, Free cancellation');
    setLocRoom2Price(loc.room2Price ? String(loc.room2Price) : '4500');

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
    
    // Reset detailed states
    setLocDistance('');
    setLocAddress('');
    setLocCheckInTime('02:00 PM');
    setLocCheckOutTime('11:00 AM');
    setLocHighlightedFacilities('Air conditioning, Elevator, Smoke-free property, 24-hour reception, free internet');

    setLocRoom1Name('Premium Deluxe Twin');
    setLocRoom1BedType('TWIN x 2');
    setLocRoom1Capacity('Adult x 2, Child x 2');
    setLocRoom1ViewType('no-view');
    setLocRoom1Area('18 sqm');
    setLocRoom1Facilities('Breakfast Included, Non-Smoking room, Free cancellation');
    setLocRoom1Price('2311');

    setLocRoom2Name('Executive Suite');
    setLocRoom2BedType('KING x 1');
    setLocRoom2Capacity('Adult x 2, Child x 2');
    setLocRoom2ViewType('no-view');
    setLocRoom2Area('25 sqm');
    setLocRoom2Facilities('Breakfast Included, Non-Smoking room, Free cancellation');
    setLocRoom2Price('4500');

    setShowLocationForm(false);
  };

  // Save/Add hotel location
  const handleSaveLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim()) return;

    const finalImage = locImage.trim() || PRESET_HOTEL_IMAGES[Math.floor(Math.random() * PRESET_HOTEL_IMAGES.length)];

    const extraData = {
      distance: locDistance.trim(),
      address: locAddress.trim(),
      checkInTime: locCheckInTime.trim(),
      checkOutTime: locCheckOutTime.trim(),
      highlightedFacilities: locHighlightedFacilities.trim(),
      
      room1Name: locRoom1Name.trim(),
      room1BedType: locRoom1BedType.trim(),
      room1Capacity: locRoom1Capacity.trim(),
      room1ViewType: locRoom1ViewType.trim(),
      room1Area: locRoom1Area.trim(),
      room1Facilities: locRoom1Facilities.trim(),
      room1Price: Number(locRoom1Price) || 2311,

      room2Name: locRoom2Name.trim(),
      room2BedType: locRoom2BedType.trim(),
      room2Capacity: locRoom2Capacity.trim(),
      room2ViewType: locRoom2ViewType.trim(),
      room2Area: locRoom2Area.trim(),
      room2Facilities: locRoom2Facilities.trim(),
      room2Price: Number(locRoom2Price) || 4500,
    };

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
            mapEmbedUrl: locMapEmbedUrl.trim() || undefined,
            ...extraData
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
        description: locDesc || 'Premium high-security hotel sanctuary designed for confidentiality.',
        price: Number(locPrice) || 8000,
        mapEmbedUrl: locMapEmbedUrl.trim() || undefined,
        ...extraData
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

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = promoCodeName.trim().toUpperCase();
    if (!formattedCode) {
      setPromoCodeError('Promo code is required');
      return;
    }
    if (promoDiscount <= 0 || promoDiscount > 100) {
      setPromoCodeError('Discount must be between 1% and 100%');
      return;
    }

    try {
      setPromoCodeError('');
      setPromoCodeSuccess('');
      
      const pDocId = editingPromo ? editingPromo.id : `promo_${formattedCode}`;
      const docRef = doc(db, 'promo_codes', pDocId);

      const promoData = {
        code: formattedCode,
        discountPercent: Number(promoDiscount),
        description: promoDesc.trim() || `${promoDiscount}% Discount Promo`,
        isActive: promoIsActive,
        maxUses: promoMaxUses.trim() ? Number(promoMaxUses) : undefined,
        usedCount: editingPromo ? editingPromo.usedCount : 0,
        createdAt: editingPromo ? editingPromo.createdAt : new Date().toISOString()
      };

      await setDoc(docRef, promoData);

      setPromoCodeSuccess(editingPromo ? 'Promo code updated successfully!' : 'Promo code created successfully!');
      
      // Reset form states
      setPromoCodeName('');
      setPromoDiscount(35);
      setPromoDesc('');
      setPromoIsActive(true);
      setPromoMaxUses('');
      setEditingPromo(null);
    } catch (err: any) {
      console.error('Error saving promo code:', err);
      setPromoCodeError('Error occurred while saving promo code.');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await deleteDoc(doc(db, 'promo_codes', id));
      setPromoCodeSuccess('Promo code deleted successfully!');
    } catch (err) {
      console.error('Error deleting promo code:', err);
      setPromoCodeError('Error occurred while deleting promo code.');
    }
  };

  const handleTogglePromoStatus = async (promo: PromoCode) => {
    try {
      const docRef = doc(db, 'promo_codes', promo.id);
      await setDoc(docRef, { ...promo, isActive: !promo.isActive });
      setPromoCodeSuccess(`Promo code ${!promo.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error('Error toggling promo status:', err);
      setPromoCodeError('Error occurred while toggling status.');
    }
  };

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
          <div className="p-4 bg-gradient-to-r from-amber-950/15 to-transparent text-white flex items-center justify-between border-b border-[#161a24]">
            <div className="flex items-center gap-2.5 text-left font-semibold">
              <Server className="w-4 h-3.5 text-[#dbaa61]" />
              <span className="font-black tracking-widest text-[10px] uppercase text-amber-200">ADMIN CONTROL PANEL</span>
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
              <span className="text-[9px] bg-amber-500/10 text-[#dbaa61] font-mono font-bold px-1.5 py-0.5 rounded border border-[#dbaa61]/20">ONLINE</span>
            )}
          </div>

          {/* Menu categories */}
          <div className="p-3 border-b border-[#131722] bg-black/10 text-left">
            <span className="text-[9px] text-[#5c6985] font-black uppercase tracking-[0.2em] block px-1">CONSOLE NAVIGATION</span>
          </div>

          <nav className="p-2.5 space-y-1 text-slate-300">
            {/* Dashboard */}
            <button
              onClick={() => handleNavItemClick('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Dashboard Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>

            {/* Client Management */}
            <button
              onClick={() => handleNavItemClick('clients')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'clients' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Client Management</span>
              </div>
              {pendingPaymentsList.length > 0 &&
                <span className="bg-[#dbaa61] text-black text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none animate-pulse">
                  {pendingPaymentsList.length}
                </span>
              }
            </button>

            {/* Membership Requests */}
            <button
              onClick={() => handleNavItemClick('memberships')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'memberships'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={`w-4 h-4 shrink-0 ${activeTab === 'memberships' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Membership Requests</span>
              </div>
              {pendingMembershipsList.length > 0 &&
                <span className="bg-[#dbaa61] text-black text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none animate-pulse">
                  {pendingMembershipsList.length}
                </span>
              }
            </button>

            {/* Partner Management */}
            <button
              onClick={() => handleNavItemClick('partners')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'partners'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className={`w-4 h-4 shrink-0 ${activeTab === 'partners' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Partner Management</span>
              </div>
              {pendingApplicantsList.length > 0 ? (
                <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none">
                  {pendingApplicantsList.length} App
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  {companions.length} Active
                </span>
              )}
            </button>

            {/* Model Ledger / Financials */}
            <button
              onClick={() => handleNavItemClick('model_ledger')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'model_ledger'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp className={`w-4 h-4 shrink-0 ${activeTab === 'model_ledger' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Model Ledger & Payouts</span>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                ৳ LEDGER
              </span>
            </button>

            {/* Model Verification Tab */}
            <button
              onClick={() => handleNavItemClick('verification')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'verification'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'verification' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className={`w-4 h-4 shrink-0 ${activeTab === 'media' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Media Bank / Presets</span>
              </div>
              <span className="bg-amber-500/10 text-[#dbaa61] text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                {customMedia.length}
              </span>
            </button>

            {/* Orders */}
            <button
              onClick={() => handleNavItemClick('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'orders' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'hotels'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Hotel className={`w-4 h-4 shrink-0 ${activeTab === 'hotels' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Hotel Sanctuaries</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{locations.length} suite</span>
            </button>

            {/* Cities & Regions */}
            <button
              onClick={() => handleNavItemClick('cities')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'cities'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className={`w-4 h-4 shrink-0 ${activeTab === 'cities' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Cities & Areas</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{cities.length} areas</span>
            </button>

            {/* Payment Gateways */}
            <button
              onClick={() => handleNavItemClick('gateways')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'gateways'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'gateways' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Payment Gateways</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{paymentGateways.length} active</span>
            </button>

            {/* Manage Admins */}
            <button
              onClick={() => handleNavItemClick('admins')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'admins'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'admins' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Administrative Team</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold">{adminEmails.length} staff</span>
            </button>

            {/* Telegram & Branding Tab */}
            <button
              onClick={() => handleNavItemClick('smtp')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'smtp'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Bot className={`w-4 h-4 shrink-0 ${activeTab === 'smtp' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Telegram & Site Settings</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">Active</span>
            </button>

            {/* shortlinks */}
            <button
              onClick={() => handleNavItemClick('shortlinks')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'shortlinks'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Link2 className={`w-4 h-4 shrink-0 ${activeTab === 'shortlinks' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Registration Short Links</span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold font-mono">3 links</span>
            </button>

            {/* Referrals & Affiliate Tracking */}
            <button
              onClick={() => handleNavItemClick('referrals')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'referrals'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className={`w-4 h-4 shrink-0 ${activeTab === 'referrals' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Agent Management (এজেন্ট ও রেফারেল)</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-[#dbaa61] font-bold font-mono px-1.5 py-0.5 rounded border border-[#dbaa61]/25">
                {registeredAgents.length} Agents
              </span>
            </button>

            {/* Promo Codes Manager Tab */}
            <button
              onClick={() => handleNavItemClick('promocodes')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'promocodes'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className={`w-4 h-4 shrink-0 ${activeTab === 'promocodes' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Promo Codes (প্রোমো কোড)</span>
              </div>
              <span className="text-[10px] bg-red-500/10 text-red-400 font-bold font-mono px-1.5 py-0.5 rounded border border-red-500/25">
                {adminPromoCodes.length} Codes
              </span>
            </button>

            {/* Live Support Chat Tab */}
            <button
              onClick={() => handleNavItemClick('livechat')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'livechat'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`w-4 h-4 shrink-0 ${activeTab === 'livechat' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Live Support Chat</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold font-mono px-1.5 py-0.5 rounded border border-emerald-500/25">
                Live
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 bg-[#08090d] border-t border-[#131722] text-[11px] text-slate-400 space-y-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#dbaa61]/10 border border-[#dbaa61]/35 flex items-center justify-center font-bold text-[#dbaa61] uppercase leading-none font-sans text-sm select-none">
              {adminEmail ? adminEmail[0] : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white truncate text-[11px]" title={adminEmail || 'admin@bodytouch.com'}>
                {adminEmail || 'admin@bodytouch.com'}
              </p>
              <p className="text-[9px] font-mono text-[#dbaa61] uppercase font-bold tracking-wider leading-none mt-0.5">
                {loggedInAdminRole === 'super_admin' ? 'Super Admin' : loggedInAdminRole === 'moderator' ? 'Moderator' : 'Administrator'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('metro_maa_admin_auth');
              setIsAuth(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-950/45 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-[10px] uppercase tracking-wider transition cursor-pointer active:scale-95"
            title="Log out from administrative panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  // Render High Security Portal Gate if not authenticated
  if (!isAuth) {
    return (
      <div className="min-h-screen text-slate-100 bg-[#04060d] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans overflow-hidden relative selection:bg-[#dbaa61] selection:text-black w-full">
        {/* Animated Background Grids and Orbs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#dbaa61]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#dbaa61]/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Immersive Glassmorphic Centered Container */}
        <div className="w-full max-w-md bg-[#080d19]/90 border border-slate-800/80 rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.85)] backdrop-blur-xl relative z-10 flex flex-col justify-between min-h-[560px] p-6 sm:p-10">
          
          {/* Direct Close/Return to Site Button */}
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full border border-slate-800/60 hover:border-[#dbaa61]/45 hover:text-[#dbaa61] flex items-center justify-center text-slate-500 hover:bg-slate-900/40 transition-all cursor-pointer shadow-sm z-20"
            title="Return to Main Application"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="my-auto space-y-6 w-full animate-fadeIn text-center">
            {/* BRAND SIGNATURE */}
            <div className="flex flex-col items-center justify-center space-y-2.5 mb-2">
              <div className="h-14 w-14 bg-[#dbaa61]/10 border border-[#dbaa61]/40 rounded-2xl flex items-center justify-center text-[#dbaa61] shadow-[0_0_25px_rgba(219,170,97,0.15)] relative group transition-all duration-300">
                <ShieldCheck className="w-7 h-7 text-[#dbaa61]" />
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-black tracking-[0.25em] text-[#dbaa61] uppercase block">bodyTOUCH</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase font-mono block">ADMIN CONTROL PORTAL</span>
              </div>
            </div>

            {authStep === 'credentials' && (
              <>
                <div className="space-y-1.5 mb-4">
                  <h2 className="text-lg font-bold text-white tracking-tight">Admin Authentication / এডমিন অথেন্টিকেশন</h2>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                    পাসওয়ার্ড এবং ২-স্টেপ সিকিউরিটি কোড বসিয়ে এডমিন প্যানেলে প্রবেশ করুন।
                  </p>
                </div>

                {/* CUSTOM EMAIL & PASSWORD LOGIN */}
                <form onSubmit={handleCustomEmailPasswordSignIn} className="space-y-4 text-left pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-400 pl-1 uppercase tracking-wider font-mono">
                      Email Address / এডমিন ইমেইল
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Mail className="w-4 h-4 text-[#dbaa61]/60" />
                      </span>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => {
                          setAdminEmail(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        placeholder="admin@bodytouch.com"
                        className="w-full bg-[#03060d] border border-slate-800 hover:border-slate-700 focus:border-[#dbaa61] focus:ring-1 focus:ring-[#dbaa61]/35 rounded-xl !pl-11 pr-4 py-3 text-white text-xs placeholder-[#1e2333] focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-400 pl-1 uppercase tracking-wider font-mono">
                      Password / পাসওয়ার্ড
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock className="w-4 h-4 text-[#dbaa61]/60" />
                      </span>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        placeholder="••••••••"
                        className="w-full bg-[#03060d] border border-slate-800 hover:border-slate-700 focus:border-[#dbaa61] focus:ring-1 focus:ring-[#dbaa61]/35 rounded-xl !pl-11 pr-4 py-3 text-white text-xs placeholder-[#1e2333] focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="bg-red-950/20 border border-red-500/25 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-semibold leading-relaxed animate-shake text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-[#dbaa61] hover:bg-[#cdaf55] text-black font-bold uppercase text-xs tracking-wider py-3 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-40 font-bold"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        Verifying... / যাচাই করা হচ্ছে...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Credentials / পরবর্তী ধাপ
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {authStep === 'totp_setup' && (() => {
              const qrUrl = getSetupQRCodeUrl();
              return (
                /* GOOGLE AUTHENTICATOR MFA FIRST-TIME ENROLL SECURE WIZARD */
                <form onSubmit={handleVerifyOTPSetup} className="space-y-4 text-center animate-fadeIn">
                  <div className="space-y-1 border-b border-white/[0.04] pb-3">
                    <h3 className="text-[#dbaa61] uppercase tracking-wider text-xs font-bold">
                      Google Authenticator Link / গুগল অথেন্টিকেটর লিঙ্ক
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                      আপনার গুগল অথেন্টিকেটর অ্যাপে নিচের কিউআর কোডটি (QR Code) স্ক্যান করুন অথবা কোডটি ম্যানুয়ালি যোগ করুন।
                    </p>
                  </div>

                  {/* QR Code Graphic element */}
                  {qrUrl ? (
                    <div className="bg-white p-2.5 rounded-2xl mx-auto w-40 h-40 flex items-center justify-center shadow-[0_4px_25px_rgba(255,255,255,0.06)] border border-slate-705 select-none animate-fadeIn">
                      <img 
                        src={qrUrl} 
                        alt="Google Authenticator QR Code" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="text-[10px] text-red-400">QR Code generation failed. Please use Manual Key instead.</div>
                  )}

                  {/* Secret Key Container with Copy Button */}
                  <div className="bg-[#03060d]/60 border border-slate-800 rounded-2xl p-4 space-y-3.5">
                    <div className="space-y-1 text-center">
                      <span className="text-[9px] font-mono tracking-widest text-[#dbaa61] uppercase font-black">Manual Entry Key / ম্যানুয়াল কী</span>
                      <div className="flex items-center justify-between bg-black/40 border border-slate-800/80 rounded-xl px-3.5 py-2.5 font-mono text-[11px] text-slate-300">
                        <span className="select-all tracking-wider font-bold text-white">{totpSecret || 'ADMIN_TEMP_SECRET'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(totpSecret || 'ADMIN_TEMP_SECRET');
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="text-[#dbaa61] hover:text-[#cdaf55] transition p-1 rounded hover:bg-slate-900 cursor-pointer flex items-center justify-center"
                          title="Copy to clipboard"
                        >
                          {isCopied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Help Text */}
                    <div className="text-[10px] text-slate-400 leading-relaxed font-sans text-left bg-slate-950/40 p-3 rounded-xl border border-slate-900/60 space-y-1">
                      <span className="font-bold text-[#dbaa61] block mb-0.5">লিঙ্ক করার নিয়ম:</span>
                      <p>১. আপনার মোবাইলে <strong className="text-white">Google Authenticator</strong> অ্যাপ ওপেন করুন।</p>
                      <p>২. নিচে ডান কোণায় প্লাস (+) আইকন চেপে <strong className="text-white">"Scan a QR code"</strong> সিলেক্ট করে কোডটি স্ক্যান করুন।</p>
                      <p>৩. যদি স্ক্যান না করতে পারেন, তবে <strong className="text-white">"Enter a setup key"</strong> সিলেক্ট করে নাম "BodyTouch" এবং ওপরের "Manual Entry Key" টি বসিয়ে দিয়ে <strong className="text-white">Add</strong> চাপুন।</p>
                    </div>
                  </div>

                  {/* Input Code Verification Pad */}
                  <div className="bg-[#03060d]/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <div className="space-y-1 text-center">
                      <label className="block text-[10px] font-semibold tracking-wider text-slate-405 uppercase font-mono">
                        Enter Generated Code (আপনার অ্যাপের কোডটি দিন)
                      </label>

                      {/* Segmented Digit UI Lock Pad */}
                      <div className="relative flex justify-center py-1">
                        <div className="flex gap-2.5 justify-center">
                          {[0, 1, 2, 3, 4, 5].map((index) => {
                            const val = totpInputCode[index] || '';
                            const isCurrent = totpInputCode.length === index;
                            return (
                              <div 
                                key={index} 
                                className={`w-10 h-12 rounded-xl border flex items-center justify-center text-lg font-bold font-mono transition-all duration-300 ${
                                  val 
                                    ? 'border-[#dbaa61] bg-[#dbaa61]/5 text-[#dbaa61] shadow-[0_0_12px_rgba(219,170,97,0.15)]' 
                                    : isCurrent 
                                      ? 'border-[#dbaa61]/70 bg-slate-900 ring-1 ring-[#dbaa61]/25 animate-pulse' 
                                      : 'border-slate-800 bg-[#03060d]'
                                }`}
                              >
                                {val || <span className="text-slate-700 font-sans">•</span>}
                              </div>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          autoFocus
                          value={totpInputCode}
                          onChange={(e) => {
                            setTotpInputCode(e.target.value.replace(/\D/g, ''));
                            if (authError) setAuthError('');
                          }}
                          className="absolute inset-0 opacity-0 cursor-text w-full h-[48px]"
                        />
                      </div>
                    </div>
                  </div>

                  {authError && (
                    <div className="bg-red-950/20 border border-red-500/25 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-100 font-semibold leading-relaxed animate-shake text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('credentials');
                        setAuthError('');
                        setTotpInputCode('');
                      }}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition cursor-pointer text-center"
                    >
                      Go Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full py-3 rounded-xl bg-[#dbaa61] hover:bg-[#cdaf55] text-black text-[10px] uppercase font-bold tracking-wider transition cursor-pointer text-center shadow-md font-bold disabled:opacity-40"
                    >
                      {isSending ? 'Registering...' : 'Confirm'}
                    </button>
                  </div>
                </form>
              );
            })()}

            {authStep === 'totp_verify' && (
              /* GOOGLE AUTHENTICATOR 2FA SECURE VALIDATOR AT EVERY SIGNIN */
              <form onSubmit={handleVerifyOTPActive} className="space-y-4 text-center animate-fadeIn">
                <div className="space-y-1 border-b border-white/[0.04] pb-3">
                  <h3 className="text-[#dbaa61] uppercase tracking-wider text-sm font-bold">
                    Two-Factor authentication
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                    {useBackupCode ? (
                      <span>Enter your 8-character one-time backup code for account <strong className="text-white">{totpTempEnrollEmail}</strong>.</span>
                    ) : (
                      <span>Enter the 6-digit passcode token generated by Google Authenticator app for account <strong className="text-white">{totpTempEnrollEmail}</strong>.</span>
                    )}
                  </p>
                </div>

                {/* Code lock pad */}
                <div className="space-y-3 rounded-2xl bg-[#03060d]/60 p-4 border border-slate-800/80">
                  <div className="space-y-1 text-center font-semibold">
                    <label className="block text-[10px] font-semibold tracking-wider text-[#dbaa61] uppercase font-mono">
                      {useBackupCode ? 'One-Time Backup Code (ওয়ান-টাইম ব্যাকআপ কোড)' : 'Security Passcode'}
                    </label>
                    
                    {useBackupCode ? (
                      <div className="py-2">
                        <input
                          type="text"
                          required
                          maxLength={12}
                          autoFocus
                          placeholder="e.g. B4H2K9P1"
                          value={backupInputCode}
                          onChange={(e) => {
                            setBackupInputCode(e.target.value.toUpperCase());
                            if (authError) setAuthError('');
                          }}
                          className="w-full bg-[#0b0c10] border border-[#dbaa61]/30 focus:border-[#dbaa61] rounded-xl text-center text-sm font-bold font-mono tracking-widest text-[#dbaa61] py-3 uppercase focus:outline-none placeholder-slate-700 transition"
                        />
                      </div>
                    ) : (
                      /* Segmented Digit UI lock pad */
                      <div className="relative flex justify-center py-2">
                        <div className="flex gap-2.5 justify-center">
                          {[0, 1, 2, 3, 4, 5].map((index) => {
                            const val = totpInputCode[index] || '';
                            const isCurrent = totpInputCode.length === index;
                            return (
                              <div 
                                key={index} 
                                className={`w-10 h-12 rounded-xl border flex items-center justify-center text-lg font-bold font-mono transition-all duration-300 ${
                                  val 
                                    ? 'border-[#dbaa61] bg-[#dbaa61]/5 text-[#dbaa61] shadow-[0_0_12px_rgba(219,170,97,0.15)]' 
                                    : isCurrent 
                                      ? 'border-[#dbaa61]/70 bg-slate-900 ring-1 ring-[#dbaa61]/25 animate-pulse' 
                                      : 'border-slate-800 bg-[#03060d]'
                                }`}
                              >
                                {val || <span className="text-slate-700 font-sans">•</span>}
                              </div>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          autoFocus
                          value={totpInputCode}
                          onChange={(e) => {
                            setTotpInputCode(e.target.value.replace(/\D/g, ''));
                            if (authError) setAuthError('');
                          }}
                          className="absolute inset-0 opacity-0 cursor-text w-full h-[48px] text-center"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Switch between TOTP and Backup code */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setAuthError('');
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer transition"
                  >
                    {useBackupCode ? '← Use Authenticator App (অ্যাপ কোড ব্যবহার করুন)' : '🔑 Lost Access? Use Backup Code (ব্যাকআপ কোড ব্যবহার করুন)'}
                  </button>
                </div>

                {authError && (
                  <div className="bg-red-950/20 border border-red-500/25 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-400 font-semibold leading-relaxed animate-shake text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthStep('credentials');
                      setAuthError('');
                      setTotpInputCode('');
                      setBackupInputCode('');
                      setUseBackupCode(false);
                    }}
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition cursor-pointer text-center"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-3 rounded-xl bg-[#dbaa61] hover:bg-[#cdaf55] text-black text-[10px] uppercase font-bold tracking-wider transition cursor-pointer text-center shadow-md font-bold disabled:opacity-40"
                  >
                    {isSending ? 'Verifying...' : 'Unlock'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Clean footer info */}
          <div className="pt-6 border-t border-slate-850/50 mt-6 flex flex-col justify-center items-center text-[10px] font-mono text-slate-500 gap-1">
            <span className="flex items-center gap-1.5 font-bold uppercase text-[9px] text-[#dbaa61]/70 bg-[#dbaa61]/5 px-2 py-0.5 rounded border border-[#dbaa61]/15 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AUTHORIZED ENTRY
            </span>
            <span className="text-[9px] text-slate-600 font-bold tracking-wider font-mono">ADMIN PANEL MAIN GATEWAY</span>
          </div>
        </div>
      </div>
    );
  }

  const adminTabsList = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients' as const, label: 'Deposits', icon: Users, badgeCount: pendingPaymentsList.length },
    { id: 'memberships' as const, label: 'VIP Upgrades', icon: Layers, badgeCount: pendingMembershipsList.length },
    { id: 'partners' as const, label: 'Catalog', icon: Briefcase },
    { id: 'verification' as const, label: 'Applicants', icon: UserCheck, badgeCount: pendingApplicantsList.length },
    { id: 'orders' as const, label: 'Bookings', icon: Clock, badgeCount: pendingBookingsList.length },
    { id: 'hotels' as const, label: 'Hotels', icon: Hotel },
    { id: 'cities' as const, label: 'Cities', icon: Globe },
    { id: 'gateways' as const, label: 'Gateways', icon: CreditCard },
    { id: 'admins' as const, label: 'Admins', icon: Users },
    { id: 'smtp' as const, label: 'Settings & TG', icon: Bot },
    { id: 'shortlinks' as const, label: 'Short Links', icon: Link2 },
    { id: 'referrals' as const, label: 'Referrals', icon: Award },
    { id: 'promocodes' as const, label: 'Promo Codes', icon: Tag },
    { id: 'livechat' as const, label: 'Support Chat', icon: MessageSquare },
    { id: 'model_ledger' as const, label: 'Model Ledger', icon: TrendingUp },
  ];

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

      {/* Admin Panel Navbar */}
      <div className="bg-[#0b0c10] border-b border-[#161a24] py-3.5 px-4 sm:px-6 flex items-center justify-between text-xs text-slate-300 select-none">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none max-w-[70%] lg:max-w-none">
          
          {/* Hamburger Menu Toggler for Mobile/Tablet */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="lg:hidden text-slate-300 hover:text-white p-2 hover:bg-slate-800/20 active:bg-slate-800/40 rounded-xl border border-[#161a24] active:scale-95 transition-all outline-none"
            title="Toggle Navigation"
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          {/* Executive Shield Logo */}
          <div className="flex items-center gap-2.5 font-extrabold text-white shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(219,170,97,0.15)]">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <span className="tracking-widest uppercase text-xs font-black sm:text-sm text-gradient bg-gradient-to-r from-amber-200 to-[#dbaa61] bg-clip-text text-transparent">BODY TOUCH CORESHEET</span>
            <span className="hidden sm:inline-flex bg-amber-500/10 border border-[#dbaa61]/20 text-[#dbaa61] text-[8px] font-black tracking-widest px-2 py-0.5 rounded-sm items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
              ONLINE
            </span>
          </div>

          <div className="hidden lg:block h-5 w-px bg-slate-800" />

          <div className="hidden lg:flex items-center gap-4.5 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer">
              Database: Online
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer">
              Staff Portal Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex bg-[#0d0a05] border border-amber-500/15 text-[#dbaa61] text-[9.5px] font-mono px-3 py-1 rounded-md items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Staff Portal
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
          
          {/* Horizontal Mobile Tabs Scroll Bar */}
          <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none border-b border-[#161a24] select-none">
            {adminTabsList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black tracking-wider uppercase whitespace-nowrap shrink-0 border transition-all active:scale-95 duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/35 text-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.12)]'
                      : 'bg-[#0f1118]/60 border-slate-800/40 text-slate-400 hover:text-white hover:border-slate-700/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                    <span className="bg-red-650 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none animate-pulse">
                      {tab.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active section header mapping */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2333] pb-5">
            <div className="text-left">
              <h1 className="text-2xl font-black text-white uppercase tracking-tight font-display flex items-center gap-2">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'clients' && 'Client Accounts & Deposits'}
                {activeTab === 'memberships' && 'Membership Upgrade Requests'}
                {activeTab === 'partners' && 'Escort & Models Catalog'}
                {activeTab === 'media' && 'Media & Presets Bank'}
                {activeTab === 'orders' && 'Active Bookings & Orders'}
                {activeTab === 'hotels' && 'Recommended Hotels'}
                {activeTab === 'cities' && 'Operational Cities'}
                {activeTab === 'gateways' && 'Payment Gateway Settings'}
                {activeTab === 'verification' && 'Model Verifications (মডেল যাচাইকরণ)'}
                {activeTab === 'admins' && 'Administrative Team'}
                {activeTab === 'smtp' && 'System & Telegram Settings'}
                {activeTab === 'shortlinks' && 'Quick Registration Links'}
                {activeTab === 'referrals' && 'Agent & Referral Management (এজেন্ট ও রেফারেল)'}
                {activeTab === 'promocodes' && 'Promo Codes Manager (প্রোমো কোড ম্যানেজার)'}
                {activeTab === 'livechat' && 'Live Support Chat Console'}
                {activeTab === 'model_ledger' && 'Model Ledger & Financial Audit'}
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                {activeTab === 'shortlinks' && 'View, test, and copy user registration and application forms for different model types.'}
                {activeTab === 'dashboard' && 'Overall platform performance metrics and active system overview.'}
                {activeTab === 'clients' && 'Verify and process client deposit tickets and manage user wallets.'}
                {activeTab === 'memberships' && 'Verify and process client membership level upgrades (Regular, Premium, Elite).'}
                {activeTab === 'partners' && 'Add, update, or remove companion profile criteria and catalog attributes.'}
                {activeTab === 'media' && 'Manage image preset libraries used in pages and profile listings.'}
                {activeTab === 'orders' && 'Review client dispatch bookings and adjust order completion metrics.'}
                {activeTab === 'hotels' && 'Setup hotel sanctuaries and luxury private safehouses.'}
                {activeTab === 'cities' && 'Define operational divisions, cities, and specific dispatch zones.'}
                {activeTab === 'gateways' && 'Add or change mobile banking wallet routes and user transfer instructions.'}
                {activeTab === 'verification' && 'Inspect and approve new talent signups and companion signups.'}
                {activeTab === 'admins' && 'Set and control authorized staff emails and edit secondary validation metrics.'}
                {activeTab === 'smtp' && 'Synchronize order dispatches with Telegram notification bots and helplines.'}
                {activeTab === 'referrals' && 'Track commission balances, affiliate tiers, and process withdrawal requests.'}
                {activeTab === 'promocodes' && 'Create, activate, deactivate, and track custom discount and acquisition promo codes.'}
                {activeTab === 'livechat' && 'Chat with premium and elite customers in real-time, answer questions, and assist in reservation booking.'}
                {activeTab === 'model_ledger' && 'Add manual dispatch ledger records, audit model balances, and track withdrawable payouts.'}
              </p>
            </div>

            {/* Premium Live Clock and System Gateway Status Indicator */}
            <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
              <div className="bg-[#120f0a]/80 backdrop-blur-md border border-[#dbaa61]/20 rounded-2xl p-3 px-4 flex items-center gap-3.5 shadow-xl shadow-black/40">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse relative">
                  <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75" />
                </div>
                <div className="text-left border-l border-white/[0.08] pl-3.5">
                  <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">CURRENT TIME (BST)</span>
                  <span className="block text-xs font-black font-mono text-[#dbaa61] mt-1.5 leading-none">
                    {liveTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </span>
                </div>
                <div className="hidden md:block text-left border-l border-white/[0.08] pl-3.5">
                  <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">CURRENT DATE</span>
                  <span className="block text-[10px] font-extrabold text-slate-300 mt-1.5 leading-none">
                    {liveTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =======================================================
              DASHBOARD OVERVIEW TAB
             ======================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 text-left animate-fadeIn">
              
              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
                
                {/* Total Members Card */}
                <div className="relative overflow-hidden bg-gradient-to-b from-[#141210] to-[#0a0b10] border border-[#dbaa61]/15 hover:border-[#dbaa61]/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_20px_-3px_rgba(219,170,97,0.03)] hover:shadow-[#dbaa61]/10 hover:-translate-y-0.5 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-2xl group-hover:bg-amber-500/[0.05] transition-all duration-300" />
                  <div className="flex items-center justify-between text-amber-500 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total VIP Clients</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-[#dbaa61]/10">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-white via-amber-200 to-amber-100 bg-clip-text text-transparent font-mono">
                      {payments.filter(p => p.status === 'Approved').length}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-none tracking-wider">Active Premium Tier</p>
                  </div>
                </div>

                {/* Active Partners Card */}
                <div className="relative overflow-hidden bg-gradient-to-b from-[#141210] to-[#0a0b10] border border-[#dbaa61]/15 hover:border-[#dbaa61]/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_20px_-3px_rgba(219,170,97,0.03)] hover:shadow-[#dbaa61]/10 hover:-translate-y-0.5 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-2xl group-hover:bg-amber-500/[0.05] transition-all duration-300" />
                  <div className="flex items-center justify-between text-amber-500 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dispatched Models</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-[#dbaa61]/10">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-white via-amber-200 to-amber-100 bg-clip-text text-transparent font-mono">
                      {companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined').length}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-none tracking-wider">Active Companions</p>
                  </div>
                </div>

                {/* Media Assets Card */}
                <div className="relative overflow-hidden bg-gradient-to-b from-[#141210] to-[#0a0b10] border border-[#dbaa61]/15 hover:border-[#dbaa61]/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_20px_-3px_rgba(219,170,97,0.03)] hover:shadow-[#dbaa61]/10 hover:-translate-y-0.5 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-2xl group-hover:bg-amber-500/[0.05] transition-all duration-300" />
                  <div className="flex items-center justify-between text-amber-500 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Media Presets</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-[#dbaa61]/10">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-white via-amber-200 to-amber-100 bg-clip-text text-transparent font-mono">
                      {customMedia.length}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-none tracking-wider">Gallery Stock Assets</p>
                  </div>
                </div>

                {/* Active Orders Card */}
                <div className="relative overflow-hidden bg-gradient-to-b from-[#141210] to-[#0a0b10] border border-[#dbaa61]/15 hover:border-[#dbaa61]/40 p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 shadow-[0_4px_20px_-3px_rgba(219,170,97,0.03)] hover:shadow-[#dbaa61]/10 hover:-translate-y-0.5 group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-2xl group-hover:bg-amber-500/[0.05] transition-all duration-300" />
                  <div className="flex items-center justify-between text-amber-500 pb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dispatch Request Logs</span>
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-[#dbaa61]/10">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4 relative">
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-white via-amber-200 to-amber-100 bg-clip-text text-transparent font-mono">
                      {bookings.length}
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 leading-none tracking-wider">Total Bookings</p>
                  </div>
                </div>

              </div>

              {/* Bangla Welcome Banner and Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Glassmorphic Banner */}
                <div className="col-span-full lg:col-span-7 bg-gradient-to-br from-[#1c1712] via-[#0d0907] to-[#08090d] border border-[#dbaa61]/25 p-6 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col justify-between">
                  <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-36 h-36 bg-[#dbaa61]/[0.03] blur-3xl pointer-events-none rounded-full" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400/10 text-[#dbaa61] border border-[#dbaa61]/20 text-[8.5px] font-mono tracking-widest px-2.5 py-0.5 rounded font-black uppercase">ADMIN CONSOLE</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 text-[8.5px] font-mono tracking-widest px-2.5 py-0.5 rounded font-black uppercase flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                        SECURED STAFF SESSION
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#dbaa61] mt-3.5 leading-tight select-none">
                      স্বাগতম, দ্য বডি টাচ অ্যাডমিন প্যানেল!
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-2.5">
                      এই সেন্ট্রাল অ্যাডমিন ড্যাশবোর্ড থেকে আপনি গ্রাহক অ্যাকাউন্ট (VIP Clients), পার্টনার প্রফাইল (Companions & Models), মিডিয়া ব্যাংক, এবং বুকিং অর্ডার ও টেলিগ্রাম ইন্টিগ্রেশন সেটিংস নিখুঁতভাবে নিয়ন্ত্রণ করতে পারবেন। কোনো পরিবর্তন করার সাথে সাথে তা ফ্রন্টএন্ডে রিয়েল-টাইমে আপডেট হয়ে যাবে।
                    </p>
                  </div>
                  <div className="pt-5 mt-4 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">⚡ PORTAL STATUS: <strong className="text-white">ONLINE</strong></span>
                    <span className="text-[#dbaa61]">Staff Control Room</span>
                  </div>
                </div>

                {/* Quick Shortcuts Panel */}
                <div className="col-span-full lg:col-span-5 bg-[#0f1118] border border-white/[0.04] p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">⚡ QUICK DASHBOARD SHORTCUTS</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    
                    <button
                      onClick={() => setActiveTab('clients')}
                      className="group bg-black/40 hover:bg-[#dbaa61]/10 border border-white/[0.03] hover:border-[#dbaa61]/40 py-3.5 px-4 rounded-xl text-left text-white hover:text-amber-200 font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 group-hover:bg-indigo-500/20">
                          <Users className="w-4 h-4" />
                        </div>
                        <span>Process {pendingPaymentsList.length} Pending Deposits</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-200 transition-all" />
                    </button>

                    <button
                      onClick={() => setActiveTab('memberships')}
                      className="group bg-black/40 hover:bg-[#dbaa61]/10 border border-white/[0.03] hover:border-[#dbaa61]/40 py-3.5 px-4 rounded-xl text-left text-white hover:text-amber-200 font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/10 group-hover:bg-pink-500/20">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span>Process {pendingMembershipsList.length} Membership Upgrades</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-200 transition-all" />
                    </button>

                    <button
                      onClick={() => { setActiveTab('partners'); setShowCompanionForm(true); setPartnerSubTab('active'); }}
                      className="group bg-black/40 hover:bg-[#dbaa61]/10 border border-white/[0.03] hover:border-[#dbaa61]/40 py-3.5 px-4 rounded-xl text-left text-white hover:text-amber-200 font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/10 group-hover:bg-emerald-500/20">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span>Register New Companion Profile</span>
                      </div>
                      <Plus className="w-4 h-4 text-emerald-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('media')}
                      className="group bg-black/40 hover:bg-[#dbaa61]/10 border border-white/[0.03] hover:border-[#dbaa61]/40 py-3.5 px-4 rounded-xl text-left text-white hover:text-amber-200 font-semibold transition-all duration-200 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/10 group-hover:bg-rose-500/20">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span>View Custom Media Bank</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-200 transition-all" />
                    </button>

                  </div>
                </div>

              </div>

              {/* 🚨 DATABASE RESET & FRESH TESTING CONTROLS */}
              <div className="bg-[#1c1012] border border-red-500/20 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] font-mono">DATABASE SECTOR SCRUBBER (DEVELOPER ACTION)</h4>
                  </div>
                  <p className="text-[11px] text-slate-350 font-semibold leading-relaxed">
                    সিস্টেমের পূর্বের সকল কাস্টমার অ্যাকাউন্ট (users), বুকিং হিস্ট্রি (bookings) এবং রিলেটেড ট্রানজেকশন ডাটা (payments) ফায়ারস্টোর ক্লাউড থেকে একদম মুছে ফ্রেশ টেস্ট করতে নিচের রিসেট বাটনে ক্লিক করুন।
                  </p>
                </div>
                <button
                  disabled={isResetting}
                  onClick={handleClearClientAccounts}
                  className="bg-gradient-to-tr from-rose-800 to-rose-600 hover:brightness-110 text-white text-[10.5px] px-5 py-3.5 rounded-xl font-black uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[280px] shrink-0 shadow-lg shadow-rose-950/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
                  {isResetting ? "CLEARING PORTAL DATA..." : "CLEAR SYSTEM DATABASE & DATA RESET"}
                </button>
              </div>

              {/* Ticker Logs Area for Brutalist/Tech aesthetic */}
              <div className="bg-[#05060b] border border-red-500/5 rounded-2xl p-4 font-mono text-[10px] text-slate-500 space-y-1.5 leading-normal">
                <div className="flex items-center gap-1.5 text-blue-500 font-bold border-b border-white/5 pb-1.5 mb-2 uppercase">
                  <Terminal className="w-4 h-4" />
                  <span>Real-time Secure Operations Ticker</span>
                </div>
                <p><span className="text-emerald-500">[2026-06-08 08:32]</span> - CMS Core Connection Establish successfully with Port 3000 Ingress Router.</p>
                <p><span className="text-emerald-500">[2026-06-08 08:30]</span> - EmailJS dispatch daemon initialized inside Hostinger memory.</p>
                <p><span className="text-blue-500">[2026-06-08 07:44]</span> - Admin Secure Hash matching confirmed for route <strong className="text-blue-300">/turmarheda</strong>.</p>
              </div>

            </div>
          )}

          {/* =======================================================
              CLINT / CLIENT MANAGEMENT TAB
             ======================================================= */}
          {activeTab === 'clients' && (
            <div className="space-y-5 text-left">
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                বডি টাচ গ্রাহকদের ট্রানজেকশন তালিকা নিচে দেওয়া হলো। অ্যাডমিন হিসেবে ট্রানজেকশন আইডি মিলিয়ে মেম্বার সেকশন 
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

                      {pay.screenshot && (
                        <div className="bg-black/40 p-3 rounded-xl border border-blue-550/10 text-[11px] space-y-2">
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">📸 Payment Screenshot (স্ক্রিনশট):</span>
                          <div className="relative group overflow-hidden rounded-lg">
                            <img
                              src={pay.screenshot}
                              alt="Payment proof screenshot"
                              className="max-h-48 w-full object-contain rounded-lg border border-white/5 bg-slate-950"
                              referrerPolicy="no-referrer"
                            />
                            <a
                              href={pay.screenshot}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-blue-400 font-extrabold transition-all rounded-lg cursor-pointer gap-1"
                            >
                              View Full Size Image ↗
                            </a>
                          </div>
                        </div>
                      )}

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
                    <div
                      key={client.id}
                      className={`relative bg-black/25 hover:bg-black/35 border ${client.isBlocked ? 'border-rose-500/35 bg-rose-950/5' : 'border-blue-500/10 hover:border-blue-500/35'} p-3.5 rounded-xl flex items-center justify-between gap-3 transition text-left w-full group`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left cursor-pointer"
                      >
                        <div className={`w-10 h-10 rounded-full ${client.isBlocked ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' : 'bg-blue-500/5 border-blue-500/20 text-blue-400'} border flex items-center justify-center text-xs font-black overflow-hidden shrink-0`}>
                          {client.userPhoto ? (
                            <img src={client.userPhoto} alt={client.name} className="w-full h-full object-cover" />
                          ) : (
                            client.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className={`text-xs font-black truncate ${client.isBlocked ? 'text-rose-400' : 'text-white group-hover:text-blue-400 transition'}`}>{client.name}</p>
                            {client.isBlocked && (
                              <span className="bg-rose-500/15 text-rose-400 border border-rose-500/25 text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wider shrink-0">Blocked</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate font-mono">{client.phone}</p>
                          <p className="text-[9px] text-[#5c75ab] font-bold uppercase tracking-wider mt-0.5">
                            {client.bookingsCount} {client.bookingsCount === 1 ? 'Service' : 'Services'} booked
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClient(client);
                        }}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all cursor-pointer shrink-0"
                        title="মুছে ফেলুন (Remove Client)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-500/25 tracking-widest block w-fit">
                              Client Profile
                            </span>
                            {selectedClient.isBlocked && (
                              <span className="text-[9px] bg-rose-500/25 text-rose-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-rose-500/30 tracking-widest block w-fit animate-pulse">
                                BANNED / BLOCKED
                              </span>
                            )}
                          </div>
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

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">EMAIL ADDRESS / ইমেইল</span>
                          <span className="text-xs text-blue-400 font-mono font-black block mt-1 select-all">{selectedClient.email || 'No Email'}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">GENDER / লিঙ্গ</span>
                          <span className="text-xs text-[#dbaa61] font-black block mt-1 uppercase">
                            {selectedClient.gender === 'male' ? '👨 Male / পুরুষ' : selectedClient.gender === 'female' ? '👩 Female / নারী' : 'Not Specified'}
                          </span>
                        </div>
                      </div>

                      {/* NID Section */}
                      <div className="space-y-3.5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Verification Documents (NID / Birth Certificate) / ভেরিফিকেশন ডকুমেন্ট</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Front image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID / Birth Certificate Front (সামনের অংশ / জন্মনিবন্ধন)</span>
                            {selectedClient.nidFront ? (
                              <button 
                                type="button"
                                onClick={() => {
                                  setZoomedImage(selectedClient.nidFront);
                                  setZoomScale(1);
                                  setZoomRotation(0);
                                }}
                                className="w-full text-left block relative group overflow-hidden rounded-xl border border-blue-500/10 cursor-zoom-in active:scale-95 transition-all"
                              >
                                <img src={selectedClient.nidFront} alt="NID Front / Birth Certificate" className="w-full h-32 object-cover rounded-xl group-hover:scale-105 transition duration-300" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold text-white">
                                  Click to Zoom & Rotate / জুম ও রোটেট করুন 🔍
                                </div>
                              </button>
                            ) : (
                              <div className="h-32 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center text-[10.5px] text-slate-600 font-medium">
                                Document not provided / তথ্য দেয়া হয়নি
                              </div>
                            )}
                          </div>

                          {/* Back image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID Back / Document Page 2 (পেছনের অংশ / পৃষ্ঠা ২)</span>
                            {selectedClient.nidBack ? (
                              <button 
                                type="button"
                                onClick={() => {
                                  setZoomedImage(selectedClient.nidBack);
                                  setZoomScale(1);
                                  setZoomRotation(0);
                                }}
                                className="w-full text-left block relative group overflow-hidden rounded-xl border border-blue-500/10 cursor-zoom-in active:scale-95 transition-all"
                              >
                                <img src={selectedClient.nidBack} alt="NID Back" className="w-full h-32 object-cover rounded-xl group-hover:scale-105 transition duration-300" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold text-white">
                                  Click to Zoom & Rotate / জুম ও রোটেট করুন 🔍
                                </div>
                              </button>
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

                      <div className="pt-2 space-y-2">
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleBlockClient(selectedClient)}
                            className={`flex-1 py-3 px-4 rounded-xl text-[10.5px] font-black uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                              selectedClient.isBlocked
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20 hover:bg-amber-500/25'
                                : 'bg-rose-500/15 text-rose-400 border-rose-500/20 hover:bg-rose-500/25'
                            }`}
                          >
                            {selectedClient.isBlocked ? '🔓 Unblock Client' : '⛔ Block Client'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveClient(selectedClient)}
                            className="flex-1 bg-rose-900/20 hover:bg-rose-900/25 text-rose-400 border border-rose-500/25 text-[10.5px] font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer"
                          >
                            🗑️ Delete Account
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedClient(null)}
                          className="w-full bg-blue-500/10 hover:bg-blue-500/15 text-blue-300 hover:text-white border border-blue-500/20 text-[10.5px] font-extrabold uppercase py-3 rounded-xl transition duration-200 cursor-pointer"
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
              MEMBERSHIP UPGRADE REQUESTS TAB
             ======================================================= */}
          {activeTab === 'memberships' && (
            <div className="space-y-5 text-left">
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                গ্রাহকদের মেম্বারশিপ আপগ্রেড রিকোয়েস্ট তালিকা নিচে দেওয়া হলো। অ্যাডমিন হিসেবে গ্রাহকদের bKash/Nagad/Rocket ট্রানজেকশন আইডি মিলিয়ে মেম্বার সেকশন 
                <strong className="text-emerald-400"> Approve </strong> (মেম্বারশিপ এক্টিভেশন) অথবা <strong className="text-rose-400"> Reject </strong> করুন।
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingMembershipsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    🚀 NO PENDING MEMBERSHIP REQUESTS TO VERIFY
                  </div>
                ) : (
                  pendingMembershipsList.map((pay) => (
                    <div
                      key={pay.id}
                      className="bg-[#11131a] border border-amber-500/15 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all font-sans"
                    >
                      <div className="flex justify-between items-start text-xs border-b border-white/5 pb-3">
                        <div>
                          <p className="text-white font-extrabold text-sm font-sans">
                            Client: <span className="text-blue-400 font-mono font-bold select-all">{pay.username}</span>
                          </p>
                          <p className="text-[10px] text-amber-400 font-black tracking-normal uppercase mt-1">
                            💳 REQUESTING {pay.tierName.toUpperCase()} MEMBERSHIP
                          </p>
                        </div>
                        <span className="text-amber-400 font-black font-mono text-base bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/15">
                          ৳ {pay.price}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono leading-tight">
                        <div className="bg-black/45 p-2.5 rounded-xl border border-white/[0.03]">
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-extrabold pb-0.5">Payment Method:</span>
                          <span className="text-white font-bold">{pay.method}</span>
                        </div>
                        <div className="bg-black/45 p-2.5 rounded-xl border border-white/[0.03]">
                          <span className="text-slate-500 block text-[8px] uppercase tracking-wider font-extrabold pb-0.5">Date Submitted:</span>
                          <span className="text-slate-300 font-bold text-[9px]">{pay.date}</span>
                        </div>
                      </div>

                      <div className="bg-black/40 p-3 rounded-xl border border-amber-550/10 text-[11px] flex justify-between items-center font-mono">
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

                      {pay.screenshot && (
                        <div className="bg-black/40 p-3 rounded-xl border border-blue-550/10 text-[11px] space-y-2">
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">📸 Payment Screenshot (স্ক্রিনশট):</span>
                          <div className="relative group overflow-hidden rounded-lg">
                            <img
                              src={pay.screenshot}
                              alt="Payment proof screenshot"
                              className="max-h-48 w-full object-contain rounded-lg border border-white/5 bg-slate-950"
                              referrerPolicy="no-referrer"
                            />
                            <a
                              href={pay.screenshot}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-blue-400 font-extrabold transition-all rounded-lg cursor-pointer gap-1"
                            >
                              View Full Size Image ↗
                            </a>
                          </div>
                        </div>
                      )}

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
                          Approve Upgrade
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* History area of memberships */}
              <div className="bg-[#11131a] border border-[#1b1e2a] p-4.5 rounded-2xl">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#dbaa61] mb-3">Verified Membership History logs</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {payments.filter(p => p.status !== 'Pending Verification' && p.tierName !== 'Wallet Deposit' && p.tierName !== 'Withdrawal').length === 0 ? (
                    <p className="text-[10px] text-slate-500 font-semibold italic text-center py-4">No verified records yet inside logs</p>
                  ) : (
                    payments.filter(p => p.status !== 'Pending Verification' && p.tierName !== 'Wallet Deposit' && p.tierName !== 'Withdrawal').map(pay => (
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
                      Active Partners Database ({companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined').length})
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
                            ? companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined' && (c.category || 'Female Model') === cat).length
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Select Category * / ৪টি ক্যাটাগরি</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Skin Complexion / গায়ের রঙ</label>
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

                    {/* CORE SERVICE ACTIVATIONS & CUSTOM FEE STRUCTURES */}
                    <div className="sm:col-span-2 p-5 bg-[#030a1c]/65 border border-blue-500/15 rounded-2xl space-y-5">
                      <div>
                        <span className="block text-[11px] font-mono font-black tracking-widest text-[#2ebdff] uppercase">
                          SERVICE CONTROLS & DURATION RATES / সার্ভিস ও কাস্টম রেট নিয়ন্ত্রণ
                        </span>
                        <p className="text-[9px] text-slate-450 font-medium mt-1">
                          Enable/disable specific booking services and configure custom flat fees for exact booking durations. Leave duration override inputs empty to automatically apply standard hourly multipliers.
                        </p>
                      </div>

                      {/* 1. REAL (IN-PERSON) SERVICE CONTROL */}
                      <div className="border border-slate-800/80 rounded-xl p-3 bg-black/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={compIsRealActive}
                              onChange={(e) => setCompIsRealActive(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-500 bg-[#11131a] border-slate-800 focus:ring-blue-500 focus:ring-opacity-25"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-250">Real Service (In-Person Meet)</span>
                          </label>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-wider ${compIsRealActive ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                            {compIsRealActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>

                        {compIsRealActive && (
                          <div className="space-y-3">
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">📍 REAL MEET DURATION RATES (৳ Taka):</span>
                            
                            <div className="space-y-2">
                              {(compCustomRealRates || []).length === 0 ? (
                                <p className="text-[9px] text-slate-500 italic">No custom rates added yet.</p>
                              ) : (
                                (compCustomRealRates || []).map((slot, idx) => (
                                  <div key={slot.id || idx} className="flex gap-2 items-center bg-black/40 border border-slate-800 rounded-lg p-2">
                                    <input
                                      type="text"
                                      value={slot.duration}
                                      onChange={(e) => {
                                        const newList = [...(compCustomRealRates || [])];
                                        newList[idx] = { ...newList[idx], duration: e.target.value };
                                        setCompCustomRealRates(newList);
                                      }}
                                      placeholder="e.g. 1 Hour"
                                      className="flex-1 bg-[#11131a] border border-slate-800 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                                    />
                                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded border border-slate-800">
                                      <span className="text-slate-500 text-[10px]">৳</span>
                                      <input
                                        type="number"
                                        value={slot.rate || ''}
                                        onChange={(e) => {
                                          const newList = [...(compCustomRealRates || [])];
                                          newList[idx] = { ...newList[idx], rate: Number(e.target.value) };
                                          setCompCustomRealRates(newList);
                                        }}
                                        placeholder="0"
                                        className="w-20 bg-[#11131a] border border-slate-800 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none text-right"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newList = (compCustomRealRates || []).filter((_, i) => i !== idx);
                                        setCompCustomRealRates(newList);
                                      }}
                                      className="text-red-500 hover:text-red-400 p-1 text-sm transition active:scale-90"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCompCustomRealRates([...(compCustomRealRates || []), { id: Math.random().toString(), duration: '', rate: 0 }]);
                              }}
                              className="w-full bg-[#11131a] hover:bg-black border border-slate-800 hover:border-blue-500/30 text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              ➕ Add Real Meet Rate Option (+ নতুন রেট যোগ করুন)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 2. CAM SERVICE CONTROL */}
                      <div className="border border-slate-800/80 rounded-xl p-3 bg-black/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-855 pb-2">
                          <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={compIsCamActive}
                              onChange={(e) => setCompIsCamActive(e.target.checked)}
                              className="w-4 h-4 rounded text-cyan-500 bg-[#11131a] border-slate-800 focus:ring-cyan-500 focus:ring-opacity-25"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-250">Cam Service (Virtual Video Call)</span>
                          </label>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-wider ${compIsCamActive ? 'bg-cyan-500/10 text-cyan-450 border border-cyan-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                            {compIsCamActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>

                        {compIsCamActive && (
                          <div className="space-y-3">
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">📍 VIDEO CAM DURATION RATES (৳ Taka):</span>
                            
                            <div className="space-y-2">
                              {(compCustomCamRates || []).length === 0 ? (
                                <p className="text-[9px] text-slate-500 italic">No custom rates added yet.</p>
                              ) : (
                                (compCustomCamRates || []).map((slot, idx) => (
                                  <div key={slot.id || idx} className="flex gap-2 items-center bg-black/40 border border-slate-800 rounded-lg p-2">
                                    <input
                                      type="text"
                                      value={slot.duration}
                                      onChange={(e) => {
                                        const newList = [...(compCustomCamRates || [])];
                                        newList[idx] = { ...newList[idx], duration: e.target.value };
                                        setCompCustomCamRates(newList);
                                      }}
                                      placeholder="e.g. 30 Mins"
                                      className="flex-1 bg-[#11131a] border border-slate-800 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                                    />
                                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded border border-slate-800">
                                      <span className="text-slate-500 text-[10px]">৳</span>
                                      <input
                                        type="number"
                                        value={slot.rate || ''}
                                        onChange={(e) => {
                                          const newList = [...(compCustomCamRates || [])];
                                          newList[idx] = { ...newList[idx], rate: Number(e.target.value) };
                                          setCompCustomCamRates(newList);
                                        }}
                                        placeholder="0"
                                        className="w-20 bg-[#11131a] border border-slate-800 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none text-right"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newList = (compCustomCamRates || []).filter((_, i) => i !== idx);
                                        setCompCustomCamRates(newList);
                                      }}
                                      className="text-red-500 hover:text-red-400 p-1 text-sm transition active:scale-90"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCompCustomCamRates([...(compCustomCamRates || []), { id: Math.random().toString(), duration: '', rate: 0 }]);
                              }}
                              className="w-full bg-[#11131a] hover:bg-black border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              ➕ Add Video Cam Rate Option (+ নতুন রেট যোগ করুন)
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 3. MAKE OUT SERVICE CONTROL */}
                      <div className="border border-slate-800/80 rounded-xl p-3 bg-black/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-855 pb-2">
                          <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={compIsMakeOutActive}
                              onChange={(e) => setCompIsMakeOutActive(e.target.checked)}
                              className="w-4 h-4 rounded text-pink-500 bg-[#11131a] border-slate-800 focus:ring-pink-500 focus:ring-opacity-25"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-250">Make Out Service</span>
                          </label>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-wider ${compIsMakeOutActive ? 'bg-pink-500/10 text-pink-450 border border-pink-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                            {compIsMakeOutActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>

                        {compIsMakeOutActive && (
                          <div className="space-y-2">
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">DURATION PRICE OVERRIDES (৳ Taka):</span>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <label className="block text-[8px] text-slate-500 font-bold">2 Hours Rate</label>
                                <input
                                  type="number"
                                  placeholder="Base x 2"
                                  value={compRateMakeOut_2h}
                                  onChange={(e) => setCompRateMakeOut_2h(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full bg-[#11131a] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-pink-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[8px] text-slate-500 font-bold">3 Hours Rate</label>
                                <input
                                  type="number"
                                  placeholder="Base x 3"
                                  value={compRateMakeOut_3h}
                                  onChange={(e) => setCompRateMakeOut_3h(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full bg-[#11131a] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-pink-500"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[8px] text-slate-500 font-bold">Full Night Rate</label>
                                <input
                                  type="number"
                                  placeholder="Base x 6"
                                  value={compRateMakeOut_fn}
                                  onChange={(e) => setCompRateMakeOut_fn(e.target.value === '' ? '' : Number(e.target.value))}
                                  className="w-full bg-[#11131a] border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-pink-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. LIVE TOGETHER SERVICE CONTROL */}
                      <div className="border border-slate-800/80 rounded-xl p-3 bg-black/40 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-855 pb-2">
                          <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={compIsLiveTogetherActive}
                              onChange={(e) => setCompIsLiveTogetherActive(e.target.checked)}
                              className="w-4 h-4 rounded text-purple-500 bg-[#11131a] border-slate-800 focus:ring-purple-500 focus:ring-opacity-25"
                            />
                            <span className="text-xs font-black uppercase tracking-wider text-slate-250">Live Together (Stayover Companion)</span>
                          </label>
                          <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-wider ${compIsLiveTogetherActive ? 'bg-purple-500/10 text-purple-450 border border-purple-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                            {compIsLiveTogetherActive ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </div>

                        {compIsLiveTogetherActive && (
                          <div className="space-y-3">
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">📍 LIVE TOGETHER DURATION RATES (৳ Taka):</span>
                            
                            <div className="space-y-2">
                              {(compCustomLiveTogetherRates || []).length === 0 ? (
                                <p className="text-[9px] text-slate-500 italic">No custom rates added yet.</p>
                              ) : (
                                (compCustomLiveTogetherRates || []).map((slot, idx) => (
                                  <div key={slot.id || idx} className="flex gap-2 items-center bg-black/40 border border-slate-800 rounded-lg p-2">
                                    <input
                                      type="text"
                                      value={slot.duration}
                                      onChange={(e) => {
                                        const newList = [...(compCustomLiveTogetherRates || [])];
                                        newList[idx] = { ...newList[idx], duration: e.target.value };
                                        setCompCustomLiveTogetherRates(newList);
                                      }}
                                      placeholder="e.g. 2 Days"
                                      className="flex-1 bg-[#11131a] border border-slate-800 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                                    />
                                    <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded border border-slate-800">
                                      <span className="text-slate-550 text-[10px]">৳</span>
                                      <input
                                        type="number"
                                        value={slot.rate || ''}
                                        onChange={(e) => {
                                          const newList = [...(compCustomLiveTogetherRates || [])];
                                          newList[idx] = { ...newList[idx], rate: Number(e.target.value) };
                                          setCompCustomLiveTogetherRates(newList);
                                        }}
                                        placeholder="0"
                                        className="w-20 bg-[#11131a] border border-slate-800 rounded px-2 py-0.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none text-right"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newList = (compCustomLiveTogetherRates || []).filter((_, i) => i !== idx);
                                        setCompCustomLiveTogetherRates(newList);
                                      }}
                                      className="text-red-500 hover:text-red-400 p-1 text-sm transition active:scale-90"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCompCustomLiveTogetherRates([...(compCustomLiveTogetherRates || []), { id: Math.random().toString(), duration: '', rate: 0 }]);
                              }}
                              className="w-full bg-[#11131a] hover:bg-black border border-slate-800 hover:border-purple-500/30 text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-wider py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              ➕ Add Live Together Rate Option (+ নতুন রেট যোগ করুন)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Operational City Area (শহর ও এলাকা)</label>
                      <select
                        value={compCity}
                        onChange={(e) => setCompCity(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-xs font-bold"
                      >
                        <option value="" className="bg-[#11131a] text-white font-sans font-bold">Select Area / এলাকা সিলেক্ট করুন</option>
                        {structuredCities && structuredCities.length > 0 ? (
                          structuredCities.map((p) => (
                            <optgroup key={p.id} label={p.name.toUpperCase()} className="bg-[#11131a] text-[#dbaa61] font-bold font-sans">
                              {p.subAreas.map((sub) => (
                                <option key={`${sub}, ${p.name}`} value={`${sub}, ${p.name}`} className="bg-[#11131a] text-white font-sans font-bold">
                                  {sub.toUpperCase()} ({p.name.toUpperCase()})
                                </option>
                              ))}
                              {p.subAreas.length === 0 && (
                                <option value={p.name} className="bg-[#11131a] text-white font-sans font-bold">{p.name.toUpperCase()}</option>
                              )}
                            </optgroup>
                          ))
                        ) : (
                          cities.map((city) => (
                            <option key={city} value={city} className="bg-[#11131a] text-white font-sans font-bold">
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
                                compressImage(file, 800, 800, 0.75).then((compressedUrl) => {
                                  if (compressedUrl) {
                                    setCompImage(compressedUrl);
                                  }
                                });
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

                      {/* ADDITIONAL PORTFOLIO PHOTOS (UP TO 4) */}
                      <div className="pt-4 border-t border-slate-800/60 mt-3 space-y-2">
                        <span className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Additional Gallery Portfolio Photos / অতিরিক্ত ছবি গ্যালারি (সর্বোচ্চ ৪টি)
                        </span>
                        <p className="text-[9px] text-slate-500 font-medium">
                          These images will show up in the dynamic thumbnail photo gallery on the companion profile page.
                        </p>

                        <div className="grid grid-cols-4 gap-3 pt-1">
                          {[0, 1, 2, 3].map((idx) => {
                            const picUrl = compPictures[idx];
                            return (
                              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-black/50 group flex items-center justify-center">
                                {picUrl ? (
                                  <>
                                    <img src={picUrl} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...compPictures];
                                        updated.splice(idx, 1);
                                        setCompPictures(updated);
                                      }}
                                      className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 rounded-full p-1 cursor-pointer text-white shadow-md transition-all scale-90"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-blue-600/5 transition">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          compressImage(file, 800, 800, 0.75).then((compressedUrl) => {
                                            if (compressedUrl) {
                                              const updated = [...compPictures];
                                              updated[idx] = compressedUrl;
                                              setCompPictures(updated);
                                            }
                                          });
                                        }
                                      }}
                                      className="hidden"
                                    />
                                    <ImageIcon className="w-4 h-4 text-slate-650 group-hover:text-blue-500 mb-0.5" />
                                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Slot {idx + 1}</span>
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* URL Manual input for multi-pics */}
                        <div className="space-y-1 pt-1">
                          <label className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Or paste additional URLs manually (comma separated)</label>
                          <input
                            type="text"
                            value={compPictures.join(', ')}
                            onChange={(e) => {
                              const urls = e.target.value.split(',').map(u => u.trim()).filter(Boolean);
                              setCompPictures(urls);
                            }}
                            placeholder="e.g. https://url1.com, https://url2.com"
                            className="w-full bg-[#11131a] border border-slate-800 rounded-lg px-3 py-1 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-blue-500"
                          />
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
                  {companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined' && (c.category || 'Female Model') === partnerCategoryFilter).length === 0 ? (
                    <div className="py-14 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] bg-[#11131a]/40 border border-dashed border-slate-800 rounded-3xl select-none w-full">
                      📭 No active {partnerCategoryFilter.toLowerCase()} partners registered in database yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-none">
                      {companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined' && (c.category || 'Female Model') === partnerCategoryFilter).map((comp) => (
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

                        {/* Service configuration section for Admin verification */}
                        {(comp.category || 'Female Model') === 'Female Model' && (
                          <div className="bg-[#181a25]/60 border border-blue-900/25 p-3.5 rounded-xl space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#dbaa61] block font-mono">
                              ⚙️ CONFIGURE APPROVED SERVICES & HOURLY RATES (৳)
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Real Service Rate (৳)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 8000"
                                  value={candidateRates[comp.id]?.rateReal || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || undefined;
                                    setCandidateRates(prev => ({
                                      ...prev,
                                      [comp.id]: { ...prev[comp.id], rateReal: val }
                                    }));
                                  }}
                                  className="w-full bg-[#030303] border border-slate-800 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#dbaa61]"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Face Cam Rate (৳)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 3000"
                                  value={candidateRates[comp.id]?.rateCam || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || undefined;
                                    setCandidateRates(prev => ({
                                      ...prev,
                                      [comp.id]: { ...prev[comp.id], rateCam: val }
                                    }));
                                  }}
                                  className="w-full bg-[#030303] border border-slate-800 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#dbaa61]"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Make Out Rate (৳)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 5000"
                                  value={candidateRates[comp.id]?.rateMakeOut || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || undefined;
                                    setCandidateRates(prev => ({
                                      ...prev,
                                      [comp.id]: { ...prev[comp.id], rateMakeOut: val }
                                    }));
                                  }}
                                  className="w-full bg-[#030303] border border-slate-800 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#dbaa61]"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Live Together (৳/day)</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 15000"
                                  value={candidateRates[comp.id]?.rateLiveTogether || ''}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || undefined;
                                    setCandidateRates(prev => ({
                                      ...prev,
                                      [comp.id]: { ...prev[comp.id], rateLiveTogether: val }
                                    }));
                                  }}
                                  className="w-full bg-[#030303] border border-slate-800 rounded px-2.5 py-1.5 font-bold text-white focus:outline-none focus:border-[#dbaa61]"
                                />
                              </div>
                            </div>
                            <p className="text-[8.5px] text-slate-400 font-medium font-sans leading-tight">
                              * Leave blank if the service is not allowed. On approval, the checked rates will determine active services for this companion.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2.5 pt-1 border-t border-white/5 pt-3">
                          <button
                            onClick={() => onDeclineCompanion && onDeclineCompanion(comp.id)}
                            className="flex-1 bg-rose-955/30 hover:bg-rose-950/80 border border-rose-500/15 hover:border-rose-500/40 text-rose-400 text-[10.5px] font-black uppercase tracking-wider py-3 rounded-xl transition cursor-pointer"
                          >
                            Decline Application
                          </button>
                          <button
                            onClick={() => onApproveCompanion && onApproveCompanion(comp.id, candidateRates[comp.id])}
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
                            // Auto generate title from filename if not yet filled
                            if (!newMediaTitle.trim()) {
                              const cleanName = file.name.split('.')[0].replace(/[-_]/g, ' ');
                              setNewMediaTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
                            }
                            // Compress
                            compressImage(file, 1000, 1000, 0.75).then((compressedUrl) => {
                              if (compressedUrl) {
                                setNewMediaUrl(compressedUrl);
                              }
                            });
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
                  বডি টাচ মেম্বারদের এঙ্কোয়ারি রিকোয়েস্ট ও বুকিং লিস্ট। পার্টনারদের বুকিং <strong className="text-emerald-400"> Approve & Send Mail </strong> ক্লিক করে কনফার্ম করুন। এতে করে ক্রেতার ইমেল বক্সে সম্পূর্ণ ভাউচার কোড মেইল আকারে স্বয়ংক্রিয়ভাবে প্রেরিত হয়ে যাবে।
                </p>

                {/* Sub-tabs to separate orders according to tier */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-950/75 border border-[#161a24] rounded-2xl">
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

                          {/* Client & Model Connection Hub */}
                          {(() => {
                            const modelComp = companions?.find(c => 
                              c.name?.toLowerCase() === book.modelName?.toLowerCase() || 
                              c.tag?.toLowerCase() === book.modelTag?.toLowerCase()
                            );

                            const modelPhone = modelComp?.phone || '';
                            const modelTelegram = modelComp?.telegram || '';

                            // Build the details message to share with model
                            const shareMessage = `🔔 *নতুন সার্ভিস বুকিং ডিটেইলস!*
━━━━━━━━━━━━━━━━━━
👩🏼 *মডেল:* ${book.modelName} (${book.modelTag})
👤 *ক্লায়েন্ট নাম:* ${book.clientName || 'Anonymous User'}
📞 *ক্লায়েন্ট ফোন:* ${book.clientPhone || 'Not Provided'}
📅 *তারিখ:* ${book.date}
⏰ *সময়:* ${book.time} (${book.duration})
📍 *ঠিকানা/লোকেশন:* ${book.location}
🗺️ *গুগল ম্যাপস লিঙ্ক:* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(book.location)}
📝 *বিশেষ নির্দেশনা:* ${book.notes || 'N/A'}
━━━━━━━━━━━━━━━━━━
Body Touch Premium Network`;

                            const formatWA = (num: string) => {
                              let cleaned = num.replace(/[^\d]/g, '');
                              if (cleaned.startsWith('0') && cleaned.length === 11) {
                                cleaned = '880' + cleaned.substring(1);
                              }
                              return cleaned;
                            };

                            const handleCopyMessage = () => {
                              navigator.clipboard.writeText(shareMessage);
                              setCopiedBookingId(book.id);
                              setTimeout(() => setCopiedBookingId(null), 2500);
                            };

                            const waLink = modelPhone 
                              ? `https://wa.me/${formatWA(modelPhone)}?text=${encodeURIComponent(shareMessage)}`
                              : null;

                            const tgLink = modelTelegram 
                              ? `https://t.me/${modelTelegram.replace('@', '')}`
                              : null;

                            return (
                              <div className="bg-[#090b11] border border-blue-900/20 p-3.5 rounded-2xl space-y-3 font-sans text-xs">
                                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/5 pb-1.5 flex justify-between items-center">
                                  <span>📞 Coordination Hub (ক্লায়েন্ট ও মডেল যোগাযোগ)</span>
                                  <span className="text-[9px] text-blue-400 lowercase font-mono">Live Sync Matcher</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  {/* Client Details Column */}
                                  <div className="space-y-1.5">
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Client Details (ক্লায়েন্ট তথ্য)</h6>
                                    <div className="space-y-1 text-[11px] text-slate-300">
                                      <p className="flex justify-between">
                                        <span className="text-slate-500">Name:</span>
                                        <span className="font-bold text-white select-all">{book.clientName || 'Anonymous Client'}</span>
                                      </p>
                                      <p className="flex justify-between">
                                        <span className="text-slate-500">Phone:</span>
                                        <a href={`tel:${book.clientPhone}`} className="font-mono text-[#ceff00] font-bold hover:underline select-all">{book.clientPhone || 'Not Provided'}</a>
                                      </p>
                                      <p className="flex justify-between">
                                        <span className="text-slate-500">Email:</span>
                                        <span className="font-mono text-slate-400 select-all text-[10px]">{book.clientEmail || 'Not Provided'}</span>
                                      </p>
                                      <div className="flex items-start justify-between gap-1">
                                        <span className="text-slate-500 shrink-0">Address:</span>
                                        <span className="text-slate-300 font-bold text-right line-clamp-2 select-all flex items-center gap-1">
                                          {book.location}
                                          <a 
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(book.location)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            title="View address on Google Maps"
                                            className="text-blue-400 hover:text-blue-300 inline-block p-0.5"
                                          >
                                            <MapPin className="w-3.5 h-3.5" />
                                          </a>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Model Details Column */}
                                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-800/80 md:pt-0 md:pl-3.5 pt-2">
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-[#ceff00]">Model Full Details (মডেল তথ্য)</h6>
                                    {modelComp ? (
                                      <div className="space-y-1 text-[11px] text-slate-300">
                                        <p className="flex justify-between">
                                          <span className="text-slate-500">Real Name:</span>
                                          <span className="font-bold text-white select-all">{modelComp.name}</span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-500">Phone (WhatsApp):</span>
                                          <span className="font-mono font-bold select-all text-[#ceff00]">
                                            {modelComp.phone || 'N/A'}{modelComp.whatsapp ? ` (WA: ${modelComp.whatsapp})` : ''}
                                          </span>
                                        </p>
                                        <p className="flex justify-between">
                                          <span className="text-slate-500">Telegram (Email):</span>
                                          <span className="font-mono text-blue-400 select-all font-bold">
                                            {modelComp.telegram || 'N/A'}{modelComp.email ? ` | ${modelComp.email}` : ''}
                                          </span>
                                        </p>
                                        <p className="flex justify-between text-[10px] text-slate-400">
                                          <span>Age: <strong className="text-slate-200">{modelComp.age}</strong></span>
                                          <span>Height: <strong className="text-slate-200">{modelComp.height}</strong></span>
                                          <span>Weight: <strong className="text-slate-200">{modelComp.weight || 'N/A'}</strong></span>
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="py-2.5 px-3 rounded-lg bg-red-500/5 border border-red-500/10 text-[10px] text-rose-400 leading-normal italic">
                                        ⚠️ প্রোফাইল ডাটাবেজে পাওয়া যায়নি! সম্ভবত নাম পরিবর্তন হয়েছে।
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Send Click Actions */}
                                <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={handleCopyMessage}
                                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-white font-black text-[9.5px] uppercase tracking-wider transition flex items-center gap-1 cursor-pointer select-none"
                                  >
                                    {copiedBookingId === book.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        Copied! (কপি হয়েছে)
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        Copy Details (ডিটেইলস কপি)
                                      </>
                                    )}
                                  </button>

                                  {modelPhone && (
                                    <a
                                      href={waLink || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 font-black text-[9.5px] uppercase tracking-wider transition flex items-center gap-1 cursor-pointer select-none"
                                    >
                                      <Phone className="w-3.5 h-3.5" />
                                      WhatsApp (হোয়াটসঅ্যাপে পাঠান)
                                    </a>
                                  )}

                                  {modelTelegram && (
                                    <a
                                      href={tgLink || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        // Auto-copy details before opening telegram as standard convenience
                                        navigator.clipboard.writeText(shareMessage);
                                      }}
                                      className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 border border-blue-500/20 text-blue-400 font-black text-[9.5px] uppercase tracking-wider transition flex items-center gap-1 cursor-pointer select-none"
                                      title="Clicking will copy details and open Telegram"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      Telegram (টেলিগ্রামে পাঠান)
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {book.deficitPay && (
                            <div className="bg-[#0b0d19]/80 border border-amber-500/15 p-3 rounded-xl flex flex-col gap-2 font-sans text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-[#facc15] text-[8.5px] font-black uppercase tracking-widest font-mono flex items-center gap-1">
                                  💸 DEFICIT PAYMENT RECEIVED / ঘাটতি পেমেন্ট
                                </span>
                                <span className="text-amber-400 font-extrabold text-[10.5px]">৳{book.deficitPay.amount}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                                  <span className="text-slate-500 block text-[7.5px] uppercase">Gateway</span>
                                  <span className="text-slate-300 font-extrabold">{book.deficitPay.method}</span>
                                </div>
                                <div className="bg-slate-950/50 p-2 rounded border border-white/5">
                                  <span className="text-slate-500 block text-[7.5px] uppercase">Transaction ID</span>
                                  <span className="text-emerald-400 font-extrabold select-all">{book.deficitPay.trxId}</span>
                                </div>
                              </div>
                              {book.deficitPay.screenshot && (
                                <div className="space-y-1 mt-1">
                                  <span className="text-slate-500 text-[7.5px] uppercase font-mono block">Remaining Pay Screenshot:</span>
                                  <div className="relative group overflow-hidden rounded-lg max-h-40 w-full bg-black border border-white/5">
                                    <img
                                      src={book.deficitPay.screenshot}
                                      alt="Deficit Payment Screenshot"
                                      className="w-full h-28 object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                    <a
                                      href={book.deficitPay.screenshot}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8.5px] text-amber-400 font-black tracking-wider transition"
                                    >
                                      OPEN FULL PROOF IMAGE ↗
                                    </a>
                                  </div>
                                </div>
                              )}
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Prestige stars rating / স্টার রেটিং</label>
                      <select
                        value={locStar}
                        onChange={(e) => setLocStar(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs font-bold cursor-pointer"
                      >
                        <option value="5 STAR">👑 5 STAR PRESTIGE ROYAL</option>
                        <option value="4 STAR">⭐ 4 STAR PREMIUM CLASS</option>
                        <option value="3 STAR">⭐ 3 STAR EXECUTIVE LUXURY</option>
                        <option value="2 STAR">⭐ 2 STAR COMFORT SANCTUARY</option>
                        <option value="1 STAR">⭐ 1 STAR STANDARD BUDGET</option>
                        <option value="BOUTIQUE">🏢 PRIVATE BOUTIQUE SANCTUARY</option>
                        <option value="SAFE HOUSE">🔒 HIGH-SECURITY SAFE HOUSE</option>
                        <option value="5 STAR SAFE HOUSE">👑 🔒 5 STAR SECURE SAFE HOUSE</option>
                      </select>
                    </div>

                    {/* City Location */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Metropolis District area / এলাকা বা বিভাগ</label>
                      <select
                        value={locCity}
                        onChange={(e) => setLocCity(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-xs font-bold"
                      >
                        <option value="" className="bg-[#11131a] text-white font-sans font-bold">Select Area / এলাকা সিলেক্ট করুন</option>
                        {structuredCities && structuredCities.length > 0 ? (
                          structuredCities.map((p) => (
                            <optgroup key={p.id} label={p.name.toUpperCase()} className="bg-[#11131a] text-[#dbaa61] font-bold font-sans">
                              {p.subAreas.map((sub) => (
                                <option key={`${sub}, ${p.name}`} value={`${sub}, ${p.name}`} className="bg-[#11131a] text-white font-sans font-bold">
                                  {sub.toUpperCase()} ({p.name.toUpperCase()})
                                </option>
                              ))}
                              {p.subAreas.length === 0 && (
                                <option value={p.name} className="bg-[#11131a] text-white font-sans font-bold">{p.name.toUpperCase()}</option>
                              )}
                            </optgroup>
                          ))
                        ) : (
                          cities.map((city) => (
                            <option key={city} value={city} className="bg-[#11131a] text-white font-sans font-bold">
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
                      <label className="block text-[10px] font-black tracking-widest text-[#2271b1] uppercase">Sanctuary Description & Privacy Guidelines / হোটেলের বিস্তারিত বিবরণ ও গোপনীয়তা নিয়মাবলী *</label>
                      <textarea
                        rows={4}
                        required
                        value={locDesc}
                        onChange={(e) => setLocDesc(e.target.value)}
                        placeholder="হোটেলের বিবরণ, সুযোগ সুবিধা এবং গোপনীয়তা সম্পর্কিত বিস্তারিত লিখুন। যেমন: Private elevator, 100% blind safety setups, elite room amenities..."
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-550 focus:outline-none focus:border-blue-500 font-medium text-xs leading-relaxed"
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

                    <div className="sm:col-span-2 border-t border-slate-850 pt-4 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">🚨 Hotel Fine Specifications (জরুরী বিস্তারিত তথ্য)</span>
                    </div>

                    {/* Distance */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Distance string (দুরত্ব, e.g. 17.1 km from city center)</label>
                      <input
                        type="text"
                        value={locDistance}
                        onChange={(e) => setLocDistance(e.target.value)}
                        placeholder="e.g. 17.1 km from city center"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Street Address (পূর্ণ ঠিকানা)</label>
                      <input
                        type="text"
                        value={locAddress}
                        onChange={(e) => setLocAddress(e.target.value)}
                        placeholder="e.g. House # 2/A, Sector #04, Uttara, Dhaka-1230"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Check in & Check out */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-in Policy Time (চেক-ইন সময়)</label>
                      <input
                        type="text"
                        value={locCheckInTime}
                        onChange={(e) => setLocCheckInTime(e.target.value)}
                        placeholder="e.g. 02:00 PM"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-out Policy Time (চেক-আউট সময়)</label>
                      <input
                        type="text"
                        value={locCheckOutTime}
                        onChange={(e) => setLocCheckOutTime(e.target.value)}
                        placeholder="e.g. 11:00 AM"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Highlighted Facilities */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Highlighted Facilities (কমা দিয়ে লিখুন - Comma separated)</label>
                      <input
                        type="text"
                        value={locHighlightedFacilities}
                        onChange={(e) => setLocHighlightedFacilities(e.target.value)}
                        placeholder="Air conditioning, Elevator, Smoke-free property, 24-hour reception, free internet"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 text-xs"
                      />
                    </div>

                    {/* Room Type 1 Title Header */}
                    <div className="sm:col-span-2 border-t border-slate-850 pt-4 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">🛏️ Room Option 1 Details (রুম অপশন ১ বিস্তারিত বিবরণ)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name (নাম)</label>
                      <input
                        type="text"
                        value={locRoom1Name}
                        onChange={(e) => setLocRoom1Name(e.target.value)}
                        placeholder="e.g. Premium Deluxe Twin"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type (বেড টাইপ)</label>
                      <input
                        type="text"
                        value={locRoom1BedType}
                        onChange={(e) => setLocRoom1BedType(e.target.value)}
                        placeholder="e.g. TWIN x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity (ধারণক্ষমতা)</label>
                      <input
                        type="text"
                        value={locRoom1Capacity}
                        onChange={(e) => setLocRoom1Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type (ভিও টাইপ)</label>
                      <input
                        type="text"
                        value={locRoom1ViewType}
                        onChange={(e) => setLocRoom1ViewType(e.target.value)}
                        placeholder="e.g. no-view / City View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area (রুমের সাইজ)</label>
                      <input
                        type="text"
                        value={locRoom1Area}
                        onChange={(e) => setLocRoom1Area(e.target.value)}
                        placeholder="e.g. 18 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room (ভাড়া)</label>
                      <input
                        type="number"
                        value={locRoom1Price}
                        onChange={(e) => setLocRoom1Price(e.target.value)}
                        placeholder="e.g. 2311"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (সুবিধাসমূহ, e.g. Breakfast Included, Non-Smoking room)</label>
                      <input
                        type="text"
                        value={locRoom1Facilities}
                        onChange={(e) => setLocRoom1Facilities(e.target.value)}
                        placeholder="Breakfast Included, Non-Smoking room, Free cancellation"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    {/* Room Type 2 Title Header */}
                    <div className="sm:col-span-2 border-t border-slate-850 pt-4 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">🛏️ Room Option 2 Details (রুম অপশন ২ বিস্তারিত বিবরণ)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name (নাম)</label>
                      <input
                        type="text"
                        value={locRoom2Name}
                        onChange={(e) => setLocRoom2Name(e.target.value)}
                        placeholder="e.g. Executive Suite"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type (বেড টাইপ)</label>
                      <input
                        type="text"
                        value={locRoom2BedType}
                        onChange={(e) => setLocRoom2BedType(e.target.value)}
                        placeholder="e.g. KING x 1"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity (ধারণক্ষমতা)</label>
                      <input
                        type="text"
                        value={locRoom2Capacity}
                        onChange={(e) => setLocRoom2Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type (ভিও টাইপ)</label>
                      <input
                        type="text"
                        value={locRoom2ViewType}
                        onChange={(e) => setLocRoom2ViewType(e.target.value)}
                        placeholder="e.g. no-view / Skyline View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area (রুমের সাইজ)</label>
                      <input
                        type="text"
                        value={locRoom2Area}
                        onChange={(e) => setLocRoom2Area(e.target.value)}
                        placeholder="e.g. 25 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room (ভাড়া)</label>
                      <input
                        type="number"
                        value={locRoom2Price}
                        onChange={(e) => setLocRoom2Price(e.target.value)}
                        placeholder="e.g. 4500"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                       <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (সুবিধাসমূহ, e.g. Breakfast Included, Non-Smoking room)</label>
                       <input
                         type="text"
                         value={locRoom2Facilities}
                         onChange={(e) => setLocRoom2Facilities(e.target.value)}
                         placeholder="Breakfast Included, Non-Smoking room, Free cancellation"
                         className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                       />
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
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-white text-xs">{loc.name}</span>
                          <span className="text-[8px] bg-amber-500/15 text-amber-400 font-mono font-black tracking-normal px-1.5 py-0.5 rounded uppercase shrink-0">
                            {loc.star}
                          </span>
                        </div>
                        <p className="text-[9px] text-blue-400 font-mono tracking-normal uppercase mt-0.5">
                          {loc.location}
                        </p>
                        {loc.description && (
                          <div className="mt-1.5 bg-slate-950/40 border border-white/5 rounded-lg p-2">
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium line-clamp-3 italic">
                              "{loc.description}"
                            </p>
                          </div>
                        )}
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
                              compressImage(file, 500, 500, 0.85).then((compressedUrl) => {
                                if (compressedUrl) {
                                  setTempLogo(compressedUrl);
                                  // reset adjustments on new image load
                                  setLogoZoom(100);
                                  setLogoX(0);
                                  setLogoY(0);
                                  setLogoRotate(0);
                                }
                              });
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

              {/* Telegram Notification Bot Card */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-indigo-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-indigo-400 flex items-center gap-2">
                    <Server className="w-4 h-4 animate-pulse" />
                    Telegram Notification Engine & Helpline (টেলিগ্রাম নোটিফিকেশন ও হেল্পলাইন)
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Configure your primary Telegram Bot credentials, Admin Group Chat ID, and the support Helpline handle below. In case of lost/damaged accounts, you can instantly add/save or remove credentials to keep system notification channels secure and completely organized. (OTP Verification is completely handled by the Email SMS Gateway).
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
                      if (onSaveTelegramSettings) {
                        onSaveTelegramSettings();
                      } else {
                        alert("✅ Telegram Credentials & Support Helpline configurations have been securely added and updated in system databases!");
                      }
                    }}
                    className="bg-indigo-600 hover:bg-indigo-550 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 active:scale-98"
                  >
                    <UserCheck className="w-4 h-4 text-white" />
                    Save & Turn On Bot
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onClearTelegramSettings) {
                        onClearTelegramSettings();
                      } else {
                        onSetTelegramBotToken('');
                        onSetTelegramGroupId('');
                        if (onSetTelegramHelpline) onSetTelegramHelpline('');
                        alert("⚠️ Disconnected: All Telegram Bot tokens, Chat IDs, and active helpline links have been completely removed and deleted from system memory!");
                      }
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
                </div>
              </div>

              {/* SMTP Email SMS Gateway Settings */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-teal-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-teal-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 animate-pulse" />
                    SMTP / Email SMS Gateway Settings (এসএমএস ও ইমেইল ভেরিফিকেশন গেটওয়ে)
                  </h4>
                  {smtpSaveSuccess && (
                    <motion.span
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Saved & Synced!
                    </motion.span>
                  )}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Configure your primary SMTP Server credentials to send secure verification OTP emails (SMS equivalents) to users during login and registration. Verification is locked to <strong className="text-teal-400">MUST (বাধ্যতামূলক)</strong> for absolute portal security.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      SMTP Host (ইমেইল হোস্ট)
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="e.g. smtp.gmail.com"
                      className="w-full bg-black/40 border border-[#232733] focus:border-teal-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      SMTP Port (ইমেইল পোর্ট)
                    </label>
                    <input
                      type="text"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="e.g. 587"
                      className="w-full bg-black/40 border border-[#232733] focus:border-teal-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      Sender Name (প্রেরকের নাম)
                    </label>
                    <input
                      type="text"
                      value={smtpFromEmail}
                      onChange={(e) => setSmtpFromEmail(e.target.value)}
                      placeholder="e.g. BODY TOUCH Security"
                      className="w-full bg-black/40 border border-[#232733] focus:border-teal-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono text-cyan-400">
                      <Lock className="w-3.5 h-3.5 text-cyan-500" />
                      SMTP User Email (ইউজার ইমেইল)
                    </label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="e.g. yoursecuregmail@gmail.com"
                      className="w-full bg-black/40 border border-[#232733] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono text-cyan-400">
                      <Lock className="w-3.5 h-3.5 text-cyan-500" />
                      SMTP App Password (সিকিউর পাসওয়ার্ড)
                    </label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="e.g. abcd efgh ijkl mnop"
                      className="w-full bg-black/40 border border-[#232733] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                {/* DUAL SMTP SEPARATE OPTION */}
                <div className="p-4 bg-teal-950/20 border border-teal-500/25 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      id="useSeparateOtpSmtp"
                      type="checkbox"
                      checked={useSeparateOtpSmtp}
                      onChange={(e) => setUseSeparateOtpSmtp(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 bg-black/40 border-slate-700 cursor-pointer"
                    />
                    <label htmlFor="useSeparateOtpSmtp" className="text-xs font-black uppercase text-slate-200 tracking-wider cursor-pointer select-none">
                      ভেরিফিকেশনের (OTP) জন্য আলাদা জিমেইল ব্যবহার করুন (Use Separate Gmail for OTP codes)
                    </label>
                  </div>

                  {useSeparateOtpSmtp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-3 border-t border-dashed border-teal-500/20"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 font-mono">
                          Verification OTP Specific Gateway (ভেরিফিকেশন ওটিপি পাঠানোর গেটওয়ে)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                            OTP SMTP Host (হোস্ট)
                          </label>
                          <input
                            type="text"
                            value={smtpOtpHost}
                            onChange={(e) => setSmtpOtpHost(e.target.value)}
                            placeholder="e.g. smtp.gmail.com"
                            className="w-full bg-black/40 border border-[#232733] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                            OTP SMTP Port (পোর্ট)
                          </label>
                          <input
                            type="text"
                            value={smtpOtpPort}
                            onChange={(e) => setSmtpOtpPort(e.target.value)}
                            placeholder="e.g. 587"
                            className="w-full bg-black/40 border border-[#232733] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                            OTP Sender Name (প্রেরকের নাম)
                          </label>
                          <input
                            type="text"
                            value={smtpOtpFromEmail}
                            onChange={(e) => setSmtpOtpFromEmail(e.target.value)}
                            placeholder="e.g. BODY TOUCH Otp Center"
                            className="w-full bg-black/40 border border-[#232733] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono text-cyan-400">
                            <Lock className="w-3.5 h-3.5 text-cyan-500" />
                            OTP SMTP User Email (ভেরিফিকেশন জিমেইল)
                          </label>
                          <input
                            type="email"
                            value={smtpOtpUser}
                            onChange={(e) => setSmtpOtpUser(e.target.value)}
                            placeholder="e.g. verification@gmail.com"
                            className="w-full bg-black/40 border border-[#232733] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono text-cyan-400">
                            <Lock className="w-3.5 h-3.5 text-cyan-500" />
                            OTP App Password (অ্যাপ পাসওয়ার্ড)
                          </label>
                          <input
                            type="password"
                            value={smtpOtpPass}
                            onChange={(e) => setSmtpOtpPass(e.target.value)}
                            placeholder="e.g. xxxx yyyy zzzz wwww"
                            className="w-full bg-black/40 border border-[#232733] focus:border-cyan-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-4 bg-[#0b1022] border border-[#1b254b]/60 rounded-2xl p-4.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Login & Registration Email Verifications: <b>ENFORCED / MUST (বাধ্যতামূলক সক্রিয়)</b></span>
                  </div>
                </div>

                {smtpSaveError && (
                  <div className="text-xs text-rose-450 font-semibold bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
                    ⚠️ {smtpSaveError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSmtpSettings}
                    className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                  >
                    <Save className="w-4 h-4 text-white" />
                    Save SMTP Configuration (গেটওয়ে সেভ করুন)
                  </button>
                </div>

                <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                  <p>
                    ⚠️ <b>জিমেইল (Gmail) এসএমএস ওটিপি গেটওয়ে নির্দেশাবলী:</b>
                  </p>
                  <p>
                    ১. আপনার জিমেইল অ্যাকাউন্টে প্রবেশ করে <b>2-Step Verification</b> চালু করুন।
                  </p>
                  <p>
                    ২. 2-Step Verification পেজের নিচের অংশে <b>App Passwords</b> এ গিয়ে একটি নতুন অ্যাপ পাসওয়ার্ড জেনারেট করুন।
                  </p>
                  <p>
                    ৩. সেখান থেকে প্রাপ্ত ১৬ অক্ষরের সিকিউর কোডটি উপরে <b>SMTP App Password</b> এর ঘরে বসিয়ে দিয়ে সেভ করুন।
                  </p>
                </div>
              </div>

              {/* Google Sheets Integration Settings */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-blue-500/10 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Google Sheets Integration (গুগল শীট ইন্টিগ্রেশন)
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Synchronize client database profiles with real-time Google Sheets ledger spreadsheet.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      Google Sheets Web Publish Link / Embed URL (গুগল শীট পাবলিশ লিঙ্ক)
                    </label>
                    <input
                      type="text"
                      value={smtpGoogleSheetUrl}
                      onChange={(e) => setSmtpGoogleSheetUrl(e.target.value)}
                      placeholder="e.g. https://docs.google.com/spreadsheets/d/e/.../pubhtml"
                      className="w-full bg-black/40 border border-[#232733] focus:border-emerald-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSaveGoogleSheetUrl) {
                          onSaveGoogleSheetUrl(smtpGoogleSheetUrl);
                          alert("✅ Google Sheets synchronization URL successfully updated and saved in system database!");
                        } else {
                          alert("⚠️ Google Sheets save handler is not available.");
                        }
                      }}
                      className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                    >
                      <Save className="w-4 h-4 text-white" />
                      Save Google Sheet Link (শীট লিঙ্ক সেভ করুন)
                    </button>
                  </div>

                  <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                    <p>
                      📊 <b>গুগল শীট সেটআপ নির্দেশাবলী:</b>
                    </p>
                    <p>
                      ১. আপনার গুগল স্প্রেডশীটে (Google Sheet) গিয়ে ডানপাশের কোণায় <b>Share</b> এ ক্লিক করুন।
                    </p>
                    <p>
                      ২. <b>File &gt; Share &gt; Publish to web</b> এ ক্লিক করে পুরো ডকুমেন্টটি "Web Page" হিসেবে পাবলিশ (Publish) করুন।
                    </p>
                    <p>
                      ৩. পাবলিশ করার পর যে লিঙ্কটি পাবেন, সেটি কপি করে উপরের ঘরে বসিয়ে <b>Save Google Sheet Link</b> বাটনে ক্লিক করুন।
                    </p>
                  </div>
                </div>
              </div>


              {/* SMTP Email Queue Logs Panel */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-blue-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-2 font-mono">
                    <Mail className="w-4 h-4 text-blue-500" />
                    SMTP Live Email Queue Logs (সিস্টেম ইমেইল লগ)
                  </h4>
                  {emailLogs.length > 0 && (
                    <button
                      onClick={onClearEmailLogs}
                      className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-550/20 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      Clear Logs (মুছে ফেলুন)
                    </button>
                  )}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  The system dispatches live emails for user verification (OTP), booking alerts, membership billing, and wallet updates. You can audit all outgoing notifications and delivery states here in real-time.
                </p>

                {emailLogs.length === 0 ? (
                  <div className="text-center py-8 bg-black/20 rounded-xl border border-dashed border-slate-800">
                    <p className="text-slate-500 text-xs font-mono">No email queue dispatches recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {emailLogs.map((log) => (
                      <div key={log.id} className="p-3.5 bg-black/30 rounded-xl border border-[#232733] hover:border-slate-800 transition-all duration-250 text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-200">{log.to}</span>
                              <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border ${
                                log.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                log.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                                'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {log.status === 'Delivered' ? '🟢 DELIVERED' : log.status === 'Pending' ? '⏳ PENDING' : '🔴 FAILED'}
                              </span>
                            </div>
                            <p className="text-slate-400 font-medium text-[11px]">{log.subject}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0">
                            {new Date(log.sentAt).toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })}
                          </span>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-lg text-[11px] text-slate-400 leading-relaxed font-mono whitespace-pre-wrap max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 select-all border border-slate-900">
                          {log.body}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* Emergency Booking Notice & Slider Text Control Panel */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-rose-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-rose-450 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 animate-bounce text-rose-550" />
                    Emergency Notice & Slider Text Control (জরুরী নোটিশ ও স্লাইডার লেখা নিয়ন্ত্রণ)
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  হোমপেজের স্ক্রলিং নোটিশ বার এবং ছবি স্লাইডারের জরুরি নোটিশের লেখাটি এখান থেকে পরিবর্তন করতে পারেন। কাস্টমারদের স্ক্রিনে এটি রিয়েল-টাইমে আপডেট হয়ে যাবে।
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                    🚨 Notice Text Content (জরুরী নোটিশ এর লেখা)
                  </label>
                  <textarea
                    rows={2}
                    value={editableNotice}
                    onChange={(e) => setEditableNotice(e.target.value)}
                    placeholder="সার্ভিসের ন্যূনতম ১ ঘণ্টা পূর্বে বুকিং দিবেন। সাপোর্টে কথা না বলে ক্যাম সার্ভিস বুকিং দিবেন না"
                    className="w-full bg-black/40 border border-[#232733] focus:border-rose-500 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none placeholder-slate-700 leading-relaxed"
                  />
                </div>

                <div className="bg-[#18080c] border border-rose-550/15 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 font-mono block mb-1">LIVE PREVIEW ON CLIENT INTERFACE:</span>
                  <div className="text-[11.5px] font-bold text-rose-250 leading-relaxed font-sans select-none">
                    📢 {editableNotice || 'সার্ভিসের ন্যূনতম ১ ঘণ্টা পূর্বে বুকিং দিবেন। সাপোর্টে কথা না বলে ক্যাম সার্ভিস বুকিং দিবেন না'}
                  </div>
                </div>

              </div>

              {/* HIGH-FIDELITY DYNAMIC HERO CAROUSEL GRAPHIC MANAGER */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-amber-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    Manage Hero Slides & Graphics (হিরো স্লাইডার ও ব্যানার ম্যানেজার)
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 py-1 px-2.5 rounded-lg font-black font-mono">
                    ACTIVE: {sliderSlides.length || 3} SLIDES
                  </span>
                </div>
                
                <p className="text-slate-400 text-xs leading-relaxed">
                  আপনার হোমপেজের গোল্ডেন অ্যানিমেটেড স্লাইডারের (Golden Border Slider) ব্যানার, ছবি, বড় টাইটেল এবং সব-টাইটেল এখান থেকে পরিবর্তন করুন। কোনো কাস্টম স্লাইড অ্যাড না থাকলে পূর্বনির্ধারিত ৩টি প্রিমিয়াম স্লাইড স্বয়ংক্রিয়ভাবে দেখাবে।
                </p>

                {sliderStatusMsg && (
                  <div className="p-3 bg-emerald-900/30 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-medium animate-pulse flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sliderStatusMsg}</span>
                  </div>
                )}

                {/* List of currently active slides */}
                <div className="space-y-2.5 pt-1.5">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">
                    📋 Active Banner Slides in Carousel ({sliderSlides.length === 0 ? "Default/পূর্বনির্ধারিত" : "Customized/কাস্টম"})
                  </span>

                  {sliderSlides.length === 0 ? (
                    <div className="p-4 bg-black/40 border border-[#232733] border-dashed rounded-xl text-center text-slate-500 text-xs">
                      বর্তমানে কোনো কাস্টম স্লাইড তৈরি করা নেই। সিস্টেমের ডিফল্ট ৩টি স্লাইডার ইমেজ ও জরুরি নোটিশ দেখাচ্ছে। নিচের ফর্ম থেকে আপনার কাস্টম স্লাইডার যুক্ত করুন।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {sliderSlides.map((slide, index) => (
                        <div 
                          key={slide.id || index}
                          className="flex items-start gap-3 p-3 bg-black/50 border border-[#232733] rounded-xl hover:border-amber-500/20 transition-all group"
                        >
                          {/* Slide Image thumbnail */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-800">
                            <img 
                              src={slide.image} 
                              alt="slide preview" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150';
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded text-white bg-gradient-to-r ${slide.badgeColor || 'from-pink-500 to-rose-600'}`}>
                                {slide.badge}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">#{index + 1}</span>
                            </div>
                            <h5 className="text-[11.5px] font-black text-white truncate">{slide.title}</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{slide.subtitle}</p>
                            
                            {/* Actions bar */}
                            <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-slate-900">
                              <button
                                type="button"
                                onClick={() => handleEditSlideClick(slide)}
                                className="text-[9px] font-black uppercase tracking-wider text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/20 px-2 py-1 rounded border border-cyan-800/20 cursor-pointer"
                              >
                                <Edit className="w-2.5 h-2.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSlide(slide.id)}
                                className="text-[9px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-350 flex items-center gap-1 bg-rose-950/20 px-2 py-1 rounded border border-rose-800/20 cursor-pointer"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div id="slide-form-anchor" className="h-[1px] bg-slate-900 my-1" />

                {/* Form to Add or Edit Slides */}
                <form onSubmit={handleSaveSlide} className="p-4 bg-black/40 border border-[#232733] rounded-xl space-y-3">
                  <span className="block text-[10px] font-black uppercase text-amber-400 tracking-widest font-mono">
                    {isEditingSlide ? "⚙️ Edit Selected Slide Properties (স্লাইড এডিট করুন)" : "➕ Add New Slide/Announcement Graphics (নতুন স্লাইড যোগ করুন)"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Title input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Slide Title Text (স্লাইডের টাইটেল) *</label>
                      <input 
                        type="text"
                        required
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        placeholder="e.g. Premium Escorts & Models / ডল হসপিটাল অফারস"
                        className="w-full bg-black/40 border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none placeholder-slate-700"
                      />
                    </div>

                    {/* Subtitle input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Subtitle Detail Text (বিস্তারিত বা সবটাইটেল)</label>
                      <input 
                        type="text"
                        value={slideSubtitle}
                        onChange={(e) => setSlideSubtitle(e.target.value)}
                        placeholder="e.g. Explore the finest elite model companionship services in Dhaka."
                        className="w-full bg-black/40 border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none placeholder-slate-700"
                      />
                    </div>

                    {/* Badge text input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Label Text (ছোট ব্যানার লেখা)</label>
                      <input 
                        type="text"
                        value={slideBadge}
                        onChange={(e) => setSlideBadge(e.target.value)}
                        placeholder="e.g. FEATURED DISPATCH / HOT DEAL / 100% SECURE"
                        className="w-full bg-black/40 border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none placeholder-slate-700"
                      />
                    </div>

                    {/* Icon picker */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Icon representation (আইকন টাইপ)</label>
                      <select
                        value={slideIconName}
                        onChange={(e) => setSlideIconName(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="star">★ Golden Star (সোনালী তারা)</option>
                        <option value="bell">🔔 Warning/Info Bell (ঘণ্টা - এনিমেশন)</option>
                        <option value="shield">🛡️ Secure Shield (সিকিউরিটি শিল্ড)</option>
                        <option value="heart">💖 Red Heart (লাভ আইকন - এনিমেশন)</option>
                        <option value="users">👥 Companion Partners (ইউজার পার্টনারস)</option>
                        <option value="trophy">🏆 Premium Elite Trophy (ট্রফি আইকন)</option>
                      </select>
                    </div>

                    {/* Badge Color preset selection */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Gradient Color (ব্যাজ কালার স্কিম)</label>
                      <select
                        value={slideBadgeColor}
                        onChange={(e) => setSlideBadgeColor(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="from-pink-500 to-rose-600">Rose/Pink (গোলাপী-লাল)</option>
                        <option value="from-amber-400 to-red-650">Amber/Orange-Red (আগুনের মত কমলা)</option>
                        <option value="from-cyan-500 to-blue-600">Ocean Cyan/Blue (নীল-আকাশী)</option>
                        <option value="from-emerald-500 to-teal-700">Emerald/Teal Green (সবুজ)</option>
                        <option value="from-purple-500 to-indigo-650">Cosmic Purple (বেগুনী)</option>
                      </select>
                    </div>

                    {/* Image URL input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Hero Photo Banner URL (ছবির ওয়েব লিংক) *</label>
                      <input 
                        type="url"
                        required
                        value={slideImage}
                        onChange={(e) => setSlideImage(e.target.value)}
                        placeholder="e.g. https://images.unsplash.com/... or paste link"
                        className="w-full bg-black/40 border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none placeholder-slate-700"
                      />
                    </div>
                  </div>

                  {/* Highly supportive Premium Unsplash Image Presets for rapid UX */}
                  <div className="bg-[#10121a] p-3 rounded-xl border border-slate-800/60 mt-1">
                    <span className="block text-[9px] font-bold text-amber-500/90 uppercase tracking-wider mb-2 font-mono">
                      ✨ Click one premium preset to instantly import Photo URL (প্রিমিয়াম ছবি সিলেক্ট করুন):
                    </span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setSlideImage('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000')}
                        className="p-1 px-1.5 bg-black/50 border border-slate-800 hover:border-amber-500/40 text-left rounded-lg text-[9px] text-slate-400 hover:text-white truncate flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded overflow-hidden shrink-0 block bg-slate-900">
                          <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50" className="w-full h-full object-cover" />
                        </span>
                        Elite Asian Model
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlideImage('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000')}
                        className="p-1 px-1.5 bg-black/50 border border-slate-800 hover:border-amber-500/40 text-left rounded-lg text-[9px] text-slate-400 hover:text-white truncate flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded overflow-hidden shrink-0 block bg-slate-900">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50" className="w-full h-full object-cover" />
                        </span>
                        Aesthetic Close-Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlideImage('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000')}
                        className="p-1 px-1.5 bg-black/50 border border-slate-800 hover:border-amber-500/40 text-left rounded-lg text-[9px] text-slate-400 hover:text-white truncate flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded overflow-hidden shrink-0 block bg-slate-900">
                          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=50" className="w-full h-full object-cover" />
                        </span>
                        Luxury Hotel Suite
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlideImage('https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1000')}
                        className="p-1 px-1.5 bg-black/50 border border-slate-800 hover:border-amber-500/40 text-left rounded-lg text-[9px] text-slate-400 hover:text-white truncate flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded overflow-hidden shrink-0 block bg-slate-900">
                          <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=50" className="w-full h-full object-cover" />
                        </span>
                        Royal Premium Bed
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4 text-black" />
                      {isEditingSlide ? "Update Banner Slide Properties" : "Add Slide to Homepage Collection"}
                    </button>
                    
                    {isEditingSlide && (
                      <button
                        type="button"
                        onClick={handleCancelSlideEdit}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider py-2.5 px-5 rounded-xl transition duration-150 cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
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

              {/* Model Registration Fee Configuration (মডেল রেজিস্ট্রেশন ফি) */}
              <div className="p-6 bg-[#0f111a] rounded-2xl border-2 border-[#dbaa61]/30 text-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#dbaa61] flex items-center gap-1.5 font-mono">
                      <DollarSign className="w-4 h-4 text-[#dbaa61]" />
                      Model Registration Fee Configuration / মডেল রেজিস্ট্রেশন ফি
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      মডেল (মহিলা, পুরুষ এবং স্পার্ম ডোনার)-দের সাইটে রেজিস্ট্রেশন করার জন্য আলাদা আলাদা ফি নিচে সেট করুন।
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold">
                    <span className="text-pink-400 bg-pink-400/5 px-2 py-0.5 rounded border border-pink-400/15">Female: ৳{localRegFee}</span>
                    <span className="text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/15">Male: ৳{localRegFeeMale}</span>
                    <span className="text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/15">Donor: ৳{localRegFeeSperm}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Female */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-pink-400 font-mono tracking-wider">
                      Female Model Fee (মহিলা মডেল ফি):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400/60 font-bold text-xs">৳</span>
                      <input
                        type="number"
                        value={localRegFee}
                        onChange={(e) => setLocalRegFee(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-slate-800 focus:border-pink-500 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                        placeholder="e.g. 3000"
                      />
                    </div>
                  </div>

                  {/* Male */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-blue-400 font-mono tracking-wider">
                      Male Model Fee (পুরুষ মডেল ফি):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60 font-bold text-xs">৳</span>
                      <input
                        type="number"
                        value={localRegFeeMale}
                        onChange={(e) => setLocalRegFeeMale(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-slate-800 focus:border-blue-500 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                        placeholder="e.g. 3000"
                      />
                    </div>
                  </div>

                  {/* Donor */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-amber-500 font-mono tracking-wider">
                      Sperm Donor Fee (স্পার্ম ডোনার ফি):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/60 font-bold text-xs">৳</span>
                      <input
                        type="number"
                        value={localRegFeeSperm}
                        onChange={(e) => setLocalRegFeeSperm(parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-slate-800 focus:border-amber-500 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                        placeholder="e.g. 3000"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdatePricingConfig) {
                        onUpdatePricingConfig({
                          registrationFee: localRegFee,
                          registrationFeeMale: localRegFeeMale,
                          registrationFeeSperm: localRegFeeSperm,
                          regularPlanFee: localRegularFee,
                          premiumPlanFee: localPremiumFee,
                          elitePlanFee: localEliteFee,
                        });
                        setPricingSuccess(true);
                        setTimeout(() => setPricingSuccess(false), 3000);
                      }
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#dbaa61] to-[#b38644] hover:from-[#e5b36a] hover:to-[#dbaa61] text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer h-9.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Registration Fees (ফি সমূহ সেভ করুন)
                  </button>
                </div>

                {pricingSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10.5px] text-emerald-400 font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>মডেল রেজিস্ট্রেশন ফি সমূহ সফলভাবে পরিবর্তন করা হয়েছে (Female: ৳{localRegFee}, Male: ৳{localRegFeeMale}, Donor: ৳{localRegFeeSperm})!</span>
                  </motion.div>
                )}
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
                            instructions,
                            logoUrl: gwLogoUrl.trim() || undefined
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
                        isActive: true,
                        logoUrl: gwLogoUrl.trim() || undefined
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
                    setGwLogoUrl('');
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
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

                    {/* Custom Logo Upload/URL Input */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gateway Logo (লোগো আপলোড)</label>
                      <div className="flex items-center gap-2 bg-black/40 border border-[#232733] rounded-xl p-1 h-10">
                        {gwLogoUrl ? (
                          <div className="relative w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                            <img src={gwLogoUrl} alt="Logo preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => setGwLogoUrl('')}
                              className="absolute inset-0 bg-black/70 hover:bg-black/85 flex items-center justify-center text-red-500 opacity-0 hover:opacity-100 transition-opacity"
                              title="Remove logo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded border border-dashed border-slate-700 flex items-center justify-center text-slate-500 shrink-0 text-[8px] font-bold font-mono">
                            NO LOGO
                          </div>
                        )}
                        <input
                          type="text"
                          value={gwLogoUrl}
                          onChange={(e) => setGwLogoUrl(e.target.value)}
                          placeholder="Image URL or upload..."
                          className="flex-1 bg-transparent text-white placeholder-slate-650 focus:outline-none text-[10px] font-bold min-w-0"
                        />
                        <label className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-[8.5px] font-black uppercase px-2 py-1.5 rounded-lg cursor-pointer shrink-0 select-none border border-slate-750">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setGwLogoUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
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
                          setGwLogoUrl('');
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
                            <div className="flex items-center gap-2">
                              {g.logoUrl ? (
                                <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                                  <img src={g.logoUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0 text-[9px] font-bold text-slate-500 uppercase">
                                  {g.method.substring(0, 3)}
                                </div>
                              )}
                              <div>
                                <span className="text-xs font-black text-white block truncate max-w-[130px]">{g.name}</span>
                                <span className="text-[8.5px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 mt-1 inline-block">
                                  {g.method}
                                </span>
                              </div>
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
            <div className="space-y-6 text-left font-semibold animate-fadeIn">
              
              {/* Luxury Header Banner */}
              <div className="relative p-6 bg-gradient-to-r from-[#171412] to-[#0c0d12] border-l-4 border-[#dbaa61] rounded-2xl text-xs space-y-3 shadow-2xl overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-32 h-32 text-[#dbaa61]" />
                </div>
                <h4 className="text-sm font-black uppercase text-[#dbaa61] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  CONFIDENTIAL ADMINISTRATION GATEWAY / এডমিন অ্যাক্সেস কন্ট্রোল
                </h4>
                <p className="text-slate-300 leading-relaxed font-medium">
                  Here you can view, register, or revoke system administrator credentials dynamically. Registered administrators must supply both an authorized Email and a verified Telegram profile. These fields are mandatory to maintain instant 2-Step OTP authentication channels and elite security integrity.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                
                {/* Form to Register New Admin (Takes 2 Columns) */}
                {loggedInAdminRole !== 'super_admin' ? (
                  <div className="lg:col-span-2 p-6 bg-red-950/10 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-xl select-none">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-black uppercase tracking-wider text-red-500">
                        Access Restricted / সীমাবদ্ধ অ্যাক্সেস
                      </h5>
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                        শুধুমাত্র সুপার এডমিন (Super Admin) নতুন এডমিন অ্যাকাউন্ট নথিভুক্ত বা রোল বরাদ্দ করতে পারেন।
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-2 p-5 bg-[#11131a] rounded-2xl border border-white/[0.04] text-xs space-y-5 shadow-xl">
                    <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-white">
                          Add New System Administrator
                        </h5>
                        <p className="text-[9px] text-slate-500 font-bold">নতুন প্যানেল এডমিন অ্যাকাউন্ট যুক্ত করুন</p>
                      </div>
                    </div>

                     <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const emailInput = form.elements.namedItem('newAdminEmail') as HTMLInputElement;
                        const telegramInput = form.elements.namedItem('newAdminTelegram') as HTMLInputElement;
                        const roleSelect = form.elements.namedItem('newAdminRole') as HTMLSelectElement;
                        const passwordInput = form.elements.namedItem('newAdminPassword') as HTMLInputElement;
                        
                        const emailVal = emailInput?.value?.trim()?.toLowerCase();
                        let telegramVal = telegramInput?.value?.trim();
                        const roleVal = (roleSelect?.value as 'super_admin' | 'admin' | 'moderator') || 'admin';
                        const passwordVal = passwordInput?.value?.trim();

                        if (!emailVal || !telegramVal || !passwordVal) {
                          alert('অনুগ্রহ করে সঠিক এডমিন ইমেল, টেলিগ্রাম এবং পাসওয়ার্ড লিখুন।');
                          return;
                        }

                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(emailVal)) {
                          alert('দয়া করে একটি সঠিক ইমেল এড্রেস ব্যবহার করুন।');
                          return;
                        }

                        if (passwordVal.length < 5) {
                          alert('পাসওয়ার্ডটি অন্তত ৫ অক্ষরের হতে হবে।');
                          return;
                        }

                        if (adminEmails.some(a => a.email.toLowerCase() === emailVal)) {
                          alert('এই ইমেইলটি ইতিমধ্যে এডমিন হিসেবে নিবন্ধিত আছে।');
                          return;
                        }

                        if (!telegramVal.startsWith('@')) {
                          telegramVal = '@' + telegramVal;
                        }

                        if (telegramVal.length < 3) {
                          alert('দয়া করে একটি সঠিক টেলিগ্রাম ইউজারনেম দিন (যেমন: @developer_akhi)।');
                          return;
                        }

                        try {
                          // Securely save the password in firestore right now
                          const passDocRef = doc(db, 'admin_passwords', emailVal);
                          await setDoc(passDocRef, { password: passwordVal });

                          updateAdminEmails([...adminEmails, { email: emailVal, telegram: telegramVal, role: roleVal }]);
                          form.reset();
                          alert('✅ নতুন এডমিন সফলভাবে পাসওয়ার্ডসহ তালিকাভুক্ত করা হয়েছে!');
                        } catch (err: any) {
                          console.error(err);
                          alert('❌ ডাটাবেজে পাসওয়ার্ড সেট করতে ত্রুটি হয়েছে। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন।');
                        }
                      }}
                      className="space-y-4"
                    >
                      {/* Email Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                          Administrator Email / এডমিন ইমেল এড্রেস *
                        </label>
                        <input
                          type="email"
                          name="newAdminEmail"
                          required
                          placeholder="e.g. staff@bodytouch.com"
                          className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-705 focus:outline-none focus:border-[#dbaa61] transition-all font-bold font-mono text-xs"
                        />
                      </div>

                      {/* Telegram Username Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                          Telegram Username / টেলিগ্রাম ইউজারনেম *
                        </label>
                        <input
                          type="text"
                          name="newAdminTelegram"
                          required
                          placeholder="e.g. @akhi_ofc (বা @ ছাড়া)"
                          className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-705 focus:outline-none focus:border-[#dbaa61] transition-all font-bold font-mono text-xs text-amber-400"
                        />
                      </div>

                      {/* Assign Password Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                          Assign Secure Password / পাসওয়ার্ড সেট করুন *
                        </label>
                        <input
                          type="text"
                          name="newAdminPassword"
                          required
                          placeholder="At least 5 characters long"
                          className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-705 focus:outline-none focus:border-[#dbaa61] transition-all font-bold font-mono text-xs"
                        />
                      </div>

                      {/* Role Input Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                          Assign Role / এডমিন ভুমিকা নির্বাচন করুন *
                        </label>
                        <select
                          name="newAdminRole"
                          required
                          className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2 text-slate-200 focus:outline-none focus:border-[#dbaa61] transition-all font-bold text-xs h-[38px] cursor-pointer"
                        >
                          <option value="admin">DEFAULT ADMIN (এডমিন)</option>
                          <option value="moderator">MODERATOR (মডারেটর)</option>
                          <option value="super_admin">SUPER ADMIN (সুপার এডমিন)</option>
                        </select>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-amber-500 to-[#dbaa61] hover:brightness-110 text-black px-5 py-3 rounded-xl font-black uppercase text-[11px] tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Save & Whitelist Account
                      </button>
                    </form>
                  </div>
                )}

                {/* List of Whitelisted Admins (Takes 3 Columns) */}
                <div className="lg:col-span-3 bg-[#11131a] rounded-2xl border border-white/[0.04] p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#dbaa61]/10 flex items-center justify-center text-[#dbaa61]">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-white">
                          Current Active Admin Directory
                        </h5>
                        <p className="text-[9px] text-slate-500 font-bold">অনুমোদিত সক্রিয় এডমিন সদস্যদের তালিকা</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black font-mono bg-[#dbaa61]/10 border border-[#dbaa61]/20 text-[#dbaa61] px-2.5 py-0.5 rounded-full uppercase">
                      {visibleAdminEmails.length} STAFF MEMBERS
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800/40 pr-1">
                    {visibleAdminEmails.map((adminObj) => {
                      const emailAddress = adminObj.email;
                      const telegramHandle = adminObj.telegram || '@not_configured';
                      const cleanTeleHandle = telegramHandle.startsWith('@') ? telegramHandle.substring(1) : telegramHandle;
                      
                      const userRole = adminObj.role || (emailAddress.toLowerCase() === '16killer2@gmail.com' ? 'super_admin' : 'admin');
                      const isMainSuperAdmin = emailAddress.toLowerCase() === '16killer2@gmail.com';
                      const isCurrentlyLoggedInUser = emailAddress.toLowerCase() === adminEmail.toLowerCase();

                      let badgeText = 'Admin Staff';
                      let badgeStyle = 'bg-slate-900 text-slate-400 border border-slate-800';
                      if (userRole === 'super_admin') {
                        badgeText = 'Super Admin 👑';
                        badgeStyle = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                      } else if (userRole === 'moderator') {
                        badgeText = 'Moderator 🛡️';
                        badgeStyle = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                      }
                      
                      return (
                        <div
                          key={emailAddress}
                          className="bg-black/25 border border-white/[0.02] hover:border-white/[0.05] rounded-2xl p-3.5 flex flex-col gap-3 transition-all duration-200 animate-fadeIn"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-950/40 to-slate-900 border border-[#dbaa61]/25 flex items-center justify-center text-[#dbaa61] font-extrabold text-xs shrink-0 select-none">
                              {emailAddress.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left font-semibold min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-200 block font-mono truncate" title={emailAddress}>{emailAddress}</span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {loggedInAdminRole === 'super_admin' && !isMainSuperAdmin && !isCurrentlyLoggedInUser ? (
                                  <select
                                    value={userRole}
                                    onChange={(e) => {
                                      const nextRole = e.target.value as 'super_admin' | 'admin' | 'moderator';
                                      const updated = adminEmails.map((item) => {
                                        if (item.email.toLowerCase() === emailAddress.toLowerCase()) {
                                          return { ...item, role: nextRole };
                                        }
                                        return item;
                                      });
                                      updateAdminEmails(updated);
                                      alert(`✅ "${emailAddress}" এর রোল পরিবর্তন করে "${nextRole.toUpperCase()}" করা হয়েছে!`);
                                    }}
                                    className="bg-[#0b0c10] border border-[#232733] hover:border-[#dbaa61]/40 rounded-lg text-[9px] font-black text-[#dbaa61] px-2 py-0.5 focus:outline-none cursor-pointer"
                                  >
                                    <option value="admin">ADMIN (এডমিন)</option>
                                    <option value="moderator">MODERATOR (মডারেটর)</option>
                                    <option value="super_admin">SUPER ADMIN (সুপার এডমিন)</option>
                                  </select>
                                ) : (
                                  <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeStyle}`}>
                                    {badgeText}
                                  </span>
                                )}
                                <a
                                  href={`https://t.me/${cleanTeleHandle}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[8.5px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
                                  title="Contact via Telegram channel"
                                >
                                  📨 {telegramHandle}
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Actions footer inside card */}
                          <div className="flex flex-col gap-2 border-t border-white/[0.03] pt-2.5">
                            <div className="flex items-center gap-1.5">
                              {/* Reset 2FA Button - Allowed only for Super Admin */}
                              {loggedInAdminRole === 'super_admin' && (
                                confirm2FAResetEmail === emailAddress ? (
                                  <div className="flex-1 flex flex-col gap-1 p-1 bg-amber-955/20 border border-amber-500/25 rounded-lg text-center">
                                    <span className="text-[8px] text-amber-300 font-bold uppercase">Reset 2FA?</span>
                                    <div className="flex gap-1 justify-center">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const trimmedEmail = emailAddress.trim().toLowerCase();
                                          try {
                                            await deleteDoc(doc(db, 'admin_totp_secrets', trimmedEmail));
                                            alert(`✅ Google Authenticator 2FA secret has been successfully reset for ${emailAddress}.`);
                                          } catch (err: any) {
                                            alert(`❌ Could not reset 2FA: ${err.message}`);
                                          }
                                          setConfirm2FAResetEmail(null);
                                        }}
                                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black text-[8px] font-black rounded cursor-pointer transition-all"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirm2FAResetEmail(null)}
                                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-black rounded cursor-pointer transition-all"
                                      >
                                        No
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirm2FAResetEmail(emailAddress);
                                      setConfirmRemoveEmail(null);
                                    }}
                                    className="flex-1 py-1 px-2 rounded-lg bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/25 text-[#dbaa61] hover:text-white text-[9px] font-extrabold uppercase transition cursor-pointer flex items-center justify-center gap-1 min-h-[28px]"
                                    title="Reset TOTP 2FA secret for this user"
                                  >
                                    Reset 2FA
                                  </button>
                                )
                              )}

                              {isMainSuperAdmin ? (
                                <span className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/25 text-[8px] font-black uppercase tracking-wider text-center select-none min-h-[28px] flex items-center justify-center">
                                  Owner Key
                                </span>
                              ) : (
                                /* Revoke/Delete button - Only Super Admins can revoke/delete admins, and you cannot revoke yourself */
                                loggedInAdminRole === 'super_admin' && !isCurrentlyLoggedInUser && (
                                  confirmRemoveEmail === emailAddress ? (
                                    <div className="flex-1 flex flex-col gap-1 p-1 bg-red-955/20 border border-red-500/25 rounded-lg text-center">
                                      <span className="text-[8px] text-red-300 font-bold uppercase">Remove Admin?</span>
                                      <div className="flex gap-1 justify-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            updateAdminEmails(adminEmails.filter(e => e.email.toLowerCase() !== emailAddress.toLowerCase()));
                                            alert(`✅ "${emailAddress}" এর এডমিন এক্সেস স্থায়ীভাবে বাতিল ও রিমুভ করা হয়েছে।`);
                                            setConfirmRemoveEmail(null);
                                          }}
                                          className="px-2 py-0.5 bg-red-500 hover:bg-red-450 text-white text-[8px] font-black rounded cursor-pointer transition-all"
                                        >
                                          Yes
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmRemoveEmail(null)}
                                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-black rounded cursor-pointer transition-all"
                                        >
                                          No
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmRemoveEmail(emailAddress);
                                        setConfirm2FAResetEmail(null);
                                      }}
                                      className="flex-1 py-1 px-2 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-white text-[9px] font-extrabold uppercase transition cursor-pointer flex items-center justify-center gap-1 min-h-[28px]"
                                      title="Permanently remove admin ID from the directory"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Remove
                                    </button>
                                  )
                                )
                              )}
                            </div>

                            {/* Backup codes generation block - Allowed only for super admin on a super admin */}
                            {loggedInAdminRole === 'super_admin' && userRole === 'super_admin' && (
                              <button
                                type="button"
                                disabled={isGeneratingBackupCodes}
                                onClick={async () => {
                                  try {
                                    setIsGeneratingBackupCodes(true);
                                    const codes: string[] = [];
                                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                                    for (let i = 0; i < 5; i++) {
                                      let code = '';
                                      for (let j = 0; j < 8; j++) {
                                        code += chars.charAt(Math.floor(Math.random() * chars.length));
                                      }
                                      codes.push(code);
                                    }

                                    const trimmedEmail = emailAddress.trim().toLowerCase();
                                    await setDoc(doc(db, 'admin_backup_codes', trimmedEmail), {
                                      codes: codes,
                                      generatedAt: new Date().toISOString()
                                    });

                                    setGeneratedBackupCodes(codes);
                                    setViewingBackupCodesEmail(emailAddress);
                                    alert(`✅ "${emailAddress}" এর জন্য ৫টি ওয়ান-টাইম ব্যাকআপ কোড সফলভাবে জেনারেট করা হয়েছে!`);
                                  } catch (err: any) {
                                    console.error('[Backup Codes Generation Error]', err);
                                    alert('❌ ব্যাকআপ কোড জেনারেট করতে সমস্যা হয়েছে: ' + err.message);
                                  } finally {
                                    setIsGeneratingBackupCodes(false);
                                  }
                                }}
                                className="w-full py-1 px-2 rounded-lg bg-cyan-950/30 hover:bg-cyan-950/50 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 hover:text-white text-[9px] font-extrabold uppercase transition cursor-pointer flex items-center justify-center gap-1 min-h-[28px]"
                                title="Generate 5 secure one-time backup codes for Super Admin"
                              >
                                🔑 {isGeneratingBackupCodes ? 'Generating...' : 'Generate Backup Codes (ব্যাকআপ কোড তৈরি করুন)'}
                              </button>
                            )}

                            {/* Backup codes viewer inside the card */}
                            {viewingBackupCodesEmail === emailAddress && generatedBackupCodes.length > 0 && (
                              <div className="p-3 bg-cyan-950/20 border border-cyan-500/25 rounded-xl space-y-2.5 animate-fadeIn">
                                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-1.5">
                                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">
                                    🔑 Backup Codes (ব্যাকআপ কোড)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingBackupCodesEmail(null);
                                      setGeneratedBackupCodes([]);
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-white cursor-pointer font-bold"
                                  >
                                    ✕ Close
                                  </button>
                                </div>
                                <p className="text-[8.5px] text-slate-300 font-bold leading-normal">
                                  নিচের কোডগুলো অত্যন্ত সুরক্ষিত স্থানে কপি করে সংরক্ষণ করুন। প্রতিটি কোড মাত্র একবার ব্যবহার করা যাবে। প্যানেল বন্ধ করার পর এগুলো আর দেখা যাবে না!
                                </p>
                                <div className="grid grid-cols-1 gap-1 font-mono text-center">
                                  {generatedBackupCodes.map((code, idx) => (
                                    <div key={code} className="flex items-center justify-between bg-black/40 px-2.5 py-1 rounded border border-white/[0.03] text-white font-bold text-[10px]">
                                      <span>{idx + 1}. <strong className="text-cyan-400 tracking-wider font-mono">{code}</strong></span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(code);
                                          alert('✅ কোড কপি করা হয়েছে!');
                                        }}
                                        className="text-[8px] text-cyan-400 hover:underline cursor-pointer font-black"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const textToCopy = generatedBackupCodes.join('\n');
                                    navigator.clipboard.writeText(textToCopy);
                                    alert('✅ সব কোড একসাথে কপি করা হয়েছে!');
                                  }}
                                  className="w-full py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-black uppercase transition cursor-pointer text-center"
                                >
                                  Copy All Codes
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Custom Passwords Editor Area to Override Default Password Codes */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-white/[0.04] text-xs space-y-5 shadow-xl mt-6">
                <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-white font-display">
                      Configure Administrator Sign-In Passwords
                    </h5>
                    <p className="text-[9px] text-slate-500 font-bold">এডমিনদের কাস্টম সাইন-ইন পাসওয়ার্ড পরিবর্তন করুন</p>
                  </div>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const emailSelect = form.elements.namedItem('adminPassEmail') as HTMLSelectElement;
                    const passInput = form.elements.namedItem('adminPassVal') as HTMLInputElement;
                    const emailVal = emailSelect?.value?.trim()?.toLowerCase();
                    const passVal = passInput?.value?.trim();

                    if (!emailVal || !passVal) {
                      alert('অনুগ্রহ করে সঠিক এডমিন ইমেল এবং পাসওয়ার্ড প্রবেশ করান।');
                      return;
                    }

                    if (passVal.length < 5) {
                      alert('পাসওয়ার্ডটি অন্তত ৫ অক্ষরের হতে হবে।');
                      return;
                    }

                    try {
                      const passDocRef = doc(db, 'admin_passwords', emailVal);
                      await setDoc(passDocRef, { password: passVal });
                      alert(`✅ ${emailVal} এর সাইন-ইন পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!`);
                      form.reset();
                    } catch (err: any) {
                      console.error(err);
                      alert('❌ পাসওয়ার্ড আপডেট করতে ত্রুটি হয়েছে। অনুগ্রহ করে আপনার ফায়ারস্টোর ডাটাবেজ কানেকশন চেক করুন।');
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-black text-slate-400">Select Whitelisted Admin / এডমিন নির্বাচন করুন</label>
                    <select
                      name="adminPassEmail"
                      required
                      className="w-full bg-[#050811] border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-rose-500 h-[38px]"
                    >
                      <option value="">-- Select Admin Email --</option>
                      {adminEmails.map(adminObj => (
                        <option key={adminObj.email} value={adminObj.email.toLowerCase()}>
                          {adminObj.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-black text-slate-400">Set Custom Password / নতুন পাসওয়ার্ড লিখুন</label>
                    <input
                      name="adminPassVal"
                      type="text"
                      required
                      placeholder="e.g. 16killer2@secure"
                      className="w-full bg-[#050811] border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-rose-500 font-mono h-[38px] text-[11px]"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full h-[38px] bg-[#dbaa61] hover:bg-[#c99a51] text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition hover:opacity-90 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Update Password
                    </button>
                  </div>
                </form>
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
                          rateReal_1h: comp.rateReal_1h,
                          rateReal_2h: comp.rateReal_2h,
                          rateReal_3h: comp.rateReal_3h,
                          rateReal_fn: comp.rateReal_fn,
                          rateCam: comp.rateCam,
                          rateLiveTogether: comp.rateLiveTogether,
                          customRealRates: comp.customRealRates && comp.customRealRates.length > 0
                            ? comp.customRealRates
                            : [{ id: 'init-real-1', duration: '1 Hour', rate: comp.rateReal_1h || comp.rate || 8000 }],
                          customCamRates: comp.customCamRates && comp.customCamRates.length > 0
                            ? comp.customCamRates
                            : [{ id: 'init-cam-1', duration: '30 Mins', rate: comp.rateCam_30m || 3000 }],
                          customLiveTogetherRates: comp.customLiveTogetherRates && comp.customLiveTogetherRates.length > 0
                            ? comp.customLiveTogetherRates
                            : [{ id: 'init-live-1', duration: '2 Days', rate: comp.rateLiveTogether_2d || 15000 }]
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
                                rateReal_1h: config.rateReal_1h,
                                rateReal_2h: config.rateReal_2h,
                                rateReal_3h: config.rateReal_3h,
                                rateReal_fn: config.rateReal_fn,
                                rateCam: config.rateCam,
                                rateLiveTogether: config.rateLiveTogether,
                                customRealRates: config.customRealRates || [],
                                customCamRates: config.customCamRates || [],
                                customLiveTogetherRates: config.customLiveTogetherRates || [],
                                pictures: getCompanionPictures(c.pictures || [], c.image)
                              };
                            }
                            return c;
                          });
                          onUpdateCompanions(updated);
                          // Trigger verification / emails
                          if (onApproveCompanion) {
                            onApproveCompanion(comp.id, {
                              badge: config.badge,
                              rate: config.rate,
                              rateReal: config.rateReal,
                              rateReal_1h: config.rateReal_1h,
                              rateReal_2h: config.rateReal_2h,
                              rateReal_3h: config.rateReal_3h,
                              rateReal_fn: config.rateReal_fn,
                              rateCam: config.rateCam,
                              rateLiveTogether: config.rateLiveTogether,
                              customRealRates: config.customRealRates || [],
                              customCamRates: config.customCamRates || [],
                              customLiveTogetherRates: config.customLiveTogetherRates || []
                            });
                          }
                        };
                        const configCustomRealRates = config.customRealRates || [];
                        const configCustomCamRates = config.customCamRates || [];
                        const configCustomLiveTogetherRates = config.customLiveTogetherRates || [];

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

                              {/* Measurements Overview */}
                              <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 font-bold">
                                <div className="bg-[#11131a] p-2 rounded-xl text-left">
                                  <span className="text-slate-550 text-[7.5px] uppercase block font-mono">Weight (ওজন):</span>
                                  <span className="text-white font-heavy text-[10.5px]">{comp.weight || 'N/A'}</span>
                                </div>
                                <div className="bg-[#11131a] p-2 rounded-xl text-left">
                                  <span className="text-slate-550 text-[7.5px] uppercase block font-mono">Breast (স্তন):</span>
                                  <span className="text-white font-heavy text-[10.5px]">{comp.bust || 'N/A'}</span>
                                </div>
                                <div className="bg-[#11131a] p-2 rounded-xl text-left">
                                  <span className="text-slate-550 text-[7.5px] uppercase block font-mono">Waist (কোমর):</span>
                                  <span className="text-white font-heavy text-[10.5px]">{comp.waist || 'N/A'}</span>
                                </div>
                                <div className="bg-[#11131a] p-2 rounded-xl text-left">
                                  <span className="text-slate-550 text-[7.5px] uppercase block font-mono">Hip (নিতম্ব):</span>
                                  <span className="text-white font-heavy text-[10.5px]">{comp.hip || 'N/A'}</span>
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

                              {/* Model Portfolio Photos Gallery */}
                              {(() => {
                                const reviewPics = getCompanionPictures(comp.pictures || [], comp.image);
                                return (
                                  <div className="p-3 bg-blue-950/10 border border-blue-500/10 rounded-xl space-y-2 text-left">
                                    <span className="text-[8.5px] font-black uppercase tracking-wider text-blue-400 block font-mono">
                                      📸 Model Portfolio Gallery / মডেল গ্যালারি ছবি ({reviewPics.length} Photos)
                                    </span>
                                    <div className="grid grid-cols-4 gap-2">
                                      {reviewPics.map((imgUrl, idx) => (
                                        <div key={idx} className="bg-black/40 border border-blue-500/10 rounded-lg p-1 text-center flex flex-col justify-between items-center h-20 relative group">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setZoomedImage(imgUrl);
                                              setZoomScale(1);
                                              setZoomRotation(0);
                                            }}
                                            className="block w-full h-full relative overflow-hidden rounded border border-blue-500/10 cursor-zoom-in active:scale-95 transition-all"
                                          >
                                            <img src={imgUrl} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Model Identity Verification Documents */}
                              {(comp.nidFront || comp.nidBack || comp.selfie) && (
                                <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl space-y-2 text-left">
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-red-400 block font-mono">
                                    🆔 Verification Documents (NID / Birth Certificate) / আইডি ও সেলফি ভেরিফিকেশন
                                  </span>
                                  <div className="grid grid-cols-3 gap-2">
                                    {/* Selfie Verification */}
                                    {comp.selfie ? (
                                      <div className="bg-black/40 border border-[#2b1717] rounded-lg p-1.5 text-center flex flex-col justify-between items-center h-20">
                                        <span className="text-[7.5px] text-slate-400 uppercase font-mono tracking-tight block truncate w-full">Selfie / সেলফি</span>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setZoomedImage(comp.selfie);
                                            setZoomScale(1);
                                            setZoomRotation(0);
                                          }}
                                          className="block w-full h-11 relative overflow-hidden rounded border border-red-500/10 cursor-zoom-in active:scale-95 transition-all"
                                        >
                                          <img src={comp.selfie} alt="Selfie" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="bg-black/20 border border-slate-900 rounded-lg p-1.5 h-20 flex items-center justify-center text-[7.5px] text-slate-550 uppercase">
                                        No Selfie
                                      </div>
                                    )}

                                    {/* NID Front / Birth Certificate */}
                                    {comp.nidFront ? (
                                      <div className="bg-black/40 border border-[#2b1717] rounded-lg p-1.5 text-center flex flex-col justify-between items-center h-20">
                                        <span className="text-[7.5px] text-slate-400 uppercase font-mono tracking-tight block truncate w-full">Front / জন্মনিবন্ধন</span>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setZoomedImage(comp.nidFront);
                                            setZoomScale(1);
                                            setZoomRotation(0);
                                          }}
                                          className="block w-full h-11 relative overflow-hidden rounded border border-red-500/10 cursor-zoom-in active:scale-95 transition-all"
                                        >
                                          <img src={comp.nidFront} alt="NID Front / Birth Certificate" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="bg-black/20 border border-slate-900 rounded-lg p-1.5 h-20 flex items-center justify-center text-[7.5px] text-slate-550 uppercase">
                                        No Doc Front
                                      </div>
                                    )}

                                    {/* NID Back */}
                                    {comp.nidBack ? (
                                      <div className="bg-black/40 border border-[#2b1717] rounded-lg p-1.5 text-center flex flex-col justify-between items-center h-20">
                                        <span className="text-[7.5px] text-slate-400 uppercase font-mono tracking-tight block truncate w-full">Back / পেছনের অংশ</span>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setZoomedImage(comp.nidBack);
                                            setZoomScale(1);
                                            setZoomRotation(0);
                                          }}
                                          className="block w-full h-11 relative overflow-hidden rounded border border-red-500/10 cursor-zoom-in active:scale-95 transition-all"
                                        >
                                          <img src={comp.nidBack} alt="NID Back" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="bg-black/20 border border-slate-900 rounded-lg p-1.5 h-20 flex items-center justify-center text-[7.5px] text-slate-550 uppercase">
                                        No Doc Back
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Agent Recruitment Payment Info */}
                              {(comp.paymentTrx || comp.paymentMethod) && (
                                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2 text-left">
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-400 block font-mono">
                                    💰 Recruitment Payment / রেজিস্ট্রেশন ফি বিবরণী
                                  </span>
                                  <div className="grid grid-cols-2 gap-2 text-[10.5px] text-slate-300">
                                    <div className="bg-black/30 p-1.5 rounded border border-emerald-950/40">
                                      <span className="text-[7.5px] text-slate-500 block uppercase">Gateway</span>
                                      <strong className="text-emerald-400 font-mono">{comp.paymentMethod || 'MFS'}</strong>
                                    </div>
                                    <div className="bg-black/30 p-1.5 rounded border border-emerald-950/40">
                                      <span className="text-[7.5px] text-slate-500 block uppercase">Transaction ID</span>
                                      <strong className="text-white font-mono uppercase">{comp.paymentTrx || 'N/A'}</strong>
                                    </div>
                                    <div className="bg-black/30 p-1.5 rounded border border-emerald-950/40 col-span-2 sm:col-span-1">
                                      <span className="text-[7.5px] text-slate-500 block uppercase">Sender Number</span>
                                      <strong className="text-slate-200 font-mono">{comp.paymentSender || 'N/A'}</strong>
                                    </div>
                                    <div className="bg-black/30 p-1.5 rounded border border-emerald-950/40 col-span-2 sm:col-span-1">
                                      <span className="text-[7.5px] text-slate-500 block uppercase">Amount Paid</span>
                                      <strong className="text-[#dbaa61] font-mono">৳{(comp.paymentAmount || 3000).toLocaleString()}</strong>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Administration verification inputs */}
                              <div className="p-4.5 bg-black/40 rounded-xl border border-dashed border-red-500/10 space-y-3.5 text-left">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#ef4444] border-b border-[#222938] pb-1.5 block">
                                  ADMIN APPROVAL SETTINGS (অনুমোদন কনফিগারেশন)
                                </span>

                                <div className="grid grid-cols-1 gap-3.5 text-left">
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
                                </div>

                                {/* Row 1: Real Meet Custom Rates */}
                                <div className="p-3 bg-red-950/5 border border-red-500/10 rounded-xl space-y-2">
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-red-400 block font-mono">
                                    📍 Real Meet Rates / সরাসরি সাক্ষাৎ রেট (ঘণ্টা অনুযায়ী)
                                  </span>
                                  <div className="space-y-2">
                                    {configCustomRealRates.map((slot, idx) => (
                                      <div key={slot.id || idx} className="flex gap-2 items-center bg-black/40 border border-[#232733] rounded-lg p-1.5">
                                        <input
                                          type="text"
                                          value={slot.duration}
                                          onChange={(e) => {
                                            const newList = [...configCustomRealRates];
                                            newList[idx] = { ...newList[idx], duration: e.target.value };
                                            handleFieldChange('customRealRates', newList);
                                          }}
                                          placeholder="e.g. 1 Hour"
                                          className="flex-1 bg-black border border-slate-900 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                                        />
                                        <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded border border-slate-900">
                                          <span className="text-slate-500 text-[10px]">৳</span>
                                          <input
                                            type="number"
                                            value={slot.rate || ''}
                                            onChange={(e) => {
                                              const newList = [...configCustomRealRates];
                                              newList[idx] = { ...newList[idx], rate: Number(e.target.value) };
                                              handleFieldChange('customRealRates', newList);
                                            }}
                                            placeholder="0"
                                            className="w-28 bg-black border border-slate-900 rounded px-2 py-0.5 text-xs text-emerald-450 font-mono font-bold focus:outline-none text-right"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newList = configCustomRealRates.filter((_, i) => i !== idx);
                                            handleFieldChange('customRealRates', newList);
                                          }}
                                          className="text-red-500 hover:text-red-400 px-1.5 text-sm transition active:scale-90"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleFieldChange('customRealRates', [...configCustomRealRates, { id: Math.random().toString(), duration: '', rate: 0 }]);
                                    }}
                                    className="w-full bg-[#11131a] hover:bg-black border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-white text-[8.5px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                                  >
                                    ➕ Add Real Meet Option (+ নতুন রেট যোগ করুন)
                                  </button>
                                </div>

                                {/* Row 2: Video Cam Custom Rates */}
                                <div className="p-3 bg-cyan-950/5 border border-cyan-500/10 rounded-xl space-y-2">
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-cyan-400 block font-mono">
                                    🎥 Video Cam Rates / ভিডিও কল রেট
                                  </span>
                                  <div className="space-y-2">
                                    {configCustomCamRates.map((slot, idx) => (
                                      <div key={slot.id || idx} className="flex gap-2 items-center bg-black/40 border border-[#232733] rounded-lg p-1.5">
                                        <input
                                          type="text"
                                          value={slot.duration}
                                          onChange={(e) => {
                                            const newList = [...configCustomCamRates];
                                            newList[idx] = { ...newList[idx], duration: e.target.value };
                                            handleFieldChange('customCamRates', newList);
                                          }}
                                          placeholder="e.g. 30 Mins"
                                          className="flex-1 bg-black border border-slate-900 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                                        />
                                        <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded border border-slate-900">
                                          <span className="text-slate-500 text-[10px]">৳</span>
                                          <input
                                            type="number"
                                            value={slot.rate || ''}
                                            onChange={(e) => {
                                              const newList = [...configCustomCamRates];
                                              newList[idx] = { ...newList[idx], rate: Number(e.target.value) };
                                              handleFieldChange('customCamRates', newList);
                                            }}
                                            placeholder="0"
                                            className="w-28 bg-black border border-slate-900 rounded px-2 py-0.5 text-xs text-emerald-450 font-mono font-bold focus:outline-none text-right"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newList = configCustomCamRates.filter((_, i) => i !== idx);
                                            handleFieldChange('customCamRates', newList);
                                          }}
                                          className="text-red-500 hover:text-red-400 px-1.5 text-sm transition active:scale-90"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleFieldChange('customCamRates', [...configCustomCamRates, { id: Math.random().toString(), duration: '', rate: 0 }]);
                                    }}
                                    className="w-full bg-[#11131a] hover:bg-black border border-slate-800 hover:border-cyan-500/30 text-slate-400 hover:text-white text-[8.5px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                                  >
                                    ➕ Add Video Cam Option (+ নতুন রেট যোগ করুন)
                                  </button>
                                </div>

                                {/* Row 3: Live Together Custom Rates */}
                                <div className="p-3 bg-purple-950/5 border border-purple-500/10 rounded-xl space-y-2">
                                  <span className="text-[8.5px] font-black uppercase tracking-wider text-purple-400 block font-mono">
                                    🏠 Live Together Rates / লাইভ টুগেদার রেট
                                  </span>
                                  <div className="space-y-2">
                                    {configCustomLiveTogetherRates.map((slot, idx) => (
                                      <div key={slot.id || idx} className="flex gap-2 items-center bg-black/40 border border-[#232733] rounded-lg p-1.5">
                                        <input
                                          type="text"
                                          value={slot.duration}
                                          onChange={(e) => {
                                            const newList = [...configCustomLiveTogetherRates];
                                            newList[idx] = { ...newList[idx], duration: e.target.value };
                                            handleFieldChange('customLiveTogetherRates', newList);
                                          }}
                                          placeholder="e.g. 2 Days"
                                          className="flex-1 bg-black border border-slate-900 rounded px-2 py-1 text-xs text-white font-semibold focus:outline-none"
                                        />
                                        <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded border border-slate-900">
                                          <span className="text-slate-500 text-[10px]">৳</span>
                                          <input
                                            type="number"
                                            value={slot.rate || ''}
                                            onChange={(e) => {
                                              const newList = [...configCustomLiveTogetherRates];
                                              newList[idx] = { ...newList[idx], rate: Number(e.target.value) };
                                              handleFieldChange('customLiveTogetherRates', newList);
                                            }}
                                            placeholder="0"
                                            className="w-28 bg-black border border-slate-900 rounded px-2 py-0.5 text-xs text-emerald-450 font-mono font-bold focus:outline-none text-right"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newList = configCustomLiveTogetherRates.filter((_, i) => i !== idx);
                                            handleFieldChange('customLiveTogetherRates', newList);
                                          }}
                                          className="text-red-500 hover:text-red-400 px-1.5 text-sm transition active:scale-90"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleFieldChange('customLiveTogetherRates', [...configCustomLiveTogetherRates, { id: Math.random().toString(), duration: '', rate: 0 }]);
                                    }}
                                    className="w-full bg-[#11131a] hover:bg-black border border-slate-800 hover:border-purple-500/30 text-slate-400 hover:text-white text-[8.5px] font-black uppercase tracking-wider py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-bold"
                                  >
                                    ➕ Add Live Together Option (+ নতুন রেট যোগ করুন)
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Verification action buttons */}
                            <div className="flex gap-3 border-t border-white/5 pt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onDeclineCompanion) {
                                    onDeclineCompanion(comp.id);
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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Fee 1 - Female */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-pink-400 font-mono tracking-wider">
                      Female Reg Fee (মহিলা রেজিস্ট্রেশন ফি) (৳):
                    </label>
                    <input
                      type="number"
                      value={localRegFee}
                      onChange={(e) => setLocalRegFee(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950/80 border border-slate-800 focus:border-pink-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  {/* Fee 1b - Male */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-blue-400 font-mono tracking-wider">
                      Male Reg Fee (পুরুষ রেজিস্ট্রেশন ফি) (৳):
                    </label>
                    <input
                      type="number"
                      value={localRegFeeMale}
                      onChange={(e) => setLocalRegFeeMale(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  {/* Fee 1c - Sperm Donor */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black uppercase text-amber-500 font-mono tracking-wider">
                      Sperm Donor Reg Fee (স্পার্ম ডোনার ফি) (৳):
                    </label>
                    <input
                      type="number"
                      value={localRegFeeSperm}
                      onChange={(e) => setLocalRegFeeSperm(parseInt(e.target.value) || 0)}
                      className="w-full bg-zinc-950/80 border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
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
                          registrationFeeMale: localRegFeeMale,
                          registrationFeeSperm: localRegFeeSperm,
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
              
              {/* HEADER WITH CLEAR ALL ACTION */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 font-sans">
                    <Award className="w-5 h-5 text-[#dbaa61]" />
                    Agent Performance Ledger (এজেন্ট পারফরম্যান্স লেজার)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">
                    Manage agent commission rates, inspect active agent accounts, and process withdrawal requests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you absolutely sure you want to clear ALL Agent & Referral records? This will delete all referrers, signup mappings, and withdrawal history permanently!')) {
                      if (onUpdateReferrals) {
                        onUpdateReferrals([]);
                        localStorage.setItem('bt_referrals', JSON.stringify([]));
                      }
                      if (onUpdateWithdrawals) {
                        onUpdateWithdrawals([]);
                        localStorage.setItem('bt_withdrawals', JSON.stringify([]));
                      }
                      alert('All agent & referral management data has been successfully cleared!');
                    }
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-extrabold text-[11px] uppercase tracking-widest px-4 py-2.5 rounded-xl border border-red-500/30 transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear All Agent Records (সব তথ্য মুছুন)</span>
                </button>
              </div>

              {(() => {
                // Calculate aggregated calculations per referrer (Agents)
                const referrersMap: { [key: string]: {
                  username: string;
                  totalReferredCount: number;
                  conversionsCount: number;
                  totalEarned: number;
                  totalWithdrawn: number;
                  pendingAmount: number;
                } } = {};

                // Initialize referrers we know from referrals
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

                // Loop through all registered agents and add 10% commission for completed bookings of recruited companions
                registeredAgents.forEach(agent => {
                  const agentUserLower = (agent.username || '').trim().toLowerCase();
                  if (!agentUserLower) return;
                  
                  if (!referrersMap[agentUserLower]) {
                    referrersMap[agentUserLower] = {
                      username: agent.username || '',
                      totalReferredCount: 0,
                      conversionsCount: 0,
                      totalEarned: 0,
                      totalWithdrawn: 0,
                      pendingAmount: 0
                    };
                  }
                  
                  // Find companions recruited by this agent
                  const agentCompanions = companions.filter(c => 
                    (c.recruiter && c.recruiter.toLowerCase() === agentUserLower) ||
                    (c.telegram && c.telegram.toLowerCase() === agentUserLower)
                  );
                  let recruitBookingCommissions = 0;
                  
                  agentCompanions.forEach(c => {
                    const companionBookings = bookings.filter(b => 
                      b.status === 'Completed' && (
                        (b.modelUsername && c.modelUsername && b.modelUsername.toLowerCase() === c.modelUsername.toLowerCase()) ||
                        (b.modelName && c.name && b.modelName.toLowerCase() === c.name.toLowerCase())
                      )
                    );
                    companionBookings.forEach(b => {
                      recruitBookingCommissions += (b.cost || 0) * 0.10;
                    });
                  });
                  
                  // Add this recruit commission to the total earned for this agent
                  referrersMap[agentUserLower].totalEarned += recruitBookingCommissions;
                });

                const summaryList = registeredAgents.map(agent => {
                  const usernameLower = (agent.username || '').trim().toLowerCase();
                  const stats = referrersMap[usernameLower] || {
                    username: agent.username || '',
                    totalReferredCount: 0,
                    conversionsCount: 0,
                    totalEarned: 0,
                    totalWithdrawn: 0,
                    pendingAmount: 0
                  };
                  return {
                    username: agent.username || '',
                    password: agent.password || '',
                    fullName: agent.fullName || '',
                    phone: agent.phone || '',
                    email: agent.email || '',
                    dateRegistered: agent.dateRegistered || '',
                    ...stats
                  };
                });

                const totalAgents = summaryList.length;
                const totalConverted = referrals.filter(r => r.tier !== 'FREE').length;
                const totalEarnedCommission = Object.values(referrersMap).reduce((sum, r) => sum + r.totalEarned, 0);
                
                const approvedWithdrawalsSum = withdrawals
                  .filter(w => w.status === 'Approved')
                  .reduce((sum, w) => sum + w.amount, 0);
                  
                const pendingWithdrawalsSum = withdrawals
                  .filter(w => w.status === 'Pending')
                  .reduce((sum, w) => sum + w.amount, 0);

                return (
                  <div className="space-y-8">
                    {/* TOP GLOBAL STATS ROW */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#0a0b10] border border-blue-500/10 p-4 rounded-2xl">
                      <div className="bg-[#11131c] border border-blue-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-blue-400">
                          <span className="text-[10px] font-black uppercase tracking-wider">Total Agents</span>
                          <Users className="w-4 h-4 bg-blue-500/10 p-0.5 rounded" />
                        </div>
                        <div className="mt-3">
                          <span className="text-xl font-black text-white font-mono">{totalAgents}</span>
                          <span className="text-[9px] text-slate-500 block">Registered partners</span>
                        </div>
                      </div>

                      <div className="bg-[#11131c] border border-green-500/10 p-4.5 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between text-emerald-400">
                          <span className="text-[10px] font-black uppercase tracking-wider font-sans">Active Conversions</span>
                          <Sparkles className="w-4 h-4 bg-emerald-500/10 p-0.5 rounded" />
                        </div>
                        <div className="mt-3">
                          <span className="text-xl font-black text-white font-mono">{totalConverted}</span>
                          <span className="text-[9px] text-slate-500 block">Sales & Subscriptions</span>
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

                    {/* SECTION A: AGENTS PERFORMANCE DIRECTORY */}
                    <div className="bg-[#0b0c15] border border-blue-500/10 rounded-2xl p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-[#58a6ff] uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4.5 h-4.5 text-[#58a6ff]" />
                            Agents & Recruiters Performance (এজেন্ট ও রিক্রুটার তালিকা)
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            সারসংক্ষেপ: প্রতিটি এজেন্টের কমিশন, পেমেন্ট, উইথড্র এবং রিয়েলটাইম ব্যালেন্সের হিসাব।
                          </p>
                        </div>
                      </div>

                      {summaryList.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 font-bold text-xs">
                          No active agents or recruiters registered yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[9.5px] tracking-wider bg-black/20">
                                <th className="py-2.5 px-3">Agent Username</th>
                                <th className="py-2.5 px-3 text-center font-sans">Badge / Level</th>
                                <th className="py-2.5 px-3 text-center">Invited Clients</th>
                                <th className="py-2.5 px-3 text-center">Conversions</th>
                                <th className="py-2.5 px-3 text-right text-cyan-400">Total Earned</th>
                                <th className="py-2.5 px-3 text-right text-rose-400">Total Withdrawn</th>
                                <th className="py-2.5 px-3 text-right">Pending Payout</th>
                                <th className="py-2.5 px-3 text-right text-emerald-400 font-bold">Balance Available</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-[11px] font-semibold text-slate-300">
                              {summaryList.map((user, idx) => {
                                const availableBal = user.totalEarned - user.totalWithdrawn - user.pendingAmount;
                                return (
                                  <tr key={idx} className="hover:bg-slate-800/20 transition">
                                    <td className="py-3 px-3 text-left">
                                      <div className="font-bold text-white font-mono">@{user.username}</div>
                                      {user.fullName && (
                                        <div className="text-[10px] text-[#dbaa61] mt-0.5 font-sans">{user.fullName}</div>
                                      )}
                                      {(user.phone || user.email) && (
                                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                                          {user.phone} {user.email && `| ${user.email}`}
                                        </div>
                                      )}
                                      <div className="text-[9.5px] text-slate-400 mt-1 font-mono">
                                        PIN: <span className="text-amber-500 font-bold">{user.password || 'Not Set'}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                        user.conversionsCount >= 5 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                                        user.conversionsCount >= 2 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' :
                                        'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                                      }`}>
                                        {user.conversionsCount >= 5 ? 'Elite Partner' :
                                         user.conversionsCount >= 2 ? 'Premium Partner' : 'Standard Partner'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3 text-center font-mono text-slate-300">{user.totalReferredCount} joins</td>
                                    <td className="py-3 px-3 text-center font-mono">
                                      <span className="text-emerald-400">{user.conversionsCount} sales</span>
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono text-cyan-400 font-bold">৳{user.totalEarned.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-right font-mono text-rose-400">৳{user.totalWithdrawn.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-right font-mono text-amber-400">৳{user.pendingAmount.toLocaleString()}</td>
                                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-extrabold text-xs">
                                      ৳{(availableBal < 0 ? 0 : availableBal).toLocaleString()}
                                    </td>
                                    <td className="py-3 px-3 text-right">
                                      <button
                                        onClick={() => handleResetAgent2FA(user.username)}
                                        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[9px] font-black uppercase tracking-wider transition active:scale-95 flex items-center gap-1 ml-auto cursor-pointer"
                                        title="Reset Agent Google 2FA Authenticator"
                                      >
                                        <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                                        Reset 2FA
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

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

          {/* =======================================================
              MODEL LEDGER & FINANCIAL AUDITING TAB
              ======================================================= */}
          {activeTab === 'model_ledger' && (
            <div className="space-y-8 text-left animate-fadeIn">
              
              {/* TOP GLOBAL LEDGER STATS ROW */}
              {(() => {
                const completedBookings = bookings.filter(b => b.status === 'Completed');
                const grossRev = completedBookings.reduce((sum, b) => sum + (b.cost || 0), 0);
                const netModelShare = grossRev * 0.6;
                const totalApprovedWithd = withdrawals
                  .filter(w => w.status === 'Approved')
                  .reduce((sum, w) => sum + (w.amount || 0), 0);
                const totalDues = Math.max(0, netModelShare - totalApprovedWithd);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Stat 1 */}
                    <div className="bg-gradient-to-br from-[#0c1020] to-[#070913] border border-[#1e2333]/60 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Total Jobs Completed</span>
                        <span className="block text-2xl font-black text-white mt-1">{completedBookings.length} Dispatches</span>
                        <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Manually & Auto Logged</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-blue-400">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="bg-gradient-to-br from-[#0c1020] to-[#070913] border border-[#1e2333]/60 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Gross Dispatch Value</span>
                        <span className="block text-2xl font-black text-white mt-1">৳{grossRev.toLocaleString()}</span>
                        <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">Total billing handled</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <CreditCard className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Stat 3 */}
                    <div className="bg-gradient-to-br from-[#0c1020] to-[#070913] border border-[#1e2333]/60 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Model Share (60%)</span>
                        <span className="block text-2xl font-black text-amber-200 mt-1">৳{netModelShare.toLocaleString()}</span>
                        <span className="text-[10px] text-amber-500 font-semibold mt-1 block">Gateway Charge (40%): ৳{Math.round(grossRev * 0.4).toLocaleString()}</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-[#dbaa61]/20 flex items-center justify-center text-[#dbaa61]">
                        <HandCoins className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Stat 4 */}
                    <div className="bg-gradient-to-br from-[#0c1020] to-[#070913] border border-[#1e2333]/60 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Pending Payout Balances</span>
                        <span className="block text-2xl font-black text-rose-400 mt-1">৳{totalDues.toLocaleString()}</span>
                        <span className="text-[10px] text-rose-500/80 font-semibold mt-1 block">Unpaid outstanding dues</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/10 flex items-center justify-center text-rose-400">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* GRID: FORM + MODEL BALANCE LIST */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* 1. MANUAL LEDGER JOB ENTRY FORM */}
                <div className="xl:col-span-1 bg-[#0b0c13] border border-[#1e2333] p-6 rounded-2xl space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-display">
                      <Plus className="w-4 h-4 text-[#dbaa61]" />
                      <span>Record Manual Job Dispatch</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      এডমিন প্যানেল থেকে যেকোনো মডেলের জন্য কাজের বিবরণ (তারিখ, সময়, কাজের স্থান ও পেমেন্ট) সরাসরি এন্ট্রি করুন।
                    </p>
                  </div>

                  {ledgerSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl">
                      {ledgerSuccess}
                    </div>
                  )}

                  {ledgerError && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-xl">
                      {ledgerError}
                    </div>
                  )}

                  <form onSubmit={handleAddManualLedger} className="space-y-4">
                    {/* Model Choice */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Select Model Companion *</label>
                      <select
                        required
                        value={ledgerModelUsername}
                        onChange={(e) => setLedgerModelUsername(e.target.value)}
                        className="w-full bg-[#11131c] text-xs text-white border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="">-- Select Companion --</option>
                        {companions.map((comp) => (
                          <option key={comp.id} value={comp.modelUsername || comp.id}>
                            {comp.name} ({comp.modelUsername ? `@${comp.modelUsername}` : 'No user linked'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date picker */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Dispatch Date *</label>
                      <input
                        type="date"
                        required
                        value={ledgerDate}
                        onChange={(e) => setLedgerDate(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Time string */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Dispatch Time *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 08:00 PM or Night Shift"
                        value={ledgerTime}
                        onChange={(e) => setLedgerTime(e.target.value)}
                        className="w-full bg-[#11131c] text-xs text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Place / Location */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Dispatch Location / Hotel Place *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. InterContinental Suite 501"
                        value={ledgerPlace}
                        onChange={(e) => setLedgerPlace(e.target.value)}
                        className="w-full bg-[#11131c] text-xs text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Cost/Payment */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Total Job Cost/Payment (৳) *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 15000"
                        value={ledgerCost}
                        onChange={(e) => setLedgerCost(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Duration / Service Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 2 Hours, Short Stay, Full Night"
                        value={ledgerDuration}
                        onChange={(e) => setLedgerDuration(e.target.value)}
                        className="w-full bg-[#11131c] text-xs text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Client Reference / Phone */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold mb-1">Client Reference / Order Source</label>
                      <input
                        type="text"
                        placeholder="e.g. Phone Booking #017xxx"
                        value={ledgerClientRef}
                        onChange={(e) => setLedgerClientRef(e.target.value)}
                        className="w-full bg-[#11131c] text-xs text-white border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#dbaa61] hover:bg-[#c99850] text-black font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>RECORD LEDGER DISPATCH</span>
                    </button>
                  </form>
                </div>

                {/* 2. MODEL BALANCES LEDGER SUMMARY */}
                <div className="xl:col-span-2 bg-[#0b0c13] border border-[#1e2333] p-6 rounded-2xl flex flex-col h-full justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4 mb-4">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-display">
                          <HandCoins className="w-4 h-4 text-[#dbaa61]" />
                          <span>Model Roster Financial Sheets</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">
                          প্রতিটি অনুমোদিত মডেলের কাজ, সর্বমোট বুকিং মূল্য, তাদের প্রাপ্য শেয়ার (৮০%) এবং উত্তোলনযোগ্য বাকি ব্যালেন্সের হিসাব।
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.04] text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            <th className="pb-3 pl-2">Model Companion</th>
                            <th className="pb-3 text-center">Jobs</th>
                            <th className="pb-3">Gross Value</th>
                            <th className="pb-3 text-amber-200">Share (60%)</th>
                            <th className="pb-3 text-emerald-400">Paid Out</th>
                            <th className="pb-3 text-rose-400">Withdrawable Due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                          {companions.map((comp) => {
                            const modelUser = comp.modelUsername || comp.id;
                            // Match bookings
                            const compBookings = bookings.filter(
                              (b) =>
                                b.status === 'Completed' &&
                                (b.modelUsername?.toLowerCase() === modelUser.toLowerCase() ||
                                  b.modelName?.toLowerCase() === comp.name.toLowerCase())
                            );
                            const grossVal = compBookings.reduce((sum, b) => sum + (b.cost || 0), 0);
                            const shareVal = grossVal * 0.6;
                            // Match withdrawals
                            const approvedWithd = withdrawals
                              .filter(
                                (w) =>
                                  w.status === 'Approved' &&
                                  w.username?.toLowerCase() === modelUser.toLowerCase()
                              )
                              .reduce((sum, w) => sum + (w.amount || 0), 0);
                            const dueVal = Math.max(0, shareVal - approvedWithd);

                            return (
                              <tr key={comp.id} className="hover:bg-white/[0.01] transition-all">
                                <td className="py-3 pl-2 flex items-center gap-2.5">
                                  <img
                                    src={comp.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'}
                                    alt={comp.name}
                                    className="w-8 h-8 rounded-lg object-cover border border-white/[0.08]"
                                  />
                                  <div className="text-left">
                                    <span className="block font-bold text-white leading-none">{comp.name}</span>
                                    <span className="block text-[9px] text-slate-500 font-mono mt-1">
                                      @{modelUser}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 text-center font-bold text-slate-300">
                                  {compBookings.length}
                                </td>
                                <td className="py-3 font-semibold text-slate-300 font-mono">
                                  ৳{grossVal.toLocaleString()}
                                </td>
                                <td className="py-3 font-bold text-[#dbaa61] font-mono">
                                  ৳{shareVal.toLocaleString()}
                                </td>
                                <td className="py-3 font-semibold text-emerald-400 font-mono">
                                  ৳{approvedWithd.toLocaleString()}
                                </td>
                                <td className="py-3 font-black text-rose-400 font-mono">
                                  ৳{dueVal.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>

              {/* DETAILED TRANSACTION LOGS TABLE */}
              <div className="bg-[#0b0c13] border border-[#1e2333] p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-4 mb-4">
                  <div className="text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-display">
                      <Clock className="w-4 h-4 text-[#dbaa61]" />
                      <span>Detailed Ledger Transactions Logs</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      অনুমোদিত কাজের হিস্ট্রি। এখানে আপনি ম্যানুয়ালি এন্ট্রি করা কোনো কাজের হিসাব সংশোধন বা ডিলিট করতে পারবেন।
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <th className="pb-3 pl-2">Job Reference</th>
                        <th className="pb-3">Model Companion</th>
                        <th className="pb-3">Date / Time</th>
                        <th className="pb-3">Location Place</th>
                        <th className="pb-3">Gross Payment</th>
                        <th className="pb-3 text-amber-200">Share (60%)</th>
                        <th className="pb-3">Notes</th>
                        <th className="pb-3 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.01]">
                      {(() => {
                        const completedList = bookings.filter((b) => b.status === 'Completed');
                        if (completedList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-500 font-medium">
                                No completed dispatches or ledger records found in database.
                              </td>
                            </tr>
                          );
                        }

                        return completedList.map((book) => {
                          const netShare = (book.cost || 0) * 0.6;
                          return (
                            <tr key={book.id} className="hover:bg-white/[0.01] transition-all">
                              <td className="py-3.5 pl-2 font-mono text-[10px] text-slate-400 font-bold">
                                {book.id}
                              </td>
                              <td className="py-3.5 text-left">
                                <span className="block font-bold text-white">{book.modelName}</span>
                                <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                                  {book.modelUsername ? `@${book.modelUsername}` : 'Direct match'}
                                </span>
                              </td>
                              <td className="py-3.5 text-slate-300 font-mono text-[11px]">
                                <span className="block">{book.date}</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5">{book.time}</span>
                              </td>
                              <td className="py-3.5 text-slate-300 font-medium text-[11px]">
                                {book.location}
                              </td>
                              <td className="py-3.5 font-bold text-slate-300 font-mono">
                                ৳{book.cost?.toLocaleString() || 0}
                              </td>
                              <td className="py-3.5 font-bold text-[#dbaa61] font-mono">
                                ৳{netShare.toLocaleString()}
                              </td>
                              <td className="py-3.5 text-slate-400 text-[11px] max-w-xs truncate" title={book.notes}>
                                {book.notes || '—'}
                              </td>
                              <td className="py-3.5 text-right pr-2">
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this completed job entry from the ledger? This will instantly adjust the model\'s balance sheet!')) {
                                      try {
                                        await deleteDoc(doc(db, 'bookings', book.id));
                                        alert('Ledger transaction entry deleted successfully!');
                                      } catch (err) {
                                        console.error('Error deleting booking:', err);
                                        alert('Failed to delete transaction.');
                                      }
                                    }
                                  }}
                                  className="p-1.5 hover:bg-rose-500/10 text-rose-500 hover:text-rose-400 rounded-lg transition active:scale-95 cursor-pointer"
                                  title="Delete transaction entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'promocodes' && (
            <div className="space-y-8 animate-fadeIn text-left">
              {/* Form & List Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Promo Code Creator Card */}
                <div className="xl:col-span-1 bg-[#0b0c13] border border-[#1e2333] p-6 rounded-2xl space-y-6">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-display">
                      <Tag className="w-4 h-4 text-[#dbaa61]" />
                      <span>{editingPromo ? 'Edit Promo Code' : 'Create Promo Code'}</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Set up custom discounts that customers can apply on the acquisition invoice page.
                    </p>
                  </div>

                  <form onSubmit={handleSavePromo} className="space-y-4">
                    {/* Promo Code Name */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wide mb-1.5 font-mono">
                        Promo Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. VIP50"
                        value={promoCodeName}
                        onChange={(e) => setPromoCodeName(e.target.value.toUpperCase())}
                        disabled={!!editingPromo}
                        className="w-full bg-[#11131c] text-xs font-mono font-bold text-white border border-[#1e2333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#dbaa61] disabled:opacity-50 uppercase tracking-widest"
                      />
                    </div>

                    {/* Discount Percentage */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wide mb-1.5 font-mono">
                        Discount Percentage (%) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        placeholder="35"
                        value={promoDiscount || ''}
                        onChange={(e) => setPromoDiscount(Number(e.target.value))}
                        className="w-full bg-[#11131c] text-xs font-mono font-bold text-white border border-[#1e2333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#dbaa61]"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wide mb-1.5 font-mono">
                        Short Description *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 35% Special VIP Discount"
                        value={promoDesc}
                        onChange={(e) => setPromoDesc(e.target.value)}
                        className="w-full bg-[#11131c] text-xs text-white border border-[#1e2333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#dbaa61]"
                      />
                    </div>

                    {/* Max Uses (Optional) */}
                    <div>
                      <label className="block text-[10px] uppercase text-slate-400 font-extrabold tracking-wide mb-1.5 font-mono">
                        Max Allowed Uses (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Unlimited if blank"
                        value={promoMaxUses}
                        onChange={(e) => setPromoMaxUses(e.target.value)}
                        className="w-full bg-[#11131c] text-xs font-mono text-white border border-[#1e2333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#dbaa61]"
                      />
                    </div>

                    {/* Is Active Status Switch */}
                    <div className="flex items-center justify-between p-3 bg-[#11131c] rounded-xl border border-[#1e2333]">
                      <div className="text-left">
                        <span className="block text-[11px] font-bold text-white">Active Status</span>
                        <span className="block text-[9.5px] text-slate-400 mt-0.5">Allow users to apply this code</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={promoIsActive}
                        onChange={(e) => setPromoIsActive(e.target.checked)}
                        className="w-4 h-4 text-[#dbaa61] bg-black border-[#1e2333] rounded focus:ring-0 cursor-pointer"
                      />
                    </div>

                    {promoCodeError && (
                      <p className="text-red-400 text-xs font-semibold bg-red-950/20 p-3 rounded-xl border border-red-500/20 leading-relaxed">
                        {promoCodeError}
                      </p>
                    )}
                    {promoCodeSuccess && (
                      <p className="text-emerald-400 text-xs font-semibold bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 leading-relaxed">
                        {promoCodeSuccess}
                      </p>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      {editingPromo && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPromo(null);
                            setPromoCodeName('');
                            setPromoDiscount(35);
                            setPromoDesc('');
                            setPromoIsActive(true);
                            setPromoMaxUses('');
                            setPromoCodeError('');
                            setPromoCodeSuccess('');
                          }}
                          className="flex-1 bg-transparent border border-[#1e2333] hover:border-slate-505 text-slate-300 font-bold text-xs py-3 rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black font-black uppercase text-[10px] tracking-widest py-3 rounded-xl hover:brightness-110 transition duration-200 shadow-md shadow-[#dbaa61]/10 cursor-pointer"
                      >
                        {editingPromo ? 'UPDATE CODE' : 'CREATE CODE'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Promo Codes List Table */}
                <div className="xl:col-span-2 bg-[#0b0c13] border border-[#1e2333] rounded-2xl overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="p-6 border-b border-[#1c2333] flex items-center justify-between">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 font-display">
                        <Percent className="w-4 h-4 text-[#dbaa61]" />
                        <span>Active Promo Codes Catalog</span>
                      </h3>
                      <span className="text-[10px] font-mono bg-red-500/10 text-red-400 font-bold px-2.5 py-1 rounded-full border border-red-500/20">
                        {adminPromoCodes.length} Total Codes
                      </span>
                    </div>

                    {adminPromoCodes.length === 0 ? (
                      <div className="p-12 text-center text-slate-500 space-y-2">
                        <Tag className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                        <p className="text-xs font-semibold">No dynamic promo codes found in database.</p>
                        <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                          Create your first promo code using the form to offer custom user acquisition discounts.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#11131c] text-slate-400 font-black uppercase text-[9.5px] tracking-wider border-b border-[#1c2333]">
                              <th className="p-4 pl-6">Code Name</th>
                              <th className="p-4">Discount</th>
                              <th className="p-4">Description</th>
                              <th className="p-4">Uses (Used/Max)</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#131722]">
                            {adminPromoCodes.map((promo) => (
                              <tr key={promo.id} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-4 pl-6 font-mono font-bold text-white tracking-widest uppercase">
                                  {promo.code}
                                </td>
                                <td className="p-4">
                                  <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono">
                                    {promo.discountPercent}% OFF
                                  </span>
                                </td>
                                <td className="p-4 text-slate-300 max-w-[150px] truncate" title={promo.description}>
                                  {promo.description}
                                </td>
                                <td className="p-4 font-mono text-slate-400 font-semibold">
                                  {promo.usedCount} / {promo.maxUses !== undefined && promo.maxUses !== null ? promo.maxUses : '∞'}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleTogglePromoStatus(promo)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase transition cursor-pointer ${
                                      promo.isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/25'
                                    }`}
                                  >
                                    {promo.isActive ? 'Active' : 'Inactive'}
                                  </button>
                                </td>
                                <td className="p-4 pr-6 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingPromo(promo);
                                      setPromoCodeName(promo.code);
                                      setPromoDiscount(promo.discountPercent);
                                      setPromoDesc(promo.description);
                                      setPromoIsActive(promo.isActive);
                                      setPromoMaxUses(promo.maxUses !== undefined && promo.maxUses !== null ? String(promo.maxUses) : '');
                                      setPromoCodeError('');
                                      setPromoCodeSuccess('');
                                    }}
                                    className="p-1.5 bg-[#1e2333]/40 border border-[#1e2333] hover:border-slate-500 text-slate-300 rounded-lg hover:text-white transition cursor-pointer inline-flex items-center"
                                    title="Edit Code"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePromo(promo.id)}
                                    className="p-1.5 bg-red-950/20 border border-red-500/20 hover:border-red-500/50 text-red-400 rounded-lg transition cursor-pointer inline-flex items-center"
                                    title="Delete Code"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'livechat' && (
            <AdminLiveChat />
          )}

        </div>

      </div>

      {/* FLOATING HIGHLIGHTED CHAT BUTTON (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setActiveTab('livechat')}
          className="relative flex flex-col items-center justify-center w-16 h-16 rounded-[22px] bg-gradient-to-tr from-[#a67c33] via-[#dbaa61] to-[#f1d087] border-2 border-black/10 hover:scale-110 hover:rotate-2 active:scale-95 transition-all duration-300 cursor-pointer group shadow-[0_4px_24px_rgba(219,170,97,0.35)]"
          aria-label="Live Support Chat"
        >
          {/* Pulsing Outer Rings */}
          <span className="absolute inset-0 rounded-[22px] bg-[#dbaa61]/25 animate-ping opacity-75 pointer-events-none" />

          {/* Exact winking smiley from image but smaller */}
          <svg viewBox="0 0 100 100" className="w-9 h-9 select-none pointer-events-none transition-transform duration-300 group-hover:scale-110">
            {/* Left eye */}
            <circle cx="34" cy="36" r="7.5" fill="black" />
            {/* Right eye (wink) */}
            <rect x="52" y="32" width="18" height="6.5" rx="2" transform="rotate(-3 61 35)" fill="black" />
            {/* Mouth loop tongue lick */}
            <path 
              d="M 33 52 C 40 64, 53 64, 58 54 C 61 50, 63 43, 59 42 C 55 41, 53 48, 54 53 C 55 58, 59 58, 61 53" 
              stroke="black" 
              strokeWidth="6" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="none"
            />
          </svg>

          {/* Dynamic Highlight badge */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-bold text-white items-center justify-center">!</span>
          </span>

          {/* Hover Tooltip/Label */}
          <div className="absolute right-18 bg-[#0a0b10]/95 backdrop-blur-md border border-[#dbaa61]/30 text-[#dbaa61] text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-xl">
            Live Support Console
          </div>
        </button>
      </div>

      {/* Custom Confirmation Dialog for Database Reset */}
      <AnimatePresence>
        {showConfirmClear && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmClear(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              className="bg-[#0e0a0a] border border-red-500/30 rounded-3xl p-6 max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.15)] space-y-6 animate-in fade-in zoom-in duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/35 flex items-center justify-center text-red-500 shrink-0">
                  <ShieldAlert className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2 text-left">
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">⚠️ SYSTEM RESET CONFIRMATION</h3>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    আপনি কি নিশ্চিত যে আপনি সকল কাস্টমার অ্যাকাউন্ট, বুকিং হিস্ট্রি এবং ট্রানজেকশন ডাটাবেজ থেকে মুছে ফেলতে চান?
                  </p>
                  <p className="text-[11px] text-red-400 font-bold leading-relaxed bg-red-950/20 p-2.5 rounded-lg border border-red-500/10">
                    এই অপারেশনটি সম্পূর্ণ অপরিবর্তনীয় এবং ডাটাবেজের সকল কাস্টমার অ্যাকাউন্ট, বুকিং হিস্ট্রি এবং পেমেন্ট রেকর্ড স্থায়ীভাবে মুছে যাবে।
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  না, ফিরে যান (Cancel)
                </button>
                <button
                  type="button"
                  onClick={executeClearClientAccounts}
                  className="px-4 py-2.5 bg-gradient-to-tr from-red-800 to-red-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >
                  হ্যাঁ, ডাটা মুছে ফেলুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert/Success Dialog */}
      <AnimatePresence>
        {resetModalMessage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetModalMessage(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              className={`border rounded-3xl p-6 max-w-md w-full relative z-10 shadow-2xl space-y-6 text-left animate-in fade-in zoom-in duration-200 ${
                resetModalMessage.type === 'success' 
                  ? 'bg-[#080d0a] border-emerald-500/30 shadow-emerald-950/25' 
                  : 'bg-[#0e0a0a] border-rose-500/30 shadow-rose-950/25'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${
                  resetModalMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/35 text-rose-500'
                }`}>
                  {resetModalMessage.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <XCircle className="w-6 h-6 animate-bounce" />
                  )}
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                    {resetModalMessage.type === 'success' ? 'SYSTEM NOTIFICATION' : 'OPERATION FAILED'}
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                    {resetModalMessage.text}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setResetModalMessage(null)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                    resetModalMessage.type === 'success'
                      ? 'bg-gradient-to-tr from-emerald-800 to-emerald-600 text-white hover:brightness-110 shadow-lg shadow-emerald-950/20'
                      : 'bg-gradient-to-tr from-rose-800 to-rose-600 text-white hover:brightness-110 shadow-lg shadow-rose-950/20'
                  }`}
                >
                  ঠিক আছে (OK)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic High-Fidelity Image Zoom Overlay */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800">
              🔍 Document Inspector / নথিপত্র পরিদর্শক (Zoomed)
            </span>
            <button
              onClick={() => {
                setZoomedImage(null);
                setZoomScale(1);
                setZoomRotation(0);
              }}
              className="p-2.5 bg-red-650 hover:bg-red-500 rounded-full text-white cursor-pointer transition-all shadow-lg active:scale-95"
              title="Close / বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive canvas / Viewport */}
          <div className="relative flex-1 w-full max-w-4xl max-h-[80vh] flex items-center justify-center overflow-hidden border border-slate-800/60 rounded-3xl bg-zinc-950/40">
            <div className="absolute inset-0 flex items-center justify-center overflow-auto p-8">
              <img
                src={zoomedImage}
                alt="Document Inspector Zoomed"
                className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-200"
                style={{
                  transform: `scale(${zoomScale}) rotate(${zoomRotation}deg)`,
                  transformOrigin: 'center center'
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Control Bar */}
          <div className="mt-5 bg-slate-900/90 border border-slate-800 px-5 py-3 rounded-2xl flex flex-wrap gap-4 items-center justify-center shadow-2xl z-50">
            <button
              onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px] font-black rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              ZOOM -
            </button>
            <span className="text-[10px] font-mono font-black text-[#dbaa61]">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(prev => Math.min(4, prev + 0.25))}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px] font-black rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              ZOOM +
            </button>
            
            <div className="w-px h-4 bg-slate-800" />

            <button
              onClick={() => setZoomRotation(prev => prev - 90)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px] font-black rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              ROTATE ↺
            </button>
            <button
              onClick={() => setZoomRotation(prev => prev + 90)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-mono text-[10px] font-black rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              ROTATE ↻
            </button>

            <div className="w-px h-4 bg-slate-800" />

            <button
              onClick={() => {
                setZoomScale(1);
                setZoomRotation(0);
              }}
              className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-[#dbaa61] border border-[#dbaa61]/25 font-mono text-[10px] font-black rounded-lg transition-all active:scale-95 cursor-pointer"
            >
              RESET / স্বাভাবিক
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
