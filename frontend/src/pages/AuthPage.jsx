import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, User as UserIcon, ArrowRight, Briefcase, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';
import '../styles/Auth.css';

const API_BASE = 'http://localhost:5000/api';

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const payload = isLogin ? { email, password } : { name, email, password };

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      onAuthSuccess(user, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* Left Full-Height Hero Brand Panel */}
      <div className="auth-hero-panel">
        <div className="hero-brand">
          <div className="hero-brand-logo">
            <Briefcase size={22} color="#ffffff" />
          </div>
          <span className="hero-brand-title">MyJobs</span>
        </div>

        <div className="hero-content">
          <div className="hero-badge-tag">
            <Sparkles size={14} color="#38bdf8" /> Powered by Groq Llama 3 & RapidAPI
          </div>

          <h1 className="hero-title">
            Land your next high-growth role in <span>India</span>.
          </h1>

          <p className="hero-description">
            Upload your resume once. Our AI parses your capabilities into categorized skills, scores your profile, and matches real-time jobs in your preferred Indian tech hubs.
          </p>

          <div className="hero-feature-cards">
            <div className="hero-feat-item">
              <div className="hero-feat-icon">
                <Sparkles size={18} />
              </div>
              <div className="hero-feat-text">
                <h4>AI Categorized Analysis</h4>
                <p>Instant skill breakdown, strengths, and resume ATS score.</p>
              </div>
            </div>

            <div className="hero-feat-item">
              <div className="hero-feat-icon">
                <CheckCircle size={18} />
              </div>
              <div className="hero-feat-text">
                <h4>Targeted Indian Job Market</h4>
                <p>Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, and remote roles.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-footer-trust">
          <ShieldCheck size={18} color="#10b981" />
          <span>Secure authentication • Encrypted resume data</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-header-block">
            <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
            <p>
              {isLogin
                ? 'Sign in to access your jobs and resume analysis.'
                : 'Get started with an AI-matched career experience in seconds.'}
            </p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="form-input-wrapper">
                  <UserIcon size={18} className="form-icon" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-wrapper">
                <Mail size={18} className="form-icon" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrapper">
                <Lock size={18} className="form-icon" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary-auth">
              {loading ? 'Please wait...' : isLogin ? 'Sign In to Portal' : 'Create My Account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-switch-box">
            {isLogin ? "Don't have an account yet?" : 'Already registered?'}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? 'Sign up for free' : 'Log in here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
