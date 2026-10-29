import { useState, useRef } from 'react';
import axios from 'axios';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Briefcase,
  Sparkles,
  CheckCircle,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import '../styles/Auth.css';

const API_BASE = 'http://localhost:5000/api';

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isOtpStep, setIsOtpStep] = useState(false); // Controls OTP verification view

  // Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 6-digit OTP array
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Submit Initial Form (Login OR Request Signup OTP)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        // Direct Login
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        onAuthSuccess(user, token);
      } else {
        // Signup Step 1: Send OTP to Gmail (NO user saved in DB yet!)
        const res = await axios.post(`${API_BASE}/auth/signup-request-otp`, {
          name,
          email,
          password
        });
        setSuccessMsg(res.data.message);
        setIsOtpStep(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication request failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle OTP input change with auto-focus next box
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);

    // Auto-advance
    if (val && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  // 3. Submit OTP to Verify and Permanently Create Account in MongoDB
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/signup-verify-otp`, {
        email,
        otp: fullOtp
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onAuthSuccess(user, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/signup-resend-otp`, { email });
      setSuccessMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
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
            <Sparkles size={14} color="#4ade80" /> Verified Accounts & Precision Matching
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
                <ShieldCheck size={18} />
              </div>
              <div className="hero-feat-text">
                <h4>Verified Email Security</h4>
                <p>One-time OTP verification ensures only authenticated accounts exist.</p>
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
          <ShieldCheck size={18} color="#22c55e" />
          <span>Encrypted database • Zero unverified user storage</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* STEP 2: OTP VERIFICATION VIEW */}
          {isOtpStep ? (
            <div className="otp-verification-block">
              <div className="otp-icon-wrap">
                <KeyRound size={28} />
              </div>

              <div className="auth-header-block" style={{ marginBottom: '16px' }}>
                <h2>Verify Your Email</h2>
                <p>
                  We sent a 6-digit code to <strong style={{ color: '#09090b' }}>{email}</strong>.
                  Enter it below to activate your account.
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}
              {successMsg && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13.5px', borderRadius: '10px', marginBottom: '18px' }}>
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <div className="otp-inputs-row">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      className="otp-box-input"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading} className="btn-primary-auth" style={{ width: '100%' }}>
                  {loading ? 'Verifying...' : 'Verify Code & Create Account'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="otp-resend-row">
                Didn't receive the email?
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendOtp}
                  className="btn-resend-code"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setError('');
                  setSuccessMsg('');
                }}
                className="btn-back-signup"
              >
                ← Back to registration
              </button>
            </div>
          ) : (
            /* STEP 1: LOGIN / SIGNUP VIEW */
            <>
              <div className="auth-header-block">
                <h2>{isLogin ? 'Welcome back' : 'Create an account'}</h2>
                <p>
                  {isLogin
                    ? 'Sign in to access your jobs and resume analysis.'
                    : 'Enter your details. We will verify your email with a secure OTP.'}
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
                  {loading ? 'Please wait...' : isLogin ? 'Sign In to Portal' : 'Continue with Email OTP'}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
