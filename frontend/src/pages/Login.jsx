import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';
  const [mode, setMode] = useState(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'admin' || role === 'student') setMode(role);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'student') {
        const { data } = await api.post('/auth/student-login', { name, email });
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        const { data } = await api.post('/auth/admin-login', { email, password });
        login(data.token, data.user);
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nta-login-page">
      {/* Top Bar */}
      <div className="nta-top-bar">
        <span>OM सरकार | Government of OM</span>
        <span>राष्ट्रीय परीक्षा एजेंसी | OM Testing Agency</span>
      </div>

      {/* Header */}
      <header className="nta-login-header">
        <div className="nta-login-header-inner">
          <div className="nta-emblem-wrap">
            <div className="nta-emblem-circle">
              <span>CBT</span>
            </div>
          </div>
          <div>
            <h1 className="nta-portal-title"> CBT Practice Portal</h1>
            <p className="nta-portal-sub"> Computer Based Test - Practice portal</p>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="nta-login-body">
        <div className="nta-login-card">
          {/* Tab switcher */}
          <div className="nta-login-tabs">
            <button
              className={`nta-tab ${mode === 'student' ? 'nta-tab-active' : ''}`}
              onClick={() => setMode('student')}
              type="button"
            >
              🎓 Student Login
            </button>
            <button
              className={`nta-tab ${mode === 'admin' ? 'nta-tab-active' : ''}`}
              onClick={() => setMode('admin')}
              type="button"
            >
              🛡 Admin Login
            </button>
          </div>

          {/* Form */}
          <div className="nta-login-form-body">
            <h2 className="nta-form-title">
              {mode === 'student' ? 'Candidate Authentication' : 'Administrator Login'}
            </h2>
            <p className="nta-form-subtitle">
              {mode === 'student'
                ? 'Enter your registered name and email to access mock tests'
                : 'Enter admin credentials to manage the portal'}
            </p>

            {error && (
              <div className="nta-error-alert">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="nta-form">
              {mode === 'student' && (
                <div className="nta-field">
                  <label htmlFor="login-name">Full Name</label>
                  <input
                    id="login-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="nta-field">
                <label htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {mode === 'admin' && (
                <div className="nta-field">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              )}

              <button type="submit" className="nta-login-btn" disabled={loading}>
                {loading ? (
                  <span className="nta-spinner"></span>
                ) : (
                  mode === 'student' ? 'Proceed to Dashboard →' : 'Login as Administrator →'
                )}
              </button>
            </form>

            <div className="nta-login-back">
              <Link to="/" className="nta-back-link">← Back to Home</Link>
            </div>
          </div>
        </div>

        {/* Side info */}
        <div className="nta-login-side">
          <div className="nta-info-card">
            <h3>📋 Exam Overview</h3>
            <table className="nta-info-table">
              <tbody>
                <tr><td>Exam Name</td><td>NEET UG 2026</td></tr>
                <tr><td>Mode</td><td>Computer Based Test</td></tr>
                <tr><td>Duration</td><td>3 Hours </td></tr>
                <tr><td>Total Questions</td><td>180</td></tr>
                <tr><td>Maximum Marks</td><td>720</td></tr>
                <tr><td>Correct Answer</td><td className="mark-positive">+4 marks</td></tr>
                <tr><td>Wrong Answer</td><td className="mark-negative">−1 mark</td></tr>
              </tbody>
            </table>
          </div>
          <div className="nta-tip-card">
            <h4>💡 System Requirements</h4>
            <ul>
              <li>Browser: Chrome / Firefox (latest)</li>
              <li>Screen: 1024 × 768 or higher</li>
              <li>Stable internet connection required</li>
              <li>Do not use Back/Refresh during exam</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="nta-login-footer">
        <p>© 2026 OM Testing Agency |  CBT Practice Portal</p>
        <p>For assistance: omkarpuwan@gmail.com | +91-9528751952 (Mon–Sat, 9AM–5PM)</p>
      </footer>
    </div>
  );
}
