import React from 'react';
import { Link } from 'react-router-dom';
import { FaInfoCircle, FaUsers, FaHeartbeat, FaAward } from 'react-icons/fa';
import AppBar from '../components/shared/AppBar';
import { useSiteContent } from '../context/SiteContentContext';

const About = () => {
  const { content, loading } = useSiteContent();
  
  const organizationName = content?.organizationName || 'Sun Valley Mega Health Center';
  const about = content?.about || {};
  const mission = about.mission || 'To provide accessible, high-quality healthcare services to our community.';
  const vision = about.vision || 'To be the leading community health center.';
  const story = about.story || 'Our health center was established with a vision to transform healthcare delivery.';
  const teamDescription = about.teamDescription || 'Our healthcare team consists of experienced and dedicated professionals.';
  const values = about.values || [
    { title: 'Compassion', description: 'We treat every patient with empathy, respect, and understanding.' },
    { title: 'Excellence', description: 'We strive for the highest standards in healthcare delivery.' },
    { title: 'Community', description: 'We are committed to serving and strengthening our community.' }
  ];

  const iconMap = {
    'FaHeartbeat': FaHeartbeat,
    'FaAward': FaAward,
    'FaUsers': FaUsers,
    'FaInfoCircle': FaInfoCircle
  };

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
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary-500 rounded-full w-16 h-16 flex items-center justify-center">
                <FaInfoCircle className="text-white text-3xl" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">About Us</h1>
            <p className="text-xl text-gray-600">{organizationName}</p>
          </div>

          {/* Mission and Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">{mission}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed">{vision}</p>
            </div>
          </div>

          {/* Values */}
          {values && values.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 mb-12">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Our Core Values</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value, index) => {
                  const Icon = iconMap[value.icon] || FaHeartbeat;
                  const colors = ['bg-green-100 text-green-600', 'bg-blue-100 text-blue-600', 'bg-purple-100 text-purple-600'];
                  const colorClass = value.color || colors[index % colors.length];
                  return (
                    <div key={index} className="text-center">
                      <div className={`${colorClass} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="text-2xl" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Our Story */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>{story}</p>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Our Team</h2>
            <p className="text-gray-700 text-center leading-relaxed mb-6">
              {teamDescription}
            </p>
            <div className="text-center">
              <Link
                to="/register"
                className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md"
              >
                Book an Appointment
              </Link>
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

export default About;

