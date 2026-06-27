import { Companion, PaymentGateway } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Moon, MapPin, Sparkles, User, Video, Heart, Users, ArrowRight, ArrowLeft, Home, Car, ChevronDown, MessageSquare, Phone, Send, CheckCircle2, Copy, Check, Info, Camera, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { compressImage } from '../services/imageService';

const PREDEFINED_SANCTUARIES = [
  { name: 'Le Méridien Dhaka', address: 'Le Méridien, Pragati Sarani, Dhaka 1229', price: 9500 },
  { name: 'The Westin Dhaka', address: 'The Westin, Main Gulshan Avenue, Gulshan 2, Dhaka 1212', price: 11000 },
  { name: 'Gulshan Secret Suite (Safe House)', address: 'bodyTOUCH Private Hideout, Gulshan 1, Dhaka', price: 5000 },
  { name: 'Banani Cyber Penthouse (Safe House)', address: 'bodyTOUCH VIP Safe House, Road 11, Banani, Dhaka', price: 5500 },
  { name: 'Radisson Blu Bay View', address: 'Radisson Blu, SS Sarani, Chittagong', price: 8500 },
];

export const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const calculateBookingCost = (hourlyRate: number, service: string, timeFrame: string, companion?: Companion): number => {
  let baseRate = hourlyRate || 10000;
  
  if (service === 'REAL') {
    if (companion && companion.rateReal && companion.rateReal > 0) {
      baseRate = companion.rateReal;
    }
  } else if (service === 'CAM') {
    if (companion && companion.rateCam && companion.rateCam > 0) {
      baseRate = companion.rateCam;
    } else {
      baseRate = baseRate * 0.55; // 45% off
    }
  } else if (service === 'MAKE_OUT') {
    if (companion && companion.rateMakeOut && companion.rateMakeOut > 0) {
      baseRate = companion.rateMakeOut;
    } else {
      baseRate = baseRate * 0.65; // 35% off
    }
  } else if (service === 'LIVE_TOGETHER') {
    if (companion && companion.rateLiveTogether && companion.rateLiveTogether > 0) {
      baseRate = companion.rateLiveTogether;
    }
  }
  
  // Calculate multiplier based on duration timeFrame
  let multiplier = 2; // default: 2 hours
  switch (timeFrame) {
    case '30_MIN':
      multiplier = 0.5;
      break;
    case '1_HOUR':
      multiplier = 1;
      break;
    case '2_HOURS':
      multiplier = 2;
      break;
    case '3_HOURS':
      multiplier = 3;
      break;
    case 'FULL_NIGHT':
      multiplier = 6; // 8 hours for the price of 6
      break;
    case '2_DAYS':
      multiplier = 12; // 2 days discounted
      break;
    case '7_DAYS':
      multiplier = 25; // 7 days discounted
      break;
    case '15_DAYS':
      multiplier = 45; // 15 days discounted
      break;
    case '1_MONTH':
      multiplier = 80; // 1 month discounted
      break;
  }
  
  return Math.round(baseRate * multiplier);
};

interface BookingModalProps {
  companion: Companion | null;
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  hasBookings: boolean;
  defaultClientName?: string;
  defaultClientPhone?: string;
  defaultClientEmail?: string;
  defaultClientPhoto?: string;
  paymentGateways?: PaymentGateway[];
  onSubmit: (bookingData: {
    date: string;
    time: string;
    location: string;
    duration: string;
    notes: string;
    secretCode?: string;
    cost: number;
    deficitPay?: {
      method: string;
      trxId: string;
      amount: number;
    };
    firstTimeBooking?: boolean;
    userPhoto?: string;
    nidFront?: string;
    nidBack?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
  }) => void;
  locations?: any[];
  initialLocationId?: string;
}

export default function BookingModal({
  companion,
  isOpen,
  onClose,
  walletBalance,
  hasBookings,
  defaultClientName,
  defaultClientPhone,
  defaultClientEmail,
  defaultClientPhoto,
  paymentGateways = [],
  onSubmit,
  locations = [],
  initialLocationId
}: BookingModalProps) {
  // Filter active gateways
  const activeGateways = paymentGateways.filter(g => g.isActive);

  // Fallback gateways if none are loaded/active
  const defaultGateways: PaymentGateway[] = [
    {
      id: 'bk_default',
      name: 'bKash Personal',
      method: 'BKASH',
      walletType: 'Personal',
      number: '01712-345678',
      instructions: 'দয়া করে এই bKash পার্সোনাল নম্বরে "Send Money" করুন।',
      isActive: true
    },
    {
      id: 'ng_default',
      name: 'Nagad Agent',
      method: 'NAGAD',
      walletType: 'Agent',
      number: '01912-345678',
      instructions: 'দয়া করে এই Nagad এজেন্ট নম্বরে "Cash Out" করুন।',
      isActive: true
    },
    {
      id: 'rk_default',
      name: 'Rocket Merchant',
      method: 'ROCKET',
      walletType: 'Merchant',
      number: '01812-345678',
      instructions: 'দয়া করে এই Rocket মার্চেন্ট নম্বরে "Merchant Pay" করুন।',
      isActive: true
    }
  ];

  const displayGateways = activeGateways.length > 0 ? activeGateways : defaultGateways;

  // 5-step dynamic wizard: 
  // Step 1: Select Service (REAL, CAM, MAKE_OUT, LIVE_TOGETHER)
  // Step 2: Select Time Frame (1 Hour, 2 Hours, 3 Hours, Full Night)
  // Step 3: Coordinates Type (INCALL vs OUTCALL) & Specific Address Input
  // Step 4: Schedule details (Date, Time, Custom Requests)
  // Step 5: Secure Contact Channel (PHONE, WHATSAPP, TELEGRAM) & Deficit Payment Gateway (if applicable)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<'REAL' | 'CAM' | 'MAKE_OUT' | 'LIVE_TOGETHER'>('REAL');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'30_MIN' | '1_HOUR' | '2_HOURS' | '3_HOURS' | 'FULL_NIGHT' | '2_DAYS' | '7_DAYS' | '15_DAYS' | '1_MONTH'>('2_HOURS');
  const [coordinatesType, setCoordinatesType] = useState<'INCALL' | 'OUTCALL'>('INCALL');

  // Dynamic sanctuaries computed from current state
  const sanctuaries = React.useMemo(() => {
    if (locations && locations.length > 0) {
      return locations.map(l => ({
        id: l.id,
        name: l.name,
        address: l.description || l.name,
        price: l.price
      }));
    }
    return PREDEFINED_SANCTUARIES;
  }, [locations]);

  const [specificAddress, setSpecificAddress] = useState(PREDEFINED_SANCTUARIES[0].address);

  // Sync / set specific preselected address when opened
  useEffect(() => {
    if (isOpen && sanctuaries.length > 0) {
      if (initialLocationId) {
        const match = sanctuaries.find(s => s.id === initialLocationId);
        if (match) {
          setSpecificAddress(match.address);
          setCoordinatesType('INCALL');
          return;
        }
      }
      setSpecificAddress(sanctuaries[0].address);
    }
  }, [isOpen, initialLocationId, sanctuaries]);

  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [date, setDate] = useState(getTodayDateString());
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date();
    return today;
  });
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [commsChannel, setCommsChannel] = useState<'PHONE' | 'TELEGRAM'>('TELEGRAM');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [telegramId, setTelegramId] = useState('Guest');
  const [secretCode, setSecretCode] = useState<string>('');
  const [showThankyou, setShowThankyou] = useState<boolean>(false);

  // Telegram OTP Verification States
  const [telegramOtp, setTelegramOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');

  // First time booking fields
  const [firstTimeBooking, setFirstTimeBooking] = useState<boolean>(false);
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [nidFront, setNidFront] = useState<string>('');
  const [nidBack, setNidBack] = useState<string>('');

  // Live camera states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error(e);
        }
      });
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });
      streamRef.current = stream;
      // Use a timeout to ensure the ref might be bound if it just mounted
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        "Camera access failed. Please ensure you have granted camera permissions in your browser. / ক্যামেরা অ্যাক্সেস করা যায়নি। দয়া করে ব্রাউজার ক্যামেরা পারমিশন চেক করুন।"
      );
    }
  };


  // Automatically scroll modal container back to top on any step change or page change
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const container = document.getElementById('booking-modal-scroll-container');
        if (container) {
          container.scrollTop = 0;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step, showThankyou, firstTimeBooking, cameraActive]);

  useEffect(() => {
    if (!isOpen || step !== 4) {
      stopCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, step]);

  // Auto-start camera if permission is already granted previously in this browser
  useEffect(() => {
    if (isOpen && step === 4 && firstTimeBooking && !userPhoto && !cameraActive) {
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'camera' as PermissionName })
          .then((permissionStatus) => {
            if (permissionStatus.state === 'granted') {
              startCamera();
            }
          })
          .catch((err) => {
            console.warn("Permissions query check not supported or failed:", err);
          });
      }
    }
  }, [isOpen, step, firstTimeBooking, userPhoto, cameraActive]);

  // Client details to capture
  const [clientNameInput, setClientNameInput] = useState<string>('');
  const [clientPhoneInput, setClientPhoneInput] = useState<string>('');
  const [clientEmailInput, setClientEmailInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFirstTimeBooking(!hasBookings);
      setClientNameInput(defaultClientName || localStorage.getItem('bt_fullname') || '');
      setClientPhoneInput(defaultClientPhone || localStorage.getItem('bt_phone') || '');
      setClientEmailInput(defaultClientEmail || localStorage.getItem('bt_email') || '');
      
      const storedUserPhoto = localStorage.getItem('bt_user_photo') || defaultClientPhoto || '';
      const storedNidFront = localStorage.getItem('bt_nid_front') || '';
      const storedNidBack = localStorage.getItem('bt_nid_back') || '';

      if (storedUserPhoto) setUserPhoto(storedUserPhoto);
      if (storedNidFront) setNidFront(storedNidFront);
      if (storedNidBack) setNidBack(storedNidBack);
    }
  }, [isOpen, hasBookings, defaultClientName, defaultClientPhone, defaultClientEmail, defaultClientPhoto]);

  useEffect(() => {
    if (isOpen) {
      if (userPhoto) {
        localStorage.setItem('bt_user_photo', userPhoto);
      } else {
        localStorage.removeItem('bt_user_photo');
      }
    }
  }, [userPhoto, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (nidFront) {
        localStorage.setItem('bt_nid_front', nidFront);
      } else {
        localStorage.removeItem('bt_nid_front');
      }
    }
  }, [nidFront, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (nidBack) {
        localStorage.setItem('bt_nid_back', nidBack);
      } else {
        localStorage.removeItem('bt_nid_back');
      }
    }
  }, [nidBack, isOpen]);

  // Deficit states if balance is insufficient
  const [deficitMethod, setDeficitMethod] = useState<string>('');
  const [deficitTrxId, setDeficitTrxId] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [deficitScreenshot, setDeficitScreenshot] = useState('');
  const [deficitUploading, setDeficitUploading] = useState(false);
  const deficitFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDeficitFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDeficitUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDeficitScreenshot(reader.result as string);
        setDeficitUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isOpen && displayGateways.length > 0) {
      // Find matches
      const isConfigured = displayGateways.some(g => g.id === deficitMethod || g.name === deficitMethod);
      if (!isConfigured) {
        setDeficitMethod(displayGateways[0].name);
      }
    }
  }, [isOpen, displayGateways, deficitMethod]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file, 800, 800, 0.75).then((compressedUrl) => {
        if (compressedUrl) {
          setter(compressedUrl);
        }
      });
    }
  };

  const [lastSubmittedData, setLastSubmittedData] = useState<{
    date: string;
    time: string;
    location: string;
    duration: string;
    notes: string;
    secretCode?: string;
    cost: number;
    deficitPay?: {
      method: string;
      trxId: string;
      amount: number;
    };
    firstTimeBooking?: boolean;
    userPhoto?: string;
    nidFront?: string;
    nidBack?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
  } | null>(null);

  if (!companion) return null;

  const companionCost = calculateBookingCost(companion.rate, selectedService, selectedTimeFrame, companion);
  const selectedHotelObj = sanctuaries.find(s => s.address === specificAddress || s.name === specificAddress);
  const hotelCost = (selectedService !== 'CAM' && coordinatesType === 'INCALL') ? (selectedHotelObj?.price || 0) : 0;
  const bookingCost = companionCost + hotelCost;
  const deficitAmount = bookingCost - walletBalance;
  const isDeficit = deficitAmount > 0;

  const handleCoordinatesTypeChange = (type: 'INCALL' | 'OUTCALL') => {
    setCoordinatesType(type);
    setIsAddressDropdownOpen(false);
    if (type === 'INCALL') {
      setSpecificAddress(sanctuaries[0]?.address || '');
    } else {
      setSpecificAddress('');
    }
  };

  const handleServiceChange = (service: 'REAL' | 'CAM' | 'MAKE_OUT' | 'LIVE_TOGETHER') => {
    setSelectedService(service);
    if (service === 'CAM') {
      setSelectedTimeFrame('30_MIN');
    } else if (service === 'MAKE_OUT') {
      setSelectedTimeFrame('2_HOURS');
      setCoordinatesType('OUTCALL');
      setSpecificAddress('');
    } else if (service === 'LIVE_TOGETHER') {
      setSelectedTimeFrame('2_DAYS');
      setCoordinatesType('INCALL');
      setSpecificAddress(sanctuaries[0]?.address || '');
    } else {
      setSelectedTimeFrame('2_HOURS');
      setCoordinatesType('INCALL');
      setSpecificAddress(sanctuaries[0]?.address || '');
    }
  };

  // Convert selectedTimeFrame enum to display string
  const getDurationString = () => {
    switch (selectedTimeFrame) {
      case '30_MIN': return '30 Minutes';
      case '1_HOUR': return '1 Hour';
      case '2_HOURS': return '2 Hours';
      case '3_HOURS': return '3 Hours';
      case 'FULL_NIGHT': return 'Full Night (8 Hours)';
      case '2_DAYS': return '2 Days';
      case '7_DAYS': return '7 Days';
      case '15_DAYS': return '15 Days';
      case '1_MONTH': return '1 Month';
      default: return '2 Hours';
    }
  };

  const getActiveContactValue = () => {
    return telegramId || phoneNumber;
  };

  const selectedGateway = displayGateways.find(g => g.id === deficitMethod || g.name === deficitMethod) || displayGateways[0];

  const handlePhoneCopy = () => {
    if (selectedGateway) {
      const cleanNumber = selectedGateway.number.replace(/[^0-9]/g, '');
      navigator.clipboard.writeText(cleanNumber);
    } else {
      navigator.clipboard.writeText('01712345678');
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const executeSendTelegramOtpBooking = async (code: string) => {
    setIsSendingOtp(true);
    setOtpError('');
    setOtpSuccess('');
    
    const defaultBotToken = '7874983058:AAHshUqisKskj6D5-zZ7N0L-GCHV966L1Sg';
    const customBotToken = localStorage.getItem('bt_telegram_bot_token') || defaultBotToken;
    const token = localStorage.getItem('bt_telegram_bot_selection') === 'default' ? defaultBotToken : customBotToken;
    const chatId = localStorage.getItem('bt_telegram_group_id') || '-1002283928192';

    const text = `🔐 <b>[BODY TOUCH Booking Verification OTP]</b>\n\n` +
                 `Client Name: <b>${clientNameInput || 'Guest Client'}</b>\n` +
                 `Mobile Phone: <code>${phoneNumber}</code>\n` +
                 `Telegram Username: <b>${telegramId}</b>\n` +
                 `Companion Name: <b>${companion?.name}</b>\n\n` +
                 `Verification Code:\n` +
                 `👉 <b>${code}</b> 👈\n\n` +
                 `Enter this code in your browser popup to unlock and book.`;

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
      setOtpSuccess('Verification code dispatched to Telegram!');
    } catch (teleErr) {
      console.error("Telegram OTP dispatch error:", teleErr);
      setOtpError('Failed to send verification code. Please check Telegram bot connection.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeVal = getActiveContactValue();
    const resolvedDate = selectedService === 'CAM' ? (date || 'Today (Virtual CAM)') : date;
    if (!resolvedDate || !time || !phoneNumber.trim() || !telegramId.trim()) return;

    if (isDeficit) {
      if (!deficitTrxId || deficitTrxId.trim().length < 8) return;
    }

    // OTP verification has been disabled as requested by user. Proceed directly to booking confirmation.

    // Collate all filled contacts
    const contactsCollated: string[] = [];
    if (phoneNumber.trim()) contactsCollated.push(`Phone: ${phoneNumber.trim()}`);
    if (telegramId.trim()) contactsCollated.push(`Telegram: ${telegramId.trim()}`);
    const contactsDetails = contactsCollated.join(' | ');

    // Generate random 4-digit security code of mixed letters & numbers
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Leaving out ambiguous chars like I, O, 0, 1 for better UX
    let generatedCode = '';
    for (let i = 0; i < 4; i++) {
      generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecretCode(generatedCode);

    let logsNotes = selectedService === 'CAM'
      ? `[Service: CAM] [Secret Code: ${generatedCode}] [Preferred Comms: ${commsChannel}] [Comms Info: ${contactsDetails}] ${notes}`
      : `[Service: ${selectedService}] [Coordinates: ${coordinatesType}] [Secret Code: ${generatedCode}] [Preferred Comms: ${commsChannel}] [Comms Info: ${contactsDetails}] ${notes}`;
    
    if (isDeficit) {
      logsNotes += ` [Remaining Balance payment verified with TrxID: ${deficitTrxId.toUpperCase()} via ${deficitMethod}]`;
    }

    const bookingPayload = {
      date: resolvedDate,
      time,
      location: selectedService === 'CAM' ? 'Webcam Service (Virtual)' : (specificAddress || (coordinatesType === 'INCALL' ? 'Le Méridien Dhaka Suite' : 'Client Specified Location')),
      duration: getDurationString(),
      notes: logsNotes,
      secretCode: generatedCode,
      cost: bookingCost,
      deficitPay: isDeficit ? {
        method: deficitMethod,
        trxId: deficitTrxId.trim().toUpperCase(),
        amount: deficitAmount,
        screenshot: deficitScreenshot || undefined
      } : undefined,
      firstTimeBooking,
      userPhoto: userPhoto || defaultClientPhoto || undefined,
      nidFront: firstTimeBooking ? nidFront : undefined,
      nidBack: firstTimeBooking ? nidBack : undefined,
      clientName: clientNameInput.trim() || undefined,
      clientPhone: clientPhoneInput.trim() || undefined,
      clientEmail: clientEmailInput.trim() || undefined
    };

    setLastSubmittedData(bookingPayload);
    setShowOtpScreen(false);
    setShowThankyou(true);
  };

  const handleFinalize = () => {
    if (lastSubmittedData) {
      onSubmit(lastSubmittedData);
    }
    // Reset state
    setDate('');
    setTime('');
    setSpecificAddress('');
    setSelectedTimeFrame('2_HOURS');
    setNotes('');
    setPhoneNumber('');
    setWhatsappNumber('');
    setTelegramId('');
    setCommsChannel('WHATSAPP');
    setIsAddressDropdownOpen(false);
    setSecretCode('');
    setDeficitTrxId('');
    setDeficitScreenshot('');
    setShowThankyou(false);
    setFirstTimeBooking(false);
    setUserPhoto('');
    setNidFront('');
    setNidBack('');
    setStep(1);
  };

  const handleClose = () => {
    stopCamera();
    setStep(1);
    setIsAddressDropdownOpen(false);
    setShowThankyou(false);
    setSecretCode('');
    setDeficitTrxId('');
    setDeficitScreenshot('');
    setFirstTimeBooking(false);
    setUserPhoto('');
    setNidFront('');
    setNidBack('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="booking-modal-scroll-container" className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 py-8 sm:py-4 bg-black/95 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="cyan-glow-card max-w-sm w-full rounded-2xl overflow-y-auto max-h-[92vh] relative shadow-2xl z-10 bg-[#020714] border border-blue-500/20 shadow-blue-500/5 my-4 gold-breathing-glow"
          >
            {!showThankyou && (
              <button
                 onClick={handleClose}
                 className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-950/80 transition-all z-20"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="p-6 text-left">
              {showThankyou ? (
                /* Beautiful Premium Thankyou Page */
                <div className="space-y-6 text-center py-4 animate-fadeIn">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse">
                      <CheckCircle2 className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-wider font-display">
                      Protocol Initialized
                    </h2>
                    <p className="text-[11px] text-slate-400 leading-normal max-w-[260px] mx-auto font-medium text-center">
                      Your premium dispatch reservation has been successfully registered in our secure logs.
                    </p>
                  </div>

                  {/* Highlighted Warning Banner */}
                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                    <span className="text-rose-400 text-sm">⚠️</span>
                    <p className="text-xs font-black text-rose-300 tracking-wide text-center">
                      এই কোড ছাড়া কোনো সার্ভিস পাবেন না
                    </p>
                  </div>

                  {/* 4-digit unique secret code card */}
                  <div className="p-5 bg-gradient-to-b from-[#030d24] to-[#010612] border border-blue-500/30 rounded-2xl shadow-inner relative overflow-hidden backdrop-blur-md">
                    <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                    
                    <span className="block text-[10px] text-blue-400 font-extrabold uppercase tracking-widest mb-2 font-mono text-center">
                      YOUR PRIVATE DISPATCH CODE
                    </span>

                    <div className="text-4xl font-black text-white tracking-[0.25em] font-mono select-all flex justify-center items-center py-2 text-glow">
                      {secretCode}
                    </div>

                    <p className="text-[9px] text-slate-500 font-bold leading-normal mt-2 select-none text-center">
                      Write down or screenshot this verification key. Never share it with anyone except your verified host companion.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleFinalize}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition duration-300 cursor-pointer shadow-lg shadow-blue-500/20"
                    >
                      DISPATCH & CLOSE
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Dynamic Cost Indicator Capsule */}
                  <div className="mb-4 bg-[#040e29] border border-[#dbaa61]/40 shadow-[0_0_20px_rgba(219,170,97,0.15)] rounded-xl p-3.5 flex justify-between items-center text-xs transition-all duration-300">
                    <div>
                      <span className="text-[9px] text-[#dbaa61] font-black block uppercase tracking-wider">Service Fee / বুকিং মূল্য</span>
                      <span className="font-extrabold text-[#dbaa61] font-mono text-base tracking-wide flex items-center gap-1 mt-0.5">
                        <span className="inline-block text-[#dbaa61] drop-shadow-[0_0_10px_rgba(219,170,97,0.5)]">৳{bookingCost.toLocaleString('en-US')}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Wallet Balance / ওয়ালেট</span>
                      <span className="font-extrabold text-slate-200 font-mono text-sm mt-0.5 block">৳{walletBalance.toLocaleString('en-US')}</span>
                    </div>
                  </div>

                  {hotelCost > 0 && (
                    <div className="mb-4 text-[10px] text-blue-300 bg-blue-950/25 border border-blue-500/15 rounded-xl py-2.5 px-4 flex justify-between font-mono animate-fadeIn">
                      <span className="font-semibold">Companion Rate: ৳{companionCost.toLocaleString('en-US')}</span>
                      <span className="font-semibold text-amber-400">Hotel Venue: +৳{hotelCost.toLocaleString('en-US')}</span>
                    </div>
                  )}

                  {step === 1 && (
                /* Step 1: Acquisition Protocol - Select Service */
                <div className="space-y-6">
                  <div className="text-center pt-2 pb-4 border-b border-blue-500/10">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                      Acquisition Protocol
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">
                      SELECT SERVICE / সার্ভিস নির্বাচন করুন
                    </span>
                    
                    {(() => {
                      const baseReal = companion.rateReal && companion.rateReal > 0 ? companion.rateReal : companion.rate;
                      const baseCam = companion.rateCam && companion.rateCam > 0 ? companion.rateCam : Math.round(companion.rate * 0.55);
                      const baseMakeOut = companion.rateMakeOut && companion.rateMakeOut > 0 ? companion.rateMakeOut : Math.round(companion.rate * 0.65);
                      const baseLiveTogether = companion.rateLiveTogether && companion.rateLiveTogether > 0 ? companion.rateLiveTogether : companion.rate;

                      return (
                        <div className="grid grid-cols-2 gap-3">
                          {/* REAL SERVICE VIEW */}
                          <button
                            type="button"
                            onClick={() => handleServiceChange('REAL')}
                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 group cursor-pointer ${
                              selectedService === 'REAL'
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                            }`}
                          >
                            <User className={`w-6 h-6 ${selectedService === 'REAL' ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white">REAL</span>
                          </button>

                          {/* CAM SERVICE VIEW */}
                          <button
                            type="button"
                            onClick={() => handleServiceChange('CAM')}
                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 group cursor-pointer ${
                              selectedService === 'CAM'
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                            }`}
                          >
                            <Video className={`w-6 h-6 ${selectedService === 'CAM' ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white leading-none">CAM</span>
                          </button>

                          {/* MAKE OUT SERVICE VIEW */}
                          <button
                            type="button"
                            onClick={() => handleServiceChange('MAKE_OUT')}
                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 group cursor-pointer ${
                              selectedService === 'MAKE_OUT'
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                            }`}
                          >
                            <Heart className={`w-6 h-6 ${selectedService === 'MAKE_OUT' ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white leading-none">MAKE OUT</span>
                          </button>

                          {/* LIVE TOGETHER VIEW */}
                          <button
                            type="button"
                            onClick={() => handleServiceChange('LIVE_TOGETHER')}
                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 group cursor-pointer ${
                              selectedService === 'LIVE_TOGETHER'
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                            }`}
                          >
                            <Users className={`w-6 h-6 ${selectedService === 'LIVE_TOGETHER' ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white leading-none">LIVE TOGETHER</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black uppercase text-[11px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-blue-500/20"
                  >
                    <span>PROCEED</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {step === 2 && (
                /* Step 2: Select Time Frame Options */
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center pt-2 pb-4 border-b border-blue-500/10">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                      Acquisition Protocol
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">
                      SELECT TIME FRAME
                    </span>

                    {selectedService === 'CAM' ? (
                      /* CAM Service Timeframes: 30 minutes, 1 hour, 2 hours */
                      <div className="grid grid-cols-3 gap-3">
                        {/* 30 MINUTES */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('30_MIN')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '30_MIN'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '30_MIN' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">30 MIN</span>
                        </button>

                        {/* 1 HOUR */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('1_HOUR')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '1_HOUR'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '1_HOUR' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">1 HOUR</span>
                        </button>

                        {/* 2 HOURS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('2_HOURS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '2_HOURS'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '2_HOURS' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">2 HOURS</span>
                        </button>
                      </div>
                    ) : selectedService === 'LIVE_TOGETHER' ? (
                      /* LIVE TOGETHER Timeframes: 2 Days, 7 Days, 15 Days, 1 Month */
                      <div className="grid grid-cols-2 gap-3">
                        {/* 2 DAYS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('2_DAYS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '2_DAYS'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '2_DAYS' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">2 DAYS</span>
                        </button>

                        {/* 7 DAYS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('7_DAYS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '7_DAYS'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '7_DAYS' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">7 DAYS</span>
                        </button>

                        {/* 15 DAYS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('15_DAYS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '15_DAYS'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '15_DAYS' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">15 DAYS</span>
                        </button>

                        {/* 1 MONTH */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('1_MONTH')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '1_MONTH'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '1_MONTH' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">1 MONTH</span>
                        </button>
                      </div>
                    ) : (
                      /* Organized exactly like the request: 3 cells in row 1, 1 cell on left in row 2 */
                      <div className="grid grid-cols-3 gap-3">
                        {/* 1 HOUR */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('1_HOUR')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '1_HOUR'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-450'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '1_HOUR' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">1 HOUR</span>
                        </button>

                        {/* 2 HOURS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('2_HOURS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '2_HOURS'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-450'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '2_HOURS' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">2 HOURS</span>
                        </button>

                        {/* 3 HOURS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('3_HOURS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '3_HOURS'
                              ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-450'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '3_HOURS' ? 'text-blue-400' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">3 HOURS</span>
                        </button>

                        {/* FULL NIGHT */}
                        {selectedService !== 'MAKE_OUT' && (
                          <button
                            type="button"
                            onClick={() => setSelectedTimeFrame('FULL_NIGHT')}
                            className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                              selectedTimeFrame === 'FULL_NIGHT'
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-450'
                            }`}
                          >
                            <Moon className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === 'FULL_NIGHT' ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">FULL NIGHT</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Back and Proceed Buttons Row */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-transparent border border-blue-500/20 hover:border-blue-500/40 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(selectedService === 'CAM' ? 4 : 3)}
                      className="flex-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/20 whitespace-nowrap"
                    >
                      <span>Proceed</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                /* Step 3: Select Coordinates Type & Specific Address Form - Dynamic INCALL hotel list and OUTCALL custom input */
                <div className="space-y-6 animate-fadeIn pb-1">
                  <div className="text-center pt-2 pb-4 border-b border-blue-500/10">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                      Acquisition Protocol
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {selectedService === 'MAKE_OUT' ? (
                      <div className="space-y-2">
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          RESTAURANT LOCATION (OUTCALL ONLY)
                        </span>
                        <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={specificAddress}
                            onChange={(e) => setSpecificAddress(e.target.value)}
                            placeholder="Specify restaurant name & address..."
                            className="w-full bg-[#030a1c] border border-blue-500/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-400 leading-normal font-semibold placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          COORDINATES TYPE
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          {/* INCALL (OUR PLACE) */}
                          <button
                            type="button"
                            onClick={() => handleCoordinatesTypeChange('INCALL')}
                            className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 cursor-pointer ${
                              coordinatesType === 'INCALL'
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                            }`}
                          >
                            <Home className={`w-5 h-5 ${coordinatesType === 'INCALL' ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider">INCALL (OUR PLACE)</span>
                          </button>

                          {/* OUTCALL (YOURS) */}
                          <button
                            type="button"
                            onClick={() => handleCoordinatesTypeChange('OUTCALL')}
                            className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 cursor-pointer ${
                              coordinatesType === 'OUTCALL'
                                ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-blue-500/10 hover:border-blue-500/25 text-slate-400'
                            }`}
                          >
                            <Car className={`w-5 h-5 ${coordinatesType === 'OUTCALL' ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider">OUTCALL (YOURS)</span>
                          </button>
                        </div>

                        {coordinatesType === 'INCALL' ? (
                          <div className="space-y-3 relative">
                            <span className="block text-[10px] text-slate-550 font-extrabold uppercase tracking-wider">
                              SELECT SAFEHOUSE / PREMIUM HOTEL
                            </span>
                            
                            {/* Custom premium dropdown selector with down arrow */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                                className="w-full bg-[#030a1c] border border-blue-500/25 hover:border-blue-500/40 text-left rounded-xl p-3.5 focus:outline-none flex justify-between items-center transition duration-200 cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                                  <div className="truncate">
                                    <p className="text-[11px] font-black text-blue-300 leading-tight flex items-center gap-1.5">
                                      <span>
                                        {sanctuaries.find(s => s.address === specificAddress)?.name || 'Select Sanctuary'}
                                      </span>
                                      {sanctuaries.find(s => s.address === specificAddress) && (
                                        <span className="text-[9px] text-amber-400 bg-amber-450/10 border border-amber-500/20 rounded px-1.5 py-0.2 font-mono">
                                          +৳{sanctuaries.find(s => s.address === specificAddress)?.price.toLocaleString()}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-mono truncate leading-none mt-1 font-semibold">
                                      {specificAddress || 'Choose a sanctuary address...'}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isAddressDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                              </button>

                              {/* Predefined Sanctuaries list revealed by down-arrow click */}
                              {isAddressDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#030a1c] border border-blue-500/30 rounded-xl overflow-hidden shadow-2xl max-h-[170px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-500/20"
                                >
                                  {sanctuaries.map((s) => {
                                    const isSelected = specificAddress === s.address;
                                    return (
                                      <button
                                        key={s.name}
                                        type="button"
                                        onClick={() => {
                                          setSpecificAddress(s.address);
                                          setIsAddressDropdownOpen(false);
                                        }}
                                        className={`w-full p-3 text-left transition-all duration-200 cursor-pointer text-xs flex flex-col space-y-0.5 border-b border-blue-500/5 last:border-0 ${
                                          isSelected
                                            ? 'bg-blue-900/30 text-white font-bold'
                                            : 'hover:bg-blue-950/40 text-slate-400'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center w-full gap-2 text-left">
                                          <span className={`font-black text-[11px] truncate ${isSelected ? 'text-blue-400' : 'text-blue-300'}`}>
                                            {s.name}
                                          </span>
                                          <span className="text-[10px] text-amber-400 font-extrabold font-mono shrink-0">
                                            +৳{s.price.toLocaleString()}
                                          </span>
                                        </div>
                                        <span className="text-[9px] text-slate-500 font-mono truncate leading-normal">
                                          {s.address}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <span className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                                CONFIRMED SANCTUARY LOCATION
                              </span>
                              <div className="p-3 bg-[#030a1c]/90 border border-blue-500/10 rounded-xl text-xs text-white font-semibold font-mono truncate flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                <span className="truncate">{specificAddress}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                              SPECIFIC ADDRESS
                            </span>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                              <input
                                type="text"
                                required
                                value={specificAddress}
                                onChange={(e) => setSpecificAddress(e.target.value)}
                                placeholder="Detailed coordinates..."
                                className="w-full bg-[#030a1c] border border-blue-500/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-400 leading-normal font-semibold placeholder:text-slate-600"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Navigation Row */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-transparent border border-blue-500/20 hover:border-blue-500/40 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      disabled={!specificAddress.trim()}
                      onClick={() => setStep(4)}
                      className="flex-1 bg-[#1e40af] hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/20 whitespace-nowrap"
                    >
                      <span>Proceed</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                /* Step 4: Date, Time - Step continues to Comms Channel step */
                <div className="space-y-6 animate-fadeIn pb-1">
                  <div className="text-center pt-2 pb-4 border-b border-blue-500/10">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                      Acquisition Protocol
                    </h2>
                  </div>

                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (selectedService === 'CAM') {
                      if (time) setStep(5);
                    } else {
                      if (date && time) setStep(5);
                    }
                  }} className="space-y-4">
                    {/* Date Input */}
                    {selectedService !== 'CAM' && (() => {
                      const year = currentMonth.getFullYear();
                      const month = currentMonth.getMonth();
                      const firstDayIndex = new Date(year, month, 1).getDay();
                      const totalDays = new Date(year, month + 1, 0).getDate();
                      
                      let selYear: number | null = null;
                      let selMonth: number | null = null;
                      let selDay: number | null = null;
                      if (date) {
                        const parts = date.split('-');
                        if (parts.length === 3) {
                          selYear = parseInt(parts[0], 10);
                          selMonth = parseInt(parts[1], 10) - 1;
                          selDay = parseInt(parts[2], 10);
                        }
                      }

                      const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
                      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                      const bnMonths = ["জানুয়ারী", "ফেব্রুয়ারী", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

                      const handlePrevMonth = () => {
                        setCurrentMonth(new Date(year, month - 1, 1));
                      };

                      const handleNextMonth = () => {
                        setCurrentMonth(new Date(year, month + 1, 1));
                      };

                      return (
                        <div className="space-y-2.5">
                          <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                            SELECT SERVICE DATE / সার্ভিস তারিখ নির্বাচন করুন
                          </span>
                          
                          {/* Calendar Card Panel */}
                          <div className="bg-[#030a1c] border border-blue-500/25 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between border-b border-blue-500/10 pb-2.5">
                              <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 px-2.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/10 text-blue-400 text-xs font-black transition cursor-pointer"
                              >
                                ◀
                              </button>
                              <div className="text-center">
                                <span className="text-white text-xs font-extrabold block">
                                  {months[month]} {year}
                                </span>
                                <span className="text-[10px] text-[#5c75ab] font-bold block mt-0.5">
                                  {bnMonths[month]} {year}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 px-2.5 rounded-lg bg-blue-500/5 hover:bg-blue-500/15 border border-blue-500/10 text-blue-400 text-xs font-black transition cursor-pointer"
                              >
                                ▶
                              </button>
                            </div>

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-[#5c75ab] uppercase font-mono">
                              {weekdays.map((wd) => (
                                <div key={wd} className="py-1">{wd}</div>
                              ))}
                            </div>

                            {/* Days Grid - All past dates are fully clickable as requested! */}
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold font-mono">
                              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                                <div key={`empty-${idx}`} />
                              ))}
                              {Array.from({ length: totalDays }).map((_, idx) => {
                                const day = idx + 1;
                                const isSelected = year === selYear && month === selMonth && day === selDay;
                                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => setDate(dateString)}
                                    className={`py-1.5 rounded-lg text-[11px] font-extrabold select-none transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-550/20'
                                        : 'text-slate-300 hover:bg-blue-500/10 hover:text-white'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Selected Date Summary */}
                            {date && (
                              <div className="border-t border-blue-500/10 pt-2 text-center">
                                <span className="text-[10px] text-blue-400 font-bold">
                                  Selected Date: <strong className="text-white font-mono select-all font-black">{date}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Time Input */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        SELECT SERVICE TIME
                      </span>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                        <input
                          type="time"
                          required
                          value={time}
                          onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                          onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full bg-[#030a1c] border border-blue-500/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-400 leading-normal font-semibold font-mono placeholder:text-slate-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Special Notes/Directives Input */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        SPECIAL DIRECTIVES (OPT)
                      </span>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-blue-400 pointer-events-none" />
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any strict requirements..."
                          className="w-full bg-[#030a1c] border border-blue-500/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-400 leading-relaxed font-semibold placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Client Information Section */}
                    <div className="border border-blue-500/10 bg-[#030a1c] p-4 rounded-xl space-y-4">
                      <div className="text-left border-b border-blue-500/10 pb-2">
                        <span className="block text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">
                          CLIENT DETAILS / গ্রাহকের বিবরণ (বাধ্যতামূলক)
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          নিরাপদ ও সঠিক যোগাযোগের জন্য আপনার বিস্তারিত তথ্য দিন
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Name Input */}
                        <div className="space-y-1 text-left">
                          <label className="block text-[9.5px] text-slate-300 font-bold uppercase tracking-wider">
                            Client Name / গ্রাহকের নাম
                          </label>
                          <input
                            type="text"
                            required
                            value={clientNameInput}
                            onChange={(e) => setClientNameInput(e.target.value)}
                            placeholder="e.g. Rohim Ahmed"
                            className="w-full bg-black/40 border border-blue-500/20 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-semibold placeholder:text-slate-700"
                          />
                        </div>

                        {/* Phone Input */}
                        <div className="space-y-1 text-left">
                          <label className="block text-[9.5px] text-slate-300 font-bold uppercase tracking-wider">
                            Phone Number / মোবাইল নম্বর
                          </label>
                          <input
                            type="tel"
                            required
                            value={clientPhoneInput}
                            onChange={(e) => setClientPhoneInput(e.target.value)}
                            placeholder="e.g. 017XXXXXXXX"
                            className="w-full bg-black/40 border border-blue-500/20 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-mono font-semibold placeholder:text-slate-700"
                          />
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1 text-left">
                          <label className="block text-[9.5px] text-slate-300 font-bold uppercase tracking-wider">
                            Email address / ইমেইল এড্রেস
                          </label>
                          <input
                            type="email"
                            required
                            value={clientEmailInput}
                            onChange={(e) => setClientEmailInput(e.target.value)}
                            placeholder="e.g. rohim@gmail.com"
                            className="w-full bg-black/40 border border-blue-500/20 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 font-mono font-semibold placeholder:text-slate-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* First-Time Booking Verification (Auto-Detected) */}
                    {firstTimeBooking && (
                      <div className="border border-blue-500/10 bg-[#030a1c] p-4 rounded-xl space-y-4 animate-in fade-in duration-200">
                        <div className="text-left border-b border-blue-500/10 pb-2.5 flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] text-[#00e5ff] font-extrabold uppercase tracking-wider">
                              HIGH SECURE LIVE VERIFICATION / প্রথমবার বুকিং ভেরিফিকেশন
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium tracking-tight">
                              (Direct active camera stream required / সরাসরি লাইভ ক্যামেরা চালু বাধ্যতামূলক)
                            </span>
                          </div>
                          <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider font-mono animate-pulse">
                            Secure Live / বাধ্যতামূলক
                          </span>
                        </div>

                        <div className="space-y-4 pt-1">
                          <div className="p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg text-left">
                            <p className="text-[10px] text-blue-300 leading-normal font-medium">
                              🔒 আপনার বুকিং ট্র্যাকিং রেকর্ড না থাকায় এটি একটি ভেরিফিকেশন রিঅ্যাক্ট প্রটোকল ট্রাইন করেছে। হাই-সিকিউরিটি নিশ্চিত করতে নিচের লাইভ ক্যামেরা বোতামে ক্লিক করে আপনার একটি সরাসরি সেলফি তুলুন। ফাইল বা গ্যালারি থেকে কোনো ছবি আপলোড করা যাবে না।
                            </p>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="block text-[9.5px] text-slate-300 font-bold uppercase tracking-wider font-sans">
                              Active Face Biometrics / সরাসরি সেলফি ছবি (সরাসরি বায়োমেট্রিক ছবি)
                            </label>

                            {userPhoto ? (
                              <div className="relative border border-emerald-500/30 rounded-xl p-4 bg-emerald-950/10 text-center flex flex-col items-center justify-center min-h-[150px]">
                                <div className="relative w-full flex flex-col items-center space-y-2">
                                  <div className="relative">
                                    <img src={userPhoto} alt="User Selfie" className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-md" />
                                    <span className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-emerald-400 font-extrabold tracking-wide uppercase">
                                    BIOMETRIC CAPTURED SECURELY
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    বায়োমেট্রিক ফ্রেম সম্পূর্ণভাবে রিসিভ করা হয়েছে
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setUserPhoto('')}
                                    className="text-[9px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20 mt-1 transition-all font-bold"
                                  >
                                    Retake Selfie / পুনরায় ছবি তুলুন
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative overflow-hidden rounded-xl bg-black/50 border border-blue-500/20">
                                {cameraActive ? (
                                  <div className="p-3 flex flex-col items-center space-y-4 font-sans">
                                    {/* Video frame with biometric targeting box overlay */}
                                    <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-blue-500/30 bg-black">
                                      <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                      ></video>
                                      
                                      {/* Biometric Guide Overlay */}
                                      <div className="absolute inset-0 border-[3px] border-blue-500/35 m-6 rounded-full pointer-events-none animate-pulse">
                                        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-red-500/50 -translate-y-1/2 animate-bounce" />
                                      </div>
                                      
                                      <div className="absolute bottom-2 left-0 right-0 text-center">
                                        <span className="bg-black/75 text-[8px] text-blue-400 font-bold px-2 py-0.5 rounded uppercase tracking-widest font-mono">
                                          [ LIVE CAMERA RECON ]
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex flex-col items-center w-full space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const video = videoRef.current;
                                          if (video) {
                                            const canvas = document.createElement('canvas');
                                            // Set canvas size
                                            canvas.width = 480;
                                            canvas.height = 480;
                                            const ctx = canvas.getContext('2d');
                                            if (ctx) {
                                              // High resolution crop center square
                                              const size = Math.min(video.videoWidth, video.videoHeight);
                                              const sx = (video.videoWidth - size) / 2;
                                              const sy = (video.videoHeight - size) / 2;
                                              ctx.drawImage(video, sx, sy, size, size, 0, 0, 480, 480);
                                              const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                                              setUserPhoto(dataUrl);
                                              stopCamera();
                                            }
                                          }
                                        }}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer"
                                      >
                                        <Camera className="w-4 h-4 text-white" />
                                        <span>CAPTURE SELFIE / ছবি সংরক্ষণ করুন</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="text-[10px] text-slate-400 hover:text-white underline font-semibold py-1 hover:no-underline transition"
                                      >
                                        Turn off camera / ক্যামেরা বন্ধ করুন
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-6 text-center flex flex-col items-center justify-center min-h-[160px] space-y-4 font-sans">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                      <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
                                    </div>
                                    
                                    <div className="space-y-1.5 px-4 animate-fadeIn">
                                      <h5 className="text-xs text-white font-bold uppercase tracking-wider">
                                        Device Camera Connection Required
                                      </h5>
                                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-sm">
                                        নিরাপত্তা নীতিমাালার কারণে ফাইল বা গ্যালারি থেকে পূর্বে থাকা ছবি আপলোড করার সুযোগ নেই। আপনার রিয়েল-টাইম ছবি নিশ্চিত করতে অনুগ্রহ করে নিচের বোতামটি চেপে আপনার ডিভাইস ক্যামেরাটি অন করুন।
                                      </p>
                                    </div>

                                    {cameraError && (
                                      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-100 text-[10px] leading-relaxed text-left max-w-md">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                                        <span>{cameraError}</span>
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={startCamera}
                                      className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow cursor-pointer active:scale-95"
                                    >
                                      <Video className="w-4 h-4 text-white" />
                                      <span>On Camera / ক্যামেরা সচল করুন</span>
                                    </button>

                                    <div className="w-full pt-3 border-t border-blue-500/10 flex flex-col items-center space-y-2 mt-2">
                                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">
                                        Camera not working? / ক্যামেরা কাজ না করলে:
                                      </span>
                                      <label className="px-5 py-2.5 bg-[#040e29] border border-blue-500/20 hover:border-blue-400 hover:bg-[#06153c] text-[#00e5ff] hover:text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition duration-200 cursor-pointer shadow-md">
                                        <Camera className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Upload Selfie (গ্যালারি বা সরাসরি সোর্স থেকে দিন)</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => handleFileChange(e, setUserPhoto)}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Row matching mockup */}
                    <div className="flex gap-3 pt-2">
                       <button
                        type="button"
                        onClick={() => setStep(selectedService === 'CAM' ? 2 : 3)}
                        className="flex-1 bg-transparent border border-blue-500/20 hover:border-blue-500/40 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        disabled={
                          !clientNameInput.trim() || !clientPhoneInput.trim() || !clientEmailInput.trim() ||
                          (selectedService === 'CAM'
                            ? !time || (firstTimeBooking && !userPhoto)
                            : (!date || !time) || (firstTimeBooking && !userPhoto))
                        }
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-blue-500/20 whitespace-nowrap"
                      >
                        <span>PROCEED</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 5 && (
                /* Step 5: Secure Contact Method Selection & Optional Remaining Deficit Payment Form */
                <div className="space-y-5 animate-fadeIn pb-1 opacity-100">
                  <div className="text-center pt-2 pb-4 border-b border-blue-500/10">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                      Acquisition Protocol
                    </h2>
                  </div>

                  {showOtpScreen ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-4 rounded-xl border border-blue-500/35 bg-blue-900/10 text-center space-y-2">
                        <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-widest block font-mono">
                          MANDATORY TELEGRAM SECURITY VERIFICATION (বাধ্যতামূলক নিরাপত্তা যাচাইকরণ)
                        </span>
                        <p className="text-xs text-slate-300 leading-normal">
                          আপনার প্রদানকৃত টেলিগ্রাম <b>{telegramId}</b> নম্বরে / চ্যানেলে সিকিউরিটি OTP কোড পাঠানো হয়েছে। কোডটি নিচে সাবমিট করুন।
                        </p>
                      </div>

                      {otpError && (
                        <p className="text-red-400 text-xs font-bold text-center bg-red-950/40 p-2.5 rounded-lg border border-red-500/20">{otpError}</p>
                      )}

                      {otpSuccess && (
                        <p className="text-emerald-400 text-xs font-bold text-center bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20">{otpSuccess}</p>
                      )}

                      <div className="space-y-1 text-left">
                        <label className="block text-[10px] text-[#dbaa61] uppercase tracking-wider font-extrabold text-center">
                          6-Digit Verification Code (৬-সংখ্যার কোড)
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={enteredOtp}
                          onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="e.g. 529304"
                          className="w-full bg-[#030a1c] border border-blue-500/25 text-white text-xl rounded-xl py-3 text-center font-bold tracking-[0.2em] font-mono focus:outline-none focus:border-blue-400"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOtpScreen(false);
                            setEnteredOtp('');
                            setOtpError('');
                          }}
                          className="flex-1 bg-transparent border border-blue-500/20 hover:border-blue-500/40 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={enteredOtp.length !== 6 || isSendingOtp}
                          onClick={handleFormSubmit}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-indigo-500 hover:from-emerald-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          <span>{isSendingOtp ? 'SENDING...' : 'VERIFY & CONFIRM'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                      {/* Contact Number & Telegram ID Fields */}
                      <div className="space-y-4">
                        {/* PHONE NUMBER */}
                        <div className="space-y-1.5">
                          <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider text-left">
                            SECURE PHONE NUMBER *
                          </span>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
                            <input
                              type="text"
                              required
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="e.g. +88017xxxxxxxx"
                              className="w-full bg-[#030a1c] border border-blue-500/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-400 leading-normal font-semibold font-mono placeholder:text-slate-600"
                            />
                          </div>
                        </div>


                      </div>

                      {/* Integrated Deficit Payment Box */}
                      {isDeficit ? (
                        <div className="border border-amber-500/35 bg-amber-550/10 p-3.5 rounded-xl space-y-3 font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-sm">⚠️</span>
                            <span className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wide">
                              Insufficient funds / বাকি টাকা পরিশোধ
                            </span>
                          </div>
                          <p className="text-[9.5px] text-slate-400 leading-normal font-medium text-left">
                            আপনার ওয়ালেট ব্যালেন্সের বাইরে অবশিষ্ট <strong className="text-emerald-400 font-mono">৳{deficitAmount.toLocaleString('en-US')}</strong> টাকা নিচের গেটওয়ে নম্বরে পাঠিয়ে ট্রানজেকশন আইডি প্রদান করুন।
                          </p>

                          {/* Deficit Gateway Picker */}
                          <div className="space-y-1">
                            <span className="block text-[8px] text-slate-455 font-black uppercase tracking-widest text-left">
                              Select Gateway (গেটওয়ে সিলেক্ট করুন):
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                              {displayGateways.map((g) => {
                                const isSelected = deficitMethod === g.id || deficitMethod === g.name;
                                const type = g.method.toUpperCase();
                                let bgActive = 'bg-blue-600 border-transparent text-white';
                                if (type.includes('BKASH')) bgActive = 'bg-[#e2125d] border-transparent text-white';
                                else if (type.includes('NAGAD')) bgActive = 'bg-[#f15a22] border-transparent text-white';
                                else if (type.includes('ROCKET')) bgActive = 'bg-[#8c3494] border-transparent text-white';
                                
                                return (
                                  <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => setDeficitMethod(g.name)}
                                    className={`py-1.5 px-1 truncate rounded-lg text-[9.5px] font-black uppercase text-center transition cursor-pointer border ${
                                      isSelected 
                                        ? bgActive
                                        : 'bg-slate-900 border-blue-500/10 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                                    }`}
                                    title={`${g.name} (${g.walletType})`}
                                  >
                                    {g.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Phone details copying capsule */}
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-amber-500/10 text-xs flex justify-between items-center">
                            <div className="text-left">
                              <span className="text-slate-550 block text-[8px] uppercase tracking-wider font-extrabold">
                                Receiver {selectedGateway?.name || 'Receiver'} Mobile
                              </span>
                              <span className="text-white font-mono font-bold tracking-wider text-xs select-all">
                                {selectedGateway?.number || '+৮৮০১৭১২-৩৪৫৬৭৮'}
                              </span>
                              <span className="block text-[8px] text-[#f7b749] uppercase tracking-widest mt-0.5">
                                Mode: {selectedGateway?.walletType || 'Personal'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handlePhoneCopy}
                              className="bg-amber-500/10 text-amber-400 hover:text-white text-[9px] font-bold px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                            >
                              {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>

                          {/* Dynamic Instructions */}
                          <div className="bg-black/35 p-2.5 rounded-lg border border-white/5 text-[10px] text-[#faf5ea] leading-relaxed text-left font-medium">
                            <div className="flex items-center gap-1 text-amber-450 mb-1">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-extrabold uppercase text-[8.5px] tracking-wider">Instructions (পেমেন্ট নিয়মাবলী):</span>
                            </div>
                            <p className="leading-normal">{selectedGateway?.instructions || `দয়া করে এই নম্বরে পেমেন্ট সম্পূর্ণ করুন এবং নিচে ট্রানজেকশন আইডি দিন।`}</p>
                          </div>

                          {/* Deficit TrxId Input */}
                          <div className="space-y-1">
                            <label className="block text-[8px] text-amber-400 font-extrabold uppercase tracking-wider text-left">
                              Remaining Pay Transaction ID (baki TrxID)
                            </label>
                            <input
                              type="text"
                              required
                              value={deficitTrxId}
                              onChange={(e) => setDeficitTrxId(e.target.value)}
                              placeholder="e.g. 5TRX9A2C"
                              className="w-full bg-slate-950 border border-amber-500/25 text-white font-mono rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-amber-405 uppercase text-center tracking-widest font-bold"
                            />
                          </div>

                          {/* Remaining pay screenshot upload */}
                          <div className="space-y-1">
                            <label className="block text-[8px] text-amber-400 font-extrabold uppercase tracking-wider text-left flex justify-between">
                              <span>Remaining Pay Screenshot (ঐচ্ছিক)</span>
                              {deficitScreenshot && <span className="text-emerald-400 font-black">✓ LOADED</span>}
                            </label>
                            
                            <input
                              type="file"
                              ref={deficitFileInputRef}
                              accept="image/*"
                              onChange={handleDeficitFileChange}
                              className="hidden"
                            />

                            {deficitScreenshot ? (
                              <div className="relative border border-emerald-500/30 rounded-xl overflow-hidden bg-slate-950 p-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={deficitScreenshot} 
                                    alt="Payment Screenshot Preview" 
                                    className="w-8 h-8 object-cover rounded border border-white/5"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div>
                                    <p className="text-[9px] font-bold text-emerald-400">Screenshot Attached</p>
                                    <p className="text-[7.5px] text-slate-500">Image successfully loaded</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setDeficitScreenshot('')}
                                  className="text-red-400 hover:text-red-300 p-1 bg-red-500/10 hover:bg-red-500/20 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => deficitFileInputRef.current?.click()}
                                className="w-full bg-slate-950 border border-dashed border-amber-500/15 hover:border-amber-500/30 rounded-xl p-2 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-900/40 transition-all text-slate-400"
                              >
                                <Upload className="w-3.5 h-3.5 text-amber-400/80" />
                                <span className="text-[9px] font-bold text-slate-350">
                                  {deficitUploading ? 'Processing Screenshot...' : 'Upload Payment Screenshot'}
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                          <span className="text-emerald-400 text-xs">⭐</span>
                          <p className="text-[10px] font-black text-emerald-300 tracking-wide text-center">
                            Full Booking covered by your wallet balance!
                          </p>
                        </div>
                      )}

                      {/* Bottom buttons row */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setStep(4)}
                          className="flex-1 bg-transparent border border-blue-500/20 hover:border-blue-500/40 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          disabled={!getActiveContactValue().trim() || (isDeficit && deficitTrxId.trim().length < 8)}
                          className="flex-1 bg-gradient-to-r from-emerald-600 to-indigo-500 hover:from-emerald-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-500/20 whitespace-nowrap"
                        >
                          <span>CONFIRM BOOKING</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
