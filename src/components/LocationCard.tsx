import { HotelLocation } from '../types';
import { motion } from 'motion/react';
import { MapPin, Map, Star } from 'lucide-react';

interface LocationCardProps {
  location: HotelLocation;
  onMapClick: (location: HotelLocation) => void;
  onReserveClick: (location: HotelLocation) => void;
  key?: string;
}

export default function LocationCard({ location, onMapClick, onReserveClick }: LocationCardProps) {
  // Determine premium status badge based on star/price
  const getBadgeInfo = (star: string) => {
    const s = (star || '').toUpperCase();
    if (s.includes('5 STAR') || s.includes('PREMIUM') || s.includes('VIP')) {
      return { text: 'PREMIUM', classes: 'bg-amber-950/75 text-amber-400 border border-amber-500/30' };
    }
    return { text: 'OPEN', classes: 'bg-emerald-950/75 text-emerald-400 border border-emerald-500/30' };
  };

  const badge = getBadgeInfo(location.star || '');

  // Clean fallback helper for address subtitle
  const getSubtitle = (name: string, addr: string | undefined, desc: string) => {
    if (addr && addr.trim() !== '') return addr;
    if (name.includes('Le Méridien')) return '79/A Airport Road, Nikunja 2, Dhaka';
    if (name.includes('Westin')) return 'Plot 1, Road 45, Gulshan-2, Dhaka 1212';
    if (name.includes('Radisson')) return 'Airport Road, Dhaka Cantonment, Dhaka 1206';
    return desc || 'Premium elite destination sanctuary.';
  };

  const renderStars = (starStr: string) => {
    const normalized = (starStr || '').toUpperCase();
    let starsCount = 0;
    if (normalized.includes('5')) starsCount = 5;
    else if (normalized.includes('4')) starsCount = 4;
    else if (normalized.includes('3')) starsCount = 3;
    else if (normalized.includes('2')) starsCount = 2;
    else if (normalized.includes('1')) starsCount = 1;

    if (starsCount > 0) {
      return (
        <div className="flex items-center gap-0.5" title={`${starsCount} Star Star Rating`}>
          {Array.from({ length: starsCount }).map((_, i) => (
            <Star
              key={i}
              className="w-3 h-3 text-amber-400 fill-amber-400"
            />
          ))}
        </div>
      );
    }

    if (normalized.includes('BOUTIQUE')) {
      return (
        <span className="text-[8px] bg-indigo-950/70 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
          BOUTIQUE
        </span>
      );
    }
    if (normalized.includes('SAFE HOUSE') || normalized.includes('SAFEHOUSE')) {
      return (
        <span className="text-[8px] bg-rose-950/70 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-wider">
          SAFE HOUSE
        </span>
      );
    }
    return (
      <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-450 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
        {starStr}
      </span>
    );
  };

  return (
    <motion.div
      onClick={() => onReserveClick(location)}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2 }}
      className="w-full bg-[#040919]/90 rounded-2xl overflow-hidden border border-slate-900 hover:border-amber-500/30 shadow-2xl flex flex-col justify-between cursor-pointer transition-all animate-fadeIn"
    >
      {/* Top Banner & Photo Section */}
      <div className="relative h-48 bg-[#020510] overflow-hidden group">
        <img
          src={location.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600'}
          alt={location.name}
          className="w-full h-full object-cover opacity-80 group-hover:opacity-95 group-hover:scale-103 transition-all duration-500 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Ambient top & bottom gradients */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        
        {/* Dynamic Status Tag (OPEN / PREMIUM) */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`text-[8px] font-extrabold tracking-[0.2em] px-2.5 py-1.5 rounded-md uppercase font-mono shadow-md backdrop-blur-md ${badge.classes}`}>
            {badge.text}
          </span>
        </div>

        {/* Float Bottom Left Destination Pin Indicator */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5 shadow-md">
          <MapPin className="text-amber-500 w-3.5 h-3.5 fill-amber-500/20" />
          <span className="text-[10px] text-white font-extrabold tracking-widest uppercase font-mono">
            {location.location}
          </span>
        </div>
      </div>

      {/* Card Content & Action Suite */}
      <div className="p-5 flex flex-col flex-1 text-left justify-between bg-gradient-to-b from-[#060c22] to-[#030612]">
        <div className="space-y-1.5">
          {/* Hotel Name Title & Stars row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-[1.125rem] font-bold text-white tracking-wide hover:text-amber-400 transition-colors duration-200 line-clamp-1 flex-1">
              {location.name}
            </h4>
            <div className="shrink-0 flex items-center gap-1 py-0.5">
              {renderStars(location.star)}
            </div>
          </div>
          
          {/* Address string */}
          <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed tracking-wide line-clamp-1">
            {getSubtitle(location.name, location.address, location.description)}
          </p>

          {/* Description details render */}
          {location.description && (
            <div className="mt-3 bg-black/40 border border-white/5 rounded-xl p-3">
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium line-clamp-4 italic">
                "{location.description}"
              </p>
            </div>
          )}
          
          {/* Charge Price Info */}
          <div className="pt-2 flex items-baseline gap-1 animate-fadeIn">
            <span className="text-[#dbaa61] text-[1.45rem] font-black font-mono leading-none">
              ৳{location.price?.toLocaleString('en-US') || '0'}
            </span>
            <span className="text-[10px] text-zinc-500 font-extrabold tracking-widest uppercase font-mono">
              / NIGHT
            </span>
          </div>
        </div>

        {/* Dashed Separator Line */}
        <div className="border-t border-dashed border-slate-800/80 my-4" />

        {/* Action Button Controls (MAP / RESERVE) */}
        <div className="grid grid-cols-2 gap-3 pb-1">
          {/* Outlined interactive map locator */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMapClick(location);
            }}
            className="border border-amber-500/20 bg-slate-950/40 hover:bg-slate-900/60 hover:border-amber-500/50 text-amber-400 font-extrabold text-[11px] uppercase tracking-widest py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md cursor-pointer leading-none"
          >
            <Map className="w-3.5 h-3.5 text-amber-500" />
            <span>MAP</span>
          </button>

          {/* Solid bold reserve agent booking dispatcher */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReserveClick(location);
            }}
            className="orange-grad-btn font-extrabold text-[11px] uppercase tracking-widest py-3 px-4 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer leading-none"
          >
            RESERVE
          </button>
        </div>
      </div>
    </motion.div>
  );
}
