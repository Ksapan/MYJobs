import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    logo: { type: String, default: '' },
    location: { type: String, default: 'India' },
    country: { type: String, default: 'India' },
    employmentType: { type: String, default: 'Full Time' },
    platformBadge: { type: String, default: 'ATS Standard' },
    description: { type: String, default: '' },
    applyLink: { type: String, default: '' },
    source: { type: String, default: 'Synced' },
    requiredSkills: [{ type: String }],
    postedDate: { type: Date, default: Date.now },
    searchKeywords: [{ type: String, index: true }]
  },
  { timestamps: true }
);

// Fast text search and date ordering
JobSchema.index({ createdAt: -1 });
JobSchema.index({ title: 'text', company: 'text', location: 'text', description: 'text' });

export default mongoose.model('Job', JobSchema);
