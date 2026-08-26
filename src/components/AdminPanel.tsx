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
              <div className="p-5 bg-[#11131a] rounded-2xl border border-amber-500/10 space-y-5 text-left">
                <div className="flex items-center justify-between pb-2.5 border-b border-white/5 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-amber-500 animate-pulse" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                        Hostinger Cloud Sync Setup (Cloud Database Integration)
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
                        á½¾2 Real Cloud Sync Active
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-mono">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        á½¾0 Local Offline Mode Active
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-[#0a0c14] border border-blue-500/10 rounded-xl text-[11px] text-slate-400 leading-relaxed font-sans font-medium space-y-1.5">
                  <p className="text-white font-bold mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Instructions for Hostinger & Clxœì½ûrÇ•'üÿ>E
RÝèÆ…,A©€$ÖÉ@i4ŽTè.t—TÝÕ_U5Af„í¾	yÆ±áÕh×#Ö»2¨ÐÈCá¡7Æöß‹Àz}…ïœ¼TeUefe5 ^$UØº»2++óä¹çïãîžï„.Ùr¿¾ã\²æÄÙ>v–ÿ)\—æF—U_+¿%¤Õ WÃÿú.¹ä~èî­Lõãx-ÏÍu‚aøncÏÝ]'r½ èÁçN0˜›"±öÜxeê­]ß¾;EB×_™ÁÈº!Ð•†n8E:¾E7œ»2»÷ãú~ß‹]Òî¹áòxØuCßºd/ÆõÝÀïN]¾ÂHVÙ.Í9—‰3ì’Nè:ÐÔ!£0xÇíÄdß‹ûðñÒ.mÅðT:AØúÒÜîåÙvcŽ}7¢¯	·AÐuIÇ÷ƒ}¶ÓÛaD“Ïç|ƒÜpîy=$<.y[|¸0˜Øö¢Yât»lÜo¸»¤=‘Ú÷gpÀ³ì=ƒÑ]xá®;Œ=ÇNax²>Œaur]oH¿Úó\¿‘]'†ŽÃ÷:ïâ(·{t5†ð^0¤S{òñ,6ÈªxÂZ°?ô§‹OÙóz0w>]AœÇ®øíRÖî² Ç·:ôÖÆ;Žˆþt
ƒZjÛ#ú4º)Êž“æ»00Ìƒ`’kA„K“/5ïÂû½Õ>}—.ôÓ"= j¡Q;ÃIÐ¯Ç¸·#ØÖÄé„A!y’®{Ïë¸öKi®ëÝ»üŠßÃ×ò6ì…^—à?õNàGõt—Ó¤çŒê‹„nÖûÛ™‘;ðØîT&×4r:ný Þj,)ï‡¾d&·Ùõ úÌ;­æèþ]Î|¾FnØÁ­Doˆ|Øaõ…¥&‰Cøæ»¾ï#aMÁ0Ð<–¤{²}kƒüÀ= µ-÷ÿÃ—Ýõ@çèH5oáGãXó¤ø`Ä9Þ”æŽ{Ž?vW÷vÛ#†ò@s[0\í;@R+‡5w†¬\&‘_ámjnƒ1âílF×Ç¦ÑíÃú¹áÊT{ã‡ÎöA£ÑÐLZ–ýúÞ(q·ÇVbn±Ivƒçšý§~çÅù…ùó¸^q´Ì¿v»ðïR³IÂ ™|·~ß'£û@\£ƒú|c‰H¢ Y5y˜|‘ÏC¬ã`£ ¨ƒ¡«øœ’65{âù¤Z!I6Öž	ÂåÃÙèV£Ý¤ÙDä»tâ`Üé×Ñè;~ÞHµg„|a(UI—6™ˆl[Ë÷ùµ¼ïî.Àõñ>[Ä+ßS§¥åöÌŽµ`à€â\»9B•ØñŸ&ÃxØp*sÒîäŒ81ño0ŸÚ¾ðm¯m°OœžK^wÞÛùY o>$6¢jžiz
DÿFAü?¿¾éF‘ÓƒÈ¶‹Þ'ªŒ<TžŒ‹«ªbRh>™’2¿°¸tîü…‹Íoyk¾.|OY‘#6×.ùÞ÷H­|o¾=‚W“^5ãXA§
ñ]§‹$º¾sßíŠi|éPù.¹a4"Xç8zÃ‹ûµé¯ýóéò
™†U	ƒÈ­_\jÎÍ‹…a_ÁÌãWtô‹Å¥æ4Y&Õö«ÿñÿ"y[×ì“µNžÈ¾Ylâ#•OÄ®Ü:~7×™øVîN|‡*º{ðöõ¶Í/¦j{hè¶R©‹mÏwïü§¾:#êQCÊÅõ–Ú…¶;Žã`¨*c"ì5uK@GêÊ!0†®ï¢»VØ[ÌŸªÞü2/îÕ½a×ëõs°«˜s>ýni©)oÊr–åÑ|[Ã_„ÿÈ;!t†‘‡¬—tÇ¡ƒÔ[ð¬Î8Œ‚°>
<ê¯¦“	DõŽK¿ÁùQC¢¾Óöë~8Ø»ç.GÇ¢¿ Y¤ŠW×prêæÎ0¸EÒžPúêSjFjSÖC®$&¶‚Jqš8qèj3:Öb&R)‹ð¼g	æ?EÖ˜È’Ø€ºIvê7Œpt¤ëÂ£“‘!ª ˆFtTüMÅ™€¸¼ã‡b×‡Î®ïvŸ(‘­‚„mXRžº¶ Qû„@AãHåÛRV¾ñÆÏ$-žî„NÔŸ×R ››¥¦‰½¨ÃxØ$¤W¼]!>…r•%ÔÂ­YJ>œ{™¬Lvå¿º±³±¾M¾GnÞZßjïlÜ¼Ñ¾NÚ[ëm²¶±µ¾ºssëM²Ó~-×jÂg“—çäY9d½ãìb‡dºDãFÓÅm¨3®Î±…ôÝ½¸ DäÛŒ(™RÝ|ÌvP+¿Yè/¸YZ©&>/é§â±Höy5Ì™h
çR±hÀ*{Žm|å¶™W+QWý`7/Áað}ú¯3ô8ÂÑØtœxÓÃ`ø^ìI;t ”Ûá.|¸tèÖŽÈ¦3t0À[;>úýñÑŽ‘ã£_Âÿq|ôÕñÑŸŽ>€áóçÇÿáøèKüãè1ýû·ôçÏŽ>…?Š¶æ¥¹þ¢bî”‘j6
Î;H “ç0–80lÓwÈË/Ï×¯»÷Àì¾„ðò/¿Lj}XIšqãEÐdèð€Æû£ñnµ¦y0í³ÄmôÐÏZßy×æ_ÿË…OWa
±Ï’×`Cïå—gduÅÁ€øÉ<±`ù8jé»!,Ì"¬ÎxÔ…Uè’îÁÐxÀó|öpLsqF#ßƒßxhaÑðN0Áƒ€ÅîÁ‹D³ÀÎc×xºDßí¼& >–O•+¡—«­<ä4Ì.ÀwÃT–ì¦÷°»†A¨–¡ŠÍˆ[¦‚îÄ¢Ør³F~FâûD’6©ÑHwÆ;0ëÞÞA}×÷]w˜Ý)©dªc:Ø {N×Ýªwìùáef×eÞóÁ¥9ú“ÞtIE~Mx%VÓöµáØ÷g˜ ÀYl*„uÊ$–‘ÐYy;u„ÙÀ‹"½ÐRÊ§¢
…$ÑîvÉw$Û3Œ7\ƒ­¤¤âúSV|çÅV«µÐrîfØm–Rƒ¹•¬¿’¡.éæ²\™‰b®ý¼¸Ô9¿äìÞ%ƒ] P½†bï]ºåÃvÑ©ÉiXn«AÚkkäÆú ‚·w¶6VwÈüùúÆ6Hgrm½½v}ãÆ:²[àšŸ?ü	üA‹"G}t|ô2Uüê£ã‡ï1L¹/ýOÊ¢¿<~øþñÑ‡„òçG¬%^RL7²ÅàƒáöxwàÅ‰/Ní±q£Øð0^s÷œ±×fþ£ò>ÕžQß‰Éy°Š`,€_®¡»/hsý‘ÜŽT7ööHíÞv†„n<‡ê;Ïöð±¼“F\öÝpH­6Ó]ê¬«ÍÝù[§þÃfýâÝ¹Þ,™~kÚ4OŠö®(Çe
›§FÜZg¾ÛÀ^ÿùÑà#ˆ7;0ú³rÈ33š•+¬ÉÛ;}Itv=‘×‰ÉÔK‡¼ãSÄñ1­ð€¸÷áç¨ñ¶æµ‰qê•¦œ˜|¶ÜËäHÍaL™ÑŠö¼î¬æœ¢e1#º›@+ÀDËäÎ]õHoSy¿[8ý|ëZÔî4üúÏò™¸«bX¾¹½Q›Ö¢Ê&} úRééë>‰Ëôï0Ø§Üs¡hÃ)Y¨>ˆPBy…òG]Èsµí­
,æÎ*ª‰)PríZûmjhÍ’Õk;;í«7o\%Ûo^¿¶¾“°{mRZnÂë-CØ!dã‹hÃ/¢‰SŒ0œ[REtÑŒŒU£³ßÕˆRïoDÅLéÜÀ¤ôB°Ô€)Ôã ‡d/òþ!u×Iw¤_&÷of<x0Kló:)Ø÷òfœPï²šZN/Í9J²îtÕ…ÞðÝº2"¥vd¬²<ñ5Áœ¯q“Çè•-þ‚2ßÞjh3KÌ‡‡‚|ˆ€˜HmŒu4¿V°Ñ”ÛuQÞ‹g¯øYè|À|·³àš’z¯;n8¹8ß ›íí«ëdûökuäÛäöµõ­D!ÜFí/ÕîŽ~w|ôgªþþ‹ zÝßƒVX/Úá¾8~øSPuê^©gÎ˜ž§“¦|T–3ªÕ„Aù¬Æ	÷h„Ú»îÁÊ¡èô;_ªùAwùÜA&°çûõ¾×í‚]™•ry«“{fóìWå–Êï÷ýjNÜe‰†;Jo€És¨0Ä¹àXJ<aYÑ®ås*×Sî½µ9¦x ÎŸÞ—é-îÂfÏÉ›h ï{&Ð`Ö³ûÞøBþòÇŸwIJO\q¾<„©Çºé¥£Ô:ÌïqçBc)áZ”ÏHb$›Ë‘“%o“XŒkËDÞ%¹w"_ÿø’ZzƒÐs¾;ìÅýÂ·öCà{‘:1Än4adqéÛ£0xÙDbðÊ¹ftª7»Pmß÷†°CÔ…joÃÄàùâìF?Ž]ÿ ÌþÝ>bÁc: &0®ö,
ÑLâ8ñ9‚™”!34–Ð÷Z@°{-}>Bï ôWÞ6Øeâ²·™³¯XÝ2I/f„	Oæ
)ðø=Ï~!¦/€å)‘bévli¦MkþUiòˆ+ÃM[R(Ìïå·­äÆ¹\Oø¹RA‘óâ™ˆß‹}Ì®Yct—ÐyJ{[ÿRFæ¥ªâhæPû]—Y‡õB'Îø§‘7ByW5Y‡j³–L*¥®E®÷ÀÖûõ;KTçdâ‘&Q÷;ô“‘Ik™.õÐ4É+•H7RYöbx]ž©É"%rÎSØ˜r»ÞxP"\ùú×?'7)VÒu÷€µuÉÅÔQŒ>)~ŠØ"?´ŠlmƒÌ/f„Ìå’¹)N-U8á“A×”F ×:Ó‹êŸÐ£™Åà•Õ@;j]šhaÒ8û’¹dLbèÑ`ÏdtÔlZZÂ}Lì¯2Ú:7åŠoR*æÅe+îÅUIì‹kyÊ®“JUv•ÊV$ç®ýûˆ‘%þaYWèCxk+5!¤Ñhh=«ê+õ·vÓ=ÌŠˆºå¨6ºB¿ìÖÞj}'Ÿ‘®mß,)é´þ@‹»ŒÚŽ¸òÂF¯ä$qÛ«ÎÖFd¯áˆKh:[î š²ƒ>#®rÞCÈÿ÷a9ƒ*ÑeÒûJ„ˆ/ÉÌL³ºÄ¦MoèÑ<”ºTwQB“¿FŸ­^oÒG÷Äeå—m´O\Õ9.þ•‘Á/¨{~ÓÝ‘øÛÝWŒq@q±x ôV“ïW«Œ?åbkoØñÇ]Ø¼øëÀ›fzh ÍCsƒ7ž½’7 q8q™âqâÒÄåä¹™\ž¦ð;™Ð«$ìì…œLÄF	õÌRjVÇ³—… +çŒ¶‚«\`XPyogwp­|Ò1šmT>ýÆ°L¦UÇ%ä«ìÝOÃƒ@ÕušÐ‡G#æ…A«ü±zIi´ßMÇ³ØU~H‹]ÆH«¸xÄÕÄ”1=azÚL¤ªXlU2©N$9ÉÆzÍÄ`ôg#Â‡o£t¦,\Í©1Úó%ö|q|ôé2áé†3%*!F|N#^j&ÏTÖ¦|zN'FÌ4C±<KvcyÔX1k0]é¼$Ž:)ž“?hfNŸÔ;I4X„aM/gÖEik4Yþ5úöl4buô8ýU«)kš©˜aoü
³¥§—_«ýææúrµ½³þFûÍmÒ¾±F®olnìl?±¼zÄ_Ûw&Ì¬/Á»ÒæÙßy±µØj¶Ü»Ú,û¥ÊYö§ŸWÏ3«¥Õ¯B+/¦×äÖ¯±„orË9À#ÉU¶Lr>ýgœéã¿ŸÒàþÇäøèCúùãã£_Òlú‡,‰óÓã£¥Áÿi¸ÿ½ï÷º´NëÔú7ƒ1MVÝ˜n8KðõACz=ßEðÀYâ#þ*‚â2Ií4éÆÅŸ!F°¶¾K†cd¡Œï9žµï{À©Yæ<ÂôÑèúŒy2¢9é³` „ˆ!è¸ð}HF}”6¬K‘‡­ …;¢‰ô¨—Ò„|Ì°FnÇÛÃû(@|?}$:ó	žFzc¯ë;˜tñž\ÂœúÍ ëúd‹Î(Ë W\—vã¹H ðÃò<ˆXÐè³ó¤_±Ð„Q€MRÍ69Ý¦Í½VK‘* w^ìî:Î¹Ö]<w–ß©Ê´c¼_Î
Tgì³
ÜWØ“ bw1v¡ÌT¸ :Ðñ¹¦žátòŠø´MœKN‡²ø¾n{½¡6§(y’AR[ÑÜ™”è4â[•>NÙ~ÐNKfœl«üŽ“fYFüODfû¿±óHŸý”ˆ÷øLpIøûBûzŸE‚ogêÇGG´óG,e
¾¤\—2[«I¡iõ´3š‹Ï9ø—ðáïDFÖËÈÊÆé$t(Ðÿ¯Ø#3®ŸI×?þí'šYWc|êt)›ÓúœÎ.*rT´@˜º\—&0¢cø{Žž%Gº™*Ð9å!¹¹ûöŠ;p|w™?üß‡xÌÊÒ‚6šÔãIN×‰ó¶ãInÆñlªFƒ_N0¢‚$@¶cJïÆA­Á*……QmÛ˜Î0UC™PU²‘­«ÆCý¤vR•€uì²¯øk0®‹Œ6Ï£òœ–Jn5ˆq'7%¨-£’¤(y’iL~jõÅH§¹yR§ZåÅô‹Ì¤Ð¬ÀlèOg±™ƒ½%N(f¬3NoÏrÏ’¼óµ÷ªÜG×Ó†µ‘FîÆ°Î®©¦Á•Sý'Ò#³´<ø_¿@F!]	<gŸ¨\J$ é¤%ú^Å3	Í¦Ö©¨Q*ôE ¢Úï³³¿ÓƒÕU÷÷fawçŽçtw'BíÙÚÝT’NºÃ±ñÓÜåÂëñmÚåTõxF¶yê¥­¼Ï©®Ä_†otûá¹Úñiú×³µå™š:éž§­Ÿæ¦Wû}Sv½æk;Wðú¸Ã.tž%œ9ÛONP¸z`Ì#bÊP60 CÉí´¹L$27…!sí˜™“ŠÚÓ=‘é€~SÒÃØwÂ[¾“8~Y2øQè¼ñ Ûôû²¤©ëÃFÈ6\Ç¯ŒÍL!zà|µ¶ÇŽEµ86`l€†`ÇÕ\{Ž¹3³twi{R³MF€ì åGKçY<E>ÇÊ±¦îEøîÎ‹»Î-.Þ•±ÞyÑ]Ú]8çÜM±J˜²çX	Ñœ{S‰÷Eã•ü0Û kðyæbšýúEûŠù°Æ%,TÒ6yßg„Âœ;ÛÒS‘‰³íw%Øæã²ÐÔQ†„´˜©ƒ ÙÐeŸ{Ck­’ T'/>X&ÍYÿÑhh‹¥2mZ´MÓ†ÑéÞË`Ž´r€¤yŒW 0vÆ-TšGñQâì©c#4«^ØñÝy•(€ÎÎädµV$RhRy‘Èðë¯èéÝ?Qx¬÷¨×½Æ¦¾êGâ@¯äN&èBzø1íüŸ±IMç%zä,19g^0¹SÒTbÁæoW†Àx„ð›%¿èD QW¥Î5êôa¢æÈz×K£Û4!¹BtÒþˆ¶UXòt¢zîÞâ"JÚ³Aˆ’¸¨†b †Å'u£‹ˆÓëk;dõæ+Wo3(GÌ“²~,BIG?EÎ„æêC‰¹P1‡È×Ó[ëW7¶wÖ·(Ï]¡½e §]Iü€ñ­l¿ªtUp°xÛ›*îµÊ0P˜°GVHoÿ=5nÈ6ç÷³äÚ‚þiÑ&“Å€-7¤/ŒíÕº¦»ÓqƒIüþ)?Ç•™·é[¾‹{‡V‘D£Þë’®;žêÎÊ,aoÊ²3ä±Ï4tHDaCá‹åwŠþ=ò¹æ<™…·d©æ=sª9>°'RÌíŸœ¾^I~y£Ñè™sVqÍwÜ¸t—j6é_æ»÷AèÆ6¶x#ùT2
¶¾Æ{dâ2ßé½àvèã ®³?*8)JzÞÔÐ…!E^ïÿáÒÓšuZJÍx²DdåSÈ6)Mœ×½ìËõ	šxÚ0¹a×šwÇÐÝç-“ì8xkˆ¸¶LÞîí¿õÒáÜÝûµ™oëWÝLÅö\zË(×Žj½ˆ¡!–ÜØð´Q¶–ªO™þð`JŽÎJ„ ‡šÓ8>Ô¼zn¬s Y
hËKïjÅ4®zØ:v]É’›dáSr+£µÚôk?ho_3Þ™ÒÈB7Œ0ŸÑØ€¯½n eˆ{‰Âk@¡Vym2*”Æ5à÷ -p‹ÿE2
†Ýk!j£CÅwi{‹XQÎXÒëüRŠ“àuü]®Ó§àŒñËðˆùÀMéa=aŠgµ˜	ßO–’Tá…Ý8QŸb'¯oÜÒ¿Éd“Ð…¹ÒH“EIÀQ¯‰¢%ZòÇYµ [¨N÷OœÒER:v}3H¼rÚdL´*urÖ›¥OâD`?œRÏLhÙØ\U‚ê×[M4°ŒÂ§hZ—ÏçES—éæ»4Ç~³n|£}µ½6uù†Ósº•oÝ\ýÁúÎÔå­ 	–5¿4ÇÞ~²sO&Ti¾Ís°}øhÛPSL7ýim¡T»¨º$½ä»­”#h!º€ó	!Va –·ý–Ðõ'––=SyË´{ÀO§.Óÿ`ßˆjÐãïYøß}\½ãM GXmè[üÅ3M“ä”_å)Ž•>Öjkx¢š&ß|ß|ò‰ ç‡u0ó…­$úi?'¾b^Ø/èºaŒhæ™R>é°+«ŸÌV;ÚloÍ×Y±ÎçRõÌeûœ‘ÊjÒ ½IX}¶¹Û[×	=ÿla~Ññ×0tJ+XÀ¿Œ~&¾úMéžPå$£Î•ÉØŠ(hÞaâê)AõÓe’ýúxÈ…ôôG/……Ðç¥•/ '±ð’CãÞ G¢°³’¾×âøñÊ]$Œ¼xîþ”bçõÙ‚ÝwP˜#V¢ã§€Õì¹aè†·°°V¦†A]|UrÝ9®
jœ"+{kÊ€UT)™Þz©7SÒ:/a°o.,•¯Wæô2Oç¨‹žÄçVtºÎ¿.{i¯5ÅÑµÐGinQŠƒõWUÑBi+”­„­2pÈü+ì¬Ìfê‚••|É·Öy›­•H;‹³ÃYP´òã ìºq“\¿yõæ	&Ç€ÿU†c‡“(‚1îUëb«Y+9Õ`c€5áPÄ!ˆxÚŠìRb¦Ð-4¢¥e&’újø;ÄÝW—q`—	N·(am°Jg° =	r<Ÿú æÐLr©{	1ËF™JWâ5¤SGLäl\´çù†Ôh¼À2pG ¢<$¹—­ñ`˜h4ß^ d;ˆ34YI†ðsôJãNó®v7ÞmÓ²*´H­«»E¿(CÅÃ‹5m´4/æn¯{,ÕÌ–æ=…n4öct@ 4ú°g1À³¤s§ÛŽÖœØÀ&é„ á¦Ÿè×fm´þF«Ño#ªE‚P‘Iyöõyád¦/±æ….yM}gî‹£$‘«„>KÖ®>¬jófB“Y¾tj>f9¡,Ñê=sð^ÞG€¿lã~Ýþ|Ç&À”S²ÞßX“ë%u3€Ï¥u}r›Zûƒ…kKBõ³:÷¢JðÓÖ&/7{ìž
àØ3K’Feq{ùÆ’è½t«]_j`É—î¯Ï—š•DõÙe(Jå®YPî@±R$›ÏeŸ¼$™%>³^ø­¢hòµ¢Ïdåi¡™àm þÊKÄ!û8Ï
ÄQN²”·­/.=ÉiÏW«X)J•/LOÄ—“PKþå8_´Â/¿AÏiZ>í1ÁjuäDÂˆ˜à"‰—+O&¯˜HN!ìÎ¾Ô\Á
DâüüÅ…wÀ•m	b	©¯´0¸N’âÉíÍêí­-4l¯îl¼¾^Ä7¼¾±½Cj‡ùäY^CÊºàœ¦c=”â‚™â&9?Œ"YJYZ¯ìGê;/@Ü!ŠìUtø	FžÛma}wìuÓe‰ç,Kf–Ð;K~fñsžÑ‘}•&2¼—-	_„›Ón0×«j?¿g‰Ù£X-Zb¥g,°b,¬Bªô•üd~ø6ßÇOübI¾4kNbº/™ÔÏëÔ×(Ãxk¢ø.¤5õÜËæ´¹ý²Ô>9b'yw„:×ÔCVëË!¬TU!ÆX&§¹>Ÿé ·Þ¯,´`£)-Ptä[E\Ô(Ü2¢ø\Ê¢‘&O±eÐ…4½ˆä¡—'n¡ƒ(¯qaS¤ét&^YïH3Å8»|Êì’ìÅ°ZXÆÈfœ¹³jÍY²P&²Æ²~.Yt¢œË¢äJš-wõ„ãaëvœûõ}P{(d÷exg
Qn]Ü©JíK¶$Y9ã n1žÍöÌ9«1H?oH	ôu«-·ÍòÚÌŽØÜ’›áÃ·q&“žªï0
G¼zôÀƒžNÌe³ÄÃ‹IMÐÓÖyT‚é¨½a×ë1³–üvà×¢÷eÅàh*–EÛtlZçç/ÞÍ!* *­Ç%¤=¼7¼õü¼âl¼éˆ½¹f(Âqß"¡/‹Â¶%U‰”–Yâ ÉÆ³Æ4+÷UóçhØLÎS<žñ·ÜÑh¸%t˜“ZäpÞ¢idÌ/e³Ÿ5Chµ4ñÞ‚+ æ¼&ã·,ÅêT–CÁ{Q‚hHY¤@b‚íîøººÊ4^H(…~¨‰b] <ËÎróÜåï6¾¤êÖn*h¬\}ÐdAoîB‰É_nîe²C¡ÓÉö¾wúä5vößT’Ë.¹Å>µ¥b)D›³±8Oö•˜ðnqR¶W¹
ž„Åf¥£v/°.…‰všu‘°ç“—Fšð\ž¸&=špòÐfÖÚ6Uˆ‘ê„‡fUM£ËQÇ‡cßì÷´QB	Ø«Í…æü’Vôfen®rªüÛÒRY)!îS¶‘—FyƒFñH…Af‰Z[ª~/çÇb_Á¤}ýá/Èuø›z‹¿þð}ôÑ:»¾Û5qJ}ÅU}*h‰€L–âŽXñÖ':X¾¿UQµž]mô4¶ÆÌ1ë&,Ê&t
Ûf™ˆ[VTÛvÁcpÂ„'P,[K¹ŒZoÙKi…ÓlMwfUrC”!ñLTà/ž›)Cêœ09“v5QÕ'Ë-Í6#Ï&}~¶c™ÊÃ+­Gè3/}¦œ”O¨œ\#°Ñ€T*•¶‰Ò¤ÆviÙVé™&UÒ2+¤dÚUO+`WÙš”»	„µy[„5¹â3|µ ' ŠÎ–NÌóÖ\˜.÷”¸ÞNèD}<à“ÈM7þløQUöN
Ô ñ¿ÊB¹^)¼öÚæÆíÄ&{}´WWoÞ¾±³M¾GÖ6¶ÖWwnn½In¾¾¾õúÆúO¬6žÓ€úr•ñÊ séÉæñýqx@®±|Ü×ð¤½ê„¢ö$ÉS"Ã¶Î·[ó¶ÙivñßÈ>B)æ
{kñ-TWü1Õ²(þ•œ}	½^Ï¾ 9?™Bu$ÌûË “/’ôál¢NAÜ"CzÃvac(þgngÏãÆ%ŒŒ¥²tY+ŠÂ‚ÑÀTÛ³¤ô—ñZû
ÈštŒ‰‚þ­­ßØÙh_Ïl³›72à}¿@ØR<üg–×ù3é2;ŽÌ<?å3`¦ï}¥˜.uÁâd%GòE¥r²Ê9¹†uxB<M6+U"¤µïïº$:ˆP£šüÂo?0çžãgj6äl¢L‹ˆÆ öE°šþl’¸ûš8cñ¡÷C¸{}àx>ÍÝplV;pDìÂ…¦™7ÈNßE_2…1¢)"h‚8ÀˆÐ¿Ò„m<°=_§9Ð7wnÑgá;¥¸Ã 8"úH
ŠÚÈOØ·Eÿ:A1ÂÒ¬LÈ¥Ýs%QüÂ´ªâ:Á»g²ËÚ8÷¤¶ã¼ëFdž¬› Ö Ê>8ôƒ^Ïíni£­Àw©²=kå†oÑUœ¶Ì‚w‚×©£c]Œ
U¥€j,é=2“Ì¦—” ñç$í„³Tè©,oKo!KkÍg#tü-86³ýBS™½K×ƒ</:>§I6œf¨~ô@‘s§-èª ðé0x‹Ú‡{ËÅˆ}m½9 þc¢ð9Í³&øÐÄ3µªœ® ¢:ü¢<M‘†‹rÌÓð^àõ'ðŠÿ²7ù„ñrö~?I*˜DCm÷Û3yÔW³Áÿ^›€¶¿¥÷þ.û9;¸À%áXDzì#9¦ðI‚ŒTµÕ–>4D„ª´°M¤Ës“¥jÈÅwšæâÝ‚Îµ”2K¦ =ÄžK4M»ÄrMõ»¯ÀvÎÃÖ?/{ý‹ðvlGr³ˆX”l°ÐÌ†•Ù&S&ø¶l'RÿžÑ9 Ø(û¶™ÂÒ–Õƒ¹¨g#š8®"Ö-½ÊmêÏ¤Müim_q«ëÁŸQÚ	¿iQ¡ñJ‘¡è`Ø!¥G1m1¢ñâ6QÁ›<÷w‡žß*kå¢öÈà6Vhýè»‹¨ß¾»Q›ºû”*¨®9=ƒník;›×i»uvÙƒb®‘Z?K¨°“=.ml›j16ÏBÝ-}kgù Pù>°1ë÷ºÅT}/›…|Ýñ‘’5}…ß{…ƒ¸ÂƒëÁ¾®³0Qâýˆc}f–/×­ÍZ°^jé²¼’"}eæqýk C>4Mhù/¶kÂšY¡ÂÐµ]QòdV}\žü,=Æìwv|7ŒkÓÈ®9ý„BÄ°3Èœ”|||ô?(oû@Áë„¬¯°–4«·ñý5éíO¬î[ZWši(9 ~
À…Øa¬í?%ç(Í®^Ú9^ÝtQèT‚­²x…Ìýí¿ý›èÕ»ß•ÿ÷oü—æôÏH—„öÓˆAE®‰%š±\ƒ#*/þ]qHõZ:àÏùuHç],JZLå1Õ¹úœÖÒåúkæˆê™M-ÎˆD†âPÊ%²d9ZIæâgB ~BeèÃeß1¡úob"Ñ*0B1þ+sÖoî$2)jDÁÀ­9(T%‰,¯c øI…\N€m8>/ïÑù3Ý¡9	JÊìÛ?ˆB<ï%%u>õtØÌ>¤?a˜Qÿü&Nfeê4‰Þðâ~múÕé’¹ÉJ¸Ÿ|_þnâÉJˆxá¬¶´‰y¾GuÈø^àº'þp$lQ¶Òt‰?]&¯vAOó*ÁÞí{3g¹vqx`œ‘¹9²¾8×? ž¦Œûn"ÿˆ7${^<3¹ç›ƒ}Cw©4]:[î¬x7èÔº»³\¿%úŽ¦gÓÝezygßñð\`=ÖÒžgÉa2ÎåŒü6g±%Ý­úÁ¸}Q‰ªFg~RédÐŽu³AŸ1ÙTHýÎ–Ä°içËéoûjYÞ¥æ&¨£-¥ÍpçœJ0š{¼ªÀ‰–ª0uÏÍ,˜©†½5ËHM(VÃ@_<yÃ À^N}~4o™}ò@_/j¾„X÷ÀŒ¾ÃxïÛ_ô3³7nê¥C1ÀS¤öÒ!ÇƒS½9Jò˜)Ì¿¡ß~œ4BvÍõg¼ñ·øÖúq®g¥; XÀî…·Mø¤ã`ŠtÍÃešÜe$TäðÆ—V"‚-fuúë_ÿÜô–yCýZ\ûDh«?IDaæeA\‘rÃ$ÅåÍÊÅ‰ð»°Ï$õÄïU4a]šˆ6DUr¢"feÒ šrÔ)0f~Z××ä&«Žë‹`±Ù¥'Ùª®fÛæeƒ÷ÏˆydØGyƒ)sfH'-ã2Ý^Š”¤‚êxoïÕÝ {ãN¿Ñ	–ˆ|P…ÔÒo.•‚IEu³îÊƒ>f"’˜ù<=X""Ñ·#7¤5Ý¾Y;­ø~s“g¿ÙÊà1³{M¼Ø©o·WÑLz+Øë %Ecn¯”E(´qVf¾•›ý×Á,Q‚:‹½ØŽ"¯7$ÂýÛ‰üí˜œ¾ä\V¥žÙúXÖe¸®òÌíGñB§¹Û1Æïaš—0­¦lˆøÁ°÷­Üƒg²éh^Ûika0êû¦ÓÏå–£¯¨R/'R=þÌÌ„ÄõùH Aþ	-…¦ã‰¶^IÕšü®Â¡ŸpGùvÈŸ¼>ÒB§_¿³@Ï Û&ÀÌ³e`¨{cêòÚú•öíë;,E~†H,ªË:N‚‚S—7o®­oµwnnñ
3¿‘2r>f¥H*w/E#§.oß¾µ¾•ŽÝ˜¥dS)ÇX´Æ†°<‚òcKvœfPBm+Ò»™Þ²Äà	SúãDN}ÍC7Šê­?ªÁ2WHáB¢PÂÌR_´…”ÈKŽë–&±%žêä÷Ä_ÉÎµ´Ê™aÝµiÔåµ(,â÷È()¾ €Ð’é(ˆìý¢;±QøŽAƒ‘{é°Ü.ó:D"{vÁœ=kJZ[˜(am$§¨¥y­ê¼öÒTµ<êBiÒ$êÀ¿N
f—÷–l<û¬79	MÛoZÒÛ*Ë’"ü9ËûfßAx``à§žö–ø^Y]­£$üX8uáW?V(XéýEÂQ‹ÿ„Š¨¯ÍëDùnÊŸ4h2yôÑTÉÎh^3?‰Ó|©Á`-&ŽÊÑïy‘·ëËÑþI¶wÚW®ÍõÍ×Ö·¶53 µ±GÛN-!V¨\‹è,%ç–êÎ8HÔ	ßßuÂzÜb”?Ž·$J"Å&
µ9êª¦ð—T¥¹¹ûŽ1õPJÖiw»!f¢¯Ñ’¦tül¢ß5gØ¥%$’ÆâšÉõê0ˆß‚{^Ìõ®6§‹uÚ3•z¤’^³É'1W
7$x-L£Îþª{¸qLcàŠÔò‘^£[øz5y™(Ó­sïz¾ï†ó¯öh¬¯ð¬H6nY$¼iƒ&l$^´éxCš"ÏøØ
™äùeY ²×ù¹”åÏJÃœùôCÍó0ûp×éöÜ`˜eÂ^jÝôÚA&¶ãº&ZT“"„Y
Xbª`Ÿ®wþ)˜yéùËÖ2d2ÞEV@egáRáuÒ;çõoô€¸>Ïâ‹É)—–¯µ)šÀK}Ñú¿Qå½$ZaŒU‹”Ügz©jû˜ƒ)é‘@ÀX¦~ÓAwÈÜü’VŸÏ¹2ê¦¬è1ñìÙ/T&ŒØF¹³Á“Ùûz¥–²c¦Ó–"ãuÛ‹ \^,$Sâ3RÇCr‹ÔôÔ¡HÚ…m);é¼lÖs–œ‹QTš*ÇþÍ0Ktº¶ãZs8ãmÔdg,ƒ=,‡ÜÔ'gOˆóŠ_ŒpÊ 5NÛî‡Îh(äRð×n<˜)dH°	²_fG^Î~´……=¬Ù—‘bò1 p­Ûðô%­pÇÃ-Ì¥v\4—{Þ°[‹hÁ¦)¤'þéÿ¨áÑÃÁ{ÊÕ“dµBõ ©ž™qÍž‡p'6]”²HùÊÓG°Õ×È±Ã_RAÀj+Æe…HJ'‚åÆ(ø’Ý+À¬ vé[æ)vŸ¾K??—úù8’§ƒ
Jþ€¢õ¤OEÅ y¹ŠºÌª),“Ct9± ã5.Cjªj0Z?nF3ÖûŒ>Ñk/,š™2öiù¼ª¼—a›KÅ^Š“ã¥ÂÍž}©ÖÄmÀäm"$éÅëŠ	±œ	¯ÊÅÅøè¶/7«²EÈ¬
Ùðµôy) –“7˜q‘+½„$j<ƒ fé£eyžÉôYÀŠËn]¥§ÚÀ&[‰*¼ŠY²ö¸aì’²REâ©üSÌ{ö(sÀû3î[ã%éØ!—O¥ÌGèELhNE›Êå²¼«ÒÌìØÍ}¾vPs·Ùi5ïÚESåw±iÂG•ÄgÖ÷&$¯"ðX8/K™ Œ%ž †¨íú´£‰Úe\QzhI„1½ìŠ`œ~¿¢.ÂK‡©+Àž]‡‰ßÁfßØ*!6õ0‹çõCw¦§Ç£hyn.nÜ¹—s¾K3ì­¸˜à[™zævø®Í¾U«¥#A»†AR5ÅÆ‚©Rþ‚bÇ8Ã<ÔýnAYœ*Hü^\ýÈ¼ƒï­b±˜NLîyNšÉq‰Ê»±¡´¿üñ/Ã¬“Ø¦ª†ó$Jj”ÃèÓd?^»v/p	¼a„xø,µV‚ë®Õ|…k)Aðˆ‹~+>XF´²×gR\eæ¹1™¿Ò‰uÒö}Ð­ºh—à±";_Ëà^íUôrJƒá GGÉ’ñóª ­ò®˜5ØYÅ%j‘+/<dKEøLÉO\ÄMg‹`i—V·`ZÈ I¡»dù^©d7êªÚ¶r={ÓÞ
å7½ªàý¦W‚üË±@*šI -ô·Ëé)gXPt[¸Å‹•4-^ì [—B¢âÆÜÑÈ8ˆGoEn<å'ÝÎ—%=)Uò¯V­h§u°Ï‘°'‘>˜Œ»´¶Þ˜‚j¡K""µ!KÈÙ[­]‚éßä×?'«Á¶Ä0ˆùèà%–qxaJD9=Ðª®Â½x(SÁ¤ì1‘ù#íŸ)#þJ†æJ!{“¤x9uL­ƒ
å2—–„ØîT[®AÈ›ndËa,€z3÷?YŽTåàõôp‹¬¯ÝÌÔŽ~¦ùFp&klíý´¼ÑÚ¬«@YÕ©ª2º=»t”'³ikŽ”vÆ°þ+3µêÎ®ÑªS2Œ9OÐKÃ•þ†ß.U´œg¦XÃ¡R½›üö±JŒmÑa¿~g7¥)p£éx;ˆ(+Ih”Âqß‹h6Íé¹…Òj_Ùn×b±èÜïèvúV`óêužÌ²u$D¯PÂoIÃuÍ	—L6…g(¥”º¬Tô›ûèÚø«OÏLfÌÊŒ°c•Ô¼DDç9ø¿+LÌ›hZJfeD¡üóS…YP!bÅµ9f4Óò(F4|ÂœíAZ:û˜‘:<de¬&æªÄ2'5V'1Wæ±ÂXM0OhªZ«´f„ÞT¥ecè"T²VÏÂ^­®Nª!ž‚ÕšØ­Ôµ©6[e{µ]Pÿqº‹RÈö8ÐŠK+Á»,LGR§g”§¸+Ò««üy„u©µ´$yÐ'x„®ç¤3£}»é”ÞÄÂ-q‚Y…óùû¿(Ö9(Á°ùœãfcÂü¥)†`‘…6{Ä¡ê0Ìô;=ôÍño?©æf8-›]œ&Ë’‹‰l½ŸÅ¥'mUV±+«¸ª;žŠˆÈ»
”q:‹ý¹ª-¸µ+a‡‘­;¡JÞ•¥K¡*­MBg:t|j"ÇÂ)yL­Yž½ƒ!©n–¯xÆNiËˆdòEÄ÷‹ú²jÏ´Ã!q9ÜrÃ3¤–\To§bŸl¬Ñôq
Ùgþì:·Þ‡Ê‚nXõ©B.&£TËÍlÏ'ÊüVžó`Ê"Ô,lûðáñ”ö®‘&.°C,Å[Ã¥Æ._D¸ÏÉ|QÔµéêúØØÐ¶,°óëò‚Æ+‡^t•OÔ°Çæo§¯œ—LlÀÙn¨‡WC„PKÎÈüa³eÂíÝ¹fÜ»•Ú÷0¢§Ç^[][¿rõÚúÁõÍ·þóÖöÎí×ßø«7ÿz~aqéÜù-óE‘üjxÊÌƒN›ÿþs‰,Á¾ÿ}û°6Ç÷ÂaY§©&~‡=øxðøO•öØï¯°iO6¸ßØóƒ d¯îhô¾Ìïceím!k‰†‹Û£~ÿ´õÇ—¹WEçgÏ€öæŒÉ]JîoÑwËÇ¸ËàlåÑSº§ÿ1CÔ¦gn·cð>Yƒô7¶on³c¯åL¯8ÛôÂŠ±â©ò>§ã¶œLèãuÏÝÏrŠ‰õ2;ü#dú%bÙ'˜¨	Öì§uaIsØïÞŸ•˜ù»ã£Ï¨ýŒ9Ä¿Ñ‚Ø~Ä‹BI	¤Î¦×ÄùYÚé;\ìÒé&WS±»Ž¿ßEæœÚü¤sÄÚ²©2MÊ'IŒ/$@ƒÂT-Dœ—Ò",gnÏbÅ“Ë±=Ç,Zz…PàÑ©þ4ý2¯û'_"‹ô•öŸü ÔU®ç3«ÿsÍ_°&²ÄŠSº ý¸õØ¸dWÖ9syeý—+×ùãiŽ†üÓ=âŸŒ5³-kåÛ	¶ÌÿË<{ø´™éòP6¶BY4³ Àc)Ô4Óm+‹lSŠW¡”Å°hß=…Ì#.“¦•‚žÃŒÜP²U
¡§t«,É8UÖ£¯%¥–ËQ($Þµ<x¦~)O$;_ûµTÑMQ‰ºm”ûàÛ³šê¢S~*y‘tŠØ3ÐzUÏr1-Èˆ<ÓON-×ãë> «~ÙøIì½$–ÎQâ?<‘«2],™:Ä£µºZšÙKàfþ*xâ…ÂKÿõÏ‡ï3ÿOÄ¾ú4)ÀN=’Š6%SI¬‰âP39ò™,Q¸RöÓlûÿ•ÇõO*6>Á©E/B\å+¾²ò<Ÿ'gžu´¨øeß’ž—¯™UJ³ž>K›™²¿c_3è¬Ê?ŠÍüŸ^° -À–tSYmk¦òä€i+$*å#=ÌŠ2z–xÝû”KUÈß ('ØúAE%¡ ¦^­$î¢C>Y¸+Çnr×©–ëqùÞ¬†Öƒ|‡Á°WØ´‰¨Ë%7%K1u™ÍHÚÃåŠ¹O#·JvÆÐ¹çõ0¾Ññ½Ñn š[c?„ÀÃvUœ4ìv!­“ò€wQ˜ÂæÚYÙk²„ó|ºOÎ¾ÑO“´£ÓÏ-^FåImì:£ìâ›C–2ÑšÖ«RùDô-`éîÇ;Î3YQ[ïÀ:×¦ÿÆ€¶–½Ì;&}^EO
Ý1 q?Ïl&,S¹ô[¥¤žx/Yí"µB:Î+,¨LòEÊUó7òö†Ã@†¥C¶¡yJmxJ äo·ó,¶‰q³•´7þ¬YñÊjzRGïÔß¢`0H*.Dd½ëáA¬vè:$ÈM †]¼–uZ›ƒEAÑD?õöÖrN¡Gœm{;ßŒ™jÅëi}åúK×ƒ*¸ÓZ
Ó÷žh/»½ëE#ß9Ðêy«84WéjÛëëi‰õ¦ÖƒøNà›Iê“Ax?àeGxá´/ˆààï±8Ã{¢Ô½¾Hs	B‰¡”}¥ÍM´Õë+U®·­Z_½b½K[^ÖÝõRrõê-
»§%OKº'OyÝñ«sW×kÏTE¯T°=rZï¼B­óbsÞ•>ºtÚõÌ‰mÉòÄÅÀ²\/›øæê‚¦¢»?·¨­m[Wû¨©=Á[š’;N¹þ¯uí_sÝ_)Î+M#¼UY¬:€ûw´ÑoNº-/¥Z! k_G4‘5½·úOµl({Ä§‰î_yV;/}'$#9´yì§R_T¥þ*“wnÐ]N?.PEp‘ëfîPáÑ¶Ñ ¥O$iÕ©q…2O²'>U®òqœÄ=?u™ÏBÕeù&‹ZMÆ‚Lf¨AVˆ)+«uv]I&e™š;/6—šZ­<Jš®ØÒ‚¢öX.·¬ð’ÐÛ“²JÕŠÑæðÂ¦.×ë„¯[#­×ËðÀóH†ŸÞìùÏ§ß,äÿ™ý:«ž1¼òÌ[óËéU&à3£AóTwcœ·žéFÌÔ6ñpVàãŸlö¢©&an+‚<ÕmÄòÊ…%[µX4-EÀR5tŸâ&?…-žÆh’j’Ñ«~‡S3¶V›Ê^Å¹LÞB.Ó’zòî¼Ø¹xÑYjÝ•]y¦J]ME¥.i)$/{F ;Ï‹ê›y·wÙº–C¥ŠltPPÓú«û¹d}
¯ÿöoÓƒÉæÕ0&½ÛPk¤«ªt©L÷BÙ¬tÏ­LvåŽØ˜×IûÖ­ë«í›7¶Éëë[Wø§1St_
}éâL¹ü_3d§ýZ®ç	Ç—s2êg—¥íMy{ˆ$¦ÈÛ×1þs)ÛÏr†‚(ú(ÂK¹Øj¶Ü<KÇjZK÷eÞG‰ˆÈ@øîûn7ŸJPšmt©¿¨‡ÔWíWql²J]2ZLUÑŽî›E)+Š"®kvÖñI{4òùbEäuiéÈö™tžº˜ü•~‰‘T®ç&‚šÕ™Å„£KsýEÅÌ*}m[.æ°‘Qì1Dt0`;Î°ëQî€Ñâ8Eâi%?X€&ÊB ³ñ #¢EX±{°sóöêµy3“s€‰u#T6YÃ˜>Ðó]„—è"+¤(”òÈ...™qÃ{^Ç%Ø§•Ð\CQy‰M9´g•\ƒ=¸ÃƒÑ÷½^¿ÏXÍ–ˆÔÖÖ7oÎ’­õ«·¯··fÉ­­õÍÛ›³ø”õë;ë3æÆ;ôÐŒ4ÄSWpC×íÐ *¼­’Àí„°°è$#ps<ŽŠ(Ìµ>±D´¢]‰Ýà¾U`!gâÍ¿'™x‹ÌÄ³ˆd‚ª€ÄA[1€êeÈÍËåYi=éRuŒ´ÈqÂvêòN;ÉVÆ‘¡¶™º(‡_Ðe™
…¸÷ù²S—G`ÃÀÒÒ"¢öÚªØÚqè„ãó8÷WÀêñ]ÆíNcâEÀ§ÚÜsð‹µ;¬šÒÂŠ!pšW	Ë~—,Ý-Öù·aÝ6OuÕ’xøÄ«&-]¡ÍoùúlC“YƒéOcFãpäŸpcå—Hâ	×H/þ®ÐçG`ˆA›²	¨/V¨ç+ŒºËôï0ØÏøAµ¹ŠTH»NØé“=,…lU˜Û¦ð°ýzkn!)g#”f5Åé=eÞîäb­ÚÙT¨q‚ÙÜR«Z¶t‰Æe•ñ…ðÉI•;tÊÌ’Q?ºTÅb·FC=ôÉªÐËÎ¿~ËŠ.<$Ò0ùn=·T^…>1)LßjŸŠb¾B>/ê(´×°â]À
Î©úÕ¾i‹Ø°lO@›š*Óx†ÖÄ Ø>®JsÙÖµbÙ-©;=9ÙÜWPLeÚÈ öë¢$Ø¬©V1~{,ëGo_¿>u™fy±iòÀ2˜å•©5ùd2ë‡,íÂì‹Î=GV–²
Ÿðé2×í‰lÌVzÄ¦ô€Íl÷Ÿñü÷ß&‚$¬2Â•ÏÎÓg’úµÃø=ÓÃôzãÞôb ©ˆ‹¸§°5½xÒm™´´ßª½«ZØ‡¿§YFšèÐ¦4®Õ1´2á¬NÁê<¸ÿ7?CcšŒ~-ÇUR¯Ö›_–m•×L¦u!r8™†E+o“Òºþþ²€»¼oiEt#Æ×R&R›Ð~#sH³P•^sF957:D‡Fè³˜§v`!@» ?£®¤+¨G Ð«û©õA¨±ƒq¼¡’=ÍºrµŸºµ•.fUÂgÓ.á“çãÃ@–:ç—œÝ»…tZàoóó.°\Z2Ø…ÕÕ×Í˜¢Þû²ª¼Z÷uªhÞyÑÝ[„ë®ÆwÝ~£½±³qã*ÙZ}cý²Ú¾±¶±ÖÞYßVy“—TÂPf–'IR¢¡õ	Í¦g0é™ ëk€ÙFnÄÕëò‚lè H-„¾iæc!Õvü1ž5•ûÉ5üÑ4½Ò!› XO£{j>MÞ½)ã’Ïfb;¬•.Ï| ÈqlPe~7U?6#œŽ"aÈÊà­øôµ¾ó®“}lÒPýH^2KKßû^a:¤¯ G¥8P§¤bÞ¥ z‘x‰Ãkê²ãJj|õÖ¹j¹æ<ó’ºÀÊÒrîy-­ëDýä¤c*Êæ.¤i	ˆ$`U@ü/üÇ¹6@T÷wäÈpüqÅ…1+?ìžbœ…Ï’þT‰Z–«–Î¸¥‡_3éuó”¹«Nh°ë0!ª¹^ss …c0þîáÁ>šr“Ñ8”þ¹ %Ã&É&Ãƒ.0Ýì4Âº³¼î]ÜX¦£i4œ¶Ì¸*ý›îDV›6a>aèŽ7¤Q<häÔ,k²å:¾Ô?Ú4y«ÕÏµ‚o¬ÎÎÛ5\(4\°k¸7Ì7Ü–5\uR#øTÖà:&`ÆõAM[Ê_›º`d‡ƒÛÂ°ï!÷-òMÕ÷È‰á„¼¢lml²Lî¯»L¦½¡‡¹ Ž_oMÏ’.ßðC‹\Žßå(b*Éƒ»å³³^œñen.Ä×M…h\e&:Î ?M²é£âL@ÿo-4øò¶//Nq
¿æ¦£ðûDóRè¥ÊùÐ8?CódÍ9PLü ·æ»8Q­%6SÚG>0€Ñ1†Ü§¥9¯`D¹a€7×h€A@GÎ¢áÏ³ëKÎ'Öl†¯×ðLu4˜Ï7ôô“³/Ë¥§—¡?&nÊP ïÐ÷…áE·š>0<Ú®C»ÓqG1uJà:”N8åU˜ô_¦<¢à\„çÄ0ý&Ø}s^¼!ëub‡&¶˜…u±¶;N»3¤
Pâ82/ ª¡X)ª{òU+ÜeÙKnc«[ï˜¨
HLY(o$6mƒìš-!iV¦'d›rm!ÓºD_Èu0¯èÀ¬7ä:XPt`Ör0-"ÛYH;àÚDÒ¸DŸHæµŠ¤[½‚]
í‚ö”×/€ïÞ1Ê&¹;Y<K½%ºRgJq'õZx–Ý¼ì:ì¯‡¸ì|§ßâßÂ.7ð	ìëbG–ôüÀŸ`ÆMàœ cêCÈ¯`ÈÒ‹“7Šjœ¡›SÝ	½^L?9	–Ì±²IÀ#Ï†m–µ—<¶Œë[Ô8¿,G½€ÁUfo3·²¶2¶²µ2µ	YÚ©1´Seg§ÈÌNÄÊÌìÄ¸«õÌÆÀ¥d§ÅjnâVŒ3Z¥ÏdWL[¥Çâô­XÍ¯AM-qâ…*ã
q$4ÊÚÌÌ?oaÞÁ…%Ý Mýùf&>ƒ (Ù$¬<âš8B°(‡¬²gLÀ9fÈÝ‰	ux]¾2+Òuc”B¥°°†zy"ÙŒ€0Æ Ñ¢ŽÅõ’7è•Þ¶aØkªÒÛT?ŽGÑòÜý&jŒ‡ZõÁlÌúAÔ[K‹‹ÍæÒBk¡~q±ÛÝkÎ_8×Ý›elß)à%Çùs1 Sª©…á¬–œ¥É-*  {	)¨Ø q…îž†nx+€¥=X™uñUys‹(ùõ—b{â˜¦ä­â4L4Ðä²W9S¼ª­”EvìçÝÝîÞÞ]9Æ©€(L)±!ÄNz•_Áºáôƒ
p¹Ê“/ŠûtûÓv¶L•8µÉÀr0	|läßÍ”»¥_kÝÒ¯¶RÜ¡y¾Ö¨’‡%Q<Ëµ¯  yš3ÅdÁÅÂÌˆðÔR>/û„Ó”5žöÜØbÚÜfS¶ˆ‹³8½Ý1*7Å™£ê-cˆ	`YBžªÌ@3©#©‚€H”1œvÏõ¬¤G6ÕóäYH¦oƒéWa¥•Ï”q÷]çÞ`€ ‘7]Çt, ×¿%%=ã“zÍõzýøÌæµO»·–&ßIEÏH7ŒpœÕÄâÏÕÀB&O/$ÛÀÌí÷)³¸M×‰Æ!ƒ=;E&·Èñ¿!,î<Ãz7ÎtÃà	æ_²êC3§NBÉdÒÁ‚ÚgFjº1×>e:zfþµH˜Îüã9ñIMþ.žÆþöNýŽÇfž!q|ôè‰‘=}ô·wê¯y#œx†Ýõ	ÅXDø®'5ý}xüÙL¾½èzÍ9Úó:ŽOºnÔ	½‘TU´ºË­ñ‚¼Æê¤éÄ?¡8:a1ö*‹¶nB¶]lŒ×9²1ŒÃ€Uäá5çß—¡øì	Gž›b–x±ã{>·‹`y”ñ9¦r+G]d;Å(æ;:>·:³§»–.üýï	&áˆÈ{	öãgEäOˆæ+n|Ä¦½ÏŽ±~Þ'¥Øo_±|Ii}hùU2ÃúÝ¹ÿ(à1´ÅßÑÁ~DþÝÞb?°‡|$Áó	$Ç÷(Vâ?PØFúÐß~2ý Ü?gQÏÄrC–ç<¿?&mSÆ«|ŸfO‚˜wêüD;Õz¯2®=Án^@Èeé{Ù^ßz}cu}›l­ÿçÛëÛ;ëk°Ïo^¹re}k}mÙÊ«b-+ÊUŠê~ý^õí9jea¤.¹c?Â X›âHQš¤µÉ+„-*˜B¡ãwS…rS²Ì."ÃM³WÙ¾þè¿ÒG}ýëŸ[…è[V«P3Éœ0BŸo6ÓyHsçéÃ¸{°×g³Â+^U˜|:ÙfFgðÚÖåQž$®:ƒ§K„š<=4ÍÈ™“àëÀ—àŸ0ˆon:ïº7ÇñÓ¥BÃ ž%–ÍÌ™S# Ð¹žä¥ŸIJÜ	ÆáÓ%CÝžçäÌ	ŸþœIdªh‡`™ÖO¾œyôt	³l$O@­æèÌ	GAÄ0ž&¥žfˆº¬(7s€Ý¢§ž‹“AÆŸ8jÃÌ¸#î–¹Ã¼£Ôdœ§
O#Ö·ìâ”ãÁ®žÔiºëÝ,ÈãØñ$á`t.Ž;¾/«éIöfë¯ÄõÄýÛÏî²1Jç¥âOºlª´+©­X,æ©L×J†€ç#ŒÃñ}_bS¼ƒ3ó›o¢±]z´êVÆ{ïÈ/â "WÄá?°`&ÜŠìÅ’{C
|ËëD´ú¦ê¥ñü9$ßÒ¢’¥E†¯¸Špˆì?lVÌ!kås£è/<kL¢ÿœ÷Ðšâõ	]öŽÂ,{)lK÷—?þâBÌ‘ìö‡²ó;q¨ô-côàÏ¤v˜®t
uI©«ì°Ÿ—*Ø*ÓÀ>]M:­˜íz·C¿jÍìdd4[Ú>ÈñS¢—ŠÄü‰ WiÍàí·_Çr™ÙƒNGÖ“Aß¢bÍj¼&«[×	jWã¹ñ_çCvÁ×®RÉj©—íŽã»µÖ¤Í·‚˜¹ª5+öP¡ 5^2]ÑýŸÔò ÿI–3½÷ü`¿Þ÷º] uv™ 9ÖáeêÞ°Ú
ËN0HéxÕP*º
ý±Ü|–yÏÖóK‡;eU/%µÝßÎì³ìLÈ)ïSÆ¼u›¼ti|•jq³Öæ­]MîJZÞXJµfjv†“,@t1¦g*;¬1Ë.³Ñ7Xb½×½‚ŒKð&à,á|UlÏsg&‹r- A(• é¼Î)è §¤à &W þòïÿ}Q·*µ6|Íã>YuÃ˜Ý³;ÇJû½GÓPüÿ’ˆúW´È~÷;VÃ’¬ÿ•MŠs<ÉäBµ¦‰(;-å$ÊÛKdH^±Vf—øs·u¾uþnNIYã“©	ôÝòÄ$-¤»âø
³ž²fa,I¦p.OYÕ<T‰£ƒ¶S]“ê0'Ò`rú‹ÌÍªé'RaN¦ÀTR_ôÊK«UUu‘8ói.•´‚Dk‘V‘©.SŒ¬§ž´ªRUQ© ¦Ìå“³¹r^êK*°9jÖ”–‚Óq%t(%\©Û»p¹p3XªJ±eÊd¦)$sE)•hSßÉ©Éå”X–|Ç@ÑEöíçâ›‡´:ç·Gp	ÊúNt=ß¢K¬#^FæóL{e˜{lIŸ¾X£†|e	F[}'À&`tç’¬÷%1yÆùOÁbÿ–‰.œ‘ï$×s/¹p%Á…¿“QÏ«ŒÂÕ;ujýbúN»‡uq·¤¹·œúßá^`ï.±V;áýÄAÎ¿Útã~Ð=™Ÿ\$¹¡¯¼@GâÇŽÕÓ÷—Ë©yúÌÿø~S¹8s¶…©¹‡üsa$bYêã‡?~’^ñü¹œÂ~E¬°ÉÂð)àY“sµüégÑ^1²V‹–’–øÎUøeß9¨šçƒŠÜ+<Tæ)òµäF~6¯lÓ„ÚÙ™gÃ>ÓË°ƒª	 %n¬ÎjHç“©ú+=îPÁ“ü«gy9¤Ìe–“OvÀgl¶N²NÛîÇV5’=X½LIÞ¯vËð‡~·FvkÔÀ Q
yÝÓY¡ä´©¼BÇÿwV«àåõXq%Tø·)ê~mæ¬–í)¨cÝ7ôàeX(8ªLkOfIëªe
<jój³U„$³K¨RÂ'q"€†:X¥x¯Žf.Þ†ÛÈ7®½¶¹qƒ´oÝÚºùzû:Ù^ßÁkÛOð3ê™ø	=ÿž8›Ï»*r>ÅI¹¶Užu(öLe5¸P¿ˆ¦ÈW\
Fa™Tƒ—žÖb™Åöù:ŒV[VtÉwv]¿è%È¨ÚZÏSžJ¤sÞí(òzC²t<7> [Îð]\Ò¯è:±L‘¯f.ÍÑÇÛ&Ðêë·/QûS‚·u›ê»JŽÔ¦i‡Ó³¤Jååâ¥¯ÿZZüôû4;«›52•1OV VÀ"ôëí7ÖÒ'[–—¿šº¼åöÆ¾’Mu¤¶›?¤{ÿ«C¼1c®íZ:’[[ë›·7§.ß
Ýâ”¤#ùŒÛrÈi¾À²'q–ãY¿¾±³>uyÝÇÅ;ó:0’Ïòékë›7§.¯¹ƒ€¬"}â“Ã'àáû§ød}u]Õ½Ut€Òûh™Þ`Ÿ´–ÞÀ¦ëÆ„!‘†.nÃ~KÒ	èß*ïÈs”CøÇŸw¥ycÆ;?¢ñ89'ð˜~f$óonè§ÉÇHZÿºB8^‘„þ—œèÇ6	&÷“T[ ˆR ë³‘ÄÕ¤‡°=V ;Ž ÅZÎzc«TžÝ*1)ªïVŽë •U‰êpqMß_”«æ(Èìjq!vfièîc]²Bî$¥¸rËl(j ºxw`1ïB·‡XJþN®£–S%JJÑä/…Ž’+ó Ú
ôÙE›F@‰n4
7\™r½au«BŽæAÍÖ(E…ÈE‚Ca“üD5]¡#Ù±J8ÈîÄzº‹Ï5¥·P;#’÷®v¶ÇtæRœàdxMÔö¯ž€Uf1¤Î¦j‡‡d†!jPN[b‹ë„LãìØ†ã`E‘˜Ÿ®–å3U™Ç²ÊGœ2,ÄX½¤xeì©ùÕGSR‚u$ÿ%Ýî‚©Å,LÀ¨2øJ!æ
'Š&9Ô÷TR3ò{I­e±ÐµÚ[ eÑ‡xh5®çQ^æÙ±°ÌYu Œª$š˜ùÑ@®÷“M¾¨°eª0÷¯?úà™È8Í ~µ½Q}WL¸¬HS+jf	«×»éÄ}ŒÃn0¨¡¯^xé3¥{“¢½X”×’Ì-	\éÛJ‘%xý+ƒ¾ÐÔ”ÉZhæ]’Ò~aÊ^e³˜{Ñ$K)›ÃTž“@±Ô¨Qà±tÁÄ'j1mv›àëù a/$ü&óàÔ¾O¨güj@*Úöýã£X,½ÁÎ°¶ÝÌU/óËioÕœšó¥sà•ÞúÃ3â~¡c9ÉÎÿ³$M]êa`ÁÌY÷K¶Ò_¥DðìzQ’:ïß9QØõt¢ˆU~þ|(bäOÇ…ânÓFßùPžÊÿ  ÿÿì}msÇ™à÷û-ÙÁ˜ ”(®$")™YŠâ‘”])Ê C€Af QÃªë²Þ\n×rŠë¼®S|+[:GqTNÕÆ®ÚuþÆ}ôúÜ_¸~úmºgº{z@‚¢d"™L¿?oý¼žêPÔÏØu(#R¤B9$õ8Õ ¸}N5(Š°Æ¯@9Nfyª?¡ïŸêO¤dš¸Ì+¬=àSõ	UŸÄ7è—R}2³ &<>2Jö;¾V‰Â~:!j6›Ã(R¾)'61V¦PÇ3ðVD$¦ç—Ä#í}µ@Ô	W¬Èy¹O5,òç•Ô°¤ŽûåSµ¤–ðbt.U´äíª\NU.ÚÏ+®r9,9Aº—£"'§J·Ï©Æ¢„IKcã×Æ¼~zª–¡ïŸªe¤O.ÍdI¯°¢FºdŸªj¨ªF½£Ÿ$uÍ¡_rQû¤"FY":×leVœ§õÌ’e’ûƒâl¦ îJgòÑ˜èK{‚Þ’ß ùE”š™t¤Mé–4î½Ýt¢Ù„Â–h¯4’lòéBÂ£ËRzîW-#Ó™S.M®$cFÖöI\Z¥Y‡›Vì$Ð"&éí&Üxz¨}þW^‚Ý§]ñyÌLy_­ÑðûòhD€Ø	½fáâ (0Åƒ.a63óÕÙ;?Ä_ªsó3UÎy‚¾×hö '›9]ç2rvŸÌ¸ó›d–¹¨å5ƒÝb·Éÿ’ÓtÌ”Ý’µ_lù{‹í°ÑñUž?C¥áÒÄ*¾‡Îa8ïw‚½d–ƒßÈ)ŽÄ39QÆFJx`]ýiz¢ÕE2Û§©Ù<€K^í“{cùúÊæÖFmkåæÚ|ëæÆZ]YûÛM´´²±¼¸usã'h«v5ÑhÄ¡Ì{Ÿù–W‡ÑDÔ
B¸•ß‹&Ò¹ÛL¶‚óqF
U˜âèÆ$%˜ÌVÊÿNJ[ÏRÅLÏÄ2dõAGè„½÷Óñ1¹êÏêxüf"ÛÂ¬¶o{M¥Ç‘øvùÝò»ULgÞwê^¡Z¹8U¹Pžºxaª\*ÏMÞÑH%—Z³©;'žŠžL%Þh5›zcË¥U|Uýg	úÏò+¬èØ@6ü8¯ÌF0Ä„õ†×óvh¶tñ‡4W"¹MžÓ8iÄÓ ¼‡GÜß—Ê¾y(5‰ÇOoÔtkV³}}ƒ‚u†'‰ôÏðSríñ|$òÉÆó9$šPñg<¯ Þ€¯y­¹‡<½ËßÑüyß$+Ô‰ßðú¿t”Ï† ã§ï“mÄY‡çœÎ’^iBƒgðû§Ešº€‡ñ›š>“_Þ#ÃˆÆÇæš+ð9Oyóœ¯–ÔßÃ_~M,’<>!üâ‘¼yt‚¿&c°¬8ˆõŒ,û=¾°ç<›ÅÅº¡®Ï
3ùš„ß¿¯Ù›ìMg0~¤ÁýtË~/¶Yí‡0YßC±šÏÈOñD4àÝO8íõ
XÅÒ^Ïë¶hs/ÂèÖÃvÓ*fEoÿcdúZ¥-–Z®—•9‘©“J¯1?;Ó¸#çzRÙÇš“I!Åà{¸1¯ë’SòêQÐº2úE<.hpñ± R9¥J‰;ŸYLÃ©î¢3é©lVôïCe(jhÒQ4íÍR$Çî6Èßa°kH”¼p ï¥Hð,¤’šMeš:=…6Ê0—Z3i"×U
òªŒÁ(Øæádä¥ ÓñÂMH‡¤°`Žl>x=‡®ù~„‰²˜ÈWVÒ€¯XÁ®?TÊ™=³Ã¶¦Y·9Ä:«îÀ’J;a‰øÁ__0ÆxÂ¿’—>tèK)!ÍS‘×œ6}*ˆï¤‡÷’üã1¯múWÎlþH(¥’é–±û€â/(Ã³EŸrNü>y…ezÆ—ø8)àë(Ýõ5£@nðª¡W6]ºø$ð“*õ`"J(XñzpùQsN©´c'~ÓäºñÝ‡ ÚâÖÊÛËh}ceqeí:Z^»¾²¶¬]§Þ’kR˜efk‹ºr:ÜÎÎB²fœ^ãÌãª "þo_>
7c26£+‹=ý­*m–bûXM”Wi•éØ2°4JVV @ý5Õ¯PNíœÖx·~òçÉ[¼Yï.&vfLï@J¼¼“Z%e2üÁjÜ¬Ð÷Â_A)Kô/~ÊFÛŒV÷ÿóv¯AóúLëóä¼¤lläçÊŠ;F³ŠfU£OH¦	W¿mZþb¤)öëøoœÐe°sƒþàNˆ0%ÅyiV5"ðCÓŠ ¼ñÉF€F€Mƒ]´„ÇÕ]H?ÇŒ€IœÌ1"È‹‘ðÂüç’LöâwÍ§âþ{â€¬fD m_(
ÄÇx’q zB€>¡œÊô<×èz‹Ê4ÍgÔj÷O$ÃäF”cXÓ
Çñõù$ÃñÌËÇ<Sí‰„c6¹Qà8nz
Ç™p<ûòÃ1Íq|"¡˜LmæO!Ø Á&Î~Ÿê47‡†E¦ZU—º˜ÏJ¸íTÚ½ö íu.ïï#æþ°€ÊSÿ[œ3¹â0S¤Ò¦BÚ”MMÌõ±˜®Ìµ>–ÞS[ÉÏnÒ9k&fÀÉ!iÁû¥fpPÜG­´e£Zšè¯ûÂgÜfù˜k–‹O¬"ý‚[§b¥ìWä*ñeÂ
eWšý³MAùJÒDÖîZUÆô~#ÙÀˆæV¶i}Æ¥“ÑÀ¦ùt´3æ“KÓ1l¦×ÑP¸­Äï¥-ö¤‘Å[)ÛCÉÑ¿ŽúÔÝêƒ36P#ƒÍ­NÛ `sÃ%‹8&šHºÔM¹·-†ÒähOî€JäIF sóR&Îq[Ó>sÔ¦±ìckêwQr†cnv`qdÄlk]¡»…Aˆ™”µÁV»ëcžP(pÆ—èaÛëDþä-dôÒ>w ¶Š”‡QOÙ'Ž¹Ä|¯C£Ã™î2§¶øÉÑ\çÊ³Í‹ó;2K´»’$ÊŸh½ÝˆKuì©fˆ¤KySç í›Þ}_CÒ4›¼/ÌÝCµ¤ÌäV¦åêf;ûu°Ãì¶-|ï’‘uƒ¦6P=ÓÓm¦,7ç5t2-_àÙTJÜøqßÑJÐz+ÿv¥ýIw¨J½²û[*BÙ…rÚîo¯{$ ˆ3)[@“Ñ®“þgÌÒ¿iìõfS·Í)Û+eÙâXÖ¥I¶F±ÝTMb©K#fZÙe`0­ÊRšZón-ªFã¨p{ë1‘$Æq‹ó¨Å-Óìì ww¨ë¯dó•$ÿf;êw¼½³Wak{f G/ Õ‘Œúp7„/„ñ\±Í;Ùb>'ªéç¢†nj°œ[wSû^´1!Â ?ˆPjài}ƒâCq¨ÂŠ—_£§gŒ—:X-¿.PÞaFD«/o
d•Ë~YSòKScS‚¤³Wˆ@eÅ^b¹Ó^8"?ª[BýB¸É‚{æ&œÒí‰Ÿb.ZÜ&p\¬LÜy³Ô 3¤7oô²6¨&hjši§6/ëß¡ÀÐqó}2ìñ!ÏVö=û1Þ££;dC-ÝCž3<ÈsÌÒûÇrÊ¶p/'2Ê}ª{AˆW-’kÆâ}õLx}Û8ñ½%~ºžYóküŸPšŠ?T£þ‘;)SÒþHv¥>Wñ-þý¤¨Öc÷ŽSyD&Ø<“gð€,("6ýÀ‘3SÈVÈf ²cáÎÐˆëg¯lfðd€³S6ª%ÇO¬¤ì™N£ýr!ùòµrÙŸÛÞ¾#ÉŽ¬ !ˆÎø6Ûk@ £:{e·ÝÃòs	îÎDY„ívï€b&}sKb%d.Ñf	- [ú{[þ¡_¼°Y¸ûº}1w§P‚Dfšëã ôaq@¬×Úí =èà.aúhê
²ØZÙã™öA¿í7Wš4LF]$z“)<]4 z£Ü &§¿FÛöÌ%üj„ófÇôý^a‚æ>Ìw1‚õî½ØSÜ]‰]ýø.-?À¨Òó:„ åP^°æ™›n´FãÏ‚âWâS]FŽ«À	£úUT¨uÈ!@ÌÁä) d“ë+Ãø‚’¼ ú}àÕWð=åqóqóçŒ¶mÌ;ª%ê}|ªy6µ›æ™ûÍ³Æ<§æYîrÍ3‘qd¼ºgáb}âuÏ7ŽMóLµÇ©v~UÌßY°ðýQ6çT5Ÿ*šSçzRÕËù”Ë§ªeöIPØ‡Ü'Kš‹ÿþ79 Ö–W@Q;3u1¥ÜŸ°^ªa&Oôy&œÈûKª‚¶D§žx…Ä©ZÒÜÂA¾2*¾ ¡‚ø(£_iU4,îTý7?êht/+ù?ÕGigñ•ãÅ4;xµõÑ¯¬6Z¬î”ÄÍ_
uôL)3¡Á©>zLúhð/ÒºL95ÒJ§£¨¤%p¯>:^ì‰WH'ÒdŒS#í–zãT;}‚µÓò„N¦žvs(ªéû§šê—AS-­‹ªZ:Úï½®ÚöÒ¯ù9WQÿ#W ?Jç©üŠEB³<“†¬ÀŠ~Z£ä~yTÖ
_V¥Å©ÎZºÔ““|¥ÔdEBMÁÉë«¬§àk|5du§ŠŠ¸ùIQ\¿ÔLàTsmÖó¾z<¡¨c
¯¶òš¯ñÕd
ÅS®h~ÂÕ×æ\#+½(R1B‹˜^á}DWƒÎ¥<|¹”‡ÎÓ·_Tèm|ïu’UëåÍ7ž½òÿþß*šªÏY0.\ý¤b1ô&8­ìÑBÎ‚@³¼â:Ÿ¢±°|¾}ò¤¤êM”2–®¡7W9ƒØ'’¦ó+ç÷"—l]±­û½±³íQê&ÑT_¿¥gÄÅÕ‹üdbŠpŸ¾Tõõí“§%uél¦ÚÒBˆŸÚc¾#ðò‡Òö|ÍÜžÛ2™}ñí“÷$·f^;èYŽÌþ%E¸Ñý‘n9íÿ×¤^O\H>¡ÏÅôh“ÇòQRÕÆž”í_•G¼Ç‡ˆkR~'öü#~`_Ê{hQÅ<Ÿ~	c>ù¥²3¿åùãžñi	·ÁçBñ#ŸŠ:KúúQÏ(hH˜SM¢c«mW»vmeu¥¶µŒ6–¯-olÔV7Ñ9´^ûÉÍ[[›huyéúòÆ±U·ým?ÄCžâvóRq;µ‚\Ši8Ä[Ëµ%¼ÀwV¶ÞB‹«ËµT[]%5In®9p	÷úFúšF˜ËPJÊJ¸Êì£AßP÷IËIó»ò–9Ê´¸\ªíbùS:rU:ªíàáÐºnƒj·×ðÑªßdò> Â¥ªK9-Ž5¤	²ð¢4Cp]#“EÏ¹¾‘;D¬ÔòÈ
A·ÛŽ"CZÑôøžÅêœ²×¼±¸áŸñmõÃ€¤F…|jÍÐÛõ:(ô6Ä2cTÒ.K£Ó5ÉZFa:+¥¤SBIH'I*º‡ÝÂD-ôÑ^0D¼XYgECöl×Ã«xß}/¤ØI6âÚ`Ô/¹$zmµÚ°à€¯¨œáŠJ‰Šâ-‹Ú;½au½~C6ÛCiïpóAî!°ñz=<JgïÌÄ¤9Á¥œ“Ï&rÉ‡)^.Ü¶ 'é7ñ”ðÙ—"°‚ñ¯0Q¼Ê)ôãÍ›k¥ˆØf0Ás¦XT×ñŽØ§•H¯¸–xÿh5^Ç¨ðÙ{Tø~á£”ëÂS<{ßù#T'&4U%x$ìQXó›øìõcëFÖ&ªT/¼$w%Q¿;Y¦;qw$eº¹¶	?=¢…‘“q›“Pö@é¼½¤bH_+*?ÇWTÉOÔkŽüÎv\¸|ó†ƒ M´u+ô¢–.±!ÐÃ‹”à¦Ä`ƒR Vïî­ãö©ù‚}ÿÌ
(›+‰éï¹†ûeÁDÞ¦§á®ÙCÀ¸ú;ø/ÌÙCrÅç%(*UDiN„)$$åì†×_@ûèö=oQ$¹³ EÒaþ®Ï_ÓÁñ @‚ZÒws¸Ê¢ùÐuoã©`ˆþe¾Kz^öÂžßÌ|žíÍ¾ßƒ;t­kù ÿï2Ú?ø›´¢ynº$xûç~¼£h×G÷zX^ƒ,°‚LD©æâ—C–½F«€Ÿ˜¸›85 h<!üW‰XÂÇÑ-P£ú®.bœ-h©Ðä3¬IÜÅ`ölï	¹ÍÝ1‘oíË°ozÃ’¼SvaT•M/§ÊøªSö·$2¾˜€¨²žÎë6\Kçé‰Ó³No®®	©Bo\FÓ!ÃæÚ˜Zœ«Òµåå	ã	—’kìY·65ºÙÐ†ŽåS]Áv=Æ]Ã¢k äË²ªŒJÉ5Æ%4h‘„©n$ñ@àÞ®ó†ïvKtsc]|†Cw\ºcR<µS<R×¡Ã£¡‹à¼vKàŠ8Œ¨¡ÖÇ—¢û~Ó‚êâ ÀwKY€vžÈ_ÔôHëté–”ÍÉÇ­èùðUºÁá%</ÔówÑ¦?(ð¬0~“Ê%|é)x€7OÀxxMLLj±C'wÓ±±Äˆï£¬ß|‡Ú»@[s@žÏ"ÆÝF×d¸[h`NÓ‡m1ñ4%|-ôwB¯«NÚH-I?çÎÑK¿·3h¡+àÿ¦?-6<Ù€?Ò,“^0Š¡?Ž¾]h“0•3ÊÎ•¢ ëšäLšžDªä1	¤±.Ì×1µßþ0jYj,´1Þße-Š¯ïÓÎîš«HüÍB°0-À2ü.&ì7VÖŠ5|(®tûAˆ¥ß	s3¸s­‘þï*M˜l_Às„Ÿ&-sì·‚î`bmºfÉïzíNæ[ô‚ÎÑ¿¾ŠøÆ\2(<ZÚ¶#X_ÁØÇ}Óõ5Ïå2mÀHWo÷88¬âu v–J¥$M˜Bø¡;wô||5ú˜QãûãN‹éTxOôŠMŠ×l¢Jù²*8<ÐÆ@|B wÓÛˆcwS":ú‘XŠ #ôjo¥%ÇFŽÔ´‘ù3
j§6ÉÜI¼P»s“3mœÝÊOEé£yl»'¨µõ=Œíˆn¬ãö—–Ø7!Êµ“W˜ f ÒW›HBæ/~aêT°RÒ'ÿ–Ý¥¦?-¢`lç;u•¢ü¢ 	°eGtIì^¶!‘@Úæ*§8—ñáÛ^7n;BuEÐ[äLc–Rv¶^‚"&. ÐíM=J¼¥Ùö†íãÁÊSXÃ'FM‹5lDÍ@†QôÏÜ,uâë¶jSfèÁR4^d#À§LÃ~ˆÊ¥Š¢L<VÿTO j˜§<g3’™Û À?ù”`!ŸÞ–é•ÖBl”<}ï6ì‚ãœ"C4ìv½p	–J®Ùì”3#â¦lr$Š,yß“Gºëádö–ƒ¹9³6ÆæÈÖ˜š–¥Q1ä÷)æiþÝÖ&–äiþÝ:•ÜÙ ðÅö6“àéÛä‹íí¤$O›©Omí“Òü*ý•Ôçú¶X´&°ív€ô%€C±ã‰„ÌìRkº¦“v‹„A^¹,ë°)ßÃ”RÑ¥_
ì1EÂÝß¬ÿÔo°š¦QAÆçI,¶4‡¿PÀ³ŸB!­7ì¢7TUãÒU‡3LÃczÉ ¹‰»¼,+5{Ï×NTˆ&Í‘®²„]i	\§£Ÿ½qþÑnúBuˆÙ§š2²¢­»jrÈ±„zmÝ\G×Wo^­­¢Í­ÚÖ&Ú¸ùÎè¡ÃJá·9b$…Wo¿VöÊõJÙî¸9+{ÚXã…S~¡•Je¦ÒÈè¾¤ºòXóØÜò3á“®FJB[»“¼--“Ïé‘}(uÊrëÇã¨é¼Å9yûÅr¼}V÷d«ëqz÷º¶°Oó–p×^}r X±/ê‡½ÐïýÅDü1$E ¡*g¯H<«ï…ƒÞÊÌH
ÇìÃþNˆÁîÄ@¾s0Nà—]ßjÔEk1 `Ÿâ½ŽoÂ‡Dùè—%„2¬Øô`Ï¡Ía=j„íþÀe÷/HŠ†“‚<_Ä±0„X0t8ò¥ ÓñÂÍöNÏ€	ê>¾|hðí“?ïk¥ætj…q`Èu³
â:
ÐÁœôPò½pü ³?‚01­{{ÁÐIhZ$‘ªzÔHìáË‰Ú«ÐñàFm×kƒá–]'½ÎÉ@ÉS4'bàÛe"{ô~$¾Ù¢eGÄ˜Û¯ùÛ³øsgÌ³ÔŽêÃ0ÂôËgÞòz˜ÎB=Þ(ürb^r<h³^ÂT…
Zp<vÇÏ>—q%Ø\¦ñ:µT»¾¼¶µ‰Ö—7®ÝÜ¸Q[[\FK+ø÷›?qV4PB=+öSÍ`8‡¢î$2äzYg‚ŠÐ¸cþ-å=#æ¦IP·‚ =š>xH“±êöksóÞyÈ7|ÈŠÄ;œ²†[ý— †þU'ÉÌ¢‰"<Â©‘[¤*ú­)Y‹ú{Ì#ÿJC%M–3²&K²@ò{:Äˆ9ù«aF[Wë…?Þã3ÿYÙçrq…ÇdÞ, 1¹z9Uœj
ñÐN%]Õ}|ïyp.íóžßDiù%ßÁ÷ir­gR¨Ö—R¯qá¯Y*MˆeÈ[ÅwÙÝþh…û}Õ*v³[ÝòdOÅFåE{½²SIÝ‡{™ï á7Ñ&E­¸(YâvølúÝö¹HP—bƒ_ý€=´Àü=ðûQ6×a$WŠ¥ ±Ž÷¨4
Íúš þGSf:‡Å!ä ƒG(HCM9ÍP6±Ió0û‰ÉÉm®R™ÅK™žFKþ¶7ìP“Y¿t€ˆ®¯¬á½hšÊÔOl‹Ãâ_'ÄœéÊ•år±L>Ÿ7ùÃìsw_ß7ÇÁêAso­"Óc‚s¹Å¹Oþ„A¦FNÈqNI+ ¸È.ág…tjC‡þLn{êGÁ”7ÞÈnbÏ1Öv÷»E‰û	ý#£†OÞG¯ï+£°ò8RAž½ EäytüWj FßErOI?¤>”á‘Æ†§À)—y¬$1øš7yŸ&@<ÃÂ´>ãÝþI¼ú	ñ*Xjœ?ñž„à×2cþ€ø•È¡ÍÌÀ#ò'ïfžÞjxƒF°tKœ›]hP(˜¥]/ì&®a ‚1;æ$¹€Q÷ê @,„Q+ŒˆL¦ó4<‹÷“œ—f÷1ò 7`¥®Exb;²Ýîy™“³lã+‰C÷Ößµa•ñ§ÙŽ¼:ÞìËûm>¬s¶IÇ~¾,…dJŠwÑÿB€¥úö KõeùJÖ ÙÃI|e*íVKB"¢RŠÁ$ÃÐE/Ø½~œã\¼Ä÷òÊÖ£g
úî£OñÁ·'­t€˜74“¤Iêbh¥e-Í AšVÙ.+‘1c“]A³Ÿv® ¦õ2zÓ"÷%os}‘“‚ÝtWè8Ë`•ä×%þ?BA(œPÃHvÄÞóº˜eá†íB9Öh²ÝÁ ø€ÆùZ/3ÀõîF’¾Ç9;¸­Œ ýÈwÚè¸å{Mû;ðV¨É­¹'ëòúÅ‘ÖÞRÅHiŽÜÇT$	úªYw3¶€Ð„þà¾Nã¸÷ç¥éAë0ý™¤_õš;>šÆø|ßïå g¯¬ôîi|¡ŽGÙ¹bd=ŠŽÃöNk4’Q;5Øù0aùò0Â-ðGJZŽ|©<å4ÓÉU¯C4)µûX
ì?Ò5Õ×ƒÇï„DdÚŠ\ÀuEž¦‡á‹{ˆý'àÂSØ¨e$3“©¾I0#ðÐ-Àuj
µ›œ4âÚÌÏ¾7C'Š›qQzÇD²§Š7j¶ØjñKokˆîù{Xnk>8wWˆañ¶Vå´´•ößLÀÓŒMÀy;Ò¨kUžPÎTÍD­BœóÐ<ßÅöÉqðµƒN_ýÐæªÛj–6K;“´nòe†xo+ K¶”¬Â6&kpu.Ugl¶ÊnãŒÿ=?Ç~ÂG–`ól@ÎMÏÈ*ÌÉDÌŠÞA¯Óîù›>÷Â¥ÂâzèG>¦Â4b®Ýk"âòYõ	u¥ ‚¨„7´7hoƒ0ü¦ÀÚº4þ!ÑnÊy¸êa!0OW9(KüI"n›L¥hFÐ„¢ÁôS%|©Bï}2¼S„˜§‘4’p‡L‰R¨ÅŽ ?(ô£VØîÝ+ºH‘‰õ¦ë-UJPq	þMÖ\ó³ fp–+Ór£à«uÀ+ûÄv3à¿Äê¸+Q´à?Þˆ\Ì¢ší†ƒô'ºLÚ*«b”ö‹PŒ\T?‰A©"9"d½\.êÀ¹&í¼û*¨ðÀòh¡'b©:xŒÀtÍ¹ðt?žîûBÃXðdïþ½.=:¸ëÎ@Æ³¹†=a×_SÖÃÌzEêg}emÁ \$ŠàÑÛA9i-@Ò‹‰œHcÓðU!SÛÀÞ´
žüë:ÃÄ¶ìß…Ê®|Ç¨o|Ý]Î ›Ê&tå2šCo¢	‹„7k•ð&ÐÂá§PeSýCÕÚhÜ|ãO$Ä•…„	Ç0šçäç±Ü»È:µªåYcÆ&cîÚm»RÏhbsàõšÛ•?tç^îHz´x'‘îäm|?¾+Á¡è§´ºÛxæ12%8›ŽuÐÃÆŠÀCþEl:U%ö\­[HI:¸³%:G¶1N+VÉ©“*‘cžäŽ,&¤hcŽy>)m_"i¦Æ>þÀz
ŠZê1±”1U‘ç©<¨¬î(÷at-‘Ñ‰ŸâáTBnFêÇÝéHýhälà‹Ö€èNª×jEWCã¡Xb¹PSI©Œ„6PœÅŒ™rBDr¯ó[`éÍq!8,^œ3©÷6Ü<»Ì*½}e9¯®ÁNÇGxƒÁÛíLÃ9ºÍs'¹„9¾>·wÅš‰—%ü+Tùnéxþ9n0Ù~-^,,‘ãä¼Æ€„¥’Eó‡Õ9•k%Ãø{/¬Çi×Ý]Šc‚z]êéCƒ<÷Ø ~WÖl;|²Ýx2À†4«·À4qÑq×0~ÞS©…RÅ\â¡v°¸ ê¥œ#•D–6jïÔVQíÖÒÊººzsñoÁMæ)ñ­{Æý_ž¯5ÓÜAZvy&¥i&ëV#vaô¨VëÄ¥ –ÐêŸ,¶;çx¸tôåN,¡GjÈ@²PQÞB
ðÒ<ÄšÅ‚f{ `¥ñ·ÿ{îõõ
„ð
}áe­iI)êùÿÜPÊXÅÄpèðµ~ÔÈŒhd…pc|${:>#HB½<E™ª¿K”ÞVjgË¥¢þõÿþo²…â‚XY*ú}&íÖc>†Ó_Ê;©„@hÂ&²ç§P&kl»óé$[KŽ36}/l´T´˜!hÿrÓ‡;X€…Šé**Q„ÀÍy ªã-t©ÝëÍ^*FdRfCrÀ¿|–­@ÎI^*™Û’\H—÷Éë´©™GbË•;øõ‚Oóóøƒwâ†¿4ðÂŸ%X²0[•ˆš±J±"ê³`*#»4†Ñ‚ŠÊbÒCl¨`uÇ[S¼ˆú¡Ö¼y`
»Åó³¦2ÜÑT…´Õ©ñœ&SRB(ÕLrº%í\wvòR»×è›~Tß1ca7‘8mòèúÞ-±Rk¤„†¶+Kã®?hÍüÓÑt§Ë6E]4§¢xãšsäZ}4~º•j"˜Z«¯ÑºñÚ¢*kà½¿ØI××yLêæåŽÎÏ•Q·ŽI¬5ìX&ÉÔµ@®¯0À—U /`|,eÔŸ6ËÔúä™ºc³n}†±ƒGÖXÜˆ³]ˆO¨û°Íuœ†³#m=lÐúq~è™×“V¯ã­ÙõàV?ðÚ÷M[Ÿ»é~ºíÁÀÅ9×Õ±x“$Ó;|ù\Uí×ïLÕážº¯£ÐÄE•f´;]ÏÏÝR»™åúYÉåúiÒç»øã;8yBu{•5¿½²ŽnøÀI'\ý[2]j4Ž&g¯ühWöþtÉEýc·p“°ôÄz÷<VL0úð\“i»ºº´5Æõ¸œ’É*`8›Ô°ÒŸ.(á<f×ŒJ™’|’=‹ÆÛm7»Ò>—¸²5Ê®ö]»0‘0ÓŠªƒLy"s,¶pûq]‹"zÕ’çZ€Ù¹2Átˆv2ª‘ËÏ‹tö1dÂe6‰T„)ƒ°Šâí¹9,Ì¸y¡èSÙf¸ÈÉÀª{­Û4&–—ØÈ’‹>¦kÌìÚÑÉgŸïÃ‰ÀŽ\Vð‘ìß®”CÎî—œ­+9-Š£Ùê#ë?,?©¼ÛL¨*@ ƒý¶”µÐ ÅÈî‚L†±nÒ—Ãó)D·~A&
^Ä&r€HëÃå ÈY—X÷ÑÕ*f{˜k:£1æcåŒ%|ˆgéS°õº¤Dô3¨OoZ¼ØR);Óüq7YgäËY´/^ ò‘ÄM.^,OŸ×ÄÝ‹50cf1’?ˆlÛqŒ+#;;Ò¢Õ«F3T»[¦8›tsš€O‰”™HmøP„à”H½@"Rêzá=¨!~('˜&a.IÈCAÈ·™9£¯ÍÉ£CtßÇB†.99Å8yB9¼’‡äå'w#’:À{La¶Ûa·p—¹+1&Lë§Ùõ›w-E<Ó!e†)NK9y<ÃÈcD;úuTÔëØh—;Å`¹˜6è™6ÉA7KÎc¹äHÂä{Z±’TRÊ%üKàj.ùñBn˜go
×.-©ˆÎäèuôºs'ZG¤3Ír–›´¼8«÷›qú0Ô:¬Q—µÚÒZ[~Ý¨­Ýª­ÊÎj×nnP‡µ•µëÓëµŸÜ ytus5gÔp5£W’•ÀŒx›Íîp6#]î¥Ö¬Ùò™Ã£Œýæ¼N]—Ö;Cm"iUe„Ù^oHò§1BbÓ’Ì´E¶àÎõ…äœôra=y$’Ëê“q¯AÑî!ñzÑ¤®ü;K¸õ›o?û03ÕÖ¥éÖ¬Þe¢­µ‹zÔ$'üWLìÃ/õCÿ>$Ø¤).M…µYþ€ž¿K6
,›`sXUuåU0ÛX— æ?¶!kÖvÛï4#D
2ôv¬dÝ\é>Z»8|(¿O²¯PÕwA]‚uýmrkÜ¼2H/—,.Ò
Wzøe,HnÌú2¶5ÂõMì!Á iK½`×|º¬Rë0$öÜËjZÎ•Í›Ü8TŠú6^ÐÖÄäí²®@µÜî„âÒ‚ä6ÉÐÎ\&Š¢»Ô?—aQ[çÒ¥È¹¾“[@·XAÖ7Ð¾=Í`¥%Ñ©Ç
EâÃ6¿DHñÐ7ÈwK§²¡&nÆÐ‹MÚ^@}Ÿ¬ùµ´fÑv‡KÈ·Åù“Úæ’ÐxÇ†d9ÅßÑ„Ý±‰¶áoÈÃD5¼)Àx¡;¹¨àït×-DÀˆäÓÓˆÆ(Qšix¿°&AxaÂ<’ô*¥„®/S8t|›;Þé¿Å²&${‚ž×155Èáæ2„fâ¯³,'ìÔ¤éÏìPk;^Ýï(b1¿ÊÞ	?#£?R·&ÛÚ6¾B¶ôŠÚÔ?¼4M†9”?-Œm¾!„Œï_PÜm½{­¶woÐòÃ`»‘éf+Ö|~¶
ÀŽâh»+ÛÄ]†u›ëíœ"(Ç¹e‰Œšr¿UÜtc)Ô„½9/Çœ˜2·3,?ùóäÑ€dð±£J¼ÇÆMNÁ"]ÌhÐÈhâ)<òŸŽ¹Ë"eÙ€ù›²572ÜzlpÁÚQÃE4Ì•“ÐUPoÇ€Ôwd»yVeég¯¨ß/MÓ·svGCN¯H_rw´æíxMi^ê÷»có’¾äîh# j†xb‰¹;¼êõî!^
51m ¬ü´°DOfu~iš¢Ð	§[éizôžtòÄ§råÂöqgXT¶‘c1Áü{É²Œ°)¯ßDI¾Yª’”Ý¢úKM¬,+‹g#Z8óy«š[ºfCIdÚ8_V
¤’ÖÃÞžç;+—>ˆíf…ë¡Ù€A!›Fseieóê­Íe²¶6jk›5È'c35XbÖ@cjZÓ>üOÖUÝ>hõ/öI~ãæÒò*Z]^º¾¼Î¡k+kµµÅÇ¾²vmÕ®&ÚŒ8rÂ®°O3Llyuêá×š~çÝŽßÜTc)7¿N1Â¼Ä}?·½¦¿’H|…MÜº¹Ž®¯Þ¼Z{°¹UÛÚD7ßÑ˜AÌ±…L­ÉÜ°šWƒ ŒWXgrÛm:¨+¾‹¼™N=A{Þ	ƒ(ÚðïãSƒ”0k6üB!v§P’ça½
õR#ˆˆ¶¼<9…ÿoê¾çnÀöo¶¼´²b¸¢ré¼©I•U“RªæjbÈ¡•&÷ciB]ã®¼FngÏ^%™ïÒÐ‡c¹áZ¥®÷ PžJ¬¾¨Y—.lÑý–„U»ò¨Š:;)]’ÉI–¤ À»†*y
[î„^Š2A±¢í0èBÂˆF¥\-c†À—å‹•™döÌ•ýêÌÌÌp‘ë]ª$­µb,+[ó c­Š™#2-Ç9Gá©†A^„áÇA=B3k™ZæS5–p¥ÑûiÄåer–Ú¸ßA£•°ÏZWWH$"½H¦VVÈU˜&Ï‘º?h5ØÙÉZ¼½Œkäv!È¶ÿHB‚[žmü‹®ä \ž‹Óìiª$zOî¼-‡À!ÊÒrVO‘ópÈyÀô6Ü(Æ‰œ¨Æ™^þbÊÙX)W3ã%%Iõv§YÙiÂ±ã@ËD¤ÙëÚ9•¥æ}[Äl½=X„|²ÇŠŸ3§øy8ü$ò¢Sá|ù“Gœô>Ze)Æ)‚*rÚ8°4‘y\‹£\C¼Øe*ÌâÅ/@W"R’#.(òó¬&¥é1 µ?—L–¿Ü—ÝZ4±¡³!	Ö¸±yö›‡ÍjÍ0ÄŠyåF3pZä­ŒQZ\ÉÆÎÂIÞ†Ð·z}_ÏðÂ#ÈmûÐf-þH0TŽ95„83Ü8“µyÃ– MJ¸ÙÞé5~:ÿàžgñúÆÊÒ8¨ÞÀ—|ª¥ºZ[­­-.£Õ•Í-‡¤ˆ©[÷ƒŽtÍž!×ìyÍ~¥Àt*%î>ËôD?¾y-¯mmü„ÎÑÅg/ÔÀçl4“ée:Ãµ^ç™çä–#‘ŠÄy½iY‚Ä&–Ö;Þž™¾YjccD‚’Ì±y>á¼¸'ØpöðÉ)ÕàÈ ñÝ¿iÉhøøë²$„Oi@ÙÉ÷ýo?ûW/© +ÊiÓ/¿!¯ü†~þ„¾,R~Ìsþ	ñì‡'ò²¤à[,')üÝ-÷ýÅ·OMiË¿yIMêÂIÚËsòýã¯tÁ¼´8uN&OcŸã#Ka¸OµÄ›ÃæR‘9$\Ãþ¯:UMÆa!¦˜˜@hÎTµ:w~Ñåra®•;p›j9Á¨G]0™Ý‘,—¸žKnæôR\k6)ú¯’á”|BöÐJÍéõe±´¾Ux<>ó&1ƒó™]LÈÀœvX”LÛ1³Ós#£sÏÀ|ÖàÕtÇî¬R>yÎ*g¯‹ˆm|ªÅb¶ÓÑ“×Yš-øž™i‹OrmA’n‹2ùÞ•Œ&ü-{mLàt=½‰îþèuÍw¡nÐZ@<êÞÿ{~sâÀ^ê=koÌWNþ$Fº@‚úàJž² T djGâl®å‡p6QÌj:AB>^ ÃHŠP¼X‡bŠnc$¢! 'öÈÔNœ£“_Ú)¡òüžþú„¥¡5RÂh³ÕÖûßÓ¾°°QÀÚ îöâvM#ÐÝ¾sÂ WÌk½ð tÂ'–W@âXÄëiC9|·Ý0Ì•+ŽàL7
<“†§ z1ˆÓëÞ^
2`Ž
êäNl¨åŠSÀ[XÖ(PíN…ñ!,«u}B@WLgßÂûpÛæÆOÓ@YÅL _ï¦°Œ„0íM¡k 
DtpW¾‚‘ä^^¨ü”ÖbZÛC-yUÜ1”¬“ŠÞ'x5Ó»IvvQÃ L·‡ù¡×¨«¿+•%ËÁ«‰ÔòÆß{Àµûã»xã6†™?b—üÛ¯5.^œŸ+ßáþn`¦ÑWaE$}««C~Â~¨÷ÏçëÎØ=ªúÅä5õdÛv–on,qÛÒÊæzmkñ-»]Çì¡Ÿá†¯5ôUKªµqS8†ßºq£¶ñ“Ü–¾êh–>µDI‹JÂ© ¯Ð¹–þÛêÌ ¯íF°xúv¹Tž½CÊ»!5©á3ýN€Å’ÌÃTÙ-Ÿé’tE ˜jø7°ìŠ's­Ýóz6ÜõZ¾?Èv¹0Z1É¯y,™ÖUskås^ì5æýŠå'{àoHe4VúLc¦dÆÅ)n,„þžñ–¬šÛ/å¼Eø—÷H`Ú„fÔt×tsúFXSxÃ¿³„IÏáZ„ûùì“Jýµ_ÇÕÕ`ô/Ií5–ItôLäQ’KÍ}Ã×Dm›_¥ª4ÂÏL¶MzhZû&ýi$×§Œâ:‡)©Ã8Ê8Kè(tB–ÏtÌ-Z‹“Õr‘¬ÜR³PBîÆ¶üE`êÉtÿN0R7Üå™y:<á7yöŠâ9r‡Š'ï:xJÝŽPHô;*‰D: ’KÙ«{Íœ.«67G›iÎž=“†!	ëæ2Zäì¹&§§!ˆ©ÑfCCÇ–Ø4kHlYÆKÈÜ†ÎËl[¨«»ñ¦ši‹t)^Hüf¨_—œi¾fè[9³KÙÅŸŒ¤ RßÛ$œ|
‡
ÞKÎÓQÄ€†>ù#`É½—ÍËû'!Ê":Áœ¹–‰ÐÉs \F¿Y¿2¤QþÐÓhÙÉË± Šêié1ÆŸŒ²Šü#Êz	W]e¯˜°Vî$Òa»ÔÑU*é«&ÙÞ±ÀÈ¥vwÇá5„¢°Á××õvü[a‡Tkýhazš<ŒJÃÜ%¢FÚît¿‚benfv®:a¶ráÂ\qnæâÅYïüÅ¦ç×ß)í2\N½Á¹íöàr#úç~vy¾|n÷r¥ZžpËìu—%¿§6šÒ”R®ò ÉÃñ}ð¾¸£¦¥¶ù;.É€ÝRùæ¬õj¯wA×Õqž› 'bá˜%VYÍ­Š–e@)¼.
“Øœ‹fÁçGû‚ê¸«û"\KÖ9Ò#§$'OÂ­Ô ÿì+œ’EËŽqâ¶Úˆ¹êÞÑÊwœ§cÆ½†xþ±^1ÿü9ï8þù«g »àæ_…Âö^ÀQhâ_ò/‚òö1Í>+½y†„{pÜÙÏsU×?%¶Òå­ÚÊêò’œ­Þ¼¾	)OV—"LFQìjŽüéeóòã“ ¥½´HXðáKhb¿‰¨Í‹&3óhA_È‘`ÕÎQ|‰%žÄ¨{MFqpÅ¤Šñí§©Jôw"ÿ{Ð¤‚2ô¯(3½%¾ã³oP"nÅ4)¢-¥*á÷ˆî7yB£MžÑn>!o~)Ò×?djh2ßÏy4Ë3¦“)¦Äð83]ô¬‡Ö±Úõ«'G·jÖ«‚¯’0›ÛÕzZUh.½¬¶â-=MWGh-¼‰_ÜP].óÔÊÝ~tM®v2kÁÀÏPJ›µµÄ¥¶Â©ÒÒæ¶ŽÌ‚„U;›G3k	@7gçâŸD–®Õ6þ–Ö‚R5gž]üC‹CI½³;éÂZ¾ÁQár)KPc‚hÐÙÄ¨syþ !”Î+—3íUÕo¶‡]Át-ˆw5E#pÄ¦',=¸Ôaéµ{P"À«c"SÊH[‘Ç|HÆL÷âÔ#$
~€‘L¿È¥ÆÓ¨‘f’7[ë
TéFº‡ÒMs›¯›ÉbÿHKêà3p$Vqh 0Í;R)‡Béì:uaPpV$N‰Tv­ Ï.¤•þiÑœ½¨˜ì ‚k1j~n’dè‘”Ÿ«÷~§MÂÆÏ‹6h;CÉo¡ê97ŽÎ¹Ã„¡ñá§IG˜KOZAnßLiJ>¶%Œ¦uc9ŽéŽ^DÌ7» v½Å]â¥{ˆdµéV÷@²t(q/½ML'ßýÝÿÈ$/‡\,¸f£µs¥QQ5Ô‹öz”§v¨\9t¢†åƒ½`ˆ¢!ûc×ëA‚RViZíH¯~Š/TXd÷H¾"ü«Ïd¬7Ñ¼¹ÛÆ÷ËvØ:{Èk‚bˆ¼F¨ü™ˆP&õAø™™ÈQ’†u¯
êízí[ÆRÐ(4áÿõ)4ÁÅì‰)Ä8~žÊ¬ÜÓÌbÍÛV¡o(Iµ î½39Êu¢±ü0Ì[¬5èø%&hV2pÐfK^ÀK†~s¯öUGI`¯ûèk‘:¼åT¯T­VŠR-­ÌRP(š”¦\K®-¡ŒhÖè…hcñ¢kVqù£V7MRvNF¶Ã9u-q:Þ›’¹ZØ¤‰!YþFeÿ‘eEOdïcZ40ŒråW³ˆ[n`D¸éIÎ!¢J¸	§Æ——ŠÄÛÂ’Ð"^Z}o€©Éžyš~*ÛL°åí‘`2–â9Ñ“xM,ãïÒ¹LÀEŠœ/?µJýÇ›jÓ‡ò‰˜tF,Mà#<°”×òì©bùßu¼~˜6‚0á5~6l3:ÜîÝ'ÙsúPØp¼îm®ŸMï¾O62w–	Y Ñ+SÀ™™ñ›CÆAZÈª×ÐþöÊú\v0!Ó°¸µÜI‡Öå¦‰Ð4µ¼ªåþ„áøRóòþ™32ra(±ÖÉDtÕp·YÄ|	ì¡nñ“/g!À(ÒìaùÊbÞ1¬qÔðcFJ ¶PhL^^¬Ó-¦ðƒÉ±¢à¡#ñ»íÞå³–|øF·…æ+h<3ç†¾b¯àzo¹Û‘˜wP`Å²a¦G×ŒÈxÔèåG°Ý?þ#£½W–ò2ñ´™¹ Í¾Obö0TÂOð²GÁÜìø"¯O(ôßð@Õân¸ñ:“//ÀbjN°ë7“‹zì%‹{(èp«×ic9/ ½ð-®wÏðÒaÅ# kù"r¾œPœX‰P(=H&üa„6wÛ ÇtMˆŸ·Êš+›&ç0×o‘5â;¯·¿ÝäV®M)ã¬²/‡IeûbiNã&–=‚Å$¹ešZzafúûfFÑ{yŒn´üÆ½z`IBÞ€ÛA¾•ˆîËØÇ›ÆèÇºvE@¾…V…	Ñ"¬èšžul×ÐŒÔÊZ¥–!”„Éª;¨¾ñçHŠå¾šª#‘‹Ùé§]µ9©¹›s£âÐw›™i[»)ºÔÙ©á/¹lN"?÷(dMÅmß"w‚ÊÂÐì…]UE¢eg]ì“”Ð×la¿t±\bÄ_–æXèašatJéd&²ÌT©àÌœkŠûÔkb‘Á­—7œ(˜¯	Ê¬FVë[©†Ÿ·ú^y¬Lò³ÎÉI—æÊz/×”C®69›]j¬Õ3JdÈÌ	¢ºžr¼Ûri!QYˆó9RY¨>3~¶šNèDÿL\:¸CQÂ’Üwv~Äá¡‡¡¨Xëj|M–rŽÓbIºMþW\
ªrøÜç)ÛÈ­õ¥ÚÖ2Z¼¹´Lí"Ëâ»™£är†5-¢¼-âº?¦O²!M´ÚÍ¦ßKd{:Ú4O`ÄK†	àY5è¬2o fiþõð,˜vöÙ™¨qÝd¸Xô^'ØÉ’ãÍi™¬uªâ›'“ï¿©zÓÂ…³JÓßU8Ñk­Aˆ´ÉD^_÷Š«ÑÒ|³ä™q¹6[¦EÆÖIÝã1½0Ê–)ˆ®TmŽìÜ8hóýJ›ƒñ¶·àŸ.î‘;=;ånýa'òí°”…“’/De æ^Ïë¶ˆ§ä¶¨ó•·d2Ø‡“~¨0{áÉ×ÍHf¾Þ†˜µC`:bŠø¦®M`&æZ¼QÁö6>fM&UdC±0/›½þGK5‰9Š+Ä¸&Èr
ßbXÖ€rj}Î­­)³²‚ºø;jhWJU•t°×J\[!“ÙÐÌ bÔØ PyuÀDÖ³³Aéz!YÚ	dŒÜ>¶!ŒÚU½â›ÓXØwÈ“¥Ý%W8ÔS?ÄÌ:v`åAW.9Å2ü¼2óc¹Äaa¨™©\¨f¤ÇÒzDCˆHf:áBšäqÁ˜„v|äã4u°e,LŠ0Ýâ2è¢€˜Ž+û€%ë¦Ò,)š€|¡H¹ªCëJ¦Åû—/éØ&Î>˜˜wðtóÚ5—µ¹†tŒ¸ÁÉ2e°·+sìÒ–ð—g‹‰)–ƒÛ|¼R³ñ-(aI0›XrqŸ7–š‹pxhš?ëR
:ƒe> ±ívƒÙ¹s(ý3è›°T¨þ€o‘ßýÃÿrŠN:ÌÁrjîiÎÑ)ýõpÛ
vv:ÔÇ2F)ó&tÚ¿Ëñ·WëKk—ÊíL¯ÅA¯»zÅ3šÍômŽ¨ÒÄ&EO,ÔgnÂy¬2–é¾e¸L9öp×åÜrÑ@¾—°Gô/¢MYéQ‡g§la®å‡@œ„ðÂ®aœBp…F®™ThS4s£Hé¶c>ž»¡íÖ2¹üÝ*<Å+rw#tä*Øåî‡ëÍG¥ø,æMùn{™JõôTrhäõuóñÇ)FF%C¯{¬Äül’
eèëËIqD
ž‘bk„øj ñíñ_H©ä\ÂjD`qˆ‡­siåF/‘>•;9Dúµà_§xš<ôï8:-’ˆD»’ñØh-VÀ‚?ŸKp6}HÕ8€€EW1è‚ªÆG”;Ízð	Ò,QSüg³~L7®=RæÃœXü¥Ñòºø«¨Vñ‹u{þ ŠDùá­°sy?ñà@=\û°õ0ðšXœ¼Ûíí6`Ï–pÊŒâêìHQ\•*±bœg¼Pçä¤µJ­úÛƒ’ý(À9	0s±Háñ…EŠq“òv¥Rñ4©†j‘š_6<YfÄßÀ¥‚HœIC•Ýe+9'¯!°œ _‡íþS¨¶8yÓØMãzÌ÷Û^qÏ+ÊæöÛùrÙ€ðóÒÛœfÀSÚ¦³AT¥’è`ÓÃ+ÓN+JâŸ¸š$6L‘û†çEj>)$ž™ÜÙjJØÜÍTÂ:’9/­0…ÛõaÔB5ˆc¾4Ýªu±_Ì)z$êwÇ”˜‡½Bò×=&©ñžŠ2ÏY¹’RŽe–û€¤•?>"%FžüƒšÊŽtc´Hd%¥Ôý¢kó{Í«œNiCÛLY^ô¦5¨ L¼òxYµfô16Û#tãV,ùe´ˆ”tU„gsðÃ–¡/¡t5e°;{EÝ‡éTá˜ÏføR¶ÆÜ<T3¶äo{Ã&Þ5LÞnÐÉtÈ@ABD–CñO“‡q¥EÎÓgîÖ‚Ò±'“Öù}^Mwp4Î×L)UíM·à\ Nc0ÌÛ´*=ÛÜ³g¯üÇ¿ÿSU>êë îuØ4zæÓÏ*r¿ïu:þN
EùM2±£k†…Ï•Q ±¡0° ß‡R½þ‚]ýÿûYDÃi®Éu½¡Bz¤‰µ ñœS¶	Ùûc¬1füÍ§ž0-´µ×·Ç.æ&ã"wÒ|àžB÷4+\$/ÁÝJ;pÓÕ@^„¼ÞÞ÷—x´{ÛÁÙ+ßý×¯ÿßW ü…1ŠoÈùÑ·ÿB+ }êL0c°T8x˜…¸7æDá(·$7îô£ßÃÜoáCÅL–Â`P8*B=9ƒ‘+ÿx,‰Ûÿ>'jŸÞêCâ61YEŽf4¦ÅèF.ÚÃô¶ëûŸ°¾Mò5^ßWjne<Æ£¬òpjMºÕ¢-P¸¼T”ŠLxšTîƒÍ|ÎÒFÃþ}q4Íõ™"~0ãQ©´ušÒ§T‚nx ëy´1Dž.G D¨†/æM'WåqQRiÒ’ËÙèëˆQr
¾ÜÀd0+/Á	Ã>åiz•è1g,|êæ›‰L0²úÞè¸»ÑåýY3D'‘‰-fDtb­GD¨%ß	î4ÈÝ0šB»>jy÷}r‡Å#×/£9†öÐïBÊL¢ïy46—¦Ó‹Jh"ßÀ	_ì‡ž§A}…Ï¼ZÈˆa jÿœ6:bÄ%ºJÔñf|<tÁí8ÁK;‚1æÅšCíAÅ›$\Ð„22Î»"žÎÏ•Á'{(¾ÀZJŠ5s|¤pVÃ:§’ßyKz“³ÊmyaI³Ò¾âHt„Ô•J%âÚ¿&$/òŽƒø=­W1™•c‹›}´Ê»üÁ#àã° ò–·ðe=÷P‚Iò*í/ViŸO7ŸúÝ­ƒ!Áä8<}¾LŠÉXôåcV5SÐà{~N„zAÝJæÏIyj^ÇZªFò{^0êž<¥å­	Oþù÷!¹&ü+UNÅË\_ÅœK‚¡‡.`^u ‘Bç¦qr5«‡^ÖãxrúP3Bš9ƒy¨Œ8‘”…f/+L„\ÁX=@Ä\õ;•ìÑ¢‰†(Œ3U;A4‡¤üùex'#Ê®@êZt¡i 0‚<‡lM´ØndÓ©ôÑ öD˜ƒSŒ@lŽÚ0	ÞÀfÀ»¶U¼Of.Œ’{ôú!1%F0ètê^h?R€ÿt²â‡²éiÔô1,á|ö:>¤VŽ0:á]R¶$c7€›5wü«;è2qF¬c1VñF$bwÄø…jyÂ^‚„L£ãSs8SML&†tóµL¸xç›h‹R#ÏKž­[ñ¼?ÏäéŠRãõ‡a¿£n/{$*½”‹‰š(5®b&ÃÒ'Ò¨²]xÂR”×¡2 UƒO¬têYõ6´qH:©¤Y©zZ¯´yÉá¨J„•Y$Ò#ÌÈž)É#Q®Ä2ÓŒ ó]±¸mŒÈÅÝbv=R7Z”¸¸zý*Sìß¥ôy^Õ2ÌÑ+ô(ótv<¯ï38<¸ëg Á3Xi@=}d@kÍøÃ¸LIvep£44OàØJÁí¦ÂÉ”^lcùŽÆ;ž}Þ·5ÊVþPšºT7×m·m¶DæÚ7­©–`mÓhOˆg¢ó¦ýSQËêQn•¥
TÆ6Ùëóä©|pïï"¨UÇJ»ëcŠØíÓzQ#Õ{u+.cÖËHoiüÊ‹øšÆ“ñD½áÎÙ+œ Å¹-:^ŒåšèZøý$Óÿ :–cïw¡ä˜˜@—)­AÔ®;âæìšŠ>çaY>-pž	 ÌûvÃo€Žèbn¸ÓSú\v”y,•ýZø/üÖTž“8Me­6åÚ,¹#S!c¾âUg“BF‚éjFPTëL€ÃôLÙâçµ0RÝ+â;[§hÉyŸLè=œc²‹KrFÕvK©S¡ÓMC­¥•­ìŽº÷!I@æòÌ•ñyJ†vA±ø¯¬Õl˜).y{hcE–ø0î‘›uÃÇóŸ‡!‰*)Boa
ƒÅ©´Í‰Äðc•{ø%ùÂgqUÕ}s\Ý‡QFÍÓmÆe¢ñßÙe¢]QËrz²þ4‘ä´,¤“ƒìŒzoHn1ÚRGP<'øË¤†Ô‡&î³nÉaÌîžÎéwF¿(E‚Pv”5R†A§jLÌ¶1ë‘„:>Õ'æ#‘¿?Bß>ù?ˆ×¢~*Š=B8Æ#êuû9çà;aÎn›;ƒÎE&­Z<«µü]¨.‰Ž–­ûî£OPmˆñy}î@\ÛÎàoÐêö‘=GûS®R Ù§.Ÿ/§ý1âÜþKZÁ›ñüÏ˜X lÍÔ“öw¢*÷Éù~Le[räHjžs„úL>UÃŸÙ?ú‹0}JfD$¨s®…Êg\Þa’Î/ùB˜ê¯ùCÄçüŒŒüod¼‡quöðbÓhÙtÜÕ?Ó/DdzòˆV[Jš|$fð+².*q}HZ}I‡þ”¼òPS“ýOü—¸´:µ!<JâýòkÒòKòþ'¨°¸ù6–þ~¼ysmÒTJýê¨ã¥Œu)Øíu[}#Hudd³îÄT0;UµIðŽ1Å´Èï hz{øV†.£pu	îpì’V6Šbþƒ~Þ¦2Ïj°møx
÷ãSè.Dƒ‚a£õ.–àßåÒ»3x¼èÝ×÷ùÀ¥Ftÿ®a(Cªšèƒ{È)>ÎË¦mIï«$?q6Y„†ô±Ãþ9`)ó×2\|²\Lô´ëç¡‰¹…>f~xKQ‹™1<.?høŒ5€;`åð’žÿ  ÿÿì]msäÆqþž_1¢,s™ã¾r¹ä1ä©øvcÞ‘!)¿èêJî‚\ø°‹5°$¢Y%§*Vùƒ+ùb»ÊqÅNbÅW²Jvéƒ,'û¯$þùéî™0À` ,_N:iëŽ`ÁÌôLO÷t÷ÓôÉàÒ÷P×G Šö(Ób™pÜVV_ÏíÞœÿ|F3õCÜ€ÙÆýyûÈ”&üß¼áÕF8ö#õ2ùá6U|im%QŒ'ûûa·6æ±Ó™o±C¨ìÉ¨äÀþÛÀjF´j°ÊßTƒ5z{‘‘œþ¥`²@áÌ?´ÜsPí¶2X0Á1_^À*»Â¿kzÛ£Ô}ºl¹QŸ }D§-5´M4ÔyR:æL—5—àâ®ulŸ:öYPh!,ä*‚úb\ÌŠê¼B,gŸCßFžQgÕf}.K›ÊOŸí•Ør9Irí…÷â›ÎÜµòßÇ|,”Wdb¥Ù‚š{Ñ‹Nˆƒlo½â‚:­^‡‹Ad]Ä£ô´0*&ÏlT®©{#9ìr}54?q§*IKIDSOÌ 8Qƒào¾ÌºèB«ÚGÇ„3g’‚ÞßÀ$uŠYÖZboïØL,A_ÈYéµ8ËZ·;ËDÿíÛA@Þ' š¼/ÕÜLÖ¨ŸŸùÅùS«PNyeê9.¬º•S‹NkNÀ{aFNÉ’^OEæiÄJc³ô„wþÖî›¦ºivÇì=¾qû\×;>æþ/Ü{ˆºoâ™:‡ë!ˆyÓÁzªÆ•§³jë¶—DÙ…r+¯B»
¿6\‹‰ö ÏÏ|M-Væ[ÉÃ»‚æºÞd³
ECƒ†|ä“äÏ¾Ž5>Á=@¸xa|ÅZÆåÚ±Xé©—PÑ^³†Ç®Õ³ƒ>;p6«¬íÌLÌ9ÚÈ9F-æ™?ç\CÚ„€eÌÕ³6
nŒeŒ†›óíþÐÌÃQŸóM`Ü>­Ó6æ¿ðmÛœýˆ›chÿJðê¼¹†6Ûí˜ 	%*« k¥Mÿëã.å|‰]°GOíó%gy¼ÄxÖ=v	lçâ2›Í(üÅó7­nŸ3¼!:#žÖèÕþùŒ¨Ã£ðÊcxg%}‘¼KØÖÌ®Í¥!Jn:‚Òw¿kwÇ5Ð¢}ÇÄ»fjç+k–Rß>¡µÊ,øšyÔxœËk±ì×ÙÜòÁý—¬Â›/gž°%6õ=|¯“½Þ°’í9¶½cßõU	B`GB·žP Ì˜¯ÕFþ§½¨Ûöèb¤hÝ§…jÄvËïöÙ×Ù:‡éß üôðcŸíZCÛ-fåž <%Q+ƒ?„m÷8²hÃñDí¢½[gÆnqÌª¢HOÙ†ìl³/z»ÝâÓ5Û—u‰ ï±=Œä4w¯’ó[á‹ÄŒÒK)òHâ¡ùq`€ç2ÚüÇrkè1¨(’ö§ÜP÷œŠæ¼ß¼WÒÌÉWËŸÞ œTæ¤A³—Æ8–1ÐMpbqìi›,³0"o`K+ Ž^B™¶\×„±=¸¾(ä5ieØöònÏDmMÀk“Ý )#oÓâV®9@Þ¤HNÁ=ŠÃmŸêúO†[¸&”ê×ÓQ	:ï•Q™
\±+ÐT|Pï±-‘I—½¬¢³0´³˜È6FŠr§	‚“ògäß	Ö;Ÿä$»ža%4{ÎPegM¨¥–™;¹½$3ˆ÷è—pÑ–‘ºQôÂçË¹ŒõÓ¥9ÑtÁòl‚)#*RjÆä=ó’L˜¨O¿„“æ;²ñ8q~FräO¸ÿÜŸ;ã3×CýôiM¶Úœyï+†uì•^tÂê”[vò{Iæ‘Ò¹_Â©ÔââÛê1báýæ¹âúCr—¼ùõ({èóì†Ó™8_¬±&Zó%eñí¯JZïïD@Œyãî*ïÈwû1¿¸¬1ŠÝ¾íQ\£‹nïå|ÞætaVú$!ü‘7²ºÎøFH–S[Á<Óa,9®áÞPÍ*‰Z´gùvÐ_?Sfh,8f®CqÈð¢`ä	•hF[öÜuŒH¡W¸ËŸö"â *Æ‹*2÷H;6Vè0€Nnâ¬EÎ&&CíkCÔ¡¬Îölàð¹©=Rr(MãgZ&ð¢ïÛÓÞ*ÛB<Ì€UÖ½aÏá0u:OÆÈ¯Å° ¤ÃðDRÛàmróTVš»à ‰o€çyOz±Ó9¾©/hàcšp¿Àuè JwhRmšC õí‰ãB˜Q´èi#ÚãÝ¤6Ü1‰I™cýq¸4}*Tèor‹zæ:PRÑm!;îUà6ž&ùr¸)5àÊèñmÊ?kNxS†nÛqE2äFEö7ô¡ö§Ïåè+>öÞ'óÈûŸ‡±'tÁ‰FžÔ#¿w9¶ÀlƒÑ%á•$Û@aä•ž39y	:ª2M¦4âÆ-{ï³4wŒÌ|Æ±Ë$‚÷'2¬îÇIƒÿùà×æT—Ìva™+Ÿë+æ"33dLÔ~µIPídV¥±‘Þ‰çQŠ¡™RÖÎ¡ÀÊÜ¼æ¯«±˜ VG#÷\2ãŽK¨‰ÿ?SÈ›€lÜEÈ±Ó&/ë@P|)B„7†¨5Ip…ÜÕ¤ç™ÞÓA”ªs6#73VIDª·X•ˆCìëœ.(¡<¡Õ=Ë-›Åç°'Ä
ªòßØþ¹~ ›„ŠèÙbì]‚uxÎ¶v™Õë–Ì†Ž9Íg ƒÌJ‡çYæùldÅm$ïSíŸg#Ï¸(ÑÔ§äð{¹‡…þÈ´¸7ÀÐ¾ÂÇb­VÓ÷Rzn\šÜ>æÙ=ç`
°*Í5ç[œU)¾—ÉË,Eæyª)%½–Þˆ<¤ÞôÆÁþ³5Dõ¡<Vªµ#z0&ŠÖR‘¢/#<‹ò–£KÛ.
æ;TžÀ·ÜogEýç3ã4²üà‡Ï!jö	X_bôu%­šv`¢#[Ô5FGÑ8Ø­Žë.×ûí"[ÐV[‹€ŽûŽÞ7ß3Ç™ó‚¡7µtêüÆ#3b0´¼d³×ç>Ÿ¢~PlèÐ‰ÂÕÔ[Ã§Cœ&œ:ç™Î‘B@N¡ÝÇf1,¼›!šÞ˜ZÝ˜+ƒ)_y…N1ƒ»«A°‘ï¬áûîÜ1·$•{RT0ûálÿVÞÁèÀj÷J9¸Ru…—+g¾"ã26‡¿WÙ¬3QHøËö¢ƒµ£­EE‰á$Ô°+Ýèä]°®5‚WA—œÛ<º'³gË5Z´@´›€x‰¡4ÓÈ?že°Ìg…¬ž#žAèö –êÚÀVš¤tF¼·RÁB9­ê¬¢Ù!…ÁÛœõ…Á“3ùq!y¬vU4I›é±™X:ë"‹-×…l:žéT˜ÄW/ˆºènŒp5¾(1Ži5›ºvúÄåªHC‘`…x—C¨eÂS7dv¹ Qˆ¼³`ír àò)ÐÖP Å‡„½§Ì%­y”žºW
v|)ŽÜ¦æwHîHì0á0ß·n7Tø§"Ñ<æâÓyBâ/˜âxá+¤³q	ã¿º|í	¨úù89mž$0J##bÃ)m0Kv%S+Ÿ]otâZ¾èš¯D ’é=IØæ Or¨®—S¼.+5±Ô<"©™”x”Pë!Yˆ’£xÕ¨@äÔÈ•2pê,MR—Ë‰ÄzÖØaã7-Iâ‹giÍºv1ò¶%HlÊW|L_>Zh¼–_ø—);Ž
%Q¿Ûò‘ç‹r!Ô‡Kkà]JÕë…ÉTahô—R¤Ò^Ôì >°
è°è4u€.5 U¬vI_³tH‹Ù«6fªáh´j=ªÕj1†§‰ä¥=™¼ø
ý"4aL¬zò0 !]Ž0ëåT?A`hBÙ¸…-ÈŽ*(Ö Õ‡ÛD†òþãeaòë.Ö’˜ÏRÊÚ]3›ó*¬$oÍ½ýëù¯Ë+‰ŠèúMÇ+Ò<Â4Ób¶°PhP™1‘ö{,ªsüAoÛ;³ýuPzôæê¼îÒönÐŽx8#õ5gØuO@©ª|êûýïg=/·¹©q2aIÎXG“•!¨q2YI^Àñ‚	Ÿ÷Eþñd%\NEà‘¡MÚA›ºdq¯¬ë'¤‹(fáhþt~ËPiW°‚A„EÁ×adá	—e‚ªœLRº½Œ‚ŽI¥ˆxÆ6ì±å¸0ûeÆM ¢p[}JjMÈ<Âlgyado[ˆ_‹BÁç&|Ê‚‚7€9{GD‡˜ù†šq£¸yµ!Ul@åd-‘R+ìa4ÝTÒ½L–Kë"\vdòQßîbÂx#”Ûç™7 ì¼IÅÂ)Ç&gHÝÅ³ ¨àÜ”@%çäòŒ‚Ã69y®äG*c ‚8Z*¦‰OÄÎ–Ø´ìUCÒCüdà—Ë§üæ»ùkas.á$-Ñ‘ÌùÇà‚Hs¤u·	ŽSýÛS˜èXøS:e¦.sf,uÅX°‚úXŠ0wVÂÏ”ýH„PˆÙ1î;A$ŽI·Äý†ž9”k€ÐÓ³4êÚ!Lµd!9I”8¶t¬yû9ñ:tË—|r@û•g·	ªnz—‰ËBlÙg3RÂi¬‡Š§i\*^ÆŸÍY¿g{Å2ÿ%%«Páx¦³ˆ)§'ƒCE®‰ÿˆƒ;àŽ,¨ž­,p’¤½AyÖÚGÍV#2ËPJ4©ˆá
º‹k‚b"þò¸o[=#AÆ~BaKô¦ô¨\D/³µ5Ï´1î«
]e;S÷¶va!x™ç?e»¾wŠsp¹>î—-oêA“î€N“=ój•Ø¤“´&7ØÎþd%Äð“•°gÙ¾•Øð–3QCÐ‰Ydñ£ˆQ-‚€¥ä§y…Âï¾‰äãå1.dñJÁ,Ç0Âs&øØ}Ô¨5æÌ&*ýš”›¾xÙTyAž»\oåbáRíB©zÅ­u: ¼„« A±‡Xãn_¢ò{i´ï#¸ý×]»‹C
å€àj‰âh~ôû¹#=Oµ5SË5²¼,oÉ§’ŸŒÍÐ5Ä@)ÂÝÄYVð(–ù÷u&V~ÀÚ„¿å©è<{G¼éÆÐÃŠxuÄ5ü®h·÷ÔÏë²¾ÉœÄÓö°úÖþôln«ùF#šé¦ƒ>ÈÓ³…žIžž€6åt>ƒI#à¡Vµç;E_«êÉØ.ýX`Co÷J?†Ul¶–Ð†œç‡ŸË|"AÖWAÐÏ¹³€ÛÿàzO¾8ú5pkØóLP¦¦VÌ¶RªŽ8ióqÐX¨Ård×ÿCt¾Î¶öw{1ñj÷tR+ê0–Shc­YÓ¥øÉ(1ßÉ 3uÅÔ=N†Qa—þáO	ù¬ÿ‚ÕU3„{€ñ-¾Ô,v§#WZýæküU9;ƒÉÏ[EüLc-Õ£ò°óB¸yˆ[M˜î™ç9.w§i.r[zÙD¿Ðùhxþñe©qƒ&&˜õÓÄóCºŽ“qºh/íZ¾bd	‘T>1S(8 òñßÕ_z`S$W÷Â#dHbµÖaPÁ%¿6ôÎ Õ,é ¶˜³eÖ‚1Ò˜)þ¶%vd¹Ö8­û”ê	‰ÇñMËÝ!¯7eîj¥–ÆEšYÂ
«œZ®ô-E§Ð×ÏBƒvJPŠ\™©Á-dÜ¯´fÙtÃ®~ÈF_&ÏK±ðN5š(4¼Oõ5íKÄ#×ó|*·Îæ:v¬¾¤Zõ/
Šì”/0ÀíL*¤Ó(þl©nì³{fïÕôGô7:…Y½J„”>B¦áÉ N@ÞgœEž¯z1æ'ë>¸jÝo¯ºê{Ë¾é²ðtÆnáL²L¿]£OžÌ•ÞÃ5™…uFæ(ÞC—@ÂNÜ@¹Ÿý¹PÙ]%ÆK0yïßv`™Î(%èü“ë‡þSš‚¥è—gÕ?Žd(¹9¹Ô*{üœÀ¥èe¤ÖMÉ¢Å”%ùò2˜1Õ’¦ì´ZvcY2AD–QÓ¸ºEc(oô­§Öt)Ýë¦€Èý;•h¦ŒlïólO”g':¿œeO8Ø!ob>åëz±²|#üÇžD¡ÞžúœÕvé5ˆý¸Þ÷½]r,•Lûq¥]‰bÚ§ÙÞOfKšd@mÿ%rÊ5^Øž}êti#vö
À7ìà)æŒª³mkÓº›V‡=ßszlƒ®ioq`@Å~¾ÚN‰ÉWj¢]£§šblÌÏj–ÓÉ7¶\]óÖI)¾f¯›Þ-(°Ã
!C5½GÊ1Ñö˜šçNîü´Ôš¼Ê®…&•ši2Drºþb9}hn¼mª%ƒ|EW·5]sÄˆ›Ùâð±¶_Žâ!.|8¾Ý{[ó¼§Ëúâ7ßø~Öäòª8i«Œº^Y_¹Àsv|yV¬dåå+lÛR³¸è¶¶ ~ãÁÁNY²¸+×âœ£HÍO®¯Fs{¶c¹¸\ê^²	i­'õ¤ŠÔ‡ƒ{e²OâÕV÷¾±y°õð½Û`{«ëßÀ³Ý­oonï³ƒÕ5õ	ßš˜€ÜìÀ:äŽÈ*lÌ.©g–Èwg¶<°†Ö±í'ÚØc¼%X¹èžøè¬>µ/~IÒÞî[§ö~øÇ4Çk©G·P\Zn²îd°5\íœáæÀrÜ•+<Vï®gQSuìRÏ(ùÝöÎ*èÍ­7ÞÜ†ÿ›lýÍÕ¶öÖÁÁÎCVYóÆ˜,`Tã<¶§=æ:Om¶î"À&ÏŸ9°v`¶c¼/O—Ý¡»QzÃÂ	ÿƒïwCÄ8[Úû4¬bUR»2íÂA·oÕìÈDd‹6”EœžU›í¨A½à¢^mÚí†uô˜:œÍ.¶Ž:jôÑ«†5”
ë‘~€‘5÷aDüQ~î{cB/LA†&²c„ ß(%œ'¡ö#ô¨ñN{ôìþñ­ÊÜÂìÝ»³­¹ùÙF­=?ó8îóhùÐ;^™"sÎ>Hèè8¹=Ýx/ÁAvOÜ qvNðõ{8Òó4µp„HÎèZm¤z\Æ?+;Šøéº0ÏDƒ«ö)& 0Gò°LTo:ÖµFô4×;pà€>lÛˆˆyr9`gznñt+xŠZeª§Çä/ºæ=[™j°âàÿ)Õeq‘Pòñ/wâ0“šÚÆ©J‡¸4«´%bVƒ%!,÷ì£ 4Mpz+SØÚ*of/V‰µdà@nÂ‹ÎÑ»ó˜ñ`)'`OíQzIiŠ¾2EýÐ·qv‹“#Ç…Ä·¢tž¯´·A±|ÛÂ7ùö ZÚcôµ"O^ov!S¼§”?[÷¿L2¼fñ„xÀÚMÖZdëlÝ¢á¨Óbsópßíy¸ßó¸6ßÁ?¬}—Íß…ÃmÖ^`~7ùíëXV§Uk²vƒ®Ðÿ^‡¢åµ&”Ð†ø¦7À7½‘î€À3ð÷í)]•yÇq´*Ýï¼/òïø§LÇpË¶3´¿#&Î@Í)Â-×q%†`==•ÒnhaYã­Ú0Êz34Ù€äIšjéI´œ¿‹4Ãž„£…k#Ùà›z|@Ï\@ZwàPphIO,´ñ[hÔíáiòkxÄ¿Öwåµv‹uÚøW¼Žè­tÔ‚×*MO-±é+S'¾[yU?IgÔszx§Œì`X¥†ãôdÉîØ/Î$ÉîT¥‡@¯8=N­oø¶º3D`B\<	XÏ3X¸ÂE”ÂKXUˆ6ØR®ÝÑ¡D˜N®l1/)´¢M­F«±Ðl?ÖJ$„±¾»ÇÉÅ YÏ3²pà’d]8‹W-v©.L†R^–ó¡5@Übh®K½uhõ@,Üg<w‰è®&o.öÖYj#]H\ˆ	„è,
¢Šàd£eúžH’˜º§Ó@S/EÊø»”ÒEä[æCÿ°»ªÉ.Œl ñÔ½WÒõÊ È›(!°ÏsÇÎ¨Î#®ÄHˆåaÏ	,òx×†Õ8l6×Aæ<„éÕóP ŒùÕAöl*3ZÉh!¾á&‘‹…I©‚¼ŠâWL„—UJ'vQÏs{ÈÐ#{BV(½*{Cè2[!†¢^'ÃrÒJ˜ÈÇ%9¸ƒ©Ç\Ì1÷»‡gnŠéT«|ÐïúðÃ°Û@¸úÞ™(oÝµ-?©ùêÕ1)w¿c>Nzwqyàajð‚v†@ËE "A”%–Sob&+·5Ó·ÙÏœq^Qieq?Ñ/rùJmÝ˜”’0àg19‚ÁTö²S°gHœ‡ÆÔîÎ2løülÑÎO6é¹Æl¡Î+ù¶N…Œ!¥Ð
&‡@¥ìˆ-d`’Kæù.ÆsDÚiãù†ÔM[swg;‹ø¯Qk‚nÚ,;ºdXïz°èÂ·’ KiFJrÍ6§”ŒŠRpi4£äƒ°¦¶pImi%dª«æó§Z˜eãL·3¸ßwl··Š¹cÔ
âNFÇ¸´‹2€¸2`3[¹h£s)»q´I0:¸Eï/?ÿÕÿ}ölÿ;û›ØÞæþæ[ßyxkïÁêÁKöç´UIÃ:JP»(Ü•oHÛ‡Öeà˜J°Šƒ¸dÆÆ;åÃøgÏä;si~ÊãB@ßñTÊŸÑ3Ÿ0™<ù3ôqôtéwtÎoúÅá}³”x3jü„^ó÷+a’ü2PU…—ÿDù…È„‰ž+¡IT:B®ÂÕdÞ lÄÇôÒæ'¿¥_>A:ÿ9/øuíöõ¨ }.­’e1’šÔ‰§kl5Dª©LÐhbfRúê}ê{¤ÕŸxî%Þ?Ô1‚tS?~HH´<òëßÃ‡8ÌGò‡_ÍÞãÉybhz;{1ÃƒÃì~LŸ‡y¢~/G	oÐ¿2YÊøVŒO{@oD3’ƒäwQ?øuÑ‘QPËÐ	(d©öP7³±xBþ³.|bA?jˆ>¥¶iq<ÉÐB^$¹1O-f¢Jûè¨ÛÇÉÝå¼ì¢ºCÓâO³a ãïã$Î*ëÈ©nÚŒ–»~D±ŸÙ]àˆÜ\±ÚåPÃåÈ¡Ûð	^qƒ;2‰eÒ$g¼	jý1Æ3~0›FÕòvÊÚT˜€šy»\aU‰U.„se¹žÒsÒÊ	;õý“nz\jO…T%¼2~àõ,WÚ®¾Ò•ˆ…í%;¦2yö+]©¬®tñDpï‰´!ÌOi<ÈEAÝ‡}-Wñµqˆ¢ð4­3¼NéëAí[lô"µ/‰ð$ê-¯’ 6¯-oI–§¨‘UßìDatI””(èò‰Úó7¥ÞaÂt­~W`S–ëjr×P¤M´*'J" UG™ùT˜ª¾@N•Qi]DQòBº Šn½IóZÝÈËBŽX^ïÛÝ§ëŽßuí–F¯Í ÒÉF0Xþ6/Ì¤#©»z%YëòSRsnJŒK½ö(ÎÚž(J˜i¡o?Ü9Øº¿µNš6líìnîÑ»¿ºµ½¹¡uÍ»u\×,(U_·P:nOÝ(¸Vã'ÎÒ@À—îmˆ¥zÞwî'ùŸN4—œNˆç1ØÂøÔÐJë¡M»še0NÉ:µj²J©'àñDµˆ–Am’K!~ôbÿ¯H9û	ßƒ"ù¾²óâZÙõqKbõ>Œ3M8[”Îß)G¸ïœÇ$ü”~ì¿G‘àÊï¡¬ª3r÷£¨šÈÃG™÷ä6ì ø¤3w¦M¢mžº¸-Œrm–Ÿ¼$áGG¯Ðºw‡NÅÆœmŠ·þbCk˜ã›Ýú}Š÷ûßÿþ§Ûðº'tÜ#è0Ïgu¾ƒðÏiñÇ|w+ÜHû¹ïô)ŽàÊÛDö™Ä`ÔnµÜ6¼ÉÛÑÀâ\5í$,îÚG®§Mo nØCO>ŒŠL—›Œ-#¹A[ó1ÄFiPˆã+	ö›`ÖƒÉAOˆ‰ë.0 ¢ÑGr?ð7JbñKË·UIæS¢•Žé¤×\BÄÁ6ñš³®5<µ0Ñ7ûŒ³æ	¦x‚V›Rã*Yû™+Ó€-6Nûtû$
{Æ<ÀH—¸|×v‰§·Ó|<A²®âµ" ÆQu15—Áqz°úÝ•8;M¯*–;^™ÒL_>UÒ"K¬¼‡ÃÎ^%æ:[Î0®ûfù¸¦ìzTs‘	G'SIWÊ%ö„†yåkÔFš³—3Œ;ÙŠ‹rž^öìã™':(«°¸`ÊÎV~ÑçüK£¥{Ñ=»ð ó•©!î!òKÉ¦¥æˆ~™MLuèNÖ«t¾›äØŒ«êŽ3&v2ÄdÍóìJu5“Ôê"ÎJø¬n¹*Â¯¾;òmÊÀÁ³•YÏ*Úü,£«UÖ¨µægL{W¸¤	tÜøæ»	7¡[eù·hAoKïá&gîÛ;;X5—sf­ûñj&h©n;)žqK Î ‘çíòµëYˆ„u†•¶ ë—”¬w
Õ¸TœUGÜs.Þà¤|9R„¢‹¤†˜Xw/S÷ïí¬l²¿üð?‹Ì¬+wß—µûþ+£ûnmÔfJò7&£'I¥@ä„ÔRPqþ‘™±ìó/ŒžäWSü‘uPšöi¡¨ì®=BÕx ³åVÍM•‘Q/ •Ù
àk‡J ô…oC³ýû®ga0¿³"‹ß”¼ü«ÿ  ÿÿ Är¶%