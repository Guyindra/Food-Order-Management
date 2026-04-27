import React from 'react';

export const Badge = ({ children, color = 'blue' }: { children: React.ReactNode, color?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-brand-teal text-white',
    yellow: 'bg-brand-yellow text-white',
    red: 'bg-red-500 text-white',
    orange: 'bg-brand-orange text-white',
    teal: 'bg-brand-teal text-white',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${colors[color]}`}>
      {children}
    </span>
  );
};
