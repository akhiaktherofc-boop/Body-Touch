import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, User, Briefcase, Camera, Send, Check, Trash2, ShieldCheck, UploadCloud, Copy, Info } from 'lucide-react';
import { Companion, ParentArea } from '../types';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'female' | 'male' | 'donor' | null;
  cities?: string[];
  structuredCities?: ParentArea[];
  onAddCompanion?: (companion: Companion) => void;
  telegramHelpline?: string;
  registrationFee?: number;
}

export default function JoinModal({ 
  isOpen, 
  onClose, 
  initialType, 
  cities, 
  structuredCities,
  onAddCompanion, 
  telegramHelpline = 'BodyTouchSupport',
  registrationFee = 3000
}: JoinModalProps) {
  const [type, setType] = useState<'female' | 'male' | 'donor'>(initialType || 'female');
  
  // Custom states for files
  const [pictures, setPictures] = useState<string[]>([]);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const SERVICES_REAL = [
    { id: 'real_1hour', english: 'Real 1 HOUR', bangla: 'রিয়েল ১ ঘন্টা' },
    { id: 'real_2hours', english: 'Real 2 HOURS', bangla: 'রিয়েল ২ ঘন্টা' },
    { id: 'real_3hours', english: 'Real 3 HOURS', bangla: 'রিয়েল ৩ ঘন্টা' },
    { id: 'real_fullnight', english: 'Real FULL NIGHT', bangla: 'রিয়েল ফুল নাইট' },
  ];

  const SERVICES_FACECAM = [
    { id: 'facecam_30min', english: 'Face Cam 30 Minutes', bangla: 'ফেস ক্যাম ৩০ মিনিট' },
    { id: 'facecam_1hour', english: 'Face Cam 1 HOUR', bangla: 'ফেস ক্যাম ১ ঘন্টা' },
    { id: 'facecam_2hours', english: 'Face Cam 2 HOURS', bangla: 'ফেস ক্যাম ২ ঘন্টা' },
  ];

  const SERVICES_LIVETOGETHER = [
    { id: 'livetogether_2day', english: 'Live Together 2 Days', bangla: 'লিভ টুগেদার ২ দিন' },
    { id: 'livetogether_7day', english: 'Live Together 7 Days', bangla: 'লিভ টুগেদার ৭ দিন' },
    { id: 'livetogether_15day', english: 'Live Together 15 Days', bangla: 'লিভ টুগেদার ১৫ দিন' },
    { id: 'livetogether_1month', english: 'Live Together 1 Month', bangla: 'লিভ টুগেদার ১ মাস' },
  ];

  // Expanded fields
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '', // Primary Phone Number
    whatsapp: '', // WhatsApp Number
    telegram: '', // Telegram username/handle
    location: '', // Operational City Area
    height: "5'4\"",
    complexion: 'Fair',
    weight: '',
    bust: '',
    waist: '',
    hip: '',
    remunerationRate: '',
    languages: 'English, Bengali',
    details: '',
    
    // Male and Donor extra fields
    bloodGroup: '',
    education: '',
    spermCount: '',
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Payment states for Model Registration (৳3,000 Fee)
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [payeePhone, setPayeePhone] = useState('');
  const [paymentTrx, setPaymentTrx] = useState('');
  const [paymentCopied, setPaymentCopied] = useState(false);
  const [tempComp, setTempComp] = useState<Companion | null>(null);

  const paymentGateways = [
    {
      id: 'bk_reg',
      name: 'bKash Personal',
      method: 'BKASH',
      number: '01758-293847',
      instructions: 'দয়া করে এই bKash পার্সোনাল নম্বরে "Send Money" করুন।',
    },
    {
      id: 'ng_reg',
      name: 'Nagad Personal',
      method: 'NAGAD',
      number: '01923-456789',
      instructions: 'দয়া করে এই Nagad পার্সোনাল নম্বরে "Send Money" করুন।',
    },
    {
      id: 'rk_reg',
      name: 'Rocket Personal',
      method: 'ROCKET',
      number: '01844-332211',
      instructions: 'দয়া করে এই Rocket পার্সোনাল নম্বরে "Send Money" করুন।',
    }
  ];

  const [selectedGateway, setSelectedGateway] = useState(paymentGateways[0]);

  // Sync state with initialType if modal reopens
  React.useEffect(() => {
    if (initialType) {
      setType(initialType);
    }
    setSubmitted(false);
    setValidationError(null);
    setShowPaymentScreen(false);
    setPayeePhone('');
    setPaymentTrx('');
    setTempComp(null);
    setSelectedGateway(paymentGateways[0]);
  }, [initialType, isOpen]);

  // Automatically scroll modal container back to top on any step/tab/error change
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const container = document.getElementById('join-modal-container');
        if (container) {
          container.scrollTop = 0;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, type, showPaymentScreen, submitted, validationError]);

  if (!isOpen) return null;

  // Handle Contiguous 4 Pictures Add
  const handleAddPicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPictures(prev => [...prev, reader.result as string].slice(0, 4));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = (index: number) => {
    setPictures(prev => prev.filter((_, i) => i !== index));
  };

  const handleNidChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'front') {
          setNidFront(reader.result as string);
        } else {
          setNidBack(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeNid = (side: 'front' | 'back') => {
    if (side === 'front') {
      setNidFront(null);
    } else {
      setNidBack(null);
    }
  };

  const handleToggleService = (englishName: string) => {
    let updated: string[];
    if (selectedServices.includes(englishName)) {
      updated = selectedServices.filter(s => s !== englishName);
    } else {
      updated = [...selectedServices, englishName];
    }
    setSelectedServices(updated);
    setFormData(prev => ({ ...prev, details: updated.join(', ') }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Common validations
    if (!formData.name.trim()) {
      setValidationError('Full Name is required.');
      return;
    }
    if (!formData.age.trim()) {
      setValidationError('Age is required.');
      return;
    }
    if (!formData.phone.trim()) {
      setValidationError('Contact Phone Number is required.');
      return;
    }

    // Model specific rich validation (Female or Male)
    if (type === 'female' || type === 'male') {
      if (!formData.whatsapp.trim()) {
        setValidationError('WhatsApp number is required for Model registration.');
        return;
      }
      if (!formData.telegram.trim()) {
        setValidationError('Telegram Username is mandatory / টেলিগ্রাম ইউজারনেম (@username) অত্যন্ত বাধ্যতামূলক।');
        return;
      }
      if (!formData.weight.trim()) {
        setValidationError('Body Weight is required.');
        return;
      }
      // Only Female models require chest/waist/hip measurements
      if (type === 'female') {
        if (!formData.bust.trim() || !formData.waist.trim() || !formData.hip.trim()) {
          setValidationError('Full body measurements (Bust, Waist, Hip) are required.');
          return;
        }
      }
      if (pictures.length < 4) {
        setValidationError('Please upload exactly 4 high-quality portfolio photos.');
        return;
      }
      if (!nidFront || !nidBack) {
        setValidationError('Please upload both the front and back sides of your NID Card.');
        return;
      }
      if (!selfie) {
        setValidationError('Verification Selfie is mandatory / সেলফি ভেরিফিকেশন ছবি আপলোড করা বাধ্যতামূলক।');
        return;
      }
    }

    if (type === 'donor') {
      if (!formData.bloodGroup.trim()) {
        setValidationError('Blood Group is required for Sperm Donor Registration / রক্তের গ্রুপ আবশ্যক।');
        return;
      }
      if (!formData.spermCount.trim()) {
        setValidationError('Sperm Count Report is required / স্পার্ম কাউন্ট রিপোর্ট আবশ্যক।');
        return;
      }
    }

    if (!formData.details || formData.details.trim() === '') {
      let errorMsg = '';
      if (type === 'donor') {
        errorMsg = 'Please specify your Health & Body Vitals detail.';
      } else if (type === 'female') {
        errorMsg = 'Please select what service you can provide / আপনি কী সার্ভিস দিতে পারবেন তা নির্বাচন করুন।';
      } else {
        errorMsg = 'Please describe your specialty service / বায়ো এবং অভিজ্ঞতা লিখুন।';
      }
      setValidationError(errorMsg);
      return;
    }

    // Construct and dispatch Companion object to appear in Admin panel
    const newComp: Companion = {
      id: `comp-app-${Date.now()}`,
      name: formData.name.trim(),
      tag: 'Class REGULAR',
      badge: 'REGULAR',
      age: Number(formData.age) || 22,
      height: formData.height || "5'4\"",
      bodyColor: formData.complexion || 'Fair Skin',
      weight: formData.weight || '',
      bust: formData.bust || '',
      waist: formData.waist || '',
      hip: formData.hip || '',
      languages: formData.languages.split(',').map(s => s.trim()).filter(Boolean),
      specialty: formData.details.trim() || 'ক্যারিয়ার হিসেবে পেশাদার রয়্যাল ক্যাটাগরি পোর্টালে যুক্ত হওয়ার চমৎকার অভিজ্ঞতা অর্জন করতে ইচ্ছুক।',
      rate: 8000,
      city: formData.location || 'DHAKA',
      image: pictures[0] || (type === 'male'
        ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600'
        : type === 'donor'
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'),
      category: type === 'female' ? 'Female Model' : type === 'male' ? 'Male Model' : 'Sperm Donor',
      status: 'Pending',
      phone: formData.phone.trim() || formData.whatsapp.trim() || 'N/A',
      email: type === 'female' ? `${formData.name.toLowerCase().replace(/\s+/g, '')}@bodytouch-partner.com` : 'code@bodytouch.com',
      bloodGroup: type === 'donor' ? formData.bloodGroup.trim() : undefined,
      spermCount: type === 'donor' ? formData.spermCount.trim() : undefined,
      nidFront: nidFront || undefined,
      nidBack: nidBack || undefined,
      selfie: selfie || undefined,
      telegram: formData.telegram.trim() || undefined,
    };

    onAddCompanion?.(newComp); // Add to join list in Admin panel immediately!
    setTempComp(newComp);
    setShowPaymentScreen(true);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      age: '',
      phone: '',
      whatsapp: '',
      telegram: '',
      location: '',
      height: "5'4\"",
      complexion: 'Fair',
      weight: '',
      bust: '',
      waist: '',
      hip: '',
      remunerationRate: '',
      languages: 'English, Bengali',
      details: '',
      bloodGroup: '',
      education: '',
      spermCount: '',
    });
    setPictures([]);
    setNidFront(null);
    setNidBack(null);
    setSelfie(null);
    setSelectedServices([]);
    setValidationError(null);
    setShowPaymentScreen(false);
    setPayeePhone('');
    setPaymentTrx('');
    setTempComp(null);
    setSelectedGateway(paymentGateways[0]);
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', duration: 0.5 }}
        id="join-modal-container"
        className="relative w-full max-w-xl bg-[#0c0d12] border border-[#ac843c]/35 rounded-3xl p-5 sm:p-6 overflow-y-auto max-h-[92vh] shadow-2xl z-10 gold-breathing-glow text-[#f3ecdb]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-[#dbaa61] transition p-2 hover:bg-slate-900 rounded-full cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5 border-b border-[#ac843c]/30 pb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-[#dbaa61] animate-pulse" />
            <h2 className="text-2xl font-black uppercase tracking-wider font-mono text-[#dbaa61]">
              {type === 'female' && 'Female Model Registry'}
              {type === 'male' && 'Male Model Registry'}
              {type === 'donor' && 'Sperm Donor Registry'}
            </h2>
          </div>
          <p className="text-[13px] text-slate-100 font-bold font-sans">
            {type === 'female' && 'Premium database application for high-class companion dispatching'}
            {type === 'male' && 'Register to join our elite male companions dispatch database'}
            {type === 'donor' && 'Register to join our highly vetted premium sperm donor network'}
          </p>
        </div>

        {validationError && (
          <div className="bg-rose-950/80 border-2 border-rose-500 p-4 rounded-xl mb-4 text-xs font-black text-rose-200 flex items-center gap-2 animate-shake">
            <span className="w-25 h-25 rounded-full bg-rose-500 animate-ping inline-block" />
            {validationError}
          </div>
        )}

        {!submitted ? (
          showPaymentScreen ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5 text-left"
            >
              <div className="bg-[#ac843c]/15 border border-[#ac843c]/40 rounded-2xl p-4 text-center space-y-1 bg-zinc-950/95">
                <span className="text-[12px] text-[#dbaa61] font-black uppercase tracking-widest block font-mono">
                  SECURITY SECURED DIRECTORY REGISTRATION
                </span>
                <h3 className="text-2xl font-black text-white font-mono flex items-center justify-center gap-1.5 mt-1.5 font-sans">
                  REGISTRATION FEE: <span className="text-[#dbaa61]">৳{registrationFee.toLocaleString()} BDT</span>
                </h3>
                <p className="text-xs text-slate-100 font-bold leading-relaxed font-sans">
                  মডেল তালিকাভুক্তির জন্য {registrationFee.toLocaleString()} টাকা ওয়ান-টাইম সিকিউরিটি ভেরিফিকেশন ফি প্রযোজ্য।
                </p>
              </div>

              {/* Gateway Switches */}
              <div className="space-y-1.5">
                <span className="block text-xs text-slate-200 font-black uppercase tracking-widest pl-1 font-mono">
                  Select payment gateway (গেটওয়ে সিলেক্ট করুন):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {paymentGateways.map((g) => {
                    const isSelected = selectedGateway.id === g.id;
                    let bgBtn = '';
                    if (isSelected) {
                      if (g.method === 'BKASH') bgBtn = 'bg-[#e2125d] border-[#e2125d] text-white ring-2 ring-emerald-450';
                      else if (g.method === 'NAGAD') bgBtn = 'bg-[#f15a22] border-[#f15a22] text-white auto-glow-orange ring-2 ring-amber-450';
                      else bgBtn = 'bg-[#8c3494] border-[#8c3494] text-white ring-2 ring-purple-450';
                    } else {
                      bgBtn = 'bg-[#0b0c14] border-[#ac843c]/30 text-slate-200 hover:border-[#dbaa61] hover:text-white';
                    }

                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGateway(g);
                        }}
                        className={`py-3.5 px-2 rounded-xl border text-[12px] font-black uppercase tracking-wider transition duration-250 cursor-pointer ${bgBtn}`}
                      >
                        {g.method === 'BKASH' && 'bKash'}
                        {g.method === 'NAGAD' && 'Nagad'}
                        {g.method === 'ROCKET' && 'Rocket'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number and instructions copied block */}
              <div className="bg-[#0b0c14] border-2 border-[#ac843c]/40 rounded-2xl p-4 space-y-3 relative">
                <div className="space-y-1">
                  <span className="text-xs text-slate-200 font-bold font-mono tracking-wider block uppercase">
                    {selectedGateway.name} Mobile Directory Number:
                  </span>
                  <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5">
                    <span className="text-base font-black font-mono text-emerald-400 tracking-widest">
                      {selectedGateway.number}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const cleanNum = selectedGateway.number.replace(/[^0-9]/g, '');
                        navigator.clipboard.writeText(cleanNum);
                        setPaymentCopied(true);
                        setTimeout(() => setPaymentCopied(false), 2000);
                      }}
                      className="text-xs text-cyan-300 font-mono tracking-wider font-extrabold hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                    >
                      {paymentCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-450 stroke-[3]" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-cyan-300" />
                          Copy Number
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-white leading-relaxed pl-1 font-semibold">
                  <span className="text-[#facc15] font-extrabold">{selectedGateway.instructions}</span>
                  <p className="text-[11px] text-slate-200 italic mt-0.5 font-bold font-sans">
                    Send exactly ৳{registrationFee.toLocaleString()} BDT to the number above to authenticate your portfolio.
                  </p>
                </div>
              </div>

              {/* Payer Account and TrxID Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#dbaa61] font-black">
                    PAYER PHONE NUMBER / সেন্ডার নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01712345678"
                    value={payeePhone}
                    onChange={(e) => setPayeePhone(e.target.value)}
                    className="w-full bg-[#0d0e17] border border-[#ac843c]/40 focus:border-[#dbaa61] text-sm text-white rounded-xl px-4 py-3.5 font-mono focus:outline-none placeholder:text-slate-400 font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[#dbaa61] font-black">
                    TRANSACTION ID (TRXID) / লেনদেন আইডি *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9F8A8K829J"
                    value={paymentTrx}
                    onChange={(e) => setPaymentTrx(e.target.value)}
                    className="w-full bg-[#0d0e17] border border-[#ac843c]/40 focus:border-[#dbaa61] text-sm text-white rounded-xl px-4 py-3.5 font-mono uppercase focus:outline-none placeholder:text-slate-400 font-bold"
                  />
                </div>
              </div>

              {/* Payment Verification Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    if (!payeePhone.trim() || payeePhone.trim().length < 10) {
                      setValidationError('Please enter a valid Sender Mobile Number.');
                      return;
                    }
                    if (!paymentTrx.trim() || paymentTrx.trim().length < 8) {
                      setValidationError('Transaction ID (TrxID) must be at least 8 characters.');
                      return;
                    }

                    // Success block: finalize registration entry
                    if (tempComp && onAddCompanion) {
                      const paidComp: Companion = {
                        ...tempComp,
                        specialty: `${tempComp.specialty}\n\n💳 [REGISTRATION FEE PAID]\nAmount: ৳${registrationFee.toLocaleString()} BDT\nGateway: ${selectedGateway.name}\nAccount: ${payeePhone}\nTrxID: ${paymentTrx.toUpperCase()}`
                      };
                      onAddCompanion(paidComp);
                    }
                    setSubmitted(true);
                  }}
                  className="w-full p-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs tracking-widest uppercase rounded-xl transition duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                  Verify & Confirm ৳{registrationFee.toLocaleString()} Payment
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setShowPaymentScreen(false);
                  }}
                  className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-[#ac843c]/40 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer text-center"
                >
                  Back & Edit Profile Details
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* PRIMARY ROW: Name & Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#dbaa61] font-black mb-1.5">
                      Companion Name * / নাম
                    </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titli"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-[#f3ecdb] rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#dbaa61] font-black mb-1.5">
                    Age * / বয়স
                  </label>
                  <input
                    type="number"
                    required
                    min="18"
                    max="45"
                    placeholder="e.g. 22"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-[#f3ecdb] rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* MODEL CHARACTERISTICS SPECIFIC ROWS */}
              {(type === 'female' || type === 'male') && (
                <div className="space-y-4 pt-2.5 border-t border-[#ac843c]/25">
                  {/* Height & Complexion & Weight */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1">
                        Height * / উচ্চতা
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5ft 5in"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-3 py-3 font-bold focus:outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1">
                        Complexion *
                      </label>
                      <select
                        value={formData.complexion}
                        onChange={(e) => setFormData({ ...formData, complexion: e.target.value })}
                        className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-3 py-3 font-bold focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="Fair">Fair</option>
                        <option value="Light">Light</option>
                        <option value="Medium">Medium</option>
                        <option value="Dark">Dark</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1">
                        Weight * / ওজন
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 52 kg"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-3 py-3 font-bold focus:outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Body Vitals: Bust, Waist, Hip (Female only!) */}
                  {type === 'female' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1">
                          Bust / স্তন (inch) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 34"
                          value={formData.bust}
                          onChange={(e) => setFormData({ ...formData, bust: e.target.value })}
                          className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-3 py-3 font-bold focus:outline-none transition-all text-center placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1">
                          Waist / কোমর *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 26"
                          value={formData.waist}
                          onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                          className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-3 py-3 font-bold focus:outline-none transition-all text-center placeholder:text-slate-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1">
                          Hip / নিতম্ব *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="e.g. 36"
                          value={formData.hip}
                          onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                          className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-3 py-3 font-bold focus:outline-none transition-all text-center placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Location Area (Full width now that Hourly Remuneration is removed) */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#dbaa61] font-black mb-1.5">
                      Operational City Area *
                    </label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-[#f3ecdb] rounded-xl px-3 py-3 font-bold focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="">Select Area / এলাকা নির্বাচন করুন</option>
                      {structuredCities && structuredCities.length > 0 ? (
                        structuredCities.map((p) => (
                          <optgroup key={p.id} label={`${p.name.toUpperCase()} (জেলা/শহর)`}>
                            {p.subAreas.map((sub) => (
                              <option key={`${sub}, ${p.name}`} value={`${sub}, ${p.name}`}>
                                {sub.toUpperCase()} ({p.name.toUpperCase()})
                              </option>
                            ))}
                            {p.subAreas.length === 0 && (
                              <option value={p.name.toUpperCase()}>{p.name.toUpperCase()}</option>
                            )}
                          </optgroup>
                        ))
                      ) : (
                        (cities && cities.length > 0 ? cities : [
                          'DHAKA METROPOLIS',
                          'BANANI / GULSHAN',
                          'UTTARA / MIRPUR',
                          'CHATTOGRAM CITY',
                          'SYLHET OVERSEAS'
                        ]).map((city) => (
                          <option key={city} value={city.toUpperCase()}>
                            {city.toUpperCase()}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Languages */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1">
                      Languages spoken (comma separated) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="English, Bengali, Hindi"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-3 py-3 font-bold focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* SPERM DONOR CONFIGURATION SECTION */}
              {type === 'donor' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1.5">
                      Operational Area *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dhaka, Banani"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-4 py-3.5 font-bold placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1.5">
                      Blood Group *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. O+ / B+"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-4 py-3.5 font-bold placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-200 font-extrabold mb-1.5">
                      Sperm Count Report *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 85 Million/ml"
                      value={formData.spermCount}
                      onChange={(e) => setFormData({ ...formData, spermCount: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-4 py-3.5 font-bold placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* TWO CONTACT NUMBERS: WhatsApp Number and Phone Number */}
              <div className="border-t border-[#ac843c]/25 pt-4 space-y-3">
                <p className="text-xs font-mono uppercase text-[#dbaa61] font-black tracking-wider">
                  Verified Communications Channels / যোগাযোগের তথ্য
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#dbaa61] font-mono uppercase tracking-wider mb-1 font-bold">
                      Primary Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +880 1711-XXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-[#f3ecdb] rounded-xl px-3 py-3 font-mono font-bold focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#dbaa61] font-mono uppercase tracking-wider mb-1 font-bold">
                      WhatsApp Number / Whatsapp নম্বর *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +880 19XXXXXXXX"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-[#f3ecdb] rounded-xl px-3 py-3 font-mono font-bold focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#dbaa61] font-mono uppercase tracking-wider mb-1 font-bold">
                      Telegram Username / টেলিগ্রাম হ্যান্ডেল *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. @username_handle"
                      value={formData.telegram}
                      onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-[#f3ecdb] rounded-xl px-3 py-3 font-mono font-bold focus:outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* MANDATORY PHOTO UPLOAD SECTION FOR MODELS */}
              {(type === 'female' || type === 'male') && (
                <div className="border-t border-[#ac843c]/25 pt-4 space-y-3">
                  <div>
                    <p className="text-xs font-mono uppercase text-[#dbaa61] font-black tracking-wider">
                      Model Portfolio Photos / ৪ টি ছবি আপলোড করুন
                    </p>
                    <p className="text-xs text-slate-200 font-bold mt-1.5">
                      Upload exactly **4 high resolution profile photos** (Clear face and body visible)
                    </p>
                  </div>

                  {/* 4 Image Upload slots Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((slotIdx) => {
                      const imageSrc = pictures[slotIdx];
                      const isClickableUpload = slotIdx === pictures.length;
                      const isLocked = slotIdx > pictures.length;

                      if (imageSrc) {
                        return (
                          <div key={slotIdx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[#dbaa61]/55 group bg-slate-950">
                            <img src={imageSrc} className="w-full h-full object-cover" alt={`Portfolio ${slotIdx + 1}`} referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => removePicture(slotIdx)}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-500 rounded-full p-1.5 cursor-pointer text-white shadow-md transform scale-90 group-hover:scale-100 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1.5 left-1.5 bg-black/80 px-1.5 text-[9px] font-mono font-bold text-slate-100 rounded leading-none py-1">
                              Pic {slotIdx + 1}
                            </span>
                          </div>
                        );
                      }

                      if (isClickableUpload) {
                        return (
                          <label key={slotIdx} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-[#dbaa61]/45 hover:border-[#dbaa61] hover:bg-slate-900/60 cursor-pointer rounded-xl transition-all p-1 text-center bg-[#0e101a]">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAddPicture}
                              className="hidden"
                            />
                            <Camera className="w-5 h-5 text-[#dbaa61] mb-1 opacity-90" />
                            <span className="text-[10px] text-[#dbaa61] font-mono font-bold leading-tight">
                              Upload<br />Pic {slotIdx + 1}
                            </span>
                          </label>
                        );
                      }

                      return (
                        <div key={slotIdx} className="aspect-square flex flex-col items-center justify-center border border-dashed border-slate-700 rounded-xl bg-slate-950/40 opacity-50">
                          <span className="text-[10px] text-slate-500 font-mono font-bold">
                            Pic {slotIdx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NID CARD UPLAOD SECTION */}
              {(type === 'female' || type === 'male') && (
                <div className="border-t border-[#ac843c]/25 pt-4 space-y-3">
                  <div>
                    <p className="text-xs font-mono uppercase text-[#dbaa61] font-black tracking-wider">
                      ID Document Verification / এনআইডি কার্ড ভেরিফিকেশন
                    </p>
                    <p className="text-xs text-slate-200 font-bold mt-1.5">
                      Upload clear photos of both sides of your National ID Card to verify age and genuine identity.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Front Side */}
                    <div>
                      <p className="text-[11px] text-slate-200 font-extrabold mb-1.5 uppercase font-mono tracking-wider">NID Front Side * / সামনের দিক</p>
                      {nidFront ? (
                        <div className="relative h-24 rounded-xl overflow-hidden border-2 border-[#dbaa61]/55 bg-slate-950">
                          <img src={nidFront} className="w-full h-full object-cover" alt="NID Front" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => removeNid('front')}
                            className="absolute top-1.5 right-1.5 bg-red-650 hover:bg-red-500 rounded-full p-1.5 cursor-pointer text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-[#dbaa61]/45 hover:border-[#dbaa61] hover:bg-slate-900/60 cursor-pointer rounded-xl transition-all text-center bg-[#0e101a]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleNidChange(e, 'front')}
                            className="hidden"
                          />
                          <UploadCloud className="w-6 h-6 text-[#dbaa61] mb-1 opacity-95" />
                          <span className="text-[11px] text-[#dbaa61] font-bold font-mono">Upload Front</span>
                        </label>
                      )}
                    </div>

                    {/* Back Side */}
                    <div>
                      <p className="text-[11px] text-slate-200 font-extrabold mb-1.5 uppercase font-mono tracking-wider">NID Back Side * / পিছনের দিক</p>
                      {nidBack ? (
                        <div className="relative h-24 rounded-xl overflow-hidden border-2 border-[#dbaa61]/55 bg-slate-950">
                          <img src={nidBack} className="w-full h-full object-cover" alt="NID Back" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => removeNid('back')}
                            className="absolute top-1.5 right-1.5 bg-red-650 hover:bg-red-500 rounded-full p-1.5 cursor-pointer text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-[#dbaa61]/45 hover:border-[#dbaa61] hover:bg-slate-900/60 cursor-pointer rounded-xl transition-all text-center bg-[#0e101a]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleNidChange(e, 'back')}
                            className="hidden"
                          />
                          <UploadCloud className="w-6 h-6 text-[#dbaa61] mb-1 opacity-95" />
                          <span className="text-[11px] text-[#dbaa61] font-bold font-mono">Upload Back</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Selfie Verification Block - Mandatory */}
                  <div className="pt-1.5">
                    <p className="text-[11px] text-slate-200 font-extrabold mb-1.5 uppercase font-mono tracking-wider">
                      Live Selfie Verification * / ভেরিফিকেশন সেলফি ছবি (বাধ্যতামূলক)
                    </p>
                    {selfie ? (
                      <div className="relative h-24 rounded-xl overflow-hidden border-2 border-[#dbaa61]/55 bg-slate-950">
                        <img src={selfie} className="w-full h-full object-cover" alt="Verification Selfie" referrerPolicy="no-referrer" />
                        <button
                          type="button"
                          onClick={() => setSelfie(null)}
                          className="absolute top-1.5 right-1.5 bg-red-650 hover:bg-red-500 rounded-full p-1.5 cursor-pointer text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-[#dbaa61]/45 hover:border-[#dbaa61] hover:bg-slate-900/60 cursor-pointer rounded-xl transition-all text-center bg-[#0e101a] px-3.5 py-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSelfie(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                        <Camera className="w-5 h-5 text-[#dbaa61] mb-1 opacity-95" />
                        <span className="text-[11px] text-[#dbaa61] font-bold font-mono">Upload Live Selfie</span>
                        <span className="text-[8.5px] text-slate-400 leading-tight font-sans">
                          সেলফি ভেরিফিকেশন ছবি আপলোড করা বাধ্যতামূলক / Selfie verification is mandatory
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Apni ki service dite parben / What services can you provide */}
              <div className="border-t border-[#ac843c]/25 pt-4">
                {type === 'female' ? (
                  <div className="space-y-6">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-200 font-black mb-1.5 label-mono-white">
                      APNI KI SERVICE DITE PARBEN? / WHAT SERVICES CAN YOU PROVIDE? *
                    </label>
                    
                    {/* Real Services Category */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 border-b border-[#ac843c]/30 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#dbaa61]" />
                        <span className="text-xs font-mono font-black uppercase tracking-wider text-[#dbaa61]">
                          Real Services / রিয়েল সার্ভিসসমূহ
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                        {SERVICES_REAL.map((srv) => {
                          const isSelected = selectedServices.includes(srv.english);
                          return (
                            <div
                              key={srv.id}
                              onClick={() => handleToggleService(srv.english)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#ac843c]/20 to-[#dbaa61]/30 border-[#dbaa61] text-[#f3ecdb]'
                                  : 'bg-[#0e101a] border-[#dbaa61]/35 text-slate-200 hover:border-[#dbaa61] hover:text-white'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#dbaa61] border-[#dbaa61] text-black'
                                    : 'bg-[#030303] border-[#ac843c]/40'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 stroke-[4.5] text-black" />
                                )}
                              </div>
                              <div className="leading-tight">
                                <span className="text-sm font-extrabold block text-white">
                                  {srv.english}
                                </span>
                                <span className="text-xs text-[#dbaa61] font-bold block mt-0.5">
                                  {srv.bangla}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Face Cam Services Category */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 border-b border-[#ac843c]/30 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#dbaa61]" />
                        <span className="text-xs font-mono font-black uppercase tracking-wider text-[#dbaa61]">
                          Face Cam Video / ফেস ক্যাম ভিডিও
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                        {SERVICES_FACECAM.map((srv) => {
                          const isSelected = selectedServices.includes(srv.english);
                          return (
                            <div
                              key={srv.id}
                              onClick={() => handleToggleService(srv.english)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#ac843c]/20 to-[#dbaa61]/30 border-[#dbaa61] text-[#f3ecdb]'
                                  : 'bg-[#0e101a] border-[#dbaa61]/35 text-slate-200 hover:border-[#dbaa61] hover:text-white'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#dbaa61] border-[#dbaa61] text-black'
                                    : 'bg-[#030303] border-[#ac843c]/40'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 stroke-[4.5] text-black" />
                                )}
                              </div>
                              <div className="leading-tight">
                                <span className="text-sm font-extrabold block text-white">
                                  {srv.english}
                                </span>
                                <span className="text-xs text-[#dbaa61] font-bold block mt-0.5">
                                  {srv.bangla}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Together Category */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 border-b border-[#ac843c]/30 pb-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#dbaa61]" />
                        <span className="text-xs font-mono font-black uppercase tracking-wider text-[#dbaa61]">
                          Live Together / লিভ টুগেদার
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                        {SERVICES_LIVETOGETHER.map((srv) => {
                          const isSelected = selectedServices.includes(srv.english);
                          return (
                            <div
                              key={srv.id}
                              onClick={() => handleToggleService(srv.english)}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer select-none transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-[#ac843c]/20 to-[#dbaa61]/30 border-[#dbaa61] text-[#f3ecdb]'
                                  : 'bg-[#0e101a] border-[#dbaa61]/35 text-slate-200 hover:border-[#dbaa61] hover:text-white'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#dbaa61] border-[#dbaa61] text-black'
                                    : 'bg-[#030303] border-[#ac843c]/40'
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 stroke-[4.5] text-black" />
                                )}
                              </div>
                              <div className="leading-tight">
                                <span className="text-sm font-extrabold block text-white">
                                  {srv.english}
                                </span>
                                <span className="text-xs text-[#dbaa61] font-bold block mt-0.5">
                                  {srv.bangla}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : type === 'male' ? (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#dbaa61] font-black mb-1.5 label-mono-white">
                      Specialty Service Description / বায়ো এবং অভিজ্ঞতা *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about yourself, your services, previous companion works or specialties..."
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-4 py-3 font-bold focus:outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#dbaa61] font-black mb-1.5 label-mono-white">
                      Health & Body Vitals (Height, Weight, Habits) *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Tell us about yourself, your health stats, height, weight, physical vitals & family tree habit history..."
                      value={formData.details}
                      onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                      className="w-full bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-sm text-white rounded-xl px-4 py-3 font-bold focus:outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Security Assurance */}
              <div className="bg-[#181510] border-2 border-[#ac843c]/60 p-4 rounded-xl space-y-1.5 text-xs text-slate-100 leading-relaxed font-bold shadow-md">
                <p className="font-black text-[#dbaa61] flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  MILITARY-GRADE DATA PRIVACY:
                </p>
                <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                  We guarantee absolute non-disclosure. All document pictures, names, and contact channels are encrypted end-to-end and deleted permanently from the servers upon verification approval.
                </p>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                className="w-full p-4 mt-2 bg-gradient-to-r from-[#ac843c] to-[#dbaa61] hover:from-[#c5a15a] hover:to-[#e8c387] text-black font-black text-sm tracking-widest uppercase rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-98"
              >
                <Send className="w-4 h-4 shrink-0 text-black" />
                Submit Application For Verification
              </button>
            </form>
          </>
          )
        ) : (
          /* SUCCESS SCREEN */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-5"
          >
            <div className="mx-auto w-16 h-16 bg-[#dbaa61]/15 border-2 border-[#ac843c] rounded-full flex items-center justify-center animate-bounce">
              <Check className="w-8 h-8 text-[#dbaa61]" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-mono font-black uppercase text-[#dbaa61] tracking-wider animate-pulse">
                Registration Complete!
              </h3>
              <p className="text-sm text-slate-200 font-bold leading-relaxed max-w-sm mx-auto">
                Congratulations, <span className="text-white underline">{formData.name}</span>! Your <span className="text-[#dbaa61] uppercase">{type === 'donor' ? 'Sperm Donor' : `${type} Model`}</span> registry profile has been submitted successfully.
              </p>
            </div>

            {/* HIGHLY VISIBLE CUSTOM TELEGRAM THANK-YOU CARD */}
            <div className="bg-[#051a30] border-2 border-[#38bdf8] p-5 rounded-2xl text-left text-sm text-slate-100 space-y-3 font-bold leading-relaxed shadow-lg cyan-breathing-glow">
              <div className="flex items-center gap-2 border-b border-[#38bdf8]/35 pb-2">
                <Send className="w-5 h-5 text-[#38bdf8] rotate-45" />
                <span className="font-extrabold text-[#38bdf8] uppercase tracking-wider font-mono">Telegram Message Alert</span>
              </div>
              <p className="text-base text-white font-black leading-relaxed">
                Thank you for joining Body Touch. Please check your Telegram account, we have sent all details to your Telegram.
              </p>
              <p className="text-[12px] text-[#8fa0cc] font-medium leading-relaxed italic">
                বডি টাচে যোগদানের জন্য আপনাকে ধন্যবাদ। অনুগ্রহ করে আপনার টেলিগ্রাম অ্যাকাউন্টটি চেক করুন, আমরা আপনার টেলিগ্রামে সব বিস্তারিত তথ্য পাঠিয়েছি।
              </p>
            </div>

            <div className="bg-[#0e101a] border border-[#ac843c]/35 p-5 rounded-2xl text-left text-sm text-slate-200 space-y-3 font-bold leading-relaxed shadow-md">
              <div className="flex justify-between border-b border-[#ac843c]/20 pb-2">
                <span>Profile Type:</span>
                <span className="font-extrabold text-[#dbaa61] uppercase">{type === 'donor' ? 'Donor Core' : `${type} Companion Roster`}</span>
              </div>
              <div className="flex justify-between border-b border-[#ac843c]/20 pb-2">
                <span>Identity Verification:</span>
                <span className="font-black text-emerald-400 uppercase flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> SECURE / PENDING
                </span>
              </div>
              <div className="flex justify-between border-b border-[#ac843c]/20 pb-2">
                <span>Review Status:</span>
                <span className="font-black text-amber-400 uppercase animate-pulse">UNDER MANUAL INSPECTION</span>
              </div>
              <p className="pt-1 text-xs text-slate-350 font-semibold leading-relaxed">
                Our dispatch operations team will review your photos, dimensions, and NID credentials. If approved, we will contact you on <span className="font-bold text-[#dbaa61]">{formData.telegram}</span> (Telegram / WhatsApp) within 12 - 24 hours to schedule onboarding coordinates.
              </p>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/25 p-4 rounded-2xl flex items-center justify-between text-left gap-3.5">
              <div className="space-y-0.5">
                <span className="text-[9px] text-[#8ea5db] uppercase font-mono font-black tracking-widest block">
                  OFFICIAL HELPLINE SUPPORT
                </span>
                <p className="text-xs text-slate-100 font-bold leading-tight">
                  ক্যারিয়ার ভেরিফিকেশন হেল্পলাইনের জন্য আমাদের টেলিগ্রামে যোগাযোগ করুন:
                </p>
              </div>
              <a
                href={`https://t.me/${telegramHelpline.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5 rotate-45" />
                Helpline
              </a>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-4.5 bg-[#12100e] hover:bg-[#1f1912] border-2 border-[#ac843c] text-[#dbaa61] font-black text-sm tracking-widest uppercase rounded-xl transition duration-300 cursor-pointer shadow-md"
            >
              Back To Dashboard
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
