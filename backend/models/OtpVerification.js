import mongoose from 'mongoose';

const OtpVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    password: { type: String, required: true }, // Hashed password ready for user creation
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } } // Auto-deletes via MongoDB TTL index
  },
  { timestamps: true }
);

export default mongoose.model('OtpVerification', OtpVerificationSchema);

