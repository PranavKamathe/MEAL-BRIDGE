const nodemailer = require('nodemailer');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 2); // 2 minutes
  return expiry;
};

const sendOTP = async (email, name, otp, role) => {
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
  
  // Console-based OTP delivery (development mode redundancy)
  console.log('\n========================================');
  console.log(`🔐 OTP for ${name} (${email}): ${otp}`);
  console.log(`💼 Role/Domain: ${roleDisplay}`);
  console.log(`⏰ Valid for 2 minutes`);
  console.log('========================================\n');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Food Bridge Verification</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">Food Bridge 🍽️</h1>
          <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Connecting Communities, Ending Hunger</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; font-size: 22px; margin-top: 0;">Welcome back, ${name}!</h2>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
            <p style="color: #475569; margin: 0; font-size: 15px; line-height: 1.6;">
              You are attempting to securely sign in to your <strong>${roleDisplay}</strong> account on the Food Bridge platform.
            </p>
          </div>

          <p style="color: #334155; font-size: 16px; margin-bottom: 25px;">
            Please use the following 6-digit authentication code to complete your login:
          </p>
          
          <!-- OTP Box -->
          <div style="text-align: center; margin: 35px 0;">
            <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #94a3b8; padding: 15px 40px; border-radius: 12px;">
              <span style="color: #0f172a; font-size: 38px; font-weight: 800; letter-spacing: 8px;">${otp}</span>
            </div>
          </div>
          
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #b91c1c; margin: 0; font-size: 14px; font-weight: 500; display: flex; align-items: center;">
              ⚠️ Security Notice
            </p>
            <p style="color: #7f1d1d; margin: 8px 0 0 0; font-size: 13.5px; line-height: 1.5;">
              This code expires in exactly <strong>2 minutes</strong>. Our team will never ask you for this code. Do not share it with anyone.
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          
          <!-- Footer -->
          <div style="text-align: center;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
              Thank you for being an essential part of our mission!
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Food Bridge Initiative. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const payload = JSON.stringify({
    sender: {
      name: "Food Bridge Official",
      email: process.env.BREVO_EMAIL || "noreply@foodbridge.org"
    },
    to: [
      {
        email: email,
        name: name
      }
    ],
    subject: `Your Food Bridge Login Verification Code (${roleDisplay})`,
    htmlContent: htmlContent
  });

  try {
    const https = require('https');
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // The user saved their API key under the variable name BREVO_SMTP_KEY
        'api-key': process.env.BREVO_SMTP_KEY,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ OTP Email successfully sent via Brevo API to: ${email}`);
          } else {
            console.error(`❌ Brevo API Error (${res.statusCode}):`, data);
          }
          resolve(true);
        });
      });

      req.on('error', (error) => {
        console.error('❌ Network Error sending OTP Email via Brevo:', error);
        resolve(true);
      });

      req.write(payload);
      req.end();
    });
  } catch (error) {
    console.error("❌ Email error:", error);
    return true;
  }
};

const isOTPExpired = (otpExpiry) => {
  return new Date() > new Date(otpExpiry);
};

module.exports = { generateOTP, getOTPExpiry, sendOTP, isOTPExpired };
