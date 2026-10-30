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

  const analysis = resumeData?.analysis;

  return (
    <div className="resume-section-container">
      {/* Upload Box (Mandatory for first time, or for re-uploading) */}
      {(!user?.hasUploadedResume || !analysis) && (
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
      {analysis && (
        <div className="analysis-view-wrapper">
          {/* Header Profile Meta */}
          <div className="analysis-header-card">
            <div className="candidate-profile-meta">
              <h1>{analysis.candidateName || user?.name}</h1>
              <div className="candidate-headline">{analysis.headline || 'Software Professional'}</div>
              <p className="candidate-summary">{analysis.summary}</p>
            </div>
            <div className="score-widget">
              <div className="score-number">{analysis.resumeScore || 85}</div>
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
            <div className="analysis-card col-12">
              <div className="card-title">
                <Sparkles size={18} color="#15803d" />
                Target Job Roles & Matched Search Keywords
              </div>
              <div className="tag-cloud">
                {analysis.suggestedJobRoles?.map((role, idx) => (
                  <span key={idx} className="tag-pill secondary">
                    🎯 {role}
                  </span>
                ))}
                {analysis.recommendedSearchKeywords?.map((kw, idx) => (
                  <span key={idx} className="tag-pill primary">
                    🔍 {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Technical Skills Category */}
            <div className="analysis-card col-8">
              <div className="card-title">
                <Award size={18} color="#15803d" />
                Categorized Technical Stack & Skills
              </div>
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Core Competencies
                </span>
                <div className="tag-cloud" style={{ marginTop: '8px' }}>
                  {analysis.topSkills?.map((s, idx) => (
                    <span key={idx} className="tag-pill primary">
                      ★ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  All Technical Skills
                </span>
                <div className="tag-cloud" style={{ marginTop: '8px' }}>
                  {analysis.technicalSkills?.map((s, idx) => (
                    <span key={idx} className="tag-pill">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Soft Skills & Experience Badge */}
            <div className="analysis-card col-4">
              <div className="card-title">
                <Sparkles size={18} color="#15803d" />
                Soft Skills & Experience
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Est. Experience:</strong> {analysis.experienceYears || 0} Years
              </div>
              <div className="tag-cloud">
                {analysis.softSkills?.map((ss, idx) => (
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
              {analysis.workExperience?.length > 0 ? (
                analysis.workExperience.map((exp, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className="timeline-dot" />
                    <div className="timeline-role">{exp.role}</div>
                    <div className="timeline-company">{exp.company}</div>
                    <div className="timeline-duration">{exp.duration}</div>
                    <div className="timeline-desc">{exp.details}</div>
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
                  {analysis.strengths?.map((str, idx) => (
                    <li key={idx} className="bullet-item strength">
                      <CheckCircle2 size={16} /> <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Actionable Improvements</span>
                <ul className="bullet-list" style={{ marginTop: '8px' }}>
                  {analysis.areasForImprovement?.map((imp, idx) => (
                    <li key={idx} className="bullet-item improvement">
                      <AlertCircle size={16} /> <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Education History */}
            <div className="analysis-card col-12">
              <div className="card-title">
                <GraduationCap size={18} color="#15803d" />
                Education Credentials
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {analysis.education?.map((edu, idx) => (
                  <div key={idx} style={{ padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{edu.degree}</div>
                    <div style={{ fontSize: '13px', color: '#15803d' }}>{edu.institution}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{edu.year}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
