import { useState } from 'react';
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
  Tag
} from 'lucide-react';
import '../styles/Jobs.css';

export default function JobDetailsModal({ job, onClose, onCreateAtsResume }) {
  if (!job) return null;

  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard?.writeText(job.job_apply_link || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                <span className="details-badge-pill">{job.platformBadge || 'ATS Standard'}</span>
                <span className="details-source-pill">Source: {job.source || 'Scraped'}</span>
              </div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="btn-close-modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="job-details-modal-body">
          {/* Quick Specs Cards */}
          <div className="job-specs-grid">
            <div className="job-spec-item">
              <MapPin size={18} color="#15803d" />
              <div>
                <div className="spec-lbl">Job Location</div>
                <div className="spec-val">{job.job_city || 'India'}</div>
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

          {/* Full Job Description */}
          <div className="job-full-description-section">
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#09090b' }}>
              Full Job Description & Responsibilities
            </h4>
            <div className="description-text-content">
              {job.job_description || 'No extended description available for this position.'}
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

