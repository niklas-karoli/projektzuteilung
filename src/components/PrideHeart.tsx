import React from 'react';

export const PrideHeart: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="prideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E40303" />
          <stop offset="16.6%" stopColor="#E40303" />
          <stop offset="16.6%" stopColor="#FF8C00" />
          <stop offset="33.3%" stopColor="#FF8C00" />
          <stop offset="33.3%" stopColor="#FFED00" />
          <stop offset="50%" stopColor="#FFED00" />
          <stop offset="50%" stopColor="#008026" />
          <stop offset="66.6%" stopColor="#008026" />
          <stop offset="66.6%" stopColor="#004DFF" />
          <stop offset="83.3%" stopColor="#004DFF" />
          <stop offset="83.3%" stopColor="#732982" />
          <stop offset="100%" stopColor="#732982" />
        </linearGradient>
      </defs>
      <path
        d="M16 28.5L14.5 27.1C9.2 22.3 5.7 19.1 5.7 15.2C5.7 12 8.2 9.5 11.4 9.5C13.2 9.5 14.9 10.3 16 11.7C17.1 10.3 18.8 9.5 20.6 9.5C23.8 9.5 26.3 12 26.3 15.2C26.3 19.1 22.8 22.3 17.5 27.2L16 28.5Z"
        fill="url(#prideGradient)"
      />
    </svg>
  );
};
