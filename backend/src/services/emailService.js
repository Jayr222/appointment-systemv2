import nodemailer from 'nodemailer';

// Configure email transporter (example using Gmail)
// In production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

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

