const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
};

const sendEmail = async (options) => {
  const transporter = createTransporter();

  const message = {
    from: `"FUOCO Artisan Pizza" <${process.env.SMTP_USER || 'no-reply@fuoco.com'}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  const info = await transporter.sendMail(message);
  console.log(`[Email Sent] Message ID: ${info.messageId}`);
  if (process.env.SMTP_HOST.includes('ethereal')) {
    console.log(`[Ethereal Preview URL] ${nodemailer.getTestMessageUrl(info)}`);
  }
  return info;
};

// Template helper functions
const getVerificationEmailTemplate = (name, verificationUrl) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0D0D0D; color: #F5F5F5; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 16px; padding: 30px;">
        <h1 style="color: #FF5E14; font-size: 28px; margin-bottom: 10px; letter-spacing: 2px;">FUOCO</h1>
        <h2 style="font-size: 20px; margin-bottom: 20px; color: #FFFFFF;">Welcome to FUOCO, ${name}!</h2>
        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
          Thank you for registering with FUOCO Artisan Pizza. Please verify your email address to activate your account and start ordering artisan wood-fired pizzas.
        </p>
        <a href="${verificationUrl}" style="background-color: #FF5E14; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 15px rgba(255,94,20,0.4);">
          Verify Email Address
        </a>
        <p style="color: #666666; font-size: 12px; margin-top: 30px;">
          Or copy & paste this link in your browser:<br>
          <a href="${verificationUrl}" style="color: #FFB800;">${verificationUrl}</a>
        </p>
      </div>
    </div>
  `;
};

const getResetPasswordTemplate = (name, resetUrl) => {
  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0D0D0D; color: #F5F5F5; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 16px; padding: 30px;">
        <h1 style="color: #FF5E14; font-size: 28px; margin-bottom: 10px; letter-spacing: 2px;">FUOCO</h1>
        <h2 style="font-size: 20px; margin-bottom: 20px; color: #FFFFFF;">Password Reset Request</h2>
        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
          Hi ${name}, you requested a password reset. Click the button below to reset your password. Token expires in 10 minutes.
        </p>
        <a href="${resetUrl}" style="background-color: #FFB800; color: #0D0D0D; text-decoration: none; padding: 14px 28px; border-radius: 30px; font-weight: bold; font-size: 14px; display: inline-block;">
          Reset Password
        </a>
      </div>
    </div>
  `;
};

const getLowStockAlertTemplate = (lowItems) => {
  const itemsListHtml = lowItems
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #2A2A2A;">
        <td style="padding: 10px; color: #FFFFFF; font-weight: bold;">${item.name}</td>
        <td style="padding: 10px; color: #FFB800; text-transform: uppercase;">${item.category}</td>
        <td style="padding: 10px; color: #FF4D4D; font-weight: bold;">${item.stockQuantity} units left</td>
        <td style="padding: 10px; color: #777777;">Threshold: ${item.minThreshold}</td>
      </tr>
    `
    )
    .join('');

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #0D0D0D; color: #F5F5F5; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #1A1A1A; border: 1px solid #FF5E14; border-radius: 16px; padding: 30px;">
        <h1 style="color: #FF5E14; font-size: 24px; margin-bottom: 10px;">⚠️ INVENTORY LOW STOCK ALERT</h1>
        <p style="color: #CCCCCC; font-size: 14px; margin-bottom: 20px;">
          The following inventory items have fallen below the minimum stock threshold of 20 units. Please restock immediately.
        </p>
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="background: #2A2A2A; color: #999999;">
              <th style="padding: 10px;">Item</th>
              <th style="padding: 10px;">Category</th>
              <th style="padding: 10px;">Current Stock</th>
              <th style="padding: 10px;">Min Threshold</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

module.exports = {
  sendEmail,
  getVerificationEmailTemplate,
  getResetPasswordTemplate,
  getLowStockAlertTemplate
};
