import React from 'react';
import { Link } from 'react-router-dom';
import { FaInfoCircle, FaUsers, FaHeartbeat, FaAward } from 'react-icons/fa';
import AppBar from '../components/shared/AppBar';

const About = () => {
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
            <p className="text-xl text-gray-600">Sun Valley Mega Health Center</p>
          </div>

          {/* Mission and Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                To provide accessible, high-quality healthcare services to our community, ensuring that every individual 
                receives compassionate and professional medical care. We are committed to promoting health, preventing 
                disease, and improving the overall well-being of all community members.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed">
                To be the leading community health center, recognized for excellence in healthcare delivery, 
                innovative medical services, and unwavering commitment to patient care. We envision a healthy 
                community where everyone has access to quality healthcare services.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaHeartbeat className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Compassion</h3>
                <p className="text-gray-600">We treat every patient with empathy, respect, and understanding.</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaAward className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Excellence</h3>
                <p className="text-gray-600">We strive for the highest standards in healthcare delivery.</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="text-purple-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Community</h3>
                <p className="text-gray-600">We are committed to serving and strengthening our community.</p>
              </div>
            </div>
          </div>

          {/* Our Story */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Story</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Sun Valley Mega Health Center was established with a vision to transform healthcare delivery 
                in our community. Since our inception, we have been dedicated to providing comprehensive, 
                patient-centered medical services to individuals and families.
              </p>
              <p>
                Our team of experienced healthcare professionals, including licensed doctors, nurses, and 
                medical staff, work together to ensure that every patient receives the best possible care. 
                We combine modern medical technology with traditional values of compassion and care.
              </p>
              <p>
                Over the years, we have expanded our services to include preventive care, diagnostics, 
                treatment, and health education. We believe in empowering our patients through knowledge 
                and providing them with the tools they need to maintain good health.
              </p>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Our Team</h2>
            <p className="text-gray-700 text-center leading-relaxed mb-6">
              Our healthcare team consists of experienced and dedicated professionals committed to providing 
              exceptional medical care. All our doctors are licensed and verified, ensuring that you receive 
              treatment from qualified healthcare providers.
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

