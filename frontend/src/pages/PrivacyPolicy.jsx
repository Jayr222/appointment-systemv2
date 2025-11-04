import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary-500 rounded-full w-16 h-16 flex items-center justify-center">
              <FaShieldAlt className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Privacy Policy</h1>
          <p className="text-center text-gray-600 mb-8">Barangay Health Center 2025</p>

          {/* Last Updated */}
          <div className="text-center mb-8 pb-4 border-b">
            <p className="text-sm text-gray-500">Last Updated: January 2025</p>
          </div>

          {/* Content */}
          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
              <p>
                The Barangay Health Center is committed to protecting your privacy and ensuring the confidentiality of your personal and medical information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our healthcare appointment system.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
              <p>We collect the following types of information:</p>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Name, email address, phone number</li>
                <li>Date of birth and gender</li>
                <li>Home address and emergency contact information</li>
                <li>Insurance information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.2 Medical Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Medical history and records</li>
                <li>Vital signs and examination findings</li>
                <li>Diagnoses and treatment plans</li>
                <li>Medications and prescriptions</li>
                <li>Lab test results and investigations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.3 Usage Information</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Appointment bookings and history</li>
                <li>System activity and access logs</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
              <p>We use your information for the following purposes:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Processing and managing appointments</li>
                <li>Providing healthcare services and treatments</li>
                <li>Maintaining medical records and health history</li>
                <li>Communicating with you about appointments and health matters</li>
                <li>Improving our services and system functionality</li>
                <li>Ensuring system security and preventing fraud</li>
                <li>Complying with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Information Sharing and Disclosure</h2>
              <p>We do not sell your personal or medical information. We may share your information with:</p>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">4.1 Healthcare Providers</h3>
              <p>Your healthcare provider has access to your medical records to provide treatment and care.</p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">4.2 Authorized Personnel</h3>
              <p>System administrators and authorized staff may access information for system maintenance and support.</p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">4.3 Legal Requirements</h3>
              <p>We may disclose information when required by law, court order, or government regulations.</p>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">4.4 Emergency Situations</h3>
              <p>In emergency situations, information may be shared with emergency responders and healthcare facilities.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure password hashing and authentication</li>
                <li>Role-based access control</li>
                <li>Regular security audits and updates</li>
                <li>Protected database storage</li>
                <li>Activity logging and monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Your Privacy Rights</h2>
              <p>You have the following rights regarding your personal information:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Access:</strong> Request access to your personal and medical records</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal retention requirements)</li>
                <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
                <li><strong>Objection:</strong> Object to certain processing of your data</li>
                <li><strong>Restriction:</strong> Request restriction of processing in specific circumstances</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Google Sign-In</h2>
              <p>
                When you sign in with Google, we collect your email address, name, and profile picture from your Google account. 
                This information is used only for authentication and account management. We do not access or store any other 
                information from your Google account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Doctor Verification</h2>
              <p>
                For doctor accounts, we collect and verify professional credentials including medical license numbers, 
                specializations, and experience. This information is used for verification purposes and is securely stored.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Data Retention</h2>
              <p>
                We retain your personal and medical information for as long as necessary to provide healthcare services 
                and as required by law. Medical records are typically retained for a minimum period as mandated by healthcare regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Children's Privacy</h2>
              <p>
                Our services are available to minors through parent or guardian accounts. We collect information about 
                children under 18 only with parental or guardian consent and authorization.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Cookies and Tracking</h2>
              <p>
                We use essential cookies for system functionality and authentication. We do not use tracking cookies 
                for advertising or third-party analytics. Session tokens are used for secure authentication.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">12. Third-Party Services</h2>
              <p>
                We use Google OAuth for authentication. Google's privacy policy applies to information collected 
                during the Google Sign-In process. We do not share your information with other third-party services 
                without your explicit consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">13. International Data Transfers</h2>
              <p>
                Your information is primarily stored and processed in the Philippines. If data is transferred 
                internationally, we ensure appropriate safeguards are in place to protect your privacy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">14. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of significant changes 
                through the system or via email. Continued use of the system after changes constitutes acceptance 
                of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">15. Contact Us</h2>
              <p>
                For questions, concerns, or to exercise your privacy rights, please contact:
              </p>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">Privacy Officer</p>
                <p>Barangay Health Center</p>
                <p>Email: privacy@healthcenter.gov.ph</p>
                <p>Phone: (02) 1234-5678</p>
                <p>Address: Barangay Health Center, [Location], Philippines</p>
              </div>
            </section>

            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-blue-900 mb-3">Compliance</h2>
              <p className="text-blue-900">
                This Privacy Policy complies with the Data Privacy Act of 2012 (Republic Act No. 10173) 
                and other applicable Philippine privacy laws and healthcare regulations.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center space-y-3">
            <Link to="/register" className="text-primary-600 hover:text-primary-800 font-semibold block">
              ← Back to Register
            </Link>
            <Link to="/login" className="text-gray-600 hover:text-gray-800 text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

