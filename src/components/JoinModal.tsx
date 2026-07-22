import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, User, Briefcase, Camera, Send, Check, Trash2, ShieldCheck, UploadCloud, Copy, Info, Phone, Mail, MessageSquare, Calendar, Ruler, Scale, MapPin, Languages, Activity, Droplet } from 'lucide-react';
import { Companion, ParentArea } from '../types';
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

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType: 'female' | 'male' | 'donor' | null;
  cities?: string[];
  structuredCities?: ParentArea[];
  onAddCompanion?: (companion: Companion) => void;
  telegramHelpline?: string;
  registrationFee?: number;
  registrationFeeMale?: number;
  registrationFeeSperm?: number;
}

export default function JoinModal({ 
  isOpen, 
  onClose, 
  initialType, 
  cities, 
  structuredCities,
  onAddCompanion, 
  telegramHelpline = 'BodyTouchSupport',
  registrationFee = 3000,
  registrationFeeMale = 3000,
  registrationFeeSperm = 3000
}: JoinModalProps) {
  const [type, setType] = useState<'female' | 'male' | 'donor'>(initialType || 'female');

  const currentFee = type === 'female'
    ? registrationFee
    : type === 'male'
      ? registrationFeeMale
      : registrationFeeSperm;
  
  // Custom states for files
  const [pictures, setPictures] = useState<string[]>([]);
  const [nidFront, setNidFront] = useState<string | null>(null);
  const [nidBack, setNidBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [idType, setIdType] = useState<'nid' | 'birth'>('nid');

  const SERVICES_REAL = [
    { id: 'real_1hour', english: 'Real 1 HOUR', bangla: 'Real 1 HOUR' },
    { id: 'real_2hours', english: 'Real 2 HOURS', bangla: 'Real 2 HOURS' },
    { id: 'real_3hours', english: 'Real 3 HOURS', bangla: 'Real 3 HOURS' },
    { id: 'real_fullnight', english: 'Real FULL NIGHT', bangla: 'Real FULL NIGHT' },
  ];

  const SERVICES_FACECAM = [
    { id: 'facecam_30min', english: 'Face Cam 30 Minutes', bangla: 'Face Cam 30 Minutes' },
    { id: 'facecam_1hour', english: 'Face Cam 1 HOUR', bangla: 'Face Cam 1 HOUR' },
    { id: 'facecam_2hours', english: 'Face Cam 2 HOURS', bangla: 'Face Cam 2 HOURS' },
  ];

  const SERVICES_TOUR = [
    { id: 'tour_2day', english: 'Tour 2 Days', bangla: 'Tour 2 Days' },
    { id: 'tour_7day', english: 'Tour 7 Days', bangla: 'Tour 7 Days' },
    { id: 'tour_15day', english: 'Tour 15 Days', bangla: 'Tour 15 Days' },
    { id: 'tour_1month', english: 'Tour 1 Month', bangla: 'Tour 1 Month' },
  ];

  // Expanded fields
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '', // Primary Phone Number
    whatsapp: '', // WhatsApp Number
    telegram: '', // Telegram username/handle
    email: '', // Email Address
    location: '', // Operational City Area
    height: '',
    complexion: '',
    weight: '',
    bust: '',
    waist: '',
    hip: '',
    remunerationRate: '',
    languages: '',
    details: '',
    
    // Male and Donor extra fields
    bloodGroup: '',
    education: '',
    spermCount: '',
    penisSize: '',
    durationTime: '',
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Telegram verification states
  const [otpCode, setOtpCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Payment states for Model Registration (৳3,000 Fee)
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [payeePhone, setPayeePhone] = useState('');
  const [paymentTrx, setPaymentTrx] = useState('');
  const [paymentCopied, setPaymentCopied] = useState(false);
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [paymentUploading, setPaymentUploading] = useState(false);
  const paymentFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [tempComp, setTempComp] = useState<Companion | null>(null);

  const [paymentStep, setPaymentStep] = useState<'select_gateway' | 'details'>('select_gateway');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [gatewaysList, setGatewaysList] = useState<any[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('bt_payment_gateways');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const active = parsed.filter((g: any) => g.isActive !== false);
          if (active.length > 0) {
            setGatewaysList(active);
            return;
          }
        }
      } catch (e) {
        // ignore
      }
    }
    setGatewaysList([
      {
        id: 'bk_reg',
        name: 'bKash Personal',
        method: 'BKASH',
        number: '01758-293847',
        instructions: 'Please perform a "Send Money" transaction to this bKash Personal number.',
      },
      {
        id: 'ng_reg',
        name: 'Nagad Personal',
        method: 'NAGAD',
        number: '01923-456789',
        instructions: 'Please perform a "Send Money" transaction to this Nagad Personal number.',
      },
      {
        id: 'rk_reg',
        name: 'Rocket Personal',
        method: 'ROCKET',
        number: '01844-332211',
        instructions: 'Please perform a "Send Money" transaction to this Rocket Personal number.',
      }
    ]);
  }, [isOpen, showPaymentScreen]);

  const [selectedGateway, setSelectedGateway] = useState<any>(null);

  React.useEffect(() => {
    if (gatewaysList.length > 0) {
      if (!selectedGateway || !gatewaysList.find(g => g.id === selectedGateway.id)) {
        setSelectedGateway(gatewaysList[0]);
      }
    }
  }, [gatewaysList, selectedGateway]);

  React.useEffect(() => {
    if (showPaymentScreen) {
      setPaymentStep('select_gateway');
      setDepositAmount(currentFee.toString());
      if (formData.phone) {
        setPayeePhone(formData.phone);
      }
    }
  }, [showPaymentScreen, currentFee, formData.phone]);

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
    setSelectedGateway(null);
    setOtpCode('');
    setEnteredOtp('');
    setShowOtpScreen(false);
    setIsSendingOtp(false);
    setIsCameraActive(false);
    setSelfie(null);
    setNidFront(null);
    setNidBack(null);
    setIdType('nid');
    setPictures([]);
  }, [initialType, isOpen]);

  // Live camera selfie capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setValidationError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      // Wait for element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setValidationError('Could not access your camera. Please allow camera permission in your browser to take a selfie.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSelfie = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setSelfie(dataUrl);
        stopCamera();
      }
    }
  };

  // Stop camera when modal closes or unmounts
  React.useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

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
      // Compress to maximum 800px width/height and 0.75 quality for rapid upload and tiny storage size
      compressImage(file, 800, 800, 0.75).then((compressedUrl) => {
        if (compressedUrl) {
          setPictures(prev => [...prev, compressedUrl].slice(0, 4));
        }
      });
    }
  };

  const removePicture = (index: number) => {
    setPictures(prev => prev.filter((_, i) => i !== index));
  };

  const handleNidChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      compressImage(file, 800, 800, 0.75).then((compressedUrl) => {
        if (compressedUrl) {
          if (side === 'front') {
            setNidFront(compressedUrl);
          } else {
            setNidBack(compressedUrl);
          }
        }
      });
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

  const executeSendTelegramOtpModel = async (code: string) => {
    setIsSendingOtp(true);
    
    const defaultBotToken = '7874983058:AAHshUqisKskj6D5-zZ7N0L-GCHV966L1Sg';
    const customBotToken = localStorage.getItem('bt_telegram_bot_token') || defaultBotToken;
    const token = localStorage.getItem('bt_telegram_bot_selection') === 'default' ? defaultBotToken : customBotToken;
    const chatId = localStorage.getItem('bt_telegram_group_id') || '-1002283928192';

    const text = `🔐 <b>[BODY TOUCH Model Registration OTP]</b>\n\n` +
                 `Applicant Name: <b>${formData.name}</b>\n` +
                 `Apply Category: <b>${type.toUpperCase()} MODEL</b>\n` +
                 `Phone: <code>${formData.phone}</code>\n` +
                 `Telegram ID: <b>${formData.telegram}</b>\n\n` +
                 `Verification Code:\n` +
                 `👉 <b>${code}</b> 👈\n\n` +
                 `Please enter this OTP in the model registration form to unlock key coordinates.`;

    try {
      await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId.trim(),
          text: text,
          parse_mode: 'HTML'
        })
      });
    } catch (teleErr) {
      console.error("Model Telegram OTP verification error:", teleErr);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 40) {
      setValidationError('Age must be between 13 and 40 years.');
      return;
    }
    if (!formData.phone.trim()) {
      setValidationError('Contact Phone Number is required.');
      return;
    }
    if (!formData.whatsapp.trim()) {
      setValidationError('WhatsApp Number is mandatory.');
      return;
    }
    if (!formData.email.trim()) {
      setValidationError('Email Address is mandatory.');
      return;
    }

    // Model specific rich validation (Female or Male)
    if (type === 'female' || type === 'male') {
      if (!formData.complexion) {
        setValidationError('Complexion is required.');
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
      // Only Male models require penisSize & durationTime
      if (type === 'male') {
        if (!formData.penisSize.trim()) {
          setValidationError('Penis Size / লিঙ্গের আকার উল্লেখ করা বাধ্যতামূলক।');
          return;
        }
        if (!formData.durationTime.trim()) {
          setValidationError('Duration Time / সহবাসের স্থায়িত্বকাল উল্লেখ করা বাধ্যতামূলক।');
          return;
        }
      }
      if (pictures.length < 4) {
        setValidationError('Please upload exactly 4 high-quality portfolio photos.');
        return;
      }
      if (!nidFront) {
        setValidationError('Please upload your NID Front or Birth Certificate.');
        return;
      }
      if (!selfie) {
        setValidationError('Verification Selfie is mandatory.');
        return;
      }
    }

    if (type === 'donor') {
      if (!formData.bloodGroup.trim()) {
        setValidationError('Blood Group is required for Sperm Donor Registration.');
        return;
      }
      if (!formData.spermCount.trim()) {
        setValidationError('Sperm Count Report is required.');
        return;
      }
    }

    if (type !== 'female' && (!formData.details || formData.details.trim() === '')) {
      let errorMsg = '';
      if (type === 'donor') {
        errorMsg = 'Please specify your Health & Body Vitals detail.';
      } else {
        errorMsg = 'Please describe your specialty service.';
      }
      setValidationError(errorMsg);
      return;
    }

    // OTP verification has been disabled as requested by user. Proceed directly to payment and companion registration logic.

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
      languages: (formData.languages || "English, Bengali").split(',').map(s => s.trim()).filter(Boolean),
      specialty: formData.details.trim() || 'Excited to build an outstanding professional modeling and companion career with BodyTouch.',
      rate: 8000,
      city: formData.location || 'DHAKA',
      image: pictures[0] || (type === 'male'
        ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600'
        : type === 'donor'
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'),
      category: type === 'female' ? 'Female Model' : type === 'male' ? 'Male Model' : 'Sperm Donor',
      status: 'Pending',
      phone: formData.phone.trim() || 'N/A',
      whatsapp: formData.whatsapp.trim() || undefined,
      email: formData.email.trim() || (type === 'female' ? `${formData.name.toLowerCase().replace(/\s+/g, '')}@bodytouch-partner.com` : 'code@bodytouch.com'),
      bloodGroup: type === 'donor' ? formData.bloodGroup.trim() : undefined,
      spermCount: type === 'donor' ? formData.spermCount.trim() : undefined,
      penisSize: type === 'male' ? (formData.penisSize.trim() || undefined) : undefined,
      durationTime: type === 'male' ? (formData.durationTime.trim() || undefined) : undefined,
      nidFront: nidFront || undefined,
      nidBack: nidBack || undefined,
      selfie: selfie || undefined,
      telegram: formData.telegram.trim() || undefined,
      recruiter: sessionStorage.getItem('bt_pending_model_ref') || localStorage.getItem('bt_pending_model_ref') || undefined,
      pictures: pictures,
    };

    onAddCompanion?.(newComp); // Add to join list in Admin panel immediately!
    setTempComp(newComp);
    if (type === 'female') {
      setSubmitted(true);
      setShowPaymentScreen(false);
    } else {
      setShowPaymentScreen(true);
    }
    setShowOtpScreen(false);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      age: '',
      phone: '',
      whatsapp: '',
      telegram: '',
      email: '',
      location: '',
      height: '',
      complexion: '',
      weight: '',
      bust: '',
      waist: '',
      hip: '',
      remunerationRate: '',
      languages: '',
      details: '',
      bloodGroup: '',
      education: '',
      spermCount: '',
      penisSize: '',
      durationTime: '',
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
    setSelectedGateway(null);
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
              {paymentStep === 'select_gateway' ? (
                <div className="space-y-6">
                  {/* Step 1: Select Payment Gateway */}
                  <div className="text-center space-y-1 mb-5">
                    <span className="text-[10px] font-black tracking-widest text-[#dbaa61] uppercase block font-mono">
                      SECURED SECURITY DEPOSIT
                    </span>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase font-sans">
                      Select Payment Gateway
                    </h3>
                  </div>

                  <p className="text-xs text-center text-slate-300 font-bold max-w-md mx-auto leading-relaxed">
                    Please select your preferred instant mobile financial service gateway to complete security authentication and secure your portfolio.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* bKash card */}
                    {gatewaysList.filter(g => g.method === 'BKASH').map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGateway(g);
                          setPaymentStep('details');
                        }}
                        className="group relative bg-gradient-to-b from-[#1e0a13] to-[#04060c] border border-[#e2125d]/35 hover:border-[#e2125d] rounded-2xl p-5 flex flex-col items-center text-center gap-3.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#e2125d]/10 hover:-translate-y-0.5 active:scale-98"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#e2125d] flex items-center justify-center text-white shadow-md shadow-[#e2125d]/30 group-hover:scale-105 transition-transform duration-300">
                          <BkashLogo className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="block text-sm font-black text-white uppercase font-sans tracking-wide">
                            BKASH
                          </span>
                          <span className="block text-[9.5px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider font-mono">
                            Send Money
                          </span>
                        </div>
                      </button>
                    ))}

                    {/* Nagad card */}
                    {gatewaysList.filter(g => g.method === 'NAGAD').map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGateway(g);
                          setPaymentStep('details');
                        }}
                        className="group relative bg-gradient-to-b from-[#1e0f0a] to-[#04060c] border border-[#f15a22]/35 hover:border-[#f15a22] rounded-2xl p-5 flex flex-col items-center text-center gap-3.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#f15a22]/10 hover:-translate-y-0.5 active:scale-98"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#f15a22] flex items-center justify-center text-white shadow-md shadow-[#f15a22]/30 group-hover:scale-105 transition-transform duration-300">
                          <NagadLogo className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="block text-sm font-black text-white uppercase font-sans tracking-wide">
                            NAGAD
                          </span>
                          <span className="block text-[9.5px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider font-mono">
                            Send Money
                          </span>
                        </div>
                      </button>
                    ))}

                    {/* Rocket card */}
                    {gatewaysList.filter(g => g.method === 'ROCKET').map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGateway(g);
                          setPaymentStep('details');
                        }}
                        className="group relative bg-gradient-to-b from-[#150a1d] to-[#04060c] border border-[#8c3494]/35 hover:border-[#8c3494] rounded-2xl p-5 flex flex-col items-center text-center gap-3.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#8c3494]/10 hover:-translate-y-0.5 active:scale-98"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#8c3494] flex items-center justify-center text-white shadow-md shadow-[#8c3494]/30 group-hover:scale-105 transition-transform duration-300">
                          <RocketLogo className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="block text-sm font-black text-white uppercase font-sans tracking-wide">
                            ROCKET
                          </span>
                          <span className="block text-[9.5px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider font-mono">
                            Send Money
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="text-center pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setValidationError(null);
                        setShowPaymentScreen(false);
                      }}
                      className="text-xs text-slate-400 font-black tracking-widest uppercase hover:text-white transition duration-200 cursor-pointer"
                    >
                      ← Back & Edit Profile Details
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  {/* Step 2: Allocate Wallet Funds (Matches Screenshot perfectly) */}
                  <div className="text-center space-y-1 mb-2">
                    <span className="text-[10px] font-black tracking-widest text-[#dbaa61] uppercase block font-mono">
                      SECURED SECURITY DEPOSIT
                    </span>
                    <h3 className="text-2xl font-black text-white tracking-tight font-sans">
                      Allocate Wallet Funds
                    </h3>
                  </div>

                  <div className="border-b border-[#ac843c]/15 pb-4 mb-4" />

                  {/* 1. SELECT GATEWAY DEPOSIT */}
                  <div className="space-y-2">
                    <span className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                      1. SELECT GATEWAY DEPOSIT
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {['BKASH', 'NAGAD', 'ROCKET'].map((method) => {
                        const isSelected = selectedGateway?.method === method;
                        const matchingGateway = gatewaysList.find(g => g.method === method);
                        
                        let activeStyles = '';
                        if (isSelected) {
                          if (method === 'BKASH') activeStyles = 'bg-[#e2125d] border-[#e2125d] text-white shadow-lg shadow-[#e2125d]/20 scale-[1.02]';
                          else if (method === 'NAGAD') activeStyles = 'bg-[#f15a22] border-[#f15a22] text-white shadow-lg shadow-[#f15a22]/20 scale-[1.02]';
                          else activeStyles = 'bg-[#8c3494] border-[#8c3494] text-white shadow-lg shadow-[#8c3494]/20 scale-[1.02]';
                        } else {
                          activeStyles = 'bg-[#030818]/60 border border-blue-900/35 text-slate-400 hover:border-slate-500 hover:text-slate-200';
                        }

                        return (
                          <button
                            key={method}
                            type="button"
                            disabled={!matchingGateway}
                            onClick={() => {
                              if (matchingGateway) {
                                setSelectedGateway(matchingGateway);
                              }
                            }}
                            className={`py-3.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 ${activeStyles}`}
                          >
                            {method === 'BKASH' && <BkashLogo className="w-3.5 h-3.5" />}
                            {method === 'NAGAD' && <NagadLogo className="w-3.5 h-3.5" />}
                            {method === 'ROCKET' && <RocketLogo className="w-3.5 h-3.5" />}
                            {method}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instruction banner with Copy Number */}
                  {selectedGateway && (
                    <div className="bg-[#030818]/60 border border-blue-900/35 rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 text-xs text-white">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">💸</span>
                        <p className="font-bold font-sans">
                          Please Send Money to:{' '}
                          <span className="text-emerald-400 font-mono tracking-wider">
                            {selectedGateway.number}
                          </span>{' '}
                          <span className="text-xs text-[#dbaa61] uppercase font-mono tracking-widest font-black pl-1">
                            ({selectedGateway.walletType || 'Personal'})
                          </span>
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const cleanNum = selectedGateway.number.replace(/[^0-9]/g, '');
                          navigator.clipboard.writeText(cleanNum);
                          setPaymentCopied(true);
                          setTimeout(() => setPaymentCopied(false), 2000);
                        }}
                        className="text-[10px] text-cyan-400 font-mono tracking-wider font-extrabold hover:text-cyan-300 flex items-center gap-1 cursor-pointer bg-slate-900/40 border border-slate-800 rounded-lg px-2.5 py-1"
                      >
                        {paymentCopied ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                  )}

                  {/* 2. DEPOSIT AMOUNT (৳) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                      2. DEPOSIT AMOUNT (৳)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5,000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all placeholder:text-slate-500 font-sans"
                    />
                  </div>

                  {/* 3. TRANSACTION ID (TRXID) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                      3. TRANSACTION ID (TRXID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="8-DIGIT ALPHANUMERIC CODE"
                      value={paymentTrx}
                      onChange={(e) => setPaymentTrx(e.target.value)}
                      className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all placeholder:text-slate-500 uppercase font-mono tracking-widest"
                    />
                  </div>

                  {/* 4. UPLOAD SCREENSHOT */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-slate-300 font-black uppercase tracking-widest pl-1 font-mono">
                      4. UPLOAD SCREENSHOT (OPTIONAL)
                    </label>
                    
                    <input
                      type="file"
                      ref={paymentFileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPaymentUploading(true);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPaymentScreenshot(reader.result as string);
                            setPaymentUploading(false);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />

                    {paymentScreenshot ? (
                      <div className="relative border border-emerald-500/35 rounded-xl overflow-hidden bg-[#030818]/60 p-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={paymentScreenshot} 
                            alt="Payment Proof" 
                            className="w-11 h-11 object-cover rounded border border-white/15"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider font-mono">Screenshot Attached</p>
                            <p className="text-[8px] text-slate-400 font-medium">Click trash icon to clear proof and upload again</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentScreenshot('')}
                          className="text-red-400 hover:text-red-300 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => paymentFileInputRef.current?.click()}
                        className="w-full bg-[#030818]/60 border-2 border-dashed border-blue-900/35 hover:border-[#dbaa61]/50 rounded-xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-slate-400 text-center"
                      >
                        <UploadCloud className="w-6 h-6 text-[#dbaa61]" />
                        <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider font-mono">
                          {paymentUploading ? 'Processing Screenshot...' : 'Upload Payment Screenshot'}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Confirm Button & Step back */}
                  <div className="space-y-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setValidationError(null);
                        
                        if (!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
                          setValidationError('Please enter a valid Deposit Amount.');
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
                            specialty: `${tempComp.specialty}\n\n💳 [REGISTRATION FEE PAID]\nAmount: ৳${Number(depositAmount).toLocaleString()} BDT\nGateway: ${selectedGateway.name}\nAccount: ${payeePhone}\nTrxID: ${paymentTrx.toUpperCase()}`,
                            selfie: paymentScreenshot || tempComp.selfie // Use selfie field to store payment proof screenshot
                          };
                          onAddCompanion(paidComp);
                        }
                        setSubmitted(true);
                      }}
                      className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-black text-xs tracking-widest uppercase rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 text-center"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      CONFIRM ALLOCATION
                    </button>

                    <div className="flex justify-between items-center px-1">
                      <button
                        type="button"
                        onClick={() => setPaymentStep('select_gateway')}
                        className="text-[10px] text-slate-400 hover:text-white font-bold tracking-wider uppercase transition cursor-pointer"
                      >
                        ← Change Gateway
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setValidationError(null);
                          setShowPaymentScreen(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white font-bold tracking-wider uppercase transition cursor-pointer"
                      >
                        Cancel Registration
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {showOtpScreen ? (
                  <div className="space-y-5 animate-fadeIn text-left pt-2">
                    <div className="p-4 rounded-xl border-2 border-[#dbaa61]/35 bg-[#1c1812]/92 text-center space-y-2">
                      <span className="text-[10px] text-[#dbaa61] font-black uppercase tracking-widest block font-mono">
                        MANDATORY TELEGRAM SECURITY VERIFICATION
                      </span>
                      <p className="text-xs text-zinc-300 leading-normal font-sans font-medium">
                        A 6-digit security verification OTP has been sent to your provided Telegram account <b>{formData.telegram}</b>. Please input the code below.
                      </p>
                    </div>

                    {validationError && (
                      <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl text-center">
                        {validationError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#dbaa61] font-black text-center">
                        6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="e.g. 529304"
                        className="w-full bg-[#0e101a] border-2 border-[#dbaa61]/35 rounded-xl py-3.5 text-center text-xl font-bold tracking-[0.25em] font-mono text-white focus:outline-none focus:border-[#dbaa61]"
                      />
                    </div>

                    <div className="flex gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowOtpScreen(false);
                          setEnteredOtp('');
                          setValidationError(null);
                        }}
                        className="flex-1 bg-[#151310] border border-white/5 hover:border-white/10 text-zinc-300 font-extrabold uppercase text-xs tracking-widest py-4 rounded-xl transition duration-200 flex items-center justify-center cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={enteredOtp.length !== 6 || isSendingOtp}
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-indigo-500 hover:from-emerald-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl transition duration-200 flex items-center justify-center shadow-lg cursor-pointer"
                      >
                        <span>{isSendingOtp ? 'SENDING...' : 'VERIFY & REGISTER'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* PRIMARY ROW: Name & Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                      Companion Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                      Age *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Calendar className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="number"
                        required
                        min="13"
                        max="40"
                        placeholder="13 - 40"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
              </div>

              {/* MODEL CHARACTERISTICS SPECIFIC ROWS */}
              {(type === 'female' || type === 'male') && (
                <div className="space-y-4 pt-2.5 border-t border-[#ac843c]/25">
                  {/* Height & Complexion & Weight */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                        Height *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Ruler className="w-4 h-4 text-[#dbaa61]/70" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={formData.height}
                          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                          style={{ paddingLeft: '2.5rem' }}
                          className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                        Complexion *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Sparkles className="w-4 h-4 text-[#dbaa61]/70" />
                        </div>
                        <select
                          value={formData.complexion}
                          onChange={(e) => setFormData({ ...formData, complexion: e.target.value })}
                          style={{ paddingLeft: '2.5rem' }}
                          className="w-full bg-[#030818] border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="" className="bg-[#030818] text-slate-400 font-sans font-bold">Select Complexion</option>
                          <option value="Fair" className="bg-[#030818] text-white font-sans font-bold">Fair</option>
                          <option value="Light" className="bg-[#030818] text-white font-sans font-bold">Light</option>
                          <option value="Medium" className="bg-[#030818] text-white font-sans font-bold">Medium</option>
                          <option value="Dark" className="bg-[#030818] text-white font-sans font-bold">Dark</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                        Weight *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Scale className="w-4 h-4 text-[#dbaa61]/70" />
                        </div>
                        <input
                          type="text"
                          required
                          placeholder=""
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          style={{ paddingLeft: '2.5rem' }}
                          className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Body Vitals: Bust, Waist, Hip (Female only!) */}
                  {type === 'female' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 text-center">
                          Bust (inch) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          placeholder=""
                          value={formData.bust}
                          onChange={(e) => setFormData({ ...formData, bust: e.target.value })}
                          className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-3 py-3.5 font-bold focus:outline-none transition-all text-center font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 text-center">
                          Waist (inch) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          placeholder=""
                          value={formData.waist}
                          onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                          className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-3 py-3.5 font-bold focus:outline-none transition-all text-center font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 text-center">
                          Hip (inch) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          placeholder=""
                          value={formData.hip}
                          onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                          className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-3 py-3.5 font-bold focus:outline-none transition-all text-center font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Male Model Specific Body Details */}
                  {type === 'male' && (
                    <div className="grid grid-cols-2 gap-4 pb-2">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                          Penis Size / লিঙ্গের আকার (ইঞ্চি) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 6.5 inch"
                          value={formData.penisSize}
                          onChange={(e) => setFormData({ ...formData, penisSize: e.target.value })}
                          className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                          Duration Time / সহবাসের স্থায়িত্বকাল *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 35-45 min"
                          value={formData.durationTime}
                          onChange={(e) => setFormData({ ...formData, durationTime: e.target.value })}
                          className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Location Area (Full width now that Hourly Remuneration is removed) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                      Operational City Area *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <MapPin className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <select
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818] border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="" className="bg-[#030818] text-white font-sans font-bold">Select Area</option>
                        {structuredCities && structuredCities.length > 0 ? (
                          structuredCities.map((p) => (
                            <optgroup key={p.id} label={`${p.name.toUpperCase()} (District/City)`} className="bg-[#030818] text-[#dbaa61] font-bold font-sans">
                              {p.subAreas.map((sub) => (
                                <option key={`${sub}, ${p.name}`} value={`${sub}, ${p.name}`} className="bg-[#030818] text-white font-sans font-bold">
                                  {sub.toUpperCase()} ({p.name.toUpperCase()})
                                </option>
                              ))}
                              {p.subAreas.length === 0 && (
                                <option value={p.name.toUpperCase()} className="bg-[#030818] text-white font-sans font-bold">{p.name.toUpperCase()}</option>
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
                            <option key={city} value={city.toUpperCase()} className="bg-[#030818] text-white font-sans font-bold">
                              {city.toUpperCase()}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Languages */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                      Languages spoken (comma separated) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Languages className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={formData.languages}
                        onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SPERM DONOR CONFIGURATION SECTION */}
              {type === 'donor' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-2">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                      Operational Area *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <MapPin className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                      Blood Group *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Droplet className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                      Sperm Count Report *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Activity className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder=""
                        value={formData.spermCount}
                        onChange={(e) => setFormData({ ...formData, spermCount: e.target.value })}
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Verified Communications Channels */}
              <div className="border-t border-[#ac843c]/25 pt-4 space-y-4">
                <p className="text-xs font-mono uppercase text-[#dbaa61] font-black tracking-wider">
                  Verified Communications Channels
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-sans">
                      Primary Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Phone className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder=""
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Telegram */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-sans flex justify-between">
                      <span>Telegram Username (Optional)</span>
                      <span className="text-emerald-400 text-[9px] font-black">OPTIONAL</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Send className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="text"
                        value={formData.telegram}
                        onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                        placeholder="e.g. @username"
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-sans">
                      WhatsApp Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <MessageSquare className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="tel"
                        required
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        placeholder=""
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1 font-sans">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-4 h-4 text-[#dbaa61]/70" />
                      </div>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder=""
                        style={{ paddingLeft: '2.5rem' }}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl pl-10 pr-4 py-3.5 font-bold focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* MANDATORY PHOTO UPLOAD SECTION FOR MODELS */}
              {(type === 'female' || type === 'male') && (
                <div className="border-t border-[#ac843c]/25 pt-4 space-y-3">
                  <div>
                    <p className="text-xs font-mono uppercase text-[#dbaa61] font-black tracking-wider">
                      Model Portfolio Photos
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
                            <Camera className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 text-[#dbaa61] mb-1 opacity-90" />
                            <span className="text-[8px] min-[380px]:text-[10px] text-[#dbaa61] font-mono font-bold leading-tight">
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

              {/* NID / BIRTH CERTIFICATE UPLOAD SECTION */}
              {(type === 'female' || type === 'male') && (
                <div className="border-t border-[#ac843c]/25 pt-4 space-y-3">
                  <div>
                    <p className="text-xs font-mono uppercase text-[#dbaa61] font-black tracking-wider flex justify-between">
                      <span>ID Document / Birth Certificate Verification</span>
                      <span className="text-[10px] text-emerald-400 font-extrabold font-sans">NID / BIRTH CERTIFICATE VERIFICATION</span>
                    </p>
                    <p className="text-[10.5px] text-slate-200 font-bold mt-1.5 leading-relaxed font-sans">
                      Select your ID type and upload a clear photo to verify your age and identity.
                    </p>
                  </div>

                  {/* ID Type Selector */}
                  <div className="flex gap-2 p-1 bg-slate-950/60 rounded-xl border border-blue-900/25">
                    <button
                      type="button"
                      onClick={() => { setIdType('nid'); setValidationError(null); }}
                      className={`flex-1 py-2 text-[10px] min-[380px]:text-[11px] font-black uppercase rounded-lg transition-all ${
                        idType === 'nid'
                          ? 'bg-gradient-to-r from-amber-600/30 to-[#dbaa61]/35 border border-[#dbaa61]/70 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                      }`}
                    >
                      National ID (NID)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIdType('birth'); setValidationError(null); }}
                      className={`flex-1 py-2 text-[10px] min-[380px]:text-[11px] font-black uppercase rounded-lg transition-all ${
                        idType === 'birth'
                          ? 'bg-gradient-to-r from-amber-600/30 to-[#dbaa61]/35 border border-[#dbaa61]/70 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                      }`}
                    >
                      Birth Certificate
                    </button>
                  </div>

                  {idType === 'nid' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Front Side */}
                      <div>
                        <p className="text-[11px] text-slate-200 font-extrabold mb-1.5 uppercase font-mono tracking-wider">
                          NID Front Side *
                        </p>
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
                          <label className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-[#dbaa61]/45 hover:border-[#dbaa61] hover:bg-slate-900/60 cursor-pointer rounded-xl transition-all text-center bg-[#0e101a] px-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleNidChange(e, 'front')}
                              className="hidden"
                            />
                            <UploadCloud className="w-6 h-6 text-[#dbaa61] mb-1 opacity-95" />
                            <span className="text-[10px] min-[380px]:text-[11px] text-[#dbaa61] font-bold font-mono">Upload NID Front</span>
                            <span className="text-[8.5px] text-slate-400 font-sans">Front Side of your National ID</span>
                          </label>
                        )}
                      </div>

                      {/* Back Side */}
                      <div>
                        <p className="text-[11px] text-slate-200 font-extrabold mb-1.5 uppercase font-mono tracking-wider">
                          NID Back Side (Optional)
                        </p>
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
                          <label className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-[#dbaa61]/45 hover:border-[#dbaa61] hover:bg-slate-900/60 cursor-pointer rounded-xl transition-all text-center bg-[#0e101a] px-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleNidChange(e, 'back')}
                              className="hidden"
                            />
                            <UploadCloud className="w-6 h-6 text-[#dbaa61] mb-1 opacity-95" />
                            <span className="text-[10px] min-[380px]:text-[11px] text-[#dbaa61] font-bold font-mono">Upload NID Back</span>
                            <span className="text-[8.5px] text-slate-400 font-sans">Back Side of your National ID (Optional)</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <p className="text-[11px] text-slate-200 font-extrabold mb-1.5 uppercase font-mono tracking-wider">
                        Birth Certificate *
                      </p>
                      {nidFront ? (
                        <div className="relative h-32 rounded-xl overflow-hidden border-2 border-[#dbaa61]/55 bg-slate-950 w-full">
                          <img src={nidFront} className="w-full h-full object-cover" alt="Birth Certificate" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => removeNid('front')}
                            className="absolute top-1.5 right-1.5 bg-red-650 hover:bg-red-500 rounded-full p-1.5 cursor-pointer text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-[#dbaa61]/45 hover:border-[#dbaa61] hover:bg-slate-900/60 cursor-pointer rounded-xl transition-all text-center bg-[#0e101a] px-4 w-full">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleNidChange(e, 'front')}
                            className="hidden"
                          />
                          <UploadCloud className="w-8 h-8 text-[#dbaa61] mb-1.5 opacity-95" />
                          <span className="text-[11px] text-[#dbaa61] font-black font-mono">Upload Birth Certificate Photo</span>
                          <span className="text-[9.5px] text-slate-400 font-sans mt-0.5">Please upload a clear digital copy of your Birth Certificate (Single file)</span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Selfie Verification Block - Mandatory Live Capture Only */}
                  <div className="pt-1.5">
                    <p className="text-[11px] text-slate-200 font-extrabold mb-1.5 uppercase font-mono tracking-wider flex justify-between">
                      <span>Live Selfie Verification *</span>
                      <span className="text-red-400 font-black text-[9px]">CAMERA CAPTURE ONLY</span>
                    </p>

                    {isCameraActive ? (
                      <div className="bg-slate-950/80 border-2 border-[#dbaa61]/55 p-3 rounded-2xl flex flex-col items-center space-y-3.5">
                        <div className="relative w-full max-w-[280px] aspect-[4/3] rounded-xl overflow-hidden bg-black border border-slate-800">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 animate-pulse rounded-full text-[8.5px] font-black uppercase text-white font-mono">
                            LIVE CAMERA
                          </div>
                        </div>

                        <div className="flex gap-2.5 w-full justify-center">
                          <button
                            type="button"
                            onClick={captureSelfie}
                            className="px-5 py-2.5 bg-gradient-to-tr from-amber-600 to-[#dbaa61] hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-lg shadow-amber-950/20 font-sans flex items-center gap-1.5"
                          >
                            <Camera className="w-4 h-4" />
                            Capture Photo
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer font-sans"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : selfie ? (
                      <div className="relative h-36 rounded-xl overflow-hidden border-2 border-[#dbaa61]/55 bg-slate-950">
                        <img src={selfie} className="w-full h-full object-cover" alt="Verification Selfie" referrerPolicy="no-referrer" />
                        <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full font-mono tracking-widest flex items-center gap-1">
                          <Check className="w-3 h-3" /> VERIFIED CAMERA CAPTURE
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelfie(null)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 rounded-full p-2 cursor-pointer text-white shadow-lg active:scale-90 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#dbaa61]/45 bg-[#0e101a] rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-[#dbaa61]/25 flex items-center justify-center text-[#dbaa61]">
                          <Camera className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-white font-black font-sans">
                            Live Camera Capture Mandatory
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium font-sans max-w-sm leading-relaxed">
                            Upload is disabled for security. Click below to start your front or back camera and snap a live selfie directly.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="px-5 py-2.5 bg-[#dbaa61]/10 hover:bg-[#dbaa61]/20 border border-[#dbaa61]/55 text-[#dbaa61] rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer shadow-md font-sans"
                        >
                          Start Camera
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Apni ki service dite parben / What services can you provide */}
              {type !== 'female' && (
                <div className="border-t border-[#ac843c]/25 pt-4">
                  {type === 'male' ? (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                        Specialty Service Description & Experience *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder=""
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-black tracking-widest text-[#dbaa61] uppercase pl-1">
                        Health & Body Vitals (Height, Weight, Habits) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder=""
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        className="w-full bg-[#030818]/60 border border-blue-900/35 focus:border-[#dbaa61]/70 text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all placeholder:text-slate-400 resize-none leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              )}

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
                  </>
                )}
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

            {/* HIGHLY VISIBLE CUSTOM EMAIL/CREDENTIALS ALERT CARD */}
            <div className="bg-[#0b1c1e] border-2 border-emerald-500/50 p-5 rounded-2xl text-left text-sm text-slate-100 space-y-3.5 font-bold leading-relaxed shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-2 border-b border-emerald-500/35 pb-2">
                <Mail className="w-5 h-5 text-emerald-400" />
                <span className="font-extrabold text-emerald-400 uppercase tracking-wider font-mono">System Email Notification</span>
              </div>
              <p className="text-sm text-white font-bold leading-relaxed">
                Thank you for registering. Once our dispatch operations team reviews and approves your registry profile, your system username and a temporary login password will be automatically generated and sent to your email address:
              </p>
              <div className="bg-black/45 px-4 py-3 rounded-xl border border-emerald-500/20 font-mono text-center text-xs text-emerald-400 font-black select-all break-all tracking-wide">
                {formData.email || 'your-registered-email@domain.com'}
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                * Please make sure to check your Inbox as well as your Spam/Junk folder for your temporary password once approved.
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
                Our dispatch operations team will review your photos, dimensions, and NID credentials. If approved, your credentials (including your temporary password) will be emailed immediately, and we will contact you on <span className="font-bold text-[#dbaa61]">{formData.telegram || 'your Telegram'}</span> (Telegram) within 12 - 24 hours to schedule onboarding coordinates.
              </p>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/25 p-4 rounded-2xl flex items-center justify-between text-left gap-3.5">
              <div className="space-y-0.5">
                <span className="text-[9px] text-[#8ea5db] uppercase font-mono font-black tracking-widest block">
                  OFFICIAL HELPLINE SUPPORT
                </span>
                <p className="text-xs text-slate-100 font-bold leading-tight">
                  For career verification helpline, please contact us on Telegram:
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
