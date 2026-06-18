import React from 'react';
import { HotelLocation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, ExternalLink, CalendarDays } from 'lucide-react';

interface LocationModalProps {
  location: HotelLocation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ location, isOpen, onClose }: LocationModalProps) {
  
  // Clean fallback helper for address subtitle
  const getSubAddress = (loc: HotelLocation) => {
    if (loc.address) return loc.address;
    if (loc.name.includes('Le Méridien')) return '79/A Airport Road, Nikunja 2, Dhaka';
    if (loc.name.includes('Westin')) return 'Plot 1, Road 45, Gulshan-2, Dhaka 1212';
    if (loc.name.includes('Radisson')) return 'Airport Road, Dhaka Cantonment, Dhaka 1206';
    return loc.description || 'Premium elite destination sanctuary.';
  };

  if (!location) return null;

  const addressDetails = getSubAddress(location);

  const getMapEmbedUrl = (loc: HotelLocation) => {
    if (loc.mapEmbedUrl && loc.mapEmbedUrl.trim()) {
      return loc.mapEmbedUrl.trim();
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(loc.name + ' ' + addressDetails)}&t=&z=15&ie=UTF8&iwloc=B&output=embed`;
  };

  const handleOpenGoogleMaps = () => {
    const queryAddress = addressDetails + ', ' + location.location;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ', ' + queryAddress)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Map Modal Container - Matching exact user design style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-lg bg-[#0a1024] border border-blue-500/10 rounded-[2.5rem] max-h-[90vh] overflow-y-auto scrollbar-none shadow-3xl z-10 p-6 sm:p-7 relative"
          >
            {/* Close Button X */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors bg-black/30 p-1.5 rounded-full z-20"
              aria-label="Close Map View"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            {/* Header: Name and Address Pin */}
            <div className="text-left space-y-1.5 mb-5 pr-8">
              <h3 className="text-lg sm:text-xl font-serif font-semibold text-white tracking-wide">
                {location.name}
              </h3>
              <p className="text-[11px] text-zinc-300 font-medium tracking-wide flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span>{addressDetails}</span>
              </p>
            </div>

            {/* Embedded Live Google Map Container with High Quality rounded aspect ratio */}
            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-slate-800 bg-[#030612] relative shadow-inner mb-5">
              <iframe
                title={`Interactive Location Map for ${location.name}`}
                src={getMapEmbedUrl(location)}
                className="w-full h-full border-0 opacity-90 transition-opacity hover:opacity-100"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Action Buttons: Navigate/View Map externally or Book Directly */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleOpenGoogleMaps}
                className="w-full text-xs font-black tracking-widest text-amber-400 border border-amber-500/20 bg-slate-950/40 hover:bg-slate-900/60 hover:border-amber-500/40 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-amber-500" />
                <span>OPEN GOOGLE MAPS</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-xs font-black tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>OK, CLOSE VIEW</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
