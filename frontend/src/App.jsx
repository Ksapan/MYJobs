import { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, FileText, LogOut, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
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

          return axios.get(`${API_BASE}/resume/my-analysis`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        })
        .then((res) => {
          setResumeData(res.data.data);
          if (res.data.data?.analysis) {
            setActiveTab('myjobs');
          }
        })
        .catch(() => {
          // Non-blocking
        })
        .finally(() => {
          setLoadingInitial(false);
        });
    }
  }, [token]);

  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
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
      {/* Sleek Left Sidebar Navigation */}
      <aside className="side-navbar">
        <div>
          {/* Brand Logo */}
          <div className="side-brand-section">
            <div className="brand-badge">M</div>
            <span className="brand-title">
              MyJobs <span>Portal</span>
            </span>
          </div>

          {/* Nav Menu */}
          <nav className="side-nav-menu">
            <div className="side-nav-heading">Platform</div>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'resume' ? 'active' : ''}`}
              onClick={() => setActiveTab('resume')}
            >
              <div className="nav-tab-left">
                <FileText size={18} />
                <span>Resume & AI Analysis</span>
              </div>
              {!user?.hasUploadedResume && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: '#fef3c7',
                    color: '#92400e',
                    padding: '2px 7px',
                    borderRadius: '8px'
                  }}
                >
                  Required
                </span>
              )}
            </button>

            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'myjobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('myjobs')}
            >
              <div className="nav-tab-left">
                <Briefcase size={18} />
                <span>My Jobs</span>
              </div>
            </button>
          </nav>
        </div>

        {/* User Profile & Logout in Sidebar Footer */}
        <div className="side-user-footer">
          <div className="user-profile-card">
            <div className="user-avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
            <div className="user-meta-info">
              <span className="user-name-text">{user.name}</span>
              <span className="user-email-text">{user.email}</span>
            </div>
          </div>

          <button type="button" onClick={handleLogout} className="btn-sidebar-logout">
            <LogOut size={16} /> Logout Account
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main-canvas">
        {/* Subtle Top Breadcrumb Bar */}
        <header className="dashboard-top-subbar">
          <div className="dashboard-breadcrumb">
            <span>Portal /</span> {activeTab === 'resume' ? 'Resume & AI Analysis' : 'My Jobs'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#15803d', fontWeight: 600 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            Active Session
          </div>
        </header>

        {/* Active Content Body */}
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
    </div>
  );
}
