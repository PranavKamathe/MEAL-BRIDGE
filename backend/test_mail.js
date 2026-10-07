require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_EMAIL,
    pass: process.env.BREVO_SMTP_KEY,
  },
});

transporter.sendMail({
  from: `"Food Bridge Official" <${process.env.BREVO_EMAIL}>`,
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<h1>Test</h1>',
}).then(info => {
  console.log('✅ Email sent:', info.messageId);
}).catch(err => {
  console.error('❌ Email error:', err);
});
