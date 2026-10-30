import { useState, useMemo } from 'react';
import {
  X,
  Building,
  MapPin,
  Calendar,
  Briefcase,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Share2,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Award,
  TrendingUp,
  FileText
} from 'lucide-react';
import '../styles/Jobs.css';

/**
 * Format raw HTML or plain text into clean, structured paragraphs
 */
function formatJobDescription(raw) {
  if (!raw) return [];

  // Decode common HTML entities
  let clean = raw
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/â¢|â|â|â/g, ' • ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, ''); // strip remaining tags

  // Split into paragraphs and remove empty lines
  return clean
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export default function JobDetailsModal({ job, resumeData, onClose, onCreateAtsResume }) {
  if (!job) return null;

  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard?.writeText(job.job_apply_link || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate Real-Time ATS Match Score Between Candidate's Resume & This Job
  const atsMatch = useMemo(() => {
    const analysis = resumeData?.analysis || {};
    const skillsObj = analysis.skills || {};

    const candidateSkills = new Set([
      ...(skillsObj.topSkills || []),
      ...(skillsObj.technicalSkills || []),
      ...(skillsObj.frameworksAndLibraries || []),
      ...(skillsObj.toolsAndPlatforms || []),
      ...(skillsObj.databases || []),
      ...(skillsObj.softSkills || []),
      ...(analysis.topSkills || []),
      ...(analysis.technicalSkills || [])
    ].map((s) => s.toLowerCase().trim()));

    const jobText = `${job.job_title || ''} ${job.job_description || ''} ${(job.requiredSkills || []).join(' ')}`.toLowerCase();

    const COMMON_KEYWORDS = [
      'react', 'node.js', 'nodejs', 'express', 'mongodb', 'javascript', 'typescript',
      'python', 'java', 'c++', 'aws', 'docker', 'kubernetes', 'sql', 'postgresql',
      'redis', 'bullmq', 'rest api', 'graphql', 'next.js', 'redux', 'ci/cd', 'tailwind',
      'microservices', 'git', 'system design', 'agile', 'scrum', 'testing', 'linux'
    ];

    const matched = [];
    const missing = [];

    COMMON_KEYWORDS.forEach((kw) => {
      if (jobText.includes(kw)) {
        if (candidateSkills.has(kw) || Array.from(candidateSkills).some((s) => s.includes(kw))) {
          matched.push(kw);
        } else {
          missing.push(kw);
        }
      }
    });

    // Also check requiredSkills list
    if (job.requiredSkills && Array.isArray(job.requiredSkills)) {
      job.requiredSkills.forEach((req) => {
        const norm = req.toLowerCase().trim();
        if (candidateSkills.has(norm) || Array.from(candidateSkills).some((s) => s.includes(norm))) {
          if (!matched.includes(norm)) matched.push(norm);
        } else {
          if (!missing.includes(norm)) missing.push(norm);
        }
      });
    }

    const total = matched.length + missing.length;
    let score = total > 0 ? Math.round((matched.length / total) * 100) : 80;
    score = Math.max(45, Math.min(96, score));

    let chanceLabel = 'High Chance';
    let chanceColor = '#15803d';
    let chanceBg = '#f0fdf4';

    if (score < 60) {
      chanceLabel = 'Moderate Match (Needs ATS Tailoring)';
      chanceColor = '#b45309';
      chanceBg = '#fef3c7';
    } else if (score < 75) {
      chanceLabel = 'Good Match (Recommended to Apply)';
      chanceColor = '#0369a1';
      chanceBg = '#e0f2fe';
    } else {
      chanceLabel = 'Strong Fit (High Interview Probability)';
      chanceColor = '#15803d';
      chanceBg = '#f0fdf4';
    }

    return {
      score,
      matched,
      missing,
      chanceLabel,
      chanceColor,
      chanceBg
    };
  }, [job, resumeData]);

  const descriptionParagraphs = useMemo(() => formatJobDescription(job.job_description), [job.job_description]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="job-details-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="job-details-modal-header">
          <div className="details-header-brand">
            {job.employer_logo ? (
              <img
                src={job.employer_logo}
                alt={job.employer_name}
                className="details-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="details-logo-img default-icon">
                <Building size={24} color="#15803d" />
              </div>
            )}

            <div>
              <h2>{job.job_title}</h2>
              <div className="details-company-row">
                <span className="details-company-name">{job.employer_name}</span>
                <span className="details-badge-pill">{job.platformBadge || 'Active Opening'}</span>
                <span className="details-source-pill">Source: {job.source || 'Verified Partner'}</span>
              </div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="job-details-modal-body">
          {/* Real-time ATS Compatibility & Interview Chance Card */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #e4e4e7',
              borderRadius: '14px',
              padding: '20px 24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: atsMatch.chanceBg,
                    color: atsMatch.chanceColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '18px',
                    border: `1.5px solid ${atsMatch.chanceColor}40`
                  }}
                >
                  {atsMatch.score}%
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#09090b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#15803d" /> ATS Match with Your Resume
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: atsMatch.chanceColor, marginTop: '2px' }}>
                    {atsMatch.chanceLabel}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onCreateAtsResume(job);
                }}
                className="btn-create-ats-modal"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <Sparkles size={15} /> Boost Score to 95%+
              </button>
            </div>

            {/* Matched vs Missing Tags */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', paddingTop: '12px', borderTop: '1px solid #f4f4f5' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle2 size={14} /> Matched Skills ({atsMatch.matched.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {atsMatch.matched.length > 0 ? (
                    atsMatch.matched.slice(0, 8).map((m, idx) => (
                      <span key={idx} style={{ padding: '3px 9px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                        ✓ {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12.5px', color: '#71717a' }}>General engineering foundations match.</span>
                  )}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrendingUp size={14} /> Target Keywords for ATS ({atsMatch.missing.length})
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {atsMatch.missing.length > 0 ? (
                    atsMatch.missing.slice(0, 6).map((m, idx) => (
                      <span key={idx} style={{ padding: '3px 9px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                        + {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: '12.5px', color: '#71717a' }}>Full keyword alignment!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Specs Cards */}
          <div className="job-specs-grid">
            <div className="job-spec-item">
              <MapPin size={18} color="#15803d" />
              <div>
                <div className="spec-lbl">Job Location</div>
                <div className="spec-val">{job.job_city || job.job_country || 'Remote / India'}</div>
              </div>
            </div>

            <div className="job-spec-item">
              <Briefcase size={18} color="#15803d" />
              <div>
                <div className="spec-lbl">Employment Type</div>
                <div className="spec-val">{job.job_employment_type || 'Full Time'}</div>
              </div>
            </div>

            <div className="job-spec-item">
              <Calendar size={18} color="#15803d" />
              <div>
                <div className="spec-lbl">Date Posted</div>
                <div className="spec-val">
                  {job.job_posted_at_datetime_utc
                    ? new Date(job.job_posted_at_datetime_utc).toLocaleDateString()
                    : 'Recently'}
                </div>
              </div>
            </div>

            <div className="job-spec-item">
              <ShieldCheck size={18} color="#15803d" />
              <div>
                <div className="spec-lbl">Verification</div>
                <div className="spec-val">Active Posting</div>
              </div>
            </div>
          </div>

          {/* Required Skills & Focus Stack */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '10px', color: '#09090b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={16} color="#15803d" />
                Target Keywords & Technology Stack
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {job.requiredSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '6px 12px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '9999px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#166534'
                    }}
                  >
                    ★ {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Clean Job Description */}
          <div className="job-full-description-section">
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', color: '#09090b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} color="#15803d" />
              Complete Role Description & Scope
            </h4>
            <div className="clean-description-container">
              {descriptionParagraphs.length > 0 ? (
                descriptionParagraphs.map((para, idx) => (
                  <p key={idx} className="description-paragraph">
                    {para}
                  </p>
                ))
              ) : (
                <p className="description-paragraph">
                  {job.job_description || 'No extended description available for this position.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="job-details-modal-footer">
          <button type="button" onClick={handleShare} className="btn-share-job">
            <Share2 size={16} /> {copied ? 'Link Copied!' : 'Share Opening'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateAtsResume(job);
              }}
              className="btn-create-ats-modal"
            >
              <Sparkles size={16} /> Create ATS Resume Free
            </button>

            <a
              href={job.job_apply_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-apply-modal"
            >
              Apply on Platform <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

