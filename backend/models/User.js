import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    hasUploadedResume: { type: Boolean, default: false },
    preferredLocation: { type: String, default: 'India' }
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);

