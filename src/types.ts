export type MemberLevel = 'FREE' | 'REGULAR' | 'PREMIUM' | 'ELITE';

export interface Companion {
  id: string;
  name: string;
  tag: string;
  badge: 'DEMO' | 'REGULAR' | 'PREMIUM' | 'ELITE';
  image: string;
  age: number;
  height: string;
  bodyColor?: string; // Body color / Skin tone / Complexion
  weight?: string;    // Weight
  bust?: string;      // Bust/Chest measurement
  waist?: string;     // Waist size
  hip?: string;       // Hip size
  languages: string[];
  specialty: string;
  rate: number; // Taka per hr
  rateReal?: number;         // Custom base rate for Real service
  rateCam?: number;          // Custom base rate for Cam service
  rateMakeOut?: number;      // Custom base rate for Make out service
  rateLiveTogether?: number;  // Custom base rate for Live together service
  city?: string;
  category?: string;
  status?: 'Pending' | 'Approved' | 'Declined';
  email?: string;
  phone?: string;
  bloodGroup?: string;
  spermCount?: string;
  nidFront?: string;
  nidBack?: string;
  selfie?: string;
  telegram?: string;
}

export interface HotelLocation {
  id: string;
  name: string;
  star: string;
  location: string;
  image: string;
  description: string;
  price: number;
  mapEmbedUrl?: string;
  
  // NEW fields for client-accessible details
  distance?: string;          // e.g. "17.1 km from city center"
  address?: string;           // e.g. "House # 2/A, Sector #04 Uttara, Dhaka"
  checkInTime?: string;       // e.g. "02:00 PM"
  checkOutTime?: string;      // e.g. "11:00 AM"
  highlightedFacilities?: string; // Comma-separated list of premium benefits
  
  // Room Type Option 1
  room1Name?: string;         // e.g. "Premium Deluxe Twin"
  room1BedType?: string;      // e.g. "TWIN x 2"
  room1Capacity?: string;     // e.g. "Adult x 2, Child x 2"
  room1ViewType?: string;     // e.g. "City View"
  room1Area?: string;         // e.g. "18 sqm"
  room1Facilities?: string;   // e.g. "Breakfast Included, Non-Smoking"
  room1Price?: number;        // Price overrides if selected
  
  // Room Type Option 2
  room2Name?: string;         // e.g. "Executive Suite"
  room2BedType?: string;      // e.g. "KING x 1"
  room2Capacity?: string;     // e.g. "Adult x 2, Child x 2"
  room2ViewType?: string;     // e.g. "Skyline/Pool View"
  room2Area?: string;         // e.g. "25 sqm"
  room2Facilities?: string;   // e.g. "Breakfast Included, Gym Access"
  room2Price?: number;        // Price overrides if selected
}

export interface Booking {
  id: string;
  modelName: string;
  modelTag: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  image: string;
  status: 'Awaiting Dispatch' | 'Dispatched' | 'Outgoing' | 'Completed' | 'Approved' | 'Declined';
  notes?: string;
  secretCode?: string;
  firstTimeBooking?: boolean;
  userPhoto?: string;
  nidFront?: string;
  nidBack?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  cost?: number;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Failed';
}

export interface PaymentRecord {
  id: string;
  username: string;
  tierName: string;
  price: string;
  method: string; // Changed from 'BKASH' | 'NAGAD' | 'ROCKET' | 'System Init' to string for dynamic support
  trxId: string;
  status: 'Pending Verification' | 'Approved' | 'Rejected';
  date: string;
}

export interface PaymentGateway {
  id: string;
  name: string; // Display name e.g. "bKash Personal"
  method: 'BKASH' | 'NAGAD' | 'ROCKET' | string; // Type of backend system/branding
  walletType: 'Personal' | 'Agent' | 'Merchant'; // Account TierType
  number: string; // Gateway Phone Number
  instructions: string; // Custom Dynamic instructions shown during pay step
  isActive: boolean; // active display flag
}


export interface Review {
  id: string;
  bookingId: string;
  companionName: string;
  rating: number; // 1 to 5
  comment: string;
  reviewerName: string;
  date: string;
}

export interface ParentArea {
  id: string;
  name: string;      // e.g. "Dhaka"
  subAreas: string[]; // e.g. ["Gulshan", "Banani", "Uttara"]
}

export interface ReferralRecord {
  id: string;
  referredUser: string;     // The person who registered
  referredFullName?: string; 
  referredPhone?: string;
  referredEmail?: string;
  referrer: string;         // The person whose link was used
  dateJoined: string;       // Date Joined
  tier: MemberLevel;        // Free, Regular, Premium, Elite
  commission: number;       // Taka earned
}

export interface WithdrawalRecord {
  id: string;
  username: string;
  fullName?: string;
  amount: number;
  method: string;          // bKash, Nagad, etc.
  accountNumber: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

