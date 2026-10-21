import React, { useState } from 'react';

export default function UserAvatar({
  user,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  const rawAvatar = user?.avatar || user?.photoURL || '';
  const isUrl = typeof rawAvatar === 'string' && (rawAvatar.startsWith('http://') || rawAvatar.startsWith('https://'));
  const name = user?.fullName || user?.displayName || user?.full_name || user?.email?.split('@')[0] || 'Player';
  const initial = (name.trim()[0] || 'P').toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-14 h-14 text-xl rounded-2xl',
    xl: 'w-20 h-20 text-3xl rounded-3xl',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  if (isUrl && !imgError) {
    return (
      <div className={`relative shrink-0 overflow-hidden bg-violet-900/40 border border-white/10 shadow-md ${currentSizeClass} ${className}`}>
        <img
          src={rawAvatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-inherit"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // If it's a short emoji (1 or 2 chars, or not a URL)
  if (rawAvatar && !isUrl && rawAvatar.length <= 4) {
    return (
      <div className={`shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20 border border-white/10 ${currentSizeClass} ${className}`}>
        <span className="leading-none">{rawAvatar}</span>
      </div>
    );
  }

  // Fallback: Vibrant Gradient with User's Initial
  return (
    <div className={`shrink-0 overflow-hidden flex items-center justify-center bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 text-white font-black shadow-lg shadow-violet-500/25 border border-white/10 ${currentSizeClass} ${className}`}>
      <span className="leading-none">{initial}</span>
    </div>
  );
}
