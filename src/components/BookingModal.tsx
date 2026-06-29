import { Companion, PaymentGateway, PromoCode } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Moon, MapPin, Sparkles, User, Video, Heart, Users, ArrowRight, ArrowLeft, Home, Car, ChevronDown, MessageSquare, Phone, Send, CheckCircle2, Copy, Check, Info, Camera, AlertTriangle, Upload, Trash2, Tag, Percent, Receipt, FileText, Crown } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { compressImage } from '../services/imageService';
import { db, collection, onSnapshot, doc, setDoc } from '../firebase';

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
  onGoToMembership?: () => void;
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
  initialLocationId,
  onGoToMembership
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
        address: l.address || l.location || l.name,
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
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState('PM');
  const [time, setTime] = useState('');

  useEffect(() => {
    let hr = parseInt(selectedHour, 10);
    if (selectedAmPm === 'PM' && hr < 12) hr += 12;
    if (selectedAmPm === 'AM' && hr === 12) hr = 0;
    const timeStr = `${String(hr).padStart(2, '0')}:${selectedMinute}`;
    setTime(timeStr);
  }, [selectedHour, selectedMinute, selectedAmPm]);

  const [notes, setNotes] = useState('');
  const [commsChannel, setCommsChannel] = useState<'PHONE' | 'WHATSAPP' | 'TELEGRAM'>('WHATSAPP');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [secretCode, setSecretCode] = useState<string>('');
  const [showThankyou, setShowThankyou] = useState<boolean>(false);

  // Acquisition Invoice & Promo Code States
  const [showInvoice, setShowInvoice] = useState<boolean>(false);
  const [promoDiscountPercent, setPromoDiscountPercent] = useState<number>(35); // 35% default
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [promoMessage, setPromoMessage] = useState<string>('');
  const [promoError, setPromoError] = useState<string>('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');
  const [dbPromoCodes, setDbPromoCodes] = useState<PromoCode[]>([]);

  // Subscribe to promo codes from DB
  useEffect(() => {
    const colRef = collection(db, 'promo_codes');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const codes: PromoCode[] = [];
      snapshot.forEach((doc: any) => {
        codes.push({ id: doc.id, ...doc.data() });
      });
      setDbPromoCodes(codes);
    }, (err) => {
      console.warn("Error loading promo codes in BookingModal:", err);
    });
    return () => unsubscribe();
  }, []);

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
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [shareError, setShareError] = useState('');
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
  
  const discountAmount = Math.round(companionCost * (promoDiscountPercent / 100));
  const bookingCost = companionCost - discountAmount + hotelCost;
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
    if (commsChannel === 'PHONE') return phoneNumber;
    if (commsChannel === 'WHATSAPP') return whatsappNumber;
    return telegramId;
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

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) return;
    
    setPromoError('');
    setPromoMessage('');
    setAppliedPromoCode('');
    
    // First, search in dynamic database promo codes
    const dbPromo = dbPromoCodes.find(p => p.code.toUpperCase() === code);
    if (dbPromo) {
      if (!dbPromo.isActive) {
        setPromoError('This promo code is currently inactive.');
        return;
      }
      if (dbPromo.maxUses !== undefined && dbPromo.maxUses !== null && dbPromo.usedCount >= dbPromo.maxUses) {
        setPromoError('This promo code has reached its usage limit.');
        return;
      }
      setPromoDiscountPercent(dbPromo.discountPercent);
      setPromoMessage(`Success! ${dbPromo.discountPercent}% discount code "${dbPromo.code}" has been applied (${dbPromo.description}).`);
      setAppliedPromoCode(dbPromo.code);
      return;
    }

    // Fallback to pre-configured static promo codes
    if (code === 'VIP50' || code === 'BODY50') {
      setPromoDiscountPercent(50);
      setPromoMessage('Success! 50% discount has been applied to your acquisition subtotal.');
    } else if (code === 'VIP40') {
      setPromoDiscountPercent(40);
      setPromoMessage('Success! 40% discount has been applied to your acquisition subtotal.');
    } else if (code === 'VIP100' || code === 'FREE') {
      setPromoDiscountPercent(100);
      setPromoMessage('Secret Promo Activated! 100% discount applied.');
    } else if (code === 'VIP35') {
      setPromoDiscountPercent(35);
      setPromoMessage('Promo code VIP35 is already active (35% standard discount).');
    } else {
      setPromoDiscountPercent(45);
      setPromoMessage(`Success! Promo code "${code}" applied (Special 45% VIP discount unlocked).`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeVal = getActiveContactValue();
    const resolvedDate = selectedService === 'CAM' ? (date || 'Today (Virtual CAM)') : date;
    if (!resolvedDate || !time) return;

    if (commsChannel === 'PHONE' && !phoneNumber.trim()) return;
    if (commsChannel === 'WHATSAPP' && !whatsappNumber.trim()) return;
    if (commsChannel === 'TELEGRAM' && !telegramId.trim()) return;

    if (isDeficit) {
      if (!deficitTrxId || deficitTrxId.trim().length < 8) return;
    }

    if (!showInvoice) {
      setShowInvoice(true);
      return;
    }

    // OTP verification has been disabled as requested by user. Proceed directly to booking confirmation.

    // Collate all filled contacts
    const contactsCollated: string[] = [];
    if (commsChannel === 'PHONE') {
      contactsCollated.push(`Phone: ${phoneNumber.trim()}`);
    } else if (commsChannel === 'WHATSAPP') {
      contactsCollated.push(`WhatsApp: ${whatsappNumber.trim()}`);
    } else if (commsChannel === 'TELEGRAM') {
      contactsCollated.push(`Telegram: ${telegramId.trim()}`);
    }
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
      clientName: (clientNameInput.trim() || defaultClientName || localStorage.getItem('bt_fullname') || 'Guest Client').trim(),
      clientPhone: (clientPhoneInput.trim() || defaultClientPhone || localStorage.getItem('bt_phone') || activeVal || '01700000000').trim(),
      clientEmail: (clientEmailInput.trim() || defaultClientEmail || localStorage.getItem('bt_email') || 'client@bodytouch.com').trim()
    };

    setLastSubmittedData(bookingPayload);
    setShowOtpScreen(false);
    setShowThankyou(true);
  };

  const handleFinalize = () => {
    if (lastSubmittedData) {
      onSubmit(lastSubmittedData);
    }
    
    // Increment usedCount if a dynamic promo code was applied
    if (appliedPromoCode) {
      const matchedPromo = dbPromoCodes.find(p => p.code.toUpperCase() === appliedPromoCode.toUpperCase());
      if (matchedPromo) {
        const promoRef = doc(db, 'promo_codes', matchedPromo.id);
        setDoc(promoRef, {
          ...matchedPromo,
          usedCount: matchedPromo.usedCount + 1
        }).catch(err => console.warn("Failed to increment usedCount for promo:", err));
      }
    }

    // Reset state
    setDate('');
    setTime('');
    setSelectedHour('12');
    setSelectedMinute('00');
    setSelectedAmPm('PM');
    setSpecificAddress('');
    setSelectedTimeFrame('2_HOURS');
    setPromoDiscountPercent(35); // Reset discount to default
    setPromoCodeInput('');
    setPromoMessage('');
    setPromoError('');
    setAppliedPromoCode('');
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

                  {/* Demo Complete & Membership CTA */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-3 text-left shadow-[0_0_20px_rgba(245,158,11,0.08)]">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <span className="text-sm">⭐</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                        Trial Experience Complete / ডেমো সম্পন্ন
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-200 font-bold leading-relaxed">
                      ইহা একটি ডেমো সার্ভিস ছিল। আপনি যদি আসল এবং লাইভ সার্ভিস উপভোগ করতে চান, তবে দয়া করে একটি মেম্বারশিপ প্ল্যান সক্রিয় করুন।
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold leading-relaxed border-t border-amber-500/10 pt-2">
                      (This was a demo simulation. If you want a real experience with live companions, please acquire a membership.)
                    </p>

                    {onGoToMembership && (
                      <button
                        type="button"
                        onClick={() => {
                          handleFinalize();
                          onGoToMembership();
                        }}
                        className="w-full mt-1 bg-gradient-to-tr from-[#a67c33] via-[#dbaa61] to-[#f1d087] hover:brightness-110 text-slate-950 font-black uppercase text-[10.5px] tracking-widest py-3 rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-[#dbaa61]/25 flex items-center justify-center gap-2"
                      >
                        👑 মেম্বারশিপ নিন (Get Membership)
                      </button>
                    )}
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
                      <span className="text-[9px] text-[#dbaa61] font-black block uppercase tracking-wider">Service Fee</span>
                      <span className="font-extrabold text-[#dbaa61] font-mono text-base tracking-wide flex items-center gap-1 mt-0.5">
                        <span className="inline-block text-[#dbaa61] drop-shadow-[0_0_10px_rgba(219,170,97,0.5)]">৳{bookingCost.toLocaleString('en-US')}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Wallet Balance</span>
                      <span className="font-extrabold text-slate-200 font-mono text-sm mt-0.5 block">৳{walletBalance.toLocaleString('en-US')}</span>
                    </div>
                  </div>

                  {/* Demo Trial Mode Notice */}
                  <div className="mb-4 bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5 flex items-start gap-2.5 shadow-[0_0_15px_rgba(245,158,11,0.05)] animate-fadeIn">
                    <span className="text-amber-400 text-sm mt-0.5 shrink-0">⚠️</span>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                        Demo Booking Trial Active / ডেমো বুকিং ট্রায়াল
                      </p>
                      <p className="text-[10px] text-slate-300 font-bold mt-1 leading-normal">
                        এটি একটি ডেমো বুকিং প্রক্রিয়া। আসল এবং লাইভ সার্ভিস উপভোগ করতে মেম্বারশিপ প্রয়োজন।
                      </p>
                      <p className="text-[8.5px] text-slate-400 font-semibold mt-0.5 leading-normal">
                        (This is a demo booking simulation. Upgrade to VIP membership to book active models).
                      </p>
                    </div>
                  </div>

                  {hotelCost > 0 && (
                    <div className="mb-4 text-[10px] text-blue-300 bg-blue-950/25 border border-blue-500/15 rounded-xl py-2.5 px-4 flex justify-between font-mono animate-fadeIn">
                      <span className="font-semibold">Companion Rate: ৳{companionCost.toLocaleString('en-US')}</span>
                      <span className="font-semibold text-amber-400">Hotel Venue: +৳{hotelCost.toLocaleString('en-US')}</span>
                    </div>
                  )}

                  {step === 1 && (
                /* Step 1: Select Service - Choose Experience */
                <div className="space-y-6">
                  <div className="text-center pt-2 pb-4 border-b border-[#dbaa61]/10">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                      Acquisition Protocol
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">
                      SELECT SERVICE
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
                                ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                            }`}
                          >
                            <User className={`w-6 h-6 ${selectedService === 'REAL' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white">REAL</span>
                          </button>

                          {/* CAM SERVICE VIEW */}
                          <button
                            type="button"
                            onClick={() => handleServiceChange('CAM')}
                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 group cursor-pointer ${
                              selectedService === 'CAM'
                                ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                            }`}
                          >
                            <Video className={`w-6 h-6 ${selectedService === 'CAM' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white leading-none">CAM</span>
                          </button>

                          {/* MAKE OUT SERVICE VIEW */}
                          <button
                            type="button"
                            onClick={() => handleServiceChange('MAKE_OUT')}
                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 group cursor-pointer ${
                              selectedService === 'MAKE_OUT'
                                ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                            }`}
                          >
                            <Heart className={`w-6 h-6 ${selectedService === 'MAKE_OUT' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white leading-none">MAKE OUT</span>
                          </button>

                          {/* LIVE TOGETHER VIEW */}
                          <button
                            type="button"
                            onClick={() => handleServiceChange('LIVE_TOGETHER')}
                            className={`p-5 rounded-xl border text-center flex flex-col items-center justify-center space-y-2 transition-all duration-300 group cursor-pointer ${
                              selectedService === 'LIVE_TOGETHER'
                                ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                            }`}
                          >
                            <Users className={`w-6 h-6 ${selectedService === 'LIVE_TOGETHER' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-white leading-none">LIVE TOGETHER</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black font-black uppercase text-[11px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-[#dbaa61]/20 hover:brightness-110 animate-pulse"
                  >
                    <span>PROCEED</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black font-black" />
                  </button>
                </div>
              )}

              {step === 2 && (
                /* Step 2: Choose Duration - Select Time Frame Options */
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center pt-2 pb-4 border-b border-[#dbaa61]/10">
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
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '30_MIN' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">30 MIN</span>
                        </button>

                        {/* 1 HOUR */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('1_HOUR')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '1_HOUR'
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '1_HOUR' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">1 HOUR</span>
                        </button>

                        {/* 2 HOURS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('2_HOURS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '2_HOURS'
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '2_HOURS' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
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
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '2_DAYS' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">2 DAYS</span>
                        </button>

                        {/* 7 DAYS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('7_DAYS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '7_DAYS'
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '7_DAYS' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">7 DAYS</span>
                        </button>

                        {/* 15 DAYS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('15_DAYS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '15_DAYS'
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '15_DAYS' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">15 DAYS</span>
                        </button>

                        {/* 1 MONTH */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('1_MONTH')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '1_MONTH'
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Calendar className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '1_MONTH' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
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
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '1_HOUR' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">1 HOUR</span>
                        </button>

                        {/* 2 HOURS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('2_HOURS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '2_HOURS'
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '2_HOURS' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">2 HOURS</span>
                        </button>

                        {/* 3 HOURS */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimeFrame('3_HOURS')}
                          className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                            selectedTimeFrame === '3_HOURS'
                              ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                              : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                          }`}
                        >
                          <Clock className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === '3_HOURS' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-wider">3 HOURS</span>
                        </button>

                        {/* FULL NIGHT */}
                        {selectedService !== 'MAKE_OUT' && (
                          <button
                            type="button"
                            onClick={() => setSelectedTimeFrame('FULL_NIGHT')}
                            className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                              selectedTimeFrame === 'FULL_NIGHT'
                                ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                            }`}
                          >
                            <Moon className={`w-5 h-5 mb-1.5 ${selectedTimeFrame === 'FULL_NIGHT' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
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
                      className="flex-1 bg-transparent border border-[#dbaa61]/20 hover:border-[#dbaa61]/45 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap hover:text-white"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#dbaa61]" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(selectedService === 'CAM' ? 4 : 3)}
                      className="flex-1 bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-[#dbaa61]/20 whitespace-nowrap hover:brightness-110"
                    >
                      <span>Proceed</span>
                      <ArrowRight className="w-3.5 h-3.5 text-black font-black" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                /* Step 3: Choose Location & Meeting Venue */
                <div className="space-y-6 animate-fadeIn pb-1">
                  <div className="text-center pt-2 pb-4 border-b border-[#dbaa61]/10">
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
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#dbaa61] pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={specificAddress}
                            onChange={(e) => setSpecificAddress(e.target.value)}
                            placeholder="Specify restaurant name & address..."
                            className="w-full bg-[#030a1c] border border-[#dbaa61]/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#dbaa61]/40 leading-normal font-semibold placeholder:text-slate-600"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                          MEETING TYPE / সেবার ভেন্যু
                        </span>

                        <div className="grid grid-cols-2 gap-3">
                          {/* INCALL (OUR PLACE) */}
                          <button
                            type="button"
                            onClick={() => handleCoordinatesTypeChange('INCALL')}
                            className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 cursor-pointer ${
                              coordinatesType === 'INCALL'
                                ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                            }`}
                          >
                            <Home className={`w-5 h-5 ${coordinatesType === 'INCALL' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider">INCALL (OUR PLACE)</span>
                          </button>

                          {/* OUTCALL (YOURS) */}
                          <button
                            type="button"
                            onClick={() => handleCoordinatesTypeChange('OUTCALL')}
                            className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 cursor-pointer ${
                              coordinatesType === 'OUTCALL'
                                ? 'bg-[#dbaa61]/15 border-[#dbaa61] shadow-[0_0_15px_rgba(219,170,97,0.15)] text-white'
                                : 'bg-[#030a1c]/80 border-[#dbaa61]/10 hover:border-[#dbaa61]/25 text-slate-400'
                            }`}
                          >
                            <Car className={`w-5 h-5 ${coordinatesType === 'OUTCALL' ? 'text-[#dbaa61]' : 'text-slate-400'}`} />
                            <span className="text-[10px] font-black uppercase tracking-wider">OUTCALL (YOURS)</span>
                          </button>
                        </div>

                        {coordinatesType === 'INCALL' ? (
                          <div className="space-y-3 relative">
                            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                              SELECT PREMIUM HOTEL / SANCTUARY
                            </span>
                            
                            {/* Custom premium dropdown selector with down arrow */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setIsAddressDropdownOpen(!isAddressDropdownOpen)}
                                className="w-full bg-[#030a1c] border border-[#dbaa61]/25 hover:border-[#dbaa61]/40 text-left rounded-xl p-3.5 focus:outline-none flex justify-between items-center transition duration-200 cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <MapPin className="w-4 h-4 text-[#dbaa61] shrink-0" />
                                  <div className="truncate">
                                    <p className="text-[11px] font-black text-[#dbaa61] leading-tight flex items-center gap-1.5">
                                      <span>
                                        {sanctuaries.find(s => s.address === specificAddress)?.name || '-- Choose Safehouse --'}
                                      </span>
                                      {sanctuaries.find(s => s.address === specificAddress) && (
                                        <span className="text-[9px] text-amber-400 bg-amber-450/10 border border-amber-550/20 rounded px-1.5 py-0.2 font-mono">
                                          +৳{sanctuaries.find(s => s.address === specificAddress)?.price.toLocaleString()}
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-mono truncate leading-none mt-1 font-semibold">
                                      {specificAddress || 'Choose a safehouse address...'}
                                    </p>
                                  </div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isAddressDropdownOpen ? 'rotate-180 text-[#dbaa61]' : ''}`} />
                              </button>

                              {/* Predefined Sanctuaries list revealed by down-arrow click */}
                              {isAddressDropdownOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="absolute top-full left-0 right-0 z-30 mt-1 bg-[#030a1c] border border-[#dbaa61]/30 rounded-xl overflow-hidden shadow-2xl max-h-[170px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#dbaa61]/20"
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
                                        className={`w-full p-3 text-left transition-all duration-200 cursor-pointer text-xs flex flex-col space-y-0.5 border-b border-[#dbaa61]/5 last:border-0 ${
                                          isSelected
                                            ? 'bg-[#dbaa61]/15 text-white font-bold'
                                            : 'hover:bg-slate-900/40 text-slate-400'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center w-full gap-2 text-left">
                                          <span className={`font-black text-[11px] truncate ${isSelected ? 'text-[#dbaa61]' : 'text-[#dbaa61]'}`}>
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
                              <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                                CONFIRMED VENUE ADDRESS / ভেন্যু ঠিকানা
                              </span>
                              <div className="p-3 bg-[#030a1c]/90 border border-[#dbaa61]/10 rounded-xl text-xs text-white font-semibold font-mono truncate flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-[#dbaa61] shrink-0" />
                                <span className="truncate">{specificAddress}</span>
                              </div>
                              {specificAddress && (
                                <div className="pt-2 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(specificAddress);
                                      setCopiedAddress(true);
                                      setTimeout(() => setCopiedAddress(false), 2000);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition cursor-pointer select-none"
                                  >
                                    {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#dbaa61]" />}
                                    {copiedAddress ? 'Copied!' : 'Copy Location (কপি করুন)'}
                                  </button>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specificAddress)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[9.5px] font-black uppercase tracking-wider transition cursor-pointer select-none"
                                  >
                                    <MapPin className="w-3.5 h-3.5 text-[#dbaa61]" />
                                    Map View (ম্যাপ)
                                  </a>
                                  <a
                                    href={`https://wa.me/?text=${encodeURIComponent(`📍 Body Touch Sanctuary Location: ${specificAddress}\nGoogle Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(specificAddress)}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-[9.5px] font-black uppercase tracking-wider transition cursor-pointer select-none"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    WhatsApp Share
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                              SPECIFIC ADDRESS
                            </span>
                            <div className="relative">
                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#dbaa61] pointer-events-none" />
                              <input
                                type="text"
                                required
                                value={specificAddress}
                                onChange={(e) => setSpecificAddress(e.target.value)}
                                placeholder="Detailed coordinates..."
                                className="w-full bg-[#030a1c] border border-[#dbaa61]/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#dbaa61]/40 leading-normal font-semibold placeholder:text-slate-600"
                              />
                            </div>
                            <div className="pt-1.5">
                              <button
                                type="button"
                                disabled={sharingLocation}
                                onClick={() => {
                                  setSharingLocation(true);
                                  setShareError('');
                                  if (!navigator.geolocation) {
                                    setShareError('Geolocation details are unsupported by your device / browser.');
                                    setSharingLocation(false);
                                    return;
                                  }
                                  navigator.geolocation.getCurrentPosition(
                                    (pos) => {
                                      const lat = pos.coords.latitude;
                                      const lng = pos.coords.longitude;
                                      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                                      setSpecificAddress(`Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)} (${mapsUrl})`);
                                      setSharingLocation(false);
                                    },
                                    (err) => {
                                      console.error("GPS error:", err);
                                      setShareError('GPS lookup failed. Please grant location permissions in your browser or type manually.');
                                      setSharingLocation(false);
                                    },
                                    { enableHighAccuracy: true, timeout: 8000 }
                                  );
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#dbaa61]/10 border border-[#dbaa61]/15 text-[#dbaa61] hover:text-white text-[10px] font-black uppercase tracking-wider transition cursor-pointer select-none disabled:opacity-50"
                              >
                                <MapPin className="w-3.5 h-3.5 animate-pulse text-[#dbaa61]" />
                                {sharingLocation ? 'Fetching Live GPS...' : '📍 Share My Current GPS Location (আমার লোকেশন)'}
                              </button>
                              {shareError && (
                                <p className="text-[9px] text-rose-400 mt-1 font-semibold">{shareError}</p>
                              )}
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
                      className="flex-1 bg-transparent border border-[#dbaa61]/20 hover:border-[#dbaa61]/45 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap hover:text-white"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#dbaa61]" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      disabled={!specificAddress.trim()}
                      onClick={() => setStep(4)}
                      className="flex-1 bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black disabled:opacity-40 disabled:cursor-not-allowed font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-[#dbaa61]/20 whitespace-nowrap hover:brightness-110"
                    >
                      <span>Proceed</span>
                      <ArrowRight className="w-3.5 h-3.5 text-black font-black" />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                /* Step 4: Choose Date & Time Schedule */
                <div className="space-y-6 animate-fadeIn pb-1">
                  <div className="text-center pt-2 pb-4 border-b border-[#dbaa61]/10">
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
                            SELECT SERVICE DATE
                          </span>
                          
                          {/* Calendar Card Panel */}
                          <div className="bg-[#030a1c] border border-[#dbaa61]/25 p-4 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between border-b border-[#dbaa61]/10 pb-2.5">
                              <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 px-2.5 rounded-lg bg-[#dbaa61]/5 hover:bg-[#dbaa61]/15 border border-[#dbaa61]/10 text-[#dbaa61] text-xs font-black transition cursor-pointer"
                              >
                                ◀
                              </button>
                              <div className="text-center">
                                <span className="text-white text-xs font-extrabold block">
                                  {months[month]} {year}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                  {bnMonths[month]} {year}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 px-2.5 rounded-lg bg-[#dbaa61]/5 hover:bg-[#dbaa61]/15 border border-[#dbaa61]/10 text-[#dbaa61] text-xs font-black transition cursor-pointer"
                              >
                                ▶
                              </button>
                            </div>

                            {/* Weekday headers */}
                            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-500 uppercase font-mono">
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
                                        ? 'bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black shadow-md shadow-[#dbaa61]/20'
                                        : 'text-slate-300 hover:bg-[#dbaa61]/10 hover:text-white'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Selected Date Summary */}
                            {date && (
                              <div className="border-t border-[#dbaa61]/10 pt-2 text-center">
                                <span className="text-[10px] text-[#dbaa61] font-bold">
                                  Selected Date: <strong className="text-white font-mono select-all font-black">{date}</strong>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Manual Clock System Selection */}
                    <div className="space-y-3">
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        SELECT SERVICE TIME
                      </span>
                      
                      <div className="bg-[#030a1c] border border-[#dbaa61]/25 p-4 rounded-xl space-y-4">
                        {/* Selected Time Display */}
                        <div className="flex items-center justify-center gap-2 py-3 bg-[#dbaa61]/5 border border-[#dbaa61]/10 rounded-xl">
                          <Clock className="w-5 h-5 text-[#dbaa61]" />
                          <span className="text-xl font-black text-[#dbaa61] tracking-widest font-mono">
                            {selectedHour}:{selectedMinute} {selectedAmPm}
                          </span>
                        </div>

                        {/* Inline Selector Menus */}
                        <div className="grid grid-cols-3 gap-3">
                          {/* Hour select */}
                          <div className="space-y-1.5">
                            <span className="block text-[9px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
                              HOUR
                            </span>
                            <div className="relative">
                              <select
                                value={selectedHour}
                                onChange={(e) => setSelectedHour(e.target.value)}
                                className="w-full bg-black/40 border border-[#dbaa61]/10 rounded-xl px-3 py-2.5 text-xs text-white font-black font-mono focus:border-[#dbaa61]/50 focus:ring-1 focus:ring-[#dbaa61] outline-none appearance-none cursor-pointer"
                              >
                                {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((hr) => (
                                  <option key={hr} value={hr} className="bg-[#030a1c] text-white font-mono">
                                    {hr}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-[#dbaa61]/70 text-[8px]">
                                ▼
                              </div>
                            </div>
                          </div>

                          {/* Minute select */}
                          <div className="space-y-1.5">
                            <span className="block text-[9px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
                              MINUTE
                            </span>
                            <div className="relative">
                              <select
                                value={selectedMinute}
                                onChange={(e) => setSelectedMinute(e.target.value)}
                                className="w-full bg-black/40 border border-[#dbaa61]/10 rounded-xl px-3 py-2.5 text-xs text-white font-black font-mono focus:border-[#dbaa61]/50 focus:ring-1 focus:ring-[#dbaa61] outline-none appearance-none cursor-pointer"
                              >
                                {['00', '15', '30', '45'].map((min) => (
                                  <option key={min} value={min} className="bg-[#030a1c] text-white font-mono">
                                    {min}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-[#dbaa61]/70 text-[8px]">
                                ▼
                              </div>
                            </div>
                          </div>

                          {/* Period select */}
                          <div className="space-y-1.5">
                            <span className="block text-[9px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
                              PERIOD
                            </span>
                            <div className="relative">
                              <select
                                value={selectedAmPm}
                                onChange={(e) => setSelectedAmPm(e.target.value)}
                                className="w-full bg-black/40 border border-[#dbaa61]/10 rounded-xl px-3 py-2.5 text-xs text-white font-black focus:border-[#dbaa61]/50 focus:ring-1 focus:ring-[#dbaa61] outline-none appearance-none cursor-pointer"
                              >
                                {['AM', 'PM'].map((period) => (
                                  <option key={period} value={period} className="bg-[#030a1c] text-white">
                                    {period}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-[#dbaa61]/70 text-[8px]">
                                ▼
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Special Notes/Directives Input */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                        SPECIAL DIRECTIVES (OPT)
                      </span>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 w-4 h-4 text-[#dbaa61] pointer-events-none" />
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Any strict requirements..."
                          className="w-full bg-[#030a1c] border border-[#dbaa61]/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#dbaa61]/45 leading-relaxed font-semibold placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    {/* First-Time Booking Verification (Auto-Detected) */}
                    {firstTimeBooking && (
                      <div className="border border-[#dbaa61]/10 bg-[#030a1c] p-4 rounded-xl space-y-4 animate-in fade-in duration-200">
                        <div className="text-left border-b border-[#dbaa61]/10 pb-2.5 flex items-center justify-between">
                          <div>
                            <span className="block text-[10px] text-[#dbaa61] font-extrabold uppercase tracking-wider font-mono">
                              SECURE SELFIE VERIFICATION
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium tracking-tight">
                              (Real-time live photo required)
                            </span>
                          </div>
                          <span className="text-[8px] bg-red-550/20 text-red-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider font-mono animate-pulse">
                            Mandatory
                          </span>
                        </div>

                        <div className="space-y-4 pt-1">
                          <div className="p-2.5 bg-[#dbaa61]/5 border border-[#dbaa61]/20 rounded-lg text-left">
                            <p className="text-[10px] text-slate-300 leading-normal font-medium">
                              🔒 As a first-time client, a real-time live selfie is required to verify identity and ensure safety. Please capture or upload a clear photo below.
                            </p>
                          </div>

                          <div className="space-y-1.5 text-left">
                            <label className="block text-[9.5px] text-slate-300 font-bold uppercase tracking-wider font-sans">
                              Live Selfie Photo
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
                                  <span className="text-[10px] text-emerald-400 font-extrabold tracking-wide uppercase font-mono">
                                    SELFIE CAPTURED
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    Verification selfie registered
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setUserPhoto('')}
                                    className="text-[9px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20 mt-1 transition-all font-bold cursor-pointer"
                                  >
                                    Retake Selfie
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative overflow-hidden rounded-xl bg-black/50 border border-[#dbaa61]/25">
                                {cameraActive ? (
                                  <div className="p-3 flex flex-col items-center space-y-4 font-sans">
                                    {/* Video frame with biometric targeting box overlay */}
                                    <div className="relative w-full max-w-[280px] aspect-square rounded-xl overflow-hidden border border-[#dbaa61]/35 bg-black">
                                      <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                      ></video>
                                      
                                      {/* Biometric Guide Overlay */}
                                      <div className="absolute inset-0 border-[3px] border-[#dbaa61]/35 m-6 rounded-full pointer-events-none animate-pulse">
                                        <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-amber-500/50 -translate-y-1/2 animate-bounce" />
                                      </div>
                                      
                                      <div className="absolute bottom-2 left-0 right-0 text-center">
                                        <span className="bg-black/75 text-[8px] text-[#dbaa61] font-bold px-2 py-0.5 rounded uppercase tracking-widest font-mono">
                                          [ LIVE CAMERA ACTIVE ]
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
                                        className="px-6 py-3 bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer hover:brightness-110"
                                      >
                                        <Camera className="w-4 h-4 text-black" />
                                        <span>CAPTURE SELFIE</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="text-[10px] text-slate-400 hover:text-white underline font-semibold py-1 hover:no-underline transition cursor-pointer"
                                      >
                                        Turn off camera
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-6 text-center flex flex-col items-center justify-center min-h-[160px] space-y-4 font-sans">
                                    <div className="w-12 h-12 rounded-full bg-[#dbaa61]/10 flex items-center justify-center border border-[#dbaa61]/20">
                                      <Camera className="w-5 h-5 text-[#dbaa61] animate-pulse" />
                                    </div>
                                    
                                    <div className="space-y-1.5 px-4 animate-fadeIn">
                                      <h5 className="text-xs text-white font-bold uppercase tracking-wider">
                                        Device Camera Connection Required
                                      </h5>
                                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-sm">
                                        Please turn on your camera and snap a live selfie to proceed.
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
                                      className="px-5 py-3 bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow cursor-pointer active:scale-95 hover:brightness-110"
                                    >
                                      <Video className="w-4 h-4 text-black" />
                                      <span>On Camera</span>
                                    </button>

                                    <div className="w-full pt-3 border-t border-[#dbaa61]/10 flex flex-col items-center space-y-2 mt-2">
                                      <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">
                                        Camera not working?
                                      </span>
                                      <label className="px-5 py-2.5 bg-[#030a1c] border border-[#dbaa61]/25 hover:border-[#dbaa61]/45 hover:bg-[#dbaa61]/5 text-[#dbaa61] hover:text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 transition duration-200 cursor-pointer shadow-md">
                                        <Camera className="w-3.5 h-3.5 text-[#dbaa61]" />
                                        <span>Upload Selfie</span>
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
                        className="flex-1 bg-transparent border border-[#dbaa61]/20 hover:border-[#dbaa61]/45 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap hover:text-white"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#dbaa61]" />
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        disabled={
                          selectedService === 'CAM'
                            ? !time || (firstTimeBooking && !userPhoto)
                            : (!date || !time) || (firstTimeBooking && !userPhoto)
                        }
                        className="flex-1 bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black disabled:opacity-40 disabled:cursor-not-allowed font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-[#dbaa61]/20 whitespace-nowrap hover:brightness-110"
                      >
                        <span>PROCEED</span>
                        <ArrowRight className="w-3.5 h-3.5 text-black font-black" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {step === 5 && (
                /* Step 5: Secure Contact Method Selection & Optional Remaining Deficit Payment Form */
                <div className="space-y-5 animate-fadeIn pb-1 opacity-100">
                  <div className="text-center pt-2 pb-4 border-b border-[#dbaa61]/10">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-display">
                      Acquisition Protocol
                    </h2>
                  </div>

                  {showInvoice ? (
                    <div className="space-y-4 animate-fadeIn text-left">
                      {/* Invoice Container Card */}
                      <div className="bg-[#030a1c] border border-[#dbaa61]/25 p-5 rounded-2xl space-y-4 shadow-[0_0_20px_rgba(219,170,97,0.05)]">
                        {/* Center Icon & Heading */}
                        <div className="flex flex-col items-center justify-center text-center space-y-2 py-2">
                          <div className="p-3 bg-[#dbaa61]/10 rounded-full text-[#dbaa61] border border-[#dbaa61]/20">
                            <Receipt className="w-8 h-8" />
                          </div>
                          <h3 className="text-lg font-black text-white tracking-wider uppercase font-display">
                            Acquisition Invoice
                          </h3>
                        </div>

                        <div className="border-t border-[#dbaa61]/10 pt-4 space-y-3">
                          {/* Base Service Value */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 text-slate-400 font-bold">
                              <Tag className="w-3.5 h-3.5 text-[#dbaa61]" />
                              <span>Base Service Value</span>
                            </div>
                            <span className="font-semibold text-slate-200 font-mono">
                              ৳{Math.round(selectedService === 'REAL' ? (companion.rateReal || companion.rate) : selectedService === 'CAM' ? (companion.rateCam || companion.rate * 0.55) : selectedService === 'MAKE_OUT' ? (companion.rateMakeOut || companion.rate * 0.65) : (companion.rateLiveTogether || companion.rate)).toLocaleString('en-US')} x {getDurationString()}
                            </span>
                          </div>

                          {/* Subtotal */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 text-slate-400 font-bold">
                              <FileText className="w-3.5 h-3.5 text-[#dbaa61]" />
                              <span>Subtotal</span>
                            </div>
                            <span className="font-semibold text-slate-200 font-mono">
                              ৳{companionCost.toLocaleString('en-US')}
                            </span>
                          </div>

                          {/* Hotel Venue (if any) */}
                          {hotelCost > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-2 text-slate-400 font-bold">
                                <Home className="w-3.5 h-3.5 text-amber-500" />
                                <span>Hotel Venue</span>
                              </div>
                              <span className="font-semibold text-slate-200 font-mono">
                                + ৳{hotelCost.toLocaleString('en-US')}
                              </span>
                            </div>
                          )}

                          {/* Applied Discount */}
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2 text-slate-400 font-bold">
                              <Percent className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Applied Discount(s)</span>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-[#06241a] border border-emerald-500/25 text-[#10b981] font-bold font-mono text-[10px] tracking-wide">
                              - ৳{discountAmount.toLocaleString('en-US')}
                            </span>
                          </div>
                        </div>

                        {/* Promo Code Form */}
                        <div className="border-t border-[#dbaa61]/10 pt-4 space-y-2">
                          <label className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-mono">
                            Have a Promo Code?
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoCodeInput}
                              onChange={(e) => setPromoCodeInput(e.target.value)}
                              placeholder="ENTER CODE"
                              className="flex-1 bg-black/40 border border-[#dbaa61]/20 rounded-xl px-4 py-2.5 text-xs font-bold text-white tracking-widest placeholder:text-slate-600 focus:outline-none focus:border-[#dbaa61]/60 font-mono uppercase"
                            />
                            <button
                              type="button"
                              onClick={handleApplyPromo}
                              className="bg-[#dbaa61] text-black font-black text-[10px] tracking-widest px-5 py-2.5 rounded-xl hover:brightness-110 uppercase transition duration-200 shadow-md shadow-[#dbaa61]/20 cursor-pointer shrink-0"
                            >
                              APPLY
                            </button>
                          </div>
                          {promoMessage && (
                            <p className="text-emerald-400 text-[10px] font-bold mt-1 bg-emerald-950/20 p-2 rounded-lg border border-emerald-500/20 leading-relaxed">
                              {promoMessage}
                            </p>
                          )}
                          {promoError && (
                            <p className="text-red-400 text-[10px] font-bold mt-1 bg-red-950/20 p-2 rounded-lg border border-red-500/20 leading-relaxed">
                              {promoError}
                            </p>
                          )}
                        </div>

                        {/* Total Payable Block */}
                        <div className="border-t border-[#dbaa61]/10 pt-4 flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase font-mono">
                            TOTAL PAYABLE
                          </span>
                          <span className="text-2xl font-black text-[#10b981] font-mono tracking-tight drop-shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            ৳{bookingCost.toLocaleString('en-US')}
                          </span>
                        </div>
                      </div>

                      {/* Upgrade Banner / Maximize Your Experience */}
                      <div className="border border-dashed border-[#dbaa61]/45 bg-[#dbaa61]/5 p-4 rounded-2xl text-left space-y-1.5 shadow-[0_0_15px_rgba(219,170,97,0.03)]">
                        <div className="flex items-center space-x-1.5 text-[#dbaa61] font-black">
                          <Crown className="w-4 h-4" />
                          <span className="text-[10px] uppercase tracking-widest font-display">
                            Maximize Your Experience
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-300 leading-normal font-medium">
                          {companion.badge === 'DEMO' ? (
                            "You are attempting to book a Demo profile. Upgrade tier to unlock VIP profiles with up to 50% lifetime discounts."
                          ) : (
                            `You are attempting to book a ${companion.badge} VIP profile. Upgrade tier to unlock higher VIP benefits with up to 50% lifetime discounts.`
                          )}
                        </p>
                      </div>

                      {/* Bottom Action Row */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowInvoice(false);
                            // Clear messages
                            setPromoMessage('');
                            setPromoError('');
                          }}
                          className="flex-1 bg-transparent border border-[#dbaa61]/25 hover:border-[#dbaa61]/45 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer hover:text-white"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-[#dbaa61]" />
                          <span>BACK</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleFormSubmit}
                          className="flex-1 bg-gradient-to-r from-[#dbaa61] to-[#b38642] hover:from-[#eec480] hover:to-[#dbaa61] text-black font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-[#dbaa61]/20 whitespace-nowrap"
                        >
                          <span>AUTHORIZE</span>
                          <ArrowRight className="w-3.5 h-3.5 text-black font-black" />
                        </button>
                      </div>
                    </div>
                  ) : showOtpScreen ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="p-4 rounded-xl border border-[#dbaa61]/35 bg-[#dbaa61]/5 text-center space-y-2">
                        <span className="text-[10px] text-[#dbaa61] font-extrabold uppercase tracking-widest block font-mono">
                          TELEGRAM SECURITY VERIFICATION
                        </span>
                        <p className="text-xs text-slate-300 leading-normal">
                          A 6-digit security OTP code has been sent to your Telegram number <b>{telegramId}</b>. Please enter the code below to complete verification.
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
                          6-Digit Verification Code
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={enteredOtp}
                          onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="e.g. 529304"
                          className="w-full bg-[#030a1c] border border-[#dbaa61]/25 text-white text-xl rounded-xl py-3 text-center font-bold tracking-[0.2em] font-mono focus:outline-none focus:border-[#dbaa61]"
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
                          className="flex-1 bg-transparent border border-[#dbaa61]/20 hover:border-[#dbaa61]/45 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer hover:text-white"
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
                      {/* Comms Channel Selector and Identity Hash */}
                      <div className="space-y-4">
                        {/* COMMS CHANNEL */}
                        <div className="space-y-2 text-left">
                          <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
                            COMMS CHANNEL
                          </span>
                          <div className="grid grid-cols-3 gap-3">
                            {/* PHONE */}
                            <button
                              type="button"
                              onClick={() => setCommsChannel('PHONE')}
                              className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                                commsChannel === 'PHONE'
                                  ? 'border-[#dbaa61] bg-[#dbaa61]/5 text-white shadow-[0_0_15px_rgba(219,170,97,0.15)]'
                                  : 'bg-black/40 border-[#dbaa61]/10 text-slate-400 hover:border-[#dbaa61]/25 hover:text-slate-200'
                              }`}
                            >
                              <Phone className="w-5 h-5 mb-1.5 text-[#dbaa61]" />
                              <span className="text-[10px] font-black tracking-widest font-mono">PHONE</span>
                            </button>

                            {/* WHATSAPP */}
                            <button
                              type="button"
                              onClick={() => setCommsChannel('WHATSAPP')}
                              className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                                commsChannel === 'WHATSAPP'
                                  ? 'border-[#dbaa61] bg-[#dbaa61]/5 text-white shadow-[0_0_15px_rgba(219,170,97,0.15)]'
                                  : 'bg-black/40 border-[#dbaa61]/10 text-slate-400 hover:border-[#dbaa61]/25 hover:text-slate-200'
                              }`}
                            >
                              <svg className="w-5 h-5 mb-1.5 text-[#dbaa61]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              <span className="text-[10px] font-black tracking-widest font-mono">WHATSAPP</span>
                            </button>

                            {/* TELEGRAM */}
                            <button
                              type="button"
                              onClick={() => setCommsChannel('TELEGRAM')}
                              className={`py-3.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                                commsChannel === 'TELEGRAM'
                                  ? 'border-[#dbaa61] bg-[#dbaa61]/5 text-white shadow-[0_0_15px_rgba(219,170,97,0.15)]'
                                  : 'bg-black/40 border-[#dbaa61]/10 text-slate-400 hover:border-[#dbaa61]/25 hover:text-slate-200'
                              }`}
                            >
                              <svg className="w-5 h-5 mb-1.5 text-[#dbaa61]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.94-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                              </svg>
                              <span className="text-[10px] font-black tracking-widest font-mono">TELEGRAM</span>
                            </button>
                          </div>
                        </div>

                        {/* IDENTITY HASH */}
                        <div className="space-y-1.5 text-left">
                          <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-widest font-mono">
                            IDENTITY HASH
                          </span>
                          <div className="relative">
                            {commsChannel === 'PHONE' && <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#dbaa61] pointer-events-none" />}
                            {commsChannel === 'WHATSAPP' && (
                              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#dbaa61] pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                            )}
                            {commsChannel === 'TELEGRAM' && (
                              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#dbaa61] pointer-events-none" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.94-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                              </svg>
                            )}
                            <input
                              type="text"
                              required
                              value={commsChannel === 'PHONE' ? phoneNumber : commsChannel === 'WHATSAPP' ? whatsappNumber : telegramId}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (commsChannel === 'PHONE') setPhoneNumber(val);
                                else if (commsChannel === 'WHATSAPP') setWhatsappNumber(val);
                                else setTelegramId(val);
                              }}
                              placeholder={
                                commsChannel === 'PHONE'
                                  ? 'e.g. +88017xxxxxxxx'
                                  : commsChannel === 'WHATSAPP'
                                  ? 'e.g. +88018xxxxxxxx'
                                  : 'e.g. @username or Phone'
                              }
                              className="w-full bg-[#030a1c] border border-[#dbaa61]/25 text-white text-xs rounded-xl !pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#dbaa61] leading-normal font-semibold font-mono placeholder:text-slate-600"
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
                              OUTSTANDING BALANCE
                            </span>
                          </div>
                          <p className="text-[9.5px] text-slate-400 leading-normal font-medium text-left">
                            Your wallet balance is insufficient. Please transfer the remaining amount of <strong className="text-emerald-400 font-mono">৳{deficitAmount.toLocaleString('en-US')}</strong> to the gateway below and enter the Transaction ID.
                          </p>

                          {/* Deficit Gateway Picker */}
                          <div className="space-y-1">
                            <span className="block text-[8px] text-slate-455 font-black uppercase tracking-widest text-left">
                              SELECT GATEWAY:
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
                              <span className="font-extrabold uppercase text-[8.5px] tracking-wider">Instructions:</span>
                            </div>
                            <p className="leading-normal">{selectedGateway?.instructions || `Please complete payment to this number and enter the Transaction ID below.`}</p>
                          </div>

                          {/* Deficit TrxId Input */}
                          <div className="space-y-1">
                            <label className="block text-[8px] text-amber-400 font-extrabold uppercase tracking-wider text-left">
                              Remaining Payment Transaction ID
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
                              <span>Remaining Payment Screenshot (Optional)</span>
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
                          className="flex-1 bg-transparent border border-[#dbaa61]/20 hover:border-[#dbaa61]/45 text-slate-300 font-extrabold uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap hover:text-white"
                        >
                          <ArrowLeft className="w-3.5 h-3.5 text-[#dbaa61]" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          disabled={!getActiveContactValue().trim() || (isDeficit && deficitTrxId.trim().length < 8)}
                          className="flex-1 bg-gradient-to-r from-[#dbaa61] to-[#b38642] text-black disabled:opacity-40 disabled:cursor-not-allowed font-black uppercase text-[10px] tracking-widest py-3.5 rounded-2xl transition duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-[#dbaa61]/20 whitespace-nowrap hover:brightness-110"
                        >
                          <span>PROCEED</span>
                          <ArrowRight className="w-3.5 h-3.5 text-black font-black" />
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
