import React, { useState } from 'react';
import { ShieldCheck, Users, Plus, Trash2, Key, Lock, RefreshCw, Send } from 'lucide-react';
import { db, doc, setDoc, deleteDoc } from '../../firebase';
import { setCloudDocument, deleteCloudDocument } from '../../services/cloudService';

interface AdminObj {
  email: string;
  telegram?: string;
  role?: 'super_admin' | 'admin' | 'moderator';
}

interface ActiveSession {
  role?: string;
  identifier?: string;
  activeDurationMs?: number;
  [key: string]: any;
}

interface AdministrativeTeamManagerProps {
  adminEmails: AdminObj[];
  adminEmail: string;
  loggedInAdminRole: string;
  updateAdminEmails: (updated: AdminObj[]) => Promise<void> | void;
  activePresenceList?: ActiveSession[];
}

export const AdministrativeTeamManager: React.FC<AdministrativeTeamManagerProps> = ({
  adminEmails,
  adminEmail,
  loggedInAdminRole,
  updateAdminEmails,
  activePresenceList = [],
}) => {
  const [adminSearchTerm, setAdminSearchTerm] = useState<string>('');
  const [selectedAdminRoleFilter, setSelectedAdminRoleFilter] = useState<string>('all');
  const [confirm2FAResetEmail, setConfirm2FAResetEmail] = useState<string | null>(null);
  const [confirmRemoveEmail, setConfirmRemoveEmail] = useState<string | null>(null);
  const [viewingBackupCodesEmail, setViewingBackupCodesEmail] = useState<string | null>(null);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState<string[]>([]);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const formatPresenceDuration = (ms?: number) => {
    if (!ms) return 'Active now';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const visibleAdminEmails = adminEmails.filter((item) => {
    const email = (item.email || '').toLowerCase();
    const telegram = (item.telegram || '').toLowerCase();
    const role = item.role || (email === '16killer2@gmail.com' ? 'super_admin' : 'admin');
    const term = adminSearchTerm.toLowerCase().trim();

    const matchesSearch = !term || email.includes(term) || telegram.includes(term);
    const matchesRole =
      selectedAdminRoleFilter === 'all' ||
      (selectedAdminRoleFilter === 'super_admin' && role === 'super_admin') ||
      (selectedAdminRoleFilter === 'admin' && role === 'admin') ||
      (selectedAdminRoleFilter === 'moderator' && role === 'moderator');

    return matchesSearch && matchesRole;
  });

  return (
    <div id="admin-team-manager" className="space-y-6 text-left font-semibold animate-fadeIn">
      {/* Luxury Header Banner */}
      <div className="relative p-6 bg-gradient-to-r from-[#171412] to-[#0c0d12] border-l-4 border-[#dbaa61] rounded-2xl text-xs space-y-3 shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <ShieldCheck className="w-32 h-32 text-[#dbaa61]" />
        </div>
        <h4 className="text-sm font-black uppercase text-[#dbaa61] flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Confidential Administration Gateway
        </h4>
        <p className="text-slate-300 leading-relaxed font-medium">
          Here you can view, register, or revoke system administrator credentials dynamically. Registered administrators must supply both an authorized Email and a verified Telegram profile to maintain instant 2-Step OTP authentication channels and elite security integrity.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-bold text-center border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
              : 'bg-red-950/40 border-red-500/30 text-red-400'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form to Register New Admin (2 Columns) */}
        {loggedInAdminRole !== 'super_admin' ? (
          <div className="lg:col-span-2 p-6 bg-red-950/10 border border-red-500/20 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-xl select-none">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-black uppercase tracking-wider text-red-500">
                Access Restricted
              </h5>
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                Only the Super Administrator can add new staff accounts or modify security clearance privileges.
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-5 bg-[#11131a] rounded-2xl border border-white/[0.04] text-xs space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-white">
                  Add New System Administrator
                </h5>
                <p className="text-[9px] text-slate-500 font-bold">Register new administrative credentials</p>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.elements.namedItem('newAdminEmail') as HTMLInputElement;
                const telegramInput = form.elements.namedItem('newAdminTelegram') as HTMLInputElement;
                const roleSelect = form.elements.namedItem('newAdminRole') as HTMLSelectElement;
                const passwordInput = form.elements.namedItem('newAdminPassword') as HTMLInputElement;

                const emailVal = emailInput?.value?.trim()?.toLowerCase();
                let telegramVal = telegramInput?.value?.trim();
                const roleVal = (roleSelect?.value as 'super_admin' | 'admin' | 'moderator') || 'admin';
                const passwordVal = passwordInput?.value?.trim();

                if (!emailVal || !telegramVal || !passwordVal) {
                  showFeedback('Please fill out all required fields.', 'error');
                  return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(emailVal)) {
                  showFeedback('Please provide a valid email address.', 'error');
                  return;
                }

                if (passwordVal.length < 5) {
                  showFeedback('Password must be at least 5 characters long.', 'error');
                  return;
                }

                if (adminEmails.some((a) => a.email.toLowerCase() === emailVal)) {
                  showFeedback('This administrator email already exists.', 'error');
                  return;
                }

                if (!telegramVal.startsWith('@')) {
                  telegramVal = '@' + telegramVal;
                }

                if (telegramVal.length < 3) {
                  showFeedback('Please enter a valid Telegram username (e.g. @developer_akhi).', 'error');
                  return;
                }

                try {
                  const passDocRef = doc(db, 'admin_passwords', emailVal);
                  await setDoc(passDocRef, { password: passwordVal });
                  await setCloudDocument('admin_passwords', emailVal, { password: passwordVal });

                  const adminDocRef = doc(db, 'admin_emails', emailVal);
                  await setDoc(
                    adminDocRef,
                    {
                      email: emailVal,
                      telegram: telegramVal,
                      role: roleVal,
                    },
                    { merge: true }
                  );
                  await setCloudDocument('admin_emails', emailVal, {
                    email: emailVal,
                    telegram: telegramVal,
                    role: roleVal,
                  });

                  await updateAdminEmails([
                    ...adminEmails.filter((a) => a.email.toLowerCase() !== emailVal),
                    { email: emailVal, telegram: telegramVal, role: roleVal },
                  ]);
                  form.reset();
                  showFeedback(`[OK] Admin "${emailVal}" (${roleVal}) successfully registered!`, 'success');
                } catch (err: any) {
                  console.error(err);
                  showFeedback('Failed to register administrator: ' + (err.message || ''), 'error');
                }
              }}
              className="space-y-4"
            >
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                  Administrator Email *
                </label>
                <input
                  type="email"
                  name="newAdminEmail"
                  required
                  placeholder="e.g. staff@bodytouch.com"
                  className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-705 focus:outline-none focus:border-[#dbaa61] transition-all font-bold font-mono text-xs"
                />
              </div>

              {/* Telegram Username Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                  Telegram Username (@handle) *
                </label>
                <input
                  type="text"
                  name="newAdminTelegram"
                  required
                  placeholder="e.g. @developer_akhi"
                  className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-705 focus:outline-none focus:border-[#dbaa61] transition-all font-bold font-mono text-xs"
                />
              </div>

              {/* Role Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                  Access Role Level *
                </label>
                <select
                  name="newAdminRole"
                  defaultValue="admin"
                  className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#dbaa61] transition-all font-bold text-xs"
                >
                  <option value="admin">DEFAULT ADMIN</option>
                  <option value="moderator">MODERATOR</option>
                  <option value="super_admin">SUPER ADMIN</option>
                </select>
              </div>

              {/* Initial Password Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#dbaa61]">
                  Temporary Password *
                </label>
                <input
                  type="text"
                  name="newAdminPassword"
                  required
                  placeholder="e.g. Pass123456@"
                  className="w-full bg-black/40 border border-[#232733] hover:border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-705 focus:outline-none focus:border-[#dbaa61] transition-all font-bold font-mono text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#dbaa61] to-[#b38644] hover:from-[#e5b36a] hover:to-[#dbaa61] text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Authorize New Administrator
              </button>
            </form>
          </div>
        )}

        {/* Directory Listing of Admins (3 Columns) */}
        <div className="lg:col-span-3 p-5 bg-[#11131a] rounded-2xl border border-white/[0.04] text-xs space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/[0.05] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-[11px] font-black uppercase tracking-wider text-white">
                  Authorized Administrators Directory
                </h5>
                <span className="text-[9px] text-slate-500 font-bold">{adminEmails.length} active staff accounts</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                placeholder="Search staff..."
                className="bg-black/40 border border-[#232733] rounded-lg px-2.5 py-1 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-[#dbaa61] w-full sm:w-36"
              />
              <select
                value={selectedAdminRoleFilter}
                onChange={(e) => setSelectedAdminRoleFilter(e.target.value)}
                className="bg-black/40 border border-[#232733] rounded-lg px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-[#dbaa61]"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admins</option>
                <option value="admin">Admins</option>
                <option value="moderator">Moderators</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {visibleAdminEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-semibold">
                No administrator matches your search filter.
              </div>
            ) : (
              visibleAdminEmails.map((adminObj) => {
                const emailAddress = adminObj.email;
                const telegramHandle = adminObj.telegram || '@not_configured';
                const cleanTeleHandle = telegramHandle.startsWith('@') ? telegramHandle.substring(1) : telegramHandle;
                const userRole = adminObj.role || (emailAddress.toLowerCase() === '16killer2@gmail.com' ? 'super_admin' : 'admin');
                const isMainSuperAdmin = emailAddress.toLowerCase() === '16killer2@gmail.com';
                const isCurrentlyLoggedInUser = emailAddress.toLowerCase() === adminEmail.toLowerCase();

                let badgeText = 'Admin Staff';
                let badgeStyle = 'bg-slate-900 text-slate-400 border border-slate-800';
                if (userRole === 'super_admin') {
                  badgeText = 'Super Admin';
                  badgeStyle = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                } else if (userRole === 'moderator') {
                  badgeText = 'Moderator';
                  badgeStyle = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                }

                const onlineSession = activePresenceList.find(
                  (s) => s.role === 'admin' && (s.identifier || '').toLowerCase() === emailAddress.toLowerCase()
                );

                return (
                  <div
                    key={emailAddress}
                    className="bg-black/25 border border-white/[0.02] hover:border-white/[0.05] rounded-2xl p-3.5 flex flex-col gap-3 transition-all duration-200"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-950/40 to-slate-900 border border-[#dbaa61]/25 flex items-center justify-center text-[#dbaa61] font-extrabold text-xs shrink-0 select-none">
                        {emailAddress.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left font-semibold min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 block font-mono truncate" title={emailAddress}>
                            {emailAddress}
                          </span>
                          {onlineSession && (
                            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded text-[8.5px] font-black text-blue-400 font-mono animate-pulse shrink-0 relative">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping absolute" />
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 relative" />
                              <span>ACTIVE: {formatPresenceDuration(onlineSession.activeDurationMs)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {loggedInAdminRole === 'super_admin' && !isMainSuperAdmin && !isCurrentlyLoggedInUser ? (
                            <select
                              value={userRole}
                              onChange={(e) => {
                                const nextRole = e.target.value as 'super_admin' | 'admin' | 'moderator';
                                const updated = adminEmails.map((item) => {
                                  if (item.email.toLowerCase() === emailAddress.toLowerCase()) {
                                    return { ...item, role: nextRole };
                                  }
                                  return item;
                                });
                                updateAdminEmails(updated);
                                showFeedback(`Role for "${emailAddress}" changed to ${nextRole.toUpperCase()}`, 'success');
                              }}
                              className="bg-[#0b0c10] border border-[#232733] hover:border-[#dbaa61]/40 rounded-lg text-[9px] font-black text-[#dbaa61] px-2 py-0.5 focus:outline-none cursor-pointer"
                            >
                              <option value="admin">ADMIN</option>
                              <option value="moderator">MODERATOR</option>
                              <option value="super_admin">SUPER ADMIN</option>
                            </select>
                          ) : (
                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeStyle}`}>
                              {badgeText}
                            </span>
                          )}
                          <a
                            href={`https://t.me/${cleanTeleHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[8.5px] font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
                            title="Contact via Telegram"
                          >
                            <Send className="w-2.5 h-2.5" />
                            {telegramHandle}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Actions footer inside card */}
                    <div className="flex flex-col gap-2 border-t border-white/[0.03] pt-2.5">
                      <div className="flex items-center gap-1.5">
                        {/* Reset 2FA Button - Allowed only for Super Admin */}
                        {loggedInAdminRole === 'super_admin' && (
                          confirm2FAResetEmail === emailAddress ? (
                            <div className="flex-1 flex flex-col gap-1 p-1 bg-amber-955/20 border border-amber-500/25 rounded-lg text-center">
                              <span className="text-[8px] text-amber-300 font-bold uppercase">Reset 2FA?</span>
                              <div className="flex gap-1 justify-center">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const trimmedEmail = emailAddress.trim().toLowerCase();
                                    try {
                                      await deleteDoc(doc(db, 'admin_totp_secrets', trimmedEmail));
                                      showFeedback(`Google Authenticator 2FA secret reset for ${emailAddress}.`, 'success');
                                    } catch (err: any) {
                                      showFeedback(`Could not reset 2FA: ${err.message}`, 'error');
                                    }
                                    setConfirm2FAResetEmail(null);
                                  }}
                                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black text-[8px] font-black rounded cursor-pointer transition-all"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirm2FAResetEmail(null)}
                                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-black rounded cursor-pointer transition-all"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirm2FAResetEmail(emailAddress);
                                setConfirmRemoveEmail(null);
                              }}
                              className="flex-1 py-1 px-2 rounded-lg bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/25 text-[#dbaa61] hover:text-white text-[9px] font-extrabold uppercase transition cursor-pointer flex items-center justify-center gap-1 min-h-[28px]"
                              title="Reset TOTP 2FA secret for this user"
                            >
                              <Key className="w-3 h-3" />
                              Reset 2FA
                            </button>
                          )
                        )}

                        {isMainSuperAdmin ? (
                          <span className="flex-1 py-1 px-2.5 rounded-lg bg-emerald-950/40 text-emerald-400 border border-emerald-500/25 text-[8px] font-black uppercase tracking-wider text-center select-none min-h-[28px] flex items-center justify-center">
                            Owner Key
                          </span>
                        ) : (
                          loggedInAdminRole === 'super_admin' && !isCurrentlyLoggedInUser && (
                            confirmRemoveEmail === emailAddress ? (
                              <div className="flex-1 flex flex-col gap-1 p-1 bg-red-955/20 border border-red-500/25 rounded-lg text-center">
                                <span className="text-[8px] text-red-300 font-bold uppercase">Remove Admin?</span>
                                <div className="flex gap-1 justify-center">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const targetEmail = emailAddress.toLowerCase().trim();
                                      const newAdminList = adminEmails.filter(
                                        (e) => (e.email || '').toLowerCase().trim() !== targetEmail
                                      );
                                      await updateAdminEmails(newAdminList);
                                      await deleteDoc(doc(db, 'admin_emails', targetEmail));
                                      await deleteCloudDocument('admin_emails', targetEmail);
                                      await deleteDoc(doc(db, 'admin_passwords', targetEmail));
                                      await deleteDoc(doc(db, 'admin_totp_secrets', targetEmail));
                                      showFeedback(`Admin "${emailAddress}" removed from directory.`, 'success');
                                      setConfirmRemoveEmail(null);
                                    }}
                                    className="px-2 py-0.5 bg-red-500 hover:bg-red-450 text-white text-[8px] font-black rounded cursor-pointer transition-all"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmRemoveEmail(null)}
                                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-black rounded cursor-pointer transition-all"
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmRemoveEmail(emailAddress);
                                  setConfirm2FAResetEmail(null);
                                }}
                                className="flex-1 py-1 px-2 rounded-lg bg-red-950/30 hover:bg-red-900/40 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-white text-[9px] font-extrabold uppercase transition cursor-pointer flex items-center justify-center gap-1 min-h-[28px]"
                                title="Permanently remove admin ID"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Custom Passwords Editor Area */}
      <div className="p-5 bg-[#11131a] rounded-2xl border border-white/[0.04] text-xs space-y-5 shadow-xl mt-6">
        <div className="flex items-center gap-2 border-b border-white/[0.05] pb-3">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-[11px] font-black uppercase tracking-wider text-white font-display">
              Configure Administrator Sign-In Passwords
            </h5>
            <p className="text-[9px] text-slate-500 font-bold">Override or update credentials directly</p>
          </div>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const emailSelect = form.elements.namedItem('adminPassEmail') as HTMLSelectElement;
            const passInput = form.elements.namedItem('adminPassVal') as HTMLInputElement;
            const emailVal = emailSelect?.value?.trim()?.toLowerCase();
            const passVal = passInput?.value?.trim();

            if (!emailVal || !passVal) {
              showFeedback('Please select an admin and enter the new password.', 'error');
              return;
            }

            if (passVal.length < 5) {
              showFeedback('Password must be at least 5 characters long.', 'error');
              return;
            }

            try {
              const passDocRef = doc(db, 'admin_passwords', emailVal);
              await setDoc(passDocRef, { password: passVal });
              showFeedback(`Password updated successfully for ${emailVal}!`, 'success');
              form.reset();
            } catch (err: any) {
              console.error(err);
              showFeedback('Could not update password: ' + (err.message || ''), 'error');
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase font-black text-slate-400">Select Whitelisted Admin</label>
            <select
              name="adminPassEmail"
              required
              className="w-full bg-[#050811] border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none focus:border-rose-500 h-[38px]"
            >
              <option value="">-- Select Admin Email --</option>
              {adminEmails.map((adminObj) => (
                <option key={adminObj.email} value={adminObj.email.toLowerCase()}>
                  {adminObj.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] uppercase font-black text-slate-400">Set Custom Password</label>
            <input
              name="adminPassVal"
              type="text"
              required
              placeholder="e.g. 16killer2@secure"
              className="w-full bg-[#050811] border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-rose-500 font-mono h-[38px] text-[11px]"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full h-[38px] bg-[#dbaa61] hover:bg-[#c99a51] text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition hover:opacity-90 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
