import React from 'react';
import { FaUser } from 'react-icons/fa';
import { API_URL } from '../../utils/constants';

const Avatar = ({ user, size = 'md', className = '', showName = false }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Get avatar URL
  const getAvatarUrl = () => {
    if (!user?.avatar) return null;
    
    // If it's a base64 data URL (stored in database for serverless), return as is
    if (user.avatar.startsWith('data:')) {
      return user.avatar;
    }
    
    // If it's already a full URL (Google OAuth), return as is
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    
    // In production, if API_URL is set, use it (backend on different domain)
    // In development, use relative path (proxy handles it)
    const isProduction = import.meta.env.PROD;
    
    if (isProduction && API_URL) {
      // Production with separate backend - use full backend URL
      if (user.avatar.startsWith('/uploads/')) {
        return `${API_URL}${user.avatar}`;
      }
      return `${API_URL}/uploads/avatars/${user.avatar}`;
    }
    
    // Development or production on same domain - use relative path
    if (user.avatar.startsWith('/uploads/')) {
      return user.avatar;
    }
    return `/uploads/avatars/${user.avatar}`;
  };

  const avatarUrl = getAvatarUrl();
  const initials = user?.name?.charAt(0)?.toUpperCase() || '?';

  const [imageError, setImageError] = React.useState(false);

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden bg-blue-500 text-white relative`}>
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={user?.name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => {
              // Fallback to initials if image fails to load
              setImageError(true);
            }}
          />
        ) : null}
        <div
          className={`avatar-fallback w-full h-full bg-blue-500 text-white flex items-center justify-center font-semibold absolute inset-0 ${avatarUrl && !imageError ? 'hidden' : ''}`}
        >
          {initials}
        </div>
      </div>
      {showName && user?.name && (
        <p className="text-xs text-gray-600 mt-1 text-center truncate max-w-full">
          {user.name}
        </p>
      )}
    </div>
  );
};

export default Avatar;

