import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Copy, 
  Check, 
  ExternalLink, 
  LogOut, 
  UserPlus, 
  LayoutDashboard, 
  ArrowUpRight, 
  PlusCircle, 
  Key, 
  User, 
  Sparkles, 
  Briefcase, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Wallet, 
  Percent, 
  Send, 
  ChevronRight, 
  Heart, 
  Info,
  MapPin,
  Camera,
  Nfc,
  Trash2,
  Activity
} from 'lucide-react';
import { Companion, ReferralRecord, WithdrawalRecord, MemberLevel, Booking } from '../types';
import { db, collection, setDoc, doc, getDoc } from '../firebase';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { compressImage } from '../services/imageService';

// Custom high-fidelity brand SVGs for MFS gateways
const BkashLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M190.5 400.1H118.9L190.5 233.3H262.1L190.5 400.1Z" fill="currentColor" />
    <path d="M393.1 233.3H321.5L393.1 400.1H464.7L393.1 233.3Z" fill="currentColor" />
    <path d="M291.8 111.9H220.2L291.8 278.7H363.4L291.8 111.9Z" fill="currentColor" />
    <circle cx="148.7" cy="141.7" r="29.8" fill="currentColor" />
  </svg>
);

const NagadLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm-38.4 358.4c-44.2 0-80-35.8-80-80s35.8-80 80-80s80 35.8 80 80s-35.8 80-80 80zm96-128c11-19 32-32 56-32c35.3 0 64 28.7 64 64s-28.7 64-64 64c-24 0-45-13-56-32h-40c16 41 56 70 103 70c61.9 0 112-50.1 112-112S395.9 142 334 142c-47 0-87 29-103 70l1.4 1.4c17.5-16.7 41.3-26.8 67.6-26.8c31.1 0 58.7 14.1 77 36.4l-40 5.4z" fill="currentColor" />
  </svg>
);

const RocketLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M410.3 101.7c-4-4-10.4-4-14.4 0L308.2 191.4c-22.1-14.1-49.8-19.1-76.3-13l-45.7 10.5c-9.1 2.1-15.6 10.1-16 19.5l-2.4 54.4c-11.4 11.4-25.9 19-41.9 22.4l-31.5 6.6c-13.6 2.9-20.9 18-14 30l28.6 49.8c5.4 9.4 17.5 11.9 26.2 5.3l37-28c12.3-9.3 28-11.7 42.4-6.3l49.5 18.5c11.9 4.4 25.1-2.2 28.5-14.3l12.4-44.2c6.9-24.8 2.9-51.2-10.7-72.7l90.4-90.4c4-3.9 4-10.3 0-14.3l-24.6-24.6z" fill="currentColor" />
    <path d="M128 416c-16 16-48 16-64 0s0-48 16-64l48 48-16 16z" fill="currentColor" />
  </svg>
);

interface AgentPortalProps {
  referrals: ReferralRecord[];
  withdrawals: WithdrawalRecord[];
  companions: Companion[];
  bookings?: Booking[];
  onAddWithdrawal: (w: WithdrawalRecord) => void;
  onAddCompanion?: (c: Companion) => void;
  onLogout?: () => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AgentPortal: React.FC<AgentPortalProps> = ({
  referrals = [],
  withdrawals = [],
  companions = [],
  bookings = [],
  onAddWithdrawal,
  onAddCompanion,
  onLogout,
  triggerToast
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('bt_agent_logged_in') === 'true';
  });
  
  const [agentUsername, setAgentUsername] = useState(() => {
    return localStorage.getItem('bt_agent_username') || '';
  });

  const [agentProfile, setAgentProfile] = useState<any | null>(null);

  // Auto-fetch agent details from Firestore
  useEffect(() => {
    if (isLoggedIn && agentUsername) {
      getDoc(doc(db, 'agents', agentUsername.toLowerCase()))
        .then((docSnap) => {
          if (docSnap.exists()) {
            setAgentProfile(docSnap.data());
          }
        })
        .catch((err) => {
          console.warn('Failed to fetch agent profile:', err);
        });
    } else {
      setAgentProfile(null);
    }
  }, [isLoggedIn, agentUsername]);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regPass, setRegPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');

  // Forgot Password States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotTotpCode, setForgotTotpCode] = useState('');

  // 2-Step Verification States
  const [authStep, setAuthStep] = useState<'credentials' | 'totp_setup' | 'totp_verify'>('credentials');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpInputCode, setTotpInputCode] = useState('');
  const [tempAgentUsername, setTempAgentUsername] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Generate QR Code dynamically from Secret & Username
  useEffect(() => {
    if (totpSecret && tempAgentUsername) {
      const label = `BodyTouch_Agent:${tempAgentUsername}`;
      const issuer = 'BodyTouch_Agent';
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${totpSecret}&issuer=${encodeURIComponent(issuer)}`;

      QRCode.toDataURL(otpauthUrl, {
        margin: 2,
        width: 180,
        color: {
          dark: '#030a1c', // Dark color for QR blocks
          light: '#ffffff' // Pure white background
        }
      })
        .then(url => {
          setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.warn('Failed to generate 2FA QR code:', err);
        });
    } else {
      setQrCodeDataUrl('');
    }
  }, [totpSecret, tempAgentUsername]);

  // Dashboard States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'referrals' | 'withdrawals' | 'recruit'>('dashboard');

  // Withdrawal form states
  const [withAmt, setWithAmt] = useState('');
  const [withMethod, setWithMethod] = useState('BKASH');
  const [withNum, setWithNum] = useState('');

  // Recruitment/Submission form states
  const [recName, setRecName] = useState('');
  const [recAge, setRecAge] = useState('22');
  const [recHeight, setRecHeight] = useState("5'4\"");
  const [recRate, setRecRate] = useState('15000');
  const [recSpecialty, setRecSpecialty] = useState('VIP Escort & High Society Dating');
  const [recSubArea, setRecSubArea] = useState('Gulshan');
  const [recLanguages, setRecLanguages] = useState('Bangla, English');
  const [recBio, setRecBio] = useState('');
  const [recPhoto, setRecPhoto] = useState('');
  const [recNid, setRecNid] = useState('');
  const [recCategory, setRecCategory] = useState<'Female Model' | 'Male Model' | 'Sperm Donor'>('Female Model');
  const [recPhone, setRecPhone] = useState('');
  const [recEmail, setRecEmail] = useState('');
  const [recFileLoading, setRecFileLoading] = useState(false);

  // New fields requested by user: Multiple pictures & services selection
  const [recPictures, setRecPictures] = useState<string[]>([]);
  const [recPicturesLoading, setRecPicturesLoading] = useState(false);
  const [recIsRealActive, setRecIsRealActive] = useState(true);
  const [recIsCamActive, setRecIsCamActive] = useState(true);
  const [recIsMakeOutActive, setRecIsMakeOutActive] = useState(false);
  const [recIsLiveTogetherActive, setRecIsLiveTogetherActive] = useState(false);

  // Identity Verification & Registration Payment states for manually recruited companions
  const [recIdType, setRecIdType] = useState<'nid' | 'birth'>('nid');
  const [recNidFront, setRecNidFront] = useState('');
  const [recNidBack, setRecNidBack] = useState('');
  const [recSelfie, setRecSelfie] = useState('');
  const [recNidFrontLoading, setRecNidFrontLoading] = useState(false);
  const [recNidBackLoading, setRecNidBackLoading] = useState(false);
  const [recSelfieLoading, setRecSelfieLoading] = useState(false);

  const [recPaymentMethod, setRecPaymentMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [recPaymentSender, setRecPaymentSender] = useState('');
  const [recPaymentTrx, setRecPaymentTrx] = useState('');
  const [recPaymentAmount, setRecPaymentAmount] = useState('3000');
  const [showRecPaymentModal, setShowRecPaymentModal] = useState(false);
  const [recPaymentCopied, setRecPaymentCopied] = useState(false);

  // Dynamic tracking copy indicators
  const [copiedLink, setCopiedLink] = useState<'client' | 'model' | null>(null);

  // Sync Agent local session helper
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPass.trim()) {
      triggerToast('দয়া করে সঠিক তথ্য দিয়ে লগইন করুন।', 'error');
      return;
    }

    const cleanUsername = loginUsername.trim().toLowerCase();
    const cleanPassword = loginPass.trim();

    try {
      setIsSending(true);
      const agentDocRef = doc(db, 'agents', cleanUsername);
      const agentSnap = await getDoc(agentDocRef);

      if (!agentSnap.exists()) {
        triggerToast('ইউজারনেমটি পাওয়া যায়নি! দয়া করে প্রথমে নিবন্ধন (Register) করুন।', 'error');
        setIsSending(false);
        return;
      }

      const agentData = agentSnap.data() || {};
      
      // Fallback: If agent exists but doesn't have a password set yet, set the entered password as their password so they don't get locked out!
      if (!agentData.password) {
        const updatedData = { ...agentData, password: cleanPassword };
        await setDoc(agentDocRef, updatedData);
      } else if (agentData.password !== cleanPassword) {
        triggerToast('ভুল পাসকোড / পাসওয়ার্ড! অনুগ্রহ করে সঠিক তথ্য দিন।', 'error');
        setIsSending(false);
        return;
      }

      // Credentials are correct, check for TOTP 2FA Secret
      const totpSnap = await getDoc(doc(db, 'agent_totp_secrets', cleanUsername));
      setTempAgentUsername(cleanUsername);
      setTotpInputCode('');

      if (totpSnap.exists()) {
        // Enrolled already, prompt for TOTP Code
        setTotpSecret(totpSnap.data().secret);
        setAuthStep('totp_verify');
        triggerToast('গুগল অথেন্টিকেটর অ্যাপ থেকে ৬ সংখ্যার ২FA কোডটি প্রদান করুন।', 'info');
      } else {
        // Setup a new TOTP secret
        const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let randomSecret = '';
        for (let i = 0; i < 16; i++) {
          randomSecret += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        setTotpSecret(randomSecret);
        setAuthStep('totp_setup');
        triggerToast('নিরাপত্তা সুনিশ্চিত করতে গুগল অথেন্টিকেটর ২FA সেটআপ করুন।', 'info');
      }
    } catch (err) {
      console.warn('Failed to login agent:', err);
      triggerToast('লগইন ব্যর্থ হয়েছে! দয়া করে আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !regFullName.trim() || !regPhone.trim() || !regPass.trim()) {
      triggerToast('দয়া করে সব আবশ্যক ক্ষেত্র পূরণ করুন।', 'error');
      return;
    }

    const cleanUsername = loginUsername.trim().toLowerCase();

    try {
      setIsSending(true);
      const agentDocRef = doc(db, 'agents', cleanUsername);
      const agentSnap = await getDoc(agentDocRef);

      if (agentSnap.exists()) {
        triggerToast('এই ইউজারনেমটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে অন্য ইউজারনেম ব্যবহার করুন বা লগইন করুন।', 'error');
        setIsSending(false);
        return;
      }
      
      // Save to Firestore and LocalStorage
      const agentDetails = {
        username: cleanUsername,
        password: regPass.trim(),
        fullName: regFullName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        role: 'agent',
        dateRegistered: new Date().toLocaleString()
      };

      await setDoc(agentDocRef, agentDetails);

      // Transition straight to TOTP Setup
      const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let randomSecret = '';
      for (let i = 0; i < 16; i++) {
        randomSecret += charSet.charAt(Math.floor(Math.random() * charSet.length));
      }
      setTotpSecret(randomSecret);
      setTempAgentUsername(cleanUsername);
      setTotpInputCode('');
      setAuthStep('totp_setup');
      triggerToast('অ্যাকাউন্ট তৈরি হয়েছে! নিরাপত্তা নিশ্চিত করতে গুগল টু-ফ্যাক্টর অথেনটিকেশন সেটআপ করুন।', 'success');
    } catch (err) {
      console.warn('Failed to save agent to firestore:', err);
      triggerToast('নিবন্ধন ব্যর্থ হয়েছে! দয়া করে আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername.trim() || !forgotPhone.trim() || !forgotTotpCode.trim() || !forgotNewPass.trim()) {
      triggerToast('Please fill in all required fields.', 'error');
      return;
    }

    const cleanUsername = forgotUsername.trim().toLowerCase();
    const cleanPhone = forgotPhone.trim().replace(/\s+/g, '');
    const cleanNewPass = forgotNewPass.trim();
    const cleanTotpCode = forgotTotpCode.trim();

    try {
      setIsSending(true);
      const agentDocRef = doc(db, 'agents', cleanUsername);
      const agentSnap = await getDoc(agentDocRef);

      if (!agentSnap.exists()) {
        triggerToast('Agent username not found!', 'error');
        setIsSending(false);
        return;
      }

      const agentData = agentSnap.data() || {};
      const storedPhone = (agentData.phone || '').trim().replace(/\s+/g, '');

      if (storedPhone !== cleanPhone) {
        triggerToast('Incorrect Phone Number! Verification failed.', 'error');
        setIsSending(false);
        return;
      }

      // Verify Authenticator 2-Step Code
      const totpSnap = await getDoc(doc(db, 'agent_totp_secrets', cleanUsername));
      if (!totpSnap.exists()) {
        triggerToast('This agent account has not completed 2-Step verification setup yet. Please contact Admin.', 'error');
        setIsSending(false);
        return;
      }

      const totpSecretValue = totpSnap.data().secret;
      const totp = new OTPAuth.TOTP({
        issuer: 'BodyTouch_Agent',
        label: cleanUsername,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecretValue)
      });

      const isValid = totp.validate({ token: cleanTotpCode, window: 1 }) !== null;
      if (!isValid) {
        triggerToast('Incorrect Authenticator 2-Step Code! Verification failed.', 'error');
        setIsSending(false);
        return;
      }

      // Safe update
      await setDoc(agentDocRef, { password: cleanNewPass }, { merge: true });

      triggerToast('Password has been successfully updated! Please login with your new password.', 'success');
      
      // Clear states and return to login
      setForgotUsername('');
      setForgotPhone('');
      setForgotTotpCode('');
      setForgotNewPass('');
      setIsForgotPassword(false);
      setLoginUsername(cleanUsername);
      setLoginPass('');
    } catch (err) {
      console.warn('Failed to reset agent password:', err);
      triggerToast('Password reset failed. Please contact support.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyTOTPSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpInputCode.trim()) {
      triggerToast('৬ সংখ্যার কোডটি প্রবেশ করান।', 'error');
      return;
    }

    try {
      setIsSending(true);
      const totp = new OTPAuth.TOTP({
        issuer: 'BodyTouch_Agent',
        label: tempAgentUsername,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret)
      });

      const isValid = totp.validate({ token: totpInputCode.trim(), window: 1 }) !== null;

      if (isValid) {
        // Save verified secret in Firestore
        await setDoc(doc(db, 'agent_totp_secrets', tempAgentUsername), {
          secret: totpSecret,
          verifiedAt: new Date().toISOString()
        });

        // Complete Login
        localStorage.setItem('bt_agent_logged_in', 'true');
        localStorage.setItem('bt_agent_username', tempAgentUsername);
        setIsLoggedIn(true);
        setAgentUsername(tempAgentUsername);
        setTotpInputCode('');
        setAuthStep('credentials');
        triggerToast('গুগল টু-ফ্যাক্টর অথেনটিকেশন সেটআপ ও সফল লগইন সম্পন্ন হয়েছে!', 'success');
      } else {
        triggerToast('ভুল কোড! অনুগ্রহ করে অ্যাপে দেখানো সঠিক ৬ সংখ্যার ডাইনামিক কোডটি দিন।', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('অথেনটিকেশন সেটআপে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyTOTPActive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpInputCode.trim()) {
      triggerToast('৬ সংখ্যার কোডটি প্রবেশ করান।', 'error');
      return;
    }

    try {
      setIsSending(true);
      const totp = new OTPAuth.TOTP({
        issuer: 'BodyTouch_Agent',
        label: tempAgentUsername,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(totpSecret)
      });

      const isValid = totp.validate({ token: totpInputCode.trim(), window: 1 }) !== null;

      if (isValid) {
        // Complete Login
        localStorage.setItem('bt_agent_logged_in', 'true');
        localStorage.setItem('bt_agent_username', tempAgentUsername);
        setIsLoggedIn(true);
        setAgentUsername(tempAgentUsername);
        setTotpInputCode('');
        setAuthStep('credentials');
        triggerToast('২FA যাচাইকরণ ও লগইন সফল হয়েছে!', 'success');
      } else {
        triggerToast('ভুল ২-স্টেপ কোড! গুগল অথেন্টিকেটর অ্যাপে দেখানো বর্তমান ডাইনামিক কোডটি সঠিকভাবে টাইপ করুন।', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('কোড যাচাইকরণে ত্রুটি হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('bt_agent_logged_in');
    localStorage.removeItem('bt_agent_username');
    setIsLoggedIn(false);
    setAgentUsername('');
    triggerToast('লগআউট সফল হয়েছে।', 'info');
  };

  // Derive Agent Referrals, Commissions, and balance
  const agentReferrals = useMemo(() => {
    return referrals.filter(r => r.referrer && r.referrer.toLowerCase() === agentUsername.toLowerCase());
  }, [referrals, agentUsername]);

  // Recruited Companions list for this agent
  const recruitedCompanions = useMemo(() => {
    return companions.filter(c => 
      (c.recruiter && c.recruiter.toLowerCase() === agentUsername.toLowerCase()) ||
      (c.telegram && c.telegram.toLowerCase() === agentUsername.toLowerCase())
    );
  }, [companions, agentUsername]);

  // Recruited companions' completed bookings commission (10% of b.cost)
  const recruitedCommissions = useMemo(() => {
    let sum = 0;
    recruitedCompanions.forEach(c => {
      const companionBookings = bookings.filter(b => 
        b.status === 'Completed' && (
          (b.modelUsername && c.modelUsername && b.modelUsername.toLowerCase() === c.modelUsername.toLowerCase()) ||
          (b.modelName && c.name && b.modelName.toLowerCase() === c.name.toLowerCase())
        )
      );
      companionBookings.forEach(b => {
        sum += (b.cost || 0) * 0.10;
      });
    });
    return sum;
  }, [recruitedCompanions, bookings]);

  const totalCommissions = useMemo(() => {
    const referralComm = agentReferrals.reduce((sum, r) => sum + (r.commission || 0), 0);
    return referralComm + recruitedCommissions;
  }, [agentReferrals, recruitedCommissions]);

  // Approved withdrawals subtraction
  const approvedWithdrawalSum = useMemo(() => {
    return withdrawals
      .filter(w => w.username.toLowerCase() === agentUsername.toLowerCase() && w.status === 'Approved')
      .reduce((sum, w) => sum + w.amount, 0);
  }, [withdrawals, agentUsername]);

  const availableBalance = useMemo(() => {
    // Basic calculation
    return Math.max(0, totalCommissions - approvedWithdrawalSum);
  }, [totalCommissions, approvedWithdrawalSum]);

  // Clicks Simulation / Stats
  const linkClicks = useMemo(() => {
    // Generate an authentic seed click count based on username length and referrals count
    const seed = (agentUsername.length * 47) + (agentReferrals.length * 12) + 14;
    return seed;
  }, [agentUsername, agentReferrals]);

  // Custom link generator for Client signup & Companion recruitment
  const clientRefLink = `${window.location.origin}/#register?ref=${agentUsername.toUpperCase()}`;
  const companionRefLink = `${window.location.origin}/#join?ref=${agentUsername.toUpperCase()}`;

  const copyToClipboard = (text: string, type: 'client' | 'model') => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    triggerToast('লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে!', 'success');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Handle Cashout submission
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withAmt);
    if (isNaN(amt) || amt < 500) {
      triggerToast('সর্বনিম্ন উত্তোলন ৫00 ৳ BDT', 'error');
      return;
    }
    if (amt > availableBalance) {
      triggerToast('আপনার ব্যালেন্সে পর্যাপ্ত পরিমাণ টাকা নেই।', 'error');
      return;
    }
    if (!withNum.trim() || withNum.length < 11) {
      triggerToast('দয়া করে সঠিক মোবাইল ব্যাংকিং নম্বর দিন।', 'error');
      return;
    }

    const newWd: WithdrawalRecord = {
      id: `agent-wd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: agentUsername,
      fullName: `Agent ${agentUsername.toUpperCase()}`,
      amount: amt,
      method: withMethod,
      accountNumber: withNum.trim(),
      date: new Date().toLocaleString(),
      status: 'Pending'
    };

    onAddWithdrawal(newWd);
    
    // Save to Firestore
    try {
      setDoc(doc(db, 'withdrawals', newWd.id), newWd);
    } catch (err) {
      console.warn('Failed to sync withdrawal with firestore:', err);
    }

    triggerToast('উত্তোলন অনুরোধ সফলভাবে পাঠানো হয়েছে। এডমিন ভেরিফাই করবে।', 'success');
    setWithAmt('');
    setWithNum('');
  };

  // Portfolio pictures handlers
  const handleAddRecPicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileList = Array.from(files);
    setRecPicturesLoading(true);
    let loadedCount = 0;
    const newPics: string[] = [];

    fileList.forEach((file: any) => {
      compressImage(file, 600, 600, 0.6)
        .then((compressed) => {
          if (compressed) {
            newPics.push(compressed);
          }
          loadedCount++;
          if (loadedCount === fileList.length) {
            setRecPictures(prev => {
              const combined = [...prev, ...newPics].slice(0, 4);
              return combined;
            });
            setRecPicturesLoading(false);
          }
        })
        .catch((err) => {
          console.warn('Failed to compress portfolio picture:', err);
          loadedCount++;
          if (loadedCount === fileList.length) {
            setRecPicturesLoading(false);
          }
        });
    });
  };

  const handleRemoveRecPicture = (index: number) => {
    setRecPictures(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Companion Recruitment submission
  const handleRecruitmentSubmit = (e?: React.FormEvent, isConfirmedPayment = false) => {
    if (e) e.preventDefault();
    if (!recName.trim() || !recRate.trim()) {
      triggerToast('মডেলের নাম এবং রেট দেওয়া আবশ্যক।', 'error');
      return;
    }

    if (recCategory === 'Male Model' && !isConfirmedPayment) {
      // Intercept and open the high-fidelity payment modal exactly like client's gateway
      setShowRecPaymentModal(true);
      return;
    }

    if (recCategory === 'Male Model' && isConfirmedPayment) {
      if (!recPaymentTrx.trim()) {
        triggerToast('মেল মডেল রেজিস্ট্রেশনের জন্য ট্রানজেকশন আইডি (TrxID) দেওয়া আবশ্যক।', 'error');
        return;
      }
    }

    const finalPhone = recPhone.trim() || '01700-000000';
    const finalEmail = recEmail.trim() || `${recName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}@bodytouch-partner.com`;

    const newComp: any = {
      id: `rec-comp-${Date.now()}`,
      name: recName.trim(),
      tag: 'Premium Recruited Companion',
      badge: 'REGULAR',
      image: recPhoto.trim() || recPictures[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
      pictures: recPictures.length > 0 ? recPictures : (recPhoto.trim() ? [recPhoto.trim()] : []),
      isRealActive: recIsRealActive,
      isCamActive: recIsCamActive,
      isMakeOutActive: recIsMakeOutActive,
      isLiveTogetherActive: recIsLiveTogetherActive,
      age: parseInt(recAge) || 22,
      height: recHeight,
      languages: recLanguages.split(',').map(s => s.trim()),
      specialty: recSpecialty.trim(),
      rate: parseInt(recRate) || 15000,
      rateReal: parseInt(recRate) || 15000,
      rateCam: Math.round((parseInt(recRate) || 15000) * 0.4),
      city: 'Dhaka',
      category: recCategory,
      status: 'Pending', // Sent for Admin Verification
      email: finalEmail,
      phone: finalPhone,
      telegram: agentUsername, // Keep track of recruiter agent username
      recruiter: agentUsername, // Keep track of recruiter agent username
      nidFront: recNidFront || undefined,
      nidBack: recNidBack || undefined,
      selfie: recSelfie || undefined,
      paymentMethod: recCategory === 'Male Model' ? recPaymentMethod : undefined,
      paymentSender: recCategory === 'Male Model' ? (recPaymentSender.trim() || undefined) : undefined,
      paymentTrx: recCategory === 'Male Model' ? (recPaymentTrx.trim() || undefined) : undefined,
      paymentAmount: recCategory === 'Male Model' ? (parseInt(recPaymentAmount) || 3000) : undefined
    };

    if (onAddCompanion) {
      onAddCompanion(newComp);
    }

    // Save to Firestore
    try {
      setDoc(doc(db, 'companions', newComp.id), newComp);
    } catch (err) {
      console.warn('Failed to save recruited companion:', err);
    }

    triggerToast('মডেল প্রোফাইল সফলভাবে পাঠানো হয়েছে! এডমিন প্যানেলে ভেরিফাই হবে।', 'success');
    
    if (showRecPaymentModal) {
      setShowRecPaymentModal(false);
    }

    // Reset form
    setRecName('');
    setRecAge('22');
    setRecHeight("5'4\"");
    setRecRate('15000');
    setRecSpecialty('VIP Escort & High Society Dating');
    setRecSubArea('Gulshan');
    setRecLanguages('Bangla, English');
    setRecBio('');
    setRecPhoto('');
    setRecPictures([]);
    setRecIsRealActive(true);
    setRecIsCamActive(true);
    setRecIsMakeOutActive(false);
    setRecIsLiveTogetherActive(false);
    setRecPhone('');
    setRecEmail('');
    setRecCategory('Female Model');
    setRecNidFront('');
    setRecNidBack('');
    setRecSelfie('');
    setRecPaymentSender('');
    setRecPaymentTrx('');
    setRecPaymentAmount('3000');
    setRecPaymentMethod('BKASH');
  };

  return (
    <div className="w-full min-h-screen bg-[#020510] text-[#c5d3f0] font-sans overflow-x-hidden selection:bg-[#dbaa61] selection:text-slate-950">
      
      {/* Background visual ambience elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-15%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50vw] h-[50vw] rounded-full bg-[#dbaa61]/5 blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">

        {!isLoggedIn ? (
          /* Login/Register screen */
          <div className="max-w-md mx-auto my-12 md:my-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-b from-[#030a1c] to-[#010512] border border-[#dbaa61]/20 rounded-3xl p-8 shadow-2xl shadow-[#dbaa61]/5 relative overflow-hidden"
            >
              {/* Golden ribbon header decoration */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#dbaa61] to-transparent" />
              
              <div className="text-center space-y-2 mb-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] p-0.5 flex items-center justify-center shadow-lg shadow-[#dbaa61]/20">
                  <div className="w-full h-full rounded-full bg-[#020714] flex items-center justify-center">
                    <Briefcase className="w-7 h-7 text-[#dbaa61]" />
                  </div>
                </div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase font-display mt-4">
                  Body Touch Partner Portals
                </h1>
                <p className="text-[10px] md:text-xs text-amber-500/80 font-bold uppercase tracking-widest">
                  Agent & Recruiter Panel
                </p>
              </div>

              {authStep === 'totp_setup' ? (
                /* Google Authenticator Enrollment Stage */
                <form onSubmit={handleVerifyTOTPSetup} className="space-y-5 text-center">
                  <div className="bg-[#dbaa61]/5 border border-[#dbaa61]/20 rounded-2xl p-4 text-left space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-[#dbaa61]">
                        <Key className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase text-[#dbaa61] tracking-wider">
                        2-Step Security Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Open <strong className="text-white font-black">Google Authenticator</strong> or <strong className="text-white font-black">Microsoft Authenticator</strong> on your mobile phone and scan the QR Code or add the Secret Key manually:
                    </p>

                    {/* QR Code scanning container */}
                    {qrCodeDataUrl && (
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl mx-auto my-3 w-[160px] h-[160px] shadow-lg shadow-black/40 border-2 border-[#dbaa61]/30">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="Authenticator 2FA QR Code" 
                          className="w-full h-full select-none"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Key copy area */}
                    <div className="bg-slate-950 border border-blue-900/30 rounded-xl p-3 flex items-center justify-between gap-2 mt-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Secret Verification Key</div>
                        <div className="text-xs font-mono font-bold text-amber-500 select-all tracking-wider break-all mt-0.5">
                          {totpSecret}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(totpSecret);
                          triggerToast('Secret Key copied successfully!', 'success');
                        }}
                        className="p-2 bg-[#dbaa61]/10 hover:bg-[#dbaa61]/20 text-[#dbaa61] rounded-lg transition active:scale-95 shrink-0"
                        title="Copy Secret Key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[10px] text-amber-500/80 font-black leading-relaxed">
                      ⚠️ Note: You can manually add the key to your Authenticator app using Account Name: "BodyTouch_Agent ({tempAgentUsername})".
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Enter 6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={totpInputCode}
                      onChange={(e) => setTotpInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder=""
                      className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 px-4 text-center text-lg font-mono tracking-[0.3em] font-black focus:outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 disabled:brightness-75 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition duration-300 shadow-lg shadow-[#dbaa61]/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 animate-pulse" />
                      {isSending ? 'Verifying...' : 'Verify & Enroll'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthStep('credentials')}
                      className="w-full bg-[#0f121d] border border-slate-800 hover:bg-slate-900 text-slate-400 font-bold text-xs uppercase py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : authStep === 'totp_verify' ? (
                /* Google Authenticator Regular Login Verification Stage */
                <form onSubmit={handleVerifyTOTPActive} className="space-y-5 text-center">
                  <div className="bg-blue-950/20 border border-blue-900/35 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider">
                        Two-Step 2FA Verification
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      To ensure security, please enter the current 6-digit dynamic code generated by your registered <strong className="text-white font-black">Google Authenticator</strong> app below.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Enter 6-Digit Verification OTP
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={totpInputCode}
                      onChange={(e) => setTotpInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder=""
                      className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-3 px-4 text-center text-xl font-mono tracking-[0.4em] font-black focus:outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 disabled:brightness-75 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition duration-300 shadow-lg shadow-[#dbaa61]/10 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {isSending ? 'Verifying...' : 'Confirm Login'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthStep('credentials')}
                      className="w-full bg-[#0f121d] border border-slate-800 hover:bg-slate-900 text-slate-400 font-bold text-xs uppercase py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Go Back
                    </button>
                  </div>
                </form>
              ) : isForgotPassword ? (
                /* Forgot Password Form */
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="bg-amber-950/20 border border-amber-900/35 rounded-2xl p-4 text-left space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                        Reset Secure Password
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Enter your registered Username, Phone Number, and your Google Authenticator 2-Step verification code to verify your identity and set a new secure password.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Agent Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        placeholder="" 
                        className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Registered Phone Number *
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="" 
                      className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 px-4 text-xs font-mono focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      6-Digit Authenticator Code *
                    </label>
                    <input 
                      type="text" 
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={forgotTotpCode}
                      onChange={(e) => setForgotTotpCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 123456" 
                      className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 px-4 text-xs font-mono focus:outline-none transition-all text-center tracking-widest font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      New Secure Password *
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        required
                        value={forgotNewPass}
                        onChange={(e) => setForgotNewPass(e.target.value)}
                        placeholder="" 
                        className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 disabled:brightness-75 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition duration-300 shadow-lg shadow-[#dbaa61]/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isSending ? 'Updating...' : 'Update Password'}
                  </button>

                  <div className="text-center pt-4 pb-1">
                    <button 
                      type="button" 
                      onClick={() => setIsForgotPassword(false)} 
                      className="text-xs text-slate-300 hover:text-white transition duration-200 cursor-pointer py-2 px-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 hover:border-slate-700 active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 mx-auto min-h-[46px] w-full shadow-md shadow-black/10 transition-all"
                    >
                      <span>Remember password?</span>
                      <span className="text-[#dbaa61] font-extrabold underline decoration-[#dbaa61] decoration-2">Login Here</span>
                    </button>
                  </div>
                </form>
              ) : isRegistering ? (
                /* Registration Gate */
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Agent Username *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="" 
                        className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="" 
                      className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 px-4 text-xs focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Phone Number *
                    </label>
                    <input 
                      type="tel" 
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="" 
                      className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 px-4 text-xs font-mono focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Email (Optional)
                    </label>
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="" 
                      className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 px-4 text-xs font-mono focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Secure Password *
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        required
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        placeholder="" 
                        className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 disabled:brightness-75 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition duration-300 shadow-lg shadow-[#dbaa61]/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    {isSending ? 'Processing...' : 'Register Partner'}
                  </button>

                  <div className="text-center pt-4 pb-1">
                    <button 
                      type="button" 
                      onClick={() => setIsRegistering(false)} 
                      className="text-xs text-slate-300 hover:text-white transition duration-200 cursor-pointer py-2 px-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800 hover:border-slate-700 active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 mx-auto min-h-[46px] w-full shadow-md shadow-black/10 transition-all"
                    >
                      <span>Already have an account?</span>
                      <span className="text-[#dbaa61] font-extrabold underline decoration-[#dbaa61] decoration-2">Login Here</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Login Gate */
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                      Partner Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        required
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="" 
                        className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] text-[#dbaa61] font-black uppercase tracking-wider">
                        Secure Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotUsername(loginUsername);
                        }}
                        className="text-[10px] text-amber-500 hover:text-white font-extrabold transition duration-200 cursor-pointer underline decoration-amber-500/30 hover:decoration-white/50"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        required
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="" 
                        className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSending}
                    className="w-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 disabled:brightness-75 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition duration-300 shadow-lg shadow-[#dbaa61]/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isSending ? 'Processing...' : 'Access Portal'}
                  </button>

                  <div className="text-center pt-4 pb-1">
                    <button 
                      type="button" 
                      onClick={() => setIsRegistering(true)} 
                      className="text-xs text-[#dbaa61] hover:text-white transition duration-200 cursor-pointer py-2 px-4 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 hover:border-amber-500/20 active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 mx-auto min-h-[46px] w-full shadow-md shadow-amber-500/5 hover:shadow-amber-500/10 transition-all"
                    >
                      <span>Want to open a partner account?</span>
                      <span className="font-extrabold underline decoration-[#dbaa61] decoration-2">Click Here</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        ) : (
          /* Logged In Agent Panel Main Dashboard UI */
          <div className="space-y-6">
            
            {/* 1. Header Banner */}
            <div className="bg-gradient-to-b from-[#030a1c] to-[#010512] border border-[#dbaa61]/15 rounded-3xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 w-full">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] p-0.5 flex items-center justify-center shrink-0 shadow">
                  <div className="w-full h-full rounded-full bg-[#020714] flex items-center justify-center text-xs font-black text-[#dbaa61]">
                    {agentUsername.substring(0,2).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight truncate">
                      Agent: {agentUsername}
                    </h2>
                    <span className="text-[8px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded shrink-0">
                      Official Partner
                    </span>
                  </div>
                  
                  {/* Elegant Agent Profile Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 mt-2 border-t border-blue-900/10 pt-2 text-[10px] sm:text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500 mr-1 font-bold">নাম (Name):</span>
                      <span className="text-[#dbaa61] font-bold">{agentProfile?.fullName || '...'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-1 font-bold">মোবাইল (Phone):</span>
                      <span className="text-white font-mono">{agentProfile?.phone || '...'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-1 font-bold">নিবন্ধন (Date):</span>
                      <span className="text-slate-300 font-mono text-[9px]">{agentProfile?.dateRegistered ? agentProfile.dateRegistered.split(',')[0] : '...'}</span>
                    </div>
                    {agentProfile?.email && (
                      <div className="sm:col-span-3 mt-0.5">
                        <span className="text-slate-500 mr-1 font-bold">ইমেইল (Email):</span>
                        <span className="text-slate-300 font-mono text-[9.5px]">{agentProfile.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full md:w-auto">
                <a 
                  href="/" 
                  className="px-4 py-2.5 bg-[#030a1c] border border-blue-900/30 text-xs font-bold rounded-xl text-slate-300 hover:text-white hover:bg-slate-900 flex items-center justify-center gap-1.5 transition duration-200"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Main Site</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/30 text-xs font-bold rounded-xl text-red-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>

            {/* 2. Navigation Tabs (Highly Optimized 2x2 Grid for Mobile, Classic Flat Row for Desktop) */}
            <div className="grid grid-cols-2 sm:flex sm:border-b sm:border-blue-900/25 gap-2 sm:gap-1 pb-1">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`py-3 sm:py-2.5 px-3.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 sm:gap-1.5 transition cursor-pointer text-left sm:text-center rounded-xl sm:rounded-none sm:border-b-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-tr from-[#a67c33]/15 to-[#dbaa61]/5 border-[#dbaa61] text-[#dbaa61] sm:bg-none sm:border-[#dbaa61] sm:text-white'
                    : 'bg-slate-950/40 sm:bg-transparent border-blue-900/10 sm:border-transparent text-slate-400 hover:text-slate-200'
                } border sm:border-0`}
              >
                <LayoutDashboard className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#dbaa61] shrink-0" />
                <div className="flex flex-col sm:block min-w-0">
                  <span className="hidden sm:inline">Dashboard Overview</span>
                  <span className="sm:hidden text-[10px] text-white block truncate">Overview</span>
                  <span className="sm:hidden text-[8px] text-slate-400 block font-normal capitalize truncate">ওভারভিউ</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('referrals')}
                className={`py-3 sm:py-2.5 px-3.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 sm:gap-1.5 transition cursor-pointer text-left sm:text-center rounded-xl sm:rounded-none sm:border-b-2 ${
                  activeTab === 'referrals'
                    ? 'bg-gradient-to-tr from-blue-500/15 to-blue-600/5 border-blue-500 text-blue-400 sm:bg-none sm:border-[#dbaa61] sm:text-white'
                    : 'bg-slate-950/40 sm:bg-transparent border-blue-900/10 sm:border-transparent text-slate-400 hover:text-slate-200'
                } border sm:border-0`}
              >
                <Users className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
                <div className="flex flex-col sm:block min-w-0">
                  <span className="hidden sm:inline">My Recruited Models ({recruitedCompanions.length})</span>
                  <span className="sm:hidden text-[10px] text-white block truncate">My Models ({recruitedCompanions.length})</span>
                  <span className="sm:hidden text-[8px] text-slate-400 block font-normal capitalize truncate">আমার মডেল</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('withdrawals')}
                className={`py-3 sm:py-2.5 px-3.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 sm:gap-1.5 transition cursor-pointer text-left sm:text-center rounded-xl sm:rounded-none sm:border-b-2 ${
                  activeTab === 'withdrawals'
                    ? 'bg-gradient-to-tr from-emerald-500/15 to-emerald-600/5 border-emerald-500 text-emerald-400 sm:bg-none sm:border-[#dbaa61] sm:text-white'
                    : 'bg-slate-950/40 sm:bg-transparent border-blue-900/10 sm:border-transparent text-slate-400 hover:text-slate-200'
                } border sm:border-0`}
              >
                <Wallet className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                <div className="flex flex-col sm:block min-w-0">
                  <span className="hidden sm:inline">Withdrawal Requests</span>
                  <span className="sm:hidden text-[10px] text-white block truncate">Withdrawal</span>
                  <span className="sm:hidden text-[8px] text-slate-400 block font-normal capitalize truncate">উইথড্র রিকোয়েস্ট</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('recruit')}
                className={`py-3 sm:py-2.5 px-3.5 sm:px-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-2 sm:gap-1.5 transition cursor-pointer text-left sm:text-center rounded-xl sm:rounded-none sm:border-b-2 ${
                  activeTab === 'recruit'
                    ? 'bg-gradient-to-tr from-cyan-500/15 to-cyan-600/5 border-cyan-500 text-cyan-400 sm:bg-none sm:border-[#dbaa61] sm:text-white'
                    : 'bg-slate-950/40 sm:bg-transparent border-blue-900/10 sm:border-transparent text-slate-400 hover:text-slate-200'
                } border sm:border-0`}
              >
                <PlusCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
                <div className="flex flex-col sm:block min-w-0">
                  <span className="hidden sm:inline">Model File Upload</span>
                  <span className="sm:hidden text-[10px] text-white block truncate">File Upload</span>
                  <span className="sm:hidden text-[8px] text-slate-400 block font-normal capitalize truncate">মডেল ফাইল আপলোড</span>
                </div>
              </button>
            </div>

            {/* 3. Conditional Content Windows */}
            <div className="w-full">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  
                  {/* Stats Bento Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    
                    {/* Stat 1: Recruited Companions */}
                    <div className="bg-[#030a1c] border border-blue-900/20 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-2 right-2 p-1 bg-blue-500/10 rounded-lg">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                      </div>
                      <span className="text-[7.5px] sm:text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                        Recruited Companions
                      </span>
                      <h3 className="text-base sm:text-xl md:text-2xl font-mono font-black text-white mt-1">
                        {recruitedCompanions.length}
                      </h3>
                      <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold mt-1 uppercase">
                        Registered models
                      </p>
                    </div>

                    {/* Stat 2: Active Companions */}
                    <div className="bg-[#030a1c] border border-blue-900/20 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-2 right-2 p-1 bg-[#dbaa61]/10 rounded-lg">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dbaa61]" />
                      </div>
                      <span className="text-[7.5px] sm:text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                        Active & Verified Models
                      </span>
                      <h3 className="text-base sm:text-xl md:text-2xl font-mono font-black text-white mt-1">
                        {recruitedCompanions.filter(c => c.status === 'Approved' || c.status === 'Live').length}
                      </h3>
                      <p className="text-[8px] sm:text-[9px] text-[#dbaa61] font-bold mt-1 uppercase">
                        Published on platform
                      </p>
                    </div>

                    {/* Stat 3: Total Earnings */}
                    <div className="bg-[#030a1c] border border-blue-900/20 p-4 sm:p-5 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-2 right-2 p-1 bg-emerald-500/10 rounded-lg">
                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                      </div>
                      <span className="text-[7.5px] sm:text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                        Accumulated Commission
                      </span>
                      <h3 className="text-base sm:text-xl md:text-2xl font-mono font-black text-white mt-1">
                        ৳{totalCommissions.toLocaleString()}
                      </h3>
                      <p className="text-[8.5px] sm:text-[9px] text-slate-400 font-bold mt-1 uppercase leading-snug">
                        <span className="block xl:inline">Ref: ৳{agentReferrals.reduce((sum, r) => sum + (r.commission || 0), 0).toLocaleString()}</span>
                        <span className="hidden xl:inline"> • </span>
                        <span className="block xl:inline">Rec: ৳{recruitedCommissions.toLocaleString()}</span>
                      </p>
                    </div>

                    {/* Stat 4: Available Wallet Balance */}
                    <div className="bg-[#030a1c] border border-[#dbaa61]/30 p-4 sm:p-5 rounded-2xl relative overflow-hidden bg-gradient-to-tr from-slate-950/50 to-transparent">
                      <div className="absolute top-2 right-2 p-1 bg-[#dbaa61]/10 rounded-lg">
                        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#dbaa61]" />
                      </div>
                      <span className="text-[7.5px] sm:text-[8px] font-black uppercase text-amber-400 tracking-wider block">
                        Withdrawal Balance
                      </span>
                      <h3 className="text-base sm:text-xl md:text-2xl font-mono font-black text-white mt-1">
                        ৳{availableBalance.toLocaleString()}
                      </h3>
                      <p className="text-[8px] sm:text-[9px] text-emerald-400 font-bold mt-1 uppercase">
                        Ready to cash out
                      </p>
                    </div>

                  </div>

                  {/* Promotion Link Generator Box */}
                  <div className="bg-gradient-to-br from-[#030e25] to-[#010614] border border-blue-900/35 rounded-2xl p-4 sm:p-6 space-y-5">
                    <div className="flex items-center gap-2 border-b border-blue-900/20 pb-3">
                      <Sparkles className="w-5 h-5 text-[#dbaa61] animate-pulse" />
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          Your Exclusive Promotion Links / আপনার প্রোমোশন লিংকসমূহ
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">
                          প্লাটফর্মে মেম্বারশিপ ও কাস্টমার রেফারেল এবং মডেল নিয়োগ লিংক নিচে দেওয়া হলো
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Link 1: Customer / Membership Referral Link */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/20 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-[#dbaa61] tracking-wider font-mono">
                              1. Client Membership Link (গ্রাহক মেম্বারশিপ লিংক)
                            </span>
                            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black font-mono">
                              5% COMMISSION
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-relaxed">
                            কাস্টমারদের এই লিংকের মাধ্যমে আমন্ত্রণ জানান। যে কাস্টমার সাইনআপ করে মেম্বারশিপ পেমেন্ট সম্পন্ন করবে, তার <span className="text-emerald-400 font-extrabold">৫% ফিক্সড কমিশন</span> আজীবন আপনার ওয়ালেটে যুক্ত হতে থাকবে।
                          </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <input 
                            type="text" 
                            readOnly 
                            value={clientRefLink} 
                            className="w-full bg-[#020510] text-slate-300 font-mono text-[10px] py-2 px-2.5 rounded-lg border border-blue-900/30 focus:outline-none select-all"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(clientRefLink, 'client')}
                            className="px-3 py-1.5 bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 text-slate-950 font-black text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedLink === 'client' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink === 'client' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Link 2: Companion Recruitment / Model File Upload Link */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/20 flex flex-col justify-between space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider font-mono">
                              2. Model Recruitment Link (মডেল নিয়োগ লিংক)
                            </span>
                            <span className="text-[8px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded font-black font-mono">
                              10% COMMISSION
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-relaxed">
                            নতুন মডেল বা সহচরদের আকর্ষণ করতে এই লিংক শেয়ার করুন। এই লিংকের মাধ্যমে কোনো স্বাধীন মডেল প্লাটফর্মে নিবন্ধিত হলে, তাদের অর্জিত রেটের <span className="text-cyan-400 font-extrabold">১০% লাইফটাইম কমিশন</span> আপনি পাবেন।
                          </p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <input 
                            type="text" 
                            readOnly 
                            value={companionRefLink} 
                            className="w-full bg-[#020510] text-slate-300 font-mono text-[10px] py-2 px-2.5 rounded-lg border border-blue-900/30 focus:outline-none select-all"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(companionRefLink, 'model')}
                            className="px-3 py-1.5 bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 text-slate-950 font-black text-xs rounded-lg transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedLink === 'model' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink === 'model' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Quick Agent Rules/Faq card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950 border border-blue-900/10 rounded-xl space-y-2 text-left">
                      <span className="text-amber-500 font-black text-sm">💰 1. Commissions</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                        প্রতিটি সফল মেম্বারশিপ পেমেন্ট থেকে ৫% ফিক্সড কমিশন পান। কাস্টমারের মেম্বারশিপ ক্যাটাগরি অনুযায়ী ৫% কমিশন হিসাব করা হয়।
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-blue-900/10 rounded-xl space-y-2 text-left">
                      <span className="text-cyan-500 font-black text-sm">⚡ 2. Instant Cashout</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                        ৳৫০০ টাকা বা তার বেশি ব্যালেন্স হলেই bKash/Nagad/Rocket এর মাধ্যমে উত্তোলন করতে পারবেন। এডমিন ১০-৩০ মিনিটের মধ্যে অ্যাপ্রুভ করবে।
                      </p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-blue-900/10 rounded-xl space-y-2 text-left">
                      <span className="text-emerald-500 font-black text-sm">📁 3. Model File Upload</span>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                        মডেল ফাইল ও প্রোফাইল আপলোড করুন এবং সাব-এজেন্ট হিসেবে তাদের অর্জিত রেটের ১০% কমিশন আজীবন লাভ করুন। ফাইল আপলোড করতে ডানপাশের ট্যাবে যান।
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB: REFERRALS (RECRUITED COMPANIONS) */}
              {activeTab === 'referrals' && (
                <div className="bg-[#030a1c] border border-blue-900/20 rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-blue-900/25 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        My Recruited Companions (আমার রিক্রুটকৃত মডেল তালিকা)
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        আপনার মডেল নিয়োগ লিংকের মাধ্যমে নিবন্ধিত ও আপনার রিক্রুটকৃত একটিভ সহচর তালিকা
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-amber-950/25 text-[#dbaa61] border border-amber-500/20 text-xs font-black rounded-lg w-fit">
                      {recruitedCompanions.length} Companions
                    </span>
                  </div>

                  {recruitedCompanions.length === 0 ? (
                    <div className="text-center py-12 space-y-2">
                      <Users className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                      <p className="text-xs text-slate-450 font-bold">এখনো কোন মডেল রিক্রুট করা হয়নি।</p>
                      <button 
                        onClick={() => setActiveTab('recruit')} 
                        className="text-[10px] font-black text-[#dbaa61] uppercase tracking-wider underline hover:text-white cursor-pointer"
                      >
                        নতুন মডেল রিক্রুটমেন্ট সাবমিট করতে এখানে ক্লিক করুন
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-blue-900/20 text-slate-400 font-black uppercase text-[9px] tracking-wider">
                            <th className="py-3 px-2">Companion Name</th>
                            <th className="py-3 px-2 text-center">Hourly Rate (৳)</th>
                            <th className="py-3 px-2 text-center">Age & Area</th>
                            <th className="py-3 px-2 text-center">Specialty</th>
                            <th className="py-3 px-2 text-right">Verification Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-950/40">
                          {recruitedCompanions.map((c, i) => (
                            <tr key={c.id || i} className="hover:bg-blue-950/20 transition-colors">
                              <td className="py-3 px-2 font-black text-white flex items-center gap-2">
                                <img
                                  src={c.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'}
                                  alt={c.name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full border border-blue-900/30 object-cover"
                                />
                                <div>
                                  <p>{c.name}</p>
                                  <p className="text-[9px] text-slate-500 font-mono">ID: {c.id}</p>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-center text-slate-300 font-mono">
                                ৳{(c.rate || 0).toLocaleString()} / hr
                              </td>
                              <td className="py-3 px-2 text-center text-slate-400 font-mono">
                                {c.age} yrs • {c.city}
                              </td>
                              <td className="py-3 px-2 text-center text-slate-400">
                                {c.specialty}
                              </td>
                              <td className="py-3 px-2 text-right">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                  c.status === 'Approved' || c.status === 'Live' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 font-bold' :
                                  c.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                }`}>
                                  {c.status || 'Pending Verification'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              )}

              {/* TAB: WITHDRAWALS */}
              {activeTab === 'withdrawals' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Withdrawal Form */}
                  <div className="bg-[#030a1c] border border-blue-900/20 rounded-2xl p-6 h-fit space-y-4 lg:col-span-1">
                    <div className="border-b border-blue-900/25 pb-3">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Request Cashout (টাকা তুলুন)
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        মোবাইল ব্যাংকিংয়ের মাধ্যমে ব্যালেন্স উত্তোলন করুন
                      </p>
                    </div>

                    <div className="p-3 bg-blue-950/20 border border-blue-900/20 rounded-xl space-y-1">
                      <span className="text-[8px] font-black uppercase text-slate-400 block">Available for withdrawal:</span>
                      <span className="text-lg font-mono font-black text-[#dbaa61]">৳{availableBalance.toLocaleString()} BDT</span>
                    </div>

                    <form onSubmit={handleWithdrawalSubmit} className="space-y-4 text-left">
                      <div className="space-y-1">
                        <label className="block text-[9px] text-blue-400 font-extrabold uppercase tracking-wider">
                          Withdrawal Amount (টাকার পরিমাণ)
                        </label>
                        <input 
                          type="number" 
                          required
                          min="500"
                          value={withAmt}
                          onChange={(e) => setWithAmt(e.target.value)}
                          placeholder="e.g. 2000" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 pl-4 pr-4 text-xs font-mono focus:outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] text-blue-400 font-extrabold uppercase tracking-wider">
                          Gateway Method
                        </label>
                        <select
                          value={withMethod}
                          onChange={(e) => setWithMethod(e.target.value)}
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                        >
                          <option value="BKASH">bKash Personal</option>
                          <option value="NAGAD">Nagad Personal</option>
                          <option value="ROCKET">Rocket Personal</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] text-blue-400 font-extrabold uppercase tracking-wider">
                          Receiver Mobile Number
                        </label>
                        <input 
                          type="tel" 
                          required
                          value={withNum}
                          onChange={(e) => setWithNum(e.target.value)}
                          placeholder="e.g. 01712345678" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-4 text-xs font-mono focus:outline-none transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={availableBalance < 500}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-widest py-3 rounded-xl transition duration-300 shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        সাবমিট করুন (Send Cashout)
                      </button>
                    </form>
                  </div>

                  {/* Previous Withdrawal History */}
                  <div className="bg-[#030a1c] border border-blue-900/20 rounded-2xl p-6 lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-900/25 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          Withdrawal Logs (উত্তোলন ট্র্যাকিং ও ইতিহাস)
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          আপনার উত্তোলন অনুরোধের রিয়েলটাইম স্ট্যাটাস
                        </p>
                      </div>
                    </div>

                    {withdrawals.filter(w => w.username.toLowerCase() === agentUsername.toLowerCase()).length === 0 ? (
                      <div className="text-center py-12 space-y-2">
                        <Wallet className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                        <p className="text-xs text-slate-450 font-bold">কোন পূর্ববর্তী উত্তোলনের রেকর্ড পাওয়া যায়নি।</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-none">
                        {withdrawals
                          .filter(w => w.username.toLowerCase() === agentUsername.toLowerCase())
                          .map((w, index) => (
                            <div 
                              key={w.id || index}
                              className="p-4 bg-slate-950 border border-blue-900/10 hover:border-blue-900/25 rounded-xl flex items-center justify-between gap-4 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${w.method.toUpperCase().includes('BKASH') ? 'bg-[#e2125d]/10 text-[#e2125d]' : w.method.toUpperCase().includes('NAGAD') ? 'bg-[#f15a22]/10 text-[#f15a22]' : 'bg-[#8c3494]/10 text-[#8c3494]'}`}>
                                  <span className="text-[9.5px] font-black uppercase font-mono">{w.method.substring(0,3)}</span>
                                </div>
                                <div>
                                  <p className="text-xs font-black text-white">৳{w.amount.toLocaleString()} BDT</p>
                                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">{w.accountNumber} • {w.date}</p>
                                </div>
                              </div>

                              <div>
                                {w.status === 'Pending' ? (
                                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8.5px] font-black uppercase rounded-lg flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ⏳ Pending
                                  </span>
                                ) : w.status === 'Approved' ? (
                                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8.5px] font-black uppercase rounded-lg flex items-center gap-1">
                                    <Check className="w-3 h-3" /> ✓ Approved
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[8.5px] font-black uppercase rounded-lg flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> ❌ Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB: MODEL FILE UPLOAD */}
              {activeTab === 'recruit' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Instructions sidepanel */}
                  <div className="bg-[#030a1c] border border-blue-900/20 rounded-2xl p-6 h-fit space-y-4 lg:col-span-1 text-left">
                    <div className="border-b border-blue-900/25 pb-3">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Model File Upload Panel
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        নতুন মডেল বা সহচরী প্রোফাইল ও ফাইল আপলোড প্রটোকল
                      </p>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-300">
                      <p className="leading-relaxed">
                        আপনি কি কোনো স্বাধীন মডেল বা এস্কর্টের প্রোফাইল ও ফাইল সাবমিট করতে চান? প্রয়োজনীয় ফাইল ও তথ্য এখানে আপলোড করুন।
                      </p>
                      <div className="p-3 bg-[#dbaa61]/5 border border-[#dbaa61]/20 rounded-xl space-y-2">
                        <span className="text-[9.5px] font-black uppercase text-[#dbaa61] block">আপলোড গাইডলাইন ও রুলস:</span>
                        <ul className="list-disc pl-4 space-y-1 text-[10.5px] font-semibold text-slate-300">
                          <li>নাম ও সঠিক বয়স এবং ছবি প্রদান করতে হবে।</li>
                          <li>আসল ও আকর্ষণীয় প্রোফাইল ছবি আপলোড করতে হবে।</li>
                          <li>ভ্যালিড ন্যাশনাল আইডি (NID) থাকতে হবে।</li>
                          <li>মডেল সফলভাবে বুকিং সম্পন্ন করলে তাদের পেমেন্টের ১০% কমিশন রিক্রুটার/আপলোডার হিসেবে আপনার ওয়ালেটে আজীবন জমা হবে।</li>
                        </ul>
                      </div>
                      <p className="text-[10.5px] text-slate-400 leading-normal">
                        * ফাইল ও প্রোফাইল আপলোড করার পর আমাদের কোয়ালিটি কন্ট্রোল টিম যাচাই করে ১০-৩০ মিনিটের মধ্যে লাইভ করবে।
                      </p>
                    </div>
                  </div>

                  {/* Submission Form */}
                  <div className="bg-[#030a1c] border border-blue-900/20 rounded-2xl p-6 lg:col-span-2 space-y-4">
                    <div className="border-b border-blue-900/25 pb-3">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Upload Model Files & Profile / মডেল ফাইল ও প্রোফাইল আপলোড
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        প্রয়োজনীয় ফাইল ও তথ্যাদি সঠিকভাবে প্রদান করে আপলোড করুন
                      </p>
                    </div>

                    <form onSubmit={handleRecruitmentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          মডেলের নাম (Companion Name) *
                        </label>
                        <input 
                          type="text" 
                          required
                          value={recName}
                          onChange={(e) => setRecName(e.target.value)}
                          placeholder="e.g. Priyata Gomez" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          বয়স (Age) *
                        </label>
                        <input 
                          type="number" 
                          required
                          value={recAge}
                          onChange={(e) => setRecAge(e.target.value)}
                          placeholder="e.g. 23" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          উচ্চতা (Height)
                        </label>
                        <input 
                          type="text" 
                          value={recHeight}
                          onChange={(e) => setRecHeight(e.target.value)}
                          placeholder="e.g. 5ft 5in" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          সার্ভিস চার্জ প্রতি ঘন্টা (Hourly Rate in BDT) *
                        </label>
                        <input 
                          type="number" 
                          required
                          value={recRate}
                          onChange={(e) => setRecRate(e.target.value)}
                          placeholder="e.g. 15000" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          বিশেষত্ব (Specialty / Skillset)
                        </label>
                        <input 
                          type="text" 
                          value={recSpecialty}
                          onChange={(e) => setRecSpecialty(e.target.value)}
                          placeholder="e.g. Traditional Massage & VIP Dating" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          এলাকা (Sub Area Location)
                        </label>
                        <select 
                          value={recSubArea}
                          onChange={(e) => setRecSubArea(e.target.value)}
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                        >
                          <option value="Gulshan">Gulshan</option>
                          <option value="Banani">Banani</option>
                          <option value="Dhanmondi">Dhanmondi</option>
                          <option value="Uttara">Uttara</option>
                          <option value="Mirpur">Mirpur</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          মডেলের ক্যাটাগরি / জেন্ডার (Category / Gender) *
                        </label>
                        <select 
                          value={recCategory}
                          onChange={(e) => setRecCategory(e.target.value as any)}
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                        >
                          <option value="Female Model">Female Model (নারী মডেল)</option>
                          <option value="Male Model">Male Model (পুরুষ মডেল)</option>
                          <option value="Sperm Donor">Sperm Donor (স্পার্ম ডোনার)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          মডেলের মোবাইল নাম্বার (Contact Phone)
                        </label>
                        <input 
                          type="text" 
                          value={recPhone}
                          onChange={(e) => setRecPhone(e.target.value)}
                          placeholder="e.g. 01712-345678" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          মডেলের ইমেইল অ্যাড্রেস (Contact Email)
                        </label>
                        <input 
                          type="email" 
                          value={recEmail}
                          onChange={(e) => setRecEmail(e.target.value)}
                          placeholder="e.g. companion@email.com" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          ভাষা (Languages Spoken - Separated by Comma)
                        </label>
                        <input 
                          type="text" 
                          value={recLanguages}
                          onChange={(e) => setRecLanguages(e.target.value)}
                          placeholder="e.g. Bangla, English, Hindi" 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider flex items-center justify-between">
                          <span>প্রোফাইল ফটো (Profile Photo URL or local upload) *</span>
                          {recFileLoading && <span className="text-blue-400 animate-pulse text-[9.5px]">Uploading...</span>}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={recPhoto}
                            onChange={(e) => setRecPhoto(e.target.value)}
                            placeholder="e.g. https://images.unsplash.com/photo-1544005313-94ddf0286df2" 
                            className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all font-mono"
                          />
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setRecFileLoading(true);
                                  compressImage(file, 600, 600, 0.6)
                                    .then((compressed) => {
                                      setRecPhoto(compressed);
                                      setRecFileLoading(false);
                                    })
                                    .catch((err) => {
                                      console.warn('Failed to compress profile photo:', err);
                                      setRecFileLoading(false);
                                    });
                                }
                              }}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <div className="w-full bg-slate-950 border border-dashed border-blue-900/40 hover:border-[#dbaa61] text-slate-400 hover:text-white rounded-xl py-2.5 px-3 text-xs text-center transition-all cursor-pointer">
                              📁 ডিভাইস থেকে ফটো আপলোড করুন
                            </div>
                          </div>
                        </div>
                        {recPhoto && (
                          <div className="mt-2 flex items-center gap-2.5 bg-black/30 border border-blue-900/20 p-2 rounded-xl">
                            <img 
                              src={recPhoto} 
                              alt="Recruit Thumbnail" 
                              className="w-10 h-10 object-cover rounded-lg border border-[#dbaa61]/30"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9.5px] text-slate-400 truncate max-w-xs font-mono">Image source successfully loaded</span>
                          </div>
                        )}
                      </div>

                      {/* NEW: Portfolio Photos Section */}
                      <div className="space-y-1 md:col-span-2 border-t border-blue-900/10 pt-3">
                        <label className="block text-[9.5px] text-[#dbaa61] font-black uppercase tracking-wider flex items-center justify-between">
                          <span>মডেল পোর্টফোলিও ছবিসমূহ (Model Portfolio Photos - Max 4)</span>
                          {recPicturesLoading && <span className="text-blue-400 animate-pulse text-[9.5px]">Uploading...</span>}
                        </label>
                        <p className="text-[10.5px] text-slate-400 mb-2">
                          কমপক্ষে ১টি এবং সর্বোচ্চ ৪টি ছবি আপলোড করুন যা গ্যালারিতে দেখাবে।
                        </p>
                        
                        <div className="grid grid-cols-4 gap-2">
                          {[0, 1, 2, 3].map((slotIdx) => {
                            const imageSrc = recPictures[slotIdx];
                            const isClickableUpload = slotIdx === recPictures.length;

                            if (imageSrc) {
                              return (
                                <div key={slotIdx} className="relative aspect-square rounded-xl overflow-hidden border border-blue-900/40 hover:border-[#dbaa61] group bg-slate-950">
                                  <img src={imageSrc} className="w-full h-full object-cover" alt={`Portfolio ${slotIdx + 1}`} referrerPolicy="no-referrer" />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRecPicture(slotIdx)}
                                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 rounded-full p-1 cursor-pointer text-white shadow-md transform scale-90 group-hover:scale-100 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <span className="absolute bottom-1 left-1 bg-black/80 px-1 text-[8px] font-mono font-bold text-slate-100 rounded leading-none py-0.5">
                                    Pic {slotIdx + 1}
                                  </span>
                                </div>
                              );
                            }

                            if (isClickableUpload) {
                              return (
                                <label key={slotIdx} className="aspect-square flex flex-col items-center justify-center border border-dashed border-blue-900/40 hover:border-[#dbaa61] hover:bg-slate-900/40 cursor-pointer rounded-xl transition-all p-1 text-center bg-[#050b18]">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleAddRecPicture}
                                    className="hidden"
                                  />
                                  <Camera className="w-5 h-5 text-slate-400 hover:text-white" />
                                  <span className="text-[8px] text-slate-400 mt-1 font-bold">Upload</span>
                                </label>
                              );
                            }

                            return (
                              <div key={slotIdx} className="aspect-square flex items-center justify-center border border-dashed border-blue-900/20 rounded-xl bg-slate-950/20 opacity-30">
                                <span className="text-[10px] font-mono text-slate-600">Locked</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">
                          সংক্ষিপ্ত পরিচিতি ও বায়ো (Bio / Description)
                        </label>
                        <textarea 
                          rows={3}
                          value={recBio}
                          onChange={(e) => setRecBio(e.target.value)}
                          placeholder="মডেলের চমৎকার সংক্ষিপ্ত বর্ণনা দিন যা কাস্টমারকে আকর্ষণ করবে..." 
                          className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                        />
                      </div>

                      {/* NEW: Services Selection Checklist */}
                      <div className="space-y-2 md:col-span-2 border-t border-blue-900/10 pt-3">
                        <label className="block text-[9.5px] text-[#dbaa61] font-black uppercase tracking-wider">
                          প্রদানকৃত সার্ভিসসমূহ সিলেক্ট করুন (Services Provided) *
                        </label>
                        <p className="text-[10.5px] text-slate-400 mb-2">
                          মডেল কি কি সার্ভিস প্রদান করতে পারবে তা টিক মার্ক দিয়ে নির্ধারণ করুন।
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-blue-900/25 rounded-xl cursor-pointer hover:border-[#dbaa61]/35 transition">
                            <input 
                              type="checkbox"
                              checked={recIsRealActive}
                              onChange={(e) => setRecIsRealActive(e.target.checked)}
                              className="rounded border-blue-900/40 text-[#dbaa61] focus:ring-[#dbaa61] bg-slate-950 w-4 h-4 cursor-pointer"
                            />
                            <div className="text-left">
                              <span className="text-xs font-bold text-white block">Real Service</span>
                              <span className="text-[9px] text-slate-400">সরাসরি দেখা ও সাক্ষাৎ</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-blue-900/25 rounded-xl cursor-pointer hover:border-[#dbaa61]/35 transition">
                            <input 
                              type="checkbox"
                              checked={recIsCamActive}
                              onChange={(e) => setRecIsCamActive(e.target.checked)}
                              className="rounded border-blue-900/40 text-[#dbaa61] focus:ring-[#dbaa61] bg-slate-950 w-4 h-4 cursor-pointer"
                            />
                            <div className="text-left">
                              <span className="text-xs font-bold text-white block">Face Cam Service</span>
                              <span className="text-[9px] text-slate-400">অনলাইন ভিডিও কল সার্ভিস</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-blue-900/25 rounded-xl cursor-pointer hover:border-[#dbaa61]/35 transition">
                            <input 
                              type="checkbox"
                              checked={recIsMakeOutActive}
                              onChange={(e) => setRecIsMakeOutActive(e.target.checked)}
                              className="rounded border-blue-900/40 text-[#dbaa61] focus:ring-[#dbaa61] bg-slate-950 w-4 h-4 cursor-pointer"
                            />
                            <div className="text-left">
                              <span className="text-xs font-bold text-white block">Make Out Service</span>
                              <span className="text-[9px] text-slate-400">রোমান্টিক বা স্পেশাল ডেটিং</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 px-3 py-2 bg-slate-950/50 border border-blue-900/25 rounded-xl cursor-pointer hover:border-[#dbaa61]/35 transition">
                            <input 
                              type="checkbox"
                              checked={recIsLiveTogetherActive}
                              onChange={(e) => setRecIsLiveTogetherActive(e.target.checked)}
                              className="rounded border-blue-900/40 text-[#dbaa61] focus:ring-[#dbaa61] bg-slate-950 w-4 h-4 cursor-pointer"
                            />
                            <div className="text-left">
                              <span className="text-xs font-bold text-white block">Live Together</span>
                              <span className="text-[9px] text-slate-400">দীর্ঘস্থায়ী লিভ টুগেদার বা ট্যুর</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Identity & Legal Verification Section */}
                      <div className="md:col-span-2 border-t border-blue-900/20 pt-4 mt-2 space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-blue-950">
                          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                            <span className="text-sm">🆔</span>
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-[#dbaa61] uppercase tracking-wider">মডেল ভেরিফিকেশন ও আইডি কার্ড (Identity & Document Verification)</h4>
                            <p className="text-[9px] text-slate-400">নিরাপত্তা ও সত্যতা নিশ্চিতে এনআইডি বা জন্মনিবন্ধন সাবমিট করুন</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider">আইডি টাইপ (Document Type)</label>
                            <select 
                              value={recIdType}
                              onChange={(e) => setRecIdType(e.target.value as any)}
                              className="w-full bg-slate-950 border border-blue-900/40 focus:border-[#dbaa61] text-white rounded-xl py-2 px-3 text-xs focus:outline-none transition-all"
                            >
                              <option value="nid">National ID (জাতীয় পরিচয়পত্র)</option>
                              <option value="birth">Birth Certificate (জন্মনিবন্ধন সনদ)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider flex justify-between items-center">
                              <span>সেলফি ভেরিফিকেশন (Live Selfie) *</span>
                              {recSelfieLoading && <span className="text-blue-400 animate-pulse text-[9px]">Uploading...</span>}
                            </label>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setRecSelfieLoading(true);
                                    compressImage(file, 600, 600, 0.6)
                                      .then((compressed) => {
                                        setRecSelfie(compressed);
                                        setRecSelfieLoading(false);
                                      })
                                      .catch((err) => {
                                        console.warn('Failed to compress selfie:', err);
                                        setRecSelfieLoading(false);
                                      });
                                  }
                                }}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                              />
                              <div className="w-full bg-slate-950 border border-dashed border-blue-900/40 hover:border-[#dbaa61] text-slate-400 hover:text-white rounded-xl py-2 px-3 text-xs text-center transition-all cursor-pointer">
                                {recSelfie ? '📸 সেলফি আপলোড করা হয়েছে' : '📸 সেলফি আপলোড করুন (Selfie)'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider flex justify-between items-center">
                              <span>{recIdType === 'nid' ? 'এনআইডি সামনের অংশ (NID Front) *' : 'জন্মনিবন্ধন সামনের অংশ (Certificate Front) *'}</span>
                              {recNidFrontLoading && <span className="text-blue-400 animate-pulse text-[9px]">Uploading...</span>}
                            </label>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setRecNidFrontLoading(true);
                                    compressImage(file, 600, 600, 0.6)
                                      .then((compressed) => {
                                        setRecNidFront(compressed);
                                        setRecNidFrontLoading(false);
                                      })
                                      .catch((err) => {
                                        console.warn('Failed to compress NID front:', err);
                                        setRecNidFrontLoading(false);
                                      });
                                  }
                                }}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                              />
                              <div className="w-full bg-slate-950 border border-dashed border-blue-900/40 hover:border-[#dbaa61] text-slate-400 hover:text-white rounded-xl py-2 px-3 text-xs text-center transition-all cursor-pointer">
                                {recNidFront ? '✓ প্রথম পাতা আপলোড করা হয়েছে' : '📁 ১ম পাতা আপলোড (Front)'}
                              </div>
                            </div>
                          </div>

                          {recIdType === 'nid' && (
                            <div className="space-y-1">
                              <label className="block text-[9.5px] text-blue-450 font-black uppercase tracking-wider flex justify-between items-center">
                                <span>এনআইডি পেছনের অংশ (NID Back) *</span>
                                {recNidBackLoading && <span className="text-blue-400 animate-pulse text-[9px]">Uploading...</span>}
                              </label>
                              <div className="relative">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setRecNidBackLoading(true);
                                      compressImage(file, 600, 600, 0.6)
                                        .then((compressed) => {
                                          setRecNidBack(compressed);
                                          setRecNidBackLoading(false);
                                        })
                                        .catch((err) => {
                                          console.warn('Failed to compress NID back:', err);
                                          setRecNidBackLoading(false);
                                        });
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                                />
                                <div className="w-full bg-slate-950 border border-dashed border-blue-900/40 hover:border-[#dbaa61] text-slate-400 hover:text-white rounded-xl py-2 px-3 text-xs text-center transition-all cursor-pointer">
                                  {recNidBack ? '✓ পেছনের পাতা আপলোড করা হয়েছে' : '📁 ২য় পাতা আপলোড (Back)'}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Document previews */}
                        {(recSelfie || recNidFront || recNidBack) && (
                          <div className="p-2.5 bg-black/40 border border-blue-950 rounded-xl grid grid-cols-3 gap-2">
                            {recSelfie && (
                              <div className="text-center">
                                <span className="text-[8px] text-slate-500 block mb-1">Selfie</span>
                                <img src={recSelfie} alt="Selfie" className="w-full h-14 object-cover rounded-lg border border-blue-900/30" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            {recNidFront && (
                              <div className="text-center">
                                <span className="text-[8px] text-slate-500 block mb-1">Front</span>
                                <img src={recNidFront} alt="Doc Front" className="w-full h-14 object-cover rounded-lg border border-blue-900/30" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            {recNidBack && recIdType === 'nid' && (
                              <div className="text-center">
                                <span className="text-[8px] text-slate-500 block mb-1">Back</span>
                                <img src={recNidBack} alt="Doc Back" className="w-full h-14 object-cover rounded-lg border border-blue-900/30" referrerPolicy="no-referrer" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>



                      <div className="md:col-span-2 pt-2">
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition duration-300 shadow-lg shadow-[#dbaa61]/10 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          ফাইল ও প্রোফাইল আপলোড করুন (Upload Model Files & Profile)
                        </button>
                      </div>

                    </form>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* High-Fidelity Male Model Verification Payment Modal */}
      <AnimatePresence>
        {showRecPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-gradient-to-b from-[#030a1c] to-[#010512] border border-[#dbaa61]/35 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#dbaa61]/10 overflow-hidden my-8"
            >
              {/* Golden ribbon header decoration */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#dbaa61] to-transparent" />
              
              <div className="text-center space-y-2 mb-6">
                <span className="text-[10px] font-black tracking-widest text-[#dbaa61] uppercase block font-mono">
                  SECURED SECURITY DEPOSIT
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase font-sans">
                  Select Payment Gateway
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-300 font-bold max-w-sm mx-auto leading-relaxed">
                  মেল মডেল ভেরিফাইড তালিকায় যুক্ত করতে ভেরিফিকেশন ও লিস্টিং ফি প্রদান করতে হবে। Please complete payment below.
                </p>
              </div>

              <div className="space-y-6">
                {/* 1. SELECT GATEWAY DEPOSIT */}
                <div className="space-y-2">
                  <span className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                    1. SELECT GATEWAY DEPOSIT (গেটওয়ে)
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { method: 'BKASH', name: 'BKASH', color: '#e2125d', from: 'from-[#1e0a13]', border: 'border-[#e2125d]/35', activeBorder: 'border-[#e2125d]', shadow: 'shadow-[#e2125d]/20', logo: <BkashLogo className="w-4 h-4 sm:w-5 sm:h-5" /> },
                      { method: 'NAGAD', name: 'NAGAD', color: '#f15a22', from: 'from-[#1e0f0a]', border: 'border-[#f15a22]/35', activeBorder: 'border-[#f15a22]', shadow: 'shadow-[#f15a22]/20', logo: <NagadLogo className="w-4 h-4 sm:w-5 sm:h-5" /> },
                      { method: 'ROCKET', name: 'ROCKET', color: '#8c3494', from: 'from-[#150a1d]', border: 'border-[#8c3494]/35', activeBorder: 'border-[#8c3494]', shadow: 'shadow-[#8c3494]/20', logo: <RocketLogo className="w-4 h-4 sm:w-5 sm:h-5" /> }
                    ].map((g) => {
                      const isSelected = recPaymentMethod === g.method;
                      return (
                        <button
                          key={g.method}
                          type="button"
                          onClick={() => setRecPaymentMethod(g.method as any)}
                          className={`group relative bg-gradient-to-b ${isSelected ? g.from : 'from-[#030818]/60'} to-[#04060c] border ${isSelected ? g.activeBorder : g.border} rounded-2xl p-4 flex flex-col items-center text-center gap-2.5 transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-0.5 ${isSelected ? `scale-[1.02] ${g.shadow} ring-1 ring-[#dbaa61]/30` : ''}`}
                        >
                          <div
                            style={{ backgroundColor: g.color }}
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-300"
                          >
                            {g.logo}
                          </div>
                          <div>
                            <span className="block text-xs font-black text-white uppercase font-sans tracking-wide">
                              {g.name}
                            </span>
                            <span className="block text-[8.5px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider font-mono">
                              Send Money
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instruction banner with Copy Number */}
                <div className="bg-[#030818]/60 border border-blue-900/35 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 text-xs text-white">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">💸</span>
                    <div className="text-left">
                      <p className="font-bold font-sans">
                        Please Send Money to:{' '}
                        <span className="text-emerald-400 font-mono tracking-wider font-extrabold select-all">
                          {recPaymentMethod === 'BKASH' ? '01758-293847' : recPaymentMethod === 'NAGAD' ? '01923-456789' : '01844-332211'}
                        </span>{' '}
                        <span className="text-[10px] text-[#dbaa61] uppercase font-mono tracking-widest font-black pl-1">
                          (Personal)
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      const num = recPaymentMethod === 'BKASH' ? '01758293847' : recPaymentMethod === 'NAGAD' ? '01923456789' : '01844332211';
                      navigator.clipboard.writeText(num);
                      setRecPaymentCopied(true);
                      triggerToast('নম্বর কপি করা হয়েছে!', 'success');
                      setTimeout(() => setRecPaymentCopied(false), 2000);
                    }}
                    className="text-[10px] text-[#dbaa61] font-mono tracking-wider font-extrabold hover:text-amber-300 flex items-center gap-1 cursor-pointer bg-slate-900/60 border border-[#dbaa61]/30 rounded-lg px-2.5 py-1 transition duration-150 active:scale-95 shrink-0"
                  >
                    {recPaymentCopied ? 'COPIED' : 'COPY'}
                  </button>
                </div>

                {/* 2. DEPOSIT AMOUNT (৳) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                    2. DEPOSIT AMOUNT (৳) (পরিশোধের পরিমাণ)
                  </label>
                  <input
                    type="number"
                    disabled
                    placeholder="3,000"
                    value={recPaymentAmount}
                    className="w-full bg-[#030818]/60 border border-blue-900/35 text-slate-400 rounded-xl px-4 py-3 font-bold cursor-not-allowed font-sans"
                  />
                </div>

                {/* 3. SENDER MOBILE (সেন্ডার মোবাইল নম্বর) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                    3. SENDER MOBILE NUMBER (সেন্ডার মোবাইল নম্বর)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={recPaymentSender}
                    onChange={(e) => setRecPaymentSender(e.target.value)}
                    className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3 font-bold focus:outline-none transition-all placeholder:text-slate-500 font-mono tracking-wider"
                  />
                </div>

                {/* 4. TRANSACTION ID (TRXID) */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                    4. TRANSACTION ID (TRXID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TR98A77X"
                    value={recPaymentTrx}
                    onChange={(e) => setRecPaymentTrx(e.target.value)}
                    className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3 font-bold focus:outline-none transition-all placeholder:text-slate-500 uppercase font-mono tracking-widest"
                  />
                </div>

                {/* ACTION BUTTONS */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleRecruitmentSubmit(undefined, true)}
                    className="w-full bg-gradient-to-tr from-[#a67c33] to-[#dbaa61] hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-widest py-4 rounded-xl transition duration-300 shadow-lg shadow-[#dbaa61]/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-4 h-4" />
                    সম্পূর্ণ রেজিস্ট্রেশন ও ফাইল আপলোড করুন (Upload Files & Complete Registration)
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRecPaymentModal(false)}
                    className="w-full bg-transparent hover:bg-white/5 border border-slate-700 hover:border-slate-500 text-slate-300 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    ← ফিরে যান এবং তথ্য সংশোধন করুন (Go Back & Edit)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
