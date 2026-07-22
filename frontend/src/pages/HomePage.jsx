import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="home-page">
      {/* Top Government Bar */}
      <div className="home-gov-bar">
        <span>भारत सरकार | Government of India</span>
        <span>राष्ट्रीय परीक्षा एजेंसी | National Testing Agency</span>
      </div>

      {/* Main Header */}
      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-logo-section">
            <div className="home-logo-emblem">
              <div className="emblem-circle">
                <span className="emblem-text">NTA</span>
              </div>
            </div>
            <div className="home-title-section">
              <h1 className="home-main-title">NEET CBT Practice Portal</h1>
              <p className="home-subtitle">National Eligibility cum Entrance Test — Computer Based Test</p>
              <p className="home-tagline">राष्ट्रीय पात्रता सह प्रवेश परीक्षा</p>
            </div>
          </div>
          <div className="home-header-right">
            <div className="home-helpline">
              <span className="help-label">Help Desk</span>
              <span className="help-number">1800-XXX-XXXX</span>
              <span className="help-time">Mon–Sat | 9AM–5PM</span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav Bar */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <a href="#about" className="home-nav-link">About NEET</a>
          <a href="#instructions" className="home-nav-link">Instructions</a>
          <a href="#syllabus" className="home-nav-link">Syllabus</a>
          <a href="#contact" className="home-nav-link">Contact Us</a>
        </div>
      </nav>

      {/* Hero / Login Area */}
      <main className="home-main">
        <div className="home-content-grid">

          {/* Left: Info Panel */}
          <div className="home-info-panel">
            <div className="home-notice-board">
              <div className="notice-header">
                <span className="notice-icon">📢</span>
                <span>Important Notices</span>
              </div>
              <ul className="notice-list">
                <li>
                  <span className="notice-date">21 Jul 2026</span>
                  <a href="#" className="notice-link">NEET UG 2026 Mock Test Series Now Available</a>
                </li>
                <li>
                  <span className="notice-date">18 Jul 2026</span>
                  <a href="#" className="notice-link">Practice Tests for Physics, Chemistry & Biology Added</a>
                </li>
                <li>
                  <span className="notice-date">15 Jul 2026</span>
                  <a href="#" className="notice-link">Candidate Registration Portal Open</a>
                </li>
                <li>
                  <span className="notice-date">10 Jul 2026</span>
                  <a href="#" className="notice-link">System Requirements & Browser Compatibility Guidelines</a>
                </li>
              </ul>
            </div>

            <div className="home-about-box" id="about">
              <h3>About This Portal</h3>
              <p>
                This is the official Computer Based Test (CBT) practice platform for NEET UG aspirants.
                Simulate real exam conditions, track your performance, and improve your score with detailed analytics.
              </p>
              <div className="feature-pills">
                <span className="pill">📝 Full Mock Tests</span>
                <span className="pill">⏱ Real Timer</span>
                <span className="pill">📊 Detailed Analysis</span>
                <span className="pill">🔢 NTA Pattern</span>
              </div>
            </div>
          </div>

          {/* Right: Login Card */}
          <div className="home-login-area">
            <div className="home-login-card">
              <div className="login-card-header">
                <div className="login-card-icon">👤</div>
                <h2>Candidate Login</h2>
                <p>Select your role to continue</p>
              </div>

              <div className="login-role-buttons">
                <button
                  className="role-btn role-btn-student"
                  onClick={() => navigate('/login?role=student')}
                >
                  <span className="role-btn-icon">🎓</span>
                  <div className="role-btn-content">
                    <span className="role-btn-title">Student Login</span>
                    <span className="role-btn-desc">Access mock tests &amp; results</span>
                  </div>
                  <span className="role-btn-arrow">→</span>
                </button>

                <button
                  className="role-btn role-btn-admin"
                  onClick={() => navigate('/login?role=admin')}
                >
                  <span className="role-btn-icon">🛡</span>
                  <div className="role-btn-content">
                    <span className="role-btn-title">Admin Login</span>
                    <span className="role-btn-desc">Manage tests &amp; candidates</span>
                  </div>
                  <span className="role-btn-arrow">→</span>
                </button>
              </div>

              <div className="login-card-footer">
                <p>For technical assistance, contact the Help Desk</p>
                <p className="login-card-footer-note">
                  Best viewed in Chrome / Firefox at 1024×768 or higher resolution
                </p>
              </div>
            </div>

            {/* Exam Info Box */}
            <div className="exam-info-box">
              <div className="exam-info-row">
                <div className="exam-info-item">
                  <span className="exam-info-label">Exam</span>
                  <span className="exam-info-value">NEET UG 2026</span>
                </div>
                <div className="exam-info-divider"></div>
                <div className="exam-info-item">
                  <span className="exam-info-label">Duration</span>
                  <span className="exam-info-value">3 Hours 20 Min</span>
                </div>
                <div className="exam-info-divider"></div>
                <div className="exam-info-item">
                  <span className="exam-info-label">Questions</span>
                  <span className="exam-info-value">200 (180 Attempt)</span>
                </div>
                <div className="exam-info-divider"></div>
                <div className="exam-info-item">
                  <span className="exam-info-label">Max Marks</span>
                  <span className="exam-info-value">720</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Instructions Strip */}
      <section className="home-instructions" id="instructions">
        <div className="home-instructions-inner">
          <h3>General Instructions</h3>
          <div className="instruction-grid">
            <div className="instruction-item">
              <span className="instruction-num">01</span>
              <p>The test comprises 200 questions from Physics, Chemistry, and Biology (Botany + Zoology).</p>
            </div>
            <div className="instruction-item">
              <span className="instruction-num">02</span>
              <p>Each correct answer carries +4 marks. Each wrong answer carries −1 mark (negative marking).</p>
            </div>
            <div className="instruction-item">
              <span className="instruction-num">03</span>
              <p>Do not close the browser or press Back/Refresh during the exam.</p>
            </div>
            <div className="instruction-item">
              <span className="instruction-num">04</span>
              <p>Use the Question Palette to navigate between questions and track your attempt status.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="footer-col">
            <strong>National Testing Agency</strong>
            <p>Block C-20/1A/8, Sector 62</p>
            <p>Noida — 201309, Uttar Pradesh</p>
          </div>
          <div className="footer-col">
            <strong>Quick Links</strong>
            <a href="#">NTA Official Website</a>
            <a href="#">NEET UG Information Bulletin</a>
            <a href="#">Grievance Portal</a>
          </div>
          <div className="footer-col">
            <strong>Contact</strong>
            <p>Email: neet@nta.ac.in</p>
            <p>Helpline: 1800-XXX-XXXX</p>
            <p>Mon–Sat | 9AM–5PM</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 National Testing Agency | NEET CBT Practice Portal. All Rights Reserved.</p>
          <p>This is a practice/mock portal. Not the official NTA website.</p>
        </div>
      </footer>
    </div>
  );
}
