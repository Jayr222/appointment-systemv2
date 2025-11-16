import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

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
  }
});

if (!emailHost || !emailUser || !emailPass) {
  console.warn(
    '⚠️  Email transporter is running with incomplete credentials. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS.'
  );
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
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
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

