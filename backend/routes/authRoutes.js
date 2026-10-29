import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OtpVerification from '../models/OtpVerification.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendOtpEmail } from '../utils/emailService.js';

const router = express.Router();

/**
 * 1. STEP 1: REQUEST SIGNUP OTP
 * Validates inputs, hashes password, stores temporary OTP record.
 * DOES NOT save user account in User collection!
 */
router.post('/signup-request-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields (Name, Email, Password) are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if account already exists in permanent DB
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the password so it's ready upon verification
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save or update pending OTP document in temporary collection
    await OtpVerification.findOneAndUpdate(
      { email: cleanEmail },
      {
        email: cleanEmail,
        name: name.trim(),
        password: hashedPassword,
        otp,
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send styled branded HTML email via Gmail SMTP
    await sendOtpEmail(cleanEmail, name, otp);

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please enter the 6-digit code.`,
      email: cleanEmail
    });
  } catch (error) {
    console.error('Request OTP Error:', error);
    res.status(500).json({ message: error.message || 'Failed to send verification email.' });
  }
});

/**
 * 2. STEP 2: VERIFY OTP AND CREATE PERMANENT ACCOUNT
 * Only creates and saves user in DB if OTP matches and has not expired!
 */
router.post('/signup-verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and 6-digit OTP code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // Find the pending verification record
    const pendingRecord = await OtpVerification.findOne({ email: cleanEmail });
    if (!pendingRecord) {
      return res.status(400).json({
        message: 'No pending registration found or the OTP has expired. Please sign up again.'
      });
    }

    // Check expiration
    if (new Date() > new Date(pendingRecord.expiresAt)) {
      await OtpVerification.deleteOne({ _id: pendingRecord._id });
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Validate OTP match
    if (pendingRecord.otp !== cleanOtp) {
      return res.status(400).json({ message: 'Incorrect 6-digit code. Please check your email and try again.' });
    }

    // FINAL STEP: Create and save account in MongoDB User collection
    const newUser = new User({
      name: pendingRecord.name,
      email: pendingRecord.email,
      password: pendingRecord.password,
      hasUploadedResume: false,
      preferredLocation: 'India'
    });
    await newUser.save();

    // Remove the temporary OTP record
    await OtpVerification.deleteOne({ _id: pendingRecord._id });

    // Issue JWT token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d'
    });

    res.status(201).json({
      success: true,
      message: 'Account successfully verified and created!',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        hasUploadedResume: newUser.hasUploadedResume,
        preferredLocation: newUser.preferredLocation
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Failed to verify OTP.' });
  }
});

/**
 * RESEND SIGNUP OTP
 */
router.post('/signup-resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const cleanEmail = email.toLowerCase().trim();
    const pendingRecord = await OtpVerification.findOne({ email: cleanEmail });

    if (!pendingRecord) {
      return res.status(400).json({ message: 'No active registration found. Please sign up again.' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingRecord.otp = newOtp;
    pendingRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pendingRecord.save();

    await sendOtpEmail(cleanEmail, pendingRecord.name, newOtp);

    res.json({ success: true, message: 'New verification code sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend code.' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '7d'
    });

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasUploadedResume: user.hasUploadedResume,
        preferredLocation: user.preferredLocation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET CURRENT USER PROFILE
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
});

// UPDATE PREFERRED LOCATION
router.put('/location', authMiddleware, async (req, res) => {
  try {
    const { preferredLocation } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { preferredLocation: preferredLocation || 'India' },
      { new: true }
    ).select('-password');
    res.json({ message: 'Location updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update location preference.' });
  }
});

export default router;
