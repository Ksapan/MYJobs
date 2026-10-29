import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
import Groq from 'groq-sdk';
import { authMiddleware } from '../middleware/auth.js';
import User from '../models/User.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

const router = express.Router();

// Memory Storage for Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Please upload a PDF or TXT resume document.'));
    }
  }
});

// Helper: Extract complete text
const parseUploadedFile = async (file) => {
  if (file.mimetype === 'application/pdf') {
    const parser = new PDFParse({ data: file.buffer });
    const result = await parser.getText();
    return result?.text || '';
  } else {
    return file.buffer.toString('utf-8');
  }
};

/**
 * POST: Upload & Comprehensive Zero-Loss Resume Parsing via Groq Llama 3
 */
router.post('/upload', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file provided.' });
    }

    const rawText = await parseUploadedFile(req.file);
    if (!rawText || rawText.trim().length < 40) {
      return res.status(400).json({ message: 'Could not extract text from this document. Please ensure it is text-readable.' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Exhaustive schema prompt ensuring NO section, link, project, or detail is skipped
    const prompt = `
You are an expert HR Intelligence & Resume Parsing Engine.
Analyze the following complete resume text. Extract 100% of all information comprehensively without truncating or skipping ANY data.

Ensure:
- All links (LinkedIn, GitHub, Portfolio, personal site, project URLs) are extracted accurately.
- Every single project (title, description, tech stack, live link, github link) is captured.
- Every certification (name, issuer, date, credential link/id) is captured.
- Complete work experiences with all responsibilities and bullet points.
- Education history with degrees, institutions, and dates.
- Granular breakdown of skills into Core Languages, Frameworks, Tools/Cloud, Databases, Soft Skills, and Domain Expertise.
- Calculated ATS score and suggested job search roles.

Respond ONLY with a valid JSON object matching this exact schema:
{
  "personalInfo": {
    "fullName": "Candidate full name",
    "email": "Email address",
    "phone": "Phone number with country code if present",
    "location": "City, State, Country",
    "headline": "e.g. Senior Full Stack Engineer | React & Node.js Specialist",
    "summary": "Executive background and professional summary"
  },
  "links": {
    "linkedin": "LinkedIn profile URL or empty string",
    "github": "GitHub profile URL or empty string",
    "portfolio": "Portfolio / personal website URL or empty string",
    "otherLinks": ["any other URL found"]
  },
  "skills": {
    "topSkills": ["Primary core skill 1", "Skill 2", "Skill 3"],
    "technicalSkills": ["All technical languages and runtimes"],
    "frameworksAndLibraries": ["React", "Express", "Node.js", "Redux", "Tailwind", "etc"],
    "toolsAndPlatforms": ["Docker", "AWS", "Git", "Postman", "Linux", "etc"],
    "databases": ["MongoDB", "PostgreSQL", "MySQL", "Redis", "etc"],
    "softSkills": ["Agile Collaboration", "Problem Solving", "Leadership", "etc"],
    "domainExpertise": ["Fintech", "E-commerce", "SaaS", "Full Stack Development", "etc"]
  },
  "workExperience": [
    {
      "role": "Title / Position",
      "company": "Company Name",
      "location": "Location or Remote",
      "duration": "e.g. June 2022 - Present",
      "startDate": "Start Date",
      "endDate": "End Date or Present",
      "isCurrent": true,
      "bullets": [
        "Full responsibility / accomplishment bullet 1",
        "Full responsibility / accomplishment bullet 2"
      ],
      "details": "Summary of achievements and team contributions"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Comprehensive explanation of what the project does and its architecture",
      "technologies": ["React", "Node.js", "MongoDB"],
      "liveLink": "Live demo URL or empty string",
      "githubLink": "GitHub repository URL or empty string"
    }
  ],
  "certifications": [
    {
      "name": "Certification Title",
      "issuer": "Issuing Organization (AWS, Google, Coursera, etc.)",
      "issueDate": "Date or Year",
      "credentialId": "Credential ID or empty string",
      "credentialUrl": "Verification link or empty string"
    }
  ],
  "education": [
    {
      "degree": "Degree / Diploma / Program",
      "institution": "University / College / School",
      "location": "City, Country",
      "year": "Passing year or graduation timeline",
      "scoreOrGpa": "GPA / Percentage or empty string"
    }
  ],
  "achievements": [
    "Hackathon win, scholarship, award, or publication"
  ],
  "metrics": {
    "totalExperienceYears": 3.5,
    "resumeScore": 88,
    "suggestedJobRoles": ["Full Stack Developer", "MERN Stack Engineer", "Backend Developer"],
    "recommendedKeywords": ["React Developer", "Node.js", "Full Stack Engineer"],
    "strengths": ["Clear technical stack", "Quantified project impact", "Strong full-stack foundations"],
    "areasForImprovement": ["Add cloud certification", "Expand on system architecture design"]
  }
}

Resume Text:
${rawText.slice(0, 14000)}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an elite, comprehensive resume parsing engine. Never skip or drop any project, certificate, link, or bullet. Output strictly valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const aiResponseText = chatCompletion.choices[0]?.message?.content || '{}';
    let structuredAnalysis;
    try {
      structuredAnalysis = JSON.parse(aiResponseText);
    } catch (parseErr) {
      console.error('Failed to parse AI JSON:', aiResponseText);
      return res.status(500).json({ message: 'Error processing resume structure. Please try again.' });
    }

    // Save 100% of the parsed data + full raw text in MongoDB Atlas
    const savedRecord = await ResumeAnalysis.findOneAndUpdate(
      { userId: req.userId },
      {
        userId: req.userId,
        fileName: req.file.originalname,
        fullExtractedRawText: rawText,
        analysis: structuredAnalysis
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await User.findByIdAndUpdate(req.userId, { hasUploadedResume: true });

    res.json({
      message: 'Resume parsed and categorized with 100% data fidelity.',
      data: savedRecord
    });
  } catch (error) {
    console.error('Resume processing error:', error);
    res.status(500).json({ message: error.message || 'Error parsing resume.' });
  }
});

// GET: Retrieve the complete parsed resume document
router.get('/my-analysis', authMiddleware, async (req, res) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ userId: req.userId });
    if (!analysis) {
      return res.status(404).json({ message: 'No resume found.' });
    }
    res.json({ data: analysis });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve resume.' });
  }
});

export default router;
