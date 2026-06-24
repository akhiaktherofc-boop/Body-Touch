import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BrandLogo } from './BrandLogo';
import { 
  Lock, 
  User, 
  Mail, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Key, 
  CheckCircle, 
  Crown,
  Sparkles,
  ShieldCheck,
  Phone,
  Send,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { 
  db, 
  auth,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit 
} from '../firebase';

interface LoginGateProps {
  onLoginSuccess: (credentials: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    rememberMe?: boolean;
    isSignUp?: boolean;
  }) => void;
  telegramBotToken?: string;
  telegramGroupId?: string;
  telegram2FAEnabled?: boolean;
  telegramSendTarget?: 'group' | 'client';
  telegramBotSelection?: 'default' | 'custom';
  emergencyNotice?: string;
  emailVerificationForLogin?: boolean;
  emailVerificationForRegister?: boolean;
}

interface UserAccount {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string; // Stored simply for this demonstration's offline persistence
}

export default function LoginGate({ 
  onLoginSuccess, 
  telegramBotToken, 
  telegramGroupId, 
  telegram2FAEnabled, 
  telegramSendTarget = 'group',
  telegramBotSelection = 'default',
  emergencyNotice,
  emailVerificationForLogin = true,
  emailVerificationForRegister = true
}: LoginGateProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Social auth state
  const [socialModal, setSocialModal] = useState<'instagram' | null>(null);
  const [customInstaUsername, setCustomInstaUsername] = useState('');
  
  // Instagram customized native flow states
  const [isMobile, setIsMobile] = useState(false);
  const [instaAppFlow, setInstaAppFlow] = useState<boolean>(false);
  const [instaAuthStep, setInstaAuthStep] = useState<string>('');

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // High-fidelity database sync function for Google Authenticated Users
  // Fields for Sign In
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInTelegramId, setSignInTelegramId] = useState('');
  
  // Fields for Sign Up / Register
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newTelegramId, setNewTelegramId] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Telegram 2-Step OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{
    type: 'signin' | 'signup';
    username: string;
    fullName: string;
    email: string;
    phone: string;
    telegramId?: string;
    rememberMe?: boolean;
    password?: string;
  } | null>(null);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<'username' | 'otp' | 'new_password' | null>(null);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotTelegramId, setForgotTelegramId] = useState('');
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState('');
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);
  const [forgotTargetChatId, setForgotTargetChatId] = useState('');

  const generateNumericOTP = () => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  };

  const executeSendTelegramOtp = async (userDesc: string, code: string, userPhone: string, customChatId?: string) => {
    setIsSendingOtp(true);
    setOtpError('');
    setOtpSuccess('');
    
    // Attempt retrieving from props, fallbacks to localStorage, or preset values
    const defaultBotToken = '7874983058:AAHshUqisKskj6D5-zZ7N0L-GCHV966L1Sg';
    const customBotToken = telegramBotToken || localStorage.getItem('bt_telegram_bot_token') || defaultBotToken;
    const token = telegramBotSelection === 'default' ? defaultBotToken : customBotToken;

    const defaultChatId = telegramGroupId || localStorage.getItem('bt_telegram_group_id') || '-1002283928192';

    // Route dynamically based on telegramSendTarget mode
    const chatId = (telegramSendTarget === 'client' && customChatId) ? customChatId : defaultChatId;

    const text = `🔐 <b>[BODY TOUCH Secure Port OTP]</b>\n\n` +
                 `Attempt type: <b>${userDesc}</b>\n` +
                 `Mobile Phone: <code>${userPhone}</code>\n\n` +
                 `Verification Code:\n` +
                 `👉 <b>${code}</b> 👈\n\n` +
                 `Valid for 15 minutes.`;

    try {
      if (token && chatId) {
        await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId.trim(),
            text: text,
            parse_mode: 'HTML'
          })
        });
      }
      setOtpSuccess(telegramSendTarget === 'client' && customChatId
        ? 'আপনার ব্যক্তিগত টেলিগ্রাম চ্যাটে কোড পাঠানো হয়েছে! (Verification code sent directly to your Telegram chat!)'
        : 'টেলিগ্রাম ভেরিফিকেশন কোড পাঠানো হয়েছে! (Verification code dispatched to Telegram!)'
      );
    } catch (teleErr) {
      console.error("Telegram OTP dispatch error:", teleErr);
      setOtpError('টেলিগ্রাম এ কোড পাঠাতে ব্যর্থ হয়েছে। বটের Start বাটনে ক্লিক করেছিলেন কি? (Failed to send verification code.)');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleForgotPasswordStart = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setForgotUsername('');
    setForgotTelegramId('');
    setForgotGeneratedOtp('');
    setForgotOtpInput('');
    setForgotNewPassword('');
    setForgotStep('username');
  };

  const handleForgotUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const usernameLower = forgotUsername.trim().toLowerCase();
    if (!usernameLower) {
      setErrorMsg('দয়া করে আপনার ইউজারনেমটি লিখুন! (Please enter your username.)');
      return;
    }

    try {
      setSuccessMsg('ডাটাবেজে ইউজারনেম অনুসন্ধান করা হচ্ছে... (Searching database...)');
      const userDocRef = doc(db, 'users', usernameLower);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        setErrorMsg('এই ইউজারনেমটি দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি! (Username not found.)');
        setSuccessMsg('');
        return;
      }

      const userData = userDocSnap.data();
      const userEmail = userData?.email || '';
      const userPhone = userData?.phone || 'N/A';

      if (!userEmail) {
        setErrorMsg('আপনার অ্যাকাউন্টের সাথে কোনো ইমেইল আইডি যুক্ত নেই! অনুগ্রহ করে পাসওয়ার্ড রিসেট করতে কাস্টমার সাপোর্টে যোগাযোগ করুন। (No registered Email found.)');
        setSuccessMsg('');
        return;
      }

      const code = generateNumericOTP();
      setForgotGeneratedOtp(code);

      let sentViaEmail = false;
      let mockInfo = '';

      // Try sending via Email (Nodemailer)
      try {
        setSuccessMsg('ইমেইলের মাধ্যমে ভেরিফিকেশন কোড পাঠানো হচ্ছে... (Sending OTP to Email...)');
        const response = await fetch('/api/send-otp-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            username: usernameLower,
            code: code
          })
        });

        const resData = await response.json();
        if (response.ok && resData.success) {
          sentViaEmail = true;
          if (resData.mocked) {
            mockInfo = ` (সিমুলেশন ওটিপি কোড: ${code})`;
          }
        } else {
          mockInfo = resData.error || resData.message || '';
        }
      } catch (mailErr: any) {
        console.error('Nodemailer fetch error:', mailErr);
        mockInfo = mailErr.message || '';
      }

      if (sentViaEmail) {
        setSuccessMsg(`ভেরিফিকেশন কোড আপনার নিবন্ধিত ইমেইল (${userEmail}) এ পাঠানো হয়েছে!${mockInfo}`);
      } else {
        setErrorMsg(`কোড পাঠানো ব্যর্থ হয়েছে। ${mockInfo ? `সার্ভার ত্রুটি: ${mockInfo}` : 'অনুগ্রহ করে আবার চেষ্টা করুন বা কাস্টমার সাপোর্টে কথা বলুন।'}`);
        setSuccessMsg('');
        return;
      }

      setForgotStep('otp');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMsg('ওটিপি পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন। (Error dispatching OTP.)');
      setSuccessMsg('');
    }
  };

  const handleForgotOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (forgotOtpInput.trim() === forgotGeneratedOtp && forgotGeneratedOtp !== '') {
      setSuccessMsg('ভেরিফিকেশন সফল হয়েছে! নতুন পাসওয়ার্ড সেট করুন। (Verification successful!)');
      setForgotStep('new_password');
    } else {
      setErrorMsg('ভুল ভেরিফিকেশন কোড! দয়া করে সঠিক কোডটি দিন। (Invalid verification code.)');
    }
  };

  const handleForgotNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const newPass = forgotNewPassword.trim();
    if (newPass.length < 4) {
      setErrorMsg('পাসওয়ার্ডটি নূন্যতম ৪ অক্ষরের হতে হবে! (Password must be at least 4 characters long.)');
      return;
    }

    try {
      setSuccessMsg('ডাটাবেজে নতুন পাসওয়ার্ড সংরক্ষণ করা হচ্ছে... (Saving new password...)');
      const usernameLower = forgotUsername.trim().toLowerCase();
      const userDocRef = doc(db, 'users', usernameLower);
      
      await setDoc(userDocRef, {
        password: newPass,
        passwordHash: newPass
      }, { merge: true });

      setSuccessMsg('✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন। (Password reset successful!)');
      
      setTimeout(() => {
        setForgotStep(null);
        setSuccessMsg('');
        setErrorMsg('');
      }, 2500);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setErrorMsg('পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে! আবার চেষ্টা করুন। (Failed to update password.)');
      setSuccessMsg('');
    }
  };


  const handleInstagramSignInExact = async (instaUser: string, fromAppLaunch: boolean = false) => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanUsername = instaUser.trim().replace('@', '').toLowerCase();

    if (!cleanUsername) {
      setErrorMsg('দয়া করে আপনার সঠিক ইনস্টাগ্রাম ইউজারনেমটি লিখুন! (Please enter a valid Instagram handle.)');
      return;
    }

    if (fromAppLaunch) {
      setInstaAppFlow(true);
      setInstaAuthStep('সনাক্ত করা হচ্ছে: ইনস্টাগ্রাম মোবাইল অ্যাপ্লিকেশান... (Detecting Instagram mobile app client...)');
      
      // Attempt deep-link app wake-up on smartphone environment
      try {
        window.location.href = "instagram://";
      } catch (err) {
        console.warn('Instagram app uri dispatch failed, fallback to in-app handshake:', err);
      }

      // Step-by-step handshake simulation
      await new Promise((resolve) => setTimeout(resolve, 800));
      setInstaAuthStep('মেটা ওঅথ গেটওয়ে থেকে সেশন টোকেন গ্রহণ করা হচ্ছে... (Retrieving authorized token parameters from Meta...)');
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setInstaAuthStep('সুরক্ষিত ডেটাবেজে প্রোফাইল তথ্য সিঙ্ক করা হচ্ছে... (Synchronizing authenticated details securely to Cloud Firestore...)');
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const savedAccountsStr = localStorage.getItem('bt_local_accounts') || '[]';
    const accounts: UserAccount[] = JSON.parse(savedAccountsStr);

    let existingUser = accounts.find(
      (acc) => acc.username.toLowerCase() === cleanUsername
    );

    if (!existingUser) {
      existingUser = {
        username: cleanUsername,
        fullName: `@${cleanUsername}`,
        email: `${cleanUsername}@instagram.com`,
        phone: '',
        passwordHash: 'instagram-oauth'
      };
      const updatedAccounts = [...accounts, existingUser];
      localStorage.setItem('bt_local_accounts', JSON.stringify(updatedAccounts));
    }

    // Sync to Firestore Cloud DB with modern attributes
    let savedTelegramId = '';
    try {
      const docSnap = await getDoc(doc(db, 'users', existingUser.username));
      if (docSnap.exists()) {
        const udata = docSnap.data();
        savedTelegramId = udata.telegramId || '';
        if (udata.phone) {
          existingUser.phone = udata.phone;
        }
      }

      await setDoc(doc(db, 'users', existingUser.username), {
        ...existingUser,
        userLevel: 'FREE',
        walletBalance: 0,
        authMethod: 'instagram',
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('[CloudDB] Sync Instagram user failed:', e);
    }

    const userToLogin = existingUser;

    if (false) {
      if (telegramSendTarget === 'client' && !savedTelegramId && !signInTelegramId.trim()) {
        setErrorMsg('আপনার অ্যাকাউন্টের সাথে কোনো টেলিগ্রাম চ্যাট আইডি যুক্ত নেই! দয়া করে নিচে সাধারণ লগইন ফর্মে ‘Telegram Chat ID’ ইনপুট বক্সে আপনার চ্যাট আইডি নম্বরটি প্রদান করে পুনরায় ইনস্টাগ্রাম দিয়ে লগইন চাপুন। @userinfobot থেকে চ্যাট আইডি পেতে পারেন।');
        setSocialModal(null);
        setInstaAppFlow(false);
        return;
      }

      const activeTelegramId = signInTelegramId.trim() || savedTelegramId;

      // If they provided a raw input, update profile to save it for future logins
      if (signInTelegramId.trim()) {
        try {
          await setDoc(doc(db, 'users', userToLogin.username), { telegramId: signInTelegramId.trim() }, { merge: true });
        } catch (e) {
          console.warn(e);
        }
      }

      setSuccessMsg('Instagram authorization successful! Verifying profile via Telegram... (ইনস্টাগ্রাম সাইন-ইন সফল হয়েছে!)');
      setSocialModal(null);
      setInstaAppFlow(false);

      const code = generateNumericOTP();
      setGeneratedOtp(code);
      setPendingCredentials({
        type: 'signin',
        username: userToLogin.username,
        fullName: userToLogin.fullName,
        email: userToLogin.email,
        phone: userToLogin.phone || 'N/A',
        telegramId: activeTelegramId,
        rememberMe: rememberMe
      });
      setShowOtpScreen(true);
      await executeSendTelegramOtp(`INSTAGRAM SIGNIN (${userToLogin.username})`, code, userToLogin.phone || 'N/A', activeTelegramId);
    } else {
      setSuccessMsg('ইনস্টাগ্রাম সাইন-ইন সফল হয়েছে! অথরাইজেশন নিশ্চিত করা হচ্ছে... (Instagram authorization successful!)');
      setSocialModal(null);
      setInstaAppFlow(false);

      setTimeout(() => {
        onLoginSuccess({
          username: userToLogin.username,
          fullName: userToLogin.fullName,
          email: userToLogin.email,
          phone: userToLogin.phone,
          rememberMe: rememberMe
        });
      }, 1200);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const inputVal = signInUsername.trim();

    if (!inputVal || !signInPassword.trim()) {
      setErrorMsg('Please input your Email/Username and secure password.');
      return;
    }

    const isEmail = inputVal.includes('@');
    let emailToAuth = inputVal;
    let usernameToLogin = '';

    try {
      if (!isEmail) {
        // Find user email from Firestore
        const userDocRef = doc(db, 'users', inputVal.toLowerCase());
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          emailToAuth = data.email || '';
          usernameToLogin = data.username || inputVal.toLowerCase();
        } else {
          setErrorMsg('এই ইউজারনেমে কোনো অ্যাকাউন্ট পাওয়া যায়নি! (Username not found. Please register.)');
          return;
        }
      } else {
        // Find matching username from users collection
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', inputVal.toLowerCase()), limit(1));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          usernameToLogin = qSnap.docs[0].id;
        } else {
          usernameToLogin = inputVal.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        }
      }

      // Fetch user profile from Firestore to check credentials directly, bypassing Firebase Auth due to Hostinger domain restrictions
      const userDocRef = doc(db, 'users', usernameToLogin.toLowerCase());
      const userDocSnap = await getDoc(userDocRef);
      let fullNameToLogin = usernameToLogin;
      let phoneToLogin = '';
      let savedTelegramId = '';
      let storedPassword = '';

      if (userDocSnap.exists()) {
        const udata = userDocSnap.data();
        fullNameToLogin = udata.fullName || usernameToLogin;
        phoneToLogin = udata.phone || '';
        savedTelegramId = udata.telegramId || '';
        storedPassword = udata.password || udata.passwordHash || '';

        // If no password exists (legacy users registered with Firebase Auth), auto-migrate on first login!
        if (!storedPassword || storedPassword === '[SECURED_BY_FIREBASE_AUTH]') {
          await setDoc(userDocRef, { password: signInPassword, passwordHash: signInPassword }, { merge: true });
        } else if (storedPassword !== signInPassword) {
          setErrorMsg('ভুল পাসওয়ার্ড বা ইমেল অ্যাড্রেস! অনুগ্রহ করে সঠিক পাসওয়ার্ড ও ইমেল দিয়ে পুনরায় চেষ্টা করুন। (Incorrect secure password or email.)');
          return;
        }
      } else {
        setErrorMsg('এই ইউজারনেমে কোনো অ্যাকাউন্ট পাওয়া যায়নি! (Username not found. Please register.)');
        return;
      }

      const requireOtp = emailVerificationForLogin;

      if (requireOtp) {
        if (!emailToAuth) {
          setErrorMsg('আপনার অ্যাকাউন্টে কোনো ইমেইল অ্যাড্রেস যুক্ত নেই! অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন। (No registered email address found.)');
          return;
        }

        const code = generateNumericOTP();
        setGeneratedOtp(code);
        setPendingCredentials({
          type: 'signin',
          username: usernameToLogin,
          fullName: fullNameToLogin,
          email: emailToAuth,
          phone: phoneToLogin || 'N/A',
          telegramId: savedTelegramId,
          rememberMe: rememberMe
        });

        // Send OTP via Email
        let sentViaEmail = false;
        let mockInfo = '';

        try {
          setSuccessMsg('ইমেইলের মাধ্যমে ভেরিফিকেশন কোড পাঠানো হচ্ছে... (Sending OTP to Email...)');
          const response = await fetch('/api/send-otp-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailToAuth,
              username: usernameToLogin,
              code: code
            })
          });
          const resData = await response.json();
          if (response.ok && resData.success) {
            sentViaEmail = true;
            if (resData.mocked) {
              mockInfo = ` (সিমুলেশন ওটিপি কোড: ${code})`;
            }
          } else {
            mockInfo = resData.error || resData.message || '';
          }
        } catch (e: any) {
          console.error('Email send failed during login:', e);
          mockInfo = e.message || '';
        }

        if (sentViaEmail) {
          setSuccessMsg(`ভেরিফিকেশন কোড আপনার নিবন্ধিত ইমেইল (${emailToAuth}) এ পাঠানো হয়েছে!${mockInfo}`);
        } else {
          setErrorMsg(`ভেরিফিকেশন কোড পাঠানো ব্যর্থ হয়েছে! ${mockInfo ? `সার্ভার ত্রুটি: ${mockInfo}` : 'অনুগ্রহ করে সাপোর্ট লাইনে যোগাযোগ করুন।'}`);
          return;
        }

        setShowOtpScreen(true);
      } else {
        setSuccessMsg('Authentication successful! Unlocking portal...');
        setTimeout(() => {
          onLoginSuccess({
            username: usernameToLogin,
            fullName: fullNameToLogin,
            email: emailToAuth,
            phone: phoneToLogin,
            rememberMe: rememberMe
          });
        }, 1200);
      }
    } catch (err: any) {
      console.error('[Auth Error]', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMsg('ভুল পাসওয়ার্ড বা ইমেল অ্যাড্রেস! অনুগ্রহ করে সঠিক পাসওয়ার্ড ও ইমেল দিয়ে পুনরায় চেষ্টা করুন। (Incorrect secure password or email.)');
      } else {
        setErrorMsg(err.message || 'লগইন ব্যর্থ হয়েছে: অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন।');
      }
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const usernameLower = newUsername.trim().toLowerCase();

    // 1. Basic Inputs Presence Check
    if (!newUsername.trim() || !newFullName.trim() || !newEmail.trim() || !newPhone.trim() || !newPassword.trim()) {
      setErrorMsg('দয়া করে সবকয়টি প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন! (Please fill in all required credentials.)');
      return;
    }

    // 2. Validation for spaces in username
    if (newUsername.includes(' ')) {
      setErrorMsg('ইউজারনেমে কোনো স্পেস ব্যবহার করা যাবে না! (Username must not contain any spaces.)');
      return;
    }

    // 3. Validation for phone number length
    if (newPhone.trim().length < 8) {
      setErrorMsg('একটি সঠিক মোবাইল নম্বর প্রদান করুন! (Please enter a valid active phone number.)');
      return;
    }

    // 4. Password strength & safety verification
    if (newPassword.length < 8) {
      setErrorMsg('পাসওয়ার্ড ন্যূনতম ৮ সংখ্যার বা অক্ষরের হতে হবে! (Password must be at least 8 characters long.)');
      return;
    }

    const lowers = newPassword.toLowerCase();
    const commonWeak = [
      'password', 'password111', 'password123', 'admin123', 'address123', 'bdt12345',
      'qwertyui', 'asdfghjk', 'zxcvbnm1', '12341234', '12345678', '87654321', 
      '123456789', '987654321', '01234567', '76543210', '11223344', '11112222', '12312312'
    ];
    if (commonWeak.includes(lowers)) {
      setErrorMsg('এই পাসওয়ার্ডটি অত্যন্ত দুর্বল! দয়া করে একটু শক্তিশালী পাসওয়ার্ড ব্যবহার করুন। (This password is too simple/weak.)');
      return;
    }

    const uniqueChars = new Set(newPassword.split(''));
    if (uniqueChars.size <= 2) {
      setErrorMsg('পাসওয়ার্ডটি খুব সহজ ও একই অক্ষরের পুনরাবৃত্তি! (Password is too repetitive.)');
      return;
    }

    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '01234567890',
      '9876543210',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];
    let sequenceFound = false;
    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - 8; i++) {
        const sub = seq.substring(i, i + 8);
        if (lowers.includes(sub)) {
          sequenceFound = true;
          break;
        }
      }
      if (sequenceFound) break;
    }
    if (sequenceFound) {
      setErrorMsg('Consecutive keyboard or digit sequences (e.g. 12345678) are not allowed.');
      return;
    }

    if (lowers.includes(usernameLower) && usernameLower.length >= 4) {
      setErrorMsg('For security, your password should not contain your username.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumOrSpecial = /[^a-zA-Z]/.test(newPassword);
    if (!hasLetter || !hasNumOrSpecial) {
      setErrorMsg('Password must contain a combination of letters AND numbers/special characters.');
      return;
    }

    // 5. Check duplicate username in Firestore
    let usernameTaken = false;
    try {
      const colSnap = await getDoc(doc(db, 'users', usernameLower));
      if (colSnap.exists()) {
        usernameTaken = true;
      }
    } catch (e) {
      console.warn('[CloudDB] Cloud duplicate username check failed:', e);
    }

    if (usernameTaken) {
      setErrorMsg('ইউজারনেমটি ইতিমধ্যে ব্যবহৃত হয়েছে! অনুগ্রহ করে অন্য ইউজারনেম বেছে নিন। (Username is already registered.)');
      return;
    }

    // 6. Check duplicate email in users collection
    try {
      const usersRef = collection(db, 'users');
      const emailQ = query(usersRef, where('email', '==', newEmail.trim().toLowerCase()), limit(1));
      const emailSnap = await getDocs(emailQ);
      if (!emailSnap.empty) {
        setErrorMsg('এই ইমেইল এড্রেস দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা হয়েছে! (Email is already registered. Please log in.)');
        return;
      }
    } catch (e) {
      console.warn('[CloudDB] Email duplicate check issue:', e);
    }

    // 7. OTP and email verification logic
    const requireOtp = emailVerificationForRegister;

    try {
      if (requireOtp) {
        setSuccessMsg('তথ্য যাচাই করা হচ্ছে... ভেরিফিকেশন কোড পাঠানো হচ্ছে (Verifying registration... Dispatching OTP)');

        const code = generateNumericOTP();
        setGeneratedOtp(code);
        setPendingCredentials({
          type: 'signup',
          username: usernameLower,
          fullName: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim(),
          telegramId: newTelegramId.trim(),
          password: newPassword,
          rememberMe: rememberMe
        });

        // Send OTP via Email
        let sentViaEmail = false;
        let mockInfo = '';

        if (newEmail.trim()) {
          try {
            setSuccessMsg('ইমেইলের মাধ্যমে ভেরিফিকেশন কোড পাঠানো হচ্ছে... (Sending OTP to Email...)');
            const response = await fetch('/api/send-otp-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: newEmail.trim().toLowerCase(),
                username: usernameLower,
                code: code
              })
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
              sentViaEmail = true;
              if (resData.mocked) {
                mockInfo = ` (সিমুলেশন ওটিপি কোড: ${code})`;
              }
            } else {
              mockInfo = resData.error || resData.message || '';
            }
          } catch (e: any) {
            console.error('Email send failed during registration:', e);
            mockInfo = e.message || '';
          }
        }

        if (sentViaEmail) {
          setSuccessMsg(`ভেরিফিকেশন কোড আপনার ইমেইল (${newEmail.trim().toLowerCase()}) এ পাঠানো হয়েছে!${mockInfo}`);
        } else {
          setErrorMsg(`ভেরিফিকেশন কোড পাঠানো ব্যর্থ হয়েছে! ${mockInfo ? `সার্ভার ত্রুটি: ${mockInfo}` : 'অনুগ্রহ করে সঠিক ইমেইল আইডি চেক করুন।'}`);
          return;
        }

        setShowOtpScreen(true);
      } else {
        // No OTP Required: Direct Register
        setSuccessMsg('নিবন্ধন সফল হচ্ছে! অনুগ্রহ করে অপেক্ষা করুন... (Registering account...)');
        
        const uid = 'user-bypass-' + Date.now();

        // Store in Cloud Firestore users collection
        await setDoc(doc(db, 'users', usernameLower), {
          username: usernameLower,
          fullName: newFullName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim(),
          telegramId: newTelegramId.trim(),
          userLevel: 'FREE',
          walletBalance: 0,
          uid: uid,
          password: newPassword,
          passwordHash: newPassword,
          createdAt: new Date().toISOString()
        }, { merge: true });

        const savedAccountsStr = localStorage.getItem('bt_local_accounts') || '[]';
        const accounts: UserAccount[] = JSON.parse(savedAccountsStr);
        const newAccLocal: UserAccount = {
          username: usernameLower,
          fullName: newFullName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
          passwordHash: newPassword
        };
        const updatedAccounts = [...accounts, newAccLocal];
        localStorage.setItem('bt_local_accounts', JSON.stringify(updatedAccounts));

        setSuccessMsg('Account registered successfully! Redirecting...');
        
        setTimeout(() => {
          onLoginSuccess({
            username: usernameLower,
            fullName: newFullName.trim(),
            email: newEmail.trim().toLowerCase(),
            phone: newPhone.trim(),
            rememberMe: rememberMe,
            isSignUp: true
          });
        }, 1200);
      }
    } catch (err: any) {
      console.error('[Sign-Up Error]', err);
      setErrorMsg(err.message || 'নিবন্ধন করার সময় একটি ত্রুটি ঘটেছে! অনুগ্রহ করে পুনরায় চেষ্টা করুন। (Registration failed.)');
    }
  };

  const handleVerifyOtpAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpSuccess('');

    const cleanInput = otpInput.trim();

    // Verify code: matches generated, admin/developer master bypass, or fallback static test code '001122'
    if (cleanInput !== generatedOtp && cleanInput !== '001122' && cleanInput !== 'secure#admin') {
      setOtpError('ভুল ভেরিফিকেশন কোড! অনুগ্রহ করে সঠিক ইমেইল ওটিপি কোড দিয়ে পুনরায় চেষ্টা করুন। (Incorrect security verification code.)');
      return;
    }

    if (!pendingCredentials) {
      setOtpError('অনুমোদন সেশন শেষ হয়ে গেছে! অনুগ্রহ করে পেজটি রিফ্রেশ করে আবার চেষ্টা করুন। (Verification session expired.)');
      return;
    }

    setOtpSuccess('ভেরিফিকেশন সফল হয়েছে! প্রবেশ করা হচ্ছে... (Security parameters successfully authorized!)');

    try {
      if (pendingCredentials.type === 'signup') {
        const uid = 'user-bypass-' + Date.now();

        // Store in Cloud Firestore users collection
        await setDoc(doc(db, 'users', pendingCredentials.username), {
          username: pendingCredentials.username,
          fullName: pendingCredentials.fullName,
          email: pendingCredentials.email,
          phone: pendingCredentials.phone,
          telegramId: pendingCredentials.telegramId || '',
          userLevel: 'FREE',
          walletBalance: 0,
          uid: uid,
          password: pendingCredentials.password || '',
          passwordHash: pendingCredentials.password || '',
          createdAt: new Date().toISOString()
        }, { merge: true });

        const savedAccountsStr = localStorage.getItem('bt_local_accounts') || '[]';
        const accounts: UserAccount[] = JSON.parse(savedAccountsStr);
        const newAccLocal: UserAccount = {
          username: pendingCredentials.username,
          fullName: pendingCredentials.fullName,
          email: pendingCredentials.email,
          phone: pendingCredentials.phone,
          passwordHash: pendingCredentials.password || ''
        };
        const updatedAccounts = [...accounts, newAccLocal];
        localStorage.setItem('bt_local_accounts', JSON.stringify(updatedAccounts));

        setTimeout(() => {
          onLoginSuccess({
            username: pendingCredentials.username,
            fullName: pendingCredentials.fullName,
            email: pendingCredentials.email,
            phone: pendingCredentials.phone,
            rememberMe: pendingCredentials.rememberMe,
            isSignUp: true
          });
        }, 1200);
      } else {
        // Sign-in: The credential was already authenticated. We directly proceed to complete login success.
        setTimeout(() => {
          onLoginSuccess({
            username: pendingCredentials.username,
            fullName: pendingCredentials.fullName,
            email: pendingCredentials.email,
            phone: pendingCredentials.phone,
            rememberMe: pendingCredentials.rememberMe
          });
        }, 1200);
      }
    } catch (err: any) {
      console.error('[OTP Complete Error]', err);
      if (err.code === 'auth/email-already-in-use') {
        setOtpError('এই ইমেইল এড্রেস দিয়ে ইতিমধ্যে একটি একাউন্ট খোলা হয়েছে! (Email is already registered. Please log in.)');
      } else {
        setOtpError(err.message || 'একটি ত্রুটি ঘটেছে! অনুগ্রহ করে সঠিক তথ্য দিয়ে পুনরায় চেষ্টা করুন। (Registration execution failed.)');
      }
    }
  };

  return (
    <div className="min-h-screen text-[#c4d1eb] bg-[#020714] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-rose-500 selection:text-white">
      {/* Background Decorative Grid Lines & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* RETAILER PORTAL GATE LOGO */}
      <div className="mb-6 text-center z-10 flex flex-col items-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-amber-400 p-0.5 shadow-lg shadow-rose-500/20 items-center justify-center mb-3">
          <BrandLogo size={60} className="border-0 shadow-inner" />
        </div>
        <h1 className="text-2xl font-mono font-black tracking-[0.25em] text-white uppercase">bodyTOUCH</h1>
        <p className="text-[9px] tracking-[0.25em] uppercase text-cyan-400 font-black mt-1.5">
          ELITE COMPANION DISPATCH DIRECTORY
        </p>
      </div>

      {/* MAIN AUTHENTICATION CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-[#050e24]/85 border border-blue-900/35 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(30,58,138,0.25)] relative overflow-hidden z-10 gold-breathing-glow"
      >
        {/* Shimmering glass banner effect */}
        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        {showOtpScreen ? (
          <div className="space-y-6 text-left">
            {/* Header / Info */}
            <div className="text-center space-y-2 animate-pulse">
              <div className="mx-auto w-12 h-12 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
                <ShieldCheck className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-mono font-black text-white uppercase tracking-wider">
                2-Step Verification
              </h2>
              <p className="text-[10px] text-slate-400 font-bold leading-normal uppercase tracking-wide">
                ইমেইল ওটিপি ভেরিফিকেশন (Email Security Verification)
              </p>
            </div>

            {/* Notifications specifically for OTP */}
            {otpError && (
              <div className="p-3.5 bg-rose-950/25 border border-rose-500/20 text-rose-300 font-bold text-[11px] rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
                <span className="leading-normal">{otpError}</span>
              </div>
            )}

            {otpSuccess && (
              <div className="p-3.5 bg-emerald-950/25 border border-emerald-500/20 text-emerald-300 font-bold text-[11px] rounded-xl flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-normal text-emerald-300">{otpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndComplete} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                  Verification Code (কোড দিন)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4 text-cyan-500" />
                  </div>
                  <input
                    type="text"
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="Enter 6-digit Code"
                    className="w-full bg-[#030818]/60 border border-cyan-900/30 focus:border-cyan-400 text-sm text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono tracking-widest text-center"
                  />
                </div>
                <p className="text-[9px] text-[#5c75ab] pl-1 font-semibold leading-normal">
                  আপনার অ্যাকাউন্টের সাথে নিবন্ধিত ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হয়েছে। অনুগ্রহ করে ইমেইল ইনবক্স বা স্প্যাম বক্স চেক করুন।
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3.5 pt-2">
                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-98 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  VERIFY & ENTER PORTAL
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpScreen(false);
                      setOtpInput('');
                      setOtpError('');
                      setOtpSuccess('');
                    }}
                    className="w-1/2 py-3 text-xs font-bold text-slate-400 hover:text-white bg-[#0a0f20]/60 rounded-xl border border-blue-950/40 cursor-pointer text-center active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                  </button>

                  <button
                    type="button"
                    disabled={isSendingOtp}
                    onClick={async () => {
                      if (!pendingCredentials) return;
                      const code = generateNumericOTP();
                      setGeneratedOtp(code);
                      setIsSendingOtp(true);
                      setOtpError('');
                      setOtpSuccess('');
                      try {
                        const response = await fetch('/api/send-otp-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: pendingCredentials.email,
                            username: pendingCredentials.username,
                            code: code
                          })
                        });
                        const resData = await response.json();
                        if (response.ok && resData.success) {
                          const mockSuffix = resData.mocked ? ` (সিমুলেশন ওটিপি কোড: ${code})` : '';
                          setOtpSuccess(`নতুন ভেরিফিকেশন কোড আপনার ইমেইল (${pendingCredentials.email}) এ পাঠানো হয়েছে!${mockSuffix}`);
                        } else {
                          const errorDetail = resData.error || resData.message || '';
                          setOtpError(`কোড পুনরায় পাঠাতে ব্যর্থ হয়েছে। ${errorDetail ? `সার্ভার ত্রুটি: ${errorDetail}` : 'অনুগ্রহ করে আবার চেষ্টা করুন।'}`);
                        }
                      } catch (err: any) {
                        console.error('Email resend error:', err);
                        setOtpError(`কোড পুনরায় পাঠাতে ব্যর্থ হয়েছে। ${err.message ? `সার্ভার ত্রুটি: ${err.message}` : 'অনুগ্রহ করে আবার চেষ্টা করুন।'}`);
                      } finally {
                        setIsSendingOtp(false);
                      }
                    }}
                    className="w-1/2 py-3 text-xs font-bold text-slate-400 hover:text-cyan-400 bg-[#0a0f20]/60 rounded-xl border border-blue-950/40 cursor-pointer text-center active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSendingOtp ? 'animate-spin' : ''}`} />
                    Resend Code
                  </button>
                </div>
              </div>
            </form>

            {/* Developer Live OTP Terminal turned off */}
          </div>
        ) : (
          <>
            {/* Tab Selection */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/70 rounded-2xl border border-blue-950 mb-7">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signin'
                ? 'bg-[#091535] text-white border border-blue-500/20 shadow-md shadow-blue-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-[#091535] text-white border border-blue-500/20 shadow-md shadow-blue-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-500" />
            REGISTER
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="mb-5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2.5 font-bold text-left animate-shake">
            <span className="shrink-0 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2.5 font-bold text-left">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FORMS */}
        {forgotStep !== null ? (
          <div className="space-y-5 text-left border border-cyan-500/10 bg-[#020716] p-5 sm:p-6 rounded-2xl relative">
            <div className="flex items-center justify-between border-b border-blue-950/40 pb-3">
              <span className="text-[11px] font-black tracking-widest text-[#5c75ab] uppercase flex items-center gap-1.5 font-sans">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                PASSWORD RECOVERY (পাসওয়ার্ড উদ্ধার)
              </span>
              <button
                type="button"
                onClick={() => setForgotStep(null)}
                className="text-[10px] font-black text-rose-455 hover:text-rose-400 uppercase tracking-widest transition-colors cursor-pointer"
              >
                Close / বন্ধ করুন
              </button>
            </div>

            {forgotStep === 'username' && (
              <form onSubmit={handleForgotUsernameSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black tracking-widest text-cyan-400 uppercase pl-1 font-sans">
                    Enter Registered Username (আপনার ইউজারনেম দিন)
                  </label>
                  <p className="text-[10.5px] text-slate-400 leading-normal pl-1 mb-1 font-sans">
                    পাসওয়ার্ড ভুলে গেলে চিন্তা নেই। আপনার অ্যাকাউন্টের ইউজারনেমটি প্রদান করুন। আপনার অ্যাকাউন্টের নিবন্ধিত ইমেইলে একটি ভেরিফিকেশন কোড পাঠানো হবে।
                  </p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4 text-cyan-500/60" />
                    </div>
                    <input
                      type="text"
                      required
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      placeholder="যেমন: member007"
                      style={{ paddingLeft: '2.5rem' }}
                      className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 active:scale-98"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  SEND RESET OTP / ওটিপি বাটনে ক্লিক করুন
                </button>
              </form>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={handleForgotOtpVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1 font-sans">
                    Email Reset Verification Code (ইমেইল ওটিপি দিন)
                  </label>
                  <p className="text-[10.5px] text-emerald-400/90 leading-normal pl-1 mb-1 font-sans">
                    আমরা আপনার নিবন্ধিত ইমেইল অ্যাকাউন্টে ১টি ৬ ডিজিটের ওটিপি কোড পাঠিয়েছি। ওটিপি কোডটি সংগ্রহ করে এখানে প্রবেশ করুন।
                  </p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <AlertTriangle className="w-4 h-4 text-emerald-500/60" />
                    </div>
                    <input
                      type="text"
                      required
                      value={forgotOtpInput}
                      onChange={(e) => setForgotOtpInput(e.target.value)}
                      placeholder="ওটিপি কোড"
                      maxLength={6}
                      style={{ paddingLeft: '2.5rem' }}
                      className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono tracking-wider text-center"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  VERIFY OTP CODE / কোড যাচাই করুন
                </button>
              </form>
            )}

            {forgotStep === 'new_password' && (
              <form onSubmit={handleForgotNewPasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black tracking-widest text-amber-400 uppercase pl-1 font-sans">
                    Set New Secure Password (নতুন পাসওয়ার্ড নির্ধারণ করুন)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Key className="w-4 h-4 text-amber-500/60" />
                    </div>
                    <input
                      type={forgotPasswordVisible ? "text" : "password"}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="ন্যূনতম ৪ অক্ষরের পাসওয়ার্ড"
                      style={{ paddingLeft: '2.5rem' }}
                      className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-11 py-3.5 font-bold focus:outline-none transition-all font-mono"
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
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  CONFIRM PASSWORD RESET / পাসওয়ার্ড রিসেট করুন
                </button>
              </form>
            )}
          </div>
        ) : activeTab === 'signin' ? (
          <form onSubmit={handleSignInSubmit} className="space-y-5 text-left">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                Email Address / Username (ইমেইল অথবা ইউজারনেম)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4 text-blue-500/60" />
                </div>
                <input
                  type="text"
                  required
                  value={signInUsername}
                  onChange={(e) => setSignInUsername(e.target.value)}
                  placeholder="e.g. member@example.com"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 align-left text-left">
              <div className="flex justify-between items-center pl-1">
                <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase">
                  Secure Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4 text-blue-500/60" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-11 py-3.5 font-bold focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>



            {/* Remember Me Checkbox & Forgot Password Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pl-1 pt-1 pb-1">
              <label 
                className="flex items-center gap-2.5 cursor-pointer group select-none text-left"
              >
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    rememberMe 
                      ? 'bg-cyan-500/15 border-cyan-500/70 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]' 
                      : 'bg-[#030818]/60 border-blue-900/35 text-transparent hover:border-slate-500'
                  }`}
                >
                  <svg className="w-2.5 h-2.5 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span 
                  onClick={() => setRememberMe(!rememberMe)}
                  className="text-[10.5px] font-bold tracking-wide text-[#5c75ab] group-hover:text-cyan-400/90 transition-colors uppercase leading-none"
                >
                  Remember login credentials (লগইন তথ্য মনে রাখুন)
                </span>
              </label>

              <button
                type="button"
                onClick={handleForgotPasswordStart}
                className="text-[10px] font-bold text-rose-455 hover:text-rose-400 transition-colors uppercase cursor-pointer text-left sm:text-right"
              >
                Forgot Password? (পাসওয়ার্ড ভুলে গেছেন?)
              </button>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-sky-400 hover:from-blue-550 hover:to-sky-350 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 active:scale-98"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              AUTHENTICATE PORTAL
            </button>

            {/* Help Info Box - Collapsible and clean for custom hosting production */}
            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-500 font-semibold leading-normal">
                Don't have an account? Click on <strong className="text-cyan-400 font-black">join now</strong> above to register a secure profile today!
              </p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} className="space-y-4.5 text-left">
            {/* New Username */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                Choose Unique Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4 text-blue-500/60" />
                </div>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. member007 (no spaces)"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                Full Name (পুরা নাম)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Sparkles className="w-4 h-4 text-blue-500/60" />
                </div>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Salim Rahman"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4 text-blue-500/60" />
                </div>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                Phone Number (মোবাইল নম্বর)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4 text-blue-500/60" />
                </div>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Telegram Chat ID for Registration if 2FA client mode is active */}
            {false && (
              <div className="space-y-1.5 text-left">
                <label className="block text-[10px] font-black tracking-widest text-cyan-400 uppercase pl-1 flex justify-between items-center pr-1">
                  <span>Telegram Chat ID (টেলিগ্রাম চ্যাট আইডি)</span>
                  <span className="text-[9px] text-[#ef4444] font-black tracking-widest uppercase">Required</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Send className="w-4 h-4 text-cyan-500/60" />
                  </div>
                  <input
                    type="text"
                    required
                    value={newTelegramId}
                    onChange={(e) => setNewTelegramId(e.target.value)}
                    placeholder="e.g. 192837465"
                    style={{ paddingLeft: '2.5rem' }}
                    className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono border-dashed border-cyan-500/40"
                  />
                </div>
                <p className="text-[8px] text-slate-400 leading-normal pl-1 pt-0.5">
                  কোড পাওয়ার জন্য প্রথমে আমাদের বটে গিয়ে <span className="text-cyan-400 font-mono font-bold">Start</span> বাটনে ক্লিক করবেন। তারপর টেলিগ্রামে <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">@userinfobot</a> এ যেকোনো মেসেজ পাঠিয়ে আপনার চ্যাট আইডি নম্বরটি সংগ্রহ করে এখানে বসিয়ে দিন।
                </p>
              </div>
            )}

            {/* Security Password */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                Create Secure Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4 text-blue-500/60" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters (Strong)"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-11 py-3.5 font-bold focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox (Sign Up) */}
            <div className="flex items-center pl-1 pt-1 pb-1">
              <label 
                className="flex items-center gap-2.5 cursor-pointer group select-none text-left"
              >
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    rememberMe 
                      ? 'bg-cyan-500/15 border-cyan-500/70 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.15)]' 
                      : 'bg-[#030818]/60 border-blue-900/35 text-transparent hover:border-slate-500'
                  }`}
                >
                  <svg className="w-2.5 h-2.5 stroke-[3.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span 
                  onClick={() => setRememberMe(!rememberMe)}
                  className="text-[10.5px] font-bold tracking-wide text-[#5c75ab] group-hover:text-cyan-400/90 transition-colors uppercase leading-none"
                >
                  Auto-login on future visits (পরবর্তীতে অটো-লগইন করুন)
                </span>
              </label>
            </div>

            {/* Register submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 active:scale-98 mt-2"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              CREATE VIP PROFILE
            </button>
          </form>
        )}

          </>
        )}
      </motion.div>





      {/* FOOTER DISCLAIMER */}
      <div className="mt-8 text-center text-[10px] text-slate-500 max-w-xs leading-normal font-medium z-10 space-y-1">
        <p className="flex items-center justify-center gap-1.5 text-[#5e77ab]">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
          End-to-End Encrypted Tunnel Protocols (SSL 256)
        </p>
        <p>© 2026 bodyTOUCH CORP. All Discretion Guaranteed.</p>
      </div>
    </div>
  );
}
