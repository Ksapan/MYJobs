import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, MapPin, Building, ExternalLink, Calendar, RefreshCw, Sparkles, FileCheck } from 'lucide-react';
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
    resumeData?.analysis?.recommendedSearchKeywords?.[0] ||
    resumeData?.analysis?.suggestedJobRoles?.[0] ||
    'Software Developer';

  const [roleQuery, setRoleQuery] = useState(defaultRole);
  const [selectedLocation, setSelectedLocation] = useState(user?.preferredLocation || 'India');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchSummary, setSearchSummary] = useState('');

  // ATS Optimization Modal State
  const [selectedJobForAts, setSelectedJobForAts] = useState(null);
  const [optimizingJobId, setOptimizingJobId] = useState(null);
  const [atsOptimizationResult, setAtsOptimizationResult] = useState(null);
  const [showAtsModal, setShowAtsModal] = useState(false);

  const fetchJobs = async (customRole, customLoc) => {
    setLoading(true);
    setError('');
    const targetRole = customRole !== undefined ? customRole : roleQuery;
    const targetLoc = customLoc !== undefined ? customLoc : selectedLocation;

    try {
      const res = await axios.get(`${API_BASE}/jobs/search`, {
        params: {
          role: targetRole,
          location: targetLoc
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setJobs(res.data.data || []);
      setSearchSummary(`Found ${res.data.count || 0} active positions matching "${targetRole}" in "${targetLoc}"`);
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.message || 'Error fetching jobs from RapidAPI.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(defaultRole, selectedLocation);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleLocationChange = async (e) => {
    const newLoc = e.target.value;
    setSelectedLocation(newLoc);
    fetchJobs(roleQuery, newLoc);

    try {
      await axios.put(
        `${API_BASE}/auth/location`,
        { preferredLocation: newLoc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      // Non-blocking
    }
  };

  const handleCreateAtsResume = async (job) => {
    setOptimizingJobId(job.job_id || job.job_title);
    setError('');

    try {
      const res = await axios.post(
        `${API_BASE}/ats/optimize`,
        { job },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSelectedJobForAts(job);
      setAtsOptimizationResult(res.data);
      setShowAtsModal(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to run ATS match engine. Please ensure you uploaded your primary resume in the Resume tab.'
      );
    } finally {
      setOptimizingJobId(null);
    }
  };

  return (
    <div className="jobs-section-container">
      {/* Search and Location Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="jobs-filter-bar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={18} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Filter by title or technology (e.g. React Developer, Node.js)"
              value={roleQuery}
              onChange={(e) => setRoleQuery(e.target.value)}
            />
          </div>

          <select className="location-dropdown" value={selectedLocation} onChange={handleLocationChange}>
            {POPULAR_LOCATIONS.map((loc, idx) => (
              <option key={idx} value={loc}>
                📍 {loc}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading} className="btn-search">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
            Search Jobs
          </button>
        </div>
      </form>

      {/* Query Status Summary */}
      {searchSummary && (
        <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {searchSummary}
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: 'var(--danger)', marginBottom: '24px' }}>
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* Jobs Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
          Fetching live job openings from RapidAPI...
        </div>
      ) : jobs.length > 0 ? (
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
                      <div className="job-employer-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    {/* Create ATS Resume Free Action */}
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
      ) : (
        !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            No jobs found for this query/location. Try another keyword or location in the filter bar.
          </div>
        )
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
