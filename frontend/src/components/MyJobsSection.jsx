import { useState } from 'react';
import axios from 'axios';
import {
  Search,
  MapPin,
  Building,
  ExternalLink,
  Calendar,
  Sparkles,
  RefreshCw,
  Compass,
  Briefcase
} from 'lucide-react';
import AtsResumeModal from './AtsResumeModal';
import '../styles/Jobs.css';

const API_BASE = 'http://localhost:5000/api';

const POPULAR_LOCATIONS = [
  'India',
  'Bengaluru, Karnataka',
  'Hyderabad, Telangana',
  'Pune, Maharashtra',
  'Mumbai, Maharashtra',
  'Delhi NCR / Gurgaon / Noida',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Ahmedabad, Gujarat',
  'Remote India'
];

export default function MyJobsSection({ token, user, resumeData }) {
  const defaultRole =
    resumeData?.analysis?.metrics?.recommendedKeywords?.[0] ||
    resumeData?.analysis?.skills?.topSkills?.[0] ||
    resumeData?.analysis?.headline ||
    'Software Developer';

  const [roleQuery, setRoleQuery] = useState(defaultRole);
  const [selectedLocation, setSelectedLocation] = useState(user?.preferredLocation || 'India');

  // ONLY SYNC / FETCH WHEN USER CLICKS SEARCH (No auto sync)
  const [hasSearched, setHasSearched] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSummary, setSearchSummary] = useState('');

  // ATS Optimization Modal State
  const [selectedJobForAts, setSelectedJobForAts] = useState(null);
  const [optimizingJobId, setOptimizingJobId] = useState(null);
  const [atsOptimizationResult, setAtsOptimizationResult] = useState(null);
  const [showAtsModal, setShowAtsModal] = useState(false);

  // Manual Trigger Function (LinkedIn Scraper + JSearch)
  const handleTriggerSearch = async (e) => {
    if (e) e.preventDefault();
    if (!roleQuery.trim()) return;

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const res = await axios.get(`${API_BASE}/jobs/search`, {
        params: {
          role: roleQuery.trim(),
          location: selectedLocation
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setJobs(res.data.data || []);
      setSearchSummary(
        `Found ${res.data.count || 0} active openings matching "${roleQuery}" in "${selectedLocation}"`
      );

      // Save user location preference in background
      axios
        .put(
          `${API_BASE}/auth/location`,
          { preferredLocation: selectedLocation },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        .catch(() => {});
    } catch (err) {
      setError(
        err.response?.data?.details ||
        err.response?.data?.message ||
        'Error syncing jobs from scrapers. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAtsResume = async (job) => {
    setOptimizingJobId(job.job_id || job.job_title);
    setError('');

    try {
      const res = await axios.post(
        `${API_BASE}/ats/optimize`,
        { job },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedJobForAts(job);
      setAtsOptimizationResult(res.data);
      setShowAtsModal(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to run ATS match engine. Please upload your resume in the Resume tab.'
      );
    } finally {
      setOptimizingJobId(null);
    }
  };

  return (
    <div className="jobs-section-container">
      {/* Search and Location Filter Bar */}
      <form onSubmit={handleTriggerSearch} className="jobs-filter-bar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by title, technology, or skills (e.g. React Developer, Node.js)"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
            />
          </div>

          <select
            className="location-dropdown"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            {POPULAR_LOCATIONS.map((loc, idx) => (
              <option key={idx} value={loc}>
                📍 {loc}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading} className="btn-search">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            {loading ? 'Syncing...' : 'Search Jobs'}
          </button>
        </div>
      </form>

      {/* Query Status Summary */}
      {searchSummary && !loading && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {searchSummary}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: 'var(--danger)',
            marginBottom: '24px'
          }}
        >
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* 1. Custom Vision-Matched Animated Brand Loader */}
      {loading && (
        <div className="vision-loader-container">
          <div className="vision-radar-spinner">
            <div className="vision-pulse-ring" />
            <div className="vision-pulse-ring delay" />
            <div className="vision-orbit-circle" />
            <div className="vision-center-badge">
              <Briefcase size={18} />
            </div>
          </div>
          <div className="vision-loader-text">
            <h4>Syncing Live Jobs Across India & Remote Boards</h4>
            <p>Pulling fresh postings from LinkedIn India, JSearch, and contract channels...</p>
          </div>
        </div>
      )}

      {/* 2. Initial Pre-Search Prompt (No automatic sync until user searches) */}
      {!hasSearched && !loading && (
        <div className="jobs-welcome-prompt">
          <div className="jobs-welcome-icon">
            <Compass size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: '#09090b' }}>
            Find Your Next High-Growth Role
          </h3>
          <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Type your target job title or tech stack above and select your city. We will search and sync real-time opportunities on demand.
          </p>
          <button
            type="button"
            onClick={handleTriggerSearch}
            className="btn-search"
            style={{ margin: '0 auto' }}
          >
            <Search size={16} /> Search for "{roleQuery || 'Software Engineer'}"
          </button>
        </div>
      )}

      {/* 3. Jobs Grid (Post-Search) */}
      {!loading && hasSearched && jobs.length > 0 && (
        <div className="jobs-grid">
          {jobs.map((job, idx) => {
            const isOptimizingThis = optimizingJobId === (job.job_id || job.job_title);

            return (
              <div key={job.job_id || idx} className="job-card">
                <div>
                  <div className="job-card-header">
                    {job.employer_logo ? (
                      <img
                        src={job.employer_logo}
                        alt={job.employer_name}
                        className="job-employer-logo"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        className="job-employer-logo"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Building size={20} color="#15803d" />
                      </div>
                    )}
                    <div className="job-title-block">
                      <h3>{job.job_title}</h3>
                      <div className="job-employer-name">{job.employer_name}</div>
                    </div>
                  </div>

                  <div className="job-meta-row">
                    <div className="job-meta-item">
                      <MapPin size={14} /> {job.job_city || job.job_state || job.job_country || 'India'}
                    </div>
                    {job.job_posted_at_datetime_utc && (
                      <div className="job-meta-item">
                        <Calendar size={14} /> {new Date(job.job_posted_at_datetime_utc).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <p className="job-description-preview">
                    {job.job_description || 'No job description summary provided.'}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="job-card-footer">
                  <span className="job-employment-type">{job.job_employment_type || 'Full Time'}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      disabled={isOptimizingThis}
                      onClick={() => handleCreateAtsResume(job)}
                      style={{
                        padding: '8px 14px',
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1.5px solid #22c55e',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: isOptimizingThis ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isOptimizingThis ? (
                        <>
                          <RefreshCw className="animate-spin" size={14} /> Running Math...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} color="#15803d" /> Create ATS Resume Free
                        </>
                      )}
                    </button>

                    <a
                      href={job.job_apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-apply"
                    >
                      Apply <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. No Results Found State */}
      {!loading && hasSearched && jobs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          No jobs found for this query/location. Try another keyword or location in the filter bar.
        </div>
      )}

      {/* ATS Tailored Resume Modal */}
      {showAtsModal && (
        <AtsResumeModal
          open={showAtsModal}
          onClose={() => setShowAtsModal(false)}
          optimizationResult={atsOptimizationResult}
          job={selectedJobForAts}
          user={user}
        />
      )}
    </div>
  );
}
