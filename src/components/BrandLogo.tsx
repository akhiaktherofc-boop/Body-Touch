import React from 'react';

// elegant vector SVG logo component
export const BRAND_LOGO_BASE64 = ''; // kept for backwards compatibility if needed

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const [customLogo, setCustomLogo] = React.useState<string | null>(() => {
    return localStorage.getItem('bt_custom_logo');
  });

  React.useEffect(() => {
    const handleLogoUpdate = () => {
      setCustomLogo(localStorage.getItem('bt_custom_logo'));
    };

    window.addEventListener('bt_logo_updated', handleLogoUpdate);
    window.addEventListener('storage', handleLogoUpdate);
    return () => {
      window.removeEventListener('bt_logo_updated', handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, []);

  // Map preset sizes or keep numerical dimension
  let dimClass = 'w-10 h-10';
  if (size === 'sm') dimClass = 'w-8 h-8';
  else if (size === 'md') dimClass = 'w-10 h-10';
  else if (size === 'lg') dimClass = 'w-14 h-14';
  
  const customStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : undefined;

  if (customLogo) {
    return (
      <div 
        style={customStyle}
        id="brand-logo"
        className={`rounded-full overflow-hidden border border-amber-500/50 bg-neutral-950 flex items-center justify-center shrink-0 shadow-lg shadow-black/50 ${customStyle ? '' : dimClass} ${className}`}
      >
        <img 
          src={customLogo} 
          alt="Brand Logo" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // If image fails to load, remove it or fallback
            console.error('Failed to load custom brand logo.');
          }}
        />
      </div>
    );
  }

  return (
    <div 
      style={customStyle}
      id="brand-logo"
      className={`rounded-full overflow-hidden border border-amber-500/30 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black flex items-center justify-center shrink-0 shadow-lg shadow-black/50 ${customStyle ? '' : dimClass} ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5"
      >
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" /> {/* amber-500 */}
            <stop offset="50%" stopColor="#D97706" /> {/* amber-600 */}
            <stop offset="100%" stopColor="#78350F" /> {/* amber-950 */}
          </linearGradient>
          <linearGradient id="glowGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FBBF24" opacity="0.15" /> {/* amber-400 */}
            <stop offset="100%" stopColor="#F59E0B" opacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient background glow inside the icon */}
        <circle cx="32" cy="32" r="26" fill="url(#glowGrad)" />

        {/* Outer dotted elegant rim line */}
        <circle 
          cx="32" 
          cy="32" 
          r="26" 
          stroke="url(#goldGrad)" 
          strokeWidth="1" 
          strokeDasharray="2 3" 
          opacity="0.4" 
        />

        {/* Stylized Interlocking elegant 'b' and 'T' luxury silhouette paths */}
        {/* Stem of b */}
        <path
          className="animate-pulse-slow"
          d="M 23 18 L 23 46"
          stroke="url(#goldGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        
        {/* Loop of b */}
        <path
          d="M 23 32 C 30 32, 36 34, 36 39 C 36 44, 30 46, 23 46"
          stroke="url(#goldGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Elegantly arched 'T' bar & stem overlapping */}
        <path
          d="M 23 21 C 30 21, 38 21, 41 21"
          stroke="url(#goldGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 37 21 C 37 27, 39 37, 45 42"
          stroke="url(#goldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner core jewel element */}
        <circle cx="32" cy="32" r="1.5" fill="#FBBF24" />
      </svg>
    </div>
  );
};
