import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jfif';

const AppBar = () => {
  return (
    <header className="relative text-white overflow-hidden shadow-md fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: '#31694E' }}>
      {/* curved background */}
      <div className="absolute top-0 right-0 w-[45%] h-full bg-white rounded-bl-[120px]"></div>

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-6">
          <Link to="/login" className="flex items-center space-x-4">
            <img
              src={logo}
              alt="Logo"
              className="w-24 h-24 rounded-full border-2 border-white shadow-md object-cover"
            />
            <h1 className="text-4xl md:text-4xl font-extrabold tracking-wide drop-shadow-sm whitespace-nowrap text-white">
              Sun Valley Mega Health Center
            </h1>
          </Link>
          
          {/* Navigation Links */}
          <nav className="flex space-x-10 text-lg md:text-xl font-semibold" style={{ color: '#31694E' }}>
            <Link
              to="/login"
              className="transition-all hover:scale-105"
              style={{ color: '#31694E' }}
              onMouseEnter={(e) => e.target.style.color = '#27543e'}
              onMouseLeave={(e) => e.target.style.color = '#31694E'}
            >
              Home
            </Link>
            <Link
              to="/about"
              className="transition-all hover:scale-105"
              style={{ color: '#31694E' }}
              onMouseEnter={(e) => e.target.style.color = '#27543e'}
              onMouseLeave={(e) => e.target.style.color = '#31694E'}
            >
              About
            </Link>
            <Link
              to="/services"
              className="transition-all hover:scale-105"
              style={{ color: '#31694E' }}
              onMouseEnter={(e) => e.target.style.color = '#27543e'}
              onMouseLeave={(e) => e.target.style.color = '#31694E'}
            >
              Services
            </Link>
            <Link
              to="/contact"
              className="transition-all hover:scale-105"
              style={{ color: '#31694E' }}
              onMouseEnter={(e) => e.target.style.color = '#27543e'}
              onMouseLeave={(e) => e.target.style.color = '#31694E'}
            >
              Contact
            </Link>
          </nav>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-white" onMouseEnter={(e) => e.target.style.color = '#d1e5db'} onMouseLeave={(e) => e.target.style.color = 'white'}>
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
        </div>
      </div>
    </header>
  );
};

export default AppBar;

