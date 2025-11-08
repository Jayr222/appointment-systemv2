import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaEnvelope } from 'react-icons/fa';
import { useSiteContent } from '../../context/SiteContentContext';

const Footer = () => {
  const { content } = useSiteContent();
  const organizationName = content?.organizationName || 'Sun Valley Mega Health Center';
  const primaryColor = content?.settings?.primaryColor || '#31694E';

  return (
    <footer className="relative bg-gray-900 text-white py-8 md:py-10 mt-auto" style={{ backgroundColor: primaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* Organization Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">{organizationName}</h3>
            <p className="text-sm text-gray-200 leading-relaxed mb-4">
              Your trusted health center providing quality healthcare services to our community.
            </p>
            {/* Social Media Links */}
            <div className="flex items-center space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200"
                aria-label="Facebook"
              >
                <FaFacebook className="text-xl" />
              </a>
              <a
                href="mailto:healthcenter@barangay.gov.ph"
                className="text-gray-200 hover:text-white hover:scale-110 transition-all duration-200"
                aria-label="Email"
              >
                <FaEnvelope className="text-xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/about" 
                  className="text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block hover:translate-x-1"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/services" 
                  className="text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block hover:translate-x-1"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block hover:translate-x-1"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  to="/register" 
                  className="text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block hover:translate-x-1"
                >
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block hover:translate-x-1"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-200 hover:text-white hover:underline transition-all duration-200 inline-block hover:translate-x-1"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-sm text-gray-200">
            © {new Date().getFullYear()} {organizationName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

