import React, { useState, useMemo } from 'react';
import { db, doc, getDoc, collection, query, where, getDocs, setDoc } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  ArrowLeft, 
  LogOut, 
  CheckCircle2, 
  AlertTriangle, 
  Landmark, 
  ArrowUpRight, 
  TrendingUp, 
  Activity,
  UserCheck,
  Eye,
  EyeOff,
  Send,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';
import { Booking, WithdrawalRecord, Companion } from '../types';

interface ModelPortalProps {
  bookings: Booking[];
  withdrawals: WithdrawalRecord[];
  companions: Companion[];
  onLoginSuccess: (credentials: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    role: string;
  }) => void;
  isLoggedIn: boolean;
  loggedInUsername: string;
  loggedInUserRole: string;
  onLogout: () => void;
  onAddWithdrawal: (w: WithdrawalRecord) => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ModelPortal: React.FC<ModelPortalProps> = ({
  bookings,
  withdrawals,
  companions,
  onLoginSuccess,
  isLoggedIn,
  loggedInUsername,
  loggedInUserRole,
  onLogout,
  onAddWithdrawal,
  triggerToast
}) => {
  // Login states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<'username' | 'otp' | 'new_password' | null>(null);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const generateNumericOTP = () => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  };

  const sendOtpEmailPHP = async (email: string, username: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      let smtpSettings: any = null;
      try {
        const smtpDoc = await getDoc(doc(db, 'settings', 'smtp_settings'));
        if (smtpDoc.exists()) {
          smtpSettings = smtpDoc.data();
        }
      } catch (fsErr) {
        console.warn('[ModelPortal] Failed to load SMTP configurations from Firestore:', fsErr);
      }

      const response = await fetch('/send-otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          username, 
          code,
          smtp: smtpSettings
        })
      });
      const text = await response.text();
      try {
        const resData = JSON.parse(text);
        if (response.ok && resData.success) {
          return { success: true };
        } else {
          return { success: false, error: resData.error || resData.message || 'PHP mailer execution failed' };
        }
      } catch (jsonErr) {
        return { success: false, error: 'PHP mailer returned non-JSON data' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'PHP mailer connection error' };
    }
  };

  const sendOtpEmailHelper = async (email: string, username: string, code: string): Promise<{ success: boolean; mocked?: boolean; error?: string }> => {
    try {
      let smtpSettings: any = null;
      try {
        const smtpDoc = await getDoc(doc(db, 'settings', 'smtp_settings'));
        if (smtpDoc.exists()) {
          smtpSettings = smtpDoc.data();
        }
      } catch (fsErr) {
        console.warn('[ModelPortal] Failed to load SMTP configurations from Firestore:', fsErr);
      }

      const response = await fetch('/api/send-otp-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, code, smtp: smtpSettings })
      });

      const text = await response.text();
      try {
        const resData = JSON.parse(text);
        if (response.ok && resData.success) {
          return { success: true, mocked: resData.mocked };
        } else {
          throw new Error(resData.error || resData.message || 'Node.js server error');
        }
      } catch (jsonErr: any) {
        if (text.trim().startsWith('<') || text.includes('<!DOCTYPE html>') || text.includes('<!doctype html>')) {
          return await sendOtpEmailPHP(email, username, code);
        }
        throw new Error(jsonErr.message || 'Failed to parse JSON response');
      }
    } catch (err: any) {
      return await sendOtpEmailPHP(email, username, code);
    }
  };

  const handleForgotTrigger = () => {
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    setForgotUsername('');
    setForgotGeneratedOtp('');
    setForgotOtpInput('');
    setForgotNewPassword('');
    setForgotStep('username');
  };

  const handleForgotUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    const inputVal = forgotUsername.trim();
    if (!inputVal) {
      setForgotErrorMsg('দয়া করে আপনার ইউজারনেম, ইমেইল অথবা মোবাইল নম্বরটি লিখুন! (Please enter your username, email, or phone number.)');
      return;
    }

    try {
      setForgotSuccessMsg('ডাটাবেজে মডেল তথ্য অনুসন্ধান করা হচ্ছে... (Searching database...)');
      let userData: any = null;
      let resolvedUsername = '';

      // 1. Try checking as username first
      const usernameLower = inputVal.toLowerCase();
      const userDocRef = doc(db, 'users', usernameLower);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const d = userDocSnap.data();
        if (d.role === 'model') {
          userData = d;
          resolvedUsername = usernameLower;
        }
      }

      if (!userData) {
        // 2. Try checking as Email where role === 'model'
        const qEmail = query(collection(db, 'users'), where('email', '==', inputVal), where('role', '==', 'model'));
        const qEmailSnap = await getDocs(qEmail);
        if (!qEmailSnap.empty) {
          const docDoc = qEmailSnap.docs[0];
          userData = docDoc.data();
          resolvedUsername = docDoc.id;
        } else {
          // 3. Try checking as Phone number where role === 'model'
          const qPhone = query(collection(db, 'users'), where('phone', '==', inputVal), where('role', '==', 'model'));
          const qPhoneSnap = await getDocs(qPhone);
          if (!qPhoneSnap.empty) {
            const docDoc = qPhoneSnap.docs[0];
            userData = docDoc.data();
            resolvedUsername = docDoc.id;
          }
        }
      }

      if (!userData) {
        setForgotErrorMsg('এই তথ্য দিয়ে কোনো মডেল অ্যাকাউন্ট পাওয়া যায়নি! (Model account not found.)');
        setForgotSuccessMsg('');
        return;
      }

      setForgotUsername(resolvedUsername);

      const userEmail = userData?.email || '';
      if (!userEmail) {
        setForgotErrorMsg('আপনার অ্যাকাউন্টের সাথে কোনো ইমেইল আইডি যুক্ত নেই! অনুগ্রহ করে পাসওয়ার্ড রিসেট করতে কাস্টমার সাপোর্টে যোগাযোগ করুন। (No registered Email found.)');
        setForgotSuccessMsg('');
        return;
      }

      const code = generateNumericOTP();
      setForgotGeneratedOtp(code);

      let sentViaEmail = false;
      let mockInfo = '';

      try {
        setForgotSuccessMsg('ইমেইলের মাধ্যমে ভেরিফিকেশন কোড পাঠানো হচ্ছে... (Sending OTP to Email...)');
        const res = await sendOtpEmailHelper(userEmail, resolvedUsername, code);
        if (res.success) {
          sentViaEmail = true;
          if (res.mocked) {
            mockInfo = ` (সিমুলেশন ওটিপি কোড: ${code})`;
          }
        } else {
          mockInfo = res.error || '';
        }
      } catch (mailErr: any) {
        console.error('Model OTP delivery error:', mailErr);
        mockInfo = mailErr.message || '';
      }

      if (sentViaEmail) {
        setForgotSuccessMsg(`ভেরিফিকেশন কোড আপনার নিবন্ধিত ইমেইল (${userEmail}) এ পাঠানো হয়েছে!${mockInfo}`);
        setForgotStep('otp');
      } else {
        setForgotErrorMsg(`কোড পাঠানো ব্যর্থ হয়েছে। ${mockInfo ? `সার্ভার ত্রুটি: ${mockInfo}` : 'অনুগ্রহ করে আবার চেষ্টা করুন বা কাস্টমার সাপোর্টে কথা বলুন।'}`);
        setForgotSuccessMsg('');
      }
    } catch (err: any) {
      console.error('Password reset error:', err);
      setForgotErrorMsg('ওটিপি পাঠাতে সমস্যা হয়েছে। (Error dispatching OTP.)');
      setForgotSuccessMsg('');
    }
  };

  const handleForgotOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    if (forgotOtpInput.trim() === forgotGeneratedOtp && forgotGeneratedOtp !== '') {
      setForgotSuccessMsg('ভেরিফিকেশন সফল হয়েছে! নতুন পাসওয়ার্ড সেট করুন। (Verification successful!)');
      setForgotStep('new_password');
    } else {
      setForgotErrorMsg('ভুল ভেরিফিকেশন কোড! দয়া করে সঠিক কোডটি দিন। (Invalid verification code.)');
    }
  };

  const handleForgotNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    const newPass = forgotNewPassword.trim();
    if (newPass.length < 4) {
      setForgotErrorMsg('পাসওয়ার্ডটি নূন্যতম ৪ অক্ষরের হতে হবে! (Password must be at least 4 characters long.)');
      return;
    }

    try {
      setForgotSuccessMsg('ডাটাবেজে নতুন পাসওয়ার্ড সংরক্ষণ করা হচ্ছে... (Saving new password...)');
      const usernameLower = forgotUsername.trim().toLowerCase();
      const userDocRef = doc(db, 'users', usernameLower);
      
      await setDoc(userDocRef, {
        password: newPass,
        passwordHash: newPass
      }, { merge: true });

      setForgotSuccessMsg('✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন। (Password reset successful!)');
      
      setTimeout(() => {
        setForgotStep(null);
        setForgotSuccessMsg('');
        setForgotErrorMsg('');
      }, 2500);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setForgotErrorMsg('পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে! (Failed to update password.)');
      setForgotSuccessMsg('');
    }
  };

  // Withdrawal form states
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bKash Personal');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [isRequestingWithdraw, setIsRequestingWithdraw] = useState(false);

  // Tab state for dashboard
  const [portalTab, setPortalTab] = useState<'overview' | 'ledger' | 'withdrawals'>('overview');

  // Find companion profile matching the logged-in user
  const currentCompanion = useMemo(() => {
    if (!isLoggedIn || loggedInUserRole !== 'model') return null;
    return companions.find(
      (c) => 
        (c.modelUsername && c.modelUsername.toLowerCase() === loggedInUsername.toLowerCase()) ||
        c.name.toLowerCase() === loggedInUsername.toLowerCase() ||
        (c.email && c.email.toLowerCase() === loggedInUsername.toLowerCase())
    ) || null;
  }, [companions, isLoggedIn, loggedInUsername, loggedInUserRole]);

  // Model bookings list (Completed or ongoing where modelName matches companion name)
  const modelBookings = useMemo(() => {
    if (!currentCompanion) return [];
    return bookings.filter(
      (b) => 
        b.modelName.toLowerCase() === currentCompanion.name.toLowerCase() ||
        (currentCompanion.modelUsername && b.modelName.toLowerCase() === currentCompanion.modelUsername.toLowerCase())
    );
  }, [bookings, currentCompanion]);

  // Calculations
  const completedBookings = useMemo(() => {
    return modelBookings.filter((b) => b.status === 'Completed' || b.status === 'Approved');
  }, [modelBookings]);

  const totalBookingValue = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (b.cost || 0), 0);
  }, [completedBookings]);

  // Model receives 60% of booking cost as their professional share, remaining 40% is platform gateway charge
  const totalModelEarnings = useMemo(() => {
    return Math.round(totalBookingValue * 0.6);
  }, [totalBookingValue]);

  // Model withdrawals
  const modelWithdrawals = useMemo(() => {
    if (!isLoggedIn) return [];
    return withdrawals.filter(
      (w) => w.username.toLowerCase() === loggedInUsername.toLowerCase()
    );
  }, [withdrawals, isLoggedIn, loggedInUsername]);

  const totalPayoutPaid = useMemo(() => {
    return modelWithdrawals
      .filter((w) => w.status === 'Approved')
      .reduce((sum, w) => sum + w.amount, 0);
  }, [modelWithdrawals]);

  const totalPayoutPending = useMemo(() => {
    return modelWithdrawals
      .filter((w) => w.status === 'Pending')
      .reduce((sum, w) => sum + w.amount, 0);
  }, [modelWithdrawals]);

  const currentPendingBalance = useMemo(() => {
    const bal = totalModelEarnings - totalPayoutPaid;
    return bal < 0 ? 0 : bal;
  }, [totalModelEarnings, totalPayoutPaid]);

  // Handle Model login action
  const handleModelLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন। (Please enter username and password)');
      return;
    }

    setIsSubmitting(true);
    setLoginError('');

    try {
      const uLower = loginUsername.trim().toLowerCase();
      const userDocRef = doc(db, 'users', uLower);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setLoginError('মডেল অ্যাকাউন্ট পাওয়া যায়নি। সঠিক ইউজারনেম টাইপ করুন। (Model account not found.)');
        setIsSubmitting(false);
        return;
      }

      const userData = userDocSnap.data();
      
      // Verify role and password
      if (userData.role !== 'model') {
        setLoginError('এই পোর্টালটি শুধুমাত্র অনুমোদিত মডেলদের জন্য সংরক্ষিত! (This portal is only for approved models!)');
        setIsSubmitting(false);
        return;
      }

      if (userData.password !== loginPassword && userData.passwordHash !== loginPassword) {
        setLoginError('ভুল পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন। (Incorrect password!)');
        setIsSubmitting(false);
        return;
      }

      // Successful Model Login
      onLoginSuccess({
        username: userData.username,
        fullName: userData.fullName || userData.username,
        email: userData.email || '',
        phone: userData.phone || '',
        role: 'model'
      });
      triggerToast('🎉 মডেল পোর্টালে সফলভাবে লগইন করেছেন! (Login successful)', 'success');
    } catch (err) {
      console.error('Model login error:', err);
      setLoginError('সার্ভারে সমস্যা হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit withdrawal request
  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerToast('❌ সঠিক টাকার পরিমাণ লিখুন! (Enter a valid amount)', 'error');
      return;
    }

    if (amount > currentPendingBalance) {
      triggerToast(`❌ পর্যাপ্ত ব্যালেন্স নেই! আপনার সর্বোচ্চ উত্তোলনযোগ্য ব্যালেন্স ৳${currentPendingBalance.toLocaleString()}`, 'error');
      return;
    }

    if (amount < 500) {
      triggerToast('❌ সর্বনিম্ন ৳৫০০ উত্তোলন করতে পারবেন। (Minimum withdrawal is ৳500)', 'error');
      return;
    }

    if (!withdrawAccount.trim()) {
      triggerToast('❌ পেমেন্ট নম্বরটি প্রদান করুন! (Please provide payment number)', 'error');
      return;
    }

    setIsRequestingWithdraw(true);

    try {
      const wId = 'w-model-' + Date.now();
      const newW: WithdrawalRecord = {
        id: wId,
        username: loggedInUsername,
        fullName: currentCompanion ? currentCompanion.name : loggedInUsername,
        amount: amount,
        method: withdrawMethod,
        accountNumber: withdrawAccount.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'Pending'
      };

      // Save to Firebase and update local state
      await setDoc(doc(db, 'withdrawals', wId), newW);
      onAddWithdrawal(newW);

      setWithdrawAmount('');
      setWithdrawAccount('');
      triggerToast('🎉 উত্তোলন রিকোয়েস্ট পাঠানো হয়েছে! এডমিন দ্রুত অনুমোদন করবেন।', 'success');
    } catch (err) {
      console.error('Withdrawal error:', err);
      triggerToast('❌ সাবমিট করতে সমস্যা হয়েছে! আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsRequestingWithdraw(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER LOGIN SCREEN FOR MODELS
  // -------------------------------------------------------------
  if (!isLoggedIn || loggedInUserRole !== 'model') {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 relative z-10" id="model-login-container">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full bg-[#050e24]/85 border border-[#dbaa61]/25 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(219,170,97,0.15)] relative overflow-hidden gold-breathing-glow"
        >
          {/* Shimmering glass banner effect */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#dbaa61]/40 to-transparent" />

          {/* Ambient Glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[250px] h-[250px] bg-gradient-to-tr from-[#dbaa61]/10 to-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {forgotStep !== null ? (
            <div className="space-y-5 text-left border border-[#dbaa61]/20 bg-[#020716] p-5 sm:p-6 rounded-2xl relative">
              <div className="flex items-center justify-between border-b border-blue-950/40 pb-3">
                <span className="text-[11px] font-black tracking-widest text-[#dbaa61] uppercase flex items-center gap-1.5 font-sans">
                  <Lock className="w-3.5 h-3.5 text-[#dbaa61]" />
                  PASSWORD RECOVERY (পাসওয়ার্ড পুনরুদ্ধার)
                </span>
                <button
                  type="button"
                  onClick={() => setForgotStep(null)}
                  className="text-[10px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Close (বন্ধ করুন)
                </button>
              </div>

              {forgotErrorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs py-2 px-3 rounded-xl flex items-center gap-2 font-bold text-left animate-shake">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>{forgotErrorMsg}</span>
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs py-2 px-3 rounded-xl flex items-center gap-2 font-bold text-left">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{forgotSuccessMsg}</span>
                </div>
              )}

              {forgotStep === 'username' && (
                <form onSubmit={handleForgotUsernameSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-sans">
                      Username / Email / Phone (ইউজারনেম / ইমেইল / ফোন)
                    </label>
                    <p className="text-[10px] text-slate-400 leading-normal pl-1 mb-1 font-sans">
                      আপনার নিবন্ধিত ইউজারনেম, ইমেইল অথবা মোবাইল নম্বরটি লিখুন। আপনার ইমেইলে একটি ভেরিফিকেশন ওটিপি পাঠানো হবে।
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        required
                        value={forgotUsername}
                        onChange={(e) => setForgotUsername(e.target.value)}
                        placeholder="e.g. aditi_model"
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#a67c33] via-[#dbaa61] to-[#f1d087] hover:brightness-110 text-slate-950 font-black text-xs tracking-widest uppercase py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#dbaa61]/10 active:scale-98"
                  >
                    <Send className="w-4 h-4 text-slate-950" />
                    SEND OTP (কোড পাঠান)
                  </button>
                </form>
              )}

              {forgotStep === 'otp' && (
                <form onSubmit={handleForgotOtpVerify} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-sans">
                      OTP VERIFICATION CODE (ওটিপি কোড)
                    </label>
                    <p className="text-[10px] text-emerald-400/90 leading-normal pl-1 mb-1 font-sans">
                      আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোডটি এখানে লিখুন।
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        required
                        value={forgotOtpInput}
                        onChange={(e) => setForgotOtpInput(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3  font-bold focus:outline-none transition-all font-mono tracking-wider text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#a67c33] via-[#dbaa61] to-[#f1d087] hover:brightness-110 text-slate-950 font-black text-xs tracking-widest uppercase py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#dbaa61]/10 active:scale-98"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    VERIFY OTP (কোড ভেরিফাই করুন)
                  </button>
                </form>
              )}

              {forgotStep === 'new_password' && (
                <form onSubmit={handleForgotNewPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-sans">
                      NEW PASSWORD (নতুন পাসওয়ার্ড)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type={forgotPasswordVisible ? "text" : "password"}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-11 py-3 font-bold focus:outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setForgotPasswordVisible(!forgotPasswordVisible)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                      >
                        {forgotPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#a67c33] via-[#dbaa61] to-[#f1d087] hover:brightness-110 text-slate-950 font-black text-xs tracking-widest uppercase py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#dbaa61]/10 active:scale-98"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    RESET PASSWORD (পাসওয়ার্ড পরিবর্তন করুন)
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="text-center space-y-2 mb-8 relative">
                <div className="inline-flex p-3.5 bg-amber-950/50 border border-[#dbaa61]/30 text-[#f1d087] rounded-2xl mb-2">
                  <UserCheck className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-mono font-black uppercase text-white tracking-wider">
                  Model Partner Portal
                </h2>
                <p className="text-[10px] text-[#dbaa61] font-black uppercase tracking-widest font-mono">
                  মডেল ও পার্টনার অ্যাকাউন্ট প্যানেল
                </p>
              </div>

              <form onSubmit={handleModelLogin} className="space-y-4.5 text-left text-xs font-semibold">
                {loginError && (
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-400 font-bold leading-relaxed flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-455" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-mono">
                    Model Username (মডেল ইউজারনেম)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4 text-[#dbaa61]/70" />
                    </span>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. aditi_model"
                      style={{ paddingLeft: '2.5rem' }}
                      className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-mono">
                    App Password (পাসওয়ার্ড)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4 text-[#dbaa61]/70" />
                    </span>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ paddingLeft: '2.5rem' }}
                      className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-11 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4 text-slate-500 hover:text-slate-300" /> : <Eye className="w-4 h-4 text-slate-500 hover:text-slate-300" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password trigger */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleForgotTrigger}
                    className="text-[10px] text-[#dbaa61] hover:text-[#f1d087] font-black uppercase tracking-wider transition-all duration-250 cursor-pointer"
                  >
                    Forgot Password? (পাসওয়ার্ড ভুলে গেছেন?)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#a67c33] via-[#dbaa61] to-[#f1d087] hover:brightness-110 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#dbaa61]/10 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-slate-950" />
                      Secure Login (লগইন করুন)
                    </>
                  )}
                </button>

                <div className="text-center pt-3 border-t border-blue-950/40 mt-5">
                  <p className="text-[10px] text-slate-400 font-bold leading-normal">
                    যদি আপনার আবেদনটি এখনও এডমিন অনুমোদন না করে থাকে, তবে অনুমোদন হওয়া পর্যন্ত অপেক্ষা করুন। অনুমোদনের পর আপনি আপনি আপনার ইমেলে অ্যাকাউন্ট আইডি এবং পাসওয়ার্ড স্বয়ংক্রিয়ভাবে পেয়ে যাবেন।
                  </p>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER LOGGED-IN MODEL DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6" id="model-dashboard-root">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0b1022] border border-cyan-500/10 p-5 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <img
            src={currentCompanion?.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'}
            alt={currentCompanion?.name || loggedInUsername}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-cyan-500/20 shadow-lg shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="text-left">
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              {currentCompanion?.name || 'Partner Model'}
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded font-mono">
                {currentCompanion?.badge || 'Approved'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-bold font-mono">
              ID Username: @{loggedInUsername} • {currentCompanion?.city || 'Dhaka'} City
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              window.location.hash = '';
              window.location.pathname = '/';
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Home Website
          </button>
          <button
            onClick={onLogout}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-rose-950/20 hover:bg-rose-950/60 border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </div>

      {/* PORTAL NAV TABS */}
      <div className="flex border-b border-slate-900 gap-2">
        <button
          onClick={() => setPortalTab('overview')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            portalTab === 'overview'
              ? 'border-cyan-500 text-white bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 Dashboard Overview (সারসংক্ষেপ)
        </button>
        <button
          onClick={() => setPortalTab('ledger')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            portalTab === 'ledger'
              ? 'border-cyan-500 text-white bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🧾 Work Ledger ({modelBookings.length} Works)
        </button>
        <button
          onClick={() => setPortalTab('withdrawals')}
          className={`px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            portalTab === 'withdrawals'
              ? 'border-cyan-500 text-white bg-cyan-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          💸 Payout History & Withdraw
        </button>
      </div>

      {/* MAIN VIEW CONTENT */}
      <AnimatePresence mode="wait">
        {/* TAB 1: OVERVIEW */}
        {portalTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 text-left"
          >
            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Completed Bookings */}
              <div className="bg-[#0b1022] border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute right-4 top-4 text-cyan-500/10">
                  <Activity className="w-10 h-10" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block font-mono">
                  Completed Works (মোট কাজ সম্পন্ন)
                </span>
                <span className="text-2xl font-black text-white mt-1.5 block font-mono">
                  {completedBookings.length}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  Active Dispatches: {modelBookings.filter(b => b.status === 'Dispatched' || b.status === 'Outgoing').length}
                </span>
              </div>

              {/* Card 2: Total Earnings */}
              <div className="bg-[#0b1022] border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute right-4 top-4 text-emerald-500/10">
                  <TrendingUp className="w-10 h-10" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block font-mono">
                  Total Earnings (আপনার মোট আয়)
                </span>
                <span className="text-2xl font-black text-emerald-400 mt-1.5 block font-mono">
                  ৳ {totalModelEarnings.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  Share: 60% (৳{totalModelEarnings.toLocaleString()}) • Platform Gateway Fee: 40% (৳{Math.round(totalBookingValue * 0.4).toLocaleString()})
                </span>
              </div>

              {/* Card 3: Total Paid */}
              <div className="bg-[#0b1022] border border-slate-900 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute right-4 top-4 text-blue-500/10">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block font-mono">
                  Paid Payouts (পরিশোধিত টাকা)
                </span>
                <span className="text-2xl font-black text-cyan-400 mt-1.5 block font-mono">
                  ৳ {totalPayoutPaid.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                  Approved Transfers
                </span>
              </div>

              {/* Card 4: Pending Payout Balance */}
              <div className="bg-[#0b1022] border border-cyan-500/20 p-5 rounded-2xl relative overflow-hidden bg-gradient-to-b from-cyan-950/10 to-transparent">
                <div className="absolute right-4 top-4 text-cyan-400/15">
                  <Landmark className="w-10 h-10" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block font-mono">
                  Withdrawable Balance (উত্তোলনযোগ্য ব্যালেন্স)
                </span>
                <span className="text-2xl font-heavy text-white mt-1.5 block font-mono">
                  ৳ {currentPendingBalance.toLocaleString()}
                </span>
                <span className="text-[10px] text-amber-500 font-semibold block mt-1">
                  Pending Approval: ৳ {totalPayoutPending.toLocaleString()}
                </span>
              </div>
            </div>

            {/* WITHDRAW AND NOTICE BENTO GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Payout Portal */}
              <div className="lg:col-span-5 bg-[#0b1022] border border-slate-900 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-4.5 h-4.5 text-cyan-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Submit Withdrawal Request (টাকা উত্তোলন করুন)
                  </h3>
                </div>

                <form onSubmit={handleRequestWithdrawal} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-400 uppercase tracking-wider">
                      Withdrawal Amount (উত্তোলনের পরিমাণ - ৳)
                    </label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      min="500"
                      max={currentPendingBalance}
                      className="w-full bg-black/40 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider">
                        Method (মাধ্যম)
                      </label>
                      <select
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value)}
                        className="w-full bg-black/40 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white focus:outline-none"
                      >
                        <option value="bKash Personal">bKash Personal</option>
                        <option value="Nagad Personal">Nagad Personal</option>
                        <option value="Rocket Personal">Rocket Personal</option>
                        <option value="bKash Agent">bKash Agent</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-wider">
                        Phone/Account Number
                      </label>
                      <input
                        type="text"
                        value={withdrawAccount}
                        onChange={(e) => setWithdrawAccount(e.target.value)}
                        placeholder="e.g. 017xxxxxxxx"
                        className="w-full bg-black/40 border border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isRequestingWithdraw || currentPendingBalance < 500}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-40 text-white font-black uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    {isRequestingWithdraw ? 'Sending Request...' : 'Send Payout Request (উত্তোলন রিকোয়েস্ট)'}
                  </button>
                </form>
              </div>

              {/* Right Column: Information Vouchers */}
              <div className="lg:col-span-7 bg-[#0b1022] border border-slate-900 p-6 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4.5 h-4.5 text-cyan-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Partner Information & Guidelines
                  </h3>
                </div>

                <div className="space-y-3.5 text-xs font-semibold leading-relaxed text-slate-300">
                  <div className="p-4 bg-black/45 border border-slate-900 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 font-mono block">
                      📌 পেমেন্ট পলিসি (Payment Policy)
                    </span>
                    <p className="text-slate-400 leading-normal">
                      প্রতিটি সফল বুকিং সম্পন্ন করার পর বুকিং ভ্যালুর <b className="text-white">৬০% (60%)</b> টাকা আপনার মডেল অ্যাকাউন্টে যুক্ত হবে। অবশিষ্ট ৪০% টাকা প্ল্যাটফর্ম গেটওয়ে প্রসেসিং ফি এবং সিকিউরিটি ম্যানেজমেন্ট ফান্ড হিসাবে কর্তন করা হবে।
                    </p>
                  </div>

                  <div className="p-4 bg-black/45 border border-slate-900 rounded-2xl space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 font-mono block">
                      ⚠️ উত্তোলন সময়কাল (Withdrawal Processing Time)
                    </span>
                    <p className="text-slate-400 leading-normal">
                      উত্তোলন রিকোয়েস্ট সাবমিট করার পর আমাদের অডিটিং ডিপার্টমেন্ট সর্বোচ্চ <b className="text-white">১২ থেকে ২৪ ঘন্টার</b> মধ্যে আপনার প্রদত্ত নম্বরে টাকা ট্রান্সফার সম্পন্ন করে দিবে। পেমেন্ট সম্পন্ন হওয়ার পর আপনি আপনার ড্যাশবোর্ডে "Approved" দেখতে পাবেন।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: LEDGER */}
        {portalTab === 'ledger' && (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-left"
          >
            <div className="bg-[#0b1022] border border-slate-900 rounded-3xl p-5 overflow-hidden">
              <div className="flex items-center justify-between gap-4 mb-4 flex-col sm:flex-row">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Model Work History & Ledger (কাজের হিসাব তালিকা)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider font-mono mt-0.5">
                    মোট কাজ: ৳{totalBookingValue.toLocaleString()} • আপনার লভ্যাংশ (৬০%): ৳{totalModelEarnings.toLocaleString()} • গেটওয়ে চার্জ (৪০%): ৳{Math.round(totalBookingValue * 0.4).toLocaleString()}
                  </p>
                </div>
              </div>

              {modelBookings.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-500 font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-2xl">
                  📭 কোনো বুকিং বা কাজের হিসাব পাওয়া যায়নি (No work records found)
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400 font-black uppercase text-[10px] tracking-wider bg-black/25">
                        <th className="py-3 px-3">Date (তারিখ)</th>
                        <th className="py-3 px-3">Time (সময়)</th>
                        <th className="py-3 px-3">Place/Location (স্থান)</th>
                        <th className="py-3 px-3">Duration (সময়কাল)</th>
                        <th className="py-3 px-3 text-right">Job Cost (মোট বিল)</th>
                        <th className="py-3 px-3 text-right text-emerald-400">Your Share (৬০%)</th>
                        <th className="py-3 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelBookings.map((b) => {
                        const modelShare = Math.round((b.cost || 0) * 0.6);
                        return (
                          <tr key={b.id} className="border-b border-slate-900 hover:bg-slate-950/40 transition">
                            <td className="py-3.5 px-3">
                              <span className="flex items-center gap-1.5 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                {b.date}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="flex items-center gap-1.5 font-mono">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {b.time}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="flex items-center gap-1.5 font-mono max-w-[180px] truncate">
                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                {b.location}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-400">
                                {b.duration}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                              ৳ {(b.cost || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-emerald-400 font-black">
                              ৳ {modelShare.toLocaleString()}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                b.status === 'Completed' || b.status === 'Approved'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : b.status === 'Declined'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}>
                                {b.status === 'Completed' || b.status === 'Approved' ? 'Completed' : b.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: WITHDRAWAL LOGS */}
        {portalTab === 'withdrawals' && (
          <motion.div
            key="withdrawals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 text-left"
          >
            <div className="bg-[#0b1022] border border-slate-900 rounded-3xl p-5 overflow-hidden">
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">
                Payout History (টাকা উত্তোলনের ইতিহাস)
              </h3>

              {modelWithdrawals.length === 0 ? (
                <div className="py-14 text-center text-xs text-slate-500 font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-2xl">
                  📭 কোনো উত্তোলনের ইতিহাস পাওয়া যায়নি (No payout records found)
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400 font-black uppercase text-[10px] tracking-wider bg-black/25">
                        <th className="py-3 px-3">Request ID</th>
                        <th className="py-3 px-3">Date (তারিখ)</th>
                        <th className="py-3 px-3">Method (মাধ্যম)</th>
                        <th className="py-3 px-3">Account Number</th>
                        <th className="py-3 px-3 text-right">Amount (পরিমাণ)</th>
                        <th className="py-3 px-3 text-center">Status (অবস্থা)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelWithdrawals.map((w) => (
                        <tr key={w.id} className="border-b border-slate-900 hover:bg-slate-950/40 transition">
                          <td className="py-3.5 px-3 font-mono text-[10px] text-slate-500">
                            #{w.id}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            {w.date}
                          </td>
                          <td className="py-3.5 px-3 text-cyan-400">
                            {w.method}
                          </td>
                          <td className="py-3.5 px-3 font-mono select-all">
                            {w.accountNumber}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono text-white font-heavy">
                            ৳ {w.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              w.status === 'Approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : w.status === 'Rejected'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                            }`}>
                              {w.status === 'Approved' ? 'Paid' : w.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
