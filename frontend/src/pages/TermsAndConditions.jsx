import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileContract } from 'react-icons/fa';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="bg-primary-500 rounded-full w-16 h-16 flex items-center justify-center">
              <FaFileContract className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Terms and Conditions</h1>
          <p className="text-center text-gray-600 mb-8">Barangay Health Center 2025</p>

          {/* Last Updated */}
          <div className="text-center mb-8 pb-4 border-b">
            <p className="text-sm text-gray-500">Last Updated: January 2025</p>
          </div>

          {/* Content */}
          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Barangay Health Center appointment system, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Use License</h2>
              <p>Permission is granted to temporarily use this system for personal, non-commercial transitory use only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to decompile or reverse engineer any software</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. User Accounts</h2>
              <p>Users must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Healthcare Services</h2>
              <p>
                This system facilitates appointment booking and medical record management. All medical services are provided by licensed healthcare professionals. The system itself does not provide medical advice, diagnosis, or treatment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Appointment Booking</h2>
              <p>Users may book appointments with available healthcare providers. Cancellations must be made at least 24 hours in advance. No-show appointments may be subject to penalties.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Medical Records</h2>
              <p>Medical records are confidential and protected under privacy laws. Access to medical records is restricted to authorized healthcare providers and the patient. All records are maintained securely and in compliance with healthcare regulations.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Privacy and Data Protection</h2>
              <p>
                Your personal and medical information is protected under relevant privacy laws. Please refer to our Privacy Policy for detailed information on how we collect, use, and protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Doctor Verification</h2>
              <p>
                All doctors in our system undergo verification processes to ensure they are licensed healthcare professionals. The system implements security measures to protect against unauthorized access to medical information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Prohibited Activities</h2>
              <p>Users are prohibited from:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Creating false or misleading information</li>
                <li>Impersonating healthcare professionals or other users</li>
                <li>Accessing accounts or data without authorization</li>
                <li>Interfering with system operations or security</li>
                <li>Using the system for illegal purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">10. Limitation of Liability</h2>
              <p>
                The Barangay Health Center and its staff shall not be liable for any damages arising from the use or inability to use this system, including but not limited to direct, indirect, incidental, or consequential damages.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">11. Modifications</h2>
              <p>
                We reserve the right to modify these terms and conditions at any time without prior notice. Continued use of the system after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">12. Termination</h2>
              <p>
                We reserve the right to terminate or suspend access to accounts that violate these terms, engage in fraudulent activity, or compromise system security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">13. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the Philippines and local healthcare regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-3">14. Contact Information</h2>
              <p>
                For questions regarding these Terms and Conditions, please contact:
              </p>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold">Barangay Health Center</p>
                <p>Email: healthcenter@barangay.gov.ph</p>
                <p>Phone: (02) 1234-5678</p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-800 font-semibold">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;

