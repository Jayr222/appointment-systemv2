import React from 'react';
import { Link } from 'react-router-dom';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import AppBar from '../components/shared/AppBar';
import { useSiteContent } from '../context/SiteContentContext';

const Contact = () => {
  const { content, loading } = useSiteContent();
  
  const organizationName = content?.organizationName || 'Sun Valley Mega Health Center';
  const contact = content?.contact || {};
  const address = contact.address || {};
  const phone = contact.phone || {};
  const email = contact.email || {};
  const hours = contact.operatingHours || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppBar />
        <div className="pt-20 pb-12 flex items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar />
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Contact Us</h1>
            <p className="text-xl text-gray-600">Get in Touch with {organizationName}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0">
                      <FaMapMarkerAlt className="text-primary-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Address</h3>
                      <p className="text-gray-600">
                        {organizationName}<br />
                        {address.street || '[Street Address]'}<br />
                        {address.city && address.province ? `${address.city}, ${address.province}` : address.city || address.province || '[City, Province]'}<br />
                        {address.country || 'Philippines'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0">
                      <FaPhone className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Phone</h3>
                      <p className="text-gray-600">
                        {phone.main && `Main: ${phone.main}`}
                        {phone.main && phone.emergency && <br />}
                        {phone.emergency && `Emergency: ${phone.emergency}`}
                        {(phone.main || phone.emergency) && phone.mobile && <br />}
                        {phone.mobile && `Mobile: ${phone.mobile}`}
                        {!phone.main && !phone.emergency && !phone.mobile && 'Contact information not available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0">
                      <FaEnvelope className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Email</h3>
                      <p className="text-gray-600">
                        {email.general && `General: ${email.general}`}
                        {email.general && email.appointments && <br />}
                        {email.appointments && `Appointments: ${email.appointments}`}
                        {(email.general || email.appointments) && email.support && <br />}
                        {email.support && `Support: ${email.support}`}
                        {!email.general && !email.appointments && !email.support && 'Email information not available'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mr-4 flex-shrink-0">
                      <FaClock className="text-purple-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">Operating Hours</h3>
                      <p className="text-gray-600">
                        {hours.weekdays && `Monday - Friday: ${hours.weekdays}`}
                        {hours.weekdays && hours.saturday && <br />}
                        {hours.saturday && `Saturday: ${hours.saturday}`}
                        {(hours.weekdays || hours.saturday) && hours.sunday && <br />}
                        {hours.sunday && `Sunday: ${hours.sunday}`}
                        {(hours.weekdays || hours.saturday || hours.sunday) && hours.emergency && <br />}
                        {hours.emergency && hours.emergency}
                        {!hours.weekdays && !hours.saturday && !hours.sunday && !hours.emergency && 'Operating hours not available'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form or Map Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send Us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2" htmlFor="message">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    placeholder="Enter your message"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-800 font-semibold">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

