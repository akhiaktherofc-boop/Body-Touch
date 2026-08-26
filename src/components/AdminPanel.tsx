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
  emergencyNotice = 'à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸à§‡à¦° à¦¨à§à¦¯à§‚à¦¨à¦¤à¦® à§§ à¦˜à¦£à§à¦Ÿà¦¾ à¦ªà§‚à¦°à§à¦¬à§‡ à¦¬à§à¦•à¦¿à¦‚ à¦¦à¦¿à¦¬à§‡à¦¨à¥¤ à¦¸à¦¾à¦ªà§‹à¦°à§à¦Ÿà§‡ à¦•à¦¥à¦¾ à¦¨à¦¾ à¦¬à¦²à§‡ à¦•à§à¦¯à¦¾à¦® à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦¬à§à¦•à¦¿à¦‚ à¦¦à¦¿à¦¬à§‡à¦¨ à¦¨à¦¾',
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
      setSmtpSaveError('à¦‡à¦®à§‡à¦‡à¦² à¦à¦¬à¦‚ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦…à¦¬à¦¶à§à¦¯à¦‡ à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à¦¤à§‡ à¦¹à¦¬à§‡! (Email and Password are required.)');
      return;
    }
    if (useSeparateOtpSmtp && (!smtpOtpUser.trim() || !smtpOtpPass.trim())) {
      setSmtpSaveError('à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦“à¦Ÿà¦¿à¦ªà¦¿ à¦à¦° à¦œà¦¨à§à¦¯ à¦†à¦²à¦¾à¦¦à¦¾ à¦œà¦¿à¦®à§‡à¦‡à¦² à¦…à¦ªà¦¶à¦¨à¦Ÿà¦¿ à¦šà¦¾à¦²à§ à¦°à¦¾à¦–à¦²à§‡ à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦‡à¦‰à¦œà¦¾à¦° à¦‡à¦®à§‡à¦‡à¦² à¦à¦¬à¦‚ à¦…à§à¦¯à¦¾à¦ª à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦…à¦¬à¦¶à§à¦¯à¦‡ à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à¦¤à§‡ à¦¹à¦¬à§‡! (Verification OTP Email and Password are required.)');
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
      setSmtpSaveError(e.message || 'à¦¸à§‡à¦­ à¦•à¦°à¦¤à§‡ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤');
    }
  };

  const handleSaveFirebaseConfig = () => {
    setFbStatusMessage(null);
    if (!fbApiKey.trim() || !fbProjectId.trim() || !fbAppId.trim()) {
      setFbStatusMessage('âŒ API Key, Project ID, and App ID are required keys! (à¦…à¦¬à¦¶à§à¦¯à¦‡ à¦ªà§‚à¦°à¦£ à¦•à¦°à¦¤à§‡ à¦¹à¦¬à§‡)');
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
        setFbStatusMessage('âœ… Firebase configuration saved and loaded! (à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦•à§à¦²à¦¾à¦‰à¦¡ à¦¡à§‡à¦Ÿà¦¾à¦¬à§‡à¦œà§‡ à¦¯à§à¦•à§à¦¤ à¦¹à§Ÿà§‡à¦›à§‡)');
      } else {
        setFbStatusMessage('âš ï¸ Config saved to local memory, but real-time validation failed. Please verify credentials!');
      }
    } catch (e: any) {
      setFbStatusMessage(`âŒ Error: ${e.message || 'Failed to initialize Firebase'}`);
    }
  };

  const handleClearFirebaseConfig = () => {
    if (window.confirm('à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¸à¦¤à§à¦¯à¦¿à¦‡ à¦•à§à¦²à¦¾à¦‰à¦¡ à¦¡à§‡à¦Ÿà¦¾à¦¬à§‡à¦œ à¦•à¦¾à¦¨à§‡à¦•à¦¶à¦¨ à¦®à§à¦›à§‡ à¦«à§‡à¦²à§‡ à¦…à¦«à¦²à¦¾à¦‡à¦¨/à¦¹à§‹à¦¸à§à¦Ÿà¦¿à¦‚à¦—à¦¾à¦° à¦²à§‹à¦•à¦¾à¦² à¦®à§‡à¦®à§‹à¦°à¦¿ à¦®à§‹à¦¡à§‡ à¦«à¦¿à¦°à§‡ à¦¯à§‡à¦¤à§‡ à¦šà¦¾à¦¨?')) {
      localStorage.removeItem('bodytouch_firebase_config');
      setFbApiKey('');
      setFbAuthDomain('');
      setFbProjectId('');
      setFbStorageBucket('');
      setFbMessagingSenderId('');
      setFbAppId('');
      setFbStatusMessage('âš ï¸ Disconnected: Cloud sync disabled. Offline/Local memory mode is now active.');
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
      alert("à¦¬à¦¾à¦§à§à¦¯à¦¤à¦¾à¦®à§‚à¦²à¦•: à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¬à¦¾ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦°à§‡à¦° à¦à¦•à¦Ÿà¦¿ à¦¸à¦ à¦¿à¦• à¦›à¦¬à¦¿à¦° à¦²à¦¿à¦™à§à¦• (Photo URL) à¦¦à¦¿à¦¨à¥¤");
      return;
    }
    if (!slideTitle.trim()) {
      alert("à¦¬à¦¾à¦§à§à¦¯à¦¤à¦¾à¦®à§‚à¦²à¦•: à¦¸à§à¦²à¦¾à¦‡à¦¡à§‡à¦° à¦ªà§à¦°à¦§à¦¾à¦¨ à¦²à§‡à¦–à¦¾ à¦¬à¦¾ à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦² (Title) à¦¦à¦¿à¦¨à¥¤");
      return;
    }

    try {
      setSliderStatusMsg('à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œà§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦¹à¦šà§à¦›à§‡...');
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
      setSliderStatusMsg('à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¤à¦¥à§à¦¯à¦Ÿà¦¿ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œà§‡ à¦¸à§‡à¦­ à¦¹à§Ÿà§‡à¦›à§‡!');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¸à§‡à¦­ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡: ' + err.message);
      setSliderStatusMsg('');
    }
  };

  const handleDeleteSlide = async (idToDelete: string | number) => {
    const confirmDelete = window.confirm("à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤à¦­à¦¾à¦¬à§‡ à¦à¦‡ à¦›à¦¬à¦¿à¦° à¦¸à§à¦²à¦¾à¦‡à¦¡à¦Ÿà¦¿ à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦•à¦°à¦¤à§‡ à¦šà¦¾à¦¨?");
    if (!confirmDelete) return;

    try {
      setSliderStatusMsg('à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦¹à¦šà§à¦›à§‡...');
      const updatedSlides = sliderSlides.filter(s => s.id !== idToDelete);
      await setDoc(doc(db, 'settings', 'hero_slides'), { slides: updatedSlides }, { merge: true });
      setSliderStatusMsg('à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à§à¦²à¦¾à¦‡à¦¡à¦Ÿà¦¿ à¦¸à¦°à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡!');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('à¦¡à¦¿à¦²à¦¿à¦Ÿ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à§Ÿà§‡à¦›à§‡: ' + err.message);
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
        text: "âœ… à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦ªà§‚à¦°à§à¦¬à§‡à¦° à¦¸à¦•à¦² à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ (users), à¦¬à§à¦•à¦¿à¦‚ à¦¹à¦¿à¦¸à§à¦Ÿà§à¦°à¦¿ (bookings), à¦Ÿà§à¦°à¦¾à¦¨à¦œà§‡à¦•à¦¶à¦¨ à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦°à§‡à¦•à¦°à§à¦¡ (payments), à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦°à§‡à¦œà¦¿à¦¸à§à¦Ÿà¦¾à¦°à§à¦¡ à¦®à¦¡à§‡à¦² (companions), à¦°à¦¿à¦­à¦¿à¦‰à¦œ (reviews), à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦à¦¬à¦‚ à¦‡à¦®à§‡à¦‡à¦² à¦²à¦— à¦à¦•à¦¦à¦® à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¹à§Ÿà§‡à¦›à§‡! à¦…à§à¦¯à¦¾à¦ªà¦Ÿà¦¿ à¦à¦–à¦¨ à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£ à¦¨à¦¤à§à¦¨ (Fresh Launch) à¦…à¦¬à¦¸à§à¦¥à¦¾à§Ÿ à¦°à§Ÿà§‡à¦›à§‡à¥¤"
      });
    } catch (err: any) {
      console.error(err);
      setResetModalMessage({
        type: 'error',
        text: "âŒ à¦¡à¦¾à¦Ÿà¦¾ à¦•à§à¦²à¦¿à§Ÿà¦¾à¦° à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤"
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
        alert("à¦²à§‹à¦—à§‹ à¦•à§à¦°à¦ª à¦•à¦°à¦¾à¦° à¦ªà§à¦°à¦•à§à¦°à¦¿à§Ÿà¦¾ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦…à¦¨à§à¦¯ à¦›à¦¬à¦¿ à¦¦à¦¿à§Ÿà§‡ à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤");
      } finally {
        setIsProcessingCrop(false);
      }
    };
    img.onerror = () => {
      setIsProcessingCrop(false);
      alert("à¦›à¦¬à¦¿ à¦¥à§‡à¦•à§‡ à¦‡à¦®à§‡à¦œ à¦¡à¦¾à¦Ÿà¦¾ à¦°à¦¿à¦¡ à¦•à¦°à¦¤à§‡ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à§Ÿà§‡à¦›à§‡à¥¤");
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
      setAuthError('à¦—à§à¦—à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à§¨-à¦¸à§à¦Ÿà§‡à¦ª à¦¨à¦¿à¦°à¦¾à¦ªà¦¤à§à¦¤à¦¾ à¦¯à¦¾à¦šà¦¾à¦‡à¦•à¦°à¦£à§‡ à¦¬à§à¦¯à¦°à§à¦¥à¦¤à¦¾ à¦¤à§ˆà¦°à¦¿ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦«à¦¾à§Ÿà¦¾à¦°à¦¸à§à¦Ÿà§‹à¦° à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¸à¦‚à¦¯à§‹à¦— à¦šà§‡à¦• à¦•à¦°à§à¦¨à¥¤');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = totpInputCode.trim();

    if (!cleanCode) {
      setAuthError('à§¬ à¦¸à¦‚à¦–à§à¦¯à¦¾à¦° à¦…à¦¥à§‡à¦¨à¦Ÿà¦¿à¦•à§‡à¦¶à¦¨ à¦•à§‹à¦¡à¦Ÿà¦¿ à¦ªà§à¦°à¦¬à§‡à¦¶ à¦•à¦°à¦¾à¦¨à¥¤');
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
        setAuthError('à¦­à§à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦•à§‹à¦¡! à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦—à§à¦—à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦…à§à¦¯à¦¾à¦ªà§‡à¦° à¦¸à¦¾à¦¥à§‡ à¦Ÿà¦¾à¦‡à¦® à¦šà§‡à¦• à¦•à¦°à§‡ à¦¸à¦ à¦¿à¦• à§¬ à¦¸à¦‚à¦–à§à¦¯à¦¾à¦° à¦¡à¦¾à¦‡à¦¨à¦¾à¦®à¦¿à¦• à¦•à§‹à¦¡ à¦²à¦¿à¦–à§à¦¨à¥¤');
      }
    } catch (err: any) {
      console.error('[TOTP Setup Sync Error]', err);
      setAuthError('à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦¸à¦¿à¦™à§à¦• à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPActive = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = useBackupCode ? backupInputCode.trim() : totpInputCode.trim();

    if (!cleanCode) {
      setAuthError(useBackupCode ? 'à§® à¦¸à¦‚à¦–à§à¦¯à¦¾à¦° à¦“à§Ÿà¦¾à¦¨-à¦Ÿà¦¾à¦‡à¦® à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡ à¦ªà§à¦°à¦¬à§‡à¦¶ à¦•à¦°à¦¾à¦¨à¥¤' : 'à§¬ à¦¸à¦‚à¦–à§à¦¯à¦¾à¦° à¦•à§‹à¦¡ à¦ªà§à¦°à¦¬à§‡à¦¶ à¦•à¦°à¦¾à¦¨à¥¤');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      if (useBackupCode) {
        const cleanBackup = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanBackup.length !== 8) {
          setAuthError('à¦­à§à¦² à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡ à¦«à¦°à¦®à§à¦¯à¦¾à¦Ÿ! à¦•à§‹à¦¡à¦Ÿà¦¿ à¦…à¦¬à¦¶à§à¦¯à¦‡ à§® à¦¸à¦‚à¦–à§à¦¯à¦¾à¦° à¦¬à¦¾ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡à¥¤');
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
          alert('âœ… à¦‡à¦®à¦¾à¦°à§à¦œà§‡à¦¨à§à¦¸à¦¿ à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¯à¦¾à¦šà¦¾à¦‡ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!');
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
            alert('âœ… à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¯à¦¾à¦šà¦¾à¦‡ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡! à¦•à§‹à¦¡à¦Ÿà¦¿ à¦“à§Ÿà¦¾à¦¨-à¦Ÿà¦¾à¦‡à¦® à¦›à¦¿à¦² à¦à¦¬à¦‚ à¦à¦–à¦¨ à¦à¦Ÿà¦¿ à¦¸à§à¦¥à¦¾à§Ÿà§€à¦­à¦¾à¦¬à§‡ à¦¬à¦¾à¦¤à¦¿à¦² à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤');
            return;
          }
        }
        setAuthError('à¦­à§à¦² à¦¬à¦¾ à¦…à¦¬à§à¦¯à¦¬à¦¹à§ƒà¦¤ à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡! à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦•à¦ªà¦¿ à¦•à¦°à¦¾ à¦¸à¦ à¦¿à¦• à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡à¦Ÿà¦¿ à¦ªà§à¦°à¦¬à§‡à¦¶ à¦•à¦°à¦¾à¦¨à¥¤');
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
        setAuthError('à¦­à§à¦² à§¨-à¦¸à§à¦Ÿà§‡à¦ª à¦¨à¦¿à¦°à¦¾à¦ªà¦¤à§à¦¤à¦¾ à¦•à§‹à¦¡! à¦—à§à¦—à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦…à§à¦¯à¦¾à¦ªà§‡ à¦¦à§‡à¦–à¦¾à¦¨à§‹ à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ à¦¸à¦šà¦² à¦•à§‹à¦¡à¦Ÿà¦¿ à¦¸à¦ à¦¿à¦•à¦­à¦¾à¦¬à§‡ à¦Ÿà¦¾à¦‡à¦ª à¦•à¦°à§à¦¨à¥¤');
      }
    } catch (err: any) {
      console.error('[TOTP Validation Error]', err);
      setAuthError('à¦•à§‹à¦¡ à¦¯à¦¾à¦šà¦¾à¦‡à¦•à¦°à¦£à§‡ à¦¸à¦¾à¦®à§Ÿà¦¿à¦• à¦¤à§à¦°à§à¦Ÿà¦¿ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤');
    } finally {
      setIsSending(false);
    }
  };
  const handleCustomEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (!normalizedEmail) {
      setAuthError('à¦¦à§Ÿà¦¾ à¦•à¦°à§‡ à¦à¦•à¦Ÿà¦¿ à¦¸à¦ à¦¿à¦• à¦‡à¦®à§‡à¦² à¦…à§à¦¯à¦¾à¦¡à§à¦°à§‡à¦¸ à¦²à¦¿à¦–à§à¦¨à¥¤');
      return;
    }
    if (!cleanPassword) {
      setAuthError('à¦¦à§Ÿà¦¾ à¦•à¦°à§‡ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦²à¦¿à¦–à§à¦¨à¥¤');
      return;
    }

    const isAllowed = adminEmails.some(a => a.email.toLowerCase() === normalizedEmail);
    if (!isAllowed) {
      setAuthError('à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸ à¦…à¦¸à§à¦¬à§€à¦•à§ƒà¦¤! à¦à¦‡ à¦‡à¦®à§‡à¦²à¦Ÿà¦¿ à¦…à¦¨à§à¦®à§‹à¦¦à¦¿à¦¤ à¦à¦¡à¦®à¦¿à¦¨ à¦¤à¦¾à¦²à¦¿à¦•à¦¾à§Ÿ à¦¨à¦¿à¦¬à¦¨à§à¦§à¦¿à¦¤ à¦¨à§Ÿà¥¤');
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
          setAuthError('à¦à¦‡ à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà§‡ à¦•à§‹à¦¨à§‹ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦‡à¦œà¦¡ à¦¬à¦¾ à¦¸à§‡à¦Ÿà¦†à¦ª à¦•à¦°à¦¾ à¦¹à§Ÿà¦¨à¦¿! à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦¸à§à¦ªà¦¾à¦° à¦à¦¡à¦®à¦¿à¦¨ à¦¦à§à¦¬à¦¾à¦°à¦¾ à¦à¦¡à¦®à¦¿à¦¨ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦² à¦¥à§‡à¦•à§‡ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦¸à§‡à¦Ÿ à¦•à¦°à¦¿à§Ÿà§‡ à¦¨à¦¿à¦¨à¥¤');
          setIsSending(false);
          return;
        }
      }

      if (cleanPassword === correctPassword) {
        await checkAndProceedTOTP(normalizedEmail);
      } else {
        setAuthError('à¦­à§à¦² à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡! à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦¸à¦ à¦¿à¦• à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦¦à¦¿à§Ÿà§‡ à¦ªà§à¦¨à¦°à¦¾à§Ÿ à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤');
      }
    } catch (err: any) {
      console.error('[Custom Auth Error]', err);
      setAuthError('à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦¯à¦¾à¦šà¦¾à¦‡à¦•à¦°à¦£à§‡ à¦¬à§à¦¯à¦°à§à¦¥à¦¤à¦¾ à¦°à§‚à¦ª à¦¨à¦¿à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦‡à¦¨à§à¦Ÿà¦¾à¦°à¦¨à§‡à¦Ÿ à¦¸à¦‚à¦¯à§‹à¦— à¦šà§‡à¦• à¦•à¦°à§à¦¨à¥¤');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetOwn2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanPassword = reset2FAPassword.trim();

    if (!cleanPassword) {
      setAuthError('à§¨FA à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡à¦Ÿà¦¿ à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à§à¦¨à¥¤');
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
          setAuthError('à¦à¦‡ à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà§‡ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦¸à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¨à§‡à¦‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦¸à§à¦ªà¦¾à¦° à¦à¦¡à¦®à¦¿à¦¨à§‡à¦° à¦¸à¦¾à¦¥à§‡ à¦¯à§‹à¦—à¦¾à¦¯à§‹à¦— à¦•à¦°à§à¦¨à¥¤');
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
        alert('âœ… à¦†à¦ªà¦¨à¦¾à¦° à§¨-à¦¸à§à¦Ÿà§‡à¦ª à¦¨à¦¿à¦°à¦¾à¦ªà¦¤à§à¦¤à¦¾ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡! à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦—à§à¦—à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦…à§à¦¯à¦¾à¦ªà§‡ à¦¨à¦¤à§à¦¨ à¦•à¦¿à¦‰à¦†à¦° à¦•à§‹à¦¡à¦Ÿà¦¿ à¦¸à§à¦•à§à¦¯à¦¾à¦¨ à¦•à¦°à§‡ à¦¨à¦¿à¦¨à¥¤');
      } else {
        setAuthError('à¦­à§à¦² à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡! à§¨FA à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦¸à¦ à¦¿à¦• à¦à¦¡à¦®à¦¿à¦¨ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à§à¦¨à¥¤');
      }
    } catch (err: any) {
      console.error('[Reset Own 2FA Error]', err);
      setAuthError('à§¨FA à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¸à¦‚à¦¯à§‹à¦— à¦¬à¦¾ à¦‡à¦¨à§à¦Ÿà¦¾à¦°à¦¨à§‡à¦Ÿ à¦šà§‡à¦• à¦•à¦°à§à¦¨à¥¤');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetAgent2FA = async (username: string) => {
    if (!window.confirm(`à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¸à¦¤à§à¦¯à¦¿à¦‡ à¦à¦œà§‡à¦¨à§à¦Ÿ @${username} à¦à¦° à¦—à§à¦—à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à§¨-à¦¸à§à¦Ÿà§‡à¦ª à¦¨à¦¿à¦°à¦¾à¦ªà¦¤à§à¦¤à¦¾ à¦¸à¦¿à¦•à§à¦°à§‡à¦Ÿ à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦šà¦¾à¦¨? à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦²à§‡ à¦¤à¦¿à¦¨à¦¿ à¦¤à¦¾à¦° à¦ªà¦°à¦¬à¦°à§à¦¤à§€ à¦²à¦—à¦‡à¦¨à§‡ à¦¨à¦¤à§à¦¨ à¦•à¦°à§‡ à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦•à¦¿ à¦¸à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¦¨à¥¤`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'agent_totp_secrets', username.trim().toLowerCase()));
      alert(`âœ… à¦à¦œà§‡à¦¨à§à¦Ÿ @${username} à¦à¦° à¦—à§à¦—à¦² à§¨FA à¦¸à¦¿à¦•à§à¦°à§‡à¦Ÿ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!`);
    } catch (err) {
      console.error(err);
      alert('à§¨FA à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤ à¦¦à§Ÿà¦¾ à¦•à¦°à§‡ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§à¦¨à¥¤');
    }
  };

  const handleDeleteAgent = async (username: string) => {
    const cleanUser = (username || '').trim().toLowerCase();
    if (!cleanUser) return;
    if (!window.confirm(`à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¸à¦¤à§à¦¯à¦¿à¦‡ à¦à¦œà§‡à¦¨à§à¦Ÿ @${username} à¦•à§‡ à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£à¦­à¦¾à¦¬à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨? à¦à¦Ÿà¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤ à¦•à¦°à¦²à§‡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦à¦œà§‡à¦¨à§à¦Ÿà§‡à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ, à¦ªà¦¿à¦¨ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡, à§¨FA à¦à¦¬à¦‚ à¦°à§‡à¦«à¦¾à¦°à¦¾à¦² à¦°à§‡à¦•à¦°à§à¦¡ à¦¸à§à¦¥à¦¾à§Ÿà§€à¦­à¦¾à¦¬à§‡ à¦®à§à¦›à§‡ à¦¯à¦¾à¦¬à§‡à¥¤`)) {
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

      alert(`âœ… à¦à¦œà§‡à¦¨à§à¦Ÿ @${username} à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!`);
    } catch (err: any) {
      console.error('Failed to delete agent:', err);
      alert(`âŒ à¦à¦œà§‡à¦¨à§à¦Ÿ à¦®à§à¦›à¦¤à§‡ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à§Ÿà§‡à¦›à§‡: ${err.message || err}`);
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
      alert('à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ à¦•à¦°à¦¾à¦° à¦®à¦¤à§‹ à¦•à§‹à¦¨à§‹ à¦­à¦¿à¦œà¦¿à¦Ÿà¦° à¦¡à¦¾à¦Ÿà¦¾ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤');
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

    // UTF-8 BOM ï»¿ ensures proper Unicode & Bengali rendering in Excel
    const csvContent = 'ï»¿' + [headers.join(','), ...rows].join('\r\n');
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
      alert('à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ à¦•à¦°à¦¾à¦° à¦®à¦¤à§‹ à¦•à§‹à¦¨à§‹ à¦­à¦¿à¦œà¦¿à¦Ÿà¦° à¦¡à¦¾à¦Ÿà¦¾ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿à¥¤');
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
    if (!window.confirm('à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤ à¦¯à§‡ à¦†à¦ªà¦¨à¦¿ à¦¸à¦®à¦¸à§à¦¤ à§© à¦¦à¦¿à¦¨à§‡à¦° à¦­à¦¿à¦œà¦¿à¦Ÿà¦° à¦¹à¦¿à¦¸à§à¦Ÿà§à¦°à¦¿ à¦²à¦— à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨?\n\nà¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾à¦° à¦ªà¦° à¦¡à¦¾à¦Ÿà¦¾ à¦†à¦° à¦«à¦¿à¦°à¦¿à§Ÿà§‡ à¦†à¦¨à¦¾ à¦¸à¦®à§à¦­à¦¬ à¦¨à§Ÿà¥¤ à¦†à¦ªà¦¨à¦¿ à¦šà¦¾à¦‡à¦²à§‡ à¦†à¦—à§‡ CSV à¦¬à¦¾ JSON à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡ à¦•à¦°à§‡ à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦°à¦¾à¦–à¦¤à§‡ à¦ªà¦¾à¦°à§‡à¦¨à¥¤')) {
      return;
    }

    try {
      setIsVisitorLogsLoading(true);
      await fetch('/api/admin/visitors/purge', { method: 'POST' });
      setVisitorLogs([]);
      alert('à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¸à¦®à¦¸à§à¦¤ à¦­à¦¿à¦œà¦¿à¦Ÿà¦° à¦¹à¦¿à¦¸à§à¦Ÿà§à¦°à¦¿ à¦²à¦— à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!');
    } catch (err) {
      setVisitorLogs([]);
      alert('à¦­à¦¿à¦œà¦¿à¦Ÿà¦° à¦²à¦— à¦®à§‡à¦®à§‹à¦°à¦¿ à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡à¥¤');
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
      setLedgerError('Please specify a valid positive job payment amount (à§³)!');
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
      setLedgerSuccess(`á¼¸9 Manual ledger entry added successfully for ${matchedCompanion.name}! Model statistics and earnings share have been updated.`);
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
        alert(`à¦—à§à¦°à¦¾à¦¹à¦• à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà¦Ÿà¦¿ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ ${nextBlockedStatus ? 'à¦¬à§à¦²à¦•' : 'à¦†à¦¨à¦¬à§à¦²à¦•'} à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!`);
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
        alert(`à¦—à§à¦°à¦¾à¦¹à¦• à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà¦Ÿà¦¿ à¦¸à¦«à¦²à¦­à¦¾à¦¬à§‡ à¦¬à§à¦²à¦• à¦•à¦°à¦¾ à¦¹à§Ÿà§‡à¦›à§‡!`);
      }
    } catch (err) {
      console.error("Error blocking client:", err);
      alert("Error updating client block status.");
    }
  };

  const handleRemoveClient = async (client: any) => {
    if (!window.confirm(`à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤à¦­à¦¾à¦¬à§‡ à¦à¦‡ à¦—à§à¦°à¦¾à¦¹à¦• à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà¦Ÿà¦¿ ("${client.name}") à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨?`)) {
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
      alert("à¦—à§à¦°à¦¾à¦¹à¦• à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ à¦“ à¦¸à¦‚à¦¶à§à¦²à¦¿à¦·à§à¦Ÿ à¦¸à¦®à¦¸à§à¦¤ à¦°à§‡à¦•à¦°à§à¦¡ à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ à¦¥à§‡à¦•à§‡ à¦¸à§à¦¥à¦¾à§Ÿà§€à¦­à¦¾à¦¬à§‡ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¾ à¦¹à§Ÿà§‡à¦›à§‡! (Client deleted permanently!)");
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
      alert(`âœ… Profile "${compName}" has been permanently deleted from database.`);
    } catch (err: any) {
      console.error('Failed to delete companion:', err);
      alert(`âŒ Error deleting profile: ${err.message || err}`);
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
      alert("Please fill in both title and message body / à¦¶à¦¿à¦°à§‹à¦¨à¦¾à¦® à¦“ à¦¬à¦¾à¦°à§à¦¤à¦¾ à¦ªà§‚à¦°à¦£ à¦•à¦°à§à¦¨à¥¤");
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
        ? `Direct notification sent successfully to "${broadcastTargetUser}"! / "${broadcastTargetUser}" à¦•à§‡ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡!`
        : "Global broadcast notification sent successfully to all clients! / à¦¸à¦¬à¦¾à¦° à¦œà¦¨à§à¦¯ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦ªà¦¾à¦ à¦¾à¦¨à§‹ à¦¹à§Ÿà§‡à¦›à§‡!"
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
    const consent = window.confirm("Are you sure you want to recall/delete this notification? / à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦à¦‡ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨à¦Ÿà¦¿ à¦®à§à¦›à§‡ à¦«à§‡à¦²à¦¤à§‡ à¦šà¦¾à¦¨?");
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
                <span>Visitor Traffic (à¦­à¦¿à¦œà¦¿à¦Ÿà¦° à¦Ÿà§à¦°à¦¾à¦«à¦¿à¦•)</span>
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
                à§³ LEDGER
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
                <span>Agent Management (à¦à¦œà§‡à¦¨à§à¦Ÿ à¦“ à¦°à§‡à¦«à¦¾à¦°à§‡à¦²)</span>
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
                <span>Promo Codes (à¦ªà§à¦°à§‹à¦®à§‹ à¦•à§‹à¦¡)</span>
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
                <span>Marketing & Pixels (à¦ªà¦¿à¦•à§à¦¸à§‡à¦²)</span>
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
                <span>Push Notifications (à¦ªà§à¦¶ à¦à¦²à¦¾à¦°à§à¦Ÿ)</span>
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
                  <h2 className="text-lg font-bold text-white tracking-tight">Admin Authentication / à¦à¦¡à¦®à¦¿à¦¨ à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦¶à¦¨</h2>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                    à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦à¦¬à¦‚ à§¨-à¦¸à§à¦Ÿà§‡à¦ª à¦¸à¦¿à¦•à¦¿à¦‰à¦°à¦¿à¦Ÿà¦¿ à¦•à§‹à¦¡ à¦¬à¦¸à¦¿à§Ÿà§‡ à¦à¦¡à¦®à¦¿à¦¨ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²à§‡ à¦ªà§à¦°à¦¬à§‡à¦¶ à¦•à¦°à§à¦¨à¥¤
                  </p>
                </div>

                {/* CUSTOM EMAIL & PASSWORD LOGIN */}
                <form onSubmit={handleCustomEmailPasswordSignIn} className="space-y-4 text-left pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-400 pl-1 uppercase tracking-wider font-mono">
                      Email Address / à¦à¦¡à¦®à¦¿à¦¨ à¦‡à¦®à§‡à¦‡à¦²
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
                      Password / à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡
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
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                        Verifying... / à¦¯à¦¾à¦šà¦¾à¦‡ à¦•à¦°à¦¾ à¦¹à¦šà§à¦›à§‡...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Credentials / à¦ªà¦°à¦¬à¦°à§à¦¤à§€ à¦§à¦¾à¦ª
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
                      Google Authenticator Link / à¦—à§à¦—à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦²à¦¿à¦™à§à¦•
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                      à¦†à¦ªà¦¨à¦¾à¦° à¦—à§à¦—à¦² à¦…à¦¥à§‡à¦¨à§à¦Ÿà¦¿à¦•à§‡à¦Ÿà¦° à¦…à§à¦¯à¦¾à¦ªà§‡ à¦¨à¦¿à¦šà§‡à¦° à¦•à¦¿à¦‰à¦†à¦° à¦•à§‹à¦¡à¦Ÿà¦¿ (QR Code) à¦¸à§à¦•à§à¦¯à¦¾à¦¨ à¦•à¦°à§à¦¨ à¦…à¦¥à¦¬à¦¾ à¦•à§‹à¦¡à¦Ÿà¦¿ à¦®à§à¦¯à¦¾à¦¨à§à§Ÿà¦¾à¦²à¦¿ à¦¯à§‹à¦— à¦•à¦°à§à¦¨à¥¤
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
                      <span className="text-[9px] font-mono tracking-widest text-[#dbaa61] uppercase font-black">Manual Entry Key / à¦®à§à¦¯à¦¾à¦¨à§à¦¯à¦¼à¦¾à¦² à¦•à§€</span>
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
                      <span className="font-bold text-[#dbaa61] block mb-0.5">à¦²à¦¿à¦™à§à¦• à¦•à¦°à¦¾à¦° à¦¨à¦¿à§Ÿà¦®:</span>
                      <p>à§§. à¦†à¦ªà¦¨à¦¾à¦° à¦®à§‹à¦¬à¦¾à¦‡à¦²à§‡ <strong className="text-white">Google Authenticator</strong> à¦…à§à¦¯à¦¾à¦ª à¦“à¦ªà§‡à¦¨ à¦•à¦°à§à¦¨à¥¤</p>
                      <p>à§¨. à¦¨à¦¿à¦šà§‡ à¦¡à¦¾à¦¨ à¦•à§‹à¦£à¦¾à§Ÿ à¦ªà§à¦²à¦¾à¦¸ (+) à¦†à¦‡à¦•à¦¨ à¦šà§‡à¦ªà§‡ <strong className="text-white">"Scan a QR code"</strong> à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦•à¦°à§‡ à¦•à§‹à¦¡à¦Ÿà¦¿ à¦¸à§à¦•à§à¦¯à¦¾à¦¨ à¦•à¦°à§à¦¨à¥¤</p>
                      <p>à§©. à¦¯à¦¦à¦¿ à¦¸à§à¦•à§à¦¯à¦¾à¦¨ à¦¨à¦¾ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à§‡à¦¨, à¦¤à¦¬à§‡ <strong className="text-white">"Enter a setup key"</strong> à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦•à¦°à§‡ à¦¨à¦¾à¦® "BodyTouch" à¦à¦¬à¦‚ à¦“à¦ªà¦°à§‡à¦° "Manual Entry Key" à¦Ÿà¦¿ à¦¬à¦¸à¦¿à§Ÿà§‡ à¦¦à¦¿à§Ÿà§‡ <strong className="text-white">Add</strong> à¦šà¦¾à¦ªà§à¦¨à¥¤</p>
                    </div>
                  </div>

                  {/* Input Code Verification Pad */}
                  <div className="bg-[#03060d]/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <div className="space-y-1 text-center">
                      <label className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                        Enter Generated Code (à¦†à¦ªà¦¨à¦¾à¦° à¦…à§à¦¯à¦¾à¦ªà§‡à¦° à¦•à§‹à¦¡à¦Ÿà¦¿ à¦¦à¦¿à¦¨)
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
                                {val || <span className="text-slate-700 font-sans">â€¢</span>}
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
                      à¦†à¦ªà¦¨à¦¾à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ <strong className="text-white">{totpTempEnrollEmail}</strong> à¦à¦° à§¨-à¦¸à§à¦Ÿà§‡à¦ª à¦¨à¦¿à¦°à¦¾à¦ªà¦¤à§à¦¤à¦¾ à¦°à¦¿à¦¸à§‡à¦Ÿ à¦•à¦°à¦¤à§‡ à¦…à¦¨à§à¦—à§à¦°à¦¹ à¦•à¦°à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡à¦Ÿà¦¿ à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à§à¦¨à¥¤
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-[#03060d]/60 p-4 border border-slate-800/80">
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-semibold tracking-wider text-[#dbaa61] uppercase font-mono">
                        Your Admin Password (à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡à¦Ÿà¦¿ à¦²à¦¿à¦–à§à¦¨"
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
                      Cancel (à¦¬à¦¾à¦¤à¦¿à¦²)
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
                        {useBackupCode ? 'One-Time Backup Code (à¦“à§Ÿà¦¾à¦¨-à¦Ÿà¦¾à¦‡à¦® à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡)' : 'Security Passcode'}
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
                                  {val || <span className="text-slate-700 font-sans">â€¢</span>}
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
                      {useBackupCode ? 'â† Use Authenticator App (à¦…à§à¦¯à¦¾à¦ª à¦•à§‹à¦¡ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§à¦¨)' : 'á½‘1 Lost Access? Use Backup Code (à¦¬à§à¦¯à¦¾à¦•à¦†à¦ª à¦•à§‹à¦¡ à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§à¦¨)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReset2FAInput(true);
                        setAuthError('');
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer transition text-right"
                    >
                      âš ï¸ Lost 2FA / Device? Reset 2FA Setup (à§¨FA à¦¨à¦¤à§à¦¨ à¦•à¦°à§‡ à¦¸à§‡à¦Ÿà¦†à¦ª à¦•à¦°à§à¦¨)
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
            <span>â€¢</span>
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
                {activeTab === 'verification' && 'Model Verifications (à¦®à¦¡à§‡à¦² à¦¯à¦¾à¦šà¦¾à¦‡à¦•à¦°à¦£)'}
                {activeTab === 'admins' && 'Administrative Team'}
                {activeTab === 'smtp' && 'System & Telegram Settings'}
                {activeTab === 'shortlinks' && 'Quick Registration Links'}
                {activeTab === 'referrals' && 'Agent & Referral Management (à¦à¦œà§‡à¦¨à§à¦Ÿ à¦“ à¦°à§‡à¦«à¦¾à¦°à§‡à¦²)'}
                {activeTab === 'promocodes' && 'Promo Codes Manager (à¦ªà§à¦°à§‹à¦®à§‹ à¦•à§‹à¦¡ à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°)'}
                {activeTab === 'livechat' && 'Live Support Chat Console'}
                {activeTab === 'model_ledger' && 'Model Ledger & Financial Audit'}
                {activeTab === 'broadcast_notifications' && 'Broadcasting & Push Notifications (à¦ªà§à¦¶ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨)'}
                {activeTab === 'visitors' && 'Visitor Traffic Analytics (à¦­à¦¿à¦œà¦¿à¦Ÿà¦° à¦Ÿà§à¦°à¦¾à¦«à¦¿à¦•)'}
                {activeTab === 'marketing' && 'Marketing & Ad Tracking Pixels (à¦¬à¦¿à¦œà§à¦žà¦¾à¦ªà¦¨ à¦“ à¦¬à§à¦¸à§à¦Ÿ à¦Ÿà§à¦°à§à¦¯à¦¾à¦•à¦¿à¦‚)'}
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
                      à¦¸à§à¦¬à¦¾à¦—à¦¤à¦®, à¦¦à§à¦¯ à¦¬à¦¡à¦¿ à¦Ÿà¦¾à¦š à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦ªà§à¦¯à¦¾à¦¨à§‡à¦²!
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-2.5">
                      à¦à¦‡ à¦¸à§‡à¦¨à§à¦Ÿà§à¦°à¦¾à¦² à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦¡à§à¦¯à¦¾à¦¶à¦¬à§‹à¦°à§à¦¡ à¦¥à§‡à¦•à§‡ à¦†à¦ªà¦¨à¦¿ à¦—à§à¦°à¦¾à¦¹à¦• à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ (VIP Clients), à¦ªà¦¾à¦°à§à¦Ÿà¦¨à¦¾à¦° à¦ªà§à¦°à¦«à¦¾à¦‡à¦² (Companions & Models), à¦®à¦¿à¦¡à¦¿à§Ÿà¦¾ à¦¬à§à¦¯à¦¾à¦‚à¦•, à¦à¦¬à¦‚ à¦¬à§à¦•à¦¿à¦‚ à¦…à¦°à§à¦¡à¦¾à¦° à¦“ à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦® à¦‡à¦¨à§à¦Ÿà¦¿à¦—à§à¦°à§‡à¦¶à¦¨ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ à¦¨à¦¿à¦–à§à¦à¦¤à¦­à¦¾à¦¬à§‡ à¦¨à¦¿à§Ÿà¦¨à§à¦¤à§à¦°à¦£ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¦¨à¥¤ à¦•à§‹à¦¨à§‹ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¾à¦° à¦¸à¦¾à¦¥à§‡ à¦¸à¦¾à¦¥à§‡ à¦¤à¦¾ à¦«à§à¦°à¦¨à§à¦Ÿà¦à¦¨à§à¦¡à§‡ à¦°à¦¿à¦¯à¦¼à§‡à¦²-à¦Ÿà¦¾à¦‡à¦®à§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦¹à§Ÿà§‡ à¦¯à¦¾à¦¬à§‡à¥¤
                    </p>
                  </div>
                  <div className="pt-5 mt-4 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">âš¡ PORTAL STATUS: <strong className="text-white">ONLINE</strong></span>
                    <span className="text-[#dbaa61]">Staff Control Room</span>
                  </div>
                </div>

                {/* Quick Shortcuts Panel */}
                <div className="col-span-full lg:col-span-5 bg-[#0f1118] border border-white/[0.04] p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">âš¡ QUICK DASHBOARD SHORTCUTS</h4>
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

              {/* á½ª8 DATABASE RESET & FRESH TESTING CONTROLS */}
              <div className="bg-[#1c1012] border border-red-500/20 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] font-mono">DATABASE SECTOR SCRUBBER (DEVELOPER ACTION)</h4>
                  </div>
                  <p className="text-[11px] text-slate-350 font-semibold leading-relaxed">
                    à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦®à§‡à¦° à¦ªà§‚à¦°à§à¦¬à§‡à¦° à¦¸à¦•à¦² à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦° à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿ (users), à¦¬à§à¦•à¦¿à¦‚ à¦¹à¦¿à¦¸à§à¦Ÿà§à¦°à¦¿ (bookings) à¦à¦¬à¦‚ à¦°à¦¿à¦²à§‡à¦Ÿà§‡à¦¡ à¦Ÿà§à¦°à¦¾à¦¨à¦œà§‡à¦•à¦¶à¦¨ à¦¡à¦¾à¦Ÿà¦¾ (payments) à¦«à¦¾à§Ÿà¦¾à¦°à¦¸à§à¦Ÿà§‹à¦° à¦•à§à¦²à¦¾à¦‰à¦¡ à¦¥à§‡à¦•à§‡ à¦à¦•à¦¦à¦® à¦®à§à¦›à§‡ à¦«à§à¦°à§‡à¦¶ à¦Ÿà§‡à¦¸à§à¦Ÿ à¦•à¦°à¦¤à§‡ à¦¨à¦¿à¦šà§‡à¦° à¦°à¦¿à¦¸à§‡à¦Ÿ à¦¬à¦¾à¦Ÿà¦¨à§‡ à¦•à§à¦²à¦¿à¦• à¦•à¦°à§à¦¨à¥¤
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
                à¦¬à¦¡à¦¿ à¦Ÿà¦¾à¦š à¦—à§à¦°à¦¾à¦¹à¦•à¦¦à§‡à¦° à¦Ÿà§à¦°à¦¾à¦¨à¦œà§‡à¦•à¦¶à¦¨ à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦¨à¦¿à¦šà§‡ à¦¦à§‡à¦“à§Ÿà¦¾ à¦¹à¦²à§‹à¥¤ à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦¹à¦¿à¦¸à§‡à¦¬à§‡ à¦Ÿà§à¦°à¦¾à¦¨à¦œà§‡à¦•à¦¶à¦¨ à¦†à¦‡à¦¡à¦¿ à¦®à¦¿à¦²à¦¿à§Ÿà§‡ à¦®à§‡à¦®à§à¦¬à¦¾à¦° à¦¸à§‡à¦•à¦¶à¦¨ 
                <strong className="text-emerald-400"> Approve </strong> (VIP à¦à¦•à§à¦Ÿà¦¿à¦­à§‡à¦¶à¦¨ à¦Ÿà¦¿à¦•à¦¿à¦Ÿ) à¦…à¦¥à¦¬à¦¾ <strong className="text-rose-400"> Reject </strong> à¦•à¦°à§à¦¨à¥¤
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingPaymentsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    á½¨0 NO PENDING TRANSACTION TICKETS TO VERIFY
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
                            {pay.tierName} â€¢ {pay.method}
                          </p>
                        </div>
                        <span className="text-emerald-400 font-black font-mono text-base bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                          à§³ {pay.price}
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
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">á½8 Payment Screenshot (à¦¸à§à¦•à§à¦°à¦¿à¦¨à¦¶à¦Ÿ):</span>
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
                              View Full Size Image â†—
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
                          <span className={pay.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}>â—</span>
                          <span className="text-slate-300 font-bold">{pay.username}</span>
                          <span className="text-slate-500 font-medium">({pay.tierName})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">à§³{pay.price}</span>
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
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Registered Client Profiles Directory / à¦—à§à¦°à¦¾à¦¹à¦• à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œ</h4>
                    <p className="text-[9px] text-slate-500 font-medium">à¦¬à§à¦•à¦¿à¦‚ à¦•à¦°à¦¾à¦° à¦¸à¦®à¦¯à¦¼ à¦—à§à¦°à¦¾à¦¹à¦•à¦¦à§‡à¦° à¦¥à§‡à¦•à§‡ à¦¸à¦‚à¦—à§ƒà¦¹à§€à¦¤ à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¤à¦¥à§à¦¯à¦¾à¦¦à¦¿</p>
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
                        title="à¦®à§à¦›à§‡ à¦«à§‡à¦²à§à¦¨ (Remove Client)"
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
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">FULL NAME / à¦—à§à¦°à¦¾à¦¹à¦•à§‡à¦° à¦¨à¦¾à¦®</span>
                          <span className="text-xs text-white font-black block mt-1 select-all">{selectedClient.name}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">PHONE NUMBER / à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦®à§à¦¬à¦°</span>
                          <span className="text-xs text-emerald-400 font-mono font-black block mt-1 select-all">{selectedClient.phone}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">EMAIL ADDRESS / à¦‡à¦®à§‡à¦‡à¦²</span>
                          <span className="text-xs text-blue-400 font-mono font-black block mt-1 select-all">{selectedClient.email || 'No Email'}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">GENDER / à¦²à¦¿à¦™à§à¦—</span>
                          <span className="text-xs text-[#dbaa61] font-black block mt-1 uppercase">
                            {selectedClient.gender === 'male' ? 'á½†8 Male / à¦ªà§à¦°à§à¦·' : selectedClient.gender === 'female' ? 'á½†9 Female / à¦¨à¦¾à¦°à§€' : 'Not Specified'}
                          </span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">BIRTHDAY OR AGE / à¦¬à§Ÿà¦¸ à¦“ à¦œà¦¨à§à¦® à¦¤à¦¾à¦°à¦¿à¦–</span>
                          <span className="text-xs text-white font-black block mt-1 uppercase">
                            {selectedClient.birthday || 'Not Specified'}
                          </span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">AUTHENTICATED METHOD / à¦²à¦—à¦‡à¦¨ à¦Ÿà¦¾à¦‡à¦ª</span>
                          <span className="text-xs text-cyan-400 font-bold block mt-1 uppercase">
                            {selectedClient.authMethod || 'Password'}
                          </span>
                        </div>
                      </div>

                      {/* NID Section */}
                      <div className="space-y-3.5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Verification Documents (NID / Birth Certificate) / à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦¡à¦•à§à¦®à§‡à¦¨à§à¦Ÿ</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Front image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID / Birth Certificate Front (à¦¸à¦¾à¦®à¦¨à§‡à¦° à¦…à¦‚à¦¶ / à¦œà¦¨à§à¦®à¦¨à¦¿à¦¬à¦¨à§à¦§à¦¨)</span>
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
                                  Click to Zoom & Rotate / à¦œà§à¦® à¦“ à¦°à§‹à¦Ÿà§‡à¦Ÿ à¦•à¦°à§à¦¨ á½d
                                </div>
                              </button>
                            ) : (
                              <div className="h-32 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center text-[10.5px] text-slate-600 font-medium">
                                Document not provided / à¦¤à¦¥à§à¦¯ à¦¦à§‡à§Ÿà¦¾ à¦¹à§Ÿà¦¨à¦¿
                              </div>
                            )}
                          </div>

                          {/* Back image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID Back / Document Page 2 (à¦ªà§‡à¦›à¦¨à§‡à¦° à¦…à¦‚à¦¶ / à¦ªà§ƒà¦·à§à¦ à¦¾ à§¨)</span>
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
                                  Click to Zoom & Rotate / à¦œà§à¦® à¦“ à¦°à§‹à¦Ÿà§‡à¦Ÿ à¦•à¦°à§à¦¨ á½d
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
                                  <p className="text-[9.5px] text-slate-500 mt-0.5">{b.date} â€¢ {b.time} @ {b.location}</p>
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
                            {selectedClient.isBlocked ? 'á½‘3 Unblock Client' : 'â›” Block Client'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveClient(selectedClient)}
                            className="flex-1 bg-rose-900/20 hover:bg-rose-900/25 text-rose-400 border border-rose-500/25 text-[10.5px] font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer"
                          >
                            á½1ï¸ Delete Account
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
                à¦—à§à¦°à¦¾à¦¹à¦•à¦¦à§‡à¦° à¦®à§‡à¦®à§à¦¬à¦¾à¦°à¦¶à¦¿à¦ª à¦†à¦ªà¦—à§à¦°à§‡à¦¡ à¦°à¦¿à¦•à§‹à§Ÿà§‡à¦¸à§à¦Ÿ à¦¤à¦¾à¦²à¦¿à¦•à¦¾ à¦¨à¦¿à¦šà§‡ à¦¦à§‡à¦“à§Ÿà¦¾ à¦¹à¦²à§‹à¥¤ à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦¹à¦¿à¦¸à§‡à¦¬à§‡ à¦—à§à¦°à¦¾à¦¹à¦•à¦¦à§‡à¦° bKash/Nagad/Rocket à¦Ÿà§à¦°à¦¾à¦¨à¦œà§‡à¦•à¦¶à¦¨ à¦†à¦‡à¦¡à¦¿ à¦®à¦¿à¦²à¦¿à§Ÿà§‡ à¦®à§‡à¦®à§à¦¬à¦¾à¦° à¦¸à§‡à¦•à¦¶à¦¨ 
                <strong className="text-emerald-400"> Approve </strong> (à¦®à§‡à¦®à§à¦¬à¦¾à¦°à¦¶à¦¿à¦ª à¦à¦•à§à¦Ÿà¦¿à¦­à§‡à¦¶à¦¨) à¦…à¦¥à¦¬à¦¾ <strong className="text-rose-400"> Reject </strong> à¦•à¦°à§à¦¨à¥¤
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingMembershipsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    á½¨0 NO PENDING MEMBERSHIP REQUESTS TO VERIFY
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
                            á½‹3 REQUESTING {pay.tierName.toUpperCase()} MEMBERSHIP
                          </p>
                        </div>
                        <span className="text-amber-400 font-black font-mono text-base bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/15">
                          à§³ {pay.price}
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
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">á½8 Payment Screenshot (à¦¸à§à¦•à§à¦°à¦¿à¦¨à¦¶à¦Ÿ):</span>
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
                              View Full Size Image â†—
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
                          <span className={pay.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}>â—</span>
                          <span className="text-slate-300 font-bold">{pay.username}</span>
                          <span className="text-slate-500 font-medium">({pay.tierName})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">à§³{pay.price}</span>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Model Code / à¦®à¦¡à§‡à¦² à¦•à§‹à¦¡ (e.g. # 550800)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Select Category * / à§ªà¦Ÿà¦¿ à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿</label>
                      <select
                        value={compBadge}
                        onChange={(e) => setCompBadge(e.target.value as any)}
                        className="w-full bg-[#11131a] border border-[#ac843c]/40 rounded-xl px-3 py-2 text-white font-heavy focus:outline-none focus:border-emerald-500"
                      >
                        <option value="REGULAR">Regular Member (à¦°à§‡à¦—à§à¦²à¦¾à¦° à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿)</option>
                        <option value="PREMIUM">Premium Member (à¦ªà§à¦°à¦¿à¦®à¦¿à§Ÿà¦¾à¦® à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿)</option>
                        <option value="ELITE">Elite Society (à¦à¦²à¦¿à¦Ÿ à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿)</option>
                        <option value="DEMO">Demo Class (à¦¡à¦¿à¦®à§‹ à¦•à§à¦¯à¦¾à¦Ÿà¦¾à¦—à¦°à¦¿)</option>
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
                        <option value="Female Model">Female Model (à¦«à¦¿à¦®à§‡à¦² à¦®à¦¡à§‡à¦²)</option>
                        <option value="Male Model">Male Model (à¦®à§‡à¦² à¦®à¦¡à§‡à¦²)</option>
                        <option value="Sperm Donor">Sperm Donor (à¦¸à§à¦ªà¦¾à¦°à§à¦® à¦¡à§‹à¦¨à¦¾à¦°)</option>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Height / à¦‰à¦šà§à¦šà¦¤à¦¾</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Skin Complexion / à¦—à¦¾à§Ÿà§‡à¦° à¦°à¦™</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Weight / à¦“à¦œà¦¨</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Bust/Chest / à¦¸à§à¦¤à¦¨/à¦¬à§à¦• (à¦‡à¦žà§à¦šà¦¿)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Waist / à¦•à§‹à¦®à¦° (à¦‡à¦žà§à¦šà¦¿)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hip / à¦¨à¦¿à¦¤à¦®à§à¦¬ (à¦‡à¦žà§à¦šà¦¿)</label>
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
                        <label className="block text-[10px] font-black tracking-widest text-indigo-400 uppercase">Penis Size / à¦²à¦¿à¦™à§à¦—à§‡à¦° à¦†à¦•à¦¾à¦°</label>
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
                        <label className="block text-[10px] font-black tracking-widest text-indigo-400 uppercase">Duration Time / à¦¸à¦¹à¦¬à¦¾à¦¸à§‡à¦° à¦¸à§à¦¥à¦¾à¦¯à¦¼à¦¿à¦¤à§à¦¬à¦•à¦¾à¦²</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Phone Number / à¦«à§‹à¦¨ à¦¨à¦®à§à¦¬à¦°</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">WhatsApp Number / à¦¹à§‹à§Ÿà¦¾à¦Ÿà¦¸à¦…à§à¦¯à¦¾à¦ª</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Telegram ID / à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦® à¦†à¦‡à¦¡à¦¿</label>
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
                          SERVICE CONTROLS & DURATION RATES / à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦“ à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦°à§‡à¦Ÿ à¦¨à¦¿à§Ÿà¦¨à§à¦¤à§à¦°à¦£
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">á½Œd REAL MEET DURATION RATES (à§³ Taka):</span>
                            
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
                                      <span className="text-slate-500 text-[10px]">à§³</span>
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
                                      âœ•
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
                              âž• Add Real Meet Rate Option (+ à¦¨à¦¤à§à¦¨ à¦°à§‡à¦Ÿ à¦¯à§‹à¦— à¦•à¦°à§à¦¨)
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">á½Œd VIDEO CAM DURATION RATES (à§³ Taka):</span>
                            
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
                                      <span className="text-slate-550 text-[10px]">à§³</span>
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
                                      âœ•
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
                              âž• Add Video Cam Rate Option (+ à¦¨à¦¤à§à¦¨ à¦°à§‡à¦Ÿ à¦¯à§‹à¦— à¦•à¦°à§à¦¨)
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">DURATION PRICE OVERRIDES (à§³ Taka):</span>
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
                              <span className="block text-[8px] font-bold text-slate-400 tracking-wider">á½Œd TOUR DURATION RATES (à§³ Taka) / à¦Ÿà§à¦¯à§à¦° à¦°à§‡à¦Ÿ:</span>
                              
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
                                        <span className="text-slate-550 text-[10px]">à§³</span>
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
                                        âœ•
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
                                âž• Add Tour Rate Option (+ à¦¨à¦¤à§à¦¨ à¦Ÿà§à¦¯à§à¦° à¦°à§‡à¦Ÿ à¦¯à§‹à¦— à¦•à¦°à§à¦¨)
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
                          Operational Areas / à¦à¦²à¦¾à¦•à¦¾ à¦¸à¦®à§‚à¦¹ (à¦à¦•à¦¾à¦§à¦¿à¦• à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à§‡à¦¨)
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
                                âœ•
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
                          placeholder="Type custom area and press Enter / à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦à¦²à¦¾à¦•à¦¾ à¦²à¦¿à¦–à§à¦¨"
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
                          Add (à¦¯à§à¦•à§à¦¤ à¦•à¦°à§à¦¨)
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hourly Remundation Rate (à§³ Taka)</label>
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
                        CUSTOM FEES PER SERVICE / à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦°à§‡à¦Ÿ (à¦à¦šà§à¦›à¦¿à¦•)
                      </span>
                      <p className="text-[9px] text-slate-500 font-medium">
                        If left blank, the standard hourly rate and multipliers will be applied. Fill these to set custom fixed rates for particular options.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Custom Rate: REAL */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Real Service Rate (à§³/hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Cam Service Rate (à§³/hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Make Out Rate (à§³/hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Tour / à¦Ÿà§à¦¯à§à¦° Rate (à§³/hr)</label>
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
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Partner Image / à¦›à¦¬à¦¿ *</label>
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
                            Upload Image / à¦›à¦¬à¦¿ à¦†à¦ªà¦²à§‹à¦¡
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
                          Additional Gallery Portfolio Photos / à¦…à¦¤à¦¿à¦°à¦¿à¦•à§à¦¤ à¦›à¦¬à¦¿ à¦—à§à¦¯à¦¾à¦²à¦¾à¦°à¦¿ (à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à§ªà¦Ÿà¦¿)
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
                      á½Žd No active {partnerCategoryFilter.toLowerCase()} partners registered in database yet
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
                                â›” Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">
                            {comp.city || 'Dhaka'} â€¢ {comp.age} Yrs â€¢ {comp.height}
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
                              à§³ {comp.rate}/hr (Base)
                            </p>
                            {(comp.rateReal || comp.rateCam || comp.rateMakeOut || comp.rateLiveTogether) && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                {comp.rateReal && <span className="bg-blue-500/10 text-sky-400 text-[7px] px-1 rounded border border-blue-500/10 uppercase font-mono">Real: à§³{comp.rateReal}</span>}
                                {comp.rateCam && <span className="bg-cyan-500/10 text-cyan-400 text-[7px] px-1 rounded border border-cyan-500/10 uppercase font-mono font-bold">Cam: à§³{comp.rateCam}</span>}
                                {comp.rateMakeOut && <span className="bg-pink-500/10 text-pink-400 text-[7px] px-1 rounded border border-pink-500/10 uppercase font-mono">Out: à§³{comp.rateMakeOut}</span>}
                                {comp.rateLiveTogether && <span className="bg-purple-500/10 text-purple-400 text-[7px] px-1 rounded border border-purple-500/10 uppercase font-mono font-semibold">Together: à§³{comp.rateLiveTogether}</span>}
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
                          title={comp.isBlocked ? "Unblock Companion / à¦¬à§à¦²à¦• à¦–à§à¦²à§à¦¨" : "Block Companion / à¦¬à§à¦²à¦• à¦•à¦°à§à¦¨"}
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
                      á½Žc NO INCOMPLETE SIGNUPS (LEADS) IN {partnerCategoryFilter.toUpperCase()} CATEGORY
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
                                  âš ï¸ INCOMPLETE LEAD
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
                              <span className="text-slate-300 font-bold leading-none">{comp.age} Years â€¢ {comp.city || 'Dhaka'}</span>
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
                            Edit & Publish (à¦¸à¦®à§à¦ªà¦¾à¦¦à¦¨à¦¾ à¦“ à¦ªà¦¾à¦¬à¦²à¦¿à¦¶)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompanion(comp.id)}
                            className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Lead (à¦²à¦¿à¦¡ à¦®à§à¦›à§à¦¨)
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
                      á½Žc NO PENDING CAREER APPLICATIONS IN {partnerCategoryFilter.toUpperCase()} CATEGORY
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
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Height (à¦‰à¦šà§à¦šà¦¤à¦¾):</span>
                            <span className="text-white font-heavy">{comp.height}</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Rate / hourly:</span>
                            <span className="text-emerald-400 font-black font-mono">à§³ {comp.rate}/hr</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">City (à¦¶à¦¹à¦°):</span>
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
                              âš™ï¸ CONFIGURE APPROVED SERVICES & HOURLY RATES (à§³)
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Real Service Rate (à§³)</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Face Cam Rate (à§³)</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Make Out Rate (à§³)</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Tour / à¦Ÿà§à¦¯à§à¦° (à§³/day)</label>
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
                à¦®à§‡à¦¡à¦¿à§Ÿà¦¾ à¦«à¦¾à¦‡à¦² à¦•à¦¾à¦²à§‡à¦•à¦¶à¦¨ à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°à¥¤ à¦¯à§‡à¦•à§‹à¦¨à§‹ à¦¨à¦¤à§à¦¨ à¦›à¦¬à¦¿ à¦¯à§à¦•à§à¦¤ à¦•à¦°à¦¤à§‡ à¦¨à¦¿à¦šà§‡ URL à¦ªà§‹à¦¸à§à¦Ÿ à¦•à¦°à§à¦¨à¥¤ à¦®à¦¡à§‡à¦²à§‡ à¦¯à§à¦•à§à¦¤ à¦•à¦°à¦¾à¦° à¦œà¦¨à§à¦¯ à¦¯à§‡à¦•à§‹à¦¨à§‹ à¦›à¦¬à¦¿à¦°
                <strong className="text-blue-400"> Copy URL </strong> à¦¬à¦¾à¦Ÿà¦¨ à¦•à§à¦²à¦¿à¦• à¦•à¦°à¦²à§‡à¦‡ à¦šà¦®à§Žà¦•à¦¾à¦°à¦­à¦¾à¦¬à§‡ à¦›à¦¬à¦¿à¦° à¦²à¦¿à¦™à§à¦• à¦•à§à¦²à¦¿à¦ªà¦¬à§‹à¦°à§à¦¡à§‡ à¦•à¦ªà¦¿ à¦¹à§Ÿà§‡ à¦¯à¦¾à¦¬à§‡! 
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
                  à¦¬à¦¡à¦¿ à¦Ÿà¦¾à¦š à¦®à§‡à¦®à§à¦¬à¦¾à¦°à¦¦à§‡à¦° à¦à¦™à§à¦•à§‹à¦¯à¦¼à¦¾à¦°à¦¿ à¦°à¦¿à¦•à§‹à¦¯à¦¼à§‡à¦¸à§à¦Ÿ à¦“ à¦¬à§à¦•à¦¿à¦‚ à¦²à¦¿à¦¸à§à¦Ÿà¥¤ à¦ªà¦¾à¦°à§à¦Ÿà¦¨à¦¾à¦°à¦¦à§‡à¦° à¦¬à§à¦•à¦¿à¦‚ <strong className="text-emerald-400"> Approve & Send Mail </strong> à¦•à§à¦²à¦¿à¦• à¦•à¦°à§‡ à¦•à¦¨à¦«à¦¾à¦°à§à¦® à¦•à¦°à§à¦¨à¥¤ à¦à¦¤à§‡ à¦•à¦°à§‡ à¦•à§à¦°à§‡à¦¤à¦¾à¦° à¦‡à¦®à§‡à¦² à¦¬à¦•à§à¦¸à§‡ à¦¸à¦®à§à¦ªà§‚à¦°à§à¦£ à¦­à¦¾à¦‰à¦šà¦¾à¦° à¦•à§‹à¦¡ à¦®à§‡à¦‡à¦² à¦†à¦•à¦¾à¦°à§‡ à¦¸à§à¦¬à§Ÿà¦‚à¦•à§à¦°à¦¿à§Ÿà¦­à¦¾à¦¬à§‡ à¦ªà§à¦°à§‡à¦°à¦¿à¦¤ à¦¹à§Ÿà§‡ à¦¯à¦¾à¦¬à§‡à¥¤
                </p>

                {/* Sub-tabs to separate orders according to tier */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-950/75 border border-[#161a24] rounded-2xl">
                  {([
                    { value: 'ALL', en: 'All Orders', bn: 'à¦¸à¦•à¦² à¦…à¦°à§à¦¡à¦¾à¦°', count: bookings.length },
                    { value: 'REGULAR', en: 'Regular', bn: 'à¦°à§‡à¦—à§à¦²à¦¾à¦°', count: regularOrdersCount },
                    { value: 'PREMIUM', en: 'Premium', bn: 'à¦ªà§à¦°à¦¿à¦®à¦¿à§Ÿà¦¾à¦®', count: premiumOrdersCount },
                    { value: 'ELITE', en: 'Elite', bn: 'à¦à¦²à¦¿à¦Ÿ', count: eliteOrdersCount }
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
                      á½¨0 NO {orderTierFilter === 'ALL' ? '' : `${orderTierFilter} `}ACTIVE SERVICES BOOKINGS YET
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
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Date / à¦¤à¦¾à¦°à¦¿à¦–:</span>
                              <span className="text-white font-heavy">{book.date}</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Duration (à¦¸à¦®à§Ÿà¦•à¦¾à¦²):</span>
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
                            const shareMessage = `á½‘4 *à¦¨à¦¤à§à¦¨ à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦¬à§à¦•à¦¿à¦‚ à¦¡à¦¿à¦Ÿà§‡à¦‡à¦²à¦¸!*
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
á½†9á¼¿c *à¦®à¦¡à§‡à¦²:* ${book.modelName} (${book.modelTag})
á½†4 *à¦•à§à¦²à¦¾à¦¯à¦¼à§‡à¦¨à§à¦Ÿ à¦¨à¦¾à¦®:* ${book.clientName || 'Anonymous User'}
á½e *à¦•à§à¦²à¦¾à¦¯à¦¼à§‡à¦¨à§à¦Ÿ à¦«à§‹à¦¨:* ${book.clientPhone || 'Not Provided'}
á½Œ5 *à¦¤à¦¾à¦°à¦¿à¦–:* ${book.date}
â° *à¦¸à¦®à§Ÿ:* ${book.time} (${book.duration})
á½Œd *à¦ à¦¿à¦•à¦¾à¦¨à¦¾/à¦²à§‹à¦•à§‡à¦¶à¦¨:* ${book.location}
á½Ÿaï¸ *à¦—à§à¦—à¦² à¦®à§à¦¯à¦¾à¦ªà¦¸ à¦²à¦¿à¦™à§à¦•:* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(book.location)}
á½d *à¦¬à¦¿à¦¶à§‡à¦· à¦¨à¦¿à¦°à§à¦¦à§‡à¦¶à¦¨à¦¾:* ${book.notes || 'N/A'}
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
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
                                  <span>á½e Coordination Hub (à¦•à§à¦²à¦¾à¦¯à¦¼à§‡à¦¨à§à¦Ÿ à¦“ à¦®à¦¡à§‡à¦² à¦¯à§‹à¦—à¦¾à¦¯à§‹à¦—)</span>
                                  <span className="text-[9px] text-blue-400 lowercase font-mono">Live Sync Matcher</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  {/* Client Details Column */}
                                  <div className="space-y-1.5">
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Client Details (à¦•à§à¦²à¦¾à¦¯à¦¼à§‡à¦¨à§à¦Ÿ à¦¤à¦¥à§à¦¯)</h6>
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
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-[#ceff00]">Model Full Details (à¦®à¦¡à§‡à¦² à¦¤à¦¥à§à¦¯)</h6>
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
                                        âš ï¸ à¦ªà§à¦°à§‹à¦«à¦¾à¦‡à¦² à¦¡à¦¾à¦Ÿà¦¾à¦¬à§‡à¦œà§‡ à¦ªà¦¾à¦“à§Ÿà¦¾ à¦¯à¦¾à§Ÿà¦¨à¦¿! à¦¸à¦®à§à¦­à¦¬à¦¤ à¦¨à¦¾à¦® à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¹à§Ÿà§‡à¦›à§‡à¥¤
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
                                        Copied! (à¦•à¦ªà¦¿ à¦¹à§Ÿà§‡à¦›à§‡)
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        Copy Details (à¦¡à¦¿à¦Ÿà§‡à¦‡à¦²à¦¸ à¦•à¦ªà¦¿)
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
                                      WhatsApp (à¦¹à§‹à§Ÿà¦¾à¦Ÿà¦¸à¦…à§à¦¯à¦¾à¦ªà§‡ à¦ªà¦¾à¦ à¦¾à¦¨)
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
                                      Telegram (à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦®à§‡ à¦ªà¦¾à¦ à¦¾à¦¨)
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
                                  á½‹8 DEFICIT PAYMENT RECEIVED / à¦˜à¦¾à¦Ÿà¦¤à¦¿ à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ
                                </span>
                                <span className="text-amber-400 font-extrabold text-[10.5px]">à§³{book.deficitPay.amount}</span>
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
                                      OPEN FULL PROOF IMAGE â†—
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {book.firstTimeBooking && (
                            <div className="bg-[#0c0d16] border border-blue-500/10 p-3 rounded-xl flex flex-col gap-2">
                              <span className="text-blue-400 text-[8.5px] font-black uppercase tracking-widest block font-mono">
                                á½‘2 FIRST-TIME CLIENT VERIFICATION / à¦ªà§à¦°à¦¥à¦®à¦¬à¦¾à¦° à¦¬à§à¦•à¦¿à¦‚ à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨
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
                                <span className="text-emerald-400 font-bold font-sans">Processed Voucher Mail (à¦®à§‡à¦‡à¦² à¦•à¦¨à¦«à¦¾à¦°à§à¦®à¦¡)</span>
                              </div>

                              {book.status === 'Approved' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <button
                                    onClick={() => onMarkOutgoingBooking && onMarkOutgoingBooking(book.id)}
                                    className="flex-1 bg-blue-600/20 hover:bg-blue-650/80 border border-blue-500/30 hover:border-blue-500/55 text-blue-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    á½¨0 Outgoing (à¦†à¦¸à¦›à§‡)
                                  </button>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-650/80 border border-emerald-500/30 hover:border-emerald-500/55 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    á½‰6 Complete (à¦¸à¦®à§à¦ªà¦¨à§à¦¨)
                                  </button>
                                </div>
                              )}

                              {book.status === 'Outgoing' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <div className="flex-1 text-[9px] font-mono text-blue-405 flex items-center justify-center bg-blue-955/20 rounded-lg p-1 font-bold">
                                    Status: Outgoing for Call á½¯5
                                  </div>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/30 hover:bg-emerald-650/80 border border-emerald-500/40 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    á½‰6 Complete (à¦¸à¦®à§à¦ªà¦¨à§à¦¨)
                                  </button>
                                </div>
                              )}

                              {book.status === 'Completed' && (
                                <div className="bg-emerald-950/20 border border-emerald-500/15 px-3 py-2 rounded-xl text-center text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1.5">
                                  <span>âœ… Service successfully closed & finalized. Feedback channel active.</span>
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
                  à¦¡à¦¿à¦œà¦¾à¦‡à¦¨à§‡à¦¡ à¦¬à¦¿à¦²à¦¾à¦¸à¦¬à¦¹à§à¦² à¦¸à§‡à¦« à¦¹à¦¾à¦‰à¦¸ à¦à¦¬à¦‚ à¦«à¦¾à¦‡à¦­-à¦¸à§à¦Ÿà¦¾à¦° à¦¸à§à¦¯à§à¦‡à¦Ÿ à¦¤à¦¾à¦²à¦¿à¦•à¦¾à¥¤ à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦¬à§à¦•à¦¿à¦‚ à¦•à¦°à¦¾à¦° à¦œà¦¨à§à¦¯ à¦•à§à¦²à¦¾à§Ÿà§‡à¦¨à§à¦Ÿà¦¦à§‡à¦° à¦°à¦¿à¦²à§à¦¯à¦¾à¦•à§à¦¸ à¦®à§à¦¯à¦¾à¦ªà§‡ à¦¸à§à¦¯à§à¦‡à¦Ÿà¦—à§à¦²à§‹ à¦ªà§à¦°à¦¦à¦°à§à¦¶à¦¿à¦¤ à¦¹à§Ÿà¥¤
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Prestige stars rating / à¦¸à§à¦Ÿà¦¾à¦° à¦°à§‡à¦Ÿà¦¿à¦‚</label>
                      <select
                        value={locStar}
                        onChange={(e) => setLocStar(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs font-bold cursor-pointer"
                      >
                        <option value="5 STAR">á½…1 5 STAR PRESTIGE ROYAL</option>
                        <option value="4 STAR">â­ 4 STAR PREMIUM CLASS</option>
                        <option value="3 STAR">â­ 3 STAR EXECUTIVE LUXURY</option>
                        <option value="2 STAR">â­ 2 STAR COMFORT SANCTUARY</option>
                        <option value="1 STAR">â­ 1 STAR STANDARD BUDGET</option>
                        <option value="BOUTIQUE">á¼¾2 PRIVATE BOUTIQUE SANCTUARY</option>
                        <option value="SAFE HOUSE">á½‘2 HIGH-SECURITY SAFE HOUSE</option>
                        <option value="5 STAR SAFE HOUSE">á½…1 á½‘2 5 STAR SECURE SAFE HOUSE</option>
                      </select>
                    </div>

                    {/* City Location */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Metropolis District area / à¦à¦²à¦¾à¦•à¦¾ à¦¬à¦¾ à¦¬à¦¿à¦­à¦¾à¦—</label>
                      <select
                        value={locCity}
                        onChange={(e) => setLocCity(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-xs font-bold"
                      >
                        <option value="" className="bg-[#11131a] text-white font-sans font-bold">Select Area / à¦à¦²à¦¾à¦•à¦¾ à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦•à¦°à§à¦¨</option>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Sanctuary Charge / à¦­à¦¾à§œà¦¾ (à§³) *</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#2271b1] uppercase">Sanctuary Description & Privacy Guidelines / à¦¹à§‹à¦Ÿà§‡à¦²à§‡à¦° à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¬à¦¿à¦¬à¦°à¦£ à¦“ à¦—à§‹à¦ªà¦¨à§€à§Ÿà¦¤à¦¾ à¦¨à¦¿à§Ÿà¦®à¦¾à¦¬à¦²à§€ *</label>
                      <textarea
                        rows={4}
                        required
                        value={locDesc}
                        onChange={(e) => setLocDesc(e.target.value)}
                        placeholder="à¦¹à§‹à¦Ÿà§‡à¦²à§‡à¦° à¦¬à¦¿à¦¬à¦°à¦£, à¦¸à§à¦¯à§‹à¦— à¦¸à§à¦¬à¦¿à¦§à¦¾ à¦à¦¬à¦‚ à¦—à§‹à¦ªà¦¨à§€à§Ÿà¦¤à¦¾ à¦¸à¦®à§à¦ªà¦°à§à¦•à¦¿à¦¤ à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦²à¦¿à¦–à§à¦¨à¥¤ à¦¯à§‡à¦®à¦¨: Private elevator, 100% blind safety setups, elite room amenities..."
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono font-sans">Hotel Suite Photo * (à¦›à¦¬à¦¿ à¦†à¦ªà¦²à§‹à¦¡ à¦•à¦°à§à¦¨ à¦…à¦¥à¦¬à¦¾ à¦²à¦¿à¦‚à¦• à¦¬à¦¸à¦¾à¦¨)</label>
                      
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
                            Upload Image / à¦›à¦¬à¦¿ à¦†à¦ªà¦²à§‹à¦¡
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">á½ª8 Hotel Fine Specifications (à¦œà¦°à§à¦°à§€ à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¤à¦¥à§à¦¯)</span>
                    </div>

                    {/* Distance */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Distance string (à¦¦à§à¦°à¦¤à§à¦¬, e.g. 17.1 km from city center)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Street Address (à¦ªà§‚à¦°à§à¦£ à¦ à¦¿à¦•à¦¾à¦¨à¦¾)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-in Policy Time (à¦šà§‡à¦•-à¦‡à¦¨ à¦¸à¦®à§Ÿ)</label>
                      <input
                        type="text"
                        value={locCheckInTime}
                        onChange={(e) => setLocCheckInTime(e.target.value)}
                        placeholder="e.g. 02:00 PM"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-out Policy Time (à¦šà§‡à¦•-à¦†à¦‰à¦Ÿ à¦¸à¦®à§Ÿ)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Highlighted Facilities (à¦•à¦®à¦¾ à¦¦à¦¿à§Ÿà§‡ à¦²à¦¿à¦–à§à¦¨ - Comma separated)</label>
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">á½¬fï¸ Room Option 1 Details (à¦°à§à¦® à¦…à¦ªà¦¶à¦¨ à§§ à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¬à¦¿à¦¬à¦°à¦£)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name (à¦¨à¦¾à¦®)</label>
                      <input
                        type="text"
                        value={locRoom1Name}
                        onChange={(e) => setLocRoom1Name(e.target.value)}
                        placeholder="e.g. Premium Deluxe Twin"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type (à¦¬à§‡à¦¡ à¦Ÿà¦¾à¦‡à¦ª)</label>
                      <input
                        type="text"
                        value={locRoom1BedType}
                        onChange={(e) => setLocRoom1BedType(e.target.value)}
                        placeholder="e.g. TWIN x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity (à¦§à¦¾à¦°à¦£à¦•à§à¦·à¦®à¦¤à¦¾)</label>
                      <input
                        type="text"
                        value={locRoom1Capacity}
                        onChange={(e) => setLocRoom1Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type (à¦­à¦¿à¦“ à¦Ÿà¦¾à¦‡à¦ª)</label>
                      <input
                        type="text"
                        value={locRoom1ViewType}
                        onChange={(e) => setLocRoom1ViewType(e.target.value)}
                        placeholder="e.g. no-view / City View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area (à¦°à§à¦®à§‡à¦° à¦¸à¦¾à¦‡à¦œ)</label>
                      <input
                        type="text"
                        value={locRoom1Area}
                        onChange={(e) => setLocRoom1Area(e.target.value)}
                        placeholder="e.g. 18 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room (à¦­à¦¾à§œà¦¾)</label>
                      <input
                        type="number"
                        value={locRoom1Price}
                        onChange={(e) => setLocRoom1Price(e.target.value)}
                        placeholder="e.g. 2311"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (à¦¸à§à¦¬à¦¿à¦§à¦¾à¦¸à¦®à§‚à¦¹, e.g. Breakfast Included, Non-Smoking room)</label>
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">á½¬fï¸ Room Option 2 Details (à¦°à§à¦® à¦…à¦ªà¦¶à¦¨ à§¨ à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¬à¦¿à¦¬à¦°à¦£)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name (à¦¨à¦¾à¦®)</label>
                      <input
                        type="text"
                        value={locRoom2Name}
                        onChange={(e) => setLocRoom2Name(e.target.value)}
                        placeholder="e.g. Executive Suite"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type (à¦¬à§‡à¦¡ à¦Ÿà¦¾à¦‡à¦ª)</label>
                      <input
                        type="text"
                        value={locRoom2BedType}
                        onChange={(e) => setLocRoom2BedType(e.target.value)}
                        placeholder="e.g. KING x 1"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity (à¦§à¦¾à¦°à¦£à¦•à§à¦·à¦®à¦¤à¦¾)</label>
                      <input
                        type="text"
                        value={locRoom2Capacity}
                        onChange={(e) => setLocRoom2Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type (à¦­à¦¿à¦“ à¦Ÿà¦¾à¦‡à¦ª)</label>
                      <input
                        type="text"
                        value={locRoom2ViewType}
                        onChange={(e) => setLocRoom2ViewType(e.target.value)}
                        placeholder="e.g. no-view / Skyline View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area (à¦°à§à¦®à§‡à¦° à¦¸à¦¾à¦‡à¦œ)</label>
                      <input
                        type="text"
                        value={locRoom2Area}
                        onChange={(e) => setLocRoom2Area(e.target.value)}
                        placeholder="e.g. 25 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room (à¦­à¦¾à§œà¦¾)</label>
                      <input
                        type="number"
                        value={locRoom2Price}
                        onChange={(e) => setLocRoom2Price(e.target.value)}
                        placeholder="e.g. 4500"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                       <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (à¦¸à§à¦¬à¦¿à¦§à¦¾à¦¸à¦®à§‚à¦¹, e.g. Breakfast Included, Non-Smoking room)</label>
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
                    <span>{tab === 'SAFE HOUSES' ? 'SAFE HOUSES (à¦¸à§‡à¦« à¦¹à¦¾à¦‰à¦¸)' : tab === 'HOTELS' ? 'HOTELS (à¦¹à§‹à¦Ÿà§‡à¦²)' : 'ALL (à¦¸à¦¬)'}</span>
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
                      Brand Logo Uploader & Controller (à¦¬à§à¦°à§à¦¯à¦¾à¦¨à§à¦¡ à¦²à§‹à¦—à§‹ à¦†à¦ªà¦²à§‹à¦¡à¦¾à¦°)
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
                      Interactive Crop Circle (à¦²à§‹à¦—à§‹ à¦ªà¦œà¦¿à¦¶à¦¨ à¦•à¦°à§à¦¨)
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
                          á½›1ï¸ Hold & Drag on the image to position! <br />
                          (à¦›à¦¬à¦¿à¦Ÿà¦¿à¦° à¦“à¦ªà¦° à¦®à¦¾à¦‰à¦¸ à¦¬à¦¾ à¦†à¦™à§à¦² à¦¦à¦¿à§Ÿà§‡ à¦¡à§à¦°à§à¦¯à¦¾à¦— à¦•à¦°à§‡ à¦¬à¦¸à¦¾à¦¨)
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
                        Upload Logo Image File (à¦²à§‹à¦—à§‹ à¦›à¦¬à¦¿ à¦«à¦¾à¦‡à¦² à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦•à¦°à§à¦¨)
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
                          <span>Precise adjustment sliders (à¦¸à§‚à¦•à§à¦·à§à¦®à¦­à¦¾à¦¬à§‡ à¦¸à¦¾à¦‡à¦œ à¦®à§‡à¦²à¦¾à¦¨à§‹à¦° à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦°)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">á½d Image Scale / Zoom (à¦›à¦¬à¦¿ à¦¬à§œ/à¦›à§‹à¦Ÿ à¦•à¦°à§à¦¨)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">â†”ï¸ Horizontal Shift (à¦¡à¦¾à¦¨à§‡-à¦¬à¦¾à¦®à§‡ à¦¸à¦°à¦¾à¦¨)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">â†•ï¸ Vertical Shift (à¦‰à¦ªà¦°à§‡-à¦¨à¦¿à¦šà§‡ à¦¸à¦°à¦¾à¦¨)</span>
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
                            <span className="text-[9px] font-bold text-slate-400">á½4 Rotate Image (à¦˜à§‹à¦°à¦¾à¦¨)</span>
                            <span className="text-[9px] font-mono font-bold text-amber-400">{logoRotate}Â°</span>
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
                              Crop & Lock Logo (à¦²à§‹à¦—à§‹ à¦¸à¦¾à¦‡à¦œ à¦ à¦¿à¦• à¦•à¦°à§‡ à¦•à¦¾à¦Ÿà§à¦¨)
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                          Or Paste Logo Image URL (à¦…à¦¥à¦¬à¦¾ à¦¡à¦¿à¦°à§‡à¦•à§à¦Ÿ à¦‡à¦®à§‡à¦œ à¦²à¦¿à¦‚à¦• à¦¦à¦¿à¦¨)
                        </label>
                        {tempLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤ à¦²à§‹à¦—à§‹à¦Ÿà¦¿ à¦°à¦¿à¦®à§à¦­ à¦•à¦°à§‡ à¦¡à¦¿à¦«à¦²à§à¦Ÿ à¦¡à¦¿à¦œà¦¾à¦‡à¦¨à§‡ à¦«à¦¿à¦°à§‡ à¦¯à§‡à¦¤à§‡ à¦šà¦¾à¦¨?")) {
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
                        Apply & Save Logo (à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¸à§‡à¦­ à¦•à¦°à§à¦¨)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("à¦†à¦ªà¦¨à¦¿ à¦•à¦¿ à¦¨à¦¿à¦¶à§à¦šà¦¿à¦¤ à¦¯à§‡ à¦†à¦ªà¦¨à¦¿ à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦²à§‹à¦—à§‹ à¦®à§à¦›à§‡ à¦¦à¦¿à§Ÿà§‡ à¦ªà§‚à¦°à§à¦¬à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦¿à¦¤ à¦¡à¦¿à¦«à¦²à§à¦Ÿ à¦­à§‡à¦•à§à¦Ÿà¦° à¦²à§‹à¦—à§‹à¦¤à§‡ à¦«à¦¿à¦°à§‡ à¦¯à§‡à¦¤à§‡ à¦šà¦¾à¦¨?")) {
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
                        Reset to Default (à¦¡à¦¿à¦«à¦²à§à¦Ÿ à¦²à§‹à¦—à§‹)
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
                    Telegram Notification Engine & Helpline (à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦® à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦“ à¦¹à§‡à¦²à§à¦ªà¦²à¦¾à¦‡à¦¨)
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Configure your primary Telegram Bot credentials, Admin Group Chat ID, and the support Helpline handle below. In case of lost/damaged accounts, you can instantly add/save or remove credentials to keep system notification channels secure and completely organized. (OTP Verification is completely handled by the Email SMS Gateway).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      Telegram Bot Token (à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦® à¦¬à¦Ÿ à¦Ÿà§‹à¦•à§‡à¦¨)
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
                      Telegram Group Chat ID (à¦—à§à¦°à§à¦ª à¦šà§à¦¯à¦¾à¦Ÿ à¦†à¦‡à¦¡à¦¿)
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
                      Support Helpline Username (à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦® à¦¹à§‡à¦²à§à¦ªà¦²à¦¾à¦‡à¦¨)
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
                      Telegram Channel Username (à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦® à¦šà§à¦¯à¦¾à¦¨à§‡à¦² à¦‡à¦‰à¦œà¦¾à¦°à¦¨à§‡à¦®)
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
                      WhatsApp Support Phone / Link (à¦¹à§‹à¦¯à¦¼à¦¾à¦Ÿà¦¸à¦…à§à¦¯à¦¾à¦ª à¦¨à¦¾à¦®à§à¦¬à¦¾à¦°/à¦²à¦¿à¦‚à¦•)
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
                        alert("âœ… Telegram Credentials & Support Helpline configurations have been securely added and updated in system databases!");
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
                        alert("âš ï¸ Disconnected: All Telegram Bot tokens, Chat IDs, and active helpline links have been completely removed and deleted from system memory!");
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
                    âš ï¸ <b>à¦¬à¦Ÿ à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸ à¦¨à¦¿à¦°à§à¦¦à§‡à¦¶à¦¾à¦¬à¦²à¦¿:</b>
                  </p>
                  <p>
                    à§§. à¦ªà§à¦°à¦¥à¦®à§‡ <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">@BotFather</a> à¦à¦° à¦®à¦¾à¦§à§à¦¯à¦®à§‡ à¦à¦•à¦Ÿà¦¿ à¦¨à¦¤à§à¦¨ à¦Ÿà§‡à¦²à¦¿à¦—à§à¦°à¦¾à¦® à¦¬à¦Ÿ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à§‡ à¦Ÿà§‹à¦•à§‡à¦¨à¦Ÿà¦¿ à¦à¦–à¦¾à¦¨à§‡ à¦¬à¦¸à¦¾à¦¨à¥¤
                  </p>
                  <p>
                    à§¨. à¦†à¦ªà¦¨à¦¾à¦° à¦…à§à¦¯à¦¾à¦¡à¦®à¦¿à¦¨ à¦—à§à¦°à§à¦ª à¦šà§à¦¯à¦¾à¦Ÿà§‡ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à¦¾ à¦¬à¦Ÿà¦Ÿà¦¿à¦•à§‡ à¦¯à§à¦•à§à¦¤ à¦•à¦°à§à¦¨ à¦à¦¬à¦‚ à¦—à§à¦°à§à¦ª à¦šà§à¦¯à¦¾à¦Ÿ à¦†à¦‡à¦¡à¦¿ (Chat ID) à¦‰à¦ªà¦°à§‹à¦•à§à¦¤ à¦¬à¦•à§à¦¸à§‡ à¦ªà§à¦°à¦¦à¦¾à¦¨ à¦•à¦°à§à¦¨à¥¤
                  </p>
                  <p>
                    à§©. à¦•à§‹à¦¨à§‹ à¦®à¦¡à§‡à¦² à¦¬à§à¦•à¦¿à¦‚ à¦°à¦¿à¦•à§‹à§Ÿà§‡à¦¸à§à¦Ÿ à¦¦à¦¿à¦²à§‡ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦° à¦¡à¦¿à¦Ÿà§‡à¦‡à¦²à¦¸ à¦¸à¦¹ à¦¨à§‹à¦Ÿà¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦¸à§à¦¬à§Ÿà¦‚à¦•à§à¦°à¦¿à§Ÿà¦­à¦¾à¦¬à§‡ à¦‰à¦•à§à¦¤ à¦à¦¡à¦®à¦¿à¦¨ à¦—à§à¦°à§à¦ªà§‡ à¦šà¦²à§‡ à¦¯à¦¾à¦¬à§‡à¥¤
                  </p>
                </div>
              </div>

              {/* Live Chat Socket.io Server Settings Card */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-amber-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 animate-pulse" />
                    Live Chat Socket.io Server Settings (à¦²à¦¾à¦‡à¦­ à¦šà§à¦¯à¦¾à¦Ÿ à¦¸à¦•à§‡à¦Ÿ à¦¸à¦¾à¦°à§à¦­à¦¾à¦° à¦¸à§‡à¦Ÿà¦¿à¦‚à¦¸)
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
                    Socket Server Custom URL (à¦¸à¦•à§‡à¦Ÿ à¦¸à¦¾à¦°à§à¦­à¦¾à¦° à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦‡à¦‰à¦†à¦°à¦à¦²)
                  </label>
                  <input
                    type="text"
                    value={socketServerUrl}
                    onChange={(e) => setSocketServerUrl(e.target.value)}
                    placeholder="e.g. https://bodytouchbd.com:3000 (à¦…à¦¥à¦¬à¦¾ à¦–à¦¾à¦²à¦¿ à¦°à¦¾à¦–à§à¦¨)"
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
                    SMTP / Email SMS Gateway Settings (à¦à¦¸à¦à¦®à¦à¦¸ à¦“ à¦‡à¦®à§‡à¦‡à¦² à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦—à§‡à¦Ÿà¦“à¦¯à¦¼à§‡)
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
                  Configure your primary SMTP Server credentials to send secure verification OTP emails (SMS equivalents) to users during login and registration. Verification is locked to <strong className="text-teal-400">MUST (à¦¬à¦¾à¦§à§à¦¯à¦¤à¦¾à¦®à§‚à¦²à¦•)</strong> for absolute portal security.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      SMTP Host (à¦‡à¦®à§‡à¦‡à¦² à¦¹à§‹à¦¸à§à¦Ÿ)
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
                      SMTP Port (à¦‡à¦®à§‡à¦‡à¦² à¦ªà§‹à¦°à§à¦Ÿ)
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
                      Sender Name (à¦ªà§à¦°à§‡à¦°à¦•à§‡à¦° à¦¨à¦¾à¦®)
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
                      SMTP User Email (à¦‡à¦‰à¦œà¦¾à¦° à¦‡à¦®à§‡à¦‡à¦²)
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
                      SMTP App Password (à¦¸à¦¿à¦•à¦¿à¦‰à¦° à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡)
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
                      à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨à§‡à¦° (OTP) à¦œà¦¨à§à¦¯ à¦†à¦²à¦¾à¦¦à¦¾ à¦œà¦¿à¦®à§‡à¦‡à¦² à¦¬à§à¦¯à¦¬à¦¹à¦¾à¦° à¦•à¦°à§à¦¨ (Use Separate Gmail for OTP codes)
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
                          Verification OTP Specific Gateway (à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦“à¦Ÿà¦¿à¦ªà¦¿ à¦ªà¦¾à¦ à¦¾à¦¨à§‹à¦° à¦—à§‡à¦Ÿà¦“à¦¯à¦¼à§‡)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                            OTP SMTP Host (à¦¹à§‹à¦¸à§à¦Ÿ)
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
                            OTP SMTP Port (à¦ªà§‹à¦°à§à¦Ÿ)
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
                            OTP Sender Name (à¦ªà§à¦°à§‡à¦°à¦•à§‡à¦° à¦¨à¦¾à¦®)
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
                            OTP SMTP User Email (à¦­à§‡à¦°à¦¿à¦«à¦¿à¦•à§‡à¦¶à¦¨ à¦œà¦¿à¦®à§‡à¦‡à¦²)
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
                            OTP App Password (à¦…à§à¦¯à¦¾à¦ª à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡)
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
                    <span>Login & Registration Email Verifications: <b>ENFORCED / MUST (à¦¬à¦¾à¦§à§à¦¯à¦¤à¦¾à¦®à§‚à¦²à¦• à¦¸à¦•à§à¦°à¦¿à§Ÿ)</b></span>
                  </div>
                </div>

                {smtpSaveError && (
                  <div className="text-xs text-rose-450 font-semibold bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
                    âš ï¸ {smtpSaveError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSmtpSettings}
                    className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                  >
                    <Save className="w-4 h-4 text-white" />
                    Save SMTP Configuration (à¦—à§‡à¦Ÿà¦“à§Ÿà§‡ à¦¸à§‡à¦­ à¦•à¦°à§à¦¨)
                  </button>
                </div>

                <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                  <p>
                    âš ï¸ <b>à¦œà¦¿à¦®à§‡à¦‡à¦² (Gmail) à¦à¦¸à¦à¦®à¦à¦¸ à¦“à¦Ÿà¦¿à¦ªà¦¿ à¦—à§‡à¦Ÿà¦“à¦¯à¦¼à§‡ à¦¨à¦¿à¦°à§à¦¦à§‡à¦¶à¦¾à¦¬à¦²à§€:</b>
                  </p>
                  <p>
                    à§§. à¦†à¦ªà¦¨à¦¾à¦° à¦œà¦¿à¦®à§‡à¦‡à¦² à¦…à§à¦¯à¦¾à¦•à¦¾à¦‰à¦¨à§à¦Ÿà§‡ à¦ªà§à¦°à¦¬à§‡à¦¶ à¦•à¦°à§‡ <b>2-Step Verification</b> à¦šà¦¾à¦²à§ à¦•à¦°à§à¦¨à¥¤
                  </p>
                  <p>
                    à§¨. 2-Step Verification à¦ªà§‡à¦œà§‡à¦° à¦¨à¦¿à¦šà§‡à¦° à¦…à¦‚à¦¶à§‡ <b>App Passwords</b> à¦ à¦—à¦¿à§Ÿà§‡ à¦à¦•à¦Ÿà¦¿ à¦¨à¦¤à§à¦¨ à¦…à§à¦¯à¦¾à¦ª à¦ªà¦¾à¦¸à¦“à§Ÿà¦¾à¦°à§à¦¡ à¦œà§‡à¦¨à¦¾à¦°à§‡à¦Ÿ à¦•à¦°à§à¦¨à¥¤
                  </p>
                  <p>
                    à§©. à¦¸à§‡à¦–à¦¾à¦¨ à¦¥à§‡à¦•à§‡ à¦ªà§à¦°à¦¾à¦ªà§à¦¤ à§§à§¬ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¸à¦¿à¦•à¦¿à¦‰à¦° à¦•à§‹à¦¡à¦Ÿà¦¿ à¦‰à¦ªà¦°à§‡ <b>SMTP App Password</b> à¦à¦° à¦˜à¦°à§‡ à¦¬à¦¸à¦¿à§Ÿà§‡ à¦¦à¦¿à§Ÿà§‡ à¦¸à§‡à¦­ à¦•à¦°à§à¦¨à¥¤
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
                        Google Sheets Integration (à¦—à§à¦—à¦² à¦¶à§€à¦Ÿ à¦‡à¦¨à§à¦Ÿà¦¿à¦—à§à¦°à§‡à¦¶à¦¨)
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
                      Google Sheets Web Publish Link / Embed URL (à¦—à§à¦—à¦² à¦¶à§€à¦Ÿ à¦ªà¦¾à¦¬à¦²à¦¿à¦¶ à¦²à¦¿à¦™à§à¦•)
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
                          alert("âœ… Google Sheets synchronization URL successfully updated and saved in system database!");
                        } else {
                          alert("âš ï¸ Google Sheets save handler is not available.");
                        }
                      }}
                      className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                    >
                      <Save className="w-4 h-4 text-white" />
                      Save Google Sheet Link (à¦¶à§€à¦Ÿ à¦²à¦¿à¦™à§à¦• à¦¸à§‡à¦­ à¦•à¦°à§à¦¨)
                    </button>
                  </div>

                  <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                    <p>
                      á½Œa <b>à¦—à§à¦—à¦² à¦¶à§€à¦Ÿ à¦¸à§‡à¦Ÿà¦†à¦ª à¦¨à¦¿à¦°à§à¦¦à§‡à¦¶à¦¾à¦¬à¦²à§€:</b>
                    </p>
                    <p>
                      à§§. à¦†à¦ªà¦¨à¦¾à¦° à¦—à§à¦—à¦² à¦¸à§à¦ªà§à¦°à§‡à¦¡à¦¶à§€à¦Ÿà§‡ (Google Sheet) à¦—à¦¿à§Ÿà§‡ à¦¡à¦¾à¦¨à¦ªà¦¾à¦¶à§‡à¦° à¦•à§‹à¦£à¦¾à§Ÿ <b>Share</b> à¦ à¦•à§à¦²à¦¿à¦• à¦•à¦°à§à¦¨à¥¤
                    </p>
                    <p>
                      à§¨. <b>File &gt; Share &gt; Publish to web</b> à¦ à¦•à§à¦²à¦¿à¦• à¦•à¦°à§‡ à¦ªà§à¦°à§‹ à¦¡à¦•à§à¦®à§‡à¦¨à§à¦Ÿà¦Ÿà¦¿ "Web Page" à¦¹à¦¿à¦¸à§‡à¦¬à§‡ à¦ªà¦¾à¦¬à¦²à¦¿à¦¶ (Publish) à¦•à¦°à§à¦¨à¥¤
                    </p>
                    <p>
                      à§©. à¦ªà¦¾à¦¬à¦²à¦¿à¦¶ à¦•à¦°à¦¾à¦° à¦ªà¦° à¦¯à§‡ à¦²à¦¿à¦™à§à¦•à¦Ÿà¦¿ à¦ªà¦¾à¦¬à§‡à¦¨, à¦¸à§‡à¦Ÿà¦¿ à¦•à¦ªà¦¿ à¦•à¦°à§‡ à¦‰à¦ªà¦°à§‡à¦° à¦˜à¦°à§‡ à¦¬à¦¸à¦¿à§Ÿà§‡ <b>Save Google Sheet Link</b> à¦¬à¦¾à¦Ÿà¦¨à§‡ à¦•à§à¦²à¦¿à¦• à¦•à¦°à§à¦¨à¥¤
                    </p>
                  </div>
                </div>
              </div>


              {/* SMTP Email Queue Logs Panel */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-blue-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-2 font-mono">
                    <Mail className="w-4 h-4 text-blue-500" />
                    SMTP Live Email Queue Logs (à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦® à¦‡à¦®à§‡à¦‡à¦² à¦²à¦—)
                  </h4>
                  {emailLogs.length > 0 && (
                    <button
                      onClick={onClearEmailLogs}
                      className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-550/20 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      Clear Logs (à¦®à§à¦›à§‡ à¦«à§‡à¦²à§à¦¨)
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
                                {log.status === 'Delivered' ? 'á½¾2 DELIVERED' : log.status === 'Pending' ? 'â³ PENDING' : 'á½“4 FAILED'}
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
                    Emergency Notice & Slider Text Control (à¦œà¦°à§à¦°à§€ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦“ à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦° à¦²à§‡à¦–à¦¾ à¦¨à¦¿à¦¯à¦¼à¦¨à§à¦¤à§à¦°à¦£)
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  à¦¹à§‹à¦®à¦ªà§‡à¦œà§‡à¦° à¦¸à§à¦•à§à¦°à¦²à¦¿à¦‚ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¬à¦¾à¦° à¦à¦¬à¦‚ à¦›à¦¬à¦¿ à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦°à§‡à¦° à¦œà¦°à§à¦°à¦¿ à¦¨à§‹à¦Ÿà¦¿à¦¶à§‡à¦° à¦²à§‡à¦–à¦¾à¦Ÿà¦¿ à¦à¦–à¦¾à¦¨ à¦¥à§‡à¦•à§‡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à§‡à¦¨à¥¤ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦°à¦¦à§‡à¦° à¦¸à§à¦•à§à¦°à¦¿à¦¨à§‡ à¦à¦Ÿà¦¿ à¦°à¦¿à¦¯à¦¼à§‡à¦²-à¦Ÿà¦¾à¦‡à¦®à§‡ à¦†à¦ªà¦¡à§‡à¦Ÿ à¦¹à¦¯à¦¼à§‡ à¦¯à¦¾à¦¬à§‡à¥¤
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                    á½ª8 Notice Text Content (à¦œà¦°à§à¦°à§€ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦à¦° à¦²à§‡à¦–à¦¾)
                  </label>
                  <textarea
                    rows={2}
                    value={editableNotice}
                    onChange={(e) => setEditableNotice(e.target.value)}
                    placeholder="à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸à§‡à¦° à¦¨à§à¦¯à§‚à¦¨à¦¤à¦® à§§ à¦˜à¦£à§à¦Ÿà¦¾ à¦ªà§‚à¦°à§à¦¬à§‡ à¦¬à§à¦•à¦¿à¦‚ à¦¦à¦¿à¦¬à§‡à¦¨à¥¤ à¦¸à¦¾à¦ªà§‹à¦°à§à¦Ÿà§‡ à¦•à¦¥à¦¾ à¦¨à¦¾ à¦¬à¦²à§‡ à¦•à§à¦¯à¦¾à¦® à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦¬à§à¦•à¦¿à¦‚ à¦¦à¦¿à¦¬à§‡à¦¨ à¦¨à¦¾"
                    className="w-full bg-black/40 border border-[#232733] focus:border-rose-500 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none placeholder-slate-700 leading-relaxed"
                  />
                </div>

                <div className="bg-[#18080c] border border-rose-550/15 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 font-mono block mb-1">LIVE PREVIEW ON CLIENT INTERFACE:</span>
                  <div className="text-[11.5px] font-bold text-rose-250 leading-relaxed font-sans select-none">
                    á½Ž2 {editableNotice || 'à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸à§‡à¦° à¦¨à§à¦¯à§‚à¦¨à¦¤à¦® à§§ à¦˜à¦£à§à¦Ÿà¦¾ à¦ªà§‚à¦°à§à¦¬à§‡ à¦¬à§à¦•à¦¿à¦‚ à¦¦à¦¿à¦¬à§‡à¦¨à¥¤ à¦¸à¦¾à¦ªà§‹à¦°à§à¦Ÿà§‡ à¦•à¦¥à¦¾ à¦¨à¦¾ à¦¬à¦²à§‡ à¦•à§à¦¯à¦¾à¦® à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦¬à§à¦•à¦¿à¦‚ à¦¦à¦¿à¦¬à§‡à¦¨ à¦¨à¦¾'}
                  </div>
                </div>

              </div>

              {/* HIGH-FIDELITY DYNAMIC HERO CAROUSEL GRAPHIC MANAGER */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-amber-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    Manage Hero Slides & Graphics (à¦¹à¦¿à¦°à§‹ à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦° à¦“ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦®à§à¦¯à¦¾à¦¨à§‡à¦œà¦¾à¦°)
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 py-1 px-2.5 rounded-lg font-black font-mono">
                    ACTIVE: {sliderSlides.length || 3} SLIDES
                  </span>
                </div>
                
                <p className="text-slate-400 text-xs leading-relaxed">
                  à¦†à¦ªà¦¨à¦¾à¦° à¦¹à§‹à¦®à¦ªà§‡à¦œà§‡à¦° à¦—à§‹à¦²à§à¦¡à§‡à¦¨ à¦…à§à¦¯à¦¾à¦¨à¦¿à¦®à§‡à¦Ÿà§‡à¦¡ à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦°à§‡à¦° (Golden Border Slider) à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦°, à¦›à¦¬à¦¿, à¦¬à§œ à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦² à¦à¦¬à¦‚ à¦¸à¦¬-à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦² à¦à¦–à¦¾à¦¨ à¦¥à§‡à¦•à§‡ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦•à¦°à§à¦¨à¥¤ à¦•à§‹à¦¨à§‹ à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦…à§à¦¯à¦¾à¦¡ à¦¨à¦¾ à¦¥à¦¾à¦•à¦²à§‡ à¦ªà§‚à¦°à§à¦¬à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦¿à¦¤ à§©à¦Ÿà¦¿ à¦ªà§à¦°à¦¿à¦®à¦¿à§Ÿà¦¾à¦® à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¸à§à¦¬à§Ÿà¦‚à¦•à§à¦°à¦¿à§Ÿà¦­à¦¾à¦¬à§‡ à¦¦à§‡à¦–à¦¾à¦¬à§‡à¥¤
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
                    á½Œb Active Banner Slides in Carousel ({sliderSlides.length === 0 ? "Default/à¦ªà§‚à¦°à§à¦¬à¦¨à¦¿à¦°à§à¦§à¦¾à¦°à¦¿à¦¤" : "Customized/à¦•à¦¾à¦¸à§à¦Ÿà¦®"})
                  </span>

                  {sliderSlides.length === 0 ? (
                    <div className="p-4 bg-black/40 border border-[#232733] border-dashed rounded-xl text-center text-slate-500 text-xs">
                      à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨à§‡ à¦•à§‹à¦¨à§‹ à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¤à§ˆà¦°à¦¿ à¦•à¦°à¦¾ à¦¨à§‡à¦‡à¥¤ à¦¸à¦¿à¦¸à§à¦Ÿà§‡à¦®à§‡à¦° à¦¡à¦¿à¦«à¦²à§à¦Ÿ à§©à¦Ÿà¦¿ à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦° à¦‡à¦®à§‡à¦œ à¦“ à¦œà¦°à§à¦°à¦¿ à¦¨à§‹à¦Ÿà¦¿à¦¶ à¦¦à§‡à¦–à¦¾à¦šà§à¦›à§‡à¥¤ à¦¨à¦¿à¦šà§‡à¦° à¦«à¦°à§à¦® à¦¥à§‡à¦•à§‡ à¦†à¦ªà¦¨à¦¾à¦° à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦¸à§à¦²à¦¾à¦‡à¦¡à¦¾à¦° à¦¯à§à¦•à§à¦¤ à¦•à¦°à§à¦¨à¥¤
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
                    {isEditingSlide ? "âš™ï¸ Edit Selected Slide Properties (à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦à¦¡à¦¿à¦Ÿ à¦•à¦°à§à¦¨)" : "âž• Add New Slide/Announcement Graphics (à¦¨à¦¤à§à¦¨ à¦¸à§à¦²à¦¾à¦‡à¦¡ à¦¯à§‹à¦— à¦•à¦°à§à¦¨)"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Title input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Slide Title Text (à¦¸à§à¦²à¦¾à¦‡à¦¡à§‡à¦° à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦²) *</label>
                      <input 
                        type="text"
                        required
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        placeholder="e.g. Premium Escorts & Models / à¦¡à¦² à¦¹à¦¸à¦ªà¦¿à¦Ÿà¦¾à¦² à¦…à¦«à¦¾à¦°à¦¸"
                        className="w-full bg-black/40 border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none placeholder-slate-700"
                      />
                    </div>

                    {/* Subtitle input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Subtitle Detail Text (à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¬à¦¾ à¦¸à¦¬à¦Ÿà¦¾à¦‡à¦Ÿà§‡à¦²)</label>
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
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Label Text (à¦›à§‹à¦Ÿ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦²à§‡à¦–à¦¾)</label>
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
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Icon representation (à¦†à¦‡à¦•à¦¨ à¦Ÿà¦¾à¦‡à¦ª)</label>
                      <select
                        value={slideIconName}
                        onChange={(e) => setSlideIconName(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="star">â˜… Golden Star (à¦¸à§‹à¦¨à¦¾à¦²à§€ à¦¤à¦¾à¦°à¦¾)</option>
                        <option value="bell">á½‘4 Warning/Info Bell (à¦˜à¦£à§à¦Ÿà¦¾ - à¦à¦¨à¦¿à¦®à§‡à¦¶à¦¨)</option>
                        <option value="shield">á½®1ï¸ Secure Shield (à¦¸à¦¿à¦•à¦¿à¦‰à¦°à¦¿à¦Ÿà¦¿ à¦¶à¦¿à¦²à§à¦¡)</option>
                        <option value="heart">á½‰6 Red Heart (à¦²à¦¾à¦­ à¦†à¦‡à¦•à¦¨ - à¦à¦¨à¦¿à¦®à§‡à¦¶à¦¨)</option>
                        <option value="users">á½†5 Companion Partners (à¦‡à¦‰à¦œà¦¾à¦° à¦ªà¦¾à¦°à§à¦Ÿà¦¨à¦¾à¦°à¦¸)</option>
                        <option value="trophy">á¼¼6 Premium Elite Trophy (à¦Ÿà§à¦°à¦«à¦¿ à¦†à¦‡à¦•à¦¨)</option>
                      </select>
                    </div>

                    {/* Badge Color preset selection */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Gradient Color (à¦¬à§à¦¯à¦¾à¦œ à¦•à¦¾à¦²à¦¾à¦° à¦¸à§à¦•à¦¿à¦®)</label>
                      <select
                        value={slideBadgeColor}
                        onChange={(e) => setSlideBadgeColor(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="from-pink-500 to-rose-600">Rose/Pink (à¦—à§‹à¦²à¦¾à¦ªà§€-à¦²à¦¾à¦²)</option>
                        <option value="from-amber-400 to-red-650">Amber/Orange-Red (à¦†à¦—à§à¦¨à§‡à¦° à¦®à¦¤ à¦•à¦®à¦²à¦¾)</option>
                        <option value="from-cyan-500 to-blue-600">Ocean Cyan/Blue (à¦¨à§€à¦²-à¦†à¦•à¦¾à¦¶à§€)</option>
                        <option value="from-emerald-500 to-teal-700">Emerald/Teal Green (à¦¸à¦¬à§à¦œ)</option>
                        <option value="from-purple-500 to-indigo-650">Cosmic Purple (à¦¬à§‡à¦—à§à¦¨à§€)</option>
                      </select>
                    </div>

                    {/* Image URL input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Hero Photo Banner URL (à¦›à¦¬à¦¿à¦° à¦“à§Ÿà§‡à¦¬ à¦²à¦¿à¦‚à¦•) *</label>
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
                      âœ¨ Click one premium preset to instantly import Photo URL (à¦ªà§à¦°à¦¿à¦®à¦¿à§Ÿà¦¾à¦® à¦›à¦¬à¦¿ à¦¸à¦¿à¦²à§‡à¦•à§à¦Ÿ à¦•à¦°à§à¦¨):
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
              {/* Cloud Sync Settings */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-amber-500/10 space-y-5 text-left">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/5 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-amber-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                        Hostinger Cloud Sync Setup
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Connect your website to real-time Cloud Firestore database. Syncs agents, companions, and orders instantly.
                      </p>
                    </div>
                  </div>
                  <div>
                    {isRealFirebaseEnabled() ? (
                      <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-mono">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Real Cloud Sync Active
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-mono">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        Local Offline Mode Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-[#0a0c14] border border-blue-500/10 rounded-xl text-[11px] text-slate-400 leading-relaxed font-sans font-medium space-y-1.5">
                  <p className="text-white font-bold mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Instructions for Hostinger & Cloudflare Real-Time Data Sync:xœì½ûr#Ç•'üÿ<EŠR˜ L€ Iô…Ûl	"Ù-®›Ý\’-¦§G*E $ …­*ˆMÓa;Â£g_x5úÖ£­we¶B#KÚO{clÿ±/Bëööœ¼TeUefe`_$U„ÔP™••yòÜówþ‚ä®+£«¡øZù-!¹î“È'×¼ÀÝwB—¬ùÃÐï»ÄvH;pþ$£ÀÛmGäÐ‹zðo#?pÉº9Ø¬¦zf¹¡,ÖH«ÓÞ_w÷Ik4"Þ0Õ6À®EÞ°²áù£#õ\øcxàuÇyþGÝq‡‘çôÃ)k©F6†‘°%]“}·ï²qô½ö;d×y—ÎÞÆ	Ã˜Â£—kdv½îû¾ÓÁîáEaZ``ÑºnDø½É&¡öv8•g7käöˆ>Sõ Xxü‘?È«~ˆ+4ïÃhßìEƒ>é@£6PÈ9ð¸;ŒœaD€œúÕÈ¸$<¶­Gye¡ã½{õ/òßÃ×0ùNÞtîêL7ð:ÿWmûý°Ú ƒÎJòq‰tQu™Dî½¨z/„£jè¼}¿ß™QÎM¦ÿpä´ÝêQµQk*ï‡}ÈBn³ß÷aé3ï4ê£{wÙs÷û|=Ü ôMoû°ÛªKÍ:‰øfµzèu`fi“?ô5%ÉFimo’¸GêÑ-Ðái†îGãHÓ}t4‚wÁAÎhîx×éÝÕãƒýÖÈƒçß×Üæ×zPËêqÅ#«WIèF×x›Š[‹œ hºF;›Óõ1‚¹s{°hn°:ÓÚü¡³{T«Õt“Öâ°z0î÷É~—MÿÂrìûN0û§zçùÅ¥Å‹KK¸Híq¸Â¿vûðÿf½N<ì¸ê½>ÝŠUkM¶z‡=xe¼Tò0ùÊ^„XÇþ8ê{C·:ô‡®zàJ‚Ôl„g“TOß\rÔÊÇ°Ù)G°q³‰hvßïEþ¸Ý«:£Ñwtû¬Ñ-ê&O’fáùeé•6™ˆV+÷øµrèî¯ÁõÅ>]+ßS§%àÖ”÷uà€b]¹5B%ÕéÏ=A:†ñ°á”$æ¸ÝÙ¹oMh·øwÛ<´}é;ÚÎ_»`k8]—¼2n¿FÑÓ@Þ|HlDå(<Õt
Dÿ…#?úŽÀŸ]ßrÃÐéBd×b›ëO•ÇãbÃ*«˜äšO¦¤,.-7/\¼t¹þ-"oÍ×¹ï)+r¢qÈæÚ%ßû©Xì¼™ô¦)·	ºLHßu:HÑÛwî¹x»|ª.7ë‹br“éÃïhgì›e-Ñg®"Í\ Ùz‹úî=‚ÿ«Îˆ:‡pGQµ¡öí£È*‡Ê6»A½’@þèÊ[=†MÐé»è,sê©	]æ;Ýª7ìx]¿z(¨ç¿ë+ÉwÍf]&Àbö”æGœ„œ—áyÙgzÔ¯ÚáÖjžÕ¡TG¾G£t2áÁƒ°Úvé78ŸÀVIØs:þaµß%N;òÞuWÂ¶Ów«—/I&—âÕ5\‹:YS›y™ô„S¾úŒzÓ¬VILl•¢#vmÕ¢ÀTætÛÈL(6¤’#áþMÌ}­âœ&wàN¿“¦ñå7pt¤ëÂÚ“‘Qzá5‚WÐQþ7gâòÂ×é‹Þ:û}·óX‰lØy`Ã’²Ôø¡Kyý’D]ìK`ö9éJ¡b€KLúÅrS4~*iqZ¸8aoQKlnšuza›ñ°IH/»B|
E"M¨¹[Ó”|¼ð"YìÊ<~msosc—|ÜÚÞØiímÞºÙºAZ;-²¾¹³±¶wkç²×z%ÓjÂg“äY9f½çìc‡d¶Dã†³ùm¨3$.°…ì»QN‰È+XH¦T³ÔÈnún–F¢u.JÊ˜x,’}VKÅ·2æˆBÁ¹Ò[–—V÷T¶Û2*³Êm³¨V¢®÷ýý¬‡Á÷èÿ¡7ÀŽÆýPÇ‰·Ü(ðG~ß‹œ!i®”r;Ø‡7ü6ÝÚ!Ùr†F$+§'¿;=ùýéÉCrzòKøï§'_žüñôäø?|þüôÁßŸž|‰œ<¢ÿ†þüÙéÉ§ðGÞ®º²Ð[VÌ2ˆÊFÁyñaòf®†b|Û!/¾¸X½á¾&æ5?€—ñERéÁJ¢a@€`¼š, ÑPs8Þ¯²ÖcjzÑ<qkÝô³ÞsÞq ù×ÿò_áÓu˜B`ìóäÅÐ{ñÅ¹Y‡‘? ýxžDÜ¨¥ç°,0‹°:ãQV¡C:GCgàÏë³‡Ãƒ‰3õ=ø‡tñ—6°-ìk0‚‹=€	çGnþ¥òžÛ~Ì|",Ÿ*0¯ˆüª-ä4Ì.ÀwÂ$¤÷0½‡mÜ ðµUlFÜŠ0t'æÅü /ø‰_ìIÚ$ÝoÃ¬{GÕ}7:tÝaz§$’©
Óo€§ãnÕ;öüðê×¿úïÿ÷Ñ/RïyÿÊýIoº$"¿",ðµ¤}efñÜýàXb Ëu…°N¸ƒÄ22:-og®‚0xa¨ZJù”W¡$0wä¦{’íÆ^…­¤¤üúSV|çùF£±Ôpî¦ØmšK¶¯¿’¡6usY¬Ì„×~žo¶/6ý»d°ª×PÌñ«+Û}Ø.:µ#~!ËmÔHk}ÜÜxDðîÞÎæÚY€?_ÛÜéL^Ýh­ßØ¼¹ì¸æ'§~ä¢ÈQžž< L¿úèôÁ{ŒSîKÿIXô—§Þ?=ùPþüõ£äÁMÅt#ÛQÞîŽ÷^ûŽ•Š“[À†‡Ñº{àŒûQeî?(ïSíõÀêpÁX ¿\%C÷PÐæ&úÞ¸©nìÊs¼í	ÜhÕwžíácy'µÈ¿áºÁZe®¸Ô1UY¸ó7Nõ‡õêå»Ýy2ûæ¬i<ž4í]aŒÛÊ6OµÐ¸•Î|§†#½
þùÑà#ˆ7=0ú³rÈssš•Ë­É[{=Itv<‘×ŽÈÌÇ¼ãû3Äéwè÷üÖÞÒ¼61N½Ò”“Ï–{…lƒÔF”­jßÀëÌk~Á)Z3¢»	´|@¸BîÜUÔ°`þð6•÷»™…ÓÏ·®EåN­VË®ÿ<Ÿ‰»Ú)†å»™Ù•Y!ªlÒûª/•ž¾¶ß'á`…þø‡”{.åm8%Õ;Ì‹ÜåûŸÇ`Xw”?rOz–;¨mo•=7wVô”ÿœjë¯¶~Ð¢†Ö<Y{uso¯uýÖÍëód÷¯nìÅì^›j•™ðjÃàbO<ái_ú2ÚðK9OzlÅä½éš*oºÎsŸ²jtö»Úé^èý©˜)œ˜”n –0…jäW£€þ@£Ï?$î:éŽäËø¾‹õ”¦±É¦1«“‚]ñîQÖŒê]ZSËè¥GIÚ‚®ºÀ¾SUF_ÔŽŒ5–Y¼.˜ó«Üä1zeó¿ Ì··ZÌëÃCA>„@LG¤²Æ:š_kNÐ	iöèœ…º(ïåóWü,t>`}·±@’’zo8Gn0¹¸X#[­›­ëd÷ö+Uä»äöÍõX!ÜEí/ÑîNO~{zò'ªþ=þÿþ ôº¿­°š·Ãž|qúà§ êÔ½BÎœü»H'Mä=Î©,gT©‚òYîÑµwÜ£ÕcÑè=v¾Tóƒîò…&A&pÐ÷«=¯Ó»2-å²V'÷ÌfÙ¯Ê3º,•;ßïõË98q—Åî(½&Ï¡Âç‚£{ÂÒ¢]ËT®§Ì{kãé¦x ÎŸÞ—ê-îÜfÏÈ›p ï{&Ð`ÖÓûÞøBþü‡ŸwHBO\q¾<„©Çºé¥£Ô:ÌïqçR­s-Êg$1’Î[ÈÈ‚·‰-ÆÍõ"ï’Ì;‘¯ü?H%¹Aè¹µ¾;ìF½ûÂ·öCà{¡:	Ân4adqéÛ£0xÙDbðÊ¸ftª7»Pm?ô†°CkÔ…*oÁÄàâì‡~¹ý#0øw‡xø"òIÄÆUÀ>ÂS,šI\ Ç>G0“Rd†Æúþ@ð`¯… Ï‡è¤“þÒ[»L\ö6súË[&ÉÅŒ0áÉ\%9àõ_H†és`yJ¤X8BƒÄ[Ø…iÓšUš<âJqÓ†
ëw³ÛVrã‰À\&ˆ'ü\‰ ÈxñLÄïE}°UÞZgtÓYJ{KÿRFæ¥ªâhæPû]—E†õBÇÎø=§’×yW9Y‡j³–L*¥®E®÷ÀV{Õ;Mªs2ñ‚MÈÜïhxÐOF&­eºÔCS'/iT"ÝHe-Ø‹àuYR¤&‹”\Ç:O×b2ÈíxãAp!äëþ9¹éK±’Ž{ ¬­CŽÀ(¦ŽbôIñ|Àù1Gd‹h<g~1³¨ dŽ¬ÌM~j©Â	Ÿº¦4½Ö™\Tÿ„Í,¯´j4ØQëºTG“ÆÙ”Ì%eêäC{&¥£¦óÅbîcb7xÑ† Ð¹)VŒx“B1/.[q/®Rb_\“ÈSvUª²«P¶"9wìßGŒ,öËb¸DÂ[[ª	!µZMëYU_‰¿µ“ìa®P„Ô-Gµ	ÜÐ%ú½o·†ôVë;ùŒtlû¾oIISÐ~ø-î2j;âÊ
½’Çms¬
8[‘½†#.¡éì¸xh6È^úŒ¸Šy!ÿçÃbU Ë$÷/_&’5˜™fu‰)L[ÞÐ£y(u©ï£„&…>[½Þ¤î‰Ë2Ê'.ÛhŸ¸Ês\ý*#«‚_P÷ü–3º#ñ·»/ã€âbñ@è­ 'ß¯V3ÊÄÖjÞ°Ýw`óâ3¬ošé¡84iÌ:ÌÜxöJÖ 0ÄáÄeŠÇ‰K—“çfr!8Máw6¡WJØÙ9)˜ˆbê™§Ô¬Ž/¦/AVÌmW±À:³ òÞMïàJñ¤c(4Ý¨xúSŒa…ÌÎžñÝ§áA ê:MèÃ£‹Â ˆTþX½¤4Úï¦£Hì*>Ä.c¤U\<âjbÊ˜ž0;k&RU,¶,™”'’‰¤c½fb0úˆÓáã·P:S®æÔíù’F{¾8=ùt…ðtÃ¹•Ç#¾ ‰7ëñ!+•µ)Ÿ·¢ÞéÄˆ™fh"6ƒgÉÎ`,Ž+f¦+™—ØQ'ÅsÒñÍÌé“z'‰ëƒ0ì£éåÌº¨"mm‰&Ãÿ¾=X=N~ÕjÊÚŸæJfØ¿Â,Géãôòë·[olmÜÜ#×[{¯·ÞØ%­›ëäÆæÖæÞîcË«ï½:GfÖ@7ióìï<ßXnÔî]m–}³t–ýôóêy¦q¹´ú5håE4âz†Üúu–ðM¶£<’\gË$çÓÆ™>þÿSÜÿ˜œž|H?|zòKšMÿïð‘%q~zzò¯4øÿ!÷?¤÷ýN—ÖiZÿ†?¦ÉêÛsÂæ	¾>h¨~·Ûwç‰ÀOÔñW—Jj§Iï4.æô¶]kÛwÉpŒ,”ñ=§Í³öûpj–9˜p4º†>c„iNú<bŸÁ Ú.|Q¥ëRäÃãa+háŽh"=ê¥4!3ìÃ‘Ûö0Ç>ôZFŠÎÀ|‚§‘îØë8Ã6&]c<†'×Ÿ1§~Ëï¸}²Cg”#é]s]~ØM`ëU¨Àÿ5Ëó bA?¢KÌP|Ì“~ÅBF6I5#Øät›ÖuD¢€Þy¾³ï8wñÜYv§*ÓrŒñ~9+P±Ï"(p_nO‚ˆÝÇØ…2Sá’æ|³ŽÏÕõPÓÉ+âÓ6q.9Êºßï;Á®×jsŠâ'$µÍ-I‰N#¾Uéãô—‘Ýáí´¤ÆÉ¶Êïé(1ÙižeÄÿDd¶ÿ;ôùéÉO‰xÏ—„¿¿ ´¯÷ÙQ$øv®zzrB;ÈR¦àKÊu)³µššVO;£¹øœƒ	þVdd°Œ¬ìgœNB‡ýÿŠ=òãú©týÓß|¢™u5ü¤N—²9­Ïéì²"GE‹é¨Ëua#:†‰¿èYÒET ë‰Qâ›°o¯¹§ï®ÓÿëYõ´ &õxâÓuâ| íxâ›q<[ªÑà—Œ(†kHlÇ”ÜƒZ‡U
r£Ú¶50a*‡z16¨:=d#[W‡úqƒÊÄ¤*ÈØe_ñ×`\m–Ge9-•Ü+šmB—ÉL	jË¨$éJ–äDA…ŸZ}‘Òia‘T©VFyñý"5)4+0zÆÓY@læ`oŠëL‡ÓÛ³Ü³$ï|í½*÷Ñ¤aeä¡»9Ì¥ó£kªnpå”AºÉÒÈ,-tÓ¯^"£€®ž³U.%êtÒé¯ü™„¥z]ëTÔ(z‰¢PQí÷éÙßÉÁê²û{+·»³
Ç3º»c¡ötín*I'ÝáØøIîráõø6írªz<%Û<ñÒ–ÞçTWâ/Ã7º…ýðLíø$ýëéÚòLMtÏÓÖOrÓ«Aì¾)»^óµ+Hx}Üa‡F:ÏÎœí''(l^óˆ˜ò”ŒÈ@r» m®‰ÌMaÈL;fcf¤b‰ötO¤: ßô0î;ÁvßI¿,ü(pÞxnºÍ¾,hêöa#¤nàWÆf¦=ð¾Z»ãvÛÃJ 06Øó.ì¸JŒà‘éáÀé‡îÜ<Ý]ÚžÔ,F“ ;hùÑÒEO‘Ï±òc¬‰{¾»óüþÒ¥ËËwåc¬wžw›ûKœ»É1V©Sö+!šqo*ñ¾h¼’ft>ÏLL³W½b_1Ö¸„ÅJÚ&ëûQ˜sg[r*2v¶ý¶ Ã|\V:J‘tàÓº6ºìsoèaaœÕãcâƒêäEG+¤>Oàÿ@4ÚâA©T›mS·!GtºKH†u‚–üãb=h
ÆÎ¸ÑOâæØøJP|8{êXÃÍš´ûî¢†J@gg|²Z+©4©ƒ<OdøõWôôî)<Ö{Ôk^ã?Q_õCq Wr't!=ø˜vþOØ¤¢óƒÎ½Grž˜ƒsÏ™\ƒ	i*±`³·+C`<BøÍÇŒ’_t"Ð¨ëRç5}˜¨²Ññ’è6MH.´?¢m–œNTÏ=X^FI{>QÕp¢cÀÃ°ø¤nvÈKdvc}s¬ÝºymóúmåHƒyR¶ÀƒE(éä§È™Ð\} 1*æfÉ
™ÝÙ¸¾¹»·±Ca¨xî
í-9¥èúKúãŒo¥ûU¥ë¨‚ƒùÛØT~¯•†Â„=²Jº‡7é©qC¶9¿Ÿ%?ÐôO‹6©,l¹)}al¯Ö%0ÝŽLâçø€ðOù9F@¨Ô¼Ín÷]Ü;‡ò0¶½é¸‘ãõAÝÂY™'ìMYv†<ö¹š‰h"l(|±ìNÑ¿G6×œ'³ð–,Õ¼kN5ÇvEŠ¹ý““×+È/¯Õj]sÎ*.£ùŽõüÎ
PÍýË|÷!=°ƒÀØÆ¯ÇŸ
FÁÖ×xL\æ;û~×¿ôq 7ØŸˆ¥=ojèÂ"¯÷ÿðéjÍ:-¥¦<
i"²ò)¤›&Îë^öåF†M<í>˜Ü°kÍ»cèòÎVHzœ¼5D\[!ouß|áxî®ýÃÊÜý·ô«n¦b{
.O½E”kGµ^ÈÐKnlxÚ™([KÕS¦?<˜’á…ó!è¡æ4Ž5¯^X ë<Ä«¨ xn¿jÅ4®zØ:v]É‚›dáSp+£µÊì+?hí¾j¼3¡3…nb>£±_{Ý Š÷b…×€B­òþÚd•¨òjÀïA[`›¬E2
†Ýk!j£Cudi{‹XQÆXÒëüRŠ“àuü]nÐ§àŒñËðˆùÀMáa=aŠg¹˜	ßO–Å€Tá…ý8ab'¯mnëßd²ê@
èÂL ÉŽ¢Ä	à¹¨×DÑ-ùã¬Z-”§ûÇNé")»ˆ¾$^1m2&Z–:9ëMÓ'q°.ùÑ”"xfBKÇæÊT¯Ú¨Ë Ef8EãÓd|>g¨(š¹J7ß•ö›uã›­ë­õ™«7®Ó)ÝxçÖÚ6öf®îøX4¯¨ù•öö“íœx€0¡JómžíÃGÛj·š"ºé§µ…í¢ì6’ô’ï¶R† …èÎ'„XE„XÞö¯YB×YZö\é-Óê?¹JÿÁ¾?Õ0 Çß±ð¿;=ù¸|Ç[@Ž°ÚÐ·ø‹gšÆÉ)¿Ê R+*|¬ÕÖþðX5M¾ù¾ùäAÏë`æ[IôÓ~.N |Å¼°_ÐuÃÑÜS¥|Òa—V?™­v´Þ¸ØX¬²Â”Ï¤ê™Éö9'%”Õ¤A{“°úl·wnzþØÂü¢ã¯`è”V°€ÿ3þù™øê×…{B•“”:—&`[(¢ yÇ±«§ ÕO—H«—à!—’ÓÝBŸ—Vpl<pÇÂ{ƒ.	ƒöjò^÷‰ÓVgè"aäÅsg;¯Çþñ÷ßFaŽX‰Ž7œVsàlû`a­Îýªøªàº-r\Ô8E8VöÖ«¨R2½!ôR­'¤uQÂ`ß\j¯Wêô2Oç¨ŠžÄçF
tºÊ¿.zi¯5ÃÑµÐGinQˆƒõ—eÑBi+”­„­"pÈìËí¬Ôfê€•É·ÖE›­•H;‹³ÃKiP´âã ìºy‹Ü¸uýÖ&Ç€ÿU„c‡+‚1îUëb«Y+Õ`s€5áPÄùˆxÚŠìRb¦Ð-4¢¥e&’újø;Ä=T—q`—	N7/am°Jbg° =	r<›ú fÐL2©{11ËF™J]Tâ5$SGLäl\tàõ©ÑxeàŽ@DyH/ZãÁ0Ñh¾=GÈvg8h²š áçð¥Úú]ìn¼Û§;`Uh‘,ZWw‡~Q„Š‡kZóii^ÌÝ^%öXª©-Í{
ÜpÜÐÐèÃ®Å, ÏâÎN+\w"X ›¤3‚„›~6¢_›µÑBø­F¿‹¨1BE*1äé×ç…“™¾Äº¸|äqô¹/NâDJ¬ú4Y»rø°¬Í›
=NfùÒ©ù˜å„²D«÷ÌÁ{Yþ²‹ûuøóQ› SNÉ^pos]®#x×L<“ÖõÙmjí®-	ÕÏêÜ‹*ÁO[›¼Øì±3xJ€c—Ì,‰Åíå¢÷Ò­v1|©U$_º¿L<_jVÕg—A¢(•»zN¹ÅJUl1]”}ò’d–øÌzá·†¢©¯}&+OÃÍoõW\"ÙÇEV Žr’fÖ¶¾Ü|œÓž­W²R”*_˜žˆ.5&¡B–üËq¾h…_~ƒžÓ´|Úc‚åêÈ‰„1*0ÁE+.WœL^2‘œBØ©¹,‚ˆÄÅÅËK—î2€+ÛÄR_aa:-p$Å“Û5šµÛ;;hØZÛÛ|m#oxcswTŽ³É³¼†”uÁ9MÆz(ù3—RÅM2~E²”²´4^7}ØÔwžƒ¸C9Ø«èèÅyn§F6‡Õý±ÖM‡%ž³,™yBCî,ù™ÅÏyFcH=Tš\XÈàÝtIø<Üœvƒé¼^ekøõ»–˜=ŠÕ¢%VºÆ+ÆÂ*´ J×PÉOfáÇoñ}œòÄ/ÔèK²æ$¦û‚Iíñð¼N}2¼€·ÆŠïRRS/Æ½¬ÏšÛ¯Híã#v’wGH u=dµ¾‚ÁJUUbŒE`ršëó™z+àýŠBv1šÂE@G}«ˆ‹ú±…[FŸKY4Òä)¶ºð&¡ñ‚<ôò˜Â-tÅ5.lŠ4Mgâ•õŽ4Sœƒ³Ë¦Ì6e/†Õ‚À:0FŽ0ãÌU©Ï“¥Â0‘í4õsÅ¢à\%WÒl¹«'ÛX·kàÜ«‚Ú³D!»¯Â;SˆrëâNej_²%IkÈ)uƒah¤°ðl¶gÆY5ˆ@úyCêH ¯[n¹m–×fv,ˆÀæ–Ì¿•‹3™ôÔ@…0Èx‡Q8âÕ­%.ôtl.›%^Lj‚žî4.¢LGí;^×g8ˆ©µä?°¿½¯(GS±,Ú&c[ºÔ¸¸xùnPQi=.!íá½á­gãMGìÍ5+@	°Ž‡	…xY¶-¨J¤´ÌbáH6ž5¦Y±¯š?GÃf2žjäñŒ¿eŽFÃ-ÃœÔ"‡s›¦‘1¿”Í~Ö¡ÑÐÄ{s®€d˜‹b˜Œß²«©,‡ƒ÷²Ñ°HÄ>ÛÝéëê*Óx!¡|ú v&Šuò,;ËÍs—½Ûø’J¨[»(¡±rõA[½¹KV$¹…É…N'»‡^Ôî‘WØÙSI.»äûÔ–’¥mÎÆâ<ÙWbÂ»ÅIÙné*Lx{˜—ŽÚ=Çº&Ú4ë"aÏg/4á¹<qMz>4àä¡Í´µmª#)Ô1M«2šF‡£Ž3Ç8¾Ùïi£„°W9êKõÅ¦Vô¦en¦rªü[³YTCJˆû„md¥QÖ ‘@<aA¬Ö*†ß‹ù±ØW0i_ørþ¦Þâ¯?|}´Î~ßí‹8%¾â²>•´@@&KqG¬xëcH,Þßª¨Z×®6z[cæ˜ue:…m³TÄ--ªm»à18aB‰(–­¥ˆ\J­·ì¥°Âiº¦;³ˆJ¹!Šx&*ðŽÏÍ”!uÎ˜œI»š¨ê“å–f›‘g“>;Û±Håáˆ…Ö#ô™ç„>SLÊgÔÎ®Øh@*•’JÛDéRc»´t«ôT“2i©†%Ò	RíÊ§°«hÍÎÊÝÂÚ¢-Âš\ñ¾Z’PEgKÍ3ó¼u¦Ë×Ûœ°§ƒ|¹éÆŸ?ªÊÞéC4>ãWi(·é•Âk­omÞÜÜÝCl²×6HkmíÖí›{»ä{d}sgcmïÖÎäÖk;¯mn¼þØjã9¨/Ó¨ŒW˜ùHO6ïƒ#ò*ËÇ}OÚ«N(jOq<%2lãbc¹±È‘aëíz?ðÜG(ÅLa/c-¾%êŠ?f¢ZÅ¿â³/×íáÙD#ç'S¨Ž„y)dòe’a!œMT)ˆ[hHoØí!lÅÿÌììEÜØ¢„‘±T–.kEQX0˜j{”þÒ ^k_Y“Ž1QÐ¿õ›{›­©mvëf
¼ï[Š'ƒÿÄò:&AfÇ‘ÙçG¢œ`
ÌôýÓ“¯Ó¥®#˜Ÿ¬øèA¶¨£TNV9'¯bÝÀ#^ƒO“ÍK•iíÁwýw\…¨ŠÑÍ@~á·6È˜sÏé§jÖäl¢T‹Æ ö…°šý#Ø$Qö5qÆ âï‡p÷ÆÀñú4wÃ!°XíÀ=M°dø˜f^#{=}ÉÆˆ¦ˆ 	>àK B4þJ¶ñÀöb•æ@ßÚÛ¦ÏÂ!·Jq›p„ô‘´Ÿ°7n‹.þu†b„…Y!©4&¥ÝQüÜ´ªâ:Á»§²ËZ8÷¤²ç¼ã†d‘¬› Ö Ê>8îûÝ®ÛÙÒF;~ß¥Êö,¬•¼IWqÖ23Þ	^§ŠtŒu16*T•ª±¤÷ÈL2^Rx LÄŸã´ÎR¡§¢¼-Ul¼,­±˜ŽÐñ·àØÌögMeö®Üð³¼è<ú‚$Ùpš¡üÑEÎ¶ «"€Â§Ãà-j1î#öm´õ øˆÂç4Ï˜àÏÔªrºˆêð‹ò4E.Ê0OÃ{Q€×Ÿ À+þŸ½É'Œ—³÷ûI\Á$'*»¸§ØîœË¢¾š¥þÿïd°	hûzïo3Ð°Ÿ³ƒ\²~PUA¤Ç>âc
ŸÄÈØqU[méCCD¨lAÛDº,7i–C.¾S¯Õ—ïæt®fÂ ,™‚ö{&Ñ4yl“åšêw_Ží\„­Qöúç!áíØŽäf7±(Ù`¡™+³M¦LðmØ&N$þ=£sA±Qöí2…¥%«sQÏF4q\E¬[:{•ÙÔŸI›øÓÚ¾äV×ƒ?¢´~Ó¢Bã• C;áÑ°M
bÚbDãÅl¢:ƒ6yîï=¿UÔÊEí‘Ám¬Ò.j úÑwR¿}g(¢2;t)UP]svÝÚ¯îmÝ í6ØýEŠ¸Fjý,¡ÂNö¸ ´±]ªÅØ<u·ä9¬åƒF@å‡ÀÆ¬ßk›7(û^6ùšÓGˆ×ô%v|ï%â
ÿú7üC7Xfa¢(ÄûÆúL-_¦[›µ`½T’ey)AúJ+Ì?â>ú×À>†|h–"Ðò_l×„=4µB¹¡k»¢ äñ¬"ú¸<#øYzŒÙïìôÝ ªÌ"»Bæô
ÃÎ4þ>uRòÑéÉ§¼í¯‹²¾ÂZÒ¬ÞÆWô×¸·?²ºoI]i¦¡<â€ø	 b‡±¶ÿŸ£4»zMhçxiPt“E¡S	¶ÈâU²ð7wþæ¯Ã—ï~ÿeþï_×ø/,èŸ‘,	í§Š\K4g¹'T^ü»âê´tÀŸ²ëÌ»X”¤˜Ê#ª%rô9­¥Ëõ×ÔÕs›Zœ‰Å¡”+¤i9Z‰çâgB ~Beèƒeß1¡úob"Ò*0B1þ=+sÞoîÄ2)¬…þÀ­8(T%‰4¯c ø%I…\Ž	€m8>/ïÑùÝ¡8	JJíÛß‹B<ïÅ%u>õtØÌ> ?a˜Qÿô&Nfe5ê4	_÷¢^eöåÙ‚¹IK¸Ÿ|_þnâÉŠ‰xé¼¶´‰y¾GuÈø^àº'þp"lQ¶Òt‰?]!/w@OëûT‚½ÓóæÎsí¢àÈ8#d}qnÿˆ„xš2ê¹±ü#ÞxðL?àžo2ôÝ%ÒtÝoï¸°â¿]éìÏsIü¦è;œOv—éåCÇÃsôXIzž'Çñ8WRòÛœÅw·Ö÷ÇèkŒJTÅ0:ó“
'ƒv¬›úŒÉ¦Bêw¾ †M;_I^Èx³ØW+ò.57AmE(m†;ïãT‚ÑÜåUÎ´T¹©{ffÁL5ì­YþCbB±²øâÉöœ,Àpê³3 yËô›ûúòxQó%ÀºfôÆ{ßúú£Ÿ™½q3/‹ÞŸ!•Žù8îÏ™êÍéT’GLaþ5ýöã¸²k®?ã¿Á°þÓ3=+ÝùvÏ½eÂG mS¤+n¬Ðä.#¡"×€7®¹´üßbVg¿þçŸ›Þ2«`¨_‹«bŸmõ'±(L½,ˆ+Rl˜$¸¼i¹ø1~öùƒ¸¾ ƒøý Œ&¬KÑæ¨JN”Ä!À¬L@3CŽ"ÆÌOëášÜdÕq},6»ôä #{CUÀÕlÛ¼hðþ1¬û(o0eÎé¤¥üO¦Û‘’TP½  ¼¼ïwŽ"ÜîÕÚþÀ‘¯ª:Cz"°¡‹õf!ØTT7á®<ècÆ!2 ‰™Ï³Ðƒ%"};tZÓí›µÓòï·0™qþ›­3½×Ä‹M}»½ŒfÒ›þA-)s{™ ,B¡³2÷­Ü|ì_³Diê<öb+½îô7l'ò·cpò’i•Rx
dOè#Y—áºÊS·ÅMs?¶"ŒßÃ471­¦lôýa÷[¹ÏeÓÑ¼ ¶ÓÖÔñM§žÉ-G_Q¥^þV¤zü‰™	±ëó¡ ‚ü#Z
LÇ3m½‚ª5Ù]…C?ãŽ:÷í=y=ÒB§W½³DÏ Û&ÀÌÓe`¨{cæêúÆµÖí{,E~ŠH,ªËä:Žƒ‚3W·n­oì´öníð
3¿–2r>f¥HJw/E#g®îÞÞÞØIÆnÌR²©”c,ZcÃNXAñ±%;N3(¡†¶éÝLoi2xÂ„þ8‘S_óÐÃj£Áj°ÌR¸”ƒ(T§0³Ô-D!%ò‚ãº…É@,E‰§:õ»â¯øZåÌ°îÚ4êâÚñ{äu†_@hIÈtDvÈ~ÑØÈ}ÇŠ ÁHüƒdXn‡yB‘=»dÎž5%­-M”°6’SÔ’¼Vu^{aªZu¡0iuà_g…³Ë{‹7ž}Ö›œ¿‚¦í7-émeI~ˆœå}3Èo?820ð©§½Å¾WVWë$?NÝ‡øÕƒ
Ö#zÿ#‘pÇâ?¡"ê«Xó:S¾›ò'šL}4Q²³šÕŒÄOâ4_"Fð@`X‹‰£b@´ãw½ÐÛïËÑþIv÷Z×®‘­­W6vv53 µ±GÛN-!V¨\Ë—è,Åç–ŽªÎ8òIØü~ß	ªQˆQþ8Þ+‰›(Ðæ¨«^˜Â_R•æÖþÛÆÔC)Y§Õé˜‰¾JDK˜ÒyðÓ‰~¯:Ã-!7¿ÐL®—‡~ô&´8ðº`®w´9]¬Ó6˜©Ô#÷š~L6‰¼”»!FÀk`uúWÝÃcW¤–ôŠÝÂ×«È¨ÈD™m\xÇë÷Ý`ñå.õµýžI§Â­ˆ„7mÐ„Ä·oHSä[%“<¿è!kTö?÷‚r¡øYI˜3›~¨yfî;®»l ³LØKí¢›^;È¸ÑntD×D‹j’‡0K KLì“õÎò1… S/"b þÃÏ†LÆÜ»È
¨ì,læ^'¹sQÿF÷‰Ûá™19åÒòµ¶Dx©/ÿ÷Ñ/Ê¼—C+Lƒ±j‘âûL/Uns0%=¨˜ƒËÔo:è®™[ljõÙÅŒ‹ ¥nÊ
ñˆOŸýBerÉˆm”9<™½¯Wj);f:m!2N^·½ÊååÜA2(>#u<$·LMOŠ¤]Ø–²“ÎË¦=gñ¹E¥©bìß³D§k+ªÔç€3ÞFM†qÆ"ØÃbÈM-prú„8¯øÅ§ÂP³à´íaàŒ&B.Í`àÆÀƒ)˜B†#û¥väÕôG[XØãŠ})&}
×ºA_Ò*w<lc.Í°í¢¹\;ð†JHî0M!9ñOü‡5>ðP®®š$«ªMõLkNð<„;±é¢EÊW–>8‚­¾f@†ýë~S«­—"	–7£à‹w¯ /°‚Ø¥o™¥ØCú.½ü\âæãˆŸ*(øVˆÖ“>ƒøåJ>è*«¦°BŽÑ]äD‚Œ×¹©¤¨ªÆh]ü¸ÎYï3úD¬i¼l°hæŠØ§åóÊò:\„m.wx)NŽç”JdÏå4{ö¥Z·“·‰$¯+&Äbp&¼Jã£CØ¾Ü¬J!³>*dÃ×’ç%€ZNÖ`ÆE.õ’¨ñ‚š¥—xŒ
x”åyÆÓg7*.»u•žj?wn%ªðÊgÉÚã†±KÊJ‰§BðÏ0ïÙÃÔïÏ¸o—¤c‡\>•2¡1¡m&“?Êò
¬RHS³c7÷ÙÚAõýz»Q¿k]L”ßåº	UŸiß›¼ŠÀc9à,¼,e‚2–x†¢¶ëiGµ:Ï¸¢ôÐ‚crÙÁ˜~¿¢.ÂÇ‰+Àž]Ç±ßÁfßØ*!6õ0‹çõ÷ ¦§E£pea!ªÜ…Ž3¾K3ì­¸˜à[yævøŽÍ¾U«¥ø#A»†~\5ÅÆ‚)Sþ‚bÇ9Ã,ÔýnIYœ*Hü^\ý È¼ƒï­a±˜vDÞõœ$ÿ’ãwcCiþÃ?\"Çi'±MUçq”Ô(†Ñ§É~¼víïãxÃñðÛXj­ ×]«ù
×RŒàåýV |°Œhi¯Ï¤¸ÊÌ5t#²x­%#ª¤ÕïƒnÕA»üµÙùZ÷j¯¢sPä08:J–ŒŸUm•wÅ¬ÁÎÊ/QƒŒX©xá!kæá3%?q7-‚¥Q\XÝ‚=j)…$…îâå{©”Ý¨«jÛÈ8ôìM{+”ßä*ƒ÷›\1ò/Ç)ibÄ¶ÀÜ§§ŒaAÑlá/VpÐ4±ƒn
‰Š3G##?½ºm0 ð”Ÿ<v;_–ô¤DÉ¿îûXµ¢• ÔÁ>G.ÀžDz`2îÓÚzc
ª…þ,‰ˆÔ†,!c#Ôlµvv•<
¦“þ9YóÇ°%†~ÄG/±‚ÃP"ÂÐé‚ÞPnp%îÅC™
&e‰ÌiÿLñW20ä0WÙ'ÅË©cjT(—™$°t$Äv§ÚrBÞpC[cÔ›ºÿñr¤Š(¯§‡i,²¾vt=U;ú©Zä›þ¹¬±µ÷ÓòFk³®e•§ªÒèöìÒQžÌ¦­9RÒÃú/ÍÔÊ;g¸>F«NÉ0æ<A/	W.åø~Û4ªhÏL¾†C©z7Ùíc•Û !Ã^õÎ"nJ;RàFÓñöQV’Ð(…£žÒlšé¹b…Òj_Ùn×|±èÌïèvçúV`³êu–ÌÒu$D/QÂ¯©áºæ„K&›„ÂS”RH]V*ú­CtmüÀÕ§gÆ3feFØ±Jj^"¢óüß&æ-4-%³2¤ˆÐþy©Â,¨²âÚ3šiy#¾	`ÎÀ -‡}ÌH²2VcsUb™“«“˜«óXa¬Æ˜Çg4U-ŒUZ3BoªÒ²1tJY«ça¯–×'Õ§`µÆv+umªÍVÙ^-DÔ?Bœî¢‡Ò=´âÒJð.ÓÑ„ÔÙ9åã)îŠ4ä²ÆªÿEáD]j-íIGôa†ë9ëÌh_CÆnšÒ›X¸%Îð «Ðc6ÿù:6ŸsÜlìC˜¿T#Åì‚!²Ðf9T†™~«‡¾9ýÍ'åÜSÐ²ÙUÂy`²,¹˜H×ûYn>n«²Œ]YÆ}PÞðDDDÖ£Œé,öSäF(·àÖ®„	F¶î„2yW–.…²´6	MèXÐñ©‰Sò˜Z³<{C\Ý,[ñŒÒ–Iå‹ˆï—õeÕžj‡CìrØvƒ3¤–\To§bŸl®Óôq
Ùgþì:·Þ‡Ê‚nXõ©D.&£TËÍlÏ'ŠüVžó`Š"Ô,lû
ðáñ”öŽ’.&.°C,Å[Ã¥Æ._D¸ÏI}QÔµéêúØØÐ¶,°óëð‚Æ«Ç^xOÔ°Ëæo§¯˜—LlÀÙnª‡WA„PKÎÈüa³ÂíÝ¹fÜ»¥Ú÷œ ¤§Ç^Y[ß¸výÕÿøƒ[7·ÿÓÎîÞí×^ÿË7þjqi¹yáâ¥Ë–ù¢H~<eæA§õÿ ÿ\!Møçûß·ûas|/–ušjüà·Ùƒß†_‚Ê<˜°Ç~•M‹8x²åD½ÚAß÷ö'ðêŽFï‹ü>vPÖÞ²–h¸¸µÑ8ìUðO[|‘{Ut~~áñhoÆ˜Ü§äþ&}·lŒ»ÎV=¥{ú¢6¹8ët;­3€É:| /¸¹{k—{-fúxÀÙ&VŒO•÷9·ådB¯yîašSL¬—ÙYà	$Ó/Ë>ÆD±f?­
KšÃ~Çðþ¬ÄÌßžž|FígÌ!þµÄö#^JJ p6¹&Î7HƒÐÎÞáb—N7¹žˆÝüý.‚0àÔf'#ÖM•iR>‰+`|!ä¦j… â¼”a9sÞë,ž]Ž8ýÐò¡…÷X y êOÓ/³ºüe.²HQiÿñBýWåz>µú?×ük"MVœÒíÇ­FÞÀ%û²Î™É,ê¿X¹þóþ¿ÑéhxÀ?ù¡V«Ñ#þñXSÛ²R¼`ËüæÙKÁ§ÍÍ€²±Š¢™9K¡&™¦h[Yd›R¼
¥È‡@ûî*dŽ(q•Ô­ôLfÄà†â­’=%[¥)ãT	XŒ¾”Z.Dyü¡xTXxßòà™6ú¥<ï|]ì×2PE7E)ê¶QVìƒoOkª‹Nù)åEÒ)bwÌ@ÿÉU>ËÅP4'#²L?F>šZ®Ç×}@Öú~hã'±÷’X:GUˆOüðD¦Êt¾dêÖêji¦/›ù«à‰o
/ýÔ?¼Ïpü?ûêÓ¸  ;]ôP*Ú#LÅ±&ŠCÍäÈg²DáJÙOÓíÿg×?®ØøP§>½q•­øÊÊó|Ÿy2ÔÑ¢zà—I|Kz^¶BdRT)iÌzú,~ljÊþ–}Í ³þ1û(6ó|Î‚^´ [ÒMEµ­™Ê“¦-‘p¬”ô0+ÊèyâuîQ.U"ƒ¢œ`ëû%–„‚š x5â¸‹ùdé®»É<b\§\®ÇÕcxk°÷kðEøÃnnÓÆ¢.“Ü/ÅÌU6 uhWKæ~<‰<Þ2ÙCç]¯‹ùóµvßíû ¹ÕX<lWÆIÃ.aÒú0	Èp…)l®•¾&K8Ï¦ûdìÝù4I;š~nñš?*Njc×9eÏÙ‚´”‰Ö´^–Ê'¢oKw/ÚóqžÉªÚŠxÖ¹2û×´µôeÞ1ÉóJzRèŽ‰ûyjã0aùˆÊ¥ß(%õÄ{Éj©ýÒq^aA¥’/®š=¸‘µ7l²0,²ÍSjhÁ»P° »g±MŒ›­ ½ñgÍŠßW>PÓ“:z§þ k øýA\q!$bµ×!‘On5èàµ¬“ÚÌÌ;ò&úÔKØ#XË…q¾5ìíp|0fÊ¯§-ô•ë¯ÜðËàNk)LÜ;5Ð^v{ÇG}çH«ç­	àÐL¥«]¯;¬n&%NÔ›Zâ;€o*©Oáý€—á…Ó¾ ‚ƒ¿Çâï‰R÷ú"Í%†Rö¥67ÑV¯/U¹Þ¶j}ùŠõ,mqYwGÔKÉÔ«·(ìž”<-,è?å5§_¦˜»º^{ª*z©‚íÉ“zç%jçëœó®ôÑ¥i×3'¶%ËcËrýlâ›«šŠîjüÜ¢¶¶m]í§ ¦öoiJî˜rý_ëÚ¿æº¿RœW*.šDxË²Xu ÷oi£_Ÿ!t[\JµD@×¾Žh*"kzoõNµl({Ä§±î_yV;/}'$#9µyìS©/ªR•†É;7è¬$—¨"¸Ìu3w¨ðhÛh€R'Ã´êÔ¸\™'ÙŸ(WÙ8NìžŸ¹Ê…g®j‡²|“E­&cA&3Ô +Ä”–Õ:»® “²LÍçëÍú¥F#‹’¦+¶´¤¨=–†Ë-*¼$ôö¸¬R¹b´¼°™«Õ*áëÅÖˆ…E«Õ"<°ã,’¡À§7{~Åó©Ã7ù_@A¦¿N«'F¯l‡óÖür:G•	øÌhÐ<ÑÝe­gºSµM<œøøG›½hªI˜ÙŠ Ou±¸raÁVÍ×MJ°T]ÇSÜäSØâIŒ&®¡&½êw˜š±mt°ÚTöÊÏeür™–Ä“wçùöåËN³qWvå™*uÕ•º¤¥¼|ì>ì</:ª^®gÝ~Üe3èXfÕš%Ù.è  ¦õÖ3Éú^þoHØ¿MvÆ›WÃ˜ônC­‘®ªÒ¥2Ýs¤³vÐ=·:Ù•y8bcÞ ­íí›k­½Í[7wÉk;›×ø§1St_
}éâL¹üŸsd¯õJ¦ç	Ç—q3ê=gŸ¥íMyˆ$¦ÈÛ×1þ	ÛOs†œÈû(—kÂK¹Ü¨7Ü,KÇjÍ”û2ë£DDd |÷=·“M%(Ì6ºÒ[ÖCê«ö«86Y¦.-¦ªhG÷Í²”E×5»k‡ôIk4êóÅ
ÉkÒÒ‘Ý12é,u1ù#*ýb+"®\ÏM5	ª3ò	GWzËŠ™UúÚv\Ìa#£À?`ˆè`À¶aÇ£Ü%¢F!p:ŠþùÄÒJ~°>M”@fãFH‹"°bçhïÖíµWkäLÎ&ÖPtØd#ú@¯ï"¼DY!E™ ”DöqqñÈŒ¼ëµ]‚mqZ	Í5•—Ø”C{VÉÕ?€;<}Ïëöª¡ßöÜèˆÕl	Ie}cëÖ<ÙÙ¸~ûFkgžlïllmÞÞšÇ§lÜØÜÛ˜c00ÎÈ¡‡®`¤žº‚:n›Uám=n;€…E'›£qXS,@n®õ1ˆ]è$¤µèJìû÷¬o‘ô»’‰·ÌL<‹(A*8¡
H4	ÚŠ‰ Tï(Cn^&ÏJëI—ªc$EŽC¶3W÷üÈ‰·Ú0
µÍÔE9ú9]–©Pˆ{Ÿ-Ë1sõxF1,y -‚!j¯­‰ý¡‡N8>‹s¬ž¾Ë¸Ý4&^|ÊÍ=¿hS;°]Ãª)]?8¢øògy•°ôwñÒm³Î¿ë¶5ÕU‹ãá¯š´ht…¶¾åë³Md¦/˜ÆÆÁ¨Æ•]"iˆg\#½ø»FŸ‚!2mÊ& ¾\. ž­06è¬Ð¿ÿ0åÕæ*R!í:A»G°²UM`n›ÂÃ«…¥¸œPšÕ§÷ty/¸“‹iPl´jgS®Æ	fsK­*éÒ%—UÊÂ''QîÐ)3OF=èR‹yÜj5õÐ'«B/;GúÕËXVt9ç!‘†Éwë…fqúØ¤0e|«="|*òù
Ù0¼¨£DÐ^ÃŠw>+8§êWø¦,bÃ²}<mjªLà)Z`û¸,Í¥[Wòes0´¤îôìdsOA1¥i#Ø«ŠR`³&^XÅø5î±´½uãÆÌUšåÅ¦ÉË`A”W¦Öä’=È<¬²´³/:óYYJ+|Â§Ë\·?&²1[ê[Ò¶ÒÝÆsüñÿÿ6ù$a•®|Æpž>“|Ð_Ð¨Æïøë™¦÷Ð÷¦I…\Ä=­éE“nË¸¥8øVíEXÕÜ>üÍr0ÒÐD›6¥q­¶) •
gµãVûþUøÏüuŒi2úeP´3TI½Zo~Qz´U:tV3™Õ…Èuâd­¸MBëúû‹îò¾¥Ñ_ÍT¤6¦ýZêf®*½æŒrbn tˆŒÐg1OíÐÇB€vAF\IWP:@ W÷ëƒP?bâxC%{4šuÅj?uk+]Ìª„Ïº]Â'ÏÇ‡4Û›ÎþÝ\:-ð·ÅÅËK—X.-ìÃêêëˆfLQï}QU^­û:Q4ï<ï,ÃuWã»n½ÞÚÜÛ¼yìl¼¶¹ñ:YkÝ\ß\oímìª¼ÉMƒ0”™åI’”hh}B³ééFz&Àú`¶‘rõz•<':èÒE¡ošù˜AHõ†íþÏšÊýd‹þèGš^éM ¬ÓèžšO“woÊ¸ä³Û«D¥Ë3 ²DT‘ßMÕÍH€'£ˆ²rx+>}½ç¼ã¤7T?’—€LÓÒ÷¾—›é+èQ)Ô)©˜w)¨^$^âðêºì¸‚Å9ßÇQµq!…Z®9ÏÜTc@çXYRÎ=«¥uœ°ŸtLDÙÂ¥$-a	‘¬
ˆÿùÿÐ&7}ÁÈ€êþŽ9£Ž¿!®¸0fEà‡Ý“³ðYÒŸ*QËrÕÒW¢ððk*½n‘2wÕ	vÇ$BA#÷Ãka¤pÆß»x°¦Ü¤c`4¥?C.@É°I¼Éð L7;p‡î,¯s7–éh§­0®Jÿ¦;‘‡ÕfM˜OºãiÚ9Õ‹šì¸N_j†mš¼ÙèeZÁ7Vsí.å.Ù5<f‹®9©|*jp|0ãz ˆ&-å¯M]0²ÃÁí`Ø‹÷ùù¦ê{	äÄðB^R¶66Y!wŽ‰×Y!³ÞÐÃ\ §_mÌÎ“ßðCƒ¼
¾ËP '
$ÄU’ûw‹gf=?âËÌ\ˆ¯'š
Ñ¸ÌL´Av"–êdË†ù™€þß\ªðå—l_^&œü,ä~ÍLGî÷‰æ%×K™	êCãì-’uçH1AòƒÞ\ìàD5šl¦´¼o £c¹GKs^ÃˆsÃ o®Ð ƒ€ŽœGÃŸg×œŽ­Ù_¯à™&êh0Ÿ7®Õèé'3f_,$V
O/CLÜ¡ Þ¡ï=Â‹o5:½oy´]‡V»íŽ"ê”Àu(œpÊk0è¿.LyHÁ¹Ï‰aú¿ÿ6æ¼xCÖëDMl1ë|mwœvgH Øqd^ TCÛ°RT÷ä«V¸'Ê²ÜÆV·Þ1V˜²PÜHl<Ú?Ø5ZBÜ¬HOH7åÚBªu¾é`QÑYoÈt°¤èÀ¬?d:`ZDº³‘tÀµ‰¸q>‘4Ìjq¶z»Úí)«_ ß½c”Mrw²x–z‹t©Î”âNê5/ð,»ymØuØ_qÙùNßæßÂ.7ð	ìëbGô|ßŸ`ÆMàœ mêCÈ/ÈÒ‹ã7
+œ¡›SÝ¼nL?9	–,°²IÀ#Ïó‡-–µ?¶ˆëå[T8¿,F½€Á•fo3·3²¶32¶3²µ32µ	YÚÔÚTÙÙ™Ù™X™™wµžÙ¸”ì´XËLÜªqFËôOàªibËô˜Ÿ¾U«ù5¨©NB¼ÐAe\!Ž„FY›™ù§ã-Ì;¸ÔÔÐÔßX¬§â3‚’NÂÊ"®‰#ËrÈ*}vÀœc†¬Ñ˜P‡×å+±"7B)Tk¨—'’ÍÀ"-kàXl Q¯xƒnáM`m±ö¨: ½Íô¢h®,,ÐoÂÚxˆ %aÌ¶ÁÂ¨çG~µÑ\^®×›K¥êååNç ¾xéBç`ñ¥ÃU°}gl€—œ~ÄŸ‹˜ÒPMg5ä,MnQ½“bþˆŠWà¸AàÛ>,íÑêÌÐ¯Š¯Š›[Ô@É®¿ÛÇ4í o§aÂ&—½Ì	˜üUn¥,²cï<¿èîwîÊ1NDarL‰!rºÔ«üò¶ÈÐfï—€ËUž|QÜ§ÛŸ¶³eªÄ©M–k€Iàc#oøNªÜ-ý"_ë–~-°•âàÍóµF•<.ˆâY®}	 ÉiÎ“—s3#ÂSÍl^ö§)jœöÜØbÚÜfS¶ˆ‹³(
¼ý1*·Ä™£ò-cˆ1`YBž*Í@S©#©‚€H”1œvÏô¬¤G6Õ³ä™K¦oéWb¥•Ï”q÷\çÝ#Á A"ß'o¸ŽéX@¦KJzÊ'õU×ëö¢s›×íÞZš|C&= Ý0Âq^‹>×ü¾0yâxÙfn/¸§Ìâ¶\'ölŠLn™ã'~CXÜE†õn ×é†ÁÌ¿dÕ‡æ¦NBñdÒÁ‚:dFjº¹Ðš2=3ÿJ $LgþQŒœø¸&Oc{§þuÇc3ÏŒ¿8=yøØÈž>úÛ;õ¯z#œx†Ýõ	ÅXDø®Ç5ý=xüùL¾½èzÅ9ÚõÚNŸtÜ°x#©ªhy	–Yã%yÕIÓ±BqtÂb6ìUlÝ…ìºý²;0^Èæ0
|V‘‡×œ_†â³'xn‚YâENßkóa¸»È¢œˆÏ•[ê² ÛF4ßÑés«3}º‹aéÂßÿcþ^€ˆ¼c?~&PDþˆh¾âÆ‡¼aÒ›ñìëç}qRŠýö{À—ô˜Öq–ßSå 5¬_Ñûþð!C[ü-ìG´á¿ÐíýGö{ÈG<Ÿ@r|b%þ=…m¤ýÍ'³÷‹ýsõL,7dqÎósÙcÒ6e¼Š÷iú$ˆy§.N´S­÷*ãÚìVáä€\–¾—Ý×6×6vÉÎÆº½±»·±ûüÖµk×6v6ÖW¬¼*Ö²¢Q%¯î—ÑïUÐž)WFê’;öC‚µ(Ž¥IZë‘¼DØ¢‚)8ýNb¢PnJVøÏyd¸# bú*Á×ýWú¨¯ÿùçVaú–å*ÔL2'ŒÐëõd’Üyzà0êÁìöØ¬ðŠW%æŸNv„Ñ9¼¶uy”ÇI…kÎàÉ¡f OŽM3rî$øðeø'âÛB[Î;î­qôd©Ð0ˆ'G‰E3sîÔˆðµ@®gyé§’÷üqðdÉP7‚'GƒÆ99wÄ§?c™€*ZÅ!XG¦õ“/g=YÂ,É“#P«9:wBÅQ1Œ'I©ÓQåf°mzê±8dü™£6ÌŒ[2ân™;Ì:JMÆy’¡ð$b}[þ>H¹9ì»ÁY¦ûý±›fY;ž$¼ ŒÎÅ‘`§ßŽÕä${½ñ—âzìþí§wÙ¥óRñg]6UÚ•T‰V,óT&k%CÀóFÁxˆ¾/±Œ	ÞÁ¹yÈÍ7ÑØ.=ZµíÑß÷|ä‘’ëâðY°nEúbÉ½HÞöÚ!­¾©:¤Ai<{N#Î·´¨di‘á+®<â;Å›sÈÙÜ(úÏ“è?ã=´¦x}B—½£0Í^rÛÁRàýù¿¸”#A$»ý¡ìüŽê}Ë=ø©'+@]Rê*:lÃç¥Œ ¶Ê4°OW“†N+f{ƒîí _¶fv<2š-mïgø©ÑKEbý.‰ WiÍà)í·WÅr™Ù…NGÖ“Aß¢dÍj¼&«[×jWãºÑ_ù>çCvÁ×®TÉj©—Ý¶Ów+I›ïø=rU©—ì¡DAk¼dº¢û?®åAÿ‰—3½úþaµçu:@%ê
ì2r¬ÂËT½!aµVBœ`Òñª¡”túc¹ù,óž­ç}–ÿVÂª^ˆk»¿•Úgé™SÞgŒyë6yéÒøJÕâf-¬Í[»šÜ¥:µ¼±jïÏUì&Y6è"LNUvX÷Ûc–]f£o°Äz¯s- ãMÀXÂ;þªØçÎM?äZ ‚P*Òy)è SÒ pP“+ þ÷ÿ¶¬[•ÊÍM¾âQ¬¹AÄn‚Ù]`¥ýÞ£i(þIDý+Zä¿û-«aIÖÿÊŠ€ÆÅ9gr©Ü
SD”ž–båí%2$/Y«
³Kü¹ß¸Ø¸x7£$ˆ¬ñÉÔ„z†nyb’Ò]q|…YOi3‰‹0–¤S¸¥¬rªX‰ÑAÛ©®Iu˜3i0ýEæfåtˆ3©0gS`J©/zå¥Ñ(«ºHœùœ4—RZA¬µH«ÈT—FÖ3[U)«¨”PSæÈÊÙÙ\9/ñ%åØ5k
KÁé¸:”b®T‚íÝô¹\8‡,T¥Ø…²	e2S’¹¤”Šµ©ïäÔärJ,K¾c è"ûösñÍZóÛ#¸e}'ºžmÑ%Ö‘/#óùN¦=‹2Ì=¶¤O^¬QC¾´£­¾`“0:qÖû?‰’˜<ãü§`±ËDÎÈw’ë™—\¸Œ’àÂßÉ¨gUFáê‹ˆšZSLßiu±.îŽT#wÛ9¢ÿn|{wùˆµÚîÅrþÕ–õüÎÙüä"É}å9:?fp¬ž¼¿\NÍ›Ðgþ‡÷ëÊÅY°-LÍ=äŸ#ËRŸ>øñãôŠgÏåäö+b…M†O Ïêœs¨å‡L?ËöŠ‘µZÔŒWXâ;×á—Cç¨lžc*r7÷Puš§È×’wMøÙº¶K~hgçžûT/Ãj¨&€–¸¹>ÕÎ'SõWzÜ±‚ÆùWOórH™Ë$¬ÄŸì€ÏØlevÝ!Ž­l.${°z™â¼_í–áýnìÖ¨5€A¢ò:ÓY¡ø´©¼B§þWZ«àåõXq%Tøw)ê~eî¼–í	¨c7ôàeX(8ªLkOfIëª¥
<jójÓU„$³K¨RKÂ'q&€†:X¦x¯Žf.Þ†ÛÈ7®µ¾µy“´¶·wn½ÖºAv7ö°ÀÚ.ÂüŒz&~BÏÅ¿'ÎæóãîŸŠƒEqR®mgŠ=SZÎÕ/¢)ò%—‚QX*Õ`ÏÃ¥§uXf±}þ£Õ–]é;ûn?ï%H©ÚZÏS–J¤sÞ­0ôºC²ë·=7:";Îð\Ò¯è:±L‘¯æ®,ÐÇÛ&Ðêë·æ/QûS‚·u›äê»æJŽTfi‡³ó¤Lååü¥¯ÿZXüô{4;«›ÕR•1ÏV VÀ"ôª—í7ÖÒ']–—¿š¹ºãvÇ}' [.êH%l7H÷þW1†xcÎ\Ûµp$Û;[›··f®nî qJ’‘|Æm9ä4_àÿ°'qžãÙ¸±¹·1su£‹)væt6`$ŸçÓ×7¶nÍ\]w>YCúÄ'ÿšOÀƒ÷§ød}u]Õ½et€Âûh™^ÿ4VÞÀ–ëF„!‘†.nÃ~Ò	èß*ïÈ3”Cø‡Ÿw¤ycÆ;?¤ñ(>'ðˆ~f$óonèb§ÉÇHZÿ?u…p¼"	ý/8ÑmLî')· 4¥@×gÂ¾•?>ÀöXtìì9‚k9í-S1\xvËÄ¤¨¾[:®ƒTV&ªÃÅ5}QZ¬L˜#'³ËÅ…Ø™¥¡{ˆvÉ*¹—âÊ,³¡¨êâ=ÞÅ¼Ýc(ù;¹ŽZF•((E“½:J¦Ìh+üÑçm%º=Ð(Ü`uÆ­uk„Õ,C
š5[£å"1þu…Mò	Ôt…Žd?Æ2á »ëÉ.¾P—ÞBíŒˆß»ÜÙÓ™Kq‚“á5QÛ¿lxV!˜Å:›Ê’†¨A9k‰5.®32óc6ŒƒEb~ºJšwÌ•eçÈ>JqJ±cõ’ü•²§/•guaH	Ö;ü›ºÝ9S‹)X˜€Qfð¥BÌ%NMr¨ï‰¤fd÷’ZËb5 +•7AË¢ñ(Ðj\Ï¢¼Ì²ca™³ê@)UH46óÃ\ï'|QbË”aî_ôÁS‘1Í ~¹½Q~WL¸¬HS+jæ	«×»åD=ŒÃŽ?¨ ¯^xéS¥{ã¢½X”×’Ì-	\éÛJ%xý+ƒ¾T×”ÉZªg]’Ò~aÊ^i³˜{Ñ$K)ÃTœC±Ô¨‘ï±tÁØ'j1mv›àëù a/$üóàT¾O¨güj@*ÚöýÓ“X,½ÁÎ°¶ÝÌe/‹+ioÍLÍùÒ>r†Jïýá)q¿Ð±œåçÿnJS—ø_X0sÖý’­ôW	<½^”¸ÎûwNv}#(b•Ÿ=Šù“q¡€¸Ûò†áw>”ï|(ªëîC™k<E.”3r‰ü?   ÿÿì}msÇ™à÷û-ÙÁ˜ ”(®$")™YŠâ‘”])Ê C€Af QÃªë²Þ\n×rŠë¼®S|+[:GqTNÕÆ®ÚuþÆ}ôúÜ_¸~úmºgº{z@‚¢d"™L¿?oý¼º}N5(YŸïŸEHXãW '³<ÕŸÐ÷Oõ'ÒÇ2M\æÖžˆð©ú„ªOâôK©>™YP™
¥?û_«Da?5
›Ía)ß”›+S¨ãx+"ÓóKâ‘ö¾Z ê„+Vä¼Ü§ùóJjXRÇýò©ZRKx1:—*ZòöNU.§*íçW¹–Œœ ÝËQ‘“S%ŒÛçT	cQÂ¤¥±ñkc^?=UËÐ÷OÕ2Ò'ˆf²¤WXQ#]²OU5TU£ÞÑO’ºæÐ/¹¨}R£,‘k¶²G+ÎÓúNæÉ2ÉýAq6SPw¥3ùhÌô¥½
AoÉo€ü"JÍL:Ò¦tK÷Þn:ÑŠlBá@K´×GI6ùt!áÑe)=
÷Ž«–‘éÎÌ)—&W’1#kû$.­Ò€¬ÃÍF+vh“ôvnH¼N=Ô>ÿ+/ÁîŠÓ®ø<fH¦¼¯Öhøýy4"@ì„^³‰pq˜â†A—0›™ùêì„â/Õ¹ù™*ç<Aßk´{“Íœ®‰s9»ÏŒfÜùM2Ë\ÔòšÁn±ÛäÉi:fÊîÉÚ/¶üÆ½ÅvØèø*ÏŸ!‰Òð¿NiâßCç0œ÷;Á^2ËÁoäG
â™œ(ã#%<0ˆ®Æþ4=Ñê"™íSÔlÀ%/öIŒ½±|}esk£¶µrsm¾usc­®¬ýí&ZZÙX^Üº¹ñ´U»šh4âÐ	æ½O|Ë«C‡h"j!ÜÊïEéÜm&[Áù8#…ª?Lqtc’LHf+åŠ'¥­g©b¦gb²ú #ôÂ^ûéø˜\õ€gu¼~3‘maVÛ…¿·½¦¿ÒãH|»ünùÝ*¦3ï†;u¯P­\œª\(O]¼0U.•ç&ïh¤’K­ÙÔOEO¦	o´šM½±åÒ*>‡ªŠþ³ýgùVtl þNœWf#bÂzÃëy;4Û@:‰øCš+‘Ü&Ïiœ4âi ÞÃ¿#îïKeß‡<”šÄã§7jº5«Ù¾¾AÁ:Ã“DHúgø†)¹vƒø
>ùdã‰ÆùHM¨ø3žW oÀ×¼ÖÜCžÞåïhþ¼o’êD††oø}Š_:Êç@CÐñÓ÷É6âÇ,‰ÃsNgI¯4¡Á3øýÓÇ"Í]ÀÃøMMŸÉ/ï‘aDã¿ˆcsÍøœ§¼yÎWKêïá/¿&I
Ÿ~ñHÞ<:Á_“1XVÄ‡zF–ý_ØsžÍâbÝP×‡g†™|MÂïß×ìMö¦³?ÒÇÆà~ºe¿Û¬€öCŠ¬ï¡XÍgä…§x"ðî§œöz¬bi¯çuÛ´¹aôGëa»i³¢·Ž12}­ÒK-×ËÊœHŠTI¥×˜ŸiÜ‘s=©ìcÍÉ¤bð=Ü˜Ž×†uÉ)yõ(è ]ý"4¸ø¿XP©‚œR¥ÄÏ,¦áTwÑ†tŠT6+ú÷¡254é(šöf)’cw›äï0Ø5$ÊŽ^8€÷R$xRIÍ¦2M	‰žBe˜K­™4‘ë*yUÆ`lóp2òRÐéxá&¤CRX0G¶¼žC×|?B‹DYLä+	+i@ÈW¬`×*åÌž…ÙÆŒa[Ó¬ƒÛbUw`ÉG¥°Düà¯/c<á_ÉKŸ:ô¥”æ©ÈkN›>Ä÷ÒÃ{Iþñ˜×6ý+g6$ŠRÉÇtËØÎ}@Hñ” ‰áÙÀ¢ÇO9'~Ÿ¼Â²=ãK|œðu”ŒîzŠšÑÇ 7xÕÐ+›.]|øI•z0%¬x=¸ü¨9§TÚ±¿irÝøîÃPmqkåíe´¾±²¸²v-¯]_Y[Ö®SoÉ5)Ì2³µEÝ9ngg!Y3N¯ñfqUPÿ·‹/Ÿ…›1›Ñ•Åž~V•6K±},Ž&J«´ÊˆtlX%++ þšêW(§vNk<‰[?ùóä‚„-	Þ¬†w;3¦w %^
^‰I­’2™Gþ`5nVè{a„¯ ƒ”%ú¿@e£mF«ûÿy»× 
ˆy}¦õyr^R66rŠseÅ£ÙE³ªÑ'$Ó„«ß6-1Òûuü7Nè‹2Ø¹AÿFð?'D˜’â¿¼´€«ø¡éE ^†ød#@#À&†Á.ZÂãê.¤ŸcÆÀ$Næ˜äÅHø@aþsI&ûñ»æSqÿ=q@V3"¶/âc<É8P=!@ŸPNåzžkt½ƒEešæ3jµû'’ar#Ê1¬é…ãøú|’áxæå‡cž©öDÂ1›Ü(p7=…ãL8ž}ùá˜æ8>‘PL¦6
ó†§l€`“g¿Ouš›ÃFÃ"S­ªKÝ Ìg%Ü‰v*í^{Ðö:—÷÷sX@å)„ÿ-Î™\q˜)RiS!mÊ¦&æúXLWæZKï©­äg7éœ53`†ä¿´`‚ýR38(î£VÚ‰²Q-MtŽWÈ}á3n³|Ì5Ë‰Å'V‘~Á­S±Rö+r•ø2a…²+M‰~ŠÙ¦ |%i"kw­*cz¿‘l`Ds+Û´>ãƒÒFÉh`ÓüG:ÚsŒÉ¥é6Ó¿ëŠh(ÜVâ÷Ò{ÒÈâ­”í¡äè_G}ênõÁ	‹¨‘ÁæV§mP°¹á…’EÍ$]ê¦ÜÛCir´'w@¥ò$£¹y)g‚¸­iŸŠ9jÓXö±5õ»¨9Ã17;°82b¶µ®ÐÝÂ ÄLÊÚ`«Ýõ1O(8ãKô°íu"rŠ
2ziŸ;PÛEÊÃ¨§ŠìÇ\â¾×¡ÑaLw™S[üŠäè®såÙæÅùÆ™%Ú]IåO´ÞnÄ¥:öT3DÒ¥¼©söMï¾¯!éFšMÞæn‚¡ZRfr+Óru³ý:ØavÛƒ¾wÉH‡ºAS¨žiÈé6S–›ó:™–/ðl*%nü¸‡ïh%h½•»Rþ¤;T¥^ÙŽý-¡ìB9m÷·WŽ½ Äƒˆ”- Éh×Iÿ3féßÆƒ4öz³©Ûf”íƒ•²lq,ëƒÒ$[£ØÆnª&±Ô¥3-Žì20˜Ve)M­y·ŽU£qT¸½õ‡˜Hã¸ÅyÔâ–ivvÐ»;Ô…õW²ùJ’³õ;ÞÞÙ+
‚0µ=³€£€êHF}¸ÂÂx®Øæl1ŸÕôsQC75XÎ­»©}H/ÚƒaÐD¨5ð´¾Añ¡8TaÅË¯ÆÑÓ3ÆK	¬–€‰_(ï0#¢Õ—7²Êe¿¬)ù¥©±)AÒÙ+D Œ²b¯±Üi/‘Õ-¡Ç~¡@ÜdÁ=sNéöÄO1-n8.V&î¼YjÒ›7zYT“4µÍ‹´S›—uŠïP`è¸ù>öøg+ûžýïÑÑ²¡–î!Ïä9féýc9e[¸—å>Õ½ Ä«ˆÇÉ5cñ¾z&¼>ÈmœøÞ?ÝÏ¬ù5þO(MÅªŽQÿÈ”)i$;ŠRŸ«øÿ~ÒTë±{Ç©<"lžÉ³x@›~àÈ™)d+d3Ù±pghÄõ³W63ø2ÀÙ)HÕ’ã'VRö‰L§Ñ~¹ ƒ|ùZ¹ìÏmoß‘dGVÐDg|›í5 Œ†Q½²¿Ûîaù¹wg¢¬	ÂöN»w@1“¾¹¥F±2—h³„–†F-ý½­ ÿÐ¯^Ø,Ü}Ý¾˜»S(A"3Íõq ú€°8 ÖkívÐtp—0}´uÙl­ìñLû ßö›+M&£.½Éž.šN½Ñn “Ó_£m{æ~5Ây³cú~¯0Asæ»Áz÷^ì)n®ƒÄ®Œ~|—–`TéyB€r(/XóÌM·Z£ñgAñ«@ñ©.#ÇUà„Qý**Ô:ä æ`ò”P²Éõ•á|AI^Pý>ð‚ê+Èøžòƒ¸ù¸ùóFÛ6æÕõ>>Õ<›ZŒMóÌ}Œ…æYã@žSó,w9Šæ™€‚È82^Ý³p±>ñºçÇ¦y¦ÚŠãT;¿Œ*æŒˆï,Xøþ(›sªšOÍ©s=©êå|ÊåSÕ2û$(ìCî“¥ÍÅÿ›PkË+ ¨™º˜RîOX/Õ0“'ú<Näý%UA[¢SO¼BâT-iná __PA|”Ñ¯´*wª~ˆ›Ÿ u´ º—•üŸê£´³øÊqƒbš¼ÚúèWV-VwÊâæ/…:z¦”™ÐàT=&}´ø
i]&‡œi¥ÓQTÒ8ŒW/öÄ+¤i2Æ©‘vK½qª>ÁÚiyB'SO‡»9ÕôýSMõË ©–ÎÖEU-í÷^WíF{é×üœ«¨ÿ‘+¥óT~Å"¡YžICV`E?­Qr¿<*k…/«ÒâTg-]êÉI¾Rj
²"¡¦àäõUÖSð5¾šŠ
²ºSEEÜü¤(®_j&pª¹6ëy_=žPÔ1…W[yÍ×øj2…â)WH4?áêks®‘•^„	)Ž¡EL¯ð>¢«ÁçR¾\ÊCçéÛ/*ô6¾wŠºGÉªGŽõŠòæ›	Ï^ùÿoMU‚ç,®~R±zœVöh!gA Y^qOÑXX
>ß>yRÒõ&JK×Ð›«œAìIÓùŠó{‘K¶®XŒÖý‹ÞØÙö(u“hª¯ßÒ‹3â…Œâê?E~21E¸O_ª‡zŒúöÉÓ’ºt6Smi!ÄOí1ßxùCi{¾ænÏm™Ì¾øöÉ{’[3¯ô,Gfÿ‡’"ÜèþH·œöÿkR¯'®$ŸÐçbz´Écù(©jã	OÊö/	Ê#^ŠãCÄ5)¿{þ?°/å=´¨bŠ‚O¿„1ŸüRÙ™ßòüqÏø´„Ûàs¡øŒOE%}ý¨g4$Ì©&Ñ±Õ¶«]»¶²ºRÛZFË×–76j«›èZ¯ýäæ­­M´º¼t}yãØªÛ…þ¶b!Oq»y©¸ZA.E„4â­åÚ^à;+[o¡ÅÕåÚª­®’š$7×¸„{}#}M#Ìe(%e%\ev†Qƒ o¨û¤å¤ùŒ]yËeZ\.Õv±ü©
¹*ÕvðphÝ·AµÛkøhÕo²y áRÕ¥œÇÒYø
Qš!8‹®Æ‘É¢ç\ßÈ"Vêyd… ÛmGÈ†!­hú	|ÏbuNÙk^ƒXÜðÏø¶‚úa@R£B>µfèízú?b™1*i—¥Ñéšd-£0•RÒ)¡$¤“$ÝÃna¢úh/"^¬¬³‡¢!{¶ëáU¼ï¾Rì$qm0j—ÜÀ½‰¶ZmØpÀWTÎpE¥DÅñ–EíÞ°º^¿!›í¡´w¸ù ÷Øx½¥³wfbÒœàRÎ‰Ég¹äÃ/nÛ
Ð“tŽ›xJøìK‘?XÁøW˜¨Þ	åúñæÍµRDl3˜à@‡9S,ªëxGl‡ÓJ¤×G\K¼ÿG´¯ã‡Tøì=*|¿ðÑÊuá)ž½‡ïüªšª<ö(¬ùM|öú±u#kUª
^’»’¨ß,Ó¸;’2Ý\Û„„ÑÂÈÉ¸ÍI(û tÞ^R1¤¯•Ÿã+ª‰ä'ê5G~g;.ÜG¾yÃA¦Z‚ºzQK—‚ØÀh†áEJð	Sb°A) «w÷ŒÖqûT†|A„¾f”Í•Äô÷\Ãý²`"oÓÓp×l!`Ü	ýüæì!¹âó”	È*¢4'Â‰r
vÃë/ }tûž¿·€(’ÜYÐ"é0‚×ç¯éàx A-é»¹\eÑ|èº·ñT0DŠ2ß%=/{aÏof¾Æ	HÏöfßïÁºÖµ|€ÿwíüMZÑ<7]’¼ýs?ÞQ´ë£{=,¯AXA&¢TsñK	‹!Ë^£UÀOLÜMœ 4žþ«ÄG,áãè¨Q}×1Î´ThòÖÇ$îb0{¶÷„Üfî˜È·öeØ7=aI^ˆ)»°ªÊ¦—Ó@e|U)û[H_L@TYOçu®¥óôÄéY§7W×†„ÔN¡7.£ŠéaómL-ÎÀUéÚÆòò„ñ„KÉ5ö¬[›Ýlh	CÇò©®`»ã®aÑ5 òƒeYUF¥äã´‚HBÈT7’x po×ŽyC†w»%º¹±.>Ã¡;.Ý1)žÚ)©ëÐáÑÐˆEp^»%pEFT‡PëãKÑ}¿iAuq à»%,@;Oäƒ/jz¤uºtË@ÊædŽã†Vt‹üøª]ƒàp‹žêù»hÓxV¿Ie‹¾ô<À›‚'`<¼&&&µØ¡“»éØXbÄ÷QÖï¾CíÝ ¿­9 Ïgãn#ƒk2Ü-40§i„Ã6ˆ˜xš¾ú;¡×U'm¤–¤Ÿsçh‡¥ŽßÛ´ÐðÓŸžì Ài–I/ÅÐG	ß.
´ÇI˜ÊeçJQÐõMr&MO"Uò˜ÒXæë˜Úoµ,5Úïï²Å×÷içwÍÕ$þ¿f!X˜`~öŒ+kÅ¾Wºý ÄÒï„¹Ü¹ÖHÿw•&L¶/à9ÂÏ“–9ö[Aw0±6]³Œäw½v'ó-zAçèƒ__Å|c.-mÛ,¯`ìã¾éúšçr™‡6`¤«·{Vñ: ;K¥R’&L!üP;z>¾}Ì¨ñýq§Åt*¼'zÅŽˆ&Åk6Q¥üY•ˆ hc >!€»i„‚mÄ±»)	ýH,EÐzµ·Òc#GjÚÈ‰ü…µS›dî$^¨Ý¹É‰6N‡nå§¢‡ôÑ<	¶Ý“T‚ÚúÆˆvD7Ö‚‹qûË
Klƒ›åˆÚÉ+L3é«†M$!ó¿0u*X)é“ËîRÓŸQ0¶óºJQ~QØƒ²#º$v/[†H ms•SœË‚øðm¯·¡º"è-r¦1K);[/A“ èö¦%ÞÒl{Ãö†ñ`å)¬‰á£¦Å6¢f Ã(úçn–:	qˆu[µ)3ô`)/²àS¦á?DåREQ&«ª' 5ÌÓž³ÉÌmàŸ|J°OoËôJk¡6Jž¾wvÁñ
N‘!v»^¸ÇK%WƒlvÊ™ÇqS69E–¼ïÉ#ÝŽõp2
{ËÁÜœY›csdkLMËÒ¨r„ûó´ÿnkKò´ÿn‡Jîløb{›IðômòÅövR’§ÍÔ§¶öIiþ•þJês}[,ZØv;@úÀ¡ØŠñDBfv©5]ÓI»EÂ ¯\–uØ”†€ïaJ©èÒ/ö˜"áîoÖê7XMÓ¨ ãó$[šÃ†_(àÙO¡V‰vÑªªq
éªÃ¦á1=d€ÜÄ]^–†š½çk'*D“æH×NYÂ®´®ÓÑÏÞ8†èG7}¡Ž:ÄìSMYÑÖ]59äXB½¶n®£ë«7¯ÖVÑæVmkmÜ|gôÐa¥ðÛ±N’Â«·_+{åz¥lwÜœ•=m¬ñÂ)¿ÐJ¥2Sidt_R]y¬ùlnù™ÎðIW#%¡­ÝIÞ––ÀÉçt‹È>”:e¹õãñ@Ô‰tÞâ‰œ¼ýb9Þ>«{²Õõ8½{][Ø§yK¸k¯>9 ¬Ø—õÃ^è÷þb"þ’"P•³W$žÕ÷ÂAoef$…ƒcöá'Ä`wb _Ž9'ðË®o5ê¢µŒ °‰Oñ^Ç7áC¢|ôË‹BVlz°…çÐæ°5Âvà²ûÇƒ$EÃIAž/âXB,:ùRÐéxáf{§gÀu_>4øöÉŸ÷µRs:µÂ80äºYñ@è`Nz(ù‰^8~ÐÙŒA˜˜ŽÖ½½`è$4-’HU=j$öðåÄíUèxp£¶ëµÁpË®“^çd †ä)š1ðí²Œ=z?ßlÑ²#bÌí×üíYü¹3fŒYjGõaaúåŽ3oy=Lg!‰o”~9±F¯ 9´Ù/aªB-8»ãgŸË¸’l.ÓxÚª]_^ÛÚDëË×nnÜ¨­-.£¥•üûÍŸ8+¨
¡žû©f0œCQwr=È¬³NAEhÜ1Šÿ–rÈžsÓ$¨[AÐžM<¤ÉXuûµ¹yï<äÈ>dEâNYÃ­~KCÿªÈˆdfÑD	a†ÔH‰-ÒýÖ”¬‰Eý=æ‘Š¥¡’&ËY“%Y ù=bÄœüÕ0£Œ­‹«õÂïñ™ÿ…¬ìó¹¸Âc2oÐ˜\½œÀ*Î@5…xh§’®jŠFƒ¾¾÷<8—öùÏo"‹´ü’ïàû4¹Ö3)TëK©×¸Æð×,H•&Ä2ä­â»lÈnH´Âý¾êN»ŽÙ­¿nù²‚§â£ò¢½^Ù‚©¤îÃ½Ìw‚ð›h“¢V\”,q;ü6ýn{‡\$¨K±ÁŽ¯~ÀZ`~ƒøý(›k‹0Š?’+ÅRÐØ Ç{Ô…f}
MPÿ£‰)³Ãâò@„Á#¤¡¦œf(›Ø¤y˜ýÄää6W©ÎÌâ¥LO£%Ûv¨É¬ß
:@D×WÖð^4Meê'¶Åá	ñ/ŽbÎtåÊ…r¹X&‹Ï›üaö¹»¯ïãàGõ ¹7†V‘é1Á¹ÜâÜ'Â S#'ä8§¤\d—ð³B:µ¡C&·=õ£`Êod7±çk»ûÝÇ¿¢Äý„„þ‘QÃ'ï£×÷•QXy)‡ Ï^"ò<:þ+5 £ï"¹À§¤RŸÊðHcÃSà‰”Ë<V’|Í›¼O žaaZŸñnÿ$^ý€„ø?,5ÎŸøOBðk™1ÀGüJä€Ðffàù“w3Oï 5¼A£…
Xº%ÎÍ.4
(ÌÒ®ö
×0PÁ˜s’\À¨{u  Â¨FD&ÓyžÅûIÎK³ûyÐ0R×"<1‡Ùn÷<ˆ‹ÌÉY¶ñ•Ä¡{ëïÚ°ÊøÓlG^oöåý6Ö9[¤c?_–B2%Å»è!ÀR}{€¥ú²|%ë?€ìá$¾2•v+‡%!Q)Å`’aè¢ì†^?Îq.^â{ùFeëÑ3}÷Ñ'ˆø`ƒÛ“V:@ÌšIÒ…$u1´Ò‚²–fÐ M«l—•È˜±É® ÙO;WÓz½i‘û’·¹¾ÈIÁn:‰+tœGå°Jòkÿ¡ N¨a$;bïù]Ì¿²pÃv¡…ë4Ùî`|@ã|­—™`zw#IßãœÜVF€~ä;m
tÜò½¦ýx+Ôd‹ÖÜ“uyýâHk	o©b¤4Gîc*‹}Õ¬»[@hHBÿp_§qÜûóÒô u˜þL	Ò¯zÍMc|¾ïwŽr³WVz÷‰4¾ÀPÇ€£ì\1²EÇa{§5HÉ¨‹lŽ|˜0ˆ|yáx„#%-G¾ˆTžršéäª×!š”Ú},öéšjëÁãwÂ"2í@E.àº"ÏÓCŒðÅ=Äþˆ‹pá€)lÔ²™ÉTß$˜xèà:5…ÚÍNš qmæç€ß›¡ÅÍ¸(=Šc"ÙSÅ5[lµx‹¥·5D÷ü=,·5È»+Ä°x[«rZ
ÚJûo&àiF‚&à<ŽiÔµ*O(çªÎ
†f¢Ö!ÎyhžïâGûä8ø…ÚA§¯~hsÕm5K›¥IZ7y2C¼·ƒ%[JVa“5¸:—ª³@6[e·qÆÿžŸc?á#K°y6 ç¦gä•?æd"æEï ×i÷üMŸ{áRaq=ô#Sa1×î5qù,ú„º‹R
 ATÂÚ´·Á~S`m]ÿh7e‚<\õ°˜§«”%þ$·M¦R4#hÂÑ`ú©¾T¡÷>Þ)BÌS„HI¸C¦D)ÔbG”úQ+l÷î]¤ÈÄzÓõ–*%¨¸ÿ&k.‰ùˆY38ËÀ•iH9ŠÑðU:à•}b»pˆ_bõÀ

Ü•(ZðoD.fQÍˆvÃAú“]&m•U1JûE(F.ªŸÄ T‘‘¿²Þ.Huàƒ\“vÞŠýTxàùF´Ð“G±T<F`ºæ\xºO÷€}¡a,x²w^—Üug ãÙ\Ãž°ë¯)ëaf½"õ³¾²¶`.Eðèƒí Ž´ éÅDN¤Î±iøª©m`oZO~‰uab[öïBå?W¾cÔ7¾î.gÍNeºrÍ¡7Ñ„EÂ›µJxháðS¨²)Èþ¡jm4ƒ?n¾ñ'bÊÎBÂ„ã Íó
òÆóXîÀ]dZÕò¬1c“1wí¶‡]©g4±9ðzMÈíÊºs/w$=Z¼“Hwò6¾ß‚•àÐôSZÝm<ó™œMÇ:èaã Eà!ÿ"6*‹{®Ö-¤$ÜÙ’Š	#Û§«äÔÉ•È1ÏGrGR´1Ç<Ÿ”¶/‘ˆ4Sc`=E-u‰˜XÊ˜ªÈóTTVw”û0º–ÈèD‹Oñp*!7#õãît¤~´r6ðEk@t'Õkµ‚¢+È¡ñP,±\¨©¤TFB(	ÎbÆL9!"¹×yŠ-°ôæ¸/Î™Ô{	nž]f•^È¾²œW×ƒ`§ã#¼Á`Žmv¦á‚Ýæ¹“\Â_Ÿ[‹»‰bÍÄËþ*‰|·t<ÿ7˜ì?‰/–HŠqr^cÀÂRÉ¢ùÃêœÊµ’áü½—Öã´ëˆî.E‡1A½.õô¡AžÎ{lP?†+k¶>Ùn<`‡CšÕ[`š¸Œè¸k?o©ÔB©b.ñP;X\õRÎ‘J"Kµwj«¨vkie]]½¹ø·à&ó”øÖ=ãþ/OÈ×Çiî -»<“Ò4“Îu«Æ»0zÔ«ub‹RÐKhõOÛs¼\:úr'–Ð#5d Y¨‹(o!ø@ibÍÇbA³= °ÒøÛÿ=÷ÆúŒzBø…¾¿ð²Ö´¤õün¨e¬Žbb8tø‚Z?êdF4²B¸1>’=Ÿ$¡^ž¢LÕß%Jo+µ³åRQÿúÿ7ÙÂGqA¬¬ý>“vë1ŸÃé/åTB 4aÙÇóŒÓ(“5¶ŠÝù‚t’­…%Çˆ›¾6Z*ZÌ´€¹é	‚Ã,ÀBÅt‰(Bàf<PÕñºÔîõ‡f/•#2)³ˆ!9à_>ËV ç$/•ÌmI.¤ËûäuÚÔÌ#±Œ‰åÊüzÁ§ùyüÁ;qÃ‚_xáŽÏ,Y˜­ÊDÍX¥XõY0•‘ÝÃhAEe1é!6T°ºã­)^DýPë‹	Þ<0…ÝâùYÓîhªBÚêÔxN“))!”j&9Ý’v®»;y©Ýkt†M?*H‡ï˜Ç±°›Hœ6yt}ï–X©5RBCÛ•¥q×´‚fþéhºÓe›¢.šSQ¼qÍ9r­>?ÝJ5L­Õ×hÝxmQ•5ðÞ_l‡¤ëë<&uórGççÊ¨[Ç$Öv¬ŽdêZ ×WàËª?€0>–2êO›ej}òLÝ±Y·>ÃØÁ#k,nÄÙ.Ä'Ô}Øæ:NÃÙÎ‘¶6hý8H¿NôÌ‡ëI«×ñÖìzp«xíŽƒû¦­OˆÝ‚t?Ýö`àâœëêX¼I’é¾¿|®ªöëw¦‹ê‹pOÝ×Qhâ¢J3Ú.„ççn©ÝÌrý¬ärý4éó]üñœ<¡º½Êšß^YG7|à¤®þ-™.5G“³W~´¿+{:Œä¢þ±Û?8‡IXzb½{+&}x®É´]]]Úãz\Î?Éd0œMjXéO”p³kF¥LI>ÉžEãí¶›]iŸK\ÙeWû®]˜H˜iEÕA¦<‘9[¸ý¸®E=jI‡‚s­?Àì\™`:Ä;UÈåçE:û2á2›D*Â”AXÅñöÜfÜ¼Pô©l3\ŒŒNäd`Õ½Öm	ËKldIEÓ5fvíèä³Ï÷áD`G.+øHöoWÊ¡g÷ÎKÎÖ•œÅÑì‰Nõ‘õ–ˆŸTÞm&T €Á~[ÊZè?Ð‹bdwA&ÃX·éËáù¢[¿ /b9@¤uŽárä¬K¬ûèj³=Ì5Q‹ó±rÆ>Ä³†ô)XŽz]R"úÔ§7-^l©”é@þ¸›¬3òå,Ú/PùHâ&/–§ÏkâîÅš?˜1³ÉD¶mƒ8Æ•‘é
Q„êU£ªÝ­ÀSœMº9MÀ§DÊL¤6|(BpJ¤^ ‘
©	u½ðÔ‡‹?”L“ˆ0—$Hä¡ FäÛÌœÑ×æäÑ!ºïc!C—œœbœ<¡^ÉCòò“»Ià=¦0Ûí°[¸ËÜ•¦õÓìúÍ»–"žé2Ã§¥œ<žaä1¢	ý:*êul´Ëb°\LôL›ä ›¥	ç±ÜFr$aò=­XI*)åþ%p5—üøF!7Ì37…k—–ŽTDç‚Grô:zÝ¹­#Ò™f9ËMZH^†œÕûÍ8}jÖ¨ËZmi	­-¿ƒnÔÖnÕVegµk77¨ÃÚÊÚõéõÚOn<ººŒ¹3j¸šÑ+IJŽà
F¼Íæ@w8›‘.÷RkÖlùÌáÑÆ~s^†§®Kë¡6‘´ª‹2Âì¯7$ùÓ¡F±iIfÚ"[pçúBrNz
¹°ž<ÉeõÎI¸× h÷x½‡hRWþ%ÜúÍ·Ÿ}˜™jëÒtkVï2ÑÖÚE=j’þ+&öá—ú¡lÒ—¦ÂÚ,@Ïß%–M°¹ˆ¬ªºòˆ*˜m¬KPóŸÛ5k»íwš"z;V²n®ô­]>”‹ß'ÙW¨ê» .Áºþ6¹µn^¤—Ki…+=ü2–$· f}Ûáz†&v‹`Œ´¥^°k>]V©u{îe5-çÊæMn*EýN/hkbòvYW ZîwBqiAr›dhg.“EÑ]êŸË°¨­séRä\ßÉ- [¬ ëhßž€f0Ò’èÔc…"ña›_¢F¤xèä»¥SÙP7cèÅ&m/ ¾ÀOÖüZZ³h»ŒC%äÛâüImsIh¼cC²œâïhÂîØD[†ð7dˆa¢Þ`¼Pƒ\Tðwºë"`DòéiDc”(Í4¼…_X“ ¼0aIz•RB×—):¾MïôßbY’½GAÏë˜šäpsÂ
H3ñ×Y–“?vjÒôgv¨5
‡¯îw±‹˜_eï„Ÿ‘Ñ©[“mm_!Û@zEmê^š&ÃÊŸÆ6ßBÆw/(î¶Þ½VÛ»7hùa°ÝÈt³•	k>?[`Gq´Ý‰mâŠ.ÃºÍõvN”ãÜ²DFM¹ß*nº±jÂÞœ‹ã†GNL™Û–…Ÿüyòh@²GøØQ%Þcã&§`‘.f4hd4ñùOÇ
Üe‘²l@ŒüŽMÙš€‹n=6¸`í¨á"æÊIhÈŽ*(‹·c@ê;²Ý<«²ô³WÔï—¦éÛ9»£!§W¤/¹;Zóv¼¦4/õûˆÝ±yI_rw´5C<±ÄƒÜ^õz÷/…š˜ˆ6V~ZX"'³:¿4MQè„Ó…-‚tˆ€Ç4=zO:yâS¹ráû¸3,*[È±˜`þ½dYFØ”W‰ï
¢$ß,UIÊnQý¥&V–ŒÅ³-œù¼UÍ-]3„¡$2mœ/+…RIëaoÏó•KÄö³ÂõÐlÀ Í£¹²´²yõÖÆæ2ÙF[µµÍ	äÎŠ“±™,1k 15­iþ'ë‹ªn´ú—Gû$¿qsiy­./]_Þ@çÐµ•µÚÚâ
c_Y»Ž¶jWmF9aWØ§&¶¼:õðëM¿ónÇoî@ª±”›_
§˜a^
â¾ŸÛ^Ó_I$¾Â&nÝ\G×Wo^­‰=ØÜªmm¢›ïhÌ æØB¦ÖdnXÍ«A Fˆ+¬³?¹í¶ÔßÆEÞL§ž =ï„Amø÷q‡©AJ˜5~¡»S¨NÉó°‹Þ@…z©DD[^žœÂÿ7ußó7`û7[^ZY1ÜQ¹tÞÔŠ¤ÊªÉ)Usµ1äÐJ“û±Î4¡®qW^#·³g¯’ÌwièÃ±Üð­R×{P(O%V_Ô¬K¶h‰~KÂª]yTE”.Éä$KRPà]C•<…-wB¯	EŠƒ XÑvt!aD£R®–1ÃàË…òÅÊL2{æÊ~uffæ¸È€õ.U’ÖZ1–•­yÐ±VÅÌ™–ãœ£ðTÃ /Âðã !€™µL-ó©K¸Òh‰ý4âò29KmÜï ÑÊNØg­««$‘^$S++ä*L“çHÝ´ììd-Þ^Æ5r»dÛ‚$!Á-Ï6þÅWrP.ÏÅiö4U='wÞ–Càei9«§Èy8ä¼HàznãDNTãL/1ål¬”«‹™ñ’’¤z»Ó¬ì4áØq e"ÒÇìuíŒœJŠRó¾-b¶Þ,B>ÙcÅÏ™Sü<~y	Q©p¾üƒÉ£FNz­²ãA9mXšÈ<®ÅQ®!^l²fñâH +)ÉùyV“ÒôZ‰ŸK&ËßîËn-šØÐÙkÜØ<{ŠÍ‡ÃfµfbÅ¼ò£8-òVÆ(-®dã@gá¤?oCè[½¾‡¯gxáä6‡}h³$*ÇœÂœnœÉÚ¼aK&%ÜlïôŽ?pÏ³x}ceiToàK>ÕR]­­ÖÖ—ÑêÊæ–CRÄÔ­ûAGºfÏkö¼f¿R`:•wŸez¢ß¼Š–×¶6~Bçèâ3‹Çjà
Šs6šI‚ôŒ2áZ¯óÆÌ‰†srË‘HEâ¼Þ´,AbKëoÏLß¬µ1ƒ± "AIæØÇ<Ÿð^Ül8{øä…”jð
døîß´d4ü üuYÂ§4 ìäûþ·Ÿ}‰À«—TÐå´é—ßW~C?B_)?æ9ÿ„xöÃù	YÒ@ð-–“þnŠ–ûþâÛ'¦4å‚ß<‡¤&uá$íå9yþñWº`^Zœ:'“§±Ïñ‘¥0Ü§ZâÍas©È®aÿÎWª&ã°‚SLÌ@ N4gªZ;¿èr9ƒ0×Ê¸Mµœ`Ô£.˜ÌîH–K\Ï%7sz)®5›ýWÉpJ>!{h¥æôú²Ø
Úß*<Ÿ…y“˜ÁùÌ‚.&d`N;¬J¦í˜Y‚é¹‘Ñ¹g`>kðjºƒcwV)Ÿ<g•³WŠEÄÎ6>Õb1Ûé‚è‹Éë,Í|ÏÌ´Å‡'¹¶ I·Å™|ïÊGFþ–=Š6&p
ºžÞDwôºæ‡ƒ»P7h- õïÿ=¿9q`/õžµ7æ€+'#] A	}p%OY*P2µ#q6×òC8›(f5
 !/Ða$E(^¬Ã1E·1Ñ€“{dj'ÎÑÉ/í”Py~OýÂÒÐ)a´ÙjëýïéG_XØ(àíN w{ñ@»‚¦ènß9a+æ5Þ
x:á“	Ë+ q,âõ´¡
¾ÛnæÊGp&‹žIÃS€Æ ½Dƒéuo¯™N0Gur'6T‚ÀrÅ)`‚‚-,k¨…v§B„ø–Õº>! +¦3ï@á}¸móGã§Ài ¬b&€¯wSXFÂö¦Ð5 ":8‚+_ÁHr//T~Jk1­í€!Ž–¼*îJÖIEï“¼šéÝ$;»‰¨á¿ ¦ÛÃüÇÐkÔÕß•Ê’åàÕŒDjyãï=àÚýñ]¼ñÃÌ±Kþí×/ÎÏ•ïp70Óè«°"’¾ÕÕ!?a?ÔûçsƒugìUýbòšz²m;Ë‹77–¸mies½¶µø–Ý®cöÐÏpÃ×úª%ÕÚ¸)ÃoÝ¸QÛøInK_u4KŸZ¢¤E%áT×è\ËÿmufÐ×v#X<}»\*ÏÞ!åÝ€šÔð™þ'ÀbIæaªì–ÏtIº"PL5üXvÅ“¹Öîy½Fîz-ßd»\­˜ä×<–Lëª¹µò9¯Göˆó~Åò=ð7¤2+}¦1S2ãâ7BÏxKVÍí—rÞ"üË{¤0mB3jºŒkº‰9}#¬©
¼áßYÂ¤çp-Âý|öƒI¥þÚ¯ãêj0ú—¤öË‹$:z&ò(É¥æ¾ák¢¶Í¯RUág&Û&=4­}“þ4’ëSFqÃ”Ôaeœ%t:!Ëg:æ­ÅÉj¹HVn©ƒY¨!w	c[þ"0õdº'©îòÌ<Gžˆð›<{EñÎ¹CÅ“w<¥nG($ú‹•D" É¥ìU½fN—U››£Í4gÏžIÃ„uŒs-rö\“ÓÓÄÔh‰3‡¡¡cKlšµ„
$¶,ã%dnCçÎe¶-ÔÕÝxSÍ´Eº/$~3Ô¯KNŽ4_3ô-ŒœÙ¥ìâOFRP)‚ïm’N>…Cï¥G‰ çé(b@CŸü°dÞKŽæåŠý“?Že`Î\ËÄèä‚Ž9 .£ß¬ßÒ(èi4‡ìäåØFEõ´ô…ãOFYEþe½„«®²WLX+wé°]jŒè*•tŠU“lïX`äR»»ãðBQØàëëz;þ­°Cª€µƒ~´0=MF¥aîQ#mwºß
A±273;W¿0[¹pa®87sñâ¬wþbÓóëo‚”v.§ÞàÜv{p¹ýs?»<_>·{¹R-O¸åö:ƒË’_†SMiJ)WyP‡äáø>x_ÜQÓRÛü—dÀn©|sÖúNµ×» ëê¸	ÏMÐ±pÌ«¬æVEË2 ”^…Iì	ÎE³àó£}AuÜÎÕ}®%ëŠé‘S’ˆ“'áVjöNÉ¢eÇ8q[mÄ\uïhå;ÎÓ±ã^C<ÿX¯˜þœwÿüÕ3]pó¯Ba{/à(4ñ/ùAyû˜fŸ•Þ<CÂ=8îìç¹*‚ëŸ[éòVmeuyIÎƒVo^ß„”'«Ë&£(v5G~‚ô²yùñIÐÒ^Z$,øð%´N±ßDÔæE“™y´ /äH°jg(¾ÄObÔ½&£8¸bRÅøöÓÇT%ú;‚¿ÿ=hRAúW”™†ÞßñÙ7(·bšÑ–R•ð{Dw‹›<¡Ñ&Ïh7Ÿ7¿éë254™ïç<šåÓÉŽSbxœ‰™.zÖCëXíúÕ“£[5ëUÁWI˜Ííj=­*4—^VÛñ–ž&Ž«#´^ƒÄ/n„¨.—yjån?º&W;™µ`àg(¥ÍÚZâRÛáTiis[GfAÂªÍ£™µ ›³sñO"K×jKkA©š3OŽ.þ¡Å¡¤ÞÙ…ta-ßà¨p¹”%¨1A4èlbÔ¹¼?Jç•Ë™öªê7ÛÃ®ƒ`ºÄ;‰š"ƒ8bS‡–\ê°ôƒÚ=(àÕ1‘)e¤‡­Èc>$c¦{qê?ÀH¦‚_äRãiÔH3I‹›­Šu…ªt#ÝCé¦¹Í€×M‡‹d±¤%õ ð8«84P˜æG©”C¡tö
º0(8+’§D*»VPŽg—ÒJÿ@ƒ´hÎ^ÔLvPAŽµ5?7I2ôÈGÊOÕ{?‚ƒÓ&aãçE´¡äˆ·PõœGçÜaÂÐøðÓ¤#Ì¥'-‰ ·o¦4%„ ÛFÓº±G†ôFÇ/"æ›]P»Þƒâ.ñÒ‡½Ä²Ú€t«{ Y:”¸—Þ&¦“ïþîd’—C®G\³ÑÚ¹Ò¨¨êE{½ÊS;T®:QÃòÁ^0DÑý±ëõ A)«4‰­v$‰W?Å*,²…{$_þÕg2Ö›hÞÜmãûe»	l=ä5A1D^#Tþ¿LD¨N“ú üÌÎLä(I
ÃºWõv½ö€-c)hšðÿúšàböÄb?OåNVîˆif±f†í«Ð‰7”¤Z€÷Þ™å:QƒØ¿~æ-Ötü’	
4+™8h³%/à%C¿¹W{ª£$°ˆ×}ôµHÞrªWªV+Å©–Vf)(”MJS®%×–PF4kôB´±xÑ5«¸üQ«›¦@)»'#ÛáŠœº–8ïMÉ\-lÒÄ,
£²ÿÈ²¢'2Š÷1­˜ F¹ò‰«YÄ-·0"\ƒô$çQ%\‡„SãËKEâmaIh¯	-†¾7ÀÔ†dÏ<M?•m&ØòvŽÀH°KñœèI¼‰&–ñwé\&à"EÎÆ—ŸZ¥þãÎMµéCùDL:£–&ðÆ‘XÊkyöÔ±üï:^¿
LA˜ð?¶n÷î“ì9}(l8‚
^÷‹6×Ï¦wß'™;Ë„,Ðè…‡•)àL‚ÌøÍ!ã‚ -ä‡FÕë	h{e}.;˜iXÜZî¤CërÓDhšZ^ÕrÂð|©yyÿÌ¹0”Xëd"ºj¸Û,b¾öP·øÆÉ—³`iö°|e1ïÖ8jø1#%P[
(4¦//ÖéSøÁäXQðÐ‘øÝvïòYK¾|£Ç¿ÛBó4ž™sC_±Wp½·ÜíHÌ;(°bÙ‰0Ó£Œë?Fd<jôò£FØîŸˆ ÿ‘ÑŠÆÞ+Ky™xÚÌÜÐfß'1{˜¿	*áˆ'xÙ£`nv|‘×'úox jq„
7	ÜxÉ—`1µN'Øõ›ÉE½@ö’Å=t¸Õë´±œŽÐÞFø×»ç†xé°âÐ€µ|9_N(N¬D¨F”$þ0B›»mÐcº&ÄÏÎ[eÍ•M“s˜ë·Èñ×Ûßnr«×¦”qVÙ—Ã¤²¿}±4§¿qËÁb’Ü2M-½03ý}3£h=¼F7Z~ã^=°$!oÀí† ßJD÷eìãMcôc]»" NßB«BÈ„h‘À
VtMÏ:
6‰khFje­RËJÂdÕ‹Tßø…‹s$År_MÕ‘ÈÅì‹ôÓ®ÚœÔÜÍ¹Qqè†Œ»ÍÌ´­Ý]êìÔÆð—\6'‘Ÿ{”²¦â¶o‘;AeahöÂ®ª"Ñ²³.öIJèk6†°_ºX.1â/Ks,ô0Í0:¥t2YfªÔpfÎµÅÎýê5±ÈàÖ†ËÎƒÌ×„eV#«õ-ƒTÃOŒ[}/„<V&y†Yçä¤Kse½‰kÊ!W›œÍ.µÖêŽ%2dæÑG]O9Þm¹´¨,Äù©,TŸ™??[M't¢&.Ü¡(aIî;;?âðÐÃPT¬€u5>Œ&K9GŠi±¤NÝ&ÿ+.U9|îó”mäÖúRmk-Þ\Z¦v‘eñÝL‚ÇQr9ÃšQÞqÝS†'Ù&	ZífÓï%²=mš'0â%Ãð¬tV™7 ³4ŒzxL;{ÈìLÔ¸Çî2\,z¯ìdÉñæ´LÖ:UñÍ“ÉˆŠw„ßT½iáÂY¥éï*œèµÖ DÚd"¯‰¯û‚ÅÕhi¾YòÌ¸\›-Ó"cë‡¤îñ˜^eËDWª6Gvn´ù~¥ÍÁxÛ[ðO—÷ÈžÇr·€þ°ùvXJ‹ÂIÉ¢2Ps¯çuÛD„Sr[ÔùÊ[²GìÃI?T˜½ðäëf¤ˆ‚3_ïCÌÆÚ!01E|Ó×&0s-Þ¨`{Ÿ³&“*²¡X˜—Í^ÿ£%ÈšÄÅb\d9…o1,k@9µ>çÖÖ”YYA]ü5´+¥ªJ:Øk¥®­Élhf ± jl¨¼:à"ëÙÙ t½,í2FnÛFí‚ª^ñ¿Íi,ì;äÉÒî‡’Œ+œFê©bf;°ò +—œb~^™ù±\â°0ÔÌT.T3Òci=	¢!D$³‚	‹p!Mr‡¸`ÌB;>òqš:ØÎ2&E‚nqtQ@LÇ•}À’uSi–M@¾P¤‹\Õ¡u%ÓâýË—ô@lgLÌ;øºyíšËÚ\C:FÜàä™2ØÛ•9viKøË³ÅÄËÁm>Þ©Ùø”°‚$˜M,¹¸ÏËÍE8¼4ÍŸu©NÁ2€Øv»‡ÁìÜ9”þôMX*TÀ·Èïþá9E'æ`95w4çè”þz¸m;;êãF™£”y:íßåø[Ž«õ¥ƒÀ5†Kåv¦×â ×]½âÍfú6ÇFÔib“¢'ê37á<ÖËtß2\¦û?¸ërn¹h ßKØ#úÑ¦¬ô¨Ã³S¶0WòC NBxa×°N!8‡B#WÈL*´)š¹†Q¤tÛ1ÏÝ‡Ðvk™\þî@žâ¹»:rìr÷Ãõæ£R|ó¦ü·½L¥zz*94òúÆŽºùøã#£‰’¡×=Vb~6I…2ôõå¤8"ÏH±5B|5Ðøvø/¤Tr.a5"°†8ÄÃÖ¹´r£ƒ—HŸÊ"ýZð¯S<MúwÆID¢ÝF‡Éxl´+`ÁŸÏ%8›>¤j@À¢«ŽtAUã„#Êf=øŒi–¨)þ³Y?¦×ž )óaÎ¬þÒhy]üUT«ø…Eˆ:‰‚Æ= E¢üðVØ¹¼Ÿxp ®}ØzxM,ÎÞíƒöv›°ç‰K8eFquv¤(®J•X1Î3Š^¨srÒZ¥VýíÁÉ~`œ˜¹X¤ðøÂ"Å¸Iy»R©x‹TCµHÍ€/ž,³	âoàRA$Î¤¡Êî²•œ“W‚ÎXNÐ/‚ÃÆö ÿ‡)T[œ¼iì¦q=æûm¯¸çƒesûí|¹l@x‡yémN3àÀ©mÓÙ ªRIt°éá•ˆi§%ñO\M¦ŒÈ}ÃÇó"5Ÿ’ÏLîl5%lîf*aÉœ‚V˜Âíú0j¡Ä1_šnUƒºØ/æ=õ»cJ	ÌÃÎ^!ùë“ÔxOEç¬ÜI)Ç2Ë}@ÒÊ‰‘#OþAMeGº1Z$²’Rê~Ñ‡µù½æUN§´¡m¦,/zÓT&^y¼¬Z3ú›í‘ºq+–ü2ZDJºŒ*Bƒ…³9øaËÐ—Pºš2Ø½¢îÃtªpÌg3|©F[cnª[ò·½aï&o·ˆGhd:d ‰ !"Ë¡ø§ÉÃ¸†Ò"çÆé3wkÁéŽØ“Iëü>¯¦;8çk¦”ªö¦‰[p. §±æm	Z•žmîÙ³Wþãßÿ©*õõNP÷:Hl=óég¹ß÷:§…¢ü&ƒØQˆ…5ÃˆÂçJŒ(Ð€ØPXïC©ÞÁ.ÈþÇ¿ÿý,¢á4×äÆºÞP!=ÒÄZ€xÎ©‰[‰„ìý1Ö³~ŒæSO˜ÚÚëÛcs“Îq‘;i¾ pO¡{š.’—‚àîG¥¸i‚j /B^oïûK<Ú½íàì•ïþë×ÿï«Ð
þÂÅ7äüh†Û¡Ð>u&‰1X*<ÌÇ¿BÜƒ›ó"p”¿[’›wúÑïaî·ð¡b&Ka°@(¡ž‹œÁŠÈ•<–DÈíŸµOoõ!qŒ˜¬"G3Óbt#íazÛ…õýOXß&ù¯ï+5·2ã‹QVy8
µ&ÝjÑ(\^*JE&<M*÷Áf>gi£aÿ¾8š‚æ‡ŒúL?˜ñ¨ÔÚºMé€SªA7<ÐÎõ<Zˆ"O—£F"TÃó¦“«ò¸(©4iÉålôuÄ(9_n`2˜•—à„aŸò4½Ê
ô˜³
–>uóÍD&Ù}ot\	ƒÝèòþ¬¢“ÈÄ3":±Ö#"Ô’ï…wänM¡]µ¼û>¹Ãâ‘ë‚ÑC{èw!e&Ñ‰÷<›KÓéE%´‘oà‰/öÃÏÓ ¾Âg^-dÄ0µN1b‚]%êx3>ºàvœà¥ÁˆóbÍ‹¡ö âM.hBç]OççÊ`È“‚=_`-%Åš9¾R8«a	ŽSÉï¼%½ÉYå¶¼°¤Yé_ñ$:BêJ¥qmˆ_’—FyG‹AüžÖ«˜ÌÊ±ÅÍ>Zå]þà‘ðqXPyË[ø²„{¨Á$y•ö«´Ï§›ÏýîÖÁ`rž>_&Åd,úò1«š)hð=?'B½Ç n%óç¤<5¯c-U#ù=/˜uOžÒòÖ„'ÿüû\þ•*§¿âe®¿Î¯bÎˆ%ÁÐC0¯º€H¡sÓ8¹šƒU‰C¯ëq¼9}¨ˆ!ÍœÁ<TFœHÊB³—&B®`¬ 	b®úŽJöhÑDC”Æ™ª šƒCRþü2¼“ˆeW õ-ºÐ´PAžC¶&Úl7²éT
úhPûNH¢?ÌÁ)F 6Gm˜o`3à]Û*ÞÆ§3FÉ=zý˜£Ft:u/´©Àˆ:Yq†CÙô4jú–p>Š{R+Gð.)[’‰±›Ž?ÀÍš;þÕt™8#Ö±«x#’±;büBµ<a/AB¦Q‚ñ©9œ)‚&&CºùZ&\¼sŽM´E©‘…ç%ÏÖ­x^ŠŸgòŽÆtE©ñúÃ°ßQ·—=’F•^Ê¿ÅDM”W±“aéiTÙ.<a)ÊëPÈªÁ'Ö :õ¬zÚ8$TÒ¬ÎT=­WÚ¼äpT%ÂÊ,éfdÏˆ”ä‘(Wb™iFPŒù.XÜ6Fäân1»©›-J\Ü½þ•)öïRú<¯††j™æèz”y:;ž×÷Üu‹3à¬4 ž>² ‹µfüa\¦$»2¸Qš§pl¥àvSa†dJ/¶±|GãO‚>ïÛe+¨M]ª›ë¶Û6Û"sí›VŒTK°Œ¶i´§Ä3ÑyÓþ©Š¨eõ(·ÊR*c›ìõyòT>¸÷wÔªã¥Ýõ1Eìöi½¨‘ê½º—1ëe¤·4þ	åE|MãÉx¢ÞpçìNPˆâÜ/ÆrMt-ü~’éPË±÷Š»PrLL Ë”Ö j×qsvMÅ‹ó°,Ÿ8ÏÎ æ}»á7@Gt17ÜéŒ‹)}.;Ê<–J~-ü~k*ÏIœ¦²V›rm–Ü‘©1_ñª³I!#At5#(ªu&Àaz¦lñsŽZ©îñ­S´ä<„O&ôÎ1ÙÅ%9£j»¥Tƒ©Pƒé‚¦!ÖÒÊÖGvGÝû$ syæJø<%C»‡ XüWV‹j6Ì—¼=´±¢GK|÷ÈÍºácŒùÏCŒD•¡·0…Á€âTÚæÄ
âø±ÆÊ=ü’|á³¸Šªê¾9®îÃ(£æŒé6ã2Ñøïì2Ñ®…¨e9=YšHòNÚF–FÒÉAvF½7$·m©#(žüeRCjŠC÷Y·ä0fwOçô;£_Ž"ÁN(;Ê©CŠ Ó5&fÛ˜õHHB„êó‘Èß¡oŸüÄkQ?Åž?!ãõºýœsð0g·ÍAç"“V-žÕÚ@~.T—DG†GËÖ}÷Ñ'¨6Äø¼>w ®mgð7hu{‡Èž£ý)W)ìS—O‰—Óþqnÿ%­àÍxþgL, 6†fêIû;Q•ûä|?¦2­9r$
5Ï¹B}&‹ªáÏ‰ì‚ýE˜¾?%3"Ô9×Bå3.ï0Iç—|!Lu×ü!âs~FFþ72ÞÃ¸ˆ:{øG±i´l:îêŸé"2=yD«­?%M>3øY•¸>$­¾¤CJ^y¨©Éþ'þK\ZÚ%ñŒ~ù5iù%yÿTXÜ|K?Þ¼¹6i*¥~uÔñRÆºìö:Ç­¾¤:2²Ywb*˜‚ªÚ$xÇ˜bZäw4½=|+C—ÑŽ?¸ºw8vI+E1ÿA?oS™g5Ø‰¶|<…ûñƒ)t¢ÁÁ°ÑzKðïréÝ<^ôîëû|àƒR#º×0”!UMôÁ½äçeÓ¶¤÷U’Ÿ8›,BCzÈX„a‰°”ùë.		>Y.&zÚõóÐD‚ÀÜB3?¼¥¨ÅÌˆ—4üÆÀ°rxZÏ•¾ÖÆ×õ>¾Š6I¥Å<à¨­\L†§voJ¾"˜ú¥%nÀnã>i°DiTàÿiôýöãë¥€|¡¦’Yk5™Åx$Ø7èÃrÀüÿ  ÿÿì]msäÆqþž_1¢,s™Ûw.—<†<ß$1æ’ò‹®®tà.È…»XKò(šUrªb•?¸’/¶«Wì$V|%«d—?ÈvR±ÿJâ?¿îž À’¼“NÚºãX`03=ÓÓ=ÝýôõÆ<v:ó­sv•=—Øx#ÍˆVV9ã›j°No/2’Ó¿L(œùG–{ª]ÀN‡C&8æËXeOøw­Co{”ºO—M"7ê´è´­vˆ†:¯AJgaÃœé±Ö² \Ü³Nì3Ç>
-„…\EP_ŒëYQ×ˆåpèÛÈ3ê¼ÖjÌgiSùé³³=£[®1'I®½ð^|Ë™ “»Vþû„ï€…òêL¬4[ð@s/zÑ	Ñc˜ò­W\P§Õëp1ˆ¬Ëc”žFÅÁä’Ê5so,‡]®¯†æ‡"î4B%i+‰ÈcêÉ!’'jp üÍ÷‚€ùB]l×è˜pîŒ@RÐû˜¤N1ËÚËìí‘óS›‰%ès9Ë"½gYûùÎ2Ñv÷	ˆ&Hu7“5jàgg~qþÔ.”S^™zÇŽ«nåÅ¢³ºð^˜“S²¤×S‘y±ÒØ,=å¿½÷Â¦é¦ƒnš½	;BoÜ>—ÁõNN¸ÿ÷¢î›z¦ÎãzbÞlð¹žªqåé¼Ö~ÞK¢ìB¹•W¡]…ŸI›®†?ÅD{Ðgg¾¦+óŒ­äá€]Cs	]o²Ù…¢¡AC¾@ò‡iògßÄŸà \¼0¾b-ãríD¬ôÔK¨h¯[£×êÛÁ€:C›UÖç¦æäc†óÌ‰Ÿq®!mBÀ2æY·Æ2ÆÃÍùvhæá¨Ïø&0nŸ6hó_ø¶mÎ~Äí1´%xuÞ|S›ívB€„•U€µÒ¦ÿÍqŽr¾Ì.ÙÃ'öÅ2ˆ³<Zf<ë»¶sy•Ífþâù[VoÀŒ	ÞÏêôjÿbNÔáaxå¼³’¾HÞ%ìke×æÊÀ%7Cé»Gß¶{“:hÑ¾câ]sõÀó'•ŠUeGÔwGAh­1¾æ6åòZ,ûuö·|Æpÿ«ðÃÖ£«¹Çl™Í<@ß›d¯·¬ä@{NlïÄ·Æ`U‚Ø‘ÐmG§ 3ákµ‘ÿi/ê¶=úg)ÚgoÐBU±Ýò{öU¶Áaú7)?½üØg{ÖÈv‹Y¹§OÉDÔÊà¡EÛ=‰,Úp<•E»¨AoÄÖ™±Û³ª(ÒS¶!;Ûì‹ÞnÏñé†íËÀºÄ€Ð÷‡Ø>Fr»×	ÉùµðEâFFé¥y$ñÐü90À3mþC¹5ôûTIûcn¨{FEHsÞ¯Þ/iæä«åoN*sÒ ÙKcËhÈ&8±8vˆ4ÈM‡Y‘7°¥ Ç¯ !„ÌZ®kÂX<@_òš4‚²Flúy·g¢¶&àµÉnÐ’‘·iq+× @oR$§àÅá¶Ïtý'Ã-\Jõëé¨÷Ê¨L.‹Øh*>¨÷Ø‹–È¤Ë^VÑYÚYLd#E¹Ó‡ÁIùòˆïëOrŽÝÌ°¿–š=g¨À²³&ÔRËÌÜ‡^’Ä{ô8‡hËHÝ(záóåÂ&úéÒšjº`y¶?Å”)5còžyI&LÔ§_ÀIó-Ùxœ8?!9òGÜî…ÏÉ¹‡ë¡~ú´§[mÎ½wÉÃ:ñJ/:auÊ-;ù½$óHéÜ/àTjsñmí±ð~õLqý>¹KÞþz”=ôyvÃÙÌ œÏ×X­ùŽ²øöW%­÷Ç÷" Æ¼qwwlOzƒ˜_\Ö ‹ƒÅnßñ(® ŒÑÐE·÷r>oóº0+}‰þÈ[=gr#$Ë©­`žé0–×po	¨f•D-Ú·};lœ+34œ3H×¡8dxQ0vF„J4£-{î&F ¤P‚k	ÜåO{q•ãE™{¤+t@77qÖgÓŽ¡Î!êPÖ`û6px†ÜÔ…)9”¦‹ñ3­NSxÑÇ÷íio•m#fÀ*Þ¨ïp˜:'cä×bXÒax¢F©mð¹y*+MÈ]p€Ä7Àó¼'‡ýØé<ßÔ´Gð1M¸_à:tP£€;4©¶Ì!€úöÄq!Ì(Zô´íñnÒ ›î˜D¤Ì±þ$\š>*ô7¹E=w(©è¶÷*pÏ‚|9ÜÆ”pmôøåŸ5‡'¼)C·í8Œ"r
£"û›úPûÓgrôÆ{yäƒÏÂØºàT#Oê‘_Ž»[`¶A‰Œ‹è’ðJ’m 0òŠJÏ¹œ¼U™%Sšqã–½Xš;Ff>ãØeÁûw2¬î‡Iƒÿùð—æTWÌva™+Ÿë+æ"33dLÔA­EPdV¥‰‘ÞçQŠ¡™RÖÎ‘ÀÊÜºá¯ë±˜ ÖÆc÷B2ãŽK¨‰ÿ?QÈ›€lÜEÈ±Ó&/ë@P|)B„7†¨5Ip…ÜÕ¤ç™ÞÓA”ªs6#73VIDj´YˆCìë‚.(¡<¡Õ=Ë-›Åç°'Ä
ªòßÚþ…~ ›„ŠèÙbì]‚utÁ¶÷˜Õïƒ–TCÇ„f‚3ÐAªÒá¹Ê<Ÿ-Ð ¸äŠ ýs5òŒ‹M}JŽ¿•{Xè?€L‹{|í+|,Öëu}/¥çöØ¥ÉícžÝ¦ «Ò|k¡ÝÌY•Òákq™¼ÌRdž§š‘RÒkéÍÈCê-oŒá?[GTÊcUá¡Z0¢‡£`ªh-EÁ)ú2Â³(o9º´±¢`¾SøGå	|+ƒNVÔ>3N#Ëpø¡fŸ€õ%FßPÒªi&:²E]ctƒÝê¸îJcÐ)â±¥Ámw´8  èdàèÝqóÝ9sœ9/zSK§Î¿a<2#vóAËûAV0{}Náó)êÅ†(\Í¼=z2ÂiÂ©s‘é)4áÚ{dÃÂÛ°¢éÍjÔêfU48¬¦|åz0Ãî®ÁF¾³Žï»sÇÜ’XTNìIQÁì‡³ý[y£«Ý/åàJÕ^®tœùŠŒËØþ^e³ÎD!á/[Ø‹ÖŽŽ%†“LPÃ®t£’w}ÀzÖ^]raóèžÌž-×hÑÑnâ}(†R¦‘5yTe°Ì§…¬žcžAèv–êúÐUZM¤tF¼·RÁB9­¬¢Ù!…ÁÛšƒõ…Á“sùq!y¬vU4I›é±•X:ë"‹-7…l:žéL˜ÄW/‰ºènŒp5¾(1Ži5›¹vúÔåªHC‘`…x—C¨mÂS7dv¹¤Qˆ¼³`ír àò)ÐÑP Å‡„½§Ì­y”ž¹×
v|%ŽÜ¦æwHîHì0á0ß·î4Uø§"Ñ<æâÓyBâ/˜áxá«——¤³É`ã¿ºzí1¨úù89mž$0J##b
Ã)m0Kö€)S+Ÿ=o|êZ¾èš¯D ’é=‹IØæ Oq¨®—S¼.+5µÔ<&©™”x”P!Yˆ’ãxÕ¸@äÔ-È•2pês,MR—Ë‰ÄúÖÄaã·-Iâ‹«´fÝ¸ù¼%HlÊçW|L_>\l¾–_ø—);Ž
%Ñ¸Ûò‘ç‹r!Ô‡Kkà]JÕë…ÉTahôR¤Ò^Ôì Þ·
è°è4uˆ.5 U¬õH_·tH‹Ù«6fªáh´j=¬×ë1†§‰ä¥=™¼ø
ý"4eL¬zò0 !]Ž0ëåT?A`hBÙ¸…-ÈŽ*(Ö Õ‡ÛD†òþãeaòë.Ö’˜ÏRÊÚ]3›ó*¬$oÍ½Uýëù¯+«‰ŠèúMÇ+Ò<Â4Ób¶°:PhX™3‘ö;,ªsüAoÇ;·ýPzôæê¼îÒönÐŽy8cõugÔsOA©ª|êûÝïf=/·¹©q2eIÎDGÓ•!¨q2]I^Àñ‚)Ÿ÷ODþÉt%\NEà‘¡MÚA›ºdq¯­ë'¤‹(fáhþt~ËPiW°‚a„EÁ×adá	—e‚ªœLRº½Œ‚ŽI¥ˆxÆ6í‰å¸0ûeÆM ¢p[}JjMÈ<Âlgyado[ˆ_‹BÁç&|Ê‚‚7€9{GD‡˜ù†šq£¸y½!Ul@åd-‘R+ìa4ÝRÒ½L—Kë2\vdòQßîaÂx#”Ûç™7 ì¼EÅÂ)Ç&gHÝÅ³ ¨àÜ”@%çäòŒ‚Ã9y®æG*c ‚8Z.¦‰OÄÎ–Ù¬ìUCÒCüdà—Ë§üæ»ù+—as®à$-Ñ‘ÌùÇà‚Hs¤u·	ŽSýÛS˜èÝXøS:e¦.sf,uÍX°‚úXŠ0wVÂÏ”ýH„PˆÙ18A$NH·Äý†ž9”k€ÐÓ³4êÚ!Lµd!9I”8¶t¬yû9ñ:tË|r@ûµg·	ªžÿô.ÿ–…Øþ²Ïf¤þ”ÓXOÓ¸ T¼((Œ/>›³~ÏöŠ7dþKJV¡ÂñTgSNO‡GŠ\ÿwÀ[>P=[Yà$I{ƒò¬µ[ífd–¡”hRÃt×ÅDü•ÉÀ¶úF‚Lü„Â–èMéQ¹ˆ^fkkžic2Pº:ÊvgîmïÁBð 42ÏÂö|ïçàJc2([ÞÌ=‚&=¦{>æÕ*±I§+h]n<°ÝƒéJˆá§+aß>¶}*±é-gª† ³ÈâG¢ZKÉOó
…ß}+ÈÆ+\Èâ•‚YŽa„Lð±û°YoÎ›MTú5)7}ñŠ©þò‚<÷ ¸Þêåâ•Ú…RõŠ[ët@y	VAƒc<6´&½Då÷ÒhßÇpú®»v‡ÊÁõÅÐüè÷?rGzžjk®žkd›yYÞ8*’O9$?›¡k
ˆR„»‰³¬âQ,óïë,L
¬ü€µ	1ÊSÑ;xö" xÓ+Œ¡ñê:ˆkø]Ñnï©Ÿ×e}“9‰gíQííƒÙjn«ùF#šéfƒÈ³ÕBÏ€$OŒNA›rzŸÁ¤ðP»ÖwNœ¢/‚Uõtb—~,°¡·û¥Ã*¶ÚËhCÎsˆÃÏU>‘ 
k èçÜYÀí€p½'ß‰Ný¸„5ê{Ã
&¨SS+f[)UGœ´õ(h¬Ô‡b9²!:_eÛ{Æ½˜xµû:©€u˜Ë)´±ÖªëRüd”˜ïd™ºbæ'Ã¸°Kÿð§„|V„Áêª™Â=Àø_j–
»Ó‘+­~ó5þªœÁäçí"~¦±†–êÑyØy¡Ü<Ä­&L÷ÌŒó—»Ó´–¸ˆ-½l"_è|4<ÿäªÔ¸AÌúYâù¡@ÝÀÉ8[´Šv-_±²„H*Ÿš)Pùøïê‡/½N°ƒ)’«{á	2$±Zë(¨à’_yçPZ–t[ÌÙ
kÃiÎÛ2;¶Ü@kœÖ}Jõ„ÄãøºåŠîWÈ›2wµRKã"Í¦,a•UÎ,Wú–¢Sèëg¡A»%(Åˆ…®ÌÕá2îWÚU6Û4‡‡«²ÑCÃWÈóR,¼3Í
ïS}MÒñØõ<ŸÊm°ùnÓ„«/i¨–DE½Æ‹‚"»åp;“
é6‹?[ªìžÙ{5ýýNaV¿2 !e€ix2„÷ÄY g@‘ÇÅ«^ŒùÉº¯[÷çW]õ½eßtUx:c·p&Y¦_
‹®Ñ'OæJïášÌÂ:#sï¡K a‹Æ§n ÜÏþ\ªì®ã¥@˜¿¼ÿo;°Lg”tþÉÆõCÿ)MÁRôË³êŸD2”ÜœŒ\j•=~NàRô2Rë¶dÑbÊN‰’|y	Ì˜jISvZ-»5,‹ "Ë¨i\Ý"1”€7Ök¶”îu[
@äþJ4SF¶÷y¶'Ê³_UÙcvÈÛ…˜ÏFùº^¬ìßŽcÏ@¢PoO}Î‡j»ôÄ~ÜøÞÐ.9–J¦ý¸Ö®D1íÓlïŒ'³%M2 ¶ƒ¹å/lß>sz´…;{à›vðsF5ØŽ5†ƒYÝMk£¾ï9}¶I×´·80 b?_o§Ää+5Õ.‰ÑSM16æg5Ëéä[[®nxë¤ß@³×mïØá…¡š…Þ#å˜h{LÍs'w~ÚêÎM^e×‡B“JÍ4"9Ûx±œ>47>oª%ƒ|EWw4]sÄˆ›Ùâð±¶_Žâ!.|8¾Ý› {[÷¼'CËòâ7ßø~Öôòª8i«Œº^Y_¹Àsv|yV¬dååklÛR³¸è¶~p~óþánY²¸+×âœ£HÍO®¯Fs{¶c¹¸Üê^²	i­'õ¤ŠÔ‡ƒ{uºOâÕ÷×ö¿¶u¸ýàM½Ûd‡ûk_Ã³½íoní°Ãµuõ)ßš˜€—ÜìÐ:âŽÈ*lÌ.©gVîË÷œ§¶Ü·FÖ‰í'ÚØ¼%X½ìúè¬>u ~IÒÞXgöAøÇ4Çk©G·Q\Yn²îd°=ZëÑÖÐrÜÕK+<VïndQSuìRÏ(ùÝÎîè­í7ßÚÿ‡[›lã­µC¶þöááîVY÷&˜,`ŸTã<v€§}æ:Ol¶á"À&ÏŸ9°ûv`¶c¼/O—Ý¡»QzÃÂ	ÿƒï÷€CÄ8[Úû4¬bMR»2ëÂAo`MÔìÈDd‹6”Eœž×Z]íªA½à¢_mÙ¦uüˆ9œÍ-µ»jôá«Ý¦µpœ
ë‘~€‘5÷aDüQ~î{B/LA†&²c„ ß(%œ'O öcô°ùngüôÝ6þñOŽ¬ÊübõîÝj{~¡Ú¬wæÅ}-ZB`Ç«3dÎ9 	'7 §£ï%8ÈÞ© ÎÁî)¾~Gzbž¦Ž©Ó]kÍTËøgeG_"=B˜hpÍ>ÒæH–‰êíBÇºÖ˜žæzÐ‡m1O€!ìÜAÏ-ž.chOP«Lµâì„üE×½§«3MÖD¼ü?£º,.J>þåîBfRSÛ8Ué—f•¶DÌZb°$‚•¾}¤‚¦©Nu[[ãÍ¬áÅ±–È-xÑzwž0,åì‰=Î@¯!)BÑWg¨6Înqrì¸0øV”Îó•ö6ˆ –o[ø&ßBKû¬‚¾VäàÉëÍî dŠ÷„ògëáþWH†×,žÐ÷Y§ÅÚKlƒ- [4uÛl~á»³ ×á{·Ñºøg‘uî²…»p¸Ã:‹¬ÛÅï¿}Ëê¶ë-ÖiÒ:âßP´¼Ö‚:pßôø¦7ÒPxþ¾3£«2ï8ŽV¥û÷Eþßà”énÙqFö·adÃÄ¨¹3E¸•Ž¢Äl¤Ç rBÚ-,ëœ¢•#FYŽ&<IS-=‰–w±ó€fØ“p´Øe$|Soàè™‹Hë.ü
.-é‰Åáo‹Íº =Á#-~ø7Ðú®¼Öi³nÿŠwÀ½•î€ZðZ¥éi¢%6}uæÔw+¯ê'é\â‘FNïà”‘«Ôh’ž,Ùûù™$Ùªôèg'©õàMÃVwGˆ Lˆ‹§ë{kR¸ˆRx	«	Ñ[Êµ;:”ÓÉ•-æå#å‚v´©Õl7[Gš@‰„°"Öw÷$¹$ëyNö\’¬gñªÅ.Õ…ÉPBÊËr1²†ˆ[Íu©·Ž¬>È‚…ûŒç.ÝÕâÍÅÞ:Oía¤‰‹1A‚EAÔ@<l´LßI3÷thêÅ¡H—Rºh|ËBèvW5ÙÅ‚‘4ž¹÷Jº^y%vèyîÄ7xÄU‚	±<ì9Aƒ%ïÚ´šG­æ£ÈœG0½ú>
„1¿6ÌÞMeF+-Ä7|Ã$r±Ð!I#U’WQüŠ‰Pâ²*@éÄ.êynydOÈ
¥W¥`o]f+ÄPÔëdXNZ	ùØ ¤cwaÐ µéX  ’‹9Æàa÷ðÌM1jú=~õb—ÁÀ;åm¸¶å'5_½:&åî÷`lÂ§ ÃIï.®=l@^àÏÎ(b¹T$ˆ²Òr*ðMÌdå¶Vú6û©3É+*­,$ú¥B._©­“Rü,%'C0œÉ^v
ö‰óÐ˜úÝ*Ã†/T‹v–x²EÏ5«…:¯äÛR860†”B+˜2 ”²+¶iH.,™ç{Ïi§ÍwšR7mÏß­v—ð_³ÞÝ4´YvuÉ°Þó`Ñ…o%–ÒŒ”äšmN(¥àÒhFÉaMmã’ÚÖ..JÉTW-äOµ0Ë. Æ™ngð`àØnsÇ¨ÄŒ®qi%d qeÀf¶sÑFçSvâhÓ`tp‹Þ_~ú‹ÿûÃ?²ƒonÝgû[[‡lc÷ÁÛû÷×·1Xr0¯­JÖQ‚ÚEá®|CÚ:´.ŸÀT‚5¬À%36Þ)ÆG<{&Øùs˜KóSÿ‚ü†§ÂPø=ó;&“'ÿA† }Fý]úó›~@qDx_•o`FÑkþžb…"L’Ÿ‡ ªJ¢ ðòŸ¨"?0qÁ3%4‰JGÈU¸ú¡Ì„ø„^úÏüä×ôËï…ÎÊ~]»}=.HK«dYŒ¤¦uâéÛM‘j*t#š˜™T…¾ú€úiõ'ž{‰÷uŒ Ý'Ô-üú÷ð!ó±üá—D³÷yr…šÞƒÄ^Ìðà0»ŸÐßgaž¨ßÊQÂô¯L–ò!¾ãÓÞ'ÐÑŒä ùMÔÀYtd”À Ô2t$
Yª=ÒMãl¬žÐ‡ÿ¬‹ŸZÐÀ¢O©mÚO2´IncÌS‹™¨Ò>:êöqrw9/»¨nÆÐ´øS5dümœäÏXeÃ9ÕM›Ñ²c×o€(öS»Ñ›+Özj¸9tþ"Á+nðãa·@&±Lšä¬ƒ·A­?ÆxÆ÷ªÉ`T-o§¬M…	¨™·+HV•XåB8WV)='­<‘°Ó88íõ Ç¥öTHUÂ+“û^ßr¥íêK]‰XØ~²c*#g¿Ô•ÊêJ—÷žJÂüd‘Æ\Ô}ØWÒq©_Ÿ„(:ŸA³:ãÀë”¾Ô¾¥f?Rû’O¢Þò*	bÚò–eyŠYó½ÀNF—DI‰‚®«=[ê&L×êw6e¹®&qEŠÑD+¡r¢$Ru”YH…©êäT	‰•ÑE%/¤Ë¢èÖ›4¯Õ¼,äˆ•Ý{²áø=×nkôÚ lƒ•oòÂL:òº§W’µ.?%5ç–Ä¸Ô;`ß‚â¬í‰¢„™úöƒÝÃí7¶7HÓ&€­Ý½­}:co¬mïlmj]óž»N®k”ª¯Û-(ÏOÝ(¸Vã'ÎÒ@À]îóKõ¼ïÜOò?h.9Ïc°…ñ©¡•ÖC;šv5Ë`œ’ujÕd•ROÀã©j-ƒÚ*$—BüèÅþ_rö#¾Eò}e÷kÅµ²[êã–ÄÚ0Î\4álQ:¤á¾s“ð/Qú±ûüE‚/(¿‡²ªÎÈUÜ_Œ¢j"eÞ“Û°7†â“ÎÜ™v84‰vxêâŽ0ÊuX~ò’„½BëÞ:s¶)ÞúKM­aŽovë÷)RÜïÿûŸúlÓëÑyp{Œ¡Ã<Ÿ5øÂ‡4>?¢}ÄòÝ­p#í?ä¾Ó§8‚+ïÙçƒQc¸ÕrÛ\ðJ$ïD‹sÕ´“°¸ë ¹ž6½¸a=ù0*2\n2¶Œåm1,Ä¥=@!BŒ¯$Øo‚YG&=Q &n¸À€ˆFËýÀ_)‰Ås,-ßT%-t@XH‰V:¦“^s	ÛÄkÎzÖèÌÂTD_wìs2Ìš'˜â	ZkIŒ«d§®L¶Ô<Ðí“(ìó #]âZ Pð=gÔ#žÞI{ðeðÉºŠ×Š€Çµ¥Ô<\q†'éÁê÷Vãì4½ªXîduF3}ùTI‹,±Vð;[xex”˜ëhb9£¸î›åãš²ëQÍE&L%])—Ùcæ•¯PiÎ^Í1îd+.ÊyzÕ·Oæë ¬Ââv);#XùEŸó/J”îE_öìyÀƒ.VgF¸‡È/%›–š#úe61A6 ;}X¯Òùn’ck8©©;Î˜ØÉ“µÀ°+IÔÕ`LR«‹8+á³ºåª¿VøîØ·)ÏVf=­4ëUFWk¬Yo/Ì™ö®pIè¸ñÍw>nB·ÊòoÑ‚Þ–ÞÃMÎÜwvwï³Z.çÌZ÷ãÕL&ÐRÝvR<ã2– .œA"ÏÛÕk7³ëŒ*AÖ;/)Yï «q©8¯¹ç\¼ÁI7ør¤EI1±î6_¦îßß=\;Übùþ™Y×î¾;/k÷ýWF÷=·Q›)ÉßšŒž$•‘RKAÅIøGfÆ²/¼0z’_M#4ðLÖAiÚ§=„¢²»ö4
UãÎ–[C47TFF½ Tf+€¯.*Ð—¾Íößp=ƒéøYlø. äÕ_ý?   ÿÿ ÈÏîM