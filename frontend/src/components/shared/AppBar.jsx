import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../../context/SiteContentContext';
import logo from '../../assets/logo.jfif';

const AppBar = () => {
  const { content, loading } = useSiteContent();
  const organizationName = content?.organizationName || 'Sun Valley Mega Health Center';
  const primaryColor = content?.settings?.primaryColor || '#31694E';
  const logoUrl = content?.logo || logo;

  return (
    <header className="relative text-white overflow-hidden shadow-md" style={{ backgroundColor: primaryColor }}>
      {/* curved background */}
      <div className="absolute top-0 right-0 w-[45%] h-full bg-white rounded-bl-[120px]"></div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-8 py-3 md:py-4">
          <Link to="/login" className="flex items-center space-x-3 group">
            <div className="relative">
              <img
                src={logoUrl}
                alt="Logo"
                className="w-14 h-14 md:w-16 md:h-16 rounded-full border-[3px] md:border-4 border-white shadow-strong object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight drop-shadow-md whitespace-nowrap text-white">
              {loading ? 'Loading...' : organizationName}
            </h1>
          </Link>
          
          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-6 text-sm md:text-base font-semibold" style={{ color: primaryColor }}>
            <Link
              to="/login"
              className="relative px-2 py-1.5 transition-all duration-300 hover:opacity-80 hover:scale-105 group"
              style={{ color: primaryColor }}
              aria-label="Home"
            >
              <span className="relative z-10">Home</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: primaryColor }}></span>
            </Link>
            <Link
              to="/about"
              className="relative px-2 py-1.5 transition-all duration-300 hover:opacity-80 hover:scale-105 group"
              style={{ color: primaryColor }}
              aria-label="About"
            >
              <span className="relative z-10">About</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: primaryColor }}></span>
            </Link>
            <Link
              to="/services"
              className="relative px-2 py-1.5 transition-all duration-300 hover:opacity-80 hover:scale-105 group"
              style={{ color: primaryColor }}
              aria-label="Services"
            >
              <span className="relative z-10">Services</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: primaryColor }}></span>
            </Link>
            <Link
              to="/contact"
              className="relative px-2 py-1.5 transition-all duration-300 hover:opacity-80 hover:scale-105 group"
              style={{ color: primaryColor }}
              aria-label="Contact"
            >
              <span className="relative z-10">Contact</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full" style={{ backgroundColor: primaryColor }}></span>
            </Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              className="p-2 rounded-lg transition-all duration-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300"
              style={{ color: primaryColor }}
              aria-label="Menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppBar;

