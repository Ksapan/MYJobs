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
 * Send Clean, Minimalist & Professional Branded HTML Email
 * Clean white background with black & light-green theme accents.
 */
export async function sendOtpEmail(recipientEmail, userName, otp) {
  const transporter = getTransporter();

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code - MyJobs</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);">
          
          <!-- Top Accent Line in Light Green -->
          <tr>
            <td style="height: 4px; background: #22c55e;"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 32px 36px 20px; border-bottom: 1px solid #f4f4f5;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <div style="display: inline-block; font-size: 20px; font-weight: 800; color: #000000; letter-spacing: -0.5px;">
                      MyJobs <span style="color: #22c55e;">•</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; font-weight: 600; color: #71717a; text-transform: uppercase; letter-spacing: 0.5px;">Verification</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Section -->
          <tr>
            <td style="padding: 28px 36px 32px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              
              <p style="font-size: 14.5px; line-height: 1.6; color: #52525b; margin: 0 0 24px;">
                Hi <strong>${userName}</strong>,
              </p>
              
              <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 24px;">
                Use the verification code below to complete your registration on MyJobs.
              </p>

              <!-- Clean OTP Code Display Box -->
              <div style="background-color: #fafafa; border: 1.5px solid #e4e4e7; border-left: 4px solid #22c55e; border-radius: 8px; padding: 18px 24px; margin: 24px 0;">
                <div style="font-size: 11px; font-weight: 700; color: #71717a; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
                  Your 6-Digit Code
                </div>
                <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #000000; font-family: ui-monospace, Menlo, Monaco, 'Courier New', monospace;">
                  ${otp}
                </div>
              </div>

              <p style="font-size: 13px; line-height: 1.5; color: #71717a; margin: 0 0 8px;">
                This code expires in <strong>10 minutes</strong>. If you did not request this, you can ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="padding: 20px 36px; background-color: #fafafa; border-top: 1px solid #f4f4f5; text-align: center;">
              <p style="font-size: 12px; color: #a1a1aa; margin: 0; line-height: 1.5;">
                © MyJobs Portal • AI-Powered Career Platform<br>
                Bangalore, India
              </p>
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
    from: `"MyJobs" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `${otp} is your MyJobs verification code`,
    html: htmlTemplate
  };

  return transporter.sendMail(mailOptions);
}
