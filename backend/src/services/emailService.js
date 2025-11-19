import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import SiteContent from '../models/SiteContent.js';

// Configure email transporter (example using Gmail)
// In production, use environment variables for credentials
const emailHost = config.EMAIL?.HOST || process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = config.EMAIL?.PORT || parseInt(process.env.EMAIL_PORT, 10) || 587;
const emailUser = config.EMAIL?.USER || process.env.EMAIL_USER;
const emailPass = config.EMAIL?.PASS || process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: Number(emailPort) === 465,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  // Additional options for better compatibility
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
if (!emailHost || !emailUser || !emailPass) {
  console.warn(
    '⚠️  Email transporter is running with incomplete credentials. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS.'
  );
} else {
  // Verify connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
      console.error('   Make sure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS are correct.');
      console.error('   For Gmail, you need to use an App Password, not your regular password.');
    } else {
      console.log('✅ Email transporter verified successfully');
    }
  });
}

export const sendAppointmentConfirmation = async (email, appointmentDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Appointment Confirmation',
      html: `
        <h2>Appointment Confirmed</h2>
        <p>Your appointment has been confirmed.</p>
        <p><strong>Date:</strong> ${appointmentDetails.date}</p>
        <p><strong>Time:</strong> ${appointmentDetails.time}</p>
        <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
        <p><strong>Reason:</strong> ${appointmentDetails.reason}</p>
        <p>Thank you for choosing our healthcare service.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export const sendAppointmentReminder = async (email, appointmentDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Appointment Reminder',
      html: `
        <h2>Appointment Reminder</h2>
        <p>This is a reminder for your upcoming appointment.</p>
        <p><strong>Date:</strong> ${appointmentDetails.date}</p>
        <p><strong>Time:</strong> ${appointmentDetails.time}</p>
        <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export const sendAppointmentCancellation = async (email, appointmentDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Appointment Cancelled',
      html: `
        <h2>Appointment Cancelled</h2>
        <p>Your appointment has been cancelled.</p>
        <p><strong>Date:</strong> ${appointmentDetails.date}</p>
        <p><strong>Time:</strong> ${appointmentDetails.time}</p>
        <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
        ${appointmentDetails.reason ? `<p><strong>Reason:</strong> ${appointmentDetails.reason}</p>` : ''}
        <p>If this was a mistake, please book a new appointment.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    // Check if email credentials are configured
    if (!emailUser || !emailPass) {
      console.error('❌ Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS in your .env file.');
      return false;
    }

    // Get custom email template from SiteContent
    let siteContent = await SiteContent.findOne();
    if (!siteContent) {
      siteContent = await SiteContent.create({});
    }

    const template = siteContent.emailTemplates?.passwordReset || {};
    const primaryColor = siteContent.settings?.primaryColor || '#31694E';
    const orgName = template.organizationName || siteContent.organizationName || 'Barangay Health Center';

    // Use custom template values or defaults
    const subject = template.subject || 'Password Reset Request';
    const greeting = template.greeting || 'Hello';
    const body = template.body || 'You requested to reset your password. Click the link below to reset it:';
    const buttonText = template.buttonText || 'Reset Password';
    const linkText = template.linkText || 'Or copy and paste this link into your browser:';
    const expirationText = template.expirationText || 'This link will expire in 1 hour.';
    const footerText = template.footerText || 'If you didn\'t request this, please ignore this email.';

    // Get frontend URL and ensure it doesn't have trailing slashes or incorrect paths
    let frontendUrl = config.FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    // Remove trailing slash and any /login path that might be incorrectly included
    frontendUrl = frontendUrl.replace(/\/+$/, '').replace(/\/login$/, '');
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"${orgName}" <${emailUser}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${primaryColor}; margin-bottom: 20px;">${subject}</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">${greeting},</p>
          <p style="color: #333; font-size: 16px; line-height: 1.6;">${body}</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: ${primaryColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              ${buttonText}
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">${linkText}</p>
          <p style="word-break: break-all; color: #666; font-size: 14px; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px; line-height: 1.6;">
            ${expirationText}<br>
            ${footerText}
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            ${orgName}
          </p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully to:', email);
    console.log('   Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    if (error.code === 'EAUTH') {
      console.error('   Authentication failed. Check your EMAIL_USER and EMAIL_PASS.');
      console.error('   For Gmail, make sure you\'re using an App Password, not your regular password.');
    } else if (error.code === 'ECONNECTION') {
      console.error('   Connection failed. Check your EMAIL_HOST and EMAIL_PORT.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   Connection timed out. Check your network and email server settings.');
    } else {
      console.error('   Full error:', error);
    }
    return false;
  }
};

export const sendWalkInAppointmentEmail = async (email, details) => {
  try {
    const {
      patientName,
      doctorName,
      doctorSpecialization,
      appointmentDate,
      appointmentTime,
      queueNumber,
      priorityLevel,
      reason,
      temporaryPassword,
      temporaryPasswordExpiresAt,
      loginUrl
    } = details;

    const priorityLabel = priorityLevel
      ? priorityLevel.charAt(0).toUpperCase() + priorityLevel.slice(1)
      : 'Regular';

    const temporaryPasswordExpiryText = temporaryPasswordExpiresAt
      ? new Date(temporaryPasswordExpiresAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      : null;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Walk-in Appointment Registered',
      html: `
        <h2>Walk-in Appointment Confirmed</h2>
        <p>Hi ${patientName || 'Patient'},</p>
        <p>Your walk-in visit has been registered. Here are the details:</p>
        <ul>
          <li><strong>Date:</strong> ${appointmentDate}</li>
          <li><strong>Time:</strong> ${appointmentTime}</li>
          <li><strong>Doctor:</strong> ${doctorName}${doctorSpecialization ? ` (${doctorSpecialization})` : ''}</li>
          <li><strong>Reason:</strong> ${reason || 'Consultation'}</li>
          <li><strong>Queue Number:</strong> ${queueNumber || 'To be announced at the clinic'}</li>
          <li><strong>Priority:</strong> ${priorityLabel}</li>
        </ul>
        ${
          temporaryPassword
            ? `
        <p>An account has been created for you so you can check updates online.</p>
        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        ${
          temporaryPasswordExpiryText
            ? `<p><em>This temporary password expires at approximately ${temporaryPasswordExpiryText}.</em></p>`
            : '<p><em>This temporary password expires in a few minutes. Please log in promptly.</em></p>'
        }
        <p>Please log in and change your password as soon as possible.</p>`
            : `
        <p>You can log in with your existing patient account to monitor queue updates.</p>`
        }
        ${
          loginUrl
            ? `<p><a href="${loginUrl}" style="color:#31694E;font-weight:bold;">Go to Patient Portal</a></p>`
            : ''
        }
        <p>Please arrive early and bring any necessary documents. If you have questions, contact the clinic front desk.</p>
        <p>Thank you.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Walk-in email sending error:', error);
    return false;
  }
};

