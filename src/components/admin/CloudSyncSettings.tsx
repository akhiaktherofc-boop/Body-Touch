import React from 'react';
import { Database, Sparkles, Save, Upload, Trash2 } from 'lucide-react';
import { isRealFirebaseEnabled } from '../../firebase';

interface CloudSyncSettingsProps {
  fbApiKey: string;
  setFbApiKey: (val: string) => void;
  fbProjectId: string;
  setFbProjectId: (val: string) => void;
  fbAppId: string;
  setFbAppId: (val: string) => void;
  fbAuthDomain: string;
  setFbAuthDomain: (val: string) => void;
  fbStorageBucket: string;
  setFbStorageBucket: (val: string) => void;
  fbMessagingSenderId: string;
  setFbMessagingSenderId: (val: string) => void;
  fbStatusMessage: string;
  handleSaveFirebaseConfig: () => void;
  handleDownloadFirebaseConfigJson: () => void;
  handleClearFirebaseConfig: () => void;
}

export const CloudSyncSettings: React.FC<CloudSyncSettingsProps> = ({
  fbApiKey,
  setFbApiKey,
  fbProjectId,
  setFbProjectId,
  fbAppId,
  setFbAppId,
  fbAuthDomain,
  setFbAuthDomain,
  fbStorageBucket,
  setFbStorageBucket,
  fbMessagingSenderId,
  setFbMessagingSenderId,
  fbStatusMessage,
  handleSaveFirebaseConfig,
  handleDownloadFirebaseConfigJson,
  handleClearFirebaseConfig,
}) => {
  const isEnabled = isRealFirebaseEnabled();

  return (
    <div id="cloud-sync-settings-card" className="p-5 bg-[#11131a] rounded-2xl border border-amber-500/10 space-y-5 text-left">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
              Hostinger Cloud Sync Setup
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Connect your website to real-time Cloud Firestore database. Syncs agents, companions, and orders instantly.
            </p>
          </div>
        </div>
        <div>
          {isEnabled ? (
            <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-mono">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Real Cloud Sync Active
            </span>
          ) : (
            <span className="text-[9.5px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-mono">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Local Offline Mode Active
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 bg-[#0a0c14] border border-blue-500/10 rounded-xl text-[11px] text-slate-400 leading-relaxed font-sans font-medium space-y-1.5">
        <p className="text-white font-bold mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Instructions for Hostinger & Cloudflare Real-Time Data Sync:
        </p>
        <p>1. Go to Firebase Console and create a project with a Firestore Database.</p>
        <p>2. Add a Web App in Firebase Project Settings and copy the configuration credentials.</p>
        <p>3. Enter the credentials below and click Save Connection.</p>
        <p>4. Click Download Config File to get firebase_config.json.</p>
        <p>5. Upload firebase_config.json into your Hostinger public_html directory for instant real-time sync.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-350 tracking-wider font-mono">
            Firebase API Key
          </label>
          <input
            type="text"
            value={fbApiKey}
            onChange={(e) => setFbApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-350 tracking-wider font-mono">
            Firebase Project ID
          </label>
          <input
            type="text"
            value={fbProjectId}
            onChange={(e) => setFbProjectId(e.target.value)}
            placeholder="bodytouch-app"
            className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-350 tracking-wider font-mono">
            Firebase App ID
          </label>
          <input
            type="text"
            value={fbAppId}
            onChange={(e) => setFbAppId(e.target.value)}
            placeholder="1:xxxxxxxx:web:yyyy"
            className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-700 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-350 tracking-wider font-mono text-slate-500">
            Auth Domain (Optional)
          </label>
          <input
            type="text"
            value={fbAuthDomain}
            onChange={(e) => setFbAuthDomain(e.target.value)}
            placeholder="bodytouch-app.firebaseapp.com"
            className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-800 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-350 tracking-wider font-mono text-slate-500">
            Storage Bucket (Optional)
          </label>
          <input
            type="text"
            value={fbStorageBucket}
            onChange={(e) => setFbStorageBucket(e.target.value)}
            placeholder="bodytouch-app.appspot.com"
            className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-800 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase text-slate-350 tracking-wider font-mono text-slate-500">
            Messaging Sender ID (Optional)
          </label>
          <input
            type="text"
            value={fbMessagingSenderId}
            onChange={(e) => setFbMessagingSenderId(e.target.value)}
            placeholder="1234567890"
            className="w-full bg-black/40 border border-[#232733] focus:border-amber-500 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-800 focus:outline-none"
          />
        </div>
      </div>

      {fbStatusMessage && (
        <div className="p-3 rounded-xl text-xs font-bold leading-relaxed border bg-amber-950/20 border-amber-500/20 text-amber-400">
          {fbStatusMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5 pt-1">
        <button
          id="btn-save-firebase-config"
          type="button"
          onClick={handleSaveFirebaseConfig}
          className="bg-indigo-600 hover:bg-indigo-550 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98 font-mono"
        >
          <Save className="w-4 h-4 text-white" />
          Save Connection
        </button>

        {fbApiKey.trim() && (
          <button
            id="btn-download-firebase-config"
            type="button"
            onClick={handleDownloadFirebaseConfigJson}
            className="bg-emerald-600 hover:bg-emerald-550 text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 shadow-lg active:scale-98 font-mono"
          >
            <Upload className="w-4 h-4 text-white" />
            Download Config File
          </button>
        )}

        {isEnabled && (
          <button
            id="btn-clear-firebase-config"
            type="button"
            onClick={handleClearFirebaseConfig}
            className="bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/25 text-rose-450 hover:text-white text-[10px] font-black uppercase tracking-wider py-2.5 px-4.5 rounded-xl transition duration-150 cursor-pointer flex items-center gap-1.5 active:scale-98 font-mono"
          >
            <Trash2 className="w-4 h-4 text-rose-550" />
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};
