import React from 'react';
import { Link } from 'react-router-dom';
import { FaStethoscope, FaUserMd, FaFileMedical, FaSyringe, FaHeartbeat, FaProcedures } from 'react-icons/fa';
import AppBar from '../components/shared/AppBar';
import { useSiteContent } from '../context/SiteContentContext';

const Services = () => {
  const { content, loading } = useSiteContent();
  
  const iconMap = {
    'FaStethoscope': FaStethoscope,
    'FaFileMedical': FaFileMedical,
    'FaUserMd': FaUserMd,
    'FaSyringe': FaSyringe,
    'FaHeartbeat': FaHeartbeat,
    'FaProcedures': FaProcedures
  };

  const defaultServices = [
    {
      icon: 'FaStethoscope',
      title: 'General Consultation',
      description: 'Comprehensive medical consultations with licensed doctors for various health concerns and conditions.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: 'FaFileMedical',
      title: 'Medical Records Management',
      description: 'Secure digital storage and management of your medical history and health records.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: 'FaUserMd',
      title: 'Specialist Referrals',
      description: 'Referrals to specialized medical professionals for advanced treatment and care.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: 'FaSyringe',
      title: 'Vaccinations',
      description: 'Immunization services including routine vaccines and preventive care shots.',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      icon: 'FaHeartbeat',
      title: 'Health Check-ups',
      description: 'Regular health screenings and check-ups to monitor your overall wellness.',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: 'FaProcedures',
      title: 'Appointment Booking',
      description: 'Easy online appointment scheduling with your preferred healthcare provider.',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  const services = content?.services && content.services.length > 0 
    ? content.services 
    : defaultServices;

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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Services</h1>
            <p className="text-xl text-gray-600">Comprehensive Healthcare Solutions</p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {services.map((service, index) => {
              const Icon = typeof service.icon === 'string' 
                ? iconMap[service.icon] || FaStethoscope 
                : service.icon || FaStethoscope;
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className={`${service.color || 'bg-blue-100 text-blue-600'} rounded-full w-16 h-16 flex items-center justify-center mb-4`}>
                    <Icon className="text-2xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.description}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Additional Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Preventive Care</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Annual health check-ups</li>
                  <li>Health education and counseling</li>
                  <li>Disease prevention programs</li>
                  <li>Wellness screenings</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Diagnostic Services</h3>
                <ul className="list-disc pl-6 text-gray-600 space-y-1">
                  <li>Laboratory tests</li>
                  <li>Health screenings</li>
                  <li>Diagnostic imaging referrals</li>
                  <li>Blood work and analysis</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-lg shadow-md p-8 text-white text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to Schedule Your Appointment?</h2>
            <p className="mb-6 text-lg">Book an appointment with one of our healthcare professionals today.</p>
            <Link
              to="/register"
              className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-md"
            >
              Book an Appointment
            </Link>
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

export default Services;

