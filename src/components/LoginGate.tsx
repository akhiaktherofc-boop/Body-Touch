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
  Phone
} from 'lucide-react';

interface LoginGateProps {
  onLoginSuccess: (credentials: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    rememberMe?: boolean;
    isSignUp?: boolean;
  }) => void;
}

interface UserAccount {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string; // Stored simply for this demonstration's offline persistence
}

export default function LoginGate({ onLoginSuccess }: LoginGateProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Social auth state
  const [socialModal, setSocialModal] = useState<'google' | 'instagram' | null>(null);
  const [customInstaUsername, setCustomInstaUsername] = useState('');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  
  // Fields for Sign In
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Fields for Sign Up / Register
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDemoHelper, setShowDemoHelper] = useState(false);

  // Auto initialize default account 'akhiaktherofc' with password 'akhi123' if no accounts exist
  useEffect(() => {
    const existingAccounts = localStorage.getItem('bt_local_accounts');
    if (!existingAccounts) {
      const defaultAccounts: UserAccount[] = [
        {
          username: 'akhiaktherofc',
          fullName: 'Akhi Akther Ofc',
          email: 'akhi.akther.ofc@gmail.com',
          phone: '',
          passwordHash: 'akhi123' // Plain text for local fallback purposes
        }
      ];
      localStorage.setItem('bt_local_accounts', JSON.stringify(defaultAccounts));
    }
  }, []);

  const handleGoogleSignIn = (googleName: string, googleEmail: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!googleEmail.trim() || !googleName.trim()) {
      setErrorMsg('Please fill in both name and Gmail address.');
      return;
    }

    const cleanUsername = googleEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

    const savedAccountsStr = localStorage.getItem('bt_local_accounts') || '[]';
    const accounts: UserAccount[] = JSON.parse(savedAccountsStr);

    let existingUser = accounts.find(
      (acc) => acc.email.toLowerCase() === googleEmail.toLowerCase()
    );

    if (!existingUser) {
      existingUser = {
        username: cleanUsername,
        fullName: googleName,
        email: googleEmail,
        phone: '',
        passwordHash: 'google-oauth'
      };
      const updatedAccounts = [...accounts, existingUser];
      localStorage.setItem('bt_local_accounts', JSON.stringify(updatedAccounts));
    }

    setSuccessMsg('Google authentication successful! Redirecting...');
    setSocialModal(null);

    setTimeout(() => {
      onLoginSuccess({
        username: existingUser!.username,
        fullName: existingUser!.fullName,
        email: existingUser!.email,
        phone: existingUser!.phone,
        rememberMe: rememberMe
      });
    }, 1200);
  };

  const handleInstagramSignInExact = (instaUser: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    const cleanUsername = instaUser.trim().replace('@', '').toLowerCase();

    if (!cleanUsername) {
      setErrorMsg('Please enter a valid Instagram handle.');
      return;
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

    setSuccessMsg('Instagram profile verification successful! Unlocking portal...');
    setSocialModal(null);

    setTimeout(() => {
      onLoginSuccess({
        username: existingUser!.username,
        fullName: existingUser!.fullName,
        email: existingUser!.email,
        phone: existingUser!.phone,
        rememberMe: rememberMe
      });
    }, 1200);
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const inputVal = signInUsername.trim();

    if (!inputVal || !signInPassword.trim()) {
      setErrorMsg('Please input your Email and secure password.');
      return;
    }

    const savedAccountsStr = localStorage.getItem('bt_local_accounts');
    const accounts: UserAccount[] = savedAccountsStr ? JSON.parse(savedAccountsStr) : [];

    // Find user matching email or username
    const foundUser = accounts.find((acc) => {
      const cleanInput = inputVal.toLowerCase().replace(/\s+/g, '');
      const cleanEmail = acc.email.toLowerCase().replace(/\s+/g, '');
      const cleanUsername = acc.username.toLowerCase().replace(/\s+/g, '');

      return (
        cleanEmail === cleanInput ||
        cleanUsername === cleanInput
      );
    });

    if (!foundUser) {
      setErrorMsg('Account with this Email Address was not found. Please sign up below.');
      return;
    }

    if (foundUser.passwordHash !== signInPassword) {
      setErrorMsg('Incorrect secure password. Please try again or use "akhi123" for testing.');
      return;
    }

    // Success login
    setSuccessMsg('Authentication successful! Unlocking portal...');
    setTimeout(() => {
      onLoginSuccess({
        username: foundUser.username,
        fullName: foundUser.fullName,
        email: foundUser.email,
        phone: foundUser.phone,
        rememberMe: rememberMe
      });
    }, 1200);
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newUsername.trim() || !newFullName.trim() || !newEmail.trim() || !newPhone.trim() || !newPassword.trim()) {
      setErrorMsg('Please fill in all required setup credentials, including active Phone Number.');
      return;
    }

    // Validation for spaces in username
    if (newUsername.includes(' ')) {
      setErrorMsg('Username must not contain any spaces.');
      return;
    }

    if (newPhone.trim().length < 8) {
      setErrorMsg('Please enter a valid active phone number.');
      return;
    }

    // Password strength & safety verification (Password must be at least 8 digits/characters long and not easy)
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 digits/characters long.');
      return;
    }

    const lowers = newPassword.toLowerCase();
    const commonWeak = [
      'password', 'password111', 'password123', 'admin123', 'address123', 'bdt12345',
      'qwertyui', 'asdfghjk', 'zxcvbnm1', '12341234', '12345678', '87654321', 
      '123456789', '987654321', '01234567', '76543210', '11223344', '11112222', '12312312'
    ];
    if (commonWeak.includes(lowers)) {
      setErrorMsg('This password is too easy/weak. Please choose a more secure password.');
      return;
    }

    const uniqueChars = new Set(newPassword.split(''));
    if (uniqueChars.size <= 2) {
      setErrorMsg('Password is too repetitive (please use more diverse characters).');
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

    if (lowers.includes(newUsername.toLowerCase().trim()) && newUsername.trim().length >= 4) {
      setErrorMsg('For security, your password should not contain your username.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumOrSpecial = /[^a-zA-Z]/.test(newPassword);
    if (!hasLetter || !hasNumOrSpecial) {
      setErrorMsg('Password must contain a combination of letters AND numbers/special characters.');
      return;
    }

    const savedAccountsStr = localStorage.getItem('bt_local_accounts') || '[]';
    const accounts: UserAccount[] = JSON.parse(savedAccountsStr);

    // Duplicate Check
    const usernameTaken = accounts.some(
      (acc) => acc.username.toLowerCase() === newUsername.trim().toLowerCase()
    );

    if (usernameTaken) {
      setErrorMsg('Username is already registered. Please select another username.');
      return;
    }

    const newAcc: UserAccount = {
      username: newUsername.trim().toLowerCase(),
      fullName: newFullName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      passwordHash: newPassword
    };

    const updatedAccounts = [...accounts, newAcc];
    localStorage.setItem('bt_local_accounts', JSON.stringify(updatedAccounts));

    setSuccessMsg('Account registered successfully! Redirecting...');
    
    // Auto login
    setTimeout(() => {
      onLoginSuccess({
        username: newAcc.username,
        fullName: newAcc.fullName,
        email: newAcc.email,
        phone: newAcc.phone,
        rememberMe: rememberMe,
        isSignUp: true
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen text-[#c4d1eb] bg-[#020714] flex flex-col justify-center items-center px-4 py-8 relative selection:bg-rose-500 selection:text-white">
      {/* Background Decorative Grid Lines & Ambient Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP EMERGENCY MARQUEE WARNING NOTICE */}
      <div className="w-full max-w-md mx-auto mb-6 z-10">
        <div className="bg-[#18080c] border border-rose-500/20 rounded-2xl p-4 shadow-lg flex items-start gap-4 ring-1 ring-rose-500/10 animate-pulse">
          <div className="w-9 h-9 rounded-full bg-rose-950 flex items-center justify-center text-rose-450 shrink-0 border border-rose-900/40">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-left space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-450 font-mono block">URGENT ANNOUNCEMENT</span>
            <p className="text-xs text-rose-200 leading-relaxed font-bold">
              সার্ভিসের ন্যূনতম ১ ঘণ্টা পূর্বে বুকিং দিবেন। সাপোর্টে কথা না বলে ক্যান সার্ভিস বুকিং দিবেন না
            </p>
          </div>
        </div>
      </div>

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
        {activeTab === 'signin' ? (
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
                  placeholder="e.g. akhi.akther.ofc@gmail.com"
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
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

            {/* Remember Me Checkbox */}
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
                  Remember login credentials (লগইন তথ্য মনে রাখুন)
                </span>
              </label>
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
            <div className="pt-2 text-center space-y-2">
              <button
                type="button"
                onClick={() => setShowDemoHelper(!showDemoHelper)}
                className="text-[9.5px] font-black uppercase tracking-widest text-[#5c75ab] hover:text-cyan-400 transition cursor-pointer flex items-center justify-center gap-1.5 mx-auto py-1 px-3 rounded-lg bg-white/5 border border-white/5 active:scale-95"
              >
                <span>{showDemoHelper ? 'Hide System Guide' : 'Need Demo Credentials? (ডেমো অ্যাকাউন্ট)'}</span>
                <span>{showDemoHelper ? '▲' : '▼'}</span>
              </button>

              {showDemoHelper && (
                <div className="bg-slate-950/60 border border-blue-950 rounded-xl p-3 text-left space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                    <span className="text-[9px] font-black tracking-wider text-slate-400 uppercase">OFFICIAL OPERATOR GUIDELINES</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSignInUsername('akhi.akther.ofc@gmail.com');
                        setSignInPassword('akhi123');
                        setErrorMsg('');
                        setSuccessMsg('Credentials auto-filled! Ready to authenticate.');
                      }}
                      className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 hover:bg-cyan-500/20 text-[9px] font-black uppercase px-2 py-1 rounded cursor-pointer transition"
                    >
                      Instant Auto-Fill (অটো-ফিল করুন)
                    </button>
                  </div>
                  <span className="text-[10px] text-[#5c75ab] font-bold block leading-relaxed">
                    Demo Email: <strong className="text-cyan-400 font-mono text-[10.5px]">akhi.akther.ofc@gmail.com</strong><br />
                    Demo Password: <strong className="text-amber-400 font-mono text-[10.5px]">akhi123</strong>
                  </span>
                  <p className="text-[9.5px] text-slate-500 leading-normal font-semibold">
                    * Visitors can also click <strong>JOIN NOW</strong> above to register their own new custom accounts instantly on this website!
                  </p>
                </div>
              )}
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

        {/* Social Login Divider & Buttons */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-y-1/2 left-0 right-0 h-[1px] bg-blue-900/30" />
          <span className="relative inline-block bg-[#050e24] px-3 text-[9px] font-mono font-black tracking-widest text-[#5c75ab]">
            OR AUTHORIZE WITH
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Google Button */}
          <button
            type="button"
            onClick={() => {
              setSocialModal('google');
              setCustomGoogleEmail('');
              setCustomGoogleName('');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-3 bg-[#0a1430] hover:bg-[#0f1d45] border border-blue-950/60 hover:border-blue-500/30 rounded-xl transition-all font-sans font-bold text-xs text-white cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.99 1 12 1 7.35 1 3.39 3.65 1.49 7.51l3.85 2.99c.9-2.7 3.41-4.46 6.66-4.46z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.71 2.87c2.17-2 3.7-4.94 3.7-8.55z"
              />
              <path
                fill="#FBBC05"
                d="M5.34 10.5c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.49 3.15C.54 5.06 0 7.22 0 9.5s.54 4.44 1.49 6.35l3.85-3.35z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.71-2.87c-1.03.69-2.34 1.1-4.25 1.1-3.25 0-5.76-1.76-6.66-4.46L1.49 16.85C3.39 20.71 7.35 23 12 23z"
              />
            </svg>
            Google
          </button>

          {/* Instagram Button */}
          <button
            type="button"
            onClick={() => {
              setSocialModal('instagram');
              setCustomInstaUsername('');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="flex items-center justify-center gap-2 px-3.5 py-3 bg-gradient-to-r from-purple-600/15 via-rose-600/15 to-[#e9008c]/15 hover:from-purple-600/25 hover:via-rose-600/25 hover:to-[#e9008c]/25 border border-purple-500/10 hover:border-rose-500/30 rounded-xl transition-all font-sans font-bold text-xs text-white cursor-pointer active:scale-95 animate-shimmer"
            style={{ backgroundSize: '200% 100%' }}
          >
            <svg className="w-4 h-4 text-rose-450 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
            Instagram
          </button>
        </div>
      </motion.div>

      {/* GOOGLE SIMULATED COMPONENT POPUP */}
      {socialModal === 'google' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-[#080f25] border border-blue-900/40 rounded-3xl p-6 text-left relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-slate-900 shadow-inner">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.61 14.99 1 12 1 7.35 1 3.39 3.65 1.49 7.51l3.85 2.99c.9-2.7 3.41-4.46 6.66-4.46z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.46c-.28 1.48-1.12 2.74-2.38 3.58l3.71 2.87c2.17-2 3.7-4.94 3.7-8.55z" />
                  <path fill="#FBBC05" d="M5.34 10.5c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.49 3.15C.54 5.06 0 7.22 0 9.5s.54 4.44 1.49 6.35l3.85-3.35z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.71-2.87c-1.03.69-2.34 1.1-4.25 1.1-3.25 0-5.76-1.76-6.66-4.46L1.49 16.85C3.39 20.71 7.35 23 12 23z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Sign in with Google</h3>
                <p className="text-[10px] text-slate-400">Choose your Google Account to authenticate</p>
              </div>
            </div>

            {/* Simulated accounts selection list */}
            <div className="space-y-2 mt-4">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('Akhi Akther Ofc', 'akhi.akther.ofc@gmail.com')}
                className="w-full text-left p-3.5 rounded-xl bg-[#091435] hover:bg-slate-900 border border-blue-950 hover:border-cyan-500/30 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors">Akhi Akther Ofc</p>
                  <p className="text-[10px] text-slate-400 font-mono">akhi.akther.ofc@gmail.com</p>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#10245a] text-cyan-300 font-bold">Default</span>
              </button>
            </div>

            {/* Custom Google Account Form Input */}
            <div className="mt-5 pt-4 border-t border-blue-950/60 space-y-3">
              <p className="text-[10px] font-black text-[#5c75ab] uppercase tracking-wider">Or Use Custom Google Account</p>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl px-3.5 py-2.5 font-bold focus:outline-none transition-all"
                />
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="address@gmail.com"
                  className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-cyan-500/70 text-xs text-white rounded-xl px-3.5 py-2.5 font-bold focus:outline-none transition-all font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSocialModal(null)}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900/30 border border-blue-950/60 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customGoogleName.trim() || !customGoogleEmail.trim()) {
                      alert('Please specify both your name and email address first.');
                      return;
                    }
                    handleGoogleSignIn(customGoogleName, customGoogleEmail);
                  }}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-black text-slate-950 bg-cyan-400 hover:bg-cyan-500 cursor-pointer"
                >
                  Confirm Sign In
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* INSTAGRAM SIMULATED COMPONENT POPUP */}
      {socialModal === 'instagram' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-gradient-to-b from-[#1a081a] to-[#040816] border border-rose-900/30 rounded-3xl p-6 text-left relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500" />
            
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/20 shadow-inner">
                <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Instagram Login</h3>
                <p className="text-[10px] text-rose-300">bodyTOUCH Secure Account Dispatch</p>
              </div>
            </div>

            <div className="space-y-4 pt-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Instagram Handle / Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-mono text-xs font-bold">@</span>
                  <input
                    type="text"
                    required
                    value={customInstaUsername}
                    onChange={(e) => setCustomInstaUsername(e.target.value)}
                    placeholder="e.g. akhi.akther.ofc"
                    style={{ paddingLeft: '2rem' }}
                    className="w-full bg-slate-950/60 border border-[#4c1d4a]/40 focus:border-rose-500/70 text-xs text-white rounded-xl pl-8 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Suggested primary profile button */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-1">Suggested quick profiles</p>
                <button
                  type="button"
                  onClick={() => handleInstagramSignInExact('akhiaktherofc')}
                  className="w-full text-left p-3 rounded-xl bg-purple-950/20 hover:bg-purple-950/40 border border-purple-900/30 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-xs font-bold text-pink-300 group-hover:text-white transition-colors">@akhiaktherofc</span>
                  <span className="text-[9px] text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded-full">Primary</span>
                </button>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSocialModal(null)}
                  className="w-1/2 py-3.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-950/40 rounded-xl border border-blue-950/60 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleInstagramSignInExact(customInstaUsername);
                  }}
                  className="w-1/2 py-3.5 text-xs font-black text-slate-950 bg-gradient-to-r from-purple-500 via-rose-500 to-amber-500 hover:opacity-90 rounded-xl cursor-pointer text-center"
                >
                  Login Instagram
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
