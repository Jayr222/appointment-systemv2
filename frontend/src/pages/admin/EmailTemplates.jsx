import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaSave, FaUndo } from 'react-icons/fa';
import siteContentService from '../../services/siteContentService';
import { useNotifications } from '../../context/NotificationContext';

const EmailTemplates = () => {
  const { addNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState({
    subject: '',
    greeting: '',
    body: '',
    buttonText: '',
    linkText: '',
    expirationText: '',
    footerText: '',
    organizationName: ''
  });

  useEffect(() => {
    fetchTemplate();
  }, []);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const content = await siteContentService.getSiteContent();
      const emailTemplate = content?.emailTemplates?.passwordReset || {};
      
      setTemplate({
        subject: emailTemplate.subject || 'Password Reset Request',
        greeting: emailTemplate.greeting || 'Hello',
        body: emailTemplate.body || 'You requested to reset your password. Click the link below to reset it:',
        buttonText: emailTemplate.buttonText || 'Reset Password',
        linkText: emailTemplate.linkText || 'Or copy and paste this link into your browser:',
        expirationText: emailTemplate.expirationText || 'This link will expire in 1 hour.',
        footerText: emailTemplate.footerText || 'If you didn\'t request this, please ignore this email.',
        organizationName: emailTemplate.organizationName || content?.organizationName || 'Barangay Health Center'
      });
    } catch (error) {
      console.error('Error fetching email template:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load email template settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await siteContentService.updateSiteContent({
        emailTemplates: {
          passwordReset: template
        }
      });

      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Email template updated successfully'
      });
    } catch (error) {
      console.error('Error saving email template:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save email template'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset to default values?')) {
      setTemplate({
        subject: 'Password Reset Request',
        greeting: 'Hello',
        body: 'You requested to reset your password. Click the link below to reset it:',
        buttonText: 'Reset Password',
        linkText: 'Or copy and paste this link into your browser:',
        expirationText: 'This link will expire in 1 hour.',
        footerText: 'If you didn\'t request this, please ignore this email.',
        organizationName: 'Barangay Health Center'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email template settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaEnvelope className="text-primary-500" />
            Email Templates
          </h1>
          <p className="text-gray-600 mt-2">Customize the password reset email template</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FaUndo /> Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold mb-6 text-gray-800">Password Reset Email Template</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Organization Name
            </label>
            <input
              type="text"
              value={template.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Barangay Health Center"
            />
            <p className="text-xs text-gray-500 mt-1">This will appear as the sender name and in the email footer</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              value={template.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Password Reset Request"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Greeting
            </label>
            <input
              type="text"
              value={template.greeting}
              onChange={(e) => handleChange('greeting', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Hello"
            />
            <p className="text-xs text-gray-500 mt-1">The greeting text (e.g., "Hello", "Dear User")</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Body Text
            </label>
            <textarea
              value={template.body}
              onChange={(e) => handleChange('body', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="You requested to reset your password. Click the link below to reset it:"
            />
            <p className="text-xs text-gray-500 mt-1">Main message body before the reset button</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Button Text
            </label>
            <input
              type="text"
              value={template.buttonText}
              onChange={(e) => handleChange('buttonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Reset Password"
            />
            <p className="text-xs text-gray-500 mt-1">Text on the reset password button</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Link Text
            </label>
            <input
              type="text"
              value={template.linkText}
              onChange={(e) => handleChange('linkText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="Or copy and paste this link into your browser:"
            />
            <p className="text-xs text-gray-500 mt-1">Text before the copy-paste link</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Expiration Text
            </label>
            <input
              type="text"
              value={template.expirationText}
              onChange={(e) => handleChange('expirationText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="This link will expire in 1 hour."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Footer Text
            </label>
            <textarea
              value={template.footerText}
              onChange={(e) => handleChange('footerText', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              placeholder="If you didn't request this, please ignore this email."
            />
            <p className="text-xs text-gray-500 mt-1">Text at the bottom of the email</p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Preview Information</h3>
          <p className="text-sm text-blue-800">
            The email will automatically include the reset link. You don't need to add it manually. 
            The link will appear as a button and also as a copy-paste URL below it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplates;

