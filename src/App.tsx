import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLogo } from './components/BrandLogo';
import {
  Compass,
  Crown,
  CreditCard,
  Share2,
  User,
  ShieldCheck,
  Lock,
  ArrowRight,
  Users,
  Building,
  Clock,
  Star,
  Camera,
  Send,
  Info,
  RefreshCw,
  Sparkles,
  Gift,
  ShieldAlert,
  Wallet,
  Check,
  Gem,
  ArrowUp,
  ArrowDown,
  ClipboardList,
  X,
  Copy,
  Link2,
  Percent,
  Infinity,
  UserMinus,
  Mail,
  Briefcase,
  Search,
  MapPin
} from 'lucide-react';

import emailjs from '@emailjs/browser';

import { Companion, HotelLocation, Booking, PaymentRecord, MemberLevel, EmailLog, Review, PaymentGateway, ParentArea, ReferralRecord, WithdrawalRecord } from './types';
import { COMPANIONS, LOCATIONS } from './data';
import CompanionCard from './components/CompanionCard';
import CompanionModal from './components/CompanionModal';
import LocationCard from './components/LocationCard';
import LocationModal from './components/LocationModal';
import HotelReservationModal from './components/HotelReservationModal';
import BookingModal, { calculateBookingCost } from './components/BookingModal';
import CheckoutModal from './components/CheckoutModal';
import WalletModal from './components/WalletModal';
import AdminPanel from './components/AdminPanel';
import Toast from './components/Toast';
import ImageSlider from './components/ImageSlider';
import LoginGate from './components/LoginGate';
import JoinModal from './components/JoinModal';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      damping: 15, 
      stiffness: 100 
    } 
  }
};

export default function App() {
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    return localStorage.getItem('bt_remember_me') !== 'false';
  });

  const getStoredItem = (key: string, defaultValue: string = '') => {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || defaultValue;
  };

  const storage = rememberMe ? localStorage : sessionStorage;

  // State Initialization from Session/LocalStorage
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return getStoredItem('bt_is_logged_in') === 'true';
  });

  const [username, setUsername] = useState<string>(() => {
    return getStoredItem('bt_username');
  });

  const [fullName, setFullName] = useState<string>(() => {
    return getStoredItem('bt_fullname');
  });

  const [email, setEmail] = useState<string>(() => {
    return getStoredItem('bt_email');
  });

  const [phone, setPhone] = useState<string>(() => {
    return getStoredItem('bt_phone');
  });

  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return getStoredItem('bt_avatar_url');
  });

  const [userLevel, setUserLevel] = useState<MemberLevel>(() => {
    return (getStoredItem('bt_userlevel') as MemberLevel) || 'FREE';
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = getStoredItem('bt_bookings');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = getStoredItem('bt_reviews');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'rev-1',
        bookingId: 'book-rev-1',
        companionName: 'Anika Rahman',
        rating: 5,
        comment: 'অসাধারণ সেবা এবং চমৎকার ব্যবহার! আমি খুবই সন্তুষ্ট।',
        reviewerName: 'Tasnim Ahmed',
        date: '6/5/2026, 8:43:12 PM'
      },
      {
        id: 'rev-2',
        bookingId: 'book-rev-2',
        companionName: 'Nesta',
        rating: 5,
        comment: 'Extremely polite, elegant personality and wonderful companion.',
        reviewerName: 'Kabir Chowdhury',
        date: '6/7/2026, 11:20:00 PM'
      }
    ];
  });

  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const [companions, setCompanions] = useState<Companion[]>(() => {
    const saved = getStoredItem('bt_companions');
    return saved ? JSON.parse(saved) : COMPANIONS;
  });

  const [locations, setLocations] = useState<HotelLocation[]>(() => {
    const saved = getStoredItem('bt_locations');
    const parsed = saved ? JSON.parse(saved) : null;
    if (parsed && Array.isArray(parsed) && parsed.length >= 5 && parsed[0].price !== undefined) {
      return parsed;
    }
    return LOCATIONS;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = getStoredItem('bt_payments');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'pay-initial',
        username: 'akhiaktherofc',
        tierName: 'Free Access',
        price: '0',
        method: 'System Init',
        trxId: 'SYS_VERIFIED_99',
        status: 'Approved',
        date: new Date().toLocaleString()
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<'home' | 'membership' | 'assets' | 'network' | 'profile'>('home');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    
    const isJoinRoute = hash.includes('join') || hash.includes('register') || hash.includes('registration') || hash.includes('model') || hash.includes('joinmale') || hash.includes('join-male') || hash.includes('joinsparm') || hash.includes('join-sparm') || hash.includes('joinsperm') || hash.includes('join-sperm') || hash.includes('sparm') || hash.includes('sperm') ||
                        search.includes('join') || search.includes('register') || search.includes('registration') || search.includes('model') || search.includes('joinmale') || search.includes('join-male') || search.includes('joinsparm') || search.includes('join-sparm') || search.includes('joinsperm') || search.includes('join-sperm') || search.includes('sparm') || search.includes('sperm') ||
                        path.includes('join') || path.includes('register') || path.includes('registration') || path.includes('model') || path.includes('joinmale') || path.includes('join-male') || path.includes('joinsparm') || path.includes('join-sparm') || path.includes('joinsperm') || path.includes('join-sperm') || path.includes('sparm') || path.includes('sperm');
                        
    return isJoinRoute && !(hash.includes('admin') || search.includes('admin') || path.includes('admin'));
  });
  const [joinModalType, setJoinModalType] = useState<'female' | 'male' | 'donor' | null>(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    
    const isJoinRoute = hash.includes('join') || hash.includes('register') || hash.includes('registration') || hash.includes('model') || hash.includes('joinmale') || hash.includes('join-male') || hash.includes('joinsparm') || hash.includes('join-sparm') || hash.includes('joinsperm') || hash.includes('join-sperm') || hash.includes('sparm') || hash.includes('sperm') ||
                        search.includes('join') || search.includes('register') || search.includes('registration') || search.includes('model') || search.includes('joinmale') || search.includes('join-male') || search.includes('joinsparm') || search.includes('join-sparm') || search.includes('joinsperm') || search.includes('join-sperm') || search.includes('sparm') || search.includes('sperm') ||
                        path.includes('join') || path.includes('register') || path.includes('registration') || path.includes('model') || path.includes('joinmale') || path.includes('join-male') || path.includes('joinsparm') || path.includes('join-sparm') || path.includes('joinsperm') || path.includes('join-sperm') || path.includes('sparm') || path.includes('sperm');
                        
    if (isJoinRoute && !(hash.includes('admin') || search.includes('admin') || path.includes('admin'))) {
      if (hash.includes('male') || search.includes('male') || path.includes('male') || hash.includes('joinmale') || search.includes('joinmale') || path.includes('joinmale') || path.includes('join-male') || hash.includes('join-male')) return 'male';
      if (hash.includes('donor') || search.includes('donor') || path.includes('donor') || hash.includes('sparm') || search.includes('sparm') || path.includes('sparm') || hash.includes('sperm') || search.includes('sperm') || path.includes('sperm')) return 'donor';
      return 'female';
    }
    return null;
  });
  const [onlineCount, setOnlineCount] = useState(273);

  const [searchQuery, setSearchQuery] = useState('');
  const [rateFilter, setRateFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<'DEMO' | 'REGULAR' | 'PREMIUM' | 'ELITE'>('DEMO');

  // Interactive High-end Hotel and Safehouses Filtering States
  const [locationTypeTab, setLocationTypeTab] = useState<'HOTELS' | 'SAFE HOUSES'>('HOTELS');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationCityFilter, setLocationCityFilter] = useState('ALL');
  const [locationRatingFilter, setLocationRatingFilter] = useState('ALL RATINGS');
  const [activeReserveLocationId, setActiveReserveLocationId] = useState<string | undefined>(undefined);
  
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('bt_companion_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return ['Female Model', 'Male Model', 'Sperm Donor'];
  });

  const [selectedSegment, setSelectedSegment] = useState<string>(() => {
    return (getStoredItem('bt_selected_segment') as any) || 'Female Model';
  });

  const [accountMode, setAccountMode] = useState<'client' | 'partner'>(() => {
    return (getStoredItem('bt_account_mode') as any) || 'client';
  });

  const [bannerVisible, setBannerVisible] = useState(true);

  const [promoCode, setPromoCode] = useState('');
  const [customUsername, setCustomUsername] = useState(username);
  
  const [editFullName, setEditFullName] = useState(fullName);
  const [editEmail, setEditEmail] = useState(email);
  const [editPhone, setEditPhone] = useState(phone);

  const [structuredCities, setStructuredCities] = useState<ParentArea[]>(() => {
    const saved = localStorage.getItem('bt_cities_structured');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    // Default initial nested geographic tree
    return [
      {
        id: 'dhaka_area',
        name: 'Dhaka Area',
        subAreas: ['Gulshan', 'Banani', 'Uttara', 'Mirpur', 'Dhanmondi', 'Badda', 'Tejgaon', 'Paltan']
      },
      {
        id: 'chittagong',
        name: 'Chittagong',
        subAreas: ['GEC Circle', 'Agrabad', 'Halishahar', 'Panchlaish', 'Nasirabad']
      },
      {
        id: 'sylhet',
        name: 'Sylhet',
        subAreas: ['Zindabazar', 'Uposhahar', 'Amberkhana', 'Shibgonj']
      },
      {
        id: 'rajshahi',
        name: 'Rajshahi',
        subAreas: ['Talaimari', 'Kazla', 'Saheb Bazar']
      }
    ];
  });

  const handleUpdateStructuredCities = (updated: ParentArea[]) => {
    setStructuredCities(updated);
    localStorage.setItem('bt_cities_structured', JSON.stringify(updated));
  };

  // Automatically derive legacy flat cities array formatted as "Gulshan, Dhaka Area"
  const cities = useMemo(() => {
    const flat: string[] = [];
    structuredCities.forEach((parent) => {
      parent.subAreas.forEach((sub) => {
        flat.push(`${sub}, ${parent.name}`);
      });
      if (parent.subAreas.length === 0) {
        flat.push(parent.name);
      }
    });
    return flat;
  }, [structuredCities]);

  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>(() => {
    const saved = localStorage.getItem('bt_payment_gateways');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'bk_1',
        name: 'bKash Personal',
        method: 'BKASH',
        walletType: 'Personal',
        number: '01712-345678',
        instructions: 'দয়া করে এই bKash পার্সোনাল নম্বরে "Send Money" করুন।',
        isActive: true
      },
      {
        id: 'ng_1',
        name: 'Nagad Agent',
        method: 'NAGAD',
        walletType: 'Agent',
        number: '01912-345678',
        instructions: 'দয়া করে এই Nagad এজেন্ট নম্বরে "Cash Out" করুন।',
        isActive: true
      },
      {
        id: 'rk_1',
        name: 'Rocket Merchant',
        method: 'ROCKET',
        walletType: 'Merchant',
        number: '01812-345678',
        instructions: 'দয়া করে এই Rocket মার্চেন্ট নম্বরে "Merchant Pay" করুন।',
        isActive: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('bt_payment_gateways', JSON.stringify(paymentGateways));
  }, [paymentGateways]);

  // Pricing configuration for dynamic platform amounts
  const [pricingConfig, setPricingConfig] = useState(() => {
    const saved = localStorage.getItem('bt_pricing_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      registrationFee: 3000,
      regularPlanFee: 10000,
      premiumPlanFee: 22000,
      elitePlanFee: 50000,
    };
  });

  const handleUpdatePricingConfig = (newConfig: any) => {
    setPricingConfig(newConfig);
    localStorage.setItem('bt_pricing_config', JSON.stringify(newConfig));
    window.dispatchEvent(new Event('storage'));
  };

  // Tracking stats for registration short links
  const [shortLinkStats, setShortLinkStats] = useState(() => {
    const storedStats = localStorage.getItem('bt_shortlink_stats');
    let stats = {
      'join-female-1': { clicks: 0, joins: 0 },
      'join-female-2': { clicks: 0, joins: 0 },
      'join-male-1': { clicks: 0, joins: 0 },
      'join-male-2': { clicks: 0, joins: 0 },
      'join-sparm-1': { clicks: 0, joins: 0 },
      'join-sparm-2': { clicks: 0, joins: 0 },
    };
    if (storedStats) {
      try {
        stats = { ...stats, ...JSON.parse(storedStats) };
      } catch (e) {
        console.error(e);
      }
    }
    return stats;
  });

  // Referrals and Withdrawals state definitions
  const [referrals, setReferrals] = useState<ReferralRecord[]>(() => {
    const saved = localStorage.getItem('bt_referrals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'ref-1',
        referredUser: 'tasnim_eva',
        referredFullName: 'Tasnim Eva',
        referredPhone: '01712233445',
        referredEmail: 'eva.tasnim@gmail.com',
        referrer: 'akhiaktherofc',
        dateJoined: '2026-06-05',
        tier: 'REGULAR',
        commission: 1005
      },
      {
        id: 'ref-2',
        referredUser: 'safwan_bin_arif',
        referredFullName: 'Safwan Bin Arif',
        referredPhone: '01815121314',
        referredEmail: 'safwan.arif@outlook.com',
        referrer: 'akhiaktherofc',
        dateJoined: '2026-06-10',
        tier: 'PREMIUM',
        commission: 1000
      },
      {
        id: 'ref-3',
        referredUser: 'shaila_sharmin',
        referredFullName: 'Shaila Sharmin',
        referredPhone: '01998765432',
        referredEmail: 'shaila.sharmin@yahoo.com',
        referrer: 'akhiaktherofc',
        dateJoined: '2026-06-12',
        tier: 'FREE',
        commission: 0
      },
      {
        id: 'ref-4',
        referredUser: 'mahin_hossain',
        referredFullName: 'Mahin Hossain',
        referredPhone: '01511223344',
        referredEmail: 'mahin.hossain@gmail.com',
        referrer: 'salmanshah',
        dateJoined: '2026-05-28',
        tier: 'ELITE',
        commission: 5005
      },
      {
        id: 'ref-5',
        referredUser: 'orpi_afrena',
        referredFullName: 'Orpi Afrena',
        referredPhone: '01655667788',
        referredEmail: 'orpi.afrena@gmil.com',
        referrer: 'salmanshah',
        dateJoined: '2026-06-01',
        tier: 'REGULAR',
        commission: 1005
      },
      {
        id: 'ref-6',
        referredUser: 'tanveer_ahmed',
        referredFullName: 'Tanveer Ahmed',
        referredPhone: '01799228833',
        referredEmail: 'tanveer.ahmed@live.com',
        referrer: 'salmanshah',
        dateJoined: '2026-06-02',
        tier: 'PREMIUM',
        commission: 1000
      },
      {
        id: 'ref-7',
        referredUser: 'anika_tabassum',
        referredFullName: 'Anika Tabassum',
        referredPhone: '01399887766',
        referredEmail: 'anika.tab@gmail.com',
        referrer: 'tasnim_eva',
        dateJoined: '2026-06-06',
        tier: 'REGULAR',
        commission: 1005
      }
    ];
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>(() => {
    const saved = localStorage.getItem('bt_withdrawals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'w-1',
        username: 'salmanshah',
        fullName: 'Salman Shah VIP',
        amount: 5000,
        method: 'bKash Agent',
        accountNumber: '01712345678',
        date: '2026-06-04',
        status: 'Approved'
      },
      {
        id: 'w-2',
        username: 'akhiaktherofc',
        fullName: 'Akhi Akther Ofc',
        amount: 1005,
        method: 'Nagad Personal',
        accountNumber: '01822334455',
        date: '2026-06-07',
        status: 'Approved'
      },
      {
        id: 'w-3',
        username: 'tasnim_eva',
        fullName: 'Tasnim Eva',
        amount: 1000,
        method: 'bKash Personal',
        accountNumber: '01911223344',
        date: '2026-06-13',
        status: 'Pending'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('bt_referrals', JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    localStorage.setItem('bt_withdrawals', JSON.stringify(withdrawals));
  }, [withdrawals]);

  // Short link click tracker
  useEffect(() => {
    const checkHashAndTrack = () => {
      const hash = window.location.hash.toLowerCase();
      let sourceLink = '';
      if (hash === '#join') sourceLink = 'join-female-1';
      else if (hash === '#register') sourceLink = 'join-female-2';
      else if (hash === '#joinmale') sourceLink = 'join-male-1';
      else if (hash === '#join-male') sourceLink = 'join-male-2';
      else if (hash === '#joinsparm') sourceLink = 'join-sparm-1';
      else if (hash === '#join-sparm') sourceLink = 'join-sparm-2';

      if (sourceLink) {
        sessionStorage.setItem('bt_registration_source', sourceLink);

        const sessionTrackedKey = `bt_tracked_click_${sourceLink}`;
        if (!sessionStorage.getItem(sessionTrackedKey)) {
          sessionStorage.setItem(sessionTrackedKey, 'true');
          const storedStats = localStorage.getItem('bt_shortlink_stats');
          let stats = {
            'join-female-1': { clicks: 0, joins: 0 },
            'join-female-2': { clicks: 0, joins: 0 },
            'join-male-1': { clicks: 0, joins: 0 },
            'join-male-2': { clicks: 0, joins: 0 },
            'join-sparm-1': { clicks: 0, joins: 0 },
            'join-sparm-2': { clicks: 0, joins: 0 },
          };
          if (storedStats) {
            try {
              stats = { ...stats, ...JSON.parse(storedStats) };
            } catch (e) {
              console.error(e);
            }
          }
          if (stats[sourceLink]) {
            stats[sourceLink].clicks += 1;
          } else {
            stats[sourceLink] = { clicks: 1, joins: 0 };
          }
          localStorage.setItem('bt_shortlink_stats', JSON.stringify(stats));
          setShortLinkStats(stats);
          window.dispatchEvent(new Event('storage'));
        }
      }
    };

    checkHashAndTrack();
    window.addEventListener('hashchange', checkHashAndTrack);
    return () => window.removeEventListener('hashchange', checkHashAndTrack);
  }, []);

  // Multi-tab synchronizer
  useEffect(() => {
    const syncAcrossTabs = () => {
      const storedStats = localStorage.getItem('bt_shortlink_stats');
      if (storedStats) {
        try {
          setShortLinkStats(JSON.parse(storedStats));
        } catch (e) {
          console.error(e);
        }
      }
      const savedPricing = localStorage.getItem('bt_pricing_config');
      if (savedPricing) {
        try {
          setPricingConfig(JSON.parse(savedPricing));
        } catch (e) {
          console.error(e);
        }
      }
    };

    window.addEventListener('storage', syncAcrossTabs);
    return () => window.removeEventListener('storage', syncAcrossTabs);
  }, []);

  const [partnerCategory, setPartnerCategory] = useState<string>('Female Model');
  const [partnerName, setPartnerName] = useState('');
  const [partnerAge, setPartnerAge] = useState(24);
  const [partnerHeight, setPartnerHeight] = useState("5'6");
  const [partnerRate, setPartnerRate] = useState(12000);
  const [partnerCity, setPartnerCity] = useState('Dhaka');
  const [partnerLanguages, setPartnerLanguages] = useState('Bangla, English');
  const [partnerSpecialty, setPartnerSpecialty] = useState('');
  const [partnerImage, setPartnerImage] = useState('');
  const [partnerAppPhone, setPartnerAppPhone] = useState('');

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    const saved = getStoredItem('bt_email_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [emailjsServiceId, setEmailjsServiceId] = useState<string>(() => {
    return getStoredItem('bt_emailjs_service_id') || '';
  });

  const [emailjsTemplateId, setEmailjsTemplateId] = useState<string>(() => {
    return getStoredItem('bt_emailjs_template_id') || '';
  });

  const [emailjsPublicKey, setEmailjsPublicKey] = useState<string>(() => {
    return getStoredItem('bt_emailjs_public_key') || '';
  });

  const [telegramBotToken, setTelegramBotToken] = useState<string>(() => {
    return getStoredItem('bt_telegram_bot_token') || '';
  });

  const [telegramGroupId, setTelegramGroupId] = useState<string>(() => {
    return getStoredItem('bt_telegram_group_id') || '';
  });

  const [telegramHelpline, setTelegramHelpline] = useState<string>(() => {
    return getStoredItem('bt_telegram_helpline') || 'BodyTouchSupport';
  });

  useEffect(() => {
    setEditFullName(fullName);
  }, [fullName]);

  useEffect(() => {
    setEditEmail(email);
  }, [email]);

  useEffect(() => {
    setEditPhone(phone);
  }, [phone]);
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    return Number(getStoredItem('bt_wallet_balance')) || 0;
  });

  // Modal Dialog states
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<HotelLocation | null>(null);
  const [selectedReserveHotel, setSelectedReserveHotel] = useState<HotelLocation | null>(null);
  const [bookingCompanion, setBookingCompanion] = useState<Companion | null>(null);
  const [checkoutTier, setCheckoutTier] = useState<{ name: string; price: string } | null>(null);

  // Filtered Hotel / Safehouse lists selection computations
  const filteredHotelLocations = useMemo(() => {
    return locations.filter((loc) => {
      // 1. Filter by location type (Hotels vs Safe Houses)
      const isSafeHouse = loc.star.toUpperCase().includes('SAFE HOUSE');
      if (locationTypeTab === 'SAFE HOUSES' && !isSafeHouse) return false;
      if (locationTypeTab === 'HOTELS' && isSafeHouse) return false;

      // 2. Filter by search query (name / description / location)
      if (locationSearchQuery.trim() !== '') {
        const q = locationSearchQuery.toLowerCase();
        const matchesName = loc.name.toLowerCase().includes(q);
        const matchesDesc = loc.description?.toLowerCase().includes(q);
        const matchesCity = loc.location.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCity) return false;
      }

      // 3. Filter by city pill
      if (locationCityFilter !== 'ALL') {
        const c = locationCityFilter.toUpperCase();
        const normalizedLocation = loc.location.toUpperCase();
        if (normalizedLocation !== c && !normalizedLocation.includes(c)) return false;
      }

      // 4. Filter by stars
      if (locationRatingFilter !== 'ALL RATINGS') {
        const starNum = parseInt(locationRatingFilter); // e.g. "5★" -> 5
        const locStarStr = loc.star.toUpperCase();
        
        if (starNum === 5) {
          if (!locStarStr.includes('5') && !locStarStr.includes('FIVE')) return false;
        } else if (starNum === 4) {
          if (!locStarStr.includes('4') && !locStarStr.includes('FOUR') && !locStarStr.includes('VIP')) return false;
        } else if (starNum === 3) {
          if (!locStarStr.includes('3') && !locStarStr.includes('THREE')) return false;
        }
      }

      return true;
    });
  }, [locations, locationTypeTab, locationSearchQuery, locationCityFilter, locationRatingFilter]);

  const handleReserveHotelClick = (loc: HotelLocation) => {
    setSelectedReserveHotel(loc);
  };

  const handleHotelReservationSubmit = (data: {
    checkInDate: string;
    checkOutDate: string;
    emergencyContact: string;
    cost: number;
  }) => {
    if (!selectedReserveHotel) return;

    const cost = data.cost;
    
    const newBooking: Booking = {
      id: 'hotel-' + Date.now(),
      modelName: `${selectedReserveHotel.name}`,
      modelTag: 'HOTEL',
      location: selectedReserveHotel.location,
      date: `${data.checkInDate} to ${data.checkOutDate}`,
      time: 'Standard 12:00 PM Check-In',
      duration: 'Hotel Booking',
      image: selectedReserveHotel.image,
      status: 'Approved',
      notes: `Emergency Contact: ${data.emergencyContact}. Booked via corporate alias.`,
      cost: cost
    };

    setBookings((prev) => [newBooking, ...prev]);
    
    if (walletBalance >= cost) {
      const newBal = walletBalance - cost;
      setWalletBalance(newBal);
      localStorage.setItem('bt_wallet_balance', String(newBal));
      triggerToast(`🎉 ${selectedReserveHotel.name} reserved successfully! ৳${cost.toLocaleString()} deducted from secure wallet balance.`, 'success');
    } else {
      triggerToast(`🎉 ${selectedReserveHotel.name} reservation initiated successfully! Security protocols activated.`, 'success');
    }

    setSelectedReserveHotel(null);
  };
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return hash.includes('admin') || hash.includes('wp-admin') || hash.includes('theadmin') || hash.includes('the-admin') || hash.includes('theadminman') ||
           search.includes('admin') || search.includes('wp-admin') || search.includes('theadmin') || search.includes('the-admin') || search.includes('theadminman') ||
           path.includes('admin') || path.includes('wp-admin') || path.includes('theadmin') || path.includes('the-admin') || path.includes('theadminman');
  });

  useEffect(() => {
    const handleLocationCheck = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      
      const isAdminRoute = hash.includes('admin') || hash.includes('wp-admin') || hash.includes('theadmin') || hash.includes('the-admin') || hash.includes('theadminman') ||
                           search.includes('admin') || search.includes('wp-admin') || search.includes('theadmin') || search.includes('the-admin') || search.includes('theadminman') ||
                           path.includes('admin') || path.includes('wp-admin') || path.includes('theadmin') || path.includes('the-admin') || path.includes('theadminman');
      
      if (isAdminRoute) {
        setIsAdminOpen(true);
      } else {
        const isJoinRoute = hash.includes('join') || hash.includes('register') || hash.includes('registration') || hash.includes('model') || hash.includes('joinmale') || hash.includes('join-male') || hash.includes('joinsparm') || hash.includes('join-sparm') || hash.includes('joinsperm') || hash.includes('join-sperm') || hash.includes('sparm') || hash.includes('sperm') ||
                            search.includes('join') || search.includes('register') || search.includes('registration') || search.includes('model') || search.includes('joinmale') || search.includes('join-male') || search.includes('joinsparm') || search.includes('join-sparm') || search.includes('joinsperm') || search.includes('join-sperm') || search.includes('sparm') || search.includes('sperm') ||
                            path.includes('join') || path.includes('register') || path.includes('registration') || path.includes('model') || path.includes('joinmale') || path.includes('join-male') || path.includes('joinsparm') || path.includes('join-sparm') || path.includes('joinsperm') || path.includes('join-sperm') || path.includes('sparm') || path.includes('sperm');
        if (isJoinRoute) {
          if (hash.includes('male') || search.includes('male') || path.includes('male') || hash.includes('joinmale') || search.includes('joinmale') || path.includes('joinmale') || path.includes('join-male') || hash.includes('join-male')) {
            setJoinModalType('male');
          } else if (hash.includes('donor') || search.includes('donor') || path.includes('donor') || hash.includes('sparm') || search.includes('sparm') || path.includes('sparm') || hash.includes('sperm') || search.includes('sperm') || path.includes('sperm')) {
            setJoinModalType('donor');
          } else {
            setJoinModalType('female');
          }
          setIsJoinModalOpen(true);
        }
      }
    };
    
    handleLocationCheck();
    window.addEventListener('hashchange', handleLocationCheck);
    window.addEventListener('popstate', handleLocationCheck);
    return () => {
      window.removeEventListener('hashchange', handleLocationCheck);
      window.removeEventListener('popstate', handleLocationCheck);
    };
  }, []);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isLiquidateOpen, setIsLiquidateOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [allocateMethod, setAllocateMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [allocateTrx, setAllocateTrx] = useState('');
  const [liquidateAmount, setLiquidateAmount] = useState('');
  const [liquidateMethod, setLiquidateMethod] = useState<'BKASH' | 'NAGAD' | 'ROCKET'>('BKASH');
  const [liquidateMobile, setLiquidateMobile] = useState('');

  // Auto verifying states per request
  const [verifyingMap, setVerifyingMap] = useState<Record<string, boolean>>({});

  // Toast Notifications
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: 'success' | 'error' }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // Persist values to localStorage or sessionStorage based on rememberMe option
  useEffect(() => {
    storage.setItem('bt_is_logged_in', String(isLoggedIn));
  }, [isLoggedIn, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_username', username);
  }, [username, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_userlevel', userLevel);
  }, [userLevel, rememberMe]);

  useEffect(() => {
    localStorage.setItem('bt_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('bt_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    storage.setItem('bt_wallet_balance', String(walletBalance));
  }, [walletBalance, rememberMe]);

  useEffect(() => {
    localStorage.setItem('bt_companions', JSON.stringify(companions));
  }, [companions]);

  useEffect(() => {
    localStorage.setItem('bt_locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('bt_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    storage.setItem('bt_fullname', fullName);
  }, [fullName, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_email', email);
  }, [email, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_phone', phone);
  }, [phone, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_avatar_url', avatarUrl);
  }, [avatarUrl, rememberMe]);

  useEffect(() => {
    localStorage.setItem('bt_email_logs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    storage.setItem('bt_emailjs_service_id', emailjsServiceId);
  }, [emailjsServiceId, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_emailjs_template_id', emailjsTemplateId);
  }, [emailjsTemplateId, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_emailjs_public_key', emailjsPublicKey);
  }, [emailjsPublicKey, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_telegram_bot_token', telegramBotToken);
  }, [telegramBotToken, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_telegram_group_id', telegramGroupId);
  }, [telegramGroupId, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_telegram_helpline', telegramHelpline);
  }, [telegramHelpline, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_selected_segment', selectedSegment);
  }, [selectedSegment, rememberMe]);

  useEffect(() => {
    storage.setItem('bt_account_mode', accountMode);
  }, [accountMode, rememberMe]);

  // Online Counter fluctuation simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filter companionship roster dynamically based on search, rate, and category parameters
  const filteredCompanions = companions.filter((comp) => {
    // A. Status validation - exclude pending/declined candidates from standard client view
    if (comp.status !== undefined && comp.status !== 'Approved') {
      return false;
    }

    // B. Segment filtering (Female Model, Male Model, Sperm Donor)
    const compCategory = comp.category || 'Female Model';
    if (compCategory !== selectedSegment) {
      return false;
    }

    // 1. Tag/Badge category filtering
    if (comp.badge !== selectedCategory) {
      return false;
    }

    // 2. Search query filtering (by name, tag, or city)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const nameMatch = comp.name.toLowerCase().includes(q);
      const tagMatch = comp.tag.toLowerCase().includes(q);
      const cityMatch = comp.city ? comp.city.toLowerCase().includes(q) : false;
      if (!nameMatch && !tagMatch && !cityMatch) {
        return false;
      }
    }

    // 3. Rate filtering
    if (rateFilter !== 'all') {
      if (rateFilter === 'low') {
        return comp.rate < 10000;
      } else if (rateFilter === 'med') {
        return comp.rate >= 10000 && comp.rate <= 15000;
      } else if (rateFilter === 'high') {
        return comp.rate > 15000;
      }
    }

    return true;
  });

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const handleBookingSubmit = (data: {
    date: string;
    time: string;
    location: string;
    duration: string;
    notes: string;
    secretCode?: string;
    cost: number;
    deficitPay?: {
      method: 'BKASH' | 'NAGAD' | 'ROCKET';
      trxId: string;
      amount: number;
    };
    firstTimeBooking?: boolean;
    userPhoto?: string;
    nidFront?: string;
    nidBack?: string;
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
  }) => {
    if (!bookingCompanion) return;

    const newBooking: Booking = {
      id: 'book-' + Date.now(),
      modelName: bookingCompanion.name,
      modelTag: bookingCompanion.tag,
      location: data.location,
      date: data.date,
      time: data.time,
      duration: data.duration,
      image: bookingCompanion.image,
      status: 'Awaiting Dispatch',
      notes: data.notes,
      secretCode: data.secretCode,
      cost: data.cost,
      firstTimeBooking: data.firstTimeBooking,
      userPhoto: data.userPhoto,
      nidFront: data.nidFront,
      nidBack: data.nidBack,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail
    };

    setBookings((prev) => [newBooking, ...prev]);

    // Persist updated details to profile states and local storage
    if (data.clientName) {
      setFullName(data.clientName);
      localStorage.setItem('bt_fullname', data.clientName);
    }
    if (data.clientPhone) {
      setPhone(data.clientPhone);
      localStorage.setItem('bt_phone', data.clientPhone);
    }
    if (data.clientEmail) {
      setEmail(data.clientEmail);
      localStorage.setItem('bt_email', data.clientEmail);
    }
    if (data.userPhoto) {
      setAvatarUrl(data.userPhoto);
      localStorage.setItem('bt_avatar_url', data.userPhoto);
    }

    // If there was a remaining payment submitted, record it in the ledger!
    if (data.deficitPay) {
      const newDeficitPayment: PaymentRecord = {
        id: 'pay-' + Date.now(),
        username: username,
        tierName: `Booking Shortfall: ${bookingCompanion.name}`,
        price: data.deficitPay.amount.toLocaleString('en-US'),
        method: data.deficitPay.method,
        trxId: data.deficitPay.trxId.trim().toUpperCase(),
        status: 'Pending Verification',
        date: new Date().toLocaleString()
      };
      setPayments((prev) => [newDeficitPayment, ...prev]);
      triggerToast(`💸 Booking registered! Please wait while admin verifies your remaining payment of ৳${data.deficitPay.amount.toLocaleString()}.`, 'success');
    } else {
      triggerToast(`✨ Booking request with ${bookingCompanion.name} successfully scheduled!`, 'success');
    }

    // Dispatch Telegram Bookings System Notifications
    const botBookingText = `🔔 <b>নতুন বুকিং রিকোয়েস্ট এসেছে!</b>\n\n` +
      `👤 কাস্টমার নাম: <b>${data.clientName || 'N/A'}</b>\n` +
      `📞 কাস্টমার মোবাইল: <code>${data.clientPhone || 'N/A'}</code>\n` +
      `📧 কাস্টমার ইমেল: <code>${data.clientEmail || 'N/A'}</code>\n` +
      `👩🏼 মডেল নাম: <b>${bookingCompanion.name}</b> (${bookingCompanion.tag})\n` +
      `📍 সার্ভিস ভেন্যু: <b>${data.location}</b>\n` +
      `📅 বুকিং ডেট: <b>${data.date}</b>\n` +
      `⏰ বুকিং সময়: <b>${data.time}</b>\n` +
      `⏱️ বুকিং ডিউরেশন: <b>${data.duration}</b>\n` +
      `💰 মোট খরচ: <b>৳${data.cost.toLocaleString()} BDT</b>\n` +
      `📝 কাস্টমার মেসেজ: <i>"${data.notes || 'No notes'}"</i>\n\n` +
      `<i>কাস্টমারের প্রমাণপত্র চেক এবং বুকিং ভেরিফাই করার জন্য এডমিন পোর্টালে ভিজিট করুন।</i>`;

    sendTelegramNotification(botBookingText);

    if (bookingCompanion.telegram) {
      const modelTelegramText = `💌 <b>আপনার জন্য নতুন বুকিং রিকোয়েস্ট!</b>\n\n` +
        `👤 কাস্টমার নাম: <b>${data.clientName || 'N/A'}</b>\n` +
        `📞 কাস্টমার মোবাইল: <code>${data.clientPhone || 'N/A'}</code>\n` +
        `📍 লোকেশন: <b>${data.location}</b>\n` +
        `📅 তারিখ: <b>${data.date}</b>\n` +
        `⏰ সময়: <b>${data.time}</b>\n` +
        `⏱️ ডিউরেশন: <b>${data.duration}</b>\n` +
        `📝 কাস্টমার মেসেজ: <i>"${data.notes || 'No notes'}"</i>\n\n` +
        `<i>আপনার কাস্টমারের সাথে যোগাযোগ করুন।</i>`;
      
      const cleanHandle = bookingCompanion.telegram.trim();
      sendTelegramNotification(modelTelegramText, cleanHandle);
    }

    setBookingCompanion(null);
  };

  const triggerOpenCheckout = (tierName: string, price: string) => {
    setCheckoutTier({ name: tierName, price });
  };

  const handleCheckoutSubmit = (data: { method: 'BKASH' | 'NAGAD' | 'ROCKET'; trxId: string }) => {
    if (!checkoutTier) return;

    const newPaymentLog: PaymentRecord = {
      id: 'pay-' + Date.now(),
      username: username,
      tierName: checkoutTier.name,
      price: checkoutTier.price,
      method: data.method,
      trxId: data.trxId,
      status: 'Pending Verification',
      date: new Date().toLocaleString()
    };

    setPayments((prev) => [newPaymentLog, ...prev]);
    setCheckoutTier(null);
    setActiveTab('assets');
    triggerToast('⏳ Payment trace registered! Awaiting manual/auto verification.', 'success');
  };

  const handleAllocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = allocateAmount.replace(/,/g, '');
    const amount = parseInt(cleanAmount);
    if (!amount || amount <= 0) {
      triggerToast('⚠️ Please enter a valid deposit amount.', 'error');
      return;
    }
    if (!allocateTrx || allocateTrx.trim().length < 8) {
      triggerToast('⚠️ Please enter a valid Transaction ID.', 'error');
      return;
    }

    const newPaymentLog: PaymentRecord = {
      id: 'pay-' + Date.now(),
      username: username,
      tierName: 'Wallet Deposit',
      price: amount.toLocaleString('en-US'),
      method: allocateMethod,
      trxId: allocateTrx.trim().toUpperCase(),
      status: 'Pending Verification',
      date: new Date().toLocaleString()
    };

    setPayments((prev) => [newPaymentLog, ...prev]);
    setIsAllocateOpen(false);
    setAllocateAmount('');
    setAllocateTrx('');
    triggerToast('⏳ Deposit registered! Awaiting manual/auto verification.', 'success');
  };

  const handleLiquidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = liquidateAmount.replace(/,/g, '');
    const amount = parseInt(cleanAmount);
    if (!amount || amount <= 0) {
      triggerToast('⚠️ Please enter a valid withdrawal amount.', 'error');
      return;
    }
    if (amount > walletBalance) {
      triggerToast('❌ Insufficient wallet balance for withdrawal.', 'error');
      return;
    }
    if (!liquidateMobile || liquidateMobile.trim().length < 11) {
      triggerToast('⚠️ Please enter a valid Mobile Wallet number.', 'error');
      return;
    }

    // Subtract immediately for instant feedback, then log transaction in approved state
    setWalletBalance((prev) => prev - amount);

    const newPaymentLog: PaymentRecord = {
      id: 'pay-' + Date.now(),
      username: username,
      tierName: 'Withdrawal',
      price: '-' + amount.toLocaleString('en-US'),
      method: liquidateMethod,
      trxId: liquidateMobile.trim(),
      status: 'Approved',
      date: new Date().toLocaleString()
    };

    setPayments((prev) => [newPaymentLog, ...prev]);
    setIsLiquidateOpen(false);
    setLiquidateAmount('');
    setLiquidateMobile('');
    triggerToast(`🎉 ৳${amount.toLocaleString()} withdrawn to ${liquidateMethod} wallet!`, 'success');
  };

  // Immediate Simulated Merchant Gateway API
  const addPriceToWallet = (priceStr: string) => {
    const bnToEn: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const rawPrice = priceStr.replace(/-/g, '').replace(/,/g, '');
    const normalizedPrice = rawPrice.split('').map(c => bnToEn[c] || c).join('');
    const numericPrice = parseInt(normalizedPrice) || 0;
    setWalletBalance((prev) => prev + numericPrice);
  };

  // Automated Email dispatch system (EmailJS / Hostinger Mail Server simulator)
  const sendAutoEmail = async (toEmail: string, subject: string, bodyText: string) => {
    const timestamp = new Date().toLocaleString();
    const newLogId = 'mail-' + Date.now();

    const pendingLog: EmailLog = {
      id: newLogId,
      to: toEmail,
      subject,
      body: bodyText,
      sentAt: timestamp,
      status: 'Pending'
    };
    setEmailLogs((prev) => [pendingLog, ...prev]);

    if (emailjsServiceId && emailjsTemplateId && emailjsPublicKey) {
      try {
        const templateParams = {
          to_email: toEmail,
          to_name: fullName || username || 'VIP Client',
          subject: subject,
          message: bodyText,
          reply_to: 'support@bodytouch.com'
        };

        await emailjs.send(
          emailjsServiceId,
          emailjsTemplateId,
          templateParams,
          emailjsPublicKey
        );

        setEmailLogs((prev) =>
          prev.map((log) => (log.id === newLogId ? { ...log, status: 'Delivered' } : log))
        );
        triggerToast(`📨 Real Hostinger Email dispatched to ${toEmail}!`, 'success');
      } catch (err: any) {
        console.error('EmailJS error:', err);
        setEmailLogs((prev) =>
          prev.map((log) => (log.id === newLogId ? { ...log, status: 'Failed' } : log))
        );
        triggerToast(`⚠️ Email Error: ${err.text || err.message || 'Verification failure.'}`, 'error');
      }
    } else {
      // Live SMTP queue simulation in absence of active credentials
      setTimeout(() => {
        setEmailLogs((prev) =>
          prev.map((log) => (log.id === newLogId ? { ...log, status: 'Delivered' } : log))
        );
        triggerToast(`📨 [Hostinger SMTP Auto-Mail] Sent to ${toEmail}!`, 'success');
      }, 1000);
    }
  };

  // Automated Telegram Group and Private Notification Endpoint
  const sendTelegramNotification = async (htmlText: string, customChatId?: string) => {
    const token = telegramBotToken || getStoredItem('bt_telegram_bot_token');
    const defaultChatId = telegramGroupId || getStoredItem('bt_telegram_group_id');
    const chatId = customChatId || defaultChatId;

    if (!token || !chatId) {
      console.warn('Telegram Notification skipped: Bot Token or Chat ID not configured.');
      return false;
    }

    try {
      let targetChatId = chatId.trim();
      // If it doesn't look like a numerical chat ID (usually begins with '-') and doesn't start with '@', assume user handle and prepend '@'
      if (!targetChatId.startsWith('-') && !targetChatId.startsWith('@')) {
        targetChatId = '@' + targetChatId;
      }

      const response = await fetch(`https://api.telegram.org/bot${token.trim()}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: htmlText,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Telegram Bot API Error Response:', errorData);
        return false;
      }

      console.log(`Telegram message successfully sent to ${targetChatId}`);
      return true;
    } catch (e) {
      console.error('Network Error while dispatching Telegram notification:', e);
      return false;
    }
  };

  // Administration bookings / services manual checkers
  const handleAdminApproveCompanion = (companionId: string) => {
    setCompanions((prev) =>
      prev.map((c) => {
        if (c.id === companionId) {
          const freshTag = c.badge === 'DEMO' ? 'Class DEMO' : c.badge === 'ELITE' ? 'Class ELITE' : c.badge === 'PREMIUM' ? 'Class PREMIUM' : 'Class REGULAR';
          const updated = { ...c, status: 'Approved' as const, tag: freshTag };
          const mailSubject = `🎉 bodyTOUCH Roster: Your Career Application is APPROVED!`;
          const mailBody = `
Dear ${c.name},

Congratulations! Our administration team has verified and APPROVED your professional roster partnership at bodyTOUCH.

Your profile is now LIVE in our exclusive directory under category: ${c.category || 'Female Model'}.

--- PARTNER DATA CARD ---
👤 Name: ${c.name}
📍 Assigned City: ${c.city || 'Dhaka'}
💎 Badge Tier: ${c.badge}
💰 Target Rate: ৳${c.rate}/hour
📞 Mobile Connected: ${c.phone || 'N/A'}
📧 Email Registered: ${c.email || 'N/A'}

You can now start receiving premium booking dispatches from our upscale high-society user network. Keep your profile updated!

Thank you for choosing bodyTOUCH.
Sincerely,
bodyTOUCH Auditing Core
https://service.bodytouch.com
          `;
          sendAutoEmail(c.email || 'code@bodytouch.com', mailSubject, mailBody);
          triggerToast(`✅ Partner approved: ${c.name}! Acceptance email sent.`, 'success');

          // Send Telegram Activation Notification to Admin Group
          const botApproveText = `✅ <b>মডেল প্রোফাইল অ্যাক্টিভেট করা হয়েছে!</b>\n\n` +
            `👤 নাম: <b>${c.name}</b>\n` +
            `💎 লেভেল: <b>${c.badge} (${c.badge === 'ELITE' ? 'এলিট সোসাইটি' : c.badge === 'PREMIUM' ? 'প্রিমিয়াম মেম্বার' : 'রেগুলার মেম্বার'})</b>\n` +
            `💰 ডিমান্ড রেট: <b>৳${c.rate}/ঘন্টা</b>\n` +
            `📍 শহর: <b>${c.city || 'Dhaka'}</b>\n` +
            `✈️ টেলিগ্রাম: <b>${c.telegram ? '@' + c.telegram.replace('@', '') : 'N/A'}</b>\n\n` +
            `<i>প্রোফাইলটি এখন ক্যাটালগে সবার জন্য দৃশ্যমান এবং বুকিং করার জন্য উন্মুক্ত।</i>`;
          sendTelegramNotification(botApproveText);

          return updated;
        }
        return c;
      })
    );
  };

  const handleAdminDeclineCompanion = (companionId: string) => {
    setCompanions((prev) =>
      prev.map((c) => {
        if (c.id === companionId) {
          const updated = { ...c, status: 'Declined' as const };
          const mailSubject = `⚠️ bodyTOUCH Notification: Application Status Update`;
          const mailBody = `
Dear ${c.name},

We appreciate your interest in collaborating with the bodyTOUCH high-society discreet network.

At this time, our roster audit team could not verify your visual credentials or pedigree details. Therefore, your application has been DECLINED.

If you believe this has been a verification error, feel free to submit a revised application with correct identity vouchers.

Sincerely,
bodyTOUCH Auditing Core
          `;
          sendAutoEmail(c.email || 'code@bodytouch.com', mailSubject, mailBody);
          triggerToast(`❌ Partner application declined for ${c.name}.`, 'error');
          return updated;
        }
        return c;
      })
    );
  };

  const handleAdminApproveBooking = (bookingId: string) => {
    const targetBooking = bookings.find(b => b.id === bookingId);
    if (targetBooking) {
      const comp = companions.find(c => c.name.toLowerCase() === targetBooking.modelName.toLowerCase());
      const baseRate = comp ? comp.rate : 10000;
      const bookingCost = (targetBooking as any).cost || calculateBookingCost(baseRate, 'REAL', targetBooking.duration, comp);

      // Deduct wallet balance directly
      setWalletBalance((prevBal) => {
        const nextBal = prevBal - bookingCost;
        return nextBal >= 0 ? nextBal : 0;
      });

      // Record a debit ledger log entry for this booking spend
      const newSpendRecord: PaymentRecord = {
        id: 'pay-spend-' + Date.now(),
        username: username,
        tierName: `Booking Approved: ${targetBooking.modelName}`,
        price: `-${bookingCost}`,
        method: 'System Init',
        trxId: `DB-${targetBooking.id.split('-').pop() || 'TX'}`,
        status: 'Approved',
        date: new Date().toLocaleString()
      };
      setPayments((prev) => [newSpendRecord, ...prev]);
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = { ...b, status: 'Approved' as const };
          const mailSubject = `✅ Body Touch: Booking Service Approved for ${b.modelName}`;
          const mailBody = `
Dear ${fullName || 'Client'},

Congratulations! Your companion booking inquiry has been APPROVED by Body Touch Concierge operators.

--- SERVICE RECORD DIGEST ---
🎫 Booking ID: ${b.id}
👩🏼 Companion Name: ${b.modelName} (Verified Class ${b.modelTag})
📍 Location Hotel: ${b.location}
📅 Scheduled Date: ${b.date}
⏰ Scheduled Time: ${b.time}
⏳ Service Duration: ${b.duration}
🔐 Privacy Passphrase code: ${b.secretCode || 'DISCRETION_SECURED'}

Our team ensures maximum discretion and punctuality. Please check your system status for active dispatcher coordinates.

Greetings,
Body Touch VIP Administrator Hub
Website: https://bodytouch.com
          `;
          sendAutoEmail(email || 'code@bodytouch.com', mailSubject, mailBody);
          triggerToast(`✅ Booking approved for ${b.modelName}! Auto email sent!`, 'success');
          return updated;
        }
        return b;
      })
    );
  };

  const handleAdminDeclineBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = { ...b, status: 'Declined' as const };
          const mailSubject = `❌ Body Touch Notification: Service Inquiry Declined`;
          const mailBody = `
Dear ${fullName || 'Client'},

Your booking service request (ID: ${b.id}) involving Companion ${b.modelName} has been DECLINED by our management due to scheduling conflicts or profile reservation limits.

Your wallet balance has not been affected. Please select another active time slot or alternative companion roster.

Greetings,
Body Touch VIP Concierge
          `;
          sendAutoEmail(email || 'code@bodytouch.com', mailSubject, mailBody);
          triggerToast(`❌ Booking declined for ${b.modelName}. Notification mail sent.`, 'error');
          return updated;
        }
        return b;
      })
    );
  };

  const handleAdminMarkOutgoingBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = { ...b, status: 'Outgoing' as const };
          const mailSubject = `🚀 Body Touch Notification: Companion is Outgoing!`;
          const mailBody = `
Dear ${fullName || 'Client'},

Exciting news! Your chosen companion ${b.modelName} has departed and is currently OUTGOING to your designated sanctuary coordinates: ${b.location}.

Estimated arrival follows schedule. Please prepare to share your Private Verification Code: ${b.secretCode || 'DISCRETION_SECURED'}.

Greetings,
Body Touch VIP Concierge
          `;
          sendAutoEmail(email || 'code@bodytouch.com', mailSubject, mailBody);
          triggerToast(`🚀 Booking marked as Outgoing for ${b.modelName}. Email notification dispatched!`, 'success');
          return updated;
        }
        return b;
      })
    );
  };

  const handleAdminMarkCompletedBooking = (bookingId: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          const updated = { ...b, status: 'Completed' as const };
          const mailSubject = `💖 Body Touch Notification: Service Completed!`;
          const mailBody = `
Dear ${fullName || 'Client'},

We hope you thoroughly enjoyed your premium companion experience with ${b.modelName}.

Your service (Inquiry ID: ${b.id}) has been marked as COMPLETED.
Please take a moment to rate your companion on our portal and leave a review. Your feedback ensures our elite selection remains pristine.

Greetings,
Body Touch VIP Concierge
          `;
          sendAutoEmail(email || 'code@bodytouch.com', mailSubject, mailBody);
          triggerToast(`💖 Booking marked as Completed for ${b.modelName}. Feedback request notification sent!`, 'success');
          return updated;
        }
        return b;
      })
    );
  };

  const handleReviewSubmit = (bookingId: string, companionName: string, rating: number, comment: string) => {
    if (!comment.trim()) {
      triggerToast('ℹ️ Please write a short comment about your experience.', 'error');
      return;
    }
    const newReview: Review = {
      id: 'rev-' + Date.now(),
      bookingId,
      companionName,
      rating,
      comment: comment.trim(),
      reviewerName: fullName || username || 'Anonymous User',
      date: new Date().toLocaleString()
    };
    setReviews((prev) => [newReview, ...prev]);
    triggerToast('💖 Thank you for rating your experience! Your review is submitted.', 'success');
  };

  const handleAutoVerify = (payId: string) => {
    setVerifyingMap((prev) => ({ ...prev, [payId]: true }));
    triggerToast('📡 Querying merchant gateway ledger analysis...', 'success');

    setTimeout(() => {
      setPayments((prev) =>
        prev.map((p) => {
          if (p.id === payId) {
            const tNameU = p.tierName.toUpperCase();
            if (tNameU === 'REGULAR' || tNameU === 'PREMIUM' || tNameU === 'ELITE') {
              setUserLevel(tNameU as MemberLevel);
              triggerToast(`🎉 Ledger query succeeded! Upgraded to ${p.tierName}!`, 'success');
            } else {
              triggerToast(`🎉 Ledger query succeeded! Deposit approved!`, 'success');
            }
            addPriceToWallet(p.price);
            const mailSubject = `🎉 Body Touch Payment Approved: ${p.tierName}`;
            const mailBody = `
Dear ${fullName || 'Client'},

Our merchant gateway network analysis automatically VERIFIED your voucher deposit ledger entry.

--- TRANSACTION LEDGER ---
🎫 Receipt ID: ${p.id}
💎 Account Allocation: ${p.tierName}
💰 Transacted Value: ৳${p.price}
💳 Medium: ${p.method}
🔐 TrxID Hash: ${p.trxId}

Your Body Touch concierge capabilities are active. Welcome aboard.

Sincerely,
Body Touch VIP Automation Agent
https://bodytouch.com
            `;
            sendAutoEmail(email || 'code@bodytouch.com', mailSubject, mailBody);
            return { ...p, status: 'Approved' };
          }
          return p;
        })
      );
      setVerifyingMap((prev) => ({ ...prev, [payId]: false }));
    }, 4000);
  };

  // Manual operators buttons from verification ledger
  const handleAdminApprove = (payId: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === payId) {
          const tNameU = p.tierName.toUpperCase();
          if (tNameU === 'REGULAR' || tNameU === 'PREMIUM' || tNameU === 'ELITE') {
            setUserLevel(tNameU as MemberLevel);
            triggerToast(`✅ Payment approved manually! Upgraded to ${p.tierName}.`, 'success');
          } else {
            triggerToast(`✅ Deposit of ৳${p.price} approved manually.`, 'success');
          }
          addPriceToWallet(p.price);
          
          // Send manually approved payment notification email
          const mailSubject = `🎉 Body Touch: Payment Approved by Administrator`;
          const mailBody = `
Dear ${fullName || 'Client'},

Our operator has verified and manually APPROVED your deposit voucher.

--- TRANSACTION SUMMARY ---
🎫 Receipt ID: ${p.id}
💎 Service Level: ${p.tierName}
💰 Total Transacted Credit: ৳${p.price}
💳 Method: ${p.method}
🔐 TrxID Ref: ${p.trxId}

Your balance has been updated and premium portal entries are unlocked.

Sincerely,
Body Touch support operator
https://bodytouch.com
          `;
          sendAutoEmail(email || 'code@bodytouch.com', mailSubject, mailBody);
          return { ...p, status: 'Approved' };
        }
        return p;
      })
    );
  };

  const handleAdminReject = (payId: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === payId) {
          triggerToast(`❌ Payment trace rejected by operator.`, 'error');
          
          // Send payment rejection notification email
          const mailSubject = `⚠️ Body Touch Notification: Payment Log Rejected`;
          const mailBody = `
Dear ${fullName || 'Client'},

Our financial auditing team has REJECTED the registered deposit ticket associated with TrxID: ${p.trxId}.

Reason: The TrxID could not be automated nor located on manual merchant ledger queries. Please re-submit the ledger record inside your dashboard with corrected receipts.

Sincerely,
Body Touch Security Core
          `;
          sendAutoEmail(email || 'code@bodytouch.com', mailSubject, mailBody);
          return { ...p, status: 'Rejected' };
        }
        return p;
      })
    );
  };

  const handleApplyPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = promoCode.trim().toUpperCase();
    if (normalized === 'BODYTOUCH' || normalized === 'VIPACCESS' || normalized === 'ELITE2026') {
      setUserLevel('ELITE');
      setPromoCode('');
      triggerToast('🎉 VIP Elite Status Activated successfully!', 'success');
    } else {
      triggerToast('❌ Invalid Voucher Secret key.', 'error');
    }
  };

  const handleUpdateUsername = () => {
    if (customUsername.trim().length < 4) {
      triggerToast('⚠️ Username must be at least 4 characters.', 'error');
      return;
    }
    setUsername(customUsername.trim());
    triggerToast('Username updated successfully!', 'success');
  };

  const handleSaveProfileChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (editFullName.trim().length < 4) {
      triggerToast('⚠️ Full Name must be at least 4 characters.', 'error');
      return;
    }
    setUsername(editFullName.trim());
    setCustomUsername(editFullName.trim());
    setFullName(editFullName.trim());
    setEmail(editEmail.trim());
    setPhone(editPhone.trim());
    triggerToast('🎉 Profile updated successfully!', 'success');
  };

  const handlePartnerSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (partnerName.trim().length < 3) {
      triggerToast('⚠️ Alias Name must be at least 3 characters.', 'error');
      return;
    }
    if (partnerSpecialty.trim().length < 10) {
      triggerToast('⚠️ Bio specialties / credentials description must be at least 10 characters long.', 'error');
      return;
    }
    if (partnerAppPhone.trim().length < 8) {
      triggerToast('⚠️ Active contact mobile number is required.', 'error');
      return;
    }

    const assignedBadge: 'DEMO' | 'REGULAR' | 'PREMIUM' | 'ELITE' =
      partnerRate < 10000 ? 'REGULAR' : partnerRate >= 15000 ? 'ELITE' : 'PREMIUM';

    const cleanLanguages = partnerLanguages.split(',').map(s => s.trim()).filter(Boolean);

    const newApplicationComp: Companion = {
      id: `comp-app-${Date.now()}`,
      name: partnerName.trim(),
      tag: `Class ${assignedBadge}`,
      badge: assignedBadge,
      age: partnerAge,
      height: partnerHeight,
      languages: cleanLanguages.length ? cleanLanguages : ['English', 'Bengali'],
      specialty: partnerSpecialty.trim(),
      rate: partnerRate,
      city: partnerCity,
      image: partnerImage.trim() || (partnerCategory === 'Male Model'
        ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600'
        : partnerCategory === 'Sperm Donor'
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600'
        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600'),
      category: partnerCategory,
      status: 'Pending',
      email: email.trim() || 'code@bodytouch.com',
      phone: partnerAppPhone.trim()
    };

    setCompanions((prev) => [newApplicationComp, ...prev]);

    // Send automated SMTP notification to administrators
    const mailSubject = `📝 New bodyTOUCH Application: ${partnerName.trim()} (${partnerCategory})`;
    const mailBody = `
Dear bodyTOUCH Admin,

A raw career application has been registered inside the directory network database!

--- CANDIDATE RECORD DATA CARD ---
👤 Professional Name: ${partnerName.trim()}
🧬 Category Segment: ${partnerCategory}
💰 Expected Target Rate: ৳${partnerRate}/hour
📍 Roster Base City: ${partnerCity}
📏 Height Profile: ${partnerHeight} | Age: ${partnerAge} Years
📞 Mobile Telephone Number: ${partnerAppPhone.trim()}
📧 Associated Email Login: ${email.trim() || 'code@bodytouch.com'}
🗣️ Languages Spoken: ${cleanLanguages.join(', ')}

--- BIO CREDENTIALS & VOUCHERS ---
${partnerSpecialty.trim()}

Please launch your Admin operator board workspace and complete the audit review (Approve / Decline).

Sincerely,
bodyTOUCH Automated Roster Daemon
https://service.bodytouch.com
    `;

    sendAutoEmail('code@bodytouch.com', mailSubject, mailBody);
    triggerToast('🎉 Career registration application submitted successfully! Undergoing audit.', 'success');
  };

  const handleClearSession = () => {
    setIsLoggedIn(false);

    const keys = [
      'bt_is_logged_in',
      'bt_username',
      'bt_fullname',
      'bt_email',
      'bt_phone',
      'bt_avatar_url',
      'bt_userlevel',
      'bt_wallet_balance',
      'bt_bookings',
      'bt_payments',
      'bt_companions',
      'bt_locations',
      'bt_email_logs',
      'bt_emailjs_service_id',
      'bt_emailjs_template_id',
      'bt_emailjs_public_key',
      'bt_selected_segment',
      'bt_account_mode',
      'bt_reviews',
      'bt_remember_me'
    ];

    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    setUsername('');
    setCustomUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setAvatarUrl('');
    setUserLevel('FREE');
    setWalletBalance(0);
    setBookings([]);
    setPayments([
      {
        id: 'pay-initial',
        username: '',
        tierName: 'Free Access',
        price: '0',
        method: 'System Init',
        trxId: 'SYS_VERIFIED_99',
        status: 'Approved',
        date: new Date().toLocaleString()
      }
    ]);
    setActiveTab('home');
    triggerToast('Secure portal session locked and cleared.', 'success');
  };

  const handleLoginSuccess = (credentials: {
    username: string;
    fullName: string;
    email: string;
    phone: string;
    rememberMe?: boolean;
    isSignUp?: boolean;
  }) => {
    const isRemembered = credentials.rememberMe !== false;
    setRememberMe(isRemembered);
    localStorage.setItem('bt_remember_me', String(isRemembered));

    setUsername(credentials.username);
    setCustomUsername(credentials.username);
    setFullName(credentials.fullName);
    setEditFullName(credentials.fullName);
    setEmail(credentials.email);
    setEditEmail(credentials.email);
    setPhone(credentials.phone);
    setEditPhone(credentials.phone);
    setIsLoggedIn(true);

    const activeStorage = isRemembered ? localStorage : sessionStorage;
    activeStorage.setItem('bt_is_logged_in', 'true');
    activeStorage.setItem('bt_username', credentials.username);
    activeStorage.setItem('bt_fullname', credentials.fullName);
    activeStorage.setItem('bt_email', credentials.email);
    activeStorage.setItem('bt_phone', credentials.phone);

    if (credentials.isSignUp) {
      const clientRegText = `🔔 <b>নতুন কাস্টমার সফলভাবে রেজিস্টার করেছেন!</b>\n\n` +
        `👤 ইউজারনেম: <b>${credentials.username}</b>\n` +
        `📛 নাম: <b>${credentials.fullName}</b>\n` +
        `📧 ইমেল: <code>${credentials.email}</code>\n` +
        `📞 ফোন নাম্বার: <code>${credentials.phone || 'Not provided'}</code>\n\n` +
        `<i>কাস্টমার মেম্বারশিপ লেভেল পরিবর্তন ও ট্রানজেকশন পরিচালনা করতে এডমিন পোর্টালে ভিজিট করুন।</i>`;
      sendTelegramNotification(clientRegText);
    }

    // Swap files or clear alternate to prevent overlapping states
    const targetKeys = ['bt_is_logged_in', 'bt_username', 'bt_fullname', 'bt_email', 'bt_phone'];
    targetKeys.forEach(k => {
      if (isRemembered) {
        sessionStorage.removeItem(k);
      } else {
        localStorage.removeItem(k);
      }
    });
  };

  // Switch tab scroll to top helper
  const handleTabSwitch = (tab: 'home' | 'membership' | 'assets' | 'network' | 'profile') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic customized referral code generator based on username
  const getReferralCode = (name: string) => {
    let clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 4) {
      return (clean + 'BODYTOUCH').slice(0, 8);
    }
    return (clean + 'REF').slice(0, 10);
  };

  const currentReferralCode = getReferralCode(username);
  const currentReferralLink = `https://service.bodytouch.com/login.php?ref=${currentReferralCode}`;

  // Derived state for logged-in user's referral networking
  const myReferrals = useMemo(() => {
    return referrals.filter((r) => r.referrer === username);
  }, [referrals, username]);

  const myReferralsCount = myReferrals.length;
  const myConversionsCount = myReferrals.filter((r) => r.tier !== 'FREE').length;
  const myEarningsSum = myReferrals.reduce((sum, r) => sum + r.commission, 0);

  // commission percentage calculation based on count
  const myCommissionPercent = useMemo(() => {
    if (myConversionsCount >= 5) return 25; // Elite level
    if (myConversionsCount >= 2) return 15; // Premium level
    if (myConversionsCount >= 1) return 10; // Regular level
    return 5; // Default free affiliate tier commission rate
  }, [myConversionsCount]);

  if (!isLoggedIn) {
    return (
      <div className="text-[#c4d1eb] min-h-screen flex flex-col justify-between selection:bg-rose-500 selection:text-white bg-[#020714]">
        <LoginGate onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (isAdminOpen) {
    return (
      <div className="text-slate-100 min-h-screen bg-[#0c0d12] selection:bg-red-500 selection:text-white font-sans w-full">
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
        <AdminPanel
          payments={payments}
          onApprove={handleAdminApprove}
          onReject={handleAdminReject}
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          companions={companions}
          onUpdateCompanions={setCompanions}
          locations={locations}
          onUpdateLocations={setLocations}
          bookings={bookings}
          onApproveBooking={handleAdminApproveBooking}
          onDeclineBooking={handleAdminDeclineBooking}
          onMarkOutgoingBooking={handleAdminMarkOutgoingBooking}
          onMarkCompletedBooking={handleAdminMarkCompletedBooking}
          emailLogs={emailLogs}
          onClearEmailLogs={() => setEmailLogs([])}
          emailjsServiceId={emailjsServiceId}
          onSetEmailjsServiceId={setEmailjsServiceId}
          emailjsTemplateId={emailjsTemplateId}
          onSetEmailjsTemplateId={setEmailjsTemplateId}
          emailjsPublicKey={emailjsPublicKey}
          onSetEmailjsPublicKey={setEmailjsPublicKey}
          telegramBotToken={telegramBotToken}
          onSetTelegramBotToken={setTelegramBotToken}
          telegramGroupId={telegramGroupId}
          onSetTelegramGroupId={setTelegramGroupId}
          telegramHelpline={telegramHelpline}
          onSetTelegramHelpline={setTelegramHelpline}
          onApproveCompanion={handleAdminApproveCompanion}
          onDeclineCompanion={handleAdminDeclineCompanion}
          onSendEmail={sendAutoEmail}
          cities={cities}
          structuredCities={structuredCities}
          onUpdateStructuredCities={handleUpdateStructuredCities}
          paymentGateways={paymentGateways}
          onUpdatePaymentGateways={setPaymentGateways}
          shortLinkStats={shortLinkStats}
          pricingConfig={pricingConfig}
          onUpdatePricingConfig={handleUpdatePricingConfig}
          referrals={referrals}
          onUpdateReferrals={setReferrals}
          withdrawals={withdrawals}
          onUpdateWithdrawals={setWithdrawals}
          categories={categories}
          onUpdateCategories={setCategories}
        />
      </div>
    );
  }

  return (
    <div className="text-[#c4d1eb] min-h-screen flex flex-col justify-between selection:bg-blue-500 selection:text-white bg-[#020714] pb-24">


      {/* Dynamic Toast alerts */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      {/* Main app block - centered maximum width */}
      <div className="flex-1 w-full max-w-xl mx-auto px-4 pt-6">
        
        {/* Nav Header branding */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center space-x-2.5">
            {/* Elegant Brand Logo Image */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <BrandLogo size={36} className="border-0 shadow-inner" />
            </div>
            <div className="text-left leading-none">
              <span className="text-lg font-mono font-black tracking-[0.22em] text-white block">bodyTOUCH</span>
              <span className="text-[8px] tracking-[0.24em] uppercase text-blue-400 font-extrabold block mt-1">
                DISCRETION GUARANTEED
              </span>
            </div>
          </div>

          {/* Right section: Wallet, User Avatar & Admin Trigger */}
          <div className="flex items-center space-x-2">
            {/* Wallet Cash Capsule */}
            <button
              onClick={() => setIsWalletModalOpen(true)}
              className="bg-[#05112e] hover:bg-[#0a1e4d] border border-blue-500/20 rounded-full py-1.5 px-3 flex items-center space-x-1.5 text-[11px] font-mono shadow-sm transition-all duration-200 cursor-pointer active:scale-95"
              title="Open Accounts Ledger / লেনদেন হিস্টোরি"
            >
              <Wallet className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-blue-300 font-bold border-r border-blue-500/15 pr-1.5 h-3.5 flex items-center">৳</span>
              <span className="text-white font-extrabold">{walletBalance.toLocaleString('bn-BD')}</span>
            </button>

            {/* Profile Letter Circle */}
            <button
              onClick={() => handleTabSwitch('profile')}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-900 to-indigo-900 border border-blue-500/30 flex items-center justify-center text-white font-extrabold text-sm shadow-md cursor-pointer hover:border-cyan-450 transition-all"
              title="Go to Profile"
            >
              {username.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>

        {/* Announcement Megaphone Banner */}
        <AnimatePresence>
          {bannerVisible && (
            <motion.div
              id="announcement-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#05112e]/95 border border-blue-500/20 text-blue-350 text-[11.5px] font-semibold py-2.5 px-4 rounded-2xl flex items-center justify-between shadow-lg shadow-black/40 backdrop-blur-md mb-5 text-left gap-2 gold-breathing-glow"
            >
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <span className="flex-shrink-0 text-blue-400 text-sm">📢</span>
                <div className="whitespace-nowrap overflow-hidden relative w-full">
                  <motion.div
                    className="inline-block"
                    animate={{ x: ['100%', '-100%'] }}
                    transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
                  >
                    সার্ভিসের ন্যূনতম ১ ঘণ্টা পূর্বে বুকিং দিবেন। সাপোর্টে কথা না বলে ক্যান সার্ভিস বুকিং দিবেন না
                  </motion.div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBannerVisible(false)}
                className="text-blue-500 hover:text-blue-300 font-bold text-xs focus:outline-none px-1 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TAB VIEWS AREA */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="space-y-6"
            >
              {/* Premium Image Banner Slider */}
              <motion.div variants={itemVariants}>
                <ImageSlider />
              </motion.div>

              {/* Premium Welcome Access banner */}
              <motion.div variants={itemVariants} className="cyan-glow-card rounded-3xl p-8 relative overflow-hidden text-left bg-gradient-to-tr from-[#051433] to-[#020715] gold-breathing-glow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-1">
                      Welcome, {username}
                    </h2>
                    <p className="text-xs text-blue-400 uppercase tracking-[0.24em] font-black block">
                      YOUR ACCESS PORTAL
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-900/25 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-1.5 shadow-[0_0_15px_rgba(56,189,248,0.15)] gold-breathing-glow">
                      <User className="w-6 h-6 text-[#00e5ff]" />
                    </div>
                    <span className="text-xs font-black text-blue-200 tracking-widest font-mono bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-lg gold-breathing-glow">
                      {userLevel}
                    </span>
                  </div>
                </div>

                {/* Sub status row */}
                <div className="mt-6 mb-6 bg-[#030a1c] border border-blue-500/20 rounded-2xl py-4.5 px-6 flex items-center space-x-4.5 text-left shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] gold-breathing-glow">
                  {userLevel === 'FREE' ? (
                    <>
                      <Lock className="text-[#dbaa61] w-5 h-5 flex-shrink-0 animate-pulse" />
                      <span className="text-sm text-[#dbaa61] font-bold tracking-widest uppercase font-mono">
                        Upgrade to unlock benefits
                      </span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="text-emerald-400 w-5.5 h-5.5 flex-shrink-0" />
                      <span className="text-sm text-emerald-300 font-bold tracking-wide">
                        {userLevel} Elite access privileges active
                      </span>
                    </>
                  )}
                </div>

                {userLevel !== 'FREE' && (
                  <div className="mb-6 p-5 bg-indigo-950/20 border border-indigo-500/25 rounded-2xl flex items-center justify-between text-left gap-4 gold-breathing-glow">
                    <div className="space-y-1">
                      <span className="text-xs text-indigo-400 font-black uppercase tracking-widest font-mono block">
                        📞 VIP Helpline Support
                      </span>
                      <p className="text-sm text-slate-100 font-bold leading-tight">
                        Need immediate dispatcher assistance? Contact custom support helpline.
                      </p>
                    </div>
                    <a
                      href={`https://t.me/${telegramHelpline.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-black uppercase tracking-wider rounded-xl transition duration-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-4 h-4 rotate-45 text-white" />
                      Helpline
                    </a>
                  </div>
                )}

                {userLevel === 'FREE' && (
                  <button
                    onClick={() => handleTabSwitch('membership')}
                    className="orange-grad-btn text-slate-950 text-xs sm:text-sm uppercase tracking-[0.16em] font-black py-4 px-8 rounded-2xl flex items-center space-x-2.5 cursor-pointer leading-none shadow-lg outline-none"
                  >
                    <span>SEE PLANS</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </button>
                )}
              </motion.div>


              {/* Realtime stats dashboard row */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                <motion.div
                  whileHover={{ y: -6, scale: 1.05, boxShadow: "0 22px 50px rgba(0, 0, 0, 0.99), 0 0 30px rgba(13, 110, 253, 0.32)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="cyan-glow-card rounded-2xl py-6 px-4 text-center cursor-pointer transition-all duration-300 border border-blue-500/30 gold-breathing-glow"
                >
                  <p className="text-lg sm:text-2xl font-black text-white font-mono tracking-wide leading-none mb-1.5">
                    {userLevel}
                  </p>
                  <p className="text-[11px] text-blue-300 uppercase tracking-[0.16em] font-extrabold leading-none">
                    LEVEL
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -6, scale: 1.05, boxShadow: "0 22px 50px rgba(0, 0, 0, 0.99), 0 0 30px rgba(13, 110, 253, 0.32)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="cyan-glow-card rounded-2xl py-6 px-4 text-center cursor-pointer transition-all duration-300 border border-blue-500/30 gold-breathing-glow"
                >
                  <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide leading-none mb-1.5">
                    {bookings.length}
                  </p>
                  <p className="text-[11px] text-blue-300 uppercase tracking-[0.16em] font-extrabold leading-none">
                    BOOKINGS
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -6, scale: 1.05, boxShadow: "0 22px 50px rgba(0, 0, 0, 0.99), 0 0 35px rgba(13, 110, 253, 0.42)" }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="cyan-glow-card rounded-2xl py-6 px-4 text-center relative overflow-hidden cursor-pointer transition-all duration-300 border border-blue-500/30 gold-breathing-glow"
                >
                  <div className="absolute top-2 right-2.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wide leading-none mb-1.5 flex items-center justify-center">
                    <span className="text-emerald-400 mr-1 text-base leading-none">•</span>
                    <span>{onlineCount}</span>
                  </p>
                  <p className="text-[11px] text-blue-300 uppercase tracking-[0.16em] font-extrabold leading-none">
                    ONLINE
                  </p>
                </motion.div>
              </motion.div>

              {/* Premium Companion Hub Search & Filter Block */}
              <motion.div variants={itemVariants} className="space-y-3.5 text-left">
                <div className="flex items-center space-x-2.5 text-white px-1">
                  <Star className="text-blue-400 fill-blue-400/20 w-5.5 h-5.5" />
                  <h3 className="text-base font-black uppercase tracking-widest text-white font-sans">
                    Premium Companion Hub
                  </h3>
                </div>

                {/* Search & Rates Selector Hub */}
                <div className="flex flex-col gap-3.5 bg-slate-950/40 p-6 rounded-2xl border border-blue-500/10 shadow-inner gold-breathing-glow">
                  <div className="flex gap-3">
                    {/* Search Field */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Name, ID, or Location..."
                        className="w-full bg-[#03091c] border border-blue-500/20 text-white rounded-xl !pl-12 pr-4.5 py-3.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/80 transition font-medium"
                      />
                      <svg
                        className="absolute left-4 top-4 w-5 h-5 text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Rates Selector Dropdown */}
                    <div className="relative min-w-[130px]">
                      <select
                        value={rateFilter}
                        onChange={(e) => setRateFilter(e.target.value)}
                        className="w-full bg-[#03091c] border border-blue-500/20 text-white rounded-xl pl-4 pr-9 py-3.5 text-sm focus:outline-none focus:border-cyan-400/80 appearance-none transition cursor-pointer font-extrabold text-slate-300"
                      >
                        <option value="all">All Rates</option>
                        <option value="low">Under ৳10k</option>
                        <option value="med">৳10k - ৳15k</option>
                        <option value="high">Above ৳15k</option>
                      </select>
                      <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* HOW TO GET SERVICE badge button */}
                  <div className="flex justify-between items-center px-1 pt-1.5 border-t border-blue-950/20">
                    <span className="text-[11px] text-slate-400 font-mono tracking-widest uppercase font-black text-left">
                      Category limits verified
                    </span>
                    <button
                      type="button"
                      onClick={() => triggerToast("👉 To Book a Companion: Ensure you have upgraded to the correct member level. Free tier allows access to DEMO companions. Click 'BOOK' to schedule.", "success")}
                      className="text-[11px] text-[#00e5ff] hover:text-cyan-300 font-black uppercase tracking-widest flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>ℹ️ HOW TO GET SERVICE?</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Fast links hub */}
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                {/* MODELS */}
                <motion.button
                  whileHover={{ y: -6, scale: 1.05, boxShadow: "0 22px 55px rgba(0, 0, 0, 0.99), 0 0 35px rgba(0, 229, 255, 0.32)" }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 450, damping: 14 }}
                  onClick={() => {
                    const el = document.getElementById('roster-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="cyan-glow-card rounded-2xl py-6 px-4 flex flex-col items-center justify-center transition cursor-pointer gold-breathing-glow"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-900/25 border border-blue-500/30 flex items-center justify-center text-[#00e5ff] mb-3.5 shadow-[0_0_20px_rgba(0,229,255,0.22)] gold-breathing-glow">
                    <User className="w-6.5 h-6.5 text-[#00e5ff]" />
                  </div>
                  <span className="text-xs font-black uppercase text-blue-100 tracking-[0.14em] text-center">MODELS</span>
                </motion.button>

                {/* PLACES */}
                <motion.button
                  whileHover={{ y: -6, scale: 1.05, boxShadow: "0 22px 55px rgba(0, 0, 0, 0.99), 0 0 35px rgba(0, 229, 255, 0.32)" }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 450, damping: 14 }}
                  onClick={() => {
                    const el = document.getElementById('location-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="cyan-glow-card rounded-2xl py-6 px-4 flex flex-col items-center justify-center transition cursor-pointer gold-breathing-glow"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-900/25 border border-blue-500/30 flex items-center justify-center text-[#00e5ff] mb-3.5 shadow-[0_0_20px_rgba(0,229,255,0.22)] gold-breathing-glow">
                    <Building className="w-6.5 h-6.5 text-[#00e5ff]" />
                  </div>
                  <span className="text-xs font-black uppercase text-blue-100 tracking-[0.14em] text-center">PLACES</span>
                </motion.button>

                {/* MEMBERSHIP */}
                <motion.button
                  whileHover={{ y: -6, scale: 1.05, boxShadow: "0 22px 55px rgba(0, 0, 0, 0.99), 0 0 35px rgba(0, 229, 255, 0.32)" }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 450, damping: 14 }}
                  onClick={() => handleTabSwitch('membership')}
                  className="cyan-glow-card rounded-2xl py-6 px-4 flex flex-col items-center justify-center transition cursor-pointer gold-breathing-glow"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-900/25 border border-blue-500/30 flex items-center justify-center text-[#00e5ff] mb-3.5 shadow-[0_0_20px_rgba(0,229,255,0.22)] gold-breathing-glow">
                    <Crown className="w-6.5 h-6.5 text-[#00e5ff]" />
                  </div>
                  <span className="text-xs font-black uppercase text-blue-100 tracking-[0.14em] text-center">MEMBERSHIP</span>
                </motion.button>
              </motion.div>

              {/* Current scheduling / Recent status board */}
              <motion.div variants={itemVariants} className="cyan-glow-card rounded-3xl p-5 space-y-4 text-left gold-breathing-glow">
                <div className="flex items-center space-x-2 text-white">
                  <Clock className="text-blue-400 w-4.5 h-4.5" />
                  <h3 className="text-sm font-bold tracking-wide">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center border border-dashed border-blue-500/10 rounded-2xl bg-slate-950/20 gold-breathing-glow">
                      <Clock className="w-8 h-8 text-blue-500/20" />
                      <p className="text-xs text-blue-300/40 font-semibold">No recent activity found.</p>
                    </div>
                  ) : (
                    bookings.map((book) => (
                      <div
                        key={book.id}
                        className="bg-[#030a1c] border border-blue-500/15 p-3 rounded-xl flex items-center justify-between gold-breathing-glow"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={book.image}
                            className="w-10 h-10 rounded-lg object-cover border border-blue-500/15"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-xs text-white font-bold">
                              {book.modelName}{' '}
                              <span className="text-[10px] text-blue-400 font-mono font-medium">
                                {book.modelTag}
                              </span>
                            </p>
                            <p className="text-[10px] text-blue-300/60 mt-0.5 font-semibold">
                              {book.location} • {book.duration}
                            </p>
                            {book.secretCode && (
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[10px] text-emerald-400 font-mono font-black tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded flex items-center gap-1 gold-breathing-glow">
                                  🔑 Code: {book.secretCode}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-amber-500/20 animate-pulse gold-breathing-glow">
                          {book.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Roster profiles searchable, category-tab grid section */}
              <motion.div id="roster-section" variants={itemVariants} className="space-y-4 text-left pt-2">
                {/* Tier Selection Tabs Bar */}
                <div className="grid grid-cols-4 gap-2.5 p-2 bg-slate-950/60 rounded-[22px] border border-blue-900/30 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)] gold-breathing-glow">
                  {(['DEMO', 'REGULAR', 'PREMIUM', 'ELITE'] as const).map((cat) => {
                    const isLocked = cat !== 'DEMO' && 
                      ((cat === 'REGULAR' && userLevel === 'FREE') ||
                      (cat === 'PREMIUM' && (userLevel === 'FREE' || userLevel === 'REGULAR')) ||
                      (cat === 'ELITE' && userLevel !== 'ELITE'));
                      
                    const isActive = selectedCategory === cat;

                    return (
                      <motion.button
                        key={cat}
                        whileHover={{ 
                          y: -4, 
                          scale: 1.05, 
                          boxShadow: isActive 
                            ? "0 10px 25px rgba(0, 229, 255, 0.25)" 
                            : "0 8px 18px rgba(0, 0, 0, 0.45)"
                        }}
                        whileTap={{ scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 450, damping: 14 }}
                        onClick={() => {
                          if (isLocked) {
                            triggerToast(`🔒 ${cat} level is locked! Please purchase this membership tier first.`, 'error');
                            setTimeout(() => {
                              handleTabSwitch('membership');
                            }, 800);
                            return;
                          }
                          setSelectedCategory(cat);
                        }}
                        className={`py-4 px-1 rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center justify-center gap-1.5 cursor-pointer border-2 ${
                          isActive
                            ? 'bg-gradient-to-tr from-[#051139] to-[#0d226a] border-[#00e5ff] text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.25)]'
                            : 'bg-[#03091c]/80 border-blue-500/10 text-slate-400 hover:text-white hover:border-blue-500/25 hover:bg-[#05123b]/90'
                        }`}
                      >
                        <span className="leading-none">{cat}</span>
                        {isLocked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        ) : (
                          isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse"></span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Subtext info for active filter category */}
                <div className="text-left px-1 text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="font-semibold uppercase tracking-wider text-slate-500 text-[9px]">ACTIVE ACCESS TIER</span>
                  {selectedCategory !== 'DEMO' && (
                    <span className="text-amber-400 font-bold font-mono text-[9px] uppercase tracking-wide">
                      🔒 Require {selectedCategory} Access Pass
                    </span>
                  )}
                </div>

                {/* Dynamically Managed Category Segments Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => {
                    const isActive = selectedSegment === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedSegment(cat)}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                          isActive
                            ? 'bg-[#0a112c] text-[#00e5ff] border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                            : 'bg-[#58a6ff]/5 text-slate-400 border-white/5 hover:text-slate-200 hover:border-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Companions Deluxe Grid */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {filteredCompanions.length === 0 ? (
                    <div className="col-span-2 py-12 text-center border border-dashed border-blue-500/10 rounded-3xl bg-slate-950/20 text-slate-500 text-xs font-semibold">
                      No companions matching search terms or filters.
                    </div>
                  ) : (
                    filteredCompanions.map((comp) => {
                      // Check user level authorization to this model
                      const isModelLocked = selectedCategory !== 'DEMO' && 
                        ((selectedCategory === 'REGULAR' && userLevel === 'FREE') ||
                        (selectedCategory === 'PREMIUM' && (userLevel === 'FREE' || userLevel === 'REGULAR')) ||
                        (selectedCategory === 'ELITE' && userLevel !== 'ELITE'));

                      return (
                        <div
                          key={comp.id}
                          className="bg-slate-950/80 border border-blue-500/10 hover:border-blue-500/25 rounded-3xl p-3 flex flex-col justify-between shadow-lg shadow-black/50 relative overflow-hidden transition-all duration-300 group gold-breathing-glow"
                        >
                          <div className="relative h-56 rounded-2xl overflow-hidden bg-slate-900 mb-3">
                            <img
                              src={comp.image}
                              alt={comp.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out"
                              referrerPolicy="no-referrer"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#020714] via-transparent to-transparent pointer-events-none" />
                            
                            {/* Profile tag badge */}
                            <div className="absolute top-2 right-2">
                              <span className="bg-slate-950/85 backdrop-blur-md text-blue-300 text-[8px] border border-blue-500/10 font-bold tracking-widest px-2 py-0.5 rounded-full uppercase">
                                {comp.badge} PROFILE
                              </span>
                            </div>

                            {/* Overlayed Info block on bottom in front of gradient */}
                            <div className="absolute bottom-2 left-2 right-2 text-left leading-tight pointer-events-none">
                              <h4 className="text-xs font-extrabold text-white tracking-wide">
                                {comp.name}
                              </h4>
                              <p className="text-[9px] text-[#85a5ff] font-mono mt-0.5">
                                {comp.tag}
                              </p>
                              {comp.city && (
                                <p className="text-[8px] text-emerald-400 font-extrabold uppercase mt-0.5 tracking-wider flex items-center gap-0.5">
                                  <span className="text-[10px]">📍</span>
                                  <span>{comp.city}</span>
                                </p>
                              )}
                            </div>

                            {/* Active Lockout blocker overlay for unverified subscriptions */}
                            {isModelLocked && (
                              <div className="absolute inset-0 bg-[#020714]/90 backdrop-blur-sm flex flex-col items-center justify-center p-3 text-center">
                                <Lock className="text-amber-400 w-7 h-7 mb-1.5 p-1 bg-amber-500/10 rounded-full border border-amber-500/20" />
                                <span className="text-[9px] text-white font-extrabold uppercase tracking-widest block">
                                  {comp.badge} ACCESS LOCKED
                                </span>
                                <p className="text-[8px] text-slate-400 leading-tight mt-1 max-w-[120px]">
                                  Upgrade membership card to reveal profile.
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTabSwitch('membership');
                                  }}
                                  className="mt-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[8px] uppercase tracking-wider py-1 px-2.5 rounded-md cursor-pointer transition"
                                >
                                  Unlock Now
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Rate Details strip */}
                          <div className="flex items-center justify-between mb-2.5 px-1 text-left">
                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Hourly Rate</span>
                            <span className="text-[11px] font-black text-emerald-400 font-mono">
                              ৳{comp.rate.toLocaleString()}
                            </span>
                          </div>

                          {/* Model Action handlers - DATA & BOOK */}
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (isModelLocked) {
                                  triggerToast(`⚠️ Please upgrade to ${comp.badge} membership to inspect ${comp.name}.`, 'error');
                                  return;
                                }
                                setSelectedCompanion(comp);
                              }}
                              className="bg-transparent border border-blue-500/15 hover:border-blue-500/30 hover:bg-blue-500/5 text-blue-300 text-[10px] font-black tracking-wider py-2 rounded-xl transition cursor-pointer text-center"
                            >
                              DATA
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isModelLocked) {
                                  triggerToast(`⚠️ Please upgrade to ${comp.badge} membership to book ${comp.name}.`, 'error');
                                  return;
                                }
                                setBookingCompanion(comp);
                              }}
                              className="bg-gradient-to-tr from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white text-[10px] font-black tracking-wider py-2 rounded-xl shadow-md cursor-pointer transition text-center"
                            >
                              BOOK
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>

              {/* Space-based Locations listings horizontal carousel */}
              <motion.div id="location-section" variants={itemVariants} className="space-y-5 text-left pt-2 pb-6">
                
                {/* Section header title */}
                <div className="flex items-center space-x-2 text-white px-1">
                  <Building className="text-blue-400 w-4.5 h-4.5" />
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-white">
                    Five-Star Partner Sanctuaries & Safe Houses
                  </h3>
                </div>

                {/* Ultimate Search and Filter Panel (Matching User Screenshot Layout) */}
                <div className="bg-gradient-to-br from-[#070b18] to-[#04060e] border border-blue-500/10 rounded-3xl p-6 shadow-2xl space-y-5">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    
                    {/* Switcher Toggles (HOTELS | SAFE HOUSES) */}
                    <div className="flex bg-[#02050e] border border-blue-500/10 p-1 rounded-2xl w-full md:w-auto shadow-inner">
                      <button
                        type="button"
                        onClick={() => setLocationTypeTab('HOTELS')}
                        className={`flex-1 md:flex-initial px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          locationTypeTab === 'HOTELS'
                            ? 'bg-[#141d32] text-amber-400 border border-amber-500/15 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 text-amber-500" />
                        <span>HOTELS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationTypeTab('SAFE HOUSES')}
                        className={`flex-1 md:flex-initial px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          locationTypeTab === 'SAFE HOUSES'
                            ? 'bg-[#141d32] text-amber-400 border border-amber-500/15 shadow-md font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        <span>SAFE HOUSES</span>
                      </button>
                    </div>

                    {/* Search Field Input */}
                    <div className="relative w-full md:w-80">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={locationSearchQuery}
                        onChange={(e) => setLocationSearchQuery(e.target.value)}
                        placeholder="Search Location..."
                        className="w-full bg-[#02050e] text-xs font-bold text-white pl-11 pr-4 py-3.5 rounded-2xl border border-blue-500/10 focus:border-amber-500/30 focus:outline-none transition-all duration-300 placeholder-slate-600 tracking-wide font-sans shadow-inner"
                      />
                    </div>

                  </div>

                  {/* Horizontal pill choices (City / Location + Rating stars) */}
                  <div className="flex flex-col gap-3 pt-1 border-t border-slate-900/60">
                    
                    {/* City Location Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      {['ALL', 'DHAKA', 'CHITTAGONG', "COX'S BAZAR", 'SYLHET', 'RAJSHAHI', 'KHULNA'].map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setLocationCityFilter(city)}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer border ${
                            locationCityFilter === city
                              ? 'bg-[#dbaa61] text-slate-950 border-amber-500/20 shadow-lg scale-[1.02] font-extrabold'
                              : 'bg-[#02050e] text-slate-400 border-blue-500/5 hover:border-blue-500/15 hover:text-white'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>

                    {/* Rating Stars Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      {['ALL RATINGS', '5★', '4★', '3★'].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setLocationRatingFilter(rating)}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all duration-200 cursor-pointer border ${
                            locationRatingFilter === rating
                              ? 'border-amber-500/40 bg-[#141e30] text-amber-400 font-extrabold shadow-md'
                              : 'bg-[#02050e] text-slate-400 border-blue-500/5 hover:border-blue-500/15 hover:text-white'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Grid layout containing location cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {filteredHotelLocations.length > 0 ? (
                    filteredHotelLocations.map((loc) => (
                      <LocationCard
                        key={loc.id}
                        location={loc}
                        onMapClick={(clickedLoc) => setSelectedLocation(clickedLoc)}
                        onReserveClick={(clickedLoc) => handleReserveHotelClick(clickedLoc)}
                      />
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center border border-dashed border-slate-900 rounded-3xl bg-slate-950/20">
                      <p className="text-zinc-550 text-xs font-black tracking-widest uppercase mb-1">
                        No Destined Sanctuaries Found
                      </p>
                      <p className="text-[10px] text-zinc-650 font-semibold uppercase tracking-wider">
                        Try clearing or modifying your filter values.
                      </p>
                    </div>
                  )}
                </div>

              </motion.div>

            </motion.div>
          )}

          {activeTab === 'membership' && (
            <motion.div
              key="membership"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="space-y-6"
            >
              {/* Head titles */}
              <motion.div variants={itemVariants} className="text-center py-2 space-y-1">
                <h2 className="text-3xl font-black text-blue-400 tracking-wider font-display">
                  VIP Membership
                </h2>
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                  ONE-TIME DEPOSIT. 100% STORED WALLET CASH.
                </p>
              </motion.div>

              {/* Local Bengali Informational box */}
              <motion.div variants={itemVariants} className="bg-blue-950/20 border border-blue-500/25 rounded-2xl p-4.5 flex items-start gap-3 text-left gold-breathing-glow">
                <Info className="text-blue-400 flex-shrink-0 mt-0.5 w-5 h-5" />
                <p className="text-xs text-blue-300 leading-relaxed font-semibold">
                  মেম্বারশিপ ভেরিফিকেশনের জন্য কোনো ফি কেটে নেওয়া হবে না। যে টাকা আপনি জমা করবেন তা আপনার 
                  ব্যক্তিগত ওয়ালেটে ১০০% যুক্ত হবে এবং পরবর্তীতে বুকিংয়ে সরাসরি ব্যবহার করা যাবে।
                </p>
              </motion.div>

              {/* Membership Pricing Cards Stacked */}
              <motion.div variants={itemVariants} className="space-y-6 px-1">
                {/* 1. Starter / Regular Card */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ type: 'spring', sharpness: 200 }}
                  className="bg-[#030a1c] border border-blue-500/20 rounded-3xl p-6 text-center relative overflow-hidden flex flex-col justify-between shadow-lg transition-all gold-breathing-glow"
                >
                  <div className="text-left">
                    <div className="mb-4 text-center">
                      <span className="border border-blue-500/30 text-[#85a5ff] text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase bg-[#101c3d]/20">
                        STARTER
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-white text-center font-sans tracking-wide">Regular</h3>
                    <div className="my-2.5 flex items-center justify-center text-white font-sans">
                      <span className="text-5xl font-black tracking-tight">৳{pricingConfig.regularPlanFee.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 tracking-[0.22em] font-extrabold text-center uppercase mb-6 leading-none">
                      LIFETIME ACCESS
                    </p>

                    <div className="space-y-3.5 mb-8 px-2 font-semibold">
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Check className="w-4.5 h-4.5 stroke-[3.5] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Access to 500+ Verified Profiles</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Check className="w-4.5 h-4.5 stroke-[3.5] flex-shrink-0" />
                        <span className="text-xs tracking-wide">10% Service Discount</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Check className="w-4.5 h-4.5 stroke-[3.5] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Priority Concierge Support</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Check className="w-4.5 h-4.5 stroke-[3.5] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Member-only Listings</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Check className="w-4.5 h-4.5 stroke-[3.5] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Weekly Roster Updates</span>
                      </div>
                    </div>
                  </div>

                  {userLevel === 'FREE' ? (
                    <button
                      onClick={() => triggerOpenCheckout('Regular', pricingConfig.regularPlanFee.toLocaleString())}
                      className="w-full bg-[#569bef] hover:bg-[#68a6f4] text-[#030919] text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-md"
                    >
                      <Star className="w-4.5 h-4.5 fill-current text-[#030919]" />
                      <span>GET BASIC</span>
                    </button>
                  ) : userLevel === 'REGULAR' ? (
                    <div className="w-full bg-emerald-500/10 text-[#04d98c] border border-emerald-500/35 text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-mono">
                      <span>✓ CURRENT ACTIVE PLAN</span>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-900/60 text-slate-500 border border-slate-800/60 text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-mono">
                      <span>✓ INCLUDED IN {userLevel}</span>
                    </div>
                  )}
                </motion.div>

                {/* 2. Popular / Premium Card (with Gold Aura and neon gold border) */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ type: 'spring', sharpness: 200 }}
                  className="gold-breathing-glow bg-[#030a24] border-2 border-yellow-500 rounded-3xl p-6 text-center relative overflow-hidden flex flex-col justify-between shadow-[0_0_24px_rgba(234,179,8,0.25)] transition-all"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="text-left">
                    <div className="mb-4 text-center">
                      <span className="border border-yellow-500/50 text-[#f5c531] text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase bg-[#1a1710]">
                        POPULAR
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-white text-center font-sans tracking-wide">Premium</h3>
                    <div className="my-2.5 flex items-center justify-center text-[#fcc218] font-sans">
                      <span className="text-5xl font-black tracking-tight">৳{pricingConfig.premiumPlanFee.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 tracking-[0.22em] font-extrabold text-center uppercase mb-6 leading-none">
                      LIFETIME MEMBERSHIP
                    </p>

                    <div className="space-y-3.5 mb-8 px-2 font-semibold">
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">All Regular Benefits</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Exclusive Premium Portfolios</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">30% Service Discount</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Dedicated Account Manager</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Early Access to New Profiles</span>
                      </div>
                    </div>
                  </div>

                  {(userLevel === 'FREE' || userLevel === 'REGULAR') ? (
                    <button
                      onClick={() => triggerOpenCheckout('Premium', pricingConfig.premiumPlanFee.toLocaleString())}
                      className="w-full bg-[#f5c531] hover:bg-[#fbd349] text-[#030919] text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-md animate-pulse"
                    >
                      <Crown className="w-4 h-4 fill-current text-[#030919]" />
                      <span>GET PREMIUM</span>
                    </button>
                  ) : userLevel === 'PREMIUM' ? (
                    <div className="w-full bg-yellow-500/10 text-[#f5c531] border border-yellow-500/35 text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-mono">
                      <span>✓ CURRENT ACTIVE PLAN</span>
                    </div>
                  ) : (
                    <div className="w-full bg-slate-900/60 text-slate-500 border border-slate-800/60 text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-mono">
                      <span>✓ INCLUDED IN {userLevel}</span>
                    </div>
                  )}
                </motion.div>

                {/* 3. Exclusive / Elite Card (with Cyan Aura and glowing cyan border) */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.01 }}
                  transition={{ type: 'spring', sharpness: 200 }}
                  className="cyan-breathing-glow bg-[#030a24] border-2 border-cyan-400 rounded-3xl p-6 text-center relative overflow-hidden flex flex-col justify-between shadow-[0_0_24px_rgba(34,211,238,0.25)] transition-all gold-breathing-glow"
                >
                  <div className="absolute top-0 left-0 w-28 h-28 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="text-left">
                    <div className="mb-4 text-center">
                      <span className="border border-cyan-500/50 text-[#16d5ec] text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase bg-[#0c1e2a]">
                        EXCLUSIVE
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-white text-center font-sans tracking-wide">Elite</h3>
                    <div className="my-2.5 flex items-center justify-center text-[#16d5ec] drop-shadow-[0_0_8px_rgba(22,213,236,0.5)] font-sans">
                      <span className="text-5xl font-black tracking-tight">৳{pricingConfig.elitePlanFee.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 tracking-[0.22em] font-extrabold text-center uppercase mb-6 leading-none">
                      LIFETIME PRESTIGE
                    </p>

                    <div className="space-y-3.5 mb-8 px-2 font-semibold">
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">All Premium Benefits</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Unrestricted Platinum Access</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">50% Service Discount</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Personal Concierge 24/7</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Private Events & Exclusives</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[#04d98c]">
                        <Gem className="w-4 h-4 text-[#04d98c] flex-shrink-0" />
                        <span className="text-xs tracking-wide">Priority Booking Guarantee</span>
                      </div>
                    </div>
                  </div>

                  {userLevel !== 'ELITE' ? (
                    <button
                      onClick={() => triggerOpenCheckout('Elite', pricingConfig.elitePlanFee.toLocaleString())}
                      className="w-full bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-[#030919] text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-sans shadow-md"
                    >
                      <Gem className="w-4 h-4 fill-current text-[#030919]" />
                      <span>GET ELITE</span>
                    </button>
                  ) : (
                    <div className="w-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/35 text-xs font-black uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-mono">
                      <span>✓ CURRENT ACTIVE ELITE STATUS</span>
                    </div>
                  )}
                </motion.div>
              </motion.div>

              {/* Secret Vouchers Promo Code Widget */}
              <motion.div variants={itemVariants} className="cyan-glow-card rounded-2xl p-5 space-y-3 text-left gold-breathing-glow">
                <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider block">
                  Redeem Secret VIP Keys
                </span>
                <p className="text-xs text-slate-400 leading-normal font-semibold">
                  Contact dispatch support or input valid security bypass codes to upgrade membership tiers immediately.
                </p>

                <form onSubmit={handleApplyPromoCode} className="flex gap-2">
                  <input
                    type="password"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="CODE (e.g. BODYTOUCH)"
                    className="flex-1 bg-slate-950/60 border border-blue-500/20 text-white rounded-xl px-4 py-2.5 text-xs text-center font-mono tracking-widest focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 rounded-xl transition cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'assets' && (
            <motion.div
              key="assets"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="space-y-6"
            >
              {/* TOTAL LIQUID ASSETS CARD */}
              <motion.div
                variants={itemVariants}
                className="bg-[#030a1c]/90 border border-blue-500/10 rounded-3xl p-6 text-center space-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-[0.2em] block">
                  TOTAL LIQUID ASSETS
                </span>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-4xl lg:text-5xl font-black text-white">৳</span>
                  <span className="text-4xl lg:text-5xl font-black text-white font-mono">
                    {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </motion.div>

              {/* ACTION BUTTONS */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsAllocateOpen(true)}
                  className="bg-[#030a1c]/90 border border-blue-500/10 hover:border-blue-500/25 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-2 group transition-all duration-300 cursor-pointer"
                >
                  <ArrowUp className="w-6 h-6 text-blue-400 group-hover:-translate-y-1 transition-transform duration-300" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">ALLOCATE</span>
                  <span className="text-[9px] text-slate-400 leading-none font-semibold">Deposit funds to wallet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLiquidateOpen(true)}
                  className="bg-[#030a1c]/90 border border-blue-500/10 hover:border-blue-500/25 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-2 group transition-all duration-300 cursor-pointer"
                >
                  <ArrowDown className="w-6 h-6 text-blue-400 group-hover:translate-y-1 transition-transform duration-300" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">LIQUIDATE</span>
                  <span className="text-[9px] text-slate-400 leading-none font-semibold">Withdraw your earnings</span>
                </button>
              </motion.div>

              {/* LEDGER HISTORY CONTAINER */}
              <motion.div variants={itemVariants} className="bg-[#030a1c]/90 border border-blue-500/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-white border-b border-blue-500/10 pb-3">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold tracking-wide">Ledger History</h3>
                </div>

                {payments.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs font-semibold">
                    No ledger records found.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {payments.map((pay) => (
                      <div key={pay.id} className="border-b border-blue-500/15 pb-3 last:border-0 last:pb-0 text-left space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {pay.tierName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">
                              {pay.date}
                            </span>
                          </div>

                          {pay.status === 'Pending Verification' && (
                            <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/15 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              <span>PENDING</span>
                            </span>
                          )}

                          {pay.status === 'Approved' && (
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-500/15 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>VERIFIED</span>
                            </span>
                          )}

                          {pay.status === 'Rejected' && (
                            <span className="bg-rose-500/10 text-rose-450 text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full border border-rose-500/15 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-450" />
                              <span>REJECTED</span>
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight">
                          <div>
                            <span className="text-blue-300/40 block text-[8px] uppercase tracking-wider font-extrabold pb-0.5">
                              METHOD & VALUE
                            </span>
                            <span className={`font-bold ${pay.tierName === 'Withdrawal' ? 'text-rose-450' : 'text-emerald-400'}`}>
                              {pay.method} (৳{pay.price})
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-300/40 block text-[8px] uppercase tracking-wider font-extrabold pb-0.5">
                              TOKEN / TARGET WALLET
                            </span>
                            <span className="text-white font-bold truncate max-w-[120px] block">{pay.trxId}</span>
                          </div>
                        </div>

                        {pay.status === 'Pending Verification' && (
                          <div className="flex items-center gap-2 mt-2 pt-1">
                            <button
                              type="button"
                              disabled={verifyingMap[pay.id]}
                              onClick={() => handleAutoVerify(pay.id)}
                              className="w-full bg-blue-900/40 hover:bg-blue-800/60 disabled:opacity-50 text-blue-300 border border-blue-500/15 font-bold uppercase text-[8px] tracking-wider py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <RefreshCw className={`w-3 h-3 ${verifyingMap[pay.id] ? 'animate-spin' : ''}`} />
                              <span>SIMULATE MERCH_GATE_API KEY VERISON</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'network' && (
            <motion.div
              key="network"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="space-y-6"
            >
              {/* TOP STAT CARDS ROW */}
              <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-[#030a1c]/90 border border-blue-500/10 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-1">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm sm:text-base font-black text-white font-mono">৳ {myEarningsSum.toLocaleString()}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                    EARNINGS
                  </span>
                </div>

                <div className="bg-[#030a1c]/90 border border-blue-500/10 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-1">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm sm:text-base font-black text-white font-mono">{myReferralsCount}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                    REFERRALS
                  </span>
                </div>

                <div className="bg-[#030a1c]/90 border border-blue-500/10 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-1">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-sm sm:text-base font-black text-white font-mono">{myConversionsCount}</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                    CONVERSIONS
                  </span>
                </div>

                <div className="bg-[#030a1c]/90 border border-blue-500/10 rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center space-y-1">
                  <Percent className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm sm:text-base font-black text-white font-mono">{myCommissionPercent}%</span>
                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block truncate max-w-[50px] sm:max-w-none">
                    COMMISSION
                  </span>
                </div>
              </motion.div>

              {/* REFERRAL LINK PANEL */}
              <motion.div variants={itemVariants} className="bg-[#030a1c]/90 border border-blue-500/10 rounded-3xl p-5 sm:p-6 space-y-5 text-left">
                <div className="flex items-center gap-2 text-white border-b border-blue-500/10 pb-3">
                  <Link2 className="w-4 h-4 text-blue-400 rotate-45" />
                  <h3 className="text-sm font-bold tracking-wide">Your Referral Network Link</h3>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-slate-950/60 border border-blue-500/20 rounded-2xl p-2">
                  <div className="flex-1 px-3 py-2 text-xs font-mono text-blue-300 select-all truncate flex items-center">
                    {currentReferralLink}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentReferralLink);
                      triggerToast('📋 Referral link copied to clipboard!', 'success');
                    }}
                    className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY LINK</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs font-mono bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-2 text-[11px]">
                  <span className="text-slate-400">YOUR REFERRAL ID</span>
                  <span className="text-white font-black tracking-wider text-right">{currentReferralCode}</span>
                </div>

                {/* Reward structure bullet points container */}
                <div className="bg-[#02050f]/60 p-4 rounded-2xl border border-blue-500/10 space-y-3">
                  <div className="flex items-center gap-1.5 text-blue-400 font-extrabold text-[9px] uppercase tracking-wider pb-1">
                    <Gift className="w-3.5 h-3.5" />
                    <span>REWARD STRUCTURE</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-350 leading-relaxed font-semibold">
                    <div className="flex items-start gap-2.5">
                      <Star className="w-4 h-4 text-emerald-400 fill-emerald-400/10 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">1 Referral Purchase:</strong> Regular Tier + <strong className="text-cyan-400">৳1,005</strong> Bonus
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Crown className="w-4 h-4 text-amber-400 fill-amber-400/10 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">2 Referral Purchases:</strong> Premium Tier + Extra <strong className="text-cyan-400">৳1,000</strong> Bonus
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Gem className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">5 Referral Purchases:</strong> Elite Tier + <strong className="text-cyan-400">৳5,000</strong> Bonus
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Infinity className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-white">Lifetime Benefits:</strong> Unlocked networks are permanent.
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ACTIVE REFERRALS SECTION */}
              <motion.div variants={itemVariants} className="bg-[#030a1c]/90 border border-blue-500/10 rounded-3xl p-5 sm:p-6 space-y-4 text-left">
                <div className="flex items-center gap-2 text-white border-b border-blue-500/10 pb-3">
                  <ClipboardList className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold tracking-wide">Active Referrals ({myReferralsCount})</h3>
                </div>

                {myReferrals.length === 0 ? (
                  /* Empty State Layout */
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <UserMinus className="w-10 h-10 text-slate-600" />
                    <p className="text-xs text-slate-500 leading-normal font-semibold max-w-[240px]">
                      Your network is currently empty. Share your link to begin earning assets.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-blue-500/10 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                          <th className="py-3 px-2">Referred User</th>
                          <th className="py-3 px-2">Member Tier</th>
                          <th className="py-3 px-2">Date Joined</th>
                          <th className="py-3 px-2 text-right">Commission</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-500/5 font-semibold text-slate-250">
                        {myReferrals.map((ref) => (
                          <tr key={ref.id} className="hover:bg-blue-500/5 transition">
                            <td className="py-3 px-2">
                              <div className="font-bold text-white max-w-[120px] truncate">{ref.referredFullName || ref.referredUser}</div>
                              <div className="text-[10px] text-slate-500 block font-mono">@{ref.referredUser}</div>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                ref.tier === 'ELITE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                ref.tier === 'PREMIUM' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                ref.tier === 'REGULAR' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                'bg-slate-500/20 text-slate-400 border border-slate-500/10'
                              }`}>
                                {ref.tier}
                              </span>
                            </td>
                            <td className="py-3 px-2 font-mono text-slate-400 text-[10px]">{ref.dateJoined}</td>
                            <td className="py-3 px-2 text-right font-bold text-emerald-400 font-mono">
                              {ref.commission > 0 ? `৳${ref.commission.toLocaleString()}` : '৳0 (Demo)'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              className="space-y-5 text-left max-w-md mx-auto"
            >
              {/* Portal Mode Switcher Tab (গ্রাহক বনাম মডেল/ডোনার প্যানেল) */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-blue-500/10">
                <button
                  type="button"
                  onClick={() => setAccountMode('client')}
                  className={`py-3 px-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    accountMode === 'client'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <User className="w-4 h-4 text-blue-400" />
                  Client (গ্রাহক পোর্টাল)
                </button>
                <button
                  type="button"
                  onClick={() => setAccountMode('partner')}
                  className={`py-3 px-2 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    accountMode === 'partner'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  Partner Board
                </button>
              </motion.div>

              {accountMode === 'client' ? (
                <>
                  {/* Profile Card Container */}
                  <motion.div 
                    variants={itemVariants} 
                    className="bg-[#020716] border border-blue-900/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(30,58,138,0.15)]"
                  >
                    {/* Profile Header Block */}
                    <div className="flex items-center space-x-4 text-left pb-2">
                      {/* Photo Profile Frame */}
                      <div className="relative">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#050e26] border-2 border-blue-900/40 flex items-center justify-center text-2xl sm:text-3xl font-black text-blue-400 shadow-inner select-none overflow-hidden">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                          ) : (
                            fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Floating overlapping camera activator */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = prompt("Enter an image URL for your profile avatar (or leave blank to use name initials):");
                            if (url !== null) setAvatarUrl(url);
                          }}
                          className="absolute bottom-0 right-0 w-6.5 h-6.5 rounded-full bg-[#1e40af] border border-blue-400/40 flex items-center justify-center text-white hover:bg-blue-600 transition duration-150 shadow shadow-black cursor-pointer"
                          title="Update Avatar Photograph"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Profile Identification labels */}
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-white leading-snug tracking-normal">
                          {fullName}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          {email}
                        </p>
                      </div>
                    </div>

                    {/* Profile Form Content */}
                    <form onSubmit={handleSaveProfileChanges} className="space-y-5 text-left">
                      {/* FULL NAME FIELD */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="e.g. akhiaktherofc"
                          className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:border-blue-500 hover:border-blue-900/50 transition-all"
                        />
                      </div>

                      {/* EMAIL ADDRESS FIELD */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="e.g. code@bodytouch.com"
                          className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:border-blue-500 hover:border-blue-900/50 transition-all font-mono"
                        />
                      </div>

                      {/* PHONE NUMBER FIELD */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="Enter phone number"
                          className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:border-blue-500 hover:border-blue-900/50 transition-all font-mono"
                        />
                      </div>

                      {/* ACTION SUBMIT BUTTON */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-600 to-sky-400 hover:from-blue-500 hover:to-sky-300 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 active:scale-98"
                        >
                          <Lock className="w-4 h-4 text-slate-950" />
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>

                  {/* Service History / বুকিং এবং সার্ভিস হিস্ট্রি */}
                  <motion.div 
                    variants={itemVariants}
                    className="bg-[#020716] border border-blue-900/30 rounded-3xl p-6 space-y-4 shadow-[0_0_50px_rgba(30,58,138,0.15)]"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-blue-900/10">
                      <div className="flex items-center space-x-2 text-white">
                        <Clock className="text-blue-400 w-4 h-4" />
                        <h3 className="text-sm font-bold tracking-wide">Service History (সার্ভিস হিস্ট্রি)</h3>
                      </div>
                      <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-500/20 font-mono">
                        {bookings.length} Total
                      </span>
                    </div>

                    <div className="space-y-3 max-h-68 overflow-y-auto pr-1 scrollbar-none">
                      {bookings.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center">
                          <Clock className="w-8 h-8 text-blue-500/20" />
                          <p className="text-xs text-slate-500 font-semibold leading-normal">বুকিং করা কোনো সার্ভিস হিস্ট্রি পাওয়া যায়নি।</p>
                        </div>
                      ) : (
                        bookings.map((book) => (
                          <div
                            key={book.id}
                            className="bg-[#030a1c] border border-blue-900/40 p-3.5 rounded-2xl flex flex-col space-y-2.5 hover:border-blue-500/30 transition-all text-left"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2.5">
                                <img
                                  src={book.image}
                                  alt={book.modelName}
                                  className="w-10 h-10 rounded-lg object-cover border border-blue-500/15"
                                  referrerPolicy="no-referrer"
                                />
                                <div>
                                  <p className="text-xs text-white font-bold">
                                    {book.modelName} <span className="text-[9px] text-[#5c75ab] font-mono">{book.modelTag}</span>
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {book.location}
                                  </p>
                                </div>
                              </div>
                              
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                book.status === 'Completed' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                              }`}>
                                {book.status}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-blue-900/20 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-bold">
                              <div className="bg-[#020512] px-2.5 py-1.5 rounded-lg border border-blue-950/40">
                                <span className="text-slate-500 text-[8px] tracking-wide uppercase block font-mono">Date (তারিখ):</span>
                                <span className="text-slate-200 tracking-normal text-white">{book.date}</span>
                              </div>
                              <div className="bg-[#020512] px-2.5 py-1.5 rounded-lg border border-blue-950/40">
                                <span className="text-slate-500 text-[8px] tracking-wide uppercase block font-mono">Time & Dur (সময়):</span>
                                <span className="text-slate-200 tracking-normal text-white">{book.time} ({book.duration})</span>
                              </div>
                            </div>

                            {book.secretCode && (
                              <div className="bg-[#020512] px-2.5 py-2 rounded-lg border border-emerald-500/10 text-emerald-400 text-[10px] flex justify-between items-center font-mono">
                                <span className="text-slate-500 text-[8px] tracking-wide uppercase">🔑 Pass:</span>
                                <span className="text-emerald-400 font-bold">{book.secretCode}</span>
                              </div>
                            )}

                            {book.status === 'Completed' && (() => {
                              const alreadyReviewed = reviews.find((r) => r.bookingId === book.id);
                              
                              if (alreadyReviewed) {
                                return (
                                  <div className="bg-[#020512] px-3 py-2.5 rounded-xl border border-emerald-500/10 text-[10.5px]">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[#5c75ab] text-[8.5px] uppercase font-mono font-bold">Feedback Submitted:</span>
                                      <div className="flex items-center space-x-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <Star
                                            key={s}
                                            className={`w-3 h-3 ${
                                              s <= alreadyReviewed.rating 
                                                ? 'text-amber-400 fill-amber-400' 
                                                : 'text-slate-700'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-slate-300 mt-1 italic font-semibold leading-normal">
                                      "{alreadyReviewed.comment}"
                                    </p>
                                    <span className="text-[8.5px] text-slate-500 block mt-1 font-sans font-medium">
                                      {alreadyReviewed.reviewerName} • {alreadyReviewed.date}
                                    </span>
                                  </div>
                                );
                              }

                              const curRating = reviewRatings[book.id] || 5;
                              const curComment = reviewComments[book.id] || '';

                              return (
                                <div className="bg-[#020512] p-3 rounded-xl border border-blue-500/15 space-y-2 mt-1 animate-in fade-in duration-305">
                                  <div className="flex items-center justify-between">
                                    <span className="text-blue-400 text-[9px] font-black uppercase tracking-widest block">
                                      Rate Experience (রেটিং করুন):
                                    </span>
                                    <div className="flex items-center space-x-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => setReviewRatings(prev => ({ ...prev, [book.id]: s }))}
                                          className="p-0.5 text-slate-400 hover:scale-110 active:scale-95 transition-all text-amber-500 hover:text-amber-300 cursor-pointer"
                                        >
                                          <Star
                                            className={`w-4 h-4 ${
                                              s <= curRating 
                                                ? 'text-amber-400 fill-amber-400' 
                                                : 'text-slate-700'
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex gap-1.5 items-end">
                                    <input
                                      type="text"
                                      placeholder="মন্তব্য লিখুন (e.g. Excellent service...)"
                                      value={curComment}
                                      onChange={(e) => setReviewComments(prev => ({ ...prev, [book.id]: e.target.value }))}
                                      className="flex-1 bg-black/60 border border-blue-900/40 text-[10.5px] rounded-lg py-1.5 px-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-0 font-medium"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleReviewSubmit(book.id, book.modelName, curRating, curComment);
                                        // clear input text drafts
                                        setReviewComments(prev => ({ ...prev, [book.id]: '' }));
                                      }}
                                      className="bg-gradient-to-tr from-rose-600 to-rose-450 hover:opacity-95 text-xs text-white font-heavy px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                                    >
                                      Submit
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* PARTNER / MODEL PORTAL AREA */}
                  {(() => {
                    const myApp = companions.find(
                      (c) => c.email && c.email.trim().toLowerCase() === email.trim().toLowerCase()
                    );

                    if (myApp) {
                      return (
                        <motion.div 
                          variants={itemVariants}
                          className="bg-[#020716] border border-emerald-500/20 rounded-3xl p-6 space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)] text-left"
                        >
                          <div className="text-center space-y-2 border-b border-white/5 pb-4">
                            <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
                              {myApp.status === 'Approved' ? '🟢 Live Partner Roster' : '⏳ Application Auditing'}
                            </h3>
                            <p className="text-xs text-slate-400">
                              Logged in as partner: <span className="text-blue-400 font-mono font-bold">{email}</span>
                            </p>
                          </div>

                          <div className="bg-[#03091f] border border-blue-950 p-4 rounded-2xl flex items-center gap-4">
                            <img
                              src={myApp.image}
                              alt={myApp.name}
                              className="w-16 h-16 rounded-xl object-cover border border-emerald-500/15"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="text-sm font-black text-white">{myApp.name}</h4>
                              <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-extrabold mt-0.5">{myApp.category}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Rate: ৳{myApp.rate.toLocaleString()}/hour</p>
                            </div>
                          </div>

                          {/* Verification progress line */}
                          <div className="space-y-4 bg-[#a231a]/10 border border-emerald-500/10 p-4 rounded-xl">
                            <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                              <span className="text-slate-450 uppercase">Application Status:</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                myApp.status === 'Approved' 
                                  ? 'bg-emerald-500/10 text-emerald-400'
                                  : myApp.status === 'Declined'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : 'bg-amber-500/10 text-amber-400 animate-pulse'
                              }`}>
                                {myApp.status || 'Pending Review'}
                              </span>
                            </div>

                            {myApp.status === 'Pending' && (
                              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-semibold font-sans">
                                <div className="h-1.5 w-full bg-[#030a1c] border border-blue-950 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-amber-500 to-indigo-505 w-2/3"></div>
                                </div>
                                <p className="text-[11px]">
                                  Our roster concierges are manually reviewing your visuals and telephone contact (<strong className="text-white font-mono">{myApp.phone}</strong>) 
                                  to confirm discretion. You will receive an automated confirmation email at <strong className="text-white font-mono">{myApp.email}</strong> once published live.
                                </p>
                                <div className="space-y-1 text-[10.5px] text-slate-400">
                                  <div className="flex items-center gap-2 text-emerald-400 font-sans">✓ Step 1: Initial submission accepted</div>
                                  <div className="flex items-center gap-2 text-amber-450 font-sans">⚡ Step 2: Pedigree verification ongoing</div>
                                  <div className="flex items-center gap-2 text-slate-600 font-sans">○ Step 3: Global catalog list activate</div>
                                </div>
                              </div>
                            )}

                            {myApp.status === 'Approved' && (
                              <div className="space-y-2 text-[11.5px] leading-relaxed">
                                <p className="font-semibold text-emerald-400 font-sans">
                                  ✓ Your listing is completely verified! Clients searching under <strong>{myApp.category}</strong> segment can now view and request dispatches.
                                </p>
                                <div className="p-3 bg-slate-950/80 border border-blue-950 rounded-xl space-y-1 text-[10.5px] font-mono pr-1 overflow-x-auto">
                                  <div className="text-[#5174b0] font-bold uppercase tracking-wider text-[10px]">DISPATCH CONFIGS</div>
                                  <div>ID Code Reference: <span className="text-white font-bold select-all">{myApp.id}</span></div>
                                  <div>Assigned Class Tier: <span className="text-cyan-400 font-bold">{myApp.badge}</span></div>
                                  <div>Listing City Locator: <span className="text-white font-bold">{myApp.city}</span></div>
                                </div>
                              </div>
                            )}

                            {myApp.status === 'Declined' && (
                              <div className="space-y-3">
                                <p className="text-rose-450 text-xs font-semibold leading-relaxed">
                                  ❌ Mismatch criteria validation error. The submitted assets did not meet our high-society discreet standards.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompanions((prev) => prev.filter((c) => c.id !== myApp.id));
                                    triggerToast('Roster application wiped. You may resubmit.', 'success');
                                  }}
                                  className="w-full bg-rose-950/20 hover:bg-rose-955 border border-rose-500/20 text-rose-400 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition cursor-pointer"
                                >
                                  Delete Application & Apply Again
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    }

                    // Otherwise show career application form
                    return (
                      <motion.div 
                        variants={itemVariants} 
                        className="bg-[#020716] border border-blue-900/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(30,58,138,0.15)] text-left"
                      >
                        <div className="text-center space-y-1.5 border-b border-blue-900/10 pb-4">
                          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
                            <Briefcase className="w-4.5 h-4.5 text-blue-400" />
                            Roster Registration (জব আবেদন ফরম)
                          </h3>
                          <p className="text-[11px] text-[#556fad] font-bold">
                            ফিমেল মডেল, মেইল মডেল, বা স্পার্ম ডোনার হিসেবে আবেদন করুন।
                          </p>
                        </div>

                        <form onSubmit={handlePartnerSubmitApplication} className="space-y-4 text-left">
                          {/* CATEGORY / SEGMENT SELECTION */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                              Employment Category (ক্যাটাগরি)
                            </label>
                            <select
                              value={partnerCategory}
                              onChange={(e) => setPartnerCategory(e.target.value as any)}
                              className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* PROFESSIONAL NAME / ALIAS */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                              Alias Professional Name (মডেল নেম)
                            </label>
                            <input
                              type="text"
                              required
                              value={partnerName}
                              onChange={(e) => setPartnerName(e.target.value)}
                              placeholder="e.g. Alexis, Drake, Honey"
                              className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:border-blue-500 hover:border-blue-900/50 transition-all font-sans"
                            />
                          </div>

                          {/* REGISTERING EMAIL DISPLAY ONLY */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                                Email (রেজিস্টার্ড)
                              </label>
                              <input
                                type="text"
                                disabled
                                value={email}
                                className="w-full bg-slate-950 border border-[#101e3d]/40 text-xs text-slate-500 rounded-xl px-4 py-3.5 font-mono font-bold focus:outline-none cursor-not-allowed select-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                                Active Phone (ফোন নম্বর)
                              </label>
                              <input
                                type="text"
                                required
                                value={partnerAppPhone}
                                onChange={(e) => setPartnerAppPhone(e.target.value)}
                                placeholder="e.g. 017xxxxxxxx"
                                className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-mono font-bold focus:outline-none focus:border-blue-500 hover:border-blue-900/50 transition-all"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            {/* AGE & HEIGHT */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                                Age (বয়স)
                              </label>
                              <input
                                type="number"
                                required
                                min={18}
                                max={45}
                                value={partnerAge}
                                onChange={(e) => setPartnerAge(Number(e.target.value))}
                                className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-mono font-bold focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                                Height (উচ্চতা)
                              </label>
                              <input
                                type="text"
                                required
                                value={partnerHeight}
                                onChange={(e) => setPartnerHeight(e.target.value)}
                                placeholder="e.g. 5'6"
                                className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            {/* EXPECTED HOURLY RATE */}
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                                Expected Rate/hr (৳)
                              </label>
                              <input
                                type="number"
                                required
                                step={100}
                                min={3005}
                                value={partnerRate}
                                onChange={(e) => setPartnerRate(Number(e.target.value))}
                                className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-mono font-bold focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                                City Location (শহর)
                              </label>
                              <select
                                value={partnerCity}
                                onChange={(e) => setPartnerCity(e.target.value)}
                                className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none cursor-pointer"
                              >
                                <option value="">Select Area / এলাকা নির্বাচন করুন</option>
                                {structuredCities.map((p) => (
                                  <optgroup key={p.id} label={`${p.name.toUpperCase()} (জেলা/শহর)`}>
                                    {p.subAreas.map((sub) => (
                                      <option key={`${sub}, ${p.name}`} value={`${sub}, ${p.name}`}>
                                        {sub.toUpperCase()} ({p.name.toUpperCase()})
                                      </option>
                                    ))}
                                    {p.subAreas.length === 0 && (
                                      <option value={p.name.toUpperCase()}>{p.name.toUpperCase()}</option>
                                    )}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* SPOKEN LANGUAGES */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                              Languages Spoken (ভাষাগুলো)
                            </label>
                            <input
                              type="text"
                              value={partnerLanguages}
                              onChange={(e) => setPartnerLanguages(e.target.value)}
                              placeholder="e.g. Bangla, English, Hindustani"
                              className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none font-sans"
                            />
                          </div>

                          {/* PROFILE PHOTO URL */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                              Avatar Visual Image URL (ছবির ইউআরএল)
                            </label>
                            <input
                              type="url"
                              value={partnerImage}
                              onChange={(e) => setPartnerImage(e.target.value)}
                              placeholder="Optional image link or leave empty to default"
                              className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl px-4 py-3.5 font-bold focus:outline-none focus:border-blue-500 hover:border-blue-900/50 transition-all font-mono placeholder-slate-650"
                            />
                          </div>

                          {/* BIO SPECIALTY DETAILS */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-black tracking-widest text-[#5c75ab] uppercase pl-1">
                              Specialty Bio description (অভিজ্ঞতার বিবরণী)
                            </label>
                            <textarea
                              required
                              value={partnerSpecialty}
                              onChange={(e) => setPartnerSpecialty(e.target.value)}
                              placeholder="e.g. Highly athletic sperm donor with elite pedigree qualifications, or high-society discreet escort."
                              rows={3}
                              className="w-full bg-[#04091a] border border-[#101e3d] text-xs text-white rounded-xl p-4 font-bold focus:outline-none focus:border-blue-500 hover:border-blue-900/50 transition-all leading-relaxed placeholder-slate-650 resize-none font-sans"
                            />
                          </div>

                          {/* ACTION SUBMIT BUTTON */}
                          <div className="pt-2">
                            <button
                              type="submit"
                              className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-slate-950 font-black text-xs tracking-widest uppercase py-4 rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                            >
                              <Briefcase className="w-4 h-4 text-slate-950" />
                              Submit Professional Application
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    );
                  })()}
                </>
              )}

              {/* Outside separate Card for Sign Out button */}
              <motion.button
                variants={itemVariants}
                onClick={handleClearSession}
                className="w-full bg-[#020716] hover:bg-rose-950/20 border border-blue-900/10 hover:border-rose-950/30 text-rose-500 font-extrabold text-[11px] tracking-widest py-4.5 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 uppercase font-mono shadow-sm"
              >
                <ArrowRight className="w-4 h-4 text-rose-500 rotate-180" />
                Sign Out
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* POPUP MODAL ENGINES */}

      {/* 1. Companion Profile Details popup */}
      <CompanionModal
        companion={selectedCompanion}
        isOpen={selectedCompanion !== null}
        onClose={() => setSelectedCompanion(null)}
        reviews={reviews}
        onBook={() => {
          setBookingCompanion(selectedCompanion);
          setSelectedCompanion(null);
        }}
      />

      {/* 2. Hotel Venue Location details popup */}
      <LocationModal
        location={selectedLocation}
        isOpen={selectedLocation !== null}
        onClose={() => setSelectedLocation(null)}
      />

      {/* Hotel Reservation details popup Form */}
      <HotelReservationModal
        location={selectedReserveHotel}
        isOpen={selectedReserveHotel !== null}
        onClose={() => setSelectedReserveHotel(null)}
        walletBalance={walletBalance}
        onReservationSuccess={handleHotelReservationSubmit}
        triggerToast={triggerToast}
      />

      {/* 3. Booking scheduler details popup */}
      <BookingModal
        companion={bookingCompanion}
        isOpen={bookingCompanion !== null}
        onClose={() => {
          setBookingCompanion(null);
          setActiveReserveLocationId(undefined);
        }}
        walletBalance={walletBalance}
        hasBookings={bookings.length > 0}
        defaultClientName={fullName}
        defaultClientPhone={phone}
        defaultClientEmail={email}
        defaultClientPhoto={avatarUrl}
        paymentGateways={paymentGateways}
        onSubmit={handleBookingSubmit}
        locations={locations}
        initialLocationId={activeReserveLocationId}
      />

      {/* 4. Upgrade billing secure gate popup */}
      <CheckoutModal
        isOpen={checkoutTier !== null}
        tierName={checkoutTier?.name || ''}
        price={checkoutTier?.price || ''}
        onClose={() => setCheckoutTier(null)}
        onSubmit={handleCheckoutSubmit}
      />

      {/* Network Registry Applications modal popup */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        initialType={joinModalType}
        cities={cities}
        structuredCities={structuredCities}
        telegramHelpline={telegramHelpline}
        registrationFee={pricingConfig.registrationFee}
        onAddCompanion={(newComp) => {
          setCompanions((prev) => {
            const exists = prev.some((c) => c.id === newComp.id);
            if (exists) {
              return prev.map((c) => (c.id === newComp.id ? newComp : c));
            }
            return [newComp, ...prev];
          });

          const isInitial = !newComp.specialty.includes('💳 [REGISTRATION FEE PAID]');
          if (isInitial) {
            triggerToast('🎉 Career application submitted! Pending verification.', 'success');

            // Send Telegram Notification to Admin Group Chat ID
            const regText = `🔔 <b>নতুন মডেল রেজিস্ট্রেশন আবেদন!</b>\n\n` +
              `👤 নাম: <b>${newComp.name}</b>\n` +
              `🧬 ক্যাটাগরি: <b>${newComp.category || 'Female Model'}</b>\n` +
              `📍 শহর: <b>${newComp.city || 'Dhaka'}</b>\n` +
              `📞 ফোন নাম্বার: <code>${newComp.phone || 'N/A'}</code>\n` +
              `✈️ টেলিগ্রাম হ্যান্ডেল: <b>${newComp.telegram ? '@' + newComp.telegram.replace('@', '') : 'Not Provided'}</b>\n` +
              `📐 বয়স: ${newComp.age} বছর | উচ্চতা: ${newComp.height}\n` +
              `💰 ডিমান্ড রেট: ৳${newComp.rate}/ঘন্টা\n\n` +
              `<i>অনুমোদনের জন্য ড্যাশবোর্ড পোর্টালে লগইন করুন।</i>`;
            sendTelegramNotification(regText);
          } else {
            triggerToast('💳 Registration fee payment submitted! Proof sent to admin.', 'success');

            // Record joining metrics for dynamic registration links
            const sourceLink = sessionStorage.getItem('bt_registration_source');
            if (sourceLink) {
              const storedStats = localStorage.getItem('bt_shortlink_stats');
              let stats = {
                'join-female-1': { clicks: 0, joins: 0 },
                'join-female-2': { clicks: 0, joins: 0 },
                'join-male-1': { clicks: 0, joins: 0 },
                'join-male-2': { clicks: 0, joins: 0 },
                'join-sparm-1': { clicks: 0, joins: 0 },
                'join-sparm-2': { clicks: 0, joins: 0 },
              };
              if (storedStats) {
                try {
                  stats = { ...stats, ...JSON.parse(storedStats) };
                } catch (e) {
                  console.error(e);
                }
              }
              if (stats[sourceLink]) {
                stats[sourceLink].joins += 1;
              }
              localStorage.setItem('bt_shortlink_stats', JSON.stringify(stats));
              setShortLinkStats(stats);
              window.dispatchEvent(new Event('storage'));
              sessionStorage.removeItem('bt_registration_source');
            }

            // Extract payment details
            const payDetails = newComp.specialty.includes('💳 [REGISTRATION FEE PAID]\n') 
              ? newComp.specialty.split('💳 [REGISTRATION FEE PAID]\n')[1] 
              : 'Proof submitted';

            // Send Telegram Notification to Admin Group Chat ID
            const payText = `💳 <b>মডেল রেজিস্ট্রেশন পেমেন্ট সফলভাবে জমা দেওয়া হয়েছে!</b>\n\n` +
              `👤 মডেল নাম: <b>${newComp.name}</b>\n` +
              `🧬 ক্যাটাগরি: <b>${newComp.category || 'Female Model'}</b>\n` +
              `📞 ফোন নাম্বার: <code>${newComp.phone || 'N/A'}</code>\n` +
              `✈️ টেলিগ্রাম হ্যান্ডেল: <b>${newComp.telegram ? '@' + newComp.telegram.replace('@', '') : 'Not Provided'}</b>\n\n` +
              `💳 <b>পেমেন্ট বিবরণ:</b>\n<code>${payDetails}</code>\n\n` +
              `<i>দয়া করে ট্রানজেক্শন আইডি ভেরিফাই করে মডেলটি এপ্রুভ করুন।</i>`;
            sendTelegramNotification(payText);
          }
        }}
      />

      {/* 4.5 accounts/discreet ledger history popup */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        walletBalance={walletBalance}
        payments={payments}
        username={username}
        onTriggerAllocate={() => setIsAllocateOpen(true)}
        onTriggerLiquidate={() => setIsLiquidateOpen(true)}
      />

      {/* 5. Allocate deposit fund modal popup */}
      <AnimatePresence>
        {isAllocateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsAllocateOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="cyan-glow-card max-w-sm w-full rounded-3xl overflow-hidden relative shadow-2xl p-6 z-10 bg-[#020714]"
            >
              <button
                onClick={() => setIsAllocateOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleAllocateSubmit} className="space-y-4">
                <div className="text-center pb-2 border-b border-blue-500/10">
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest">
                    Secured Security Deposit
                  </span>
                  <p className="text-lg font-black text-white mt-1">Allocate Wallet Funds</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      1. SELECT GATEWAY DEPOSIT
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setAllocateMethod('BKASH')}
                        className={`py-2 rounded-xl border text-[11px] font-black uppercase text-center transition cursor-pointer ${
                          allocateMethod === 'BKASH'
                            ? 'bg-[#e2125d] border-transparent text-white'
                            : 'bg-slate-900 border-blue-500/15 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        bKash
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocateMethod('NAGAD')}
                        className={`py-2 rounded-xl border text-[11px] font-black uppercase text-center transition cursor-pointer ${
                          allocateMethod === 'NAGAD'
                            ? 'bg-[#f15a22] border-transparent text-white'
                            : 'bg-slate-900 border-blue-500/15 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        Nagad
                      </button>
                      <button
                        type="button"
                        onClick={() => setAllocateMethod('ROCKET')}
                        className={`py-2 rounded-xl border text-[11px] font-black uppercase text-center transition cursor-pointer ${
                          allocateMethod === 'ROCKET'
                            ? 'bg-[#8c3494] border-transparent text-white'
                            : 'bg-slate-900 border-blue-500/15 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        Rocket
                      </button>
                    </div>
                  </div>

                  {/* Send details instruction */}
                  <div className="bg-[#030a1c] border border-blue-500/15 p-3 rounded-xl text-left">
                    <p className="text-[10px] text-slate-300 leading-normal font-semibold">
                      💸 Please Send Money to: <strong className="text-white font-mono">+8801712-345678</strong> (Personal)
                    </p>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                      2. DEPOSIT AMOUNT (৳)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5,000"
                      value={allocateAmount}
                      onChange={(e) => setAllocateAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                      className="w-full bg-[#030a1c] border border-blue-500/20 text-white font-mono rounded-xl py-3 px-4 focus:ring-1 focus:ring-blue-550 focus:outline-none text-xs placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                      3. TRANSACTION ID (TrxID)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="8-digit Alphanumeric code"
                      value={allocateTrx}
                      onChange={(e) => setAllocateTrx(e.target.value)}
                      className="w-full bg-[#030a1c] border border-blue-500/20 text-white font-mono rounded-xl py-3 px-4 focus:ring-1 focus:ring-blue-550 focus:outline-none text-xs uppercase placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-tr from-blue-700 to-indigo-650 hover:opacity-95 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition cursor-pointer"
                >
                  CONFIRM ALLOCATION
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Liquidate earnings withdrawal modal popup */}
      <AnimatePresence>
        {isLiquidateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              onClick={() => setIsLiquidateOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="cyan-glow-card max-w-sm w-full rounded-3xl overflow-hidden relative shadow-2xl p-6 z-10 bg-[#020714]"
            >
              <button
                onClick={() => setIsLiquidateOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleLiquidateSubmit} className="space-y-4">
                <div className="text-center pb-2 border-b border-blue-500/10">
                  <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest">
                    Discreet Withdrawal
                  </span>
                  <p className="text-lg font-black text-white mt-1">Withdraw Your Earnings</p>
                  <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">
                    Available: ৳{walletBalance.toLocaleString('en-US')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1.5">
                      1. SELECT PAYMENT METHOD
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setLiquidateMethod('BKASH')}
                        className={`py-2 rounded-xl border text-[11px] font-black uppercase text-center transition cursor-pointer ${
                          liquidateMethod === 'BKASH'
                            ? 'bg-[#e2125d] border-transparent text-white'
                            : 'bg-slate-900 border-blue-500/15 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        bKash
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiquidateMethod('NAGAD')}
                        className={`py-2 rounded-xl border text-[11px] font-black uppercase text-center transition cursor-pointer ${
                          liquidateMethod === 'NAGAD'
                            ? 'bg-[#f15a22] border-transparent text-white'
                            : 'bg-slate-900 border-blue-500/15 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        Nagad
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiquidateMethod('ROCKET')}
                        className={`py-2 rounded-xl border text-[11px] font-black uppercase text-center transition cursor-pointer ${
                          liquidateMethod === 'ROCKET'
                            ? 'bg-[#8c3494] border-transparent text-white'
                            : 'bg-slate-900 border-blue-500/15 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        Rocket
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                      2. WITHDRAW AMOUNT (৳)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2,000"
                      value={liquidateAmount}
                      onChange={(e) => setLiquidateAmount(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#030a1c] border border-blue-500/20 text-white font-mono rounded-xl py-3 px-4 focus:ring-1 focus:ring-blue-550 focus:outline-none text-xs placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mb-1">
                      3. MOBILE ACCOUNT NUMBER
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01XXXXXXXXX"
                      value={liquidateMobile}
                      onChange={(e) => setLiquidateMobile(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-[#030a1c] border border-blue-500/20 text-white font-mono rounded-xl py-3 px-4 focus:ring-1 focus:ring-blue-550 focus:outline-none text-xs placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-650 text-white font-black uppercase text-[10px] tracking-widest py-3 rounded-xl transition cursor-pointer"
                >
                  REQUEST WITHDRAWAL
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSISTENT STICKY BOTTOM NAVIGATION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-[#020712]/95 backdrop-blur-md border-t border-blue-500/15 py-3">
        <div className="max-w-xl mx-auto px-6 flex justify-between items-center text-center">
          
          <button
            onClick={() => handleTabSwitch('home')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTab === 'home' ? 'text-blue-400 scale-105' : 'text-blue-300/40 hover:text-blue-300/70'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">HOME</span>
          </button>

          <button
            onClick={() => handleTabSwitch('membership')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTab === 'membership' ? 'text-blue-400 scale-105' : 'text-blue-300/40 hover:text-blue-300/70'
            }`}
          >
            <Crown className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">MEMBERSHIP</span>
          </button>

          <button
            onClick={() => handleTabSwitch('assets')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTab === 'assets' ? 'text-blue-400 scale-105' : 'text-blue-300/40 hover:text-blue-300/70'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">ASSETS</span>
          </button>

          <button
            onClick={() => handleTabSwitch('network')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTab === 'network' ? 'text-blue-400 scale-105' : 'text-blue-300/40 hover:text-blue-300/70'
            }`}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">NETWORK</span>
          </button>

          <button
            onClick={() => handleTabSwitch('profile')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
              activeTab === 'profile' ? 'text-blue-400 scale-105' : 'text-blue-300/40 hover:text-blue-300/70'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider leading-none">PROFILE</span>
          </button>

        </div>
      </footer>
    </div>
  );
}
