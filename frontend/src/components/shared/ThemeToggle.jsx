import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import Tooltip from './Tooltip';

const ThemeToggle = ({ className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Tooltip content={isDark ? 'Switch to light mode' : 'Switch to dark mode'} position="top">
      <button
        onClick={toggleTheme}
        className={`p-2.5 rounded-xl bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 flex items-center justify-center ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? (
          <FaSun className="w-5 h-5" />
        ) : (
          <FaMoon className="w-5 h-5" />
        )}
      </button>
    </Tooltip>
  );
};

export default ThemeToggle;

