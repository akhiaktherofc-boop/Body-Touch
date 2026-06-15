import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building, Phone, Calendar, ShieldCheck, Lock, RotateCcw, ArrowRight } from 'lucide-react';
import { HotelLocation } from '../types';

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
  }) => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function HotelReservationModal({
  location,
  isOpen,
  onClose,
  walletBalance,
  onReservationSuccess,
  triggerToast
}: HotelReservationModalProps) {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  if (!location) return null;

  const handleNextStep = (e: React.FormEvent) => {
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

    if (!agreeToTerms) {
      triggerToast('You must agree to the terms to proceed.', 'error');
      return;
    }

    // Reservation successfully validated!
    onReservationSuccess({
      checkInDate,
      checkOutDate,
      emergencyContact: emergencyPhone,
      cost: location.price || 0
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-lg bg-[#0a1024] border border-blue-500/10 rounded-[2.5rem] overflow-hidden shadow-3xl z-10 p-6 sm:p-8 relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              aria-label="Close Reservation Form"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header section (Bell layout) */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                {/* Gold dinner Bell style container */}
                <div className="bg-[#dbaa61]/15 p-2 rounded-2xl border border-[#dbaa61]/35">
                  {/* SVG matching the bell stand shape */}
                  <svg
                    className="w-6 h-6 text-[#dbaa61]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <path d="M2 21h20" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-white tracking-wide">
                  Reservation
                </h2>
              </div>

              {/* Subtitle location element with building icon */}
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm font-semibold tracking-wide text-zinc-300">
                  {location.name}
                </span>
              </div>
            </div>

            {/* Form Fields Section */}
            <form onSubmit={handleNextStep} className="space-y-5">
              
              {/* Grid 2 Columns for Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Check-In Date */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-[0.16em] text-left">
                    CHECK-IN DATE
                  </label>
                  <div className="relative flex items-center bg-[#030712] border border-slate-800/80 rounded-2xl overflow-hidden focus-within:border-amber-500/40 transition-colors">
                    <Calendar className="absolute left-4 w-4 h-4 text-[#dbaa61] pointer-events-none" />
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      required
                      className="w-full bg-transparent text-xs font-bold font-mono text-white pl-11 pr-4 py-3.5 focus:outline-none placeholder-slate-600 [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Check-Out Date */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-[0.16em] text-left">
                    CHECK-OUT DATE
                  </label>
                  <div className="relative flex items-center bg-[#030712] border border-slate-800/80 rounded-2xl overflow-hidden focus-within:border-amber-500/40 transition-colors">
                    <Calendar className="absolute left-4 w-4 h-4 text-[#dbaa61] pointer-events-none" />
                    <input
                      type="date"
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                      required
                      className="w-full bg-transparent text-xs font-bold font-mono text-white pl-11 pr-4 py-3.5 focus:outline-none placeholder-slate-600 [color-scheme:dark] cursor-pointer"
                    />
                  </div>
                </div>

              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <label className="block text-[10px] text-zinc-400 font-bold uppercase tracking-[0.16em] text-left">
                  EMERGENCY CONTACT
                </label>
                <div className="relative flex items-center bg-[#030712] border border-slate-800/80 rounded-2xl overflow-hidden focus-within:border-amber-500/40 transition-colors">
                  <Phone className="absolute left-4 w-4 h-4 text-[#dbaa61] pointer-events-none" />
                  <input
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="Phone / WhatsApp"
                    required
                    className="w-full bg-transparent text-xs font-black text-white pl-11 pr-4 py-3.5 focus:outline-none placeholder-slate-650 tracking-wide font-sans"
                  />
                </div>
              </div>

              {/* Information Notice Panel */}
              <div className="bg-[#030712]/50 border border-amber-500/10 rounded-2xl p-4 space-y-3.5 text-left">
                {/* Confidential Disclaimer */}
                <div className="flex items-center gap-3">
                  <div className="bg-[#dbaa61]/10 p-1 rounded-md">
                    {/* Tiny bell style icon */}
                    <svg
                      className="w-3.5 h-3.5 text-[#dbaa61]"
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
                  <p className="text-[11px] text-zinc-300 font-bold tracking-wide">
                    Confidential: <span className="text-zinc-400 font-normal">Booked via corporate alias.</span>
                  </p>
                </div>

                {/* Refund Terms */}
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-1 rounded-md">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-400" strokeWidth={2.5} />
                  </div>
                  <p className="text-[11px] text-zinc-300 font-bold tracking-wide">
                    100% Refund: <span className="text-zinc-400 font-normal">Cancel 24h prior.</span>
                  </p>
                </div>

                {/* Dynamic Inline Checkbox Agreement */}
                <div className="flex items-center gap-3 pt-1 border-t border-slate-900">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-750 bg-[#030712] checked:bg-[#dbaa61] checked:border-amber-400 focus:ring-0 cursor-pointer text-amber-500 accent-amber-500"
                    />
                    <span className="text-[11px] text-zinc-300 font-black tracking-wide">
                      I agree to terms.
                    </span>
                  </label>
                </div>
              </div>

              {/* Next Step Submit Button */}
              <button
                type="submit"
                className="orange-grad-btn hover:brightness-105 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm uppercase tracking-[0.16em] py-4 px-6 w-full rounded-2xl flex items-center justify-center space-x-2.5 shadow-xl transition-all duration-200 cursor-pointer"
              >
                <span>NEXT STEP</span>
                <ArrowRight className="w-4 h-4 font-black" />
              </button>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
