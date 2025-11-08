import React from 'react';

const Skeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '',
  rounded = 'md',
  animate = true 
}) => {
  const baseClasses = `bg-gray-200 ${animate ? 'animate-pulse' : ''} ${className}`;
  
  const variants = {
    text: `h-4 ${baseClasses}`,
    circular: `rounded-full ${baseClasses}`,
    rectangular: baseClasses,
    card: `h-48 ${baseClasses}`,
    avatar: `rounded-full h-12 w-12 ${baseClasses}`,
    button: `h-10 ${baseClasses}`,
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'avatar' ? '3rem' : undefined),
  };

  return (
    <div
      className={`${variants[variant] || variants.text} ${roundedClasses[rounded]}`}
      style={style}
      aria-label="Loading..."
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Preset skeleton components
export const SkeletonCard = () => (
  <div className="card animate-pulse">
    <Skeleton variant="rectangular" height="200px" rounded="xl" className="mb-4" />
    <Skeleton variant="text" width="80%" className="mb-2" />
    <Skeleton variant="text" width="60%" />
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} variant="text" width="100%" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ items = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;

