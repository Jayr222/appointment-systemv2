import React from 'react';
import Skeleton from './Skeleton';

const Loader = ({ message = 'Loading...', variant = 'spinner', size = 'md' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  if (variant === 'skeleton') {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-4xl space-y-4">
          <Skeleton variant="rectangular" height="200px" rounded="xl" />
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="80%" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className={`inline-block animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 ${sizes[size]}`}></div>
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default Loader;

