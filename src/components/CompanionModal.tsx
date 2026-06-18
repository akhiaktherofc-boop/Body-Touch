import { Companion, Review } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Globe, Award, Sparkles, Star } from 'lucide-react';

interface CompanionModalProps {
  companion: Companion | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: () => void;
  reviews?: Review[];
}

export default function CompanionModal({ 
  companion, 
  isOpen, 
  onClose, 
  onBook,
  reviews = []
}: CompanionModalProps) {
  if (!companion) return null;

  // Filter reviews for this specific companion model
  const compReviews = reviews.filter(
    (r) => r.companionName.toLowerCase() === companion.name.toLowerCase()
  );

  // Calculate average rating
  const averageRating = compReviews.length > 0
    ? (compReviews.reduce((sum, r) => sum + r.rating, 0) / compReviews.length).toFixed(1)
    : '5.0';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          {/* Backdrop Click Dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="cyan-glow-card max-w-md w-full rounded-3xl max-h-[90vh] overflow-y-auto scrollbar-none relative shadow-2xl z-10 bg-black border border-slate-800 gold-breathing-glow"
          >
            {/* Close button */}
            <button
               onClick={onClose}
               className="absolute top-4 right-4 bg-black/80 text-slate-400 hover:text-white p-2 rounded-full border border-slate-800 transition-all z-30 shadow-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Image Banner */}
            <div className="relative h-64 bg-black border-b border-slate-800 overflow-hidden">
              <img
                src={companion.image}
                alt={companion.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 z-20">
                <span className="profile-badge text-[8.5px] text-cyan-400 font-extrabold tracking-widest px-2.5 py-1.5 rounded bg-black/90 border border-slate-800 shadow-sm">
                  VERIFIED PROFILE
                </span>
              </div>
            </div>

            {/* Profile Title Header Block */}
            <div className="p-5 pb-0 text-left bg-black border-b border-slate-900">
              <h4 className="text-2xl font-mono font-black text-white tracking-tight">
                {companion.name}
              </h4>
              <p className="text-xs text-cyan-400 font-semibold uppercase tracking-wider mt-1">
                {companion.tag}
              </p>
            </div>

            {/* Content Details */}
            <div className="p-5 space-y-5 text-left max-h-[380px] overflow-y-auto scrollbar-none bg-black">
              {/* Core metrics grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Age / Height</span>
                  <span className="text-white text-sm block font-black">
                    {companion.age} Yrs / {companion.height}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-extrabold">Languages</span>
                  <div className="flex items-center gap-1.5 text-white text-sm font-black">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>{companion.languages.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Sperm Donor Vitals (Blood Group & Sperm Count Report) */}
              {(companion.category === 'Sperm Donor' || companion.bloodGroup || companion.spermCount) && (
                <div className="bg-[#0c0d12] border border-[#ac843c]/35 hover:border-[#ac843c]/60 rounded-2xl p-4 space-y-3 shadow-md">
                  <span className="text-[#dbaa61] block text-[9px] uppercase tracking-widest font-black border-b border-[#ac843c]/15 pb-1 font-mono">
                    SPERM DONOR LAB VITALS / ল্যাব টেস্ট ও রক্তের গ্রুপ
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold">
                    <div className="text-left font-sans">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Blood Group / রক্তের গ্রুপ</span>
                      <span className="text-[#dbaa61] text-xs sm:text-sm block font-black mt-0.5">
                        {companion.bloodGroup || 'B+ (Verified)'}
                      </span>
                    </div>
                    <div className="text-left font-sans">
                      <span className="block text-[8px] text-slate-400 uppercase font-bold">Sperm Count / স্পার্ম কাউন্ট</span>
                      <span className="text-emerald-450 text-xs sm:text-sm block font-black mt-0.5">
                        {companion.spermCount || '85 Million/ml (Excellent)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Physical Statistics Details */}
              {(companion.bodyColor || companion.weight || companion.bust || companion.waist || companion.hip) && (
                <div className="bg-[#0c0d12] border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <span className="text-white block text-[9px] uppercase tracking-widest font-black border-b border-slate-800/60 pb-1">
                    PHYSICAL METRICS / অঙ্গসংস্থানিক বিবরণী
                  </span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs font-semibold">
                    {companion.bodyColor && (
                      <div className="text-left">
                        <span className="block text-[8px] text-slate-400 uppercase font-black">Skin Complexion</span>
                        <span className="text-slate-200 text-xs block font-bold">{companion.bodyColor}</span>
                      </div>
                    )}
                    {companion.weight && (
                      <div className="text-left">
                        <span className="block text-[8px] text-slate-400 uppercase font-black">Weight</span>
                        <span className="text-slate-200 text-xs block font-bold">{companion.weight}</span>
                      </div>
                    )}
                    {companion.bust && (
                      <div className="text-left">
                        <span className="block text-[8px] text-slate-400 uppercase font-black">Bust / Chest size</span>
                        <span className="text-pink-400 text-xs block font-bold">{companion.bust}</span>
                      </div>
                    )}
                    {companion.waist && (
                      <div className="text-left">
                        <span className="block text-[8px] text-slate-400 uppercase font-black">Waist size</span>
                        <span className="text-amber-400 text-xs block font-bold">{companion.waist}</span>
                      </div>
                    )}
                    {companion.hip && (
                      <div className="text-left col-span-2">
                        <span className="block text-[8px] text-slate-400 uppercase font-black">Hip measurement</span>
                        <span className="text-slate-200 text-xs block font-bold">{companion.hip}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Specialty & Focus area */}
              <div className="space-y-1.5 border-t border-slate-800 pt-3">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                  <Award className="w-3 h-3 text-slate-400" /> SPECIALTY FOCUS
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                  {companion.specialty}
                </p>
              </div>

              {/* Private Dispatch Rates card */}
              <div className="bg-[#0c0d12] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">DISPATCH RATE</span>
                  <span className="text-slate-500 text-xs font-semibold">Taxes & Logistics Covered</span>
                </div>
                <span className="text-lg text-emerald-450 font-extrabold font-mono">
                  ৳{companion.rate.toLocaleString()} / Hr
                </span>
              </div>

              {/* Reviews & Ratings Section */}
              <div className="space-y-3.5 border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-300 uppercase tracking-widest font-extrabold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> REVIEWS & RATINGS ({compReviews.length})
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-slate-200 font-extrabold">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{averageRating} / 5.0</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 select-none">
                  {compReviews.length === 0 ? (
                    <p className="text-[10px] text-slate-500 italic">No custom member reviews yet. Rated 5.0/5.0 by our verified concierges.</p>
                  ) : (
                    compReviews.map((rev) => (
                      <div key={rev.id} className="bg-[#0c0d12] border border-slate-800/60 p-2.5 rounded-xl text-[10.5px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-200 font-black">{rev.reviewerName}</span>
                          <div className="flex items-center space-x-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-2.5 h-2.5 ${
                                  s <= rev.rating 
                                    ? 'text-amber-500 fill-amber-500' 
                                    : 'text-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-400 italic">"{rev.comment}"</p>
                        <span className="text-[8.5px] text-slate-500 block mt-0.5">{rev.date}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-transparent border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-extrabold py-3.5 rounded-xl transition duration-200 cursor-pointer text-center"
                >
                  Close Profile
                </button>
                <button
                  type="button"
                  onClick={onBook}
                  className="flex-1 orange-grad-btn hover:opacity-95 text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Instant Book</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
