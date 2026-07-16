import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Info, ShieldCheck, Upload, Trash2, CheckCircle2, Key } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { PaymentGateway } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  tierName: string;
  price: string;
  onClose: () => void;
  onSubmit: (data: { method: string; screenshot?: string; trxId: string }) => void;
  paymentGateways?: PaymentGateway[];
}

// Beautiful and robust vector brand logos for the default gateways
export const GatewayLogo = ({ gateway, className = "w-4 h-4" }: { gateway: PaymentGateway, className?: string }) => {
  if (gateway.logoUrl) {
    return (
      <img
        src={gateway.logoUrl}
        alt=""
        className={`${className} object-contain rounded shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  }
  
  const method = (gateway.method || '').toUpperCase();
  if (method.includes('BKASH')) {
    return (
      <span className={`${className} bg-[#e2125d] text-white flex items-center justify-center p-0.5 rounded shrink-0 shadow-sm`}>
        <svg viewBox="0 0 512 512" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M190.5 400.1H118.9L190.5 233.3H262.1L190.5 400.1Z" fill="currentColor" />
          <path d="M393.1 233.3H321.5L393.1 400.1H464.7L393.1 233.3Z" fill="currentColor" />
          <path d="M291.8 111.9H220.2L291.8 278.7H363.4L291.8 111.9Z" fill="currentColor" />
          <circle cx="148.7" cy="141.7" r="29.8" fill="currentColor" />
        </svg>
      </span>
    );
  }
  if (method.includes('NAGAD')) {
    return (
      <span className={`${className} bg-[#f15a22] text-white flex items-center justify-center p-0.5 rounded shrink-0 shadow-sm`}>
        <svg viewBox="0 0 512 512" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zm-38.4 358.4c-44.2 0-80-35.8-80-80s35.8-80 80-80s80 35.8 80 80s-35.8 80-80 80zm96-128c11-19 32-32 56-32c35.3 0 64 28.7 64 64s-28.7 64-64 64c-24 0-45-13-56-32h-40c16 41 56 70 103 70c61.9 0 112-50.1 112-112S395.9 142 334 142c-47 0-87 29-103 70l1.4 1.4c17.5-16.7 41.3-26.8 67.6-26.8c31.1 0 58.7 14.1 77 36.4l-40 5.4z" fill="currentColor" />
        </svg>
      </span>
    );
  }
  if (method.includes('ROCKET')) {
    return (
      <span className={`${className} bg-[#8c3494] text-white flex items-center justify-center p-0.5 rounded shrink-0 shadow-sm`}>
        <svg viewBox="0 0 512 512" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M410.3 101.7c-4-4-10.4-4-14.4 0L308.2 191.4c-22.1-14.1-49.8-19.1-76.3-13l-45.7 10.5c-9.1 2.1-15.6 10.1-16 19.5l-2.4 54.4c-11.4 11.4-25.9 19-41.9 22.4l-31.5 6.6c-13.6 2.9-20.9 18-14 30l28.6 49.8c5.4 9.4 17.5 11.9 26.2 5.3l37-28c12.3-9.3 28-11.7 42.4-6.3l49.5 18.5c11.9 4.4 25.1-2.2 28.5-14.3l12.4-44.2c6.9-24.8 2.9-51.2-10.7-72.7l90.4-90.4c4-3.9 4-10.3 0-14.3l-24.6-24.6z" fill="currentColor" />
          <path d="M128 416c-16 16-48 16-64 0s0-48 16-64l48 48-16 16z" fill="currentColor" />
        </svg>
      </span>
    );
  }

  // Fallback default wallet
  return (
    <span className={`${className} bg-blue-500/10 flex items-center justify-center rounded shrink-0 border border-blue-500/20`}>
      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    </span>
  );
};

export default function CheckoutModal({
  isOpen,
  tierName,
  price,
  onClose,
  onSubmit,
  paymentGateways = []
}: CheckoutModalProps) {
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

  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(displayGateways[0]);
  const [trxId, setTrxId] = useState('');
  const [copied, setCopied] = useState(false);
  const [screenshot, setScreenshot] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  // Sync selected gateway when displayGateways changes or modal is re-opened
  useEffect(() => {
    if (isOpen && displayGateways.length > 0) {
      setSelectedGateway(displayGateways[0]);
      setScreenshot('');
      setTrxId('');
      setShowThankYou(false);
    }
  }, [isOpen]);

  const handleCopy = () => {
    // strip out characters like hyphens or space to copy clean phone numbers
    const cleanNumber = selectedGateway.number.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(cleanNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId || trxId.trim().length < 8) return;
    onSubmit({
      method: selectedGateway.name, // e.g. "bKash Personal" or "Rocket Merchant" to preserve detailed tracking in db
      trxId: trxId.trim().toUpperCase(),
      screenshot: screenshot || undefined
    });
    setShowThankYou(true);
  };

  // Determine button color corresponding to the gateway branding
  const getMethodColor = (gateway: PaymentGateway) => {
    if (gateway.id === selectedGateway.id) {
      const type = gateway.method.toUpperCase();
      if (type.includes('BKASH')) return 'bg-[#e2125d] border-transparent text-white scale-[1.03] shadow-md shadow-[#e2125d]/20';
      if (type.includes('NAGAD')) return 'bg-[#f15a22] border-transparent text-white scale-[1.03] shadow-md shadow-[#f15a22]/20';
      if (type.includes('ROCKET')) return 'bg-[#8c3494] border-transparent text-white scale-[1.03] shadow-md shadow-[#8c3494]/20';
      return 'bg-blue-600 border-transparent text-white scale-[1.03]'; // Custom gate brand
    }
    return 'bg-[#03091c]/70 border-blue-500/10 text-slate-400 hover:text-slate-300 hover:border-blue-500/20';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="cyan-glow-card max-w-sm w-full rounded-3xl max-h-[90vh] overflow-y-auto scrollbar-none relative shadow-2xl p-6 z-10 bg-[#020712] gold-breathing-glow"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              {showThankYou ? (
                <div className="space-y-5 text-center py-4 animate-fadeIn">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-lg font-black text-emerald-450 uppercase tracking-wider font-display">
                      Payment Submitted!
                    </h2>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold text-center">
                      Thank you! Your payment request has been successfully submitted and is currently pending verification.
                    </p>
                  </div>

                  {/* Verification Notice Badge */}
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center gap-2">
                    <span className="text-blue-400 text-xs">⏳</span>
                    <p className="text-[10px] font-black text-blue-300 tracking-wide text-center leading-normal">
                      Manual verification typically takes 10-30 minutes.
                    </p>
                  </div>

                  {/* Details summary */}
                  <div className="p-4 bg-gradient-to-b from-[#030d24] to-[#010612] border border-blue-500/15 rounded-2xl space-y-2.5 text-left font-sans">
                    <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest text-center font-mono">
                      TRANSACTION SUMMARY
                    </span>

                    <div className="space-y-1.5 text-[10.5px]">
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-slate-400 font-bold">Tier:</span>
                        <span className="text-white font-extrabold">{tierName}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-slate-400 font-bold">Amount:</span>
                        <span className="text-emerald-400 font-mono font-extrabold">৳{price} BDT</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-slate-400 font-bold">Method:</span>
                        <span className="text-[#dbaa61] font-extrabold flex items-center gap-1.5">
                          <GatewayLogo gateway={selectedGateway} className="w-3.5 h-3.5" />
                          {selectedGateway.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-slate-400 font-bold">TrxID:</span>
                        <span className="text-cyan-400 font-mono font-extrabold select-all uppercase">{trxId}</span>
                      </div>
                      {screenshot && (
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-slate-400 font-bold">Screenshot:</span>
                          <span className="text-emerald-400 font-black text-[9.5px] flex items-center gap-1">
                            ✓ Attached
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl transition duration-300 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center pb-2 border-b border-blue-500/10">
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Secure Dynamic Gateway
                    </span>
                    <p className="text-base font-black text-white mt-1">Purchase {tierName}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {tierName === 'Wallet Deposit' ? 'SECURE BALANCE DEPOSIT • 100% REFUNDABLE' : 'ONE-TIME PAYMENT • LIFETIME ACCESS'}
                    </p>
                  </div>

                  {/* 1. Dynamic Gateway Switches */}
                  <div className="space-y-1.5 pt-1">
                    <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                      SELECT GATEWAY:
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {displayGateways.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGateway(g)}
                          className={`py-2 px-1 rounded-xl border text-[9.5px] font-black uppercase text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${getMethodColor(g)}`}
                          title={`${g.name} (${g.walletType})`}
                        >
                          <GatewayLogo gateway={g} className="w-5 h-5" />
                          <span className="truncate w-full block text-center text-[8.5px] font-extrabold">{g.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. COMPLETE TRANSACTION (Mockup Style) */}
                  <div className="space-y-3 pt-1">
                    <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest pl-1">
                      2. COMPLETE TRANSACTION
                    </span>

                    <div className="bg-[#030a1c] border border-blue-500/15 p-4 rounded-2xl space-y-4 text-center relative overflow-hidden bg-gradient-to-b from-slate-950/20 to-transparent">
                      {/* Big Glowing Center Logo */}
                      <div className="flex justify-center py-1">
                        <div className="p-3 bg-black/40 rounded-full border border-white/5 shadow-xl transition-all duration-300">
                          <GatewayLogo gateway={selectedGateway} className="w-12 h-12" />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">
                          AMOUNT TO SEND
                        </span>
                        <span className="text-3xl font-black text-white tracking-tight font-mono block">
                          ৳{price}
                        </span>
                      </div>

                      {/* Receiver Phone Container */}
                      <div className="bg-black/60 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-left">
                        <div className="min-w-0">
                          <span className="text-slate-450 block text-[8px] uppercase tracking-wider font-extrabold truncate">
                            {selectedGateway.name.toUpperCase()} NUMBER
                          </span>
                          <span className="text-white font-mono font-bold tracking-widest text-xs select-all block">
                            {selectedGateway.number}
                          </span>
                          <span className="block text-[8px] text-emerald-400 font-bold tracking-wide uppercase mt-0.5">
                            Type: {selectedGateway.walletType}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="bg-blue-500/10 text-blue-400 hover:text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-blue-500/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                        >
                          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copied ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Instructions */}
                      {selectedGateway.instructions && (
                        <div className="text-[10px] text-slate-300 leading-relaxed font-semibold text-center border-t border-white/5 pt-2">
                          {selectedGateway.instructions}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Form */}
                  <form onSubmit={handleFormSubmit} className="space-y-4 text-left pt-1">
                    <div>
                      <label className="block text-[9px] text-blue-400 font-extrabold uppercase tracking-wider mb-1">
                        ENTER TRANSACTION ID / TRXID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-500/60">
                          <Key className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={trxId}
                          onChange={(e) => setTrxId(e.target.value)}
                          placeholder="e.g. 8HG712345B"
                          className="w-full bg-slate-950 border border-blue-500/20 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs text-center font-mono tracking-widest focus:outline-none focus:border-cyan-400 uppercase font-bold"
                        />
                      </div>
                      <p className="text-[8.5px] text-slate-450 mt-1 block tracking-normal text-center">
                        Exact TrxID from your SMS confirmation
                      </p>
                    </div>

                    {/* Screenshot Upload (Optional) */}
                    <div>
                      <label className="block text-[9px] text-blue-400 font-extrabold uppercase tracking-wider mb-1 flex justify-between">
                        <span>Upload Payment Screenshot (Optional)</span>
                        {screenshot && <span className="text-emerald-400 font-black">✓ LOADED</span>}
                      </label>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      {screenshot ? (
                        <div className="relative border border-emerald-500/30 rounded-xl overflow-hidden bg-slate-950 p-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img 
                              src={screenshot} 
                              alt="Screenshot Preview" 
                              className="w-10 h-10 object-cover rounded border border-white/10"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400">Screenshot Attached</p>
                              <p className="text-[8px] text-slate-450">Image ready for verification</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setScreenshot('')}
                            className="text-red-400 hover:text-red-300 p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-[#030a1c] border border-dashed border-blue-500/25 hover:border-cyan-400/50 rounded-xl p-2.5 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-900/40 transition-all text-slate-400"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[10px] font-bold">
                            {uploading ? 'Processing Screenshot...' : 'Upload Payment Screenshot'}
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={onClose}
                        className="py-3 bg-slate-900 border border-blue-500/15 hover:bg-slate-850 text-slate-300 font-black uppercase text-[10px] tracking-widest rounded-xl transition duration-200 cursor-pointer text-center"
                      >
                        BACK
                      </button>
                      <button
                        type="submit"
                        disabled={trxId.trim().length < 8}
                        className="py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:cursor-not-allowed text-center"
                      >
                        VERIFY PAYMENT
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
