import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Phone,
  Calendar,
  ArrowRight,
  MapPin,
  Clock,
  Check,
  Wifi,
  Shield,
  Star,
  Wind,
  ArrowUpDown,
  CigaretteOff,
  Waves,
  Car,
  EyeOff,
  Dumbbell,
  Sparkles,
  VolumeX,
  KeyRound,
  Heart,
  Compass
} from 'lucide-react';
import { HotelLocation } from '../types';

// Helper function to map facility/amenity labels to realistic and descriptive icons
const getFacilityIcon = (facility: string) => {
  const norm = facility.toLowerCase();
  if (norm.includes('air conditioning') || norm.includes('air-conditioning') || norm.includes('cooling')) {
    return <Wind className="w-3.5 h-3.5 text-sky-450 shrink-0" />;
  }
  if (norm.includes('elevator') || norm.includes('lift')) {
    return <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
  if (norm.includes('smoke') || norm.includes('cigarette')) {
    return <CigaretteOff className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (norm.includes('wi-fi') || norm.includes('wifi') || norm.includes('internet')) {
    return <Wifi className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
  if (norm.includes('reception') || norm.includes('check-in') || norm.includes('check in') || norm.includes('hours') || norm.includes('24h')) {
    return <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  }
  if (norm.includes('pool')) {
    return <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  }
  if (norm.includes('parking') || norm.includes('car')) {
    return <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
  if (norm.includes('gym') || norm.includes('fitness')) {
    return <Dumbbell className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  }
  if (norm.includes('spa') || norm.includes('wellness') || norm.includes('massage')) {
    return <Heart className="w-3.5 h-3.5 text-rose-450 shrink-0" />;
  }
  if (norm.includes('confidential') || norm.includes('secure') || norm.includes('safety') || norm.includes('security') || norm.includes('blind') || norm.includes('compound') || norm.includes('keypad') || norm.includes('shield')) {
    if (norm.includes('confidential') || norm.includes('blind') || norm.includes('privacy')) {
      return <EyeOff className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
    }
    if (norm.includes('sound') || norm.includes('acoustic')) {
      return <VolumeX className="w-3.5 h-3.5 text-teal-400 shrink-0" />;
    }
    if (norm.includes('keypad') || norm.includes('keycard')) {
      return <KeyRound className="w-3.5 h-3.5 text-yellow-405 shrink-0" />;
    }
    return <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (norm.includes('lounge') || norm.includes('premium') || norm.includes('luxury')) {
    return <Sparkles className="w-3.5 h-3.5 text-amber-350 shrink-0" />;
  }
  if (norm.includes('view') || norm.includes('skyline')) {
    return <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />;
  }
  return <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
};

interface HotelReservationModalProps {
  location: HotelLocation | null;
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  onReservationSuccess: (bookingData: {
    checkInDate: string;
    checkOutDate: string;
    emergencyContact: string;
    cost: number;
    roomType?: string;
  }) => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  defaultPhone?: string;
}

export default function HotelReservationModal({
  location,
  isOpen,
  onClose,
  walletBalance,
  onReservationSuccess,
  triggerToast,
  defaultPhone = ''
}: HotelReservationModalProps) {
  // Generate default dates (Today and Tomorrow) for excellent mobile usability & friction-free booking path
  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [checkOutDate, setCheckOutDate] = useState(tomorrowStr);
  const [emergencyPhone, setEmergencyPhone] = useState(defaultPhone);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<'room1' | 'room2'>('room1');

  // Telegram verification states
  const [telegramId, setTelegramId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Synchronize state when defaults are loaded or modal opens
  useEffect(() => {
    if (isOpen) {
      if (defaultPhone) {
        setEmergencyPhone(defaultPhone);
      }
      setCheckInDate(todayStr);
      setCheckOutDate(tomorrowStr);
      setAgreeToTerms(false);
      setSelectedRoom('room1');
      setTelegramId('');
      setOtpCode('');
      setEnteredOtp('');
      setShowOtpScreen(false);
      setIsSendingOtp(false);
    }
  }, [isOpen, defaultPhone, todayStr, tomorrowStr]);

  // Compute selected room price and details
  const roomDetails = useMemo(() => {
    if (!location) {
      return {
        name: 'Premium Deluxe Room',
        price: 0,
        bedType: 'TWIN x 2',
        capacity: 'Adult x 2, Child x 2',
        viewType: 'no-view',
        area: '18 sqm',
        facilities: 'Breakfast Included, Non-Smoking',
      };
    }
    if (selectedRoom === 'room2' && location.room2Name) {
      return {
        name: location.room2Name,
        price: location.room2Price || location.price,
        bedType: location.room2BedType || 'KING x 1',
        capacity: location.room2Capacity || 'Adult x 2, Child x 2',
        viewType: location.room2ViewType || 'no-view',
        area: location.room2Area || '25 sqm',
        facilities: location.room2Facilities || 'Breakfast Included, Non-Smoking',
      };
    }
    // Room 1 fallback / default
    return {
      name: location.room1Name || 'Premium Deluxe Room',
      price: location.room1Price || location.price,
      bedType: location.room1BedType || 'TWIN x 2',
      capacity: location.room1Capacity || 'Adult x 2, Child x 2',
      viewType: location.room1ViewType || 'no-view',
      area: location.room1Area || '18 sqm',
      facilities: location.room1Facilities || 'Breakfast Included, Non-Smoking',
    };
  }, [selectedRoom, location]);

  // Facilities pill list parser
  const facilitiesList = useMemo(() => {
    if (!location || !location.highlightedFacilities) {
      return ['Air Conditioning', 'Elevator Access', 'Smoke-free property', '24h Reception', 'Free secure Wi-Fi'];
    }
    return location.highlightedFacilities.split(',').map((f) => f.trim()).filter(Boolean);
  }, [location]);

  if (!location) return null;

  const executeSendTelegramOtpHotel = async (code: string) => {
    setIsSendingOtp(true);
    
    const defaultBotToken = '7874983058:AAHshUqisKskj6D5-zZ7N0L-GCHV966L1Sg';
    const customBotToken = localStorage.getItem('bt_telegram_bot_token') || defaultBotToken;
    const token = localStorage.getItem('bt_telegram_bot_selection') === 'default' ? defaultBotToken : customBotToken;
    const chatId = localStorage.getItem('bt_telegram_group_id') || '-1002283928192';

    const text = `🔐 <b>[BODY TOUCH Hotel Reservation OTP]</b>\n\n` +
                 `Hotel/Location: <b>${location?.name}</b>\n` +
                 `Room Tier: <b>${roomDetails.name}</b>\n` +
                 `Check-in: <code>${checkInDate}</code>\n` +
                 `Check-out: <code>${checkOutDate}</code>\n` +
                 `Emergency Mobile: <code>${emergencyPhone}</code>\n` +
                 `Telegram Username: <b>${telegramId}</b>\n\n` +
                 `Verification Code:\n` +
                 `👉 <b>${code}</b> 👈\n\n` +
                 `Please enter this code in the app to complete your secure suite booking.`;

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
      triggerToast('Security verification code sent to Telegram!', 'success');
    } catch (teleErr) {
      console.error("Hotel Telegram OTP verification error:", teleErr);
      triggerToast('Failed to dispatch code to Telegram.', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkInDate) {
      triggerToast('Please select a valid Check-in Date.', 'error');
      return;
    }
    if (!checkOutDate) {
      triggerToast('Please select a valid Check-out Date.', 'error');
      return;
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      triggerToast('Check-out date must be after Check-in date.', 'error');
      return;
    }

    if (!emergencyPhone.trim()) {
      triggerToast('Emergency contact number is required.', 'error');
      return;
    }

    if (!telegramId.trim()) {
      triggerToast('Telegram username is required for mandatory security verification.', 'error');
      return;
    }

    if (!agreeToTerms) {
      triggerToast('You must agree to the terms to proceed.', 'error');
      return;
    }

    // OTP verification has been disabled as requested by user. Proceed directly to completing the booking.
    setIsSendingOtp(false);
    setShowOtpScreen(false);
    // Reservation successfully validated!
    onReservationSuccess({
      checkInDate,
      checkOutDate,
      emergencyContact: emergencyPhone.trim(),
      cost: roomDetails.price,
      roomType: roomDetails.name
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 backdrop-blur-md flex justify-center items-start p-3 sm:p-6">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0"
            onClick={onClose}
          />

          {/* Modal Container: Flow naturally so we can scroll down cleanly */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="w-full max-w-2xl bg-[#080d1e] border-2 border-[#dbaa61]/35 rounded-[2rem] shadow-2xl z-10 p-5 sm:p-8 my-auto relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white hover:scale-110 active:scale-95 transition-all z-20 bg-black/40 p-2 rounded-full"
              aria-label="Close Reservation Form"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header section with Bell and Map metadata */}
            <div className="space-y-3 mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="bg-[#dbaa61]/15 p-2.5 rounded-xl border border-[#dbaa61]/35 shrink-0">
                  <svg
                    className="w-6.5 h-6.5 text-[#dbaa61]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <path d="M2 21h20" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-white tracking-wide text-left">
                    {location.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-left">
                    <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 font-mono">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500 shrink-0" />
                      {location.star} STAR
                    </span>
                    {location.distance && (
                      <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                        {location.distance}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {location.address && (
                <div className="flex items-start gap-1.5 text-zinc-350 text-sm mt-2 text-left leading-relaxed font-medium">
                  <MapPin className="w-4.5 h-4.5 text-[#dbaa61] shrink-0 mt-0.5" />
                  <span className="text-zinc-200">{location.address}</span>
                </div>
              )}
            </div>

            {/* Main Split Details section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6 text-left">
              
              {/* Left Column: Rules, Policies, and Facilities tags */}
              <div className="md:col-span-12 lg:col-span-5 bg-black/45 border border-white/5 rounded-2xl p-4 space-y-4">
                
                {/* Check In / Out indicators - Big text */}
                <div className="grid grid-cols-2 gap-2.5 text-sm">
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-left">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">CHECK-IN TIME</span>
                    <span className="text-sm font-black text-zinc-100 block mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#dbaa61]" />
                      {location.checkInTime || '02:00 PM'}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-white/5 text-left">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">CHECK-OUT TIME</span>
                    <span className="text-sm font-black text-zinc-100 block mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#dbaa61]" />
                      {location.checkOutTime || '11:00 AM'}
                    </span>
                  </div>
                </div>

                {/* Facilities List pills */}
                <div>
                  <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-2 tracking-wider">HIGHLIGHT POLICIES & AMENITIES</span>
                  <div className="flex flex-wrap gap-1.5">
                    {facilitiesList.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[11px] bg-slate-950/80 border border-white/5 text-zinc-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 font-sans tracking-tight"
                      >
                        {getFacilityIcon(tag)}
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description details */}
                <div className="pt-3 border-t border-white/5">
                  <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1.5">SAFETY & PRIVACY RULES</span>
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed uppercase">
                    {location.description || 'Premium elite destination sanctuary designed for high confidentiality.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Room selector card triggers */}
              <div className="md:col-span-12 lg:col-span-7 space-y-3.5">
                <span className="block text-xs font-mono text-slate-350 uppercase font-black tracking-widest">
                  CHOOSE SECURE SUITE TIER (রুম সিলেক্ট করুন):
                </span>
                
                {/* Room Card 1 */}
                <div
                  onClick={() => setSelectedRoom('room1')}
                  className={`group p-4.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left relative flex flex-col justify-between ${
                    selectedRoom === 'room1'
                      ? 'bg-amber-950/20 border-amber-500 shadow-inner'
                      : 'bg-[#04060f]/80 border-white/5 hover:border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <span className="text-white text-base font-black font-serif tracking-wide block uppercase">
                        {location.room1Name || 'Standard Premium Room'}
                      </span>
                      {/* Specs */}
                      <span className="text-xs text-slate-350 font-mono font-bold block">
                        BEDS: {location.room1BedType || 'TWIN x 2'} • AREA: {location.room1Area || '18 sqm'} • VIEW: {location.room1ViewType || 'no-view'}
                      </span>
                      <p className="text-xs text-zinc-300 font-medium">
                        {location.room1Facilities || 'Breakfast Included, Non-Smoking'}
                      </p>
                      <span className="text-xs text-amber-500 font-extrabold block">
                        CAPACITY: {location.room1Capacity || 'Adult x 2, Child x 2'}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-serif font-black text-[#dbaa61] block font-mono">
                        ৳{(location.room1Price || location.price).toLocaleString()}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-[#dbaa61]/80 block tracking-widest">/ NIGHT</span>
                    </div>
                  </div>

                  {/* Tick marker */}
                  {selectedRoom === 'room1' && (
                    <span className="absolute bottom-4.5 right-4.5 bg-amber-500 p-1 rounded-full shadow-lg">
                      <Check className="w-3.5 h-3.5 text-black stroke-[3.5]" />
                    </span>
                  )}
                </div>

                {/* Room Card 2 */}
                {(location.room2Name || location.room2Price) && (
                  <div
                    onClick={() => setSelectedRoom('room2')}
                    className={`group p-4.5 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left relative flex flex-col justify-between ${
                      selectedRoom === 'room2'
                        ? 'bg-amber-950/20 border-amber-500 shadow-inner'
                        : 'bg-[#04060f]/80 border-white/5 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="text-white text-base font-black font-serif tracking-wide block uppercase">
                          {location.room2Name || 'Executive Suite Premium'}
                        </span>
                        {/* Specs */}
                        <span className="text-xs text-slate-350 font-mono font-bold block">
                          BEDS: {location.room2BedType || 'KING x 1'} • AREA: {location.room2Area || '25 sqm'} • VIEW: {location.room2ViewType || 'no-view'}
                        </span>
                        <p className="text-xs text-zinc-300 font-medium">
                          {location.room2Facilities || 'Breakfast Included, Gym Access'}
                        </p>
                        <span className="text-xs text-amber-500 font-extrabold block">
                          CAPACITY: {location.room2Capacity || 'Adult x 2, Child x 2'}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-serif font-black text-[#dbaa61] block font-mono">
                          ৳{(location.room2Price || location.price).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-[#dbaa61]/80 block tracking-widest">/ NIGHT</span>
                      </div>
                    </div>

                    {/* Tick marker */}
                    {selectedRoom === 'room2' && (
                      <span className="absolute bottom-4.5 right-4.5 bg-amber-500 p-1 rounded-full shadow-lg">
                        <Check className="w-3.5 h-3.5 text-black stroke-[3.5]" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields Section */}
            <form onSubmit={handleNextStep} className="space-y-5">
              
              {showOtpScreen ? (
                <div className="space-y-5 animate-fadeIn text-left">
                  <div className="p-4 rounded-2xl border-2 border-[#dbaa61]/30 bg-amber-950/10 text-center space-y-2">
                    <span className="text-[10px] text-[#dbaa61] font-black uppercase tracking-wider block font-mono">
                      MANDATORY TELEGRAM VERIFICATION CODE (বাধ্যতামূলক নিরাপত্তা কোড)
                    </span>
                    <p className="text-xs text-zinc-300 leading-normal font-sans font-medium">
                      আপনার প্রদানকৃত টেলিগ্রাম <b>{telegramId}</b> নম্বরে একটি ভেরিফিকেশন ওটিপি পাঠানো হয়েছে। অনুগ্রহ করে কোডটি এখানে ইনপুট করুন।
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-zinc-350 font-bold uppercase tracking-[0.16em] text-center">
                      6-Digit Telegram Code (৬-সংখ্যার কোড)
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 102948"
                      className="w-full bg-[#030712] border-2 border-white/5 rounded-xl py-3.5 text-center text-xl font-bold tracking-[0.25em] font-mono text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpScreen(false);
                        setEnteredOtp('');
                      }}
                      className="flex-1 bg-[#0c0e18] border-2 border-white/5 hover:border-white/10 text-zinc-300 font-extrabold uppercase text-xs tracking-widest py-4 rounded-xl transition duration-200 flex items-center justify-center cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enteredOtp.length !== 6 || isSendingOtp}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-indigo-500 hover:from-emerald-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black uppercase text-xs tracking-widest py-4 rounded-xl transition duration-200 flex items-center justify-center shadow-lg cursor-pointer"
                    >
                      <span>{isSendingOtp ? 'SENDING...' : 'VERIFY & CONFIRM BOOKING'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Grid 2 Columns for Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Check-In Date */}
                    <div className="space-y-2 text-left">
                      <label className="block text-xs font-mono text-zinc-350 font-bold uppercase tracking-[0.16em]">
                        CHECK-IN DATE * (চেক-ইন ডেট)
                      </label>
                      <div className="relative flex items-center bg-[#030712] border-2 border-white/5 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
                        <Calendar className="absolute left-4 w-5 h-5 text-[#dbaa61] pointer-events-none" />
                        <input
                          type="date"
                          value={checkInDate}
                          onChange={(e) => setCheckInDate(e.target.value)}
                          onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                          onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                          required
                          className="w-full bg-transparent text-sm font-bold font-mono text-white pl-12 pr-4 py-3.5 focus:outline-none placeholder-slate-500 [color-scheme:dark] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Check-Out Date */}
                    <div className="space-y-2 text-left">
                      <label className="block text-xs font-mono text-zinc-350 font-bold uppercase tracking-[0.16em]">
                        CHECK-OUT DATE * (চেক-আউট ডেট)
                      </label>
                      <div className="relative flex items-center bg-[#030712] border-2 border-white/5 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
                        <Calendar className="absolute left-4 w-5 h-5 text-[#dbaa61] pointer-events-none" />
                        <input
                          type="date"
                          value={checkOutDate}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                          onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                          required
                          className="w-full bg-transparent text-sm font-bold font-mono text-white pl-12 pr-4 py-3.5 focus:outline-none placeholder-slate-500 [color-scheme:dark] cursor-pointer"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-mono text-zinc-350 font-bold uppercase tracking-[0.16em]">
                      EMERGENCY PHONE NUMBER * (জরুরী মোবাইল নম্বর)
                    </label>
                    <div className="relative flex items-center bg-[#030712] border-2 border-white/5 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
                      <Phone className="absolute left-4 w-5 h-5 text-[#dbaa61] pointer-events-none" />
                      <input
                        type="tel"
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        required
                        className="w-full bg-[#030712] border-2 border-white/5 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors bg-transparent text-sm font-black text-white pl-12 pr-4 py-4 focus:outline-none placeholder-slate-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* Telegram Username */}
                  <div className="space-y-2 text-left">
                    <label className="block text-xs font-mono text-zinc-350 font-bold uppercase tracking-[0.16em]">
                      SECURE TELEGRAM ID / USERNAME * (বাধ্যতামূলক নিরাপত্তা টেলিগ্রাম)
                    </label>
                    <div className="relative flex items-center bg-[#030712] border-2 border-white/5 rounded-xl overflow-hidden focus-within:border-amber-500 transition-colors">
                      <svg
                        className="absolute left-4 w-5 h-5 text-[#dbaa61] pointer-events-none"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <input
                        type="text"
                        value={telegramId}
                        onChange={(e) => setTelegramId(e.target.value)}
                        placeholder="e.g. @username"
                        required
                        className="w-full bg-transparent text-sm font-black text-white pl-12 pr-4 py-4 focus:outline-none placeholder-slate-600 font-mono"
                      />
                    </div>
                  </div>

                  {/* Wallet Information & Cancellation Info */}
                  <div className="bg-[#030712]/50 border border-amber-500/10 rounded-2xl p-4.5 space-y-3 text-left">
                    <div className="flex items-center justify-between text-base">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-400" />
                        <span className="text-zinc-200 font-semibold">Wallet Balance (ওয়ালেট ব্যালেন্স):</span>
                      </div>
                      <span className="text-white font-mono font-black text-right">
                        ৳{walletBalance.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[#dbaa61] text-lg">
                      <span className="font-extrabold">Total Stay Cost (মোট ভাড়া):</span>
                      <span className="font-mono font-black text-xl">
                        ৳{roomDetails.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Big fully tap-friendly click container */}
                    <div 
                      onClick={() => setAgreeToTerms(!agreeToTerms)}
                      className="flex items-start gap-3 pt-3 border-t border-white/5 select-none cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        id="agreeCheck"
                        checked={agreeToTerms}
                        onChange={(e) => e.stopPropagation()} // Click handled by parent div
                        className="w-5.5 h-5.5 rounded border-2 border-zinc-700 bg-[#030712] checked:bg-amber-500 checked:border-amber-400 focus:ring-0 cursor-pointer accent-amber-500 shrink-0 mt-0.5"
                      />
                      <label htmlFor="agreeCheck" className="text-xs sm:text-sm text-zinc-200 font-semibold tracking-wide cursor-pointer select-none group-hover:text-white transition-colors duration-200">
                        আমি বুকিং করার জন্য নিয়মাবলী ও সিকিউরিটি ডিসক্লেইমার মেনে নিয়েছি (I agree to all rules & guidelines).
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="orange-grad-btn hover:brightness-110 active:scale-[0.99] text-black font-black text-sm uppercase tracking-[0.16em] py-4.5 px-6 w-full rounded-xl flex items-center justify-center space-x-2 shadow-2xl transition-all duration-200 cursor-pointer"
                  >
                    <span>CONFIRM & BOOK TIER (বুক করুন)</span>
                    <ArrowRight className="w-5 h-5 stroke-[3]" />
                  </button>
                </>
              )}

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
