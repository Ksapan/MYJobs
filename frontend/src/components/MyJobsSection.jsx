import { useState, useEffect } from 'react';
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
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import AtsResumeModal from './AtsResumeModal';
import JobDetailsModal from './JobDetailsModal';
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
    resumeData?.analysis?.personalInfo?.headline ||
    'Software Developer';

  const [roleQuery, setRoleQuery] = useState(defaultRole);
  const [selectedLocation, setSelectedLocation] = useState(user?.preferredLocation || 'India');

  // Pagination & Database States (10 Jobs Per Page, Max 30 Search Sync)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobsCount, setTotalJobsCount] = useState(0);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialChecked, setInitialChecked] = useState(false);
  const [error, setError] = useState('');
  const [searchSummary, setSearchSummary] = useState('');

  // Modals State
  const [selectedJobForAts, setSelectedJobForAts] = useState(null);
  const [optimizingJobId, setOptimizingJobId] = useState(null);
  const [atsOptimizationResult, setAtsOptimizationResult] = useState(null);
  const [showAtsModal, setShowAtsModal] = useState(false);

  // Job Details Modal
  const [activeDetailsJob, setActiveDetailsJob] = useState(null);

  // 1. Check if our MongoDB Database already has saved jobs on initial load
  const loadJobsFromDatabase = async (page = 1) => {
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_BASE}/jobs`, {
        params: {
          page,
          limit: 10,
          role: roleQuery.trim(),
          location: selectedLocation
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const { data, totalPages: pages, totalJobs, page: activePage } = res.data;
      setJobs(data || []);
      setTotalPages(pages || 1);
      setTotalJobsCount(totalJobs || 0);
      setCurrentPage(activePage || 1);

      if (totalJobs > 0) {
        setSearchSummary(`Loaded ${totalJobs} verified jobs from database (Page ${activePage} of ${pages})`);
      }
    } catch (err) {
      // Non-blocking on initial load
    } finally {
      setLoading(false);
      setInitialChecked(true);
    }
  };

  useEffect(() => {
    loadJobsFromDatabase(1);
  }, []);

  // 2. On-Demand Sync: Runs all multi-adapters + JSearch with complete JD extraction
  const handleTriggerSearch = async (e, targetPage = 1) => {
    if (e) e.preventDefault();
    if (!roleQuery.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_BASE}/jobs/search`, {
        params: {
          role: roleQuery.trim(),
          location: selectedLocation,
          page: targetPage
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      const { data, totalPages: pages, totalJobs, syncedCount } = res.data;
      setJobs(data || []);
      setTotalPages(pages || 1);
      setTotalJobsCount(totalJobs || 0);
      setCurrentPage(targetPage);
      setSearchSummary(
        `Synced ${syncedCount || 30} latest jobs with full descriptions across LinkedIn India, Freelance & JSearch (Page ${targetPage} of ${pages})`
      );

      // Update location preference in background
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
        'Error syncing jobs across adapters. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Pagination Navigation
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (jobs.length > 0) {
      loadJobsFromDatabase(newPage);
    } else {
      handleTriggerSearch(null, newPage);
    }
  };

  // 4. Run ATS Engine for Selected Job
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
      setError(err.response?.data?.message || 'Failed to run ATS match engine.');
    } finally {
      setOptimizingJobId(null);
    }
  };

  return (
    <div className="jobs-section-container">
      {/* Search and Location Filter Bar */}
      <form onSubmit={(e) => handleTriggerSearch(e, 1)} className="jobs-filter-bar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={18} style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search across LinkedIn, Startups, Freelance & JSearch (e.g. React, Node.js)"
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

      {/* Animated Brand Radar Loader */}
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
            <h4>Extracting Full Descriptions & Live Openings (Up to 30 Jobs)</h4>
            <p>Scraping LinkedIn India, Freelance, Startups & JSearch with deep JD parsing...</p>
          </div>
        </div>
      )}

      {/* Empty State Prompt */}
      {initialChecked && !loading && jobs.length === 0 && (
        <div className="jobs-welcome-prompt">
          <div className="jobs-welcome-icon">
            <Compass size={28} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '6px', color: '#09090b' }}>
            Find Your Next High-Growth Role
          </h3>
          <p style={{ fontSize: '14px', color: '#71717a', maxWidth: '480px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            Type your target job title or tech stack above. We will fetch and save real-time opportunities into your private database.
          </p>
          <button
            type="button"
            onClick={(e) => handleTriggerSearch(e, 1)}
            className="btn-search"
            style={{ margin: '0 auto' }}
          >
            <Search size={16} /> Search for "{roleQuery || 'Software Engineer'}"
          </button>
        </div>
      )}

      {/* Paginated Jobs Grid (10 Jobs Per Page, Latest First) */}
      {!loading && jobs.length > 0 && (
        <>
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

                  {/* Card Actions Footer with Clean Aligned Buttons */}
                  <div className="job-card-footer">
                    <span className="job-employment-type">
                      {job.platformBadge || job.job_employment_type || 'Full Time'}
                    </span>

                    <div className="job-card-action-btns">
                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => setActiveDetailsJob(job)}
                        className="btn-view-details"
                        title="View Full Job Description & Scope"
                      >
                        <Info size={14} /> Details
                      </button>

                      <button
                        type="button"
                        disabled={isOptimizingThis}
                        onClick={() => handleCreateAtsResume(job)}
                        className="btn-create-ats-card"
                      >
                        {isOptimizingThis ? (
                          <>
                            <RefreshCw className="animate-spin" size={13} /> Tailoring...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} color="#15803d" /> ATS Resume
                          </>
                        )}
                      </button>

                      <a
                        href={job.job_apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-apply-card"
                      >
                        Apply <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 10-Per-Page Pagination Navigation Bar */}
          {totalPages > 1 && (
            <div className="jobs-pagination-wrapper">
              <div className="pagination-stats-text">
                Showing <strong>{(currentPage - 1) * 10 + 1}</strong> –{' '}
                <strong>{Math.min(currentPage * 10, totalJobsCount)}</strong> of{' '}
                <strong>{totalJobsCount}</strong> total jobs
              </div>

              <div className="pagination-controls-group">
                <button
                  type="button"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="btn-page-step"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <div className="page-indicator-pill">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="btn-page-step"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Full Job Details Modal */}
      {activeDetailsJob && (
        <JobDetailsModal
          job={activeDetailsJob}
          onClose={() => setActiveDetailsJob(null)}
          onCreateAtsResume={handleCreateAtsResume}
        />
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
