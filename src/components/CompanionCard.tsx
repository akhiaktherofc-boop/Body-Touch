import { Companion } from '../types';
import { motion } from 'motion/react';
import { Crown, Star, Sparkles } from 'lucide-react';

interface CompanionCardProps {
  companion: Companion;
  onSelect: (companion: Companion) => void;
  key?: string;
}

export default function CompanionCard({ companion, onSelect }: CompanionCardProps) {
  // Select badge color styling based on tier
  const getBadgeStyle = () => {
    switch (companion.badge) {
      case 'ELITE':
        return 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400';
      case 'PREMIUM':
        return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
      case 'REGULAR':
        return 'bg-violet-500/10 border border-violet-500/35 text-violet-400';
      default:
        return 'bg-slate-900/80 border border-slate-700/50 text-slate-300';
    }
  };

  const getIcon = () => {
    switch (companion.badge) {
      case 'ELITE':
        return <Crown className="w-3 h-3 text-cyan-400 fill-cyan-400/20" />;
      case 'PREMIUM':
        return <Star className="w-3 h-3 text-amber-400 fill-amber-400/20" />;
      default:
        return <Sparkles className="w-3 h-3 text-blue-400" />;
    }
  };

  return (
    <motion.div
      onClick={() => onSelect(companion)}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0 w-48 snap-start cursor-pointer bg-black/95 rounded-2xl overflow-hidden border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-300 shadow-xl gold-breathing-glow"
    >
      <div className="relative h-56 bg-slate-950 group overflow-hidden">
        <img
          src={companion.image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600'}
          alt={companion.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out"
          referrerPolicy="no-referrer"
        />
        
        {/* Tier status tag */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`text-[8.5px] font-black tracking-widest px-2 py-0.5 rounded-full uppercase flex items-center gap-1 backdrop-blur-md ${getBadgeStyle()}`}>
            {getIcon()}
            <span>{companion.badge}</span>
          </span>
        </div>
      </div>

      {/* Editorial details block below the image */}
      <div className="p-3 bg-black/95 text-left border-t border-slate-900">
        <h4 className="text-xs font-black text-white uppercase tracking-wider truncate">
          {companion.name}
        </h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
            {companion.tag}
          </span>
          <span className="text-[10px] text-emerald-400 font-black font-mono">
            ৳{(companion.rate).toLocaleString()}/hr
          </span>
        </div>
      </div>
    </motion.div>
  );
}
