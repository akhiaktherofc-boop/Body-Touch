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
  emergencyNotice = '               ',
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
      setSmtpSaveError('      ! (Email and Password are required.)');
      return;
    }
    if (useSeparateOtpSmtp && (!smtpOtpUser.trim() || !smtpOtpPass.trim())) {
      setSmtpSaveError('                  ! (Verification OTP Email and Password are required.)');
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
      setSmtpSaveError(e.message || '        ');
    }
  };

  const handleSaveFirebaseConfig = () => {
    setFbStatusMessage(null);
    if (!fbApiKey.trim() || !fbProjectId.trim() || !fbAppId.trim()) {
      setFbStatusMessage('[X] API Key, Project ID, and App ID are required keys! (   )');
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
        setFbStatusMessage('[OK] Firebase configuration saved and loaded! (    )');
      } else {
        setFbStatusMessage('[!] Config saved to local memory, but real-time validation failed. Please verify credentials!');
      }
    } catch (e: any) {
      setFbStatusMessage(`[X] Error: ${e.message || 'Failed to initialize Firebase'}`);
    }
  };

  const handleClearFirebaseConfig = () => {
    if (window.confirm('        /      ?')) {
      localStorage.removeItem('bodytouch_firebase_config');
      setFbApiKey('');
      setFbAuthDomain('');
      setFbProjectId('');
      setFbStorageBucket('');
      setFbMessagingSenderId('');
      setFbAppId('');
      setFbStatusMessage('[!] Disconnected: Cloud sync disabled. Offline/Local memory mode is now active.');
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
      alert(":        (Photo URL) ");
      return;
    }
    if (!slideTitle.trim()) {
      alert(":      (Title) ");
      return;
    }

    try {
      setSliderStatusMsg('   ...');
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
      setSliderStatusMsg('     !');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('    : ' + err.message);
      setSliderStatusMsg('');
    }
  };

  const handleDeleteSlide = async (idToDelete: string | number) => {
    const confirmDelete = window.confirm("        ?");
    if (!confirmDelete) return;

    try {
      setSliderStatusMsg('  ...');
      const updatedSlides = sliderSlides.filter(s => s.id !== idToDelete);
      await setDoc(doc(db, 'settings', 'hero_slides'), { slides: updatedSlides }, { merge: true });
      setSliderStatusMsg('   !');
      setTimeout(() => setSliderStatusMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('  : ' + err.message);
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
        text: "[OK]        (users),   (bookings),    (payments),    (companions),  (reviews),        !     (Fresh Launch)  "
      });
    } catch (err: any) {
      console.error(err);
      setResetModalMessage({
        type: 'error',
        text: "[X]          "
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
        alert("            ");
      } finally {
        setIsProcessingCrop(false);
      }
    };
    img.onerror = () => {
      setIsProcessingCrop(false);
      alert("       ");
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
      setAuthError('  -            ');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = totpInputCode.trim();

    if (!cleanCode) {
      setAuthError('     ');
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
        setAuthError('  !                ');
      }
    } catch (err: any) {
      console.error('[TOTP Setup Sync Error]', err);
      setAuthError('         ');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTPActive = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanCode = useBackupCode ? backupInputCode.trim() : totpInputCode.trim();

    if (!cleanCode) {
      setAuthError(useBackupCode ? '  -    ' : '    ');
      return;
    }

    try {
      setIsSending(true);
      setAuthError('');

      if (useBackupCode) {
        const cleanBackup = cleanCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (cleanBackup.length !== 8) {
          setAuthError('   !        ');
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
          alert('[OK]       !');
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
            alert('[OK]      !  -        ');
            return;
          }
        }
        setAuthError('    !          ');
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
        setAuthError(' -  !          ');
      }
    } catch (err: any) {
      console.error('[TOTP Validation Error]', err);
      setAuthError('         ');
    } finally {
      setIsSending(false);
    }
  };
  const handleCustomEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    if (!normalizedEmail) {
      setAuthError('      ');
      return;
    }
    if (!cleanPassword) {
      setAuthError('   ');
      return;
    }

    const isAllowed = adminEmails.some(a => a.email.toLowerCase() === normalizedEmail);
    if (!isAllowed) {
      setAuthError(' !       ');
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
          setAuthError('        !            ');
          setIsSending(false);
          return;
        }
      }

      if (cleanPassword === correctPassword) {
        await checkAndProceedTOTP(normalizedEmail);
      } else {
        setAuthError(' !        ');
      }
    } catch (err: any) {
      console.error('[Custom Auth Error]', err);
      setAuthError('           ');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetOwn2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = totpTempEnrollEmail.toLowerCase();
    const cleanPassword = reset2FAPassword.trim();

    if (!cleanPassword) {
      setAuthError('FA       ');
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
          setAuthError('            ');
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
        alert('[OK]  -     !           ');
      } else {
        setAuthError(' ! FA         ');
      }
    } catch (err: any) {
      console.error('[Reset Own 2FA Error]', err);
      setAuthError('FA            ');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetAgent2FA = async (username: string) => {
    if (!window.confirm(`    @${username}    -     ?             `)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'agent_totp_secrets', username.trim().toLowerCase()));
      alert(`[OK]  @${username}   FA     !`);
    } catch (err) {
      console.error(err);
      alert('FA         ');
    }
  };

  const handleDeleteAgent = async (username: string) => {
    const cleanUser = (username || '').trim().toLowerCase();
    if (!cleanUser) return;
    if (!window.confirm(`    @${username}     ?       ,  , FA      `)) {
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

      alert(`[OK]  @${username}      !`);
    } catch (err: any) {
      console.error('Failed to delete agent:', err);
      alert(`[X]    : ${err.message || err}`);
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
      alert('       ');
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

    // UTF-8 BOM  ensures proper Unicode & Bengali rendering in Excel
    const csvContent = '' + [headers.join(','), ...rows].join('\r\n');
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
      alert('       ');
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
    if (!window.confirm('             ?\n\n            CSV  JSON     ')) {
      return;
    }

    try {
      setIsVisitorLogsLoading(true);
      await fetch('/api/admin/visitors/purge', { method: 'POST' });
      setVisitorLogs([]);
      alert('       !');
    } catch (err) {
      setVisitorLogs([]);
      alert('     ');
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
      setLedgerError('Please specify a valid positive job payment amount (Tk )!');
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
      setLedgerSuccess(`9 Manual ledger entry added successfully for ${matchedCompanion.name}! Model statistics and earnings share have been updated.`);
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
        alert(`   ${nextBlockedStatus ? '' : ''}  !`);
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
        alert(`     !`);
      }
    } catch (err) {
      console.error("Error blocking client:", err);
      alert("Error updating client block status.");
    }
  };

  const handleRemoveClient = async (client: any) => {
    if (!window.confirm(`      ("${client.name}")      ?`)) {
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
      alert("           ! (Client deleted permanently!)");
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
      alert(`[OK] Profile "${compName}" has been permanently deleted from database.`);
    } catch (err: any) {
      console.error('Failed to delete companion:', err);
      alert(`[X] Error deleting profile: ${err.message || err}`);
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
      alert("Please fill in both title and message body /     ");
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
        ? `Direct notification sent successfully to "${broadcastTargetUser}"! / "${broadcastTargetUser}"    !`
        : "Global broadcast notification sent successfully to all clients! /     !"
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
    const consent = window.confirm("Are you sure you want to recall/delete this notification? /       ?");
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
                <span>Visitor Traffic ( )</span>
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
                Tk  LEDGER
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
                <span>Agent Management (  )</span>
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
                <span>Promo Codes ( )</span>
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
                <span>Marketing & Pixels ()</span>
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
                <span>Push Notifications ( )</span>
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
                  <h2 className="text-lg font-bold text-white tracking-tight">Admin Authentication /  </h2>
                  <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
                      -       
                  </p>
                </div>

                {/* CUSTOM EMAIL & PASSWORD LOGIN */}
                <form onSubmit={handleCustomEmailPasswordSignIn} className="space-y-4 text-left pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-slate-400 pl-1 uppercase tracking-wider font-mono">
                      Email Address /  
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
                      Password / 
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
                        placeholder="********"
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
                        Verifying... /   ...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Credentials /  
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
                      Google Authenticator Link /   
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                             (QR Code)       
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
                      <span className="text-[9px] font-mono tracking-widest text-[#dbaa61] uppercase font-black">Manual Entry Key /  </span>
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
                      <span className="font-bold text-[#dbaa61] block mb-0.5">  :</span>
                      <p>.   <strong className="text-white">Google Authenticator</strong>   </p>
                      <p>.     (+)   <strong className="text-white">"Scan a QR code"</strong>     </p>
                      <p>.     ,  <strong className="text-white">"Enter a setup key"</strong>    "BodyTouch"   "Manual Entry Key"    <strong className="text-white">Add</strong> </p>
                    </div>
                  </div>

                  {/* Input Code Verification Pad */}
                  <div className="bg-[#03060d]/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <div className="space-y-1 text-center">
                      <label className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
                        Enter Generated Code (   )
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
                                {val || <span className="text-slate-700 font-sans">*</span>}
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
                        <strong className="text-white">{totpTempEnrollEmail}</strong>  -          
                    </p>
                  </div>

                  <div className="space-y-3 rounded-2xl bg-[#03060d]/60 p-4 border border-slate-800/80">
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-semibold tracking-wider text-[#dbaa61] uppercase font-mono">
                        Your Admin Password ( )
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="  "
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
                      Cancel ()
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
                        {useBackupCode ? 'One-Time Backup Code (-  )' : 'Security Passcode'}
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
                                  {val || <span className="text-slate-700 font-sans">*</span>}
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
                      {useBackupCode ? '<- Use Authenticator App (   )' : '1 Lost Access? Use Backup Code (   )'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReset2FAInput(true);
                        setAuthError('');
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 hover:underline cursor-pointer transition text-right"
                    >
                      [!] Lost 2FA / Device? Reset 2FA Setup (FA    )
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
            <span>*</span>
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
                {activeTab === 'verification' && 'Model Verifications ( )'}
                {activeTab === 'admins' && 'Administrative Team'}
                {activeTab === 'smtp' && 'System & Telegram Settings'}
                {activeTab === 'shortlinks' && 'Quick Registration Links'}
                {activeTab === 'referrals' && 'Agent & Referral Management (  )'}
                {activeTab === 'promocodes' && 'Promo Codes Manager (  )'}
                {activeTab === 'livechat' && 'Live Support Chat Console'}
                {activeTab === 'model_ledger' && 'Model Ledger & Financial Audit'}
                {activeTab === 'broadcast_notifications' && 'Broadcasting & Push Notifications ( )'}
                {activeTab === 'visitors' && 'Visitor Traffic Analytics ( )'}
                {activeTab === 'marketing' && 'Marketing & Ad Tracking Pixels (   )'}
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
                      ,     !
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-semibold mt-2.5">
                              (VIP Clients),   (Companions & Models),  ,                   -   
                    </p>
                  </div>
                  <div className="pt-5 mt-4 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1.5">* PORTAL STATUS: <strong className="text-white">ONLINE</strong></span>
                    <span className="text-[#dbaa61]">Staff Control Room</span>
                  </div>
                </div>

                {/* Quick Shortcuts Panel */}
                <div className="col-span-full lg:col-span-5 bg-[#0f1118] border border-white/[0.04] p-5 rounded-3xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <h4 className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">* QUICK DASHBOARD SHORTCUTS</h4>
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

              {/* 8 DATABASE RESET & FRESH TESTING CONTROLS */}
              <div className="bg-[#1c1012] border border-red-500/20 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] font-mono">DATABASE SECTOR SCRUBBER (DEVELOPER ACTION)</h4>
                  </div>
                  <p className="text-[11px] text-slate-350 font-semibold leading-relaxed">
                         (users),   (bookings)     (payments)             
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
                               
                <strong className="text-emerald-400"> Approve </strong> (VIP  )  <strong className="text-rose-400"> Reject </strong> 
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingPaymentsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    0 NO PENDING TRANSACTION TICKETS TO VERIFY
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
                            {pay.tierName} * {pay.method}
                          </p>
                        </div>
                        <span className="text-emerald-400 font-black font-mono text-base bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                          Tk  {pay.price}
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
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">8 Payment Screenshot ():</span>
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
                              View Full Size Image 
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
                          <span className={pay.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}></span>
                          <span className="text-slate-300 font-bold">{pay.username}</span>
                          <span className="text-slate-500 font-medium">({pay.tierName})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">Tk {pay.price}</span>
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
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Registered Client Profiles Directory /  </h4>
                    <p className="text-[9px] text-slate-500 font-medium">       </p>
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
                        title="  (Remove Client)"
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
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">FULL NAME /  </span>
                          <span className="text-xs text-white font-black block mt-1 select-all">{selectedClient.name}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">PHONE NUMBER /  </span>
                          <span className="text-xs text-emerald-400 font-mono font-black block mt-1 select-all">{selectedClient.phone}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">EMAIL ADDRESS / </span>
                          <span className="text-xs text-blue-400 font-mono font-black block mt-1 select-all">{selectedClient.email || 'No Email'}</span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">GENDER / </span>
                          <span className="text-xs text-[#dbaa61] font-black block mt-1 uppercase">
                            {selectedClient.gender === 'male' ? '8 Male / ' : selectedClient.gender === 'female' ? '9 Female / ' : 'Not Specified'}
                          </span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">BIRTHDAY OR AGE /    </span>
                          <span className="text-xs text-white font-black block mt-1 uppercase">
                            {selectedClient.birthday || 'Not Specified'}
                          </span>
                        </div>

                        <div className="bg-black/30 border border-white/5 p-3.5 rounded-2xl sm:col-span-1">
                          <span className="block text-[8px] text-[#5c75ab] font-extrabold uppercase tracking-wider">AUTHENTICATED METHOD /  </span>
                          <span className="text-xs text-cyan-400 font-bold block mt-1 uppercase">
                            {selectedClient.authMethod || 'Password'}
                          </span>
                        </div>
                      </div>

                      {/* NID Section */}
                      <div className="space-y-3.5">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab]">Verification Documents (NID / Birth Certificate) /  </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Front image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID / Birth Certificate Front (  / )</span>
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
                                  Click to Zoom & Rotate /     d
                                </div>
                              </button>
                            ) : (
                              <div className="h-32 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 flex items-center justify-center text-[10.5px] text-slate-600 font-medium">
                                Document not provided /   
                              </div>
                            )}
                          </div>

                          {/* Back image */}
                          <div className="space-y-1 text-center bg-black/40 border border-white/5 rounded-2xl p-3">
                            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider pb-1.5">NID Back / Document Page 2 (  /  )</span>
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
                                  Click to Zoom & Rotate /     d
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
                                  <p className="text-[9.5px] text-slate-500 mt-0.5">{b.date} * {b.time} @ {b.location}</p>
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
                            {selectedClient.isBlocked ? '3 Unblock Client' : ' Block Client'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleRemoveClient(selectedClient)}
                            className="flex-1 bg-rose-900/20 hover:bg-rose-900/25 text-rose-400 border border-rose-500/25 text-[10.5px] font-black uppercase tracking-wider py-3 px-4 rounded-xl transition-all duration-200 cursor-pointer"
                          >
                            1 Delete Account
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
                           bKash/Nagad/Rocket      
                <strong className="text-emerald-400"> Approve </strong> ( )  <strong className="text-rose-400"> Reject </strong> 
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {pendingMembershipsList.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-[10.5px] text-blue-400/40 font-black uppercase tracking-widest bg-[#0b0c11] border border-dashed border-blue-500/10 rounded-2xl">
                    0 NO PENDING MEMBERSHIP REQUESTS TO VERIFY
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
                            3 REQUESTING {pay.tierName.toUpperCase()} MEMBERSHIP
                          </p>
                        </div>
                        <span className="text-amber-400 font-black font-mono text-base bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/15">
                          Tk  {pay.price}
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
                          <span className="text-slate-500 uppercase text-[9px] font-black tracking-wider block">8 Payment Screenshot ():</span>
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
                              View Full Size Image 
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
                          <span className={pay.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}></span>
                          <span className="text-slate-300 font-bold">{pay.username}</span>
                          <span className="text-slate-500 font-medium">({pay.tierName})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">Tk {pay.price}</span>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Model Code /   (e.g. # 550800)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase font-mono">Select Category * /  </label>
                      <select
                        value={compBadge}
                        onChange={(e) => setCompBadge(e.target.value as any)}
                        className="w-full bg-[#11131a] border border-[#ac843c]/40 rounded-xl px-3 py-2 text-white font-heavy focus:outline-none focus:border-emerald-500"
                      >
                        <option value="REGULAR">Regular Member ( )</option>
                        <option value="PREMIUM">Premium Member ( )</option>
                        <option value="ELITE">Elite Society ( )</option>
                        <option value="DEMO">Demo Class ( )</option>
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
                        <option value="Female Model">Female Model ( )</option>
                        <option value="Male Model">Male Model ( )</option>
                        <option value="Sperm Donor">Sperm Donor ( )</option>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Height / </label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Skin Complexion /  </label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Weight / </label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Bust/Chest / / ()</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Waist /  ()</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hip /  ()</label>
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
                        <label className="block text-[10px] font-black tracking-widest text-indigo-400 uppercase">Penis Size /  </label>
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
                        <label className="block text-[10px] font-black tracking-widest text-indigo-400 uppercase">Duration Time /  </label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Phone Number /  </label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">WhatsApp Number / </label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Telegram ID /  </label>
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
                          SERVICE CONTROLS & DURATION RATES /     
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">d REAL MEET DURATION RATES (Tk  Taka):</span>
                            
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
                                      <span className="text-slate-500 text-[10px]">Tk </span>
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
                               Add Real Meet Rate Option (+    )
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">d VIDEO CAM DURATION RATES (Tk  Taka):</span>
                            
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
                                      <span className="text-slate-550 text-[10px]">Tk </span>
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
                               Add Video Cam Rate Option (+    )
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
                            <span className="block text-[8px] font-bold text-slate-400 tracking-wider">DURATION PRICE OVERRIDES (Tk  Taka):</span>
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
                              <span className="block text-[8px] font-bold text-slate-400 tracking-wider">d TOUR DURATION RATES (Tk  Taka) /  :</span>
                              
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
                                        <span className="text-slate-550 text-[10px]">Tk </span>
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
                                 Add Tour Rate Option (+     )
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
                          Operational Areas /   (   )
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
                          placeholder="Type custom area and press Enter /   "
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
                          Add ( )
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Hourly Remundation Rate (Tk  Taka)</label>
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
                        CUSTOM FEES PER SERVICE /    ()
                      </span>
                      <p className="text-[9px] text-slate-500 font-medium">
                        If left blank, the standard hourly rate and multipliers will be applied. Fill these to set custom fixed rates for particular options.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* Custom Rate: REAL */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Real Service Rate (Tk /hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Cam Service Rate (Tk /hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Make Out Rate (Tk /hr)</label>
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
                          <label className="block text-[9px] font-black tracking-widest text-slate-400 uppercase">Tour /  Rate (Tk /hr)</label>
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
                        <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Partner Image /  *</label>
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
                            Upload Image /  
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
                          Additional Gallery Portfolio Photos /    ( )
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
                      d No active {partnerCategoryFilter.toLowerCase()} partners registered in database yet
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
                                 Blocked
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-500 font-extrabold mt-0.5">
                            {comp.city || 'Dhaka'} * {comp.age} Yrs * {comp.height}
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
                              Tk  {comp.rate}/hr (Base)
                            </p>
                            {(comp.rateReal || comp.rateCam || comp.rateMakeOut || comp.rateLiveTogether) && (
                              <div className="flex flex-wrap gap-1 mt-1 max-w-[200px]">
                                {comp.rateReal && <span className="bg-blue-500/10 text-sky-400 text-[7px] px-1 rounded border border-blue-500/10 uppercase font-mono">Real: Tk {comp.rateReal}</span>}
                                {comp.rateCam && <span className="bg-cyan-500/10 text-cyan-400 text-[7px] px-1 rounded border border-cyan-500/10 uppercase font-mono font-bold">Cam: Tk {comp.rateCam}</span>}
                                {comp.rateMakeOut && <span className="bg-pink-500/10 text-pink-400 text-[7px] px-1 rounded border border-pink-500/10 uppercase font-mono">Out: Tk {comp.rateMakeOut}</span>}
                                {comp.rateLiveTogether && <span className="bg-purple-500/10 text-purple-400 text-[7px] px-1 rounded border border-purple-500/10 uppercase font-mono font-semibold">Together: Tk {comp.rateLiveTogether}</span>}
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
                          title={comp.isBlocked ? "Unblock Companion /  " : "Block Companion /  "}
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
                      c NO INCOMPLETE SIGNUPS (LEADS) IN {partnerCategoryFilter.toUpperCase()} CATEGORY
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
                                  [!] INCOMPLETE LEAD
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
                              <span className="text-slate-300 font-bold leading-none">{comp.age} Years * {comp.city || 'Dhaka'}</span>
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
                            Edit & Publish (  )
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCompanion(comp.id)}
                            className="bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/20 text-rose-500 text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Lead ( )
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
                      c NO PENDING CAREER APPLICATIONS IN {partnerCategoryFilter.toUpperCase()} CATEGORY
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
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Height ():</span>
                            <span className="text-white font-heavy">{comp.height}</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">Rate / hourly:</span>
                            <span className="text-emerald-400 font-black font-mono">Tk  {comp.rate}/hr</span>
                          </div>
                          <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                            <span className="text-slate-500 text-[8px] uppercase block font-mono font-bold">City ():</span>
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
                               CONFIGURE APPROVED SERVICES & HOURLY RATES (Tk )
                            </span>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div>
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Real Service Rate (Tk )</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Face Cam Rate (Tk )</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Make Out Rate (Tk )</label>
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
                                <label className="block text-slate-400 font-bold mb-1 font-mono">Tour /  (Tk /day)</label>
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
                          URL        
                <strong className="text-blue-400"> Copy URL </strong>          ! 
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
                            <strong className="text-emerald-400"> Approve & Send Mail </strong>                  
                </p>

                {/* Sub-tabs to separate orders according to tier */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 bg-slate-950/75 border border-[#161a24] rounded-2xl">
                  {([
                    { value: 'ALL', en: 'All Orders', bn: ' ', count: bookings.length },
                    { value: 'REGULAR', en: 'Regular', bn: '', count: regularOrdersCount },
                    { value: 'PREMIUM', en: 'Premium', bn: '', count: premiumOrdersCount },
                    { value: 'ELITE', en: 'Elite', bn: '', count: eliteOrdersCount }
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
                      0 NO {orderTierFilter === 'ALL' ? '' : `${orderTierFilter} `}ACTIVE SERVICES BOOKINGS YET
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
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Date / :</span>
                              <span className="text-white font-heavy">{book.date}</span>
                            </div>
                            <div className="bg-black/40 p-2.5 rounded-xl border border-slate-900">
                              <span className="text-slate-500 text-[8px] uppercase block font-mono">Duration ():</span>
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
                            const shareMessage = `4 *   !*

9c *:* ${book.modelName} (${book.modelTag})
4 * :* ${book.clientName || 'Anonymous User'}
e * :* ${book.clientPhone || 'Not Provided'}
5 *:* ${book.date}
 *:* ${book.time} (${book.duration})
d */:* ${book.location}
a *  :* https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(book.location)}
d * :* ${book.notes || 'N/A'}

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
                                  <span>e Coordination Hub (   )</span>
                                  <span className="text-[9px] text-blue-400 lowercase font-mono">Live Sync Matcher</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                  {/* Client Details Column */}
                                  <div className="space-y-1.5">
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Client Details ( )</h6>
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
                                    <h6 className="text-[9px] font-black uppercase tracking-wider text-[#ceff00]">Model Full Details ( )</h6>
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
                                        [!]    !    
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
                                        Copied! ( )
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                                        Copy Details ( )
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
                                      WhatsApp ( )
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
                                      Telegram ( )
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
                                  8 DEFICIT PAYMENT RECEIVED /  
                                </span>
                                <span className="text-amber-400 font-extrabold text-[10.5px]">Tk {book.deficitPay.amount}</span>
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
                                      OPEN FULL PROOF IMAGE 
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {book.firstTimeBooking && (
                            <div className="bg-[#0c0d16] border border-blue-500/10 p-3 rounded-xl flex flex-col gap-2">
                              <span className="text-blue-400 text-[8.5px] font-black uppercase tracking-widest block font-mono">
                                2 FIRST-TIME CLIENT VERIFICATION /   
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
                                <span className="text-emerald-400 font-bold font-sans">Processed Voucher Mail ( )</span>
                              </div>

                              {book.status === 'Approved' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <button
                                    onClick={() => onMarkOutgoingBooking && onMarkOutgoingBooking(book.id)}
                                    className="flex-1 bg-blue-600/20 hover:bg-blue-650/80 border border-blue-500/30 hover:border-blue-500/55 text-blue-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    0 Outgoing ()
                                  </button>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/20 hover:bg-emerald-650/80 border border-emerald-500/30 hover:border-emerald-500/55 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    6 Complete ()
                                  </button>
                                </div>
                              )}

                              {book.status === 'Outgoing' && (
                                <div className="flex gap-2 bg-[#020510] p-2 rounded-xl border border-blue-900/15">
                                  <div className="flex-1 text-[9px] font-mono text-blue-405 flex items-center justify-center bg-blue-955/20 rounded-lg p-1 font-bold">
                                    Status: Outgoing for Call 5
                                  </div>
                                  <button
                                    onClick={() => onMarkCompletedBooking && onMarkCompletedBooking(book.id)}
                                    className="flex-1 bg-emerald-600/30 hover:bg-emerald-650/80 border border-emerald-500/40 text-emerald-300 font-black text-[10px] uppercase tracking-wider py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    6 Complete ()
                                  </button>
                                </div>
                              )}

                              {book.status === 'Completed' && (
                                <div className="bg-emerald-950/20 border border-emerald-500/15 px-3 py-2 rounded-xl text-center text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1.5">
                                  <span>[OK] Service successfully closed & finalized. Feedback channel active.</span>
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
                       -            
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Prestige stars rating /  </label>
                      <select
                        value={locStar}
                        onChange={(e) => setLocStar(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-xs font-bold cursor-pointer"
                      >
                        <option value="5 STAR">1 5 STAR PRESTIGE ROYAL</option>
                        <option value="4 STAR">* 4 STAR PREMIUM CLASS</option>
                        <option value="3 STAR">* 3 STAR EXECUTIVE LUXURY</option>
                        <option value="2 STAR">* 2 STAR COMFORT SANCTUARY</option>
                        <option value="1 STAR">* 1 STAR STANDARD BUDGET</option>
                        <option value="BOUTIQUE">2 PRIVATE BOUTIQUE SANCTUARY</option>
                        <option value="SAFE HOUSE">2 HIGH-SECURITY SAFE HOUSE</option>
                        <option value="5 STAR SAFE HOUSE">1 2 5 STAR SECURE SAFE HOUSE</option>
                      </select>
                    </div>

                    {/* City Location */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Metropolis District area /   </label>
                      <select
                        value={locCity}
                        onChange={(e) => setLocCity(e.target.value)}
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer text-xs font-bold"
                      >
                        <option value="" className="bg-[#11131a] text-white font-sans font-bold">Select Area /   </option>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase">Sanctuary Charge /  (Tk ) *</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-[#2271b1] uppercase">Sanctuary Description & Privacy Guidelines /       *</label>
                      <textarea
                        rows={4}
                        required
                        value={locDesc}
                        onChange={(e) => setLocDesc(e.target.value)}
                        placeholder=" ,        : Private elevator, 100% blind safety setups, elite room amenities..."
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono font-sans">Hotel Suite Photo * (     )</label>
                      
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
                            Upload Image /  
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">8 Hotel Fine Specifications (  )</span>
                    </div>

                    {/* Distance */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Distance string (, e.g. 17.1 km from city center)</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">Street Address ( )</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-in Policy Time (- )</label>
                      <input
                        type="text"
                        value={locCheckInTime}
                        onChange={(e) => setLocCheckInTime(e.target.value)}
                        placeholder="e.g. 02:00 PM"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Check-out Policy Time (- )</label>
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
                      <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">Highlighted Facilities (   - Comma separated)</label>
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">f Room Option 1 Details (    )</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name ()</label>
                      <input
                        type="text"
                        value={locRoom1Name}
                        onChange={(e) => setLocRoom1Name(e.target.value)}
                        placeholder="e.g. Premium Deluxe Twin"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type ( )</label>
                      <input
                        type="text"
                        value={locRoom1BedType}
                        onChange={(e) => setLocRoom1BedType(e.target.value)}
                        placeholder="e.g. TWIN x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity ()</label>
                      <input
                        type="text"
                        value={locRoom1Capacity}
                        onChange={(e) => setLocRoom1Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type ( )</label>
                      <input
                        type="text"
                        value={locRoom1ViewType}
                        onChange={(e) => setLocRoom1ViewType(e.target.value)}
                        placeholder="e.g. no-view / City View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area ( )</label>
                      <input
                        type="text"
                        value={locRoom1Area}
                        onChange={(e) => setLocRoom1Area(e.target.value)}
                        placeholder="e.g. 18 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room ()</label>
                      <input
                        type="number"
                        value={locRoom1Price}
                        onChange={(e) => setLocRoom1Price(e.target.value)}
                        placeholder="e.g. 2311"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (, e.g. Breakfast Included, Non-Smoking room)</label>
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
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">f Room Option 2 Details (    )</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Type Name ()</label>
                      <input
                        type="text"
                        value={locRoom2Name}
                        onChange={(e) => setLocRoom2Name(e.target.value)}
                        placeholder="e.g. Executive Suite"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-650"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Bed Type ( )</label>
                      <input
                        type="text"
                        value={locRoom2BedType}
                        onChange={(e) => setLocRoom2BedType(e.target.value)}
                        placeholder="e.g. KING x 1"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Capacity ()</label>
                      <input
                        type="text"
                        value={locRoom2Capacity}
                        onChange={(e) => setLocRoom2Capacity(e.target.value)}
                        placeholder="e.g. Adult x 2, Child x 2"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">View Type ( )</label>
                      <input
                        type="text"
                        value={locRoom2ViewType}
                        onChange={(e) => setLocRoom2ViewType(e.target.value)}
                        placeholder="e.g. no-view / Skyline View"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Area ( )</label>
                      <input
                        type="text"
                        value={locRoom2Area}
                        onChange={(e) => setLocRoom2Area(e.target.value)}
                        placeholder="e.g. 25 sqm"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Price per night/room ()</label>
                      <input
                        type="number"
                        value={locRoom2Price}
                        onChange={(e) => setLocRoom2Price(e.target.value)}
                        placeholder="e.g. 4500"
                        className="w-full bg-[#11131a] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                       <label className="block text-[10px] font-black tracking-widest text-zinc-400 uppercase font-mono">Room Benefits/Facilities (, e.g. Breakfast Included, Non-Smoking room)</label>
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
                    <span>{tab === 'SAFE HOUSES' ? 'SAFE HOUSES ( )' : tab === 'HOTELS' ? 'HOTELS ()' : 'ALL ()'}</span>
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
                      Brand Logo Uploader & Controller (  )
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
                      Interactive Crop Circle (  )
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
                          1 Hold & Drag on the image to position! <br />
                          (        )
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
                        Upload Logo Image File (    )
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
                          <span>Precise adjustment sliders (   )</span>
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
                            <span className="text-[9px] font-bold text-slate-400">d Image Scale / Zoom ( / )</span>
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
                            <span className="text-[9px] font-bold text-slate-400"> Horizontal Shift (- )</span>
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
                            <span className="text-[9px] font-bold text-slate-400"> Vertical Shift (- )</span>
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
                            <span className="text-[9px] font-bold text-slate-400">4 Rotate Image ()</span>
                            <span className="text-[9px] font-mono font-bold text-amber-400">{logoRotate}</span>
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
                              Crop & Lock Logo (    )
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider">
                          Or Paste Logo Image URL (    )
                        </label>
                        {tempLogo && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("          ?")) {
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
                        Apply & Save Logo (  )
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("               ?")) {
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
                        Reset to Default ( )
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
                    Telegram Notification Engine & Helpline (   )
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Configure your primary Telegram Bot credentials, Admin Group Chat ID, and the support Helpline handle below. In case of lost/damaged accounts, you can instantly add/save or remove credentials to keep system notification channels secure and completely organized. (OTP Verification is completely handled by the Email SMS Gateway).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      Telegram Bot Token (  )
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
                      Telegram Group Chat ID (  )
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
                      Support Helpline Username ( )
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
                      Telegram Channel Username (  )
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
                      WhatsApp Support Phone / Link ( /)
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
                        alert("[OK] Telegram Credentials & Support Helpline configurations have been securely added and updated in system databases!");
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
                        alert("[!] Disconnected: All Telegram Bot tokens, Chat IDs, and active helpline links have been completely removed and deleted from system memory!");
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
                    [!] <b>  :</b>
                  </p>
                  <p>
                    .  <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">@BotFather</a>           
                  </p>
                  <p>
                    .              (Chat ID)    
                  </p>
                  <p>
                    .               
                  </p>
                </div>
              </div>

              {/* Live Chat Socket.io Server Settings Card */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-amber-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 animate-pulse" />
                    Live Chat Socket.io Server Settings (    )
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
                    Socket Server Custom URL (   )
                  </label>
                  <input
                    type="text"
                    value={socketServerUrl}
                    onChange={(e) => setSocketServerUrl(e.target.value)}
                    placeholder="e.g. https://bodytouchbd.com:3000 (  )"
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
                    SMTP / Email SMS Gateway Settings (    )
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
                  Configure your primary SMTP Server credentials to send secure verification OTP emails (SMS equivalents) to users during login and registration. Verification is locked to <strong className="text-teal-400">MUST ()</strong> for absolute portal security.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                      SMTP Host ( )
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
                      SMTP Port ( )
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
                      Sender Name ( )
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
                      SMTP User Email ( )
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
                      SMTP App Password ( )
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
                       (OTP)      (Use Separate Gmail for OTP codes)
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
                          Verification OTP Specific Gateway (   )
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                            OTP SMTP Host ()
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
                            OTP SMTP Port ()
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
                            OTP Sender Name ( )
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
                            OTP SMTP User Email ( )
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
                            OTP App Password ( )
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
                    <span>Login & Registration Email Verifications: <b>ENFORCED / MUST ( )</b></span>
                  </div>
                </div>

                {smtpSaveError && (
                  <div className="text-xs text-rose-450 font-semibold bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
                    [!] {smtpSaveError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveSmtpSettings}
                    className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                  >
                    <Save className="w-4 h-4 text-white" />
                    Save SMTP Configuration (  )
                  </button>
                </div>

                <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                  <p>
                    [!] <b> (Gmail)    :</b>
                  </p>
                  <p>
                    .      <b>2-Step Verification</b>  
                  </p>
                  <p>
                    . 2-Step Verification    <b>App Passwords</b>        
                  </p>
                  <p>
                    .         <b>SMTP App Password</b>      
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
                        Google Sheets Integration (  )
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
                      Google Sheets Web Publish Link / Embed URL (   )
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
                          alert("[OK] Google Sheets synchronization URL successfully updated and saved in system database!");
                        } else {
                          alert("[!] Google Sheets save handler is not available.");
                        }
                      }}
                      className="bg-[#0f766e] hover:bg-[#0d9488] text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98"
                    >
                      <Save className="w-4 h-4 text-white" />
                      Save Google Sheet Link (   )
                    </button>
                  </div>

                  <div className="p-3 bg-[#0a0c14] border border-blue-500/5 rounded-xl text-[10px] text-slate-400 leading-relaxed font-sans font-medium space-y-1">
                    <p>
                      a <b>   :</b>
                    </p>
                    <p>
                      .    (Google Sheet)    <b>Share</b>   
                    </p>
                    <p>
                      . <b>File &gt; Share &gt; Publish to web</b>      "Web Page"   (Publish) 
                    </p>
                    <p>
                      .      ,       <b>Save Google Sheet Link</b>   
                    </p>
                  </div>
                </div>
              </div>


              {/* SMTP Email Queue Logs Panel */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-blue-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-blue-400 flex items-center gap-2 font-mono">
                    <Mail className="w-4 h-4 text-blue-500" />
                    SMTP Live Email Queue Logs (  )
                  </h4>
                  {emailLogs.length > 0 && (
                    <button
                      onClick={onClearEmailLogs}
                      className="text-[10px] font-bold uppercase tracking-wider text-rose-500 hover:text-rose-400 flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-550/20 px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      Clear Logs ( )
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
                                {log.status === 'Delivered' ? '2 DELIVERED' : log.status === 'Pending' ? '[Pending] PENDING' : '4 FAILED'}
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
                    Emergency Notice & Slider Text Control (     )
                  </h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                                    -   
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase text-slate-300 tracking-wider flex items-center gap-1 font-mono">
                    8 Notice Text Content (   )
                  </label>
                  <textarea
                    rows={2}
                    value={editableNotice}
                    onChange={(e) => setEditableNotice(e.target.value)}
                    placeholder="               "
                    className="w-full bg-black/40 border border-[#232733] focus:border-rose-500 rounded-xl px-3 py-2.5 text-white font-sans text-xs focus:outline-none placeholder-slate-700 leading-relaxed"
                  />
                </div>

                <div className="bg-[#18080c] border border-rose-550/15 rounded-xl p-3">
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 font-mono block mb-1">LIVE PREVIEW ON CLIENT INTERFACE:</span>
                  <div className="text-[11.5px] font-bold text-rose-250 leading-relaxed font-sans select-none">
                    2 {editableNotice || '               '}
                  </div>
                </div>

              </div>

              {/* HIGH-FIDELITY DYNAMIC HERO CAROUSEL GRAPHIC MANAGER */}
              <div className="p-4.5 bg-[#14151e] rounded-2xl border border-amber-500/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    Manage Hero Slides & Graphics (    )
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 py-1 px-2.5 rounded-lg font-black font-mono">
                    ACTIVE: {sliderSlides.length || 3} SLIDES
                  </span>
                </div>
                
                <p className="text-slate-400 text-xs leading-relaxed">
                       (Golden Border Slider) , ,    -                
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
                    b Active Banner Slides in Carousel ({sliderSlides.length === 0 ? "Default/" : "Customized/"})
                  </span>

                  {sliderSlides.length === 0 ? (
                    <div className="p-4 bg-black/40 border border-[#232733] border-dashed rounded-xl text-center text-slate-500 text-xs">
                                             
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
                    {isEditingSlide ? " Edit Selected Slide Properties (  )" : " Add New Slide/Announcement Graphics (   )"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Title input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Slide Title Text ( ) *</label>
                      <input 
                        type="text"
                        required
                        value={slideTitle}
                        onChange={(e) => setSlideTitle(e.target.value)}
                        placeholder="e.g. Premium Escorts & Models /   "
                        className="w-full bg-black/40 border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none placeholder-slate-700"
                      />
                    </div>

                    {/* Subtitle input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Subtitle Detail Text (  )</label>
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
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Label Text (  )</label>
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
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Icon representation ( )</label>
                      <select
                        value={slideIconName}
                        onChange={(e) => setSlideIconName(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="star"> Golden Star ( )</option>
                        <option value="bell">4 Warning/Info Bell ( - )</option>
                        <option value="shield">1 Secure Shield ( )</option>
                        <option value="heart">6 Red Heart (  - )</option>
                        <option value="users">5 Companion Partners ( )</option>
                        <option value="trophy">6 Premium Elite Trophy ( )</option>
                      </select>
                    </div>

                    {/* Badge Color preset selection */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Badge Gradient Color (  )</label>
                      <select
                        value={slideBadgeColor}
                        onChange={(e) => setSlideBadgeColor(e.target.value)}
                        className="w-full bg-[#10121a] border border-[#2c3142] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-sans text-xs focus:outline-none"
                      >
                        <option value="from-pink-500 to-rose-600">Rose/Pink (-)</option>
                        <option value="from-amber-400 to-red-650">Amber/Orange-Red (  )</option>
                        <option value="from-cyan-500 to-blue-600">Ocean Cyan/Blue (-)</option>
                        <option value="from-emerald-500 to-teal-700">Emerald/Teal Green ()</option>
                        <option value="from-purple-500 to-indigo-650">Cosmic Purple ()</option>
                      </select>
                    </div>

                    {/* Image URL input */}
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black text-slate-300 uppercase tracking-wider font-mono">Hero Photo Banner URL (  ) *</label>
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
                      * Click one premium preset to instantly import Photo URL (   ):
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
                  Metropolitan Area & Urban Locations Manager (   )
                </h4>
                <p>
                  Manage active operational areas in a **2-Level Format** (headline division/city and sub-areas under it, e.g. **Dhaka** to **Gulshan, Banani**). Custom locations configured here can be updated dynamically and are applied instantly across companion forms, hotels, and checkout controls.
                </p>
              </div>

              {/* Status Banner */}
              {citiesError && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold flex justify-between items-center transition-all animate-fadeIn">
                  <span>[!] {citiesError}</span>
                  <button onClick={() => setCitiesError(null)} className="text-[10px] text-slate-400 hover:text-white uppercase font-black tracking-wider cursor-pointer">Dismiss</button>
                </div>
              )}

              {/* Add New Division Area Header */}
              <div className="p-5 bg-[#11131a] rounded-2xl border border-amber-500/10 text-xs">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] mb-4 flex items-center gap-1.5 font-mono">
                  <Plus className="w-4 h-4 text-amber-500" />
                  1. ADD NEW DISTRICT / DIVISION HEADLINE (      )
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
                  2. MANAGE SUB-AREAS UNDER DISTRICTS ( - )
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
                            d {division.name.toUpperCase()}
                          </span>
                          <span className="text-[8.5px] font-mono font-heavy text-slate-500 tracking-wider">
                            HEADLINE ID: {division.id.toUpperCase()} * ({division.subAreas.length} active zones)
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
                              [X] No sub-areas defined yet. Add some below to create the list!
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
                            placeholder={`Add zone under ${division.name} (: Gulshan)`}
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
                  Dynamic Payment Gateway Manager (  )
                </h4>
                <p>
                  You can register, edit, toggle, or remove payment gateways dynamically here to deal with single number transactional limitations. Ensure the active status, correct receiver phone numbers, and clear step instructions are specified so clients receive exact guidance upon checkout.
                </p>
              </div>

              {/* Model Registration Fee Configuration (  ) */}
              <div className="p-6 bg-[#0f111a] rounded-2xl border-2 border-[#dbaa61]/30 text-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-[#dbaa61] flex items-center gap-1.5 font-mono">
                      <DollarSign className="w-4 h-4 text-[#dbaa61]" />
                      Model Registration Fee Configuration /   
                    </h5>
                    <p className="text-[10px] text-slate-400">
                       (,    )-          
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold">
                    <span className="text-pink-400 bg-pink-400/5 px-2 py-0.5 rounded border border-pink-400/15">Female: Tk {localRegFee}</span>
                    <span className="text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/15">Male: Tk {localRegFeeMale}</span>
                    <span className="text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/15">Donor: Tk {localRegFeeSperm}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Female */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-pink-400 font-mono tracking-wider">
                      Female Model Fee (  ):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400/60 font-bold text-xs">Tk </span>
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
                      Male Model Fee (  ):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60 font-bold text-xs">Tk </span>
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
                      Sperm Donor Fee (  ):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/60 font-bold text-xs">Tk </span>
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
                    Save Registration Fees (   )
                  </button>
                </div>

                {pricingSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10.5px] text-emerald-400 font-bold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>        (Female: Tk {localRegFee}, Male: Tk {localRegFeeMale}, Donor: Tk {localRegFeeSperm})!</span>
                  </motion.div>
                )}
              </div>

              {gatewayError && (
                <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl font-bold flex justify-between items-center transition-all animate-fadeIn">
                  <span>[!] {gatewayError}</span>
                  <button onClick={() => setGatewayError(null)} className="text-[10px] text-slate-400 hover:text-white uppercase font-black tracking-wider">Dismiss</button>
                </div>
              )}

              {/* Add / Edit Gateway Form */}
              <div className="p-6 bg-[#11131a] rounded-2xl border border-white/5 text-xs space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] flex items-center gap-1.5 font-mono">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  {editingGatewayId ? 'EDIT CONFIGURATION /   ' : 'REGISTER NEW GATEWAY /    '}
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
                        <option value="Personal">Personal ( )</option>
                        <option value="Agent">Agent ( )</option>
                        <option value="Merchant">Merchant ( )</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    {/* Wallet account phone number */}
                    <div className="space-y-1">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wallet Number ( )</label>
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
                      <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gateway Logo ( )</label>
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
                      <label className="block text-[10px]xœì}{_ÛÆ¶èÿ÷SLho1»±ñçÁ	i )gá iw/‡“Ê–°ÕÈ’$‡xS¾û]kF#¤™ÑÈ@BR´»Ä¶æ½ŞkÍZ$v>ÅÍÈ³b§¹Ñn“ùlæ„#+rHZ£®?n^º¶Åä"ğãæ0ğì•—GÖbêø19‰ÙqCg»‘ÆÚ‹uÏ:ŞËÿC¤Ï×ŸÍcÅ„Ä‹™³µ‚3ZQ¾:ÿ;‡må-oîl]/÷ü(çlj×Ê×{bùchÑpÖÈÖK9ñ›\Û†ÓŠ­pìÄ-Úõšº¯™gœ	l‘n­à'o“ƒÀwğá4ü´·Cˆzi#ÏŠ¢Ck
{pÙ¼˜{›CèóÃúF›ƒúMş4Ï¾ëöºO{½ssßvìæ'Ì>57ÈlÑì¶ú„ëåÄqZÉI?é·á<Góh3˜Çë;M&™|•Œ {Üì·ÛÙ¹³.?Eª¬ËOıÅºí~”ı”ü û~wãÂs>‘±5kvÉŸó(v/MÜØYÜì®È½rl7à}«½´{6ùáÒPAåpÇ_–ì%õé yîèÀ£+å‹Al·0¿†ç½öúFo.q?««/Î§C'4z5ë&œxØÕWÿœübğşo–ç9ñ)ìbcõÈ	£À·<ƒfûÁ8xzú)]«±Q  À#øÏ  'ÁG'ÜL¿z
¸ "Ë§fŸã€Z&õq!’HlvÖiÏ>çÉeˆıÈÅ=%£9,9lÎ×P@*’IÈ¶åO»ë.åÍ´JğÜ£ùpê*ép~oÇ¡e»ÀšqĞŒCrSJ>ÂnÃW”’ôùÆ3käÆ‹æóşçÜvb€t6£‘å90¶|aªC(““ŸÈê‰õÑ!É7„1‘h•l’ÕcgìF8æ¡sÉ_XUœ„æø„óÅúEN‹ßË‰éÕú?€?GÀ „ÏÊ±ùœ"âÁ7äëÅ¹é/ñÙwN§×±2~Ó…ãÉó$z’ëpŒÍV_B˜_Lúb¯â12&ƒ¬N#°ßõGOûÖğœ:Xb·û¼÷ìœÌ†Í™RÎ³šFÍ‘Cá ÙH€Œ8ü€uë91DÊ¥|åÅvˆ€°m…vYo	ü?™Ÿs±ÏùŠœ!n¿;>Ş=<%ƒíÓ½_wÉÑà÷üøfpºûÛà÷²¿wrJW3&bñ“jy?'×kp˜ô%LTÑÙÚÚ"m€^/,û¬ùŒ­)Ù:ATLƒÈ™º9á@B‡àcS’ÌÎ!A+tWCøÒ[€xÇ¡´Eöüæpîz1±k‡ÿ´¢Écrh-û1±@8Fœ˜L)GŠÈ¥‹B“~8·¾5uã½EËÁÖ ‡M¶gº6Áÿ4G5;djof»Ä{ğ6TâJñ´¦Ö¬ÑSAB)µÀt”<ãƒ³ ¸åÚ&ìñêEQ’#ş—J^C'¾tŸD@Çæá>#ºßëÄ˜O4 d˜hŞ"H[SÁ·×Oñdo„»õN{Uß~Shßá‚3 €qô¤½ª–+şPíœšQD ,É^©ÄUy{ºÿÅmgÄ,$Öv¦è®DõSÂàÈc¢˜‚nè‡½*2ÿ'ÀERÁëy»¨Ôd2Ú¬ÙòÂ…\6'®mÃÚË+à»“|Œ&¡ëh¶+×D'êNÇ$
G[Ù¯‰åÅ[++UlÂşÃ?‘EŒ€öY®¿ôêÂÚ ü/¶V|wØW
P˜„J;EºíG­Ğt‹n÷<ãŞ)ÈXDÊËÎòŸ “ ëo´“Fã®·Uı¼0èŞlöKxş)…A²z~Îıl™ZŸš— öôPîYy	kå\¿XÇ^—üìY«Ÿj„#ÉKÈ™x"7
B t·3¡Û=F£iÜÏõ©!.·Şq›¯Éî É+…¾ú#Ùb395Ä}ív•Ñ-sÄgÜºLUe*©eê²ãáÃ¸&ÈéVç)
ÁtÖ®o»ã€Rş,“Ÿv«ø)>›’ÉÆ@Úfsë=ë<í>Oæ6C:RıÚx^œÛÃºaÕİnÒ·3uBË³%İó_’´€`À³mÑr5«-béeÍ,5ÎDåY¡šqA¤S%;(ÈU¹ó4Ñ·(ŠÀ+¡ÅŒÅƒÑ¦“£	š™]ÊŸSètòGĞã
¦€lš]>MFoé(®ÁqÌÊ|ÎHqDzeãÜ|Ğİ­Ä®ØœŸ5’¡tú¢tFb7ö*Ì‹ölıŞßÖ.r¦‘h+v †Äšˆ	<Æy‚¼fƒ’¤×"“Å­ÿƒœã±ç“K7MÈ+jC‘2rs­°òâcféÅ§†µ£Ä†ÕÚd‹Èô=Ü'“¾q/}ô;J‰QÑ[3h‡Ş“xúäŠ´Z-ìá1á*Ù&yÄºä*ÚµÎ@ËjÆŒ‡=Wuw­µãƒËüwtòh²zEÓFr*•ÃëW«1Dã#Ê  ô(¦‚7.	Ô)Í‹‰ªİ®CìyhÑİŒÏéí&Bs‘£İkwûJÖ›ç¹}n€/ÿÖïëù1>Œİgd£ÈŠ
¬Àr3HÅÚJa@ó{5=æx›FöáÔTŒÖYkè9¶Â>ÌÌJ\×z 3}V°~$¯è2£ªftµe­M[åş4J«IXæUcŠ˜qæ_ãÒ„i³œ¯-Ï¤M»H¼o\y"VD,aÚZğÅåzÃ^*¨É›;Lªe€(ÈMú2uº¶c?LZ¡ €‰¾I¥ºI»Ê\z@Ñ'øßJÛJ3d<v¦°	_:V	;®ç•Ê;\’yÄ%™jP¾¡$psYÀDöÁI–ü†õÄµ¥„ÆfùF¹&urkäÚÕ(`OÕ™İ”º¡£ûyí
ò–ÄÒà””áçuÃ¯z}!:wÖëß˜æí8°]Î-Q½ÓĞŠ&İ›Ó=İ;Z#ögÍkRû¯Ê	Xò‰—ß+}„OH»·–{
cvö÷NNÔg<ØŞ~ûîğô„ü@vöw·OßÿNŞşº{üëŞîoätğªĞ|ÉIXÍÓ$N­!³şYöÄ—Õr`UQå6§'‚§=ï;¶|wŠÿÂ²=¿$Ÿ>â¾îÏ?ÍÃùÅ±Ë^Y¾ªBÂg0›BàJ·‚†ÄÎF‰|hÚ6~HÙkndáöĞ²tòÜÀİ#ÑÄ²ƒKúcÁŸ%‘(LØF7Üİñ$F¯K0Ãÿ"A 2Fü5³èåîÍN›$d¢é|„EFšÀ†“‰ëxööÄ}(`v»Ëc’%KÑ\¯2Ù(É¢©Â’E½!÷Xª—€¤IE˜¶ß¾ŞÛÙ=<İìçĞìí!É ëe¤a’µ–íì\z‚	ğ“Ã-— !Ì§Òıâ„Ys2²|òÑu.§ÑIÂ‡Á‡D‹)ŠğchÅğÛ¸ì˜kyQ.
BŒÊµˆÈtB[gá- Äã	`%±æÀ C÷ßğöîÔr=sa c÷Â…/O± MÉ,@ªsZätâ ‚…vL¡	° Ğ….õ›T|,?&İ&!~{zDÇÂ),Æè&ˆÔ^D‡t<ı#¸@6A ã¿ÊQs¦ÜˆYÍ‘ßèSÈ{Rá}/}¤êuNqí¹¨°î=iœZœˆtÉ6 ùT@©tåã±cïù´Ñqà9TT^…³rÂ÷ôW#z`M°œ&¾ÑGÅˆ 4:©E$qù°¯XÊÂE‚=UÅ[É|Ú$HnŞ³–¬‚E‡Tû°ELiy±)Éú‰RÄÑˆ*–¨vÃÈbåò.f¥ÿ1]]_³:*F#'Š ,ÑÓ>BMm]Á|id¦øMâIb3óª|æ³)PB½Aªq‚pÎ0f-ıV9Q…7£*
½øµiX£ú¤V°äY»ÕŞ8/IıICÁ*KA’Ù°}'©†Àê=ğ*Z¬a©¢ùÖõ±æì_yóHg©Ñ1ôª^«§vLş™…JÍÛ¦ôÿ„1íÈ‚5
û>H‰ŸV¸¿“ôªtüé(™Î#ø#“}ş	(ßº²¢…?"ÉmµÄiÍB*·î°èÏ†FÁg'lAÃ$œô”ŞÚ©jå `³‡÷’ -vÑ®„F¡ˆ„í=8¨Æªï\ÒÃ¢bĞêÚK9=Ø§ívÙûUÅ‰°d<—®–.Aá„2X“±P¬ÈÆaíšğ]u1^×QÒ îºLòWËCHÏô'vië§0¹icşûÁ¥në Ês²c}æ¯Ğ­ÉY°^Ù±$}àäe¹¿åšşk yAò »õWú‹é™°As'Tšº²+4`>Jw$î~†Ñ4-Ï	ãÆ*şó1şGo­c^cÍ¥õœP ˜ÑYÿŸ³ÿùïèçóNşşw+ùÇ÷ëê1²ÅÓ~Z1ÈI¾kÆ«½Ëµâ…à!ş/Hß|zw:9+¥˜Q+
¦NÃB’oµè6æ1‘Ú”–ÙŞ;]€ğ-ªõE¿¹ñ¤±úójÅó´Ş'?Šß-=#qBéy÷ê€cc“ülcõJr>LÜµ;ÛÃÔ~İÌÖ×É	*õ· ^§Š'NJ­@Í'nx„‰ŒøÁ¥¦»Œöí£cçvŞF{ø8¡›ïyßÑêãÚt‹·.-/ÅĞc#ëù1¹Jç¹™£¶ú0–´»m/˜ÛĞ×Y^C3;ıH•›A;Víc¹­ú}\áÊ¢ofÒ¾Ìá{SÄ}ä¨›œÅjŞ¼Æ­ÍcoÇ!0Ş›Uië¾š]ĞC[5sƒfoÔ8kµZ"9O|¸‚şH$è¸õÅP¬2¿r}®=%*lp´ú§œ½ıç9|ZùşŠOãz…4¾¿JF»æ†Gèî“‘…a‡'7iØ„öì¡û¼„ØÆ`¢«gÿ:¿Õ^Vü¢ôfJQ5ïÃbŒ53¡_” ´|iã^Ğ,¹@gv‹¢xeT#'»6Ê]zõ\4¢³¢ùŸüC£œk3^Tæ¼à±u®YŸîCNÕ½^™'£®Âi[Dœ‹‹Ÿ‡½ˆƒùhÒSİË%¬ß-•Çâi»_™Ç"s'‚'¥1äúÊ$U¡Ò4f™;KŞENˆ§ù!Oy}ˆ:w9ú|1EÄá³¼uÜùEé÷ÁÅˆ4ÈÏdío‰7ì¯…DÔ¸{h4ˆ"wìnDúÆ(YÓŠ²E~&&T•øìn•1z‡`Ïúè†})3"^àÿ–u'D]ÈmvÂ`f—º°Ò¯è)ÒÜk˜ƒÚ!pÔ"ÃCrñ^Ü-@-'ş“æYŞ4RÔ3ÂÒ¹­PİsååÎîëÁ»ıSªCóÍ±×jô”ÔW^¼İÙ=œ¾=^®'Áh¿òòäİÑî1Ÿ1èîÅ:ƒ®åñ˜9ÔªÃÍò›é>) S@Ç¸Ÿ¥~Ê 'QjÆó(jv:I0,ó¬òP½Rú'ysÍ*Ó?Q­¸
Ué¬f.ôÄïù¿Ò®w”"æÜ•jUŞmBhÊ©ÈoÈ…hî¦är­„tÁ¶òDRìULlé;Œ‰3	.²i96Ó¤#áÔÓG8é‚*zKTÌÄŠ,öH9XJQ¼ÑZTÉ§T‰Unš–Å,.#E<ó¨ûu»o-(c›…ä‚‹ÍciMƒp¡!àw–q£¨éOŠkôÅ´k™èY„¢ĞÁâ—2÷!JE¯¨ÎsõÑÜ¡'ZyÖ3rr:xıšì¼Ú=>Qì€ê6¿yšÑ,f“´€4³ñŒîR¶½hZó8 Ñ(<oh…Íx"~œâ§òMÊ*ƒüd¦y¿¨Dñvø§6@Fptl;ÄP¾-Â[2ƒ¼ÊdœGùÅòm–…Æüoğ³Äï¡Å…;ÔVF°NG ¼QKÚk~˜¢•üTz!MıÓÁ¼ü¯ªÁµsšÉ¢ú€°D´÷ãòâJ<Ò«'\ÏsÂîÏcêãS¶Íllò°¥•ÍÄ,×§ñŒŒÈl‘eÆ¯d›gÓÛO‡‘hW•¹wŠA2Šñ0FfhÙcçÈ z¹Ù¢NĞˆ¬œdÚè$^Ğ3Q^ç.çnÉnj«zGyvŞÅ(iŸ&·!ä”t4Á6¥…ˆ¢¡hë—Ö’½ÙU/çš8°µòªÄ¨ Ã5ğ&õV$¤İãâú\v6é{ºåÔCß$y„:ó™6b’Qzİõ>YRn_)cvJwN…Ô½—™G¯§ÍåP¸µœ­4)frfe>€²¼ù¾ç¥ |Y`äx¹`ƒªƒªëß‚Pa –o	åÍHi,5OTW}Ë {ràÒBä n´×€ ¾C†Äª4OÕ)Æ”‰"ó÷â€ü4/›L~¯LÙ¤8pÚö2´fË¤~¬LvWÈù—&ZÊ¥eb™ïÒLF9Œ|™ÿhšïªaz³Å€¦§;AĞ‚³•0tÀ9¨Â¶.\ßnD´ ²{ôšcÔré¥ªÙé–¡İe¦f¹y­qš‡—¼Mº¨$‘âS„$cŸ:Grü«~_–ò”
©S&’Á	'y³9²¼{ù•M£”‚t•Eˆ½¤k™äÒíd–Õdéè y~ëÒ(ƒç²£¢H.®æ@/YöèMr…&+æ`¼“ğFªZÖùÑš1ÑMrkâcr­Š|W—Öá1`šÊJv‡äÆ]I–D‚ğ¨$Ğ³/å¸Iò\ŸCö$¥N¸hX’ŸRÁŠ££> o¢Måë¢Ç±›Ğµl¼,ˆUÔ“ñk­@Èœ¦A–“ôÃÈ­±°¶tûÒ«ñÇì\…QMÒ­¥±*|ÊAæÙRØ#áñ<Îùi½ü–ïPAæZ©ÊË­ÉlÇŠÚÃö¨Ó>7ó²e"ëF[—ÅM`zyCç—\½$øRr©O­/MÙ×¼jÊ>oæ_º­ğ´eY¢íÛÉ,É½üıU¦~äeÏUªå›@½)ã7É¹mŒ7	ØIÏ¢Íõõ¸5uÖ¿¿*˜	õ©õøÃ˜ÍÖÊ{Ø[ÿƒ	V€x…Ùƒ™ƒéAü ÍÌn¢5ÔI±Mï¹/,¿˜Ô‡~‡¹2vò.~ˆè¿æ')~¶1!ı(&]+ÄKr(TwciÏÈUŞk’¶Ûú9»«óôÒ¸±¤HİEàş»~„	wGXË¥"q¬RÔä¶œôšu\6ßÀ:eµÍ,Ë¦oä9ã"'&İ×Ğ$ÏaÆFExaóD4rVe•3—‰«É'u&„S˜%‹².Ê^¦Ò²d× ­ÊGÔ!øÿÔBû¼ß/géL²åÄ¬ìµĞÊôÙl¨^.+‚à"Kï§ZŠšªl^§`A3×¥’	fO´‚Ù“&Ln†×”éS‡VèN§ÀSA’§w]M/ÿJVq‘­ü°‹46Í¼†¦
W¯â ½œHìx‹Hœ»™ñHIªßæÅd¹t Ñ‘°¡È”´!­Ş3§é?Ğ"E—Ü&„ò–©ÄÍšcÔKù×9Ùæ€~'³ƒElâôÂDˆ(²Æ 5Ô›\wñÖ—„J™ç^L†4SÌ,((¢K)K˜X‹Tr	”‹–…P¨¼ïÁUMÉ!¿;‘)‰1H˜{ÿó’¤¯	«†‡Û8duuÊv®:å½:äÃàNÎØØŞhø¢±RW²êCUí,ºìQAH¦)RÖË)\›¨Õ7¬$­k!¦KMÂÔ2a¯DßğÛ¾VF+XUÊ¹¢keÔ/¢Qxh‡:é&Í³."¥($*òN1÷À¡‘Ç7¢a+·gúI%J#¼2E×r9ÊÂïšÜ ì¹*™ĞjÌåë"˜å++yª¸/ºF‘ ¾‚êêÃyÚ»Ìùœƒ”Jè2’Ñß^¢aãŸ:H1İ1#=ÂŒTRısO®'‰…‡\Ç|‹º¥ WF4w%KT¹ÎdafÆXùÎ$»%“òh6Kø&„=» ´ræ^¹CÆH[MõUd.«­.£¯²ìŒm5ÍÎxC]Õ@[¥¹©Õº*MOO¡–ºz
k}ùpY	ñÔÖTq¥†M¹Ş**¬•É¦ÔCğJ4T?ïJK298´Ö¬Ãc4òsuM:<Mì L¹®¶ªH0!Îp©.•ªvšªCœô†Ğç¹éÎ(—!&‡¹¥•Ø%n0P¥³=õ´ø[bÙSC7×)n	Î§íßèn¥­ÚVG;¯¯Ÿ
\ÔÒKq;‡}´ôzn¬©/a1ÕÖëjìuam8[RoWÑ©¥ôö[2H“<sı=-RR,\Ân¿(ó‰çB)ø÷êê(÷ZŸO5ú#'œZ>U4@Ÿ¡b1åªdo‡ÆCÓôv6¿XfÖ¹1Jë²`ñ†Á…R‘ÙœNT™	Œ	úÉTy€™[ôĞáùdbÛ‰È£X±³,ñ‘R]29DxÏÊ}Qå45u™ª/¬˜¨¨¦$°ñ³“º„[Wnô&Ù(Ìöo·¯š–,­™;Û€îÉ§×À†”1¹º†Í6	»|vvZÒÙy­ö+Œè-¨WÛ;»¯ßüòŸÿÜ?8<ú¯ã“Ów¿şö¯ßÿ_··ÑòôÙsÃ H¿Ş–r¡ÓöÀŸ¤~üÑÜ«†Íq]8-ã¸Ëtà?ÙÀÂÀÏàO	öÇ-¶-ü&ÅOZ^„ìŸ@«í uÊ$ï±Ÿæª†1GÃÃmÍæÑ¤ÿ45wWY/yçwç~Î%İ,èjC
îïéÚŠ>äªt”âì)ÜÓ?ú“Ù“NÇÄÒzIvà]àŞÉÛv}³šèãS‘2{°ğUÄs:oÃÍ„>~uË<¥XZ.«Tp›ì=Ã°Õ¥çùü’«g	“£‹#o2&·‹¿ŸcÊÒŠ”Å%fÉ(±bíDğÁ®ìÂõ±üĞÍ©ú…åE†ƒV¾c —s¨aéW”„Ó/Kn,ú‹LNàÂ°,¬ğŞJÃ‰Ì•ôYÍ&d§»S‡E	¬…VÕµ¨Ù!*qïlg?´Z-zk;hgĞÓš¶ 3>fp•¬$•b¡¯,<ƒEšL@JØÊ®
)ÇBÊ³‰¿$m#©³`ºŸ±D-)Ä—ÜÄ÷Å?<çzì*Ê VO¢~æ–tVX,ohx=Hé1‘Fı§¬ò:7:E 5a°æş˜ûı bØµ,*ááLŸ\:{ê>h
a•(y‘4§)anÍıO¶½ 2QìÍÕzCk,NJ_¨X®æãåFU,³ç‘Á:”w„—ªª2nYÈßXÃyy%¥Éôšò…ÇÄµ?QÔ©ág¦ù°õuM")dÌRút²JÇŠœ½sÑ^¸ÁP¡Oúå¬ÎÎu¾ˆÃÀ—€)%¯… Œô(V^²= RH{xYÓGı%âëx‘}ë£;Æ8ßÖÈsgÃ ¤…Öe'€W‚êh»ìá"?K”O™•åfÏrñ®Åhƒ‚Ä«º#0ÚÛmÜfÕ15ì¹£àFyµê¥:3áºÀ»ØòôSŸâÓ ÷™lÉÒ?áœ«ÿ­Éª”ôˆWS÷MÁŒ@®X
W¹,ó-g´®ö]”<M4@‘EUNÙdéa`-ôü ×q \‹+7)'¯8ñë:¥äõ‡¥ß¢:¸ì8˜¦¹¿#²k»xc:~Ğ¢r˜FÌ²„3Í ºú”)Åä
O
šßnR³\˜!ˆ¾5kcuuRIi`]LuíYuÖÆÛJ|É^·İhæY¥ôµÍóû* œ¸c¿¹—%Û—#µ:æRI0›D)”×Â0¢¬GZ«©iÒú5H…Õ…:-q¿PÔ TgV­²Dg:Ê¯V­*§ò
œ¹:—µJpfSÎ*XÖ¨^Y®\™t¥¶©ç‹äi
.éÊá)Œ}¼P£i‘F³KLDçY½åâyÆ…óôEóD'‹P´‹;W4¾•êÊ`5<.æ5¼äõ»”Ç(“#¤¤Îø0µ7³=ÊQ7&çø+’	+Ê<4?Š–Š=ˆÖ¯ŒKM£©IlåeB K)Äim¡}Â$V !O<UÒnEyiü³ïÚıö³N§˜5FU„¡')'’OúWUK3i¹…z¥Û
9VV^6›$Ù|¶áÌmĞlVeX¹*æcâÉuõV*>>5Nåó_ó„Vù¯óüB›¥Ø¡Fè×/N¥}ëRÉhÅ¼/ŠZqQ§0À*]Á RAV¡TuY¡
¤+×ÙÊ2"3ß¢ªã[D×[@ÖÌ2œVI„zùnM™ĞÚLª”÷2]…˜->³Tœ}7zşÜêwÎES…®šG[RÍC8
ÁŠÁÆ ‡ÜxÑ|Ş.š5•tjº¸[ıš¤+&Û—…XKšîş«‰·|G¯½¤h¨ 1j³ˆRÿ‘UòiE¥òşi4?l-÷Ç$`ûdpt´¿·=8İ{{xB~İ=Ş{|B÷%9¼*´Zrì‚ÉãŠå»<µ†,¢àÅ½À\ >’Jy~’ç<Ö—HuÙ¾²Ñâ–N»ãÉxîôs¦—¢}åîÃT¡Ÿ»è4«ô™¿˜l¨Ó÷Êp‘ßh©S—„–‘U´¡8±!øöivW†`†rf3/9¬ˆü*9™#¦Ñ˜lH/µ";,AfapÁ¤‚2²|Û¥È‰É‰âMÄñi±Ø²€U(æS8»ˆÖÂ´Oöâôí»í_Zä÷`N¦Ö#8f(UYl=~Lt=ï¾ÚH‰èX
œ2ÄıÇ€c'üè‚mqå„†§ğúlW =«r\À.Ì~â'Í(¹N¼`)Ü#ÒØÙ=xû˜ï¾y·?8~LwöŞ<ÆQv÷÷Nw×Ø\˜glÑu˜iˆ1ëğ‚íŒ¨ËVë!vF!ì=ªÿX"6G-É”öZmâ<N"ZWƒÄ0ødd·,(>]âÅgƒ)>FÈœíSfïìÔ 2ş#zMHÁã¯4Ô	É²³€ğº•—§Al¥ØàÇ‘¦Â‰<G·W
™ƒip‹YºW^^Í@U„‰eÒœØ¼Ë6Çå<T¼ékÜû× >x#H·±ñÜ\oï“›¹#ªPZ˜D}„z9WœájR+$ÿ]ztG¬ó¿Ã¹Üê©¥î¶¥OM84zBóó9&S²ÛŞÆÍæáÌ»!bH˜âÏHÍş^Óñ#Ğ|xLüuõüuÅ‚#S{“ş;.sÖAe€eÒ&ä«•íKTCì²ÙYï¥ÙíÓb¶ÒÃVªŒ‰µˆIPl¶r«M)å9Æ
­ùLæ
ÛOÎ‘lN&Ü¡Mä1™Mß¡"3]µZò©/WæU´MxÍçX\l£d ('~Ò¯.óšJıºØC¹A"ÙŠ²;´èåãeªTX '`õgdıª\zÔAÎ–áñ°©(©±$ç`O€áq]˜Ë·n”³è£'BŞéÍÁæ“bjÃF.«Ñ¤É+CñúïÔœ)™¿Â:•7Hö÷W^Ò ¶M.hëUÛB¢ ”æjwu tt°|7WÉqÁªÔöf-‚¸1œk”ğ™/€n¼,n¤-Íhòß
!àTMájD_¤>™‘Î“sÅŒRïËèú%ü_?†Ü?²´²ÔtCukµıº*^Ñ(>±(¬ª|µ*
¾
GTİ&ƒlõûU_Ki)RmR’~ÎË˜Bz+w§TVq,“ğñ®³*…	¡c1û¥`)3ï3ƒD.–@Ü$®–°3ŸPÓİÓã»¾”j5©jI›{¥†WYW±ì®z“ä–ıÑÓ¾5</È5ëvŸ÷e§7TUh‘‘ÜÅjÓ®ª‹§4êf²İÙwÎÅ<ç
‹îà·ÁŞéŞár¼ûëŞîod{p¸³·38İ-ñeAde¡)ô–D\Q ¡‚ôÚ^0©‰ ëkŠñ N”H´[ä‘¨[ İEåƒ¾iU!cšë¼9^4û)–úë/E¯tÊº„l·Ñ=ÕX–ï^¾•ìf*®o™øÌÔn$‰´ /T•©KÖÉL€g³H	²tø*¾3±>XùaÓ†ò!“"LyXúá‡Òv_ARv oÃp2õ<§×VÅ/UT	,™ÍÎ“\SÅe¶¾<'d‰”eU‹2™mE“ôF‘P9ûYæˆïá-Q£#rp@¦TN·Dgİmü“Œrå‘;ZØ;e¿F²Eê q9#—›ö*o˜å‚¼º”²Ë®Ùs•Â•µ¤Ÿõu`Á1([ñšÉûœ¨ßG}§PÁ&)†aÜ:l7.>£håÚçˆUº‹"Ô}µÉH*ı7EÃÄµªËP®²¤!õšA;€¥vU“cÇò„føÑ¤ÉûÎ¤Ğ
¾1jØ-5ìš5ì•öÌ^øÅ†~UÃmk*4‚OUöÑç€Æ6)4k)~­ë‚NîİLI…o‘hÊ¾n¯k† ä'ikm“MrvE\{“¬º¾‹îqËkvV§õšá‡ù(
|W€À(KPI®Ï«wv½¼üËÂ^ğ¯—Ú
Ş¸ÎNŒ¬iq#zmràúQy' ÿ÷½öß3]¼8å](ıZØÒïKíK©—:äAãâuÉµl8Ğû®Õé³Ry­IÃò„êz|fqÚÜ }èê1jıIğsÅ¾T•ÍÑõŞ Vıí¿V‹Ş£ĞgJ™Äfå]Bè±›ªœEgt½Ğ#,TûªîÙµ.%•é9F#gS‹Cå†SŞ†ıpAøu`Ë#š<…$1(L¾	†bŒ‰ë³Ô‚VlÑ@=³.—VÅm·|* ¥V#ı :‚“¢‚grjÕ	‹xUÔŠ×ØéV'£JE„&,T7âˆGÛà³&\JH›UÉ	ù¦‰´k]!/:èJ:ĞË…z’ôòC¡&Eä;ĞËY‰4‘6®'²†E©"íÁT®`Dº =å »gZŞ$v'²g¡·”A×êLÊî„^ËÏ°û™;¬ÃşÆ˜E6Áô£ä[ÀbşBÒ!¼bn¯Š+*ë¯A'”`¤ëC_š8ğY4mº"³zÄ@TOCw<ÕOŒ%ëÌc«cğHóÀ¢äÒa«¨^¹E#¡—Õ9ú– pµÉÛÒÄí†¤í†„í†dí†DmI’vkíVÉÙ-³‘2=9ÑbµšØh¨”h´Ø.lÜ–vGëô™nà–ncëôXŞ¾-£ıÕˆ©B|Ğ@¥=¡$İ%mzâŸw¶0Ó`¯¯Š‘Wdï¶sÎÌiz*¦5âQõ¢¿*N¯Ëƒ¡Ï@¡ºD ÷¤‹OÎ]El'F.dPWY<‡wÆèÚPdW0Éu÷Â+_İ0ñ³GÑám…×ü¦ßD­¹9¢	¨mÓõÙ$ˆƒf§¿±Ñn÷{^óù†m_´»ÏØİŸ.·@÷]1É£byq2.z_jg^é /«#FE& ĞÇË·6ÌŠ³bãGíë7Íëdl/¿àØã÷ÍrJ.ˆDSEìxK!å§ŞID£}×u†öÅ…X–]–,»¹Ã¦[cjUşy(â;áêuD‰Ò›&’÷Tøiº[º²\Êà[±b‰KhæúrµïèåÂwôk*%õìĞ¸ZãÔmW.<Ã³¯SøúwŠñ‚ç¥á¾©~1ú†Û”÷3ŞöŞ˜f3yÍ¤ÈBÂÎâ8t‡s<Şò;>õZÁÆò¤Wçå©5…D2µ	h.îc&dxæQ2škÚ…¥ğ˜øLym¨"x–‚× úÕ8ié˜Âå‰c}\pˆå³Éï¥Ã/ôoI÷|SqÜñ$¾³}Ğî¹É7²©hÙ î†»ÚX¼`¹xAÈø‰å†äˆ¹9ã¾ewàXÑ<d	”n‘Èm$éĞ¾÷”%úÕ€ÎoaHcíÖ!'İC:G—l<¢ÃõÁ-ƒÏ×°á¯B€ÜÏ¸áC¼èü÷İîß,÷sîö%îï»İ¿¸³Ï·Ùìn¶Úœ½r)İ‘åÛ‰F¡;
šÕgG…í‰'*N’+»a.˜ä½,ÁÃ	–?™O§h¢ëdÏÃ €HXf¹7ÜØòÜQ2œccFˆb¶ş9¦\§ Eà¹Â )Z^¢*Š/¬^W“2Ü\utî£âZ³*ëUp˜¿³ ‡ÄîRh‹Œ-Üd•$K24œìÿº·½{BwÿëİîÉéîÀñÛ×¯_ïïîl™ ŒiaUº²lZG•¡¼±°tñúÄ
¡Çf@ó Q˜¤…£ÈO„*Èí¡åÙ™<M©ÙL~.gíZÑ¦Ë?U3À\–t¬³¹é2ë-XfS¤wÛíl#²0oz. 'l[’â56G'',ÁÍ,»N%âÏ†ÛÖôËB¡b_u[rç0ø+Pæ ((Lâï‚Öçí<ş²`¨™ÄÅª­¹spÄ	Ê<›7Yô½ÅÓ`~Y8TÍà¡vSîqô¯Œ)G›8cWªzóÅP™/™U3ù‚j´Iw©8Â§ñ%Aõ6ªUõA™•çˆ^ÒÅl,;÷ıL—ëi33é;,ÚştzæSÿŞ©ƒ`ˆW(çÓ¡ŞÔ28ôæN3%13ÜÀàœß`µ<[³‹×íÎ¿øóÙM¶÷÷Ø¤'Ukozl²@!¡@!?,f¦ËÎJÌÑÌ0ç>Àø1f×óïÌ¬‰z#ée £ Œ/Ï^ÄADŞX˜(}a@.tiòGi
İ#wÑêm²kÆ‹7ÒAƒRj1©üQT#¦ÈŠQOb4ı%‰s’U#®	ñê$ska¼”ĞÁá=+ÁLùOWÙÉeÉ)´˜”®ÉP|İæSÂÔiaTw:~zuK£¦3£ñÊĞöº@é£d ãÉŒ{>Uƒœg'MŒaæIÇĞé¬V­Ûº¥IñY®<)>7(QŠOäÄÿ/°Ğ¢rvµ*“
½œŒ,Ïit–m~ÄôÒO£]³‡NñáŠâsZ<şIc/¼à²9qm D^hWÀ$Ó¿a1M×',áıf„ÛOp§GI×?Îb¿Ùy^³€ì?2êó}ZÂ÷åwBº^ÑFN›DFó«U›•µ0ÖWÍj´ÖêÔğÅJ¨½^k˜)ŒYìĞÅˆšK·¿Œæ,¾ÉD~`¡İ®ı:•f<€/°¤kúD«×Y[Î)˜puÃ—2uáÆÈ-ğô[âè8©åú†êH‡{è|å†ñ„l;aÌ^‚­¥|şsú{õî ĞÌÂù¥UÃXÒ^€#ò“1Ï—èAê4‘ÃÎÓÎÓó—çÇËñùŒ]xIğ‹2·äSgòzKÂƒXhlázMQ*v˜À–•:n$s$‘şÔãú7:n&rÔ8ÔâF§SWØhéÉµøx*g§È„Ç+Ÿ[¸¨+ZÔ,ÖÈæÍéZ)ÕZfÍ)Ñ5ªˆ˜UF–!4é¤d¨;Fp;X)ü°™2R&´HØiM¶”Ê?ŒiyÆÄãïÄ—8à<p¦¯›3ñsLx“–¶<°¬¯‘e
ÆôËs-ªY×fP´ÕZ?Ñ\¯ë[ÿêù.û=}õì	QàNøñ}­ŒOïNøĞ­õw‹A0ƒ1Ö=j‘YúwÏ¿ÌÔ3Öê4ü”š¥“¯œxØ7³NóX1´P—àˆÿXÈ_ôå­Ôb„Ûr–ê¶ôdĞı9mÑÅ;*%„Ã$OËy¯³LUíõå@€sñÅXxé§G$7ğË¥µ¨îƒ ;.*wäaK"ªĞ¸—ƒ×'4î…vvçQ¡÷úN‘¥#Ÿ1ooçvNC¸‹J…Ta¸+	=KÃîóq¼$šn¦ŸÌ2V±İºÉ98>Î­nH X~Liø«e’AÎÈìŒS˜$r×¾Jo^Š'tú¡ $Ã&‰êYI”ØOhºôÆÚ]Û§ì©ë»°æ€ÍeÃ¥EY—ÉBH«aåŠğ)ÃKóµ_½‰ËB=n9¸Ñer–.®NÉ­¤¦•¾ä¢‘yÂ¯ÁÎÁŞ!¿ıu°ONvO±,Ö	iê°;ıµ%ÒR	ó]sS¬ä\õ§."-ÍÂBeÍı÷ª4™¦Då…g¯¬°ç¤^¥¥§xŞÂíåA¹cŸœ#×‰äØò?ÆÚ‹u:i¨º<fùáÅ…ÔÎ¦&‹RùÌR™‡Æ*ípõ1©S]¶ü¨ËkVÖÖDù/ÇrR­\)Â›Õ×ä·û'ÍçfFcÆ‘/¼™”ZyyìŒç’ÅÄY}qÌÊwöŞ¬¼<
)¦¸µw÷÷NwW^îz¸Í˜oŞíÎîÁÛ•—;Î4 Ûõ»T—•½[‡V¾GkŒ—¤³Én 8NLX&eÂ²#›Ğ®Š`4Möb™–ÿõD ÙÂ¦±İbäŒë&z}½¢îIo'yA\?J<‹ÇöXêdÂb¸x–Ô5oş«S…˜›ëx:¨|VÛ‘€àPÇğ(º~^Ã¨]½Ä¨ê9"ØUß¹Ä2d‹œ¥5
Ç¬É.{’Ïà0Ï¡Û+¬6#~'l*ğÏŠšÅGÂ˜ùäE'Cß{cèL€:áÖŠÓ·+XV
0Â¤B(™ÊÓD»…Q‚]ƒ§g–æs¬ã0»iœañ“¶°
¹òœ®»ŞİU9~ñåÚ¡ºj]Ÿã¤‚ŸGêİ	/v·j˜Ô˜?7$wG6L«¾ÂìJÅ
öu‰Ç’Ú7Yr$D[&¡üä”ˆî³ú„£ÍµN:Ru_u·¤_0Iİúu&_Ë§YãâÈ2w·¾H,@—äRVRa»ñ¤,:ˆKó Äõ5òË"9æê(+C’“©DSİ6šŠ…EòŞş(S‡¸ßûmº‹ë!F}”XŒàRÉgVôÀŠ'À};˜6Ğ°ÌMÊ¹¡iiP,ıiã†Ğ-µædÙ ’*;:êü¬­(ÆÓk­n²0I¯¶òšØ5)1Su‘æ‹a8³Àeh©ÙÏ`Û1f`‹Šò[f=iüˆ?™)Ê¦øY×êÑİLrm[Ó[³zŒ–/5{Ğî‰İƒÎeyÃG_Ø·Ìğqiıç›{¾I›?å¯ÏäÁgşe,Ieò“ÇƒÉCö|ã&%©Æ=²xÜz<<Ìƒ‡Æà‘JXwoïøœÌòÁÜñ`îÈ?&`©b1ß°±#Un¬¶-hÇ÷ÈÚÑÛÌ§‰½5‹ÇlÎ<GjóH~º'Vd67¹È‘ßÁ¯ÁöQ*xş`IoÒR:î¯ÏRZÂ—1‹tÉµx°Š<XE¤Ï7n¹)¹Gæ‘Û"'v³çÁN¢±“”¥±»7˜|~ú`9y°œäŸZğYÉ¾a[Š 4?XSl» sß½EåÆ/™XfJ7“«ñl®Õö©xÎ
×$`‹ÀÎâæF¥àmJ:ê‘%H†{A¿ãŒPIkh¬’›rKv“ÙµĞ¿÷ÈƒTd—¢ú˜â$¥ü¢TÉ.ÂCÈºm¢c¢½~N	2¥¹
Ö×Í£uÕáV£Urd¨´k£ÆS}CÊiï\ÏŒFÎ,¦_-yêãĞ²] Í8hÆ@)Ã`J™DïYwãœÀ—ğ¡ÛÖërÌ¬‘/0–:MçbR¸À0çÅì^ÑÄ²ƒËæÔæÿ³+ôÚæŒÄ€¤oOœÑ‡m7yNW÷h‚*ø¯Qz.Jªä æ™,n‚+¹IÅJjv­(•ıIzb¥*Û—¾ÊçX@N·µÜSûx÷ÍŞÉéñàtïí!9ùåíñ)Ùß;üç	ÙÙ;Şİ>}{ü;9¼*4Zrè¾b0|j±C²M‚5å‘¤Š»Ê~ÿ$Ë.·é•¸²2uĞ‰N»ãœ—,èIõ^&Úu?y© õ!@?ÔÈG¾ãYŸ»Š »œâ¿/,ÛÙó9µß·ßwŒ¼ÇC«Ñí<ÜyÚ~üüéãv«İ_“Õl1Ù(é09*¤!‘Zåûpİ<voPìŞàjeVY^ìÇÎ8ËöqÌnX¾5¦Ïebæ‹õÉ†dÁ3…™²ÇoìV\ü¤µ–)”?’ùÌJ0$•Bw¾5uGädÁ“£Ğ8$ş@÷ß°è²ô)-–×¶G~š¤›A£5z¶Ñ‹INg€S> ˆ2‘¤n›ŠS²†QàáÑÅÁ¬	ã¢á
ş©ï"¥ï2üá3ËĞ„imŞ<dSdÜ­é|Äb"Ì¾.© ænÚ›ôßap©ÈãÅVã{%(ßÀ*¥+©¶(G%›x1é•¡rš+È˜Ç=¥hP)éÈ;çYá	fÉa'â¦!fâ£€×ÈkÇ‰È65(ğ”Nc}ÒSlM_¹¹4Ó¸§±a
Åà%Äd_+ÎKáêfò›,1oñiÅ]4òT‰¤/úáóÉGòh0ÎŞT:_Û§{¿î’£ã½í½Ã7d÷ğÍŞá®t‘rGŒJ?®LÒM7Å|†Şx³XjG®à"ÑX!Ò„¿SCúµ2Ò­ÏºÃªcªŞ8W¡djç”€—,]YÓ»6N?µMj²õhİ_&®Ä¥åa60˜LH¥'•W‘ïgÍ3+Œ@èˆKş ¿ş"m¥‘Tj„û·ë¨FñL²öİv!µ=Œ~;§¨Òc¨ÒUzf+)òm“’;%]HAx0|p XRô×‚î3üâä–„alúEá˜C¼ßp<8>Pš’W&rÒ~>38[&ù‚õ¦ğ,.æ¾‚5ã’pMÛ~QÀÎç>Cv÷€rAó¬Ê<«Û‘²(KÀMÜÙ½dœÜ’BFÒô‹Âq¦jİg8î}ıpÌsŞK8N&·gMà¸7¾~8f9+ï%Ó©-Ã¼á+ Xe%¹š1û×É|4r¢HU‘ãÅ4@kv:‘NÅõİØµ¼­«+’87Iû1ÿ6û*ïvâÈµéĞ6mUuÄeZDÌ˜Ë„«²OJ&¦ÀÁ[Xt( ;A28y£Iˆ¦ƒ¶Ò„Iz/³ÏÔ!Ê/Ö³s+ÿ.Ë^.5Ds›³ã—K´‘Æo^í+7ç`!ïfèóOŒ¶ÌX«‹â6hè¢>BÁye“
Ïcóv¨·çÚâ5ÚSı(×ı¦¢”G‘°ç&©º¦3&ä›fr®©ƒ”7ßcu³kMÜô£MjÄá\WIœºSèe£Á™B¡‡Ë‹œµÇ¬Ò€ÒÉ-ıŞ€}j2úÎœªbtFœ;–Ç."MJÂ+²W„âhoØÏŸÎEv¡÷z²®Kã.hP^3¡¸ˆQŠÇ«AöN¬„Ü)é}?uR•’2U„”ã©ı•oĞpéÆĞID¤#ÓÀ–^]¬t$Lí’çà‰„N–y/Ì¦ÓâÆ÷Ş“J—roéE§ƒ1¡EÏ}gØ¹È"rËÓvÙª/™yW ÄÃa©šB“Ò—(“Œ{jÉXÇƒ$~OµËPçşS¶èîjËï4®t§¥ª„B—JÌÔ8 E`P­J{#©´æË&:¬»JÏ\¡1›‘¤JM“&‚Hí4–»‡©ëQp8
R±íF3ÏZ¬¼Ì!H\±Pûa=±ù
æ—%J«våÒ/iL®8„À4ÈŞHã!²4(¹SífåzJå„Ş¡‹½ŒÎ«‘F"V¯œÒÚ–T‘ÔN}å%ş¢ªkvŠk{åÈƒ4Ùuì«FƒF_aÔÏ	ÒÙêŸÀñšæšÕóŸZ#:C¦A’‰¶A·Ø@RØH½H=fë‚÷J<‚ƒgï¡Øã­oóŸ°G·wÈŠÂy7<gü¢Î1ï–SÖİ0"y<TÏBXEv<º ÿ^u´Šb²ºP•:rÎB„Dk¬‡bL]«-taXî*T"ÍÊË1¾€
¸0ºAİÕäEÈ¬V3*ÈHÌ!&¸¤ª¾k·şÅÅ¹ 0%µ„P^Lk{³(ö•—W—®BcFj¡Bwìú×ì+	…Ùur-èšûL,€;˜-Nøa6¬Ğnüñ½~1<&ZSq?Oõ)ÇÏâéq½Únc7ö Kœ>9ÅúBÉt­ô¸5
f®cïÙ,Œ9¿HòSb31}¡¼I6¡NN®;êöÌ$<~‰óN5˜9~c•æ*æ{@0ÿÃ—=ÅSTğilñòÇ÷b÷ Šoy” ÕĞØ“æ•›®—X–ct)Åï"Åg
|™úQı.i<z°¼öÀÙäÇúÍğ¾ "/èşxA÷äü@øAÖü®ùñJg'ğn‹ÅŠ>˜[U-îÌÜÊCISs«$Ü·¦¹Uìrs+…ôV÷İ\ÓHÚ{op=¸?æÖ¯Ñ´jpïÁÈŠòAMëƒµt®÷Õ¬ZÏ¨ú`R-=÷Ê¦ª¹ãvï5ì»ª`ŠÄƒüftj¾ T§şXW¿iÛ*.îAŸÎšßûj
t_+ù0°*igó›ãÍ2;ø¶¬ß¬y5]İ?ÈšöÕ^«ò"öƒõ¬é•æÔÂ*»^ÓÄšët« wk`Í{ï-¬…ëı&Ö¯İÄ*Nè~[a¸pZÃÚÊŞ0·~æVálMì­ÂÑ>\ùs¯,®ô„¾VûÁä*è¤ô$¿)-›®(Õ²9éù–Õl¾ÆoSÏ¦«{Ğ³³æ÷ÅîúU3Ã«ÚLùíñ„¦Œ)|Û¶W¾Æo“)4¸B¡ù=·¾ªìù(Z("Û@¯`É«à“q^vGÌË.‹¼œ5sô6ÓÉÒ:Å*†ùıë&½W^v «õÜš7k¦×ßàU@ùÊÂ
ø´òC9µÊ_ñGrÀFé÷?[¥ŒÁë×{û{ƒÓ]r¼ûz÷øx°B~ Gƒßß¾;=!û»;ov?[­ŒĞ¹pB §uJe<JeäëQ”T‚?¿ìv`¿íşB¶÷wÇd°¿OÓ–¿=4À!óTşòôı€ƒIaNVÔID6ôz(Ä E‰)©gÉ®›Ñ¿ÒVûbp	Ü9O’k%õŒa8rä„hòGÙwì¤Ü†,‹¿ÊÒnœÁß€.¤æ±èäFÁtêF2½UDÅÈ¤Qòš5¢fvøÄ02š”³ÕØ¡uiy$tşwÌ0jI—%1V©˜ˆRJ¨JØe”®“uÑŠ‹á´±:²æ„—Ôğ$š'ß]Z°ê8€}w¬!İˆÈq‚è°äÀvô9¸¸è®Ù eoFœ¶,rÇş|F¦Öl@™ì¡°wĞ<ÂAß‹åÃ(ŞâÑêš:}˜˜qŒÏ&2É6–¾Ü8Óˆ¤É²N`Jpö­È‰÷ u«Ãø}Fã“ÿ<y{ØŠ¨AhvX3U~¿¥Ûa´áõ%×’íÿ-­Æòœ0 ‚³·PáûG(7Åoaö(3RÇ/K†Âƒ5Ç†³—-Yš,/)ñúzB1¾bÍ½‚PLkîq5¾-ª^Ši@Õ)¾fŸ°ÀË¢¨ñÊÿa…·LöVQëB]6Ps/²ò2ô“5ƒ2eÔÓĞŠ&²ä‡
ZÎrn3b 'ÌˆÁ1£ ”œ«Ë€Èås…\ÜPQ¯õu”‘Gs¤÷ `ãĞÃ¿€;%_R)#%<¤A'•+İœ¨k¶I®ÈÙg±IœoJqp¡¢2uøk20ƒ³ûÑ¾ímd›„%Z•½S€CöU¾K{ŞµBß±+_ãôÁ×½	j%Êşƒ©~äkøß¹ºş²l%zšaÔı·“í(¹tÈ$)L¡—R¨Ô<ı¥Â®5š4àóJOá&ÿjñ[p¬2ğ~pé„Û€’)A’û(écºˆç¡¯{/…³¤Ñ¹Š:K_Æ}SË–Ä…¨R3Ê ª­z¹TÊWs0¥K )å‹ˆjËÉ¸lÃ¥dœ8;ëòæÊºH(íùq‹tT‡Œ›»@-°ûêëãİİUå	·Š«ìY¶šdjl³±%‰Ÿ²ÂŒrŒ{’i€äDÕ¼Ê¨1à‰'A$ d©û§¸w©Ç¼y‚w—-ºµ±.;Ã¹9.ÍÍ1)›Úå×!Ã£¹‹ğ¼.[^4˜v?˜ÎóÑ±5È‘_øeË¢Î“8Véˆ-]3Pns*Ç1C+¶EÎ'ĞD°kŞ% ó"¾sINœ¸Á³86“-Z Ó4,Ä›†•ÂFm¬®®I±C&V³±A u3éwT¤Åı™ä€Fü^t†»£
®™àncœfÎ]” aš£h}Î8´¦ùI+©%íç‡X‡-ÏñÇñ„¼Ä˜ùi%ÃÓ@ø£Í*éEB1äÇÑå¡Áz\Ã©<Êí\+
¦NÃ¦gb[©Ç¤–t¡Ö¶òıÎæÑD“ Ú¼ÿ#iÑüşŠu~ı‡:Õ²Àÿ5hˆè—@Ø77ö›ò›{ÓY‚ô»ªn†*Õ!íÿ\“DtoÀñçë5Íg“À‡V×š‘œ©åz•o1ı›£¼¾üh:ƒGM[7Â%ğl¢_ÏQi§utÇ:´nèúöaˆ­V«Hø2;çr>¾3`Ô '‰É„÷Ä4èˆJ,Û&öÿ-UÈá‘ ±Ã‚T=#\İ¶@$dô£°””0Í]KK,©Y##ò§òê$s#ñ"ß™œQhc$pÈVş zä+”`]_Pj‡À7b«Áí¬ıV%ºŞÀ8¢tò9&Dø(aEÈüë/U§)+¥}òOÕ]Jú“"
`;ß©Wå·S’€{Ğ6D—ÂîUË	dm^qŠ³•¾íCå¶2Ì	zÛœ€IF¹¶0¼Ç ¶½¥¯
oI¶}¤{Cy°âÓá£–ÅšdDÉ@ŠQäß+¸Yé$ÒCêJu¨¡¤hXä(€Sf!Êÿ íVG
Q*+ÿVN ÀÓ('3™[ÀO#XÄaÚ2Si5tAGÉËz·bUp†Ñ|:µÂE"HX*UªÙ)g·ÄM“ÉÑ›!E}Oé;–ÃÉ2ì­s3fm&ŒÍ­05)KcbÈ-îS&Ì³6ü³®M&É³6ü³v&¹'ƒàİÛ‰ÏŞ¦to%yÖ,ÿ­®}QšÄ¤¿Vş{y[­)l› })à0l<9QjUj:m·MAå•-Ñ†Í8`ˆø–ŒŠ&ı2`Ï(tÿvø§3JŠ¥EŸ×@l±ç#§Ñ€Ù?&!+±3Ÿ’ó¦ÆÇDVZG1+±óşÅèrK4Jö¯šU–#Y»Ü.…%p›|öÊù'ˆ^cúÿ  ÿÿì}{_ÛH²öÿçSt˜™`vğ›d–[2ìp;@fÏnŞü&ÂXÙòJ6„åğİßªî–Ô-u·Z¾23Ú`ËRß«ººê©ª‚æ'ê¨ZŸ{•³eB7TÆà¢ryzFŞîî‘‹ËËr~ú÷éİ¥¬9j|¤İ>|×pWÍ†pÖ10FÀ­Ùl®5»Å×dÑ­Ø'.ñfA@R`D3¸×äl…•»¤²ãNEpd¨EH…rÍÄvUéğa•FÈd~ôE®\ê!‰!‰jŸ\õ£ÅX¨ÇşuÆ§}‘)Ä~é°gœp<„¡,D€[ Jg_ø7!,»g³òE¬ô"¿JÛa¬½T`´X 0‹Ÿ}WG™¼”ß.I$2ÈB¨âÂÁ!|I.&WQ7ôFc›Ñº n×Ï…,bğ'ÙRÁĞbÊ÷ßwÂïf¨¡y¿=2¸üL”RsŞ]zòÎ…­‚"PG:˜çARX¯N¬5‹'.¦“3ç>˜X	M{ÔÃNM™1ü6iCyzÚØ¹s<4Üòã¤ã?Ò€ %	N—>z^Ùù(ùfòò›’b>|ç^·áú¸`ŠÙ÷¢«Iÿ²§™Ÿ!ğYL¡¦i€¿MªQ+@†l.ÌT¨¨‡º}·x^åô|qÀ<iv6ÉÎ»ƒ“Ërvpşöôüxçdï€ìÃï§çÿ°V40ÂU‘Ïš8¬C¢Á&Æ‹õ mk‚LĞPŒÖ¿~Ëá­×’¶)™¯ŒKĞàHíÖ£ˆBóá»Î†³¾Íe{
¢ªl]†lkx?ÊĞq½{ğ_¹˜ÜÏ'¢¾!ÜI^?¢³oñ"lÑßóş?/û t|ş[…ÿáel&.ûÑ8»2h(H™mœvŞÁE@é•ø9Ñı°KLABñá}á34«ûatÁPQøøBËõÀ»¡â2Îj¬Õò…V¿
GÇ9ˆn‘×ä&“^``?è#¼œô‚n¥wµJ–ÊfyU³è!Š;80PCE¨jÕª…¢!Ih‡%^8¬ÙZkCWêu²ï^;LFÀLÜ~à#«8;<±èé`Sò•Zœ AñËqÈX£ùªÑ¨6èe@v‰·B}úşA;½
z÷ã`ÒíW¹¶!Ô›x…M£3dÙ¦¬­ ûp¯’ÊeQœ&_¥üøcñ+æ x1ß¬ONùHÈ÷RñC/(Ÿ†kåSa;I×wû¤Ò
«ÚP#Ò"LAíÌ•å·0ÛLĞáÍá ·MXÄPªÅPq3‚œ}™üˆoÕnA9¸ö†z•dy× Zoü]é´–^=/r®`l¶¼¸Zë ‚Šs½!8¼	zÏ¤üÍ „*oBUC”ˆG_0f*õ^ËEk)¡ÈÍø«	n´&Ğƒ»Ğ¥‘]E·6Ëè7İ0æmÿ/„`s¢Ü	‡¢r1¦¢{¬Hˆ)
D¡Õa>á>ä­ÓÔ6Ù ?DŠ¬8<JÜí¹¨˜9ƒ¤t¸µQ˜:	$ÿèˆa‚â#ÉzïU>ÑRÇ5Ãdmß?\è×>,¢/ÌÒ(OqıËÂ/V›†#ˆ•Í¨EE®Õ `Á}×é5Ü‡ŠšŠƒ†* Sê‰*P;YÖ:T$–É0‰ÌÔ*y2‹†"ş‚ás[õq–òtQcwŞKê@“·®?ÏJ–Şo)ÈdcfYgá’•j‡ŞMœµ20C ÓxÏ½š0ˆ\±šW5Çš²ªÚ¹w"¼•E‚Øu|zİ¹±©®}Úém'	˜Hİ‚‹lQÛü¾zOø‡4bs¼½ó3³Zà1k…'èÌf„Ç
Jê«Äë}±:d&'²x`bàH†…H8Íªp+u*ãw%8_±œh€Ûä‡5$Ÿİ{¼z_ÅÑM©tX[¢Û¾M$[Z~/³Ö„Õ„;eA
}—¼g´›]QV3Õ‹¡f]uà¯t:â³š…RT¾Øë2î¯HQ¢lI^=ôŠm†0¶M”detQ@~9­ÕÉŸ¦ƒ-o·iä¡[b<ñ¥Ğ2PrĞÆ‰—>ƒşbä}oè^¸1Œ‘	‹g¡¹À…™Ë‘7ìU"Š™«áÉœáíØáATƒ½kRâoÒZ›BM_Ô]Hj`ìoD† –)ªgI¯,áz´)U=f`\İy‹îKMvr×;#ˆFY-³"Õ¯œ¤ÃQA?ê‡ŞğsÕFŠÌô7Ÿ'¢YÃLø¯2o[LAíˆ<BQ¡&zµ#ˆ{=m…o¨ò{¯ø}Ç¤"­»#‹øÇãÈÆ®¤¨Ñ¬“Î_%ÈåqÅn~†v0ŞŸ`ÙKqı,å2$¡É0*Ò‚pÀ+~,Õhë¡x¨0A%FŞÓoTÁ¹2®ªŒˆ)³>—¢Ó‡´¹üó€Æ~ú?ò½pëñ“ı²˜ÁÕŒ	?şê¢Â&q¯³Ã“Mp‘IŞÃ|E“`ŒQ–Ku‰Aƒ£B¡¶?i<ãC¬m3Ãòğ	3Ùî;Zá÷örì\8–7Û¤C~"Ë	¯m”ğ–ÉæìMhñ&ˆ ;9aŒĞX®şåŒX oçZ!aÙ² ó²‚¼v>|<‹œ1ƒM™>2ì®o2J&ËcgØÃ°•ñMûİËHçKwëÎÆÒS°ä]÷HşÅRŞ,¦Ss‚¥<X\½6I„ã¯1èLY”s9™céˆÊ*&TH 6KPÉIIT"OÜÏ™4HÒÆ<q{rÚ¾L ÆB}za*’Zj‹šXÀUÄÛeÒ1I½›ç8L¯%Ò¢agS	Y XäËÏ"_ÊÌçpĞSİIëíNEÒ”ĞxH¶ÔX¨iæTF‰6P¬ÅŒµFFD²Oğ‘ÚPÙÉq3ÂuX}İÑ©÷2VØ2£ÌCüÓqåAƒŞÁï`4©öQ;ÓuÆA‰bËœI¶`Çƒãsï.“d’ÂÔğßD%Qî”í/q‚)ÎìyãëÒÁ>ÁLçkT@÷£\0İøf«#ïZYüuüÜ·EgiXjÂF—‘Ã‚V½*4ïÌKµ{a«~GÖb;^Å@œ‚eÕ !Íˆ¨S¸À”˜PMıe“‹ä:Ês™›"n{o3Iñ’&IØ?ßùûÎÙy¿xIvN÷~¡›­Ó,º==h›'a0´ÕXq¥öÈ`y³†ks¿ùça0x^ÈˆmîaàIğ~Á¿s†P[<lê=oÌP€j¤“¨='ˆ6»4uÏ˜ò³Z>ûvbĞÎÑ…ë„İ¾<Akt‚ğßØ„Ap©¡,ÀæTo‘*İÒèğÜÓ²Z×0—[Şp4Ñ[
™TÑFé·*#¼½Ä{ ®ÕôïÒ $Ûôqöª×‚¬òÉ<^qY wü÷ôÅŠ[;áË#˜¶Ì–’¤sRRfûÖå¡»º“hSö	ã7¨-­·04Õ×d*Á@zÈîªëmİ •Mk^*­”Ù8ËŒ°,ª‰äË$‡Bã(Ûz§±·Ö¼a×ŸôÜ¨"L¾e@µÊ]&‚ÑÊüÊ¾«ñD-'4–½²(ÃËwÜzå›£(Nö…™³"¡:õÁ*¶fŞ³ÙÊx5*ÏıJ8¨É½ia×{^ØÍB(7€Õmˆ­wdp,Öèÿ§ö×‹DMÜI :‡SçgwŒ =Ö¦Ny­b§š6ãĞ Q-=£CQŸ)ÕAEği1ÈÎTÂ9ËÓ„q©¾r¶Ò¸Üô†æÎÁÓáØñ| ©Lt/Á¸o<¶yÚT/hT«ÙË+y4ã
¡_æø âĞêÈB|™÷	‚ğ®æõŠ „ÍRB^Ø×mÄô¸òÖüëá9vq']¶ÅIB3€…¥7}¸Q„5Ù¨Ìzôx‡ÉXRımkâ oyû Ùİ¿\`læ?—`úF¦•°üJrÑ›ø›ÆòYÒjØ»<;ûÄC,qk&mí„fa"cîK²{ñc¼¸cñÎ |Ä¶/’è9¯.Í´Î•våv§A)]­Œss‚|MĞˆ&$%jdb‚å‹2m$Ow: ÌØ¡Ô1% *Z02­X†iÚ5c9£ÁO•õùºØmÖÇÂ¢-Á"ñ8<ê(eMÊjË9”‹Ã&¸e­¥/i™šÎ.e•‡T}ñˆØ4Ãe/£ª@ÇÛ_^}áK ŠÑÑE™¨îããıUÂ†~Sd
NÄòH6éÛ%ª+D/™ÿSu©r‚ò1,Õœi“…Æu•¬Œû¤§­Æ G}ŸRI8âdÄNZqÖ“Z±‹ºxÙ›>\³ÅKí«¯˜|$ì&¯_7êë
ìäDßXÓo1®@´‘¢8+#ıáQÅ42Ó<í­‰œR¬Mƒ%M‰2)=“:w1øŸLê+2)è›œğ3&jŠH<)Ï˜'Qa.ËèÍ„Ñok-fãùñ!6îaC[Và
+DÅ#eX^yv7%«3Åâ°¾	³D£ùíú§O†lzùËÄH¹a*æ¥1{|ÁÙc	B›ÿš÷z2ŞeÏ1x–Ê›ôèD÷jºìÓÖdÉÂÄsZµ™Uf’³ãÑ\ÀƒMÃn8Â‹/o¶®mŞ´ä"e³¬ç
°fZsÒ™®V,¯ IeDQi›¯X†Jàƒ>íìï““ƒ¿“ã“÷;G"èéíé9>¼«Ÿíüã˜´T…®T`Ÿ˜ájM­$ÅT  (‰â:¨;lÄ­Üê·õ–ÏØ"4öëıûàE[gşDÑUÖEi×ì±3œĞHZœ‡0£X]™.©Á–‡SYË·êı¶Ãƒn´ÊZƒ!³‘%€?wk£Ğ½Å |,,.å,wºw´åhjD#Hrƒç–n1¯i/IØë¿'†Cºö\¿ª|xcä³ú˜x)Õx±mõ–†Õ`ºèŠÜcÿ=X'xa´”-&Aèáá†-Z°ÓssÈÂúˆç%²|WÅØoh5­ƒ;ıìò†“X·åP~‡§±µ¦|:t¹¼ò¡¡Jİ*…°Å½) ê8èˆbº`›ÌÀâZTf€³Iÿ«.ä=2ªğG²Ç$b.á‚#:<…L¶ş!fÕI«>¦ß…Š–“ô5N^¼ÑæÔÂ›ñÌêË«útË®`ÒS‘õC2ÿ4ë¯ Å)óªã5…<:ô¹0Y“ü±¸b¸ìƒ‚;!f'¦'øÎFİÀ´D^¯æ|Âx¦æ)xàDXá•e}MÂ£ŒÚ>ÌÖ¡åÓl±ÃHÿÂ†A‚¡ãë^ÕÆú]M/Ò¯m­:E)ÊÓ#\µÒšï\¹¾$Q{¨hÎÏ ´ ¡ÁÚPw®áLç!ëM²¶şe«N«™	àŠuëEöï»Ú$ü«ó¹ï9ŸÇ}7®»…¸W‘±–¾Jväë]±$Íu ±t›°°IrMÃ~R¡1‡‡•p³©X¨£Ş’’şS¯Ç˜™r©\~F_ˆy,É!İÇæµ(aŒµƒœ[‹¬3Ó­FÎÿ\ñOOºc!Û>Šbäú&ígf]àlLë‚ohó^E«¡ÓÈ®†ÒkÁR'd€4óÍ%yK_z#ßª³§KÇ|	ß_JtâÜ8=¡]ò÷)‹ãí¾”.è< çş´a™¥Üu†ŸIœ&…ô€‰vÇÛS¼[Ù§·WŠ
ßª3zæ|á’¡Ë£Î&ƒ“ŸøÔh¾úÂ/û‹ÉÖSîX\0ÿCnYÚµ)öÎ
I²ª6ÓŠ8¥ÑØ-¦È,ÅÌ¨N?ß²*•õıB2!ÖRú\4rÛõxdÅ¨ô©@¯yĞhH‹ıZŞì^ì¾?¿8à¾¸äò|çäb‡zè9®˜tÿ'2Ô˜j½È”7ÿËø ¬lG5ûötW¦òãÓıƒ#rt°ÿîàœ¼$oOvNöcåÃ“wärg7óÎ”5gı,tÀ¥sÅ wƒ çú¿ùnïcHåpwÚ”Ü‚NÆ¼vzîaÉŸùšIÚÍÇÀ”»[ïìÇÕšÕÛ´
 £ßÿS¯°€+	l¸¿¦RO°’oÂ ŠÎİ[(0W‰œ ıJH€^¹ªuƒˆjË+êî±u|ŒÃÑwBÔÊ&Õı…4jëº·XRh1UÛWHQ_‰ßÅ½¤íİŸ¸8-ÇÎ¸_8_*ÕLï«Š~Í˜>Ş¬<jÿ&§KÒ¡Vil5Ò,“òí&tzm¿:ªW!¹ƒÆè6­l¸~yÕxİ\Ë€]Ùm­­­}DÌ
šÓrÉ¹yF‘‚ô%¼órœµ[œl©‹£ëÿ-¸ŠHB€…Yşíii“2÷…‡<áÆ)Mö=(wÜíGb3fœTyö$®W4'Oq˜Ø
_Ò¤,ä(¸¹)ê¼9ÁafÉİ¡×kÿ„» Êğ‹~]‰^²qE“÷¥.ÇŞ:4nİäÔ?CÂF$ÎÖŸÄ9q¾Ã(¡ò+(Iœè9ozåÓŒS¥˜øIO—Œ%]y¾á¶Y$©§ ËŒëmMœRìIı¸íÁ¶î÷0Pè“ÒçÚŸô9}Ry‰0©²ŞøaeŞÄÉÎ£-;š¨$§-‚J3!¥•4kˆ÷ú¨ì •6t~“zR‘’NqE’ŸÛŠX•O@Ô’C[vaòÀìˆ'¶#èä9kâ#-ššÛRólÔ,'ƒ"<KSya´€¦“€„)I'G²Es‚šß0ôûáÈã&_Ç Õ8½IQççB¡¢¨ïo½á¦!Šõ¶qKÂïf8oú´şÁ>€Ş»óÃıMDŒÃ!Ÿi©vwhÖó£Ã‹K‹xy¹S÷_8f¯Ñcö†b¼r7°9ÍZŒgåz¢¿î’ƒ“Ëó°6Ú€X¡şDÜ$i8?=«!¹Oä3±Ök]TO3Ováó˜H\ŞÊcçõ@Z÷{=3"\ÓÆ°)Ir`G>Á>9'˜hvö yŒkÄ©¥0İ·Wè\\á¹ÎWÈ¼"ê=0éÅ¤<:Ò{(+6?kA¿¥pÀOl Ô¼’²2íÈ-S….OŠ<Ã ,Õs^Ûjd¶©i;L[7—îRàµ ²fGÂ^-ş#ZŞÆŒtg¼Œ	ï{ıÀëºFÑééì«Ô·, £1iVüE¡å”ÛAÙ¼ÑÚc\\9[èQ¾€'‡j4TcéMµJøÜ¦³Z­C¨¶”>Î£>á÷ÂÀOqõ4ô¾A£?ñI¦ßâ¡É ~ÊÌÇÙËt]Šª¤ŸÈ§¿~¯øáñ¦C9	(œÀøv{ËæÖEc£÷ÿ±BShù…äH>¶( iÓæµ@`õP‰a`«¦áÔáá+Â%rŒâëÂ%¨!Ö"b øç¶öhÓÌÇ­İÔHccšvŒ‰ßOhf–‹¾§FŸ³KZ¾Ø±i–/¾÷v·¯¿hÏpB0KzĞ¥©#ŸÛÊMÚU'?c¨„5øy®åC”8ö ?fy€“İÅC§Ñ´\Î´sÓ¬gúâŸô^ëgÎı óÌ<Åœ˜éåÆ=[Gº–›VîlÙb·¦YµøŞŸBDrQ–§ğ}&K7iNÎ@á-¶ã[‹çÀùEÙ‚M w« #áM'÷«ä-.*:X.×¸SÉ½qşå?y-ğZÍP,&§†UrF?Å«hŞ)ÙXD]÷k,`6<=E¾c@w[.K»½™ŠÕÆ/ÿá®nƒE×Lœ)<¤ø®ûúõF§ñ1F{¡‘B\’Ğh¢¶pôŒõLNÍµşjı[êÎ”5t[6öNÏ÷cÓşáÅÙÎåŞÏf«†Ÿ^ BWš¹Z5ÙÖv‘À¢ßïœÿ£´«5KÎ˜Ñg%cR/k³NrŸ¦|uÒ+JÅõZ£ı‘æ½BFªSÃZûŸ½¶C—òªœáEW1ÓğŸƒì
yëa×Ã³^ßuÇÅ€­şZÆWd·[åÿ‘Ê+ô†¡QJûûi*`KA.“Y2˜p¹ÈŒ%ˆò‡Šy§“b€§g*›(ã
Í>:TeŒIåsn\e£«#X|ªbb@+Ç±Nİ·ôFÂŞM] „Ó<CÌédŠl,Iy)%	“‚Kr¿¸×OQ’®Ë–	Äf2=™ƒ2'“ÄúÃ]u´'sh¿z]TºıÄÈ¢j,Øàydfx¤B=‡
"Z×%òòeá»•+y4~’ã(Ñ"“2¿iÒ…eG_?Ñ”ñŠ3‡¥WAFÁ?ëWíKœ…™\³òµDHó¬–¤B‡–x%kÉì›•­Í)åÙ%^–+³ĞY­9}ê‹E'æÏ+±à
Ê-ú}F‡5ñb³Ñ›ğ™=×’Q•gK÷.½
²ØÅW’E)1¥«)¥Œµù1}Ø&¥ƒ*1„_médWË|[ŞàÆâ1B¢°÷oàÜ¸ïCŸ&]êÇ£h³^§7£Údˆ²rÔ¢ÔGı`T›µv§µñªİ|õªSí¬½~İvÖ_÷÷ê'”Ò¶ñğåŒ_^{ãínŒ^ş{{£ñòn»Ùj,Û…auüñ¶€;°zG‘	P\a¬f8ïÜ&g°¼Ô¶ñÑ&öª]äÔ’I~sï«Æª´Y	.õ ÜÙ®ÆYÙ%-2T(„ÜVùØQ}¹u"¼şúp»yµï„m†0«à*â$âìLØev‹¯i§ä¾l¸)]©4c,ÑX¼ç‘ë‹îCÚşToV¾ıñŞñôí—ç@„˜–ï…´í}…©Px7”ïÛÛÔú¢hÒîãS›.•€Y}—Ú.wöÅXäèôİ´8:°ğ˜Fq©˜òg¤w,»?-äÖİ‚gw`iaİa6ªÊaùSÑŞ¨}œ“÷€­€ iƒÉQ@s»p9Ú(gV,š•ŠÏG¡¨W&" %±…šuYJı_)e¤²
­S4âo'P0
vš¢ ¦Àäğ›ÒïO¯¾T6æ$»šX½Š’â$G!Î*KŸl*H¿{U’eÔ‘ŸZ}À¡øÊ:òà[^õÇt{eÂÅK@#”ÎuZ„1"½¥–a«H:áÒWà_ él?l<f$±éD¢<Ÿ¹=o2°à½'A:’¤—eAt-Cğ Û<é=ñ†õÜ¹&S+–ÂfÍú¡Ÿ$mğîdä)¤Zm\#…Zí$<TŠ¾&¨.‹õ¶«€išhñ‹Ğ4)Dx„Rø±’‚ŞŞÔ¸ÏX¬£¤3/
]»ËhRJhQ–Ş°¦'ZtkíÉlš“†m–Ö´uÏ›üÌó†…!%¤d½ÛBŞÆó¦Ğ:ApœzJãÙã9¥ç0qÊ¸Rñ|±ÊÆõ*™ó°Q®^ràX›}.->uŠ±ÒéìvûSN=@ğ“ua:UÛ¢‰Øòë%qäå§²ó¥zG¡wádØEg0Œõ%K‹4ÚÂÓÔ^P-d.3öF[‹‰Ú:—a’—Ğ‰î‡]R&;¡˜›py¤ƒû`B¢	ÿpç1â"ÏeGÆ}/„«Áq
¶ğ`_].aıD.ñÉ;N—Ş#rŒı{âôPB£<şÿ-GäŠE)!B‡^,—HzˆÕÚçtîoÌ»±t+=üïj•,ÇBöò*áû}™Ü€<WFŒSe”zÏãqûşE‰„€¤KM¾7Ë¦ƒ|·æ¢{e™9ÚÓ¶ æ–wyºŒå–îí[¦–EÚïùg;´xÊ*#¢œRNŞÊ£
H!g¤,‰±bX™¤•°0¸›rÆêkÛ0Éâ%çOÌ-¥â"¬ìJ³¥Q´M¢¸Øs’>ıÑŠn;2è¸µúí¹…yÎ„H¯ºÀ £R’å°È†³êÍßbÄ‰—„*ŞaÅÚ¡.”Ø%²}"{¡ëŒÛĞp€ÆÓ)ÖŒ_:7sĞ‹?`Fh›‰ŸÈò|æeQtn\ñ®Qæê`;.æƒÖAš€£	@Æë;c~×Aş€“3@¼…	§ûï‰Çù°7¼¥QF˜©m
¼êeø–çÖ¥Y:p‹@,øÒW÷’–3õŠÏÇ¡#Ñ*^Ÿ¡ò¯‡gb¿NÊ¦±s'¥ãÈœ‰¯f¼ä|‘†Ó¬Ü—zÛ/^ˆÄ=GïP%GÇte¦6áæs³÷RzŞŒ»³ ‰xã{¯ÆM§õ(å¬“å ‡ŞğíRª3èŞ°HœÙ¹zà·—! à<¿›¼­%2^ëØ‘o2Vx¸7œíµDPáÙ3ƒótÕ~Bbœ7y¹Q7ôFÏÂg{j²bîÔRW¾¥=m­ó¹¹Ôö·„KXÒ	t{ê€×Î™ö™®şcç¦aHå”®L÷ıÍRvfÇ÷ƒ;·—íÔWÜ^Šv‰Ş}ätè€wMà7ülGĞuìñdÀßüa<)MFd‡*=hhïID.î<ÔcÚFø.Äyš¥Aƒ2«‡ÈèÄ[àn6¸5`SÎ4+Ë,±¹?¼®uÔ'nj×£TLãF¨©ef®¿ïdá0ÇÅ¶¡ènßí~¾
qèxº¡Äw±q™‚úâWSòãEÛ JßÂÒÜ HGhœĞVµ¸95%ÇĞ‚h¹J¥ÈR\¸ªoxàu‡FÍÉÑ2áuİ$¢°}èäLÛõá.5®×š	L‹-¬U4äÜÀÄÙN&äò4dŒ®l"{†Ê=¯Ì™*eE¢admì“Œ°ÇLŒÄ~ic¹Â?ÚXÂZ`tÊéd–‹ÌT¹àZÇöŠ­ËO¸×8‘ÁîXŞ°®$!Ár¯ğEYô’Ñú–YƒLÃO[#'ÄĞD:y†[çÄ8:†CbEÆÖ&g²Kí¡µÚ×“DLówŞ	bÓÑs¥$©Râ}¦J¹ZÛXo·ò1zØÇÌ¡#†eŒ ÙqçóGCXEÕ&ZWÓÉèñ(b4;Ó3èÅŸÒÜ6ÍÙÃYçl#ïÏöw.ÈŞéş³‹œ$ßõ,x9d¬i³à]Ràş‚‚öˆ†´Ä ïõzî0Àg¾‘{Ğˆ—u€VuY«
O zişõ \;;cÀfÜãgq]ì9cÇnŠäx}¤câôäÉeD	áöd,-8[,¢Y3YNìX«"M2‘Óƒã~²¥é5YQzOÛ]“-Ó c««dàxàZÙ2·¢›-Œ=6š°_ys0{ÿ0×±PLôÃF?rÍk)/
g%_ôÉ ½û¡3ğº„
§ô´¨BÊ&iìÃY*¶>Áñ
¢"áÅÍ×÷Á¶1/ÄM'i"œtÚ„æ`j®…
®¯a¸5™îÅ‰yYùŸ.&Ô
ì(¶+Æ6&”•ó§².æ‡Å»µ1JT‘KWüŒìØ•SUeáõJ©!ÖVˆl6Ôo  ²gª¼|D€$†õâ HªRhàmº2¦~?µ!L[S½Â¿½:û¡¡”ã!E½ŠNS•4
a³N¬±Ë•M­œWaH(/,X5kÍW­‚ˆP
FO]h()LJÂZÂı[è+¥\€2ƒĞLq==ÕÚ.2fE˜„í¼2X§™.ÊáŞHQz-+š |!I¥Òİª²`¥ãWÎÏ?¦xûàbŞãäôí[›¾Ù:tL9ÀÙ2Û`?4;üĞ–AËóÎ¤Ë4ŸğÚâ:”±‚d6›Tr±o7È½=œ¼GRï˜N…¼ ™—Øµ7„eöò%ÉÿŒú&
å6ø‚™Abå6ËÌÚu §|cğ¶ËàæÆg 7¶sp6Y6€ÑÃ§˜xiöµ¼ÿ·Âj)ÍÔ*ò½-$3l®l³|‰ ® ÏirÌÄÀz:ËÖumÒºt‡-ÍIÊ²üÇO6óVŠÆc‰cÄ>QUÊá¡­¢cÙÂÉg œŒäÂÏ`_¬üof"#Û•™Õf32³õ¡È)¶ÓM¼t‰ª[¹Ã•/õà¹¢t1‰‚\^v¥Ë‰•æÓ²{îî&ı¾BÙşT“e©W¿l©˜O/+…‹;ëñ„Ùí|r£²¾‘•EÏÁ±&‘]5<ŞRğBNgãS“xÕP4<Í[v|p‹–)ÈÑÍ¯ÿZ9Ó”ásØÑ™c‘ÀdĞÕmúu!Xµ¦biYÄ÷;™MíOµˆEÀ]«æ¼TU‹[sŠfœø‚€`—©øg½rLU¯9öQáÍ’îW>|éö±ÊùjõGğÀºœDA÷³;Æ¤?nø>ô·27åÉ5W{NÄÙñoÃ`ì]{Ìw½ŒXŞ»©Ğ…Ë¿\¸š-jÂXçP…pRš¤Üëñ&|€@N½ËlÌQPbâ»IãºÙl:
sTW6G­!Ë‚ğñTâÌZ©Ìx­l›œ«(ğ'¸å£*¢5®Çğ‡kSû1{SMÓüº·S½w`Å¶¹€ÿ¶ŞhhŞ¢]jƒÓ¢7Õ~m*DKHq=èIÒì¼–$ı)Ö‘¤V)-q»Ğ.šÃGbyÈğôìÎ”CÁ„5“ëT¶¼UÂlİM¢>ÙA'æ­z¿¥­ÔÆxÑ‘”HtÇ5°‡-½á½ÖŠÂ&ª~Q{¡¹ÃŞnÌY”hº,jKæp¥ º8±U/F@f`¿ªŞ¦!ŒrégÒ6oØ‹,`ÓâzÉèHuáæ–ŞÈãP/:k-ªÚ°9Lmµï^;˜ë°Ÿ÷®Y!+³à3²©sÌs²±~šƒ«À—»ùæƒ€¶ØrY´ÎöéÒó*zM»sŸÍ˜Şçó\9>IFVNqaötÇ÷Ïİ³ì¸=ZµXP[f™êø‚˜C~ŸÉ,âÌRc›°7q¾NÄ7UE‘J¾Ì vz®éÓéö@.ïGfÁÒ,oQlJho!*Í Ôi™¼šaÄ‰ˆ3¼ÿãrox,½ùp>ü—qú¢•)…‡’‚NùHbt¥|A4šóâ#y³›[KÓ4Š‡”YzÓI2;¾a³éºx,o BÔı`ß®ÙHÿD8˜‘KÔ|S,€6v–ç<ÇI°qÓ²|×^´ÈûF²;9vP—4tXTt’<ˆºA8È#{V¨ÚE±%¡Ñ:jÌjJ‡.‰4á¹Ğ?3âˆ›äQLX˜ºÎôË?î¢í‡¶~‘féƒ·oJ
áoOI#û®RrèÒ£N´Jî\Òwn]z$ƒš¯'D«-,àĞ`¸Fª”:Ì3”s‹jdı®‚çÔÉ8ÎÒeHÕ¿/ú‚5yÿa/Í™ÖğLOv©>XOb3gğMÃ‹xÖÄ”*4ï('*¤ •hÃÒ¨ÉİN-I‚«„DUw(hvôŞ>Xv*È˜¬r—ÍLçª´êŸ‡lÊ<Ó“/(DQîU«Õ¨m=},ˆŠ8Åf¥ª©¼gÂ9ÚĞ7åİàg8Ÿá=ñÑS¡¬RøÕ¬Járºßb¿âÁ*ªu¨Ôúzƒ&ç0èc¬Êd3ùËÄxêLªÄ,¯Â,p-€ùN³¢g¶mTHyÔû.R|§¸:S÷:pjÏ=	éYµ¾ª·œÎş¾Èk€hxF4İïº¾/ó!–6Nã4 «¼eæPz_¼[\¡Ô@ŒDÂ"ğ÷Lxzí"×¢üÚ|Ñ˜&ø t™Æ?¤Î z_í"ÖƒøuÂ-ò}[ö«`Ö°å‰™êÍÁ(¤Æ¥¨¾å„æ)U-0
W¦=.€Õë¤çÂZ‚\ï}#íF@N0JÒ¡¨ -ÆwÇğZïÆİ½!Ûvr¥„O£7R€Zú@«±lÎGA›QÃú™”ë5–W2UÚ¡ï2ˆß’uSUH®æ‹o–°xÉÏkekãÊ’\}£I8òåáå·„Z…‡Ê1U§äê•,„´ZvG¨U´.Ò’Z¤‰@2ª™©Êš5½(ù‚Ò-E%GôZk-G‰SÚ (-*^´Iâ-¿&ÚÊs²B&w…¡¥>úó2án¼@ÈÕ»jqFF;£2KËZ½Ñi
>1ş¼!{
*7ØÑ›ì`&îé|z¾àëğñ“ì\XÏhM@}êÜ²Ah,¢Šú'iÎŠâÜÈZihƒùCÑe+ø:ë¢ôg#<ñG4ñìÒË6:]ŠW;ÛO;$¯İ›œãJšR†”“qL7b¬¤W¨f9b-Â|ó'C2 ‚12§i)“ W¼{G0eY¼•xxá`ÄÒM•ëÒ.Çˆ^E"<¥ğôÎèÒ#U•%Nn–ŞÄ¬„ª¥MnÒI]¶H6¹	ösõ3O%p½ŸÑ›ÖvDì ¢¶1Yğ2 IEÉ´ïÖ…€#1Ïİ.ªk^É¬Ó‹Z“ƒ¡
ĞQ¶ıo4V;»ıgX…*¸?["rB ·®5˜Ô¨‹şsNS~Õœ¯ÂÕ5ˆÔ>ZQÚS_Q_wtR°.cÚWã-3¨ò½¹ƒ°ŠRğ˜}ç½!Á¨úøWÔ *#ë¯U÷{r«vÈ21@!÷ôÌÛuaEÿÏ†ªe"ò3p X(VIjM€Cs˜*Êà!ñ(f€õÉª³N¬:’‘ƒ{zi
[ø\œÂÖ6I®(AgsãRÛJsÇãıY×d‰>#R¥dË@{Ğ&ü¤Sé)×R¨£]=ĞÏ:NÊô"ü<"¡„"¨QË=8Q¾
`f×°5DRÁ‡ôDKG)yÍ¥@€Ué,­P0ª•ˆKÉĞë¿	âÙ$¼Aç¡›ñ“5–îgˆO¢ü©T²›é2\•½‹_a;şÛÅéÉÊB3#/e¼r?¸úÛ¼"3¢åœöô‘Ğ¹™PLB“¥KK¯9zÎ=Âd›Ü¸ãİ}›¹\ÜĞî®î—QeÛ¦¯¾`*·éUò	1ÆÁ¤Ûÿ„¦ßâ=ï·5¨/úíû‡¸âÇZ7ºı¤©Jã&;ÙÇ6TÑ½~]4ì	J6)ğ€µ~8Ô„fKw%ş)‰¿Èø¹z’QÌeÙ<L)9(û{ÅKùUè?ƒ!%}neõxğ¥ëú@H¨Rv”vUı¾õà„4é¿G³œ•I¾Ä“ÇÍÃê+p°Ùà÷ÜV:2™i—ú¿¢`8ÛZOVzz>HÖy¢Yl+/tª•®Ñ6<Ù
ÇA'¡sG® ±“QÉeü·(*Ö¯l(XÍ´»´v›•œÿÅ2-Çóÿdóˆ\LÈ3SE¤rÆ±,»0ÚM’¥ŠÛ^èbâcúµ%{\µéª@O4p¼4Ó%ÍMÚìÌ¹qo=÷.²Úö¬ìæ(ğ‹ ÕS}d2EÜU›õ58\œ¦VÉè´Œ?Ù(şì#*ošØ¤^„@+¢¸1Ğ‡ÊU‹¦xàPØB ™éÅj£ph2¨ëcÛ,½ÅKªĞÄ­øÁ7ÀÅÎ8û6Kæ+ˆ —8… ÓGÀ»Â ŠHÈ
¯ZÕ>Úsï¼!ìùj3­I~äÔÚ$ï‡Ş¿'.áÛË7IAéÉ)¨õ´ÄÇïÂ"j´7º =1ù0ÖÒ²J»,QÖµçÃ†Y¹E‰æ¶æE¬“+1Å•Ä‚ØaÊ"œ°±=<ûjT¸ï!š¬;&WLEÕe<Ï~psÃPSA‡ojB\Ã­$´åè›¦Dñ”sWm=õna¬FyN´˜ÛgÌÔX)Š…3Ã"èI:  ¢8® ¦ıiÈÎc{Îp¾O@i“0qsÌ7i:JxÚİu†7¾Ós£>¹ô.©ì^\®LÍÚÈF-…ÚaÏœ#Äºv`kuİi}aì`DĞ”ªQë_‡ µ Ã	è¬5”IÇ4ÔVlÇ ¤zÖùñ¼w“<ŸİûMQ~ñq“°dRä˜ÉÃ£yH\#œnŸ±Sà.UİÖhÕáı
oÃ‡äÎG¨³’¿ImåäGÒœ&§uÊ#GPúéÕ¿Üî¸†Á=7âu­Ô¢ W*Î*¹¢cwõ¤È*qàÏÊ‡ÆÇBŠeÿD>¡~eÏ?’
ûØüø¸ò‰l’¥D*Î“i.øÔı¹qƒ›Ğõñ‰À„a»šPdı˜í®F®¦¼©Ò1ônÑ«¬GŞÒígäh'ìöÉK²Ç¢OïÓ´ËpÙùC×·³	NŒ7dÂVò‡Äşçß¤ö?ø<•ıÏV9¯6ù©Œ~-Å6†‰Şì§7’!vçib™ÌÙ¬‹/¸‘¸ÄÎÑEÌhO›É€wAM´Kí5
«!­6
æ	[’¦sŸ²ä¹±BGŸ5€:¾/;¾oŠÍ—¾xvqŠ°2óK_8öŠ×FûË„e¥*ğfì0—Q
5ÛRÈ6ê€ÅiÓ>Lë­jübP¶oŠnúS»¬BÈlÀTà&G¸CWñE5z(İ€²ğ!]ÑºØ«:=B/fGF=¦Új^f>Ë{¦Ã™6he©#9Á•¡‘Â—~'”ÂFôH+TUB*_Fîİh¬&‘æT$‚å¹ádÂRŠJŠŞùI:¦@BùGÜùg@,ã» 775½´¦ÛRî‚ß(DÀ¹	Jï,IsÊí-Å¯ıNGÜ? í´˜,¶s<‰<¦_å,•Õ²dÿm-+Ş›?à‚•B•Â5ËŠºvÇİ¾€¹Ò­1ˆğøQ@=X,Â|Ö–ÃS­©|0ÔÑÀ“0"ÁÈézã{˜z`Ê2[hâˆBAQ¨JépJFÿ8w¯C7êïİI¤'xn i¨Wvì{¼á2KóéQ¯ršÇj`î;®<óš@¥vÅÂbX¬¾Tâ òma­Ğ{@Ùë…P6ıO»†ÚsZCt@Iœ»Àº	²IF¤äRšÎÈ´íLÇÕÔT•H1T\D*{Á°ç±pO*”\
¼0pz]2ñ¼Ö·M6K/p\ ¢¾·™7è	_×˜›Ï=ñQøE¾G?T©7Ú›fÿ uDwns¸ú¶1Úë¬Q÷, æÿÇÉ3h]×»½ñg·q»\„³œ°>s€á6ÍhöÌàõĞ¯pŒZ&¬ã‡ƒ›.H˜ò§g¹¾à\ôÕV?“Mµ¶âóÜŸ+«À|Uà\\"ıZÑ_d
/äù\)H¢E£¶T–ù7s.¤Gâú°lÍfÅåŠ¹Hío†tKùÕC“;Ãq­M;1–Ü@×ÅDB´=šÖlèF°ã5çì”3›ãÉëyg4òïc‹îTxª.°7fo«“QêáÑÙ¹Í7Š
>VP¥u¤¶‡óRU@#
1BJõ©Ò±§ãŞ¼+Û¬~¤çªE!}3{5mòÿLÜğ^½M;uú®G•"‘òÁºº'‡gÄéõàp­&ğŒEß@t_¬«$ÉÈƒGe•·R«ÕÔ}ÌŞÈ§”b–À{æ^L	wZ6÷Ñ2¼ÛLDŠy.‰Ly—¢`~ÆÑş#»‡‚æô¨0ß—=Xƒa4•û‹$UóCšraKäÈ6Tä˜"h«ßÖ¹ÓsÊ|¤áÁ.Ÿ+<Îf‚F²,ĞRRåÂD°R:4jf¸Uï·mà6Š`t­¶2]…nÜ÷ÔÉb,^ï À5Fäı7a@xá¦©ŒŸ‡ÚÙ›°ÇÛÅ&h<3–Ş?qı³a¿×"Û¸¨Â}İf$y»Á»ŞXM{İXåNCSÕÓ,VÑ NÄuÖ°¾4÷Dp‚ŞäÔ¿¬'²Fô¡Û+…N¤ÍåEúY[…æ6v‡Õ+©L3ÄÁÖ(ØÄìÓ™”ëqb¢“€ø1²y@Ïé:#¨
†äŞeÎÚ‘-×iŞŞoò_J«@FÎøã*ñ€~±²ÃXbW˜·cØAkoXi6`‘Òo”©V*X(›«:©(ô}°x›+°qxs¥ª_Åşã]R¦³j„5(ZŠ;À¼ÂëMToÉ&b×wtvJlô4V”YÇt›Zz“úÔåÊ‘9R‰	ã®±˜-SP_Cÿº
‘wZ¶® ÖQñ´3€rÅÄ>$$óH÷€¢™^zSçâ¯rvüÈ7Â®ˆÅpdv’‘iaÛ9\Šƒ…¹ø|ôx±‚%´vûá€Ø5îo"8ó«Ç>Á»8$VAŸ§‡¥	: AÁO¡†§g) ’3`Ä
ËÒuŒ&¾ò¡yI}æ_B³•ûÊÔ²ğˆÊÂôÄŒrgİ úrq$:µŒ,œY -Æ¾,ß°ŒH‡<&ÒsÆ÷½]´|ˆ¯ÒhîÂáSË…Ø•oW(ÌúÃ}xÕø¡¸ğ¯.)Jv
Ù¿şº‘t
¤4:=_Y@K¢~A{˜f£T»¾š¤”ø ş!%åM…ÂóØ‰¨÷G`Ï%Â>@VØéÒCú®£Š+§ßµ1	s+§»Ö‡Z­&0<…s%Õ´õÕ›Ğ”Bóâ…ğùr¸‰¬ ù4İĞ…²€ø=ĞÃÕí: c…MÓP§\f"Løa»¸šœ55½g4¦5X-&ÄXoŞl««g¿nmg¢7¯Èó¥	†§ÌĞ ²bšÚ“´Íâ‹ÁQpç†{p”Q›~‹†K9Z¨v±ñFr5oØõ'pTªüÚûÿ§{?V^ÓBø—)KòÆq1ğiº2â(2´şeº’‚ˆDS¾ŞğÂ›éJ r9-?ÊP \´¹[wæ|FºHó¢Y;Xç“%GqÉ=<¤îáÙ(Î*÷p‹·µ¸ç>)HR¢ÒPX‚²ˆœÂ ¹ûîØñ| ş8ı
 zŸ Ú<‚ÿjİ¸01ˆ.º±ÁYŞØUîšDp6tĞ$UeÇÙÖ‡İê(ÈDW"õJ2Â,FnSJ>0]Î•‡d‰“Ô…nÓC@Pvá˜k@Aø€Æ[åp—bóÄ'ë\âiÁ…	$J ¼â½¥€#Š9Ü.öaEd<ÿ´içÌ‡oß6Ér<ª†äXxiB/ÇoKÁh“@´ß?$İy„/yñÜ„™]t˜ˆºÏ,3´·ß6Y§r,gTçÂ9¯4ùÔjªk‰ÛÍŒ^E–|5x?É´’A¦™rqpÌ>§qß‹R¡nLŠ¨, ˆŠ¡Ğiàg}ÆƒssWFõ#¦¿ ¥”+´ HyQà Bùƒ76=3u›âN³ëéÉ»ŒÃ•.üôïšqö§$cuÜkJÆ–q¯yAIôk{jÖı®‡pòDe%«äôğEeŞ’¾NW’\#şˆƒAWGN³®—üÙ”ä‘˜,»á‡f«‘ÚXh‚XœçË"¾3Šìäõ­qßuzÆ	‡™ÓWÖ54w(*Œ˜d6ˆÙ)Æ}ùtÖFêúÒ›Ã3ØNàx„ŸÉYÜ"nÕÇı²å-½¡/F0OÓ½/ JãˆÓ´kÈéÅt%ˆvòéJ8w¯İ0„FìÇ›ª# æ9¥(Ÿ7‹Î¤©òŠ
…ßC+(XÆ[cÜÈÄF•£ßÚ=áØÚıĞ¨5ÖÌö&õT˜ærËÔşø‚ÿ¸ŞöÃ«Gyã£—:ıuzøÊ˜£,­s„œdÀPÇBG.şñ5ÜÃ´Ñ,×6Ü@9€…‘'*/4gŒ¦h’mòb&sCÍºĞn-–ÒàiJöÛøIHâøIò;J?`k’_ŒÂNZËŠcÇkzáÁŸTxÕ5¥ğoE©H“¯ŸâöfÓK.»Ãêû‹åÕÂ^³–
Ä–£>Ë«Vï€˜	o'pÔñº–ï`{x©Uíy7mE°åMÆné×"F»Wú5lb³µ‰ÖÚ"@^Å“M8©ï˜RA³ËÂÀÏ.ÜŒ©•W¢×CÃ8Ã^0¨`®Ñ$Ë¨d EŞ”Í5?Šq+€ï€lo—î´şô<yI/ÎŒŠ±Ù=Õ–Ml¡	I9VZ¯fM•LDSb±9_ié›†‘5x€]ì-1×ù{[6×"õ;Û6¬áhŠªÖŒÊéãKåN{oƒÓ:ZjD-Rê²B- üQS˜jmò`
”WšLşñ,©4ÎdtáUVo¼âhZoÊói·Äh‘å›‚íĞ²Û’%¤"óÔLÁrA¿–/¶õzÑF=ÏîîÖ+<Êj«¨‚[~mÜA;ª:é@ØÌÉiÁi¬Ø×¶I®?RšUW©‘ˆ£3üêø|8â;·X¸[É¥1‘f?.a›Tn?Fh–š§Uç é¸%HÅğî¬ÔàjF¯´VÉrÃìÔ,_Ôß¢G¾ñ.5š(4pê–öcäßµ!-·NÖÖ¦Ÿê’rI´¨XQPäzù#Ô5ÒBÖöï–Æ>ycÆ‰æ/>Ş¿rz•>)}ŒŒ…_ğä=ş-‚o0#Ÿì›nÇüâ¶fmûÓ5W®·lMÖäŒÃÂ˜d™q±]Ó«HæÊ+XM6[•8õ—PÅ?ƒØŒ&~¤vH×_2»«¼&æ/‡¯ÌP”s8Âì¥€X¨¯ÒóWjöŠî7©ëSèª¤~gÓ[j¶Œsµ(IÔn‚ôÙ ²•—ÀŒ¹ceçe;e1ÿÜŸ®Ì!¶(2åßı¾óÙY.uòZ”øŸÂ¬s96ÊHö!K_CSŒ¤ßWÉ'øõ?uĞ^N}]É_ÔQ?áÚ3LQrjÏ¸L®%‡ö‡ã¸×ƒ[r-•ÌÉ0“NÂîìi6EŠ‰5é92¢}ÿ;M*•ë<_°=÷ÖëR†ğíÚ¦÷İè3¦Ë©“#g–Uí{aàõÈ>½§|Äƒ%ü<›ÄcšJGb‘IvÀâ„Nƒ¼°íjÎŠ“R|-R‹ÖXè÷!„ÇÓÔµ‰å˜T9&§øŠõ>-YïC‰WÒùP R”»".×¿.§O,O=kYY>ÔmÅP	Ñ&N@ˆİpÃrsÀ_bÂ‡ºİ1°·İ ø<pÂÏ__õÆ´YÓ«ãeûlÖŒ˜½´¿2g¶¸=K6²r›òJ[š¿Iİv/.a‚ß_ş¸^vÚ,*4$ŒÆ'W‡ªÑ®ÇÌPôÉœBÉe»?õäŞ”ÃÏáâŞîÊT}¼sşËÁåáÉ;tqÛ'—ç;{¿à·³Ãÿ=8º —;»òSÖš!À†Òºt®fY…‹‰õâÌÖqüã™÷Åõ£cgèÜ¸a¦‘;ÆG¢í‡î$DQòÖÿ%;÷ÁğÂ¹u/’÷X|k¼—{õÅÕ¡ãg‹`öÿÃáNoàço?8Égùéºn6eÌ•üf&;:İ¡ôóá»Ÿà¿Ëƒ}²÷óÎ%Ù}yyzB*»Á#ÂŸSUE¿‚€\ cgøŞg—ìù’¥\È±E˜¾Ÿ£¶åDwn”Ş°p`‚”ÿÁßÿ ‡8[šÏH°ÏveÙ‡İ¾3–ó("f<H”.#üë]µ¹0×eçYM@Ìß5İvÃ¹şHn=¾­]m´®×?bxÌß­7œÎuÎ}&†è¥ğg/Ä˜™ì{ŒiP¿\˜ËL
„$ 4
F\ã´~;á|hüÖ}ù­…ÿ„7WNeíÕêë×«­µÎj£Öî¬|áˆN=¡As·—¨1ç$tÄ4îÁH§¾Ép³‰a<Ó	V+=C§¹#	?éa^«ÜˆÇ~Æ’>+‰Áš¯:„w¸êŞÂÔD4Æ!?fšw
ë;#ú6;wàÂó°ëb˜ÇÉ0äˆÜyªb9NôO•¹^ÜŞP(çnğe{©AW ÿ[’Ñ„4b:şË<,ú¢¢µâ¬Ò¸5ËsK'³šY,`«ç^G9çdÚ	¯·½„½­²nVñf•²MxÄ¨è—7„9%yùì4±_¨”F]¾·—è8ô]¤nşåÚóa!1U”
”JutBœĞu°¦Ğ@O{¤‚0(Š½dí&?bh’à3M¬ı¾EexÅæ	#pLÚMÒÚ {¤ƒˆeø´Ş"køÛ¸;¨Fë¬ã?¯Hû5é¼†G¤ıŠ¬¯ãß&{|ËZoÕš¤İ wè'öwŠï5¡„6|¿´øKk¤O@àø÷ŸKª&³c±T¿³±(~âïlfÖyC÷_°2a"*ÌMÜVWQf	ÖókPúBO7tcÙe3Z¹ra•õV(±Á”gçT9Ÿt.;¯qğ`Îp$áÓ«uÒÆiƒ¿tÄ÷ğœ3_á\¯Ãÿa_Ñ¹¤o¼jã'üíU£Æç>Á+Mv?±¿0×¯ã{íYoã¿¼øDk¥O@+X«òóišKìúöÒ$ô+ß©‰t%óJ½`„dâ†]j8Î‹~`¿"Ñª4Bp®¸½ÉíïBt=ÒTäìl‘^0&°'0!…‰(Ö[X•‹6ØSvº£ã°ÉÙMÀøÄrA+Uj5ZWÍöG…CFXáû»“İ²í¼£ö $ÛÆâe{]n³^~4GÇıĞ`8_è®OGëÊé,h=f,®&ë.Ö]N‡‘/DA‚:æÑr\¶Óq*—T’Xz£:æ*NDJ±.©tŞƒ¸–N‚{-›ì§_Ã/½y‘o—fB~F	\?öFuæ•™ŒŒXŒŸƒæŠÚpWÍÆÇ:ÈœW@^½&
„±°:Ğk`sé¯J:ò0…o’)Lğê‰çH„â»(~	"¿-P*±‹<³‡jOĞ¹¬ËRp0„!s¥É×Y™ü!Œ'İ‚’®=ÔÂ Ajßsà HÑßè{…ÃÃ²øgª¶èÏBøaØQ?¸ãåíù®fO¾êãX,wÿÖ&\'¯]ÜØTáÏŞfÄñ1 Ÿ”M–s>iœ’¥ÇšùÇÜ/Ş¸¨¨üañ"3.
øÊ©nL‡’Äg#KÑ`I¿íXç¡3µ×«;ŞYµ,şf“¾×Xµ¼’µåâA¸ÀrZÎäÈ!×¹
˜FÌ…cæùtµHO§ß:ølÚZ{½º¾ÿoÔšp6Ml–ëªÄHÿ	`Ó…¿R2$©9ÉUoNhb"šIq2Ê¾{j·Ô–rs‘²æ†ªSLjIÆ1Ü@ÒXb*ÍàEßsıŞæ ‘ˆšŒuãÖÎKĞ¼Ò„§lÆê\ËÙ(G›&³è}xñ‘\üãâòà˜œ\\’½Ó“·‡çÇ;—‡èÄØ_S¶#;1—º¡2m´;ğè¦LsÊUq¥‹4kİW“O?)¶#ËFñ8¦R¹TNÈ4ILV×jğ$=ÚéR,0 $}±íI‰hhJ’£¡Y’EïUc­wgyDØÏ*gÚ©·¼dÿfš“£Å"ë%6L›¬Æ¬’˜ß&¢|Yı_Q.@Õã¼Vöü¼5Cïİ;‡‘w¿¸]ØHé`3­ñN—EV-7æ*½+Ï¹ˆzVü¸n‘„H;ğìh1Sb=
2Ûª§’…|*n$K{«óÒ(İ=ê“nÆ.G­dO¼3>zş>)Ç9ÏLeÂŸÂgYáóág¶S‰—˜)!S‡~KaR•R:·âkã$bHÄ(hYµ²,Ò Go4z©fÃÛß¥û|GYŞf\$—WÃ r3…Ñ[¼¤LAÙ”Ñ‹’—1±R`¶Ğr1á7Şs•I¾mæD) ±IÉø÷©f¦“óúSÈf%™„´´t^xQñ|90)ª#ÏkU+Oç%¿µ×w»Ÿ÷¼°ë»-ÅAA4Dï¾õ¿¬0Ó¡ã
¦º«>u(1%"Í88ŸÑº€“ˆr$l'f™ŸaNN/ßîÑÓ&tzvpN¿‘·;‡GûJ¬Ó“ŸsTİ‚RÕm[ÀáéN–{5^"KQµ‹ªO!`ªyßÜ/æ*!;æt\ĞB´‰¤¡”»Ã„r7Ó0Î˜u*~d•±ÄŸ§jEº*›İ
ñRFåôûÓÔÂExÑS}«ÊGøá eñ‚LÃÑ÷‚<ÿ€²ÛcÏHòº¥´H¦*=Ü†:%¤ 	‰Ê)ê2AñY,¬ÖŒ¥6KgÚæ66)Î±!Ñ*”èØ“iL%7J»Óª•9^×#ûAw2@àÕá0Áh!©ã:ü'Æ•ÌâRØ±”¼²0ÌLú?Ó…Âxb3ÉŸº@¥ŒªÎ8G`:‰å=mMºçQ¬	 Gı[.VJƒ*p…óÌ°Ú”=Äyã±İö|`8ì
æÿ•å!´»vrŠYäwFÛÎZHºÎğÖÁL'¿zîµG™	CÀU›ñA‰œÚ_ü8ËĞFã¶oqÏyÖ¬_ø‹g5˜©ÿxÃ.å¼í<pICË1Ë±o7ªnäègËÜäeØİÙ`÷;şx{IAyŒ$ò‚…Ğ6ÂÉ`sct@óSo(PuĞ¾œ9ƒ¶œ'ÚPI>1‚l“|¢Ë¹ò=í#¥ÍÇÂ°…üfL=÷få“*~ORÜ)0Soû3söGqpÉbÈıÎà5÷ÛKCÔÙ±[Ù®åhD½=fd†3„}&ŸN#»¶ãª¬ÆÅ¼1W”KÇ,¥T–}Ğèá×£ïª¶¾,ñ×QèÒ ÿ,’ó¥Ò¨uV	½[%Z«³bÒ0áVÄãuŠmSÄÎÌ	HgÖW†á,­3ÍRî?OOIµsêök±™Ùü<2Z!Ç3„üR	ñ4R?ÌgÃ5L¬7¬´ù´şø;Ö-¦Õ¸UÜUG0$v8‹ş-7‰ˆÏ'¬×ßÓğŸŸ^î\²šyì~üCİ“­W­¬¾0)<;ORDdª¤  @˜Öy·óÕ&“b	êÅ”y	_Sæ¾éøUŒP»ÊPËZ'Y'‚?{Lö“Ü;Bú¾õ]„Ø“•¸Ø¤.˜®Çÿúÿ   ÿÿ táÚ