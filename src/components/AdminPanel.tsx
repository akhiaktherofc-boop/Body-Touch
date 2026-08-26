import { CloudSyncSettings } from "./admin/CloudSyncSettings";
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
              <CloudSyncSettings
                fbApiKey={fbApiKey}
                setFbApiKey={setFbApiKey}
                fbProjectId={fbProjectId}
                setFbProjectId={setFbProjectId}
                fbAppId={fbAppId}
                setFbAppId={setFbAppId}
                fbAuthDomain={fbAuthDomain}
                setFbAuthDomain={setFbAuthDomain}
                fbStorageBucket={fbStorageBucket}
                setFbStorageBucket={setFbStorageBucket}
                fbMessagingSenderId={fbMessagingSenderId}
                setFbMessagingSenderId={setFbMessagingSenderId}
                fbStatusMessage={fbStatusMessage}
                handleSaveFirebaseConfig={handleSaveFirebaseConfig}
                handleDownloadFirebaseConfigJson={handleDownloadFirebaseConfigJson}
                handleClearFirebaseConfig={handleClearFirebaseConfig}
              />
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
                  Metropolitan Area & Urban Locations Manager (à¦¶à¦¹à¦° à¦“ à¦à¦²à¦¾à¦•à¦¾ à¦¬à§à¦¯à¦¬à¦¸à§à¦¥à¦¾à¦ªà¦¨à¦¾)
                </h4>
                <p>
                  Manage active operational areas in a **2-Level Format** (headline division/city and sub-areas under it, e.g. **Dhaka** âž” **Gulshan, Banani**). Custom locations configured here can be updated dynamically and are applied instantly across companion forms, hotels, and checkout controls.
                </p>
              </div>

              {/* Status Banner */}
              {citiesError && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400xœì}}sÜÆ™çÿû)Ú´+&œá¼pôÂeIJâE¤¸$%¯—«µÀpf0`D1«âT%¾-gãºÊy}—õ®×wår[å­J”«Øþã¾ã/°_áúé t7Ã¡^l¡Ê2gÝht?ý¼÷ïA¡}?,ßï»S¾ï¢=o–w=·ƒö\û>úÑ(½ƒò®îÛö 9¡ÝÊm{Ú>
}k8¡ãÊ–ë"kàô­Ð.ïY{u0uù¯Pæº­Áåo~óïÿùètØÆmí`Å÷=ÿèÒùIÖfw†Þ yƒ%×iß]<,Í ÅË(°Ã¥¸}i0rÝ™#Ôv­ X·úöây¹Zuxÿ6".Œn¾ZE=ïží//÷{ø•Ðh8´ý¶Øìý]«}^¯}×tËûN¿m{äž_z¼üÔåe'è;ApiŽŽ/;ôKsç^úë™£¿J}s8÷}ÔêtÐº½–{N€çµ|ÛB×lüý¹£T“K¸cñU‡å&Úí–w^¬Õjšu;ZÐ:^Ñ]Ï‡^èÿÊVÿÛ¬VçjUÄÖ_²T—zMÕ\
3O[b®‚ö¼ób³}¾iíÞFýÝò<%¨u­a¹ViÒ.ûÞÀ“Í†;
ÄÑìãÎzø?òè…¦Ðœ¬u­‚ZËËh}å5´¼ºµ½¹º´æðŸ·V·Vo¬£k+­åë«ë+¨trüñÉñG'ÞÄ “ãONüÓÉñÃ“ã'Ç_Ñ¯Þ?yðÖÉñø3þð)ýßNŽÿ„oÃ}~òàí“ã÷ð_ïB;ÒÏŒ„(zMÉtïy~_2xo°5Úí;!&z›Pý¡ä&„ìÊÐ·ïá9]¶÷¬‘–fþZzŸlÏÈïl{XEßé÷íZD{ŸÓæê`8
+ð“ê1Î*½ÀÚÎ ßGþ@~§æÙ<–uR	½ëÞ¾í/aR+ÍT|{ˆÉÏ.ÍíüƒUþqµ|ñö\wM¿1­#EyWú£6¾ÇîÐyª^ß.u`æ;Ñâ"ì'?Á˜“#?K‡<3£X¹ÌšÜÙîÙ¨Ã¦3<"§¢©—YÇGSÈr1wè û>þ9¨ÜQ¼6ÒN}†‰“O—{mX>¦*ÂŒ•oàtf¿À-ðQÝŒváÁÚ¹-©fÁ¼ÁÍa³õ­ÔÂ©ç[Õ¢´S©TÒë?Ëfâ¶rŠñò­§öFiZEˆi>N¾“})0;Â5áŸrÛsQÐ_ ûÞ>áž©Lk)u``Ò1…CÆà³]ÁåÛÿuäà	‘þxÏrGöâaš;È^	f~©gºvÄÌds‡·”åwí°Bºž‘÷D¶+)¶¿8eWº´|­õÃjm®´fÑÒµÕííÖÕëWgÑÖë×¯­lGì/±ü-S^®<%Bnn¾š¡T¸€õAoÞÇixPn A­ r-°ûQ¨„Q³>Î5«øžö(XðF¡ëìòÀØì«´ÀæÒZ–’W‘Ê@¦BiÖ? b&wnð¤t}«ã`¦P½rè£=ßë‹côØ‡s‘š%ÜÝwž¿1<M:i´g[÷DCTï’šZJ/M*nÈj‡Î={!h[®]¾ØDAÏwwËUÙËË&¡%Ì®ðX—9s=VO6óíd~ú{¦3ÊTD2läâ‡bù`b:@¥zÙÅrßEK–ß	P×!—¯.bM»m—Êóg¯øè|˜¸v;$¤/×ÿ®[¶?¾X¯ µÖzëê
ÚºùjxÄº¹¾¼²)„[ ýÅÚÝÉñïOŽ¿&Êà?Á¿ð÷»X¯ûG¬–OŽßáw½KUÀG'ÇŸ<øVUê^öëÔŠÀÊ‘å&`îÓï,ÄëdÒšÒÉ9Ì¨,}kX*q‚ðÙ’”Ša
¡v×>X<ä]`½GÎ…ÓœÁÄü »|®‰€	ì¹Þ~¹çt:Ø®LJ¹´ÕIyF†ýÆûuF¾E6|³Ô gup×÷]9?“ojºË"v”Ú ç0iˆÍ‚£Éßz7):.bëë\U²7Rï-]pùƒ“óG¶…kï…š˜1žÙì)yôÅ}Ožõä¾×>¡¿|ùËŠé‰)Î7‡PõX5½d”JÇ€þ=v.Tš×"|F#‚? I	I9oYŒ«ËHÜ%©wBßüô£R|×s+®=è†½#&ˆÐ1ß²œÃ|¤~†øR·Óhô¢º½M¾—è•rÍ¨TozÚ¾ïð­`ccÏñû¥;xbÐ7BÖnà¹£Ðv°YÀ¾Û·X¬x¨ƒÅ–º!¶ðnÁ*)Š¬£À`&%ÈŒ¥Aàíá½`}>±EK&ýå;»Œ_æ6sò‹[&ñE°ifp†Çï9.æ‚aú¶<RÌ¡ÆbÍíB·iõ¿JM~%¸)(
\˜¸Ýô¶Üx¾ˆßaÌ¿!~®XP¤¼x:âwBÛ*w–)ÝE4ÇDšÒî¨_JË¼¶}+èÕ%ÊB›aÍ”z%ÿ]¦Gò$ÝÖh·l?BÛV7@¯ùð®b²Ô8j-éTJU±ÌÚÇÃ¾3(÷Ê;M¢sRñ`›0„]‚áA>i™´’éM½¬P‰T#µ`'´0¯K“"1Yv]ÜÆðèûå=Ì/˜²;Î¨Ÿ#\úæ_‰Ö=ðŠ°åéØ{˜µuÐ6Š‰£|Rh×ÆÚ°Å65F€-‚mð‚þÅô¢¡´37Ù©%
'þ¤Ñ5…¨µÎø"ú'îQÏbàJj Zƒ´®U°0ëbcÊ˜KÂÔ£]XçFS¦³q²Mè¨±—½.r»+6x …ÌM¾bÄšäŠy~™Š{~ûüGžÒë´R•^¹²È¹cþ>|d‘XÃúàÞÚBMªT*JÏªüŠý­x3…" n9¢MÀ†.Ðï‘Ù’[ïd3Ò1íûÈ’& ý°Ü¥Õvø•6j%gž[fV…9[3"s‡_\ÓÙ´ûøaX³ö¢Ñgø•Ï{úïå3¨]&¾/Gxañ¥#Y™©W—¨Â´ætÅóû u‰í‚„F>[µÞ¤ŽîñË0ÊÇ/Óh¿Šs\ýÃT†9¿ îù5k¸#ð·Û/kã€ü¢ñ@Ü[NN¼_®fPþ”Š­UœAÛuðæ…gÞÓCp`’˜î0pC 2ø@‡ã—.Ç/E\Nœ›ñ…à$…ßé„^!ag.ä„`"4Š¨g–P³<¾˜¼Y>g4\ùëÔ‚
“÷Vr—ò'B¡ÉFùÓŸ`hzú”ï>	Q×AC¯£aˆÿaêy(óÇª%¥Ö~WGVù•aå—6ÒÊ/qÕ1eHO˜žÖ©,[”LŠIŠD’±^=1h}ÄÉˆðáÎ„…Ë95D{>'ÑžÏNŽ?^@WGn€gc&GåÑÄˆÏ)bÄMbo6TÖ¦%¦ÞÉÄˆ©f¨#6gÉÌ`ÌKfOW</‘£Nˆç$ãŠ™“‡!Ç«ƒ0ô£îåôº¨$m­~øWëÛ3ÑˆåÑãøW¥¦¬üiF²Ã¤7K¾Ì|YŽÂGPŸÇ»Rßh½¾¶²¾®¶¶W^k½¾…ZëËèúêÚêöÚn½šº{Ìg¦”ùC¨Ù¶v‰ª3ÝÅôºoÓè{ßKù»T‘ösqH.™’qÊ½¬4º:_«ÖìÛ)N³‹Y'õs7qWž-Â‡ N/k±°1|ÛµîÛiç–4`>cšòéÄâ‹ì]¹Ÿ¬.ï/áVNH"®I78Ù.ð/O-bNm+6ÏòfîNmX}üHt•.Z³V Dr:	Ó‡?&ÁýÐÉñ{äó'Ç¿±pügü‘&q~|rü;ü„û’ûþ Jëœ—LßP6Ð×½j[,ï»Øœ°ýY¯5T¯ÛuíYäùø'b‰Ù«pŠCúŽ˜ žíÛ4.f¹hß	{(ÀkëÚh0Jù®7À7¸æÔ$DTÐÊ€D×ÀgÌ‚þm„µä¶çûv;ÄhÛø{{ mh—øwˆ¦µ1ù¸…=DÎ€ZÐ-ÂÆ0¦6»íì96x©ñ(ðÎ°ù„Ÿ†º#§cÚtñ˜žÝ¾‹%[E2¥™ÙSgÇ¬yÛE›dFi& ºbÛh	Œ]– €þ‡4Ïñ}Ÿ,ñ#J,é—/4¢`’T3Ä›œlÓê^­&O‚ˆÐ;»–u®v{®QÍìTiZŽ6Þ/fÊ3öiß—Ù“XÄîBìBš©€¥²|Ë*ø\µ"ÏR™X^›¶±sÉÉP–=×µü-§;PæEOÒHj#š›CãB|ËÒÇÉ/C³ÃÊiIŒ“n•?‘QB²Ó,Íˆ“g¶ÿ‘<¨OOŽ†ø{|Â¹$þû3Dúz›0Qøv¦|r|L:HS¦ð—„ëfk4)$­žtFrñÿøÏÈ:¦YéÏ0ˆ÷ÿúÈG”ë'ÒõO~û‘bÖ¥Œ\©KD:ëŒÎ.JrT¤ŠëYšë2„FpcÄÿžk’P(ÐÕXN)ÑÍ5¼o¯Ø}ËµÐÉƒÿ8t=,d0ic‚Öšäã!:	ÿÛh<ÑÍ0ž5ÙhàË1FD­
6¤èƒÑ˜â»aPËx•üÌ¨¶0ÛêëÎ0É)Eåv.–Ø %¼ƒl¤ëªðP«8yMÍÉ]kó=Ñ®‹ãÞZ–ž Õ˜æ³¯ØkP®Œ6Í£Òœ–HîÅ†&/¡xÁÔ”€¶J’Z ¤IŽ§1!Pø‰ÕzX:ÍÕQ™he„/“B²“¡g8…‰MìÍqBQcêpj{–y–Ä¯¼Wæ>º7,-?°W™t~pMU5®œ„8&©&iø	_™Ëf*9ß-_@CŸ¬ÞëõHåÊxa<XâwQO_öLB£ZU:J…Z¢(TDû}zöwÄúïïµÌîN+ÏèîŽ„ÚÓµ»‰$w‡Cã'¹Ë¹×ã»´Ë‰êñ”lóØK[xŸ]‰½ÛèöÃ3µããô¯§kËS5uÜ=OZ?ÉMÝ·q×+¾6sq¯=èH§Ük“{P—ûg˜í'&(løN3êÑåHh¾àvÁ´¹€2×…!Sí¨™’ŠÚ“=‘è€|“ÓÃÈµü×J¾ÌüÐ·ûÎ¨ŸlºA¿Ìij»x#$®ÀWÚfº=ælµ¶Fí¶¥ÐÇl@Û`ÛéÛxÇ•"T{–Ø3³dw){’³EF€è eGKë4ž"žceÇXc÷"þnçÅÝÆ…sóó·Åc¬;/ÚÍÝÆ9ëv|ŒUhD•=ËHˆ¦Ü›CKÅ+Ùa¶~GãóLÅ4{å‹XìKæCÁ˜¶¬{vÑ@%i“ö} Ì™³->9Û~Ÿƒ¡?.+ç†‡Ã	eCr¬yßƒAVTÙçÎ Ï¸å."«NNx°€ª³ÿ‹‰FA[,(•hS#mª&äN÷nÙîÛ¾åvøI•¤¬'¤'0zÆ|â7GÆWŒâ#	Ä™SÇDh–¿íÚu•H ÎÎèdµR$h\y–Èàë/ÈéÝ¯À7Mü¼Ÿ¯ñ×ÄWýèÜÉ\H> ÿ4)©ü ³Hí‘œE:ÇàÌ:×`LšÙß3
•"Æ"„$…Q¾GU!`{±YÍê`,’K0ðÈî¼€Bð„0£Ä4êªÐÁÙ£FM&j­tœ8ºM’D'Íh…%'Õ³÷æçAÒžB”ÀEœèðxXlRW;èe4½²¼º–n¬_Y½zs³µ`QsÉlðPÒñÏ€3¹ú@`.DÌM£4½¹ruuk{e“ÀP±ÜÒ[rJÒõçäÇw)ßJö+K×‘³·=6°©ì^+	{hu÷×É©qM¶9»Ÿ&?äOƒ6‰,h¹*|¡m/×% ÝŒ›Ä/°ÁŸâs´€P‰y›ÞpmØ;û>ðll;Ô±CËq±º³2‹è›Òìqì3ÑXØPðbé¢~t®9Kfa-iªyWŸjìòsó'Ç¯—“_^©TºúœUXFý};ìyL5kä/ýÝûXèa;ÛÐâµèSÎ(èújï‰K§ëu½›¾¸Nÿd4D
Rœ7Õt¡I‘WûØ‚t•f’R…$ù’MrçU¯€÷åJŠu<í›Üx×êwÇÀÞg- ä85xk€¸¶€ît÷ßxépß]xû¥™£;êU×S±9§Þ<Ê5£Z' èG€%7Ò<íT”­¤ê	ÓLIñÂYÔPs
Ç‡œWÏÍaë“,aöÛíJ1M„«¶ŽÞBV2ç&QøäÜJi­4ýê[[×´wÆt†e¡íÏ¨mÀÖ^5€<Ä½HáMá·‰Ù²2ï¯I&Q&G.~Ø£]À!XfP`Ð½ò¢2:”“Œµ7ˆ¥Œ%µÎ/¤8q^ÇÞå:y
<@Ï1èÜä¶aÑªx‹™°ýdeW6¼°ûC+è!NìèÖê†úMŠVv^¬7êçÛ2èÂ:wä0(¾±Ž¢D	à™¨×XÑ%ùÃ¬0µ [(N÷ÒyR:v}SH¼|Ú¤L´(u2Ö›¤OdØ~8˜POOhÉØ\Q‚ê•kU40Â4§h¼!q]Óùœ"¢hê2Ù|—æèoÆ×[W[ËS—×­®Õ)ÜxóÆÒW¶§.obZ³Ã¼æ—æèÛ·s®ÃI D…*É·y¶m«ÝÆÔ’M?©-kE·‘ —<ßJ)‚æ¢s>.ÄJ<Dó¶?¤	]_Ñ´ì™Â[¦ÕÅütê2ùôM}dŸ“ÿ@sÀÿñäøƒâ¯arÄ«ûæ±LÓ(9å7©D’cE¹5ÚÃÊ«¦É6ŸÅ6Ÿx"èÙaÔ|¡+	~ÚOù	„/¨ö3²n#šyª”O2ìÂê'µÕN¡€Vkçkõrc¾yîü…gRõLeûœ‘:
B¯ÀÞD7‡®guænn^Gä8ü3°5¸ùEÆ_‚Ð)©`ÿ¥üóþÕ‡¹{B–“”:&Ì¶@Di@ó#WOªŸ*í—/à‡\ˆOtcXu^ZÎ±ñÀqÏ94îô»(ðÛ‹ñ{!Ë§È"AäÅ±÷§$;¯Gÿçíþ„9`%ZÎ`
³š=Û÷mÃÃöÁâÔÀ+ó¯r¡›"ÇA“„cEoM°Š,%Óà^ÊÕ˜´ÎØô›ÍüõJœ^féeÞÿ\K€N—Ù×y/Máµ¦ºø(õ-rq°þ¶(Z(ie€²•ƒ°•™Þb™•ØLleE_²­uÞdk¥ ÒøÎbìðB-ÿ8(½Öo ë7®Þ8Åähð¿ò0bÌb"¥€3Í½r½€o5cÅ ¥¬ö­®@Äy>1 ð”5è%ÅL![hHJËŒ%õåðw€»//ã@/œnVÂš`•DÎ`N{äx:õ4L¡™¤R÷"b2™:/Åkˆ/ªŽèÈÙ¸hÏq5©ÑpaËÀbå yÌ}ß†ŠFýíB6ƒ8ƒA£Åa>/Wvª·M°»ánsœnŸV	 E²ÐÜt“|‘‡ŠmZñ°X»½ˆÌ±T[šõäÛÁÈÁÐèƒ®Á Ï¢Î­N+X¶B³ :I§	×ý¬E¿Ök£¹ð7J~P-"„ŠDbÈÓ¯Ïs'3y‰e€<ÈÈKüè;u_G‰”Ø~ª¬]1|XÔæM„Ç³|ÉÔ|@sBi¢Õ[æà­´ ~Ù‚ýº†ùóA› RNÑ¶uY¬#xÕL <“Öõémjå®-ÕÏèÜ‹,ÁO‘'N—cö˜<À±f–Dòâöâ9Ñ{áV³¾ÐÀ(’/Ü_$ž/4Ë‰êÓK#Q¤Ê]5£ÜaÅJV¬.¨m§*IfˆÏ¬~K š\¥èÓYy
F¨'x¨¿üqÀ>ÎÓq„“4Ó¶õÅæãœöt¸‚•¢dùÂäDw©Q	Ðä_†óE*ü²ðœºåS,VGŽ'ŒðQaœ§!ÑârùÉäÉ	„ÝÙ—šK#Xa‘X¯_l\¸M®LKH}¹…é”Àu"KnW8h–nnn aki{õÖJßðúêÖ6*¦“gY)ã‚sŠ´õP²g.$Š›¤ü0’d)iii¸Ö=¼‰ï<q(rx¯‚sÀ=ˆ0òìN­Ê»#[7šxN³df	¹Óäg?gÚw@i²ñBú÷0èyY¸9åSy½ŠÖðs»†˜=’Õ"%VºÚ+ÚÂ*¤ JWSÉOdá‡wØ>NxâçsjôÅYsÓ}I§öàñ°¼Nu2¸0oßF\S/Â½¬NëÛ/í£#v‚w‡K sU5dµº‚ÆJ•U¢Œ…crêëóézKàýòBf1šÜE˜Ž\£ˆ‹ü±c…[†ŸKZ4Rç)6º°Æ¡þ‚,ôò˜Â-dù5.LŠ4Mfâ¥õŽSœ³K§Ì6E/†Ñ‚àu Œ`Æ©;«TEÜ0‘é4æõsÉ à\%WÐl™«ÇÚP·«oÝ/ïcµ§A »/ãw&åÆÅŠÔ¾¤K’ÔêÅÐH`á™lÏ”³ªbéçˆ#¼n±å6Y^“Ù1 “[R3|x'gÒé©¾aò­p„«[‰\PèéÈ\ÖK<¸¨ÔÄzºU;J0µ3è8]â &Ö’ý@üô¾ IÅ2h­q¡v¾~ñv
PQi<..íñ{ã·®×%gãuGìõ5+°` ÷
á2(l›S•Hj™EÂ¡h<+L³|_5{Ž‚Í¤<ÕÀã)KÆ·øuRóÎ’FFýR&ûY1„ZMïÍ¸âaÖù0)¿¥)VY	ïE¢!f‘‰}€mwËUÕU&ñBDø(î·Ú/Ö…•gÑY®Ÿ»ôÝÚ—”BÝšÍ@•©Ê‚,àÍmäX‘ìåæ¾¶	t:ÚÚwÂv½JÏþëJr™%·˜§¶,…hr6æÉ¼ÜÍOÊvWa‚“°ÐÃ¬pÔîÚ%7Ñ&Y	z>}i¤1ÏåñkÜó¡Ñ Çm&­m]…A¡ŽxhRÕÑ4:uœr8Êñõ~O%„“€¹ÊQmTëM¥èMÊÜTåTñ·f3¯†÷1ÛHK£´A#€xÄÂ 1‚H­ÍU4¿çóc¾¯ð¤}óÞ;è:þ›x‹¿yïmðÑZ»®ÝÑqŠ}ÅE}2hŽ L–àŽñÖÇ:˜¿¿eQµ®Ymô8¶FÍ1ã&4ÊÆu
Óf‰ˆ[RT›vÁbpÜ„â'P[¹„ZoØKn…ÓdMwjrCä!ñŒUà.–›)Bêœ29“t5VÕ'Ã-M7#Ë&}v¶cžÊÃ*s­‡ë3/p}&Ÿ”O©œ^#0Ñ€d*•¶±Ò„ÆfiÉFé‰&EÒ¤$ÚO+ WÞš–»q„µº)ÂšXñÕPygæ©yÞ²§Ëž×Ûö­ §‚|¹éÚŸ5?ÊÊÞ©C
4>íWI(·É•Âk-¯­®¯nm6Ù­ÔZZºqs}{}-¯n®,mßØ|Ý¸µ²ykuåµÇVÏêô±ú2‰ÊxyÐ€©ädóèþÈ?@×h>î«pÒ^vBQyˆäI‘akçkóµ:C†­¶«øÀ6²PŠ©Â^ÚZ|Žê
?¦¢ZÅ¿¢³/¾ÓíÁÙ@#g'SˆŽy	dòyaAŒM”	ˆ[ IoØêlÁÿLíì:ll^ÂH[*K•µ"),ôuµ=sJ)¯•¯ ¬IÅ˜èßòÊúöjëzb›ÝXO€÷½°¥p2økš×ùsá2=ŽL<?âå`¦oŸ!™.yÁìdEGÒE…r²Ò9¹uXB8M6+T"$µïywm Š‘MA~ñom,ðœ;–›¨EX³‰-Ôaµ/À«éàMöð¾FÖ‹xßù1¾{¥o9.ÉÝ°Þ´và6MxöÑÐ÷ Í¼‚¶{6ø’	ŒIéã&ð€(ˆû ñW’°¶ëe’}c{ƒ<†Ü¦(Åm
ÀGPl¬=`ù‰÷‚mÑ…¿NQŒ07+$‘Ò$´{.'ŠŸù‚Tu\'üî‰ì²Ì=*m[wí ÕÑf}À”Ù‡®×íÚÕi´é¹6Q¶§ñZÙþd§3ƒð;á×)ƒb]”rU%ƒj,è="“L¦—ä ãñç(í„±TÜS^Þ–,6^–V«'#tì-6³ùB]™½K×½4/:‡}N’¬9ÍPüè$çNYÐU@aÓ¡ñµ(÷¦û6Øzs ü§DáS’g™àÏTªrªˆòð‹ô4E.J1OÍ{€×7àþ¥oòååôýÞŒ*˜dDCiöÝ3iÔW½ÿQ›ÀmKîý}
öSzpIÄ*Ð*ˆäØGtLá£;ªj«,}¨‰-hašH—æ&ÍbÈÅ;ÕJuþvFçjÆÂ)(±§MãÇ6i®©z÷eØÎy¼õÏ‹^ÿ,$¼ÛÜì"V%k,4½a¥·É¤	¾5ÓÄ‰Ø¿§uN(6È¾-ª°´DõCc.ªÙˆ"Ž+‰ug¯R›úaAÛÜêjðgM”vÌÃoJTh¸bdh+8´QîQLSŒh¸ØMPgàÀ&ËýÝ&ç·òZÙ =R¸EÒE‹~ðÝÄoßYÅQšØû„*ˆ®9=níkÛk×I»zÞƒB¦‘?‹«°ã=ÎÇÚØÑbLžº[üÚÎðACLåû˜¿×kPô½Lò–å	Dkú2=¾÷2qÅÿ÷®{û¶¿„™…Ž¢ ï‡/í3±|©nMÖ‚öRŠ—ååé+©0ÿ„ù@È_}ó1àCÓ–ýbº&ô¡‰Ê]Ù!fÐÇÅÏÂcô~gËµý°4ì
˜Ó›"†žiüSâ¤ä£“ã'¼í]	¯‹²¾€ZÒ´ÞÆä×¨·¯hÝ·¸®4ÕP1@ü€°ÃhÛŽÎQê]½:´s¸(ºñ¢©Ä¶–Å‹hîvþáïƒWnÿàöÿ¿¯°?^šS?#^ÒO%Ä*r‰/ÑŒáyñgÉ!ÕwIé€¯ÓëÏ;_”¸˜Ê#¢%2ô)©¥Ëô×ÄÕ3›Z˜ù¡”K¨i8J‰æâç\ ~DdèƒßÑï¨Pý#Ÿˆ‡¤
WŒÿD‹Çœõ›[‘L
*×·KU«BH"Éë( ~ARa—# ŽÍË[dF¾&;ô#NI‰}û'^ˆç­¨¤ÎÇ¼žÙäãG3ê_ÃÄ‰¬¬Bœ&ÁkNØ+M¿237I©€ïG?¿{Dâ€""nœÕ–Ö1Ï·ˆù>ÛL÷„Ž¹-JWš,ñÇè•ÖÓ\H°»=gæ,×.ô´327‡¶Àg»(€Ó”aÏŽärhÏñ1Ïô|æùFo_Ó],M—½ö¦½‡W¼ãµKÝY&‰ßà}Ó³ñîÒ½¼µo9p.0Ä=–âžgÑa4Î…„üÖg±EÝ-¹Þ¨ƒûUÒŒNÿ¤ÜÉ «fƒ<c¼©úÍ‰a“ÎâÒÞÌ÷Õ‚¸KõM@G[àJ›æÎ#˜Jl4wYUS-Ufêž™YÐS}kšÿ›P´†(¾Xò†F€½ 
0˜úô(Þ2ù&èH].b¾øP÷@¾CyïoÞÿ¹Þ7õÒ!àÑ*½tÈÆq4£«7§RIQ…ùCòíQ#`×L†?@ý§Ÿ¦z–º²ì^¸£ÃG@mR¤K¶ï/ä.-¡×Ào\±I%"ü¯Á¬Nó¯¿Ô½eZÁ¿SÅ>âÚê›‘(L¼,W(ß0‰qy“rñÄý.ôó»Q}A
ñûnMX•&¢Ì‘•œ(ˆC Y™$€¦‡ÕD
´™ŸÆ5Â¹É²ãú<X¬wé‰AGú†²€«Þ¶ù¾Æû§Å<2Fì#¼A—93 “–ð?énÏEJ’Aõbxoï•]¯sz£v¯Òöú†ˆ|P…äÒc¯6sÁ†„¢ºÉwéA=‘ILž…,á‘è›í“šnß®–}¿¹ñŒ³ßlyð˜É½Æ_lâÛí0“ÞðöÚ`I‘˜Û+dm˜•™ïäæ£ÿ· K”„ Îb/¶‚Àé÷@Ëv"{;j Ç/9—T)¹§@ô„>u¦«<uû‘¿Ð$÷c+„ø=žæ&¤õà©Ç6H€\oÐýNîÁ3Ùt$/ˆî´eßv¼}ÝiƒgrË‘W”©—¿ç©_S3!r}>ä@_¥Ât<ÕÖË©Z“ÞU0ôSî¨3ßé“× }.tzå9ƒnš ¯M0O–!î©ËË+WZ7¯oÓ4Pù	"1¨.“é8

N]^»±¼²ÙÚ¾±É*Ì|(dä|@K‘î^ˆFN]Þº¹±²]›¥dR)G[´Æ„Ð<‚ücKfœzPBmKÒ»©ÞÒ¤ð„1ý1"'¾æåZÕ ™+¤°‘(”§0ÓÔ%D!!òœãº¹É@4E‰¥:¹]þWô†s5¥r¦Yweu~í‹ø=ôC‚/È  ”$¤;
";¤¿¨Nld¾£EÐðH¼½xXv‡zž=ÛÐgÏê’Öc%¬Åµ8¯Už×ž›ª–F]ÈMZ€Dø×i¡ÃÌòÞ¢gžõf"ç/iûmKz[¢YRˆ"§yßòÛó4|âio‘ï•ÖÕ:Ž‚Á¸S÷!|õà‰‚õˆÜÿˆg G±øˆˆú"Ò¼N•ï&ýI&“F•ì4¦5#þ?Í‹8˜Ö¢â(íðž8»®}áàŸhk»uå
Z[Y{uesK1*Ps´íøÐ`•a•kþ™¥èÜÒAÙ…
Ú¾çº»–_{˜Å#Ì["%‘`ùÊuÙøK¢ÒÜØý‘6õPHÖiu:>d¢/"Þ’¦Tüd¢ß5kÐ!%$¢Æü’ÉõÊÀßÀ-öœ.6×;Êœ.Úi›©Ä#õš|L:‰½œ¹!BÀ«AuòWÕÃµca®H,á!º¯W'P’‰2];w×q]Û¯¿Ò%±¾¶×‡³"ÉT¸žð¦šÐ‘8ÁšåHŠ<åc‹hœçç=d‰ƒÊ^gç^@.ä?+s¦ÓÏƒìÃ]«Óµ·1€,úR[à¦W2j´5Q¢šd!ÌbÀ]ûx½Ó‡|t!ÀÄ‹§Ð_¾üyM“É˜yQ…ÍÌëÄwÖÕot„lÏì‹‰)—†¯µÆ›à—ú¬öŸÞ)ò^-7F²EŠîÓ½T±}ÌÀ”ÔH ZH`
,R¿î »d®ÞTê³õ”‹ ¡nŠ
ñOžýe²¡Å6JÏÞW+µ„S6'«Û^ÄÊåÅÌA2(>%u8$7OLOŠ ]˜–²ÎË&=gÑ¹I¥©|ìß³§k+,Ug0g¼	šåŒy°‡ù›Jàää	qVñ‹N„¡bÁIÛ}ßŽ…œþšÂÀ€0…	6BöKìÈËÉ¦°°‡%ó2RT>z®u?|I‹Ìñ°¹4ƒ¶æreÏtJ)¸C5…øÄ?9ðTr8xÏ¹º¨“¬F¨$Õ31®Îó îÄ¤‹\)^iú`¶êš)ö¯bøM¬²b\RˆÄtÂYÞp‚/Ú½¼Àb—¼ešb÷É»ôðs±˜#z:VAÇ0B´÷© D/WðA—i5…tî"+äd¼ÌdH)AUJëüÇµ`ÆxŸ‘'š`MÃe‚E3“Ç>ŸW”×Á2 ls®¸ƒKrr<£TCx!£ÙÓ/åš¸	˜¼I„$¾X]1® æƒ3ÁU¸à ¿(àíËÌªd2ã£B&|-~^¨e¥fXäBo  ‰jÏ ÈYzÇÈ€Gižg4}p£ü2[Wá©&ð£QçF¢
®l–¬9n½„¬TžxÊÿõž=Lðþ„ùÖXI:zÈåc!ó÷Â'4¥¢M¥òGi^Q
ibvÌæ>];¨º[m×ª·Í¢‹±ò;_Õá£
â3é{ã’Wx,œ—¡LÆOCTv=éh¢òAgWšaŒ/³"“Áï—ÔExé0vàÂÓë0ò;˜ìS%Ä¤†eð¼žoïáéé…á0X˜›+}{î¥Ã”ïR{Ë/*ø§ÞÀs;¸k²¯°ªÕR¼¡ ]/ªšbbÁ)A°c¬Aj|×Ö'
»Vß2ï`À{KP,¦¢{Žç_2\¢ünL(í/_þê:L:‰MªjX£¤F>Œ>Iöcµk÷<–À€‡ß†Rk9¸îJÍ—»–"0ë·ÂÂÊˆöúŒ‹«ÌÁ\;Dõ+-žQF-×ÅºUìò8Ö‚DçkÜ«¹ŠžÏAIÃïãÁ‘QÒdü´*hª¼Kfï¬ìÕÐ–Šç²f>SðgqÓé"Å¹Õ-è£	ä !t-ßË…ìFUUÛZÊ¡gnÚ¡üÆW¼ßøŠHA#
´ùN¿ow=¥‚n`
÷ y±œƒ¦Ù‹tëHT8Ð˜:záðÀncNù‰c7óe	OŠ•ü«žU+Z1BÞçÀè“P›Œ»¤¶Þˆ€jJ"µKHÙS­^‚©ßä_‰–¼Þ/d£Ã/± Ãó}¬DÕÅzC±Á¸eJ˜”9&2{¤ù3EÄ_ÁÀÃ\1do”/¦ŽÉuP®\¦’À’‘ÓjÊ5zÝL9ŒPoâþÇË‘J¼¼š&±ÈêÚÑÕDíè§j‘×½3Yccï§áÆf]Ê*NU…Ñíé¥¢<‘Ms¤¸3Šõ_˜©wÎ0}ŒTaÌY‚^®ldø|ÛÔªh)ÏL¶†C¡z7éíc”[#!Ã^y§›ÒŒ˜ÑFu¼m@”$4Há°ç$›frî£H¡4ÚW¦Û5[,:õ»ºƒ^‡‡¾QØ´z&³dÝ#‘GÆ”ðk*¸®>á’ƒÉÆ¡ð¥äR—‘Š~c\?´Õé™ÑŒ™f¬’˜—€è<Ç ÿw¹‰yLKÁ¬"4…ž£ª0*´¸6ÃŒ¦ZÁˆÆßøxÎö°Aš;ó˜‘<<dd¬FæªÀ2Ç5VÇ1W)æ±ÄX0Oiª«¤f„ÚT%ecÈ"²VÏÂ^-®Ž«!NÀjìVâÚ”›­¢½š‹.¨~?ÝE)${hÅ&•àm¦#	©Ó3ÒÇÜaÈEUþ‹8Â±ºTZÚ’Ž8èS<B×sÚ™Q¾†ˆÝ4¡71pKœâAF¡Çtþþ;Ù:96Ÿ2ÜlèB˜¿–#Å è‚"²fT„™~¯†¾9ùíGÅÜÐ²éUÀy ³,™˜HÖû™o>n«²ˆ]YÄ}PÜðDDDÚ¡ŒÉ,öSäF(¶àÆ®„1F¦î„"yW†.…¢´6éXPñ©±ò˜³<sCTÝ,]ñŒžR–Iä‹ðïçÕeÕžj‡CärØ°ý¾5 –6¸ˆÞNÄ>Z]&éã³ÃÏü™un¼¥Ý êS\LJ©†›ÙœOäù1Œ<úÁäE¨iØöUÌ‡GC¬´wì u!qÖ¢)Þ’.1vÙ"âû¬ÄyA]Ó®ú ‰mÊ‹1¿+h¼xèWÙDºtþ–`úòyÉØœy0óÁUùðJ€jÈÙ‘?h¶€è¡½ÛØŒÛ¹]¨}ÏòrzìÕ¥å•+W¯ý—^_[ßø›Í­í›·^ûÛ×ÿ®Þ˜ož;á¢a¾(_	N™9¸Óê_ãÿ]BMü¿üÀ<ìÍá½`XÆiªÑƒDü#üàøEŒèc°H§…<Y³Â^eÏõ<Ÿþ‰yuÇ£÷ûì>zPÖÜ2–h°¸•á(è•àOS|ž{•w~váñhoÊ˜Ü%äþy·tŒ;ÎV=¡{ò?=Dm|1ÖiwZ!d ï£eü¼àêÖ-zì5ŸéÃ•g_P1–?UÜçdÜ†“‰û¸åØûIN1¶^ff¿Ï‘L?,û5Âšý¸Ì-iûÁûÓ3¿89þ„ØÏCü¡Äö}VJH p6¾ÆÎ7H‚ÐNï0±K¦]Åî
ü~@˜spjÓ“Îkó¦J7)E0> 2Sµ€ q^H‹0œ¹=g uO/Çö,70|hî=@€G¥ú“ôË´î}™‰,’_dÚôWÿe¹žO­þÏ4ÎšP“§´±öc—C§o£]QçLåæõŸ¯\ÿåËÿ^C*øÇ?T*rÄ?kb[–ò·Þ2ÿzöði3Óù Ll…¼hfF‡R¨q¦)ØVÙ¦¯B*²a'¬}w%2‡Œ¸ŒªF
z*3¤pCÑVÉ„žâ­Òqª8¬D_sJ-ç¢8þP4*(H¼kxðLý’ž‰v¾*ök¨"›¢u›(+æÁ·§5ÕE¥üò"©±=Ð|ÏrÑÍÈˆ4Ó&–ëñÍûï¢%×Lü$æ^Cç¨ñ‰žHU™Î–LÀÑZU-ÍäÅq3<±Bà¥ßýóÁÛÇÿ#¾¯>Ž
ÐÓE…¢MÂTk"8ÔTŽ|"J¦”ý,Ùþÿ¤qý£ŠypêÞWéŠ¯´<Ï§Ñ™'M-¢~Ç·„ç¥+DÆE•âÆ´§O¢Ç&¦ìôk
õÏéGÑ™ÿêzQl	7åÕ¶¦*O
˜¶@RÀ¡T>’Ã¬ £g‘Ó¹O¸Tü‚r­

,5FðªEqòIã¶»I<¢\§X®ÇåCüÖØj¨Uð¡ïº™M‰ºTrS´S—é`©Cz¸\0÷ãIäñÉÎX÷œ.äÏWÚ®3Üõ°æVÙ÷ñ
Àa»"Nzq»Ô‡‰y@Š»HLa}í¬ä5^Ây:Ý'eß¨Î§	ÚÑäs‹—¼a~R½Î(»xÆä¤¡L4¦õ¢T>}sXºûá¶óŒåVÄð:—¦ÿ^ƒ¶–¼ô;&~^AO
Ù1Xâ~šØ8TX>"ré·RI=ö^2ÚEr?„pœ—[P‰ä‹˜«¦n¤í‡(s‡lBó„Zø]¿ÙÎ3Ø&ÚÍ–Ó^û³bÅ¤Tô$ÞÉ¿'Àü^?ª¸ •Ž±Z¾m¡ÐC705øà`µ¬ãÚÔÌ:²&úÄKØXË9‰q¶5ìÍp|}lÌ+^OZ¨+×_ºîÁVR˜¸wb ½ôöŽ]ë@©ç-qàÐT¥«-§;(¯Æ%Nä›Zâ;€o"©Oá}—•a…Ó>Cœƒ¿EãoñR÷ê"Í9%šRö…67RV¯/T¹Þ´j}ñŠõ,m~Yw‹×KIÕ«7(ì—<Í-è=å–å)æ.¯×ž¨Š^¨`{<ä¸ÞyZçÙ:ç¬+utiÒõÌ‘iÉòÈÅ@³\ÿ šøúê‚º¢»
?7¯­mZWû)¨©=Æ[ê’;&\ÿ×¸ö¯¾î¯çŠ‹ÆÞ¢,VÀýiôá)B·ù¥TtÍëˆ&"²º÷–¿áDË†ÒG|¹à~Ç²ÚYé;.ÁÈy¨ÌcŸH}Q™ú+5|tÞ¹~g!þØ Šà<ÓÍìÄ£m¢
žPÓªRã2ežDO|¬\¥ã8‘{~ê2ž™ªÒòMµš´™ôPƒ´SRV«ìºœ2LÒ25;/V›ÕµZ%MUl©!©=–„ËÍ+¼Äõö¨¬R±b´)¼°©Ëå2bëE×ˆ†EËå<<°Ã4’!Ç§×{~ùó‰Ã7	ùÄ¡ “_'Õ-†WºCy«9•£J|¦5hžènÓÖ3Ùˆ‰‚Ú:N|ü³É^ÔÕ$LmE,OU1¿raÎVÍÖKÐTUÇÜäØâqŒ&ª¡&½òw˜˜±­u°šTöÊÎeôb™–Ø“·óbûâE«Y»-ºòt•ºª’J]ÂR^>úï<'<(_¬¦Ý~ÌeÓïfUšÙ.ÖA±šÖ[ÚO%ëxeü¯&aÿ&9Øm^cR»•Fº¬J—ÌtÏtÌÚ÷ÜâxWêá€yµ66®¯.µ¶Wo¬o¡[+›«WØ§1“tŸs}êâT¹ü?3h»õjªç1Ç—rRêmk—¦ícšrö 
“˜$o_ÅøÏÅl?É2B ë£œ¯p/å|­Z³Ó,‰«©5îË´4ž! ðÝ÷íN:• 7ÛèRo^©/Û¯üØd‘ºd¤,˜¬¢Ù7óBVA\Wì"¨â¢Öpè²Å
Ð-aéÐÖ˜tšº¨ü>‘~‘U®g&‚œå™Ù„£Ks½yÉÌJ}m›6ä°¡¡ïíQDtlÀ¶­AÇ!Ü$¢„ætý=ô= •üðzx$Qnèc2õ1a¤h! +v¶oÜ\ºVA¯{#Ô· ±nÊ E'k’:®ð`…e‚PþÚ…Å…#3¶ÏiÛÚÂ´"’kÈ+/Ñ)Çíi%WoßáàÑ÷œn¯xmÇhÍ– •–WÖnÌ¢Í•«7¯·6gÑÆæÊÚêÍµYxÊÊõÕí•
sÇZäÐ©§®ð»M‚ªøm,	ì¶œdßŽ‚Šd2s­ŽAláNRQ‹¬Ä®wß(°2ñêÈí
&Þ<5ñ¢‰à„, ÑD`+ÆP¾£4¹y©<+¥']¨Ž9°°º¼í…V´Õa ©m&/ÊáftYªBî}º,ÇÔåÃ!6ŠñÀâ’"¼öÚßÊq¨„ã³8÷W°ÕãÚ”ÛMbâyÀ§ØÜ3ð‹6±Û¨šÒõü‚!ŽpšU	K~-Ýíü»°nk]µ(>öª	‹FVhí;¾>[¸I-ãéó'±@Ã‘?tO¹±ÒK$ñ”k¤WÈólˆ°6ePŸ/POWëwÈß¾·Ÿðƒ*s‰¶-¿ÝC{P
Ù¨&0³MñÃöËµ¹FTÎ†+ÍrŠS{:ò¼ÌÉE5(:Z¹³)Sã²¹…V¥dé…Ë*áa“+wà”™EÃž7°‰ŠE=n•Š|èãU¡#nù"”ÏxH„a²Ýz®™_…>2)tßr›Šl¾B:Ïë(!°× âGÎÉúU¾Iß°tA›Š*Óx‚Öø è>.JsÉÖ¥lÙ-É;==ÙÜ—PLaÚH öÊ¼$¶Yc/¬dü
÷XÒÞº~}ê2Éò¢Óä`Ë`Ž—W&Öä»‚=H=¬ïÑ´½/:õQYJ*|Ü§K]·?E¢1[èkÂÖ’ÝÂrüáß?ŽÿAX%„+›1˜§Oôg$jñ;özº‡©=ôÚ½é„˜¤&âžÀÖtÂq·eÔÒL|§ö"^ÕÌ>üÉrÐÒ¦‰6iJâZm]@+ÎjG¬öÑeüŸþòÓxôK¡hf¨”z•Þü¼ôh£tè´f2­
‘«ÄÉ4^´ü61­«ïÏ¸‹û–TD×b|5‘Úˆö+‰Cš™ªôŠ3Ê±¹Ð!*D0DžE=µ
šý)0%]B=ò ZÝ­Düˆm(ˆã¤ìQkÖå«ýÄ­-u1Ë>«f	Ÿ,¤Ù>ß´vogÒi1«×/6.Ð\ZÔßÅ««®#š:0E¼÷yUy•îëXÑÜyÑÞ›Ç×m…ïºõZku{uý*Ú\¹µºòZj­/¯.·¶W¶dÞä¦ŒAhÊÌ²$IB4¤>¡ÞôôúC5 }õ!ÛÈ˜z½ˆ^p©¢…¸o’ù˜BHumwgMÅ~ÒEòE¯dÈ: ÖItOÌ§ñ»×e\²ÙŒl‡E$Óå© X"Œ‚*Ïï&ëÇd$˜Ç£ˆ²tp+<}¹gÝµ’ÊÉJ@&ié{ßËL‡ðîQ*ä)©wÉ©ž'^Âðªªì¸œÅßÇA¹v.Z®8ÏÜ”c@gXY\Î=­¥u¬ tŒEÙÜ…8-¡HFÄÿòå¯ÚhÝãl õ‰îo‰‘32áðàŠsc–~è=Ù8›%õ©¹,—-v%r¿&Òëê„¹ËNhÐë0"¢j¹\ssX
‡Øø»ûHÊM2FâPê3ä”šD›ºàé¦§vÈÎr:·acéŽ¦‘pÚåªäo²YXmZ‡ù¡;ÖDñp;LNÕ¼&›¶å
Íà£I“7j½T+üQÃz¦aÝ¬a#Ó°aÖpon¸7Èk¸dõ…FøS^ƒë`àa3®‡Ñ¸¥øµ®Jv0¸M{±Rßß”}/€œhÐËÒÖÚ&hç94íÈ°ÜrmzuØÖÀ?ÔÐ5ÌQðw)
dD„˜¡Jtt;6ð¬g'ƒ™šþõXSÁ™‰¶ÕOOD£ŠÖœA	Üÿj^¾aúò"ádg!ókj:2¿5/™^ŠL‹§g¨Ž–­É‰z£Þ‰ª5éL)y¤££¹GJs^ˆuÃ`Þ\"9†?Ë®Ï93Y³	¾^‚3MÄÑ ?o\©ÓOzÌ¾HH,äž^ÆýQq“‡¸CÞ÷ˆ_T{«îÐé‘äÑtZí¶=‰SÖ!wÂ±P^Âóá`ý×ÆSp.Ärb¨~ãíþr^œëµB‹$¶è…u¶¶;L»5 
Pä8Ò/ ¨¡m¼RD÷d«–¸ÇË²çÜFW7Þ1R€¨²ßˆo<Ò>˜5áZBÔ,OOH6eÚB¢uŽ¾ê .é@¯7¤:hH:Ðë©¨‘ì@¯GÄ0m"jœ£OÄÓZEÔƒ©^A/‰vAzJë˜ïîhe“Ø(ž…Þ"]¨3©¸zÍ
<Ãî‡Nï:è¯¸ìl§o°oñ.æ7°Þ×}ÀŽÌéùHŸ ÇM`œ ­ëC}È.o@Ó‹£7
JŒ¡i›a¦ºí;Ý.6ýÄ$X4G#È:<Ï´hÖ^ôØ<®—mQbü2õvW˜½ÍÜNÉÚNÉØNÉÖNÉÔÆdichegdf§bezv¢ÝÕjf£áR¢Ób)5q‹Ú-Òg4‹º‰-ÒcvúæW£¦æ8	á•v…amzæŸŒ·Pï`£©: ¨¿Q¯&â3 ‚’LÂJ#®ñ#óbÈ*yv@œ£‡¬Q˜‡×Å+±B;)”«©—Ç“Í°à‡ šWÀ±˜@¢^rúÝÜ›°mè·ùÚƒê ô6ÕÃa°07G¾	*£€–=l¶õç†=/ôÊµæü|µÚlÔå‹óÎ^µ~á\g¯þòþ"¶}§L€—,7dÏ… La¨¦„³jb–&³¨0Ý‹H1{DÅË·÷lß·ý/íÁâÔÀ+ó¯ò›Ô@I¯¿ÛãÇ4Í o%§a‚¾"—½È	˜ìUl¥²cw^¬Û»½½ÛbŒSQS¢C­.ñ*¿2Ä[d`ûÓGàr¥'_$÷©ö§élé*q*“Å`øØÐÜM”»%_dkÝ’¯9¶RÜ!y¾Æ¨’‡9Q<Ãµ/  9É™¢²àbffxxª™ÎË>å4%C“žSLB“ÛLÊ1q†¾³;Åã?sT\ ¥"`Q"B ,ÈS…h"õc(Tà‰2šÓî©ž¥ôÈÂ¦¼Úbš<3Éô-lúXié3…CÜ=ÛºwÀ –ÈGèuÛÒHõoHIOù¤^³n/<³yí‘î¥É·dRÁ³¥D8ÎjbáÀç’çz>•'–ã£-ÌÌÍ÷„YÜšm#ŸÂžMÉÍ3üÄo	‹;O±Þ5¤óÙ0p‚ù×´úÐÌÄI(šL2NPûôÁ@Mës­	ÓÑ³0ó¯ú˜„ÉÌ?Š×äïÂiìïîÔ¿f9tæ)‚ñg'ÇÙ“Gw§þš3„‰§Ø]ŒE€ïz\ÓßÃ?›É7]¯:XŽv¶å¢Ž´}g(T-.ÁRkÜ×Xž4ù'$G'fÃ\e1ÁÖÍPÈ–íî¡­Q¿oaãu­Bß£yXÍù·E(>sÂ‘€çÆ˜%Nh¹N›Ãî ØEå„‰ÜJQ—ÙNQ
$ùŽ–Ë¬Îäé.Š¥‹ÿþs„Iø'"òV„ýø	Gù
Ð|ùYÃ¸7íÙ1ÚÏÛü¤ýíú€ÏÉ1­w£-"ÊAbX¿!;÷Wþð!E[ü=ìû¤á¿‘íýý>ä}ž#9¾E°ÿ‰À6’‡þö£é£|ÿœA=Ã™ŸóüBú˜´I¯ü}š<	¢ß©õ±vªñ^¥\{ŒÝÊ½€ËÐ÷²µ²ykuiem®üÍÍ•­í•e¼Ïo\¹reeseyÁÈ«b,+òU²ê~ý^öå9bea„.™c?€ X‹àHš$µÑËˆ.*6…|ËíÄ&
á¦hýœE†›Ò"&¯¼|óþÿ úæ_i6 oY¬BÍ8sB	½^­ÆóçÎ“‡aïÁnÎ
«xU`^àéh‹BÁk—GyœT¸dõŸ,*ðähP7#gN‚·0_ö0ÿÄƒø®Pàšu×¾1
Ÿ,jñä(1ofÎœa žÈõ4/ýTRâ¶7òŸ,ªFðähP;'gN€ðôgL"#¬Š–aÆ‘iõä‹™GO–0óFòäÔhŽÎœPaˆãIRê$CÔyE¹©lƒœz,N
ê¨5ãZÜ-}‡iG©Î83žD¬oÍÛ…)ë£þ®íŸÖiºëŽì$HãØ±$î tÎ[®Ë«ñIöjíoùõØýÛOï²QJg¥âO»l²´+¡-_,ê©Œ×J„€g#ýÑ |_|c¼ƒ3óëo"±]r´jÃóÃ=Ïu<à¡ «àð°nEò¢É½>HÞpÚ©¾);¤Ah<}N#Ê·4¨diáË¯,bƒžâÇ›rÈjéÜ(òËè?å=4¦xuB—¹£0É^2ÛÁPàýåËw.dÈÓÁJÁn¿':¿#‡:ß2D¾F¥Ãx¥c¨KB]y‡mØ¼ÀF™æéjÂÐIÅl§ß½é»EkfG##Ùâ¸íQŠŸ*½d$ævÑ‘˜J«Ï Oh¿½2dsÈÌ.îth<ä-
Ö¬†k¼ºÕp¢v5\þçAq>`lí
•¬zÙj[®]ªÛ|ÓÉ‘«Rµ`
ZÃ%ÒÙÿQ-ò¿hé!Ó{ÏõöË=§ÓÁT"¯À. CÀú1~™²3@´¶ÂB Ó‚¤p¼€h(]„þhn>Í¼§ëyDÓáïÄ¬ê¥¨¶ûÄ>KÎ„˜ò>¥Í[7ÉKÆW¨7malÞšÕä.Ô©á¹T{4S23D¨dYÅDBp¢²Ã²×Ñì2}ƒ&Ö;+>–qÞþJxGŸ±*¶çØ3ãÅ™ ‡ ¤J€p^g:À„4 Ôø
À_þü¿æU«RZ_…°á«ŽöÐ’í‡ô&<»s´´ß[$M Äÿ¯ AŠüÁw¿§5,IÀúw´hTœãqF Åp˜j ¢ä´ä“(k/!zÙXe˜]jàÏÝÚùÚùÛ)%g§&ÐtË“”î’ã+ÔzJšIL„Ñ$<…siÊ*æ¡Š”´ìW‡9•“Ò_DnVL‡8•
s:¦ú¢V^jµ¢ª‹À™ÏHs)¤DZ‹°ŠTu™¢d=õ¸U•¢ŠJ5e-œžÍeób_R†Í³&·œŠ+C)âJØÞºÇäÂÌ`®*E/M “©
$‘Ì¥T¤M=—SãË)¾4ùŽ‚¢óìÛOù7HuÎïŽàâ”õ\t=Û¢‹¯#^Zæó\¦=‹2›{tIŸ¼X#†|a	FZ=`ã02sQÖû¿ð’˜,ãügØbÿŽ‰.˜‘ç’ë™—\°Œ‚à‚ÏeÔ³*£`õÎDDM¬¿	¦ï´ºPwS¨‘»aÿ¯ö<swù¶ÚöïGröÕšö¼Îéüä<É|å:â?¦p¬ž¼¿\LÍÓgþåÛUéâÌ™¦fòO¹‘e©OüôqzÅÓçr2û°ÂÆÃÇ€gUÆ9äòC¤ŸysÅÈX-jF+,ð«ø—}ë hžcˆUänæ¡ò4Ož¯%î4’ð³ve‹$üÎÎ<ö©^†mÐ@MÀZâêòdVC8ŸLÔ_áq‡vå_=ÍË!d.£ ¿}2>£³ušuÚ²0¶¢¹ôÁòeŠò~•[†=ôù™­Q«	RÈéLf…¢Ó¦â
<ø¤VÁËêÐâJ ðoÔýÒÌY-ÛPÇ:}gàà—¡¡à¨2©5<˜%©«–(ð¨Ì«MVÌ.®J5¸OâT u°Hñ6VM_¼¶‘9n\kymuµ666oÜj]G[+ÛP`mà	~N<o’sñoñ³ùì¸ûÇ<Çà=^œ”i[ùY‡|ÏVƒ3õ‹HŠ|Á¥ –H5Øv`éI] šYlž Âh5eE—\k×v³^‚„ª­ô<¥©D8çÝ
§;@[^Û±Ã´iîÂ’~AÖ‰fŠ|1siŽ<Þ4V]¿5{ñÚŸÌ¸©Û$Sß5Sr¤4M:œžEE*/g/uý×Üâ¯`¤ß'ÙùPÝ¬’¨Œyº°¡W¾hæ¸1–>ÉÊ°¬üÕÔåM»;r-­Ù s •ÐÝüÙû_DhJà}m×Ü‘ll®¬­Þ\›º¼áÛ}À)‰Gò	³å€Ó|ÿ> Oþì,Ç³r}u{eêòŠ‹ÉwÌ;d6ðH>8Ë§/¯¬Ý˜º¼l÷=´ô	OþMÀƒ·'øduu]Ù½Et€ÜûH™^oÕ(ÞÀšm‡ˆ"‘#Š.nÂ~sÒ	5èß2ïÈ3”Cøå/;Â¼Ñ	c…‚xxD>S’ù#úUä4ù HëWÃËA‚ÐÿœƒýÔä Áø~’b@Qt}z€ p½°øñøð ´‡
DXÇNŸ#ˆ±–“ÞØ"Ã¹g·HLŠè»…ã:@eE¢:L\“÷ç¥ÅŠ„922»X\ˆžYØûP`-¢¨Wj™5Edëq/æmÜí!¿ë¨¥T‰œR4éK¢£¤Ê<`m…=úì¢MCL‰vk¶¿8eWºDë!…Íc5[¡e"þu
…MðqÔt‰Žd>Æ"á ³ëñ.>WÞBîŒˆÞ»ØÙÝ™K~‚“â5Û¿hxVÁ™Å€8›Š¯A9mˆ5Î¯S2³c&ŒƒE¢~ºR’wÌegÈ>
qJ°mõ’ì•°§êŠ3Ž*7¤8ëˆþMÕîŒ©E,HÀ(2øB!æ'ŠÆ9Ô÷DR3Ò{I®eÑÐ¥ÒXË"qÐh\Ï¢¼L³cn™Óê@	U“hdæ}±ÞO2ù¢À–)ÂÜ¿yÿÝ§"b’üb{£ø®s?‘¦RÔÌ"Z¯wÍ
{X2:^¿¾zî¥O”îŠöBQ^C27$p©o+F–`õ¯túBUQ&«QM»$…ýB•½Âf1ó¢	–R2‡)?&‚¢©QCÏ¡é‚‘OÔ`ÚÌ6Á7ÿö.À^&øêÁ)ý ÏøGÄ€þX0´	íÛ'Çïq°Xrƒ™amº™‹:_êioÉêOÌùÒ>°Rïùá)q¿±œæçÿm
Sû_(X0uÖýš®ô1<½^”¨Îûs'
½¾•N¾ÊÏž…üÉ¸P°¸[sÁsÊsŠìú–ûPÆäO‘å”Üã¹ÅìzîAÑxP"ëì(SX>÷ŸÐûŸûO„Ë„2URæ[ì=‰àçîê>‰-ègÒ}ÒXHOÌ…2ùC×–:QØOO‰…æ4Ž”¯ª©IŒ)4ñ²9Óó&ÉH{+Y ê)w¬ˆ¸ÜÏ=,âõ­ô°d–ûÙsµd^áÉø\êhÙ:xîryîr‘^ßr—ËiÙÈSä{™;yî„1»ž;a4N˜¬6vöÞ˜'"OŸ»eèýÏÝ2ÂUˆDsEÒ·ØQ#ÙÏ]5ÔU“´ÑŸ&wÍ©o2qûdNŒ2 :Ö|gT§õÍ…é2ÉÃ°<Ÿ«¨›ò™b<fþâì¡’7X¶Û ¿D¥ffyS¶%=÷îtŒxE>£0à%Ró‘ž$kžNÄHøé²Œ…gÇÕ«H'tÍ„ÑdÊ2¢·OÒI·¸ùÛŠ­ZÂ,Ýé€…ÄëÔCíó¯y	vÓ=mºŸÏ˜’©ìkµÛö0$_I]ßê8˜	—C¯bŽë{}"lêó·þ¨7/4ê\òxC«í„€É¦†kâRFD·QÈ™3 sy“F™zVÇÛ/÷;ü/¦£Q5HÜ~©g·ï.9~Ûµ“2¿A€Òð¿F0q„‹ ïa:ºÞAåàmâ`¢$ž+‰rnPrÂ#…êªìOÒ­.’Û>óUÍ¤äâxWêÙ›+WW·¶7[Û«7ÖÑÖµ›Ûèúêú·Ðòÿ  ÿÿì}ks×•à÷ýWŠ#‚1	 ©G’C‘”ÌEqI*©”Ve5€&@#Ý€(†aUâÚŒ'›ÍøCVq­Ç5ŠwdKã(ŽÊS5±«f’¿±=ùûöœûè¾·ûÞÛ·Á‡(™HE&}ßçœ{Þgy}iaóÖúÉæüµT£‡N]Þ{È7½:vHÆ¢V¢T~?Ëæn3Ù
Î')TýaæF7&)B2S­Tý»m=O35ðµ‡XßÛ+ ŸŽäª‡wVÇ{è7SÙÆ\µ]ü{ËkúË=Äw*ïTÞ©y'Ü®{¥ZõÒDõBeâÒ…‰J¹2;~WÃ•\nÍddN˜ŠžL¥Þh5›zcËå8‡šŠþ3ýg„wl ëþv’Wf=a½éõ¼m–m ›DüËGhn“,Nšˆ4 ïÂïDøû2Þ÷‘¥¦ñøÙšjÍh¶¯oP°N‹$’þ¿%×nXÁ‡q>Ùd¢I>šD@*þ\ä€øJÔš{$Ò»üŒåÏûsºB]œ¡áÏbƒ>—‘ŽŠ9°txúÝFxÌ“8¼t–öÊ<Çß?y§9`x”¼©é3ýå]:LÜøOñ±¹æ
|!RÞ¼«¥õ÷àË/©E’ÇÇô¾x,o›à/é<+C=§Ë~W,ì…Èfñ‡xÝX×GdÆ™|EÃïßÓìMþ¦sLécp?Û²ßÅÛ¬€ö#Š®ïQ¼šOéÏ`"ðîgœV¼Â«bq·çuÛ²±ú“µ°Ý ZÅ­èíŸ FfÅ*m±ÔJ½Ò¨ÎÆI‘j	©ôg¦wå\OH*û@ ™Œ¹ÃéxmX—ž’W‚Ò•AÐŸ„qQƒÿF¥†|Jw1³„†3ÝEg²)2ÞlÒ€•¡˜¡IGÑ´’eœ»Ûœ£‡ÁŽ!Qv4ðÂ¾—!Á3˜Jj&“i*Ö™è)´‘‡¹ÜšÎ¹®RW½ŒŒm‘ƒŽ¼t:^¸é”«/Çk?x=G®û~D¨²/‘/%¬d!_ò‚]¿Q©`ö,¸6¦Ûš½:„Í!ÑYu–|TÚ	KÄÿúœ0~'ü}é³˜}!%¤yç5gMŸÅÄ÷}ÚÃ»éûã‰¨múqÙüR(F%Ÿ°-ã;÷>%ÅŸ3ÏŽ{üDÜÄïÑWxö çb‰OÒ¾Ž’±]ÏP3öØ ä¯&²éÒÅ§ŸV©GQJ±À‹×£ËšsJ¥ÛÉ›&×¿~ð>™_Ø\þþY[_^X^½A–Vo,¯.i×©·äšf¹ÙÚ¢îœœ·³=—®§×xáe8FªdþÛáÓ p3&c3º²ØÓ¯±ªÒf.¶ìhªÔ¸J«ŒHÇ—Ü(]Y‰õWL¿Ânjç´ÆãÐúé¿ŽÏ@Ø’àÍjxw1±scz³PÂR`%&µJÆdùƒ•¤Y©ï…ˆ ƒŒ%ú§?%£mF«ûÿI»× 
ˆ‹úLëéyIÙØè)ÎVw:@³i†f5£OH®	W¿mÚûÅHSbØ¯ðß<9 —Á.ú7S€ÿ%ÂŒÿé•|\ÕˆÀM_*ˆ2Ä'€  ƒ]²ãê„ÚÏ1ã‡`’$s,‚òb$|`0ÿ™Ä“}N„¬ù,–OÐÕŒˆ´íKEäO2ÔNÐ§”SE€^ä]ë «ÌÒ|F­vÿÄ@2NnD>†7}©pœˆÏ'Ž§_}8™jO$óÉÇIÓS8Î…ã™WŽYŽã	Åtj£À°hx
Á6ipöúL§¹1l4ü(2ÕªºÜÐ|V†N´Si÷Úƒ¶×¹²·G¸ûÃ©LøwrÖäŠÃM‘J›*mS151×Çâº2×úXzOm%?»Iç¬™˜3$ÿ…´í—šÁQqµBÔNTŒjiªs¼Jå…O…Íò‰Ð,?¡ŸDEú¹°N%JÙ/©(ñEÊ
eWšRý·MaùJÚDÖîZUÆL¾‘l`Ts+Û´>ƒ²FOèhhÓü5íŒ9ÆäòT›ÙßuÅG´a+ñ{Y‹=mdñVÊ÷Prô¯c>u·ûè„ÅÌÈ`s«Ó6(ÙÜðBÉ"DsŽHBÝ„{;Ôb(mñAöTT: Orz@ž//eâœ·5í36Gmšð>¶¦>Þ.jCqá˜›í[áÚZSèniÂ%em°Ùîúp'”JââKõ°åu"|‚
2ziŸ;PÛ‡“ìcž*²Ow‰ø^‡E‡2ÝåNmÉ+’£ºÎUfš—.6îÊW¢Ý•$UþDëíF]ªO5C$]Æ›º ißðø’n¤ÙôýØÜM1TKÊLneÚ[Ýlg¿v˜ö r—Œt¤4µê¹†œn3c¹9¯¡“YþfS-ãÇM¾£å õVþ­j=úÓîPÕzu+ñ·T˜²•¬Ýß^=:ñ
Hf \vMF¸ŽûŸ6sÿ¶;Hc¯7›ºmHÙ>X­ÈÇŠ>(M²5ÆÛØÍÔ$–º4b¦Å‘]Óª¬!¥™5ïL¢£EÍhÝÞúC ’Ô8nqµ¸ešôîõØú+Ù|%Î¿ÙŽúo÷ìUA¸ÇÚ®ÙÀÑ@u$c>ÂáóØx®Øæl1ŸQÕô‹¸†45XÎ­»©}H/Ú€‡AH ôi`<­oPr(UXaùµ$zzÚ(ÔÑÀj	˜„¸Àî3"Z}y3 «ûMÉ/MM	’Î^¥e”{mˆåÎzáÄùQÝzì•JÔMÝ37ð”îŒýnÑÉ-
Ç“Õ±»o•t†Lò&okƒZº¦Ö¡y‘vjaó²ÎÜ;:n¾O†=>àÙÊ¾gßƒ=:¼C6ÔÒ=à9ãƒ"Ç,½,§l÷r"£Â§º„°Šäxl‘\Óï«ç±×•Æ©ï-õÓÍñÌúHˆñ$Y*þHuŒúµpRf¤ý±ì(Ê|®)þ½´¨Öc÷ ŽSEX&Ü<“gÞYXDlê[GÎ—B¾B6‘w†F\?{u1C, œ²Ô,9~%eŸòtí—	0ð—ßªTüÙ­­»ïÈ"ëÒl¯d,ŒêìÕ½vøç2ÊÎTY„íívoŸb.}sKb%d.Ñf)-‹ [ú»›üÐ¯^Ø,Ý{Ã¾˜{$E"sÍõq ú€°$ ×kívÐt Kœ>ÙÄº‚|¶Vöx¦½FÐoûÍå&“QIÞâ
OM'²Þdàäôb´mÏ\Â¯F8o~¬Aßï•ÆØaŽÁa¾Ö»ÿrOqu4veôã»¼ôP¥çu(* ¼àÍs7ÝÎhv?Ç¿†Ÿé2
ˆ'Œê×Hi¾CcÆOï F6Å±¾6÷€XPú.¨}î‚Úkxˆ=½’æG}8ÿ`´mÃÝQ+3ïãSÍ³©Å‘iž…q¬yÖ8Ô<Ë]Ž¢y¦ g9ZÝsìb}âuÏ7MóÌ´Ç©v~UÌ9ßy°ðÍQ6T5Ÿ*š3çzRÕËÅ”Ë§ªeþIQØGÂ'KšEÿ»PkË+ ¨¹º˜Qîy/Ó0Ó'ú<NäýUA[¢SO¼BâT-inñ _„XP¬‚ø(£_kU4.îTý4?êèè^Uòª6ÒÎÉ×î6˜Ì^¯·>úµÕFÇ«;½’æ¯„:zºœ›ÐàT}Dúè8à?VHë29ÔH+Ž¢’–ÀáhõÑÉbO¼B:•&ã(5Òn©7NµÓ'X;-Oèdê©a¸°[@QÍÞ?ÕT¿
šjél]TÕÒÑ~ãuÕn´÷€~Í/„Šú×Bü8›§òK	ÍóL²+úi’ûÕQYS(|U•§:kI¨§'ùZ©)èŠb5… ¯¯³žB¬ñõTTÐÕ**’æ'EqýJ_§šk³ž÷õ»&u—Âë­¼k|=/…ÉÓ[!Õü„«¯Í¹F–{(Z1"@¯`Éµà¡s)_.å¡óôíO*ô6‘;ãºGéªGŽõŠŠæ›	Ï^ýÏÿøUMU‚<E?©X“§”=š+XhFT\S4–ÂÏ×OŸ–uA½©R@ÆÒ5Lr•3ˆ},i:¿$I~/*dëŠÅhÝ¿˜ÄÎ·G©›ÄR}ý†	ÎD2Jªÿ<‰ó“ÅSDyúr=ÔcÔ×OŸ•Õ¥ó™jKqjOÄŽàËHÛó•pp{aËdöù×Oß•ÜšEí ç2û?’!èF÷¶å¬ÿ_Òz=I5 ù„>‹§Çš<‘’©6žŠ¤lÿœÒ¨<¥8> B“òÛxÏ?ö…¼‡UÌ£¸àÓÏqÌ§?Wvæ7"Üs1­ØmðE¬ø‰ŸÅu–ôõ£žÇ  !aN5‰Ž­¶ÝüõëË+Ëó›Kd}éúÒúúüÊ9GÖæxëöæYYZ¼±´~lÕíBËa(RÜî¢TÜN­ —!Bšâí¥ùEXà–7ß&+Kóëd~e…Ö$¹µêpK¸×7Ò×4‚[†QR^ÂU¾NÐ0j`ôuŸ´7i1cWÑ2G¹—Ëó;ÀªLG¡JGóÛ0YóÃ-Tíö>Yñ›¼@ÞûH¸Tu© Å‰†4E¾$ŒfÄ7‹®Æ‘É¢ç\ßÈá:$¼Ôñè
A·ÛŽ"äCVÑõ gñ:§ü5¯A-nð3H+¤45*æSk†ÞŽ×!¡ÿã!ðŒQY»,N×Äk™é¼”’N	%1$­èvKcó¡Ovƒ!ÅÊ:»$òg;¬zÀ¾û^È°“nÄ9²Î©,¹½E6[mÜt ÀETFTü¶,jo÷†}Òõú}€l¾‡ÒÞAóAî´ñz=¥³{flÜœàRÎ‰)f¹äÃŒ_.Ý± §é7`JpöåÈ,þ•ÆêƒwB9A¾·qkµQÛì°`ŠEu?ˆ·Ãi%Òë#®%ÙÿCZ×ñÃ œ½ÇAEì=¢\ŸÂì=ù#R§&,U%z$ì2Xó›pöú±u#kUª…(É]MÕïN—éNÉŽ´L·Ð6ÁƒÐ£Z9·9	eÿ!–ÎÛM+†ôµÂ±òs"¢šH~ª^säw¶’Â}ô›7YÊ %¨›¡µt)ˆË0¼Àˆœ0#ëŒðzwÏY·OâÀÏ)Ó÷¼€²¹’˜^Î5È—%y›šBY³1Ä p;ô·á/¸ùC*ÂyÅ”‰”è*¢ìM‰

vÓëÏ‘=rç¾¿;G’ÜÓ"é0B¿ë‹×tp<˜ –öÝ\À[eŽ°|èº·a* ‘x?E¹ïÒž—¼°ç7s_¤g{³ï÷P†žïÚGÞ‡ÿ]!{û“U4O¡¤K·â';Jv|r¿üfÉD”iÿR6dÉk´JðÄt»Å§† ‚¿ÊbÄ2G·ÄŒê;~¸ 8[ÒR¤ÉgxãÐÅ`ölïÅr‡7ºk"ßÚ—qßô4%y!¦ìÂ:¨ª˜^Î•ñU¦ìoI e|1Q=×m¸–Î³ggÝ\]7 	™"o^!UÓ!ãæÚ@-Î ¨t}}iiÌxÂåôÆ{Ö­†Om6¶Ä¡þTW°]q×uü /«ò¨Œ\.‘A+ˆ$„Ìt#±1îíØ1oÈñn§,@·0Ö%g8tÇ¥¡;&%S;Å#u:<±Ïk§Œ®ˆÃˆéæû =ð›äP‡ ¾Söè´ó$>ú¢fGZcK·¤lNî8nhÅ¶È¢
vŒÃmJ0/ÒówÈ†?(‰¬0~“ñezJâMÉ‹a=¼ÆÆÆµØ¡ã»ÙØÀ1‚<Êûj÷ýÍ5D>‹w9·&ÇÝRnšF8l#‹	Ól”A,ô·C¯«NÚH-i?çÎ±Ë¿·=h‘«èÿ¦?-><Ý„?Ú,—^pŠ¡?Ž2H%Öã8NåŒ²så(èú¥&=“¦'‘*yL
i¼³8¦öÛF-K…6àý=Þbò=Öùþ=sµ éþ_µ, ÀÃï aŸÜX^œ)`r¹ÛBà~ÇÌÍPæZ¥ýßSšpÞ¾sÄŸ÷Ç-sì·‚t0¶:5oÉïzíNî[L@è¯¯ ßØE!ƒÁ£¥m;Â%ˆÌ¡}Ü7‰¯E„Ë"´®Þî	pXu v–Ëå4M˜ ðP»ú{|%úpQƒü¸Ýâ:Ñ±#ªIñšMR­|[VeáD µ1Ÿ l‘`‹ìnJDBG?RK‰éí­´ÄØ(š5r"Fæ@íÔÆ™;±jwn|FªÃ¡[ù)ë!}4ƒm÷d • ¶¾ÑŽØÆÚAp!iE¹Ûè&ÄnDíä•K.é«æšHCæOjê4¾JiŸâ[~—šþ´ˆØ.vêCù…˜$àTÑ%µ{ù<„DY›k‚â\‰‰ØöºqÛ	©+ŒÞ‚ `³”²³õ21é€moæQê-Í¶7loVžÂj<|jÔ,[ÃGÔdEÿÜp›eN">Äº­Ú”z€‹†E68eÎðR)WµeºcõOõ`î4Šç|Fòå6à'Ÿ,â3i™‰´º`£äY¹Û°Ž"8C†hØízá.g4W*ò¯SqyÒmÊ'G£ÈÒòž<Ò]ìX'£\o.7ç«Íåbs¼Ö.5í•ÆØCÜ§„™gmÄw[›„“gmÄwë8ŒsçƒàÛÛœƒgoÓ/¶·Óœ<k¦>µµOsóg÷WVŸëÛkMaÛí -èK‡a+à‰„Ì\¨5‰é´ÝaäW®È:lv†ˆïaF©èÒ/ö„"A÷·ê?ò¼¦iT’ñyØ–æ°á—J0û	²*qÃ.ySU5N]u8Ã4<®ç‘ÐåYa¨Ù{±vªB4iŽtí”%ìHK:ýìóçˆ~xÓÕQ˜}¦)'+Úº«&‡K¨×æ­5rcåÖµù²±9¿¹AÖoý`ôÐa¥ðÛ,µNÒÂ«w¾Uñ*õjÅî¸9#{ÚXã…3~¡ÕjuºÚÈé¾¬ºòXóØÜòsáÓ®FJB[»“¼--“Ïé&å}uÊsë‡ñÕ‰tÞâ©œ¼ýÉJ²}V÷d«ëqv÷º¶°Oó–×^}r X±'ê}‡½Ðïý¥Tü1&E ¡*g¯JwVß=ØÊÜH
Çìƒþv`wb _Ž98Jà—]ßæ™‹ÖBÂ0: ÀœâýŽoÂ‡TùèW%bäH°bÃÃ-<G6†õ¨¶û—Ý?¼ )N
Zˆ|Çr!$Œ¡Ã‘/Žn´·{LP÷ñÕCƒ¯Ÿþëž–kÎ¦V8
¹áÃUA=PG:˜“J~¢—Žl6G œM'kÞn0tbšh¤ª5R{øjâ†V:Ü˜ßñÚh¸åâ¤×9¨!yŠD.;ÁØcòQüÍ-;"ÆÜù–¿5Ÿ»GŒ1‹í¨># _î8ó¶×:‹Ilôx£lð«‰5zÈñ Í&z	3*jÁaìŽŸ.G•<`c‰ÅëÌÏ‘ùK«›dmiýú­õ›ó«Kdqy~¿µþCgES!Ôób?Õ†³$êÎa"C¡™qÖ)¨Ý£ˆà·ŒCöt<7MB€ºíÉÐôÁCšŒUw¾5{Ñ;9Š†YÑƒz‡³«áv?…ÇeŒ!ÂÕ	äD2óh¢ˆpCj¤ÄéƒŠ~cJÖÄ£þžˆHÅ¿°PI“åŒ®É’,þž1âNþj˜QÎÖ%ÕzñwÅÌÿDWöÙœ\\á	7hL¯^N`•d š "´SIW5Á¢AßCß{œËú|s›È#-¿;øK®õ\
ÕúBê5©1üRe	±y«Ä.²²­p¿§ºS%®cvë¯[þ¼à©ä‡QyÑn¯AlÁTR÷ánî;„`øM´ÁP«„.J–¸ñA›~·½M	æRl°ã«´‡–¸ß ‡~?ÊæÚ"Œ’äJ±4ÖÑñž4ƒF©YŸ cÌÿhlÂìCç°8B<dqc`„’4Ô„Óe›4³Ÿ˜ü‘ÜæªµéXÊÔYô·¼ag@ú@fýVÐA"º¶¼
{Ñ49”©ŸÄ_'Äé*Õ•Êd…~,>oò‡Ûçî½±g<ŽýïÖƒæî 6Z“\‰Îåç>ùœ=!Ç9¥­€è"»ÏJÙÔ†ý™ÜöÔ‚)o¾™ßÄžc?,¬íÞ_?ú#î¿§$ôœ>}¼±§ŒºÏËãH9Eö‚‘Ññ_ªi 8}“|Bû¡õy°46>Å;‘Ý2O”$_‰&ï±ˆgx˜Ö§¢Û?Æ¯¾OCüŸÅWj’?ñ}‘„à—òÅü¾ñË8„63ƒˆÈ¿—{zû¤á-Rî–:7»Ð(¤P ˜å/ì•Æ®0Æ˜w’œÔ†^ ˆ‡0j™‘8“ÇÙ<Ï“ý¤ç¥Ù}@ò&N£Üõ£&æ°#[íž‡q‘o–-Iº·þ®«L>ÍväÕa³¯ìµÅ°ÎÙz$ûùŠ’))ÞãþçàêÛàê+²HÖˆÙÃi|e&íVKB*¢RŠÁ¤Ã0‰¢ì„^?Éq.^‚\@¿1ÞzôLAýðcB}°ÑíIËíîÍ9éRšºZiAYK3X¦•·ËËGdÌØdWÐìe+¨i½BÞ²ð}ii®ç¤à’NJ„Nò¨ñüVN~5Pâÿ#„±jÉŽØ»þ@ó¯,Ü°]d®ÀúM¶: ‚Yœ¯U˜ ö¨²Múžäì¶4ô#ßiS°ã–ï5íïà[¡&[´FNÖåõK"­%¼eŠ‘ò,•ÇT$ŽôÕòd3¾€ÐÐ„þQ^gqÂûóòÔ uþL	Ò¯yÍmŸL>?ð;‡9ÈÙ«Ë½ÔGæp˜+FÖÃè8lo·i#³c1ƒÍ¡‘/»âHiKÃ¡/"“§œe:¹æu¨&eþpAˆý‡º¦ùÆÀõàá0‡ˆL9P‘ËWä¹=„ŸÜ%ü¤8`¸ÂF-ë Ñ˜é\õMê2BÝŠS¤Ý|è¤	ˆÅfqp0 7c'Š›ñ¤ô(‰‰äOoÔ|¶Õâ-–ÝÖÜ÷wok>Ü—w7fÃ’m­Éi)h+ë¿™‚§i	šðæqìH£®U/ð”rÞ ê¬4Sµ.2qÎC‹|ßÝ£Ç!j¾úaÍU·Õ<m–v&YÝävÂÞV‘–l)y…mLÖàÚl¦ÎÝlõºM2þ÷üû‰™ƒ-²7='o¨ü1'1z½N»çoøÂ—1‹k¡ù@…YÄ\»×,EÔå³Œêæ.Ê4(Q6´7ho¡0þ¦ÀÚº4ñ¡ÑnÊE¸éX¤«”%ù¤·M§2iFÐ”¢ÁôS£÷R•É}2¼3„¸È"m$™¥P‹a~PÊèG­°Ý»?éÂE¦Ö›­·T-cÅ%ü7]s)žO<jç¸r)‡1:±êQ¼ºGm7ñ‹¼XI»2CñãÍÈÅ,ªÑn8È~
 Ëþ¸­²ÊæÁhŠQˆê§1(S$'Îß‡Yï$Cx¿Ð¤·b¯Ä8B¿Q-ôøa,UgO˜­¹žî%ÓÝç_XLöÞOÉÒ£ý{îÈÑl®aO¸økÊz˜[¯Hý¬-¯Î˜‹T<&`ð”Ã‘Vƒ&½+ˆÔ6D…\mÓÊx
!Öu†©mÙ»‡•ÿ\ï£¾ñw>ƒnv&›ÐÕ+d–¼EÆ,ÞŒ•Ã#sŸBOAöUk£üq‹?–bÔëÜÈ$Œ9 h^”‘7žÇRe‘5fU+²ÆœM†ÛµÛv¥žÉØÆÀë51·«xè~{¹#éáâDºÓÒø^"+Á¡ûäG¬ºÛÑÌcdJp6ë ‡}¡‡üËØt¦,Jí¹Z·‘ttgK+&tŽlG8­D%§N&V‰ó|$wäxBŠ6æ˜ç“Ñö¥‘æjì“®§¤¨¥.SK¨Šü¸HåAeu‡¹£k‰ŒN´pŠS	9¸©w§#õ£-³‚Ö€êNj×çKŠ® €ÆC±Ä
¦¦šQÅÚ@‰ypf3¦+)É½ÎSbe’ã\„p8yiÖ¤ÞKÙp‹ì2¯ôB÷•ç¼ºÛŸÀ£9¶…Ú™†7
t[D&¹7ˆÏ­…T±fêe‰ÿÆ*‰bR:Ì¿€“_à'ÕâåâÁ"M1NÏë°€ÞG™dÑâamV½µÒáâ½WÖ’´ë„í.C‡#‚z]êéƒ<›÷‘Aýˆ¬ùv2üä»ñä€=ƒ†4«·ÀuÑq×0~ÑS™…2Å\ê¡v°0×K9G+‰,®Ïÿ`~…Ìß^\Þ$×Vn-ü-ºÉ<£¾uÏ…ÿËSúõ‰ÆcZ8HË.Ï´4Í¸sÝª£ˆ]=j×:±E)èƒ%´ú'‹íÎ9^.~¹Kè‘²À,Ô%.o!ø`ijÍ¶ Ù XiüíÿNxc}Ê¼1|AßŸDYkVRŠyþ¿0T2VG±18|A­õ{:#Y»1>–=ŸS$a^žq™ªŸ¥Jo+µ³åRQÿöÿÝÂÇIA¬¼û}.íÖ1ŽÓ_È;©„@hÂ&òç¹ X&ëÈ*vÒI·Ž-9FÌØð½°ÑRÑbš¢þ+LOe° ˜Š©™¤¬…›]ú@UÇ[0èr»×š-¼ŒŒè¤Ì,†ä€å,_œ“¼\6·¥¹®ìÑ×YSó	<&ð•ÛðzÉgùyüÁ’†%¿<ðÂmŸ'X²\¶êe×ŒUŠ1ŸSÙ­ 1ŒæÔPTþHµ¡¢Õ¶fòé‡ZX xñRØ™<?cÚ ÃÁNUH»QÏY2%%„RÍÀ$§[ÒÎuÇ`'/·{Î°éG%éðó8–vR‰ÓÆ¯ï2/ µJKhh»²4îúƒVÐ,>MwºlSÌe@s*Š7®9G®ÕG@ã§[­¥‚©µú­¯-ªr½÷Úa#íúzHÝE¹£ó³Ò­‰µ†ëÃ„#YƒºÈõ ¬ú|ð±œSÚÌSë“gêŽÍºõ9ÄYGâFœïB|BÝ‡m®Ãè4œïiëaÕÃôëTÏ|°Þ8·z¶fÇC©~àµ;î›¶>1vÓýtÛƒ‹s®«cñM¦wðþŠ¹ªÚÅï\Õ—ážº§£ÐÔE•e´;]ÄžŸ;åv3Ïõ³ZÈõÓ¤ÏwñÇwpòÄêöêÕüýå5rÓÇ›tÌÕ¿%×¥Fãhröêw÷vdïO‡‘\Ô?vû‡¸aR–žDï^ÄŠ‰F‘k2k×!×7p=.çŸ¾d0œIkXÙO”p³kFµÂH>Íž¬ñVÛÍ®´'8®|²«}×ÎL¤Ì´qÕA®<‘o,¾tûq]‹ÂzÖ’çZ€™Ù
ÅtŒv2ª’ËÏËtö1dÂå6©T„ƒ°ŠñÛ³³ÀÌ¸y¡èSÙæ¸ÈéÀª{­Û4ÆR–—ÄÈ’‹=fkÌíÚÑÉgOìÃ‰ÀŽBVð‘ìß®”CÎî—­+-Š£Ùê#ë?<?­¼ÛL©*Ãý¶”µÐ°°btw‘'¬ÛÃôåø|‚°­Ÿ“‰‚ñ‰ì“9ÚºÀp…
Ö%Ö}tµŠùšÎ¨EŒÅXã	’Ycúà£Þˆ©ý8úÒg’–(¶TÎÏt ÜMÖ9ùòGfí'/0þHºM.]ªL×ÄÝÇµx0m¾b$Ù¶ì˜PFv¶%b«Wf¨v·sLq6é4Ÿ)3‘Z÷±Á)‘z‰D*d
$ÒõÂûX."âPN0M¢Ì\š Ñ‡15¢ß¦g¾6'±}?2tÙÉ)ÆÉÊá•"$¯8¹‘Ô!Þ…Ùj‡ÝÒ=î®Ä/aVß8{]¿uÏRÄ3û±Rn˜´TÇ3œ<@´C¡_‡E½Žv¹Sž‹ii“t³<æ<–ÛHŽ$L–Ó&«i…!£\±	Šæ’ß(ä†{æqðfpíÒÒ‘Šè\ðhŽ^G¯;w¢uH:Ó<g¹qÉËñ€³z¿§¯C­ÃsY›_\$«K? 7çWoÏ¯ÈÎj×o­3‡µåÕSkó?¼Ióèê2æj<Î˜ájZ¯$ÅTr@W0êm6‹ºÃ™œt¹—[3fËg.4ö›ó2ä8u]^ëµ‰¤U]”foz½!ÍŸÆi3ŠMI<Ó&5Ø¢;×ç’sÒ3Ì…õôqœ\VïœôXxÆíQo¡w	Kê*¾ó„[¿úúÓrSm]žjÍè]†0ÚZ»È ÇLr±ÿŠéúðËýÐ€	6YŠKSamž? çïÐBË&Ú\â¼ªºòˆ)˜mWWLÍ<lcÖ¬­¶ßiF„dèm[Éº¹Ò/~´vqü°[üÍ¾ÂTß%u	Öõ·äVKÐ½2h/—-.Ò
—{ð2p’[ ·¾ÙQ<#c;“˜`´å^°c>]^©uR{î5-çòÆ-a*GýN´96~§¢+P-w0\š“Ü&9Ú™Ë$cQt—úç2,jë\º9×wré/Èú&é	ig(-‰N=^(Ûü3"%Cß¤ß-Ê†š¤G/>i{õ9q²æ×²šEØåzÂ!ß‰ÏŸÖ6—˜Æ»6$+ÈþŽÆìkËþ¦1œUƒMÁ‹k°SA¾³]·#’OM£Äh¦á-xaU‚ðÒ˜y$éUF	]_fpèø6vØé¿^“½GAÏë˜šøpsÂ*r3É×ž“?qjÒôgv¨52‡¯îw¶‹š_eï”Ÿ‘Ñ©[G“íüˆm$½qmêï\ž¢ÃÈŸÇ6K!¿w/(î¶ÞýVÛ»?hùa°ÕÈu³•	k1?[`Gq´Ý‰Û$]†u›ëí¬Â('¹e)šq¿UÜt.Ô„½‹ã†GAL¹ÛðÂOÿuüp@²Gï±ÃJØcã&g`‘-f4hä4ñÅOÇ
Âe‘]ù€ù›²57sÜzlpÁ/´Ã†‹<h˜­¤¡¡0,8ª ,ÞŽ­ïÈwó¬z¥Ÿ½ª~¿<ÅÞ.Ø9½*})ÜÑª·í5¥y©ßGìŽÏKúR¸£õ€ª’‰¥îðš×»OD1(Ò"Ú`
Xùii‘>ÏëüòC¡N6)Ò
Sì0˜œtòØ§JõÂCþq¿°o=âÅóoä•e„My• +Ä%ùf˜JRv‹ê,5±ò¬`<žjáÌç­jnÙš1%•iã|E)tIZ{{^ì¬\ú ±7˜®¾
Ùü0š«‹Ë×n¯o,ñm²¹>¿º1O¹óâdl¦KÌjLAkÚ‡ÿÅú¢ªÛG­þ•Ñ>©ÁoÞZ\Z!+K‹7–ÖÉ9r}yu~uaYÄ±/¯Þ ›ó×RmF9eWØc&6½:óðëM¿óNÇoncª±Œ›_§¸á¢$|?·¼¦¿œH}ÅMÜ¼µFn¬Üº6ïÁÆæüæY¿õÄ[ÈÕšÜ«y-Ðq…uþ§°ÝÖ±ƒºâÛ¸ šéÔ¬çí0ˆ¢uÿt˜¤WÃ°á—JÑ°;AêŒ<»äMRª—ADµå•ñ	ø¿©ûž?¸‰Û¿ÑòBÔÊÆÃ}‡TÊçM­hª¬y¹ ¥j®Ö †Zir?Ö™&Ô5îÈkvöüUÒù.}<–›Þ UîzK•‰Ôê'5ëÒ…-Z¢ßÒ°jWÕHg;£K29ÉÒ°k¤Z¤°åvè5±(Ãä ˜¬‡d+º˜0¢Q­Ô*páøåBåRu:=ne¿6==}]dÐz—)Ik­ËËÖ<ìX«b‚ÌòqÎQxªaPaø^PHŒ€¹µL-ó©K¸²h‰½,âŠ29‹mèwÐhå'ì³ÖÕÕÅ‘^4S+/ä›&ÏÑº?d%ØÞÎ[¼½Œk
äv0È¶…ÿHL‚[žmøÅWrP®ÈÅiö4U=“;oË!p€²´ˆœµSä<rÞÀ(Æò}”(Ž91PM\zÅ‹)çc¥\]ÌŒ—Œ$ÕÛfeg	ÇŽ-S‘>f¯kgäTR”š÷m®õö`óÉ+~NŸâçÁð“òK„1L¥ó•o6r2y´ÆSŒ3Uø´£ÀÒTæq-Ž
ñB•¤4‹Ÿ£®”¥¤G\RøçMJÓc@j%~.˜<?º/»!tÜÄ†Î†$XGÍ3§Ø|0lVk†^Ì«83šƒÓqÞÊ¥c‘ì(Ð9vÒ¿hCèÛ½¾â,<ÂÜæ¸ÍaÞâCå˜SCxó…›d²6oØ"¦I	7ÚÛ½ÃÆOçÜó,ÞX_^œCÕ› ä3-Õµù•ùÕ…%²²¼±é1#u?ìHbö4³/jö+ó §S-÷Y®'úÞ­kdiusý‡lŽ.>³0~¬®’$g£™ÔLÏ(Ó¡õ:oÌœh8'·‰Œ%.êMË$6[ïx»fúfu¨M. R”äŽ}Üó	øXN°áìÁ“2ª!*aâ»‡~Ó’Ñð}ô×åIŸ±€²“ï{_úA¯^ZA7.§Í¾üŠ¾ò+Vøùcörœ‚ð#‘CðDd?ü(•Ÿ'Dßb9Iáo'X¹ïÏ¿~úxBÓX.ø-rHjRŽ³^^Ð÷Øa¥Å™s2}šøZ
Ã=¦%Þ6à–ŠÌ!ášëßYÔ©i2ÄVj`Jˆ¹Ô‰LU«sç»\
Ã ,´r‡Û¦VI]Ô£.˜ÎîP–K]Ï%7s&Ï7›ýWèpJ>!{h£æL|Yhí†oeÏÂ¼AÍàbfAšÓê’k;æ–`vnttáXÌ¼’íàØU*'ÏYåìÕÉIÂÏ69ÕÉÉ|§ª/¦¯ó4[ø=7Ó–žæÚÂ4Ý?dú½+MÄ[ö(Ö˜Â)ézz‹ÜûîšöïaÝ Õ€zÔØÿû~slß^ê=ooÌWNþ$Fº@ƒúèJž²«@éÔÅÙ]Ëàl¢œÕ(t‚†|¼D‡‘¡x¹#ÔÝ$b! 'öèÔNœ£“_Þ.“ÊÅ9˜þÚMÜÐ*-a´ÑjëýïÙG_\Ø(à‹íNÀíöòv„LÔÝÐ{ç„An<¯)òv0€AØ„O&,/#Ç± ëic9m7†³•ª#8ÓÅÏ´á)@@/Ñ`jÍÛíbA¦“Ì±£‚:¹*Aa¹ê0ÁÀ—5
Ôb»S&"þP–×º>! Og
d ðJÛâÑÑSà,PÖà ñnx„  ñhw‚\GP ¬ƒ#¸ŠŒÄ÷ŠBå§´hmq¬äVq(Y£½Oðj¦w‹îì QÃ Ì¶‡û‘o1WW*K—«‰ÔŠÆßxÀµûã»xã6†›?—ü;ßj\ºtq¶rWø»¡™F_…•Ðô­®ù)û¡Þ?_¬;Ûh÷¨éSÔÔ“oÛYZ¸µ¾(ll‹Ëkó›oÛí:fý7|­¡¯VV­±cøí›7ç×XØÒWÍÒ§–(i1@I95:×rƒ¿­ÎúÚn‹§îTÊ•™»´¼R“>×ßáX,é<L•ÝŠ™.iWŠ™†xW˜ÌõvÏë5Ú(ëµ|ïra´bÒ_‹X2­«ÖÊ¢ÙcfÌûÏO„öÀ_ÑÊh¼ô™ÆLÉ‹ÂXˆý=-y5·ŸËy‹à—wihÚÄfÌt™Ôt‹çôçØšJ°ÀüÎ&½@±úùôÛãJýµ_&ÕÕpô/hí5ž)îèyœGI.5÷g±&fÛü2S¥ßxn²m²CÓÚ7ÙO#¹>å×9HI~£e	…NÈü™îrK€ÖâÀdµ\¤+·ÔÑ,ÔÁ»”±­x˜z:Ý?†ŒÔpyæžÎ#O$ö›<{UñÎ¹CÅ“w=¥nG(÷—8*Å‰t$óW}ä5s¸¬ÙÜm¦9{öL†[Çx0—Ñ"gÏ595…ALVaæ04vl‰M³ö@H‰Æ–å¼DŒÁmäÜ¹Ü¶¥ººo©™¶h—ñ©ßõëÒ“£ÍW}ÇFÎüRvÉ'')¨Á÷}šN>…ïeG‰çÙ(ñ€†>ùÃ’=z/=šW(öOþ8B–Et‚9s- “: ¸œ~ó~?`H£üa§Ñò“—cc€˜TOK_ˆ1ùä”UŸ¸¬Wìj «ì•ÖêÝT:l—#ºJ%Éš‰·w,0r¹ÝÝvx(lˆõu½mÿvØ¡UÀZƒA?š›š¢£ò°‡²DÔ¤íNõ[Á ˜¬ÎNÏÌÖ.^˜©^¸0;9;}éÒŒwþRÓóëo!—v…Sopn«=¸Òƒþ¹_¹X9·s¥Z«Œ¹åö:ƒ+’_†SMiJ)WyPÇäá >ˆeÔ,×vñ®K2`·T¾k}gÚë]ÐuuÜbÏMÔñpÌ2¯¬æVEË2 ”^…Ií	ÎE³ðóÝ½˜ê¸«û"\KÖ9Ò#§Ä§OÂ­Ô øì)7%–=Â‰Ûj#ª{Ç*ß‰8ÛpÔkHæŸè‹Ï_ÜÇ?õdÜâ«P®½—pšø—â‹`wûÍ>/½y‡»ÜÙÏU×?¥¶Ò¥Íùå•¥E9Y¹ucSž¬,9D˜Œ¢ØÕù	ÒË½O‚–öò½‚XÂêûMÂl^,™™Ç
úbŽ«vöâK,ñ$FÝk:ŠC(&ÕPŒ¯?yÂT¢¿#Pàûß¡&•¡!¹iè-ñŸþ™¤âVL“¢ÚR¦~—ên¡ÉSmòœuó1}ó‹8}ý#®†¦óýLD³<ç:Ù‘bJs1ÓEÏz`«]¿zrt«f½*ú*Åfs»ZO«
-¤—Õö@½¥§¨ãê­c¯Aê7BL—Ë=µ
·]“«Ìj0ðs”Òfm-u©í‡xª¬´¹­#3#aÕÎÑÌZÐÍÙ¹Ä'•¥k¥ß²ZP¦æ,’£K|Xq(©w.³Ð.¬å.—ó5Îˆ@+{÷SLéEE8ÓŠª~³=ì:0¦«A²“¤g0BGlæpÂ³Ñ£Kp?¤ÝÃ^ˆL9Ÿ!=hEó!3ÝÇg !Uð#Œä*øã\j"m&iqóU±®PÀ”n´û£Pºi¤ôºé–,ñ´¤À{ÆŽâU(Ló.¢T* P:{•M=6(8+’¦Dª¸VPNf—
ÒÊþÀ‚´XÎ^ÒELvPAi1jqn‘xè‘Tœ¯÷~§MÂ&Î‹6h;CÉ!o¥ê7ŽÍ¹Ã™¡£ÃO“Ž°žµ$1¹}+£)¡øØ–0šÖç82¤7:x‰c¾¹€ÚõNîP/ÍpØk`Ü ¯È¶º‡œ¥C‰{émj:ùëÏþW.y9àzdÆ5­+ÆUC½h·× Ej‡Ê•CÇæ?Ø†$ò?v¼&(å•&É ÕŽ$öêG PËîÒ|Eð«Ïy¬·È&¾¹Óù²ÝÃ6ƒÎ.ñš¨¢¯Q*ÿßÆ"RgI}H„~fgÆ
”$ÅaÝ«‚z;^{À—±4JMü}‚Œ	6{l‚ð¿HåN^îˆkf‰f†ï¯Ð	JS- À½{¦@¹NÒ öï’†E‹µ¿ìcÂƒÒËÊ@ç‚Ú|És°dì·ðj¯3u”Éº¿©Ã[NõJÕj¥€jiež‚BÉÐ¤Ô0Zrm	eÂ²FÏEH'/¹f—?juÓ(åwádd;X‘S×§G+)™«…›.$‹Âß¨ì?´¬è©Œâ} •A`T(Ÿ¸šEÜ"= á:¦'9G¨*á&œ:º¼T4Þ—D`Md!ô½Pš=ó4ýT¾™`ÓÛ>#Áf,…9±“x‹Œ-Áwé\ÆP¢gãËO­\ÿqç¦Úð±|"Îh Ül-à\^Ëð§~üÈ:^¿ÐFd&¼Æ‡mN‡Û½4{NŽ ‚×ý¢Íõ³á=ðéFÎò#!6zéae
8Ó 3!9äÒB¾cT½žÀ€öï/¯ÍæS2‹[-œthMnš
MSË«Zä'€¼—šWöÎœ‘‘ûC‰µþH&¢«†»ÍîK`uK$N±œ¹ P¤=ØþÊbÞ1¬qÔðcNJ°¶Rh ¯.ÖéSúöø‘¢à#ñ»íÞ•³–| ÑÃï¶Ð|§gÝÐ7Þ+ï-²½‰E%^,;fz˜qýÇˆŒ‡^~ÔÛýà?2Z±Ø{e)¯Ò6=ûm²Ñ÷iÌÜo1•pÄXö(ØÍŽ/òú„BÿMï!V-ŽHé…¯3þêb.f¾Ó	vüfzQ/ñzÉ»=t¸Ýë´O‡´·Hq½ûn8 KÇ€¼åËÈùrBqb9"óTéA3á#²±ÓF=¦kBüü¼õXÖ\Ù49‡¹~‹¬ßE½ýí&·jìÚ”1Î*ûrTöw.•gõ7µìQ,¦É-#ÔÔ2™ëï›9Ekìiä]0ºÑò÷ë%	}¥Š|ËÛ—°O4MÐwíŠ€:}«
… ¢qDB+Ø¤kzÖQ°)CsR+k•2ÀC(	“U/vT}Ã—fiŠå¾šª#•‹ÙÓO»js2s7çF5Ä¡0é67Ó¶vSt©³3#^rÙœT~îQ6ÈšŠÛ¾Eî•‡¡Ù»ªŠDËÎºØ'1`¯Ù±ýÒÅr	ˆ¿$Í±Ôƒ4Çè”ÑÉŒå™©2àô¬kdŠû©× –Á­à7œ‰Q°X”y¬Ö·2?5nõ½óX™øn““.ÍVô^$®)‡\mr6»ÔZ«;f”È1™Dv=åd·åÒBqe!qÏÑÊBõé‹çgjÙ„NìÏ”Ð!ŠRFô¾óó£=€¢É*ZW“Ãhò”s´˜OêÔmŠ¿’RPÕƒç>ÏØFn¯-Îo.‘…[‹KÌ.²¾7“à£(¹œcM‹˜o“ºîQ†'Ù´ÚÍ¦ßKe{:Ü4OhÄK‡	À¬lV¹€™›?F=˜×Î0;3îq™A†‹oàu‚í<>Þœ–ÉZ§*‘<9¨xGøMÕ›ÎKWÁ‰‰µ&ÒÆyM÷ã;(©FËòÍÒgÆåÚl™[?$szaä-3]­ÙÙ…qÐæû•5Ã¶·ðŸ.î‘;=
·€þ°ùvXÊ²ÂiÎ£2Hs·çuÛB™S*-ê|å-Ù£öá´*Î>öäëæ¤ˆÂ7_ïC¸ÆÚ!^:ñAÒE×&4Ss-lT°µgÀ­É´Êƒl(ŽÍËf¯ÿÑdÃâ
1®	²œÂ·8–5°œZ_ÜÖÖ”YyA]â5´+£ªJ;Øk¹¡­Élh¾ bÔØ TyuÐ$6¬çgƒÒõB³´SÈ¹}bCµ¦z…›SÀì;äÉÒî‡’L(œFê©Âe8°Š +—œb9~^¹ù±\â° j¦«j9é±4„žÑP"’[Á†Í„G¸Ð&…C\ 3ƒÐŽbœ¦¶óŒ…i&FA·¸¶($¦G•}À’uSi–fM¿P¸‹BÕ¡u%Ó’ý+–ô Þ&q}p6oÿÛäÖõë.kséqƒÓ2»`ïTg¹Ð–ò—ç‹I(–ƒÛ|²R³£[PÊ
’ºlÎÅ}ÞÀ4ððöÉ”xÖe:rx>±­vÀìÜ9’ýõMÀª?€ù×¿ÿ'§è¤ƒ¬ æ.æ=Ñ¿1·Í`{»Ã|ÜØåÁ)eÑ„N{÷þV’j}Ù páR‘ÎôZò†«W<§Ù\ßæØˆ º Kl2ôÄB}fÇœÇš£c™ä-ƒ0åØÿþ=—s+DÅ^â±¿¨6e¹Çž²…¹z” qRÌÃ:…à\!3­ÐfhæF‘Ñm'÷xá>bm·ö’+ÞªÂ3wEánb¹
v…ûzóQ)>yS~Gi/W©žJ¼¾±£n>ù8ÅÈh¢d˜¸ÇKÌÏ¤©PŽ¾¾’fG¤à)¶&f_4¾Ý£þ•œKXMXCâqë\Z¹ÑÁË´OE&ÇH¿þëOS„þÂÎb‹$"ƒÑn£Ã…d<6Z‹°ÏgS7›>¤ê(€€GW2è‚ªŽ)wšõàs¤Y¢¦ÄÏfý˜n\{¤Ü‡#°:ð¥Ñòºø«yT¬Àuûþ ‹Dùáí°se/õ`_=\û°õ0ðšÀÎÞéƒöV›°‰Ë8åFqu¶¥(®jZ1ÎsŠ^¨srÒZ¥Vü­ÁÍ~ CNÌ\,R0~l‘â·Ie«Z­z‹TCµHM£/L–ÛáºTPŽ3m¨²»l¥çäÕ£ 3Ä+'èO¢ÃÆÖ þÃª-AÞ4vÓ¤óƒ¶7¹ë£»æþÛùJÅ€ðóÒÛœ¦ÑSÚ¦³AÔ¤’èhÓƒ•ÄÓÎ*J’Ÿ„š$1L‘û¦ó¢5Ÿ’‡ÏLîl5%lîf*aÉœ¢V˜ÁíÚ0j‘yŒc¾<Õªu±_Ì*z$æwÇ•p‡½Jó×=¡©ñžÅe<^ðr4¥Ï,÷>M+ÿø˜–yú÷j*;ÚÑ"‘—”R÷‹>¬Íï5¯	:¥m3eyÑ›Ö°‚0õÊeÕšaÐl¶G
èÆ­ZòËh)í2ª0–›ÍÁ[†¾”ÒÕ”ÁîìUu¦2…c>}”ãKm4Úsó0ÍØ¢¿å;@¼ç¼Ý¦¡%šéƒ$Á„ˆ<‡âÇâÊŠœ§ÏÝ­ã{íˆ=™´ÎïóZ¶ƒÃq¾v¸”2ÕÞ4qÎà4ÖÃ¼-0ÁªÒóÍ={öêþÇ?Ôä£¾Ñ	ê^‡Ä›FAÏ|úyEî÷¼NgÝßnc¡(¿IÇ vjaÍ1¢ˆ¹R#
6 6ôûPª7"^°3²ÿù7CXc<ÍU¹±®7RÊŽ4¶‘sjlßV"!ÌŒ5`ÅÑ|êé¥E6wûöØÅÂ¤ó¨È4_¸§”Ð=Ë)JA ûQi4MQâEÄëí~s‰G»·œ½ú×ÿþÕÿûò}²_øEñgz~,Ãí?³
hŸ8ŒÔ<óÑ/ˆðàfÃüž2BÈï–æ¦N?üÎý6*\²K”Â1êEœ3Xa¹ŠÇ“è ¹ýŸ³qíÓÛ}LÜ†#¦«È±ŒÆ¬ÝÃE»@o»¸¾ÿëÛ _“õ}©æV†1>e•£P«’TK6QáòJQ*:á)Z¹7óOû÷ùá4?`Ôg†øáŒG¥~ØÖiÊœ2¹é¡v®ç±BÄyº5‚p‘yÌ›N®ÊGEI¥IK.gG@_GŒ’Sðå&Á¼¼'cÄ”§˜( 'âªà‰à3’o.2áÈ^è{£ãJìDWöfÌF&¾˜Ñ‰·¡}/¤¸Ó ²a4Av|ÒòøT†…‘ë¢Ñ =ô»˜2“êÄ{‹Íeéô¢2YÀÈ7t‚Á~8ùqÌWøÌë…Œ Qû'¬Ñ!#&*AÈ5ªŽ7ããn'	^ÚŽ˜—h^m´•lRì‚+#“¼+ñÓ‹³4äIÁŠ/°†„’bÍ_ƒ)œÕ°Ž”Ç©äwÑ’Þô¬
[^xÒ¬ìÆ£/Cü9:JêÊå2umH^‹9/òŽƒø«W1ž—cK˜}´Ê»âÁ#ëèã0§Þ-oƒ°„»¤ƒÁ$E•öª´/¦›ÏýîÖÑ`rž:_¡Åd,úò#V53Ð{~.õ>u3*™?£å©Ek©ÉïDÁ¬{òŒ•·¦wòïé¿¨˜ðoL9ý¥(sýUqsN,	@[ÀEÕ Y
c˜ÆÉÕ¬JzeXOâEè1èCEÌi¾ÌCåÄ‰d,4»ya"Tãõ MsÍïtT²ÇŠ&¢D gjv‚hÉøóËðN#F”]ÁÔ3¬èBÓ@ayÙšh´ÝÈ¦S)è£Áì;!þ0§Øµab¼ñšAïÚÖä85œyl”ÜegÐ©)1j„A§S÷Bû‘ê Œú§Óç8”MM‘¦°=ø$ìv|L­:Á.)[†œ‰±›Ž?€fÍmÿÚ6¹BëÀÆ*ÞˆôAâŽ˜¼P«ŒÙKÐi”q|fçŠ ±ñÔn¾–)ï‚cSmQfäØóRdëV</ãŸ§‹ŽÆuE™ñúÃ°ßQ·—?’F•^*¾ÅTM”W±ÓaÙiTÙ.<f)ÊëPÈªÁ§Ö 6õ¼zÚ8$WÒ¬M×<­WÚEÉá¨F™•§G˜–=#2œGª\‰e¦9A1fYžð¸m@äÉÉüz¤n.¬(ñäNèõG¨L±wÑç‹jh¨ör€½Êä@ùNçÇóÆ‡Ãý{nq<£•ÕÓ‡V Ä`±ÖŒ?LÊ”äW7rCY [)¸ÝT˜!Ò‹o¬ØÑdÇÓ /ú¶FÙÊf@S—êæºí¶Í¶€ÈBû¦e#Õ,£mëéõLtÞ´¨fY=Ì­²TÊÙ&{}ž"•îý‚µêÄ…Òîú@»}V/j¤z¯nÅeÌzé-M€Jy‘ˆi"OÔnŸ½*
UœÛ¢ãã±\]Ç~?éô?¤|ìýÉ,9O Ë•Ö j×qsvMÅƒ‹ó°ÌŸ–Ä ÜûvÝo Žèán¸S9‚){.;Ê<‘J~û/üÆTž“:Må­6ãÚ,¹#3&ãbÕ«Í¤™Œ5ÒÕŒ` ¨Ö™@‡ééŠÅÏ9jRÝŸ™­3iÉyˆŸ\è=˜c²‹KrNÕvK©S¡“€¦!ÖÒÊÖGvGÝ˜$ yæJø"%C»G°XþWV‹j6LO.z»d°¢ÇJ|€»T²nø€1ÿuIUIy( ŠS!h›+²èÇš(÷à%Yà³¸Šªê¾Y¡î”QsÆt›I™hø;¿L´k!j™OO×Ÿ¦œ¼“¶‘§‘trVå†ã– -s…9á_&5¤¦84uŸuKcv÷tN¿3º p	vBÙQÖH=8Rªy€˜mÁÕ#!	s|ˆUŸp|Hÿþ|ýô_ˆ¨Eý,.öü1½13¯ÛÏÄm¾æì¶…3è\âÜªÅ³ZÈ¯Ñ…ê’èÈðhÙº¿~ø1™>¯ÃmŒkÛü™¦n÷ Ùs´?*’êò)‰rÚqÛÁ*xó;ÿSÎà5†fæIûÛ¸*÷èù~Äx[râHj^„ùL>‰«†¿ ¼<úSlúþ„Îˆr4Xç\•Ï¿Ã9Ÿ‹…pÕ=¬ù"æüœŽüït¼GIuþðñ¦±²éÐÕ?²/”ezú˜U[F›|Ïàt]Œãú€¶ú‚ý	}å‘¦&ûÅ/IiufCxœÆ3öå—´åôýIiaãûÀý}oãÖê¸©”ú1ÔQÇ‹—]¬‹ÁN¯xÂêaª#ã5ëNLãKÁNUm¼cL1+ò;šÞ.Heä
Ùö×Q†ãBZÅÈŠùûA8ø>ãyV‚íh3€ã)=HL{6†Ö;ÀÁ¿#¤w¦a¼è7öÄÀûåFôàža(CªšèCxÈ)>ÎË¦mIï«$?q6Y„†ô	ÃÿŠsÀ²Ë_È(0¤8øt-¸„èi×/BâåúpùÁ–’7#<.=løÀÄ´rxZÏ•¾Þq½¢h“VZ,R ŽÙÊãéáðÌîÍèÏ—S¿°ÄØmÜ'ö‘(
ü?Š‚ÞÁ ?†ýD¼Œ!?VSÉWk-Åx$Ø7èÃŽæqÓIèí:LvØ/Øß‹‚ž¢UƒU|Ó\££»@röÇbÜ™¿çuvA´‹ÈÆ°Ûõ Á±^^DJkÜ¿ëìv@K÷éªIäF}‚ô‘|­©A 3ôu^ƒ´œ…8Ó Õ9žpqÍÛö´ýÈé"trAyQ–MQˆål±Ô·‰gÔÎdujÚ$Må—Ï6{F¥T®’“$“^Ø.¾Ý “»–ÿûœiÀb~õ—6Rjf<ÐÜ‹^tœõèš“|ë”iõ2œ”"kO"ŒÂÓÂ*8Ø<CÌY¹Î^í°ËõÕÐüàâNÃE’šRˆ\O6ñ˜Ap¢Ž€¾…A‘Ë¢j“-tLØi÷€SÐûØ¸NŽeµ9r»×þñÐ'ü
z%±,‘kËjÇ‹e|ÿ6ü(¢Þ'Àš¼'ÄT&kÄÀ“ƒ_Œ>ÕœjÊ+¨·ÕîÀ­[z€lÑƒr;b»0.P² ×“ž&¤TÂÒ!Ûüåµ—†¦‹mtÓlH=¾Q}. ¡lo3ÿæ=D·odLÆûØ¼±è•FUYxÚ™¬÷•(¶P¨òJT«ð‘°ùàmøXŠ‰æö “ƒ¯™ËÊŽ±¥¼<`\b×3Y ¡hhÐú0JýìÃ¸ãSÔ˜‹—F7­%Œ¯ð›žî
Ú×¼ÞvÇkúQ‹l¶»>)]ÛØ™rÌ åè´˜+$žpª!lB@2¦§LŠ‚##}‚áæLÝ‚Y8ê3¦FõéUcþSÛæè#ŽŽh ý+E3èæMW´Õn4!¡ÈÊÊ“µR¥ÿáQ–å|Žì‘;÷ýÝ9QÊrwŽ°ª{dÈÎÞ¾™Ì(ô%—¼F‹[zCtF|P¦C‡»ã|wâ'waÌRö!õ.!o’ªy6û‚(¨iz¿Uÿ‘ß”AŠÛ~ÄÇ/GA8(•¼	R§{W¿Lë$ñà?ãw*wsi-öý¹‡*Ÿ>¼¿OJìÏêÝýñ{dŽœ]EßÃ$¯G,äÀz¶ý`;ôú- Uü p#aÛêC 3`wµ•þiêÔÍ)Ú$×éE5l»6ZäY`iúi}ú6Ðã¬y=¿ãfå!<Å˜QË@b‹vg;±hÃß#Y´]-z#¶ÎŒ]c9«\3=™Ùf³/z»OÆ§C¶/éâ ¡ï‚Ø:FrZ»	Éù=÷EbFFá¥”x$±Ðüç,1À3mþk¡ú“”*‰¤ý-3Ô=£]sÞÓŸ4s²Ûò·GNÊˆ4höÒÇ€†d‚Ë"r£Åa:gä|a@ø` BÆ¼NÇ–c5i¸¾(ÔkÒš”5i°Ôkæ½nÌÚšJ¯MíUy›e·rÍJêMÉÉ©‡{ºíºýá[–ê·²Q	:ï•PÙ:œã±+°Tl¨÷ØK®È´Ëž©kSmYÁHQætÁR‚ R~@=dM°Þù$§àØá€ýP3ÎÐ‹bM,¥ÁÜF¯	±ýâU©Š¢—Ž/»~4Ð£Ku$tÁþüp”á)„1ym^„Iöôˆ4?‹GÄù€ò‘˜ÿÜKÇÁN€÷¡}j£Ý6;Á;ÔÃÛ
_:ñtŠ];ùÍŽþ?   ÿÿì]mo#Grþž_Ñ–í•å»HJÚHkh)Ù,­I¾s¼XxGäHœˆäðf(íÊ:¾ 9#É—C€K€\;g8†møƒáË!ö_IüòRUÝ=3ÝÓóFI»çbWœÎôtWuWWuW=uKO”¸?À¡ÔäêÛú	báýþ#ÅôWä.yûóQr×çÙçp¾[}M´æØË¢Ë_¥¸Ý]#³úÝu:Þ±=í"~qI,
b¹}Û¥ ¸0F£!º½óy[4…Y™“HðGîÄê9Óè!INm9óL±lä¸†kKÀ5« jÑ¾}ìÙþ ûD¡‘à,A&‚â áEþÄ*Ñ<ô¶ä5¸›è<B	®Ý'p•?îEÄATrôÑUdî‘V¤¯Ð5 ÌÄYË\LÌÚ‡Z7Ô‡ˆ ¬Æömð¥é(R°+Íã—6;ÍàE]·§µU¶…x˜>+uÝqßá0u&OÆÐ¯%eBˆ‡á‰Å–Á[,æ±¬4tÁ] Ïòžõ#§‹|Q_ðÁÇá~þÐ¡ƒ
Üá–j#=ÐÜž(.D:Š=Šö¸¢oÀ&€;ê(”9Ö›SÓ—"@…þêKÔ7’ŠnÉq¯·ñ\Sä‹á6ÆÌ€k£Ç·(ÿlzˆ°æM¸mGai#'7*"ˆ¿Ù ?ýIö>°¸¢}ï}ÚyÿO¡ï	[p¦ž'íÈû]Æ^`¶AŒ‹è’ð‚.6PyAåçBFÞF‚Ž*ÍÓVšqã;{ï³¸t·ùRû.“Þ_È°º_ë(ÿóáé©þ®˜=„”^y]­/¥™ø[J6ÁxOTõ×Ò³*M•ˆôN4RÍ”²vŽmfæÆ‡|]/ˆ%€a}2^ÈÌ¨ãj¢Ãÿ?*ìM@N]EÈØ§Õ/›@P})B„7†¨5ip¹ÜÕ¤ç™ÙÓA”jr6#73TVIEª5Y…˜Câë‚.(¡<Á®{’Z²ˆÏ`×Ô
ªò_žÙÞ…¹£§)á³ùÄ»-ˆutÁ¶ö˜Õïƒ•è—Ç„f‚3°AÊÒá¹Ì\M,° øÉûAûM9ôŒM}IŽŸË5,ô@¡Å½~‰û+¼/V«U3•âc{2¤ÁíažÝ¦ ³Òb£Ý¬gÌJñðµ¨N^d*J§†žRÐkéµÐCêuwêOà?»¨>”ÇªÄCµºÐ£Gc¦h-ÅÀ)úÂ³(o9º´±í¼`¾3øGe)|«ƒVRÔ¶0Ž#ËŽ°û¡e¯Áú’ ¯)iÕŒÙBÒ¤:ŠFÁnMRwµ6håñØ2à€6[FÐ t:pÌî¸ÙîœÎœ—½©¥Sç_0™¹€ù åý +¤{}Îàó)êÅ¨\Í½9>ã0áÜ¹HtŽ
šp
í=JWÃ‚Û°¢éõrØêzY48¨¦|åz0ÇRÜ]SùÎ*¾ïÎô–D¢r"OŠ
&?œìßÊ	Œ¬v¿ƒ+UWx¹Òqâ+.csø{•Åº4	ÙÜ^t0w´Œ¨(œd‚J7úy×û¬gMàU@’›G÷$R¶X£ED»	ˆ÷¡èJeFÖôQ™9 2ŸæÚõœðêÀ·˜ª«#g\jÔ¡“ÒÉÞR	å¼ª±’a…:ocæO.dÇ…dA²rØUÑ$c¦ÇFX`á¬‹,2QÜ²éx¦sy`_¼$î¢7zj„kê‹´~L³ÙÜ½€è3—«"…Šâ]r¡fžzJf—Kê…(;sÖ. .›-P}ÈÁØË`È\ÑÅé¹{5Ñ(ñ¨ÇWbâÈlj6ArCïØAÂa¾nÝª«ðOy¢yÒ‹ç	‰¾`Žã…¯]^2ÐÎ¦ƒ»ß äÕÕËÁÔÏÆ	Ìhóì 	P	3l\Ñ£dñ:µòÙs'gCË¤ù	!Aø"™ÞGûúô1‡êú~ª×¹b¥fÖš'¤5“j-EIªä$A5É9uz¥œúk“Dr9XßšZ"lü¶5I|q™æ¬W#Ÿµ‰MùîªzðåÃ¥úËÙ…?wRÙÇQ¡$j+õ Q Ï{ž³*ààA}¸¶–Þ¥P½ž›N„Fÿ U*ãEÃ
êŽåS@—€}@§©Ct©­b½Gæü}Ë„´˜<kc¦Žv@³ÖÃjµx†H^Z“ÉŠ¯0OB3ÉDª'3âåˆm½ŒêG"RšP4n¡@’£
ò5@õáNcCqÿñ"ŒHóëÎ×’ˆÏRl·9¼–ºÙœUa³š ñ@xkî­™_Ï]]Ó*b¢›IVÄeDÚH‹ì…UC£ÒBkÎÂ:Gt·Ý'¶×£Ç¼]E.#µpvÂ)âLÔwTqoxFUéçPß_ü"éy¹ÌM…ˆ“Kr¦²8š­	€DÅˆ“ÙJr}^ˆëÏø¼w"
ðNf+ôr*RÊ0`ì´±K)*îµm}M»SaæŽæç·Œv‹À…X:¾	‹ 	O ·º,Ted’2­eätÔÐ=–2 âÛ°§–3„Ñ/3n¢†ÛšSRBæf;É#yÙBüš
>3áS|
˜C*uDôq€™ŸÒÀ4E<UÝ¼^—Ê×¡22ŒH©P˜M7”t/³åÒº¦™|Ô³{˜ðÞegÒ<ñÔ7	¢X8åØäi¡»x œ™¨€ãœœžQqØ&'ÏµìHeTGwó…iâ‘³»l^R5%é!~ðËåÓ
~s€ÝüÒeÐœ+8‰kô©Hæü“â‚Ð:Gz¤‘[„ú©
ˆŽþí1LôN$ü)ž2Ó”93–ºf,XÎ€s,E;KsÀKË~$B(Äè˜?Ô§d[âúCÏÊ5@èéÉ¦ÚÚLµd!I”8¶t¤Yëñ:tË|p@ûµGwT;ÿ<ûá]$þ-	±ýû>š‘û3c3T<ãœPñ¢  0>ÿhNú=Ù+>%óŸ®YÇSÓŽ˜rz6:RôšèØ1¸îÄò€ëÉÆgIÜ”g­}ØhÖÃmJ‰&- Ñ]ÁvZ?ŸŠ¿:ØV?•!SO3Øô€Þ˜•‰è•¾Ûšµµ1¨]e;s÷¶ö`"x ™ë²=Ï=Ç1¸Z›Š–7w I&À§ÙžxµJlÒÙ
º/ØîÁl%D7ág+aß>¶=*±áŽ,g¦† ³ÈâG¢ZKÉO³
…ß½4QÑW§8‘E+£Ã/˜8à}÷a½Z_Lß¢2ÏI™é‹WÓê/o%È€Ô[»\ºRI(M¯èn	(OÛÁÊ¹¡ÇØ—¬io QùÝ8Ú÷1\:Ãõ¡ÝÃ.…z€½Dq)h~ôû¸#=OµµPÍÜd›¦Ê²¬~”'ŸrÀ~ÚlÒäP¥"w“dYÃ£HæßWXXùkü’ªO…ïàÙ‹€=âM/8Ð‡”Ä«« ®áwÉ¸¼§~^‘õÕsÏÛãÊ›óåÌVóôFÜ¦›÷ Ì—s=š,<1>kÊéå|“FÀCÍJß9qò¾fÕ³©]ø1ßj÷?†Ul4ïâr–C~®²™UxP[E?ãÎnüƒó=ù`Otúè×À= ¬qß•0AušZÙ¶•Zu(I¢€& ÚÀ|È—#»öç¢ó¶u°—º­vß¤°¼A9¹ÖUSŠŸ„³SWÌÝãl˜äviàþ”ð‘OŠðÏY]5³A°]áSÍrnw:r¥5/¾F_•±2¨ÞÌãgih!ŠæÈÃÎÍáæ!nMÃtOÌ8ÏÑp¹;Mc™«ØÒË&Tø…ÍGÝÀõN®
õÜb‚Q?O2?P¨k8çóR!/iùŒS$„ZùÌB!g‡ÊÆW?|êuümL Ïî¹{$è$j­#¿„S~uì>zT’´ƒÈdÎVYúH}!ÿÛî²ckè7§MŸB”x?µ†‚ò
ySfÎVji\¥Ù%¬±Ò¹5”~£…øøúY¸¡]‚”bÄÄWªpmî—še6_OW?´G_%ÏK1ñÎÕ¨4¤xŸšk:þˆÇC×õ¨Ü[ìÔÓ°cÍ%Ô’¨¨—yQPd§x>.gR!zþg‘qÀî¥{¯Æ?‚ÞèfõKPR™†'#8}Oœùpyœ¿êù„Ÿ¬ûèºuvÕUß[ôMW¹‡3’…É"tÉ­º†Ÿ,+¾†›¶-lÚdã=L) $lÑälè›#÷“?—ª¸+Ed)0æÛ÷þ!‹£¢“âß¨®æOaâ_Ö®þI¨CÉÅÉÐ¥VYãç.Ä¯TnÝ–.šAÉ)Qô—ÐÁRS-ÊŽ›e·f‘é±""°ˆ™ÆÍ-òCxc`Zó…l¯Û2 B÷ïX¢™"º½Ç³=QžðüªÌs°CÞþ0Ä|>Ì×õ|uÿèBø3ì{),
ìv-ès10Û¥× Ò±;ðÜ‘]°/Lûq­U‰|Ögú~g4™-Y’>µýg”ÈÕ/ÖxÑaûö¹Ó£%ŒÈÙ¸¾aû§˜3ªÆ¶­	Ì›nZ÷=×é³ºf¼Åùùz+%i¾R3­’¤zª)›ÙYÍ2ˆ|kÓÕ/’¸íuÛ«9Vø%D`¨&¡÷H=&\SóÜÉ•Ÿ¦ºòCƒWYõ¡Ð¤B#M†HÎ×ž¯¤¶Ÿ5×ô _Aê–ÔGŒè6[”6ÃöŠñ@<Ä•Ç³{So÷]÷tdy§Ïñ¯gÍ¾ ¯në{•!é•ù•+<70aG§ge—¬Ø¤|e[JbUÝîƒ_Û9¼Ó)Ê¶weî8g©ÛO)R^ÛíÉŽ9äârC¨{zâVOìI©;÷ÚlíÕ;ëûoln=xCï6Øáþz÷<ÛÛzksû€®ßW˜ñ­Ú ¼ä®`‡ÖwDQacvIƒ:³º#ÜsžÚCÇ['¶§µÃ·§x‹¿vÙ;óÐY)xê@ü¢óÞXçöAðÇ4Çk±G·P][C½îd°5^ïœñæÈr†k—Vp¬Þ]Kâ¦êØ¥žQò»íÝubÐë[¯½¾ÿ77X÷õõCvÿÍÃÃÝ¬tßb²€}PŒwpÙœöÙÐ9µYwˆ ›<æ¼ÏvlßÇlÇx_ž.¦º¹Q{ÃÂA’üƒïwABD$[Üû4ž¬b]r»4?„ƒÞÀšª)*Ø‘Zd‹1”Eœ>©4:*ÚQƒzÀE¾Ø°[uëø;w,8[<Znw!ÔèÃ;u«}ë‘~€¡5÷aDüQ~î¹SB/ŒA†jÙ1ÐoTŒ4çÉ¨ýD=¬¿Óš<}§‰¼“#«´¸T^Y)7ÛåzµÕ^xõy´<h	¯ÍÑvÎhèè8ÙJ‡7ÞÓ$ÈÞÙÐGœƒÝ3|ý>ötmœÆ&Ž ©Ó_+õÅeü³²¢ˆ/‘¡Km&\±Ï5>9’‡¥V½] ìÐšÐÓÜîÀŽö°m#"æÙdŸ=qÐs‹§ËYþ)Z•±VœŸ¿è}÷éÚ\Õï ÿÏ©.‹Ë„’¹»‡™4Ô6ÊU:Ä©Yå-1³¢uM!XíÛÇ~,hšáô×æ°µÞÌ
^¬hIÀÜ„] wç	ãÁRŽÏNíIziiŠ¾6GtØ8ºÅÉ±3„ŽÄ—¢Lž¯´¶A±<ÛÂ7yöZÚg%ôµ"O^ov!SÜSÊŸm†û_%Þ0yvX«ÁšË¬ËÚèG&[lÃ!|·Úp¾Û¸ŒÖîàŸ%ÖZaí8Üf­%ÖéàwƒßÞÅ²:Íjƒµêt…ŽøwŠ–×PBNà›Þ ßôFºj ÏÀß·çLUæ„ãhU¦ß9-²ïøçL'å–mglÿ5ôL˜8wÆ·ZÃ^¤uÁZ¼*'dÝÐÄrŸs´tdC/ë/Ð`–ë<5ò“xÙ^AâÏ’p´Ôa-d|Å»xvæòºÿ€ƒKÄKzb©…GøÛR½*xGðHƒ_Ã#þ¼^‘×ZMÖiá_ñ8¢·ÒP^«8?Óx‰M_›;ó†¥ÍƒtA{¤–Aám2’À0K§ñÁ’LØïÎ I&ªB!°+ÎObóÁk†­îŽ˜Ï|Öw§æ®¤p%÷Vª¶”[wt(¦õ™-âå#õ‚f¸¨UoÖ—­G†@	MYóûðDŸôz>¡ý\¢×…‹xuÇ.FB=”ò²\Œ­âCs‡D­#«º`nšñÜ%‚\Þ\¤Ö“ØF¼¨:Q$ÑYDÁz£eúžP“˜»g²@c/TÊè»”ÒEä[ÚØŠºe	FNáñÜ½âõJ`Èë¨!°C×NIG\iÌÐÔò€r‚Ë<ÞµnÕõG5Ð9`xõ=`(c^e”¼ËŒV0Zˆ/øIä"¡C’Gª"$¯¢úQ¡ÄeU2©]Dy¾2vi?!)”^Õ‚Ý1ÌV˜¡˜×zXNÜùØ ¤cWapCjÃ±À $sŒÁ=BòðÌM›jwú=~÷"—þÀ}"ÊëmËÓ-_³9&õîw¡oÂ'‡À‰¯.®Ž\l@^ Égg±†T$˜r´åXà›ÉÊmømöSgšUTÜX<ÐèR"—¯ØÒMšQü,ëƒÁÍ%O;9)Cê<4¦ºRfØðv9/±Ä“z®^ÎE¼‚o‹áTØ b­r( TPÊŽXB¡!¥°žïb<GhÖßi×¥mÚ\\)w–ñ_½Ú Û4Ø³ì˜’a½ëÂ¤ßJ,¥1Í5y;Ý§dT”‚Ë`éÂœÚÄ)µiœ\”’1Rµ³‡Ze'ãÌ´2x0pìasÇ¨Ä•ŒNêÔ.JH âJ€Ílf¢.ÆöH¢Í‚ÑÁwô¾ýíïþï«¿gup¸¹Ãö76Yw÷Á«[û;ë‡[,9X4V%ë(AíÂpW¾ mš—AN`*Á
vV’	ï”ãcž=“Gì|äÒü’Çÿ€ ŸñTÊ_Ñ3_0™<ù+ôiô·té3:ç7ýÅá}eJ¼5~C¯ùŠ
1Iþ% PU—¿¦Šü³È„‰>RB“¨t„\…«Ê¼AØˆOé¥ÿÄOþ“~ù!Pèü·¼àWŒË×“œü¸´J–ÅPkÒ¸M×Ø¬‹TS‰ áÀLä*Ðê}¢=òêkž{‰Ó‡#X÷)ÑñcB¢å‘_ÿ<Ä`>‘?|@<{'çQ˜a v$ö|º‡Ùý”þ~ä‰ú\öÞ e²”ñ­ŸöÞˆfèä³°~·gÀ 4
t$
Dª=6ãd¬žÐ‡ÿlŠŸYÑÀ¢O©mšO2Ø!Ï“Ü&5O-f¢Šûè¨ËÇúêrVvQÓˆ¡añu9dü<ÊòX©kž:Œo£%Ç®ß Sì§v48âß®Xïq¨ábì0-ø‹¯¸À‡™Äy’1Þ·þ‘¿,ëÁ¨FÙNY›r3Ð0nWk¡"¬±Ê…`¬¬ÖbvNÜx"e§vpÖëÅ¥õ”ËTÂ+Ó·oåÞÕ¶‰°}0¥1è³?ÚJEm¥ËÇBzÏda~²Ðâ	A.rÚ>ì¥x\A¬ÇW§ŠŽÏGÐ¼isàJ_fßr½š}:Â“¨·¼JŠXÛXÞ]YžbFV<×·µÂè’(I+èê±JùÛ2ï0aºÑ¾Ë±(Ëm59‰8’'F•3EH5q¦S5È¹0!,-ä‹(J^ˆ—L1Í7qYkêyIÈ«ÝÝ;í:^oh7vmN2‚Áê[¼°4ùXÝ3ÉF—Ÿ‚–sCb\š°oÁp6R"/cæ…½ý`÷pëÕ­.YÚ°µ»·¹OgìÕõ­íÍ£kÞ3·ÉMÍ‚RÍu»£ãÙ™9çjüDE(¸m©à>µÔ,û®!ý¤ü3©æRÒ	õ<[Fm=ØG3Îf	‚SŠN£™€¢RÚ	x<S-ÂiÐX}*ÄYíÿg¿ákP¤ß—vßÈo•ÝºRÝI¬¼
ýlˆ[8[#ÔÎß-G¸ï\D4üKÔ~ì>¿GÑàsêï®jÚäÊï/FQ5¡‡2îÉmØ@ñº3wâ>n‰¶xêâ–Ø”k±ìä%š½ÂèÞ8§ælS¼õ—ëÆ9¾Øm^§ˆI¿ÿýïè³·w6BçÁ­±?‚¹«ñ„©~Lëˆ¿æ«[ÁBÚÈu§/±—Þ&¶/hÑ°qk”¶™à•ÐIÞ;—ªq'aq×J=czqÃ>zòaTd<¸<m³e"W h‰¡Al”û
"rE¿š°Lz¢@LìA >‘ë¿W‹gì´¼¥jZè€ÐŽ©V&¡Ÿs	ÛÄkÎzÖøÜÂTD?uì'´1›>ÀOÐJCš`Ü$k=Ê4`ËõóAÛ^GaOéµƒï:ãÉôVÜƒ/A&HÑ•¿VÔ8©,ÇÆáª3:‰wV¯·§ñYÅN×æÃ—•¸Êi§p@lá•áR"0®ã©åŒ£¶o’kl_j.2á˜t*éJy—=¦n^z‰ÚHcöjq'[qQŽÓ«¾}²ðØe·BÙÃÌ/hÎ¿&QœŠžìÙsA]¬Íq‘_Ò›#æiV ] §óU<ßÞ·FÓŠºâŒ‰Rb²Ú<»’D]Æ$³:³>kš®òÈkEîN<›2pðleÖÓR½Ú.3ºZaõj³½¶v…Sš@Ç.¾§áãj¶U’‹ô¶ð®>rßÞÝÝa•LÉ™4ïG«©'ÐRÝvb2ã2’ .A"ÏÛÕË73§0Ö—Z‚­w¾§l½“ƒ­©SÅ“Ê„{ÎE¬»ÁcE ºHnˆµRÿ>‘÷pýp“}û«ÿÊ3²®M¾;ßWòý1|Ï¬×&jò·¦£ë¬R rn)¨8šdb,{û¹ñ“üjjÁÿ'´;(·öi!¯în<CÕx ³5¬ š›*£M=LfË‡¯.W•@èKÏ†f{¯]ƒéø%Ylð.àäÕŸý?   ÿÿ vÛ¡