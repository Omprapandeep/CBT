import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    Promise.all([
      api.get('/tests'),
      api.get('/tests/my/attempts'),
    ])
      .then(([testsRes, attemptsRes]) => {
        setTests(testsRes.data);
        setAttempts(attemptsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get the best score for a test from attempts
  const getBestScore = (testId) => {
    const testAttempts = attempts.filter(a => (a.test?._id || a.test) === testId);
    if (testAttempts.length === 0) return null;
    return Math.max(...testAttempts.map(a => a.score));
  };

  const getAttemptCount = (testId) => {
    return attempts.filter(a => (a.test?._id || a.test) === testId).length;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  // Subject color mapping
  const subjectColors = {
    Physics: { bg: '#eef3ff', color: '#1a3c8f', border: '#b8ccf0' },
    Chemistry: { bg: '#fff8e1', color: '#b8860b', border: '#f0d77a' },
    Biology: { bg: '#e8f5e9', color: '#1a7a3c', border: '#a5d6a7' },
    Botany: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Zoology: { bg: '#fce4ec', color: '#c62828', border: '#ef9a9a' },
  };

  const getSubjectStyle = (subject) =>
    subjectColors[subject] || { bg: '#f0f0f0', color: '#555', border: '#ccc' };

  return (
    <div className="sd-page">
      {/* ── NTA-style header ── */}
      <header className="sd-header">
        <div className="sd-header-inner">
          <div className="sd-header-left">
            <div className="sd-emblem">
              <span className="sd-emblem-text">NTA</span>
            </div>
            <div className="sd-header-titles">
              <h1 className="sd-portal-title">NEET CBT Practice Portal</h1>
              <p className="sd-portal-sub">National Eligibility cum Entrance Test — Computer Based Test</p>
            </div>
          </div>
          <div className="sd-header-right">
            <div className="sd-user-badge">
              <div className="sd-user-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'S'}</div>
              <div className="sd-user-info">
                <span className="sd-user-name">{user?.name || 'Student'}</span>
                <span className="sd-user-email">{user?.email || ''}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Navigation bar ── */}
      <nav className="sd-nav">
        <div className="sd-nav-inner">
          <div className="sd-nav-links">
            <button className="sd-nav-link sd-nav-active" onClick={() => {}}>
              📋 Available Tests
            </button>
            <button className="sd-nav-link" onClick={() => document.getElementById('sd-attempts-section')?.scrollIntoView({ behavior: 'smooth' })}>
              📊 My Attempts
            </button>
          </div>
          <button className="sd-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Welcome Banner ── */}
      <div className="sd-welcome-banner">
        <div className="sd-welcome-inner">
          <div className="sd-welcome-text">
            <h2>Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋</h2>
            <p>Practice with real NTA-pattern mock tests and track your progress.</p>
          </div>
          <div className="sd-stats-row">
            <div className="sd-stat-pill">
              <span className="sd-stat-value">{tests.length}</span>
              <span className="sd-stat-label">Tests Available</span>
            </div>
            <div className="sd-stat-pill">
              <span className="sd-stat-value">{attempts.length}</span>
              <span className="sd-stat-label">Attempts Made</span>
            </div>
            <div className="sd-stat-pill">
              <span className="sd-stat-value">
                {attempts.length > 0
                  ? Math.round(attempts.reduce((sum, a) => sum + (a.correctCount || 0), 0) /
                      Math.max(attempts.reduce((sum, a) => sum + (a.correctCount || 0) + (a.wrongCount || 0), 0), 1) * 100)
                  : 0}%
              </span>
              <span className="sd-stat-label">Avg Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="sd-main">
        <div className="sd-content">

          {/* ── Available Tests ── */}
          <section className="sd-section">
            <div className="sd-section-header">
              <h2 className="sd-section-title">📝 Available Mock Tests</h2>
              <span className="sd-section-count">{tests.length} tests</span>
            </div>

            {loading && (
              <div className="sd-loading">
                <div className="sd-spinner"></div>
                <p>Loading tests...</p>
              </div>
            )}

            {!loading && tests.length === 0 && (
              <div className="sd-empty-state">
                <span className="sd-empty-icon">📭</span>
                <h3>No Tests Available Yet</h3>
                <p>Check back later — new mock tests are being added regularly.</p>
              </div>
            )}

            <div className="sd-test-grid">
              {tests.map(t => {
                const bestScore = getBestScore(t._id);
                const attemptCount = getAttemptCount(t._id);
                const maxScore = t.questionCount * t.marksCorrect;
                return (
                  <div key={t._id} className="sd-test-card">
                    <div className="sd-card-top">
                      <div className="sd-card-exam-tag">{t.examName}</div>
                      {attemptCount > 0 && (
                        <div className="sd-card-attempted-badge">
                          ✓ Attempted ({attemptCount})
                        </div>
                      )}
                    </div>

                    <h3 className="sd-card-title">{t.title}</h3>

                    <div className="sd-card-subjects">
                      {t.subjects.map(s => {
                        const style = getSubjectStyle(s);
                        return (
                          <span key={s} className="sd-subject-pill"
                            style={{ background: style.bg, color: style.color, borderColor: style.border }}>
                            {s}
                          </span>
                        );
                      })}
                    </div>

                    <div className="sd-card-info-grid">
                      <div className="sd-card-info-item">
                        <span className="sd-info-icon">❓</span>
                        <div>
                          <span className="sd-info-value">{t.questionCount}</span>
                          <span className="sd-info-label">Questions</span>
                        </div>
                      </div>
                      <div className="sd-card-info-item">
                        <span className="sd-info-icon">⏱</span>
                        <div>
                          <span className="sd-info-value">{t.durationMinutes}</span>
                          <span className="sd-info-label">Minutes</span>
                        </div>
                      </div>
                      <div className="sd-card-info-item">
                        <span className="sd-info-icon">📊</span>
                        <div>
                          <span className="sd-info-value">{maxScore}</span>
                          <span className="sd-info-label">Max Marks</span>
                        </div>
                      </div>
                    </div>

                    <div className="sd-card-marking">
                      <span className="sd-marking-correct">+{t.marksCorrect} correct</span>
                      <span className="sd-marking-wrong">{t.marksWrong} wrong</span>
                    </div>

                    {bestScore !== null && (
                      <div className="sd-card-best-score">
                        <span>Best Score</span>
                        <strong>{bestScore} / {maxScore}</strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                      <button className="sd-start-btn" onClick={() => navigate(`/test/${t._id}/instructions`)}>
                        {attemptCount > 0 ? 'Re-take Test →' : 'Start Test →'}
                      </button>
                      {(() => {
                        const latestAttempt = attempts.find(a => (a.test?._id || a.test) === t._id);
                        if (latestAttempt) {
                          return (
                            <button
                              className="sd-start-btn"
                              style={{ background: 'linear-gradient(135deg, #1a3c8f, #2450b0)', padding: '8px', fontSize: 13 }}
                              onClick={() => navigate(`/result/${latestAttempt._id}`)}
                            >
                              📊 View Result &amp; Analysis
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Past Attempts ── */}
          <section className="sd-section" id="sd-attempts-section">
            <div className="sd-section-header">
              <h2 className="sd-section-title">📊 My Past Attempts</h2>
              <span className="sd-section-count">{attempts.length} attempts</span>
            </div>

            {!loading && attempts.length === 0 && (
              <div className="sd-empty-state">
                <span className="sd-empty-icon">📝</span>
                <h3>No Attempts Yet</h3>
                <p>Take a test above to see your results here.</p>
              </div>
            )}

            {attempts.length > 0 && (
              <div className="sd-attempts-table-wrap">
                <table className="sd-attempts-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Test</th>
                      <th>Date</th>
                      <th>Score</th>
                      <th>Correct</th>
                      <th>Wrong</th>
                      <th>Unattempted</th>
                      <th>Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a, idx) => (
                      <tr key={a._id}>
                        <td>{idx + 1}</td>
                        <td className="sd-attempt-test-name">{a.test?.title || 'Test'}</td>
                        <td>{formatDate(a.submittedAt)}</td>
                        <td>
                          <strong className="sd-score-value">{a.score}</strong>
                        </td>
                        <td><span className="sd-correct-badge">{a.correctCount}</span></td>
                        <td><span className="sd-wrong-badge">{a.wrongCount}</span></td>
                        <td><span className="sd-unattempted-badge">{a.unattemptedCount}</span></td>
                        <td>{formatTime(a.totalTimeTaken || 0)}</td>
                        <td>
                          <button className="sd-view-btn" onClick={() => navigate(`/result/${a._id}`)}>
                            View Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="sd-footer">
        <p>© 2026 NEET CBT Practice Portal | Not the official NTA website</p>
      </footer>
    </div>
  );
}
