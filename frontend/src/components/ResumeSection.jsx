import { useState, useRef } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';
import '../styles/Resume.css';

const API_BASE = 'http://localhost:5000/api';

export default function ResumeSection({ token, user, resumeData, onResumeUploaded, onViewJobs }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post(`${API_BASE}/resume/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      onResumeUploaded(res.data.data);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const rawAnalysis = resumeData?.analysis || {};

  // Normalize data safely to handle both nested schema and flat schema
  const personal = rawAnalysis.personalInfo || {};
  const metrics = rawAnalysis.metrics || {};
  const skillsObj = rawAnalysis.skills || {};

  const candidateName = personal.fullName || rawAnalysis.candidateName || user?.name || 'Candidate';
  const headline = personal.headline || rawAnalysis.headline || 'Software Professional';
  const summary = personal.summary || rawAnalysis.summary || '';
  const resumeScore = metrics.resumeScore || rawAnalysis.resumeScore || 85;
  const experienceYears = metrics.totalExperienceYears || rawAnalysis.experienceYears || (rawAnalysis.workExperience?.length ? rawAnalysis.workExperience.length * 1.5 : 2);

  const suggestedJobRoles = metrics.suggestedJobRoles || rawAnalysis.suggestedJobRoles || [];
  const recommendedSearchKeywords = metrics.recommendedKeywords || rawAnalysis.recommendedSearchKeywords || [];

  const topSkills = skillsObj.topSkills || rawAnalysis.topSkills || [];
  const technicalSkills = Array.from(new Set([
    ...(skillsObj.technicalSkills || []),
    ...(skillsObj.frameworksAndLibraries || []),
    ...(skillsObj.toolsAndPlatforms || []),
    ...(skillsObj.databases || [])
  ])).filter(Boolean);
  const displayTechnicalSkills = technicalSkills.length > 0 ? technicalSkills : (rawAnalysis.technicalSkills || []);

  const softSkills = skillsObj.softSkills || rawAnalysis.softSkills || ['Agile Collaboration', 'System Architecture', 'Problem Solving'];
  const workExperience = rawAnalysis.workExperience || [];
  const projects = rawAnalysis.projects || [];
  const certifications = rawAnalysis.certifications || [];
  const education = rawAnalysis.education || [];

  const strengths = metrics.strengths || rawAnalysis.strengths || [
    'Strong full-stack foundations and microservices architecture',
    'Demonstrated hands-on experience with modern JavaScript / TypeScript ecosystems',
    'Solid database optimization and API integration background'
  ];

  const areasForImprovement = metrics.areasForImprovement || rawAnalysis.areasForImprovement || [
    'Add live deployment links and demos for key projects',
    'Include quantifiable impact metrics (% performance gains, active users) in past roles'
  ];

  const hasAnalysis = Boolean(rawAnalysis && (personal.fullName || rawAnalysis.candidateName || workExperience.length > 0 || skillsObj.topSkills?.length > 0));

  return (
    <div className="resume-section-container">
      {/* Upload Box (Mandatory for first time, or for re-uploading) */}
      {(!user?.hasUploadedResume || !hasAnalysis) && (
        <div className="onboarding-banner">
          <div className="onboarding-info">
            <h2>Welcome, {user?.name}! First step: Upload your Resume</h2>
            <p>
              To discover matching jobs in your target cities and evaluate your strengths, please upload your PDF resume. Our ultra-fast Groq AI engine will break it down into clean categorized skills, experience, and keywords.
            </p>
          </div>
        </div>
      )}

      <div
        className={`resume-upload-zone ${dragActive ? 'dragging' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />
        <div className="upload-icon-circle">
          {uploading ? <RefreshCw className="animate-spin" size={28} /> : <UploadCloud size={28} />}
        </div>
        <p className="upload-prompt-text">
          {uploading ? 'Analyzing resume with Groq AI...' : 'Click or drag & drop your resume (PDF or TXT)'}
        </p>
        <p className="upload-sub-text">Max file size 10MB • Structured parsing into categories</p>
      </div>

      {uploadError && (
        <div style={{ color: 'var(--danger)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} /> {uploadError}
        </div>
      )}

      {/* Categorized Resume Insights View */}
      {hasAnalysis && (
        <div className="analysis-view-wrapper">
          {/* Header Profile Meta */}
          <div className="analysis-header-card">
            <div className="candidate-profile-meta">
              <h1>{candidateName}</h1>
              <div className="candidate-headline">{headline}</div>
              {summary && <p className="candidate-summary">{summary}</p>}
            </div>
            <div className="score-widget">
              <div className="score-number">{resumeScore}</div>
              <div className="score-label">Resume Score</div>
              <button
                type="button"
                onClick={onViewJobs}
                className="btn-primary-green"
                style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
              >
                <Search size={14} /> View Jobs
              </button>
            </div>
          </div>

          {/* Categorized Grid */}
          <div className="analysis-grid">
            {/* Top Recommended Roles & Keywords */}
            {(suggestedJobRoles.length > 0 || recommendedSearchKeywords.length > 0) && (
              <div className="analysis-card col-12">
                <div className="card-title">
                  <Sparkles size={18} color="#15803d" />
                  Target Job Roles & Matched Search Keywords
                </div>
                <div className="tag-cloud">
                  {suggestedJobRoles.map((role, idx) => (
                    <span key={idx} className="tag-pill secondary">
                      🎯 {role}
                    </span>
                  ))}
                  {recommendedSearchKeywords.map((kw, idx) => (
                    <span key={idx} className="tag-pill primary">
                      🔍 {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Skills Category */}
            <div className="analysis-card col-8">
              <div className="card-title">
                <Award size={18} color="#15803d" />
                Categorized Technical Stack & Skills
              </div>
              {topSkills.length > 0 && (
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Core Competencies
                  </span>
                  <div className="tag-cloud" style={{ marginTop: '8px' }}>
                    {topSkills.map((s, idx) => (
                      <span key={idx} className="tag-pill primary">
                        ★ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {displayTechnicalSkills.length > 0 && (
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    All Technical Skills & Frameworks
                  </span>
                  <div className="tag-cloud" style={{ marginTop: '8px' }}>
                    {displayTechnicalSkills.map((s, idx) => (
                      <span key={idx} className="tag-pill">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Soft Skills & Experience Badge */}
            <div className="analysis-card col-4">
              <div className="card-title">
                <Sparkles size={18} color="#15803d" />
                Soft Skills & Experience
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Est. Experience:</strong> {experienceYears} Years
              </div>
              <div className="tag-cloud">
                {softSkills.map((ss, idx) => (
                  <span key={idx} className="tag-pill secondary">
                    ✓ {ss}
                  </span>
                ))}
              </div>
            </div>

            {/* Work History */}
            <div className="analysis-card col-8">
              <div className="card-title">
                <Briefcase size={18} color="#15803d" />
                Experience History
              </div>
              {workExperience.length > 0 ? (
                workExperience.map((exp, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-role">{exp.role}</div>
                    <div className="timeline-company">{exp.company}</div>
                    <div className="timeline-duration">{exp.duration}</div>
                    {exp.details && <div className="timeline-desc">{exp.details}</div>}
                    {exp.bullets && exp.bullets.length > 0 && (
                      <ul style={{ margin: '8px 0 0 16px', fontSize: '13px', color: '#52525b', lineHeight: 1.5 }}>
                        {exp.bullets.map((b, bIdx) => (
                          <li key={bIdx} style={{ marginBottom: '4px' }}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No direct experience items parsed.</p>
              )}
            </div>

            {/* Strengths & Improvements */}
            <div className="analysis-card col-4">
              <div className="card-title">
                <CheckCircle2 size={18} color="#15803d" />
                HR Evaluation Notes
              </div>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Key Strengths</span>
                <ul className="bullet-list" style={{ marginTop: '8px' }}>
                  {strengths.map((str, idx) => (
                    <li key={idx} className="bullet-item strength">
                      <CheckCircle2 size={16} /> <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Actionable Improvements</span>
                <ul className="bullet-list" style={{ marginTop: '8px' }}>
                  {areasForImprovement.map((imp, idx) => (
                    <li key={idx} className="bullet-item improvement">
                      <AlertCircle size={16} /> <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Projects Showcase */}
            {projects.length > 0 && (
              <div className="analysis-card col-12">
                <div className="card-title">
                  <FileText size={18} color="#15803d" />
                  Key Projects & Systems
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {projects.map((proj, idx) => (
                    <div key={idx} style={{ padding: '16px', background: 'var(--bg-subtle)', borderRadius: '10px', border: '1px solid #e4e4e7' }}>
                      <div style={{ fontWeight: 800, fontSize: '14.5px', color: '#09090b', marginBottom: '6px' }}>{proj.title}</div>
                      <p style={{ fontSize: '13px', color: '#52525b', lineHeight: 1.55, marginBottom: '10px' }}>{proj.description}</p>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="tag-cloud">
                          {proj.technologies.map((t, tIdx) => (
                            <span key={tIdx} className="tag-pill" style={{ fontSize: '11px', padding: '2px 8px' }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education History & Certifications */}
            {(education.length > 0 || certifications.length > 0) && (
              <div className="analysis-card col-12">
                <div className="card-title">
                  <GraduationCap size={18} color="#15803d" />
                  Education & Certifications
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {education.map((edu, idx) => (
                    <div key={`edu-${idx}`} style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#09090b' }}>{edu.degree}</div>
                      <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>{edu.institution}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{edu.year}</div>
                    </div>
                  ))}
                  {certifications.map((cert, idx) => (
                    <div key={`cert-${idx}`} style={{ padding: '14px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid #e4e4e7' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#09090b' }}>{cert.name}</div>
                      <div style={{ fontSize: '13px', color: '#15803d', fontWeight: 600 }}>{cert.issuer || 'Professional Certification'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{cert.issueDate || cert.duration || 'Completed'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
