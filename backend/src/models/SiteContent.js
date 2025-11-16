import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema({
  // Organization Information
  organizationName: {
    type: String,
    default: 'Sun Valley Mega Health Center'
  },
  organizationTagline: {
    type: String,
    default: 'Your Community\'s Trusted for Health'
  },
  logo: {
    type: String, // URL or path to logo
    default: ''
  },
  
  // About Page Content
  about: {
    mission: {
      type: String,
      default: 'To provide accessible, high-quality healthcare services to our community, ensuring that every individual receives compassionate and professional medical care. We are committed to promoting health, preventing disease, and improving the overall well-being of all community members.'
    },
    vision: {
      type: String,
      default: 'To be the leading community health center, recognized for excellence in healthcare delivery, innovative medical services, and unwavering commitment to patient care. We envision a healthy community where everyone has access to quality healthcare services.'
    },
    values: [{
      title: String,
      description: String
    }],
    story: {
      type: String,
      default: 'Sun Valley Mega Health Center was established with a vision to transform healthcare delivery in our community. Since our inception, we have been dedicated to providing comprehensive, patient-centered medical services to individuals and families.'
    },
    teamDescription: {
      type: String,
      default: 'Our healthcare team consists of experienced and dedicated professionals committed to providing exceptional medical care. All our doctors are licensed and verified, ensuring that you receive treatment from qualified healthcare providers.'
    }
  },
  
  // Services
  services: [{
    icon: String, // Icon name from react-icons
    title: String,
    description: String,
    color: String // Tailwind color classes
  }],
  
  // Contact Information
  contact: {
    address: {
      street: String,
      city: String,
      province: String,
      country: {
        type: String,
        default: 'Philippines'
      }
    },
    phone: {
      main: String,
      emergency: String,
      mobile: String
    },
    email: {
      general: String,
      appointments: String,
      support: String
    },
    operatingHours: {
      weekdays: String,
      saturday: String,
      sunday: String,
      emergency: String
    }
  },
  
  // Legal Pages
  termsAndConditions: {
    lastUpdated: Date,
    content: String // Full HTML or markdown content
  },
  
  privacyPolicy: {
    lastUpdated: Date,
    content: String // Full HTML or markdown content
  },
  
  // Login Page Hero
  loginHero: {
    title: String,
    description: String,
    buttonText: String
  },
  
  // Additional Settings
  settings: {
    primaryColor: {
      type: String,
      default: '#31694E'
    },
    secondaryColor: {
      type: String,
      default: '#0c1b4d'
    }
  },

  // Email Templates
  emailTemplates: {
    passwordReset: {
      subject: {
        type: String,
        default: 'Password Reset Request'
      },
      greeting: {
        type: String,
        default: 'Hello'
      },
      body: {
        type: String,
        default: 'You requested to reset your password. Click the link below to reset it:'
      },
      buttonText: {
        type: String,
        default: 'Reset Password'
      },
      linkText: {
        type: String,
        default: 'Or copy and paste this link into your browser:'
      },
      expirationText: {
        type: String,
        default: 'This link will expire in 1 hour.'
      },
      footerText: {
        type: String,
        default: 'If you didn\'t request this, please ignore this email.'
      },
      organizationName: {
        type: String,
        default: 'Barangay Health Center'
      }
    }
  }
}, {
  timestamps: true
});

// Ensure only one document exists
siteContentSchema.statics.getContent = async function() {
  let content = await this.findOne();
  if (!content) {
    // Create default content
    content = await this.create({});
  }
  return content;
};

export default mongoose.model('SiteContent', siteContentSchema);

