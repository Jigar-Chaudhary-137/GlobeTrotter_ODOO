import React from 'react';
import { Loader2 } from 'lucide-react';

const Loader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size] || 'w-8 h-8';

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses} text-primary animate-spin`} />
    </div>
  );
};

export const FullScreenLoader = () => (
  <div className="fixed inset-0 z-50 bg-bg-warm flex flex-col items-center justify-center gap-3">
    <Loader size="lg" />
    <span className="font-display font-medium text-stone-600 animate-pulse text-sm">Loading GlobeTrotter...</span>
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-surface border border-stone-200/80 rounded-2xl p-5 shadow-xs animate-pulse">
    <div className="w-full h-40 bg-stone-200 rounded-xl mb-4" />
    <div className="h-5 bg-stone-200 rounded-md w-2/3 mb-2" />
    <div className="h-4 bg-stone-200 rounded-md w-1/2 mb-4" />
    <div className="flex items-center justify-between">
      <div className="h-4 bg-stone-200 rounded-md w-1/4" />
      <div className="h-8 bg-stone-200 rounded-md w-1/4" />
    </div>
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    {[1, 2, 3].map((n) => (
      <div key={n} className="flex items-center gap-4 bg-surface border border-stone-200 rounded-xl p-4">
        <div className="w-12 h-12 bg-stone-200 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-stone-200 rounded-md w-1/3" />
          <div className="h-3 bg-stone-200 rounded-md w-1/2" />
        </div>
        <div className="w-16 h-8 bg-stone-200 rounded-lg shrink-0" />
      </div>
    ))}
  </div>
);

export default Loader;
