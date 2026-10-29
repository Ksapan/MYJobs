import express from 'express';
import Groq from 'groq-sdk';
import { authMiddleware } from '../middleware/auth.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';
import { getSemanticEmbedding, cosineSimilarity, deduplicateBullets } from '../utils/vectorEngine.js';

const router = express.Router();

/**
 * Deterministic Keyword Match Engine
 */
function runMathMatchEngine(resume, job) {
  const analysis = resume?.analysis || {};
  const skillsObj = analysis.skills || {};

  const candidateSkills = new Set(
    [
      ...(skillsObj.topSkills || []),
      ...(skillsObj.technicalSkills || []),
      ...(skillsObj.frameworksAndLibraries || []),
      ...(skillsObj.toolsAndPlatforms || []),
      ...(skillsObj.databases || []),
      ...(skillsObj.softSkills || []),
      ...(analysis.topSkills || []),
      ...(analysis.technicalSkills || [])
    ].map((s) => s.toLowerCase().trim())
  );

  const jobTitle = (job.job_title || '').toLowerCase();
  const jobDesc = (job.job_description || '').toLowerCase();
  const jobFullText = `${jobTitle} ${jobDesc}`;

  const COMMON_KEYWORDS = [
    'react', 'node.js', 'nodejs', 'express', 'mongodb', 'javascript', 'typescript',
    'python', 'java', 'c++', 'c#', 'aws', 'docker', 'kubernetes', 'sql', 'nosql',
    'postgres', 'mysql', 'git', 'redux', 'next.js', 'vue', 'angular', 'graphql',
    'rest api', 'ci/cd', 'agile', 'scrum', 'html5', 'css3', 'tailwind', 'microservices',
    'system design', 'redis', 'kafka', 'testing', 'jest', 'devops', 'linux', 'prisma',
    'fastapi', 'django', 'spring boot'
  ];

  const matchedKeywords = [];
  const missingKeywords = [];

  COMMON_KEYWORDS.forEach((kw) => {
    if (jobFullText.includes(kw)) {
      if (candidateSkills.has(kw) || Array.from(candidateSkills).some((cs) => cs.includes(kw))) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    }
  });

  const totalRequired = matchedKeywords.length + missingKeywords.length;
  const matchRatio = totalRequired > 0 ? (matchedKeywords.length / totalRequired) : 0.7;
  const baselineScore = Math.min(95, Math.max(38, Math.round(matchRatio * 100)));
  const targetPotentialScore = Math.min(98, baselineScore + Math.min(30, missingKeywords.length * 5));

  return {
    baselineScore,
    targetPotentialScore,
    matchedKeywords,
    missingKeywords,
    totalScanned: totalRequired
  };
}

/**
 * Enhanced Deterministic ATS Optimizer with:
 * 1. Vector Embeddings: Routes bullet points to the most semantically relevant experience/project.
 * 2. Environment Tech Stack Badges: Attaches explicit tech tags to each job role & project.
 * 3. Strict Deduplication: Prevents repeated or overlapping bullet points.
 */
router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    const { job } = req.body;
    if (!job || !job.job_title) {
      return res.status(400).json({ message: 'Target job information is required.' });
    }

    const user = await User.findById(req.userId);
    const resumeDoc = await ResumeAnalysis.findOne({ userId: req.userId });

    if (!resumeDoc || !resumeDoc.analysis) {
      return res.status(400).json({
        message: 'No resume found. Please upload your resume first.'
      });
    }

    const mathResults = runMathMatchEngine(resumeDoc, job);
    const analysis = resumeDoc.analysis;
    const personal = analysis.personalInfo || {};
    const links = analysis.links || {};
    const skills = analysis.skills || {};

    const jobFullText = `${job.job_title} ${job.job_description || ''}`;
    const jobEmbedding = getSemanticEmbedding(jobFullText);

    // Call Groq to generate targeted bullet points with relevant environment tech tags
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const prompt = `
You are an expert ATS Optimization Engine.
Target Job: ${job.job_title} at ${job.employer_name || 'Hiring Company'}.
Missing Critical Skill Gaps: ${mathResults.missingKeywords.slice(0, 6).join(', ') || 'Docker, CI/CD, Redis'}.

Generate:
1. Two unique, quantified accomplishment bullet points addressing these gaps without duplicating existing tasks.
2. A list of 4-6 specific technologies representing the Environment Tech Stack for this role.
3. A 2-sentence executive summary.

Output ONLY valid JSON matching this schema:
{
  "tailoredHeadline": "${personal.headline || job.job_title} | Aligned to ${job.job_title}",
  "tailoredSummary": "2-3 sentence summary highlighting experience and alignment with ${job.job_title}.",
  "environmentTechStack": ["React", "Node.js", "Docker", "Redis", "AWS", "PostgreSQL"],
  "injectedBullets": [
    "Architected high-throughput services utilizing ${mathResults.missingKeywords[0] || 'Redis caching'}, decreasing query latency by 28% across critical endpoints.",
    "Streamlined deployment cycles by implementing ${mathResults.missingKeywords[1] || 'CI/CD automated pipelines'}, reducing build turnaround time by 34%."
  ]
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an elite resume engineer. Always output strictly valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const aiSnippets = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');

    const candidateName = personal.fullName || analysis.candidateName || user.name;
    const existingWork = Array.isArray(analysis.workExperience) && analysis.workExperience.length > 0
      ? analysis.workExperience
      : [{ role: 'Software Engineer', company: 'Technology Firm', duration: '2022 - Present', bullets: ['Engineered scalable full-stack web applications.'] }];

    // Use Vector Semantic Embeddings to find the best role/project to inject the bullet points
    let bestExpIndex = 0;
    let highestSim = -1;

    existingWork.forEach((exp, idx) => {
      const expText = `${exp.role} ${exp.company} ${(exp.bullets || []).join(' ')} ${exp.details || ''}`;
      const expVec = getSemanticEmbedding(expText);
      const sim = cosineSimilarity(jobEmbedding, expVec);
      if (sim > highestSim) {
        highestSim = sim;
        bestExpIndex = idx;
      }
    });

    // Experience with Environment Tech Stack & Deduplicated Bullets
    const optimizedExperience = existingWork.map((exp, idx) => {
      let rawBullets = exp.bullets && exp.bullets.length > 0
        ? [...exp.bullets]
        : (exp.details ? exp.details.split(/\.\s+/).filter(Boolean) : []);

      // Inject into the most semantically relevant role
      if (idx === bestExpIndex && aiSnippets.injectedBullets?.length > 0) {
        rawBullets = [...aiSnippets.injectedBullets, ...rawBullets];
      }

      // Deduplicate all bullets
      const cleanBullets = deduplicateBullets(rawBullets);

      // Environment Tech Stack for this work role
      const roleEnvStack = idx === bestExpIndex && aiSnippets.environmentTechStack?.length > 0
        ? aiSnippets.environmentTechStack
        : ['JavaScript', 'React', 'Node.js', 'REST APIs', 'Git'];

      return {
        role: exp.role || 'Software Engineer',
        company: exp.company || 'Company',
        location: exp.location || '',
        duration: exp.duration || '2022 - Present',
        environmentTech: roleEnvStack,
        bullets: cleanBullets.slice(0, 5)
      };
    });

    // Injected Skills
    const coreLanguages = Array.from(new Set([
      ...(skills.technicalSkills || analysis.topSkills || []),
      'JavaScript', 'TypeScript'
    ]));

    const frameworks = Array.from(new Set([
      ...(skills.frameworksAndLibraries || analysis.technicalSkills || []),
      'React', 'Node.js', 'Express'
    ]));

    const toolsPlatforms = Array.from(new Set([
      ...(skills.toolsAndPlatforms || []),
      ...mathResults.missingKeywords.slice(0, 5),
      'Git', 'Postman'
    ]));

    // Projects with Deduplicated Descriptions and Tech Tags
    const optimizedProjects = (analysis.projects || []).map((p) => ({
      title: p.title,
      description: p.description,
      technologies: p.technologies?.length > 0 ? p.technologies : ['React', 'Node.js', 'MongoDB'],
      liveLink: p.liveLink || '',
      githubLink: p.githubLink || ''
    }));

    const tailoredResume = {
      personalInfo: {
        fullName: candidateName,
        headline: aiSnippets.tailoredHeadline || personal.headline || job.job_title,
        email: personal.email || user.email,
        phone: personal.phone || '',
        location: personal.location || job.job_city || user.preferredLocation || 'India',
        summary: aiSnippets.tailoredSummary || personal.summary
      },
      links: {
        linkedin: links.linkedin || '',
        github: links.github || '',
        portfolio: links.portfolio || '',
        otherLinks: links.otherLinks || []
      },
      categorizedSkills: {
        languages: coreLanguages.slice(0, 8),
        frameworks: frameworks.slice(0, 8),
        toolsAndCloud: toolsPlatforms.slice(0, 8),
        databases: (skills.databases || ['MongoDB', 'PostgreSQL']).slice(0, 6),
        softSkills: skills.softSkills?.length ? skills.softSkills : ['Agile Collaboration', 'System Architecture', 'Problem Solving']
      },
      optimizedExperience,
      projects: optimizedProjects,
      certifications: analysis.certifications || [],
      education: analysis.education || [{ degree: 'Bachelor of Technology', institution: 'University', year: 'Completed' }],
      achievements: analysis.achievements || [],
      gapAnalysis: {
        missingCriticalKeywords: mathResults.missingKeywords,
        vectorMatchScore: Math.round(highestSim * 100),
        matchExplanation: `Semantic vector embedding placed the tailored bullet points into your most relevant role (${existingWork[bestExpIndex]?.role} at ${existingWork[bestExpIndex]?.company}) and added Environment Tech Stack tags with zero duplicate bullets.`
      }
    };

    res.json({
      success: true,
      jobTitle: job.job_title,
      employerName: job.employer_name,
      mathEngine: mathResults,
      candidateName,
      tailoredResume
    });
  } catch (error) {
    console.error('Vector ATS Optimization Error:', error);
    res.status(500).json({
      message: error.message || 'Error executing vector ATS resume optimization.'
    });
  }
});

export default router;
