import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Info, ShieldCheck } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { PaymentGateway } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  tierName: string;
  price: string;
  onClose: () => void;
  onSubmit: (data: { method: string; trxId: string }) => void;
  paymentGateways?: PaymentGateway[];
}

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

  // Sync selected gateway when displayGateways changes or modal is re-opened
  useEffect(() => {
    if (isOpen && displayGateways.length > 0) {
      setSelectedGateway(displayGateways[0]);
    }
  }, [isOpen]);

  const handleCopy = () => {
    // strip out characters like hyphens or space to copy clean phone numbers
    const cleanNumber = selectedGateway.number.replace(/[^0-9]/g, '');
    navigator.clipboard.writeText(cleanNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trxId || trxId.trim().length < 8) return;
    onSubmit({
      method: selectedGateway.name, // e.g. "bKash Personal" or "Rocket Merchant" to preserve detailed tracking in db
      trxId: trxId.trim().toUpperCase()
    });
    setTrxId('');
  };

  // Determine button color corresponding to the gateway branding
  const getMethodColor = (gateway: PaymentGateway) => {
    if (gateway.id === selectedGateway.id) {
      const type = gateway.method.toUpperCase();
      if (type.includes('BKASH')) return 'bg-[#e2125d] border-transparent text-white';
      if (type.includes('NAGAD')) return 'bg-[#f15a22] border-transparent text-white';
      if (type.includes('ROCKET')) return 'bg-[#8c3494] border-transparent text-white';
      return 'bg-blue-600 border-transparent text-white'; // Custom gate brand
    }
    return 'bg-slate-900 border-blue-500/15 text-slate-400 hover:text-slate-300';
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
            className="cyan-glow-card max-w-sm w-full rounded-3xl overflow-hidden relative shadow-2xl p-6 z-10 bg-[#020712] gold-breathing-glow"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="text-center pb-2 border-b border-blue-500/10">
                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secure Dynamic Gateway
                </span>
                <p className="text-lg font-black text-white mt-1">Upgrade to {tierName}</p>
                <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">৳{price}</p>
              </div>

              {/* Dynamic Gateway Switches */}
              <div className="space-y-1.5">
                <span className="block text-[8px] text-slate-450 font-black uppercase tracking-widest pl-1">
                  Select live gateway (গেটওয়ে সিলেক্ট করুন):
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                  {displayGateways.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGateway(g)}
                      className={`py-2 px-1 rounded-xl border text-[10px] sm:text-[10.5px] font-black uppercase text-center transition truncate text-ellipsis cursor-pointer ${getMethodColor(g)}`}
                      title={`${g.name} (${g.walletType})`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Instructions Row dynamically rendered from the selected payment gateway */}
              <div className="bg-[#030a1c] border border-blue-500/15 p-3.5 rounded-xl space-y-2 text-xs text-slate-300 leading-relaxed font-semibold text-left">
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <p className="font-black text-blue-400">📜 Payment Rules (পেমেন্ট নিয়মাবলী):</p>
                </div>
                
                <div className="space-y-1.5 text-[11px] font-medium text-slate-350 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <p>
                    • Account Type: <strong className="text-emerald-400 uppercase tracking-wide font-mono bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/10 text-[9.5px]">{selectedGateway.walletType}</strong>
                  </p>
                  <p className="text-[#f3ecdb] leading-relaxed">
                    {selectedGateway.instructions || `Please Send Money or Pay with ${selectedGateway.name} to the number below.`}
                  </p>
                </div>

                <div className="text-[10.5px] font-mono text-slate-400">
                  ১. এই নম্বরে টাকা পাঠানোর পর আপনার এসএমএস চেক করুন।
                  <br />
                  ২. ফিরতি এসএমএস-এর ৮-সংখ্যার ট্রানজেকশন আইডি (TrxID) নিন।
                </div>
              </div>

              {/* Secure Phone Section with Copy Command */}
              <div className="bg-slate-950 p-3 rounded-xl border border-blue-500/10 text-xs flex justify-between items-center text-left">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">
                    Secure Receiver {selectedGateway.name} Phone
                  </span>
                  <span className="text-white font-mono font-bold tracking-widest text-sm select-all">
                    {selectedGateway.number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="bg-blue-500/10 text-blue-400 hover:text-white text-[10px] font-bold px-2 py-1.5 rounded border border-blue-500/20 flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Submit TrxID Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[9px] text-blue-400 font-extrabold uppercase tracking-wider mb-1">
                    Payment Transaction ID (TrxID)
                  </label>
                  <input
                    type="text"
                    required
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="e.g. 9B8C2D4A"
                    className="w-full bg-slate-950 border border-blue-500/20 text-white rounded-xl px-4 py-2.5 text-xs text-center font-mono tracking-widest focus:outline-none focus:border-cyan-400 uppercase"
                  />
                  {trxId && trxId.trim().length < 8 && (
                    <span className="text-[9px] text-rose-400 mt-1 block tracking-normal">
                      ID must be at least 8 characters.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={trxId.trim().length < 8}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider py-3.5 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:cursor-not-allowed"
                >
                  Confirm Dynamic Upgrade Request
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
