import React, { useState, useEffect } from 'react';

export interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  theme?: 'blue' | 'gold' | 'dark-blue';
}

export function guessCountryCode(): string {
  // 1. Try timezone detection
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      const tzMap: Record<string, string> = {
        'Asia/Dhaka': 'BD',
        'Asia/Kolkata': 'IN',
        'Asia/Calcutta': 'IN',
        'Asia/Riyadh': 'SA',
        'Asia/Kuala_Lumpur': 'MY',
        'Asia/Singapore': 'SG',
        'Asia/Dubai': 'AE',
        'Asia/Karachi': 'PK',
        'Asia/Colombo': 'LK',
        'Asia/Katmandu': 'NP',
        'Asia/Kathmandu': 'NP',
        'Asia/Bangkok': 'TH',
        'Asia/Jakarta': 'ID',
        'Asia/Saigon': 'VN',
        'Asia/Ho_Chi_Minh': 'VN',
        'Asia/Tokyo': 'JP',
        'Europe/London': 'GB',
        'Europe/Paris': 'FR',
        'Europe/Rome': 'IT',
        'Europe/Berlin': 'DE',
        'Europe/Moscow': 'RU',
        'Pacific/Auckland': 'NZ',
        'Africa/Johannesburg': 'ZA',
        'America/New_York': 'US',
        'America/Chicago': 'US',
        'America/Denver': 'US',
        'America/Los_Angeles': 'US',
        'America/Toronto': 'CA',
        'America/Vancouver': 'CA',
        'Australia/Sydney': 'AU',
        'Australia/Melbourne': 'AU',
        'Australia/Brisbane': 'AU',
        'Australia/Adelaide': 'AU',
        'Australia/Perth': 'AU',
        'America/Sao_Paulo': 'BR',
        'Europe/Istanbul': 'TR',
      };
      if (tzMap[tz]) return tzMap[tz];
      
      if (tz.startsWith('Europe/')) return 'GB';
      if (tz.startsWith('America/')) return 'US';
      if (tz.startsWith('Asia/')) return 'BD'; // fallback to BD for our core demographic
    }
  } catch (e) {
    // Ignore error
  }

  // 2. Try browser language detection
  try {
    const langs = navigator.languages || [navigator.language];
    for (const lang of langs) {
      const lower = lang.toLowerCase();
      if (lower.includes('bn')) return 'BD';
      if (lower.includes('in') || lower.includes('hi')) return 'IN';
      if (lower.includes('my')) return 'MY';
      if (lower.includes('sg')) return 'SG';
      if (lower.includes('ae')) return 'AE';
      if (lower.includes('sa')) return 'SA';
      if (lower.includes('pk')) return 'PK';
      if (lower.includes('np')) return 'NP';
      if (lower.includes('lk')) return 'LK';
      if (lower.includes('us')) return 'US';
      if (lower.includes('gb') || lower.includes('uk')) return 'GB';
      if (lower.includes('ca')) return 'CA';
      if (lower.includes('au')) return 'AU';
    }
  } catch (e) {
    // Ignore error
  }

  return 'BD'; // Default to BD for this application's context
}

export default function CountryPhoneInput({
  value = '',
  onChange,
  placeholder = 'Enter mobile number',
  className = '',
  required = false,
  theme = 'blue'
}: CountryPhoneInputProps) {
  const [selectedDial, setSelectedDial] = useState(() => {
    // Initialize synchronously with timezone/locale guess
    const guessedCode = guessCountryCode();
    const matched = COUNTRIES.find(c => c.code === guessedCode);
    return matched ? matched.dialCode : '+880';
  });
  const [localNum, setLocalNum] = useState('');

  // Auto-detect precise country code from fast IP geolocation APIs on mount
  useEffect(() => {
    let active = true;
    if (value) return; // Do not overwrite if we already have a parent-provided value

    async function detectIPCountry() {
      try {
        // Try ultra-fast cors-enabled country.is endpoint
        const res = await fetch('https://api.country.is');
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data && data.country) {
            const matched = COUNTRIES.find(c => c.code === data.country);
            if (matched) {
              setSelectedDial(matched.dialCode);
              // Trigger onChange with default empty number or existing local state
              onChange(matched.dialCode + localNum.trim());
              return;
            }
          }
        }
      } catch (e) {
        // ignore and try backup
      }

      try {
        // Try ipapi.co fallback
        const res = await fetch('https://ipapi.co/json/');
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (data && data.country_code) {
            const matched = COUNTRIES.find(c => c.code === data.country_code);
            if (matched) {
              setSelectedDial(matched.dialCode);
              onChange(matched.dialCode + localNum.trim());
            }
          }
        }
      } catch (e) {
        // ignore fallback
      }
    }

    detectIPCountry();

    return () => {
      active = false;
    };
  }, []);

  // Sync incoming value
  useEffect(() => {
    if (!value) {
      setLocalNum('');
      return;
    }

    // Attempt to match dialCode from longest to shortest
    const sortedCountries = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    let matched = false;

    for (const c of sortedCountries) {
      if (value.startsWith(c.dialCode)) {
        setSelectedDial(c.dialCode);
        setLocalNum(value.substring(c.dialCode.length));
        matched = true;
        break;
      }
    }

    if (!matched) {
      if (value.startsWith('+')) {
        setLocalNum(value);
      } else {
        // Assume default code is what is currently selected, and rest is local
        setLocalNum(value);
      }
    }
  }, [value]);

  const handleDialChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDial = e.target.value;
    setSelectedDial(newDial);
    onChange(newDial + localNum.trim());
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and common symbols like space, dash, parenthesis
    const input = e.target.value.replace(/[^0-9\- ()]/g, '');
    setLocalNum(input);
    onChange(selectedDial + input.trim());
  };

  const selectedCountry = COUNTRIES.find(c => c.dialCode === selectedDial) || COUNTRIES[0];

  // Map theme values
  let selectClass = 'bg-[#030818]/60 border border-cyan-900/30 text-white focus-within:border-cyan-400';
  let inputClass = 'bg-[#030818]/60 border border-cyan-900/30 focus:border-cyan-400 text-white placeholder:text-slate-600';
  
  if (theme === 'gold') {
    selectClass = 'bg-[#0e101a] border border-[#dbaa61]/35 text-[#f3ecdb] focus-within:border-[#dbaa61]';
    inputClass = 'bg-[#0e101a] border border-[#dbaa61]/35 focus:border-[#dbaa61] text-[#f3ecdb] placeholder:text-slate-500';
  } else if (theme === 'dark-blue') {
    selectClass = 'bg-black/40 border border-blue-500/20 text-white focus-within:border-blue-400';
    inputClass = 'bg-black/40 border border-blue-500/20 focus:border-blue-400 text-white placeholder:text-slate-700';
  }

  return (
    <div className={`flex items-center gap-2 w-full ${className}`}>
      {/* Styled Country Code/Flag Dropdown Selector */}
      <div className="relative shrink-0 select-none">
        <div className={`flex items-center gap-1 font-mono font-bold text-sm rounded-xl px-3 py-3.5 min-w-[90px] justify-between cursor-pointer transition-all ${selectClass}`}>
          <span>{selectedCountry.flag}</span>
          <span className="text-xs ml-1">{selectedDial}</span>
        </div>
        <select
          value={selectedDial}
          onChange={handleDialChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer bg-slate-950 text-white font-mono"
        >
          {COUNTRIES.map((c) => (
            <option key={`${c.code}-${c.dialCode}`} value={c.dialCode} className="bg-slate-950 text-white font-mono">
              {c.flag} {c.name} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* Actual Local Number Entry Field */}
      <input
        type="tel"
        required={required}
        value={localNum}
        onChange={handleLocalNumberChange}
        placeholder={placeholder}
        className={`w-full text-sm rounded-xl px-4 py-3.5 font-bold focus:outline-none transition-all font-mono ${inputClass}`}
      />
    </div>
  );
}
