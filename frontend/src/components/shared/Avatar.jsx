import React from 'react';
import { FaUser } from 'react-icons/fa';
import { API_URL, API_BASE_URL } from '../../utils/constants';

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
    
    // If it's a base64 data URL (stored in database), return as is
    if (user.avatar.startsWith('data:')) {
      return user.avatar;
    }
    
    // If it's already a full URL (Google OAuth or external), return as is
    if (user.avatar.startsWith('http://') || user.avatar.startsWith('https://')) {
      return user.avatar;
    }
    
    // If it's a GridFS URL (MongoDB storage) - /api/storage/avatars/:fileId
    if (user.avatar.startsWith('/api/storage/')) {
      const isProduction = import.meta.env.PROD;
      if (isProduction && API_URL) {
        // Production with separate backend - API_URL is the base backend URL (without /api)
        // Avatar path is /api/storage/avatars/:fileId, so prepend the base URL
        const fullUrl = `${API_URL}${user.avatar}`;
        console.log('🖼️ Constructed GridFS avatar URL:', fullUrl);
        return fullUrl;
      }
      // Use API_BASE_URL if available (includes /api)
      if (API_BASE_URL && API_BASE_URL !== '/api') {
        // API_BASE_URL is like https://backend.com/api, avatar path is /api/storage/...
        // So we need to replace /api with the base
        const baseWithoutApi = API_BASE_URL.replace('/api', '');
        return `${baseWithoutApi}${user.avatar}`;
      }
      // Development or same domain - use relative path
      return user.avatar;
    }
    
    // Legacy local filesystem paths - /uploads/avatars/:filename
    const isProduction = import.meta.env.PROD;
    
    if (isProduction && API_URL) {
      // Production with separate backend - use full backend URL
      // API_URL is the base backend URL (without /api)
      if (user.avatar.startsWith('/uploads/')) {
        return `${API_URL}${user.avatar}`;
      }
      // Just filename, construct full path
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

  // Debug logging in development
  React.useEffect(() => {
    if (import.meta.env.DEV && user?.avatar) {
      console.log('🖼️ Avatar component:', {
        avatar: user.avatar,
        constructedUrl: avatarUrl,
        apiUrl: API_URL,
        apiBaseUrl: API_BASE_URL,
        isProduction: import.meta.env.PROD
      });
    }
  }, [user?.avatar, avatarUrl]);

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden bg-blue-500 text-white relative`}>
        {avatarUrl && !imageError ? (
          <img
            src={avatarUrl}
            alt={user?.name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              console.error('❌ Avatar image failed to load:', {
                avatar: user?.avatar,
                constructedUrl: avatarUrl,
                error: e,
                apiUrl: API_URL,
                apiBaseUrl: API_BASE_URL
              });
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

