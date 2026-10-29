import { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, FileText, LogOut, Sparkles } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import ResumeSection from './components/ResumeSection';
import MyJobsSection from './components/MyJobsSection';
import './styles/globals.css';
import './styles/Dashboard.css';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('resume'); // 'resume' or 'myjobs'
  const [resumeData, setResumeData] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Sync session on mount
  useEffect(() => {
    if (token) {
      setLoadingInitial(true);
      axios
        .get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));

          // Fetch resume data
          return axios.get(`${API_BASE}/resume/my-analysis`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        })
        .then((res) => {
          setResumeData(res.data.data);
          // If user already has a resume uploaded, we can default to jobs tab
          if (res.data.data?.analysis) {
            setActiveTab('myjobs');
          }
        })
        .catch(() => {
          // Non-blocking if analysis is not yet uploaded
        })
        .finally(() => {
          setLoadingInitial(false);
        });
    }
  }, [token]);

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    // If first-time user hasn't uploaded a resume, force resume tab
    if (!userData.hasUploadedResume) {
      setActiveTab('resume');
    } else {
      setActiveTab('myjobs');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
    setResumeData(null);
  };

  const handleResumeUploaded = (newAnalysisRecord) => {
    setResumeData(newAnalysisRecord);
    setUser((prev) => ({ ...prev, hasUploadedResume: true }));
  };

  if (!token || !user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="brand-section">
          <div className="brand-badge">M</div>
          <span className="brand-title">MyJobs Portal</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'resume' ? 'active' : ''}`}
            onClick={() => setActiveTab('resume')}
          >
            <FileText size={17} />
            Resume & AI Analysis
            {!user?.hasUploadedResume && (
              <span style={{ fontSize: '11px', background: 'var(--warning)', color: '#000', padding: '1px 6px', borderRadius: '10px' }}>
                Required
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'myjobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('myjobs')}
          >
            <Briefcase size={17} />
            My Jobs
          </button>
        </nav>

        {/* User Pill & Logout */}
        <div className="user-nav-actions">
          <div className="user-profile-pill">
            <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
            <span className="user-name-text">{user.name}</span>
          </div>

          <button type="button" onClick={handleLogout} className="btn-icon-danger" title="Logout">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="dashboard-main-content">
        {activeTab === 'resume' ? (
          <ResumeSection
            token={token}
            user={user}
            resumeData={resumeData}
            onResumeUploaded={handleResumeUploaded}
            onViewJobs={() => setActiveTab('myjobs')}
          />
        ) : (
          <MyJobsSection token={token} user={user} resumeData={resumeData} />
        )}
      </main>
    </div>
  );
}
