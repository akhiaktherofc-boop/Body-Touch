import { Companion, HotelLocation } from './types';

export const COMPANIONS: Companion[] = [
  {
    id: 'titli',
    name: 'Titli',
    tag: '# 550800',
    badge: 'DEMO',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600',
    age: 22,
    height: "5'5\"",
    languages: ['English', 'Bengali'],
    specialty: 'High-Society Dinings & Executive Escapes',
    rate: 8000,
    city: 'Dhaka'
  },
  {
    id: 'fatiha',
    name: 'Fatiha',
    tag: '# 550963',
    badge: 'DEMO',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600',
    age: 23,
    height: "5'6\"",
    languages: ['English', 'Bengali', 'Hindi'],
    specialty: 'Discreet In-Room Wellness & Aromatherapy',
    rate: 10000,
    city: 'Chittagong'
  },
  {
    id: 'ratri',
    name: 'Ratri',
    tag: '# 550856',
    badge: 'DEMO',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600',
    age: 21,
    height: "5'4\"",
    languages: ['English', 'Bengali'],
    specialty: 'Private Luxury Cruise & Yacht Companion',
    rate: 7500,
    city: 'Dhaka'
  },
  {
    id: 'nishat',
    name: 'Nishat',
    tag: '# 550125',
    badge: 'REGULAR',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600',
    age: 22,
    height: "5'4\"",
    languages: ['English', 'Bengali'],
    specialty: 'Soothing Musical Gatherings & Fine Arts Companion',
    rate: 9000,
    city: 'Chittagong'
  },
  {
    id: 'nourin',
    name: 'Nourin',
    tag: '# 550100',
    badge: 'REGULAR',
    image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=600',
    age: 23,
    height: "5'6\"",
    languages: ['English', 'Bengali'],
    specialty: 'High-Society Diners & Corporate Gala Hostess',
    rate: 9500,
    city: 'Dhaka'
  },
  {
    id: 'zara',
    name: 'Zara',
    tag: '# 550499',
    badge: 'REGULAR',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    age: 22,
    height: "5'5\"",
    languages: ['English', 'Bengali', 'Hindi'],
    specialty: 'High-Profile Red-Carpet Gala Socialite',
    rate: 13000,
    city: 'Chittagong'
  },
  {
    id: 'maya',
    name: 'Maya',
    tag: '# 550711',
    badge: 'PREMIUM',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    age: 24,
    height: "5'7\"",
    languages: ['English', 'Bengali', 'French'],
    specialty: 'International Business Banquets & Gala Escort',
    rate: 15000,
    city: 'Dhaka'
  },
  {
    id: 'nila',
    name: 'Nila',
    tag: '# 550604',
    badge: 'ELITE',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    age: 25,
    height: "5'8\"",
    languages: ['English', 'Bengali', 'Japanese'],
    specialty: 'Private Aviation Luxury Host & VIP Summit Liaison',
    rate: 20000,
    city: 'Dhaka',
    category: 'Female Model'
  },
  // MALE MODELS SEEDS
  {
    id: 'ayan',
    name: 'Ayan',
    tag: '# 770110',
    badge: 'REGULAR',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600',
    age: 25,
    height: "5'11\"",
    languages: ['English', 'Bengali'],
    specialty: 'Fitness Modeling, Grooming, and Executive Dinner Escort',
    rate: 6000,
    city: 'Dhaka',
    category: 'Male Model'
  },
  {
    id: 'zubair',
    name: 'Zubair',
    tag: '# 770240',
    badge: 'PREMIUM',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600',
    age: 26,
    height: "6'0\"",
    languages: ['English', 'Bengali', 'Hindi'],
    specialty: 'High-Fashion Liaison & Premium Secluded Corporate Gala Host',
    rate: 9000,
    city: 'Dhaka',
    category: 'Male Model'
  },
  // SPERM DONORS SEEDS
  {
    id: 'dr-mashiat',
    name: 'Dr. Mashiat',
    tag: '# 990112',
    badge: 'ELITE',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600',
    age: 28,
    height: "5'10\"",
    languages: ['English', 'Bengali'],
    specialty: 'Dhaka Medical College Graduate, Golden pedigree, high IQ, healthy family history',
    rate: 25000,
    city: 'Dhaka',
    category: 'Sperm Donor',
    bloodGroup: 'O+ (Positive)',
    spermCount: '92 Million/ml (High Motility)'
  },
  {
    id: 'engr-tanvir',
    name: 'Engr. Tanvir',
    tag: '# 990234',
    badge: 'PREMIUM',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
    age: 27,
    height: "5'9\"",
    languages: ['English', 'Bengali'],
    specialty: 'BUET Software Engineer, high cognitive IQ testing (142), non-smoker, athletic medical tests cleared',
    rate: 18000,
    city: 'Chittagong',
    category: 'Sperm Donor',
    bloodGroup: 'A+ (Positive)',
    spermCount: '87 Million/ml (Excellent)'
  }
];

export const LOCATIONS: HotelLocation[] = [
  {
    id: 'le-meridien',
    name: 'Le Méridien Dhaka',
    star: '5 STAR',
    location: 'Dhaka',
    price: 9500,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600',
    description: 'Highly secure VIP checkout gates, premium luxury lounges, and complete anonymous elevator authentication systems.'
  },
  {
    id: 'the-westin',
    name: 'The Westin Dhaka',
    star: '5 STAR',
    location: 'Dhaka',
    price: 11000,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
    description: 'Top-level premium penthouse spaces with high acoustic protection. Ideal for confidential business banquets and escapes.'
  },
  {
    id: 'gulshan-secret',
    name: 'Gulshan Secret Suite (Safe House)',
    star: 'VIP SAFE HOUSE',
    location: 'Dhaka',
    price: 5000,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=600',
    description: 'Completely private discrete bodyTOUCH cozy flat sanctuary at the heart of Gulshan. Ultimate confidentiality, shielded with high-grade gated access protocols.'
  },
  {
    id: 'banani-cyber',
    name: 'Banani Cyber Penthouse (Safe House)',
    star: 'VIP SAFE HOUSE',
    location: 'Dhaka',
    price: 5500,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=600',
    description: 'Ultra-modern safe house penthouse setup in Banani. Panoramic city skyline view, private lift key card, and absolute electronic isolation.'
  },
  {
    id: 'radisson',
    name: 'Radisson Blu Bay View',
    star: '5 STAR',
    location: 'Chittagong',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=600',
    description: 'Secluded luxury rooms with stunning coastal breeze. Strict guest-only authentication protocols to ensure zero disclosure.'
  }
];
