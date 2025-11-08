// Animation utilities for micro-interactions

export const fadeIn = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

export const slideUp = {
  from: { transform: 'translateY(20px)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
};

export const slideDown = {
  from: { transform: 'translateY(-20px)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
};

export const scaleIn = {
  from: { transform: 'scale(0.95)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
};

export const bounce = {
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: 'translateY(-10px)' },
};

// Stagger animation delays
export const getStaggerDelay = (index, baseDelay = 0.1) => ({
  animationDelay: `${index * baseDelay}s`,
  animationFillMode: 'both',
});

// Hover effects
export const hoverLift = 'hover:-translate-y-1 hover:shadow-lg transition-all duration-300';
export const hoverScale = 'hover:scale-105 transition-transform duration-300';
export const hoverGlow = 'hover:shadow-strong transition-shadow duration-300';

