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
    
    // If it's already a full URL (Google OAuth), return as is
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    
    // If it starts with /uploads, it's already a full path
    if (user.avatar.startsWith('/uploads/')) {
      return `${API_URL}${user.avatar}`;
    }
    
    // Otherwise, construct the full URL
    return `${API_URL}/uploads/avatars/${user.avatar}`;
  };

  const avatarUrl = getAvatarUrl();
  const initials = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden bg-blue-500 text-white relative`}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.target.style.display = 'none';
              const fallback = e.target.parentElement.querySelector('.avatar-fallback');
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        {!avatarUrl && (
          <div
            className="avatar-fallback w-full h-full bg-blue-500 text-white flex items-center justify-center font-semibold absolute inset-0"
          >
            {initials}
          </div>
        )}
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

