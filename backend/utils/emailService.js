import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure .env is always loaded before configuring SMTP
dotenv.config();

/**
 * Configure Gmail SMTP Transporter (Lazy / Dynamic to ensure fresh env variables)
 */
function getTransporter() {
  const user = (process.env.EMAIL_USER || '').trim();
  const pass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '').trim();

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    }
  });
}

/**
 * Send Aesthetic Branded HTML Email with OTP
 */
export async function sendOtpEmail(recipientEmail, userName, otp) {
  const transporter = getTransporter();

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your MyJobs Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #0d0d0d; border: 1px solid #262626; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 40px; background: radial-gradient(circle at 10% 20%, #171717 0%, #050505 100%); border-bottom: 1px solid #222222; text-align: center;">
              <div style="display: inline-block; width: 44px; height: 44px; background: #000000; border: 1.5px solid #22c55e; border-radius: 12px; line-height: 44px; text-align: center; color: #4ade80; font-size: 20px; font-weight: 800; box-shadow: 0 0 16px rgba(34, 197, 94, 0.35);">
                💼
              </div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 12px 0 4px; letter-spacing: -0.5px;">MyJobs Portal</h1>
              <p style="color: #4ade80; font-size: 13px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 0.8px;">AI Career & ATS Matching</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px; text-align: left;">
              <h2 style="color: #ffffff; font-size: 19px; font-weight: 700; margin: 0 0 12px;">Verify your email address</h2>
              <p style="color: #a1a1aa; font-size: 14.5px; line-height: 1.6; margin: 0 0 24px;">
                Hello <strong style="color: #ffffff;">${userName}</strong>,<br>
                Thank you for joining MyJobs. Enter the single-use 6-digit verification code below to activate your account and access AI resume analysis & India tech jobs.
              </p>

              <!-- OTP Display Box -->
              <div style="background-color: #000000; border: 1.5px dashed #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);">
                <div style="color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Your 6-Digit Verification Code</div>
                <div style="color: #4ade80; font-size: 34px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
                  ${otp}
                </div>
              </div>

              <p style="color: #71717a; font-size: 12.5px; line-height: 1.5; margin: 0 0 24px;">
                ⏳ This code is valid for <strong>10 minutes</strong>. For your security, never share this OTP with anyone. If you did not create this account, you can safely ignore this email.
              </p>

              <div style="border-top: 1px solid #1f1f1f; padding-top: 20px; text-align: center;">
                <p style="color: #52525b; font-size: 12px; margin: 0;">
                  Protected with encrypted zero-loss storage • Bangalore, India
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const mailOptions = {
    from: `"MyJobs Portal" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `${otp} is your MyJobs verification code`,
    html: htmlTemplate
  };

  return transporter.sendMail(mailOptions);
}
