import React, { useEffect } from 'react';
import { HotelLocation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin } from 'lucide-react';

interface LocationModalProps {
  location: HotelLocation | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ location, isOpen, onClose }: LocationModalProps) {
  
  // Clean fallback helper for address subtitle
  const getSubAddress = (loc: HotelLocation) => {
    if (loc.name.includes('Le Méridien')) return '79/A Airport Road, Nikunja 2, Dhaka';
    if (loc.name.includes('Westin')) return 'Plot 1, Road 45, Gulshan-2, Dhaka 1212';
    if (loc.name.includes('Radisson')) return 'Airport Road, Dhaka Cantonment, Dhaka 1206';
    return loc.description || 'Premium elite destination sanctuary.';
  };

  // Mobile detection & immediate maps redirect trigger
  useEffect(() => {
    if (isOpen && location) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
      if (isMobile) {
        const queryAddress = getSubAddress(location) + ', ' + location.location;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ', ' + queryAddress)}`;
        
        // Open the native Google Maps app or direct wrapper
        window.open(mapsUrl, '_blank');
        
        // Instant close modal so experience remains snappy
        onClose();
      }
    }
  }, [isOpen, location, onClose]);

  if (!location) return null;

  const getMapEmbedUrl = (loc: HotelLocation) => {
    const addressDetails = getSubAddress(loc);
    return `https://maps.google.com/maps?q=${encodeURIComponent(loc.name + ' ' + addressDetails)}&t=&z=15&ie=UTF8&iwloc=B&output=embed`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
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
            className="w-full max-w-lg bg-[#0a1024] border border-blue-500/10 rounded-[2.5rem] overflow-hidden shadow-3xl z-10 p-6 sm:p-7 relative"
          >
            {/* Close Button X */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
              aria-label="Close Map View"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Name and Address Pin */}
            <div className="text-left space-y-1.5 mb-5 pr-8">
              <h3 className="text-xl sm:text-2xl font-serif font-semibold text-white tracking-wide">
                {location.name}
              </h3>
              <p className="text-xs text-zinc-400 font-medium tracking-wide flex items-center gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{getSubAddress(location)}</span>
              </p>
            </div>

            {/* Embedded Live Google Map Container with High Quality rounded aspect ratio */}
            <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-slate-800 bg-[#030612] relative shadow-inner">
              <iframe
                title={`Interactive Location Map for ${location.name}`}
                src={getMapEmbedUrl(location)}
                className="w-full h-full border-0 opacity-90 transition-opacity hover:opacity-100"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
