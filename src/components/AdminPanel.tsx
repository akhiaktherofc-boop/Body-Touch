import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, getDoc, setDoc, deleteDoc, getDocFromServer, onSnapshot, collection, addDoc, updateDoc, query, where, getDocs, isRealFirebaseEnabled, initializeRealFirebase } from '../firebase';
import * as OTPAuth from 'otpauth';
import { PaymentRecord, Companion, HotelLocation, Booking, EmailLog, PaymentGateway, ParentArea, ReferralRecord, WithdrawalRecord, MemberLevel, PromoCode, MarketingTrackingSettings } from '../types';
import { clearCollection, setCloudDocument, deleteCloudDocument } from '../services/cloudService';
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
  Percent,
  Bell,
  UserPlus,
  Target,
  Download,
  FileSpreadsheet,
  FileJson,
  Calendar,
  Filter
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import AdminLiveChat from './AdminLiveChat';
import { MarketingPixelsManager } from './MarketingPixelsManager';
import { analyticsService, DEFAULT_TRACKING_SETTINGS } from '../services/analyticsService';

const formatPresenceDuration = (ms: number): string => {
  const totalSecs = Math.floor((ms || 0) / 1000);
  if (totalSecs <= 0) return '0s';
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

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
  telegramChannel?: string;
  onSetTelegramChannel?: (channel: string) => void;
  whatsappSupport?: string;
  onSetWhatsappSupport?: (whatsapp: string) => void;
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
  marketingSettings?: MarketingTrackingSettings;
  onSaveMarketingSettings?: (settings: MarketingTrackingSettings) => Promise<void>;
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

const fetchServerTimeOffset = async (): Promise<number> => {
  try {
    const start = Date.now();
    const response = await fetch('/api/time');
    if (!response.ok) throw new Error('Failed to fetch server time');
    const data = await response.json();
    const end = Date.now();
    const latency = Math.round((end - start) / 2);
    const offset = data.serverTime - (Date.now() - latency);
    console.log('[Time Sync] Calculated clock offset (ms):', offset);
    return offset;
  } catch (err) {
    console.warn('[Time Sync Warn] Falling back to 0 offset:', err);
    return 0;
  }
};

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
  telegramChannel = 'BodyTouchVIP',
  onSetTelegramChannel,
  whatsappSupport = '8801700000000',
  onSetWhatsappSupport,
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
  emergencyNotice = '‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏‡ßá‡¶∞ ‡¶®‡ßç‡¶Ø‡ßÇ‡¶®‡¶§‡¶Æ ‡ßß ‡¶ò‡¶£‡ßç‡¶ü‡¶æ ‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡ßá ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶¶‡¶ø‡¶¨‡ßá‡¶®‡•§ ‡¶∏‡¶æ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡ßá ‡¶ï‡¶•‡¶æ ‡¶®‡¶æ ‡¶¨‡¶≤‡ßá ‡¶ï‡ßç‡¶Ø‡¶æ‡¶Æ ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶¶‡¶ø‡¶¨‡ßá‡¶® ‡¶®‡¶æ',
  onSaveEmergencyNotice,
  googleSheetUrl,
  onSaveGoogleSheetUrl,
  marketingSettings,
  onSaveMarketingSettings
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

  // Live Chat Socket Settings States
  const [socketServerUrl, setSocketServerUrl] = useState('');
  const [isSavingSocketUrl, setIsSavingSocketUrl] = useState(false);
  const [socketUrlSaveSuccess, setSocketUrlSaveSuccess] = useState(false);

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
      // Load Live Chat settings
      try {
        const chatSnap = await getDoc(doc(db, 'settings', 'chat_settings'));
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          if (chatData.socketServerUrl) {
            setSocketServerUrl(chatData.socketServerUrl);
          }
        }
      } catch (chatErr) {
        console.warn('[AdminPanel] Failed to load chat settings from Firestore:', chatErr);
      }
    };
    fetchSmtpSettings();
  }, []);

  const handleSaveSmtpSettings = async () => {
    setSmtpSaveError('');
    setSmtpSaveSuccess(false);
    if (!smtpUser.trim() || !smtpPass.trim()) {
      setSmtpSaveError('‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶è‡¶¨‡¶Ç ‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶Ö‡¶¨‡¶∂‡ßç‡¶Ø‡¶á ‡¶™‡ßç‡¶∞‡¶¶‡¶æ‡¶® ‡¶ï‡¶∞‡¶§‡ßá ‡¶π‡¶¨‡ßá! (Email and Password are required.)');
      return;
    }
    if (useSeparateOtpSmtp && (!smtpOtpUser.trim() || !smtpOtpPass.trim())) {
      setSmtpSaveError('‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶ì‡¶ü‡¶ø‡¶™‡¶ø ‡¶è‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ‡¶Ü‡¶≤‡¶æ‡¶¶‡¶æ ‡¶ú‡¶ø‡¶Æ‡ßá‡¶á‡¶≤ ‡¶Ö‡¶™‡¶∂‡¶®‡¶ü‡¶ø ‡¶ö‡¶æ‡¶≤‡ßÅ ‡¶∞‡¶æ‡¶ñ‡¶≤‡ßá ‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶á‡¶â‡¶ú‡¶æ‡¶∞ ‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶è‡¶¨‡¶Ç ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™ ‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶° ‡¶Ö‡¶¨‡¶∂‡ßç‡¶Ø‡¶á ‡¶™‡ßç‡¶∞‡¶¶‡¶æ‡¶® ‡¶ï‡¶∞‡¶§‡ßá ‡¶π‡¶¨‡ßá! (Verification OTP Email and Password are required.)');
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
      setSmtpSaveError(e.message || '‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡¶§‡ßá ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶¨‡¶æ‡¶∞ ‡¶ö‡ßá‡¶∑‡ßç‡¶ü‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
    }
  };

  const handleSaveFirebaseConfig = () => {
    setFbStatusMessage(null);
    if (!fbApiKey.trim() || !fbProjectId.trim() || !fbAppId.trim()) {
      setFbStatusMessage('‚ùå API Key, Project ID, and App ID are required keys! (‡¶Ö‡¶¨‡¶∂‡ßç‡¶Ø‡¶á ‡¶™‡ßÇ‡¶∞‡¶£ ‡¶ï‡¶∞‡¶§‡ßá ‡¶π‡¶¨‡ßá)');
      return;
    }
    const config = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.appspot.com`,
      messagingSenderId: fbMessagingSenderId.trim(),
      appId: fbAppId.trim()
    };
    try {
      localStorage.setItem('bodytouch_firebase_config', JSON.stringify(config));
      const success = initializeRealFirebase(config);
      if (success) {
        setFbStatusMessage('‚úÖ Firebase configuration saved and loaded! (‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶ï‡ßç‡¶≤‡¶æ‡¶â‡¶° ‡¶°‡ßá‡¶ü‡¶æ‡¶¨‡ßá‡¶ú‡ßá ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶π‡ßü‡ßá‡¶õ‡ßá)');
      } else {
        setFbStatusMessage('‚ö†Ô∏è Config saved to local memory, but real-time validation failed. Please verify credentials!');
      }
    } catch (e: any) {
      setFbStatusMessage(`‚ùå Error: ${e.message || 'Failed to initialize Firebase'}`);
    }
  };

  const handleClearFirebaseConfig = () => {
    if (window.confirm('‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶∏‡¶§‡ßç‡¶Ø‡¶ø‡¶á ‡¶ï‡ßç‡¶≤‡¶æ‡¶â‡¶° ‡¶°‡ßá‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶ï‡¶æ‡¶®‡ßá‡¶ï‡¶∂‡¶® ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡ßá ‡¶Ö‡¶´‡¶≤‡¶æ‡¶á‡¶®/‡¶π‡ßã‡¶∏‡ßç‡¶ü‡¶ø‡¶Ç‡¶ó‡¶æ‡¶∞ ‡¶≤‡ßã‡¶ï‡¶æ‡¶≤ ‡¶Æ‡ßá‡¶Æ‡ßã‡¶∞‡¶ø ‡¶Æ‡ßã‡¶°‡ßá ‡¶´‡¶ø‡¶∞‡ßá ‡¶Ø‡ßá‡¶§‡ßá ‡¶ö‡¶æ‡¶®?')) {
      localStorage.removeItem('bodytouch_firebase_config');
      setFbApiKey('');
      setFbAuthDomain('');
      setFbProjectId('');
      setFbStorageBucket('');
      setFbMessagingSenderId('');
      setFbAppId('');
      setFbStatusMessage('‚ö†Ô∏è Disconnected: Cloud sync disabled. Offline/Local memory mode is now active.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleSaveSocketSettings = async () => {
    setIsSavingSocketUrl(true);
    setSocketUrlSaveSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'chat_settings'), {
        socketServerUrl: socketServerUrl.trim()
      }, { merge: true });
      localStorage.setItem('bt_socket_server_url', socketServerUrl.trim());
      setSocketUrlSaveSuccess(true);
      setTimeout(() => setSocketUrlSaveSuccess(false), 3000);
    } catch (err) {
      console.error('[AdminPanel] Failed to save chat settings:', err);
      alert('Error saving socket URL: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingSocketUrl(false);
    }
  };

  const handleClearSocketSettings = async () => {
    if (confirm("Are you sure you want to reset the Live Chat Socket Server URL to default (same origin)?")) {
      setIsSavingSocketUrl(true);
      try {
        await setDoc(doc(db, 'settings', 'chat_settings'), {
          socketServerUrl: ""
        }, { merge: true });
        setSocketServerUrl("");
        localStorage.removeItem('bt_socket_server_url');
        alert("Live Chat Socket URL reset to default!");
      } catch (err) {
        console.error('[AdminPanel] Failed to reset chat settings:', err);
      } finally {
        setIsSavingSocketUrl(false);
      }
    }
  };

  const handleDownloadFirebaseConfigJson = () => {
    const config = {
      apiKey: fbApiKey.trim(),
      authDomain: fbAuthDomain.trim() || `${fbProjectId.trim()}.firebaseapp.com`,
      projectId: fbProjectId.trim(),
      storageBucket: fbStorageBucket.trim() || `${fbProjectId.trim()}.appspot.com`,
      messagingSenderId: fbMessagingSenderId.trim(),
      appId: fbAppId.trim()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "firebase_config.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
      alert("‡¶¨‡¶æ‡¶ß‡ßç‡¶Ø‡¶§‡¶æ‡¶Æ‡ßÇ‡¶≤‡¶ï: ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶¨‡¶æ ‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞‡ßá‡¶∞ ‡¶è‡¶ï‡¶ü‡¶ø ‡¶∏‡¶†‡¶ø‡¶ï ‡¶õ‡¶¨‡¶ø‡¶∞ ‡¶≤‡¶ø‡¶ô‡ßç‡¶ï (Photo URL) ‡¶¶‡¶ø‡¶®‡•§");
      return;
    }
    if (!slideTitle.trim()) {
      alert("‡¶¨‡¶æ‡¶ß‡ßç‡¶Ø‡¶§‡¶æ‡¶Æ‡ßÇ‡¶≤‡¶ï: ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡ßá‡¶∞ ‡¶™‡ßç‡¶∞‡¶ß‡¶æ‡¶® ‡¶≤‡ßá‡¶ñ‡¶æ ‡¶¨‡¶æ ‡¶ü‡¶æ‡¶á‡¶ü‡ßá‡¶≤ (Title) ‡¶¶‡¶ø‡¶®‡•§");
      return;
    }

    try {
      setSliderStatusMsg('‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶π‡¶ö‡ßç‡¶õ‡ßá...');
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
      setSliderStatusMsg('‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶§‡¶•‡ßç‡¶Ø‡¶ü‡¶ø ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú‡ßá ‡¶∏‡ßá‡¶≠ ‡¶π‡ßü‡ßá‡¶õ‡ßá!');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡¶§‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá: ' + err.message);
      setSliderStatusMsg('');
    }
  };

  const handleDeleteSlide = async (idToDelete: string | number) => {
    const confirmDelete = window.confirm("‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§‡¶≠‡¶æ‡¶¨‡ßá ‡¶è‡¶á ‡¶õ‡¶¨‡¶ø‡¶∞ ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶ü‡¶ø ‡¶°‡¶ø‡¶≤‡¶ø‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶ö‡¶æ‡¶®?");
    if (!confirmDelete) return;

    try {
      setSliderStatusMsg('‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶°‡¶ø‡¶≤‡¶ø‡¶ü ‡¶π‡¶ö‡ßç‡¶õ‡ßá...');
      const updatedSlides = sliderSlides.filter(s => s.id !== idToDelete);
      await setDoc(doc(db, 'settings', 'hero_slides'), { slides: updatedSlides }, { merge: true });
      setSliderStatusMsg('‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶ü‡¶ø ‡¶∏‡¶∞‡¶æ‡¶®‡ßã ‡¶π‡ßü‡ßá‡¶õ‡ßá!');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('‡¶°‡¶ø‡¶≤‡¶ø‡¶ü ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡ßü‡ßá‡¶õ‡ßá: ' + err.message);
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
        text: "‚úÖ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡ßá‡¶∞ ‡¶∏‡¶ï‡¶≤ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü (users), ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶π‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø (bookings), ‡¶ü‡ßç‡¶∞‡¶æ‡¶®‡¶ú‡ßá‡¶ï‡¶∂‡¶® ‡¶™‡ßá‡¶Æ‡ßá‡¶®‡ßç‡¶ü ‡¶∞‡ßá‡¶ï‡¶∞‡ßç‡¶° (payments), ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶∞‡ßá‡¶ú‡¶ø‡¶∏‡ßç‡¶ü‡¶æ‡¶∞‡ßç‡¶° ‡¶Æ‡¶°‡ßá‡¶≤ (companions), ‡¶∞‡¶ø‡¶≠‡¶ø‡¶â‡¶ú (reviews), ‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶è‡¶¨‡¶Ç ‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶≤‡¶ó ‡¶è‡¶ï‡¶¶‡¶Æ ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá! ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™‡¶ü‡¶ø ‡¶è‡¶ñ‡¶® ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶®‡¶§‡ßÅ‡¶® (Fresh Launch) ‡¶Ö‡¶¨‡¶∏‡ßç‡¶•‡¶æ‡ßü ‡¶∞‡ßü‡ßá‡¶õ‡ßá‡•§"
      });
    } catch (err: any) {
      console.error(err);
      setResetModalMessage({
        type: 'error',
        text: "‚ùå ‡¶°‡¶æ‡¶ü‡¶æ ‡¶ï‡ßç‡¶≤‡¶ø‡ßü‡¶æ‡¶∞ ‡¶ï‡¶∞‡¶§‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶¨‡¶æ‡¶∞ ‡¶ö‡ßá‡¶∑‡ßç‡¶ü‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§"
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
  const [showReset2FAInput, setShowReset2FAInput] = useState(false);
  const [reset2FAPassword, setReset2FAPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpTempEnrollEmail, setTotpTempEnrollEmail] = useState('');
  const [totpInputCode, setTotpInputCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupInputCode, setBackupInputCode] = useState('');
  const [confirm2FAResetEmail, setConfirm2FAResetEmail] = useState<string | null>(null);
  const [confirmRemoveEmail, setConfirmRemoveEmail] = useState<string | null>(null);

  // Active presence monitoring list for blue indicators & active duration timers
  const [activePresenceList, setActivePresenceList] = useState<any[]>([]);

  useEffect(() => {
    if (!adminEmail) return;

    const sendHeartbeatAndFetch = async () => {
      try {
        const hbRes = await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: adminEmail,
            role: 'admin',
            label: adminEmail
          })
        });
        if (hbRes.ok) {
          const data = await hbRes.json();
          if (data.success && data.activeSessions) {
            setActivePresenceList(data.activeSessions);
          }
        }
      } catch (err) {
        console.warn("Presence sync err:", err);
      }
    };

    sendHeartbeatAndFetch();
    const hbInterval = setInterval(sendHeartbeatAndFetch, 5000);

    // Smooth second-by-second active duration increment ticker
    const timerInterval = setInterval(() => {
      setActivePresenceList(prev => {
        if (!prev || prev.length === 0) return [];
        return prev.map(s => ({
          ...s,
          activeDurationMs: (s.activeDurationMs || 0) + 1000
        }));
      });
    }, 1000);

    return () => {
      clearInterval(hbInterval);
      clearInterval(timerInterval);
    };
  }, [adminEmail]);
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
        alert("‡¶≤‡ßã‡¶ó‡ßã ‡¶ï‡ßç‡¶∞‡¶™ ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶™‡ßç‡¶∞‡¶ï‡ßç‡¶∞‡¶ø‡ßü‡¶æ ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ö‡¶®‡ßç‡¶Ø ‡¶õ‡¶¨‡¶ø ‡¶¶‡¶ø‡ßü‡ßá ‡¶ö‡ßá‡¶∑‡ßç‡¶ü‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§");
      } finally {
        setIsProcessingCrop(false);
      }
    };
    img.onerror = () => {
      setIsProcessingCrop(false);
      alert("‡¶õ‡¶¨‡¶ø ‡¶•‡ßá‡¶ï‡ßá ‡¶á‡¶Æ‡ßá‡¶ú ‡¶°‡¶æ‡¶ü‡¶æ ‡¶∞‡¶ø‡¶° ‡¶ï‡¶∞‡¶§‡ßá ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§");
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
    
    if ((!list || list.length === 0) && !localStorage.getItem('bt_admin_emails_seeded')) {
      list = [
        { email: '16killer2@gmail.com', telegram: '@secure_super_admin', role: 'super_admin' },
        { email: 'akhi.akther.ofc@gmail.com', telegram: '@developer_akhi', role: 'super_admin' }
      ];
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
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        list.push({ email: docSnap.id || data.email, ...data });
      });
      
      // If collection is completely uninitialized on first fresh launch
      if (list.length === 0 && !localStorage.getItem('bt_admin_emails_seeded')) {
        const defaultAdmins: AdminUser[] = [
          { email: '16killer2@gmail.com', telegram: '@secure_super_admin', role: 'super_admin' },
          { email: 'akhi.akther.ofc@gmail.com', telegram: '@developer_akhi', role: 'super_admin' }
        ];
        localStorage.setItem('bt_admin_emails_seeded', 'true');
        for (const admin of defaultAdmins) {
          try {
            await setDoc(doc(db, 'admin_emails', admin.email.toLowerCase()), {
              email: admin.email.toLowerCase(),
              telegram: admin.telegram,
              role: admin.role
            }, { merge: true });
          } catch (err) {
            console.error("Failed to seed admin:", admin.email, err);
          }
        }
      } else if (list.length > 0) {
        localStorage.setItem('bt_admin_emails_seeded', 'true');
        setAdminEmails(list);
        localStorage.setItem('bt_admin_emails_v3', JSON.stringify(list));
      } else {
        setAdminEmails([]);
        localStorage.setItem('bt_admin_emails_v3', JSON.stringify([]));
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
      // 1. Delete old admins who are no longer in the updated list
      for (const oldAdmin of adminEmails) {
        const cleanOldEmail = (oldAdmin.email || '').toLowerCase().trim();
        const stillExists = updated.some(u => (u.email || '').toLowerCase().trim() === cleanOldEmail);
        if (!stillExists && cleanOldEmail) {
          await deleteDoc(doc(db, 'admin_emails', cleanOldEmail));
          await deleteCloudDocument('admin_emails', cleanOldEmail);
          await deleteDoc(doc(db, 'admin_passwords', cleanOldEmail));
          await deleteDoc(doc(db, 'admin_totp_secrets', cleanOldEmail));
        }
      }

      // 2. Set/update all current admins in database
      for (const newAdmin of updated) {
        const cleanNewEmail = (newAdmin.email || '').toLowerCase().trim();
        if (cleanNewEmail) {
          await setDoc(doc(db, 'admin_emails', cleanNewEmail), {
            email: cleanNewEmail,
            telegram: newAdmin.telegram || '',
            role: newAdmin.role || 'admin'
          }, { merge: true });
          await setCloudDocument('admin_emails', cleanNewEmail, {
            email: cleanNewEmail,
            telegram: newAdmin.telegram || '',
            role: newAdmin.role || 'admin'
          });
        }
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
      setAuthError('‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡ß®-‡¶∏‡ßç‡¶ü‡ßá‡¶™ ‡¶®‡¶ø‡¶∞‡¶æ‡¶™‡¶§‡ßç‡¶§‡¶æ ‡¶Ø‡¶æ‡¶ö‡¶æ‡¶á‡¶ï‡¶∞‡¶£‡ßá ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶•‡¶§‡¶æ ‡¶§‡ßà‡¶∞‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶´‡¶æ‡ßü‡¶æ‡¶∞‡¶∏‡ßç‡¶ü‡ßã‡¶∞ ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶∏‡¶Ç‡¶Ø‡ßã‡¶ó ‡¶ö‡ßá‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = totpInputCode.trim();

    if (!cleanCode) {
      setAuthError('‡ß¨ ‡¶∏‡¶Ç‡¶ñ‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶Ö‡¶•‡ßá‡¶®‡¶ü‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶™‡ßç‡¶∞‡¶¨‡ßá‡¶∂ ‡¶ï‡¶∞‡¶æ‡¶®‡•§');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      // Synchronize precise time offset from NTP-locked server container clock
      const offset = await fetchServerTimeOffset();
      const nowWithOffset = Date.now() + offset;

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
      const isValid = totp.validate({ token: cleanCode, window: 12, timestamp: nowWithOffset }) !== null;

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
        setAuthError('‡¶≠‡ßÅ‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶ï‡ßã‡¶°! ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™‡ßá‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶ü‡¶æ‡¶á‡¶Æ ‡¶ö‡ßá‡¶ï ‡¶ï‡¶∞‡ßá ‡¶∏‡¶†‡¶ø‡¶ï ‡ß¨ ‡¶∏‡¶Ç‡¶ñ‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶°‡¶æ‡¶á‡¶®‡¶æ‡¶Æ‡¶ø‡¶ï ‡¶ï‡ßã‡¶° ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®‡•§');
      }
    } catch (err: any) {
      console.error('[TOTP Setup Sync Error]', err);
      setAuthError('‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶∏‡¶ø‡¶ô‡ßç‡¶ï ‡¶ï‡¶∞‡¶§‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶¨‡¶æ‡¶∞ ‡¶ö‡ßá‡¶∑‡ßç‡¶ü‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPActive = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = useBackupCode ? backupInputCode.trim() : totpInputCode.trim();

    if (!cleanCode) {
      setAuthError(useBackupCode ? '‡ßÆ ‡¶∏‡¶Ç‡¶ñ‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶ì‡ßü‡¶æ‡¶®-‡¶ü‡¶æ‡¶á‡¶Æ ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶° ‡¶™‡ßç‡¶∞‡¶¨‡ßá‡¶∂ ‡¶ï‡¶∞‡¶æ‡¶®‡•§' : '‡ß¨ ‡¶∏‡¶Ç‡¶ñ‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶ï‡ßã‡¶° ‡¶™‡ßç‡¶∞‡¶¨‡ßá‡¶∂ ‡¶ï‡¶∞‡¶æ‡¶®‡•§');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      if (useBackupCode) {
        const cleanBackup = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanBackup.length !== 8) {
          setAuthError('‡¶≠‡ßÅ‡¶≤ ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶° ‡¶´‡¶∞‡¶Æ‡ßç‡¶Ø‡¶æ‡¶ü! ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶Ö‡¶¨‡¶∂‡ßç‡¶Ø‡¶á ‡ßÆ ‡¶∏‡¶Ç‡¶ñ‡ßç‡¶Ø‡¶æ‡¶∞ ‡¶¨‡¶æ ‡¶Ö‡¶ï‡ßç‡¶∑‡¶∞‡ßá‡¶∞ ‡¶π‡¶§‡ßá ‡¶π‡¶¨‡ßá‡•§');
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
          alert('‚úÖ ‡¶á‡¶Æ‡¶æ‡¶∞‡ßç‡¶ú‡ßá‡¶®‡ßç‡¶∏‡¶ø ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶° ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Ø‡¶æ‡¶ö‡¶æ‡¶á ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!');
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
            alert('‚úÖ ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶° ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶Ø‡¶æ‡¶ö‡¶æ‡¶á ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá! ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶ì‡ßü‡¶æ‡¶®-‡¶ü‡¶æ‡¶á‡¶Æ ‡¶õ‡¶ø‡¶≤ ‡¶è‡¶¨‡¶Ç ‡¶è‡¶ñ‡¶® ‡¶è‡¶ü‡¶ø ‡¶∏‡ßç‡¶•‡¶æ‡ßü‡ßÄ‡¶≠‡¶æ‡¶¨‡ßá ‡¶¨‡¶æ‡¶§‡¶ø‡¶≤ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§');
            return;
          }
        }
        setAuthError('‡¶≠‡ßÅ‡¶≤ ‡¶¨‡¶æ ‡¶Ö‡¶¨‡ßç‡¶Ø‡¶¨‡¶π‡ßÉ‡¶§ ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶°! ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡¶æ ‡¶∏‡¶†‡¶ø‡¶ï ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶™‡ßç‡¶∞‡¶¨‡ßá‡¶∂ ‡¶ï‡¶∞‡¶æ‡¶®‡•§');
        setIsSending(false);
        return;
      }

      // Synchronize precise time offset from NTP-locked server container clock
      const offset = await fetchServerTimeOffset();
      const nowWithOffset = Date.now() + offset;

      const totp = new OTPAuth.TOTP({
        issuer: 'BodyTouch',
        label: normalizedEmail,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret)
      });

      // Strictly validate using Google Authenticator token, no bypass codes permitted
      const isValid = totp.validate({ token: cleanCode, window: 12, timestamp: nowWithOffset }) !== null;

      if (isValid) {
        // Log in
        sessionStorage.setItem('metro_maa_admin_auth', 'true');
        setIsAuth(true);
        setAdminEmail(totpTempEnrollEmail);
        localStorage.setItem('metro_maa_admin_validated_email', normalizedEmail);
        setTotpInputCode('');
        setAuthError('');
      } else {
        setAuthError('‡¶≠‡ßÅ‡¶≤ ‡ß®-‡¶∏‡ßç‡¶ü‡ßá‡¶™ ‡¶®‡¶ø‡¶∞‡¶æ‡¶™‡¶§‡ßç‡¶§‡¶æ ‡¶ï‡ßã‡¶°! ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™‡ßá ‡¶¶‡ßá‡¶ñ‡¶æ‡¶®‡ßã ‡¶¨‡¶∞‡ßç‡¶§‡¶Æ‡¶æ‡¶® ‡¶∏‡¶ö‡¶≤ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶∏‡¶†‡¶ø‡¶ï‡¶≠‡¶æ‡¶¨‡ßá ‡¶ü‡¶æ‡¶á‡¶™ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
      }
    } catch (err: any) {
      console.error('[TOTP Validation Error]', err);
      setAuthError('‡¶ï‡ßã‡¶° ‡¶Ø‡¶æ‡¶ö‡¶æ‡¶á‡¶ï‡¶∞‡¶£‡ßá ‡¶∏‡¶æ‡¶Æ‡ßü‡¶ø‡¶ï ‡¶§‡ßç‡¶∞‡ßÅ‡¶ü‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶¨‡¶æ‡¶∞ ‡¶ö‡ßá‡¶∑‡ßç‡¶ü‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
    } finally {
      setIsSending(false);
    }
  };
  const handleCustomEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (!normalizedEmail) {
      setAuthError('‡¶¶‡ßü‡¶æ ‡¶ï‡¶∞‡ßá ‡¶è‡¶ï‡¶ü‡¶ø ‡¶∏‡¶†‡¶ø‡¶ï ‡¶á‡¶Æ‡ßá‡¶≤ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡ßç‡¶∞‡ßá‡¶∏ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®‡•§');
      return;
    }
    if (!cleanPassword) {
      setAuthError('‡¶¶‡ßü‡¶æ ‡¶ï‡¶∞‡ßá ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®‡•§');
      return;
    }

    const isAllowed = adminEmails.some(a => a.email.toLowerCase() === normalizedEmail);
    if (!isAllowed) {
      setAuthError('‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏‡ßá‡¶∏ ‡¶Ö‡¶∏‡ßç‡¶¨‡ßÄ‡¶ï‡ßÉ‡¶§! ‡¶è‡¶á ‡¶á‡¶Æ‡ßá‡¶≤‡¶ü‡¶ø ‡¶Ö‡¶®‡ßÅ‡¶Æ‡ßã‡¶¶‡¶ø‡¶§ ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ‡ßü ‡¶®‡¶ø‡¶¨‡¶®‡ßç‡¶ß‡¶ø‡¶§ ‡¶®‡ßü‡•§');
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
          setAuthError('‡¶è‡¶á ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü‡ßá ‡¶ï‡ßã‡¶®‡ßã ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶á‡¶ú‡¶° ‡¶¨‡¶æ ‡¶∏‡ßá‡¶ü‡¶Ü‡¶™ ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡¶®‡¶ø! ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶∏‡ßÅ‡¶™‡¶æ‡¶∞ ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶¶‡ßç‡¶¨‡¶æ‡¶∞‡¶æ ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤ ‡¶•‡ßá‡¶ï‡ßá ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶ø‡ßü‡ßá ‡¶®‡¶ø‡¶®‡•§');
          setIsSending(false);
          return;
        }
      }

      if (cleanPassword === correctPassword) {
        await checkAndProceedTOTP(normalizedEmail);
      } else {
        setAuthError('‡¶≠‡ßÅ‡¶≤ ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°! ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶∏‡¶†‡¶ø‡¶ï ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶¶‡¶ø‡ßü‡ßá ‡¶™‡ßÅ‡¶®‡¶∞‡¶æ‡ßü ‡¶ö‡ßá‡¶∑‡ßç‡¶ü‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
      }
    } catch (err: any) {
      console.error('[Custom Auth Error]', err);
      setAuthError('‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶Ø‡¶æ‡¶ö‡¶æ‡¶á‡¶ï‡¶∞‡¶£‡ßá ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶•‡¶§‡¶æ ‡¶∞‡ßÇ‡¶™ ‡¶®‡¶ø‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶á‡¶®‡ßç‡¶ü‡¶æ‡¶∞‡¶®‡ßá‡¶ü ‡¶∏‡¶Ç‡¶Ø‡ßã‡¶ó ‡¶ö‡ßá‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetOwn2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanPassword = reset2FAPassword.trim();

    if (!cleanPassword) {
      setAuthError('‡ß®FA ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°‡¶ü‡¶ø ‡¶™‡ßç‡¶∞‡¶¶‡¶æ‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      const passDocRef = doc(db, 'admin_passwords', normalizedEmail);
      const passSnap = await getDoc(passDocRef);
      let correctPassword = '';

      if (passSnap.exists()) {
        correctPassword = passSnap.data().password;
      } else {
        if (normalizedEmail === '16killer2@gmail.com' || normalizedEmail === 'akhi.akther.ofc@gmail.com') {
          correctPassword = '16killer2@admin';
        } else {
          setAuthError('‡¶è‡¶á ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü‡ßá ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶®‡ßá‡¶á‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶∏‡ßÅ‡¶™‡¶æ‡¶∞ ‡¶è‡¶°‡¶Æ‡¶ø‡¶®‡ßá‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶Ø‡ßã‡¶ó‡¶æ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
          setIsSending(false);
          return;
        }
      }

      if (cleanPassword === correctPassword) {
        // Delete the totp secret to force setup again
        await deleteDoc(doc(db, 'admin_totp_secrets', normalizedEmail));
        
        // Generate a new 16-char base32 secret
        const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let randomSecret = '';
        for (let i = 0; i < 16; i++) {
          randomSecret += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        
        setTotpSecret(randomSecret);
        setAuthStep('totp_setup');
        setShowReset2FAInput(false);
        setReset2FAPassword('');
        setTotpInputCode('');
        alert('‚úÖ ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡ß®-‡¶∏‡ßç‡¶ü‡ßá‡¶™ ‡¶®‡¶ø‡¶∞‡¶æ‡¶™‡¶§‡ßç‡¶§‡¶æ ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá! ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™‡ßá ‡¶®‡¶§‡ßÅ‡¶® ‡¶ï‡¶ø‡¶â‡¶Ü‡¶∞ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶∏‡ßç‡¶ï‡ßç‡¶Ø‡¶æ‡¶® ‡¶ï‡¶∞‡ßá ‡¶®‡¶ø‡¶®‡•§');
      } else {
        setAuthError('‡¶≠‡ßÅ‡¶≤ ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°! ‡ß®FA ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶∏‡¶†‡¶ø‡¶ï ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶™‡ßç‡¶∞‡¶¶‡¶æ‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
      }
    } catch (err: any) {
      console.error('[Reset Own 2FA Error]', err);
      setAuthError('‡ß®FA ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶∏‡¶Ç‡¶Ø‡ßã‡¶ó ‡¶¨‡¶æ ‡¶á‡¶®‡ßç‡¶ü‡¶æ‡¶∞‡¶®‡ßá‡¶ü ‡¶ö‡ßá‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetAgent2FA = async (username: string) => {
    if (!window.confirm(`‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶∏‡¶§‡ßç‡¶Ø‡¶ø‡¶á ‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü @${username} ‡¶è‡¶∞ ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡ß®-‡¶∏‡ßç‡¶ü‡ßá‡¶™ ‡¶®‡¶ø‡¶∞‡¶æ‡¶™‡¶§‡ßç‡¶§‡¶æ ‡¶∏‡¶ø‡¶ï‡ßç‡¶∞‡ßá‡¶ü ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶ö‡¶æ‡¶®? ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶≤‡ßá ‡¶§‡¶ø‡¶®‡¶ø ‡¶§‡¶æ‡¶∞ ‡¶™‡¶∞‡¶¨‡¶∞‡ßç‡¶§‡ßÄ ‡¶≤‡¶ó‡¶á‡¶®‡ßá ‡¶®‡¶§‡ßÅ‡¶® ‡¶ï‡¶∞‡ßá ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶ï‡¶ø ‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡¶¨‡ßá‡¶®‡•§`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'agent_totp_secrets', username.trim().toLowerCase()));
      alert(`‚úÖ ‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü @${username} ‡¶è‡¶∞ ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡ß®FA ‡¶∏‡¶ø‡¶ï‡ßç‡¶∞‡ßá‡¶ü ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!`);
    } catch (err) {
      console.error(err);
      alert('‡ß®FA ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶Ø‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§ ‡¶¶‡ßü‡¶æ ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶¨‡¶æ‡¶∞ ‡¶ö‡ßá‡¶∑‡ßç‡¶ü‡¶æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§');
    }
  };

  const handleDeleteAgent = async (username: string) => {
    const cleanUser = (username || '').trim().toLowerCase();
    if (!cleanUser) return;
    if (!window.confirm(`‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶∏‡¶§‡ßç‡¶Ø‡¶ø‡¶á ‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü @${username} ‡¶ï‡ßá ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£‡¶≠‡¶æ‡¶¨‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶§‡ßá ‡¶ö‡¶æ‡¶®? ‡¶è‡¶ü‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§ ‡¶ï‡¶∞‡¶≤‡ßá ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü‡ßá‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü, ‡¶™‡¶ø‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°, ‡ß®FA ‡¶è‡¶¨‡¶Ç ‡¶∞‡ßá‡¶´‡¶æ‡¶∞‡¶æ‡¶≤ ‡¶∞‡ßá‡¶ï‡¶∞‡ßç‡¶° ‡¶∏‡ßç‡¶•‡¶æ‡ßü‡ßÄ‡¶≠‡¶æ‡¶¨‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá‡•§`)) {
      return;
    }
    try {
      setIsSending(true);
      // 1. Delete from agents collection in Firestore / Emulation DB
      await deleteDoc(doc(db, 'agents', cleanUser));
      await deleteCloudDocument('agents', cleanUser);
      
      // 2. Delete Agent credentials & 2FA
      await deleteDoc(doc(db, 'agent_totp_secrets', cleanUser));
      await deleteDoc(doc(db, 'agent_passwords', cleanUser));
      
      // 3. Clear recruiter link from companions if present
      const updatedComps = companions.map(c => {
        const rec = (c.recruiter || c.telegram || '').trim().toLowerCase();
        if (rec === cleanUser || rec === `@${cleanUser}`) {
          return { ...c, recruiter: '', telegram: '' };
        }
        return c;
      });
      onUpdateCompanions(updatedComps);

      // 4. Update local state
      setRegisteredAgents(prev => prev.filter(a => (a.username || a.id || '').toLowerCase() !== cleanUser));
      
      // 5. Clean localStorage agent registrations
      const localAgentsStr = localStorage.getItem('bt_registered_agents');
      if (localAgentsStr) {
        try {
          const parsed = JSON.parse(localAgentsStr);
          const filtered = parsed.filter((a: any) => (a.username || '').toLowerCase() !== cleanUser);
          localStorage.setItem('bt_registered_agents', JSON.stringify(filtered));
        } catch (e) {}
      }

      alert(`‚úÖ ‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü @${username} ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!`);
    } catch (err: any) {
      console.error('Failed to delete agent:', err);
      alert(`‚ùå ‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü ‡¶Æ‡ßÅ‡¶õ‡¶§‡ßá ‡¶¨‡ßç‡¶Ø‡¶∞‡ßç‡¶• ‡¶π‡ßü‡ßá‡¶õ‡ßá: ${err.message || err}`);
    } finally {
      setIsSending(false);
    }
  };

  // Render High Security Portal Gate if not authenticated - MOVED BELOW HOOKS TO COMPLY WITH REACT HOOK RULES

  // Tabs configured to align with User's specific requirements
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'memberships' | 'partners' | 'media' | 'orders' | 'hotels' | 'smtp' | 'cities' | 'gateways' | 'admins' | 'verification' | 'shortlinks' | 'referrals' | 'livechat' | 'promocodes' | 'model_ledger' | 'broadcast_notifications' | 'visitors' | 'marketing'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Marketing & Tracking Pixels state & persistence
  const [currentMarketingSettings, setCurrentMarketingSettings] = useState<MarketingTrackingSettings>(() => {
    if (marketingSettings) return marketingSettings;
    try {
      const saved = localStorage.getItem('bt_marketing_pixels');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_TRACKING_SETTINGS;
  });

  useEffect(() => {
    if (marketingSettings) {
      setCurrentMarketingSettings(marketingSettings);
    }
  }, [marketingSettings]);

  useEffect(() => {
    const fetchMarketingSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'marketing_pixels');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as MarketingTrackingSettings;
          setCurrentMarketingSettings(data);
          localStorage.setItem('bt_marketing_pixels', JSON.stringify(data));
          analyticsService.initMarketingPixels(data);
        }
      } catch (e) {
        console.warn('Failed to load marketing settings in AdminPanel:', e);
      }
    };
    fetchMarketingSettings();
  }, []);

  const handleSaveMarketingSettingsInternal = async (updated: MarketingTrackingSettings) => {
    try {
      setCurrentMarketingSettings(updated);
      localStorage.setItem('bt_marketing_pixels', JSON.stringify(updated));
      const docRef = doc(db, 'settings', 'marketing_pixels');
      await setDoc(docRef, updated, { merge: true });
      if (onSaveMarketingSettings) {
        await onSaveMarketingSettings(updated);
      }
      analyticsService.initMarketingPixels(updated);
    } catch (err) {
      console.error('Failed to save marketing tracking settings:', err);
      throw err;
    }
  };

  // Broadcast & Push Notification states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'success' | 'alert' | 'booking' | 'system'>('info');
  const [broadcastTargetUser, setBroadcastTargetUser] = useState(''); // empty for all users (global)
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // New Client real-time notifications
  const [liveNotifications, setLiveNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('bt_admin_live_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('bt_admin_live_notifications', JSON.stringify(liveNotifications));
  }, [liveNotifications]);

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const isFirstLoadUsers = useRef(true);
  const previousUserIds = useRef<Set<string>>(new Set());

  // Visitor Telemetry & History Log States (Strict 3-Day Rolling Window Retention)
  const [visitorLogs, setVisitorLogs] = useState<any[]>([]);
  const [isVisitorLogsLoading, setIsVisitorLogsLoading] = useState(false);
  const [visitorDateFilterType, setVisitorDateFilterType] = useState<'all' | 'today' | 'yesterday' | 'two_days_ago' | 'custom'>('all');
  const [visitorStartDate, setVisitorStartDate] = useState('');
  const [visitorEndDate, setVisitorEndDate] = useState('');
  const [visitorSearchQuery, setVisitorSearchQuery] = useState('');

  // Helper to get Bangladesh date strings (UTC+6)
  const getBDDateString = (dayOffset = 0) => {
    const target = new Date(Date.now() + (6 * 60 * 60 * 1000) - (dayOffset * 24 * 60 * 60 * 1000));
    return target.toISOString().split('T')[0];
  };

  const fetchVisitorLogs = async (quiet = false) => {
    if (!quiet) setIsVisitorLogsLoading(true);
    try {
      let logsData = null;
      let usePhpFallback = false;

      try {
        const res = await fetch('/api/admin/visitors');
        if (res.ok) {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            if (data && data.success && data.logs) {
              logsData = data.logs;
            } else {
              usePhpFallback = true;
            }
          } catch (_) {
            usePhpFallback = true;
          }
        } else {
          usePhpFallback = true;
        }
      } catch (_) {
        usePhpFallback = true;
      }

      if (usePhpFallback) {
        try {
          const res = await fetch('/get-visitors.php');
          if (res.ok) {
            const text = await res.text();
            try {
              const data = JSON.parse(text);
              if (data && data.success && data.logs) {
                logsData = data.logs;
              }
            } catch (_) {}
          }
        } catch (phpErr) {
          console.error('Failed to fetch visitor logs from PHP fallback:', phpErr);
        }
      }

      if (logsData && Array.isArray(logsData)) {
        // Enforce 3-day retention limit strictly in state (3 * 24 * 60 * 60 * 1000 = 259200000ms)
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const valid3DayLogs = logsData.filter((log: any) => {
          if (!log) return false;
          if (log.timestamp) {
            const t = new Date(log.timestamp).getTime();
            if (!isNaN(t) && (now - t > THREE_DAYS_MS)) return false;
          }
          const p = (log.path || '').toLowerCase();
          return !p.includes('admin') && !p.includes('turmarheda');
        });

        // Sort by timestamp descending (newest first)
        const sorted = [...valid3DayLogs].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setVisitorLogs(sorted);
      }
    } catch (e) {
      console.error('Failed to fetch visitor logs:', e);
    } finally {
      if (!quiet) setIsVisitorLogsLoading(false);
    }
  };

  // Export Visitor Logs to CSV / Excel
  const exportVisitorLogsToCSV = (logsToExport: any[], customFilename?: string) => {
    if (!logsToExport || logsToExport.length === 0) {
      alert('‡¶°‡¶æ‡¶â‡¶®‡¶≤‡ßã‡¶° ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶Æ‡¶§‡ßã ‡¶ï‡ßã‡¶®‡ßã ‡¶≠‡¶ø‡¶ú‡¶ø‡¶ü‡¶∞ ‡¶°‡¶æ‡¶ü‡¶æ ‡¶™‡¶æ‡¶ì‡ßü‡¶æ ‡¶Ø‡¶æ‡ßü‡¶®‡¶ø‡•§');
      return;
    }

    const headers = [
      'Sl No.',
      'Visit Date (BD)',
      'Local Time',
      'IP Address',
      'Visitor Type',
      'Active Time Spent (Seconds)',
      'Active Time Spent (Formatted)',
      'City',
      'Region / State',
      'Country',
      'Network / ISP Provider',
      'Browser',
      'Operating System',
      'Device Info',
      'Visited URL Path',
      'Referrer Source',
      'Exact Timestamp (ISO UTC)'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = logsToExport.map((log, index) => {
      const logTime = log.timestamp ? new Date(log.timestamp) : new Date();
      const formattedTime = !isNaN(logTime.getTime())
        ? logTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
        : 'N/A';
      const durationSec = Number(log.duration || 0);
      const durationFormatted = durationSec > 60
        ? `${Math.floor(durationSec / 60)} min ${durationSec % 60} sec`
        : `${durationSec} sec`;

      return [
        index + 1,
        escapeCSV(log.date || 'N/A'),
        escapeCSV(formattedTime),
        escapeCSV(log.ip || 'N/A'),
        escapeCSV(log.isUnique ? 'Unique Visitor' : 'Repeat Visit'),
        durationSec,
        escapeCSV(durationFormatted),
        escapeCSV(log.city || 'N/A'),
        escapeCSV(log.region || 'N/A'),
        escapeCSV(log.country || 'N/A'),
        escapeCSV(log.org || 'N/A'),
        escapeCSV(log.browser || 'N/A'),
        escapeCSV(log.os || 'N/A'),
        escapeCSV(log.device || 'N/A'),
        escapeCSV(log.path || '/'),
        escapeCSV(log.referer || 'Direct / Bookmark'),
        escapeCSV(log.timestamp || 'N/A')
      ].join(',');
    });

    // UTF-8 BOM \uFEFF ensures proper Unicode & Bengali rendering in Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const todayStr = getBDDateString(0);
    link.setAttribute('href', url);
    link.setAttribute('download', customFilename || `bodytouch_visitor_logs_3days_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Visitor Logs to JSON format
  const exportVisitorLogsToJSON = (logsToExport: any[], customFilename?: string) => {
    if (!logsToExport || logsToExport.length === 0) {
      alert('‡¶°‡¶æ‡¶â‡¶®‡¶≤‡ßã‡¶° ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶Æ‡¶§‡ßã ‡¶ï‡ßã‡¶®‡ßã ‡¶≠‡¶ø‡¶ú‡¶ø‡¶ü‡¶∞ ‡¶°‡¶æ‡¶ü‡¶æ ‡¶™‡¶æ‡¶ì‡ßü‡¶æ ‡¶Ø‡¶æ‡ßü‡¶®‡¶ø‡•§');
      return;
    }

    const todayStr = getBDDateString(0);
    const exportPayload = {
      app: "bodyTOUCH Traffic Analytics",
      exportedAt: new Date().toISOString(),
      retentionPolicy: "3_days_rolling_window",
      totalRecords: logsToExport.length,
      logs: logsToExport
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', customFilename || `bodytouch_visitor_logs_3days_${todayStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Purge / Clear all visitor logs on admin confirmation
  const handlePurgeVisitorLogs = async () => {
    if (!window.confirm('‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§ ‡¶Ø‡ßá ‡¶Ü‡¶™‡¶®‡¶ø ‡¶∏‡¶Æ‡¶∏‡ßç‡¶§ ‡ß© ‡¶¶‡¶ø‡¶®‡ßá‡¶∞ ‡¶≠‡¶ø‡¶ú‡¶ø‡¶ü‡¶∞ ‡¶π‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø ‡¶≤‡¶ó ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶§‡ßá ‡¶ö‡¶æ‡¶®?\n\n‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ‡¶∞ ‡¶™‡¶∞ ‡¶°‡¶æ‡¶ü‡¶æ ‡¶Ü‡¶∞ ‡¶´‡¶ø‡¶∞‡¶ø‡ßü‡ßá ‡¶Ü‡¶®‡¶æ ‡¶∏‡¶Æ‡ßç‡¶≠‡¶¨ ‡¶®‡ßü‡•§ ‡¶Ü‡¶™‡¶®‡¶ø ‡¶ö‡¶æ‡¶á‡¶≤‡ßá ‡¶Ü‡¶ó‡ßá CSV ‡¶¨‡¶æ JSON ‡¶°‡¶æ‡¶â‡¶®‡¶≤‡ßã‡¶° ‡¶ï‡¶∞‡ßá ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶∞‡¶æ‡¶ñ‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡ßá‡¶®‡•§')) {
      return;
    }

    try {
      setIsVisitorLogsLoading(true);
      await fetch('/api/admin/visitors/purge', { method: 'POST' });
      setVisitorLogs([]);
      alert('‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶Æ‡¶∏‡ßç‡¶§ ‡¶≠‡¶ø‡¶ú‡¶ø‡¶ü‡¶∞ ‡¶π‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø ‡¶≤‡¶ó ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!');
    } catch (err) {
      setVisitorLogs([]);
      alert('‡¶≠‡¶ø‡¶ú‡¶ø‡¶ü‡¶∞ ‡¶≤‡¶ó ‡¶Æ‡ßá‡¶Æ‡ßã‡¶∞‡¶ø ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§');
    } finally {
      setIsVisitorLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'visitors') {
      fetchVisitorLogs();
      
      // Quiet background polling to fetch fresh updates from server
      const serverPollInterval = setInterval(() => {
        fetchVisitorLogs(true);
      }, 3000);

      // Local second-by-second countdown ticker for ultra-smooth UI increments
      const localTickInterval = setInterval(() => {
        setVisitorLogs((prevLogs) => {
          if (!prevLogs || prevLogs.length === 0) return prevLogs;
          return prevLogs.map((log) => {
            const isLive = log.timestamp 
              ? (Math.abs(Date.now() - new Date(log.timestamp).getTime()) < 25000) 
              : false;
            if (isLive) {
              return {
                ...log,
                duration: (log.duration || 0) + 1
              };
            }
            return log;
          });
        });
      }, 1000);

      return () => {
        clearInterval(serverPollInterval);
        clearInterval(localTickInterval);
      };
    }
  }, [activeTab]);

  // Hostinger Cloud Sync (Firebase) configuration states
  const [fbApiKey, setFbApiKey] = useState(() => {
    try {
      const saved = localStorage.getItem('bodytouch_firebase_config');
      if (saved) return JSON.parse(saved).apiKey || '';
    } catch (_) {}
    return '';
  });
  const [fbAuthDomain, setFbAuthDomain] = useState(() => {
    try {
      const saved = localStorage.getItem('bodytouch_firebase_config');
      if (saved) return JSON.parse(saved).authDomain || '';
    } catch (_) {}
    return '';
  });
  const [fbProjectId, setFbProjectId] = useState(() => {
    try {
      const saved = localStorage.getItem('bodytouch_firebase_config');
      if (saved) return JSON.parse(saved).projectId || '';
    } catch (_) {}
    return '';
  });
  const [fbStorageBucket, setFbStorageBucket] = useState(() => {
    try {
      const saved = localStorage.getItem('bodytouch_firebase_config');
      if (saved) return JSON.parse(saved).storageBucket || '';
    } catch (_) {}
    return '';
  });
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(() => {
    try {
      const saved = localStorage.getItem('bodytouch_firebase_config');
      if (saved) return JSON.parse(saved).messagingSenderId || '';
    } catch (_) {}
    return '';
  });
  const [fbAppId, setFbAppId] = useState(() => {
    try {
      const saved = localStorage.getItem('bodytouch_firebase_config');
      if (saved) return JSON.parse(saved).appId || '';
    } catch (_) {}
    return '';
  });
  const [fbStatusMessage, setFbStatusMessage] = useState<string | null>(null);

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
      setLedgerError('Please specify a valid positive job payment amount (‡ß≥)!');
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
      setLedgerSuccess(`üéâ Manual ledger entry added successfully for ${matchedCompanion.name}! Model statistics and earnings share have been updated.`);
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

  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);

  // Subscribe to notifications collection in DB to fetch pushed notifications
  useEffect(() => {
    const colRef = collection(db, 'notifications');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc: any) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by timestamp descending
      list.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setAdminNotifications(list);
    }, (err) => {
      console.warn("Error loading notifications inside AdminPanel:", err);
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

      if (!isFirstLoadUsers.current) {
        // Find newly added users by checking which IDs were not in our previous Set
        usersList.forEach((userData) => {
          if (!previousUserIds.current.has(userData.id)) {
            // Only trigger real-time notification if the account is registered in the last 15 minutes
            const createdAtTime = userData.createdAt ? new Date(userData.createdAt).getTime() : 0;
            const isGenuinelyRecent = userData.createdAt ? (Date.now() - createdAtTime < 15 * 60 * 1000) : false;
            
            if (!isGenuinelyRecent) {
              return;
            }

            const displayName = userData.fullName || userData.username || userData.id || 'New Client';
            const userEmail = userData.email || 'No email';
            
            // Create notification item
            const newNotification = {
              id: `${userData.id}-${Date.now()}`,
              title: 'New Client Registered',
              message: `Client "${displayName}" (${userEmail}) just registered on the portal.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              avatar: userData.photoURL || userData.userPhoto || '',
              read: false,
              username: userData.id,
              displayName: displayName
            };

            setLiveNotifications((prev) => [newNotification, ...prev]);

            // Play clean modern dual-tone notification chime using browser AudioContext
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
              
              gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.35);
              
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.35);
            } catch (soundErr) {
              console.warn('Could not play notification sound:', soundErr);
            }
          }
        });
      } else {
        isFirstLoadUsers.current = false;
      }

      // Update previousUserIds Set with the current list of IDs
      previousUserIds.current = new Set(usersList.map(u => u.id));
      setAllRegisteredUsers(usersList);
    }, (err) => {
      console.warn("Error loading users inside AdminPanel:", err);
    });
    return () => unsubscribe();
  }, []);

  // Persistent blacklist/registry of deleted clients
  const [deletedClientIdentifiers, setDeletedClientIdentifiers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bt_deleted_clients');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  // Sync deleted clients list from Firestore in real-time
  useEffect(() => {
    const deletedClientsDocRef = doc(db, 'settings', 'deleted_clients');
    const unsubscribe = onSnapshot(deletedClientsDocRef, (snap: any) => {
      if (snap && snap.exists && snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.list)) {
          setDeletedClientIdentifiers(data.list);
          localStorage.setItem('bt_deleted_clients', JSON.stringify(data.list));
        }
      }
    }, (err: any) => {
      console.warn("Could not sync deleted clients:", err);
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
        alert(`‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü‡¶ü‡¶ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ${nextBlockedStatus ? '‡¶¨‡ßç‡¶≤‡¶ï' : '‡¶Ü‡¶®‡¶¨‡ßç‡¶≤‡¶ï'} ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!`);
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
        alert(`‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü‡¶ü‡¶ø ‡¶∏‡¶´‡¶≤‡¶≠‡¶æ‡¶¨‡ßá ‡¶¨‡ßç‡¶≤‡¶ï ‡¶ï‡¶∞‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá!`);
      }
    } catch (err) {
      console.error("Error blocking client:", err);
      alert("Error updating client block status.");
    }
  };

  const handleRemoveClient = async (client: any) => {
    if (!window.confirm(`‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§‡¶≠‡¶æ‡¶¨‡ßá ‡¶è‡¶á ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü‡¶ü‡¶ø ("${client.name}") ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶§‡ßá ‡¶ö‡¶æ‡¶®?`)) {
      return;
    }
    try {
      // 1. Gather all possible identifier keys for this client to permanently purge
      const clientNameClean = (client.name || '').toLowerCase().trim();
      const clientUsernameClean = (client.username || client.id || '').toLowerCase().trim();
      const clientPhoneClean = (client.phone || '').trim();
      const clientPhoneDigits = clientPhoneClean.replace(/[^0-9]/g, '');
      const clientEmailClean = (client.email || '').toLowerCase().trim();
      const clientNameSlug = clientNameClean.replace(/\s+/g, '');
      const clientPairKey = `${clientNameClean}-${clientPhoneClean}`.toLowerCase();

      const newIdentifiers = [
        client.id,
        clientNameClean,
        clientUsernameClean,
        clientNameSlug,
        clientPairKey,
        ...(clientPhoneClean ? [clientPhoneClean] : []),
        ...(clientPhoneDigits ? [clientPhoneDigits] : []),
        ...(clientEmailClean ? [clientEmailClean] : [])
      ].filter(Boolean);

      // 2. Persist to deletedClientIdentifiers in Firestore & localStorage
      const updatedDeletedList = Array.from(new Set([...deletedClientIdentifiers, ...newIdentifiers]));
      setDeletedClientIdentifiers(updatedDeletedList);
      localStorage.setItem('bt_deleted_clients', JSON.stringify(updatedDeletedList));
      try {
        await setDoc(doc(db, 'settings', 'deleted_clients'), {
          list: updatedDeletedList,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.warn("Error saving deleted_clients to Firestore:", e);
      }

      // 3. Delete from 'users' collection in Firestore
      const userDocsToDelete: string[] = [];
      if (client.id) userDocsToDelete.push(client.id);
      if (clientUsernameClean) userDocsToDelete.push(clientUsernameClean);
      if (clientNameSlug) userDocsToDelete.push(clientNameSlug);

      for (const uid of userDocsToDelete) {
        try {
          await deleteDoc(doc(db, 'users', uid));
        } catch (_) {}
      }

      // Query any additional matching users by phone / email / fullName
      try {
        const usersCol = collection(db, 'users');
        if (clientPhoneClean) {
          const snapByPhone = await getDocs(query(usersCol, where('phone', '==', clientPhoneClean)));
          for (const d of snapByPhone.docs) {
            await deleteDoc(d.ref);
          }
        }
        if (clientEmailClean) {
          const snapByEmail = await getDocs(query(usersCol, where('email', '==', clientEmailClean)));
          for (const d of snapByEmail.docs) {
            await deleteDoc(d.ref);
          }
        }
        if (client.name) {
          const snapByName = await getDocs(query(usersCol, where('fullName', '==', client.name)));
          for (const d of snapByName.docs) {
            await deleteDoc(d.ref);
          }
        }
      } catch (errUsers) {
        console.warn("Error querying users for deletion:", errUsers);
      }

      // 4. Delete or detach associated bookings from Firestore
      try {
        const bookingsCol = collection(db, 'bookings');
        const allBookingsSnap = await getDocs(bookingsCol);
        for (const bDoc of allBookingsSnap.docs) {
          const bData = bDoc.data() as any;
          const bPhone = (bData.clientPhone || '').replace(/[^0-9]/g, '');
          const bEmail = (bData.clientEmail || '').toLowerCase().trim();
          const bName = (bData.clientName || '').toLowerCase().trim();
          const bClientId = bData.clientId || bData.userId || '';

          const isMatch = (clientPhoneDigits && bPhone && bPhone === clientPhoneDigits) ||
                          (clientEmailClean && bEmail && bEmail === clientEmailClean) ||
                          (clientNameClean && bName && bName === clientNameClean) ||
                          (client.id && bClientId && bClientId === client.id);

          if (isMatch) {
            await deleteDoc(bDoc.ref);
          }
        }
      } catch (errBookings) {
        console.warn("Error cleaning up client bookings:", errBookings);
      }

      // 5. Update local state immediately so UI refreshes with zero latency
      setAllRegisteredUsers((prev) => prev.filter((u) => {
        const uId = (u.id || '').toLowerCase();
        const uUsername = (u.username || '').toLowerCase();
        const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.fullName || '').toLowerCase();

        return !newIdentifiers.some(ident => 
          ident.toLowerCase() === uId || 
          ident.toLowerCase() === uUsername || 
          (uPhone && ident === uPhone) || 
          (uEmail && ident.toLowerCase() === uEmail) || 
          (uName && ident.toLowerCase() === uName)
        );
      }));

      setSelectedClient(null);
      alert("‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü ‡¶ì ‡¶∏‡¶Ç‡¶∂‡ßç‡¶≤‡¶ø‡¶∑‡ßç‡¶ü ‡¶∏‡¶Æ‡¶∏‡ßç‡¶§ ‡¶∞‡ßá‡¶ï‡¶∞‡ßç‡¶° ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶•‡ßá‡¶ï‡ßá ‡¶∏‡ßç‡¶•‡¶æ‡ßü‡ßÄ‡¶≠‡¶æ‡¶¨‡ßá ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶æ ‡¶π‡ßü‡ßá‡¶õ‡ßá! (Client deleted permanently!)");
    } catch (err) {
      console.error("Error deleting client:", err);
      alert("Error deleting client account: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const clientsList = useMemo(() => {
    const clientsMap: { [key: string]: any } = {};

    const isClientDeleted = (idOrKey: string, name?: string, phone?: string, email?: string) => {
      if (!deletedClientIdentifiers || deletedClientIdentifiers.length === 0) return false;
      const lowerKey = (idOrKey || '').toLowerCase().trim();
      const lowerName = (name || '').toLowerCase().trim();
      const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
      const lowerEmail = (email || '').toLowerCase().trim();
      const nameSlug = lowerName.replace(/\s+/g, '');
      const pairKey = `${lowerName}-${(phone || '').trim()}`.toLowerCase();

      return deletedClientIdentifiers.some((ident) => {
        const identLower = ident.toLowerCase().trim();
        const identDigits = ident.replace(/[^0-9]/g, '');
        return (
          identLower === lowerKey ||
          (lowerName && identLower === lowerName) ||
          (nameSlug && identLower === nameSlug) ||
          (pairKey && identLower === pairKey) ||
          (cleanPhone && identDigits && cleanPhone === identDigits) ||
          (lowerEmail && identLower === lowerEmail)
        );
      });
    };

    // 1. Populate from registered users first (excluding deleted)
    allRegisteredUsers.forEach(u => {
      const usernameLower = (u.username || u.id || '').toLowerCase();
      if (isClientDeleted(usernameLower, u.fullName || u.username, u.phone, u.email)) {
        return;
      }

      const key = usernameLower;
      clientsMap[key] = {
        id: u.id,
        name: u.fullName || u.username,
        phone: u.phone || '',
        email: u.email || '',
        gender: u.gender || '',
        userPhoto: u.userPhoto || u.avatarUrl || u.photoURL || '',
        nidFront: u.nidFront || '',
        nidBack: u.nidBack || '',
        birthday: u.birthday || u.age || '',
        authMethod: u.authMethod || '',
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

      // If this booking belongs to a deleted client, DO NOT recreate client profile
      if (isClientDeleted(b.id, bName, bPhone, bEmail)) {
        return;
      }

      // Try matching to a registered user by phone, email, or name
      const matchedUser = allRegisteredUsers.find(u => 
        (bPhone && u.phone && u.phone.toLowerCase() === bPhone.toLowerCase()) ||
        (bEmail && u.email && u.email.toLowerCase() === bEmail.toLowerCase()) ||
        (bName && u.fullName && u.fullName.toLowerCase() === bName.toLowerCase())
      );

      let matchedKey = '';
      if (matchedUser) {
        matchedKey = (matchedUser.username || matchedUser.id).toLowerCase();
        if (isClientDeleted(matchedKey, matchedUser.fullName, matchedUser.phone, matchedUser.email)) {
          return;
        }
      } else {
        // Fallback to name-phone matching for guests or manual bookings
        const fallbackKey = `${bName}-${bPhone}`.toLowerCase();
        if (isClientDeleted(fallbackKey, bName, bPhone, bEmail)) {
          return;
        }

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

      if (clientsMap[matchedKey]) {
        clientsMap[matchedKey].bookingsCount += 1;
        clientsMap[matchedKey].bookings.push(b);
        if (photo && !clientsMap[matchedKey].userPhoto) clientsMap[matchedKey].userPhoto = photo;
        if (nidFront && !clientsMap[matchedKey].nidFront) clientsMap[matchedKey].nidFront = nidFront;
        if (nidBack && !clientsMap[matchedKey].nidBack) clientsMap[matchedKey].nidBack = nidBack;
      }
    });

    return Object.values(clientsMap);
  }, [allRegisteredUsers, bookings, deletedClientIdentifiers]);

  const [orderTierFilter, setOrderTierFilter] = useState<'ALL' | 'REGULAR' | 'PREMIUM' | 'ELITE'>('ALL');

  const getBookingTier = (book: Booking): 'REGULAR' | 'PREMIUM' | 'ELITE' | 'DEMO' => {
    // 1. Try to find the companion by modelName
    const companion = companions.find(c => c.name.toLowerCase() === book.modelName.toLowerCase());
    if (companion && companion.badge !== 'INCOMPLETE') {
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
  const [compPenisSize, setCompPenisSize] = useState('');
  const [compDurationTime, setCompDurationTime] = useState('');
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
  const [compTag, setCompTag] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compWhatsapp, setCompWhatsapp] = useState('');
  const [compTelegram, setCompTelegram] = useState('');

  // Helpers to parse comma/semicolon-separated areas from compCity
  const getSelectedAreas = (): string[] => {
    if (!compCity) return [];
    return compCity.split(/[;,]/).map(s => s.trim()).filter(Boolean);
  };

  const handleToggleArea = (area: string) => {
    const current = getSelectedAreas();
    const existsIndex = current.findIndex(a => a.toLowerCase() === area.toLowerCase());
    let updated: string[];
    if (existsIndex > -1) {
      updated = current.filter((_, i) => i !== existsIndex);
    } else {
      updated = [...current, area];
    }
    setCompCity(updated.join(', '));
  };

  const handleRemoveArea = (area: string) => {
    const current = getSelectedAreas();
    const updated = current.filter(a => a.toLowerCase() !== area.toLowerCase());
    setCompCity(updated.join(', '));
  };

  // Service toggle checkboxes
  const [compIsRealActive, setCompIsRealActive] = useState(true);
  const [compIsCamActive, setCompIsCamActive] = useState(true);
  const [compIsMakeOutActive, setCompIsMakeOutActive] = useState(true);
  const [compIsTourActive, setCompIsTourActive] = useState(true);
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

  // Custom Tour duration rates
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
  const [adminLocationTab, setAdminLocationTab] = useState<'ALL' | 'HOTELS' | 'SAFE HOUSES'>('ALL');
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

  // Partner filter (Active database vs Applicants vs Incomplete)
  const [partnerSubTab, setPartnerSubTab] = useState<'active' | 'applicants' | 'incomplete'>('active');
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
    setCompPenisSize(comp.penisSize || '');
    setCompDurationTime(comp.durationTime || '');
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
    setCompIsTourActive(comp.isTourActive !== false);
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
    setCompBadge(comp.badge === 'INCOMPLETE' ? 'REGULAR' : comp.badge);
    setCompImage(comp.image);
    setCompCategory(comp.category || 'Female Model');
    setCompPictures(comp.pictures || []);
    setCompTag(comp.tag || '');
    setCompPhone(comp.phone || '');
    setCompWhatsapp(comp.whatsapp || '');
    setCompTelegram(comp.telegram || '');
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
    setCompPenisSize('');
    setCompDurationTime('');
    setCompLanguages('English, Bengali');
    setCompSpecialty('');
    setCompPhone('');
    setCompWhatsapp('');
    setCompTelegram('');
    setCompRate(8000);
    setCompRateReal('');
    setCompRateCam('');
    setCompRateMakeOut('');
    setCompRateLiveTogether('');
    setCompCustomRealRates([]);
    setCompCustomCamRates([]);
    setCompCustomLiveTogetherRates([]);
    setCompTag('');

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
    const finalImage = compImage.trim();

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
            status: comp.status === 'Incomplete' ? 'Approved' : comp.status,
            name: compName,
            tag: compTag.trim() || comp.tag,
            age: Number(compAge),
            height: compHeight,
            bodyColor: compBodyColor || undefined,
            weight: compWeight || undefined,
            bust: compBust || undefined,
            waist: compWaist || undefined,
            hip: compHip || undefined,
            penisSize: compCategory === 'Male Model' ? (compPenisSize || undefined) : undefined,
            durationTime: compCategory === 'Male Model' ? (compDurationTime || undefined) : undefined,
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
            isTourActive: compIsTourActive,
            isLiveTogetherActive: compCategory !== 'Sperm Donor' ? compIsLiveTogetherActive : false,
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
            phone: compPhone.trim() || undefined,
            whatsapp: compWhatsapp.trim() || undefined,
            telegram: compTelegram.trim() || undefined,
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
      const newTag = compTag.trim() || ('# ' + Math.floor(100000 + Math.random() * 900000));
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
        penisSize: compCategory === 'Male Model' ? (compPenisSize || undefined) : undefined,
        durationTime: compCategory === 'Male Model' ? (compDurationTime || undefined) : undefined,
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
        isTourActive: compIsTourActive,
        isLiveTogetherActive: compCategory !== 'Sperm Donor' ? compIsLiveTogetherActive : false,
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
        phone: compPhone.trim() || undefined,
        whatsapp: compWhatsapp.trim() || undefined,
        telegram: compTelegram.trim() || undefined,
        pictures: getCompanionPictures(compPictures, finalImage),
        customRealRates: compCustomRealRates,
        customCamRates: compCustomCamRates,
        customLiveTogetherRates: compCustomLiveTogetherRates
      };
      onUpdateCompanions([newComp, ...companions]);
    }

    resetCompanionForm();
  };

  // Delete companion permanently
  const handleDeleteCompanion = async (id: string | number) => {
    const strId = String(id);
    const targetComp = companions.find(c => String(c.id) === strId);
    const compName = targetComp ? targetComp.name : strId;
    if (!window.confirm(`Are you sure you want to permanently delete partner profile "${compName}"? This action will remove them completely from the database.`)) {
      return;
    }
    try {
      const filtered = companions.filter(c => String(c.id) !== strId);
      onUpdateCompanions(filtered);
      await deleteDoc(doc(db, 'companions', strId));
      await deleteCloudDocument('companions', strId);
      await deleteDoc(doc(db, 'models', strId));
      await deleteCloudDocument('models', strId);
      localStorage.setItem('bt_companions', JSON.stringify(filtered));
      alert(`‚úÖ Profile "${compName}" has been permanently deleted from database.`);
    } catch (err: any) {
      console.error('Failed to delete companion:', err);
      alert(`‚ùå Error deleting profile: ${err.message || err}`);
    }
  };

  // Toggle companion block status
  const handleToggleBlockCompanion = (comp: any) => {
    const nextBlocked = !comp.isBlocked;
    const updated = companions.map(c => {
      if (c.id === comp.id) {
        return { ...c, isBlocked: nextBlocked };
      }
      return c;
    });
    onUpdateCompanions(updated);
  };

  // Broadcast push notification form submit handler
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      alert("Please fill in both title and message body / ‡¶∂‡¶ø‡¶∞‡ßã‡¶®‡¶æ‡¶Æ ‡¶ì ‡¶¨‡¶æ‡¶∞‡ßç‡¶§‡¶æ ‡¶™‡ßÇ‡¶∞‡¶£ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§");
      return;
    }
    
    setIsSendingBroadcast(true);
    try {
      const notifId = `broadcast_${Date.now()}`;
      const payload: any = {
        id: notifId,
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        type: broadcastType,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      if (broadcastTargetUser.trim()) {
        payload.username = broadcastTargetUser.trim();
      }
      
      await setDoc(doc(db, 'notifications', notifId), payload);
      
      alert(broadcastTargetUser 
        ? `Direct notification sent successfully to "${broadcastTargetUser}"! / "${broadcastTargetUser}" ‡¶ï‡ßá ‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶™‡¶æ‡¶†‡¶æ‡¶®‡ßã ‡¶π‡ßü‡ßá‡¶õ‡ßá!`
        : "Global broadcast notification sent successfully to all clients! / ‡¶∏‡¶¨‡¶æ‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶™‡¶æ‡¶†‡¶æ‡¶®‡ßã ‡¶π‡ßü‡ßá‡¶õ‡ßá!"
      );
      
      // Reset form fields
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastTargetUser('');
    } catch (err: any) {
      console.error("Error sending push notification:", err);
      alert("Failed to send notification: " + err.message);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Delete/recall a previously sent notification
  const handleDeleteNotification = async (id: string) => {
    const consent = window.confirm("Are you sure you want to recall/delete this notification? / ‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶è‡¶á ‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶®‡¶ü‡¶ø ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡¶§‡ßá ‡¶ö‡¶æ‡¶®?");
    if (!consent) return;
    
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err: any) {
      console.error("Error deleting notification:", err);
      alert("Failed to delete notification: " + err.message);
    }
  };

  // Triggered when editing a hotel location
  const handleEditLocation = (loc: HotelLocation) => {
    setEditingLocationId(loc.id);
    setLocName(loc.name);
    setLocStar(loc.star || '5 STAR');
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

    const finalImage = locImage.trim();

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

            {/* Visitor Traffic */}
            <button
              onClick={() => handleNavItemClick('visitors')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'visitors'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className={`w-4 h-4 shrink-0 ${activeTab === 'visitors' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Visitor Traffic (‡¶≠‡¶ø‡¶ú‡¶ø‡¶ü‡¶∞ ‡¶ü‡ßç‡¶∞‡¶æ‡¶´‡¶ø‡¶ï)</span>
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
                ‡ß≥ LEDGER
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
                <span>Agent Management (‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü ‡¶ì ‡¶∞‡ßá‡¶´‡¶æ‡¶∞‡ßá‡¶≤)</span>
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
                <span>Promo Codes (‡¶™‡ßç‡¶∞‡ßã‡¶Æ‡ßã ‡¶ï‡ßã‡¶°)</span>
              </div>
              <span className="text-[10px] bg-red-500/10 text-red-400 font-bold font-mono px-1.5 py-0.5 rounded border border-red-500/25">
                {adminPromoCodes.length} Codes
              </span>
            </button>

            {/* Marketing & Ad Tracking Pixels Tab */}
            <button
              onClick={() => handleNavItemClick('marketing')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'marketing'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Target className={`w-4 h-4 shrink-0 ${activeTab === 'marketing' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Marketing & Pixels (‡¶™‡¶ø‡¶ï‡ßç‡¶∏‡ßá‡¶≤)</span>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 font-bold font-mono px-1.5 py-0.5 rounded border border-blue-500/25">
                Ads & Boost
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

            {/* Broadcast Push Alerts Tab */}
            <button
              type="button"
              onClick={() => handleNavItemClick('broadcast_notifications')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                activeTab === 'broadcast_notifications'
                  ? 'bg-amber-950/20 border border-[#dbaa61]/30 text-white font-heavy shadow-[0_0_15px_rgba(219,170,97,0.06)]'
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className={`w-4 h-4 shrink-0 ${activeTab === 'broadcast_notifications' ? 'text-[#dbaa61]' : 'text-slate-500'}`} />
                <span>Push Notifications (‡¶™‡ßÅ‡¶∂ ‡¶è‡¶≤‡¶æ‡¶∞‡ßç‡¶ü)</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold font-mono px-1.5 py-0.5 rounded border border-amber-500/25">
                Alerts
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
                  <h2 className="text-lg font-bold text-white tracking-tight">Admin Authentication / ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶∂‡¶®</h2>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                    ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶è‡¶¨‡¶Ç ‡ß®-‡¶∏‡ßç‡¶ü‡ßá‡¶™ ‡¶∏‡¶ø‡¶ï‡¶ø‡¶â‡¶∞‡¶ø‡¶ü‡¶ø ‡¶ï‡ßã‡¶° ‡¶¨‡¶∏‡¶ø‡ßü‡ßá ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤‡ßá ‡¶™‡ßç‡¶∞‡¶¨‡ßá‡¶∂ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                  </p>
                </div>

                {/* CUSTOM EMAIL & PASSWORD LOGIN */}
                <form onSubmit={handleCustomEmailPasswordSignIn} className="space-y-4 text-left pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-400 pl-1 uppercase tracking-wider font-mono">
                      Email Address / ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶á‡¶Æ‡ßá‡¶á‡¶≤
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
                      Password / ‡¶™‡¶æ‡¶∏‡¶ì‡¶Ø‡¶º‡¶æ‡¶∞‡ßç‡¶°
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
                        placeholder="‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢‚Ä¢"
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
                        Verifying... / ‡¶Ø‡¶æ‡¶ö‡¶æ‡¶á ‡¶ï‡¶∞‡¶æ ‡¶π‡¶ö‡ßç‡¶õ‡ßá...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Credentials / ‡¶™‡¶∞‡¶¨‡¶∞‡ßç‡¶§‡ßÄ ‡¶ß‡¶æ‡¶™
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
                      Google Authenticator Link / ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶≤‡¶ø‡¶ô‡ßç‡¶ï
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                      ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Ö‡¶•‡ßá‡¶®‡ßç‡¶ü‡¶ø‡¶ï‡ßá‡¶ü‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™‡ßá ‡¶®‡¶ø‡¶ö‡ßá‡¶∞ ‡¶ï‡¶ø‡¶â‡¶Ü‡¶∞ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø (QR Code) ‡¶∏‡ßç‡¶ï‡ßç‡¶Ø‡¶æ‡¶® ‡¶ï‡¶∞‡ßÅ‡¶® ‡¶Ö‡¶•‡¶¨‡¶æ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßÅ‡ßü‡¶æ‡¶≤‡¶ø ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
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
                      <span className="text-[9px] font-mono tracking-widest text-[#dbaa61] uppercase font-black">Manual Entry Key / ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßÅ‡¶Ø‡¶º‡¶æ‡¶≤ ‡¶ï‡ßÄ</span>
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
                      <span className="font-bold text-[#dbaa61] block mb-0.5">‡¶≤‡¶ø‡¶ô‡ßç‡¶ï ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶®‡¶ø‡ßü‡¶Æ:</span>
                      <p>‡ßß. ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤‡ßá <strong className="text-white">Google Authenticator</strong> ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™ ‡¶ì‡¶™‡ßá‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®‡•§</p>
                      <p>‡ß®. ‡¶®‡¶ø‡¶ö‡ßá ‡¶°‡¶æ‡¶® ‡¶ï‡ßã‡¶£‡¶æ‡ßü ‡¶™‡ßç‡¶≤‡¶æ‡¶∏ (+) ‡¶Ü‡¶á‡¶ï‡¶® ‡¶ö‡ßá‡¶™‡ßá <strong className="text-white">"Scan a QR code"</strong> ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡ßá ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶∏‡ßç‡¶ï‡ßç‡¶Ø‡¶æ‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®‡•§</p>
                      <p>‡ß©. ‡¶Ø‡¶¶‡¶ø ‡¶∏‡ßç‡¶ï‡ßç‡¶Ø‡¶æ‡¶® ‡¶®‡¶æ ‡¶ï‡¶∞‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡ßá‡¶®, ‡¶§‡¶¨‡ßá <strong className="text-white">"Enter a setup key"</strong> ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡ßá ‡¶®‡¶æ‡¶Æ "BodyTouch" ‡¶è‡¶¨‡¶Ç ‡¶ì‡¶™‡¶∞‡ßá‡¶∞ "Manual Entry Key" ‡¶ü‡¶ø ‡¶¨‡¶∏‡¶ø‡ßü‡ßá ‡¶¶‡¶ø‡ßü‡ßá <strong className="text-white">Add</strong> ‡¶ö‡¶æ‡¶™‡ßÅ‡¶®‡•§</p>
                    </div>
                  </div>

                  {/* Input Code Verification Pad */}
                  <div className="bg-[#03060d]/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <div className="space-y-1 text-center">
                      <label className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                        Enter Generated Code (‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™‡ßá‡¶∞ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶¶‡¶ø‡¶®)
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
                                {val || <span className="text-slate-700 font-sans">‚Ä¢</span>}
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
              /* GOOGLE AUTHENTICATOR 2FA SECURE VALIDATOR AT EVERY SIGNIN OR RESET FLOW */
              showReset2FAInput ? (
                <form onSubmit={handleResetOwn2FA} className="space-y-4 text-center animate-fadeIn">
                  <div className="space-y-1 border-b border-white/[0.04] pb-3">
                    <h3 className="text-[#dbaa61] uppercase tracking-wider text-sm font-bold">
                      Reset Two-Factor Authentication
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                      ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü <strong className="text-white">{totpTempEnrollEmail}</strong> ‡¶è‡¶∞ ‡ß®-‡¶∏‡ßç‡¶ü‡ßá‡¶™ ‡¶®‡¶ø‡¶∞‡¶æ‡¶™‡¶§‡ßç‡¶§‡¶æ ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶Ö‡¶®‡ßÅ‡¶ó‡ßç‡¶∞‡¶π ‡¶ï‡¶∞‡ßá ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°‡¶ü‡¶ø ‡¶™‡ßç‡¶∞‡¶¶‡¶æ‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-[#03060d]/60 p-4 border border-slate-800/80">
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-semibold tracking-wider text-[#dbaa61] uppercase font-mono">
                        Your Admin Password (‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°‡¶ü‡¶ø ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®"
                        value={reset2FAPassword}
                        onChange={(e) => {
                          setReset2FAPassword(e.target.value);
                          if (authError) setAuthError('');
                        }}
                        className="w-full bg-[#0b0c10] border border-[#dbaa61]/30 focus:border-[#dbaa61] rounded-xl text-center text-xs tracking-wider text-[#dbaa61] py-3 focus:outline-none placeholder-slate-700 transition"
                      />
                    </div>
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
                        setShowReset2FAInput(false);
                        setReset2FAPassword('');
                        setAuthError('');
                      }}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] uppercase font-bold tracking-wider transition cursor-pointer text-center"
                    >
                      Cancel (‡¶¨‡¶æ‡¶§‡¶ø‡¶≤)
                    </button>
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[10px] uppercase font-bold tracking-wider transition cursor-pointer text-center shadow-md font-bold disabled:opacity-40"
                    >
                      {isSending ? 'Resetting...' : 'Reset & Setup New'}
                    </button>
                  </div>
                </form>
              ) : (
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
                        {useBackupCode ? 'One-Time Backup Code (‡¶ì‡ßü‡¶æ‡¶®-‡¶ü‡¶æ‡¶á‡¶Æ ‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶°)' : 'Security Passcode'}
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
                                  {val || <span className="text-slate-700 font-sans">‚Ä¢</span>}
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

                  {/* Switch between TOTP and Backup code / Reset 2FA */}
                  <div className="flex flex-col gap-2 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupCode(!useBackupCode);
                        setAuthError('');
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer transition text-right"
                    >
                      {useBackupCode ? '‚Üê Use Authenticator App (‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™ ‡¶ï‡ßã‡¶° ‡¶¨‡ßç‡¶Ø‡¶¨‡¶π‡¶æ‡¶∞ ‡¶ï‡¶∞‡ßÅ‡¶®)' : 'üîë Lost Access? Use Backup Code (‡¶¨‡ßç‡¶Ø‡¶æ‡¶ï‡¶Ü‡¶™ ‡¶ï‡ßã‡¶° ‡¶¨‡ßç‡¶Ø‡¶¨‡¶π‡¶æ‡¶∞ ‡¶ï‡¶∞‡ßÅ‡¶®)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReset2FAInput(true);
                        setAuthError('');
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer transition text-right"
                    >
                      ‚ö†Ô∏è Lost 2FA / Device? Reset 2FA Setup (‡ß®FA ‡¶®‡¶§‡ßÅ‡¶® ‡¶ï‡¶∞‡ßá ‡¶∏‡ßá‡¶ü‡¶Ü‡¶™ ‡¶ï‡¶∞‡ßÅ‡¶®)
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
              )
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

  // Render floating toasts for real-time new client registrations
  const renderFloatingToasts = () => {
    // Only show unread notifications that haven't been dismissed (though they get removed entirely on dismiss)
    const activeToasts = liveNotifications.filter(n => !n.read).slice(0, 3);
    
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        <AnimatePresence>
          {activeToasts.map((toast) => (
            <motion.div
              key={`toast-${toast.id}`}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="pointer-events-auto bg-[#0a0b11] border-2 border-[#dbaa61]/40 p-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex gap-3 items-start relative overflow-hidden backdrop-blur-md"
            >
              <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500" />
              
              {toast.avatar && toast.avatar !== 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' ? (
                <img
                  src={toast.avatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-850"
                  referrerPolicy="no-referrer"
                />
              ) : (
                (() => {
                  const firstLetter = toast.displayName ? toast.displayName.trim().charAt(0).toUpperCase() : 'U';
                  const bgGradients = [
                    'from-blue-600 to-indigo-700',
                    'from-emerald-600 to-teal-700',
                    'from-rose-600 to-pink-700',
                    'from-amber-500 to-orange-600',
                    'from-violet-600 to-fuchsia-700',
                  ];
                  const idx = firstLetter.charCodeAt(0) % bgGradients.length;
                  const bgClass = bgGradients[idx];
                  return (
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${bgClass} flex items-center justify-center text-white font-black text-sm border border-white/10 shrink-0 shadow-lg`}>
                      {firstLetter}
                    </div>
                  );
                })()
              )}

              <div className="flex-1 text-left min-w-0 pr-3">
                <div className="flex items-center gap-1.5 mb-1 text-amber-400 font-extrabold text-[10px] tracking-wider uppercase">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Real-time Alert</span>
                </div>
                <h4 className="font-bold text-xs text-white truncate mb-1">{toast.title}</h4>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">{toast.message}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setLiveNotifications(prev => prev.filter(n => n.id !== toast.id));
                      setActiveTab('clients');
                    }}
                    className="bg-gradient-to-r from-[#a67c33] to-[#dbaa61] hover:brightness-110 text-slate-950 font-black text-[9px] tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all duration-150 cursor-pointer"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      setLiveNotifications(prev => prev.filter(n => n.id !== toast.id));
                    }}
                    className="text-slate-400 hover:text-white font-bold text-[9px] px-2 py-1.5 transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setLiveNotifications(prev => prev.filter(n => n.id !== toast.id));
                }}
                className="text-slate-500 hover:text-slate-300 transition shrink-0 p-1 rounded-lg hover:bg-slate-900 absolute top-2 right-2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

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
    { id: 'marketing' as const, label: 'Pixel & Boost', icon: Target },
    { id: 'visitors' as const, label: 'Visitors', icon: Globe },
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
            <span>‚Ä¢</span>
            <span className="flex items-center gap-1.5 hover:text-white transition cursor-pointer">
              Staff Portal Console
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Notifications Bell Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className={`p-2.5 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center relative ${
                showNotificationsDropdown 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' 
                  : 'bg-[#12141c] border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Real-time Notifications"
            >
              <Bell className="w-4 h-4" />
              {liveNotifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-650 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-600/30 leading-none">
                  {liveNotifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotificationsDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#090b11] border border-[#dbaa61]/25 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] z-50 overflow-hidden font-sans"
                >
                  <div className="p-4 border-b border-[#1c2333] flex items-center justify-between bg-[#0e101a]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#dbaa61]" />
                      <span className="font-extrabold text-xs tracking-wider uppercase text-white">Live Client Alerts</span>
                    </div>
                    {liveNotifications.length > 0 && (
                      <button
                        onClick={() => {
                          setLiveNotifications([]);
                          setShowNotificationsDropdown(false);
                        }}
                        className="text-[10px] font-black tracking-wider uppercase text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#161a24] scrollbar-thin scrollbar-thumb-slate-850">
                    {liveNotifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                        <UserPlus className="w-8 h-8 text-slate-600" />
                        <p className="font-bold">No new client notifications yet.</p>
                        <p className="text-[10px] text-slate-600 leading-normal">They will appear and chime here as soon as a new user signs up!</p>
                      </div>
                    ) : (
                      liveNotifications.map((noti) => (
                        <div
                          key={noti.id}
                          onClick={() => {
                            // Completely remove it upon clicking (checking) so it is never shown again
                            setLiveNotifications(prev => prev.filter(n => n.id !== noti.id));
                            // Go to clients tab
                            setActiveTab('clients');
                            setShowNotificationsDropdown(false);
                          }}
                          className="p-3.5 flex gap-3 cursor-pointer hover:bg-slate-900/50 transition-all text-left bg-[#dbaa61]/5 border-l-2 border-[#dbaa61]"
                        >
                          {noti.avatar && noti.avatar !== 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' ? (
                            <img
                              src={noti.avatar}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-800"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            (() => {
                              const firstLetter = noti.displayName ? noti.displayName.trim().charAt(0).toUpperCase() : 'U';
                              const bgGradients = [
                                'from-blue-600 to-indigo-700',
                                'from-emerald-600 to-teal-700',
                                'from-rose-600 to-pink-700',
                                'from-amber-500 to-orange-600',
                                'from-violet-600 to-fuchsia-700',
                              ];
                              const idx = firstLetter.charCodeAt(0) % bgGradients.length;
                              const bgClass = bgGradients[idx];
                              return (
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${bgClass} flex items-center justify-center text-white font-black text-xs border border-white/10 shrink-0 shadow-lg`}>
                                  {firstLetter}
                                </div>
                              );
                            })()
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="font-bold text-xs text-white truncate">{noti.title}</span>
                              <span className="text-[9px] text-slate-500 font-mono shrink-0">{noti.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed font-medium mb-1.5">{noti.message}</p>
                            <span className="inline-flex bg-amber-500/10 text-[#dbaa61] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                              Review Client Details
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                {activeTab === 'verification' && 'Model Verifications (‡¶Æ‡¶°‡ßá‡¶≤ ‡¶Ø‡¶æ‡¶ö‡¶æ‡¶á‡¶ï‡¶∞‡¶£)'}
                {activeTab === 'admins' && 'Administrative Team'}
                {activeTab === 'smtp' && 'System & Telegram Settings'}
                {activeTab === 'shortlinks' && 'Quick Registration Links'}
                {activeTab === 'referrals' && 'Agent & Referral Management (‡¶è‡¶ú‡ßá‡¶®‡ßç‡¶ü ‡¶ì ‡¶∞‡ßá‡¶´‡¶æ‡¶∞‡ßá‡¶≤)'}
                {activeTab === 'promocodes' && 'Promo Codes Manager (‡¶™‡ßç‡¶∞‡ßã‡¶Æ‡ßã ‡¶ï‡ßã‡¶° ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶ú‡¶æ‡¶∞)'}
                {activeTab === 'livechat' && 'Live Support Chat Console'}
                {activeTab === 'model_ledger' && 'Model Ledger & Financial Audit'}
                {activeTab === 'broadcast_notifications' && 'Broadcasting & Push Notifications (‡¶™‡ßÅ‡¶∂ ‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶®)'}
                {activeTab === 'visitors' && 'Visitor Traffic Analytics (‡¶≠‡¶ø‡¶ú‡¶ø‡¶ü‡¶∞ ‡¶ü‡ßç‡¶∞‡¶æ‡¶´‡¶ø‡¶ï)'}
                {activeTab === 'marketing' && 'Marketing & Ad Tracking Pixels (‡¶¨‡¶ø‡¶ú‡ßç‡¶û‡¶æ‡¶™‡¶® ‡¶ì ‡¶¨‡ßÅ‡¶∏‡ßç‡¶ü ‡¶ü‡ßç‡¶∞‡ßç‡¶Ø‡¶æ‡¶ï‡¶ø‡¶Ç)'}
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
                {activeTab === 'broadcast_notifications' && 'Send in-app notifications and urgent global alerts directly to all users or specific clients.'}
                {activeTab === 'visitors' && 'Monitor and audit website traffic volume, unique user sessions, geographic locations, and historic visit dates.'}
                {activeTab === 'marketing' && 'Manage Meta (Facebook) Pixel, TikTok Pixel, Google Tag Manager (GTM), and GA4 IDs for campaign tracking and boosting conversions.'}
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
                      ‡¶∏‡ßç‡¶¨‡¶æ‡¶ó‡¶§‡¶Æ, ‡¶¶‡ßç‡¶Ø ‡¶¨‡¶°‡¶ø ‡¶ü‡¶æ‡¶ö ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶™‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤!
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-2.5">
                      ‡¶è‡¶á ‡¶∏‡ßá‡¶®‡ßç‡¶ü‡ßç‡¶∞‡¶æ‡¶≤ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶°‡ßç‡¶Ø‡¶æ‡¶∂‡¶¨‡ßã‡¶∞‡ßç‡¶° ‡¶•‡ßá‡¶ï‡ßá ‡¶Ü‡¶™‡¶®‡¶ø ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü (VIP Clients), ‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶®‡¶æ‡¶∞ ‡¶™‡ßç‡¶∞‡¶´‡¶æ‡¶á‡¶≤ (Companions & Models), ‡¶Æ‡¶ø‡¶°‡¶ø‡ßü‡¶æ ‡¶¨‡ßç‡¶Ø‡¶æ‡¶Ç‡¶ï, ‡¶è‡¶¨‡¶Ç ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶Ö‡¶∞‡ßç‡¶°‡¶æ‡¶∞ ‡¶ì ‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ ‡¶á‡¶®‡ßç‡¶ü‡¶ø‡¶ó‡ßç‡¶∞‡ßá‡¶∂‡¶® ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ ‡¶®‡¶ø‡¶ñ‡ßÅ‡¶Å‡¶§‡¶≠‡¶æ‡¶¨‡ßá ‡¶®‡¶ø‡ßü‡¶®‡ßç‡¶§‡ßç‡¶∞‡¶£ ‡¶ï‡¶∞‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡¶¨‡ßá‡¶®‡•§ ‡¶ï‡ßã‡¶®‡ßã ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶∏‡¶æ‡¶•‡ßá ‡¶∏‡¶æ‡¶•‡ßá ‡¶§‡¶æ ‡¶´‡ßç‡¶∞‡¶®‡ßç‡¶ü‡¶è‡¶®‡ßç‡¶°‡ßá ‡¶∞‡¶ø‡¶Ø‡¶º‡ßá‡¶≤-‡¶ü‡¶æ‡¶á‡¶Æ‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶π‡ßü‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá‡•§
                    </p>
                  </div>
                  <div className="pt-5 mt-4 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">‚ö° PORTAL STATUS: <strong className="text-white">ONLINE</strong></span>
                    <span className="text-[#dbaa61]">Staff Control Room</span>
                  </div>
                </div>

                {/* Quick Shortcuts Panel */}
                <div className="col-span-full lg:col-span-5 bg-[#0f1118] border border-white/[0.04] p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">‚ö° QUICK DASHBOARD SHORTCUTS</h4>
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

              {/* üö® DATABASE RESET & FRESH TESTING CONTROLS */}
              <div className="bg-[#1c1012] border border-red-500/20 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] font-mono">DATABASE SECTOR SCRUBBER (DEVELOPER ACTION)</h4>
                  </div>
                  <p className="text-[11px] text-slate-350 font-semibold leading-relaxed">
                    ‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ‡ßá‡¶∞ ‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡ßá‡¶∞ ‡¶∏‡¶ï‡¶≤ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü (users), ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶π‡¶ø‡¶∏‡ßç‡¶ü‡ßç‡¶∞‡¶ø (bookings) ‡¶è‡¶¨‡¶Ç ‡¶∞‡¶ø‡¶≤‡ßá‡¶ü‡ßá‡¶° ‡¶ü‡ßç‡¶∞‡¶æ‡¶®‡¶ú‡ßá‡¶ï‡¶∂‡¶® ‡¶°‡¶æ‡¶ü‡¶æ (payments) ‡¶´‡¶æ‡ßü‡¶æ‡¶∞‡¶∏‡ßç‡¶ü‡ßã‡¶∞ ‡¶ï‡ßç‡¶≤‡¶æ‡¶â‡¶° ‡¶•‡ßá‡¶ï‡ßá ‡¶è‡¶ï‡¶¶‡¶Æ ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßç‡¶∞‡ßá‡¶∂ ‡¶ü‡ßá‡¶∏‡ßç‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶®‡¶ø‡¶ö‡ßá‡¶∞ ‡¶∞‡¶ø‡¶∏‡ßá‡¶ü ‡¶¨‡¶æ‡¶ü‡¶®‡ßá ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
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
                ‡¶¨‡¶°‡¶ø ‡¶ü‡¶æ‡¶ö ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï‡¶¶‡ßá‡¶∞ ‡¶ü‡ßç‡¶∞‡¶æ‡¶®‡¶ú‡ßá‡¶ï‡¶∂‡¶® ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ ‡¶®‡¶ø‡¶ö‡ßá ‡¶¶‡ßá‡¶ì‡ßü‡¶æ ‡¶π‡¶≤‡ßã‡•§ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶π‡¶ø‡¶∏‡ßá‡¶¨‡ßá ‡¶ü‡ßç‡¶∞‡¶æ‡¶®‡¶ú‡ßá‡¶ï‡¶∂‡¶® ‡¶Ü‡¶á‡¶°‡¶ø ‡¶Æ‡¶ø‡¶≤‡¶ø‡ßü‡ßá ‡¶Æ‡ßá‡¶Æ‡ßç‡¶¨‡¶æ‡¶∞ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® 
                <strong className="text-emerald-400"> Approve </strong> (VIP ‡¶è‡¶ï‡ßç‡¶ü‡¶ø‡¶≠‡ßá‡¶∂‡¶® ‡¶ü‡¶ø‡¶ï‡¶ø‡¶ü) ‡¶Ö‡¶•‡¶¨‡¶æ <strong className="text-rose-400"> Reject </strong> ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingPaymentsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    üöÄ NO PENDING TRANSACTION TICKETS TO VERIFY
                  </div>
                ) : (
                  pendingPaymentsList.map((pay) => (
                    <div
                      key={pay.id}
                      className="bg-[#11131a] border border-blue-500/15 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-blue-500/30 transition-all font-sans"
                    >
                      <div className="flex justify-between items-start text-xs border-b border-white/5 pb-3">
                        <div>
                          <p className="text-white font-extrabold text-sm font-sans flex items-center flex-wrap gap-1">
                            <span>Client:</span>
                            <span className="text-blue-400 font-mono font-bold select-all">@{pay.username}</span>
                            {(() => {
                              const onlineSession = activePresenceList.find(s => s.role === 'client' && s.identifier === (pay.username || '').toLowerCase().trim());
                              if (!onlineSession) return null;
                              return (
                                <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-[8px] font-black text-blue-400 font-mono animate-pulse relative shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping absolute" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 relative" />
                                  <span>ONLINE: {formatPresenceDuration(onlineSession.activeDurationMs)}</span>
                                </span>
                              );
                            })()}
                          </p>
                          <p className="text-[10px] text-slate-400 font-black tracking-normal uppercase mt-1">
                            {pay.tierName} ‚Ä¢ {pay.method}
                          </p>
                        </div>
                        <span className="text-emerald-400 font-black font-mono text-base bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                          ‡ß≥ {pay.price}
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
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">üì∏ Payment Screenshot (‡¶∏‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶®‡¶∂‡¶ü):</span>
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
                              View Full Size Image ‚Üó
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
                          <span className={pay.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}>‚óè</span>
                          <span className="text-slate-300 font-bold">{pay.username}</span>
                          <span className="text-slate-500 font-medium">({pay.tierName})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">‡ß≥{pay.price}</span>
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
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Registered Client Profiles Directory / ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú</h4>
                    <p className="text-[9px] text-slate-500 font-medium">‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶∏‡¶Æ‡¶Ø‡¶º ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï‡¶¶‡ßá‡¶∞ ‡¶•‡ßá‡¶ï‡ßá ‡¶∏‡¶Ç‡¶ó‡ßÉ‡¶π‡ßÄ‡¶§ ‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶§‡¶•‡ßç‡¶Ø‡¶æ‡¶¶‡¶ø</p>
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
                        title="‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡ßÅ‡¶® (Remove Client)"
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
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">FULL NAME / ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ</span>
                          <span className="text-xs text-white font-black block mt-1 select-all">{selectedClient.name}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">PHONE NUMBER / ‡¶Æ‡ßã‡¶¨‡¶æ‡¶á‡¶≤ ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞</span>
                          <span className="text-xs text-emerald-400 font-mono font-black block mt-1 select-all">{selectedClient.phone}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">EMAIL ADDRESS / ‡¶á‡¶Æ‡ßá‡¶á‡¶≤</span>
                          <span className="text-xs text-blue-400 font-mono font-black block mt-1 select-all">{selectedClient.email || 'No Email'}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">GENDER / ‡¶≤‡¶ø‡¶ô‡ßç‡¶ó</span>
                          <span className="text-xs text-[#dbaa61] font-black block mt-1 uppercase">
                            {selectedClient.gender === 'male' ? 'üë® Male / ‡¶™‡ßÅ‡¶∞‡ßÅ‡¶∑' : selectedClient.gender === 'female' ? 'üë© Female / ‡¶®‡¶æ‡¶∞‡ßÄ' : 'Not Specified'}
                          </span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">BIRTHDAY OR AGE / ‡¶¨‡ßü‡¶∏ ‡¶ì ‡¶ú‡¶®‡ßç‡¶Æ ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ</span>
                          <span className="text-xs text-white font-black block mt-1 uppercase">
                            {selectedClient.birthday || 'Not Specified'}
                          </span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">AUTHENTICATED METHOD / ‡¶≤‡¶ó‡¶á‡¶® ‡¶ü‡¶æ‡¶á‡¶™</span>
                          <span className="text-xs text-cyan-400 font-bold block mt-1 uppercase">
                            {selectedClient.authMethod || 'Password'}
                          </span>
                        </div>
                      </div>

                      {/* NID Section */}
                      <div className="space-y-3.5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Verification Documents (NID / Birth Certificate) / ‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶°‡¶ï‡ßÅ‡¶Æ‡ßá‡¶®‡ßç‡¶ü</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Front image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID / Birth Certificate Front (‡¶∏‡¶æ‡¶Æ‡¶®‡ßá‡¶∞ ‡¶Ö‡¶Ç‡¶∂ / ‡¶ú‡¶®‡ßç‡¶Æ‡¶®‡¶ø‡¶¨‡¶®‡ßç‡¶ß‡¶®)</span>
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
                                  Click to Zoom & Rotate / ‡¶ú‡ßÅ‡¶Æ ‡¶ì ‡¶∞‡ßã‡¶ü‡ßá‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶® üîç
                                </div>
                              </button>
                            ) : (
                              <div className="h-32 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center text-[10.5px] text-slate-600 font-medium">
                                Document not provided / ‡¶§‡¶•‡ßç‡¶Ø ‡¶¶‡ßá‡ßü‡¶æ ‡¶π‡ßü‡¶®‡¶ø
                              </div>
                            )}
                          </div>

                          {/* Back image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID Back / Document Page 2 (‡¶™‡ßá‡¶õ‡¶®‡ßá‡¶∞ ‡¶Ö‡¶Ç‡¶∂ / ‡¶™‡ßÉ‡¶∑‡ßç‡¶†‡¶æ ‡ß®)</span>
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
                                  Click to Zoom & Rotate / ‡¶ú‡ßÅ‡¶Æ ‡¶ì ‡¶∞‡ßã‡¶ü‡ßá‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶® üîç
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
                                  <p className="text-[9.5px] text-slate-500 mt-0.5">{b.date} ‚Ä¢ {b.time} @ {b.location}</p>
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
                            {selectedClient.isBlocked ? 'üîì Unblock Client' : '‚õî Block Client'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveClient(selectedClient)}
                            className="flex-1 bg-rose-900/20 hover:bg-rose-900/25 text-rose-400 border border-rose-500/25 text-[10.5px] font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer"
                          >
                            üóëÔ∏è Delete Account
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
                ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï‡¶¶‡ßá‡¶∞ ‡¶Æ‡ßá‡¶Æ‡ßç‡¶¨‡¶æ‡¶∞‡¶∂‡¶ø‡¶™ ‡¶Ü‡¶™‡¶ó‡ßç‡¶∞‡ßá‡¶° ‡¶∞‡¶ø‡¶ï‡ßã‡ßü‡ßá‡¶∏‡ßç‡¶ü ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ ‡¶®‡¶ø‡¶ö‡ßá ‡¶¶‡ßá‡¶ì‡ßü‡¶æ ‡¶π‡¶≤‡ßã‡•§ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶π‡¶ø‡¶∏‡ßá‡¶¨‡ßá ‡¶ó‡ßç‡¶∞‡¶æ‡¶π‡¶ï‡¶¶‡ßá‡¶∞ bKash/Nagad/Rocket ‡¶ü‡ßç‡¶∞‡¶æ‡¶®‡¶ú‡ßá‡¶ï‡¶∂‡¶® ‡¶Ü‡¶á‡¶°‡¶ø ‡¶Æ‡¶ø‡¶≤‡¶ø‡ßü‡ßá ‡¶Æ‡ßá‡¶Æ‡ßç‡¶¨‡¶æ‡¶∞ ‡¶∏‡ßá‡¶ï‡¶∂‡¶® 
                <strong className="text-emerald-400"> Approve </strong> (‡¶Æ‡ßá‡¶Æ‡ßç‡¶¨‡¶æ‡¶∞‡¶∂‡¶ø‡¶™ ‡¶è‡¶ï‡ßç‡¶ü‡¶ø‡¶≠‡ßá‡¶∂‡¶®) ‡¶Ö‡¶•‡¶¨‡¶æ <strong className="text-rose-400"> Reject </strong> ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingMembershipsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    üöÄ NO PENDING MEMBERSHIP REQUESTS TO VERIFY
                  </div>
                ) : (
                  pendingMembershipsList.map((pay) => (
                    <div
                      key={pay.id}
                      className="bg-[#11131a] border border-amber-500/15 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-amber-500/30 transition-all font-sans"
                    >
                      <div className="flex justify-between items-start text-xs border-b border-white/5 pb-3">
                        <div>
                          <p className="text-white font-extrabold text-sm font-sans flex items-center flex-wrap gap-1">
                            <span>Client:</span>
                            <span className="text-blue-400 font-mono font-bold select-all">@{pay.username}</span>
                            {(() => {
                              const onlineSession = activePresenceList.find(s => s.role === 'client' && s.identifier === (pay.username || '').toLowerCase().trim());
                              if (!onlineSession) return null;
                              return (
                                <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded text-[8px] font-black text-blue-400 font-mono animate-pulse relative shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping absolute" />
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 relative" />
                                  <span>ONLINE: {formatPresenceDuration(onlineSession.activeDurationMs)}</span>
                                </span>
                              );
                            })()}
                          </p>
                          <p className="text-[10px] text-amber-400 font-black tracking-normal uppercase mt-1">
                            üí≥ REQUESTING {pay.tierName.toUpperCase()} MEMBERSHIP
                          </p>
                        </div>
                        <span className="text-amber-400 font-black font-mono text-base bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/15">
                          ‡ß≥ {pay.price}
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
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">üì∏ Payment Screenshot (‡¶∏‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶®‡¶∂‡¶ü):</span>
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
                              View Full Size Image ‚Üó
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
                          <span className={pay.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}>‚óè</span>
                          <span className="text-slate-300 font-bold">{pay.username}</span>
                          <span className="text-slate-500 font-medium">({pay.tierName})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">‡ß≥{pay.price}</span>
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
                  <div className="flex bg-black/45 p-1 rounded-xl border border-white/5 gap-1 select-none flex-wrap">
                    <button
                      type="button"
                      onClick={() => { setPartnerSubTab('active'); resetCompanionForm(); }}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                        partnerSubTab === 'active'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Active Partners Database ({companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined' && c.status !== 'Incomplete').length})
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
                    <button
                      type="button"
                      onClick={() => { setPartnerSubTab('incomplete'); resetCompanionForm(); }}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        partnerSubTab === 'incomplete'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Incomplete Signups ({companions.filter(c => c.status === 'Incomplete').length})
                      {companions.filter(c => c.status === 'Incomplete').length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-450 animate-pulse" />
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
                            ? companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined' && c.status !== 'Incomplete' && (c.category || 'Female Model') === cat).length
                            : partnerSubTab === 'incomplete'
                            ? companions.filter(c => c.status === 'Incomplete' && (c.category || 'Female Model') === cat).length
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

                    {/* Model Code (Tag) */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Model Code / ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶ï‡ßã‡¶° (e.g. # 550800)</label>
                      <input
                        type="text"
                        value={compTag}
                        onChange={(e) => setCompTag(e.target.value)}
                        placeholder="e.g. # 550800 (or leave blank to auto-generate)"
                        className="w-full bg-[#11131a] border border-[#ac843c]/40 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Badge Tier */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Select Category * / ‡ß™‡¶ü‡¶ø ‡¶ï‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶ó‡¶∞‡¶ø</label>
                      <select
                        value={compBadge}
                        onChange={(e) => setCompBadge(e.target.value as any)}
                        className="w-full bg-[#11131a] border border-[#ac843c]/40 rounded-xl px-3 py-2 text-white font-heavy focus:outline-none focus:border-emerald-500"
                      >
                        <option value="REGULAR">Regular Member (‡¶∞‡ßá‡¶ó‡ßÅ‡¶≤‡¶æ‡¶∞ ‡¶ï‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶ó‡¶∞‡¶ø)</option>
                        <option value="PREMIUM">Premium Member (‡¶™‡ßç‡¶∞‡¶ø‡¶Æ‡¶ø‡ßü‡¶æ‡¶Æ ‡¶ï‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶ó‡¶∞‡¶ø)</option>
                        <option value="ELITE">Elite Society (‡¶è‡¶≤‡¶ø‡¶ü ‡¶ï‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶ó‡¶∞‡¶ø)</option>
                        <option value="DEMO">Demo Class (‡¶°‡¶ø‡¶Æ‡ßã ‡¶ï‡ßç‡¶Ø‡¶æ‡¶ü‡¶æ‡¶ó‡¶∞‡¶ø)</option>
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
                        <option value="Female Model">Female Model (‡¶´‡¶ø‡¶Æ‡ßá‡¶≤ ‡¶Æ‡¶°‡ßá‡¶≤)</option>
                        <option value="Male Model">Male Model (‡¶Æ‡ßá‡¶≤ ‡¶Æ‡¶°‡ßá‡¶≤)</option>
                        <option value="Sperm Donor">Sperm Donor (‡¶∏‡ßç‡¶™‡¶æ‡¶∞‡ßç‡¶Æ ‡¶°‡ßã‡¶®‡¶æ‡¶∞)</option>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Height / ‡¶â‡¶ö‡ßç‡¶ö‡¶§‡¶æ</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Skin Complexion / ‡¶ó‡¶æ‡ßü‡ßá‡¶∞ ‡¶∞‡¶ô</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Weight / ‡¶ì‡¶ú‡¶®</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Bust/Chest / ‡¶∏‡ßç‡¶§‡¶®/‡¶¨‡ßÅ‡¶ï (‡¶á‡¶û‡ßç‡¶ö‡¶ø)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Waist / ‡¶ï‡ßã‡¶Æ‡¶∞ (‡¶á‡¶û‡ßç‡¶ö‡¶ø)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hip / ‡¶®‡¶ø‡¶§‡¶Æ‡ßç‡¶¨ (‡¶á‡¶û‡ßç‡¶ö‡¶ø)</label>
                      <input
                        type="text"
                        value={compHip}
                        onChange={(e) => setCompHip(e.target.value)}
                        placeholder="e.g. 36 in"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Penis Size (For Male Model) */}
                    {compCategory === 'Male Model' && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-indigo-400 uppercase">Penis Size / ‡¶≤‡¶ø‡¶ô‡ßç‡¶ó‡ßá‡¶∞ ‡¶Ü‡¶ï‡¶æ‡¶∞</label>
                        <input
                          type="text"
                          value={compPenisSize}
                          onChange={(e) => setCompPenisSize(e.target.value)}
                          placeholder="e.g. 6.5 inch"
                          className="w-full bg-[#11131a] border border-indigo-950/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    )}

                    {/* Duration Time (For Male Model) */}
                    {compCategory === 'Male Model' && (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-indigo-400 uppercase">Duration Time / ‡¶∏‡¶π‡¶¨‡¶æ‡¶∏‡ßá‡¶∞ ‡¶∏‡ßç‡¶•‡¶æ‡¶Ø‡¶º‡¶ø‡¶§‡ßç‡¶¨‡¶ï‡¶æ‡¶≤</label>
                        <input
                          type="text"
                          value={compDurationTime}
                          onChange={(e) => setCompDurationTime(e.target.value)}
                          placeholder="e.g. 35-45 mins"
                          className="w-full bg-[#11131a] border border-indigo-950/40 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Phone Number / ‡¶´‡ßã‡¶® ‡¶®‡¶Æ‡ßç‡¶¨‡¶∞</label>
                      <input
                        type="text"
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        placeholder="e.g. +88017XXXXXXXX"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* WhatsApp Number */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">WhatsApp Number / ‡¶π‡ßã‡ßü‡¶æ‡¶ü‡¶∏‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™</label>
                      <input
                        type="text"
                        value={compWhatsapp}
                        onChange={(e) => setCompWhatsapp(e.target.value)}
                        placeholder="e.g. +88017XXXXXXXX"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Telegram ID */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Telegram ID / ‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ ‡¶Ü‡¶á‡¶°‡¶ø</label>
                      <input
                        type="text"
                        value={compTelegram}
                        onChange={(e) => setCompTelegram(e.target.value)}
                        placeholder="e.g. username_or_id"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* CORE SERVICE ACTIVATIONS & CUSTOM FEE STRUCTURES */}
                    <div className="sm:col-span-2 p-5 bg-[#030a1c]/65 border border-blue-500/15 rounded-2xl space-y-5">
                      <div>
                        <span className="block text-[11px] font-mono font-black tracking-widest text-[#2ebdff] uppercase">
                          SERVICE CONTROLS & DURATION RATES / ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏ ‡¶ì ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶∞‡ßá‡¶ü ‡¶®‡¶ø‡ßü‡¶®‡ßç‡¶§‡ßç‡¶∞‡¶£
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">üìç REAL MEET DURATION RATES (‡ß≥ Taka):</span>
                            
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
                                      <span className="text-slate-500 text-[10px]">‡ß≥</span>
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
                                      ‚úï
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
                              ‚ûï Add Real Meet Rate Option (+ ‡¶®‡¶§‡ßÅ‡¶® ‡¶∞‡ßá‡¶ü ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®)
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">üìç VIDEO CAM DURATION RATES (‡ß≥ Taka):</span>
                            
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
                                      <span className="text-slate-550 text-[10px]">‡ß≥</span>
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
                                      ‚úï
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
                              ‚ûï Add Video Cam Rate Option (+ ‡¶®‡¶§‡ßÅ‡¶® ‡¶∞‡ßá‡¶ü ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®)
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">DURATION PRICE OVERRIDES (‡ß≥ Taka):</span>
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

                      {/* 4. TOUR SERVICE CONTROL */}
                      {compCategory !== 'Sperm Donor' && (
                        <div className="border border-slate-800/80 rounded-xl p-3 bg-black/40 space-y-3 col-span-1 sm:col-span-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-855 pb-3">
                            <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-slate-800/60">
                              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={compIsTourActive}
                                  onChange={(e) => setCompIsTourActive(e.target.checked)}
                                  className="w-4 h-4 rounded text-purple-500 bg-[#11131a] border-slate-800 focus:ring-purple-500 focus:ring-opacity-25"
                                />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-250">Tour Service</span>
                              </label>
                              <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-wider ${compIsTourActive ? 'bg-purple-500/10 text-purple-450 border border-purple-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                                {compIsTourActive ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-slate-800/60">
                              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={compIsLiveTogetherActive}
                                  onChange={(e) => setCompIsLiveTogetherActive(e.target.checked)}
                                  className="w-4 h-4 rounded text-purple-500 bg-[#11131a] border-slate-800 focus:ring-purple-500 focus:ring-opacity-25"
                                />
                                <span className="text-xs font-black uppercase tracking-wider text-slate-250">Live Together</span>
                              </label>
                              <span className={`text-[8px] px-2 py-0.5 rounded font-black tracking-wider ${compIsLiveTogetherActive ? 'bg-purple-500/10 text-purple-450 border border-purple-500/20' : 'bg-rose-500/10 text-rose-450 border border-rose-500/20'}`}>
                                {compIsLiveTogetherActive ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </div>
                          </div>

                          {(compIsTourActive || compIsLiveTogetherActive) && (
                            <div className="space-y-3">
                              <span className="block text-[8px] font-bold text-slate-400 tracking-wider">üìç TOUR DURATION RATES (‡ß≥ Taka) / ‡¶ü‡ßç‡¶Ø‡ßÅ‡¶∞ ‡¶∞‡ßá‡¶ü:</span>
                              
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
                                        <span className="text-slate-550 text-[10px]">‡ß≥</span>
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
                                        ‚úï
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
                                ‚ûï Add Tour Rate Option (+ ‡¶®‡¶§‡ßÅ‡¶® ‡¶ü‡ßç‡¶Ø‡ßÅ‡¶∞ ‡¶∞‡ßá‡¶ü ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®)
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Multi-Select Operational Areas */}
                    <div className="space-y-2 bg-[#0d0e14]/50 border border-slate-800 p-4 rounded-2xl">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                          Operational Areas / ‡¶è‡¶≤‡¶æ‡¶ï‡¶æ ‡¶∏‡¶Æ‡ßÇ‡¶π (‡¶è‡¶ï‡¶æ‡¶ß‡¶ø‡¶ï ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡ßá‡¶®)
                        </label>
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 font-bold px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                          {getSelectedAreas().length} selected
                        </span>
                      </div>

                      {/* Display Selected Areas as Tags */}
                      <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2.5 bg-[#11131a] rounded-xl border border-slate-900">
                        {getSelectedAreas().length === 0 ? (
                          <span className="text-[10px] text-slate-500 italic py-1 pl-1">
                            No areas selected yet. Click pills below to select operational zones.
                          </span>
                        ) : (
                          getSelectedAreas().map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center gap-1 text-[10px] font-black bg-[#dbaa61]/10 text-[#dbaa61] px-2 py-1 rounded-lg border border-[#dbaa61]/25 uppercase font-mono"
                            >
                              {area}
                              <button
                                type="button"
                                onClick={() => handleRemoveArea(area)}
                                className="text-rose-400 hover:text-rose-300 font-black ml-1 text-xs cursor-pointer focus:outline-none transition-all"
                              >
                                ‚úï
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Filter/Custom Area Input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="custom-area-input"
                          placeholder="Type custom area and press Enter / ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶è‡¶≤‡¶æ‡¶ï‡¶æ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®"
                          className="flex-1 bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-bold"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                handleToggleArea(val);
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById('custom-area-input') as HTMLInputElement;
                            if (el && el.value.trim()) {
                              handleToggleArea(el.value.trim());
                              el.value = '';
                            }
                          }}
                          className="bg-[#dbaa61] hover:bg-[#cdaf55] text-black text-[10px] font-black tracking-wider uppercase px-4 py-2 rounded-xl transition cursor-pointer"
                        >
                          Add (‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®)
                        </button>
                      </div>

                      {/* Structured Cities Selection List */}
                      <div className="space-y-3 pt-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-none">
                        {structuredCities && structuredCities.length > 0 ? (
                          structuredCities.map((p) => (
                            <div key={p.id} className="space-y-1.5 border-t border-slate-900 pt-2.5 first:border-0 first:pt-0">
                              <h4 className="text-[9px] font-black tracking-widest text-[#dbaa61] uppercase font-mono pl-0.5">
                                {p.name.toUpperCase()} REGION
                              </h4>
                              <div className="flex flex-wrap gap-1.5">
                                {p.subAreas.map((sub) => {
                                  const areaLabel = `${sub}, ${p.name}`;
                                  const isSel = getSelectedAreas().some(
                                    (a) => a.toLowerCase() === areaLabel.toLowerCase() || a.toLowerCase() === sub.toLowerCase()
                                  );
                                  return (
                                    <button
                                      key={sub}
                                      type="button"
                                      onClick={() => handleToggleArea(areaLabel)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-150 cursor-pointer border ${
                                        isSel
                                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/35 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                          : 'bg-[#141620] hover:bg-[#1c1e2d] text-slate-400 hover:text-white border-slate-800/80'
                                      }`}
                                    >
                                      {sub}
                                    </button>
                                  );
                                })}
                                {p.subAreas.length === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleArea(p.name)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-150 cursor-pointer border ${
                                      getSelectedAreas().some((a) => a.toLowerCase() === p.name.toLowerCase())
                                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/35'
                                        : 'bg-[#141620] hover:bg-[#1c1e2d] text-slate-400 hover:text-white border-slate-800/80'
                                    }`}
                                  >
                                    {p.name}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {cities.map((city) => {
                              const isSel = getSelectedAreas().some((a) => a.toLowerCase() === city.toLowerCase());
                              return (
                                <button
                                  key={city}
                                  type="button"
                                  onClick={() => handleToggleArea(city)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all duration-150 cursor-pointer border ${
                                    isSel
                                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/35'
                                      : 'bg-[#141620] hover:bg-[#1c1e2d] text-slate-400 hover:text-white border-slate-800/80'
                                  }`}
                                >
                                  {city}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rate per Hour */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hourly Remundation Rate (‡ß≥ Taka)</label>
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
                        CUSTOM FEES PER SERVICE / ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏ ‡¶∞‡ßá‡¶ü (‡¶ê‡¶ö‡ßç‡¶õ‡¶ø‡¶ï)
                      </span>
                      <p className="text-[9px] text-slate-500 font-medium">
                        If left blank, the standard hourly rate and multipliers will be applied. Fill these to set custom fixed rates for particular options.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Custom Rate: REAL */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Real Service Rate (‡ß≥/hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Cam Service Rate (‡ß≥/hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Make Out Rate (‡ß≥/hr)</label>
                          <input
                            type="number"
                            placeholder="Defaults to 35% off standard hourly rate"
                            value={compRateMakeOut}
                            onChange={(e) => setCompRateMakeOut(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                          />
                        </div>

                        {/* Custom Rate: TOUR */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Tour / ‡¶ü‡ßç‡¶Ø‡ßÅ‡¶∞ Rate (‡ß≥/hr)</label>
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
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Partner Image / ‡¶õ‡¶¨‡¶ø *</label>
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
                            Upload Image / ‡¶õ‡¶¨‡¶ø ‡¶Ü‡¶™‡¶≤‡ßã‡¶°
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
                          Additional Gallery Portfolio Photos / ‡¶Ö‡¶§‡¶ø‡¶∞‡¶ø‡¶ï‡ßç‡¶§ ‡¶õ‡¶¨‡¶ø ‡¶ó‡ßç‡¶Ø‡¶æ‡¶≤‡¶æ‡¶∞‡¶ø (‡¶∏‡¶∞‡ßç‡¶¨‡ßã‡¶ö‡ßç‡¶ö ‡ß™‡¶ü‡¶ø)
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
                      üì≠ No active {partnerCategoryFilter.toLowerCase()} partners registered in database yet
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-none">
                      {companions.filter(c => c.status !== 'Pending' && c.status !== 'Declined' && (c.category || 'Female Model') === partnerCategoryFilter).map((comp) => (
                    <div
                      key={comp.id}
                      className={`border rounded-2xl p-4 flex gap-3 relative justify-between transition-all ${
                        comp.isBlocked 
                          ? 'bg-rose-950/10 border-rose-900/40 opacity-75' 
                          : 'bg-[#11131a] border-[#1d232a] hover:border-blue-500/30'
                      }`}
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
                            {comp.isBlocked && (
                              <span className="text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono font-black tracking-normal px-1 rounded-sm uppercase shrink-0">
                                ‚õî Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">
                            {comp.city || 'Dhaka'} ‚Ä¢ {comp.age} Yrs ‚Ä¢ {comp.height}
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
                              ‡ß≥ {comp.rate}/hr (Base)
                            </p>
                            {(comp.rateReal || comp.rateCam || comp.rateMakeOut || comp.rateLiveTogether) && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                {comp.rateReal && <span className="bg-blue-500/10 text-sky-400 text-[7px] px-1 rounded border border-blue-500/10 uppercase font-mono">Real: ‡ß≥{comp.rateReal}</span>}
                                {comp.rateCam && <span className="bg-cyan-500/10 text-cyan-400 text-[7px] px-1 rounded border border-cyan-500/10 uppercase font-mono font-bold">Cam: ‡ß≥{comp.rateCam}</span>}
                                {comp.rateMakeOut && <span className="bg-pink-500/10 text-pink-400 text-[7px] px-1 rounded border border-pink-500/10 uppercase font-mono">Out: ‡ß≥{comp.rateMakeOut}</span>}
                                {comp.rateLiveTogether && <span className="bg-purple-500/10 text-purple-400 text-[7px] px-1 rounded border border-purple-500/10 uppercase font-mono font-semibold">Together: ‡ß≥{comp.rateLiveTogether}</span>}
                              </div>
                            )}
                          </div>

                          {/* Contacts Info Badge */}
                          {(comp.phone || comp.whatsapp || comp.telegram) && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1 text-[9.5px]">
                              {comp.phone && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 font-bold uppercase text-[7.5px] tracking-wider shrink-0">Phone:</span>
                                  <a href={`tel:${comp.phone}`} className="text-blue-400 font-mono hover:underline font-extrabold select-all truncate" title="Call partner">{comp.phone}</a>
                                </div>
                              )}
                              {comp.whatsapp && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 font-bold uppercase text-[7.5px] tracking-wider shrink-0">WhatsApp:</span>
                                  <a href={`https://wa.me/${comp.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-mono hover:underline font-extrabold select-all truncate" title="WhatsApp Chat">{comp.whatsapp}</a>
                                </div>
                              )}
                              {comp.telegram && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-500 font-bold uppercase text-[7.5px] tracking-wider shrink-0">Telegram:</span>
                                  <a href={`https://t.me/${comp.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 font-mono hover:underline font-extrabold select-all truncate">@{comp.telegram.replace('@', '')}</a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggleBlockCompanion(comp)}
                          title={comp.isBlocked ? "Unblock Companion / ‡¶¨‡ßç‡¶≤‡¶ï ‡¶ñ‡ßÅ‡¶≤‡ßÅ‡¶®" : "Block Companion / ‡¶¨‡ßç‡¶≤‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®"}
                          className={`p-2 rounded-lg border transition cursor-pointer ${
                            comp.isBlocked
                              ? 'bg-emerald-950/20 border-emerald-900 text-emerald-450 hover:text-white hover:bg-emerald-900/45'
                              : 'bg-[#181a24] border-slate-800 text-amber-500 hover:text-white hover:bg-amber-950/30'
                          }`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
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
              ) : partnerSubTab === 'incomplete' ? (
                /* Incomplete Signups list */
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-none animate-fadeIn">
                  {companions.filter(c => c.status === 'Incomplete' && (c.category || 'Female Model') === partnerCategoryFilter).length === 0 ? (
                    <div className="py-14 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-[#11131a]/40 border border-dashed border-slate-800 rounded-3xl select-none">
                      üì¨ NO INCOMPLETE SIGNUPS (LEADS) IN {partnerCategoryFilter.toUpperCase()} CATEGORY
                    </div>
                  ) : (
                    companions.filter(c => c.status === 'Incomplete' && (c.category || 'Female Model') === partnerCategoryFilter).map((comp) => (
                      <div
                        key={comp.id}
                        className="bg-[#11131a] border border-amber-500/15 p-4.5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-amber-500/25 transition-all text-left"
                      >
                        <div className="flex sm:items-center justify-between gap-3 border-b border-amber-500/5 pb-3 flex-col sm:flex-row">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0 font-black text-xs font-mono">
                              INC
                            </div>
                            <div>
                              <h5 className="text-white text-sm font-black flex items-center gap-1.5 flex-wrap">
                                {comp.name}
                                <span className="text-[9.5px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold tracking-normal uppercase font-mono">
                                  ‚ö†Ô∏è INCOMPLETE LEAD
                                </span>
                              </h5>
                              <p className="text-[10px] text-slate-400 font-bold select-all font-mono">Email: {comp.email || 'N/A'}</p>
                            </div>
                          </div>
                          
                          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border self-start sm:self-auto bg-amber-500/10 text-amber-400 border-amber-500/20">
                            {comp.category || 'Female Model'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1.5 bg-black/35 p-3.5 rounded-xl border border-slate-900">
                            <div>
                              <span className="text-slate-500 text-[8px] uppercase font-mono block">Age & Target Area:</span>
                              <span className="text-slate-300 font-bold leading-none">{comp.age} Years ‚Ä¢ {comp.city || 'Dhaka'}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-900">
                              <span className="text-slate-500 text-[8px] uppercase font-mono block">Status detail:</span>
                              <p className="text-slate-400 italic font-semibold leading-relaxed leading-tight mt-0.5">
                                User began registration but did not complete final submission or payment.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 bg-black/35 p-3.5 rounded-xl border border-slate-900 flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 text-[8px] uppercase font-mono">Phone Number:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[#dbaa61] font-mono font-black tracking-normal select-all">{comp.phone}</span>
                                <a
                                  href={`tel:${comp.phone}`}
                                  className="p-1 rounded bg-[#dbaa61]/10 text-[#dbaa61] hover:bg-[#dbaa61]/25 transition flex items-center justify-center"
                                  title="Call Lead"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                            {comp.whatsapp && (
                              <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                                <span className="text-slate-500 text-[8px] uppercase font-mono">WhatsApp:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-400 font-mono font-black tracking-normal select-all">{comp.whatsapp}</span>
                                  <a
                                    href={`https://wa.me/${comp.whatsapp.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition flex items-center justify-center"
                                    title="Message on WhatsApp"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-1 border-t border-white/5 pt-3">
                          <button
                            type="button"
                            onClick={() => handleEditCompanion(comp)}
                            className="bg-[#dbaa61]/10 hover:bg-[#dbaa61] hover:text-black border border-[#dbaa61]/20 text-[#dbaa61] text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit & Publish (‡¶∏‡¶Æ‡ßç‡¶™‡¶æ‡¶¶‡¶®‡¶æ ‡¶ì ‡¶™‡¶æ‡¶¨‡¶≤‡¶ø‡¶∂)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompanion(comp.id)}
                            className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Lead (‡¶≤‡¶ø‡¶° ‡¶Æ‡ßÅ‡¶õ‡ßÅ‡¶®)
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* Applicants career review list */
                <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-none animate-fadeIn">
                  {pendingApplicantsList.filter(c => (c.category || 'Female Model') === partnerCategoryFilter).length === 0 ? (
                    <div className="py-14 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-[#11131a]/40 border border-dashed border-slate-800 rounded-3xl select-none">
                      üì¨ NO PENDING CAREER APPLICATIONS IN {partnerCategoryFilter.toUpperCase()} CATEGORY
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
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Height (‡¶â‡¶ö‡ßç‡¶ö‡¶§‡¶æ):</span>
                            <span className="text-white font-heavy">{comp.height}</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Rate / hourly:</span>
                            <span className="text-emerald-400 font-black font-mono">‡ß≥ {comp.rate}/hr</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">City (‡¶∂‡¶π‡¶∞):</span>
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
                          {comp.whatsapp && (
                            <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                              <span className="text-slate-500 text-[8px] uppercase font-mono">WhatsApp Number:</span>
                              <span className="text-emerald-400 font-mono font-black tracking-normal select-all">{comp.whatsapp}</span>
                            </div>
                          )}
                          {comp.telegram && (
                            <div className="pt-2 border-t border-slate-900 flex justify-between items-center">
                              <span className="text-slate-500 text-[8px] uppercase font-mono">Telegram ID:</span>
                              <span className="text-purple-400 font-mono font-black tracking-normal select-all">@{comp.telegram.replace('@', '')}</span>
                            </div>
                          )}
                        </div>

                        {/* Service configuration section for Admin verification */}
                        {(comp.category || 'Female Model') === 'Female Model' && (
                          <div className="bg-[#181a25]/60 border border-blue-900/25 p-3.5 rounded-xl space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-wider text-[#dbaa61] block font-mono">
                              ‚öôÔ∏è CONFIGURE APPROVED SERVICES & HOURLY RATES (‡ß≥)
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Real Service Rate (‡ß≥)</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Face Cam Rate (‡ß≥)</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Make Out Rate (‡ß≥)</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Tour / ‡¶ü‡ßç‡¶Ø‡ßÅ‡¶∞ (‡ß≥/day)</label>
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
                ‡¶Æ‡ßá‡¶°‡¶ø‡ßü‡¶æ ‡¶´‡¶æ‡¶á‡¶≤ ‡¶ï‡¶æ‡¶≤‡ßá‡¶ï‡¶∂‡¶® ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶ú‡¶æ‡¶∞‡•§ ‡¶Ø‡ßá‡¶ï‡ßã‡¶®‡ßã ‡¶®‡¶§‡ßÅ‡¶® ‡¶õ‡¶¨‡¶ø ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡¶§‡ßá ‡¶®‡¶ø‡¶ö‡ßá URL ‡¶™‡ßã‡¶∏‡ßç‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®‡•§ ‡¶Æ‡¶°‡ßá‡¶≤‡ßá ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ‡¶Ø‡ßá‡¶ï‡ßã‡¶®‡ßã ‡¶õ‡¶¨‡¶ø‡¶∞
                <strong className="text-blue-400"> Copy URL </strong> ‡¶¨‡¶æ‡¶ü‡¶® ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡¶≤‡ßá‡¶á ‡¶ö‡¶Æ‡ßé‡¶ï‡¶æ‡¶∞‡¶≠‡¶æ‡¶¨‡ßá ‡¶õ‡¶¨‡¶ø‡¶∞ ‡¶≤‡¶ø‡¶ô‡ßç‡¶ï ‡¶ï‡ßç‡¶≤‡¶ø‡¶™‡¶¨‡ßã‡¶∞‡ßç‡¶°‡ßá ‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá! 
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
                  ‡¶¨‡¶°‡¶ø ‡¶ü‡¶æ‡¶ö ‡¶Æ‡ßá‡¶Æ‡ßç‡¶¨‡¶æ‡¶∞‡¶¶‡ßá‡¶∞ ‡¶è‡¶ô‡ßç‡¶ï‡ßã‡¶Ø‡¶º‡¶æ‡¶∞‡¶ø ‡¶∞‡¶ø‡¶ï‡ßã‡¶Ø‡¶º‡ßá‡¶∏‡ßç‡¶ü ‡¶ì ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶≤‡¶ø‡¶∏‡ßç‡¶ü‡•§ ‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶®‡¶æ‡¶∞‡¶¶‡ßá‡¶∞ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç <strong className="text-emerald-400"> Approve & Send Mail </strong> ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡ßá ‡¶ï‡¶®‡¶´‡¶æ‡¶∞‡ßç‡¶Æ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§ ‡¶è‡¶§‡ßá ‡¶ï‡¶∞‡ßá ‡¶ï‡ßç‡¶∞‡ßá‡¶§‡¶æ‡¶∞ ‡¶á‡¶Æ‡ßá‡¶≤ ‡¶¨‡¶ï‡ßç‡¶∏‡ßá ‡¶∏‡¶Æ‡ßç‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶≠‡¶æ‡¶â‡¶ö‡¶æ‡¶∞ ‡¶ï‡ßã‡¶° ‡¶Æ‡ßá‡¶á‡¶≤ ‡¶Ü‡¶ï‡¶æ‡¶∞‡ßá ‡¶∏‡ßç‡¶¨‡ßü‡¶Ç‡¶ï‡ßç‡¶∞‡¶ø‡ßü‡¶≠‡¶æ‡¶¨‡ßá ‡¶™‡ßç‡¶∞‡ßá‡¶∞‡¶ø‡¶§ ‡¶π‡ßü‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá‡•§
                </p>

                {/* Sub-tabs to separate orders according to tier */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-950/75 border border-[#161a24] rounded-2xl">
                  {([
                    { value: 'ALL', en: 'All Orders', bn: '‡¶∏‡¶ï‡¶≤ ‡¶Ö‡¶∞‡ßç‡¶°‡¶æ‡¶∞', count: bookings.length },
                    { value: 'REGULAR', en: 'Regular', bn: '‡¶∞‡ßá‡¶ó‡ßÅ‡¶≤‡¶æ‡¶∞', count: regularOrdersCount },
                    { value: 'PREMIUM', en: 'Premium', bn: '‡¶™‡ßç‡¶∞‡¶ø‡¶Æ‡¶ø‡ßü‡¶æ‡¶Æ', count: premiumOrdersCount },
                    { value: 'ELITE', en: 'Elite', bn: '‡¶è‡¶≤‡¶ø‡¶ü', count: eliteOrdersCount }
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
                      üöÄ NO {orderTierFilter === 'ALL' ? '' : `${orderTierFilter} `}ACTIVE SERVICES BOOKINGS YET
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
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Date / ‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ:</span>
                              <span className="text-white font-heavy">{book.date}</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Duration (‡¶∏‡¶Æ‡ßü‡¶ï‡¶æ‡¶≤):</span>
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
                            const shareMessage = `üîî *‡¶®‡¶§‡ßÅ‡¶® ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶°‡¶ø‡¶ü‡ßá‡¶á‡¶≤‡¶∏!*
‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ
üë©üèº *‡¶Æ‡¶°‡ßá‡¶≤:* ${book.modelName} (${book.modelTag})
üë§ *‡¶ï‡ßç‡¶≤‡¶æ‡¶Ø‡¶º‡ßá‡¶®‡ßç‡¶ü ‡¶®‡¶æ‡¶Æ:* ${book.clientName || 'Anonymous User'}
üìû *‡¶ï‡ßç‡¶≤‡¶æ‡¶Ø‡¶º‡ßá‡¶®‡ßç‡¶ü ‡¶´‡ßã‡¶®:* ${book.clientPhone || 'Not Provided'}
üìÖ *‡¶§‡¶æ‡¶∞‡¶ø‡¶ñ:* ${book.date}
‚è∞ *‡¶∏‡¶Æ‡ßü:* ${book.time} (${book.duration})
üìç *‡¶†‡¶ø‡¶ï‡¶æ‡¶®‡¶æ/‡¶≤‡ßã‡¶ï‡ßá‡¶∂‡¶®:* ${book.location}
üó∫Ô∏è *‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶™‡¶∏ ‡¶≤‡¶ø‡¶ô‡ßç‡¶ï:* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(book.location)}
üìù *‡¶¨‡¶ø‡¶∂‡ßá‡¶∑ ‡¶®‡¶ø‡¶∞‡ßç‡¶¶‡ßá‡¶∂‡¶®‡¶æ:* ${book.notes || 'N/A'}
‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ‚îÅ
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
                                  <span>üìû Coordination Hub (‡¶ï‡ßç‡¶≤‡¶æ‡¶Ø‡¶º‡ßá‡¶®‡ßç‡¶ü ‡¶ì ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶Ø‡ßã‡¶ó‡¶æ‡¶Ø‡ßã‡¶ó)</span>
                                  <span className="text-[9px] text-blue-400 lowercase font-mono">Live Sync Matcher</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  {/* Client Details Column */}
                                  <div className="space-y-1.5">
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Client Details (‡¶ï‡ßç‡¶≤‡¶æ‡¶Ø‡¶º‡ßá‡¶®‡ßç‡¶ü ‡¶§‡¶•‡ßç‡¶Ø)</h6>
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
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-[#ceff00]">Model Full Details (‡¶Æ‡¶°‡ßá‡¶≤ ‡¶§‡¶•‡ßç‡¶Ø)</h6>
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
                                        ‚ö†Ô∏è ‡¶™‡ßç‡¶∞‡ßã‡¶´‡¶æ‡¶á‡¶≤ ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú‡ßá ‡¶™‡¶æ‡¶ì‡ßü‡¶æ ‡¶Ø‡¶æ‡ßü‡¶®‡¶ø! ‡¶∏‡¶Æ‡ßç‡¶≠‡¶¨‡¶§ ‡¶®‡¶æ‡¶Æ ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶π‡ßü‡ßá‡¶õ‡ßá‡•§
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
                                        Copied! (‡¶ï‡¶™‡¶ø ‡¶π‡ßü‡ßá‡¶õ‡ßá)
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        Copy Details (‡¶°‡¶ø‡¶ü‡ßá‡¶á‡¶≤‡¶∏ ‡¶ï‡¶™‡¶ø)
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
                                      WhatsApp (‡¶π‡ßã‡ßü‡¶æ‡¶ü‡¶∏‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™‡ßá ‡¶™‡¶æ‡¶†‡¶æ‡¶®)
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
                                      Telegram (‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ‡ßá ‡¶™‡¶æ‡¶†‡¶æ‡¶®)
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
                                  üí∏ DEFICIT PAYMENT RECEIVED / ‡¶ò‡¶æ‡¶ü‡¶§‡¶ø ‡¶™‡ßá‡¶Æ‡ßá‡¶®‡ßç‡¶ü
                                </span>
                                <span className="text-amber-400 font-extrabold text-[10.5px]">‡ß≥{book.deficitPay.amount}</span>
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
                                      OPEN FULL PROOF IMAGE ‚Üó
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {book.firstTimeBooking && (
                            <div className="bg-[#0c0d16] border border-blue-500/10 p-3 rounded-xl flex flex-col gap-2">
                              <span className="text-blue-400 text-[8.5px] font-black uppercase tracking-widest block font-mono">
                                üîí FIRST-TIME CLIENT VERIFICATION / ‡¶™‡ßç‡¶∞‡¶•‡¶Æ‡¶¨‡¶æ‡¶∞ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶®
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
                                <span className="text-emerald-400 font-bold font-sans">Processed Voucher Mail (‡¶Æ‡ßá‡¶á‡¶≤ ‡¶ï‡¶®‡¶´‡¶æ‡¶∞‡ßç‡¶Æ‡¶°)</span>
                              </div>

                              {book.status === 'Approved' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <button
                                    onClick={() => onMarkOutgoingBooking && onMarkOutgoingBooking(book.id)}
                                    className="flex-1 bg-blue-600/20 hover:bg-blue-650/80 border border-blue-500/30 hover:border-blue-500/55 text-blue-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    üöÄ Outgoing (‡¶Ü‡¶∏‡¶õ‡ßá)
                                  </button>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-650/80 border border-emerald-500/30 hover:border-emerald-500/55 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    üíñ Complete (‡¶∏‡¶Æ‡ßç‡¶™‡¶®‡ßç‡¶®)
                                  </button>
                                </div>
                              )}

                              {book.status === 'Outgoing' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <div className="flex-1 text-[9px] font-mono text-blue-405 flex items-center justify-center bg-blue-955/20 rounded-lg p-1 font-bold">
                                    Status: Outgoing for Call üõµ
                                  </div>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/30 hover:bg-emerald-650/80 border border-emerald-500/40 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    üíñ Complete (‡¶∏‡¶Æ‡ßç‡¶™‡¶®‡ßç‡¶®)
                                  </button>
                                </div>
                              )}

                              {book.status === 'Completed' && (
                                <div className="bg-emerald-950/20 border border-emerald-500/15 px-3 py-2 rounded-xl text-center text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1.5">
                                  <span>‚úÖ Service successfully closed & finalized. Feedback channel active.</span>
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
                  ‡¶°‡¶ø‡¶ú‡¶æ‡¶á‡¶®‡ßá‡¶° ‡¶¨‡¶ø‡¶≤‡¶æ‡¶∏‡¶¨‡¶π‡ßÅ‡¶≤ ‡¶∏‡ßá‡¶´ ‡¶π‡¶æ‡¶â‡¶∏ ‡¶è‡¶¨‡¶Ç ‡¶´‡¶æ‡¶á‡¶≠-‡¶∏‡ßç‡¶ü‡¶æ‡¶∞ ‡¶∏‡ßç‡¶Ø‡ßÅ‡¶á‡¶ü ‡¶§‡¶æ‡¶≤‡¶ø‡¶ï‡¶æ‡•§ ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶ú‡¶®‡ßç‡¶Ø ‡¶ï‡ßç‡¶≤‡¶æ‡ßü‡ßá‡¶®‡ßç‡¶ü‡¶¶‡ßá‡¶∞ ‡¶∞‡¶ø‡¶≤‡ßç‡¶Ø‡¶æ‡¶ï‡ßç‡¶∏ ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶™‡ßá ‡¶∏‡ßç‡¶Ø‡ßÅ‡¶á‡¶ü‡¶ó‡ßÅ‡¶≤‡ßã ‡¶™‡ßç‡¶∞‡¶¶‡¶∞‡ßç‡¶∂‡¶ø‡¶§ ‡¶π‡ßü‡•§
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Prestige stars rating / ‡¶∏‡ßç‡¶ü‡¶æ‡¶∞ ‡¶∞‡ßá‡¶ü‡¶ø‡¶Ç</label>
                      <select
                        value={locStar}
                        onChange={(e) => setLocStar(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs font-bold cursor-pointer"
                      >
                        <option value="5 STAR">üëë 5 STAR PRESTIGE ROYAL</option>
                        <option value="4 STAR">‚≠ê 4 STAR PREMIUM CLASS</option>
                        <option value="3 STAR">‚≠ê 3 STAR EXECUTIVE LUXURY</option>
                        <option value="2 STAR">‚≠ê 2 STAR COMFORT SANCTUARY</option>
                        <option value="1 STAR">‚≠ê 1 STAR STANDARD BUDGET</option>
                        <option value="BOUTIQUE">üè¢ PRIVATE BOUTIQUE SANCTUARY</option>
                        <option value="SAFE HOUSE">üîí HIGH-SECURITY SAFE HOUSE</option>
                        <option value="5 STAR SAFE HOUSE">üëë üîí 5 STAR SECURE SAFE HOUSE</option>
                      </select>
                    </div>

                    {/* City Location */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Metropolis District area / ‡¶è‡¶≤‡¶æ‡¶ï‡¶æ ‡¶¨‡¶æ ‡¶¨‡¶ø‡¶≠‡¶æ‡¶ó</label>
                      <select
                        value={locCity}
                        onChange={(e) => setLocCity(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-xs font-bold"
                      >
                        <option value="" className="bg-[#11131a] text-white font-sans font-bold">Select Area / ‡¶è‡¶≤‡¶æ‡¶ï‡¶æ ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®</option>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Sanctuary Charge / ‡¶≠‡¶æ‡ßú‡¶æ (‡ß≥) *</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#2271b1] uppercase">Sanctuary Description & Privacy Guidelines / ‡¶π‡ßã‡¶ü‡ßá‡¶≤‡ßá‡¶∞ ‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£ ‡¶ì ‡¶ó‡ßã‡¶™‡¶®‡ßÄ‡ßü‡¶§‡¶æ ‡¶®‡¶ø‡ßü‡¶Æ‡¶æ‡¶¨‡¶≤‡ßÄ *</label>
                      <textarea
                        rows={4}
                        required
                        value={locDesc}
                        onChange={(e) => setLocDesc(e.target.value)}
                        placeholder="‡¶π‡ßã‡¶ü‡ßá‡¶≤‡ßá‡¶∞ ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£, ‡¶∏‡ßÅ‡¶Ø‡ßã‡¶ó ‡¶∏‡ßÅ‡¶¨‡¶ø‡¶ß‡¶æ ‡¶è‡¶¨‡¶Ç ‡¶ó‡ßã‡¶™‡¶®‡ßÄ‡ßü‡¶§‡¶æ ‡¶∏‡¶Æ‡ßç‡¶™‡¶∞‡ßç‡¶ï‡¶ø‡¶§ ‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶®‡•§ ‡¶Ø‡ßá‡¶Æ‡¶®: Private elevator, 100% blind safety setups, elite room amenities..."
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono font-sans">Hotel Suite Photo * (‡¶õ‡¶¨‡¶ø ‡¶Ü‡¶™‡¶≤‡ßã‡¶° ‡¶ï‡¶∞‡ßÅ‡¶® ‡¶Ö‡¶•‡¶¨‡¶æ ‡¶≤‡¶ø‡¶Ç‡¶ï ‡¶¨‡¶∏‡¶æ‡¶®)</label>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={locImage}
                          onChange={(e) => setLocImage(e.target.value)}
                          placeholder="Paste image URL, or click upload on right..."
                          className="flex-1 bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 text-xs"
                        />
                        
                        <div className="relative shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            id="hotel-image-upload"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressImage(file, 1200, 800, 0.75).then((compressedUrl) => {
                                  if (compressedUrl) {
                                    setLocImage(compressedUrl);
                                  }
                                });
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="hotel-image-upload"
                            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 border border-blue-500/20 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center gap-1.5 h-full"
                          >
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            Upload Image / ‡¶õ‡¶¨‡¶ø ‡¶Ü‡¶™‡¶≤‡ßã‡¶°
                          </label>
                        </div>
                      </div>

                      {/* Preview if uploaded or selected */}
                      {locImage && (
                        <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-blue-500/10 w-fit mt-1">
                          <img src={locImage} alt="Preview" className="w-12 h-8 rounded-lg object-cover border border-slate-800" />
                          <div className="text-left">
                            <span className="block text-[9px] text-[#2ebdff] font-bold uppercase tracking-wider">Hotel Image Preview</span>
                            <span className="text-[8px] text-slate-500 block max-w-xs truncate">{locImage.startsWith('data:') ? 'Local Image Base64 Data' : locImage}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLocImage('')}
                            className="p-1 hover:bg-white/5 rounded text-rose-500 text-xs font-bold transition ml-2 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}

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
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">üö® Hotel Fine Specifications (‡¶ú‡¶∞‡ßÅ‡¶∞‡ßÄ ‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶§‡¶•‡ßç‡¶Ø)</span>
                    </div>

                    {/* Distance */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Distance string (‡¶¶‡ßÅ‡¶∞‡¶§‡ßç‡¶¨, e.g. 17.1 km from city center)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Street Address (‡¶™‡ßÇ‡¶∞‡ßç‡¶£ ‡¶†‡¶ø‡¶ï‡¶æ‡¶®‡¶æ)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-in Policy Time (‡¶ö‡ßá‡¶ï-‡¶á‡¶® ‡¶∏‡¶Æ‡ßü)</label>
                      <input
                        type="text"
                        value={locCheckInTime}
                        onChange={(e) => setLocCheckInTime(e.target.value)}
                        placeholder="e.g. 02:00 PM"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-out Policy Time (‡¶ö‡ßá‡¶ï-‡¶Ü‡¶â‡¶ü ‡¶∏‡¶Æ‡ßü)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Highlighted Facilities (‡¶ï‡¶Æ‡¶æ ‡¶¶‡¶ø‡ßü‡ßá ‡¶≤‡¶ø‡¶ñ‡ßÅ‡¶® - Comma separated)</label>
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">üõèÔ∏è Room Option 1 Details (‡¶∞‡ßÅ‡¶Æ ‡¶Ö‡¶™‡¶∂‡¶® ‡ßß ‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name (‡¶®‡¶æ‡¶Æ)</label>
                      <input
                        type="text"
                        value={locRoom1Name}
                        onChange={(e) => setLocRoom1Name(e.target.value)}
                        placeholder="e.g. Premium Deluxe Twin"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type (‡¶¨‡ßá‡¶° ‡¶ü‡¶æ‡¶á‡¶™)</label>
                      <input
                        type="text"
                        value={locRoom1BedType}
                        onChange={(e) => setLocRoom1BedType(e.target.value)}
                        placeholder="e.g. TWIN x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity (‡¶ß‡¶æ‡¶∞‡¶£‡¶ï‡ßç‡¶∑‡¶Æ‡¶§‡¶æ)</label>
                      <input
                        type="text"
                        value={locRoom1Capacity}
                        onChange={(e) => setLocRoom1Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type (‡¶≠‡¶ø‡¶ì ‡¶ü‡¶æ‡¶á‡¶™)</label>
                      <input
                        type="text"
                        value={locRoom1ViewType}
                        onChange={(e) => setLocRoom1ViewType(e.target.value)}
                        placeholder="e.g. no-view / City View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area (‡¶∞‡ßÅ‡¶Æ‡ßá‡¶∞ ‡¶∏‡¶æ‡¶á‡¶ú)</label>
                      <input
                        type="text"
                        value={locRoom1Area}
                        onChange={(e) => setLocRoom1Area(e.target.value)}
                        placeholder="e.g. 18 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room (‡¶≠‡¶æ‡ßú‡¶æ)</label>
                      <input
                        type="number"
                        value={locRoom1Price}
                        onChange={(e) => setLocRoom1Price(e.target.value)}
                        placeholder="e.g. 2311"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (‡¶∏‡ßÅ‡¶¨‡¶ø‡¶ß‡¶æ‡¶∏‡¶Æ‡ßÇ‡¶π, e.g. Breakfast Included, Non-Smoking room)</label>
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">üõèÔ∏è Room Option 2 Details (‡¶∞‡ßÅ‡¶Æ ‡¶Ö‡¶™‡¶∂‡¶® ‡ß® ‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶¨‡¶ø‡¶¨‡¶∞‡¶£)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name (‡¶®‡¶æ‡¶Æ)</label>
                      <input
                        type="text"
                        value={locRoom2Name}
                        onChange={(e) => setLocRoom2Name(e.target.value)}
                        placeholder="e.g. Executive Suite"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type (‡¶¨‡ßá‡¶° ‡¶ü‡¶æ‡¶á‡¶™)</label>
                      <input
                        type="text"
                        value={locRoom2BedType}
                        onChange={(e) => setLocRoom2BedType(e.target.value)}
                        placeholder="e.g. KING x 1"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity (‡¶ß‡¶æ‡¶∞‡¶£‡¶ï‡ßç‡¶∑‡¶Æ‡¶§‡¶æ)</label>
                      <input
                        type="text"
                        value={locRoom2Capacity}
                        onChange={(e) => setLocRoom2Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type (‡¶≠‡¶ø‡¶ì ‡¶ü‡¶æ‡¶á‡¶™)</label>
                      <input
                        type="text"
                        value={locRoom2ViewType}
                        onChange={(e) => setLocRoom2ViewType(e.target.value)}
                        placeholder="e.g. no-view / Skyline View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area (‡¶∞‡ßÅ‡¶Æ‡ßá‡¶∞ ‡¶∏‡¶æ‡¶á‡¶ú)</label>
                      <input
                        type="text"
                        value={locRoom2Area}
                        onChange={(e) => setLocRoom2Area(e.target.value)}
                        placeholder="e.g. 25 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room (‡¶≠‡¶æ‡ßú‡¶æ)</label>
                      <input
                        type="number"
                        value={locRoom2Price}
                        onChange={(e) => setLocRoom2Price(e.target.value)}
                        placeholder="e.g. 4500"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                       <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (‡¶∏‡ßÅ‡¶¨‡¶ø‡¶ß‡¶æ‡¶∏‡¶Æ‡ßÇ‡¶π, e.g. Breakfast Included, Non-Smoking room)</label>
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

              {/* Category Switcher Toggles (ALL | HOTELS | SAFE HOUSES) */}
              <div className="flex bg-[#0a0c13] border border-slate-800 p-1 rounded-2xl w-fit shadow-inner">
                {(['ALL', 'HOTELS', 'SAFE HOUSES'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setAdminLocationTab(tab)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      adminLocationTab === tab
                        ? 'bg-[#181d2a] text-blue-400 border border-blue-500/10 shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'ALL' && <Hotel className="w-3 h-3 text-slate-400" />}
                    {tab === 'HOTELS' && <Hotel className="w-3 h-3 text-amber-500" />}
                    {tab === 'SAFE HOUSES' && <ShieldCheck className="w-3 h-3 text-blue-400" />}
                    <span>{tab === 'SAFE HOUSES' ? 'SAFE HOUSES (‡¶∏‡ßá‡¶´ ‡¶π‡¶æ‡¶â‡¶∏)' : tab === 'HOTELS' ? 'HOTELS (‡¶π‡ßã‡¶ü‡ßá‡¶≤)' : 'ALL (‡¶∏‡¶¨)'}</span>
                  </button>
                ))}
              </div>

              {/* List of active locations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {locations
                  .filter((loc) => {
                    if (adminLocationTab === 'ALL') return true;
                    const isSafeHouse = loc.star && typeof loc.star === 'string' && loc.star.toUpperCase().includes('SAFE HOUSE');
                    if (adminLocationTab === 'SAFE HOUSES') return isSafeHouse;
                    if (adminLocationTab === 'HOTELS') return !isSafeHouse;
                    return true;
                  })
                  .map((loc) => (
                  <div
                    key={loc.id}
                    className="bg-[#11131a] border border-[#1d232a] hover:border-blue-500/20 rounded-2xl p-4 flex gap-3 relative justify-between transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-800">
                        <img src={loc.image || PRESET_HOTEL_IMAGES[0]} alt={loc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                      Brand Logo Uploader & Controller (‡¶¨‡ßç‡¶∞‡ßç‡¶Ø‡¶æ‡¶®‡ßç‡¶° ‡¶≤‡ßã‡¶ó‡ßã ‡¶Ü‡¶™‡¶≤‡ßã‡¶°‡¶æ‡¶∞)
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
                      Interactive Crop Circle (‡¶≤‡ßã‡¶ó‡ßã ‡¶™‡¶ú‡¶ø‡¶∂‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®)
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
                          üñ±Ô∏è Hold & Drag on the image to position! <br />
                          (‡¶õ‡¶¨‡¶ø‡¶ü‡¶ø‡¶∞ ‡¶ì‡¶™‡¶∞ ‡¶Æ‡¶æ‡¶â‡¶∏ ‡¶¨‡¶æ ‡¶Ü‡¶ô‡ßÅ‡¶≤ ‡¶¶‡¶ø‡ßü‡ßá ‡¶°‡ßç‡¶∞‡ßç‡¶Ø‡¶æ‡¶ó ‡¶ï‡¶∞‡ßá ‡¶¨‡¶∏‡¶æ‡¶®)
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
                        Upload Logo Image File (‡¶≤‡ßã‡¶ó‡ßã ‡¶õ‡¶¨‡¶ø ‡¶´‡¶æ‡¶á‡¶≤ ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®)
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
                          <span>Precise adjustment sliders (‡¶∏‡ßÇ‡¶ï‡ßç‡¶∑‡ßç‡¶Æ‡¶≠‡¶æ‡¶¨‡ßá ‡¶∏‡¶æ‡¶á‡¶ú ‡¶Æ‡ßá‡¶≤‡¶æ‡¶®‡ßã‡¶∞ ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">üîç Image Scale / Zoom (‡¶õ‡¶¨‡¶ø ‡¶¨‡ßú/‡¶õ‡ßã‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">‚ÜîÔ∏è Horizontal Shift (‡¶°‡¶æ‡¶®‡ßá-‡¶¨‡¶æ‡¶Æ‡ßá ‡¶∏‡¶∞‡¶æ‡¶®)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">‚ÜïÔ∏è Vertical Shift (‡¶â‡¶™‡¶∞‡ßá-‡¶®‡¶ø‡¶ö‡ßá ‡¶∏‡¶∞‡¶æ‡¶®)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">üîÑ Rotate Image (‡¶ò‡ßã‡¶∞‡¶æ‡¶®)</span>
                            <span className="text-[9px] font-mono font-bold text-amber-400">{logoRotate}¬∞</span>
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
                              Crop & Lock Logo (‡¶≤‡ßã‡¶ó‡ßã ‡¶∏‡¶æ‡¶á‡¶ú ‡¶†‡¶ø‡¶ï ‡¶ï‡¶∞‡ßá ‡¶ï‡¶æ‡¶ü‡ßÅ‡¶®)
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                          Or Paste Logo Image URL (‡¶Ö‡¶•‡¶¨‡¶æ ‡¶°‡¶ø‡¶∞‡ßá‡¶ï‡ßç‡¶ü ‡¶á‡¶Æ‡ßá‡¶ú ‡¶≤‡¶ø‡¶Ç‡¶ï ‡¶¶‡¶ø‡¶®)
                        </label>
                        {tempLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§ ‡¶≤‡ßã‡¶ó‡ßã‡¶ü‡¶ø ‡¶∞‡¶ø‡¶Æ‡ßÅ‡¶≠ ‡¶ï‡¶∞‡ßá ‡¶°‡¶ø‡¶´‡¶≤‡ßç‡¶ü ‡¶°‡¶ø‡¶ú‡¶æ‡¶á‡¶®‡ßá ‡¶´‡¶ø‡¶∞‡ßá ‡¶Ø‡ßá‡¶§‡ßá ‡¶ö‡¶æ‡¶®?")) {
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
                        Apply & Save Logo (‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡ßÅ‡¶®)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶ø ‡¶®‡¶ø‡¶∂‡ßç‡¶ö‡¶ø‡¶§ ‡¶Ø‡ßá ‡¶Ü‡¶™‡¶®‡¶ø ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶≤‡ßã‡¶ó‡ßã ‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶¶‡¶ø‡ßü‡ßá ‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡¶®‡¶ø‡¶∞‡ßç‡¶ß‡¶æ‡¶∞‡¶ø‡¶§ ‡¶°‡¶ø‡¶´‡¶≤‡ßç‡¶ü ‡¶≠‡ßá‡¶ï‡ßç‡¶ü‡¶∞ ‡¶≤‡ßã‡¶ó‡ßã‡¶§‡ßá ‡¶´‡¶ø‡¶∞‡ßá ‡¶Ø‡ßá‡¶§‡ßá ‡¶ö‡¶æ‡¶®?")) {
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
                        Reset to Default (‡¶°‡¶ø‡¶´‡¶≤‡ßç‡¶ü ‡¶≤‡ßã‡¶ó‡ßã)
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
                    Telegram Notification Engine & Helpline (‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ ‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶ì ‡¶π‡ßá‡¶≤‡ßç‡¶™‡¶≤‡¶æ‡¶á‡¶®)
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Configure your primary Telegram Bot credentials, Admin Group Chat ID, and the support Helpline handle below. In case of lost/damaged accounts, you can instantly add/save or remove credentials to keep system notification channels secure and completely organized. (OTP Verification is completely handled by the Email SMS Gateway).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      Telegram Bot Token (‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ ‡¶¨‡¶ü ‡¶ü‡ßã‡¶ï‡ßá‡¶®)
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
                      Telegram Group Chat ID (‡¶ó‡ßç‡¶∞‡ßÅ‡¶™ ‡¶ö‡ßç‡¶Ø‡¶æ‡¶ü ‡¶Ü‡¶á‡¶°‡¶ø)
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
                      Support Helpline Username (‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ ‡¶π‡ßá‡¶≤‡ßç‡¶™‡¶≤‡¶æ‡¶á‡¶®)
                    </label>
                    <input
                      type="text"
                      value={telegramHelpline}
                      onChange={(e) => onSetTelegramHelpline?.(e.target.value)}
                      placeholder="e.g. BodyTouchSupport (no @)"
                      className="w-full bg-black/40 border border-[#232733] focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-400 focus:outline-none text-amber-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <Send className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                      Telegram Channel Username (‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ ‡¶ö‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶≤ ‡¶á‡¶â‡¶ú‡¶æ‡¶∞‡¶®‡ßá‡¶Æ)
                    </label>
                    <input
                      type="text"
                      value={telegramChannel}
                      onChange={(e) => onSetTelegramChannel?.(e.target.value)}
                      placeholder="e.g. BodyTouchVIP (no @)"
                      className="w-full bg-black/40 border border-[#232733] focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-400 focus:outline-none text-blue-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      WhatsApp Support Phone / Link (‡¶π‡ßã‡¶Ø‡¶º‡¶æ‡¶ü‡¶∏‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™ ‡¶®‡¶æ‡¶Æ‡ßç‡¶¨‡¶æ‡¶∞/‡¶≤‡¶ø‡¶Ç‡¶ï)
                    </label>
                    <input
                      type="text"
                      value={whatsappSupport}
                      onChange={(e) => onSetWhatsappSupport?.(e.target.value)}
                      placeholder="e.g. +8801700000000"
                      className="w-full bg-black/40 border border-[#232733] focus:border-indigo-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-400 focus:outline-none text-emerald-400"
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
                        alert("‚úÖ Telegram Credentials & Support Helpline configurations have been securely added and updated in system databases!");
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
                        if (onSetTelegramChannel) onSetTelegramChannel('');
                        if (onSetWhatsappSupport) onSetWhatsappSupport('');
                        alert("‚ö†Ô∏è Disconnected: All Telegram Bot tokens, Chat IDs, and active helpline links have been completely removed and deleted from system memory!");
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
                    ‚ö†Ô∏è <b>‡¶¨‡¶ü ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏ ‡¶®‡¶ø‡¶∞‡ßç‡¶¶‡ßá‡¶∂‡¶æ‡¶¨‡¶≤‡¶ø:</b>
                  </p>
                  <p>
                    ‡ßß. ‡¶™‡ßç‡¶∞‡¶•‡¶Æ‡ßá <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">@BotFather</a> ‡¶è‡¶∞ ‡¶Æ‡¶æ‡¶ß‡ßç‡¶Ø‡¶Æ‡ßá ‡¶è‡¶ï‡¶ü‡¶ø ‡¶®‡¶§‡ßÅ‡¶® ‡¶ü‡ßá‡¶≤‡¶ø‡¶ó‡ßç‡¶∞‡¶æ‡¶Æ ‡¶¨‡¶ü ‡¶§‡ßà‡¶∞‡¶ø ‡¶ï‡¶∞‡ßá ‡¶ü‡ßã‡¶ï‡ßá‡¶®‡¶ü‡¶ø ‡¶è‡¶ñ‡¶æ‡¶®‡ßá ‡¶¨‡¶∏‡¶æ‡¶®‡•§
                  </p>
                  <p>
                    ‡ß®. ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶°‡¶Æ‡¶ø‡¶® ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™ ‡¶ö‡ßç‡¶Ø‡¶æ‡¶ü‡ßá ‡¶§‡ßà‡¶∞‡¶ø ‡¶ï‡¶∞‡¶æ ‡¶¨‡¶ü‡¶ü‡¶ø‡¶ï‡ßá ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶® ‡¶è‡¶¨‡¶Ç ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™ ‡¶ö‡ßç‡¶Ø‡¶æ‡¶ü ‡¶Ü‡¶á‡¶°‡¶ø (Chat ID) ‡¶â‡¶™‡¶∞‡ßã‡¶ï‡ßç‡¶§ ‡¶¨‡¶ï‡ßç‡¶∏‡ßá ‡¶™‡ßç‡¶∞‡¶¶‡¶æ‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                  </p>
                  <p>
                    ‡ß©. ‡¶ï‡ßã‡¶®‡ßã ‡¶Æ‡¶°‡ßá‡¶≤ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶∞‡¶ø‡¶ï‡ßã‡ßü‡ßá‡¶∏‡ßç‡¶ü ‡¶¶‡¶ø‡¶≤‡ßá ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶∞ ‡¶°‡¶ø‡¶ü‡ßá‡¶á‡¶≤‡¶∏ ‡¶∏‡¶π ‡¶®‡ßã‡¶ü‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶∏‡ßç‡¶¨‡ßü‡¶Ç‡¶ï‡ßç‡¶∞‡¶ø‡ßü‡¶≠‡¶æ‡¶¨‡ßá ‡¶â‡¶ï‡ßç‡¶§ ‡¶è‡¶°‡¶Æ‡¶ø‡¶® ‡¶ó‡ßç‡¶∞‡ßÅ‡¶™‡ßá ‡¶ö‡¶≤‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá‡•§
                  </p>
                </div>
              </div>

              {/* Live Chat Socket.io Server Settings Card */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-amber-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 animate-pulse" />
                    Live Chat Socket.io Server Settings (‡¶≤‡¶æ‡¶á‡¶≠ ‡¶ö‡ßç‡¶Ø‡¶æ‡¶ü ‡¶∏‡¶ï‡ßá‡¶ü ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶æ‡¶∞ ‡¶∏‡ßá‡¶ü‡¶ø‡¶Ç‡¶∏)
                  </h4>
                  {socketUrlSaveSuccess && (
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
                <p className="text-slate-400 text-xs leading-relaxed text-left">
                  Configure your custom Socket.io server connection URL below to keep your Live Chat connection <strong className="text-amber-400">always active and connected</strong>. If running on a non-standard port or customized subdomain (e.g., <code>https://yourdomain.com:3000</code>), update it below. Leave blank to automatically fallback to the web app's origin domain (default).
                </p>

                <div className="space-y-1.5 text-left">
                  <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                    Socket Server Custom URL (‡¶∏‡¶ï‡ßá‡¶ü ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶á‡¶â‡¶Ü‡¶∞‡¶è‡¶≤)
                  </label>
                  <input
                    type="text"
                    value={socketServerUrl}
                    onChange={(e) => setSocketServerUrl(e.target.value)}
                    placeholder="e.g. https://bodytouchbd.com:3000 (‡¶Ö‡¶•‡¶¨‡¶æ ‡¶ñ‡¶æ‡¶≤‡¶ø ‡¶∞‡¶æ‡¶ñ‡ßÅ‡¶®)"
                    className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isSavingSocketUrl}
                    onClick={handleSaveSocketSettings}
                    className="bg-amber-600 hover:bg-amber-550 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-600/10 active:scale-98 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                    {isSavingSocketUrl ? "Saving..." : "Save Custom Socket Server"}
                  </button>

                  <button
                    type="button"
                    disabled={isSavingSocketUrl}
                    onClick={handleClearSocketSettings}
                    className="bg-[#11131a] border border-slate-800 hover:bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    Reset to Default / Clear
                  </button>
                </div>
              </div>

              {/* SMTP Email SMS Gateway Settings */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-teal-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-teal-400 flex items-center gap-2">
                    <Mail className="w-4 h-4 animate-pulse" />
                    SMTP / Email SMS Gateway Settings (‡¶è‡¶∏‡¶è‡¶Æ‡¶è‡¶∏ ‡¶ì ‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶ó‡ßá‡¶ü‡¶ì‡¶Ø‡¶º‡ßá)
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
                  Configure your primary SMTP Server credentials to send secure verification OTP emails (SMS equivalents) to users during login and registration. Verification is locked to <strong className="text-teal-400">MUST (‡¶¨‡¶æ‡¶ß‡ßç‡¶Ø‡¶§‡¶æ‡¶Æ‡ßÇ‡¶≤‡¶ï)</strong> for absolute portal security.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      SMTP Host (‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶π‡ßã‡¶∏‡ßç‡¶ü)
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
                      SMTP Port (‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶™‡ßã‡¶∞‡ßç‡¶ü)
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
                      Sender Name (‡¶™‡ßç‡¶∞‡ßá‡¶∞‡¶ï‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ)
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
                      SMTP User Email (‡¶á‡¶â‡¶ú‡¶æ‡¶∞ ‡¶á‡¶Æ‡ßá‡¶á‡¶≤)
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
                      SMTP App Password (‡¶∏‡¶ø‡¶ï‡¶ø‡¶â‡¶∞ ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°)
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
                      ‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶®‡ßá‡¶∞ (OTP) ‡¶ú‡¶®‡ßç‡¶Ø ‡¶Ü‡¶≤‡¶æ‡¶¶‡¶æ ‡¶ú‡¶ø‡¶Æ‡ßá‡¶á‡¶≤ ‡¶¨‡ßç‡¶Ø‡¶¨‡¶π‡¶æ‡¶∞ ‡¶ï‡¶∞‡ßÅ‡¶® (Use Separate Gmail for OTP codes)
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
                          Verification OTP Specific Gateway (‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶ì‡¶ü‡¶ø‡¶™‡¶ø ‡¶™‡¶æ‡¶†‡¶æ‡¶®‡ßã‡¶∞ ‡¶ó‡ßá‡¶ü‡¶ì‡¶Ø‡¶º‡ßá)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                            OTP SMTP Host (‡¶π‡ßã‡¶∏‡ßç‡¶ü)
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
                            OTP SMTP Port (‡¶™‡ßã‡¶∞‡ßç‡¶ü)
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
                            OTP Sender Name (‡¶™‡ßç‡¶∞‡ßá‡¶∞‡¶ï‡ßá‡¶∞ ‡¶®‡¶æ‡¶Æ)
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
                            OTP SMTP User Email (‡¶≠‡ßá‡¶∞‡¶ø‡¶´‡¶ø‡¶ï‡ßá‡¶∂‡¶® ‡¶ú‡¶ø‡¶Æ‡ßá‡¶á‡¶≤)
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
                            OTP App Password (‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™ ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶°)
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
                    <span>Login & Registration Email Verifications: <b>ENFORCED / MUST (‡¶¨‡¶æ‡¶ß‡ßç‡¶Ø‡¶§‡¶æ‡¶Æ‡ßÇ‡¶≤‡¶ï ‡¶∏‡¶ï‡ßç‡¶∞‡¶ø‡ßü)</b></span>
                  </div>
                </div>

                {smtpSaveError && (
                  <div className="text-xs text-rose-450 font-semibold bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
                    ‚ö†Ô∏è {smtpSaveError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSmtpSettings}
                    className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                  >
                    <Save className="w-4 h-4 text-white" />
                    Save SMTP Configuration (‡¶ó‡ßá‡¶ü‡¶ì‡ßü‡ßá ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡ßÅ‡¶®)
                  </button>
                </div>

                <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                  <p>
                    ‚ö†Ô∏è <b>‡¶ú‡¶ø‡¶Æ‡ßá‡¶á‡¶≤ (Gmail) ‡¶è‡¶∏‡¶è‡¶Æ‡¶è‡¶∏ ‡¶ì‡¶ü‡¶ø‡¶™‡¶ø ‡¶ó‡ßá‡¶ü‡¶ì‡¶Ø‡¶º‡ßá ‡¶®‡¶ø‡¶∞‡ßç‡¶¶‡ßá‡¶∂‡¶æ‡¶¨‡¶≤‡ßÄ:</b>
                  </p>
                  <p>
                    ‡ßß. ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ú‡¶ø‡¶Æ‡ßá‡¶á‡¶≤ ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶ï‡¶æ‡¶â‡¶®‡ßç‡¶ü‡ßá ‡¶™‡ßç‡¶∞‡¶¨‡ßá‡¶∂ ‡¶ï‡¶∞‡ßá <b>2-Step Verification</b> ‡¶ö‡¶æ‡¶≤‡ßÅ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                  </p>
                  <p>
                    ‡ß®. 2-Step Verification ‡¶™‡ßá‡¶ú‡ßá‡¶∞ ‡¶®‡¶ø‡¶ö‡ßá‡¶∞ ‡¶Ö‡¶Ç‡¶∂‡ßá <b>App Passwords</b> ‡¶è ‡¶ó‡¶ø‡ßü‡ßá ‡¶è‡¶ï‡¶ü‡¶ø ‡¶®‡¶§‡ßÅ‡¶® ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶™ ‡¶™‡¶æ‡¶∏‡¶ì‡ßü‡¶æ‡¶∞‡ßç‡¶° ‡¶ú‡ßá‡¶®‡¶æ‡¶∞‡ßá‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                  </p>
                  <p>
                    ‡ß©. ‡¶∏‡ßá‡¶ñ‡¶æ‡¶® ‡¶•‡ßá‡¶ï‡ßá ‡¶™‡ßç‡¶∞‡¶æ‡¶™‡ßç‡¶§ ‡ßß‡ß¨ ‡¶Ö‡¶ï‡ßç‡¶∑‡¶∞‡ßá‡¶∞ ‡¶∏‡¶ø‡¶ï‡¶ø‡¶â‡¶∞ ‡¶ï‡ßã‡¶°‡¶ü‡¶ø ‡¶â‡¶™‡¶∞‡ßá <b>SMTP App Password</b> ‡¶è‡¶∞ ‡¶ò‡¶∞‡ßá ‡¶¨‡¶∏‡¶ø‡ßü‡ßá ‡¶¶‡¶ø‡ßü‡ßá ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
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
                        Google Sheets Integration (‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶∂‡ßÄ‡¶ü ‡¶á‡¶®‡ßç‡¶ü‡¶ø‡¶ó‡ßç‡¶∞‡ßá‡¶∂‡¶®)
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
                      Google Sheets Web Publish Link / Embed URL (‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶∂‡ßÄ‡¶ü ‡¶™‡¶æ‡¶¨‡¶≤‡¶ø‡¶∂ ‡¶≤‡¶ø‡¶ô‡ßç‡¶ï)
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
                          alert("‚úÖ Google Sheets synchronization URL successfully updated and saved in system database!");
                        } else {
                          alert("‚ö†Ô∏è Google Sheets save handler is not available.");
                        }
                      }}
                      className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                    >
                      <Save className="w-4 h-4 text-white" />
                      Save Google Sheet Link (‡¶∂‡ßÄ‡¶ü ‡¶≤‡¶ø‡¶ô‡ßç‡¶ï ‡¶∏‡ßá‡¶≠ ‡¶ï‡¶∞‡ßÅ‡¶®)
                    </button>
                  </div>

                  <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                    <p>
                      üìä <b>‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶∂‡ßÄ‡¶ü ‡¶∏‡ßá‡¶ü‡¶Ü‡¶™ ‡¶®‡¶ø‡¶∞‡ßç‡¶¶‡ßá‡¶∂‡¶æ‡¶¨‡¶≤‡ßÄ:</b>
                    </p>
                    <p>
                      ‡ßß. ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ó‡ßÅ‡¶ó‡¶≤ ‡¶∏‡ßç‡¶™‡ßç‡¶∞‡ßá‡¶°‡¶∂‡ßÄ‡¶ü‡ßá (Google Sheet) ‡¶ó‡¶ø‡ßü‡ßá ‡¶°‡¶æ‡¶®‡¶™‡¶æ‡¶∂‡ßá‡¶∞ ‡¶ï‡ßã‡¶£‡¶æ‡ßü <b>Share</b> ‡¶è ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                    </p>
                    <p>
                      ‡ß®. <b>File &gt; Share &gt; Publish to web</b> ‡¶è ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡ßá ‡¶™‡ßÅ‡¶∞‡ßã ‡¶°‡¶ï‡ßÅ‡¶Æ‡ßá‡¶®‡ßç‡¶ü‡¶ü‡¶ø "Web Page" ‡¶π‡¶ø‡¶∏‡ßá‡¶¨‡ßá ‡¶™‡¶æ‡¶¨‡¶≤‡¶ø‡¶∂ (Publish) ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                    </p>
                    <p>
                      ‡ß©. ‡¶™‡¶æ‡¶¨‡¶≤‡¶ø‡¶∂ ‡¶ï‡¶∞‡¶æ‡¶∞ ‡¶™‡¶∞ ‡¶Ø‡ßá ‡¶≤‡¶ø‡¶ô‡ßç‡¶ï‡¶ü‡¶ø ‡¶™‡¶æ‡¶¨‡ßá‡¶®, ‡¶∏‡ßá‡¶ü‡¶ø ‡¶ï‡¶™‡¶ø ‡¶ï‡¶∞‡ßá ‡¶â‡¶™‡¶∞‡ßá‡¶∞ ‡¶ò‡¶∞‡ßá ‡¶¨‡¶∏‡¶ø‡ßü‡ßá <b>Save Google Sheet Link</b> ‡¶¨‡¶æ‡¶ü‡¶®‡ßá ‡¶ï‡ßç‡¶≤‡¶ø‡¶ï ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
                    </p>
                  </div>
                </div>
              </div>


              {/* SMTP Email Queue Logs Panel */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-blue-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-2 font-mono">
                    <Mail className="w-4 h-4 text-blue-500" />
                    SMTP Live Email Queue Logs (‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ ‡¶á‡¶Æ‡ßá‡¶á‡¶≤ ‡¶≤‡¶ó)
                  </h4>
                  {emailLogs.length > 0 && (
                    <button
                      onClick={onClearEmailLogs}
                      className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-550/20 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      Clear Logs (‡¶Æ‡ßÅ‡¶õ‡ßá ‡¶´‡ßá‡¶≤‡ßÅ‡¶®)
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
                                {log.status === 'Delivered' ? 'üü¢ DELIVERED' : log.status === 'Pending' ? '‚è≥ PENDING' : 'üî¥ FAILED'}
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
                    Emergency Notice & Slider Text Control (‡¶ú‡¶∞‡ßÅ‡¶∞‡ßÄ ‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶ì ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞ ‡¶≤‡ßá‡¶ñ‡¶æ ‡¶®‡¶ø‡¶Ø‡¶º‡¶®‡ßç‡¶§‡ßç‡¶∞‡¶£)
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  ‡¶π‡ßã‡¶Æ‡¶™‡ßá‡¶ú‡ßá‡¶∞ ‡¶∏‡ßç‡¶ï‡ßç‡¶∞‡¶≤‡¶ø‡¶Ç ‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶¨‡¶æ‡¶∞ ‡¶è‡¶¨‡¶Ç ‡¶õ‡¶¨‡¶ø ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞‡ßá‡¶∞ ‡¶ú‡¶∞‡ßÅ‡¶∞‡¶ø ‡¶®‡ßã‡¶ü‡¶ø‡¶∂‡ßá‡¶∞ ‡¶≤‡ßá‡¶ñ‡¶æ‡¶ü‡¶ø ‡¶è‡¶ñ‡¶æ‡¶® ‡¶•‡ßá‡¶ï‡ßá ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡¶§‡ßá ‡¶™‡¶æ‡¶∞‡ßá‡¶®‡•§ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ‡¶æ‡¶∞‡¶¶‡ßá‡¶∞ ‡¶∏‡ßç‡¶ï‡ßç‡¶∞‡¶ø‡¶®‡ßá ‡¶è‡¶ü‡¶ø ‡¶∞‡¶ø‡¶Ø‡¶º‡ßá‡¶≤-‡¶ü‡¶æ‡¶á‡¶Æ‡ßá ‡¶Ü‡¶™‡¶°‡ßá‡¶ü ‡¶π‡¶Ø‡¶º‡ßá ‡¶Ø‡¶æ‡¶¨‡ßá‡•§
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                    üö® Notice Text Content (‡¶ú‡¶∞‡ßÅ‡¶∞‡ßÄ ‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶è‡¶∞ ‡¶≤‡ßá‡¶ñ‡¶æ)
                  </label>
                  <textarea
                    rows={2}
                    value={editableNotice}
                    onChange={(e) => setEditableNotice(e.target.value)}
                    placeholder="‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏‡ßá‡¶∞ ‡¶®‡ßç‡¶Ø‡ßÇ‡¶®‡¶§‡¶Æ ‡ßß ‡¶ò‡¶£‡ßç‡¶ü‡¶æ ‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡ßá ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶¶‡¶ø‡¶¨‡ßá‡¶®‡•§ ‡¶∏‡¶æ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡ßá ‡¶ï‡¶•‡¶æ ‡¶®‡¶æ ‡¶¨‡¶≤‡ßá ‡¶ï‡ßç‡¶Ø‡¶æ‡¶Æ ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶¶‡¶ø‡¶¨‡ßá‡¶® ‡¶®‡¶æ"
                    className="w-full bg-black/40 border border-[#232733] focus:border-rose-500 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none placeholder-slate-700 leading-relaxed"
                  />
                </div>

                <div className="bg-[#18080c] border border-rose-550/15 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 font-mono block mb-1">LIVE PREVIEW ON CLIENT INTERFACE:</span>
                  <div className="text-[11.5px] font-bold text-rose-250 leading-relaxed font-sans select-none">
                    üì¢ {editableNotice || '‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏‡ßá‡¶∞ ‡¶®‡ßç‡¶Ø‡ßÇ‡¶®‡¶§‡¶Æ ‡ßß ‡¶ò‡¶£‡ßç‡¶ü‡¶æ ‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡ßá ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶¶‡¶ø‡¶¨‡ßá‡¶®‡•§ ‡¶∏‡¶æ‡¶™‡ßã‡¶∞‡ßç‡¶ü‡ßá ‡¶ï‡¶•‡¶æ ‡¶®‡¶æ ‡¶¨‡¶≤‡ßá ‡¶ï‡ßç‡¶Ø‡¶æ‡¶Æ ‡¶∏‡¶æ‡¶∞‡ßç‡¶≠‡¶ø‡¶∏ ‡¶¨‡ßÅ‡¶ï‡¶ø‡¶Ç ‡¶¶‡¶ø‡¶¨‡ßá‡¶® ‡¶®‡¶æ'}
                  </div>
                </div>

              </div>

              {/* HIGH-FIDELITY DYNAMIC HERO CAROUSEL GRAPHIC MANAGER */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-amber-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    Manage Hero Slides & Graphics (‡¶π‡¶ø‡¶∞‡ßã ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞ ‡¶ì ‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞ ‡¶Æ‡ßç‡¶Ø‡¶æ‡¶®‡ßá‡¶ú‡¶æ‡¶∞)
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 py-1 px-2.5 rounded-lg font-black font-mono">
                    ACTIVE: {sliderSlides.length || 3} SLIDES
                  </span>
                </div>
                
                <p className="text-slate-400 text-xs leading-relaxed">
                  ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶π‡ßã‡¶Æ‡¶™‡ßá‡¶ú‡ßá‡¶∞ ‡¶ó‡ßã‡¶≤‡ßç‡¶°‡ßá‡¶® ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶®‡¶ø‡¶Æ‡ßá‡¶ü‡ßá‡¶° ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞‡ßá‡¶∞ (Golden Border Slider) ‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞, ‡¶õ‡¶¨‡¶ø, ‡¶¨‡ßú ‡¶ü‡¶æ‡¶á‡¶ü‡ßá‡¶≤ ‡¶è‡¶¨‡¶Ç ‡¶∏‡¶¨-‡¶ü‡¶æ‡¶á‡¶ü‡ßá‡¶≤ ‡¶è‡¶ñ‡¶æ‡¶® ‡¶•‡ßá‡¶ï‡ßá ‡¶™‡¶∞‡¶ø‡¶¨‡¶∞‡ßç‡¶§‡¶® ‡¶ï‡¶∞‡ßÅ‡¶®‡•§ ‡¶ï‡ßã‡¶®‡ßã ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶Ö‡ßç‡¶Ø‡¶æ‡¶° ‡¶®‡¶æ ‡¶•‡¶æ‡¶ï‡¶≤‡ßá ‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡¶®‡¶ø‡¶∞‡ßç‡¶ß‡¶æ‡¶∞‡¶ø‡¶§ ‡ß©‡¶ü‡¶ø ‡¶™‡ßç‡¶∞‡¶ø‡¶Æ‡¶ø‡ßü‡¶æ‡¶Æ ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶∏‡ßç‡¶¨‡ßü‡¶Ç‡¶ï‡ßç‡¶∞‡¶ø‡ßü‡¶≠‡¶æ‡¶¨‡ßá ‡¶¶‡ßá‡¶ñ‡¶æ‡¶¨‡ßá‡•§
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
                    üìã Active Banner Slides in Carousel ({sliderSlides.length === 0 ? "Default/‡¶™‡ßÇ‡¶∞‡ßç‡¶¨‡¶®‡¶ø‡¶∞‡ßç‡¶ß‡¶æ‡¶∞‡¶ø‡¶§" : "Customized/‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ"})
                  </span>

                  {sliderSlides.length === 0 ? (
                    <div className="p-4 bg-black/40 border border-[#232733] border-dashed rounded-xl text-center text-slate-500 text-xs">
                      ‡¶¨‡¶∞‡ßç‡¶§‡¶Æ‡¶æ‡¶®‡ßá ‡¶ï‡ßã‡¶®‡ßã ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶§‡ßà‡¶∞‡¶ø ‡¶ï‡¶∞‡¶æ ‡¶®‡ßá‡¶á‡•§ ‡¶∏‡¶ø‡¶∏‡ßç‡¶ü‡ßá‡¶Æ‡ßá‡¶∞ ‡¶°‡¶ø‡¶´‡¶≤‡ßç‡¶ü ‡ß©‡¶ü‡¶ø ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞ ‡¶á‡¶Æ‡ßá‡¶ú ‡¶ì ‡¶ú‡¶∞‡ßÅ‡¶∞‡¶ø ‡¶®‡ßã‡¶ü‡¶ø‡¶∂ ‡¶¶‡ßá‡¶ñ‡¶æ‡¶ö‡ßç‡¶õ‡ßá‡•§ ‡¶®‡¶ø‡¶ö‡ßá‡¶∞ ‡¶´‡¶∞‡ßç‡¶Æ ‡¶•‡ßá‡¶ï‡ßá ‡¶Ü‡¶™‡¶®‡¶æ‡¶∞ ‡¶ï‡¶æ‡¶∏‡ßç‡¶ü‡¶Æ ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡¶æ‡¶∞ ‡¶Ø‡ßÅ‡¶ï‡ßç‡¶§ ‡¶ï‡¶∞‡ßÅ‡¶®‡•§
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
                    {isEditingSlide ? "‚öôÔ∏è Edit Selected Slide Properties (‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶è‡¶°‡¶ø‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®)" : "‚ûï Add New Slide/Announcement Graphics (‡¶®‡¶§‡ßÅ‡¶® ‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶° ‡¶Ø‡ßã‡¶ó ‡¶ï‡¶∞‡ßÅ‡¶®)"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Title input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Slide Title Text (‡¶∏‡ßç‡¶≤‡¶æ‡¶á‡¶°‡ßá‡¶∞ ‡¶ü‡¶æ‡¶á‡¶ü‡ßá‡¶≤) *</label>
                      <input 
                        type="text"
                        required
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        placeholder="e.g. Premium Escorts & Models / ‡¶°‡¶≤ ‡¶π‡¶∏‡¶™‡¶ø‡¶ü‡¶æ‡¶≤ ‡¶Ö‡¶´‡¶æ‡¶∞‡¶∏"
                        className="w-full bg-black/40 border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none placeholder-slate-700"
                      />
                    </div>

                    {/* Subtitle input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Subtitle Detail Text (‡¶¨‡¶ø‡¶∏‡ßç‡¶§‡¶æ‡¶∞‡¶ø‡¶§ ‡¶¨‡¶æ ‡¶∏‡¶¨‡¶ü‡¶æ‡¶á‡¶ü‡ßá‡¶≤)</label>
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
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Label Text (‡¶õ‡ßã‡¶ü ‡¶¨‡ßç‡¶Ø‡¶æ‡¶®‡¶æ‡¶∞ ‡¶≤‡ßá‡¶ñ‡¶æ)</label>
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
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Icon representation (‡¶Ü‡¶á‡¶ï‡¶® ‡¶ü‡¶æ‡¶á‡¶™)</label>
                      <select
                        value={slideIconName}
                        onChange={(e) => setSlideIconName(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="star">‚òÖ Golden Star (‡¶∏‡ßã‡¶®‡¶æ‡¶≤‡ßÄ ‡¶§‡¶æ‡¶∞‡¶æ)</option>
                        <option value="bell">üîî Warning/Info Bell (‡¶ò‡¶£‡ßç‡¶ü‡¶æ - ‡¶è‡¶®‡¶ø‡¶Æ‡ßá‡¶∂‡¶®)</option>
                        <option value="shield">üõ°Ô∏è Secure Shield (‡¶∏‡¶ø‡¶ï‡¶ø‡¶â‡¶∞‡¶ø‡¶ü‡¶ø ‡¶∂‡¶ø‡¶≤‡ßç‡¶°)</option>
                        <option value="heart">üíñ Red Heart (‡¶≤‡¶æ‡¶≠ ‡¶Ü‡¶á‡¶ï‡¶® - ‡¶è‡¶®‡¶ø‡¶Æ‡ßá‡¶∂‡¶®)</option>
                        <option value="users">üë• Companion Partners (‡¶á‡¶â‡¶ú‡¶æ‡¶∞ ‡¶™‡¶æ‡¶∞‡ßç‡¶ü‡¶®‡¶æ‡¶∞‡¶∏)</option>
                        <option value="trophy">üèÜ Premium Elite Trophy (‡¶ü‡ßç‡¶∞‡¶´‡¶ø ‡¶Ü‡¶á‡¶ï‡¶®)</option>
                      </select>
                    </div>

                    {/* Badge Color preset selection */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Gradient Color (‡¶¨‡ßç‡¶Ø‡¶æ‡¶ú ‡¶ï‡¶æ‡¶≤‡¶æ‡¶∞ ‡¶∏‡ßç‡¶ï‡¶ø‡¶Æ)</label>
                      <select
                        value={slideBadgeColor}
                        onChange={(e) => setSlideBadgeColor(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="from-pink-500 to-rose-600">Rose/Pink (‡¶ó‡ßã‡¶≤‡¶æ‡¶™‡ßÄ-‡¶≤‡¶æ‡¶≤)</option>
                        <option value="from-amber-400 to-red-650">Amber/Orange-Red (‡¶Ü‡¶ó‡ßÅ‡¶®‡ßá‡¶∞ ‡¶Æ‡¶§ ‡¶ï‡¶Æ‡¶≤‡¶æ)</option>
                        <option value="from-cyan-500 to-blue-600">Ocean Cyan/Blue (‡¶®‡ßÄ‡¶≤-‡¶Ü‡¶ï‡¶æ‡¶∂‡ßÄ)</option>
                        <option value="from-emerald-500 to-teal-700">Emerald/Teal Green (‡¶∏‡¶¨‡ßÅ‡¶ú)</option>
                        <option value="from-purple-500 to-indigo-650">Cosmic Purple (‡¶¨‡ßá‡¶ó‡ßÅ‡¶®‡ßÄ)</option>
                      </select>
                    </div>

                    {/* Image URL input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Hero Photo Banner URL (‡¶õ‡¶¨‡¶ø‡¶∞ ‡¶ì‡ßü‡ßá‡¶¨ ‡¶≤‡¶ø‡¶Ç‡¶ï) *</label>
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
                      ‚ú® Click one premium preset to instantly import Photo URL (‡¶™‡ßç‡¶∞‡¶ø‡¶Æ‡¶ø‡ßü‡¶æ‡¶Æ ‡¶õ‡¶¨‡¶ø ‡¶∏‡¶ø‡¶≤‡ßá‡¶ï‡ßç‡¶ü ‡¶ï‡¶∞‡ßÅ‡¶®):
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

              {/* =======================================================
                  HOSTINGER & CLOUDFLARE REAL-TIME CLOUD DATABASE (FIREBASE) SETUP
                 ======================================================= */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-amber-500/10 space-y-5 text-left">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/5 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-amber-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                        Hostinger Cloud Sync Setup (‡¶ï‡ßç‡¶≤‡¶æ‡¶â‡¶° ‡¶°‡¶æ‡¶ü‡¶æ‡¶¨‡ßá‡¶ú ‡¶á‡¶®‡ßç‡¶ü‡¶ø‡¶ó‡ßç‡¶∞‡ßá‡¶∂‡¶®)
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Connect your website to real-time Cloud Firestore database. Syncs agents, companions, and orders instantly across Hostinger and Cloudflare.
                      </p>
                    </div>
                  </div>
                  <div>
                    {isRealFirebaseEnabled() ? (
                      <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-mono">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        üü¢ Real Cloud Sync Active
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-mono">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        üü† Local Offline Mode Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-[#0a0c14] border border-blue-500/10 rounded-xl text-[11px] text-slate-400 leading-relaxed font-sans font-medium space-y-1.5">
                  <p className="text-white font-bold mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" xúÏ}{s«ïÔˇ˚)⁄¥+HBÆ(&)âí‚íîΩ^≠VC`¨wf`äaXg+ÒÊ:Y◊^GÒ≠ƒY≠Ô îÆ¢ÿ*mU"WmŸ‹/¬r>¿Ê#‹>˝òÈôÈÓÈA=lOïeòÓÈÈ>}ﬁ˝;SÁˇ
IÆ£√/éÓæt¯¯ËÓ/èo~ut¯ì£√èéø<:|à˛ˇwã¸¯à|˜Û£√Oéœæπ˚ﬁ—·ÁGáˇ›˛˛Ô!ÈÖ|ø?*ìéÒ¯√gà¥ˇí~Ö?¸1’ÙD;¸¯ËyÿÁ˛Ç_íœá§·I´dt_ÕI^Ò‹T_ˆÊÁ§ﬂ‚˘∏{∑ÇŒY®„€;Ûcù0ÏsSSMØxÆ]Ÿq|{€
ÏJ€Û⁄¯s”ÎNç°–Ú€v8?v}€µz7∆êoªÛc=œÎ€=€G=we˚æÌè°¶k¡ö’µÁ«B˚fXﬁÌ8°ç:ﬁ;∂?7Ëµlﬂuz6⁄Òzay€s[cÁ/∞¢:ÇsS÷y6À¡\‹Ωçg¡Ú~FfÂ˛—›ü˙ƒ
fïNÈ-∫»à‹I˘òL$]„€ÙÆ∞Á∂…„Éø Z¥BrnjpÁËÓ?G›ﬁ"|ñÁ”;®≈ÓD˛¿µq∞ú$Pà;E]Øe”ë≈))C‹%˛”£√O…òæåàÎì)Ú•©€‰mı|F~ˇ#myõΩ„›wøˇ◊—HGA,˜*(Z¢uﬂ{€nÜh”Cß◊dÎ$¨ ûﬁ7Ïm‘Ë˜QÈ˚l^?'££Ûp'öá˜"“ˇô'º/Ó>àÚ…˜`k¡ø˜»êß¬+?¢”L∂5[Û/“À6ä…¯ø£—êaºK÷¸˝Ïã¡:”>”¿hÑN!ûµMÎ≤zx≤Ø«fÓëO·oeÛËgÑNÓ≈Ã
ìyõ ﬁ>f§Dûûf}¥◊/	S"ÀI-^Ÿ£√?P∂ ÷¸s∆¢˝£ôÁ˚∆…Î<Ñ9YÙv{Ægµ`^vú6&J◊Œù<õMº	œsÆvΩIWﬁ`V…OÑÉ∞mˆ(¢∏O¯t‹£´ÕÀhÈÈ˜˘„ìÀx…`ªaN…°YÅèÙ”lªNÛz'Ï∫lä>·b%ÊAú—@w ?‹°Ë√”oO9$©Qö¢Kˇ¯¬1·œ/¢1aö~@˙ÜFìoGT˘Ää@Jiëh˛åÛ∏√h≥$DÈcNƒè#÷ú¶x	9ì…b{Ûa¸4xøá|®8J‘ÑéÉd/¢˙|Ç‡ó_”¡∆ª‚SZ97’rﬁ9ˇWŸÔÒ◊¢hm˚N¡?Â¶ÁÂÍ∂Ê‚è3®mıÀ≥à‡õï∂Å›u®ƒï&’–∑övyØ\´‘•˜„Æµmªbõm◊kﬁ†œºZ´ˆo^cRﬁµ◊É~ﬂˆõ C»ÅkÖvy¶^E°è∆ƒ]ﬁu∞r@õtΩûßx,äÖQc}˝¿ﬁC%≤T˜…‚¸å≤;L?ûê{äå[ÒNNØ?œ˜˙LßS‹ÒéÂÏ˘˝ùÌFﬂ¡;P‹Êı:ﬁÕÛ˚%{ÕüGÅ^`mJvÖ™Z“ŸÑ™è>ûTªÉW”ˆÁ«À?¥6˜*ïäj`¬"ÌñwÆã∂€t]¶f´h€ÛaÊÈˇ W_úûô>=3´◊sÏk´ªçˇ≠W´»˜@çkïo∫®ìZØ<]©#AŸã÷P&[Ú”∏⁄±7A,˜ºû-¯îîR;‰˘§aÆP-/+ı’ü<¸)R5Îr´aGÕÜ¢ÌmØµzÉfßlı˚ﬂ—˜ÛFﬂ†˙S⁄˛©†-‹VHØ(9ì&CërmÓ&ªÊvÌÌπ=|}G–œAã˜·©S“wcv–¢◊µú•Ì√˚˛…ü˛¸Owˇ¸OˇÛœˇÙ˚ßI—xdt`…:jw|6˘ê‡Ô¶◊}®¸ÃwTûΩ6Cœ∑⁄6zm–ºaáœ°≥¡—±£ıD”ê;˛/Ë{·w§˛¸í˙™VwÄ6mpRGJÀ3CÔ—È ã™-ôÊ√©0”3≥ıSßœú≠~ã]ÒuÊ{¬î¨p–π∂—˜æáJ˘ªdˇ≠>~5·U^ÿ ◊∂Z@‹æÌZ7Ìü∆óˆ•ÔíF%¿Îo8aß4˛ıÔ~1>Å^A„xU|/∞ÀgÎ’©iæ0Ù+<Û˘b∂^Gs®¯√~ÛÔˇ˝¯ÉËyt]ìå÷:z"˝f∂
èî>∫≤ª∂oπ≠Tg¸[±;˛t(ÈÓ‡≠˘∂M/¶l{(Ëo•\ˇ›ékﬂDOy◊∑˙ƒ]î›À5πn{Ü^O:T DËrÍ∆,¡uö7Ê˜1chπ6D∏ÖFùÈÚÕ/rÂvŸÈµú∂W>ÖwçÊ≈ﬂ’ÎUqSÊ3Ô$∑f€oÒY¸?q'¯V/p ÇZﬂÇ? 5¸¨Ê¿<ø‹˜ú^‹&?∏îõ6˘Êt¨ñ∑[v€»jÜŒ;ˆ\–¥\LÙgVÚÍ
NN¢2	7ã:‹ÕJ^}LŒH∞*ïËHââÆ†T∞F>≈JË;›“ÑäµË	≈ÑT2ƒ¬√.IÇ˘õ¿SI≤·0A7—N˝Üéät∫\Èì‡’p‰Éê,˙•PF8eìq&L\N∞a[._‡•ûµÌ⁄≠'JdX¬˘&,)M]ëõ®ã~âÖ@F„àÂ[=)ﬂX„gíGEÅ[æt¶ïHÁ¶^’°4)ÜÙ≤∑Kƒ'WÆíÑöπ5I…˚S/£˘·Æ‘„ñ∑ñó6—˜–Âı•ç∆÷ÚÂµ∆
jl,5–‚Ú∆“¬÷Âç7—V„µT´!üç^ûgeü.Ùñµ¢Ò&&;œnCïôuä.§kÔÑ%"›¶O»îËÊ∫ÉjÈÕB~ÅÕRã5ÒiA?Âè≤Ok®âàc Xì(8Á:≥ôƒ°HñY~dl≥†‡K∑Õ¥\â∫Ëz€i	éﬂ!ˇZ=ß#Ï‹@≈âWÌ–˜˙ûÎÑV5|€¬îr≈ﬂ∆Vº&Ÿ⁄ZµzÑÍK$o‚ã8≈ÏïæE√√Q¸¸IJΩ„4öùµ5œMuf%s'M.†£`ºyxÚ»,Yxÿrz»B/ø<]^±ﬂ¡¯œ«/ˇÚÀ®‘¡+IR¥0¡8n2ÖÈpœNÉÌ2mMπ¥O"ª“Æ‡~;÷7ˇ˙ﬂ~Ö?]ƒSà˚$zè¢Áº¸ÚD-Ç–Î"7ö'öâ11µtl/ûEº:É~ØBµˆzV◊¡<œ•«FVøÔ:¯7ßáÕå^ø41€Çæ∫}¸ Ãbwãìòùá∂ãˇ-õªyõÄDº|nPëÃlfÂVpj¿ªAÓ[rì{Ë∆]Ú}œóÀP…fÑ≠àßÇÏƒ¨ÿ≤ìF|‚Á˚Dê6±—Hv∆€x÷ùùΩÚ∂Ó⁄v/πSb…T∆”mÄ´e/˜‰;Ô˘ﬁyj◊%ﬁÛ‡‹˘Im∫ƒ"øƒΩq˚Ro‡∫&¿∞¿@f´asÅe§tRﬁéù«¬¨ÎÅZhIÂSVÖíh¥ZhÕﬁ≈íÓ .·≠$•êÏ˙V|ı≈Z≠6S≥Æ%ÿmíbÉπ≠øî°÷UsôØÃ!”~^¨7O◊≠Ìk®ªç)T≠°ËÇÁ÷]º]TjGÙB
ñ[´†∆‚"Z[zã‡Õ≠çÂÖ-4Öˇ|}yKgti©±∏≤º∂ÏˆI⁄dïQ,˝.ÕeC<™˛às_ñõÀYÙÁ$Ë£Dñóî◊%”lG2xØ∑9ÿÓ:a‰ãì{lÏJﬂ«l∏.⁄;÷¿K-ΩO∂g‰wB6/^El,v1øúG={ó”Ê2¯#ô)oÏÏ†“¨ÌÚÌp‡˜‰wjûÌ¿cY'ï–[ÒvmìZi¢‚€ƒYWö∫˙èV˘á’ÚŸkSÌI4~}\7GäÚÆ ÙÕd
ùßJ‡uÌRfæUÅaΩ
ˇÔG?¬±x±ì#?Ká<1°XπÃöºµ’DgÀ¡#rö!{iüu|0Ü,sá÷≤o‚üÉ [ä◊F⁄©óör|ÚÈrœ°u,5{!aFÛ 7pZìä_`äÊ¯å®n¬Z< òCWØ…G™Y0ØwÖ»˚Õ‘¬©Á[’¢tµR©§◊íÕƒ5Â„Â[KÌç“∏äe6ÈÅÏK©ßØÈπ(ËŒëø}oópœô¨'e°Í B^¡∑ˇ« ÷-Èè,∫êÊr€[X»ÃùQT!S ‰‚•∆ƒ–öDóñ∑∂/Ø]úDõoÆ\Z⁄äÿΩ2«-5·Âö&ÏGíÒÖY∞·g2—Ö»ä…FN’eU4#a’®Ïwy "◊˚1ì;7xR⁄>∂‘0S(á^9Ù—éÔu≈1zÏCÏÆÓàøåÓ;]Mx4÷È4¶uRlWº≥ó6„∏zó‘‘Rzi QítáÄ´Œwz7 “àî‹ë±ÄŸÎ"gŒóò…£ı fôon54®%Ê‚áb˘`b⁄C•il¨É˘µ`˘≠Ä‰ÛN®ã‹û=y≈œ@Á√l¿µõ!ÆI©w≈⁄≥˝·5¿È
Zm¨5..°Õ+ØïÅGl¢+kãKëB∏	⁄_¨›ÒîÛ;ÙåIt$‡ÁX+,gÌpz∞Ë'XT©{πú>{öLö<æüQY∫VøT‚·≥
',æG!‘nÿ{Û˚º¨˜ò˘RMÃ≤ÀßÍò¿éÎÌñ;N´ÖÌ §îK[ùÃ3õfø2œË4f©Ã˘~”-Ê‡Ñ]`∞£‘ò8áCú	éz‰	Käp-üíπûRÔ≠Ã6–≈a˛‘nºD`qg6{Jﬁ]qﬂSÅÜg=πÔµèAË/∑?¸%äÈâ)ŒWÄáPıX5ΩdîJ«Ä˛=Æû©‘#ÆE¯å FíY)˘ëÛ6ë≈∏º8áƒ]íz'Ùıèˇ*≈7p=∑‚⁄Ωvÿ9‡æµbæ»CÃf@FÊó∫ù6
óI$ÆîkF•z”‘ˆ]ßáwhÖ∏¸nÈ-<1hœ k;‹Ahª{ÿ,`ﬂÌZ=,V<‘¬b‚*ÿ>¬ª´§(≤é"ü#6ìd∆¯˛∞‡Ì‡Ω`}> Ô ôÙWﬁ“ÿe¸2∑ôìØX‹2â/jÑqOÊ< ¯«≈¸B0L_¿ñß@äπ#‘ÿAÏ±π]Ë6≠˛W©…√Ø7≠	°0∑ùﬁ∂ÇèÊRA<ÓÁäE ãß#~'t!ªfë“]DsL@§)Ì-ıKiôó2™¶â£ÈCeÙwUé\ƒ9„∑¨vÄﬁ-‡]≈d®q‘Z“©î™$9,∞ﬁ]ßWÓîØ÷âŒI≈#I
"Ów0<»'-ìV2]‚°©¢W*ëj§¢ÏÑÊuiR$&ãêz»:Ka£2»n9ÉnépAËÎﬂ˝≠yB¨§eÔ`÷÷B{ÿ(&ébI°mkO¿õ‘∂∂ÅÏ§†bzQÅ–öÀôõÏ‘Ö“Ëö¬‘Zg|˝˜®g1p%5P≠¡Z◊ô*Xò$Œæ'e.	S'z‘ÿ3	5ôñqªÅ+è6x ÖÃMæbƒö‰äy~ôä{~˚¸Fû“Î∏Rï^π≤»πe˛>|dëX√˙‡ﬁ⁄BM™T*Jœ™¸ä˝≠≠x3Ö" n9¢M¿Ü.–ÔÅŸí[çÔd3“2Ì˚¿êíF†˝∞‹•’v¯ï6j%'ä€fXÊlUÃàÃ5~qMg√Ó‚áaÕÿãFü·W>ÔAËˇ}îœ†rtô¯æ·Ö≈óéd5f¶^]¢
”™”sHûH]"á€ °—ﬂÉœV≠7©£{¸2åÚÒÀ4⁄«Ø‚óEˇ0ï°yŒ/à{~’Í_¯€µW¥q@~—x Ó-''ﬁ/W3(J≈÷*NØÈZxÛ¬3åoäÈ!80IÃwò	∏±Ïï¥†â√ÒKè„ó".'ŒÕBpî¬ÔxBØê∞3rB0E‘3I®Y_L^Ç,ü3ö
Æ|ÅulAÖ…{3πÉK˘ì°–d£¸ÈO0Ü94.;.!^yÔ>
Q◊IBçòÊA(Û«™%•÷~◊œ¢W˛!-zi#≠¸bWSÜÙÑÒq=ë b±E…§8ë§H$Î’É÷GúåÔø“ô∞p9ßÜhœÁ$⁄ÛŸ—·Ω9ƒ“'rTMå¯î"F\ØFœd÷¶xçxF#¶ö°éÿ4û%3É1?j,ô5<]ÒºDé:!ûìå?(fNù‘;L4XÑ°u/ß◊E%ik3$Yˇ´ıÌôhƒÚËq¸´RSV˛4Q0√^˚d9
Gó_øﬁxsuim]ll-Ω—xs5÷— ÚÍÚ÷ÊÀ´ocz›µˆÜÃ¨œ”RÊŸ_}±6[´÷Ïk ,˚z·,˚—Á’≥L„biı∏ïíàÎ1rÎi¬7Z∑ˆ∫¯ëË"]&1ü˛>c˙rëÉ#}D>ﬂ>:¸0Üﬂ$¡˝{˘Ì´Íï£© ”:çSÎﬂÙ$Y›∑€ÿú∞˝IØè5TØ›vÌI‰˘¯'bâ˜Ÿ´päK$µì§w≥\¥ÎÑ‡µum‘ •|œj≤¨}◊¡úöfŒW–RèD◊¿gÃÇê…IüƒÇÔû˛«∆ﬂ˚®ﬂiCª‰˘pÿ
∑∞˚$ëÙRíêˆAﬂn:;êcx¯FH
xgÿ|¬OCÌÅ”≤zMH∫ÜxKÆ?fN˝™◊≤]¥Afîf†∂Õª±‹ †Äœ8‚Ê#ƒîFò~øöbˇ}eíT”«õúl”ÍN≠&OÇà–´/∂∂-ÎTÌú;KÔTiZé6ﬁ/f 3ˆiﬂóŸìXƒnCÏBö©pFy†‚sU5P√hÚäÿ¥ùKNÜ≤ËπÆÂo:Ìû2ß(zíFR—‹ñË‚[ñ>N~Èõ~PNKbút´|¡Äáøú§ÒÔÚÃˆ?•-)Æ2„íø‰÷êœÄ5' "&Á„óò2[£Iπ≈±;3ò◊?„Yá4#+˝˘˜È3Ü—ç;ì@ rPV5,´Jó29≠œËÏ¨$GEâ≤© uÈC#8Ü1‚Oë≥§”†@Wc:•<D7◊æΩ`w-◊ûCGwˇséYπò¥1AkMÚÒDßÎ¯˘@”ÒD7√xVe£Å/áQÑ
Å" 	”1≈w√†Ò*˘ôQmb∂’’ùa*Ü2Z´<=ÀF∫Æ
ıìÜ‹âHUÄÿ1ÀæbØAπ.0⁄4èJsZ"πÂ zƒù‘îÄ∂JíZ†§Iéß1!P¯â’zX:MM£2— /ﬁ#_$&Öd&Cœp:õ>ÿõ„Ñ¢∆:’·‘ˆ,Û,â;_yØÃ}¥7,ı-?∞ó{ôt~pMU5Æú"Ë?iêë••¡‹Ú‘˜…J¿9˚HÂí"	G —‡ ûIò©VïNEÖR°ñ(  —~üù˝¨.∫øW3ª;≠p<ßª;jœ÷Ó&ítÿçüÊ.Á^èo”.'™«3≤Õc/m·}Nt%ˆ2l£ÿœ’éè”øû≠-O’‘a˜<i˝47ΩÿÔõ≤Î_õπÇ∏◊«ÓµH§Û$A‡ÙŸ~bÇ¬∫Ô41C†]^Ä¥Å6 ÈnLõsH s]2’é⁄ò)©X†=Ÿâ»79=\À_w≠‰¿·Àú¡˜}ªÎ∫…¶ÎÙÀú¶∂ã7B≤·|•m¶—cﬁ¿Vks–l⁄AP
}Ã¥∂úÆçw\)BHı∞cπÅ=1Ivó≤'9ãQdàZv¥tö∆Sƒs¨ÏkÏ^ƒﬂ]}q{ÊÃ©ŸŸk‚1÷´/⁄ıÌôS÷µ¯´–à*{ñëMπ7•x_$^…≥u[üg*¶Ÿ)ü≈b_2∆∏Ñ˘ÅJ“&Ì˚@ò3g[|*2QGáç°?.´ MÌ'HHâô⁄ı`êUˆπ”√3nπÛ˚˚»√™ìÓÕ°Í$¬ˇb¢Q–J%⁄‘Hõ™	9Ç”Ωù¿Õ h• I”Øò¿Ë∑4Ri≈Gà3ßéà–,8~”µßT" 8;£ì’JëHt†a‰Y"ÉØë”ª_FUòÓÛ∫K∏ny'·NéÎê˛öîT~–I§ˆHN"ùcp‚ùk0&M)l˙viåEø˘òQ‚ãuQË‡‰Q£F5ÖñZN›&	…¢ìÊG¥ç¬í£âÍŸ;≥≥ iO!J‡¢
N¥x<,6©À-@ú^Z\ﬁBó◊.,_ºB°I0O»*ã˛ÑTi}ü†E›Kà9@æﬂX∫∏ºπµ¥A`®XÓ
È-9%ÈZ^ÏíÙ+K◊ë≥∑=1∞©Ï^+	{hµw◊»©qM∂9ªü&?ê‰OÉ6â,hπ,|°m/◊% ›ùåõƒ/∞¡ü‚s¥ÄPây_wmÿ;ª>ll;-‘≤CÀq±∫≥2âËõ“ÏqÏ—PÿPbÈù¢~ètÆ9Kfa-i™y[üjlÛsÛ'«Øóì_^©T⁄˙úUXF˝];Ïx≠9L5´‰/˝›ªXËa;€–‚çËSŒ(Ë˙jÔâKßÎµΩ+æX°rTpL§ »ySMöyµˇá-H[i÷))5·QHëëO!Ÿ$7q^ı
x_.•HP«”∞…çw≠~wÙÏ]÷ŸJéSÉ∑àksË≠ˆÓıóˆÒ›ïû∑[ö8xKΩÍz*6ß‡‚‘õGπfTÎ˝∞‰ößã≤ïT=b˙ÉÉ))^8)ÇjN·¯êÛÍ©)lùcí%Ä∂h«±›V†”D∏™aÎË-d%snÖOŒ≠î÷J„Ø˝†±yI{gLgX⁄~ ˘å⁄lÌU»C‹ã^
µÃ˚kí	T†ÓÆølÅuR¢@»tØ<Ñ®åTˆ%ÌbE)cI≠Û)Nú◊±wY!OÅh„9Ü·˝Åõ‹√6,zBœb1∂ü$…¬€?∞Ç‚ƒé^_^Wø…pì$–Ö©“H√Eâ¿3QØ°¢%JÚáYÔaj∂PúÓü8•Û§t6Ï<˙¶êx˘¥IôhQÍd¨7Iü»
∞˝∞7¢ûû–í±π¢’)◊™"h`ÖiN—x}‚∫¶Û9FD—ÿy≤˘ŒM—ﬂåØ5.6«ŒØYm´U∏Ò∆ÂÖ,mçùﬂ†§`^ÛsSÙÌá€9+p Q°JÚmûÉÌ√F€h615Öd”èj≈⁄E—m$Ë%ﬂm•As—Ö9b%¢y€ü–ÑÆ/iZˆD·-”hc~:vû¸˙æ%‘á˛#Õˇ˘—·Ì‚Øbrƒ´ç˚Ê±L”(9Â7©DícEπè5⁄√ û®¶…6ü≈6üx"Ë˘a‘|°+	~⁄¸¬#ÍÖ˝å¨ƒà&û)Âìª∞˙Imµc(†’⁄È⁄tôÎ|.UœT∂œ	)°¥&ÿõà÷gõ∫≤±Ç»q¯Á`kpÛãåø°SR¡ˇK˘Á}˛’'π{Bñìîç:&Ã∂@Di@Ûˆ#WO™ü*Ìñœ‡áúâO¥cXu^ZŒ±Ò¿qœ94Ót€(õÛÒ{ ÀÁ«»"A‰≈±w«$;ØCˇÁmø¬∞-ß7ÜYÕéÌ˚∂øÓa{o~¨Áï˘W9á–Më„ä†∆I¬±¢∑&XEñíÈÙp/ÂjLZßl˙Õôz˛z%N/≥té2ÔâÆ%@ßÀÏÎºó¶Zc]|î˙π8XW-î¥2@Ÿ Aÿ áLo±ÃŒJl¶∂≤¢/Ÿ÷:m≤µR i|g1vx&	äñî^kó— Âãóè19¸Ø<å3ÑòH)‡åAsØ\/‡[ÕX1H©À]®	"ŒÛ±àÅß¨®A/)f
ŸB}RZf(©/áø‹ÿ]yzÈ‡t≥÷´$rs⁄ «”©¸†a
Õ$ï∫≥hî…Ñ–i)^C|QuDGŒ¶¿E;é´IçÜ[vã(»cÍec<*ı∑gŸ‚çÊcÑ!¯ºRπZΩfÇ›wõ„t˚¥J )íEÍÍnê/ÚPÒ‡¢M+)Õπ€Û»K5±•YOæ‹ çﬁkå¡ ,Í‹j5ÇE+¥0†ìtLêp›œZÙkΩ6ö£‘Ë7’"B®H$Ü<˚˙<w2ìóXt|õçºƒèæS˜≈aîH	UBü%kWµy°«·,_25∑iN(M¥zè¬ºóˆ¿/õ∞_W1ﬁKc@ )⁄Úo./äu£:Ç	¿ÅÁ“∫>æM≠¸¡¿µ%†˙ù{ë%¯)kìÁõ=fOpÏÇô%Q£º∏ΩxcNÙ^∏’,Ü/40ä‰˜âÁÕr¢˙Ù“H©rWÕ(wX±í$õNeæ$ô!>≥Z¯-Ährï¢OgÂ)°û‡M†˛ÚKƒ˚8MƒNRO€÷gÎOr⁄”U‡
VäíÂì1‹•F%T@ìŒ©ÀnP¿sÍñOyL∞X9û0¬GÖMpûÜDãÀÂ'ìL$'v'_j.ç`ÖE‚ÙÙŸô3◊(¿ïi	b©/∑0ù∏Níb…Ì
Õ¬ïç 4l,l-øæî≈7\Yﬁ‹B•˝tÚ,´!e\pN—Å∂Jˆ¡ôDqìîFí,%--◊öá˜#Òùg Ó EÔUp∏{Fû›™†Â^y{‡`Î¶EœiñÃ$"!wö¸L„Á,£1@ª(M6^HˇùdI¯,‹úrÉ©º^Ek¯πmCÃ…jë+mmÅmaRP•≠©‰'≤˝∑ÿ>Nx‚gsjÙ≈Ys”}Ißˆ‡Ò∞ºNuç2∏0oçﬂô∏¶^Ñ{Y◊∑ü⁄GGÏÔó@ß™j»ju9çï*´"D«‰‘◊Á”Ùñ¿˚ÂÖÃb4πä0πF˘cá
∑Ù	>ó¥h§ŒSltaçC/¸YËÂ	Ö[» Úk\òiÕƒKÎ)¶8góNô≠ã^£¡Î@9¿åSwV©:âfr√D¶”ò◊œ9ÉNTÄsIî\A≥eÆ–kB›ÆÆu≥ºã’ûŸ}ø3Å(7.ÓT§ˆ%]í§ÜúpP◊(ÜFœd{¶úU›K?ßG	‰uã-∑…ÚöÃéò‹íö·˝∑2q&ùûÍÀ)Ô–
G∏⁄ï¯¿ÖûéÃeΩƒÉãJM¨ß[µ”†ìQ;Ωñ”ˆ(bb-ŸÙ¿ØAÔsí¡ëT,É∂ÒÿfŒ‘NOüΩñBî@TèãK{¸ﬁ¯≠ßß%g„uGÏı5+∞` w
·2(lõSïHjôE¬æh<+L≥|_5{éÇÕ§<’¿„)Kç∆∑¯uRÛŒuíFF˝R&˚Y1ÑZMÔÕ∏‚aNÛaR~KS¨F≤ﬁ≥DCÃ"9{€Óñ´™´L‚ÖàQ‹o¥3^¨+œ¢≥\?wÈªµ/)Ö∫5õÅ+SîY¿õ;ìcE≤óõzmËt¥πÎÑÕzçû˝◊ï‰2Kn1Om)X
—‰l,Ãìy%&∏õüîmÆ¬'a°áI·®›¥Kn¢ç≤.Ù|¸“HCûÀ„◊∞ÁC£⁄LZ€∫
1ÇBÒ–§™!¢i¥Í8Âpî„Î˝û&J'sï£:SùÆ+EoRÊ¶*ßäø’Îy5§∏∏èŸFZ•ƒ#âDjmÆ2†˘=üÛ}Ö'ÌÎè>@+¯o‚-˛˙£˜¡GkmªvK[ƒ)ˆı!»†9
 0YÇ;bƒ[ü@Í`˛˛ñE’⁄fµ—„ÿ5«åõ–(◊)Lõ%"nIQm⁄ã¡qäü@1l-D‰jΩa/πNì5›©ET»ëáƒ3TÅw∏Xn¶©sÃ‰L“’PUü∑4›å,õÙ˘Ÿéy*´@ÃµÆœº¿ıô|R>¶>p|ç¿Día®T⁄ÜJõ•$•$öI#H4,êNêhW<≠Ä^ykv\Ó∆÷¶M÷ƒäœ¯´1ïw6S?6œ[¥ÒtŸ#‚z[ætTÄO"7]˚≥ÊGYŸ;u(PÅ∆ß˝*	Â6∫Rxç≈’ÂµÂÕ-¿&{}	5._Y€⁄DﬂCãÀK[ó7ﬁDó__⁄x}yÈç'Vœju±˙2ä xy–Ä©è‰dÛ‡Ê¿ﬂCóh>Ókp“^vBQyàÅ‰Iëakßk≥µiÜ[mV[Åmd†SÖΩ¥µ¯f8™+¸òäjˇäŒæ¯Nªg_ çúùL!:‰˝%ê…gQ|Ñ16Q& nÅ&Ωa≥∞1ˇ3µ≥ßacÛF⁄RY™¨Ia¡†´´ÌôS˙KÅx≠|`M*∆D@ˇó÷∂ñ+âmvy-ﬁ˜¿ñ¬…‡Øh^ÁOÖ#»Ù82=¸òóLÄôæt¯H2]Ú:ÇŸ…äé§ã:
Âd•sr	ÍÓ±ÑpölR®DHjæ„›∞Q∞Ä*F64˘≈ø5±¸¡sÓXn¢aEÃ&J¥PwÄ’æ Ø¶ªá7Iÿ¡˚Y,‚}Áá¯Ó•ÆÂ∏$w√Bx#–⁄Å[X4·]ÿE}ﬂÉ4Û
⁄Íÿ‡K&0F$E§ãõ¿ˆ†"ÓÉƒ_I¬6ÿû.ìËÀ[Î‰Y0‰&E)nR éÄ<íÄbcÌÀOº7lã6¸uåbÑπY!â4ê:°›S9Q¸Ã§™‡:·wOdó5`ÓQiÀ∫ah-`6—¨Aô}∞ÔzÌ∂›ZÓëFûke{ØïÌ_'´8nòÑﬂ	øNËÎ¢lî´*TcAÔôd2Ω$˜ è?Gi'å•‚ûÚÚ∂d±Ò∞¥⁄t2B«ﬁÇa3õü!‘ïŸ;∑‚•y—)¸ËSjêdÕiÜ‚G$9w ÇÆí 
õç∑®Aq∏7làÿ7¡÷õ¢ ‡?Ê 
Hû=fÇwu<S© ©
  √/“”q∏(≈<5ÔE ^ﬂÄW¯óæ… ÀÈ˚ΩU0…àÜ“&Ï)∫;'“®Øz)ˇ˛\õ¿m?%˜˛!˚Ä\`í±É
¥
"9ˆS∏!cGUmï•5°¢-LÈ“‹§^π¯jµRùΩñ—πÍ1É0d
 CÏ©D”¯±uök™ﬁ}∂so˝”¢◊?	o∆v7ªÜàU@…MoXÈm2iÇoÕ4q"ˆÔiù” ä≤oì*,Q˝–òãj6¢à„Jb›¬Ÿ´‘¶æ/l‚{¥}¡≠Æ÷Diá<¸¶DÖÜ+FÜ∂ÇΩ^Â≈4≈àÜãÿul≤‹ﬂ-r~+Øï⁄#Ö€ò']T∞Ëﬂ]@¸ˆ≠eL•ÒûΩK®ÇËö„‡÷æ¥µ∫B⁄-—˚Û2ç‘¯Y\ÖÓq>÷∆6âcÚ,–›‚Á–vÜÍc*ﬂ≈lÃ¯Ω÷YÉ¢Ôe≤êØ[.ê@¥¶Ø–„{Ø0W¸o≈€µ˝Ã,tx?|¡hüâÂKuk≤¥óRº,ØƒH_IÖ˘GÃB˛Ízòè'¥Ï”5°M¨PfË Æy4´Ä>.Œ|£˜;[ÆÌá•q`W¿úﬁ%1ÙL„âìíèèˇù∂[^!d=ÇZ“¥ﬁ∆#Úk‘€ó¥Ó[\Wöj(è ~¿ÿa¥ÌØ£sîzWØÌ.änº(d*±≠ÖeÒ<ö˙«´ˇ¯¡´◊æˇ*˚ˇ?Tÿ/M©ü/	Èßbπƒóh¬pâº¯/…!’[§t¿WÈuàÁù/J\LÂ1—ôz@jÈ2˝5qDıƒ¶fD C~(Â™ŒÜí@¢π¯)®wàΩ˚{˙™‚ÒêTÅ·äÒ¥xÃIøπ…§†x]ªdÅPµ*Ñ$íºé‡$vp9" ∫·ÿººGf‰+≤CÔ2‡îîÿ∑_B<ÔE%uÓÒz:tfÔíèw(f‘oü¿ƒâ¨¨Bú&¡Nÿ)çø:û37I©ÄÔGﬂøzD‚Ä""û9©-≠cûÔÚc∂òÓ	?r[îÆ4Y‚{sË’÷”\èH∞g‚$◊.Ù˜¥325Ö6¡gª{(Ä”îa«é‰rzh«Ò1œÙ|Ê˘F=oW”],MΩÊÜΩÉWºÂ5K≠ÌI&âØÛæÉÒ…xwÈ^ﬁ⁄µ8‚Kqœìh?Á\B~Î≥ÿ¢Ó\o–¬}@â*iFßRÓdêéU≥Aû1‹T˝NÊƒ∞IÁsÒioÊ˚jN‹•˙&†£Õq•MsÁL%6ö€¨™¿±ñ*3uœÕ,Ë©Üæ5ÕàM(Z√@_,yC#¿^L}zoô|t†.è 1_|®{†Gﬂ°º˜≠Ø?˛©ﬁ7ˆ“>‡¡*Ω¥œ∆q0°´7ßRISÖ˘ÚÌÌ®∞k¶?√çü¬PˇÈ«©û•ÓÄlªﬁ“·#†¶)“%€˜ÁHróñPÅk‡7Æÿ§˛◊`V«ø˛›/toôV0‰Ø≈T±;\[}7Öâó≈‚
Â&1.oR.ﬁF‹ÔB?ﬂäÍRàﬂ[E4aUöà2DVr¢ deí örT)–f~◊W‰&ÀéÎÛ`±ﬁ•'È Æz€Êeç˜OãydåÿGxÉ.s¶G&-·“›ûãî$ÉÍ≈
ŒŒ´€^k/ÙÕN•Èu˘
†
…3§á:]≠ÁÇ	EuìÓ“É>z"íò˛<9X¬#—W€'5›æY;-˚~S√'øŸÚ‡1ì{çøÿ»∑€´`&]˜vö`Iëò€´dmòïâoÂÊ£ˇ∑ KîÑ†Nb/6Ç¿i˜˜@√v"{;j «/9ïT)πß@ÙÑ>u¶´<s˚ëø–(˜c#Ñ¯=ûÊ:§ı‡©«6HÄ\Ø◊˛VÓ¡Ÿt$/àÓ¥EﬂÎ∑º]›iÉÁrÀëWî©ó‡©_Q3!r}>‰@ê_Ç•ê¬t<÷÷À©ZìﬁU0ÙcÓ®ﬂÈì◊# }.t:Â´3‰∫iº6¡<YÜ∏7∆Œ/.]h\YŸ¢i† ÚDbP]&”q;øzyqi£±uyÉUò˘D»»πMKëÓ^àFéùﬂº≤æ¥è]õ•dR)G[¥∆Ñù–<Ç¸cKfúzPBmK“ª©ﬁRßÑ1˝1"'æÊûÂZç’†ô+§p&Q(Oa¶©/JàBB‰9«usìÅhäKur€¸ØËßjJÂL≥Ó 4Í¸⁄Ò{ËÜ_ê@(IHwDvHQùÿ»|Gã†·ëx;Ò∞Ïı:<{vFü=´KZõ*a≠/¶®≈y≠Úºˆ‹Tµ4ÍBn“ $™¿øéfñ˜m<Û¨79L€oZ“€ÕíBÏ9Õ˚¶êﬂûøßa‡#O{ã|Ø¥Æ÷a~Ãù∫·´ª∑%
÷crˇcûÅp≈‚Ôı(“ºéïÔ&˝IÅ&ìFçïÏ4Å¶5#˛?Õã8ò÷¢‚(mˇ'p∂]1˙¬¡?—ÊV„¬¥∫¥˙⁄“∆¶bT†6Êh€Ò°%¿*√*◊Ï2K—π•Ω≤5=4}œu∑-øv01äò∑DJ"¡&Úï9Í≤&óD•πº˝∂6ıPH÷i¥Z>d¢œ#ﬁí¶T¸d¢ﬂ%´◊"%$¢∆¸í…ıjœØ„;NõÎ-eNÌ¥âÕT‚ëäzM>&ùƒÄ^…‹!‡’ ç:˘´Í·⁄10W$ñèä›Ç◊+â(…DØù∫·∏ÆÌOø⁄&±æ¶◊Ö≥"…T∏9û¶ö–ë8¡™ÂÙHä<ÂcÛhòÁÁ=dÅÉ Æ∞s/ Úüá9”ÈáäÁAˆ·∂’j€[ò@ñ	}©Mp”+5⁄˜»ö(QM≤f1`âÆÇ}ºﬁÈC>∫`‚EÑSË/∑ˇı_5ôåôwP—YXœºN|Á¥˙çêÌb·ô}11Â“µVy¸Rø˝‰øP‰ΩZndã›ß{©b˚òÅ)©ë@µê¿X§~›Aw»‹t]©œNß\	uSTà˚‰òxÚÏ(ì3Zl£‘Ÿ‡·Ï}µRKÿ1’isëq≤∫ÌY¨\ûÕ$ìÅ‚SRáCr≥ƒÙT°⁄Öi);·ºl“sùãëTö «˛M0Kp∫6¬Rus∆+†…PŒò{òπ©NNûgø(·‰A*ú¥›ı≠˛0P»π‡Ø)‹x0SHë`#døƒé<ü¸h
ª_2/#EÂ£G‡Z7ÒC¿ó4œÎêK”k⁄`.Wvú^´êÇ;TSàO¸ìˇA≈!áÉwê´Û:…jÑÍAR=„ö‡<‡NL∫»eë‚ï¶Ü`´Æêbˇ*Ü_óA¿*+∆%ÖHL'úÂı ¯¢›À¡å v…[¶)vóºK'?˚ÅŸ8¢ßcq¸#DÎaü
äAÙrtûVSòC˚‡.≤BN∆ãLÜîTU°¥Œ\&å˜y¢	÷4\&X4yÏ”yEy,¿6Áä;∏$'«3J%0Ñ2ö=˝RÆâõÄ…õDH‚ã’„
b>8\ÖÚãÚ—ﬁæÃ¨J!3>*d¬◊‚Á≈ÄZV⁄`ÜE.Ùí®ˆÇú•xåxîÊyF”g 7 /≥uûj?un$™‡ f…ö„Ü—K»JÂâß\èQÔŸ√ƒÔ˚Ã∑∆J“—C.˜ÑÃG‹ü–îä6ñ •yF)§âŸ1õ˚tÌ†ÍvµY´^3ã.∆ ÔlUáè*àœ§ÔçK^I‡±p\Ü2AK<FQŸı®£â ùd\QxhNÑ1æÃä`åø_R·•˝ÿ`ÄOØ˝»Ô`≤oLïìzñ¡Û:æΩÉßßÜ˝`nj*¨tÌ©óˆSæK=Ï-ø®‡õªéÁ∂w√d_aU™•x}@ªz^T5≈ƒÇ)R˛Ç`«ÏYΩ4‘˘nFZú(HÏ^X}»ºÉÔ-@±òfàﬁq¨8ˇí·ÂwcBiπ˝·=¥ütõT’∞ûDIç|}íÏ«j◊Óx,Å” ø	•÷rp›ïö/w-Ea÷oÖÖî-ÏıWôÉπvà¶/4xbD5\ÎV-∞À˜‡XùØypØÊ*z>%AøãGFIìÒ”™†©Ú.ô5º≥≤KTC}Z*û{»ÍY¯L¡Oú≈Mßã`hÁV∑†èöI 	°ªh˘^)d7™™⁄÷R=s”ﬁÂ7æä‡˝∆WÑ¸À∞@
öQ†Õw∫]ª≈Ë)eXtS∏…ãÂ4Õ^Ù†[ã@¢¬Å∆‘—»–˚◊ªâ8Â'é›Ãó%<)VÚ/zT≠hƒuxü†OBl2nì⁄z™˛(â‘,!e#TLµvz<
¶~ìﬂ˝-xº%z^»Fá_bÜÁ˚Xâ´çıÜbÉ+p/ î0)sLdˆHÛgäàøÇÅ!Üπb»ﬁ()^LìÎ†\πL%Å%#!¶;’îk Ù¶òr†ﬁƒ˝Oñ#ïx9x5=åbë’µ£´â⁄—œ‘"Øy'≤∆∆ﬁO√çÕ∫îUú™
£€”KEy"õ6ÊHqgÎø0S+Óúa˙©:%¬ò≥Ω8\9ì·om]´¢•<3ŸÖÍ›§∑èQblçÑ;Â´”∞)ÕHÅmT«€DYABÉ;N@≤iFÁ>äJ£}e∫]≥≈¢Søk†;ËµüqËUÄM´◊i2K÷=ydº@	ø∫ÇÎÍ.9òl
OPJ.u©Ëów¡µÒ[ùûÕòëa∆*ây	àŒSõõòó¡¥Ã Ä BS¯Á)™
”†B@ãk3Ãh™Âåh¸çèÁl§π„0è…√CF∆jdÆ
,sXcusïbKå’Û¯ò¶™Å±JjF®MUR6Ü,B!kı$Ï’‚˙·∞‚¨÷»n%ÆMπŸ*⁄´πËÇÍG”]‰êB2∞«ÄVlR	ﬁ¶a:íê:>!}<¡]Ü\‘XU‡øà#™K••!ÈàÉ>∆#Ùp=«ùÂkàÿM#z∑ƒ1dzLÁÔê≠sêÉaÛÄ·fC¬¸PéÉ†ä»Bö=dPuf˙É˙ÊË”;≈‹#–≤ÈU¿y†≥,ôòH÷˚ô≠?i´≤à]Yƒ}P‹ÅTDD⁄çê°å—,ˆ3‰F(∂‡∆ÆÑ!F¶ÓÑ"yWÜ.Ö¢¥6ùÈXPÒ©°#Úò≥<sCT›,]ÒåûRñI‰ãÔg’e’ûiáC‰rX∑˝Æ’#ñ6∏àﬁNƒ>Z^$È„≥≈œ¸ôunº•›†ÍSÅ\LJ©ÜõŸúO‰˘1å<˙¡‰E®iÿˆ5Ãá}¨¥∑Ï µ!qÅ÷¢)ﬁí.1vŸ"‚˚¨ƒyA]”êÆ˙†èâm ã1ø+h<øÔŸDı⁄t˛`˙Úy…–úy0Û¡e˘JÄj»Ÿë?h6áË°Ω´◊∞wıZ°ˆÀ»È±◊ó.\ºÙ7?XY][ˇ€çÕ≠+ØøÒwo˛˝ÙÃl˝‘È3gÛEÅ¸Jp Ã¡ùVˇˇÔ™„ˇ}ˇ˚Êa?hÔ√2NSç¸6}€¯¡gˇä<—«~ûN?x≤jÖù éÎy>˝ÛÍñFÔÀÏ>zP÷‹2ñh∞∏ï˛ Ëî‡OS|û{ïw~r·Òho ò‹&‰~ùº[:∆ùg+éû–=˘ü¢6æÎ¥[ç2Äw—"˛@^pyÛÚ&=ˆöœÙ· Å≥ç/®Àü*Ós2n√…ƒ}ºÓÿªIN1¥^ffÅÃëL?,˚5¬öΩWÊñ4É˝é‡˝iâôüﬁ'ˆ3‰¢±˝òÖHáúçØ°Ûí ¥„Wôÿ%”ç.∆bw	~ø Ã98µÈIgàµyS•õî;Qåœ@ÉÃTÕ!@ú“"gn«ÈAù≈„À±Àö{èÅê‡Q©˛$˝2≠˚G_f"ã‰ôˆ˝¿’YÆÁ3´ˇ3Õü≥&Tß≈)m¨˝ÿÂ–È⁄h[‘9SyÅy˝Á+◊π˝´E*¯«?T*rƒ?kb[ñÚ∑ﬁ2ˇL={	¯¥âÒ¸P&∂B^43£¿C)‘8”l+ÉlSÇW!ïŸ∞÷æ€ô√FúGU#=ÜÈS∏°h´dBOÒV©ã8U÷¢Ø9•ñÛQ($ﬁ6<x¶å~IOÅD;_˚5TëMQà∫MîÛ‡€≥öÍ¢R~
yëTäÿU=–|œr—Õ»à4”èêèFñÎÒı«∑–ÇÎ&~s/â°sTÜ¯ƒO§™LgK¶ˆ‡h≠™ñfÚ‚∏ôøâ ûÿF!“ÔÇ˛y˜}ä„áÔ´{QA z∫Ë°P¥)BòäbMáö ë˚¢DaJŸOíÌˇ#çÎUl|»ÉS∑y/\\•+æ“Ú<¢3Oö:ZD¸<éo	œKWàåã*≈çiO˜£«&¶ÏgÙk
ùıÎÙ£ËÃ˘ÇΩ(∂ÑõÚj[Sï'L[ )`_*…aVê—ì»i›$\™@˛A9Å÷ñÄÇ#x’¢∏ã
˘dÊöªI<¢\ßXÆ«˘}¸÷ÿj®T°Ôı⁄ôMâ∫TrS¥cÁÈ`©Cz8_0˜„i‰Ò…ŒËYÔ8m»üØ4]ßøÌaÕ≠≤Î„Ä√vEú4Ù‚v!©ÛÄwëò¬˙⁄Y…k∏ÑÛt∫O æQùO¥£—Á/x˝¸§6zùPvÒÑ…!HCôhLÎE©|(˙Ê∞t7√-ÊÕÀ≠à∑Ò:ó∆ˇAÉ∂ñºÙ;&~^AO
Ÿ1X‚>Hl*,πÙ©TRΩóåvë‹!ÁÂT"˘"Ê™ÈÉi{√ƒa 
√‹!õ–<°Ü~B ‰o∂Û∂âv≥Â¥◊˛¨XÒÈ=…£wÚo¡	∞Äø◊ç*.h©Â¿A¨Üo[(Ù–eL>∏X-Î∏65≥Ç¨â>Úˆ ÷rJ¢Gúl{3_3≈ä◊ìÍ ıÁVº"∏”J
S˜é¥óﬁﬁrÇækÌ)ıºö™tµÈ¥{ÂÂ∏ƒâ|S´A|áM$ıâ º∑XŸV8Ì3ƒ9¯{4Œ/uØ.“úÉP¢)e_hs#eı˙BïÎM´÷ØX/¿“Êóu∑xΩîTΩzÉ¬Óq…”‹ÇÓ—S^∑‹"≈‹Âı⁄U—lèá◊;/PÎ<[Áúu•é.ç∫û92-YπhñÎE__]PWtW·ÁÊµµMÎj?5µáxK]r«àÎˇ◊˛’◊˝‚ºBq—8¬[î≈ ∏?#ç>9FË6øîjÅÄÆy—DDV˜ﬁÚ7iŸP˙à{ëÓ˜,´ùïæ„íåúá <ˆë‘ï©øR√GÁùÎ∂Ê‚è3Dúe∫ô›ìx¥M4@°¿ä`ZUj\¶ÃìËâèï´t'rœèùg¬3SµCZæ…†Vì∂ ìjêbJ jï]óSÜIZ¶ÊÍã’zıL≠ñFIS[öë‘K¬ÂÊ^‚z{TV©X1⁄^ÿÿ˘r±ı¢kD√¢Ârÿ~…ê„”Î=ø¸˘ƒ·õÑ¸?‡Pê…ØìÍâ√+›°∆º’øú Q•>”4Ou7ÜiÎôlƒDAmß>~m≤u5	S[ÀS’FÃØ\ò≥U≥ı@„R4UC’Ò7˘∂x£âj®	FØ¸Fflk¨&ïΩ≤sΩÖX¶%ˆ‰]}±yˆ¨UØ]]y∫J]UI•.a)/}ÜáwûÓïœV”n?Ê≤È∂3Ü*ıÇlÎ†XMÎ,Ï¶íı	º2˛Wì∞ÖÏå6ØÇ1©›ÜJ#]V•Kf∫g:HfÌÄ{n~∏+ıp¿∆\AçııïÂÖ∆÷ÚÂµMÙ˙“∆Úˆ)BÃ‰›Á\_†∫8U.ˇcm5^Kı<‰¯Rn√}äAΩem”¥}LSŒ Baì‰Ì´ˇ©òÌ'9CFd}î≥Ó•ú≠Ukvö%Òc5µz¬}ôˆQÇ¬3 æ˚¶›Jß‰fùÎÃ™!ıe˚ïõ,RóåîìU¥#˚fV»ä"àÎä]µC\‘Ë˜]∂Xz]X:¥9 &ù¶.j L§_dEDïÎôâ 'AyÊ@6·Ë‹TgV2≥R_€Ü9l®Ô{;∞M´◊rw âhaÄ9A=d˜H%?ºIîÎ˚òÃ]L)Z¿ä≠Ω≠ÀW.U–õﬁ u≠=H¨ÎÉ2h—…ÍÖ‰ÅékºDX!Aô îøá∂aq·»åÌø„4mmaZ…5‰ïóËî„ˆ¥í´∑ÉÔpË;NªSº¶cá{¥fKÄJãK´ó'—∆“≈++ççI¥æ±¥∫|euû≤¥≤ºµ4Aa.8Cã∫¬#ı·‘æ°e7IPø≠É%Å›ÙÒ¬Çì·õ√APë,@fÆ’1àM‹I@*jëïÿˆnR&ﬁ4r€Çâ7KM<É(A"8!H‘ÿä± îÔ(Mn^*œJÈI™cƒEé,l«Œoy°mµ^hjõ…ãr∏]ñ™PÄ{ü.À1v~øèçb<∞¯Å§ØΩ∂¿˜ár*·¯<Œ˝lı∏6Âv£òx)6˜¸¢IÏ¿f™¶¥=è‡_à#gU¬íﬂEK∑N;ˇ6¨€ÍHW-äáΩj¬¢ëZ˝ñØœ&n“Eãx˙¸Q,P‡˜›cn¨Ù	C<Ê©≈ﬂÚ¸ "=¨Mô‘gã‘”∆∫≠9Ú∑ÔÌ&¸† \E"§mÀov–îB6™	ÃlS¸∞›rmj&*g√ïf9≈©=yﬁÊ‰¢≠‹Ÿî©qŸ‹B´R≤tâ¬eïÖ∞…âï;p L¢~«ÎŸD≈¢∑JE>Ù·™–ãŒ∑| äŒf<$¬0Ÿn=UœØBô∫åoπGÑME6_!ÜÁuîÿkPÒŒ£Ád˝™ﬂ$ÉÖoX∫èá†MEïiç<Ak| t•πdÎR∂lÑñ‰ùülnJ(¶0m$Ä;e^
€¨±V2~Ö{,ÈGo¨¨åù'Y^tölLÒÚ ƒöº%ÿÉ‘√˙Mª–˚¢Sœï•§¬«}∫‘u˚c$≥Ö±*<`5Ÿ˝}ñ„ˇ˛i¯'¬*!\Ÿå¡<›|–üë®ƒÔÿÎÈ¶ˆ–k˜¶bí
òà{
[”	á›ñQK3q≠⁄ãxU3˚è$ÀAKCò&ö§)âk5u≠D8´E∞öÁÒ˙g»cL√—/Ö¢eò°RÍUzÛÛ“£ç“°”ö…∏*DÆ'„x—Ú€ƒ¥Ææ?/‡.Ó[R]ãÒUODj#⁄Ø$if™“+Œ(«Ê@á®¡yı‘ˆ<(hÙß4¿ît	ı»ju?∂>Ò#6° é”ì≤G≠YóØˆ∑∂‘≈,K¯¨ö%|≤||<êzÛt›⁄æñIß≈¸mz˙ÏÃöKã∫€xu’uDS¶à˜>Ø*Ø“}+öW_¥wfÒuM·ªnº—XﬁZ^ªà6ñ^_^z-4÷ó[Kõ2or]∆ 4efYí$!RüPozz›æö	–æ∫êmdLΩûG/àÜ8ÅT—B‹7…|L!§:Ω¶;Ä≥¶b?È¢Ü?˙ë¢W2d Î(∫'Ê”›Î2.ŸlF∂√<íÈÚ‘ ,FAïÁwìıc2ÃÉ„QDY:∏ûæÿ±nX…«FÂèd% ì¥ÙΩÔe¶C¯
˜(ÚîT»ª‰Tœ/axUUv\Nç‚åÔcØ\;ï@-WúgÆÀ1†3¨,.Áû÷“ZV–âN:∆¢lÍLúñ0HFƒˇr˚√hÕ„l uâÓoâë32·‡äscñ~Ë=Ÿ8õ%ı©π,ó-ùv%rø&“Î¶	sóù–†◊~D"D‘r?∏¶¶∞±Ò˜Ï#)7…âC©œêsP2hm28ËÇßõûF∏Jvñ”∫Kw4çÑ”Ê(W%ìù»¬j„:Ã'›±Ü$äá€ar™Ê5Ÿ∞-WhMö\ØuR≠7Fß3ßÕŒdŒò5‹È•ÓÙÚ.X]°˛î◊`<l∆u∞"∑ø÷uA…∑a/÷CÍ[‡õ≤ÔêÕ#zE⁄Z€d]›GNkç;=r,∑\üD-∂55t	s¸]äQ !f®\Àü<ÎŸ…‡_¶ÊÇ=‘T∆Ef¢iu”1SE´N/»ŒÓˇ˙Lµ/?c˙Ú"·dg!Ûkj:2ø5/ô^äLêãßgh-Z{í	t}∫U´”ôR>Ú@FGráîÊº ÍÜ¡ºπD:rñ]üsf8≤f|Ωgöà£Aﬁ∏R!ßüÙò}ëêòÀ=Ωå˚£‚&*y_‹#~QÌ≠∫Cß:êG”uh4õv?$N	Xá‹	«ByœáÉı_Oy@¿πÀâ°˙ç∑˝6‰º8=
÷kÖIl—Îlmwòv´G†»q§_ PCõx•àÓ…V-pèóeœπçÆn>ºc§* Pe!øﬂx§|0k¬µÑ®Yûûêl ¥ÖDÎ}!’¡¥§ΩﬁêÍ`F“Å^Hu@µàdz="ÓÄiQ„}"nò÷*¢Lı
zI¥“SZø¿|˜™V6â›â‚YË-–Ö:ìä;°◊¨¿3ÏæÔ4ÒÆÉ˛⁄ÄÀŒv˙:˚Ôb~Î·}›Ï»úûÙ	z‹∆	ö∫>‘á‹‡Úz4Ω8z£†ƒö∂f™[æ”nc”OLÇES4Ç¨¿Ûº^ÉfÌEèÕ„zŸ%∆/ÛQoá`pÖŸ€–ÃÌò¨ÌòåÌòlÌòLmHñ62Ü6Rv6Bfv,V¶g'⁄]≠f6.%:-R7Øù—"}F8Øõÿ"=fßoﬁh~5jjéì.pPiWà!°÷¶g˛…xıŒ‘Uı7¶´â¯Ä†$ì∞“àk¸¡¨≤Jû–ÁË!kT'&‰·uÒJD¨PÀA
Â¬¬jÍÂÒd3l¯!àfp,&ê®Áún;˜&l˙Mæˆ†: Ωçu¬∞ÃMMëoÇ ††%Aõm›©~«Ωr≠>;[≠÷gj3Â≥≥≠÷Nu˙Ã©÷ŒÙ+ªÛÿˆ3^≤‹ê=0Ö°öjŒ™âYöÃ¢¬ÙNDäŸ#*&h\æΩc˚æÌØ{xi˜Ê«z^ôïﬂ‹†Jz˝Öÿ?¶iy+9tπÏEN¿dØb+eê{ı≈i{ªµ≥sMåqJ 
„cJt°’&^ÂW˚xãÙl¸† \ÆÙ‰ã‰>’˛4ù-]%Ne2∞XL Î;Ωâr∑‰ãl≠[Ú5«VäÇ;$œ◊Ur?'äg∏ˆ $G9STúÕÃO’”yŸ«ú¶d®q‘scäIhrõIŸ"&Œ¬–w∂†x\Êgéä¥Tå"JDrÄey™0M§~ÙÖ
<QFs⁄=’≥îYÿîW[Lìg&ôæÅMø+-}¶pàªc[ÔÏqà%Úz”∂t«R˝R“3>©ólß›	Ol^;§{ciÚôTl`ÈéìöX8π‡πûOÂâÂ¯h3ss¡=b∑j[¡¿ß∞g#dr≥?Ò¬‚NS¨wÈºA6ú`˛êVö9	EìI√	jó>®im™1b:zf˛5ì0ô˘«r‚ìö¸m8ç˝Ìù˙7,áŒ<E0˛ÏË·#{ÚËoÔ‘_r˙0ÒªÎ¡X¯Æ'5˝¸¯ìô|s—ıöÉÂh€iZ.jŸA”w˙BU—‚,µ∆3‚Àì¶#ˇÑ‰ËÑ¡lò´,&ÿ∫
Ÿ¥›¥9Ëv-lºN°Â^Ë{¥"´9ˇæ≈gN8‹≥ƒ	-◊i≤aÿ- ªH£úœ!ë[)Í2 €1JÅ$ﬂ—rô’ô<›E±tÒﬂˇa~¡ADﬁã∞Ôsë/Õóﬂ¯ê5å{”û£˝ºœOJ—ﬂ—|Néi›ä
¥|AîÉƒ∞~CvÓøp¯√ámÒd∞ìÜˇF∂˜óÙ˙êèx>é‰¯¡J¸%Åm$˝ÙŒ¯AæŒ†ûâ·ÜÃœy~!}L⁄§åW˛>Mû—Ô‘È°v™Ò^•\{à› ΩÄêÀ–˜≤π¥Ò˙Ú¬“&⁄X˙€+Kõ[Kãxü_æp·¬“∆“‚úëW≈XV‰!™d’˝"˙ΩÏ s ≈ ¬]2«~ A∞¡ë"4Ij=¢W]Tl
˘ñ€äM¬M—˚9ã7¶DL^y#¯˙„_ëG}˝ª_Ö»[´P3ÃúPBüÆV„yàsÁ…Å√∞É˜`ªCgÖUº*0/t¥I!åN‡µçÀ£<I*\∞∫Oóxz4®õë'¡◊1_ˆ0ˇƒÉ¯∂P‡™u√æ<ü.jÒÙ(1ofNúa û»ı8/˝LR‚ñ7ü.™FÙhP;''NÄÙÁL"#¨äña∆ëiı‰ãôGOó0ÛFÚÙ‘héNúPaà„iRÍ(C‘yEπ©lùúz,N
Ï®5„f¥∏[˙”éRùqg(<çXﬂ™∑R÷›m€?Æ”t€ÿI6ê∆±cH‹@Èú	∂\ó;V„ìÏ’⁄ﬂÒÎâ˚∑ü›e£îŒJ≈wŸdiWB%ZæX‘SØïœF˙É¯æ¯2∆x'Ê!◊ﬂDbª‰h’∫Áá;ûÎx¿/B/@-¿·ﬂ3`:‹ä‰Eì{}êºÓ4R}SvHÉ–x˙úFîoiP…“ √ó_Y8ƒzäoV»!´•s£»/,kL†ˇî˜–ò‚’	]Êé¬${…lCÅ˜ó€>ŒêßÉ)îÇ›˛Ht~Guæeà|ÖJ˚ÒJ«PóÑ∫Ú€∞y)"Äç2Ã”’Ñ°ìäŸN∑}≈wã÷ÃéFF≤≈q€É?U z…HÃm£>"1ïVüû–~;e» Áêôm‹iﬂx2»[¨Y◊pu´·:FÌj∏;¸{œÉ‚|¿.ÿ⁄*Y-Ù≤Ÿ¥\ªT∂˘Üí#W•j¡
¥ÜK§+≤ˇ£Z‰—“C¶˜éÎÌñ;N´Ö©D^Å]$@ÜÄıC¸2eßáhmÖπ ¶3H·x—P
∫˝—‹|öyO◊ÛÄ¶√ø≥™ó¢⁄Óo%ˆYr&ƒî˜1mﬁ∫I^∫0æBµ∏icÛ÷¨&w°NoÃ•⁄Éâíô!B%À2&∫“ÄïΩÊÄfóôË4±ﬁi]±åã&P¬;˙åU±«û.~»¥ 8!UÑÛ:#–F§¿†ÜW ˛r˚gøR≠Jim¬ÜØ9~ÿA∂“õÏN—“~Ôë4ˇ"ADä¸¡w†5,I¿˙˜¥hTú„IF gä‡ 0’@D…i…'Q÷^ CÙä±  1ª‘¿ü€µ”µ”◊RJœNM(†(Ëñ%&)!›%«W®ıî4ìò£I*x
ß“îUÃC)1*h;Ÿ5¨s,&•øà‹¨òq,Êx
L!ıE≠º‘jEUÅ3üêÊRH+à¥a©Í2F…zÏI´*Eïj ö;>õÀ Á≈æ§õ#fMn)8WáRƒï
∞Ω5è…Öò¡\Uä^ õ@&SH"ôJ©Hõ˙NN/ß¯b–‰;
äŒ≥ooÓíÍúﬂ¡≈)Î;—ı|ã.æéLxiôœw2Ìyîiÿ‹£K˙Ù≈1‰K0“Í;6º #8eΩˇñóƒdÁ?¡˚∑Lt¡å|'πû{…À(.¯¯ùåz^e¨ﬁâà®ëı7¬ÙùFÍ‚n5r◊≠=ÚˇÂﬁégÓ.Ô”V[˛Õ»AŒæZµ√é◊:ûüú'πÅØ<CG¸«é’”˜óã©y√˙Ãˇ◊CÈ‚Lô¶fÚ‹HÑ≤‘Gw¸$Ω‚Ès9ô˝
Xa√Ö·c¿≥*„r˘!“œ¨πbd¨’£¯ŒE¸ÀÆµW4œ1ƒ*r;ÛPyö'œ◊wI¯YΩ∞I~Hg'û˚L/√h†&`-qyq4´!úO&ÍØ∏}	;åÚØûÂÂ2óQ–ùã>ôü—Ÿ:Œ:m⁄=[—\H˙`˘2Eyø -√˙›ô≠Q£ã	R»içfÖ¢”¶‚
›˝œ§V¡ÀÍ–‚J†o‘˝“ƒI-€SP«Z]ßÁ‡ó°°‡®2©5<ò%©´ñ(®Ã´MVÃ.ÆJÕpüƒ± (Í`ë‚m¨:öæxl#s‹∏∆‚ÍÚj¨Øo\~Ω±Ç6ó∂†¿⁄&¿¸îx&ﬁ%Á‚ﬂ„gÛŸq˜{<«‡#^úîi[˘Yá|œVÉ3ıãHä|¡•†ñH5ÿr`ÈI] öYlû†¬h5eEÁ\k€v≥^ÇÑ™≠Ù<•©D8Á›ß›Cõ^”±√=¥aın¿í>"ÎD3EMúõ"è7M†U◊oÕ^ºˆß 3nÍ6…‘wÕî)çì«'Që ÀŸK]ˇ5∑¯+È7Iv>T7´$*cØ ,áEËîœö9nå•O≤2,+5v~√n\ÀG´6Ë@%t7Dˆ˛£C	º1°ØÌö;íıç•’Â+´cÁ◊}ª8%ÒHÓ3[8ÕgÔ]˙‰œNr<K+À[KcÁó\XLæÉ`> ≥ÅGr˚$üæ∏¥zyÏ¸¢›ı––'<˘6wﬂ·ì’’ue˜—rÔ#ezΩ]Tõ£x´∂"äDé(∫∏	˚ÕI'‘†Àº#œS·áøÊçN+Ï¸êƒ„Ëú¿cÚôíÃü‹–øDNì€@Zˇõ∏B^Ñ˛ÁúË«&	Ü˜ì[ àí†Î”ÅÎÖ≈èƒá†=T ¬:v˙AåµúÙ∆©Œ=ªEbRDﬂ-◊*+’a‚öº?/-V$ÃëëŸ≈‚BÙÃRœﬁÖªh]çJq•ñYS‘@v±Ø‚≈ºÜª›á"P‚wbµî*ëSä&}ItîTô¨≠∞Gü\¥©è)—Ó`ç¬ˆÁ«ÏJªÇh¡"§ê¢y¨f+î¢L‰"¬øN°∞	~"éö.—ëÃ«X$dvb=ﬁ≈ß™¬[»ù—{;€£;s…OpRº&b˚¡*8≥ËgS±√C"√‡5(«±∆˘uL¶qrl√Ñq–¢H‘OWJÚéâ¢Ã„ŸG·#N	¢≠^íΩˆ‘Ùô‚å£ )Œ:"á]u†;cjQ0äæPàπ¿â¢aı=ï‘åÙ^íkY¥t©tkY‰!ö çÎyîóivÃ-sZ(°™cçÃ¸†+÷˚I&_ÿ2Eò˚◊ﬂz&r F¿/∂7äÔä!˜Éi*EÕ$¢ızW≠∞É%cØÂuK‡´Á^˙DÈﬁ®h/Â5$sCó˙∂bd	VˇJ«†œTe≤f™ió§∞_®≤Wÿ,f^4¡RJÊ0ÂÁ¡D–C45™Ô94]0ÚâLõŸ&¯˙ﬂnÏÖ`Ç_¶ú“˜Òåﬂ!Ù=¡–&¥Ô~ƒ¡b…fÜµÈf.Í|ôûcH{VwdŒóÊû’ìz_»œà˚ÖåÂ8˛ó˘Tò∫ÿˇB¡Ç©≥ÓC∫“èb"8	/ ˇ  ˇˇÏ}ms«ô‡˜˚-Ÿ¡ò êî(Æ$")ôYä‚ëT\)ù  CÄAf Q√™çÎ≤ﬁTjÀuóSRÁKù‚=ŸÚ9ä£ÚVmÏ™´‰o‹Góˇ¿ÌO∏~˙m∫g∫{z@Ä¢dN*2Lø?o˝ºéGã"Íºü)QËÛZ*Q¯)øz:>Ûó£B¡ÏÓVªùÈPŒt(∫Á5◊°åH5Në
Âò‘„LÉ‚ˆúiP,!aM^ÅríÃÚLBﬂ?”üHèdö∏Ãk¨=‡3ı	Uüƒ7ËWR}2∑§&<õ
•?˚_´Da?ù5
õÕq)˛!±â±2Ö:ûÅ∑""1=ø i®¢NπbEŒÀ}¶aëü◊R√í:ÓWO’íZ¬À—πT—äwp¶r9Sπhü◊\Âr\2rät/„"'gJ∑ÁL	cQ¬§•±…kc^
?=SÀ–˜œ‘2“ìD3Y“k¨®ë.Ÿg™™™QÔËßI]sÏó\‘>©àQñHÅŒ5[Ÿ£Ái}'sÉdô‰˛†8ü)®ª“ô|4f˙“ﬁEÖ†∑‚7@~•f¶iS∫%ç{o7ùhE6°p†%⁄Î#ç$[Ä|:ÇêË≤îÖ{«UÀ»∆tÁîKì+…òìµ}óVi@÷·f£;	¥åIzª	7$^ßjüˇçó`w≈iW|û0$SﬁWk4¸˛Ä|5"@ÏÖ^≥çâpqò‚ÜAó0õπ≈Í¸=Ñøƒ™ãsUŒyÇæ◊h 'õ9]Á2rvüô Ã∏Ûõdñπ®Â5É˝b∑…ˇí”tÃï›íµ_n˘çÀÌ∞—ÒUû?G•·ù“ƒ*~Ä.`8ÔwÇÉdñÉ_À)∆
‚ôú(„#%<2àÆ∆˛4=—Í"ôÌS_©Ÿ<ÄK^ÌIåΩµzsm{g´∂≥v{møs{k≠Øm¸˝6ZY€Z]ﬁπΩıc¥Sªûh4‚–	Ê}HÅ|«´Cáh*j!‹ DSÈ‹m&[¡≈8#Ö™?LqtcíLHÊ+Âä/•≠g©bfÁb≤˙®#Ù¬^Å˚È¯ò\ıÄguºG~3ëmaV€ÖøwΩ¶ø÷„H|∑¸^˘Ω*¶3ÔÖ{uØP≠\û©\*œ\æ4S.ï¶Ôi§í+≠˘‘ùOEO¶	o¥öMΩ±Â :>á™ä˛Û˝Á˘Vtl†[˛^úWf+b¬zÀÎy{4€@:â¯cö+ë‹&/hú4‚i ﬁ«ø#ÓÔKeﬂ«<îöƒ„ß7j∂5ØŸææA¡:«ìDH˙g¯Ñ)πvÉ¯
>˘d„â∆˘HM®¯sûW o¿◊º÷‹cûﬁÂh˛ºø&+‘âÂÙ	~Ë(üA«ﬂ~@∂Õí8º‡tñÙJ<áﬂ?y*“–<éﬂ‘Ùô¸>F4˛ã86◊\Å/x õ|µ§˛˛+bë§‡Ò1·O‰Õ£¸Ée≈A|®ÁdŸÔÛÖΩ‡Ÿ,˛$÷u}xV`ò…◊$¸˛Õﬁdo:ªÄÒ#}jÓß[ˆ±Õ
h?Ü°»˙ã’|J^¯ODﬁ˝Å”^ØÄU¨ÙºnªÅ∂"å˛h3l70≠bVÙˆœ0F¶ØU⁄b©ÂzπQYIë™1©ÙãÛsç{rÆ' ï}L†9ôRæá”Ò⁄∞.9%Ø†+É†_ƒ„Çˇ*UêS™î∏Ûô≈4úÍ.:√êNë fEˇ!TÜ¢Ü&E”ﬁ,ErÏnsâ¸˚ÜDŸ—¿^äœC*©˘T¶)°3—Sh£s•5ó&r]• Ø åÇméAF^	:/‹ÜtH
Î ∆·»6‡1¿Ît√˜#¥Lîe¿Dæí∞íÑ|≈
v˝Q†RŒÏYòmÃ∂5Õ:∏Õ!÷Yuñ|T⁄	Kƒ˛˙Ç0∆˛çºÙπ†C_J	i>yÕi”œÒ˝êÙ~í<ÂµMˇ∆ôÕüÖ¢TÚ)›2∂sR¸%@bx6∞ËÒŒâ? Ø∞ÏAœ˘ü&|%£ªû¢fÙkêºjËïMó.>	¸§J=òàäVº\~‘úS*Ìÿãﬂ4πn|˚ªQmygÌG´hskmym„&Z›∏π∂±™]ßﬁíkRòefkã∫Kr:‹ŒﬁR≤fú^„Ã„™†"˛o_>
7c26£+ã=˝≠*mñb˚XMîWiïÈÿ2∞4JVV @˝5’ØPNÌú÷x∑~ˆØ”K∂$x≥ﬁ]LÏÃòﬁÅ,îx)x%&µJ d˘Éı∏Y°ÔÖæÇRñËüˇïç∂≠ÓˇgÌ^É( ıô÷…yIŸÿ»).îw:åfsÕ™FüêLÆ~€¥¸≈HSÏ◊1ﬂ:=†/ `Á˝[	¿ˇúaJäˇÚ >¨jD‡á¶/x‚”ç å €ªhè´ªê~N< ì8ôcDê#·Ö˘œ%ôÏƒÔöüâ˚Ô©C ≤ö1Ä¥}©(„i∆ÅÍ)˙Ñr*–Û\£õ,*”4üQ´›?5êìQéaM_*«◊Á”«sØ>ÛLµßéŸ‰FÅ„∏Èg¬Ò¸´«4«Ò©Ñb2µQ`ò7<É`õ48á}™”‹6~ôjU]È`>+·N¥Si˜⁄É∂◊πzxàò˚√*œ ¸oq¡‰ä√LëJõ
iS651◊«b∫2◊˙XzOm%?ªIÁ¨ôò3$ˇÖ§Ïóö¡AqµB–Nîçji¢sºFÓürõÂSÆY~J,>±äÙnùäï≤_ë´ƒó	+î]iJÙSÃ6Â+IYªkU”˚çd#ö[Ÿ¶ı)î6zJFõÊ?”—ŒôcLÆÃ∆∞ô˛]W|Dk@·∂øó∂ÿìFo•l%Gˇ:ÍSwßNXÃÿ@ç6∑:mÉÇÕ/î,‚òh.!ÈR7„ﬁ¥J[¯"G{rT: ﬂdÙ 270/e‚L∑5ÌS1GmÀ>∂¶>pµ!g8ÊfGGFÃ∂6∫[ÑòIYÏ¥ª>Ê	Ög|âvΩN‰Oœ–BAFœ!Ì˜‘ˆQëÚ0Í©"˚ƒ1ó∏ÅÔuhtX ”]Ê‘ø"9∫ÅÎ\yæyy±qOfâvWíD˘≠∑q©é=’ët)oÍ§}€{ËkH∫ëfì˜Öπõ`®ñîô‹ ¥\›lgø	vò˝ˆ†ÖÔ]2“°n–‘™gr∫ÕîÂÊ¢ÜN¶Â<õJâ?n··;Z	ZoÂﬂ≠T¿£?ÈU©WvcKE(ªTN€˝Ì’£cØÄ Ò`"eh2⁄¿u“ˇúY˙∑Ò çΩﬁlÍ∂Y e˚`•,[À˙†4…÷(∂±õ™I,uiƒLã#ª¶UYCJSkﬁ/Ç£E’hno˝!&íƒ8nqµ∏eöùÙÓua˝ïlæí‰ﬂlG˝éwp˛öÇ ÃcÌ¿Ï‡Ë†:íQü ÓÜÖ0û+∂y'[ÃÁD5˝B‘¡MñsÎnjø$ÅmåáAà0Ë"‘ÄxZﬂ†¯P™∞‚ÂW„ËÈ9„•éVK¿ƒØîwò—ÍÀõYÂ≤_÷î¸“‘ÿî È¸5"PFY±◊ÜXÓ¥é»èÍñ–„∞P n≤‡ûπßtwÍ'òãw	+S˜ﬁ.5»ÈÕΩÖ¨™…öZáÊE⁄©ÖÕÀ:≈w(0t‹|ü{|Ã≥ï}œ~à˜h|ál®•{ÃsÜ/Ú≥Ù˛âú≤-‹ÀâårüÍ^‚Uƒ«cã‰ö≥x_=^‰6N|oâünÜg÷Ô˘5˛œ(M≈´éQˇÃùî)i";äRü´¯ˇA“TÎ±{«©<"lû…≥x@õ}‡»ô)d+d3Ÿ±pghƒıÛ◊∂3¯2¿Ÿ)H’í„'VRˆâLß—~πê É|˘FπÏ/ÏÓﬁìdGV–Dg|õÌ5 êåÜQùøv∏ﬂÓa˘πwg¢¨	¬ˆ^ªwD1ìæπ•F±2óh≥ÑñÜFê-˝Éù ˇ–Ø^ÿ,‹”æò˚3(A"3Õıq ˙Ä∞8†÷kÌv–tpó0}¥uŸl≠ÏÒLáç†ﬂˆõkM&£.ΩÕû.öNΩ—n ì”_£m{Ê~5¬y≥c˙~Ø0Es
Ê{¡z^Ó)ÓÄÆÉƒÆå~|WVaTÈyBÄr(/XÛÃM∑Z£ÒgAÒ´@Ò©.#«U‡îQ˝**‘:‰ Ê`˙åP≤…èıµ·|AI^P˝.ÇÍk»¯ÅûÒÉ∏˘§˘ÅÛF€6Ê’ı>>”<õZLLÛÃ}åÖÊY„@ûSÛ,w9äÊôÄÇ»82Y›≥p±>ı∫Á['¶y¶⁄äìT;øä*ÊåàÔ,X¯Ó(õs™öœÕ©s=≠ÍÂ| Â3’2{ˆ1˜…RÉfÅ∆‚øˇèPkÀ+†®ùô∫òRÓèY/’0ìoÙy&ú»˚+™Ç∂DßûzÖƒôZ“‹¬Aæ6*æ °Ç¯(£_kU4,ÓL˝7?ÍhtØ*˘?”GigÒµ„≈4;xΩı—Ø≠6Z¨ÓåƒÕ_	uÙ\)3°¡ô>zB˙h/“∫L95“Jß£®§%pò¨>:^Ï©WH'“dLR#Ìñz„L;}äµ”ÚÑNßûvs(™È˚göÍWAS-ù≠ã™Z:⁄ÔºÆ⁄çˆ”Ø˘WQˇ3W ?IÁ©¸äEB≥<ìÜ¨¿ä~Z£‰~uT÷
_U•≈ôŒZ∫‘ìì|≠‘dEBM¡…ÎÎ¨ß‡k|=dugää∏˘iQ\ø“L‡Lsm÷Ûæ~<°®c
Ø∑ÚöØÒıd
≈3Æêh~ ’◊Ê\#kΩ(R1BÀò^·}D◊ÉGŒ•<|πîáŒ”∑_TËm|ÔuèíUèÎÂÕ7ûøˆÔO˛Î«ö™/X0.\˝§b1Ù&8´Ï—RŒÇ@Ûº‚:ü¢±∞<ﬂ<{V“ı&JK◊–õ´úAÏcI”˘äÛ{ëK∂ÆXå÷˝ãﬁÿŸˆ(uìh™Øﬂ–ã3‚Öå‚Í?OE~21E∏O_©ázå˙ÊŸg%uÈl¶⁄“Bàü⁄Sæ#ÚÔ§Ì˘ö;∏Ω∞e2˚‚õgÔKnÕºv–Ûô˝KäÄ±?—-ß˝ˇä‘Îâ´…'ÙπòmÚT>J™⁄x∆ì≤˝ØÑFÂ	/≈Ò;ƒ5)ø{˛?∞/Â=¥®bãÇOøÄ1ü˝BŸôﬂ¸qœ˘¥Ñ€‡°¯åüâ:K˙˙Qœ(hHòSM¢´mWªqcm}≠∂≥ä∂Vo¨nm’÷∑—¥Y˚ÒÌ;;€h}uÂÊÍ÷âU∑˝]?ƒCû‚vãRq;µÇ\äi8ƒ;´µº¿w◊vﬁAÀÎ´µ-T[_'5Ino8p	˜˙F˙öFòÀPJ J∏ Ï£AﬂP˜IÀIÛªÚñ9 ¥∏\©Ìc˘S:rU:™Ì··–¶ÓÇj∑◊—∫ﬂdÚ>¬•™K9-é5§	≤¢4Cp]ç#ìEœπæë;D¨‘Ú»
A∑€é"êCZ—Ù¯û≈Íú≤◊º±∏·üÒmı√Ä§FÖ|jÕ–€˜:(Ù:ƒ2cT“.K£”5…ZFa:+•§SBIH'I*∫á›¬T-Ù—A0DºXYÁ ECˆ›æáW=æ˚^H±ìlƒ¥≈®^r#HÙ6⁄iµa/¿- _Q18√ï?ƒ[µ˜z√>Íz˝>Ül∂á“ﬁ·ÊÉ <@`„ızxîŒ¡π©isÇK9'&üM‰íSº\∏k+@O“9n„)·≥/E˛`„_a™>x/&î3Ëá€∑7J±Õ`ÇÊL±®Æ„]±N+ë^q-Ò˛èi5^«®Ÿ{T¯~·£îÎ¬∑xˆæÛG®NLh™JH8†∞Ê7ÒŸÎ«÷ç¨MT©^(xIÓJ¢~w≤Lw‚ÓH tsm˛"ÙàFN∆mNBŸ•Ûíä!}≠p®¸_QM$?QØ9Ú;ªq·>Ú…Ç4e–‘ù–ãZ∫ƒÜ@3/SbÄOòÉ-JXΩªÁ¥é€'"0‰"Ù˝V@Ÿ\ILœ5‹/&Ú6;wÕ∆Ü¿Ω–ﬂ√a»æ$∑Q|^Ç2°YEîÊDòBB"QN¡ny˝%tàÓ>ñEí{KZ$Fp·Ô˙¸5Ç$®%}7óÅ´,!ö]˜6û
ÜH‡OQÊª§ÁU/Ï˘ÕÃ◊8ÈŸﬁÏ˚=∏C◊∫ˆëèˇÆ¢√£øK+ög·¶KÅ∑Ê«;äˆ}Ù†áÂ5»+»Dîj.~)a1d’k¥
¯wß ç'Ñˇ*ÒK¯8∫jTﬂ˜√eå≥-ïö|éı1çª√ûÌ=!wY£{&Ú≠}ˆÕ@OcXíb .¨É™≤ÈÂ4P_U` ˛ñR∆U÷”y›ÜkÈ<=qz÷ÈÕ’uÉ!!µSË≠´®b:dÿ¸ASãspU∫±µ∫:e<·Rrcç=ÎV√¶F7Z¬–±|™+ÿÆ«∏XtÄ¸`YVïQ)π∆∏Ñ≠ í2’ç$‹€∑cﬁê·›~âÉnn¨ãœpËéKCwLäßvÜGÍ:tx44bú◊~	\á’!‘˙¯RÙ–oZêC] ¯~…#–Œ˘‡ãöiì.›2ê≤9ô„∏°›"ˇæ™@◊ 8‹a†ÑÁÖz˛>⁄ˆû∆oRŸ¢Ñ/=¶‡	ÿØ©©i-vË‰n:6ñÒ}îıªÑÔPwËÔj®¡ÛYƒ∏€»‡öwÃi·∞"&ûf£ÑØÖ˛^Ëu’I©%ÈÁ¬⁄a©„˜ˆ-t¸ﬂÙß≈Ü'; Göe“F1Ù«Q¬∑ãÌq¶rNŸπRt˝BìúI”ìHï<&Å4÷Ö˘:¶ˆ€F-KçÖ6∆˚˚¨EÒÕC⁄˘—}sµ âˇoX¶XÜﬂ«Ñ}	„∆⁄F±Üo≈µn?±Ù;enwÆ“ˇ}•	ìÌxéÛ—¥eé˝V–√LmÃ÷,#˘]Ø›…|ã^–9˙‡◊◊± ﬂ8ÄKÖGK€vK‡+X˚∏o∫æÊπ\Ê°ÈÍÌáuº¿ŒR©î§	3©¿Œ==_Ç>f‘¯˛∏◊b:ﬁΩbGDì‚5õ®R˛û¨ D ¥1ü¿›4B¡.‚ÿ›îàÑé~$ñ"ËΩ⁄[iâ«±ë#5m‰D˛å¬Å⁄©M2w/‘Ó‹‰åD'ÅC∑Ú3—Cz4_Å€Ó… *Am˝ cD;¢k¡Â∏˝UÖ%∂¡MàrDÌ‰&ààÙQ√&íê˘Ûüõ:¨îÙ…?ew©ÈOã(€˘N]ß(ø,HÏAŸ]ªó-CH$ê∂πŒ)ŒUA|¯∂◊ç€éP]Ùñ9”ò•îù≠ó†àIá t{S_%ﬁ“l{√ˆÜÒ`Â)là·£¶≈6¢f √(˙Ô‹,u‚Î∂jSfË¡R4^d#¿ßL√æè •ä¢L<Vˇ≠û ‘0O#xŒf$3∑AÄÚ)¡B>Ω-”+≠Ö.ÿ(y˙ﬁmÿ«+8EÜhÿÌz·4,ï\≤Ÿ)gc‚¶lr$ä,yﬂìG∫Î·dˆñÉπ9≥6∆Ê»÷òöñ•Q1då˚Û¥ˇlkKÚ¥ˇláJÓl¯`{õIÙmÚ¡ˆvRíßÕ‘omÌì“¸9*˝ï‘Ôım±hM`€Ì -ËK áb+∆	ôŸ•÷tM'Ìñ	ÉºrU÷aSæá)•¢KøÿcäÑªø]ˇâﬂ`5M£Çåœ”Xli~°Äg?ÉBZ%nÿEo©™∆§´gòÜ«Ù<írwyUVjˆûØù®Mö#];e	˚“∏NG?{„¸¢èo˙BuåŸßö2≤¢≠ªjr»±ÑzÌ‹ﬁD7◊o_Ø≠£Ìù⁄Œ6⁄∫˝ÓË°√J·∑bù$ÖWÔæQˆ ıJŸÓ∏9/{⁄X„ÖS~°ïJeÆ“»Ëæ§∫ÚXÛÿ‹Ú3ù·ìÆFJB[ªìº--ÅìœÈë}(u rÎ«„Å®Èº≈9y˚≈rº}V˜d´Îqz˜∫∂∞OÛñp◊^}r Xq(Í#áΩ–Ô˝ÂD¸1$E °*ÁØI<´ÔÖÉﬁ ÃH
«Ï„˛^à¡Ó‘@æs0I‡ó]ﬂj‘Ek9 `ü‚Ééo¬áD˘ËW%Ñ2¨ÿˆ`/†Ìa=jÑÌ˛¿e˜O/HäÜ”Ç<_ƒâ0ÑX0t8Úï†”Ò¬Ìˆ^œÄ	Í>æzhÕ≥=‘JÕÈ‘
ì¿êõ>fƒ	t†É9Ë°‰'zÈ¯Ag3yab:⁄ÙÇ°ì–¥L"Uı®ëÿ√W7¥W°ì¡ç⁄æ◊√-ªNzù”ÅíßhNƒ¿∑ÀD0ˆË˝H|≤EÀéà1wﬂwÁÒso¬≥“éÍ√0¬ÙÀgﬁÒzòŒB=ﬁ(¸jbç^r2h≥^¬TÖ
Zp<v«œ>óI%ÿ^•Ò:µ%Tªπ∫±≥ç6W∑n‹ﬁ∫U€X^E+k[¯˜€[?vV4PB=+ˆSÕ`∏Ä¢Ó$2‰zêygùÇä–∏c˛-Âê='Ê¶IP∑Ç†=ö>xHì±ÍÓãﬁE»ê7|»äƒ;ú≤Ü;˝ó Ü˛U'ê…Ã¢â"<¬©ë[§*˙ç)Yã˙{ #ˇFC%Mñ3≤&K≤@Ú{:ƒà9˘´aF[WÎÖ?ﬁÁ3ˇYŸÁKrqÖßdﬁ,†1πz9ÅUúÅjÒ–N%]’ç˝ |Ôyp.ÌÛ9ûﬂDi˘%ﬂ¡hr≠ÁR®÷óRØqç·ØYê*Màe»[≈wŸê›ê˛hÖ˚C’ù*v≥[›ÚdO≈è£Ú¢É^ŸÇ©§Ó√ÉÃwÇõhõ¢V\î,q;¸õ~∑ΩG.‘•ÿ`«W∞áòﬂ†~? Ê⁄"å‚Gr•X	[‡xèöA£–¨œ†)Í45cˆ°sXBÇ∞1xÑÇ4‘å”eõ4≥üò¸HnsïÍ‹<^ Ï,ZÒwΩagÄ˙òÃ˙≠†DtsmÔE”‰P¶>±-Oàpús¶+W.ïÀ≈2y,>oÚ√Ïs˜ﬂ<4«—ÍAÛ`≠"”cÇsπ≈πO~¬†S#'‰8ß§\dWwÖtjCá˛Ln{Í£` [oe7±ÁÅáÜµ›ˇˆ˜ø§ƒ˝èÑÑ˛âQ√g†7ïQèXy)á œ^ê"Ú<:˛+5 £Ô"π¿'§Rü Hc√∑¿)óy™$1¯ö7˘Ä&@<«¬¥>Â›˛Yº˙!	ÒˇL∞‘8‚á<	¡Ød∆¸!Ò+ëBõôÅG‰Oﬂœ<Ω#‘ç*`Èñ87ª–(†P0K˚^ÿ+L›¿8@cv ÃIr	£6Ó’ÄX£Vô<~óŒ”<ﬁOr^ö›«»ÉﬁÇiî∫~·â9Ï»nªÁA\dNŒ≤ãØ$›[◊ÜU∆O≥yuºŸW€|XÁl=íé˝bY
…îÔ¢ˇ• KıÌñÍÀÚï¨ˇ≤áì¯ T⁄≠ñÑDD•ÉIÜ°7ä^∞z˝8«πxâÔ‰ï≠GœÙÌG#‚ÉnOZ9Ë1oh&Ií‘≈–J ZöAÉ4≠≤]V>"c∆&ªÇÊ0Ì\ALÎeÙ∂EÓKﬁÊ˙"'ªÈ$Æ–q5ñ?¿*…oJ¸ÑÇP8°ÜëÏà}‡t1ˇ ¬€Öñr¨–d∑ÉAçÛµ^fÄ=Í›ç$}èsvp[	˙ëÔ¥)–qÀ˜öˆw‡≠Pì-ZsO÷Âıã#≠%º•äë“πè©H,ÙU≥Ófl	†!	˝¡}ù∆=pÔœ+≥É÷q˙3%HøÓ5˜|4ãÒ˘°ﬂÁ ÁØ≠ıi|Å°é„Ï\1≤é£„∞Ω◊$çd‘éE6c&"_F∏éq§§•aÏãHÂ)ßôNÆ{¢I©=ƒR`ˇX◊Tk\øfëY*re ◊ynòbÑ/ ˆG\úÄLa£ñuêhÃ\¶˙&¡å¿C∑ ◊©‘n>r“àk3?|0¯ﬁù(n∆EÈ´8&í}´x£fã≠o±Ù∂ÜËÅÄÂ∂Ê£#ywÖokUNK·@[iˇÕ<ÕI–ú«±#ç∫Ve‡	ÂºA’Y¡–L‘∫ ƒ9ÕÛ]¸‡êøP;ËÙ’á6W›V≥¥Y⁄ô§uìó(3ƒ{[9X≤•d∂1YÉ´©:d≥Uvg¸Ô˘9ˆYÇÕ≥97=#o®¸òìâòäﬁAØ”Ó˘€>˜¬•¬‚fËG>¶¬4bÆ›k"‚ÚYı	u• Ç®Ñ7¥7hÔÇ0¸¶¿⁄∫4˛êh7eÇ<\ı∞òß´î%~íà€&S)ö4·Öh0˝T	_™–{üÔ!)B$ç$‹!S¢j±#»J˝®∂{ä.RdbΩÈzKïT\Çì5óƒ|ƒ,àúe‡ 4§åct |’£xÌêÿn‚WX=∞Çw%ä¸«[ëãYT3¢›pê~r†À—¥≠≤ 1ÊAiø≈»Eıìî*í#Ú˜A÷;¿ÈÇ°|îk“Œ[qX†Ç
!üàzzK’Ÿ¿c¶kŒÖßáÒtèÿ∆Ç'{ˇÁËMÈ´£˚Ód2õkÿv˝5e=Ã¨W§>õkK·"Qè^0ÿ ·H¡ í^LÂDÍõÜØ
ô⁄ˆ¶U‰óX◊&∂Â>T˛sÂ;F}„õÓrŸÏT6°kW—zMY$ºy´Ñ7Öñé?Ö*õÇÏ™÷F3¯„Ê*!®Ï‹($L9Ä—<Ø o<è’‹E6©U-œ36s◊n{ÿïzFS€Ø◊Ñ‹Æ¸KwÓÂé§„≈;ât'o„áÒ-X	=B?°’›&3èë)¡˘t¨É6éPÚ/c”©≤(±Áj›BJ“¡ù-©ò–9≤MpZ±JNùåPâú|$wd1!Es¬ÛIi˚âH35ˆÒÎ)(j©+ƒƒR∆TE˛:OÂAeu„‹á—µDF'Z|ä«S	9∏©èª”ë˙h‰l·ã÷ÄËN™7jEWêC„°XbπPSI©åÑ6Pú≈åπrBDrØÛ[`ÈÕq)8,^^0©˜6‹<ªÃ*Ωê}e9Øn¡^«GxÉ¡€ÌL√9∫Õs'πÇ9æ>∑ñ˜≈öâó%¸+T˘nÈx˛9n0Ÿ~-^.¨ê„‰º&ÄÑ•íEÛ/´*◊JÜ˜^-ÿå”Æ#∫ª&ı∫‘”«y:ÔâA˝Æ¨Ÿv2x≤›x2¿Ü4´∑¿,q—q◊0~ﬁS©ÖR≈\‚K9Ï`yI‘Kπ@*â¨l’ﬁ≠≠£⁄ùïµt}˝ˆÚﬂÉõÃgƒ∑Ó9˜yF>>’xLsiŸÂôî¶ôvÆ[5âÿÖ—£X≠[îÇ>XB´≤ÿÓú„X‡“¯ÀùXBè‘êÄd°.¢ºÖ‡•yà5ãÕˆ ¿J„oˇè‹ÎSÍ·˙˛¬ÀZ”íR‘ÛˇÖ°
î±:ä-à·ÿ·j˝®?í—»
·∆¯Dˆt|NêÑzyä2Uˇê(Ω≠‘ŒñKE˝€ˇ˝≤ÖO‚ÇXY*˙}.Ì÷S>Ü”_ ;©Ñ@h¬&≤èÁ9ßP&kbªÛÈ$[Ké3∂}/l¥T¥ò#hˇr”á;XÄÖäŸ**QÑ¿Õ˘BU«[0ËJª◊ö-ºTå»§Ã"Ü‰Äı<[ÅúìºT2∑%πêÆí◊iS3èƒ2&ñ+˜ÎüÊÁÒÔ∆~i‡Ö{>K∞da∂*35cïbE‘g¡TFv7h£%5ï}âI±°Ç’oMÒ2ÍáZXLÅ)Ï/Œõ6»pp„©
i7™S„9M¶§ÑP™ò‰tK⁄πÓÏ‰•vØ—6˝® æc«¬~"q⁄Ù¯˙ﬁ/±R§ÑÜ∂+K„Æ?hÕ¸”—tßÀ6E]4ß¢x„ös‰Z}4~∫ïj"òZ´Ø—∫Ò⁄¢*k‡Ωø‹I◊◊ELÍÂé..îQ∑éI¨5ÏX&…‘ç@ÆØ0¿óU /`|,e‘ü6À‘˙‰ô∫c≥n}Ü±ÉG÷D‹à≥]àO©˚∞ÕuúÜ≥ù#m=l—˙qê~ùËôè◊ìVo‚≠Ÿ˜‡V?⁄˜M[üªÈ~∫Ì¡¿≈9◊’±xõ$”;~˘\UÌ◊ÔL’ó·ûz®£–ƒEïf¥;]œœ˝RªôÂ˙Y…Â˙i“Áª¯„;8yBu{ï5ˇhm›ÚÅìNπ˙∑d∫‘hMŒ_˚¡·æÏ˝È0íã˙«nˇ‡&aÈâıÓy¨ò`Ù·π&”vt}egÇÎq9ˇ$ìU¿p>©a•?]R¬yÃÆï2%˘${çw€nv•C.qekî]Ìªva"a¶UôÚDÊXl1‡ˆ„∫EÙ◊íéÁZÄ˘Ö2¡tàv2™é…ÂÁe:˚2·2õD*¬îAX≈Òˆ¬f‹ºPÙ©l3\ååN‰d`’Ω÷mS	ÀKldIèEø¶kÃÏ⁄—…ÁêÔ√©¿é\VëÏﬂÆîCŒÓùWú≠+9-ä£ŸùÍ#ÎñàüTﬁm&T Ä¡~[ ZËhÑE1≤ª ìa¨;ÑÙÂ˝¢[ø$/b9BK§ué·r‰¨K¨{tµäŸÊöŒ®Eå˘X9c	‚YC˙,GΩ)©#ë˝Í”õ/∂T Œt ?Ó&ÎåÄ|˘ëE˚‚%*I‹‰ÚÂÚÏEM‹Ω∏QÛ/ÊÃ,FÚëm€ éqedgO∫B°z’hÜjw+0√gìnNë2©-äú©óH§B™@B]/| ı·"ƒÂ”$"Ã%	˘RP#Úin¡Ëks˙Ë›˜âê°+NN1NûPØ‰!y˘…›à§Sò›vÿ-‹gÓJå	”˙∆iv˝ˆ}KœÙc#§Ã0≈i)'èÁyÃÅhc°_„¢^'Fª‹)À≈¥Eœ¥I∫YörÀm$G&ﬂ”äï§¬êR.·_Ws…èor√<ÛxS∏viÈHEt.x$GØ£◊ù;—ìŒ4ÀYn⁄BÚ2<‡¨ﬁo∆Èk¿PÎ∞F]÷j++hcı]t´∂qß∂.;´›∏ΩE÷÷6nŒn÷~|ã‰—’eÃ’xúQ√’ú^I
Tr W0‚m∂ ∫√˘åtπWZÛfÀgè.0ˆõÛ2d8u]ŸÏµâ§U]îfoyΩ!…ü∆h5äÕJ2”1ÿÇ;◊ís“gêÎŸë\VÔúÙÑ{ävèâ∑–˚à&uÂüY¬≠_ÛÈÔ2Sm]ômÕÎ]Ü ⁄Zª»†GMr¬≈ƒ>¸R?ÙBÇMö‚“TXõÂË˘˚d£¿≤	6Ò´™Æ|EÃ6÷%®˘Oám»öµ€ˆ;ÕëÇΩ=+Y7W˙ÖGkáárÒá$˚
U}‘%X◊ﬂ∆ ∑Q¿≠¡+ÉÙr≈‚!≠p≠á_∆Å‰¿¨/[#\œ–‘~Çë∂‘ˆÕßÀ*µCbœΩ™¶Â\€æÕçC•®ﬂi„ÌLMﬂ-Î
TÀ›·N(.-InìÌÃeí°(∫K˝sµu.]äúÎ;πtãd}M·€–&PZùz¨P$>lÛK‘à}ã|∂t*j‚fΩÿ§Ì‘ó¯…ö_KkM`óqË±Ñ|Wú?©m.	ç˜lHñS¸MÿùòhÀ˛ñ1LT√õåj∞ìã
˛Lw›BåH>;ãhå•ôÜ∑Ñ¶Ã#IØRJË˙2ÖC«∑)∞„ù˛{,kB≤˜(ËySSÉn.CXi&˛8œrÚ«NMö˛ÃµF·∞„’˝é"vÛ´Ï=ê32˙#uÎ`≤≠Ì‚+dHØ®M˝˝+≥dòc˘”¬ÿÊB»¯ÆÒ≈›÷{–j{-?vôn∂2aÕÁg´ Ï(é∂˚"±M\—≈`X∑πﬁ.(Çrú[ñ»®)˜[≈M7ñBMÿõÛbq“»â)s;√≤≥ùHˆP‚=6nr
ÈbFÉFFœ‡ëˇt¢»])˚»ƒ»Ôÿî≠	∏∏ï·÷cÉ∆–∆Y–∞PNBCnXpTAYºRﬂëÌÊyï•üø¶~æ2KﬂŒŸ9Ω&}»›—Ü∑Á5•y©üGÏéÕK˙êª£≠Ä®‚â%æ»›·uØ˜ ÒbP®ââhc )`Âo+‰ÎÈ¨ŒØÃR:Âtaá "‡1KÉﬁìNü¯TÆ\zƒwÜEeÎ9Ãøì,ÀõÚ*Ò]Aî‰õß*IŸ-™?∞‘ƒ ≤Ç±x6¢Ö3ü∑™π•kÜ0îD¶çãe•–A*i=ÏÌEæ≥rÈÉÿﬁ`V∏õ≤Ÿa4◊V÷∂ØﬂŸ⁄^e!€hg´∂±]#Å‹Yq26SÉ%f4¶∆†5Ìóˇ¡˙¢™€≠˛’—ûƒ‡∑nØ¨Æ£ı’ïõ´[Ë∫±∂Q€X^„qÏk7—NÌz¢Õà#'Ï
á4√ƒéWß~›†ÈwﬁÎ¯Õ=H5ñrÛK·≥ ,J·@‹˜s◊k˙kÈ¿ÅƒGÿƒù€õËÊ˙ÌÎ5±€;µùm¥u˚]çƒ[»‘öÃ´y=¿qÖuˆ'∑›÷°É∫‚€∏ÃõÈ‘¥ÁΩ0à¢-ˇ!Ó05H	≥Üa√/¢aw’)yv—[®P/5ÇàhÀÀ”3¯ˇ¶Ó{˛‡lˇvÀA++Ü˚>*ó.öZëTY5π •jÆ÷ ÜZir?÷ô&‘5ÓÀk‰vˆÏUí˘Æ}8ñ[ﬁ†UÍzè
ÂôƒÍãöuÈ¬-—oIXµ+è™®≥ó“%ôúdI

ºk®íß∞Â^Ë5°(CqÎ!⁄É.$åhT ’2f∏|∏Tæ\ôKfè¿\ŸØŒÕÕ›∞ﬁ•J“Z+∆≤≤5è:÷™ò9Ç ”rúsûj‰E~‘#$0≥ñ©e>Uc	W-qòF\^&g•ç˚4ZŸ	˚¨uuuÅD"“ãdjeÖ\ÖiÚ©˚É÷ÉΩΩ¨≈€À∏&@nÇl[è$$∏ÂŸ∆øò·J Âπ8m¡û¶J¢Ò‰.⁄r£,- gı9èáú7Å	º@?Ç≈$ë’8”À_L9+ÂÍbfº§$©ﬁÓt +;M8vhôàÙ1{];#ßí¢‘ºoÀò≠∑ÀêOˆDÒsÓ?èáüD^BT`*\,oz‹»IÔ£Uñbú"®"ßMKô«µ8 5ƒÀ-Pv†¬<^¸	t%"%9‚Ç"?œkRöû R+ÒsI¿d˘˚¡}Ÿ°E:í`MõÁœ∞˘xÿ¨÷C¨òW~a4ßEﬁ •≈ïlË,úÙm}ß◊˜ı/<Ç‹Ê∞Õa÷‚«Ç°rÃ©!º¿ô·∆ô¨Õ∂iR¬Ìˆ^o‹¯È¸É{û≈õ[k+K‡†z_Ú©ñÍzmΩ∂±ºä÷◊∂wí"¶n›è:“5{é\≥5˚ï˙¶S)q˜Y¶'˙·ÌÎhucgÎ«té.>≥x|°Æ†8g£ô‘ Hœ(”Æı∫hÃúh8'∑âT$ŒÎMÀ$6±¥ﬁÒÃÙÕÍP3 îdé}ÃÛ	_‡≈=¡Ü≥«O^H©Ø@âÔ˘MKF√¡_ó%!¸åÊ îù|?¯Ê”/xıí
∫¢ú6˝kÚ Øi·ÁèÈÀ"·Ôy¡?#û˝˜â¸Ñ,i ¯ÀI
;CÀ}ÒÕ≥'3ö∆r¡oûCRì∫pöˆÚÇºGˇ¯]0/-Nùì…∑±œÒÿRR-Òˆ∞ÅπTd	◊∞Á´NUìÒ@XAàÅ)&ÊF P'ö3U≠Œù_tπÜAòkÂ‹¶ZN0ÍQLf7ñÂ◊s…Õú^äkÕ&Eˇu2úíO»Z@©9Ωæ,∑Çv√∑
è'gaﬁ&fp>≥†ã	ò”éÎÅíi;fñ`zndtÓòœºûÓ‡ƒùU ßœYÂ¸µb±≥çOµXÃv∫ ˙bÚ:K≥ü33mÒ·IÆ-hA“m±C&üªÚÅ—ÑøeèÅ¢ç	\†ÇÆß∑—˝º©˘·Ë>‘⁄àG=¬˚ˇ¿oNŸKΩgÌç9‡ …üƒHHPB\…√SBÑ
îLm,Œ&‡Z~gÖ`¿¨F°$‰„%:å§≈Àu!¶Ë6F"p⁄`èLÌ‘9:˘•Ω*/.·ÈoﬁBX⁄ %å∂[mΩˇ=}ÖÖçæ–Óp∑ó¥õp hÅÓÜùSπb^≥Ëù`Ä°>ù∞º«2^O °‡ªÌˆÄa°\qg≤∏Q‡ô4<h–ÀA4ò›Ù∫PêÈt ≥pTP'wjC%,Wú&(ÿ¬≤FÅZhw&Dàá∞¨÷ı)]1ùY|
¬mõ5y
ú *f¯z7ÉeÑ ÄÒË`› P ¢É#∏Úå$˜ÚBÂg¥”⁄‚h…®‚é°dìTÙ>¿´ôﬁm≤≥€à˛À `∫=ÃΩA]˝]©,Y^ÕH§ñ7˛ŒÆ›ﬂ≈ﬂ∞1Ã¸ª‰ﬂ}£q˘Ú‚B˘˜w3çæ
+"È[]ÚˆCΩ>7Xwˆ¿ÓQ’/&Ø©'€∂≥∫|{kÖ€ÿV÷∂7k;ÀÔÿÌ:f˝7|≠°ØZR≠ç€¬1¸Œ≠[µ≠Á∂ÙUG≥Ù©%JZPNyçÄŒµ‹ﬂVg}m7Ç≈≥wÀ•Ú¸=Rﬁ©IüÈÔp
,ñd¶ n˘Ló§+≈T√øÖeW<ôÌû◊k¥·Æ◊Ú˝A∂ÀÖ—äI~Õc…¥Æö[+_zdO®1Ôó,?ÿM*£±“g3%3.Œpc!Ù˜ú∑d’‹~!Á-¬øºO: ”&4£¶À∏¶õò”_Ö5AÅ7¸;KòÙÆE∏üOø7≠‘_˚U\]Fˇí‘^cyëDGœE%π‘‹_˘ö®mÛ´TïFx„π…∂IMkﬂ§?ç‰˙îQ\Á8%uGôd	ÖN»Úôéπ≈@kq`≤Z.íï[Í`Í@»]¬ÿñøL=ôÓ¬	FÍÜª<3OÁë'"¸&œ_Sº3GÓPÒ‰›O©€√ â˛bG%ëH@r%{’Øô√e’ÊÊh3ÕŸ≥g“0$ac¡\Fãú=◊‰Ï,15Z"¬ÃahËÿõfÌ°â-Àx	É€–Öômuu7ﬁV3më.≈âﬂıÎíì#Õ7}#gv)ª¯…H
*E˝à‰ÉìO·X¡{ÈQ"¿y:ä–√'?ñÏ—{…—º\±Ú„qP—	ÊÃµLÄN.Ëò‡2˙Õ˙˝ò!çÚCO£9d'/«6
Ä(™ß•/ƒ?e˘# z	W]eØò∞VÓ%“aª‘—U*È´&Ÿﬁ±¿»ïvwœ·5Ñ¢∞¡◊◊ıˆ¸;aáTk˝hivñ|ïÜ=∏KD-å¥›Ÿ~+≈ ¬‹¸BuÒ“|Â“•Ö‚¬‹ÂÀÛﬁ≈ÀMœØøR⁄U∏úzÉªÌ¡’FÙ/¸ÙÍb˘¬˛’Jµ<ÂñÿÎÆJ~Nm4•)•\ÂAíá„˚‡CqGMKmã˜\íª•ÚÕYÎ;’^ÔÇÆ´„&<7AOƒ¬1K¨≤ö[-ÀÄRx]&±'8ÕÇÁáÇÍ∏ù´˚"\K÷9“#ß$'O¬≠‘ N…¢e'8q[mƒ\uÔhÂ;ŒÅ”±ì^C<ˇXØò˛úwú¸¸’3ê]pÛØBa{/·(4Ò/˘Ay˚Ñfüïﬁ<C¬=:ÈÏÁπ*ÇÎø%∂“’ù⁄⁄˙Íäú≠ﬂæπ)O÷W"LFQÏjé¸ÈeÛÚ„”†•Ω≤LXÒKhùbøâ®Õã&3ÛhA_»ë`’Œé)æƒOb‘Ω&£8∏bR≈¯ÊìßT%˙[ÅÇ?ˇ#hRA˙7îôÜﬁﬂÒÈ_Q"n≈4)¢-•*·˜âÓ7yF£Mû”n>&o~)“◊?fjh2ﬂœy4Às¶ì)¶ƒu&f∫ËYè≠cµÎWOèn’¨W_%a6∑´ı¥™–\zYmƒ[zñ8Æé–Zxø∏:†∫\Ê©ïª˝Ëö\Ìd6ÇÅü°î6kkâKm?ÑS••Õmô	´v6èf÷ÄnŒŒ≈üDñÆı6˛î÷ÇR5gû]¸°≈°§ﬁŸùÖta-ﬂ‡®pπí%®1A4Ëlc‘πz∏xîJïÀôˆ™Í7€√ÆÉ`∫ƒ;âö"É8bSáñç\Í∞ÙÉ⁄=(‡’1ë)e§«≠»c>$c¶{qÍ?¿H¶Ç_‰R„i‘H3Iãõ≠äuÖ™t#›OBÈ¶πÕÄ◊Máãd±§%ı 8´86PòÊùG©îC°t˛ù∫0(8+íéßD*ªVPégó“Jˇ@É¥hŒ^‘LvPAN¥5?7çI2Ù»G Oè’{√¡iì∞ÒÛ¢É⁄ŒP2Êm#T=Á∆—9wò049¸4ÈsÈI@K"»Ì€)M	!¿'∂Ñ—¥n,«ë!Ω—I¿ãà˘f‘Æ˜®∏Oº4√aØqÉ¨6 ›ÍHñ%Ó•∑âÈ‰€¯oô‰ÂòÎë◊l¥vÆ4*™Üz—AØÅÚ‘ï+áN’∞|pQ4dÏ{=HP *M¢A´I‚’OÖ
ãl·…WÑıôåı6⁄Å7˜€¯~ŸÓAõAÁ yMPë◊ïˇOS™”§>(?≥sS9Jí¬∞ÓUAΩ}Ø=`ÀX	Ö&¸ø>É¶∏ò=5É«œSπìï;böôA¨ôa˚¬*t‚%©‡¬}p.GπN‘ ˆÔÇÜyãµø‰C¬É¬Õ @Ê⁄l…Kx…–oÓ’ﬁ†Í(	,‚uèø©√[NıJ’j•!’“ ,Öí°I©a µ‰⁄ àfç^äÄ6/ªfóµ∫i
î≤ªp2≤Ø»©kâ”…ﬁîÃ’¬¶M…¢7*˚«ñ=ëQºèie–¿0 ïO\Õ"nπ=Ä·§'πÄà*·&$úö\^*oKBÀxMh9ÙΩ¶6${ÊY˙©l3¡é∑7#¡!d,≈s¢'Ò6öZ≈ü•sôÇã9_˛÷*ıütn™m 'b“∞4Å7é¿R^À∞o˝À¯Æ„ı˚X†¿¥Ñ	ØÒ”aõ—·vÔ!…û”á¬Ü#®‡uøhs˝l{}≤ëπ≥¸H»ç^zXôŒ$»åﬂ2.“BæoTΩû¬Äˆ≠m.d2ã€»ùthSnöMSÀ´ZÓO˛Å/5Øû;'#˜Câµ˛H&¢´ÜªÕ#ÊK`uãoú|9KFëˆ‡ ÀWÛéaç£Ü3Rµ•ÄBc⁄Íbùn1ÖÔMOèâﬂm˜Æû∑‰ã¿7z¸ª-4_A„π7Ù{◊{À›ﬁàƒºÉ+ñù3g\ˇ	"„∏—Àèaª*¸GF+{Ø,ÂU‚isﬂC€}üƒÏa˛&®Ñ#û‡eèÇ∏Ÿ…E^üRËøÂ=Ç™≈*‹&p„u¶_],Ä≈‘:ù`ﬂo&ıŸK˜P–·NØ”∆r:^@{·[\ÔÅ‡•√äG@÷Úe‰|9•8±°QzêL¯√mÔ∑AèÈö?;o=î5W6MŒaÆﬂ"kƒw^oª…≠"\õR∆Ye_éì ˛ÓÂ“Ç˛∆M,{ãIrÀ4µÙ¬ÃÙ˜Õå¢5ˆ4Ú.›h˘çı¿íÑº∑Ç|k›ó∞è7ç—èuÌäÄ:}≠
 ¢1D+X—5=Î(ÿ$Æ°©ïµJ,C(	ìU/vP}„./êÀ}5UG"≥/“OªjsRs7ÁF5ƒ°0Ó63”∂vSt©≥S√_rŸúD~ÓQ6»öä€æEÓïÖ°Ÿª™äDÀŒ∫ÿ')1†ØŸ¬~Èbπƒàø*Õ±–√4√Ëî“…Leô©R¿π◊ ;˜/®◊ ƒ"É[.o8"P0_îYç¨÷∑R?1nıΩÚXô‰fùìì.-îı^$Æ)á\mr6ª‘2X´;fî»0êôDèªûrº€ri!QYàÛ9RY®>∑xqæöNËDˇL\:∏CQ¬í‹wv~ƒ·°á°®XÎj|Mñré”bIù∫M˛W\
™r¸‹Á)€»ùÕï⁄Œ*ZæΩ≤JÌ"[´‚≥ôO¢‰rÜ5-¢º‚∫?°O≤!M¥⁄Õ¶ﬂKd{oö'0‚%√¨tVô7 ≥4
åzxL;{ÃÏL‘∏«Ó2\,{ØÏe…ÒÊ¥L÷:UÒÕì…àäwÑﬂTΩi·¬Y•ÈÔ*úËµ÷ D⁄d"ØâØ˚Ç≈’hiæYÚùqπ6[¶E∆÷I›„1Ω0 ñ)àÆTméÏ‹8hÛ˝JõÉÒ∂∑‡ü.Óë;Ωà;Ân˝a'ÚÌ∞îÖìí/De†ÊAœÎ∂àß‰∂®Ûï∑dè2ÿáì~®0{·…◊ÕH3_CÃ∆⁄!01E|”◊&0s-ﬁ®`wü≥&ì*≤°XòóÕ^ˇ£%»ö∆≈b\d9Öo1,k@9µ>Á÷÷îYYA]¸5¥+•™J:ÿk•Æ≠ê…lhf ± jl®º:‡"ÎŸŸ†tΩê,Ì2Fn€FÌÇ™^ÒøÕY,Ï;‰…“Óáíå+úFÍ©bf;∞Ú†+óúb~^ô˘±\‚∞0‘ÃU.U3“ci=	¢!D$≥Çù	ãp!Mrá∏`ÃB;>Úqö:ÿŒ2&EÅÇnqtQ@L'ï}¿íuSiñM@æP§ã\’°u%”‚˝ÀóÙ@lgLÃ;˙∫}„ÜÀ⁄\C:F‹‡‰ô2ÿªïviK¯À≥≈ƒÀ¡m>ﬁ©Ÿ‰î∞Ç$òM,π∏œÀÕe8º#4ÀøÎRù
:áe> ±›vÉŸÖ(˝3Ëõ∞T®˛Äoëﬂ˛”ˇtäN:Œ¡rjÓiŒ—)˝ıp€	ˆˆ:‘«ç2F)Û&t:ºœÒ∑WÎKÅkó ÌLØ≈Ao∫z≈3öÕÙméç®“ƒ&EO,‘ga y¨%2ñÈæe∏L9ˆtﬂÂ‹r—@æó∞GÙ/¢MYÎQágßlaÆÂ«@úÑ¬ÆaèúBpéÖFÆêôThS4s£HÈ∂c>ûª°Ì÷2π¸›Å*<≈+rw#t‰*ÿÂÓáÎÕG•¯,ÊM˘n{ôJıÙTrh‰ıçuÛÒ„#£âí°◊=Vb~>IÖ2ÙıÂ§8"œH±5B|5–¯vè¯/§Tr.a5"∞Ü8ƒ√÷π¥r£ÉWHü ù"˝ZØS<M˙7éNcã$"—n£√Öd<6Zã∞‡ﬂ/$8õ>§j@¿¢´∆∫†™…¬òrßY>#Aö%jäˇl÷èÈ∆µ'@ ¸2gVh¥ºÅ.˛™*Çu¸¬2DùDA„Å?Ä"Q~x'Ï\=L|q§Æ}ÿzxM,ŒﬁÎÉˆnõ∞ÁâK8eFquˆ§(ÆJïX1.2ä^®sr“Z•÷˝›¡…~`ÅúòπX§¯¬"≈∏Iy∑R©xãTCµHÕÅ/û,≥	‚O‡RA$Œ§° Ó≤ïúìWèÇŒXN–/Ç√∆Ó ˇá)T[úºiÏ¶q=ÊámØx‡Éèes˚Ìbπl@xáyÈmNs‡¿©m”Ÿ ™RIt∞È·ïàiß%ÒO\M¶å»}À«Û"5üíœLÓl5%lÓf*a…úÇVò¬ÌÊ0j°ƒ1_ômUçÉ∫ÿ/=ıªcJ	Ã√Œ_#˘Îûí‘xüâ2/XπíRéeñ˚ê§ï?>!%Fû˝ìö étc¥Hd%•‘˝¢kÛ{ÕÎúNiC€LY^Ù¶5® LºÚxYµfÙ16€#t„V,˘e¥àîtUÑgs√ñ°/°t5e∞;M›áŸT·òOg¯Rç∂∆‹<T3∂‚Ôz√&ﬁ5LﬁÓè–…t»@ABDñCÒœ”«q•EŒç”gÓ÷Ç“±'ì÷˘}^Ow0Ák¶î™ˆ¶â[p. ß±ÊmÅ	ZïûmÓ˘Û◊˛˝…o˛E>Íõù†Óuêÿ4zÊ”œ*rËu:[˛^
E˘M2±£kÜÖœïQ†±°0∞ üáRΩ˛Ç]ê˝˜'ˇÂ)¢ç·47‰∆∫ﬁP!=“‘FÄxŒ©©#[âÑÏ˝1÷≥~åÊSOò⁄9Ë€csìŒIë;iæ pœ°˚,+\$/¡›èJ;p”’@^Ñºﬁ¡wóx¥{ª¡˘kﬂ˛ÁØˇﬂW¢5¸Å1äøíÛ£nˇ≠Äˆâ3¡Hå¡R·‡a~ˇKƒ=∏È0$ÇG˘ª%πipß˝Ê~*f≤Ñ¬QÍÖ»¨à\˘«cItπ˝•®}zßâ€`ƒd9ö—ò£a∏Ë ”€.¨Ôø√˙∂…«x}_©πïÒ_å≤ „Q®ÈVãv@·ÚJQ*2·YRπ6ÛK˚˜≈x
ö3Í3E¸`∆£R?hÎ.4•N©
›Ú@;◊Ûh!bà<]çA8àP_ÃõNÆ ì¢§“§%ó≥	–◊£‰|πÖ…`V^ÇSÜ1| ≥Ù*+–SŒ*X"¯‘Õ7ô`d/ÙΩ—q%ˆ£´áÛfàN"[ÃàËƒZèàP+æ‹iêªa4Éˆ}‘Ú˙‰ãGÆ^FsÌ°ﬂÖîôD'ﬁÛhl.Mßï–2DæÅ$æÿ<?NÉ˙
ü{Ωê√@‘˛m4fƒ%∫N‘Òf|<v¡Ì8¡K;Ç1Ê≈öCÌA≈õ$\–Ñ22Œª"æ]\(É!O
ˆP|Å5¥ îkÊ¯H·¨Üu$,8N%øÛñÙ&gï€Ú¬íf•7|ƒêË©+ïJƒµ!~MH^Â-ÒZØb:+«7˚hïw˘ÉG∂¿«aIÂ-Ô‡Àz†ì‰U⁄_:Æ“>ün>;Ùª[CÇ…qxˆbôì±ËÀ'¨j¶†¡˜¸ÇıûÄ∫îÃüìÚ‘ºéµTç‰º`
‘=˘åñ∑&<˘è‰ﬂ«‰öoT9˝/s˝u~sF,	Ü∫ÄE’ D
ùcò∆…’¨JzeXè„E»1ËCEÃiÊÊ°2‚DRöÉ¨0rcı Ms›ÔtT≤Gã&¢D0ŒTÌ—íÚÁó·ùDå(ª©gh—Ö¶-Ä¬Ú≤5—`ªëMßR–GÉ⁄wB˝aN1±9j√$xõÔ⁄VÒ.>5òπ0J–3Ëáƒî5¬†”©{°˝Hu F¸”…ä3 fgQ”«∞Ñ{Q48Ë¯êZ9¬ËÑwIŸ2êLå›t¸n÷‹ÛØÔ°´ƒ±é≈X≈ë|ª#∆/TÀSˆ$d%üö√ô"hj:1§õØe¬≈;ÁÿD[îYx^Úl›äÁ•¯y.ÔhLWîØ?˚u{ŸW“®“K˘∑ò®âR„*ˆ`2,˝FU∂OYäÚ:T≤jâ5ÄN=´ﬁÜ6I'ï4´sUOÎï∂(9Uâ∞2èDzÑ9Ÿ3"%y$ ïXföcæÀ#∑çπ∏_ÃÆGÍÊB@ã˜CØ?Beä√˚î>/™°°ZÊÄ9zÖﬁeûŒéÁÕCáG˜›‚$x+®ß«V ƒ`±÷å?åÀîdW7JCã4 éÄ≠‹n*ÃêLÈ≈6ñÔhº„I–Á}[£lÂá–‘•∫πnªm≥- 2◊æi≈HµÀhõF{∫D<ù7Ì7ˇÇ®euú[e©ï±Mˆ˙<y*‹˚˚j’qÜ“Ó˙ò"v˚¥^‘Hı^›äÀòı2“[ö ˇÑÚ"æ¶Òd<Qo∏w˛'(Dqnãécπ&∫~?…Ù?®éÂÿ≈}(9&&–e FkµÎé∏πª¶‚Å«‚<,ÀßŒ≥3Äyﬂn˘–]@Ãw6„bJøóeûJ•@ø˛ø1ïÁ$NSY´Mπ6KÓ»T»X¨x’˘§êë†F∫ö’:‡0=W∂¯9G-åTä¯Œ÷)Zr¬ì	Ω«sLvqIŒ®⁄n)’`*‘`∫†iH£µ¥≤ı+ª£ÓCHÑπ<s•@|ûí°›CP¨˛+´EµÊä+ﬁ⁄¬X—£%>åÅ‰f›1∆¸«!FH¢Jä–;ò¬`@q*msbÒ¸XcÂ~IæY\EUuﬂW˜aîQs∆tõqôh¸wvôh◊B‘≤úû¨?M$y'm#K#È‰ ;ßﬁÇ[å∂‘œ	˛2©!5≈°â˚¨[r≥ªßs˙ù—/
„H∞ é≤FÍ¡ê"Ët@ÕÉâŸ.f=íP«°˙ƒ|‰#Ú˜GËõgˇÒZ‘üâbœéÒÑz›~Œπ¯Nò≥€ÊŒ†sôI´œjm øF™K¢#√£eÎæ˝ËcTb|ﬁÜ{◊∂7¯;4áÖ∫Écdœ—˛î´Hˆ©ÀßƒÀiˇqnˇ%≠‡Õx˛ßL, 6ÜfÍI˚[Vï˚ˇ  ˇˇÏ]ms‹∆ë˛~øbL€·Ú¥Ô\Æ$)ﬂd3°DI;âU*	‹Ö∏∞vk`IäfXÂ\U‚ ◊}9«UIÍú‹Y± qló?8Œ›UÚWR˘w?·∫{f 0ÉóÂãlŸ[¿ÉôÈôûÓÈÓßˇˆ˚?}√eÇ¥$‰,ﬂ@‚£Ês)Épü…É¨·üìÏó˛òæSçH¢¡<Á⁄Q˘âîwÑ§ÛSŸ±um~ü…:Bo˛zﬂ{auqÒèAßÒ¥ÈP‘Ø˘	âL}¿≥≠?°G~‘‡g‘..qΩOO}¡_˝ònyOìì˝3˘KòZù€>àœ3~ÚzÚ∫ˇw¨¥≤ÛHﬂﬂŸº=cJ•~	y‘q·ÂÎ™{4Ïªñ¥˙˙ud\fÛ3”`QHÁ™i|Œòbû‰wÏv≠c– ÿ"€∑«À´®√	%≠n≈ÏG#◊ø∆eûwﬂﬂuÅ<•√Bô›«h∞±{–È›	˛ûêÓÕ¬˚¸{/ú»üV;˛·}√´!®*–áÙ"àB|¥£¶Ì»æØ~í€d·‡!CF∞|Ò◊Üòœ2=m˚eh¢Ç∏∏y6,~–•¨'Ãà0◊uÏ>Ãú;hÂ∞¥û.}”u}™hó2-I «mÂAıı‹ÓÕ˘œW4SøHâH∑q›∆>2•Iˇæ;<€Ë∆~®^#?ÿ¶ä.≠Õ8äÒDcﬂ∞vic;ùy÷€É å
ÏÔ˚ÓP3¢UÉU∆¯¶,”€Ûå‰‰/9ì
g˛°’?’Œg;ÉÅÛÂ˘¨¥%¸ªñ°∑]J›ßÀ&ëı	⁄Gx⁄TÉ@[DCù◊ •≥∞aŒtXc^ .nY˚ˆ°c˘π¬\Æ"®/FıGSTÁb9{˙6Ùå:™4j≥&m*;}∂Ÿ3*∂Âqí‰⁄Ô≈Wú1:πkÂøO˘X Ø˛"çïö4˜¢ù=fêoΩ‚Ç:≠^áã@dùD£Ù¥HU“<CÃ®\S7Frÿe˙jh~»„N#Tí¶íà<¢ûÏ"ôAq¢˚¿ﬂ<◊˜ô't—´ÕJéú!H
zÉ4©SÃ≤Ê<{uËºy`3±}#gY®◊‚,k^Ó,˝∑c˚>yüÄhÚéT7p3Y£~}ÊÁOÕ\9Âï©˜¿È√™[:D±Ë∞Í¯ºf‰î,ËıîgûÜ¨42KxÁØo=µi∫Í†õfgÃˆ–„∑œÂ@Ëª˚˚‹ˇÖ{Q˜M<Sgq=1o⁄ˇFO’®ÚtTi^ˆí(ªPnÂïhW·7“ÊÉ´·ëòha˙˙Ã◊ƒbï>cKY8`g–\◊3[†P44h»H˛0I˛ÏÛX„c‹Ñãß∆7P¨e\Æãïûz	Ìek∏ﬂ∑∫∂ﬂcªŒ¿f•Âù›ôâ9G9«à°≈‹ò!ÒkŒ5§MX∆lÕ¥Qpa,cƒ0‹úo˜Ü`é˙Ño„ˆiç∂1ˇùo€fÏG\”@˚WågPÁÕ÷µŸn«H(QYX+m˙üw·(ÁÛÏÑ›yhœ3ü8À›y∆≥Ó±S`;'ßf6£◊[≥:=Œ`“‡—Ò∞JØˆégDÓWÓ¬;K…ã‰]¬Æ∞Üπ6ß)Qr”îæπ˜Ü›WAãˆ€Ôö©˙Æ7.ï¨2€£æ€ªBkÖY5sß~7ì◊bŸ/±˚∏Â3Ç˚OYâ6ÓûŒ‹gÛlÍ6z¯û'{Ω`%⁄≥oª˚û5Í´Ñ¿éÑn€;† ò1_´S˘üˆ¢n€£{àë¢]vì™2àÌñ◊È±Ô±”øJ˘È‡«€≤Üv?üï{Ç#¢ñÅ?Ì˛~h—Ü„â,⁄y-z#∂Œå›‰òUyëûÃÜl≥ŸΩ›.ÒÈúÌÀ¿∫ƒÄÛ—˜áÿ6Fr¶wœíÛ·ãƒçå“K)ÙH‚°˘üp`Ä'2⁄¸]π5ÙßTI˚Kn®{BEHsﬁGo4sÚ’Úó 'eú4hˆ“«Ÿ'«ëπ…‚0s#Ú˙∂¥‡¯‡ Ñêi´ﬂO√X‹A_ÚöLeXv≥n7¢∂∆‡µ…n–êë∑Iq+”†@oR$ß‡˘·∂u˝'√-˙i(’/%£tﬁ7*£J+p^ƒÆ@SÒAΩ«^∏D∆]ˆLEõ0¥MLd#Eπ”á¡I˘>yDwÇıŒ'	«ŒgÿüI5œ*∞Ë¨	¥‘"s'Û°gdÒ˝Œ!⁄2R7äû˙|9∂˝±~∫4&ö.XûÌM0eDE
Õò¨gûë	ˆÈ∑p“¸X6'Œ˚$Gæ«˝Áû˙‹π∏ÍßOs≤’Ê»ΩGÆ÷æ[x—	™SlŸ…~ÏôGJÁ~ßRìãoK˚àÖ˜—≈ÙÁ‰.yÒÎëyËÛÏÜ”∆ úo÷X≠˘é≤ËˆW)©˜G˜B ∆¨qwñÅ˜¿wzø8” ãÇEnﬂp).å—†ènÔ≈|ﬁfuaV˙$¸ë;≤:Œ¯Fà…©-gûÈ ñç◊po	®fD-⁄∂x∂ﬂ[9Rfh$8fêÆCq»"‰	ïhFõyÓ<Fè §PÇ3è	‹ÂOzqï„Eô{§+t@;3q÷5Œ&&C≠sC‘°¨∆∂m‡πiz§‡Pö,∆/muö¿ã>∫oO{´lÒ0}VZqá]á√‘È<Cøñî!Ü'jîÿo±Äõ'≤“‹Ht<À{r–çúŒÚM}A{”Ñ˚˘}á*pá&’Fz†æ=Q\àt-z:ÌÒz‹ k wå£@RÊXo,M_ä ˙ﬂ¢û9îTt[0«Ω
‹∆√ò _∑1°ú=æE˘g”CÑcﬁîÅ€vFë9πQÅ˝M}®˝Èk9˙@„äéΩw»<ÚŒ◊aÏ	]p¢ë'ı»Ô∆]Ü-0€†@∆EtIx.Œ6PyN•ÁLFﬁFÇé*Mì)MÑ∏qÀﬁ;,…C3_Íÿe¡˚V˜n≈‡oè?LOıw Ï>L†Ù «≈˙Rzë∆ﬂR≤	&GjØ“ ®øV<´“XâHoGÛ(E–L)kÁ–ˆaenús»◊ŸÇX“ ñF£˛±4dFó(P˛ﬂW»k@N›E»∞”∆/Î@P|)BÑ7Ü®5Ipπ‹’§Áôﬁ”Aî™s6#73VID™5YÖàCÏÎò.(°<Å’›‰ÇffÒY Ï1±Ç™¸œ∂w¨ËiBE¯l>ˆÆ@AãŒ⁄;fÎ[ÃÍvAKÙÀÅcB3¡Ë eÈ\fÆ«FhP‹FÚE–˛µz∆Öâ¶æ$«ÄœÂ˙ ”‚ﬁ ?E˚
ã’jUﬂK…π=Í”‰ˆ0œÓ1SÄUi∂1◊¨g¨J…µ®L^d)JüßöëR–kÈÂ–CÍwÏè‡?[FT cU‚°Z+0¢C¢h-E¡)˙·Yî∑]⁄ÿF^0ﬂ	¸£≤æÖ^ÀıüÕåì»ÚÉ=>{®Ÿ«`}â—◊î¥j⁄Åâéla◊§:äF¡nu\w°÷kÂÒÿ“‡Ä6[Z– t‹sÙÓ∏ŸÓúŒú'Ω©•SÁ?1ôπÄ˘†Â˝ +§{}N‡Û)Í≈ù(\MΩ:|8ƒi¬©sltéöp
Ì‹M√Ç€∞¢ÈırÿÍzY48®¶|Â∫=≈R‹]S˘Œ*æÔ ïÙñD¢r"Oä
ö6˚∑ÚFVª[»¡ï™+º\Èÿ¯
√elØ≤YóF!·/õ€ã÷éñ%ÇìLP√}ÈF? Ôzüu¨º
∫‰ÿÊ—=∆û-÷h——n‚Ω#ÜR¶ë5æ[f∞ÃGπ¨û#ûAËvñÍÍ¿ñu§tFº∑T¬B9≠j¨§Ÿ!Ö¡€òÅıÖ¡ì3Ÿq!Yê¨vU4IõÈ±ëX8Î"ã,ÁÖl:ûÈTòƒÁOà∫Ëçû·ö˙¢ÿ8¶’lÍF–Èó´"ÖÇ‚]r°fûzJfóÖ»;s÷. .õ-P|»Aÿì` ú“êEÈ©5—(Ò®`«ßb·»ljvá‰Ëé¯¿Û}ÎV]Ö Õì^|2OHÙS/|Ò‰ÑÅt6ÓÕc|É‡Wß/ﬁU?'0£ÕìÉ†4Å.HiÉY≤å¯;ôZ˘lπ£ÉæÂâÆ˘!A¯"ôﬁìàÑ˝W˙Ù1áÍz6≈Î\±RKÕ#íöIâG	µñ"$Qrç†Âàú∫ πRN}É•IÍr9ëX◊["l¸¢%I|qô÷¨s#/[Çƒ¶|s≈«xÂù´ı≥Í2•b«Q°$j◊ÎA£@û#Ú<eQ.¿¡É˙pi-ºK°z=5ô*ç˛VäT⁄ãö‘[ñO]ˆù¶v—•§ä•©ÛÀñi—ºjc¶év@´÷ùjµaxöH^⁄ì…äØ–/B…D™'3íÂ≥^Fı#)M(∑P†Ê®Ç|P}∏”»P‹º!“¸∫Ûµ$‚≥î∞6á◊RçÕY÷ã	Ñ∑Ê∆¢˛ı¸◊Ö≈XEt˝¶„Ië6”"∂∞*PhPöI#Ìõ,¨sÙAw√=≤ΩPzÙÊÍ¨Ó“ˆn–éxè8#ıUgÿÈÄRUzÍ˚ìüòûó€‹Tà8ô∞$g,ãÅ£… ê HTå8ô¨$◊ÁÖ∏˛Ñœ{˚¢ o≤H.ß"(•M⁄Aõ∏î"‚ûY◊èIa*Ã‹—¸…¸ñÅ“Æ`¯Éã ÇØ√"0·	‰óeÇ™åLR∫Ωåúéqè•àx∆VÌ±ÂÙaˆÀåõ( Ñ·∂˙î‘öêyÑŸ6yaò∑-ƒØy°‡3>ô†‡S¿R{GDò˘)LƒS≈Õ≥©|*#√hÅîZAs†ÈÜíÓe≤\Z'¡≤#ìèzv˛¿°ÏÃ>7ﬁÄ≤ÛAßõú!-t7"P¡ô)Å
8Œ…ÂárÚ\ÃéT∆@q4ü/LüàúÕ≥iŸ´)IÒc¿/óO+¯ÕvÛ'AsN·$)—ß"ôÛOä\4"68“#®ªHË`ú™ÄËËﬂû¿DoG¬üí)3uô3É`©3∆ÇÂà–«Rπ≥bxiŸèDÖò„û„ár‡òtK‹_`ËôCπ=›\`™Æ¿T´AbëëDâcKGjêµﬂëØC∑|À'7¥üyvßAµÛœÂOÔ"Òo&ƒˆg}6#ı'ú∆z®xö∆9°‚EA`|˛Ÿl˙›Ïüí˘/.Y
«#ùEL9=Ï)rMÙG‹wdy@u≥≤¿IíÙÂYkÔ4öı–,C)—§ Ü+Ë.}k‰ÁÒ∆=€Í¶dÏ≈∂x@oBè DÙJ∑∂fô6∆=U°k°£l{Í∆˙,∑A#sΩálÀsq.‘∆Ω¢ÂM› h“ù–i≤Á#^≠õt≤ÇñÂ∆€‹ô¨Ñ®~≤∂Ì∂ÁA%V›ÅÂL‘tbY¸(‚@Tã `)˘iV°ªó∆
2ÜÒ¬≤h•`ñc·1|Ïﬁ©WÎ≥È&*˝öîôæx!≠˛ÚÇ‹˛pΩ≈ì´ßjJ’+j≠”Â≈,X9zå›vŸ¿wzïﬂM¢}?Äk–œpΩowpH°‡ü-Q\
ö˝˛gÓHœSmÕT3çl„T^ñ5éÚ‰S»O∆fËöb†·n‚,ãx…¸˚í+?`mÇ_RÂ©<{êGºÈ9∆–Ìíxuƒ5¸.i∑˜‘œK≤æÒúƒ”ˆ∞ÚÍŒt9≥’¸£Õt”~‰èÈrÆg@íÖ'Ü†M9ùúœ`“x®YÈ:˚Nﬁ¡™z0∂?Ê€–€›¬èaÕy¥!g9ƒ·Á4õHPÖ€µ%Ù3ÓÃ·v¿?∏ﬁìÔéDßã~‹¬v›A	T©©≥≠î™CN⁄∏4÷ÍCæŸµƒùÔ±ıù≠‘Ωòhµª:©ÄÂuò …µ±÷®ÍR¸JÃv20¶Æò∫¡…0 Ì“¿?¸)·#oäœY]5≥A∞›·KÕµ‹Ót‰J´ﬂ|çæ*cg0˛y5èüi§°Öz4Gv^h7qk¶ª1„<G√ÂÓ4çk\ƒñ^6°¿/t>Æ∑Zh‹†â	f˝4Ò¸@†Æ·dúŒ€yªñØÿ9YB(ïOÃr®l¸wı√ó^«ﬂ¿Ò’=˜àíX≠µÁóp…Ø›#®G≈$Ds∂¿ö0FÍ3˘ﬂ6œX}_kú÷}
ıÑƒ„xÕÍãÓêW»õ2sµRK„"Õ™,aëï≠æÙ-Dß¿◊œBÉv	JPä\ô©¬-d‹/5Àl∫ûÆ~»F_ œK±N’(4§xüÍk⁄ì˛à˙ÆÎQπ56€Æßa«ÍK®%QQ/Ú¢†»vÒ}‹Œ§B⁄ı¸œÍ∆ªëÓΩö¸à˛Fß0´[ÍÅê“C»4<¿	»{‚Ãá3†»˝¸Uœ«¸d›g≠˚ÂUW}o—7ùÊûŒÿ-úIÈó‹¢k¯…íπí{∏ifaùë9å˜–• ê∞E£ÉæØè‹7NTvWäR Ãﬂﬂ˛ÜX§3
	:)˛çÒè∆ıCˇ)L¡BÙÀ≤ÍÔá2î‹ú]jï=~N‡BÙJ•÷E…¢˘dNây,5’í¶Ï§ZvaY<ADQ”∏∫Ec(Øˆ¨á÷t!›Î¢Ä–˝;ëh¶àlÔÒlOîg'<?-≥˚Ïê∑?1üÛu=]Ÿ?∫~âc/ÖDÅﬁ˙ú‘vÈ5à˝∏“Û‹Å]p,L˚q¶]â|⁄g∫Ω3öÃñ4Iü⁄˛CJ‰Íkº∞]˚–È–F‰Ï94ÄØ⁄˛CÃUc÷¶u7-ªûÎtŸ*]”ﬁ‚¿Ää¸|∂ùí4_©âvIR=’ccvV≥åNæ∞ÂÍú∑N
Ò4{]ÙnAéæ@™&Ù)«Ñ€cjû;πÛ”Tw~hÚ*ª>öTh¶……È⁄”ÂÙÅπÒ≤©Ú]›“tuƒ#jfã¿√fÿ^1àá∏·xvgÏmŸu,Ô·”ﬂ|„˚Yìo»´F‡∏≠2Ïze}Âœ9,ÿ—ÂY±í[îœ∞mKIÃ¢¢€ÚŒ.¯Â[ªW⁄E…ñ„ÆLãsÜ"ëj~J·Íj4∑õs»≈ÂúP˜‚MHj=â'U§>‹ãì}bØæµ¥˝Éµ›ı€/cË›*€›^Z˘ûm≠ˇhmcáÌ.-´L¯÷ÿ<·Æ`ª÷wDVacvIç8≥pK˛∏Â<≤˚˛-khÌ€^¨æ=∆[¸≈ìŒÅáŒJ¡S;‚ó8Ì›·éuhÔœqLsºñxt≈’°’è¡ù÷áK›Å3\XNÒƒ
é’ªk&j™é]Í%ø€ÿ\"Ω≤˛Ú+wmï≠º≤¥Àñ_›››ºÕJÀÓìlÉ™`ºÉÀv0‡¥À˙ŒCõ≠Ù`ìÁœúˆŸ-€˜1€1ﬁÖßKàÓ–›(Ωa·¿âˇ¡˜[¿!"ú-È}öLV±$©]öÓ√Aßgç’Ï»Xdã6îEúUmm´AΩp—;œ7ÏV›zpó:úÕÓ]k>hﬂE®—;œ∑Î÷‹ÉDXèÙ}¨π#‚èÚsœza24ñ# ˝F¡(Ê<πµ…‡†;ı{≠—£{M¸„ÌÔY•Ÿ´ÂÎ◊ÀÕŸπrΩ⁄öõπıy¥<h	Å/Në9g$ttú\Åûoº„ [}q6ı€8“cÛ4±pHùŒËZ©'z\∆?+;ä¯ÈzuéâWÏC çO`é‰a´ﬁ&tlﬂ—”\Ô¿Å˙∞m#"Ê¡0dü9Ëπ≈”e,ˇ!jïâVÓìøË≤˚hq™ŒÍàwÄˇßTó≈kÑíèπªáô‘‘6JU:ƒ•Y•-≥,1Å`°k?A”‘ßª8Ö≠≠fVbÖXãr^tåﬁù˚åK9>{hèË5$•Q(˙‚ıCœ∆Ÿ-N8}H|+JÁ˘J{DÀ≥-|ìg†•]VB_+r‰ıfW2≈}H˘≥ıpˇ$√kOËÅ[¨’`ÕklÖÕ°[4µõlv·ª5◊·{∑—Ê⁄¯Á*k]gs◊·pÉµÆ≤vø¸ˆ,´›¨6X´NWËàØ@—ÚZJh¡	|”‡õﬁHw@‡¯˚˙îÆ º„8ZïÓwﬁŸw¸êS¶ùrÀÜ3¥ﬂÄë	g†ÊŒ·j8äbC∞ñÉ 	i7¥∞,säñˆle›öl@Ú8MµÙ$ZŒ]«ŒöaO¬—’6k!Ÿ‡õz|è@œºä¥n√?†‡U¢%=qµÖG¯€’zU–é‡ëøÜG¸h}]^k5YªÖ≈;‡àﬁJw@-x≠íÙL£%6}qÍ¿Îóû◊O“ôÿ#µåﬁ¿)#;V©·89YÃ˚Õô$ÊNUzÙä√˝ƒz≤áa´õCD &ƒ≈üu›1É5Å)\D…ΩÑUÑhÉ-Â⁄JÑÈ¯ ÒÚërA3‹‘™7ÎW≠ªö@âò∞"÷˜˛~|1à◊ÛàÏ∏$^Œ‚Uã]¢„°ÑîóÂxh∑ö€ßﬁ⁄≥∫ ÊÓ3ûªDtWÉ7{Î(±áë,$*D	BtQE@º—2}O(IL›–i†â"eÙ]JÈ¢Ú-sÅÿu’d	FN°Ò‘çÁíı2‰îÿÆÎˆ«Œ®∆#ÆbƒàâÂAœ	\„ÒÆu´æ◊®ﬂ≠ÅÃπ”´Î°@Û*Ûl"3Z¡h!æ·$ëãÑI©Çêºä‚WDÑóUJ'vQœs{»–%{Ç)î^ïÇ›!tô≠CQØ„a9I%L‰cÉí8∏É©U«ê\Ã1wªágnäËTK|–oy√∞Ÿ@8Ò{Óë(o•o[^\Û’´cRÓ~∆&|r0ú‰Ó‚¬¿≈T·1˛ÏÅ"VÅäQÊAZNæâô¨‹÷Hﬁf?r∆YE%ï≈ùXøî»Â+±uì¶î?◊‚ì¡Lôóùú=C‚<4¶zΩÃ∞·sÂºù%ûl–sırÆŒ+¯∂NÖå!°–
&á@•lã-d`íKÊ˘∆sÑ⁄i˝ﬁ\]Í¶ÕŸÎÂˆ5¸WØ6@7lñm]2¨∑\Xt·[IÄ•4#!πöÕÈ>%£¢\Õ(˛ ¨©M\Rõ⁄≈EI ôË™πÏ©dô√$ƒ8”ÌÓÙªﬂ]¬‹1jq'£ù∫¥ã@\ÿÃf&⁄Ël¬Æ@mån—˚˚Ø~˚ø_˝+€˘ÒŒÓ⁄-∂Ω∂≥∂ÀV6oﬂ\ﬂæµ¥ªé¡íΩYmUí∞é‘.wÂ“ˆ¿°u¯¶¨‡`.iÿxß|ÛÏô<bÁØA.Õ/y¸O ÚOÖ°<=Ûì…ìøí!@üQ@?£Kü—9øÈGÑ˜ï)Òf‘xè^Û/+bí| ®*âÇÇÀ°ä¸Fd¬ƒOî–$*!W·Ícô7Ò)ΩÙ◊¸‰ÙÀÅBÁø‚ø§›æÂ§è¿•U≤,ÜRSå:—tçÕ∫H5e›'¶ë™–WÔPﬂ#≠˛¬s/Ò˛°é§˚î˙ÒcB¢Âë_ˇ<ƒÅ`>ë?|H4{õ'ÁQà°ÈÌ HÏÈ≥˚)˝}‰â˙\éﬁ†ﬂ1Y c|+∆ßΩM†7¢ÒAÚYÿ¿«Ê0 µù âñju”ÿåu¿˙üuÒ‡¯QCÙ)µMì„IÚ<…mRÛ‘b&™§èé∫}ﬂ]Œ .™õ14-˛R?èí¸	+≠X ßˆìf4sÏ˙9≈~dw@Ç#:ps≈RáC#án√_$x≈~<lÁ»$f§I∆:x‘˙sÑg¸¥F’Úv ⁄îõÄöyªPaUâU.se°ñ–sí 	;µùÉNz\jOπT%º2æÂv≠æ¥]}ß+€éwLiÚÏw∫RQ]È‰æ‡ﬁiCòü,‘xBêãú∫{!WêÒ’qÄ¢„Û4≠3ºDÈÎAÌªVÔÜj_·I‘[^%AlN[ﬁº,OQ#+ûÎ€±¬Ëí()V–È}µÁ/JΩ√ÑÈZ˝.«¶,◊’‰"Æ°H>öh%TNîX@™é2sâ0U}Åú*¬“B∫à¢‰Öd9@›zì‰µ∫ëgBéXXÈŸùá+é◊È€Mç^k “1#,¸àñ¶#Ô©;z%YÎÚSPsnHåKΩˆ(Œ⁄û»Kòi°oﬂﬁ‹]øπæBö6lmn≠m”ªπ¥æ±∂™uÕªtù\◊,(U_∑P:.O›»πV„' “@¿ùìÓeà•zﬁwÓ'˘üN4óúNàÁÿ¬Ë‘–JÎÅMªößdùZ5Y•‘x¢ZÑÀ†∂
Ò•?z±ˇ∑§úΩ«˜†Hæ/m˛ øVv·B}‘íXπ	„¨è&úıJÁØÉî#‹wé#˛	J?vóﬂ£H9Â˜@V’πÚ˚ãQTMË·£Ã{rvGP|‹ô€háCìhãß.n	£\ãe'/â˘——+¥Ó›ÅSqjŒ6≈[ˇZ]kò„õ›˙}ä˜˚ø˛Ì]∂ÍvË<∏>ÙG–aÆ«j|·1çœèiÒ]æªl§˝^Ó;}â#∏Ù:ë}&65Ü[-∑ÕØÑAÚz8∞8WM:	ãªvêÎi”à∂—ì£"ì¡Âi∆ñë‹Å†-Üπb£¥(Dàï˚ç1Îê¡d†'
ƒƒï>0 ¢—'r?#%±xÜ•ÂG™§Ös	—J«tík.!‚`õxÕY«ZòäË5«>"√l˙S<A+©Çqï¨ı®/”Ä]´ˆrËˆqv√<¿Hó®|Àvàß∑í|û YW˛ZP„®r-1ú¡~r∞zù≈(;MÆ*Vº8•ôæ|™$EñH+xù-º2\JÃu8∂úaT˜5˘∏&ÏzTsë	G'SIW yvüÜyÈj#ÕŸ”∆ùl≈E9OOªˆ˛Ã}îUP‹&0eg+øËs˛•QâíΩËâ¿û-x–Ò‚‘˜˘•x”sDøÃ∆&»
tßÎU2ﬂM|l∆u«;•ƒdÕÒÏJu5ì‘Í<ŒJ¯¨nπ √Øæ;Úl ¿¡≥ïYèJıÍ\ô—’
´Wõs3i{W∏§	t‹ËÊ{>nL∑2˘∑hAoÔ·∆gÓÎõõ∑X%ìsö÷˝h5„	¥T∑ùœ8â$Äfê»Ûv˙‚˘,ƒ)ÑuÜ•ñ Îïgî¨Wrê5u©8™å∏Á\¥¡q7¯b§DI1±Æ◊ü•Óﬂﬁ‹]⁄]cˇ˘ÂôYgÓæ+œj˜˝∑°˚.m‘%˘ì—„§R rj)®81ˇHc,˚‹S£'˘’‘ˇ'dî¶}⁄C»+ªkO√P5Ëlı+àÊ&É »®ÁÉ l˘µ¬ÖC%˙ƒ≥°ŸﬁÕæka0ø≥$ãﬁî<˝áˇ  ˇˇ Uã