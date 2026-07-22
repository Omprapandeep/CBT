import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import QuestionImage from '../components/QuestionImage';

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get(`/results/${attemptId}`).then(({ data }) => setResult(data));
  }, [attemptId]);

  const handleGoToDashboard = () => {
    window.scrollTo(0, 0);
    navigate('/dashboard', { replace: true });
  };

  if (!result) return <div className="container">Loading analysis...</div>;

  const timeStr = `${Math.floor(result.totalTimeTaken / 60)}m ${result.totalTimeTaken % 60}s`;

  return (
    <div className="container" style={{ maxWidth: 1100, paddingBottom: 40 }}>

      {/* ── Top Header with Back to Dashboard Button ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12, borderBottom: '2px solid #e2e8f0', paddingBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, color: '#1a3c8f' }}>{result.testTitle} — Result &amp; Analysis</h2>
          <p style={{ color: '#64748b', marginTop: 4, marginBottom: 0, fontSize: 14 }}>Candidate: <strong>{result.userName}</strong> • {result.examName}</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ background: '#1a3c8f', borderColor: '#1a3c8f', padding: '10px 20px', fontSize: 14, fontWeight: 700, borderRadius: 6 }}
          onClick={handleGoToDashboard}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* ── Overall Summary ── */}
      <div className="result-summary">
        <div className="stat-box"><div className="value">{result.score} / {result.maxScore}</div><div className="label">Score</div></div>
        <div className="stat-box"><div className="value">{result.correctCount}</div><div className="label">Correct</div></div>
        <div className="stat-box"><div className="value">{result.wrongCount}</div><div className="label">Wrong</div></div>
        <div className="stat-box"><div className="value">{result.unattemptedCount}</div><div className="label">Unattempted</div></div>
        <div className="stat-box"><div className="value">{result.accuracy}%</div><div className="label">Accuracy</div></div>
        <div className="stat-box"><div className="value">{timeStr}</div><div className="label">Time Taken</div></div>
        <div className="stat-box"><div className="value">{result.rank} / {result.totalCandidates}</div><div className="label">Rank</div></div>
        <div className="stat-box"><div className="value">{result.percentile}%</div><div className="label">Percentile</div></div>
      </div>

      <h3>Subject-wise Performance &amp; Analytics</h3>

      {/* Visual Subject Analytics Cards */}
      <div className="res-subject-analytics">
        {Object.entries(result.subjectStats).map(([subject, s]) => {
          const attempted = s.correct + s.wrong;
          const accuracy = attempted > 0 ? Math.round((s.correct / attempted) * 100) : 0;
          const correctPct = (s.correct / s.total) * 100;
          const wrongPct = (s.wrong / s.total) * 100;
          const unattemptedPct = (s.unattempted / s.total) * 100;

          return (
            <div key={subject} className="res-sub-card">
              <div className="res-sub-card-header">
                <div>
                  <h4 className="res-sub-name">{subject}</h4>
                  <span className="res-sub-score-pill">Score: {s.score}</span>
                </div>
                <div className="res-sub-acc-badge" style={{
                  background: accuracy >= 75 ? '#e6f6e8' : accuracy >= 50 ? '#fff8e1' : '#fbe6e6',
                  color: accuracy >= 75 ? '#1a7a3c' : accuracy >= 50 ? '#b8860b' : '#c0392b',
                }}>
                  {accuracy}% Accuracy
                </div>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="res-bar-track">
                <div className="res-bar-seg res-bar-correct" style={{ width: `${correctPct}%` }} title={`Correct: ${s.correct}`} />
                <div className="res-bar-seg res-bar-wrong" style={{ width: `${wrongPct}%` }} title={`Wrong: ${s.wrong}`} />
                <div className="res-bar-seg res-bar-unatt" style={{ width: `${unattemptedPct}%` }} title={`Unattempted: ${s.unattempted}`} />
              </div>

              {/* Stats Footer */}
              <div className="res-sub-stats-grid">
                <span className="res-sub-stat res-stat-c">✓ {s.correct} Correct</span>
                <span className="res-sub-stat res-stat-w">✗ {s.wrong} Wrong</span>
                <span className="res-sub-stat res-stat-u">⚪ {s.unattempted} Left</span>
              </div>
            </div>
          );
        })}
      </div>

      <table className="subject-table">
        <thead>
          <tr><th>Subject</th><th>Total</th><th>Correct</th><th>Wrong</th><th>Unattempted</th><th>Score</th></tr>
        </thead>
        <tbody>
          {Object.entries(result.subjectStats).map(([subject, s]) => (
            <tr key={subject}>
              <td><strong>{subject}</strong></td><td>{s.total}</td><td>{s.correct}</td><td>{s.wrong}</td><td>{s.unattempted}</td><td><strong>{s.score}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{ marginTop: 28 }}>Question-wise Review</h3>
      {result.review.map((r, idx) => {
        const cls = !r.isAttempted ? 'unattempted' : r.isCorrect ? 'correct' : 'wrong';
        const tagCls = !r.isAttempted ? 'tag-unattempted' : r.isCorrect ? 'tag-correct' : 'tag-wrong';
        const tagText = !r.isAttempted ? 'Unattempted' : r.isCorrect ? 'Correct' : 'Wrong';
        return (
          <div key={r.questionId} className={`review-item ${cls}`}>
            <strong>Q{idx + 1}. [{r.subject}]</strong> {r.questionText}
            <span className={`tag ${tagCls}`}>{tagText}</span>

            {/* Question stem image */}
            {r.questionImageUrl && (
              <QuestionImage
                src={r.questionImageUrl}
                alt={`Q${idx + 1} diagram`}
                maxHeight="280px"
                className="cbt-q-image-wrap"
              />
            )}

            <div style={{ marginTop: 10 }}>
              {r.options.map((opt, oi) => {
                let cls2 = '';
                if (oi === r.correctOption) cls2 = 'opt-correct';
                else if (oi === r.selectedOption) cls2 = 'opt-wrong-selected';
                return (
                  <div key={oi} className={`review-option ${cls2}`}>
                    ({String.fromCharCode(65 + oi)}) {opt}
                    {oi === r.correctOption ? ' ✓ Correct Answer' : ''}
                    {oi === r.selectedOption && oi !== r.correctOption ? ' (Your Answer)' : ''}
                  </div>
                );
              })}
            </div>
            {r.explanation && (
              <div className="explanation-box"><strong>Explanation:</strong> {r.explanation}</div>
            )}
          </div>
        );
      })}

      {/* ── Bottom Back to Dashboard Button ── */}
      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          style={{ background: '#1a3c8f', borderColor: '#1a3c8f', padding: '12px 28px', fontSize: 15, fontWeight: 700, borderRadius: 6 }}
          onClick={handleGoToDashboard}
        >
          ← Back to Dashboard
        </button>
      </div>

    </div>
  );
}
