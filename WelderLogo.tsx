import React from 'react';

interface WelderLogoProps {
  size?: number;
  className?: string;
}

export const WelderLogo: React.FC<WelderLogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="IronWeld Welder Emblem"
    >
      {/* Outer Industrial Hex Shield */}
      <path
        d="M32 3L57 17.5V46.5L32 61L7 46.5V17.5L32 3Z"
        fill="#0B1933"
        stroke="#2563EB"
        strokeWidth="2.5"
      />
      <path
        d="M32 7.5L53 19.7V44.3L32 56.5L11 44.3V19.7L32 7.5Z"
        fill="#071124"
        stroke="#1E3A66"
        strokeWidth="1.2"
      />

      {/* Welder Helmet Shell */}
      <path
        d="M20 23C20 16.5 25.4 12 32 12C38.6 12 44 16.5 44 23V35.5C44 41.2 38.8 46.5 32 48.5C25.2 46.5 20 41.2 20 35.5V23Z"
        fill="#13294E"
        stroke="#60A5FA"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Helmet Crest / Center Seam */}
      <path
        d="M32 12V20.5"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Auto-Darkening Welding Visor */}
      <rect
        x="23.5"
        y="22.5"
        width="17"
        height="8.5"
        rx="2"
        fill="#050C1A"
        stroke="#93C5FD"
        strokeWidth="1.6"
      />
      {/* Visor Reflection */}
      <path
        d="M25.5 28.5L29 24.5M30.5 28.5L32.5 26.2"
        stroke="#38BDF8"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />

      {/* Respirator / Lower Chin Vent */}
      <path
        d="M26.5 36.5H37.5M28 40H36"
        stroke="#60A5FA"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Welding Torch Spark Accent at Bottom Right */}
      <path
        d="M47 40L52 36.5M48.5 43.5L53.5 43.5M46.5 46.5L50.5 49.5"
        stroke="#FBBF24"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="45" cy="42.5" r="2" fill="#F59E0B" />
    </svg>
  );
};
