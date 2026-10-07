require('dotenv').config();
const https = require('https');

const payload = JSON.stringify({
  sender: {
    name: 'Food Bridge Official',
    email: process.env.BREVO_EMAIL
  },
  to: [
    {
      email: 'test@example.com',
      name: 'Test'
    }
  ],
  subject: 'Test API Email',
  htmlContent: '<h1>Test</h1>'
});

const options = {
  hostname: 'api.brevo.com',
  path: '/v3/smtp/email',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'api-key': process.env.BREVO_SMTP_KEY,
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log(res.statusCode, data));
});
req.write(payload);
req.end();
