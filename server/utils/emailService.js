const nodemailer = require('nodemailer');
const logger = require('./logger');

// Email service for sending reminders
class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    // Configure email transporter
    // In production, use actual SMTP credentials
    // For now, we'll use a mock or configure with environment variables
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      logger.info('Email service initialized with SMTP');
    } else {
      // Mock transporter for development
      logger.warn('Email service running in mock mode (no SMTP configured)');
      this.transporter = {
        sendMail: async (options) => {
          logger.info('Mock email sent:', {
            to: options.to,
            subject: options.subject,
            text: options.text?.substring(0, 100) + '...'
          });
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  async sendMeetingReminder(meeting, recipientEmail) {
    try {
      const meetingDate = new Date(meeting.scheduledDateTime);
      const meetingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/room/${meeting.roomId}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@montty-zoom.com',
        to: recipientEmail,
        subject: `Meeting Reminder: ${meeting.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Meeting Reminder</h1>
              </div>
              <div class="content">
                <h2>${meeting.title}</h2>
                <div class="details">
                  <p><strong>Date:</strong> ${meetingDate.toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${meetingDate.toLocaleTimeString()}</p>
                  <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                  ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
                  ${meeting.roomPassword ? `<p><strong>Password:</strong> ${meeting.roomPassword}</p>` : ''}
                </div>
                <a href="${meetingUrl}" class="button">Join Meeting</a>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
                  Meeting ID: ${meeting.roomId}<br>
                  <a href="${meetingUrl}">${meetingUrl}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Meeting Reminder: ${meeting.title}

Date: ${meetingDate.toLocaleDateString()}
Time: ${meetingDate.toLocaleTimeString()}
Duration: ${meeting.duration} minutes

${meeting.description ? `Description: ${meeting.description}\n` : ''}
${meeting.roomPassword ? `Password: ${meeting.roomPassword}\n` : ''}

Join Meeting: ${meetingUrl}
Meeting ID: ${meeting.roomId}
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Meeting reminder email sent', { 
        to: recipientEmail, 
        meetingId: meeting.id,
        messageId: result.messageId 
      });
      return result;
    } catch (error) {
      logger.error('Error sending meeting reminder email:', error);
      throw error;
    }
  }

  async sendMeetingInvite(meeting, recipientEmails) {
    try {
      const meetingDate = new Date(meeting.scheduledDateTime);
      const meetingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/room/${meeting.roomId}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@montty-zoom.com',
        to: recipientEmails.join(','),
        subject: `Meeting Invitation: ${meeting.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>You're Invited!</h1>
              </div>
              <div class="content">
                <h2>${meeting.title}</h2>
                <div class="details">
                  <p><strong>Date:</strong> ${meetingDate.toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${meetingDate.toLocaleTimeString()}</p>
                  <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                  ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
                  ${meeting.roomPassword ? `<p><strong>Password:</strong> ${meeting.roomPassword}</p>` : ''}
                </div>
                <a href="${meetingUrl}" class="button">Join Meeting</a>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
                  Meeting ID: ${meeting.roomId}<br>
                  <a href="${meetingUrl}">${meetingUrl}</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Meeting invite email sent', { 
        to: recipientEmails, 
        meetingId: meeting.id 
      });
      return result;
    } catch (error) {
      logger.error('Error sending meeting invite email:', error);
      throw error;
    }
  }
}

const emailService = new EmailService();

module.exports = emailService;

