import React, { useState } from 'react';
import { CreditCard, DollarSign, Save, Plus, Edit, Trash2, X } from 'lucide-react';
import { PaymentGateway } from '../../types';

interface PaymentGatewaysManagerProps {
  paymentGateways: PaymentGateway[];
  onUpdatePaymentGateways?: (updated: PaymentGateway[]) => void;
  pricingConfig?: {
    registrationFee?: number;
    registrationFeeMale?: number;
    registrationFeeSperm?: number;
    regularPlanFee?: number;
    premiumPlanFee?: number;
    elitePlanFee?: number;
  };
  onUpdatePricingConfig?: (config: any) => void;
}

export const PaymentGatewaysManager: React.FC<PaymentGatewaysManagerProps> = ({
  paymentGateways,
  onUpdatePaymentGateways,
  pricingConfig,
  onUpdatePricingConfig,
}) => {
  // Registration Fees
  const [localRegFee, setLocalRegFee] = useState<number>(pricingConfig?.registrationFee ?? 3000);
  const [localRegFeeMale, setLocalRegFeeMale] = useState<number>(pricingConfig?.registrationFeeMale ?? 3000);
  const [localRegFeeSperm, setLocalRegFeeSperm] = useState<number>(pricingConfig?.registrationFeeSperm ?? 3000);
  const [pricingSuccess, setPricingSuccess] = useState<boolean>(false);

  // Gateway Form State
  const [editingGatewayId, setEditingGatewayId] = useState<string | null>(null);
  const [gwName, setGwName] = useState<string>('');
  const [gwMethod, setGwMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'UPAY' | 'BANK'>('BKASH');
  const [gwNumber, setGwNumber] = useState<string>('');
  const [gwWalletType, setGwWalletType] = useState<'Personal' | 'Agent' | 'Merchant'>('Personal');
  const [gwInstructions, setGwInstructions] = useState<string>('');
  const [gwLogoUrl, setGwLogoUrl] = useState<string>('');

  const handleGatewaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gwName.trim() || !gwNumber.trim()) return;

    if (editingGatewayId) {
      const updated = paymentGateways.map((g) => {
        if (g.id === editingGatewayId) {
          return {
            ...g,
            name: gwName.trim(),
            method: gwMethod,
            number: gwNumber.trim(),
            walletType: gwWalletType,
            instructions: gwInstructions.trim(),
            logoUrl: gwLogoUrl.trim(),
          };
        }
        return g;
      });
      if (onUpdatePaymentGateways) {
        onUpdatePaymentGateways(updated);
      }
      setEditingGatewayId(null);
    } else {
      const newGateway: PaymentGateway = {
        id: 'gw_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000),
        name: gwName.trim(),
        method: gwMethod,
        number: gwNumber.trim(),
        walletType: gwWalletType,
        instructions: gwInstructions.trim(),
        logoUrl: gwLogoUrl.trim(),
        isActive: true,
      };
      if (onUpdatePaymentGateways) {
        onUpdatePaymentGateways([...paymentGateways, newGateway]);
      }
    }

    setGwName('');
    setGwNumber('');
    setGwInstructions('');
    setGwMethod('BKASH');
    setGwWalletType('Personal');
    setGwLogoUrl('');
  };

  const handleCancelEdit = () => {
    setEditingGatewayId(null);
    setGwName('');
    setGwNumber('');
    setGwInstructions('');
    setGwMethod('BKASH');
    setGwWalletType('Personal');
    setGwLogoUrl('');
  };

  const handleToggleStatus = (g: PaymentGateway) => {
    const updated = paymentGateways.map((item) => {
      if (item.id === g.id) {
        return { ...item, isActive: !item.isActive };
      }
      return item;
    });
    if (onUpdatePaymentGateways) {
      onUpdatePaymentGateways(updated);
    }
  };

  const handleDeleteGateway = (id: string) => {
    const updated = paymentGateways.filter((item) => item.id !== id);
    if (onUpdatePaymentGateways) {
      onUpdatePaymentGateways(updated);
    }
    if (editingGatewayId === id) {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (g: PaymentGateway) => {
    setEditingGatewayId(g.id);
    setGwName(g.name);
    setGwNumber(g.number);
    setGwInstructions(g.instructions);
    setGwMethod(g.method as any);
    setGwWalletType(g.walletType as any);
    setGwLogoUrl(g.logoUrl || '');
  };

  return (
    <div id="payment-gateways-manager" className="space-y-6 text-left font-semibold">
      {/* Header Banner */}
      <div className="p-4.5 bg-[#14101e] border border-blue-500/15 rounded-2xl text-xs space-y-2.5 leading-relaxed text-slate-350">
        <h4 className="text-xs font-black uppercase text-red-500 flex items-center gap-2">
          <CreditCard className="w-4.5 h-4.5 animate-pulse" />
          Dynamic Payment Gateway Manager
        </h4>
        <p>
          You can register, edit, toggle, or remove payment gateways dynamically here to deal with single number transactional limitations. Ensure the active status, correct receiver phone numbers, and clear step instructions are specified so clients receive exact guidance upon checkout.
        </p>
      </div>

      {/* Model Registration Fee Configuration */}
      <div className="p-6 bg-[#0f111a] rounded-2xl border-2 border-[#dbaa61]/30 text-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800">
          <div className="space-y-0.5">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#dbaa61] flex items-center gap-1.5 font-mono">
              <DollarSign className="w-4 h-4 text-[#dbaa61]" />
              Model Registration Fee Configuration
            </h5>
            <p className="text-[10px] text-slate-400">
              Configure initial verification/registration fee for applicants by category.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-[9px] font-mono font-bold">
            <span className="text-pink-400 bg-pink-400/5 px-2 py-0.5 rounded border border-pink-400/15">Female: Tk {localRegFee}</span>
            <span className="text-blue-400 bg-blue-400/5 px-2 py-0.5 rounded border border-blue-400/15">Male: Tk {localRegFeeMale}</span>
            <span className="text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/15">Donor: Tk {localRegFeeSperm}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Female */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-pink-400 font-mono tracking-wider">
              Female Model Fee:
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pink-400/60 font-bold text-xs">Tk </span>
              <input
                type="number"
                value={localRegFee}
                onChange={(e) => setLocalRegFee(parseInt(e.target.value) || 0)}
                className="w-full bg-black/40 border border-slate-800 focus:border-pink-500 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                placeholder="e.g. 3000"
              />
            </div>
          </div>

          {/* Male */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-blue-400 font-mono tracking-wider">
              Male Model Fee:
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400/60 font-bold text-xs">Tk </span>
              <input
                type="number"
                value={localRegFeeMale}
                onChange={(e) => setLocalRegFeeMale(parseInt(e.target.value) || 0)}
                className="w-full bg-black/40 border border-slate-800 focus:border-blue-500 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                placeholder="e.g. 3000"
              />
            </div>
          </div>

          {/* Donor */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-amber-500 font-mono tracking-wider">
              Sperm Donor Fee:
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500/60 font-bold text-xs">Tk </span>
              <input
                type="number"
                value={localRegFeeSperm}
                onChange={(e) => setLocalRegFeeSperm(parseInt(e.target.value) || 0)}
                className="w-full bg-black/40 border border-slate-800 focus:border-amber-500 rounded-xl pl-8 pr-3.5 py-2 text-xs text-white font-mono font-bold focus:outline-none"
                placeholder="e.g. 3000"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            id="btn-save-reg-fees"
            type="button"
            onClick={() => {
              if (onUpdatePricingConfig) {
                onUpdatePricingConfig({
                  registrationFee: localRegFee,
                  registrationFeeMale: localRegFeeMale,
                  registrationFeeSperm: localRegFeeSperm,
                  regularPlanFee: pricingConfig?.regularPlanFee,
                  premiumPlanFee: pricingConfig?.premiumPlanFee,
                  elitePlanFee: pricingConfig?.elitePlanFee,
                });
                setPricingSuccess(true);
                setTimeout(() => setPricingSuccess(false), 3000);
              }
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-[#dbaa61] to-[#b38644] hover:from-[#e5b36a] hover:to-[#dbaa61] text-black text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer h-9.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Registration Fees
          </button>
        </div>

        {pricingSuccess && (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center animate-fadeIn">
            Registration fees updated successfully!
          </div>
        )}
      </div>

      {/* Gateway Registration Form */}
      <div className="bg-[#11131a] rounded-2xl border border-white/5 p-5 space-y-4">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] border-b border-[#222938] pb-3 flex items-center gap-1.5 font-mono select-none">
          <Plus className="w-4 h-4 text-emerald-500" />
          {editingGatewayId ? 'EDIT ACTIVE PAYMENT GATEWAY' : 'REGISTER NEW PAYMENT GATEWAY'}
        </h5>

        <form onSubmit={handleGatewaySubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Gateway Display Name */}
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gateway Name</label>
              <input
                type="text"
                required
                value={gwName}
                onChange={(e) => setGwName(e.target.value)}
                placeholder="e.g. bKash Personal 01"
                className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-bold text-xs"
              />
            </div>

            {/* Method Selection */}
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Banking Method</label>
              <select
                value={gwMethod}
                onChange={(e) => setGwMethod(e.target.value as any)}
                className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-bold h-10 select-none text-xs"
              >
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="UPAY">Upay</option>
                <option value="BANK">Bank Transfer</option>
              </select>
            </div>

            {/* Wallet Mode */}
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wallet Account Type</label>
              <select
                value={gwWalletType}
                onChange={(e) => setGwWalletType(e.target.value as any)}
                className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-500 font-bold h-10 select-none text-xs"
              >
                <option value="Personal">Personal</option>
                <option value="Agent">Agent</option>
                <option value="Merchant">Merchant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Wallet phone number */}
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Wallet Number</label>
              <input
                type="text"
                required
                value={gwNumber}
                onChange={(e) => setGwNumber(e.target.value)}
                placeholder="e.g. 01712-345678"
                className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-mono font-bold text-xs"
              />
            </div>

            {/* Logo Upload/URL Input */}
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gateway Logo</label>
              <div className="flex items-center gap-2 bg-black/40 border border-[#232733] rounded-xl p-1 h-10">
                {gwLogoUrl ? (
                  <div className="relative w-8 h-8 rounded bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={gwLogoUrl} alt="Logo preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setGwLogoUrl('')}
                      className="absolute inset-0 bg-black/70 hover:bg-black/85 flex items-center justify-center text-red-500 opacity-0 hover:opacity-100 transition-opacity"
                      title="Remove logo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded border border-dashed border-slate-700 flex items-center justify-center text-slate-500 shrink-0 text-[8px] font-bold font-mono">
                    NO LOGO
                  </div>
                )}
                <input
                  type="text"
                  value={gwLogoUrl}
                  onChange={(e) => setGwLogoUrl(e.target.value)}
                  placeholder="Image URL or upload..."
                  className="flex-1 bg-transparent text-white placeholder-slate-650 focus:outline-none text-[10px] font-bold min-w-0"
                />
                <label className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-[8.5px] font-black uppercase px-2 py-1.5 rounded-lg cursor-pointer shrink-0 select-none border border-slate-750">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setGwLogoUrl(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Step guidance instructions */}
            <div className="space-y-1">
              <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">Payment Step Instructions</label>
              <input
                type="text"
                required
                value={gwInstructions}
                onChange={(e) => setGwInstructions(e.target.value)}
                placeholder="e.g. Send Money to this number and enter TrxID"
                className="w-full bg-black/40 border border-[#232733] rounded-xl px-4 py-2.5 text-white placeholder-slate-650 focus:outline-none focus:border-red-500 font-bold text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            {editingGatewayId && (
              <button
                id="btn-cancel-gw-edit"
                type="button"
                onClick={handleCancelEdit}
                className="bg-slate-800 hover:bg-slate-750 text-white px-5 py-2.5 rounded-xl font-heavy uppercase text-[10px] tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              id="btn-submit-gw"
              type="submit"
              className="bg-gradient-to-tr from-red-700 to-red-550 hover:opacity-95 text-white px-5 py-2.5 rounded-xl font-heavy uppercase text-[10px] tracking-wider transition cursor-pointer active:scale-95"
            >
              {editingGatewayId ? 'Save Gateway Changes' : 'Register New Gateway'}
            </button>
          </div>
        </form>
      </div>

      {/* Display Registered Gateways list */}
      <div className="bg-[#11131a] rounded-2xl border border-white/5 p-4.5">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#5c75ab] border-b border-[#222938] pb-3 mb-4 flex items-center gap-1.5 font-mono text-left select-none">
          <CreditCard className="w-4 h-4 text-[#ef4444]" />
          CURRENT ACTIVE PAYMENT GATEWAYS LIST ({paymentGateways.length})
        </h5>

        {paymentGateways.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-semibold text-xs">
            No custom payment gateways are currently registered. In-built default bKash, Nagad, and Rocket methods will be served dynamically.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentGateways.map((g) => (
              <div
                key={g.id}
                className={`border rounded-xl p-4 flex flex-col justify-between space-y-4 transition ${
                  g.isActive 
                    ? 'bg-black/35 border-blue-500/10' 
                    : 'bg-black/10 border-slate-850 opacity-60'
                }`}
              >
                <div className="text-left space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {g.logoUrl ? (
                        <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                          <img src={g.logoUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-900 border border-slate-850 flex items-center justify-center shrink-0 text-[9px] font-bold text-slate-500 uppercase">
                          {g.method.substring(0, 3)}
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-black text-white block truncate max-w-[130px]">{g.name}</span>
                        <span className="text-[8.5px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 mt-1 inline-block">
                          {g.method}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      g.walletType === 'Personal' 
                        ? 'bg-[#1a1738] text-indigo-400 border border-indigo-500/20' 
                        : g.walletType === 'Agent' 
                        ? 'bg-[#291e10] text-amber-400 border border-amber-500/20' 
                        : 'bg-[#10241b] text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {g.walletType}
                    </span>
                  </div>

                  <div className="bg-black/50 p-2 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-500 font-mono">Number:</span>
                      <span className="text-white font-mono font-bold">{g.number}</span>
                    </div>
                    {g.instructions && (
                      <p className="text-[9.5px] text-slate-400 truncate" title={g.instructions}>
                        {g.instructions}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(g)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all duration-200 border cursor-pointer active:scale-95 ${
                      g.isActive
                        ? 'bg-[#103025] text-emerald-400 border-emerald-500/25 hover:border-emerald-500/55'
                        : 'bg-slate-900 text-slate-500 border-slate-850 hover:text-slate-200 hover:border-slate-800'
                    }`}
                  >
                    {g.isActive ? 'Live' : 'Disabled'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(g)}
                      className="p-1 px-2 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Edit Gateway"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteGateway(g.id)}
                      className="p-1 px-2 rounded bg-red-950/20 border border-red-500/20 text-red-400 hover:text-red-350 hover:bg-red-950/35 transition cursor-pointer"
                      title="Delete Gateway"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
