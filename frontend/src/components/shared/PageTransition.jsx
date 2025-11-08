import React from 'react';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

const PageTransition = ({ children, className = '' }) => {
  return (
    <div
      className={`animate-fadeIn ${className}`}
    >
      {children}
    </div>
  );
};

// Stagger children animation using CSS
export const StaggerContainer = ({ children, className = '', staggerDelay = 0.1 }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`${className}`}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className="animate-slideUp"
          style={{
            animationDelay: `${index * staggerDelay}s`,
            animationFillMode: 'both',
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default PageTransition;

