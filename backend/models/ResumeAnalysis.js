import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  technologies: [{ type: String }],
  liveLink: { type: String, default: '' },
  githubLink: { type: String, default: '' }
}, { _id: false });

const CertificationSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  issuer: { type: String, default: '' },
  issueDate: { type: String, default: '' },
  credentialId: { type: String, default: '' },
  credentialUrl: { type: String, default: '' }
}, { _id: false });

const WorkExperienceSchema = new mongoose.Schema({
  role: { type: String, default: '' },
  company: { type: String, default: '' },
  location: { type: String, default: '' },
  duration: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  isCurrent: { type: Boolean, default: false },
  bullets: [{ type: String }],
  details: { type: String, default: '' }
}, { _id: false });

const EducationSchema = new mongoose.Schema({
  degree: { type: String, default: '' },
  institution: { type: String, default: '' },
  location: { type: String, default: '' },
  year: { type: String, default: '' },
  scoreOrGpa: { type: String, default: '' }
}, { _id: false });

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fileName: { type: String, required: true },
    fullExtractedRawText: { type: String, default: '' }, // Stores 100% of the raw parsed text
    
    analysis: {
      // 1. Personal & Contact Profile
      personalInfo: {
        fullName: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        location: { type: String, default: '' },
        headline: { type: String, default: '' },
        summary: { type: String, default: '' }
      },

      // 2. Links & Social Profiles
      links: {
        linkedin: { type: String, default: '' },
        github: { type: String, default: '' },
        portfolio: { type: String, default: '' },
        otherLinks: [{ type: String }]
      },

      // 3. Complete Categorized Skills
      skills: {
        topSkills: [{ type: String }],
        technicalSkills: [{ type: String }],
        frameworksAndLibraries: [{ type: String }],
        toolsAndPlatforms: [{ type: String }],
        databases: [{ type: String }],
        softSkills: [{ type: String }],
        domainExpertise: [{ type: String }]
      },

      // 4. Detailed Work Experience
      workExperience: [WorkExperienceSchema],

      // 5. Projects
      projects: [ProjectSchema],

      // 6. Certifications & Licenses
      certifications: [CertificationSchema],

      // 7. Education
      education: [EducationSchema],

      // 8. Achievements, Publications & Awards
      achievements: [{ type: String }],

      // 9. ATS Scoring & Market Metrics
      metrics: {
        totalExperienceYears: { type: Number, default: 0 },
        resumeScore: { type: Number, default: 80 },
        suggestedJobRoles: [{ type: String }],
        recommendedKeywords: [{ type: String }],
        strengths: [{ type: String }],
        areasForImprovement: [{ type: String }]
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
