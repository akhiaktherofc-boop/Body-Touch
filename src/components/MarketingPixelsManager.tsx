import React, { useState } from 'react';
import { 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Eye, 
  ShieldCheck, 
  Code2, 
  Radio, 
  Sparkles, 
  ExternalLink,
  Save,
  RotateCcw
} from 'lucide-react';
import { MarketingTrackingSettings } from '../types';
import { analyticsService, DEFAULT_TRACKING_SETTINGS } from '../services/analyticsService';

interface MarketingPixelsManagerProps {
  settings: MarketingTrackingSettings;
  onSaveSettings: (settings: MarketingTrackingSettings) => Promise<void>;
  loggedInAdminEmail?: string;
}

export const MarketingPixelsManager: React.FC<MarketingPixelsManagerProps> = ({
  settings,
  onSaveSettings,
  loggedInAdminEmail,
}) => {
  const [formData, setFormData] = useState<MarketingTrackingSettings>({
    ...DEFAULT_TRACKING_SETTINGS,
    ...(settings || {}),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ fired: string[]; timestamp: string } | null>(null);

  const handleChange = (field: keyof MarketingTrackingSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setSaveSuccess(false);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload: MarketingTrackingSettings = {
        ...formData,
        facebookPixelId: (formData.facebookPixelId || '').trim(),
        facebookTestEventCode: (formData.facebookTestEventCode || '').trim(),
        tiktokPixelId: (formData.tiktokPixelId || '').trim(),
        gtmContainerId: (formData.gtmContainerId || '').trim(),
        ga4MeasurementId: (formData.ga4MeasurementId || '').trim(),
        lastUpdated: new Date().toISOString(),
        updatedBy: loggedInAdminEmail || 'Super Admin',
      };

      await onSaveSettings(payload);
      analyticsService.initMarketingPixels(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save marketing tracking settings:', err);
      alert('❌ ট্র্যাকিং সেটিংস সেভ করতে সমস্যা হয়েছে: ' + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFireTest = () => {
    const res = analyticsService.fireTestEvents();
    setTestResult(res);
    setTimeout(() => {
      setTestResult(null);
    }, 6000);
  };

  const isAnyPixelActive =
    (formData.facebookPixelEnabled && !!formData.facebookPixelId.trim()) ||
    (formData.tiktokPixelEnabled && !!formData.tiktokPixelId.trim()) ||
    (formData.gtmEnabled && !!formData.gtmContainerId.trim()) ||
    (formData.ga4Enabled && !!formData.ga4MeasurementId.trim());

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="p-5 sm:p-6 bg-[#0e1017] rounded-3xl border border-amber-500/15 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#dbaa61]/10 via-red-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-amber-500/10 border border-amber-500/30 text-[#dbaa61]">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
                Marketing & Ad Tracking Pixels (বিজ্ঞাপন ও বুস্ট ট্র্যাকিং)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Facebook Ads, TikTok Ads, Google Ads এবং Tag Manager এর মাধ্যমে প্রতিটি ভিজিটর, মডেল প্রোফাইল ভিউ, বুকিং এবং পেমেন্ট কনভার্সন ট্র্যাক করুন।
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleFireTest}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600/20 to-red-600/20 hover:from-amber-600/30 hover:to-red-600/30 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-lg"
              title="Test fire conversion events on active pixels"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Fire Test Event</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#dbaa61] to-[#b38642] hover:brightness-110 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-lg disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Tracking IDs'}</span>
            </button>
          </div>
        </div>

        {/* Realtime Status Indicator Strip */}
        <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="text-left">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Meta / Facebook</span>
              <span className="text-xs font-bold text-slate-200 font-mono">
                {formData.facebookPixelId.trim() ? formData.facebookPixelId : 'Not Configured'}
              </span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${formData.facebookPixelEnabled && formData.facebookPixelId ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-700'}`} />
          </div>

          <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="text-left">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">TikTok Pixel</span>
              <span className="text-xs font-bold text-slate-200 font-mono">
                {formData.tiktokPixelId.trim() ? formData.tiktokPixelId : 'Not Configured'}
              </span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${formData.tiktokPixelEnabled && formData.tiktokPixelId ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-700'}`} />
          </div>

          <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="text-left">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Google Tag Manager</span>
              <span className="text-xs font-bold text-slate-200 font-mono">
                {formData.gtmContainerId.trim() ? formData.gtmContainerId : 'Not Configured'}
              </span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${formData.gtmEnabled && formData.gtmContainerId ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-slate-700'}`} />
          </div>

          <div className="p-3 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="text-left">
              <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Google Analytics 4</span>
              <span className="text-xs font-bold text-slate-200 font-mono">
                {formData.ga4MeasurementId.trim() ? formData.ga4MeasurementId : 'Not Configured'}
              </span>
            </div>
            <span className={`w-2.5 h-2.5 rounded-full ${formData.ga4Enabled && formData.ga4MeasurementId ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-slate-700'}`} />
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>✅ ট্র্যাকিং পিক্সেল সফলভাবে ডাটাবেজে সেভ হয়েছে এবং সাইটে লাইভ এক্টিভ করা হয়েছে!</span>
          </div>
        )}

        {testResult && (
          <div className="mt-4 p-3 bg-blue-950/40 border border-blue-500/30 rounded-2xl flex items-start gap-2.5 text-blue-300 text-xs font-bold animate-in fade-in">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p>🔥 টেস্ট কনভার্সন ইভেন্ট ফায়ার হয়েছে ({testResult.timestamp}):</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {testResult.fired.length > 0 ? (
                  testResult.fired.map((f, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 text-[10px] font-mono border border-blue-500/30">
                      {f}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400 text-[10px]">কোনো পিক্সেল অন নেই। নিচে পিক্সেল আইডি দিয়ে এনাবল করুন।</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Pixel Setup Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Meta / Facebook Pixel Card */}
        <div className="bg-[#0b0d14] p-5 sm:p-6 rounded-3xl border border-blue-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                f
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                  Facebook Pixel (Meta Pixel)
                </h3>
                <p className="text-[10px] text-slate-400">Meta Ads Manager ও Facebook Boost এর জন্য</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.facebookPixelEnabled}
                onChange={(e) => handleChange('facebookPixelEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-300 mb-1">
                Facebook Pixel ID (মেটা পিক্সেল আইডি) *
              </label>
              <input
                type="text"
                value={formData.facebookPixelId}
                onChange={(e) => handleChange('facebookPixelId', e.target.value)}
                placeholder="e.g. 1284950294827104"
                className="w-full bg-black/50 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold placeholder-slate-600 focus:outline-none transition-all"
              />
              <p className="text-[9px] text-slate-500 mt-1">
                Meta Events Manager থেকে পাওয়া ১৫-১৬ ডিজিটের Pixel ID দিন।
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
                Meta Test Event Code (ঐচ্ছিক / টেস্ট কোড)
              </label>
              <input
                type="text"
                value={formData.facebookTestEventCode || ''}
                onChange={(e) => handleChange('facebookTestEventCode', e.target.value)}
                placeholder="e.g. TEST12345"
                className="w-full bg-black/50 border border-slate-800 focus:border-blue-500/60 rounded-xl px-4 py-2 text-xs text-slate-300 font-mono placeholder-slate-600 focus:outline-none transition-all"
              />
              <p className="text-[9px] text-slate-500 mt-1">
                Meta Events Manager এর "Test Events" ট্যাবের কোড দিলে লাইভ টেস্ট দেখা যাবে।
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                Standard Events: PageView, ViewContent, InitiateCheckout, Purchase, Lead
              </span>
              <a
                href="https://business.facebook.com/events_manager2"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1 font-bold"
              >
                Meta Events <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 2. TikTok Pixel Card */}
        <div className="bg-[#0b0d14] p-5 sm:p-6 rounded-3xl border border-cyan-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                🎵
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                  TikTok Pixel
                </h3>
                <p className="text-[10px] text-slate-400">TikTok Ads Manager ও ভিডিও ক্যাম্পেইনের জন্য</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tiktokPixelEnabled}
                onChange={(e) => handleChange('tiktokPixelEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-300 mb-1">
                TikTok Pixel ID (টিকটক পিক্সেল আইডি) *
              </label>
              <input
                type="text"
                value={formData.tiktokPixelId}
                onChange={(e) => handleChange('tiktokPixelId', e.target.value)}
                placeholder="e.g. CXXXXXXXXXXXXXXX"
                className="w-full bg-black/50 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold placeholder-slate-600 focus:outline-none transition-all"
              />
              <p className="text-[9px] text-slate-500 mt-1">
                TikTok Ads Manager Assets → Events → Web Events থেকে Pixel ID কপি করুন।
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Auto Events: PageView, ViewContent, InitiateCheckout, CompletePayment, SubmitForm
              </span>
              <a
                href="https://ads.tiktok.com/i18n/events_manager"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 font-bold"
              >
                TikTok Ads <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 3. Google Tag Manager (GTM) Card */}
        <div className="bg-[#0b0d14] p-5 sm:p-6 rounded-3xl border border-blue-400/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-bold text-xs font-mono">
                GTM
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                  Google Tag Manager (GTM)
                </h3>
                <p className="text-[10px] text-slate-400">All-in-one Tag Container ও Advanced Event Layer</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.gtmEnabled}
                onChange={(e) => handleChange('gtmEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-300 mb-1">
                GTM Container ID (ট্যাগ ম্যানেজার আইডি) *
              </label>
              <input
                type="text"
                value={formData.gtmContainerId}
                onChange={(e) => handleChange('gtmContainerId', e.target.value)}
                placeholder="e.g. GTM-XXXXXXX"
                className="w-full bg-black/50 border border-slate-800 focus:border-blue-400 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold placeholder-slate-600 focus:outline-none transition-all uppercase"
              />
              <p className="text-[9px] text-slate-500 mt-1">
                GTM- ফরম্যাটে কন্টেইনার আইডি দিন। এটি অটোমেটিকালি Header ও Body Noscript ইনজেক্ট করবে।
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-300" />
                DataLayer ready: virtual_page_view, begin_checkout, purchase, generate_lead
              </span>
              <a
                href="https://tagmanager.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:underline flex items-center gap-1 font-bold"
              >
                Tag Manager <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 4. Google Analytics 4 (GA4) Card */}
        <div className="bg-[#0b0d14] p-5 sm:p-6 rounded-3xl border border-amber-500/20 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
                GA4
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
                  Google Analytics 4 (GA4)
                </h3>
                <p className="text-[10px] text-slate-400">Google Ads Conversion ও ভিজিটর মেট্রিক ট্র্যাকিং</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.ga4Enabled}
                onChange={(e) => handleChange('ga4Enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-300 mb-1">
                GA4 Measurement ID (মেজারমেন্ট আইডি) *
              </label>
              <input
                type="text"
                value={formData.ga4MeasurementId}
                onChange={(e) => handleChange('ga4MeasurementId', e.target.value)}
                placeholder="e.g. G-XXXXXXXXXX"
                className="w-full bg-black/50 border border-slate-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold placeholder-slate-600 focus:outline-none transition-all uppercase"
              />
              <p className="text-[9px] text-slate-500 mt-1">
                Google Analytics 4 Data Streams থেকে পাওয়া G- ফরম্যাটের আইডি দিন।
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                Enhanced Ecommerce: page_view, view_item, begin_checkout, purchase, generate_lead
              </span>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
              >
                Analytics <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Event Triggers Toggles */}
      <div className="bg-[#0b0d14] p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Automated Conversion Event Triggers (অটো ইভেন্ট ট্র্যাকিং রুলস)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              কোন কোন ইভেন্টগুলোতে ফেসবুক ও টিকটকে কনভার্সন সিগন্যাল পাঠানো হবে তা কনফিগার করুন:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <label className="p-3.5 bg-black/40 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">Page Views (পেজ ভিউ)</span>
              <span className="text-[9px] text-slate-400">প্রতিটি পেজ এবং ক্যাটাগরি ব্রাউজিং ট্র্যাক</span>
            </div>
            <input
              type="checkbox"
              checked={formData.trackPageViews}
              onChange={(e) => handleChange('trackPageViews', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="p-3.5 bg-black/40 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">Model Profile Views (ViewContent)</span>
              <span className="text-[9px] text-slate-400">এসকর্ট মডেল প্রোফাইল বা পিকচার ভিউ</span>
            </div>
            <input
              type="checkbox"
              checked={formData.trackViewContent}
              onChange={(e) => handleChange('trackViewContent', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="p-3.5 bg-black/40 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">Booking Start (InitiateCheckout)</span>
              <span className="text-[9px] text-slate-400">বুকিং বা এডভান্স পেমেন্ট ফর্ম ওপেন করা</span>
            </div>
            <input
              type="checkbox"
              checked={formData.trackInitiateCheckout}
              onChange={(e) => handleChange('trackInitiateCheckout', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="p-3.5 bg-black/40 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">Payment Completed (Purchase)</span>
              <span className="text-[9px] text-slate-400">বিকাশ/নগদ ডিপোজিট বা বুকিং নিশ্চিত</span>
            </div>
            <input
              type="checkbox"
              checked={formData.trackPurchase}
              onChange={(e) => handleChange('trackPurchase', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="p-3.5 bg-black/40 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">Telegram / Helpline Click (Contact)</span>
              <span className="text-[9px] text-slate-400">টেলিগ্রাম বা হেল্পলাইনে যোগাযোগ ক্লিক</span>
            </div>
            <input
              type="checkbox"
              checked={formData.trackContact}
              onChange={(e) => handleChange('trackContact', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>

          <label className="p-3.5 bg-black/40 border border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-700 transition">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-bold text-white block">Registration & Leads (Lead)</span>
              <span className="text-[9px] text-slate-400">নতুন ক্লায়েন্ট, এজেন্ট বা মডেল রেজিস্ট্রেশন</span>
            </div>
            <input
              type="checkbox"
              checked={formData.trackRegistration}
              onChange={(e) => handleChange('trackRegistration', e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Advanced Custom Script Injection */}
      <div className="bg-[#0b0d14] p-5 sm:p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Code2 className="w-4 h-4 text-[#dbaa61]" />
          <h3 className="text-sm font-black text-white uppercase tracking-wider font-sans">
            Custom Header & Body Tracking Scripts (কাস্টম ট্র্যাকিং কোড)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-300 mb-1.5">
              Header Custom Scripts (&lt;head&gt; কোড)
            </label>
            <textarea
              rows={4}
              value={formData.customHeaderScript || ''}
              onChange={(e) => handleChange('customHeaderScript', e.target.value)}
              placeholder="<!-- Paste any custom verification meta tag, Pinterest Tag, Snapchat Pixel etc. -->"
              className="w-full bg-black/60 border border-slate-800 focus:border-[#dbaa61] rounded-2xl p-3 text-xs text-slate-300 font-mono placeholder-slate-700 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-300 mb-1.5">
              Footer / Body Scripts (&lt;body&gt; কোড)
            </label>
            <textarea
              rows={4}
              value={formData.customFooterScript || ''}
              onChange={(e) => handleChange('customFooterScript', e.target.value)}
              placeholder="<!-- Paste any body tracking scripts or verification snippets -->"
              className="w-full bg-black/60 border border-slate-800 focus:border-[#dbaa61] rounded-2xl p-3 text-xs text-slate-300 font-mono placeholder-slate-700 focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="flex items-center justify-between p-4 bg-[#0a0c12] rounded-2xl border border-white/5 flex-wrap gap-3">
        <div className="text-[10px] text-slate-400 font-mono">
          Last saved: {formData.lastUpdated ? new Date(formData.lastUpdated).toLocaleString() : 'Not modified yet'}
          {formData.updatedBy ? ` by ${formData.updatedBy}` : ''}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...DEFAULT_TRACKING_SETTINGS, ...(settings || {}) })}
            className="px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#dbaa61] to-[#b38642] hover:brightness-110 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-xl disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save & Publish Pixels'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
