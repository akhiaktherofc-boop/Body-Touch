import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ShieldCheck, Star, Users, Bell, Heart, Trophy } from 'lucide-react';
import { db, doc, onSnapshot } from '../firebase';

interface Slide {
  id: number | string;
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  iconName?: string;
}

interface ImageSliderProps {
  emergencyNotice?: string;
}

export default function ImageSlider({ emergencyNotice }: ImageSliderProps) {
  const [dbSlides, setDbSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Subscribe to real-time hero slides configurations in Cloud Firestore settings collection
  useEffect(() => {
    const docRef = doc(db, 'settings', 'hero_slides');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.slides && Array.isArray(data.slides) && data.slides.length > 0) {
          // Normalize ids as numbers or strings
          const items = data.slides.map((s, idx) => ({
            id: s.id || idx,
            image: s.image || '',
            title: s.title || '',
            subtitle: s.subtitle || '',
            badge: s.badge || 'PROMO',
            badgeColor: s.badgeColor || 'from-amber-500 to-yellow-600',
            iconName: s.iconName || 'star'
          }));
          setDbSlides(items);
        } else {
          setDbSlides([]);
        }
      }
    }, (err) => {
      console.warn('Failed to subscribe to database hero slides settings:', err);
    });
    return () => unsubscribe();
  }, []);

  // Standard high-quality default fallback slides in case database is empty
  const defaultSlides: Slide[] = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000',
      title: 'Premium Escorts & Models',
      subtitle: 'Explore the finest elite companion dispatch services in Dhaka and Chittagong.',
      badge: 'FEATURED DISPATCH',
      badgeColor: 'from-pink-500 to-rose-600',
      iconName: 'star'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1000',
      title: 'জরুরী বুকিং নোটিশ',
      subtitle: emergencyNotice || 'সার্ভিসের ন্যূনতম ১ ঘণ্টা পূর্বে বুকিং দিবেন। সাপোর্টে কথা না বলে ক্যাম সার্ভিস বুকিং দিবেন না',
      badge: 'URGENT NOTICE & ALERT',
      badgeColor: 'from-amber-500 to-red-600',
      iconName: 'bell'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000',
      title: 'Discreet Hotel Partnerings',
      subtitle: 'Verified top-tier luxury hotels with 100% secure privacy protection.',
      badge: 'SECURE PLACES',
      badgeColor: 'from-cyan-500 to-blue-650',
      iconName: 'shield'
    }
  ];

  const slidesToShow = dbSlides.length > 0 ? dbSlides : defaultSlides;

  // Auto progression timer
  useEffect(() => {
    if (slidesToShow.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slidesToShow.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slidesToShow.length]);

  // Handle current index limits gracefully if list size shrinks dynamically in admin
  useEffect(() => {
    if (currentIndex >= slidesToShow.length) {
      setCurrentIndex(0);
    }
  }, [slidesToShow.length, currentIndex]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slidesToShow.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slidesToShow.length);
  };

  // Helper safely mapping string labels to stunning Lucide Icons
  const renderSlideIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'bell':
        return <Bell className="w-3.5 h-3.5 text-white animate-bounce shrink-0" />;
      case 'shield':
        return <ShieldCheck className="w-3.5 h-3.5 text-cyan-300 shrink-0" />;
      case 'users':
        return <Users className="w-3.5 h-3.5 text-orange-200 shrink-0" />;
      case 'heart':
        return <Heart className="w-3.5 h-3.5 text-red-300 fill-red-400 animate-pulse shrink-0" />;
      case 'trophy':
        return <Trophy className="w-3.5 h-3.5 text-yellow-300 shrink-0" />;
      case 'star':
      default:
        return <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />;
    }
  };

  if (slidesToShow.length === 0) return null;

  return (
    <div id="hero-slider" className="relative w-full h-[220px] rounded-3xl overflow-hidden golden-animated-border bg-[#020713]">
      {/* Slides Background Container */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0.6, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.6, scale: 0.98 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Main Image */}
          <img
            src={slidesToShow[currentIndex].image}
            alt={slidesToShow[currentIndex].title}
            className="w-full h-full object-cover object-center opacity-45"
            referrerPolicy="no-referrer"
          />
          {/* Linear Gradient Mask to match premium UI */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020713] via-[#020713]/60 to-[#020713]/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020713]/85 via-[#020713]/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Slide Content Overlay */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between text-left pointer-events-none">
        {/* Top Badges */}
        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black text-white bg-gradient-to-r ${slidesToShow[currentIndex].badgeColor} shadow-md tracking-wider flex items-center gap-1`}>
            {renderSlideIcon(slidesToShow[currentIndex].iconName)}
            {slidesToShow[currentIndex].badge}
          </span>
        </div>

        {/* Bottom Text Area */}
        <div className="space-y-1.5 max-w-[85%]">
          <motion.h3 
            key={`title-${currentIndex}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-lg font-black tracking-tight text-white leading-tight font-sans drop-shadow-md"
          >
            {slidesToShow[currentIndex].title}
          </motion.h3>

          <motion.p 
            key={`sub-${currentIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-[11.5px] leading-relaxed text-slate-200 drop-shadow-sm font-medium"
          >
            {slidesToShow[currentIndex].subtitle}
          </motion.p>
        </div>
      </div>

      {/* Manual Slide Toggles */}
      <div className="absolute right-4 bottom-4 flex items-center space-x-1.5 z-10">
        <button
          onClick={prevSlide}
          className="w-7 h-7 rounded-lg bg-black/60 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur"
          title="Previous slide"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="w-7 h-7 rounded-lg bg-black/60 border border-white/10 hover:border-amber-500/40 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur"
          title="Next slide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slider Indicators dots */}
      <div className="absolute left-5 bottom-4 flex items-center space-x-1 z-10">
        {slidesToShow.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              idx === currentIndex ? 'w-5 bg-amber-400' : 'w-1.5 bg-slate-600'
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

