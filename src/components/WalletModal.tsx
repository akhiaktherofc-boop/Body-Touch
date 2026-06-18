import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, ShieldCheck, ShieldAlert, ArrowUpRight, ArrowDownLeft, ClipboardList, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { PaymentRecord } from '../types';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  payments: PaymentRecord[];
  username: string;
  onTriggerAllocate: () => void;
  onTriggerLiquidate: () => void;
}

export default function WalletModal({
  isOpen,
  onClose,
  walletBalance,
  payments,
  username,
  onTriggerAllocate,
  onTriggerLiquidate
}: WalletModalProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // Convert Bengali digits to English
  const bToE = (str: string): string => {
    const map: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    return str.split('').map(c => map[c] || c).join('');
  };

  // Filter payments belonging to current user
  const userPayments = payments.filter(p => !username || p.username.toLowerCase() === username.toLowerCase());

  // Calculate total spent (OUT) and total added (IN) from verified transactions
  let totalIn = 0;
  let totalOut = 0;

  userPayments.forEach((p) => {
    if (p.status === 'Approved') {
      const isDeficit = p.tierName.toLowerCase().includes('deficit');
      const isBooking = p.tierName.toLowerCase().includes('booking');
      const isWithdraw = p.tierName.toLowerCase().includes('withdraw');
      const isDeposit = p.tierName.toLowerCase().includes('deposit') || p.tierName.toLowerCase().includes('allocation');
      
      const cleanPrice = bToE(p.price).replace(/[^0-9.-]/g, '');
      const numPrice = Math.abs(parseInt(cleanPrice) || 0);

      const isNegative = p.price.startsWith('-') || isWithdraw || isBooking;

      if (isNegative) {
        totalOut += numPrice;
      } else {
        totalIn += numPrice;
      }
    }
  });

  // Filter payments by selected sub-tab
  const filteredPayments = userPayments.filter((p) => {
    const isBooking = p.tierName.toLowerCase().includes('booking');
    const isWithdraw = p.tierName.toLowerCase().includes('withdraw');
    const isNegative = p.price.startsWith('-') || isWithdraw || isBooking;

    if (activeTab === 'IN') {
      return p.status === 'Approved' && !isNegative;
    }
    if (activeTab === 'OUT') {
      return p.status === 'Approved' && isNegative;
    }
    return true; // ALL
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          {/* Backdrop Click */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 cursor-pointer"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-[#020714] border border-blue-500/20 shadow-2xl shadow-blue-500/5 rounded-3xl max-h-[90vh] overflow-y-auto scrollbar-none relative p-6 z-10 gold-breathing-glow"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-900 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center pb-4 border-b border-blue-500/10">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-3 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <Wallet className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Discreet Account Ledger (ব্যক্তিগত ওয়ালেট)
              </h2>
              <p className="text-[10px] text-[#5c75ab] font-bold mt-1 uppercase tracking-widest">
                Real-Time Secure Portal Asset Balance
              </p>
            </div>

            {/* Balance Capsule display */}
            <div className="mt-5 bg-gradient-to-b from-[#030d24] to-[#010612] border border-blue-500/15 p-5 rounded-2xl relative overflow-hidden backdrop-blur-md flex flex-col items-center">
              <span className="text-[9px] text-blue-400 font-extrabold uppercase tracking-widest mb-1 select-none font-mono">
                AVAILABLE BALANCE
              </span>
              <div className="text-3xl font-black text-white tracking-wide font-mono flex items-center justify-center py-1">
                <span className="text-blue-400 mr-1.5 font-sans">৳</span>
                {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* In / Out Statistics */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-[#030a1c] border border-blue-500/10 p-3.5 rounded-xl text-left flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">
                    TOTAL DEP (মোট ইন)
                  </span>
                  <span className="text-sm font-black text-white font-mono leading-tight">
                    ৳{totalIn.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-[#030a1c] border border-blue-500/10 p-3.5 rounded-xl text-left flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">
                    TOTAL SPENT (মোট খরচ)
                  </span>
                  <span className="text-sm font-black text-white font-mono leading-tight">
                    ৳{totalOut.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons inside Modal */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => {
                  onClose();
                  onTriggerAllocate();
                }}
                className="py-3 px-4 bg-[#111c38] hover:bg-blue-900 border border-blue-500/20 hover:border-blue-500/40 text-blue-300 font-black text-[9.5px] uppercase tracking-wider rounded-xl transition cursor-pointer text-center select-none"
              >
                Deposit Funds (টাকা রিচার্জ)
              </button>
              <button
                onClick={() => {
                  onClose();
                  onTriggerLiquidate();
                }}
                className="py-3 px-4 bg-[#0a0f21] hover:bg-rose-950/20 border border-red-500/15 hover:border-red-500/35 text-rose-400 font-black text-[9.5px] uppercase tracking-wider rounded-xl transition cursor-pointer text-center select-none"
              >
                Withdrawal (টাকা উত্তোলন)
              </button>
            </div>

            {/* History Header & Sub Tabs */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between border-b border-blue-500/10 pb-2">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  <span className="text-[11px] font-black uppercase text-white tracking-wider">
                    TRANSACTION HISTORY (লেনদেন হিস্টোরি)
                  </span>
                </div>
              </div>

              {/* Filtering tab switches */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 border border-[#161a24] rounded-xl">
                {([
                  { id: 'ALL', bn: 'সব', en: 'All' },
                  { id: 'IN', bn: 'জমা', en: 'Credit' },
                  { id: 'OUT', bn: 'খরচ', en: 'Debit' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1 rounded-lg text-center font-bold text-[10px] select-none cursor-pointer transition ${
                      activeTab === tab.id
                        ? 'bg-blue-900/30 text-blue-300 border border-blue-500/25'
                        : 'text-slate-450 hover:text-white border border-transparent'
                    }`}
                  >
                    {tab.en} ({tab.bn})
                  </button>
                ))}
              </div>

              {/* Transactions List */}
              <div className="max-h-[190px] overflow-y-auto pr-1 space-y-2 mt-2 scrollbar-thin scrollbar-thumb-blue-500/10">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-10 text-[10px] uppercase font-black tracking-widest text-[#5c75ab]/40">
                    No matching ledger tags found
                  </div>
                ) : (
                  filteredPayments.map((pay) => {
                    const isWithdraw = pay.tierName.toLowerCase().includes('withdraw');
                    const isBooking = pay.tierName.toLowerCase().includes('booking');
                    const isDeficit = pay.tierName.toLowerCase().includes('deficit');
                    
                    const isDebit = pay.price.startsWith('-') || isWithdraw || isBooking;

                    return (
                      <div
                        key={pay.id}
                        className="p-3 rounded-xl border border-[#111d3d]/60 bg-slate-950/45 flex items-center justify-between gap-3 text-left hover:border-blue-500/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isDebit
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/10'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
                          }`}>
                            {isDebit ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </div>
                          <div className="truncate min-w-0">
                            <span className="text-[11px] font-black text-white block truncate leading-tight">
                              {pay.tierName}
                            </span>
                            <span className="text-[8px] text-slate-500 font-semibold font-mono block">
                              {pay.date}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-xs font-mono font-black block ${
                            isDebit ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {isDebit ? '-' : '+'}৳{bToE(pay.price).replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </span>
                          <span className={`text-[7px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded ml-auto block w-max mt-1 ${
                            pay.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                              : pay.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/10 animate-pulse'
                          }`}>
                            {pay.status === 'Pending Verification' ? 'PENDING' : pay.status === 'Approved' ? 'VERIFIED' : 'FAILED'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
