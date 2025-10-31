import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jfif';

const AppBar = () => {
  return (
    <nav className="relative shadow-md fixed top-0 left-0 right-0 z-50 h-20">
      {/* Two-tone background with curved divider */}
      <div className="absolute inset-0 flex">
        {/* Left section - Light Green */}
        <div className="bg-green-100 flex-1" style={{ flex: '2' }}>
          <div className="h-full flex items-center px-6 lg:px-8">
            <Link to="/login" className="flex items-center space-x-4">
              {/* Logo */}
              <div className="relative">
                <img 
                  src={logo} 
                  alt="Sun Valley Mega Health Center Logo" 
                  className="w-14 h-14 object-contain"
                  style={{ 
                    mixBlendMode: 'multiply',
                    filter: 'contrast(1.2) brightness(1.1)',
                  }}
                  onError={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                />
              </div>
              {/* Company Name */}
              <span className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'serif' }}>
                Sun Valley Mega Health Center
              </span>
            </Link>
          </div>
        </div>
        
        {/* Curved divider SVG - gentle upward curve */}
        <svg
          className="absolute left-2/3 top-0 bottom-0 pointer-events-none"
          width="100"
          height="100%"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          style={{ width: '80px' }}
        >
          <path
            d="M 0 100 Q 20 90 40 85 Q 60 80 80 75 Q 90 70 100 65 L 100 100 L 0 100 Z"
            fill="#f5f5f0"
          />
        </svg>
        
        {/* Right section - Light Beige */}
        <div className="bg-stone-50 flex-1" style={{ flex: '1' }}>
          <div className="h-full flex items-center justify-end pr-6 lg:pr-12">
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              <Link
                to="/login"
                className="text-gray-800 hover:text-green-700 font-semibold transition-colors text-base lg:text-lg"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-gray-800 hover:text-green-700 font-semibold transition-colors text-base lg:text-lg"
              >
                About
              </Link>
              <Link
                to="/services"
                className="text-gray-800 hover:text-green-700 font-semibold transition-colors text-base lg:text-lg"
              >
                Services
              </Link>
              <Link
                to="/contact"
                className="text-gray-800 hover:text-green-700 font-semibold transition-colors text-base lg:text-lg"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Button */}
      <div className="md:hidden absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
        <button className="text-gray-700 hover:text-green-700">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default AppBar;

