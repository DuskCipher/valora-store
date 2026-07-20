import React from 'react';

interface ValoraLogoProps {
  size?: number;
  isDark?: boolean;
}

export const ValoraLogo: React.FC<ValoraLogoProps> = ({ size = 40, isDark = false }) => {
  const primaryColor = "#D42B2B"; // Red part
  const secondaryColor = "#1e293b"; // Handle and cursor (only used in light mode)

  return (
    <svg
      width={size}
      height={size}
      viewBox="-10 -10 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      {/* Bag Handle - Only visible in Light Mode */}
      {!isDark && (
        <path
          d="M35 30 C 35 15, 65 15, 65 30"
          stroke={secondaryColor}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      )}
      
      {/* Red Bag Body with Notch - Always visible */}
      <path
        d="M20 30 
           Q20 25 25 25 
           H75 
           Q80 25 80 30 
           L85 85 
           Q85 90 80 90 
           H55 
           Q45 90 45 80 
           V70 
           Q45 60 35 60 
           H25 
           Q20 60 20 50 
           Z"
        fill={primaryColor}
      />
      
      {/* Cursor Arrow - Only visible in Light Mode */}
      {!isDark && (
        <path
          d="M10 65 L35 55 L30 80 Z"
          fill={secondaryColor}
          stroke={secondaryColor}
          strokeWidth="4"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
};
